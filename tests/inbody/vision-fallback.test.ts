import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  visionExtract,
  VisionFallbackError,
  _setClient,
  _setScreenshotFn,
} from "../../lib/inbody/vision-fallback";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClient(createFn: ReturnType<typeof vi.fn>) {
  return { messages: { create: createFn } } as unknown as Anthropic;
}

function makeClaudeResponse(text: string) {
  return { content: [{ type: "text", text }] };
}

const VALID_JSON_RESPONSE = JSON.stringify({
  scan_date: "2024-03-15",
  weight_kg: 82.3,
  muscle_mass_kg: 38.5,
  body_fat_percent: 17.7,
  body_fat_mass_kg: 14.6,
  visceral_fat: 6,
});

const FAKE_SCREENSHOT = vi.fn().mockResolvedValue("base64fakeimage==");

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mockCreate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockCreate = vi.fn();
  _setClient(makeClient(mockCreate));
  _setScreenshotFn(FAKE_SCREENSHOT);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("visionExtract — happy path", () => {
  it("returns a full InBodyScan when Claude returns valid JSON", async () => {
    mockCreate.mockResolvedValue(makeClaudeResponse(VALID_JSON_RESPONSE));

    const result = await visionExtract(Buffer.from("pdf"));

    expect(result.scan_date).toBe("2024-03-15");
    expect(result.weight_kg).toBeCloseTo(82.3, 1);
    expect(result.muscle_mass_kg).toBeCloseTo(38.5, 1);
    expect(result.body_fat_percent).toBeCloseTo(17.7, 1);
    expect(result.body_fat_mass_kg).toBeCloseTo(14.6, 1);
    expect(result.visceral_fat).toBe(6);
  });

  it("omits null fields from Claude response", async () => {
    const partial = JSON.stringify({
      scan_date: "2024-03-15",
      weight_kg: 82.3,
      muscle_mass_kg: null,
      body_fat_percent: 17.7,
      body_fat_mass_kg: null,
      visceral_fat: 6,
    });
    mockCreate.mockResolvedValue(makeClaudeResponse(partial));

    const result = await visionExtract(Buffer.from("pdf"));

    expect(result.weight_kg).toBeDefined();
    expect(result.muscle_mass_kg).toBeUndefined();
    expect(result.body_fat_mass_kg).toBeUndefined();
  });

  it("passes the base64 screenshot to Claude", async () => {
    mockCreate.mockResolvedValue(makeClaudeResponse(VALID_JSON_RESPONSE));

    await visionExtract(Buffer.from("pdf"));

    const call = mockCreate.mock.calls[0][0];
    const imageBlock = call.messages[0].content[0];
    expect(imageBlock.type).toBe("image");
    expect(imageBlock.source.data).toBe("base64fakeimage==");
  });
});

describe("visionExtract — error handling", () => {
  it("throws VisionFallbackError when screenshot fn throws", async () => {
    _setScreenshotFn(async () => {
      throw new VisionFallbackError("render failed");
    });

    await expect(visionExtract(Buffer.from("pdf"))).rejects.toThrow(
      VisionFallbackError
    );
  });

  it("throws VisionFallbackError when Claude API call fails", async () => {
    mockCreate.mockRejectedValue(new Error("network error"));

    await expect(visionExtract(Buffer.from("pdf"))).rejects.toThrow(
      VisionFallbackError
    );
  });

  it("throws VisionFallbackError when Claude returns non-JSON", async () => {
    mockCreate.mockResolvedValue(makeClaudeResponse("sorry I cannot help"));

    await expect(visionExtract(Buffer.from("pdf"))).rejects.toThrow(
      VisionFallbackError
    );
  });

  it("throws VisionFallbackError when Claude returns non-text content block", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "tool_use", id: "x", name: "x", input: {} }],
    });

    await expect(visionExtract(Buffer.from("pdf"))).rejects.toThrow(
      VisionFallbackError
    );
  });
});
