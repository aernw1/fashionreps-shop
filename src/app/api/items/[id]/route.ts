import { NextResponse } from "next/server";
import { getItemById } from "@/lib/api/items";

export const GET = async (
  _request: Request,
  { params }: { params: { id: string } }
) => {
  const item = await getItemById(params.id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(item);
};
