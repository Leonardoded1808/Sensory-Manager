import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini SDK
  let ai: GoogleGenAI;
  try {
    const resolvedApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    ai = new GoogleGenAI({ apiKey: resolvedApiKey });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }

  // API route for Gemini
  app.post("/api/gemini", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key not configured on server" });
      }

      const { prompt, parts, model } = req.body;
      const response = await ai.models.generateContent({
        model: model || 'gemini-2.5-flash',
        contents: parts ? { parts } : prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      const is503 = error?.status === 503 || error?.code === 503 || error?.message?.includes('503');
      res.status(is503 ? 503 : 500).json({ error: error.message || "Unknown error occurred" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
