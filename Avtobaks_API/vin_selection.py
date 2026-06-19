from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from main import (
    clean_for_json,
    extract_delivery_defaults,
    flatten_part,
    get_checkout_details,
    getv,
    partsapi_call,
    listify,
    make_session,
    read_json,
    search_rossko,
    write_json,
)


CATALOG_DIR = Path("catalog")
OUTPUT_DIR = Path("output")
NHTSA_DECODE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/{vin}"


def normalize_vin(vin: str) -> str:
    vin = re.sub(r"[^A-HJ-NPR-Z0-9]", "", vin.upper())
    if len(vin) != 17:
        raise ValueError("VIN must contain 17 allowed characters")
    return vin


def make_id(prefix: str, *parts: Any) -> str:
    raw = ":".join(str(part or "") for part in parts)
    digest = hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}_{digest}"


def decode_vin_nhtsa(vin: str) -> dict[str, Any]:
    response = make_session().get(
        NHTSA_DECODE_URL.format(vin=vin),
        params={"format": "json"},
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    rows = data.get("Results") or []
    row = rows[0] if rows else {}

    return {
        "vin": vin,
        "source": "nhtsa_vpic",
        "make": row.get("Make", "") or "",
        "model": row.get("Model", "") or "",
        "model_year": row.get("ModelYear", "") or "",
        "body_class": row.get("BodyClass", "") or "",
        "vehicle_type": row.get("VehicleType", "") or "",
        "engine": row.get("DisplacementL", "") or row.get("EngineModel", "") or "",
        "fuel_type": row.get("FuelTypePrimary", "") or "",
        "drive_type": row.get("DriveType", "") or "",
        "plant_country": row.get("PlantCountry", "") or "",
        "raw": clean_for_json(row),
    }


def partsapi_lang() -> str:
    return os.getenv("PARTSAPI_VIN_LANG", "ru").strip() or "ru"


def partsapi_key(name: str) -> str:
    key = os.getenv(name, "").strip()
    if not key:
        raise RuntimeError(f"Set {name} in .env")
    return key


def unwrap_partsapi_rows(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, dict):
        if data.get("statusMsg") == "Failed":
            return []
        for key in ("result", "data", "items", "rows"):
            if key in data and isinstance(data[key], (dict, list)):
                return unwrap_partsapi_rows(data[key])
        if "array" in data:
            return unwrap_partsapi_rows(data["array"])
        if all(str(k).isdigit() for k in data.keys()):
            return [row for row in data.values() if isinstance(row, dict)]
        return [data]

    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]

    return []


def decode_vin_partsapi(vin: str) -> dict[str, Any]:
    data = partsapi_call(
        "VINdecode",
        partsapi_key("PARTSAPI_KEY_VINDECODE"),
        {"vin": vin, "lang": partsapi_lang()},
    )
    rows = unwrap_partsapi_rows(data)
    row = rows[0] if rows else {}

    if not row:
        return {"vin": vin, "source": "partsapi_vindecode", "raw": clean_for_json(data)}

    return {
        "vin": vin,
        "source": "partsapi_vindecode",
        "make": row.get("manuName", "") or row.get("manuShortName", "") or "",
        "model": row.get("modelName", "") or "",
        "model_year": "",
        "body_class": row.get("bodyStyle", "") or row.get("constructionType", "") or "",
        "vehicle_type": row.get("linkageTargetType", "") or "",
        "engine": row.get("typeName", "") or row.get("motorType", "") or "",
        "fuel_type": row.get("fuelType", "") or "",
        "drive_type": row.get("impulsionType", "") or "",
        "plant_country": "",
        "tecdoc_car_id": row.get("carId", "") or row.get("typeNumber", "") or "",
        "tecdoc_manu_id": row.get("manuId", "") or "",
        "tecdoc_model_id": row.get("modId", "") or "",
        "type_number": row.get("typeNumber", "") or "",
        "year_from": row.get("yearOfConstrFrom", "") or "",
        "year_to": row.get("yearOfConstrTo", "") or "",
        "raw": clean_for_json(row),
    }


