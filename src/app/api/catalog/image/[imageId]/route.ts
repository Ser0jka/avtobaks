import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const CATALOG_ROOT = path.join(process.cwd(), "Avtobaks_API", "catalog");
const IMAGE_DIR = path.join(CATALOG_ROOT, "image_files");

// Кеш маппинга imageId → filePath
let _imageMap: Record<string, string> | null = null;

async function getImageMap(): Promise<Record<string, string>> {
  if (_imageMap) return _imageMap;

  const raw = await fs.readFile(path.join(CATALOG_ROOT, "product_images.json"), "utf8");
  const data = JSON.parse(raw) as Record<string, { id?: string; storage_path?: string }>;

  const map: Record<string, string> = {};
  for (const [key, img] of Object.entries(data)) {
    const sp = (img.storage_path ?? "").replace(/\\/g, "/");
    if (!sp) continue;
    // storage_path = "catalog/image_files/img_xxx.jpg" — берём только имя файла
    const filename = sp.split("/").pop() ?? "";
    if (!filename) continue;
    const filePath = path.join(IMAGE_DIR, filename);
    map[key] = filePath;
    if (img.id && img.id !== key) map[img.id] = filePath;
  }

  _imageMap = map;
  return map;
}

export async function GET(_: Request, context: { params: Promise<{ imageId: string }> }) {
  const { imageId } = await context.params;

  try {
    const map = await getImageMap();
    const filePath = map[imageId];

    if (!filePath) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Защита от path traversal
    if (!filePath.startsWith(IMAGE_DIR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(body, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
