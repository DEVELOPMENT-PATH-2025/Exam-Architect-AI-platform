import { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';

interface HandwrittenInputPanelProps {
  imageDataUrl: string | null;
  onImageChange: (dataUrl: string | null, mimeType: string | null) => void;
  disabled?: boolean;
  compact?: boolean;
  onFilePickerTrigger?: () => void;
}

async function compressImageFile(file: File): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const result = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve({ dataUrl: result, mimeType: file.type || 'image/jpeg' });
      img.onload = () => {
        const maxWidth = 1600;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: result, mimeType: file.type || 'image/jpeg' });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const outUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ dataUrl: outUrl, mimeType: 'image/jpeg' });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export default function HandwrittenInputPanel({
  imageDataUrl,
  onImageChange,
  disabled = false,
  compact = false,
  onFilePickerTrigger
}: HandwrittenInputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processingFile, setProcessingFile] = useState(false);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingFile(true);
    try {
      const { dataUrl, mimeType } = await compressImageFile(file);
      onImageChange(dataUrl, mimeType);
    } catch (err) {
      console.error('Image processing failed:', err);
    } finally {
      setProcessingFile(false);
      e.target.value = '';
    }
  };

  const openCamera = async () => {
    if (disabled) return;
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onFilePickerTrigger?.();
      mobileCameraInputRef.current?.click();
      return;
    }

    try {
      setCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      stopCameraStream();
      setCameraOpen(false);
      // Graceful fallback to native camera/file picker when webcam permission is unavailable
      onFilePickerTrigger?.();
      mobileCameraInputRef.current?.click();
    }
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const maxW = 1600;
    const scale = w > maxW ? maxW / w : 1;
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      onImageChange(dataUrl, 'image/jpeg');
    }
    stopCameraStream();
    setCameraOpen(false);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
        disabled={disabled}
      />
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
        disabled={disabled}
      />

      {!imageDataUrl ? (
        <div
          className={`rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 ${
            compact ? 'p-4' : 'p-6'
          } flex flex-col sm:flex-row items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              {processingFile ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">
                Upload Handwritten Sheet or Snap Photo
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Works for handwritten 2-mark answers, 7-mark derivations, equations &amp; diagrams.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              disabled={disabled || processingFile}
              onClick={openCamera}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera</span>
            </button>
            <button
              type="button"
              disabled={disabled || processingFile}
              onClick={() => {
                onFilePickerTrigger?.();
                fileInputRef.current?.click();
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload Photo</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <img
            src={imageDataUrl}
            alt="Uploaded handwritten answer"
            className="w-full sm:w-28 h-28 object-cover rounded-xl border border-emerald-200 bg-white shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Handwritten Answer Photo Attached</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Gemini will read your handwriting, equations, and diagrams, transcribe them, and evaluate your marks against the university rubric.
            </p>
          </div>
          {!disabled && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onImageChange(null, null)}
                className="p-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                title="Remove Photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-black text-slate-900">Capture Handwritten Answer</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setCameraOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black relative aspect-video flex items-center justify-center">
              <video ref={videoRef} playsInline muted className="w-full h-full object-contain" />
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting camera...</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setCameraOpen(false);
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Upload File Instead
              </button>
              <button
                type="button"
                disabled={!cameraReady}
                onClick={captureSnapshot}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
