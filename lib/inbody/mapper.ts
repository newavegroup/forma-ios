import type { InBodyScan } from "../../types/inbody";

/**
 * Each extractor is a pure function: takes the full PDF text, returns the
 * parsed value or undefined if the field could not be found.
 *
 * Patterns are written to be tolerant of whitespace and minor label
 * variations across InBody 570 / 770 / 970 output formats.
 */

// ---------------------------------------------------------------------------
// Individual field extractors
// ---------------------------------------------------------------------------

/**
 * Matches:
 *   "Weight  75.3"
 *   "Weight: 75.3 kg"
 *   "Body Weight  75.3"
 */
export function extractWeight(text: string): number | undefined {
  const match = text.match(
    /(?:Body\s+)?Weight\s*:?\s+(\d{2,3}(?:\.\d)?)\s*(?:kg)?/i
  );
  return match ? parseFloat(match[1]) : undefined;
}

/**
 * Matches:
 *   "Skeletal Muscle Mass  35.5"
 *   "Skeletal Muscle Mass: 35.5 kg"
 *   "SMM  35.5"
 */
export function extractMuscleMass(text: string): number | undefined {
  const match = text.match(
    /(?:Skeletal\s+Muscle\s+Mass|SMM)\s*:?\s+(\d{1,2}(?:\.\d)?)\s*(?:kg)?/i
  );
  return match ? parseFloat(match[1]) : undefined;
}

/**
 * Matches:
 *   "Percent Body Fat  18.5"
 *   "Percent Body Fat: 18.5 %"
 *   "Body Fat Percentage  18.5"
 *   "PBF  18.5"
 */
export function extractBodyFatPercent(text: string): number | undefined {
  const match = text.match(
    /(?:Percent\s+Body\s+Fat|Body\s+Fat\s+Percentage|PBF)\s*:?\s+(\d{1,2}(?:\.\d)?)\s*(?:%)?/i
  );
  return match ? parseFloat(match[1]) : undefined;
}

/**
 * Matches:
 *   "Body Fat Mass  13.8"
 *   "Body Fat Mass: 13.8 kg"
 *   "BFM  13.8"
 *
 * Must not match "Percent Body Fat" or "Body Fat Percentage".
 */
export function extractBodyFatMass(text: string): number | undefined {
  const match = text.match(
    /(?:^|[\r\n\s])(?:Body\s+Fat\s+Mass|BFM)\s*:?\s+(\d{1,3}(?:\.\d)?)\s*(?:kg)?/im
  );
  return match ? parseFloat(match[1]) : undefined;
}

/**
 * Matches:
 *   "Visceral Fat Level  7"
 *   "Visceral Fat Level: 7"
 *   "Visceral Fat  7"
 *   "VFL  7"
 *
 * InBody visceral fat is an integer 1–20.
 */
