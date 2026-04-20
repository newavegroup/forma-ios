import { describe, it, expect } from "vitest";
import { calibrate } from "../../lib/calibration/engine";
import type { CalibrationInput } from "../../types/calibration";

// ---------------------------------------------------------------------------
// Fixtures — Jaime's real InBody120 scan (Nov 2025)
// weight: 60.2kg, BFM: 15.7kg → lean mass: 44.5kg
// At 4 training days/week, recomp goal → TDEE ≈ 2,087 kcal → target 2,087 kcal
// IleNut baseline is 2,000 kcal → close match (within 5%)
// ---------------------------------------------------------------------------

const BASE: CalibrationInput = {
  weight_kg: 60.2,
  muscle_mass_kg: 44.5,
  body_fat_mass_kg: 15.7,
  goal: "recomp",
  training_days_per_week: 4,
};

// ---------------------------------------------------------------------------
// Core structure
// ---------------------------------------------------------------------------

describe("calibrate — success path", () => {
  it("returns success: true with targets defined", () => {
    const r = calibrate(BASE);
    expect(r.success).toBe(true);
    expect(r.targets).toBeDefined();
  });

  it("calories are the same on both day types (carb cycling redistributes macros, not calories)", () => {
    const r = calibrate(BASE);
    expect(r.targets!.calories_training).toBe(r.targets!.calories_rest);
  });

  it("protein is the same on both day types", () => {
    const r = calibrate(BASE);
    // protein = 32% of calories both days
    expect(r.targets!.protein_g).toBeGreaterThan(0);
    // verify it's ~32% of total calories
    const pct = (r.targets!.protein_g * 4) / r.targets!.calories_training;
    expect(pct).toBeCloseTo(0.32, 1);
  });

  it("rationale is a non-empty string", () => {
    const r = calibrate(BASE);
    expect(r.targets!.rationale.length).toBeGreaterThan(50);
  });
});

// ---------------------------------------------------------------------------
// IleNut methodology invariants
// ---------------------------------------------------------------------------

describe("calibrate — carb cycling invariants", () => {
  it("high-carb day has more carbs than low-carb day", () => {
    const r = calibrate(BASE);
    expect(r.targets!.carbs_g_training).toBeGreaterThan(r.targets!.carbs_g_rest);
  });

  it("low-carb day has more fat than high-carb day", () => {
    const r = calibrate(BASE);
    expect(r.targets!.fat_g_rest).toBeGreaterThan(r.targets!.fat_g_training);
  });

  it("low-carb day carbs are ~25% of calories (±2%)", () => {
    const r = calibrate(BASE);
    const pct = (r.targets!.carbs_g_rest * 4) / r.targets!.calories_rest;
    expect(pct).toBeGreaterThan(0.23);
    expect(pct).toBeLessThan(0.27);
  });

  it("high-carb day carbs are ~48% of calories (±2%)", () => {
    const r = calibrate(BASE);
    const pct = (r.targets!.carbs_g_training * 4) / r.targets!.calories_training;
    expect(pct).toBeGreaterThan(0.46);
    expect(pct).toBeLessThan(0.50);
  });

  it("fat fills remainder after protein + carbs on each day", () => {
    const r = calibrate(BASE);
    const t = r.targets!;

    // Low-carb day
    const computed_low = t.protein_g * 4 + t.carbs_g_rest * 4 + t.fat_g_rest * 9;
    expect(Math.abs(computed_low - t.calories_rest)).toBeLessThan(20);

    // High-carb day
    const computed_hi = t.protein_g * 4 + t.carbs_g_training * 4 + t.fat_g_training * 9;
    expect(Math.abs(computed_hi - t.calories_training)).toBeLessThan(20);
  });
});

// ---------------------------------------------------------------------------
// IleNut baseline verification (at 2,000 kcal)
// Calibrate with params that produce exactly ~2,000 kcal to verify ratios
// ---------------------------------------------------------------------------

