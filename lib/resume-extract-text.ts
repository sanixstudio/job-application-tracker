import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

const PDF_TYPE = "application/pdf";
const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Extracts plain text from a resume file (PDF or DOCX).
 * @param buffer - File buffer (Buffer or Uint8Array)
 * @param mimeType - MIME type: application/pdf or application/vnd.openxmlformats-officedocument.wordprocessingml.document
 * @returns Extracted text
 */
export async function extractTextFromResumeFile(
  buffer: Buffer | Uint8Array,
  mimeType: string
): Promise<string> {
  const normalizedType = mimeType.toLowerCase().split(";")[0].trim();
  if (normalizedType === PDF_TYPE) {
    return extractTextFromPdf(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
  }
  if (normalizedType === DOCX_TYPE) {
    return extractTextFromDocx(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
  }
  throw new Error(
    `Unsupported file type: ${mimeType}. Use PDF or DOCX.`
  );
}

/** Extract text from PDF using unpdf (serverless-friendly, no worker). */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return (text ?? "").trim();
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() ?? "";
}

export function isSupportedResumeMimeType(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase().split(";")[0].trim();
  return normalized === PDF_TYPE || normalized === DOCX_TYPE;
}
