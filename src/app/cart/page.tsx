"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import SiteHeader from "@/components/SiteHeader";
import styles from "./page.module.css";

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();

  return (
    <div className={styles.page}>
      <SiteHeader />
      <div className={styles.wrap}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Главная</Link><span>/</span>
          <Link href="/catalog">Каталог</Link><span>/</span>
          <span>Корзина</span>
        </nav>

        <h1 className={styles.title}>Корзина</h1>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <p>Корзина пуста</p>
            <Link href="/catalog" className={styles.emptyBtn}>Перейти в каталог</Link>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Items */}
            <div className={styles.itemsCol}>
              <div className={styles.itemsHeader}>
                <span>{items.length} {items.length === 1 ? "товар" : items.length < 5 ? "товара" : "товаров"}</span>
                <button className={styles.clearBtn} onClick={clearCart}>Очистить</button>
              </div>

              <div className={styles.itemsList}>
                {items.map((item) => (
                  <div key={item.id} className={styles.itemCard}>
                    <div className={styles.itemImg}>
                      <Image src={item.image} alt={item.title} fill style={{ objectFit: "contain" }} sizes="80px" />
                    </div>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemBrand}>{item.brand}</p>
                      <p className={styles.itemTitle}>{item.title}</p>
                      <p className={styles.itemArticle}>Арт. {item.article}</p>
                    </div>
                    <div className={styles.itemControls}>
                      <div className={styles.qtyRow}>
                        <button className={styles.qtyBtn} onClick={() => updateQty(item.id, item.qty - 1)} disabled={item.qty <= 1}>−</button>
                        <span className={styles.qtyVal}>{item.qty}</span>
                        <button className={styles.qtyBtn} onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                      </div>
                      <p className={styles.itemPrice}>{(item.price * item.qty).toLocaleString("ru-RU")} ₽</p>
                      <p className={styles.itemPricePer}>{item.price.toLocaleString("ru-RU")} ₽ / шт.</p>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeItem(item.id)} aria-label="Удалить">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <aside className={styles.summary}>
              <h2 className={styles.summaryTitle}>Итого</h2>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Товары ({items.reduce((s, i) => s + i.qty, 0)} шт.)</span>
                  <span>{totalPrice.toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Доставка</span>
                  <span className={styles.summaryDelivery}>уточняется</span>
                </div>
              </div>
              <div className={styles.summaryTotal}>
                <span>Сумма заказа</span>
                <span>{totalPrice.toLocaleString("ru-RU")} ₽</span>
              </div>
              <Link href="/checkout" className={styles.checkoutBtn}>
                Оформить заказ
              </Link>
              <Link href="/catalog" className={styles.continueBtn}>
                Продолжить покупки
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
