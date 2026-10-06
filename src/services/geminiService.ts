import { Question, Subject } from "../types";

export const syllabusParsingAgent = async (pdfBase64: string, fileName?: string) => {
  const response = await fetch("/api/gemini/parse-syllabus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdfBase64, fileName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Syllabus parsing failed: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result || !result.subjects || result.subjects.length === 0) {
    throw new Error("No subjects could be detected in this syllabus.");
  }
  return result;
};

export const questionArchitectAgent = async (
  subject: string,
  topics: string[],
  pattern: string = "Standard University Pattern",
  questionType: 'short' | 'long' | 'numerical' | 'diagram'
) => {
  const response = await fetch("/api/gemini/architect-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject,
      topics,
      pattern,
      questionType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Question architecting failed: ${response.statusText}`);
  }

  return await response.json();
};

export const evaluatorAgent = async (
  question: string,
  modelAnswer: string,
  userAnswer: string,
  keywords: string[]
) => {
  const response = await fetch("/api/gemini/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      modelAnswer,
      userAnswer,
      keywords,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Evaluation failed: ${response.statusText}`);
  }

  return await response.json();
};

export const predictAiContentAgent = async (text: string, question: string = "") => {
  const response = await fetch("/api/gemini/predict-ai-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, question }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI prediction failed: ${response.statusText}`);
  }

  return await response.json();
};

export const questionBankAgent = async (
  subject: string,
  topic: string,
  count: number = 20
) => {
  const response = await fetch("/api/gemini/question-bank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject,
      topic,
      count,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Question bank generation failed: ${response.statusText}`);
  }

  return await response.json();
};

export const performanceAnalystAgent = async (
  sessionData: {
    question: string;
    score: number;
    feedback: string;
    type: string;
  }[]
) => {
  const response = await fetch("/api/gemini/analyze-performance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionData }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Performance analysis failed: ${response.statusText}`);
  }

  return await response.json();
};

export const chatDoubtsAgent = async (
  history: { role: string; parts: { text: string }[] }[],
  userMessage: string,
  context?: string
) => {
  const response = await fetch("/api/gemini/chat-doubts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      history,
      userMessage,
      context,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat doubts failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.reply;
};
