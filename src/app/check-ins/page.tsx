"use client";

import { useState, useEffect, useCallback } from "react";
import { getCheckIns, createCheckIn } from "@/app/actions/check-ins";
import { AppShell } from "@/components/app-shell";
import type { CheckInData } from "@/app/actions/check-ins";

type CheckIn = Awaited<ReturnType<typeof getCheckIns>>[number];

function ScoreBar({ value, max = 10, color }: { value: number | null; max?: number; color: string }) {
  const pct = value ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--surface-highest)" }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono w-6 text-right" style={{ color: "var(--secondary)" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function CheckInCard({ checkIn }: { checkIn: CheckIn }) {
  const date = new Date(checkIn.date);
  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--outline-variant)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>
            {date.toLocaleDateString("en-US", { year: "numeric" })}
          </p>
        </div>
        {checkIn.weightKg && (
          <div className="text-right">
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              {checkIn.weightKg}
            </p>
            <p className="text-xs" style={{ color: "var(--secondary)" }}>kg</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Energy Level</p>
          <ScoreBar value={checkIn.energyLevel} color="var(--accent)" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Recovery</p>
          <ScoreBar value={checkIn.recoveryScore} color="var(--primary)" />
        </div>
      </div>

      {checkIn.notes && (
        <p className="text-sm italic border-t pt-3" style={{ color: "var(--secondary)", borderColor: "var(--outline-variant)" }}>
          {checkIn.notes}
        </p>
      )}
    </div>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>{label}</label>
        <span
          className="text-sm font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: "var(--surface-highest)", color: "var(--foreground)" }}
        >
          {value} / 10
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="flex-1 py-2 rounded text-xs font-semibold transition-colors"
            style={{
              backgroundColor: value >= n ? "var(--primary)" : "var(--surface-high)",
              color: value >= n ? "var(--background)" : "var(--secondary)",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState("");
  const [energyLevel, setEnergyLevel] = useState(7);
  const [recoveryScore, setRecoveryScore] = useState(7);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCheckIns = useCallback(async () => {
    const data = await getCheckIns();
    setCheckIns(data);
  }, []);

  useEffect(() => {
    loadCheckIns();
  }, [loadCheckIns]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const data: CheckInData = {
      weightKg: weight ? Number(weight) : undefined,
      energyLevel,
      recoveryScore,
      notes: notes || undefined,
    };

    const result = await createCheckIn("", data);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      setWeight("");
      setEnergyLevel(7);
      setRecoveryScore(7);
      setNotes("");
      loadCheckIns();
    }
    setSaving(false);
  }

  // Trend calculation
  const last7 = checkIns.slice(0, 7).reverse();
  const avgEnergy = last7.filter((c) => c.energyLevel).reduce((s, c) => s + (c.energyLevel ?? 0), 0) / (last7.filter((c) => c.energyLevel).length || 1);
  const avgRecovery = last7.filter((c) => c.recoveryScore).reduce((s, c) => s + (c.recoveryScore ?? 0), 0) / (last7.filter((c) => c.recoveryScore).length || 1);

  return (
    <AppShell>
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            Check-ins
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--secondary)" }}>
            Track your body and readiness
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--background)",
            fontFamily: "var(--font-body)",
          }}
        >
          {showForm ? "Cancel" : "+ Check In"}
        </button>
      </div>

      {/* 7-day averages */}
      {last7.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Latest Weight",
              value: checkIns[0]?.weightKg ? `${checkIns[0].weightKg} kg` : "—",
              sub: "Most recent",
            },
            {
              label: "Avg Energy",
              value: avgEnergy.toFixed(1),
              sub: "7-day average",
            },
            {
              label: "Avg Recovery",
              value: avgRecovery.toFixed(1),
              sub: "7-day average",
            },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              className="rounded-xl p-4 space-y-1"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--secondary)" }}>
                {label}
              </p>
              <p
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
              >
                {value}
              </p>
              <p className="text-xs" style={{ color: "var(--secondary)" }}>{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 space-y-6"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <h2
            className="font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            Today&apos;s Check-in
          </h2>

          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: "rgba(248,81,73,0.1)",
                border: "1px solid rgba(248,81,73,0.3)",
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>
              Body Weight (kg)
            </label>
            <input
              type="number"
              min={30} max={300} step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75.5"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: "var(--surface-high)",
                border: "1px solid var(--outline-variant)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <ScoreInput label="Energy Level" value={energyLevel} onChange={setEnergyLevel} />
          <ScoreInput label="Recovery Score" value={recoveryScore} onChange={setRecoveryScore} />

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="How did you sleep? Any soreness? Training notes..."
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={{
                backgroundColor: "var(--surface-high)",
                border: "1px solid var(--outline-variant)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--background)",
              fontFamily: "var(--font-body)",
            }}
          >
            {saving ? "Saving..." : "Save Check-in"}
          </button>
        </form>
      )}

      {/* History */}
      {checkIns.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <p className="font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            No check-ins yet
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--secondary)" }}>
            Track your weight, energy, and recovery daily.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            Log first check-in
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {checkIns.map((ci) => (
            <CheckInCard key={ci.id} checkIn={ci} />
          ))}
        </div>
      )}
    </div>
    </AppShell>
  );
}
