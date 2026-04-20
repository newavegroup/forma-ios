import { db } from "@/db";
import { inbodyScans, dailyTargets, foodLogs, checkIns } from "@/db/schema";
import { eq, desc, gte } from "drizzle-orm";

export interface CoachContext {
  today: string;
  bodyComposition: {
    scanDate: string;
    weightKg: number;
    muscleMassKg: number;
    bodyFatPercent: number;
    bodyFatMassKg: number;
    visceralFat: number;
  } | null;
  targets: {
    proteinG: number;
    carbsGTraining: number;
    carbsGRest: number;
    fatGTraining: number;
    fatGRest: number;
    caloriesTraining: number;
    caloriesRest: number;
  } | null;
  todayLogs: {
    mealName: string;
    totalCalories: number;
    totalProteinG: number;
    totalCarbsG: number;
    totalFatG: number;
    loggedAt: string;
  }[];
  todayTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  recentCheckIns: {
    date: string;
    weightKg: number | null;
    energyLevel: number | null;
    recoveryScore: number | null;
  }[];
}

export async function buildCoachContext(userId: string): Promise<CoachContext> {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const [scan, targets, logs, recentCheckIns] = await Promise.all([
    db
      .select()
      .from(inbodyScans)
      .where(eq(inbodyScans.userId, userId))
      .orderBy(desc(inbodyScans.scanDate))
      .limit(1),
    db
      .select()
      .from(dailyTargets)
      .where(eq(dailyTargets.userId, userId))
      .orderBy(desc(dailyTargets.effectiveDate))
      .limit(1),
    db
      .select()
      .from(foodLogs)
      .where(eq(foodLogs.userId, userId))
      .orderBy(desc(foodLogs.loggedAt))
      .limit(20),
    db
      .select()
      .from(checkIns)
      .where(eq(checkIns.userId, userId))
      .orderBy(desc(checkIns.date))
      .limit(7),
  ]);

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter((l) => {
    const d = new Date(l.loggedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === todayStart.getTime();
  });

  const todayTotals = {
    calories: todayLogs.reduce((s, l) => s + l.totalCalories, 0),
    protein: todayLogs.reduce((s, l) => s + l.totalProteinG, 0),
    carbs: todayLogs.reduce((s, l) => s + l.totalCarbsG, 0),
    fat: todayLogs.reduce((s, l) => s + l.totalFatG, 0),
  };

  const latestScan = scan[0] ?? null;
  const latestTargets = targets[0] ?? null;

  return {
    today,
    bodyComposition: latestScan
      ? {
          scanDate: latestScan.scanDate,
          weightKg: parseFloat(latestScan.weightKg),
          muscleMassKg: parseFloat(latestScan.muscleMassKg),
          bodyFatPercent: parseFloat(latestScan.bodyFatPercent),
          bodyFatMassKg: parseFloat(latestScan.bodyFatMassKg),
          visceralFat: latestScan.visceralFat,
        }
      : null,
    targets: latestTargets
      ? {
          proteinG: latestTargets.proteinG,
          carbsGTraining: latestTargets.carbsGTraining,
          carbsGRest: latestTargets.carbsGRest,
          fatGTraining: latestTargets.fatGTraining ?? latestTargets.fatG,
          fatGRest: latestTargets.fatG,
          caloriesTraining: latestTargets.caloriesTraining,
          caloriesRest: latestTargets.caloriesRest,
        }
      : null,
    todayLogs: todayLogs.map((l) => ({
      mealName: l.mealName,
      totalCalories: l.totalCalories,
      totalProteinG: l.totalProteinG,
      totalCarbsG: l.totalCarbsG,
      totalFatG: l.totalFatG,
      loggedAt: l.loggedAt.toISOString(),
    })),
    todayTotals,
    recentCheckIns: recentCheckIns.map((c) => ({
      date: new Date(c.date).toISOString().split("T")[0],
      weightKg: c.weightKg ? parseFloat(c.weightKg) : null,
      energyLevel: c.energyLevel,
      recoveryScore: c.recoveryScore,
    })),
  };
}

export function renderContextPrompt(ctx: CoachContext): string {
  const lines: string[] = [
    `Today is ${ctx.today}.`,
    "",
  ];

  if (ctx.bodyComposition) {
    const bc = ctx.bodyComposition;
    lines.push(
      `## Body Composition (InBody scan from ${bc.scanDate})`,
      `- Weight: ${bc.weightKg} kg`,
      `- Skeletal Muscle Mass: ${bc.muscleMassKg} kg`,
      `- Body Fat: ${bc.bodyFatPercent}% (${bc.bodyFatMassKg} kg)`,
      `- Visceral Fat Level: ${bc.visceralFat}/20`,
      ""
    );
  } else {
    lines.push("No InBody scan on file.", "");
  }

  if (ctx.targets) {
    const t = ctx.targets;
    lines.push(
      `## Daily Macro Targets (IleNut 3:1 carb cycling)`,
      `- Protein: ${t.proteinG}g (same every day)`,
      `- Training days: ${t.caloriesTraining} kcal | ${t.carbsGTraining}g carbs | ${t.fatGTraining}g fat`,
      `- Rest days: ${t.caloriesRest} kcal | ${t.carbsGRest}g carbs | ${t.fatGRest}g fat`,
      ""
    );
  } else {
    lines.push("No macro targets on file.", "");
  }

  if (ctx.todayLogs.length > 0) {
    lines.push(`## Today's Food Log`);
    for (const log of ctx.todayLogs) {
      lines.push(
        `- ${log.mealName}: ${log.totalCalories} kcal | P ${log.totalProteinG}g | C ${log.totalCarbsG}g | F ${log.totalFatG}g`
      );
    }
    lines.push(
      ``,
      `Totals so far: ${ctx.todayTotals.calories} kcal | P ${ctx.todayTotals.protein}g | C ${ctx.todayTotals.carbs}g | F ${ctx.todayTotals.fat}g`,
      ""
    );
  } else {
    lines.push("No meals logged today.", "");
  }

  if (ctx.recentCheckIns.length > 0) {
    lines.push(`## Recent Check-ins (last 7 days)`);
    for (const ci of ctx.recentCheckIns) {
      const parts = [`${ci.date}`];
      if (ci.weightKg) parts.push(`${ci.weightKg} kg`);
      if (ci.energyLevel) parts.push(`energy ${ci.energyLevel}/10`);
      if (ci.recoveryScore) parts.push(`recovery ${ci.recoveryScore}/10`);
      lines.push(`- ${parts.join(" | ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
