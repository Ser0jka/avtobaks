import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type CartItem = { id: string; title: string; price: number; qty: number };

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    items: CartItem[];
    customerName: string;
    customerPhone: string;
    deliveryType: "pickup" | "delivery";
    address?: string;
    comment?: string;
  };

  const { items, customerName, customerPhone, deliveryType, address, comment } = body;

  if (!items?.length || !customerName || !customerPhone) {
    return NextResponse.json({ error: "Не заполнены обязательные поля" }, { status: 400 });
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  // Получаем пользователя из сессии (если залогинен)
  const sessionUser = await getSession();

  const order = await prisma.order.create({
    data: {
      userId:        sessionUser?.id ?? null,
      customerName,
      customerPhone,
      deliveryType,
      address:       address || null,
      comment:       comment || null,
      total,
      items: {
        create: items.map((i) => ({
          title: i.title,
          qty:   i.qty,
          price: i.price,
        })),
      },
    },
    include: { items: true },
  });

  // Уведомление в консоль (на проде — заменить на Telegram/email)
  console.log("\n🛒 НОВЫЙ ЗАКАЗ", order.id);
  console.log("Клиент:", customerName, customerPhone);
  console.log("Доставка:", deliveryType === "delivery" ? `Доставка: ${address}` : "Самовывоз");
  console.log("Товары:", items.map((i) => `${i.title} ×${i.qty}`).join(", "));
  console.log("Итого:", total.toLocaleString("ru-RU"), "₽\n");

  // Уведомление в Telegram (если задан токен)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const text = [
      `🛒 <b>Новый заказ #${order.id.slice(-6).toUpperCase()}</b>`,
      `👤 ${customerName} | ${customerPhone}`,
      `📦 ${deliveryType === "delivery" ? `Доставка: ${address}` : "Самовывоз"}`,
      ``,
      items.map((i) => `• ${i.title} ×${i.qty} — ${(i.price * i.qty).toLocaleString("ru-RU")} ₽`).join("\n"),
      ``,
      `💰 <b>Итого: ${total.toLocaleString("ru-RU")} ₽</b>`,
      comment ? `💬 ${comment}` : "",
    ].filter(Boolean).join("\n");

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    process.env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    ).catch(() => {}); // не блокируем если TG недоступен
  }

  return NextResponse.json({ ok: true, orderId: order.id });
}
