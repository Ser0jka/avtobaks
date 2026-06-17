"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import styles from "./MobileMenu.module.css";

const PHONE = "+7 906 986 66 61";

const NAV_ITEMS = [
  { label: "Каталог запчастей", href: "/catalog", accent: true },
  { label: "Подбор по VIN", href: "/#search", accent: false },
  { label: "Поставщики", href: "/#suppliers", accent: false },
  { label: "О компании", href: "/#advantages", accent: false },
  { label: "Контакты", href: "/contacts", accent: false },
];

function MenuPortal({ open, onClose }: { open: boolean; onClose: () => void }) {
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = (
      e.currentTarget.elements.namedItem("q") as HTMLInputElement
    ).value;
    onClose();
    window.location.href = q
      ? `/catalog?q=${encodeURIComponent(q)}`
      : "/catalog";
  }

  return (
    <>
      <div
        className={
          open
            ? `${styles.overlay} ${styles.overlayVisible}`
            : styles.overlay
        }
        onClick={onClose}
        aria-hidden="true"
      />

      <nav
        className={
          open ? `${styles.panel} ${styles.panelOpen}` : styles.panel
        }
        aria-label="Мобильное меню"
        aria-hidden={!open}
      >
        <div className={styles.panelHead}>
          <span className={styles.panelLogo}>Автобакс</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть меню"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.navLinks}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={item.accent ? styles.accentLink : undefined}
              onClick={onClose}
            >
              {item.label}
              {item.accent && (
                <svg className={styles.navArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </Link>
          ))}
        </div>

        <form className={styles.mobileSearch} onSubmit={handleSearch}>
          <input
            name="q"
            placeholder="Артикул, VIN или название"
            autoComplete="off"
          />
          <button type="submit" aria-label="Найти">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        <a className={styles.mobilePhone} href="tel:+79069866661" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
          </svg>
          {PHONE}
        </a>

        <Link className={styles.ctaBtn} href="/#request" onClick={onClose}>
          Оставить заявку
        </Link>
      </nav>
    </>
  );
}

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const canUseDom = typeof document !== "undefined";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 1024) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <button
        className={
          open ? `${styles.burger} ${styles.burgerOpen}` : styles.burger
        }
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {canUseDom &&
        createPortal(
          <MenuPortal open={open} onClose={() => setOpen(false)} />,
          document.body
        )}
    </>
  );
}
