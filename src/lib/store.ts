import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ID = string;
const uid = () => Math.random().toString(36).slice(2, 10);

export interface Cliente {
  id: ID;
  nome: string;
  email?: string;
  telefone?: string;
  morada?: string;
  notas?: string;
  imagem?: string;
  criadoEm: string;
}

export interface Fornecedor {
  id: ID;
  nome: string;
  contacto?: string;
  email?: string;
  website?: string;
  notas?: string;
  imagem?: string;
}

export interface FornecedorPreco {
  fornecedorId: ID;
  preco: number;
  referencia?: string;
}

export interface Material {
  id: ID;
  nome: string;
  codigo?: string;
  unidade: string; // m, g, novelo, un
  stock: number;
  stockMinimo?: number;
  precoCompra: number; // por unidade
  fornecedorId?: ID;
  fornecedoresExtra?: FornecedorPreco[];
  notas?: string;
  imagem?: string;
}

export interface MaterialUsado {
  materialId: ID;
  quantidade: number;
}

export interface Projeto {
  id: ID;
  nome: string;
  codigo?: string;
  clienteId?: ID;
  materiais: MaterialUsado[];
  horasTrabalhadas: number;
  precoHora: number;
  margemProfit: number; // 0.7 = 70%
  estado: "rascunho" | "em_curso" | "concluido";
  criadoEm: string;
  notas?: string;
}

export interface Encomenda {
  id: ID;
  codigo?: string;
  clienteId?: ID;
  projetoId?: ID;
  descricao: string;
  estado: "pendente" | "em_producao" | "pronta" | "entregue" | "cancelada";
  prazo?: string;
  preco: number;
  criadoEm: string;
  imagemEmbalagem?: string;
  imagemEtiqueta?: string;
}

export interface RegistoHora {
  id: ID;
  projetoId: ID;
  data: string;
  horas: number;
  descricao?: string;
}

export interface Despesa {
  id: ID;
  nome: string;
  valor: number;
  periodicidade: "mensal" | "anual";
}

export interface Fatura {
  id: ID;
  numero: string;
  clienteId?: ID;
  encomendaId?: ID;
  projetoId?: ID;
  cursoId?: ID;
  tipo?: "projeto" | "curso" | "outro";
  valor: number;
  iva: number;
  estado: "rascunho" | "emitida" | "paga";
  data: string;
}

export interface Venda {
  id: ID;
  clienteId?: ID;
  projetoId?: ID;
  valor: number;
  data: string;
  notas?: string;
}

export interface Todo {
  id: ID;
  titulo: string;
  feito: boolean;
  prioridade: "baixa" | "media" | "alta";
  prazo?: string;
}

export interface CampanhaMarketing {
  id: ID;
  nome: string;
  canal: string;
  custo: number;
  alcance: number;
  conversoes: number;
  data: string;
}

export interface MovimentoCaixa {
  id: ID;
  tipo: "entrada" | "saida";
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
}

export interface Cotacao {
  id: ID;
  projetoId: ID;
  materiais: MaterialUsado[];
  horas: number;
  precoHora: number;
  extras: number;
  margem: number; // percentagem (ex: 70)
  custoMateriais: number;
  custoHoras: number;
  base: number;
  precoFinal: number;
  criadoEm: string;
  faturaId?: ID;
  convertidaEm?: string;
}

export interface AuditLog {
  id: ID;
  data: string;
  utilizador: string;
  entidade: string;
  entidadeId?: ID;
  acao: string;
  detalhes?: string;
}

export interface EtiquetaEnvio {
  id: ID;
  clienteId?: ID;
  encomendaId?: ID;
  remetente: string;
  destinatario: string;
  morada: string;
  codigoPostal: string;
  pais: string;
  telefone?: string;
  peso?: string;
  observacoes?: string;
  criadoEm: string;
}

export interface PerfilNegocio {
  nome: string;
  nif?: string;
  morada?: string;
  codigoPostal?: string;
  cidade?: string;
  pais?: string;
  email?: string;
  telefone?: string;
  website?: string;
  instagram?: string;
  logo?: string;
  slogan?: string;
  iban?: string;
}

