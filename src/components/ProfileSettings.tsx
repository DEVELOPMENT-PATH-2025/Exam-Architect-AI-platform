import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  School, 
  Calendar, 
  Save, 
  X, 
  Camera, 
  GraduationCap, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2 
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { cn } from '../lib/utils';

interface ProfileSettingsProps {
  profile: any;
  onClose: () => void;
  onUpdate: (data: any) => Promise<void>;
}

export default function ProfileSettings({ profile, onClose, onUpdate }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || auth.currentUser?.displayName || '',
    university: profile?.university || '',
    department: profile?.department || '',
    year: profile?.year || '',
    bio: profile?.bio || ''
  });
  const [saving, setSaving] = useState(false);
  
  // Verification states - only status tracking
  const [isVerified, setIsVerified] = useState(
    Boolean(auth.currentUser?.emailVerified || profile?.isEmailVerified)
  );
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const targetEmail = profile?.email || auth.currentUser?.email || 'student@university.edu';

  // Automatically check live verification status on mount
  useEffect(() => {
    if (auth.currentUser) {
      auth.currentUser.reload().then(() => {
        const verified = Boolean(auth.currentUser?.emailVerified);
        setIsVerified(verified);
        if (verified && !profile?.isEmailVerified) {
          onUpdate({ isEmailVerified: true }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, []);

  // Poll / Refresh status when student checks (checks status only, no emails sent)
  const handleRefreshVerification = async () => {
    setCheckingStatus(true);
    setStatusMessage(null);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const refreshedState = Boolean(auth.currentUser.emailVerified);
        setIsVerified(refreshedState);
        if (refreshedState) {
          setStatusMessage({ text: "Success! Your email status is now verified.", type: "success" });
          onUpdate({ ...formData, isEmailVerified: true }).catch(() => {});
        } else {
          setStatusMessage({ 
            text: "Status: Unverified. Please check your inbox for the link sent when you registered.", 
            type: "info" 
          });
        }
      }
    } catch (err: any) {
      console.error("Error refreshing auth:", err);
      setStatusMessage({ text: "Could not refresh status. Please try again.", type: "error" });
    } finally {
      setTimeout(() => setCheckingStatus(false), 400);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (auth.currentUser && formData.displayName) {
        await updateAuthProfile(auth.currentUser, { displayName: formData.displayName }).catch(() => {});
      }
      await onUpdate({ ...formData, isEmailVerified: isVerified });
    } catch (err) {
      console.error("Error saving profile changes:", err);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-none">Student Profile & Credentials</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">Academic registration and verification status</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 text-white text-3xl font-black">
                {formData.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
              <button 
                type="button"
                className="absolute -bottom-1 -right-1 bg-white p-2 rounded-xl shadow-md border border-slate-100 text-blue-600 hover:scale-110 transition-transform cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-2">{formData.displayName || 'Candidate'}</p>
          </div>

          {/* Account Email & Verification Status Card (No manual send button) */}
          <div className={cn(
            "p-5 rounded-2xl border transition-all space-y-3",
            isVerified 
              ? "bg-emerald-50/70 border-emerald-200/80" 
              : "bg-amber-50/70 border-amber-200/80"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {isVerified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Registered Email
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {targetEmail}
                  </span>
                </div>
              </div>

              {/* Status Badge: Verified or Unverified */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Status: Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Status: Unverified
                  </span>
                )}

                {/* Auto check button */}
                <button
                  type="button"
                  disabled={checkingStatus}
                  onClick={handleRefreshVerification}
                  title="Check if verified"
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 text-blue-600", checkingStatus && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* Explanatory status text */}
            {isVerified ? (
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                ✓ Registered email is verified. Official performance reports and 500-question intensive archives include your verified student seal.
              </p>
            ) : (
              <div className="pt-1 border-t border-amber-200/60">
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Verification email arrives automatically on your registered mail address ({targetEmail}). Click the link in your inbox to complete verification.
                </p>
              </div>
            )}

            {/* Notification alert banner */}
            <AnimatePresence>
              {statusMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "p-3 rounded-xl text-xs font-medium border leading-relaxed",
                    statusMessage.type === 'success' ? "bg-emerald-100/80 border-emerald-300 text-emerald-900" :
                    statusMessage.type === 'error' ? "bg-red-100/80 border-red-300 text-red-900" :
                    "bg-blue-100/80 border-blue-300 text-blue-900"
                  )}
                >
                  {statusMessage.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">University / Institute</label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={formData.university}
                  onChange={(e) => setFormData({...formData, university: e.target.value})}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. RGPV Bhopal"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Department / Branch</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Computer Science & Engg"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Semester / Academic Year</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. 5th Sem / 3rd Year"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Academic Target / Bio</label>
            <textarea 
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Target SGPA 9.0+ in upcoming end-term university exams..."
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
