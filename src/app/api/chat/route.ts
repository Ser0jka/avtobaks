import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role?: string;
  content?: string;
};

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

function fallbackReply(messages: ChatMessage[] = []) {
  const lastMessage =
    [...messages]
      .reverse()
      .find((message) => message.role === "user" && message.content)
      ?.content?.toLowerCase() ?? "";

  if (lastMessage.includes("vin") || lastMessage.includes("вин")) {
    return "Для подбора по VIN отправьте VIN-номер, марку, модель и год автомобиля. Если есть фото детали или артикул, тоже приложите. Менеджер Автобакс проверит совместимость и предложит варианты в наличии или под заказ.";
  }

  if (lastMessage.includes("достав")) {
    return "По доставке лучше уточнить у менеджера: условия зависят от детали, наличия и адреса. Напишите в WhatsApp или Telegram: +7 906 986 66 61.";
  }

  if (lastMessage.includes("оплат")) {
    return "Оплату можно согласовать с менеджером при оформлении заказа. Для точных условий напишите или позвоните: +7 906 986 66 61.";
  }

  if (lastMessage.includes("режим") || lastMessage.includes("работ")) {
    return "Автобакс работает в Кемерово: пн-пт 9:00-20:00, суббота 10:00-18:00, воскресенье выходной. Телефон для связи: +7 906 986 66 61.";
  }

  return "Я помогу с подбором запчасти. Напишите VIN, артикул или марку, модель и год авто. Если вопрос срочный, свяжитесь с менеджером Автобакс: +7 906 986 66 61, WhatsApp или Telegram.";
}

export async function POST(req: NextRequest) {
  try {
    const { messages = [] } = (await req.json()) as { messages?: ChatMessage[] };

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free";

    if (!apiKey) {
      return NextResponse.json({ reply: fallbackReply(messages) });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://avtobaks.ru",
        "X-Title": "Avtobaks",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("OpenRouter error:", data);
      return NextResponse.json({ reply: fallbackReply(messages) });
    }

    const reply =
      data.choices?.[0]?.message?.content ??
      "Не смог сформулировать ответ. Попробуйте ещё раз.";

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error("OpenRouter API error:", err);
    return NextResponse.json({ reply: fallbackReply() });
  }
}
