import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import { readFileSync } from "node:fs";
import path from "node:path";

loadEnv();

const prisma = new PrismaClient();
const apiRoot = path.join(process.cwd(), "Avtobaks_API");
const catalogRoot = path.join(apiRoot, "catalog");

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1);
      process.env[key] ??= value;
    }
  } catch {
  }
}

function text(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function integer(value, fallback = 0) {
  return Math.max(0, Math.round(number(value, fallback)));
}

function date(value) {
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function readJsonObject(fileName) {
  const filePath = path.join(catalogRoot, fileName);
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function inferCategory(name, sourceQuery = "") {
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

const products = await readJsonObject("products.json");
const offers = await readJsonObject("supplier_offers.json");
const images = await readJsonObject("product_images.json");

const offersByProduct = new Map();
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
  const imageUrl = image ? `/api/catalog/image/${encodeURIComponent(text(image.id, imageId))}` : null;
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
      raw: product,
      createdAt: date(product.created_at),
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
      raw: product,
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
      raw: offer,
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
      raw: offer,
    },
  });
  offerCount += 1;
}

await prisma.$disconnect();
console.log(`Imported ${productCount} products and ${offerCount} supplier offers.`);
