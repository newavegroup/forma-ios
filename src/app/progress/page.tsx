import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { checkIns, foodLogs, dailyTargets } from "@/db/schema";
import { eq, desc, gte } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";

export default async function ProgressPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const [allCheckIns, allLogs, latestTargets] = await Promise.all([
    db.select().from(checkIns).where(eq(checkIns.userId, session.userId)).orderBy(desc(checkIns.date)).limit(30),
    db.select().from(foodLogs).where(eq(foodLogs.userId, session.userId)).orderBy(desc(foodLogs.loggedAt)).limit(200),
    db.select().from(dailyTargets).where(eq(dailyTargets.userId, session.userId)).orderBy(desc(dailyTargets.effectiveDate)).limit(1),
  ]);

  const targets = latestTargets[0] ?? null;

  // Group food logs by day
  type DayLog = { calories: number; protein: number; carbs: number; fat: number; count: number };
  const byDay = new Map<string, DayLog>();
  for (const log of allLogs) {
    const day = new Date(log.loggedAt).toISOString().split("T")[0];
    const existing = byDay.get(day) ?? { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
    byDay.set(day, {
      calories: existing.calories + log.totalCalories,
      protein: existing.protein + log.totalProteinG,
      carbs: existing.carbs + log.totalCarbsG,
      fat: existing.fat + log.totalFatG,
      count: existing.count + 1,
    });
  }

  const loggedDays = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  const targetCalories = targets?.caloriesTraining ?? 2000;
  const targetProtein = targets?.proteinG ?? 160;

  // Weight trend
  const weightData = allCheckIns.filter((c) => c.weightKg).slice(0, 10).reverse();
  const latestWeight = allCheckIns.find((c) => c.weightKg);
  const oldestWeight = weightData[0];
  const weightDelta = latestWeight && oldestWeight && latestWeight.id !== oldestWeight.id
    ? parseFloat(latestWeight.weightKg!) - parseFloat(oldestWeight.weightKg!)
    : null;

  // Macro adherence (last 7 logged days)
  const last7Days = loggedDays.slice(0, 7);
  const avgCalories = last7Days.length
    ? Math.round(last7Days.reduce((s, [, d]) => s + d.calories, 0) / last7Days.length)
    : null;
  const avgProtein = last7Days.length
    ? Math.round(last7Days.reduce((s, [, d]) => s + d.protein, 0) / last7Days.length)
    : null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Progress
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--secondary)" }}>Last 30 days</p>
        </div>

        {/* Weight trend */}
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "var(--surface)" }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Body Weight
          </h2>
          {weightData.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--secondary)" }}>No check-ins with weight logged yet.</p>
          ) : (
            <>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                    {latestWeight?.weightKg} <span className="text-sm font-normal" style={{ color: "var(--secondary)" }}>kg</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>Latest</p>
                </div>
                {weightDelta !== null && (
                  <div>
                    <p className="text-lg font-semibold" style={{ color: weightDelta <= 0 ? "var(--accent)" : "var(--danger)" }}>
                      {weightDelta > 0 ? "+" : ""}{weightDelta.toFixed(1)} kg
                    </p>
                    <p className="text-xs" style={{ color: "var(--secondary)" }}>vs {weightData.length} check-ins ago</p>
                  </div>
                )}
              </div>

              {/* Mini sparkline */}
              <div className="flex items-end gap-1 h-16">
                {weightData.map((ci, i) => {
                  const weights = weightData.map((c) => parseFloat(c.weightKg!));
                  const min = Math.min(...weights);
                  const max = Math.max(...weights);
                  const range = max - min || 1;
                  const pct = ((parseFloat(ci.weightKg!) - min) / range) * 100;
                  const isLatest = i === weightData.length - 1;
                  return (
                    <div key={ci.id} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${Math.max(8, pct)}%`,
                          backgroundColor: isLatest ? "var(--primary)" : "var(--surface-high)",
                          minHeight: 8,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs" style={{ color: "var(--secondary)" }}>
                <span>{new Date(weightData[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <span>Today</span>
              </div>
            </>
          )}
        </div>

        {/* Macro adherence summary */}
        {avgCalories !== null && (
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "var(--surface)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              7-Day Average
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Calories", avg: avgCalories, target: targetCalories, unit: "kcal", color: "var(--primary)" },
                { label: "Protein", avg: avgProtein!, target: targetProtein, unit: "g", color: "var(--primary)" },
              ].map(({ label, avg, target, unit, color }) => {
                const pct = Math.min(100, Math.round((avg / target) * 100));
                return (
                  <div key={label} className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "var(--surface-high)" }}>
                    <div className="flex justify-between">
                      <p className="text-xs font-medium" style={{ color: "var(--secondary)" }}>{label}</p>
                      <p className="text-xs font-semibold" style={{ color: pct >= 90 ? "var(--accent)" : "var(--secondary)" }}>
                        {pct}% of target
                      </p>
                    </div>
                    <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                      {avg}<span className="text-xs font-normal ml-0.5" style={{ color: "var(--secondary)" }}>{unit}</span>
                    </p>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--surface-highest)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-xs" style={{ color: "var(--secondary)" }}>Target: {target}{unit}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily log history */}
        <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: "var(--surface)" }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Daily Nutrition Log
          </h2>
          {loggedDays.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--secondary)" }}>No meals logged yet.</p>
          ) : (
            <div className="space-y-2">
              {loggedDays.map(([day, data]) => {
                const calPct = Math.min(100, Math.round((data.calories / targetCalories) * 100));
                const proteinPct = Math.min(100, Math.round((data.protein / targetProtein) * 100));
                const isToday = day === new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={day}
                    className="rounded-lg px-4 py-3 space-y-2"
                    style={{
                      backgroundColor: "var(--surface-high)",
                      border: isToday ? "1px solid var(--primary)" : "1px solid transparent",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold" style={{ color: isToday ? "var(--primary)" : "var(--foreground)" }}>
                        {isToday ? "Today" : new Date(day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--secondary)" }}>
                        <span>{data.calories} kcal</span>
                        <span style={{ color: "var(--primary)" }}>P {data.protein}g</span>
                        <span style={{ color: "var(--accent)" }}>C {data.carbs}g</span>
                        <span style={{ color: "#e3b341" }}>F {data.fat}g</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-1">
                      <div className="flex-1 rounded-full" style={{ backgroundColor: "var(--surface-highest)" }}>
                        <div className="h-full rounded-full" style={{ width: `${calPct}%`, backgroundColor: "var(--primary)" }} />
                      </div>
                      <div className="flex-1 rounded-full" style={{ backgroundColor: "var(--surface-highest)" }}>
                        <div className="h-full rounded-full" style={{ width: `${proteinPct}%`, backgroundColor: "var(--accent)" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Check-in history */}
        {allCheckIns.length > 0 && (
          <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: "var(--surface)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              Recovery &amp; Energy
            </h2>
            <div className="space-y-2">
              {allCheckIns.slice(0, 7).map((ci) => (
                <div key={ci.id} className="flex items-center justify-between text-xs py-2 border-b last:border-0" style={{ borderColor: "var(--outline-variant)" }}>
                  <span style={{ color: "var(--secondary)" }}>
                    {new Date(ci.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <div className="flex gap-4">
                    {ci.weightKg && <span style={{ color: "var(--foreground)" }}>{ci.weightKg} kg</span>}
                    {ci.energyLevel && <span style={{ color: "var(--accent)" }}>Energy {ci.energyLevel}/10</span>}
                    {ci.recoveryScore && <span style={{ color: "var(--primary)" }}>Recovery {ci.recoveryScore}/10</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
