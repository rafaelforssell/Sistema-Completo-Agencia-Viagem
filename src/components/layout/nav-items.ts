import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Building2,
  Kanban,
  LayoutDashboard,
  Percent,
  Plane,
  RefreshCcw,
  ShoppingBag,
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
  { href: "/vendas", label: "Vendas", icon: ShoppingBag },
  { href: "/reembolsos", label: "Reembolsos", icon: RefreshCcw },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/comissoes", label: "Comissões", icon: Percent },
  { href: "/fornecedores", label: "Fornecedores", icon: Building2 },
  { href: "/crm", label: "CRM", icon: Kanban },
  { href: "/resumo", label: "Resumo", icon: Activity },
  { href: "/alertas", label: "Alertas", icon: Bell },
];
