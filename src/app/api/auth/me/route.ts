import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSessionToken } from "@/lib/auth/session";

// Retorna os dados do admin autenticado, usado pelo header/menu do usuário.
export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ mensagem: "Não autenticado." }, { status: 401 });
  }

  const upstream = await fetch(`${env.apiBaseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json({ mensagem: "Sessão inválida." }, { status: upstream.status });
  }

  const data = await upstream.json();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
