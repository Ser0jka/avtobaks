"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";
import { CATALOG_CATEGORIES, CAR_BRANDS, groupBrandsByLetter } from "@/data/catalog";
import { CarIcon, SearchIcon, TruckIcon } from "@/components/Icon";
import MobileMenu from "@/components/MobileMenu";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.css";

const POPULAR_BRANDS = ["Toyota", "Volkswagen", "BMW", "Audi", "Mercedes-Benz", "Kia", "Hyundai", "Nissan", "Ford", "Renault"];

// Map catalog slug → product category string
const SLUG_TO_CATEGORY: Record<string, string> = {
  tormoza: "Тормозная система",
  dvigatel: "Двигатель и масла",
  masla: "Двигатель и масла",
  filtry: "Двигатель и масла",
  optika: "Оптика",
  avtolampy: "Оптика",
  podveska: "Подвеска",
  aksessuary: "Аксессуары",
  kovriki: "Аксессуары",
};

const phone = "+7 906 986 66 61";

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("category") ?? "";
  const initialBrand = searchParams.get("brand") ?? "";
  const initialQuery = searchParams.get("q") ?? "";

  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [brandTab, setBrandTab] = useState<"passenger" | "truck">("passenger");
  const [brandSearch, setBrandSearch] = useState(initialBrand);
  const [vinValue, setVinValue] = useState("");
  const [vinSubmitted, setVinSubmitted] = useState(false);

  const { addItem } = useCart();

  const filteredBrands = useMemo(() => {
    const q = brandSearch.toLowerCase().trim();
    const brands = q
      ? CAR_BRANDS.filter((b) => b.name.toLowerCase().includes(q))
      : CAR_BRANDS;
    return groupBrandsByLetter(brands);
  }, [brandSearch]);

  const productCategory = activeSlug ? (SLUG_TO_CATEGORY[activeSlug] ?? "") : "";
  const categoryProducts = activeSlug
    ? products.filter((p) => productCategory && p.category === productCategory)
    : products;
  const productQuery = initialQuery.trim().toLowerCase();
  const filteredProducts = productQuery
    ? categoryProducts.filter((p) =>
        [p.title, p.article, p.category, p.description]
          .join(" ")
          .toLowerCase()
          .includes(productQuery),
      )
    : categoryProducts;

  const activeCategory = CATALOG_CATEGORIES.find((c) => c.slug === activeSlug);
  const productsTitle = productQuery
    ? `Поиск: ${initialQuery.trim()}`
    : activeCategory
      ? activeCategory.label
      : "Все товары";

  function handleVinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vinValue.trim()) return;
    setVinSubmitted(true);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.logo} href="/">
            <span>A</span>
            Автобакс
          </Link>
          <nav>
            <ul className={styles.nav}>
              <li><Link href="/">Главная</Link></li>
              <li><Link href="/catalog">Каталог</Link></li>
              <li><Link href="/#search">Подбор по VIN</Link></li>
              <li><Link href="/contacts">Контакты</Link></li>
            </ul>
          </nav>
          <a className={styles.phone} href="tel:+79069866661">{phone}</a>
          <Link className={styles.redButton} href="/#request">Оставить заявку</Link>
          <MobileMenu />
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link href="/">Главная</Link>
        <span>/</span>
        <Link href="/catalog">Каталог</Link>
        {activeCategory && (
          <>
            <span>/</span>
            <span>{activeCategory.label}</span>
          </>
        )}
      </nav>

      {/* Layout */}
      <div className={styles.layout}>
        {/* ── Mobile sidebar toggle ── */}
        <div className={styles.mobileSidebarToggle}>
          <button
            className={styles.mobileSidebarBtn}
            onClick={() => setMobileSidebarOpen((v) => !v)}
          >
            <span className={styles.mobileSidebarIcon}>
              {mobileSidebarOpen ? "✕" : "☰"}
            </span>
            {activeSlug
              ? (CATALOG_CATEGORIES.find((c) => c.slug === activeSlug)?.label ?? "Категории")
              : "Выбрать категорию"}
            {activeSlug && <span className={styles.activeFilterDot} />}
          </button>
          {activeSlug && (
            <button
              className={styles.clearFilterBtn}
              onClick={() => {
                setActiveSlug("");
                setMobileSidebarOpen(false);
              }}
            >
              Сбросить ✕
            </button>
          )}
        </div>

        {/* ── Left sidebar ── */}
        <aside className={`${styles.sidebar} ${mobileSidebarOpen ? styles.sidebarMobileOpen : ""}`}>
          {/* VIN mini-block */}
          <div className={styles.sidebarVin}>
            <p className={styles.sidebarVinTitle}>Оригинальные каталоги</p>
            <p className={styles.sidebarVinDesc}>
              Поиск по VIN / номеру кузова или по марке и модели автомобиля
            </p>
            <div className={styles.sidebarVinBtns}>
              <a href="#vin" className={styles.btnVinGreen}>Найти по VIN</a>
              <a href="#brands" className={styles.btnVinOutline}>Найти по марке</a>
            </div>
          </div>

          {/* Category list */}
          <ul className={styles.catList}>
            {CATALOG_CATEGORIES.map((cat) => (
              <li key={cat.slug} className={styles.catItem}>
                <button
                  className={`${styles.catBtn} ${activeSlug === cat.slug ? styles.active : ""}`}
                  onClick={() => {
                    setActiveSlug(activeSlug === cat.slug ? "" : cat.slug);
                    setMobileSidebarOpen(false);
                  }}
                >
                  <span className={styles.catIcon}>{cat.icon}</span>
                  {cat.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Right content ── */}
        <div className={styles.content}>
          {/* VIN search */}
          <div className={styles.vinBlock} id="vin">
            <div className={styles.vinBlockLeft}>
              <h1 className={styles.vinBlockTitle}>Найти запчасти по VIN</h1>
              <p className={styles.vinBlockDesc}>
                Введите VIN-номер или номер кузова, чтобы найти подходящие запчасти
              </p>
              <form className={styles.vinForm} onSubmit={handleVinSubmit}>
                <input
                  className={styles.vinInput}
                  placeholder="Введите VIN · Frame"
                  value={vinValue}
                  onChange={(e) => {
                    setVinValue(e.target.value);
                    setVinSubmitted(false);
                  }}
                />
                <button className={styles.vinSubmit} type="submit">Найти запчасти</button>
              </form>
              <div className={styles.vinExamples}>
                <span>Пример VIN: <span>WAUZZZ4M0HD042149</span></span>
                <span>Пример кузова: <span>SGL5-400683</span></span>
              </div>
              {vinSubmitted && (
                <p className={styles.vinNotice}>
                  VIN принят. Для точного подбора оставьте заявку, и менеджер проверит совместимость детали.
                </p>
              )}
            </div>
            <div className={styles.vinIllustration} aria-hidden="true">⚙️</div>
          </div>

          {/* Brand search */}
          <div className={styles.brandBlock} id="brands">
            {/* Popular brands quick chips */}
            <div className={styles.popularBrands}>
              <span className={styles.popularBrandsLabel}>Популярные:</span>
              {POPULAR_BRANDS.map((name) => (
                <a
                  key={name}
                  href={`/catalog?brand=${encodeURIComponent(name)}`}
                  className={`${styles.brandChip} ${brandSearch === name ? styles.brandChipActive : ""}`}
                  onClick={() => setBrandSearch(name)}
                >
                  {name}
                </a>
              ))}
            </div>

            <div className={styles.brandTabs}>
              <button
                className={`${styles.brandTab} ${brandTab === "passenger" ? styles.active : ""}`}
                onClick={() => setBrandTab("passenger")}
              >
                <CarIcon />
                Легковые
              </button>
              <button
                className={`${styles.brandTab} ${brandTab === "truck" ? styles.active : ""}`}
                onClick={() => setBrandTab("truck")}
              >
                <TruckIcon />
                Грузовые
              </button>
              <div className={styles.brandSearch}>
                <SearchIcon className={styles.brandSearchIcon} />
                <input
                  className={styles.brandSearchInput}
                  placeholder="Искать в списке"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.brandGrid}>
              {Array.from(filteredBrands.entries()).map(([letter, names]) => (
                <div key={letter} className={styles.brandLetterGroup}>
                  <p className={styles.brandLetter}>{letter}</p>
                  {names.map((name) => (
                    <a
                      key={name}
                      href={`/catalog?brand=${encodeURIComponent(name)}`}
                      className={styles.brandLink}
                    >
                      {name}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Products (shown when category selected OR always show all) */}
          <div className={styles.productsSection}>
            <div className={styles.productsSectionTitle}>
              <span>
                {productsTitle}
              </span>
              <span className={styles.productsSectionCount}>
                {filteredProducts.length} позиц.
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className={styles.empty}>
                <p>Товаров в этой категории пока нет.</p>
                <p style={{ marginTop: "0.4rem", fontSize: "0.85rem" }}>
                  Оставьте заявку и мы подберём нужную деталь.
                </p>
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredProducts.map((product) => (
                  <article className={styles.card} key={product.id}>
                    <div className={styles.cardImage}>
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 210px"
                        style={{ objectFit: "cover" }}
                      />
                      <span
                        className={`${styles.badge} ${
                          product.inStock ? styles.inStock : styles.outOfStock
                        }`}
                      >
                        {product.inStock ? "В наличии" : "Под заказ"}
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{product.title}</h3>
                      <p className={styles.cardArticle}>Арт: {product.article}</p>
                      <p className={styles.cardPrice}>
                        {product.price.toLocaleString("ru-RU")} ₽
                      </p>
                    </div>
                    <div className={styles.cardActions}>
                      <Link className={styles.btnOutline} href="/#request">
                        Подробнее
                      </Link>
                      <button
                        className={styles.btnCart}
                        onClick={() => addItem(product)}
                      >
                        🛒 В корзину
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
    <Suspense fallback={<div className={styles.page} />}>
      <CatalogContent />
    </Suspense>
  );
}
