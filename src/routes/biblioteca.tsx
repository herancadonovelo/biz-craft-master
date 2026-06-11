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

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca de moldes e receitas" }] }),
  component: () => {
    const { biblioteca, add, remove } = useStore();
    const tt = useTT();
    const [q, setQ] = useState("");
    const [novo, setNovo] = useState({
      titulo: "", categoria: "", tipo: "molde" as const,
      descricao: "", url: "", ficheiroBase64: "", tamanhoKb: 0,
    });
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
    return (
      <div className="space-y-6">
        <PageHeader title="Biblioteca de moldes e receitas" description="Guarda PDFs, imagens e tutoriais. Prefere links cloud (Drive/Dropbox/R2) para poupar espaço." />

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
          <Button className="md:col-span-3" onClick={guardar}><Plus className="mr-1 h-4 w-4" />Guardar</Button>
        </CardContent></Card>

        <Input placeholder="Pesquisar…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((b) => (
            <Card key={b.id}><CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><span className="font-display font-semibold">{tt(b.titulo)}</span></div>
                <Button size="icon" variant="ghost" onClick={() => remove("biblioteca", b.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="text-xs text-muted-foreground">{tt(b.categoria)} · {tt(b.tipo)}{b.tamanhoKb ? ` · ${b.tamanhoKb} KB` : ""}</div>
              {b.descricao && <p className="text-sm">{tt(b.descricao)}</p>}
              <div className="flex gap-2">
                {b.url && <a className="text-xs text-primary underline inline-flex items-center gap-1" href={b.url} target="_blank" rel="noreferrer"><Cloud className="h-3 w-3" />Abrir</a>}
                {b.ficheiroBase64 && <a className="text-xs inline-flex items-center gap-1 text-primary" href={b.ficheiroBase64} download={b.titulo}><FileDown className="h-3 w-3" />Download</a>}
              </div>
            </CardContent></Card>
          ))}
          {filtrados.length === 0 && <p className="text-sm text-muted-foreground">Sem itens.</p>}
        </div>
      </div>
    );
  },
});