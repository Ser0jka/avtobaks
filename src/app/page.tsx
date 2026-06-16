import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import HitProducts from "@/components/HitProducts";
import CatalogDropdown from "@/components/CatalogDropdown";
import VinSearchForm from "@/components/VinSearchForm";

const phone = "+7 906 986 66 61";

const navItems = [
  { label: "Подбор по VIN", href: "#подбор-по-vin" },
  { label: "Поставщики", href: "#поставщики" },
  { label: "О компании", href: "#о-компании" },
  { label: "Контакты", href: "/contacts" },
];

const facts = [
  ["4.9 рейтинг", "118 оценок"],
  ["2 филиала", "в Кемерово"],
  ["130 000+", "товаров"],
  ["Автозапчасти", "в наличии и под заказ"],
  ["VIN и артикул", "подберем вручную"],
];

const categories = [
  ["Двигатели", "70% 34%", "dvigatel"],
  ["Подвеска и ходовая", "28% 36%", "podveska"],
  ["Кузовные детали", "52% 37%", "kuzov"],
  ["Электрика", "76% 37%", "electrika"],
  ["Трансмиссия", "92% 37%", "transmissiya"],
  ["Расходники", "9% 42%", "filtry"],
  ["Автооптика", "31% 42%", "optika"],
  ["Автоинструмент", "48% 42%", "instrumenty"],
  ["Салон", "67% 42%", "salon"],
  ["Коврики и аксессуары", "88% 42%", "kovriki"],
];

const steps = [
  ["Заявка", "Оставьте VIN, артикул или опишите нужную деталь."],
  ["Уточнение", "Проверим марку, модель и год выпуска автомобиля."],
  ["Подбор", "Найдем варианты в наличии или под заказ у поставщиков."],
  ["Согласование", "Сообщим цену, срок и удобный способ получения."],
  ["Выдача", "Заберите заказ в филиале или оформите доставку."],
];

const products = [
  ["Тормозные колодки", "AB-102354", "2 450 ₽", "12% 51%"],
  ["Масляный фильтр", "AB-20456", "680 ₽", "23% 51%"],
  ["Моторное масло 5W-40", "AB-30567", "3 950 ₽", "34% 51%"],
  ["Фара передняя левая", "AB-40678", "18 900 ₽", "47% 51%"],
  ["Стойка амортизатора", "AB-50789", "4 250 ₽", "60% 51%"],
  ["Коврики EVA комплект", "AB-60890", "2 990 ₽", "72% 51%"],
  ["Щетки стеклоочистителя", "AB-70901", "890 ₽", "83% 51%"],
  ["Аккумулятор 60Ah", "AB-81012", "6 450 ₽", "94% 51%"],
];

const advantages = [
  "Большой ассортимент автозапчастей",
  "Подбор по VIN, артикулу и модели авто",
  "Наличие и заказ через поставщиков",
  "2 филиала в Кемерово",
  "Быстрая связь в WhatsApp и Telegram",
  "Понятные цены и карточки товаров",
];

const supplierCards = [
  ["Большая база", "130 000+ товарных позиций и объявлений."],
  ["Обновления", "Ассортимент и цены регулярно сверяются."],
  ["Точный подбор", "Ищем деталь под конкретный автомобиль."],
  ["Наличие и заказ", "Подберем вариант со склада или у поставщика."],
];

const reviews = [
  [
    "Алексей, автовладелец",
    "Быстро помогли подобрать деталь по VIN, все подошло без лишних вопросов.",
  ],
  [
    "Игорь, владелец СТО",
    "Нужной позиции не было в наличии, но нашли под заказ и заранее сказали срок.",
  ],
  [
    "Дмитрий, автослесарь",
    "Удобно писать в WhatsApp: сразу уточнили цену и варианты поставки.",
  ],
  [
    "Максим, частный клиент",
    "Заказывал расходники. Подобрали быстро, забрал в филиале на следующий день.",
  ],
];

