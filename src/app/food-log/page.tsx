"use client";

import { useState, useEffect, useCallback } from "react";
import { getFoodLogs, createFoodLog, deleteFoodLog } from "@/app/actions/food-log";
import type { FoodLogData } from "@/app/actions/food-log";
import { AppShell } from "@/components/app-shell";

type FoodLog = Awaited<ReturnType<typeof getFoodLogs>>[number];

type FoodItem = {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type EstimatedMeal = {
  mealName: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  confidence: "high" | "medium" | "low";
  notes?: string;
};

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {label}: {value}g
    </span>
  );
}

function FoodLogCard({ log, onDelete }: { log: FoodLog; onDelete: (id: string) => void }) {
  const foods = log.foods as FoodItem[];
  return (
    <div
      className="rounded-xl p-5 space-y-3"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--outline-variant)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            className="font-semibold text-sm"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            {log.mealName}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>
            {new Date(log.loggedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p
              className="text-lg font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              {log.totalCalories}
            </p>
            <p className="text-xs" style={{ color: "var(--secondary)" }}>kcal</p>
          </div>
          <button
            onClick={() => onDelete(log.id)}
            className="p-1.5 rounded-md transition-colors hover:opacity-70"
            style={{ color: "var(--danger)" }}
            title="Delete log"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <MacroPill label="P" value={log.totalProteinG} color="var(--primary)" />
        <MacroPill label="C" value={log.totalCarbsG} color="var(--accent)" />
        <MacroPill label="F" value={log.totalFatG} color="#e3b341" />
      </div>

      {foods.length > 0 && (
        <div
          className="rounded-lg overflow-hidden divide-y"
          style={{ backgroundColor: "var(--surface-high)", borderColor: "var(--outline-variant)" }}
        >
          {foods.map((food, i) => (
            <div key={i} className="px-3 py-2 flex justify-between items-center text-xs">
              <span style={{ color: "var(--foreground)" }}>{food.name}</span>
              <span style={{ color: "var(--secondary)" }}>{food.grams}g · {food.calories} kcal</span>
            </div>
          ))}
        </div>
      )}

      {log.notes && (
        <p className="text-xs italic" style={{ color: "var(--secondary)" }}>
          {log.notes}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Log Form
// ---------------------------------------------------------------------------

type LogMode = "ai" | "manual";

type ManualFoodEntry = { name: string; grams: string; calories: string; protein: string; carbs: string; fat: string };
const emptyFood = (): ManualFoodEntry => ({ name: "", grams: "", calories: "", protein: "", carbs: "", fat: "" });

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const styles = {
    high: { bg: "rgba(56,189,120,0.1)", color: "var(--primary)" },
    medium: { bg: "rgba(230,167,52,0.1)", color: "#e3b341" },
    low: { bg: "rgba(248,81,73,0.1)", color: "var(--danger)" },
  };
  const { bg, color } = styles[level];
  const labels = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {labels[level]}
    </span>
  );
}

function AILogForm({ onSave }: { onSave: () => void }) {
  const [description, setDescription] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [estimated, setEstimated] = useState<EstimatedMeal | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEstimate() {
    if (!description.trim()) return;
    setEstimating(true);
    setEstimated(null);
    setError(null);

    try {
      const res = await fetch("/api/macro-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Estimation failed");
      setEstimated({
        mealName: data.estimate.mealName,
        foods: data.estimate.foods,
        totalCalories: data.estimate.totalCalories,
        totalProteinG: data.estimate.totalProteinG,
        totalCarbsG: data.estimate.totalCarbsG,
        totalFatG: data.estimate.totalFatG,
        confidence: data.estimate.confidence,
        notes: data.estimate.notes,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setEstimating(false);
    }
  }

  function updateEstimated(field: keyof Pick<EstimatedMeal, "totalCalories" | "totalProteinG" | "totalCarbsG" | "totalFatG" | "mealName">, value: string) {
    if (!estimated) return;
    setEstimated({
      ...estimated,
      [field]: field === "mealName" ? value : Number(value),
    });
  }

  async function handleSave() {
    if (!estimated) return;
    setSaving(true);
    setError(null);

    const data: FoodLogData = {
      mealName: estimated.mealName,
      foods: estimated.foods,
      totalCalories: estimated.totalCalories,
      totalProteinG: estimated.totalProteinG,
      totalCarbsG: estimated.totalCarbsG,
      totalFatG: estimated.totalFatG,
    };

    const result = await createFoodLog(data);
    if (result.error) {
      setError(result.error);
    } else {
      setDescription("");
      setEstimated(null);
      onSave();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="space-y-2">
        <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>
          Describe what you ate
        </label>
        <div className="flex gap-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleEstimate();
              }
            }}
            rows={2}
            placeholder="e.g. grilled chicken breast, white rice, broccoli with olive oil"
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{
              backgroundColor: "var(--surface-high)",
              border: "1px solid var(--outline-variant)",
              color: "var(--foreground)",
            }}
          />
          <button
            onClick={handleEstimate}
            disabled={estimating || !description.trim()}
            className="self-end px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--background)",
              fontFamily: "var(--font-body)",
              minWidth: "100px",
            }}
          >
            {estimating ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Estimating
              </span>
            ) : "Estimate"}
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--secondary)" }}>
          Press Enter or click Estimate — AI will calculate macros
        </p>
      </div>

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

      {/* Result */}
      {estimated && (
        <div
          className="rounded-xl p-4 space-y-4"
          style={{
            backgroundColor: "var(--surface-high)",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <input
                value={estimated.mealName}
                onChange={(e) => updateEstimated("mealName", e.target.value)}
                className="font-semibold text-sm bg-transparent outline-none border-b border-transparent focus:border-current"
                style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}
              />
              <div className="flex items-center gap-2">
                <ConfidenceBadge level={estimated.confidence} />
              </div>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              {estimated.totalCalories} <span className="text-sm font-normal" style={{ color: "var(--secondary)" }}>kcal</span>
            </p>
          </div>

          {estimated.notes && (
            <p className="text-xs italic" style={{ color: "var(--secondary)" }}>
              {estimated.notes}
            </p>
          )}

          {/* Macro editors */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Protein", field: "totalProteinG" as const, value: estimated.totalProteinG, color: "var(--primary)" },
              { label: "Carbs", field: "totalCarbsG" as const, value: estimated.totalCarbsG, color: "var(--accent)" },
              { label: "Fat", field: "totalFatG" as const, value: estimated.totalFatG, color: "#e3b341" },
            ].map(({ label, field, value, color }) => (
              <div key={field} className="rounded-lg px-3 py-2 text-center" style={{ backgroundColor: "var(--surface)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--secondary)" }}>{label}</p>
                <div className="flex items-baseline justify-center gap-0.5">
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => updateEstimated(field, e.target.value)}
                    min={0}
                    className="w-14 text-center font-bold text-lg bg-transparent outline-none"
                    style={{ color, fontFamily: "var(--font-display)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--secondary)" }}>g</span>
                </div>
              </div>
            ))}
          </div>

          {/* Food breakdown */}
          <div className="space-y-1">
            <p className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Breakdown</p>
            <div className="rounded-lg overflow-hidden divide-y" style={{ backgroundColor: "var(--surface)" }}>
              {estimated.foods.map((food, i) => (
                <div key={i} className="px-3 py-2 flex justify-between items-center text-xs">
                  <span style={{ color: "var(--foreground)" }}>{food.name} ({food.grams}g)</span>
                  <span style={{ color: "var(--secondary)" }}>
                    {food.calories} kcal · P{food.protein}g · C{food.carbs}g · F{food.fat}g
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--background)",
              fontFamily: "var(--font-body)",
            }}
          >
            {saving ? "Saving..." : "Log this meal"}
          </button>
        </div>
      )}
    </div>
  );
}

