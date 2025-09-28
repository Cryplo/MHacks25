import os
import pty
import asyncio
import fcntl
import signal
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from google import genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import secrets
import hmac
import hashlib
import json

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# Allow requests from your frontend (e.g., localhost or Electron)
origins = [
    "http://localhost:5173",     # React dev server
    "http://127.0.0.1:5173",
    "http://localhost",          # General
    "http://127.0.0.1",
    "http://your-electron-app",  # If Electron uses a custom origin
    "capacitor://localhost",     # For Capacitor apps
    "http://localhost:8080",     # Vite dev server
    # You can use "*" to allow all origins, but avoid in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],    # Allow all HTTP methods
    allow_headers=["*"],    # Allow all headers
)
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = genai.Client(api_key="AIzaSyC9hDw9JrhmGgBVBHZOKzwAdk2VLE6H8J4")


# In-memory store for issued challenges
challenges = {}

# Shared user credentials (plaintext keys)
USERS = {
    "admin": "mysecretkey123",  # <-- plain text!
}

class ChallengeRequest(BaseModel):
    username: str

class ChallengeResponse(BaseModel):
    username: str
    challenge: str
    response: str  # hex string of HMAC

@app.post("/auth/challenge")
def issue_challenge(data: ChallengeRequest):
    if data.username not in USERS:
        raise HTTPException(status_code=403, detail="Invalid username")

    nonce = secrets.token_hex(16)
    challenges[data.username] = nonce
    return {"challenge": nonce}

@app.post("/auth/verify")
def verify_response(data: ChallengeResponse):
    key = USERS.get(data.username)
    expected_challenge = challenges.get(data.username)

    if not key or not expected_challenge:
        raise HTTPException(status_code=403, detail="Invalid or missing challenge")

    if data.challenge != expected_challenge:
        raise HTTPException(status_code=403, detail="Challenge mismatch")

    # Clean up used challenge
    del challenges[data.username]

    # Calculate expected HMAC
    expected_hmac = hmac.new(key.encode(), data.challenge.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hmac, data.response):
        raise HTTPException(status_code=403, detail="Invalid HMAC response")

    return {"status": "ok"}

async def get_optimized_command(input: str) -> str:
    """Sends a command to Gemini and returns the optimized version."""

    # The prompt is crucial for getting clean, executable output
    prompt = f"""
    Translate the following description into a shell command. OUTPUT ONLY PLAIN TEXT, OUTPUT ONLY PLAIN TEXT, DO NOT HAVE ANY FORMATTING, DO NOT HAVE ANY FORMATTING:\n
    "{input}"
    """

    try:
        # Run the synchronous SDK call in a thread pool to avoid blocking asyncio
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model="gemini-2.5-flash", contents=prompt
            )
        )
        optimized_command = response.text.strip()

        # A simple check to ensure we got something reasonable back
        if not optimized_command:
            return input

        return optimized_command
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
        return input # Fallback to original command on error

COMMON_COMMAND_TOKENS = {
    # File & Directory
    "ls", "dir", "cd", "pwd", "mkdir", "rm", "cp", "mv", "touch",

    # Process & System
    "ps", "tasklist", "kill", "taskkill", "top", "htop",
    "whoami", "hostname", "shutdown", "reboot",

    # Networking
    "ping", "ifconfig", "ipconfig", "netstat", "curl", "wget",

    # Disk & File Info
    "df", "du", "stat", "find",

    # Archive & Compression
    "tar", "unzip", "gzip",

    # Package & Python
    "pip", "python", "virtualenv", "source",

    # Windows-specific
    "cls", "choco",

    # macOS-specific
    "open", "say",
}

def is_common_system_command(user_input: str) -> bool:
    first_token = user_input.strip().split()[0]
    return first_token in COMMON_COMMAND_TOKENS

def is_local_executable(command: str) -> bool:
    return command.strip().startswith("./")


@app.websocket("/ws/{session_id}")
async def terminal_session(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info(f"Accepted connection for session: {session_id}")

    pid, master_fd = pty.fork()

    if pid == 0:
        os.execvp("env", [
            "env", "-i",
            f"HOME={os.path.expanduser('~')}",
            "PATH=/usr/bin:/bin",
            "PS1=\\w \\$ ",
            "bash", "--noprofile", "--norc"
        ])

    fl = fcntl.fcntl(master_fd, fcntl.F_GETFL)
    fcntl.fcntl(master_fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

    os.write(master_fd, b"cd ~\n")
    os.write(master_fd, b"PROMPT_COMMAND='printf \"\\n__CMD_DONE__:%s\\n\" $?'\n")

    loop = asyncio.get_running_loop()

    async def pty_to_websocket():
        buffer = ""
        while True:
            try:
                await asyncio.sleep(0.01)
                data = os.read(master_fd, 1024)
                if not data:
                    break

                text = data.decode(errors="ignore")
                buffer += text

                if "__CMD_DONE__:" in buffer:
                    parts = buffer.split("__CMD_DONE__:")
                    before, rest = parts[0], parts[1]
                    cmd = before.split("\r\n")[0]
                    output = "".join(before.split("\r\n")[1:])
                    status_line, remainder = rest.split("\n", 1)
                    exit_code = status_line.strip()
                    cwd = remainder.split(" ")[0] if " " in remainder else ""
                    buffer = ""

                    await websocket.send_json({
                        "cmd": cmd,
                        "output": output,
                        "exit_code": exit_code,
                        "cwd": cwd
                    })
            except BlockingIOError:
                continue
            except Exception as e:
                logger.error(f"Session '{session_id}' PTY Error: {e}")
                break

        await websocket.close()

    async def websocket_to_pty():
        try:
            while True:
                raw_input = await websocket.receive_text()

                try:
                    data = json.loads(raw_input)
                    username = data.get("username")
                    command = data.get("command")
                    signature = data.get("signature")

                    if not username or not command or not signature:
                        await websocket.send_text("403: Invalid request format")
                        await websocket.close()
                        return

                    key = USERS.get(username)
                    if not key:
                        await websocket.send_text("403: Unknown user")
                        await websocket.close()
                        return

                    expected_hmac = hmac.new(key.encode(), command.encode(), hashlib.sha256).hexdigest()

                    if not hmac.compare_digest(expected_hmac, signature):
                        await websocket.send_text("403: Invalid signature")
                        await websocket.close()
                        return

                    # Passed auth: run the command
                    if is_common_system_command(command) or is_local_executable(command): 
                        os.write(master_fd, (command + '\n').encode())
                    else:
                        optimized_command = await get_optimized_command(command)
                        os.write(master_fd, (optimized_command + '\n').encode())

                except json.JSONDecodeError:
                    await websocket.send_text("403: Invalid JSON")
                    await websocket.close()
                    return
                except Exception as e:
                    logger.error(f"WebSocket verification error: {e}")
                    await websocket.send_text("403: Internal error")
                    await websocket.close()
                    return

        except WebSocketDisconnect:
            logger.info(f"Session '{session_id}' disconnected.")
        except Exception as e:
            logger.error(f"Session '{session_id}' WS Error: {e}")

    task1 = loop.create_task(pty_to_websocket())
    task2 = loop.create_task(websocket_to_pty())

    try:
        await asyncio.gather(task1, task2)
    finally:
        logger.info(f"Session '{session_id}': Cleaning up")
        task1.cancel()
        task2.cancel()
        try:
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, 0)
        except ProcessLookupError:
            logger.warning(f"Process {pid} already terminated.")
        os.close(master_fd)
