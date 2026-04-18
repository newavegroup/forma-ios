"use client";

import { useState, useEffect } from "react";
import { getProfile, upsertProfile } from "@/app/actions/profile";
import type { ProfileData } from "@/app/actions/profile";

const DEMO_USER_ID = "demo-user";

const SPORTS = [
  "Running",
  "Cycling",
  "Triathlon",
  "CrossFit",
  "Weightlifting + Running",
  "Swimming",
  "Rowing",
  "Road Cycling + Gym",
  "HYROX",
  "Other",
];

const GOALS = [
  { value: "performance", label: "Peak Performance" },
  { value: "body recomp", label: "Body Recomposition" },
  { value: "endurance", label: "Endurance Focus" },
  { value: "strength", label: "Strength Gain" },
];

function BMIIndicator({ bmi }: { bmi: number }) {
  let category = "Normal";
  let color = "var(--accent)";
  if (bmi < 18.5) { category = "Underweight"; color = "#e3b341"; }
  else if (bmi >= 25 && bmi < 30) { category = "Overweight"; color = "#e3b341"; }
  else if (bmi >= 30) { category = "Obese"; color = "var(--danger)"; }

  return (
    <div
      className="rounded-xl p-4 flex items-center justify-between"
      style={{ backgroundColor: "var(--surface-high)" }}
    >
      <div>
        <p className="text-xs" style={{ color: "var(--secondary)" }}>BMI</p>
        <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          {bmi.toFixed(1)}
        </p>
      </div>
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {category}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [sport, setSport] = useState("");
  const [trainingDays, setTrainingDays] = useState("5");
  const [goal, setGoal] = useState("performance");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    getProfile(DEMO_USER_ID).then((profile) => {
      if (profile) {
        setAge(profile.age?.toString() ?? "");
        setWeight(profile.weightKg?.toString() ?? "");
        setHeight(profile.heightCm?.toString() ?? "");
        setSport(profile.sport ?? "");
        setTrainingDays(profile.trainingDaysPerWeek?.toString() ?? "5");
        setGoal(profile.goal ?? "performance");
        setNotes(profile.notes ?? "");
      }
    });
  }, []);

  const bmi =
    weight && height
      ? Number(weight) / Math.pow(Number(height) / 100, 2)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const data: ProfileData = {
      age: age ? Number(age) : undefined,
      weightKg: weight ? Number(weight) : undefined,
      heightCm: height ? Number(height) : undefined,
      sport: sport || undefined,
      trainingDaysPerWeek: Number(trainingDays),
      goal: goal || undefined,
      notes: notes || undefined,
    };

    const result = await upsertProfile(DEMO_USER_ID, data);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm outline-none";
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
          Athlete Profile
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--secondary)" }}>
          Your body metrics and training preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
        {success && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: "rgba(63,185,80,0.1)",
              border: "1px solid rgba(63,185,80,0.3)",
              color: "var(--accent)",
            }}
          >
            Profile saved successfully.
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
                type="number" min={16} max={80}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="28"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Weight (kg)</label>
              <input
                type="number" min={40} max={200} step={0.1}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75.0"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Height (cm)</label>
              <input
                type="number" min={140} max={220}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="178"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          {bmi && <BMIIndicator bmi={bmi} />}
        </div>

        {/* Training profile */}
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

          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>
              Training Days / Week:{" "}
              <span style={{ color: "var(--primary)" }}>{trainingDays} days</span>
            </label>
            <input
              type="range" min={1} max={7}
              value={trainingDays}
              onChange={(e) => setTrainingDays(e.target.value)}
              className="w-full"
              style={{ accentColor: "var(--primary)" }}
            />
            <div className="flex justify-between text-xs" style={{ color: "var(--secondary)" }}>
              {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => (
                <span key={n}>{n}</span>
              ))}
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
            Primary Goal
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setGoal(value)}
                className="py-2.5 px-3 rounded-lg text-sm font-medium transition-colors text-left"
                style={{
                  backgroundColor: goal === value ? "var(--primary-container)" : "var(--surface-high)",
                  border: `1px solid ${goal === value ? "var(--primary)" : "var(--outline-variant)"}`,
                  color: goal === value ? "var(--primary)" : "var(--foreground)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            Athlete Notes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Dietary restrictions, race schedule, injury history, preferences..."
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--background)",
            fontFamily: "var(--font-body)",
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
