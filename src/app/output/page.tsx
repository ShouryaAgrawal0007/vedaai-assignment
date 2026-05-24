'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Printer, Plus, AlertCircle, Check, Download, Sparkles, RefreshCw
} from 'lucide-react';
import { useAssignmentStore, Question } from '../../store/useAssignmentStore';
import { StudentInfo } from '../../components/output/StudentInfo';
import { QuestionSection } from '../../components/output/QuestionSection';
import { Button } from '../../components/ui/Button';
import { regenerateAssignment } from '../../lib/api';
import { useJobSocket } from '../../hooks/useJobSocket';
import { getUserProfile, UserProfile } from '../../lib/userProfile';

export default function QuestionPaperOutputPage() {
  const router = useRouter();
  const { 
    assignments, 
    activeAssignmentId, 
    isLoading,
    loadAssignments,
    setActiveTab
  } = useAssignmentStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [socketAssignmentId, setSocketAssignmentId] = useState<string | null>(null);

  // Connect socket hook when regenerating
  useJobSocket({
    assignmentId: socketAssignmentId,
    onProgress: (message, progress) => {
      setGenerationMessage(message);
      setGenerationProgress(progress);
    },
    onCompleted: (updatedAssignment) => {
      setGenerationProgress(100);
      setGenerationMessage('Question paper ready!');
      setTimeout(() => {
        setIsGenerating(false);
        setSocketAssignmentId(null);
      }, 500);
    },
    onFailed: (error) => {
      setIsGenerating(false);
      setSocketAssignmentId(null);
      triggerToast(`Regeneration failed: ${error}`);
    }
  });

  // Find active assignment
  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId);

  const handleRegenerate = async () => {
    if (!activeAssignment) return;
    setIsGenerating(true);
    setGenerationProgress(5);
    setGenerationMessage('Requesting regeneration...');
    try {
      const { jobId } = await regenerateAssignment(activeAssignment.id);
      setGenerationProgress(15);
      setGenerationMessage('Job queued — AI is regenerating...');
      setSocketAssignmentId(activeAssignment.id);
      
      // Also start a polling interval for fallback robustness
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const pollInterval = setInterval(() => {
        fetch(`${BASE_URL}/api/assignments/${activeAssignment.id}`)
          .then(r => r.json())
          .then(data => {
            if (data.assignment?.status === 'completed' && data.assignment?.questions?.length > 0) {
              clearInterval(pollInterval);
              setGenerationProgress(100);
              setGenerationMessage('Question paper ready!');
              
              // update store
              useAssignmentStore.getState().updateAssignmentFromSocket(data.assignment);
              
              setTimeout(() => {
                setIsGenerating(false);
                setSocketAssignmentId(null);
              }, 500);
            }
          })
          .catch(console.error);
      }, 2000);

      // Clear interval after 60 seconds
      setTimeout(() => clearInterval(pollInterval), 60000);
    } catch (err: any) {
      console.error(err);
      setIsGenerating(false);
      triggerToast(err.message || 'Failed to regenerate assignment');
    }
  };

  // Router fallback if no active assignment
  const handleBackToDashboard = () => {
    setActiveTab('assignments');
    router.push('/');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm text-center flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-zinc-100 border-t-[#FF5722] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#FF5722] animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 tracking-tight">Loading Assessment</h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
              Fetching from MongoDB...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeAssignment) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm text-center flex flex-col items-center gap-5">
          <div className="p-4 bg-amber-50 rounded-full border border-amber-100 text-amber-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-zinc-950">No Assessment Found</h3>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              Please choose an assessment from the dashboard or generate a new one.
            </p>
          </div>
          <Button onClick={handleBackToDashboard} className="w-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Hook to handle updating a question's content
  const handleUpdateQuestion = (updatedQ: Question) => {
    const store = useAssignmentStore.getState();
    const updatedAssignments = store.assignments.map((assignment) => {
      if (assignment.id === activeAssignment.id) {
        const nextQuestions = assignment.questions?.map((q) => 
          q.id === updatedQ.id ? updatedQ : q
        ) || [];
        
        // Recalculate total marks if changed
        const nextMarks = nextQuestions.reduce((sum, q) => sum + q.marks, 0);

        return {
          ...assignment,
          questions: nextQuestions,
          marks: nextMarks,
          numQuestions: nextQuestions.length
        };
      }
      return assignment;
    });

    useAssignmentStore.setState({ assignments: updatedAssignments });
    triggerToast('Question updated successfully!');
  };

  // Hook to handle deleting a question
  const handleDeleteQuestion = (id: string) => {
    const store = useAssignmentStore.getState();
    const updatedAssignments = store.assignments.map((assignment) => {
      if (assignment.id === activeAssignment.id) {
        const nextQuestions = assignment.questions?.filter((q) => q.id !== id) || [];
        const nextMarks = nextQuestions.reduce((sum, q) => sum + q.marks, 0);

        return {
          ...assignment,
          questions: nextQuestions,
          marks: nextMarks,
          numQuestions: nextQuestions.length
        };
      }
      return assignment;
    });

    useAssignmentStore.setState({ assignments: updatedAssignments });
    triggerToast('Question deleted successfully!');
  };

  // Hook to handle adding a new blank question
  const handleAddQuestion = () => {
    const store = useAssignmentStore.getState();
    const newQ: Question = {
      id: `custom-q-${Date.now()}`,
      section: 'Section B: Short Answer Questions',
      text: 'Describe the main characteristics and properties of electrical conductors.',
      type: 'Short Answer',
      difficulty: 'Medium',
      marks: 4,
      answerKeyText: 'Electrical conductors contain free electrons that can move easily when a voltage is applied, allowing current flow. Examples: copper, silver, iron.'
    };

    const updatedAssignments = store.assignments.map((assignment) => {
      if (assignment.id === activeAssignment.id) {
        const nextQuestions = [...(assignment.questions || []), newQ];
        const nextMarks = nextQuestions.reduce((sum, q) => sum + q.marks, 0);

        return {
          ...assignment,
          questions: nextQuestions,
          marks: nextMarks,
          numQuestions: nextQuestions.length
        };
      }
      return assignment;
    });

    useAssignmentStore.setState({ assignments: updatedAssignments });
    triggerToast('Custom question added!');
  };

  // Group questions by section
  const questionsBySection: Record<string, Question[]> = {};
  if (activeAssignment.questions) {
    activeAssignment.questions.forEach((q) => {
      if (!questionsBySection[q.section]) {
        questionsBySection[q.section] = [];
      }
      questionsBySection[q.section].push(q);
    });
  }

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Calculate cumulative sequential numbering index
  let cumulativeIndex = 1;

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-zinc-950 p-4 sm:p-6 md:p-8 flex flex-col gap-6 print:bg-white print:p-0 print:text-black">
      
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

      {/* ----------------- TOAST FEEDBACK ALERT ----------------- */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#18181B] text-white py-3 px-5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-1 bg-[#FF5722] rounded-full text-white">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ----------------- TOP UTILITY HEADER (Hidden in Print) ----------------- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E5E7EB] rounded-3xl px-6 py-4 shadow-sm print:hidden select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackToDashboard}
            className="p-2 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-full transition-colors border border-zinc-200 shadow-sm"
            title="Go back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-black text-zinc-950 tracking-tight truncate max-w-[200px] md:max-w-md">
              {activeAssignment.title}
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
              Draft Assessment Paper
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
          <label className="flex items-center gap-1.5 text-xs font-black text-zinc-600 md:mr-2 cursor-pointer select-none w-full md:w-auto">
            <input 
              type="checkbox" 
              checked={includeAnswerKey}
              onChange={(e) => setIncludeAnswerKey(e.target.checked)}
              className="rounded text-[#FF5722] focus:ring-[#FF5722]"
            />
            Include Answer Key
          </label>

          <div className="grid grid-cols-2 md:flex md:items-center gap-2.5 w-full md:w-auto">
            <Button
              onClick={handleAddQuestion}
              variant="secondary"
              size="sm"
              className="w-full md:w-auto"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Question
            </Button>

            <Button
              onClick={handleRegenerate}
              variant="secondary"
              size="sm"
              className="w-full md:w-auto hover:border-[#FF5722] hover:text-[#FF5722] transition-colors"
              leftIcon={<RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />}
            >
              Regenerate
            </Button>

            <Button
              onClick={handlePrint}
              variant="primary"
              size="sm"
              className="w-full md:w-auto col-span-2 md:col-span-1"
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Paper
            </Button>
          </div>
        </div>
      </header>

      {/* ----------------- DARK GREY SYSTEM RESPONSE HEADER (Figma Spec) ----------------- */}
      <div className="w-full max-w-4xl mx-auto bg-[#18181B] text-white p-5 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm print:hidden">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-2 bg-zinc-800 rounded-full text-[#FF5722] shrink-0 mt-0.5 md:mt-0">
            <Sparkles className="w-4.5 h-4.5 text-[#FF5722] animate-pulse" />
          </div>
          <p className="text-xs font-bold text-zinc-200 leading-relaxed max-w-xl break-words">
            Here is your AI-generated question paper for {activeAssignment.title}
          </p>
        </div>
        
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-zinc-950 px-5 py-2.5 rounded-full font-black text-xs shadow-sm transition-all active:scale-[0.98] w-full md:w-auto self-stretch md:self-auto flex-shrink-0 select-none"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          Download as PDF
        </button>
      </div>

      {/* ----------------- ASSIGNMENT TEST SHEET CONTAINER ----------------- */}
      <div className="w-full max-w-4xl mx-auto bg-white border border-zinc-200 rounded-2xl md:rounded-[2.5rem] p-4 md:p-12 shadow-sm print:border-none print:shadow-none print:p-0 print:w-full print:max-w-none">
        
        {/* Academic School Test Header */}
        <div className="flex flex-col items-center text-center pb-4 mb-6 border-b border-zinc-150">
          <h2 className="text-base font-black tracking-tight text-zinc-900 print:text-black">
            {activeAssignment.schoolName || 'School Name'}
            {activeAssignment.schoolLocation ? `, ${activeAssignment.schoolLocation}` : ''}
          </h2>
          <h3 className="text-sm font-black text-zinc-800 mt-1 print:text-black">
            Subject: {activeAssignment.title}
          </h3>
          <h4 className="text-xs font-black text-zinc-650 mt-0.5 print:text-black">
            Class: {activeAssignment.className || '8th'}
          </h4>

          {/* Time & Marks Metrics Grid */}
          <div className="w-full flex flex-row items-center justify-between mt-5 text-xs font-black text-zinc-800 print:text-black gap-2 flex-wrap md:flex-nowrap">
            <span>Time Allowed: {activeAssignment.timeAllowed || '3 hours'}</span>
            <span>Maximum Marks: {activeAssignment.marks}</span>
          </div>

          {/* Compulsory tag line */}
          <p className="text-xs font-bold text-zinc-800 mt-3 self-start print:text-black select-none">
            All questions are compulsory unless stated otherwise.
          </p>
        </div>

        {/* Custom underscored Student Info block */}
        <StudentInfo grade={activeAssignment.className || '8th'} />

        {/* Question Sections list mapping */}
        {Object.keys(questionsBySection).length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs font-semibold select-none">
            No questions are present on this paper yet. Click &quot;Add Question&quot; to begin.
          </div>
        ) : (
          <div className="flex flex-col gap-5 print:gap-4">
            {Object.keys(questionsBySection).sort().map((sectionTitle) => {
              const sectionQuestions = questionsBySection[sectionTitle];
              const startIndex = cumulativeIndex;
              cumulativeIndex += sectionQuestions.length; // Advance cumulative count

              return (
                <QuestionSection
                  key={sectionTitle}
                  title={sectionTitle}
                  questions={sectionQuestions}
                  onUpdateQuestion={handleUpdateQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  startIndex={startIndex}
                />
              );
            })}
          </div>
        )}

        {/* End of Question Paper Centered Line */}
        <div className="text-center my-8 border-t border-zinc-100 pt-6 select-none print:my-6">
          <span className="text-xs font-black text-zinc-900 uppercase tracking-widest print:text-black">
            End of Question Paper
          </span>
        </div>

        {/* ----------------- ANSWER KEY GRID (Figma Spec) ----------------- */}
        {includeAnswerKey && activeAssignment.questions && activeAssignment.questions.length > 0 && (
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t-2 border-dashed border-zinc-200 flex flex-col gap-4 break-before-page print:break-before-page">
            <h3 className="text-sm font-black text-zinc-900 print:text-black">
              Answer Key:
            </h3>

            <div className="flex flex-col gap-3">
              {activeAssignment.questions.map((q, i) => (
                <div key={q.id} className="text-xs leading-relaxed text-zinc-700 print:text-black font-semibold">
                  <span className="font-bold">{i + 1}.</span>{' '}
                  <span className="italic text-zinc-500 mr-1.5">[{q.difficulty}]</span>
                  <span>
                    {q.answerKeyText || 'Detailed answer explanation will be provided upon examination review.'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final signature footer */}
        <div className="mt-10 pt-8 border-t border-zinc-150 flex justify-between text-[10px] font-black text-zinc-400 print:text-zinc-500 select-none">
          <span>Invigilator&apos;s Signature: ..........................</span>
          <span>Teacher&apos;s Signature: ..........................</span>
        </div>

      </div>

      {/* Global CSS Inject to support print layouts perfectly */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #FFFFFF !important;
            color: #000000 !important;
          }
          /* Hide non-essential layout controls */
          header, footer, button, select, select-box, input[type="button"], .print\\:hidden {
            display: none !important;
          }
          /* Set workspace to occupy full size */
          main, div.min-h-screen {
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            background: transparent !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:text-black {
            color: #000000 !important;
          }
        }
      `}</style>

    </div>
  );
}
