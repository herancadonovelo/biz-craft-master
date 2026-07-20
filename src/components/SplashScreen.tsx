import { useEffect, useState } from "react";
import logo from "@/assets/craft-business-master-splash.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { splashPhrases } from "@/lib/splash-phrases";
import { useStore } from "@/lib/store";
import { SIGN_OUT_REPLAY_EVENT } from "@/lib/sign-out";
const MAX_ATTEMPTS = 4;
const BASE_DELAY = 500; // ms — backoff: 500, 1000, 2000, 4000
const MIN_DURATION = 7000; // 7s
const MAX_DURATION = 10000; // 10s
const PHRASE_INTERVAL = 4000; // 4s
const FADE_DURATION = 900; // ms — fade in/out das frases
const E2E_PLAN_OVERRIDE_KEY = "atelier-e2e-plan-override";

const SPLASH_STRINGS: Record<string, {
  loadingAria: string;
  retrying: (i: number, n: number) => string;
  errorTitle: string;
  errorAttempts: (n: number, msg?: string) => string;
  retryBtn: string;
  copyright: string;
}> = {
  pt: {
    loadingAria: "A carregar",
    retrying: (i, n) => `A tentar novamente… (${i}/${n})`,
    errorTitle: "Ups, algo correu mal",
    errorAttempts: (n, msg) => msg
      ? `Não foi possível iniciar a aplicação após ${n} tentativas: ${msg}`
      : `Não foi possível iniciar a aplicação após ${n} tentativas. Verifica a tua ligação e tenta novamente.`,
    retryBtn: "Tentar novamente",
    copyright: "© 2026 Craft Business Master. Todos os direitos reservados a Art Fusion.",
  },
  en: {
    loadingAria: "Loading",
    retrying: (i, n) => `Retrying… (${i}/${n})`,
    errorTitle: "Oops, something went wrong",
    errorAttempts: (n, msg) => msg
      ? `Could not start the app after ${n} attempts: ${msg}`
      : `Could not start the app after ${n} attempts. Check your connection and try again.`,
    retryBtn: "Try again",
    copyright: "© 2026 Craft Business Master. All rights reserved to Art Fusion.",
  },
};

function stringsFor(idioma: string) {
  return SPLASH_STRINGS[idioma] ?? SPLASH_STRINGS.en;
}

function canOpenWithoutSession(pathname: string) {
  if (pathname.startsWith("/auth") || pathname.startsWith("/sessao-expirada")) return true;
  if (pathname === "/reset-password") return true;
  if (import.meta.env.DEV && typeof window !== "undefined" && window.localStorage.getItem(E2E_PLAN_OVERRIDE_KEY)) return true;
  return false;
}

const loadingPhrases = [
  "Recortando o tecido para costurar...",
  "Enfiando a linha na agulha de coser...",
  "Organizando novelos de várias cores...",
  "Procurando o tamanho ideal de agulha para o projeto...",
  "Ajustando a tensão do fio no tricotin...",
  "Contando os pontos do amigurumi...",
  "Contornando o risco do bordado livre...",
  "A moldar o arame para o próximo tricotin...",
  "Preparando a meada de ponto cruz...",
  "Enchendo o amigurumi com amor e fibra...",
  "Desenhando as curvas do molde de costura...",
  "Contando cruzinhas no tecido Aida...",
  "Passando o risco do desenho para o linho...",
  "A aquecer as mãos para tricotar...",
  "Escolhendo a palete de cores perfeita...",
  "Enchendo a bobine com a linha de costura...",
  "Desfazendo um nó cego no novelo...",
  "Terminando a última carreira do projeto...",
  "Preparando o bastidor para começar a bordar...",
  "Alinhando o viés na borda do tecido...",
  "A fechar os pontos invisíveis do amigurumi...",
  "Calculando os centímetros de arame necessários...",
  "Esboçando uma nova receita de crochê...",
  "Organizando a caixinha de meadas por códigos...",
  "Ajustando o ponto da máquina de costura...",
  "Nivelando a pauta de caligrafia para o tricotin...",
  "Verificando os códigos DMC no stock...",
  "Dando o nó final para prender o bordado...",
  "Esticando o tecido para ficar bem firme...",
  "Criando magia com linhas, fios e agulhas...",
  "Escondendo a ponta do fio para o acabamento perfeito...",
  "Dando vida ao desenho através do ponto cruz...",
  "Alfinetando o molde ao tecido com precisão...",
  "A desenrolar o cordão de tricotin com cuidado...",
  "Escolhendo o melhor ponto de bordado para as folhas...",
  "A colocar os olhos de segurança no amigurumi...",
  "Desenrolando o arame galvanizado para o molde...",
  "Suavizando as curvas da letra cursiva no tricotin...",
  "A calcular a quantidade de meadas para o gráfico...",
  "Encaixando o tecido no bastidor de madeira...",
  "Passando a ferro o tecido para tirar os vincos...",
  "A dar o nó francês com toda a paciência...",
  "Pintando o gráfico com pontos e linhas...",
  "Verificando se a tensão do ponto de crochê está certa...",
  "Costurando a etiqueta da marca na peça final...",
  "A alinhar as réguas de alfaiate na mesa de corte...",
  "Cortando as sobrinhas de linha com a tesoura de garça...",
  "Medindo o contorno com a fita métrica digital...",
  "A tecer memórias com cada ponto e carreira...",
  "Preparando a encomenda com projetos finalizados...",
];

