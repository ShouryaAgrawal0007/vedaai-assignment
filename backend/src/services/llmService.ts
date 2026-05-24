import Groq from 'groq-sdk';
import { IQuestion } from '../models/Assignment';

interface GeneratedSection {
  title: string;
  instruction: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    marks: number;
    options?: string[];
    answerKeyText?: string;
  }>;
}

interface GeneratedPaper {
  sections: GeneratedSection[];
}

export const generateQuestions = async (prompt: string): Promise<IQuestion[]> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const groq = new Groq({ apiKey });

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are an expert teacher. Always respond with valid JSON only. No markdown, no explanation.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const responseText = response.choices[0]?.message?.content || '';

  const cleaned = responseText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  let parsed: GeneratedPaper;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Invalid JSON from Groq: ${cleaned.slice(0, 200)}`);
  }

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Missing sections array in response');
  }

  const questions: IQuestion[] = [];
  for (const section of parsed.sections) {
    if (!section.questions) continue;
    for (const q of section.questions) {
      if (!q.text || !q.type || !q.difficulty || !q.marks) continue;
      const difficulty = (['Easy', 'Medium', 'Hard'] as const).includes(q.difficulty)
        ? q.difficulty : 'Medium';
      questions.push({
        id: q.id || `q-${Date.now()}-${Math.random()}`,
        text: q.text,
        type: q.type,
        section: section.title,
        difficulty,
        marks: Number(q.marks),
        options: q.options?.length ? q.options : undefined,
        answerKeyText: q.answerKeyText || undefined,
      });
    }
  }

  if (questions.length === 0) throw new Error('No valid questions generated');
  return questions;
};