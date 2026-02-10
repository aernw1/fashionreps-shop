export const REDDIT_USER_AGENT = "reddit-shop/1.0 (local catalog)";

export const BRAND_URL_PATTERNS: Array<{ pattern: RegExp; brand: string }> = [
  { pattern: /nike/i, brand: "Nike" },
  { pattern: /adidas/i, brand: "Adidas" },
  { pattern: /yeezy/i, brand: "Yeezy" },
  { pattern: /jordan/i, brand: "Jordan" },
  { pattern: /newbalance|new-balance|nb\b/i, brand: "New Balance" },
  { pattern: /stone\s*island|stoneisland/i, brand: "Stone Island" },
  { pattern: /supreme/i, brand: "Supreme" },
  { pattern: /off-?white/i, brand: "Off-White" },
  { pattern: /balenciaga/i, brand: "Balenciaga" },
  { pattern: /louis\s*vuitton|lv\b/i, brand: "Louis Vuitton" },
  { pattern: /gucci/i, brand: "Gucci" },
  { pattern: /dior/i, brand: "Dior" },
  { pattern: /prada/i, brand: "Prada" },
  { pattern: /arcteryx|arc'teryx/i, brand: "Arc'teryx" },
  { pattern: /patagonia/i, brand: "Patagonia" },
  { pattern: /canada\s*goose/i, brand: "Canada Goose" },
];

export const BRAND_TEXT_PATTERNS: Array<{ pattern: RegExp; brand: string }> = [
  { pattern: /\bnike\b/i, brand: "Nike" },
  { pattern: /\badidas\b/i, brand: "Adidas" },
  { pattern: /\byeezy\b/i, brand: "Yeezy" },
  { pattern: /\bjordan\b/i, brand: "Jordan" },
  { pattern: /\bnew\s*balance\b|\bnb\b/i, brand: "New Balance" },
  { pattern: /\bstone\s*island\b/i, brand: "Stone Island" },
  { pattern: /\bsupreme\b/i, brand: "Supreme" },
  { pattern: /\boff-?white\b/i, brand: "Off-White" },
  { pattern: /\bbalenciaga\b/i, brand: "Balenciaga" },
  { pattern: /\blouis\s*vuitton\b|\blv\b/i, brand: "Louis Vuitton" },
  { pattern: /\bgucci\b/i, brand: "Gucci" },
  { pattern: /\bdior\b/i, brand: "Dior" },
  { pattern: /\bprada\b/i, brand: "Prada" },
  { pattern: /\barc'teryx\b|\barcteryx\b/i, brand: "Arc'teryx" },
  { pattern: /\bpatagonia\b/i, brand: "Patagonia" },
  { pattern: /\bcanada\s*goose\b/i, brand: "Canada Goose" },
];

export const TYPE_KEYWORDS: Array<{ type: string; keywords: string[] }> = [
  { type: "Hoodie", keywords: ["hoodie", "hoody", "pullover"] },
  { type: "Sweatshirt", keywords: ["crewneck", "sweatshirt"] },
  { type: "T-Shirt", keywords: ["tee", "t-shirt", "tshirt", "shirt"] },
  { type: "Jacket", keywords: ["jacket", "windbreaker", "bomber", "anorak"] },
  { type: "Coat", keywords: ["coat", "parka", "puffer"] },
  { type: "Sneakers", keywords: ["sneaker", "sneakers", "shoe", "shoes", "trainer"] },
  { type: "Pants", keywords: ["pants", "trousers", "cargo", "chino"] },
  { type: "Jeans", keywords: ["jeans", "denim"] },
  { type: "Shorts", keywords: ["shorts"] },
  { type: "Accessories", keywords: ["cap", "hat", "beanie", "belt", "bag"] },
  { type: "Jewelry", keywords: ["ring", "bracelet", "necklace"] },
];

export const TAG_KEYWORDS = ["QC", "LC", "W2C"];

export const REDDIT_HOSTS = [
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "new.reddit.com",
  "redd.it",
  "i.redd.it",
  "v.redd.it",
  "preview.redd.it",
];

export const SELLER_FETCH_LIMIT = 8;
export const SELLER_FETCH_TIMEOUT_MS = 10_000;
