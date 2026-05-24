import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AssignmentModel } from '../models/Assignment';
import { generationQueue } from '../services/queueService';
import { redis } from '../config/redis';

const router = Router();

// Multer config — memory storage (files not persisted, just metadata used)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'text/plain'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  },
});

// Validation schema matching frontend form fields
const CreateAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  due: z.string().min(1, 'Due date is required'),
  questionTypes: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : JSON.parse(val))),
  numQuestions: z.coerce.number().int().min(1).max(100),
  marks: z.coerce.number().int().min(1).max(500),
  instructions: z.string().optional().default(''),
});

// Helper to format today's date as DD-MM-YYYY
const getFormattedDate = (d: Date): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper to convert YYYY-MM-DD → DD-MM-YYYY
const formatDue = (due: string): string => {
  if (!due.includes('-')) return due;
  const parts = due.split('-');
  if (parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return due;
};

// ─── POST /api/assignments ─────────────────────────────────────────────────────
// Creates assignment in DB, queues generation job, returns assignment immediately
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const parsed = CreateAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { title, due, questionTypes, numQuestions, marks, instructions } = parsed.data;

    // Build assignment doc
    const assignment = await AssignmentModel.create({
      title,
      assignedOn: getFormattedDate(new Date()),
      due: formatDue(due),
      questionTypes,
      numQuestions,
      marks,
      instructions,
      fileName: req.file?.originalname,
      fileSize: req.file
        ? `${(req.file.size / 1024 / 1024).toFixed(1)} MB`
        : undefined,
      status: 'pending',
    });

    // Add job to BullMQ queue
    const job = await generationQueue.add(
      'generate',
      { assignmentId: assignment._id.toString() },
      { jobId: `gen-${assignment._id}` }
    );

    // Store jobId reference
    await AssignmentModel.findByIdAndUpdate(assignment._id, {
      jobId: job.id,
    });

    console.log(`📬 Assignment ${assignment._id} queued as job ${job.id}`);

    return res.status(201).json({
      success: true,
      assignment: {
        id: assignment._id.toString(),
        title: assignment.title,
        assignedOn: assignment.assignedOn,
        due: assignment.due,
        questionTypes: assignment.questionTypes,
        numQuestions: assignment.numQuestions,
        marks: assignment.marks,
        instructions: assignment.instructions,
        fileName: assignment.fileName,
        fileSize: assignment.fileSize,
        status: assignment.status,
      },
      jobId: job.id,
    });
  } catch (err: unknown) {
    console.error('POST /assignments error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/assignments ──────────────────────────────────────────────────────
// Fetch all assignments (with Redis caching — 60s TTL)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'assignments:all';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json({ success: true, assignments: JSON.parse(cached), cached: true });
    }

    const assignments = await AssignmentModel.find()
      .sort({ createdAt: -1 })
      .lean();

    const shaped = assignments.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      assignedOn: a.assignedOn,
      due: a.due,
      questionTypes: a.questionTypes,
      numQuestions: a.numQuestions,
      marks: a.marks,
      instructions: a.instructions,
      fileName: a.fileName,
      fileSize: a.fileSize,
      questions: a.questions,
      status: a.status,
    }));

    await redis.setex(cacheKey, 60, JSON.stringify(shaped));

    return res.json({ success: true, assignments: shaped, cached: false });
  } catch (err) {
    console.error('GET /assignments error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/assignments/:id ──────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cacheKey = `assignment:${req.params.id}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json({ success: true, assignment: JSON.parse(cached), cached: true });
    }

    const a = await AssignmentModel.findById(req.params.id).lean();
    if (!a) return res.status(404).json({ error: 'Assignment not found' });

    const shaped = {
      id: a._id.toString(),
      title: a.title,
      assignedOn: a.assignedOn,
      due: a.due,
      questionTypes: a.questionTypes,
      numQuestions: a.numQuestions,
      marks: a.marks,
      instructions: a.instructions,
      fileName: a.fileName,
      fileSize: a.fileSize,
      questions: a.questions,
      status: a.status,
    };

    // Only cache completed assignments
    if (a.status === 'completed') {
      await redis.setex(cacheKey, 300, JSON.stringify(shaped));
    }

    return res.json({ success: true, assignment: shaped });
  } catch (err) {
    console.error('GET /assignments/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/assignments/:id/regenerate ─────────────────────────────────────
// Re-queues a new generation job for existing assignment
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await AssignmentModel.findByIdAndUpdate(
      req.params.id,
      { status: 'pending', questions: [], errorMessage: undefined },
      { new: true }
    );

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Invalidate cache
    await redis.del(`assignment:${req.params.id}`);
    await redis.del('assignments:all');

    const job = await generationQueue.add(
      'generate',
      { assignmentId: assignment._id.toString() },
      { jobId: `regen-${assignment._id}-${Date.now()}` }
    );

    return res.json({ success: true, jobId: job.id });
  } catch (err) {
    console.error('POST /regenerate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/assignments/:id ──────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await AssignmentModel.findByIdAndDelete(req.params.id);
    await redis.del(`assignment:${req.params.id}`);
    await redis.del('assignments:all');
    return res.json({ success: true });
  } catch (err) {
    console.error('DELETE /assignments/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
