import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateReceitaPdf, downloadPdf, type PdfOptions, type ReceitaPdf, type TemplateId } from "@/lib/amigurumi/pdf";

const TEMPLATES: { id: TemplateId; nome: string; desc: string }[] = [
  { id: "minimal",      nome: "Minimal",      desc: "Preto e branco, tipografia limpa" },
  { id: "romantico",    nome: "Romântico",    desc: "Rosa suave, serifada, ornamentos florais" },
  { id: "boho",         nome: "Boho",         desc: "Beges quentes, terracota, pontinhos" },
  { id: "profissional", nome: "Profissional", desc: "Azul-marinho, sans-serif, corporativo" },
];

const STORAGE_KEY = "amigurumi-pdf-opts-v1";

function loadOpts(): PdfOptions {
  const base: PdfOptions = {
    template: "romantico",
    watermark: "",
    password: "",
    incluirIndice: true,
    incluirCapa: true,
    incluirAgradecimento: true,
    headerText: "",
    footerText: "© Craft Business Master · uso pessoal",
  };
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...base, ...JSON.parse(raw) };
  } catch {}
  return base;
}

export function AmigurumiDesign({ receita }: { receita: ReceitaPdf }) {
  const [opts, setOpts] = useState<PdfOptions>(loadOpts);
  const [busy, setBusy] = useState(false);

  const patch = (p: Partial<PdfOptions>) => {
    const next = { ...opts, ...p };
    setOpts(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const gerar = async () => {
    setBusy(true);
    try {
      const filename = (receita.titulo || "receita").replace(/[^\w\-]+/g, "_") + ".pdf";
      const finalOpts: PdfOptions = {
        ...opts,
        headerText: opts.headerText || `${receita.titulo} — ${receita.autor}`.trim().replace(/^—\s*|\s*—\s*$/g, ""),
      };
      const bytes = await generateReceitaPdf(receita, finalOpts);
      downloadPdf(bytes, filename);
      toast.success("PDF gerado");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
      <Card className="!bg-white/100 opacity-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => patch({ template: t.id })}
                className={`rounded-lg border p-3 text-left transition ${
                  opts.template === t.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className="font-display text-sm">{t.nome}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Opções do PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Capa dinâmica</Label>
            <Switch checked={opts.incluirCapa} onCheckedChange={(v) => patch({ incluirCapa: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Índice</Label>
            <Switch checked={opts.incluirIndice} onCheckedChange={(v) => patch({ incluirIndice: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Página de agradecimento</Label>
            <Switch checked={opts.incluirAgradecimento} onCheckedChange={(v) => patch({ incluirAgradecimento: v })} />
          </div>

          <div>
            <Label>Marca de água</Label>
            <Input value={opts.watermark || ""} onChange={(e) => patch({ watermark: e.target.value })}
              placeholder="Ex: PROVA / RASCUNHO" />
          </div>
          <div>
            <Label>Cabeçalho</Label>
            <Input value={opts.headerText || ""} onChange={(e) => patch({ headerText: e.target.value })}
              placeholder="Auto: título — autoria" />
          </div>
          <div>
            <Label>Rodapé</Label>
            <Input value={opts.footerText || ""} onChange={(e) => patch({ footerText: e.target.value })}
              placeholder="© 2026 · uso pessoal" />
          </div>

          <Button onClick={gerar} disabled={busy} className="w-full">
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileDown className="mr-1 h-4 w-4" />}
            Gerar PDF
          </Button>
          <p className="text-xs text-muted-foreground">
            Substitui o antigo "imprimir": gera um ficheiro PDF pronto a partilhar/imprimir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}