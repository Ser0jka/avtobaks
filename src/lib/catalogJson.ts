import { promises as fs } from "fs";
import path from "path";

export type JsonRecord = Record<string, unknown>;

export type PublicCatalogProduct = {
  id: string;
  title: string;
  article: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  oldPrice?: number;
  inStock: boolean;
  stockCount: number;
  image: string | null;
  rating: number;
  reviews: number;
  deliveryDays: number | null;
};

export type ProductWarehouse = {
  supplier: string;
  price: number;
  stock: number;
  delivery: number | null;
  warehouse: string;
};

export type PublicCatalogProductDetail = Omit<PublicCatalogProduct, "oldPrice"> & {
  priceMax: number;
  oldPrice: number | null;
  images: string[];
  warehouses: ProductWarehouse[];
};

type CatalogCache = {
  signature: string;
  products: Record<string, JsonRecord>;
  offers: Record<string, JsonRecord>;
  images: Record<string, JsonRecord>;
};

const CATALOG_ROOT = path.join(process.cwd(), "Avtobaks_API", "catalog");
const PRODUCTS_FILE = "products.json";
const OFFERS_FILE = "supplier_offers.json";
const IMAGES_FILE = "product_images.json";

let cache: CatalogCache | null = null;

export function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function integer(value: unknown, fallback = 0) {
  return Math.max(0, Math.round(number(value, fallback)));
}

async function readJson(file: string): Promise<Record<string, JsonRecord>> {
  const raw = await fs.readFile(path.join(CATALOG_ROOT, file), "utf8");
  return JSON.parse(raw) as Record<string, JsonRecord>;
}

async function catalogSignature() {
  const stats = await Promise.all(
    [PRODUCTS_FILE, OFFERS_FILE, IMAGES_FILE].map(async (file) => {
      const stat = await fs.stat(path.join(CATALOG_ROOT, file));
      return `${file}:${stat.mtimeMs}:${stat.size}`;
    }),
  );
  return stats.join("|");
}

export async function getCatalogJson() {
  const signature = await catalogSignature();
  if (cache?.signature === signature) return cache;

  const [products, offers, images] = await Promise.all([
    readJson(PRODUCTS_FILE),
    readJson(OFFERS_FILE),
    readJson(IMAGES_FILE),
  ]);

  cache = { signature, products, offers, images };
  return cache;
}

export function inferCategory(name: string, query = "") {
  const haystack = `${name} ${query}`.toLowerCase();
  if (/С„РёР»СЊС‚СЂ|filter/.test(haystack)) return "Р¤РёР»СЊС‚СЂС‹";
  if (/РјР°СЃР»|РґРІРёРіР°С‚РµР»|СЂРµРјРµРЅСЊ РіСЂРј|РіРµРЅРµСЂР°С‚РѕСЂ|РіР»СѓС€РёС‚РµР»СЊ/.test(haystack)) return "Р”РІРёРіР°С‚РµР»СЊ Рё РјР°СЃР»Р°";
  if (/Р»Р°РјРї|С„Р°СЂР°|РѕРїС‚РёРє|h1|h4|h7/.test(haystack)) return "РћРїС‚РёРєР°";
  if (/РєРѕР»РѕРґ|РґРёСЃРє С‚РѕСЂРјРѕР·|СЃСѓРїРїРѕСЂС‚/.test(haystack)) return "РўРѕСЂРјРѕР·РЅР°СЏ СЃРёСЃС‚РµРјР°";
  if (/Р°РјРѕСЂС‚РёР·|СЂС‹С‡Р°Рі|РїРѕРґРІРµСЃ|СЃС‚РѕР№Рє|С€Р°СЂРѕРІР°СЏ/.test(haystack)) return "РџРѕРґРІРµСЃРєР°";
  if (/Р°РєРєСѓРјСѓР»СЏС‚РѕСЂ|РґР°С‚С‡РёРє|СЌР»РµРєС‚СЂ/.test(haystack)) return "Р­Р»РµРєС‚СЂРёРєР°";
  if (/РєРѕРІСЂРёРє|С‰РµС‚Рє|Р°РєСЃРµСЃСЃ/.test(haystack)) return "РђРєСЃРµСЃСЃСѓР°СЂС‹";
  if (/Р°РЅС‚РёС„СЂРёР·|РѕРјС‹РІР°С‚|lavr|sintec|hi-gear/.test(haystack)) return "РђРІС‚РѕС…РёРјРёСЏ";
  return "РђРєСЃРµСЃСЃСѓР°СЂС‹";
}

