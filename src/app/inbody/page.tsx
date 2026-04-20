"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  canvas:   "#0A0B0D",
  surface:  "#14161A",
  surfaceE: "#1C1F24",
  subtle:   "#1F2228",
  fg1:      "#F5F6F7",
  fg2:      "#A8ADB6",
  fg3:      "#6B7280",
  fg4:      "#3A3F47",
  accent:   "#D4FF3A",
  accentDm: "rgba(212,255,58,0.12)",
  accentBd: "rgba(212,255,58,0.35)",
  success:  "#5EE49E",
  warning:  "#F5B841",
  danger:   "#F56565",
  b1:       "rgba(255,255,255,0.06)",
  b2:       "rgba(255,255,255,0.10)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type ParsedScan = {
  scan_date: string;
  weight_kg: number;
  muscle_mass_kg: number;
  body_fat_percent: number;
  body_fat_mass_kg: number;
  visceral_fat: number;
  parsed_confidence: "high" | "low";
  flagged_fields?: string[];
};

type DailyTargets = {
  protein_g: number;
  carbs_g_training: number;
  carbs_g_rest: number;
  fat_g_rest: number;
  fat_g_training: number;
  calories_training: number;
  calories_rest: number;
};

type Goal = "recomp" | "cut" | "bulk" | "maintenance";
type GoalSettings = { goal: Goal; training_days_per_week: number };

type Screen =
  | { id: "upload" }
  | { id: "parsing" }
  | { id: "review"; scan: ParsedScan; pdfPath: string | null }
  | { id: "goals"; scan: ParsedScan; pdfPath: string | null }
  | { id: "saving" }
  | { id: "success"; scanDate: string; targets: DailyTargets | null; rationale: string | null }
  | { id: "error"; message: string };

// ─── Shared layout ────────────────────────────────────────────────────────────
function StepBar({ step, total = 5 }: { step: number; total?: number }) {
  return (
    <div style={{ display: "flex", gap: 4, width: "100%", padding: "0 24px", boxSizing: "border-box" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 9999, background: i < step ? C.accent : C.b1 }} />
      ))}
    </div>
  );
}

function MobileHeader({ step, total = 5, onBack }: { step: number; total?: number; onBack?: () => void }) {
  return (
    <div style={{ padding: "4px 0 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 16px", height: 44 }}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            style={{ background: "transparent", border: "none", padding: 0, display: "flex", alignItems: "center", gap: 4, color: C.fg2, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 15 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.fg2} strokeWidth="1.75"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>
        ) : <span />}
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>
          Step {step} of {total}
        </span>
      </div>
      <StepBar step={step} total={total} />
    </div>
  );
}

function MobileHero({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: "20px 24px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.025em", color: C.fg1, margin: 0 }}>
        {title}
      </h1>
      {sub && <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5, color: C.fg2, margin: "10px 0 0" }}>{sub}</p>}
    </div>
  );
}

function PrimaryButton({ onClick, disabled, loading, children }: { onClick?: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        height: 52, width: "100%", borderRadius: 6, border: 0,
        background: disabled || loading ? C.fg4 : C.accent,
        color: C.canvas, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16,
        cursor: disabled || loading ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {loading ? (
        <>
          <div style={{ width: 16, height: 16, borderRadius: 9999, border: `2px solid ${C.canvas}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
          Calibrating…
        </>
      ) : children}
    </button>
  );
}

// ─── SCREEN 5: Upload ─────────────────────────────────────────────────────────
function UploadScreen({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf" || file?.name.endsWith(".pdf")) onFile(file);
  }, [onFile]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <MobileHeader step={4} />
      <MobileHero title="Upload your InBody scan" sub="We need this to calibrate your targets. PDF only, from the last 30 days." />
      <div style={{ flex: 1, padding: "8px 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `1.5px dashed ${dragging ? C.accent : C.b2}`,
            background: dragging ? C.accentDm : C.surface,
            borderRadius: 10,
            padding: "36px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
            textAlign: "center", minHeight: 240, justifyContent: "center", cursor: "pointer",
            transition: "background 160ms, border-color 160ms",
          }}
        >
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          <div style={{ width: 56, height: 56, borderRadius: 9999, background: C.subtle, border: `1px solid ${C.b1}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.fg2} strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: C.fg1, letterSpacing: "-0.015em" }}>
              Drop a PDF or tap to select
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: C.fg3, marginTop: 6 }}>
              PDF · max 10 MB · last 30 days
            </div>
          </div>
        </div>

        {/* Info block */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: C.subtle, borderRadius: 6, border: `1px solid ${C.b1}` }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.fg2} strokeWidth="1.5" style={{ marginTop: 2, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: C.fg2, lineHeight: 1.5 }}>
            Forma uses your InBody scan to set precise targets. Supports InBody 120, 570, 770, 970.
          </div>
        </div>
      </div>
      <div style={{ padding: "20px 24px 32px", borderTop: `1px solid ${C.b1}`, background: C.canvas }}>
        <PrimaryButton disabled>Continue</PrimaryButton>
      </div>
    </div>
  );
}

