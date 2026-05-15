const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const pdfGenerator = require('../services/pdfGenerator');
const Resume = require('../models/Resume');
const path = require('path');
const fs = require('fs');
const r = express.Router();

// ─── Batch Match Jobs Against User Profile ─────────────────
// Accepts: multiple jdTexts (JSON array string) + multiple jobImages
r.post('/batch-match', protect, upload.array('jobImages', 10), async (req, res) => {
    try {
        const user = req.user;

        // Collect all JD texts
        let jdTexts = [];
        if (req.body.jdTexts) {
            try { jdTexts = JSON.parse(req.body.jdTexts); } catch { jdTexts = [req.body.jdTexts]; }
        }

        // OCR each uploaded image and append its text
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const ocrText = await ocrService.extractTextFromImage(file.path);
                    if (ocrText.trim()) jdTexts.push(ocrText);
                } catch (ocrErr) {
                    console.warn(`OCR failed for ${file.originalname}:`, ocrErr.message);
                } finally {
                    try { fs.unlinkSync(file.path); } catch {}
                }
            }
        }

        if (jdTexts.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide at least one JD text or image.' });
        }

        const userSkills = (user.skills || []).join(', ');
        const userSummary = user.summary || '';

        const batchPrompt = `You are an intelligent hiring assistant and skill matcher.

Candidate Skills: ${userSkills}
Candidate Summary: ${userSummary}

Below are ${jdTexts.length} job description(s). For each JD:
1. Extract the actual job title (remove noise words like "JOB POST", "Urgent", etc.), company name, and required skills.
2. Calculate a match_score (0-100) based on how well the candidate's skills match the JD's required skills.
3. If match_score >= 40, mark it as "matched": true. Otherwise "matched": false.
4. Return a reason string explaining the match or mismatch briefly.

JOB DESCRIPTIONS:
${jdTexts.map((jd, i) => `--- JD #${i + 1} ---\n${jd}`).join('\n\n')}

Return a JSON object strictly in this format:
{
  "jobs": [
    {"index":0,"job_title":"","company_name":"","skills_required":[],"keywords":[],"match_score":85,"matched":true,"reason":""}
  ]
}
`;

        const results = await aiService.generateJSON(batchPrompt, 'You are an expert HR tech recruiter and skill matcher.');
        let jobList = Array.isArray(results) ? results : (results.jobs || results.results || results.matches || results.data || []);
        
        // Safety check to ensure we have an array
        if (!Array.isArray(jobList)) jobList = [];

        const matched = jobList.filter(j => j.matched);
        const skipped = jobList.filter(j => !j.matched);

        res.json({
            success: true,
            total: jobList.length,
            matchedCount: matched.length,
            skippedCount: skipped.length,
            matched,
            skipped
        });
    } catch (err) {
        console.error('Batch match error:', err);
        res.status(500).json({ success: false, message: 'Batch match failed', error: err.message });
    }
});

// ─── Parse Job Description ─────────────────────────────────
r.post('/parse-job', protect, upload.single('jobImage'), async (req, res) => {
    try {
        let jobText = req.body.jobText || '';
        
        if (req.file) {
            const ocrText = await ocrService.extractTextFromImage(req.file.path);
            jobText += '\n' + ocrText;
        }

        if (!jobText.trim()) {
            return res.status(400).json({ success: false, message: 'Please provide job text or upload an image.' });
        }

        const prompt = `Extract details from this job description into JSON.
- "job_title": Clean up the job title. Extract only the actual role name (e.g. "React.js Developer", "Frontend Engineer"). Strictly remove extra noise words like "- JOB POST", "Urgent Hiring", "Remote", etc.
- "company_name": Name of the hiring company.
- "skills_required": ONLY actual technical skills, frameworks, tools, methodologies. DO NOT include perks, salary, location, or policies.
- "keywords": Same rule as skills_required.
- "responsibilities": Key job responsibilities as short phrases.
{
  "job_title": "",
  "company_name": "",
  "skills_required": [],
  "keywords": [],
  "responsibilities": []
}
CRITICAL: Return ONLY valid JSON exactly matching the structure above. No markdown, no extra text, no trailing commas.
Job Description:
${jobText}
`;
        const jobData = await aiService.generateJSON(prompt, 'You are an HR tech expert who extracts structured data from job postings.');
        res.json({ success: true, jobData });
    } catch (err) {
        console.error('Parse job error:', err);
        res.status(500).json({ success: false, message: 'Failed to parse job', error: err.message });
    }
});

// ─── Generate Full Application ──────────────────────────────
r.post('/generate-application', protect, async (req, res) => {
    try {
        const { jobData, options = { resume: true, email: true, coverLetter: false } } = req.body;
        const user = req.user;

        if (!jobData || !jobData.job_title) {
            return res.status(400).json({ success: false, message: 'Invalid job data' });
        }

        const applicationPrompt = `You are an advanced AI Job Application Assistant and Resume Engine.
