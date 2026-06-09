import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ: { q: string; a: string }[] = [
  { q: "Como crio uma nova encomenda?", a: "Vai a Encomendas → Nova encomenda. Escolhe o cliente, associa um projeto opcional, define prazo e preço. Podes anexar imagens da embalagem e da etiqueta de envio quando preparares a expedição." },
  { q: "Como calculo o preço de uma peça?", a: "Em Calculadora de preço escolhes os materiais, indicas as horas e a margem. O sistema guarda automaticamente cada cálculo como cotação associada ao projeto." },
  { q: "Como converto uma cotação em fatura?", a: "Na Calculadora carrega em ‘Converter em fatura’. É gerado um número de fatura automático (formato FT ano/sequência), o projeto passa a concluído e fica registo de auditoria." },
  { q: "Como adiciono múltiplos fornecedores ao mesmo material?", a: "Em Stock, edita o material e usa a secção ‘Fornecedores alternativos’ para registar fornecedor + preço praticado." },
  { q: "Como aparece a lista de compras?", a: "A categoria Lista de compras agrega automaticamente os materiais com stock 0 (out-of-stock) ou abaixo do mínimo definido (low-on-stock). Podes filtrar por nome." },
  { q: "Como imprimo uma fatura?", a: "Em Faturação, na linha da fatura clica em Imprimir. Abre uma janela com o documento pronto para impressão ou exportação em PDF." },
  { q: "Como mudo a língua da aplicação?", a: "Idioma → escolhe a bandeira. Todo o conteúdo de navegação, títulos e ações é traduzido automaticamente." },
  { q: "Como sincronizo com o meu website ou Instagram?", a: "Vai a Sincronização. Introduz as credenciais ou tokens das plataformas. A sincronização é manual e pode ser ativada/desativada por canal." },
  { q: "Onde vejo o histórico de alterações?", a: "Histórico & auditoria mostra todas as conversões de cotação, atualizações de estado, criação de faturas e outras ações com data e utilizador." },
  { q: "Como crio uma etiqueta de envio?", a: "Em Etiquetas de envio escolhes o cliente, preenches morada, peso e observações, e podes imprimir directamente." },
];

export const Route = createFileRoute("/ajuda")({
  head: () => ({ meta: [{ title: "Ajuda" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Ajuda" description="Perguntas frequentes sobre o funcionamento da aplicação." />
      <Accordion type="single" collapsible className="rounded-md border border-border bg-card">
        {FAQ.map((f, i) => (
          <AccordionItem key={i} value={`i${i}`} className="px-4">
            <AccordionTrigger className="text-left font-display">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  ),
});