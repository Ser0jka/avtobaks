import styles from "@/app/page.module.css";
import { advantages } from "./content";

export default function AdvantagesSection() {
  return (
    <section className={styles.section} id="advantages">
      <h2>Почему выбирают Автобакс</h2>
      <div className={styles.advantageGrid}>
        {advantages.map((item) => (
          <article className={styles.advantageCard} key={item}>
            <span />
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
