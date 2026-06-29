const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure upload directories exist (dynamic for Vercel read-only filesystem)
const isVercel = process.env.VERCEL === '1';
const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
const pdfBuildsDir = isVercel ? '/tmp/uploads/pdfbuilds' : path.join(uploadDir, 'pdfbuilds');
try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    if (!fs.existsSync(pdfBuildsDir)) fs.mkdirSync(pdfBuildsDir, { recursive: true });
} catch (err) {
    console.warn('Warning: Could not create upload directories:', err.message);
}

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');

app.use('/uploads', express.static(isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/job', jobRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', provider: process.env.AI_PROVIDER || 'openrouter' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
    console.error('✗ MongoDB connection error: MONGODB_URI is not defined in environment variables.');
} else {
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('✓ Connected to MongoDB'))
      .catch((err) => console.error('✗ MongoDB connection error:', err));
}

if (!isVercel) {
    app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
}

module.exports = app;
