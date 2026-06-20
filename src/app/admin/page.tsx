"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
type CatalogStats = {
  total: number;
  active: number;
  withImage: number;
  withoutImage: number;
  outOfStock: number;
};
type CategoryOption = { name: string; count: number };
type CatalogResponse = {
  items: CatalogProduct[];
  total: number;
  limit: number;
  skip: number;
  categories: CategoryOption[];
  stats: CatalogStats;
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
type Tab = "products" | "vin" | "users";
type ImageFilter = "all" | "with" | "missing";
type ActiveFilter = "all" | "active" | "hidden";
type StockFilter = "all" | "in" | "out";
type SortMode = "updated" | "stock_desc" | "price_asc" | "price_desc" | "title";

const ORDER_STATUS_LABEL: Record<Order["status"], string> = {
  processing: "В обработке",
  shipped: "В пути",
  delivered: "Доставлен",
  cancelled: "Отменен",
};

const VIN_STATUS_LABEL: Record<string, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  needs_replace: "Нужна замена",
  sent_to_client: "Отправлена клиенту",
};

const EMPTY_STATS: CatalogStats = {
  total: 0,
  active: 0,
  withImage: 0,
  withoutImage: 0,
  outOfStock: 0,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
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
  return [vehicle.make, vehicle.model, vehicle.model_year || vehicle.modelYear].filter(Boolean).join(" ") || "Авто не расшифровано";
}

