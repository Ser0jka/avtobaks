import type { CSSProperties } from "react";
import { TelegramIcon, WhatsAppIcon } from "@/components/Icon";
import partsPhoto from "../../../public/сcategories/1.webp";
import styles from "@/app/page.module.css";

const partsBackgroundStyle = {
  "--parts-photo": `url(${partsPhoto.src})`,
} as CSSProperties;

export default function RequestCta() {
  return (
    <section className={styles.cta} id="request" style={partsBackgroundStyle}>
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
        <a className={`${styles.outlineButton} ${styles.socialButton}`} href="https://wa.me/79069866661">
          <span className={`${styles.socialIcon} ${styles.socialWa}`}>
            <WhatsAppIcon />
          </span>
          WhatsApp
        </a>
        <a className={`${styles.outlineButton} ${styles.socialButton}`} href="https://t.me/avtobaks">
          <span className={`${styles.socialIcon} ${styles.socialTg}`}>
            <TelegramIcon />
          </span>
          Telegram
        </a>
      </div>
    </section>
  );
}
