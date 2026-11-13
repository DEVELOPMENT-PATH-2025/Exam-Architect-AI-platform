import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { motion } from 'motion/react';
import {
  Trophy,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  BookOpen,
  Download,
  Loader2,
  Layers
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../lib/utils';

interface SessionReportItem {
  question: string;
  score: number;
  obtainedMarks?: number;
  questionMarks?: number;
  feedback: string;
  type: string;
}

interface PerformanceReportProps {
  sessionData: SessionReportItem[];
  analysis: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    studyTips: string[];
  };
  subjectName: string;
  subjectCode?: string;
  onExit: () => void;
  onRestart: () => void;
}

const getSectionMaxMarks = (type: string): number => {
  const t = (type || 'short').toLowerCase();
  if (t === 'long' || t === 'numerical') return 7;
  if (t === 'mcq') return 1;
  return 2;
};

const getSectionLabel = (type: string): string => {
  const t = (type || 'short').toLowerCase();
  if (t === 'long') return 'Long Answer';
  if (t === 'numerical') return 'Numerical';
  if (t === 'mcq') return 'MCQs';
  return 'Short Answer';
};

const getItemMarks = (item: SessionReportItem) => {
  const maxMarks = Number(item.questionMarks) || getSectionMaxMarks(item.type);
  let obtained =
    typeof item.obtainedMarks === 'number'
      ? item.obtainedMarks
      : (item.type || '').toLowerCase() === 'mcq'
        ? item.score >= 5
          ? 1
          : 0
        : Math.min(maxMarks, Math.round(((item.score / 10) * maxMarks) * 2) / 2);

  obtained = Math.min(maxMarks, Math.max(0, obtained));
  const pct = maxMarks > 0 ? Math.round((obtained / maxMarks) * 100) : 0;
  return { obtained, maxMarks, pct };
};

