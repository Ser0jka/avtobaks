"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import { MessageCircleIcon, SendIcon, XIcon } from "@/components/Icon";
import styles from "./ChatWidget.module.css";

type Role = "user" | "bot";

interface Message {
  id: string;
  role: Role;
  text: string;
  time: string;
}

const QUICK_REPLIES = [
  "Как подобрать запчасть по VIN?",
  "Есть ли доставка?",
  "Режим работы",
  "Как оплатить заказ?",
];

const GREETING: Message = {
  id: "greeting",
  role: "bot",
  text: "Привет! 👋 Я Макс — помощник Автобакс. Помогу подобрать запчасть, расскажу о наличии и доставке. Что вас интересует?",
  time: formatTime(new Date()),
};

function formatTime(d: Date) {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: uid(),
      role: "user",
      text: trimmed,
      time: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Build history for API (exclude greeting system message)
    const history = [...messages, userMsg]
      .filter((m) => m.id !== "greeting")
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = (await res.json().catch(() => ({
        error: "Сервер чата вернул некорректный ответ. Попробуйте позже.",
      }))) as { reply?: string; error?: string };

      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "bot",
            text: `⚠️ ${data.error ?? "Ошибка соединения. Попробуйте позже."}`,
            time: formatTime(new Date()),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "bot",
            text: data.reply ?? "Не смог сформулировать ответ. Попробуйте ещё раз.",
            time: formatTime(new Date()),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          text: "⚠️ Не удалось связаться с сервером. Позвоните нам: +7 906 986 66 61",
          time: formatTime(new Date()),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([{ ...GREETING, time: formatTime(new Date()) }]);
  }

  const showQuickReplies =
    messages.length === 1 && messages[0].id === "greeting";

  function toggleChat() {
    if (!open) setHasUnread(false);
    setOpen((current) => !current);
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className={styles.window} role="dialog" aria-label="Чат с помощником">
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.avatar}>М</div>
            <div className={styles.headerInfo}>
              <p className={styles.headerName}>Макс · Автобакс</p>
              <p className={styles.headerStatus}>
                <span className={styles.statusDot} />
                Онлайн — отвечу сразу
              </p>
            </div>
            <button className={styles.clearBtn} onClick={clearChat} title="Очистить чат">
              Очистить
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.msg} ${msg.role === "user" ? styles.user : styles.bot}`}
              >
                <div className={styles.bubble}>{msg.text}</div>
                <span className={styles.msgTime}>{msg.time}</span>

                {/* Quick replies after greeting */}
                {msg.id === "greeting" && showQuickReplies && (
                  <div className={styles.quickReplies}>
                    {QUICK_REPLIES.map((qr) => (
                      <button
                        key={qr}
                        className={styles.qr}
                        onClick={() => sendMessage(qr)}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className={`${styles.msg} ${styles.bot}`}>
                <div className={styles.typing}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <textarea
              ref={inputRef}
              className={styles.input}
              placeholder="Напишите вопрос…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Отправить"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        className={`${styles.fab} ${open ? styles.open : ""}`}
        onClick={toggleChat}
        aria-label={open ? "Закрыть чат" : "Открыть чат с помощником"}
        aria-expanded={open}
      >
        <MessageCircleIcon className={styles.fabIcon} />
        <XIcon className={styles.fabClose} />

        {!open && hasUnread && <span className={styles.badge}>1</span>}
      </button>
    </>
  );
}
