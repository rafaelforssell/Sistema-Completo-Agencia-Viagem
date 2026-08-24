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
  // A CDN/origem pode comprimir a resposta com um algoritmo (ex.: zstd) que o
  // fetch do Node não sabe descomprimir. Não repassamos o Accept-Encoding do
  // navegador para a origem, e não repassamos o Content-Encoding da origem
  // de volta ao navegador, já que o corpo aqui já vem/sai sempre decodificado.
  "accept-encoding",
  "content-encoding",
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

  // Lê o corpo inteiro antes de responder (em vez de repassar `response.body`
  // como stream) — em algumas hospedagens o proxy/CDN na frente do Next.js
  // corta o corpo de respostas em stream, devolvendo content-length: 0.
  const bodyBuffer = await response.arrayBuffer();

  // Respostas com esses status não podem ter corpo (é inválido pela spec do
  // fetch/Response) — passar um ArrayBuffer, mesmo vazio, faz o construtor
  // do NextResponse lançar uma exceção e a rota inteira virar 500.
  const NULL_BODY_STATUSES = new Set([204, 205, 304]);
  const responseBody = NULL_BODY_STATUSES.has(response.status) ? null : bodyBuffer;

  return new NextResponse(responseBody, {
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
