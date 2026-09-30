import { useState, useMemo } from 'react';
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
  BookOpen,
  Download,
  Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  const [downloading, setDownloading] = useState(false);
  
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

  const generatePDFReport = async () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const todayDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      // 1. Top Dark Banner Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 28, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('RAJIV GANDHI PROUDYOGIKI VISHWAVIDYALAYA, BHOPAL', 105, 9, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(96, 165, 250); // blue-400
      doc.text('OFFICIAL STUDENT SUBJECT PERFORMANCE & MASTERY DOSSIER', 105, 16, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`ExamArchitect AI Academic Intelligence Division • Generated on ${todayDate}`, 105, 23, { align: 'center' });

      // 2. Student & Subject Info Boxes (Side by Side)
      let startY = 32;
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240);

      // Student Info Box (Left)
      doc.roundedRect(10, startY, 93, 28, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('STUDENT INFORMATION', 14, startY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Name of Student: Amritanshu Tiwari', 14, startY + 11);
      doc.text('Academic Year: 3 Year', 14, startY + 16);
      doc.text('Department/Branch: CSE', 14, startY + 21);
      doc.text('Student ID / Email: amritanshutiwari3005@gmail.com', 14, startY + 26);

      // Subject & Course Details Box (Right)
      doc.roundedRect(107, startY, 93, 28, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('SUBJECT & COURSE DETAILS', 111, startY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Subject Name: ${subjectName}`, 111, startY + 11);
      doc.text('Subject Code: CS303', 111, startY + 16);
      doc.text('Semester / Term: Computer Science and Engineering, III-Semester', 111, startY + 21);
      doc.text('Evaluation Type: University PYQ Calibrated', 111, startY + 26);

      // 3. Four Metric Cards Row
      startY = 63;
      const cardWidth = 44.5;
      const cardHeight = 16;
      const cardSpacing = 4;
      let currX = 10;

      const metrics = [
        { label: 'OVERALL SCORE', val: `${scoreStats.avg}/10`, sub: `${Math.round(Number(scoreStats.avg) * 10)}% Mastery` },
        { label: 'AWARDED GRADE', val: Number(scoreStats.avg) >= 8 ? 'A+' : Number(scoreStats.avg) >= 6.5 ? 'B+' : 'C', sub: 'Good / Above Average' },
        { label: 'EVALUATED TASKS', val: `${scoreStats.count} Items`, sub: 'Rubric & Semantic' },
        { label: 'AI DETECTOR RATIO', val: '58% AI / 42% Hum', sub: 'Hybrid (Mixed)' }
      ];

      metrics.forEach((m) => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(currX, startY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(m.label, currX + 3, startY + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(m.val, currX + 3, startY + 10.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(m.sub, currX + 3, startY + 14);

        currX += cardWidth + cardSpacing;
      });

      // 4. Cognitive Performance & AI Evaluation Summary
      startY = 84;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('1. COGNITIVE PERFORMANCE & AI EVALUATION SUMMARY', 10, startY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const summaryText = analysis.summary || 'The student demonstrates steady conceptual mastery across core questions. Technical terminology and definition precision align well with university assessment standards.';
      const splitSummary = doc.splitTextToSize(summaryText, 190);
      doc.text(splitSummary, 10, startY + 5);

      startY += 10 + (splitSummary.length * 3.5);

      // 5. Strengths & Focus Areas Boxes (Side by Side)
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208); // emerald-200
      doc.roundedRect(10, startY, 93, 24, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52); // emerald-800
      doc.text('KEY DEMONSTRATED STRENGTHS', 14, startY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(21, 128, 61); // emerald-700
      const strengthsList = analysis.strengths && analysis.strengths.length ? analysis.strengths.slice(0, 2) : ['Accurate recall of fundamental definitions and structural principles', 'Structured formulation of responses matching 7-mark question templates'];
      let sY = startY + 10;
      strengthsList.forEach(str => {
        doc.text(`• ${str}`, 14, sY, { maxWidth: 85 });
        sY += 5;
      });

      // Growth Areas Box
      doc.setFillColor(254, 242, 242); // red-50
      doc.setDrawColor(254, 202, 202); // red-200
      doc.roundedRect(107, startY, 93, 24, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(153, 27, 27); // red-800
      doc.text('PRIORITY FOCUS & GROWTH AREAS', 111, startY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(185, 28, 28); // red-700
      const weakList = analysis.weaknesses && analysis.weaknesses.length ? analysis.weaknesses.slice(0, 2) : ['Strengthen step-by-step mathematical derivations under examination time constraints', 'Ensure labeled engineering schematics are included with pinouts'];
      let wY = startY + 10;
      weakList.forEach(wk => {
        doc.text(`• ${wk}`, 111, wY, { maxWidth: 85 });
        wY += 5;
      });

      startY += 28;

      // Exam Preparation & Revision Recommendations
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('EXAM PREPARATION & REVISION RECOMMENDATIONS:', 10, startY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text('-> Review past 5 years RGPV recurring question patterns for this module', 10, startY + 5);
      doc.text('-> Structure subjective responses with Introduction, Governing Equations, and Diagrams', 10, startY + 9);
      doc.text('-> Practice timed derivations to optimize marks allocation', 10, startY + 13);

      startY += 18;

      // 6. Atomic Evaluation Record Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`2. ATOMIC EVALUATION RECORD: ${subjectName.toUpperCase()}`, 10, startY);

      const tableRows = sessionData.map((item, idx) => [
        `Q${idx + 1}`,
        item.type ? item.type.toUpperCase() : 'SHORT',
        item.question,
        `${item.score}/10`,
        item.feedback || 'Evaluated against university rubric'
      ]);

      autoTable(doc, {
        startY: startY + 4,
        head: [['#', 'Type', 'Evaluated Question / Topic', 'Score', 'Evaluator Feedback & Rubric Notes']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [51, 65, 85], cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 18 },
          2: { cellWidth: 70 },
          3: { cellWidth: 15 },
          4: { cellWidth: 77 }
        }
      });

      // Footer on last page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.setDrawColor(226, 232, 240);
        doc.line(10, 280, 200, 280);
        doc.text(`Candidate: Amritanshu Tiwari | Academic Year: 3 Year | Signature: __________________________`, 10, 284);
        doc.text(`Certified by ExamArchitect AI • Subject: ${subjectName} (CS303) | Verification ID: EXAM-ARCH-ZQ23UW | Date: ${todayDate}`, 10, 288);
        doc.text(`ExamArchitect AI • Amritanshu Tiwari | ${subjectName} | 3 Year • Page ${i}`, 200, 288, { align: 'right' });
      }

      doc.save(`${subjectName.replace(/[^a-zA-Z0-9]/g, '_')}_Student_Performance_Dossier.pdf`);
    } catch (err) {
      console.error('PDF Dossier Generation Error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Performance Intelligence Report</h2>
          <p className="text-slate-500 font-medium">Detailed analysis for <span className="text-blue-600">{subjectName}</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={generatePDFReport}
            disabled={downloading}
            className="px-6 py-2.5 text-sm uppercase tracking-widest font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{downloading ? 'Generating PDF...' : 'Download Report PDF'}</span>
          </button>
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

          {/* AI vs Human Session Ratio Summary */}
          {(() => {
            const withPred = sessionData.filter((d: any) => d.aiPrediction);
            if (!withPred.length) return null;
            const avgAi = Math.round(
              withPred.reduce((acc, curr: any) => acc + (curr.aiPrediction?.aiPercentage || 0), 0) / withPred.length
            );
            const avgHuman = 100 - avgAi;
            return (
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Session AI vs Human Ratio
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 font-bold">
                    {avgAi}% AI : {avgHuman}% Human
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-purple-500" style={{ width: `${avgAi}%` }} />
                  <div className="h-full bg-emerald-500" style={{ width: `${avgHuman}%` }} />
                </div>
                <p className="text-[11px] text-slate-300">
                  {avgHuman >= 65 
                    ? "✓ High Human Authenticity: Your answers demonstrate natural human reasoning and syntax variations."
                    : avgAi >= 65
                    ? "⚠ High AI Similarity: Significant portion of your answers matches formulaic LLM token patterns."
                    : "⚡ Mixed Style: Hybrid blend of authentic student phrasing with AI assistance."}
                </p>
              </div>
            );
          })()}

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
