import { useStore } from "@/lib/store";
import type { Cliente, Fornecedor, Material, Projeto, Encomenda, RegistoHora, Despesa, Fatura, Venda, Todo, CampanhaMarketing, MovimentoCaixa, Cotacao, PortfolioItem, Curso, AlunoCurso, InstagramPost, EventoAgenda, EtiquetaEnvio, CatalogoItem, BibliotecaItem, NotaRapida, AcaoMarketing, Moodboard, ContaPlataforma, ReceitaEditor } from "@/lib/store";

const uid = () => Math.random().toString(36).slice(2, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysFwd = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
const dateOnly = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

// Imagens ilustrativas estáveis (loremflickr — devolve fotos reais com base nas tags).
// O "lock" garante a mesma foto entre sessões.
const img = (tags: string, lock: number, w = 400, h = 400) =>
  `https://loremflickr.com/${w}/${h}/${encodeURIComponent(tags)}?lock=${lock}`;
const avatar = (seed: string) => `https://i.pravatar.cc/200?u=${encodeURIComponent(seed)}`;

/**
 * Acrescenta dados de demonstração ricos a TODAS as categorias da app.
 * Não substitui os dados existentes — só faz append.
 */
export function loadDemoData() {
  const s = useStore.getState();

  // --- Fornecedores ---
  const fornecedores: Fornecedor[] = [
    { id: uid(), nome: "Lãs do Minho", contacto: "+351 253 100 200", email: "geral@lasdominho.pt", website: "https://lasdominho.pt", notas: "Lã merino e alpaca, entregas em 2 dias.", imagem: img("wool,yarn,shop", 11) },
    { id: uid(), nome: "Algodões do Sul", contacto: "+351 289 555 777", email: "vendas@algodoes-sul.pt", website: "https://algodoes-sul.pt", notas: "Algodão orgânico certificado GOTS.", imagem: img("cotton,plant", 12) },
    { id: uid(), nome: "Tecidos Porto", contacto: "+351 220 808 909", email: "encomendas@tecidosporto.pt", notas: "Telas de linho e juta para tricotin em quadro.", imagem: img("fabric,linen,textile", 13) },
    { id: uid(), nome: "Botões & Cª", contacto: "+351 211 222 333", email: "botoes@cia.pt", notas: "Botões de madeira, olhos de segurança para amigurumi.", imagem: img("buttons,sewing", 14) },
    { id: uid(), nome: "Embalagens Verde", contacto: "+351 234 999 888", email: "info@embalagensverde.pt", notas: "Caixas e papel kraft reciclado.", imagem: img("kraft,box,packaging", 15) },
  ];

  // --- Materiais ---
  const m = (nome: string, unidade: string, stock: number, precoCompra: number, fornecedorId: string, extra?: Partial<Material>): Material => ({
    id: uid(), nome, unidade, stock, precoCompra, fornecedorId, stockMinimo: 5, ...extra,
  });
  const materiais: Material[] = [
    m("Lã merino bege", "novelo", 28, 5.2, fornecedores[0].id, { codigo: "LM-001", imagem: img("wool,beige,yarn", 101) }),
    m("Lã merino rosa velho", "novelo", 14, 5.2, fornecedores[0].id, { codigo: "LM-002", imagem: img("yarn,pink,wool", 102) }),
    m("Lã alpaca cinza", "novelo", 9, 8.9, fornecedores[0].id, { codigo: "LA-010", stockMinimo: 6, imagem: img("alpaca,grey,yarn", 103) }),
    m("Algodão branco amigurumi", "novelo", 32, 2.6, fornecedores[1].id, { codigo: "AL-100", imagem: img("cotton,white,yarn", 104) }),
    m("Algodão mostarda", "novelo", 6, 2.9, fornecedores[1].id, { codigo: "AL-105", imagem: img("yarn,mustard,cotton", 105) }),
    m("Tela linho natural 1.5m", "m", 12, 11.5, fornecedores[2].id, { codigo: "TL-150", imagem: img("linen,fabric,natural", 106) }),
    m("Tela juta crua 1m", "m", 5, 7.4, fornecedores[2].id, { codigo: "TJ-100", imagem: img("burlap,jute,fabric", 107) }),
    m("Enchimento siliconado", "g", 2400, 0.014, fornecedores[3].id, { codigo: "EN-S", imagem: img("stuffing,fiber,white", 108) }),
    m("Olhos segurança 8mm", "un", 120, 0.18, fornecedores[3].id, { codigo: "OS-08", imagem: img("plastic,eyes,craft", 109) }),
    m("Botões madeira 15mm", "un", 80, 0.25, fornecedores[3].id, { codigo: "BM-15", imagem: img("wooden,buttons", 110) }),
    m("Caixa kraft 20x20", "un", 35, 0.85, fornecedores[4].id, { codigo: "CK-20", imagem: img("kraft,box,brown", 111) }),
    m("Papel seda creme", "un", 200, 0.05, fornecedores[4].id, { codigo: "PS-CR", imagem: img("tissue,paper,cream", 112) }),
  ];

  // --- Clientes ---
  const clientes: Cliente[] = [
    { id: uid(), nome: "Ana Pereira", email: "ana.pereira@example.pt", telefone: "+351 911 222 333", morada: "Rua das Flores 12, Porto", notas: "Prefere tons pastel.", criadoEm: daysAgo(120), imagem: avatar("ana.pereira") },
    { id: uid(), nome: "João Silva", email: "joao.silva@example.pt", telefone: "+351 922 333 444", morada: "Av. da República 88, Lisboa", criadoEm: daysAgo(90), imagem: avatar("joao.silva") },
    { id: uid(), nome: "Marta Oliveira", email: "marta.o@example.pt", telefone: "+351 933 444 555", morada: "Praceta do Sol 4, Braga", notas: "Cliente recorrente — peças para bebés.", criadoEm: daysAgo(60), imagem: avatar("marta.oliveira") },
    { id: uid(), nome: "Pedro Costa", email: "pedro.costa@example.pt", telefone: "+351 944 555 666", morada: "Rua Nova 7, Coimbra", criadoEm: daysAgo(45), imagem: avatar("pedro.costa") },
    { id: uid(), nome: "Sofia Mendes", email: "sofia.mendes@example.pt", telefone: "+351 955 666 777", morada: "Largo do Pelourinho 3, Évora", notas: "Encomenda grandes mantas.", criadoEm: daysAgo(30), imagem: avatar("sofia.mendes") },
    { id: uid(), nome: "Inês Rocha", email: "ines.rocha@example.pt", telefone: "+351 966 777 888", morada: "Rua do Comércio 21, Faro", criadoEm: daysAgo(20), imagem: avatar("ines.rocha") },
    { id: uid(), nome: "Rui Tavares", email: "rui.tavares@example.pt", telefone: "+351 977 888 999", morada: "Av. Central 100, Viseu", criadoEm: daysAgo(7), imagem: avatar("rui.tavares") },
  ];

  // --- Projetos ---
  const projetos: Projeto[] = [
    { id: uid(), nome: "Manta tricotin XL 1.5m", codigo: "PR-001", clienteId: clientes[0].id, materiais: [{ materialId: materiais[0].id, quantidade: 8 }], horasTrabalhadas: 18, precoHora: 12, margemProfit: 0.7, estado: "em_curso", criadoEm: daysAgo(20), notas: "Cor bege com franjas." },
    { id: uid(), nome: "Amigurumi coelho 25cm", codigo: "PR-002", clienteId: clientes[1].id, materiais: [{ materialId: materiais[3].id, quantidade: 2 }, { materialId: materiais[7].id, quantidade: 90 }, { materialId: materiais[8].id, quantidade: 2 }], horasTrabalhadas: 7, precoHora: 12, margemProfit: 0.7, estado: "concluido", criadoEm: daysAgo(35) },
    { id: uid(), nome: "Quadro tricotin em tela 40x60", codigo: "PR-003", clienteId: clientes[2].id, materiais: [{ materialId: materiais[5].id, quantidade: 0.8 }, { materialId: materiais[1].id, quantidade: 3 }], horasTrabalhadas: 9, precoHora: 12, margemProfit: 0.7, estado: "em_curso", criadoEm: daysAgo(10) },
    { id: uid(), nome: "Conjunto bebé crochê", codigo: "PR-004", clienteId: clientes[2].id, materiais: [{ materialId: materiais[3].id, quantidade: 3 }, { materialId: materiais[9].id, quantidade: 4 }], horasTrabalhadas: 11, precoHora: 12, margemProfit: 0.7, estado: "rascunho", criadoEm: daysAgo(2) },
    { id: uid(), nome: "Manta sofá tricotin 2m", codigo: "PR-005", clienteId: clientes[4].id, materiais: [{ materialId: materiais[2].id, quantidade: 6 }, { materialId: materiais[0].id, quantidade: 4 }], horasTrabalhadas: 22, precoHora: 14, margemProfit: 0.7, estado: "em_curso", criadoEm: daysAgo(5) },
    { id: uid(), nome: "Amigurumi gato laranja", codigo: "PR-006", clienteId: clientes[5].id, materiais: [{ materialId: materiais[4].id, quantidade: 2 }, { materialId: materiais[7].id, quantidade: 70 }, { materialId: materiais[8].id, quantidade: 2 }], horasTrabalhadas: 6, precoHora: 12, margemProfit: 0.7, estado: "concluido", criadoEm: daysAgo(50) },
  ];

  // --- Encomendas ---
  const encomendas: Encomenda[] = [
    { id: uid(), codigo: "ENC-1001", clienteId: clientes[0].id, projetoId: projetos[0].id, descricao: "Manta XL bege com franjas", estado: "em_producao", prazo: dateOnly(12), preco: 280, criadoEm: daysAgo(18) },
    { id: uid(), codigo: "ENC-1002", clienteId: clientes[1].id, projetoId: projetos[1].id, descricao: "Coelho amigurumi cinza claro", estado: "entregue", prazo: dateOnly(-10), preco: 48, criadoEm: daysAgo(35) },
    { id: uid(), codigo: "ENC-1003", clienteId: clientes[2].id, projetoId: projetos[2].id, descricao: "Quadro tricotin em tela 40x60", estado: "pronta", prazo: dateOnly(3), preco: 95, criadoEm: daysAgo(9) },
    { id: uid(), codigo: "ENC-1004", clienteId: clientes[3].id, descricao: "2 porta-chaves crochê personalizados", estado: "pendente", prazo: dateOnly(20), preco: 18, criadoEm: daysAgo(3) },
    { id: uid(), codigo: "ENC-1005", clienteId: clientes[4].id, projetoId: projetos[4].id, descricao: "Manta sofá 2m tons quentes", estado: "em_producao", prazo: dateOnly(25), preco: 380, criadoEm: daysAgo(4) },
    { id: uid(), codigo: "ENC-1006", clienteId: clientes[5].id, projetoId: projetos[5].id, descricao: "Gato amigurumi laranja", estado: "entregue", prazo: dateOnly(-15), preco: 42, criadoEm: daysAgo(50) },
    { id: uid(), codigo: "ENC-1007", clienteId: clientes[6].id, descricao: "Cesto crochê para roupa", estado: "cancelada", preco: 35, criadoEm: daysAgo(6) },
  ];

  // --- Horas ---
  const horas: RegistoHora[] = [
    { id: uid(), projetoId: projetos[0].id, data: dateOnly(-15), horas: 4, descricao: "Montagem base" },
    { id: uid(), projetoId: projetos[0].id, data: dateOnly(-10), horas: 5, descricao: "Carreiras centrais" },
    { id: uid(), projetoId: projetos[0].id, data: dateOnly(-3), horas: 6, descricao: "Franjas + acabamentos" },
    { id: uid(), projetoId: projetos[1].id, data: dateOnly(-32), horas: 4, descricao: "Corpo do coelho" },
    { id: uid(), projetoId: projetos[1].id, data: dateOnly(-30), horas: 3, descricao: "Cabeça e detalhes" },
    { id: uid(), projetoId: projetos[2].id, data: dateOnly(-8), horas: 4, descricao: "Preparação tela" },
    { id: uid(), projetoId: projetos[2].id, data: dateOnly(-4), horas: 5, descricao: "Tricotin em quadro" },
    { id: uid(), projetoId: projetos[4].id, data: dateOnly(-4), horas: 8, descricao: "1ª metade da manta" },
    { id: uid(), projetoId: projetos[4].id, data: dateOnly(-1), horas: 6, descricao: "Continuação manta sofá" },
  ];

  // --- Despesas fixas ---
  const despesas: Despesa[] = [
    { id: uid(), nome: "Renda atelier", valor: 280, periodicidade: "mensal" },
    { id: uid(), nome: "Eletricidade", valor: 55, periodicidade: "mensal" },
    { id: uid(), nome: "Internet & telemóvel", valor: 35, periodicidade: "mensal" },
    { id: uid(), nome: "Contabilista", valor: 60, periodicidade: "mensal" },
    { id: uid(), nome: "Seguro multirriscos", valor: 145, periodicidade: "anual" },
    { id: uid(), nome: "Hosting website", valor: 89, periodicidade: "anual" },
    { id: uid(), nome: "Etsy listing fees (estim.)", valor: 12, periodicidade: "mensal" },
  ];

  // --- Faturas ---
  const faturas: Fatura[] = [
    { id: uid(), numero: "FT 2026/001", clienteId: clientes[1].id, encomendaId: encomendas[1].id, projetoId: projetos[1].id, tipo: "projeto", valor: 48, iva: 23, estado: "paga", data: dateOnly(-30) },
    { id: uid(), numero: "FT 2026/002", clienteId: clientes[5].id, encomendaId: encomendas[5].id, projetoId: projetos[5].id, tipo: "projeto", valor: 42, iva: 23, estado: "paga", data: dateOnly(-45) },
    { id: uid(), numero: "FT 2026/003", clienteId: clientes[2].id, encomendaId: encomendas[2].id, projetoId: projetos[2].id, tipo: "projeto", valor: 95, iva: 23, estado: "emitida", data: dateOnly(-2) },
    { id: uid(), numero: "FT 2026/004", clienteId: clientes[0].id, encomendaId: encomendas[0].id, projetoId: projetos[0].id, tipo: "projeto", valor: 280, iva: 23, estado: "rascunho", data: dateOnly(0) },
  ];

  // --- Vendas concluídas ---
  const vendas: Venda[] = [
    { id: uid(), clienteId: clientes[1].id, projetoId: projetos[1].id, valor: 48, data: dateOnly(-30), notas: "Coelho cinza" },
    { id: uid(), clienteId: clientes[5].id, projetoId: projetos[5].id, valor: 42, data: dateOnly(-45), notas: "Gato laranja" },
    { id: uid(), clienteId: clientes[2].id, projetoId: projetos[2].id, valor: 95, data: dateOnly(-2), notas: "Quadro tela" },
    { id: uid(), clienteId: clientes[3].id, valor: 18, data: dateOnly(-25), notas: "Porta-chaves" },
  ];

  // --- Cash flow ---
  const caixa: MovimentoCaixa[] = [
    { id: uid(), tipo: "entrada", categoria: "Venda", descricao: "Coelho amigurumi (ENC-1002)", valor: 48, data: dateOnly(-30) },
    { id: uid(), tipo: "entrada", categoria: "Venda", descricao: "Gato amigurumi (ENC-1006)", valor: 42, data: dateOnly(-45) },
    { id: uid(), tipo: "entrada", categoria: "Venda", descricao: "Quadro tela (ENC-1003)", valor: 95, data: dateOnly(-2) },
    { id: uid(), tipo: "entrada", categoria: "Curso", descricao: "Inscrição curso Tricotin", valor: 39, data: dateOnly(-10) },
    { id: uid(), tipo: "saida", categoria: "Material", descricao: "Compra lã merino (Lãs do Minho)", valor: 156, data: dateOnly(-25) },
    { id: uid(), tipo: "saida", categoria: "Material", descricao: "Algodão amigurumi", valor: 78, data: dateOnly(-18) },
    { id: uid(), tipo: "saida", categoria: "Renda", descricao: "Renda atelier", valor: 280, data: dateOnly(-1) },
    { id: uid(), tipo: "saida", categoria: "Marketing", descricao: "Anúncio Instagram", valor: 30, data: dateOnly(-12) },
    { id: uid(), tipo: "saida", categoria: "Eletricidade", descricao: "Fatura EDP", valor: 52, data: dateOnly(-6) },
    { id: uid(), tipo: "entrada", categoria: "Venda", descricao: "Porta-chaves crochê", valor: 18, data: dateOnly(-25) },
  ];

  // --- To-dos ---
  const todos: Todo[] = [
    { id: uid(), titulo: "Encomendar mais lã merino bege", feito: false, prioridade: "alta", prazo: dateOnly(3) },
    { id: uid(), titulo: "Publicar foto da manta XL no Instagram", feito: false, prioridade: "media" },
    { id: uid(), titulo: "Responder mensagens Etsy", feito: false, prioridade: "alta" },
    { id: uid(), titulo: "Atualizar preços do website", feito: true, prioridade: "baixa" },
    { id: uid(), titulo: "Preparar embalagem ENC-1003", feito: false, prioridade: "alta", prazo: dateOnly(2) },
    { id: uid(), titulo: "Fotografar amigurumis para portfólio", feito: false, prioridade: "media" },
  ];

  // --- Marketing ---
  const campanhas: CampanhaMarketing[] = [
    { id: uid(), nome: "Instagram Reels Outubro", canal: "Instagram", custo: 30, alcance: 4200, conversoes: 5, data: dateOnly(-30) },
    { id: uid(), nome: "Facebook Ads — Natal", canal: "Facebook", custo: 80, alcance: 12500, conversoes: 14, data: dateOnly(-15) },
    { id: uid(), nome: "Parceria blog artesanato", canal: "Blog", custo: 0, alcance: 1800, conversoes: 3, data: dateOnly(-8) },
    { id: uid(), nome: "Pinterest Pins moodboard", canal: "Pinterest", custo: 0, alcance: 6300, conversoes: 7, data: dateOnly(-3) },
  ];

  const acoesMarketing: AcaoMarketing[] = [
    { id: uid(), tipo: "promocao", titulo: "Desconto Dia da Mãe", dataInicio: dateOnly(-20), dataFim: dateOnly(-5), descontoTipo: "percentagem", descontoValor: 15, alvo: "todo", peca: "Amigurumis", estado: "concluida", criadoEm: daysAgo(25), resultado: "12 vendas adicionais", imagem: img("mothers,day,flowers", 601, 600, 400) },
    { id: uid(), tipo: "campanha", titulo: "Lançamento coleção Inverno", dataInicio: dateOnly(10), dataFim: dateOnly(40), meta: "20 encomendas em 30 dias", estado: "planeada", criadoEm: daysAgo(2), imagem: img("winter,knit,collection", 602, 600, 400) },
    { id: uid(), tipo: "giveaway", titulo: "Sorteio Amigurumi Coelho", dataInicio: dateOnly(-7), dataFim: dateOnly(7), regras: "Seguir, like e marcar 2 amigos.", alvo: "todo", estado: "ativa", criadoEm: daysAgo(8), imagem: img("amigurumi,rabbit,gift", 603, 600, 400) },
  ];

  // --- Cotações ---
  const cot = (projetoId: string, materiaisU: { materialId: string; quantidade: number }[], horas: number) => {
    const custoMateriais = materiaisU.reduce((acc, mu) => {
      const mat = materiais.find((x) => x.id === mu.materialId);
      return acc + (mat?.precoCompra ?? 0) * mu.quantidade;
    }, 0);
    const precoHora = 12;
    const custoHoras = horas * precoHora;
    const base = custoMateriais + custoHoras;
    const margem = 70;
    const precoFinal = +(base * (1 + margem / 100)).toFixed(2);
    return { custoMateriais, custoHoras, base, margem, precoFinal, materiaisU, horas, precoHora };
  };
  const cotacoes: Cotacao[] = [
    (() => {
      const c = cot(projetos[0].id, projetos[0].materiais, projetos[0].horasTrabalhadas);
      return { id: uid(), projetoId: projetos[0].id, materiais: c.materiaisU, horas: c.horas, precoHora: c.precoHora, extras: 0, margem: c.margem, custoMateriais: c.custoMateriais, custoHoras: c.custoHoras, base: c.base, precoFinal: c.precoFinal, criadoEm: daysAgo(20) };
    })(),
    (() => {
      const c = cot(projetos[2].id, projetos[2].materiais, projetos[2].horasTrabalhadas);
      return { id: uid(), projetoId: projetos[2].id, materiais: c.materiaisU, horas: c.horas, precoHora: c.precoHora, extras: 5, margem: c.margem, custoMateriais: c.custoMateriais, custoHoras: c.custoHoras, base: c.base + 5, precoFinal: +((c.base + 5) * (1 + c.margem / 100)).toFixed(2), criadoEm: daysAgo(10) };
    })(),
  ];

  // --- Etiquetas envio ---
  const etiquetas: EtiquetaEnvio[] = [
    { id: uid(), clienteId: clientes[1].id, encomendaId: encomendas[1].id, remetente: "Atelier Tricotin", destinatario: clientes[1].nome, morada: clientes[1].morada || "", codigoPostal: "1050-100 Lisboa", pais: "Portugal", telefone: clientes[1].telefone, peso: "450g", observacoes: "Frágil", criadoEm: daysAgo(28) },
    { id: uid(), clienteId: clientes[5].id, encomendaId: encomendas[5].id, remetente: "Atelier Tricotin", destinatario: clientes[5].nome, morada: clientes[5].morada || "", codigoPostal: "8000-200 Faro", pais: "Portugal", telefone: clientes[5].telefone, peso: "300g", criadoEm: daysAgo(45) },
  ];

  // --- Catálogo ---
  const catalogo: CatalogoItem[] = [
    { id: uid(), nome: "Manta tricotin XL bege", descricao: "Manta artesanal 1.5×1.5m em lã merino.", precoVenda: 280, custoMateriais: 42, custoHoras: 216, margem: 70, projetoId: projetos[0].id, ativo: true, criadoEm: daysAgo(20), imagem: img("chunky,blanket,knit", 201, 600, 400) },
    { id: uid(), nome: "Amigurumi coelho clássico", descricao: "Coelho de algodão, 25cm, com olhos de segurança.", precoVenda: 48, custoMateriais: 12, custoHoras: 84, margem: 70, projetoId: projetos[1].id, ativo: true, criadoEm: daysAgo(35), imagem: img("amigurumi,rabbit,crochet", 202, 600, 400) },
    { id: uid(), nome: "Quadro tricotin em tela 40×60", descricao: "Peça decorativa em tela de linho.", precoVenda: 95, custoMateriais: 16, custoHoras: 108, margem: 70, projetoId: projetos[2].id, ativo: true, criadoEm: daysAgo(10), imagem: img("embroidery,frame,wall", 203, 600, 400) },
    { id: uid(), nome: "Amigurumi gato laranja", descricao: "Gato em algodão mostarda, 22cm.", precoVenda: 42, custoMateriais: 11, custoHoras: 72, margem: 70, projetoId: projetos[5].id, ativo: true, criadoEm: daysAgo(50), imagem: img("amigurumi,cat,crochet", 204, 600, 400) },
  ];

  // --- Cursos & alunos ---
  const cursos: Curso[] = [
    { id: uid(), nome: "Tricotin para iniciantes", descricao: "4 módulos com vídeo e PDFs.", preco: 39, linkCompra: "https://exemplo.pt/curso-tricotin", grupos: "Facebook: Tricotin Iniciantes" },
    { id: uid(), nome: "Amigurumi do zero", descricao: "Aprende a fazer o teu primeiro amigurumi em 5 sessões.", preco: 59, linkCompra: "https://exemplo.pt/curso-amigurumi" },
    { id: uid(), nome: "Crochê avançado", descricao: "Técnicas de pontos complexos.", preco: 79 },
  ];
  const alunos: AlunoCurso[] = [
    { id: uid(), cursoId: cursos[0].id, nome: "Helena Marques", email: "helena@example.pt", moduloAtual: "Módulo 2", inscritoEm: daysAgo(20) },
    { id: uid(), cursoId: cursos[0].id, nome: "Diogo Lima", email: "diogo@example.pt", moduloAtual: "Módulo 1", inscritoEm: daysAgo(10) },
    { id: uid(), cursoId: cursos[1].id, nome: "Carla Santos", email: "carla@example.pt", moduloAtual: "Módulo 3", inscritoEm: daysAgo(40) },
  ];

  // --- Instagram ---
  const instagram: InstagramPost[] = [
    { id: uid(), legenda: "Nova manta XL pronta a sair do atelier ✨", likes: 320, comentarios: 24, alcance: 4500, data: daysAgo(2) },
    { id: uid(), legenda: "Detalhe do amigurumi coelho 🐇", likes: 210, comentarios: 14, alcance: 2800, data: daysAgo(8) },
    { id: uid(), legenda: "Bastidores: tricotin em quadro", likes: 180, comentarios: 11, alcance: 2300, data: daysAgo(15) },
    { id: uid(), legenda: "Quais cores preferem para a próxima coleção?", likes: 410, comentarios: 62, alcance: 5200, data: daysAgo(22) },
  ];

  // --- Eventos calendário ---
  const eventos: EventoAgenda[] = [
    { id: uid(), titulo: "Entregar ENC-1003", data: dateOnly(3), hora: "10:00", notas: "Quadro tela 40×60", alarmeMinAntes: 60, toque: "ping" },
    { id: uid(), titulo: "Reunião com fornecedor Lãs do Minho", data: dateOnly(5), hora: "15:30", alarmeMinAntes: 30 },
    { id: uid(), titulo: "Live Instagram — bastidores", data: dateOnly(8), hora: "21:00", alarmeMinAntes: 15 },
    { id: uid(), titulo: "Feira do Artesanato — montagem", data: dateOnly(14), hora: "09:00", alarmeMinAntes: 120 },
    { id: uid(), titulo: "Pagar renda atelier", data: dateOnly(1), alarmeMinAntes: 0 },
  ];

  // --- Portfólio ---
  const portfolio: PortfolioItem[] = [
    { id: uid(), titulo: "Manta tricotin XL bege", descricao: "Lã merino, 1.5×1.5m.", tecnica: "Tricotin manual", ano: "2026", cliente: clientes[0].nome, imagem: img("chunky,blanket", 301, 600, 400) },
    { id: uid(), titulo: "Amigurumi coelho", descricao: "Algodão branco, 25cm.", tecnica: "Crochê amigurumi", ano: "2026", cliente: clientes[1].nome, imagem: img("amigurumi,rabbit", 302, 600, 400) },
    { id: uid(), titulo: "Quadro tricotin em tela", descricao: "Linho natural + lã rosa.", tecnica: "Tricotin em quadro", ano: "2026", cliente: clientes[2].nome, imagem: img("embroidery,hoop", 303, 600, 400) },
    { id: uid(), titulo: "Conjunto bebé crochê", descricao: "Sapatinhos + touca.", tecnica: "Crochê", ano: "2025", imagem: img("baby,crochet,booties", 304, 600, 400) },
  ];

  // --- Notas & moodboards ---
  const notas: NotaRapida[] = [
    { id: uid(), titulo: "Ideias coleção Inverno", conteudo: "Tons terracota, off-white e verde musgo. Apostar em mantas pequenas e capuzes.", tipo: "texto", cor: "#FEF3C7", fixada: true, tags: ["coleção", "inverno"], categoria: "Ideias", modificadaEm: daysAgo(3) },
    { id: uid(), titulo: "Receita coelho v2", conteudo: "Aumentar tamanho das orelhas em 20%.", tipo: "texto", cor: "#DBEAFE", fixada: false, tags: ["amigurumi"], categoria: "Receitas", modificadaEm: daysAgo(6) },
    { id: uid(), titulo: "Lista compras urgente", conteudo: "", checklist: [{ id: uid(), texto: "Lã merino bege ×5", feito: false }, { id: uid(), texto: "Enchimento siliconado ×2kg", feito: false }, { id: uid(), texto: "Olhos segurança 10mm", feito: true }], tipo: "checklist", cor: "#FCE7F3", fixada: false, tags: ["compras"], categoria: "Fornecedores", modificadaEm: daysAgo(1) },
  ];

  const moodboards: Moodboard[] = [
    { id: uid(), titulo: "Coleção Inverno 2026", descricao: "Tons quentes e texturas chunky.", tags: ["inverno", "chunky"], imagens: [
      { id: uid(), url: img("chunky,knit,winter", 501, 600, 400), legenda: "Texturas chunky" },
      { id: uid(), url: img("terracotta,wool", 502, 600, 400), legenda: "Paleta terracota" },
      { id: uid(), url: img("moss,green,yarn", 503, 600, 400), legenda: "Verde musgo" },
    ], paleta: [{ id: uid(), nome: "Terracota", hex: "#C97B5A" }, { id: uid(), nome: "Creme", hex: "#F2E8DC" }, { id: uid(), nome: "Verde musgo", hex: "#6A7F5C" }], links: [{ id: uid(), titulo: "Inspiração Pinterest", url: "https://pinterest.com" }], criadoEm: daysAgo(5) },
  ];

  // --- Contas plataformas (PIN protege na UI) ---
  const contas: ContaPlataforma[] = [
    { id: uid(), plataforma: "Etsy", usernameEmail: "ateliertricotin", password: "••••••••", url: "https://etsy.com" },
    { id: uid(), plataforma: "Instagram", usernameEmail: "@ateliertricotin", password: "••••••••", url: "https://instagram.com/ateliertricotin" },
    { id: uid(), plataforma: "Stripe", usernameEmail: "geral@atelier.pt", password: "••••••••" },
  ];

  // --- Receita editor exemplo ---
  const receita: ReceitaEditor = {
    id: uid(), nome: "Coelho amigurumi clássico", categoria: "amigurumi",
    materiais: [{ id: uid(), nome: "Algodão branco", quantidade: "2 novelos" }, { id: uid(), nome: "Olhos 8mm", quantidade: "2 unidades" }, { id: uid(), nome: "Enchimento", quantidade: "≈90g" }],
    seccoes: [
      { id: uid(), nome: "Cabeça", carreiras: [{ id: uid(), texto: "6 pb em anel mágico", totalPontos: 6 }, { id: uid(), texto: "aum em cada (12)", totalPontos: 12 }, { id: uid(), texto: "(1pb, aum) ×6 (18)", totalPontos: 18 }] },
      { id: uid(), nome: "Corpo", carreiras: [{ id: uid(), texto: "6 pb em anel mágico", totalPontos: 6 }, { id: uid(), texto: "aum em cada (12)", totalPontos: 12 }] },
      { id: uid(), nome: "Orelhas", carreiras: [{ id: uid(), texto: "Correntinha 8 + 7pb voltando", totalPontos: 15 }] },
    ],
    notas: "Bordar nariz em rosa velho.",
    criadoEm: daysAgo(7),
  };

  // --- Biblioteca ---
  const biblioteca: BibliotecaItem[] = [
    { id: uid(), titulo: "Molde manta tricotin XL", categoria: "Tricotin", tipo: "molde", descricao: "Molde 1.5×1.5m com grelha 1cm.", criadoEm: daysAgo(20), imagem: img("knitting,pattern", 401, 600, 400) },
    { id: uid(), titulo: "Receita coelho amigurumi", categoria: "Amigurumi", tipo: "receita", descricao: "PDF com fotos passo-a-passo.", criadoEm: daysAgo(15), imagem: img("amigurumi,rabbit,pattern", 402, 600, 400) },
    { id: uid(), titulo: "Tutorial tricotin em quadro", categoria: "Tricotin", tipo: "tutorial", url: "https://youtu.be/exemplo", criadoEm: daysAgo(40), imagem: img("embroidery,tutorial", 403, 600, 400) },
  ];

  // Aplica tudo de uma só vez para minimizar renders / saves remotos
  useStore.setState({
    fornecedores: [...s.fornecedores, ...fornecedores],
    materiais: [...s.materiais, ...materiais],
    clientes: [...s.clientes, ...clientes],
    projetos: [...s.projetos, ...projetos],
    encomendas: [...s.encomendas, ...encomendas],
    horas: [...s.horas, ...horas],
    despesas: [...s.despesas, ...despesas],
    faturas: [...s.faturas, ...faturas],
    vendas: [...s.vendas, ...vendas],
    caixa: [...s.caixa, ...caixa],
    todos: [...s.todos, ...todos],
    campanhas: [...s.campanhas, ...campanhas],
    acoesMarketing: [...s.acoesMarketing, ...acoesMarketing],
    cotacoes: [...s.cotacoes, ...cotacoes],
    etiquetas: [...s.etiquetas, ...etiquetas],
    catalogo: [...s.catalogo, ...catalogo],
    cursos: [...s.cursos, ...cursos],
    alunos: [...s.alunos, ...alunos],
    instagram: [...s.instagram, ...instagram],
    eventos: [...s.eventos, ...eventos],
    portfolio: [...s.portfolio, ...portfolio],
    notas: [...s.notas, ...notas],
    moodboards: [...s.moodboards, ...moodboards],
    contas: [...s.contas, ...contas],
    receitasEditor: [...s.receitasEditor, receita],
    biblioteca: [...s.biblioteca, ...biblioteca],
  });

  s.audit("dados de demonstração carregados", "sistema", undefined, `${clientes.length} clientes, ${encomendas.length} encomendas, ${materiais.length} materiais, etc.`);
}