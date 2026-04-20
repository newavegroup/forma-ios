"use client";

import { useState, useEffect } from "react";
import { getProfile, upsertProfile } from "@/app/actions/profile";
import { AppShell } from "@/components/app-shell";
import type { ProfileData } from "@/app/actions/profile";

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

const CALIBRATION_GOALS = [
  { value: "recomp",      label: "Body recomposition", desc: "Build muscle while losing fat" },
  { value: "cut",         label: "Cut",                desc: "Lose fat in a caloric deficit" },
  { value: "bulk",        label: "Bulk",               desc: "Build muscle with a surplus" },
  { value: "maintenance", label: "Maintenance",        desc: "Maintain current composition" },
];

export default function ProfilePage() {
  // Profile fields
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [sport, setSport] = useState("");
  const [notes, setNotes] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Nutrition settings
  const [goal, setGoal] = useState<string>("recomp");
  const [trainingDays, setTrainingDays] = useState(4);
  const [recalibrating, setRecalibrating] = useState(false);
  const [recalibSuccess, setRecalibSuccess] = useState(false);
  const [recalibError, setRecalibError] = useState<string | null>(null);
  const [newTargets, setNewTargets] = useState<{
    protein_g: number;
    carbs_g_training: number;
    carbs_g_rest: number;
    fat_g_training: number;
    fat_g_rest: number;
    calories_training: number;
    calories_rest: number;
    rationale: string;
  } | null>(null);

  useEffect(() => {
    // Load profile (session resolved server-side via action)
    getProfile("").then((profile) => {
      if (profile) {
        setAge(profile.age?.toString() ?? "");
        setWeight(profile.weightKg?.toString() ?? "");
        setHeight(profile.heightCm?.toString() ?? "");
        setSport(profile.sport ?? "");
        setNotes(profile.notes ?? "");
        if (profile.trainingDaysPerWeek) setTrainingDays(profile.trainingDaysPerWeek);
        if (profile.goal) {
          const mapped = profile.goal === "body recomp" ? "recomp" : profile.goal;
          if (CALIBRATION_GOALS.find((g) => g.value === mapped)) setGoal(mapped);
        }
      }
    }).catch(() => {});
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileSaving(true);

    const data: ProfileData = {
      age: age ? Number(age) : undefined,
      weightKg: weight ? Number(weight) : undefined,
      heightCm: height ? Number(height) : undefined,
      sport: sport || undefined,
      trainingDaysPerWeek: trainingDays,
      goal: goal || undefined,
      notes: notes || undefined,
    };

    const result = await upsertProfile("", data);
    if (result.error) {
      setProfileError(result.error);
    } else {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
    setProfileSaving(false);
  }

  async function handleRecalibrate() {
    setRecalibError(null);
    setRecalibSuccess(false);
    setNewTargets(null);
    setRecalibrating(true);

    try {
      const res = await fetch("/api/recalibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, training_days_per_week: trainingDays }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecalibError(data.error ?? "Recalibration failed");
      } else {
        setNewTargets(data.targets);
        setRecalibSuccess(true);
      }
    } catch {
      setRecalibError("Network error — please try again");
    } finally {
      setRecalibrating(false);
    }
  }

  const inputStyle = {
    backgroundColor: "var(--surface-high)",
    border: "1px solid var(--outline-variant)",
    color: "var(--foreground)",
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            Profile &amp; Settings
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--secondary)" }}>
            Update your goal or training schedule to recalibrate your targets.
          </p>
        </div>

        {/* Nutrition Settings — recalibrate without re-uploading */}
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "var(--surface)" }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Nutrition Settings
          </h2>
          <p className="text-xs" style={{ color: "var(--secondary)" }}>
            Change your goal or training days and recalculate targets from your last InBody scan.
          </p>

          <div className="space-y-2">
            {CALIBRATION_GOALS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGoal(opt.value)}
                className="w-full rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  backgroundColor: goal === opt.value ? "var(--primary-container)" : "var(--surface-high)",
                  border: `1px solid ${goal === opt.value ? "var(--primary)" : "var(--outline-variant)"}`,
                }}
              >
                <p className="text-sm font-semibold" style={{ color: goal === opt.value ? "var(--primary)" : "var(--foreground)" }}>
                  {opt.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Training days per week</p>
              <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{trainingDays}</span>
            </div>
            <input
              type="range" min={0} max={7} value={trainingDays}
              onChange={(e) => setTrainingDays(parseInt(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="flex justify-between text-xs" style={{ color: "var(--secondary)" }}>
              <span>0 (sedentary)</span>
              <span>7 (daily)</span>
            </div>
          </div>

          {recalibError && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(248,81,73,0.1)", color: "var(--danger)" }}>
              {recalibError}
            </p>
          )}

          {recalibSuccess && newTargets && (
            <div className="rounded-xl overflow-hidden text-xs" style={{ border: "1px solid var(--outline-variant)" }}>
              <div className="px-4 py-2" style={{ backgroundColor: "var(--surface-high)" }}>
                <p className="font-semibold" style={{ color: "var(--accent)" }}>Targets updated</p>
              </div>
              <div className="px-4 py-3 space-y-1" style={{ backgroundColor: "var(--surface)" }}>
                <p style={{ color: "var(--foreground)" }}>Protein: <strong>{newTargets.protein_g}g</strong> daily</p>
                <p style={{ color: "var(--foreground)" }}>
                  Training: <strong>{newTargets.calories_training} kcal</strong> · {newTargets.carbs_g_training}g carbs · {newTargets.fat_g_training}g fat
                </p>
                <p style={{ color: "var(--foreground)" }}>
                  Rest: <strong>{newTargets.calories_rest} kcal</strong> · {newTargets.carbs_g_rest}g carbs · {newTargets.fat_g_rest}g fat
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleRecalibrate}
            disabled={recalibrating}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--background)" }}
          >
            {recalibrating ? "Recalculating..." : "Recalculate targets"}
          </button>
        </div>

        {/* Athlete Profile */}
        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "var(--surface)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              Athlete Profile
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Age", value: age, set: setAge, placeholder: "28", type: "number", min: 16, max: 80 },
                { label: "Weight (kg)", value: weight, set: setWeight, placeholder: "75.0", type: "number", min: 40, max: 200 },
                { label: "Height (cm)", value: height, set: setHeight, placeholder: "178", type: "number", min: 140, max: 220 },
              ].map(({ label, value, set, placeholder, type, min, max }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>{label}</label>
                  <input
                    type={type} min={min} max={max}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Primary Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={inputStyle}
              >
                <option value="">Select sport...</option>
                {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--secondary)" }}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Dietary restrictions, race schedule, injury history..."
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={inputStyle}
              />
            </div>
          </div>

          {profileError && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(248,81,73,0.1)", color: "var(--danger)" }}>
              {profileError}
            </p>
          )}
          {profileSuccess && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(63,185,80,0.1)", color: "var(--accent)" }}>
              Profile saved.
            </p>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "var(--primary)", color: "var(--background)" }}
          >
            {profileSaving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
