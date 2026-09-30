import { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileDown, 
  Download, 
  Loader2, 
  ArrowLeft, 
  Printer, 
  FileText,
  Star,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generate500QuestionBank, BankQuestion, UnitSummary } from '../lib/questionBankGenerator';
import { cn } from '../lib/utils';

export default function MockPaperGenerator({ curriculum, onBack }: { curriculum: any, onBack: () => void }) {
  const [subject, setSubject] = useState(curriculum?.subjects[0]?.name || '');
  const [downloading, setDownloading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [activeUnitFilter, setActiveUnitFilter] = useState<number>(0); // 0 = all
  const [filterHighProbOnly, setFilterHighProbOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected subject data
  const selectedSub = useMemo(() => {
    return curriculum?.subjects.find((s: any) => s.name === subject) || curriculum?.subjects[0] || { name: subject, topics: [] };
  }, [curriculum, subject]);

  // Generate the full 500 questions data set (100 per unit across 5 units)
  const { questions, units } = useMemo(() => {
    return generate500QuestionBank(selectedSub.name, selectedSub.topics || []);
  }, [selectedSub]);

  // Filtered questions for the interactive in-app preview
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (activeUnitFilter !== 0 && q.unitIndex !== activeUnitFilter) return false;
      if (filterHighProbOnly && q.probabilityPercent < 85) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return q.text.toLowerCase().includes(query) || q.unitTitle.toLowerCase().includes(query) || q.category.toLowerCase().includes(query);
      }
      return true;
    });
  }, [questions, activeUnitFilter, filterHighProbOnly, searchQuery]);

  // PDF Generator for 500 Questions
  const generatePDF = async () => {
    setDownloading(true);
    setProgressMsg('Synthesizing 500-question archive across 5 units...');

    // Allow UI to paint the progress state
    await new Promise((r) => setTimeout(r, 80));

    try {
      setProgressMsg('Compiling university examination layout & predictor matrices...');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const universityName = curriculum?.universityName || 'Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal';
      const semester = curriculum?.semester || 'Semester End-Term Examination';
      const moduleCode = selectedSub.code || 'CS-Intensive';

      // 1. Cover / Title Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(universityName, 105, 18, { align: 'center' });

      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text(`Massive 500-Question Intensive Bank: ${selectedSub.name}`, 105, 26, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`Course Code: ${moduleCode} | Semester: ${semester} | 7 Marks per Question`, 105, 33, { align: 'center' });

      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.4);
      doc.line(10, 37, 200, 37);

      // 2. Predictor Analysis Legend Box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(10, 40, 190, 22, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(10, 40, 190, 22, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('AI PREDICTOR & FREQUENCY LEGEND:', 14, 45);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text('• Very High Probability (>90%): High recurrence in last 10 years (repeated 5-6x in PYQs). Mandatory exam target.', 14, 50);
      doc.text('• High Probability (80-89%): Recurring cyclic question (repeated 4x in PYQs). High probability of direct appearance.', 14, 54);
      doc.text('• Unit Distribution: Exactly 100 subjective questions per unit across 5 units = 500 Questions Total.', 14, 58);

      setProgressMsg('Rendering unit-wise question tables (100 Qs per unit)...');
      await new Promise((r) => setTimeout(r, 60));

      // 3. Build Table Rows with Unit Section Breaks
      const tableRows: any[] = [];

      units.forEach((unitSummary) => {
        // Section Header Row
        tableRows.push([
          {
            content: `${unitSummary.unitLabel.toUpperCase()}: ${unitSummary.title.toUpperCase()} (100 HIGH-YIELD QUESTIONS • Q${(unitSummary.unitIndex - 1) * 100 + 1} TO Q${unitSummary.unitIndex * 100})`,
            colSpan: 6,
            styles: {
              fillColor: [30, 41, 59], // slate-800
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 8.5,
              halign: 'left',
              cellPadding: 3
            }
          }
        ]);

        // 100 questions for this unit
        const unitQuestions = questions.filter(q => q.unitIndex === unitSummary.unitIndex);
        unitQuestions.forEach((q) => {
          tableRows.push([
            q.id.toString(),
            q.unitLabel,
            q.text,
            q.frequency.replace(' in PYQs ', '\n'),
            q.probability.replace(' ', '\n'),
            '7'
          ]);
        });
      });

      // 4. Generate AutoTable with 500 rows across pages
      autoTable(doc, {
        startY: 65,
        head: [['#', 'Unit', 'Subjective Long Architecture Question (7 Marks)', 'PYQ Frequency', 'Exam Prob.', 'Marks']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42], // slate-900
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2.5
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2.2,
          textColor: [30, 41, 59],
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 100 },
          3: { cellWidth: 34, halign: 'center', fontSize: 6.5 },
          4: { cellWidth: 20, halign: 'center', fontStyle: 'bold', fontSize: 7 },
          5: { cellWidth: 10, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 10, right: 10, top: 15, bottom: 15 },
        didParseCell: (data) => {
          // Highlight Very High Probability cells in column 4
          if (data.column.index === 4 && data.section === 'body' && typeof data.cell.raw === 'string') {
            if (data.cell.raw.includes('Very High')) {
              data.cell.styles.textColor = [185, 28, 28]; // red-700
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw.includes('High')) {
              data.cell.styles.textColor = [29, 78, 216]; // blue-700
            }
          }
        },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184); // slate-400
          
          // Running Header (pages > 1)
          if (data.pageNumber > 1) {
            doc.text(`${selectedSub.name} — 500-Question Intensive Bank (100 per Unit)`, 10, 8);
            doc.text(`AI Predictor & PYQ Frequency Analysis`, 200, 8, { align: 'right' });
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.2);
            doc.line(10, 10, 200, 10);
          }

          // Running Footer
          doc.text(`ExamArchitect AI • Semester End-Term Preparation • Page ${data.pageNumber} of ${pageCount}`, 105, 292, { align: 'center' });
        }
      });

      setProgressMsg('Saving PDF file...');
      doc.save(`${selectedSub.name.replace(/[^a-zA-Z0-9]/g, '_')}_500_Question_Bank.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setDownloading(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Header & Subject Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <button 
            onClick={onBack} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>500-Question Intensive Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            500 Question Bank & Predictor Analysis
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Exactly 100 questions per unit across 5 units with past-year frequency and probability of appearance.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Target Subject Selector */}
          <div className="relative">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-8"
            >
              {curriculum.subjects.map((s: any) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Download 500 Questions PDF Button */}
          <button
            disabled={downloading}
            onClick={generatePDF}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{progressMsg || 'Generating 500 Qs...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-blue-200" />
                <span>Download 500 Qs PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Unit-Wise Metric Cards (5 Units x 100 Qs = 500 Qs) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {units.map((u) => {
          const isSelected = activeUnitFilter === u.unitIndex;
          return (
            <button
              key={u.unitIndex}
              onClick={() => setActiveUnitFilter(isSelected ? 0 : u.unitIndex)}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden",
                isSelected 
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20" 
                  : "bg-white text-slate-800 border-slate-200/80 hover:border-blue-300"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider",
                  isSelected ? "text-blue-100" : "text-blue-600"
                )}>
                  {u.unitLabel}
                </span>
                <span className={cn(
                  "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
                  isSelected ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
                )}>
                  100 Qs
                </span>
              </div>
              <h4 className={cn(
                "text-xs font-black truncate mb-2",
                isSelected ? "text-white" : "text-slate-900"
              )}>
                {u.title}
              </h4>
              <div className="flex items-center justify-between text-[10px]">
                <span className={isSelected ? "text-blue-200" : "text-slate-400"}>High Prob:</span>
                <span className={cn("font-bold", isSelected ? "text-white" : "text-emerald-600")}>
                  {u.highProbabilityCount} Qs
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. In-App Interactive Question Browser & Predictor Filter */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveUnitFilter(0)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeUnitFilter === 0 
                  ? "bg-slate-900 text-white" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              All 500 Questions
            </button>
            {units.map((u) => (
              <button
                key={u.unitIndex}
                onClick={() => setActiveUnitFilter(u.unitIndex)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  activeUnitFilter === u.unitIndex 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {u.unitLabel} (100)
              </button>
            ))}

            <button
              onClick={() => setFilterHighProbOnly(!filterHighProbOnly)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border",
                filterHighProbOnly 
                  ? "bg-red-50 text-red-700 border-red-200" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <TrendingUp className="w-3.5 h-3.5 text-red-600" />
              <span>Very High Prob (&gt;85%)</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 500 questions..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing <strong>{filteredQuestions.length}</strong> of <strong>500</strong> strategic examination questions
          </span>
          <span className="text-[11px] text-blue-600 font-bold">
            Standard 7-Mark University Pattern
          </span>
        </div>

        {/* Questions Table Preview */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3 w-20">Unit</th>
                <th className="py-3 px-4">Subjective Architecture Question & Numerical</th>
                <th className="py-3 px-4 w-44">PYQ Frequency</th>
                <th className="py-3 px-3 w-32 text-center">Exam Prob.</th>
                <th className="py-3 px-3 w-16 text-center">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredQuestions.slice(0, 50).map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                    {q.id}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">
                    {q.unitLabel}
                  </td>
                  <td className="py-3 px-4 leading-relaxed text-slate-800">
                    <p className="font-semibold text-slate-900">{q.text}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {q.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    <span className="font-bold text-slate-900 block">{q.frequency.split(' in PYQs ')[0]}</span>
                    <span className="text-[10px] text-slate-400">{q.frequency.split(' in PYQs ')[1] || ''}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn(
                      "inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-wider",
                      q.probabilityPercent >= 90 ? "bg-red-50 text-red-700 border border-red-200" :
                      q.probabilityPercent >= 80 ? "bg-blue-50 text-blue-700 border border-blue-200" :
                      "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    )}>
                      {q.probability}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-slate-700">
                    7
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredQuestions.length > 50 && (
            <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
              <p className="text-xs font-bold text-slate-600 mb-2">
                Showing first 50 questions in web preview. The downloaded PDF contains all <strong>500 questions (100 per unit)</strong>.
              </p>
              <button
                disabled={downloading}
                onClick={generatePDF}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Complete 500-Question PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
