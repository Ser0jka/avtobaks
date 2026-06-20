import { NextResponse } from "next/server";

// ── WMI fallback база (если partsapi недоступен или нет ключа) ─
const WMI_DB: Record<string, { brand: string; country: string }> = {
  // Россия / СНГ
  XTA: { brand: "Lada (ВАЗ)", country: "Россия" },
  XTT: { brand: "Lada", country: "Россия" },
  XTK: { brand: "Lada Kalina", country: "Россия" },
  XTC: { brand: "Lada Granta", country: "Россия" },
  XTY: { brand: "Lada Vesta", country: "Россия" },
  XTR: { brand: "Lada", country: "Россия" },
  XTL: { brand: "Lada Largus", country: "Россия" },
  XUF: { brand: "ГАЗ", country: "Россия" },
  XUB: { brand: "ГАЗ Волга", country: "Россия" },
  X89: { brand: "УАЗ", country: "Россия" },
  XUU: { brand: "УАЗ", country: "Россия" },
  XUZ: { brand: "ЗИЛ", country: "Россия" },
  X3W: { brand: "Москвич", country: "Россия" },
  XKV: { brand: "ИЖ", country: "Россия" },
  X7L: { brand: "Renault (Россия)", country: "Россия" },
  X7R: { brand: "КАМАЗ", country: "Россия" },
  X1F: { brand: "КАМАЗ", country: "Россия" },
  X9F: { brand: "Ford (Россия)", country: "Россия" },
  XW8: { brand: "Volkswagen (Россия)", country: "Россия" },
  XWB: { brand: "Volkswagen (Россия)", country: "Россия" },
  XUK: { brand: "Renault (Россия)", country: "Россия" },
  X4X: { brand: "Chevrolet (Россия)", country: "Россия" },
  SB1: { brand: "Toyota (Россия)", country: "Россия" },
  Z94: { brand: "Kia (Россия)", country: "Россия" },
  XWE: { brand: "Hyundai (Россия)", country: "Россия" },
  X9N: { brand: "Hyundai (Россия)", country: "Россия" },
  Y6D: { brand: "Renault (Россия)", country: "Россия" },
  X9A: { brand: "Nissan (Россия)", country: "Россия" },
  X96: { brand: "Nissan (Россия)", country: "Россия" },
  XWN: { brand: "Skoda (Россия)", country: "Россия" },
  XLR: { brand: "Mitsubishi (Россия)", country: "Россия" },
  XMC: { brand: "Peugeot (Россия)", country: "Россия" },
  XME: { brand: "Citroën (Россия)", country: "Россия" },
  X4M: { brand: "Opel (Россия)", country: "Россия" },
  Y3M: { brand: "МАЗ", country: "Беларусь" },
  Y6L: { brand: "ЗАЗ", country: "Украина" },
  // Германия
  WAU: { brand: "Audi", country: "Германия" },
  WA1: { brand: "Audi", country: "Германия" },
  WBA: { brand: "BMW", country: "Германия" },
  WBS: { brand: "BMW M", country: "Германия" },
  WBY: { brand: "BMW i", country: "Германия" },
  WDB: { brand: "Mercedes-Benz", country: "Германия" },
  WDC: { brand: "Mercedes-Benz", country: "Германия" },
  WDD: { brand: "Mercedes-Benz", country: "Германия" },
  WVW: { brand: "Volkswagen", country: "Германия" },
  WP0: { brand: "Porsche", country: "Германия" },
  WP1: { brand: "Porsche Cayenne", country: "Германия" },
  W0L: { brand: "Opel", country: "Германия" },
  // Швеция / Великобритания
  YV1: { brand: "Volvo", country: "Швеция" },
  YV4: { brand: "Volvo", country: "Швеция" },
  SAJ: { brand: "Jaguar", country: "Великобритания" },
  SAL: { brand: "Land Rover", country: "Великобритания" },
  SCF: { brand: "Aston Martin", country: "Великобритания" },
  // Франция / Испания
  VF1: { brand: "Renault", country: "Франция" },
  VF3: { brand: "Peugeot", country: "Франция" },
  VF7: { brand: "Citroën", country: "Франция" },
  VSS: { brand: "SEAT", country: "Испания" },
  // Италия / Чехия
  ZAR: { brand: "Alfa Romeo", country: "Италия" },
  ZFA: { brand: "Fiat", country: "Италия" },
  ZFF: { brand: "Ferrari", country: "Италия" },
  TMB: { brand: "Škoda", country: "Чехия" },
  // Япония
  JHM: { brand: "Honda", country: "Япония" },
  JT2: { brand: "Toyota", country: "Япония" },
  JT3: { brand: "Toyota", country: "Япония" },
  JTD: { brand: "Toyota", country: "Япония" },
  JN1: { brand: "Nissan", country: "Япония" },
  JNK: { brand: "Infiniti", country: "Япония" },
  JA3: { brand: "Mitsubishi", country: "Япония" },
  JMB: { brand: "Mitsubishi", country: "Япония" },
  JF1: { brand: "Subaru", country: "Япония" },
  JM1: { brand: "Mazda", country: "Япония" },
  // Корея / Китай
  KMH: { brand: "Hyundai", country: "Корея" },
  KM8: { brand: "Hyundai", country: "Корея" },
  KNA: { brand: "Kia", country: "Корея" },
  KNB: { brand: "Kia", country: "Корея" },
  LGB: { brand: "BYD", country: "Китай" },
  LSJ: { brand: "Tesla (Китай)", country: "Китай" },
  // США
  "1FA": { brand: "Ford", country: "США" },
  "1G1": { brand: "Chevrolet", country: "США" },
  "1GC": { brand: "Chevrolet", country: "США" },
  "1HG": { brand: "Honda", country: "США" },
  "1N4": { brand: "Nissan", country: "США" },
  "5YJ": { brand: "Tesla", country: "США" },
  "7SA": { brand: "Tesla", country: "США" },
  "1C4": { brand: "Jeep", country: "США" },
};

