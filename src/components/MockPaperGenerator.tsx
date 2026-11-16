import { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Download, 
  Loader2, 
  ArrowLeft, 
  Star,
  TrendingUp,
  Search,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { generate500QuestionBank } from '../lib/questionBankGenerator';
import { generateCheatSheetAgent } from '../services/geminiService';
import { cn } from '../lib/utils';

export default function MockPaperGenerator({ curriculum, onBack }: { curriculum: any, onBack: () => void }) {
  const [subject, setSubject] = useState(curriculum?.subjects[0]?.name || '');
  const [downloading, setDownloading] = useState(false);
  const [downloadingCheatSheet, setDownloadingCheatSheet] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]); // [] = all units (500 Qs)
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

  // Toggle a unit in multi-select mode
  const toggleUnit = (unitIndex: number) => {
    setSelectedUnits((prev) =>
      prev.includes(unitIndex)
        ? prev.filter((id) => id !== unitIndex)
        : [...prev, unitIndex].sort((a, b) => a - b)
    );
  };

  // Units currently targeted for preview & PDF download
  const targetUnits = useMemo(() => {
    if (selectedUnits.length === 0) return units;
    const matched = units.filter((u) => selectedUnits.includes(u.unitIndex));
    return matched.length > 0 ? matched : units;
  }, [units, selectedUnits]);

  const targetUnitNumbers = useMemo(() => targetUnits.map((u) => u.unitIndex), [targetUnits]);
  const totalExportQuestions = targetUnits.length * 100;
  const isCustomUnitSelection = selectedUnits.length > 0 && selectedUnits.length < units.length;

  const selectedUnitsBadge = useMemo(() => {
    if (!isCustomUnitSelection) return `All ${units.length} Units`;
    if (targetUnitNumbers.length === 1) return `Unit ${targetUnitNumbers[0]}`;
    return `Units ${targetUnitNumbers.join(', ')}`;
  }, [isCustomUnitSelection, units.length, targetUnitNumbers]);

  const downloadButtonLabel = isCustomUnitSelection
    ? `Download ${selectedUnitsBadge} PDF (${totalExportQuestions} Qs)`
    : `Download ${totalExportQuestions} Qs PDF`;

  // Filtered questions for the interactive in-app preview
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedUnits.length > 0 && !selectedUnits.includes(q.unitIndex)) return false;
      if (filterHighProbOnly && q.probabilityPercent < 85) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return q.text.toLowerCase().includes(query) || q.unitTitle.toLowerCase().includes(query) || q.category.toLowerCase().includes(query);
      }
      return true;
    });
  }, [questions, selectedUnits, filterHighProbOnly, searchQuery]);

  // PDF Generator for selected units (100 Qs per selected unit, up to 500 Qs)
  const generatePDF = async () => {
    setDownloading(true);
    setProgressMsg(`Synthesizing ${totalExportQuestions}-question archive (${selectedUnitsBadge})...`);

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
      const bankHeading = isCustomUnitSelection
        ? `${totalExportQuestions}-Question Bank (${selectedUnitsBadge}): ${selectedSub.name}`
        : `Massive 500-Question Intensive Bank: ${selectedSub.name}`;
      doc.text(bankHeading, 105, 26, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(
        `Course Code: ${moduleCode} | Semester: ${semester} | ${totalExportQuestions} Qs (${selectedUnitsBadge}) | 7 Marks per Question`,
        105,
        33,
        { align: 'center' }
      );

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
      doc.text('EXAM PREDICTOR & FREQUENCY LEGEND:', 14, 45);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text('• Very High Probability (>90%): High recurrence in last 10 years (repeated 5-6x in PYQs). Mandatory exam target.', 14, 50);
      doc.text('• High Probability (80-89%): Recurring cyclic question (repeated 4x in PYQs). High probability of direct appearance.', 14, 54);
      doc.text(
        `• Unit Distribution: 100 subjective questions per selected unit (${selectedUnitsBadge}) = ${totalExportQuestions} Questions Total.`,
        14,
        58
      );

      setProgressMsg(`Rendering ${targetUnits.length} selected ${targetUnits.length === 1 ? 'unit' : 'units'} (100 Qs each)...`);
      await new Promise((r) => setTimeout(r, 60));

      // 3. Build Table Rows ONLY for Selected Units
      const tableRows: any[] = [];

      targetUnits.forEach((unitSummary) => {
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
        const unitQuestions = questions.filter((q) => q.unitIndex === unitSummary.unitIndex);
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

      // 4. Generate AutoTable across pages
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
            doc.text(`${selectedSub.name} — ${totalExportQuestions}-Question Bank (${selectedUnitsBadge})`, 10, 8);
            doc.text(`PYQ Frequency & Probability Matrix`, 200, 8, { align: 'right' });
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.2);
            doc.line(10, 10, 200, 10);
          }

          // Running Footer
          doc.text(`ExamArchitect • Semester End-Term Preparation • Page ${data.pageNumber} of ${pageCount}`, 105, 292, { align: 'center' });
        }
      });

      setProgressMsg('Saving PDF file...');
      const sanitizedSubject = selectedSub.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = isCustomUnitSelection
        ? `${sanitizedSubject}_Units_${targetUnitNumbers.join('_')}_${totalExportQuestions}_Questions.pdf`
        : `${sanitizedSubject}_500_Question_Bank.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setDownloading(false);
      setProgressMsg('');
    }
  };

  // One-Click 2-Page Formula & Last-Minute Revision Cheat-Sheet PDF for Selected Units
  const generateCheatSheetPDF = async () => {
    setDownloadingCheatSheet(true);
    try {
      const sheetData = await generateCheatSheetAgent({
        subject: selectedSub.name,
        units: targetUnits.map((u) => ({
          unitIndex: u.unitIndex,
          unitLabel: u.unitLabel,
          title: u.title
        }))
      });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const moduleCode = selectedSub.code || 'CORE';

      // PAGE 1 HEADER
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 24, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(`LAST-MINUTE 2-PAGE REVISION CHEAT-SHEET`, 105, 9, { align: 'center' });
      doc.setFontSize(9.5);
      doc.setTextColor(96, 165, 250);
      doc.text(`${selectedSub.name} (${moduleCode}) • ${selectedUnitsBadge}`, 105, 16, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Definitions • Key Formulas • Comparison Matrix • Must-Use Keywords', 105, 21, { align: 'center' });

      // 1. CORE DEFINITIONS TABLE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('1. CORE DEFINITIONS & FUNDAMENTAL CONCEPTS', 10, 31);

      const defRows = (sheetData.definitions || []).slice(0, 10).map((d: any) => [
        d.unit || 'Unit',
        d.term || 'Concept',
        d.definition || ''
      ]);

      autoTable(doc, {
        startY: 34,
        head: [['Unit', 'Concept / Term', 'Crisp 1-Line Exam Definition']],
        body: defRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
          1: { cellWidth: 46, fontStyle: 'bold' },
          2: { cellWidth: 128 }
        },
        margin: { left: 10, right: 10 }
      });

      // 2. KEY FORMULAS & EQUATIONS
      const afterDefsY = ((doc as any).lastAutoTable?.finalY || 130) + 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('2. KEY FORMULAS, COMPLEXITIES & GOVERNING EQUATIONS', 10, afterDefsY);

      const formulaRows = (sheetData.formulas || []).slice(0, 8).map((f: any) => [
        f.unit || 'Unit',
        f.name || 'Formula',
        f.expression || '',
        f.usageNote || ''
      ]);

      autoTable(doc, {
        startY: afterDefsY + 3,
        head: [['Unit', 'Formula / Theorem', 'Expression / Bound', 'Exam Usage Tip']],
        body: formulaRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
          1: { cellWidth: 40, fontStyle: 'bold' },
          2: { cellWidth: 68, fontStyle: 'bold', textColor: [29, 78, 216] },
          3: { cellWidth: 66 }
        },
        margin: { left: 10, right: 10 }
      });

      // PAGE 2: COMPARISON TABLE & MUST-USE KEYWORDS
      doc.addPage();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 210, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235);
      doc.text(`${selectedSub.name} — Revision Cheat-Sheet (Page 2 of 2: Comparisons & Keywords)`, 105, 9, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('3. HIGH-YIELD COMPARISON MATRIX (FOR 7-MARK TABLES)', 10, 22);

      const compRows = (sheetData.comparisons || []).slice(0, 6).map((c: any) => [
        c.aspect || '',
        c.optionA || '',
        c.optionB || '',
        c.examTip || ''
      ]);

      autoTable(doc, {
        startY: 25,
        head: [['Parameter / Aspect', 'Model / Approach A', 'Model / Approach B', 'Paper-Checker Note']],
        body: compRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.2, textColor: [30, 41, 59], cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 34, fontStyle: 'bold' },
          1: { cellWidth: 48 },
          2: { cellWidth: 48 },
          3: { cellWidth: 60 }
        },
        margin: { left: 10, right: 10 }
      });

      const afterCompY = ((doc as any).lastAutoTable?.finalY || 110) + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('4. MUST-USE UNIVERSITY KEYWORDS BY UNIT (UNDERLINE IN EXAM)', 10, afterCompY);

      const kwRows = (sheetData.unitKeywords || []).map((uk: any) => [
        uk.unit || 'Unit',
        Array.isArray(uk.keywords) ? uk.keywords.join('  •  ') : ''
      ]);

      autoTable(doc, {
        startY: afterCompY + 3,
        head: [['Unit', 'Mandatory Technical Terms & Keywords to Highlight']],
        body: kwRows,
        theme: 'grid',
        headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42], cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 24, fontStyle: 'bold', halign: 'center' },
          1: { cellWidth: 166, fontStyle: 'bold' }
        },
        margin: { left: 10, right: 10 }
      });

      // Footers on both pages
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `ExamArchitect • 2-Page Last-Minute Revision Cheat-Sheet (${selectedUnitsBadge}) • Page ${p} of ${totalPages}`,
          105,
          292,
          { align: 'center' }
        );
      }

      const sanitizedSubject = selectedSub.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = isCustomUnitSelection
        ? `${sanitizedSubject}_Units_${targetUnitNumbers.join('_')}_Cheat_Sheet.pdf`
        : `${sanitizedSubject}_2Page_Revision_Cheat_Sheet.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Cheat-Sheet PDF Error:', err);
    } finally {
      setDownloadingCheatSheet(false);
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
            Select one or multiple units below to preview and download a custom question bank PDF (100 questions per unit).
          </p>
        </div>

          {/* Action Controls */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
            {/* Target Subject Selector */}
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setSelectedUnits([]);
                }}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-8"
              >
                {curriculum.subjects.map((s: any, idx: number) => (
                  <option key={`${s.code || 'sub'}-${s.name || 'item'}-${idx}`} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* One-Click 2-Page Formula & Revision Cheat-Sheet PDF */}
            <button
              disabled={downloadingCheatSheet || downloading}
              onClick={generateCheatSheetPDF}
              className="px-4 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              {downloadingCheatSheet ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Building Cheat-Sheet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    {isCustomUnitSelection
                      ? `2-Page Cheat-Sheet (${selectedUnitsBadge})`
                      : '2-Page Cheat-Sheet PDF'}
                  </span>
                </>
              )}
            </button>

            {/* Download Selected Units / Complete 500 Qs PDF Button */}
            <button
              disabled={downloading || downloadingCheatSheet}
              onClick={generatePDF}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{progressMsg || `Generating ${totalExportQuestions} Qs...`}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-blue-200" />
                  <span>{downloadButtonLabel}</span>
                </>
              )}
            </button>
          </div>
      </div>

      {/* 2. Multi-Select Unit-Wise Metric Cards (5 Units x 100 Qs = 500 Qs) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>Multi-Unit PDF Selection:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-black">
              {selectedUnitsBadge} • {totalExportQuestions} Qs Ready
            </span>
          </div>
          {selectedUnits.length > 0 && (
            <button
              onClick={() => setSelectedUnits([])}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to All 5 Units (500 Qs)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {units.map((u) => {
            const isSelected = selectedUnits.includes(u.unitIndex);
            return (
              <button
                key={u.unitIndex}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleUnit(u.unitIndex)}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden",
                  isSelected 
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20" 
                    : "bg-white text-slate-800 border-slate-200/80 hover:border-blue-300"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                        isSelected
                          ? "bg-white border-white text-blue-600"
                          : "bg-slate-50 border-slate-300 text-transparent"
                      )}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      isSelected ? "text-blue-100" : "text-blue-600"
                    )}>
                      {u.unitLabel}
                    </span>
                  </div>
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
      </div>

      {/* 3. In-App Interactive Question Browser & Predictor Filter */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedUnits([])}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                selectedUnits.length === 0 
                  ? "bg-slate-900 text-white" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              All 500 Questions
            </button>
            {units.map((u) => {
              const isSelected = selectedUnits.includes(u.unitIndex);
              return (
                <button
                  key={u.unitIndex}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleUnit(u.unitIndex)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5",
                    isSelected 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{u.unitLabel} (100)</span>
                </button>
              );
            })}

            <button
              type="button"
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
              placeholder={`Search ${totalExportQuestions} questions...`}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <span>
            Showing <strong>{filteredQuestions.length}</strong> of <strong>{totalExportQuestions}</strong> strategic examination questions ({selectedUnitsBadge})
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
              {filteredQuestions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs font-medium text-slate-500">
                    No matching questions found for the current search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredQuestions.length > 50 && (
            <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
              <p className="text-xs font-bold text-slate-600 mb-2">
                Showing first 50 questions in web preview. The downloaded PDF contains all{' '}
                <strong>{totalExportQuestions} questions ({selectedUnitsBadge}, 100 per unit)</strong>.
              </p>
              <button
                disabled={downloading}
                onClick={generatePDF}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {isCustomUnitSelection
                    ? `Download Selected ${totalExportQuestions}-Question PDF (${selectedUnitsBadge})`
                    : 'Download Complete 500-Question PDF'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
