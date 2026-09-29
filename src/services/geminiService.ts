import { GoogleGenAI, Type } from "@google/genai";
import { Question, Subject } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const syllabusParsingAgent = async (pdfBase64: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: pdfBase64,
              mimeType: "application/pdf"
            }
          },
          {
            text: "Extract the university name, semester, and a list of subjects with their major topics from this syllabus. Format accurately."
          }
        ]
      }
    ],
    config: {
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
              }
            }
          }
        },
        required: ["universityName", "subjects"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const questionArchitectAgent = async (
  subject: string,
  topics: string[],
  pattern: string = "Standard University Pattern",
  questionType: 'short' | 'long' | 'numerical' | 'diagram'
) => {
  const prompt = `Generate a set of 10 ${questionType} questions for the subject '${subject}' covering these topics: ${topics.join(", ")}. 
  Pattern: ${pattern}. 
  CRITICAL: 
  1. If the type is 'long', each question MUST be worth exactly 7 marks.
  2. Include actual Mathematical Equations, Numericals, and Derivation prompts.
  3. Mimic high-difficulty Previous Year Questions (PYQs).
  4. For 'diagram' questions, describe a diagram that should be analyzed or drawn.
  5. Include model answers and mandatory keywords for grading.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
            diagramDescription: { type: Type.STRING, description: "Only for diagram type" }
          },
          required: ["text", "marks", "modelAnswer", "keywords"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const evaluatorAgent = async (
  question: string,
  modelAnswer: string,
  userAnswer: string,
  keywords: string[]
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Evaluate the user's answer for the question: "${question}".
    Model Answer: "${modelAnswer}".
    Keywords to look for: ${keywords.join(", ")}.
    User Answer: "${userAnswer}".
    Provide a score (out of 10) and constructive feedback pointing out missing keywords or conceptual gaps.`,
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
  return JSON.parse(response.text || "{}");
};

export const questionBankAgent = async (
  subject: string,
  topic: string,
  count: number = 20
) => {
  const prompt = `Generate an intensive high-volume question bank for the subject '${subject}' specifically for the unit: '${topic}'. 
  Format: ONLY generate "Long Answer" subjective questions.
  Marks: Each question MUST be worth exactly 7 marks.
  Styles: 
  1. Include actual Mathematical Equations and Derivations (using standard notation).
  2. Mimic Previous Year Questions (PYQ) patterns from top universities.
  3. Include "Numerical Problem" types with specific values.
  4. Include "Diagrammatic Analysis" prompts.
  5. Ensure every question is a distinct, high-quality challenge.
  
  CRITICAL FOR DIVERSITY:
  - DO NOT use repetitive sentence structures like "Explore the relationship between...".
  - DO NOT append incrementing numbers to question texts.
  - Vary the verbs: Use "Derive", "Explain", "Analyze", "Compare", "Illustrate", "Evaluate", "Calculate".
  - Each question should focus on a DIFFERENT sub-topic or specific case within the unit.
  
  Quantity: Generate exactly ${count} unique and diverse questions.
  Output: Provide model answers and key terms for each.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
  return JSON.parse(response.text || "[]");
};

export const performanceAnalystAgent = async (
  sessionData: {
    question: string;
    score: number;
    feedback: string;
    type: string;
  }[]
) => {
  const prompt = `Analyze the student's performance in this practice session: ${JSON.stringify(sessionData)}.
  Provide a high-level summary of strengths and weaknesses.
  Also provide 3 specific actionable study tips.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
  return JSON.parse(response.text || "{}");
};

export const chatDoubtsAgent = async (
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  userMessage: string,
  context?: string
) => {
  const model = "gemini-3.1-pro-preview";
  const systemInstruction = `You are ExamArchitect AI, a specialized tutor for university students. 
  Your primary goal is to help students solve academic doubts, explain complex concepts, and provide derivations or equations when requested.
  Context provided: ${context || "No specific curriculum context available yet."}
  
  Guidelines:
  1. Be technical yet clear.
  2. Use Markdown for formatting (bolding, lists, etc.).
  3. Use LaTeX/standard math notation for equations.
  4. If asked to solve a numerical, show step-by-step logic.
  5. Keep responses concise but thorough.`;

  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction,
    },
    history: history
  });

  const response = await chat.sendMessage({ message: userMessage });
  return response.text;
};
