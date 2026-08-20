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
