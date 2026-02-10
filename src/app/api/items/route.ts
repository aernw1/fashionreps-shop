import { NextResponse } from "next/server";
import { getItems, parseItemsQuery } from "@/lib/api/items";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const query = parseItemsQuery(searchParams);
  const data = await getItems(query);
  return NextResponse.json(data);
};
