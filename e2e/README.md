# Testes E2E — Acesso Premium

Testes Playwright que validam o gating do Editor de Moodboards,
dos restantes editores técnicos Premium, a recuperação de scroll e a
personalização da letra dos cabeçalhos.

## Correr localmente

```bash
# 1. Instalar o browser (uma única vez)
bunx playwright install chromium

# 2. Arrancar o dev server noutro terminal
bun run dev

# 3. Executar os testes
bunx playwright test
```

Podes apontar para outro host com `PLAYWRIGHT_BASE_URL=https://... bunx playwright test`.

## Cenários cobertos

- **Negativo (sem sessão / plano Light)**: `/editor-moodboards` mostra o ecrã
  bloqueado (`data-testid="premium-locked"`) com o nome da funcionalidade,
  o plano atual do utilizador, a lista de benefícios Premium e o CTA de
  upgrade que aponta para `/planos#premium`.
- **Guarda de rota**: navegar por URL direto para outras rotas Premium
  (ex. `/contador`, `/conversor-cores`) redireciona para `/` e abre o
  paywall global (`RouteAccessGuard`).
- **Ferramentas Técnicas**: Tricotin, Crochê/Amigurumi, Ponto Cruz e
  Costura só aparecem quando o plano Premium está ativo.
- **Scroll**: bloqueios residuais de `overflow`, `pointer-events`,
  `touch-action` e `data-scroll-locked` são limpos automaticamente.
- **Personalização**: a letra global dos cabeçalhos escolhida em
  Personalização & Configurações aplica-se noutras páginas.

## Cenário positivo (Premium)

O acesso Premium autêntico depende de uma sessão real com plano Premium.
Para o correr contra dados reais, define `E2E_PREMIUM_EMAIL` e
`E2E_PREMIUM_PASSWORD` de um utilizador de teste Premium.

Em dev local, quando essas credenciais não existem, os testes usam um override
local apenas para E2E (`atelier-e2e-plan-override=premium`) para confirmar a UI
Premium sem alterar dados reais.