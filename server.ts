import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from 'groq-sdk';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- AI API Proxy Routes ---

  // Groq Proxy
  app.post("/api/ai/groq", async (req, res) => {
    try {
      const { prompt, model, temperature, max_tokens } = req.body;
      const apiKey = process.env.VITE_GROQ_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Groq API key not configured on server" });
      }

      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model || "llama-3.3-70b-versatile",
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 1024,
      });

      res.json(completion);
    } catch (error: any) {
      console.error("Groq Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini Proxy
  app.post("/api/ai/gemini", async (req, res) => {
    try {
      const { prompt, model } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key not configured on server" });
      }

      const genAI = new GoogleGenAI({ apiKey });
      const geminiModel = (genAI as any).getGenerativeModel({ model: model || "gemini-1.5-flash" });
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      
      res.json({ text: response.text() });
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Static Assets & Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
