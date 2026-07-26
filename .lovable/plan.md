
# Editor de Receitas: Amigurumis & Crochê — Expansão Pro

Escopo enorme (60+ funcionalidades em 6 categorias). Proponho entregar em **fases incrementais**, cada uma testável e utilizável, em vez de tudo num só bloco (o que arriscaria quebrar o editor atual e tornaria o code-review impossível).

## Fase 0 — Fundação (obrigatória antes de tudo)

Refatorar `src/routes/editor-receita.tsx` (atualmente ~160 linhas monolíticas) para um módulo em `src/components/amigurumi-editor/`:
- `AmigurumiEditor.tsx` (shell + abas)
- `hooks/useReceitaHistory.ts` (undo/redo + autosave versões)
- `lib/pontos-dicionario.ts` (abreviaturas PT/US/UK + auto-complete)
- `lib/math-engine.ts` (calculadora automática de pontos por carreira)
- `lib/geradores.ts` (esfera, escalonamento, clonagem espelhada)

Store: estender `ReceitaEditor` com `versoes[]`, `tensao`, `enchimento`, `arame`, `olhos`, `fotos[]`, `graficos[]`, `paleta[]`, `videos[]`, `abaAtiva`.

## Fase 1 — Escrita Inteligente (categoria 1)
Auto-complete, math engine, formatação de carreiras, blocos `[..] x N`, conversor PT/US/UK, gerador de abreviaturas, organizador de peças (abas), tensão, enchimento/arame, guia olhos.

## Fase 2 — Visuais (categoria 2)
Fotos por carreira, anotações canvas nas fotos, construtor gráfico drag&drop com biblioteca de símbolos SVG, pixel-art C2C/tapestry, extrator de paleta, QR/vídeo.

## Fase 3 — Integração CBM (categoria 3)
Selector de fios do stock, calculadora consumo (peso→metragem), cronómetro, precificador (usa `/calculadora`), gerador de kit → lista de compras.

## Fase 4 — Modo Tester (categoria 4)
Link partilhável (rota pública `/receita-tester/$token`), comentários por carreira, tracker de correções, histórico de versões (já da Fase 0).

## Fase 5 — Design & PDF (categoria 5)
4 templates, printer-friendly, índice, capa dinâmica, watermark, password (via pdf-lib), header/rodapé, página obrigado. Substituir `window.print()` atual.

## Fase 6 — Extras (categoria 6)
Checklist leitura, contador virtual, redimensionamento por agulha, dicionário pop-up, export Ravelry/Etsy .zip, modo foco, gerador de esfera, clonagem espelhada, escalonamento, matriz tapestry, mudança de cor, validador agulha/fio, cálculo cabelo, mistura de fios, granny layout, frog raveling.

## Detalhes técnicos-chave
- **Math engine**: parser dos tokens (`6 pb`, `6 aum`, `[1 pb, 1 aum] x 6`, `dim`, `mpa`, `pa`) → produz total esperado. Compara com total escrito pela artesã, marca em vermelho.
- **PT↔US↔UK**: tabela em `pontos-dicionario.ts`. Toggle no header do preview.
- **PDF**: `pdf-lib` (já Worker-compat) — substitui print. Watermark via low-opacity draw em cada página.
- **Persistência**: tudo no Zustand store (`useStore`) + Supabase sync via `SupabaseSync`.
- **Testes E2E**: adicionar spec em `e2e/editors/` por fase (math engine, PT/US toggle, PDF export).

## O que peço confirmar

Vou executar **Fase 0 + Fase 1 nesta iteração** (base + Escrita Inteligente completa). É o núcleo funcional; sem isto as outras fases não fazem sentido. Depois entrego Fase 2–6 uma a uma nos pedidos seguintes.

Confirmas este faseamento? Ou preferes que ataque outra fase primeiro (ex: Fase 5 PDF, que é mais visível para clientes)?
