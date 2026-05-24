import { create } from 'zustand';
import { fetchAssignments, deleteAssignment as apiDelete } from '../lib/api';

export interface Question {
  id: string;
  text: string;
  type: string;
  section: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  options?: string[];
  answerKeyText?: string;
}

export interface Assignment {
  id: string;
  title: string;
  assignedOn: string;
  due: string;
  questionTypes: string[];
  numQuestions: number;
  marks: number;
  instructions: string;
  fileName?: string;
  fileSize?: string;
  questions?: Question[];
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  schoolName?: string;
  className?: string;
  timeAllowed?: string;
}

interface AssignmentState {
  assignments: Assignment[];
  activeAssignmentId: string | null;
  searchQuery: string;
  filterType: 'all' | 'due-soon' | 'completed';
  activeTab: 'assignments' | 'create';
  isLoading: boolean;
  generationStatus: { message: string; progress: number } | null;

  // Actions
  loadAssignments: () => Promise<void>;
  addAssignment: (assignment: Assignment) => void;
  updateAssignmentFromSocket: (assignment: Assignment) => void;
  deleteAssignment: (id: string) => Promise<void>;
  setActiveAssignment: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (filter: 'all' | 'due-soon' | 'completed') => void;
  setActiveTab: (tab: 'assignments' | 'create') => void;
  setGenerationStatus: (status: { message: string; progress: number } | null) => void;
}

export const getFormattedDate = (dateObj: Date): string => {
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  activeAssignmentId: null,
  searchQuery: '',
  filterType: 'all',
  activeTab: 'assignments',
  isLoading: false,
  generationStatus: null,

  // Load all assignments from backend on app mount
  loadAssignments: async () => {
    set({ isLoading: true });
    try {
      const assignments = await fetchAssignments();
      set({ assignments, isLoading: false });
    } catch (err) {
      console.error('Failed to load assignments:', err);
      set({ isLoading: false });
    }
  },

  // Add a newly created assignment (optimistic — before generation completes)
  addAssignment: (assignment: Assignment) => {
    set((state) => ({
      assignments: [assignment, ...state.assignments],
      activeAssignmentId: assignment.id,
    }));
  },

  // Called by WebSocket when generation completes — updates questions in store
  updateAssignmentFromSocket: (updatedAssignment: Assignment) => {
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === updatedAssignment.id ? { ...a, ...updatedAssignment } : a
      ),
      generationStatus: null,
    }));
  },

  deleteAssignment: async (id: string) => {
    // Optimistic update
    set((state) => {
      const next = state.assignments.filter((a) => a.id !== id);
      return {
        assignments: next,
        activeAssignmentId:
          state.activeAssignmentId === id
            ? next.length > 0 ? next[0].id : null
            : state.activeAssignmentId,
      };
    });
    // Backend delete
    try {
      await apiDelete(id);
    } catch (err) {
      console.error('Failed to delete assignment from backend:', err);
      // Re-fetch to restore correct state
      get().loadAssignments();
    }
  },

  setActiveAssignment: (id) => set({ activeAssignmentId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (filter) => set({ filterType: filter }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setGenerationStatus: (status) => set({ generationStatus: status }),
}));