export function inferCatalogCategory(name: string, query = "") {
  const haystack = `${name} ${query}`.toLowerCase();
  if (/фильтр|filter/.test(haystack)) return "Фильтры";
  if (/масл|двигател|ремень грм|генератор|глушитель/.test(haystack)) return "Двигатель и масла";
  if (/ламп|фара|оптик|h1|h4|h7/.test(haystack)) return "Оптика";
  if (/колод|диск тормоз|суппорт/.test(haystack)) return "Тормозная система";
  if (/амортиз|рычаг|подвес|стойк|шаровая/.test(haystack)) return "Подвеска";
  if (/аккумулятор|датчик|электр/.test(haystack)) return "Электрика";
  if (/коврик|щетк|аксесс/.test(haystack)) return "Аксессуары";
  if (/антифриз|омыват|lavr|sintec|hi-gear/.test(haystack)) return "Автохимия";
  return "Аксессуары";
}

export function imageUrlForProduct(product: JsonRecord, images: Record<string, JsonRecord>) {
  const imageId = text(product.main_image_id);
  const image = imageId ? images[imageId] : undefined;
  if (!image) return null;

  const storagePath = text(image.storage_path);
  if (storagePath) return `/api/catalog/image/${encodeURIComponent(imageId)}`;

  const sourceUrl = text(image.source_url);
  return sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://") ? sourceUrl : null;
}

export function offersByProduct(offers: Record<string, JsonRecord>) {
  const map = new Map<string, JsonRecord[]>();
  for (const offer of Object.values(offers)) {
    const productId = text(offer.product_id);
    if (!productId) continue;
    const productOffers = map.get(productId) ?? [];
    productOffers.push(offer);
    map.set(productId, productOffers);
  }

  for (const productOffers of map.values()) {
    productOffers.sort((a, b) => number(a.price_min) - number(b.price_min));
  }

  return map;
}

export function toPublicProduct(
  product: JsonRecord,
  productOffers: JsonRecord[],
  images: Record<string, JsonRecord>,
): PublicCatalogProduct | null {
  const id = text(product.id);
  if (!id) return null;

  const bestOffer = productOffers[0];
  const title = text(product.name, "РўРѕРІР°СЂ Р±РµР· РЅР°Р·РІР°РЅРёСЏ");
  const sourceQuery = text(bestOffer?.source_query);
  const stockCount = integer(bestOffer?.stock_total);
  const price = number(bestOffer?.price_min);

  if (price <= 0) return null;

  return {
    id,
    title,
    article: text(product.article_original),
    brand: text(product.brand),
    category: inferCatalogCategory(title, sourceQuery),
    description: title,
    price,
    oldPrice: undefined,
    inStock: stockCount > 0,
    stockCount,
    image: imageUrlForProduct(product, images),
    rating: 4.8,
    reviews: 0,
    deliveryDays: bestOffer ? integer(bestOffer.delivery_min_days, 0) || null : null,
  };
}

export function toPublicProductDetail(
  product: JsonRecord,
  productOffers: JsonRecord[],
  images: Record<string, JsonRecord>,
): PublicCatalogProductDetail | null {
  const publicProduct = toPublicProduct(product, productOffers, images);
  if (!publicProduct) return null;

  const bestOffer = productOffers[0];
  const image = publicProduct.image;

  return {
    ...publicProduct,
    priceMax: number(bestOffer?.price_max),
    oldPrice: null,
    images: image ? [image] : [],
    warehouses: productOffers.map((offer) => ({
      supplier: text(offer.supplier),
      price: number(offer.price_min),
      stock: integer(offer.stock_total),
      delivery: offer.delivery_min_days != null ? integer(offer.delivery_min_days) : null,
      warehouse: text(offer.warehouses),
    })),
  };
}

export async function listJsonCatalogProducts(params: {
  q?: string;
  category?: string;
  limit?: number;
}) {
  const { products, offers, images } = await getCatalogJson();
  const offerMap = offersByProduct(offers);
  const q = params.q?.trim().toLowerCase() ?? "";
  const category = params.category?.trim() ?? "";
  const limit = Math.min(params.limit ?? 300, 500);

  let list = Object.values(products)
    .map((product) => toPublicProduct(product, offerMap.get(text(product.id)) ?? [], images))
    .filter((product) => product !== null);

  if (category) list = list.filter((product) => product.category === category);
  if (q) {
    list = list.filter((product) =>
      [product.title, product.article, product.category, product.description, product.brand]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  list.sort((a, b) => Number(b.inStock) - Number(a.inStock) || b.stockCount - a.stockCount);
  return list.slice(0, limit);
}

export async function getJsonCatalogProduct(id: string) {
  const { products, offers, images } = await getCatalogJson();
  const product = products[id];
  if (!product) return null;

  const offerMap = offersByProduct(offers);
  return toPublicProductDetail(product, offerMap.get(text(product.id)) ?? [], images);
}

export async function findJsonCatalogImageFile(imageId: string) {
  const { images } = await getCatalogJson();
  const image = images[imageId];
  if (!image) return null;

  const storagePath = text(image.storage_path).replace(/\\/g, "/");
  const filename = storagePath.split("/").pop();
  if (!filename) return null;

  const imageRoot = path.resolve(CATALOG_ROOT, "image_files");
  const filePath = path.resolve(imageRoot, filename);
  if (!filePath.startsWith(imageRoot)) return null;

  return filePath;
}
