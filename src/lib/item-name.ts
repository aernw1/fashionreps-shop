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
const GENERIC_WORDS = new Set([
  "haul",
  "review",
  "item",
  "items",
  "first",
  "ever",
  "package",
  "parcel",
  "shipping",
  "order",
  "unknown",
]);
const GENERIC_PHRASES = [
  /^first ever$/i,
  /^first haul$/i,
  /^haul$/i,
  /^mini haul$/i,
  /^unknown brand$/i,
  /^(mulebuy|superbuy|pandabuy|wegobuy)\b/i,
];

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

export const isGenericItemName = (value: string | null | undefined): boolean => {
  if (!value) return true;
  const cleaned = deriveItemName(value).toLowerCase();
  if (!cleaned || cleaned.length < 3) return true;
  if (GENERIC_PHRASES.some((pattern) => pattern.test(cleaned))) return true;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  return words.every((word) => GENERIC_WORDS.has(word));
};
