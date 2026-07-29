import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TITLE = "Como precificar artesanato: o guia completo para lucrar com o seu atelier";
const DESCRIPTION =
  "Aprenda a precificar artesanato com a fórmula Materiais + Tempo + Margem de lucro, e descubra por que cada componente é essencial para um atelier sustentável.";
const URL = "https://craftbusinessmaster.com/guia-precificacao";

export const Route = createFileRoute("/guia-precificacao")({
  head: () => ({
    meta: [
      { title: "Como precificar artesanato — Guia completo" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          inLanguage: "pt-PT",
          mainEntityOfPage: URL,
          author: { "@type": "Organization", name: "Craft Business Master" },
          publisher: { "@type": "Organization", name: "Craft Business Master" },
        }),
      },
    ],
  }),
  component: GuiaPrecificacao,
});

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="font-display text-lg">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

function GuiaPrecificacao() {
  return (
    <article className="space-y-6">
      <PageHeader
        title="Como precificar artesanato"
        description="O guia completo para lucrar com o seu atelier, com a fórmula usada na calculadora da aplicação."
      />

      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Precificar artesanato é a decisão que separa um passatempo de um negócio sustentável. A
        maioria dos ateliers cobra abaixo do custo real porque esquece o tempo de trabalho e os
        gastos indiretos. A fórmula abaixo é a mesma que a calculadora do Craft Business Master
        aplica: <strong>Materiais + Tempo + Margem de lucro</strong>.
      </p>

      <Bloco titulo="1. Materiais: o custo que se vê">
        <p>
          Some o custo de tudo o que entra na peça — fios, tecidos, enchimento, botões, etiquetas e
          embalagem — usando o preço por unidade realmente consumida, não o preço do rolo inteiro.
          Inclua desperdício (5% a 10%) e portes de compra rateados.
        </p>
        <p>
          Manter o stock atualizado é o que torna este número fiável: cada material registado com
          preço de compra alimenta automaticamente o custo da peça.
        </p>
      </Bloco>

      <Bloco titulo="2. Tempo: o custo que quase todos esquecem">
        <p>
          Defina um valor/hora para o seu trabalho e multiplique pelas horas reais da peça,
          incluindo preparação, acabamentos e fotografia. Se não pagar o seu próprio tempo, o
          atelier cresce e o rendimento não.
        </p>
        <p>
          Acrescente aqui os custos fixos rateados (eletricidade, ferramentas, comissões de
          plataforma, taxas de pagamento) — normalmente 10% a 20% do custo total.
        </p>
      </Bloco>

      <Bloco titulo="3. Margem de lucro: o que permite crescer">
        <p>
          A margem não é o seu salário — esse já está no tempo. É o que financia novos materiais,
          equipamento, marketing e imprevistos. Uma margem saudável no artesanato situa-se entre 20%
          e 50%, consoante a exclusividade da peça e o posicionamento da marca.
        </p>
        <p>
          Preço final = (Materiais + Tempo + Custos fixos) × (1 + margem). Para venda a lojas
          (grossista), parta deste valor e trabalhe com um preço de retalho 2x superior.
        </p>
      </Bloco>

      <Bloco titulo="Erros frequentes ao precificar artesanato">
        <p>
          Copiar o preço da concorrência sem conhecer os custos dela; baixar preços para vender mais
          (vende-se mais e ganha-se menos); esquecer taxas de marketplace e portes; e nunca rever os
          preços quando os materiais sobem.
        </p>
      </Bloco>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/calculadora">Calcular o preço de uma peça</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/planos">Ver planos</Link>
        </Button>
      </div>
    </article>
  );
}