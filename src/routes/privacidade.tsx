import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Craft Business Master" },
      { name: "description", content: "Como a Art Fusion recolhe, utiliza, partilha e protege os dados dos utilizadores do Craft Business Master." },
      { property: "og:title", content: "Política de Privacidade — Craft Business Master" },
      { property: "og:description", content: "Responsável pelo tratamento, categorias de dados, base legal, partilha e direitos RGPD." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Política de Privacidade" description="Última atualização: 29 de julho de 2026" />
      <Card>
        <CardContent className="prose prose-sm max-w-none space-y-4 p-6 text-foreground dark:prose-invert">
          <p><strong>Responsável pelo tratamento:</strong> Art Fusion, entidade que disponibiliza a aplicação Craft Business Master, é a responsável pelo tratamento (data controller) dos dados pessoais descritos nesta política. Contacto: <a className="underline" href="mailto:craftbusinessmaster@gmail.com">craftbusinessmaster@gmail.com</a>. Relativamente aos dados dos clientes finais que o utilizador insere na aplicação, o utilizador é o responsável pelo tratamento e a Art Fusion atua como subcontratante.</p>
          <p>A sua privacidade é de extrema importância para nós. Esta Política de Privacidade explica como a nossa aplicação de gestão de negócios recolhe, utiliza, armazena, partilha e protege as informações dos utilizadores da aplicação ("Utilizadores" ou "Clientes Comerciais") e, por conta destes, os dados dos clientes finais dos seus respetivos negócios ("Clientes Finais").</p>
          <p>Ao utilizar a aplicação, concorda com as práticas descritas nesta política.</p>
          <h2 className="font-display text-lg font-semibold">1. INFORMAÇÕES QUE RECOLHEMOS</h2>
          <p>Para fornecer uma experiência de gestão completa e permitir a sincronização com canais externos, recolhemos e processamos os seguintes dados:</p>
          <h3 className="font-semibold">A. Dados de Conta e Gestão do Utilizador (Cliente Comercial)</h3>
          <p><strong>Informações de Registo:</strong> Nome, endereço de e-mail, número de telefone e dados de autenticação.</p>
          <p><strong>Dados de Faturação e Pagamento:</strong> Informações necessárias para processar assinaturas ou pagamentos da aplicação (sincronizados em segurança através do nosso website).</p>
          <h3 className="font-semibold">B. Dados do Negócio e Operações (Armazenados na Nuvem)</h3>
          <p>Como plataforma de gestão, armazenamos na nuvem as informações que insere para gerir o seu negócio, o que inclui:</p>
          <ul className="list-disc pl-5">
            <li><strong>Gestão de Stock:</strong> Listagem de produtos, materiais, quantidades e fornecedores.</li>
            <li><strong>Encomendas e Vendas:</strong> Histórico de compras, valores e status de entrega.</li>
            <li><strong>Marketing e Relatórios:</strong> Dados de desempenho e métricas internas do seu negócio.</li>
          </ul>
          <h3 className="font-semibold">C. Dados dos Clientes Finais (Processados em nome do Utilizador)</h3>
          <p>Para que possa gerir o seu negócio, a aplicação processa dados dos seus clientes, tais como:</p>
          <ul className="list-disc pl-5">
            <li><strong>Dados de Identificação e Entrega:</strong> Nomes e moradas para envio de encomendas.</li>
            <li><strong>Canais de Contacto:</strong> E-mail e número de telefone.</li>
          </ul>
          <h3 className="font-semibold">D. Dados de Integração e Sincronização (Website, Redes Sociais e E-mail)</h3>
          <p>Quando opta por sincronizar a aplicação com plataformas externas (como o seu Website, Instagram ou Contas de E-mail):</p>
          <p><strong>Comunicações e Conversas:</strong> Recolhemos e armazenamos o histórico de mensagens e conversas trocadas com os clientes através do Instagram e e-mail. Estas informações são processadas estritamente para centralizar o seu atendimento ao cliente e apoiar a gestão do negócio.</p>
          <p><strong>Sincronização de Dados:</strong> Informações de encomendas ou contactos gerados no seu website são importados automaticamente para a aplicação.</p>
          <h2 className="font-display text-lg font-semibold">2. COMO UTILIZAMOS AS INFORMAÇÕES</h2>
          <ul className="list-disc pl-5">
            <li>Prestação, manutenção e melhoria de todas as funcionalidades da aplicação.</li>
            <li>Processamento de pagamentos e gestão de assinaturas.</li>
            <li>Sincronização em tempo real entre a aplicação, o seu website, e-mail e Instagram.</li>
            <li>Suporte técnico e atendimento ao cliente.</li>
            <li>Envio de comunicações importantes sobre atualizações de segurança ou alterações nos termos de serviço.</li>
          </ul>
          <h3 className="font-semibold">Base legal</h3>
          <ul className="list-disc pl-5">
            <li><strong>Execução do contrato:</strong> criação de conta, prestação do serviço, faturação e apoio ao cliente.</li>
            <li><strong>Interesse legítimo:</strong> segurança, prevenção de fraude, deteção de abusos e melhoria do produto.</li>
            <li><strong>Consentimento:</strong> comunicações de marketing e ligação a integrações externas (podendo ser retirado a qualquer momento).</li>
            <li><strong>Obrigação legal:</strong> conservação de registos contabilísticos e fiscais.</li>
          </ul>
          <h2 className="font-display text-lg font-semibold">3. SEGURANÇA E ARMAZENAMENTO NA NUVEM</h2>
          <p><strong>Segregação de Dados:</strong> Garantimos que todos os dados do seu negócio (encomendas, stock, conversas) estão completamente segregados e isolados. Nenhum outro utilizador da aplicação terá acesso às suas informações operacionais.</p>
          <p><strong>Alojamento Seguro:</strong> Todos os dados são armazenados em servidores na nuvem que cumprem elevados padrões de segurança e encriptação.</p>
          <p><strong>Retenção:</strong> Os dados serão conservados enquanto a sua conta estiver ativa ou conforme necessário para fornecer os serviços. Pode solicitar a eliminação dos seus dados a qualquer momento.</p>
          <h2 className="font-display text-lg font-semibold">4. PARTILHA DE DADOS</h2>
          <p>Não vendemos nem partilhamos dados comerciais ou pessoais com terceiros para fins publicitários. Os dados apenas são partilhados nas seguintes condições:</p>
          <ul className="list-disc pl-5">
            <li><strong>Prestadores de Serviços (Subprocessadores):</strong> Com empresas terceiras que nos ajudam a manter a aplicação a funcionar (como fornecedores de alojamento na nuvem e processadores de pagamento seguros).</li>
            <li><strong>Paddle.com (Merchant of Record):</strong> a Paddle é o vendedor oficial das nossas encomendas e recebe os dados necessários para venda, gestão de subscrições, pagamentos, faturação e cumprimento de obrigações fiscais.</li>
            <li><strong>Consultores profissionais:</strong> apoio jurídico e contabilístico, quando necessário.</li>
            <li><strong>Obrigações Legais:</strong> Quando exigido por lei ou por autoridades competentes.</li>
          </ul>
          <p><strong>Transferências internacionais:</strong> alguns destes prestadores podem tratar dados fora do EEE. Nesses casos, as transferências assentam em decisões de adequação ou em Cláusulas Contratuais-Tipo da Comissão Europeia.</p>
          <h2 className="font-display text-lg font-semibold">5. OS SEUS DIREITOS (RGPD)</h2>
          <ul className="list-disc pl-5">
            <li>Aceder, retificar ou atualizar os seus dados pessoais.</li>
            <li>Solicitar a eliminação definitiva dos seus dados dos nossos servidores na nuvem.</li>
            <li>Exportar os dados do seu negócio (portabilidade).</li>
            <li>Retirar o consentimento para integrações (como desconectar o Instagram ou o e-mail) a qualquer momento.</li>
          </ul>
          <p>Tem ainda direito a limitar ou opor-se ao tratamento e a apresentar reclamação junto da autoridade de controlo (em Portugal, a CNPD). Para exercer qualquer destes direitos, escreva para <a className="underline" href="mailto:craftbusinessmaster@gmail.com">craftbusinessmaster@gmail.com</a> — respondemos no prazo máximo de um mês.</p>
          <h2 className="font-display text-lg font-semibold">6. COOKIES</h2>
          <p>Utilizamos apenas cookies e armazenamento local essenciais ao funcionamento da aplicação: manutenção da sessão iniciada, preferências de idioma, moeda e tema. Não usamos cookies de publicidade. Pode limpar estes dados a qualquer momento nas definições do seu navegador, ainda que isso implique terminar a sessão.</p>
          <h2 className="font-display text-lg font-semibold">7. ALTERAÇÕES A ESTA POLÍTICA</h2>
          <p>Poderemos atualizar esta Política de Privacidade periodicamente para refletir mudanças na aplicação ou por motivos legais. Notificaremos os utilizadores sobre quaisquer alterações significativas através da aplicação ou por e-mail.</p>
        </CardContent>
      </Card>
    </div>
  ),
});