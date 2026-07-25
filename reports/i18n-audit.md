# i18n audit — literais PT fora de t()

- Diretório: `src/routes`
- Ficheiros com ocorrências: **56**
- Total de ocorrências: **427**
- Gerado: 2026-07-25T19:34:39.753Z

> Heurística: strings com diacríticos PT ou stopwords comuns em JSX/atributos, não envolvidas em `t(...)`, `i18n.t(...)`, `tr(...)` ou `<Trans>`.

## `src/routes/ajuda.tsx`  _(3)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 91 | `attr:description` | Perguntas frequentes sobre o funcionamento da aplicação. |
| 97 | `attr:placeholder` | Procurar pergunta ou palavra-chave… |
| 99 | `attr:aria-label` | Pesquisar no FAQ |

## `src/routes/atelier-sounds.tsx`  _(10)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 160 | `jsx-text` | Temporizador de desconexão |
| 239 | `jsx-text` | Ligar conta Spotify |
| 241 | `jsx-text` | A integração com Spotify está temporariamente indisponível. |
| 246 | `jsx-text` | A carregar… |
| 275 | `jsx-text` | A reprodução acontece no teu leitor Spotify ativo (telemóvel, desktop ou web). Abre o Spotify primeiro se nada acontecer. |
| 301 | `jsx-text` | ligação direta |
| 305 | `jsx-text` | URL Amazon Music (playlist, estação ou álbum) |
| 315 | `jsx-text` | Estações |
| 66 | `attr:description` | Música ambiente e sons de relaxamento — continuam a tocar enquanto navegas pela app. |
| 94 | `attr:aria-label` | Próxima faixa |

## `src/routes/auth.tsx`  _(4)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 204 | `jsx-text` | Aceder à tua conta |
| 211 | `jsx-text` | abre numa nova janela |
| 223 | `jsx-text` | Email da conta |
| 258 | `attr:placeholder` | Mínimo 6 caracteres |

## `src/routes/backup.tsx`  _(5)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 114 | `jsx-text` | Não estás autenticado — o backup será feito a partir dos dados locais deste navegador. Para garantir a cópia da nuvem, inicia sessão. |
| 123 | `jsx-text` | Um único ficheiro com todas as coleções (clientes, materiais, projetos, faturas, etc.). Ideal para restauro completo. |
| 133 | `jsx-text` | Um CSV por coleção dentro de um zip — útil para abrir no Excel/Sheets ou migrar para outras ferramentas. |
| 145 | `jsx-text` | previamente exportado. Isto irá |
| 108 | `attr:description` | Exporta tudo o que está associado à tua conta em JSON ou CSV e restaura quando precisares. |

## `src/routes/biblioteca.tsx`  _(7)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 68 | `jsx-text` | URL cloud (preferível) |
| 75 | `jsx-text` | Formato sem pré-visualização disponível. |
| 135 | `jsx-text` | 📄 Pré-visualizar PDF |
| 52 | `attr:description` | Repositório central. Cada aba lista os trabalhos guardados pelos Editores Técnicos. |
| 55 | `attr:placeholder` | Título |
| 67 | `attr:placeholder` | Descrição |
| 87 | `attr:placeholder` | Pesquisar… |

## `src/routes/calculadora.tsx`  _(7)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 130 | `jsx-text` | Cria um projeto primeiro para guardar cotações. |
| 169 | `jsx-text` | Preço-hora (€) |
| 197 | `jsx-text` | Preço final |
| 200 | `jsx-text` | Fórmula: (Materiais + Horas × €/h + Extras) × (1 + margem). |
| 208 | `jsx-text` | Últimas cotações |
| 115 | `attr:title` | Calculadora de preço |
| 115 | `attr:description` | Calcula o preço final de uma peça: materiais + horas + margem. |

## `src/routes/calendario.tsx`  _(3)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 114 | `jsx-text` | Título |
| 134 | `jsx-text` | Toque padrão da aplicação |
| 86 | `attr:title` | Calendário & Agenda |

## `src/routes/cashflow.tsx`  _(8)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 49 | `jsx-text` | Saídas por categoria |
| 64 | `jsx-text` | Sugestões |
| 66 | `jsx-text` | A finança está saudável. Continua assim! |
| 73 | `jsx-text` | Novo movimento |
| 78 | `jsx-text` | Saída |
| 82 | `jsx-text` | Descrição |
| 91 | `jsx-text` | Descrição |
| 42 | `attr:label` | Saídas |

