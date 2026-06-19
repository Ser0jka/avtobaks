"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type Order } from "@/context/AuthContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
import { products } from "@/data/products";
import SiteHeader from "@/components/SiteHeader";
import styles from "./page.module.css";

type Tab = "orders" | "favorites" | "profile";

const STATUS_LABEL: Record<Order["status"], string> = {
  processing: "Обрабатывается",
  shipped:    "В пути",
  delivered:  "Доставлен",
  cancelled:  "Отменён",
};

export default function AccountPage() {
  const router = useRouter();
  const { user, orders, favorites, logout, updateProfile } = useAuth();
  const [tab, setTab]         = useState<Tab>("orders");
  const [editMode, setEditMode] = useState(false);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    if (!user) { router.push("/account/login"); return; }
  }, [user, router]);

  if (!user) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile({ name: name.trim() || "Пользователь", email: email.trim() || undefined });
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const favProducts = products.filter((p) => favorites.includes(p.id));

  function openEditMode() {
    if (!user) return;
    setName(user.name);
    setEmail(user.email ?? "");
    setEditMode(true);
  }

  return (
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.wrap}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Главная</Link><span>/</span><span>Личный кабинет</span>
        </nav>

        <div className={styles.layout}>
          {/* ── Sidebar ── */}
          <aside className={styles.sidebar}>
            <div className={styles.userCard}>
              <div className={styles.avatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={styles.userName}>{user.name}</p>
                <p className={styles.userPhone}>{user.phone}</p>
              </div>
            </div>

            <nav className={styles.sideNav}>
              {([
                { id: "orders",    label: "История заказов",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> },
                { id: "favorites", label: "Избранное",         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
                { id: "profile",   label: "Мои данные",        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
              ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((item) => (
                <button
                  key={item.id}
                  className={`${styles.sideNavItem} ${tab === item.id ? styles.sideNavActive : ""}`}
                  onClick={() => setTab(item.id)}
                >
                  <span className={styles.sideNavIcon}>{item.icon}</span>
                  {item.label}
                  {item.id === "favorites" && favorites.length > 0 && (
                    <span className={styles.badge}>{favorites.length}</span>
                  )}
                </button>
              ))}
            </nav>

            <button className={styles.logoutBtn} onClick={async () => { await logout(); router.push("/"); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Выйти
            </button>
          </aside>

          {/* ── Main ── */}
          <main className={styles.main}>

            {/* ── Заказы ── */}
            {tab === "orders" && (
              <div>
                <h1 className={styles.tabTitle}>История заказов</h1>
                {orders.length === 0 ? (
                  <div className={styles.empty}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                    <p>Заказов пока нет</p>
                    <Link href="/catalog" className={styles.emptyBtn}>Перейти в каталог</Link>
                  </div>
                ) : (
                  <div className={styles.orderList}>
                    {orders.map((order) => (
                      <div key={order.id} className={styles.orderCard}>
                        <div className={styles.orderHead}>
                          <div>
                            <p className={styles.orderId}>Заказ {order.id}</p>
                            <p className={styles.orderDate}>от {formatDate(order.createdAt)}</p>
                          </div>
                          <span className={`${styles.statusBadge} ${styles["status_" + order.status]}`}>
                            {STATUS_LABEL[order.status]}
                          </span>
                        </div>
                        <div className={styles.orderItems}>
                          {order.items.map((item, i) => (
                            <div key={i} className={styles.orderItem}>
                              <span className={styles.orderItemTitle}>{item.title}</span>
                              <span className={styles.orderItemQty}>× {item.qty}</span>
                              <span className={styles.orderItemPrice}>{(item.price * item.qty).toLocaleString("ru-RU")} ₽</span>
                            </div>
                          ))}
                        </div>
                        <div className={styles.orderFoot}>
                          <span className={styles.orderTotal}>Итого: <strong>{order.total.toLocaleString("ru-RU")} ₽</strong></span>
                          <Link href="/contacts" className={styles.orderRepeat}>Повторить заказ</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Избранное ── */}
            {tab === "favorites" && (
              <div>
                <h1 className={styles.tabTitle}>Избранное</h1>
                {favProducts.length === 0 ? (
                  <div className={styles.empty}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                    <p>Нет избранных товаров</p>
                    <Link href="/catalog" className={styles.emptyBtn}>Перейти в каталог</Link>
                  </div>
                ) : (
                  <div className={styles.favGrid}>
                    {favProducts.map((p) => (
                      <Link key={p.id} href={`/catalog?category=${p.category}`} className={styles.favCard}>
                        <p className={styles.favTitle}>{p.title}</p>
                        <p className={styles.favBrand}>{p.brand}</p>
                        <p className={styles.favPrice}>{p.price.toLocaleString("ru-RU")} ₽</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Профиль ── */}
            {tab === "profile" && (
              <div>
                <h1 className={styles.tabTitle}>Мои данные</h1>
                {saved && <div className={styles.savedBanner}>✓ Данные сохранены</div>}
                <div className={styles.profileCard}>
                  {editMode ? (
                    <form onSubmit={handleSave} className={styles.profileForm}>
                      <div className={styles.fieldWrap}>
                        <label className={styles.fieldLabel}>Имя</label>
                        <input className={styles.fieldInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" />
                      </div>
                      <div className={styles.fieldWrap}>
                        <label className={styles.fieldLabel}>Email</label>
                        <input className={styles.fieldInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                      </div>
                      <div className={styles.fieldWrap}>
                        <label className={styles.fieldLabel}>Телефон</label>
                        <input className={`${styles.fieldInput} ${styles.fieldReadonly}`} value={user.phone} readOnly />
                        <p className={styles.fieldNote}>Номер телефона изменить нельзя</p>
                      </div>
                      <div className={styles.profileActions}>
                        <button className={styles.saveBtn} type="submit">Сохранить</button>
                        <button className={styles.cancelBtn} type="button" onClick={() => { setEditMode(false); setName(user.name); setEmail(user.email ?? ""); }}>Отмена</button>
                      </div>
                    </form>
                  ) : (
                    <div className={styles.profileView}>
                      <div className={styles.profileRow}>
                        <span className={styles.profileLabel}>Имя</span>
                        <span className={styles.profileValue}>{user.name}</span>
                      </div>
                      <div className={styles.profileRow}>
                        <span className={styles.profileLabel}>Телефон</span>
                        <span className={styles.profileValue}>{user.phone}</span>
                      </div>
                      <div className={styles.profileRow}>
                        <span className={styles.profileLabel}>Email</span>
                        <span className={styles.profileValue}>{user.email || <span className={styles.notSet}>Не указан</span>}</span>
                      </div>
                      <button className={styles.editBtn} onClick={openEditMode}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Редактировать
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
