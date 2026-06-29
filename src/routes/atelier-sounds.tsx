import { createFileRoute } from "@tanstack/react-router";
import { PremiumRoute } from "@/components/PremiumRoute";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, SkipForward, SkipBack, Volume2, Moon, X, CloudRain, Flame, Coffee, Wind, Waves, CloudLightning, Upload, Music2, Trash2 } from "lucide-react";
import { AMBIENT_LIST, useAtelierSounds, type AmbientKey } from "@/lib/atelier-sounds";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { useRef } from "react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { api as spotifyApi, beginLogin, getStoredToken, getRedirectUri, logout as spotifyLogout, refreshToken } from "@/lib/spotify";
import { ExternalLink, LogOut, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/atelier-sounds")({
  head: () => ({ meta: [{ title: "Atelier Sounds & Foco" }] }),
  component: () => (
    <PremiumRoute feature="Atelier Sounds & Foco">
      <Page />
    </PremiumRoute>
  ),
});

const AMBIENT_ICONS: Record<AmbientKey, typeof Waves> = {
  rain: CloudRain,
  fire: Flame,
  cafe: Coffee,
  wind: Wind,
  waves: Waves,
  thunder: CloudLightning,
};

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

      {s.loadError && (
        <div role="status" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
          ⚠️ {s.loadError}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="lofi">
        <TabsList>
          <TabsTrigger value="lofi">Música Lo-Fi & Relax</TabsTrigger>
          <TabsTrigger value="ambient">Sons da Natureza e Atelier</TabsTrigger>
        </TabsList>
        <TabsContent value="lofi">
          <MusicTab />
        </TabsContent>
        <TabsContent value="ambient">
          <Card><CardContent className="grid gap-4 p-4 sm:grid-cols-2">
            {AMBIENT_LIST.map((a) => {
              const st = s.ambient[a.key as AmbientKey];
              const Icon = AMBIENT_ICONS[a.key as AmbientKey];
              return (
                <div key={a.key} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-xl" aria-hidden>{a.emoji}</span>
                      {a.label}
                    </div>
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

function MusicTab() {
  const s = useAtelierSounds();
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3">
      <Card><CardContent className="flex flex-wrap items-center gap-2 p-4">
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (!e.target.files) return;
            const n = s.addTracks(e.target.files);
            if (n > 0) toast.success(`${n} música(s) adicionada(s)`);
            else toast.error("Nenhum ficheiro de áudio válido");
            e.target.value = "";
          }}
        />
        <Button onClick={() => fileRef.current?.click()}>
          <Upload className="mr-1 h-4 w-4" />Adicionar músicas do dispositivo
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          As músicas adicionadas ficam só neste dispositivo, na sessão atual.
        </p>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {s.tracks.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            O leitor está vazio. Adiciona músicas do dispositivo ou sincroniza com o Spotify para começar.
          </div>
        ) : (
          <div className="divide-y">
            {s.tracks.map((t, i) => {
              const active = i === s.currentIndex;
              return (
                <div key={t.id} className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-sm ${active ? "bg-muted/40" : ""}`}>
                  <button onClick={() => s.play(i)} className="flex flex-1 items-center gap-3 text-left hover:opacity-80">
                    <span className={`grid h-8 w-8 place-items-center rounded-full ${active && s.playing ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {active && s.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </span>
                    <div>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">{t.artist}</div>
                    </div>
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => s.removeTrack(t.id)} aria-label="Remover">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent></Card>

      <SpotifyPanel />
      <AmazonMusicPanel />
    </div>
  );
}

function SpotifyPanel() {
  const clientId = useStore((s) => s.design.spotifyClientId || "");
  const setDesign = useStore((s) => s.setDesign);
  const [cidInput, setCidInput] = useState(clientId);
  const [connected, setConnected] = useState(!!getStoredToken());
  const [me, setMe] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [tracksByPl, setTracksByPl] = useState<Record<string, any[]>>({});
  const [openPl, setOpenPl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setCidInput(clientId); }, [clientId]);

  const refresh = async () => {
    if (!clientId || !getStoredToken()) return;
    setLoading(true);
    try {
      const m = await spotifyApi(clientId, "/me");
      setMe(m);
      const p = await spotifyApi(clientId, "/me/playlists?limit=50");
      setPlaylists(p.items || []);
    } catch (e: any) {
      if (String(e.message).includes("401")) {
        await refreshToken(clientId);
        try {
          const m = await spotifyApi(clientId, "/me");
          setMe(m);
        } catch { setConnected(false); spotifyLogout(); }
      } else toast.error("Spotify: " + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (connected) refresh(); /* eslint-disable-next-line */ }, [connected, clientId]);

  const openPlaylist = async (id: string) => {
    if (openPl === id) { setOpenPl(null); return; }
    setOpenPl(id);
    if (!tracksByPl[id]) {
      try {
        const r = await spotifyApi(clientId, `/playlists/${id}/tracks?limit=100`);
        setTracksByPl((t) => ({ ...t, [id]: r.items || [] }));
      } catch (e: any) { toast.error(e.message); }
    }
  };

  const play = async (uri: string) => {
    try {
      await spotifyApi(clientId, "/me/player/play", { method: "PUT", body: JSON.stringify({ uris: [uri] }) });
      toast.success("A tocar no Spotify");
    } catch (e: any) {
      if (String(e.message).includes("404")) toast.error("Abre o Spotify num dispositivo (telemóvel/desktop/web) para ativar o leitor.");
      else toast.error(e.message);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-display text-base">
            <Music2 className="h-4 w-4 text-primary" />Spotify
          </div>
          {connected && me && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>👤 {me.display_name || me.id}</span>
              <Button size="icon" variant="ghost" onClick={refresh} aria-label="Atualizar"><RefreshCw className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { spotifyLogout(); setConnected(false); setMe(null); setPlaylists([]); }} aria-label="Sair"><LogOut className="h-4 w-4" /></Button>
            </div>
          )}
        </div>

        {!connected ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Cria uma app em <a className="underline" href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">developer.spotify.com/dashboard <ExternalLink className="inline h-3 w-3" /></a>,
              adiciona como Redirect URI: <code className="rounded bg-muted px-1">{getRedirectUri()}</code>, copia o <strong>Client ID</strong> e cola abaixo.
              Necessita de conta Spotify Premium para controlo de reprodução.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[220px]">
                <Label className="text-xs">Spotify Client ID</Label>
                <Input value={cidInput} onChange={(e) => setCidInput(e.target.value.trim())} placeholder="ex: 1a2b3c4d5e6f..." />
              </div>
              <Button variant="outline" onClick={() => { setDesign({ spotifyClientId: cidInput }); toast.success("Client ID guardado"); }}>Guardar</Button>
              <Button
                disabled={!cidInput}
                onClick={async () => {
                  setDesign({ spotifyClientId: cidInput });
                  try { await beginLogin(cidInput); } catch (e: any) { toast.error(e.message); }
                }}
              ><Music2 className="mr-1 h-4 w-4" />Ligar conta Spotify</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {loading && <div className="text-xs text-muted-foreground">A carregar…</div>}
            {playlists.length === 0 && !loading && (
              <div className="text-xs text-muted-foreground">Sem playlists encontradas.</div>
            )}
            <div className="divide-y rounded-md border">
              {playlists.map((p) => (
                <div key={p.id}>
                  <button onClick={() => openPlaylist(p.id)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/40">
                    {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted" />}
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.tracks?.total ?? 0} faixas · {p.owner?.display_name}</div>
                    </div>
                    <a href={p.external_urls?.spotify} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
                  </button>
                  {openPl === p.id && (
                    <div className="bg-muted/30 px-3 py-2">
                      {(tracksByPl[p.id] || []).slice(0, 50).map((it: any) => it.track && (
                        <div key={it.track.id} className="flex items-center justify-between gap-2 py-1 text-xs">
                          <div className="min-w-0 flex-1 truncate">{it.track.name} <span className="text-muted-foreground">— {it.track.artists?.map((a: any) => a.name).join(", ")}</span></div>
                          <Button size="sm" variant="ghost" onClick={() => play(it.track.uri)}><Play className="h-3 w-3" /></Button>
                        </div>
                      ))}
                      {(tracksByPl[p.id] || []).length === 0 && <div className="text-xs text-muted-foreground">Sem faixas.</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">A reprodução acontece no teu leitor Spotify ativo (telemóvel, desktop ou web). Abre o Spotify primeiro se nada acontecer.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AmazonMusicPanel() {
  const amazonUrl = useStore((s) => s.design.amazonMusicUrl || "");
  const setDesign = useStore((s) => s.setDesign);
  const [url, setUrl] = useState(amazonUrl);
  useEffect(() => { setUrl(amazonUrl); }, [amazonUrl]);

  const open = (target: string) => {
    try { window.open(target, "_blank", "noopener,noreferrer"); }
    catch { toast.error("Não foi possível abrir o Amazon Music"); }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 font-display text-base">
          <Music2 className="h-4 w-4 text-primary" />Amazon Music
        </div>
        <p className="text-xs text-muted-foreground">
          A Amazon não disponibiliza um SDK público de reprodução web para integradores. A sincronização aqui é por <strong>ligação direta</strong>: guarda a tua playlist/estação favorita e abre-a no Amazon Music (web ou app) num clique. A sessão usa a tua conta Amazon já iniciada no navegador.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[220px]">
            <Label className="text-xs">URL Amazon Music (playlist, estação ou álbum)</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value.trim())} placeholder="https://music.amazon.com/playlists/..." />
          </div>
          <Button variant="outline" onClick={() => { setDesign({ amazonMusicUrl: url }); toast.success("URL guardado"); }}>Guardar</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => open(url || "https://music.amazon.com/")}>
            <Play className="mr-1 h-4 w-4" />{url ? "Abrir a minha playlist" : "Abrir Amazon Music"}
          </Button>
          <Button variant="outline" onClick={() => open("https://music.amazon.com/my/library/home")}>A minha biblioteca</Button>
          <Button variant="outline" onClick={() => open("https://music.amazon.com/stations")}>Estações</Button>
        </div>
      </CardContent>
    </Card>
  );
}