## `src/routes/catalogo.tsx`  _(5)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 57 | `jsx-text` | Sem itens no catálogo. |
| 28 | `attr:title` | Catálogo |
| 28 | `attr:description` | Peças à venda. Liga-se à Calculadora para guardar o preço final como Preço de Venda. |
| 31 | `attr:placeholder` | Preço (€) |
| 34 | `attr:placeholder` | Descrição |

## `src/routes/clientes.tsx`  _(4)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 45 | `jsx-text` | Novo cliente |
| 48 | `jsx-text` | Novo cliente |
| 41 | `attr:description` | Detalhes e histórico de cada cliente. |
| 67 | `attr:placeholder` | Pesquisar cliente… |

## `src/routes/configuracoes.tsx`  _(5)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 60 | `jsx-text` | A app guarda tudo localmente no teu navegador. Podes apagar tudo se precisares de recomeçar. |
| 66 | `jsx-text` | Carregar dados de demonstração |
| 72 | `jsx-text` | Apagar todos os dados |
| 28 | `attr:title` | Configurações |
| 28 | `attr:description` | Tudo o que controla o comportamento da aplicação. |

## `src/routes/contacto.tsx`  _(1)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 32 | `jsx-text` | Resposta tipicamente em 24-48h em dias úteis. |

## `src/routes/contador.tsx`  _(1)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 196 | `attr:description` | Gere carreiras e pontos em simultâneo — toque ou voz. |

## `src/routes/contas.tsx`  _(5)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 65 | `jsx-text` | Guardar conta |
| 95 | `jsx-text` | Novo PIN (4 dígitos) |
| 96 | `jsx-text` | Confirmar novo PIN |
| 29 | `attr:description` | Esta área está protegida. Introduz o PIN de 4 dígitos. (Inicial: 0000) |
| 49 | `attr:description` | Guarda os teus logins de plataformas em segurança local. |

## `src/routes/conversor-cores.tsx`  _(4)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 71 | `jsx-text` | Código da linha |
| 78 | `jsx-text` | A carregar paleta |
| 123 | `jsx-text` | As equivalências entre marcas são aproximadas (vizinho cromático mais próximo). Para correspondência exata consulta o catálogo oficial de cada marca. |
| 55 | `attr:description` | Digita o código de uma linha e vê a correspondência aproximada em todas as marcas. |

## `src/routes/crescimento.tsx`  _(9)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 41 | `jsx-text` | Vendas por mês |
| 55 | `jsx-text` | Distribuição encomendas |
| 70 | `jsx-text` | Relatório executivo |
| 72 | `jsx-text` | • Margem média por projeto: |
| 73 | `jsx-text` | • Estado mais comum das encomendas: |
| 75 | `jsx-text` | • Recomendação: aumentar margem para 80% nos projetos personalizados de baixo volume. |
| 32 | `attr:title` | Crescimento do negócio |
| 32 | `attr:description` | Estatísticas e relatórios periódicos para gestão estratégica. |
| 37 | `attr:label` | Lucro médio/projeto |

## `src/routes/cursos.tsx`  _(7)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 38 | `jsx-text` | Preço (€) |
| 40 | `jsx-text` | Descrição |
| 42 | `jsx-text` | Páginas do curso |
| 50 | `jsx-text` | Criar curso |
| 71 | `jsx-text` | Páginas: |
| 99 | `jsx-text` | Módulo atual |
| 87 | `attr:placeholder` | Módulo atual |

