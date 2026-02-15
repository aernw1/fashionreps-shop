import { NextResponse } from "next/server";
import { getItems, parseItemsQuery } from "@/lib/api/items";
import { ensureCatalogDataFresh } from "@/lib/scraper/auto-refresh";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const query = parseItemsQuery(searchParams);
  await ensureCatalogDataFresh();
  const data = await getItems(query);
  return NextResponse.json(data);
};
