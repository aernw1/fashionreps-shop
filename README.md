# Reddit Shop (FashionReps)

Local-only catalog built on Next.js + SQLite. It scrapes r/FashionReps daily, extracts items, media, seller links, inferred brand/type/price, and serves a clean e-commerce style catalog with filters.

## Features
- Daily scraper (12:00 local time) with JSON + Playwright fallback
- SQLite storage via Prisma
- Internal API routes for catalog browsing + item detail
- Filterable UI by brand, type, price, and search

## Setup
```bash
npm install
```

Configure the database connection (default is SQLite):
```bash
cp .env.example .env
```

Run migrations:
```bash
npm run db:migrate
```

## Scraping
Manual run:
```bash
npm run scrape
```

Daily daemon:
```bash
npm run scraper:daemon
```

Playwright fallback requires browser install:
```bash
npx playwright install
```

## API
- `GET /api/items?q=&brand=&type=&minPrice=&maxPrice=&sort=&page=&pageSize=`
- `GET /api/items/:id`

## Tests
```bash
npm test
```

## Notes
- Scraper is intended for personal/local use only.
- Reddit images are hotlinked (no local image storage).
