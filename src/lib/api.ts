import { Assignment } from '../store/useAssignmentStore';
import { getDeviceId } from './deviceId';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Create Assignment ─────────────────────────────────────────────────────────
export const createAssignment = async (
  formData: FormData
): Promise<{ assignment: Assignment; jobId: string }> => {
  formData.append('deviceId', getDeviceId());
  
  const res = await fetch(`${BASE_URL}/api/assignments`, {
    method: 'POST',
    headers: {
      'x-device-id': getDeviceId(),
    },
    body: formData, // multipart/form-data (handles file upload)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create assignment');
  }

  const data = await res.json();
  return data;
};

// ─── Fetch All Assignments ─────────────────────────────────────────────────────
export const fetchAssignments = async (): Promise<Assignment[]> => {
  const res = await fetch(`${BASE_URL}/api/assignments`, {
    headers: {
      'x-device-id': getDeviceId(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch assignments');
  const data = await res.json();
  return data.assignments;
};

// ─── Fetch Single Assignment ───────────────────────────────────────────────────
export const fetchAssignment = async (id: string): Promise<Assignment> => {
  const res = await fetch(`${BASE_URL}/api/assignments/${id}`, {
    headers: {
      'x-device-id': getDeviceId(),
    },
  });
  if (!res.ok) throw new Error('Assignment not found');
  const data = await res.json();
  return data.assignment;
};

// ─── Regenerate Questions ──────────────────────────────────────────────────────
export const regenerateAssignment = async (
  id: string
): Promise<{ jobId: string }> => {
  const res = await fetch(`${BASE_URL}/api/assignments/${id}/regenerate`, {
    method: 'POST',
    headers: {
      'x-device-id': getDeviceId(),
    },
  });
  if (!res.ok) throw new Error('Failed to regenerate');
  return res.json();
};

// ─── Delete Assignment ─────────────────────────────────────────────────────────
export const deleteAssignment = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/api/assignments/${id}`, {
    method: 'DELETE',
    headers: {
      'x-device-id': getDeviceId(),
    },
  });
  if (!res.ok) throw new Error('Failed to delete assignment');
};
