# Editor de Gráficos: Tricô

Adicionar novo separador **"Editor de Gráficos: Tricô"** dentro de `/ferramentas-tecnicas`, gated por Premium (mesma proteção dos restantes editores técnicos). Dado o volume (~40 funcionalidades), entrego em 7 fases correspondentes às 7 categorias do pedido — cada fase é um commit funcional independente, com painel dedicado e testes.

## Arquitetura (comum a todas as fases)

- `src/lib/knit/` — motor puro (sem React):
  - `dicionario.ts` — símbolos standard + PT/US/UK + auto-complete
  - `chart.ts` — modelo `Chart` (grelha, WS rows escondidas, repeats)
  - `chart-to-text.ts` — tradução gráfico → texto por carreira
  - `gauge.ts` — matemática de tensão / escalonamento / múltiplos
  - `colorwork.ts` — pixel-art, contagem por cor, float tracker, inversão
  - `construction.ts` — top-down raglan, sock wizard, marcadores
  - `presets-fios.ts` — paletas Drops / Rowan / Malabrigo
  - `export.ts` — PDF printer-friendly, SVG vetorial, Ravelry JSON
- `src/components/knit-editor/KnitEditor.tsx` — shell com sub-tabs (uma por categoria)
- `src/components/knit-editor/Chart*.tsx`, `Grading*.tsx`, `Colorwork*.tsx`, etc.
- Novo tab em `src/routes/ferramentas-tecnicas.tsx` (Premium-gated via `PremiumRoute`).
- Persistência: `localStorage` chave `cbm:knit-editor:<projectId>` + sync opcional via `SupabaseSync`.
- i18n: chaves novas em `src/lib/i18n.ts` (PT/EN/ES/FR).
- Moeda: preços via `formatCurrency` global (nunca símbolos hardcoded).

## Fase 1 — Editor de Gráficos Visuais (Charts & Lace)
Grelha SVG interativa, biblioteca de símbolos drag-and-drop, Cable Creator, tradução gráfico→texto, ocultar WS rows, seleção de repeats com moldura vermelha, símbolos personalizáveis persistidos.

## Fase 2 — Matemática e Escalonamento
Gauge Math, Auto-Grading multi-tamanho (XS–XXL), parênteses dinâmicos, validador de simetria de diminuições, calculadora de cavas/decotes, verificador de múltiplos, buttonhole spacing.

## Fase 3 — Colorwork / Fair Isle
Pixel-art grid, consumo de lã por cor via gauge, float tracker (>N malhas seguidas), inversão instantânea, paletas Drops/Rowan/Malabrigo com swatches reais.

## Fase 4 — Construção e Acessórios
Wizard Top-Down Raglan, Sock Wizard por tamanho de pé, toggle Circular/Reta a reescrever direção, gestão de marcadores com contagem entre eles.

## Fase 5 — Escrita e Dicionários
Auto-complete PT, gerador de legenda que varre o texto, conversor mm↔US↔UK, dicionário PT/US/UK (bind off vs cast off), organizador de fases (accordion), formatação `*...*` para repetições.

## Fase 6 — Testadores e Experiência do Cliente
Modo "Contador de Carreiras" mobile-friendly (progresso persistido), Row Highlighter, formulário público para testers (rota `/receita-tester-tricot/$token`) que agrega consumos reais.

## Fase 7 — Custo, Stock e Exportação
Preificador cruzando horas + custo de meadas do inventário, PDF printer-friendly (P&B, sem fotos), export SVG vetorial, JSON compatível com Ravelry, links/QR para vídeos de técnicas, simulador de textura (mohair/seda), capa automática com dificuldade em estrelas, dark mode dedicado para gráficos.

## Testes (por fase)
- Unit (Vitest): motor puro (`chart-to-text`, `gauge`, `float tracker`, conversores).
- E2E (Playwright) em `e2e/editors/knit.spec.ts`: abrir tab, gate Premium, desenhar 3 símbolos → texto gerado, exportar PDF/SVG sem erros, contador de carreiras persiste.
- CI: acrescentar à suite existente `.github/workflows/e2e.yml`.

## Detalhes técnicos relevantes
- Grelha renderizada em SVG (não canvas) para exportação vetorial nativa e zoom sem pixelização.
- `useDeferredValue` na tradução gráfico→texto para grelhas grandes.
- PDF via `pdf-lib` (já usado no projeto), reaproveitando helpers de `src/lib/amigurumi/pdf.ts`.
- Símbolos como componentes SVG puros para permitir dark-mode via `currentColor`.

## Confirmação
Confirmas que avanço fase-a-fase (começando pela Fase 1) com commits separados? Se preferires um subset (ex: só Fases 1–3 agora), diz qual.
