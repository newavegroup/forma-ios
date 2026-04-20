"use server";

import { db } from "@/db";
import { dailyTargets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getDailyTargets(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  // Try today's targets first, fall back to most recent
  const rows = await db
    .select()
    .from(dailyTargets)
    .where(eq(dailyTargets.userId, userId))
    .orderBy(desc(dailyTargets.effectiveDate))
    .limit(1);

  return rows[0] ?? null;
}
