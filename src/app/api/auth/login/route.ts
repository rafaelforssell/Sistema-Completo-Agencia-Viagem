import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { setSessionCookie } from "@/lib/auth/session";

// Encaminha o login para POST {API_BASE_URL}/auth/login. A API deve responder
// com { token: string, admin: { id, nome, email } }. O token é armazenado em
// cookie httpOnly e nunca é devolvido ao JavaScript do cliente.
export async function POST(request: NextRequest) {
  const body = await request.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${env.apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { mensagem: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 503 }
    );
  }

  if (!upstream.ok) {
    const errorBody = await upstream.json().catch(() => ({}));
    return NextResponse.json(
      { mensagem: errorBody.mensagem ?? "Não foi possível autenticar." },
      { status: upstream.status }
    );
  }

  const data = await upstream.json();
  if (!data?.token) {
    return NextResponse.json(
      { mensagem: "Resposta de autenticação inválida." },
      { status: 502 }
    );
  }

  await setSessionCookie(data.token);
  return NextResponse.json({ admin: data.admin ?? null });
}
