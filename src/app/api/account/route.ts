import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/account — получить данные текущего пользователя
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
      favorites: true,
    },
  });

  return NextResponse.json(fullUser);
}

// PATCH /api/account — обновить профиль
export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { name, email } = await req.json();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email: email || null }),
    },
  });

  return NextResponse.json({
    id: updated.id,
    phone: updated.phone,
    name: updated.name,
    email: updated.email,
  });
}
