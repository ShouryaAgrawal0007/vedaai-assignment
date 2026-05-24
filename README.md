# VedaAI – AI Assessment Creator

An AI-powered full-stack web app that lets teachers create assignments and instantly generate structured question papers using AI.

🔗 **Live Demo:** [vedaai-assignment-delta.vercel.app](https://vedaai-assignment-delta.vercel.app)  
📦 **Backend API:** [vedaai-assignment-55ik.onrender.com](https://vedaai-assignment-55ik.onrender.com)  
💻 **GitHub:** [github.com/ShouryaAgrawal0007/vedaai-assignment](https://github.com/ShouryaAgrawal0007/vedaai-assignment)

---

## What It Does

1. Teacher fills an assignment form (title, question types, marks, instructions, optional file upload)
2. Backend queues an AI generation job via BullMQ
3. Worker calls Groq AI (LLaMA 3.3 70B) with a structured prompt
4. Questions are parsed, validated, and stored in MongoDB
5. WebSocket notifies the frontend in real time
6. Output page renders a structured, exam-ready question paper

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| State | Zustand |
| Real-time | Socket.io (WebSocket) |
| Backend | Node.js, Express, TypeScript |
| Queue | BullMQ |
| Database | MongoDB Atlas |
| Cache | Redis (Upstash) |
| AI | Groq — LLaMA 3.3 70B |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Architecture

```
User fills form
      │
      ▼
POST /api/assignments
      │
      ▼
MongoDB (status: pending) + BullMQ Job Queue
      │
      ▼
Worker → Prompt Builder → Groq AI
      │
      ▼
Parse & Validate JSON Response
      │
      ▼
MongoDB (status: completed, questions saved)
      │
      ▼
Socket.io → Frontend → Output Page
```

---

## Features

- **Assignment Creation** — title, due date, question types, marks per question, file upload (PDF/text), custom instructions
- **AI Generation** — structured prompt engineering, sections (A, B, C...), difficulty tags (Easy / Medium / Hard)
- **Real-time Updates** — WebSocket progress bar from 15% → 100%
- **Structured Output** — exam-style paper with student info, sections, questions, marks, difficulty badges
- **Answer Key** — toggle to include/exclude answer key
- **Regenerate** — one-click regeneration of questions
- **Responsive Design** — works on mobile and desktop
- **Redis Caching** — assignment results cached for fast retrieval

---

## Local Setup

### Prerequisites
- Node.js 18+
- [Memurai](https://www.memurai.com) (Redis for Windows) or Redis
- MongoDB Atlas account (free)
- Groq API key — [console.groq.com](https://console.groq.com)

### 1. Clone
```bash
git clone https://github.com/ShouryaAgrawal0007/vedaai-assignment.git
cd vedaai-assignment
```

### 2. Frontend Setup
```bash
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=4000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_uri
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=http://localhost:3000
```

### 4. Run

```bash
# Terminal 1 — Backend server
cd backend && npm run dev

# Terminal 2 — Frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assignments` | Create assignment + queue AI job |
| GET | `/api/assignments` | Get all assignments |
| GET | `/api/assignments/:id` | Get single assignment |
| POST | `/api/assignments/:id/regenerate` | Regenerate questions |
| DELETE | `/api/assignments/:id` | Delete assignment |
| GET | `/health` | Health check |

## WebSocket Events

| Event | Description |
|-------|-------------|
| `subscribe:assignment` | Subscribe to job updates |
| `job:started` | Generation started |
| `job:progress` | Progress update |
| `job:completed` | Questions ready |
| `job:failed` | Generation failed |

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel | Auto-deploys on push |
| Backend + Worker | Render | Single web service |
| Database | MongoDB Atlas | Free M0 cluster |
| Redis | Upstash | Free tier |
| AI | Groq | Free tier |