def decode_vin_partsapi_oe(vin: str) -> dict[str, Any]:
    data = partsapi_call(
        "VINdecodeOE",
        partsapi_key("PARTSAPI_KEY_VINDECODE_OE"),
        {"vin": vin},
    )
    if isinstance(data, dict) and isinstance(data.get("array"), dict):
        data = data["array"]
    rows = unwrap_partsapi_rows(data)
    row = rows[0] if rows else {}
    brand = ""
    catalog = ""
    model = ""
    modification = ""
    market = ""
    date_value = ""
    options = ""
    if row:
        brand = row.get("brand", "") or row.get("brend", "")
        catalog = row.get("catalog", "") or row.get("сatalog", "") or row.get("katalog", "")
        model = row.get("model", "") or row.get("modely", "") or row.get("naimenovanie", "")
        modification = row.get("modification", "") or row.get("modifikaciya", "")
        market = row.get("market", "") or row.get("rynok", "")
        date_value = row.get("date", "") or row.get("data", "") or row.get("data_vypuska", "")
        options = row.get("options", "") or row.get("opcii", "")

    return {
        "source": "partsapi_vindecode_oe",
        "brand": brand,
        "catalog": catalog,
        "model": model,
        "engine": row.get("engine", "") if row else "",
        "modification": modification,
        "market": market,
        "date": date_value,
        "options": options,
        "grade": row.get("grade", "") if row else "",
        "transmission": row.get("kp", "") if row else "",
        "raw": clean_for_json(row or data),
    }


def vehicle_label(vehicle: dict[str, Any]) -> str:
    parts = [
        vehicle.get("make", ""),
        vehicle.get("model", ""),
        vehicle.get("model_year", ""),
        vehicle.get("engine", ""),
    ]
    return " ".join(str(part).strip() for part in parts if str(part).strip())


def split_values(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in re.split(r"[,;\n]+", value) if item.strip()]


def normalize_category_id(value: str) -> str:
    value = str(value or "").strip()
    try:
        return str(int(float(value)))
    except ValueError:
        return value


def load_partsapi_categories(path: Path) -> list[dict[str, Any]]:
    data = read_json(path, [])
    return data if isinstance(data, list) else []


def resolve_partsapi_categories(
    explicit_categories: list[str],
    part_names: list[str],
    categories_path: Path,
) -> list[str]:
    source_terms = explicit_categories or part_names
    categories = load_partsapi_categories(categories_path)
    resolved: list[str] = []
    seen = set()

    for term in source_terms:
        term = str(term or "").strip()
        if not term:
            continue

        if re.fullmatch(r"\d+(?:\.0)?", term):
            cat_id = normalize_category_id(term)
        else:
            query = term.casefold()
            matches = []
            for item in categories:
                path = [str(part or "") for part in item.get("path", [])]
                path_text = " ".join(path).casefold()
                exact_level = any(query == part.casefold() for part in path)
                contains = query in path_text
                if exact_level or contains:
                    score = 100 if exact_level else 70
                    score += max(0, 5 - len(path))
                    matches.append((score, item))

            matches.sort(key=lambda row: (-row[0], len(row[1].get("path", []))))
            cat_id = str(matches[0][1]["id"]) if matches else term

        if cat_id and cat_id not in seen:
            resolved.append(cat_id)
            seen.add(cat_id)

    return resolved


def load_oe_map(path: Path) -> dict[str, Any]:
    data = read_json(path, {})
    return data if isinstance(data, dict) else {}


def oe_from_map(oe_map: dict[str, Any], vin: str, part_names: list[str]) -> list[dict[str, Any]]:
    rows = oe_map.get(vin, [])
    if isinstance(rows, dict):
        rows = rows.get("oe_parts", [])
    if not isinstance(rows, list):
        return []

    wanted = {part.lower() for part in part_names}
    result: list[dict[str, Any]] = []

    for row in rows:
        if not isinstance(row, dict):
            continue

        group = str(row.get("group", "") or row.get("part_name", "") or "").strip()
        if wanted and group.lower() not in wanted:
            continue

        oe_number = str(row.get("oe_number", "") or row.get("oe", "") or "").strip()
        if oe_number:
            result.append(
                {
                    "oe_number": oe_number,
                    "group": group or "OE",
                    "part_name": str(row.get("part_name", "") or group or "OE").strip(),
                    "source": str(row.get("source", "") or "local_oe_map"),
                    "confidence": int(row.get("confidence", 90) or 90),
                }
            )

    return result


