import { useState } from 'react';
import { 
  BookOpen, 
  Map, 
  ArrowRight, 
  BrainCircuit, 
  CheckCircle, 
  GraduationCap, 
  ChevronRight as ChevronIcon, 
  FileDown, 
  Upload, 
  Target, 
  Sparkles, 
  Star, 
  Layers, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  Play,
  Scan,
  Brain,
  Award,
  Compass,
  FileCheck2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Dashboard({ curriculum, onStartPractice, onGenerateMock }: { 
  curriculum: any, 
  onStartPractice: (subject: any) => void,
  onGenerateMock: () => void
}) {
  const subjects = curriculum?.subjects || [];
  const overallMastery = subjects.length > 0 
    ? Math.round(subjects.reduce((acc: number, sub: any) => acc + (sub.progress || 0), 0) / subjects.length)
    : 0;

  const weakSubjectsCount = subjects.filter((s: any) => (s.progress || 0) < 50).length;

  if (!curriculum) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 rounded-2xl bg-blue-50 p-6 border border-blue-100 shadow-sm">
          <Map className="h-12 w-12 text-blue-600 animate-pulse" />
        </div>
        <h3 className="mb-2 text-2xl font-black text-slate-900">No Curriculum Uploaded Yet</h3>
        <p className="mb-8 text-slate-500 max-w-md text-sm leading-relaxed">
          Upload your university syllabus PDF or paste course outlines to automatically extract subject-wise modules, find weak areas, and generate 500+ boost questions.
        </p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('nav-to-upload'))} 
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer text-sm"
        >
          <Upload className="w-4 h-4" />
          Upload University Syllabus PDF
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Academic Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome Back!
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Let&apos;s make your preparation smarter.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGenerateMock}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>500+ Boost Questions</span>
          </button>
        </div>
      </div>

      {/* 2. Top 3 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Subjects */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Subjects
            </span>
            <div className="text-3xl font-black text-blue-600 font-mono">
              {subjects.length}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block">
              {curriculum.universityName || "Mapped University Scheme"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Weak Areas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Weak Areas
            </span>
            <div className="text-3xl font-black text-amber-600 font-mono">
              {weakSubjectsCount}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block">
              Targeted for priority revision
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Practice Progress */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Practice Progress
            </span>
            <div className="text-3xl font-black text-emerald-600 font-mono">
              {overallMastery}%
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block">
              Overall syllabus coverage
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Your Subjects Table (8 cols) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Your Subjects
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Practice smart topic-wise questions and simulate 7-mark university rubrics.
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg">
              {curriculum.semester || "Semester Plan"}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {subjects.map((sub: any, idx: number) => {
              const prog = typeof sub.progress === 'number' ? Math.round(sub.progress) : 0;
              const attempted = sub.attemptedQuestions || 0;
              const avgScore = sub.averageScore ? `${sub.averageScore}/10 avg` : null;
              return (
                <div 
                  key={sub.code || idx}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {sub.code || `SUB-${idx + 1}`}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 truncate">
                        {sub.name}
                      </h3>
                      {prog === 0 ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">
                          Ready to Start
                        </span>
                      ) : prog >= 80 ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold uppercase tracking-wider">
                          Exam Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold uppercase tracking-wider">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-2">
                      <span>{sub.topics ? `${sub.topics.length} Units Mapped` : 'Comprehensive Exam Practice'}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-600">{attempted} questions evaluated</span>
                      {avgScore && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold">{avgScore}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Progress Bar & Start CTA */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            prog >= 75 ? "bg-emerald-500" : prog >= 40 ? "bg-blue-600" : prog > 0 ? "bg-amber-500" : "bg-slate-200"
                          )}
                          style={{ width: `${Math.max(prog, prog === 0 ? 0 : 4)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-600 w-9 text-right">
                        {prog}%
                      </span>
                    </div>

                    <button
                      onClick={() => onStartPractice(sub)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>{attempted > 0 ? "Continue" : "Start"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Boost Questions & Practice Tools (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Boost Questions Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-300/30 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-300" />
                University Exam Predictor
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">500+ Boost Questions</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Access 500+ previously asked and predicted questions from your university exams to boost your score.
              </p>
            </div>

            <button
              onClick={onGenerateMock}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>Generate 500-Q PDF Archive</span>
            </button>
          </div>

          {/* Quick Study Recommendation */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-600" />
              Preparation Strategy
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Solve topic-wise 7-mark questions and let the AI Examiner score your answers line-by-line with standard university grading rubrics.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Next Term:</span>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('nav-to-upload'))}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                + Upload Next Syllabus
              </button>
            </div>
          </div>
        </div>
      </div>



    </div>
  );
}
