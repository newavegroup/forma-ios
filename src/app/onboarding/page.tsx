"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveOnboarding } from "@/app/actions/onboarding";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  canvas:   "#0A0B0D",
  surface:  "#14161A",
  subtle:   "#1F2228",
  fg1:      "#F5F6F7",
  fg2:      "#A8ADB6",
  fg3:      "#6B7280",
  fg4:      "#3A3F47",
  accent:   "#D4FF3A",
  accentDm: "rgba(212,255,58,0.12)",
  accentBd: "rgba(212,255,58,0.35)",
  success:  "#5EE49E",
  danger:   "#F56565",
  b1:       "rgba(255,255,255,0.06)",
  b2:       "rgba(255,255,255,0.10)",
};

// ─── Shared layout components ─────────────────────────────────────────────────
function StepBar({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div style={{ display: "flex", gap: 4, width: "100%", padding: "0 24px", boxSizing: "border-box" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 9999,
            background: i < step ? C.accent : C.b1,
            transition: "background 240ms ease",
          }}
        />
      ))}
    </div>
  );
}

function Header({ step, total = 3, onBack }: { step: number; total?: number; onBack?: () => void }) {
  return (
    <div style={{ padding: "4px 0 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px 16px",
          height: 44,
        }}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: C.fg2,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 15,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.fg2} strokeWidth="1.75">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        ) : (
          <span />
        )}
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: C.fg3,
          }}
        >
          Step {step} of {total}
        </span>
      </div>
      <StepBar step={step} total={total} />
    </div>
  );
}

function Hero({ title, sub, small }: { title: string; sub?: string; small?: boolean }) {
  return (
    <div style={{ padding: small ? "20px 24px" : "32px 24px 28px" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: small ? 28 : 32,
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
          color: C.fg1,
          margin: 0,
        }}
      >
        {title}
      </h1>
      {sub && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            lineHeight: 1.5,
            color: C.fg2,
            margin: "10px 0 0",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function Footer({
  primary,
  secondary,
  disabled,
  loading,
  onClick,
}: {
  primary: string;
  secondary?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      style={{
        padding: "20px 24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        borderTop: `1px solid ${C.b1}`,
        background: C.canvas,
      }}
    >
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        style={{
          height: 52,
          borderRadius: 6,
          border: 0,
          background: disabled || loading ? C.fg4 : C.accent,
          color: C.canvas,
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 16,
          cursor: disabled || loading ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 9999,
                border: `2px solid ${C.canvas}`,
                borderTopColor: "transparent",
                animation: "spin 1s linear infinite",
              }}
            />
            Saving…
          </>
        ) : (
          <>
            {primary}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={disabled ? C.fg3 : C.canvas} strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </>
        )}
      </button>
      {secondary && (
        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              color: C.fg2,
              cursor: "pointer",
            }}
          >
            {secondary}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── STEP 1 — Goal selection ──────────────────────────────────────────────────
const GOALS = [
  { id: "recomp",      title: "Body recomposition", sub: "Gain muscle, lose fat, hold weight roughly steady." },
  { id: "cut",         title: "Cut",                 sub: "Lose fat. Preserve the muscle you already have." },
  { id: "bulk",        title: "Bulk",                sub: "Gain muscle. Accept some fat gain along the way." },
  { id: "maintenance", title: "Maintenance",         sub: "Hold current composition. Stable intake." },
] as const;

function GoalStep({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (g: string) => void;
  onNext: () => void;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Header step={1} />
      <Hero title="What are you optimizing for?" sub="Pick one. You can change this later." />
      <div style={{ flex: 1, padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
        {GOALS.map((g) => {
          const sel = value === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange(g.id)}
              style={{
                background: sel ? C.accentDm : C.surface,
                border: sel ? `1px solid ${C.accentBd}` : `1px solid ${C.b1}`,
                borderRadius: 10,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                textAlign: "left",
                cursor: "pointer",
                minHeight: 92,
                boxSizing: "border-box",
                transition: "background 200ms, border-color 200ms",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 22,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    color: sel ? C.accent : C.fg1,
                  }}
                >
                  {g.title}
                </span>
                {sel && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 9999,
                      background: C.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.canvas} strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: C.fg2, lineHeight: 1.45 }}>
                {g.sub}
              </span>
            </button>
          );
        })}
      </div>
      <Footer primary="Continue" disabled={!value} onClick={onNext} />
    </div>
  );
}

// ─── STEP 2 — Food preferences ────────────────────────────────────────────────
const PROTEIN_OPTIONS = ["Chicken", "Beef", "Fish", "Eggs", "Pork", "Turkey", "Dairy", "Plant-based"];
const CULTURE_OPTIONS = ["Mexican", "American", "Mediterranean", "Asian", "No preference"];

function Chip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "10px 14px",
        background: selected ? C.accentDm : C.subtle,
        border: `1px solid ${selected ? C.accentBd : C.b1}`,
        borderRadius: 9999,
        color: selected ? C.accent : C.fg1,
        fontFamily: "var(--font-body)",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        transition: "background 160ms, border-color 160ms, color 160ms",
      }}
    >
      {label}
    </button>
  );
}

