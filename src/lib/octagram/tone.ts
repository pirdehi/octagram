export const FORMALITY_LABELS = [
  "Highly Literary",
  "Literary",
  "Very formal",
  "Formal",
  "Friendly",
  "Very friendly",
  "Street",
  "Very Street",
] as const;

export const CREATIVITY_LABELS = [
  "Faithful",
  "Natural",
  "Freer",
  "Creative",
] as const;

export const FORMALITY_MAP: Record<number, string> = {
  1: "highly literary, using elevated, poetic, and classical language with sophisticated vocabulary",
  2: "literary, using refined and elegant prose with careful word choices",
  3: "very formal, using professional and respectful language",
  4: "formal, using polite and proper language",
  5: "friendly, using warm and approachable language",
  6: "very friendly, using casual and relaxed language",
  7: "street, using informal slang and colloquial expressions",
  8: "very street, using heavy slang, urban vernacular, and raw informal speech",
};

export const CREATIVITY_MAP: Record<number, string> = {
  1: "very literal and strictly faithful to the original",
  2: "faithful but natural-sounding",
  3: "a freer rewrite while preserving the core meaning",
  4: "more creative while preserving the meaning and intent",
};

export function isIntInRange(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

