import { useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-state";
import { signOutAndReset } from "@/lib/sign-out";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  PackageSearch,
  FolderPlus,
  Clock,
  Wallet,
  Sparkles,
  TrendingUp,
  Truck,
  Wand2,
  Receipt,
  CreditCard,
  Megaphone,
  ListChecks,
  Users,
  CheckCircle2,
  Building2,
  ClipboardList,
  PiggyBank,
  Palette,
  Palette as PaletteIcon,
  Calculator,
  Lock,
  Image as ImageIcon,
  GraduationCap,
  Instagram,
  Calendar,
  Languages,
  Settings,
  Building,
  RefreshCw,
  History,
  ShoppingCart,
  Tags,
  Shield,
  HelpCircle,
  Mail,
  ToggleLeft,
  MessageCircle,
  BellRing,
  ShoppingBasket,
  FileDigit,
  BookOpen,
  Layers,
  Search,
  StickyNote,
  Hash,
  PenSquare,
  Ruler,
  HardDriveDownload,
  Crown,
  Music,
  Quote,
  Coins,
} from "lucide-react";
import { Heart } from "lucide-react";
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
import { useSubscription } from "@/lib/subscription";
import { requiredPlanFor } from "@/lib/access-control";
import logoAsset from "@/assets/craft-business-master-logo-transparent.png.asset.json";
import yarnBallIcon from "@/assets/yarn-ball-icon.png.asset.json";

