# Testes E2E — Acesso Premium

Testes Playwright que validam o gating do Editor de Moodboards
(e das restantes rotas Premium) via `PremiumRoute` e `RouteAccessGuard`.

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

## Cenário positivo (Premium)

O acesso Premium autêntico depende de uma sessão Supabase real com
`profiles.subscription_status = 'premium'`. Para o correr localmente,
define as variáveis `E2E_PREMIUM_EMAIL` e `E2E_PREMIUM_PASSWORD` de um
utilizador de teste com Premium ativo e descomenta o teste marcado com
`test.skip` em `e2e/moodboards-access.spec.ts`.