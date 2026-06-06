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

const groups = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Assistente IA", url: "/assistente", icon: Sparkles },
      { title: "Crescimento", url: "/crescimento", icon: TrendingUp },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Encomendas", url: "/encomendas", icon: ShoppingBag },
      { title: "Estado encomendas", url: "/estado-encomendas", icon: ClipboardList },
      { title: "Projetos", url: "/projetos", icon: FolderPlus },
      { title: "Projeto personalizado", url: "/projeto-personalizado", icon: Wand2 },
      { title: "Registo de horas", url: "/horas", icon: Clock },
      { title: "To-do list", url: "/todo", icon: ListChecks },
    ],
  },
  {
    label: "Inventário",
    items: [
      { title: "Stock de material", url: "/stock", icon: Package },
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
    ],
  },
  {
    label: "Comercial",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Vendas concluídas", url: "/vendas", icon: CheckCircle2 },
      { title: "Faturação", url: "/faturacao", icon: Receipt },
      { title: "Marketing & vendas", url: "/marketing", icon: Megaphone },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Cash flow", url: "/cashflow", icon: Wallet },
      { title: "Despesas fixas", url: "/despesas", icon: PiggyBank },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Personalização", url: "/design", icon: Palette },
      { title: "Gestão fornecedores", url: "/gestao-fornecedores", icon: Building2 },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const nome = useStore((s) => s.design.nomeNegocio);

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