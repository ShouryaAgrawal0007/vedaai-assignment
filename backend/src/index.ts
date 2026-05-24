import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { initSocket } from './socket/index';
import assignmentRoutes from './routes/assignment';

const app = express();
const httpServer = http.createServer(app);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Socket.io ────────────────────────────────────────────────────────────────
initSocket(httpServer);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/assignments', assignmentRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 VedaAI Backend running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server ready`);
    console.log(`📋 API: http://localhost:${PORT}/api/assignments`);
  });
});
