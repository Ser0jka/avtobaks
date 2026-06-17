import Link from "next/link";
import CatalogDropdown from "@/components/CatalogDropdown";
import { SearchIcon } from "@/components/Icon";
import MobileMenu from "@/components/MobileMenu";
import styles from "@/app/page.module.css";
import { navItems, phone } from "./content";

export default function HomeHeader() {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.header}>
        <Link className={styles.logo} href="/">
          <span>A</span>
          Автобакс
        </Link>
        <nav className={styles.nav} aria-label="Главная навигация">
          <CatalogDropdown />
          {navItems.map((item) =>
            item.href.startsWith("/") ? (
              <Link key={item.label} href={item.href}>
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ),
          )}
        </nav>
        <form className={styles.search} action="/catalog">
          <SearchIcon className={styles.searchIcon} />
          <input name="q" placeholder="Артикул / VIN / название" />
        </form>
        <a className={styles.phone} href="tel:+79069866661">
          {phone}
        </a>
        <a className={`${styles.redButton} ${styles.headerCta}`} href="#request">
          Оставить заявку
        </a>
        <MobileMenu />
      </div>
    </header>
  );
}
