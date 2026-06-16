import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Ты — Макс, умный помощник интернет-магазина автозапчастей «Автобакс» в Кемерово.

О компании:
- 2 филиала в Кемерово: пр. Ленина, 70 (цокольный этаж) и пр. Ленина, 103
- Телефон: +7 906 986 66 61
- WhatsApp/Telegram: +7 906 986 66 61
- Режим работы: Пн–Пт 9:00–20:00, Суббота 10:00–18:00, Воскресенье — выходной
- Более 130 000 товаров в наличии и под заказ
- Подбор запчастей по VIN, артикулу, марке и модели автомобиля
- Рейтинг 4.6 на Яндекс Картах

Что умеешь:
1. Помогать подобрать запчасть по описанию проблемы, VIN или марке/модели авто
2. Отвечать на вопросы о доставке, наличии, оплате
3. Рассказывать о работе магазина
4. Давать советы по выбору масла, фильтров, расходников
5. Направлять к менеджеру для сложных запросов

Правила ответов:
- Отвечай коротко, конкретно, по-русски
- Если человек спрашивает про конкретную запчасть — уточни марку, модель, год выпуска и объём двигателя
- Если не знаешь точного ответа — предложи связаться с менеджером: +7 906 986 66 61 или WhatsApp
- Не придумывай цены — говори «уточните у менеджера» или направляй в каталог
- Будь дружелюбным, как опытный консультант автомагазина
- Можешь иногда добавить уместную эмодзи, но не переусердствуй`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY не настроен" }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const reply =
      completion.choices[0]?.message?.content ??
      "Не смог сформулировать ответ. Попробуйте ещё раз.";

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error("Groq API error:", err);
    const message = err instanceof Error ? err.message : "Ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
