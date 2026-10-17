import mammoth from "mammoth";
import { extractText } from "unpdf";
import { UserError } from "@/lib/errors";

export interface ParsedDocument {
  fileName: string;
  title: string;
  text: string;
  pages: number;
  characters: number;
}

function titleFromName(fileName: string): string {
  return fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ensureText(text: string): void {
  if (text.replace(/\s/g, "").length < 40) {
    throw new UserError(
      "We could not find readable text in this document. It may be scanned or image-only.",
    );
  }
}

async function parsePdf(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  let text = "";
  let totalPages = 0;
  try {
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    text = result.text;
    totalPages = result.totalPages;
  } catch {
    throw new UserError("We could not read that PDF. It may be corrupted or password-protected.");
  }
  const merged = normalize(text);
  ensureText(merged);
  return {
    fileName,
    title: titleFromName(fileName),
    text: merged,
    pages: Math.max(1, totalPages),
    characters: merged.length,
  };
}

async function parseDocx(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  let value = "";
  try {
    const result = await mammoth.extractRawText({ buffer });
    value = result.value;
  } catch {
    throw new UserError("We could not read that DOCX file. It may be corrupted.");
  }
  const merged = normalize(value);
  ensureText(merged);
  return {
    fileName,
    title: titleFromName(fileName),
    text: merged,
    pages: Math.max(1, Math.ceil(merged.length / 3000)),
    characters: merged.length,
  };
}

export async function parseFile(file: File): Promise<ParsedDocument> {
  if (file.size === 0) throw new UserError("That file is empty. Please choose another document.");
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    throw new UserError("We could not read that file. Please try uploading it again.");
  }
  const name = file.name.toLowerCase();
  const isDocx =
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";

  if (isPdf) return parsePdf(buffer, file.name);
  if (isDocx) return parseDocx(buffer, file.name);
  throw new UserError("Unsupported file type. Upload a PDF or DOCX document.");
}
