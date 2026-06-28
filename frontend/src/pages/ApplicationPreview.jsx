import { useJobStore } from '../store/useJobStore';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Mail, Copy, CheckCircle, AlertTriangle, ArrowLeft, Share2, Edit3, Eye, Target, Sparkles, X, RefreshCw, FileText, Plus, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import api, { API_BASE_URL } from '../api/axios';
import { toast } from '../components/Toast';

export default function ApplicationPreview() {
  const { jobData, generatedResume, generatedEmail, generatedCoverLetter, pdfUrl, score, matchedKeywords, missingKeywords } = useJobStore();
  const { user, updateProfile } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const fromHistory = location.state?.from === '/history';
  
  const [copied, setCopied] = useState(false);
  const [copiedCover, setCopiedCover] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [editData, setEditData] = useState(null);
  const [notification, setNotification] = useState('');
  const [addedKeywords, setAddedKeywords] = useState([]);
  const [addingKeyword, setAddingKeyword] = useState(null);

  const handleAddSkill = async (keyword) => {
    setAddingKeyword(keyword);
    try {
      const currentSkills = user?.skills || [];
      if (currentSkills.some(s => s.toLowerCase() === keyword.toLowerCase())) {
        toast.info(`"${keyword}" is already in your skills`);
        setAddedKeywords(prev => [...prev, keyword]);
        return;
      }
      await updateProfile({ skills: [...currentSkills, keyword] });
      setAddedKeywords(prev => [...prev, keyword]);
      toast.success(`Added "${keyword}" to your skills`);
    } catch (err) {
      toast.error('Failed to add skill');
    } finally {
      setAddingKeyword(null);
    }
  };

  const activeMissing = (missingKeywords || []).filter(kw => !addedKeywords.includes(kw));
  const activeMatched = [...(matchedKeywords || []), ...addedKeywords];

  if (!generatedResume && !generatedEmail && !generatedCoverLetter) {
    return <Navigate to="/job/new" />;
  }

  const handleCopy = () => {
    if (!generatedEmail) return;
    const fullEmail = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCover = () => {
    if (!generatedCoverLetter) return;
    navigator.clipboard.writeText(generatedCoverLetter);
    setCopiedCover(true);
    setTimeout(() => setCopiedCover(false), 2000);
  };

  const handleMail = () => {
    if (!generatedEmail) return;
    const subject = encodeURIComponent(generatedEmail.subject || '');
    const body = encodeURIComponent(generatedEmail.body || '');
    const to = jobData?.hrEmail ? encodeURIComponent(jobData.hrEmail) : '';
    // Build mailto: — include to: only if HR email was provided
    const mailto = to
      ? `mailto:${to}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Application for ${generatedResume?.name || user?.name || 'Candidate'}`,
          text: generatedEmail ? `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}` : generatedCoverLetter ? `Cover Letter:\n\n${generatedCoverLetter}` : 'Application materials attached.',
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      if (generatedEmail) handleCopy();
      setNotification('Content copied to clipboard (share not supported)');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const startEditing = () => {
    setEditData(JSON.stringify(generatedResume, null, 2));
    setActiveTab('edit');
  };


  const getScoreColor = () => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 50) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="py-8 max-w-7xl mx-auto space-y-6 mt-12">
      {/* Notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 z-50 bg-indigo-500/90 text-white px-4 py-2 rounded-xl text-sm backdrop-blur-md flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> {notification}
            <button onClick={() => setNotification('')}><X className="w-3 h-3 ml-2" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link to={fromHistory ? "/history" : "/job/new"} className="flex items-center gap-2 text-textMuted hover:text-white mb-3 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> {fromHistory ? "Back to History" : "New Application"}
          </Link>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Your application is ready</h1>
          <p className="text-textMuted">Tailored for this role. Download, copy, and apply.</p>
        </motion.div>
        
        {/* Score Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="flex items-center gap-4 glass-panel px-6 py-4"
        >
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#scoreGrad)" strokeWidth="3" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  {score >= 80 ? <><stop offset="0%" stopColor="#00E5FF" /><stop offset="100%" stopColor="#D4FF00" /></> :
                   score >= 50 ? <><stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#FBBF24" /></> :
                   <><stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#F87171" /></>}
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-white">{score}%</span>
          </div>
          <div>
            <div className="text-sm font-medium text-white">{getScoreLabel()}</div>
            <div className="text-xs text-textMuted">Match score</div>
          </div>
        </motion.div>
      </div>

      {/* Keyword Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeMatched.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-medium text-emerald-400">Matched keywords ({activeMatched.length})</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence>
                {activeMatched.map((kw, i) => (
                  <motion.span
                    key={kw}
                    initial={addedKeywords.includes(kw) ? { scale: 0, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    className="badge-emerald text-[10px]"
                  >
                    {addedKeywords.includes(kw) && <CheckCircle className="w-3 h-3 mr-0.5" />}
                    {kw}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeMissing.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-medium text-amber-400">Missing keywords ({activeMissing.length})</h4>
              <span className="text-[10px] text-amber-400/60 ml-auto">Click to add to your profile</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence>
                {activeMissing.map((kw) => (
                  <motion.button
                    key={kw}
                    exit={{ scale: 0, opacity: 0 }}
                    layout
                    onClick={() => handleAddSkill(kw)}
                    disabled={addingKeyword === kw}
                    className="badge-amber text-[10px] cursor-pointer hover:bg-amber-500/30 hover:border-amber-400/50 transition-all group flex items-center gap-1"
                  >
                    <Plus className={`w-3 h-3 group-hover:rotate-90 transition-transform ${addingKeyword === kw ? 'animate-spin' : ''}`} />
                    {kw}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Resume Column */}
        {generatedResume ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display text-white">Your resume</h2>
              <div className="flex gap-2">
                {pdfUrl && (
                  <a href={`${API_BASE_URL}${pdfUrl}`} download target="_blank" rel="noreferrer" className="btn-primary text-xs py-2 px-4 shadow-none">
                    <Download className="w-4 h-4" /> PDF
                  </a>
                )}
              </div>
            </div>
            
            <div className="glass-panel overflow-hidden">
              {activeTab === 'edit' ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-textMuted uppercase tracking-wider font-medium">Resume JSON Editor</span>
                    <button onClick={() => setActiveTab('preview')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </div>
                  <textarea
                    className="w-full bg-black/50 text-emerald-300 font-mono text-xs p-4 rounded-lg border border-white/10 focus:border-indigo-500/50 focus:outline-none min-h-[500px] resize-y"
                    value={editData}
                    onChange={e => setEditData(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-textMuted">You can copy your resume JSON here.</p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe src={`${API_BASE_URL}${pdfUrl}`} className="w-full h-[700px] rounded-lg border-none" title="PDF Preview" />
              ) : (
                <div className="p-8 text-center text-textMuted">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-400" />
                  <p className="font-medium text-white mb-1">PDF Generation In Progress</p>
                  <p className="text-sm mb-4">The PDF is being generated. If this persists, try regenerating the application.</p>
                  <details className="text-left">
                    <summary className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">View raw resume data</summary>
                    <pre className="mt-3 text-[10px] font-mono text-emerald-300 bg-black/50 p-4 rounded-lg overflow-auto max-h-[400px]">{JSON.stringify(generatedResume, null, 2)}</pre>
                  </details>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div></div>
        )}

        {/* Right Column: Email & Cover Letter */}
        <div className="space-y-8">
          {generatedEmail && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display text-white">Cold email</h2>
                <div className="flex gap-1">
                  <button onClick={handleCopy} className="p-2 text-textMuted hover:text-white transition-colors rounded-lg hover:bg-white/5" title="Copy Email">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={handleShare} className="p-2 text-textMuted hover:text-white transition-colors rounded-lg hover:bg-white/5" title="Share Email">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button onClick={handleMail} className="p-2 text-indigo-400 hover:text-indigo-300 transition-colors rounded-lg hover:bg-indigo-500/10" title="Open in Mail App">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="glass-panel p-6 space-y-5">
                <div>
                  <label className="text-xs text-textMuted uppercase font-bold tracking-wider">Subject</label>
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-white mt-1.5 text-sm">
                    {generatedEmail.subject}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-textMuted uppercase font-bold tracking-wider">Message</label>
                  <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-white mt-1.5 whitespace-pre-wrap font-sans leading-relaxed text-sm min-h-[150px]">
                    {generatedEmail.body}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {generatedCoverLetter && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display text-white">Cover letter</h2>
                <button onClick={handleCopyCover} className="p-2 text-textMuted hover:text-white transition-colors rounded-lg hover:bg-white/5" title="Copy Cover Letter">
                  {copiedCover ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="glass-panel p-6">
                <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-white whitespace-pre-wrap font-sans leading-relaxed text-sm min-h-[250px]">
                  {generatedCoverLetter}
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Tips */}
          <div className="glass-panel p-5 border-l-4 border-indigo-500">
            <h3 className="text-sm font-medium text-white mb-2">💡 Quick tips</h3>
            <ul className="text-xs text-textMuted space-y-1.5">
              <li>• Add the hiring manager's name to the email if you can find it</li>
              <li>• Attach your PDF resume when you send the email</li>
              <li>• Follow up after 5–7 business days if you don't hear back</li>
              <li>• Send between 8–10 AM in the recipient's timezone for best results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
