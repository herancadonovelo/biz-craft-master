## Objetivo

Uma área de **Reembolsos e Cancelamentos** para as subscrições da app: emitir reembolsos totais ou parciais, cancelar subscrições, guardar o histórico com motivo, e atualizar automaticamente o estado da encomenda/subscrição — refletindo o valor devolvido no cashflow e na fatura correspondente.

## Estado atual (verificado)

- As subscrições já são gravadas na tabela `subscriptions` e os eventos de faturação em `billing_events`, alimentados pelo webhook de pagamentos, que hoje trata criação, atualização, cancelamento, pagamento concluído e pagamento falhado.
- Não existe qualquer tratamento de reembolsos: nem eventos, nem histórico, nem reflexo nas vendas/faturas locais.
- Não existe tabela de papéis (admin), pelo que hoje não há forma segura de restringir uma área de gestão de reembolsos.

## O que vai ser construído

### 1. Papel de administrador (pré-requisito de segurança)

Uma tabela separada de papéis (`user_roles`) com função de verificação no servidor, e a tua conta marcada como administradora. Só administradores conseguem abrir a página de reembolsos e executar as ações — verificado no servidor, não apenas no ecrã.

### 2. Histórico de reembolsos e cancelamentos

Nova tabela `refunds` com: subscrição e transação associadas, utilizador, tipo (reembolso total, reembolso parcial, cancelamento), valor e moeda, motivo pré-definido, nota livre, estado (pendente / aprovado / recusado / concluído), quem pediu, quando, e ambiente (teste ou real).

**Motivos pré-definidos:** duplicado, cobrança indevida, insatisfação com o serviço, problema técnico, pedido do cliente, fraude/disputa, outro (com campo de texto obrigatório quando "outro").

### 3. Página "Reembolsos e Cancelamentos"

Nova rota de gestão com:
- **Lista de encomendas/pagamentos** — cliente, plano, valor, data, estado atual, valor já reembolsado.
- **Ação Reembolsar** — escolha entre total ou parcial, com validação de que o parcial nunca excede o valor ainda não devolvido; motivo obrigatório; possibilidade de vários reembolsos parciais na mesma encomenda.
- **Ação Cancelar subscrição** — imediato ou no fim do período pago, com motivo.
- **Histórico** — separador com todos os registos, filtros por estado, motivo e período, e totais reembolsados.

### 4. Atualização automática de estado

- Ao emitir um reembolso, o pedido é enviado ao processador de pagamentos e o registo fica em "pendente".
- Quando o processador confirma (por evento recebido automaticamente), o registo passa a "concluído", o estado da encomenda passa a **reembolsada** ou **parcialmente reembolsada**, e a subscrição é atualizada.
- Cancelamentos atualizam a subscrição para "cancelada", mantendo o acesso até ao fim do período pago quando aplicável.
- Tudo fica também registado em `billing_events`, para a linha temporal já existente.

### 5. Reflexo financeiro

Cada reembolso confirmado gera automaticamente:
- uma **venda negativa** com a data do reembolso, visível no cashflow e nos relatórios;
- a **fatura associada** passa ao estado **reembolsada** (ou **parcialmente reembolsada**, guardando o valor devolvido).

Um reembolso já refletido nunca é lançado duas vezes, mesmo que o mesmo evento chegue repetido.

### 6. Emails

Email automático ao cliente a confirmar o reembolso (valor e prazo estimado de 5 a 10 dias úteis) e a confirmar o cancelamento — usando a infraestrutura de emails já existente.

### 7. Testes

- Testes unitários para o cálculo de valor reembolsável, validação de reembolso parcial, mapeamento de estados e proteção contra duplicados.
- Teste ponta a ponta que confirma que a página está bloqueada para quem não é administrador e que o fluxo de reembolso mostra o histórico atualizado.

## Detalhes técnicos

- **Base de dados:** tabelas `user_roles` e `refunds`, funções de segurança `has_role` e verificação de valor reembolsável, políticas de acesso restritas (o próprio utilizador vê os seus reembolsos; administradores gerem tudo; escritas de confirmação só pelo servidor).
- **Servidor:** funções autenticadas para listar pagamentos, emitir reembolso (via API de ajustes do processador) e cancelar subscrição, todas com verificação de papel de administrador antes de qualquer ação.
- **Webhook:** subscrever e tratar os eventos de ajuste/reembolso e de cancelamento, atualizando `refunds`, `subscriptions` e `billing_events` de forma idempotente.
- **Frontend:** nova rota protegida, reutilizando os componentes de tabela, diálogo e separadores já usados no resto da app; o lançamento da venda negativa e a atualização da fatura acontecem na store local do negócio ao sincronizar.

## Fora de âmbito

Reembolsos das encomendas dos teus clientes de artesanato (módulo Encomendas) — este plano cobre apenas as subscrições da app, conforme indicaste.
