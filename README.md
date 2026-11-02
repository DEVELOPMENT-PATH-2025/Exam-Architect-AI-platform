# ExamArchitect AI 🎓⚡

> **Personalized Academic Exam Preparation & Intelligence Command Center powered by Google Gemini AI & Firebase.**

Transform complete university syllabi (PDFs or screenshots) into interactive practice studios, 7-mark subjective evaluations against authentic university rubrics, data-based numerical engines, 500+ question PYQ archives, and downloadable performance dossiers.

---

## 🌟 Key Features

### 1. 📄 Multi-Format Syllabus Extraction (PDF & Image Vision OCR)
- **Full Syllabus PDF**: Extracts university name, semester scheme, exact course codes (`CS-402`, `CS-403`, etc.), and all 5 unit modules with 100% fidelity.
- **Screenshot Drag & Drop**: Drop any syllabus screenshot or textbook module photo (`PNG`, `JPG`, `WebP`).
- **Direct Clipboard Paste**: Press <kbd>Ctrl</kbd> + <kbd>V</kbd> anywhere on the upload screen to parse screenshots instantly.
- **Intelligent Fallback**: Resilient offline parser ensures subject mapping never breaks even under API rate limits.

### 2. ✍️ 4-Tier Interactive Practice Studio
- **Short Answer (2 Marks)**: Concise, definition-focused conceptual questions with model solutions and mandatory keywords.
- **Long Answer (7 Marks - Theory)**: In-depth subjective theory questions focusing on architectural breakdowns, conceptual diagrams, and university exam formats.
- **Numerical & Data-Based**: Rigorous calculation problems featuring concrete numerical datasets, given parameters, and step-by-step computational proofs.
- **Multiple Choice Questions (1 Mark)**: Interactive MCQ mode with 4 options (A, B, C, D) and immediate rationale.

### 3. 🎯 Semantic Evaluation & AI-Detector Ratio
- **Step-by-step Rubric Grading**: Evaluates submitted student answers on an authentic 10-point university rubric (Introduction, Governing Equations, Technical Keywords, Depth).
- **AI vs. Human Detection**: Real-time stylometric prediction detecting natural human reasoning vs. formulaic LLM patterns.
- **Growth Areas & Strengths**: Highlights exact gaps in knowledge and revision recommendations.

### 4. 📚 500-Question Intensive Archive & Mock Papers
- Generates 100 questions per unit across all 5 modules with past 10-year recurring frequency analysis and next-exam probability flags.
- Complete 3-hour university-calibrated mock examinations with section-wise weighting.

### 5. 📑 Verified Student Performance Dossier (PDF)
- Generates high-resolution academic report cards with student info, awarded grades, cognitive radar charts, and revision recommendations.
- Crisp white background, clean contrast, and formal university verification ID.

### 6. 🔐 Authentication & Persistent Cloud Sync
- Firebase Authentication (Google Sign-In, Email/Password with verification email dispatcher).
- Cloud Firestore sync with automatic local recovery fallback for offline continuity.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Recharts, Lucide Icons.
- **Backend**: Node.js, Express, TSX, Vite Middleware.
- **AI Engine**: Google Gemini API (`@google/genai`) with resilient multi-model fallback (`gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-flash-latest`, `gemini-2.5-pro`).
- **Database & Auth**: Google Firebase (Authentication & Cloud Firestore).
- **Document Engine**: jsPDF & jsPDF-AutoTable for academic dossier generation.
- **Deployment**: Docker, Docker Compose, Kubernetes manifests, Google Cloud Run.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [npm](https://www.npmjs.com/)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/exam-architect-ai.git
   cd exam-architect-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🐳 Docker & Container Deployment

### Run with Docker Compose
```bash
# Build and start container
docker-compose up --build

# Run in background
docker-compose up -d
```

### Build Docker Image Manually
```bash
# Build multi-stage production image
docker build -t exam-architect-ai:latest .

# Run container on port 3000
docker run -p 3000:3000 -e GEMINI_API_KEY="your_api_key" exam-architect-ai:latest
```

### Kubernetes Deployment
A production-ready `deployment.yaml` is included:
```bash
kubectl apply -f deployment.yaml
```

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx            # Academic command center & subject progress
│   │   ├── SyllabusUpload.tsx       # PDF, Screenshot, & Clipboard OCR uploader
│   │   ├── PracticeSessionUI.tsx    # 2-mark, 7-mark, Numerical & MCQ studio
│   │   ├── MockPaperGenerator.tsx   # Full university mock exams
│   │   ├── PerformanceReport.tsx    # PDF Dossier generator & radar analysis
│   │   ├── AuthUI.tsx               # Student sign-in & registration
│   │   ├── AIAssistantBot.tsx       # Floating academic tutor bot
│   │   └── ProfileSettings.tsx      # Student profile & branch configuration
│   ├── lib/
│   │   ├── firebase.ts              # Firebase auth & database initialization
│   │   └── utils.ts                 # Styling & class merger utilities
│   ├── services/
│   │   └── geminiService.ts         # Client-side agent dispatchers
│   ├── App.tsx                      # Main app shell & router
│   └── main.tsx                     # React application entry point
├── server.ts                        # Express API & Gemini server-side proxy
├── Dockerfile                       # Multi-stage production container
├── docker-compose.yml               # Local container orchestration
├── deployment.yaml                  # Kubernetes deployment & service spec
└── package.json                     # Dependencies & scripts
```

---

## 🛡️ Security & API Rate-Limit Handling

- **Proxy Routing**: All Gemini API interactions are handled securely server-side in `server.ts` — API keys are never exposed in browser bundles.
- **Multi-Model Waterfall**: Gracefully falls back across candidate models if quota or rate-limit thresholds (`429 RESOURCE_EXHAUSTED`) are encountered.
- **Smart Text Caching**: Query hashes cache identical syllabus extractions and question sets to conserve token quotas.

---

## 📄 License

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for details.
