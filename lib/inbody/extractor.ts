import { PDFParse } from "pdf-parse";

export interface ExtractionResult {
  text: string;
  pageCount: number;
  extractionMethod: "text" | "vision";
}

// Minimum character count to consider text extraction successful.
// InBody PDFs have hundreds of characters; anything under this is
// likely a scanned image with no embedded text.
const MIN_TEXT_LENGTH = 100;

const INBODY_SENTINEL_TERMS = [
  "Weight",
  "Skeletal Muscle Mass",
  "Body Fat Mass",
  // Numeric/Spanish format (InBody120, etc.) — device name always appears
  "InBody",
];

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

/**
 * Extracts raw text from an InBody PDF buffer.
 *
 * Returns extractionMethod: 'text' when embedded text is found.
 * Returns extractionMethod: 'vision' when the text is too thin —
 * caller is responsible for triggering the vision fallback.
 *
 * Throws ExtractionError if the buffer is not a valid PDF.
 */
export async function extractText(
  pdfBuffer: Buffer
): Promise<ExtractionResult> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new ExtractionError("PDF buffer is empty");
  }

  let text: string;
  let pageCount: number;

  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    text = result.text ?? "";
    pageCount = result.pages?.length ?? 0;
  } catch (err) {
    if (err instanceof ExtractionError) throw err;
    throw new ExtractionError(
      "Failed to parse PDF — file may be corrupt or not a valid PDF"
    );
  }

  const hasEnoughText = text.trim().length >= MIN_TEXT_LENGTH;
  const hasSentinel = INBODY_SENTINEL_TERMS.some((term) => text.includes(term));

  if (!hasEnoughText || !hasSentinel) {
    // Return as vision candidate — caller decides whether to fallback
    return { text, pageCount, extractionMethod: "vision" };
  }

  return { text, pageCount, extractionMethod: "text" };
}
