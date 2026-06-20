import { promises as fs } from "fs";
import path from "path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type JsonRecord = Record<string, unknown>;

const API_ROOT = path.join(process.cwd(), "Avtobaks_API");
const CATALOG_ROOT = path.join(API_ROOT, "catalog");

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

/** Нормализует Windows-пути (обратные слеши) в Unix */
function normalizePath(p: string) {
  return p.replace(/\\/g, "/");
}

function number(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function integer(value: unknown, fallback = 0) {
  return Math.max(0, Math.round(number(value, fallback)));
}

function asDate(value: unknown) {
  const date = new Date(text(value));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function json(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function catalogImageUrl(image: JsonRecord | undefined, imageId: string) {
  if (!image) return null;

  const storagePath = normalizePath(text(image.storage_path));
  if (storagePath) {
    return `/api/catalog/image/${encodeURIComponent(text(image.id, imageId))}`;
  }

  const sourceUrl = text(image.source_url);
  return sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://") ? sourceUrl : null;
}

async function readJsonObject(fileName: string): Promise<Record<string, JsonRecord>> {
  const filePath = path.join(CATALOG_ROOT, fileName);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as Record<string, JsonRecord>;
}

function inferCategory(name: string, sourceQuery = "") {
  const haystack = `${name} ${sourceQuery}`.toLowerCase();
  if (/фильтр|filter/.test(haystack)) return "Фильтры";
  if (/масл|двигател|ремень грм|генератор/.test(haystack)) return "Двигатель и масла";
  if (/ламп|фара|оптик|h1|h4|h7/.test(haystack)) return "Оптика";
  if (/колод|диск тормоз|суппорт/.test(haystack)) return "Тормозная система";
  if (/амортиз|рычаг|подвес|стойк|шаровая/.test(haystack)) return "Подвеска";
  if (/аккумулятор|датчик|электр/.test(haystack)) return "Электрика";
  if (/коврик|щетк|аксесс/.test(haystack)) return "Аксессуары";
  if (/антифриз|омыват|lavr|sintec|hi-gear/.test(haystack)) return "Автохимия";
  return "";
}

export async function importSupplierCatalog() {
  const products = await readJsonObject("products.json");
  const offers = await readJsonObject("supplier_offers.json");
  const images = await readJsonObject("product_images.json");

  const offersByProduct = new Map<string, JsonRecord[]>();
  for (const offer of Object.values(offers)) {
    const productId = text(offer.product_id);
    if (!productId) continue;
    const bucket = offersByProduct.get(productId) ?? [];
    bucket.push(offer);
    offersByProduct.set(productId, bucket);
  }

  let productCount = 0;
  let offerCount = 0;

  for (const product of Object.values(products)) {
    const id = text(product.id);
    if (!id) continue;

    const productOffers = offersByProduct.get(id) ?? [];
    const bestOffer = [...productOffers].sort((a, b) => number(a.price_min) - number(b.price_min))[0];
    const imageId = text(product.main_image_id);
    const image = imageId ? images[imageId] : undefined;
    const imageUrl = catalogImageUrl(image, imageId);
    const title = text(product.name, "Товар без названия");
    const sourceQuery = text(bestOffer?.source_query);

    await prisma.catalogProduct.upsert({
      where: { id },
      create: {
        id,
        title,
        article: text(product.article_original),
        brand: text(product.brand),
        category: inferCategory(title, sourceQuery),
        description: title,
        price: number(bestOffer?.price_min),
        oldPrice: null,
        stockCount: integer(bestOffer?.stock_total),
        deliveryDays: bestOffer ? integer(bestOffer.delivery_min_days, 0) || null : null,
        imageUrl,
        supplier: text(bestOffer?.supplier),
        supplierGuid: text(bestOffer?.supplier_guid),
        sourceQuery,
        raw: json(product),
        createdAt: asDate(product.created_at),
      },
      update: {
        title,
        article: text(product.article_original),
        brand: text(product.brand),
        price: number(bestOffer?.price_min),
        stockCount: integer(bestOffer?.stock_total),
        deliveryDays: bestOffer ? integer(bestOffer.delivery_min_days, 0) || null : null,
        imageUrl,
        supplier: text(bestOffer?.supplier),
        supplierGuid: text(bestOffer?.supplier_guid),
        sourceQuery,
        raw: json(product),
      },
    });
    productCount += 1;
  }

  for (const offer of Object.values(offers)) {
    const id = text(offer.id);
    const productId = text(offer.product_id);
    if (!id || !productId || !products[productId]) continue;

    await prisma.supplierOffer.upsert({
      where: { id },
      create: {
        id,
        productId,
        supplier: text(offer.supplier),
        supplierGuid: text(offer.supplier_guid),
        rawBrand: text(offer.raw_brand),
        rawArticle: text(offer.raw_article),
        rawName: text(offer.raw_name),
        priceMin: number(offer.price_min),
        priceMax: number(offer.price_max),
        stockTotal: integer(offer.stock_total),
        deliveryMinDays: integer(offer.delivery_min_days, 0) || null,
        warehouses: text(offer.warehouses),
        sourceQuery: text(offer.source_query),
        isCross: Boolean(offer.is_cross),
        raw: json(offer),
      },
      update: {
        supplier: text(offer.supplier),
        supplierGuid: text(offer.supplier_guid),
        rawBrand: text(offer.raw_brand),
        rawArticle: text(offer.raw_article),
        rawName: text(offer.raw_name),
        priceMin: number(offer.price_min),
        priceMax: number(offer.price_max),
        stockTotal: integer(offer.stock_total),
        deliveryMinDays: integer(offer.delivery_min_days, 0) || null,
        warehouses: text(offer.warehouses),
        sourceQuery: text(offer.source_query),
        isCross: Boolean(offer.is_cross),
        raw: json(offer),
      },
    });
    offerCount += 1;
  }

  return { productCount, offerCount };
}

// ── Кеш product_images.json ─────────────────────────────────
let _imagesCache: Record<string, JsonRecord> | null = null;

async function getImages(): Promise<Record<string, JsonRecord>> {
  if (!_imagesCache) {
    _imagesCache = await readJsonObject("product_images.json");
  }
  return _imagesCache;
}

export async function findCatalogImage(imageId: string) {
  const images = await getImages();
  const image = images[imageId];
  if (!image) return null;

  // Нормализуем Windows-слеши → Unix
  const storagePath = normalizePath(text(image.storage_path));
  // storage_path = "catalog/image_files/img_xxx.jpg" — убираем "catalog/" префикс
  const relativePath = storagePath.replace(/^catalog\//, "");
  const filePath = path.resolve(CATALOG_ROOT, relativePath);
  const imageRoot = path.resolve(CATALOG_ROOT, "image_files");

  // Защита от path traversal
  if (!filePath.startsWith(imageRoot + path.sep) && filePath !== imageRoot) return null;
  return filePath;
}

export async function readLatestVinSelection(vin: string) {
  const selections = await readJsonObject("vin_selections.json").catch(() => ({}));
  const normalizedVin = vin.trim().toUpperCase();
  return Object.values(selections)
    .filter((item) => text(item.vin).toUpperCase() === normalizedVin)
    .sort((a, b) => asDate(b.updated_at).getTime() - asDate(a.updated_at).getTime())[0] ?? null;
}
