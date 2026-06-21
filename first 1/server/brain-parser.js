import fs from 'fs';
import path from 'path';

const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 60;

function chunkText(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length);
    const chunk = words.slice(start, end).join(' ').trim();
    if (chunk.length > 20) {
      chunks.push({ content: chunk });
    }
    if (end >= words.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

function cleanText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export async function parseTxt(buffer) {
  return cleanText(buffer.toString('utf-8'));
}

export async function parsePdf(buffer) {
  try {
    const mod = await import('pdf-parse');
    const pdfParse = mod.default || mod;
    const data = await pdfParse(buffer);
    return cleanText(data.text);
  } catch (e) {
    throw new Error(`PDF parse failed: ${e.message}`);
  }
}

export async function parseDocx(buffer) {
  try {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value);
  } catch (e) {
    throw new Error(`DOCX parse failed: ${e.message}`);
  }
}

export async function parseFile(buffer, mimetype, originalname) {
  const ext = path.extname(originalname).toLowerCase();
  if (ext === '.pdf' || mimetype === 'application/pdf') {
    return parsePdf(buffer);
  }
  if (ext === '.docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDocx(buffer);
  }
  if (ext === '.txt' || ext === '.md' || mimetype === 'text/plain' || mimetype === 'text/markdown') {
    return parseTxt(buffer);
  }
  throw new Error(`Unsupported file type: ${ext || mimetype}`);
}

export function splitIntoChunks(text) {
  return chunkText(text);
}
