import type { CSSProperties } from "react";
import partsPhoto from "../../../public/сcategories/1.webp";
import styles from "@/app/page.module.css";
import { supplierCards } from "./content";

const partsBackgroundStyle = {
  "--parts-photo": `url(${partsPhoto.src})`,
} as CSSProperties;

export default function SuppliersSection() {
  return (
    <section className={`${styles.section} ${styles.splitBand}`} id="suppliers">
      <article className={styles.darkPanel} style={partsBackgroundStyle}>
        <p className={styles.kicker}>Поставщики и каталог</p>
        <h2>Ассортимент постоянно обновляется</h2>
        <p>
          Автобакс работает с поставщиками и помогает быстро найти нужную
          деталь, сравнить варианты и оформить заявку на подбор.
        </p>
      </article>
      <div className={styles.supplierGrid}>
        {supplierCards.map(([title, text]) => (
          <article className={styles.smallCard} key={title}>
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
