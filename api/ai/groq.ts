import Groq from 'groq-sdk';

export default async function handler(req: any, res: any) {
  // Set CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model, temperature, max_tokens } = req.body;
    
    // Use any available Groq key from Vercel env
    const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("Missing Groq API Key in environment");
      return res.status(500).json({ error: "Groq API key not configured on Vercel. Please add GROQ_API_KEY to your project settings." });
    }

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: model || "llama-3.3-70b-versatile",
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 1024,
    });

    return res.status(200).json(completion);
  } catch (error: any) {
    console.error("Groq Vercel Proxy Error:", error);
    return res.status(500).json({ 
      error: "AI Proxy request failed", 
      details: error.message 
    });
  }
}
