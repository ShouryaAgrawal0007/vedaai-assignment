process.env.BULLMQ_DISABLE_TELEMETRY = '1';
import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { connectDB } from '../config/db';
import { AssignmentModel } from '../models/Assignment';
import { buildPrompt } from '../services/promptBuilder';
import { generateQuestions } from '../services/llmService';
import { emitJobUpdate } from '../socket/index';
import { GENERATION_QUEUE, GenerationJobData } from '../services/queueService';

// Connect DB when worker boots
connectDB();

const worker = new Worker<GenerationJobData>(
  GENERATION_QUEUE,
  async (job: Job<GenerationJobData>) => {
    const { assignmentId } = job.data;
    console.log(`⚙️  Processing job ${job.id} for assignment ${assignmentId}`);

    // 1. Mark assignment as processing
    const assignment = await AssignmentModel.findByIdAndUpdate(
      assignmentId,
      { status: 'processing' },
      { new: true }
    );

    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    // 2. Notify frontend: job started
    emitJobUpdate(assignmentId, 'job:started', {
      message: 'AI is generating your question paper...',
      progress: 10,
    });

    await job.updateProgress(10);

    // 3. Build structured prompt
    const prompt = buildPrompt(assignment);

    emitJobUpdate(assignmentId, 'job:progress', {
      message: 'Prompt built, calling Gemini AI...',
      progress: 30,
    });
    await job.updateProgress(30);

    // 4. Call Gemini and parse response
    const questions = await generateQuestions(prompt);

    emitJobUpdate(assignmentId, 'job:progress', {
      message: 'Questions generated, saving to database...',
      progress: 70,
    });
    await job.updateProgress(70);

    // 5. Calculate actual totals from generated questions
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    // 6. Store result in MongoDB
    const updated = await AssignmentModel.findByIdAndUpdate(
      assignmentId,
      {
        questions,
        marks: totalMarks,
        numQuestions: questions.length,
        status: 'completed',
      },
      { new: true }
    );

    await job.updateProgress(100);

    // 7. Notify frontend: completed with full data
    emitJobUpdate(assignmentId, 'job:completed', {
      message: 'Question paper ready!',
      progress: 100,
      assignment: {
        id: updated!._id.toString(),
        title: updated!.title,
        assignedOn: updated!.assignedOn,
        due: updated!.due,
        questionTypes: updated!.questionTypes,
        numQuestions: updated!.numQuestions,
        marks: updated!.marks,
        instructions: updated!.instructions,
        fileName: updated!.fileName,
        fileSize: updated!.fileSize,
        questions: updated!.questions,
        schoolName: updated!.schoolName,
        className: updated!.className,
        timeAllowed: updated!.timeAllowed,
      },
    });

    console.log(`✅ Job ${job.id} completed — ${questions.length} questions generated`);
    return { assignmentId, questionsCount: questions.length };
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

worker.on('failed', async (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);

  if (job?.data?.assignmentId) {
    await AssignmentModel.findByIdAndUpdate(job.data.assignmentId, {
      status: 'failed',
      errorMessage: err.message,
    });

    emitJobUpdate(job.data.assignmentId, 'job:failed', {
      message: 'Generation failed. Please try again.',
      error: err.message,
    });
  }
});

worker.on('ready', () => {
  console.log('🚀 BullMQ Worker ready — listening for generation jobs');
});

export default worker;