// Validação em tempo de carga: garantir exatamente 50 frases válidas (sem
// quebras inesperadas / vírgulas em falta que resultariam em strings vazias
// ou concatenadas). Lança em dev para apanhar regressões cedo.
// Sanidade: cada banco de frases (PT base + traduções) deve ter exatamente 50.
const expectedCount = loadingPhrases.length;
if (expectedCount !== 50) {
  const msg = `loadingPhrases deve conter exatamente 50 frases (atual: ${expectedCount}).`;
  if (import.meta.env.DEV) throw new Error(msg);
  // eslint-disable-next-line no-console
  else console.warn(msg);
}
for (const [lang, arr] of Object.entries(splashPhrases)) {
  if (arr.length !== 50) {
    const msg = `splashPhrases[${lang}] deve ter 50 frases (atual: ${arr.length}).`;
    if (import.meta.env.DEV) throw new Error(msg);
    // eslint-disable-next-line no-console
    else console.warn(msg);
  }
}
{
  const bad = loadingPhrases.findIndex(
    (p) => typeof p !== "string" || p.trim().length === 0 || !p.includes("..."),
  );
  if (bad !== -1) {
    const msg = `loadingPhrases[${bad}] inválida — possível vírgula em falta ou quebra inesperada.`;
    if (import.meta.env.DEV) throw new Error(msg);
    // eslint-disable-next-line no-console
    else console.warn(msg);
  }
}

