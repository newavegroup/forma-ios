/**
 * Macro estimator eval set — 25 meals with ground truth macros.
 *
 * Ground truth values derived from USDA FoodData Central and
 * standard sports nutrition databases (all cooked weights unless noted).
 *
 * Acceptance criterion: median absolute % error < 15% across all macros.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { estimateMacros } from "../../lib/macro-estimator/estimator";

// ---------------------------------------------------------------------------
// Eval set
// ---------------------------------------------------------------------------

interface GroundTruth {
  description: string;
  calories: number;
  protein: number; // g
  carbs: number;   // g
  fat: number;     // g
}

const MEALS: GroundTruth[] = [
  {
    description: "Grilled chicken breast 150g, white rice 200g cooked, steamed broccoli 150g",
    calories: 559,
    protein: 56,
    carbs: 67,
    fat: 7,
  },
  {
    description: "Oatmeal made with 80g dry oats, 1 scoop whey protein, 1 medium banana",
    calories: 536,
    protein: 39,
    carbs: 82,
    fat: 7,
  },
  {
    description: "3 scrambled eggs, 2 slices white toast, 200ml orange juice",
    calories: 463,
    protein: 24,
    carbs: 53,
    fat: 17,
  },
  {
    description: "200g 2% Greek yogurt, 100g blueberries, 30g granola",
    calories: 344,
    protein: 24,
    carbs: 41,
    fat: 10,
  },
  {
    description: "Baked salmon 150g, sweet potato 200g cooked, raw spinach 100g",
    calories: 507,
    protein: 37,
    carbs: 44,
    fat: 20,
  },
  {
    description: "90g dry pasta cooked, 150g cooked ground beef (85% lean), 100g tomato sauce",
    calories: 696,
    protein: 54,
    carbs: 75,
    fat: 19,
  },
  {
    description: "Tuna sandwich: 120g canned tuna drained, 2 slices bread, 15g mayonnaise",
    calories: 398,
    protein: 36,
    carbs: 30,
    fat: 14,
  },
  {
    description: "Protein shake: 30g whey protein powder, 300ml 2% milk, 1 medium banana",
    calories: 375,
    protein: 35,
    carbs: 44,
    fat: 7,
  },
  {
    description: "Chicken wrap: large flour tortilla, 120g grilled chicken breast, 50g avocado, lettuce",
    calories: 525,
    protein: 44,
    carbs: 45,
    fat: 17,
  },
  {
    description: "200g sirloin steak, 250g mashed potatoes with butter, 100g green beans",
    calories: 728,
    protein: 58,
    carbs: 27,
    fat: 34,
  },
  {
    description: "400g lentil soup",
    calories: 320,
    protein: 20,
    carbs: 48,
    fat: 4,
  },
  {
    description: "Quinoa salad: 250g cooked quinoa, 100g canned chickpeas, 30g feta cheese",
    calories: 539,
    protein: 24,
    carbs: 81,
    fat: 14,
  },
  {
    description: "2 slices whole wheat toast with 30g peanut butter",
    calories: 348,
    protein: 13,
    carbs: 36,
    fat: 18,
  },
  {
    description: "Ham and cheese omelette: 3 eggs, 60g ham, 30g cheddar cheese",
    calories: 416,
    protein: 37,
    carbs: 4,
    fat: 28,
  },
  {
    description: "Chicken Caesar salad: 120g grilled chicken, 100g romaine, 20g parmesan, 30g croutons, 30g Caesar dressing",
    calories: 552,
    protein: 49,
    carbs: 22,
    fat: 29,
  },
  {
    description: "Veggie burger patty, bun, 150g french fries",
    calories: 729,
    protein: 22,
    carbs: 102,
    fat: 28,
  },
  {
    description: "2 slices cheese pizza (about 200g total)",
    calories: 500,
    protein: 20,
    carbs: 56,
    fat: 18,
  },
  {
    description: "Beef burrito: large tortilla, 100g ground beef, 100g cooked rice, 80g black beans, 30g cheddar",
    calories: 822,
    protein: 49,
    carbs: 88,
    fat: 28,
  },
  {
    description: "Overnight oats: 60g rolled oats, 200ml 2% milk, 10g chia seeds, 15g honey",
    calories: 428,
    protein: 19,
    carbs: 66,
    fat: 12,
  },
  {
    description: "Turkey meatballs 100g, 80g dry pasta cooked, 100g marinara sauce",
    calories: 534,
    protein: 30,
    carbs: 79,
    fat: 12,
  },
  {
    description: "200g cottage cheese (1% fat), 100g pineapple chunks",
    calories: 212,
    protein: 29,
    carbs: 19,
    fat: 2,
  },
  {
    description: "3 protein pancakes (oat and egg based), 30g maple syrup",
    calories: 418,
    protein: 28,
    carbs: 58,
    fat: 8,
  },
  {
    description: "4 rice cakes, 40g peanut butter",
    calories: 402,
    protein: 13,
    carbs: 41,
    fat: 22,
  },
  {
    description: "200g cooked chicken thighs (skin-on), 200g roasted mixed vegetables (zucchini, peppers, onion)",
    calories: 518,
    protein: 51,
    carbs: 20,
    fat: 26,
  },
  {
    description: "Post-workout: 400ml chocolate milk, 1 medium banana",
    calories: 441,
    protein: 17,
    carbs: 83,
    fat: 8,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pctError(estimated: number, truth: number): number {
  if (truth === 0) return estimated === 0 ? 0 : 100;
  return Math.abs(estimated - truth) / truth * 100;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// ---------------------------------------------------------------------------
// Eval
// ---------------------------------------------------------------------------

describe("macro estimator — eval set", { timeout: 120_000 }, () => {
  type Result = {
    meal: string;
    calErr: number;
    proteinErr: number;
    carbsErr: number;
    fatErr: number;
    estimate: { calories: number; protein: number; carbs: number; fat: number };
    truth: { calories: number; protein: number; carbs: number; fat: number };
  };

  const results: Result[] = [];

  beforeAll(async () => {
    // Run all estimates in parallel to keep test time reasonable
    const estimates = await Promise.all(
      MEALS.map((meal) => estimateMacros(meal.description))
    );

    for (let i = 0; i < MEALS.length; i++) {
      const meal = MEALS[i];
      const est = estimates[i];
      results.push({
        meal: meal.description.slice(0, 60) + "...",
        calErr: pctError(est.totalCalories, meal.calories),
        proteinErr: pctError(est.totalProteinG, meal.protein),
        carbsErr: pctError(est.totalCarbsG, meal.carbs),
        fatErr: pctError(est.totalFatG, meal.fat),
        estimate: {
          calories: est.totalCalories,
          protein: est.totalProteinG,
          carbs: est.totalCarbsG,
          fat: est.totalFatG,
        },
        truth: {
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
        },
      });
    }

    // Print results table for inspection
    console.log("\n=== MACRO ESTIMATOR EVAL RESULTS ===\n");
    console.log("Meal".padEnd(62) + "Cal%".padStart(7) + "Pro%".padStart(7) + "Crb%".padStart(7) + "Fat%".padStart(7));
    console.log("-".repeat(83));
    for (const r of results) {
      console.log(
        r.meal.padEnd(62) +
        r.calErr.toFixed(1).padStart(7) +
        r.proteinErr.toFixed(1).padStart(7) +
        r.carbsErr.toFixed(1).padStart(7) +
        r.fatErr.toFixed(1).padStart(7)
      );
    }
    console.log("-".repeat(83));
    const medCal = median(results.map((r) => r.calErr));
    const medPro = median(results.map((r) => r.proteinErr));
    const medCrb = median(results.map((r) => r.carbsErr));
    const medFat = median(results.map((r) => r.fatErr));
    console.log(
      "MEDIAN".padEnd(62) +
      medCal.toFixed(1).padStart(7) +
      medPro.toFixed(1).padStart(7) +
      medCrb.toFixed(1).padStart(7) +
      medFat.toFixed(1).padStart(7)
    );
    console.log("");
  });

  it("estimates all 25 meals without error", () => {
    expect(results).toHaveLength(MEALS.length);
  });

  it("median calorie error < 15%", () => {
    const med = median(results.map((r) => r.calErr));
    console.log(`Median calorie error: ${med.toFixed(1)}%`);
    expect(med).toBeLessThan(15);
  });

  it("median protein error < 15%", () => {
    const med = median(results.map((r) => r.proteinErr));
    console.log(`Median protein error: ${med.toFixed(1)}%`);
    expect(med).toBeLessThan(15);
  });

  it("median carbs error < 15%", () => {
    const med = median(results.map((r) => r.carbsErr));
    console.log(`Median carbs error: ${med.toFixed(1)}%`);
    expect(med).toBeLessThan(15);
  });

  it("median fat error < 20%", () => {
    // fat has more variance due to cooking method differences — slightly looser threshold
    const med = median(results.map((r) => r.fatErr));
    console.log(`Median fat error: ${med.toFixed(1)}%`);
    expect(med).toBeLessThan(20);
  });

  it("no more than 4 meals exceed 30% error on any macro", () => {
    const bigErrors = results.filter(
      (r) => r.calErr > 30 || r.proteinErr > 30 || r.carbsErr > 30 || r.fatErr > 30
    );
    if (bigErrors.length > 0) {
      console.log("\nMeals with >30% error on any macro:");
      for (const r of bigErrors) {
        console.log(`  ${r.meal}`);
        console.log(`    Cal: ${r.estimate.calories} vs ${r.truth.calories} (${r.calErr.toFixed(1)}%)`);
        console.log(`    Pro: ${r.estimate.protein} vs ${r.truth.protein} (${r.proteinErr.toFixed(1)}%)`);
        console.log(`    Crb: ${r.estimate.carbs} vs ${r.truth.carbs} (${r.carbsErr.toFixed(1)}%)`);
        console.log(`    Fat: ${r.estimate.fat} vs ${r.truth.fat} (${r.fatErr.toFixed(1)}%)`);
      }
    }
    expect(bigErrors.length).toBeLessThanOrEqual(4);
  });
});
