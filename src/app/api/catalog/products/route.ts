import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { products as fallbackProducts } from "@/data/products";

type JsonRecord = Record<string, unknown>;

function text(v: unknown, fb = "") { return typeof v === "string" ? v : fb; }
function num(v: unknown, fb = 0) { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function int(v: unknown, fb = 0) { return Math.max(0, Math.round(num(v, fb))); }

const CATALOG_ROOT = path.join(process.cwd(), "Avtobaks_API", "catalog");

// ── Кеш JSON в памяти ────────────────────────────────────────
let _cache: { products: Record<string, JsonRecord>; offers: Record<string, JsonRecord>; images: Record<string, JsonRecord> } | null = null;

async function readJson(file: string): Promise<Record<string, JsonRecord>> {
  const raw = await fs.readFile(path.join(CATALOG_ROOT, file), "utf8");
  return JSON.parse(raw) as Record<string, JsonRecord>;
}

async function getCache() {
  if (!_cache) {
    const [products, offers, images] = await Promise.all([
      readJson("products.json"),
      readJson("supplier_offers.json"),
      readJson("product_images.json"),
    ]);
    _cache = { products, offers, images };
  }
  return _cache;
}

function inferCategory(name: string, query = "") {
  const h = `${name} ${query}`.toLowerCase();
  if (/фильтр|filter/.test(h)) return "Фильтры";
  if (/масл|двигател|ремень грм|генератор|глушитель/.test(h)) return "Двигатель и масла";
  if (/ламп|фара|оптик|h1|h4|h7/.test(h)) return "Оптика";
  if (/колод|диск тормоз|суппорт/.test(h)) return "Тормозная система";
  if (/амортиз|рычаг|подвес|стойк|шаровая/.test(h)) return "Подвеска";
  if (/аккумулятор|датчик|электр/.test(h)) return "Электрика";
  if (/коврик|щетк|аксесс/.test(h)) return "Аксессуары";
  if (/антифриз|омыват|lavr|sintec|hi-gear/.test(h)) return "Автохимия";
  return "Аксессуары";
}

function buildProducts(
  products: Record<string, JsonRecord>,
  offers: Record<string, JsonRecord>,
  images: Record<string, JsonRecord>,
) {
  // группируем офферы по продукту
  const offersByProduct = new Map<string, JsonRecord[]>();
  for (const o of Object.values(offers)) {
    const pid = text(o.product_id);
    if (!pid) continue;
    const arr = offersByProduct.get(pid) ?? [];
    arr.push(o);
    offersByProduct.set(pid, arr);
  }

  return Object.values(products).map((p) => {
    const id = text(p.id);
    const productOffers = (offersByProduct.get(id) ?? []).sort(
      (a, b) => num(a.price_min) - num(b.price_min),
    );
    const best = productOffers[0];
    const imageId = text(p.main_image_id);
    const image = imageId ? images[imageId] : undefined;
    const storagePath = image ? text(image.storage_path).replace(/\\/g, "/") : "";
    const imageUrl = storagePath
      ? `/api/catalog/image/${encodeURIComponent(imageId)}`
      : (image ? text(image.source_url) || null : null);

    const title = text(p.name, "Товар без названия");
    const sourceQuery = text(best?.source_query);
    const stockCount = int(best?.stock_total);

    return {
      id,
      title,
      article: text(p.article_original),
      brand: text(p.brand),
      category: inferCategory(title, sourceQuery),
      description: title,
      price: num(best?.price_min),
      oldPrice: undefined as number | undefined,
      inStock: stockCount > 0,
      stockCount,
      image: imageUrl || null,
      rating: 4.8,
      reviews: 0,
      deliveryDays: best ? int(best.delivery_min_days, 0) || null : null,
    };
  }).filter((p) => p.price > 0);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 300), 500);

  // Пробуем читать из JSON-каталога
  try {
    const { products, offers, images } = await getCache();
    let list = buildProducts(products, offers, images);

    if (category) list = list.filter((p) => p.category === category);
    if (q) list = list.filter((p) =>
      [p.title, p.article, p.category, p.description, p.brand].join(" ").toLowerCase().includes(q)
    );

    list.sort((a, b) => (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0));

    return NextResponse.json(list.slice(0, limit));
  } catch (jsonErr) {
    console.warn("[catalog/products] JSON read failed, trying DB:", jsonErr);
  }

  // Фолбек → Prisma (если сгенерирована)
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.catalogProduct.count();
    if (count === 0) throw new Error("empty");

    const rows = await prisma.catalogProduct.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { article: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: [{ stockCount: "desc" }, { updatedAt: "desc" }],
      take: limit,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, title: r.title, article: r.article, price: r.price,
      oldPrice: r.oldPrice ?? undefined, category: r.category, brand: r.brand,
      inStock: r.stockCount > 0, stockCount: r.stockCount, image: r.imageUrl,
      description: r.description, rating: 4.8, reviews: 0, deliveryDays: r.deliveryDays,
    })));
  } catch (dbErr) {
    console.warn("[catalog/products] DB unavailable, using static fallback:", dbErr);
  }

  // Последний фолбек → статичные данные из кода
  let list = [...fallbackProducts];
  if (category) list = list.filter((p) => p.category === category);
  if (q) list = list.filter((p) =>
    [p.title, p.article, p.category, p.description, p.brand].join(" ").toLowerCase().includes(q)
  );
  return NextResponse.json(list.slice(0, limit));
}
