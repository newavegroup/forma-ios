import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { db } from "@/db";
import { inbodyScans, dailyTargets } from "@/db/schema";
import { z } from "zod";
import { calibrate } from "../../../../../lib/calibration/engine";
import type { Goal } from "../../../../../types/calibration";

const confirmSchema = z.object({
  scan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight_kg: z.number().min(40).max(200),
  muscle_mass_kg: z.number().min(10).max(80),
  body_fat_percent: z.number().min(3).max(60),
  body_fat_mass_kg: z.number().min(2).max(100),
  visceral_fat: z.number().int().min(1).max(20),
  parsed_confidence: z.enum(["high", "low"]),
  flagged_fields: z.array(z.string()).optional(),
  pdf_path: z.string().nullable().optional(),
  // Calibration inputs supplied by the client (from onboarding / profile)
  goal: z.enum(["recomp", "cut", "bulk", "maintenance"]).default("recomp"),
  training_days_per_week: z.number().int().min(0).max(7).default(4),
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

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const {
    scan_date,
    weight_kg,
    muscle_mass_kg,
    body_fat_percent,
    body_fat_mass_kg,
    visceral_fat,
    parsed_confidence,
    flagged_fields,
    pdf_path,
    goal,
    training_days_per_week,
  } = parsed.data;

  // Insert scan
  const [scan] = await db
    .insert(inbodyScans)
    .values({
      userId: session.userId,
      scanDate: scan_date,
      weightKg: weight_kg.toString(),
      muscleMassKg: muscle_mass_kg.toString(),
      bodyFatPercent: body_fat_percent.toString(),
      bodyFatMassKg: body_fat_mass_kg.toString(),
      visceralFat: visceral_fat,
      parsedConfidence: parsed_confidence,
      flaggedFields: flagged_fields ?? [],
      pdfPath: pdf_path ?? null,
    })
    .returning();

  // Run calibration engine and persist targets
  const calibration = calibrate({
    weight_kg,
    muscle_mass_kg,
    body_fat_mass_kg,
    goal: goal as Goal,
    training_days_per_week,
  });

  let savedTargets = null;
  if (calibration.success && calibration.targets) {
    const t = calibration.targets;
    const today = new Date().toISOString().split("T")[0];

    const [inserted] = await db
      .insert(dailyTargets)
      .values({
        userId: session.userId,
        effectiveDate: today,
        proteinG: t.protein_g,
        carbsGTraining: t.carbs_g_training,
        carbsGRest: t.carbs_g_rest,
        fatG: t.fat_g,
        caloriesTraining: t.calories_training,
        caloriesRest: t.calories_rest,
        rationale: t.rationale,
        sourceScanId: scan.id,
      })
      .onConflictDoUpdate({
        target: [dailyTargets.userId, dailyTargets.effectiveDate],
        set: {
          proteinG: t.protein_g,
          carbsGTraining: t.carbs_g_training,
          carbsGRest: t.carbs_g_rest,
          fatG: t.fat_g,
          caloriesTraining: t.calories_training,
          caloriesRest: t.calories_rest,
          rationale: t.rationale,
          sourceScanId: scan.id,
        },
      })
      .returning();

    savedTargets = inserted;
  }

  return NextResponse.json({
    success: true,
    scan,
    targets: savedTargets,
    rationale: calibration.targets?.rationale ?? null,
  });
}
