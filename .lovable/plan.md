# Reestruturação Global: localStorage → Supabase

## Contexto

Hoje praticamente todos os dados da app vivem num único store Zustand persistido em `localStorage` (`src/lib/store.ts`), incluindo: materiais, fornecedores, clientes, encomendas, projetos, horas, caixa, vendas, despesas, cotações, faturas, catálogo, biblioteca, moodboards, notas, marketing, contadores, cursos, alunos, posts Instagram, ficheiros digitais, etiquetas, traduções, módulos, perfil de negócio, contas (PIN), to-dos, auditoria, etc. São ~30 coleções distintas usadas em ~50 rotas.

Migrar tudo de uma vez num único turno seria irrealista (centenas de chamadas, alto risco de regressão silenciosa em rotas que não cabem no contexto). Proponho fazê-lo em **fases verificáveis**, cada uma deixando a app funcional.

## Plano por fases

### Fase 0 — Fundações (este turno, se aprovado)
- Ativar Lovable Cloud (Supabase) se ainda não estiver.
- Criar autenticação Email/Password + Google (página `/auth`, layout `_authenticated`).
- Criar enum `app_role` + tabela `user_roles` + função `has_role` (padrão de segurança).
- Criar helper genérico `useSupabaseCollection<T>(table)` que substitui `useStore().<colecao>` com a mesma API (`add/update/remove`) mas faz CRUD no Supabase + cache via TanStack Query + toasts de loading/erro.
- Adicionar gate global: rotas com dados sensíveis movidas progressivamente para `_authenticated/`. Rotas públicas mostram um aviso "Inicia sessão para guardar os teus dados".

### Fase 1 — Núcleo operacional
Tabelas + migração de UI:
- `materiais`, `material_fornecedores` (N:N preço por fornecedor)
- `fornecedores`
- `clientes`
- `encomendas`, `encomenda_itens`
- `projetos`, `projeto_materiais`
- `horas_trabalhadas`

### Fase 2 — Financeiro
- `caixa_movimentos`, `vendas`, `despesas_fixas`, `cotacoes`, `faturas`, `perfil_negocio`

### Fase 3 — Criação / conteúdo
- `catalogo`, `biblioteca`, `moldes`, `moodboards`, `moodboard_imagens`, `notas`, `editor_receitas`, `contadores`

### Fase 4 — Marketing / integrações / sistema
- `marketing_acoes`, `campanhas`, `instagram_posts`, `cursos`, `alunos`
- `whatsapp_mensagens`, `etsy_mapeamentos`, `ficheiros_digitais`
- `todos`, `auditoria`, `notificacoes`, `etiquetas`
- `modulos`, `design_settings`, `contas_credenciais` (cifradas), `traducoes`

Todas as tabelas:
```sql
id uuid pk default gen_random_uuid()
user_id uuid not null references auth.users(id) on delete cascade
created_at, updated_at timestamps
-- + campos específicos
```
Mais `GRANT SELECT,INSERT,UPDATE,DELETE ON … TO authenticated;` + RLS `using (auth.uid() = user_id)`.

### Fase 5 — Limpeza
- Remover `persist` do Zustand para coleções migradas.
- Manter no Zustand apenas estado puramente local (UI ephemeral, ex: tema atual).
- Importador "uma vez" que lê o `localStorage` legado e faz upload das coleções existentes do utilizador para o seu user_id.

## O que peço para confirmar antes de avançar

1. **Avanço por fases?** Posso começar agora pela Fase 0 + Fase 1 (núcleo: materiais, fornecedores, clientes, encomendas, projetos, horas). Depois confirmamos cada fase seguinte. Isto evita um turno gigante onde algo se parte sem darmos por isso.
2. **Autenticação:** Email/Password + Google por defeito. Confirmas?
3. **Dados atuais em localStorage:** Queres que faça um importador automático (ao primeiro login, faz upload do que existe no browser para a tua conta) ou começa-se com base limpa?
4. **Módulos desativados:** mantemos as tabelas mesmo para módulos desligados, ou só criamos quando o módulo for ativado?

Assim que respondas, começo pela Fase 0 + Fase 1 já neste fluxo.
