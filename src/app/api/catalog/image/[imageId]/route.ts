import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { findJsonCatalogImageFile } from "@/lib/catalogJson";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_: Request, context: { params: Promise<{ imageId: string }> }) {
  const { imageId } = await context.params;

  try {
    const filePath = await findJsonCatalogImageFile(imageId);
    if (!filePath) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
