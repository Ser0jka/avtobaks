"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CATALOG_CATEGORIES } from "@/data/catalog";
import styles from "./CatalogDropdown.module.css";

export default function CatalogDropdown() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/>
          </svg>
        )}
        Каталоги
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <div className={styles.panel} role="dialog" aria-label="Каталог запчастей">
            {/* VIN block */}
            <div className={styles.panelVin}>
              <p className={styles.panelVinTitle}>Оригинальные каталоги</p>
              <p className={styles.panelVinDesc}>
                Поиск по VIN / номеру кузова или по марке и модели автомобиля
              </p>
              <div className={styles.panelVinBtns}>
                <Link href="/catalog#vin" className={styles.btnGreen} onClick={() => setOpen(false)}>
                  Найти по VIN
                </Link>
                <Link href="/catalog#brands" className={styles.btnOutline} onClick={() => setOpen(false)}>
                  Найти по марке
                </Link>
              </div>
            </div>

            {/* Category list */}
            <ul className={styles.catList}>
              {CATALOG_CATEGORIES.map((cat) => (
                <li key={cat.slug} className={styles.catItem}>
                  <Link
                    href={`/catalog?category=${cat.slug}`}
                    className={styles.catLink}
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.catIcon}>{cat.icon}</span>
                    {cat.label}
                    <span className={styles.catArrow}>›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