Your responsibility is to analyze the job description deeply, match the candidate profile intelligently, and generate ATS-optimized application materials based on requested options. You must behave like a senior hiring manager + AI system.

DO:
1. Identify priority keywords and requirements.
2. Compare JD with candidate profile.
3. ${options.resume ? 'Generate a tailored, ATS-friendly 1-page resume strictly focused on the requested role.' : 'Skip resume generation.'}
4. ${options.email ? 'Generate a short professional cold email (under 100 words).' : 'Skip email generation.'}
5. ${options.coverLetter ? 'Generate a professional cover letter.' : 'Skip cover letter generation.'}

Job Description:
Title: ${jobData.job_title}
Company: ${jobData.company_name}
Required Skills & Keywords: ${(jobData.keywords || []).concat(jobData.skills_required || []).join(', ')}

Candidate Profile:
${JSON.stringify({
  name: user.name,
  email: user.email,
  phone: user.phone || '[Your Phone]',
  location: user.location,
  openToRemote: user.openToRemote,
  openToRelocate: user.openToRelocate,
  skills: user.skills,
  experience: user.experience,
  projects: user.projects,
  education: user.education,
  certifications: user.certifications,
  summary: user.summary
})}

CRITICAL RULES:
- ALWAYS validate output before returning.
- Keep content concise, impactful, and ATS-optimized.
- NEVER use Markdown formatting like **asterisks** or hashtags anywhere in your output. Do not bold text using asterisks.
- Clean up the job title in your response. If it contains extra words like "- JOB POST", remove them so it reads cleanly (e.g. "ReactJS Developer").
- If generating resume: keep to 1 page, no weak/generic lines.
- RESUME SUMMARY RULE (MOST IMPORTANT): The resume "summary" field MUST be written specifically for the target job title "${jobData.job_title}". Frame the candidate AS a "${jobData.job_title}" — do NOT copy or recycle the candidate's stored profile summary. If the JD is for "React.js Developer", the summary must position the candidate as a React.js Developer. If the JD is for "Node.js Developer", position them as a Node.js Developer. The summary must reference the job's required skills and frame the candidate's experience in terms of THAT specific role.
- RESUME TITLE RULE: The resume headline/title line must also match the target role (e.g. "React.js Developer | Frontend Developer" for a React JD, not "Full Stack Developer" unless the JD explicitly asks for that).
- If generating email: use HR name if known, mention role, mention 1 relevant project, mention location/WFH match, keep under 100 words. ALWAYS include the user's phone number and email ID at the very end of the email.
- If generating cover letter: be professional, highlight value proposition. ALWAYS include the user's phone number and email ID at the very end of the cover letter.

