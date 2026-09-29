import { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  GraduationCap, 
  ChevronRight,
  CheckCircle2,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  PenTool,
  User,
  Building,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, db } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function AuthUI({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithGoogle();
      const user = userCredential.user;
      
      // Ensure the users document exists with basic info
      const profilePath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          userId: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Student',
          email: user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.WRITE, profilePath);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        const path = `users/${user.uid}`;
        try {
          await setDoc(doc(db, 'users', user.uid), {
            userId: user.uid,
            displayName: name,
            email,
            department,
            year,
            createdAt: serverTimestamp()
          });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.WRITE, path);
        }
      } else {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset email sent. Check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left: Interactive Educational Hero */}
      <div className="hidden lg:flex flex-col justify-center p-16 bg-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">ExamArchitect</span>
          </div>

          <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-8">
            The AI Architect for <span className="text-blue-500">Perfect Scorers.</span>
          </h1>
          
          <div className="space-y-6 mb-12">
            <FeatureItem 
              icon={<Sparkles className="w-5 h-5 text-blue-400" />}
              title="Hyper-Tailored Modules"
              desc="We parse your exact university syllabus to create calibrated practice sessions."
            />
            <FeatureItem 
              icon={<PenTool className="w-5 h-5 text-indigo-400" />}
              title="AI Evaluator Agent"
              desc="Get instant, professional-grade feedback on your long-form responses."
            />
            <FeatureItem 
              icon={<GraduationCap className="w-5 h-5 text-emerald-400" />}
              title="Exam Pattern Mimicry"
              desc="Generate mock papers that match your university's exact marks distribution."
            />
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                    U{i}
                  </div>
                ))}
              </div>
              <span className="text-sm text-slate-400 font-medium">Trusted by students from 50+ universities</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right: Modern Auth Form */}
      <div className="flex flex-col justify-center p-8 lg:p-24 bg-slate-50 relative">
        <div className="mx-auto w-full max-w-sm">
          <button 
            onClick={onBack}
            className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-[10px] uppercase tracking-widest group"
          >
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform text-blue-500" />
            Back to Welcome
          </button>

          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="text-slate-900 font-black text-2xl tracking-tight">ExamArchitect</span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Student Account' : 'Reset Password'}
            </h2>
            <p className="text-slate-500 text-sm">
              {mode === 'login' ? 'Sign in to sync your curriculum and progress' : mode === 'signup' ? 'Join thousands of students mastering their exams' : 'Enter your email to receive recovery instructions'}
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <button
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
              Continue with Google
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or email/password</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Student Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Academic Department</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Computer Science & Engineering"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Batch / year</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="3rd Year / 2026 Batch"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                {mode === 'signup' ? 'Personal Email Address' : 'Account Email'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@personal.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-100 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-600 border border-emerald-100 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                {success}
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Authenticate Workspace' : mode === 'signup' ? 'Initialize Architect Profile' : 'Send Recovery Packet'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            {mode === 'login' ? "New to the workspace?" : "Already configured?"}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
                setSuccess(null);
              }}
              className="text-blue-600 hover:text-blue-700 font-black"
            >
              {mode === 'login' ? 'Register Now' : 'Sign In'}
            </button>
          </p>

          <p className="mt-12 text-center text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em] leading-relaxed">
            By continuing, you agree to the ExamArchitect <br /> Protocol & Privacy Manifest.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
        <p className="text-slate-400 text-xs leading-relaxed max-w-xs">{desc}</p>
      </div>
    </div>
  );
}
