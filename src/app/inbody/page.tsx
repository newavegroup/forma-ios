"use client";

import { useState, useRef, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

type Screen =
  | { id: "upload" }
  | { id: "parsing" }
  | { id: "review"; scan: ParsedScan; pdfPath: string | null }
  | { id: "saving" }
  | { id: "success"; scanDate: string }
  | { id: "error"; message: string };

// ---------------------------------------------------------------------------
// Field metadata
// ---------------------------------------------------------------------------

const FIELDS: {
  key: keyof ParsedScan;
  label: string;
  unit: string;
  step: number;
  min: number;
  max: number;
}[] = [
  { key: "weight_kg", label: "Body Weight", unit: "kg", step: 0.1, min: 40, max: 200 },
  { key: "muscle_mass_kg", label: "Skeletal Muscle Mass", unit: "kg", step: 0.1, min: 10, max: 80 },
  { key: "body_fat_percent", label: "Body Fat %", unit: "%", step: 0.1, min: 3, max: 60 },
  { key: "body_fat_mass_kg", label: "Body Fat Mass", unit: "kg", step: 0.1, min: 2, max: 100 },
  { key: "visceral_fat", label: "Visceral Fat Level", unit: "/ 20", step: 1, min: 1, max: 20 },
];

// ---------------------------------------------------------------------------
// Upload screen
// ---------------------------------------------------------------------------

function UploadScreen({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type === "application/pdf" || file?.name.endsWith(".pdf")) {
        onFile(file);
      }
    },
    [onFile]
  );

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
        >
          Upload InBody Scan
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--secondary)" }}>
          Upload your InBody PDF to calibrate your nutrition targets.
        </p>
      </div>

      <div
        className="relative rounded-2xl p-12 flex flex-col items-center justify-center gap-4 border-2 border-dashed cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? "var(--primary)" : "var(--outline-variant)",
          backgroundColor: dragging ? "rgba(88,166,255,0.05)" : "var(--surface)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "var(--surface-highest)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>

        <div className="text-center">
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>
            Drop your InBody PDF here
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--secondary)" }}>
            or click to browse
          </p>
        </div>

        <p className="text-xs" style={{ color: "var(--secondary)", opacity: 0.7 }}>
          Supports InBody 120, 570, 770, 970
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parsing screen
// ---------------------------------------------------------------------------

function ParsingScreen() {
  return (
    <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-6 py-24">
      <div
        className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: "var(--surface-highest)", borderTopColor: "var(--primary)" }}
      />
      <div className="text-center">
        <p className="font-semibold" style={{ color: "var(--foreground)" }}>
          Analyzing your InBody scan
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--secondary)" }}>
          Extracting body composition data...
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review screen
// ---------------------------------------------------------------------------