## `src/routes/design.tsx`  _(40)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 93 | `jsx-text` | Personalização |
| 94 | `jsx-text` | Configurações |
| 174 | `jsx-text` | Tipo de letra dos cabeçalhos |
| 176 | `jsx-text` | Aplica-se ao título de todas as páginas ao mesmo tempo. |
| 180 | `jsx-text` | Limpar overrides por página |
| 187 | `jsx-text` | Nome do negócio |
| 189 | `jsx-text` | Preço-hora base (€) |
| 192 | `jsx-text` | Usado por defeito em novos projetos e na calculadora. |
| 218 | `jsx-text` | Controla luminosidade, saturação, matiz e contraste dos itens. |
| 240 | `jsx-text` | Transparência das janelas com contorno |
| 242 | `jsx-text` | Ajusta o fundo de todos os campos de texto, textareas e cartões com contorno — do mais opaco ao mais transparente. |
| 255 | `jsx-text` | Calibrar opacidade dos botões |
| 257 | `jsx-text` | Controla independentemente a opacidade dos botões primários, secundários e outline. |
| 285 | `jsx-text` | Pré-visualização |
| 287 | `jsx-text` | Botão primário |
| 288 | `jsx-text` | Botão outline |
| 289 | `jsx-text` | Secundário |
| 325 | `jsx-text` | A categoria selecionada mantém-se destacada enquanto navegas dentro dela. |
| 337 | `jsx-text` | Cores gerais (janelas, botões, fundos) |
| 349 | `jsx-text` | Aplica-se a toda a app. Deixa vazio para usar o padrão. |
| 353 | `jsx-text` | Cabeçalho da aplicação |
| 355 | `jsx-text` | Barra superior onde está o ícone que abre o menu lateral. |
| 389 | `jsx-text` | Repor padrão |
| 395 | `jsx-text` | Personaliza a cor de fundo e do texto das caixas de aviso (ex.: ecrã de "Sessão expirada"). Funciona com tons claros ou escuros. |
| 402 | `jsx-text` | Âmbar (claro) |
| 90 | `attr:title` | Personalização & Configurações |
| 90 | `attr:description` | Aparência da aplicação e definições gerais num só sítio. |
| 177 | `attr:label` | Letra global dos cabeçalhos |
| 312 | `attr:label` | Tipo de letra dos títulos |
| 313 | `attr:label` | Cor dos títulos |
| 339 | `attr:label` | Cor de fundo das páginas |
| 342 | `attr:label` | Cor de áreas suaves (muted) |
| 343 | `attr:label` | Cor dos botões primários |
| 344 | `attr:label` | Cor do texto dos botões |
| 345 | `attr:label` | Cor dos botões secundários |
| 346 | `attr:label` | Cor do texto dos botões secundários |
| 347 | `attr:label` | Cor dos botões outline |
| 348 | `attr:label` | Cor do texto dos botões outline |
| 356 | `attr:label` | Cor de fundo do cabeçalho |
| 357 | `attr:label` | Cor do ícone/texto do cabeçalho |

## `src/routes/editor-moodboards.tsx`  _(8)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 255 | `jsx-text` | Guardar na aplicação |
| 256 | `jsx-text` | Guardar no dispositivo |
| 307 | `jsx-text` | Trás |
| 356 | `jsx-text` | Tema / paleta para começar |
| 251 | `attr:description` | Estúdio interativo · folha A4 vertical. |
| 268 | `attr:aria-label` | Decoração |
| 357 | `attr:placeholder` | ex.: Coleção de outono aconchegante |
| 442 | `attr:placeholder` | ex.: Título para post de cachecol de lã |

## `src/routes/editor-receita.tsx`  _(7)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 58 | `jsx-text` | Novo Projeto |
| 77 | `jsx-text` | Crochê Tradicional |
| 114 | `jsx-text` | Adicionar Carreira |
| 119 | `jsx-text` | Adicionar Secção |
| 48 | `attr:title` | Hub de Criação · Editor de Receita |
| 48 | `attr:description` | Cria receitas estruturadas de amigurumi e crochê com pré-visualização. |
| 109 | `attr:placeholder` | ex: 6 pa no anel mágico |

## `src/routes/encomendas.tsx`  _(8)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 63 | `jsx-text` | Nova encomenda |
| 65 | `jsx-text` | Nova encomenda |
| 79 | `jsx-text` | Descrição |
| 82 | `jsx-text` | Preço |
| 95 | `jsx-text` | Descrição |
| 95 | `jsx-text` | Preço |
| 37 | `attr:description` | Gestão completa de encomendas, estado atual e etiquetas de envio. |
| 91 | `attr:placeholder` | Pesquisar encomenda ou cliente… |

## `src/routes/etiquetas.tsx`  _(7)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 69 | `jsx-text` | Destinatário |
| 71 | `jsx-text` | Código postal |
| 72 | `jsx-text` | País |
| 75 | `jsx-text` | Observações |
| 76 | `jsx-text` | Criar etiqueta |
| 81 | `jsx-text` | Destinatário |
| 81 | `jsx-text` | País |

## `src/routes/etsy.tsx`  _(4)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 111 | `jsx-text` | Envia o mesmo evento várias vezes para confirmar que o stock só é descontado uma vez (idempotência por |
| 25 | `attr:description` | Integração Etsy e biblioteca de ficheiros digitais. |
| 113 | `attr:placeholder` | Event ID (único) |
| 115 | `attr:placeholder` | Variação |

