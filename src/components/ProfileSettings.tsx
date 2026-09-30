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
  Send,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { auth, sendEmailVerification } from '../lib/firebase';
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
  
  // Verification states
  const [isVerified, setIsVerified] = useState(
    Boolean(auth.currentUser?.emailVerified || profile?.isEmailVerified)
  );
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const targetEmail = profile?.email || auth.currentUser?.email || 'student@university.edu';

  // Check live auth state
  const handleRefreshVerification = async () => {
    setCheckingStatus(true);
    setStatusMessage(null);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const refreshedState = Boolean(auth.currentUser.emailVerified);
        setIsVerified(refreshedState);
        if (refreshedState) {
          setStatusMessage({ text: "Success! Your email is now verified.", type: "success" });
          // Update profile in database as well
          onUpdate({ ...formData, isEmailVerified: true }).catch(() => {});
        } else {
          setStatusMessage({ 
            text: "Still unverified. Please check your inbox or spam folder for the verification link.", 
            type: "info" 
          });
        }
      }
    } catch (err: any) {
      console.error("Error refreshing auth:", err);
      setStatusMessage({ text: "Could not refresh status. Please try again.", type: "error" });
    } finally {
      setTimeout(() => setCheckingStatus(false), 500);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    setSendingEmail(true);
    setStatusMessage(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setStatusMessage({
        text: `Verification link sent to ${auth.currentUser.email}. Click the link in your email and then click "Refresh Status" below.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error("Error sending verification email:", err);
      if (err?.code === 'auth/too-many-requests') {
        setStatusMessage({ text: "Too many requests. Please wait a minute before requesting another email.", type: 'error' });
      } else {
        setStatusMessage({ text: err.message || "Failed to send verification email.", type: 'error' });
      }
    } finally {
      setSendingEmail(false);
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-none">Student Profile & Verification</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">Manage academic credentials and verification status</p>
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

          {/* Account & Email Verification Status Card */}
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
                    Account Email
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {targetEmail}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="self-start sm:self-auto">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Unverified
                  </span>
                )}
              </div>
            </div>

            {/* Explanatory text & Actions */}
            {isVerified ? (
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                ✓ Your account email is verified. Official performance reports and PDF certificates will include your verified student seal.
              </p>
            ) : (
              <div className="space-y-3 pt-1 border-t border-amber-200/60">
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Your email is not verified yet. Verify via the confirmation email sent to your inbox to enable official verified status.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={sendingEmail}
                    onClick={handleSendVerificationEmail}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{sendingEmail ? 'Sending Link...' : 'Resend Verification Email'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={checkingStatus}
                    onClick={handleRefreshVerification}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5 text-blue-600", checkingStatus && "animate-spin")} />
                    <span>{checkingStatus ? 'Checking...' : 'Refresh Status'}</span>
                  </button>
                </div>
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
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3 text-blue-600" /> Full Name
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                placeholder="e.g. Amritanshu Tiwari"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <School className="w-3 h-3 text-blue-600" /> University
                </label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                  placeholder="e.g. RGPV"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap className="w-3 h-3 text-blue-600" /> Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                  placeholder="e.g. Computer Science / Law"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3 text-blue-600" /> Academic Year / Batch
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Final Year / Alumni">Final Year / Alumni</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] bg-blue-600 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
            >
              {saving ? (
                <>Saving Changes...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
