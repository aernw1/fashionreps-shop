const TAG_WORDS = [
  "QC",
  "LC",
  "W2C",
  "WTS",
  "WTB",
  "WTT",
  "FS",
  "FT",
  "REVIEW",
  "HAUL",
  "FIND",
  "HELP",
  "QUESTION",
];

const TAG_REGEX = new RegExp(`\\b(${TAG_WORDS.join("|")})\\b`, "gi");

export const deriveItemName = (title: string): string => {
  if (!title) return "";
  let cleaned = title;

  cleaned = cleaned.replace(/\[[^\]]*\]/g, " ");
  cleaned = cleaned.replace(/\([^\)]*\)/g, " ");
  cleaned = cleaned.replace(TAG_REGEX, " ");

  cleaned = cleaned.replace(/\b(size|sz)\b\s*[:=-]?\s*[a-z0-9.]+/gi, " ");
  cleaned = cleaned.replace(/\b(us|eu|uk|cm)\s*\d+(?:\.\d+)?/gi, " ");

  cleaned = cleaned.replace(/(?:USD|EUR|GBP|CNY|RMB|¥|€|£|\$)\s*\d+(?:[\.,]\d+)?/gi, " ");
  cleaned = cleaned.replace(/\b\d{2,4}\s*(?:cny|rmb|usd|eur|gbp)\b/gi, " ");
  cleaned = cleaned.replace(/\b\d+(?:\.\d+)?\s*(kg|g|lb|lbs)\b/gi, " ");
  cleaned = cleaned.replace(/\bhaul\b/gi, " ");

  cleaned = cleaned.replace(/\s*[|•·\-–—]\s*/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
};
