import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: "AIzaSyC9hDw9JrhmGgBVBHZOKzwAdk2VLE6H8J4"});

export async function LanguageToCommand(description: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Translate the following description into a shell command. Do not output anything except the shell command:\n" + description,
  });
  return response.text;
}

export async function LanguageToCommandPrint(description: string) {
  console.log("Request Received");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Translate the following description into a shell command. Do not output anything except the shell command:\n" + description,
  });
  console.log(response.text);
}

export async function CommandToDescription(command: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain the following shell command, in a short paragraph of plain text, for a user not familiar with shell commands:\n" + command,
  });
  return response.text;
}