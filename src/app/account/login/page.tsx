"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

type Step = "phone" | "code" | "name";

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  let r = "+7";
  if (digits.length > 1) r += " (" + digits.slice(1, 4);
  if (digits.length > 4) r += ") " + digits.slice(4, 7);
  if (digits.length > 7) r += "-" + digits.slice(7, 9);
  if (digits.length > 9) r += "-" + digits.slice(9, 11);
  return r;
}

export default function LoginPage() {
  const router = useRouter();
  const { sendCode, verifyCode } = useAuth();

  const [step, setStep]       = useState<Step>("phone");
  const [phone, setPhone]     = useState("");
  const [code, setCode]       = useState("");
  const [name, setName]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLeft, setResendLeft] = useState(0);

  function handlePhoneInput(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(e.target.value.replace(/\D/g, ""));
    setError("");
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 11) { setError("Введите корректный номер телефона"); return; }
    setLoading(true);
    const result = await sendCode("+" + digits);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? "Ошибка отправки кода"); return; }
    setStep("code");
    setResendLeft(60);
    const timer = setInterval(() => {
      setResendLeft((v) => { if (v <= 1) { clearInterval(timer); return 0; } return v - 1; });
    }, 1000);
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 4) { setError("Введите 4-значный код"); return; }
    setLoading(true);
    const result = await verifyCode("+" + phone, code);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? "Неверный код"); return; }
    setStep("name");
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      await verifyCode("+" + phone, code, name.trim());
    }
    router.push("/account");
  }

  const displayPhone = formatPhone(phone);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>A</span>
          Автобакс
        </Link>
      </div>

      <div className={styles.card}>
        {/* Steps indicator */}
        <div className={styles.steps}>
          {(["phone", "code", "name"] as Step[]).map((s, i) => (
            <div key={s} className={styles.stepRow}>
              <span className={`${styles.stepDot} ${step === s ? styles.stepActive : i < ["phone","code","name"].indexOf(step) ? styles.stepDone : ""}`}>
                {i < ["phone","code","name"].indexOf(step) ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : i + 1}
              </span>
              {i < 2 && <span className={`${styles.stepLine} ${i < ["phone","code","name"].indexOf(step) ? styles.stepLineDone : ""}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Phone */}
        {step === "phone" && (
          <>
            <h1 className={styles.title}>Вход в личный кабинет</h1>
            <p className={styles.sub}>Введите номер телефона — отправим код подтверждения</p>
            <form onSubmit={handlePhoneSubmit} className={styles.form}>
              <div className={styles.fieldWrap}>
                <label className={styles.label}>Номер телефона</label>
                <input
                  className={`${styles.input} ${error ? styles.inputError : ""}`}
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={displayPhone}
                  onChange={handlePhoneInput}
                  autoFocus
                  autoComplete="tel"
                />
                {error && <p className={styles.error}>{error}</p>}
              </div>
              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? "Отправляем код…" : "Получить код"}
              </button>
            </form>
            <p className={styles.hint}>
              Нет аккаунта? Он создастся автоматически после входа.
            </p>
          </>
        )}

        {/* Step 2 — Code */}
        {step === "code" && (
          <>
            <h1 className={styles.title}>Введите код</h1>
            <p className={styles.sub}>
              Отправили SMS с кодом на номер <strong>{displayPhone}</strong>
              <button className={styles.changePhone} onClick={() => { setStep("phone"); setCode(""); setError(""); }}>
                Изменить
              </button>
            </p>
            <form onSubmit={handleCodeSubmit} className={styles.form}>
              <div className={styles.fieldWrap}>
                <label className={styles.label}>Код из SMS</label>
                <input
                  className={`${styles.inputCode} ${error ? styles.inputError : ""}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="• • • •"
                  maxLength={4}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                  autoFocus
                />
                {error && <p className={styles.error}>{error}</p>}
              </div>
              <button className={styles.btn} type="submit" disabled={loading || code.length < 4}>
                {loading ? "Проверяем…" : "Подтвердить"}
              </button>
            </form>
            <p className={styles.hint}>
              {resendLeft > 0
                ? `Повторная отправка через ${resendLeft} сек.`
                : <button className={styles.resendBtn} onClick={() => { setCode(""); setStep("phone"); }}>Отправить код повторно</button>
              }
            </p>
            <p className={styles.mockNote}>💡 Код виден в терминале (npm run dev)</p>
          </>
        )}

        {/* Step 3 — Name */}
        {step === "name" && (
          <>
            <h1 className={styles.title}>Как вас зовут?</h1>
            <p className={styles.sub}>Необязательно, но так удобнее</p>
            <form onSubmit={handleNameSubmit} className={styles.form}>
              <div className={styles.fieldWrap}>
                <label className={styles.label}>Ваше имя</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Например, Сергей"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  autoComplete="given-name"
                />
              </div>
              <button className={styles.btn} type="submit">
                {name.trim() ? "Войти" : "Пропустить и войти"}
              </button>
            </form>
          </>
        )}
      </div>

      <p className={styles.back}>
        <Link href="/">← На главную</Link>
      </p>
    </div>
  );
}
