"use server";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { ProfileData } from "@/app/actions/profile";

const client = new Anthropic();

const MealFoodSchema = z.object({
  name: z.string().describe("Food item name"),
  amount: z.string().describe("Serving size e.g. '150g' or '1 cup'"),
  calories: z.number().int(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
});

const MealSchema = z.object({
  name: z.string().describe("Meal name e.g. 'Pre-workout Breakfast'"),
  time: z.string().optional().describe("Suggested time e.g. '07:00'"),
  calories: z.number().int(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  foods: z.array(MealFoodSchema).min(1),
  notes: z.string().optional().describe("Brief coaching note for this meal"),
});

const NutritionPlanSchema = z.object({
  title: z.string().describe("Descriptive plan title"),
  summary: z.string().describe("2-3 sentence explanation of the plan strategy"),
  calories: z.number().int().describe("Total daily calories"),
  proteinG: z.number().int().describe("Total daily protein in grams"),
  carbsG: z.number().int().describe("Total daily carbohydrates in grams"),
  fatG: z.number().int().describe("Total daily fat in grams"),
  meals: z.array(MealSchema).min(3).max(7),
  coachingTips: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("Sport-specific nutrition coaching tips"),
});

export type GeneratedNutritionPlan = z.infer<typeof NutritionPlanSchema>;

export type PlanGeneratorInput = {
  profile: ProfileData;
  goal: string;
  additionalContext?: string;
};

export async function generateNutritionPlan(
  input: PlanGeneratorInput
): Promise<{ plan?: GeneratedNutritionPlan; error?: string }> {
  const { profile, goal, additionalContext } = input;

  const profileContext = [
    profile.age ? `Age: ${profile.age}` : null,
    profile.weightKg ? `Weight: ${profile.weightKg}kg` : null,
    profile.heightCm ? `Height: ${profile.heightCm}cm` : null,
    profile.sport ? `Primary sport: ${profile.sport}` : null,
    profile.trainingDaysPerWeek
      ? `Training frequency: ${profile.trainingDaysPerWeek} days/week`
      : null,
    profile.goal ? `Goal: ${profile.goal}` : null,
    profile.notes ? `Athlete notes: ${profile.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are an elite sports nutritionist specializing in hybrid athletes — people who combine strength training with endurance sports like running, cycling, swimming, or triathlon.

Create a detailed, personalized daily nutrition plan for this athlete:

${profileContext || "General hybrid athlete profile"}

Specific goal for this plan: ${goal}
${additionalContext ? `\nAdditional context: ${additionalContext}` : ""}

Requirements:
- Calculate calories based on body weight, training volume, and goal (performance/recomp/endurance)
- For hybrid athletes, protein should be 1.6-2.2g/kg bodyweight
- Time meals around training windows when possible
- Include pre/post workout nutrition if applicable
- Prioritize whole foods that support both strength AND endurance adaptation
- Consider carb periodization for high-volume training days
- All food amounts should be realistic and measurable
- Make the plan practical for a busy athlete`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [
        {
          name: "generate_nutrition_plan",
          description: "Generate a structured daily nutrition plan for an athlete",
          input_schema: {
            type: "object" as const,
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              calories: { type: "number" },
              proteinG: { type: "number" },
              carbsG: { type: "number" },
              fatG: { type: "number" },
              meals: {
                type: "array",
                minItems: 3,
                maxItems: 7,
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    time: { type: "string" },
                    calories: { type: "number" },
                    proteinG: { type: "number" },
                    carbsG: { type: "number" },
                    fatG: { type: "number" },
                    notes: { type: "string" },
                    foods: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          amount: { type: "string" },
                          calories: { type: "number" },
                          proteinG: { type: "number" },
                          carbsG: { type: "number" },
                          fatG: { type: "number" },
                        },
                        required: ["name", "amount", "calories", "proteinG", "carbsG", "fatG"],
                      },
                    },
                  },
                  required: ["name", "calories", "proteinG", "carbsG", "fatG", "foods"],
                },
              },
              coachingTips: { type: "array", items: { type: "string" } },
            },
            required: ["title", "summary", "calories", "proteinG", "carbsG", "fatG", "meals", "coachingTips"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "generate_nutrition_plan" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return { error: "No plan generated." };
    }

    const parsed = NutritionPlanSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      return { error: `Invalid plan structure: ${parsed.error.issues[0].message}` };
    }

    return { plan: parsed.data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Plan generation error:", msg);
    return { error: `Generation failed: ${msg}` };
  }
}
