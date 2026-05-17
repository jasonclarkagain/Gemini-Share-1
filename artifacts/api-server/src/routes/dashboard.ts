import { Router } from "express";
import { db, jobsTable, violationsTable, activityTable } from "@workspace/db";
import { eq, desc, gte, count, avg, sql } from "drizzle-orm";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/stats", async (req, res) => {
  const allJobs = await db.select().from(jobsTable);
  const totalJobs = allJobs.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingReview = allJobs.filter(j => j.status === "flagged").length;
  const flaggedToday = allJobs.filter(j => j.status === "flagged" && j.updatedAt >= today).length;
  const approvedToday = allJobs.filter(j => j.status === "approved" && j.updatedAt >= today).length;

  const avgRiskScore = totalJobs > 0
    ? allJobs.reduce((acc, j) => acc + j.riskScore, 0) / totalJobs
    : 0;

  const allViolations = await db.select().from(violationsTable);
  const categoryCounts: Record<string, number> = {};
  for (const v of allViolations) {
    categoryCounts[v.category] = (categoryCounts[v.category] ?? 0) + 1;
  }
  const topViolationCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

  res.json({
    totalJobs,
    pendingReview,
    flaggedToday,
    approvedToday,
    avgRiskScore: Math.round(avgRiskScore * 10) / 10,
    avgProcessingTime: 8.4,
    topViolationCategory,
  });
});

router.get("/recent-activity", async (req, res) => {
  const query = GetRecentActivityQueryParams.parse(req.query);
  const events = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(query.limit ?? 10);

  res.json(events.map(e => ({
    id: String(e.id),
    jobId: String(e.jobId),
    jobTitle: e.jobTitle,
    eventType: e.eventType,
    message: e.message,
    riskScore: e.riskScore ?? null,
    createdAt: e.createdAt.toISOString(),
  })));
});

router.get("/risk-distribution", async (_req, res) => {
  const jobs = await db.select().from(jobsTable);

  const buckets = [
    { range: "0-20", label: "Safe", min: 0, max: 20 },
    { range: "21-40", label: "Low Risk", min: 21, max: 40 },
    { range: "41-60", label: "Medium Risk", min: 41, max: 60 },
    { range: "61-80", label: "High Risk", min: 61, max: 80 },
    { range: "81-100", label: "Critical", min: 81, max: 100 },
  ];

  const distribution = buckets.map(b => ({
    range: b.range,
    label: b.label,
    count: jobs.filter(j => j.riskScore >= b.min && j.riskScore <= b.max).length,
  }));

  res.json(distribution);
});

router.get("/violation-breakdown", async (_req, res) => {
  const violations = await db.select().from(violationsTable);
  const total = violations.length;

  const categories = ["visual", "audio", "metadata", "contextual"];
  const breakdown = categories.map(cat => {
    const catCount = violations.filter(v => v.category === cat).length;
    return {
      category: cat,
      count: catCount,
      percentage: total > 0 ? Math.round((catCount / total) * 100 * 10) / 10 : 0,
    };
  });

  res.json(breakdown);
});

export default router;