// VDS-таблица моделей для российских WMI
const VDS_MODEL_DB: Record<string, string> = {
  "XTAXL": "Granta", "XTAXM": "Granta", "XTAXC": "Kalina",
  "XTAXF": "Priora", "XTAXG": "Priora", "XTAXH": "Largus",
  "X7LHR": "Logan", "X7LHS": "Duster", "X7LHL": "Sandero",
  "X7LHN": "Sandero Stepway", "X7LHQ": "Kaptur", "X7LHM": "Duster",
  "Y6DHS": "Duster", "Y6DHL": "Logan", "Y6DHR": "Sandero",
  "Z94CB": "Sportage", "Z94CD": "Ceed", "Z94CF": "Cerato",
  "Z94CG": "Rio", "Z94CH": "Rio", "Z94CJ": "Sorento",
  "XWEHA": "Solaris", "XWEHB": "Solaris", "XWEHC": "Creta",
  "X9NHA": "Solaris", "X9NHC": "Creta",
};

// WMI не соблюдающие ISO год-коды (российские заводы)
const NON_ISO_YEAR_WMI = new Set([
  "X7L","X7R","X1F","XTA","XTT","XTK","XTC","XTY","XTR","XTL",
  "XUF","XUB","XUU","X89","XUZ","X3W","XKV","X9F","XW8","XWB",
  "XUK","X4X","XWE","X9A","X96","XWN","XLR","XMC","XME","X9N",
  "X4M","Z94","Y6D","SB1","Y3M","Y3R","Y6L","Y6T",
]);

// Таблица год-кодов ISO 3779
const YEAR_CODE_MAP: Record<string, number[]> = {};
const YEAR_CHARS = "ABCDEFGHJKLMNPRSTUVWXY123456789";
for (let i = 0; i < YEAR_CHARS.length; i++) {
  const years: number[] = [];
  let y = 1980 + i;
  while (y <= 2040) { years.push(y); y += 30; }
  YEAR_CODE_MAP[YEAR_CHARS[i]] = years;
}