export default function PerformanceReport({
  sessionData,
  analysis,
  subjectName,
  subjectCode,
  onExit,
  onRestart
}: PerformanceReportProps) {
  const [downloading, setDownloading] = useState(false);

  const sectionBreakdown = useMemo(() => {
    const order = ['short', 'long', 'numerical', 'mcq'];
    const map: Record<
      string,
      {
        type: string;
        label: string;
        marksPerQ: number;
        count: number;
        obtained: number;
        total: number;
        pct: number;
      }
    > = {};

    sessionData.forEach((item) => {
      const t = (item.type || 'short').toLowerCase();
      const { obtained, maxMarks } = getItemMarks(item);
      if (!map[t]) {
        map[t] = {
          type: t,
          label: getSectionLabel(t),
          marksPerQ: getSectionMaxMarks(t),
          count: 0,
          obtained: 0,
          total: 0,
          pct: 0
        };
      }
      map[t].count += 1;
      map[t].obtained = Number((map[t].obtained + obtained).toFixed(1));
      map[t].total += maxMarks;
    });

    return Object.values(map)
      .map((sec) => ({
        ...sec,
        pct: sec.total > 0 ? Math.round((sec.obtained / sec.total) * 100) : 0
      }))
      .sort((a, b) => {
        const ia = order.indexOf(a.type);
        const ib = order.indexOf(b.type);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
  }, [sessionData]);

  const chartData = useMemo(() => {
    return sectionBreakdown.map((sec) => ({
      subject: sec.label,
      A: sec.pct,
      fullMark: 100
    }));
  }, [sectionBreakdown]);

  const scoreStats = useMemo(() => {
    let totalObtained = 0;
    let totalMax = 0;
    sessionData.forEach((item) => {
      const { obtained, maxMarks } = getItemMarks(item);
      totalObtained += obtained;
      totalMax += maxMarks;
    });
    totalObtained = Number(totalObtained.toFixed(1));
    const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    return {
      totalObtained,
      totalMax,
      overallPct,
      count: sessionData.length
    };
  }, [sessionData]);

  const generatePDFReport = async () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const todayDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      // 1. Top Dark Banner Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 28, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('RAJIV GANDHI PROUDYOGIKI VISHWAVIDYALAYA, BHOPAL', 105, 9, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(96, 165, 250);
      doc.text('OFFICIAL SECTION-WISE PRACTICE & MASTERY DOSSIER', 105, 16, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `ExamArchitect Academic Practice Report • Generated on ${todayDate}`,
        105,
        23,
        { align: 'center' }
      );

      // 2. Student & Subject Info Boxes
      let startY = 32;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(10, startY, 93, 28, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('STUDENT INFORMATION', 14, startY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text('Name of Student: Amritanshu Tiwari', 14, startY + 11);
      doc.text('Academic Year: 3 Year', 14, startY + 16);
      doc.text('Department/Branch: CSE', 14, startY + 21);
      doc.text('Student ID / Email: amritanshutiwari3005@gmail.com', 14, startY + 26);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(107, startY, 93, 28, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('SUBJECT & COURSE DETAILS', 111, startY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Subject Name: ${subjectName}`, 111, startY + 11, { maxWidth: 85 });
      doc.text(`Subject Code: ${subjectCode || 'CORE'}`, 111, startY + 16);
      doc.text('Marking Scheme: Short /2 | Long /7 | Num /7 | MCQ /1', 111, startY + 21);
      doc.text('Evaluation Type: University Rubric Calibrated', 111, startY + 26);

      // 3. Four Metric Cards Row (Zero AI Ratio)
      startY = 63;
      const cardWidth = 44.5;
      const cardHeight = 16;
      const cardSpacing = 4;
      let currX = 10;

      const grade =
        scoreStats.overallPct >= 80
          ? 'A+'
          : scoreStats.overallPct >= 65
            ? 'B+'
            : scoreStats.overallPct >= 40
              ? 'B'
              : 'C';

      const metrics = [
        {
          label: 'TOTAL MARKS',
          val: `${scoreStats.totalObtained}/${scoreStats.totalMax}`,
          sub: `${scoreStats.overallPct}% Overall`
        },
        {
          label: 'AWARDED GRADE',
          val: grade,
          sub: scoreStats.overallPct >= 65 ? 'Above Benchmark' : 'Needs Practice'
        },
        {
          label: 'PRACTICE ITEMS',
          val: `${scoreStats.count} Qs`,
          sub: `${sectionBreakdown.length} Sections`
        },
        {
          label: 'CONCEPT MASTERY',
          val: `${scoreStats.overallPct}%`,
          sub: scoreStats.overallPct >= 75 ? 'Exam Ready' : 'Building Depth'
        }
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

      // 4. Performance Summary
      startY = 84;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('1. COGNITIVE PERFORMANCE & PRACTICE SUMMARY', 10, startY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const summaryText =
        analysis.summary ||
        'Practice answers evaluated against section mark weightages and mandatory university keywords.';
      const splitSummary = doc.splitTextToSize(summaryText, 190);
      doc.text(splitSummary, 10, startY + 5);

      startY += 8 + splitSummary.length * 3.5;

      // 5. Strengths & Growth Areas
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(10, startY, 93, 22, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52);
      doc.text('KEY DEMONSTRATED STRENGTHS', 14, startY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(21, 128, 61);
      const strengthsList =
        analysis.strengths && analysis.strengths.length
          ? analysis.strengths.slice(0, 2)
          : ['Accurate recall of fundamental definitions and core terminology'];
      let sY = startY + 10;
      strengthsList.forEach((str) => {
        doc.text(`• ${str}`, 14, sY, { maxWidth: 85 });
        sY += 5;
      });

      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(107, startY, 93, 22, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(153, 27, 27);
      doc.text('PRIORITY FOCUS & GROWTH AREAS', 111, startY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(185, 28, 28);
      const weakList =
        analysis.weaknesses && analysis.weaknesses.length
          ? analysis.weaknesses.slice(0, 2)
          : ['Include all mandatory keywords and real-world examples for full credit'];
      let wY = startY + 10;
      weakList.forEach((wk) => {
        doc.text(`• ${wk}`, 111, wY, { maxWidth: 85 });
        wY += 5;
      });

      startY += 27;

      // 6. Section-by-Section Summary Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('2. SECTION-BY-SECTION PRACTICE BREAKDOWN', 10, startY);

      const sectionRows = sectionBreakdown.map((sec) => [
        sec.label.toUpperCase(),
        `/${sec.marksPerQ} Marks`,
        `${sec.count} Qs`,
        `${sec.obtained}/${sec.total}`,
        `${sec.pct}%`
      ]);

      autoTable(doc, {
        startY: startY + 3,
        head: [['Section', 'Weight / Q', 'Attempted', 'Section Marks', 'Mastery %']],
        body: sectionRows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5
        },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2.2 }
      });

      const afterSectionTableY = (doc as any).lastAutoTable?.finalY
        ? (doc as any).lastAutoTable.finalY + 7
        : startY + 35;

      // 7. Atomic Question-by-Question Record Table (Exact section mark scales)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`3. ATOMIC EVALUATION RECORD: ${subjectName.toUpperCase()}`, 10, afterSectionTableY);

      const tableRows = sessionData.map((item, idx) => {
        const { obtained, maxMarks } = getItemMarks(item);
        return [
          `Q${idx + 1}`,
          item.type ? item.type.toUpperCase() : 'SHORT',
          item.question,
          `${obtained}/${maxMarks}`,
          item.feedback || 'Evaluated against section rubric'
        ];
      });

      autoTable(doc, {
        startY: afterSectionTableY + 3,
        head: [['#', 'Section', 'Evaluated Question / Topic', 'Marks', 'Coach Feedback & Coverage Notes']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5
        },
        bodyStyles: { fontSize: 7, textColor: [51, 65, 85], cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 22 },
          2: { cellWidth: 68 },
          3: { cellWidth: 18 },
          4: { cellWidth: 72 }
        }
      });

      // Footer on all pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.setDrawColor(226, 232, 240);
        doc.line(10, 280, 200, 280);
        doc.text(
          `Candidate: Amritanshu Tiwari | Academic Year: 3 Year | Signature: __________________________`,
          10,
          284
        );
        doc.text(
          `ExamArchitect Practice Report • Subject: ${subjectName} (${subjectCode || 'CORE'}) | Date: ${todayDate}`,
          10,
          288
        );
        doc.text(
          `Amritanshu Tiwari | ${subjectName} • Page ${i} of ${pageCount}`,
          200,
          288,
          { align: 'right' }
        );
      }

      doc.save(`${subjectName.replace(/[^a-zA-Z0-9]/g, '_')}_Section_Performance_Report.pdf`);
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Section-by-Section Practice Report
          </h2>
          <p className="text-slate-500 font-medium">
            Detailed marks breakdown for <span className="text-blue-600">{subjectName}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generatePDFReport}
            disabled={downloading}
            className="px-6 py-2.5 text-sm uppercase tracking-widest font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloading ? 'Generating PDF...' : 'Download Report PDF'}</span>
          </button>
          <button
            onClick={onRestart}
            className="btn-secondary px-6 py-2.5 text-sm uppercase tracking-widest font-bold"
          >
            New Session
          </button>
          <button
            onClick={onExit}
            className="btn-primary px-6 py-2.5 text-sm uppercase tracking-widest font-bold bg-slate-900 hover:bg-slate-800"
          >
            Exit Report
          </button>
        </div>
      </div>

      {/* Section-by-Section Summary Cards */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">
              Section-by-Section Score Summary
            </h4>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Short (/2) • Long (/7) • Numerical (/7) • MCQs (/1)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectionBreakdown.map((sec) => (
            <div
              key={sec.type}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                  {sec.label}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {sec.count} {sec.count === 1 ? 'Question' : 'Questions'}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {sec.obtained}
                  </span>
                  <span className="text-sm font-bold text-slate-400 font-mono">/{sec.total}</span>
                </div>
                <span
                  className={cn(
                    'text-xs font-black font-mono',
                    sec.pct >= 75
                      ? 'text-emerald-600'
                      : sec.pct >= 40
                        ? 'text-blue-600'
                        : 'text-rose-600'
                  )}
                >
                  {sec.pct}%
                </span>
              </div>

              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    sec.pct >= 75
                      ? 'bg-emerald-500'
                      : sec.pct >= 40
                        ? 'bg-blue-600'
                        : 'bg-rose-500'
                  )}
                  style={{ width: `${Math.min(100, sec.pct)}%` }}
                />
              </div>
              <p className="text-[10px] font-semibold text-slate-500">
                Allotted out of {sec.marksPerQ} {sec.marksPerQ === 1 ? 'mark' : 'marks'} per question
              </p>
            </div>
          ))}
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
              Total Session Marks
            </p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black text-slate-900 font-mono">
                {scoreStats.totalObtained}
              </span>
              <span className="text-xl font-bold text-slate-300 font-mono">
                /{scoreStats.totalMax}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scoreStats.overallPct}%` }}
                className="h-full bg-blue-600 rounded-full"
              />
            </div>
            <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              {scoreStats.overallPct}% Mastery across {scoreStats.count}{' '}
              {scoreStats.count === 1 ? 'question' : 'questions'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                  Core Strengths
                </h4>
              </div>
              <ul className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs font-medium text-emerald-900 border-l-2 border-emerald-300 pl-3 py-1"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                  Growth Areas
                </h4>
              </div>
              <ul className="space-y-2">
                {analysis.weaknesses.map((w, i) => (
                  <li
                    key={i}
                    className="text-xs font-medium text-amber-900 border-l-2 border-amber-300 pl-3 py-1"
                  >
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Visual Analytics */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">
                Section Mastery Profiling
              </h4>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Section Accuracy (%)
                </span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar
                    name="Section Mastery %"
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
              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                Practice Insights &amp; Study Plan
              </h4>
            </div>
            <p className="text-sm leading-relaxed text-slate-300 mb-8 font-medium">
              {analysis.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.studyTips.map((tip, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 p-5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Lightbulb className="w-5 h-5 text-yellow-400 mb-3" />
                  <p className="text-xs text-slate-200 leading-relaxed font-semibold">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Atomic Breakdown (Marks allotted strictly per section: /2, /7, /7, /1) */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Atomic Breakdown (Section-Wise Marks)
          </h4>
          <BookOpen className="w-4 h-4 text-slate-400" />
        </div>
        <div className="divide-y divide-slate-100">
          {sessionData.map((item, i) => {
            const { obtained, maxMarks, pct } = getItemMarks(item);
            return (
              <div
                key={i}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded tracking-tighter">
                      {item.type}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate max-w-md">
                      {item.question}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    {item.feedback.length > 110
                      ? `${item.feedback.substring(0, 110)}...`
                      : item.feedback}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 font-mono">{obtained}</span>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      /{maxMarks}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