def split_partsapi_parts(value: Any) -> list[dict[str, str]]:
    text = str(value or "").strip()
    if not text:
        return []

    rows: list[dict[str, str]] = []
    for chunk in re.split(r"[,;\n]+", text):
        chunk = chunk.strip()
        if not chunk:
            continue

        if "|" in chunk:
            brand, article = chunk.split("|", 1)
        elif ":" in chunk:
            brand, article = chunk.split(":", 1)
        elif "/" in chunk:
            brand, article = chunk.split("/", 1)
        else:
            parts = chunk.split()
            if len(parts) >= 2:
                brand = parts[0]
                article = " ".join(parts[1:])
            else:
                brand = ""
                article = chunk

        rows.append({"brand": brand.strip(), "article": article.strip(), "raw": chunk})

    return [row for row in rows if row["article"]]


def partsapi_get_parts_by_vin(
    vin: str,
    part_names: list[str],
    part_type: str,
    categories: list[str],
    preferred_brands: list[str],
    max_parts: int,
) -> list[dict[str, Any]]:
    key = partsapi_key("PARTSAPI_KEY_GET_PARTS_BY_VIN")
    candidates = categories or part_names
    if not candidates:
        raise RuntimeError("Set --partsapi-cat or --parts when using getPartsbyVIN")

    rows: list[dict[str, Any]] = []
    seen = set()
    preferred = {brand.casefold() for brand in preferred_brands if brand}

    for category in candidates:
        params = {"vin": vin, "cat": category}
        if part_type:
            params["type"] = part_type

        try:
            data = partsapi_call(
                "getPartsbyVIN",
                key,
                params,
            )
        except Exception as exc:
            print(f"[PartsAPI] getPartsbyVIN failed for cat={category}, type={part_type or '<empty>'}: {type(exc).__name__}")
            cache_path = CATALOG_DIR / f"partsapi_getPartsbyVIN_cat{category}_response.json"
            data = read_json(cache_path, [])
            if data:
                print(f"[PartsAPI] using cached getPartsbyVIN response for cat={category}")
            else:
                continue

        for row in unwrap_partsapi_rows(data):
            name = str(row.get("name", "") or category)
            shortname = str(row.get("shortname", "") or category)
            for part in split_partsapi_parts(row.get("parts", "")):
                if preferred and part.get("brand", "").casefold() not in preferred:
                    continue

                key_tuple = (part.get("brand", ""), part["article"], name, shortname)
                if key_tuple in seen:
                    continue
                rows.append(
                    {
                        "brand": part.get("brand", ""),
                        "article": part["article"],
                        "raw_part": part["raw"],
                        "group": name,
                        "part_name": shortname,
                        "source": "partsapi_getPartsbyVIN",
                        "confidence": 80,
                        "raw": clean_for_json(row),
                    }
                )
                seen.add(key_tuple)
                if max_parts > 0 and len(rows) >= max_parts:
                    return rows

    return rows


def build_search_targets(
    vehicle: dict[str, Any],
    part_names: list[str],
    oe_parts: list[dict[str, Any]],
    partsapi_parts: list[dict[str, Any]],
    allow_text_fallback: bool,
) -> list[dict[str, Any]]:
    targets: list[dict[str, Any]] = []
    seen = set()

    for oe_part in oe_parts:
        query = str(oe_part["oe_number"]).strip()
        if query and query not in seen:
            targets.append(
                {
                    "query": query,
                    "kind": "oe",
                    "part_name": oe_part.get("part_name", ""),
                    "group": oe_part.get("group", ""),
                    "confidence": oe_part.get("confidence", 90),
                    "source": oe_part.get("source", "manual"),
                }
            )
            seen.add(query)

    for part in partsapi_parts:
        article = str(part.get("article", "") or "").strip()
        brand = str(part.get("brand", "") or "").strip()
        query = f"{brand} {article}".strip() if brand else article
        if query and query not in seen:
            targets.append(
                {
                    "query": query,
                    "kind": "partsapi_vin_part",
                    "part_name": part.get("part_name", ""),
                    "group": part.get("group", ""),
                    "confidence": part.get("confidence", 80),
                    "source": part.get("source", "partsapi_getPartsbyVIN"),
                }
            )
            seen.add(query)

    if allow_text_fallback:
        label = vehicle_label(vehicle)
        for part_name in part_names:
            query = f"{part_name} {label}".strip()
            if query and query not in seen:
                targets.append(
                    {
                        "query": query,
                        "kind": "text_fallback",
                        "part_name": part_name,
                        "group": part_name,
                        "confidence": 25,
                        "source": "vin_decoded_text_search",
                    }
                )
                seen.add(query)

    return targets


