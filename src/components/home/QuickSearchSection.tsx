import VinSearchForm from "@/components/VinSearchForm";
import styles from "@/app/page.module.css";

export default function QuickSearchSection() {
  return (
    <section className={`${styles.section} ${styles.quickSearch}`} id="search">
      <div>
        <p className={styles.kicker}>Быстрый поиск запчастей</p>
        <h2>Найдите деталь по VIN, артикулу или категории</h2>
      </div>
      <VinSearchForm />
    </section>
  );
}
