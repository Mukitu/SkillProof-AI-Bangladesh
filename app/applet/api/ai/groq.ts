import Groq from 'groq-sdk';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model, temperature, max_tokens } = req.body;
    const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Groq API key not configured on Vercel" });
    }

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: model || "llama-3.3-70b-versatile",
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 1024,
    });

    res.status(200).json(completion);
  } catch (error: any) {
    console.error("Groq Vercel Error:", error);
    res.status(500).json({ error: error.message });
  }
}
