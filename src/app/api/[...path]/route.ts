import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSessionToken } from "@/lib/auth/session";

// Proxy autenticado (BFF) entre o frontend e a API REST do backend.
// Mantém o JWT fora do alcance do JavaScript do cliente: o token fica em um
// cookie httpOnly (definido em /api/auth/login) e é anexado aqui, no servidor,
// a cada chamada encaminhada para API_BASE_URL.

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-length",
  "host",
]);

async function proxy(request: NextRequest, path: string[]) {
  const token = await getSessionToken();
  const targetUrl = `${env.apiBaseUrl}/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && key.toLowerCase() !== "authorization") {
      headers.set(key, value);
    }
  });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const hasBody = !["GET", "HEAD"].includes(request.method);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // @ts-expect-error -- necessário para stream de upload em Node runtime
      duplex: hasBody ? "half" : undefined,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      { mensagem: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 503 }
    );
  }

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  if (response.status === 401) {
    responseHeaders.set("x-session-expired", "1");
  }

  // Evita que CDN/proxy/navegador guarde em cache respostas da API — os
  // dados mudam a cada escrita e precisam refletir o estado atual do banco.
  responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}
export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}
export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}
export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}
