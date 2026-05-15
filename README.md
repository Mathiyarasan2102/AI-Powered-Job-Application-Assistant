# ResuForge

> **Paste a job description. Get a tailored resume and cold email — forged for that exact role, in under a minute.**

ResuForge is a full-stack MERN application that reads any job description and generates an **ATS-optimized PDF resume**, a **personalized cold email**, and an optional **cover letter** — all tailored to the specific role and company. Built with a production-grade AI orchestration pipeline, a premium dark-mode UI, and a strict no-hallucination prompt system.

---

## ✨ Features

### Core Pipeline
- **JD → Resume, Email & Cover Letter** — Paste a job description (text or screenshot) and generate a complete tailored application package in one click
- **ATS-Optimized PDF** — Semantic HTML resume template rendered to PDF via Puppeteer — no LaTeX, no binaries
- **Keyword Match Score** — Real-time ATS score showing matched and missing keywords vs. the JD
- **Role-Targeted Summary** — AI writes the resume summary specifically for the target job title (not a recycled generic summary)
- **No Fabrication Mode** — AI is strictly instructed to use only real dates/durations from your profile — no invented "6 months" for a 3-month internship

### Profile System
- **PDF Resume Parsing** — Upload your existing PDF resume; AI extracts and structures all data automatically
- **Manual Profile Entry** — Full-featured form with tag-chip inputs for skills, experience, projects, education, certifications
- **Skills Index** — Pill-tag input UI: type a skill, press Enter or comma to add; click × to remove
- **Project Technologies** — Same tag-chip input for each project's tech stack
- **Missing Keyword One-Click Add** — Click any missing keyword from the ATS report to add it directly to your profile skills

### Batch Mode
- **Multi-JD Batch Matching** — Submit multiple JDs at once; AI filters which roles match your skill set
- **Per-Job Generation** — Generate a tailored application for each matched job individually or all at once

### Email Workflow
- **Pre-filled `mailto:` Launch** — Click the mail icon to open your email client with To (if HR email provided), Subject, and Body all pre-filled
- **Optional HR Email Field** — Enter the recruiter's email in the job form; it flows through to the mail icon automatically
- **Copy / Share** — One-click copy the cold email or share via Web Share API

### Application History
- **Full History** — Every generated application is saved with ATS score, keywords, and PDF link
- **WhatsApp-Style Delete** — Slide-up confirmation sheet before deleting any history entry
- **Re-open Preview** — Click any history item to reload the full ApplicationPreview with resume, email, and cover letter

### UX & Design
- **Pro Max Dark Mode** — Glassmorphism panels, chartreuse + cyan accent system, smooth Framer Motion transitions
- **Navbar** — Floating pill navbar with active-link underlines, avatar initials, profile dropdown
- **Mobile Responsive** — Full slide-in mobile nav overlay
- **Toast Notifications** — Non-blocking success/error/warning toasts
- **Smooth Scroll** — Lenis smooth scroll on all pages

### Auth
- **JWT Authentication** — Register/login with secure token-based auth
- **30-day token expiry** — Persistent sessions with localStorage

---

## 🏗️ Architecture

```
User Input (Text / Image Screenshot)
        ↓
OCR via Tesseract.js (image path only)
        ↓
AI Orchestration — OpenRouter (cloud) or Ollama (local)
   → MASTER_SYSTEM_PROMPT enforces:
     • Role-targeted resume summary
     • Strict no-fabrication of experience duration
     • ATS keyword injection
     • Structured JSON output only
        ↓
Structured JSON (resume, email, cover letter, score, keywords)
        ↓
EJS HTML Template → Puppeteer → PDF
        ↓
Saved to MongoDB (history) + returned to client
```

**Design Principle:** AI returns only structured JSON. It never controls HTML or layout. The backend owns the template, sanitizes all inputs, and renders via Puppeteer.

---

## 🚀 Setup

### Prerequisites

- **Node.js** v18+
- **MongoDB** running locally on port `27017`
- Puppeteer auto-downloads Chromium — no external binaries needed

### 1. Backend

```bash
cd backend
npm install
npm run dev    # or: npx nodemon server.js
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/resuforge
JWT_SECRET=your_super_secret_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
AI_PROVIDER=openrouter          # or: ollama
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_OLLAMA_MODEL=llama3
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` · Backend on `http://localhost:5000`

---

