import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  FileText, 
  Scan, 
  Brain, 
  Target, 
  CloudUpload, 
  BookOpen, 
  PenTool, 
  Star, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  X, 
  GraduationCap, 
  ChevronRight,
  Shield,
  Clock,
  Award,
  Compass,
  Cpu,
  CheckCircle,
  FileCheck2,
  Users
} from 'lucide-react';

interface WelcomePageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

export default function WelcomePage({ onGetStarted, onLogin }: WelcomePageProps) {
  const [activeNav, setActiveNav] = useState<'home' | 'features' | 'how-it-works' | 'about'>('home');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeDemoSubject, setActiveDemoSubject] = useState(0);

  const demoSubjects = [
    { name: "Constitutional Law", code: "LAW-101", progress: 59, weak: 2, questions: "100+ PYQs" },
    { name: "Criminal Law", code: "LAW-102", progress: 90, weak: 0, questions: "120+ PYQs" },
    { name: "Contract Law", code: "LAW-103", progress: 20, weak: 4, questions: "95+ PYQs" },
    { name: "Administrative Law", code: "LAW-104", progress: 60, weak: 1, questions: "110+ PYQs" },
  ];

  const handleNavClick = (id: 'home' | 'features' | 'how-it-works' | 'about') => {
    setActiveNav(id);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'features') {
      document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (id === 'how-it-works') {
      document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (id === 'about') {
      document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-black tracking-tight text-slate-900">Exam</span>
                <span className="text-xl font-black tracking-tight text-blue-600">Architect</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 tracking-wider mt-1 uppercase">
                Your Syllabus • Your Strategy • Your Success
              </p>
            </div>
          </div>

          {/* Navigation Links - Pricing Removed */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            {[
              { id: 'home', label: 'Home' },
              { id: 'features', label: 'Features' },
              { id: 'how-it-works', label: 'How It Works' },
              { id: 'about', label: 'About' },
            ].map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as any)}
                  className="relative py-2 font-bold transition-colors hover:text-blue-600 cursor-pointer"
                >
                  <span className={isActive ? "text-blue-600" : "text-slate-600"}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin || onGetStarted}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200"
            >
              Login
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headlines & Call to Actions */}
            <div className="lg:col-span-6 space-y-6 text-left">
              
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Powered Exam Preparation</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
                Upload Your Syllabus. <br />
                Focus on What Matters. <br />
                <span className="text-blue-600 inline-block">Exam Architect</span>
              </h1>

              {/* Subtitle description */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
                Exam Architect helps students turn their university curriculum into a personalized study plan. Upload your syllabus, let our OCR extract and organize it subject-wise, identify your weak areas, practice smartly and get 500+ boost predicted questions from previous university exams.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/35 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Start Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowDemoModal(true)}
                  className="px-7 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Play className="w-3 h-3 fill-blue-600 ml-0.5" />
                  </div>
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>AI OCR Extraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>University Rubrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>70-Mark Mock Archive</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Dashboard & Process Flow */}
            <div className="lg:col-span-6 relative">
              
              {/* Playful Handwritten Annotation */}
              <div className="hidden sm:block absolute -top-8 left-12 z-20 pointer-events-none">
                <span className="font-serif italic text-blue-600 font-bold text-lg tracking-wide transform -rotate-6 block">
                  From Syllabus to Success ➔
                </span>
              </div>

              <div className="relative flex flex-col md:flex-row items-center gap-4">
                
                {/* 3D Stacked Book Spine Graphics (Left of Laptop) */}
                <div className="hidden xl:flex flex-col gap-1.5 shrink-0 z-10 -mr-6">
                  <div className="w-40 h-8 bg-slate-900 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center px-3 rounded-l-md shadow-md border-r-4 border-amber-400">
                    Constitutional Law
                  </div>
                  <div className="w-44 h-9 bg-slate-800 text-slate-100 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center px-3 rounded-l-md shadow-md border-r-4 border-blue-400">
                    Criminal Law
                  </div>
                  <div className="w-40 h-8 bg-amber-950 text-amber-200 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center px-3 rounded-l-md shadow-md border-r-4 border-amber-500">
                    Contract Law
                  </div>
                </div>

                {/* Laptop Mockup Box */}
                <div className="w-full bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border-4 border-slate-800 relative z-10">
                  
                  {/* Laptop Screen Bezel Top Bar */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 text-slate-400 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="font-mono text-slate-500 text-[10px]">app.examarchitect.ai</span>
                    <div className="w-4" />
                  </div>

                  {/* Inside Screen Content */}
                  <div className="bg-slate-50 rounded-2xl overflow-hidden text-slate-800 grid grid-cols-12 min-h-[360px]">
                    
                    {/* Sidebar on Laptop */}
                    <div className="col-span-3 bg-slate-900 text-slate-400 p-3 flex flex-col justify-between text-[10px] font-medium border-r border-slate-800">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-white font-bold pb-2 border-b border-slate-800">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[11px]">Exam Architect</span>
                        </div>
                        <div className="space-y-1">
                          <div className="p-1.5 bg-blue-600 text-white font-bold rounded-lg flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span>Dashboard</span>
                          </div>
                          <div className="p-1.5 hover:text-white rounded-lg flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 text-slate-500" />
                            <span>My Syllabus</span>
                          </div>
                          <div className="p-1.5 hover:text-white rounded-lg flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-slate-500" />
                            <span>Subjects</span>
                          </div>
                          <div className="p-1.5 hover:text-white rounded-lg flex items-center gap-1.5">
                            <PenTool className="w-3 h-3 text-slate-500" />
                            <span>Practice</span>
                          </div>
                          <div className="p-1.5 hover:text-white rounded-lg flex items-center gap-1.5">
                            <Star className="w-3 h-3 text-amber-400" />
                            <span>Boost Questions</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-600 font-mono">v2.5 Live AI</div>
                    </div>

                    {/* Main Screen Content on Laptop */}
                    <div className="col-span-9 p-4 flex flex-col justify-between space-y-3">
                      
                      {/* Welcome Banner */}
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Welcome Back!</h4>
                        <p className="text-[10px] text-slate-500">Let&apos;s make your preparation smarter.</p>
                      </div>

                      {/* Top Metric Cards */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[8px] font-bold uppercase text-slate-400 block">Total Subjects</span>
                          <span className="text-sm font-black text-blue-600">12</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[8px] font-bold uppercase text-slate-400 block">Weak Areas</span>
                          <span className="text-sm font-black text-amber-600">4</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[8px] font-bold uppercase text-slate-400 block">Practice Progress</span>
                          <span className="text-sm font-black text-emerald-600">68%</span>
                        </div>
                      </div>

                      {/* Your Subjects List */}
                      <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className="text-[10px] font-black text-slate-800">Your Subjects</span>
                          <span className="text-[9px] text-blue-600 font-bold">Active Semester</span>
                        </div>
                        
                        <div className="space-y-1">
                          {demoSubjects.map((sub, sIdx) => (
                            <div 
                              key={sIdx} 
                              onClick={() => setActiveDemoSubject(sIdx)}
                              className="flex items-center justify-between text-[9px] p-1 rounded hover:bg-slate-50 cursor-pointer"
                            >
                              <span className="font-bold text-slate-800 truncate max-w-[100px]">{sub.name}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 rounded-full" 
                                    style={{ width: `${sub.progress}%` }} 
                                  />
                                </div>
                                <span className="font-mono text-slate-500 text-[8px] w-6 text-right">{sub.progress}%</span>
                                <button 
                                  onClick={onGetStarted}
                                  className="px-1.5 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded text-[8px] font-bold transition-colors cursor-pointer"
                                >
                                  Start
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Process Cards (Right of Laptop) */}
                <div className="hidden sm:flex flex-col gap-2.5 shrink-0 z-10 w-52">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-slate-900 leading-tight">Upload Syllabus</h5>
                      <p className="text-[9px] text-slate-500">& Curriculum PDF</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Scan className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-slate-900 leading-tight">OCR Extracts</h5>
                      <p className="text-[9px] text-slate-500">Subject-wise mapping</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-slate-900 leading-tight">Find Weak Areas</h5>
                      <p className="text-[9px] text-slate-500">Target critical units</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-slate-900 leading-tight">Practice Smartly</h5>
                      <p className="text-[9px] text-slate-500">500+ Boost Questions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features-section" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
              Comprehensive Academic Toolset
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Features Built for Serious University Preparation
            </h2>
            <p className="text-base text-slate-500 leading-relaxed font-normal">
              Designed from the ground up to replace disorganized notes with calibrated, high-yield examination modules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 bg-slate-50/70 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Scan className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Instant Syllabus OCR</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload your semester syllabus PDF or course scheme. The engine extracts exact course codes, subject names, and all unit breakdown topics in seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-slate-50/70 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">7-Mark Question Architect</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generates 2-mark definitions, 7-mark subjective derivations, numerical sets, and architectural diagrams mirroring university exam standards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-slate-50/70 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">AI Examiner Evaluation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Submit your drafted answers and receive line-by-line step marks, keyword verification, missing concepts, and complete model solutions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-slate-50/70 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Star className="w-6 h-6 fill-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900">500+ Boost PYQ Archives</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Export comprehensive 500-question archives (100 per unit) equipped with recurrence probability indicators from previous university exams.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 bg-slate-50/70 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Weak Area Diagnostics</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The dashboard automatically flags units with below 50% mastery, routing you straight to high-priority revision modules before test day.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 bg-slate-50/70 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/30">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Official PDF Reports</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Print formatted mock test papers and comprehensive performance intelligence reports to share with academic counselors or study groups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. "How It Works" 5-Step Process Section */}
      <section id="how-it-works-section" className="py-24 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-14">
          
          <div className="space-y-3 max-w-2xl mx-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
              Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How It Works
            </h2>
            <p className="text-base text-slate-500 font-medium">
              Simple steps. Smarter preparation.
            </p>
          </div>

          {/* 5-Step Connected Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-3 p-6 bg-white rounded-3xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner border border-blue-100">
                <CloudUpload className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-black text-slate-900">1. Upload Your Syllabus</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your university curriculum and syllabus (PDF).
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-3 p-6 bg-white rounded-3xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100">
                <Scan className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-black text-slate-900">2. AI Extracts & Organizes</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our OCR technology extracts the content and splits it subject-wise.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-3 p-6 bg-white rounded-3xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner border border-purple-100">
                <BookOpen className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-black text-slate-900">3. Explore & Study</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Get your subjects, find your weak areas and start focused preparation.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center space-y-3 p-6 bg-white rounded-3xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all">
              <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner border border-orange-100">
                <PenTool className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-black text-slate-900">4. Practice Smartly</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Solve topic-wise questions and tests based on your performance.
              </p>
            </div>

            {/* Step 5 */}
            <div className="flex flex-col items-center text-center space-y-3 p-6 bg-white rounded-3xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center shadow-inner border border-red-100">
                <Star className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-black text-slate-900">5. Get 500 Boost Questions</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Access 500+ previously asked questions from your university exams to boost your score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. About Section */}
      <section id="about-section" className="py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
                About Exam Architect
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Empowering University Students to Study with Strategic Precision
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Exam Architect was created to solve a universal academic frustration: university syllabi are dense, semester timelines are tight, and generic online notes rarely match the exact grading rubrics or recurring questions of your specific institution.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                By bridging state-of-the-art document intelligence with pedagogical question design, Exam Architect transforms raw course PDFs into active, targeted mastery loops. We help students replace cramming with calm, structured exam preparation.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="text-2xl font-black text-blue-600 font-mono">100%</div>
                  <div className="text-xs font-bold text-slate-800">Syllabus-Aligned</div>
                  <p className="text-[11px] text-slate-500">Every module matches your uploaded semester outline.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="text-2xl font-black text-emerald-600 font-mono">500+</div>
                  <div className="text-xs font-bold text-slate-800">Recurring PYQs</div>
                  <p className="text-[11px] text-slate-500">Targeting the high-yield questions professors repeat.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="w-12 h-12 bg-blue-600/30 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/30">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white">Our 3 Core Academic Pillars</h3>
                
                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-sm mb-0.5">Active Recall over Passive Reading</strong>
                      <span className="text-slate-400 leading-relaxed">
                        Rather than rereading slides, drafting actual answers and receiving line-by-line mark breakdowns stimulates lasting retention.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-sm mb-0.5">Focus on What Carries Marks</strong>
                      <span className="text-slate-400 leading-relaxed">
                        Evaluates mandatory keywords, step derivations, and schematic diagrams demanded by end-semester evaluators.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-sm mb-0.5">Universal Academic Coverage</strong>
                      <span className="text-slate-400 leading-relaxed">
                        Calibrated for law, engineering, computer science, management, sciences, and commerce degree programs.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onGetStarted}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Get Started with Your Syllabus</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Bottom Call-To-Action Banner */}
      <section className="bg-slate-950 text-white py-12 relative overflow-hidden border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Left Tagline */}
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10 shrink-0">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-white">
                  Prepare Smarter. Score Higher.
                </h3>
                <p className="text-sm text-slate-400 mt-0.5 font-medium">
                  Because your hard work deserves the right direction.
                </p>
              </div>
            </div>

            {/* Middle Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center lg:text-left border-y lg:border-y-0 lg:border-x border-slate-800 py-4 lg:py-0 lg:px-8">
              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-blue-400">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-bold text-slate-200">Subject-wise</span>
                </div>
                <span className="text-[11px] text-slate-500">Organization</span>
              </div>

              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-purple-400">
                  <Brain className="w-4 h-4" />
                  <span className="text-xs font-bold text-slate-200">Identify</span>
                </div>
                <span className="text-[11px] text-slate-500">Weak Areas</span>
              </div>

              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-bold text-slate-200">500+</span>
                </div>
                <span className="text-[11px] text-slate-500">Boost Questions</span>
              </div>

              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold text-slate-200">Better Prep</span>
                </div>
                <span className="text-[11px] text-slate-500">Better Results</span>
              </div>
            </div>

            {/* Right Action Button */}
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. Interactive Demo Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 text-left space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Play className="w-5 h-5 fill-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Exam Architect Interactive Demo</h3>
                    <p className="text-xs text-slate-500">See how your syllabus turns into 500+ predicted questions</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-200/60 px-2 py-0.5 rounded-full text-blue-800">
                    Syllabus Mapping Engine
                  </span>
                  <p className="font-medium leading-relaxed">
                    Upload any PDF curriculum. Our parser breaks down every unit into 2-mark definitions, 7-mark subjective questions, and step-by-step derivations matching your university examination patterns.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-1">1. OCR Syllabus Extraction</strong>
                    <p className="text-slate-500">Instantly maps course codes, units, and subject modules.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-1">2. 500+ Question Archives</strong>
                    <p className="text-slate-500">High-yield previous year question frequency predictors.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDemoModal(false);
                    onGetStarted();
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Launch Workspace Now &rarr;
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
