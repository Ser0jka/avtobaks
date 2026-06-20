import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { importSupplierCatalog } from "@/lib/catalogImport";
import { proxyCatalogAdmin } from "@/lib/catalogAdminProxy";

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const proxied = await proxyCatalogAdmin("catalog/import", { method: "POST" });
  if (proxied) return proxied;

  const result = await importSupplierCatalog();
  return NextResponse.json(result);
}
