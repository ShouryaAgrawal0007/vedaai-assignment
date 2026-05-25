# VedaAI – AI-Powered Assessment Creator

An AI-powered, full-stack web application designed for educators to easily build customized, structured, and print-ready question papers. Utilizing an asynchronous worker queue, AI prompt engineering, and real-time WebSockets, VedaAI makes assessment generation fast, scalable, and personalized.

🔗 **Live Demo:** [vedaai-assignment-delta.vercel.app](https://vedaai-assignment-delta.vercel.app)  
📦 **Backend API:** [vedaai-assignment-55ik.onrender.com](https://vedaai-assignment-55ik.onrender.com)  
💻 **GitHub:** [github.com/ShouryaAgrawal0007/vedaai-assignment](https://github.com/ShouryaAgrawal0007/vedaai-assignment)

---

## Architecture Overview

VedaAI is structured as a decoupled full-stack architecture consisting of a Next.js frontend, an Express REST API, a Redis cache & queue store, and a dedicated background generation worker.

```
                   ┌──────────────────────────────────────┐
                   │           Next.js Frontend           │
                   │ (Zustand State, Socket.io, Tailwind) │
                   └──────────────────┬───────────────────┘
                                      │
                         HTTP & WebSocket Connection
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │           Express REST API           │
                   │ (Route Security, Cache Manager, Job) │
                   └──────┬────────────────────────┬──────┘
                          │                        │
                    MongoDB Query             Queue Push & Cache
                          │                        │
                          ▼                        ▼
               ┌─────────────────────┐   ┌───────────────────┐
               │    MongoDB Atlas    │   │  Redis (Upstash)  │
               │ (Persistent Models) │   │ (BullMQ & Cache)  │
               └─────────────────────┘   └─────────┬─────────┘
                                                   │
                                              Queue Listen
                                                   │
                                                   ▼
                                         ┌───────────────────┐
                                         │ Background Worker │
                                         │ (AI Prompt, Groq) │
                                         └───────────────────┘
```

### End-to-End Execution Flow

1. **Client Submission**: The teacher submits the `AssignmentForm` with title, custom instructions, and structural details. The frontend appends a unique browser-persistent `deviceId` and triggers a `POST` request.
2. **REST API & Job Queuing**: The Express backend captures the metadata, registers the assignment under `pending` status in MongoDB, and schedules a generation task in the BullMQ queue hosted on Redis. It immediately returns the assignment details and `jobId` to the client.
3. **Asynchronous Background Processing**: A dedicated background worker fetches the job, fetches document contexts, shapes a structured prompt, and queries the **Groq LLaMA 3.3 70B** model.
4. **Parsing & Database Commit**: The worker parses the structured JSON AI response, validates question formats, updates the MongoDB document status to `completed`, and saves the questions array.
5. **Real-time Synchronization**: The backend worker pushes progress updates and success events to the client over Socket.io. The frontend State Manager updates the UI, seamlessly rendering the print-ready assessment.

---

## Technical Approach & Engineering Rationale

Our development focuses on high performance, secure data isolation, layout stability, and user personalization.

### 1. Secure Device-based Isolation (Multi-Device Support)
To avoid needing complex authentication while ensuring privacy, VedaAI introduces **device-based isolation**:
- **Client Generation**: A browser-persistent `x-device-id` is generated on initial mount (`src/lib/deviceId.ts`) and persisted in `localStorage`.
- **API Segregation**: Every REST API call attaches the `x-device-id` header.
- **REST Security**: The Express backend filters queries by device ID. For single assignment routes (`GET /:id`, `POST /:id/regenerate`, `DELETE /:id`), the server compares headers to the document's creator ID, returning a `403 Access Denied` response if they mismatch.
- **Cache Isolation**: Dynamic Redis cache keys separate list views by device: `` `assignments:all:${deviceId}` ``. This prevents caching overlaps, so users never see each other's cached lists.

### 2. Next.js SSR Hydration Safety & Store Persistence
Zustand's state manager is configured with `persist` middleware to synchronize the `activeAssignmentId` in `localStorage`. To make this work safely with Next.js server-side rendering (SSR) without raising hydration warnings:
- **Mounting Guard**: Pages implement a local `mounted` state guard. Persistent-state components remain hidden or render beautiful CSS-animated card skeletons until mounting is complete.
- **In-Memory Store Hydration**: The assignment records list is kept in memory. The list is fetched fresh from MongoDB on app mount (`loadAssignments()`), keeping local layouts identical on the server and client before data is dynamically loaded.

### 3. Immutable Assignment Context (School Details Freezing)
To personalize the application, we introduced an **Onboarding & Profile Setup** workflow (`src/components/OnboardingModal.tsx`) that stores the Teacher's Name, School Name, and Location inside the client's `localStorage` profile.
- **Form Autofill**: When creating a new assessment, the form inputs automatically pre-fill using these profile details.
- **Frozen Metadata**: Once submitted, these details are stored directly inside the assignment document in MongoDB. The exam paper header renders details directly from the saved assignment, making past question papers immune to subsequent profile edits.

### 4. Fully Responsive Fluid Layouts
Tailwind CSS grid systems are configured to support extreme viewport constraints down to 320px screens:
- Mobile viewports stack top action buttons in a balanced 2x2 layout, collapse options lists into a readable single-column grid, and display Google Workspace-style dynamic initials avatars (`from-[#FF5722] to-[#FF8A65]`) containing the teacher's dynamic profile initial.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **State Management**| Zustand v5 (with custom partialize local persistence middleware) |
| **Asynchronous Queue**| BullMQ (Redis-backed job scheduler) |
| **In-Memory Caching**| Upstash Redis (Server list & single document caching with TTL) |
| **Real-time WebSockets**| Socket.io & Socket.io-Client |
| **Database Tier** | MongoDB Atlas & Mongoose |
| **AI LLM Engine** | Groq LLaMA 3.3 70B Model |
| **Hosting Services** | Vercel (Frontend Client) + Render (REST API Server & Workers) |

---

## Features

- **Onboarding Setup** — Welcome profile setup modal capturing name and school details to personalize the experience.
- **Form Autofill & Custom Rules** — Automatic pre-filling of school details with option selectors for MCQs, Short, and Long questions.
- **Asynchronous Worker Queue** — Instant form returns utilizing BullMQ to process tasks smoothly without timing out.
- **Device Sandbox** — Isolated views, deletions, and regenerations restricted to the device that created them.
- **Personalized Header Avatars** — Custom, vibrant initial-letter avatars representing the teacher's profile.
- **Real-Time Progress WebSockets** — Socket.io channels streaming generation messages and a progress bar.
- **Exam-Ready Output Sheet** — Professional academics layouts with customizable Student Info sections, sequential numbering, and difficulty tags.
- **Segregated Redis Cache** — High-performance Upstash Redis caching isolated by device to guarantee sub-100ms response times.
- **Toggleable Answer Key** — Toggles detailed explanations and answer keys dynamically at the bottom of the question sheet.

---

## API Reference

All requests must attach the unique client device ID header: `x-device-id: <unique_client_device_id>`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/assignments` | Creates an assignment in MongoDB, queues a BullMQ job, and invalidates caches. |
| **GET** | `/api/assignments` | Fetches all assignments created by the requesting device (Redis cached, 60s TTL). |
| **GET** | `/api/assignments/:id` | Fetches a single assignment. Verifies device ownership (Redis cached, 300s TTL). |
| **POST** | `/api/assignments/:id/regenerate` | Verifies ownership, resets questions status to pending, and triggers a regeneration job. |
| **DELETE**| `/api/assignments/:id` | Verifies ownership, deletes the record, and clears Redis cache entries. |
| **GET** | `/health` | Server status and connection health checks. |

---

## WebSocket Events

| Event Name | Type | Description |
| :--- | :--- | :--- |
| `subscribe:assignment` | Send | Client subscribes to updates for a specific `assignmentId`. |
| `job:started` | Listen | Streams job metadata and sets starting progress. |
| `job:progress` | Listen | Streams live progress percentages and text status. |
| `job:completed` | Listen | Signals completion and pushes the updated JSON payload to the client. |
| `job:failed` | Listen | Returns error details upon generation failure. |

---

## Local Setup

### Prerequisites
- Node.js 18+
- Redis (Windows Memurai or local Redis instance running on port `6379`)
- MongoDB Atlas cluster connection string
- Groq API Key (Sign up at [console.groq.com](https://console.groq.com))

### 1. Clone Project
```bash
git clone https://github.com/ShouryaAgrawal0007/vedaai-assignment.git
cd vedaai-assignment
```

### 2. Configure Frontend
```bash
npm install
```
Create `vedaai-assignment/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Configure Backend
```bash
cd backend
npm install
```
Create `vedaai-assignment/backend/.env`:
```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/vedaai
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
GROQ_API_KEY=gsk_your_groq_api_key_here
FRONTEND_URL=http://localhost:3000
```

### 4. Run Development Servers
```bash
# Terminal 1 — Start the REST API & Queue Worker
cd backend && npm run dev

# Terminal 2 — Start the Next.js Client Application
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view VedaAI.