import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  LayoutDashboard,
  Percent,
  Plane,
  RefreshCcw,
  Users,
  Wallet,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/viagens", label: "Viagens", icon: Plane },
  { href: "/reembolsos", label: "Reembolsos", icon: RefreshCcw },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/comissoes", label: "Comissões", icon: Percent },
  { href: "/resumo", label: "Resumo", icon: Activity },
  { href: "/alertas", label: "Alertas", icon: Bell },
];
