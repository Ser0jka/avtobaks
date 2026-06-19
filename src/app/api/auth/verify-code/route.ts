import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { phone, code, name } = await req.json();

  if (!phone || !code) {
    return NextResponse.json({ error: "Не переданы phone или code" }, { status: 400 });
  }

  // Ищем актуальный код
  const smsCode = await prisma.smsCode.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!smsCode) {
    return NextResponse.json({ error: "Неверный или устаревший код" }, { status: 401 });
  }

  // Помечаем код как использованный
  await prisma.smsCode.update({
    where: { id: smsCode.id },
    data: { used: true },
  });

  // Создаём или находим пользователя
  const user = await prisma.user.upsert({
    where: { phone },
    update: name ? { name } : {},
    create: { phone, name: name || "Пользователь" },
  });

  // Устанавливаем сессию (cookie)
  await setSession(user.id);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, phone: user.phone, name: user.name, email: user.email },
  });
}
