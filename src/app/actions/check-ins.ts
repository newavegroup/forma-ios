"use server";

import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const checkInSchema = z.object({
  date: z.string().datetime().optional(),
  weightKg: z.number().min(30).max(300).optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
  recoveryScore: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export type CheckInData = z.infer<typeof checkInSchema>;

export async function getCheckIns(userId: string) {
  return db
    .select()
    .from(checkIns)
    .where(eq(checkIns.userId, userId))
    .orderBy(desc(checkIns.date));
}

export async function createCheckIn(
  userId: string,
  data: CheckInData
): Promise<{ error?: string; id?: string }> {
  const parsed = checkInSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const [checkIn] = await db
      .insert(checkIns)
      .values({
        userId,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        weightKg: parsed.data.weightKg?.toString(),
        energyLevel: parsed.data.energyLevel,
        recoveryScore: parsed.data.recoveryScore,
        notes: parsed.data.notes,
      })
      .returning({ id: checkIns.id });

    return { id: checkIn.id };
  } catch {
    return { error: "Failed to save check-in." };
  }
}
