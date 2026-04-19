import { extractText, ExtractionError } from "./extractor";
import { mapFields } from "./mapper";
import { scoreConfidence } from "./confidence";
import { visionExtract, VisionFallbackError } from "./vision-fallback";
import type { ParseResult, InBodyScan } from "../../types/inbody";

/**
 * Main entry point for InBody PDF parsing.
 *
 * Pipeline:
 *   1. Extract text from the PDF buffer
 *   2. If text is thin/missing, try Claude vision fallback
 *   3. Map raw text → structured fields
 *   4. Score confidence + validate physiological ranges
 *   5. Return ParseResult
 *
 * Never throws — all errors are returned as { success: false }.
 */
export async function parse(pdfBuffer: Buffer): Promise<ParseResult> {
  // --- Step 1: text extraction ---
  let rawText = "";
  let usedVision = false;
  let visionFields: Partial<InBodyScan> | undefined;

  try {
    const extraction = await extractText(pdfBuffer);
    rawText = extraction.text;

    // --- Step 2: vision fallback if text extraction was insufficient ---
    if (extraction.extractionMethod === "vision") {
      usedVision = true;
      try {
        visionFields = await visionExtract(pdfBuffer);
      } catch (err) {
        const message =
          err instanceof VisionFallbackError
            ? err.message
            : "Vision fallback failed unexpectedly";
        return { success: false, error: message, raw_text: rawText };
      }
    }
  } catch (err) {
    const message =
      err instanceof ExtractionError
        ? err.message
        : "Failed to read PDF — file may be corrupt";
    return { success: false, error: message };
  }

  // --- Step 3: map text → fields (or use vision fields directly) ---
  const mappedFields = usedVision
    ? (visionFields ?? {})
    : mapFields(rawText);

  // --- Step 4: score confidence ---
  const confidence = scoreConfidence(mappedFields);

  if (!confidence.success) {
    return {
      success: false,
      error: confidence.error,
      raw_text: rawText,
    };
  }

  const scan: InBodyScan = {
    scan_date: mappedFields.scan_date ?? "",
    weight_kg: mappedFields.weight_kg ?? 0,
    muscle_mass_kg: mappedFields.muscle_mass_kg ?? 0,
    body_fat_percent: mappedFields.body_fat_percent ?? 0,
    body_fat_mass_kg: mappedFields.body_fat_mass_kg ?? 0,
    visceral_fat: mappedFields.visceral_fat ?? 0,
    parsed_confidence: confidence.confidence!,
    flagged_fields: confidence.flagged_fields,
  };

  return {
    success: true,
    data: scan,
    raw_text: rawText,
  };
}
