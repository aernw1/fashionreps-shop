export type ScrapedMedia = {
  url: string;
  kind: "image" | "video" | "gif";
};

export type ScrapedSellerLink = {
  url: string;
  domain: string;
  itemName?: string | null;
  priceValue?: number | null;
  priceCurrency?: string | null;
};

export type ScrapedComment = {
  id: string;
  author: string;
  body: string;
  isOp: boolean;
};

export type ScrapedPost = {
  id: string;
  title: string;
  body: string | null;
  author: string;
  createdUtc: number;
  flair: string | null;
  permalink: string;
  brand: string | null;
  type: string | null;
  tags: string[];
  media: ScrapedMedia[];
  sellerLinks: ScrapedSellerLink[];
  comments: ScrapedComment[];
};
