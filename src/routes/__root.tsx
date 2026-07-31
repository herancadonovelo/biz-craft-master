import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import sewingIcon from "@/assets/yarn-menu-icon.png.asset.json";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { AutoTranslator } from "@/components/AutoTranslator";
import { WellnessTimer } from "@/components/WellnessTimer";
import { AuthProvider } from "@/lib/auth-state";
import { useAuth } from "@/lib/auth-state";
import { SupabaseSync } from "@/components/SupabaseSync";
import { AuthBanner } from "@/components/AuthBanner";
import { SubscriptionProvider } from "@/lib/subscription";
import { PaywallDialog } from "@/components/PaywallDialog";
import { PreviewModeBanner } from "@/components/PreviewModeBanner";
import { PreviewExitFab } from "@/components/PreviewExitFab";
import { SplashScreen } from "@/components/SplashScreen";
import { AtelierSoundsProvider } from "@/lib/atelier-sounds";
import { DailyInspirationNotifier } from "@/components/DailyInspirationNotifier";
import { RouteAccessGuard } from "@/components/RouteAccessGuard";
import { UpgradeRedirectWatcher } from "@/components/UpgradeRedirectWatcher";
import { AuthGate } from "@/components/AuthGate";
import { WebhookPoller } from "@/components/WebhookPoller";
import { InitialLanguagePicker } from "@/components/InitialLanguagePicker";
import { ScrollUnlockWatcher } from "@/lib/scroll-unlock";
import { assertAccessControlOnce } from "@/lib/access-control-check";

if (typeof window !== "undefined") {
  assertAccessControlOnce();
}

