import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useStore, type Idioma } from "@/lib/store";

export const Route = createFileRoute("/contador")({
  head: () => ({ meta: [{ title: "Contador de Carreiras & Pontos" }] }),
  component: Page,
});

type SR = any;

const VOICE_CONFIG: Record<Idioma, {
  lang: string;
  incC: RegExp; decC: RegExp;
  incP: RegExp; decP: RegExp;
  reset: RegExp; stop: RegExp;
  hint: string; hint2: string;
  activate: string; deactivate: string; active: string;
}> = {
  pt: {
    lang: "pt-PT",
    incC: /\b(pr[oó]xima|carreira|avan[çc]ar)\b/,
    decC: /\b(voltar carreira|menos carreira)\b/,
    incP: /\b(ponto|mais um|contar)\b/,
    decP: /\b(voltar ponto|menos ponto)\b/,
    reset: /\b(zerar|reset|reiniciar)\b/,
    stop: /\b(parar voz|desligar voz|parar)\b/,
    hint: 'Comandos: "Ponto" para somar pontos | "Próxima" para mudar de carreira',
    hint2: 'Também: "Voltar ponto", "Voltar carreira", "Zerar", "Parar voz"',
    activate: "Ativar Modo Mãos-Livres (Voz)",
    deactivate: "Desativar Modo Mãos-Livres",
    active: "Modo mãos-livres ativo",
  },
  en: {
    lang: "en-US",
    incC: /\b(next|row|advance)\b/,
    decC: /\b(back row|previous row|minus row)\b/,
    incP: /\b(stitch|point|count|plus one)\b/,
    decP: /\b(back stitch|minus stitch|back point)\b/,
    reset: /\b(reset|zero|restart)\b/,
    stop: /\b(stop voice|stop listening|stop)\b/,
    hint: 'Commands: "Stitch" to add stitches | "Next" to change row',
    hint2: 'Also: "Back stitch", "Back row", "Reset", "Stop voice"',
    activate: "Enable Hands-Free Mode (Voice)",
    deactivate: "Disable Hands-Free Mode",
    active: "Hands-free mode active",
  },
  es: {
    lang: "es-ES",
    incC: /\b(siguiente|vuelta|avanzar|hilera)\b/,
    decC: /\b(volver vuelta|menos vuelta)\b/,
    incP: /\b(punto|m[aá]s uno|contar)\b/,
    decP: /\b(volver punto|menos punto)\b/,
    reset: /\b(reiniciar|cero|reset)\b/,
    stop: /\b(parar voz|detener|parar)\b/,
    hint: 'Comandos: "Punto" para sumar puntos | "Siguiente" para cambiar de vuelta',
    hint2: 'También: "Volver punto", "Volver vuelta", "Reiniciar", "Parar voz"',
    activate: "Activar Modo Manos Libres (Voz)",
    deactivate: "Desactivar Modo Manos Libres",
    active: "Modo manos libres activo",
  },
  fr: {
    lang: "fr-FR",
    incC: /\b(suivant|suivante|rang|avancer)\b/,
    decC: /\b(rang pr[eé]c[eé]dent|moins rang)\b/,
    incP: /\b(point|plus un|compter)\b/,
    decP: /\b(retour point|moins point)\b/,
    reset: /\b(r[eé]initialiser|z[eé]ro|reset)\b/,
    stop: /\b(arr[eê]ter voix|arr[eê]ter|stop)\b/,
    hint: 'Commandes : "Point" pour ajouter | "Suivant" pour changer de rang',
    hint2: 'Aussi : "Retour point", "Rang précédent", "Réinitialiser", "Arrêter"',
    activate: "Activer le mode mains libres (voix)",
    deactivate: "Désactiver le mode mains libres",
    active: "Mode mains libres actif",
  },
  de: {
    lang: "de-DE",
    incC: /\b(n[aä]chste|reihe|weiter)\b/,
    decC: /\b(reihe zur[uü]ck|minus reihe)\b/,
    incP: /\b(masche|punkt|plus eins|z[aä]hlen)\b/,
    decP: /\b(masche zur[uü]ck|minus masche)\b/,
    reset: /\b(zur[uü]cksetzen|null|reset)\b/,
    stop: /\b(stimme stopp|stopp|anhalten)\b/,
    hint: 'Befehle: "Masche" zum Zählen | "Nächste" für neue Reihe',
    hint2: 'Auch: "Masche zurück", "Reihe zurück", "Zurücksetzen", "Stopp"',
    activate: "Freisprechmodus aktivieren (Sprache)",
    deactivate: "Freisprechmodus deaktivieren",
    active: "Freisprechmodus aktiv",
  },
  it: {
    lang: "it-IT",
    incC: /\b(prossima|giro|ferro|avanti)\b/,
    decC: /\b(giro indietro|meno giro)\b/,
    incP: /\b(punto|pi[uù] uno|contare)\b/,
    decP: /\b(punto indietro|meno punto)\b/,
    reset: /\b(azzerare|reset|ricomincia)\b/,
    stop: /\b(ferma voce|ferma|stop)\b/,
    hint: 'Comandi: "Punto" per aggiungere | "Prossima" per cambiare giro',
    hint2: 'Anche: "Punto indietro", "Giro indietro", "Azzerare", "Ferma voce"',
    activate: "Attiva modalità vivavoce (voce)",
    deactivate: "Disattiva modalità vivavoce",
    active: "Modalità vivavoce attiva",
  },
};

