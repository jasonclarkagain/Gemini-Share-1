import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const violationsTable = pgTable("violations", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  rule: text("rule").notNull(),
  description: text("description").notNull(),
  confidence: real("confidence").notNull().default(0),
  timestampStart: real("timestamp_start"),
  timestampEnd: real("timestamp_end"),
  autoFixAvailable: text("auto_fix_available").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertViolationSchema = createInsertSchema(violationsTable).omit({ id: true, createdAt: true });
export type InsertViolation = z.infer<typeof insertViolationSchema>;
export type Violation = typeof violationsTable.$inferSelect;
