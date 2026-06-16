"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import styles from "@/app/page.module.css";

type HitProduct = {
  title: string;
  article: string;
  price: string;
  priceNum: number;
  position: string;
  id: string;
};

const hitProducts: HitProduct[] = [
  { id: "1", title: "Тормозные колодки", article: "AB-102354", price: "2 450 ₽", priceNum: 2450, position: "12% 51%" },
  { id: "2", title: "Масляный фильтр", article: "AB-20456", price: "680 ₽", priceNum: 680, position: "23% 51%" },
  { id: "3", title: "Моторное масло 5W-40", article: "AB-30567", price: "3 950 ₽", priceNum: 3950, position: "34% 51%" },
  { id: "4", title: "Фара передняя левая", article: "AB-40678", price: "18 900 ₽", priceNum: 18900, position: "47% 51%" },
  { id: "5", title: "Стойка амортизатора", article: "AB-50789", price: "4 250 ₽", priceNum: 4250, position: "60% 51%" },
  { id: "hp6", title: "Коврики EVA комплект", article: "AB-60890", price: "2 990 ₽", priceNum: 2990, position: "72% 51%" },
  { id: "hp7", title: "Щетки стеклоочистителя", article: "AB-70901", price: "890 ₽", priceNum: 890, position: "83% 51%" },
  { id: "hp8", title: "Аккумулятор 60Ah", article: "AB-81012", price: "6 450 ₽", priceNum: 6450, position: "94% 51%" },
];

function visualStyle(position: string): React.CSSProperties {
  return {
    backgroundImage: "url('/avtobaks-reference.png')",
    backgroundPosition: position,
  };
}

export default function HitProducts() {
  const { addItem } = useCart();

  const handleAdd = (p: HitProduct) => {
    addItem({
      id: p.id,
      title: p.title,
      article: p.article,
      price: p.priceNum,
      category: "Разное",
      inStock: true,
      image: `https://placehold.co/300x220/1a1a1a/ffffff?text=${encodeURIComponent(p.title)}`,
      description: "",
    });
  };

  return (
    <>
      <div className={styles.sectionHead}>
        <h2>Хиты каталога</h2>
        <Link href="/catalog">Смотреть все</Link>
      </div>
      <div className={styles.productGrid}>
        {hitProducts.map((p) => (
          <article className={styles.productCard} key={p.article}>
            <div className={styles.productImage} style={visualStyle(p.position)} />
            <h3>{p.title}</h3>
            <p>Артикул: {p.article}</p>
            <span>В наличии</span>
            <strong>{p.price}</strong>
            <div className={styles.productActions}>
              <Link href="/catalog">Подробнее</Link>
              <button
                className={styles.cartBtn}
                onClick={() => handleAdd(p)}
              >
                В корзину
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
