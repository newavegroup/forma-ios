import { getSession } from "@/app/lib/session";
import { getFoodLogs } from "@/app/actions/food-log";
import { getCheckIns } from "@/app/actions/check-ins";
import { getNutritionPlans } from "@/app/actions/plans";
import { getDailyTargets } from "@/app/actions/targets";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

function MacroBar({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, target > 0 ? Math.round((current / target) * 100) : 0);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-medium" style={{ color: "var(--secondary)", fontFamily: "var(--font-body)" }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: "var(--secondary)" }}>
          {current}g / {target}g
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--surface-highest)" }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 space-y-1"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--secondary)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
        {value}
        {unit && (
          <span className="text-sm font-normal ml-1" style={{ color: "var(--secondary)" }}>
            {unit}
          </span>
        )}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: "var(--secondary)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [allLogs, allCheckIns, allPlans, calibratedTargets] = await Promise.all([
    getFoodLogs(session.userId),
    getCheckIns(session.userId),
    getNutritionPlans(session.userId),
    getDailyTargets(session.userId),
  ]);

  // Today's logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLogs = allLogs.filter((l) => {
    const d = new Date(l.loggedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const todayCalories = todayLogs.reduce((s, l) => s + l.totalCalories, 0);
  const todayProtein = todayLogs.reduce((s, l) => s + l.totalProteinG, 0);
  const todayCarbs = todayLogs.reduce((s, l) => s + l.totalCarbsG, 0);
  const todayFat = todayLogs.reduce((s, l) => s + l.totalFatG, 0);

  // Active plan targets — prefer calibrated InBody targets over scaffold plan
  const activePlan = allPlans[0];
  const targetCals = calibratedTargets?.caloriesTraining ?? activePlan?.calories ?? 2500;
  const targetProtein = calibratedTargets?.proteinG ?? activePlan?.proteinG ?? 180;
  const targetCarbs = calibratedTargets?.carbsGTraining ?? activePlan?.carbsG ?? 280;
  const targetFat = calibratedTargets?.fatG ?? activePlan?.fatG ?? 70;

  // Latest check-in
  const latestCheckIn = allCheckIns[0];

  // Recent logs (last 5)
  const recentLogs = allLogs.slice(0, 5);

  const caloriesPct = Math.min(100, Math.round((todayCalories / targetCals) * 100));

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Good {getGreeting()}, {session.name.split(" ")[0]}
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--secondary)" }}>
              {formatDate(new Date())}
            </p>
          </div>
          <Link
            href="/food-log"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--background)",
              fontFamily: "var(--font-body)",
            }}
          >
            + Log Food
          </Link>
        </div>

        {/* Calories ring + macros */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calorie progress */}
          <div
            className="lg:col-span-1 rounded-xl p-6 flex flex-col items-center justify-center gap-4"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  strokeWidth="10"
                  stroke="var(--surface-highest)"
                />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  strokeWidth="10"
                  stroke="var(--primary)"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - caloriesPct / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                  {todayCalories}
                </span>
                <span className="text-xs" style={{ color: "var(--secondary)" }}>
                  / {targetCals} kcal
                </span>
              </div>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--secondary)" }}>
              Today&apos;s Calories
            </p>
          </div>

          {/* Macros */}
          <div
            className="lg:col-span-2 rounded-xl p-6 flex flex-col justify-center space-y-5"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Macronutrients
            </p>
            <MacroBar label="Protein" current={todayProtein} target={targetProtein} color="var(--primary)" />
            <MacroBar label="Carbohydrates" current={todayCarbs} target={targetCarbs} color="var(--accent)" />
            <MacroBar label="Fat" current={todayFat} target={targetFat} color="#e3b341" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Body Weight"
            value={latestCheckIn?.weightKg ?? "—"}
            unit={latestCheckIn?.weightKg ? "kg" : undefined}
            sub={latestCheckIn ? formatRelative(new Date(latestCheckIn.date)) : "No check-in yet"}
          />
          <StatCard
            label="Energy Level"
            value={latestCheckIn?.energyLevel ?? "—"}
            unit={latestCheckIn?.energyLevel ? "/ 10" : undefined}
            sub="Latest check-in"
          />
          <StatCard
            label="Recovery"
            value={latestCheckIn?.recoveryScore ?? "—"}
            unit={latestCheckIn?.recoveryScore ? "/ 10" : undefined}
            sub="Latest check-in"
          />
          <StatCard
            label="Targets"
            value={calibratedTargets ? `${calibratedTargets.proteinG}g` : activePlan ? "On" : "—"}
            unit={calibratedTargets ? "protein" : undefined}
            sub={calibratedTargets ? `${calibratedTargets.caloriesTraining} kcal training` : activePlan?.title ?? "Upload InBody scan"}
          />
        </div>

        {/* Recent food logs + active plan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent logs */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
              >
                Recent Food Logs
              </h2>
              <Link
                href="/food-log"
                className="text-xs font-medium"
                style={{ color: "var(--primary)" }}
              >
                View all
              </Link>
            </div>
            {recentLogs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--secondary)" }}>
                  No food logs yet.
                </p>
                <Link
                  href="/food-log"
                  className="mt-2 inline-block text-sm font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Log your first meal
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: "var(--outline-variant)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {log.mealName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>
                        {formatRelative(new Date(log.loggedAt))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {log.totalCalories} kcal
                      </p>
                      <p className="text-xs" style={{ color: "var(--secondary)" }}>
                        P {log.totalProteinG}g · C {log.totalCarbsG}g · F {log.totalFatG}g
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Active plan summary */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
              >
                Active Nutrition Plan
              </h2>
              <Link
                href="/plans"
                className="text-xs font-medium"
                style={{ color: "var(--primary)" }}
              >
                {activePlan ? "View all" : "Create plan"}
              </Link>
            </div>
            {!activePlan ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--secondary)" }}>
                  No nutrition plan active.
                </p>
                <Link
                  href="/plans/new"
                  className="mt-2 inline-block text-sm font-medium"
                  style={{ color: "var(--accent)" }}
                >
                  Generate AI plan
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-base" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                    {activePlan.title}
                  </p>
                  {activePlan.aiGenerated && (
                    <span
                      className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: "var(--primary-container)", color: "var(--primary)" }}
                    >
                      AI Generated
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Calories", value: `${activePlan.calories} kcal` },
                    { label: "Protein", value: `${activePlan.proteinG}g` },
                    { label: "Carbs", value: `${activePlan.carbsG}g` },
                    { label: "Fat", value: `${activePlan.fatG}g` },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: "var(--surface-high)" }}
                    >
                      <p className="text-xs" style={{ color: "var(--secondary)" }}>{label}</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--foreground)" }}>{value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: "var(--secondary)" }}>
                  {(activePlan.meals as { name: string }[]).length} meals planned
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRelative(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD === 1) return "Yesterday";
  return `${diffD} days ago`;
}
