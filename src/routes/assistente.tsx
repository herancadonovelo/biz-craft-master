import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useStore, formatEUR, precoProjeto, custoMateriais } from "@/lib/store";
import { askAssistant } from "@/lib/ai.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/assistente")({
  head: () => ({ meta: [{ title: "Assistente IA" }] }),
  component: () => {
    const store = useStore();
    const ask = useServerFn(askAssistant);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([
      { role: "assistant", content: "Olá! Sou o teu assistente IA. Tenho acesso aos teus dados do atelier — encomendas, materiais, projetos, clientes e finanças. Pergunta-me o que quiseres ou pede ordens para hoje." },
    ]);

    const buildContexto = () => {
      const { vendas, materiais, encomendas, projetos, despesas, caixa, clientes, fornecedores, horas, todos, faturas, design } = store;
      const receita = vendas.reduce((s, v) => s + v.valor, 0);
      const saidas = caixa.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0);
      const despesasMensais = despesas.reduce((s, d) => s + (d.periodicidade === "mensal" ? d.valor : d.valor / 12), 0);
      return [
        `Negócio: ${design.nomeNegocio}. Preço-hora base: ${formatEUR(design.precoHoraBase)}. Margem por defeito: 70%.`,
        `Finanças: receita total ${formatEUR(receita)}, saídas ${formatEUR(saidas)}, lucro ${formatEUR(receita - saidas)}, despesas fixas mensais estimadas ${formatEUR(despesasMensais)}.`,
        `Clientes (${clientes.length}): ${clientes.map((c) => `${c.nome}${c.email ? ` <${c.email}>` : ""}`).join("; ") || "nenhum"}.`,
        `Fornecedores (${fornecedores.length}): ${fornecedores.map((f) => f.nome).join("; ") || "nenhum"}.`,
        `Materiais em stock (${materiais.length}):\n${materiais.map((m) => `- ${m.nome}: ${m.stock} ${m.unidade} @ ${formatEUR(m.precoCompra)}/${m.unidade}`).join("\n") || "sem materiais"}`,
        `Projetos (${projetos.length}):\n${projetos.map((p) => `- ${p.nome} [${p.estado}] custoMat=${formatEUR(custoMateriais(p, materiais))} horas=${p.horasTrabalhadas}h preçoFinal≈${formatEUR(precoProjeto(p, materiais))}`).join("\n") || "sem projetos"}`,
        `Encomendas (${encomendas.length}):\n${encomendas.map((e) => `- ${e.descricao} [${e.estado}] prazo=${e.prazo ?? "—"} preço=${formatEUR(e.preco)}`).join("\n") || "sem encomendas"}`,
        `Registos de horas: ${horas.reduce((s, h) => s + h.horas, 0)}h em ${horas.length} registos.`,
        `Faturação: ${faturas.length} faturas, total ${formatEUR(faturas.reduce((s, f) => s + f.valor, 0))}.`,
        `Tarefas (${todos.length}): ${todos.filter((t) => !t.feito).length} por fazer.`,
      ].join("\n\n");
    };

    const enviar = async () => {
      if (!input.trim()) return;
      const q = input.trim();
      const novo: Msg[] = [...msgs, { role: "user", content: q }];
      setMsgs(novo);
      setInput("");
      setLoading(true);
      try {
        const res = await ask({
          data: {
            messages: novo.map((m) => ({ role: m.role, content: m.content })),
            contexto: buildContexto(),
          },
        });
        if (res.ok) {
          setMsgs((m) => [...m, { role: "assistant", content: res.content || "(sem resposta)" }]);
        } else {
          toast.error(res.error);
        }
      } catch (e) {
        toast.error("Erro a contactar o assistente.");
      } finally {
        setLoading(false);
      }
    };

    const sugestoes = ["Qual o meu lucro este mês?", "Que material está em falta?", "Dá-me ordens para hoje", "Qual o preço sugerido para uma manta nova?"];

    return (
      <div className="space-y-6">
        <PageHeader title="Assistente IA" description="Copiloto IA com acesso aos teus dados do atelier." />
        <Card><CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => { setInput(s); }}>{s}</Badge>
            ))}
          </div>
          <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-md border border-border bg-muted/30 p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] whitespace-pre-line rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"}`}>
                  {m.role === "assistant" && <Sparkles className="mb-1 inline h-3 w-3 text-accent" />} {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="inline h-3 w-3 animate-spin" /> a pensar…
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Pergunta-me alguma coisa…" value={input} disabled={loading} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviar()} />
            <Button onClick={enviar} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
          </div>
          <p className="text-xs text-muted-foreground">Ligado a Lovable AI · respostas baseadas nos teus dados em tempo real.</p>
        </CardContent></Card>
      </div>
    );
  },
});