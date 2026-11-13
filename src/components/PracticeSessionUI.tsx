import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  PenTool,
  Trophy,
  BarChart3,
  Sparkles,
  Check,
  AlertTriangle,
  Send,
  Target,
  Lightbulb,
  ListChecks,
  Key,
  BookOpen,
  ArrowUpRight,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  questionArchitectAgent,
  getCachedQuestions,
  prefetchAllQuestionModules,
  evaluatorAgent,
  performanceAnalystAgent
} from '../services/geminiService';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import PerformanceReport from './PerformanceReport';

type QuestionType = 'short' | 'long' | 'numerical' | 'mcq';

const getStructureGuide = (type: QuestionType, marks: number) => {
  if (type === 'long' || marks >= 7) {
    return {
      title: '7-Mark University Blueprint',
      minWords: 250,
      maxWords: 350,
      targetLabel: 'Target: 250–350 words for 7 marks',
      steps: [
        'Definition & Core Principle (1 Mark)',
        'Core Architecture / Working Steps (3 Marks)',
        'Comparison Table or Key Trade-offs (2 Marks)',
        'Concrete Real-World Example (1 Mark)'
      ]
    };
  }
  if (type === 'numerical') {
    return {
      title: '7-Mark Numerical Blueprint',
      minWords: 45,
      maxWords: 140,
      targetLabel: 'Target: 45–140 words (Given + Formula + Steps)',
      steps: [
        'List Given Data & Parameters clearly (1 Mark)',
        'State Governing Formula / Theorem (2 Marks)',
        'Show Step-by-Step Substitution & Calculation (3 Marks)',
        'Box Final Value with Exact Units (1 Mark)'
      ]
    };
  }
  if (type === 'mcq') {
    return {
      title: 'MCQ Elimination Strategy',
      minWords: 1,
      maxWords: 35,
      targetLabel: 'Target: Select 1 option + optional 1-line check',
      steps: [
        'Identify the core theorem or invariant tested',
        'Eliminate 2 clearly inconsistent distractors',
        'Double-check units, edge cases, or boundary limits'
      ]
    };
  }
  return {
    title: '2-Mark Short Answer Blueprint',
    minWords: 40,
    maxWords: 60,
    targetLabel: 'Target: 40–60 words for 2 marks',
    steps: [
      'Crisp 2-line formal definition (1 Mark)',
      '2 bullet points / primary types (0.5 Mark)',
      '1 brief concrete example (~50 words total) (0.5 Mark)'
    ]
  };
};

