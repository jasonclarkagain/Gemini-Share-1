import { Router } from "express";
import { db, jobsTable, violationsTable, activityTable } from "@workspace/db";
import { eq, desc, and, SQL } from "drizzle-orm";
import {
  ListJobsQueryParams,
  CreateJobBody,
  GetJobParams,
  ApproveJobParams,
  RejectJobParams,
} from "@workspace/api-zod";

const router = Router();

function formatJob(job: typeof jobsTable.$inferSelect, violations: typeof violationsTable.$inferSelect[]) {
  return {
    id: String(job.id),
    title: job.title,
    youtubeUrl: job.youtubeUrl ?? null,
    thumbnailUrl: job.thumbnailUrl ?? null,
    duration: job.duration ?? null,
    status: job.status,
    riskScore: job.riskScore,
    analysisStage: job.analysisStage ?? null,
    violations: violations.map(v => ({
      id: String(v.id),
      jobId: String(v.jobId),
      category: v.category,
      severity: v.severity,
      rule: v.rule,
      description: v.description,
      confidence: v.confidence,
      timestampStart: v.timestampStart ?? null,
      timestampEnd: v.timestampEnd ?? null,
      autoFixAvailable: v.autoFixAvailable === "true",
      createdAt: v.createdAt.toISOString(),
    })),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const query = ListJobsQueryParams.parse(req.query);
  const conditions: SQL[] = [];
  if (query.status) {
    conditions.push(eq(jobsTable.status, query.status));
  }

  const jobs = await db
    .select()
    .from(jobsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(jobsTable.createdAt))
    .limit(query.limit ?? 20)
    .offset(query.offset ?? 0);

  res.json(jobs.map(j => formatJob(j, [])));
});

router.post("/", async (req, res) => {
  const body = CreateJobBody.parse(req.body);
  const [job] = await db.insert(jobsTable).values({
    title: body.title,
    youtubeUrl: body.youtubeUrl ?? null,
    duration: body.duration ?? null,
    status: "queued",
    riskScore: 0,
  }).returning();

  await db.insert(activityTable).values({
    jobId: job.id,
    jobTitle: job.title,
    eventType: "submitted",
    message: `Video "${job.title}" submitted for analysis`,
    riskScore: null,
  });

  // Simulate async processing
  simulateAnalysis(job.id, job.title).catch(() => {});

  res.status(201).json(formatJob(job, []));
});

router.get("/:id", async (req, res) => {
  const { id } = GetJobParams.parse(req.params);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, parseInt(id)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  const violations = await db.select().from(violationsTable).where(eq(violationsTable.jobId, job.id));
  res.json(formatJob(job, violations));
});

router.post("/:id/approve", async (req, res) => {
  const { id } = ApproveJobParams.parse(req.params);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, parseInt(id)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  const [updated] = await db.update(jobsTable).set({ status: "approved" }).where(eq(jobsTable.id, job.id)).returning();
  await db.insert(activityTable).values({
    jobId: job.id,
    jobTitle: job.title,
    eventType: "approved",
    message: `Video "${job.title}" approved for publishing`,
    riskScore: job.riskScore,
  });
  const violations = await db.select().from(violationsTable).where(eq(violationsTable.jobId, job.id));
  res.json(formatJob(updated, violations));
});

router.post("/:id/reject", async (req, res) => {
  const { id } = RejectJobParams.parse(req.params);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, parseInt(id)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  const [updated] = await db.update(jobsTable).set({ status: "rejected" }).where(eq(jobsTable.id, job.id)).returning();
  await db.insert(activityTable).values({
    jobId: job.id,
    jobTitle: job.title,
    eventType: "rejected",
    message: `Video "${job.title}" rejected`,
    riskScore: job.riskScore,
  });
  const violations = await db.select().from(violationsTable).where(eq(violationsTable.jobId, job.id));
  res.json(formatJob(updated, violations));
});

