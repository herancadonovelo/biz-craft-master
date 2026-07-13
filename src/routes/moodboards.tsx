import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageIcon, Plus, Printer, Download, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { escapeHtml as esc } from "@/lib/escape-html";

export const Route = createFileRoute("/moodboards")({
  head: () => ({ meta: [{ title: "Moodboards & Inspiração" }] }),
  component: MoodboardsPage,
});

const PIN_KEY = "atelier-pinterest";
type PinterestState = { username?: string; boards: { id: string; titulo: string; url: string }[]; conectadoEm?: string };

function loadPin(): PinterestState {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) || "") as PinterestState; }
  catch { return { boards: [] }; }
}
function savePin(s: PinterestState) { localStorage.setItem(PIN_KEY, JSON.stringify(s)); }

function MoodboardsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Moodboards & Inspiração" description="Pinterest + galeria dos teus moodboards criados no editor." />
      <Tabs defaultValue="inspira">
        <TabsList>
          <TabsTrigger value="inspira">Inspira-te</TabsTrigger>
          <TabsTrigger value="galeria">Moodboards</TabsTrigger>
        </TabsList>
        <TabsContent value="inspira" className="mt-4"><PinterestTab /></TabsContent>
        <TabsContent value="galeria" className="mt-4"><GaleriaTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PinterestTab() {
  const [pin, setPin] = useState<PinterestState>({ boards: [] });
  const [user, setUser] = useState("");
  const [boardUrl, setBoardUrl] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => { setPin(loadPin()); }, []);
  // Recarrega o script pinit.js sempre que pastas mudam para auto-render dos embeds.
  useEffect(() => {
    const id = "pinit-script";
    document.getElementById(id)?.remove();
    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    s.defer = true;
    s.src = "https://assets.pinterest.com/js/pinit.js";
    document.body.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, [pin.boards.length, pin.username, tick]);

  const conectar = () => {
    if (!user.trim()) return toast.error("Indica o teu username do Pinterest.");
    const novo: PinterestState = { ...pin, username: user.trim().replace(/^@/, ""), conectadoEm: new Date().toISOString() };
    setPin(novo); savePin(novo);
    toast.success("Conta Pinterest ligada");
  };

  const desconectar = () => {
    const novo: PinterestState = { boards: [] };
    setPin(novo); savePin(novo);
    toast("Pinterest desligado");
  };

  const adicionarPasta = () => {
    const url = boardUrl.trim();
    if (!/^https?:\/\/(www\.)?pinterest\./i.test(url)) return toast.error("Cola um URL válido (ex.: https://www.pinterest.com/utilizador/pasta/)");
    const titulo = decodeURIComponent(url.split("/").filter(Boolean).pop() || "Pasta");
    const novo: PinterestState = {
      ...pin,
      boards: [...pin.boards, { id: Math.random().toString(36).slice(2, 9), titulo, url }],
    };
    setPin(novo); savePin(novo); setBoardUrl("");
    toast.success("Pasta adicionada");
  };

  const removerPasta = (id: string) => {
    const novo = { ...pin, boards: pin.boards.filter((b) => b.id !== id) };
    setPin(novo); savePin(novo);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          {!pin.username ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Username Pinterest</label>
                <Input placeholder="o-teu-username" value={user} onChange={(e) => setUser(e.target.value)} />
              </div>
              <Button onClick={conectar} className="bg-rose-500 hover:bg-rose-600 text-white">
                <ExternalLink className="mr-1 h-4 w-4" /> Conectar Pinterest
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                Ligado como <span className="font-medium">@{pin.username}</span>
                <a href={`https://www.pinterest.com/${pin.username}/`} target="_blank" rel="noreferrer" className="ml-2 text-rose-600 hover:underline">ver perfil</a>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setTick((t) => t + 1)}><RefreshCw className="mr-1 h-3.5 w-3.5" /> Sincronizar</Button>
                <Button variant="ghost" size="sm" onClick={desconectar}>Desligar</Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Adiciona as URLs das tuas pastas públicas — a aplicação mostra-as em tempo real através dos widgets oficiais do Pinterest.
            Sempre que adicionas ou retiras pins no Pinterest, os widgets são atualizados automaticamente ao abrir esta aba ou ao clicar em "Sincronizar".
          </p>
          {pin.username && (
            <div className="flex gap-2">
              <Input placeholder="https://www.pinterest.com/utilizador/pasta/" value={boardUrl} onChange={(e) => setBoardUrl(e.target.value)} />
              <Button onClick={adicionarPasta}><Plus className="mr-1 h-4 w-4" /> Pasta</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {pin.username && pin.boards.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          Ainda não adicionaste nenhuma pasta. Cola um URL público para começar.
        </CardContent></Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {pin.boards.map((b) => (
          <Card key={b.id} className="overflow-hidden">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-display font-medium capitalize">{b.titulo.replace(/-/g, " ")}</div>
                <Button variant="ghost" size="icon" onClick={() => removerPasta(b.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <a
                key={tick}
                data-pin-do="embedBoard"
                data-pin-board-width="100%"
                data-pin-scale-height="320"
                data-pin-scale-width="80"
                href={b.url}
              >
                {b.url}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GaleriaTab() {
  const { moodboards, remove } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const ativo = useMemo(() => moodboards.find((m) => m.id === openId), [moodboards, openId]);
  const filtrados = moodboards.filter((m) => !q || m.titulo.toLowerCase().includes(q.toLowerCase()));

  const baixar = (m: typeof moodboards[number]) => {
    const url = m.preview;
    if (!url) return toast.error("Sem pré-visualização. Reabre no editor e guarda novamente.");
    const a = document.createElement("a");
    a.href = url; a.download = `${m.titulo.replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const imprimir = (m: typeof moodboards[number]) => {
    const url = m.preview;
    if (!url) return toast.error("Sem pré-visualização disponível.");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${esc(m.titulo)}</title><style>@page{size:A4;margin:0}body{margin:0}img{width:100%;height:100vh;object-fit:contain}</style></head><body><img src="${esc(url)}" onload="window.print();setTimeout(()=>window.close(),300)"/></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Pesquisar moodboards..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <Button onClick={() => navigate({ to: "/editor-moodboards" })} className="bg-rose-500 hover:bg-rose-600 text-white">
          <Plus className="mr-1 h-4 w-4" /> Novo no editor
        </Button>
      </div>
      {filtrados.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 opacity-40" />
          Ainda não guardaste nenhum moodboard. Cria um no <Link to="/editor-moodboards" className="text-rose-600 underline">Editor</Link>.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((m) => (
            <Card key={m.id} className="overflow-hidden cursor-pointer transition hover:shadow-lg" onClick={() => setOpenId(m.id)}>
              {m.preview ? (
                <img src={m.preview} className="aspect-[210/297] w-full object-cover bg-white" />
              ) : (
                <div className="grid aspect-[210/297] place-items-center bg-gradient-to-br from-rose-50 to-sky-50 text-rose-300">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              <CardContent className="p-3">
                <div className="truncate font-display font-medium">{m.titulo}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.tags.slice(0, 3).map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!ativo} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{ativo?.titulo}</DialogTitle></DialogHeader>
          {ativo?.preview && <img src={ativo.preview} className="w-full rounded border" />}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => ativo && baixar(ativo)}><Download className="mr-1 h-4 w-4" /> Guardar no dispositivo</Button>
            <Button variant="secondary" onClick={() => ativo && imprimir(ativo)}><Printer className="mr-1 h-4 w-4" /> Imprimir</Button>
            <Button variant="outline" onClick={() => ativo && navigate({ to: "/editor-moodboards", search: { id: ativo.id } as any })}>Abrir no editor</Button>
            <Button variant="ghost" className="text-destructive" onClick={() => {
              if (ativo) { remove("moodboards", ativo.id); setOpenId(null); toast("Moodboard removido"); }
            }}><Trash2 className="mr-1 h-4 w-4" /> Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}