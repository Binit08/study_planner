import "server-only";
import pdfParse from "pdf-parse";

export const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB
const DEFAULT_MAX_CHARACTERS = 60000;
const DEFAULT_MAX_PAGES = 150;
const DEFAULT_TIMEOUT_MS = 15000;

function hasPdfMagicHeader(buf) {
  const headerSlice = buf.subarray(0, 1024).toString("latin1");
  return headerSlice.includes("%PDF-");
}

function parseWithTimeout(buf, maxPages, timeoutMs) {
  let timer;
  const parsePromise = pdfParse(buf, { max: maxPages });
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const timeoutErr = new Error(
        "PDF parsing timed out. Please upload a smaller or simpler PDF."
      );
      timeoutErr.code = "PDF_TIMEOUT";
      reject(timeoutErr);
    }, timeoutMs);
  });

  return Promise.race([parsePromise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * Extracts and cleans text from a PDF Buffer with magic-byte, page-cap, and timeout guards.
 * @param {Buffer|Uint8Array} buffer - The PDF binary buffer
 * @param {number|object} maxCharactersOrOptions - Character cap or options object
 * @returns {Promise<{ text: string, numpages: number, info: object, isTruncated: boolean }>}
 */
export async function extractTextFromPdf(buffer, maxCharactersOrOptions = DEFAULT_MAX_CHARACTERS) {
  const options =
    typeof maxCharactersOrOptions === "number"
      ? { maxCharacters: maxCharactersOrOptions }
      : maxCharactersOrOptions || {};

  const maxCharacters = options.maxCharacters ?? DEFAULT_MAX_CHARACTERS;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? MAX_PDF_BYTES;

  if (!buffer || buffer.length === 0) {
    const emptyBufErr = new Error("Empty PDF file buffer provided");
    emptyBufErr.code = "INVALID_PDF";
    throw emptyBufErr;
  }

  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  if (buf.byteLength > maxBytes) {
    const sizeErr = new Error(
      "Uploaded PDF exceeds the 15 MB size limit. Please upload a smaller file."
    );
    sizeErr.code = "FILE_TOO_LARGE";
    throw sizeErr;
  }

  if (!hasPdfMagicHeader(buf)) {
    const magicErr = new Error("Uploaded file is not a valid PDF document.");
    magicErr.code = "INVALID_PDF";
    throw magicErr;
  }

  try {
    const data = await parseWithTimeout(buf, maxPages, timeoutMs);
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
      const emptyErr = new Error(
        "No readable text could be extracted from this PDF. The document may be scanned or image-only."
      );
      emptyErr.code = "UNPROCESSABLE_PDF";
      throw emptyErr;
    }

    const hitPageCap = (data.numpages || 0) > maxPages;
    const isTruncated = cleaned.length > maxCharacters || hitPageCap;
    if (cleaned.length > maxCharacters) {
      cleaned = cleaned.slice(0, maxCharacters);
    }

    return {
      text: cleaned,
      numpages: data.numpages || 1,
      info: data.info || {},
      isTruncated,
    };
  } catch (err) {
    if (
      err.code === "UNPROCESSABLE_PDF" ||
      err.code === "INVALID_PDF" ||
      err.code === "FILE_TOO_LARGE" ||
      err.code === "PDF_TIMEOUT"
    ) {
      throw err;
    }
    if (err.name === "PasswordException") {
      const pwErr = new Error(
        "Password-protected PDFs are not supported. Please remove the password and try again."
      );
      pwErr.code = "UNPROCESSABLE_PDF";
      throw pwErr;
    }
    const parseErr = new Error(`Failed to parse PDF document: ${err.message}`);
    parseErr.code = "INVALID_PDF";
    throw parseErr;
  }
}
