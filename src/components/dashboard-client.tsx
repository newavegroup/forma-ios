"use client";

import { useState, useEffect, useRef } from "react";
import { createFoodLog } from "@/app/actions/food-log";

type DayType = "low" | "high";

interface Targets {
  protein: number;
  carbsLow: number;
  carbsHigh: number;
  fatLow: number;
  fatHigh: number;
  calories: number;
}

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Props {
  targets: Targets;
  todayTotals: Totals;
  scanEffectiveDate: string | null; // ISO date of most recent calibration
}

// ---------------------------------------------------------------------------
// Auto-calculate day type from 3:1 cycle anchored to scan date
// ---------------------------------------------------------------------------
function calcDayType(anchorDate: string | null): DayType {
  if (!anchorDate) return "low";
  const anchor = new Date(anchorDate);
  anchor.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - anchor.getTime()) / 86400000);
  // 3:1 cycle: 0=low,1=low,2=low,3=high,4=low,...
  return diffDays % 4 === 3 ? "high" : "low";
}

// ---------------------------------------------------------------------------
// Ring component
// ---------------------------------------------------------------------------
function Ring({ pct, color, size = 96 }: { pct: number; color: string; size?: number }) {
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, pct / 100));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={size * 0.09} stroke="var(--surface-highest)" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        strokeWidth={size * 0.09}
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function DashboardClient({ targets, todayTotals, scanEffectiveDate }: Props) {
  const [dayType, setDayType] = useState<DayType>(() => calcDayType(scanEffectiveDate));

  // Allow manual override — persisted in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("forma_day_type_override");
    const storedDate = localStorage.getItem("forma_day_type_date");
    const todayStr = new Date().toISOString().split("T")[0];
    if (stored && storedDate === todayStr) {
      setDayType(stored as DayType);
    } else {
      // New day — reset to auto-calculated
      localStorage.removeItem("forma_day_type_override");
      setDayType(calcDayType(scanEffectiveDate));
    }
  }, [scanEffectiveDate]);

  function toggleDayType() {
    const next: DayType = dayType === "low" ? "high" : "low";
    setDayType(next);
    const todayStr = new Date().toISOString().split("T")[0];
    localStorage.setItem("forma_day_type_override", next);
    localStorage.setItem("forma_day_type_date", todayStr);
  }

  const targetCarbs = dayType === "low" ? targets.carbsLow : targets.carbsHigh;
  const targetFat   = dayType === "low" ? targets.fatLow   : targets.fatHigh;

  const remaining = {
    calories: Math.max(0, targets.calories - todayTotals.calories),
    protein:  Math.max(0, targets.protein  - todayTotals.protein),
    carbs:    Math.max(0, targetCarbs      - todayTotals.carbs),
    fat:      Math.max(0, targetFat        - todayTotals.fat),
  };

  const calPct     = Math.min(100, (todayTotals.calories / targets.calories) * 100);
  const proteinPct = Math.min(100, (todayTotals.protein  / targets.protein)  * 100);
  const carbsPct   = Math.min(100, (todayTotals.carbs    / targetCarbs)      * 100);
  const fatPct     = Math.min(100, (todayTotals.fat      / targetFat)        * 100);

  const accentColor = dayType === "high" ? "var(--accent)" : "var(--primary)";

  return (
    <div className="space-y-6">
      {/* Day type pill — tap to override */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDayType}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            backgroundColor: dayType === "high" ? "rgba(var(--accent-rgb,99,179,237),0.15)" : "var(--primary-container)",
            color: accentColor,
            border: `1px solid ${accentColor}`,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          {dayType === "low" ? "Low Carb Day" : "High Carb Day"}
          <span style={{ opacity: 0.6 }}>↔</span>
        </button>
        <span className="text-xs" style={{ color: "var(--secondary)" }}>
          {dayType === "low"
            ? `${targets.carbsLow}g carbs · ${targets.fatLow}g fat`
            : `${targets.carbsHigh}g carbs · ${targets.fatHigh}g fat`}
          {" · "}{targets.protein}g protein
        </span>
      </div>

      {/* Progress rings */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Calories", pct: calPct,     consumed: todayTotals.calories, target: targets.calories, unit: "kcal", color: accentColor },
          { label: "Protein",  pct: proteinPct, consumed: todayTotals.protein,  target: targets.protein,  unit: "g",    color: "var(--primary)" },
          { label: "Carbs",    pct: carbsPct,   consumed: todayTotals.carbs,    target: targetCarbs,      unit: "g",    color: "var(--accent)" },
          { label: "Fat",      pct: fatPct,     consumed: todayTotals.fat,      target: targetFat,        unit: "g",    color: "#e3b341" },
        ].map(({ label, pct, consumed, target, unit, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex flex-col items-center gap-2"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="relative">
              <Ring pct={pct} color={color} size={72} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
                  {Math.round(pct)}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: "var(--secondary)" }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--foreground)" }}>
                <span className="font-semibold">{consumed}</span>
                <span style={{ color: "var(--secondary)" }}>/{target}{unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Remaining summary */}
      {(remaining.protein > 0 || remaining.carbs > 0 || remaining.fat > 0) && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--outline-variant)" }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Still need:</span>
          {remaining.protein > 0 && (
            <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
              {remaining.protein}g protein
            </span>
          )}
          {remaining.carbs > 0 && (
            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
              {remaining.carbs}g carbs
            </span>
          )}
          {remaining.fat > 0 && (
            <span className="text-xs font-semibold" style={{ color: "#e3b341" }}>
              {remaining.fat}g fat
            </span>
          )}
          {remaining.calories > 0 && (
            <span className="text-xs" style={{ color: "var(--secondary)" }}>
              ({remaining.calories} kcal left)
            </span>
          )}
        </div>
      )}

      {/* Quick log */}
      <QuickLog onLogged={() => {
        // Reload page data after logging
        window.location.reload();
      }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline quick-log component
// ---------------------------------------------------------------------------

type LogState = "idle" | "estimating" | "reviewing" | "saving" | "done";

interface Estimate {
  mealName: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  confidence: string;
  foods: Array<{ name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }>;
}

function QuickLog({ onLogged }: { onLogged: () => void }) {
  const [state, setState] = useState<LogState>("idle");
  const [saving, setSaving] = useState(false);
  const [input, setInput] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleEstimate() {
    const text = input.trim();
    if (!text) return;
    setState("estimating");
    setError(null);
    try {
      const res = await fetch("/api/macro-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEstimate(data.estimate);
      setState("reviewing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setState("idle");
    }
  }

  async function handleSave() {
    if (!estimate) return;
    setSaving(true);
    const result = await createFoodLog({
      mealName: estimate.mealName,
      foods: estimate.foods,
      totalCalories: estimate.totalCalories,
      totalProteinG: estimate.totalProteinG,
      totalCarbsG: estimate.totalCarbsG,
      totalFatG: estimate.totalFatG,
    });
    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      setState("done");
      setSaving(false);
      setTimeout(() => {
        setState("idle");
        setInput("");
        setEstimate(null);
        onLogged();
      }, 1200);
    }
  }

  function handleDiscard() {
    setState("idle");
    setEstimate(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  if (state === "done") {
    return (
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--primary)" }}
      >
        <span style={{ color: "var(--primary)", fontSize: 20 }}>✓</span>
        <span className="text-sm font-medium" style={{ color: "var(--primary)" }}>Logged!</span>
      </div>
    );
  }

  if (state === "reviewing" && estimate) {
    return (
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--outline-variant)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
              {estimate.mealName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>
              {estimate.confidence} confidence
            </p>
          </div>
          <p className="text-xl font-bold shrink-0" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            {estimate.totalCalories} <span className="text-sm font-normal" style={{ color: "var(--secondary)" }}>kcal</span>
          </p>
        </div>

        <div className="flex gap-3 text-sm">
          <span style={{ color: "var(--primary)" }}>P {estimate.totalProteinG}g</span>
          <span style={{ color: "var(--accent)" }}>C {estimate.totalCarbsG}g</span>
          <span style={{ color: "#e3b341" }}>F {estimate.totalFatG}g</span>
        </div>

        {/* Food breakdown */}
        <div className="rounded-lg overflow-hidden divide-y text-xs" style={{ backgroundColor: "var(--surface-high)" }}>
          {estimate.foods.map((f, i) => (
            <div key={i} className="px-3 py-1.5 flex justify-between">
              <span style={{ color: "var(--foreground)" }}>{f.name} {f.grams > 0 && `(${f.grams}g)`}</span>
              <span style={{ color: "var(--secondary)" }}>{f.calories} kcal</span>
            </div>
          ))}
        </div>

        {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "var(--primary)", color: "var(--background)" }}
          >
            {saving ? "Saving..." : "Log this"}
          </button>
          <button
            onClick={handleDiscard}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
            style={{ backgroundColor: "var(--surface-high)", color: "var(--secondary)" }}
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 space-y-2"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--outline-variant)" }}
    >
      <p className="text-xs font-medium" style={{ color: "var(--secondary)" }}>
        What did you eat?
      </p>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !state.startsWith("e")) handleEstimate();
          }}
          placeholder="e.g. grilled chicken 150g, white rice, broccoli"
          disabled={state === "estimating"}
          className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none disabled:opacity-50"
          style={{
            backgroundColor: "var(--surface-high)",
            border: "1px solid var(--outline-variant)",
            color: "var(--foreground)",
          }}
        />
        <button
          onClick={handleEstimate}
          disabled={!input.trim() || state === "estimating"}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--primary)", color: "var(--background)", minWidth: 80 }}
        >
          {state === "estimating" ? (
            <span className="flex items-center gap-1.5 justify-center">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          ) : "Log"}
        </button>
      </div>
      {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
      <p className="text-xs" style={{ color: "var(--secondary)", opacity: 0.6 }}>
        AI estimates macros · press Enter to log
      </p>
    </div>
  );
}
