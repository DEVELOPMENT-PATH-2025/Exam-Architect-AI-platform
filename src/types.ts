/**
 * ExamArchitect AI - Data Structures & Patterns
 */

export interface Question {
  id: string;
  type: 'short' | 'long' | 'numerical' | 'diagram';
  text: string;
  marks: number;
  modelAnswer: string;
  keywords: string[];
  diagramDescription?: string;
  subjectId: string;
}

export interface Subject {
  name: string;
  code: string;
  topics: string[];
}

export interface Curriculum {
  id: string;
  userId: string;
  universityName: string;
  semester: string;
  subjects: Subject[];
  createdAt: number;
}

export interface PracticeSession {
  id: string;
  userId: string;
  subjectId: string;
  answers: {
    questionId: string;
    userAnswer: string;
    score: number;
    feedback: string;
  }[];
  completed: boolean;
  createdAt: number;
}
