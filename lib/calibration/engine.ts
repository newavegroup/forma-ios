/**
 * Calibration Engine — Phase 4
 *
 * Pure function. No LLM, no side effects, fully deterministic.
 * Takes body composition + goal + training load → daily macro targets.
 *
 * Formulas:
 *   BMR  = 370 + (21.6 × lean_mass_kg)          [Katch-McArdle]
 *   TDEE = BMR × activity_multiplier
 *   Protein = lean_mass_kg × protein_multiplier  [goal-scaled]
 *   Fat = 25% of calories (both days)
 *   Carbs = (calories - protein_kcal - fat_kcal) / 4
 *
 * Training vs rest day split: carbs and calories differ, protein is constant.
 */

import type { CalibrationInput, CalibrationResult, DailyTargets, Goal } from "../../types/calibration";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Protein target per kg of lean mass, by goal */
const PROTEIN_MULTIPLIER: Record<Goal, number> = {
  cut: 2.4,       // higher — preserve muscle in deficit
  recomp: 2.2,    // moderate surplus/deficit cycling
  bulk: 2.0,      // lower — calorie surplus handles muscle signal
  maintenance: 2.0,
};

/**
 * Caloric adjustment vs TDEE by goal and day type.
 * Training day = extra energy demand. Rest day = lower demand.
 */
const CALORIE_DELTA: Record<Goal, { training: number; rest: number }> = {
  cut:         { training: -200, rest: -400 },
  recomp:      { training: +100, rest: -200 },
  bulk:        { training: +400, rest: +200 },
  maintenance: { training: +100, rest: -100 },
};

/** Fat as a fraction of total calories */
const FAT_FRACTION = 0.25;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Activity multiplier for TDEE based on weekly training frequency.
 * Follows standard Katch-McArdle activity scale.
 */
function activityMultiplier(trainingDaysPerWeek: number): number {
  if (trainingDaysPerWeek <= 1) return 1.2;   // sedentary
  if (trainingDaysPerWeek <= 3) return 1.375; // lightly active
  if (trainingDaysPerWeek <= 5) return 1.55;  // moderately active
  if (trainingDaysPerWeek <= 6) return 1.725; // very active
  return 1.9;                                  // extremely active (daily)
}

function round(n: number): number {
  return Math.round(n);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(input: CalibrationInput): string | null {
  const { weight_kg, muscle_mass_kg, body_fat_mass_kg, training_days_per_week } = input;

  if (weight_kg < 40 || weight_kg > 200) return "weight_kg out of range (40–200)";
  if (muscle_mass_kg < 10 || muscle_mass_kg > 80) return "muscle_mass_kg out of range (10–80)";
  if (body_fat_mass_kg < 2 || body_fat_mass_kg > 100) return "body_fat_mass_kg out of range (2–100)";
  if (training_days_per_week < 0 || training_days_per_week > 7) return "training_days_per_week must be 0–7";

  const lean_mass = weight_kg - body_fat_mass_kg;
  if (lean_mass <= 0) return "lean mass cannot be zero or negative";

  return null;
}

// ---------------------------------------------------------------------------
// Rationale builder
// ---------------------------------------------------------------------------

function buildRationale(
  input: CalibrationInput,
  lean_mass: number,
  bmr: number,
  tdee: number,
  targets: DailyTargets
): string {
  const { goal, training_days_per_week } = input;
  const bf_pct = round((input.body_fat_mass_kg / input.weight_kg) * 100);

  const goalLabel: Record<Goal, string> = {
    cut: "cut (caloric deficit)",
    recomp: "body recomposition",
    bulk: "bulk (caloric surplus)",
    maintenance: "maintenance",
  };

  const lines = [
    `Goal: ${goalLabel[goal]}.`,
    `Lean mass: ${lean_mass.toFixed(1)} kg (${bf_pct}% body fat).`,
    `BMR: ${round(bmr)} kcal (Katch-McArdle). TDEE: ${round(tdee)} kcal (${training_days_per_week} training days/week).`,
    `Protein: ${targets.protein_g}g (${PROTEIN_MULTIPLIER[goal]}g per kg lean mass).`,
    `Fat: ${targets.fat_g}g (25% of calories).`,
    `Training days: ${targets.calories_training} kcal — ${targets.carbs_g_training}g carbs.`,
    `Rest days: ${targets.calories_rest} kcal — ${targets.carbs_g_rest}g carbs.`,
  ];

  return lines.join(" ");
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function calibrate(input: CalibrationInput): CalibrationResult {
  const validationError = validate(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const { weight_kg, muscle_mass_kg, body_fat_mass_kg, goal, training_days_per_week } = input;

  // Lean mass is the anchor for protein and BMR
  const lean_mass = weight_kg - body_fat_mass_kg;

  // BMR via Katch-McArdle (lean-mass based, more accurate than Mifflin-St Jeor for athletes)
  const bmr = 370 + 21.6 * lean_mass;

  // TDEE
  const tdee = bmr * activityMultiplier(training_days_per_week);

  // Caloric targets
  const delta = CALORIE_DELTA[goal];
  const calories_training = round(tdee + delta.training);
  const calories_rest = round(tdee + delta.rest);

  // Protein — same both days
  const protein_g = round(lean_mass * PROTEIN_MULTIPLIER[goal]);
  const protein_kcal = protein_g * 4;

  // Fat — 25% of each day's calories
  const fat_g_training = round((calories_training * FAT_FRACTION) / 9);
  const fat_g_rest = round((calories_rest * FAT_FRACTION) / 9);

  // Use the average fat so there's one fat target (simpler UX)
  const fat_g = round((fat_g_training + fat_g_rest) / 2);
  const fat_kcal = fat_g * 9;

  // Carbs — remainder
  const carbs_g_training = Math.max(0, round((calories_training - protein_kcal - fat_kcal) / 4));
  const carbs_g_rest = Math.max(0, round((calories_rest - protein_kcal - fat_kcal) / 4));

  const targets: DailyTargets = {
    protein_g,
    carbs_g_training,
    carbs_g_rest,
    fat_g,
    calories_training,
    calories_rest,
    rationale: "", // filled below
  };

  targets.rationale = buildRationale(input, lean_mass, bmr, tdee, targets);

  return { success: true, targets };
}
