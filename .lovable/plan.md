# Plano — Blocos 1, 3, 4 e 5

Vou entregar por ordem, num único ciclo de implementação. Cada bloco fica funcional de forma independente.

## 1. Auth & Login

- **AuthGate reforçado**: enquanto `loading` estiver ativo em qualquer rota que não seja pública, mostrar overlay de verificação (já existe) e **bloquear render da sidebar/menu lateral** até haver `user`. Adicionar guarda no layout que envolve o `AppSidebar` para não montar até `user && !loading`.
- **Sidebar bloqueada sem login**: no root/layout, envolver o `SidebarProvider`/`AppSidebar` num check `user ? <Sidebar/> : null`, evitando qualquer flash.
- **Google OAuth**:
  - Confirmar `prompt: "select_account"` (já existe em `auth.tsx`).
  - Detectar cancelamento vs erro real: o erro "sign in was cancelled" vem quando a popup é fechada; passar a mostrar toast informativo em vez de erro vermelho e não bloquear o botão.
  - Mensagens específicas por código: `popup_closed`, `network`, `invalid_redirect`, `provider_disabled`, fallback genérico só como último recurso.
  - Logs detalhados via `logSessionEvent`: `oauth_start`, `oauth_redirect`, `oauth_callback_received`, `oauth_session_ready`, `oauth_failed` (com motivo).
- **Email/password**: melhorar tratamento de erro (mensagens PT claras: credenciais inválidas, email não confirmado, etc.).
- **Rodapé/splash**: já corrigido.

## 3. Sync local (offline)

- Introduzir camada de persistência local usando `zustand/middleware/persist` no `useStore` (localStorage), com as mesmas `PERSIST_KEYS` já definidas em `SupabaseSync`.
- Ordem de hidratação: primeiro carrega do local (instantâneo), depois faz merge com o cloud quando a sessão fica pronta. Estratégia de merge: cloud vence se `updated_at` do cloud for mais recente; caso contrário, faz push do local.
- Indicador na barra de sync passa a mostrar 3 estados: `Local`, `Sincronizando`, `Sincronizado (nuvem+local)`.
- Botão manual "Forçar sincronização" nas Configurações.

## 4. Reset design default

- Capturar snapshot dos tokens atuais (cores, tipografia, radius, sombras) em `src/lib/design-defaults.ts` como constante imutável — estes são os defaults "de fábrica" da app tal como está hoje.
- Na página de personalização/design, adicionar card **"Personalização padrão"** com botão **"Restaurar design default"** que:
  - Aplica os valores de `design-defaults.ts` ao store `design`.
  - Confirma via dialog antes de aplicar.
  - Mostra toast de sucesso.
- Garantir que o store `design` inicializa a partir destes defaults quando não há valor guardado.

## 5. Editor de moldes de tricotin

Em `src/routes/editor-moldes.tsx` (ou equivalente atual):

- **Remover** a UI de visualização dos ângulos criados nos vértices.
- **Toolbar de desenho** com 3 modos toggle:
  - **Linha recta** — desenha segmento entre dois cliques.
  - **Linha curva** — Bézier com pontos de controlo.
  - **Contínua** (checkbox) — quando ativa, o próximo ponto liga automaticamente ao anterior sem exibir handles/vetores, produzindo um traço fluido tanto em recta como em curva.
- **Setas guia direccionais**: ícones sobrepostos ao molde indicando ponto de início e direcção de progressão. Editáveis: podem ser arrastadas, rodadas, ou trocadas por outros estilos de seta (fina, grossa, tracejada).

---

## Detalhes técnicos

- **Store persist**: `persist(config, { name: "cbm-store", partialize: (s) => pick(s, PERSIST_KEYS) })`. Merge inteligente no `SupabaseSync` via `updated_at` do row cloud.
- **AuthGate**: exportar helper `useAuthReady()` e usar no layout root para gate da sidebar.
- **Design defaults**: `Object.freeze` no snapshot; store `design` faz `initial = { ...DESIGN_DEFAULTS }`.
- **Editor moldes**: manter tudo em canvas SVG/Konva já existente; novos estados `drawMode: "straight" | "curve"` e `continuous: boolean`; setas como componentes SVG separados com handles arrastáveis.
- **Logs OAuth**: reutilizar `logSessionEvent`, novos `event` strings (não altera schema DB).

## Fora de âmbito neste ciclo

- Bloco 2 (recuperação/alteração de password) e bloco 6 (limpeza profunda de segurança) — para próximo turno se aprovares.

Confirma que avanço com esta ordem: **1 → 3 → 4 → 5**.
