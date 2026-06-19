"use client";

import { Suspense, useState, useMemo, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";
import { CATALOG_CATEGORIES } from "@/data/catalog";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
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

  const { addItem } = useCart();

  const activeCategory = CATALOG_CATEGORIES.find((c) => c.slug === categorySlug);

  // ── Filtered + sorted products ──
  const visibleProducts = useMemo(() => {
    const catLabel = categorySlug ? (SLUG_TO_CATEGORY[categorySlug] ?? "") : "";
    let list = categorySlug
      ? products.filter((p) => catLabel && p.category === catLabel)
      : products;

    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((p) =>
      [p.title, p.article, p.category, p.description, p.brand].join(" ").toLowerCase().includes(q)
    );
    if (activeBrands.size > 0) list = list.filter((p) => activeBrands.has(p.brand));
    if (onlyInStock) list = list.filter((p) => p.inStock);

    switch (sort) {
      case "price_asc":  return [...list].sort((a, b) => a.price - b.price);
      case "price_desc": return [...list].sort((a, b) => b.price - a.price);
      case "rating":     return [...list].sort((a, b) => b.rating - a.rating);
      default:           return [...list].sort((a, b) => b.reviews - a.reviews);
    }
  }, [categorySlug, searchQuery, activeBrands, onlyInStock, sort]);

  // Brands available in current category
  const availableBrands = useMemo(() => {
    const catLabel = categorySlug ? (SLUG_TO_CATEGORY[categorySlug] ?? "") : "";
    const list = categorySlug ? products.filter((p) => catLabel && p.category === catLabel) : products;
    return Array.from(new Set(list.map((p) => p.brand))).sort();
  }, [categorySlug]);

  function toggleBrand(brand: string) {
    setActiveBrands((prev) => {
      const next = new Set(prev);
      next.has(brand) ? next.delete(brand) : next.add(brand);
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
                {(activeBrands.size > 0 || onlyInStock) && <span className={styles.filterDot} />}
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
            {(activeBrands.size > 0 || onlyInStock) && (
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
                <button className={styles.clearAll} onClick={() => { setActiveBrands(new Set()); setOnlyInStock(false); }}>
                  Сбросить всё
                </button>
              </div>
            )}

            {/* Products */}
            {visibleProducts.length === 0 ? (
              <div className={styles.empty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p>Товары не найдены</p>
                <button onClick={() => { setActiveBrands(new Set()); setOnlyInStock(false); }} className={styles.emptyBtn}>
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className={styles.productsGrid}>
                {visibleProducts.map((product) => (
                  <article className={styles.card} key={product.id}>
                    <div className={styles.cardImage}>
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 220px"
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
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
