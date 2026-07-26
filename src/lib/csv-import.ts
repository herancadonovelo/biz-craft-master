// Utilities to import inventário / fornecedor prices from CSV.
// Zero deps — small parser that handles quoted fields, commas or semicolons.

export type CsvRow = Record<string, string>;

function detectDelimiter(sample: string): string {
  const first = sample.split(/\r?\n/, 1)[0] ?? "";
  const c = (ch: string) => (first.match(new RegExp(`\\${ch}`, "g")) ?? []).length;
  const candidates: [string, number][] = [[";", c(";")], [",", c(",")], ["\t", c("\t")], ["|", c("|")]];
  candidates.sort((a, b) => b[1] - a[1]);
  return candidates[0][1] > 0 ? candidates[0][0] : ",";
}

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[]; delimiter: string } {
  const clean = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(clean);
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delimiter) { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && clean[i + 1] === "\n") i++;
        row.push(cell); cell = "";
        if (row.some((c) => c.trim() !== "")) out.push(row);
        row = [];
      } else cell += ch;
    }
  }
  if (cell !== "" || row.length) { row.push(cell); if (row.some((c) => c.trim() !== "")) out.push(row); }

  const headers = (out.shift() ?? []).map((h) => h.trim());
  const rows: CsvRow[] = out.map((r) => {
    const o: CsvRow = {};
    headers.forEach((h, i) => { o[h] = (r[i] ?? "").trim(); });
    return o;
  });
  return { headers, rows, delimiter };
}

// Canonical destination fields we map user CSV columns onto.
export type Campo =
  | "nome" | "codigo" | "unidade" | "stock" | "stockMinimo"
  | "precoCompra" | "fornecedor" | "categoria" | "marca" | "codigoCor" | "notas" | "referencia";

export const CAMPOS: { key: Campo; label: string; required?: boolean }[] = [
  { key: "nome", label: "Nome", required: true },
  { key: "codigo", label: "Código" },
  { key: "unidade", label: "Unidade" },
  { key: "stock", label: "Stock" },
  { key: "stockMinimo", label: "Stock mínimo" },
  { key: "precoCompra", label: "Preço compra (€)" },
  { key: "fornecedor", label: "Fornecedor (nome)" },
  { key: "categoria", label: "Categoria (fios/meadas/acessorios)" },
  { key: "marca", label: "Marca" },
  { key: "codigoCor", label: "Código cor" },
  { key: "referencia", label: "Referência fornecedor" },
  { key: "notas", label: "Notas" },
];

const ALIASES: Record<Campo, string[]> = {
  nome: ["nome", "name", "artigo", "produto", "descrição", "descricao"],
  codigo: ["codigo", "código", "sku", "ref", "referencia interna", "cod"],
  unidade: ["unidade", "un", "unit"],
  stock: ["stock", "qtd", "quantidade", "qty"],
  stockMinimo: ["stockminimo", "stock minimo", "stock mínimo", "min", "minimo"],
  precoCompra: ["preco", "preço", "preco compra", "preço compra", "price", "custo", "valor"],
  fornecedor: ["fornecedor", "supplier", "vendor"],
  categoria: ["categoria", "category", "tipo"],
  marca: ["marca", "brand"],
  codigoCor: ["codigo cor", "código cor", "cor", "colour", "color", "codigocor"],
  referencia: ["referencia fornecedor", "ref fornecedor", "sku fornecedor"],
  notas: ["notas", "notes", "obs", "observacoes"],
};

export function autoMap(headers: string[]): Partial<Record<Campo, string>> {
  const map: Partial<Record<Campo, string>> = {};
  const norm = (s: string) => s.toLowerCase().replace(/[_-]/g, " ").trim();
  for (const { key } of CAMPOS) {
    const target = ALIASES[key];
    const found = headers.find((h) => target.includes(norm(h)));
    if (found) map[key] = found;
  }
  return map;
}

function toNumber(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  // Accept "1.234,56", "1,234.56", "12,5", "12.5", strip currency chars.
  let s = raw.replace(/[€$£\s]/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export type ValidatedRow = {
  linha: number;
  raw: CsvRow;
  nome: string;
  codigo?: string;
  unidade?: string;
  stock?: number;
  stockMinimo?: number;
  precoCompra?: number;
  fornecedor?: string;
  categoria?: "fios" | "meadas" | "acessorios";
  marca?: string;
  codigoCor?: string;
  referencia?: string;
  notas?: string;
  erros: string[];
};

export function validateRows(rows: CsvRow[], mapping: Partial<Record<Campo, string>>): ValidatedRow[] {
  return rows.map((raw, i) => {
    const pick = (k: Campo) => (mapping[k] ? raw[mapping[k]!] : undefined);
    const erros: string[] = [];
    const nome = (pick("nome") ?? "").trim();
    if (!nome) erros.push("nome obrigatório");

    const parseNum = (k: Campo, min = 0) => {
      const v = pick(k);
      if (v == null || v === "") return undefined;
      const n = toNumber(v);
      if (n == null) { erros.push(`${k} inválido`); return undefined; }
      if (n < min) { erros.push(`${k} < ${min}`); return undefined; }
      return n;
    };

    const catRaw = (pick("categoria") ?? "").toLowerCase().trim();
    const categoria: ValidatedRow["categoria"] | undefined =
      catRaw === "fios" || catRaw === "meadas" || catRaw === "acessorios" || catRaw === "acessórios"
        ? (catRaw === "acessórios" ? "acessorios" : (catRaw as ValidatedRow["categoria"]))
        : catRaw ? (erros.push("categoria inválida"), undefined) : undefined;

    return {
      linha: i + 2, // header is line 1
      raw,
      nome,
      codigo: pick("codigo") || undefined,
      unidade: pick("unidade") || undefined,
      stock: parseNum("stock"),
      stockMinimo: parseNum("stockMinimo"),
      precoCompra: parseNum("precoCompra"),
      fornecedor: pick("fornecedor") || undefined,
      categoria,
      marca: pick("marca") || undefined,
      codigoCor: pick("codigoCor") || undefined,
      referencia: pick("referencia") || undefined,
      notas: pick("notas") || undefined,
      erros,
    };
  });
}