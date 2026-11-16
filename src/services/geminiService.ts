import { Question, Subject } from "../types";

export const syllabusParsingAgent = async (pdfBase64: string, fileName?: string, mimeType?: string) => {
  const response = await fetch("/api/gemini/parse-syllabus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdfBase64, fileName, mimeType }),
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

const questionMemoryCache = new Map<string, any[]>();
const inFlightQuestionRequests = new Map<string, Promise<any[]>>();

const buildQuestionCacheKey = (subject: string, questionType: string, topics: string[] = []) => {
  const cleanSub = (subject || "core").trim().toLowerCase();
  const topHash = (topics || []).slice(0, 2).join("_").toLowerCase().slice(0, 48);
  return `examarch_q_v3_${cleanSub}_${questionType}_${topHash}`;
};

export const getCachedQuestions = (
  subject: string,
  questionType: 'short' | 'long' | 'numerical' | 'mcq',
  topics: string[] = []
): any[] | null => {
  const key = buildQuestionCacheKey(subject, questionType, topics);
  const mem = questionMemoryCache.get(key);
  if (mem && mem.length > 0) return mem;

  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        questionMemoryCache.set(key, parsed);
        return parsed;
      }
    }
  } catch {
    // ignore storage access issues
  }
  return null;
};

export const questionArchitectAgent = async (
  subject: string,
  topics: string[],
  pattern: string = "Standard University Pattern",
  questionType: 'short' | 'long' | 'numerical' | 'mcq'
) => {
  const cached = getCachedQuestions(subject, questionType, topics);
  if (cached) return cached;

  const key = buildQuestionCacheKey(subject, questionType, topics);
  const existingFlight = inFlightQuestionRequests.get(key);
  if (existingFlight) {
    return existingFlight;
  }

  const requestPromise = (async () => {
    try {
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

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        questionMemoryCache.set(key, data);
        try {
          sessionStorage.setItem(key, JSON.stringify(data));
        } catch {
          // ignore quota exceeded
        }
      }
      return data;
    } finally {
      inFlightQuestionRequests.delete(key);
    }
  })();

  inFlightQuestionRequests.set(key, requestPromise);
  return requestPromise;
};

export const prefetchAllQuestionModules = async (
  subject: string,
  topics: string[],
  excludeType?: 'short' | 'long' | 'numerical' | 'mcq'
) => {
  const types: ('short' | 'long' | 'numerical' | 'mcq')[] = ['short', 'long', 'numerical', 'mcq'];
  const queue = types.filter((t) => t !== excludeType);
  for (const t of queue) {
    if (!getCachedQuestions(subject, t, topics)) {
      await questionArchitectAgent(subject, topics, "End Term Intensive Pattern", t).catch(() => {});
    }
  }
};

export const evaluatorAgent = async (
  question: string,
  modelAnswer: string,
  userAnswer: string,
  keywords: string[],
  marks: number = 2,
  questionType: 'short' | 'long' | 'numerical' | 'mcq' = 'short',
  handwrittenImageBase64?: string,
  handwrittenMimeType?: string
) => {
  const response = await fetch("/api/gemini/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      modelAnswer,
      userAnswer,
      keywords,
      marks,
      questionType,
      handwrittenImageBase64,
      handwrittenMimeType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Evaluation failed: ${response.statusText}`);
  }

  return await response.json();
};

export const generateMockPaperAgent = async (payload: {
  subject: string;
  code?: string;
  topics?: string[];
  universityName?: string;
  semester?: string;
}) => {
  const response = await fetch("/api/gemini/generate-mock-paper", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Mock paper generation failed: ${response.statusText}`);
  }

  return await response.json();
};

export const evaluateMockPaperAgent = async (payload: {
  subject: string;
  submissions: {
    unitLabel: string;
    choiceLabel: string;
    partId: string;
    partLabel: string;
    type: string;
    marks: number;
    question: string;
    modelAnswer: string;
    keywords: string[];
    userAnswer: string;
    handwrittenImageBase64?: string;
    handwrittenMimeType?: string;
  }[];
}) => {
  const response = await fetch("/api/gemini/evaluate-mock-paper", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Mock paper evaluation failed: ${response.statusText}`);
  }

  return await response.json();
};

export interface ProctorCheckResponse {
  shutterClosedOrBlocked?: boolean;
  personPresent: boolean;
  unauthorizedObjectOrPerson?: boolean;
  violationType?: 'none' | 'shutter_blocked' | 'person_absent' | 'unauthorized_object';
  detectedItem?: string;
  reason?: string;
  fallback?: boolean;
}

export const proctorPresenceAgent = async (
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ProctorCheckResponse> => {
  try {
    const response = await fetch("/api/gemini/proctor-presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    if (!response.ok) {
      return { personPresent: true, violationType: 'none', fallback: true };
    }
    return await response.json();
  } catch {
    return { personPresent: true, violationType: 'none', fallback: true };
  }
};

export const generateCheatSheetAgent = async (payload: {
  subject: string;
  units: { unitIndex: number; unitLabel: string; title: string }[];
}) => {
  const response = await fetch("/api/gemini/cheat-sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Cheat-sheet generation failed: ${response.statusText}`);
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
