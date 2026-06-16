"use client";

import { useState } from "react";
import Link from "next/link";
import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";
import styles from "./VinSearchForm.module.css";

const BRANDS: Record<string, string[]> = {
  Toyota: ["Camry", "Corolla", "RAV4", "Land Cruiser", "Prius"],
  Nissan: ["X-Trail", "Qashqai", "Almera", "Pathfinder", "Note"],
  BMW: ["3 Series", "5 Series", "X5", "X3", "7 Series"],
  Mercedes: ["C-Class", "E-Class", "GLC", "S-Class", "GLE"],
  Hyundai: ["Solaris", "Tucson", "Santa Fe", "Creta", "Elantra"],
  Kia: ["Rio", "Sportage", "Sorento", "Ceed", "K5"],
  Volkswagen: ["Polo", "Passat", "Tiguan", "Golf", "Touareg"],
  Ford: ["Focus", "Mondeo", "Explorer", "Kuga", "Transit"],
  Mazda: ["CX-5", "Mazda 3", "Mazda 6", "CX-9", "MX-5"],
  Mitsubishi: ["Outlander", "Pajero", "ASX", "Eclipse Cross", "L200"],
};

const CATEGORIES = [
  "Тормозная система",
  "Двигатель и масла",
  "Оптика",
  "Подвеска",
  "Аксессуары",
];

type SearchState = "idle" | "loading" | "results" | "empty";

export default function VinSearchForm() {
  const [vin, setVin] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [results, setResults] = useState(products);
  const { addItem } = useCart();

  const models = brand ? (BRANDS[brand] ?? []) : [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");

    // Заглушка: имитируем задержку поиска
    setTimeout(() => {
      let filtered = products;
      if (category) {
        filtered = filtered.filter((p) => p.category === category);
      }
      // VIN/артикул — ищем по совпадению в title или article
      if (vin.trim()) {
        const q = vin.trim().toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.article.toLowerCase().includes(q)
        );
      }
      setResults(filtered);
      setState(filtered.length > 0 ? "results" : "empty");
    }, 600);
  }

  function handleReset() {
    setVin("");
    setBrand("");
    setModel("");
    setCategory("");
    setState("idle");
    setResults(products);
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.form} onSubmit={handleSearch}>
        {/* VIN */}
        <div className={styles.vinRow}>
          <input
            className={styles.vinInput}
            placeholder="Введите VIN, артикул или название детали"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            aria-label="VIN или артикул"
          />
        </div>

        {/* Selects */}
        <div className={styles.selects}>
          <select
            className={styles.select}
            value={brand}
            onChange={(e) => { setBrand(e.target.value); setModel(""); }}
            aria-label="Марка"
          >
            <option value="">Выберите марку</option>
            {Object.keys(BRANDS).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            className={styles.select}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            aria-label="Модель"
            disabled={!brand}
          >
            <option value="">Выберите модель</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Категория"
          >
            <option value="">Выберите категорию</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button className={styles.submitBtn} type="submit" disabled={state === "loading"}>
            {state === "loading" ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              "Найти"
            )}
          </button>
        </div>
      </form>

      {/* Help box */}
      <aside className={styles.helpBox}>
        <strong>Не знаете артикул?</strong>
        <p>Покажем подобрать нужную деталь вручную</p>
        <a href="#request" className={styles.helpLink}>Оставить заявку</a>
      </aside>

      {/* Results */}
      {state === "loading" && (
        <div className={styles.loadingRow}>
          <span className={styles.spinner} />
          <span>Ищем подходящие запчасти…</span>
        </div>
      )}

      {state === "empty" && (
        <div className={styles.emptyBox}>
          <span className={styles.emptyIcon}>🔍</span>
          <p className={styles.emptyTitle}>Ничего не найдено</p>
          <p className={styles.emptyText}>
            Попробуйте изменить параметры поиска или{" "}
            <a href="#request">оставьте заявку</a> — мы подберём деталь вручную.
          </p>
          <button className={styles.resetBtn} onClick={handleReset}>
            Сбросить поиск
          </button>
        </div>
      )}

      {state === "results" && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultsCount}>
              Найдено: {results.length} {results.length === 1 ? "товар" : results.length < 5 ? "товара" : "товаров"}
            </span>
            {(brand || model || category || vin) && (
              <div className={styles.activeTags}>
                {vin && <span className={styles.tag}>{vin} ✕</span>}
                {brand && <span className={styles.tag}>{brand}{model ? ` · ${model}` : ""} ✕</span>}
                {category && <span className={styles.tag}>{category} ✕</span>}
              </div>
            )}
            <button className={styles.resetBtn} onClick={handleReset}>
              Сбросить
            </button>
          </div>

          <div className={styles.grid}>
            {results.map((p) => (
              <article className={styles.card} key={p.id}>
                <div className={styles.cardImg}>
                  <img src={p.image} alt={p.title} />
                  <span className={`${styles.badge} ${p.inStock ? styles.inStock : styles.outOfStock}`}>
                    {p.inStock ? "В наличии" : "Под заказ"}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardTitle}>{p.title}</p>
                  <p className={styles.cardArticle}>Арт: {p.article}</p>
                  <p className={styles.cardPrice}>{p.price.toLocaleString("ru-RU")} ₽</p>
                </div>
                <div className={styles.cardActions}>
                  <Link href="/catalog" className={styles.btnDetail}>Подробнее</Link>
                  <button className={styles.btnCart} onClick={() => addItem(p)}>
                    В корзину
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.resultsCta}>
            <p>Не нашли нужную деталь? Оставьте заявку и мы подберём вручную.</p>
            <a href="#request" className={styles.ctaBtn}>Оставить заявку</a>
          </div>
        </div>
      )}
    </div>
  );
}
