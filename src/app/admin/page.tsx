"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";

type OrderItem = { title: string; qty: number; price: number };
type Order = {
  id: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  createdAt: string;
  items: OrderItem[];
};
type User = {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  createdAt: string;
  orders: Order[];
  _count: { favorites: number };
};

const STATUS_LABEL: Record<Order["status"], string> = {
  processing: "Обрабатывается",
  shipped:    "В пути",
  delivered:  "Доставлен",
  cancelled:  "Отменён",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed]     = useState(false);
  const [authErr, setAuthErr]   = useState("");
  const [users, setUsers]       = useState<User[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchUsers = useCallback(async (q: string, pwd: string) => {
    setLoading(true);
    const r = await fetch(`/api/admin?q=${encodeURIComponent(q)}`, {
      headers: { "x-admin-password": pwd },
    });
    if (r.status === 401) { setAuthed(false); setAuthErr("Неверный пароль"); setLoading(false); return; }
    const data = await r.json();
    setUsers(data);
    setLoading(false);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/admin", {
      headers: { "x-admin-password": password },
    });
    if (r.status === 401) { setAuthErr("Неверный пароль"); setLoading(false); return; }
    const data = await r.json();
    setUsers(data);
    setAuthed(true);
    setLoading(false);
  }

  useEffect(() => {
    if (!authed) return;
    const t = setTimeout(() => fetchUsers(search, password), 300);
    return () => clearTimeout(t);
  }, [search, authed, password, fetchUsers]);

  const totalRevenue = users.reduce((sum, u) =>
    sum + u.orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0), 0);
  const totalOrders = users.reduce((sum, u) => sum + u.orders.length, 0);

  if (!authed) {
    return (
      <div className={styles.loginWrap}>
        <form className={styles.loginCard} onSubmit={handleLogin}>
          <div className={styles.loginLogo}>
            <span className={styles.loginMark}>A</span>
            <span>Автобакс</span>
            <span className={styles.loginBadge}>Admin</span>
          </div>
          <h1 className={styles.loginTitle}>Вход в админку</h1>
          <input
            className={styles.loginInput}
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => { setPassword(e.target.value); setAuthErr(""); }}
            autoFocus
          />
          {authErr && <p className={styles.loginErr}>{authErr}</p>}
          <button className={styles.loginBtn} type="submit" disabled={loading}>
            {loading ? "Проверяем…" : "Войти"}
          </button>
          <p className={styles.loginHint}>Пароль задаётся в <code>.env.local</code> → <code>ADMIN_PASSWORD</code></p>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.mark}>A</span>
          <span className={styles.brand}>Автобакс</span>
          <span className={styles.badge}>Admin</span>
        </div>
        <button className={styles.logoutBtn} onClick={() => { setAuthed(false); setPassword(""); }}>
          Выйти
        </button>
      </header>

      <div className={styles.wrap}>
        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{users.length}</span>
            <span className={styles.statLabel}>Пользователей</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalOrders}</span>
            <span className={styles.statLabel}>Заказов</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalRevenue.toLocaleString("ru-RU")} ₽</span>
            <span className={styles.statLabel}>Выручка</span>
          </div>
        </div>

        {/* Search */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className={styles.searchInput}
              placeholder="Поиск по телефону, имени или email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className={styles.clearBtn} onClick={() => setSearch("")}>✕</button>}
          </div>
          <span className={styles.count}>{loading ? "…" : `${users.length} чел.`}</span>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Телефон</th>
                <th>Email</th>
                <th>Заказов</th>
                <th>Избранное</th>
                <th>Регистрация</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading && (
                <tr><td colSpan={7} className={styles.empty}>Нет пользователей</td></tr>
              )}
              {users.map(user => (
                <>
                  <tr key={user.id} className={expanded === user.id ? styles.rowExpanded : styles.row}>
                    <td>
                      <div className={styles.userCell}>
                        <span className={styles.avatar}>{user.name.charAt(0).toUpperCase()}</span>
                        <span className={styles.userName}>{user.name}</span>
                      </div>
                    </td>
                    <td className={styles.phone}>{user.phone}</td>
                    <td className={styles.muted}>{user.email || "—"}</td>
                    <td>
                      <span className={styles.orderCount}>{user.orders.length}</span>
                    </td>
                    <td className={styles.muted}>{user._count.favorites}</td>
                    <td className={styles.muted}>{formatDate(user.createdAt)}</td>
                    <td>
                      {user.orders.length > 0 && (
                        <button
                          className={styles.expandBtn}
                          onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                        >
                          {expanded === user.id ? "Скрыть" : "Заказы"}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: expanded === user.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>

                  {expanded === user.id && (
                    <tr key={user.id + "_orders"} className={styles.ordersRow}>
                      <td colSpan={7}>
                        <div className={styles.ordersList}>
                          {user.orders.map(order => (
                            <div key={order.id} className={styles.orderCard}>
                              <div className={styles.orderHead}>
                                <span className={styles.orderId}>{order.id}</span>
                                <span className={`${styles.statusBadge} ${styles["status_" + order.status]}`}>
                                  {STATUS_LABEL[order.status]}
                                </span>
                                <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                                <span className={styles.orderTotal}>{order.total.toLocaleString("ru-RU")} ₽</span>
                              </div>
                              <div className={styles.orderItems}>
                                {order.items.map((item, i) => (
                                  <span key={i} className={styles.orderItem}>
                                    {item.title} × {item.qty} — {(item.price * item.qty).toLocaleString("ru-RU")} ₽
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
