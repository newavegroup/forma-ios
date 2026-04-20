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

export interface DailyTargets {
  protein_g: number;
  carbs_g_training: number;
  carbs_g_rest: number;
  fat_g: number;
  calories_training: number;
  calories_rest: number;
  /** Plain-language explanation of how targets were derived */
  rationale: string;
}

export interface CalibrationResult {
  success: boolean;
  targets?: DailyTargets;
  error?: string;
}
