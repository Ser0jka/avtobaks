import styles from "@/app/page.module.css";
import { steps } from "./content";

export default function StepsSection() {
  return (
    <section className={styles.section}>
      <h2>Как работает подбор</h2>
      <div className={styles.stepGrid}>
        {steps.map(([title, text], index) => (
          <article className={styles.stepCard} key={title}>
            <span>{index + 1}</span>
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