// ─── Parsing ──────────────────────────────────────────────────────────────────
function ParsingScreen() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <MobileHeader step={4} />
      <MobileHero title="Upload your InBody scan" />
      <div style={{ flex: 1, padding: "8px 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{
          border: `1.5px dashed ${C.b2}`, background: C.surface, borderRadius: 10,
          padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "stretch",
          gap: 18, minHeight: 240, justifyContent: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, border: `2px solid ${C.b1}`, borderTopColor: C.accent, animation: "spin 1s linear infinite", flexShrink: 0 }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, color: C.fg1, letterSpacing: "-0.01em" }}>
                Reading your scan
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: C.fg3, marginTop: 2 }}>
                Usually takes 2–3 seconds
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 6: Review ─────────────────────────────────────────────────────────
const FIELDS: { key: keyof ParsedScan; label: string; unit: string; step: number; min: number; max: number }[] = [
  { key: "weight_kg",        label: "Weight",       unit: "kg", step: 0.1, min: 40,  max: 200 },
  { key: "body_fat_percent", label: "Body fat",     unit: "%",  step: 0.1, min: 3,   max: 60 },
  { key: "muscle_mass_kg",   label: "Muscle mass",  unit: "kg", step: 0.1, min: 10,  max: 80 },
  { key: "body_fat_mass_kg", label: "Body fat mass",unit: "kg", step: 0.1, min: 2,   max: 100 },
  { key: "visceral_fat",     label: "Visceral fat", unit: "",   step: 1,   min: 1,   max: 20 },
];

function EditableStat({
  label, value, unit, flagged, touched, size = "l",
  onEdit,
}: {
  label: string; value: number | string; unit: string; flagged?: boolean; touched?: boolean; size?: "l" | "m" | "s";
  onEdit?: () => void;
}) {
  const numSize = size === "l" ? 38 : size === "m" ? 30 : 22;
  const unitSize = Math.round(numSize * 0.32);
  const showWarning = flagged && !touched;
  return (
    <div
      onClick={onEdit}
      style={{
        background: C.surface,
        border: `1px solid ${showWarning ? C.warning : C.b1}`,
        borderRadius: 10, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 10,
        position: "relative", minWidth: 0, cursor: onEdit ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: C.fg3 }}>
          {label}
        </span>
        {showWarning ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        )}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: numSize, lineHeight: 1, letterSpacing: "-0.02em", color: C.fg1, fontVariantNumeric: "tabular-nums" }}>
        {value}
        {unit && <span style={{ fontFamily: "var(--font-body)", fontSize: unitSize, fontWeight: 500, color: C.fg2, marginLeft: 4 }}>{unit}</span>}
      </div>
      {showWarning && (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: C.warning }}>Verify</div>
      )}
    </div>
  );
}

