import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || !/^\+7\d{10}$/.test(phone)) {
    return NextResponse.json({ error: "Неверный номер телефона" }, { status: 400 });
  }

  // Генерируем 4-значный код
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

  // Помечаем старые коды как использованные
  await prisma.smsCode.updateMany({
    where: { phone, used: false },
    data: { used: true },
  });

  // Сохраняем новый код
  await prisma.smsCode.create({
    data: { phone, code, expiresAt },
  });

  // В dev — логируем в консоль вместо SMS
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📱 SMS КОД для ${phone}: ${code}\n`);
  } else {
    // TODO: подключить SMS API (SMSC, SMS.ru и т.д.)
    // await sendSms(phone, `Ваш код Автобакс: ${code}`);
    console.log(`SMS код для ${phone}: ${code}`); // временно
  }

  return NextResponse.json({ ok: true });
}
