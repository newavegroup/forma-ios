export type Goal = "recomp" | "cut" | "bulk" | "maintenance";

export interface CalibrationInput {
  /** Body composition from the most recent InBody scan */
  weight_kg: number;
  muscle_mass_kg: number; // Skeletal Muscle Mass
  body_fat_mass_kg: number;
  /** User's declared goal */
  goal: Goal;
  /** How many days per week the user trains (1–7) */
  training_days_per_week: number;
}

/**
 * Carb cycling targets — both day types target the same total calories.
 * "Training" day = high-carb day (more carbs, less fat).
 * "Rest" day = low-carb day (fewer carbs, more fat).
 */
export interface DailyTargets {
  protein_g: number;
  // Low-carb day (rest)
  carbs_g_rest: number;
  fat_g_rest: number;
  calories_rest: number;
  // High-carb day (training)
  carbs_g_training: number;
  fat_g_training: number;
  calories_training: number;
  /** Plain-language explanation of how targets were derived */
  rationale: string;
}

export interface CalibrationResult {
  success: boolean;
  targets?: DailyTargets;
  error?: string;
}
