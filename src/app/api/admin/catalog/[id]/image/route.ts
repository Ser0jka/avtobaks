import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { checkAdminAuth } from "@/lib/adminAuth";
import { proxyCatalogAdmin } from "@/lib/catalogAdminProxy";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function safeProductId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function extensionFor(file: File) {
  const fromType = EXTENSIONS[file.type];
  if (fromType) return fromType;

  const ext = path.extname(file.name).toLowerCase();
  return Object.values(EXTENSIONS).includes(ext) ? ext : "";
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const formData = await req.formData();
  const proxied = await proxyCatalogAdmin(`catalog/${encodeURIComponent(id)}/image`, {
    method: "POST",
    body: formData,
  });
  if (proxied) return proxied;

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл изображения не найден" }, { status: 400 });
  }

  const ext = extensionFor(file);
  if (!ext || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Поддерживаются только JPG, PNG и WebP" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Файл больше 8 МБ" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "catalog");
  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${safeProductId(id)}-${Date.now()}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, bytes);

  const imageUrl = `/uploads/catalog/${filename}`;
  const product = await prisma.catalogProduct.update({
    where: { id },
    data: { imageUrl },
    include: { offers: { orderBy: { priceMin: "asc" }, take: 5 } },
  });

  return NextResponse.json(product);
}
