import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { Material, Fornecedor } from "@/lib/store";
import { parseCsv, autoMap, validateRows, CAMPOS, type Campo, type ValidatedRow } from "@/lib/csv-import";

type Step = "upload" | "map" | "preview";

export function CsvImportInventarioDialog({ trigger }: { trigger?: React.ReactNode }) {
  const materiais = useStore((s) => s.materiais);
  const fornecedores = useStore((s) => s.fornecedores);
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<Campo, string>>>({});
  const [criarFornecedores, setCriarFornecedores] = useState(true);
  const [modoStock, setModoStock] = useState<"substituir" | "somar">("substituir");

  const reset = () => {
    setStep("upload"); setCsvText(""); setHeaders([]); setRows([]); setMapping({});
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
    parseText(text);
  };

  const parseText = (text: string) => {
    try {
      const { headers, rows } = parseCsv(text);
      if (!headers.length) return toast.error("CSV vazio ou sem cabeçalho");
      setHeaders(headers);
      setRows(rows);
      setMapping(autoMap(headers));
      setStep("map");
    } catch (e) {
      toast.error("Erro a ler CSV: " + (e as Error).message);
    }
  };

  const validated = useMemo<ValidatedRow[]>(
    () => (step === "preview" ? validateRows(rows, mapping) : []),
    [rows, mapping, step],
  );

  const plano = useMemo(() => {
    if (!validated.length) return { novos: [] as ValidatedRow[], updates: [] as { row: ValidatedRow; material: Material }[], invalidos: [] as ValidatedRow[] };
    const novos: ValidatedRow[] = [];
    const updates: { row: ValidatedRow; material: Material }[] = [];
    const invalidos: ValidatedRow[] = [];
    for (const r of validated) {
      if (r.erros.length) { invalidos.push(r); continue; }
      const match = materiais.find((m) =>
        (r.codigo && m.codigo && m.codigo.toLowerCase() === r.codigo.toLowerCase()) ||
        (m.nome.toLowerCase() === r.nome.toLowerCase() && (!r.marca || (m.marca ?? "").toLowerCase() === r.marca.toLowerCase())),
      );
      if (match) updates.push({ row: r, material: match }); else novos.push(r);
    }
    return { novos, updates, invalidos };
  }, [validated, materiais]);

  const aplicar = () => {
    const fornecedorPorNome = new Map<string, Fornecedor>();
    fornecedores.forEach((f) => fornecedorPorNome.set(f.nome.toLowerCase(), f));

    const resolveFornecedor = (nome?: string): string | undefined => {
      if (!nome) return undefined;
      const k = nome.toLowerCase();
      const existing = fornecedorPorNome.get(k);
      if (existing) return existing.id;
      if (!criarFornecedores) return undefined;
      // create a lightweight supplier and cache it locally so subsequent rows reuse it.
      const novo: Omit<Fornecedor, "id"> = { nome, contactos: {} } as unknown as Omit<Fornecedor, "id">;
      add("fornecedores", novo);
      // Read back the newly-created supplier from the store snapshot.
      const created = useStore.getState().fornecedores.find((f) => f.nome === nome);
      if (created) { fornecedorPorNome.set(k, created); return created.id; }
      return undefined;
    };

    let nNovos = 0, nUpd = 0;
    for (const r of plano.novos) {
      const fornecedorId = resolveFornecedor(r.fornecedor);
      const material: Omit<Material, "id"> = {
        nome: r.nome,
        codigo: r.codigo,
        unidade: r.unidade ?? "un",
        stock: r.stock ?? 0,
        stockMinimo: r.stockMinimo,
        precoCompra: r.precoCompra ?? 0,
        fornecedorId,
        categoria: r.categoria ?? "fios",
        marca: r.marca,
        codigoCor: r.codigoCor,
        notas: r.notas,
      };
      add("materiais", material);
      nNovos++;
    }
    for (const { row: r, material } of plano.updates) {
      const patch: Partial<Material> = {};
      if (r.codigo) patch.codigo = r.codigo;
      if (r.unidade) patch.unidade = r.unidade;
      if (r.stock != null) patch.stock = modoStock === "somar" ? (material.stock ?? 0) + r.stock : r.stock;
      if (r.stockMinimo != null) patch.stockMinimo = r.stockMinimo;
      if (r.precoCompra != null) patch.precoCompra = r.precoCompra;
      if (r.categoria) patch.categoria = r.categoria;
      if (r.marca) patch.marca = r.marca;
      if (r.codigoCor) patch.codigoCor = r.codigoCor;
      if (r.notas) patch.notas = r.notas;
      const fornecedorId = resolveFornecedor(r.fornecedor);
      if (fornecedorId && material.fornecedorId && fornecedorId !== material.fornecedorId && r.precoCompra != null) {
        // Extra supplier price for the same material.
        const extras = [...(material.fornecedoresExtra ?? []).filter((x) => x.fornecedorId !== fornecedorId),
          { fornecedorId, preco: r.precoCompra, referencia: r.referencia }];
        patch.fornecedoresExtra = extras;
      } else if (fornecedorId && !material.fornecedorId) {
        patch.fornecedorId = fornecedorId;
      }
      update("materiais", material.id, patch);
      nUpd++;
    }
    toast.success(`Importação concluída: ${nNovos} novos · ${nUpd} atualizados${plano.invalidos.length ? ` · ${plano.invalidos.length} ignorados` : ""}`);
    setOpen(false);
    reset();
  };

  const templateCsv = "nome;codigo;unidade;stock;stockMinimo;precoCompra;fornecedor;categoria;marca;codigoCor\nLã merino;MAT-001;novelo;24;5;4.50;Retrosaria Central;fios;;\nMulinê 310;DMC-310;meada;10;3;1.20;DMC Portugal;meadas;DMC;310\n";
  const downloadTemplate = () => {
    const blob = new Blob([templateCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modelo-inventario.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline"><Upload className="mr-1 h-4 w-4" />Importar CSV</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl" data-testid="csv-import-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar inventário / preços por CSV
            <Badge variant="secondary" className="ml-2">{step === "upload" ? "1. Ficheiro" : step === "map" ? "2. Mapear" : "3. Rever"}</Badge>
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Carrega um ficheiro CSV (vírgula ou ponto-e-vírgula) ou cola o conteúdo. Colunas típicas: nome, código, unidade, stock, preço, fornecedor.
            </p>
            <div className="grid gap-2">
              <Label>Ficheiro .csv</Label>
              <Input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
            <div className="grid gap-2">
              <Label>… ou cola o CSV</Label>
              <Textarea rows={6} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="nome;codigo;stock;preco;fornecedor" />
            </div>
            <div className="flex items-center justify-between">
              <Button variant="link" size="sm" onClick={downloadTemplate}>Descarregar modelo</Button>
              <Button disabled={!csvText.trim()} onClick={() => parseText(csvText)}>Ler CSV</Button>
            </div>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Associa cada campo do inventário à coluna correspondente do CSV. Detetámos automaticamente o que pudemos.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CAMPOS.map(({ key, label, required }) => (
                <div key={key} className="grid gap-1">
                  <Label className="text-xs">{label} {required && <span className="text-destructive">*</span>}</Label>
                  <Select value={mapping[key] ?? "__none__"} onValueChange={(v) => setMapping({ ...mapping, [key]: v === "__none__" ? undefined : v })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— não usar —</SelectItem>
                      {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Modo de stock</Label>
                <Select value={modoStock} onValueChange={(v) => setModoStock(v as "substituir" | "somar")}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="substituir">Substituir stock atual</SelectItem>
                    <SelectItem value="somar">Somar ao stock atual (entradas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <input id="cf" type="checkbox" checked={criarFornecedores} onChange={(e) => setCriarFornecedores(e.target.checked)} />
                <Label htmlFor="cf" className="text-xs">Criar fornecedores em falta</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("upload")}>Voltar</Button>
              <Button disabled={!mapping.nome} onClick={() => setStep("preview")}>Pré-visualizar</Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <Stat label="Novos" value={plano.novos.length} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
              <Stat label="Atualizar" value={plano.updates.length} icon={<CheckCircle2 className="h-4 w-4 text-sky-600" />} />
              <Stat label="Com erros" value={plano.invalidos.length} icon={<AlertTriangle className="h-4 w-4 text-destructive" />} />
            </div>

            <div className="max-h-[320px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validated.slice(0, 200).map((r) => {
                    const isUpd = plano.updates.some((u) => u.row === r);
                    const isErr = r.erros.length > 0;
                    return (
                      <TableRow key={r.linha}>
                        <TableCell className="text-xs text-muted-foreground">{r.linha}</TableCell>
                        <TableCell>
                          {isErr ? <Badge variant="destructive">Ignorar</Badge>
                            : isUpd ? <Badge variant="secondary">Atualiza</Badge>
                            : <Badge>Novo</Badge>}
                        </TableCell>
                        <TableCell className="font-medium">{r.nome || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-xs">{r.codigo ?? "—"}</TableCell>
                        <TableCell className="text-right">{r.stock ?? "—"}</TableCell>
                        <TableCell className="text-right">{r.precoCompra != null ? r.precoCompra.toFixed(2) : "—"}</TableCell>
                        <TableCell className="text-xs">{r.fornecedor ?? "—"}</TableCell>
                        <TableCell className="text-xs text-destructive">{r.erros.join(", ")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {validated.length > 200 && (
              <p className="text-xs text-muted-foreground">Pré-visualização limitada às primeiras 200 linhas — a importação processa todas ({validated.length}).</p>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("map")}>Voltar</Button>
              <Button onClick={aplicar} disabled={plano.novos.length + plano.updates.length === 0}>
                Importar {plano.novos.length + plano.updates.length}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-3">
      {icon}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}