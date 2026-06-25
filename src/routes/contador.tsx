import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, type ContadorReceita } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Minus, Plus, RotateCcw, Trash2, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contador")({
  head: () => ({ meta: [{ title: "Contador de Carreiras" }] }),
  component: Page,
});

function Page() {
  const { contadores, biblioteca, add, update, remove } = useStore();
  const [ativoId, setAtivoId] = useState<string | null>(contadores[0]?.id || null);
  const ativo = contadores.find((c) => c.id === ativoId);

  const [intervalo, setIntervalo] = useState<number>(
    Number(typeof window !== "undefined" ? window.localStorage.getItem("wellness.intervalMin") : 0) || 0,
  );

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("wellness.intervalMin", String(intervalo));
  }, [intervalo]);

  const novo = () => {
    const recId = biblioteca[0]?.id;
    const novoContador: Omit<ContadorReceita, "id"> = {
      receitaId: recId,
      receitaNome: biblioteca[0]?.titulo || "Nova produção",
      contadores: [{ id: "1", nome: "Principal", valor: 0 }],
      ultimaSessao: new Date().toISOString(),
    };
    add("contadores", novoContador);
    setTimeout(() => {
      const created = useStore.getState().contadores.slice(-1)[0];
      if (created) setAtivoId(created.id);
    }, 0);
  };

  const mod = (cId: string, delta: number) => {
    if (!ativo) return;
    update("contadores", ativo.id, {
      contadores: ativo.contadores.map((c) => c.id === cId ? { ...c, valor: Math.max(0, c.valor + delta) } : c),
      ultimaSessao: new Date().toISOString(),
    });
  };

  const reset = (cId: string) => {
    if (!ativo) return;
    if (!confirm("Deseja reiniciar a contagem desta peça?")) return;
    update("contadores", ativo.id, { contadores: ativo.contadores.map((c) => c.id === cId ? { ...c, valor: 0 } : c) });
  };

  const addContador = () => {
    if (!ativo) return;
    update("contadores", ativo.id, { contadores: [...ativo.contadores, { id: Date.now().toString(), nome: `Contador ${ativo.contadores.length + 1}`, valor: 0 }] });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Contador de Carreiras" description="Modo de produção — tece a tua peça sem perder a conta." />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <Label>Sessão ativa</Label>
          <Select value={ativoId || ""} onValueChange={setAtivoId}>
            <SelectTrigger><SelectValue placeholder="Nenhuma sessão ainda" /></SelectTrigger>
            <SelectContent>
              {contadores.map((c) => <SelectItem key={c.id} value={c.id}>{c.receitaNome} · {new Date(c.ultimaSessao).toLocaleDateString("pt-PT")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={novo} className="bg-violet-300 hover:bg-violet-400 text-violet-950"><Plus className="mr-1 h-4 w-4" />Iniciar Produção</Button>
        {ativo && <Button variant="ghost" onClick={() => { remove("contadores", ativo.id); setAtivoId(null); }}><Trash2 className="h-4 w-4" /></Button>}
      </div>

      {ativo && (
        <>
          <Card className="bg-gradient-to-br from-violet-50 to-pink-50">
            <CardContent className="p-4">
              <Input
                value={ativo.receitaNome}
                onChange={(e) => update("contadores", ativo.id, { receitaNome: e.target.value })}
                className="border-0 bg-transparent text-center font-display text-xl"
              />
            </CardContent>
          </Card>

          {ativo.contadores.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <CardContent className="space-y-4 p-6">
                <Input
                  value={c.nome}
                  onChange={(e) => update("contadores", ativo.id, { contadores: ativo.contadores.map((x) => x.id === c.id ? { ...x, nome: e.target.value } : x) })}
                  className="text-center font-display text-sm uppercase tracking-widest"
                />
                <div className="text-center">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Carreira</div>
                  <div className="font-display text-7xl font-bold tabular-nums tracking-tight transition-all">
                    {String(c.valor).padStart(2, "0")}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button size="lg" variant="outline" onClick={() => mod(c.id, -1)} className="h-16 w-16 rounded-full"><Minus className="h-6 w-6" /></Button>
                  <Button size="lg" onClick={() => mod(c.id, 1)} className="h-28 w-28 rounded-full bg-violet-400 text-white shadow-lg hover:bg-violet-500 active:scale-95">
                    <Plus className="h-10 w-10" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => reset(c.id)} className="h-16 w-16 rounded-full"><RotateCcw className="h-5 w-5" /></Button>
                </div>
                {ativo.contadores.length > 1 && (
                  <div className="text-center">
                    <Button size="sm" variant="ghost" onClick={() => update("contadores", ativo.id, { contadores: ativo.contadores.filter((x) => x.id !== c.id) })}>
                      <Trash2 className="mr-1 h-4 w-4" />Remover contador
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addContador} className="w-full"><Plus className="mr-1 h-4 w-4" />Adicionar Contador Secundário</Button>
        </>
      )}

      <Card className="border-pink-200 bg-pink-50/40">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2 text-sm font-display">
            <Heart className="h-4 w-4 text-pink-500" />Bem-estar & Ergonomia
          </div>
          <p className="text-xs text-muted-foreground">Receberás um alerta carinhoso para fazeres uma pausa após este intervalo de uso ativo.</p>
          <Select value={String(intervalo)} onValueChange={(v) => { setIntervalo(+v); toast.success("Definição guardada"); }}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Desativado</SelectItem>
              <SelectItem value="30">A cada 30 minutos</SelectItem>
              <SelectItem value="45">A cada 45 minutos</SelectItem>
              <SelectItem value="60">A cada 60 minutos</SelectItem>
              <SelectItem value="90">A cada 90 minutos</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}