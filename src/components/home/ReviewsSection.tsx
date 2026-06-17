import styles from "@/app/page.module.css";
import { reviews } from "./content";

export default function ReviewsSection() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>Отзывы клиентов</h2>
        <a href="#request">Оставить заявку</a>
      </div>
      <div className={styles.reviewGrid}>
        {reviews.map(([name, text], index) => (
          <article className={styles.reviewCard} key={name}>
            <div className={styles.avatar}>{name.slice(0, 1)}</div>
            <strong>{name}</strong>
            <p>{text}</p>
            <span>{12 + index * 5} апреля 2026</span>
          </article>
        ))}
      </div>
    </section>
  );
}
