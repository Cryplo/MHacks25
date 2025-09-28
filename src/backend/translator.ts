import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY});

export async function LanguageToCommand(description: string): Promise<string> {
    var os = ""
    switch(process.platform){
        case "darwin":
            os = " for MacOS"
            break;
        case "linux":
            os = " for Linux"
            break;
        case "win32":
            os = " for Windows"
            break;
    }
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Translate the following description into a shell command" + os + ". Output only plain text, do not have any formatting:\n" + description, 
        config: {
                thinkingConfig:{
                    thinkingBudget: 0,
                }
            }
        });
    return response.text;
}

export async function CommandToDescription(command: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain the following shell command, in a short paragraph of plain text, for a user not familiar with shell commands:\n" + command, 
    config: {
            thinkingConfig:{
                thinkingBudget: 0,
            }
        }
  });
  return response.text;
}