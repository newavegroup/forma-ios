"use client";

import { useState } from "react";
import { generateNutritionPlan } from "@/app/agents/nutrition-plan-generator";
import { createPlan } from "@/app/actions/plans";
import { useRouter } from "next/navigation";
import type { GeneratedNutritionPlan } from "@/app/agents/nutrition-plan-generator";

const DEMO_USER_ID = "demo-user";

const SPORTS = [
  "HYROX",
  "Hybrid Training",
  "Running",
  "Cycling",
  "Triathlon",
  "CrossFit",
  "Weightlifting + Running",
  "Swimming",
  "Rowing",
  "Other",
];

const GOALS = [
  { value: "performance", label: "Peak Performance", desc: "Maximize power output and endurance" },
  { value: "body recomp", label: "Body Recomposition", desc: "Build muscle while reducing body fat" },
  { value: "endurance", label: "Endurance Focus", desc: "Fuel long training sessions and races" },
  { value: "strength", label: "Strength Gain", desc: "Prioritize muscle mass and strength" },
];

export default function NewPlanPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "generating" | "preview">("form");
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedNutritionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [sport, setSport] = useState("");
  const [trainingDays, setTrainingDays] = useState("5");
  const [goal, setGoal] = useState("performance");
  const [context, setContext] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep("generating");

    const result = await generateNutritionPlan({
      profile: {
        age: age ? Number(age) : undefined,
        weightKg: weight ? Number(weight) : undefined,
        heightCm: height ? Number(height) : undefined,
        sport: sport || undefined,
        trainingDaysPerWeek: Number(trainingDays),
        goal,
        notes: context || undefined,
      },
      goal,
      additionalContext: context || undefined,
    });

    if (result.error || !result.plan) {
      setError(result.error ?? "Unknown error");
      setStep("form");
    } else {
      setGeneratedPlan(result.plan);
      setStep("preview");
    }
  }

  async function handleSave() {
    if (!generatedPlan) return;
    setSaving(true);

    const result = await createPlan(DEMO_USER_ID, {
      title: generatedPlan.title,
      calories: generatedPlan.calories,
      proteinG: generatedPlan.proteinG,
      carbsG: generatedPlan.carbsG,
      fatG: generatedPlan.fatG,
      meals: generatedPlan.meals,
      aiGenerated: true,
    });

    if (result.error) {
      setError(result.error);
    } else {
      router.push("/plans");
    }
    setSaving(false);
  }

  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors";
  const inputStyle = {
    backgroundColor: "var(--surface-high)",
    border: "1px solid var(--outline-variant)",
    color: "var(--foreground)",
    fontFamily: "var(--font-body)",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
        >
          Generate Nutrition Plan
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--secondary)" }}>
          AI-powered plan tailored to your sport and goals
        </p>
      </div>

      {step === "form" && (
        <form onSubmit={handleGenerate} className="space-y-6">
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: "rgba(248,81,73,0.1)",
                border: "1px solid rgba(248,81,73,0.3)",
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          {/* Body metrics */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Body Metrics
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Age</label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  type="number" min={16} max={80}
                  placeholder="28"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Weight (kg)</label>
                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  type="number" min={40} max={200} step={0.1}
                  placeholder="75"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Height (cm)</label>
                <input
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  type="number" min={140} max={220}
                  placeholder="178"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Training */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Training Profile
            </h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Primary Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">Select sport...</option>
                {SPORTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>
                Training Days / Week: <span style={{ color: "var(--primary)" }}>{trainingDays}</span>
              </label>
              <input
                type="range"
                min={1} max={7}
                value={trainingDays}
                onChange={(e) => setTrainingDays(e.target.value)}
                className="w-full accent-primary"
                style={{ accentColor: "var(--primary)" }}
              />
              <div className="flex justify-between text-xs" style={{ color: "var(--secondary)" }}>
                <span>1</span><span>7</span>
              </div>
            </div>
          </div>

          {/* Goal */}
          <div
            className="rounded-xl p-5 space-y-3"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Goal
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGoal(value)}
                  className="text-left p-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor: goal === value ? "var(--primary-container)" : "var(--surface-high)",
                    border: `1px solid ${goal === value ? "var(--primary)" : "var(--outline-variant)"}`,
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: goal === value ? "var(--primary)" : "var(--foreground)" }}
                  >
                    {label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div
            className="rounded-xl p-5 space-y-3"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Additional Context <span style={{ color: "var(--secondary)", fontWeight: 400 }}>(optional)</span>
            </h2>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="e.g. Training for a marathon in 12 weeks, lactose intolerant, prefer high-carb on long run days..."
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--background)",
              fontFamily: "var(--font-body)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM8 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
            Generate Plan with AI
          </button>
        </form>
      )}

      {step === "generating" && (
        <div
          className="rounded-xl p-16 flex flex-col items-center justify-center gap-4"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
          />
          <div className="text-center">
            <p
              className="font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Generating your plan...
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--secondary)" }}>
              Analyzing your profile and calculating optimal macros
            </p>
          </div>
        </div>
      )}

      {step === "preview" && generatedPlan && (
        <div className="space-y-5">
          {/* Plan header */}
          <div
            className="rounded-xl p-6 space-y-4"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: "var(--primary-container)", color: "var(--primary)" }}
                  >
                    AI Generated
                  </span>
                </div>
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
                >
                  {generatedPlan.title}
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--secondary)" }}>
                  {generatedPlan.summary}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Calories", value: generatedPlan.calories, unit: "kcal", color: "var(--foreground)" },
                { label: "Protein", value: generatedPlan.proteinG, unit: "g", color: "var(--primary)" },
                { label: "Carbs", value: generatedPlan.carbsG, unit: "g", color: "var(--accent)" },
                { label: "Fat", value: generatedPlan.fatG, unit: "g", color: "#e3b341" },
              ].map(({ label, value, unit, color }) => (
                <div
                  key={label}
                  className="rounded-lg px-3 py-3 text-center"
                  style={{ backgroundColor: "var(--surface-high)" }}
                >
                  <p className="text-xs" style={{ color: "var(--secondary)" }}>{label}</p>
                  <p
                    className="text-xl font-bold mt-0.5"
                    style={{ fontFamily: "var(--font-display)", color }}
                  >
                    {value}
                    <span className="text-xs font-normal" style={{ color: "var(--secondary)" }}>{unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-3">
            <h3
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Meal Breakdown
            </h3>
            {generatedPlan.meals.map((meal, i) => (
              <div
                key={i}
                className="rounded-xl p-4 space-y-3"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="font-semibold text-sm"
                      style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
                    >
                      {meal.name}
                    </p>
                    {meal.time && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>{meal.time}</p>
                    )}
                  </div>
                  <div className="text-right text-xs" style={{ color: "var(--secondary)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{meal.calories} kcal</p>
                    <p>P:{meal.proteinG}g C:{meal.carbsG}g F:{meal.fatG}g</p>
                  </div>
                </div>

                <div className="space-y-1">
                  {meal.foods.map((food, j) => (
                    <div
                      key={j}
                      className="flex justify-between items-center text-xs px-2.5 py-1.5 rounded-md"
                      style={{ backgroundColor: "var(--surface-high)" }}
                    >
                      <span style={{ color: "var(--foreground)" }}>{food.name}</span>
                      <span style={{ color: "var(--secondary)" }}>{food.amount} · {food.calories} kcal</span>
                    </div>
                  ))}
                </div>

                {meal.notes && (
                  <p className="text-xs italic" style={{ color: "var(--secondary)" }}>{meal.notes}</p>
                )}
              </div>
            ))}
          </div>

          {/* Coaching tips */}
          {generatedPlan.coachingTips && generatedPlan.coachingTips.length > 0 && (
            <div
              className="rounded-xl p-5 space-y-3"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
              >
                Coaching Tips
              </h3>
              <ul className="space-y-2">
                {generatedPlan.coachingTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--secondary)" }}>
                    <span style={{ color: "var(--accent)", marginTop: 2 }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
                      </svg>
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: "rgba(248,81,73,0.1)",
                border: "1px solid rgba(248,81,73,0.3)",
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep("form"); setGeneratedPlan(null); }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "var(--surface-high)",
                color: "var(--foreground)",
                fontFamily: "var(--font-body)",
              }}
            >
              Regenerate
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--background)",
                fontFamily: "var(--font-body)",
              }}
            >
              {saving ? "Saving..." : "Save Plan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
