import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { db } from "@/db";
import { inbodyScans, dailyTargets } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { calibrate } from "../../../../lib/calibration/engine";
import type { Goal } from "../../../../types/calibration";

const schema = z.object({
  goal: z.enum(["recomp", "cut", "bulk", "maintenance"]),
  training_days_per_week: z.number().int().min(0).max(7),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Load latest InBody scan
  const [scan] = await db
    .select()
    .from(inbodyScans)
    .where(eq(inbodyScans.userId, session.userId))
    .orderBy(desc(inbodyScans.scanDate))
    .limit(1);

  if (!scan) {
    return NextResponse.json({ error: "No InBody scan on file. Upload a scan first." }, { status: 400 });
  }

  const calibration = calibrate({
    weight_kg: parseFloat(scan.weightKg),
    muscle_mass_kg: parseFloat(scan.muscleMassKg),
    body_fat_mass_kg: parseFloat(scan.bodyFatMassKg),
    goal: parsed.data.goal as Goal,
    training_days_per_week: parsed.data.training_days_per_week,
  });

  if (!calibration.success || !calibration.targets) {
    return NextResponse.json({ error: calibration.error ?? "Calibration failed" }, { status: 500 });
  }

  const targets = calibration.targets;
  const today = new Date().toISOString().split("T")[0];

  await db
    .delete(dailyTargets)
    .where(and(eq(dailyTargets.userId, session.userId), eq(dailyTargets.effectiveDate, today)));

  await db.insert(dailyTargets).values({
    userId: session.userId,
    effectiveDate: today,
    proteinG: targets.protein_g,
    carbsGTraining: targets.carbs_g_training,
    carbsGRest: targets.carbs_g_rest,
    fatG: targets.fat_g_rest,
    fatGTraining: targets.fat_g_training,
    caloriesTraining: targets.calories_training,
    caloriesRest: targets.calories_rest,
    rationale: targets.rationale,
    sourceScanId: scan.id,
  });

  return NextResponse.json({ success: true, targets, rationale: targets.rationale });
}
