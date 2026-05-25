export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function countMatches(candidates: string[], text: string) {
  const normalized = text.toLowerCase();
  return candidates.filter((candidate) => normalized.includes(candidate.toLowerCase()));
}