## 🐳 Docker

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Build & run
docker build -t resuforge .
docker run -p 5000:5000 --env-file backend/.env resuforge
```

The Docker image uses `node:20-slim` with Chromium pre-installed for Puppeteer.

---

## 📁 Project Structure

```
resuforge/
├── backend/
│   ├── middleware/
│   │   ├── auth.js            # JWT verification middleware
│   │   └── upload.js          # Multer config (PDF + image uploads)
│   ├── models/
│   │   ├── User.js            # User profile schema (skills, experience, projects…)
│   │   └── Resume.js          # Generated application history schema
│   ├── routes/
│   │   ├── authRoutes.js      # POST /register, /login, GET /me
│   │   ├── userRoutes.js      # Profile CRUD, PDF resume upload
│   │   └── jobRoutes.js       # Parse JD, Generate application, History, Batch match
│   ├── services/
│   │   ├── aiService.js       # OpenRouter + Ollama abstraction + MASTER_SYSTEM_PROMPT
│   │   ├── pdfGenerator.js    # EJS → Puppeteer → PDF pipeline
│   │   ├── ocrService.js      # Tesseract.js OCR for job screenshot images
│   │   └── pdfService.js      # pdf-parse for resume data extraction
│   ├── templates/
│   │   └── resume.ejs         # ATS-friendly semantic HTML resume template
│   └── server.js
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js       # Axios instance with JWT interceptor
        ├── components/
        │   ├── Navbar.jsx     # Floating pill navbar with profile dropdown
        │   ├── Footer.jsx     # Footer with ResuForge branding
        │   └── Toast.jsx      # Toast notification system
        ├── pages/
        │   ├── Landing.jsx    # Public landing page
        │   ├── Login.jsx      # Auth — login
        │   ├── Register.jsx   # Auth — register
        │   ├── Dashboard.jsx  # Main dashboard post-login
        │   ├── Profile.jsx    # Profile setup (PDF upload + manual entry with tag chips)
        │   ├── UploadJob.jsx  # Job form — single JD or batch mode
        │   ├── ApplicationPreview.jsx  # Resume + email + cover letter preview
        │   └── History.jsx    # Application history with WhatsApp-style delete
        └── store/
            ├── useAuthStore.js  # Zustand auth store (user, login, logout)
            └── useJobStore.js   # Zustand job store (jobData, resume, email, history)
```

---

## 🧭 User Flow

```
Register / Login
      ↓
Profile Setup
  → Upload existing PDF resume (AI auto-extracts)
  OR
  → Manual entry (skills tag chips, experience, projects, education)
      ↓
New Application (/job/new)
  → Paste job description text OR upload a screenshot
  → Optionally enter HR/recruiter email
  → Toggle: Resume PDF / Cold Email / Cover Letter
  → Click Generate
      ↓
Application Preview (/job/preview)
  → ATS match score + matched/missing keywords
  → Download PDF resume
  → Copy or mail the cold email (pre-fills To + Subject + Body)
  → Add missing keywords to profile in one click
      ↓
History (/history)
  → All past applications with scores
  → Re-open any application in preview
  → Delete with slide-up confirmation
```

---

## 🔐 Security

| Concern | Approach |
|---|---|
| XSS / Template Injection | All resume JSON is HTML-escaped before EJS rendering |
| Auth | JWT with 30-day expiry, verified on every protected route |
| Mass Assignment | Profile updates use explicit field whitelisting |
| Puppeteer | Runs with `--no-sandbox` and `--disable-dev-shm-usage` (Docker-safe) |
| File Uploads | Multer restricts to PDF and image MIME types only |

---

## 🧠 AI Orchestration Rules

The AI is governed by a strict `MASTER_SYSTEM_PROMPT` + per-request `CRITICAL RULES`:

| Rule | Description |
|---|---|
| **RESUME SUMMARY RULE** | Summary must be written for the target job title — never recycled from the stored profile |
| **RESUME TITLE RULE** | Headline must match the target role (e.g. "React.js Developer" for a React JD) |
| **NO FABRICATION RULE** | AI must use exact dates from profile to compute duration — no inventing or rounding up experience |
| **ATS RULE** | Output must include the JD's required keywords naturally |
| **FORMAT RULE** | Output is always structured JSON — never Markdown, never HTML |

---

## 📄 Resume JSON Schema

```json
{
  "name": "Mathiyarasan P",
  "title": "React.js Developer",
  "email": "mathi@example.com",
  "phone": "+91 9876543210",
  "location": "Trichy, Tamil Nadu",
  "github": "https://github.com/Mathiyarasan2102",
  "linkedin": "https://linkedin.com/in/mathiyarasan",
  "summary": "React.js Developer with 3 months of internship experience...",
  "skills": {
    "Frontend": ["React.js", "Tailwind CSS", "Redux Toolkit"],
    "Backend": ["Node.js", "Express", "MongoDB"],
    "Tools": ["Git", "Postman", "VS Code"]
  },
  "experience": [
    {
      "title": "MERN Stack Developer Intern",
      "company": "XYZ Tech",
      "location": "Remote",
      "startDate": "Oct 2025",
      "endDate": "Jan 2026",
      "description": [
        "Built responsive UI components with React.js and Tailwind CSS",
        "Integrated RESTful APIs with JWT authentication"
      ]
    }
  ],
  "projects": [
    {
      "title": "ResuForge",
      "technologies": ["React.js", "Node.js", "MongoDB", "Puppeteer"],
      "description": ["AI-powered resume and cold email generator from any job description"],
      "github": "https://github.com/Mathiyarasan2102/resuforge",
      "demo": "https://resuforge.vercel.app"
    }
  ],
  "education": [
    {
      "degree": "B.E. Computer Science",
      "institution": "Example University",
      "year": "2026",
      "score": "CGPA: 8.2/10"
    }
  ],
  "certifications": ["React.js Fundamentals — Coursera"]
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| AI | OpenRouter API (GPT-4o, DeepSeek, LLaMA) / Ollama (local) |
| PDF | Puppeteer + EJS templates |
| OCR | Tesseract.js |
| Auth | JWT + bcrypt |
| PDF Parsing | pdf-parse |
| File Uploads | Multer |

---

*Built by Mathiyarasan P — [github.com/Mathiyarasan2102](https://github.com/Mathiyarasan2102)*
