import Link from "next/link";
import styles from "@/app/page.module.css";

export default function DromSection() {
  return (
    <section className={`${styles.section} ${styles.dromBlock}`} id="дром">
      <div className={styles.dromLogo}>дром</div>
      <div className={styles.dromContent}>
        <p className={styles.kicker}>Дром</p>
        <h2>Автобакс на Дроме</h2>
        <p>
          Часть ассортимента размещаем на Дроме, а на сайте удобнее быстро
          найти деталь, оставить заявку и связаться с магазином напрямую.
        </p>
        <Link className={styles.redButton} href="/catalog">
          Посмотреть каталог
        </Link>
      </div>
    </section>
  );
}
