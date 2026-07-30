import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { useTT } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileDown, BookOpen, Cloud } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const AREAS_BIB = ["Tricotin", "Amigurumi", "Crochê", "Costura", "Ponto cruz", "Bordado"] as const;

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca de moldes e receitas" }] }),
  component: () => <BibliotecaContent />,
});

export function BibliotecaContent({ embedded = false }: { embedded?: boolean }) {
    const { biblioteca, add, remove } = useStore();
    const tt = useTT();
    const [q, setQ] = useState("");
    const [aberto, setAberto] = useState<string | null>(null);
    const [novo, setNovo] = useState({
      titulo: "", categoria: "", tipo: "molde" as const,
      descricao: "", url: "", ficheiroBase64: "", tamanhoKb: 0,
    });
    const ehImagem = (s?: string) => !!s && /^data:image\//i.test(s);
    const ehPdf = (s?: string) => !!s && /^data:application\/pdf/i.test(s);
    const upload = (f?: File) => {
      if (!f) return;
      if (f.size > 4_000_000) {
        toast.warning("Ficheiro >4MB: usa preferencialmente um link cloud (Drive/Dropbox).");
      }
      const r = new FileReader();
      r.onload = () => setNovo((s) => ({ ...s, ficheiroBase64: r.result as string, titulo: s.titulo || f.name, tamanhoKb: Math.round(f.size / 1024) }));
      r.readAsDataURL(f);
    };
    const guardar = () => {
      if (!novo.titulo || !novo.categoria) return toast.error("Título e categoria obrigatórios");
      add("biblioteca", { ...novo, criadoEm: new Date().toISOString() } as any);
      setNovo({ titulo: "", categoria: "", tipo: "molde", descricao: "", url: "", ficheiroBase64: "", tamanhoKb: 0 });
      toast.success("Adicionado à biblioteca");
    };
    const categorias = useMemo(() => Array.from(new Set(biblioteca.map((b) => b.categoria))).filter(Boolean), [biblioteca]);
    const filtrados = biblioteca.filter((b) => !q || (b.titulo + b.categoria + (b.descricao || "")).toLowerCase().includes(q.toLowerCase()));
    const itemAberto = biblioteca.find((b) => b.id === aberto);
    const porArea = (area: string) => filtrados.filter((b) => (b.categoria || "").toLowerCase() === area.toLowerCase());
    return (
      <div className="space-y-6">
        {!embedded && (
          <PageHeader title="Biblioteca" description="Repositório central. Cada aba lista os trabalhos guardados pelos Editores Técnicos." />
        )}
        )}

        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Input placeholder="Título" value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} />
          <Input placeholder="Categoria (ex: Tricot, Crochet)" list="cats-bib" value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} />
          <datalist id="cats-bib">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
          <Select value={novo.tipo} onValueChange={(v: any) => setNovo({ ...novo, tipo: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="molde">Molde</SelectItem>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="tutorial">Tutorial</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Descrição" className="md:col-span-3" value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />
          <div className="md:col-span-2"><Label className="text-xs flex items-center gap-1"><Cloud className="h-3 w-3" />URL cloud (preferível)</Label><Input placeholder="https://drive.google.com/..." value={novo.url} onChange={(e) => setNovo({ ...novo, url: e.target.value })} /></div>
          <div><Label className="text-xs">Ou ficheiro local</Label><Input type="file" accept="application/pdf,image/*" onChange={(e) => upload(e.target.files?.[0])} /></div>
          {novo.ficheiroBase64 && (
            <div className="md:col-span-3 rounded border border-dashed border-border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Pré-visualização ({novo.tamanhoKb} KB)</p>
              {ehImagem(novo.ficheiroBase64) && <img src={novo.ficheiroBase64} alt="preview" className="max-h-64 rounded" />}
              {ehPdf(novo.ficheiroBase64) && <embed src={novo.ficheiroBase64} type="application/pdf" className="h-64 w-full rounded" />}
              {!ehImagem(novo.ficheiroBase64) && !ehPdf(novo.ficheiroBase64) && <p className="text-xs text-muted-foreground">Formato sem pré-visualização disponível.</p>}
            </div>
          )}
          <Button className="md:col-span-3" onClick={guardar}><Plus className="mr-1 h-4 w-4" />Guardar</Button>
        </CardContent></Card>

        <Tabs defaultValue="todos">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            {AREAS_BIB.map((a) => <TabsTrigger key={a} value={a}>{a}</TabsTrigger>)}
          </TabsList>
          <Input
            placeholder="Pesquisar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-4 max-w-sm"
          />
          <TabsContent value="todos" className="mt-4">
            <Grelha items={filtrados} tt={tt} remove={remove} setAberto={setAberto} />
          </TabsContent>
          {AREAS_BIB.map((a) => (
            <TabsContent key={a} value={a} className="mt-4">
              <Grelha items={porArea(a)} tt={tt} remove={remove} setAberto={setAberto} />
            </TabsContent>
          ))}
        </Tabs>

        <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>{itemAberto ? tt(itemAberto.titulo) : ""}</DialogTitle></DialogHeader>
            {itemAberto && ehImagem(itemAberto.ficheiroBase64) && <img src={itemAberto.ficheiroBase64} alt={itemAberto.titulo} className="max-h-[75vh] w-full object-contain" />}
            {itemAberto && ehPdf(itemAberto.ficheiroBase64) && <embed src={itemAberto.ficheiroBase64} type="application/pdf" className="h-[75vh] w-full" />}
            {itemAberto?.url && !itemAberto.ficheiroBase64 && (
              <iframe src={itemAberto.url} title={itemAberto.titulo} className="h-[75vh] w-full rounded border border-border" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
}

function Grelha({ items, tt, remove, setAberto }: { items: any[]; tt: (s: string) => string; remove: any; setAberto: (id: string) => void }) {
  const ehImagem = (s?: string) => !!s && /^data:image\//i.test(s);
  const ehPdf = (s?: string) => !!s && /^data:application\/pdf/i.test(s);
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Sem itens nesta categoria.</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((b) => (
        <Card key={b.id}><CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><span className="font-display font-semibold">{tt(b.titulo)}</span></div>
                <Button size="icon" variant="ghost" aria-label={`Eliminar ${b.titulo}`} onClick={() => remove("biblioteca", b.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              {ehImagem(b.ficheiroBase64) && (
                <button onClick={() => setAberto(b.id)} className="block w-full">
                  <img src={b.ficheiroBase64} alt={b.titulo} className="h-32 w-full rounded object-cover" />
                </button>
              )}
              {ehPdf(b.ficheiroBase64) && (
                <button onClick={() => setAberto(b.id)} className="flex h-20 w-full items-center justify-center rounded bg-muted text-xs text-muted-foreground hover:bg-accent">📄 Pré-visualizar PDF</button>
              )}
              <div className="text-xs text-muted-foreground">{tt(b.categoria)} · {tt(b.tipo)}{b.tamanhoKb ? ` · ${b.tamanhoKb} KB` : ""}</div>
              {b.descricao && <p className="text-sm">{tt(b.descricao)}</p>}
              <div className="flex gap-2">
                {b.url && <a className="text-xs text-primary underline inline-flex items-center gap-1" href={b.url} target="_blank" rel="noreferrer"><Cloud className="h-3 w-3" />Abrir</a>}
                {b.ficheiroBase64 && <a className="text-xs inline-flex items-center gap-1 text-primary" href={b.ficheiroBase64} download={b.titulo}><FileDown className="h-3 w-3" />Download</a>}
                {b.ficheiroBase64 && <button className="text-xs text-primary underline" onClick={() => setAberto(b.id)}>Abrir</button>}
              </div>
        </CardContent></Card>
      ))}
    </div>
  );
}