## `src/routes/faturacao.tsx`  _(5)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 30 | `jsx-text` | Criar Fatura |
| 31 | `jsx-text` | Histórico De Faturas |
| 94 | `jsx-text` | Criar fatura |
| 27 | `attr:title` | Faturação: Criar & Histórico |
| 27 | `attr:description` | Emite novas faturas e consulta o histórico completo. |

## `src/routes/ferramentas-tecnicas.tsx`  _(26)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 48 | `jsx-text` | Instruções de uso |
| 50 | `jsx-text` | Editor de Receitas: Amigurumis & Crochê |
| 52 | `jsx-text` | Editor de Gráficos: Ponto Cruz |
| 53 | `jsx-text` | Editor de Padrões: Bordado |
| 686 | `jsx-text` | Modo Seleção |
| 687 | `jsx-text` | Adicionar Ponto Reto |
| 688 | `jsx-text` | Adicionar Ponto Curvo |
| 755 | `jsx-text` | Gestão do Molde: |
| 756 | `jsx-text` | Guardar na Biblioteca |
| 757 | `jsx-text` | Guardar no Dispositivo (.json) |
| 758 | `jsx-text` | Guardar no Dispositivo (.png) |
| 785 | `jsx-text` | Apagar… |
| 795 | `jsx-text` | Calibração de escala: |
| 812 | `jsx-text` | Calibração automática |
| 818 | `jsx-text` | Medição obtida (mm) |
| 906 | `jsx-text` | Instruções |
| 1007 | `jsx-text` | Adicionar linha por medida |
| 1116 | `jsx-text` | Símbolos |
| 1273 | `jsx-text` | Imagem de referência |
| 1300 | `jsx-text` | Limpar traços |
| 35 | `attr:feature` | Ferramentas Técnicas |
| 44 | `attr:title` | Ferramentas Técnicas |
| 918 | `attr:placeholder` | Título da receita |
| 919 | `attr:placeholder` | Materiais, agulha, nível... |
| 1137 | `attr:defaultTitulo` | Gráfico Ponto Cruz |
| 1303 | `attr:defaultTitulo` | Padrão Bordado |

## `src/routes/ficheiros-digitais.tsx`  _(1)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 35 | `attr:description` | Receitas, moldes e PDFs comprados ou vendidos (inclui ligação à Etsy). |

## `src/routes/fornecedores.tsx`  _(8)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 44 | `jsx-text` | Novo fornecedor |
| 46 | `jsx-text` | Novo fornecedor |
| 55 | `jsx-text` | Código de Desconto de Membro |
| 56 | `jsx-text` | Código |
| 87 | `jsx-text` | Código de Desconto |
| 41 | `attr:description` | Lista de fornecedores de material para os artigos. |
| 83 | `attr:placeholder` | Pesquisar fornecedor… |
| 99 | `attr:title` | Copiar código |

## `src/routes/gestao-fornecedores.tsx`  _(3)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 17 | `jsx-text` | Editar fornecedores |
| 15 | `attr:title` | Gestão de fornecedores |
| 16 | `attr:description` | Informação detalhada de cada fornecedor e os artigos que disponibiliza. |

## `src/routes/historico-faturas.tsx`  _(3)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 29 | `attr:title` | Histórico De Faturas |
| 29 | `attr:description` | Todas as faturas emitidas, com pesquisa e impressão. |
| 32 | `attr:placeholder` | Pesquisar nº, cliente ou estado… |

## `src/routes/horas.tsx`  _(2)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 42 | `jsx-text` | Descrição |
| 47 | `jsx-text` | Descrição |

## `src/routes/idioma.tsx`  _(1)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 17 | `attr:description` | Escolhe a língua da aplicação. A mudança é imediata. |

## `src/routes/index.tsx`  _(3)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 89 | `jsx-text` | Novo projeto |
| 226 | `jsx-text` | Projetos em curso |
| 101 | `attr:placeholder` | Pesquisar em toda a app: páginas, categorias, abas… |

## `src/routes/instagram.tsx`  _(2)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 40 | `jsx-text` | Comentários |
| 27 | `attr:description` | Acompanha publicações e estatísticas do teu Instagram (sincronização manual). |

## `src/routes/lista-compras.tsx`  _(4)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 29 | `jsx-text` | Preço |
| 29 | `jsx-text` | Mínimo |
| 31 | `jsx-text` | Nada a comprar! Todos os materiais acima do mínimo. |
| 25 | `attr:placeholder` | Pesquisar material… |

