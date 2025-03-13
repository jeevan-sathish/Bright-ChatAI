
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using the free 'gemini-1.0-pro-latest' model endpoint
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-latest:generateContent";

export type ChatMessage = {
  role: "user" | "model";
  content: string;
  timestamp: number;
};

export async function generateResponse(messages: ChatMessage[]): Promise<string> {
  try {
    // Free version uses a simpler format without conversation history
    // We'll just use the last user message for simplicity
    const userMessages = messages.filter(msg => msg.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1];

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: lastUserMessage.content }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to generate response");
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}
