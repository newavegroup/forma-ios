import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parse } from "../../lib/inbody/parser";

// ---------------------------------------------------------------------------
// Mock dependencies so parser unit tests don't touch real PDFs or Claude
// ---------------------------------------------------------------------------

vi.mock("../../lib/inbody/extractor", () => ({
  extractText: vi.fn(),
  ExtractionError: class ExtractionError extends Error {
    constructor(msg: string) { super(msg); this.name = "ExtractionError"; }
  },
}));

vi.mock("../../lib/inbody/vision-fallback", () => ({
  visionExtract: vi.fn(),
  VisionFallbackError: class VisionFallbackError extends Error {
    constructor(msg: string) { super(msg); this.name = "VisionFallbackError"; }
  },
  _setClient: vi.fn(),
  _setScreenshotFn: vi.fn(),
}));

const { extractText } = await import("../../lib/inbody/extractor");
const { visionExtract } = await import("../../lib/inbody/vision-fallback");

const mockExtractText = extractText as ReturnType<typeof vi.fn>;
const mockVisionExtract = visionExtract as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEXT_WITH_ALL_FIELDS = `
InBody570 Result Sheet
Test Date: 2024-03-15
Weight  82.3 kg
Skeletal Muscle Mass  38.5 kg
Body Fat Mass  14.6 kg
Percent Body Fat  17.7 %
Visceral Fat Level  6
`;

const TEXT_EXTRACTION_RESULT = {
  text: TEXT_WITH_ALL_FIELDS,
  pageCount: 1,
  extractionMethod: "text" as const,
};

const VISION_EXTRACTION_RESULT = {
  text: "",
  pageCount: 1,
  extractionMethod: "vision" as const,
};

const FULL_VISION_FIELDS = {
  scan_date: "2024-03-15",
  weight_kg: 82.3,
  muscle_mass_kg: 38.5,
  body_fat_percent: 17.7,
  body_fat_mass_kg: 14.6,
  visceral_fat: 6,
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------

describe("parse — text extraction path", () => {
  it("returns success:true with high confidence for a complete text PDF", async () => {
    mockExtractText.mockResolvedValue(TEXT_EXTRACTION_RESULT);

    const result = await parse(Buffer.from("pdf"));

    expect(result.success).toBe(true);
    expect(result.data?.parsed_confidence).toBe("high");
    expect(result.data?.weight_kg).toBeCloseTo(82.3, 1);
    expect(result.data?.scan_date).toBe("2024-03-15");
    expect(result.data?.visceral_fat).toBe(6);
    expect(result.raw_text).toContain("InBody570");
  });

  it("stores raw_text in the result", async () => {
    mockExtractText.mockResolvedValue(TEXT_EXTRACTION_RESULT);
    const result = await parse(Buffer.from("pdf"));
    expect(result.raw_text).toBe(TEXT_WITH_ALL_FIELDS);
  });
});

describe("parse — vision fallback path", () => {
  it("uses vision fields when extraction method is 'vision'", async () => {
    mockExtractText.mockResolvedValue(VISION_EXTRACTION_RESULT);
    mockVisionExtract.mockResolvedValue(FULL_VISION_FIELDS);

    const result = await parse(Buffer.from("pdf"));

    expect(result.success).toBe(true);
    expect(result.data?.weight_kg).toBeCloseTo(82.3, 1);
    expect(result.data?.parsed_confidence).toBe("high");
    expect(visionExtract).toHaveBeenCalledOnce();
  });

  it("does not call visionExtract when text extraction succeeded", async () => {
    mockExtractText.mockResolvedValue(TEXT_EXTRACTION_RESULT);

    await parse(Buffer.from("pdf"));

    expect(visionExtract).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Confidence paths
// ---------------------------------------------------------------------------

describe("parse — confidence scoring", () => {
  it("returns low confidence when a field is missing from text", async () => {
    const partialText = `
Test Date: 2024-03-15
Weight  82.3 kg
Skeletal Muscle Mass  38.5 kg
Body Fat Mass  14.6 kg
Percent Body Fat  17.7 %
`; // visceral_fat missing
    mockExtractText.mockResolvedValue({
      text: partialText,
      pageCount: 1,
      extractionMethod: "text" as const,
    });

    const result = await parse(Buffer.from("pdf"));

    expect(result.success).toBe(true);
    expect(result.data?.parsed_confidence).toBe("low");
    expect(result.data?.flagged_fields).toContain("visceral_fat");
  });

  it("returns success:false when 3+ fields are missing", async () => {
    mockExtractText.mockResolvedValue({
      text: "Weight  82.3 kg", // only 1 field
      pageCount: 1,
      extractionMethod: "text" as const,
    });

    const result = await parse(Buffer.from("pdf"));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/re-upload/i);
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------

describe("parse — error handling", () => {
  it("returns success:false when extractText throws ExtractionError", async () => {
    const { ExtractionError } = await import("../../lib/inbody/extractor");
    mockExtractText.mockRejectedValue(new ExtractionError("corrupt PDF"));

    const result = await parse(Buffer.from("bad"));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/corrupt PDF/i);
  });

  it("returns success:false when extractText throws unexpected error", async () => {
    mockExtractText.mockRejectedValue(new Error("something random"));

    const result = await parse(Buffer.from("bad"));

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns success:false when vision fallback throws", async () => {
    const { VisionFallbackError } = await import("../../lib/inbody/vision-fallback");
    mockExtractText.mockResolvedValue(VISION_EXTRACTION_RESULT);
    mockVisionExtract.mockRejectedValue(
      new VisionFallbackError("render failed")
    );

    const result = await parse(Buffer.from("pdf"));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/render failed/i);
  });
});
