import { prisma } from "@/lib/prisma";
import { products as fallbackProducts } from "@/data/products";
import {
  getJsonCatalogProduct,
  listJsonCatalogProducts,
  type PublicCatalogProduct,
  type PublicCatalogProductDetail,
} from "@/lib/catalogJson";

export type CatalogListParams = {
  q?: string;
  category?: string;
  limit?: number;
};

const REMOTE_TIMEOUT_MS = Number(process.env.CATALOG_SERVICE_TIMEOUT_MS ?? 8000);

function remoteBaseUrl() {
  return process.env.CATALOG_SERVICE_URL?.trim().replace(/\/+$/, "") || "";
}

function remoteHeaders() {
  const token = process.env.CATALOG_SERVICE_TOKEN?.trim();
  return {
    accept: "application/json",
    ...(token ? { authorization: `Bearer ${token}`, "x-catalog-token": token } : {}),
  };
}

function withParams(path: string, params: Record<string, string | number | undefined>) {
  const base = remoteBaseUrl();
  const url = new URL(path.replace(/^\/+/, ""), `${base}/`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  return url;
}

async function remoteJson<T>(path: string, params: Record<string, string | number | undefined> = {}) {
  const base = remoteBaseUrl();
  if (!base) return null;

  const controller = new AbortController();
  const timeout = windowlessTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);

  try {
    const res = await fetch(withParams(path, params), {
      headers: remoteHeaders(),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Catalog service ${res.status}`);
    return await res.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

function windowlessTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}

function remoteItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

async function listRemoteProducts(params: CatalogListParams) {
  const payload = await remoteJson<unknown>("products", {
    q: params.q,
    category: params.category,
    limit: params.limit,
  });
  if (!payload) return null;
  return remoteItems<PublicCatalogProduct>(payload);
}

async function getRemoteProduct(id: string) {
  return remoteJson<PublicCatalogProductDetail>(`products/${encodeURIComponent(id)}`);
}

async function listDbProducts(params: CatalogListParams) {
  const q = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const limit = Math.min(params.limit ?? 300, 500);
  const count = await prisma.catalogProduct.count();
  if (count === 0) throw new Error("empty catalog");

  const rows = await prisma.catalogProduct.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { article: { contains: q, mode: "insensitive" } },
              { brand: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ stockCount: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    article: row.article,
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    category: row.category,
    brand: row.brand,
    inStock: row.stockCount > 0,
    stockCount: row.stockCount,
    image: row.imageUrl,
    description: row.description,
    rating: 4.8,
    reviews: 0,
    deliveryDays: row.deliveryDays,
  }));
}

async function getDbProduct(id: string) {
  const product = await prisma.catalogProduct.findUnique({
    where: { id },
    include: { offers: { orderBy: { priceMin: "asc" } } },
  });
  if (!product || !product.isActive) return null;

  return {
    id: product.id,
    title: product.title,
    article: product.article,
    brand: product.brand,
    category: product.category,
    description: product.description,
    price: product.price,
    priceMax: product.offers[0]?.priceMax ?? product.price,
    oldPrice: product.oldPrice ?? null,
    inStock: product.stockCount > 0,
    stockCount: product.stockCount,
    image: product.imageUrl,
    images: product.imageUrl ? [product.imageUrl] : [],
    rating: 4.8,
    reviews: 0,
    deliveryDays: product.deliveryDays,
    warehouses: product.offers.map((offer) => ({
      supplier: offer.supplier,
      price: offer.priceMin,
      stock: offer.stockTotal,
      delivery: offer.deliveryMinDays,
      warehouse: offer.warehouses ?? "",
    })),
  } satisfies PublicCatalogProductDetail;
}

function listFallbackProducts(params: CatalogListParams) {
  const q = params.q?.trim().toLowerCase() ?? "";
  const category = params.category?.trim() ?? "";
  const limit = Math.min(params.limit ?? 300, 500);
  let list = [...fallbackProducts];

  if (category) list = list.filter((product) => product.category === category);
  if (q) {
    list = list.filter((product) =>
      [product.title, product.article, product.category, product.description, product.brand]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  return list.slice(0, limit);
}

export async function listCatalogProducts(params: CatalogListParams) {
  try {
    const remoteProducts = await listRemoteProducts(params);
    if (remoteProducts) return remoteProducts;
  } catch (error) {
    console.warn("[catalog-service] remote product list failed:", error);
  }

  try {
    return await listJsonCatalogProducts(params);
  } catch (error) {
    console.warn("[catalog-service] local JSON product list failed:", error);
  }

  try {
    return await listDbProducts(params);
  } catch (error) {
    console.warn("[catalog-service] DB product list failed:", error);
  }

  return listFallbackProducts(params);
}

export async function getCatalogProduct(id: string) {
  try {
    const remoteProduct = await getRemoteProduct(id);
    if (remoteProduct) return remoteProduct;
  } catch (error) {
    console.warn("[catalog-service] remote product detail failed:", error);
  }

  try {
    const jsonProduct = await getJsonCatalogProduct(id);
    if (jsonProduct) return jsonProduct;
  } catch (error) {
    console.warn("[catalog-service] local JSON product detail failed:", error);
  }

  try {
    return await getDbProduct(id);
  } catch (error) {
    console.warn("[catalog-service] DB product detail failed:", error);
  }

  return null;
}
