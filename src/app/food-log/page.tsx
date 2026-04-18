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

const DEMO_USER_ID = "demo-user";

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

type FoodEntry = { name: string; grams: string; calories: string; protein: string; carbs: string; fat: string };

const emptyFood = (): FoodEntry => ({ name: "", grams: "", calories: "", protein: "", carbs: "", fat: "" });

export default function FoodLogPage() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [mealName, setMealName] = useState("");
  const [foods, setFoods] = useState<FoodEntry[]>([emptyFood()]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterToday, setFilterToday] = useState(true);

  const loadLogs = useCallback(async () => {
    const data = await getFoodLogs(DEMO_USER_ID);
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

  function updateFood(i: number, field: keyof FoodEntry, value: string) {
    setFoods((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  }

  function addFoodRow() {
    setFoods((prev) => [...prev, emptyFood()]);
  }

  function removeFoodRow(i: number) {
    setFoods((prev) => prev.filter((_, idx) => idx !== i));
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

    const result = await createFoodLog(DEMO_USER_ID, data);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      setMealName("");
      setFoods([emptyFood()]);
      setNotes("");
      loadLogs();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await deleteFoodLog(id);
    loadLogs();
  }

  const todayTotal = displayedLogs.reduce((s, l) => s + l.totalCalories, 0);
  const todayProtein = displayedLogs.reduce((s, l) => s + l.totalProteinG, 0);
  const todayCarbs = displayedLogs.reduce((s, l) => s + l.totalCarbsG, 0);
  const todayFat = displayedLogs.reduce((s, l) => s + l.totalFatG, 0);

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
          <form
            onSubmit={handleSubmit}
            className="rounded-xl p-6 space-y-5"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--outline-variant)",
            }}
          >
            <h2
              className="font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Log a Meal
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
                Meal Name
              </label>
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
              <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>
                Foods
              </label>
              <div className="space-y-2">
                {/* Column headers */}
                <div className="grid grid-cols-7 gap-2 px-1">
                  {["Food", "Grams", "Cals", "Protein", "Carbs", "Fat", ""].map((h) => (
                    <p key={h} className="text-xs" style={{ color: "var(--secondary)" }}>{h}</p>
                  ))}
                </div>
                {foods.map((food, i) => (
                  <div key={i} className="grid grid-cols-7 gap-2 items-center">
                    {(["name", "grams", "calories", "protein", "carbs", "fat"] as (keyof FoodEntry)[]).map(
                      (field) => (
                        <input
                          key={field}
                          value={food[field]}
                          onChange={(e) => updateFood(i, field, e.target.value)}
                          placeholder={field === "name" ? "Chicken breast" : "0"}
                          type={field === "name" ? "text" : "number"}
                          min={0}
                          className="w-full rounded-md px-2 py-1.5 text-xs outline-none"
                          style={{
                            backgroundColor: "var(--surface-high)",
                            border: "1px solid var(--outline-variant)",
                            color: "var(--foreground)",
                          }}
                        />
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => removeFoodRow(i)}
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
                onClick={addFoodRow}
                className="text-xs font-medium mt-1 transition-opacity hover:opacity-70"
                style={{ color: "var(--primary)" }}
              >
                + Add food
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>
                Notes (optional)
              </label>
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
        )}

        {/* Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterToday(true)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: filterToday ? "var(--primary-container)" : "var(--surface)",
              color: filterToday ? "var(--primary)" : "var(--secondary)",
            }}
          >
            Today
          </button>
          <button
            onClick={() => setFilterToday(false)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: !filterToday ? "var(--primary-container)" : "var(--surface)",
              color: !filterToday ? "var(--primary)" : "var(--secondary)",
            }}
          >
            All logs
          </button>
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
