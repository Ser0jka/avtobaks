"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const branches = [
  {
    id: 1,
    label: "Филиал 1 — пр. Ленина, 70",
    address: "г. Кемерово, пр. Ленина, 70 (цокольный этаж)",
    phone: "+7 (923) 031-97-54",
    phoneRaw: "+79230319754",
    mapEmbed:
      "https://yandex.ru/map-widget/v1/?ll=86.114232%2C55.345065&z=16&pt=86.114232,55.345065,pm2rdm&l=map",
    mapLink:
      "https://yandex.ru/maps/-/CPxzyA~M",
    schedule: [
      { day: "Пн–Пт", time: "9:00–20:00" },
      { day: "Суббота", time: "10:00–18:00" },
      { day: "Воскресенье", time: "Выходной" },
    ],
    messengers: [
      { label: "WhatsApp", href: "https://wa.me/79230319754", cls: "btnWa", icon: "💬" },
      { label: "Telegram", href: "https://t.me/avtobaks", cls: "btnTg", icon: "✈️" },
      { label: "ВКонтакте", href: "https://vk.com/autobaks_shop", cls: "btnVk", icon: "🔵" },
    ],
    rating: "4.6",
    reviews: 24,
  },
  {
    id: 2,
    label: "Филиал 2 — пр. Ленина, 103",
    address: "г. Кемерово, пр. Ленина, 103",
    phone: "+7 (906) 986-66-71",
    phoneRaw: "+79069866671",
    mapEmbed:
      "https://yandex.ru/map-widget/v1/?ll=86.138684%2C55.344222&z=16&pt=86.138684,55.344222,pm2rdm&l=map",
    mapLink:
      "https://yandex.ru/maps/-/CPxzyGKG",
    schedule: [
      { day: "Пн–Пт", time: "9:00–20:00" },
      { day: "Суббота", time: "10:00–18:00" },
      { day: "Воскресенье", time: "Выходной" },
    ],
    messengers: [
      { label: "WhatsApp", href: "https://wa.me/79069866671", cls: "btnWa", icon: "💬" },
      { label: "Telegram", href: "https://t.me/+79069866671", cls: "btnTg", icon: "✈️" },
      { label: "ВКонтакте", href: "https://vk.com/autobaks_shop", cls: "btnVk", icon: "🔵" },
    ],
    rating: "4.3",
    reviews: 12,
  },
];

const quickContacts = [
  { label: "Основной телефон", sub: "+7 906 986 66 61", href: "tel:+79069866661", iconCls: "qcPhone", icon: "📞" },
  { label: "WhatsApp", sub: "Написать сейчас", href: "https://wa.me/79069866661", iconCls: "qcWa", icon: "💬" },
  { label: "Telegram", sub: "@avtobaks", href: "https://t.me/avtobaks", iconCls: "qcTg", icon: "✈️" },
  { label: "Viber", sub: "+7 906 986 66 61", href: "viber://chat?number=%2B79069866661", iconCls: "qcViber", icon: "📱" },
];

