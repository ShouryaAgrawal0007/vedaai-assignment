import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  id: string;
  text: string;
  type: string;
  section: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  options?: string[];
  answerKeyText?: string;
}

export interface IAssignment extends Document {
  title: string;
  assignedOn: string;
  due: string;
  questionTypes: string[];
  numQuestions: number;
  marks: number;
  instructions: string;
  fileName?: string;
  fileSize?: string;
  questions?: IQuestion[];
  jobId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: { type: String, required: true },
  section: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  marks: { type: Number, required: true, min: 0 },
  options: [{ type: String }],
  answerKeyText: { type: String },
}, { _id: false });

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    assignedOn: { type: String, required: true },
    due: { type: String, required: true },
    questionTypes: [{ type: String, required: true }],
    numQuestions: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
    instructions: { type: String, default: '' },
    fileName: { type: String },
    fileSize: { type: String },
    questions: [QuestionSchema],
    jobId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const AssignmentModel = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