// ── PartsAPI VINdecode ────────────────────────────────────────
async function fetchPartsApiVin(vin: string): Promise<{
  manufacturer: string | null;
  model: string | null;
  year: number | null;
  country: string | null;
  engine: string | null;
  body: string | null;
  tecdoc_car_id: string | null;
} | null> {
  const key = process.env.PARTSAPI_KEY_VINDECODE;
  if (!key) return null;

  const endpoint = process.env.PARTSAPI_ENDPOINT ?? "https://api.partsapi.ru";
  const lang = process.env.PARTSAPI_LANG ?? "16"; // 16 = русский

  try {
    const url = new URL(endpoint);
    url.searchParams.set("method", "VINdecode");
    url.searchParams.set("key", key);
    url.searchParams.set("vin", vin);
    url.searchParams.set("lang", lang);

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10_000),
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;

    const json = await res.json();

    // Распаковываем обёртки data/result/rows/array
    let rows: Record<string, unknown>[] = [];
    const unwrap = (d: unknown): Record<string, unknown>[] => {
      if (Array.isArray(d)) return d.filter(x => typeof x === "object" && x !== null);
      if (d && typeof d === "object") {
        const obj = d as Record<string, unknown>;
        if (obj.statusMsg === "Failed") return [];
        for (const k of ["data", "result", "items", "rows", "array"]) {
          if (obj[k]) return unwrap(obj[k]);
        }
        // числовые ключи — массив объектов
        if (Object.keys(obj).every(k => /^\d+$/.test(k))) return Object.values(obj) as Record<string, unknown>[];
        return [obj];
      }
      return [];
    };
    rows = unwrap(json);
    const row = rows[0] ?? null;
    if (!row) return null;

    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "") || null;
    const num = (v: unknown) => {
      const n = parseInt(String(v ?? ""));
      return isNaN(n) ? null : n;
    };

    const yearFrom = num(row.yearOfConstrFrom);
    const yearTo = num(row.yearOfConstrTo);
    // Берём середину диапазона или начало
    const year = yearFrom ?? null;
    void yearTo;

    return {
      manufacturer: str(row.manuName) ?? str(row.manuShortName),
      model: str(row.modelName),
      year,
      country: null, // partsapi не возвращает страну напрямую
      engine: str(row.typeName) ?? str(row.motorType),
      body: str(row.bodyStyle) ?? str(row.constructionType),
      tecdoc_car_id: str(row.carId) ?? str(row.typeNumber),
    };
  } catch {
    return null;
  }
}

// ── PartsAPI VINdecodeOE — реальные поля из ответа API ────────
// Ответ: {data: {array: { brend, naimenovanie, modely, vypushcheno, dvigately, ... }}}
async function fetchPartsApiVinOE(vin: string): Promise<{
  brand: string | null;
  model: string | null;
  modification: string | null;
  market: string | null;
  released: string | null; // "02 2016"
  year: number | null;
  engine: string | null;
  transmission: string | null;
  drive: string | null;
  bodyStyle: string | null;
  color: string | null;
} | null> {
  const key = process.env.PARTSAPI_KEY_VINDECODE_OE;
  if (!key) return null;

  const endpoint = process.env.PARTSAPI_ENDPOINT ?? "https://api.partsapi.ru";

  try {
    const url = new URL(endpoint);
    url.searchParams.set("method", "VINdecodeOE");
    url.searchParams.set("key", key);
    url.searchParams.set("vin", vin);

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10_000),
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;

    const json = await res.json();

    // Структура: {data: {array: {...}}}
    let row: Record<string, unknown> | null = null;
    const inner = (json as Record<string, unknown>)?.data;
    if (inner && typeof inner === "object") {
      const arr = (inner as Record<string, unknown>)?.array;
      if (arr && typeof arr === "object" && !Array.isArray(arr)) {
        row = arr as Record<string, unknown>;
      }
    }
    if (!row) return null;

    const str = (v: unknown): string | null =>
      typeof v === "string" && v.trim() ? v.trim() : null;

    // Год из "02 2016" → 2016, или из data_vypuska: 9.2011 → 2011
    const released = str(row.vypushcheno) ?? str(row.data);
    let year: number | null = null;
    if (released) {
      const m = released.match(/(\d{4})/);
      if (m) year = parseInt(m[1]);
    }
    if (!year && row.data_vypuska) {
      const s = String(row.data_vypuska);
      const m = s.match(/(\d{4})/);
      if (m) year = parseInt(m[1]);
      else {
        // формат "9.2011" → год после точки
        const parts = s.split(".");
        if (parts.length === 2) year = parseInt(parts[1]);
      }
    }
    if (!year && row.modely_vypuskaetsya_s) {
      const s = String(row.modely_vypuskaetsya_s);
      const m = s.match(/(\d{4})/);
      if (m) year = parseInt(m[1]);
    }

    return {
      brand: str(row.brend) ?? str(row.brand),
      model: str(row.naimenovanie) ?? str(row.modely),
      modification: str(row.modifikaciya) ?? str(row.modification),
      market: str(row.rynok) ?? str(row.market),
      released,
      year,
      engine: str(row.dvigately) ?? str(row.engine),
      transmission: str(row.modely_kpp) ?? str(row.kp),
      drive: str(row.drive),
      bodyStyle: str(row.tip_avtomobilya) ?? str(row.bodystyle),
      color: str(row.cvet_kuzova),
    };
  } catch {
    return null;
  }
}

