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

export interface Material {
  id: ID;
  nome: string;
  unidade: string; // m, g, novelo, un
  stock: number;
  precoCompra: number; // por unidade
  fornecedorId?: ID;
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
  clienteId?: ID;
  projetoId?: ID;
  descricao: string;
  estado: "pendente" | "em_producao" | "pronta" | "entregue" | "cancelada";
  prazo?: string;
  preco: number;
  criadoEm: string;
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
}

export type Idioma = "pt" | "en" | "es" | "fr" | "de" | "it";

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
  design: DesignSettings;

  // generic helpers
  add: <K extends keyof CollectionMap>(k: K, item: Omit<CollectionMap[K], "id">) => void;
  update: <K extends keyof CollectionMap>(k: K, id: ID, patch: Partial<CollectionMap[K]>) => void;
  remove: <K extends keyof CollectionMap>(k: K, id: ID) => void;
  setDesign: (patch: Partial<DesignSettings>) => void;
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
};

const seed = (): Pick<
  State,
  "clientes" | "fornecedores" | "materiais" | "projetos" | "encomendas" | "horas" | "despesas" | "faturas" | "vendas" | "todos" | "campanhas" | "caixa" | "cotacoes" | "contas" | "portfolio" | "cursos" | "alunos" | "instagram" | "eventos" | "design"
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