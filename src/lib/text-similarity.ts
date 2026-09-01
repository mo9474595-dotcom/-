// Lightweight, dependency-free text similarity for suggesting a grade on a
// SHORT_ANSWER response against the teacher's model answer. Word-level
// Jaccard similarity (intersection / union of the two word sets) rather
// than character edit-distance, since short-answer credit is usually about
// which key words/concepts are present, not exact phrasing or word order.
function normalizeArabicText(s: string): string {
  return s
    .replace(/[ً-ْٰـ]/g, "") // diacritics (tashkeel) + tatweel
    .replace(/[إأآا]/g, "ا") // إ أ آ ا -> ا
    .replace(/ى/g, "ي") // ى -> ي
    .replace(/ة/g, "ه") // ة -> ه
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Returns a similarity score from 0 (nothing in common) to 1 (identical
// word sets after normalization).
export function textSimilarity(a: string, b: string): number {
  const na = normalizeArabicText(a);
  const nb = normalizeArabicText(b);
  if (!na || !nb) return 0;

  const setA = new Set(na.split(" "));
  const setB = new Set(nb.split(" "));
  const intersectionSize = [...setA].filter((w) => setB.has(w)).length;
  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}
