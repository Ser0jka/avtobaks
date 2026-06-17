import Link from "next/link";
import CatalogDropdown from "@/components/CatalogDropdown";
import { SearchIcon } from "@/components/Icon";
import MobileMenu from "@/components/MobileMenu";
import styles from "./SiteHeader.module.css";

const phone = "+7 906 986 66 61";

const navItems = [
  { label: "Подбор по VIN", href: "/#search" },
  { label: "Поставщики", href: "/#suppliers" },
  { label: "О компании", href: "/#advantages" },
  { label: "Контакты", href: "/contacts" },
];

type SiteHeaderProps = {
  active?: "home" | "catalog" | "contacts";
  showSearch?: boolean;
};

export default function SiteHeader({ active, showSearch = false }: SiteHeaderProps) {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.inner}>
        <Link className={styles.logo} href="/">
          <span className={styles.mark}>A</span>
          Автобакс
        </Link>

        <nav className={styles.nav} aria-label="Главная навигация">
          <CatalogDropdown />
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={active === "contacts" && item.href === "/contacts" ? styles.active : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {showSearch && (
          <form className={styles.search} action="/catalog">
            <SearchIcon className={styles.searchIcon} />
            <input name="q" placeholder="Артикул / VIN / название" />
          </form>
        )}

        <a className={styles.phone} href="tel:+79069866661">
          {phone}
        </a>
        <Link className={styles.cta} href="/#request">
          Оставить заявку
        </Link>
        <MobileMenu />
      </div>
    </header>
  );
}
