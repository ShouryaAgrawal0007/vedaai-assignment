import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer;

export const initSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed =
          origin.includes('vercel.app') ||
          origin.includes('localhost');
        callback(null, isAllowed);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client subscribes to updates for a specific assignment
    socket.on('subscribe:assignment', (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);
      console.log(`📡 Socket ${socket.id} subscribed to assignment ${assignmentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// Emit job status updates to all clients watching an assignment
export const emitJobUpdate = (
  assignmentId: string,
  event: 'job:started' | 'job:progress' | 'job:completed' | 'job:failed',
  payload: Record<string, unknown>
) => {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit(event, {
    assignmentId,
    ...payload,
  });
};
