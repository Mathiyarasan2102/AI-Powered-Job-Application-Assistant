const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: String,
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    topic: String,
    whyThisMatters: String,
    expectedAnswerPoints: [String],
    interviewerIntent: String,
    tips: String
}, { _id: false });

const interviewSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: String,
    jobTitle: String,
    jobDescription: String,

    generatedQuestions: {
        technical: [questionSchema],
        hr: [questionSchema],
        projectBased: [questionSchema],
        scenario: [questionSchema],
        coding: [questionSchema]
    },

    // Skill gap detection
    missingSkills: [String],
    prepareForSkills: [{
        skill: String,
        questions: [questionSchema]
    }],

    matchScore: Number,
    missingKeywords: [String],
    experienceLevel: { type: String, enum: ['fresher', 'intern', 'junior', 'mid', 'senior'], default: 'fresher' }
}, { timestamps: true });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
