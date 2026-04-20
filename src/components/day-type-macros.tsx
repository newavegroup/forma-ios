"use client";

import { useState, useEffect } from "react";

type DayType = "low" | "high";

interface Targets {
  protein: number;
  carbsLow: number;
  carbsHigh: number;
  fatLow: number;
  fatHigh: number;
  calories: number;
}

interface Props {
  targets: Targets;
  todayCalories: number;
  todayProtein: number;
  todayCarbs: number;
  todayFat: number;
}

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

export function DayTypeMacros({ targets, todayCalories, todayProtein, todayCarbs, todayFat }: Props) {
  const [dayType, setDayType] = useState<DayType>("low");

  // Persist selection in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("forma_day_type") as DayType | null;
    if (stored === "low" || stored === "high") setDayType(stored);
  }, []);

  function toggle(type: DayType) {
    setDayType(type);
    localStorage.setItem("forma_day_type", type);
  }

  const targetCarbs = dayType === "low" ? targets.carbsLow : targets.carbsHigh;
  const targetFat   = dayType === "low" ? targets.fatLow   : targets.fatHigh;
  const caloriesPct = Math.min(100, Math.round((todayCalories / targets.calories) * 100));

  return (
    <>
      {/* Day type toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Today is a</span>
        <div
          className="flex rounded-lg overflow-hidden text-xs font-semibold"
          style={{ border: "1px solid var(--outline-variant)" }}
        >
          <button
            onClick={() => toggle("low")}
            className="px-3 py-1.5 transition-colors"
            style={{
              backgroundColor: dayType === "low" ? "var(--primary)" : "var(--surface-high)",
              color: dayType === "low" ? "var(--background)" : "var(--secondary)",
            }}
          >
            Low Carb
          </button>
          <button
            onClick={() => toggle("high")}
            className="px-3 py-1.5 transition-colors"
            style={{
              backgroundColor: dayType === "high" ? "var(--accent)" : "var(--surface-high)",
              color: dayType === "high" ? "var(--background)" : "var(--secondary)",
            }}
          >
            High Carb
          </button>
        </div>
        <span className="text-xs" style={{ color: "var(--secondary)" }}>
          {dayType === "low" ? "3:1 cycle — next high carb day after 3 lows" : "High carb day — fuel up"}
        </span>
      </div>

      {/* Calories ring + macros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calorie ring */}
        <div
          className="lg:col-span-1 rounded-xl p-6 flex flex-col items-center justify-center gap-4"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" stroke="var(--surface-highest)" />
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                strokeWidth="10"
                stroke={dayType === "high" ? "var(--accent)" : "var(--primary)"}
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
                / {targets.calories} kcal
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: "var(--secondary)" }}>Today&apos;s Calories</p>
            <p
              className="text-xs mt-0.5 px-2 py-0.5 rounded-full inline-block"
              style={{
                backgroundColor: dayType === "high" ? "rgba(var(--accent-rgb),0.15)" : "var(--primary-container)",
                color: dayType === "high" ? "var(--accent)" : "var(--primary)",
              }}
            >
              {dayType === "low" ? "Low Carb" : "High Carb"}
            </p>
          </div>
        </div>

        {/* Macros */}
        <div
          className="lg:col-span-2 rounded-xl p-6 flex flex-col justify-center space-y-5"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Macronutrients
          </p>
          <MacroBar label="Protein" current={todayProtein} target={targets.protein} color="var(--primary)" />
          <MacroBar label="Carbohydrates" current={todayCarbs} target={targetCarbs} color="var(--accent)" />
          <MacroBar label="Fat" current={todayFat} target={targetFat} color="#e3b341" />

          {/* Quick reference */}
          <div
            className="grid grid-cols-3 gap-2 pt-2 border-t text-xs"
            style={{ borderColor: "var(--outline-variant)" }}
          >
            <div className="text-center">
              <p style={{ color: "var(--secondary)" }}>Protein</p>
              <p className="font-semibold" style={{ color: "var(--primary)" }}>{targets.protein}g</p>
            </div>
            <div className="text-center">
              <p style={{ color: "var(--secondary)" }}>Carbs</p>
              <p className="font-semibold" style={{ color: "var(--accent)" }}>{targetCarbs}g</p>
            </div>
            <div className="text-center">
              <p style={{ color: "var(--secondary)" }}>Fat</p>
              <p className="font-semibold" style={{ color: "#e3b341" }}>{targetFat}g</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
