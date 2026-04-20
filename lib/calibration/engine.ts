/**
 * Calibration Engine — carb cycling methodology.
 *
 * Based on the IleNut plan (Jaime García Arellano, Jan 2025):
 *   - Both day types hit the same total calories (TDEE ± goal delta)
 *   - Protein: 32% of daily calories — same on both days
 *   - Low-carb day:  Carbs 25% | Fat fills remainder (~43%)
 *   - High-carb day: Carbs 48% | Fat fills remainder (~20%)
 *   - Cycle ratio: 3 low-carb : 1 high-carb
 *
 * At 2,000 kcal this produces the IleNut baseline exactly:
 *   Low:  P=160g  C=125g  F=96g
 *   High: P=160g  C=240g  F=44g
 *
 * Scales automatically with TDEE as body composition and training load change.
 */

import type { CalibrationInput, CalibrationResult, DailyTargets, Goal } from "../../types/calibration";

// ---------------------------------------------------------------------------
// Macro percentages (IleNut methodology)
// ---------------------------------------------------------------------------

const PROTEIN_PCT   = 0.32;
const CARBS_LOW_PCT = 0.25;   // low-carb (rest) day
const CARBS_HI_PCT  = 0.48;   // high-carb (training) day
// Fat = remainder after protein + carbs on each day type

// ---------------------------------------------------------------------------
// Calorie delta by goal (applied on top of TDEE — same for both day types)
// ---------------------------------------------------------------------------

const GOAL_DELTA: Record<Goal, number> = {
  cut:         -250,
  recomp:         0,
  maintenance:    0,
  bulk:        +300,
};

// ---------------------------------------------------------------------------
// Activity multipliers (Katch-McArdle / ACSM scale)
// ---------------------------------------------------------------------------

function activityMultiplier(days: number): number {
  if (days === 0) return 1.20;
  if (days === 1) return 1.30;
  if (days === 2) return 1.375;
  if (days === 3) return 1.45;
  if (days === 4) return 1.55;
  if (days === 5) return 1.65;
  if (days === 6) return 1.725;
  return 1.90; // 7 days
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
  if (body_fat_mass_kg >= weight_kg) return "body_fat_mass_kg must be less than weight_kg";
  return null;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function calibrate(input: CalibrationInput): CalibrationResult {
  const error = validate(input);
  if (error) return { success: false, error };

  const { weight_kg, body_fat_mass_kg, goal, training_days_per_week } = input;

  const lean_mass = weight_kg - body_fat_mass_kg;
  const bmr       = 370 + 21.6 * lean_mass;             // Katch-McArdle
  const tdee      = bmr * activityMultiplier(training_days_per_week);
  const calories  = Math.round(tdee + GOAL_DELTA[goal]); // same both day types

  // Protein — 32% on both days
  const protein_kcal = calories * PROTEIN_PCT;
  const protein_g    = Math.round(protein_kcal / 4);

  // Low-carb (rest) day
  const carbs_low_kcal = calories * CARBS_LOW_PCT;
  const carbs_g_rest   = Math.round(carbs_low_kcal / 4);
  const fat_low_kcal   = calories - protein_kcal - carbs_low_kcal;
  const fat_g_rest     = Math.round(fat_low_kcal / 9);

  // High-carb (training) day
  const carbs_hi_kcal  = calories * CARBS_HI_PCT;
  const carbs_g_training = Math.round(carbs_hi_kcal / 4);
  const fat_hi_kcal    = calories - protein_kcal - carbs_hi_kcal;
  const fat_g_training = Math.round(fat_hi_kcal / 9);

  const bf_pct = Math.round((body_fat_mass_kg / weight_kg) * 100);

  const rationale =
    `Based on your InBody scan (${weight_kg}kg, ${bf_pct}% body fat, ${lean_mass.toFixed(1)}kg lean mass), ` +
    `BMR is ${Math.round(bmr)} kcal and TDEE is ${Math.round(tdee)} kcal at ${training_days_per_week} training days/week. ` +
    `Target: ${calories} kcal/day (${goal}). ` +
    `Carb cycling 3:1 — Low-carb days (25%C/32%P/43%F): ${protein_g}g protein / ${carbs_g_rest}g carbs / ${fat_g_rest}g fat. ` +
    `High-carb days (48%C/32%P/20%F): ${protein_g}g protein / ${carbs_g_training}g carbs / ${fat_g_training}g fat.`;

  const targets: DailyTargets = {
    protein_g,
    carbs_g_rest,
    fat_g_rest,
    calories_rest: calories,
    carbs_g_training,
    fat_g_training,
    calories_training: calories,
    rationale,
  };

  return { success: true, targets };
}
