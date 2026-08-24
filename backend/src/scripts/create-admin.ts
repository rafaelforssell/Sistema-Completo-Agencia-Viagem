// Cria (ou atualiza a senha d)o administrador único do sistema.
//
// Uso:
//   npm run create-admin -- --nome="Rafael Forssell" --email="voce@agencia.com.br" --senha="umaSenhaForte123"
//
// Se já existir um admin com esse e-mail, a senha e o nome são atualizados.

import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function main() {
  const { nome, email, senha } = parseArgs();

  if (!nome || !email || !senha) {
    console.error(
      'Uso: npm run create-admin -- --nome="Seu Nome" --email="voce@agencia.com.br" --senha="umaSenhaForte123"'
    );
    process.exit(1);
  }

  if (senha.length < 8) {
    console.error("A senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const senhaHash = await hashPassword(senha);

  const admin = await prisma.admin.upsert({
    where: { email },
    create: { nome, email, senhaHash },
    update: { nome, senhaHash },
  });

  console.log(`Admin pronto: ${admin.nome} <${admin.email}>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
