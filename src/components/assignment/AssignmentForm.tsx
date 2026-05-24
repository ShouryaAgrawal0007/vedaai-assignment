import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Calendar, ArrowLeft, Plus, X, ArrowRight, Minus, ChevronDown
} from 'lucide-react';
import { useAssignmentStore } from '../../store/useAssignmentStore';
import { createAssignment } from '../../lib/api';
import { FileUpload } from './FileUpload';
import { io } from 'socket.io-client';
import { getUserProfile } from '../../lib/userProfile';

interface QuestionSelector {
  id: string;
  type: 'MCQs' | 'Short Answer' | 'Long Answer' | 'True/False';
  numQuestions: number;
  marksPerQuestion: number;
}

export const AssignmentForm: React.FC = () => {
  const router = useRouter();
  const { addAssignment, setActiveAssignment, updateAssignmentFromSocket } = useAssignmentStore();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('Attempt all questions. Show calculations wherever necessary.');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; file?: File } | null>(null);
  const [schoolName, setSchoolName] = useState('Delhi Public School');
  const [schoolLocation, setSchoolLocation] = useState('Bokaro Steel City');
  const [className, setClassName] = useState('8th');
  const [timeAllowed, setTimeAllowed] = useState('3 hours');

  useEffect(() => {
    const profile = getUserProfile();
    if (profile.schoolName) setSchoolName(profile.schoolName);
    if (profile.schoolLocation) setSchoolLocation(profile.schoolLocation);
  }, []);

  const [selectors, setSelectors] = useState<QuestionSelector[]>([
    { id: 'mcq-1', type: 'MCQs', numQuestions: 4, marksPerQuestion: 4 },
    { id: 'short-1', type: 'Short Answer', numQuestions: 4, marksPerQuestion: 4 }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('Initializing AI generation...');
  const [generationProgress, setGenerationProgress] = useState(0);

  const getLabelByType = (type: string): string => {
    if (type === 'MCQs') return 'Multiple Choice Questions';
    if (type === 'Short Answer') return 'Short Questions';
    if (type === 'Long Answer') return 'Long Questions';
    return 'True/False Questions';
  };

  const handleDecrementQuestions = (id: string) => {
    setSelectors(selectors.map(s =>
      s.id === id ? { ...s, numQuestions: Math.max(1, s.numQuestions - 1) } : s
    ));
  };

  const handleIncrementQuestions = (id: string) => {
    setSelectors(selectors.map(s =>
      s.id === id ? { ...s, numQuestions: s.numQuestions + 1 } : s
    ));
  };

  const handleDecrementMarks = (id: string) => {
    setSelectors(selectors.map(s =>
      s.id === id ? { ...s, marksPerQuestion: Math.max(1, s.marksPerQuestion - 1) } : s
    ));
  };

  const handleIncrementMarks = (id: string) => {
    setSelectors(selectors.map(s =>
      s.id === id ? { ...s, marksPerQuestion: s.marksPerQuestion + 1 } : s
    ));
  };

  const handleTypeChange = (id: string, newType: 'MCQs' | 'Short Answer' | 'Long Answer' | 'True/False') => {
    setSelectors(selectors.map(s =>
      s.id === id ? { ...s, type: newType } : s
    ));
  };

  const handleAddQuestionType = () => {
    setSelectors([...selectors, {
      id: `custom-sel-${Date.now()}`,
      type: 'Long Answer',
      numQuestions: 4,
      marksPerQuestion: 5
    }]);
  };

  const handleRemoveQuestionType = (id: string) => {
    if (selectors.length > 1) {
      setSelectors(selectors.filter(s => s.id !== id));
    }
  };

  const totalQuestions = selectors.reduce((sum, s) => sum + s.numQuestions, 0);
  const totalMarks = selectors.reduce((sum, s) => sum + (s.numQuestions * s.marksPerQuestion), 0);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Assignment title is required';
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selected = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      if (selected <= today) newErrors.dueDate = 'Due date must be in the future';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsGenerating(true);
    setGenerationProgress(5);
    setGenerationMessage('Sending to backend...');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('due', dueDate);
      formData.append('questionTypes', JSON.stringify(selectors.map(s => s.type)));
      formData.append('numQuestions', String(totalQuestions));
      formData.append('marks', String(totalMarks));
      formData.append('instructions', instructions);
      formData.append('schoolName', schoolName);
      formData.append('schoolLocation', schoolLocation);
      formData.append('className', className);
      formData.append('timeAllowed', timeAllowed);
      if (selectedFile?.file) {
        formData.append('file', selectedFile.file);
      }

      // console.log('Calling backend...');
      const result = await createAssignment(formData);
      // console.log('Backend response:', result);

      const assignment = result.assignment;
      addAssignment(assignment);
      setActiveAssignment(assignment.id);

      setGenerationMessage('Job queued — AI is generating your paper...');
      setGenerationProgress(15);

      const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
        transports: ['polling', 'websocket'],
        withCredentials: true,
      });

      socket.on('connect', () => {
        // console.log('Socket connected:', socket.id);
        socket.emit('subscribe:assignment', assignment.id);

        // Poll every 2 seconds until job completes
        const pollInterval = setInterval(() => {
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments/${assignment.id}`)
            .then(r => r.json())
            .then(data => {
              // console.log('Polling status:', data.assignment?.status, 'questions:', data.assignment?.questions?.length);
              if (data.assignment?.status === 'completed' && data.assignment?.questions?.length > 0) {
                clearInterval(pollInterval);
                setGenerationProgress(100);
                setGenerationMessage('Question paper ready!');
                socket.disconnect();
                updateAssignmentFromSocket(data.assignment);
                setTimeout(() => {
                  setIsGenerating(false);
                  router.push('/output');
                }, 500);
              }
            })
            .catch(console.error);
        }, 2000); // Poll every 2 seconds

        // Stop polling after 60 seconds
        setTimeout(() => clearInterval(pollInterval), 60000);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket error:', err.message);
      });

      socket.on('job:started', (data: { message: string; progress: number }) => {
        setGenerationMessage(data.message);
        setGenerationProgress(data.progress);
      });

      socket.on('job:progress', (data: { message: string; progress: number }) => {
        setGenerationMessage(data.message);
        setGenerationProgress(data.progress);
      });

      socket.on('job:completed', (data: { assignment: typeof assignment }) => {
        setGenerationProgress(100);
        setGenerationMessage('Question paper ready!');
        socket.disconnect();
        updateAssignmentFromSocket(data.assignment);
        setTimeout(() => {
          setIsGenerating(false);
          router.push('/output');
        }, 500);
      });

      socket.on('job:failed', (data: { error: string }) => {
        console.error('Generation failed:', data.error);
        socket.disconnect();
        setIsGenerating(false);
        setErrors({ submit: 'AI generation failed. Please try again.' });
      });

    } catch (err: any) {
      console.error('Submit error:', err);
      setIsGenerating(false);
      setErrors({ submit: err.message || 'Failed to connect to backend.' });
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Loading overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-[#0F0F11]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-md bg-[#18181B] border border-zinc-800 p-8 rounded-3xl shadow-xl flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-[#FF5722] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#FF5722] animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">VedaAI Generator</h3>
              <p className="text-xs font-semibold text-zinc-400 min-h-[36px]">
                {generationMessage}
              </p>
            </div>

            <div className="w-full flex flex-col gap-2">
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF5722] transition-all duration-500 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">
                {generationProgress}% complete
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 mb-4 select-none">
        <div className="flex items-center justify-center relative py-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="absolute left-0 p-2 hover:bg-zinc-200 text-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <span className="text-sm font-black text-zinc-800 tracking-tight">Create Assignment</span>
        </div>
        <div className="w-full h-[6px] bg-zinc-200 rounded-full overflow-hidden flex">
          <div className="w-1/2 h-full bg-[#8E8E93]" />
          <div className="w-1/2 h-full bg-zinc-200" />
        </div>
      </div>

      <form onSubmit={handleGenerate} className="bg-white border border-zinc-200 rounded-[2.5rem] p-6 flex flex-col gap-6 shadow-sm">

        <div className="flex flex-col">
          <h2 className="text-lg font-black text-zinc-900 tracking-tight">Assignment Details</h2>
          <p className="text-xs font-semibold text-zinc-400 mt-0.5">Basic information about your assignment</p>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-zinc-800 uppercase tracking-wide">Assignment Title</label>
          <input
            type="text"
            required
            placeholder="e.g. CBSE Grade 8 Science NCERT Chapters"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#F3F4F6] border border-transparent hover:border-zinc-200 focus:border-zinc-400 text-xs font-semibold text-zinc-800 placeholder-zinc-400 rounded-2xl px-4 py-3.5 focus:outline-none transition-all"
          />
          {errors.title && <span className="text-[10px] text-red-500 font-bold">{errors.title}</span>}
        </div>

        {/* School Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-zinc-800 uppercase tracking-wide">School Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Delhi Public School"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full bg-[#F3F4F6] border border-transparent hover:border-zinc-200 focus:border-zinc-400 text-xs font-semibold text-zinc-800 placeholder-zinc-400 rounded-2xl px-4 py-3.5 focus:outline-none transition-all"
          />
        </div>

        {/* Class and Time Allowed row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-800 uppercase tracking-wide">Class</label>
            <input
              type="text"
              required
              placeholder="e.g. 8th"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full bg-[#F3F4F6] border border-transparent hover:border-zinc-200 focus:border-zinc-400 text-xs font-semibold text-zinc-800 placeholder-zinc-400 rounded-2xl px-4 py-3.5 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-800 uppercase tracking-wide">Time Allowed</label>
            <input
              type="text"
              required
              placeholder="e.g. 3 hours"
              value={timeAllowed}
              onChange={(e) => setTimeAllowed(e.target.value)}
              className="w-full bg-[#F3F4F6] border border-transparent hover:border-zinc-200 focus:border-zinc-400 text-xs font-semibold text-zinc-800 placeholder-zinc-400 rounded-2xl px-4 py-3.5 focus:outline-none transition-all"
            />
          </div>
        </div>

        <FileUpload selectedFile={selectedFile} onFileSelect={setSelectedFile} />

        {/* Due Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-zinc-800 uppercase tracking-wide">Due Date</label>
          <div className="relative flex items-center">
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[#F3F4F6] border border-transparent hover:border-zinc-200 focus:border-zinc-400 text-xs font-semibold text-zinc-800 rounded-2xl px-4 py-3.5 focus:outline-none transition-all cursor-pointer"
            />
            <Calendar className="absolute right-4 w-4 h-4 text-zinc-700 pointer-events-none stroke-[2]" />
          </div>
          {errors.dueDate && <span className="text-[10px] text-red-500 font-bold">{errors.dueDate}</span>}
        </div>

        {/* Question Types */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-black text-zinc-800 uppercase tracking-wide">Question Type</label>
          <div className="flex flex-col gap-4">
            {selectors.map((sel) => (
              <div key={sel.id} className="bg-white border border-zinc-200 rounded-[2rem] p-4 flex flex-col gap-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="relative flex items-center">
                    <select
                      value={sel.type}
                      onChange={(e) => handleTypeChange(sel.id, e.target.value as QuestionSelector['type'])}
                      className="appearance-none pr-8 bg-transparent text-xs font-black text-zinc-800 focus:outline-none cursor-pointer"
                    >
                      <option value="MCQs">{getLabelByType('MCQs')}</option>
                      <option value="Short Answer">{getLabelByType('Short Answer')}</option>
                      <option value="Long Answer">{getLabelByType('Long Answer')}</option>
                      <option value="True/False">{getLabelByType('True/False')}</option>
                    </select>
                    <ChevronDown className="absolute right-0 w-3.5 h-3.5 text-zinc-600 pointer-events-none stroke-[2.5]" />
                  </div>
                  {selectors.length > 1 && (
                    <button type="button" onClick={() => handleRemoveQuestionType(sel.id)}
                      className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-700 transition-colors">
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>

                <div className="bg-[#F3F4F6] p-3 rounded-2xl flex items-center justify-between text-xs select-none">
                  <div className="flex flex-col items-center gap-1 w-[46%]">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">No. of Questions</span>
                    <div className="flex items-center justify-between w-full bg-white rounded-full p-1 border border-zinc-150 shadow-sm mt-1">
                      <button type="button" onClick={() => handleDecrementQuestions(sel.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors">
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="font-black text-zinc-850 text-xs">{sel.numQuestions}</span>
                      <button type="button" onClick={() => handleIncrementQuestions(sel.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors">
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 w-[46%]">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Marks</span>
                    <div className="flex items-center justify-between w-full bg-white rounded-full p-1 border border-zinc-150 shadow-sm mt-1">
                      <button type="button" onClick={() => handleDecrementMarks(sel.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors">
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="font-black text-zinc-850 text-xs">{sel.marksPerQuestion}</span>
                      <button type="button" onClick={() => handleIncrementMarks(sel.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors">
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={handleAddQuestionType}
            className="flex items-center gap-2 text-xs font-black text-zinc-800 mt-2.5 w-fit hover:text-zinc-600 transition-colors select-none">
            <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-sm">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Add Question Type</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-1.5 mt-1">
          <label className="text-xs font-black text-zinc-800 uppercase tracking-wide">Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full bg-[#F3F4F6] border border-transparent hover:border-zinc-200 focus:border-zinc-400 text-xs font-semibold text-zinc-800 placeholder-zinc-400 rounded-2xl px-4 py-3 focus:outline-none min-h-[60px] transition-all"
            placeholder="General test guidelines..."
          />
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end gap-1 mt-1 border-t border-zinc-100 pt-4 text-xs font-black text-zinc-800 select-none">
          <div>Total Questions : <span className="text-[#8E8E93]">{totalQuestions}</span></div>
          <div>Total Marks : <span className="text-[#8E8E93]">{totalMarks}</span></div>
        </div>

        {/* Error message */}
        {errors.submit && (
          <p className="text-[10px] text-red-500 font-bold text-center">{errors.submit}</p>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-2 select-none">
          <button type="button" onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 border border-zinc-250 hover:bg-zinc-50 text-zinc-700 py-3.5 px-6 rounded-full font-black text-xs transition-all active:scale-[0.98]">
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            Previous
          </button>

          <button type="submit" disabled={isGenerating}
            className="flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white py-3.5 px-6 rounded-full font-black text-xs transition-all active:scale-[0.98] shadow-md shadow-zinc-950/10">
            Next
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </form>
    </div>
  );
};
