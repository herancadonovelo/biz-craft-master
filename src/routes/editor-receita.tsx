import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type ReceitaEditor } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, FileDown } from "lucide-react";
import { toast } from "sonner";

const uid = () => Math.random().toString(36).slice(2, 10);

export const Route = createFileRoute("/editor-receita")({
  head: () => ({ meta: [{ title: "Editor de Receita" }] }),
  component: Page,
});

function Page() {
  const { receitasEditor, add, update, remove } = useStore();
  const [editId, setEditId] = useState<string | null>(receitasEditor[0]?.id || null);
  const r = receitasEditor.find((x) => x.id === editId);

  const novo = () => {
    const novo: Omit<ReceitaEditor, "id"> = {
      nome: "Nova receita",
      categoria: "amigurumi",
      materiais: [],
      seccoes: [{ id: uid(), nome: "Cabeça", carreiras: [] }],
      criadoEm: new Date().toISOString(),
    };
    add("receitasEditor", novo);
    setTimeout(() => { const c = useStore.getState().receitasEditor.slice(-1)[0]; if (c) setEditId(c.id); }, 0);
  };

  const patch = (p: Partial<ReceitaEditor>) => r && update("receitasEditor", r.id, p);

  return (
    <div className="space-y-6">
      <PageHeader title="Hub de Criação · Editor de Receita" description="Cria receitas estruturadas de amigurumi e crochê com pré-visualização." />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <Label>Receita</Label>
          <Select value={editId || ""} onValueChange={setEditId}>
            <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>{receitasEditor.map((x) => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={novo} className="bg-violet-300 hover:bg-violet-400 text-violet-950"><Plus className="mr-1 h-4 w-4" />Novo Projeto</Button>
        {r && <Button variant="ghost" onClick={() => { remove("receitasEditor", r.id); setEditId(null); }}><Trash2 className="h-4 w-4" /></Button>}
      </div>

      {!r ? (
        <Card className="p-10 text-center text-muted-foreground">Cria a tua primeira receita.</Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lado esquerdo — editor */}
          <div className="space-y-4">
            <Card>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                <div><Label>Nome</Label><Input value={r.nome} onChange={(e) => patch({ nome: e.target.value })} /></div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={r.categoria} onValueChange={(v) => patch({ categoria: v as ReceitaEditor["categoria"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amigurumi">Amigurumi</SelectItem>
                      <SelectItem value="crochet">Crochê Tradicional</SelectItem>
                      <SelectItem value="tricotin">Tricotin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Materiais</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {r.materiais.map((m) => (
                  <div key={m.id} className="grid grid-cols-[1fr_120px_auto] gap-2">
                    <Input placeholder="Material" value={m.nome} onChange={(e) => patch({ materiais: r.materiais.map((x) => x.id === m.id ? { ...x, nome: e.target.value } : x) })} />
                    <Input placeholder="Qtd" value={m.quantidade} onChange={(e) => patch({ materiais: r.materiais.map((x) => x.id === m.id ? { ...x, quantidade: e.target.value } : x) })} />
                    <Button variant="ghost" size="icon" onClick={() => patch({ materiais: r.materiais.filter((x) => x.id !== m.id) })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => patch({ materiais: [...r.materiais, { id: uid(), nome: "", quantidade: "" }] })}><Plus className="mr-1 h-4 w-4" />Material</Button>
              </CardContent>
            </Card>

            {r.seccoes.map((sec, si) => (
              <Card key={sec.id}>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Input value={sec.nome} onChange={(e) => patch({ seccoes: r.seccoes.map((s) => s.id === sec.id ? { ...s, nome: e.target.value } : s) })} className="font-display text-sm" />
                  <Button size="sm" variant="ghost" onClick={() => patch({ seccoes: r.seccoes.filter((s) => s.id !== sec.id) })}><Trash2 className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sec.carreiras.map((c, ci) => (
                    <div key={c.id} className="grid grid-cols-[40px_1fr_90px_auto] items-center gap-2">
                      <div className="text-xs font-medium text-muted-foreground">C{ci + 1}:</div>
                      <Input placeholder="ex: 6 pa no anel mágico" value={c.texto} onChange={(e) => patch({ seccoes: r.seccoes.map((s) => s.id === sec.id ? { ...s, carreiras: s.carreiras.map((x) => x.id === c.id ? { ...x, texto: e.target.value } : x) } : s) })} />
                      <Input type="number" placeholder="Pts" value={c.totalPontos ?? ""} onChange={(e) => patch({ seccoes: r.seccoes.map((s) => s.id === sec.id ? { ...s, carreiras: s.carreiras.map((x) => x.id === c.id ? { ...x, totalPontos: +e.target.value } : x) } : s) })} />
                      <Button variant="ghost" size="icon" onClick={() => patch({ seccoes: r.seccoes.map((s) => s.id === sec.id ? { ...s, carreiras: s.carreiras.filter((x) => x.id !== c.id) } : s) })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => patch({ seccoes: r.seccoes.map((s) => s.id === sec.id ? { ...s, carreiras: [...s.carreiras, { id: uid(), texto: "" }] } : s) })}><Plus className="mr-1 h-4 w-4" />Adicionar Carreira</Button>
                  <div className="text-xs text-muted-foreground">Secção {si + 1} de {r.seccoes.length}</div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={() => patch({ seccoes: [...r.seccoes, { id: uid(), nome: "Nova secção", carreiras: [] }] })}><Plus className="mr-1 h-4 w-4" />Adicionar Secção</Button>

            <Textarea placeholder="Notas gerais" value={r.notas || ""} onChange={(e) => patch({ notas: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={() => toast.success("Receita guardada")}><Save className="mr-1 h-4 w-4" />Guardar</Button>
              <Button variant="outline" onClick={() => window.print()}><FileDown className="mr-1 h-4 w-4" />Exportar PDF (imprimir)</Button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <Card className="bg-gradient-to-br from-violet-50 to-pink-50">
              <CardContent className="space-y-4 p-6">
                <div className="border-b border-violet-200 pb-3">
                  <h1 className="font-display text-2xl font-bold text-violet-900">{r.nome}</h1>
                  <p className="text-sm uppercase tracking-widest text-violet-700">{r.categoria}</p>
                </div>
                {r.materiais.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-violet-800">Materiais</h3>
                    <ul className="mt-1 space-y-0.5 text-sm">
                      {r.materiais.map((m) => <li key={m.id}>• {m.nome} <span className="text-muted-foreground">— {m.quantidade}</span></li>)}
                    </ul>
                  </div>
                )}
                {r.seccoes.map((sec) => (
                  <div key={sec.id}>
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-violet-800">{sec.nome}</h3>
                    <ol className="mt-1 space-y-1 text-sm">
                      {sec.carreiras.map((c, i) => (
                        <li key={c.id}>
                          <strong>Carreira {i + 1}:</strong> {c.texto} {c.totalPontos ? <span className="text-violet-600">({c.totalPontos} pts)</span> : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
                {r.notas && <div className="border-t border-violet-200 pt-3 text-xs italic text-violet-700">{r.notas}</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}