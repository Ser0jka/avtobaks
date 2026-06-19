# Массовая загрузка Rossko

Rossko в текущем прототипе работает через `GetSearch`: API ищет по тексту/артикулу и не отдает одним методом полный дамп всего каталога. Поэтому массовая загрузка делается широким набором поисковых запросов:

- базовые ходовые детали;
- все названия и связки из `catalog/partsapi_categories.json`;
- расширение запросов по популярным маркам авто;
- кроссы Rossko;
- resume-state в `catalog/rossko_sync_state.json`, чтобы долгий прогон можно было продолжать.

## Быстрый старт из корня Next-проекта

```powershell
pnpm rossko:queries
pnpm rossko:sync:bulk
pnpm catalog:import
```

После этого товары попадут в базу Next-сайта и станут видны в админке и каталоге.

## Очень большой прогон

```powershell
pnpm rossko:sync:huge
pnpm catalog:import
```

`huge` ставит лимит до 250 000 предложений и меньшую задержку. Его лучше запускать отдельно и надолго: Rossko может ограничивать частоту, часть запросов может падать по таймауту. Ошибки пишутся в `catalog/rossko_sync_state.json`, синк продолжает работу.

## Ручной запуск внутри `Avtobaks_API`

```powershell
.\.venv\Scripts\python.exe main.py sync-rossko `
  --partsapi-categories catalog\partsapi_categories.json `
  --include-default-queries `
  --include-default-brands `
  --expand-brands `
  --include-crosses `
  --limit 50000 `
  --delay 0.6 `
  --query-output catalog\rossko_bulk_queries.txt `
  --continue-on-error
```

Для нового полного прогона можно удалить `catalog/rossko_sync_state.json`; для продолжения ничего удалять не нужно.
