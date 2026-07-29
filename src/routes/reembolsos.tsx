import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/reembolsos")({
  head: () => ({
    meta: [
      { title: "Política de Reembolsos — Craft Business Master" },
      { name: "description", content: "Garantia de satisfação de 30 dias no Craft Business Master: como pedir reembolso e prazos de processamento." },
      { property: "og:title", content: "Política de Reembolsos — Craft Business Master" },
      { property: "og:description", content: "Garantia de satisfação de 30 dias e instruções para pedir reembolso." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reembolsos,
});

function Reembolsos() {
  return (
    <div className="space-y-6">
      <PageHeader title="Política de Reembolsos" description="Última atualização: 29 de julho de 2026" />
      <LegalPage>
        <p>
          O <strong>Craft Business Master</strong>, fornecido pela <strong>Art Fusion</strong>,
          oferece uma <strong>garantia de satisfação de 30 dias</strong> em todas as subscrições.
        </p>

        <LegalSection title="1. Prazo de reembolso">
          <p>
            Se não ficar satisfeita com a sua compra, pode pedir o reembolso integral até 30 dias
            após a data da encomenda. Este prazo aplica-se tanto a subscrições mensais como anuais,
            e acresce aos direitos legais de livre resolução que possam assistir-lhe.
          </p>
        </LegalSection>

        <LegalSection title="2. Como pedir o reembolso">
          <p>
            Os pagamentos e reembolsos são processados pela nossa parceira de pagamentos, a Paddle,
            que é o vendedor oficial (Merchant of Record) das nossas encomendas. Para pedir um
            reembolso:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              aceda a{" "}
              <a className="underline" href="https://paddle.net" target="_blank" rel="noopener noreferrer">
                paddle.net
              </a>{" "}
              com o email usado na compra e submeta o pedido; ou
            </li>
            <li>
              escreva-nos para{" "}
              <a className="underline" href="mailto:craftbusinessmaster@gmail.com">
                craftbusinessmaster@gmail.com
              </a>{" "}
              e tratamos do pedido consigo.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Prazos de processamento">
          <p>
            Depois de aprovado, o reembolso é devolvido pelo mesmo método de pagamento utilizado na
            compra. O valor costuma ficar disponível em 5 a 10 dias úteis, consoante o banco ou
            emissor do cartão.
          </p>
        </LegalSection>

        <LegalSection title="4. Cancelar a subscrição">
          <p>
            Pode cancelar a renovação a qualquer momento a partir da página de Planos, no botão
            “Gerir subscrição”. O acesso mantém-se até ao final do período já pago e não haverá
            novas cobranças.
          </p>
        </LegalSection>
      </LegalPage>
    </div>
  );
}