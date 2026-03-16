import { Queue } from "bullmq";
import { connection } from "../config/redis.js";

export const execQueue = new Queue("execution", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    attempts: 3
  },
});
