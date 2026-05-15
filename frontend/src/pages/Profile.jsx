import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, User, Briefcase, GraduationCap, Award, Plus, Trash2, Save, FileText, Link2, MapPin, Globe, Lock } from 'lucide-react';
import { toast } from '../components/Toast';

const TABS = [
  { id: 'upload', label: 'Upload PDF', icon: UploadCloud },
  { id: 'manual', label: 'Manual Entry', icon: FileText },
];

// ─── Skill Tag Input Component ───────────────────────────────
function SkillTagInput({ skills, onChange }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const addSkill = (raw) => {
    const trimmed = raw.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(input); }
    if (e.key === ',') { e.preventDefault(); addSkill(input); }
    if (e.key === 'Backspace' && input === '' && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  };

  const removeSkill = (idx) => onChange(skills.filter((_, i) => i !== idx));

  return (
    <div
      className="flex flex-wrap gap-2 p-3 min-h-[56px] bg-white/[0.04] border border-white/10 rounded-xl cursor-text focus-within:border-white/25 transition-colors"
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map((skill, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 text-white text-sm font-medium hover:border-white/20 transition-colors group"
        >
          {skill}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeSkill(i); }}
            className="text-textMuted hover:text-red-400 transition-colors leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addSkill(input); }}
        placeholder={skills.length === 0 ? 'Type a skill and press Enter...' : 'Add more...'}
        className="flex-1 min-w-[140px] bg-transparent text-white text-sm outline-none placeholder:text-textMuted/50 py-1"
      />
    </div>
  );
}

