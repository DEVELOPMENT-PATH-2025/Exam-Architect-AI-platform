import { useState } from 'react';
import { Upload, FileUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { syllabusParsingAgent } from '../services/geminiService';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function SyllabusUpload({ onComplete }: { onComplete: (curriculum: any) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

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
      if (f.type === 'application/pdf') {
        setFile(f);
      } else {
        setError("Please upload a PDF file.");
      }
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString().split(',')[1] || "");
    reader.onerror = error => reject(error);
  });

  const processSyllabus = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = await toBase64(file);
      const data = await syllabusParsingAgent(base64);
      
      const path = 'curricula';
      let docRef;
      try {
        docRef = await addDoc(collection(db, path), {
          userId: auth.currentUser?.uid,
          ...data,
          createdAt: serverTimestamp()
        });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.CREATE, path);
      }

      if (docRef) {
        onComplete({ id: docRef.id, ...data });
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = typeof err.message === 'string' && err.message.startsWith('{') 
        ? "Permission error. Contact admin." 
        : "Failed to parse syllabus. Please try a different file.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-10 text-center">
        <h2 className="mb-2 text-2xl font-bold">Map Your Curriculum</h2>
        <p className="text-slate-500">Upload your university syllabus PDF to start generating practice sets tailored to your course.</p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all",
          dragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 bg-slate-50/30 hover:border-indigo-300 hover:bg-slate-50"
        )}
      >
        <input
          type="file"
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          accept=".pdf"
          onChange={(e) => e.target.files && setFile(e.target.files[0])}
        />
        
        <div className="flex flex-col items-center text-center">
            <div className={cn(
            "mb-4 rounded-xl p-4 transition-colors",
            file ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
          )}>
            {file ? <CheckCircle2 className="h-10 w-10" /> : <FileUp className="h-10 w-10" />}
          </div>
          
          {file ? (
            <div className="px-4 text-center">
              <p className="font-semibold text-slate-900">{file.name}</p>
              <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button 
                onClick={() => setFile(null)} 
                className="mt-2 text-xs font-semibold text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-bold text-slate-900">Map Your Academic Course</p>
              <p className="text-sm text-slate-400">Drag & drop your syllabus (PDF) or click to browse</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100"
        >
          <AlertCircle className="h-5 w-5" />
          {error}
        </motion.div>
      )}

      {file && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          disabled={loading}
          onClick={processSyllabus}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              AI Architect Extracting Curriculum...
            </>
          ) : (
            <>
              Initialize Syllabus Mapping
              <Upload className="h-5 w-5" />
            </>
          )}
        </motion.button>
      )}

    </div>
  );
}
