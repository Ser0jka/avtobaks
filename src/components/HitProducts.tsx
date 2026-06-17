"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import partsPhoto from "../../public/сcategories/1.png";
import { useCart } from "@/context/CartContext";
import styles from "@/app/page.module.css";

type HitProduct = {
  id: string;
  title: string;
  article: string;
  price: string;
  priceNum: number;
  category: string;
  position: string;
};

const hitProducts: HitProduct[] = [
  {
    id: "1",
    title: "Тормозные колодки",
    article: "AB-102354",
    price: "2 450 ₽",
    priceNum: 2450,
    category: "Тормозная система",
    position: "72% 48%",
  },
  {
    id: "2",
    title: "Масляный фильтр",
    article: "AB-20456",
    price: "680 ₽",
    priceNum: 680,
    category: "Двигатель и масла",
    position: "64% 45%",
  },
  {
    id: "3",
    title: "Моторное масло 5W-40",
    article: "AB-30567",
    price: "3 950 ₽",
    priceNum: 3950,
    category: "Двигатель и масла",
    position: "76% 52%",
  },
  {
    id: "4",
    title: "Фара передняя левая",
    article: "AB-40678",
    price: "18 900 ₽",
    priceNum: 18900,
    category: "Оптика",
    position: "70% 42%",
  },
  {
    id: "5",
    title: "Стойка амортизатора",
    article: "AB-50789",
    price: "4 250 ₽",
    priceNum: 4250,
    category: "Подвеска",
    position: "82% 56%",
  },
  {
    id: "hp6",
    title: "Коврики EVA комплект",
    article: "AB-60890",
    price: "2 990 ₽",
    priceNum: 2990,
    category: "Аксессуары",
    position: "58% 50%",
  },
  {
    id: "hp7",
    title: "Щетки стеклоочистителя",
    article: "AB-70901",
    price: "890 ₽",
    priceNum: 890,
    category: "Аксессуары",
    position: "86% 50%",
  },
  {
    id: "hp8",
    title: "Аккумулятор 60Ah",
    article: "AB-81012",
    price: "6 450 ₽",
    priceNum: 6450,
    category: "Электрика",
    position: "78% 58%",
  },
];

export default function HitProducts() {
  const { addItem } = useCart();

  function handleAdd(p: HitProduct) {
    addItem({
      id: p.id,
      title: p.title,
      article: p.article,
      price: p.priceNum,
      category: p.category,
      inStock: true,
      image: partsPhoto,
      description: "",
    });
  }

  return (
    <>
      <div className={styles.sectionHead}>
        <h2>Хиты каталога</h2>
        <Link href="/catalog">Смотреть все</Link>
      </div>
      <div className={styles.productGrid}>
        {hitProducts.map((p) => (
          <article className={styles.productCard} key={p.article}>
            <div
              className={styles.productImage}
              style={{
                "--product-photo": `url(${partsPhoto.src})`,
                "--product-position": p.position,
              } as CSSProperties}
            >
              <span aria-hidden="true" />
            </div>
            <div className={styles.productInfo}>
              <p className={styles.productCategory}>{p.category}</p>
              <h3>{p.title}</h3>
              <p>Артикул: {p.article}</p>
              <span>В наличии</span>
              <strong>{p.price}</strong>
            </div>
            <div className={styles.productActions}>
              <Link href="/catalog">Подробнее</Link>
              <button className={styles.cartBtn} onClick={() => handleAdd(p)}>
                В корзину
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
