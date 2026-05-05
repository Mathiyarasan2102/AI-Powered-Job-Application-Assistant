const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const pdfService = require('../services/pdfService');
const aiService = require('../services/aiService');

const r = express.Router();

// ─── Update Profile (manual entry) ──────────────────────────
r.put('/profile', protect, async (req, res) => {
    try {
        // Only allow updating safe fields
        const allowedFields = ['name', 'email', 'phone', 'skills', 'experience', 'projects', 'education', 'certifications', 'summary', 'github', 'linkedin', 'portfolio', 'location', 'openToRemote', 'openToRelocate'];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
});

// ─── Upload and parse resume PDF ─────────────────────────────
r.post('/upload-resume', protect, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({ success: false, message: 'Only PDF is supported for profile extraction' });
        }

        const text = await pdfService.extractTextFromPDF(req.file.path);

        if (!text || text.trim().length < 20) {
            return res.status(400).json({ success: false, message: 'Could not extract text from PDF. The file may be image-based or empty.' });
        }

        const prompt = `Extract the following resume text into structured JSON. Be thorough and extract ALL information.
Format:
{
  "skills": ["skill1", "skill2"],
  "experience": [{"title": "", "company": "", "location": "", "startDate": "", "endDate": "", "description": [""]}],
  "projects": [{"title": "", "description": [""], "technologies": [""], "github": "", "demo": ""}],
  "education": [{"degree": "", "institution": "", "year": "", "score": ""}],
  "certifications": ["cert1"],
  "summary": "professional summary",
  "phone": "phone number if found"
}
Resume Text:
${text}
`;
        
        const extractedJson = await aiService.generateJSON(prompt, 'You are an expert resume parser who extracts complete structured data.');

        // Update user profile
        const updateFields = {};
        if (extractedJson.skills) updateFields.skills = extractedJson.skills;
        if (extractedJson.experience) updateFields.experience = extractedJson.experience;
        if (extractedJson.projects) updateFields.projects = extractedJson.projects;
        if (extractedJson.education) updateFields.education = extractedJson.education;
        if (extractedJson.certifications) updateFields.certifications = extractedJson.certifications;
        if (extractedJson.summary) updateFields.summary = extractedJson.summary;
        if (extractedJson.phone) updateFields.phone = extractedJson.phone;

        const user = await User.findByIdAndUpdate(req.user._id, updateFields, { new: true }).select('-password');
        
        res.json({ success: true, extractedData: extractedJson, user });
    } catch (err) {
        console.error('Resume extraction error:', err);
        res.status(500).json({ success: false, message: 'Extraction failed', error: err.message });
    }
});

// ─── Get current profile ─────────────────────────────────────
r.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
});

module.exports = r;
