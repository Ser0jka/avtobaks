"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
type SupplierOffer = {
  id: string;
  supplier: string;
  rawBrand: string;
  rawArticle: string;
  rawName: string;
  priceMin: number;
  stockTotal: number;
  deliveryMinDays: number | null;
  warehouses: string | null;
};
type CatalogProduct = {
  id: string;
  title: string;
  article: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stockCount: number;
  deliveryDays: number | null;
  imageUrl: string | null;
  isActive: boolean;
  offers: SupplierOffer[];
};
type VinRequest = {
  id: string;
  vin: string;
  partsText: string;
  customerName: string;
  contact: string;
  comment: string | null;
  status: string;
  vehicle: unknown;
  oeParts: unknown;
  searchTargets: unknown;
  offers: unknown;
  backendLog: string | null;
  resultHtmlPath: string | null;
  createdAt: string;
};
type Tab = "users" | "products" | "vin";

const STATUS_LABEL: Record<Order["status"], string> = {
  processing: "Обрабатывается",
  shipped: "В пути",
  delivered: "Доставлен",
  cancelled: "Отменен",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

function listLength(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function vehicleTitle(value: unknown) {
  if (!value || typeof value !== "object") return "Авто не расшифровано";
  const vehicle = value as Record<string, unknown>;
  return [vehicle.make, vehicle.model, vehicle.model_year || vehicle.modelYear]
    .filter(Boolean)
    .join(" ") || "Авто не расшифровано";
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState("");
  const [tab, setTab] = useState<Tab>("products");
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [vinRequests, setVinRequests] = useState<VinRequest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [notice, setNotice] = useState("");

  const adminHeaders = useCallback((pwd = password) => ({ "x-admin-password": pwd }), [password]);

  const fetchUsers = useCallback(async (q: string, pwd = password) => {
    const r = await fetch(`/api/admin?q=${encodeURIComponent(q)}`, { headers: adminHeaders(pwd) });
    if (r.status === 401) throw new Error("unauthorized");
    setUsers(await r.json());
  }, [adminHeaders, password]);

  const fetchProducts = useCallback(async (q: string, pwd = password) => {
    const r = await fetch(`/api/admin/catalog?q=${encodeURIComponent(q)}`, { headers: adminHeaders(pwd) });
    if (r.status === 401) throw new Error("unauthorized");
    setProducts(await r.json());
  }, [adminHeaders, password]);

  const fetchVinRequests = useCallback(async (q: string, pwd = password) => {
    const r = await fetch(`/api/admin/vin-requests?q=${encodeURIComponent(q)}`, { headers: adminHeaders(pwd) });
    if (r.status === 401) throw new Error("unauthorized");
    setVinRequests(await r.json());
  }, [adminHeaders, password]);

  async function loadCurrentTab(q = search, pwd = password) {
    setLoading(true);
    setNotice("");
    try {
      if (tab === "users") await fetchUsers(q, pwd);
      if (tab === "products") await fetchProducts(q, pwd);
      if (tab === "vin") await fetchVinRequests(q, pwd);
    } catch {
      setAuthed(false);
      setAuthErr("Неверный пароль");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAuthErr("");
    try {
      await fetchProducts("", password);
      setAuthed(true);
      setTab("products");
    } catch {
      setAuthErr("Неверный пароль");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authed) return;
    const timer = setTimeout(() => { loadCurrentTab(search); }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab, authed]);

  async function importCatalog() {
    setLoading(true);
    setNotice("");
    const r = await fetch("/api/admin/catalog/import", {
      method: "POST",
      headers: adminHeaders(),
    });
    const data = await r.json();
    setLoading(false);

    if (!r.ok) {
      setNotice(data.error ?? "Не удалось импортировать каталог");
      return;
    }

    setNotice(`Импортировано: ${data.productCount} товаров, ${data.offerCount} предложений`);
    await fetchProducts(search);
  }

  async function saveProduct() {
    if (!editing) return;
    setLoading(true);
    const r = await fetch(`/api/admin/catalog/${encodeURIComponent(editing.id)}`, {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setLoading(false);

    if (!r.ok) {
      setNotice("Не удалось сохранить карточку");
      return;
    }

    const saved = await r.json();
    setProducts((current) => current.map((product) => product.id === saved.id ? saved : product));
    setEditing(null);
    setNotice("Карточка сохранена");
  }

  async function updateVinStatus(id: string, status: string) {
    const r = await fetch(`/api/admin/vin-requests/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!r.ok) return;
    const saved = await r.json();
    setVinRequests((current) => current.map((request) => request.id === saved.id ? saved : request));
  }

  const totalRevenue = users.reduce((sum, user) =>
    sum + user.orders.filter((order) => order.status !== "cancelled").reduce((orderSum, order) => orderSum + order.total, 0), 0);
  const totalOrders = users.reduce((sum, user) => sum + user.orders.length, 0);

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
            onChange={(e) => { setPassword(e.target.value); setAuthErr(""); }}
            autoFocus
          />
          {authErr && <p className={styles.loginErr}>{authErr}</p>}
          <button className={styles.loginBtn} type="submit" disabled={loading}>
            {loading ? "Проверяем..." : "Войти"}
          </button>
          <p className={styles.loginHint}>Пароль задается в <code>.env</code> через <code>ADMIN_PASSWORD</code></p>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.page}>
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
        <div className={styles.tabs}>
          <button className={tab === "products" ? styles.tabActive : ""} onClick={() => { setTab("products"); setSearch(""); }}>Товары</button>
          <button className={tab === "vin" ? styles.tabActive : ""} onClick={() => { setTab("vin"); setSearch(""); }}>VIN-заявки</button>
          <button className={tab === "users" ? styles.tabActive : ""} onClick={() => { setTab("users"); setSearch(""); }}>Клиенты</button>
        </div>

        {tab === "users" && (
          <div className={styles.stats}>
            <div className={styles.stat}><span className={styles.statValue}>{users.length}</span><span className={styles.statLabel}>Пользователей</span></div>
            <div className={styles.stat}><span className={styles.statValue}>{totalOrders}</span><span className={styles.statLabel}>Заказов</span></div>
            <div className={styles.stat}><span className={styles.statValue}>{formatMoney(totalRevenue)}</span><span className={styles.statLabel}>Выручка</span></div>
          </div>
        )}

        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className={styles.searchInput}
              placeholder={tab === "products" ? "Поиск по названию, артикулу, бренду..." : tab === "vin" ? "Поиск по VIN, детали или контакту..." : "Поиск по телефону, имени или email..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className={styles.clearBtn} onClick={() => setSearch("")}>x</button>}
          </div>
          {tab === "products" && <button className={styles.primaryBtn} onClick={importCatalog} disabled={loading}>Импорт JSON</button>}
          <span className={styles.count}>{loading ? "..." : tab === "products" ? `${products.length} товаров` : tab === "vin" ? `${vinRequests.length} заявок` : `${users.length} чел.`}</span>
        </div>

        {notice && <div className={styles.notice}>{notice}</div>}

        {tab === "products" && (
          <div className={styles.adminGrid}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Артикул</th>
                    <th>Цена</th>
                    <th>Остаток</th>
                    <th>Срок</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 && !loading && (
                    <tr><td colSpan={6} className={styles.empty}>Каталог пуст. Нажмите кнопку импорта JSON.</td></tr>
                  )}
                  {products.map((product) => (
                    <tr key={product.id} className={styles.row}>
                      <td>
                        <div className={styles.productCell}>
                          {product.imageUrl && <Image src={product.imageUrl} alt="" width={54} height={42} unoptimized />}
                          <div>
                            <strong>{product.title}</strong>
                            <span>{product.brand} · {product.category || "Без категории"}</span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.phone}>{product.article}</td>
                      <td>{formatMoney(product.price)}</td>
                      <td>{product.stockCount} шт.</td>
                      <td>{product.deliveryDays ? `${product.deliveryDays} дн.` : "—"}</td>
                      <td><button className={styles.expandBtn} onClick={() => setEditing(product)}>Редактировать</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <aside className={styles.editorPanel}>
              {editing ? (
                <>
                  <h2>Карточка товара</h2>
                  <label>Название<input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
                  <label>Артикул<input value={editing.article} onChange={(e) => setEditing({ ...editing, article: e.target.value })} /></label>
                  <label>Бренд<input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></label>
                  <label>Категория<input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></label>
                  <label>Описание<textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
                  <div className={styles.editorTwo}>
                    <label>Цена<input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></label>
                    <label>Остаток<input type="number" value={editing.stockCount} onChange={(e) => setEditing({ ...editing, stockCount: Number(e.target.value) })} /></label>
                  </div>
                  <label>Фото URL<input value={editing.imageUrl ?? ""} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value || null })} /></label>
                  <label className={styles.checkboxLine}><input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Показывать на сайте</label>
                  <div className={styles.offerList}>
                    <h3>Предложения поставщика</h3>
                    {editing.offers.map((offer) => (
                      <p key={offer.id}>{offer.rawBrand} {offer.rawArticle}: {formatMoney(offer.priceMin)}, {offer.stockTotal} шт., {offer.deliveryMinDays ?? "?"} дн.</p>
                    ))}
                  </div>
                  <div className={styles.editorActions}>
                    <button className={styles.primaryBtn} onClick={saveProduct} disabled={loading}>Сохранить</button>
                    <button className={styles.expandBtn} onClick={() => setEditing(null)}>Закрыть</button>
                  </div>
                </>
              ) : (
                <div className={styles.emptyPanel}>
                  <h2>Редактирование</h2>
                  <p>Выберите товар, чтобы поправить название, описание, цену, фото или скрыть карточку с сайта.</p>
                </div>
              )}
            </aside>
          </div>
        )}

        {tab === "vin" && (
          <div className={styles.vinList}>
            {vinRequests.length === 0 && !loading && <div className={styles.emptyCard}>VIN-заявок пока нет</div>}
            {vinRequests.map((request) => (
              <article key={request.id} className={styles.vinCard}>
                <div className={styles.vinHead}>
                  <div>
                    <strong>{request.vin}</strong>
                    <span>{vehicleTitle(request.vehicle)}</span>
                  </div>
                  <span className={styles.statusBadge}>{request.status}</span>
                </div>
                <div className={styles.vinMeta}>
                  <span>Детали: {request.partsText}</span>
                  <span>Клиент: {request.customerName}, {request.contact}</span>
                  <span>{formatDate(request.createdAt)}</span>
                </div>
                {request.comment && <p className={styles.vinComment}>{request.comment}</p>}
                <div className={styles.vinSummary}>
                  <span>OEM: {listLength(request.oeParts)}</span>
                  <span>Цели поиска: {listLength(request.searchTargets)}</span>
                  <span>Предложения Rossko: {listLength(request.offers)}</span>
                </div>
                {request.backendLog && <p className={styles.backendLog}>{request.backendLog}</p>}
                <div className={styles.editorActions}>
                  <button className={styles.primaryBtn} onClick={() => updateVinStatus(request.id, "confirmed")}>Подтвердить</button>
                  <button className={styles.expandBtn} onClick={() => updateVinStatus(request.id, "needs_replace")}>Заменить</button>
                  <button className={styles.expandBtn} onClick={() => updateVinStatus(request.id, "sent_to_client")}>Отправлено клиенту</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "users" && (
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
                {users.map((user) => (
                  <>
                    <tr key={user.id} className={expanded === user.id ? styles.rowExpanded : styles.row}>
                      <td><div className={styles.userCell}><span className={styles.avatar}>{user.name.charAt(0).toUpperCase()}</span><span className={styles.userName}>{user.name}</span></div></td>
                      <td className={styles.phone}>{user.phone}</td>
                      <td className={styles.muted}>{user.email || "—"}</td>
                      <td><span className={styles.orderCount}>{user.orders.length}</span></td>
                      <td className={styles.muted}>{user._count.favorites}</td>
                      <td className={styles.muted}>{formatDate(user.createdAt)}</td>
                      <td>{user.orders.length > 0 && <button className={styles.expandBtn} onClick={() => setExpanded(expanded === user.id ? null : user.id)}>{expanded === user.id ? "Скрыть" : "Заказы"}</button>}</td>
                    </tr>
                    {expanded === user.id && (
                      <tr key={`${user.id}_orders`} className={styles.ordersRow}>
                        <td colSpan={7}>
                          <div className={styles.ordersList}>
                            {user.orders.map((order) => (
                              <div key={order.id} className={styles.orderCard}>
                                <div className={styles.orderHead}>
                                  <span className={styles.orderId}>{order.id}</span>
                                  <span className={`${styles.statusBadge} ${styles["status_" + order.status]}`}>{STATUS_LABEL[order.status]}</span>
                                  <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                                  <span className={styles.orderTotal}>{formatMoney(order.total)}</span>
                                </div>
                                <div className={styles.orderItems}>
                                  {order.items.map((item, index) => <span key={index} className={styles.orderItem}>{item.title} x {item.qty} — {formatMoney(item.price * item.qty)}</span>)}
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
        )}
      </div>
    </div>
  );
}
