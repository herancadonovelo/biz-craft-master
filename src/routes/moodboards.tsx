import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, type Moodboard } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const PASTEL_TAGS = ["#tricotin", "#amigurumi", "#crochet", "#bebes", "#natal", "#mae"];

export const Route = createFileRoute("/moodboards")({
  head: () => ({ meta: [{ title: "Moodboards" }] }),
  component: MoodboardsPage,
});

function MoodboardsPage() {
  const { moodboards, add } = useStore();
  const [q, setQ] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", tags: "", imagens: [] as string[] });

  const filtrados = useMemo(() => moodboards.filter((m) => {
    if (q && !(m.titulo + (m.descricao || "")).toLowerCase().includes(q.toLowerCase())) return false;
    if (tagFilter && !m.tags.includes(tagFilter)) return false;
    return true;
  }), [moodboards, q, tagFilter]);

  const upload = async (files: FileList | null) => {
    if (!files) return;
    const urls = await Promise.all(Array.from(files).map((f) => new Promise<string>((res) => {
      const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f);
    })));
    setForm((s) => ({ ...s, imagens: [...s.imagens, ...urls] }));
  };

  const criar = () => {
    if (!form.titulo.trim()) return toast.error("Título obrigatório");
    const novo: Omit<Moodboard, "id"> = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      imagens: form.imagens.map((url, i) => ({ id: String(i) + Date.now(), url })),
      paleta: [],
      links: [],
      criadoEm: new Date().toISOString(),
    };
    add("moodboards", novo);
    toast.success("Moodboard criado");
    setOpen(false);
    setForm({ titulo: "", descricao: "", tags: "", imagens: [] });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Moodboards" description="Painéis de inspiração para o teu atelier." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar painéis..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-300 hover:bg-rose-400 text-rose-950"><Plus className="mr-1 h-4 w-4" />Novo Moodboard</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Criar Moodboard</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
              <div><Label>Descrição / Notas</Label><Textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div><Label>Tags (separadas por vírgula)</Label><Input placeholder="#tricotin, #bebes" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
              <div>
                <Label>Imagens</Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} />
                {form.imagens.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {form.imagens.map((u, i) => <img key={i} src={u} className="aspect-square w-full rounded object-cover" />)}
                  </div>
                )}
              </div>
              <Button onClick={criar} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={tagFilter === null ? "default" : "secondary"} className="cursor-pointer" onClick={() => setTagFilter(null)}>Todas</Badge>
        {PASTEL_TAGS.map((t) => (
          <Badge key={t} variant={tagFilter === t ? "default" : "secondary"} className="cursor-pointer" onClick={() => setTagFilter(t)}>{t}</Badge>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 opacity-40" />
          Ainda não tens moodboards. Cria o primeiro!
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((m) => (
            <Link key={m.id} to="/moodboards/$id" params={{ id: m.id }} className="group">
              <Card className="overflow-hidden transition hover:shadow-lg">
                {m.imagens[0] ? (
                  <img src={m.imagens[0].url} className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-rose-50 to-sky-50 text-rose-300">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}