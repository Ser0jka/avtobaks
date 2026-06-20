# Catalog Platform

Цель архитектуры: сайт остается легким Next.js-приложением, а тяжелая работа с каталогом, поставщиками, фото и очередями может жить на отдельном сервере с большим диском.

## Роли серверов

### Site server

Этот проект:

- рендерит страницы;
- принимает пользовательские действия;
- читает готовые товары через `src/lib/catalogService.ts`;
- проксирует админские операции через `src/lib/catalogAdminProxy.ts`, если настроен внешний каталог-сервер;
- не должен сам регулярно ходить в Rossko/PartsAPI за полным каталогом.

### Catalog server

Будущий отдельный сервер:

- хранит PostgreSQL с товарами, офферами, фото и очередями;
- хранит файлы фото на диске или в S3-compatible хранилище;
- запускает воркеры синка поставщиков;
- запускает воркеры поиска и скачивания фото;
- отдает сайту готовый публичный API каталога;
- отдает админский API для редактирования карточек и управления импортом.

## Переключение сайта

Без переменных сайт работает локально:

1. `Avtobaks_API/catalog/*.json`
2. Prisma
3. статические демо-товары

Для внешнего каталога:

```env
CATALOG_SERVICE_URL=https://catalog.example.com/api/public
CATALOG_SERVICE_TOKEN=...

CATALOG_ADMIN_SERVICE_URL=https://catalog.example.com/api/admin
CATALOG_ADMIN_SERVICE_TOKEN=...
```

## Public Catalog API

`CATALOG_SERVICE_URL` должен поддерживать:

```http
GET /products?q=&category=&limit=
GET /products/:id
```

`GET /products` возвращает массив или объект `{ "items": [...] }`.

Минимальная форма товара:

```json
{
  "id": "prd_...",
  "title": "Фильтр масляный",
  "article": "W914/2",
  "brand": "MANN",
  "category": "Фильтры",
  "description": "...",
  "price": 680,
  "oldPrice": null,
  "inStock": true,
  "stockCount": 12,
  "image": "https://catalog-cdn.example.com/products/...",
  "rating": 4.8,
  "reviews": 0,
  "deliveryDays": 1
}
```

`GET /products/:id` возвращает то же плюс:

```json
{
  "priceMax": 900,
  "images": ["https://..."],
  "warehouses": [
    {
      "supplier": "rossko",
      "price": 680,
      "stock": 12,
      "delivery": 1,
      "warehouse": "Кемерово"
    }
  ]
}
```

## Admin Catalog API

`CATALOG_ADMIN_SERVICE_URL` должен поддерживать:

```http
GET /catalog?q=
PATCH /catalog/:id
POST /catalog/import
```

Сейчас локальный fallback продолжает использовать Prisma-модели `CatalogProduct` и `SupplierOffer`.

## Worker Pipeline

Рекомендуемый цикл на catalog server:

1. `supplier-sync-worker`
   - получает данные Rossko/других поставщиков;
   - сохраняет сырой ответ;
   - делает upsert офферов пачками;
   - помечает отсутствующие офферы как `stale`, а не удаляет сразу.

2. `product-normalizer`
   - объединяет офферы в мастер-товары по `normalized_brand + normalized_article`;
   - обновляет агрегированные поля товара: минимальную цену, остаток, срок доставки.

3. `image-worker`
   - берет только товары без `primary_image_id`;
   - сначала ищет переиспользуемое фото по артикулу/кроссам;
   - затем PartsAPI/TecDoc/поставщик;
   - web-search использует последним;
   - сохраняет оригинал и производные размеры;
   - пишет `image_status`.

4. `vin-worker`
   - обрабатывает VIN-заявки;
   - получает OEM через PartsAPI;
   - ищет предложения в локальном каталоге;
   - отдает менеджеру готовую подборку.

## Важные правила производительности

- Не искать фото во время синка поставщика.
- Не искать фото повторно, если у товара уже есть подтвержденное изображение.
- Не запускать web-search для всех товаров сразу: сначала товары в наличии, популярные категории, VIN-заявки и открытые карточки.
- Все длинные процессы должны иметь `status`, `attempts`, `next_attempt_at` и быть продолжабельными после остановки.
- Файлы фото хранить вне Postgres; в БД хранить URL, hash, source и статус.

## Текущий статус в этом репозитории

Уже подготовлено:

- `src/lib/catalogService.ts` — единая точка чтения публичного каталога.
- `src/lib/catalogAdminProxy.ts` — переключатель админских операций на внешний каталог-сервер.
- `src/lib/catalogJson.ts` — локальный JSON fallback с авто-инвалидацией кеша по изменению файлов.
- `/api/catalog/products` и `/api/catalog/products/:id` больше не знают напрямую о JSON/Prisma.

Следующий крупный шаг: вынести `Avtobaks_API` в отдельное приложение catalog server с собственной БД, job-таблицами и worker-командами.
