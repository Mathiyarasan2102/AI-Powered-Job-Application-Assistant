const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobTitle: String,
    companyName: String,
    contentJson: Object, // The AI generated structured resume data
    emailSubject: String, // The AI generated email subject
    emailDraft: String,  // The AI generated cold email
    coverLetterDraft: String, // The AI generated cover letter
    keywordScore: Number,
    missingKeywords: [String],
    matchedKeywords: [String],
    pdfFile: String // filename or path
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
