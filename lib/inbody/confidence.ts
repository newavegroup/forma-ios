import type { InBodyScan } from "../../types/inbody";

export interface ConfidenceResult {
  success: boolean;
  confidence?: "high" | "low";
  flagged_fields?: string[];
  error?: string;
}

// Physiological plausibility gates — values outside these ranges are flagged
const RANGES: Record<string, { min: number; max: number }> = {
  weight_kg: { min: 40, max: 200 },
  muscle_mass_kg: { min: 10, max: 80 },
  body_fat_percent: { min: 3, max: 60 },
  body_fat_mass_kg: { min: 2, max: 100 },
  visceral_fat: { min: 1, max: 20 },
};

const REQUIRED_FIELDS: Array<keyof InBodyScan> = [
  "weight_kg",
  "muscle_mass_kg",
  "body_fat_percent",
  "body_fat_mass_kg",
  "visceral_fat",
  "scan_date",
];

/**
 * Scores the confidence of a parsed InBodyScan.
 *
 * Rules:
 *   - 3+ fields missing (not extracted at all) → success: false
 *   - 1–2 fields missing OR any field outside physiological range → low confidence
 *   - All 6 fields present and in range → high confidence
 */
export function scoreConfidence(scan: Partial<InBodyScan>): ConfidenceResult {
  const missingFields: string[] = [];
  const outOfRangeFields: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = scan[field];

    if (value === undefined || value === null) {
      missingFields.push(field);
      continue;
    }

    const range = RANGES[field];
    if (range && typeof value === "number") {
      if (value < range.min || value > range.max) {
        outOfRangeFields.push(field);
      }
    }
  }

  if (missingFields.length >= 3) {
    return {
      success: false,
      error: `Too many fields could not be extracted (${missingFields.join(", ")}). Please re-upload a clearer PDF.`,
    };
  }

  const flagged_fields = [...missingFields, ...outOfRangeFields];

  if (flagged_fields.length > 0) {
    return {
      success: true,
      confidence: "low",
      flagged_fields,
    };
  }

  return {
    success: true,
    confidence: "high",
  };
}