describe("calibrate — IleNut baseline check", () => {
  it("at 2,000 kcal produces ~160g protein, ~125g carbs (low), ~240g carbs (high)", () => {
    // Find input that gives ~2,000 kcal
    // For recomp (delta=0): calories = BMR × multiplier
    // We need BMR × 1.55 ≈ 2,000 → BMR ≈ 1,290 → lean_mass ≈ (1290-370)/21.6 ≈ 42.6kg
    const r = calibrate({
      weight_kg: 58,
      muscle_mass_kg: 44,
      body_fat_mass_kg: 14,  // lean_mass = 44kg → BMR = 370+21.6×44 ≈ 1320 → TDEE ≈ 2046 kcal
      goal: "recomp",
      training_days_per_week: 4,
    });
    expect(r.success).toBe(true);
    const t = r.targets!;

    // Protein ~32% of ~2046 kcal → ~164g (close to IleNut's 160g)
    expect(t.protein_g).toBeGreaterThan(150);
    expect(t.protein_g).toBeLessThan(175);

    // Low-carb carbs ~25% of ~2046 → ~128g (close to IleNut's 125g)
    expect(t.carbs_g_rest).toBeGreaterThan(115);
    expect(t.carbs_g_rest).toBeLessThan(145);

    // High-carb carbs ~48% of ~2046 → ~245g (close to IleNut's 240g)
    expect(t.carbs_g_training).toBeGreaterThan(225);
    expect(t.carbs_g_training).toBeLessThan(265);

    // Low-carb fat ~43% of ~2046 → ~97g (close to IleNut's 96g)
    expect(t.fat_g_rest).toBeGreaterThan(85);
    expect(t.fat_g_rest).toBeLessThan(115);

    // High-carb fat ~20% of ~2046 → ~45g (close to IleNut's 44g)
    expect(t.fat_g_training).toBeGreaterThan(35);
    expect(t.fat_g_training).toBeLessThan(55);
  });
});

// ---------------------------------------------------------------------------
// Goal direction
// ---------------------------------------------------------------------------

describe("calibrate — goal direction", () => {
  it("cut has fewer calories than bulk", () => {
    const cut  = calibrate({ ...BASE, goal: "cut" });
    const bulk = calibrate({ ...BASE, goal: "bulk" });
    expect(cut.targets!.calories_training).toBeLessThan(bulk.targets!.calories_training);
  });

  it("more training days → higher TDEE → higher calories", () => {
    const low  = calibrate({ ...BASE, training_days_per_week: 2 });
    const high = calibrate({ ...BASE, training_days_per_week: 6 });
    expect(high.targets!.calories_training).toBeGreaterThan(low.targets!.calories_training);
  });

  it("all macros are positive integers", () => {
    const r = calibrate(BASE);
    const t = r.targets!;
    for (const val of [t.protein_g, t.carbs_g_rest, t.carbs_g_training, t.fat_g_rest, t.fat_g_training]) {
      expect(val).toBeGreaterThan(0);
      expect(Number.isInteger(val)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Validation — bad inputs
// ---------------------------------------------------------------------------

describe("calibrate — validation", () => {
  it("rejects weight_kg below 40", () => {
    const r = calibrate({ ...BASE, weight_kg: 30 });
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/weight_kg/);
  });

  it("rejects weight_kg above 200", () => {
    expect(calibrate({ ...BASE, weight_kg: 250 }).success).toBe(false);
  });

  it("rejects muscle_mass_kg below 10", () => {
    expect(calibrate({ ...BASE, muscle_mass_kg: 5 }).success).toBe(false);
  });

  it("rejects training_days_per_week above 7", () => {
    expect(calibrate({ ...BASE, training_days_per_week: 8 }).success).toBe(false);
  });

  it("rejects when body_fat_mass_kg >= weight_kg", () => {
    expect(calibrate({ ...BASE, weight_kg: 60, body_fat_mass_kg: 62 }).success).toBe(false);
  });
});
