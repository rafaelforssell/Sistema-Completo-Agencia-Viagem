import type { Metadata } from "next";
import { Suspense } from "react";
import { Compass } from "lucide-react";
import { LoginForm } from "@/components/login/login-form";
import { RouteSignature } from "@/components/login/route-signature";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0">
          <RouteSignature />
        </div>
        <div className="relative flex items-center gap-2 text-primary-foreground">
          <Compass className="h-6 w-6" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Sistema Agência
          </span>
        </div>
        <div className="relative max-w-sm space-y-2 text-primary-foreground">
          <p className="font-display text-2xl font-medium leading-snug">
            Clientes, viagens e financeiro em um único lugar.
          </p>
          <p className="text-sm text-primary-foreground/70">
            Painel administrativo interno da agência — acesso restrito.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1.5 lg:hidden">
            <div className="flex items-center gap-2 text-primary">
              <Compass className="h-6 w-6" />
              <span className="font-display text-lg font-semibold tracking-tight">
                Sistema Agência
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Entrar no painel
            </h1>
            <p className="text-sm text-muted-foreground">
              Use suas credenciais de administrador para continuar.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
