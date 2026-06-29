import { useAuthStore } from '../store/useAuthStore';
import { useJobStore } from '../store/useJobStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { FilePlus, FileText, UserCircle, Clock, Target, TrendingUp, Sparkles, ChevronRight, Download } from 'lucide-react';
import { API_BASE_URL } from '../api/axios';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { history, fetchHistory } = useJobStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const recentApps = history.slice(0, 4);
  const avgScore = history.length > 0 
    ? Math.round(history.reduce((sum, r) => sum + (r.keywordScore || 0), 0) / history.length) 
    : 0;

  const stagger = {
    initial: { opacity: 0, y: 30 },
    animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, type: 'spring', stiffness: 200, damping: 50 } }),
  };

  return (
    <div className="py-12 mt-8 relative">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-textMuted">All systems go</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-none mb-3">
            Command Center
          </h1>
          <p className="text-textMuted text-lg font-light max-w-xl">
            Welcome back, <span className="text-white font-medium">{user?.name}</span>. Here's where you left off.
          </p>
        </div>
        <Link to="/job/new">
          <button className="btn-primary w-full md:w-auto shadow-[0_0_30px_rgba(212,255,0,0.15)]">
            <Sparkles className="w-4 h-4" /> New Application
          </button>
        </Link>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <motion.div custom={0} variants={stagger} initial="initial" animate="animate" className="glass-panel p-8 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-5xl font-display font-bold text-white mb-1">{history.length}</div>
            <div className="text-sm font-medium text-textMuted uppercase tracking-widest">Resumes created</div>
          </div>
        </motion.div>

        <motion.div custom={1} variants={stagger} initial="initial" animate="animate" className="glass-panel p-8 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <Target className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-5xl font-display font-bold text-white mb-1">{avgScore}%</div>
            <div className="text-sm font-medium text-textMuted uppercase tracking-widest">Avg. match score</div>
          </div>
        </motion.div>

        <motion.div custom={2} variants={stagger} initial="initial" animate="animate" className="glass-panel p-8 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-5xl font-display font-bold text-white mb-1">{user?.skills?.length || 0}</div>
            <div className="text-sm font-medium text-textMuted uppercase tracking-widest">Skills on file</div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Actions */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-mono text-textMuted uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Quick Actions</h2>
          
          <Link to="/job/new" className="block w-full">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="group relative overflow-hidden glass-panel p-5 hover:bg-white/[0.04] transition-all border border-white/5 hover:border-primary/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-medium">New application</h3>
                  <p className="text-xs text-textMuted">Paste a JD and get started</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-textMuted group-hover:text-primary transition-colors group-hover:translate-x-1" />
            </motion.div>
          </Link>

          <Link to="/profile" className="block w-full">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="group relative overflow-hidden glass-panel p-5 hover:bg-white/[0.04] transition-all border border-white/5 hover:border-secondary/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 text-secondary">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Your profile</h3>
                  <p className="text-xs text-textMuted">Skills, experience & links</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-textMuted group-hover:text-secondary transition-colors group-hover:translate-x-1" />
            </motion.div>
          </Link>

          <Link to="/history" className="block w-full">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="group relative overflow-hidden glass-panel p-5 hover:bg-white/[0.04] transition-all border border-white/5 hover:border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-medium">History</h3>
                  <p className="text-xs text-textMuted">All your past resumes</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-textMuted group-hover:text-white transition-colors group-hover:translate-x-1" />
            </motion.div>
          </Link>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xs font-mono text-textMuted uppercase tracking-widest">Recent resumes</h2>
            <Link to="/history" className="text-xs text-secondary hover:text-white transition">See all →</Link>
          </div>
          
          {recentApps.length > 0 ? (
            <div className="space-y-4">
              {recentApps.map((resume, i) => (
                <motion.div
                  key={resume._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="group relative glass-panel overflow-hidden border border-white/5 hover:border-white/10 transition-colors"
                >
                  {/* Subtle hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-xl bg-surface border border-white/10">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={resume.keywordScore >= 80 ? '#D4FF00' : resume.keywordScore >= 50 ? '#00E5FF' : '#ffffff'} strokeWidth="2" strokeDasharray={`${resume.keywordScore}, 100`} strokeLinecap="round" />
                        </svg>
                        <span className="text-xs font-bold text-white">{resume.keywordScore}</span>
                      </div>
                      
                      <div>
                        <div className="text-white font-medium text-lg mb-1 group-hover:text-primary transition-colors">{resume.jobTitle}</div>
                        <div className="flex items-center gap-3 text-xs text-textMuted font-mono">
                          <span>{resume.companyName}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20"></span>
                          <span>{new Date(resume.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {resume.pdfFile && (
                      <a
                        href={`${API_BASE_URL}/uploads/pdfbuilds/${resume.pdfFile}`}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-textMuted hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex-shrink-0"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-panel border border-white/5 border-dashed p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-4 text-textMuted">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-white font-medium text-lg mb-2">No resumes yet</h3>
              <p className="text-sm text-textMuted max-w-sm">Paste a job description and we'll build your first tailored resume in seconds.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
