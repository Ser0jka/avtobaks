"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.css";

type Warehouse = {
  supplier: string;
  price: number;
  stock: number;
  delivery: number | null;
  warehouse: string;
};

type ProductDetail = {
  id: string;
  title: string;
  article: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  priceMax: number;
  oldPrice: number | null;
  inStock: boolean;
  stockCount: number;
  image: string | null;
  images: string[];
  rating: number;
  reviews: number;
  deliveryDays: number | null;
  warehouses: Warehouse[];
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

function deliveryLabel(days: number | null): string {
  if (days === null) return "Уточнить";
  if (days === 0) return "Сегодня";
  if (days === 1) return "Завтра";
  return `${days} дн.`;
}

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "delivery">("desc");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/catalog/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Товар не найден" : `Ошибка ${r.status}`);
        return r.json();
      })
      .then((data: ProductDetail) => {
        if (!active) return;
        setProduct(data);
        setError(null);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (!active) return;
        setError(e.message);
        setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  function handleAddToCart() {
    if (!product) return;
    addItem({
      id: product.id,
      title: product.title,
      article: product.article,
      brand: product.brand,
      category: product.category,
      description: product.description,
      price: product.price,
      inStock: product.inStock,
      stockCount: product.stockCount,
      image: product.image,
      rating: product.rating,
      reviews: product.reviews,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <SiteHeader active="catalog" />
        <div className={styles.wrap}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            Загрузка товара...
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.page}>
        <SiteHeader active="catalog" />
        <div className={styles.wrap}>
          <div className={styles.errorBox}>
            <h2>Товар не найден</h2>
            <p>{error ?? "Произошла ошибка"}</p>
            <Link href="/catalog" className={styles.backBtn}>Вернуться в каталог</Link>
          </div>
        </div>
      </div>
    );
  }

  const allImages = product.images.length > 0 ? product.images : product.image ? [product.image] : [];
  const currentImg = allImages[activeImg] ?? null;
  const rating = product.rating ?? 4.8;
  const ratingFull = Math.floor(rating);

  // Характеристики
  const specs = [
    { label: "Бренд", value: product.brand },
    { label: "Артикул", value: product.article },
    { label: "Категория", value: product.category },
    ...(product.deliveryDays !== null
      ? [{ label: "Срок доставки", value: deliveryLabel(product.deliveryDays) }]
      : []),
    { label: "В наличии", value: product.stockCount > 0 ? `${product.stockCount} шт.` : "Под заказ" },
  ];

  return (
    <div className={styles.page}>
      <SiteHeader active="catalog" />
      <div className={styles.wrap}>

        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Главная</Link><span>/</span>
          <Link href="/catalog">Каталог</Link><span>/</span>
          <Link href={`/catalog?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <span>/</span>
          <Link href={`/catalog?q=${encodeURIComponent(product.brand)}`}>{product.brand}</Link>
          <span>/</span>
          <span>{product.article}</span>
        </nav>

        {/* Main grid */}
        <div className={styles.main}>

          {/* ── Gallery ── */}
          <div className={styles.gallery}>
            {allImages.length > 1 && (
              <div className={styles.thumbs}>
                {allImages.map((src, i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ""}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <Image
                      src={src}
                      alt={`${product.title} ${i + 1}`}
                      fill
                      sizes="72px"
                      style={{ objectFit: "contain", padding: 4 }}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
            <div className={styles.mainImage}>
              {currentImg ? (
                <Image
                  src={currentImg}
                  alt={product.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 520px"
                  style={{ objectFit: "contain", padding: "1.5rem" }}
                  unoptimized
                  priority
                />
              ) : (
                <div className={styles.noPhoto}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <span>Фото скоро</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Info ── */}
          <div className={styles.info}>
            <div className={styles.titleRow}>
              <span className={styles.brand}>{product.brand}</span>
              <h1 className={styles.title}>{product.title}</h1>
              <span className={styles.article}>Арт. {product.article}</span>
            </div>

            {/* Rating */}
            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon key={i} filled={i < ratingFull} />
                ))}
              </div>
              <span className={styles.ratingVal}>{rating}</span>
              {product.reviews > 0 && (
                <span className={styles.ratingCount}>{product.reviews} оценок</span>
              )}
              <span className={`${styles.stockBadge} ${product.inStock ? styles.stockIn : styles.stockOut}`}>
                {product.inStock ? `В наличии ${product.stockCount} шт.` : "Под заказ"}
              </span>
            </div>

            {/* Price + CTA */}
            <div className={styles.priceBlock}>
              <div className={styles.priceRow}>
                {product.oldPrice && (
                  <span className={styles.oldPrice}>{product.oldPrice.toLocaleString("ru-RU")} ₽</span>
                )}
                <span className={styles.price}>
                  <span className={styles.priceFrom}>от </span>
                  {product.price.toLocaleString("ru-RU")} ₽
                </span>
              </div>

              <button
                className={`${styles.btnCart} ${added ? styles.btnCartAdded : ""}`}
                onClick={handleAddToCart}
              >
                {added ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Добавлено
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    В корзину
                  </>
                )}
              </button>

              <button className={styles.btnRequest}>Уточнить наличие</button>
            </div>

            {/* Delivery */}
            <div className={styles.deliveryBlock}>
              <p className={styles.deliveryTitle}>Способы получения</p>
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryLabel}>Курьером</span>
                <span className={styles.deliveryVal}>
                  {product.deliveryDays !== null ? `От ${deliveryLabel(product.deliveryDays)}` : "Уточнить"}
                </span>
              </div>
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryLabel}>Самовывоз</span>
                <span className={styles.deliveryFree}>Бесплатно</span>
              </div>
              {product.warehouses.length > 1 && (
                <div className={styles.deliveryRow}>
                  <span className={styles.deliveryLabel}>Поставщиков</span>
                  <span className={styles.deliveryVal}>{product.warehouses.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          <div className={styles.tabNav}>
            {(["desc", "specs", "delivery"] as const).map((tab) => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {{ desc: "О товаре", specs: "Характеристики", delivery: "Наличие" }[tab]}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            {activeTab === "desc" && (
              <p className={styles.descText}>{product.description}</p>
            )}

            {activeTab === "specs" && (
              <table className={styles.specsTable}>
                <tbody>
                  {specs.map((s) => (
                    <tr key={s.label}>
                      <td>{s.label}</td>
                      <td>{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "delivery" && (
              <table className={styles.specsTable}>
                <tbody>
                  {product.warehouses.map((w, i) => (
                    <tr key={i}>
                      <td>{w.warehouse || w.supplier}</td>
                      <td>
                        {w.price.toLocaleString("ru-RU")} ₽ · {w.stock} шт.
                        {w.delivery !== null && ` · ${deliveryLabel(w.delivery)}`}
                      </td>
                    </tr>
                  ))}
                  {product.warehouses.length === 0 && (
                    <tr><td colSpan={2}>Нет данных о складах</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