// WebhookPoller removed — the pending endpoint it polled was an
// unauthenticated global queue that leaked events across merchants.

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Craft Business Master — Gestão para negócios de artesanato" },
      { name: "description", content: "Gestão completa para ateliers de artesanato: stock, encomendas, custos, preços, faturação e editores técnicos." },
      { name: "author", content: "Art Fusion" },
      { property: "og:site_name", content: "Craft Business Master" },
      { property: "og:title", content: "Craft Business Master — Gestão para negócios de artesanato" },
      { property: "og:description", content: "Gestão completa para ateliers de artesanato: stock, encomendas, custos, preços, faturação e editores técnicos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Craft Business Master — Gestão para negócios de artesanato" },
      { name: "twitter:description", content: "Gestão completa para ateliers de artesanato: stock, encomendas, custos, preços, faturação e editores técnicos." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Craft Business Master",
              url: "https://craftbusinessmaster.com",
              description:
                "Aplicação de gestão para negócios de artesanato: encomendas, stock, custos, preços e faturação.",
              email: "craftbusinessmaster@gmail.com",
            },
            {
              "@type": "WebSite",
              name: "Craft Business Master",
              url: "https://craftbusinessmaster.com",
              inLanguage: "pt-PT",
            },
          ],
        }),
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700&family=Caveat:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Merriweather:wght@300;400;700&family=Lora:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700&family=Oswald:wght@300;400;500;600;700&family=Bebas+Neue&family=Dancing+Script:wght@400;500;600;700&family=Pacifico&family=Great+Vibes&family=Josefin+Sans:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Marca o documento antes da hidratação: se o splash já correu nesta
            sessão, o ecrã inicial não pisca em recargas técnicas nem ao abrir
            um atalho diretamente pelo URL. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('cbm-splash-done')==='1')document.documentElement.setAttribute('data-splash-done','1')}catch(e){}",
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const design = useStore((s) => s.design);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", design.modo === "dark");
    const accentRaw = design.accent ?? "0.7 0.15 258";
    const accent = `oklch(${accentRaw})`;
    // Determine readable foreground based on luminance (first oklch component)
    const lum = Number(accentRaw.split(/\s+/)[0]) || 0.7;
    const fg = lum > 0.6 ? "oklch(0.18 0.03 258)" : "oklch(0.985 0.003 247)";
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-foreground", fg);
    root.style.setProperty("--primary", accent);
    root.style.setProperty("--primary-foreground", fg);
    root.style.setProperty("--ring", accent);
    root.style.setProperty("--sidebar-primary", accent);
    root.style.setProperty("--sidebar-primary-foreground", fg);
    root.style.setProperty("--sidebar-ring", accent);
    root.style.setProperty("--radius", `${design.raio ?? 0.5}rem`);
    // Sidebar background + contrasting tokens
    // Se o utilizador definiu L/C/H personalizado, gera oklch a partir daí
    const sb = (design.sidebarL != null || design.sidebarC != null || design.sidebarH != null)
      ? `${(design.sidebarL ?? 0.25).toFixed(3)} ${(design.sidebarC ?? 0.025).toFixed(3)} ${(design.sidebarH ?? 258).toFixed(1)}`
      : (design.sidebarBg || "0.25 0.025 258");
    const sbLum = Number(sb.split(/\s+/)[0]) || 0.25;
    const sbFg = sbLum > 0.6 ? "oklch(0.18 0.03 258)" : "oklch(0.98 0.005 252)";
    const contrast = design.sidebarContraste ?? 1;
    const parts = sb.split(/\s+/);
    const sbH = Number(parts[2]) || 258;
    const sbC = Number(parts[1]) || 0.03;
    const sbAccent = sbLum > 0.6
      ? `oklch(${Math.max(0.05, sbLum - 0.1 * contrast).toFixed(3)} ${sbC} ${sbH})`
      : `oklch(${Math.min(0.95, sbLum + 0.08 * contrast).toFixed(3)} ${sbC} ${sbH})`;
    const sbBorder = sbLum > 0.6
      ? `oklch(${Math.max(0.05, sbLum - 0.15 * contrast).toFixed(3)} ${sbC} ${sbH})`
      : `oklch(${Math.min(0.95, sbLum + 0.12 * contrast).toFixed(3)} ${sbC} ${sbH})`;
    root.style.setProperty("--sidebar", `oklch(${sb})`);
    root.style.setProperty("--sidebar-foreground", sbFg);
    root.style.setProperty("--sidebar-accent", sbAccent);
    root.style.setProperty("--sidebar-accent-foreground", sbFg);
    root.style.setProperty("--sidebar-border", sbBorder);
    // Tipografia e cores personalizáveis
    if (design.fonteTitulos) root.style.setProperty("--font-display", design.fonteTitulos);
    if (design.fonteCabecalho) root.style.setProperty("--page-header-font", design.fonteCabecalho);
    else root.style.removeProperty("--page-header-font");
    if (design.fonteTexto) root.style.setProperty("--font-sans", design.fonteTexto);
    if (design.fonteMenu) root.style.setProperty("--font-sidebar", design.fonteMenu); else root.style.removeProperty("--font-sidebar");
    if (design.fonteAbas) root.style.setProperty("--font-tabs", design.fonteAbas); else root.style.removeProperty("--font-tabs");
    const setOrClear = (k: string, v?: string) => v ? root.style.setProperty(k, v) : root.style.removeProperty(k);
    setOrClear("--heading-color", design.corTitulos);
    setOrClear("--text-color", design.corTexto);
    setOrClear("--menu-color", design.corMenu);
    setOrClear("--menu-active-bg", design.corMenuAtivo);
    setOrClear("--menu-active-fg", design.corMenuAtivoTexto);
    setOrClear("--tabs-color", design.corAbas);
    setOrClear("--tabs-active-color", design.corAbaAtiva);
    // Cores adicionais (qualquer elemento)
    setOrClear("--background", design.corFundo);
    setOrClear("--card", design.corCard);
    setOrClear("--popover", design.corCard);
    setOrClear("--border", design.corBorda);
    setOrClear("--input", design.corBorda);
    setOrClear("--muted", design.corMuted);
    setOrClear("--alert-bg", design.corAlertaFundo);
    setOrClear("--alert-fg", design.corAlertaTexto);
    if (design.corBotao) {
      root.style.setProperty("--primary", design.corBotao);
      root.style.setProperty("--ring", design.corBotao);
    }
    if (design.corBotaoTexto) root.style.setProperty("--primary-foreground", design.corBotaoTexto);
    setOrClear("--secondary", design.corBotaoSecundario);
    setOrClear("--secondary-foreground", design.corBotaoSecundarioTexto);
    setOrClear("--outline-bg", design.corBotaoOutline);
    setOrClear("--outline-fg", design.corBotaoOutlineTexto);
    // Opacidade das janelas com contorno (inputs/cards/textareas)
    const alpha = design.janelasOpacidade ?? 1;
    if (alpha !== 1) {
      root.style.setProperty("--window-alpha", String(alpha));
      root.classList.add("has-window-alpha");
    } else {
      root.style.removeProperty("--window-alpha");
      root.classList.remove("has-window-alpha");
    }
    root.classList.toggle("has-outline-color", !!design.corBotaoOutline);
    // Opacidade dos botões (primário, secundário, outline)
    const btnP = design.botaoPrimarioOpacidade ?? 1;
    const btnS = design.botaoSecundarioOpacidade ?? 1;
    const btnO = design.botaoOutlineOpacidade ?? 1;
    root.style.setProperty("--btn-primary-alpha", String(btnP));
    root.style.setProperty("--btn-secondary-alpha", String(btnS));
    root.style.setProperty("--btn-outline-alpha", String(btnO));
    root.classList.toggle("has-btn-alpha", btnP !== 1 || btnS !== 1 || btnO !== 1);
    setOrClear("--app-header-bg", design.corCabecalhoFundo);
    setOrClear("--app-header-fg", design.corCabecalhoIcone);
    // Tamanhos de letra
    const fsBase = design.fontSizeBase ?? 16;
    root.style.setProperty("font-size", `${fsBase}px`);
    setOrClear("--font-size-title", design.fontSizeTitulos ? `${design.fontSizeTitulos}px` : undefined);
    setOrClear("--font-size-text", design.fontSizeTexto ? `${design.fontSizeTexto}px` : undefined);
    setOrClear("--font-size-menu", design.fontSizeMenu ? `${design.fontSizeMenu}px` : undefined);
    setOrClear("--font-size-tabs", design.fontSizeAbas ? `${design.fontSizeAbas}px` : undefined);
    // Imagem de fundo
    if (design.imagemFundo) {
      root.style.setProperty("--app-bg-image", `url("${design.imagemFundo}")`);
      root.style.setProperty("--app-bg-overlay", String(design.fundoOpacidade ?? 0.85));
    } else {
      root.style.removeProperty("--app-bg-image");
      root.style.removeProperty("--app-bg-overlay");
    }
  }, [design]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <SubscriptionProvider>
      <AtelierSoundsProvider>
        <AppShell design={design} />
        <Toaster richColors position="top-right" />
        {/* WebhookPoller removed: the /api/public/webhooks/pending endpoint
            served a global cross-tenant queue and has been disabled. */}
        <AutoTranslator />
        <WellnessTimer />
        <SupabaseSync />
        <PaywallDialog />
        <RouteAccessGuard />
        <UpgradeRedirectWatcher />
        <PreviewExitFab />
        <SplashScreen />
        <DailyInspirationNotifier />
        <AuthGate />
        <WebhookPoller />
        <InitialLanguagePicker />
        <ScrollUnlockWatcher />
      </AtelierSoundsProvider>
      </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const PUBLIC_ROUTES_SET = new Set(["/auth", "/auth/verify-2fa", "/auth-callback", "/sessao-expirada", "/reset-password", "/registo"]);

