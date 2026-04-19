import { NextResponse } from "next/server";
import { calculerTout } from "@/lib/calc";
import type { CalculateRequest, CalculateResponse } from "@/lib/calc/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CalculateRequest;
    if (!body?.inputs) {
      return NextResponse.json<CalculateResponse>(
        { ok: false, errors: ["Inputs manquants"] },
        { status: 400 }
      );
    }
    const data = calculerTout(body.inputs);
    return NextResponse.json<CalculateResponse>({ ok: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json<CalculateResponse>(
      { ok: false, errors: [msg] },
      { status: 500 }
    );
  }
}
