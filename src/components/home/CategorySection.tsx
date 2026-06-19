import Link from "next/link";
import { CATALOG_CATEGORIES } from "@/data/catalog";
import styles from "./CategorySection.module.css";

// Показываем первые 8 категорий на главной
const VISIBLE_SLUGS = [
  "filtry",
  "dvigatel",
  "masla",
  "podveska",
  "tormoza",
  "akkumulyatory",
  "himiya",
  "instrumenty",
];

export default function CategorySection() {
  const cats = VISIBLE_SLUGS
    .map((slug) => CATALOG_CATEGORIES.find((c) => c.slug === slug))
    .filter(Boolean) as typeof CATALOG_CATEGORIES;

  return (
    <section className={styles.wrap} id="catalog">
      <div className={styles.inner}>
        <div className={styles.head}>
          <Link href="/catalog" className={styles.headTitle}>Каталоги ›</Link>
        </div>
        <div className={styles.grid}>
          {cats.map((cat) => (
            <Link key={cat.slug} href={`/catalog?category=${cat.slug}`} className={styles.card}>
              <span className={styles.iconWrap}>{cat.icon}</span>
              <span className={styles.label}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
