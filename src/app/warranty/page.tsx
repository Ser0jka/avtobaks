import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import styles from "./page.module.css";

export const metadata = {
  title: "Гарантия и возврат — Автобакс",
  description: "Условия гарантии, возврата и обмена автозапчастей в магазине Автобакс. Кемерово.",
};

export default function WarrantyPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb}>
            <Link href="/">Главная</Link>
            <span>/</span>
            <span>Гарантия и возврат</span>
          </nav>
          <h1 className={styles.heroTitle}>Гарантия и возврат</h1>
          <p className={styles.heroSub}>
            Мы работаем честно и несём ответственность за качество каждой запчасти
          </p>
        </div>
      </div>

      <div className={styles.content}>

        {/* Карточки-итоги */}
        <div className={styles.cards}>
          <div className={styles.card}>
            <span className={styles.cardIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <p className={styles.cardTitle}>Гарантия на запчасти</p>
            <p className={styles.cardText}>От 14 дней до 1 года в зависимости от категории товара</p>
          </div>
          <div className={styles.card}>
            <span className={styles.cardIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/>
              </svg>
            </span>
            <p className={styles.cardTitle}>Возврат в течение 14 дней</p>
            <p className={styles.cardText}>Вернём деньги или обменяем товар надлежащего качества</p>
          </div>
          <div className={styles.card}>
            <span className={styles.cardIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </span>
            <p className={styles.cardTitle}>Оригинальные запчасти</p>
            <p className={styles.cardText}>Работаем только с проверенными поставщиками и брендами</p>
          </div>
        </div>

        {/* Основной контент */}
        <div className={styles.body}>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Гарантия на товар</h2>
            <p>
              На все запчасти и автотовары, приобретённые в магазине <strong>Автобакс</strong>, распространяется гарантия производителя. Срок гарантии зависит от категории товара:
            </p>
            <ul className={styles.list}>
              <li><strong>Расходные материалы</strong> (масла, фильтры, тормозные колодки, свечи) — <strong>14 дней</strong> с момента покупки при условии отсутствия следов монтажа и нарушения упаковки.</li>
              <li><strong>Запчасти ходовой части и подвески</strong> (амортизаторы, шаровые, рычаги, ступичные подшипники) — <strong>3–6 месяцев</strong> с момента установки.</li>
              <li><strong>Аккумуляторы</strong> — <strong>6–12 месяцев</strong> в зависимости от бренда.</li>
              <li><strong>Автоэлектрика, оптика, генераторы, стартеры</strong> — <strong>3–6 месяцев</strong>.</li>
              <li><strong>Кузовные детали и элементы экстерьера</strong> — <strong>14 дней</strong> при условии отсутствия монтажа.</li>
            </ul>
            <div className={styles.note}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p>Гарантия действует при условии соблюдения правил установки и эксплуатации. Гарантийный случай рассматривается при наличии чека и оригинальной упаковки.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Условия возврата товара надлежащего качества</h2>
            <p>
              Согласно Закону РФ «О защите прав потребителей» (ст. 25), вы вправе вернуть или обменять товар надлежащего качества в течение <strong>14 дней</strong> с момента покупки при соблюдении следующих условий:
            </p>
            <ul className={styles.list}>
              <li>Товар не был в употреблении.</li>
              <li>Сохранены товарный вид, заводская упаковка, ярлыки и пломбы.</li>
              <li>Имеется чек или иной документ, подтверждающий покупку в нашем магазине.</li>
              <li>Товар не входит в Перечень товаров, не подлежащих возврату (технически сложные товары, товары для автомобилей согласно Постановлению Правительства РФ № 2463).</li>
            </ul>
            <p>
              При оформлении возврата мы вернём денежные средства в течение <strong>10 рабочих дней</strong> наличными или на карту — тем же способом, которым производилась оплата.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Возврат товара ненадлежащего качества</h2>
            <p>
              Если в товаре обнаружен производственный дефект или он вышел из строя в течение гарантийного срока:
            </p>
            <ol className={styles.list}>
              <li>Свяжитесь с нами по телефону или приходите в магазин с товаром и чеком.</li>
              <li>Наш специалист проведёт первичную диагностику и составит акт осмотра.</li>
              <li>При подтверждении гарантийного случая — замена на аналогичный товар или возврат полной стоимости.</li>
              <li>Если требуется экспертиза качества, она проводится за наш счёт в течение 20 дней.</li>
            </ol>
            <div className={styles.note}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p>Гарантия не распространяется на дефекты, возникшие вследствие механических повреждений, неправильного монтажа, нарушения условий эксплуатации или воздействия внешних факторов (агрессивная среда, ДТП).</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Возврат запчастей под заказ</h2>
            <p>
              Товары, заказанные специально для конкретного автомобиля по VIN или заявке клиента, возврату и обмену <strong>не подлежат</strong>, за исключением случаев обнаружения производственного дефекта.
            </p>
            <p>
              Перед оформлением заказа наш менеджер уточнит все параметры детали, чтобы исключить ошибку в подборе.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Как оформить возврат?</h2>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <div>
                  <p className={styles.stepTitle}>Свяжитесь с нами</p>
                  <p className={styles.stepText}>Позвоните или напишите в WhatsApp/Telegram. Объясните ситуацию — мы подскажем дальнейшие шаги.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <div>
                  <p className={styles.stepTitle}>Привезите товар в магазин</p>
                  <p className={styles.stepText}>Возьмите с собой чек, оригинальную упаковку и товар. Адреса: пр. Ленина, 70 или пр. Ленина, 103.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <div>
                  <p className={styles.stepTitle}>Оформление</p>
                  <p className={styles.stepText}>Менеджер составит акт возврата. Деньги вернём в день обращения или в течение 10 рабочих дней на карту.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className={styles.cta}>
            <p className={styles.ctaText}>Остались вопросы? Наши менеджеры готовы помочь!</p>
            <div className={styles.ctaBtns}>
              <a href="tel:+79069866661" className={styles.ctaBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 12a19.79 19.79 0 01-3-8.54 2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9a16 16 0 006 6l.88-.88a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                Позвонить
              </a>
              <a href="https://wa.me/79069866661" target="_blank" rel="noopener noreferrer" className={`${styles.ctaBtn} ${styles.ctaBtnWa}`}>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
