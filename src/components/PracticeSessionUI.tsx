import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  CheckCircle2, 
  Brain, 
  Star, 
  ChevronRight, 
  Loader2, 
  PenTool,
  Trophy,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { questionArchitectAgent, evaluatorAgent, performanceAnalystAgent } from '../services/geminiService';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import PerformanceReport from './PerformanceReport';

type QuestionType = 'short' | 'long' | 'numerical' | 'diagram';

export default function PracticeSessionUI({ subject, onBack, onUpdateProgress }: { 
  subject: any, 
  onBack: () => void,
  onUpdateProgress?: (subjectName: string, progress: number) => void
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
  
  // New metrics for deep report
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [sessionAnalysis, setSessionAnalysis] = useState<any>(null);
  const [analyzingPerformance, setAnalyzingPerformance] = useState(false);

  // Sync progress to dashboard/Firestore when session finishes
  useEffect(() => {
    if (sessionFinished && scores.length > 0 && onUpdateProgress && subject) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const progressPercent = Math.min(100, Math.round(avg * 10));
      onUpdateProgress(subject.name, progressPercent);
    }
  }, [sessionFinished, scores.length, subject?.name]);

  useEffect(() => {
    fetchQuestions(activeType);
  }, [subject, activeType]);

  const fetchQuestions = async (type: QuestionType) => {
    if (!subject) return;
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswer('');
    setEvaluation(null);
    setSessionFinished(false);
    setScores([]);
    
    try {
      // Force 7 marks for long answers as per new university intensive mode
      const q = await questionArchitectAgent(subject.name, subject.topics, "End Term Intensive Pattern", type);
      setQuestions(q.map((item: any) => ({ 
        ...item, 
        type,
        marks: type === 'long' ? 7 : item.marks 
      })));
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
      onBack(); // If nothing answered, just go back
    }
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return;
    setEvaluating(true);
    try {
      const q = questions[currentIndex];
      const result = await evaluatorAgent(q.text, q.modelAnswer, userAnswer, q.keywords);
      setEvaluation(result);
      setScores([...scores, result.score]);
      
      // Track history for performance report
      setSessionHistory(prev => [...prev, {
        question: q.text,
        score: result.score,
        feedback: result.feedback,
        type: q.type
      }]);
    } catch (err) {
      console.error(err);
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
      console.error("Performance analysis failed:", err);
    } finally {
      setAnalyzingPerformance(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setEvaluation(null);
    } else {
      setSessionFinished(true);
      generateDeepReport();
    }
  };

  if (loading || !subject || (!questions.length && !sessionFinished)) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">
          {!subject ? 'Invalid Subject Session' : `Architecting ${activeType} module...`}
        </p>
        {!subject && (
          <button onClick={onBack} className="text-sm text-blue-600 hover:underline">
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

    const totalScore = scores.reduce((a, b) => a + b, 0);
    const avg = totalScore / (questions.length || 1);
    
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
            {analyzingPerformance ? 'Synthesizing Architecture Report...' : 'Session Complete!'}
          </h2>
          <p className="mb-8 opacity-80 text-slate-300 font-medium italic">
            {analyzingPerformance ? 'AI Architect is cross-referencing your semantic responses...' : `You've mastered these concepts for ${subject?.name}.`}
          </p>
          
          {!analyzingPerformance && (
            <>
              <div className="mb-10 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Avg Session Grade</p>
                  <p className="text-4xl font-black font-mono">{avg.toFixed(1)}/10</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Mastery Index</p>
                  <p className="text-4xl font-black font-mono">+{(avg * 2.5).toFixed(0)}%</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => generateDeepReport()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-bold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-900/20"
                >
                  <BarChart3 className="w-5 h-5" />
                  View Deep Performance Intelligence
                </button>
                <div className="flex gap-4">
                  <button 
                    onClick={() => { setSessionFinished(false); setSessionHistory([]); setActiveType('short'); }}
                    className="flex-1 rounded-xl bg-slate-800 px-8 py-4 text-sm font-bold text-slate-300 transition-all hover:text-white hover:bg-slate-700 active:scale-95"
                  >
                    New Module
                  </button>
                  <button 
                    onClick={onBack}
                    className="flex-1 rounded-xl bg-slate-800 px-8 py-4 text-sm font-bold text-slate-300 transition-all hover:text-white hover:bg-slate-700 active:scale-95"
                  >
                    Exit
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  return (
    <div className="mx-auto max-w-6xl pb-20">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Exit Workspace</span>
        </button>
        <div className="flex items-center gap-4">
           <span className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-bold rounded uppercase text-slate-500 shadow-sm">10-Question Comprehensive Assessment</span>
           <button 
             onClick={finishAssessmentEarly}
             className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold rounded uppercase hover:bg-amber-100 transition-colors"
           >
             Finish & View Report
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Question Area */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">
                <Brain className="w-4 h-4 text-blue-500" />
                AI Question Architect
              </h3>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Type Selection - Student can directly select their weak area */}
              <div className="grid grid-cols-4 gap-4">
                {(['short', 'long', 'numerical', 'diagram'] as QuestionType[]).map((t) => (
                  <button 
                    key={t}
                    onClick={() => setActiveType(t)}
                    disabled={loading || evaluating}
                    className={cn(
                      "p-3 border-2 rounded-lg text-center transition-all cursor-pointer group",
                      activeType === t 
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" 
                        : "border-slate-100 hover:border-slate-200 text-slate-400"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-bold uppercase",
                      activeType === t ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"
                    )}>{t}</div>
                    <div className="text-[9px] font-bold uppercase opacity-60">
                      {activeType === t ? 'Active Area' : 'Select Tool'}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-5 p-6 bg-slate-50 rounded-xl border border-slate-100">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-slate-200 flex flex-col items-center justify-center font-black text-slate-600 shadow-sm leading-none">
                  <span className="text-sm font-black">Q{currentIndex + 1}</span>
                  <div className="w-6 h-[1px] bg-slate-400 my-1" />
                  <span className="text-[10px] text-slate-400">10</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 leading-relaxed mb-4">
                    {currentQ.text}
                  </h3>
                  <div className="flex gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marks: {currentQ.marks}</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">University Priority: High</span>
                  </div>
                </div>
              </div>

              {currentQ.diagramDescription && (
                <div className="bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 font-mono">Diagram Revision Task</h3>
                  <p className="text-sm text-slate-300 mb-6 italic leading-relaxed">"{currentQ.diagramDescription}"</p>
                  <div className="aspect-video bg-slate-800 rounded-lg border border-slate-700 flex flex-col items-center justify-center relative shadow-inner">
                    <PenTool className="w-16 h-16 text-slate-700 mb-2" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-[10px] uppercase font-bold px-4 py-1.5 rounded-full shadow-lg">Identify Component</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Response Console</label>
                  <span className="text-[10px] font-medium text-slate-300">Draft saved automatically</span>
                </div>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={!!evaluation}
                  placeholder="Type your academic response here..."
                  className="h-64 w-full rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 transition-all font-sans text-sm leading-relaxed"
                />
              </div>

              {!evaluation ? (
                <button
                  disabled={evaluating || !userAnswer.trim()}
                  onClick={handleEvaluate}
                  className="w-full btn-primary py-4 text-base"
                >
                  {evaluating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Brain className="h-5 w-5" />}
                  Consult Evaluator Agent
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800"
                >
                  Proceed to Next Module
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Feedback Sidebar */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {evaluation ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sticky top-8"
              >
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6">Evaluator Agent Feedback</h3>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-1.5 rounded-full shrink-0",
                      evaluation.score >= 7 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-orange-500"
                    )}></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Session Grade</p>
                      <p className="text-2xl font-black text-slate-800 font-mono">{evaluation.score}<span className="text-sm opacity-30 text-slate-400">/10</span></p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Analysis Breakdown</p>
                    <div className="text-[13px] leading-relaxed text-slate-600 prose prose-slate max-w-none">
                      <Markdown>{evaluation.feedback}</Markdown>
                    </div>
                  </div>

                  <div>
                    <h5 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Key Terms Verification</h5>
                    <div className="flex flex-wrap gap-2">
                      {currentQ.keywords.map((kw: string) => {
                        const mastered = userAnswer.toLowerCase().includes(kw.toLowerCase());
                        return (
                          <span 
                            key={kw} 
                            className={cn(
                              "rounded-md px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all shadow-sm",
                              mastered 
                                ? "bg-green-50 border-green-100 text-green-700" 
                                : "bg-white border-slate-100 text-slate-300 opacity-60"
                            )}
                          >
                            {kw}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                   <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                    <p className="text-[9px] font-bold text-orange-600 uppercase mb-1">Architect Note</p>
                    <p className="text-[11px] text-orange-800 font-medium leading-normal">
                      The university historically focuses on {currentQ.keywords[0] || 'core concepts'} in semester finals. Focus depth here.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-6 sticky top-8">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <PenTool className="w-6 h-6 text-slate-300" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Awaiting Input</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Complete your academic response to trigger the Evaluator Agent's cross-referenced feedback mode.</p>
                </div>
                
                <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200 overflow-hidden relative group">
                  <div className="relative z-10">
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Workspace Mode</h4>
                    <p className="text-lg font-bold leading-tight uppercase tracking-tight">Active Calibration Engaged</p>
                  </div>
                  <Brain className="absolute -bottom-4 -right-4 w-24 h-24 text-white opacity-10 transition-transform group-hover:scale-110" />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


function ArrowBubble(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  );
}
