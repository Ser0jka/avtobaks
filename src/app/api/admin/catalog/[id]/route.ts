import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { proxyCatalogAdmin } from "@/lib/catalogAdminProxy";
import { prisma } from "@/lib/prisma";

const EDITABLE_FIELDS = [
  "title",
  "article",
  "brand",
  "category",
  "description",
  "price",
  "oldPrice",
  "stockCount",
  "deliveryDays",
  "imageUrl",
  "isActive",
] as const;

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();
  const proxied = await proxyCatalogAdmin(`catalog/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (proxied) return proxied;

  const data: Record<string, unknown> = {};

  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  const product = await prisma.catalogProduct.update({
    where: { id },
    data,
    include: { offers: { orderBy: { priceMin: "asc" }, take: 5 } },
  });

  return NextResponse.json(product);
}
