-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "author" TEXT NOT NULL,
    "created_utc" INTEGER NOT NULL,
    "flair" TEXT,
    "permalink" TEXT NOT NULL,
    "brand" TEXT,
    "type" TEXT
);

-- CreateTable
CREATE TABLE "media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "post_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    CONSTRAINT "media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "seller_links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "post_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "price_value" REAL,
    "price_currency" TEXT,
    CONSTRAINT "seller_links_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_op" BOOLEAN NOT NULL,
    CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "post_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    CONSTRAINT "tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "posts_created_utc_idx" ON "posts"("created_utc");

-- CreateIndex
CREATE INDEX "posts_brand_idx" ON "posts"("brand");

-- CreateIndex
CREATE INDEX "posts_type_idx" ON "posts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "media_post_id_url_key" ON "media"("post_id", "url");

-- CreateIndex
CREATE INDEX "seller_links_domain_idx" ON "seller_links"("domain");

-- CreateIndex
CREATE INDEX "seller_links_price_value_idx" ON "seller_links"("price_value");

-- CreateIndex
CREATE UNIQUE INDEX "seller_links_post_id_url_key" ON "seller_links"("post_id", "url");

-- CreateIndex
CREATE UNIQUE INDEX "tags_post_id_tag_key" ON "tags"("post_id", "tag");
