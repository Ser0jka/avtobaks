"use client";

import { Suspense, useEffect, useState, useMemo, type FormEvent } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { products, type Product } from "@/data/products";
import { CATALOG_CATEGORIES } from "@/data/catalog";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { useGarage } from "@/context/GarageContext";
import styles from "./page.module.css";

const SLUG_TO_CATEGORY: Record<string, string> = {
  tormoza: "Тормозная система",
  dvigatel: "Двигатель и масла",
  masla: "Двигатель и масла",
  filtry: "Фильтры",
  optika: "Оптика",
  avtolampy: "Оптика",
  podveska: "Подвеска",
  aksessuary: "Аксессуары",
  kovriki: "Аксессуары",
  himiya: "Автохимия",
  avtohimiya: "Автохимия",
  electrika: "Электрика",
  akkumulyatory: "Электрика",
  schetki: "Аксессуары",
  avtolampy2: "Оптика",
  instrumenty: "Аксессуары",
  glushiteli: "Двигатель и масла",
  transmissiya: "Подвеска",
  kuzov: "Аксессуары",
  salon: "Аксессуары",
};

// ── Категорийные фильтры ──────────────────────────────────────
type CategoryFilterDef = {
  key: string;
  label: string;
  // функция извлечения значения фильтра из названия/описания товара
  extract: (title: string, article: string) => string | null;
};

const CATEGORY_FILTERS: Record<string, CategoryFilterDef[]> = {
  "Двигатель и масла": [
    {
      key: "viscosity",
      label: "Вязкость",
      extract: (title) => {
        const m = title.match(/\b(\d{1,2}[Ww]-\d{2}|\d{1,2}[Ww])\b/);
        return m ? m[1].toUpperCase() : null;
      },
    },
    {
      key: "volume",
      label: "Объём",
      extract: (title) => {
        const m = title.match(/(\d[,.]?\d*)\s*(л|L|litre|liter)/i);
        if (m) return `${m[1].replace(",", ".")} л`;
        return null;
      },
    },
  ],
  "Фильтры": [
    {
      key: "filterType",
      label: "Тип фильтра",
      extract: (title) => {
        const t = title.toLowerCase();
        if (t.includes("масл")) return "Масляный";
        if (t.includes("воздуш") || t.includes("воздух")) return "Воздушный";
        if (t.includes("топлив")) return "Топливный";
        if (t.includes("салон") || t.includes("кабин")) return "Салонный";
        return null;
      },
    },
  ],
  "Оптика": [
    {
      key: "base",
      label: "Цоколь",
      extract: (title) => {
        const m = title.match(/\b(H1|H3|H4|H7|H8|H9|H11|H13|H15|H16|HB3|HB4|HIR2|D1S|D2S|D3S|D4S|9006|9007|P21W|W5W|C5W|T10|W21W|WY21W)\b/i);
        return m ? m[1].toUpperCase() : null;
      },
    },
    {
      key: "watt",
      label: "Мощность",
      extract: (title) => {
        const m = title.match(/(\d+)\s*[Ww]\b/);
        return m ? `${m[1]} Вт` : null;
      },
    },
  ],
  "Тормозная система": [
    {
      key: "axle",
      label: "Ось",
      extract: (title) => {
        const t = title.toLowerCase();
        if (t.includes("перед")) return "Передние";
        if (t.includes("задн")) return "Задние";
        return null;
      },
    },
  ],
  "Подвеска": [
    {
      key: "side",
      label: "Сторона",
      extract: (title) => {
        const t = title.toLowerCase();
        if (t.includes("левый") || t.includes("лев.") || t.includes(" l ") || / l$/.test(t)) return "Левый";
        if (t.includes("правый") || t.includes("прав.") || t.includes(" r ") || / r$/.test(t)) return "Правый";
        return null;
      },
    },
  ],
  "Электрика": [
    {
      key: "voltage",
      label: "Напряжение",
      extract: (title) => {
        const m = title.match(/(\d+)\s*[Vv]\b/);
        return m ? `${m[1]} В` : null;
      },
    },
    {
      key: "capacity",
      label: "Ёмкость",
      extract: (title) => {
        const m = title.match(/(\d+)\s*[Aa][Hh]/i);
        return m ? `${m[1]} Ач` : null;
      },
    },
  ],
};

