"use server";

import { db } from "@/db";
import { foodLogs, type FoodItem } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const foodItemSchema = z.object({
  name: z.string(),
  grams: z.number(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

const foodLogSchema = z.object({
  loggedAt: z.string().datetime().optional(),
  mealName: z.string().min(1),
  foods: z.array(foodItemSchema).min(1),
  totalCalories: z.number().int(),
  totalProteinG: z.number().int(),
  totalCarbsG: z.number().int(),
  totalFatG: z.number().int(),
  notes: z.string().optional(),
});

export type FoodLogData = z.infer<typeof foodLogSchema>;

export async function getFoodLogs(userId: string) {
  return db
    .select()
    .from(foodLogs)
    .where(eq(foodLogs.userId, userId))
    .orderBy(desc(foodLogs.loggedAt));
}

export async function createFoodLog(
  userId: string,
  data: FoodLogData
): Promise<{ error?: string; id?: string }> {
  const parsed = foodLogSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const [log] = await db
      .insert(foodLogs)
      .values({
        userId,
        loggedAt: parsed.data.loggedAt
          ? new Date(parsed.data.loggedAt)
          : new Date(),
        mealName: parsed.data.mealName,
        foods: parsed.data.foods as FoodItem[],
        totalCalories: parsed.data.totalCalories,
        totalProteinG: parsed.data.totalProteinG,
        totalCarbsG: parsed.data.totalCarbsG,
        totalFatG: parsed.data.totalFatG,
        notes: parsed.data.notes,
      })
      .returning({ id: foodLogs.id });

    return { id: log.id };
  } catch {
    return { error: "Failed to save food log." };
  }
}

export async function deleteFoodLog(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await db.delete(foodLogs).where(eq(foodLogs.id, id));
    return { success: true };
  } catch {
    return { error: "Failed to delete food log." };
  }
}
