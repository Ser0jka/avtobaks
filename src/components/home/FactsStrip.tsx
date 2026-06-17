import styles from "@/app/page.module.css";
import { facts } from "./content";

export default function FactsStrip() {
  return (
    <section className={`${styles.section} ${styles.facts}`} aria-label="Факты о компании">
      {facts.map(({ icon, title, text }) => (
        <article className={styles.factCard} key={title}>
          <span className={styles.factIcon} aria-hidden="true">
            {icon}
          </span>
          <strong>{title}</strong>
          <p>{text}</p>
        </article>
      ))}
    </section>
  );
}
