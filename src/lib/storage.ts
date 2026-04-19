import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/** Railway volume mount point. Override via PDF_STORAGE_PATH for local dev. */
const STORAGE_ROOT = process.env.PDF_STORAGE_PATH ?? "/data/inbody-pdfs";

/**
 * Save a PDF buffer to the Railway volume.
 * Returns the relative path (userId/scanDate_uuid.pdf) stored in the DB.
 */
export async function savePdf(
  userId: string,
  scanDate: string,
  buffer: Buffer
): Promise<string> {
  const userDir = path.join(STORAGE_ROOT, userId);
  await fs.mkdir(userDir, { recursive: true });

  const filename = `${scanDate}_${randomUUID()}.pdf`;
  const filePath = path.join(userDir, filename);
  await fs.writeFile(filePath, buffer);

  return `${userId}/${filename}`;
}

/**
 * Read a PDF from the Railway volume.
 * filePath is the relative path returned by savePdf.
 */
export async function getPdf(filePath: string): Promise<Buffer> {
  const fullPath = path.join(STORAGE_ROOT, filePath);
  const data = await fs.readFile(fullPath);
  return Buffer.from(data);
}

/** Delete a PDF from the Railway volume. */
export async function deletePdf(filePath: string): Promise<void> {
  const fullPath = path.join(STORAGE_ROOT, filePath);
  await fs.unlink(fullPath);
}
