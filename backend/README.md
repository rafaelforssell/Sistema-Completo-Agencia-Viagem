# Sistema Agência de Viagem — API

API REST (Node.js + Express + TypeScript + Prisma/PostgreSQL) que atende o
[frontend](../README.md) do sistema. Implementa o contrato descrito em
[`API_ENDPOINTS.md`](../API_ENDPOINTS.md).

## Stack

- Express + TypeScript, rodando com `tsx` em desenvolvimento e compilado com `tsc` em produção
- Prisma ORM + PostgreSQL
- JWT (jsonwebtoken) + bcryptjs para o login único do admin
- Multer para upload de anexos (armazenados em disco, servidos em `/uploads`)
- PDFKit para gerar o voucher em PDF

## Rodando localmente

Pré-requisito: um banco PostgreSQL acessível (local, Docker, ou um provedor
gerenciado — ver seção "Banco de dados" abaixo).

```bash
cd backend
npm install
cp .env.example .env   # edite DATABASE_URL, JWT_SECRET, etc.
npm run prisma:deploy  # aplica as migrations existentes em prisma/migrations
npm run create-admin -- --nome="Seu Nome" --email="voce@agencia.com.br" --senha="umaSenhaForte123"
npm run dev
```

A API sobe em `http://localhost:3333` (ajustável via `PORT`). Teste com:

```bash
curl http://localhost:3333/health
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"voce@agencia.com.br","senha":"umaSenhaForte123"}'
```

### Criando/alterando o admin

Como o sistema tem um único administrador, não há tela de "criar conta" — o
acesso é criado por linha de comando (`npm run create-admin`, acima). Rodar o
comando de novo com o mesmo e-mail atualiza nome e senha. Guarde a senha em
um gerenciador de senhas; ela nunca fica visível em lugar nenhum além do
terminal em que você a digitou.

### Variáveis de ambiente

Ver [`.env.example`](.env.example) para a lista completa e comentada. As
mais importantes:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL. |
| `JWT_SECRET` | Segredo para assinar o token — gere um valor aleatório forte. |
| `CORS_ORIGIN` | URL pública do frontend (permite a chamada server-to-server do proxy Next.js). |
| `PUBLIC_URL` | URL pública desta API — usada para montar os links de download de anexos e vouchers. |
| `UPLOADS_DIR` | Pasta onde os arquivos enviados ficam salvos em disco. |

## Banco de dados

O schema completo está em [`prisma/schema.prisma`](prisma/schema.prisma) e a
migration inicial já vem pronta em `prisma/migrations/`. Basta rodar
`npm run prisma:deploy` contra um banco vazio.

**Importante sobre a Hostinger**: a hospedagem compartilhada/cloud da
Hostinger normalmente só oferece **MySQL**, não PostgreSQL — PostgreSQL só
costuma estar disponível em planos **VPS** (onde você mesmo instala o
Postgres). Se seu plano não for VPS, use um PostgreSQL gerenciado externo,
por exemplo:

- [Neon](https://neon.tech) — tem plano gratuito, ótimo com Prisma, connection string pronta.
- [Supabase](https://supabase.com) — também oferece PostgreSQL gerenciado.
- [Railway](https://railway.app)

Basta colar a connection string fornecida por eles em `DATABASE_URL`; nada
mais no projeto precisa mudar.

## Build de produção

```bash
npm run build   # compila TypeScript para dist/ e gera o Prisma Client
npm run start   # roda dist/server.js
```

## Deploy na Hostinger (Node.js Hosting / VPS)

1. Garanta que `DATABASE_URL` aponte para um PostgreSQL alcançável a partir
   do servidor (VPS com Postgres local, ou um provedor externo — ver acima).
2. No hPanel, crie **outra** aplicação Node.js (além da do frontend),
   apontando o diretório raiz da aplicação para a pasta `backend/` deste
   repositório.
3. Configure as variáveis de ambiente da seção acima no painel.
4. Comandos de build/start:
   ```bash
   npm install
   npm run build
   npm run prisma:deploy
   npm run start
   ```
5. Depois do primeiro deploy, rode uma única vez (via SSH/terminal do
   painel): `npm run create-admin -- --nome="..." --email="..." --senha="..."`.
6. Aponte a variável `API_BASE_URL` do **frontend** para a URL pública desta
   API (ex.: `https://api.seudominio.com`), e `CORS_ORIGIN` **desta API**
   para a URL pública do frontend.
7. Os anexos e vouchers são salvos em disco (`UPLOADS_DIR`) — confirme que
   essa pasta persiste entre deploys/restarts da aplicação na Hostinger. Se
   a hospedagem limpar o disco a cada deploy, migre para um storage externo
   (S3-compatible, ex. Cloudflare R2 ou o Object Storage da própria
   Hostinger) antes de ir para produção com uso real.

## Estrutura de pastas

```
src/
  app.ts                # montagem do Express (CORS, rotas, middlewares)
  server.ts              # entrypoint (app.listen)
  env.ts                  # leitura/validação das variáveis de ambiente
  lib/                     # prisma client, jwt, bcrypt, HttpError
  middleware/              # auth (JWT), tratamento de erros, async handler
  modules/
    auth/                  # login, /auth/me
    clientes/               # CRUD de clientes
    viagens/                 # CRUD de viagens + passageiros aninhados + voucher (PDF)
    pagamentos/               # atualizar/remover pagamento (criação é aninhada em viagens)
    reembolsos/                # listagem geral + atualizar/remover
    contas/                     # CRUD + resumo financeiro
    comissoes/                   # CRUD (valorLiquido calculado no servidor)
    anexos/                       # upload/listagem/remoção (Multer + disco)
    dashboard/                     # métricas, atividades (feed) e alertas (sintéticos)
  scripts/create-admin.ts          # cria/atualiza o admin único
prisma/
  schema.prisma
  migrations/
```
