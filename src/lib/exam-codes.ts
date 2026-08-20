import { randomInt } from "crypto";

// Human-friendly codes: avoid ambiguous characters (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateExamCode(segments = 3, segmentLength = 4): string {
  const parts: string[] = [];
  for (let s = 0; s < segments; s++) {
    let part = "";
    for (let i = 0; i < segmentLength; i++) {
      part += ALPHABET[randomInt(0, ALPHABET.length)];
    }
    parts.push(part);
  }
  return parts.join("-");
}

/** A single short segment — used for short-lived attendance check-in codes. */
export function generateShortCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}
