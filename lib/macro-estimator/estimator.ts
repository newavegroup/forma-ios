import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const anthropic = createAnthropic();

const FoodItemSchema = z.object({
  name: z.string().describe("Food item name"),
  grams: z.number().describe("Weight in grams"),
  calories: z.number().describe("Calories (kcal)"),
  protein: z.number().describe("Protein in grams"),
  carbs: z.number().describe("Carbohydrates in grams"),
  fat: z.number().describe("Fat in grams"),
});

export const MacroEstimateSchema = z.object({
  foods: z.array(FoodItemSchema).describe("Individual food items identified in the description"),
  totalCalories: z.number().int().describe("Sum of all calories"),
  totalProteinG: z.number().int().describe("Sum of all protein in grams"),
  totalCarbsG: z.number().int().describe("Sum of all carbs in grams"),
  totalFatG: z.number().int().describe("Sum of all fat in grams"),
  mealName: z.string().describe("Short descriptive name for this meal"),
  confidence: z.enum(["high", "medium", "low"]).describe("Confidence in the estimate"),
  notes: z.string().optional().describe("Any caveats or assumptions made"),
});

export type MacroEstimate = z.infer<typeof MacroEstimateSchema>;

const SYSTEM_PROMPT = `You are a sports nutrition expert estimating macros from meal descriptions.

Rules:
- Use standard portion sizes when quantities aren't specified (e.g., "chicken breast" = 150g cooked)
- All weights are for the food AS EATEN (cooked weight unless raw is specified)
- Use these reference values (per 100g cooked/as-eaten unless noted):
  - Chicken breast: 165 kcal, 31P, 0C, 3.6F
  - White rice (cooked): 130 kcal, 2.7P, 28C, 0.3F
  - Brown rice (cooked): 123 kcal, 2.7P, 25C, 1F
  - Pasta (cooked): 157 kcal, 5.8P, 31C, 0.9F
  - Salmon: 208 kcal, 20P, 0C, 13F
  - Eggs (1 large = 50g): 143 kcal, 13P, 1C, 10F
  - Greek yogurt (2%): 73 kcal, 10P, 4C, 2F
  - Oats (dry): 389 kcal, 17P, 66C, 7F
  - Whey protein (1 scoop = 30g): 120 kcal, 24P, 3C, 2F
  - Banana (medium = 120g): 89 kcal, 1.1P, 23C, 0.3F
  - Sweet potato (cooked): 86 kcal, 2P, 20C, 0.1F
  - Broccoli: 34 kcal, 2.8P, 7C, 0.4F
  - Ground beef 85% lean (cooked): 215 kcal, 26P, 0C, 12F
  - Cheddar cheese: 403 kcal, 25P, 1C, 33F
  - Whole milk (100ml): 61 kcal, 3.2P, 4.8C, 3.3F
  - 2% milk (100ml): 50 kcal, 3.4P, 4.9C, 2F
  - Peanut butter: 588 kcal, 25P, 20C, 50F
  - Avocado: 160 kcal, 2P, 9C, 15F
  - Flour tortilla (large = 80g): 242 kcal, 6P, 40C, 6F
  - Bread (1 slice = 30g): 80 kcal, 3P, 15C, 1F
- Be realistic — don't underestimate cooking oils, sauces, or condiments
- Round totals to nearest integer
- For confidence: high = all items and portions clear, medium = some estimation needed, low = very vague`;

export async function estimateMacros(description: string): Promise<MacroEstimate> {
  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5"),
    schema: MacroEstimateSchema,
    system: SYSTEM_PROMPT,
    prompt: `Estimate the macros for this meal:\n\n${description}`,
  });

  return object;
}
