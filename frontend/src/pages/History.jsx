import { useEffect, useState } from 'react';
import { useJobStore } from '../store/useJobStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Trash2, Clock, Target, Calendar, Building2, ArrowLeft, Plus, AlertTriangle, Search, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from '../components/Toast';
import { API_BASE_URL } from '../api/axios';

// ─── WhatsApp-style Delete Bottom Sheet ─────────────────────
function DeleteSheet({ resume, onConfirm, onCancel, isDeleting }) {
  return (
    <AnimatePresence>
      {resume && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onCancel}
          />

          {/* Bottom Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6"
          >
            <div className="max-w-md mx-auto bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Content */}
              <div className="px-6 pt-4 pb-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Delete resume?</p>
                    <p className="text-textMuted text-xs mt-0.5 truncate max-w-[220px]">
                      {resume.jobTitle || 'Untitled'}{resume.companyName ? ` · ${resume.companyName}` : ''}
                    </p>
                  </div>
                </div>

                <p className="text-textMuted text-sm mb-6 leading-relaxed">
                  This will permanently delete this resume. You can't undo this.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    disabled={isDeleting}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isDeleting}
                    className="flex-1 py-3 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" /> Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main History Page ───────────────────────────────────────
export default function History() {
  const { history, historyLoading, fetchHistory, deleteResume, loadFromHistory } = useJobStore();
  const [deleting, setDeleting] = useState(false);
  const [pendingResume, setPendingResume] = useState(null); // the resume waiting for confirm
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedIds, setHighlightedIds] = useState(location.state?.newGeneratedIds || []);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (highlightedIds.length > 0) {
      const timer = setTimeout(() => {
        setHighlightedIds([]);
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedIds, navigate, location.pathname]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Open the bottom sheet for a specific resume
  const handleDeleteClick = (resume) => {
    setPendingResume(resume);
  };

  // User confirmed delete inside the sheet
  const handleConfirmDelete = async () => {
    if (!pendingResume) return;
    setDeleting(true);
    try {
      await deleteResume(pendingResume._id);
      toast.success('Resume deleted');
      setPendingResume(null);
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (!deleting) setPendingResume(null);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#D4FF00';
    if (score >= 50) return '#00E5FF';
    return '#ffffff';
  };

  return (
    <>
      {/* WhatsApp-style Delete Sheet */}
      <DeleteSheet
        resume={pendingResume}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={deleting}
      />

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

          {/* Search Bar */}
          {history.length > 0 && (
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by role or company..."
                className="w-full pl-11 pr-10 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-textMuted/50 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg text-textMuted hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

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
          ) : (() => {
            const q = search.trim().toLowerCase();
            const filtered = q
              ? history.filter(r =>
                  (r.jobTitle || '').toLowerCase().includes(q) ||
                  (r.companyName || '').toLowerCase().includes(q)
                )
              : history;
            return filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-textMuted" />
                </div>
                <h3 className="text-xl text-white font-display font-bold mb-2">No results</h3>
                <p className="text-textMuted text-sm">No resumes match <span className="text-white font-medium">"{search}"</span></p>
                <button onClick={() => setSearch('')} className="mt-5 text-xs text-primary hover:text-white transition-colors">Clear search</button>
              </motion.div>
            ) : (
              <>
                {q && (
                  <p className="text-xs text-textMuted mb-3 pl-1">
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''} for <span className="text-white">"{search}"</span>
                  </p>
                )}
                <div className="space-y-3">
                <AnimatePresence>
                  {filtered.map((resume, idx) => (
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
                          onClick={() => handleDeleteClick(resume)}
                          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-textMuted/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              </div>
              </>
            );
          })()}
        </motion.div>
      </div>
    </>
  );
}
