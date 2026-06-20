"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { useGarage, type GarageCar } from "@/context/GarageContext";
import styles from "./page.module.css";

// ── Типы ответа API ───────────────────────────────────────────
type VinApiResult = {
  vin: string;
  valid: boolean;
  manufacturer: string | null;
  model: string | null;
  year: number | null;
  possibleYears: number[];
  country: string | null;
  engine: string | null;
  modification: string | null;
  market: string | null;
  released: string | null;
  transmission: string | null;
  drive: string | null;
  confidence: number;
  source?: string;
  yearUnknown?: boolean;
};

// ── Хелперы ───────────────────────────────────────────────────
function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ── NHTSA API (клиентская сторона, бесплатно) ────────────────
async function fetchNhtsaVin(vin: string): Promise<{ make: string | null; model: string | null; year: number | null }> {
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { make: null, model: null, year: null };
    const data = await res.json();
    const results: { Variable: string; Value: string }[] = data.Results ?? [];
    const get = (name: string) => results.find(r => r.Variable === name)?.Value || null;
    const make = get("Make");
    const model = get("Model");
    const yearStr = get("Model Year");
    const year = yearStr && yearStr !== "0" ? parseInt(yearStr) : null;
    // NHTSA возвращает "0" или пустое для неизвестных
    if (!make || make === "0") return { make: null, model: null, year: null };
    return { make, model, year };
  } catch {
    return { make: null, model: null, year: null };
  }
}

// ── Фото через Wikimedia Commons ──────────────────────────────
// Нормализуем марку для поиска (убираем "(Россия)" и т.п.)
function cleanMakeForSearch(make: string): string {
  return make.replace(/\s*\(.*?\)/g, "").trim();
}