const pickPhrase = (list: string[], prev?: string) => {
  let p = list[Math.floor(Math.random() * list.length)];
  if (prev && list.length > 1) {
    let guard = 0;
    while (p === prev && guard++ < 5) {
      p = list[Math.floor(Math.random() * list.length)];
    }
  }
  return p;
};

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [runToken, setRunToken] = useState(0);
  const [fading, setFading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const idioma = useStore((s) => s.design.idioma);
  const phrases = splashPhrases[idioma] ?? loadingPhrases;
  const str = stringsFor(idioma);
  // Inicial determinístico para evitar mismatch de hidratação SSR/cliente.
  // A aleatorização arranca apenas depois do mount, no intervalo abaixo.
  const [phrase, setPhrase] = useState<string>(phrases[0]);
  const [phraseVisible, setPhraseVisible] = useState(true);
  const [progress, setProgress] = useState(0); // 0..1
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  // Replay splash after logout so the transition mirrors the initial boot.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onReplay = () => {
      setError(null);
      setAttempt(0);
      setProgress(0);
      setFading(false);
      setVisible(true);
      setRunToken((v) => v + 1);
    };
    window.addEventListener(SIGN_OUT_REPLAY_EVENT, onReplay);
    return () => window.removeEventListener(SIGN_OUT_REPLAY_EVENT, onReplay);
  }, []);

  // Rotating phrases with fade in/out
  useEffect(() => {
    // Primeira troca aleatória imediata após mount (já no cliente).
    setPhraseVisible(false);
    const kick = window.setTimeout(() => {
      setPhrase((prev) => pickPhrase(phrases, prev));
      setPhraseVisible(true);
    }, FADE_DURATION);
    const id = window.setInterval(() => {
      setPhraseVisible(false);
      window.setTimeout(() => {
        setPhrase((prev) => pickPhrase(phrases, prev));
        setPhraseVisible(true);
      }, FADE_DURATION);
    }, PHRASE_INTERVAL);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phrases]);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    // Progress ticker (capped at MAX_DURATION)
    const progressId = window.setInterval(() => {
      const e = Date.now() - start;
      setProgress(Math.min(1, e / MAX_DURATION));
    }, 100);

    const finish = (user: { id: string } | null) => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_DURATION - elapsed);
      window.setTimeout(() => {
        if (cancelled) return;
        setProgress(1);
        // Redirect to /auth only on routes that truly require a signed-in user.
        if (!user && !canOpenWithoutSession(currentPath)) {
          navigate({ to: "/auth", replace: true });
        }
        setFading(true);
        window.setTimeout(() => !cancelled && setVisible(false), 700);
      }, wait);
    };

    // Hard cap: never exceed MAX_DURATION
    const maxTimer = window.setTimeout(() => {
      if (cancelled) return;
      if (!error) {
        setProgress(1);
        setFading(true);
        window.setTimeout(() => !cancelled && setVisible(false), 700);
      }
    }, MAX_DURATION);

    const sleep = (ms: number) =>
      new Promise<void>((res) => window.setTimeout(res, ms));

    (async () => {
      let lastErr: any = null;
      for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        if (cancelled) return;
        setAttempt(i);
        try {
          const { data, error: authErr } = await supabase.auth.getSession();
          if (authErr) throw authErr;
          if (cancelled) return;
          finish(data.session?.user ? { id: data.session.user.id } : null);
          return;
        } catch (e) {
          lastErr = e;
          if (i < MAX_ATTEMPTS) {
            const delay = BASE_DELAY * Math.pow(2, i - 1); // exponential backoff
            await sleep(delay);
          }
        }
      }
      if (cancelled) return;
      const msg = (lastErr as any)?.message;
          setError(str.errorAttempts(MAX_ATTEMPTS, msg));
    })();

    return () => {
      cancelled = true;
      window.clearInterval(progressId);
      window.clearTimeout(maxTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runToken]);

  if (!visible) return null;

  const pct = Math.round(progress * 100);

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ease-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: "#F5EFE6" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 w-full">
        <img
          src={logo.url}
          alt="Craft Business Master"
          className="select-none animate-in fade-in zoom-in-95 duration-700 object-contain mx-auto w-[min(70vw,70vh,420px)] h-auto"
          draggable={false}
        />
        {!error ? (
          <>
            {/* Dynamic phrase */}
            <p
              className={`min-h-[2.5rem] max-w-[22rem] text-center text-base sm:text-lg font-medium text-[#5A4A63] transition-opacity duration-[900ms] ease-in-out ${
                phraseVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ fontFamily: '"Quicksand", "Nunito", "Comfortaa", system-ui, sans-serif' }}
            >
              {phrase}
            </p>

            {/* Yarn ball loading bar */}
            <div className="flex flex-col items-center gap-2 w-[min(80vw,320px)]">
              <div
                className="relative h-2 w-full overflow-visible rounded-full"
                style={{ backgroundColor: "rgba(212, 165, 165, 0.25)" }}
                role="progressbar"
                aria-label={str.loadingAria}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {/* filled trail (unwound yarn) */}
                <div
                  className="h-full rounded-full transition-[width] duration-200 ease-linear"
                  style={{
                    width: `${pct}%`,
                    backgroundImage:
                      "repeating-linear-gradient(90deg, #E8A5A5 0 6px, #D48A8A 6px 12px)",
                  }}
                />
                {/* pink yarn ball */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${pct}%` }}
                >
                  <div
                    className="relative h-6 w-6 rounded-full shadow-md animate-[yarn-roll_1.6s_linear_infinite]"
                    style={{
                      background:
                        "radial-gradient(circle at 35% 30%, #FFC4C4 0%, #F4A6A6 45%, #D88080 100%)",
                    }}
                  >
                    <span className="absolute inset-0 rounded-full opacity-60"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, transparent 0 3px, rgba(255,255,255,0.35) 3px 4px), repeating-linear-gradient(-45deg, transparent 0 3px, rgba(160,80,80,0.25) 3px 4px)",
                      }}
                    />
                  </div>
                </div>
              </div>
              {attempt > 1 && (
                <p className="text-[11px] text-[#6B5B73]/70">
                  {str.retrying(attempt, MAX_ATTEMPTS)}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-sm rounded-xl border border-foreground/10 bg-background/60 p-5 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Ups, algo correu mal</p>
            <p className="mt-1 text-xs text-foreground/70">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:opacity-90"
            >
              <RefreshCw className="h-3.5 w-3.5" /> {str.retryBtn}
            </button>
          </div>
        )}
      </div>
      <footer className="pb-[max(1.25rem,env(safe-area-inset-bottom))] px-6 text-center">
        <p className="font-display text-[11px] tracking-wide text-[#6B5B73]/70">
          {str.copyright}
        </p>
      </footer>
      <style>{`
        @keyframes yarn-roll {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}