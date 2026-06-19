"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import styles from "./HomeHero.module.css";

const BANNERS = [
  {
    id: 1,
    label: "Акция",
    headline: "5 ЛИТРОВ ПО ЦЕНЕ 4-Х!",
    sub: "МОТОРНОЕ МАСЛО · Быстрая доставка по Кемерово",
    cta: "Смотреть предложение",
    href: "/catalog?category=masla-i-tehzhidkosti",
    bg: "linear-gradient(100deg, #0a0a0a 0%, #1a1010 50%, #3a0a0a 100%)",
    accentColor: "#e81722",
  },
  {
    id: 2,
    label: "Популярное",
    headline: "ТОРМОЗНЫЕ КОЛОДКИ И ДИСКИ",
    sub: "OEM и аналоги · Подбор по марке и модели",
    cta: "Перейти в раздел",
    href: "/catalog?category=tormoznaya-sistema",
    bg: "linear-gradient(100deg, #050f0a 0%, #0d1f14 50%, #0a2a12 100%)",
    accentColor: "#16a34a",
  },
  {
    id: 3,
    label: "Подбор по VIN",
    headline: "ЗАПЧАСТЬ ЗА 2 МИНУТЫ",
    sub: "Введите VIN — подберём точно под ваш автомобиль",
    cta: "Подобрать по VIN",
    href: "/#search",
    bg: "linear-gradient(100deg, #05050f 0%, #0d0d20 50%, #0a0a2a 100%)",
    accentColor: "#6366f1",
  },
];

export default function HomeHero() {
  const [active, setActive] = useState(0);

  const next = useCallback(() => setActive(v => (v + 1) % BANNERS.length), []);

  useEffect(() => {
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next]);

  const b = BANNERS[active];

  return (
    <div className={styles.hero} style={{ background: b.bg }}>
      {/* Decorative diagonal stripes */}
      <div className={styles.stripes} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.content}>
          <span className={styles.label} style={{ background: b.accentColor }}>{b.label}</span>
          <h2 className={styles.headline}>{b.headline}</h2>
          <p className={styles.sub}>{b.sub}</p>
          <Link href={b.href} className={styles.cta} style={{ background: b.accentColor }}>
            {b.cta}
          </Link>
        </div>

        <div className={styles.controls}>
          {BANNERS.map((bn, i) => (
            <button
              key={bn.id}
              className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Слайд ${i + 1}`}
              style={i === active ? { background: b.accentColor } : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
