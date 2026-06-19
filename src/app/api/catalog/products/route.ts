import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { products as fallbackProducts } from "@/data/products";

function toPublicProduct(product: {
  id: string;
  title: string;
  article: string;
  price: number;
  oldPrice: number | null;
  category: string;
  brand: string;
  stockCount: number;
  imageUrl: string | null;
  description: string;
  deliveryDays: number | null;
}) {
  return {
    id: product.id,
    title: product.title,
    article: product.article,
    price: product.price,
    oldPrice: product.oldPrice ?? undefined,
    category: product.category,
    brand: product.brand,
    inStock: product.stockCount > 0,
    stockCount: product.stockCount,
    image: product.imageUrl,
    description: product.description,
    rating: 4.8,
    reviews: 0,
    deliveryDays: product.deliveryDays,
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 300), 500);

  const count = await prisma.catalogProduct.count();
  if (count === 0) {
    return NextResponse.json(fallbackProducts);
  }

  const products = await prisma.catalogProduct.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { article: { contains: q, mode: "insensitive" } },
              { brand: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ stockCount: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return NextResponse.json(products.map(toPublicProduct));
}