export default function PracticeSessionUI({
  subject,
  onBack,
  onUpdateProgress
}: {
  subject: any;
  onBack: () => void;
  onUpdateProgress?: (
    subjectName: string,
    progress: number,
    stats?: { score?: number; isNewQuestion?: boolean }
  ) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [activeType, setActiveType] = useState<QuestionType>('short');

  // Progressive 3-level Hint state (0 = none, 1 = concept nudge, 2 = blueprint, 3 = keywords)
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);

  // Real-time progress state
  const [currentSubjectProgress, setCurrentSubjectProgress] = useState<number>(
    typeof subject?.progress === 'number' ? Math.round(subject.progress) : 0
  );
  const [attemptedCount, setAttemptedCount] = useState<number>(
    subject?.attemptedQuestions || 0
  );

  // Deep performance history
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [sessionAnalysis, setSessionAnalysis] = useState<any>(null);
  const [analyzingPerformance, setAnalyzingPerformance] = useState(false);

  // Pre-warm remaining tabs cleanly after active tab starts
  useEffect(() => {
    if (!subject?.name) return;
    const timer = setTimeout(() => {
      prefetchAllQuestionModules(subject.name, subject.topics || [], activeType);
    }, 600);
    return () => clearTimeout(timer);
  }, [subject?.name]);

  useEffect(() => {
    fetchQuestions(activeType);
  }, [subject, activeType]);

  const fetchQuestions = async (type: QuestionType) => {
    if (!subject) return;

    const normalizeList = (list: any[]) =>
      list.map((item: any) => ({
        ...item,
        type,
        marks:
          type === 'long' || type === 'numerical'
            ? 7
            : type === 'short'
              ? 2
              : 1
      }));

    // Instant 0ms read if already cached or prefetched
    const cached = getCachedQuestions(subject.name, type, subject.topics || []);
    setCurrentIndex(0);
    setUserAnswer('');
    setEvaluation(null);
    setHintLevel(0);
    setSessionFinished(false);

    if (cached && cached.length > 0) {
      setQuestions(normalizeList(cached));
      setLoading(false);
      return;
    }

    setLoading(true);
    setQuestions([]);

    try {
      const q = await questionArchitectAgent(
        subject.name,
        subject.topics || [],
        'End Term Intensive Pattern',
        type
      );
      setQuestions(normalizeList(Array.isArray(q) ? q : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const finishAssessmentEarly = () => {
    if (sessionHistory.length > 0) {
      setSessionFinished(true);
      generateDeepReport();
    } else {
      onBack();
    }
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return;
    setEvaluating(true);
    try {
      const q = questions[currentIndex];
      const qMarks =
        activeType === 'long' || activeType === 'numerical'
          ? 7
          : activeType === 'mcq'
            ? 1
            : 2;
      let result: any;
      try {
        result = await evaluatorAgent(
          q.text,
          q.modelAnswer,
          userAnswer,
          q.keywords || [],
          qMarks,
          q.type || activeType
        );
      } catch (err: any) {
        console.warn('evaluatorAgent fallback triggered:', err);
        const userText = userAnswer.trim();
        const kwList: string[] = Array.isArray(q.keywords) ? q.keywords : [];
        const matchedKw = kwList.filter((kw: string) =>
          userText.toLowerCase().includes(kw.toLowerCase())
        );
        const missingKw = kwList.filter(
          (kw: string) => !userText.toLowerCase().includes(kw.toLowerCase())
        );
        const kwRatio = kwList.length > 0 ? matchedKw.length / kwList.length : 0.6;
        const lengthFactor = Math.min(1, userText.length / 200);
        const computedScore = Math.min(
          10,
          Math.max(1.5, Math.round((kwRatio * 6 + lengthFactor * 3.5 + 0.5) * 10) / 10)
        );
        const obtainedMarks =
          activeType === 'mcq'
            ? computedScore >= 5
              ? 1
              : 0
            : Math.min(
                qMarks,
                Math.max(0.5, Math.round(((computedScore / 10) * qMarks) * 2) / 2)
              );
        const perMissing =
          missingKw.length > 0
            ? Math.max(0.5, Math.round(((qMarks - obtainedMarks) / missingKw.length) * 2) / 2)
            : 0.5;
        const masteryPct = Math.round((obtainedMarks / qMarks) * 100);

        result = {
          score: computedScore,
          obtainedMarks,
          questionMarks: qMarks,
          requiredScore: 4.0,
          requiredDistinctionScore: 7.5,
          maxScore: 10,
          isPassed: computedScore >= 4.0,
          scoreGap: Math.round((computedScore - 4.0) * 10) / 10,
          coveredPoints:
            matchedKw.length > 0
              ? matchedKw.map((k) => `Covered concept: ${k}`)
              : ['Attempted explanation in your own words'],
          missingPoints: missingKw.slice(0, 3).map((k) => ({
            point: `Add '${k}' with a concrete exam example or formula.`,
            potentialMarks: `+${perMissing} Marks`
          })),
          upgradedAnswerSuggestion:
            missingKw.length > 0
              ? `Keep your opening line and add a concise bullet explaining ${missingKw.slice(0, 2).join(' and ')} to reach ${qMarks}/${qMarks} marks.`
              : `Format your answer into crisp bullet points and add one practical example to lock in ${qMarks}/${qMarks} marks.`,
          idealUniversityAnswer: q.modelAnswer,
          feedback: `Allotted ${obtainedMarks}/${qMarks} marks (${masteryPct}% mastery). Matched ${matchedKw.length} of ${kwList.length} key concepts.`
        };
      }

      if (!result.requiredScore) result.requiredScore = 4.0;
      if (!result.requiredDistinctionScore) result.requiredDistinctionScore = 7.5;
      if (!result.maxScore) result.maxScore = 10;
      result.questionMarks = qMarks;
      if (typeof result.obtainedMarks !== 'number') {
        result.obtainedMarks =
          activeType === 'mcq'
            ? result.score >= 5
              ? 1
              : 0
            : Math.min(qMarks, Math.round(((result.score / 10) * qMarks) * 2) / 2);
      } else {
        result.obtainedMarks = Math.min(qMarks, Math.max(0, result.obtainedMarks));
      }
      if (typeof result.isPassed !== 'boolean') {
        result.isPassed = result.score >= result.requiredScore;
      }
      if (typeof result.scoreGap !== 'number') {
        result.scoreGap = Math.round((result.score - result.requiredScore) * 10) / 10;
      }

      setEvaluation(result);

      const newScores = [...scores, result.score];
      setScores(newScores);

      const newAttempted = attemptedCount + 1;
      setAttemptedCount(newAttempted);

      const avgScore = newScores.reduce((a, b) => a + b, 0) / newScores.length;
      const newProgressPercent = Math.min(
        100,
        Math.round(Math.min(50, newAttempted * 10) + (avgScore / 10) * 50)
      );
      setCurrentSubjectProgress(newProgressPercent);

      if (onUpdateProgress && subject) {
        onUpdateProgress(subject.name, newProgressPercent, {
          score: result.score,
          isNewQuestion: true
        });
      }

      setSessionHistory((prev) => [
        ...prev,
        {
          question: q.text,
          score: result.score,
          obtainedMarks: result.obtainedMarks,
          questionMarks: result.questionMarks,
          feedback: result.feedback,
          type: q.type
        }
      ]);

      setTimeout(() => {
        document
          .getElementById('evaluation-results-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err) {
      console.error('Evaluation failed completely:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const generateDeepReport = async () => {
    setAnalyzingPerformance(true);
    try {
      const analysis = await performanceAnalystAgent(sessionHistory);
      setSessionAnalysis(analysis);
    } catch (err) {
      console.error('Performance analysis failed:', err);
      setSessionAnalysis({
        summary: `Completed ${sessionHistory.length} practice evaluations across ${subject?.name || 'this subject'}.`,
        strengths: ['Completed section-wise practice with mark-calibrated coaching'],
        weaknesses: ['Review missed keywords and practice timed derivations for 7-mark problems'],
        studyTips: ['Revisit missing concepts listed in the gap-filler checklist', 'Practice structured point-wise answers']
      });
    } finally {
      setAnalyzingPerformance(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setEvaluation(null);
      setHintLevel(0);
    } else {
      setSessionFinished(true);
      generateDeepReport();
    }
  };

  const currentQ = questions[currentIndex];
  const wordCount = useMemo(() => {
    const trimmed = userAnswer.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [userAnswer]);

  const structureGuide = useMemo(
    () => getStructureGuide(activeType, currentQ?.marks || 2),
    [activeType, currentQ?.marks]
  );

  if (loading || !subject || (!questions.length && !sessionFinished)) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">
          {!subject ? 'Invalid Subject Session' : `Preparing ${activeType} questions...`}
        </p>
        {!subject && (
          <button
            onClick={onBack}
            className="text-sm text-blue-600 hover:underline cursor-pointer"
          >
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  if (sessionFinished) {
    if (sessionAnalysis) {
      return (
        <PerformanceReport
          sessionData={sessionHistory}
          analysis={sessionAnalysis}
          subjectName={subject?.name || 'Subject'}
          subjectCode={subject?.code}
          onExit={onBack}
          onRestart={() => {
            setSessionFinished(false);
            setSessionHistory([]);
            setSessionAnalysis(null);
            setActiveType('short');
          }}
        />
      );
    }

    const totalObtained = Number(
      sessionHistory.reduce((a, b) => a + (Number(b.obtainedMarks) || 0), 0).toFixed(1)
    );
    const totalMax = sessionHistory.reduce(
      (a, b) => a + (Number(b.questionMarks) || (b.type === 'long' || b.type === 'numerical' ? 7 : b.type === 'mcq' ? 1 : 2)),
      0
    );

    return (
      <div className="mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl bg-slate-900 p-12 text-white shadow-2xl shadow-slate-200"
        >
          <div className="mb-6 flex justify-center">
            {analyzingPerformance ? (
              <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
            ) : (
              <Trophy className="h-16 w-16 text-blue-500" />
            )}
          </div>
          <h2 className="mb-2 text-3xl font-bold tracking-tight text-white">
            {analyzingPerformance ? 'Compiling Section-by-Section Report...' : 'Session Complete!'}
          </h2>
          <p className="mb-8 opacity-80 text-slate-300 font-medium italic">
            {analyzingPerformance
              ? 'Calculating section-wise marks for Short, Long, Numerical & MCQs...'
              : `You've completed practice for ${subject?.name}.`}
          </p>

          {!analyzingPerformance && (
            <>
              <div className="mb-10 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">
                    Total Session Marks
                  </p>
                  <p className="text-4xl font-black font-mono">
                    {totalObtained}/{totalMax || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">
                    Real-Time Progress
                  </p>
                  <p className="text-4xl font-black font-mono text-emerald-400">
                    {currentSubjectProgress}%
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => generateDeepReport()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-bold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-900/20 cursor-pointer"
                >
                  <BarChart3 className="w-5 h-5" />
                  View Deep Performance Intelligence
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSessionFinished(false);
                      setSessionHistory([]);
                      setActiveType('short');
                    }}
                    className="flex-1 rounded-xl bg-slate-800 px-8 py-4 text-sm font-bold text-slate-300 transition-all hover:text-white hover:bg-slate-700 active:scale-95 cursor-pointer"
                  >
                    New Module
                  </button>
                  <button
                    onClick={onBack}
                    className="flex-1 rounded-xl bg-slate-800 px-8 py-4 text-sm font-bold text-slate-300 transition-all hover:text-white hover:bg-slate-700 active:scale-95 cursor-pointer"
                  >
                    Exit to Dashboard
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  if (!currentQ) return null;

  const lengthProgressPct = Math.min(
    100,
    Math.round((wordCount / Math.max(1, structureGuide.maxWords)) * 100)
  );
  const lengthStatus =
    activeType === 'mcq'
      ? wordCount > 0
        ? 'Option selected'
        : 'Choose an option'
      : wordCount === 0
        ? 'Start writing to track length'
        : wordCount < structureGuide.minWords
          ? `${structureGuide.minWords - wordCount} more words recommended`
          : wordCount <= structureGuide.maxWords
            ? 'Ideal exam length reached'
            : 'Detailed response (ready to check)';

  return (
    <div className="mx-auto max-w-6xl pb-20 space-y-6">
      {/* 1. Header with Live Progress Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {subject.code || 'CODE'}
              </span>
              <h2 className="text-base font-black text-slate-900">{subject.name}</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Real-Time Academic Practice • Unit {currentIndex + 1} of {questions.length}
            </p>
          </div>
        </div>

        {/* Live Subject Progress Tracker */}
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80">
          <div>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              <span>Real-Time Mastery</span>
              <span className="text-blue-600 font-mono ml-2">{currentSubjectProgress}%</span>
            </div>
            <div className="w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  currentSubjectProgress >= 75
                    ? 'bg-emerald-500'
                    : currentSubjectProgress >= 40
                      ? 'bg-blue-600'
                      : 'bg-amber-500'
                )}
                style={{ width: `${currentSubjectProgress}%` }}
              />
            </div>
          </div>
          <button
            onClick={finishAssessmentEarly}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
          >
            Finish Early
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Question & Input Console (8 cols) */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="space-y-6">
              {/* Module Type Selector */}
              <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-6">
                {(['short', 'long', 'numerical', 'mcq'] as QuestionType[]).map((t) => (
                  <button
                    key={t}
                    disabled={evaluating}
                    onClick={() => setActiveType(t)}
                    className={cn(
                      'py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer',
                      activeType === t
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 text-slate-400'
                    )}
                  >
                    <div
                      className={cn(
                        'text-xs font-black uppercase tracking-wider',
                        activeType === t ? 'text-blue-700' : 'text-slate-500'
                      )}
                    >
                      {t === 'mcq' ? 'MCQS' : t}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400">
                      {t === 'long' || t === 'numerical'
                        ? '7 Marks'
                        : t === 'short'
                          ? '2 Marks'
                          : '1 Mark'}
                    </div>
                  </button>
                ))}
              </div>

              {/* Question Card */}
              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center font-mono shadow-sm">
                  <span className="text-xs font-black">Q{currentIndex + 1}</span>
                  <span className="text-[9px] opacity-75">{questions.length}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-slate-900 leading-relaxed mb-2">
                    {currentQ.text}
                  </h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase tracking-wider">
                      Marks: {currentQ.marks}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      University Priority: High Yield
                    </span>
                  </div>
                </div>
              </div>

              {(currentQ.type === 'mcq' || currentQ.mcqOptions) && (
                <div className="space-y-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                    Select Correct Option:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      currentQ.mcqOptions || [
                        'Fundamental theoretical bound',
                        'Optimal logarithmic complexity',
                        'Linear asymptotic execution',
                        'Quadratic overhead limit'
                      ]
                    ).map((opt: string, idx: number) => {
                      const optLetter = String.fromCharCode(65 + idx);
                      const isSelected =
                        userAnswer.trim().startsWith(optLetter) || userAnswer.includes(opt);
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!!evaluation}
                          onClick={() => setUserAnswer(`${optLetter}. ${opt}`)}
                          className={cn(
                            'text-left p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center gap-3',
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          )}
                        >
                          <span
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0',
                              isSelected
                                ? 'bg-white text-blue-600'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            )}
                          >
                            {optLetter}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Response Console with Live Word & Structure Guide */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <PenTool className="w-3 h-3 text-blue-600" />
                    <span>Your Academic Response</span>
                  </label>

                  {/* Live Word Count & Target Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2.5 py-1 rounded-lg border',
                        wordCount >= structureGuide.minWords
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : wordCount > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                      )}
                    >
                      {wordCount} words • {structureGuide.targetLabel}
                    </span>
                  </div>
                </div>

                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={!!evaluation}
                  placeholder={
                    activeType === 'numerical'
                      ? 'Write Given Data, Governing Formula, Step-by-Step Substitution, and Final Answer with Units...'
                      : activeType === 'long'
                        ? 'Structure your 7-mark answer: Definition -> Core Architecture/Points -> Comparison -> Real-World Example...'
                        : 'Type your concise exam answer here. Include a crisp definition, key points, and 1 brief example...'
                  }
                  className="h-64 w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:opacity-75 transition-all text-sm leading-relaxed"
                />
              </div>

              {/* Action Button: Check & Compare Answer */}
              {!evaluation ? (
                <button
                  disabled={evaluating || !userAnswer.trim()}
                  onClick={handleEvaluate}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Checking Coverage & Preparing Coaching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Check &amp; Compare Answer</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>
                    {currentIndex < questions.length - 1
                      ? 'Proceed to Next Question'
                      : 'Complete Module & View Report'}
                  </span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Side-by-Side Ideal University Answer Comparison (Visible After Checking) */}
          {evaluation && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Side-by-Side Answer Comparison
                  </h4>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  University Checker Format
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                {/* Student's Submitted Answer */}
                <div className="p-5 sm:p-6 space-y-2.5 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Your Submitted Answer
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {wordCount} words
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {userAnswer}
                  </div>
                </div>

                {/* Ideal University Answer */}
                <div className="p-5 sm:p-6 space-y-2.5 bg-emerald-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Ideal University Answer ({evaluation.questionMarks || currentQ.marks} Marks)
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed prose prose-slate prose-sm max-w-none bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
                    <Markdown>{evaluation.idealUniversityAnswer || currentQ.modelAnswer}</Markdown>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Interactive Answer Coach (Before Submit) OR Marks Breakdown & Gap-Filler (After Submit) */}
        <div
          id="evaluation-results-section"
          className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col gap-6"
        >
          <AnimatePresence mode="wait">
            {evaluation ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5 sticky top-6"
              >
                {/* 1. MARKS BREAKDOWN CARD */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Marks Breakdown
                    </span>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1',
                        evaluation.isPassed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      )}
                    >
                      {evaluation.isPassed ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Passing Benchmark Met</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Needs Revision</span>
                        </>
                      )}
                    </span>
                  </div>

                  {(() => {
                    const sectionMaxMarks =
                      evaluation.questionMarks ||
                      (activeType === 'long' || activeType === 'numerical'
                        ? 7
                        : activeType === 'mcq'
                          ? 1
                          : 2);
                    const masteryScaledMarks =
                      activeType === 'mcq'
                        ? evaluation.obtainedMarks >= 1
                          ? 1
                          : 0
                        : Number(((evaluation.score / 10) * sectionMaxMarks).toFixed(1));
                    const passScaledMarks =
                      activeType === 'mcq'
                        ? 1
                        : Number((0.4 * sectionMaxMarks).toFixed(1));

                    return (
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100">
                          <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 block mb-0.5">
                            Question Marks
                          </span>
                          <div className="text-2xl font-black text-blue-700 font-mono">
                            {evaluation.obtainedMarks}
                            <span className="text-sm text-blue-400">/{sectionMaxMarks}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400">Exam Credit</span>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                            Mastery Scale
                          </span>
                          <div className="text-2xl font-black text-slate-800 font-mono">
                            {masteryScaledMarks}
                            <span className="text-sm text-slate-400">/{sectionMaxMarks}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400">
                            Pass: {passScaledMarks}/{sectionMaxMarks}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {evaluation.feedback}
                  </p>
                </div>

                {/* 2. KEYWORD & CONCEPT COVERAGE CHECKLIST */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <ListChecks className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Keyword &amp; Concept Checklist
                    </h4>
                  </div>

                  {/* Covered Concepts */}
                  {Array.isArray(evaluation.coveredPoints) && evaluation.coveredPoints.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        Covered
                      </span>
                      <div className="space-y-1.5">
                        {evaluation.coveredPoints.map((pt: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-900 font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Concepts & Mark Gain */}
                  {Array.isArray(evaluation.missingPoints) && evaluation.missingPoints.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-700">
                        Missing Gaps (Recoverable Marks)
                      </span>
                      <div className="space-y-2">
                        {evaluation.missingPoints.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70 text-xs text-rose-950"
                          >
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[10px] font-black">
                                {item.potentialMarks || '+0.5 Marks'}
                              </span>
                              <p className="font-medium leading-relaxed">{item.point}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. UPGRADED ANSWER SUGGESTION */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4" />
                      How to Upgrade Your Answer ({evaluation.questionMarks}/{evaluation.questionMarks})
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/10">
                    {evaluation.upgradedAnswerSuggestion}
                  </p>
                </div>
              </motion.div>
            ) : (
              /* BEFORE SUBMITTING: INTERACTIVE ANSWER COACH */
              <motion.div
                key="coach"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5 sticky top-6"
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Interactive Answer Coach
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          Stuck? Unlock progressive nudges before checking
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Live Word & Structure Guide */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                      <span className="text-slate-500">Live Word &amp; Structure Guide</span>
                      <span className="font-mono text-blue-700">{wordCount} words</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          wordCount >= structureGuide.minWords ? 'bg-emerald-500' : 'bg-blue-600'
                        )}
                        style={{ width: `${lengthProgressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-600">{structureGuide.targetLabel}</span>
                    </div>
                    <p
                      className={cn(
                        'text-[11px] font-bold',
                        wordCount >= structureGuide.minWords ? 'text-emerald-700' : 'text-amber-700'
                      )}
                    >
                      {lengthStatus}
                    </p>
                  </div>

                  {/* Progressive 3-Level Hints ("Nudge Me") */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Progressive 3-Level Hints
                      </span>
                      <span className="text-[10px] font-mono font-bold text-blue-600">
                        {hintLevel}/3 Revealed
                      </span>
                    </div>

                    {/* Hint 1: Concept Nudge */}
                    {hintLevel >= 1 ? (
                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          Hint 1 • Concept Nudge
                        </span>
                        <p className="text-xs text-amber-950 leading-relaxed font-medium">
                          {currentQ.conceptNudge ||
                            `Think about how the core principle of ${subject.name} applies here and give one real example.`}
                        </p>
                      </div>
                    ) : null}

                    {/* Hint 2: Structure Blueprint */}
                    {hintLevel >= 2 ? (
                      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5 text-blue-600" />
                          Hint 2 • {structureGuide.title}
                        </span>
                        <ul className="space-y-1">
                          {structureGuide.steps.map((step, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-blue-950 font-medium flex items-start gap-1.5"
                            >
                              <span className="font-mono text-[10px] font-black text-blue-600 mt-0.5">
                                {idx + 1}.
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Hint 3: Keyword Reveal */}
                    {hintLevel >= 3 ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-emerald-600" />
                          Hint 3 • Must-Use University Keywords
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(currentQ.keywords || []).map((kw: string) => (
                            <span
                              key={kw}
                              className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-800"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Nudge Me CTA */}
                    {hintLevel < 3 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setHintLevel((prev) => (prev < 3 ? ((prev + 1) as 0 | 1 | 2 | 3) : 3))
                        }
                        className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>
                          {hintLevel === 0
                            ? 'Nudge Me • Hint 1 (Concept Clue)'
                            : hintLevel === 1
                              ? 'Nudge Me • Hint 2 (Structure Blueprint)'
                              : 'Nudge Me • Hint 3 (Reveal Keywords)'}
                        </span>
                      </button>
                    ) : (
                      <p className="text-[11px] text-center font-semibold text-slate-400">
                        All 3 hints unlocked — combine them in your answer and click Check &amp; Compare.
                      </p>
                    )}
                  </div>
                </div>

                {/* University Paper-Checker Playbook (Replaces Examiner & AI Stylometry Engine) */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white border border-slate-800 space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                    University Paper-Checker Tip
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Paper-checkers scan for crisp definitions, underlined technical terms, mark-aligned structure, and concrete examples or units. Click <strong>Check &amp; Compare Answer</strong> to see missing mark gaps and how to upgrade your exact phrasing.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
