from google import genai

client = genai.Client()

def language_to_command(description):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Translate the following description into a shell command. Output only plain text, do not have any formatting:\n" + description,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0) # Disables thinking
        ),
    )
    return response

def command_to_description(command):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Explain the following shell command, in a short paragraph of plain text, for a user not familiar with shell commands:\n" + command,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0) # Disables thinking
        ),
    )
    return response