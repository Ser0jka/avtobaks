"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CATALOG_CATEGORIES } from "@/data/catalog";
import styles from "./CatalogDropdown.module.css";

export default function CatalogDropdown() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
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
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className={`${styles.triggerIcon} ${open ? styles.open : ""}`}>
          ☰
        </span>
        Каталог запчастей
      </button>

      {open && (
        <>
          {/* invisible overlay to catch outside clicks on mobile */}
          <div className={styles.overlay} onClick={() => setOpen(false)} />

          <div className={styles.panel} role="dialog" aria-label="Каталог запчастей">
            {/* VIN block */}
            <div className={styles.panelVin}>
              <p className={styles.panelVinTitle}>Оригинальные каталоги</p>
              <p className={styles.panelVinDesc}>
                Поиск по VIN / номеру кузова или по марке и модели автомобиля
              </p>
              <div className={styles.panelVinBtns}>
                <Link
                  href="/catalog#vin"
                  className={styles.btnGreen}
                  onClick={() => setOpen(false)}
                >
                  Найти по VIN
                </Link>
                <Link
                  href="/catalog#brands"
                  className={styles.btnOutline}
                  onClick={() => setOpen(false)}
                >
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
