import { PDFParse } from "pdf-parse";
import Anthropic from "@anthropic-ai/sdk";
import type { InBodyScan } from "../../types/inbody";

let _client: Anthropic | undefined;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

/** Inject a client — used in tests only. */
export function _setClient(c: Anthropic): void {
  _client = c;
}

type ScreenshotFn = (buf: Buffer) => Promise<string>;
let _screenshotFn: ScreenshotFn | undefined;

function getScreenshotFn(): ScreenshotFn {
  if (_screenshotFn) return _screenshotFn;
  return pdfFirstPageToBase64Default;
}

/** Inject a screenshot function — used in tests only. */
export function _setScreenshotFn(fn: ScreenshotFn): void {
  _screenshotFn = fn;
}

const EXTRACTION_PROMPT = `You are analyzing an InBody body composition scan result sheet.

Extract the following fields from the image. Return ONLY a valid JSON object with exactly these keys — no explanation, no markdown, no code fences:

{
  "scan_date": "YYYY-MM-DD",
  "weight_kg": <number>,
  "muscle_mass_kg": <number>,
  "body_fat_percent": <number>,
  "body_fat_mass_kg": <number>,
  "visceral_fat": <integer 1-20>
}

Field mapping guidance:
- scan_date: the test date on the report
- weight_kg: total body weight in kg
- muscle_mass_kg: Skeletal Muscle Mass (SMM) in kg
- body_fat_percent: Percent Body Fat (PBF) as a number (e.g. 18.5, not 0.185)
- body_fat_mass_kg: Body Fat Mass (BFM) in kg
- visceral_fat: Visceral Fat Level (integer score 1–20, not a percentage)

If a field is genuinely not visible in the image, use null for that value.`;

export class VisionFallbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisionFallbackError";
  }
}

/**
 * Converts the first page of a PDF buffer to a PNG base64 string
 * using pdf-parse v2's built-in screenshot renderer.
 */
async function pdfFirstPageToBase64Default(pdfBuffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getScreenshot({ first: 1, scale: 2 });

  if (!result.pages || result.pages.length === 0) {
    throw new VisionFallbackError("Could not render PDF page to image");
  }

  const page = result.pages[0];
  const imageBuffer = Buffer.from(page.data);
  return imageBuffer.toString("base64");
}

/**
 * Parses an InBody PDF that could not be text-extracted by sending the
 * first page as an image to Claude's vision API.
 *
 * Returns a Partial<InBodyScan> — fields Claude could not read are omitted.
 * Throws VisionFallbackError if the API call or image rendering fails.
 */
export async function visionExtract(
  pdfBuffer: Buffer
): Promise<Partial<InBodyScan>> {
  const base64Image = await getScreenshotFn()(pdfBuffer);

  let responseText: string;
  try {
    const message = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new VisionFallbackError("Unexpected response type from Claude");
    }
    responseText = block.text
      .trim()
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();
  } catch (err) {
    if (err instanceof VisionFallbackError) throw err;
    throw new VisionFallbackError(
      `Claude vision API call failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new VisionFallbackError(
      `Claude returned non-JSON response: ${responseText.slice(0, 200)}`
    );
  }

  const scan: Partial<InBodyScan> = {};

  if (typeof parsed.scan_date === "string") scan.scan_date = parsed.scan_date;
  if (typeof parsed.weight_kg === "number") scan.weight_kg = parsed.weight_kg;
  if (typeof parsed.muscle_mass_kg === "number")
    scan.muscle_mass_kg = parsed.muscle_mass_kg;
  if (typeof parsed.body_fat_percent === "number")
    scan.body_fat_percent = parsed.body_fat_percent;
  if (typeof parsed.body_fat_mass_kg === "number")
    scan.body_fat_mass_kg = parsed.body_fat_mass_kg;
  if (typeof parsed.visceral_fat === "number")
    scan.visceral_fat = parsed.visceral_fat;

  return scan;
}
