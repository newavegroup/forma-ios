import { getSession } from "@/app/lib/session";
import { getFoodLogs } from "@/app/actions/food-log";
import { getCheckIns } from "@/app/actions/check-ins";
import { getDailyTargets } from "@/app/actions/targets";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [allLogs, allCheckIns, calibratedTargets] = await Promise.all([
    getFoodLogs(session.userId),
    getCheckIns(session.userId),
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

  const todayTotals = {
    calories: todayLogs.reduce((s, l) => s + l.totalCalories, 0),
    protein:  todayLogs.reduce((s, l) => s + l.totalProteinG, 0),
    carbs:    todayLogs.reduce((s, l) => s + l.totalCarbsG, 0),
    fat:      todayLogs.reduce((s, l) => s + l.totalFatG, 0),
  };

  const macroTargets = {
    protein:   calibratedTargets?.proteinG           ?? 160,
    carbsLow:  calibratedTargets?.carbsGRest         ?? 125,
    carbsHigh: calibratedTargets?.carbsGTraining     ?? 240,
    fatLow:    calibratedTargets?.fatG               ?? 96,
    fatHigh:   calibratedTargets?.fatGTraining ?? calibratedTargets?.fatG ?? 44,
    calories:  calibratedTargets?.caloriesTraining   ?? 2000,
  };

  const latestCheckIn = allCheckIns[0];
  const recentLogs = allLogs.slice(0, 5);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            {getGreeting()}, {session.name.split(" ")[0]}
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--secondary)" }}>
            {formatDate(new Date())}
          </p>
        </div>

        {/* Client: day toggle + rings + remaining + quick-log */}
        <DashboardClient
          targets={macroTargets}
          todayTotals={todayTotals}
          scanEffectiveDate={calibratedTargets?.effectiveDate ?? null}
        />

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
              Today&apos;s meals
            </h2>
            <Link
              href="/food-log"
              className="text-xs font-medium"
              style={{ color: "var(--primary)" }}
            >
              Full history
            </Link>
          </div>
          {todayLogs.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--secondary)" }}>
              Nothing logged yet today.
            </p>
          ) : (
            <ul className="space-y-1">
              {todayLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                  style={{ borderColor: "var(--outline-variant)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {log.mealName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>
                      P {log.totalProteinG}g · C {log.totalCarbsG}g · F {log.totalFatG}g
                    </p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {log.totalCalories} kcal
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-4 space-y-1"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--secondary)" }}>
              Body Weight
            </p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              {latestCheckIn?.weightKg ?? "—"}
              {latestCheckIn?.weightKg && (
                <span className="text-sm font-normal ml-1" style={{ color: "var(--secondary)" }}>kg</span>
              )}
            </p>
            <p className="text-xs" style={{ color: "var(--secondary)" }}>
              {latestCheckIn ? formatRelative(new Date(latestCheckIn.date)) : "No check-in yet"}
            </p>
          </div>

          <div
            className="rounded-xl p-4 space-y-1"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--secondary)" }}>
              Recovery
            </p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              {latestCheckIn?.recoveryScore ?? "—"}
              {latestCheckIn?.recoveryScore && (
                <span className="text-sm font-normal ml-1" style={{ color: "var(--secondary)" }}>/ 10</span>
              )}
            </p>
            <p className="text-xs" style={{ color: "var(--secondary)" }}>Latest check-in</p>
          </div>
        </div>

        {/* InBody prompt if no calibration */}
        {!calibratedTargets && (
          <div
            className="rounded-xl p-5 text-center space-y-2"
            style={{ backgroundColor: "var(--surface)", border: "1px dashed var(--outline-variant)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Calibrate your targets
            </p>
            <p className="text-xs" style={{ color: "var(--secondary)" }}>
              Upload your InBody scan to get personalized macro targets based on your body composition.
            </p>
            <Link
              href="/inbody"
              className="inline-block mt-1 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "var(--primary)", color: "var(--background)" }}
            >
              Upload InBody scan
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
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
