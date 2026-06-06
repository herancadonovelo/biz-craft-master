import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR, precoProjeto } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send } from "lucide-react";

type Msg = { role: "user" | "ia"; texto: string };

export const Route = createFileRoute("/assistente")({
  head: () => ({ meta: [{ title: "Assistente IA" }] }),
  component: () => {
    const store = useStore();
    const [input, setInput] = useState("");
    const [msgs, setMsgs] = useState<Msg[]>([
      { role: "ia", texto: "Olá! Sou o teu assistente. Posso analisar finanças, sugerir preços e dar ordens sobre o atelier. Experimenta perguntar: 'qual o meu lucro?' ou 'que material está em falta?'" },
    ]);

    const responder = (q: string): string => {
      const t = q.toLowerCase();
      const { vendas, materiais, encomendas, projetos, despesas, caixa } = store;
      const receita = vendas.reduce((s, v) => s + v.valor, 0);
      const saidas = caixa.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0);

      if (t.includes("lucro") || t.includes("ganho")) return `Receita ${formatEUR(receita)} − saídas ${formatEUR(saidas)} = lucro de ${formatEUR(receita - saidas)}.`;
      if (t.includes("stock") || t.includes("falta") || t.includes("material")) {
        const baixo = materiais.filter((m) => m.stock < 5).map((m) => `${m.nome} (${m.stock})`).join(", ");
        return baixo ? `Materiais com stock baixo: ${baixo}. Encomenda já para não atrasares projetos.` : "Stock saudável em todos os materiais.";
      }
      if (t.includes("encomenda")) {
        const pend = encomendas.filter((e) => e.estado !== "entregue" && e.estado !== "cancelada").length;
        return `Tens ${pend} encomendas por finalizar de um total de ${encomendas.length}.`;
      }
      if (t.includes("preço") || t.includes("preco") || t.includes("orçamento")) {
        if (projetos.length === 0) return "Cria um projeto primeiro e calculo o preço com 70% de margem.";
        const p = projetos[0];
        return `Por exemplo, "${p.nome}" deveria custar cerca de ${formatEUR(precoProjeto(p, materiais))} (materiais + horas + 70% de margem).`;
      }
      if (t.includes("despesa") || t.includes("custo")) return `Despesas fixas mensais estimadas: ${formatEUR(despesas.reduce((s, d) => s + (d.periodicidade === "mensal" ? d.valor : d.valor / 12), 0))}.`;
      if (t.includes("ordem") || t.includes("fazer") || t.includes("hoje")) {
        return "Sugestão de ordens para hoje:\n1. Confirmar materiais em falta.\n2. Adiantar 1 encomenda em produção.\n3. Publicar 1 peça em destaque no Instagram.\n4. Registar horas trabalhadas no fim do dia.";
      }
      return "Posso ajudar com: lucro, stock, encomendas, preços, despesas, e dar uma lista de tarefas para hoje. Reformula a tua pergunta com uma destas palavras.";
    };

    const enviar = () => {
      if (!input.trim()) return;
      const q = input;
      setMsgs((m) => [...m, { role: "user", texto: q }, { role: "ia", texto: responder(q) }]);
      setInput("");
    };

    const sugestoes = ["Qual o meu lucro?", "Que material está em falta?", "Quantas encomendas tenho?", "Dá-me ordens para hoje"];

    return (
      <div className="space-y-6">
        <PageHeader title="Assistente IA" description="O teu copiloto de gestão do atelier." />
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
                  {m.role === "ia" && <Sparkles className="mb-1 inline h-3 w-3 text-accent" />} {m.texto}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Pergunta-me alguma coisa…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviar()} />
            <Button onClick={enviar}><Send className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">Versão local com regras simples — podemos ligar a um modelo IA real quando quiseres.</p>
        </CardContent></Card>
      </div>
    );
  },
});