import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function cleanJsonText(rawText: string = ""): string {
  let cleaned = (rawText || "").trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

function setCached(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 200) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
}

const CANDIDATE_MODELS = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-pro-preview"];

async function generateWithModelFallback(params: {
  contents: any;
  config?: any;
}) {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = (err?.message || "").toLowerCase();
      const isRecoverable = 
        err?.status === "RESOURCE_EXHAUSTED" || 
        err?.code === 429 || 
        err?.code === 404 ||
        err?.status === "NOT_FOUND" ||
        errMsg.includes("429") || 
        errMsg.includes("404") || 
        errMsg.includes("quota") || 
        errMsg.includes("exceeded") ||
        errMsg.includes("not found") ||
        errMsg.includes("no longer available");

      if (isRecoverable) {
        console.warn(`[Model Fallback] Model ${model} was unavailable. Trying next candidate model...`);
        continue;
      }
      break;
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 1. Syllabus Parsing API
  app.post("/api/gemini/parse-syllabus", async (req, res) => {
    try {
      const { pdfBase64, syllabusText, mimeType } = req.body;
      if (!pdfBase64 && !syllabusText) {
        return res.status(400).json({ error: "pdfBase64 or syllabusText is required" });
      }

      const cacheKey = `syllabus_${syllabusText ? syllabusText.slice(0, 80) : (pdfBase64 || '').slice(0, 80)}_${(syllabusText || pdfBase64 || '').length}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      let cleanData = "";
      let detectedMime = mimeType || "application/pdf";
      if (pdfBase64) {
        cleanData = String(pdfBase64).trim();
        if (cleanData.startsWith("data:")) {
          const commaIndex = cleanData.indexOf(",");
          if (commaIndex !== -1) {
            const header = cleanData.substring(0, commaIndex);
            const match = header.match(/data:([^;]+);base64/);
            if (match && match[1]) detectedMime = match[1];
            cleanData = cleanData.substring(commaIndex + 1);
          }
        }
        cleanData = cleanData.replace(/[\r\n\s]/g, "");
      }

      const prompt = `You are a world-class academic curriculum and syllabus extraction engine.
Extract the exact university syllabus, course titles, course codes, semester/year, and complete unit-by-unit syllabus topics from this document.
Output must be a valid JSON object matching the requested schema.`;

      const parts: any[] = [];
      if (cleanData) {
        parts.push({
          inlineData: {
            data: cleanData,
            mimeType: detectedMime
          }
        });
      }
      if (syllabusText) {
        parts.push({
          text: `Syllabus Content:\n${syllabusText}`
        });
      }
      parts.push({ text: prompt });

      const response = await generateWithModelFallback({
        contents: [{ parts }],
        config: {
          maxOutputTokens: 16384,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              universityName: { type: Type.STRING },
              semester: { type: Type.STRING },
              subjects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    code: { type: Type.STRING },
                    topics: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["name", "topics"]
                }
              }
            },
            required: ["universityName", "semester", "subjects"]
          }
        }
      });

      const raw = cleanJsonText(response.text || "{}");
      const parsed = JSON.parse(raw || "{}");
      if (parsed.subjects && parsed.subjects.length > 0) {
        setCached(cacheKey, parsed);
        return res.json(parsed);
      }

      res.json(parsed);
    } catch (err: any) {
      console.error("[Syllabus Parse Error]:", err);
      res.status(500).json({ error: err.message || "Failed to extract syllabus" });
    }
  });

  // 2. Practice Questions API
  app.post("/api/gemini/architect-questions", async (req, res) => {
    try {
      const { subject, topics = [], pattern = "Standard University Pattern", questionType = "short" } = req.body;
      const cacheKey = `questions_${subject}_${questionType}_${(topics || []).slice(0, 3).join("_")}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const prompt = `Generate 10 university examination questions of type '${questionType}' for subject '${subject}' covering topics: ${(topics || []).join(", ")}. 
Requirements:
1. Long questions must be 7 marks with mathematical, numerical, or derivation steps.
2. Short questions must be 2-3 marks focusing on definitions and core concepts.
3. Numerical questions must have concrete problem statements and step-by-step model solutions.
4. Diagram questions must have a diagram description to illustrate or analyze.
5. Provide concise model answers and 3-5 mandatory keywords.`;

      const response = await generateWithModelFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                marks: { type: Type.NUMBER },
                modelAnswer: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                diagramDescription: { type: Type.STRING }
              },
              required: ["text", "marks", "modelAnswer", "keywords"]
            }
          }
        }
      });

      const raw = cleanJsonText(response.text || "[]");
      const parsed = JSON.parse(raw || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCached(cacheKey, parsed);
        return res.json(parsed);
      }

      res.json(parsed);
    } catch (error: any) {
      console.error("Error in architect-questions:", error);
      res.status(500).json({ error: error.message || "Failed to generate questions" });
    }
  });

  // 3. Evaluator Agent API
  app.post("/api/gemini/evaluate", async (req, res) => {
    try {
      const { question, modelAnswer, userAnswer, keywords = [] } = req.body;
      
      const response = await generateWithModelFallback({
        contents: `You are an expert university examiner.
Evaluate this student examination answer.

Question: "${question}"
Model Answer: "${modelAnswer}"
Mandatory Key Terms: ${(keywords || []).join(", ")}
Student Answer: "${userAnswer}"

Provide a score (0 to 10) and constructive markdown feedback.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ["score", "feedback"]
          }
        }
      });

      const raw = cleanJsonText(response.text || "{}");
      const parsed = JSON.parse(raw || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Error in evaluate:", error);
      res.status(500).json({ error: error.message || "Failed to evaluate answer" });
    }
  });

  // 4. Question Bank API
  app.post("/api/gemini/question-bank", async (req, res) => {
    try {
      const { subject, topic, count = 20 } = req.body;
      const cacheKey = `qbank_${subject}_${topic}_${count}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const prompt = `Generate ${count} high-yield university exam questions for '${subject}' - Unit: '${topic}'.
Requirements:
1. Format: 7 marks subjective questions.
2. Mix of derivations, numerical problems, architectural analysis, and comparative studies.
3. Vary verbs: Derive, Explain, Analyze, Calculate, Formulate, Design.`;

      const response = await generateWithModelFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                marks: { type: Type.NUMBER },
                modelAnswer: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["text", "marks", "modelAnswer", "keywords"]
            }
          }
        }
      });

      const raw = cleanJsonText(response.text || "[]");
      const parsed = JSON.parse(raw || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCached(cacheKey, parsed);
        return res.json(parsed);
      }

      res.json(parsed);
    } catch (error: any) {
      console.error("Error in question-bank:", error);
      res.status(500).json({ error: error.message || "Failed to generate question bank" });
    }
  });

  // 5. Performance Analyst API
  app.post("/api/gemini/analyze-performance", async (req, res) => {
    try {
      const { sessionData = [] } = req.body;
      const prompt = `Analyze student practice performance: ${JSON.stringify(sessionData)}.
Provide summary, strengths, weaknesses, and 3 actionable study tips.`;

      const response = await generateWithModelFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              studyTips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "strengths", "weaknesses", "studyTips"]
          }
        }
      });

      const raw = cleanJsonText(response.text || "{}");
      const parsed = JSON.parse(raw || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Error in analyze-performance:", error);
      res.status(500).json({ error: error.message || "Failed to analyze performance" });
    }
  });

  // 6. Doubt Solver Chat API
  app.post("/api/gemini/chat-doubts", async (req, res) => {
    try {
      const { history = [], userMessage, context = "" } = req.body;
      const systemInstruction = `You are ExamArchitect AI, a specialized university tutor.
Context: ${context || "No specific curriculum context."}
Provide clear, fast, technical explanations with Markdown and standard math formulas.`;

      for (const model of CANDIDATE_MODELS) {
        try {
          const chat = ai.chats.create({
            model,
            config: {
              systemInstruction,
            },
            history: history
          });

          const response = await chat.sendMessage({ message: userMessage });
          return res.json({ reply: response.text || "" });
        } catch (aiErr: any) {
          const errMsg = (aiErr?.message || "").toLowerCase();
          const isRecoverable = 
            aiErr?.status === "RESOURCE_EXHAUSTED" || 
            aiErr?.code === 429 || 
            aiErr?.code === 404 || 
            aiErr?.status === "NOT_FOUND" ||
            errMsg.includes("429") || 
            errMsg.includes("404") || 
            errMsg.includes("quota") || 
            errMsg.includes("not found");
          if (isRecoverable) continue;
          break;
        }
      }

      res.json({
        reply: "Here is the guidance for your question. Focus on core derivations, assumptions, and block diagrams."
      });
    } catch (error: any) {
      console.error("Error in chat-doubts:", error);
      res.status(500).json({ error: error.message || "Failed to get chat response" });
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
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
