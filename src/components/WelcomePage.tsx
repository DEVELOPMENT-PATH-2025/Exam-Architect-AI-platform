import { motion } from 'motion/react';
import { BrainCircuit, BookOpen, FileText, Layout, ArrowRight, GraduationCap, Sparkles } from 'lucide-react';

export default function WelcomePage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-slate-900 font-black tracking-tighter text-xl">ExamArchitect AI</span>
          </div>
          <button 
            onClick={onGetStarted}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6">
              <Sparkles className="w-3 h-3" />
              Revolutionizing Semester Prep
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[0.9] mb-8">
              Architect Your <span className="text-blue-600">Perfect Score.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
              The ultimate AI study companion for university students. 
              Map your syllabus, practice 7-mark subjective patterns, 
              and generate massive 500-question archives targeted at your finals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onGetStarted}
                className="group flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-lg font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98]"
              >
                Start Studying Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <img 
                    key={i}
                    src={`https://ui-avatars.com/api/?name=User+${i}&background=random&color=fff`}
                    className="w-10 h-10 rounded-full border-4 border-white shadow-sm"
                    alt={`User ${i}`}
                  />
                ))}
                <div className="w-10 h-10 rounded-full bg-slate-900 border-4 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm uppercase tracking-tighter">
                  +2k
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* App Mockup / Visual Component */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative rounded-3xl bg-white border border-slate-200 shadow-2xl p-4 overflow-hidden"
          >
            {/* Browser Header Visual */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            
            {/* Dashboard Content Mockup */}
            <div className="mt-10 grid grid-cols-12 gap-4">
              <div className="col-span-3 bg-slate-900 rounded-2xl p-4 h-[400px] hidden md:block">
                <div className="w-full h-4 bg-slate-800 rounded-full mb-6" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-slate-700/50 rounded" />
                       <div className="flex-1 h-3 bg-slate-800 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 md:col-span-9 p-4">
                <div className="flex justify-between items-center mb-8">
                  <div className="space-y-1">
                    <div className="w-32 h-4 bg-slate-100 rounded-full" />
                    <div className="w-20 h-2 bg-slate-50 rounded-full" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500 shadow-lg shadow-blue-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                       <div className="flex justify-between mb-4">
                         <div className="w-8 h-8 rounded-lg bg-white" />
                         <div className="w-12 h-3 bg-blue-100 rounded-full" />
                       </div>
                       <div className="w-full h-3 bg-slate-200 rounded-full mb-2" />
                       <div className="w-2/3 h-2 bg-slate-100 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floaties */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3"
              >
                <Sparkles className="w-4 h-4" />
                AI ARCHITECT ACTIVE
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <h2 className="text-3xl font-black text-center text-slate-900 mb-16 uppercase tracking-tight">Core Study Engines</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={<Layout className="w-6 h-6 text-blue-600" />}
            title="Syllabus Mapping"
            desc="Upload your university PDF and our AI automatically extracts subjects, units, and priority topics for focused study. Transition between semesters with one click."
          />
          <FeatureCard 
            icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
            title="Question Architect"
            desc="Practice with 7-mark subjective questions modeled after Previous Year Papers. Includes real equations, derivations, and instant AI grading feedback."
          />
          <FeatureCard 
            icon={<FileText className="w-6 h-6 text-emerald-600" />}
            title="Intensive Archives"
            desc="Generate massive 500-question archives (100 per unit) optimized for semester finals. Each question is calibrated to your university's specific standards."
          />
          <FeatureCard 
            icon={<Sparkles className="w-6 h-6 text-amber-500" />}
            title="Robot Study Buddy"
            desc="A dedicated 24/7 AI tutor to solve your doubts, explain derivations, and guide you through complex university problem sets."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-blue-500" />
            <span className="text-white font-bold tracking-tight text-xl">ExamArchitect AI</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">© 2026 Architected for Students Worldwide.</p>
          <div className="flex items-center gap-4">
             <button onClick={onGetStarted} className="text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">Sign In</button>
             <button onClick={onGetStarted} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors uppercase tracking-widest">Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-400 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
