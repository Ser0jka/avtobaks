"use client";

import { useCallback, useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { useGarage } from "@/context/GarageContext";
import styles from "./page.module.css";

// Популярные группы запчастей с cat-кодами partsapi
const PART_CATEGORIES = [
  { id: "133", name: "Масляный фильтр" },
  { id: "8",   name: "Воздушный фильтр" },
  { id: "144", name: "Топливный фильтр" },
  { id: "7",   name: "Моторное масло" },
  { id: "82",  name: "Тормозной диск" },
  { id: "70",  name: "Тормозные колодки" },
  { id: "37",  name: "Амортизатор" },
  { id: "10",  name: "Ремень ГРМ" },
  { id: "4",   name: "Генератор" },
  { id: "2",   name: "Стартер" },
  { id: "132", name: "Масляный насос" },
  { id: "143", name: "Топливный насос" },
  { id: "56",  name: "Расширительный бачок" },
  { id: "48",  name: "Подшипник сцепления" },
  { id: "131", name: "Масляный радиатор" },
];

type VinInfo = {
  manufacturer: string | null;
  model: string | null;
  year: number | null;
  engine: string | null;
  modification: string | null;
  source: string;
};

type FormState = "idle" | "submitting" | "success" | "error";

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

function VinIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="10" width="28" height="14" rx="3"/>
      <path d="M6 10l4-6h12l4 6"/>
      <circle cx="8" cy="24" r="3"/><circle cx="24" cy="24" r="3"/>
      <path d="M11 24h10"/>
    </svg>
  );
}

