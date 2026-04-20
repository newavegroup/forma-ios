import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { db } from "@/db";
import { inbodyScans, dailyTargets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
    scan_date, weight_kg, muscle_mass_kg, body_fat_percent,
    body_fat_mass_kg, visceral_fat, parsed_confidence, flagged_fields,
    pdf_path, goal, training_days_per_week,
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

  // Run calibration engine
  const calibration = calibrate({
    weight_kg,
    muscle_mass_kg,
    body_fat_mass_kg,
    goal: goal as Goal,
    training_days_per_week,
  });

  const targets = calibration.success ? (calibration.targets ?? null) : null;

  // Persist targets (delete + insert to avoid unnamed unique constraint issues)
  if (targets) {
    const today = new Date().toISOString().split("T")[0];
    try {
      await db
        .delete(dailyTargets)
        .where(
          and(
            eq(dailyTargets.userId, session.userId),
            eq(dailyTargets.effectiveDate, today)
          )
        );
      await db.insert(dailyTargets).values({
        userId: session.userId,
        effectiveDate: today,
        proteinG: targets.protein_g,
        carbsGTraining: targets.carbs_g_training,
        carbsGRest: targets.carbs_g_rest,
        fatG: targets.fat_g,
        caloriesTraining: targets.calories_training,
        caloriesRest: targets.calories_rest,
        rationale: targets.rationale,
        sourceScanId: scan.id,
      });
    } catch (err) {
      console.error("Failed to persist daily_targets:", err);
      // Non-fatal — targets still returned to client
    }
  }

  return NextResponse.json({
    success: true,
    scan,
    targets,
    rationale: targets?.rationale ?? null,
  });
}
