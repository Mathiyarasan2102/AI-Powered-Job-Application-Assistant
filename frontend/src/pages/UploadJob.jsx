import { useState } from 'react';
import { useJobStore } from '../store/useJobStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, MessageSquare, Zap, CheckCircle, Loader2,
  FileSearch, FileText, Mail, Plus, Trash2, Image, ListFilter,
  ChevronRight, XCircle, BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/Toast';

const STEPS = [
  { label: 'Reading the job description', icon: FileSearch, duration: 'Picking out the key details...' },
  { label: 'Writing your resume', icon: FileText, duration: 'Tailoring it to this role...' },
  { label: 'Drafting your cold email', icon: Mail, duration: 'Personalizing for this company...' },
  { label: 'Building your PDF', icon: Zap, duration: 'Almost done...' }
];

export default function UploadJob() {
  const navigate = useNavigate();
  const { parseJob, generateApplication, batchMatch, loading } = useJobStore();

  // ── Mode: 'single' or 'batch'
  const [mode, setMode] = useState('single');

  // ── Single mode state
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [hrEmail, setHrEmail] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  // ── Batch mode state
  const [jdTexts, setJdTexts] = useState(['']);
  const [batchImages, setBatchImages] = useState([]);
  const [batchResults, setBatchResults] = useState(null); // { matched, skipped }
  const [generatingFor, setGeneratingFor] = useState(null); // index of job being generated
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generateAllProgress, setGenerateAllProgress] = useState({ current: 0, total: 0, done: 0, failed: 0 });

  // ── Generation Options
  const [genOpts, setGenOpts] = useState({
    resume: true,
    email: true,
    coverLetter: false
  });

  // ── Batch Generation Options
  const [batchGenOpts, setBatchGenOpts] = useState({
    resume: false,
    email: false,
    coverLetter: false
  });
  const [jobGenOpts, setJobGenOpts] = useState({}); // { [index]: { resume, email, coverLetter } }

  // ─────────────────────────────────────────────────────────
  // Single mode handlers
  // ─────────────────────────────────────────────────────────
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!text && !file) return toast.warning('Provide job text or upload an image');
    if (!genOpts.resume && !genOpts.email && !genOpts.coverLetter) return toast.warning('Please select at least one item to generate');
    const formData = new FormData();
    if (text) formData.append('jobText', text);
    if (file) formData.append('jobImage', file);
    try {
      setCurrentStep(0);
      const jobData = await parseJob(formData);
      // Attach optional HR email to jobData so preview can pre-fill mailto: To
      if (hrEmail.trim()) jobData.hrEmail = hrEmail.trim();
      setCurrentStep(1);
      await generateApplication(jobData, genOpts);
      setCurrentStep(3);
      setTimeout(() => navigate('/job/preview'), 500);
    } catch (err) {
      setCurrentStep(-1);
      toast.error(err.response?.data?.message || err.message || 'Failed to process job');
    }
  };

  // ─────────────────────────────────────────────────────────
  // Batch mode handlers
  // ─────────────────────────────────────────────────────────
  const addJdText = () => setJdTexts(prev => [...prev, '']);
  const removeJdText = (i) => setJdTexts(prev => prev.filter((_, idx) => idx !== i));
  const updateJdText = (i, val) => setJdTexts(prev => prev.map((t, idx) => idx === i ? val : t));

  const addBatchImages = (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    setBatchImages(prev => [...prev, ...arr].slice(0, 10));
  };
  const removeBatchImage = (i) => setBatchImages(prev => prev.filter((_, idx) => idx !== i));

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    const filledTexts = jdTexts.filter(t => t.trim());
    if (filledTexts.length === 0 && batchImages.length === 0) {
      return toast.warning('Add at least one JD text or image');
    }

    const formData = new FormData();
    formData.append('jdTexts', JSON.stringify(filledTexts));
    batchImages.forEach(img => formData.append('jobImages', img));

    try {
      setBatchResults(null);
      const result = await batchMatch(formData);
      setBatchResults(result);
      if (result.matchedCount === 0) {
        toast.warning(`No matching jobs found out of ${result.total} JDs analysed.`);
      } else {
        toast.success(`${result.matchedCount} matching job(s) found! Generate applications below.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Batch match failed');
    }
  };

  const handleGenerateForJob = async (job) => {
    const isBatchOptsActive = batchGenOpts.resume || batchGenOpts.email || batchGenOpts.coverLetter;
    const opts = isBatchOptsActive ? batchGenOpts : (jobGenOpts[job.index] || { resume: true, email: true, coverLetter: false });
    
    if (!opts.resume && !opts.email && !opts.coverLetter) {
      return toast.warning('Please select at least one item to generate');
    }

    setGeneratingFor(job.index);
    try {
      const jobData = {
        job_title: job.job_title,
        company_name: job.company_name,
        skills_required: job.skills_required || [],
        keywords: job.keywords || []
      };
      await generateApplication(jobData, opts);
      navigate('/job/preview');
    } catch (err) {
      setGeneratingFor(null);
      toast.error(err.response?.data?.message || err.message || 'Generation failed');
    }
  };

  const isBatchOptsActive = batchGenOpts.resume || batchGenOpts.email || batchGenOpts.coverLetter;

  const handleGenerateAll = async () => {
    const matched = batchResults?.matched || [];
    if (!matched.length) return;
    setGeneratingAll(true);
    setGenerateAllProgress({ current: 1, total: matched.length, done: 0, failed: 0 });
    let newGeneratedIds = [];
    let failed = 0;
    for (let i = 0; i < matched.length; i++) {
      const job = matched[i];
      setGeneratingFor(job.index);
      setGenerateAllProgress(p => ({ ...p, current: i + 1 }));
      try {
        const jobData = {
          job_title: job.job_title,
          company_name: job.company_name,
          skills_required: job.skills_required || [],
          keywords: job.keywords || []
        };
        
        const opts = isBatchOptsActive ? batchGenOpts : (jobGenOpts[job.index] || { resume: true, email: true, coverLetter: false });
        
        // Skip generating if nothing is selected for this specific job
        if (!opts.resume && !opts.email && !opts.coverLetter) {
          setGenerateAllProgress(p => ({ ...p, done: p.done + 1 }));
          continue;
        }

        const data = await generateApplication(jobData, opts);
        if (data?.resume?._id) {
          newGeneratedIds.push(data.resume._id);
        }
        setGenerateAllProgress(p => ({ ...p, done: p.done + 1 }));
      } catch (err) {
        failed++;
        setGenerateAllProgress(p => ({ ...p, done: p.done + 1, failed: p.failed + 1 }));
        console.warn(`Failed for ${job.job_title}:`, err.message);
      }
    }
    setGeneratingFor(null);
    setGeneratingAll(false);
    if (failed < matched.length) {
      toast.success(`Generated ${matched.length - failed}/${matched.length} applications! Saved to History.`);
      navigate('/history', { state: { newGeneratedIds } });
    } else {
      toast.error('All generations failed. Please try again.');
    }
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  const isBusy = loading;

  return (
    <div className="py-12 max-w-4xl mx-auto mt-8 relative">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-textMuted">Build resume</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-none mb-3">New Application</h1>
          <p className="text-textMuted text-lg font-light max-w-xl">
            Paste a job description and we'll write a tailored resume, cold email, and cover letter for that role.
          </p>
        </div>

        {/* ── Mode Toggle */}
        <div className="flex gap-2 mb-8 p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl w-fit">
          <button
            onClick={() => { setMode('single'); setBatchResults(null); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === 'single'
                ? 'bg-white text-black shadow-md'
                : 'text-textMuted hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Single JD
          </button>
          <button
            onClick={() => { setMode('batch'); setCurrentStep(-1); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === 'batch'
                ? 'bg-white text-black shadow-md'
                : 'text-textMuted hover:text-white'
            }`}
          >
            <ListFilter className="w-4 h-4" /> Batch Mode
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ════════════ LOADING STATE ════════════ */}
          {isBusy && mode === 'single' ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-12 border border-white/5"
            >
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5 relative">
                  <Zap className="w-8 h-8 text-primary" />
                  <div className="absolute inset-0 rounded-2xl animate-ping bg-primary/10"></div>
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Working on it...</h2>
                <p className="text-textMuted">This usually takes about 30–60 seconds.</p>
              </div>
              <div className="space-y-3 max-w-sm mx-auto">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                      i < currentStep ? 'bg-primary/5 border-primary/20' :
                      i === currentStep ? 'bg-white/5 border-white/10' :
                      'border-transparent opacity-30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      i < currentStep ? 'bg-primary/20' :
                      i === currentStep ? 'bg-white/10' : 'bg-white/5'
                    }`}>
                      {i < currentStep ? <CheckCircle className="w-4 h-4 text-primary" /> :
                       i === currentStep ? <Loader2 className="w-4 h-4 text-white animate-spin" /> :
                       <step.icon className="w-4 h-4 text-gray-600" />}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${
                        i < currentStep ? 'text-primary' : i === currentStep ? 'text-white' : 'text-gray-600'
                      }`}>
                        {step.label}
                      </div>
                      {i === currentStep && <div className="text-xs text-textMuted">{step.duration}</div>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          ) : mode === 'single' ? (
            /* ════════════ SINGLE MODE FORM ════════════ */
            <motion.form
              key="single-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSingleSubmit}
              className="space-y-6"
            >
              <div className="glass-panel p-8 border border-white/5 space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-white font-semibold mb-4 text-xs uppercase tracking-widest font-mono">
                    <MessageSquare className="w-4 h-4 text-primary" /> Paste the job description
                  </label>
                  <textarea
                    className="input-field min-h-[200px] resize-y"
                    placeholder="Paste the full job description here..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-white font-semibold mb-2 text-xs uppercase tracking-widest font-mono">
                    <Mail className="w-4 h-4 text-secondary" /> HR / Recruiter Email
                    <span className="text-textMuted font-normal normal-case tracking-normal text-[11px] ml-1">(optional — used to pre-fill the To: when you click Send)</span>
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="hr@company.com"
                    value={hrEmail}
                    onChange={e => setHrEmail(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-xs font-mono text-textMuted uppercase tracking-widest">AND / OR</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-white font-semibold mb-4 text-xs uppercase tracking-widest font-mono">
                    <UploadCloud className="w-4 h-4 text-secondary" /> Or upload a screenshot
                  </label>
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isDragging ? 'border-secondary bg-secondary/5 scale-[1.01]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'}`}
                  >
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <UploadCloud className="w-8 h-8 mb-3 text-secondary/60" />
                      <p className="text-sm text-textMuted"><span className="font-semibold text-white">Click to upload</span> or drag & drop</p>
                      <p className="text-xs text-textMuted/60 mt-1">JPG, JPEG, PNG</p>
                    </div>
                    <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} />
                  </label>
                  {file && (
                    <div className="mt-3 flex items-center gap-3 bg-secondary/5 border border-secondary/20 rounded-xl px-4 py-2.5">
                      <span className="text-sm text-secondary/80 font-mono truncate">{file.name}</span>
                      <button type="button" onClick={() => setFile(null)} className="text-textMuted hover:text-white text-xs transition-colors ml-auto">Remove</button>
                    </div>
                  )}
                </div>

                {/* GENERATION OPTIONS */}
                <div className="border border-white/[0.06] bg-white/[0.02] p-5 rounded-2xl space-y-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-textMuted">What to generate</p>
                  <div className="flex flex-wrap gap-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" className="sr-only" checked={genOpts.resume} onChange={e => setGenOpts(prev => ({ ...prev, resume: e.target.checked }))} />
                        <div className={`w-9 h-5 rounded-full transition-colors duration-300 ease-in-out ${genOpts.resume ? 'bg-primary' : 'bg-white/10 group-hover:bg-white/20'}`}></div>
                        <div className={`absolute left-0.5 ${genOpts.resume ? 'bg-black' : 'bg-white'} w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${genOpts.resume ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors select-none">Resume PDF</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" className="sr-only" checked={genOpts.email} onChange={e => setGenOpts(prev => ({ ...prev, email: e.target.checked }))} />
                        <div className={`w-9 h-5 rounded-full transition-colors duration-300 ease-in-out ${genOpts.email ? 'bg-primary' : 'bg-white/10 group-hover:bg-white/20'}`}></div>
                        <div className={`absolute left-0.5 ${genOpts.email ? 'bg-black' : 'bg-white'} w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${genOpts.email ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors select-none">Cold Email</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" className="sr-only" checked={genOpts.coverLetter} onChange={e => setGenOpts(prev => ({ ...prev, coverLetter: e.target.checked }))} />
                        <div className={`w-9 h-5 rounded-full transition-colors duration-300 ease-in-out ${genOpts.coverLetter ? 'bg-primary' : 'bg-white/10 group-hover:bg-white/20'}`}></div>
                        <div className={`absolute left-0.5 ${genOpts.coverLetter ? 'bg-black' : 'bg-white'} w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${genOpts.coverLetter ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors select-none">Cover Letter</span>
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || (!text && !file) || (!genOpts.resume && !genOpts.email && !genOpts.coverLetter)} className="btn-primary w-full py-5 text-base disabled:opacity-50">
                <Zap className="w-5 h-5" /> Generate application
              </button>
            </motion.form>

          ) : (
            /* ════════════ BATCH MODE ════════════ */
            <motion.div
              key="batch-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Batch input form — hide once results are shown */}
              {!batchResults && (
                <form onSubmit={handleBatchSubmit} className="glass-panel p-8 space-y-6">
                  {/* ── JD Text Inputs */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                      <label className="flex items-center gap-2 text-white font-medium">
                        <MessageSquare className="w-5 h-5 text-indigo-400" /> Job Descriptions
                        <span className="text-xs text-textMuted ml-1">(paste one per box)</span>
                      </label>
                      <button type="button" onClick={addJdText} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                        <Plus className="w-3 h-3" /> Add JD
                      </button>
                    </div>
                    <div className="space-y-4">
                      {jdTexts.map((t, i) => (
                        <div key={i} className="relative">
                          <textarea
                            className="input-field min-h-[140px] resize-y pr-10"
                            placeholder={`JD #${i + 1} — paste job description here...`}
                            value={t}
                            onChange={e => updateJdText(i, e.target.value)}
                          />
                          {jdTexts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeJdText(i)}
                              className="absolute top-2 right-2 text-red-400/50 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                    <div className="relative flex justify-center">
                      <span className="bg-surface px-4 text-sm text-textMuted">AND / OR</span>
                    </div>
                  </div>

                  {/* ── Batch Image Uploads */}
                  <div>
                    <label className="flex items-center gap-2 text-white font-medium mb-3 border-b border-white/10 pb-2">
                      <Image className="w-5 h-5 text-fuchsia-400" /> Upload JD Screenshots
                      <span className="text-xs text-textMuted ml-1">(up to 10 images)</span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30">
                      <div className="flex flex-col items-center justify-center pointer-events-none">
                        <UploadCloud className="w-8 h-8 mb-2 text-fuchsia-400" />
                        <p className="text-sm text-textMuted"><span className="font-semibold text-white">Click</span> to add images</p>
                        <p className="text-xs text-textMuted mt-1">JPG, JPEG, PNG — multiple allowed</p>
                      </div>
                      <input type="file" className="hidden" accept=".jpg,.jpeg,.png" multiple onChange={e => addBatchImages(e.target.files)} />
                    </label>
                    {batchImages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {batchImages.map((img, i) => (
                          <div key={i} className="flex items-center gap-2 bg-fuchsia-500/10 px-3 py-1.5 rounded-lg border border-fuchsia-500/20">
                            <Image className="w-3 h-3 text-fuchsia-400" />
                            <span className="text-xs text-fuchsia-300 max-w-[140px] truncate">{img.name}</span>
                            <button type="button" onClick={() => removeBatchImage(i)} className="text-fuchsia-400/50 hover:text-fuchsia-400">
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy || (jdTexts.every(t => !t.trim()) && batchImages.length === 0)}
                    className="btn-primary w-full py-4 text-lg"
                  >
                    {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ListFilter className="w-5 h-5" />}
                    {isBusy ? 'Matching your skills...' : 'Find matching jobs'}
                  </button>
                </form>
              )}

              {/* ── Batch Results */}
              {batchResults && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Summary bar */}
                  <div className="glass-panel p-5 border border-white/5 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <BarChart2 className="w-5 h-5 text-textMuted" />
                      <span className="text-white font-semibold font-mono">{batchResults.total} JD(s) analysed</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">{batchResults.matchedCount} matched</span>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-textMuted text-xs font-bold border border-white/10">{batchResults.skippedCount} skipped</span>
                    <div className="ml-auto flex items-center gap-3">
                      {batchResults.matchedCount > 0 && (
                        <div className="flex items-center gap-4 border-r border-white/10 pr-4 mr-2">
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input type="checkbox" className="sr-only" checked={batchGenOpts.resume} onChange={e => setBatchGenOpts(prev => ({ ...prev, resume: e.target.checked }))} />
                              <div className={`w-7 h-4 rounded-full transition-colors duration-300 ease-in-out ${batchGenOpts.resume ? 'bg-emerald-500' : 'bg-white/10 group-hover:bg-white/20'}`}></div>
                              <div className={`absolute left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${batchGenOpts.resume ? 'translate-x-3' : ''}`}></div>
                            </div>
                            <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors select-none">PDF</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input type="checkbox" className="sr-only" checked={batchGenOpts.email} onChange={e => setBatchGenOpts(prev => ({ ...prev, email: e.target.checked }))} />
                              <div className={`w-7 h-4 rounded-full transition-colors duration-300 ease-in-out ${batchGenOpts.email ? 'bg-emerald-500' : 'bg-white/10 group-hover:bg-white/20'}`}></div>
                              <div className={`absolute left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${batchGenOpts.email ? 'translate-x-3' : ''}`}></div>
                            </div>
                            <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors select-none">Email</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input type="checkbox" className="sr-only" checked={batchGenOpts.coverLetter} onChange={e => setBatchGenOpts(prev => ({ ...prev, coverLetter: e.target.checked }))} />
                              <div className={`w-7 h-4 rounded-full transition-colors duration-300 ease-in-out ${batchGenOpts.coverLetter ? 'bg-emerald-500' : 'bg-white/10 group-hover:bg-white/20'}`}></div>
                              <div className={`absolute left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${batchGenOpts.coverLetter ? 'translate-x-3' : ''}`}></div>
                            </div>
                            <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors select-none">Cover</span>
                          </label>
                        </div>
                      )}
                      {batchResults.matchedCount > 0 && (
                        <button
                          onClick={handleGenerateAll}
                          disabled={generatingAll || generatingFor !== null}
                          className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50"
                        >
                          {generatingAll
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> {generateAllProgress.current}/{generateAllProgress.total}...</>
                           : <><Zap className="w-4 h-4" /> Generate all</>}
                        </button>
                      )}
                      <button
                        disabled={generatingAll}
                        onClick={() => { setBatchResults(null); setBatchImages([]); setJdTexts(['']); }}
                        className="text-xs text-textMuted hover:text-white underline underline-offset-2 disabled:opacity-40"
                      >
                        ← Start over
                      </button>
                    </div>
                  </div>

                  {/* Generate All progress banner */}
                  {generatingAll && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-panel p-4 border border-emerald-500/30 flex items-center gap-4"
                    >
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium mb-1.5">
                          Generating application {generateAllProgress.current} of {generateAllProgress.total}...
                          {generateAllProgress.failed > 0 && <span className="text-red-400 ml-2">({generateAllProgress.failed} failed)</span>}
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(generateAllProgress.done / generateAllProgress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Matched jobs */}
                  {batchResults.matchedCount > 0 && (
                    <div>
                      <h3 className="text-white font-display font-semibold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest font-mono">
                        <CheckCircle className="w-4 h-4 text-primary" /> Matched Roles
                      </h3>
                      <div className="space-y-3">
                        {batchResults.matched.map((job, i) => (
                          <div key={i} className="group glass-panel p-5 flex flex-col sm:flex-row sm:items-center gap-5 border border-white/5 hover:border-primary/20 transition-all">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="text-white font-semibold">{job.job_title}</span>
                                {job.company_name && <span className="text-textMuted text-sm font-mono">@ {job.company_name}</span>}
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">{job.match_score}%</span>
                              </div>
                              <p className="text-textMuted text-sm">{job.reason}</p>
                              {job.skills_required?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {job.skills_required.slice(0, 6).map((s, si) => (
                                    <span key={si} className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs">{s}</span>
                                  ))}
                                  {job.skills_required.length > 6 && <span className="text-xs text-textMuted">+{job.skills_required.length - 6} more</span>}
                                </div>
                              )}
                            </div>
                            <div className={`flex flex-col gap-2 transition-all duration-300 ${isBatchOptsActive ? 'opacity-40 pointer-events-none' : ''}`}>
                              <div className="flex gap-3">
                                <label className="flex items-center gap-1.5 cursor-pointer group">
                                  <div className="relative flex items-center">
                                    <input type="checkbox" className="sr-only" checked={jobGenOpts[job.index]?.resume ?? true} onChange={e => setJobGenOpts(prev => ({ ...prev, [job.index]: { ...(prev[job.index] || { resume: true, email: true, coverLetter: false }), resume: e.target.checked } }))} />
                                    <div className={`w-6 h-3.5 rounded-full transition-colors duration-300 ease-in-out ${jobGenOpts[job.index]?.resume ?? true ? 'bg-indigo-500' : 'bg-white/10 group-hover:bg-white/20'}`}></div>
                                    <div className={`absolute left-[2px] bg-white w-2.5 h-2.5 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${jobGenOpts[job.index]?.resume ?? true ? 'translate-x-2.5' : ''}`}></div>
                                  </div>
                                  <span className="text-[10px] font-medium text-white/70 group-hover:text-white transition-colors select-none">PDF</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer group">
                                  <div className="relative flex items-center">
                                    <input type="checkbox" className="sr-only" checked={jobGenOpts[job.index]?.email ?? true} onChange={e => setJobGenOpts(prev => ({ ...prev, [job.index]: { ...(prev[job.index] || { resume: true, email: true, coverLetter: false }), email: e.target.checked } }))} />
                                    <div className={`w-6 h-3.5 rounded-full transition-colors duration-300 ease-in-out ${jobGenOpts[job.index]?.email ?? true ? 'bg-indigo-500' : 'bg-white/10 group-hover:bg-white/20'}`}></div>
                                    <div className={`absolute left-[2px] bg-white w-2.5 h-2.5 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${jobGenOpts[job.index]?.email ?? true ? 'translate-x-2.5' : ''}`}></div>
                                  </div>
                                  <span className="text-[10px] font-medium text-white/70 group-hover:text-white transition-colors select-none">Email</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer group">
                                  <div className="relative flex items-center">
                                    <input type="checkbox" className="sr-only" checked={jobGenOpts[job.index]?.coverLetter ?? false} onChange={e => setJobGenOpts(prev => ({ ...prev, [job.index]: { ...(prev[job.index] || { resume: true, email: true, coverLetter: false }), coverLetter: e.target.checked } }))} />
                                    <div className={`w-6 h-3.5 rounded-full transition-colors duration-300 ease-in-out ${jobGenOpts[job.index]?.coverLetter ?? false ? 'bg-indigo-500' : 'bg-white/10 group-hover:bg-white/20'}`}></div>
                                    <div className={`absolute left-[2px] bg-white w-2.5 h-2.5 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${jobGenOpts[job.index]?.coverLetter ?? false ? 'translate-x-2.5' : ''}`}></div>
                                  </div>
                                  <span className="text-[10px] font-medium text-white/70 group-hover:text-white transition-colors select-none">Cover</span>
                                </label>
                              </div>
                              <button
                                disabled={generatingFor !== null}
                                onClick={() => handleGenerateForJob(job)}
                                className="flex-shrink-0 btn-primary text-sm py-2.5 disabled:opacity-50 h-fit"
                              >
                                {generatingFor === job.index
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <ChevronRight className="w-4 h-4" />}
                                {generatingFor === job.index ? 'Generating...' : 'Generate'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skipped jobs */}
                  {batchResults.skippedCount > 0 && (
                    <div>
                      <h3 className="text-textMuted font-semibold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest font-mono">
                        <XCircle className="w-4 h-4 text-textMuted" /> Not a good fit
                      </h3>
                      <div className="space-y-2">
                        {batchResults.skipped.map((job, i) => (
                          <div key={i} className="glass-panel p-4 flex items-center gap-4 opacity-60">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-medium text-sm">{job.job_title}</span>
                                {job.company_name && <span className="text-textMuted text-xs">@ {job.company_name}</span>}
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">{job.match_score}% match</span>
                              </div>
                              <p className="text-textMuted text-xs mt-0.5">{job.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