def rossko_delivery() -> tuple[str, str | None]:
    key1 = os.getenv("ROSSKO_KEY1", "").strip()
    key2 = os.getenv("ROSSKO_KEY2", "").strip()
    if not key1 or not key2:
        raise RuntimeError("Set ROSSKO_KEY1 and ROSSKO_KEY2 in .env")

    checkout = get_checkout_details(key1, key2)
    return extract_delivery_defaults(checkout)


def search_targets_in_rossko(
    targets: list[dict[str, Any]],
    limit_per_target: int,
    include_crosses: bool,
) -> list[dict[str, Any]]:
    delivery_id, address_id = rossko_delivery()
    offers: list[dict[str, Any]] = []

    for target in targets:
        result = search_rossko(target["query"], delivery_id=delivery_id, address_id=address_id)
        parts = listify(getv(result, "PartsList"), ("Part", "part"))
        taken = 0

        for part in parts:
            if taken >= limit_per_target:
                break

            rows = [flatten_part(part, target["query"], is_cross=False)]
            if include_crosses:
                for cross in listify(getv(part, "crosses"), ("Part", "part")):
                    rows.append(
                        flatten_part(
                            cross,
                            target["query"],
                            is_cross=True,
                            parent_guid=str(getv(part, "guid", "") or ""),
                        )
                    )

            for row in rows:
                if taken >= limit_per_target:
                    break
                if not row["brand"] or not row["article"]:
                    continue

                row["selection_group"] = target.get("group", "")
                row["selection_part_name"] = target.get("part_name", "")
                row["selection_query_kind"] = target["kind"]
                row["selection_source"] = target["source"]
                row["selection_confidence"] = target["confidence"]
                offers.append(row)
                taken += 1

    return offers


def rank_offers(offers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        offers,
        key=lambda row: (
            -int(row.get("selection_confidence") or 0),
            not bool(row.get("stock_total")),
            int(row.get("delivery_min_days") or 999),
            float(row.get("price_min") or 999999999),
        ),
    )


