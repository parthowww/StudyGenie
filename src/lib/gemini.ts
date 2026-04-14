import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function generateStudyNotes(text: string, isEli5: boolean = false) {
  if (!apiKey) throw new Error("API Key missing");

  const systemInstruction = isEli5 
    ? "You are a helpful tutor who explains complex topics to a 5-year-old. Summarize the provided text into simple, easy-to-understand bullet points. Use analogies and simple language. Format the output with a clear title and bullet points."
    : "You are an expert academic assistant. Summarize the provided text into concise, high-quality study notes. Use a clear structure with a title, a brief overview, and key bullet points for main concepts. Use bold text for important terms.";

  const prompt = `Please generate study notes for the following text:\n\n${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Failed to generate notes.";
  } catch (error) {
    console.error("Error generating notes:", error);
    throw error;
  }
}
