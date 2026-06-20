import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { checkAdminAuth } from "@/lib/adminAuth";
import { proxyCatalogAdmin } from "@/lib/catalogAdminProxy";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";
  const active = req.nextUrl.searchParams.get("active") ?? "all";
  const image = req.nextUrl.searchParams.get("image") ?? "all";
  const stock = req.nextUrl.searchParams.get("stock") ?? "all";
  const sort = req.nextUrl.searchParams.get("sort") ?? "updated";
  const take = Math.min(Math.max(Number(req.nextUrl.searchParams.get("take") ?? 50), 1), 500);
  const skip = Math.max(Number(req.nextUrl.searchParams.get("skip") ?? 0), 0);

  const proxied = await proxyCatalogAdmin(`catalog?${req.nextUrl.searchParams.toString()}`);
  if (proxied) return proxied;

  const andWhere: Prisma.CatalogProductWhereInput[] = [];

  if (q) {
    andWhere.push({
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { article: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
    });
  }

  if (category) andWhere.push({ category });
  if (active === "active") andWhere.push({ isActive: true });
  if (active === "hidden") andWhere.push({ isActive: false });
  if (image === "with") andWhere.push({ imageUrl: { not: null } });
  if (image === "missing") andWhere.push({ OR: [{ imageUrl: null }, { imageUrl: "" }] });
  if (stock === "in") andWhere.push({ stockCount: { gt: 0 } });
  if (stock === "out") andWhere.push({ stockCount: { lte: 0 } });

  const where: Prisma.CatalogProductWhereInput | undefined = andWhere.length ? { AND: andWhere } : undefined;
  const orderBy =
    sort === "price_asc" ? [{ price: "asc" as const }] :
    sort === "price_desc" ? [{ price: "desc" as const }] :
    sort === "stock_desc" ? [{ stockCount: "desc" as const }] :
    sort === "title" ? [{ title: "asc" as const }] :
    [{ updatedAt: "desc" as const }];

  const [products, total, categories, stats] = await Promise.all([
    prisma.catalogProduct.findMany({
      where,
      include: {
        offers: {
          orderBy: { priceMin: "asc" },
          take: 5,
        },
      },
      orderBy,
      take,
      skip,
    }),
    prisma.catalogProduct.count({ where }),
    prisma.catalogProduct.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
      take: 40,
    }),
    Promise.all([
      prisma.catalogProduct.count(),
      prisma.catalogProduct.count({ where: { isActive: true } }),
      prisma.catalogProduct.count({ where: { imageUrl: { not: null } } }),
      prisma.catalogProduct.count({ where: { OR: [{ imageUrl: null }, { imageUrl: "" }] } }),
      prisma.catalogProduct.count({ where: { stockCount: { lte: 0 } } }),
    ]),
  ]);

  return NextResponse.json({
    items: products,
    total,
    limit: take,
    skip,
    categories: categories
      .filter((item) => item.category)
      .map((item) => ({ name: item.category, count: item._count.category })),
    stats: {
      total: stats[0],
      active: stats[1],
      withImage: stats[2],
      withoutImage: stats[3],
      outOfStock: stats[4],
    },
  });
}
