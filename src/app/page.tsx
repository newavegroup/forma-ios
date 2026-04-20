import { getSession } from "@/app/lib/session";
import { getFoodLogs } from "@/app/actions/food-log";
import { getCheckIns } from "@/app/actions/check-ins";
import { getNutritionPlans } from "@/app/actions/plans";
import { getDailyTargets } from "@/app/actions/targets";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DayTypeMacros } from "@/components/day-type-macros";

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
  const todayProtein  = todayLogs.reduce((s, l) => s + l.totalProteinG, 0);
  const todayCarbs    = todayLogs.reduce((s, l) => s + l.totalCarbsG, 0);
  const todayFat      = todayLogs.reduce((s, l) => s + l.totalFatG, 0);

  // Targets — calibration drives both day types; fallback to plan or sensible defaults
  const activePlan = allPlans[0];
  const macroTargets = {
    protein:   calibratedTargets?.proteinG        ?? activePlan?.proteinG ?? 160,
    carbsLow:  calibratedTargets?.carbsGRest      ?? activePlan?.carbsG   ?? 125,
    carbsHigh: calibratedTargets?.carbsGTraining  ?? activePlan?.carbsG   ?? 240,
    fatLow:    calibratedTargets?.fatG            ?? activePlan?.fatG     ?? 96,
    fatHigh:   (calibratedTargets?.fatGTraining ?? calibratedTargets?.fatG ?? activePlan?.fatG ?? 44),
    calories:  calibratedTargets?.caloriesTraining ?? activePlan?.calories ?? 2000,
  };

  // Latest check-in
  const latestCheckIn = allCheckIns[0];

  // Recent logs (last 5)
  const recentLogs = allLogs.slice(0, 5);

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

        {/* Day type toggle + calories ring + macros (client component) */}
        <DayTypeMacros
          targets={macroTargets}
          todayCalories={todayCalories}
          todayProtein={todayProtein}
          todayCarbs={todayCarbs}
          todayFat={todayFat}
        />

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
            sub={
              calibratedTargets
                ? `${calibratedTargets.carbsGRest}g↔${calibratedTargets.carbsGTraining}g carbs`
                : activePlan?.title ?? "Upload InBody scan"
            }
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
            {calibratedTargets ? (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-base" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                    Carb Cycling 3:1
                  </p>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: "var(--primary-container)", color: "var(--primary)" }}
                  >
                    InBody Calibrated
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Protein (both days)", value: `${calibratedTargets.proteinG}g` },
                    { label: "Calories / day", value: `${calibratedTargets.caloriesTraining} kcal` },
                    { label: "Carbs — Low day", value: `${calibratedTargets.carbsGRest}g` },
                    { label: "Carbs — High day", value: `${calibratedTargets.carbsGTraining}g` },
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
                  {calibratedTargets.rationale?.slice(0, 120)}...
                </p>
              </div>
            ) : !activePlan ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--secondary)" }}>
                  No nutrition plan active.
                </p>
                <Link
                  href="/inbody"
                  className="mt-2 inline-block text-sm font-medium"
                  style={{ color: "var(--accent)" }}
                >
                  Upload InBody scan to calibrate
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
