# i18n audit — literais fora do idioma-alvo (`en`)

- Diretório: `src/routes`
- Idioma-alvo: `en`
- Exclusões: _nenhuma_
- Mensagens sugeridas: `reports/i18n-audit.messages.json`
- Ficheiros com ocorrências: **56**
- Total de ocorrências: **427**
- Gerado: 2026-07-25T20:30:03.403Z

> Heurística: strings cujo idioma detetado difere de `en` e não estão envolvidas em `t(...)`, `i18n.t(...)`, `tr(...)` ou `<Trans>`.

## `src/routes/privacidade.tsx` — **52** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [12](src/routes/privacidade.tsx#L12) | `jsx-text` | `pt` | A sua privacidade é de extrema importância para nós. Esta Política de Privacidade explica como a nossa aplicação de gestão de negócios recolhe, utiliza, armazen | `privacidade.a_sua_privacidade_e_de_extrema_importanc` |
| [13](src/routes/privacidade.tsx#L13) | `jsx-text` | `pt` | Ao utilizar a aplicação, concorda com as práticas descritas nesta política. | `privacidade.ao_utilizar_a_aplicacao_concorda_com_as_` |
| [14](src/routes/privacidade.tsx#L14) | `jsx-text` | `pt` | 1. INFORMAÇÕES QUE RECOLHEMOS | `privacidade.1_informacoes_que_recolhemos` |
| [15](src/routes/privacidade.tsx#L15) | `jsx-text` | `pt` | Para fornecer uma experiência de gestão completa e permitir a sincronização com canais externos, recolhemos e processamos os seguintes dados: | `privacidade.para_fornecer_uma_experiencia_de_gestao_` |
| [16](src/routes/privacidade.tsx#L16) | `jsx-text` | `pt` | A. Dados de Conta e Gestão do Utilizador (Cliente Comercial) | `privacidade.a_dados_de_conta_e_gestao_do_utilizador_` |
| [17](src/routes/privacidade.tsx#L17) | `jsx-text` | `pt` | Informações de Registo: | `privacidade.informacoes_de_registo` |
| [17](src/routes/privacidade.tsx#L17) | `jsx-text` | `pt` | Nome, endereço de e-mail, número de telefone e dados de autenticação. | `privacidade.nome_endereco_de_e_mail_numero_de_telefo` |
| [18](src/routes/privacidade.tsx#L18) | `jsx-text` | `pt` | Dados de Faturação e Pagamento: | `privacidade.dados_de_faturacao_e_pagamento` |
| [18](src/routes/privacidade.tsx#L18) | `jsx-text` | `pt` | Informações necessárias para processar assinaturas ou pagamentos da aplicação (sincronizados em segurança através do nosso website). | `privacidade.informacoes_necessarias_para_processar_a` |
| [19](src/routes/privacidade.tsx#L19) | `jsx-text` | `pt` | B. Dados do Negócio e Operações (Armazenados na Nuvem) | `privacidade.b_dados_do_negocio_e_operacoes_armazenad` |
| [20](src/routes/privacidade.tsx#L20) | `jsx-text` | `pt` | Como plataforma de gestão, armazenamos na nuvem as informações que insere para gerir o seu negócio, o que inclui: | `privacidade.como_plataforma_de_gestao_armazenamos_na` |
| [22](src/routes/privacidade.tsx#L22) | `jsx-text` | `pt` | Gestão de Stock: | `privacidade.gestao_de_stock` |
| [22](src/routes/privacidade.tsx#L22) | `jsx-text` | `pt` | Listagem de produtos, materiais, quantidades e fornecedores. | `privacidade.listagem_de_produtos_materiais_quantidad` |
| [23](src/routes/privacidade.tsx#L23) | `jsx-text` | `pt` | Encomendas e Vendas: | `privacidade.encomendas_e_vendas` |
| [23](src/routes/privacidade.tsx#L23) | `jsx-text` | `pt` | Histórico de compras, valores e status de entrega. | `privacidade.historico_de_compras_valores_e_status_de` |
| [24](src/routes/privacidade.tsx#L24) | `jsx-text` | `pt` | Marketing e Relatórios: | `privacidade.marketing_e_relatorios` |
| [24](src/routes/privacidade.tsx#L24) | `jsx-text` | `pt` | Dados de desempenho e métricas internas do seu negócio. | `privacidade.dados_de_desempenho_e_metricas_internas_` |
| [26](src/routes/privacidade.tsx#L26) | `jsx-text` | `pt` | C. Dados dos Clientes Finais (Processados em nome do Utilizador) | `privacidade.c_dados_dos_clientes_finais_processados_` |
| [27](src/routes/privacidade.tsx#L27) | `jsx-text` | `pt` | Para que possa gerir o seu negócio, a aplicação processa dados dos seus clientes, tais como: | `privacidade.para_que_possa_gerir_o_seu_negocio_a_apl` |
| [29](src/routes/privacidade.tsx#L29) | `jsx-text` | `pt` | Dados de Identificação e Entrega: | `privacidade.dados_de_identificacao_e_entrega` |
| [29](src/routes/privacidade.tsx#L29) | `jsx-text` | `pt` | Nomes e moradas para envio de encomendas. | `privacidade.nomes_e_moradas_para_envio_de_encomendas` |
| [30](src/routes/privacidade.tsx#L30) | `jsx-text` | `pt` | E-mail e número de telefone. | `privacidade.e_mail_e_numero_de_telefone` |
| [32](src/routes/privacidade.tsx#L32) | `jsx-text` | `pt` | D. Dados de Integração e Sincronização (Website, Redes Sociais e E-mail) | `privacidade.d_dados_de_integracao_e_sincronizacao_we` |
| [33](src/routes/privacidade.tsx#L33) | `jsx-text` | `pt` | Quando opta por sincronizar a aplicação com plataformas externas (como o seu Website, Instagram ou Contas de E-mail): | `privacidade.quando_opta_por_sincronizar_a_aplicacao_` |
| [34](src/routes/privacidade.tsx#L34) | `jsx-text` | `pt` | Comunicações e Conversas: | `privacidade.comunicacoes_e_conversas` |
| [34](src/routes/privacidade.tsx#L34) | `jsx-text` | `pt` | Recolhemos e armazenamos o histórico de mensagens e conversas trocadas com os clientes através do Instagram e e-mail. Estas informações são processadas estritam | `privacidade.recolhemos_e_armazenamos_o_historico_de_` |
| [35](src/routes/privacidade.tsx#L35) | `jsx-text` | `pt` | Sincronização de Dados: | `privacidade.sincronizacao_de_dados` |
| [35](src/routes/privacidade.tsx#L35) | `jsx-text` | `pt` | Informações de encomendas ou contactos gerados no seu website são importados automaticamente para a aplicação. | `privacidade.informacoes_de_encomendas_ou_contactos_g` |
| [36](src/routes/privacidade.tsx#L36) | `jsx-text` | `pt` | 2. COMO UTILIZAMOS AS INFORMAÇÕES | `privacidade.2_como_utilizamos_as_informacoes` |
| [38](src/routes/privacidade.tsx#L38) | `jsx-text` | `pt` | Prestação, manutenção e melhoria de todas as funcionalidades da aplicação. | `privacidade.prestacao_manutencao_e_melhoria_de_todas` |
| [39](src/routes/privacidade.tsx#L39) | `jsx-text` | `pt` | Processamento de pagamentos e gestão de assinaturas. | `privacidade.processamento_de_pagamentos_e_gestao_de_` |
| [40](src/routes/privacidade.tsx#L40) | `jsx-text` | `pt` | Sincronização em tempo real entre a aplicação, o seu website, e-mail e Instagram. | `privacidade.sincronizacao_em_tempo_real_entre_a_apli` |
| [41](src/routes/privacidade.tsx#L41) | `jsx-text` | `pt` | Suporte técnico e atendimento ao cliente. | `privacidade.suporte_tecnico_e_atendimento_ao_cliente` |
| [42](src/routes/privacidade.tsx#L42) | `jsx-text` | `pt` | Envio de comunicações importantes sobre atualizações de segurança ou alterações nos termos de serviço. | `privacidade.envio_de_comunicacoes_importantes_sobre_` |
| [44](src/routes/privacidade.tsx#L44) | `jsx-text` | `pt` | 3. SEGURANÇA E ARMAZENAMENTO NA NUVEM | `privacidade.3_seguranca_e_armazenamento_na_nuvem` |
| [45](src/routes/privacidade.tsx#L45) | `jsx-text` | `pt` | Segregação de Dados: | `privacidade.segregacao_de_dados` |
| [45](src/routes/privacidade.tsx#L45) | `jsx-text` | `pt` | Garantimos que todos os dados do seu negócio (encomendas, stock, conversas) estão completamente segregados e isolados. Nenhum outro utilizador da aplicação terá | `privacidade.garantimos_que_todos_os_dados_do_seu_neg` |
| [46](src/routes/privacidade.tsx#L46) | `jsx-text` | `pt` | Todos os dados são armazenados em servidores na nuvem que cumprem elevados padrões de segurança e encriptação. | `privacidade.todos_os_dados_sao_armazenados_em_servid` |
| [47](src/routes/privacidade.tsx#L47) | `jsx-text` | `pt` | Retenção: | `privacidade.retencao` |
| [47](src/routes/privacidade.tsx#L47) | `jsx-text` | `pt` | Os dados serão conservados enquanto a sua conta estiver ativa ou conforme necessário para fornecer os serviços. Pode solicitar a eliminação dos seus dados a qua | `privacidade.os_dados_serao_conservados_enquanto_a_su` |
| [49](src/routes/privacidade.tsx#L49) | `jsx-text` | `pt` | Não vendemos nem partilhamos dados comerciais ou pessoais com terceiros para fins publicitários. Os dados apenas são partilhados nas seguintes condições: | `privacidade.nao_vendemos_nem_partilhamos_dados_comer` |
| [51](src/routes/privacidade.tsx#L51) | `jsx-text` | `pt` | Prestadores de Serviços (Subprocessadores): | `privacidade.prestadores_de_servicos_subprocessadores` |
| [51](src/routes/privacidade.tsx#L51) | `jsx-text` | `pt` | Com empresas terceiras que nos ajudam a manter a aplicação a funcionar (como fornecedores de alojamento na nuvem e processadores de pagamento seguros). | `privacidade.com_empresas_terceiras_que_nos_ajudam_a_` |
| [52](src/routes/privacidade.tsx#L52) | `jsx-text` | `pt` | Obrigações Legais: | `privacidade.obrigacoes_legais` |
| [57](src/routes/privacidade.tsx#L57) | `jsx-text` | `pt` | Solicitar a eliminação definitiva dos seus dados dos nossos servidores na nuvem. | `privacidade.solicitar_a_eliminacao_definitiva_dos_se` |
| [58](src/routes/privacidade.tsx#L58) | `jsx-text` | `pt` | Exportar os dados do seu negócio (portabilidade). | `privacidade.exportar_os_dados_do_seu_negocio_portabi` |
| [59](src/routes/privacidade.tsx#L59) | `jsx-text` | `pt` | Retirar o consentimento para integrações (como desconectar o Instagram ou o e-mail) a qualquer momento. | `privacidade.retirar_o_consentimento_para_integracoes` |
| [61](src/routes/privacidade.tsx#L61) | `jsx-text` | `pt` | Para exercer qualquer um destes direitos, entre em contacto connosco através do e-mail de suporte configurado na aplicação. | `privacidade.para_exercer_qualquer_um_destes_direitos` |
| [62](src/routes/privacidade.tsx#L62) | `jsx-text` | `pt` | 6. ALTERAÇÕES A ESTA POLÍTICA | `privacidade.6_alteracoes_a_esta_politica` |
| [63](src/routes/privacidade.tsx#L63) | `jsx-text` | `pt` | Poderemos atualizar esta Política de Privacidade periodicamente para refletir mudanças na aplicação ou por motivos legais. Notificaremos os utilizadores sobre q | `privacidade.poderemos_atualizar_esta_politica_de_pri` |
| [9](src/routes/privacidade.tsx#L9) | `attr:title` | `pt` | Política de privacidade | `privacidade.politica_de_privacidade` |
| [9](src/routes/privacidade.tsx#L9) | `attr:description` | `pt` | Última atualização: 9 de junho de 2026 | `privacidade.ultima_atualizacao_9_de_junho_de_2026` |

## `src/routes/design.tsx` — **40** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [93](src/routes/design.tsx#L93) | `jsx-text` | `pt` | Personalização | `design.personalizacao` |
| [94](src/routes/design.tsx#L94) | `jsx-text` | `pt` | Configurações | `design.configuracoes` |
| [174](src/routes/design.tsx#L174) | `jsx-text` | `pt` | Tipo de letra dos cabeçalhos | `design.tipo_de_letra_dos_cabecalhos` |
| [176](src/routes/design.tsx#L176) | `jsx-text` | `pt` | Aplica-se ao título de todas as páginas ao mesmo tempo. | `design.aplica_se_ao_titulo_de_todas_as_paginas_` |
| [180](src/routes/design.tsx#L180) | `jsx-text` | `pt` | Limpar overrides por página | `design.limpar_overrides_por_pagina` |
| [187](src/routes/design.tsx#L187) | `jsx-text` | `pt` | Nome do negócio | `design.nome_do_negocio` |
| [189](src/routes/design.tsx#L189) | `jsx-text` | `pt` | Preço-hora base (€) | `design.preco_hora_base` |
| [192](src/routes/design.tsx#L192) | `jsx-text` | `pt` | Usado por defeito em novos projetos e na calculadora. | `design.usado_por_defeito_em_novos_projetos_e_na` |
| [218](src/routes/design.tsx#L218) | `jsx-text` | `pt` | Controla luminosidade, saturação, matiz e contraste dos itens. | `design.controla_luminosidade_saturacao_matiz_e_` |
| [240](src/routes/design.tsx#L240) | `jsx-text` | `pt` | Transparência das janelas com contorno | `design.transparencia_das_janelas_com_contorno` |
| [242](src/routes/design.tsx#L242) | `jsx-text` | `pt` | Ajusta o fundo de todos os campos de texto, textareas e cartões com contorno — do mais opaco ao mais transparente. | `design.ajusta_o_fundo_de_todos_os_campos_de_tex` |
| [255](src/routes/design.tsx#L255) | `jsx-text` | `pt` | Calibrar opacidade dos botões | `design.calibrar_opacidade_dos_botoes` |
| [257](src/routes/design.tsx#L257) | `jsx-text` | `pt` | Controla independentemente a opacidade dos botões primários, secundários e outline. | `design.controla_independentemente_a_opacidade_d` |
| [285](src/routes/design.tsx#L285) | `jsx-text` | `pt` | Pré-visualização | `design.pre_visualizacao` |
| [287](src/routes/design.tsx#L287) | `jsx-text` | `pt` | Botão primário | `design.botao_primario` |
| [288](src/routes/design.tsx#L288) | `jsx-text` | `pt` | Botão outline | `design.botao_outline` |
| [289](src/routes/design.tsx#L289) | `jsx-text` | `pt` | Secundário | `design.secundario` |
| [325](src/routes/design.tsx#L325) | `jsx-text` | `pt` | A categoria selecionada mantém-se destacada enquanto navegas dentro dela. | `design.a_categoria_selecionada_mantem_se_destac` |
| [337](src/routes/design.tsx#L337) | `jsx-text` | `pt` | Cores gerais (janelas, botões, fundos) | `design.cores_gerais_janelas_botoes_fundos` |
| [349](src/routes/design.tsx#L349) | `jsx-text` | `pt` | Aplica-se a toda a app. Deixa vazio para usar o padrão. | `design.aplica_se_a_toda_a_app_deixa_vazio_para_` |
| [353](src/routes/design.tsx#L353) | `jsx-text` | `pt` | Cabeçalho da aplicação | `design.cabecalho_da_aplicacao` |
| [355](src/routes/design.tsx#L355) | `jsx-text` | `pt` | Barra superior onde está o ícone que abre o menu lateral. | `design.barra_superior_onde_esta_o_icone_que_abr` |
| [389](src/routes/design.tsx#L389) | `jsx-text` | `pt` | Repor padrão | `design.repor_padrao` |
| [395](src/routes/design.tsx#L395) | `jsx-text` | `pt` | Personaliza a cor de fundo e do texto das caixas de aviso (ex.: ecrã de "Sessão expirada"). Funciona com tons claros ou escuros. | `design.personaliza_a_cor_de_fundo_e_do_texto_da` |
| [402](src/routes/design.tsx#L402) | `jsx-text` | `pt` | Âmbar (claro) | `design.ambar_claro` |
| [90](src/routes/design.tsx#L90) | `attr:title` | `pt` | Personalização & Configurações | `design.personalizacao_configuracoes` |
| [90](src/routes/design.tsx#L90) | `attr:description` | `pt` | Aparência da aplicação e definições gerais num só sítio. | `design.aparencia_da_aplicacao_e_definicoes_gera` |
| [177](src/routes/design.tsx#L177) | `attr:label` | `pt` | Letra global dos cabeçalhos | `design.letra_global_dos_cabecalhos` |
| [312](src/routes/design.tsx#L312) | `attr:label` | `pt` | Tipo de letra dos títulos | `design.tipo_de_letra_dos_titulos` |
| [313](src/routes/design.tsx#L313) | `attr:label` | `pt` | Cor dos títulos | `design.cor_dos_titulos` |
| [339](src/routes/design.tsx#L339) | `attr:label` | `pt` | Cor de fundo das páginas | `design.cor_de_fundo_das_paginas` |
| [342](src/routes/design.tsx#L342) | `attr:label` | `pt` | Cor de áreas suaves (muted) | `design.cor_de_areas_suaves_muted` |
| [343](src/routes/design.tsx#L343) | `attr:label` | `pt` | Cor dos botões primários | `design.cor_dos_botoes_primarios` |
| [344](src/routes/design.tsx#L344) | `attr:label` | `pt` | Cor do texto dos botões | `design.cor_do_texto_dos_botoes` |
| [345](src/routes/design.tsx#L345) | `attr:label` | `pt` | Cor dos botões secundários | `design.cor_dos_botoes_secundarios` |
| [346](src/routes/design.tsx#L346) | `attr:label` | `pt` | Cor do texto dos botões secundários | `design.cor_do_texto_dos_botoes_secundarios` |
| [347](src/routes/design.tsx#L347) | `attr:label` | `pt` | Cor dos botões outline | `design.cor_dos_botoes_outline` |
| [348](src/routes/design.tsx#L348) | `attr:label` | `pt` | Cor do texto dos botões outline | `design.cor_do_texto_dos_botoes_outline` |
| [356](src/routes/design.tsx#L356) | `attr:label` | `pt` | Cor de fundo do cabeçalho | `design.cor_de_fundo_do_cabecalho` |
| [357](src/routes/design.tsx#L357) | `attr:label` | `pt` | Cor do ícone/texto do cabeçalho | `design.cor_do_icone_texto_do_cabecalho` |

## `src/routes/ferramentas-tecnicas.tsx` — **26** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [48](src/routes/ferramentas-tecnicas.tsx#L48) | `jsx-text` | `pt` | Instruções de uso | `ferramentas-tecnicas.instrucoes_de_uso` |
| [50](src/routes/ferramentas-tecnicas.tsx#L50) | `jsx-text` | `pt` | Editor de Receitas: Amigurumis & Crochê | `ferramentas-tecnicas.editor_de_receitas_amigurumis_croche` |
| [52](src/routes/ferramentas-tecnicas.tsx#L52) | `jsx-text` | `pt` | Editor de Gráficos: Ponto Cruz | `ferramentas-tecnicas.editor_de_graficos_ponto_cruz` |
| [53](src/routes/ferramentas-tecnicas.tsx#L53) | `jsx-text` | `pt` | Editor de Padrões: Bordado | `ferramentas-tecnicas.editor_de_padroes_bordado` |
| [686](src/routes/ferramentas-tecnicas.tsx#L686) | `jsx-text` | `pt` | Modo Seleção | `ferramentas-tecnicas.modo_selecao` |
| [687](src/routes/ferramentas-tecnicas.tsx#L687) | `jsx-text` | `pt` | Adicionar Ponto Reto | `ferramentas-tecnicas.adicionar_ponto_reto` |
| [688](src/routes/ferramentas-tecnicas.tsx#L688) | `jsx-text` | `pt` | Adicionar Ponto Curvo | `ferramentas-tecnicas.adicionar_ponto_curvo` |
| [755](src/routes/ferramentas-tecnicas.tsx#L755) | `jsx-text` | `pt` | Gestão do Molde: | `ferramentas-tecnicas.gestao_do_molde` |
| [756](src/routes/ferramentas-tecnicas.tsx#L756) | `jsx-text` | `pt` | Guardar na Biblioteca | `ferramentas-tecnicas.guardar_na_biblioteca` |
| [757](src/routes/ferramentas-tecnicas.tsx#L757) | `jsx-text` | `pt` | Guardar no Dispositivo (.json) | `ferramentas-tecnicas.guardar_no_dispositivo_json` |
| [758](src/routes/ferramentas-tecnicas.tsx#L758) | `jsx-text` | `pt` | Guardar no Dispositivo (.png) | `ferramentas-tecnicas.guardar_no_dispositivo_png` |
| [785](src/routes/ferramentas-tecnicas.tsx#L785) | `jsx-text` | `pt` | Apagar… | `ferramentas-tecnicas.apagar` |
| [795](src/routes/ferramentas-tecnicas.tsx#L795) | `jsx-text` | `pt` | Calibração de escala: | `ferramentas-tecnicas.calibracao_de_escala` |
| [812](src/routes/ferramentas-tecnicas.tsx#L812) | `jsx-text` | `pt` | Calibração automática | `ferramentas-tecnicas.calibracao_automatica` |
| [818](src/routes/ferramentas-tecnicas.tsx#L818) | `jsx-text` | `pt` | Medição obtida (mm) | `ferramentas-tecnicas.medicao_obtida_mm` |
| [906](src/routes/ferramentas-tecnicas.tsx#L906) | `jsx-text` | `pt` | Instruções | `ferramentas-tecnicas.instrucoes` |
| [1007](src/routes/ferramentas-tecnicas.tsx#L1007) | `jsx-text` | `pt` | Adicionar linha por medida | `ferramentas-tecnicas.adicionar_linha_por_medida` |
| [1116](src/routes/ferramentas-tecnicas.tsx#L1116) | `jsx-text` | `pt` | Símbolos | `ferramentas-tecnicas.simbolos` |
| [1273](src/routes/ferramentas-tecnicas.tsx#L1273) | `jsx-text` | `pt` | Imagem de referência | `ferramentas-tecnicas.imagem_de_referencia` |
| [1300](src/routes/ferramentas-tecnicas.tsx#L1300) | `jsx-text` | `pt` | Limpar traços | `ferramentas-tecnicas.limpar_tracos` |
| [35](src/routes/ferramentas-tecnicas.tsx#L35) | `attr:feature` | `pt` | Ferramentas Técnicas | `ferramentas-tecnicas.ferramentas_tecnicas` |
| [44](src/routes/ferramentas-tecnicas.tsx#L44) | `attr:title` | `pt` | Ferramentas Técnicas | `ferramentas-tecnicas.ferramentas_tecnicas` |
| [918](src/routes/ferramentas-tecnicas.tsx#L918) | `attr:placeholder` | `pt` | Título da receita | `ferramentas-tecnicas.titulo_da_receita` |
| [919](src/routes/ferramentas-tecnicas.tsx#L919) | `attr:placeholder` | `pt` | Materiais, agulha, nível... | `ferramentas-tecnicas.materiais_agulha_nivel` |
| [1137](src/routes/ferramentas-tecnicas.tsx#L1137) | `attr:defaultTitulo` | `pt` | Gráfico Ponto Cruz | `ferramentas-tecnicas.grafico_ponto_cruz` |
| [1303](src/routes/ferramentas-tecnicas.tsx#L1303) | `attr:defaultTitulo` | `pt` | Padrão Bordado | `ferramentas-tecnicas.padrao_bordado` |

## `src/routes/perfil-negocio.tsx` — **22** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [76](src/routes/perfil-negocio.tsx#L76) | `jsx-text` | `pt` | Guardar alterações | `perfil-negocio.guardar_alteracoes` |
| [88](src/routes/perfil-negocio.tsx#L88) | `jsx-text` | `pt` | Perfil de Negócio | `perfil-negocio.perfil_de_negocio` |
| [100](src/routes/perfil-negocio.tsx#L100) | `jsx-text` | `pt` | Foto de perfil — visível no cabeçalho e exportações. | `perfil-negocio.foto_de_perfil_visivel_no_cabecalho_e_ex` |
| [132](src/routes/perfil-negocio.tsx#L132) | `jsx-text` | `pt` | Logótipo do Atelier | `perfil-negocio.logotipo_do_atelier` |
| [135](src/routes/perfil-negocio.tsx#L135) | `jsx-text` | `pt` | PNG transparente recomendado. Usado automaticamente como marca de água em todos os editores técnicos. | `perfil-negocio.png_transparente_recomendado_usado_autom` |
| [41](src/routes/perfil-negocio.tsx#L41) | `attr:emailPessoal` | `pt` | E-mail inválido | `perfil-negocio.e_mail_invalido` |
| [42](src/routes/perfil-negocio.tsx#L42) | `attr:email` | `pt` | E-mail inválido | `perfil-negocio.e_mail_invalido` |
| [43](src/routes/perfil-negocio.tsx#L43) | `attr:telefonePessoal` | `pt` | Telemóvel inválido | `perfil-negocio.telemovel_invalido` |
| [44](src/routes/perfil-negocio.tsx#L44) | `attr:telefone` | `pt` | Telefone inválido | `perfil-negocio.telefone_invalido` |
| [45](src/routes/perfil-negocio.tsx#L45) | `attr:nif` | `pt` | NIF inválido (9 dígitos) | `perfil-negocio.nif_invalido_9_digitos` |
| [46](src/routes/perfil-negocio.tsx#L46) | `attr:website` | `pt` | URL inválido (https://…) | `perfil-negocio.url_invalido_https` |
| [47](src/routes/perfil-negocio.tsx#L47) | `attr:pinterest` | `pt` | URL inválido (https://…) | `perfil-negocio.url_invalido_https` |
| [48](src/routes/perfil-negocio.tsx#L48) | `attr:lojaOnline` | `pt` | URL inválido (https://…) | `perfil-negocio.url_invalido_https` |
| [84](src/routes/perfil-negocio.tsx#L84) | `attr:title` | `pt` | Perfil Pessoal & Negócio | `perfil-negocio.perfil_pessoal_negocio` |
| [84](src/routes/perfil-negocio.tsx#L84) | `attr:description` | `pt` | A artesã por trás da marca e a identidade do atelier. | `perfil-negocio.a_artesa_por_tras_da_marca_e_a_identidad` |
| [109](src/routes/perfil-negocio.tsx#L109) | `attr:label` | `pt` | Telemóvel | `perfil-negocio.telemovel` |
| [114](src/routes/perfil-negocio.tsx#L114) | `attr:placeholder` | `pt` | Conta a tua história no artesanato… | `perfil-negocio.conta_a_tua_historia_no_artesanato` |
| [124](src/routes/perfil-negocio.tsx#L124) | `attr:placeholder` | `pt` | Ex: Herança do Novelo | `perfil-negocio.ex_heranca_do_novelo` |
| [143](src/routes/perfil-negocio.tsx#L143) | `attr:label` | `pt` | E-mail do negócio | `perfil-negocio.e_mail_do_negocio` |
| [146](src/routes/perfil-negocio.tsx#L146) | `attr:label` | `pt` | Telefone do negócio | `perfil-negocio.telefone_do_negocio` |
| [158](src/routes/perfil-negocio.tsx#L158) | `attr:label` | `pt` | Código Postal | `perfil-negocio.codigo_postal` |
| [164](src/routes/perfil-negocio.tsx#L164) | `attr:label` | `pt` | País | `perfil-negocio.pais` |

## `src/routes/marketing-conteudo.tsx` — **17** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [35](src/routes/marketing-conteudo.tsx#L35) | `jsx-text` | `pt` | Campanhas e Métricas | `marketing-conteudo.campanhas_e_metricas` |
| [95](src/routes/marketing-conteudo.tsx#L95) | `jsx-text` | `pt` | Conversões | `marketing-conteudo.conversoes` |
| [108](src/routes/marketing-conteudo.tsx#L108) | `jsx-text` | `pt` | Histórico de campanhas | `marketing-conteudo.historico_de_campanhas` |
| [132](src/routes/marketing-conteudo.tsx#L132) | `jsx-text` | `pt` | Calendário Festivo | `marketing-conteudo.calendario_festivo` |
| [260](src/routes/marketing-conteudo.tsx#L260) | `jsx-text` | `pt` | Edita cada ideia antes de adicionar ao calendário. | `marketing-conteudo.edita_cada_ideia_antes_de_adicionar_ao_c` |
| [315](src/routes/marketing-conteudo.tsx#L315) | `jsx-text` | `pt` | Quem é o meu cliente? | `marketing-conteudo.quem_e_o_meu_cliente` |
| [346](src/routes/marketing-conteudo.tsx#L346) | `jsx-text` | `pt` | Análise de Mercado e Tendências | `marketing-conteudo.analise_de_mercado_e_tendencias` |
| [349](src/routes/marketing-conteudo.tsx#L349) | `jsx-text` | `pt` | Notas livres sobre concorrência, tendências e hashtags | `marketing-conteudo.notas_livres_sobre_concorrencia_tendenci` |
| [360](src/routes/marketing-conteudo.tsx#L360) | `jsx-text` | `pt` | Guardar alterações | `marketing-conteudo.guardar_alteracoes` |
| [30](src/routes/marketing-conteudo.tsx#L30) | `attr:title` | `pt` | Marketing e Conteúdo | `marketing-conteudo.marketing_e_conteudo` |
| [31](src/routes/marketing-conteudo.tsx#L31) | `attr:description` | `pt` | Campanhas, métricas, persona do comprador e atalhos criativos — tudo num só lugar. | `marketing-conteudo.campanhas_metricas_persona_do_comprador_` |
| [83](src/routes/marketing-conteudo.tsx#L83) | `attr:label` | `pt` | Conversões | `marketing-conteudo.conversoes` |
| [272](src/routes/marketing-conteudo.tsx#L272) | `attr:placeholder` | `pt` | Título | `marketing-conteudo.titulo` |
| [318](src/routes/marketing-conteudo.tsx#L318) | `attr:placeholder` | `pt` | Ex.: Mulher 30-55 anos, mãe ou avó, sensível a artesanato genuíno… | `marketing-conteudo.ex_mulher_30_55_anos_mae_ou_avo_sensivel` |
| [327](src/routes/marketing-conteudo.tsx#L327) | `attr:placeholder` | `pt` | Ex.: Procura presentes únicos e com significado; quer apoiar pequenos negócios… | `marketing-conteudo.ex_procura_presentes_unicos_e_com_signif` |
| [352](src/routes/marketing-conteudo.tsx#L352) | `attr:placeholder` | `pt` | • Concorrente X: lançou coleção de amigurumi de animais marinhos\n• Tendência: cores terrosas, tons pastel\n• Hashtags fortes: #amigurumipt #tricotin #handmadew | `marketing-conteudo.concorrente_x_lancou_colecao_de_amigurum` |
| [352](src/routes/marketing-conteudo.tsx#L352) | `jsx-brace-string` | `pt` | • Concorrente X: lançou coleção de amigurumi de animais marinhos\n• Tendência: cores terrosas, tons pastel\n• Hashtags fortes: #amigurumipt #tricotin #handmadew | `marketing-conteudo.concorrente_x_lancou_colecao_de_amigurum` |

## `src/routes/planos.tsx` — **17** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [117](src/routes/planos.tsx#L117) | `jsx-text` | `pt` | inicia sessão | `planos.inicia_sessao` |
| [129](src/routes/planos.tsx#L129) | `jsx-text` | `pt` | Vitalício | `planos.vitalicio` |
| [157](src/routes/planos.tsx#L157) | `jsx-text` | `pt` | Grátis | `planos.gratis` |
| [166](src/routes/planos.tsx#L166) | `jsx-text` | `pt` | /mês | `planos.mes` |
| [183](src/routes/planos.tsx#L183) | `jsx-text` | `pt` | Experimente Grátis por 14 Dias | `planos.experimente_gratis_por_14_dias` |
| [249](src/routes/planos.tsx#L249) | `jsx-text` | `pt` | Tens um código promocional? | `planos.tens_um_codigo_promocional` |
| [305](src/routes/planos.tsx#L305) | `jsx-text` | `pt` | Resumo do benefício ativado: | `planos.resumo_do_beneficio_ativado` |
| [309](src/routes/planos.tsx#L309) | `jsx-text` | `pt` | Código Aplicado: | `planos.codigo_aplicado` |
| [311](src/routes/planos.tsx#L311) | `jsx-text` | `pt` | Novos Preços: | `planos.novos_precos` |
| [311](src/routes/planos.tsx#L311) | `jsx-text` | `pt` | Os valores exibidos nos cartões de plano acima já incluem este desconto! | `planos.os_valores_exibidos_nos_cartoes_de_plano` |
| [315](src/routes/planos.tsx#L315) | `jsx-text` | `pt` | Acesso Vitalício: | `planos.acesso_vitalicio` |
| [316](src/routes/planos.tsx#L316) | `jsx-text` | `pt` | Premium Vitalício | `planos.premium_vitalicio` |
| [317](src/routes/planos.tsx#L317) | `jsx-text` | `pt` | Acesso total a todas as ferramentas (Criador de Moldes, Assistente IA, Exportações e mais), sem necessidade de pagamentos recorrentes ou subscrições futuras. | `planos.acesso_total_a_todas_as_ferramentas_cria` |
| [320](src/routes/planos.tsx#L320) | `jsx-text` | `pt` | Código aplicado com sucesso no seu perfil do atelier. | `planos.codigo_aplicado_com_sucesso_no_seu_perfi` |
| [331](src/routes/planos.tsx#L331) | `jsx-text` | `pt` | Acesso Premium Vitalício Ativo | `planos.acesso_premium_vitalicio_ativo` |
| [97](src/routes/planos.tsx#L97) | `attr:title` | `pt` | Planos e Subscrições | `planos.planos_e_subscricoes` |
| [98](src/routes/planos.tsx#L98) | `attr:description` | `pt` | Escolhe o nível de acesso. Todos os planos pagos incluem 14 dias grátis sem compromisso. | `planos.escolhe_o_nivel_de_acesso_todos_os_plano` |

## `src/routes/todo.tsx` — **11** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [258](src/routes/todo.tsx#L258) | `jsx-text` | `pt` | Média | `todo.media` |
| [325](src/routes/todo.tsx#L325) | `jsx-text` | `pt` | Concluída | `todo.concluida` |
| [335](src/routes/todo.tsx#L335) | `jsx-text` | `pt` | Selecionar visíveis | `todo.selecionar_visiveis` |
| [372](src/routes/todo.tsx#L372) | `jsx-text` | `pt` | A vista de calendário respeita os filtros de projeto e estado acima. | `todo.a_vista_de_calendario_respeita_os_filtro` |
| [376](src/routes/todo.tsx#L376) | `jsx-text` | `pt` | Sem tarefas neste filtro. | `todo.sem_tarefas_neste_filtro` |
| [408](src/routes/todo.tsx#L408) | `jsx-text` | `pt` | Média | `todo.media` |
| [426](src/routes/todo.tsx#L426) | `jsx-text` | `pt` | Concluída | `todo.concluida` |
| [474](src/routes/todo.tsx#L474) | `jsx-text` | `pt` | Concluída | `todo.concluida` |
| [229](src/routes/todo.tsx#L229) | `attr:description` | `pt` | Tarefas do atelier. | `todo.tarefas_do_atelier` |
| [249](src/routes/todo.tsx#L249) | `attr:placeholder` | `pt` | Nova tarefa… | `todo.nova_tarefa` |
| [285](src/routes/todo.tsx#L285) | `attr:placeholder` | `pt` | Pesquisar tarefas… | `todo.pesquisar_tarefas` |

## `src/routes/atelier-sounds.tsx` — **10** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [160](src/routes/atelier-sounds.tsx#L160) | `jsx-text` | `pt` | Temporizador de desconexão | `atelier-sounds.temporizador_de_desconexao` |
| [239](src/routes/atelier-sounds.tsx#L239) | `jsx-text` | `pt` | Ligar conta Spotify | `atelier-sounds.ligar_conta_spotify` |
| [241](src/routes/atelier-sounds.tsx#L241) | `jsx-text` | `pt` | A integração com Spotify está temporariamente indisponível. | `atelier-sounds.a_integracao_com_spotify_esta_temporaria` |
| [246](src/routes/atelier-sounds.tsx#L246) | `jsx-text` | `pt` | A carregar… | `atelier-sounds.a_carregar` |
| [275](src/routes/atelier-sounds.tsx#L275) | `jsx-text` | `pt` | A reprodução acontece no teu leitor Spotify ativo (telemóvel, desktop ou web). Abre o Spotify primeiro se nada acontecer. | `atelier-sounds.a_reproducao_acontece_no_teu_leitor_spot` |
| [301](src/routes/atelier-sounds.tsx#L301) | `jsx-text` | `pt` | ligação direta | `atelier-sounds.ligacao_direta` |
| [305](src/routes/atelier-sounds.tsx#L305) | `jsx-text` | `pt` | URL Amazon Music (playlist, estação ou álbum) | `atelier-sounds.url_amazon_music_playlist_estacao_ou_alb` |
| [315](src/routes/atelier-sounds.tsx#L315) | `jsx-text` | `pt` | Estações | `atelier-sounds.estacoes` |
| [66](src/routes/atelier-sounds.tsx#L66) | `attr:description` | `pt` | Música ambiente e sons de relaxamento — continuam a tocar enquanto navegas pela app. | `atelier-sounds.musica_ambiente_e_sons_de_relaxamento_co` |
| [94](src/routes/atelier-sounds.tsx#L94) | `attr:aria-label` | `pt` | Próxima faixa | `atelier-sounds.proxima_faixa` |

## `src/routes/stock.tsx` — **10** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [56](src/routes/stock.tsx#L56) | `jsx-text` | `pt` | Novo material | `stock.novo_material` |
| [58](src/routes/stock.tsx#L58) | `jsx-text` | `pt` | Novo material | `stock.novo_material` |
| [68](src/routes/stock.tsx#L68) | `jsx-text` | `pt` | Código | `stock.codigo` |
| [78](src/routes/stock.tsx#L78) | `jsx-text` | `pt` | Código/Nº da cor * | `stock.codigo_n_da_cor` |
| [93](src/routes/stock.tsx#L93) | `jsx-text` | `pt` | Preço de compra (€/un) | `stock.preco_de_compra_un` |
| [94](src/routes/stock.tsx#L94) | `jsx-text` | `pt` | Stock mínimo | `stock.stock_minimo` |
| [159](src/routes/stock.tsx#L159) | `jsx-text` | `pt` | Código | `stock.codigo` |
| [159](src/routes/stock.tsx#L159) | `jsx-text` | `pt` | Preço | `stock.preco` |
| [53](src/routes/stock.tsx#L53) | `attr:description` | `pt` | Materiais em stock, com fornecedor e preço praticado. | `stock.materiais_em_stock_com_fornecedor_e_prec` |
| [154](src/routes/stock.tsx#L154) | `attr:placeholder` | `pt` | Pesquisar material por nome ou código… | `stock.pesquisar_material_por_nome_ou_codigo` |

## `src/routes/crescimento.tsx` — **9** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [41](src/routes/crescimento.tsx#L41) | `jsx-text` | `pt` | Vendas por mês | `crescimento.vendas_por_mes` |
| [55](src/routes/crescimento.tsx#L55) | `jsx-text` | `pt` | Distribuição encomendas | `crescimento.distribuicao_encomendas` |
| [70](src/routes/crescimento.tsx#L70) | `jsx-text` | `pt` | Relatório executivo | `crescimento.relatorio_executivo` |
| [72](src/routes/crescimento.tsx#L72) | `jsx-text` | `pt` | • Margem média por projeto: | `crescimento.margem_media_por_projeto` |
| [73](src/routes/crescimento.tsx#L73) | `jsx-text` | `pt` | • Estado mais comum das encomendas: | `crescimento.estado_mais_comum_das_encomendas` |
| [75](src/routes/crescimento.tsx#L75) | `jsx-text` | `pt` | • Recomendação: aumentar margem para 80% nos projetos personalizados de baixo volume. | `crescimento.recomendacao_aumentar_margem_para_80_nos` |
| [32](src/routes/crescimento.tsx#L32) | `attr:title` | `pt` | Crescimento do negócio | `crescimento.crescimento_do_negocio` |
| [32](src/routes/crescimento.tsx#L32) | `attr:description` | `pt` | Estatísticas e relatórios periódicos para gestão estratégica. | `crescimento.estatisticas_e_relatorios_periodicos_par` |
| [37](src/routes/crescimento.tsx#L37) | `attr:label` | `pt` | Lucro médio/projeto | `crescimento.lucro_medio_projeto` |

## `src/routes/projetos.tsx` — **9** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [57](src/routes/projetos.tsx#L57) | `jsx-text` | `pt` | Custo de materiais + horas × preço/hora + margem (default 70%). | `projetos.custo_de_materiais_horas_preco_hora_marg` |
| [59](src/routes/projetos.tsx#L59) | `jsx-text` | `pt` | Novo projeto | `projetos.novo_projeto` |
| [61](src/routes/projetos.tsx#L61) | `jsx-text` | `pt` | Novo projeto | `projetos.novo_projeto` |
| [77](src/routes/projetos.tsx#L77) | `jsx-text` | `pt` | Concluído | `projetos.concluido` |
| [109](src/routes/projetos.tsx#L109) | `jsx-text` | `pt` | Guardar projeto | `projetos.guardar_projeto` |
| [134](src/routes/projetos.tsx#L134) | `jsx-text` | `pt` | Preço final | `projetos.preco_final` |
| [143](src/routes/projetos.tsx#L143) | `jsx-text` | `pt` | Concluído | `projetos.concluido` |
| [25](src/routes/projetos.tsx#L25) | `attr:title` | `pt` | Projetos & Criação De Projeto | `projetos.projetos_criacao_de_projeto` |
| [25](src/routes/projetos.tsx#L25) | `attr:description` | `pt` | Todos os teus projetos e o assistente para iniciar um projeto personalizado. | `projetos.todos_os_teus_projetos_e_o_assistente_pa` |

## `src/routes/cashflow.tsx` — **8** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [49](src/routes/cashflow.tsx#L49) | `jsx-text` | `pt` | Saídas por categoria | `cashflow.saidas_por_categoria` |
| [64](src/routes/cashflow.tsx#L64) | `jsx-text` | `pt` | Sugestões | `cashflow.sugestoes` |
| [66](src/routes/cashflow.tsx#L66) | `jsx-text` | `pt` | A finança está saudável. Continua assim! | `cashflow.a_financa_esta_saudavel_continua_assim` |
| [73](src/routes/cashflow.tsx#L73) | `jsx-text` | `pt` | Novo movimento | `cashflow.novo_movimento` |
| [78](src/routes/cashflow.tsx#L78) | `jsx-text` | `pt` | Saída | `cashflow.saida` |
| [82](src/routes/cashflow.tsx#L82) | `jsx-text` | `pt` | Descrição | `cashflow.descricao` |
| [91](src/routes/cashflow.tsx#L91) | `jsx-text` | `pt` | Descrição | `cashflow.descricao` |
| [42](src/routes/cashflow.tsx#L42) | `attr:label` | `pt` | Saídas | `cashflow.saidas` |

## `src/routes/editor-moodboards.tsx` — **8** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [255](src/routes/editor-moodboards.tsx#L255) | `jsx-text` | `pt` | Guardar na aplicação | `editor-moodboards.guardar_na_aplicacao` |
| [256](src/routes/editor-moodboards.tsx#L256) | `jsx-text` | `pt` | Guardar no dispositivo | `editor-moodboards.guardar_no_dispositivo` |
| [307](src/routes/editor-moodboards.tsx#L307) | `jsx-text` | `pt` | Trás | `editor-moodboards.tras` |
| [356](src/routes/editor-moodboards.tsx#L356) | `jsx-text` | `pt` | Tema / paleta para começar | `editor-moodboards.tema_paleta_para_comecar` |
| [251](src/routes/editor-moodboards.tsx#L251) | `attr:description` | `pt` | Estúdio interativo · folha A4 vertical. | `editor-moodboards.estudio_interativo_folha_a4_vertical` |
| [268](src/routes/editor-moodboards.tsx#L268) | `attr:aria-label` | `pt` | Decoração | `editor-moodboards.decoracao` |
| [357](src/routes/editor-moodboards.tsx#L357) | `attr:placeholder` | `pt` | ex.: Coleção de outono aconchegante | `editor-moodboards.ex_colecao_de_outono_aconchegante` |
| [442](src/routes/editor-moodboards.tsx#L442) | `attr:placeholder` | `pt` | ex.: Título para post de cachecol de lã | `editor-moodboards.ex_titulo_para_post_de_cachecol_de_la` |

## `src/routes/encomendas.tsx` — **8** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [63](src/routes/encomendas.tsx#L63) | `jsx-text` | `pt` | Nova encomenda | `encomendas.nova_encomenda` |
| [65](src/routes/encomendas.tsx#L65) | `jsx-text` | `pt` | Nova encomenda | `encomendas.nova_encomenda` |
| [79](src/routes/encomendas.tsx#L79) | `jsx-text` | `pt` | Descrição | `encomendas.descricao` |
| [82](src/routes/encomendas.tsx#L82) | `jsx-text` | `pt` | Preço | `encomendas.preco` |
| [95](src/routes/encomendas.tsx#L95) | `jsx-text` | `pt` | Descrição | `encomendas.descricao` |
| [95](src/routes/encomendas.tsx#L95) | `jsx-text` | `pt` | Preço | `encomendas.preco` |
| [37](src/routes/encomendas.tsx#L37) | `attr:description` | `pt` | Gestão completa de encomendas, estado atual e etiquetas de envio. | `encomendas.gestao_completa_de_encomendas_estado_atu` |
| [91](src/routes/encomendas.tsx#L91) | `attr:placeholder` | `pt` | Pesquisar encomenda ou cliente… | `encomendas.pesquisar_encomenda_ou_cliente` |

## `src/routes/fornecedores.tsx` — **8** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [44](src/routes/fornecedores.tsx#L44) | `jsx-text` | `pt` | Novo fornecedor | `fornecedores.novo_fornecedor` |
| [46](src/routes/fornecedores.tsx#L46) | `jsx-text` | `pt` | Novo fornecedor | `fornecedores.novo_fornecedor` |
| [55](src/routes/fornecedores.tsx#L55) | `jsx-text` | `pt` | Código de Desconto de Membro | `fornecedores.codigo_de_desconto_de_membro` |
| [56](src/routes/fornecedores.tsx#L56) | `jsx-text` | `pt` | Código | `fornecedores.codigo` |
| [87](src/routes/fornecedores.tsx#L87) | `jsx-text` | `pt` | Código de Desconto | `fornecedores.codigo_de_desconto` |
| [41](src/routes/fornecedores.tsx#L41) | `attr:description` | `pt` | Lista de fornecedores de material para os artigos. | `fornecedores.lista_de_fornecedores_de_material_para_o` |
| [83](src/routes/fornecedores.tsx#L83) | `attr:placeholder` | `pt` | Pesquisar fornecedor… | `fornecedores.pesquisar_fornecedor` |
| [99](src/routes/fornecedores.tsx#L99) | `attr:title` | `pt` | Copiar código | `fornecedores.copiar_codigo` |

## `src/routes/whatsapp.tsx` — **8** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [33](src/routes/whatsapp.tsx#L33) | `jsx-text` | `pt` | Verificar ligação | `whatsapp.verificar_ligacao` |
| [38](src/routes/whatsapp.tsx#L38) | `jsx-text` | `pt` | Nova mensagem | `whatsapp.nova_mensagem` |
| [51](src/routes/whatsapp.tsx#L51) | `jsx-text` | `pt` | Templates rápidos | `whatsapp.templates_rapidos` |
| [79](src/routes/whatsapp.tsx#L79) | `jsx-text` | `pt` | Histórico de conversas | `whatsapp.historico_de_conversas` |
| [80](src/routes/whatsapp.tsx#L80) | `jsx-text` | `pt` | Mensagens recebidas tentam associar-se automaticamente ao cliente por telefone e à encomenda mais recente. Sem correspondência, podes associar manualmente abaix | `whatsapp.mensagens_recebidas_tentam_associar_se_a` |
| [92](src/routes/whatsapp.tsx#L92) | `jsx-text` | `pt` | Sem correspondência automática — associar manualmente: | `whatsapp.sem_correspondencia_automatica_associar_` |
| [29](src/routes/whatsapp.tsx#L29) | `attr:title` | `pt` | Sincronização WhatsApp | `whatsapp.sincronizacao_whatsapp` |
| [29](src/routes/whatsapp.tsx#L29) | `attr:description` | `pt` | Centraliza mensagens, associa-as a clientes/encomendas e usa templates rápidos. | `whatsapp.centraliza_mensagens_associa_as_a_client` |

## `src/routes/biblioteca.tsx` — **7** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [68](src/routes/biblioteca.tsx#L68) | `jsx-text` | `pt` | URL cloud (preferível) | `biblioteca.url_cloud_preferivel` |
| [75](src/routes/biblioteca.tsx#L75) | `jsx-text` | `pt` | Formato sem pré-visualização disponível. | `biblioteca.formato_sem_pre_visualizacao_disponivel` |
| [135](src/routes/biblioteca.tsx#L135) | `jsx-text` | `pt` | 📄 Pré-visualizar PDF | `biblioteca.pre_visualizar_pdf` |
| [52](src/routes/biblioteca.tsx#L52) | `attr:description` | `pt` | Repositório central. Cada aba lista os trabalhos guardados pelos Editores Técnicos. | `biblioteca.repositorio_central_cada_aba_lista_os_tr` |
| [55](src/routes/biblioteca.tsx#L55) | `attr:placeholder` | `pt` | Título | `biblioteca.titulo` |
| [67](src/routes/biblioteca.tsx#L67) | `attr:placeholder` | `pt` | Descrição | `biblioteca.descricao` |
| [87](src/routes/biblioteca.tsx#L87) | `attr:placeholder` | `pt` | Pesquisar… | `biblioteca.pesquisar` |

## `src/routes/calculadora.tsx` — **7** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [130](src/routes/calculadora.tsx#L130) | `jsx-text` | `pt` | Cria um projeto primeiro para guardar cotações. | `calculadora.cria_um_projeto_primeiro_para_guardar_co` |
| [169](src/routes/calculadora.tsx#L169) | `jsx-text` | `pt` | Preço-hora (€) | `calculadora.preco_hora` |
| [197](src/routes/calculadora.tsx#L197) | `jsx-text` | `pt` | Preço final | `calculadora.preco_final` |
| [200](src/routes/calculadora.tsx#L200) | `jsx-text` | `pt` | Fórmula: (Materiais + Horas × €/h + Extras) × (1 + margem). | `calculadora.formula_materiais_horas_h_extras_1_marge` |
| [208](src/routes/calculadora.tsx#L208) | `jsx-text` | `pt` | Últimas cotações | `calculadora.ultimas_cotacoes` |
| [115](src/routes/calculadora.tsx#L115) | `attr:title` | `pt` | Calculadora de preço | `calculadora.calculadora_de_preco` |
| [115](src/routes/calculadora.tsx#L115) | `attr:description` | `pt` | Calcula o preço final de uma peça: materiais + horas + margem. | `calculadora.calcula_o_preco_final_de_uma_peca_materi` |

## `src/routes/cursos.tsx` — **7** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [38](src/routes/cursos.tsx#L38) | `jsx-text` | `pt` | Preço (€) | `cursos.preco` |
| [40](src/routes/cursos.tsx#L40) | `jsx-text` | `pt` | Descrição | `cursos.descricao` |
| [42](src/routes/cursos.tsx#L42) | `jsx-text` | `pt` | Páginas do curso | `cursos.paginas_do_curso` |
| [50](src/routes/cursos.tsx#L50) | `jsx-text` | `pt` | Criar curso | `cursos.criar_curso` |
| [71](src/routes/cursos.tsx#L71) | `jsx-text` | `pt` | Páginas: | `cursos.paginas` |
| [99](src/routes/cursos.tsx#L99) | `jsx-text` | `pt` | Módulo atual | `cursos.modulo_atual` |
| [87](src/routes/cursos.tsx#L87) | `attr:placeholder` | `pt` | Módulo atual | `cursos.modulo_atual` |

## `src/routes/editor-receita.tsx` — **7** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [58](src/routes/editor-receita.tsx#L58) | `jsx-text` | `pt` | Novo Projeto | `editor-receita.novo_projeto` |
| [77](src/routes/editor-receita.tsx#L77) | `jsx-text` | `pt` | Crochê Tradicional | `editor-receita.croche_tradicional` |
| [114](src/routes/editor-receita.tsx#L114) | `jsx-text` | `pt` | Adicionar Carreira | `editor-receita.adicionar_carreira` |
| [119](src/routes/editor-receita.tsx#L119) | `jsx-text` | `pt` | Adicionar Secção | `editor-receita.adicionar_seccao` |
| [48](src/routes/editor-receita.tsx#L48) | `attr:title` | `pt` | Hub de Criação · Editor de Receita | `editor-receita.hub_de_criacao_editor_de_receita` |
| [48](src/routes/editor-receita.tsx#L48) | `attr:description` | `pt` | Cria receitas estruturadas de amigurumi e crochê com pré-visualização. | `editor-receita.cria_receitas_estruturadas_de_amigurumi_` |
| [109](src/routes/editor-receita.tsx#L109) | `attr:placeholder` | `pt` | ex: 6 pa no anel mágico | `editor-receita.ex_6_pa_no_anel_magico` |

## `src/routes/etiquetas.tsx` — **7** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [69](src/routes/etiquetas.tsx#L69) | `jsx-text` | `pt` | Destinatário | `etiquetas.destinatario` |
| [71](src/routes/etiquetas.tsx#L71) | `jsx-text` | `pt` | Código postal | `etiquetas.codigo_postal` |
| [72](src/routes/etiquetas.tsx#L72) | `jsx-text` | `pt` | País | `etiquetas.pais` |
| [75](src/routes/etiquetas.tsx#L75) | `jsx-text` | `pt` | Observações | `etiquetas.observacoes` |
| [76](src/routes/etiquetas.tsx#L76) | `jsx-text` | `pt` | Criar etiqueta | `etiquetas.criar_etiqueta` |
| [81](src/routes/etiquetas.tsx#L81) | `jsx-text` | `pt` | Destinatário | `etiquetas.destinatario` |
| [81](src/routes/etiquetas.tsx#L81) | `jsx-text` | `pt` | País | `etiquetas.pais` |

## `src/routes/moodboards.$id.tsx` — **7** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [33](src/routes/moodboards.$id.tsx#L33) | `jsx-text` | `pt` | Moodboard não encontrado. | `moodboards._id.moodboard_nao_encontrado` |
| [55](src/routes/moodboards.$id.tsx#L55) | `jsx-text` | `pt` | Stock baixo — adicionar às compras | `moodboards._id.stock_baixo_adicionar_as_compras` |
| [68](src/routes/moodboards.$id.tsx#L68) | `jsx-text` | `pt` | 📌 Vinculado à encomenda de | `moodboards._id.vinculado_a_encomenda_de` |
| [138](src/routes/moodboards.$id.tsx#L138) | `jsx-text` | `pt` | Adicionar cor | `moodboards._id.adicionar_cor` |
| [144](src/routes/moodboards.$id.tsx#L144) | `jsx-text` | `pt` | Links de referência | `moodboards._id.links_de_referencia` |
| [161](src/routes/moodboards.$id.tsx#L161) | `jsx-text` | `pt` | Adicionar link | `moodboards._id.adicionar_link` |
| [155](src/routes/moodboards.$id.tsx#L155) | `attr:placeholder` | `pt` | Título | `moodboards._id.titulo` |

## `src/routes/portfolio.tsx` — **7** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [83](src/routes/portfolio.tsx#L83) | `jsx-text` | `pt` | Título | `portfolio.titulo` |
| [84](src/routes/portfolio.tsx#L84) | `jsx-text` | `pt` | Técnica | `portfolio.tecnica` |
| [87](src/routes/portfolio.tsx#L87) | `jsx-text` | `pt` | Descrição | `portfolio.descricao` |
| [96](src/routes/portfolio.tsx#L96) | `jsx-text` | `pt` | Adicionar peça | `portfolio.adicionar_peca` |
| [112](src/routes/portfolio.tsx#L112) | `jsx-text` | `pt` | Adiciona projetos terminados aqui. | `portfolio.adiciona_projetos_terminados_aqui` |
| [74](src/routes/portfolio.tsx#L74) | `attr:title` | `pt` | Portefólio | `portfolio.portefolio` |
| [84](src/routes/portfolio.tsx#L84) | `attr:placeholder` | `pt` | Tricotin, crochê… | `portfolio.tricotin_croche` |

## `src/routes/mural.tsx` — **6** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [39](src/routes/mural.tsx#L39) | `jsx-text` | `pt` | Criar Inspiração | `mural.criar_inspiracao` |
| [203](src/routes/mural.tsx#L203) | `jsx-text` | `pt` | Ainda não criaste nenhuma. Começa pela primeira! | `mural.ainda_nao_criaste_nenhuma_comeca_pela_pr` |
| [32](src/routes/mural.tsx#L32) | `attr:title` | `pt` | Mural de Inspiração | `mural.mural_de_inspiracao` |
| [33](src/routes/mural.tsx#L33) | `attr:description` | `pt` | Gira a sorte, guarda favoritas e cria as tuas próprias frases. | `mural.gira_a_sorte_guarda_favoritas_e_cria_as_` |
| [123](src/routes/mural.tsx#L123) | `attr:title` | `pt` | Remover dos favoritos | `mural.remover_dos_favoritos` |
| [167](src/routes/mural.tsx#L167) | `attr:placeholder` | `pt` | Ex: O meu atelier é o meu refúgio favorito. | `mural.ex_o_meu_atelier_e_o_meu_refugio_favorit` |

## `src/routes/notas.tsx` — **6** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [76](src/routes/notas.tsx#L76) | `jsx-text` | `pt` | Nova Nota | `notas.nova_nota` |
| [119](src/routes/notas.tsx#L119) | `jsx-text` | `pt` | Editar nota | `notas.editar_nota` |
| [69](src/routes/notas.tsx#L69) | `attr:description` | `pt` | Captura rápida de ideias, receitas e tarefas do atelier. | `notas.captura_rapida_de_ideias_receitas_e_tare` |
| [74](src/routes/notas.tsx#L74) | `attr:placeholder` | `pt` | Pesquisar notas... | `notas.pesquisar_notas` |
| [122](src/routes/notas.tsx#L122) | `attr:placeholder` | `pt` | Título | `notas.titulo` |
| [141](src/routes/notas.tsx#L141) | `attr:placeholder` | `pt` | Tags separadas por vírgula (#urgente) | `notas.tags_separadas_por_virgula_urgente` |

## `src/routes/quem-somos.tsx` — **6** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [41](src/routes/quem-somos.tsx#L41) | `jsx-text` | `pt` | Herança do Novelo | `quem-somos.heranca_do_novelo` |
| [70](src/routes/quem-somos.tsx#L70) | `jsx-text` | `pt` | primeira plataforma de gestão de negócio criada e focada exclusivamente na nossa área de trabalho | `quem-somos.primeira_plataforma_de_gestao_de_negocio` |
| [82](src/routes/quem-somos.tsx#L82) | `jsx-text` | `pt` | A Gestão Descomplicada: | `quem-somos.a_gestao_descomplicada` |
| [87](src/routes/quem-somos.tsx#L87) | `jsx-text` | `pt` | O Apoio à Criação: | `quem-somos.o_apoio_a_criacao` |
| [24](src/routes/quem-somos.tsx#L24) | `attr:description` | `pt` | A herança e o futuro do nosso artesanato. | `quem-somos.a_heranca_e_o_futuro_do_nosso_artesanato` |
| [113](src/routes/quem-somos.tsx#L113) | `attr:alt` | `pt` | Sara Afonso em criança ao lado da avó. | `quem-somos.sara_afonso_em_crianca_ao_lado_da_avo` |

## `src/routes/backup.tsx` — **5** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [114](src/routes/backup.tsx#L114) | `jsx-text` | `pt` | Não estás autenticado — o backup será feito a partir dos dados locais deste navegador. Para garantir a cópia da nuvem, inicia sessão. | `backup.nao_estas_autenticado_o_backup_sera_feit` |
| [123](src/routes/backup.tsx#L123) | `jsx-text` | `pt` | Um único ficheiro com todas as coleções (clientes, materiais, projetos, faturas, etc.). Ideal para restauro completo. | `backup.um_unico_ficheiro_com_todas_as_colecoes_` |
| [133](src/routes/backup.tsx#L133) | `jsx-text` | `pt` | Um CSV por coleção dentro de um zip — útil para abrir no Excel/Sheets ou migrar para outras ferramentas. | `backup.um_csv_por_colecao_dentro_de_um_zip_util` |
| [145](src/routes/backup.tsx#L145) | `jsx-text` | `pt` | previamente exportado. Isto irá | `backup.previamente_exportado_isto_ira` |
| [108](src/routes/backup.tsx#L108) | `attr:description` | `pt` | Exporta tudo o que está associado à tua conta em JSON ou CSV e restaura quando precisares. | `backup.exporta_tudo_o_que_esta_associado_a_tua_` |

## `src/routes/catalogo.tsx` — **5** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [57](src/routes/catalogo.tsx#L57) | `jsx-text` | `pt` | Sem itens no catálogo. | `catalogo.sem_itens_no_catalogo` |
| [28](src/routes/catalogo.tsx#L28) | `attr:title` | `pt` | Catálogo | `catalogo.catalogo` |
| [28](src/routes/catalogo.tsx#L28) | `attr:description` | `pt` | Peças à venda. Liga-se à Calculadora para guardar o preço final como Preço de Venda. | `catalogo.pecas_a_venda_liga_se_a_calculadora_para` |
| [31](src/routes/catalogo.tsx#L31) | `attr:placeholder` | `pt` | Preço (€) | `catalogo.preco` |
| [34](src/routes/catalogo.tsx#L34) | `attr:placeholder` | `pt` | Descrição | `catalogo.descricao` |

## `src/routes/configuracoes.tsx` — **5** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [60](src/routes/configuracoes.tsx#L60) | `jsx-text` | `pt` | A app guarda tudo localmente no teu navegador. Podes apagar tudo se precisares de recomeçar. | `configuracoes.a_app_guarda_tudo_localmente_no_teu_nave` |
| [66](src/routes/configuracoes.tsx#L66) | `jsx-text` | `pt` | Carregar dados de demonstração | `configuracoes.carregar_dados_de_demonstracao` |
| [72](src/routes/configuracoes.tsx#L72) | `jsx-text` | `pt` | Apagar todos os dados | `configuracoes.apagar_todos_os_dados` |
| [28](src/routes/configuracoes.tsx#L28) | `attr:title` | `pt` | Configurações | `configuracoes.configuracoes` |
| [28](src/routes/configuracoes.tsx#L28) | `attr:description` | `pt` | Tudo o que controla o comportamento da aplicação. | `configuracoes.tudo_o_que_controla_o_comportamento_da_a` |

## `src/routes/contas.tsx` — **5** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [65](src/routes/contas.tsx#L65) | `jsx-text` | `pt` | Guardar conta | `contas.guardar_conta` |
| [95](src/routes/contas.tsx#L95) | `jsx-text` | `pt` | Novo PIN (4 dígitos) | `contas.novo_pin_4_digitos` |
| [96](src/routes/contas.tsx#L96) | `jsx-text` | `pt` | Confirmar novo PIN | `contas.confirmar_novo_pin` |
| [29](src/routes/contas.tsx#L29) | `attr:description` | `pt` | Esta área está protegida. Introduz o PIN de 4 dígitos. (Inicial: 0000) | `contas.esta_area_esta_protegida_introduz_o_pin_` |
| [49](src/routes/contas.tsx#L49) | `attr:description` | `pt` | Guarda os teus logins de plataformas em segurança local. | `contas.guarda_os_teus_logins_de_plataformas_em_` |

## `src/routes/faturacao.tsx` — **5** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [30](src/routes/faturacao.tsx#L30) | `jsx-text` | `pt` | Criar Fatura | `faturacao.criar_fatura` |
| [31](src/routes/faturacao.tsx#L31) | `jsx-text` | `pt` | Histórico De Faturas | `faturacao.historico_de_faturas` |
| [94](src/routes/faturacao.tsx#L94) | `jsx-text` | `pt` | Criar fatura | `faturacao.criar_fatura` |
| [27](src/routes/faturacao.tsx#L27) | `attr:title` | `pt` | Faturação: Criar & Histórico | `faturacao.faturacao_criar_historico` |
| [27](src/routes/faturacao.tsx#L27) | `attr:description` | `pt` | Emite novas faturas e consulta o histórico completo. | `faturacao.emite_novas_faturas_e_consulta_o_histori` |

## `src/routes/sessao-expirada.tsx` — **5** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [81](src/routes/sessao-expirada.tsx#L81) | `jsx-text` | `pt` | Sessão inválida ou expirada | `sessao-expirada.sessao_invalida_ou_expirada` |
| [115](src/routes/sessao-expirada.tsx#L115) | `jsx-text` | `pt` | A limpar sessão… | `sessao-expirada.a_limpar_sessao` |
| [117](src/routes/sessao-expirada.tsx#L117) | `jsx-text` | `pt` | Voltar a entrar | `sessao-expirada.voltar_a_entrar` |
| [136](src/routes/sessao-expirada.tsx#L136) | `jsx-text` | `pt` | Confirmar saída da sessão | `sessao-expirada.confirmar_saida_da_sessao` |
| [144](src/routes/sessao-expirada.tsx#L144) | `jsx-text` | `pt` | Sim, ir para /auth | `sessao-expirada.sim_ir_para_auth` |

## `src/routes/auth.tsx` — **4** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [204](src/routes/auth.tsx#L204) | `jsx-text` | `pt` | Aceder à tua conta | `auth.aceder_a_tua_conta` |
| [211](src/routes/auth.tsx#L211) | `jsx-text` | `pt` | abre numa nova janela | `auth.abre_numa_nova_janela` |
| [223](src/routes/auth.tsx#L223) | `jsx-text` | `pt` | Email da conta | `auth.email_da_conta` |
| [258](src/routes/auth.tsx#L258) | `attr:placeholder` | `pt` | Mínimo 6 caracteres | `auth.minimo_6_caracteres` |

## `src/routes/clientes.tsx` — **4** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [45](src/routes/clientes.tsx#L45) | `jsx-text` | `pt` | Novo cliente | `clientes.novo_cliente` |
| [48](src/routes/clientes.tsx#L48) | `jsx-text` | `pt` | Novo cliente | `clientes.novo_cliente` |
| [41](src/routes/clientes.tsx#L41) | `attr:description` | `pt` | Detalhes e histórico de cada cliente. | `clientes.detalhes_e_historico_de_cada_cliente` |
| [67](src/routes/clientes.tsx#L67) | `attr:placeholder` | `pt` | Pesquisar cliente… | `clientes.pesquisar_cliente` |

## `src/routes/conversor-cores.tsx` — **4** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [71](src/routes/conversor-cores.tsx#L71) | `jsx-text` | `pt` | Código da linha | `conversor-cores.codigo_da_linha` |
| [78](src/routes/conversor-cores.tsx#L78) | `jsx-text` | `pt` | A carregar paleta | `conversor-cores.a_carregar_paleta` |
| [123](src/routes/conversor-cores.tsx#L123) | `jsx-text` | `pt` | As equivalências entre marcas são aproximadas (vizinho cromático mais próximo). Para correspondência exata consulta o catálogo oficial de cada marca. | `conversor-cores.as_equivalencias_entre_marcas_sao_aproxi` |
| [55](src/routes/conversor-cores.tsx#L55) | `attr:description` | `pt` | Digita o código de uma linha e vê a correspondência aproximada em todas as marcas. | `conversor-cores.digita_o_codigo_de_uma_linha_e_ve_a_corr` |

## `src/routes/etsy.tsx` — **4** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [111](src/routes/etsy.tsx#L111) | `jsx-text` | `pt` | Envia o mesmo evento várias vezes para confirmar que o stock só é descontado uma vez (idempotência por | `etsy.envia_o_mesmo_evento_varias_vezes_para_c` |
| [25](src/routes/etsy.tsx#L25) | `attr:description` | `pt` | Integração Etsy e biblioteca de ficheiros digitais. | `etsy.integracao_etsy_e_biblioteca_de_ficheiro` |
| [113](src/routes/etsy.tsx#L113) | `attr:placeholder` | `pt` | Event ID (único) | `etsy.event_id_unico` |
| [115](src/routes/etsy.tsx#L115) | `attr:placeholder` | `pt` | Variação | `etsy.variacao` |

## `src/routes/lista-compras.tsx` — **4** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [29](src/routes/lista-compras.tsx#L29) | `jsx-text` | `pt` | Preço | `lista-compras.preco` |
| [29](src/routes/lista-compras.tsx#L29) | `jsx-text` | `pt` | Mínimo | `lista-compras.minimo` |
| [31](src/routes/lista-compras.tsx#L31) | `jsx-text` | `pt` | Nada a comprar! Todos os materiais acima do mínimo. | `lista-compras.nada_a_comprar_todos_os_materiais_acima_` |
| [25](src/routes/lista-compras.tsx#L25) | `attr:placeholder` | `pt` | Pesquisar material… | `lista-compras.pesquisar_material` |

## `src/routes/modulos.tsx` — **4** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [89](src/routes/modulos.tsx#L89) | `jsx-text` | `pt` | Intermédio | `modulos.intermedio` |
| [90](src/routes/modulos.tsx#L90) | `jsx-text` | `pt` | Avançado | `modulos.avancado` |
| [86](src/routes/modulos.tsx#L86) | `attr:title` | `pt` | Módulos ativos | `modulos.modulos_ativos` |
| [86](src/routes/modulos.tsx#L86) | `attr:description` | `pt` | Liga ou desliga categorias do menu. Mantém a app limpa e ajustada ao teu fluxo. | `modulos.liga_ou_desliga_categorias_do_menu_mante` |

## `src/routes/notificacoes.tsx` — **4** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [50](src/routes/notificacoes.tsx#L50) | `jsx-text` | `pt` | Fila de notificações | `notificacoes.fila_de_notificacoes` |
| [51](src/routes/notificacoes.tsx#L51) | `jsx-text` | `pt` | Sem notificações pendentes. | `notificacoes.sem_notificacoes_pendentes` |
| [22](src/routes/notificacoes.tsx#L22) | `attr:title` | `pt` | Gatilhos de notificação | `notificacoes.gatilhos_de_notificacao` |
| [43](src/routes/notificacoes.tsx#L43) | `attr:placeholder` | `pt` | Olá {cliente}, a tua encomenda {encomenda}… | `notificacoes.ola_cliente_a_tua_encomenda_encomenda` |

## `src/routes/projeto-personalizado.tsx` — **4** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [75](src/routes/projeto-personalizado.tsx#L75) | `jsx-text` | `pt` | Cálculo | `projeto-personalizado.calculo` |
| [82](src/routes/projeto-personalizado.tsx#L82) | `jsx-text` | `pt` | Mão de obra | `projeto-personalizado.mao_de_obra` |
| [89](src/routes/projeto-personalizado.tsx#L89) | `jsx-text` | `pt` | Guardar como projeto | `projeto-personalizado.guardar_como_projeto` |
| [46](src/routes/projeto-personalizado.tsx#L46) | `attr:description` | `pt` | Seleciona materiais, horas e margem para obter o preço final. | `projeto-personalizado.seleciona_materiais_horas_e_margem_para_` |

## `src/routes/ajuda.tsx` — **3** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [91](src/routes/ajuda.tsx#L91) | `attr:description` | `pt` | Perguntas frequentes sobre o funcionamento da aplicação. | `ajuda.perguntas_frequentes_sobre_o_funcionamen` |
| [97](src/routes/ajuda.tsx#L97) | `attr:placeholder` | `pt` | Procurar pergunta ou palavra-chave… | `ajuda.procurar_pergunta_ou_palavra_chave` |
| [99](src/routes/ajuda.tsx#L99) | `attr:aria-label` | `pt` | Pesquisar no FAQ | `ajuda.pesquisar_no_faq` |

## `src/routes/calendario.tsx` — **3** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [114](src/routes/calendario.tsx#L114) | `jsx-text` | `pt` | Título | `calendario.titulo` |
| [134](src/routes/calendario.tsx#L134) | `jsx-text` | `pt` | Toque padrão da aplicação | `calendario.toque_padrao_da_aplicacao` |
| [86](src/routes/calendario.tsx#L86) | `attr:title` | `pt` | Calendário & Agenda | `calendario.calendario_agenda` |

## `src/routes/gestao-fornecedores.tsx` — **3** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [17](src/routes/gestao-fornecedores.tsx#L17) | `jsx-text` | `pt` | Editar fornecedores | `gestao-fornecedores.editar_fornecedores` |
| [15](src/routes/gestao-fornecedores.tsx#L15) | `attr:title` | `pt` | Gestão de fornecedores | `gestao-fornecedores.gestao_de_fornecedores` |
| [16](src/routes/gestao-fornecedores.tsx#L16) | `attr:description` | `pt` | Informação detalhada de cada fornecedor e os artigos que disponibiliza. | `gestao-fornecedores.informacao_detalhada_de_cada_fornecedor_` |

## `src/routes/historico-faturas.tsx` — **3** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [29](src/routes/historico-faturas.tsx#L29) | `attr:title` | `pt` | Histórico De Faturas | `historico-faturas.historico_de_faturas` |
| [29](src/routes/historico-faturas.tsx#L29) | `attr:description` | `pt` | Todas as faturas emitidas, com pesquisa e impressão. | `historico-faturas.todas_as_faturas_emitidas_com_pesquisa_e` |
| [32](src/routes/historico-faturas.tsx#L32) | `attr:placeholder` | `pt` | Pesquisar nº, cliente ou estado… | `historico-faturas.pesquisar_n_cliente_ou_estado` |

## `src/routes/index.tsx` — **3** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [89](src/routes/index.tsx#L89) | `jsx-text` | `pt` | Novo projeto | `index.novo_projeto` |
| [226](src/routes/index.tsx#L226) | `jsx-text` | `pt` | Projetos em curso | `index.projetos_em_curso` |
| [101](src/routes/index.tsx#L101) | `attr:placeholder` | `pt` | Pesquisar em toda a app: páginas, categorias, abas… | `index.pesquisar_em_toda_a_app_paginas_categori` |

## `src/routes/moodboards.tsx` — **3** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [231](src/routes/moodboards.tsx#L231) | `jsx-text` | `pt` | Guardar no dispositivo | `moodboards.guardar_no_dispositivo` |
| [32](src/routes/moodboards.tsx#L32) | `attr:title` | `pt` | Moodboards & Inspiração | `moodboards.moodboards_inspiracao` |
| [194](src/routes/moodboards.tsx#L194) | `attr:placeholder` | `pt` | Pesquisar moodboards... | `moodboards.pesquisar_moodboards` |

## `src/routes/reset-password.tsx` — **3** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [61](src/routes/reset-password.tsx#L61) | `jsx-text` | `pt` | Nova palavra-passe | `reset-password.nova_palavra_passe` |
| [65](src/routes/reset-password.tsx#L65) | `jsx-text` | `pt` | Confirmar palavra-passe | `reset-password.confirmar_palavra_passe` |
| [62](src/routes/reset-password.tsx#L62) | `attr:placeholder` | `pt` | Mínimo 6 caracteres | `reset-password.minimo_6_caracteres` |

## `src/routes/horas.tsx` — **2** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [42](src/routes/horas.tsx#L42) | `jsx-text` | `pt` | Descrição | `horas.descricao` |
| [47](src/routes/horas.tsx#L47) | `jsx-text` | `pt` | Descrição | `horas.descricao` |

## `src/routes/instagram.tsx` — **2** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [40](src/routes/instagram.tsx#L40) | `jsx-text` | `pt` | Comentários | `instagram.comentarios` |
| [27](src/routes/instagram.tsx#L27) | `attr:description` | `pt` | Acompanha publicações e estatísticas do teu Instagram (sincronização manual). | `instagram.acompanha_publicacoes_e_estatisticas_do_` |

## `src/routes/onboarding.tsx` — **2** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [43](src/routes/onboarding.tsx#L43) | `attr:title` | `pt` | Configuração inicial | `onboarding.configuracao_inicial` |
| [43](src/routes/onboarding.tsx#L43) | `attr:description` | `pt` | Escolhe um nível de complexidade para começar. Podes mudar a qualquer momento em Módulos ativos. | `onboarding.escolhe_um_nivel_de_complexidade_para_co` |

## `src/routes/sincronizacao.tsx` — **2** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [58](src/routes/sincronizacao.tsx#L58) | `jsx-text` | `pt` | Domínio da loja | `sincronizacao.dominio_da_loja` |
| [25](src/routes/sincronizacao.tsx#L25) | `attr:title` | `pt` | Sincronização | `sincronizacao.sincronizacao` |

## `src/routes/vendas.tsx` — **2** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [16](src/routes/vendas.tsx#L16) | `jsx-text` | `pt` | Histórico | `vendas.historico` |
| [14](src/routes/vendas.tsx#L14) | `attr:title` | `pt` | Vendas concluídas | `vendas.vendas_concluidas` |

## `src/routes/contacto.tsx` — **1** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [32](src/routes/contacto.tsx#L32) | `jsx-text` | `pt` | Resposta tipicamente em 24-48h em dias úteis. | `contacto.resposta_tipicamente_em_24_48h_em_dias_u` |

## `src/routes/contador.tsx` — **1** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [196](src/routes/contador.tsx#L196) | `attr:description` | `pt` | Gere carreiras e pontos em simultâneo — toque ou voz. | `contador.gere_carreiras_e_pontos_em_simultaneo_to` |

## `src/routes/ficheiros-digitais.tsx` — **1** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [35](src/routes/ficheiros-digitais.tsx#L35) | `attr:description` | `pt` | Receitas, moldes e PDFs comprados ou vendidos (inclui ligação à Etsy). | `ficheiros-digitais.receitas_moldes_e_pdfs_comprados_ou_vend` |

## `src/routes/idioma.tsx` — **1** ocorrência(s)

| Linha | Tipo | Idioma | Texto | Chave sugerida |
|------:|------|--------|-------|----------------|
| [17](src/routes/idioma.tsx#L17) | `attr:description` | `pt` | Escolhe a língua da aplicação. A mudança é imediata. | `idioma.escolhe_a_lingua_da_aplicacao_a_mudanca_` |
