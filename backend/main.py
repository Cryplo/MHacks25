import os
import pty
import asyncio
import fcntl
import signal
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from google import genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = genai.Client(api_key="AIzaSyBiTEw0pvNJZrDMzURSOArmY3Cff72ZrmU")

async def get_optimized_command(input: str) -> str:
    """Sends a command to Gemini and returns the optimized version."""

    # The prompt is crucial for getting clean, executable output
    prompt = f"""
    You are an expert command-line assistant.

    Task:
    - I will give you a natural language instruction.
    - Your job is to provide the **exact CLI command** that accomplishes it.
    - **Do not** add explanations, commentary, or extra text.
    - The command should be ready to copy-paste in a terminal.

    Constraints:
    - Assume a standard Unix/Linux environment (bash shell).
    - Use standard commands unless otherwise specified.
    - If multiple commands are needed, provide them separated by "&&" or as a single script command.

    Instruction:
    "{input}"

    Output:
    """

    try:
        # Run the synchronous SDK call in a thread pool to avoid blocking asyncio
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model="gemini-2.5-flash-lite", contents=prompt
            )
        )
        optimized_command = response.text.strip()

        # A simple check to ensure we got something reasonable back
        if not optimized_command:
            return input
        if optimized_command.startswith("`") and optimized_command.endswith("`"):
            optimized_command = optimized_command[1:-1].strip()

        return optimized_command
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
        return input # Fallback to original command on error

app = FastAPI()

@app.websocket("/ws/{session_id}")
async def terminal_session(websocket: WebSocket, session_id: str):
    """
    Handles a WebSocket connection by spawning a pseudo-terminal (PTY)
    and proxying data between the client and the PTY.
    """
    await websocket.accept()
    logger.info(f"Accepted connection for session: {session_id}")

    # Fork a child process to run the shell
    pid, master_fd = pty.fork()
    logger.info(f"Session '{session_id}': Spawned a new PTY with PID: {pid}")

    if pid == 0:  # Child process
        # This code runs in the child process.
        # It replaces the child process with a bash shell.
        os.execvp("env", ["env", "-i", f"HOME={os.path.expanduser('~')}", "PATH=/usr/bin:/bin", "PS1=\\w \\$ ","bash", "--noprofile", "--norc"])

    # Parent process
    logger.info(f"Spawned a new PTY with PID: {pid}")

    # Make the master file descriptor non-blocking
    # This is crucial for async operations
    fl = fcntl.fcntl(master_fd, fcntl.F_GETFL)
    fcntl.fcntl(master_fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

    os.write(master_fd,
        b"cd ~\n"
    )

    os.write(master_fd,
        b"PROMPT_COMMAND='printf \"\\n__CMD_DONE__:%s\\n\" $?'\n"
    )

    loop = asyncio.get_running_loop()

    # --- Task 1: Read from PTY and send to WebSocket ---
    async def pty_to_websocket():
        """Reads output from the PTY and sends it to the client."""
        buffer = ""
        while True:
            try:
                # Wait until the master_fd is ready to be read
                await asyncio.sleep(0.01) # Small sleep to prevent busy-waiting
                data = os.read(master_fd, 1024)

                if not data:
                    break

                text = data.decode(errors="ignore")
                buffer += text

                if "__CMD_DONE__:" in buffer:
                    # extract status
                    parts = buffer.split("__CMD_DONE__:")
                    before, rest = parts[0], parts[1]
                    cmd = before.split("\r\n")[0]
                    output = "".join(before.split("\r\n")[1:])
                    status_line, remainder = rest.split("\n", 1)
                    exit_code = status_line.strip()
                    cwd = remainder.split(" ")[0] if " " in remainder else ""
                    # now you know the last command finished with exit_code
                    logger.info(f"Command finished with status {exit_code}")
                    buffer = ""

                    await websocket.send_json({"cmd": cmd, "output": output, "exit_code": exit_code, "cwd": cwd})
            except BlockingIOError:
                # No data to read, continue waiting
                continue
            except Exception as e:
                logger.error(f"Session '{session_id}' PTY Error: {e}")
                break
        await websocket.close()

    # --- Task 2: Read from WebSocket and send to PTY ---
    async def websocket_to_pty():
        """Reads input from the client and writes it to the PTY."""
        try:
            while True:
                input = await websocket.receive_text()
                # Optimize the command using Gemini
                optimized_command = await get_optimized_command(input)

                os.write(master_fd, (optimized_command + '\n').encode())
        except WebSocketDisconnect:
            logger.info(f"Session '{session_id}' disconnected.")
        except Exception as e:
            logger.error(f"Session '{session_id}' WS Error: {e}")

    # Run both tasks concurrently
    task1 = loop.create_task(pty_to_websocket())
    task2 = loop.create_task(websocket_to_pty())

    try:
        # Wait for either task to complete
        await asyncio.gather(task1, task2)
    finally:
        # --- Cleanup ---
        logger.info(f"Session '{session_id}': Closing PTY and terminating process {pid}.")
        task1.cancel()
        task2.cancel()
        # Kill the child process
        try:
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, 0) # Wait for the child to avoid zombies
        except ProcessLookupError:
            logger.warning(f"Process {pid} already terminated.")
        os.close(master_fd)
        logger.info(f"Session '{session_id}': Cleanup complete for PID {pid}.")
