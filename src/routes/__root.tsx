import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { AutoTranslator } from "@/components/AutoTranslator";
import { WellnessTimer } from "@/components/WellnessTimer";
import { AuthProvider } from "@/lib/auth-state";
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

function WebhookPoller() {
  const processarEtsy = useStore((s) => s.processarWebhookEtsy);
  const processarWa = useStore((s) => s.processarWebhookWhatsapp);
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/public/webhooks/pending");
        if (!r.ok) return;
        const { events } = await r.json();
        for (const ev of events || []) {
          if (ev.provider === "etsy") {
            processarEtsy({
              id: ev.id,
              listingId: String(ev.payload.listing_id || ev.payload.listingId || ev.payload.listing || ""),
              quantidade: Number(ev.payload.quantity || 1),
              variacao: ev.payload.variation || ev.payload.variacao,
              clienteNome: ev.payload.buyer_name || ev.payload.buyerName,
              clienteEmail: ev.payload.buyer_email || ev.payload.buyerEmail,
              descricao: ev.payload.title || ev.payload.description,
              valor: Number(ev.payload.price || ev.payload.total || 0),
            });
          } else if (ev.provider === "whatsapp") {
            processarWa({
              id: ev.id,
              telefone: ev.payload.telefone,
              texto: ev.payload.texto,
              nome: ev.payload?.contacts?.[0]?.profile?.name,
            });
          }
        }
      } catch {}
    };
    const id = window.setInterval(() => { if (!stop) tick(); }, 15000);
    tick();
    return () => { stop = true; window.clearInterval(id); };
  }, [processarEtsy, processarWa]);
  return null;
}

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
      { title: "Lovable App" },
      { name: "description", content: "Craft Business Master is a comprehensive business management application for craft businesses." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Craft Business Master is a comprehensive business management application for craft businesses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "twitter:description", content: "Craft Business Master is a comprehensive business management application for craft businesses." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d380e9c2-1501-4e32-961c-d3f6930ff6db/id-preview-015b7e4a--4b0fb865-7bd5-4342-bb12-dd95f303fcc3.lovable.app-1781199051503.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d380e9c2-1501-4e32-961c-d3f6930ff6db/id-preview-015b7e4a--4b0fb865-7bd5-4342-bb12-dd95f303fcc3.lovable.app-1781199051503.png" },
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
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700&family=Caveat:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap",
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
    const accent = `oklch(${design.accent})`;
    // Determine readable foreground based on luminance (first oklch component)
    const lum = Number(design.accent.split(/\s+/)[0]) || 0.7;
    const fg = lum > 0.6 ? "oklch(0.18 0.03 258)" : "oklch(0.985 0.003 247)";
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-foreground", fg);
    root.style.setProperty("--primary", accent);
    root.style.setProperty("--primary-foreground", fg);
    root.style.setProperty("--ring", accent);
    root.style.setProperty("--sidebar-primary", accent);
    root.style.setProperty("--sidebar-primary-foreground", fg);
    root.style.setProperty("--sidebar-ring", accent);
    root.style.setProperty("--radius", `${design.raio}rem`);
    // Sidebar background + contrasting tokens
    const sb = design.sidebarBg || "0.25 0.025 258";
    const sbLum = Number(sb.split(/\s+/)[0]) || 0.25;
    const sbFg = sbLum > 0.6 ? "oklch(0.18 0.03 258)" : "oklch(0.98 0.005 252)";
    const sbAccent = sbLum > 0.6
      ? `oklch(${Math.max(0.05, sbLum - 0.1).toFixed(3)} 0.03 258)`
      : `oklch(${Math.min(0.95, sbLum + 0.08).toFixed(3)} 0.03 258)`;
    const sbBorder = sbLum > 0.6
      ? `oklch(${Math.max(0.05, sbLum - 0.15).toFixed(3)} 0.03 258)`
      : `oklch(${Math.min(0.95, sbLum + 0.12).toFixed(3)} 0.03 258)`;
    root.style.setProperty("--sidebar", `oklch(${sb})`);
    root.style.setProperty("--sidebar-foreground", sbFg);
    root.style.setProperty("--sidebar-accent", sbAccent);
    root.style.setProperty("--sidebar-accent-foreground", sbFg);
    root.style.setProperty("--sidebar-border", sbBorder);
    // Tipografia e cores personalizáveis
    if (design.fonteTitulos) root.style.setProperty("--font-display", design.fonteTitulos);
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
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <AuthBanner />
            <PreviewModeBanner />
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
              <SidebarTrigger />
              <RootSubtitle />
            </header>
            <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8" data-app-bg={design.imagemFundo ? "on" : "off"}>
              <Outlet />
            </main>
          </div>
        </div>
        <Toaster richColors position="top-right" />
        <WebhookPoller />
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
      </SidebarProvider>
      </AtelierSoundsProvider>
      </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
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
