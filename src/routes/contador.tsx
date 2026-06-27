import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contador")({
  head: () => ({ meta: [{ title: "Contador de Carreiras & Pontos" }] }),
  component: Page,
});

type SR = any;

function Page() {
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
    if (/\b(pr[oó]xima|carreira|avan[çc]ar)\b/.test(t)) return incC();
    if (/\b(voltar carreira|menos carreira)\b/.test(t)) return decC();
    if (/\b(voltar ponto|menos ponto)\b/.test(t)) return decP();
    if (/\b(ponto|mais um|contar)\b/.test(t)) return incP();
    if (/\b(zerar|reset|reiniciar)\b/.test(t)) return zerar();
    if (/\b(parar voz|desligar voz|parar)\b/.test(t)) return stopVoice();
  }, [incC, decC, incP, decP, zerar, stopVoice]);

  const startVoice = useCallback(async () => {
    const SRC = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRC) { toast.error("Reconhecimento de voz não suportado neste navegador"); return; }
    try {
      const rec = new SRC();
      rec.lang = "pt-PT";
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
      toast.success("Modo mãos-livres ativo");
    } catch {
      toast.error("Não foi possível iniciar o microfone");
    }
  }, [handleTranscript, stopVoice]);

  useEffect(() => () => stopVoice(), [stopVoice]);

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
            aria-label={voiceOn ? "Desativar modo mãos-livres" : "Ativar modo mãos-livres por voz"}
            className={`h-14 px-6 text-base ${voiceOn ? "bg-emerald-600 hover:bg-emerald-700 ring-4 ring-emerald-300 animate-pulse" : ""}`}
          >
            {voiceOn ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
            {voiceOn ? "Desativar Modo Mãos-Livres" : "Ativar Modo Mãos-Livres (Voz)"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Comandos: <strong>"Ponto"</strong> para somar pontos | <strong>"Próxima"</strong> para mudar de carreira
          </p>
          <p className="text-center text-[11px] text-muted-foreground">
            Também: "Voltar ponto", "Voltar carreira", "Zerar", "Parar voz"
          </p>
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