import { IAssignment } from '../models/Assignment';

/**
 * Builds a structured Gemini prompt from assignment form data.
 * The prompt enforces strict JSON output so the response is always parseable.
 */
export const buildPrompt = (assignment: IAssignment): string => {
  const questionTypesList = assignment.questionTypes.join(', ');
  const totalQuestions = assignment.numQuestions;
  const totalMarks = assignment.marks;
  const marksPerQuestion = Math.floor(totalMarks / totalQuestions);

  // Distribute question types across sections
  const sections = assignment.questionTypes.map((type, i) => {
    const sectionLabel = String.fromCharCode(65 + i); // A, B, C...
    const count = Math.ceil(totalQuestions / assignment.questionTypes.length);
    const sectionMarks = marksPerQuestion;

    return {
      label: `Section ${sectionLabel}`,
      type,
      count,
      marksPerQ: sectionMarks,
    };
  });

  const sectionDescriptions = sections
    .map(
      (s) =>
        `- ${s.label}: ${s.count} ${s.type} question(s), ${s.marksPerQ} marks each`
    )
    .join('\n');

  return `
You are an expert teacher and curriculum designer. Generate a complete, well-structured exam question paper as a JSON object.

ASSIGNMENT DETAILS:
- Subject/Topic: ${assignment.title}
- Grade/Class: ${assignment.className || '8th'}
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}
- Question Types Required: ${questionTypesList}
- Special Instructions: ${assignment.instructions || 'None'}
- Due Date: ${assignment.due}

SECTION DISTRIBUTION:
${sectionDescriptions}

STRICT OUTPUT FORMAT (respond ONLY with valid JSON, no markdown, no extra text):

{
  "sections": [
    {
      "title": "Section A: Multiple Choice Questions",
      "instruction": "Attempt all questions. Each question carries 2 marks.",
      "questions": [
        {
          "id": "q1",
          "text": "Question text here",
          "type": "MCQs",
          "difficulty": "Easy",
          "marks": 2,
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answerKeyText": "Correct answer with brief explanation"
        }
      ]
    }
  ]
}

RULES:
1. difficulty must be exactly "Easy", "Medium", or "Hard"
2. For MCQs: always include exactly 4 options array
3. For Short Answer / Long Answer / Essay: omit the options field
4. Total marks across ALL questions must equal exactly ${totalMarks}
5. Total questions across ALL sections must equal exactly ${totalQuestions}
6. Each question must have a unique id (q1, q2, q3...)
7. Questions must be relevant, educational, and grade-appropriate
8. Vary difficulty: ~40% Easy, ~40% Medium, ~20% Hard
9. Section titles must match format: "Section A: <Type> Questions"
10. ONLY return the JSON object. No explanation, no markdown fences.
`.trim();
};
