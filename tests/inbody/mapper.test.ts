import { describe, it, expect } from "vitest";
import {
  extractWeight,
  extractMuscleMass,
  extractBodyFatPercent,
  extractBodyFatMass,
  extractVisceralFat,
  extractScanDate,
  mapFields,
} from "../../lib/inbody/mapper";

// ---------------------------------------------------------------------------
// Synthetic InBody text samples modelled after real PDF output
// ---------------------------------------------------------------------------

const SAMPLE_570 = `
InBody570 Result Sheet
Test Date: 2024-03-15

Body Composition Analysis
Weight  82.3 kg
Skeletal Muscle Mass  38.5 kg
Body Fat Mass  14.6 kg

Obesity Analysis
BMI  24.1
Percent Body Fat  17.7 %

Visceral Fat Level  6
`;

const SAMPLE_770 = `
InBody770 Result Sheet
Date of Test  01/22/2024

Weight: 91.0 kg
SMM: 42.1 kg
BFM: 18.2 kg
PBF: 20.0 %
Visceral Fat Level: 9
`;

const SAMPLE_970 = `
InBody970 Result Sheet
Scan Date: 2023.11.05

Body Weight  68.5 kg
Skeletal Muscle Mass  31.2 kg
Body Fat Mass  12.8 kg
Percent Body Fat  18.7 %
Visceral Fat  4
`;

// ---------------------------------------------------------------------------
// extractWeight
// ---------------------------------------------------------------------------