export default function ContactsPage() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSending(true);
    // Заглушка — имитация отправки
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setForm({ name: "", phone: "", message: "" });
    }, 900);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.logo} href="/">
            <span>A</span>
            Автобакс
          </Link>
          <nav>
            <ul className={styles.nav}>
              <li><Link href="/">Главная</Link></li>
              <li><Link href="/catalog">Каталог</Link></li>
              <li><Link href="/#search">Подбор по VIN</Link></li>
              <li><Link href="/contacts" className={styles.active}>Контакты</Link></li>
            </ul>
          </nav>
          <a className={styles.phone} href="tel:+79069866661">+7 906 986 66 61</a>
          <Link className={styles.redButton} href="/#request">Оставить заявку</Link>
        </div>
      </header>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb}>
            <Link href="/">Главная</Link>
            <span>/</span>
            <span>Контакты</span>
          </nav>
          <h1 className={styles.heroTitle}>Контакты</h1>
          <p className={styles.heroSub}>2 филиала в Кемерово · Работаем ежедневно пн–пт 9:00–20:00</p>
        </div>
      </div>

      <div className={styles.content}>
        {/* Branch cards */}
        <div className={styles.branches}>
          {branches.map((b) => (
            <div className={styles.branch} key={b.id}>
              {/* Map */}
              <div className={styles.mapWrap}>
                <iframe
                  src={b.mapEmbed}
                  title={`Карта филиала ${b.id}`}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <span className={styles.mapOverlay}>Филиал {b.id}</span>
              </div>

              {/* Info */}
              <div className={styles.branchBody}>
                <p className={styles.branchNum}>Филиал {b.id}</p>
                <p className={styles.branchName}>{b.address}</p>

                <div className={styles.infoRows}>
                  {/* Phone */}
                  <div className={styles.infoRow}>
                    <span className={styles.infoIcon}>📞</span>
                    <div className={styles.infoText}>
                      <span className={styles.infoLabel}>Телефон</span>
                      <a className={styles.infoLink} href={`tel:${b.phoneRaw}`}>{b.phone}</a>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className={styles.infoRow}>
                    <span className={styles.infoIcon}>🕐</span>
                    <div className={styles.infoText}>
                      <span className={styles.infoLabel}>График работы</span>
                      <div className={styles.schedule}>
                        {b.schedule.map((s) => (
                          <>
                            <span key={`d-${s.day}`} className={styles.schDay}>{s.day}</span>
                            <span key={`t-${s.day}`} className={styles.schTime}>{s.time}</span>
                          </>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className={styles.infoRow}>
                    <span className={styles.infoIcon}>⭐</span>
                    <div className={styles.infoText}>
                      <span className={styles.infoLabel}>Рейтинг на Яндекс Картах</span>
                      <span className={styles.infoValue}>{b.rating} / 5 · {b.reviews} оценок</span>
                    </div>
                  </div>
                </div>

                {/* Messengers */}
                <div className={styles.messengers}>
                  {b.messengers.map((m) => (
                    <a
                      key={m.label}
                      href={m.href}
                      className={`${styles.messengerBtn} ${styles[m.cls as keyof typeof styles]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {m.icon} {m.label}
                    </a>
                  ))}
                </div>

                {/* Directions link */}
                <a
                  href={b.mapLink}
                  className={styles.dirBtn}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🗺️ Построить маршрут
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Contact form + quick contacts */}
        <div className={styles.formSection}>
          <div className={styles.formLeft}>
            <h2 className={styles.formTitle}>Написать нам</h2>
            <p className={styles.formDesc}>
              Оставьте заявку и мы перезвоним в течение 15 минут.
              Поможем подобрать запчасть по VIN, артикулу или описанию.
            </p>

            {sent ? (
              <div className={styles.formSuccess}>
                ✅ Заявка отправлена! Мы свяжемся с вами в ближайшее время.
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <input
                    className={styles.input}
                    name="name"
                    placeholder="Ваше имя *"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <input
                    className={styles.input}
                    name="phone"
                    placeholder="Телефон *"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <textarea
                  className={styles.textarea}
                  name="message"
                  placeholder="Что ищете? VIN, артикул, марка авто..."
                  value={form.message}
                  onChange={handleChange}
                />
                <button
                  className={styles.formSubmit}
                  type="submit"
                  disabled={sending}
                >
                  {sending ? "Отправляем…" : "Отправить заявку"}
                </button>
              </form>
            )}
          </div>

          {/* Quick contacts */}
          <div className={styles.formRight}>
            <p className={styles.qcTitle}>Связаться напрямую</p>
            {quickContacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className={styles.qcItem}
                target={c.href.startsWith("tel") ? undefined : "_blank"}
                rel={c.href.startsWith("tel") ? undefined : "noopener noreferrer"}
              >
                <span className={`${styles.qcIcon} ${styles[c.iconCls as keyof typeof styles]}`}>
                  {c.icon}
                </span>
                <span className={styles.qcLabel}>
                  {c.label}
                  <span className={styles.qcSub}>{c.sub}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