export interface SincronizacaoConfig {
  websiteUrl: string;
  websiteApiKey: string;
  websiteAtivo: boolean;
  instagramHandle: string;
  instagramToken: string;
  instagramAtivo: boolean;
  emailServidor: string;
  emailUtilizador: string;
  emailAtivo: boolean;
  ultimaSync?: string;
}

export type Idioma = "pt" | "en" | "es" | "fr" | "de" | "it";

export interface WhatsappTemplate {
  id: ID;
  nome: string;
  texto: string; // pode conter {cliente} {encomenda} {estado}
}

export interface WhatsappMensagem {
  id: ID;
  clienteId?: ID;
  encomendaId?: ID;
  direcao: "in" | "out";
  texto: string;
  data: string;
}

export interface Notificacao {
  id: ID;
  encomendaId?: ID;
  clienteId?: ID;
  canal: "email" | "whatsapp";
  estadoAlvo: string;
  texto: string;
  enviada: boolean;
  data: string;
}

export interface GatilhoNotificacao {
  estado: string; // estado da encomenda que dispara
  ativo: boolean;
  canal: "email" | "whatsapp" | "ambos";
  template: string; // texto com placeholders
}

export interface EtsyConfig {
  shopId: string;
  apiKey: string;
  ativo: boolean;
  ultimaSync?: string;
}

export interface EtsyProdutoMap {
  id: ID;
  etsyListingId: string;
  nome: string;
  variacao?: string;
  tipo?: "fisico" | "digital";
  ficheiroDigitalId?: ID;
  materiais: MaterialUsado[]; // BOM para descontar stock
}

export interface FicheiroDigital {
  id: ID;
  nome: string;
  tipo: "receita" | "molde" | "ebook" | "outro";
  origem: "etsy" | "manual";
  etsyListingId?: string;
  url?: string;
  ficheiroBase64?: string;
  notas?: string;
  criadoEm: string;
}

export interface CatalogoItem {
  id: ID;
  nome: string;
  descricao?: string;
  precoVenda: number;
  custoMateriais?: number;
  custoHoras?: number;
  margem?: number;
  projetoId?: ID;
  imagem?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface BibliotecaItem {
  id: ID;
  titulo: string;
  categoria: string;
  tipo: "molde" | "receita" | "tutorial" | "outro";
  descricao?: string;
  url?: string;
  ficheiroBase64?: string;
  tamanhoKb?: number;
  criadoEm: string;
}

export interface TraducoesCustom {
  // { "pt|en": { "Texto original": "Translated text" } }
  [lang: string]: Record<string, string>;
}

export interface ModulosAtivos {
  [url: string]: boolean;
}

export const MODULOS_PRESETS = {
  essencial: [
    "/", "/encomendas", "/estado-encomendas", "/clientes", "/stock",
    "/calculadora", "/faturacao", "/configuracoes",
  ],
  padrao: [
    "/", "/assistente", "/encomendas", "/estado-encomendas", "/projetos",
    "/calculadora", "/horas", "/todo", "/stock", "/fornecedores",
    "/lista-compras", "/clientes", "/vendas", "/faturacao",
    "/historico-faturas", "/cashflow", "/despesas", "/perfil-negocio",
    "/configuracoes", "/idioma", "/etiquetas",
  ],
  completo: null, // tudo
} as const;

export interface ContaPlataforma {
  id: ID;
  plataforma: string;
  usernameEmail: string;
  password: string;
  url?: string;
  notas?: string;
}

export interface PortfolioItem {
  id: ID;
  titulo: string;
  descricao?: string;
  tecnica?: string;
  ano?: string;
  imagem?: string;
  cliente?: string;
}

export interface Curso {
  id: ID;
  nome: string;
  descricao?: string;
  preco: number;
  linkCompra?: string;
  grupos?: string;
  paginas?: string;
  imagem?: string;
}

export interface AlunoCurso {
  id: ID;
  cursoId: ID;
  nome: string;
  email?: string;
  moduloAtual: string;
  inscritoEm: string;
}

export interface InstagramPost {
  id: ID;
  legenda: string;
  url?: string;
  likes: number;
  comentarios: number;
  alcance: number;
  data: string;
}

export interface EventoAgenda {
  id: ID;
  titulo: string;
  data: string; // ISO date
  hora?: string; // HH:MM
  notas?: string;
  alarmeMinAntes?: number;
  toque?: string;
}

export interface DesignSettings {
  modo: "light" | "dark";
  accent: string; // oklch string
  raio: number; // rem
  densidade: "compacta" | "confortavel";
  nomeNegocio: string;
  precoHoraBase: number; // €/h base hourly rate
  idioma: Idioma;
  pinContas: string; // 4 dígitos
  toqueAlarme: string;
}

interface State {
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  materiais: Material[];
  projetos: Projeto[];
  encomendas: Encomenda[];
  horas: RegistoHora[];
  despesas: Despesa[];
  faturas: Fatura[];
  vendas: Venda[];
  todos: Todo[];
  campanhas: CampanhaMarketing[];
  caixa: MovimentoCaixa[];
  cotacoes: Cotacao[];
  contas: ContaPlataforma[];
  portfolio: PortfolioItem[];
  cursos: Curso[];
  alunos: AlunoCurso[];
  instagram: InstagramPost[];
  eventos: EventoAgenda[];
  auditoria: AuditLog[];
  etiquetas: EtiquetaEnvio[];
  perfilNegocio: PerfilNegocio;
  sincronizacao: SincronizacaoConfig;
  design: DesignSettings;
  // novos
  whatsappTemplates: WhatsappTemplate[];
  whatsappMensagens: WhatsappMensagem[];
  notificacoes: Notificacao[];
  gatilhos: GatilhoNotificacao[];
  etsyConfig: EtsyConfig;
  etsyProdutos: EtsyProdutoMap[];
  ficheirosDigitais: FicheiroDigital[];
  catalogo: CatalogoItem[];
  biblioteca: BibliotecaItem[];
  webhooksProcessados: Record<string, true>;
  traducoes: TraducoesCustom;
  modulos: ModulosAtivos;
  onboardingFeito: boolean;