export default function Profile() {
  const { user, loadUser, updateProfile } = useAuthStore();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some(t => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'upload';
  const summaryRef = useRef(null);
  const initialFormRef = useRef(null);
  const [isFormReady, setIsFormReady] = useState(false);

  const autoResize = useCallback((el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  // Manual entry form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    summary: '',
    github: '',
    linkedin: '',
    portfolio: '',
    location: '',
    openToRemote: false,
    openToRelocate: false,
    skills: [''],
    experience: [{ title: '', company: '', location: '', startDate: '', endDate: '', description: [''] }],
    projects: [{ title: '', technologies: [''], description: [''], github: '', demo: '' }],
    education: [{ degree: '', institution: '', year: '', score: '' }],
    certifications: ['']
  });

  // Load user data into form whenever user changes
  useEffect(() => {
    if (user) {
      setIsFormReady(false);
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        summary: user.summary || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        portfolio: user.portfolio || '',
        location: user.location || '',
        openToRemote: Boolean(user.openToRemote),
        openToRelocate: Boolean(user.openToRelocate),
        skills: user.skills?.length ? [...user.skills] : [''],
        experience: user.experience?.length 
          ? user.experience.map(e => ({ ...e, description: e.description?.length ? [...e.description] : [''] }))
          : [{ title: '', company: '', location: '', startDate: '', endDate: '', description: [''] }],
        projects: user.projects?.length 
          ? user.projects.map(p => ({ ...p, technologies: p.technologies?.length ? [...p.technologies] : [''], description: p.description?.length ? [...p.description] : [''] }))
          : [{ title: '', technologies: [''], description: [''], github: '', demo: '' }],
        education: user.education?.length 
          ? user.education.map(e => ({ ...e }))
          : [{ degree: '', institution: '', year: '', score: '' }],
        certifications: user.certifications?.length ? [...user.certifications] : ['']
      });
    }
  }, [user]);

  // Capture the clean snapshot AFTER form state has settled from user data
  useEffect(() => {
    if (user && !isFormReady) {
      initialFormRef.current = JSON.stringify(form);
      setIsFormReady(true);
      autoResize(summaryRef.current);
    }
  }, [form, user, isFormReady, autoResize]);

  // Track if form has been modified (only meaningful once the form is ready)
  const isDirty = isFormReady && initialFormRef.current !== null && JSON.stringify(form) !== initialFormRef.current;

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    try {
      await api.post('/user/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadUser();
      toast.success('Profile updated from resume!');
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Clean empty strings from arrays
      const cleanedForm = {
        ...form,
        skills: form.skills.filter(s => s.trim()),
        experience: form.experience.filter(e => e.title.trim()).map(e => ({
          ...e,
          description: e.description.filter(d => d.trim())
        })),
        projects: form.projects.filter(p => p.title.trim()).map(p => ({
          ...p,
          technologies: p.technologies.filter(t => t.trim()),
          description: p.description.filter(d => d.trim())
        })),
        education: form.education.filter(e => e.degree.trim() || e.institution.trim()),
        certifications: form.certifications.filter(c => c.trim())
      };
      await updateProfile(cleanedForm);
      // Reset dirty tracking to current form so button goes disabled again
      initialFormRef.current = JSON.stringify(form);
      setIsFormReady(true);
      toast.success('Profile saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Generic helpers for dynamic array fields
  const addToArray = (key) => {
    setForm(f => ({ ...f, [key]: [...f[key], ''] }));
  };
  const updateArray = (key, idx, val) => {
    setForm(f => {
      const arr = [...f[key]];
      arr[idx] = val;
      return { ...f, [key]: arr };
    });
  };
  const removeFromArray = (key, idx) => {
    setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));
  };

  // Object array helpers (experience, projects, education)
  const addObjectToArray = (key, template) => {
    setForm(f => ({ ...f, [key]: [...f[key], { ...template }] }));
  };
  const updateObjectInArray = (key, idx, field, val) => {
    setForm(f => {
      const arr = [...f[key]];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...f, [key]: arr };
    });
  };
  const removeObjectFromArray = (key, idx) => {
    setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));
  };

  // Sub-array helpers (description inside experience/projects)
  const addSubArray = (key, idx, subKey) => {
    setForm(f => {
      const arr = [...f[key]];
      arr[idx] = { ...arr[idx], [subKey]: [...(arr[idx][subKey] || []), ''] };
      return { ...f, [key]: arr };
    });
  };
  const updateSubArray = (key, idx, subKey, subIdx, val) => {
    setForm(f => {
      const arr = [...f[key]];
      const sub = [...(arr[idx][subKey] || [])];
      sub[subIdx] = val;
      arr[idx] = { ...arr[idx], [subKey]: sub };
      return { ...f, [key]: arr };
    });
  };
  const removeSubArray = (key, idx, subKey, subIdx) => {
    setForm(f => {
      const arr = [...f[key]];
      arr[idx] = { ...arr[idx], [subKey]: (arr[idx][subKey] || []).filter((_, i) => i !== subIdx) };
      return { ...f, [key]: arr };
    });
  };

  return (
    <div className="py-12 max-w-4xl mx-auto mt-8 relative">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-textMuted">Baseline Configuration</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-none mb-3">System Profile</h1>
          <p className="text-textMuted text-lg font-light max-w-xl">Your base resume data — the foundation every generated application is built upon.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-10 p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-md'
                  : 'text-textMuted hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>


        {/* ─── PDF Upload Tab ──────────────────────────────────── */}
        {activeTab === 'upload' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-8 md:p-10 border border-white/[0.06]">
            <div className="mb-8">
              <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-textMuted mb-1">
                <UploadCloud className="w-4 h-4 text-primary" /> Upload Base Resume
              </label>
              <h2 className="text-2xl font-display font-bold text-white">Extract Profile Data</h2>
              <p className="text-textMuted text-sm mt-1">Upload your PDF resume. AI will parse and index all your experience, skills, and projects.</p>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
                }`}
              >
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <UploadCloud className="w-10 h-10 mb-3 text-primary/60" />
                  <p className="text-sm text-textMuted"><span className="font-semibold text-white">Click to upload</span> or drag & drop</p>
                  <p className="text-xs text-textMuted/60 mt-1">PDF format only (max 10MB)</p>
                </div>
                <input type="file" className="hidden" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
              </label>
              {file && (
                <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-white font-mono truncate">{file.name}</span>
                </div>
              )}
              <button type="submit" disabled={!file || loading} className="btn-primary w-full py-4 disabled:opacity-50">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin"></span>
                    Extracting Profile Data...
                  </span>
                ) : 'Parse & Index Resume'}
              </button>
            </form>
          </motion.div>
        )}

        {/* ─── Manual Entry Tab ─────────────────────────────────── */}
        {activeTab === 'manual' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={handleManualSave} className="space-y-6">

              {/* Basic Info */}
              <div className="glass-panel p-6 md:p-8 border border-white/[0.06]">
                <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Identity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white/70">Full Name</label>
                    <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white/70">Email (used on resume)</label>
                    <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white/70">Phone</label>
                    <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium mb-1 text-white/70">Professional Summary</label>
                  <textarea
                    ref={summaryRef}
                    className="input-field overflow-hidden resize-none"
                    style={{ minHeight: '200px' }}
                    value={form.summary}
                    onChange={e => {
                      setForm(f => ({ ...f, summary: e.target.value }));
                      autoResize(e.target);
                    }}
                    onInput={e => autoResize(e.target)}
                    placeholder="Briefly describe your career and expertise..."
                  />
                </div>
              </div>

              {/* Links & Preferences */}
              <div className="glass-panel p-6 md:p-8 border border-white/[0.06]">
                <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-secondary" /> Links & Preferences
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white/70">GitHub URL</label>
                    <input className="input-field" value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))} placeholder="https://github.com/username" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white/70">LinkedIn URL</label>
                    <input className="input-field" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/username" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white/70">Portfolio URL</label>
                    <input className="input-field" value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))} placeholder="https://yourportfolio.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white/70">Location</label>
                    <input className="input-field" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Trichy, Tamil Nadu" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 mt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.openToRemote}
                      onChange={e => setForm(f => ({ ...f, openToRemote: e.target.checked }))}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/40 cursor-pointer"
                    />
                    <span className="text-sm text-white/80 group-hover:text-white transition"><Globe className="w-3.5 h-3.5 inline mr-1 text-indigo-400" />Open to Remote</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.openToRelocate}
                      onChange={e => setForm(f => ({ ...f, openToRelocate: e.target.checked }))}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/40 cursor-pointer"
                    />
                    <span className="text-sm text-white/80 group-hover:text-white transition"><MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />Open to Relocation</span>
                  </label>
                </div>
              </div>

              {/* Skills */}
              <div className="glass-panel p-6 md:p-8 border border-white/[0.06]">
                <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Skills Index
                </h2>
                <SkillTagInput
                  skills={form.skills.filter(s => s.trim())}
                  onChange={(newSkills) => setForm(f => ({ ...f, skills: newSkills.length ? newSkills : [''] }))}
                />
              </div>

              {/* Experience */}
              <div className="glass-panel p-6 md:p-8 border border-white/[0.06]">
                <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-secondary" /> Work Experience
                </h2>
                <div className="space-y-6">
                  {form.experience.map((exp, i) => (
                    <div key={i} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-textMuted font-medium uppercase tracking-wider">Experience {i + 1}</span>
                        {form.experience.length > 1 && (
                          <button type="button" onClick={() => removeObjectFromArray('experience', i)} className="text-red-400/60 hover:text-red-400 transition text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className="input-field" placeholder="Job Title" value={exp.title} onChange={e => updateObjectInArray('experience', i, 'title', e.target.value)} />
                        <input className="input-field" placeholder="Company" value={exp.company} onChange={e => updateObjectInArray('experience', i, 'company', e.target.value)} />
                        <input className="input-field" placeholder="Location" value={exp.location || ''} onChange={e => updateObjectInArray('experience', i, 'location', e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <input className="input-field" placeholder="Start Date" value={exp.startDate} onChange={e => updateObjectInArray('experience', i, 'startDate', e.target.value)} />
                          <input className="input-field" placeholder="End Date" value={exp.endDate} onChange={e => updateObjectInArray('experience', i, 'endDate', e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-white/50">Bullet Points</label>
                        {(exp.description || []).map((desc, di) => (
                          <div key={di} className="flex gap-2">
                            <input className="input-field flex-1" placeholder="Describe your responsibility or achievement..." value={desc} onChange={e => updateSubArray('experience', i, 'description', di, e.target.value)} />
                            {exp.description.length > 1 && (
                              <button type="button" onClick={() => removeSubArray('experience', i, 'description', di)} className="text-red-400/60 hover:text-red-400 transition p-2"><Trash2 className="w-3 h-3" /></button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addSubArray('experience', i, 'description')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add bullet
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addObjectToArray('experience', { title: '', company: '', location: '', startDate: '', endDate: '', description: [''] })} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Experience
                  </button>
                </div>
              </div>

              {/* Projects */}
              <div className="glass-panel p-6 md:p-8 border border-white/[0.06]">
                <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Projects
                </h2>
                <div className="space-y-6">
                  {form.projects.map((proj, i) => (
                    <div key={i} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-textMuted font-medium uppercase tracking-wider">Project {i + 1}</span>
                        {form.projects.length > 1 && (
                          <button type="button" onClick={() => removeObjectFromArray('projects', i)} className="text-red-400/60 hover:text-red-400 transition text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                        )}
                      </div>
                      <input className="input-field" placeholder="Project Title" value={proj.title} onChange={e => updateObjectInArray('projects', i, 'title', e.target.value)} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className="input-field" placeholder="GitHub URL" value={proj.github || ''} onChange={e => updateObjectInArray('projects', i, 'github', e.target.value)} />
                        <input className="input-field" placeholder="Live Demo URL" value={proj.demo || ''} onChange={e => updateObjectInArray('projects', i, 'demo', e.target.value)} />
                      </div>
                      {/* Technologies */}
                      <div>
                        <label className="block text-xs font-medium text-white/50 mb-2">Technologies</label>
                        <SkillTagInput
                          skills={(proj.technologies || []).filter(t => t.trim())}
                          onChange={(newTechs) => updateObjectInArray('projects', i, 'technologies', newTechs.length ? newTechs : [''])}
                        />
                      </div>
                      {/* Description */}
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-white/50">Description</label>
                        {(proj.description || []).map((desc, di) => (
                          <div key={di} className="flex gap-2">
                            <input className="input-field flex-1" placeholder="Describe the project feature or impact..." value={desc} onChange={e => updateSubArray('projects', i, 'description', di, e.target.value)} />
                            {proj.description.length > 1 && (
                              <button type="button" onClick={() => removeSubArray('projects', i, 'description', di)} className="text-red-400/60 hover:text-red-400 transition p-2"><Trash2 className="w-3 h-3" /></button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addSubArray('projects', i, 'description')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add point
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addObjectToArray('projects', { title: '', technologies: [''], description: [''], github: '', demo: '' })} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Project
                  </button>
                </div>
              </div>

              {/* Education */}
              <div className="glass-panel p-6 md:p-8 border border-white/[0.06]">
                <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-secondary" /> Education
                </h2>
                <div className="space-y-4">
                  {form.education.map((edu, i) => (
                    <div key={i} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-textMuted font-medium uppercase tracking-wider">Education {i + 1}</span>
                        {form.education.length > 1 && (
                          <button type="button" onClick={() => removeObjectFromArray('education', i)} className="text-red-400/60 hover:text-red-400 transition text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className="input-field" placeholder="Degree" value={edu.degree} onChange={e => updateObjectInArray('education', i, 'degree', e.target.value)} />
                        <input className="input-field" placeholder="Institution" value={edu.institution} onChange={e => updateObjectInArray('education', i, 'institution', e.target.value)} />
                        <input className="input-field" placeholder="Year" value={edu.year} onChange={e => updateObjectInArray('education', i, 'year', e.target.value)} />
                        <input className="input-field" placeholder="Score (e.g. CGPA: 8.5)" value={edu.score || ''} onChange={e => updateObjectInArray('education', i, 'score', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addObjectToArray('education', { degree: '', institution: '', year: '', score: '' })} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                </div>
              </div>

              {/* Certifications */}
              <div className="glass-panel p-6 md:p-8 border border-white/[0.06]">
                <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Certifications
                </h2>
                <div className="space-y-2">
                  {form.certifications.map((cert, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="input-field flex-1" value={cert} onChange={e => updateArray('certifications', i, e.target.value)} placeholder="e.g. AWS Certified Solutions Architect" />
                      {form.certifications.length > 1 && (
                        <button type="button" onClick={() => removeFromArray('certifications', i)} className="text-red-400/60 hover:text-red-400 transition p-2"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addToArray('certifications')} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-2">
                    <Plus className="w-3 h-3" /> Add Certification
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !isDirty}
                className={`w-full py-4 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                  saving || !isDirty
                    ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed select-none'
                    : 'btn-primary cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {saving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/40"></span>
                    <span>Saving Profile...</span>
                  </>
                ) : !isDirty ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>No Changes to Save</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* Skills Overview Card */}
        <div className="glass-panel p-8 mt-8 border border-white/[0.06]">
          <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-5 border-b border-white/10 pb-4">Indexed Skills</h2>
          {user?.skills && user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill, i) => (
                <span key={i} className="badge-indigo">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-textMuted italic">No skills extracted yet. Upload your resume or enter skills above.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
