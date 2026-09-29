import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Lightbulb, 
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PerformanceReportProps {
  sessionData: {
    question: string;
    score: number;
    feedback: string;
    type: string;
  }[];
  analysis: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    studyTips: string[];
  };
  subjectName: string;
  onExit: () => void;
  onRestart: () => void;
}

export default function PerformanceReport({ 
  sessionData, 
  analysis, 
  subjectName,
  onExit,
  onRestart
}: PerformanceReportProps) {
  
  const chartData = useMemo(() => {
    // Group scores by type
    const groups: { [key: string]: { sum: number, count: number } } = {};
    sessionData.forEach(item => {
      if (!groups[item.type]) groups[item.type] = { sum: 0, count: 0 };
      groups[item.type].sum += item.score;
      groups[item.type].count += 1;
    });

    return Object.keys(groups).map(type => ({
      subject: type.charAt(0).toUpperCase() + type.slice(1),
      A: (groups[type].sum / groups[type].count) * 10, // Scale to 100 for radar
      fullMark: 100
    }));
  }, [sessionData]);

  const scoreStats = useMemo(() => {
    const total = sessionData.reduce((acc, curr) => acc + curr.score, 0);
    return {
      avg: (total / sessionData.length).toFixed(1),
      max: Math.max(...sessionData.map(d => d.score)),
      count: sessionData.length
    };
  }, [sessionData]);

  const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Performance Intelligence Report</h2>
          <p className="text-slate-500 font-medium">Detailed analysis for <span className="text-blue-600">{subjectName}</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={onRestart} className="btn-secondary px-6 py-2.5 text-sm uppercase tracking-widest font-bold">New Session</button>
          <button onClick={onExit} className="btn-primary px-6 py-2.5 text-sm uppercase tracking-widest font-bold bg-slate-900 hover:bg-slate-800">Exit Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Key Stats */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Trophy className="w-32 h-32" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Subject Mastery</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-6xl font-black text-slate-900">{scoreStats.avg}</span>
              <span className="text-xl font-bold text-slate-300">/10</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Number(scoreStats.avg) * 10}%` }}
                className="h-full bg-blue-600 rounded-full"
              />
            </div>
            <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Based on {scoreStats.count} architected evaluations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Core Strengths</h4>
              </div>
              <ul className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="text-xs font-medium text-emerald-900 border-l-2 border-emerald-300 pl-3 py-1">{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800">Growth Areas</h4>
              </div>
              <ul className="space-y-2">
                {analysis.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs font-medium text-amber-900 border-l-2 border-amber-300 pl-3 py-1">{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Visual Analytics */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Cognitive Profiling</h4>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Retention</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar
                    name="Student Performance"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.15}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
             <div className="flex items-center gap-3 mb-6">
                <BrainCircuit className="w-6 h-6 text-blue-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-white">AI-Driven Insights</h4>
              </div>
              <p className="text-sm leading-relaxed text-slate-300 mb-8 font-medium">
                {analysis.summary}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis.studyTips.map((tip, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-xl hover:bg-white/10 transition-colors">
                    <Lightbulb className="w-5 h-5 text-yellow-400 mb-3" />
                    <p className="text-xs text-slate-200 leading-relaxed font-semibold">{tip}</p>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>

      {/* Individual Question Detail (Optional toggle in real apps, showing top scores here) */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Atomic Breakdown</h4>
           <BookOpen className="w-4 h-4 text-slate-400" />
        </div>
        <div className="divide-y divide-slate-100">
          {sessionData.map((item, i) => (
            <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded tracking-tighter">{item.type}</span>
                  <span className="text-xs font-bold text-slate-900 truncate max-w-md">{item.question}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed italic">{item.feedback.substring(0, 100)}...</p>
              </div>
              <div className="shrink-0 flex items-center gap-4">
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900 font-mono">{item.score}</span>
                  <span className="text-[10px] font-bold text-slate-300">/10</span>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  item.score >= 8 ? "bg-emerald-500" : item.score >= 5 ? "bg-amber-500" : "bg-red-500"
                )} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
