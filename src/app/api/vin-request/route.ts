import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vin, car, part, catId, name, phone, comment } = body;

    if (!vin || !part) {
      return NextResponse.json({ error: "Укажите VIN и деталь" }, { status: 400 });
    }

    // Формируем текст заявки для лога / Telegram
    const lines = [
      "📋 *Заявка на подбор по VIN*",
      `🔑 VIN: \`${vin}\``,
      car ? `🚗 Авто: ${car}` : null,
      `🔧 Деталь: ${part}`,
      catId ? `📂 Cat ID: ${catId}` : null,
      name ? `👤 Имя: ${name}` : null,
      phone ? `📞 Телефон: ${phone}` : null,
      comment ? `💬 Комментарий: ${comment}` : null,
    ].filter(Boolean).join("\n");

    // Telegram уведомление (если настроен)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: lines,
          parse_mode: "Markdown",
        }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {}); // не блокируем ответ если TG недоступен
    }

    // Лог в консоль (в продакшн заменить на БД или email)
    console.log("[VIN-REQUEST]", { vin, car, part, catId, name, phone, comment });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
