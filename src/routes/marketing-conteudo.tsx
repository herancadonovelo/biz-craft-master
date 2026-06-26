import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, formatEUR, type DataFestiva } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Calendar, Sparkles, Loader2, CalendarHeart, Palette as PaletteIcon, Save, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { askAssistant } from "@/lib/ai.functions";

const PAISES = ["Portugal", "Brasil", "Angola", "Internacional"];

export const Route = createFileRoute("/marketing-conteudo")({
  head: () => ({ meta: [{ title: "Marketing e Conteúdo — Atelier Tricotin" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing e Conteúdo"
        description="Campanhas, métricas, persona do comprador e atalhos criativos — tudo num só lugar."
      />
      <Tabs defaultValue="campanhas">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="campanhas">Campanhas e Métricas</TabsTrigger>
          <TabsTrigger value="persona">Perfil do Comprador &amp; Mercado</TabsTrigger>
          <TabsTrigger value="atalhos">Atalhos de Planeamento</TabsTrigger>
        </TabsList>

        <TabsContent value="campanhas" className="space-y-6 pt-4">
          <TabCampanhas />
        </TabsContent>
        <TabsContent value="persona" className="space-y-6 pt-4">
          <TabPersona />
        </TabsContent>
        <TabsContent value="atalhos" className="space-y-6 pt-4">
          <TabAtalhos />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ------------------------- Tab 1: Campanhas e Métricas -------------------------
function TabCampanhas() {
  const { campanhas, vendas, datasFestivas, add, update, remove } = useStore();
  const [form, setForm] = useState({ nome: "", canal: "Instagram", custo: 0, alcance: 0, conversoes: 0, data: new Date().toISOString().slice(0, 10) });
  const [pais, setPais] = useState("Portugal");
  const [detalheData, setDetalheData] = useState<DataFestiva | null>(null);

  const totalCusto = campanhas.reduce((s, c) => s + c.custo, 0);
  const totalConv = campanhas.reduce((s, c) => s + c.conversoes, 0);
  const receita = vendas.reduce((s, v) => s + v.valor, 0);
  const roi = totalCusto ? (((receita - totalCusto) / totalCusto) * 100).toFixed(0) : "—";

  const datas = useMemo(
    () => datasFestivas.filter((d) => d.pais === pais || d.pais === "Internacional"),
    [datasFestivas, pais]
  );

  const hoje = new Date();
  const diasAte = (d: DataFestiva) => {
    const ano = hoje.getFullYear();
    let alvo = new Date(ano, d.mes - 1, d.dia);
    if (alvo < hoje) alvo = new Date(ano + 1, d.mes - 1, d.dia);
    return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Investido" value={formatEUR(totalCusto)} />
        <Kpi label="Conversões" value={String(totalConv)} />
        <Kpi label="Receita" value={formatEUR(receita)} />
        <Kpi label="ROI" value={`${roi}%`} />
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">Registar campanha</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2"><Label>Nome campanha</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Canal</Label><Input value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })} /></div>
          <div><Label>Custo (€)</Label><Input type="number" value={form.custo} onChange={(e) => setForm({ ...form, custo: +e.target.value })} /></div>
          <div><Label>Alcance</Label><Input type="number" value={form.alcance} onChange={(e) => setForm({ ...form, alcance: +e.target.value })} /></div>
          <div><Label>Conversões</Label><Input type="number" value={form.conversoes} onChange={(e) => setForm({ ...form, conversoes: +e.target.value })} /></div>
          <div className="md:col-span-6">
            <Button onClick={() => {
              if (!form.nome) return toast.error("Nome obrigatório");
              add("campanhas", form);
              setForm({ nome: "", canal: "Instagram", custo: 0, alcance: 0, conversoes: 0, data: new Date().toISOString().slice(0, 10) });
              toast.success("Campanha registada");
            }}><Plus className="mr-1 h-4 w-4" />Registar campanha</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Histórico de campanhas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Campanha</TableHead><TableHead>Canal</TableHead><TableHead>Alcance</TableHead><TableHead>Conv.</TableHead><TableHead className="text-right">Custo</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {campanhas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.data}</TableCell>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.canal}</TableCell>
                  <TableCell>{c.alcance.toLocaleString("pt-PT")}</TableCell>
                  <TableCell>{c.conversoes}</TableCell>
                  <TableCell className="text-right font-display">{formatEUR(c.custo)}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("campanhas", c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {campanhas.length === 0 && <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Sem campanhas registadas.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display">Calendário Festivo</CardTitle>
          <Select value={pais} onValueChange={setPais}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{PAISES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
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
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setDetalheData(d)}>
                        <Sparkles className="mr-1 h-4 w-4" />Ideias IA
                      </Button>
                      {d.custom && <Button size="sm" variant="ghost" onClick={() => remove("datasFestivas", d.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <DialogIdeiasIA data={detalheData} onClose={() => setDetalheData(null)} />
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent><div className="font-display text-2xl font-semibold">{value}</div></CardContent>
    </Card>
  );
}

function DialogIdeiasIA({ data, onClose }: { data: DataFestiva | null; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<string>("");
  const carregar = async () => {
    if (!data) return;
    setLoading(true); setResp("");
    const r = await askAssistant({ data: {
      contexto: `Data festiva: ${data.nome} (${data.dia}/${data.mes}), país ${data.pais}.`,
      messages: [{ role: "user", content: `Dá ideias para o Atelier Tricotin para esta data festiva. Devolve 3 secções curtas em markdown: "Projetos relevantes" (4 ideias), "Ideia de campanha" (1 frase), "Ideia de promoção" (1 frase) e "Ideia de giveaway" (1 frase).` }],
    } });
    setLoading(false);
    if (r.ok) setResp(r.content); else toast.error(r.error);
  };
  return (
    <Dialog open={!!data} onOpenChange={(o) => { if (!o) { onClose(); setResp(""); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Ideias e Inspirações da IA · {data?.nome}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {!resp && <Button onClick={carregar} disabled={loading} className="w-full">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A gerar…</> : "Gerar ideias com IA"}</Button>}
          {resp && <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border border-border bg-card p-3 text-sm">{resp}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------- Tab 2: Persona & Mercado -------------------------
function TabPersona() {
  const { marketingInfo, setMarketingInfo } = useStore();
  const [local, setLocal] = useState(marketingInfo);

  const save = () => { setMarketingInfo(local); toast.success("Informação guardada"); };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Perfil do Comprador Ideal (Persona)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Quem é o meu cliente?</Label>
            <Textarea
              rows={3}
              placeholder="Ex.: Mulher 30-55 anos, mãe ou avó, sensível a artesanato genuíno…"
              value={local.personaQuem}
              onChange={(e) => setLocal({ ...local, personaQuem: e.target.value })}
            />
          </div>
          <div>
            <Label>Quais as suas maiores dificuldades / desejos?</Label>
            <Textarea
              rows={3}
              placeholder="Ex.: Procura presentes únicos e com significado; quer apoiar pequenos negócios…"
              value={local.personaDificuldades}
              onChange={(e) => setLocal({ ...local, personaDificuldades: e.target.value })}
            />
          </div>
          <div>
            <Label>O que ela mais valoriza no meu artesanato?</Label>
            <Textarea
              rows={3}
              placeholder="Ex.: Cores naturais, embalagem cuidada, possibilidade de personalizar…"
              value={local.personaValoriza}
              onChange={(e) => setLocal({ ...local, personaValoriza: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Análise de Mercado e Tendências</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Notas livres sobre concorrência, tendências e hashtags</Label>
          <Textarea
            rows={10}
            placeholder={"• Concorrente X: lançou coleção de amigurumi de animais marinhos\n• Tendência: cores terrosas, tons pastel\n• Hashtags fortes: #amigurumipt #tricotin #handmadewithlove\n• Produtos que estão a vender: porta-chaves, mini-mascotes"}
            value={local.mercadoNotas}
            onChange={(e) => setLocal({ ...local, mercadoNotas: e.target.value })}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save}><Save className="mr-1 h-4 w-4" />Guardar alterações</Button>
      </div>
    </>
  );
}

// ------------------------- Tab 3: Atalhos -------------------------
function TabAtalhos() {
  const atalhos = [
    {
      to: "/calendario",
      titulo: "Abrir Calendário Editorial",
      descricao: "Planeia publicações, lançamentos e prazos no calendário com alarmes da app.",
      icon: CalendarHeart,
      cor: "from-primary/10 to-primary/0",
    },
    {
      to: "/moodboards",
      titulo: "Ideias de Fotografia e Inspiração",
      descricao: "Abre os moodboards para reunir referências visuais, cores e enquadramentos.",
      icon: PaletteIcon,
      cor: "from-accent/30 to-accent/0",
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {atalhos.map((a) => (
        <Link key={a.to} to={a.to} className="group">
          <Card className={`h-full bg-gradient-to-br ${a.cor} transition hover:border-primary`}>
            <CardContent className="flex flex-col gap-3 p-6">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                <a.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{a.titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.descricao}</p>
              </div>
              <span className="mt-2 text-xs font-medium uppercase tracking-wider text-primary group-hover:underline">Abrir →</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}