"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CatalogDropdown from "@/components/CatalogDropdown";
import MobileMenu from "@/components/MobileMenu";
import { useAuth } from "@/context/AuthContext";
import { useGarage } from "@/context/GarageContext";
import styles from "./SiteHeader.module.css";

const navItems = [
  { label: "Подбор по VIN", href: "/vin" },
  { label: "Поставщики", href: "/#suppliers" },
  { label: "О компании", href: "/#advantages" },
  { label: "Контакты", href: "/contacts" },
];

type SiteHeaderProps = {
  active?: "home" | "catalog" | "contacts" | "garage";
  showSearch?: boolean;
};

export default function SiteHeader({ active, showSearch = false }: SiteHeaderProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const { activeCar, cars } = useGarage();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/catalog?q=${encodeURIComponent(query.trim())}` : "/catalog");
  }

  return (
    <header className={styles.siteHeader}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topBarLeft}>
            <span className={styles.topBarItem}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              пр. Ленина, 70 и пр. Ленина, 103
            </span>
            <span className={styles.topBarDot}>·</span>
            <span className={styles.topBarItem}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z"/></svg>
              Пн–Пт 9:00–20:00, Сб 10:00–18:00
            </span>
          </div>
          <div className={styles.topBarRight}>
            <Link href="/warranty" className={styles.topBarLink}>Гарантия и возврат</Link>
            <span className={styles.topBarDot}>·</span>
            <a className={styles.topBarPhone} href="tel:+79230319754">+7 (923) 031-97-54</a>
            <span className={styles.topBarDot}>·</span>
            <a className={styles.topBarPhone} href="tel:+79069866671">+7 (906) 986-66-71</a>
            <a className={styles.topBarSocial} href="https://wa.me/79069866661" target="_blank" rel="noopener noreferrer" title="WhatsApp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </a>
            <a className={styles.topBarSocial} href="https://t.me/avtobaks" target="_blank" rel="noopener noreferrer" title="Telegram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main row */}
      <div className={styles.mainRow}>
        <div className={styles.mainInner}>
          <Link className={styles.logo} href="/">
            <span className={styles.mark}>A</span>
            Автобакс
          </Link>

          <CatalogDropdown />

          <form className={styles.search} data-featured={showSearch ? "true" : undefined} onSubmit={handleSearch}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Артикул, VIN или название запчасти..."
              autoComplete="off"
            />
            <button type="submit" className={styles.searchBtn} aria-label="Найти">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </form>

          <div className={styles.actions}>
            {/* Гараж */}
            <Link href="/garage" className={`${styles.action} ${active === "garage" ? styles.actionActive : ""}`}>
              <span className={styles.garageIconWrap}>
                <svg width="22" height="22" viewBox="0 0 64 40" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="16" width="56" height="18" rx="4"/>
                  <path d="M12 16l7-12h26l7 12"/>
                  <circle cx="16" cy="34" r="5"/><circle cx="48" cy="34" r="5"/>
                  <path d="M21 34h22"/>
                </svg>
                {cars.length > 0 && (
                  <span className={`${styles.garageBadge} ${activeCar ? styles.garageBadgeActive : ""}`}>
                    {cars.length}
                  </span>
                )}
              </span>
              <span>Гараж</span>
            </Link>
            <Link href={user ? "/account" : "/account/login"} className={styles.action}>
              {user ? (
                <span className={styles.userAvatar}>{user.name.charAt(0).toUpperCase()}</span>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )}
              <span>{user ? user.name.split(" ")[0] : "Войти"}</span>
            </Link>
            <Link href="/cart" className={styles.action}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              <span>Корзина</span>
            </Link>
            <a className={styles.action} href="tel:+79069866661">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 12a19.79 19.79 0 01-3-8.54 2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9a16 16 0 006 6l.88-.88a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              <span>Позвонить</span>
            </a>
          </div>

          <MobileMenu />
        </div>
      </div>

      {/* Sub nav */}
      <div className={styles.subNav}>
        <div className={styles.subNavInner}>
          <nav className={styles.nav} aria-label="Навигация">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={active === "contacts" && item.href === "/contacts" ? styles.navActive : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <a className={styles.subPhone} href="tel:+79069866661">
            +7 906 986 66 61
          </a>
        </div>
      </div>
    </header>
  );
}