function ManualLogForm({ onSave }: { onSave: () => void }) {
  const [mealName, setMealName] = useState("");
  const [foods, setFoods] = useState<ManualFoodEntry[]>([emptyFood()]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateFood(i: number, field: keyof ManualFoodEntry, value: string) {
    setFoods((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const parsedFoods = foods
      .filter((f) => f.name.trim())
      .map((f) => ({
        name: f.name,
        grams: Number(f.grams) || 0,
        calories: Number(f.calories) || 0,
        protein: Number(f.protein) || 0,
        carbs: Number(f.carbs) || 0,
        fat: Number(f.fat) || 0,
      }));

    if (parsedFoods.length === 0) {
      setError("Add at least one food item.");
      setSaving(false);
      return;
    }

    const data: FoodLogData = {
      mealName,
      foods: parsedFoods,
      totalCalories: parsedFoods.reduce((s, f) => s + f.calories, 0),
      totalProteinG: parsedFoods.reduce((s, f) => s + f.protein, 0),
      totalCarbsG: parsedFoods.reduce((s, f) => s + f.carbs, 0),
      totalFatG: parsedFoods.reduce((s, f) => s + f.fat, 0),
      notes: notes || undefined,
    };

    const result = await createFoodLog(data);
    if (result.error) {
      setError(result.error);
    } else {
      setMealName("");
      setFoods([emptyFood()]);
      setNotes("");
      onSave();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Meal Name</label>
        <input
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          required
          placeholder="e.g. Pre-workout Breakfast"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--surface-high)",
            border: "1px solid var(--outline-variant)",
            color: "var(--foreground)",
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Foods</label>
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-2 px-1">
            {["Food", "Grams", "Cals", "Protein", "Carbs", "Fat", ""].map((h) => (
              <p key={h} className="text-xs" style={{ color: "var(--secondary)" }}>{h}</p>
            ))}
          </div>
          {foods.map((food, i) => (
            <div key={i} className="grid grid-cols-7 gap-2 items-center">
              {(["name", "grams", "calories", "protein", "carbs", "fat"] as (keyof ManualFoodEntry)[]).map((field) => (
                <input
                  key={field}
                  value={food[field]}
                  onChange={(e) => updateFood(i, field, e.target.value)}
                  placeholder={field === "name" ? "Chicken" : "0"}
                  type={field === "name" ? "text" : "number"}
                  min={0}
                  className="w-full rounded-md px-2 py-1.5 text-xs outline-none"
                  style={{
                    backgroundColor: "var(--surface-high)",
                    border: "1px solid var(--outline-variant)",
                    color: "var(--foreground)",
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => setFoods((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-xs transition-opacity hover:opacity-70"
                style={{ color: "var(--danger)" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFoods((prev) => [...prev, emptyFood()])}
          className="text-xs font-medium mt-1 transition-opacity hover:opacity-70"
          style={{ color: "var(--primary)" }}
        >
          + Add food
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Post-run recovery meal..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
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
        {saving ? "Saving..." : "Save Meal"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FoodLogPage() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [logMode, setLogMode] = useState<LogMode>("ai");
  const [filterToday, setFilterToday] = useState(true);

  const loadLogs = useCallback(async () => {
    const data = await getFoodLogs();
    setLogs(data);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const displayedLogs = filterToday
    ? logs.filter((l) => {
        const d = new Date(l.loggedAt);
        const t = new Date();
        return (
          d.getFullYear() === t.getFullYear() &&
          d.getMonth() === t.getMonth() &&
          d.getDate() === t.getDate()
        );
      })
    : logs;

  async function handleDelete(id: string) {
    await deleteFoodLog(id);
    loadLogs();
  }

  function handleSaved() {
    setShowForm(false);
    loadLogs();
  }

  const todayLogs = logs.filter((l) => {
    const d = new Date(l.loggedAt);
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  });
  const todayTotal = todayLogs.reduce((s, l) => s + l.totalCalories, 0);
  const todayProtein = todayLogs.reduce((s, l) => s + l.totalProteinG, 0);
  const todayCarbs = todayLogs.reduce((s, l) => s + l.totalCarbsG, 0);
  const todayFat = todayLogs.reduce((s, l) => s + l.totalFatG, 0);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Food Log
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--secondary)" }}>
              Track your meals and macros
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
            {showForm ? "Cancel" : "+ Log Meal"}
          </button>
        </div>

        {/* Today summary bar */}
        <div
          className="rounded-xl p-4 grid grid-cols-4 gap-4"
          style={{ backgroundColor: "var(--surface)" }}
        >
          {[
            { label: "Calories", value: todayTotal, unit: "kcal" },
            { label: "Protein", value: todayProtein, unit: "g" },
            { label: "Carbs", value: todayCarbs, unit: "g" },
            { label: "Fat", value: todayFat, unit: "g" },
          ].map(({ label, value, unit }) => (
            <div key={label} className="text-center">
              <p className="text-xs" style={{ color: "var(--secondary)" }}>{label}</p>
              <p
                className="text-xl font-bold mt-0.5"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
              >
                {value}
                <span className="text-xs font-normal ml-0.5" style={{ color: "var(--secondary)" }}>
                  {unit}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Log form */}
        {showForm && (
          <div
            className="rounded-xl p-6 space-y-5"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--outline-variant)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
              >
                Log a Meal
              </h2>
              {/* Mode toggle */}
              <div
                className="flex rounded-lg overflow-hidden text-xs font-medium"
                style={{ backgroundColor: "var(--surface-high)", border: "1px solid var(--outline-variant)" }}
              >
                {(["ai", "manual"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setLogMode(mode)}
                    className="px-3 py-1.5 transition-colors"
                    style={{
                      backgroundColor: logMode === mode ? "var(--primary-container)" : "transparent",
                      color: logMode === mode ? "var(--primary)" : "var(--secondary)",
                    }}
                  >
                    {mode === "ai" ? "AI estimate" : "Manual"}
                  </button>
                ))}
              </div>
            </div>

            {logMode === "ai" ? (
              <AILogForm onSave={handleSaved} />
            ) : (
              <ManualLogForm onSave={handleSaved} />
            )}
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2">
          {(["today", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterToday(f === "today")}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: (f === "today") === filterToday ? "var(--primary-container)" : "var(--surface)",
                color: (f === "today") === filterToday ? "var(--primary)" : "var(--secondary)",
              }}
            >
              {f === "today" ? "Today" : "All logs"}
            </button>
          ))}
        </div>

        {/* Log list */}
        {displayedLogs.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <p className="text-sm" style={{ color: "var(--secondary)" }}>
              {filterToday ? "No meals logged today." : "No food logs yet."}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-medium"
              style={{ color: "var(--primary)" }}
            >
              Log your first meal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedLogs.map((log) => (
              <FoodLogCard key={log.id} log={log} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
