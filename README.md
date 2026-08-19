# EduBot ✨ — AI-Powered Multi-Language Engineering Tutor

A production-ready AI chatbot that helps engineering students learn in their native language with quizzes, flashcards, interview prep, and more.

---

## Features

- **Multilingual Chat** — English, Hindi, Bengali, Tamil, Telugu, Marathi, French, Spanish
- **Auto Language Detection** — responds in the user's detected language automatically
- **13 Engineering Subjects** — CS, ECE, EEE, ME, CE, AI/ML, DSA, DBMS, OS, OOP, Networks, and more
- **Quiz Generator** — AI-generated MCQ quizzes with scoring and PDF export
- **Flashcard System** — spaced-repetition flashcards with confidence tracking
- **Interview Prep Mode** — Q&A pairs for technical interviews
- **Formula Explanations** — detailed derivations with units and examples
- **PDF Export** — download any chat session or quiz as PDF
- **RAG with Documents** — upload your own notes/PDFs and query them in chat
- **Voice Input** — speak your question using Web Speech API
- **Text-to-Speech** — listen to bot responses
- **Dark/Light Mode** — cute animated UI with vivid gradients
- **Progress Tracking** — subject-wise stats, quiz history, streak tracking
- **JWT Auth** — secure login with refresh tokens

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite, Framer Motion |
| Backend | FastAPI, Python 3.11, SQLAlchemy, SQLite |
| AI | Ollama (qwen2.5:7b or deepseek-r1) |
| Vector DB | ChromaDB |
| Auth | JWT (python-jose + bcrypt) |
| PDF | fpdf2 |
| Deployment | Docker + Nginx |

---

## Quick Start (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.ai) installed and running

### 1. Install Ollama model

```bash
ollama pull qwen2.5:7b
# Or for faster hardware:
# ollama pull qwen2.5:14b
# ollama pull deepseek-r1:7b
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # Edit as needed
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Docker Deployment

```bash
# Copy and configure environment
cp backend/.env.example backend/.env

# Build and start all services
docker-compose up --build -d

# Pull the AI model (first time only)
docker exec edubot-ollama ollama pull qwen2.5:7b

# View logs
docker-compose logs -f
```

Open [http://localhost](http://localhost)

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | — | JWT secret (change in production!) |
| `OLLAMA_MODEL` | `qwen2.5:7b` | Ollama model to use |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `DATABASE_URL` | `sqlite:///./edubot.db` | Database connection |
| `MAX_FILE_SIZE_MB` | `10` | Max upload size |
| `ALLOWED_ORIGINS` | localhost ports | CORS origins |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/chat/sessions` | List chat sessions |
| POST | `/api/chat/send` | Send message (SSE streaming) |
| GET | `/api/chat/sessions/{id}/messages` | Get session messages |
| POST | `/api/quiz/generate` | Generate quiz |
| POST | `/api/quiz/{id}/submit` | Submit quiz |
| POST | `/api/quiz/flashcards/generate` | Generate flashcards |
| POST | `/api/upload/document` | Upload document |
| POST | `/api/notes/summary` | Generate session summary |
| GET | `/api/notes/session/{id}/pdf` | Download session PDF |
| GET | `/api/progress/overview` | Get progress stats |

---

## Project Structure

```
EduBot/
├── backend/
│   ├── app/
│   │   ├── api/routes/    # auth, chat, quiz, notes, upload, progress
│   │   ├── core/          # config, security, database
│   │   ├── models/        # SQLAlchemy models
│   │   ├── services/      # ollama, chroma, pdf services
│   │   └── utils/         # language detection
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/    # chat, layout, quiz, dashboard
│       ├── pages/         # Chat, Dashboard, Quiz, Flashcards, etc.
│       ├── services/      # API client
│       ├── store/         # Zustand state
│       └── types/         # TypeScript types
├── docker-compose.yml
└── nginx.conf
```

---

## Supported AI Modes

| Mode | Description |
|------|-------------|
| `chat` | Default conversational explanation |
| `quiz` | Generate 5 MCQ questions |
| `interview` | 5 interview Q&A pairs |
| `flashcard` | 6 front/back card pairs |
| `formula` | Detailed formula explanation |
| `summary` | Concise study summary |

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR


