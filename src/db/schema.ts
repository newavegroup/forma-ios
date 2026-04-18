import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  age: integer("age"),
  weightKg: numeric("weight_kg"),
  heightCm: numeric("height_cm"),
  sport: text("sport"),
  trainingDaysPerWeek: integer("training_days_per_week"),
  goal: text("goal"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nutritionPlans = pgTable("nutrition_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  calories: integer("calories").notNull(),
  proteinG: integer("protein_g").notNull(),
  carbsG: integer("carbs_g").notNull(),
  fatG: integer("fat_g").notNull(),
  meals: jsonb("meals").notNull().$type<MealObject[]>(),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const foodLogs = pgTable("food_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  loggedAt: timestamp("logged_at").notNull(),
  mealName: text("meal_name").notNull(),
  foods: jsonb("foods").notNull().$type<FoodItem[]>(),
  totalCalories: integer("total_calories").notNull(),
  totalProteinG: integer("total_protein_g").notNull(),
  totalCarbsG: integer("total_carbs_g").notNull(),
  totalFatG: integer("total_fat_g").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  date: timestamp("date").notNull(),
  weightKg: numeric("weight_kg"),
  energyLevel: integer("energy_level"),
  recoveryScore: integer("recovery_score"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types for JSONB columns
export type FoodItem = {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealObject = {
  name: string;
  time?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  foods: {
    name: string;
    amount: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }[];
  notes?: string;
};