describe("extractWeight", () => {
  it("parses 'Weight  82.3 kg'", () => {
    expect(extractWeight(SAMPLE_570)).toBeCloseTo(82.3, 1);
  });

  it("parses 'Weight: 91.0 kg'", () => {
    expect(extractWeight(SAMPLE_770)).toBeCloseTo(91.0, 1);
  });

  it("parses 'Body Weight  68.5 kg'", () => {
    expect(extractWeight(SAMPLE_970)).toBeCloseTo(68.5, 1);
  });

  it("returns undefined when not found", () => {
    expect(extractWeight("no data here")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractMuscleMass
// ---------------------------------------------------------------------------

describe("extractMuscleMass", () => {
  it("parses 'Skeletal Muscle Mass  38.5 kg'", () => {
    expect(extractMuscleMass(SAMPLE_570)).toBeCloseTo(38.5, 1);
  });

  it("parses 'SMM: 42.1 kg'", () => {
    expect(extractMuscleMass(SAMPLE_770)).toBeCloseTo(42.1, 1);
  });

  it("parses 'Skeletal Muscle Mass  31.2 kg'", () => {
    expect(extractMuscleMass(SAMPLE_970)).toBeCloseTo(31.2, 1);
  });

  it("returns undefined when not found", () => {
    expect(extractMuscleMass("no data here")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractBodyFatPercent
// ---------------------------------------------------------------------------

describe("extractBodyFatPercent", () => {
  it("parses 'Percent Body Fat  17.7 %'", () => {
    expect(extractBodyFatPercent(SAMPLE_570)).toBeCloseTo(17.7, 1);
  });

  it("parses 'PBF: 20.0 %'", () => {
    expect(extractBodyFatPercent(SAMPLE_770)).toBeCloseTo(20.0, 1);
  });

  it("parses 'Percent Body Fat  18.7 %'", () => {
    expect(extractBodyFatPercent(SAMPLE_970)).toBeCloseTo(18.7, 1);
  });

  it("returns undefined when not found", () => {
    expect(extractBodyFatPercent("no data here")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractBodyFatMass
// ---------------------------------------------------------------------------

describe("extractBodyFatMass", () => {
  it("parses 'Body Fat Mass  14.6 kg'", () => {
    expect(extractBodyFatMass(SAMPLE_570)).toBeCloseTo(14.6, 1);
  });

  it("parses 'BFM: 18.2 kg'", () => {
    expect(extractBodyFatMass(SAMPLE_770)).toBeCloseTo(18.2, 1);
  });

  it("parses 'Body Fat Mass  12.8 kg'", () => {
    expect(extractBodyFatMass(SAMPLE_970)).toBeCloseTo(12.8, 1);
  });

  it("does not confuse Body Fat Mass with Percent Body Fat line", () => {
    const text = "Percent Body Fat  22.0 %\nBody Fat Mass  15.0 kg";
    expect(extractBodyFatMass(text)).toBeCloseTo(15.0, 1);
  });

  it("returns undefined when not found", () => {
    expect(extractBodyFatMass("no data here")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractVisceralFat
// ---------------------------------------------------------------------------

describe("extractVisceralFat", () => {
  it("parses 'Visceral Fat Level  6'", () => {
    expect(extractVisceralFat(SAMPLE_570)).toBe(6);
  });

  it("parses 'Visceral Fat Level: 9'", () => {
    expect(extractVisceralFat(SAMPLE_770)).toBe(9);
  });

  it("parses 'Visceral Fat  4'", () => {
    expect(extractVisceralFat(SAMPLE_970)).toBe(4);
  });

  it("returns undefined when not found", () => {
    expect(extractVisceralFat("no data here")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractScanDate
// ---------------------------------------------------------------------------

describe("extractScanDate", () => {
  it("parses labeled ISO 'Test Date: 2024-03-15'", () => {
    expect(extractScanDate(SAMPLE_570)).toBe("2024-03-15");
  });

  it("parses labeled US 'Date of Test  01/22/2024'", () => {
    expect(extractScanDate(SAMPLE_770)).toBe("2024-01-22");
  });

  it("parses labeled dot-separated 'Scan Date: 2023.11.05'", () => {
    expect(extractScanDate(SAMPLE_970)).toBe("2023-11-05");
  });

  it("parses bare ISO date as fallback", () => {
    expect(extractScanDate("some text 2024-06-01 more text")).toBe("2024-06-01");
  });

  it("returns undefined when no date found", () => {
    expect(extractScanDate("no date here")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// mapFields — integration
// ---------------------------------------------------------------------------

describe("mapFields", () => {
  it("extracts all 6 fields from sample 570 text", () => {
    const result = mapFields(SAMPLE_570);
    expect(result.weight_kg).toBeCloseTo(82.3, 1);
    expect(result.muscle_mass_kg).toBeCloseTo(38.5, 1);
    expect(result.body_fat_percent).toBeCloseTo(17.7, 1);
    expect(result.body_fat_mass_kg).toBeCloseTo(14.6, 1);
    expect(result.visceral_fat).toBe(6);
    expect(result.scan_date).toBe("2024-03-15");
  });

  it("extracts all 6 fields from sample 770 text (abbreviated labels)", () => {
    const result = mapFields(SAMPLE_770);
    expect(result.weight_kg).toBeCloseTo(91.0, 1);
    expect(result.muscle_mass_kg).toBeCloseTo(42.1, 1);
    expect(result.body_fat_percent).toBeCloseTo(20.0, 1);
    expect(result.body_fat_mass_kg).toBeCloseTo(18.2, 1);
    expect(result.visceral_fat).toBe(9);
    expect(result.scan_date).toBe("2024-01-22");
  });

  it("extracts all 6 fields from sample 970 text", () => {
    const result = mapFields(SAMPLE_970);
    expect(result.weight_kg).toBeCloseTo(68.5, 1);
    expect(result.muscle_mass_kg).toBeCloseTo(31.2, 1);
    expect(result.body_fat_percent).toBeCloseTo(18.7, 1);
    expect(result.body_fat_mass_kg).toBeCloseTo(12.8, 1);
    expect(result.visceral_fat).toBe(4);
    expect(result.scan_date).toBe("2023-11-05");
  });

  it("returns empty object for unrecognized text", () => {
    expect(mapFields("random text with no InBody data")).toEqual({});
  });
});