type SortKey = "popular" | "price_asc" | "price_desc" | "rating";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Сначала популярные" },
  { value: "rating", label: "По рейтингу" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
];

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") ?? "";
  const searchQuery  = searchParams.get("q") ?? "";

  const [sort, setSort]                   = useState<SortKey>("popular");
  const [sortOpen, setSortOpen]           = useState(false);
  const [activeBrands, setActiveBrands]   = useState<Set<string>>(new Set());
  const [onlyInStock, setOnlyInStock]     = useState(false);
  const [vinValue, setVinValue]           = useState("");
  const [vinSubmitted, setVinSubmitted]   = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Категорийные фильтры: { filterKey -> Set<value> }
  const [catFilters, setCatFilters] = useState<Record<string, Set<string>>>({});

  const { addItem } = useCart();
  const { activeCar } = useGarage();

  const activeCategory = CATALOG_CATEGORIES.find((c) => c.slug === categorySlug);
  const catLabel = categorySlug ? (SLUG_TO_CATEGORY[categorySlug] ?? "") : "";
  const activeCatFilterDefs = catLabel ? (CATEGORY_FILTERS[catLabel] ?? []) : [];

  useEffect(() => {
    let active = true;
    setLoadingProducts(true);
    setLoadError(null);

    fetch("/api/catalog/products?limit=500")
      .then((r) => {
        if (!r.ok) throw new Error(`Ошибка сервера: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          setCatalogProducts(data);
        }
        setLoadingProducts(false);
      })
      .catch((err: Error) => {
        if (!active) return;
        setLoadError(err.message ?? "Не удалось загрузить товары");
        setLoadingProducts(false);
      });

    return () => { active = false; };
  }, []);

  // ── Filtered + sorted products ──
  const visibleProducts = useMemo(() => {
    let list = categorySlug
      ? catalogProducts.filter((p) => catLabel && p.category === catLabel)
      : catalogProducts;

    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((p) =>
      [p.title, p.article, p.category, p.description, p.brand].join(" ").toLowerCase().includes(q)
    );
    if (activeBrands.size > 0) list = list.filter((p) => activeBrands.has(p.brand));
    if (onlyInStock) list = list.filter((p) => p.inStock);

    // Категорийные фильтры
    for (const def of activeCatFilterDefs) {
      const selected = catFilters[def.key];
      if (selected && selected.size > 0) {
        list = list.filter((p) => {
          const val = def.extract(p.title, p.article);
          return val !== null && selected.has(val);
        });
      }
    }

    switch (sort) {
      case "price_asc":  return [...list].sort((a, b) => a.price - b.price);
      case "price_desc": return [...list].sort((a, b) => b.price - a.price);
      case "rating":     return [...list].sort((a, b) => b.rating - a.rating);
      default:           return [...list].sort((a, b) => b.reviews - a.reviews);
    }
  }, [categorySlug, catLabel, searchQuery, activeBrands, onlyInStock, sort, catalogProducts, catFilters, activeCatFilterDefs]);

  // Brands available in current category
  const availableBrands = useMemo(() => {
    const list = categorySlug ? catalogProducts.filter((p) => catLabel && p.category === catLabel) : catalogProducts;
    return Array.from(new Set(list.map((p) => p.brand))).sort();
  }, [categorySlug, catLabel, catalogProducts]);

  // Доступные значения для категорийных фильтров (из текущего списка без учёта этого фильтра)
  const catFilterOptions = useMemo(() => {
    const baseList = categorySlug
      ? catalogProducts.filter((p) => catLabel && p.category === catLabel)
      : catalogProducts;
    const result: Record<string, string[]> = {};
    for (const def of activeCatFilterDefs) {
      const vals = new Set<string>();
      for (const p of baseList) {
        const v = def.extract(p.title, p.article);
        if (v) vals.add(v);
      }
      if (vals.size > 0) result[def.key] = Array.from(vals).sort();
    }
    return result;
  }, [categorySlug, catLabel, catalogProducts, activeCatFilterDefs]);

  function toggleCatFilter(key: string, value: string) {
    setCatFilters((prev) => {
      const next = { ...prev };
      const set = new Set(prev[key] ?? []);
      if (set.has(value)) set.delete(value); else set.add(value);
      if (set.size === 0) delete next[key]; else next[key] = set;
      return next;
    });
  }

  function resetAllFilters() {
    setActiveBrands(new Set());
    setOnlyInStock(false);
    setCatFilters({});
  }

  const hasCatFilters = Object.values(catFilters).some((s) => s.size > 0);

  function toggleBrand(brand: string) {
    setActiveBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
  }

  function handleVinSubmit(e: FormEvent) {
    e.preventDefault();
    if (vinValue.trim()) setVinSubmitted(true);
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Сортировка";

  // ═══════════════════════════════════════════════
  // Главная каталога — без параметров
  // ═══════════════════════════════════════════════
  if (!categorySlug && !searchQuery) {
    return (
      <div className={styles.page}>
        <SiteHeader active="catalog" />
        <div className={styles.wrap}>
          <nav className={styles.breadcrumb}>
            <Link href="/">Главная</Link><span>/</span><span>Каталог</span>
          </nav>
          <h1 className={styles.pageTitle}>Каталог запчастей и товаров</h1>

          {/* Active car banner */}
          {activeCar && (
            <div className={styles.activeBanner}>
              <div className={styles.activeBannerLeft}>
                <svg width="28" height="18" viewBox="0 0 64 40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="16" width="56" height="18" rx="4"/>
                  <path d="M12 16l7-12h26l7 12"/>
                  <circle cx="16" cy="34" r="5"/><circle cx="48" cy="34" r="5"/>
                  <path d="M21 34h22"/>
                </svg>
                <span>
                  Активен: <strong>{activeCar.label || activeCar.vin}</strong>
                  {activeCar.vin && <span className={styles.activeBannerVin}> · VIN: {activeCar.vin}</span>}
                </span>
              </div>
              <div className={styles.activeBannerRight}>
                <Link
                  href={`/catalog?q=${encodeURIComponent(activeCar.brand || activeCar.vin)}`}
                  className={styles.activeBannerBtn}
                >
                  Найти запчасти
                </Link>
                <Link href="/garage" className={styles.activeBannerLink}>Мой гараж →</Link>
              </div>
            </div>
          )}

          {/* VIN block */}
          <div className={styles.vinCard}>
            <div className={styles.vinCardLeft}>
              <p className={styles.vinCardTitle}>Найти запчасти по VIN</p>
              <p className={styles.vinCardDesc}>Введите VIN-номер или номер кузова</p>
              <form className={styles.vinForm} onSubmit={handleVinSubmit}>
                <input className={styles.vinInput} placeholder="VIN / FRAME"
                  value={vinValue} onChange={(e) => { setVinValue(e.target.value); setVinSubmitted(false); }} />
                <button className={styles.vinBtn} type="submit">Найти</button>
              </form>
              {vinSubmitted && <p className={styles.vinNotice}>VIN принят. Менеджер свяжется для подбора.</p>}
            </div>
            <div className={styles.vinCardIcon} aria-hidden>
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="20" width="56" height="28" rx="4"/>
                <path d="M12 20l6-10h28l6 10"/>
                <circle cx="16" cy="40" r="6"/><circle cx="48" cy="40" r="6"/>
                <path d="M22 40h20M4 32h4M56 32h4"/>
              </svg>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionGrid}>
              {CATALOG_CATEGORIES.map((cat) => (
                <Link key={cat.slug} href={`/catalog?category=${cat.slug}`} className={styles.catCard}>
                  <span className={styles.catCardIcon}>{cat.icon}</span>
                  <span className={styles.catCardLabel}>{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // Страница категории / поиска — с сайдбаром
  // ═══════════════════════════════════════════════
  return (
    <div className={styles.page}>
      <SiteHeader active="catalog" />

      <div className={styles.wrap}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Главная</Link><span>/</span>
          <Link href="/catalog">Каталог</Link>
          {activeCategory && <><span>/</span><span>{activeCategory.label}</span></>}
          {searchQuery && <><span>/</span><span>Поиск: {searchQuery}</span></>}
        </nav>

        {/* Page header */}
        <div className={styles.listingHeader}>
          <h1 className={styles.pageTitle}>
            {searchQuery ? `Поиск: ${searchQuery}` : activeCategory?.label ?? "Каталог"}
            <span className={styles.countBadge}>{visibleProducts.length} товаров</span>
          </h1>
        </div>

        {/* Active car banner in listing */}
        {activeCar && (
          <div className={styles.activeBanner}>
            <div className={styles.activeBannerLeft}>
              <svg width="26" height="16" viewBox="0 0 64 40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="16" width="56" height="18" rx="4"/>
                <path d="M12 16l7-12h26l7 12"/>
                <circle cx="16" cy="34" r="5"/><circle cx="48" cy="34" r="5"/>
                <path d="M21 34h22"/>
              </svg>
              <span>
                Подбор для: <strong>{activeCar.label || activeCar.vin}</strong>
              </span>
            </div>
            <Link href="/garage" className={styles.activeBannerLink}>Изменить →</Link>
          </div>
        )}

        <div className={styles.listingLayout}>
          {/* ── Sidebar ── */}
          <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
            {/* Только в наличии */}
            <div className={styles.filterBlock}>
              <label className={styles.stockToggle}>
                <span className={styles.stockLabel}>Только в наличии</span>
                <button
                  className={`${styles.toggle} ${onlyInStock ? styles.toggleOn : ""}`}
                  onClick={() => setOnlyInStock((v) => !v)}
                  aria-pressed={onlyInStock}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </label>
            </div>

            {/* Категорийные фильтры */}
            {activeCatFilterDefs.map((def) => {
              const opts = catFilterOptions[def.key];
              if (!opts || opts.length === 0) return null;
              const selected = catFilters[def.key] ?? new Set<string>();
              return (
                <div key={def.key} className={styles.filterBlock}>
                  <p className={styles.filterTitle}>{def.label}</p>
                  {opts.map((val) => (
                    <label key={val} className={styles.checkLabel}>
                      <input
                        type="checkbox"
                        className={styles.check}
                        checked={selected.has(val)}
                        onChange={() => toggleCatFilter(def.key, val)}
                      />
                      <span className={styles.checkBox} />
                      <span className={styles.checkText}>{val}</span>
                    </label>
                  ))}
                  {selected.size > 0 && (
                    <button className={styles.resetLink} onClick={() => setCatFilters((p) => { const n = {...p}; delete n[def.key]; return n; })}>
                      Сбросить
                    </button>
                  )}
                </div>
              );
            })}

            {/* Производитель */}
            {availableBrands.length > 0 && (
              <div className={styles.filterBlock}>
                <p className={styles.filterTitle}>Производитель</p>
                {availableBrands.map((brand) => (
                  <label key={brand} className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      className={styles.check}
                      checked={activeBrands.has(brand)}
                      onChange={() => toggleBrand(brand)}
                    />
                    <span className={styles.checkBox} />
                    <span className={styles.checkText}>{brand}</span>
                  </label>
                ))}
                {activeBrands.size > 0 && (
                  <button className={styles.resetLink} onClick={() => setActiveBrands(new Set())}>
                    Сбросить
                  </button>
                )}
              </div>
            )}

            {/* Другие категории */}
            <div className={styles.filterBlock}>
              <p className={styles.filterTitle}>Другие категории</p>
              {CATALOG_CATEGORIES.filter((c) => c.slug !== categorySlug).slice(0, 8).map((cat) => (
                <Link key={cat.slug} href={`/catalog?category=${cat.slug}`} className={styles.catSideLink}>
                  <span className={styles.catSideIcon}>{cat.icon}</span>
                  {cat.label}
                </Link>
              ))}
              <Link href="/catalog" className={styles.resetLink}>Все категории →</Link>
            </div>
          </aside>

          {/* ── Main ── */}
          <div className={styles.listingMain}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <button className={styles.filterToggleBtn} onClick={() => setSidebarOpen((v) => !v)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
                </svg>
                Фильтры
                {(activeBrands.size > 0 || onlyInStock || hasCatFilters) && <span className={styles.filterDot} />}
              </button>

              {/* Sort dropdown */}
              <div className={styles.sortWrap}>
                <button className={styles.sortBtn} onClick={() => setSortOpen((v) => !v)}>
                  {currentSortLabel}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {sortOpen && (
                  <div className={styles.sortMenu}>
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`${styles.sortOption} ${sort === opt.value ? styles.sortOptionActive : ""}`}
                        onClick={() => { setSort(opt.value); setSortOpen(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className={styles.toolbarCount}>{visibleProducts.length} товаров</span>
            </div>

            {/* Active filters chips */}
            {(activeBrands.size > 0 || onlyInStock || hasCatFilters) && (
              <div className={styles.activeFilters}>
                {onlyInStock && (
                  <span className={styles.chip}>
                    В наличии
                    <button onClick={() => setOnlyInStock(false)}>✕</button>
                  </span>
                )}
                {Array.from(activeBrands).map((b) => (
                  <span key={b} className={styles.chip}>
                    {b}
                    <button onClick={() => toggleBrand(b)}>✕</button>
                  </span>
                ))}
                {activeCatFilterDefs.map((def) => {
                  const selected = catFilters[def.key];
                  if (!selected || selected.size === 0) return null;
                  return Array.from(selected).map((val) => (
                    <span key={`${def.key}-${val}`} className={styles.chip}>
                      {val}
                      <button onClick={() => toggleCatFilter(def.key, val)}>✕</button>
                    </span>
                  ));
                })}
                <button className={styles.clearAll} onClick={resetAllFilters}>
                  Сбросить всё
                </button>
              </div>
            )}

            {/* Error */}
            {loadError && (
              <div className={styles.errorBanner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                {loadError}
                <button className={styles.errorRetry} onClick={() => window.location.reload()}>Обновить</button>
              </div>
            )}

            {/* Loading skeleton */}
            {loadingProducts && !loadError && (
              <div className={styles.productsGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={styles.cardSkeleton} aria-hidden />
                ))}
              </div>
            )}

            {/* Products */}
            {!loadingProducts && visibleProducts.length === 0 && (
              <div className={styles.empty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p>Товары не найдены</p>
                <button onClick={resetAllFilters} className={styles.emptyBtn}>
                  Сбросить фильтры
                </button>
              </div>
            )}

            {!loadingProducts && visibleProducts.length > 0 && (
              <div className={styles.productsGrid}>
                {visibleProducts.map((product) => (
                  <article className={styles.card} key={product.id}>
                    <Link href={`/catalog/${product.id}`} className={styles.cardLink} />
                    <div className={styles.cardImage}>
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image}
                          alt={product.title}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div className={styles.cardImageEmpty}>
                          <span>{product.brand || "Автобакс"}</span>
                          <strong>{product.article || "Фото скоро"}</strong>
                        </div>
                      )}
                      {!product.inStock && (
                        <span className={styles.badgeOrder}>Под заказ</span>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      {product.inStock ? (
                        <p className={styles.cardStock}>
                          В наличии {product.stockCount && `${product.stockCount} шт`}
                        </p>
                      ) : (
                        <p className={styles.cardStockOut}>Под заказ</p>
                      )}
                      <h3 className={styles.cardTitle}>{product.title}</h3>
                      <p className={styles.cardDelivery}>Доставка от 1 рабочего дня</p>
                      <div className={styles.cardRating}>
                        <StarIcon />
                        <span>{product.rating}</span>
                        <span className={styles.cardReviews}>{product.reviews} оценок</span>
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                      <div className={styles.cardPrices}>
                        {product.oldPrice && (
                          <span className={styles.cardOldPrice}>{product.oldPrice.toLocaleString("ru-RU")} ₽</span>
                        )}
                        <span className={styles.cardPrice}>от {product.price.toLocaleString("ru-RU")} ₽</span>
                      </div>
                      <button className={styles.btnCart} onClick={() => addItem(product)}>
                        В корзину
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f5f6f8" }} />}>
      <CatalogContent />
    </Suspense>
  );
}
