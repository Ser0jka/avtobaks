import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readLatestVinSelection } from "@/lib/catalogImport";
import { runVinSelectionBackend } from "@/lib/vinSelectionRunner";

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const vin = String(body.vin ?? "").trim().toUpperCase();
  const partsText = String(body.partsText ?? "").trim();
  const customerName = String(body.customerName ?? "").trim();
  const contact = String(body.contact ?? "").trim();
  const comment = String(body.comment ?? "").trim();

  if (vin.length < 10 || !partsText || !customerName || !contact) {
    return NextResponse.json({ error: "Заполните VIN, детали, имя и контакт" }, { status: 400 });
  }

  const backendResult = await runVinSelectionBackend(vin, partsText);
  const selection = await readLatestVinSelection(vin);
  const request = await prisma.vinRequest.create({
    data: {
      vin,
      partsText,
      customerName,
      contact,
      comment: comment || null,
      status: selection ? "selection_ready" : "new",
      vehicle: selection?.vehicle as object | undefined,
      oeParts: asArray(selection?.oe_parts),
      searchTargets: asArray(selection?.search_targets),
      offers: asArray(selection?.offers),
      resultHtmlPath: selection ? `Avtobaks_API/output/vin_selections/${selection.id}.html` : null,
      backendLog: selection
        ? backendResult.log || "Backend-подбор выполнен, результат сохранен в vin_selections.json"
        : backendResult.log || "Заявка сохранена. Менеджер проверит совместимость вручную.",
    },
  });

  return NextResponse.json({ id: request.id, status: request.status, offersCount: asArray(request.offers).length });
}