def create_selection(
    vin: str,
    part_names: list[str],
    explicit_oe: list[str],
    oe_map_path: Path,
    limit_per_target: int,
    include_crosses: bool,
    allow_text_fallback: bool,
    use_partsapi_vin: bool,
    use_partsapi_oe_decode: bool,
    partsapi_type: str,
    partsapi_categories: list[str],
    partsapi_categories_path: Path,
    max_partsapi_parts: int,
    preferred_brands: list[str],
) -> dict[str, Any]:
    vin = normalize_vin(vin)
    if use_partsapi_vin:
        try:
            vehicle = decode_vin_partsapi(vin)
        except Exception as exc:
            print(f"[PartsAPI] VINdecode failed: {type(exc).__name__}")
            try:
                vehicle = decode_vin_nhtsa(vin)
            except Exception:
                vehicle = {
                    "vin": vin,
                    "source": "manual_fallback",
                    "make": preferred_brands[0] if preferred_brands else "",
                    "model": "",
                    "model_year": "",
                    "engine": "",
                    "raw": {},
                }
            if preferred_brands and not vehicle.get("make"):
                vehicle["make"] = preferred_brands[0]
    else:
        vehicle = decode_vin_nhtsa(vin)
    vehicle_oe = {}
    if use_partsapi_oe_decode:
        try:
            vehicle_oe = decode_vin_partsapi_oe(vin)
        except Exception as exc:
            print(f"[PartsAPI] VINdecodeOE failed: {type(exc).__name__}")
    oe_map = load_oe_map(oe_map_path)

    default_part_name = part_names[0] if len(part_names) == 1 else "manual"
    oe_parts = [
        {
            "oe_number": oe,
            "group": default_part_name,
            "part_name": default_part_name,
            "source": "cli",
            "confidence": 95,
        }
        for oe in explicit_oe
    ]
    oe_parts.extend(oe_from_map(oe_map, vin, part_names))
    resolved_partsapi_categories = resolve_partsapi_categories(
        explicit_categories=partsapi_categories,
        part_names=part_names,
        categories_path=partsapi_categories_path,
    )
    partsapi_parts = (
        partsapi_get_parts_by_vin(
            vin=vin,
            part_names=part_names,
            part_type=partsapi_type,
            categories=resolved_partsapi_categories,
            preferred_brands=preferred_brands or ([str(vehicle.get("make", ""))] if partsapi_type == "oem" else []),
            max_parts=max_partsapi_parts,
        )
        if use_partsapi_vin
        else []
    )

    targets = build_search_targets(
        vehicle=vehicle,
        part_names=part_names,
        oe_parts=oe_parts,
        partsapi_parts=partsapi_parts,
        allow_text_fallback=allow_text_fallback,
    )
    offers = rank_offers(search_targets_in_rossko(targets, limit_per_target, include_crosses))

    selection_id = make_id("vinsel", vin, ",".join(part_names), ",".join(explicit_oe))
    now = datetime.now().isoformat(timespec="seconds")

    return {
        "id": selection_id,
        "vin": vin,
        "vehicle": vehicle,
        "vehicle_oe": vehicle_oe,
        "requested_parts": part_names,
        "partsapi_categories": resolved_partsapi_categories,
        "oe_parts": oe_parts,
        "partsapi_parts": partsapi_parts,
        "search_targets": targets,
        "offers": offers,
        "status": "needs_manager_review" if offers else "not_found",
        "created_at": now,
        "updated_at": now,
        "notes": [
            "NHTSA/vPIC decodes vehicle data only; it does not return OE part numbers.",
            "OE-based results are suitable for manager review.",
            "Text fallback results are low-confidence and must be checked manually.",
        ],
    }


def money(value: Any) -> str:
    if value in (None, ""):
        return "цена по запросу"
    try:
        return f"{float(value):,.0f} ₽".replace(",", " ")
    except Exception:
        return str(value)


