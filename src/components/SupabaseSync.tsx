import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-state";
import { toast } from "sonner";
import { Cloud, CloudOff, HardDrive, Loader2 } from "lucide-react";
import { isPreviewActive, usePreviewMode } from "@/lib/preview-mode";

// Keys we sync (skip functions & ephemeral)
const PERSIST_KEYS = [
  "clientes","fornecedores","materiais","projetos","encomendas","horas","despesas",
  "faturas","vendas","todos","campanhas","caixa","cotacoes","contas","portfolio",
  "cursos","alunos","instagram","eventos","auditoria","etiquetas","perfilNegocio",
  "sincronizacao","design","whatsappTemplates","whatsappMensagens","notificacoes",
  "gatilhos","etsyConfig","etsyProdutos","ficheirosDigitais","catalogo","biblioteca",
  "traducoes","modulos","onboardingFeito","moodboards","notas","datasFestivas",
  "acoesMarketing","contadores","receitasEditor","personalDesignDefault",
] as const;

function pickState(s: any) {
  const out: any = {};
  for (const k of PERSIST_KEYS) out[k] = s[k];
  return out;
}

export function SupabaseSync() {
  const { user, loading } = useAuth();
  const preview = usePreviewMode();
  const [status, setStatus] = useState<"idle" | "syncing" | "synced" | "error" | "offline">("offline");
  const hydrated = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  // Pull on login
  useEffect(() => {
    if (loading || !user) { setStatus("offline"); hydrated.current = false; return; }
    if (preview) { setStatus("offline"); hydrated.current = false; return; }
    let cancelled = false;
    (async () => {
      setStatus("syncing");
      const { data, error } = await supabase
        .from("app_state")
        .select("state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setStatus("error");
        toast.error("Falha a carregar dados da conta", {
          description: `${error.message}${(error as any).hint ? ` — ${(error as any).hint}` : ""}${(error as any).code ? ` (código ${(error as any).code})` : ""}`,
          duration: 10000,
        });
        return;
      }
      if (data?.state && typeof data.state === "object") {
        useStore.setState(data.state as any);
        toast.success("Dados sincronizados da tua conta");
      } else {
        // First login: upload current local state
        const cur = pickState(useStore.getState());
        await supabase.from("app_state").upsert({ user_id: user.id, state: cur });
        toast.success("Conta criada — dados locais carregados na nuvem");
      }
      // Sincroniza o estado do onboarding a partir da tabela profiles.
      // A DB é a fonte de verdade — para o utilizador não voltar a ver a janela
      // de configuração inicial em novos dispositivos ou sessões.
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_concluido")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile && typeof (profile as any).onboarding_concluido === "boolean") {
        useStore.setState({ onboardingFeito: (profile as any).onboarding_concluido } as any);
      }
      hydrated.current = true;
      setStatus("synced");
    })();
    return () => { cancelled = true; };
  }, [user, loading, preview]);

  // Push on change (debounced)
  useEffect(() => {
    if (!user) return;
    if (preview) return;
    const unsub = useStore.subscribe((s) => {
      if (!hydrated.current) return;
      if (isPreviewActive()) return;
      window.clearTimeout(timer.current);
      setStatus("syncing");
      const snapshot = pickState(s);
      timer.current = window.setTimeout(async () => {
        if (isPreviewActive()) return;
        const { error } = await supabase
          .from("app_state")
          .upsert({ user_id: user.id, state: snapshot });
        if (error) {
          setStatus("error");
          const isAuthError = error.message?.toLowerCase().includes("jwt") || (error as any).code === "PGRST301";
          toast.error(
            isAuthError ? "Sessão expirada — inicia sessão novamente para gravar" : "Falha a guardar na nuvem",
            {
              description: `${error.message}${(error as any).hint ? ` — ${(error as any).hint}` : ""}${(error as any).code ? ` (código ${(error as any).code})` : ""}`,
              duration: 10000,
            },
          );
        } else setStatus("synced");
      }, 800);
    });
    return () => { unsub(); window.clearTimeout(timer.current); };
  }, [user, preview]);

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-2.5 py-1 text-xs shadow-sm backdrop-blur">
      {preview && <><Cloud className="h-3 w-3 text-amber-600" /> Preview (sync pausada)</>}
      {!preview && status === "syncing" && <><Loader2 className="h-3 w-3 animate-spin" /> A sincronizar…</>}
      {!preview && status === "synced" && (
        <>
          <Cloud className="h-3 w-3 text-emerald-600" />
          <HardDrive className="h-3 w-3 text-emerald-600" />
          Nuvem + Local
        </>
      )}
      {!preview && status === "error" && (
        <>
          <CloudOff className="h-3 w-3 text-rose-600" />
          <HardDrive className="h-3 w-3 text-emerald-600" />
          Só local (erro nuvem)
        </>
      )}
      {!preview && status === "offline" && (
        <>
          <HardDrive className="h-3 w-3 text-emerald-600" />
          Guardado no dispositivo
        </>
      )}
    </div>
  );
}