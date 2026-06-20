import { NextResponse } from "next/server";

// GET /api/vin-parts?vin=...&cat=...&type=oem
// Возвращает OEM/неоригинальные номера для VIN + категория
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vin = searchParams.get("vin")?.toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  const cat = searchParams.get("cat") ?? "";
  const type = searchParams.get("type") ?? ""; // "oem" или пусто (все)

  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: "Укажите корректный VIN (17 символов)" }, { status: 400 });
  }
  if (!cat) {
    return NextResponse.json({ error: "Укажите cat (ID категории)" }, { status: 400 });
  }

  const key = process.env.PARTSAPI_KEY_GET_PARTS_BY_VIN;
  if (!key) {
    return NextResponse.json({ error: "PARTSAPI_KEY_GET_PARTS_BY_VIN не настроен" }, { status: 503 });
  }

  const endpoint = process.env.PARTSAPI_ENDPOINT ?? "https://api.partsapi.ru";
  const lang = process.env.PARTSAPI_LANG ?? "16";

  try {
    const url = new URL(endpoint);
    url.searchParams.set("method", "getPartsbyVIN");
    url.searchParams.set("key", key);
    url.searchParams.set("vin", vin);
    url.searchParams.set("cat", cat);
    url.searchParams.set("lang", lang);
    if (type) url.searchParams.set("type", type);

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15_000),
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `PartsAPI error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();

    // Парсим ответ: массив [{group, name, parts, shortname}]
    // parts — строка "BRAND|ARTICLE,BRAND|ARTICLE,..."
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ parts: [], group: null });
    }

    const row = data[0];
    const group: string = row.group ?? "";
    const partName: string = row.name ?? row.shortname ?? "";

    // Разбираем parts-строку в массив {brand, article}
    const partsStr: string = row.parts ?? "";
    const parts = partsStr
      .split(",")
      .map((s: string) => {
        const idx = s.indexOf("|");
        if (idx === -1) return null;
        return { brand: s.slice(0, idx).trim(), article: s.slice(idx + 1).trim() };
      })
      .filter(Boolean) as { brand: string; article: string }[];

    // Дедупликация по brand+article
    const seen = new Set<string>();
    const unique = parts.filter(p => {
      const key = `${p.brand}|${p.article}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ group, partName, parts: unique, total: unique.length });
  } catch (e) {
    console.error("[vin-parts]", e);
    return NextResponse.json({ error: "Ошибка запроса к PartsAPI" }, { status: 500 });
  }
}
