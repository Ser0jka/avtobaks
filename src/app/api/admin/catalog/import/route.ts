import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { importSupplierCatalog } from "@/lib/catalogImport";

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await importSupplierCatalog();
  return NextResponse.json(result);
}
