import { setTimeout } from "timers/promises";
import Fastify from "fastify";
import { db, t, Job } from "./database.js";
import { eq, or, and, lt, asc, inArray } from "drizzle-orm";
import pMap from "p-map";

const CONFIG = {
  BATCH_SIZE: 5,
  CONCURRENCY: 2,
};

Fastify()
  .get("*", async (_request, reply) => {
    const { id } = await db.insert(t.jobs).values({}).returning().get();
    reply.send(`created job ${id}`);
  })
  .listen({ port: 8080 });

while (true) {
  const minDuration = setTimeout(1000);
  console.log(`${new Date().toLocaleTimeString()} - top of 'while true' loop`);
  await handleJobs();
  await minDuration; // to make sure we don't run more frequently than once per second
}

async function handleJobs() {
  const jobsToRun = await db.transaction(async (tx) => {
    // in postgres we'd want to use select-for-update
    const eligibleJobs = await tx
      .select()
      .from(t.jobs)
      .where(
        or(
          eq(t.jobs.status, "created"),
          and(eq(t.jobs.status, "failed"), lt(t.jobs.failedTimes, 3)), // if it failed 3 times, don't retry again
        ),
      )
      .orderBy(asc(t.jobs.createdAt)) // oldest first
      .limit(CONFIG.BATCH_SIZE);

    const jobIds = eligibleJobs.map((j) => j.id);

    if (jobIds.length === 0) {
      return [];
    }

    // set jobs as 'active'
    return tx
      .update(t.jobs)
      .set({ status: "active" })
      .where(inArray(t.jobs.id, jobIds))
      .returning();
  });

  await pMap(jobsToRun, runJob, { concurrency: CONFIG.CONCURRENCY });
}

async function runJob(job: Job): Promise<void> {
  await setTimeout(3000);

  await db
    .update(t.jobs)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(t.jobs.id, job.id));
}
