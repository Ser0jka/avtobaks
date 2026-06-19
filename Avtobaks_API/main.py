from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import time
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, quote_plus, unquote, urljoin, urlparse

import requests
from dotenv import load_dotenv
from requests import Session
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from zeep import Client
from zeep.helpers import serialize_object
from zeep.transports import Transport


ROSSKO_API_VERSION = "v2.1"
CATALOG_DIR = Path("catalog")
OUTPUT_DIR = Path("output")

DEFAULT_BULK_QUERIES = [
    "аккумулятор",
    "стартер",
    "генератор",
    "масляный фильтр",
    "воздушный фильтр",
    "топливный фильтр",
    "салонный фильтр",
    "свеча зажигания",
    "катушка зажигания",
    "ремень грм",
    "ремень генератора",
    "тормозные колодки",
    "тормозной диск",
    "амортизатор",
    "стойка стабилизатора",
    "шаровая опора",
    "рычаг подвески",
    "ступица",
    "подшипник ступицы",
    "шрус",
    "приводной вал",
    "рулевая тяга",
    "рулевой наконечник",
    "радиатор охлаждения",
    "помпа",
    "термостат",
    "датчик кислорода",
    "датчик abs",
    "фара",
    "лампа h1",
    "лампа h4",
    "лампа h7",
    "щетки стеклоочистителя",
    "масло моторное",
    "масло трансмиссионное",
    "антифриз",
    "тормозная жидкость",
    "сцепление",
    "комплект сцепления",
    "выжимной подшипник",
    "грм комплект",
    "ролик грм",
    "натяжитель ремня",
    "сайлентблок",
    "опора двигателя",
    "опора амортизатора",
    "пружина подвески",
    "стойка амортизатора",
    "диск сцепления",
    "тормозной суппорт",
    "главный тормозной цилиндр",
    "рабочий тормозной цилиндр",
    "радиатор печки",
    "радиатор кондиционера",
    "компрессор кондиционера",
    "фильтр осушитель",
    "бензонасос",
    "форсунка",
    "лямбда зонд",
    "дмрв",
    "датчик коленвала",
    "датчик распредвала",
    "датчик температуры",
    "датчик давления масла",
    "датчик положения дроссельной заслонки",
    "глушитель",
    "резонатор",
    "катализатор",
    "прокладка гбц",
    "прокладка клапанной крышки",
    "сальник коленвала",
    "сальник распредвала",
    "подушка двигателя",
    "подушка коробки",
    "трос ручника",
    "трос газа",
    "замок зажигания",
    "моторчик печки",
    "резистор печки",
    "мотор стеклоочистителя",
    "зеркало",
    "фонарь задний",
    "противотуманная фара",
    "бампер",
    "крыло",
    "капот",
    "решетка радиатора",
]

DEFAULT_BULK_BRANDS = [
    "Toyota",
    "Nissan",
    "Mitsubishi",
    "Honda",
    "Mazda",
    "Subaru",
    "Hyundai",
    "Kia",
    "Volkswagen",
    "Skoda",
    "Audi",
    "BMW",
    "Mercedes",
    "Ford",
    "Renault",
    "Lada",
    "Chevrolet",
]

ARTICLE_PREFIX_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

ROSSKO_PRIORITY_WORDS = (
    "фильтр",
    "масло",
    "колод",
    "диск",
    "свеч",
    "катуш",
    "ремень",
    "грм",
    "ролик",
    "натяж",
    "амортиз",
    "стойк",
    "рычаг",
    "шаров",
    "сайлент",
    "ступиц",
    "подшип",
    "шрус",
    "вал",
    "тяга",
    "наконеч",
    "радиатор",
    "помп",
    "термостат",
    "датчик",
    "фара",
    "лампа",
    "щетк",
    "аккумулятор",
    "стартер",
    "генератор",
    "сцеплен",
    "цилиндр",
    "суппорт",
    "насос",
    "форсун",
    "глуш",
    "проклад",
    "сальник",
    "подушка",
    "зеркал",
    "бампер",
    "крыл",
    "капот",
)

ROSSKO_NOISE_WORDS = (
    "werkzeug",
    "tool",
    "universal",
    "adapter",
    "holder",
    "repair kit",
    "workbench",
    "garten",
    "trikot",
    "monitor",
    "cleaner",
    "brush",
    "bits",
    "cup",
)

BRAND_ALIASES = {
    "mann filter": "mann",
    "mann-filter": "mann",
    "mannfilter": "mann",
    "mann": "mann",
    "lynx": "lynxauto",
    "lynx auto": "lynxauto",
    "lynxauto": "lynxauto",
    "kayaba": "kyb",
    "kyb": "kyb",
    "bosh": "bosch",
    "bosch": "bosch",
    "continental": "contitech",
    "contitech": "contitech",
    "hyundai kia": "hyundai/kia",
    "hyundai/kia": "hyundai/kia",
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
WEB_IMAGE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0 Safari/537.36"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.7",
}


