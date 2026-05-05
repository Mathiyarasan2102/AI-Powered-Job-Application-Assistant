import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, Bot, Zap, FileText, Mail, BarChart3, ChevronRight, Target } from 'lucide-react';


const FEATURES = [
  {
    icon: Target,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    title: 'ATS Score Matching',
    desc: 'Every generated resume is scored against your target JD\'s exact keywords, ensuring maximum ATS visibility.',
  },
  {
    icon: FileText,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
    title: 'PDF Resume Builder',
    desc: 'Instantly renders a pixel-perfect, professional PDF resume formatted for modern ATS systems.',
  },
  { 
    icon: Mail,
    color: 'text-white',
    bg: 'bg-white/10',
    border: 'border-white/10',
    title: 'Cold Email Engine',
    desc: 'Generates hyper-personalized, persuasive cold emails and cover letters tailored to each company.',
  },
  {
    icon: BarChart3,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    title: 'Batch Pipeline Mode',
    desc: 'Paste multiple JDs at once. The AI filters only roles that match your skill profile, then generates all at once.',
  },
];

const STEPS = [
  { num: '01', label: 'Set up Profile', desc: 'Upload your base resume or fill in your info once.' },
  { num: '02', label: 'Drop a JD', desc: 'Paste any job description or screenshot of a job post.' },
  { num: '03', label: 'Agent Executes', desc: 'AI generates your tailored resume, cold email & cover letter.' },
  { num: '04', label: 'Apply & Win', desc: 'Download your PDF and copy your email — ready to send.' },
];

export default function Landing() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <>
      {/* ── HERO ───────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 h-[700px] pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]"></div>
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[100px]"></div>
      </div>

      <section id="home" className="relative z-10 w-full min-h-[95vh] flex items-center justify-center pt-28 pb-16 px-4">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left: Copy */}
            <div className="text-left">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-textMuted">
                  AI Career Agent · Online
                </span>
              </motion.div>

              <motion.h1
                className="text-6xl md:text-7xl lg:text-[5.5rem] font-display font-extrabold leading-[1.02] tracking-tight mb-8"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
                <span className="text-white block">Dominate</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-[#a0ff60] to-secondary">
                  Every Job Post.
                </span>
              </motion.h1>

              <motion.p
                className="text-textMuted max-w-lg mb-10 text-lg leading-relaxed font-light"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.6 }}
              >
                Drop any job description. The AI engine instantly crafts a pixel-perfect, ATS-crushing resume and a tailored cold email — in under 60 seconds.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <Link to="/register" className="w-full sm:w-auto">
                  <button className="btn-primary w-full py-4 px-10 text-base shadow-[0_0_40px_rgba(212,255,0,0.2)]">
                    Deploy Agent Free <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <button className="btn-secondary w-full py-4 px-10 text-base">
                    System Login
                  </button>
                </Link>
              </motion.div>

              <motion.div
                className="flex flex-wrap items-center gap-6 text-sm text-textMuted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Zero configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>Instant PDF delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <span>100% free to start</span>
                </div>
              </motion.div>
            </div>

            {/* Right: Live Pipeline Visualization */}
            <motion.div
              className="relative mx-auto w-full max-w-lg hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {/* Glow backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-secondary/15 blur-[80px] rounded-full scale-110"></div>

              <div className="relative glass-panel border border-white/10 p-6 overflow-hidden">
                {/* Terminal header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-primary/50"></div>
                  </div>
                  <div className="text-[10px] text-textMuted uppercase font-mono tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    Pipeline Active
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { label: 'PARSING JD', color: 'text-primary', bar: 'w-full', done: true },
                    { label: 'EXTRACTING KEYWORDS', color: 'text-secondary', bar: 'w-11/12', done: true },
                    { label: 'GENERATING RESUME', color: 'text-white', bar: 'w-3/4', done: false },
                    { label: 'COMPILING PDF', color: 'text-textMuted', bar: 'w-0', done: false },
                  ].map((step, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${step.color}`}>{step.label}</span>
                        {step.done && <CheckCircle2 className="w-3 h-3 text-primary" />}
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${step.bar} rounded-full transition-all duration-1000 ${step.done ? 'bg-primary' : 'bg-white/20'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score readout */}
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-4 flex items-center gap-4">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#D4FF00" strokeWidth="3" strokeDasharray="92, 100" strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono text-white">92</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm mb-0.5">ATS Match Score</div>
                    <div className="text-xs text-primary font-mono font-bold">EXCELLENT · Ready to send</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── LOGO MARQUEE ─────────────────────────────── */}
      <motion.section
        className="border-y border-white/5 bg-white/[0.01] mb-28 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 1 }}
      >
        <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-background to-transparent z-10"></div>
        <div className="w-full py-8">
          <div className="flex gap-20 items-center justify-center animate-marquee whitespace-nowrap">
            {['GOOGLE', 'MICROSOFT', 'META', 'AMAZON', 'APPLE', 'NETFLIX', 'STRIPE', 'VERCEL'].concat(
              ['GOOGLE', 'MICROSOFT', 'META', 'AMAZON', 'APPLE', 'NETFLIX', 'STRIPE', 'VERCEL']
            ).map((logo, i) => (
              <span key={i} className="text-sm font-display font-extrabold text-white/15 uppercase tracking-[0.3em]">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section className="relative z-10 px-4 mb-32 max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-textMuted">Capabilities</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-4">
            Everything you need<br />to land the role.
          </h2>
          <p className="text-textMuted text-lg max-w-xl mx-auto font-light">
            One intelligent agent. Four weapons. All deployed the instant you paste a job description.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group glass-panel p-8 border border-white/[0.06] hover:border-white/10 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className={`w-12 h-12 rounded-2xl ${feature.bg} border ${feature.border} flex items-center justify-center mb-6`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-white font-display font-bold text-xl mb-3">{feature.title}</h3>
              <p className="text-textMuted text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="relative z-10 px-4 mb-32 max-w-6xl mx-auto">
        <div className="absolute left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5">
            <Zap className="w-3 h-3 text-secondary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-textMuted">Pipeline</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-4">
            From JD to offer letter<br />in four steps.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative glass-panel p-7 border border-white/[0.06] group hover:border-primary/20 transition-all"
            >
              <div className="text-5xl font-display font-extrabold text-white/5 mb-4 group-hover:text-primary/10 transition-colors">{step.num}</div>
              <h3 className="text-white font-bold text-lg mb-2">{step.label}</h3>
              <p className="text-textMuted text-sm leading-relaxed">{step.desc}</p>
              {i < STEPS.length - 1 && (
                <ChevronRight className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 hidden lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-32 max-w-4xl mx-auto text-center">
        <motion.div
          className="glass-panel p-16 border border-white/[0.06] relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
              <Bot className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-textMuted">Start Free</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-6 leading-tight">
              Your next job is<br />one click away.
            </h2>
            <p className="text-textMuted text-lg mb-10 max-w-lg mx-auto font-light">
              Stop sending generic resumes. Let the AI engine architect your next opportunity — in seconds.
            </p>
            <Link to="/register">
              <button className="btn-primary py-5 px-14 text-lg shadow-[0_0_50px_rgba(212,255,0,0.25)]">
                Initialize Your Agent <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
