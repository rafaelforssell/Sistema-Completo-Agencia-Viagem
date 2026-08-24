# Sistema Agência de Viagem

Sistema interno de gestão (CRM + financeiro + operacional) de uma agência de
viagens, para uso de um único administrador. Centraliza clientes, viagens,
pagamentos, reembolsos, contas, comissionamento, documentos e vouchers.

Este repositório é um monorepo com duas partes:

- **Frontend** (raiz do repositório, documentado abaixo) — Next.js.
- **[Backend](backend/README.md)** (pasta `backend/`) — API REST em
  Node.js/Express + Prisma/PostgreSQL. Tem seu próprio `package.json` e é
  implantado como uma aplicação Node.js separada.

O contrato entre os dois está documentado em [`API_ENDPOINTS.md`](API_ENDPOINTS.md).

## Frontend

### Stack

- **Next.js 15** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS v3** + **shadcn/ui** (Radix, estilo `new-york`)
- **TanStack Query** (estado de servidor) + **TanStack Table** (tabelas)
- **react-hook-form** + **zod** (formulários e validação)
- **react-dropzone** (upload de documentos)
- Autenticação **JWT** com cookie **httpOnly**, rotas protegidas por `middleware.ts`

O frontend **não** acessa a API do backend diretamente do browser. Todas as
chamadas passam por um proxy autenticado em `src/app/api/[...path]/route.ts`
(padrão BFF), que anexa o JWT no servidor a partir do cookie httpOnly — o
token nunca fica acessível ao JavaScript do cliente. O contrato de endpoints
assumido está documentado em [`API_ENDPOINTS.md`](API_ENDPOINTS.md).

### Estrutura de pastas

```
src/
  app/
    login/                 # tela pública de login
    (app)/                 # grupo de rotas protegidas (layout com sidebar + header)
      page.tsx              # painel / CRM
      clientes/
      viagens/
      reembolsos/
      contas/
      comissoes/
      resumo/               # feed "o que está rolando"
      alertas/
    api/
      [...path]/route.ts    # proxy autenticado para a API do backend
      auth/{login,logout,me}/route.ts
  components/
    ui/                     # componentes shadcn/ui
    layout/                 # sidebar, header, menu do usuário, alertas
    data-table/             # tabela reutilizável (busca + filtro + paginação)
    upload/                 # painel de anexos (drag-and-drop)
    common/                 # PageHeader, StatCard, StatusBadge, EmptyState...
    clientes/ viagens/ pagamentos/ reembolsos/ contas/ comissoes/
  hooks/                    # hooks TanStack Query por recurso
  lib/
    api/                    # funções de chamada a cada recurso (via /api/*)
    schemas/                # schemas zod dos formulários
    auth/session.ts         # cookie httpOnly (leitura/escrita, servidor)
    http.ts                 # cliente fetch usado no browser
  types/entities.ts         # tipos de domínio (espelham a API)
  middleware.ts             # protege rotas quando não há sessão válida
```

### Rodando localmente

Pré-requisitos: Node.js 18.18+ (recomendado 20 LTS) e um backend rodando a
API descrita em `API_ENDPOINTS.md`.

```bash
npm install
cp .env.example .env.local   # ajuste API_BASE_URL para a sua API
npm run dev
```

Acesse `http://localhost:3000`. Sem um backend real respondendo em
`API_BASE_URL`, o login retorna erro de conexão (503) — isso é esperado e o
frontend trata o erro sem quebrar a tela.

### Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `API_BASE_URL` | URL base da API REST do backend, sem barra final. | `http://localhost:3333/api` |
| `AUTH_COOKIE_NAME` | Nome do cookie httpOnly que guarda o JWT. | `sav_token` |

Essas variáveis são usadas **apenas no servidor** (route handlers e
middleware) — nunca são expostas ao bundle do browser.

### Build de produção

```bash
npm run build
npm run start   # serve o build em produção (porta 3000 por padrão)
```

`next.config.ts` usa `output: "standalone"`, gerando em `.next/standalone`
um servidor Node.js autocontido (com apenas as dependências necessárias),
ideal para hospedagens com espaço/processo limitado como a Hostinger.

### Deploy na Hostinger (Node.js Hosting / VPS)

1. **Build local ou em CI**, gerando a pasta `.next/standalone`:
   ```bash
   npm ci
   npm run build
   ```
2. **Envie para o servidor** os seguintes itens (via Git ou FTP/SSH):
   - `.next/standalone/` (inclui `server.js` e um `node_modules` mínimo)
   - `.next/static/` → copie para `.next/standalone/.next/static`
   - `public/` → copie para `.next/standalone/public`
   - seu arquivo `.env` de produção (não commitado) na raiz de `standalone/`
3. **Configure a aplicação Node.js** no painel da Hostinger (hPanel → Website
   → Node.js):
   - Diretório da aplicação: onde você enviou o conteúdo de `standalone/`
   - Arquivo de inicialização (Startup file): `server.js`
   - Versão do Node: 18 ou 20
   - Variáveis de ambiente: `API_BASE_URL`, `AUTH_COOKIE_NAME`, `PORT`
     (a Hostinger injeta a porta esperada; `server.js` já respeita `process.env.PORT`)
4. **HTTPS é obrigatório em produção**: o cookie de sessão é marcado
   `secure` quando `NODE_ENV=production` (ver `src/lib/auth/session.ts`), ou
   seja, ele só é enviado em conexões HTTPS. Ative o SSL gratuito da
   Hostinger para o domínio antes de liberar o acesso.
5. Reinicie a aplicação pelo painel para aplicar variáveis de ambiente novas.

> Alternativa em VPS Hostinger com acesso root: use PM2 (`pm2 start
> .next/standalone/server.js --name sistema-agencia`) atrás de um proxy
> reverso Nginx com TLS.

Este projeto **não** usa `next export` / build estático — o middleware
(proteção de rotas) e os route handlers do proxy (`/api/*`) exigem um
runtime Node.js ativo, por isso a hospedagem Node.js da Hostinger (ou um VPS)
é o alvo correto, não hospedagem puramente estática.

### Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (`output: standalone`) |
| `npm run start` | Serve o build de produção |
| `npm run lint` | ESLint |

## Backend

Ver [`backend/README.md`](backend/README.md) — setup local, variáveis de
ambiente, banco de dados (PostgreSQL — atenção à observação sobre a
Hostinger no README do backend) e deploy.
