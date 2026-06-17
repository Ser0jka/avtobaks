import Link from "next/link";
import styles from "@/app/page.module.css";
import { navItems, phone } from "./content";

export default function HomeFooter() {
  return (
    <footer className={styles.footer} id="контакты">
      <div>
        <Link className={styles.logo} href="/">
          <span>A</span>
          Автобакс
        </Link>
        <p>Автозапчасти для иномарок в наличии и под заказ в Кемерово.</p>
      </div>
      <div>
        <strong>Разделы</strong>
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
      </div>
      <div>
        <strong>Контакты</strong>
        <p>Кемерово, проспект Ленина, 70</p>
        <a href="tel:+79069866661">{phone}</a>
        <p>WhatsApp, Telegram, ВКонтакте</p>
      </div>
    </footer>
  );
}