function FoodStep({
  proteins,
  cultures,
  dislikes,
  onProteins,
  onCultures,
  onDislikes,
  onBack,
  onNext,
}: {
  proteins: string[];
  cultures: string[];
  dislikes: string;
  onProteins: (p: string[]) => void;
  onCultures: (c: string[]) => void;
  onDislikes: (d: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  function toggleItem(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Header step={2} onBack={onBack} />
      <Hero title="What do you eat?" sub="Helps us generate meal plans you'll actually follow." small />
      <div
        style={{
          flex: 1,
          padding: "8px 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: C.fg2,
            }}
          >
            Protein sources
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PROTEIN_OPTIONS.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={proteins.includes(p)}
                onToggle={() => toggleItem(proteins, p, onProteins)}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: C.fg2,
            }}
          >
            Cuisine preferences
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CULTURE_OPTIONS.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={cultures.includes(c)}
                onToggle={() => toggleItem(cultures, c, onCultures)}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: C.fg2,
            }}
          >
            Dislikes{" "}
            <span style={{ color: C.fg3, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              · optional
            </span>
          </span>
          <textarea
            value={dislikes}
            onChange={(e) => onDislikes(e.target.value)}
            rows={3}
            placeholder="cilantro, liver…"
            style={{
              background: C.subtle,
              border: `1px solid ${C.b1}`,
              borderRadius: 6,
              padding: "12px 14px",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: C.fg1,
              outline: "none",
              resize: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
      <Footer primary="Continue" onClick={onNext} />
    </div>
  );
}

// ─── STEP 3 — Training schedule ───────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_OF_WEEK_MAP: Record<string, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0,
};
const TRAINING_TYPES = ["Strength", "Cardio", "Hyrox", "Mixed", "Run", "Swim", "Cycle", "HIIT"];

type DayConfig = { training: boolean; type: string; duration: number };

function TrainingStep({
  schedule,
  onSchedule,
  onBack,
  onSave,
  saving,
}: {
  schedule: Record<string, DayConfig>;
  onSchedule: (s: Record<string, DayConfig>) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  function toggleDay(day: string) {
    onSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        training: !schedule[day].training,
      },
    });
  }

  function updateDay(day: string, field: keyof DayConfig, value: string | number | boolean) {
    onSchedule({
      ...schedule,
      [day]: { ...schedule[day], [field]: value },
    });
  }

  const trainingDays = DAYS.filter((d) => schedule[d]?.training);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Header step={3} onBack={onBack} />
      <Hero title="When do you train?" sub="We adjust your carbs and calories on training days." small />
      <div
        style={{
          flex: 1,
          padding: "8px 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflowY: "auto",
        }}
      >
        {/* 7-day toggle grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {DAYS.map((day) => {
            const isTraining = schedule[day]?.training ?? false;
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                style={{
                  background: isTraining ? C.accentDm : C.surface,
                  borderRadius: 6,
                  border: `1px solid ${isTraining ? C.accentBd : C.b1}`,
                  borderTop: isTraining ? `1.5px solid ${C.accent}` : `1px solid ${C.b1}`,
                  padding: "12px 0 10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  minHeight: 76,
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 160ms, border-color 160ms",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 14,
                    fontWeight: 500,
                    color: C.fg1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {day}
                </span>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    background: isTraining ? C.accent : C.fg4,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isTraining ? C.accent : C.fg3,
                  }}
                >
                  {isTraining ? "Train" : "Rest"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Session details for training days */}
        {trainingDays.length > 0 && (
          <>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: C.fg2,
              }}
            >
              Session details
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {trainingDays.map((day) => (
                <div
                  key={day}
                  style={{
                    background: C.accentDm,
                    border: `1px solid ${C.accentBd}`,
                    borderTop: `1px solid ${C.accent}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 16,
                          fontWeight: 500,
                          color: C.fg1,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {day}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 11,
                          fontWeight: 500,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: C.accent,
                        }}
                      >
                        Training
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      value={schedule[day]?.type ?? "Strength"}
                      onChange={(e) => updateDay(day, "type", e.target.value)}
                      style={{
                        flex: 2,
                        background: C.subtle,
                        border: `1px solid ${C.b1}`,
                        borderRadius: 6,
                        padding: "8px 12px",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        color: C.fg1,
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      {TRAINING_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: C.subtle,
                        border: `1px solid ${C.b1}`,
                        borderRadius: 6,
                        padding: "8px 12px",
                      }}
                    >
                      <input
                        type="number"
                        min={15}
                        max={240}
                        step={15}
                        value={schedule[day]?.duration ?? 60}
                        onChange={(e) => updateDay(day, "duration", parseInt(e.target.value) || 60)}
                        style={{
                          flex: 1,
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          color: C.fg1,
                          width: "100%",
                          minWidth: 0,
                        }}
                      />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: C.fg3, flexShrink: 0 }}>
                        min
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {trainingDays.length === 0 && (
          <div
            style={{
              padding: "16px 20px",
              background: C.surface,
              border: `1px solid ${C.b1}`,
              borderRadius: 10,
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: C.fg3,
            }}
          >
            Select your training days above.
          </div>
        )}
      </div>
      <Footer
        primary="Set my targets"
        disabled={trainingDays.length === 0}
        loading={saving}
        onClick={onSave}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const DEFAULT_SCHEDULE: Record<string, DayConfig> = {
  Mon: { training: true,  type: "Strength", duration: 60 },
  Tue: { training: true,  type: "Cardio",   duration: 45 },
  Wed: { training: false, type: "Strength", duration: 60 },
  Thu: { training: true,  type: "Strength", duration: 60 },
  Fri: { training: true,  type: "Cardio",   duration: 45 },
  Sat: { training: false, type: "Mixed",    duration: 60 },
  Sun: { training: false, type: "Strength", duration: 60 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("recomp");
  const [proteins, setProteins] = useState<string[]>(["Chicken", "Beef", "Fish", "Eggs", "Turkey"]);
  const [cultures, setCultures] = useState<string[]>(["Mexican"]);
  const [dislikes, setDislikes] = useState("");
  const [schedule, setSchedule] = useState<Record<string, DayConfig>>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const trainingDays = DAYS.filter((d) => schedule[d]?.training).map((d) => ({
      dayOfWeek: DAY_OF_WEEK_MAP[d],
      trainingType: schedule[d].type,
      durationMin: schedule[d].duration,
    }));

    const result = await saveOnboarding({
      goal,
      foodPreferences: { proteins, cultures, dislikes },
      trainingDays,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/inbody");
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.canvas,
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-body)",
        maxWidth: 540,
        margin: "0 auto",
      }}
    >
      {error && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(245,101,101,0.15)",
            border: `1px solid rgba(245,101,101,0.3)`,
            borderRadius: 8,
            padding: "10px 16px",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: C.danger,
            zIndex: 100,
          }}
        >
          {error}
        </div>
      )}

      {step === 1 && (
        <GoalStep value={goal} onChange={setGoal} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <FoodStep
          proteins={proteins}
          cultures={cultures}
          dislikes={dislikes}
          onProteins={setProteins}
          onCultures={setCultures}
          onDislikes={setDislikes}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <TrainingStep
          schedule={schedule}
          onSchedule={setSchedule}
          onBack={() => setStep(2)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
