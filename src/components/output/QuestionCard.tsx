import React, { useState } from 'react';
import { Edit3, Trash2, X, Plus } from 'lucide-react';
import { Question } from '../../store/useAssignmentStore';

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (updatedQuestion: Question) => void;
  onDelete: (id: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(question.text);
  const [marks, setMarks] = useState(question.marks);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(question.difficulty);
  const [options, setOptions] = useState<string[]>(question.options || []);

  const handleSave = () => {
    onUpdate({
      ...question,
      text,
      marks,
      difficulty,
      options: question.type === 'MCQs' || question.type === 'True/False' ? options : undefined
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setText(question.text);
    setMarks(question.marks);
    setDifficulty(question.difficulty);
    setOptions(question.options || []);
    setIsEditing(false);
  };

  const handleOptionChange = (i: number, val: string) => {
    const nextOptions = [...options];
    nextOptions[i] = val;
    setOptions(nextOptions);
  };

  const addOption = () => {
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const removeOption = (i: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== i));
    }
  };

  return (
    <div className="group relative flex flex-col w-full transition-all duration-150 py-1.5 rounded-lg select-text">
      
      {isEditing ? (
        // EDIT MODE (Elegant nested edit block)
        <div className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl p-5 flex flex-col gap-4 shadow-sm my-2 print:hidden">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Question Content
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-white border border-zinc-200 focus:border-zinc-500 text-xs font-semibold text-zinc-800 rounded-2xl p-3 focus:outline-none min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Marks
              </label>
              <input
                type="number"
                min="1"
                value={marks}
                onChange={(e) => setMarks(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-zinc-200 focus:border-zinc-500 text-xs font-semibold text-zinc-800 rounded-2xl px-4 py-2.5 focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className="w-full bg-white border border-zinc-200 focus:border-zinc-500 text-xs font-semibold text-zinc-800 rounded-2xl px-4 py-2.5 focus:outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Multiple choice options editor */}
          {(question.type === 'MCQs' || question.type === 'True/False') && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Options
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 w-5">
                      {String.fromCharCode(65 + i)})
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-500 text-xs font-semibold text-zinc-800 rounded-xl px-3 py-1.5 focus:outline-none"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {question.type === 'MCQs' && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#FF5722] hover:underline mt-1 w-fit"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Choice
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 mt-1">
            <button
              onClick={handleCancel}
              className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 hover:bg-zinc-150 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-[10px] font-bold bg-zinc-950 text-white hover:bg-zinc-800 rounded-full transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        // VIEW MODE (Clean academic line matching Screenshot 2)
        <div className="flex flex-col w-full relative group/row">
          
          {/* Main Question Line */}
          <div className="flex items-start justify-between w-full gap-3 flex-wrap sm:flex-nowrap">
            <div className="text-xs text-zinc-900 print:text-black leading-relaxed font-semibold">
              <span className="mr-1.5 font-bold">{index}.</span>
              <span className="font-bold">[{difficulty}]</span>{' '}
              <span>{text}</span>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-zinc-900 print:text-black whitespace-nowrap">
                [{marks} {marks === 1 ? 'Mark' : 'Marks'}]
              </span>

              {/* Action utilities (Visible only on hover in browser, hidden in print) */}
              <div className="flex items-center gap-1.5 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity duration-150 print:hidden bg-white/80 backdrop-blur-sm pl-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:bg-zinc-100 hover:text-zinc-800 text-zinc-400 rounded-full transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(question.id)}
                  className="p-1 hover:bg-red-50 hover:text-red-600 text-zinc-400 rounded-full transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* MCQ Choices listing */}
          {(question.type === 'MCQs' || question.type === 'True/False') && options.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pl-6 mt-1.5 print:pl-6 select-text">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-700 print:text-black leading-relaxed font-semibold">
                  <span className="font-bold">
                    {String.fromCharCode(65 + i)})
                  </span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