function Page() {
  const idioma = useStore((s) => s.design.idioma);
  const cfg = VOICE_CONFIG[idioma] || VOICE_CONFIG.pt;
  const [carreiras, setCarreiras] = useState(0);
  const [pontos, setPontos] = useState(0);
  const [voiceOn, setVoiceOn] = useState(false);
  const [pulseC, setPulseC] = useState(0);
  const [pulseP, setPulseP] = useState(0);
  const recRef = useRef<SR | null>(null);
  const wakeRef = useRef<any>(null);

  const flashC = () => setPulseC((n) => n + 1);
  const flashP = () => setPulseP((n) => n + 1);

  const incC = useCallback(() => { setCarreiras((v) => v + 1); setPontos(0); flashC(); flashP(); }, []);
  const decC = useCallback(() => { setCarreiras((v) => Math.max(0, v - 1)); flashC(); }, []);
  const incP = useCallback(() => { setPontos((v) => v + 1); flashP(); }, []);
  const decP = useCallback(() => { setPontos((v) => Math.max(0, v - 1)); flashP(); }, []);
  const zerar = useCallback(() => { setCarreiras(0); setPontos(0); flashC(); flashP(); }, []);

  const stopVoice = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    if (wakeRef.current) { try { wakeRef.current.release?.(); } catch {} wakeRef.current = null; }
    setVoiceOn(false);
  }, []);

  const handleTranscript = useCallback((raw: string) => {
    const t = raw.toLowerCase().trim();
    if (cfg.decC.test(t)) return decC();
    if (cfg.incC.test(t)) return incC();
    if (cfg.decP.test(t)) return decP();
    if (cfg.incP.test(t)) return incP();
    if (cfg.reset.test(t)) return zerar();
    if (cfg.stop.test(t)) return stopVoice();
  }, [cfg, incC, decC, incP, decP, zerar, stopVoice]);

  const startVoice = useCallback(async () => {
    const SRC = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRC) { toast.error("Reconhecimento de voz não suportado neste navegador"); return; }
    try {
      const rec = new SRC();
      rec.lang = cfg.lang;
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) handleTranscript(e.results[i][0].transcript || "");
        }
      };
      rec.onerror = (e: any) => { if (e.error === "not-allowed") { toast.error("Permissão de microfone negada"); stopVoice(); } };
      rec.onend = () => { if (recRef.current === rec) { try { rec.start(); } catch {} } };
      rec.start();
      recRef.current = rec;
      setVoiceOn(true);
      try {
        // @ts-ignore
        wakeRef.current = await navigator.wakeLock?.request("screen");
      } catch {}
      toast.success(cfg.active);
    } catch {
      toast.error("Não foi possível iniciar o microfone");
    }
  }, [handleTranscript, stopVoice, cfg]);

  useEffect(() => () => stopVoice(), [stopVoice]);

  // Restart recognition when language changes mid-session
  useEffect(() => {
    if (voiceOn) {
      stopVoice();
      setTimeout(() => startVoice(), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idioma]);

  return (
    <div className="space-y-6">
      <PageHeader title="Contador de Carreiras & Pontos" description="Gere carreiras e pontos em simultâneo — toque ou voz." />

      <style>{`@keyframes cnt-pulse{0%{transform:scale(1);filter:brightness(1)}40%{transform:scale(1.12);filter:brightness(1.4)}100%{transform:scale(1);filter:brightness(1)}}.cnt-anim{animation:cnt-pulse .45s ease-out}`}</style>

      <div className="grid gap-4 md:grid-cols-2">
        <CounterBlock label="Carreiras" value={carreiras} pulseKey={pulseC} onInc={incC} onDec={decC} accent="bg-violet-500 hover:bg-violet-600" />
        <CounterBlock label="Pontos" value={pontos} pulseKey={pulseP} onInc={incP} onDec={decP} accent="bg-pink-500 hover:bg-pink-600" />
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-6">
          <Button
            size="lg"
            onClick={voiceOn ? stopVoice : startVoice}
            aria-label={voiceOn ? cfg.deactivate : cfg.activate}
            className={`h-14 px-6 text-base ${voiceOn ? "bg-emerald-600 hover:bg-emerald-700 ring-4 ring-emerald-300 animate-pulse" : ""}`}
          >
            {voiceOn ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
            {voiceOn ? cfg.deactivate : cfg.activate}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{cfg.hint}</p>
          <p className="text-center text-[11px] text-muted-foreground">{cfg.hint2}</p>
          <Button variant="outline" size="sm" onClick={zerar} className="mt-2">
            <RotateCcw className="mr-2 h-4 w-4" /> Zerar tudo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CounterBlock({ label, value, pulseKey, onInc, onDec, accent }: { label: string; value: number; pulseKey: number; onInc: () => void; onDec: () => void; accent: string }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="text-center text-xs font-display uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" variant="outline" onClick={onDec} aria-label={`Decrementar ${label}`} className="h-20 w-20 rounded-full text-3xl">
            <Minus className="h-8 w-8" />
          </Button>
          <div
            key={pulseKey}
            className="cnt-anim min-w-[7rem] text-center font-display text-7xl font-bold tabular-nums tracking-tight"
            aria-live="polite"
          >
            {String(value).padStart(2, "0")}
          </div>
          <Button size="lg" onClick={onInc} aria-label={`Incrementar ${label}`} className={`h-24 w-24 rounded-full text-white shadow-lg active:scale-95 ${accent}`}>
            <Plus className="h-10 w-10" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}