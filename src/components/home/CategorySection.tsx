import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "@/app/page.module.css";
import { categories } from "./content";

function categoryStyle(image: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(180deg, rgba(5, 9, 13, 0.2), rgba(5, 9, 13, 0.32)), url(${image})`,
  };
}

export default function CategorySection() {
  return (
    <section className={styles.section} id="catalog">
      <div className={styles.sectionHead}>
        <h2>Популярные категории</h2>
        <a href="#request">Нужна консультация</a>
      </div>
      <div className={styles.categoryGrid}>
        {categories.map((category) => (
          <Link
            href={`/catalog?category=${category.slug}`}
            className={styles.categoryCard}
            key={category.slug}
            style={categoryStyle(category.image)}
          >
            <span>{category.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