def render_selection(selection: dict[str, Any], output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / f"{selection['id']}.html"
    vehicle = selection.get("vehicle", {})

    rows = []
    for offer in selection.get("offers", []):
        rows.append(
            f"""
            <tr>
              <td>{html.escape(str(offer.get("selection_group") or offer.get("selection_part_name") or ""))}</td>
              <td>{html.escape(str(offer.get("brand", "")))}</td>
              <td>{html.escape(str(offer.get("article", "")))}</td>
              <td>{html.escape(str(offer.get("name", "")))}</td>
              <td>{html.escape(money(offer.get("price_min")))}</td>
              <td>{html.escape(str(offer.get("stock_total", 0)))}</td>
              <td>{html.escape(str(offer.get("delivery_min_days", "")))}</td>
              <td>{html.escape(str(offer.get("selection_query_kind", "")))}</td>
            </tr>
            """
        )

    doc = f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VIN подбор {html.escape(selection['vin'])}</title>
  <style>
    body {{ margin:0; font-family:Arial,sans-serif; color:#181818; background:#f4f4f4; }}
    main {{ max-width:1280px; margin:0 auto; padding:28px; }}
    h1 {{ margin:0 0 8px; }}
    .meta {{ margin:0 0 24px; color:#555; }}
    table {{ width:100%; border-collapse:collapse; background:#fff; }}
    th, td {{ padding:10px; border-bottom:1px solid #ddd; text-align:left; vertical-align:top; }}
    th {{ background:#111; color:#fff; }}
    tr:hover {{ background:#fafafa; }}
    .note {{ margin-top:18px; color:#666; font-size:14px; }}
  </style>
</head>
<body>
  <main>
    <h1>VIN подбор: {html.escape(selection['vin'])}</h1>
    <p class="meta">{html.escape(vehicle_label(vehicle) or "Авто не определено")}</p>
    <table>
      <thead>
        <tr>
          <th>Группа</th><th>Бренд</th><th>Артикул</th><th>Название</th>
          <th>Цена</th><th>Остаток</th><th>Дни</th><th>Источник</th>
        </tr>
      </thead>
      <tbody>{''.join(rows)}</tbody>
    </table>
    <p class="note">Подбор требует проверки менеджером, особенно если источник text_fallback.</p>
  </main>
</body>
</html>"""

    out_path.write_text(doc, encoding="utf-8")
    return out_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--vin", required=True)
    parser.add_argument("--parts", default="")
    parser.add_argument("--oe", action="append", default=[])
    parser.add_argument("--oe-map", default=str(CATALOG_DIR / "vin_oe_map.json"))
    parser.add_argument("--catalog", default=str(CATALOG_DIR))
    parser.add_argument("--output", default=str(OUTPUT_DIR / "vin_selections"))
    parser.add_argument("--limit-per-target", type=int, default=5)
    parser.add_argument("--include-crosses", action="store_true")
    parser.add_argument("--allow-text-fallback", action="store_true")
    parser.add_argument("--use-partsapi-vin", action="store_true")
    parser.add_argument("--use-partsapi-oe-decode", action="store_true")
    parser.add_argument("--partsapi-type", default="")
    parser.add_argument("--partsapi-cat", action="append", default=[])
    parser.add_argument("--partsapi-categories", default=str(CATALOG_DIR / "partsapi_categories.json"))
    parser.add_argument("--partsapi-preferred-brand", action="append", default=[])
    parser.add_argument("--max-partsapi-parts", type=int, default=10)
    parser.add_argument("--no-html", action="store_true")
    return parser.parse_args()


def main() -> None:
    load_dotenv()
    args = parse_args()

    part_names = split_values(args.parts)
    explicit_oe = []
    for item in args.oe:
        explicit_oe.extend(split_values(item))
    partsapi_categories = []
    for item in args.partsapi_cat:
        partsapi_categories.extend(split_values(item))
    preferred_brands = []
    for item in args.partsapi_preferred_brand:
        preferred_brands.extend(split_values(item))

    if not explicit_oe and not part_names and not partsapi_categories:
        raise RuntimeError("Set --oe, --parts, or both")

    selection = create_selection(
        vin=args.vin,
        part_names=part_names,
        explicit_oe=explicit_oe,
        oe_map_path=Path(args.oe_map),
        limit_per_target=args.limit_per_target,
        include_crosses=args.include_crosses,
        allow_text_fallback=args.allow_text_fallback,
        use_partsapi_vin=args.use_partsapi_vin,
        use_partsapi_oe_decode=args.use_partsapi_oe_decode,
        partsapi_type=args.partsapi_type,
        partsapi_categories=partsapi_categories,
        partsapi_categories_path=Path(args.partsapi_categories),
        max_partsapi_parts=args.max_partsapi_parts,
        preferred_brands=preferred_brands,
    )

    catalog_dir = Path(args.catalog)
    selections_path = catalog_dir / "vin_selections.json"
    selections = read_json(selections_path, {})
    selections[selection["id"]] = selection
    write_json(selections_path, selections)

    print(f"VIN: {selection['vin']}")
    print(f"Vehicle: {vehicle_label(selection['vehicle']) or 'not decoded'}")
    print(f"PartsAPI categories: {', '.join(selection['partsapi_categories']) or 'none'}")
    print(f"OE parts: {len(selection['oe_parts'])}")
    print(f"PartsAPI VIN parts: {len(selection['partsapi_parts'])}")
    print(f"Search targets: {len(selection['search_targets'])}")
    print(f"Offers: {len(selection['offers'])}")
    print(f"Saved JSON: {selections_path}")

    if not args.no_html:
        out_path = render_selection(selection, Path(args.output))
        print(f"Saved HTML: {out_path}")


if __name__ == "__main__":
    main()
