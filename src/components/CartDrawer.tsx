"use client";

import Image from "next/image";
import { useCart } from "@/context/CartContext";
import styles from "./CartDrawer.module.css";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, clearCart, totalCount, totalPrice } =
    useCart();

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.open : ""}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.open : ""}`}
        aria-label="Корзина"
      >
        <div className={styles.drawerHeader}>
          <p className={styles.drawerTitle}>
            Корзина
            {totalCount > 0 && (
              <span className={styles.drawerCount}>{totalCount}</span>
            )}
          </p>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Закрыть корзину">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🛒</span>
            <p className={styles.emptyText}>Корзина пуста</p>
            <p style={{ fontSize: "0.82rem" }}>Добавьте товары из каталога</p>
          </div>
        ) : (
          <div className={styles.items}>
            {items.map((item) => (
              <div className={styles.item} key={item.id}>
                <div className={styles.itemImage}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="72px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemTitle}>{item.title}</p>
                  <p className={styles.itemArticle}>Арт: {item.article}</p>
                  <p className={styles.itemPrice}>
                    {(item.price * item.qty).toLocaleString("ru-RU")} ₽
                  </p>
                  <div className={styles.qtyControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      aria-label="Уменьшить количество"
                    >
                      −
                    </button>
                    <span className={styles.qtyValue}>{item.qty}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      aria-label="Увеличить количество"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.id)}
                  aria-label={`Удалить ${item.title}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className={styles.drawerFooter}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Итого:</span>
              <span className={styles.totalPrice}>
                {totalPrice.toLocaleString("ru-RU")} ₽
              </span>
            </div>
            <button className={styles.checkoutBtn}>
              Оформить заявку
            </button>
            <button className={styles.clearBtn} onClick={clearCart}>
              Очистить корзину
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export function CartFloatButton() {
  const { totalCount, openCart } = useCart();

  if (totalCount === 0) return null;

  return (
    <button className={styles.cartFloat} onClick={openCart} aria-label="Открыть корзину">
      <span className={styles.cartFloatIcon}>🛒</span>
      Корзина
      <span className={styles.cartFloatBadge} key={totalCount}>
        {totalCount}
      </span>
    </button>
  );
}
