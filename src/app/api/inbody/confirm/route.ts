import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { db } from "@/db";
import { inbodyScans } from "@/db/schema";
import { z } from "zod";

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
  } = parsed.data;

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

  return NextResponse.json({ success: true, scan });
}
