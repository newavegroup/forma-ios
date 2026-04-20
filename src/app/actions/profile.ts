"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

const profileSchema = z.object({
  age: z.number().int().min(10).max(100).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  sport: z.string().optional(),
  trainingDaysPerWeek: z.number().int().min(0).max(7).optional(),
  goal: z.string().optional(),
  notes: z.string().optional(),
});

export type ProfileData = z.infer<typeof profileSchema>;

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function getProfile(_unused?: string) {
  const session = await requireSession();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.userId))
    .limit(1);
  return profile ?? null;
}

export async function upsertProfile(
  _unused: string,
  data: ProfileData
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.userId))
      .limit(1);

    if (existing[0]) {
      await db
        .update(profiles)
        .set({
          age: parsed.data.age,
          weightKg: parsed.data.weightKg?.toString(),
          heightCm: parsed.data.heightCm?.toString(),
          sport: parsed.data.sport,
          trainingDaysPerWeek: parsed.data.trainingDaysPerWeek,
          goal: parsed.data.goal,
          notes: parsed.data.notes,
        })
        .where(eq(profiles.userId, session.userId));
    } else {
      await db.insert(profiles).values({
        userId: session.userId,
        age: parsed.data.age,
        weightKg: parsed.data.weightKg?.toString(),
        heightCm: parsed.data.heightCm?.toString(),
        sport: parsed.data.sport,
        trainingDaysPerWeek: parsed.data.trainingDaysPerWeek,
        goal: parsed.data.goal,
        notes: parsed.data.notes,
      });
    }

    return { success: true };
  } catch {
    return { error: "Failed to save profile." };
  }
}