def make_session() -> Session:
    session = Session()
    retry = Retry(
        total=3,
        backoff_factor=0.7,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def clean_for_json(value: Any) -> Any:
    value = serialize_object(value)

    if isinstance(value, dict):
        return {str(k): clean_for_json(v) for k, v in value.items()}

    if isinstance(value, (list, tuple)):
        return [clean_for_json(v) for v in value]

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    return value


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(clean_for_json(data), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def normalize_article(value: Any) -> str:
    text = str(value or "").upper()
    replacements = {
        "А": "A",
        "В": "B",
        "Е": "E",
        "К": "K",
        "М": "M",
        "Н": "H",
        "О": "O",
        "Р": "P",
        "С": "C",
        "Т": "T",
        "Х": "X",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return re.sub(r"[^A-Z0-9]", "", text)


def normalize_brand(value: Any) -> str:
    text = str(value or "").lower().strip()
    text = text.replace("_", " ").replace("-", " ").replace(".", " ")
    text = re.sub(r"\s+", " ", text)
    return BRAND_ALIASES.get(text, text)


def product_id_for(brand: Any, article: Any) -> str:
    key = f"{normalize_brand(brand)}:{normalize_article(article)}"
    digest = hashlib.sha1(key.encode("utf-8")).hexdigest()[:14]
    return f"prd_{digest}"


def offer_id_for(supplier: str, supplier_guid: Any, brand: Any, article: Any) -> str:
    raw = str(supplier_guid or "").strip() or f"{brand}:{article}"
    digest = hashlib.sha1(f"{supplier}:{raw}".encode("utf-8")).hexdigest()[:16]
    return f"off_{digest}"


def listify(value: Any, child_names: tuple[str, ...] = ()) -> list[Any]:
    value = clean_for_json(value)

    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, dict):
        for child_name in child_names:
            child = getv(value, child_name)
            if child is not None:
                return listify(child, child_names)
        return [value]

    return [value]


def getv(obj: Any, key: str, default: Any = None) -> Any:
    obj = clean_for_json(obj)

    if isinstance(obj, dict):
        if key in obj:
            return obj[key]

        key_lower = key.lower()
        for k, v in obj.items():
            if str(k).lower() == key_lower:
                return v

    return default


def to_float(value: Any) -> float | None:
    if value in (None, ""):
        return None

    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return None


def to_int(value: Any) -> int:
    if value in (None, ""):
        return 0

    try:
        return int(float(str(value).replace(",", ".")))
    except ValueError:
        return 0


def make_rossko_client(service_name: str) -> Client:
    transport = Transport(session=make_session(), timeout=20, operation_timeout=60)
    urls = [
        f"https://api.rossko.ru/service/{ROSSKO_API_VERSION}/{service_name}?wsdl",
        f"https://api.rossko.ru/service/{ROSSKO_API_VERSION}/{service_name}",
    ]
    last_error: Exception | None = None

    for url in urls:
        try:
            return Client(wsdl=url, transport=transport)
        except Exception as exc:
            last_error = exc

    raise RuntimeError(f"Cannot create Rossko SOAP client for {service_name}: {last_error}")


def soap_call(client: Client, method_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    method = getattr(client.service, method_name)

    try:
        result = method(**payload)
    except TypeError:
        result = method(payload)

    result = clean_for_json(result)

    for key in ("SearchResult", "GetSearchResult", "CheckoutDetailsResult", "GetCheckoutDetailsResult"):
        nested = getv(result, key)
        if nested is not None:
            return clean_for_json(nested)

    return clean_for_json(result)


def get_checkout_details(key1: str, key2: str) -> dict[str, Any]:
    client = make_rossko_client("GetCheckoutDetails")
    return soap_call(client, "GetCheckoutDetails", {"KEY1": key1, "KEY2": key2})


def extract_delivery_defaults(checkout: dict[str, Any]) -> tuple[str, str | None]:
    env_delivery_id = os.getenv("ROSSKO_DELIVERY_ID", "").strip()
    env_address_id = os.getenv("ROSSKO_ADDRESS_ID", "").strip()

    if env_delivery_id:
        return env_delivery_id, env_address_id or None

    deliveries = listify(getv(checkout, "DeliveryType"), ("delivery", "Delivery"))

    for delivery in deliveries:
        delivery_id = str(getv(delivery, "id", "")).strip()
        if delivery_id == "000000001":
            return delivery_id, None

    if deliveries:
        delivery_id = str(getv(deliveries[0], "id", "")).strip()
        if delivery_id:
            return delivery_id, None

    raise RuntimeError("Cannot determine Rossko delivery_id; set ROSSKO_DELIVERY_ID in .env")


def search_rossko(query: str, delivery_id: str, address_id: str | None) -> dict[str, Any]:
    client = make_rossko_client("GetSearch")
    payload = {
        "KEY1": os.getenv("ROSSKO_KEY1", "").strip(),
        "KEY2": os.getenv("ROSSKO_KEY2", "").strip(),
        "text": query,
        "delivery_id": delivery_id,
        "address_id": address_id or "",
    }
    return soap_call(client, "GetSearch", payload)


def stock_summary(stocks_obj: Any) -> tuple[float | None, float | None, int, int | None, str]:
    stocks = listify(stocks_obj, ("stock", "Stock"))
    prices: list[float] = []
    total = 0
    delivery_days: list[int] = []
    warehouses: list[str] = []

    for stock in stocks:
        price = to_float(getv(stock, "price"))
        count = to_int(getv(stock, "count"))
        delivery = getv(stock, "delivery")
        warehouse = str(getv(stock, "description", "") or "").strip()

        if price is not None:
            prices.append(price)
        total += count

        if delivery not in (None, ""):
            delivery_days.append(to_int(delivery))

        if warehouse:
            warehouses.append(warehouse)

    price_min = min(prices) if prices else None
    price_max = max(prices) if prices else None
    delivery_min = min(delivery_days) if delivery_days else None
    warehouse_text = "; ".join(sorted(set(warehouses)))

    return price_min, price_max, total, delivery_min, warehouse_text


def flatten_part(part: dict[str, Any], source_query: str, is_cross: bool, parent_guid: str = "") -> dict[str, Any]:
    price_min, price_max, stock_total, delivery_min, warehouses = stock_summary(getv(part, "stocks"))
    return {
        "supplier": "rossko",
        "supplier_guid": str(getv(part, "guid", "") or ""),
        "brand": str(getv(part, "brand", "") or "").strip(),
        "article": str(getv(part, "partnumber", "") or "").strip(),
        "name": str(getv(part, "name", "") or "").strip(),
        "price_min": price_min,
        "price_max": price_max,
        "stock_total": stock_total,
        "delivery_min_days": delivery_min,
        "warehouses": warehouses,
        "source_query": source_query,
        "is_cross": is_cross,
        "parent_guid": parent_guid,
        "raw": clean_for_json(part),
    }


def load_queries(path: Path) -> list[str]:
    if not path.exists():
        return []

    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


def normalize_query(value: Any) -> str:
    text = str(value or "").strip()
    text = re.sub(r"\s+", " ", text)
    return text


def safe_cli_path(value: str) -> Path:
    cleaned = str(value or "").replace("\r", "/r").replace("\n", "").strip()
    return Path(cleaned)


def dedupe_queries(queries: list[str]) -> list[str]:
    result: list[str] = []
    seen = set()

    for query in queries:
        query = normalize_query(query)
        key = query.lower()
        if len(query) < 2 or key in seen:
            continue
        result.append(query)
        seen.add(key)

    return result


def query_score(query: str) -> int:
    lower = query.lower()
    score = 0

    if re.search(r"[а-яё]", lower):
        score += 80
    if any(word in lower for word in ROSSKO_PRIORITY_WORDS):
        score += 120
    if any(word in lower for word in ROSSKO_NOISE_WORDS):
        score -= 100
    if re.fullmatch(r"[a-z0-9?+\- ]{1,8}", lower, flags=re.I):
        score -= 60
    if len(query) < 4:
        score -= 80
    if len(query) > 80:
        score -= 50

    words = query.split()
    if 2 <= len(words) <= 5:
        score += 15
    if len(words) > 7:
        score -= 20

    return score


def sort_queries_for_rossko(queries: list[str]) -> list[str]:
    return sorted(
        queries,
        key=lambda item: (-query_score(item), len(item), item.lower()),
    )


def partsapi_category_queries(path: Path, max_count: int = 0) -> list[str]:
    categories = read_json(path, [])
    queries: list[str] = []

    for row in categories:
        if not isinstance(row, dict):
            continue

        name = normalize_query(row.get("name", ""))
        path_items = [normalize_query(item) for item in row.get("path", []) if normalize_query(item)]

        if name:
            queries.append(name)

        if len(path_items) >= 2:
            queries.append(f"{path_items[-2]} {path_items[-1]}")

        if len(path_items) >= 3 and path_items[-1].lower() != name.lower():
            queries.append(f"{path_items[-3]} {path_items[-1]}")

    queries = [query for query in dedupe_queries(queries) if query_score(query) >= 0]
    queries = sort_queries_for_rossko(queries)
    return queries[:max_count] if max_count > 0 else queries


def expand_queries_with_brands(queries: list[str], brands: list[str], max_count: int = 0) -> list[str]:
    expanded = list(queries)

    for query in queries:
        for brand in brands:
            expanded.append(f"{query} {brand}")

    expanded = dedupe_queries(expanded)
    return expanded[:max_count] if max_count > 0 else expanded


def article_prefix_queries(min_length: int, max_length: int) -> list[str]:
    min_length = max(1, min_length)
    max_length = max(min_length, max_length)
    queries: list[str] = []

    def walk(prefix: str, target_length: int) -> None:
        if len(prefix) == target_length:
            queries.append(prefix)
            return
        for char in ARTICLE_PREFIX_ALPHABET:
            walk(prefix + char, target_length)

    for length in range(min_length, max_length + 1):
        walk("", length)

    return queries


def build_rossko_queries(args: argparse.Namespace) -> list[str]:
    queries = load_queries(Path(args.queries))

    if getattr(args, "article_prefixes", False):
        queries.extend(article_prefix_queries(args.prefix_min_length, args.prefix_max_length))

    if args.include_default_queries:
        queries.extend(DEFAULT_BULK_QUERIES)

    if args.partsapi_categories:
        queries.extend(partsapi_category_queries(Path(args.partsapi_categories), args.max_category_queries))

    queries = sort_queries_for_rossko(dedupe_queries(queries))

    brand_terms = [
        normalize_query(brand)
        for brand in re.split(r"[,;]", args.brands or "")
        if normalize_query(brand)
    ]
    if args.include_default_brands:
        brand_terms.extend(DEFAULT_BULK_BRANDS)
    brand_terms = dedupe_queries(brand_terms)

    if args.expand_brands and brand_terms:
        queries = expand_queries_with_brands(queries, brand_terms, args.max_queries)
        queries = sort_queries_for_rossko(queries)

    if args.query_output:
        out_path = safe_cli_path(args.query_output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text("\n".join(queries) + "\n", encoding="utf-8")

    return queries[: args.max_queries] if args.max_queries > 0 else queries


def upsert_product(products: dict[str, Any], offer: dict[str, Any]) -> dict[str, Any]:
    product_id = product_id_for(offer["brand"], offer["article"])
    product = products.get(product_id) or {
        "id": product_id,
        "brand": offer["brand"],
        "brand_norm": normalize_brand(offer["brand"]),
        "article_original": offer["article"],
        "article_norm": normalize_article(offer["article"]),
        "name": offer["name"],
        "product_group": "",
        "gtin": "",
        "tecdoc_article_id": "",
        "main_image_id": "",
        "image_status": "missing",
        "identifiers": [],
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "updated_at": "",
    }

    product["updated_at"] = datetime.now().isoformat(timespec="seconds")
    product["name"] = product.get("name") or offer["name"]

    identifiers = {
        (item.get("type"), item.get("value"), item.get("brand_norm"))
        for item in product.get("identifiers", [])
    }

    for item in (
        {
            "type": "BRAND_ARTICLE",
            "value": normalize_article(offer["article"]),
            "brand_norm": normalize_brand(offer["brand"]),
            "source": "rossko",
            "confidence": 85,
        },
        {
            "type": "SUPPLIER_GUID",
            "value": f"rossko:{offer['supplier_guid']}",
            "brand_norm": "",
            "source": "rossko",
            "confidence": 100,
        },
    ):
        key = (item["type"], item["value"], item["brand_norm"])
        if item["value"] and key not in identifiers:
            product.setdefault("identifiers", []).append(item)
            identifiers.add(key)

    products[product_id] = product
    return product


def sync_rossko(args: argparse.Namespace) -> None:
    key1 = os.getenv("ROSSKO_KEY1", "").strip()
    key2 = os.getenv("ROSSKO_KEY2", "").strip()

    if not key1 or not key2:
        raise RuntimeError("Set ROSSKO_KEY1 and ROSSKO_KEY2 in .env")

    catalog_dir = Path(args.catalog)
    products = read_json(catalog_dir / "products.json", {})
    offers = read_json(catalog_dir / "supplier_offers.json", {})
    state_path = catalog_dir / "rossko_sync_state.json"
    state = read_json(state_path, {"completed_queries": [], "errors": []}) if args.resume else {"completed_queries": [], "errors": []}
    completed_queries = set(state.get("completed_queries", []))
    errors = list(state.get("errors", []))

    checkout = get_checkout_details(key1, key2)
    delivery_id, address_id = extract_delivery_defaults(checkout)
    write_json(catalog_dir / "rossko_checkout_details.json", checkout)

    print(f"Rossko delivery_id={delivery_id}, address_id={address_id}")

    collected = 0
    queries = build_rossko_queries(args)
    print(f"Rossko queries: {len(queries)}")

    def flush_catalog() -> None:
        write_json(catalog_dir / "products.json", products)
        write_json(catalog_dir / "supplier_offers.json", offers)
        write_json(state_path, state)

    for query_index, query in enumerate(queries, start=1):
        if collected >= args.limit:
            break
        if query in completed_queries:
            continue

        print(f"[ROSSKO {query_index}/{len(queries)}] {query}")
        try:
            result = search_rossko(query, delivery_id=delivery_id, address_id=address_id)
            parts = listify(getv(result, "PartsList"), ("Part", "part"))
        except Exception as exc:
            error_row = {
                "query": query,
                "error": str(exc),
                "created_at": datetime.now().isoformat(timespec="seconds"),
            }
            errors.append(error_row)
            state["errors"] = errors[-500:]
            write_json(state_path, state)
            print(f"[ROSSKO ERROR] {query}: {exc}")
            if not args.continue_on_error:
                raise
            time.sleep(args.delay)
            continue

        added_for_query = 0
        for part in parts:
            if collected >= args.limit:
                break

            rows = [flatten_part(part, query, is_cross=False)]

            if args.include_crosses:
                for cross in listify(getv(part, "crosses"), ("Part", "part")):
                    rows.append(
                        flatten_part(
                            cross,
                            query,
                            is_cross=True,
                            parent_guid=str(getv(part, "guid", "") or ""),
                        )
                    )

            for row in rows:
                if collected >= args.limit:
                    break

                if not row["brand"] or not row["article"]:
                    continue

                product = upsert_product(products, row)
                offer_id = offer_id_for("rossko", row["supplier_guid"], row["brand"], row["article"])
                offers[offer_id] = {
                    "id": offer_id,
                    "supplier": "rossko",
                    "supplier_guid": row["supplier_guid"],
                    "product_id": product["id"],
                    "raw_brand": row["brand"],
                    "raw_article": row["article"],
                    "raw_name": row["name"],
                    "price_min": row["price_min"],
                    "price_max": row["price_max"],
                    "stock_total": row["stock_total"],
                    "delivery_min_days": row["delivery_min_days"],
                    "warehouses": row["warehouses"],
                    "source_query": row["source_query"],
                    "is_cross": row["is_cross"],
                    "parent_guid": row["parent_guid"],
                    "updated_at": datetime.now().isoformat(timespec="seconds"),
                    "raw": row["raw"],
                }
                collected += 1
                added_for_query += 1

        completed_queries.add(query)
        state["completed_queries"] = sorted(completed_queries)
        state["errors"] = errors[-500:]
        state["updated_at"] = datetime.now().isoformat(timespec="seconds")
        flush_catalog()
        print(f"[ROSSKO OK] parts={len(parts)}, saved_rows={added_for_query}, total_saved={len(offers)}")
        time.sleep(args.delay)

    flush_catalog()
    print(f"Synced offers: {collected}")
    print(f"Products total: {len(products)}")


def image_override_keys(product: dict[str, Any], offer: dict[str, Any] | None = None) -> list[str]:
    keys = [
        product.get("id", ""),
        f"{product.get('brand_norm')}:{product.get('article_norm')}",
        product.get("article_norm", ""),
    ]

    if offer:
        keys.extend(
            [
                str(offer.get("supplier_guid", "") or ""),
                f"rossko:{offer.get('supplier_guid', '')}",
                f"{normalize_brand(offer.get('raw_brand'))}:{normalize_article(offer.get('raw_article'))}",
            ]
        )

    clean: list[str] = []
    seen = set()

    for key in keys:
        key = str(key or "").strip()
        if key and key not in seen:
            clean.append(key)
            seen.add(key)

    return clean


def download_image(url: str, out_dir: Path, image_id: str) -> str:
    out_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(url.split("?")[0]).suffix.lower()
    if ext not in IMAGE_EXTENSIONS:
        ext = ".webp"

    path = out_dir / f"{image_id}{ext}"

    if path.exists() and path.stat().st_size > 100:
        return str(path)

    response = make_session().get(url, timeout=30)
    if response.status_code != 200:
        return ""

    content_type = response.headers.get("content-type", "")
    if "image" not in content_type.lower() and ext not in {".webp", ".jpg", ".jpeg", ".png"}:
        return ""

    path.write_bytes(response.content)
    if path.stat().st_size < 100:
        path.unlink(missing_ok=True)
        return ""

    return str(path)


def add_image(
    images: dict[str, Any],
    product: dict[str, Any],
    source: str,
    source_url: str,
    confidence: int,
    download: bool,
    catalog_dir: Path,
) -> str:
    image_id = "img_" + hashlib.sha1(f"{product['id']}:{source_url}".encode("utf-8")).hexdigest()[:16]
    storage_path = ""

    if download:
        storage_path = download_image(source_url, catalog_dir / "image_files", image_id)
        if not storage_path:
            return ""

    images[image_id] = {
        "id": image_id,
        "product_id": product["id"],
        "source": source,
        "source_url": source_url,
        "storage_path": storage_path,
        "confidence": confidence,
        "is_main": True,
        "status": "found",
        "updated_at": datetime.now().isoformat(timespec="seconds"),
    }
    product["main_image_id"] = image_id
    product["image_status"] = "found"
    return image_id


def apply_url_template(template: str, product: dict[str, Any], offer: dict[str, Any] | None) -> str:
    if not template:
        return ""

    values = {
        "product_id": quote_plus(product.get("id", "")),
        "guid": quote_plus(str((offer or {}).get("supplier_guid", "") or "")),
        "offer_guid": quote_plus(str((offer or {}).get("supplier_guid", "") or "")),
        "brand": quote_plus(product.get("brand", "")),
        "brand_raw": quote_plus(product.get("brand", "")),
        "brand_norm": quote_plus(product.get("brand_norm", "")),
        "article": quote_plus(product.get("article_norm", "")),
        "article_raw": quote_plus(product.get("article_original", "")),
        "article_url": quote_plus(product.get("article_original", "")),
        "partnumber": quote_plus(product.get("article_original", "")),
        "partnumber_norm": quote_plus(product.get("article_norm", "")),
    }

    try:
        url = template.format(**values)
    except KeyError:
        return ""

    return url if url.startswith(("http://", "https://")) else ""


def partsapi_call(method: str, key: str, params: dict[str, Any]) -> Any:
    endpoint = os.getenv("PARTSAPI_ENDPOINT", "https://api.partsapi.ru").strip()
    response = make_session().get(
        endpoint,
        params={"method": method, "key": key, **params},
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()

    if isinstance(data, dict):
        for wrapper_key in ("data", "result", "items", "response", "rows"):
            if wrapper_key in data:
                return data[wrapper_key]

    return data


def ensure_rows(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [row for row in value if isinstance(row, dict)]
    if isinstance(value, dict):
        return [value]
    return []


def media_url(source: str) -> str:
    source = str(source or "").strip()
    if not source:
        return ""
    if source.startswith(("http://", "https://")):
        return source
    return urljoin(os.getenv("PARTSAPI_MEDIA_BASE_URL", "https://api.partsapi.ru").rstrip("/") + "/", source)


def pick_media_image(rows: list[dict[str, Any]]) -> str:
    candidates: list[tuple[int, str]] = []

    for row in rows:
        source = media_url(str(row.get("ART_MEDIA_SOURCE", "") or ""))
        media_type = str(row.get("ART_MEDIA_TYPE", "") or "").lower()

        if not source:
            continue

        score = 0
        if media_type in {"jpeg", "jpg", "png", "webp", "gif", "bmp", "3", "5", "6", "7"}:
            score += 50
        if re.search(r"\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)", source, flags=re.I):
            score += 30
        if "logo" in source.lower() or "youtube" in source.lower():
            score -= 60

        if score > 0:
            candidates.append((score, source))

    candidates.sort(reverse=True)
    return candidates[0][1] if candidates else ""


def find_partsapi_image(product: dict[str, Any], budget: dict[str, int]) -> str:
    search_key = os.getenv("PARTSAPI_KEY_SEARCH_ARTICLES", "").strip()
    media_key = os.getenv("PARTSAPI_KEY_GET_ARTICLE_MEDIA", "").strip()

    if not search_key or not media_key:
        return ""

    if budget["used"] + 2 > budget["max"]:
        return ""

    lang = os.getenv("PARTSAPI_LANG", "16")
    budget["used"] += 1
    rows = ensure_rows(
        partsapi_call(
            "searchArticles",
            search_key,
            {"SEARCH_NUMBER": product["article_original"], "LANG": lang},
        )
    )

    best = None

    for row in rows:
        article = normalize_article(row.get("ART_ARTICLE_NR"))
        brand = normalize_brand(row.get("ART_SUP_BRAND"))

        if article == product["article_norm"] and brand == product["brand_norm"]:
            best = row
            break

    if not best:
        return ""

    art_id = best.get("ART_ID")
    if not art_id:
        return ""

    budget["used"] += 1
    media_rows = ensure_rows(
        partsapi_call(
            "getArticleMedia",
            media_key,
            {"ART_ID": art_id, "LANG": lang},
        )
    )
    return pick_media_image(media_rows)


def product_image_queries(product: dict[str, Any]) -> list[str]:
    brand = str(product.get("brand", "") or "").strip()
    article = str(product.get("article_original", "") or "").strip()
    name = str(product.get("name", "") or "").strip()

    queries = [
        f"{brand} {article} автозапчасть фото",
        f"{brand} {article} {name} фото",
        f"{brand} {article}",
    ]

    clean: list[str] = []
    seen = set()
    for query in queries:
        query = re.sub(r"\s+", " ", query).strip()
        if query and query.lower() not in seen:
            clean.append(query)
            seen.add(query.lower())

    return clean


def decode_js_url(value: str) -> str:
    value = html.unescape(value)
    try:
        return json.loads(f'"{value}"')
    except Exception:
        return value.replace("\\/", "/")


def duckduckgo_image_urls(query: str, limit: int) -> list[str]:
    session = make_session()
    response = session.get(
        "https://duckduckgo.com/",
        params={"q": query},
        headers=WEB_IMAGE_HEADERS,
        timeout=20,
    )
    if response.status_code != 200:
        return []

    match = re.search(r'vqd=["\']?([0-9-]+)["\']?', response.text)
    if not match:
        match = re.search(r"vqd=([0-9-]+)&", response.text)
    if not match:
        return []

    api_response = session.get(
        "https://duckduckgo.com/i.js",
        params={
            "l": "ru-ru",
            "o": "json",
            "q": query,
            "vqd": match.group(1),
            "f": ",,,",
            "p": "1",
        },
        headers={**WEB_IMAGE_HEADERS, "Referer": response.url},
        timeout=20,
    )
    if api_response.status_code != 200:
        return []

    try:
        data = api_response.json()
    except ValueError:
        return []

    urls: list[str] = []
    for row in data.get("results", []):
        if isinstance(row, dict):
            url = str(row.get("image", "") or "").strip()
            if url.startswith(("http://", "https://")):
                urls.append(url)
        if len(urls) >= limit:
            break

    return urls


def bing_image_urls(query: str, limit: int) -> list[str]:
    response = make_session().get(
        "https://www.bing.com/images/search",
        params={"q": query, "first": 1},
        headers=WEB_IMAGE_HEADERS,
        timeout=20,
    )
    if response.status_code != 200:
        return []

    urls: list[str] = []
    seen = set()
    patterns = [
        r'"murl"\s*:\s*"([^"]+)"',
        r"&quot;murl&quot;\s*:\s*&quot;([^&]+)&quot;",
    ]

    for pattern in patterns:
        for match in re.finditer(pattern, response.text):
            url = decode_js_url(match.group(1)).strip()
            if url.startswith(("http://", "https://")) and url not in seen:
                urls.append(url)
                seen.add(url)
            if len(urls) >= limit:
                return urls

    return urls


def yandex_image_urls(query: str, limit: int) -> list[str]:
    response = make_session().get(
        "https://yandex.ru/images/search",
        params={"text": query},
        headers=WEB_IMAGE_HEADERS,
        timeout=20,
    )
    if response.status_code != 200:
        return []

    urls: list[str] = []
    seen = set()

    for raw in re.findall(r"img_url=([^&\"'<>]+)", response.text):
        url = unquote(html.unescape(raw)).strip()
        if url.startswith(("http://", "https://")) and url not in seen:
            urls.append(url)
            seen.add(url)
        if len(urls) >= limit:
            return urls

    for raw_href in re.findall(r'href="([^"]*img_url=[^"]+)"', response.text):
        query_string = urlparse(html.unescape(raw_href)).query
        url = parse_qs(query_string).get("img_url", [""])[0].strip()
        if url.startswith(("http://", "https://")) and url not in seen:
            urls.append(url)
            seen.add(url)
        if len(urls) >= limit:
            return urls

    return urls


def looks_like_bad_image_url(url: str) -> bool:
    text = url.lower()
    bad_markers = (
        "logo",
        "placeholder",
        "no-photo",
        "nophoto",
        "no_image",
        "noimage",
        "youtube",
        "sprite",
        "favicon",
        "avatar",
    )
    return any(marker in text for marker in bad_markers)


def find_web_image(product: dict[str, Any], max_candidates: int) -> str:
    seen = set()

    for query in product_image_queries(product):
        candidates: list[str] = []

        for searcher in (yandex_image_urls, duckduckgo_image_urls, bing_image_urls):
            try:
                candidates.extend(searcher(query, max_candidates))
            except Exception:
                continue

        for url in candidates:
            if url in seen:
                continue
            seen.add(url)
            if looks_like_bad_image_url(url):
                continue
            return url

    return ""


def enrich_images(args: argparse.Namespace) -> None:
    catalog_dir = Path(args.catalog)
    products = read_json(catalog_dir / "products.json", {})
    offers = read_json(catalog_dir / "supplier_offers.json", {})
    images = read_json(catalog_dir / "product_images.json", {})
    tasks = read_json(catalog_dir / "image_tasks.json", {})
    overrides = read_json(Path(args.overrides), {})
    template = os.getenv("ROSSKO_IMAGE_URL_TEMPLATE", "").strip()
    budget = {"max": args.partsapi_budget, "used": 0}

    offers_by_product: dict[str, dict[str, Any]] = {}
    for offer in offers.values():
        offers_by_product.setdefault(offer["product_id"], offer)

    checked = 0
    found = 0

    def flush_images() -> None:
        write_json(catalog_dir / "products.json", products)
        write_json(catalog_dir / "product_images.json", images)
        write_json(catalog_dir / "image_tasks.json", tasks)

    for product in products.values():
        if checked >= args.limit:
            break

        if product.get("main_image_id") and product.get("main_image_id") in images:
            continue

        offer = offers_by_product.get(product["id"])
        checked += 1
        source_url = ""
        source = ""
        confidence = 0

        for key in image_override_keys(product, offer):
            if key in overrides:
                value = overrides[key]
                source_url = value.get("image_url", "") if isinstance(value, dict) else str(value)
                source = "override"
                confidence = 100
                break

        if not source_url:
            source_url = apply_url_template(template, product, offer)
            source = "url_template" if source_url else ""
            confidence = 100 if source_url else 0

        if not source_url and args.use_web_search:
            source_url = find_web_image(product, args.web_candidates)
            source = "web_image_search" if source_url else ""
            confidence = 45 if source_url else 0

        if not source_url and args.use_partsapi:
            try:
                source_url = find_partsapi_image(product, budget)
                source = "partsapi_tecdoc" if source_url else ""
                confidence = 90 if source_url else 0
            except Exception as exc:
                tasks[product["id"]] = {
                    "product_id": product["id"],
                    "reason": f"partsapi_error: {exc}",
                    "status": "open",
                    "updated_at": datetime.now().isoformat(timespec="seconds"),
                }

        if source_url:
            image_id = add_image(
                images=images,
                product=product,
                source=source,
                source_url=source_url,
                confidence=confidence,
                download=not args.no_download,
                catalog_dir=catalog_dir,
            )
            if image_id:
                found += 1
                tasks.pop(product["id"], None)
                print(f"[image] {product['brand']} {product['article_original']} -> {source}")
                flush_images()
                continue

        product["image_status"] = "missing"
        tasks[product["id"]] = {
            "product_id": product["id"],
            "brand": product["brand"],
            "article": product["article_original"],
            "name": product.get("name", ""),
            "reason": "image_not_found",
            "status": "open",
            "updated_at": datetime.now().isoformat(timespec="seconds"),
        }
        flush_images()

    flush_images()
    print(f"Checked: {checked}, found: {found}, PartsAPI used: {budget['used']}/{budget['max']}")


def money(value: Any) -> str:
    if value in (None, ""):
        return "Цена по запросу"
    try:
        return f"{float(value):,.0f} ₽".replace(",", " ")
    except Exception:
        return str(value)


def render_cards(args: argparse.Namespace) -> None:
    catalog_dir = Path(args.catalog)
    output_dir = Path(args.output)
    products = read_json(catalog_dir / "products.json", {})
    offers = read_json(catalog_dir / "supplier_offers.json", {})
    images = read_json(catalog_dir / "product_images.json", {})
    output_dir.mkdir(parents=True, exist_ok=True)

    rows = []

    for offer in offers.values():
        product = products.get(offer["product_id"])
        if not product:
            continue

        image = images.get(product.get("main_image_id", ""))
        image_src = ""

        if image:
            local = str(image.get("storage_path", "") or "")
            if local:
                local_path = Path(local)
                if not local_path.is_absolute():
                    local_path = (Path.cwd() / local_path).resolve()
                try:
                    image_src = Path(os.path.relpath(local_path, output_dir.resolve())).as_posix()
                except ValueError:
                    image_src = local_path.as_posix()
            else:
                image_src = str(image.get("source_url", "") or "")

        rows.append((product, offer, image_src))

    rows.sort(key=lambda item: (item[1].get("price_min") is None, item[1].get("price_min") or 0))
    rows = rows[: args.limit]

    cards = []
    for product, offer, image_src in rows:
        title = html.escape(product.get("name") or offer.get("raw_name") or "")
        brand = html.escape(product.get("brand", ""))
        article = html.escape(product.get("article_original", ""))
        price = html.escape(money(offer.get("price_min")))
        stock = html.escape(str(offer.get("stock_total", 0)))
        delivery = offer.get("delivery_min_days")
        delivery_text = "Сегодня" if delivery == 0 else f"{delivery} дн." if delivery is not None else "Уточнить"

        if image_src:
            image_block = f'<img src="{html.escape(image_src)}" alt="{brand} {article}" loading="lazy">'
            badge = "Фото найдено"
        else:
            image_block = '<div class="placeholder">Фото в очереди</div>'
            badge = "Нет фото"

        cards.append(
            f"""
            <article class="card">
              <div class="image">{image_block}<span>{badge}</span></div>
              <div class="body">
                <div class="brand">{brand}</div>
                <h2>{title}</h2>
                <div class="article">{article}</div>
                <div class="price">{price}</div>
                <div class="meta">
                  <b>{stock} шт.</b>
                  <b>{html.escape(delivery_text)}</b>
                </div>
              </div>
            </article>
            """
        )

    doc = f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Автобакс каталог</title>
  <style>
    body {{ margin:0; background:#111; color:#fff; font-family:Arial,sans-serif; }}
    main {{ max-width:1400px; margin:0 auto; padding:28px; }}
    h1 {{ margin:0 0 24px; font-size:34px; }}
    .grid {{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }}
    .card {{ background:#1b1b1b; border:1px solid #333; border-radius:8px; overflow:hidden; }}
    .image {{ position:relative; height:210px; background:#fff; display:flex; align-items:center; justify-content:center; }}
    .image img {{ width:100%; height:100%; object-fit:contain; padding:18px; box-sizing:border-box; }}
    .image span {{ position:absolute; top:10px; right:10px; background:#ffd400; color:#111; padding:6px 8px; border-radius:6px; font-size:11px; font-weight:700; }}
    .placeholder {{ color:#222; font-weight:800; }}
    .body {{ padding:16px; }}
    .brand {{ color:#ffd400; font-weight:800; font-size:13px; text-transform:uppercase; }}
    h2 {{ min-height:52px; margin:10px 0; font-size:18px; line-height:1.2; }}
    .article {{ color:#aaa; font-weight:700; }}
    .price {{ margin:16px 0; color:#ffd400; font-size:28px; font-weight:900; }}
    .meta {{ display:flex; justify-content:space-between; gap:10px; color:#ddd; }}
    @media (max-width:1000px) {{ .grid {{ grid-template-columns:repeat(2,minmax(0,1fr)); }} }}
    @media (max-width:560px) {{ main {{ padding:14px; }} .grid {{ grid-template-columns:1fr; }} }}
  </style>
</head>
<body>
  <main>
    <h1>Автобакс каталог</h1>
    <section class="grid">{''.join(cards)}</section>
  </main>
</body>
</html>"""

    (output_dir / "cards.html").write_text(doc, encoding="utf-8")
    print(f"Rendered: {output_dir / 'cards.html'}")


def generate_rossko_queries(args: argparse.Namespace) -> None:
    queries = build_rossko_queries(args)
    output = safe_cli_path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(queries) + "\n", encoding="utf-8")
    print(f"Generated queries: {len(queries)}")
    print(f"Saved: {output}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    sync = sub.add_parser("sync-rossko")
    sync.add_argument("--catalog", default=str(CATALOG_DIR))
    sync.add_argument("--queries", default="seed_queries.txt")
    sync.add_argument("--limit", type=int, default=50)
    sync.add_argument("--delay", type=float, default=0.8)
    sync.add_argument("--include-crosses", action="store_true")
    sync.add_argument("--partsapi-categories", default="")
    sync.add_argument("--max-category-queries", type=int, default=0)
    sync.add_argument("--include-default-queries", action="store_true")
    sync.add_argument("--include-default-brands", action="store_true")
    sync.add_argument("--expand-brands", action="store_true")
    sync.add_argument("--brands", default="")
    sync.add_argument("--article-prefixes", action="store_true")
    sync.add_argument("--prefix-min-length", type=int, default=2)
    sync.add_argument("--prefix-max-length", type=int, default=3)
    sync.add_argument("--max-queries", type=int, default=0)
    sync.add_argument("--query-output", default="")
    sync.add_argument("--resume", action=argparse.BooleanOptionalAction, default=True)
    sync.add_argument("--continue-on-error", action=argparse.BooleanOptionalAction, default=True)

    enrich = sub.add_parser("enrich-images")
    enrich.add_argument("--catalog", default=str(CATALOG_DIR))
    enrich.add_argument("--limit", type=int, default=50)
    enrich.add_argument("--overrides", default="image_overrides.json")
    enrich.add_argument("--use-web-search", action="store_true")
    enrich.add_argument("--web-candidates", type=int, default=8)
    enrich.add_argument("--use-partsapi", action="store_true")
    enrich.add_argument("--partsapi-budget", type=int, default=10)
    enrich.add_argument("--no-download", action="store_true")

    render = sub.add_parser("render-cards")
    render.add_argument("--catalog", default=str(CATALOG_DIR))
    render.add_argument("--output", default=str(OUTPUT_DIR))
    render.add_argument("--limit", type=int, default=100)

    query_gen = sub.add_parser("generate-rossko-queries")
    query_gen.add_argument("--queries", default="seed_queries.txt")
    query_gen.add_argument("--output", default=str(CATALOG_DIR / "rossko_bulk_queries.txt"))
    query_gen.add_argument("--partsapi-categories", default=str(CATALOG_DIR / "partsapi_categories.json"))
    query_gen.add_argument("--max-category-queries", type=int, default=0)
    query_gen.add_argument("--include-default-queries", action=argparse.BooleanOptionalAction, default=True)
    query_gen.add_argument("--include-default-brands", action=argparse.BooleanOptionalAction, default=True)
    query_gen.add_argument("--expand-brands", action=argparse.BooleanOptionalAction, default=True)
    query_gen.add_argument("--brands", default="")
    query_gen.add_argument("--article-prefixes", action=argparse.BooleanOptionalAction, default=False)
    query_gen.add_argument("--prefix-min-length", type=int, default=2)
    query_gen.add_argument("--prefix-max-length", type=int, default=3)
    query_gen.add_argument("--max-queries", type=int, default=0)
    query_gen.add_argument("--query-output", default="")

    return parser.parse_args()


def main() -> None:
    load_dotenv()
    args = parse_args()

    if args.command == "sync-rossko":
        sync_rossko(args)
    elif args.command == "enrich-images":
        enrich_images(args)
    elif args.command == "render-cards":
        render_cards(args)
    elif args.command == "generate-rossko-queries":
        generate_rossko_queries(args)


if __name__ == "__main__":
    main()
