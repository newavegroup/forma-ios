"use server";

import { db } from "@/db";
import { profiles, trainingSchedule } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

export type TrainingDay = {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  trainingType?: string;
  durationMin?: number;
};

export type OnboardingData = {
  goal: string;
  foodPreferences: {
    proteins: string[];
    cultures: string[];
    dislikes: string;
  };
  trainingDays: TrainingDay[];
};

export async function saveOnboarding(
  data: OnboardingData
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    // Save goal + food prefs to profile
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.userId))
      .limit(1);

    const foodPrefsNote = JSON.stringify({
      proteins: data.foodPreferences.proteins,
      cultures: data.foodPreferences.cultures,
      dislikes: data.foodPreferences.dislikes,
    });

    if (existing[0]) {
      await db
        .update(profiles)
        .set({
          goal: data.goal,
          trainingDaysPerWeek: data.trainingDays.length,
          notes: foodPrefsNote,
        })
        .where(eq(profiles.userId, session.userId));
    } else {
      await db.insert(profiles).values({
        userId: session.userId,
        goal: data.goal,
        trainingDaysPerWeek: data.trainingDays.length,
        notes: foodPrefsNote,
      });
    }

    // Save training schedule for the next 8 weeks
    const today = new Date();
    const rows: { userId: string; date: string; isTrainingDay: boolean; trainingType?: string; durationMin?: number }[] = [];

    const trainingDaySet = new Set(data.trainingDays.map((d) => d.dayOfWeek));
    const trainingDayMap = new Map(data.trainingDays.map((d) => [d.dayOfWeek, d]));

    for (let i = 0; i < 56; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      const isoDate = d.toISOString().split("T")[0];
      const td = trainingDayMap.get(dow);
      rows.push({
        userId: session.userId,
        date: isoDate,
        isTrainingDay: trainingDaySet.has(dow),
        trainingType: td?.trainingType,
        durationMin: td?.durationMin,
      });
    }

    // Upsert all rows
    await db
      .insert(trainingSchedule)
      .values(rows)
      .onConflictDoUpdate({
        target: [trainingSchedule.userId, trainingSchedule.date],
        set: {
          isTrainingDay: trainingSchedule.isTrainingDay,
          trainingType: trainingSchedule.trainingType,
          durationMin: trainingSchedule.durationMin,
        },
      });

    return {};
  } catch (err) {
    console.error(err);
    return { error: "Failed to save onboarding data." };
  }
}
