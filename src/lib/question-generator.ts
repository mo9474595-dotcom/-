export type DraftQuestion = {
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER";
  text: string;
  points: number;
  correctAnswer: string;
  imageUrl: string;
  choices: { text: string; isCorrect: boolean }[];
};

// Common Arabic function words — never picked as "the significant term" to
// blank out, since blanking one of these produces a meaningless question.
const STOPWORDS = new Set([
  "في", "من", "إلى", "على", "عن", "مع", "هذا", "هذه", "ذلك", "تلك", "التي", "الذي",
  "الذين", "كان", "كانت", "تكون", "يكون", "أن", "إن", "لا", "لم", "لن", "قد", "كل",
  "بعض", "كما", "حيث", "بين", "عند", "حتى", "أو", "ثم", "لكن", "وهو", "وهي", "كذلك",
  "أيضا", "أيضاً", "فإن", "وقد", "وهذا", "وهذه", "كل", "غير", "دون", "بعد", "قبل",
  "the", "and", "or", "of", "in", "on", "to", "a", "an", "is", "are", "was", "were",
]);

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!؟?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15 && s.length <= 220);
}

function tokenize(sentence: string): string[] {
  return sentence
    .split(/[\s،,؛;:"'«»()]+/)
    .map((w) => w.replace(/^[.!؟?]+|[.!؟?]+$/g, ""))
    .filter(Boolean);
}

// Picks the single word most worth turning into a blank: prefer a number
// (dates, quantities are natural quiz facts), otherwise the longest word
// that isn't a stopword and appears just once in the sentence (so blanking
// it doesn't leave an obvious duplicate elsewhere in the same line).
function pickSignificantTerm(sentence: string): string | null {
  const tokens = tokenize(sentence);
  const numeric = tokens.find((t) => /\d/.test(t) && t.length >= 2);
  if (numeric) return numeric;

  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);

  const candidates = tokens
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t) && counts.get(t) === 1)
    .sort((a, b) => b.length - a.length);
  return candidates[0] ?? null;
}

function blank(sentence: string, term: string): string {
  const idx = sentence.indexOf(term);
  if (idx === -1) return sentence;
  return sentence.slice(0, idx) + "______" + sentence.slice(idx + term.length);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Heuristic (non-AI) draft-question generator: no LLM call, just cloze
 * deletion — pick a significant term per sentence, blank it out, and (when
 * enough other terms were found elsewhere in the text) offer them as
 * multiple-choice distractors. Always meant to be reviewed and edited by
 * the teacher before being saved, not used as-is.
 */
export function generateDraftQuestions(text: string, maxQuestions = 10): DraftQuestion[] {
  const sentences = splitSentences(text);

  const pairs: { sentence: string; term: string }[] = [];
  const seenTerms = new Set<string>();
  for (const sentence of sentences) {
    const term = pickSignificantTerm(sentence);
    if (!term || seenTerms.has(term)) continue;
    seenTerms.add(term);
    pairs.push({ sentence, term });
    if (pairs.length >= maxQuestions * 2) break; // gather extra as a distractor pool
  }

  const allTerms = pairs.map((p) => p.term);
  const selected = pairs.slice(0, maxQuestions);

  return selected.map(({ sentence, term }) => {
    const pool = shuffle(allTerms.filter((t) => t !== term));
    const distractors = pool.slice(0, 3);

    if (distractors.length === 3) {
      const choices = shuffle([
        { text: term, isCorrect: true },
        ...distractors.map((d) => ({ text: d, isCorrect: false })),
      ]);
      return {
        type: "MULTIPLE_CHOICE" as const,
        text: blank(sentence, term),
        points: 1,
        correctAnswer: "",
        imageUrl: "",
        choices,
      };
    }

    return {
      type: "SHORT_ANSWER" as const,
      text: blank(sentence, term),
      points: 1,
      correctAnswer: term,
      imageUrl: "",
      choices: [],
    };
  });
}