## `src/routes/marketing-conteudo.tsx`  _(17)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 35 | `jsx-text` | Campanhas e Métricas |
| 95 | `jsx-text` | Conversões |
| 108 | `jsx-text` | Histórico de campanhas |
| 132 | `jsx-text` | Calendário Festivo |
| 260 | `jsx-text` | Edita cada ideia antes de adicionar ao calendário. |
| 315 | `jsx-text` | Quem é o meu cliente? |
| 346 | `jsx-text` | Análise de Mercado e Tendências |
| 349 | `jsx-text` | Notas livres sobre concorrência, tendências e hashtags |
| 360 | `jsx-text` | Guardar alterações |
| 30 | `attr:title` | Marketing e Conteúdo |
| 31 | `attr:description` | Campanhas, métricas, persona do comprador e atalhos criativos — tudo num só lugar. |
| 83 | `attr:label` | Conversões |
| 272 | `attr:placeholder` | Título |
| 318 | `attr:placeholder` | Ex.: Mulher 30-55 anos, mãe ou avó, sensível a artesanato genuíno… |
| 327 | `attr:placeholder` | Ex.: Procura presentes únicos e com significado; quer apoiar pequenos negócios… |
| 352 | `attr:placeholder` | • Concorrente X: lançou coleção de amigurumi de animais marinhos\n• Tendência: cores terrosas, tons pastel\n• Hashtags fortes: #amigurumipt #tricotin #handmadew |
| 352 | `jsx-brace-string` | • Concorrente X: lançou coleção de amigurumi de animais marinhos\n• Tendência: cores terrosas, tons pastel\n• Hashtags fortes: #amigurumipt #tricotin #handmadew |

## `src/routes/modulos.tsx`  _(4)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 89 | `jsx-text` | Intermédio |
| 90 | `jsx-text` | Avançado |
| 86 | `attr:title` | Módulos ativos |
| 86 | `attr:description` | Liga ou desliga categorias do menu. Mantém a app limpa e ajustada ao teu fluxo. |

## `src/routes/moodboards.$id.tsx`  _(7)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 33 | `jsx-text` | Moodboard não encontrado. |
| 55 | `jsx-text` | Stock baixo — adicionar às compras |
| 68 | `jsx-text` | 📌 Vinculado à encomenda de |
| 138 | `jsx-text` | Adicionar cor |
| 144 | `jsx-text` | Links de referência |
| 161 | `jsx-text` | Adicionar link |
| 155 | `attr:placeholder` | Título |

## `src/routes/moodboards.tsx`  _(3)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 231 | `jsx-text` | Guardar no dispositivo |
| 32 | `attr:title` | Moodboards & Inspiração |
| 194 | `attr:placeholder` | Pesquisar moodboards... |

## `src/routes/mural.tsx`  _(6)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 39 | `jsx-text` | Criar Inspiração |
| 203 | `jsx-text` | Ainda não criaste nenhuma. Começa pela primeira! |
| 32 | `attr:title` | Mural de Inspiração |
| 33 | `attr:description` | Gira a sorte, guarda favoritas e cria as tuas próprias frases. |
| 123 | `attr:title` | Remover dos favoritos |
| 167 | `attr:placeholder` | Ex: O meu atelier é o meu refúgio favorito. |

