import { useEffect, useState } from 'react';
import { useJobStore } from '../store/useJobStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Trash2, Clock, Target, Calendar, Building2, ArrowLeft, Plus } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from '../components/Toast';
import { API_BASE_URL } from '../api/axios';

export default function History() {
  const { history, historyLoading, fetchHistory, deleteResume, loadFromHistory } = useJobStore();
  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedIds, setHighlightedIds] = useState(location.state?.newGeneratedIds || []);

  useEffect(() => {
    if (highlightedIds.length > 0) {
      const timer = setTimeout(() => {
        setHighlightedIds([]);
        // Clean up history state so a page refresh doesn't trigger it again
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedIds, navigate, location.pathname]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Auto-reset confirm after 3 seconds
  useEffect(() => {
    if (confirmId) {
      const timer = setTimeout(() => setConfirmId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmId]);

  const handleDelete = async (id) => {
    if (confirmId !== id) {
      setConfirmId(id);
      toast.warning('Click delete again to confirm');
      return;
    }
    setConfirmId(null);
    setDeleting(id);
    try {
      await deleteResume(id);
      toast.success('Resume deleted');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#D4FF00'; // chartreuse
    if (score >= 50) return '#00E5FF'; // cyan
    return '#ffffff';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-primary/10 text-primary border-primary/20';
    if (score >= 50) return 'bg-secondary/10 text-secondary border-secondary/20';
    return 'bg-white/10 text-white border-white/10';
  };

  return (
    <div className="py-12 max-w-5xl mx-auto mt-8 relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-textMuted hover:text-white mb-5 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 ml-2">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-textMuted">Your history</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-none mb-3">
              Resume History
            </h1>
            <p className="text-textMuted text-lg font-light">
              {history.length} resume{history.length !== 1 ? 's' : ''} created.
            </p>
          </div>
          <Link to="/job/new">
            <button className="btn-primary w-full md:w-auto">
              <Plus className="w-4 h-4" /> New resume
            </button>
          </Link>
        </div>

        {historyLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel p-6 animate-shimmer h-28" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-textMuted" />
            </div>
            <h3 className="text-2xl text-white font-display font-bold mb-2">No resumes yet</h3>
            <p className="text-textMuted mb-8 max-w-sm">Create your first application to see everything here.</p>
            <Link to="/job/new">
              <button className="btn-primary">Create your first resume</button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {history.map((resume, idx) => (
                <motion.div
                  key={resume._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`group relative glass-panel overflow-hidden border transition-all duration-500 ${
                    highlightedIds.includes(resume._id)
                      ? 'border-primary/50 shadow-[0_0_20px_rgba(212,255,0,0.15)]'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Shimmer hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div
                      className="flex items-center gap-5 flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        loadFromHistory(resume);
                        navigate('/job/preview', { state: { from: '/history' } });
                      }}
                    >
                      {/* Radial Score Ring */}
                      <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl bg-surface border border-white/10">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={getScoreColor(resume.keywordScore)} strokeWidth="2" strokeDasharray={`${resume.keywordScore}, 100`} strokeLinecap="round" />
                        </svg>
                        <span className="text-xs font-bold font-mono text-white">{resume.keywordScore}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-white font-semibold text-lg truncate group-hover:text-primary transition-colors">{resume.jobTitle || 'Untitled'}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-textMuted font-mono">
                          <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" />{resume.companyName || 'Unknown'}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20"></span>
                          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{formatDate(resume.createdAt)}</span>
                        </div>
                        {resume.missingKeywords?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {resume.missingKeywords.slice(0, 4).map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 bg-white/5 text-textMuted rounded text-[10px] border border-white/10">{kw}</span>
                            ))}
                            {resume.missingKeywords.length > 4 && (
                              <span className="px-2 py-0.5 text-textMuted/60 text-[10px]">+{resume.missingKeywords.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {resume.pdfFile && (
                        <a
                          href={`${API_BASE_URL}/uploads/pdfbuilds/${resume.pdfFile}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-textMuted hover:text-primary hover:border-primary/30 transition-all"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(resume._id)}
                        disabled={deleting === resume._id}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          confirmId === resume._id
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                            : 'bg-white/5 border border-white/10 text-textMuted/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
