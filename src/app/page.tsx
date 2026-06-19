import HitProducts from "@/components/HitProducts";
import {
  AdvantagesSection,
  CategorySection,
  DromSection,
  HomeFooter,
  HomeHeader,
  HomeHero,
  QuickSearchSection,
  RequestCta,
  ReviewsSection,
  SuppliersSection,
  StepsSection,
} from "@/components/home";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <HomeHeader />
      <HomeHero />
      <CategorySection />
      <QuickSearchSection />
      <StepsSection />

      <section className={styles.section}>
        <HitProducts />
      </section>

      <SuppliersSection />
      <DromSection />
      <AdvantagesSection />
      <ReviewsSection />
      <RequestCta />
      <HomeFooter />
    </main>
  );
}
