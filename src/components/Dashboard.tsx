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
  CheckCircle2
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
              const prog = sub.progress || (idx === 0 ? 59 : idx === 1 ? 90 : idx === 2 ? 20 : 60);
              return (
                <div 
                  key={sub.code || idx}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {sub.code || `SUB-${idx + 1}`}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 truncate">
                        {sub.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {sub.topics ? `${sub.topics.length} Units Mapped • ${sub.topics.slice(0, 2).join(', ')}...` : 'Comprehensive Exam Practice'}
                    </p>
                  </div>

                  {/* Progress Bar & Start CTA */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            prog >= 75 ? "bg-emerald-500" : prog >= 40 ? "bg-blue-600" : "bg-amber-500"
                          )}
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-600 w-8 text-right">
                        {prog}%
                      </span>
                    </div>

                    <button
                      onClick={() => onStartPractice(sub)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>Start</span>
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

      {/* 4. Features Section inside Main Dashboard */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-1 border border-blue-100">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Core Platform Features</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Exam Architect Academic Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Everything you need to master your university examination scheme.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {/* Feature 1 */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/70 hover:border-blue-300 hover:bg-white transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Scan className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Syllabus OCR Extraction</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload your semester PDF once. The engine decomposes courses into exact units, modules, and theorems.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/70 hover:border-blue-300 hover:bg-white transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">7-Mark Question Architect</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates rigorous university-pattern subjective questions with step derivations, numerical problems, and diagrams.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/70 hover:border-blue-300 hover:bg-white transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">AI Examiner Evaluation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Line-by-line mark breakdown identifying missing key terms, calculation steps, and providing model solutions.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/70 hover:border-blue-300 hover:bg-white transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Star className="w-5 h-5 fill-white" />
            </div>
            <h3 className="text-sm font-black text-slate-900">500+ Boost Questions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export comprehensive 500-question archives (100 per unit) calibrated to past recurring semester exam papers.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/70 hover:border-blue-300 hover:bg-white transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Weak Area Diagnostics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pinpoints units below 50% mastery, routing you straight to high-priority practice modules before end-term finals.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/70 hover:border-blue-300 hover:bg-white transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Printable Exam Papers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instantly download vector PDF mock test papers formatted to match your university&apos;s exact marks distribution.
            </p>
          </div>
        </div>
      </div>

      {/* 5. About Section inside Main Dashboard */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-xl space-y-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>About Exam Architect</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Built for Students Who Want Real Exam Results
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              Exam Architect bridges the gap between massive university syllabi and student success. Instead of drowning in endless slides or generic web summaries, our AI aligns directly with your institution&apos;s syllabus and previous examination trends.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                <span className="text-2xl font-black text-blue-400 font-mono block">100%</span>
                <span className="text-xs font-bold text-white block mt-0.5">Syllabus-Aligned</span>
                <span className="text-[11px] text-slate-400">Strict unit-by-unit mapping</span>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                <span className="text-2xl font-black text-emerald-400 font-mono block">500+</span>
                <span className="text-xs font-bold text-white block mt-0.5">Predicted PYQs</span>
                <span className="text-[11px] text-slate-400">Recurring exam questions</span>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                <span className="text-2xl font-black text-amber-400 font-mono block">7-Mark</span>
                <span className="text-xs font-bold text-white block mt-0.5">University Rubrics</span>
                <span className="text-[11px] text-slate-400">Line-by-line examiner scoring</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 shrink-0 bg-slate-800/90 rounded-2xl p-6 border border-slate-700/80 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Academic Standards
            </h3>
            
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero fluff—focus strictly on questions that score marks in semester exams.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Active recall practice instead of passive reading.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Instant diagnostic breakdown of your weak topics.</span>
              </div>
            </div>

            <button
              onClick={onGenerateMock}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Download 500-Q PDF</span>
              <FileDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
