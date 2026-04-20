import { describe, it, expect } from "vitest";
import { calibrate } from "../../lib/calibration/engine";
import type { CalibrationInput } from "../../types/calibration";

// ---------------------------------------------------------------------------
// Fixtures — based on Jaime's real InBody120 scan (Nov 2025)
// weight: 60.2kg, SMM: 44.5kg, BFM: 15.7kg → lean mass: 44.5kg
// ---------------------------------------------------------------------------

const BASE_INPUT: CalibrationInput = {
  weight_kg: 60.2,
  muscle_mass_kg: 44.5,
  body_fat_mass_kg: 15.7,
  goal: "recomp",
  training_days_per_week: 4,
};

// ---------------------------------------------------------------------------
// Success path
// ---------------------------------------------------------------------------

describe("calibrate — recomp baseline", () => {
  it("returns success: true", () => {
    const result = calibrate(BASE_INPUT);
    expect(result.success).toBe(true);
    expect(result.targets).toBeDefined();
  });

  it("protein target is reasonable for lean mass (2.2g/kg × 44.5kg ≈ 98g)", () => {
    const result = calibrate(BASE_INPUT);
    // lean mass = 60.2 - 15.7 = 44.5kg; 44.5 × 2.2 = 97.9 → 98g
    expect(result.targets!.protein_g).toBe(98);
  });

  it("training calories exceed rest calories", () => {
    const result = calibrate(BASE_INPUT);
    expect(result.targets!.calories_training).toBeGreaterThan(result.targets!.calories_rest);
  });

  it("training carbs exceed rest carbs", () => {
    const result = calibrate(BASE_INPUT);
    expect(result.targets!.carbs_g_training).toBeGreaterThan(result.targets!.carbs_g_rest);
  });

  it("fat_g is same for both days (single fat target)", () => {
    const result = calibrate(BASE_INPUT);
    expect(result.targets!.fat_g).toBeGreaterThan(0);
  });

  it("all macro values are positive integers", () => {
    const result = calibrate(BASE_INPUT);
    const t = result.targets!;
    expect(t.protein_g).toBeGreaterThan(0);
    expect(t.carbs_g_training).toBeGreaterThan(0);
    expect(t.carbs_g_rest).toBeGreaterThan(0);
    expect(t.fat_g).toBeGreaterThan(0);
    expect(Number.isInteger(t.protein_g)).toBe(true);
    expect(Number.isInteger(t.carbs_g_training)).toBe(true);
    expect(Number.isInteger(t.fat_g)).toBe(true);
  });

  it("rationale is a non-empty string", () => {
    const result = calibrate(BASE_INPUT);
    expect(result.targets!.rationale.length).toBeGreaterThan(50);
  });
});

// ---------------------------------------------------------------------------
// Goal direction tests — the key invariants from the build plan
// ---------------------------------------------------------------------------

describe("calibrate — goal direction invariants", () => {
  it("cut: protein higher than bulk (deficit needs more protein to preserve muscle)", () => {
    const cut = calibrate({ ...BASE_INPUT, goal: "cut" });
    const bulk = calibrate({ ...BASE_INPUT, goal: "bulk" });
    expect(cut.targets!.protein_g).toBeGreaterThan(bulk.targets!.protein_g);
  });

  it("bulk: calories higher than cut on both training and rest days", () => {
    const cut = calibrate({ ...BASE_INPUT, goal: "cut" });
    const bulk = calibrate({ ...BASE_INPUT, goal: "bulk" });
    expect(bulk.targets!.calories_training).toBeGreaterThan(cut.targets!.calories_training);
    expect(bulk.targets!.calories_rest).toBeGreaterThan(cut.targets!.calories_rest);
  });

  it("more training days → higher TDEE → higher absolute calorie targets", () => {
    const low = calibrate({ ...BASE_INPUT, training_days_per_week: 2 });
    const high = calibrate({ ...BASE_INPUT, training_days_per_week: 6 });
    expect(high.targets!.calories_training).toBeGreaterThan(low.targets!.calories_training);
    expect(high.targets!.calories_rest).toBeGreaterThan(low.targets!.calories_rest);
  });

  it("more muscle mass → more protein (protein scales with lean mass)", () => {
    const low = calibrate({ ...BASE_INPUT, weight_kg: 70, muscle_mass_kg: 45, body_fat_mass_kg: 15 });
    const high = calibrate({ ...BASE_INPUT, weight_kg: 85, muscle_mass_kg: 60, body_fat_mass_kg: 15 });
    expect(high.targets!.protein_g).toBeGreaterThan(low.targets!.protein_g);
  });

  it("training day carbs > rest day carbs for all goals", () => {
    const goals = ["cut", "recomp", "bulk", "maintenance"] as const;
    for (const goal of goals) {
      const result = calibrate({ ...BASE_INPUT, goal });
      expect(result.targets!.carbs_g_training).toBeGreaterThan(
        result.targets!.carbs_g_rest
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Macro math integrity
// ---------------------------------------------------------------------------

describe("calibrate — macro math", () => {
  it("training day macros sum to within 50 kcal of calorie target", () => {
    const result = calibrate(BASE_INPUT);
    const t = result.targets!;
    const computed =
      t.protein_g * 4 + t.carbs_g_training * 4 + t.fat_g * 9;
    expect(Math.abs(computed - t.calories_training)).toBeLessThan(50);
  });

  it("rest day macros sum to within 50 kcal of calorie target", () => {
    const result = calibrate(BASE_INPUT);
    const t = result.targets!;
    const computed =
      t.protein_g * 4 + t.carbs_g_rest * 4 + t.fat_g * 9;
    expect(Math.abs(computed - t.calories_rest)).toBeLessThan(50);
  });
});

// ---------------------------------------------------------------------------
// Validation — bad inputs
// ---------------------------------------------------------------------------

describe("calibrate — validation", () => {
  it("rejects weight_kg below 40", () => {
    const result = calibrate({ ...BASE_INPUT, weight_kg: 30 });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/weight_kg/);
  });

  it("rejects weight_kg above 200", () => {
    const result = calibrate({ ...BASE_INPUT, weight_kg: 250 });
    expect(result.success).toBe(false);
  });

  it("rejects muscle_mass_kg below 10", () => {
    const result = calibrate({ ...BASE_INPUT, muscle_mass_kg: 5 });
    expect(result.success).toBe(false);
  });

  it("rejects training_days_per_week above 7", () => {
    const result = calibrate({ ...BASE_INPUT, training_days_per_week: 8 });
    expect(result.success).toBe(false);
  });

  it("rejects when body_fat_mass_kg >= weight_kg (impossible lean mass)", () => {
    const result = calibrate({ ...BASE_INPUT, weight_kg: 60, body_fat_mass_kg: 62 });
    expect(result.success).toBe(false);
  });
});
