import { describe, it, expect } from "vitest";
import { extractText, ExtractionError } from "../../lib/inbody/extractor";
import fs from "fs";
import path from "path";

const fixturesDir = path.join(__dirname, "fixtures");

function loadFixture(filename: string): Buffer {
  return fs.readFileSync(path.join(fixturesDir, filename));
}

function hasFixture(filename: string): boolean {
  return fs.existsSync(path.join(fixturesDir, filename));
}

// --- Unit tests (no real PDF needed) ---

describe("extractText — error handling", () => {
  it("throws ExtractionError on empty buffer", async () => {
    await expect(extractText(Buffer.alloc(0))).rejects.toThrow(ExtractionError);
  });

  it("throws ExtractionError on non-PDF buffer", async () => {
    await expect(extractText(Buffer.from("not a pdf"))).rejects.toThrow(
      ExtractionError
    );
  });
});

// --- Integration tests (require real PDF fixtures) ---

describe("extractText — real InBody PDFs", () => {
  const fixtures = ["inbody-570.pdf", "inbody-770.pdf", "inbody-970.pdf"];

  for (const filename of fixtures) {
    it(`extracts text from ${filename}`, async () => {
      if (!hasFixture(filename)) {
        console.warn(`Skipping ${filename} — fixture not present`);
        return;
      }

      const buffer = loadFixture(filename);
      const result = await extractText(buffer);

      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.text.length).toBeGreaterThan(0);
      expect(["text", "vision"]).toContain(result.extractionMethod);

      if (result.extractionMethod === "text") {
        // Text must contain at least one known InBody marker
        // (English labels for 570/770/970, device name for 120/Spanish)
        const hasExpectedTerm = [
          "Weight",
          "Skeletal Muscle Mass",
          "Body Fat Mass",
          "InBody",
        ].some((term) => result.text.includes(term));
        expect(hasExpectedTerm).toBe(true);
      }
    });
  }
});
