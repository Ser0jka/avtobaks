"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import SiteHeader from "@/components/SiteHeader";
import styles from "./page.module.css";

type DeliveryType = "pickup" | "delivery";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  const [name, setName]         = useState(user?.name ?? "");
  const [phone, setPhone]       = useState(user?.phone ?? "");
  const [delivery, setDelivery] = useState<DeliveryType>("pickup");
  const [address, setAddress]   = useState("");
  const [comment, setComment]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [done, setDone]         = useState(false);
  const [orderId, setOrderId]   = useState("");

  if (items.length === 0 && !done) {
    return (
      <div className={styles.page}>
        <SiteHeader />
        <div className={styles.wrap}>
          <div className={styles.emptyCart}>
            <p>Корзина пуста — нечего оформлять</p>
            <Link href="/catalog" className={styles.emptyBtn}>В каталог</Link>
          </div>
        </div>
      </div>
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Укажите имя";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) e.phone = "Укажите корректный телефон";
    if (delivery === "delivery" && !address.trim()) e.address = "Укажите адрес доставки";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ id: i.id, title: i.title, price: i.price, qty: i.qty })),
        customerName:  name.trim(),
        customerPhone: phone.trim(),
        deliveryType:  delivery,
        address:       delivery === "delivery" ? address.trim() : undefined,
        comment:       comment.trim() || undefined,
      }),
    });

    setLoading(false);

    if (!r.ok) {
      const d = await r.json();
      setErrors({ _: d.error ?? "Ошибка при оформлении заказа" });
      return;
    }

    const data = await r.json();
    setOrderId(data.orderId);
    clearCart();
    setDone(true);
  }

  // ── Success screen ──
  if (done) {
    return (
      <div className={styles.page}>
        <SiteHeader />
        <div className={styles.wrap}>
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className={styles.successTitle}>Заказ оформлен!</h1>
            <p className={styles.successSub}>
              Мы свяжемся с вами по номеру <strong>{phone}</strong> для подтверждения.
            </p>
            <p className={styles.successId}>№ заказа: <code>{orderId.slice(-8).toUpperCase()}</code></p>
            <div className={styles.successActions}>
              <Link href="/" className={styles.successBtn}>На главную</Link>
              {user && <Link href="/account" className={styles.successBtnOutline}>Мои заказы</Link>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className={styles.page}>
      <SiteHeader />
      <div className={styles.wrap}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Главная</Link><span>/</span>
          <Link href="/cart">Корзина</Link><span>/</span>
          <span>Оформление заказа</span>
        </nav>

        <h1 className={styles.title}>Оформление заказа</h1>

        <div className={styles.layout}>
          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>

            {/* Контактные данные */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Контактные данные</h2>
              <div className={styles.fields}>
                <div className={styles.fieldWrap}>
                  <label className={styles.label}>Имя <span className={styles.req}>*</span></label>
                  <input
                    className={`${styles.input} ${errors.name ? styles.inputErr : ""}`}
                    value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
                    placeholder="Ваше имя"
                  />
                  {errors.name && <p className={styles.err}>{errors.name}</p>}
                </div>
                <div className={styles.fieldWrap}>
                  <label className={styles.label}>Телефон <span className={styles.req}>*</span></label>
                  <input
                    className={`${styles.input} ${errors.phone ? styles.inputErr : ""}`}
                    type="tel"
                    value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: "" })); }}
                    placeholder="+7 (___) ___-__-__"
                  />
                  {errors.phone && <p className={styles.err}>{errors.phone}</p>}
                </div>
              </div>
            </section>

            {/* Способ получения */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Способ получения</h2>
              <div className={styles.deliveryOptions}>
                <label className={`${styles.deliveryOpt} ${delivery === "pickup" ? styles.deliveryOptActive : ""}`}>
                  <input type="radio" name="delivery" value="pickup" checked={delivery === "pickup"} onChange={() => setDelivery("pickup")} className={styles.radioHidden} />
                  <span className={styles.deliveryIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </span>
                  <div>
                    <p className={styles.deliveryName}>Самовывоз</p>
                    <p className={styles.deliveryNote}>пр. Ленина, 70 или пр. Ленина, 103</p>
                  </div>
                </label>
                <label className={`${styles.deliveryOpt} ${delivery === "delivery" ? styles.deliveryOptActive : ""}`}>
                  <input type="radio" name="delivery" value="delivery" checked={delivery === "delivery"} onChange={() => setDelivery("delivery")} className={styles.radioHidden} />
                  <span className={styles.deliveryIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="1" y="3" width="15" height="13" rx="1"/>
                      <path d="M16 8h4l3 5v4h-7V8z"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  </span>
                  <div>
                    <p className={styles.deliveryName}>Доставка по Кемерово</p>
                    <p className={styles.deliveryNote}>стоимость уточняется у менеджера</p>
                  </div>
                </label>
              </div>

              {delivery === "delivery" && (
                <div className={styles.fieldWrap} style={{ marginTop: "1rem" }}>
                  <label className={styles.label}>Адрес доставки <span className={styles.req}>*</span></label>
                  <input
                    className={`${styles.input} ${errors.address ? styles.inputErr : ""}`}
                    value={address} onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: "" })); }}
                    placeholder="Улица, дом, квартира"
                  />
                  {errors.address && <p className={styles.err}>{errors.address}</p>}
                </div>
              )}
            </section>

            {/* Комментарий */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Комментарий к заказу</h2>
              <textarea
                className={styles.textarea}
                value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Уточнения по заказу, время звонка, марка/модель автомобиля…"
                rows={3}
              />
            </section>

            {errors._ && <p className={styles.globalErr}>{errors._}</p>}

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? "Оформляем…" : `Оформить заказ — ${totalPrice.toLocaleString("ru-RU")} ₽`}
            </button>
          </form>

          {/* Order summary */}
          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Ваш заказ</h2>
            <div className={styles.summaryItems}>
              {items.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <span className={styles.summaryItemTitle}>{item.title}</span>
                  <span className={styles.summaryItemMeta}>
                    {item.qty} × {item.price.toLocaleString("ru-RU")} ₽
                  </span>
                  <span className={styles.summaryItemSum}>
                    {(item.price * item.qty).toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.summaryTotal}>
              <span>Итого</span>
              <span>{totalPrice.toLocaleString("ru-RU")} ₽</span>
            </div>
            <Link href="/cart" className={styles.editCartLink}>
              ← Изменить корзину
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
