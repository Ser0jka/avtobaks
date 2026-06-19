import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// GET /api/account/me — быстрая проверка авторизации (без тяжёлых JOIN)
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json(null);
  return NextResponse.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
  });
}
