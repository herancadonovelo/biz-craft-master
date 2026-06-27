import { createFileRoute } from "@tanstack/react-router";
import { PremiumRoute } from "@/components/PremiumRoute";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, SkipForward, SkipBack, Volume2, Moon, X } from "lucide-react";
import { AMBIENT_LIST, MUSIC_TRACKS, useAtelierSounds, type AmbientKey } from "@/lib/atelier-sounds";
import { AudioVisualizer } from "@/components/AudioVisualizer";

export const Route = createFileRoute("/atelier-sounds")({
  head: () => ({ meta: [{ title: "Atelier Sounds & Foco" }] }),
  component: Page,
});

function Marquee({ text }: { text: string }) {
  const long = text.length > 28;
  return (
    <div className="relative overflow-hidden whitespace-nowrap">
      {long ? (
        <div className="inline-block animate-[marquee_12s_linear_infinite] pr-12">{text} · {text} · </div>
      ) : (
        <div>{text}</div>
      )}
      <style>{`@keyframes marquee {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

function Page() {
  const s = useAtelierSounds();
  const mm = Math.floor(s.sleepRemaining / 60).toString().padStart(2, "0");
  const ss = (s.sleepRemaining % 60).toString().padStart(2, "0");

  return (
    <div className="space-y-6">
      <PageHeader title="Atelier Sounds & Foco" description="Música ambiente e sons de relaxamento — continuam a tocar enquanto navegas pela app." />

      {/* Player */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-4">
            <div className="text-primary">
              <AudioVisualizer analyser={s.analyser} active={s.playing} className="h-12 w-32" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">A tocar</div>
              <div className="font-display text-lg">
                <Marquee text={s.track ? `${s.track.title}${s.track.artist ? " — " + s.track.artist : ""}` : "Sem faixa"} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="icon" variant="outline" onClick={s.prev} aria-label="Faixa anterior"><SkipBack className="h-4 w-4" /></Button>
            <Button size="icon" onClick={s.toggle} aria-label={s.playing ? "Pausar" : "Reproduzir"}>
              {s.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="outline" onClick={s.next} aria-label="Próxima faixa"><SkipForward className="h-4 w-4" /></Button>
            <div className="ml-2 flex min-w-[180px] flex-1 items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider value={[Math.round(s.volume * 100)]} max={100} step={1} onValueChange={(v) => s.setVolume(v[0] / 100)} />
              <span className="w-10 text-right text-xs text-muted-foreground">{Math.round(s.volume * 100)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="lofi">
        <TabsList>
          <TabsTrigger value="lofi">Música Lo-Fi & Relax</TabsTrigger>
          <TabsTrigger value="ambient">Sons da Natureza e Atelier</TabsTrigger>
        </TabsList>
        <TabsContent value="lofi">
          <Card><CardContent className="divide-y p-0">
            {MUSIC_TRACKS.map((t, i) => {
              const active = i === s.currentIndex;
              return (
                <button key={t.id} onClick={() => s.play(i)} className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50 ${active ? "bg-muted/40" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className={`grid h-8 w-8 place-items-center rounded-full ${active && s.playing ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {active && s.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </span>
                    <div>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">{t.artist}</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{active ? "selecionada" : ""}</span>
                </button>
              );
            })}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="ambient">
          <Card><CardContent className="grid gap-4 p-4 sm:grid-cols-2">
            {AMBIENT_LIST.map((a) => {
              const st = s.ambient[a.key as AmbientKey];
              return (
                <div key={a.key} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium"><span className="text-xl">{a.emoji}</span>{a.label}</div>
                    <Switch checked={st.enabled} onCheckedChange={(v) => s.setAmbient(a.key, { enabled: v })} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <Slider value={[Math.round(st.volume * 100)]} max={100} step={1} onValueChange={(v) => s.setAmbient(a.key, { volume: v[0] / 100 })} disabled={!st.enabled} />
                    <span className="w-10 text-right text-xs text-muted-foreground">{Math.round(st.volume * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Sleep timer */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex items-center gap-2 font-medium"><Moon className="h-4 w-4" /> Temporizador de desconexão</div>
          {[15, 30, 45, 60].map((m) => (
            <Button key={m} variant="outline" size="sm" onClick={() => s.startSleep(m)}>{m} min</Button>
          ))}
          {s.sleepRemaining > 0 && (
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="font-mono tabular-nums">{mm}:{ss}</span>
              <Button size="icon" variant="ghost" onClick={s.cancelSleep} aria-label="Cancelar"><X className="h-4 w-4" /></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}