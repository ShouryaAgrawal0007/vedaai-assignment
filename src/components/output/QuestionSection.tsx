import React from 'react';
import { Question } from '../../store/useAssignmentStore';
import { QuestionCard } from './QuestionCard';

interface QuestionSectionProps {
  title: string;
  questions: Question[];
  onUpdateQuestion: (updatedQuestion: Question) => void;
  onDeleteQuestion: (id: string) => void;
  startIndex: number;
}

export const QuestionSection: React.FC<QuestionSectionProps> = ({
  title,
  questions,
  onUpdateQuestion,
  onDeleteQuestion,
  startIndex
}) => {
  if (questions.length === 0) return null;

  // Extract "Section A", "Section B" and subtitles
  const parseSectionTitle = (rawTitle: string) => {
    const parts = rawTitle.split(':');
    const header = parts[0]?.trim() || 'Section';
    const subtitle = parts[1]?.trim() || 'Questions';
    return { header, subtitle };
  };

  const { header, subtitle } = parseSectionTitle(title);
  const sampleMarks = questions[0]?.marks || 2;

  return (
    <div className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-6 print:mt-4 print:break-inside-avoid">
      
      {/* Centered Section Divider */}
      <div className="text-center my-2 md:my-3 select-none">
        <h3 className="text-base font-black text-zinc-900 tracking-tight print:text-black">
          {header}
        </h3>
      </div>

      {/* Subsection details and italics instructions */}
      <div className="flex flex-col gap-0.5 md:gap-1 select-none">
        <h4 className="text-sm font-black text-zinc-900 print:text-black">
          {subtitle}
        </h4>
        <p className="text-xs text-zinc-500 italic print:text-zinc-700">
          Attempt all questions. Each question carries {sampleMarks} {sampleMarks === 1 ? 'mark' : 'marks'}
        </p>
      </div>

      {/* Sequential Questions list */}
      <div className="flex flex-col gap-2 md:gap-3.5 mt-1 md:mt-2">
        {questions.map((q, index) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={startIndex + index}
            onUpdate={onUpdateQuestion}
            onDelete={onDeleteQuestion}
          />
        ))}
      </div>

    </div>
  );
};
