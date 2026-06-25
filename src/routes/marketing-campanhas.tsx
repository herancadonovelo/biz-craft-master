import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, type AcaoMarketing, type DataFestiva } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Sparkles, Trash2, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { askAssistant } from "@/lib/ai.functions";

const PAISES = ["Portugal", "Brasil", "Angola", "Internacional"];

export const Route = createFileRoute("/marketing-campanhas")({
  head: () => ({ meta: [{ title: "Marketing & Campanhas" }] }),
  component: Page,
});

function Page() {
  const { datasFestivas, acoesMarketing, catalogo, add, update, remove, design } = useStore();
  const [pais, setPais] = useState("Portugal");
  const [openData, setOpenData] = useState(false);
  const [openAcao, setOpenAcao] = useState(false);
  const [detalheData, setDetalheData] = useState<DataFestiva | null>(null);

  const datas = useMemo(() => datasFestivas.filter((d) => d.pais === pais || d.pais === "Internacional"), [datasFestivas, pais]);

  const hoje = new Date();
  const diasAte = (d: DataFestiva) => {
    const ano = hoje.getFullYear();
    let alvo = new Date(ano, d.mes - 1, d.dia);
    if (alvo < hoje) alvo = new Date(ano + 1, d.mes - 1, d.dia);
    return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
  };

  const alertasAtivos = datas.filter((d) => d.alertaAtivo && diasAte(d) <= d.diasAntes);

  void design;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketing & Campanhas" description="Calendário festivo, campanhas, promoções e sorteios." />

      {alertasAtivos.length > 0 && (
        <div className="space-y-2">
          {alertasAtivos.map((d) => (
            <Card key={d.id} className="border-amber-300 bg-amber-50/60">
              <CardContent className="p-3 text-sm">
                🔔 Faltam <strong>{diasAte(d)}</strong> dias para <strong>{d.nome}</strong>. Altura ideal para começar a produzir!
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="calendario">
        <TabsList>
          <TabsTrigger value="calendario">O Meu Calendário Festivo</TabsTrigger>
          <TabsTrigger value="acoes">Minhas Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label>País</Label>
              <Select value={pais} onValueChange={setPais}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{PAISES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={() => { setOpenAcao(true); }}><Plus className="mr-1 h-4 w-4" />Criar Nova Ação</Button>
            <Button variant="outline" onClick={() => setOpenData(true)}><Plus className="mr-1 h-4 w-4" />Personalizar Data Festiva</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {datas.sort((a, b) => diasAte(a) - diasAte(b)).map((d) => {
              const dias = diasAte(d);
              const proximo = d.alertaAtivo && dias <= d.diasAntes;
              return (
                <Card key={d.id} className={proximo ? "border-amber-300" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span className="font-display">{d.nome}</span>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="text-muted-foreground">{String(d.dia).padStart(2, "0")}/{String(d.mes).padStart(2, "0")} · {d.pais}</div>
                    <div>Faltam <strong>{dias}</strong> dias</div>
                    <div className="flex items-center gap-2 text-xs">
                      <Switch checked={d.alertaAtivo} onCheckedChange={(v) => update("datasFestivas", d.id, { alertaAtivo: v })} />
                      <span>Alerta {d.diasAntes}d antes</span>
                      <Select value={String(d.diasAntes)} onValueChange={(v) => update("datasFestivas", d.id, { diasAntes: +v })}>
                        <SelectTrigger className="h-7 w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>{[15, 30, 45, 60].map((n) => <SelectItem key={n} value={String(n)}>{n}d</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setDetalheData(d)}><Sparkles className="mr-1 h-4 w-4" />Ideias IA</Button>
                      {d.custom && <Button size="sm" variant="ghost" onClick={() => remove("datasFestivas", d.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="acoes">
          <ListaAcoes acoes={acoesMarketing} remove={(id) => remove("acoesMarketing", id)} update={(id, p) => update("acoesMarketing", id, p)} />
        </TabsContent>
      </Tabs>

      <DialogNovaData open={openData} onClose={() => setOpenData(false)} pais={pais} add={(d) => add("datasFestivas", d)} />
      <DialogNovaAcao open={openAcao} onClose={() => setOpenAcao(false)} add={(a) => add("acoesMarketing", a)} dataPreSel={null} catalogo={catalogo} />
      <DialogIdeiasIA data={detalheData} onClose={() => setDetalheData(null)} onCriarAcao={(titulo) => { setDetalheData(null); setOpenAcao(true); useStore.getState(); void titulo; }} />
    </div>
  );
}

function ListaAcoes({ acoes, remove, update }: { acoes: AcaoMarketing[]; remove: (id: string) => void; update: (id: string, p: Partial<AcaoMarketing>) => void }) {
  const { catalogo } = useStore();
  if (acoes.length === 0) return <Card className="p-8 text-center text-muted-foreground">Sem ações ainda. Cria a primeira no separador "Calendário".</Card>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {acoes.map((a) => (
        <Card key={a.id}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="font-display">{a.titulo}</span>
              <Badge variant={a.estado === "ativa" ? "default" : a.estado === "concluida" ? "secondary" : "outline"}>{a.estado}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{a.tipo}</div>
            {a.imagem && <img src={a.imagem} alt={a.titulo} className="h-32 w-full rounded-md object-cover" />}
            {a.catalogoId && (() => { const c = catalogo.find((x) => x.id === a.catalogoId); return c ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                {c.imagem && <img src={c.imagem} alt={c.nome} className="h-10 w-10 rounded object-cover" />}
                <div className="text-xs"><div className="font-medium">{c.nome}</div><div className="text-muted-foreground">Catálogo</div></div>
              </div>
            ) : null; })()}
            {a.dataInicio && <div>📅 {a.dataInicio} — {a.dataFim || "?"}</div>}
            {a.meta && <div>🎯 {a.meta}</div>}
            {a.tipo === "promocao" && (
              <div className="rounded-md border border-dashed border-rose-300 bg-rose-50 p-2 text-rose-700">
                🏷️ Cupão ativo: {a.descontoValor}{a.descontoTipo === "percentagem" ? "%" : "€"} · {a.alvo === "todo" ? "Todo o catálogo" : "Produtos específicos"}
              </div>
            )}
            {a.peca && <div>🎁 Peça: {a.peca}</div>}
            {a.regras && <div className="text-xs text-muted-foreground">{a.regras}</div>}
            <div className="flex gap-2 pt-2">
              <Select value={a.estado} onValueChange={(v) => update(a.id, { estado: v as AcaoMarketing["estado"] })}>
                <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planeada">Planeada</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DialogNovaData({ open, onClose, pais, add }: { open: boolean; onClose: () => void; pais: string; add: (d: Omit<DataFestiva, "id">) => void }) {
  const [f, setF] = useState({ nome: "", dia: 1, mes: 1, descricao: "", alertaAtivo: true, diasAntes: 30 });
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Personalizar Data Festiva</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Dia</Label><Input type="number" min={1} max={31} value={f.dia} onChange={(e) => setF({ ...f, dia: +e.target.value })} /></div>
            <div><Label>Mês</Label><Input type="number" min={1} max={12} value={f.mes} onChange={(e) => setF({ ...f, mes: +e.target.value })} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
          <div className="flex items-center gap-3">
            <Switch checked={f.alertaAtivo} onCheckedChange={(v) => setF({ ...f, alertaAtivo: v })} />
            <span className="text-sm">Ativar alerta</span>
            <Select value={String(f.diasAntes)} onValueChange={(v) => setF({ ...f, diasAntes: +v })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{[15, 30, 45, 60].map((n) => <SelectItem key={n} value={String(n)}>{n} dias antes</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={() => { if (!f.nome) return toast.error("Nome obrigatório"); add({ ...f, pais, custom: true }); onClose(); toast.success("Data adicionada"); }}>Adicionar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DialogNovaAcao({ open, onClose, add }: { open: boolean; onClose: () => void; add: (a: Omit<AcaoMarketing, "id">) => void; dataPreSel: DataFestiva | null }) {
  const [tipo, setTipo] = useState<AcaoMarketing["tipo"]>("campanha");
  const [f, setF] = useState<Partial<AcaoMarketing>>({ titulo: "", estado: "planeada", descontoTipo: "percentagem", alvo: "todo" });
  const salvar = () => {
    if (!f.titulo) return toast.error("Título obrigatório");
    add({
      tipo, titulo: f.titulo, estado: f.estado || "planeada",
      dataInicio: f.dataInicio, dataFim: f.dataFim, meta: f.meta, notas: f.notas,
      descontoTipo: f.descontoTipo, descontoValor: f.descontoValor, alvo: f.alvo, alvoNotas: f.alvoNotas,
      peca: f.peca, custoProducao: f.custoProducao, regras: f.regras, resultado: f.resultado,
      criadoEm: new Date().toISOString(),
    });
    onClose();
    toast.success("Ação criada");
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova Ação de Marketing</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={tipo} onValueChange={(v) => setTipo(v as AcaoMarketing["tipo"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="campanha">Campanha Sazonal</SelectItem>
              <SelectItem value="promocao">Promoção</SelectItem>
              <SelectItem value="giveaway">Giveaway / Sorteio</SelectItem>
            </SelectContent>
          </Select>
          <div><Label>Título</Label><Input value={f.titulo || ""} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
          {tipo === "campanha" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Início</Label><Input type="date" value={f.dataInicio || ""} onChange={(e) => setF({ ...f, dataInicio: e.target.value })} /></div>
                <div><Label>Fim</Label><Input type="date" value={f.dataFim || ""} onChange={(e) => setF({ ...f, dataFim: e.target.value })} /></div>
              </div>
              <div><Label>Meta / Objetivo</Label><Input value={f.meta || ""} onChange={(e) => setF({ ...f, meta: e.target.value })} placeholder="Vender 15 unidades" /></div>
              <div><Label>Notas</Label><Textarea value={f.notas || ""} onChange={(e) => setF({ ...f, notas: e.target.value })} /></div>
            </>
          )}
          {tipo === "promocao" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Select value={f.descontoTipo} onValueChange={(v) => setF({ ...f, descontoTipo: v as "percentagem" | "fixo" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percentagem">% percentagem</SelectItem><SelectItem value="fixo">€ fixo</SelectItem></SelectContent>
                </Select>
                <Input type="number" placeholder="Valor" value={f.descontoValor ?? ""} onChange={(e) => setF({ ...f, descontoValor: +e.target.value })} />
              </div>
              <Select value={f.alvo} onValueChange={(v) => setF({ ...f, alvo: v as "todo" | "especifico" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todo">Todo o catálogo</SelectItem><SelectItem value="especifico">Produtos específicos</SelectItem></SelectContent>
              </Select>
              {f.alvo === "especifico" && <Input placeholder="Produtos abrangidos" value={f.alvoNotas || ""} onChange={(e) => setF({ ...f, alvoNotas: e.target.value })} />}
            </>
          )}
          {tipo === "giveaway" && (
            <>
              <div><Label>Peça a sortear</Label><Input value={f.peca || ""} onChange={(e) => setF({ ...f, peca: e.target.value })} /></div>
              <div><Label>Custo de produção (€)</Label><Input type="number" value={f.custoProducao ?? ""} onChange={(e) => setF({ ...f, custoProducao: +e.target.value })} /></div>
              <div><Label>Regras</Label><Textarea value={f.regras || ""} onChange={(e) => setF({ ...f, regras: e.target.value })} /></div>
              <div><Label>Resultado / Notas</Label><Textarea value={f.resultado || ""} onChange={(e) => setF({ ...f, resultado: e.target.value })} /></div>
            </>
          )}
          <Button onClick={salvar} className="w-full">Criar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DialogIdeiasIA({ data, onClose, onCriarAcao }: { data: DataFestiva | null; onClose: () => void; onCriarAcao: (titulo: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<string>("");
  const carregar = async () => {
    if (!data) return;
    setLoading(true); setResp("");
    const r = await askAssistant({ data: {
      contexto: `Data festiva: ${data.nome} (${data.dia}/${data.mes}), país ${data.pais}.`,
      messages: [{ role: "user", content: `Dá ideias para o Atelier Tricotin para esta data festiva. Devolve 3 secções curtas em markdown: "Projetos relevantes" (4 ideias de peças de tricotin/amigurumi/crochê), "Ideia de campanha" (1 frase), "Ideia de promoção" (1 frase) e "Ideia de giveaway" (1 frase).` }],
    } });
    setLoading(false);
    if (r.ok) setResp(r.content); else toast.error(r.error);
  };
  return (
    <Dialog open={!!data} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Ideias e Inspirações da IA · {data?.nome}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {!resp && <Button onClick={carregar} disabled={loading} className="w-full">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A gerar…</> : "Gerar ideias com IA"}</Button>}
          {resp && <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border border-border bg-card p-3 text-sm">{resp}</div>}
          {resp && data && <Button variant="outline" onClick={() => onCriarAcao(`${data.nome} · Campanha`)} className="w-full">Criar Ação baseada nesta Data</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}