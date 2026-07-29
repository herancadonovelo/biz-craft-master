import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
  { q: "Como altero o tipo de letra global da aplicação?", a: "Personalização & Configurações → separador Personalização → ‘Tipo de letra dos cabeçalhos’. Escolhe a fonte e aplica-se em todos os cabeçalhos." },
  { q: "Como mudo a cor de fundo do menu lateral?", a: "Personalização → ‘Ajuste fino do menu lateral (OKLCH)’: mexe luminosidade, saturação, matiz e contraste até obteres o tom desejado." },
  { q: "Como calibrar a opacidade das janelas com contorno?", a: "Personalização → ‘Transparência das janelas com contorno’ e usa o slider entre 0% (transparente) e 100% (opaco)." },
  { q: "Como calibrar a opacidade dos botões?", a: "Personalização → ‘Calibrar opacidade dos botões’: sliders independentes para primários, secundários e outline." },
  { q: "Como personalizo a cor do cabeçalho da app?", a: "Personalização → ‘Cabeçalho da aplicação’: escolhe cor de fundo e cor do ícone/texto, ou usa os presets Claro/Escuro/Creme." },
  { q: "Como mudo o tamanho da letra?", a: "Personalização → ‘Tamanhos de letra’: base global, títulos, texto, menu e abas com sliders independentes." },
  { q: "O que é o Modo Preview?", a: "Configurações → Modo Preview mostra a app cheia de dados fictícios sem tocar nos teus dados reais. Sai quando quiseres para voltar ao teu conteúdo." },
  { q: "Como carrego dados de demonstração?", a: "Configurações → ‘Dados locais’ → ‘Carregar dados de demonstração’. Enche todas as categorias com exemplos." },
  { q: "Como apago todos os dados locais?", a: "Configurações → ‘Dados locais’ → ‘Apagar todos os dados’. Confirma para recomeçar do zero." },
  { q: "Como faço backup dos meus dados?", a: "Configurações → Backup & Restauro. Podes exportar tudo em JSON/CSV e restaurar mais tarde." },
  { q: "Como uso o Editor de Moodboards?", a: "Editor de Moodboards: escolhe fundo, arrasta imagens/textos/decorações para a folha A4, ajusta com IA e exporta em PNG ou imprime." },
  { q: "Como uso o Conversor de Cores DMC/Anchor?", a: "Conversor de Cores: escreve o código DMC ou Anchor e obtens o equivalente na outra marca com pré-visualização." },
  { q: "Como uso o Contador de Carreiras & Pontos?", a: "Contador: cria contadores nomeados, incrementa/decrementa com um toque e mantém o registo entre sessões." },
  { q: "Como calculo o cashflow do negócio?", a: "Cashflow lê automaticamente faturação, despesas e encomendas para mostrar o saldo mensal e a evolução." },
  { q: "Como adiciono uma despesa?", a: "Em Despesas escolhe categoria, valor, data e opcionalmente anexa recibo. Fica automaticamente no cashflow." },
  { q: "Como gero uma cotação para um projeto personalizado?", a: "Projeto Personalizado → cria projeto, adiciona materiais e horas, calcula preço e converte em cotação." },
  { q: "Onde vejo o estado das minhas encomendas?", a: "Estado de Encomendas mostra em colunas kanban (Nova/Em produção/Pronta/Enviada/Entregue) e permite mover com drag-and-drop." },
  { q: "Como registo horas de trabalho num projeto?", a: "Em Horas escolhe o projeto, arranca cronómetro ou lança manualmente. O total soma no preço." },
  { q: "Como crio uma campanha de marketing?", a: "Marketing & Campanhas → Nova campanha: nome, canal, orçamento, datas e público-alvo." },
  { q: "Como uso o gerador de conteúdo de marketing?", a: "Marketing de Conteúdo → escreve o tema e a IA gera legendas, hashtags e ideias de posts." },
  { q: "Como conecto o meu Shopify/WooCommerce/Squarespace/Jumpseller?", a: "Sincronização → introduz o URL da loja e o token/API key. As encomendas passam a sincronizar para a app." },
  { q: "Como configuro o Etsy?", a: "Sincronização → Etsy: cola o token, ativa e escuta webhooks de novas encomendas na página Etsy." },
  { q: "Como responder no WhatsApp diretamente da app?", a: "WhatsApp Business → escolhe o contacto, escreve a mensagem ou usa modelos, e envia." },
  { q: "Como uso o assistente de IA?", a: "Assistente → pergunta em linguagem natural sobre o negócio, materiais, receitas, sugestões de preço, etc." },
  { q: "Como personalizo o Instagram?", a: "Instagram → conecta a conta e obtém estatísticas e agendamento de posts." },
  { q: "Como ativo/desativo módulos?", a: "Configurações → Módulos ativos: liga/desliga cada categoria do menu lateral." },
  { q: "Como mudo o meu PIN?", a: "Configurações → Contas & PIN → altera a password ou PIN de acesso." },
  { q: "Como configuro alarmes e toques?", a: "Configurações → Alarmes & toques: escolhe o toque padrão e o comportamento dos alertas." },
  { q: "Como funciona o Wellness Timer?", a: "Wellness Timer avisa-te para fazeres pausas curtas durante longas sessões de trabalho na app." },
  { q: "Como funciona o Craft & Relax Music?", a: "Craft & Relax Music (Premium): player persistente com mixer ambiente para trabalhar concentrada." },
  { q: "Como faço upload da foto do meu negócio?", a: "Perfil do Negócio → carrega o logotipo e a foto de capa; usa também na fatura." },
  { q: "Como imprimo uma cotação?", a: "Na Calculadora, na linha da cotação, clica em Imprimir para exportar em PDF." },
  { q: "Como uso o mural de inspiração?", a: "Mural: fixa imagens e textos numa parede virtual para inspirar novos projetos (Premium)." },
  { q: "Como consulto notificações antigas?", a: "Notificações mostra o histórico completo, marcado como lido/não lido." },
  { q: "Como reponho o assistente de setup?", a: "Configurações → Configuração inicial → volta ao assistente de setup em qualquer momento." },
  { q: "Como fecho a sessão em todos os dispositivos?", a: "Contas & Passwords → ‘Terminar sessão em todos os dispositivos’ força re-login." },
  { q: "O que é o plano Premium e o que inclui?", a: "Plano Premium: acesso a todos os editores técnicos (Tricotin, Crochê, Ponto Cruz, Amigurumi, Costura, Bordado), Moodboards, Conversor de Cores, Contador, Craft & Relax Music, mural e sincronização e-commerce completa." },
  { q: "Como inicio o teste grátis do Premium?", a: "Planos & Subscrições → escolhe Premium e ativa o teste grátis. Podes cancelar antes do fim." },
  { q: "Como cancelo a subscrição?", a: "Planos & Subscrições → gerir subscrição → cancelar. Mantens acesso até ao fim do período pago." },
  { q: "Onde vejo os meus pagamentos?", a: "Planos & Subscrições → histórico de pagamentos com data, valor e recibo descarregável." },
  { q: "Como funciona a auditoria?", a: "Histórico & Auditoria regista todas as ações críticas (criar/editar/apagar) com utilizador e timestamp." },
  { q: "Como uso o portefólio público?", a: "Portefólio → escolhe os projetos a mostrar e obtens um link público para partilhar com clientes." },
  { q: "Como funciona a Biblioteca Digital?", a: "Biblioteca Digital guarda ficheiros digitais (PDF, PNG, moldes, receitas) organizados por categoria." },
  { q: "Como partilho um moodboard com um cliente?", a: "No Editor de Moodboards → Guardar → gera link partilhável ou exporta PNG/PDF." },
  { q: "Como personalizo cores dos botões?", a: "Personalização → ‘Cores gerais’: escolhe cor de fundo e texto para primários, secundários e outline." },
  { q: "Como aparece a imagem de fundo da app?", a: "Personalização → ‘Imagem de fundo’: carrega imagem e ajusta o véu de opacidade." },
  { q: "Como escondo o menu lateral?", a: "No cabeçalho, clica no ícone de máquina de costura para abrir/fechar o menu lateral." },
  { q: "Como volto rapidamente à página anterior a partir do menu lateral?", a: "No topo do menu lateral existe uma seta ‘Voltar’ que fecha o menu e mantém-te onde estavas." },
  { q: "A app funciona offline?", a: "A maioria das funcionalidades usa armazenamento local e funciona offline; a sincronização com serviços externos requer ligação." },
  { q: "Como reporto um bug?", a: "Contacto → envia mensagem com descrição do problema e print, e será respondida em 24-48h úteis." },
  { q: "Como leio a Política de Privacidade?", a: "Menu lateral → Política De Privacidade: explica que dados são guardados, onde e por quanto tempo." },
];

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Ajuda (FAQ) — Craft Business Master" },
      {
        name: "description",
        content:
          "Respostas às perguntas frequentes sobre o Craft Business Master: encomendas, stock, preços, faturação e subscrições.",
      },
      { property: "og:title", content: "Ajuda (FAQ) — Craft Business Master" },
      {
        property: "og:description",
        content: "Perguntas frequentes sobre o funcionamento do Craft Business Master.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://craftbusinessmaster.com/ajuda" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://craftbusinessmaster.com/ajuda" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: AjudaPage,
});

function AjudaPage() {
  const [q, setQ] = useState("");
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const termos = norm(q).split(/\s+/).filter(Boolean);
  const filtrados = useMemo(() => {
    if (!termos.length) return FAQ;
    return FAQ.filter((f) => {
      const hay = norm(`${f.q} ${f.a}`);
      return termos.every((t) => hay.includes(t));
    });
  }, [q]);
  return (
    <div className="space-y-6">
      <PageHeader title="Ajuda (FAQ)" description="Perguntas frequentes sobre o funcionamento da aplicação." />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Procurar pergunta ou palavra-chave…"
          className="pl-9"
          aria-label="Pesquisar no FAQ"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {filtrados.length} de {FAQ.length} perguntas
        </p>
      </div>
      {filtrados.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Sem resultados para “{q}”.
        </div>
      ) : (
        <Accordion type="single" collapsible className="rounded-md border border-border bg-card">
          {filtrados.map((f, i) => (
            <AccordionItem key={i} value={`i${i}`} className="px-4">
              <AccordionTrigger className="text-left font-display">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}