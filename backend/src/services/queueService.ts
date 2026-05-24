import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const GENERATION_QUEUE = 'question-generation';

export const generationQueue = new Queue(GENERATION_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export interface GenerationJobData {
  assignmentId: string;
}
