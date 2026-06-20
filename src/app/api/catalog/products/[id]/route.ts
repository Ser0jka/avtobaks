import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type JsonRecord = Record<string, unknown>;

function text(v: unknown, fb = "") { return typeof v === "string" ? v : fb; }
function num(v: unknown, fb = 0) { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function int(v: unknown, fb = 0) { return Math.max(0, Math.round(num(v, fb))); }

const CATALOG_ROOT = path.join(process.cwd(), "Avtobaks_API", "catalog");

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

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const { products, offers, images } = await getCache();
    const product = products[id];
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Все офферы для этого продукта
    const productOffers = Object.values(offers)
      .filter((o) => text(o.product_id) === id)
      .sort((a, b) => num(a.price_min) - num(b.price_min));

    const best = productOffers[0];
    const imageId = text(product.main_image_id);
    const image = imageId ? images[imageId] : undefined;
    const storagePath = image ? text(image.storage_path).replace(/\\/g, "/") : "";
    const imageUrl = storagePath
      ? `/api/catalog/image/${encodeURIComponent(imageId)}`
      : image ? text(image.source_url) || null : null;

    const title = text(product.name, "Товар без названия");
    const sourceQuery = text(best?.source_query);

    // Склады из всех офферов
    const warehouses = productOffers.map((o) => ({
      supplier: text(o.supplier),
      price: num(o.price_min),
      stock: int(o.stock_total),
      delivery: o.delivery_min_days != null ? int(o.delivery_min_days) : null,
      warehouse: text(o.warehouses),
    }));

    return NextResponse.json({
      id,
      title,
      article: text(product.article_original),
      brand: text(product.brand),
      category: inferCategory(title, sourceQuery),
      description: title,
      price: num(best?.price_min),
      priceMax: num(best?.price_max),
      oldPrice: null,
      inStock: int(best?.stock_total) > 0,
      stockCount: int(best?.stock_total),
      image: imageUrl || null,
      images: imageUrl ? [imageUrl] : [],
      rating: 4.8,
      reviews: 0,
      deliveryDays: best ? int(best.delivery_min_days, 0) || null : null,
      warehouses,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