export function extractVisceralFat(text: string): number | undefined {
  const match = text.match(
    /(?:Visceral\s+Fat(?:\s+Level)?|VFL)\s*:?\s+(\d{1,2})(?:\s|$)/i
  );
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Tries several date formats commonly found in InBody PDFs:
 *   "Test Date: 2024-01-15"
 *   "Date of Test  2024.01.15"
 *   "01/15/2024"   (US format, M/D/Y)
 *   "15.01.2024"   (EU format, D.M.Y)
 *   "2024-01-15"   (ISO — most reliable, try last as a bare match)
 *
 * Returns ISO date string "YYYY-MM-DD" or undefined.
 */
export function extractScanDate(text: string): string | undefined {
  // 1. Labeled ISO: "Test Date: 2024-01-15" or "Date of Test  2024.01.15"
  const labeledIso = text.match(
    /(?:Test\s+Date|Date\s+of\s+Test|Scan\s+Date)\s*[:\s]+(\d{4})[-./](\d{2})[-./](\d{2})/i
  );
  if (labeledIso) {
    return `${labeledIso[1]}-${labeledIso[2]}-${labeledIso[3]}`;
  }

  // 2. Labeled US: "Test Date: 01/15/2024"
  const labeledUs = text.match(
    /(?:Test\s+Date|Date\s+of\s+Test|Scan\s+Date)\s*[:\s]+(\d{1,2})[/](\d{1,2})[/](\d{4})/i
  );
  if (labeledUs) {
    const [, m, d, y] = labeledUs;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // 3. Bare ISO: "2024-01-15" anywhere in document
  const bareIso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (bareIso) {
    return `${bareIso[1]}-${bareIso[2]}-${bareIso[3]}`;
  }

  // 4. Bare US: "01/15/2024"
  const bareUs = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (bareUs) {
    const [, m, d, y] = bareUs;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Numeric / label-less mapper (InBody120, Spanish/localized output)
// ---------------------------------------------------------------------------

/**
 * Handles InBody PDFs where labels are in the graphics layer and text
 * contains only numbers + population reference ranges (e.g. "44.5  36.8~45.0").
 *
 * Classification rules derived from InBody reference range semantics:
 *   - Visceral fat:  integer followed by low range "1~9" or "1~20"
 *   - Weight:        value ≥40 with range_min ≥40  (reference range starts high)
 *   - SMM:           value 10–80 with range_min 30–39 and range_max ≥35
 *   - BFM:           value 2–50 with range_min 5–24 and range_diff ≥3
 *   - BF%:           decimal in 3–60 range appearing right after weight in text
 *   - Date:          DD.MM.YY or DD.MM.YYYY format (common in Spanish/EU output)
 */
export function mapFieldsNumeric(text: string): Partial<InBodyScan> {
  const result: Partial<InBodyScan> = {};

  // 1. Visceral fat — most distinctive: integer + "1~9" or "1~20" range
  const visceralMatch = text.match(/\b(\d{1,2})\s+1~(?:9|20)\b/);
  if (visceralMatch) result.visceral_fat = parseInt(visceralMatch[1], 10);

  // 2. Extract all value+range pairs.
  // Handles both plain "44.5  36.8~45.0" and InBody120's "60.2 ( ) 45.1~61.1" formats.
  const rangePairRe = /(\d+\.?\d*)\s+(?:\(\s*\)\s*)?(\d+\.?\d*)~(\d+\.?\d*)/g;
  let m: RegExpExecArray | null;

  while ((m = rangePairRe.exec(text)) !== null) {
    const value = parseFloat(m[1]);
    const rMin = parseFloat(m[2]);
    const rMax = parseFloat(m[3]);
    const rDiff = rMax - rMin;

    // Skip visceral fat range (already handled)
    if (rMin <= 1 && rMax <= 20) continue;

    // Weight: value ≥40 and reference range starts at ≥40
    if (!result.weight_kg && value >= 40 && value <= 200 && rMin >= 40) {
      result.weight_kg = value;
      continue;
    }

    // SMM: value 10–80, reference range_min 30–39, range_max ≥35
    if (
      !result.muscle_mass_kg &&
      value >= 10 && value <= 80 &&
      rMin >= 30 && rMin < 40 &&
      rMax >= 35
    ) {
      result.muscle_mass_kg = value;
      continue;
    }

    // BFM: value 2–50, reference range_min 5–24, range diff ≥3
    if (
      !result.body_fat_mass_kg &&
      value >= 2 && value <= 50 &&
      rMin >= 5 && rMin < 25 &&
      rDiff >= 3
    ) {
      result.body_fat_mass_kg = value;
      continue;
    }
  }

  // 3. BF%: appears as standalone decimal after weight in the summary triplet
  //    Pattern: weight_value\n BF%_value (3–60 range)
  if (result.weight_kg) {
    const weightStr = result.weight_kg.toFixed(1);
    const afterWeight = new RegExp(
      `${weightStr.replace(".", "\\.")}\\s+([\\d]+\\.[\\d]+)`
    );
    const bfMatch = text.match(afterWeight);
    if (bfMatch) {
      const candidate = parseFloat(bfMatch[1]);
      if (candidate >= 3 && candidate <= 60) result.body_fat_percent = candidate;
    }
  }

  // 4. Date: DD.MM.YYYY. or DD.MM.YY. (trailing dot is InBody convention)
  const dateMatch = text.match(/\b(\d{2})\.(\d{2})\.(\d{2,4})\./);
  if (dateMatch) {
    const [, d, mo, y] = dateMatch;
    const year = y.length === 2 ? `20${y}` : y;
    result.scan_date = `${year}-${mo}-${d}`;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------

/**
 * Maps raw PDF text to a partial InBodyScan.
 *
 * Tries label-based extraction first (InBody 570/770/970, English).
 * If fewer than 3 fields are found, falls back to numeric/range-based
 * extraction (InBody120, Spanish/localized output).
 */
export function mapFields(text: string): Partial<InBodyScan> {
  const labeled: Partial<InBodyScan> = {};

  const weight = extractWeight(text);
  if (weight !== undefined) labeled.weight_kg = weight;

  const muscle = extractMuscleMass(text);
  if (muscle !== undefined) labeled.muscle_mass_kg = muscle;

  const bfPercent = extractBodyFatPercent(text);
  if (bfPercent !== undefined) labeled.body_fat_percent = bfPercent;

  const bfMass = extractBodyFatMass(text);
  if (bfMass !== undefined) labeled.body_fat_mass_kg = bfMass;

  const visceral = extractVisceralFat(text);
  if (visceral !== undefined) labeled.visceral_fat = visceral;

  const date = extractScanDate(text);
  if (date !== undefined) labeled.scan_date = date;

  const labeledCount = Object.keys(labeled).length;

  // If labeled extraction found enough fields, use it
  if (labeledCount >= 3) return labeled;

  // Otherwise try numeric format and merge (labeled wins on conflict)
  const numeric = mapFieldsNumeric(text);
  return { ...numeric, ...labeled };
}