  // generic helpers
  add: <K extends keyof CollectionMap>(k: K, item: Omit<CollectionMap[K], "id">) => void;
  update: <K extends keyof CollectionMap>(k: K, id: ID, patch: Partial<CollectionMap[K]>) => void;
  remove: <K extends keyof CollectionMap>(k: K, id: ID) => void;
  setDesign: (patch: Partial<DesignSettings>) => void;
  setPerfil: (patch: Partial<PerfilNegocio>) => void;
  setSync: (patch: Partial<SincronizacaoConfig>) => void;
  audit: (acao: string, entidade: string, entidadeId?: ID, detalhes?: string) => void;
  setEtsy: (patch: Partial<EtsyConfig>) => void;
  setModulo: (url: string, ativo: boolean) => void;
  setModulos: (m: ModulosAtivos) => void;
  aplicarPreset: (preset: "essencial" | "padrao" | "completo") => void;
  setOnboardingFeito: (v: boolean) => void;
  setGatilho: (estado: string, patch: Partial<GatilhoNotificacao>) => void;
  setTraducao: (lang: string, source: string, target: string) => void;
  dispararGatilho: (encomendaId: ID, estado: string) => void;
  consumirStockPorEtsy: (etsyListingId: string, quantidade?: number) => { ok: boolean; faltas: string[] };
  processarWebhookEtsy: (evt: { id: string; listingId: string; quantidade?: number; variacao?: string; clienteNome?: string; clienteEmail?: string; descricao?: string; valor?: number }) => { ok: boolean; motivo?: string };
  processarWebhookWhatsapp: (evt: { id: string; telefone?: string; texto: string; direcao?: "in" | "out"; data?: string; nome?: string }) => { ok: boolean; motivo?: string };
}

type CollectionMap = {
  clientes: Cliente;
  fornecedores: Fornecedor;
  materiais: Material;
  projetos: Projeto;
  encomendas: Encomenda;
  horas: RegistoHora;
  despesas: Despesa;
  faturas: Fatura;
  vendas: Venda;
  todos: Todo;
  campanhas: CampanhaMarketing;
  caixa: MovimentoCaixa;
  cotacoes: Cotacao;
  contas: ContaPlataforma;
  portfolio: PortfolioItem;
  cursos: Curso;
  alunos: AlunoCurso;
  instagram: InstagramPost;
  eventos: EventoAgenda;
  auditoria: AuditLog;
  etiquetas: EtiquetaEnvio;
  whatsappTemplates: WhatsappTemplate;
  whatsappMensagens: WhatsappMensagem;
  notificacoes: Notificacao;
  etsyProdutos: EtsyProdutoMap;
  ficheirosDigitais: FicheiroDigital;
  catalogo: CatalogoItem;
  biblioteca: BibliotecaItem;
};

const seed = (): Pick<
  State,
  "clientes" | "fornecedores" | "materiais" | "projetos" | "encomendas" | "horas" | "despesas" | "faturas" | "vendas" | "todos" | "campanhas" | "caixa" | "cotacoes" | "contas" | "portfolio" | "cursos" | "alunos" | "instagram" | "eventos" | "auditoria" | "etiquetas" | "perfilNegocio" | "sincronizacao" | "design"
> => {
  const f1 = { id: uid(), nome: "Lãs do Norte", contacto: "+351 220 000 000", email: "vendas@lasdonorte.pt" };
  const f2 = { id: uid(), nome: "Tecidos Lisboa", contacto: "+351 210 111 222", email: "geral@tecidoslisboa.pt" };
  const m1 = { id: uid(), nome: "Lã merino", unidade: "novelo", stock: 24, precoCompra: 4.5, fornecedorId: f1.id };
  const m2 = { id: uid(), nome: "Linha algodão", unidade: "novelo", stock: 12, precoCompra: 2.8, fornecedorId: f1.id };
  const m3 = { id: uid(), nome: "Tela de linho", unidade: "m", stock: 8, precoCompra: 9.9, fornecedorId: f2.id };
  const m4 = { id: uid(), nome: "Enchimento", unidade: "g", stock: 1500, precoCompra: 0.012, fornecedorId: f2.id };
  const c1 = { id: uid(), nome: "Ana Pereira", email: "ana@example.pt", telefone: "+351 911 000 111", criadoEm: new Date().toISOString() };
  const c2 = { id: uid(), nome: "João Silva", email: "joao@example.pt", telefone: "+351 922 333 444", criadoEm: new Date().toISOString() };
  const p1: Projeto = {
    id: uid(),
    nome: "Manta tricotin 1.2m",
    clienteId: c1.id,
    materiais: [{ materialId: m1.id, quantidade: 6 }],
    horasTrabalhadas: 14,
    precoHora: 12,
    margemProfit: 0.7,
    estado: "em_curso",
    criadoEm: new Date().toISOString(),
  };
  const p2: Projeto = {
    id: uid(),
    nome: "Amigurumi coelho",
    clienteId: c2.id,
    materiais: [{ materialId: m2.id, quantidade: 2 }, { materialId: m4.id, quantidade: 80 }],
    horasTrabalhadas: 6,
    precoHora: 12,
    margemProfit: 0.7,
    estado: "concluido",
    criadoEm: new Date().toISOString(),
  };
  const e1: Encomenda = {
    id: uid(),
    clienteId: c1.id,
    projetoId: p1.id,
    descricao: "Manta personalizada bege",
    estado: "em_producao",
    prazo: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    preco: 220,
    criadoEm: new Date().toISOString(),
  };
  const e2: Encomenda = {
    id: uid(),
    clienteId: c2.id,
    projetoId: p2.id,
    descricao: "Coelho amigurumi cinza",
    estado: "entregue",
    preco: 45,
    criadoEm: new Date().toISOString(),
  };
  return {
    clientes: [c1, c2],
    fornecedores: [f1, f2],
    materiais: [m1, m2, m3, m4],
    projetos: [p1, p2],
    encomendas: [e1, e2],
    horas: [
      { id: uid(), projetoId: p1.id, data: new Date().toISOString().slice(0, 10), horas: 3, descricao: "Montagem base" },
      { id: uid(), projetoId: p2.id, data: new Date().toISOString().slice(0, 10), horas: 2, descricao: "Acabamentos" },
    ],
    despesas: [
      { id: uid(), nome: "Renda atelier", valor: 250, periodicidade: "mensal" },
      { id: uid(), nome: "Eletricidade", valor: 45, periodicidade: "mensal" },
      { id: uid(), nome: "Seguro", valor: 120, periodicidade: "anual" },
    ],
    faturas: [
      { id: uid(), numero: "FT 2026/001", clienteId: c2.id, encomendaId: e2.id, valor: 45, iva: 23, estado: "paga", data: new Date().toISOString().slice(0, 10) },
    ],
    vendas: [
      { id: uid(), clienteId: c2.id, projetoId: p2.id, valor: 45, data: new Date().toISOString().slice(0, 10) },
    ],
    todos: [
      { id: uid(), titulo: "Encomendar mais lã merino", feito: false, prioridade: "alta" },
      { id: uid(), titulo: "Publicar foto da manta no Instagram", feito: false, prioridade: "media" },
      { id: uid(), titulo: "Atualizar preços do website", feito: true, prioridade: "baixa" },
    ],
    campanhas: [
      { id: uid(), nome: "Instagram Reels Outubro", canal: "Instagram", custo: 30, alcance: 4200, conversoes: 5, data: new Date().toISOString().slice(0, 10) },
    ],
    caixa: [
      { id: uid(), tipo: "entrada", categoria: "Venda", descricao: "Amigurumi coelho", valor: 45, data: new Date().toISOString().slice(0, 10) },
      { id: uid(), tipo: "saida", categoria: "Material", descricao: "Compra lã merino", valor: 54, data: new Date().toISOString().slice(0, 10) },
      { id: uid(), tipo: "saida", categoria: "Renda", descricao: "Renda atelier", valor: 250, data: new Date().toISOString().slice(0, 10) },
    ],
    cotacoes: [],
    contas: [],
    portfolio: [],
    cursos: [
      { id: uid(), nome: "Tricotin para iniciantes", descricao: "Curso introdutório em 4 módulos.", preco: 39, linkCompra: "", grupos: "Facebook: Tricotin Iniciantes", paginas: "tricotin.example.pt/curso-1" },
    ],
    alunos: [],
    instagram: [],
    eventos: [],
    auditoria: [],
    etiquetas: [],
    perfilNegocio: {
      nome: "Atelier Tricotin",
      email: "craftbusinessmaster@gmail.com",
      pais: "Portugal",
    },
    sincronizacao: {
      websiteUrl: "",
      websiteApiKey: "",
      websiteAtivo: false,
      instagramHandle: "",
      instagramToken: "",
      instagramAtivo: false,
      emailServidor: "",
      emailUtilizador: "",
      emailAtivo: false,
    },
    design: {
      modo: "light",
      accent: "0.72 0.06 230",
      raio: 0.625,
      densidade: "confortavel",
      nomeNegocio: "Atelier Tricotin",
      precoHoraBase: 12,
      idioma: "pt",
      pinContas: "0000",
      toqueAlarme: "ping",
    },
  };
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...seed(),
      whatsappTemplates: [
        { id: uid(), nome: "Encomenda em processamento", texto: "Olá {cliente}, a tua encomenda {encomenda} está agora em processamento. Obrigada!" },
        { id: uid(), nome: "Encomenda pronta", texto: "Olá {cliente}, a tua encomenda {encomenda} está pronta para envio/levantamento." },
        { id: uid(), nome: "Encomenda enviada", texto: "Olá {cliente}, a tua encomenda {encomenda} foi enviada hoje. Em breve estará contigo." },
      ],
      whatsappMensagens: [],
      notificacoes: [],
      gatilhos: [
        { estado: "em_producao", ativo: true, canal: "whatsapp", template: "Olá {cliente}, a tua encomenda {encomenda} entrou em produção." },
        { estado: "pronta", ativo: true, canal: "whatsapp", template: "Olá {cliente}, a tua encomenda {encomenda} está pronta!" },
        { estado: "entregue", ativo: false, canal: "email", template: "Olá {cliente}, a tua encomenda {encomenda} foi entregue. Obrigada pela preferência." },
      ],
      etsyConfig: { shopId: "", apiKey: "", ativo: false },
      etsyProdutos: [],
      ficheirosDigitais: [],
      catalogo: [],
      biblioteca: [],
      webhooksProcessados: {},
      traducoes: {},
      modulos: {},
      onboardingFeito: false,
      add: (k, item) =>
        set((s) => ({ [k]: [...(s as any)[k], { ...item, id: uid() }] } as any)),
      update: (k, id, patch) =>
        set((s) => ({
          [k]: (s as any)[k].map((x: any) => (x.id === id ? { ...x, ...patch } : x)),
        } as any)),
      remove: (k, id) =>
        set((s) => ({ [k]: (s as any)[k].filter((x: any) => x.id !== id) } as any)),
      setDesign: (patch) => set((s) => ({ design: { ...s.design, ...patch } })),
      setPerfil: (patch) => set((s) => ({ perfilNegocio: { ...s.perfilNegocio, ...patch } })),
      setSync: (patch) => set((s) => ({ sincronizacao: { ...s.sincronizacao, ...patch } })),
      audit: (acao, entidade, entidadeId, detalhes) =>
        set((s) => ({
          auditoria: [
            { id: uid(), data: new Date().toISOString(), utilizador: s.perfilNegocio?.nome || "admin", entidade, entidadeId, acao, detalhes },
            ...s.auditoria,
          ].slice(0, 500),
        })),
      setEtsy: (patch) => set((s) => ({ etsyConfig: { ...s.etsyConfig, ...patch } })),
      setModulo: (url, ativo) => set((s) => ({ modulos: { ...s.modulos, [url]: ativo } })),
      setModulos: (m) => set(() => ({ modulos: m })),
      aplicarPreset: (preset) => set(() => {
        if (preset === "completo") return { modulos: {} };
        const ativos = MODULOS_PRESETS[preset] as readonly string[];
        const m: ModulosAtivos = {};
        ativos.forEach((u) => (m[u] = true));
        return { modulos: m };
      }),
      setOnboardingFeito: (v) => set(() => ({ onboardingFeito: v })),
      setGatilho: (estado, patch) => set((s) => ({
        gatilhos: s.gatilhos.some((g) => g.estado === estado)
          ? s.gatilhos.map((g) => (g.estado === estado ? { ...g, ...patch } : g))
          : [...s.gatilhos, { estado, ativo: true, canal: "whatsapp", template: "", ...patch } as GatilhoNotificacao],
      })),
      setTraducao: (lang, source, target) => set((s) => ({
        traducoes: { ...s.traducoes, [lang]: { ...(s.traducoes[lang] || {}), [source]: target } },
      })),
      dispararGatilho: (encomendaId, estado) => set((s) => {
        const g = s.gatilhos.find((x) => x.estado === estado && x.ativo);
        if (!g) return {} as any;
        const enc = s.encomendas.find((e) => e.id === encomendaId);
        if (!enc) return {} as any;
        const cli = s.clientes.find((c) => c.id === enc.clienteId);
        const texto = (g.template || "")
          .replace("{cliente}", cli?.nome || "cliente")
          .replace("{encomenda}", enc.descricao || enc.codigo || enc.id)
          .replace("{estado}", estado);
        const canais = g.canal === "ambos" ? ["whatsapp", "email"] as const : [g.canal];
        const novas: Notificacao[] = canais.map((c) => ({
          id: uid(), encomendaId, clienteId: enc.clienteId, canal: c, estadoAlvo: estado, texto, enviada: false, data: new Date().toISOString(),
        }));
        return { notificacoes: [...novas, ...s.notificacoes].slice(0, 500) };
      }),
      consumirStockPorEtsy: (etsyListingId, quantidade = 1) => {
        const state = (useStore as any).getState() as State;
        const prod = state.etsyProdutos.find((p) => p.etsyListingId === etsyListingId);
        if (!prod) return { ok: false, faltas: ["produto não mapeado"] };
        const faltas: string[] = [];
        prod.materiais.forEach((mu) => {
          const m = state.materiais.find((x) => x.id === mu.materialId);
          if (!m || m.stock < mu.quantidade * quantidade) faltas.push(m?.nome || mu.materialId);
        });
        set((s) => ({
          materiais: s.materiais.map((m) => {
            const uso = prod.materiais.find((mu) => mu.materialId === m.id);
            return uso ? { ...m, stock: Math.max(0, m.stock - uso.quantidade * quantidade) } : m;
          }),
        }));
        return { ok: faltas.length === 0, faltas };
      },
      processarWebhookEtsy: (evt) => {
        const state = (useStore as any).getState() as State;
        if (state.webhooksProcessados[evt.id]) return { ok: false, motivo: "evento já processado" };
        const prod = state.etsyProdutos.find(
          (p) => p.etsyListingId === evt.listingId && (!evt.variacao || p.variacao === evt.variacao),
        );
        if (!prod) {
          set((s) => ({ webhooksProcessados: { ...s.webhooksProcessados, [evt.id]: true } }));
          return { ok: false, motivo: "listing não mapeado" };
        }
        // Cria/atualiza cliente
        let clienteId: ID | undefined;
        if (evt.clienteEmail || evt.clienteNome) {
          const existing = state.clientes.find(
            (c) => (evt.clienteEmail && c.email === evt.clienteEmail) || (!evt.clienteEmail && c.nome === evt.clienteNome),
          );
          if (existing) clienteId = existing.id;
          else {
            clienteId = uid();
            set((s) => ({
              clientes: [
                ...s.clientes,
                { id: clienteId!, nome: evt.clienteNome || "Cliente Etsy", email: evt.clienteEmail, criadoEm: new Date().toISOString() },
              ],
            }));
          }
        }
        // Cria encomenda
        const encId = uid();
        set((s) => ({
          encomendas: [
            ...s.encomendas,
            {
              id: encId,
              clienteId,
              descricao: evt.descricao || prod.nome,
              estado: prod.tipo === "digital" ? "entregue" : "pendente",
              preco: evt.valor || 0,
              criadoEm: new Date().toISOString(),
              codigo: `ETSY-${evt.id.slice(0, 8)}`,
            },
          ],
        }));
        // Desconta stock só para físicos e só uma vez (idempotente via webhooksProcessados)
        if (prod.tipo !== "digital") {
          const r = (useStore as any).getState().consumirStockPorEtsy(evt.listingId, evt.quantidade || 1);
          if (!r.ok) {
            (useStore as any).getState().audit("falha de stock em webhook Etsy", "encomenda", encId, `Faltas: ${r.faltas.join(", ")}`);
          }
        }
        set((s) => ({ webhooksProcessados: { ...s.webhooksProcessados, [evt.id]: true } }));
        (useStore as any).getState().audit("webhook Etsy processado", "encomenda", encId, `${prod.nome}${evt.variacao ? ` · ${evt.variacao}` : ""}`);
        return { ok: true };
      },
      processarWebhookWhatsapp: (evt) => {
        const state = (useStore as any).getState() as State;
        if (state.webhooksProcessados[evt.id]) return { ok: false, motivo: "evento já processado" };
        // Associa cliente pelo telefone
        const tel = (evt.telefone || "").replace(/\s+/g, "");
        const cliente = tel
          ? state.clientes.find((c) => (c.telefone || "").replace(/\s+/g, "") === tel)
          : undefined;
        // Tenta associar à encomenda mais recente desse cliente
        const enc = cliente
          ? [...state.encomendas].filter((e) => e.clienteId === cliente.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))[0]
          : undefined;
        set((s) => ({
          whatsappMensagens: [
            ...s.whatsappMensagens,
            {
              id: uid(),
              clienteId: cliente?.id,
              encomendaId: enc?.id,
              direcao: evt.direcao || "in",
              texto: evt.texto,
              data: evt.data || new Date().toISOString(),
            },
          ],
          webhooksProcessados: { ...s.webhooksProcessados, [evt.id]: true },
        }));
        (useStore as any).getState().audit("webhook WhatsApp recebido", "whatsapp", cliente?.id, evt.texto.slice(0, 80));
        return { ok: true };
      },
    }),
    { name: "atelier-store-v2" },
  ),
);

// derived helpers
export const custoMateriais = (projeto: Projeto, materiais: Material[]) =>
  projeto.materiais.reduce((sum, mu) => {
    const m = materiais.find((x) => x.id === mu.materialId);
    return sum + (m ? m.precoCompra * mu.quantidade : 0);
  }, 0);

export const precoProjeto = (projeto: Projeto, materiais: Material[]) => {
  const cMat = custoMateriais(projeto, materiais);
  const cHoras = projeto.horasTrabalhadas * projeto.precoHora;
  const base = cMat + cHoras;
  return base * (1 + projeto.margemProfit);
};

export const formatEUR = (n: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n);