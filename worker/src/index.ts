import { Worker } from "bullmq";
import dotenv from "dotenv";
import { Redis } from "ioredis";

dotenv.config();

const connection = new Redis({
  maxRetriesPerRequest: null,
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT)!,
  username: process.env.REDIS_USERNAME, // usually 'default' for Aiven
  password: process.env.REDIS_PASSWORD,
  tls: {}, // this enables TLS (rediss://)
});

const myWorker = new Worker(
  process.env.QUEUE_NAME!,
  async (job: any) => {
    // Will print { foo: 'bar'} for the first job
    // and { qux: 'baz' } for the second.
    console.log(job.data);
  },
  {
    connection,
  }
);
