# AI-Powered Job Application Assistant

A production-grade MERN application that generates **ATS-optimized PDF resumes** and **tailored cold emails** from any job description. Powered by OpenRouter (cloud) or Ollama (local) AI models. Uses **HTML + Puppeteer** for PDF generation — no LaTeX or external binaries required.

---

## 🌟 Features

- **Dual AI Backend** — Switch between OpenRouter (GPT, DeepSeek, LLama) and Ollama (local) via `.env`
- **ATS PDF Resumes** — Semantic HTML template rendered to PDF via Puppeteer (Chromium)
- **Smart Resume Parsing** — Upload an existing PDF resume; AI extracts structured data automatically
- **Image OCR** — Upload a screenshot of a job posting; Tesseract.js extracts the text
- **Keyword Match Score** — See which job keywords are matched/missing in your generated resume
- **Application History** — Every generated application is saved and browsable
- **Resume Editor** — Edit the resume JSON before re-downloading
- **HTML Preview** — Preview exactly how your resume will look before generating the PDF
- **Cold Email Generator** — Copy, share, or open in your mail client with one click
- **Manual Profile Entry** — Full form to enter skills, experience, projects, education, certifications
- **JWT Authentication** — Secure register/login with token-based auth
- **Docker Ready** — Lightweight Dockerfile with Chromium for Puppeteer

---

## 🏗️ Architecture

```
User Input (Image/Text)
        ↓
OCR (if image) via Tesseract.js
        ↓
AI (OpenRouter / Ollama)
        ↓
Structured JSON (resume data)
        ↓
EJS HTML Template (semantic, ATS-friendly)
        ↓
Puppeteer → page.setContent(html) → page.pdf()
        ↓
PDF generated → Download
```

**Design Principle:** AI returns only structured JSON. It never generates HTML or controls layout. The backend owns the template, sanitizes all input, and renders the PDF via Puppeteer.

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v18+
- **MongoDB** running locally on port `27017`
- **No external binaries needed** — Puppeteer downloads its own Chromium automatically

### Backend

```bash
cd backend
npm install
npm start        # or: npx nodemon server.js
```

Configure `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai-job-assistant
JWT_SECRET=supersecret_key_change_in_production
OPENROUTER_API_KEY=your_key_here
AI_PROVIDER=openrouter          # or: ollama
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_OLLAMA_MODEL=llama3
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🐳 Docker Deployment

```bash
# Build frontend first
cd frontend && npm run build && cd ..

# Build & run Docker
docker build -t ai-job-assistant .
docker run -p 5000:5000 --env-file backend/.env ai-job-assistant
```

The Docker image uses `node:20-slim` with Chromium installed for Puppeteer. No LaTeX distribution required.

---

## 📁 Project Structure

```
backend/
├── templates/
│   └── resume.ejs       # ATS-friendly HTML resume template
├── middleware/
│   ├── auth.js          # JWT auth middleware
│   └── upload.js        # Multer file upload
├── models/
│   ├── User.js          # User profile schema
│   └── Resume.js        # Generated resume history
├── routes/
│   ├── authRoutes.js    # Register, Login, Me
│   ├── userRoutes.js    # Profile CRUD, Resume upload
│   └── jobRoutes.js     # Parse job, Generate, History, Preview HTML
├── services/
│   ├── aiService.js     # OpenRouter + Ollama abstraction
│   ├── pdfGenerator.js  # HTML → Puppeteer → PDF pipeline
│   ├── ocrService.js    # Tesseract.js OCR
│   └── pdfService.js    # pdf-parse for resume extraction
├── server.js
└── package.json

frontend/
├── src/
│   ├── api/axios.js     # Axios instance with JWT interceptor
│   ├── components/      # Navbar, Footer, Buttons, Backdrop, Lenis
│   ├── pages/           # Landing, Login, Register, Dashboard, Profile,
│   │                    #   UploadJob, ApplicationPreview, History
│   └── store/           # Zustand stores (auth, job)
├── index.html
├── tailwind.config.js
└── package.json
```

---

## 🧠 Using the App

1. **Register** → Create an account at `/register`
2. **Set Up Profile** → Go to Profile. Upload a PDF resume OR fill in details manually
3. **New Application** → Paste a job description or upload a screenshot
4. **Review** → See your ATS-optimized resume, keyword match score, missing keywords, and cold email
5. **Download** → Download the PDF, copy the email, or open in your mail app
6. **Preview** → Click "HTML" to see the rendered resume before PDF generation
7. **History** → Browse all past applications with scores and re-download PDFs

---

## 🔐 Security

- All user input is HTML-escaped before template injection (prevents XSS/injection)
- Resume JSON is validated before rendering
- Puppeteer runs with `--no-sandbox` and `--disable-dev-shm-usage` (safe in Docker)
- JWT tokens expire after 30 days
- Profile updates use field whitelisting to prevent mass assignment

---

## 📄 Sample Resume JSON

The AI generates structured data in this format:

```json
{
  "name": "John Doe",
  "title": "FULL STACK DEVELOPER",
  "email": "john@example.com",
  "phone": "+1 234 567 8900",
  "location": "San Francisco, CA",
  "github": "https://github.com/johndoe",
  "linkedin": "https://linkedin.com/in/johndoe",
  "summary": "Full Stack Developer with 3+ years of experience...",
  "skills": {
    "Frontend": ["React", "TypeScript", "Tailwind CSS"],
    "Backend": ["Node.js", "Express", "MongoDB"],
    "Tools": ["Git", "Docker", "AWS"]
  },
  "experience": [
    {
      "title": "Software Engineer",
      "company": "TechCorp",
      "location": "Remote",
      "startDate": "Jan 2022",
      "endDate": "Present",
      "description": [
        "Built scalable REST APIs serving 10K+ daily active users",
        "Reduced page load time by 40% through code splitting"
      ]
    }
  ],
  "projects": [
    {
      "title": "E-Commerce Platform",
      "technologies": ["React", "Node.js", "MongoDB"],
      "description": ["Full-stack e-commerce with payment integration"],
      "github": "https://github.com/johndoe/ecommerce",
      "demo": "https://ecommerce-demo.com"
    }
  ],
  "education": [
    {
      "degree": "B.Tech Computer Science",
      "institution": "State University",
      "year": "2022",
      "score": "CGPA: 8.5/10"
    }
  ],
  "certifications": ["AWS Cloud Practitioner", "MongoDB Associate"]
}
```