function lookupWmi(vin: string) {
  const v = vin.toUpperCase();
  return WMI_DB[v.slice(0, 3)] ?? WMI_DB[v.slice(0, 2)] ?? null;
}

function lookupModel(vin: string) {
  const v = vin.toUpperCase();
  return VDS_MODEL_DB[v.slice(0, 5)] ?? VDS_MODEL_DB[v.slice(0, 4)] ?? null;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ vin: string }> }
) {
  const { vin } = await context.params;
  const clean = vin.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (clean.length !== 17) {
    return NextResponse.json({ error: "VIN должен содержать 17 символов" }, { status: 400 });
  }

  let manufacturer: string | null = null;
  let model: string | null = null;
  let year: number | null = null;
  let country: string | null = null;
  let engine: string | null = null;
  let body: string | null = null;
  let modification: string | null = null;
  let market: string | null = null;
  let tecdoc_car_id: string | null = null;
  let confidence = 0;
  let source = "wmi_db";

  // 1. PartsAPI VINdecode + VINdecodeOE (параллельно)
  const [partsapi, partsapiOE] = await Promise.all([
    fetchPartsApiVin(clean),
    fetchPartsApiVinOE(clean),
  ]);

  if (partsapi?.manufacturer) {
    manufacturer = partsapi.manufacturer;
    model = partsapi.model;
    year = partsapi.year;
    engine = partsapi.engine;
    body = partsapi.body;
    tecdoc_car_id = partsapi.tecdoc_car_id;
    confidence = 0.95;
    source = "partsapi";
  }

  if (partsapiOE) {
    // OE — основной источник: даёт марку/модель/год/двигатель для российских и зарубежных VIN
    if (!manufacturer && partsapiOE.brand) manufacturer = partsapiOE.brand;
    if (!model && partsapiOE.model) model = partsapiOE.model;
    if (!modification && partsapiOE.modification) modification = partsapiOE.modification;
    if (partsapiOE.market) market = partsapiOE.market;
    if (!engine && partsapiOE.engine) engine = partsapiOE.engine;
    // Год из OE (точный, из поля released "02 2016" или year)
    if (!year && partsapiOE.year) year = partsapiOE.year;
    if (source === "wmi_db") {
      confidence = manufacturer ? 0.92 : 0.8;
      source = "partsapi_oe";
    }
  }

  // 2. Fallback: WMI_DB + VDS-таблица
  if (!manufacturer) {
    const wmi = lookupWmi(clean);
    if (wmi) {
      manufacturer = wmi.brand;
      country = wmi.country;
      confidence = 0.8;
    }
  }
  if (!model) {
    model = lookupModel(clean);
  }

  // 3. Год из 10-го символа (только для ISO-совместимых WMI)
  const wmi3 = clean.slice(0, 3);
  const isNonIsoYear = NON_ISO_YEAR_WMI.has(wmi3);
  const possibleYears = isNonIsoYear ? [] : (YEAR_CODE_MAP[clean[9]?.toUpperCase()] ?? []);

  if (!year && possibleYears.length > 0) {
    const currentYear = new Date().getFullYear();
    const past = possibleYears.filter(y => y <= currentYear);
    year = past.length > 0 ? past[past.length - 1] : possibleYears[0];
  }

  const released = partsapiOE?.released ?? null;
  const transmission = partsapiOE?.transmission ?? null;
  const drive = partsapiOE?.drive ?? null;

  return NextResponse.json({
    vin: clean,
    valid: true,
    manufacturer,
    model,
    year,
    possibleYears,
    country,
    engine,
    body,
    modification,
    market,
    released,
    transmission,
    drive,
    tecdoc_car_id,
    confidence,
    source,
    yearUnknown: isNonIsoYear && !year,
  });
}