function visualStyle(position: string): CSSProperties {
  return {
    backgroundImage: "url('/avtobaks-reference.png')",
    backgroundPosition: position,
  };
}

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <header className={styles.header}>
          <a className={styles.logo} href="#">
            <span>A</span>
            Автобакс
          </a>
          <nav className={styles.nav} aria-label="Главная навигация">
            <CatalogDropdown />
            {navItems.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <label className={styles.search}>
            <span>Поиск</span>
            <input placeholder="Артикул / VIN / название" />
          </label>
          <a className={styles.phone} href="tel:+79069866661">
            {phone}
          </a>
          <a className={styles.redButton} href="#request">
            Оставить заявку
          </a>
        </header>

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Автозапчасти в Кемерово</p>
            <h1>Большой каталог автозапчастей и деталей для автомобилей</h1>
            <p>
              Более 130 000 товаров, быстрый подбор, наличие и заказ деталей
              для иномарок в Кемерово.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.redButton} href="/catalog">
                Перейти в каталог
              </Link>
              <a className={styles.outlineButton} href="#search">
                Подобрать запчасть
              </a>
            </div>
          </div>
          <div className={styles.heroImage} aria-hidden="true">
            <Image
              src="/hero.png"
              alt=""
              fill
              priority
              sizes="(max-width: 760px) 100vw, 70vw"
            />
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.facts}`} aria-label="Факты о компании">
        {facts.map(([title, text]) => (
          <article className={styles.factCard} key={title}>
            <span className={styles.factIcon} />
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className={`${styles.section} ${styles.quickSearch}`} id="search">
        <div>
          <p className={styles.kicker}>Быстрый поиск запчастей</p>
          <h2>Найдите деталь по VIN, артикулу или категории</h2>
        </div>
        <VinSearchForm />
      </section>

      <section className={styles.section} id="catalog">
        <div className={styles.sectionHead}>
          <h2>Популярные категории</h2>
          <a href="#request">Нужна консультация</a>
        </div>
        <div className={styles.categoryGrid}>
          {categories.map(([title, position, slug]) => (
            <Link
              href={`/catalog?category=${slug}`}
              className={styles.categoryCard}
              key={title}
              style={visualStyle(position)}
            >
              <span>{title}</span>
            </Link>
          ))}
        </div>
      </section>

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

      <section className={styles.section}>
        <HitProducts />
      </section>

      <section className={`${styles.section} ${styles.splitBand}`}>
        <article className={styles.darkPanel}>
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

      <section className={`${styles.section} ${styles.dromBlock}`} id="дром">
        <div>
          <p className={styles.kicker}>Дром</p>
          <h2>Автобакс также представлен на Дроме</h2>
          <p>
            Часть ассортимента доступна на популярных автомобильных площадках.
            Новый сайт станет удобным каналом для поиска запчастей, заявок и
            прямого обращения в магазин.
          </p>
          <a className={styles.redButton} href="#request">
            Посмотреть каталог
          </a>
        </div>
        <div className={styles.dromLogo}>дром</div>
      </section>

      <section className={styles.section}>
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

      <section className={styles.cta} id="request">
        <div>
          <h2>Нужна запчасть для автомобиля?</h2>
          <p>
            Оставьте заявку, поможем подобрать нужную деталь по VIN, артикулу
            или модели авто.
          </p>
        </div>
        <div className={styles.ctaActions}>
          <a className={styles.redButton} href="tel:+79069866661">
            Оставить заявку
          </a>
          <a className={styles.outlineButton} href="https://wa.me/79069866661">
            WhatsApp
          </a>
          <a className={styles.outlineButton} href="https://t.me/">
            Telegram
          </a>
        </div>
      </section>

      <footer className={styles.footer} id="контакты">
        <div>
          <a className={styles.logo} href="#">
            <span>A</span>
            Автобакс
          </a>
          <p>Автозапчасти для иномарок в наличии и под заказ в Кемерово.</p>
        </div>
        <div>
          <strong>Разделы</strong>
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <div>
          <strong>Контакты</strong>
          <p>Кемерово, проспект Ленина, 70</p>
          <a href="tel:+79069866661">{phone}</a>
          <p>WhatsApp, Telegram, ВКонтакте</p>
        </div>
      </footer>
    </main>
  );
}
