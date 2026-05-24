import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { Assignment } from '../store/useAssignmentStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface JobEvent {
  assignmentId: string;
  message: string;
  progress: number;
  assignment?: Assignment;
  error?: string;
}

interface UseJobSocketOptions {
  assignmentId: string | null;
  onCompleted?: (assignment: Assignment) => void;
  onFailed?: (error: string) => void;
  onProgress?: (message: string, progress: number) => void;
}

/**
 * Connects to the Socket.io server and listens for real-time
 * job status updates for the given assignmentId.
 */
export const useJobSocket = ({
  assignmentId,
  onCompleted,
  onFailed,
  onProgress,
}: UseJobSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const updateAssignmentFromSocket = useAssignmentStore(
    (s) => s.updateAssignmentFromSocket
  );

  const connect = useCallback(() => {
    if (!assignmentId) return;

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      socket.emit('subscribe:assignment', assignmentId);
    });

    socket.on('job:started', (data: JobEvent) => {
      console.log('⚙️  Job started:', data.message);
      onProgress?.(data.message, data.progress);
    });

    socket.on('job:progress', (data: JobEvent) => {
      console.log(`📊 Progress ${data.progress}%:`, data.message);
      onProgress?.(data.message, data.progress);
    });

    socket.on('job:completed', (data: JobEvent) => {
      console.log('✅ Job completed:', data.message);
      if (data.assignment) {
        updateAssignmentFromSocket(data.assignment);
        onCompleted?.(data.assignment);
      }
    });

    socket.on('job:failed', (data: JobEvent) => {
      console.error('❌ Job failed:', data.error);
      onFailed?.(data.error || 'Generation failed');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });
  }, [assignmentId, onCompleted, onFailed, onProgress, updateAssignmentFromSocket]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [connect]);

  return {
    disconnect: () => socketRef.current?.disconnect(),
  };
};
