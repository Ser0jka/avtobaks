import Image from "next/image";
import Link from "next/link";
import heroPhoto from "../../../public/hero.png";
import styles from "@/app/page.module.css";

export default function HomeHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroImage} aria-hidden="true">
        <Image src={heroPhoto} alt="" fill priority sizes="100vw" />
      </div>

      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Автозапчасти в Кемерово</p>
          <h1>Большой каталог автозапчастей и деталей для автомобилей</h1>
          <p>
            Более 130 000 товаров, быстрый подбор, наличие и заказ деталей
            для иномарок в Кемерово.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.redButton} href="/catalog">
              Перейти в каталог
            </Link>
            <a className={styles.outlineButton} href="#search">
              Подобрать запчасть
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
