import { BookOpen, Map, ArrowRight, BrainCircuit, CheckCircle, GraduationCap, ChevronRight as ChevronIcon, FileDown, Upload } from 'lucide-react';
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

  if (!curriculum) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 rounded-xl bg-slate-100 p-6">
          <Map className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-slate-900">No Curriculum Found</h3>
        <p className="mb-8 text-slate-500 max-w-md">You haven't uploaded your university syllabus yet. Let's map your course structure to get started.</p>
        <button onClick={() => window.dispatchEvent(new CustomEvent('nav-to-upload'))} className="btn-primary">
          Upload Syllabus
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 pb-20">
      {/* Left Column: Overall Stats & Subjects */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        {/* Coverage Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Overall Coverage</h2>
              <p className="text-sm text-slate-500 italic">Universitiy Specific Depth: <span className="text-blue-600 font-medium">Calibrated</span></p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-900">{overallMastery}%</span>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Concept Mastery</p>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${overallMastery}%` }}
              className="h-full bg-blue-500"
            ></motion.div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Your Subjects
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sub: any, idx: number) => (
              <motion.div
                key={sub.code || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onStartPractice(sub)}
                className="group flex flex-col justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-blue-200 hover:bg-white transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sub.code || 'CORESUB'}</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Priority: High</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">{sub.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">Topics: {sub.topics?.join(", ")}</p>
                </div>
                <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      (sub.progress || 0) > 0 ? "text-blue-600" : "text-slate-400"
                    )}>
                      {sub.progress || 0}% Progress
                    </span>
                    <ChevronIcon className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${sub.progress || 0}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => window.dispatchEvent(new CustomEvent('nav-to-upload'))}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
              <p className="text-xs font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest">Next Academic Term</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 opacity-60">Upload Next Curriculum</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Column: Tips & Evaluation Meta */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <div className="bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4">Exam Simulator</h3>
            <p className="text-sm text-slate-300 mb-6">Generate full-length papers formatted precisely to your university's marks distribution standards.</p>
            <div className="aspect-video bg-slate-800 rounded-lg border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
               <FileDown className="w-12 h-12 text-slate-600 mb-2" />
               <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Mock Archive</div>
            </div>
            <button 
              onClick={onGenerateMock}
              className="w-full mt-6 py-3 border border-slate-700 rounded-lg text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Draft Full Mock Exam
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">AI Architect Feed</h3>
          <div className="space-y-4">
            <FeedItem 
              status="Scoring" 
              value="8.5/10 Goal" 
              desc="Based on historical Stanford CS trends." 
              color="bg-green-500" 
            />
            <FeedItem 
              status="Trend" 
              value="Numerical focus suggested" 
              desc="Derivations emphasize definitions in this course." 
              color="bg-blue-500" 
            />
          </div>
          <div className="mt-8">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Architect Tip</p>
              <p className="text-xs text-blue-800 font-medium leading-normal">University papers often emphasize derivation over definition for this semester. Adjusting study depth.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedItem({ status, value, desc, color }: any) {
  return (
    <div className="flex gap-3">
      <div className={cn("w-1 rounded-full", color)}></div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase">{status}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

