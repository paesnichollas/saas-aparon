import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "Alteracao de logo desabilitada por regra de negocio.",
    },
    { status: 403 },
  );
}
