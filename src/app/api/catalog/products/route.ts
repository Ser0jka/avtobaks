import { NextRequest, NextResponse } from "next/server";
import { listCatalogProducts } from "@/lib/catalogService";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 300), 500);

  const products = await listCatalogProducts({ q, category, limit });
  return NextResponse.json(products);
}