function AppShell({ design }: { design: ReturnType<typeof useStore.getState>["design"] }) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isPublic = PUBLIC_ROUTES_SET.has(pathname);

  // Sem sessão numa rota pública (auth, callback, sessão expirada) → apenas o Outlet centrado, sem menu lateral.
  if (!user && (isPublic || !loading)) {
    return (
      <div className="flex min-h-screen w-full items-start justify-center bg-background px-4 py-8">
        <div className="w-full max-w-[560px]">
          <Outlet />
        </div>
      </div>
    );
  }

  // Enquanto a sessão carrega numa rota privada, o AuthGate já mostra overlay.
  // Não renderizamos a sidebar nesse intervalo para evitar flash de conteúdos protegidos.
  if (!user) {
    return <div className="min-h-screen w-full bg-background" />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AuthBanner />
          <PreviewModeBanner />
          <header
            className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border px-4 backdrop-blur"
            style={{
              background: "var(--app-header-bg, rgba(255,255,255,0.6))",
              color: "var(--app-header-fg, inherit)",
            }}
          >
            <SewingMenuTrigger />
            <RootSubtitle />
          </header>
          <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8" data-app-bg={design.imagemFundo ? "on" : "off"}>
            {/* Desktop mirrors the mobile column layout: a single centered
                content lane keeps cards and tabs contained without stray
                floating text on wide viewports. */}
            <div className="mx-auto w-full max-w-[720px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function RootSubtitle() {
  const nome = useStore((s) => s.design.nomeNegocio);
  const t = useT();
  return (
    <span className="font-display text-sm font-medium text-muted-foreground">
      {nome} · {t("app.subtitle")}
    </span>
  );
}

function SewingMenuTrigger() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Abrir menu lateral"
      className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent/40 transition"
    >
      <img
        src={sewingIcon.url}
        alt=""
        className="h-[2.73rem] w-[2.73rem] object-contain -scale-x-100"
        draggable={false}
      />
    </button>
  );
}
