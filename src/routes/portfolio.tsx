import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import jsPDF from "jspdf";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileDown, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ImagePicker } from "@/components/ImagePicker";

function readImage(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/portfolio")({
  head: () => ({ meta: [{ title: "Portefólio" }] }),
  component: () => {
    const { portfolio, add, remove, update, design } = useStore();
    const [form, setForm] = useState({ titulo: "", descricao: "", tecnica: "", ano: String(new Date().getFullYear()), cliente: "", imagem: "" });

    const exportPDF = async () => {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const w = doc.internal.pageSize.getWidth();
      doc.setFontSize(22); doc.text(design.nomeNegocio, 40, 60);
      doc.setFontSize(14); doc.setTextColor(110); doc.text("Portefólio", 40, 82);
      doc.setTextColor(0);
      let y = 110;
      for (const p of portfolio) {
        if (y > 720) { doc.addPage(); y = 60; }
        doc.setFontSize(13); doc.setFont("helvetica", "bold");
        doc.text(p.titulo, 40, y); y += 18;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(110);
        const meta = [p.tecnica, p.ano, p.cliente].filter(Boolean).join(" · ");
        if (meta) { doc.text(meta, 40, y); y += 14; }
        doc.setTextColor(0); doc.setFontSize(10);
        if (p.descricao) {
          const lines = doc.splitTextToSize(p.descricao, w - 220);
          doc.text(lines, 40, y); y += lines.length * 12 + 6;
        }
        if (p.imagem) {
          try { doc.addImage(p.imagem, "JPEG", w - 180, y - 60, 140, 100); } catch { /* skip */ }
        }
        y += 40;
        doc.setDrawColor(220); doc.line(40, y - 10, w - 40, y - 10);
      }
      doc.save(`portefolio-${Date.now()}.pdf`);
      toast.success("PDF gerado");
    };

    const sharePDF = async () => {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.text(`${design.nomeNegocio} — Portefólio (${portfolio.length} peças)`, 40, 60);
      const blob = doc.output("blob");
      const file = new File([blob], "portefolio.pdf", { type: "application/pdf" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "Portefólio" }); } catch {}
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    };

    return (
      <div className="space-y-6">
        <PageHeader title="Portefólio"
          description={`${portfolio.length} peças · exporta em PDF para partilhar com clientes.`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={sharePDF}><Share2 className="mr-1 h-4 w-4" />Partilhar</Button>
              <Button onClick={exportPDF} disabled={portfolio.length === 0}><FileDown className="mr-1 h-4 w-4" />Exportar PDF</Button>
            </div>
          } />
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
          <div><Label>Técnica</Label><Input value={form.tecnica} onChange={(e) => setForm({ ...form, tecnica: e.target.value })} placeholder="Tricotin, crochê…" /></div>
          <div><Label>Ano</Label><Input value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} /></div>
          <div><Label>Cliente</Label><Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Descrição</Label><Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          <div className="md:col-span-3"><Label>Imagem</Label>
            <div className="mt-1"><ImagePicker value={form.imagem} onChange={(v) => setForm({ ...form, imagem: v })} size="h-28 w-28" /></div>
          </div>
          <div className="md:col-span-3"><Button onClick={() => {
            if (!form.titulo) return toast.error("Título obrigatório");
            add("portfolio", form);
            setForm({ titulo: "", descricao: "", tecnica: "", ano: String(new Date().getFullYear()), cliente: "", imagem: "" });
            toast.success("Peça adicionada");
          }}><Plus className="mr-1 h-4 w-4" />Adicionar peça</Button></div>
        </CardContent></Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {p.imagem && <img src={p.imagem} alt={p.titulo} className="h-44 w-full object-cover" />}
              <CardContent className="space-y-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold">{p.titulo}</h3>
                  <Button size="icon" variant="ghost" onClick={() => remove("portfolio", p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">{[p.tecnica, p.ano, p.cliente].filter(Boolean).join(" · ")}</p>
                {p.descricao && <p className="text-sm">{p.descricao}</p>}
              </CardContent>
            </Card>
          ))}
          {portfolio.length === 0 && <p className="col-span-full text-center text-muted-foreground">Adiciona projetos terminados aqui.</p>}
        </div>
      </div>
    );
  },
});