Return ONLY structured JSON matching exactly this format:
{
  "jdAnalysis": {
    "role": "${jobData.job_title}",
    "requiredSkills": [],
    "responsibilities": []
  },
  "profileMatch": {
    "matchedSkills": [],
    "missingSkills": [],
    "strategicAdditions": []
  },
  "resume": ${options.resume ? `{
    "summary": "",
    "skills": { "Category": ["skill"] },
    "experience": [{"title": "", "company": "", "location": "", "startDate": "", "endDate": "", "description": [""] }],
    "projects": [{"title": "", "technologies": [""], "description": [""], "github": "", "demo": "" }],
    "education": [{"degree": "", "institution": "", "year": "", "score": ""}],
    "certifications": [""]
  }` : `null`},
  "email": ${options.email ? `{"subject": "", "body": ""}` : `null`},
  "coverLetter": ${options.coverLetter ? `""` : `null`},
  "ats": {
    "matchScore": 0,
    "missingKeywords": []
  }
}
`;
        const aiResponse = await aiService.generateJSON(applicationPrompt, 'You are an intelligent hiring assistant.');
        const emailResult = aiResponse.email || null;
        const coverLetterResult = aiResponse.coverLetter || null;
        const resumeData = aiResponse.resume || null;

        if (options.resume && resumeData) {
            resumeData.name = user.name;
            resumeData.email = user.email;
            resumeData.phone = user.phone || '';
            resumeData.github = user.github || '';
            resumeData.linkedin = user.linkedin || '';
            resumeData.portfolio = user.portfolio || '';
            resumeData.location = user.location || '';
            resumeData.openToRemote = user.openToRemote || false;
            resumeData.openToRelocate = user.openToRelocate || false;
        }

        // Step 3: Compile to PDF via HTML + Puppeteer
        const safeUserName = user.name || 'User';
        const safeJobRole = jobData.job_title || 'Role';
        const safeCompany = jobData.company_name || 'Company';
        
        let pdfResult = null;
        if (options.resume) {
            try {
                pdfResult = await pdfGenerator.generatePdf(
                    resumeData,
                    safeUserName,
                    safeJobRole,
                    safeCompany,
                    jobData.job_title
                );
            } catch (pdfErr) {
                console.error('⚠ PDF Generation failed:', pdfErr.message);
            }
        }

        // Step 4: Extract keywords based on AI ATS response or manual
        const score = aiResponse.ats?.matchScore || 0;
        const missingKws = aiResponse.ats?.missingKeywords || [];
        const foundKeywords = aiResponse.profileMatch?.matchedSkills || [];

        // Step 5: Save to history
        const resumeHistory = await Resume.create({
            userId: user._id,
            jobTitle: jobData.job_title,
            companyName: jobData.company_name,
            contentJson: resumeData,
            emailSubject: emailResult.subject,
            emailDraft: emailResult.body,
            coverLetterDraft: coverLetterResult,
            keywordScore: score,
            matchedKeywords: foundKeywords,
            missingKeywords: missingKws,
            pdfFile: pdfResult ? pdfResult.filename : null
        });

        res.json({
            success: true,
            resume: resumeHistory,
            email: emailResult,
            coverLetter: coverLetterResult,
            resumeData: options.resume ? resumeData : null,
            pdfUrl: pdfResult ? `/uploads/pdfbuilds/${pdfResult.filename}` : null,
            score,
            matchedKeywords: foundKeywords,
            missingKws
        });

    } catch (err) {
        console.error('Generate application error:', err);
        res.status(500).json({ success: false, message: 'Generation failed', error: err.message });
    }
});

// ─── Resume History ──────────────────────────────────────────
r.get('/history', protect, async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, resumes });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch history', error: err.message });
    }
});

// ─── Get Single Resume ───────────────────────────────────────
r.get('/resume/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id }).lean();
        if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
        res.json({ success: true, resume });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch resume', error: err.message });
    }
});

// ─── Delete Resume ───────────────────────────────────────────
r.delete('/resume/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
        res.json({ success: true, message: 'Resume deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete resume', error: err.message });
    }
});

// ─── Regenerate PDF from existing resume data ────────────────
r.post('/regenerate-pdf/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
        if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

        const resumeData = { ...resume.contentJson };
        // Allow overriding resume data if user edited it
        if (req.body.resumeData) {
            Object.assign(resumeData, req.body.resumeData);
        }

        const safeUserName = (req.user.name || 'user').replace(/\s+/g, '').toLowerCase();
        const safeJobRole = (resume.jobTitle || 'role').replace(/\s+/g, '').toLowerCase();
        const safeCompany = (resume.companyName || 'company').replace(/\s+/g, '').toLowerCase();

        const pdfResult = await pdfGenerator.generatePdf(
            resumeData,
            safeUserName,
            safeJobRole,
            safeCompany,
            resume.jobTitle
        );
        
        resume.pdfFile = pdfResult.filename;
        resume.contentJson = resumeData;
        await resume.save();

        res.json({
            success: true,
            pdfUrl: `/uploads/pdfbuilds/${pdfResult.filename}`,
            filename: pdfResult.filename
        });
    } catch (err) {
        console.error('Regenerate PDF error:', err);
        res.status(500).json({ success: false, message: 'PDF regeneration failed', error: err.message });
    }
});

// ─── Preview Resume HTML ─────────────────────────────────────
r.post('/preview-html', protect, async (req, res) => {
    try {
        const { resumeData } = req.body;
        
        if (!resumeData) {
            return res.status(400).json({ success: false, message: 'Resume data is required' });
        }

        const { valid, errors } = pdfGenerator.validateResumeData(resumeData);
        if (!valid) {
            return res.status(400).json({ success: false, message: `Invalid data: ${errors.join('; ')}` });
        }

        const html = await pdfGenerator.renderHtml(
            resumeData,
            req.body.jobTitle || null
        );
        
        res.json({ success: true, html });
    } catch (err) {
        console.error('Preview HTML error:', err);
        res.status(500).json({ success: false, message: 'HTML preview failed', error: err.message });
    }
});

module.exports = r;
