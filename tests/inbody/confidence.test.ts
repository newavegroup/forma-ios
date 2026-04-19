import { describe, it, expect } from "vitest";
import { scoreConfidence } from "../../lib/inbody/confidence";
import type { InBodyScan } from "../../types/inbody";

const VALID_SCAN: Partial<InBodyScan> = {
  scan_date: "2024-03-15",
  weight_kg: 82.3,
  muscle_mass_kg: 38.5,
  body_fat_percent: 17.7,
  body_fat_mass_kg: 14.6,
  visceral_fat: 6,
};

describe("scoreConfidence — high confidence", () => {
  it("returns high confidence when all 6 fields are present and in range", () => {
    const result = scoreConfidence(VALID_SCAN);
    expect(result.success).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.flagged_fields).toBeUndefined();
  });
});

describe("scoreConfidence — low confidence (missing fields)", () => {
  it("returns low when 1 field is missing", () => {
    const scan = { ...VALID_SCAN, visceral_fat: undefined };
    const result = scoreConfidence(scan);
    expect(result.success).toBe(true);
    expect(result.confidence).toBe("low");
    expect(result.flagged_fields).toContain("visceral_fat");
  });

  it("returns low when 2 fields are missing", () => {
    const scan = { ...VALID_SCAN, visceral_fat: undefined, scan_date: undefined };
    const result = scoreConfidence(scan);
    expect(result.success).toBe(true);
    expect(result.confidence).toBe("low");
    expect(result.flagged_fields).toHaveLength(2);
  });
});

describe("scoreConfidence — failure (3+ fields missing)", () => {
  it("returns success: false when 3 fields are missing", () => {
    const scan = {
      ...VALID_SCAN,
      visceral_fat: undefined,
      scan_date: undefined,
      muscle_mass_kg: undefined,
    };
    const result = scoreConfidence(scan);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.confidence).toBeUndefined();
  });

  it("returns success: false for completely empty scan", () => {
    const result = scoreConfidence({});
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/re-upload/i);
  });
});

describe("scoreConfidence — low confidence (out of range)", () => {
  it("flags weight below minimum (40kg)", () => {
    const scan = { ...VALID_SCAN, weight_kg: 35 };
    const result = scoreConfidence(scan);
    expect(result.success).toBe(true);
    expect(result.confidence).toBe("low");
    expect(result.flagged_fields).toContain("weight_kg");
  });

  it("flags weight above maximum (200kg)", () => {
    const scan = { ...VALID_SCAN, weight_kg: 210 };
    const result = scoreConfidence(scan);
    expect(result.confidence).toBe("low");
    expect(result.flagged_fields).toContain("weight_kg");
  });

  it("flags body fat percent below minimum (3%)", () => {
    const scan = { ...VALID_SCAN, body_fat_percent: 1.5 };
    const result = scoreConfidence(scan);
    expect(result.confidence).toBe("low");
    expect(result.flagged_fields).toContain("body_fat_percent");
  });

  it("flags visceral fat above maximum (20)", () => {
    const scan = { ...VALID_SCAN, visceral_fat: 25 };
    const result = scoreConfidence(scan);
    expect(result.confidence).toBe("low");
    expect(result.flagged_fields).toContain("visceral_fat");
  });

  it("flags multiple out-of-range fields", () => {
    const scan = { ...VALID_SCAN, weight_kg: 300, muscle_mass_kg: 5 };
    const result = scoreConfidence(scan);
    expect(result.confidence).toBe("low");
    expect(result.flagged_fields).toContain("weight_kg");
    expect(result.flagged_fields).toContain("muscle_mass_kg");
  });

  it("includes both missing and out-of-range in flagged_fields", () => {
    const scan = { ...VALID_SCAN, visceral_fat: undefined, weight_kg: 210 };
    const result = scoreConfidence(scan);
    expect(result.confidence).toBe("low");
    expect(result.flagged_fields).toContain("visceral_fat");
    expect(result.flagged_fields).toContain("weight_kg");
  });
});

describe("scoreConfidence — boundary values", () => {
  it("accepts weight exactly at minimum boundary (40kg)", () => {
    const result = scoreConfidence({ ...VALID_SCAN, weight_kg: 40 });
    expect(result.confidence).toBe("high");
  });

  it("accepts weight exactly at maximum boundary (200kg)", () => {
    const result = scoreConfidence({ ...VALID_SCAN, weight_kg: 200 });
    expect(result.confidence).toBe("high");
  });

  it("accepts visceral fat at boundary values (1 and 20)", () => {
    expect(scoreConfidence({ ...VALID_SCAN, visceral_fat: 1 }).confidence).toBe("high");
    expect(scoreConfidence({ ...VALID_SCAN, visceral_fat: 20 }).confidence).toBe("high");
  });
});
