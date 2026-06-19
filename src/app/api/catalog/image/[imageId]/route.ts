import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { findCatalogImage } from "@/lib/catalogImport";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_: Request, context: { params: Promise<{ imageId: string }> }) {
  const { imageId } = await context.params;
  const filePath = await findCatalogImage(imageId);

  if (!filePath) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const body = await fs.readFile(filePath);
  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

  return new NextResponse(body, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=86400",
    },
  });
}