export default function VinPage() {
  const { activeCar } = useGarage();

  const [vin, setVin] = useState(activeCar?.vin ?? "");
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [customPart, setCustomPart] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  const [vinInfo, setVinInfo] = useState<VinInfo | null>(null);
  const [vinLoading, setVinLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Если есть активная машина — грузим инфо сразу
  const loadVinInfo = useCallback(async (vinVal: string) => {
    setVinLoading(true);
    setVinInfo(null);
    try {
      const res = await fetch(`/api/garage/vin/${encodeURIComponent(vinVal)}`);
      if (!res.ok) { setVinLoading(false); return; }
      const data = await res.json();
      if (data.manufacturer) {
        setVinInfo({
          manufacturer: data.manufacturer,
          model: data.model,
          year: data.year,
          engine: data.engine,
          modification: data.modification,
          source: data.source,
        });
      }
    } catch { /* ignore */ }
    setVinLoading(false);
  }, []);

  useEffect(() => {
    if (activeCar?.vin && activeCar.vin.length === 17) {
      const timer = window.setTimeout(() => {
        void loadVinInfo(activeCar.vin);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [activeCar?.vin, loadVinInfo]);

  function handleVinChange(v: string) {
    const clean = v.replace(/[^A-Za-z0-9]/g, "").slice(0, 17).toUpperCase();
    setVin(clean);
    setVinInfo(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (clean.length === 17) {
      debounceRef.current = setTimeout(() => loadVinInfo(clean), 600);
    }
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const partName = selectedCat
    ? (PART_CATEGORIES.find(c => c.id === selectedCat)?.name ?? "")
    : customPart.trim();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vin || vin.length < 6) return;
    if (!partName) return;

    setFormState("submitting");

    const carLabel = vinInfo
      ? [vinInfo.manufacturer, vinInfo.model, vinInfo.year].filter(Boolean).join(" ")
      : (activeCar?.label ?? "");

    const body = {
      vin,
      car: carLabel || undefined,
      part: partName,
      catId: selectedCat || undefined,
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      comment: comment.trim() || undefined,
    };

    try {
      const res = await fetch("/api/vin-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setFormState("success");
      } else {
        setFormState("error");
      }
    } catch {
      setFormState("error");
    }
  }

  const isReady = vin.length >= 6 && partName.length > 0;

  return (
    <div className={styles.page}>
      <SiteHeader />
      <div className={styles.wrap}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Главная</Link><span>/</span>
          <span>Подбор по VIN</span>
        </nav>

        {/* ── Hero ── */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}><VinIcon /></div>
          <div>
            <h1 className={styles.heroTitle}>Подбор запчастей по VIN</h1>
            <p className={styles.heroSub}>
              С проверкой совместимости менеджером — подберём оригинальные и аналоговые детали точно под ваш автомобиль
            </p>
          </div>
        </div>

        {/* ── Как это работает ── */}
        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <p className={styles.stepText}>Вводите VIN и нужную деталь</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <p className={styles.stepText}>Менеджер проверяет совместимость по каталогам</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <p className={styles.stepText}>Получаете подборку с ценами и наличием</p>
          </div>
        </div>

        <div className={styles.layout}>
          {/* ── Форма ── */}
          <div className={styles.formCard}>
            {formState === "success" ? (
              <div className={styles.success}>
                <div className={styles.successIcon}><CheckIcon /></div>
                <h2 className={styles.successTitle}>Заявка принята!</h2>
                <p className={styles.successText}>
                  Менеджер проверит совместимость и свяжется с вами в ближайшее время.
                </p>
                <button
                  className={styles.btnReset}
                  onClick={() => {
                    setFormState("idle");
                    setVin(""); setSelectedCat(""); setCustomPart("");
                    setName(""); setPhone(""); setComment("");
                    setVinInfo(null);
                  }}
                >
                  Отправить ещё одну заявку
                </button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <h2 className={styles.formTitle}>Оставить заявку</h2>

                {/* VIN */}
                <div className={styles.field}>
                  <label className={styles.label}>VIN-номер *</label>
                  <input
                    className={`${styles.input} ${styles.inputMono}`}
                    placeholder="WVWZZZ3CZWE123456"
                    value={vin}
                    maxLength={17}
                    onChange={e => handleVinChange(e.target.value)}
                    spellCheck={false}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    required
                  />
                  {vin.length > 0 && vin.length < 17 && (
                    <p className={styles.fieldHint}>{vin.length} / 17 символов</p>
                  )}

                  {/* VIN info card */}
                  {vinLoading && (
                    <div className={styles.vinCard}>
                      <div className={styles.miniSpinner} />
                      <span>Определяем автомобиль...</span>
                    </div>
                  )}
                  {vinInfo && !vinLoading && (
                    <div className={styles.vinCard}>
                      <CheckIcon />
                      <span>
                        <strong>{[vinInfo.manufacturer, vinInfo.model, vinInfo.year].filter(Boolean).join(" ")}</strong>
                        {vinInfo.engine && <span className={styles.vinEngine}> · {vinInfo.engine}</span>}
                        {vinInfo.modification && <span className={styles.vinEngine}> · {vinInfo.modification}</span>}
                      </span>
                    </div>
                  )}
                </div>

                {/* Деталь */}
                <div className={styles.field}>
                  <label className={styles.label}>Нужная деталь *</label>
                  <div className={styles.catGrid}>
                    {PART_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`${styles.catBtn} ${selectedCat === cat.id ? styles.catBtnActive : ""}`}
                        onClick={() => {
                          setSelectedCat(selectedCat === cat.id ? "" : cat.id);
                          setCustomPart("");
                        }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  {!selectedCat && (
                    <input
                      className={styles.input}
                      placeholder="Или введите название детали вручную..."
                      value={customPart}
                      onChange={e => setCustomPart(e.target.value)}
                    />
                  )}
                </div>

                {/* Контакты */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Ваше имя</label>
                    <input className={styles.input} placeholder="Иван" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Телефон</label>
                    <input className={styles.input} type="tel" placeholder="+7 (999) 000-00-00" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Комментарий</label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder="Год выпуска, двигатель, особые пожелания..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                  />
                </div>

                {formState === "error" && (
                  <p className={styles.errorMsg}>Не удалось отправить заявку. Попробуйте позже или позвоните нам.</p>
                )}

                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={!isReady || formState === "submitting"}
                >
                  {formState === "submitting" ? (
                    <><div className={styles.miniSpinner} /> Отправляем...</>
                  ) : (
                    "Отправить заявку на подбор"
                  )}
                </button>

                <p className={styles.formNote}>
                  Обычно отвечаем в течение 30 минут в рабочее время
                </p>
              </form>
            )}
          </div>

          {/* ── Сайдбар ── */}
          <div className={styles.sidebar}>
            {activeCar && (
              <div className={styles.activeCar}>
                <p className={styles.activeCarLabel}>Активный автомобиль</p>
                <p className={styles.activeCarName}>{activeCar.label || activeCar.vin}</p>
                {activeCar.vin !== vin && (
                  <button
                    type="button"
                    className={styles.btnUseGarage}
                    onClick={() => handleVinChange(activeCar.vin)}
                  >
                    Использовать этот VIN
                  </button>
                )}
              </div>
            )}

            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Что входит в подбор</h3>
              <ul className={styles.infoList}>
                <li>Оригинальные номера деталей по VIN</li>
                <li>Аналоги проверенных брендов</li>
                <li>Актуальные цены и наличие</li>
                <li>Сроки доставки со складов</li>
                <li>Проверка совместимости с вашим авто</li>
              </ul>
            </div>

            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Где найти VIN?</h3>
              <ul className={styles.infoList}>
                <li>Лобовое стекло (нижний левый угол)</li>
                <li>Табличка на стойке двери водителя</li>
                <li>ПТС / СТС</li>
                <li>Страховой полис ОСАГО</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
