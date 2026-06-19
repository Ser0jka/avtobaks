import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();
  const request = await prisma.vinRequest.update({
    where: { id },
    data: {
      status: typeof body.status === "string" ? body.status : undefined,
      comment: typeof body.comment === "string" ? body.comment : undefined,
    },
  });

  return NextResponse.json(request);
}
