import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  date,
  unique,
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

// ---------------------------------------------------------------------------
// InBody / Nutrition OS tables
// ---------------------------------------------------------------------------

export const inbodyScans = pgTable("inbody_scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  scanDate: date("scan_date").notNull(),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
  muscleMassKg: numeric("muscle_mass_kg", { precision: 5, scale: 2 }).notNull(),
  bodyFatPercent: numeric("body_fat_percent", { precision: 5, scale: 2 }).notNull(),
  bodyFatMassKg: numeric("body_fat_mass_kg", { precision: 5, scale: 2 }).notNull(),
  visceralFat: integer("visceral_fat").notNull(),
  pdfPath: text("pdf_path"),
  parsedConfidence: text("parsed_confidence").notNull(), // 'high' | 'low'
  flaggedFields: text("flagged_fields").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyTargets = pgTable(
  "daily_targets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    effectiveDate: date("effective_date").notNull(),
    proteinG: integer("protein_g").notNull(),
    carbsGTraining: integer("carbs_g_training").notNull(),
    carbsGRest: integer("carbs_g_rest").notNull(),
    fatG: integer("fat_g").notNull(),
    caloriesTraining: integer("calories_training").notNull(),
    caloriesRest: integer("calories_rest").notNull(),
    rationale: text("rationale"),
    sourceScanId: uuid("source_scan_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.effectiveDate)]
);

export const trainingSchedule = pgTable(
  "training_schedule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    isTrainingDay: boolean("is_training_day").default(false).notNull(),
    trainingType: text("training_type"),
    durationMin: integer("duration_min"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.date)]
);

export const weeklyPlans = pgTable(
  "weekly_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    weekStart: date("week_start").notNull(),
    planJson: jsonb("plan_json").notNull(),
    groceryListJson: jsonb("grocery_list_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.weekStart)]
);

export const mealLogs = pgTable("meal_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
  isTrainingDay: boolean("is_training_day").notNull(),
  rawInput: text("raw_input").notNull(),
  estimatedProteinG: numeric("estimated_protein_g", { precision: 6, scale: 1 }),
  estimatedCarbsG: numeric("estimated_carbs_g", { precision: 6, scale: 1 }),
  estimatedFatG: numeric("estimated_fat_g", { precision: 6, scale: 1 }),
  estimatedCalories: integer("estimated_calories"),
  confirmed: boolean("confirmed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coachConversations = pgTable(
  "coach_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    sessionDate: date("session_date").notNull(),
    messagesJson: jsonb("messages_json").notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.sessionDate)]
);

// ---------------------------------------------------------------------------
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