function ReviewScreen({
  scan,
  pdfPath,
  onConfirm,
  onRetry,
}: {
  scan: ParsedScan;
  pdfPath: string | null;
  onConfirm: (scan: ParsedScan, pdfPath: string | null) => void;
  onRetry: () => void;
}) {
  const [values, setValues] = useState<ParsedScan>({ ...scan });
  // Track which flagged fields have been touched by the user
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const flagged = new Set(scan.flagged_fields ?? []);
  const isLowConfidence = scan.parsed_confidence === "low";

  // For low confidence, all flagged fields must be touched before save
  const pendingFlags = [...flagged].filter((f) => !touched.has(f));
  const canSave = !isLowConfidence || pendingFlags.length === 0;

  function handleChange(key: keyof ParsedScan, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setValues((prev) => ({ ...prev, [key]: num }));
      if (flagged.has(key)) {
        setTouched((prev) => new Set([...prev, key]));
      }
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            Review Your Results
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--secondary)" }}>
            Scan date: {values.scan_date}
          </p>
        </div>
        {isLowConfidence && (
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "rgba(248,81,73,0.15)", color: "var(--danger)" }}
          >
            Review required
          </span>
        )}
        {!isLowConfidence && (
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "rgba(63,185,80,0.15)", color: "var(--accent)" }}
          >
            High confidence
          </span>
        )}
      </div>

      {isLowConfidence && pendingFlags.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(248,81,73,0.08)",
            border: "1px solid rgba(248,81,73,0.25)",
            color: "var(--danger)",
          }}
        >
          Please review the highlighted fields before saving. The parser wasn&apos;t confident about {pendingFlags.length === 1 ? "this value" : "these values"}.
        </div>
      )}

      <div
        className="rounded-2xl divide-y overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--outline-variant)",
          border: "1px solid var(--outline-variant)",
        }}
      >
        {FIELDS.map(({ key, label, unit, step, min, max }) => {
          const isFlagged = flagged.has(key);
          const isTouched = touched.has(key);
          const showWarning = isFlagged && !isTouched;

          return (
            <div
              key={key}
              className="flex items-center justify-between px-5 py-4"
              style={{
                backgroundColor: showWarning ? "rgba(248,81,73,0.05)" : "transparent",
                borderLeft: showWarning ? "3px solid var(--danger)" : "3px solid transparent",
              }}
            >
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: showWarning ? "var(--danger)" : "var(--foreground)" }}
                >
                  {label}
                  {showWarning && (
                    <span className="ml-2 text-xs opacity-70">(please verify)</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={values[key] as number}
                  step={step}
                  min={min}
                  max={max}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-24 text-right rounded-lg px-3 py-1.5 text-sm font-semibold outline-none transition-colors"
                  style={{
                    backgroundColor: "var(--surface-high)",
                    border: showWarning
                      ? "1px solid var(--danger)"
                      : "1px solid var(--outline-variant)",
                    color: "var(--foreground)",
                    fontFamily: "var(--font-body)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                    if (isFlagged) setTouched((prev) => new Set([...prev, key]));
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = showWarning
                      ? "var(--danger)"
                      : "var(--outline-variant)";
                  }}
                />
                <span className="text-xs w-10 text-right" style={{ color: "var(--secondary)" }}>
                  {unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "var(--surface-highest)",
            color: "var(--secondary)",
            fontFamily: "var(--font-body)",
          }}
        >
          Upload different PDF
        </button>
        <button
          onClick={() => onConfirm(values, pdfPath)}
          disabled={!canSave}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--background)",
            fontFamily: "var(--font-body)",
          }}
        >
          {canSave ? "Save scan" : `Review ${pendingFlags.length} flagged field${pendingFlags.length > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------

function SuccessScreen({ scanDate, onNew }: { scanDate: string; onNew: () => void }) {
  const router = useRouter();
  return (
    <div className="max-w-xl mx-auto flex flex-col items-center gap-6 py-16 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(63,185,80,0.15)" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div>
        <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          Scan saved
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--secondary)" }}>
          InBody scan from {scanDate} has been added to your history.
        </p>
      </div>
      <div className="flex gap-3 w-full">
        <button
          onClick={onNew}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            backgroundColor: "var(--surface-highest)",
            color: "var(--secondary)",
            fontFamily: "var(--font-body)",
          }}
        >
          Upload another
        </button>
        <button
          onClick={() => router.push("/")}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--background)",
            fontFamily: "var(--font-body)",
          }}
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function InBodyPage() {
  const [screen, setScreen] = useState<Screen>({ id: "upload" });

  async function handleFile(file: File) {
    setScreen({ id: "parsing" });

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await fetch("/api/inbody/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setScreen({ id: "error", message: json.error ?? "Upload failed" });
        return;
      }

      setScreen({
        id: "review",
        scan: json.data,
        pdfPath: json.pdf_path ?? null,
      });
    } catch {
      setScreen({ id: "error", message: "Network error — please try again" });
    }
  }

  async function handleConfirm(scan: ParsedScan, pdfPath: string | null) {
    setScreen({ id: "saving" });

    try {
      const res = await fetch("/api/inbody/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scan, pdf_path: pdfPath }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setScreen({ id: "error", message: json.error ?? "Save failed" });
        return;
      }

      setScreen({ id: "success", scanDate: scan.scan_date });
    } catch {
      setScreen({ id: "error", message: "Network error — please try again" });
    }
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        {screen.id === "upload" && (
          <UploadScreen onFile={handleFile} />
        )}

        {screen.id === "parsing" && <ParsingScreen />}

        {screen.id === "review" && (
          <ReviewScreen
            scan={screen.scan}
            pdfPath={screen.pdfPath}
            onConfirm={handleConfirm}
            onRetry={() => setScreen({ id: "upload" })}
          />
        )}

        {screen.id === "saving" && (
          <div className="max-w-xl mx-auto flex flex-col items-center gap-6 py-24">
            <div
              className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "var(--surface-highest)", borderTopColor: "var(--primary)" }}
            />
            <p className="text-sm" style={{ color: "var(--secondary)" }}>Saving scan...</p>
          </div>
        )}

        {screen.id === "success" && (
          <SuccessScreen
            scanDate={screen.scanDate}
            onNew={() => setScreen({ id: "upload" })}
          />
        )}

        {screen.id === "error" && (
          <div className="max-w-xl mx-auto space-y-6 py-16 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ backgroundColor: "rgba(248,81,73,0.15)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                Something went wrong
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--secondary)" }}>
                {screen.message}
              </p>
            </div>
            <button
              onClick={() => setScreen({ id: "upload" })}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--background)",
                fontFamily: "var(--font-body)",
              }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
