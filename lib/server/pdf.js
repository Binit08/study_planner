import "server-only";
import pdfParse from "pdf-parse";

/**
 * Extracts and cleans text from a PDF Buffer
 * @param {Buffer|Uint8Array} buffer - The PDF binary buffer
 * @param {number} maxCharacters - Optional character cap (default 60,000)
 * @returns {Promise<{ text: string, numpages: number, info: object }>}
 */
export async function extractTextFromPdf(buffer, maxCharacters = 60000) {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty PDF file buffer provided");
  }

  try {
    const data = await pdfParse(Buffer.from(buffer));
    const rawText = data.text || "";

    // Clean up text: normalize carriage returns, excessive line breaks, and whitespace
    let cleaned = rawText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[ \u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!cleaned) {
      throw new Error(
        "No readable text could be extracted from this PDF. The document may be scanned or image-only."
      );
    }

    if (cleaned.length > maxCharacters) {
      cleaned = cleaned.slice(0, maxCharacters);
    }

    return {
      text: cleaned,
      numpages: data.numpages || 1,
      info: data.info || {},
      isTruncated: (data.text || "").length > maxCharacters,
    };
  } catch (err) {
    if (err.message && err.message.includes("No readable text")) {
      throw err;
    }
    if (err.name === "PasswordException") {
      throw new Error("Password-protected PDFs are not supported. Please remove the password and try again.");
    }
    throw new Error(`Failed to parse PDF document: ${err.message}`);
  }
}
