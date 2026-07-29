## Tarefa em pausa: páginas legais para ativar pagamentos reais

Estado atual verificado:
- Os produtos (Base/Premium, mensal/anual), o checkout e os webhooks já funcionam em modo de teste.
- A verificação do Paddle está bloqueada: falta publicar e falta o "readiness check", que exige três páginas públicas.
- Existe `/privacidade`, mas está atrás do login e não cumpre os requisitos (não identifica o responsável pelos dados nem menciona o Paddle).
- Não existe página de Termos e Condições nem de Política de Reembolsos.

## O que vou fazer

1. **Nova página `/termos`** — Termos e Condições: identificação do vendedor, declaração de que o Paddle é o Merchant of Record (vendedor oficial), uso aceitável, propriedade intelectual, suspensão de contas e lei aplicável.
2. **Nova página `/reembolsos`** — Política de Reembolsos com prazo de 14 dias, processo de pedido e prazos de devolução. Sem linguagem do tipo "sem reembolsos".
3. **Atualizar `/privacidade`** — identificar o vendedor como responsável pelo tratamento de dados, listar as categorias de dados recolhidos e nomear o Paddle como destinatário de dados.
4. **Tornar as três páginas públicas** — acessíveis sem login (obrigatório para a revisão do Paddle) e ligadas no rodapé/menu de ajuda para o revisor as encontrar.
5. **Metadados SEO** próprios em cada página e verificação de que abrem sem sessão iniciada.

Depois disto: publicar a app e preencher o formulário de verificação no separador Pagamentos (as restantes etapas são automáticas do lado do Paddle).

## Preciso de te confirmar antes de escrever

- Nome legal do vendedor (empresa registada ou o teu nome, se vendes como particular).
- País/morada de faturação e email de apoio ao cliente a indicar nas páginas.

## Notas técnicas

Novas rotas em `src/routes/termos.tsx` e `src/routes/reembolsos.tsx`, ambas adicionadas a `PUBLIC_ROUTES` em `src/components/AuthGate.tsx` juntamente com `/privacidade`. Design alinhado com `/quem-somos` (minimalista, tons pastel, tokens do tema).
