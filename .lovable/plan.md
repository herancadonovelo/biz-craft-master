Este pedido junta ~15 funcionalidades grandes (algumas já parcialmente feitas, outras novas e extensas). Para evitar partir a app proponho faseá-lo. Confirma a ordem ou ajusta antes de eu começar.

## Fase 1 — Correções e melhorias rápidas (pedidos curtos)
1. **Modal de Módulos**: após guardar, fechar modal + redirect para `/` com refresh do dashboard.
2. **Biblioteca — pré-visualização**: preview do PDF/imagem antes de upload e ao abrir item (lightbox + `<embed>` para PDF).
3. **Traduções — export CSV/JSON**: botões em `/traducoes` que descarregam o relatório de chaves em falta.
4. **WhatsApp — auto-associação**: ao receber mensagem, procurar cliente por telefone/email e encomenda mais recente; fallback "não associado" com botão para associar manualmente.
5. **Auditoria Etsy**: nova página `/etsy-auditoria` mostrando o mapeamento variantes/downloads → materiais/stock com avisos de stock baixo.
6. **Etsy webhook — modo teste**: endpoint que permite reenviar o mesmo `event_id` e mostra que foi ignorado (idempotência); painel em `/etsy` para disparar manualmente.
7. **Calculadora → Catálogo**: já existe botão "Guardar no Catálogo" — validar e adicionar campos custo materiais + horas + margem ao registo.
8. **Banner de motivação no dashboard**: frase diária rotativa pastel.

## Fase 2 — Secções novas médias
9. **Bloco de Notas** (`/notas`): grid masonry, texto/checklist, cores pastel, tags, fixar, pesquisa.
10. **Moodboards** (`/moodboards`): grid Pinterest-style, detalhe com galeria/lightbox, paleta de cores com indicador de stock, links, vincular a encomenda.
11. **Marketing e Campanhas** (`/campanhas`): calendário festivo por país (PT/BR/AO/INT), sugestões IA (Lovable AI), formulário campanhas/promoções/giveaways.
12. **Estados de encomenda personalizáveis** (`/estados-encomendas` já existe — expandir): CRUD de estados com cor, badge dinâmico nas encomendas.

## Fase 3 — Funcionalidades grandes (cada uma é um pedido por si só)
13. **Contador de carreiras** (dentro da Biblioteca): modo produção, multi-contadores, memória por receita, alertas ergonómicos a cada X min.
14. **Sistema bem-estar transversal**: timer global, modal de pausa, frases motivacionais.
15. **Hub de Criação de Moldes/Receitas**: editor amigurumi por blocos/carreiras + editor vetorial tricotin com Fabric.js/Konva, cálculo de comprimento de arame, exportação PDF, tabela `projects` no Supabase.

---

## Notas técnicas
- O hub vetorial (15) precisa de instalar `fabric` ou `konva` e desenhar PDF — é o item mais pesado, ~1 dia de trabalho sozinho.
- Sugestões IA do marketing vão usar o Lovable AI Gateway (precisa ativar Cloud).
- Persistência atual é Zustand+localStorage. As tabelas Supabase pedidas em (15) e (12) implicam migrar essas entidades para a base de dados — confirmar se queres migração total ou só essas duas tabelas novas.

## Proposta de execução
Faço **Fase 1 inteira agora** (alto valor, baixo risco). Depois confirmas se queres Fase 2 e/ou Fase 3 nas mensagens seguintes.

Confirmas: "avança Fase 1" ou diz-me o que reordenar/remover.