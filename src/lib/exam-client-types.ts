export type ApiQuestion = {
  id: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "AUDIO_ANSWER";
  text: string;
  points: number;
  imageUrl: string | null;
  choices: { id: string; text: string }[];
  savedSelectedChoiceId: string | null;
  savedTextAnswer: string | null;
  savedAudioUrl: string | null;
};

export type ExamStateResponse = {
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "TERMINATED";
  exam: { title: string; maxTabViolations?: number };
  deadlineAt?: string;
  serverNow?: string;
  tabViolations?: number;
  questions?: ApiQuestion[];
};
