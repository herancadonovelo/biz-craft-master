import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderPlus,
  Clock,
  Wallet,
  Sparkles,
  TrendingUp,
  Truck,
  Wand2,
  Receipt,
  Megaphone,
  ListChecks,
  Users,
  CheckCircle2,
  Building2,
  ClipboardList,
  PiggyBank,
  Palette,
  Calculator,
  Lock,
  Image as ImageIcon,
  GraduationCap,
  Instagram,
  Calendar,
  Languages,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

const getGroups = (t: (k: string) => string) => [
  {
    label: t("nav.overview"),
    items: [
      { title: t("nav.dashboard"), url: "/", icon: LayoutDashboard },
      { title: t("nav.assistant"), url: "/assistente", icon: Sparkles },
      { title: t("nav.growth"), url: "/crescimento", icon: TrendingUp },
      { title: t("nav.calendar"), url: "/calendario", icon: Calendar },
    ],
  },
  {
    label: t("nav.operation"),
    items: [
      { title: t("nav.orders"), url: "/encomendas", icon: ShoppingBag },
      { title: t("nav.ordersStatus"), url: "/estado-encomendas", icon: ClipboardList },
      { title: t("nav.projects"), url: "/projetos", icon: FolderPlus },
      { title: t("nav.customProject"), url: "/projeto-personalizado", icon: Wand2 },
      { title: t("nav.calculator"), url: "/calculadora", icon: Calculator },
      { title: t("nav.hours"), url: "/horas", icon: Clock },
      { title: t("nav.todo"), url: "/todo", icon: ListChecks },
      { title: t("nav.portfolio"), url: "/portfolio", icon: ImageIcon },
    ],
  },
  {
    label: t("nav.inventory"),
    items: [
      { title: t("nav.stock"), url: "/stock", icon: Package },
      { title: t("nav.suppliers"), url: "/fornecedores", icon: Truck },
    ],
  },
  {
    label: t("nav.commercial"),
    items: [
      { title: t("nav.clients"), url: "/clientes", icon: Users },
      { title: t("nav.courses"), url: "/cursos", icon: GraduationCap },
      { title: t("nav.sales"), url: "/vendas", icon: CheckCircle2 },
      { title: t("nav.billing"), url: "/faturacao", icon: Receipt },
      { title: t("nav.marketing"), url: "/marketing", icon: Megaphone },
      { title: t("nav.instagram"), url: "/instagram", icon: Instagram },
    ],
  },
  {
    label: t("nav.financial"),
    items: [
      { title: t("nav.cashflow"), url: "/cashflow", icon: Wallet },
      { title: t("nav.expenses"), url: "/despesas", icon: PiggyBank },
    ],
  },
  {
    label: t("nav.system"),
    items: [
      { title: t("nav.design"), url: "/design", icon: Palette },
      { title: t("nav.supplierMgmt"), url: "/gestao-fornecedores", icon: Building2 },
      { title: t("nav.accounts"), url: "/contas", icon: Lock },
      { title: t("nav.language"), url: "/idioma", icon: Languages },
      { title: t("nav.settings"), url: "/configuracoes", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const nome = useStore((s) => s.design.nomeNegocio);
  const t = useT();
  const groups = getGroups(t);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-display font-bold">
            A
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-sm font-semibold text-sidebar-foreground">
                {nome}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
                Admin
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => {
                  const active = pathname === it.url;
                  return (
                    <SidebarMenuItem key={it.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={it.title}>
                        <Link to={it.url} className="flex items-center gap-2">
                          <it.icon className="h-4 w-4" />
                          {!collapsed && <span>{it.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}