function productPatch(product: CatalogProduct) {
  return {
    title: product.title,
    article: product.article,
    brand: product.brand,
    category: product.category,
    description: product.description,
    price: product.price,
    oldPrice: product.oldPrice,
    stockCount: product.stockCount,
    deliveryDays: product.deliveryDays,
    isActive: product.isActive,
  };
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState("");
  const [tab, setTab] = useState<Tab>("products");
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [vinRequests, setVinRequests] = useState<VinRequest[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [draft, setDraft] = useState<CatalogProduct | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [catalogStats, setCatalogStats] = useState<CatalogStats>(EMPTY_STATS);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [imageFilter, setImageFilter] = useState<ImageFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sort, setSort] = useState<SortMode>("updated");
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const adminHeaders = useCallback((pwd = password) => ({ "x-admin-password": pwd }), [password]);

  const fetchProducts = useCallback(async (pwd = password) => {
    const params = new URLSearchParams({
      q: search,
      category,
      image: imageFilter,
      active: activeFilter,
      stock: stockFilter,
      sort,
      take: String(pageSize),
    });
    const response = await fetch(`/api/admin/catalog?${params.toString()}`, { headers: adminHeaders(pwd) });
    if (response.status === 401) throw new Error("unauthorized");
    const payload = await response.json() as CatalogResponse | CatalogProduct[];
    const items = Array.isArray(payload) ? payload : payload.items;
    setProducts(items);
    if (!Array.isArray(payload)) {
      setCatalogTotal(payload.total);
      setCategories(payload.categories);
      setCatalogStats(payload.stats);
    }
    const nextSelected = items[0] ?? null;
    setSelectedProduct(nextSelected);
    setDraft(nextSelected ? { ...nextSelected } : null);
  }, [activeFilter, adminHeaders, category, imageFilter, pageSize, password, search, sort, stockFilter]);

  const fetchUsers = useCallback(async (pwd = password) => {
    const response = await fetch(`/api/admin?q=${encodeURIComponent(search)}`, { headers: adminHeaders(pwd) });
    if (response.status === 401) throw new Error("unauthorized");
    setUsers(await response.json());
  }, [adminHeaders, password, search]);

  const fetchVinRequests = useCallback(async (pwd = password) => {
    const response = await fetch(`/api/admin/vin-requests?q=${encodeURIComponent(search)}`, { headers: adminHeaders(pwd) });
    if (response.status === 401) throw new Error("unauthorized");
    setVinRequests(await response.json());
  }, [adminHeaders, password, search]);

  const loadCurrentTab = useCallback(async (pwd = password) => {
    setLoading(true);
    setNotice("");
    try {
      if (tab === "products") await fetchProducts(pwd);
      if (tab === "users") await fetchUsers(pwd);
      if (tab === "vin") await fetchVinRequests(pwd);
    } catch {
      setAuthed(false);
      setAuthErr("Неверный пароль");
    } finally {
      setLoading(false);
    }
  }, [fetchProducts, fetchUsers, fetchVinRequests, password, tab]);

  useEffect(() => {
    if (!authed) return;
    const timer = window.setTimeout(() => {
      void loadCurrentTab();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [authed, loadCurrentTab]);

  const totalRevenue = useMemo(() => users.reduce((sum, user) =>
    sum + user.orders.filter((order) => order.status !== "cancelled").reduce((orderSum, order) => orderSum + order.total, 0), 0), [users]);
  const totalOrders = useMemo(() => users.reduce((sum, user) => sum + user.orders.length, 0), [users]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setAuthErr("");
    try {
      await fetchProducts(password);
      setAuthed(true);
      setTab("products");
    } catch {
      setAuthErr("Неверный пароль");
    } finally {
      setLoading(false);
    }
  }

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    setSearch("");
    setNotice("");
  }

  async function importCatalog() {
    setLoading(true);
    setNotice("");
    const response = await fetch("/api/admin/catalog/import", {
      method: "POST",
      headers: adminHeaders(),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setNotice(data.error ?? "Не удалось импортировать каталог");
      return;
    }
    setNotice(`Импортировано: ${data.productCount} товаров, ${data.offerCount} предложений`);
    await fetchProducts();
  }

  async function saveProduct() {
    if (!draft) return;
    setSaving(true);
    setNotice("");
    const response = await fetch(`/api/admin/catalog/${encodeURIComponent(draft.id)}`, {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(productPatch(draft)),
    });
    setSaving(false);
    if (!response.ok) {
      setNotice("Не удалось сохранить карточку");
      return;
    }
    const saved = await response.json() as CatalogProduct;
    setProducts((current) => current.map((product) => product.id === saved.id ? saved : product));
    setSelectedProduct(saved);
    setDraft({ ...saved });
    setNotice("Карточка сохранена");
  }

  async function uploadProductImage(file: File) {
    if (!draft) return;
    setSaving(true);
    setNotice("");
    const body = new FormData();
    body.append("image", file);
    const response = await fetch(`/api/admin/catalog/${encodeURIComponent(draft.id)}/image`, {
      method: "POST",
      headers: adminHeaders(),
      body,
    });
    setSaving(false);
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error ?? "Не удалось загрузить фото");
      return;
    }
    const saved = data as CatalogProduct;
    setProducts((current) => current.map((product) => product.id === saved.id ? saved : product));
    setSelectedProduct(saved);
    setDraft({ ...saved });
    setNotice("Фото загружено");
  }

  async function updateVinStatus(id: string, status: string) {
    const response = await fetch(`/api/admin/vin-requests/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return;
    const saved = await response.json() as VinRequest;
    setVinRequests((current) => current.map((request) => request.id === saved.id ? saved : request));
  }

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
            onChange={(event) => {
              setPassword(event.target.value);
              setAuthErr("");
            }}
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

      <main className={styles.wrap}>
        <div className={styles.tabs}>
          <button className={tab === "products" ? styles.tabActive : ""} onClick={() => selectTab("products")}>Товары</button>
          <button className={tab === "vin" ? styles.tabActive : ""} onClick={() => selectTab("vin")}>VIN-заявки</button>
          <button className={tab === "users" ? styles.tabActive : ""} onClick={() => selectTab("users")}>Клиенты</button>
        </div>

        {tab === "products" && (
          <>
            <section className={styles.stats}>
              <div className={styles.stat}><span className={styles.statValue}>{catalogStats.total}</span><span className={styles.statLabel}>Всего товаров</span></div>
              <div className={styles.stat}><span className={styles.statValue}>{catalogStats.active}</span><span className={styles.statLabel}>Показываются</span></div>
              <div className={styles.stat}><span className={styles.statValue}>{catalogStats.withImage}</span><span className={styles.statLabel}>С фото</span></div>
              <div className={styles.stat}><span className={styles.statValue}>{catalogStats.withoutImage}</span><span className={styles.statLabel}>Без фото</span></div>
              <div className={styles.stat}><span className={styles.statValue}>{catalogStats.outOfStock}</span><span className={styles.statLabel}>Нет остатков</span></div>
            </section>

            <section className={styles.toolbar}>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>⌕</span>
                <input
                  className={styles.searchInput}
                  placeholder="Название, артикул, бренд или категория"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && <button className={styles.clearBtn} onClick={() => setSearch("")}>×</button>}
              </div>
              <button className={styles.primaryBtn} onClick={importCatalog} disabled={loading}>Импорт JSON</button>
            </section>

            <section className={styles.filters}>
              <label>Категория
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="">Все категории</option>
                  {categories.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.count})</option>)}
                </select>
              </label>
              <label>Фото
                <select value={imageFilter} onChange={(event) => setImageFilter(event.target.value as ImageFilter)}>
                  <option value="all">Все</option>
                  <option value="missing">Без фото</option>
                  <option value="with">С фото</option>
                </select>
              </label>
              <label>Видимость
                <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}>
                  <option value="all">Все</option>
                  <option value="active">На сайте</option>
                  <option value="hidden">Скрытые</option>
                </select>
              </label>
              <label>Остаток
                <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)}>
                  <option value="all">Любой</option>
                  <option value="in">В наличии</option>
                  <option value="out">Нет остатков</option>
                </select>
              </label>
              <label>Сортировка
                <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                  <option value="updated">Недавно обновленные</option>
                  <option value="stock_desc">Больше остатков</option>
                  <option value="price_asc">Сначала дешевле</option>
                  <option value="price_desc">Сначала дороже</option>
                  <option value="title">По названию</option>
                </select>
              </label>
              <label className={styles.pageSizeControl}>На странице
                <span className={styles.pageSizeBox}>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={pageSize}
                    onChange={(event) => {
                      const next = Math.max(1, Math.min(500, Number(event.target.value) || 1));
                      setPageSize(next);
                    }}
                  />
                  <span className={styles.sizePresets}>
                    {[10, 20, 50].map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={pageSize === size ? styles.sizeActive : ""}
                        onClick={() => setPageSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </span>
                </span>
              </label>
              <span className={styles.count}>{loading ? "Загружаем..." : `Показано ${products.length} из ${catalogTotal}`}</span>
            </section>
          </>
        )}

        {tab === "users" && (
          <>
            <section className={styles.stats}>
              <div className={styles.stat}><span className={styles.statValue}>{users.length}</span><span className={styles.statLabel}>Клиентов</span></div>
              <div className={styles.stat}><span className={styles.statValue}>{totalOrders}</span><span className={styles.statLabel}>Заказов</span></div>
              <div className={styles.stat}><span className={styles.statValue}>{formatMoney(totalRevenue)}</span><span className={styles.statLabel}>Выручка</span></div>
            </section>
            <section className={styles.toolbar}>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>⌕</span>
                <input className={styles.searchInput} placeholder="Телефон, имя или email" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </section>
          </>
        )}

        {tab === "vin" && (
          <section className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="VIN, деталь, контакт или клиент" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <span className={styles.count}>{loading ? "Загружаем..." : `${vinRequests.length} заявок`}</span>
          </section>
        )}

        {notice && <div className={styles.notice}>{notice}</div>}

        {tab === "products" && (
          <section className={styles.managerGrid}>
            <div className={styles.productList}>
              {products.length === 0 && !loading && <div className={styles.empty}>По этим фильтрам ничего не найдено</div>}
              {products.map((product) => (
                <button
                  key={product.id}
                  className={`${styles.productRow} ${selectedProduct?.id === product.id ? styles.productRowActive : ""}`}
                  onClick={() => {
                    setSelectedProduct(product);
                    setDraft({ ...product });
                  }}
                >
                  <span className={styles.productThumb}>
                    {product.imageUrl ? <Image src={product.imageUrl} alt="" width={76} height={62} unoptimized /> : <span>Нет фото</span>}
                  </span>
                  <span className={styles.productInfo}>
                    <strong>{product.title}</strong>
                    <span>{product.brand || "Без бренда"} · {product.article || "Без артикула"}</span>
                    <span>{product.category || "Без категории"}</span>
                  </span>
                  <span className={styles.productNumbers}>
                    <strong>{formatMoney(product.price)}</strong>
                    <span>{product.stockCount} шт.</span>
                    {!product.isActive && <em>Скрыт</em>}
                  </span>
                </button>
              ))}
            </div>

            <aside className={styles.editorPanel}>
              {draft ? (
                <>
                  <div className={styles.editorHead}>
                    <div>
                      <h2>Карточка товара</h2>
                      <p>{draft.brand} · {draft.article}</p>
                    </div>
                    <span className={draft.isActive ? styles.greenBadge : styles.grayBadge}>{draft.isActive ? "На сайте" : "Скрыт"}</span>
                  </div>

                  <div className={styles.imageManager}>
                    <div className={styles.imagePreview}>
                      {draft.imageUrl ? <Image src={draft.imageUrl} alt="" width={430} height={190} unoptimized /> : <span>Фото не загружено</span>}
                    </div>
                    <label className={styles.fileButton}>
                      Загрузить фото с устройства
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadProductImage(file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <p className={styles.fileHint}>JPG, PNG или WebP до 8 МБ. После загрузки фото сразу привяжется к товару.</p>
                  </div>

                  <div className={styles.formGrid}>
                    <label className={styles.fullField}>Название
                      <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                    </label>
                    <label>Артикул
                      <input value={draft.article} onChange={(event) => setDraft({ ...draft, article: event.target.value })} />
                    </label>
                    <label>Бренд
                      <input value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} />
                    </label>
                    <label>Категория
                      <input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
                    </label>
                    <label>Цена
                      <input type="number" min="0" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} />
                    </label>
                    <label>Остаток
                      <input type="number" min="0" value={draft.stockCount} onChange={(event) => setDraft({ ...draft, stockCount: Number(event.target.value) })} />
                    </label>
                    <label>Срок, дней
                      <input type="number" min="0" value={draft.deliveryDays ?? ""} onChange={(event) => setDraft({ ...draft, deliveryDays: event.target.value ? Number(event.target.value) : null })} />
                    </label>
                    <label className={styles.fullField}>Описание
                      <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                    </label>
                  </div>

                  <label className={styles.switchLine}>
                    <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />
                    Показывать карточку на сайте
                  </label>

                  <div className={styles.offerList}>
                    <h3>Предложения поставщика</h3>
                    {draft.offers.length === 0 && <p>Предложений пока нет</p>}
                    {draft.offers.map((offer) => (
                      <p key={offer.id}>{offer.rawBrand} {offer.rawArticle}: {formatMoney(offer.priceMin)}, {offer.stockTotal} шт., {offer.deliveryMinDays ?? "?"} дн.</p>
                    ))}
                  </div>

                  <div className={styles.editorActions}>
                    <button className={styles.primaryBtn} onClick={saveProduct} disabled={saving}>{saving ? "Сохраняем..." : "Сохранить"}</button>
                    <button className={styles.secondaryBtn} onClick={() => setDraft(selectedProduct ? { ...selectedProduct } : null)}>Отменить</button>
                  </div>
                </>
              ) : (
                <div className={styles.emptyPanel}>
                  <h2>Выберите товар</h2>
                  <p>Здесь можно поправить карточку, скрыть товар или загрузить фото с компьютера.</p>
                </div>
              )}
            </aside>
          </section>
        )}

        {tab === "vin" && (
          <section className={styles.vinList}>
            {vinRequests.length === 0 && !loading && <div className={styles.emptyCard}>VIN-заявок пока нет</div>}
            {vinRequests.map((request) => (
              <article key={request.id} className={styles.vinCard}>
                <div className={styles.vinHead}>
                  <div>
                    <strong>{request.vin}</strong>
                    <span>{vehicleTitle(request.vehicle)}</span>
                  </div>
                  <span className={styles.statusBadge}>{VIN_STATUS_LABEL[request.status] ?? request.status}</span>
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
                  <span>Предложения: {listLength(request.offers)}</span>
                </div>
                {request.backendLog && <p className={styles.backendLog}>{request.backendLog}</p>}
                <div className={styles.editorActions}>
                  <button className={styles.primaryBtn} onClick={() => updateVinStatus(request.id, "confirmed")}>Подтвердить</button>
                  <button className={styles.secondaryBtn} onClick={() => updateVinStatus(request.id, "needs_replace")}>Нужна замена</button>
                  <button className={styles.secondaryBtn} onClick={() => updateVinStatus(request.id, "sent_to_client")}>Отправлено клиенту</button>
                </div>
              </article>
            ))}
          </section>
        )}

        {tab === "users" && (
          <section className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Телефон</th>
                  <th>Email</th>
                  <th>Заказы</th>
                  <th>Избранное</th>
                  <th>Регистрация</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !loading && <tr><td colSpan={7} className={styles.empty}>Клиенты не найдены</td></tr>}
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><div className={styles.userCell}><span className={styles.avatar}>{user.name.charAt(0).toUpperCase()}</span><strong>{user.name}</strong></div></td>
                    <td>{user.phone}</td>
                    <td className={styles.muted}>{user.email || "—"}</td>
                    <td>{user.orders.length}</td>
                    <td>{user._count.favorites}</td>
                    <td className={styles.muted}>{formatDate(user.createdAt)}</td>
                    <td>{user.orders.length > 0 && <button className={styles.secondaryBtn} onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>{expandedUser === user.id ? "Скрыть" : "Заказы"}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expandedUser && (
              <div className={styles.ordersList}>
                {users.find((user) => user.id === expandedUser)?.orders.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHead}>
                      <strong>{order.id}</strong>
                      <span>{ORDER_STATUS_LABEL[order.status]}</span>
                      <span>{formatDate(order.createdAt)}</span>
                      <b>{formatMoney(order.total)}</b>
                    </div>
                    {order.items.map((item, index) => <p key={index}>{item.title} × {item.qty} — {formatMoney(item.price * item.qty)}</p>)}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