## `src/routes/notas.tsx`  _(6)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 76 | `jsx-text` | Nova Nota |
| 119 | `jsx-text` | Editar nota |
| 69 | `attr:description` | Captura rápida de ideias, receitas e tarefas do atelier. |
| 74 | `attr:placeholder` | Pesquisar notas... |
| 122 | `attr:placeholder` | Título |
| 141 | `attr:placeholder` | Tags separadas por vírgula (#urgente) |

## `src/routes/notificacoes.tsx`  _(4)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 50 | `jsx-text` | Fila de notificações |
| 51 | `jsx-text` | Sem notificações pendentes. |
| 22 | `attr:title` | Gatilhos de notificação |
| 43 | `attr:placeholder` | Olá {cliente}, a tua encomenda {encomenda}… |

## `src/routes/onboarding.tsx`  _(2)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 43 | `attr:title` | Configuração inicial |
| 43 | `attr:description` | Escolhe um nível de complexidade para começar. Podes mudar a qualquer momento em Módulos ativos. |

## `src/routes/perfil-negocio.tsx`  _(22)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 76 | `jsx-text` | Guardar alterações |
| 88 | `jsx-text` | Perfil de Negócio |
| 100 | `jsx-text` | Foto de perfil — visível no cabeçalho e exportações. |
| 132 | `jsx-text` | Logótipo do Atelier |
| 135 | `jsx-text` | PNG transparente recomendado. Usado automaticamente como marca de água em todos os editores técnicos. |
| 41 | `attr:emailPessoal` | E-mail inválido |
| 42 | `attr:email` | E-mail inválido |
| 43 | `attr:telefonePessoal` | Telemóvel inválido |
| 44 | `attr:telefone` | Telefone inválido |
| 45 | `attr:nif` | NIF inválido (9 dígitos) |
| 46 | `attr:website` | URL inválido (https://…) |
| 47 | `attr:pinterest` | URL inválido (https://…) |
| 48 | `attr:lojaOnline` | URL inválido (https://…) |
| 84 | `attr:title` | Perfil Pessoal & Negócio |
| 84 | `attr:description` | A artesã por trás da marca e a identidade do atelier. |
| 109 | `attr:label` | Telemóvel |
| 114 | `attr:placeholder` | Conta a tua história no artesanato… |
| 124 | `attr:placeholder` | Ex: Herança do Novelo |
| 143 | `attr:label` | E-mail do negócio |
| 146 | `attr:label` | Telefone do negócio |
| 158 | `attr:label` | Código Postal |
| 164 | `attr:label` | País |

## `src/routes/planos.tsx`  _(17)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 117 | `jsx-text` | inicia sessão |
| 129 | `jsx-text` | Vitalício |
| 157 | `jsx-text` | Grátis |
| 166 | `jsx-text` | /mês |
| 183 | `jsx-text` | Experimente Grátis por 14 Dias |
| 249 | `jsx-text` | Tens um código promocional? |
| 305 | `jsx-text` | Resumo do benefício ativado: |
| 309 | `jsx-text` | Código Aplicado: |
| 311 | `jsx-text` | Novos Preços: |
| 311 | `jsx-text` | Os valores exibidos nos cartões de plano acima já incluem este desconto! |
| 315 | `jsx-text` | Acesso Vitalício: |
| 316 | `jsx-text` | Premium Vitalício |
| 317 | `jsx-text` | Acesso total a todas as ferramentas (Criador de Moldes, Assistente IA, Exportações e mais), sem necessidade de pagamentos recorrentes ou subscrições futuras. |
| 320 | `jsx-text` | Código aplicado com sucesso no seu perfil do atelier. |
| 331 | `jsx-text` | Acesso Premium Vitalício Ativo |
| 97 | `attr:title` | Planos e Subscrições |
| 98 | `attr:description` | Escolhe o nível de acesso. Todos os planos pagos incluem 14 dias grátis sem compromisso. |

## `src/routes/portfolio.tsx`  _(7)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 83 | `jsx-text` | Título |
| 84 | `jsx-text` | Técnica |
| 87 | `jsx-text` | Descrição |
| 96 | `jsx-text` | Adicionar peça |
| 112 | `jsx-text` | Adiciona projetos terminados aqui. |
| 74 | `attr:title` | Portefólio |
| 84 | `attr:placeholder` | Tricotin, crochê… |

## `src/routes/privacidade.tsx`  _(52)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 12 | `jsx-text` | A sua privacidade é de extrema importância para nós. Esta Política de Privacidade explica como a nossa aplicação de gestão de negócios recolhe, utiliza, armazen |
| 13 | `jsx-text` | Ao utilizar a aplicação, concorda com as práticas descritas nesta política. |
| 14 | `jsx-text` | 1. INFORMAÇÕES QUE RECOLHEMOS |
| 15 | `jsx-text` | Para fornecer uma experiência de gestão completa e permitir a sincronização com canais externos, recolhemos e processamos os seguintes dados: |
| 16 | `jsx-text` | A. Dados de Conta e Gestão do Utilizador (Cliente Comercial) |
| 17 | `jsx-text` | Informações de Registo: |
| 17 | `jsx-text` | Nome, endereço de e-mail, número de telefone e dados de autenticação. |
| 18 | `jsx-text` | Dados de Faturação e Pagamento: |
| 18 | `jsx-text` | Informações necessárias para processar assinaturas ou pagamentos da aplicação (sincronizados em segurança através do nosso website). |
| 19 | `jsx-text` | B. Dados do Negócio e Operações (Armazenados na Nuvem) |
| 20 | `jsx-text` | Como plataforma de gestão, armazenamos na nuvem as informações que insere para gerir o seu negócio, o que inclui: |
| 22 | `jsx-text` | Gestão de Stock: |
| 22 | `jsx-text` | Listagem de produtos, materiais, quantidades e fornecedores. |
| 23 | `jsx-text` | Encomendas e Vendas: |
| 23 | `jsx-text` | Histórico de compras, valores e status de entrega. |
| 24 | `jsx-text` | Marketing e Relatórios: |
| 24 | `jsx-text` | Dados de desempenho e métricas internas do seu negócio. |
| 26 | `jsx-text` | C. Dados dos Clientes Finais (Processados em nome do Utilizador) |
| 27 | `jsx-text` | Para que possa gerir o seu negócio, a aplicação processa dados dos seus clientes, tais como: |
| 29 | `jsx-text` | Dados de Identificação e Entrega: |
| 29 | `jsx-text` | Nomes e moradas para envio de encomendas. |
| 30 | `jsx-text` | E-mail e número de telefone. |
| 32 | `jsx-text` | D. Dados de Integração e Sincronização (Website, Redes Sociais e E-mail) |
| 33 | `jsx-text` | Quando opta por sincronizar a aplicação com plataformas externas (como o seu Website, Instagram ou Contas de E-mail): |
| 34 | `jsx-text` | Comunicações e Conversas: |
| 34 | `jsx-text` | Recolhemos e armazenamos o histórico de mensagens e conversas trocadas com os clientes através do Instagram e e-mail. Estas informações são processadas estritam |
| 35 | `jsx-text` | Sincronização de Dados: |
| 35 | `jsx-text` | Informações de encomendas ou contactos gerados no seu website são importados automaticamente para a aplicação. |
| 36 | `jsx-text` | 2. COMO UTILIZAMOS AS INFORMAÇÕES |
| 38 | `jsx-text` | Prestação, manutenção e melhoria de todas as funcionalidades da aplicação. |
| 39 | `jsx-text` | Processamento de pagamentos e gestão de assinaturas. |
| 40 | `jsx-text` | Sincronização em tempo real entre a aplicação, o seu website, e-mail e Instagram. |
| 41 | `jsx-text` | Suporte técnico e atendimento ao cliente. |
| 42 | `jsx-text` | Envio de comunicações importantes sobre atualizações de segurança ou alterações nos termos de serviço. |
| 44 | `jsx-text` | 3. SEGURANÇA E ARMAZENAMENTO NA NUVEM |
| 45 | `jsx-text` | Segregação de Dados: |
| 45 | `jsx-text` | Garantimos que todos os dados do seu negócio (encomendas, stock, conversas) estão completamente segregados e isolados. Nenhum outro utilizador da aplicação terá |
| 46 | `jsx-text` | Todos os dados são armazenados em servidores na nuvem que cumprem elevados padrões de segurança e encriptação. |
| 47 | `jsx-text` | Retenção: |
| 47 | `jsx-text` | Os dados serão conservados enquanto a sua conta estiver ativa ou conforme necessário para fornecer os serviços. Pode solicitar a eliminação dos seus dados a qua |
| 49 | `jsx-text` | Não vendemos nem partilhamos dados comerciais ou pessoais com terceiros para fins publicitários. Os dados apenas são partilhados nas seguintes condições: |
| 51 | `jsx-text` | Prestadores de Serviços (Subprocessadores): |
| 51 | `jsx-text` | Com empresas terceiras que nos ajudam a manter a aplicação a funcionar (como fornecedores de alojamento na nuvem e processadores de pagamento seguros). |
| 52 | `jsx-text` | Obrigações Legais: |
| 57 | `jsx-text` | Solicitar a eliminação definitiva dos seus dados dos nossos servidores na nuvem. |
| 58 | `jsx-text` | Exportar os dados do seu negócio (portabilidade). |
| 59 | `jsx-text` | Retirar o consentimento para integrações (como desconectar o Instagram ou o e-mail) a qualquer momento. |
| 61 | `jsx-text` | Para exercer qualquer um destes direitos, entre em contacto connosco através do e-mail de suporte configurado na aplicação. |
| 62 | `jsx-text` | 6. ALTERAÇÕES A ESTA POLÍTICA |
| 63 | `jsx-text` | Poderemos atualizar esta Política de Privacidade periodicamente para refletir mudanças na aplicação ou por motivos legais. Notificaremos os utilizadores sobre q |
| 9 | `attr:title` | Política de privacidade |
| 9 | `attr:description` | Última atualização: 9 de junho de 2026 |

## `src/routes/projeto-personalizado.tsx`  _(4)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 75 | `jsx-text` | Cálculo |
| 82 | `jsx-text` | Mão de obra |
| 89 | `jsx-text` | Guardar como projeto |
| 46 | `attr:description` | Seleciona materiais, horas e margem para obter o preço final. |

## `src/routes/projetos.tsx`  _(9)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 57 | `jsx-text` | Custo de materiais + horas × preço/hora + margem (default 70%). |
| 59 | `jsx-text` | Novo projeto |
| 61 | `jsx-text` | Novo projeto |
| 77 | `jsx-text` | Concluído |
| 109 | `jsx-text` | Guardar projeto |
| 134 | `jsx-text` | Preço final |
| 143 | `jsx-text` | Concluído |
| 25 | `attr:title` | Projetos & Criação De Projeto |
| 25 | `attr:description` | Todos os teus projetos e o assistente para iniciar um projeto personalizado. |

## `src/routes/quem-somos.tsx`  _(6)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 41 | `jsx-text` | Herança do Novelo |
| 70 | `jsx-text` | primeira plataforma de gestão de negócio criada e focada exclusivamente na nossa área de trabalho |
| 82 | `jsx-text` | A Gestão Descomplicada: |
| 87 | `jsx-text` | O Apoio à Criação: |
| 24 | `attr:description` | A herança e o futuro do nosso artesanato. |
| 113 | `attr:alt` | Sara Afonso em criança ao lado da avó. |

## `src/routes/reset-password.tsx`  _(3)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 61 | `jsx-text` | Nova palavra-passe |
| 65 | `jsx-text` | Confirmar palavra-passe |
| 62 | `attr:placeholder` | Mínimo 6 caracteres |

## `src/routes/sessao-expirada.tsx`  _(5)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 81 | `jsx-text` | Sessão inválida ou expirada |
| 115 | `jsx-text` | A limpar sessão… |
| 117 | `jsx-text` | Voltar a entrar |
| 136 | `jsx-text` | Confirmar saída da sessão |
| 144 | `jsx-text` | Sim, ir para /auth |

## `src/routes/sincronizacao.tsx`  _(2)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 58 | `jsx-text` | Domínio da loja |
| 25 | `attr:title` | Sincronização |

## `src/routes/stock.tsx`  _(10)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 56 | `jsx-text` | Novo material |
| 58 | `jsx-text` | Novo material |
| 68 | `jsx-text` | Código |
| 78 | `jsx-text` | Código/Nº da cor * |
| 93 | `jsx-text` | Preço de compra (€/un) |
| 94 | `jsx-text` | Stock mínimo |
| 159 | `jsx-text` | Código |
| 159 | `jsx-text` | Preço |
| 53 | `attr:description` | Materiais em stock, com fornecedor e preço praticado. |
| 154 | `attr:placeholder` | Pesquisar material por nome ou código… |

## `src/routes/todo.tsx`  _(11)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 258 | `jsx-text` | Média |
| 325 | `jsx-text` | Concluída |
| 335 | `jsx-text` | Selecionar visíveis |
| 372 | `jsx-text` | A vista de calendário respeita os filtros de projeto e estado acima. |
| 376 | `jsx-text` | Sem tarefas neste filtro. |
| 408 | `jsx-text` | Média |
| 426 | `jsx-text` | Concluída |
| 474 | `jsx-text` | Concluída |
| 229 | `attr:description` | Tarefas do atelier. |
| 249 | `attr:placeholder` | Nova tarefa… |
| 285 | `attr:placeholder` | Pesquisar tarefas… |

## `src/routes/vendas.tsx`  _(2)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 16 | `jsx-text` | Histórico |
| 14 | `attr:title` | Vendas concluídas |

## `src/routes/whatsapp.tsx`  _(8)_

| Linha | Tipo | Texto |
|------:|------|-------|
| 33 | `jsx-text` | Verificar ligação |
| 38 | `jsx-text` | Nova mensagem |
| 51 | `jsx-text` | Templates rápidos |
| 79 | `jsx-text` | Histórico de conversas |
| 80 | `jsx-text` | Mensagens recebidas tentam associar-se automaticamente ao cliente por telefone e à encomenda mais recente. Sem correspondência, podes associar manualmente abaix |
| 92 | `jsx-text` | Sem correspondência automática — associar manualmente: |
| 29 | `attr:title` | Sincronização WhatsApp |
| 29 | `attr:description` | Centraliza mensagens, associa-as a clientes/encomendas e usa templates rápidos. |
