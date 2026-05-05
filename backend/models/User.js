const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    
    // Profile information
    skills: [String],
    experience: [{
        title: String,
        company: String,
        location: String,
        startDate: String,
        endDate: String,
        description: [String]
    }],
    projects: [{
        title: String,
        description: [String],
        technologies: [String],
        github: String,
        demo: String
    }],
    education: [{
        degree: String,
        institution: String,
        year: String,
        score: String
    }],
    certifications: [String],
    summary: String,

    // Profile links — injected into resume header
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    location: { type: String, default: '' },

    // Work preferences
    openToRemote: { type: Boolean, default: false },
    openToRelocate: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
