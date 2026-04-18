"use server";

import { db } from "@/db";
import { nutritionPlans, type MealObject } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const mealFoodSchema = z.object({
  name: z.string(),
  amount: z.string(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
});

const mealSchema = z.object({
  name: z.string(),
  time: z.string().optional(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  foods: z.array(mealFoodSchema),
  notes: z.string().optional(),
});

const planSchema = z.object({
  title: z.string().min(1),
  calories: z.number().int(),
  proteinG: z.number().int(),
  carbsG: z.number().int(),
  fatG: z.number().int(),
  meals: z.array(mealSchema),
  aiGenerated: z.boolean().optional(),
});

export type PlanData = z.infer<typeof planSchema>;

export async function getNutritionPlans(userId: string) {
  return db
    .select()
    .from(nutritionPlans)
    .where(eq(nutritionPlans.userId, userId))
    .orderBy(desc(nutritionPlans.createdAt));
}

export async function createPlan(
  userId: string,
  data: PlanData
): Promise<{ error?: string; id?: string }> {
  const parsed = planSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    const [plan] = await db
      .insert(nutritionPlans)
      .values({
        userId,
        title: parsed.data.title,
        calories: parsed.data.calories,
        proteinG: parsed.data.proteinG,
        carbsG: parsed.data.carbsG,
        fatG: parsed.data.fatG,
        meals: parsed.data.meals as MealObject[],
        aiGenerated: parsed.data.aiGenerated ?? false,
      })
      .returning({ id: nutritionPlans.id });

    return { id: plan.id };
  } catch {
    return { error: "Failed to save nutrition plan." };
  }
}

export async function deletePlan(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await db.delete(nutritionPlans).where(eq(nutritionPlans.id, id));
    return { success: true };
  } catch {
    return { error: "Failed to delete nutrition plan." };
  }
}
