import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Link as LinkIcon, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/moodboards/$id")({
  head: () => ({ meta: [{ title: "Moodboard" }] }),
  component: MoodboardDetail,
});

function MoodboardDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { moodboards, materiais, encomendas, clientes, update, remove } = useStore();
  const m = moodboards.find((x) => x.id === id);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [novaCor, setNovaCor] = useState({ nome: "", hex: "#f5d6e0", materialId: "" });
  const [novoLink, setNovoLink] = useState({ titulo: "", url: "" });

  if (!m) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => nav({ to: "/moodboards" })}><ArrowLeft className="mr-1 h-4 w-4" />Voltar</Button>
        <p>Moodboard não encontrado.</p>
      </div>
    );
  }

  const enc = m.encomendaId ? encomendas.find((e) => e.id === m.encomendaId) : undefined;
  const cli = enc?.clienteId ? clientes.find((c) => c.id === enc.clienteId) : undefined;

  const addImagens = async (files: FileList | null) => {
    if (!files) return;
    const novos = await Promise.all(Array.from(files).map((f) => new Promise<string>((res) => {
      const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f);
    })));
    update("moodboards", m.id, { imagens: [...m.imagens, ...novos.map((url, i) => ({ id: String(i) + Date.now() + Math.random(), url }))] });
  };

  const stockIndicador = (materialId?: string) => {
    if (!materialId) return null;
    const mat = materiais.find((x) => x.id === materialId);
    if (!mat) return null;
    const baixo = (mat.stockMinimo || 0) > 0 ? mat.stock <= (mat.stockMinimo || 0) : mat.stock < 3;
    return baixo
      ? <Badge variant="destructive" className="text-[10px]">Stock baixo — adicionar às compras</Badge>
      : <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Em stock ({mat.stock} {mat.unidade})</Badge>;
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => nav({ to: "/moodboards" })}><ArrowLeft className="mr-1 h-4 w-4" />Moodboards</Button>

      <PageHeader title={m.titulo} description={`Criado em ${m.criadoEm.slice(0, 10)}`} />

      {enc && cli && (
        <Card className="border-rose-200 bg-rose-50/60">
          <CardContent className="flex items-center justify-between p-4 text-sm">
            <span>📌 Vinculado à encomenda de <strong>{cli.nome}</strong> — {enc.descricao}</span>
            <Button size="sm" variant="ghost" onClick={() => update("moodboards", m.id, { encomendaId: undefined })}>Desvincular</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {m.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
        <div className="ml-auto">
          <Select onValueChange={(v) => update("moodboards", m.id, { encomendaId: v })} value={m.encomendaId || ""}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Vincular a encomenda…" /></SelectTrigger>
            <SelectContent>
              {encomendas.map((e) => {
                const c = clientes.find((x) => x.id === e.clienteId);
                return <SelectItem key={e.id} value={e.id}>{c?.nome || "—"} · {e.descricao}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base">Galeria</CardTitle>
          <Input type="file" accept="image/*" multiple className="w-auto" onChange={(e) => addImagens(e.target.files)} />
        </CardHeader>
        <CardContent>
          {m.imagens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem imagens ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {m.imagens.map((img) => (
                <button key={img.id} onClick={() => setLightbox(img.url)} className="group relative overflow-hidden rounded-md">
                  <img src={img.url} className="aspect-square w-full object-cover transition group-hover:scale-105" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-base">Paleta de cores</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {m.paleta.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
                <div className="h-10 w-10 rounded-full border" style={{ background: c.hex }} />
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">{c.nome}</div>
                  <div className="text-xs text-muted-foreground">{c.hex}</div>
                  {stockIndicador(c.materialId)}
                </div>
                <Button variant="ghost" size="icon" onClick={() => update("moodboards", m.id, { paleta: m.paleta.filter((x) => x.id !== c.id) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <Input placeholder="Nome (ex: Verde menta)" value={novaCor.nome} onChange={(e) => setNovaCor({ ...novaCor, nome: e.target.value })} />
            <Input type="color" value={novaCor.hex} onChange={(e) => setNovaCor({ ...novaCor, hex: e.target.value })} />
            <Select value={novaCor.materialId} onValueChange={(v) => setNovaCor({ ...novaCor, materialId: v })}>
              <SelectTrigger><SelectValue placeholder="Material (opcional)" /></SelectTrigger>
              <SelectContent>
                {materiais.map((mat) => <SelectItem key={mat.id} value={mat.id}>{mat.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => {
              if (!novaCor.nome) return toast.error("Nome obrigatório");
              update("moodboards", m.id, { paleta: [...m.paleta, { id: Date.now().toString(), ...novaCor, materialId: novaCor.materialId || undefined }] });
              setNovaCor({ nome: "", hex: "#f5d6e0", materialId: "" });
            }}><Plus className="mr-1 h-4 w-4" />Adicionar cor</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-base">Links de referência</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {m.links.map((l) => (
            <div key={l.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a href={l.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm text-primary hover:underline">{l.titulo || l.url}</a>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <Button variant="ghost" size="icon" onClick={() => update("moodboards", m.id, { links: m.links.filter((x) => x.id !== l.id) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Título" value={novoLink.titulo} onChange={(e) => setNovoLink({ ...novoLink, titulo: e.target.value })} />
            <Input placeholder="https://..." value={novoLink.url} onChange={(e) => setNovoLink({ ...novoLink, url: e.target.value })} />
            <Button onClick={() => {
              if (!novoLink.url) return toast.error("URL obrigatório");
              update("moodboards", m.id, { links: [...m.links, { id: Date.now().toString(), ...novoLink }] });
              setNovoLink({ titulo: "", url: "" });
            }}><Plus className="mr-1 h-4 w-4" />Adicionar link</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="destructive" onClick={() => { remove("moodboards", m.id); nav({ to: "/moodboards" }); }}>
          <Trash2 className="mr-1 h-4 w-4" />Eliminar moodboard
        </Button>
      </div>

      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl bg-transparent border-0 p-0">
          {lightbox && <img src={lightbox} className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}