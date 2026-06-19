"use client";

import { useState } from "react";
import styles from "./VinSearchForm.module.css";

type SubmitState = "idle" | "loading" | "success" | "error";

export default function VinSearchForm() {
  const [vin, setVin] = useState("");
  const [partsText, setPartsText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMessage("");

    const response = await fetch("/api/vin-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin, partsText, customerName, contact, comment }),
    });
    const data = await response.json();

    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Не удалось отправить заявку");
      return;
    }

    setState("success");
    setMessage(
      data.offersCount > 0
        ? `Заявка ${data.id} создана. В админке уже есть найденные предложения.`
        : `Заявка ${data.id} создана. Менеджер проверит совместимость и подберет варианты.`
    );
    setVin("");
    setPartsText("");
    setCustomerName("");
    setContact("");
    setComment("");
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.vinRow}>
          <input
            className={styles.vinInput}
            placeholder="VIN или номер кузова"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            aria-label="VIN или номер кузова"
          />
        </div>

        <div className={styles.vinRow}>
          <input
            className={styles.vinInput}
            placeholder="Какие детали нужны: воздушный фильтр, колодки, стойки..."
            value={partsText}
            onChange={(e) => setPartsText(e.target.value)}
            aria-label="Какие детали нужны"
          />
        </div>

        <div className={styles.selects}>
          <input
            className={styles.vinInput}
            placeholder="Ваше имя"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            aria-label="Ваше имя"
          />
          <input
            className={styles.vinInput}
            placeholder="Телефон или Telegram"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            aria-label="Телефон или Telegram"
          />
          <textarea
            className={styles.textarea}
            placeholder="Комментарий: оригинал/аналог, бюджет, срочность"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            aria-label="Комментарий"
          />
          <button className={styles.submitBtn} type="submit" disabled={state === "loading"}>
            {state === "loading" ? <span className={styles.spinner} aria-hidden="true" /> : "Отправить"}
          </button>
        </div>
      </form>

      <aside className={styles.helpBox}>
        <strong>Подберем по VIN</strong>
        <p>Проверим совместимость менеджером, покажем оригинал, аналоги, наличие, цену и срок поставки.</p>
      </aside>

      {message && (
        <div className={state === "error" ? styles.errorBox : styles.successBox}>
          {message}
        </div>
      )}
    </div>
  );
}