const YarnBallIcon = ({ className }: { className?: string }) => (
  <img src={yarnBallIcon.url} alt="" aria-hidden="true" className={className} />
);

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
      { title: "Encomendas", url: "/encomendas", icon: ShoppingBag },
      { title: "Projetos & Criação", url: "/projetos", icon: FolderPlus },
      { title: t("nav.calculator"), url: "/calculadora", icon: Calculator },
      { title: t("nav.hours"), url: "/horas", icon: Clock },
      { title: t("nav.todo"), url: "/todo", icon: ListChecks },
      { title: t("nav.portfolio"), url: "/portfolio", icon: ImageIcon },
      { title: "Moodboards & Inspiração", url: "/moodboards", icon: PaletteIcon },
      { title: "Ateliê Digital", url: "/ferramentas-tecnicas", icon: Ruler },
      { title: "Bloco de Criação & Ideias", url: "/notas", icon: StickyNote },
      { title: "Craft & Relax Music", url: "/atelier-sounds", icon: Music },
      { title: "Mural De Inspiração", url: "/mural", icon: Quote },
    ],
  },
  {
    label: t("nav.inventory"),
    items: [
      { title: "Visão Geral", url: "/inventario", icon: PackageSearch },
      { title: t("nav.stock"), url: "/stock", icon: Package },
      { title: t("nav.suppliers"), url: "/gestao-fornecedores", icon: Truck },
      { title: t("nav.shopping"), url: "/lista-compras", icon: ShoppingCart },
    ],
  },
  {
    label: t("nav.commercial"),
    items: [
      { title: t("nav.clients"), url: "/clientes", icon: Users },
      { title: t("nav.courses"), url: "/cursos", icon: GraduationCap },
      { title: t("nav.sales"), url: "/vendas", icon: CheckCircle2 },
      { title: "Arquivo de Faturas & Recibos", url: "/faturacao", icon: Receipt },
      { title: "Marketing & Conteúdo", url: "/marketing-conteudo", icon: Megaphone },
      { title: t("nav.instagram"), url: "/instagram", icon: Instagram },
      { title: t("nav.whatsapp"), url: "/whatsapp", icon: MessageCircle },
      { title: t("nav.notifications"), url: "/notificacoes", icon: BellRing },
      { title: "Etsy & Biblioteca Digital", url: "/etsy", icon: ShoppingBasket },
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
      { title: t("nav.settingsAlias"), url: "/design", icon: Palette },
      { title: t("nav.accounts"), url: "/contas", icon: Lock },
      { title: t("nav.language"), url: "/idioma", icon: Languages },
      { title: "Padrão Financeiro: Moeda Atual Definida", url: "/moeda", icon: Coins },
      { title: t("nav.profile"), url: "/perfil-negocio", icon: Building },
      { title: t("nav.sync"), url: "/sincronizacao", icon: RefreshCw },
      { title: "Backup & Restauro", url: "/backup", icon: HardDriveDownload },
      { title: "Planos & Subscrições", url: "/planos", icon: Crown },
      { title: "A Minha Subscrição", url: "/minha-subscricao", icon: CreditCard },
      { title: t("nav.modules"), url: "/modulos", icon: ToggleLeft },
    ],
  },
  {
    label: t("nav.help"),
    items: [
      { title: t("nav.help2"), url: "/ajuda", icon: HelpCircle },
      { title: t("nav.contact"), url: "/contacto", icon: Mail },
      { title: t("nav.privacy"), url: "/privacidade", icon: Shield },
      { title: "Termos e Condições", url: "/termos", icon: Shield },
      { title: "Política de Reembolsos", url: "/reembolsos", icon: Shield },
      { title: "Origem & Alma do Projeto", url: "/quem-somos", icon: Heart },
    ],
  },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile, setOpen, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const nome = useStore((s) => s.design.nomeNegocio);
  const modulos = useStore((s) => s.modulos);
  const t = useT();
  const allGroups = getGroups(t);
  const { hasAccess, showPaywall } = useSubscription();
  // Se algum módulo estiver configurado, filtra; URLs nunca ocultadas: /modulos, /configuracoes
  // Fechar drawer automaticamente em mobile ao mudar de rota
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  const visivel = (url: string) => {
    if (["/modulos", "/configuracoes"].includes(url)) return true;
    if (!modulos || Object.keys(modulos).length === 0) return true;
    return modulos[url] !== false && (modulos[url] === true || !Object.values(modulos).some(Boolean));
  };
  // Simpler logic: if modulos has any true entries, show only those (plus always-on)
  const algumAtivo = modulos && Object.values(modulos).some((v) => v === true);
  const filtroFinal = (url: string) => {
    if (["/modulos", "/configuracoes"].includes(url)) return true;
    if (!algumAtivo) return true;
    return modulos[url] === true;
  };
  const groups = allGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => filtroFinal(i.url)) }))
    .filter((g) => g.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <img
            src={logoAsset.url}
            alt={nome}
            className={collapsed ? "h-10 w-10 object-contain" : "h-14 w-auto object-contain"}
          />
          {!collapsed && (
            <div className="flex flex-1 flex-col">
              <span className="font-display text-sm font-semibold text-sidebar-foreground">
                {nome}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
                Admin
              </span>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={() => {
                if (isMobile) setOpenMobile(false);
                else setOpen(false);
              }}
              aria-label="Fechar menu e voltar"
              title="Fechar menu"
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <X className="h-4 w-4" />
            </button>
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
                  const active = it.url === "/"
                    ? pathname === "/"
                    : pathname === it.url || pathname.startsWith(it.url + "/");
                  const required = requiredPlanFor(it.url);
                  const locked = !hasAccess(required);
                  return (
                    <SidebarMenuItem key={it.url}>
                      {locked ? (
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={`${it.title} — requer ${required.toUpperCase()}`}
                          onClick={(e) => {
                            e.preventDefault();
                            showPaywall(required, it.title, it.url);
                          }}
                          className="opacity-60"
                        >
                          <it.icon className="h-4 w-4" />
                          {!collapsed && (
                            <span className="flex flex-1 items-center justify-between gap-2">
                              <span className="truncate">{it.title}</span>
                              <Lock className="h-3 w-3 shrink-0" />
                            </span>
                          )}
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton asChild isActive={active} tooltip={it.title}>
                          <Link to={it.url} className="flex items-center gap-2">
                            <it.icon className="h-4 w-4" />
                            {!collapsed && <span>{it.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <AccountFooter />
    </Sidebar>
  );
}

function AccountFooter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <div className="mt-auto border-t border-sidebar-border px-3 py-2 text-xs">
      {user ? (
        <button
          onClick={() => { void signOutAndReset({ queryClient, navigate }); }}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sidebar-foreground/80 hover:bg-sidebar-accent"
          title={user.email ?? ""}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="truncate">Terminar sessão</span>
        </button>
      ) : (
        <Link to="/auth" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sidebar-foreground/80 hover:bg-sidebar-accent">
          <LogIn className="h-3.5 w-3.5" />
          <span>Entrar / Registar</span>
        </Link>
      )}
    </div>
  );
}