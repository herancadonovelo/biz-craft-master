import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, type NotaRapida } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pin, Trash2, CheckSquare, Type, Search, FolderInput } from "lucide-react";
import { toast } from "sonner";

const CORES = ["#fef9c3", "#fde2e4", "#dcfce7", "#dbeafe", "#ede9fe"];
const CATS = ["Todas", "Ideias", "Receitas", "Tarefas", "Fornecedores"] as const;

export const Route = createFileRoute("/notas")({
  head: () => ({ meta: [{ title: "Bloco de Notas" }] }),
  component: NotasPage,
});

function NotasPage() {
  const { notas, add, update, remove } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("Todas");
  const [editing, setEditing] = useState<NotaRapida | null>(null);
  const [open, setOpen] = useState(false);

  const lista = useMemo(() => {
    const filtradas = notas.filter((n) => {
      if (cat !== "Todas" && n.categoria !== cat) return false;
      if (q) {
        const blob = (n.titulo || "") + " " + n.conteudo + " " + (n.checklist || []).map((c) => c.texto).join(" ");
        if (!blob.toLowerCase().includes(q.toLowerCase())) return false;
      }
      return true;
    });
    return [...filtradas].sort((a, b) => Number(b.fixada) - Number(a.fixada) || b.modificadaEm.localeCompare(a.modificadaEm));
  }, [notas, q, cat]);

  const novaNota = () => {
    const id = Date.now().toString();
    const nova: Omit<NotaRapida, "id"> = {
      titulo: "",
      conteudo: "",
      tipo: "texto",
      cor: CORES[0],
      fixada: false,
      tags: [],
      categoria: "Ideias",
      modificadaEm: new Date().toISOString(),
    };
    add("notas", nova);
    setTimeout(() => {
      const created = useStore.getState().notas[useStore.getState().notas.length - 1];
      setEditing(created);
      setOpen(true);
    }, 0);
    void id;
  };

  const save = (n: NotaRapida) => {
    const titulo = n.titulo?.trim() || (n.conteudo.split("\n")[0] || "Nota");
    update("notas", n.id, { ...n, titulo, modificadaEm: new Date().toISOString() });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Bloco de Notas" description="Captura rápida de ideias, receitas e tarefas do atelier." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar notas..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button onClick={novaNota}><Plus className="mr-1 h-4 w-4" />Nova Nota</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <Badge key={c} variant={cat === c ? "default" : "secondary"} className="cursor-pointer" onClick={() => setCat(c)}>{c}</Badge>
        ))}
      </div>

      {lista.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Sem notas ainda. Cria a primeira!</Card>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {lista.map((n) => (
            <button
              key={n.id}
              onClick={() => { setEditing(n); setOpen(true); }}
              className="mb-4 block w-full break-inside-avoid rounded-xl p-4 text-left shadow-sm transition hover:shadow-md"
              style={{ background: n.cor }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-display font-semibold text-stone-800">{n.titulo || (n.conteudo.split("\n")[0] || "Sem título")}</div>
                {n.fixada && <Pin className="h-4 w-4 fill-stone-700 text-stone-700" />}
              </div>
              {n.tipo === "texto" ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{n.conteudo}</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-stone-700">
                  {(n.checklist || []).slice(0, 6).map((c) => (
                    <li key={c.id} className={c.feito ? "line-through opacity-60" : ""}>☐ {c.texto}</li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {n.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px] bg-white/40 border-stone-300 text-stone-700">{t}</Badge>)}
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o && editing) save(editing); }}>
        <DialogContent className="max-w-xl" style={{ background: editing?.cor }}>
          <DialogHeader><DialogTitle>Editar nota</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input placeholder="Título" value={editing.titulo || ""} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} className="bg-white/50" />
              <div className="flex gap-2">
                <Button size="sm" variant={editing.tipo === "texto" ? "default" : "outline"} onClick={() => setEditing({ ...editing, tipo: "texto" })}><Type className="mr-1 h-4 w-4" />Texto</Button>
                <Button size="sm" variant={editing.tipo === "checklist" ? "default" : "outline"} onClick={() => setEditing({ ...editing, tipo: "checklist", checklist: editing.checklist || [] })}><CheckSquare className="mr-1 h-4 w-4" />Lista</Button>
              </div>
              {editing.tipo === "texto" ? (
                <Textarea rows={8} value={editing.conteudo} onChange={(e) => setEditing({ ...editing, conteudo: e.target.value })} className="bg-white/50" />
              ) : (
                <div className="space-y-2">
                  {(editing.checklist || []).sort((a, b) => Number(a.feito) - Number(b.feito)).map((it) => (
                    <div key={it.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={it.feito} onChange={(e) => setEditing({ ...editing, checklist: editing.checklist!.map((x) => x.id === it.id ? { ...x, feito: e.target.checked } : x) })} />
                      <Input value={it.texto} onChange={(e) => setEditing({ ...editing, checklist: editing.checklist!.map((x) => x.id === it.id ? { ...x, texto: e.target.value } : x) })} className={`bg-white/50 ${it.feito ? "line-through opacity-60" : ""}`} />
                      <Button size="icon" variant="ghost" onClick={() => setEditing({ ...editing, checklist: editing.checklist!.filter((x) => x.id !== it.id) })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setEditing({ ...editing, checklist: [...(editing.checklist || []), { id: Date.now().toString(), texto: "", feito: false }] })}><Plus className="mr-1 h-4 w-4" />Item</Button>
                </div>
              )}
              <Input placeholder="Tags separadas por vírgula (#urgente)" value={editing.tags.join(", ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} className="bg-white/50" />
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {CORES.map((c) => (
                  <button key={c} className="h-7 w-7 rounded-full border-2 border-white shadow" style={{ background: c, outline: editing.cor === c ? "2px solid black" : "none" }} onClick={() => setEditing({ ...editing, cor: c })} />
                ))}
                <Button size="sm" variant={editing.fixada ? "default" : "outline"} onClick={() => setEditing({ ...editing, fixada: !editing.fixada })}><Pin className="mr-1 h-4 w-4" />{editing.fixada ? "Fixada" : "Fixar"}</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const texto = `${editing.titulo || ""}\n\n${editing.conteudo}`;
                  navigator.clipboard.writeText(texto).catch(() => {});
                  toast.success("Conteúdo copiado — cola no formulário do produto/moodboard");
                }}><FolderInput className="mr-1 h-4 w-4" />Transformar em Projeto</Button>
                <Button size="sm" variant="destructive" className="ml-auto" onClick={() => { remove("notas", editing.id); setOpen(false); }}><Trash2 className="mr-1 h-4 w-4" />Eliminar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}