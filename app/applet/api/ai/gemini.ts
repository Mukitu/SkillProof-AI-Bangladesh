import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key not configured on Vercel" });
    }

    const genAI = new GoogleGenAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model || "gemini-1.5-flash" });
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    
    res.status(200).json({ text: response.text() });
  } catch (error: any) {
    console.error("Gemini Vercel Error:", error);
    res.status(500).json({ error: error.message });
  }
}