async function fetchCarImage(make: string, model: string, year: number | null): Promise<string | null> {
  if (!make) return null;

  const cleanMake = cleanMakeForSearch(make);

  const queries: string[] = [];
  if (model) {
    // Точные запросы с моделью
    if (year) queries.push(`${cleanMake} ${model} ${year}`);
    queries.push(`${cleanMake} ${model}`);
    // Пробуем только модель если марка плохо ищется
    queries.push(`${model} automobile`);
  }
  queries.push(`${cleanMake} automobile`);

  for (const q of queries) {
    try {
      // Ищем статью
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=3&format=json&origin=*`;
      const sr = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
      const sj = await sr.json();
      const results: { title: string }[] = sj.query?.search ?? [];

      for (const result of results) {
        const title = result.title;
        // Пропускаем статьи-списки и исторические страницы
        if (/^List of|history|company|manufacturer/i.test(title)) continue;

        // Берём thumbnail страницы
        const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=600&format=json&origin=*`;
        const ir = await fetch(imgUrl, { signal: AbortSignal.timeout(5000) });
        const ij = await ir.json();
        const pages = Object.values(ij.query?.pages ?? {}) as { thumbnail?: { source: string } }[];
        const thumb = pages[0]?.thumbnail?.source;
        if (thumb) return thumb;
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ── Icons ─────────────────────────────────────────────────────
function CarIcon() {
  return (
    <svg viewBox="0 0 64 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="16" width="56" height="18" rx="4"/>
      <path d="M12 16l7-12h26l7 12"/>
      <circle cx="16" cy="34" r="5"/><circle cx="48" cy="34" r="5"/>
      <path d="M21 34h22M4 24h4M56 24h4"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

// ── VIN Preview ───────────────────────────────────────────────
type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; data: VinApiResult; imageUrl: string | null }
  | { status: "error"; message: string };

function VinPreview({
  preview,
  onConfirm,
}: {
  preview: PreviewState;
  onConfirm: (make: string, model: string, year: number | null) => void;
}) {
  if (preview.status === "idle") return null;

  if (preview.status === "loading") {
    return (
      <div className={styles.vinPreview}>
        <div className={styles.vinPreviewLoading}>
          <div className={styles.miniSpinner} />
          Определяем автомобиль...
        </div>
      </div>
    );
  }

  if (preview.status === "error") {
    return (
      <div className={styles.vinPreview}>
        <p className={styles.vinPreviewError}>{preview.message}</p>
      </div>
    );
  }

  const { data, imageUrl } = preview;
  const make = data.manufacturer ?? "";
  const model = data.model ?? "";
  const year = data.year;

  return (
    <div className={styles.vinPreview}>
      {imageUrl && (
        <div className={styles.vinPreviewImgWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={`${make} ${model}`} className={styles.vinPreviewImg} />
        </div>
      )}
      <div className={styles.vinPreviewInfo}>
        <div className={styles.vinPreviewHeader}>
          <div>
            <p className={styles.vinPreviewMake}>{make || "Неизвестно"}</p>
            {model && <p className={styles.vinPreviewModel}>{model}</p>}
          </div>
          {data.confidence >= 0.9 && (
            <span className={styles.vinPreviewConfidence}>
              <CheckIcon /> Точно
            </span>
          )}
        </div>
        <div className={styles.vinPreviewMeta}>
          {year && <span className={styles.vinPreviewBadge}>{year} г.</span>}
          {data.yearUnknown && (
            <span className={styles.vinPreviewBadgeGray}>год — укажите вручную</span>
          )}
          {data.country && <span className={styles.vinPreviewBadgeGray}>{data.country}</span>}
          {data.engine && <span className={styles.vinPreviewBadgeGray}>{data.engine}</span>}
          {data.modification && <span className={styles.vinPreviewBadgeGray}>{data.modification}</span>}
        </div>

        {make && (
          <>
            <p className={styles.vinPreviewQuestion}>Это ваш автомобиль?</p>
            <div className={styles.vinPreviewActions}>
              <button
                type="button"
                className={styles.btnConfirm}
                onClick={() => onConfirm(make, model, year)}
              >
                <CheckIcon /> Да, верно
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Главная страница ──────────────────────────────────────────
export default function GaragePage() {
  const { cars, activeCar, setActiveCar, addCar, removeCar } = useGarage();

  const [vin, setVin] = useState("");
  const [manualBrand, setManualBrand] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [manualYear, setManualYear] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadPreview(vinVal: string) {
    setPreview({ status: "loading" });
    try {
      // Запускаем наш API и NHTSA параллельно
      const [res, nhtsa] = await Promise.all([
        fetch(`/api/garage/vin/${encodeURIComponent(vinVal)}`),
        fetchNhtsaVin(vinVal),
      ]);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setPreview({ status: "error", message: err.error ?? "Неверный VIN" });
        return;
      }
      const data: VinApiResult = await res.json();

      // Обогащаем данными от NHTSA если наш API чего-то не знает
      const merged: VinApiResult = {
        ...data,
        manufacturer: data.manufacturer ?? (nhtsa.make ? toTitleCase(nhtsa.make) : null),
        model: data.model ?? (nhtsa.model ? toTitleCase(nhtsa.model) : null),
        year: data.year ?? nhtsa.year,
        // NHTSA даёт точный год — повышаем confidence
        confidence: !data.manufacturer && nhtsa.make ? 0.85 : data.confidence,
      };

      // Фото запускаем после мержа
      const imageUrl = await fetchCarImage(
        merged.manufacturer ?? "",
        merged.model ?? "",
        merged.year
      ).catch(() => null);

      setPreview({ status: "done", data: merged, imageUrl });

      // Автозаполнение
      if (merged.manufacturer && !manualBrand) setManualBrand(merged.manufacturer);
      if (merged.model && !manualModel) setManualModel(merged.model);
      if (merged.year && !manualYear) setManualYear(String(merged.year));
    } catch {
      setPreview({ status: "error", message: "Не удалось определить автомобиль. Заполните вручную." });
    }
  }

  function handleVinChange(v: string) {
    const clean = v.replace(/[^A-Za-z0-9]/g, "").slice(0, 17).toUpperCase();
    setVin(clean);
    setFormError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (clean.length === 17) {
      debounceRef.current = setTimeout(() => loadPreview(clean), 500);
    } else {
      setPreview({ status: "idle" });
    }
  }

  function handleConfirm(make: string, model: string, year: number | null) {
    setManualBrand(make);
    setManualModel(model);
    if (year) setManualYear(String(year));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vin) { setFormError("Введите VIN-номер"); return; }
    if (vin.length < 6) { setFormError("VIN слишком короткий"); return; }

    const previewData = preview.status === "done" ? preview.data : null;
    const brand = manualBrand.trim() || previewData?.manufacturer || "Неизвестно";
    const model = manualModel.trim() || previewData?.model || "";
    const yearNum = manualYear ? parseInt(manualYear) : (previewData?.year ?? null);
    const label = [brand, model, yearNum].filter(Boolean).join(" ");

    addCar({ vin, brand, model, year: yearNum, label });
    setVin(""); setManualBrand(""); setManualModel(""); setManualYear("");
    setPreview({ status: "idle" });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.page}>
      <SiteHeader active="garage" />
      <div className={styles.wrap}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Главная</Link><span>/</span>
          <span>Мой гараж</span>
        </nav>

        <h1 className={styles.pageTitle}>Мой гараж</h1>
        <p className={styles.pageDesc}>
          Добавьте автомобиль по VIN — каталог будет подбирать подходящие запчасти автоматически.
        </p>

        <div className={styles.layout}>
          {/* ── Список машин ── */}
          <div className={styles.carsSection}>
            {cars.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}><CarIcon /></div>
                <p className={styles.emptyTitle}>Гараж пуст</p>
                <p className={styles.emptyDesc}>Добавьте первый автомобиль по VIN-номеру</p>
              </div>
            ) : (
              <div className={styles.carsList}>
                {cars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    isActive={activeCar?.id === car.id}
                    onActivate={() => setActiveCar(activeCar?.id === car.id ? null : car.id)}
                    onRemove={() => removeCar(car.id)}
                  />
                ))}
              </div>
            )}
            {activeCar && (
              <div className={styles.activeHint}>
                <CheckIcon />
                <span>
                  Активен: <strong>{activeCar.label || activeCar.vin}</strong>.{" "}
                  <Link href="/catalog" className={styles.hintLink}>Перейти в каталог →</Link>
                </span>
              </div>
            )}
          </div>

          {/* ── Форма ── */}
          <div className={styles.addCard}>
            <p className={styles.addTitle}>Добавить автомобиль</p>
            <form className={styles.form} onSubmit={handleSubmit}>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>VIN-номер *</label>
                <input
                  className={`${styles.input} ${styles.inputMono} ${formError ? styles.inputError : ""}`}
                  placeholder="WVWZZZ3CZWE123456"
                  value={vin}
                  maxLength={17}
                  onChange={(e) => handleVinChange(e.target.value)}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="characters"
                />
                {vin.length > 0 && vin.length < 17 && (
                  <div className={styles.fieldHint}>
                    {vin.length} / 17 символов
                    <span className={styles.vinProgress}>
                      {Array.from({ length: 17 }, (_, i) => (
                        <span key={i} className={`${styles.vinDot} ${i < vin.length ? styles.vinDotFilled : ""}`} />
                      ))}
                    </span>
                  </div>
                )}
                {formError && <p className={styles.fieldError}>{formError}</p>}
              </div>

              {/* Preview появляется автоматически после ввода 17 символов */}
              <VinPreview preview={preview} onConfirm={handleConfirm} />

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Марка</label>
                  <input className={styles.input} placeholder="Toyota, BMW..." value={manualBrand} onChange={(e) => setManualBrand(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Модель</label>
                  <input className={styles.input} placeholder="Camry, X5..." value={manualModel} onChange={(e) => setManualModel(e.target.value)} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Год выпуска</label>
                <input className={styles.input} type="number" placeholder="2020" min={1970} max={currentYear + 1} value={manualYear} onChange={(e) => setManualYear(e.target.value)} />
              </div>

              <button className={`${styles.btnAdd} ${added ? styles.btnAdded : ""}`} type="submit">
                {added ? (
                  <><CheckIcon /> Добавлено!</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Добавить в гараж
                  </>
                )}
              </button>
            </form>

            <div className={styles.vinHelp}>
              <p className={styles.vinHelpTitle}>Где найти VIN?</p>
              <ul>
                <li>Лобовое стекло (нижний левый угол)</li>
                <li>Табличка на двери водителя</li>
                <li>ПТС / СТС</li>
                <li>Страховой полис</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Car Card ──────────────────────────────────────────────────
function CarCard({
  car, isActive, onActivate, onRemove,
}: {
  car: GarageCar; isActive: boolean; onActivate: () => void; onRemove: () => void;
}) {
  return (
    <div className={`${styles.carCard} ${isActive ? styles.carCardActive : ""}`}>
      <div className={styles.carCardIcon}><CarIcon /></div>
      <div className={styles.carCardInfo}>
        <p className={styles.carCardLabel}>{car.label || car.vin}</p>
        <p className={styles.carCardVin}>VIN: {car.vin}</p>
        {car.year && <p className={styles.carCardYear}>{car.year} г.в.</p>}
      </div>
      <div className={styles.carCardActions}>
        <button
          className={`${styles.btnActivate} ${isActive ? styles.btnActivateOn : ""}`}
          onClick={onActivate}
        >
          {isActive ? "Активен" : "Выбрать"}
        </button>
        <Link href={`/catalog?q=${encodeURIComponent(car.brand)}`} className={styles.btnSearch}>
          Найти запчасти
        </Link>
        <button className={styles.btnRemove} onClick={onRemove} title="Удалить">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
