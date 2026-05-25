export function sanitizeText(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

export function normalizeKeywordList(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => sanitizeText(value).toLowerCase())
        .filter((value) => value.length > 0)
    )
  );
}
