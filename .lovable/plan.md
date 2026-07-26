# Editor de Padrões: Bordado — Roadmap Fases 16–22

Analisei a lista. Já estão implementadas (Fases 1–15): canvas + tecidos, ferramentas de desenho, simulação de pontos, paleta DMC/Anchor, foto→ponto-cruz, encoders DST/PES/EXP, satim/tatami com underlay+pull-comp, lettering/monograma/aplique, 3D preview, PDF, DST importer, heatmap+análise, bundle .zip, multi-hoop com marcas de registo.

Faltam **38 pedidos**. Agrupei-os em **7 fases** por afinidade técnica (cada uma testável isoladamente):

## Fase 16 — Camadas, paleta rápida & persistência
- Paleta de troca rápida por camada (múltiplos traços por cor + preview)
- Reordenar/escalar camadas do aplique (Colocar/Fixar/Cobrir) antes do export
- Persistência: settings de simulação + seleções DMC/Anchor por camada
- Auto-save no navegador com recuperação após reload
- Presets de bordado por projeto (hoop, contorno, underlay, satim/tatami)
- Biblioteca persistente de motivos/fontes com upload SVG + tags

## Fase 17 — Edição manual & undo/redo
- Edição manual de células no Aida (pintar/apagar/trocar cor)
- Edição manual de pontos/linhas (arrastar âncoras, recalcular fill no ato)
- Undo/redo para Fase 3 (stitch selector + thread estimator) com atalhos
- Tutorial passo-a-passo + mapa de atalhos das ferramentas
- Modo de revisão por cor (destaca blocos + score de qualidade)

## Fase 18 — Calibração, estimativas & inventário
- Calibração de escala do hoop em cm (grelha e chart batem certo)
- Calibração de escala do SVG (grelha mm sempre correta)
- Thread-estimator com calibração de densidade + custo via preços do fornecedor
- Consumo de linha + custo por cor via stitch-analysis+heatmap
- Consumo automático de inventário ao confirmar shopping list + alertas de reposição

## Fase 19 — Preview de percurso & simulação avançada
- Preview do percurso de costura (ordem/direção) antes do export DST
- Simulação de pontos no browser com zoom, seleção de cor e contador
- Preview da rota estimada + densidade + contagem de cores para lettering/aplique
- Screenshot/PNG da preview 3D com fundo e escala configuráveis

## Fase 20 — Máquina, presets & validação pré-export
- Painel de parâmetros da máquina (bastidor, escala, densidade, compensação) → recalcula DST
- Presets por modelo de máquina influenciam geração PES
- Validações pré-export PES (limite de cores, tamanho, densidade, fora do hoop)
- Validação pré-export do bundle .zip (camadas, ordem de cores, unidades) com bloqueio
- Validação/assistente do DST importado (centro, rotação, unidades)
- Marcas de alinhamento + numeração automática no tiling multi-bastidor do PES
- Controlos avançados (underlay/overlap/pull-comp/spacing) para lettering+aplique no export

## Fase 21 — Relatórios & PDFs configuráveis
- Relatório de produção junto do DST (pontos/cor, tempo, comprimento total)
- Métricas do DST importado (pontos, comprimento, tempo/cor, resumo)
- Timeline de trocas de cor/agulha + paragens ao exportar PES
- PDF configurável (A4/Letter, margens, escala, orientação)
- PDF com anotações (largura/altura mm, área, linhas de referência)
- PDF com grelha + lista de cores + estatísticas (imprimir/enviar ao atelier)
- Configurar conteúdo do PDF de padrão no bundle (escala, margens, grelha, stats)
- Export CSV cruzando quantidades por cor com Inventário
- Export unificado: cross-stitch chart + shopping list DMC num único PDF
- Checklist de preparação/inspeção final baseada nas métricas

## Fase 22 — Auto-digitize inteligente & monograma
- Card no Studio: foto → N cores → largura mm → preview vetorizado antes do export
- Auto-digitize: seleção automática satim/tatami + underlay + pull-comp
- Painel de Monograma (iniciais, moldura círculo/hex/quadrado/flor, margem, preview 2D)

## Resposta direta
**7 fases** para cobrir os 38 pedidos em falta. Entrego uma por iteração, sequencialmente (16 → 22), cada uma testável no editor sem quebrar as anteriores.

Confirmas o faseamento e começo já pela **Fase 16**?
