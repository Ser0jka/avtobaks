# Avtobaks catalog

Проект собирает локальную JSON-базу товаров из Rossko и отдельно ведет слой фотографий. Главная идея: не привязывать карточку товара к одному поставщику или одному API. Rossko дает цены, остатки и артикулы, а фото подтягиваются отдельными правилами и сохраняются в каталог.

## Файлы данных

- `catalog/products.json` - мастер-товары по нормализованной паре бренд + артикул.
- `catalog/supplier_offers.json` - предложения Rossko: цена, остатки, срок, guid.
- `catalog/product_images.json` - найденные или вручную заданные изображения.
- `catalog/image_tasks.json` - очередь товаров, где фото пока не найдено.
- `catalog/image_files/` - локально скачанные изображения.

Все эти файлы можно редактировать и бэкапить как обычный JSON.

## Команды

Собрать товары из Rossko по запросам из `seed_queries.txt`:

```powershell
.\.venv\Scripts\python.exe main.py sync-rossko --limit 50 --include-crosses
```

Найти изображения без дорогих API, используя ручные ссылки и шаблон URL:

```powershell
.\.venv\Scripts\python.exe main.py enrich-images --limit 50
```

Попробовать бесплатный web-поиск картинок по названию/бренду/артикулу:

```powershell
.\.venv\Scripts\python.exe main.py enrich-images --limit 20 --use-web-search --web-candidates 8
```

Точечно включить PartsAPI, когда есть бюджет запросов:

```powershell
.\.venv\Scripts\python.exe main.py enrich-images --limit 20 --use-partsapi --partsapi-budget 5
```

Сгенерировать HTML-карточки:

```powershell
.\.venv\Scripts\python.exe main.py render-cards --limit 100
```

## Фото

Самый надежный путь сейчас: найти реальный URL фото, который использует сайт Rossko или другой поставщик, и добавить его в `image_overrides.json`. Скрипт применит его к мастер-товару, скачает файл в `catalog/image_files/` и дальше карточка не будет зависеть от внешнего сайта.

Web-поиск через `--use-web-search` бесплатный, но не стопроцентный: поисковики могут менять выдачу, блокировать запросы или отдавать не ту картинку. Поэтому найденные таким способом изображения сохраняются с низкой уверенностью, а важные карточки лучше проверять глазами.

Формат `image_overrides.json`:

```json
{
  "hng:12110": "https://example.com/image.jpg"
}
```

Ключ можно писать как `brand:article`, например `hng:12110`. Артикул нормализуется: пробелы, дефисы и точки не важны.

Если получится добыть закономерный URL Rossko CDN, добавь в `.env`:

```env
ROSSKO_IMAGE_URL_TEMPLATE=https://.../{brand}/{article}.jpg
```

Поддерживаются плейсхолдеры `{brand}`, `{brand_raw}`, `{brand_norm}`, `{article}`, `{article_raw}`, `{article_url}`, `{offer_guid}`, `{guid}`, `{partnumber}`, `{partnumber_norm}`.

## VIN-подбор

Отдельный экспериментальный скрипт `vin_selection.py` делает полуавтоматический подбор:

1. расшифровывает VIN через бесплатный VIN decoder;
2. берет OE-номера из аргумента `--oe` или из `catalog/vin_oe_map.json`;
3. ищет предложения Rossko по OE;
4. сохраняет результат в `catalog/vin_selections.json`;
5. генерирует HTML в `output/vin_selections/`.

Пример с точным OE-номером:

```powershell
.\.venv\Scripts\python.exe vin_selection.py --vin 4T1BF1FK5HU765764 --parts "масляный фильтр" --oe 90915YZZE1 --limit-per-target 5 --include-crosses
```

Пример через PartsAPI VIN:

```powershell
.\.venv\Scripts\python.exe vin_selection.py --vin Z8TXLCW6WCM902224 --parts "масляный фильтр" --use-partsapi-vin --use-partsapi-oe-decode --partsapi-cat 7 --limit-per-target 1
```

`cat` - это ID группы из `catalog/partsapi_categories.json`, который собран из XLSX "Категории запчастей". Для масляного фильтра ID группы `7`.

`type` указывается только для оригинальных запчастей:

```powershell
.\.venv\Scripts\python.exe vin_selection.py --vin Z8TXLCW6WCM902224 --parts "масляный фильтр" --use-partsapi-vin --partsapi-type oem --partsapi-cat 7
```

Если нужны неоригинальные запчасти, `--partsapi-type` не указывается.

`VINdecode` и `VINdecodeOE` уже проверены: они возвращают TecDoc-автомобиль и OEM-расшифровку. `getPartsbyVIN` с `cat=7` сейчас отвечает ошибкой/таймаутом на тестовом VIN, поэтому скрипт безопасно пишет предупреждение и не роняет весь прогон.

Рабочий тестовый пример:

```powershell
.\.venv\Scripts\python.exe vin_selection.py --vin Z8TXLCW6WCM902224 --parts "воздушный фильтр" --use-partsapi-vin --partsapi-type oem --partsapi-cat 8 --partsapi-preferred-brand MITSUBISHI --max-partsapi-parts 3 --limit-per-target 1
```

Этот пример берет из PartsAPI OEM-номера воздушного фильтра (`1500A023`, `1500A086`, `1500A190`) и ищет по ним предложения Rossko. Если live-ключ PartsAPI временно недоступен, скрипт использует сохраненный ответ `catalog/partsapi_getPartsbyVIN_cat8_response.json`, чтобы не жечь лимиты при разработке.

Пример низкоуверенного текстового поиска без OE:

```powershell
.\.venv\Scripts\python.exe vin_selection.py --vin 4T1BF1FK5HU765764 --parts "масляный фильтр" --allow-text-fallback --limit-per-target 3
```

Важно: VIN decoder не возвращает OE-номера деталей. Точный подбор начинается там, где есть OE из OEM/EPC-каталога, Laximo/TecDoc/другого каталога или от менеджера.
