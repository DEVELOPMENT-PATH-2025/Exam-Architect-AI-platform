/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  FileText, 
  Layout, 
  GraduationCap, 
  ChevronRight, 
  CheckCircle2, 
  BrainCircuit,
  LogOut,
  PenTool,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { cn } from './lib/utils';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

// Components
import SyllabusUpload from './components/SyllabusUpload';
import Dashboard from './components/Dashboard';
import PracticeSessionUI from './components/PracticeSessionUI';
import MockPaperGenerator from './components/MockPaperGenerator';
import AuthUI from './components/AuthUI';
import WelcomePage from './components/WelcomePage';
import AIAssistantBot from './components/AIAssistantBot';
import ProfileSettings from './components/ProfileSettings';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'practice' | 'mock'>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let unsubscribeCurriculum: (() => void) | null = null;
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        unsubscribeCurriculum = listenToUserCurriculum(u.uid);
        unsubscribeProfile = listenToUserProfile(u.uid);
      } else {
        setLoading(false);
      }
    });

    const handleNavUpload = () => setActiveTab('upload');
    window.addEventListener('nav-to-upload', handleNavUpload);

    return () => {
      unsubscribeAuth();
      if (unsubscribeCurriculum) unsubscribeCurriculum();
      if (unsubscribeProfile) unsubscribeProfile();
      window.removeEventListener('nav-to-upload', handleNavUpload);
    };
  }, []);

  const listenToUserCurriculum = (uid: string) => {
    const q = query(collection(db, 'curricula'), where('userId', '==', uid));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setCurriculum({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'curricula');
    });
  };

  const listenToUserProfile = (uid: string) => {
    const docRef = doc(db, 'users', uid);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data());
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      setLoading(false);
    });
  };

  const updateSubjectProgress = async (subjectName: string, progress: number) => {
    if (!user || !curriculum) return;
    const path = `curricula/${curriculum.id}`;
    try {
      const updatedSubjects = curriculum.subjects.map((sub: any) => {
        if (sub.name === subjectName) {
          const currentProgress = sub.progress || 0;
          return { ...sub, progress: Math.max(currentProgress, progress) };
        }
        return sub;
      });

      const docRef = doc(db, 'curricula', curriculum.id);
      await setDoc(docRef, { subjects: updatedSubjects }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateProfile = async (data: any) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { 
        ...data, 
        userId: user.uid, 
        email: user.email,
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <BrainCircuit className="h-10 w-10 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {showAuth ? (
          <AuthUI onBack={() => setShowAuth(false)} />
        ) : (
          <WelcomePage onGetStarted={() => setShowAuth(true)} />
        )}
        <AIAssistantBot />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <SyllabusUpload onComplete={(c) => { setCurriculum(c); setActiveTab('dashboard'); }} />;
      case 'practice':
        return <PracticeSessionUI subject={selectedSubject} onBack={() => setActiveTab('dashboard')} onUpdateProgress={updateSubjectProgress} />;
      case 'mock':
        return <MockPaperGenerator curriculum={curriculum} onBack={() => setActiveTab('dashboard')} />;
      default:
        return (
          <Dashboard 
            curriculum={curriculum} 
            onStartPractice={(sub) => { setSelectedSubject(sub); setActiveTab('practice'); }}
            onGenerateMock={() => setActiveTab('mock')}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar - Professional Polish Style */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 text-slate-400">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight text-lg">ExamArchitect</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Academic Workspace</div>
          <NavItem 
            icon={<Layout className="w-4 h-4" />} 
            label="Syllabus Mapping" 
            active={activeTab === 'dashboard' || activeTab === 'upload'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<BrainCircuit className="w-4 h-4" />} 
            label="Question Architect" 
            active={activeTab === 'practice'} 
            disabled={!curriculum}
            onClick={() => setActiveTab('practice')} 
          />
          
          <div className="pt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Resources</div>
          <NavItem 
            icon={<FileText className="w-4 h-4" />} 
            label="Sample Papers" 
            active={activeTab === 'mock'} 
            disabled={!curriculum}
            onClick={() => setActiveTab('mock')} 
          />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700/50 shadow-inner">
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 opacity-70">Syllabus Status</div>
            <div className="text-white text-sm font-bold mb-3">{curriculum ? 'Active Curriculum' : 'Awaiting Data'}</div>
            
            {curriculum && (
              <button 
                onClick={() => setActiveTab('upload')}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all shadow-lg shadow-blue-900/40 active:scale-95 group"
              >
                <Upload className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                Next Curriculum
              </button>
            )}
          </div>
          
          <button 
            onClick={() => signOut(auth)}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Univ:</span>
              <span className="text-slate-900">{curriculum?.universityName || 'Not Set'}</span>
            </div>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Dept:</span>
              <span className="text-blue-600">{profile?.department || 'Set in Profile'}</span>
            </div>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Year:</span>
              <span className="text-slate-900">{profile?.year || 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('mock')}
              disabled={!curriculum}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Generate Full Mock Exam
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-3 pl-4 border-l border-slate-200 hover:opacity-75 transition-opacity text-left"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none mb-1">{profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Student'}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-none">Architect Profile</p>
              </div>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email || 'S'}&background=2563eb&color=fff`} 
                alt="Avatar" 
                className="h-8 w-8 rounded-lg bg-slate-200 ring-2 ring-slate-100 object-cover"
              />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      <AIAssistantBot context={curriculum ? JSON.stringify(curriculum) : undefined} />
      
      <AnimatePresence>
        {showSettings && (
          <ProfileSettings 
            profile={profile || { displayName: user.displayName || user.email }}
            onClose={() => setShowSettings(false)}
            onUpdate={updateProfile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, disabled, onClick }: { 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  disabled?: boolean,
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors",
        active 
          ? "bg-slate-800 text-white shadow-sm" 
          : "text-slate-400 hover:text-white hover:bg-slate-800",
        disabled && "opacity-30 cursor-not-allowed grayscale"
      )}
    >
      <span className={cn("shrink-0", active && "text-blue-500")}>{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