async function simulateAnalysis(jobId: number, jobTitle: string) {
  const stages = [
    "Frame extraction",
    "Audio fingerprinting",
    "Metadata analysis",
    "Visual classification",
    "Audio event detection",
    "Speech transcription",
    "Policy scoring",
    "Contextual synthesis",
    "Risk calibration",
    "Report generation",
  ];

  await sleep(500);
  await db.update(jobsTable).set({ status: "processing", analysisStage: stages[0] }).where(eq(jobsTable.id, jobId));
  await db.insert(activityTable).values({
    jobId,
    jobTitle,
    eventType: "started",
    message: `Analysis pipeline started for "${jobTitle}"`,
    riskScore: null,
  });

  for (let i = 1; i < stages.length; i++) {
    await sleep(800 + Math.random() * 400);
    await db.update(jobsTable).set({ analysisStage: stages[i] }).where(eq(jobsTable.id, jobId));
  }

  await sleep(600);

  const riskScore = Math.round(Math.random() * 100);
  const isFlagged = riskScore >= 50;

  const violationPool = [
    { category: "visual", severity: "high", rule: "NSFW_CONTENT", description: "Detected potentially explicit visual content at 2:34", confidence: 0.87, timestampStart: 154, timestampEnd: 162, autoFix: true },
    { category: "audio", severity: "medium", rule: "HATE_SPEECH_AUDIO", description: "Audio contains language violating hate speech policy", confidence: 0.73, timestampStart: 45, timestampEnd: 52, autoFix: true },
    { category: "metadata", severity: "low", rule: "CLICKBAIT_TITLE", description: "Title contains clickbait patterns: excessive capitalization and sensational language", confidence: 0.91, timestampStart: null, timestampEnd: null, autoFix: true },
    { category: "contextual", severity: "critical", rule: "GLORIFICATION_VIOLENCE", description: "Contextual synthesis indicates content glorifies violent acts", confidence: 0.82, timestampStart: 210, timestampEnd: 245, autoFix: false },
    { category: "visual", severity: "low", rule: "FLASH_SEIZURE_RISK", description: "Rapid flashing detected that may trigger photosensitive seizures", confidence: 0.95, timestampStart: 89, timestampEnd: 91, autoFix: true },
    { category: "audio", severity: "medium", rule: "COPYRIGHT_MUSIC", description: "Audio fingerprint matches copyrighted music: artist detected", confidence: 0.99, timestampStart: 120, timestampEnd: 180, autoFix: true },
    { category: "metadata", severity: "medium", rule: "KEYWORD_STUFFING", description: "Description contains excessive keyword repetition", confidence: 0.78, timestampStart: null, timestampEnd: null, autoFix: true },
  ];

  const numViolations = isFlagged ? 2 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 2);
  const selectedViolations = violationPool.sort(() => Math.random() - 0.5).slice(0, numViolations);

  for (const v of selectedViolations) {
    await db.insert(violationsTable).values({
      jobId,
      category: v.category,
      severity: v.severity,
      rule: v.rule,
      description: v.description,
      confidence: v.confidence,
      timestampStart: v.timestampStart ?? null,
      timestampEnd: v.timestampEnd ?? null,
      autoFixAvailable: v.autoFix ? "true" : "false",
    });
  }

  const finalStatus = isFlagged ? "flagged" : "completed";
  await db.update(jobsTable).set({
    status: finalStatus,
    riskScore,
    analysisStage: null,
  }).where(eq(jobsTable.id, jobId));

  await db.insert(activityTable).values({
    jobId,
    jobTitle,
    eventType: isFlagged ? "flagged" : "completed",
    message: isFlagged
      ? `Video "${jobTitle}" flagged — ${numViolations} violations detected (risk: ${riskScore})`
      : `Video "${jobTitle}" passed all policy checks (risk: ${riskScore})`,
    riskScore,
  });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default router;