function ReviewScreen({
  scan, pdfPath, onConfirm, onRetry,
}: {
  scan: ParsedScan; pdfPath: string | null;
  onConfirm: (scan: ParsedScan, pdfPath: string | null) => void;
  onRetry: () => void;
}) {
  const [values, setValues] = useState<ParsedScan>({ ...scan });
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<keyof ParsedScan | null>(null);
  const [editValue, setEditValue] = useState("");

  const flagged = new Set(scan.flagged_fields ?? []);
  const isLowConfidence = scan.parsed_confidence === "low";
  const pendingFlags = [...flagged].filter((f) => !touched.has(f));
  const canSave = !isLowConfidence || pendingFlags.length === 0;

  const filename = pdfPath ? pdfPath.split("/").pop() ?? "scan.pdf" : "inbody-scan.pdf";
  const scanDateFmt = new Date(values.scan_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  function openEdit(key: keyof ParsedScan) {
    const meta = FIELDS.find((f) => f.key === key);
    if (!meta) return;
    setEditingField(key);
    setEditValue(String(values[key]));
  }

  function commitEdit() {
    if (!editingField) return;
    const num = parseFloat(editValue);
    if (!isNaN(num)) {
      setValues((prev) => ({ ...prev, [editingField]: num }));
      if (flagged.has(editingField)) setTouched((prev) => new Set([...prev, editingField]));
    }
    setEditingField(null);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <MobileHeader step={5} />
      <MobileHero
        title={isLowConfidence && pendingFlags.length > 0 ? "Please verify flagged values." : "Does this look right?"}
        sub={isLowConfidence && pendingFlags.length > 0 ? "Tap each flagged number to confirm before we calibrate." : "We pulled these from your scan. Tap any value to edit."}
      />
      <div style={{ flex: 1, padding: "4px 20px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        {/* File summary */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: C.surface, border: `1px solid ${C.b1}`, borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 34, height: 42, borderRadius: 4, background: C.surfaceE, border: `1px solid ${C.b2}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 600, color: C.fg2, letterSpacing: "0.06em", flexShrink: 0 }}>
              PDF
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: C.fg1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{filename}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: C.fg3, marginTop: 2 }}>Scan date · {scanDateFmt}</div>
            </div>
          </div>
          {/* Confidence badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px",
            background: isLowConfidence ? "rgba(245,184,65,0.10)" : "rgba(94,228,158,0.10)",
            border: `1px solid ${isLowConfidence ? "rgba(245,184,65,0.25)" : "rgba(94,228,158,0.20)"}`,
            borderRadius: 9999,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 9999, background: isLowConfidence ? C.warning : C.success }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500, color: isLowConfidence ? C.warning : C.success, letterSpacing: "0.02em" }}>
              {isLowConfidence ? "Low confidence" : "High confidence"}
            </span>
          </div>
        </div>

        {/* Stat grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <EditableStat label="Weight" value={values.weight_kg} unit="kg" size="l"
            flagged={flagged.has("weight_kg")} touched={touched.has("weight_kg")}
            onEdit={() => openEdit("weight_kg")} />
          <EditableStat label="Body fat" value={values.body_fat_percent} unit="%" size="l"
            flagged={flagged.has("body_fat_percent")} touched={touched.has("body_fat_percent")}
            onEdit={() => openEdit("body_fat_percent")} />
          <EditableStat label="Muscle mass" value={values.muscle_mass_kg} unit="kg" size="m"
            flagged={flagged.has("muscle_mass_kg")} touched={touched.has("muscle_mass_kg")}
            onEdit={() => openEdit("muscle_mass_kg")} />
          <EditableStat label="Body fat mass" value={values.body_fat_mass_kg} unit="kg" size="m"
            flagged={flagged.has("body_fat_mass_kg")} touched={touched.has("body_fat_mass_kg")}
            onEdit={() => openEdit("body_fat_mass_kg")} />
          <EditableStat label="Visceral fat" value={values.visceral_fat} unit="" size="s"
            flagged={flagged.has("visceral_fat")} touched={touched.has("visceral_fat")}
            onEdit={() => openEdit("visceral_fat")} />
        </div>

        {/* Edit modal */}
        {editingField && (() => {
          const meta = FIELDS.find((f) => f.key === editingField)!;
          return (
            <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.7)" }} onClick={() => setEditingField(null)}>
              <div style={{ width: "100%", background: C.surfaceE, borderTop: `1px solid ${C.b2}`, borderRadius: "16px 16px 0 0", padding: "24px 24px 40px" }}
                onClick={(e) => e.stopPropagation()}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: C.fg2, marginBottom: 12 }}>
                  {meta.label}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input
                    type="number" autoFocus
                    value={editValue}
                    step={meta.step} min={meta.min} max={meta.max}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingField(null); }}
                    style={{ flex: 1, height: 52, background: C.subtle, border: `1px solid ${C.accent}`, borderRadius: 6, padding: "0 14px", fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, color: C.fg1, outline: "none" }}
                  />
                  {meta.unit && <span style={{ fontFamily: "var(--font-body)", fontSize: 18, color: C.fg2, flexShrink: 0 }}>{meta.unit}</span>}
                </div>
                <button type="button" onClick={commitEdit}
                  style={{ marginTop: 16, width: "100%", height: 52, borderRadius: 6, border: 0, background: C.accent, color: C.canvas, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
                  Save
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      <div style={{ padding: "16px 20px 28px", display: "flex", flexDirection: "column", gap: 10, borderTop: `1px solid ${C.b1}`, background: C.canvas }}>
        <PrimaryButton onClick={() => onConfirm(values, pdfPath)} disabled={!canSave}>
          {canSave ? <>Looks right, continue <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.canvas} strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></> : `Verify ${pendingFlags.length} flagged field${pendingFlags.length > 1 ? "s" : ""}`}
        </PrimaryButton>
        <div style={{ textAlign: "center" }}>
          <button type="button" onClick={onRetry} style={{ background: "transparent", border: "none", fontFamily: "var(--font-body)", fontSize: 15, color: C.fg2, cursor: "pointer" }}>
            Re-upload scan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Goals ────────────────────────────────────────────────────────────────────
const GOALS = [
  { id: "recomp" as Goal, title: "Body recomposition", sub: "Gain muscle, lose fat, hold weight roughly steady." },
  { id: "cut"   as Goal, title: "Cut",                 sub: "Lose fat. Preserve the muscle you already have." },
  { id: "bulk"  as Goal, title: "Bulk",                sub: "Gain muscle. Accept some fat gain along the way." },
  { id: "maintenance" as Goal, title: "Maintenance",   sub: "Hold current composition. Stable intake." },
];

function GoalsScreen({ onConfirm, onBack }: { onConfirm: (s: GoalSettings) => void; onBack: () => void }) {
  const [goal, setGoal] = useState<Goal>("recomp");
  const [trainingDays, setTrainingDays] = useState(4);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "4px 0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 20px 16px", height: 44 }}>
          <button type="button" onClick={onBack} style={{ background: "transparent", border: "none", padding: 0, display: "flex", alignItems: "center", gap: 4, color: C.fg2, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 15 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.fg2} strokeWidth="1.75"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>
        </div>
      </div>
      <MobileHero title="What are you optimizing for?" sub="This calibrates your macro targets." />
      <div style={{ flex: 1, padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
        {GOALS.map((g) => {
          const sel = goal === g.id;
          return (
            <button key={g.id} type="button" onClick={() => setGoal(g.id)}
              style={{ background: sel ? C.accentDm : C.surface, border: `1px solid ${sel ? C.accentBd : C.b1}`, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6, textAlign: "left", cursor: "pointer", minHeight: 92, boxSizing: "border-box", transition: "background 200ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 22, lineHeight: 1.1, letterSpacing: "-0.02em", color: sel ? C.accent : C.fg1 }}>{g.title}</span>
                {sel && <div style={{ width: 22, height: 22, borderRadius: 9999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.canvas} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>}
              </div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: C.fg2, lineHeight: 1.45 }}>{g.sub}</span>
            </button>
          );
        })}

        <div style={{ background: C.surface, border: `1px solid ${C.b1}`, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: C.fg1 }}>Training days per week</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: C.fg3, marginTop: 2 }}>Used to calculate your TDEE</div>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 32, lineHeight: 1, color: C.accent }}>{trainingDays}</span>
          </div>
          <input type="range" min={0} max={7} value={trainingDays} onChange={(e) => setTrainingDays(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: C.accent }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-body)", fontSize: 11, color: C.fg3 }}>
            <span>0 days</span><span>7 days</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px 32px", borderTop: `1px solid ${C.b1}`, background: C.canvas }}>
        <PrimaryButton onClick={() => onConfirm({ goal, training_days_per_week: trainingDays })}>
          Calculate my targets{" "}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.canvas} strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── SCREEN 7: Success / Targets reveal ───────────────────────────────────────
function SuccessScreen({ scanDate, targets, rationale, onNew }: {
  scanDate: string; targets: DailyTargets | null; rationale: string | null; onNew: () => void;
}) {
  const router = useRouter();
  const [day, setDay] = useState<"training" | "rest">("training");
  const t = day === "training";

  if (!targets) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: C.fg1, textAlign: "center" }}>Scan saved</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: C.fg2 }}>InBody from {scanDate}</div>
        <button type="button" onClick={() => router.push("/")} style={{ height: 52, borderRadius: 6, border: 0, background: C.accent, color: C.canvas, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16, padding: "0 32px", cursor: "pointer" }}>
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 0" }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.accent }}>
          Calibrated
        </span>
      </div>
      <div style={{ padding: "16px 24px 0" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 32, lineHeight: 1.05, letterSpacing: "-0.03em", color: C.fg1, margin: 0 }}>
          Your daily targets
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.5, color: C.fg2, margin: "8px 0 0" }}>
          Calibrated from your InBody scan and training schedule.
        </p>
      </div>

      <div style={{ flex: 1, padding: "20px 20px 12px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        {/* Day toggle */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", background: C.subtle, border: `1px solid ${C.b1}`, borderRadius: 9999, padding: 4, gap: 2 }}>
            {(["training", "rest"] as const).map((k) => {
              const sel = k === day;
              return (
                <button key={k} type="button" onClick={() => setDay(k)}
                  style={{ padding: "8px 14px", background: sel ? C.fg1 : "transparent", color: sel ? C.canvas : C.fg2, borderRadius: 9999, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  {k === "training" ? "🔥" : "🌙"} {k === "training" ? "Training day" : "Rest day"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero calories */}
        <div style={{ background: C.surface, border: `1px solid ${C.b1}`, borderTop: `1.5px solid ${C.accent}`, borderRadius: 10, padding: "22px 22px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: C.accent }}>
              {t ? "Training-day calories" : "Rest-day calories"}
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 72, lineHeight: 1, letterSpacing: "-0.035em", color: C.fg1, fontVariantNumeric: "tabular-nums", marginTop: 10 }}>
            {t ? targets.calories_training.toLocaleString() : targets.calories_rest.toLocaleString()}
            <span style={{ fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 500, color: C.fg2, marginLeft: 8 }}>kcal</span>
          </div>
        </div>

        {/* Three macros */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Protein", value: targets.protein_g, unit: "g" },
            { label: "Carbs", value: t ? targets.carbs_g_training : targets.carbs_g_rest, unit: "g" },
            { label: "Fat", value: t ? targets.fat_g_training : targets.fat_g_rest, unit: "g" },
          ].map(({ label, value, unit }) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.b1}`, borderRadius: 10, padding: "18px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: C.fg3 }}>{label}</span>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 36, lineHeight: 1, letterSpacing: "-0.025em", color: C.fg1, fontVariantNumeric: "tabular-nums" }}>
                {value}<span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: C.fg2, marginLeft: 3 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Rationale */}
        {rationale && (
          <div style={{ background: C.surface, border: `1px solid ${C.b1}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.b1}`, display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.75"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16, letterSpacing: "-0.015em", color: C.fg1 }}>Why these numbers</span>
            </div>
            <div style={{ padding: "14px 20px", fontFamily: "var(--font-body)", fontSize: 13, color: C.fg2, lineHeight: 1.6 }}>
              {rationale}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: "14px 20px 28px", display: "flex", flexDirection: "column", gap: 8, borderTop: `1px solid ${C.b1}`, background: C.canvas }}>
        <PrimaryButton onClick={() => router.push("/")}>
          Start logging{" "}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.canvas} strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </PrimaryButton>
        <div style={{ textAlign: "center" }}>
          <button type="button" onClick={onNew} style={{ background: "transparent", border: "none", fontFamily: "var(--font-body)", fontSize: 15, color: C.fg2, cursor: "pointer" }}>
            Upload another scan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Saving ───────────────────────────────────────────────────────────────────
function SavingScreen() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 24px 0" }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.accent }}>
          Calibrating
        </span>
      </div>
      <div style={{ padding: "28px 24px 0" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.025em", color: C.fg1, margin: 0 }}>
          Your daily targets
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5, color: C.fg2, margin: "10px 0 0" }}>
          Calibrated from your InBody scan and training schedule.
        </p>
      </div>
      <div style={{ padding: "28px 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.b1}`, borderRadius: 10, padding: 18, height: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ height: 10, width: 60, background: C.b1, borderRadius: 9999 }} />
              <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 500, color: C.fg4, letterSpacing: "-0.025em" }}>0</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.b1}`, borderRadius: 10, padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 20, height: 20, borderRadius: 9999, border: `2px solid ${C.b1}`, borderTopColor: C.accent, animation: "spin 1s linear infinite", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: C.fg2 }}>Running calibration…</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InBodyPage() {
  const [screen, setScreen] = useState<Screen>({ id: "upload" });

  async function handleFile(file: File) {
    setScreen({ id: "parsing" });
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      const res = await fetch("/api/inbody/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) { setScreen({ id: "error", message: json.error ?? "Upload failed" }); return; }
      setScreen({ id: "review", scan: json.data, pdfPath: json.pdf_path ?? null });
    } catch {
      setScreen({ id: "error", message: "Network error — please try again" });
    }
  }

  async function handleConfirm(scan: ParsedScan, pdfPath: string | null, goalSettings: GoalSettings) {
    setScreen({ id: "saving" });
    try {
      const res = await fetch("/api/inbody/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scan, pdf_path: pdfPath, ...goalSettings }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setScreen({ id: "error", message: json.error ?? "Save failed" }); return; }
      setScreen({ id: "success", scanDate: scan.scan_date, targets: json.targets ?? null, rationale: json.rationale ?? null });
    } catch {
      setScreen({ id: "error", message: "Network error — please try again" });
    }
  }

  const content = (
    <div style={{ minHeight: "100dvh", background: C.canvas, display: "flex", flexDirection: "column", fontFamily: "var(--font-body)", maxWidth: 540, margin: "0 auto" }}>
      {screen.id === "upload" && <UploadScreen onFile={handleFile} />}
      {screen.id === "parsing" && <ParsingScreen />}
      {screen.id === "review" && (
        <ReviewScreen
          scan={screen.scan} pdfPath={screen.pdfPath}
          onConfirm={(scan, pdfPath) => setScreen({ id: "goals", scan, pdfPath })}
          onRetry={() => setScreen({ id: "upload" })}
        />
      )}
      {screen.id === "goals" && (
        <GoalsScreen
          onConfirm={(settings) => handleConfirm(screen.scan, screen.pdfPath, settings)}
          onBack={() => setScreen({ id: "review", scan: screen.scan, pdfPath: screen.pdfPath })}
        />
      )}
      {screen.id === "saving" && <SavingScreen />}
      {screen.id === "success" && (
        <SuccessScreen
          scanDate={screen.scanDate} targets={screen.targets} rationale={screen.rationale}
          onNew={() => setScreen({ id: "upload" })}
        />
      )}
      {screen.id === "error" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "40px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 9999, background: "rgba(245,101,101,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: C.fg1 }}>Something went wrong</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: C.fg2, marginTop: 6 }}>{screen.message}</div>
          </div>
          <button type="button" onClick={() => setScreen({ id: "upload" })}
            style={{ height: 44, borderRadius: 6, border: 0, background: C.accent, color: C.canvas, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, padding: "0 24px", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      )}
    </div>
  );

  // When coming from onboarding (success screen not yet shown), render full-screen.
  // Otherwise wrap in AppShell for logged-in recalibration.
  if (screen.id === "upload" || screen.id === "parsing" || screen.id === "review" || screen.id === "goals" || screen.id === "saving" || screen.id === "success" || screen.id === "error") {
    return content;
  }

  return content;
}
