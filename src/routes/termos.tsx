import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos e Condições — Craft Business Master" },
      { name: "description", content: "Termos e Condições de utilização do Craft Business Master: contrato, uso aceitável, propriedade intelectual, pagamentos e cancelamentos." },
      { property: "og:title", content: "Termos e Condições — Craft Business Master" },
      { property: "og:description", content: "Condições de utilização do Craft Business Master, incluindo pagamentos processados pela Paddle." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Termos,
});

function Termos() {
  return (
    <div className="space-y-6">
      <PageHeader title="Termos e Condições" description="Última atualização: 29 de julho de 2026" />
      <LegalPage>
        <p>
          Estes Termos e Condições regulam a utilização do <strong>Craft Business Master</strong>,
          uma aplicação de gestão para negócios de artesanato, disponibilizada por{" "}
          <strong>Art Fusion</strong> (“nós”, “nosso”). Ao criar conta ou continuar a utilizar a
          aplicação, o utilizador celebra um contrato connosco e aceita estes termos.
        </p>

        <LegalSection title="1. Quem somos e âmbito do serviço">
          <p>
            O Craft Business Master é fornecido pela Art Fusion. O serviço inclui gestão de stock,
            encomendas, clientes, custos e faturação, editores técnicos (tricotin, croché, ponto
            cruz, amigurumi, costura, bordado e gráficos de tricô) e ferramentas de marketing,
            disponibilizados em planos gratuitos e pagos.
          </p>
        </LegalSection>

        <LegalSection title="2. Aceitação e capacidade">
          <p>
            A utilização continuada da aplicação implica a aceitação destes termos e da nossa
            Política de Privacidade. O utilizador declara ter idade legal para contratar e, quando
            age em nome de uma empresa, ter poderes para a vincular. Os dados de registo devem ser
            verdadeiros e mantidos atualizados, e as credenciais de acesso são pessoais e
            confidenciais — o utilizador é responsável pela atividade realizada na sua conta.
          </p>
        </LegalSection>

        <LegalSection title="3. Uso aceitável">
          <p>O utilizador compromete-se a não:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>utilizar o serviço para fins ilícitos ou contrários à lei aplicável;</li>
            <li>praticar fraude, envio de spam ou comunicações não solicitadas;</li>
            <li>violar direitos de propriedade intelectual de terceiros, incluindo padrões, imagens e receitas;</li>
            <li>interferir com a segurança do serviço, nomeadamente através de malware, testes de intrusão, recolha automatizada de dados (scraping) ou tentativas de contornar limites técnicos;</li>
            <li>fazer engenharia inversa, revender ou redistribuir o serviço sem autorização escrita.</li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Propriedade intelectual e conteúdos do utilizador">
          <p>
            A Art Fusion mantém a titularidade do serviço e de toda a propriedade intelectual
            associada (software, interfaces, documentação e marca). É concedido ao utilizador um
            direito limitado, não exclusivo e intransmissível de utilizar a aplicação dentro do
            plano contratado.
          </p>
          <p>
            Os conteúdos que o utilizador carrega (padrões, fotografias, dados de clientes e
            encomendas) continuam a pertencer-lhe. O utilizador concede-nos apenas a licença
            necessária para alojar e processar esses conteúdos com o fim de prestar o serviço.
          </p>
        </LegalSection>

        <LegalSection title="5. Disponibilidade do serviço">
          <p>
            Empenhamo-nos em manter a aplicação disponível e estável, mas não garantimos
            funcionamento ininterrupto ou isento de erros. Poderão ocorrer interrupções para
            manutenção, atualizações ou por causas fora do nosso controlo razoável.
          </p>
        </LegalSection>

        <LegalSection title="6. Pagamentos, subscrições e cancelamentos">
          <p>
            Os planos pagos são cobrados de forma recorrente (mensal ou anual), conforme
            selecionado no momento da compra, e renovam automaticamente até serem cancelados. O
            cancelamento pode ser feito a qualquer momento e o acesso mantém-se até ao final do
            período já pago.
          </p>
          <p>
            As condições de pagamento, faturação, impostos, cancelamento e reembolso são geridas
            pela Paddle. Consulte os{" "}
            <a
              className="underline"
              href="https://www.paddle.com/legal/checkout-buyer-terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Termos de Comprador da Paddle
            </a>{" "}
            e a nossa <Link className="underline" to="/reembolsos">Política de Reembolsos</Link>.
          </p>
        </LegalSection>

        <LegalSection title="7. Vendedor oficial (Merchant of Record)">
          <p>
            O nosso processo de encomenda é conduzido pelo nosso revendedor online Paddle.com. A
            Paddle.com é o Merchant of Record (vendedor oficial) de todas as nossas encomendas. A
            Paddle presta o apoio ao cliente relativo a encomendas e trata das devoluções.
          </p>
        </LegalSection>

        <LegalSection title="8. Suspensão e cessação">
          <p>
            Podemos suspender ou cessar o acesso em caso de incumprimento material destes termos,
            falta de pagamento, risco de segurança ou fraude, ou violações repetidas ou graves das
            regras de uso aceitável. Sempre que possível, avisamos previamente e damos oportunidade
            de correção.
          </p>
          <p>
            Após a cessação, o utilizador dispõe de 30 dias para exportar os seus dados, findos os
            quais estes poderão ser eliminados.
          </p>
        </LegalSection>

        <LegalSection title="9. Garantias e responsabilidade">
          <p>
            Na medida máxima permitida por lei, excluímos garantias implícitas de comercialização e
            adequação a um fim específico. Não somos responsáveis por danos indiretos, lucros
            cessantes, perda de dados ou perda de reputação. A nossa responsabilidade agregada está
            limitada ao montante pago pelo utilizador nos 12 meses anteriores ao facto que originou
            a reclamação. Nada nestes termos exclui a responsabilidade por dolo, fraude, morte ou
            danos pessoais quando a lei não o permita.
          </p>
        </LegalSection>

        <LegalSection title="10. Lei aplicável e alterações">
          <p>
            Estes termos regem-se pela lei portuguesa, sendo competentes os tribunais de Portugal,
            sem prejuízo dos direitos imperativos dos consumidores. Podemos atualizar estes termos;
            alterações relevantes serão comunicadas na aplicação ou por email.
          </p>
          <p>
            Dúvidas:{" "}
            <a className="underline" href="mailto:craftbusinessmaster@gmail.com">
              craftbusinessmaster@gmail.com
            </a>
            .
          </p>
        </LegalSection>
      </LegalPage>
    </div>
  );
}