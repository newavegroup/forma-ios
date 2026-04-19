/**
 * Step 1.7 — Eval set
 *
 * Tests parse() against real InBody PDFs with hand-verified ground truth.
 * Fixtures are gitignored and must be present locally to run.
 *
 * Ground truth values are verified directly from the PDF printout.
 * Tolerance: ±0.5 for numeric fields (per build plan acceptance criterion).
 */

import { describe, it, expect } from "vitest";
import { parse } from "../../lib/inbody/parser";
import fs from "fs";
import path from "path";

const fixturesDir = path.join(__dirname, "fixtures");

function loadFixture(filename: string): Buffer {
  return fs.readFileSync(path.join(fixturesDir, filename));
}

function hasFixture(filename: string): boolean {
  return fs.existsSync(path.join(fixturesDir, filename));
}

// ---------------------------------------------------------------------------
// InBody120 — Garcia Arellano Jaime — 22 Nov 2025
// Hand-verified from PDF printout
// ---------------------------------------------------------------------------

describe("Eval: InBody120 Spanish — 2025-11-22", () => {
  const FIXTURE = "inbody-570.pdf"; // stored as inbody-570 per fixture naming
  const GROUND_TRUTH = {
    scan_date: "2025-11-22",
    weight_kg: 60.2,
    muscle_mass_kg: 44.5,
    body_fat_percent: 24.7,
    body_fat_mass_kg: 15.7,
    visceral_fat: 6,
  };

  it("returns success: true", async () => {
    if (!hasFixture(FIXTURE)) return;
    const result = await parse(loadFixture(FIXTURE));
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("extracts scan_date correctly", async () => {
    if (!hasFixture(FIXTURE)) return;
    const result = await parse(loadFixture(FIXTURE));
    expect(result.data?.scan_date).toBe(GROUND_TRUTH.scan_date);
  });

  it("extracts weight_kg within ±0.5", async () => {
    if (!hasFixture(FIXTURE)) return;
    const result = await parse(loadFixture(FIXTURE));
    expect(result.data?.weight_kg).toBeCloseTo(GROUND_TRUTH.weight_kg, 0);
  });

  it("extracts muscle_mass_kg within ±0.5", async () => {
    if (!hasFixture(FIXTURE)) return;
    const result = await parse(loadFixture(FIXTURE));
    expect(result.data?.muscle_mass_kg).toBeCloseTo(GROUND_TRUTH.muscle_mass_kg, 0);
  });

  it("extracts body_fat_percent within ±0.5", async () => {
    if (!hasFixture(FIXTURE)) return;
    const result = await parse(loadFixture(FIXTURE));
    expect(result.data?.body_fat_percent).toBeCloseTo(GROUND_TRUTH.body_fat_percent, 0);
  });

  it("extracts body_fat_mass_kg within ±0.5", async () => {
    if (!hasFixture(FIXTURE)) return;
    const result = await parse(loadFixture(FIXTURE));
    expect(result.data?.body_fat_mass_kg).toBeCloseTo(GROUND_TRUTH.body_fat_mass_kg, 0);
  });

  it("extracts visceral_fat correctly", async () => {
    if (!hasFixture(FIXTURE)) return;
    const result = await parse(loadFixture(FIXTURE));
    expect(result.data?.visceral_fat).toBe(GROUND_TRUTH.visceral_fat);
  });

  it("confidence is high (all fields in range)", async () => {
    if (!hasFixture(FIXTURE)) return;
    const result = await parse(loadFixture(FIXTURE));
    expect(result.data?.parsed_confidence).toBe("high");
    expect(result.data?.flagged_fields).toBeUndefined();
  });
});
