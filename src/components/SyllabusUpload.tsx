import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  BookOpen,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Clipboard,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { syllabusParsingAgent } from '../services/geminiService';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { cn } from '../lib/utils';

export default function SyllabusUpload({ onComplete }: { onComplete: (curriculum: any) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<any>(null);

  // Clean up timer and object URL on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Support direct screenshot pasting with Ctrl+V / Cmd+V
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (extracting) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const pastedFile = new File([blob], `syllabus_screenshot_${Date.now()}.png`, { type: blob.type });
            startImmediateExtraction(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [extracting]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      const isImage = f.type.startsWith('image/') || Boolean(f.name.toLowerCase().match(/\.(png|jpe?g|webp|gif)$/i));
      if (isPdf || isImage) {
        startImmediateExtraction(f);
      } else {
        setError("Please upload a valid syllabus PDF or screenshot image (PNG, JPG, WebP).");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      startImmediateExtraction(f);
    }
  };

  const toBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => resolve(reader.result?.toString().split(',')[1] || "");
    reader.onerror = (err) => reject(err);
  });

  // Start extraction IMMEDIATELY upon file select/drop with smooth progress percentage
  const startImmediateExtraction = async (selectedFile: File) => {
    const isImage = selectedFile.type.startsWith('image/') || Boolean(selectedFile.name.toLowerCase().match(/\.(png|jpe?g|webp|gif)$/i));
    if (isImage) {
      try {
        setImagePreview(URL.createObjectURL(selectedFile));
      } catch (e) {
        console.warn("Could not generate image preview:", e);
      }
    } else {
      setImagePreview(null);
    }

    setFile(selectedFile);
    setExtracting(true);
    setError(null);
    setProgress(10);
    setStatusMessage(isImage 
      ? 'Scanning syllabus screenshot & running OCR vision...' 
      : 'Reading syllabus PDF stream & initializing OCR...');

    // Progress simulation while model parses
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setStatusMessage(isImage 
            ? 'Analyzing course titles, codes & unit modules in screenshot...' 
            : 'Analyzing university course schemes & semester codes...');
          return prev + 5;
        } else if (prev < 65) {
          setStatusMessage('Decomposing course units, modules & exam theorems...');
          return prev + 4;
        } else if (prev < 88) {
          setStatusMessage('Structuring interactive practice studio & 500-question banks...');
          return prev + 2;
        }
        return prev;
      });
    }, 450);

    try {
      // 1. Read base64
      const base64 = await toBase64(selectedFile);

      // 2. Call parsing API with detected mimeType
      const detectedMime = selectedFile.type || (isImage ? 'image/png' : 'application/pdf');
      const data = await syllabusParsingAgent(base64, selectedFile.name, detectedMime);

      // Advance to 92%
      setProgress(92);
      setStatusMessage('Finalizing curriculum database mapping...');

      // 3. Ensure authenticated session (anonymous if not logged in)
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.warn("Anonymous auth note:", authErr);
        }
      }

      // 4. Save to Firestore if available, but never block user if permissions fail
      let docId = `curriculum_${Date.now()}`;
      if (auth.currentUser) {
        try {
          const docRef = await addDoc(collection(db, 'curricula'), {
            userId: auth.currentUser.uid,
            ...data,
            createdAt: serverTimestamp()
          });
          docId = docRef.id;
        } catch (dbErr) {
          console.warn("Firestore save warning, continuing with local persistence:", dbErr);
        }
      }

      // 5. Always persist to localStorage for instant recovery
      const finalCurriculum = {
        id: docId,
        ...data,
        userId: auth.currentUser?.uid || 'guest_user',
        createdAt: Date.now()
      };
      try {
        localStorage.setItem('examarchitect_curriculum', JSON.stringify(finalCurriculum));
      } catch (storageErr) {
        console.warn("Local storage write error:", storageErr);
      }

      // 6. Complete loading at 100%
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setProgress(100);
      setStatusMessage('Curriculum extracted successfully! Launching Command Center...');

      setTimeout(() => {
        onComplete(finalCurriculum);
      }, 500);

    } catch (err: any) {
      console.error("Extraction error:", err);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setExtracting(false);
      setProgress(0);
      // Clean user-friendly message, never "Permission error. Contact admin"
      setError(
        err?.message?.includes("network") 
          ? "Network connection interrupted. Please try uploading again." 
          : "Unable to read syllabus file. Please verify the PDF or screenshot image is legible."
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      
      {/* Header */}
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Instant AI Curriculum Extraction</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Map Your Academic Curriculum
        </h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Upload your semester syllabus PDF or drop a screenshot of any subject syllabus. The engine decomposes courses into exact units, exam theorems, and practice modules immediately.
        </p>
      </div>

      {/* Main Upload / Progress Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        
        {!extracting ? (
          /* Dropzone */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all p-6 text-center group",
              dragActive 
                ? "border-blue-500 bg-blue-50/60 scale-[1.01]" 
                : "border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
            />
            
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <FileUp className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <ImageIcon className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Drop your Syllabus PDF or Screenshot here
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4 max-w-sm">
              Drag & drop full syllabus PDF, subject outline screenshot, or paste directly with <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px] text-slate-800 font-bold">Ctrl+V</kbd>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>PDF Syllabus</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Screenshot (PNG, JPG)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs">
                <Clipboard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paste (Ctrl+V)</span>
              </span>
            </div>
          </div>
        ) : (
          /* Live Animated Loading Bar with Exact Percentage */
          <div className="py-6 px-4 text-center space-y-6">
            
            {/* Spinning Indicator & Percentage Badge */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin absolute" />
                <span className="text-sm font-black font-mono text-slate-900">
                  {progress}%
                </span>
              </div>
            </div>

            {/* Thumbnail Preview if Screenshot was uploaded */}
            {imagePreview && (
              <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-xs relative group">
                <img 
                  src={imagePreview} 
                  alt="Syllabus Screenshot Preview" 
                  className="w-full h-32 object-cover object-top"
                />
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white text-[11px] font-bold">
                  <span>Vision OCR Scanning Screenshot</span>
                </div>
              </div>
            )}

            {/* Title & Filename */}
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                {imagePreview ? 'Analyzing Subject Screenshot' : 'Extracting Academic Syllabus'}
              </h3>
              {file && (
                <p className="text-xs text-slate-400 font-mono truncate max-w-sm mx-auto">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Dynamic Progress Bar */}
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-blue-600 font-black">Extraction Progress</span>
                <span className="text-slate-800">{progress}%</span>
              </div>

              {/* Bar track */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Status Message */}
              <p className="text-xs text-slate-500 font-medium pt-1 animate-pulse">
                {statusMessage}
              </p>
            </div>

            {/* Guarantee badge */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct OCR Extraction • No Admin Blockers</span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{error}</p>
              <button 
                onClick={() => { setError(null); fileInputRef.current?.click(); }}
                className="mt-1 text-red-800 underline font-bold cursor-pointer"
              >
                Click to try selecting another PDF
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Feature Footnote */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs">
          <span className="text-[10px] font-black uppercase text-blue-600 block mb-0.5">Instant OCR</span>
          <span className="text-xs text-slate-600 font-medium">Auto-detects course codes</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs">
          <span className="text-[10px] font-black uppercase text-blue-600 block mb-0.5">5 Units Mapped</span>
          <span className="text-xs text-slate-600 font-medium">100 questions per unit</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs">
          <span className="text-[10px] font-black uppercase text-blue-600 block mb-0.5">Auto-Save</span>
          <span className="text-xs text-slate-600 font-medium">Zero permission blockers</span>
        </div>
      </div>
    </div>
  );
}
