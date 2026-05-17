import { Router } from "express";
import { db, violationsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { ListViolationsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListViolationsQueryParams.parse(req.query);
  const conditions: SQL[] = [];

  if (query.category) {
    conditions.push(eq(violationsTable.category, query.category));
  }
  if (query.severity) {
    conditions.push(eq(violationsTable.severity, query.severity));
  }

  const violations = await db
    .select()
    .from(violationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(query.limit ?? 20);

  res.json(violations.map(v => ({
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
  })));
});

export default router;
