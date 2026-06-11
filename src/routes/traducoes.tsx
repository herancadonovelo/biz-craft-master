import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { IDIOMAS } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/traducoes")({
  head: () => ({ meta: [{ title: "Traduções de conteúdo" }] }),
  component: () => {
    const s = useStore();
    const { traducoes, setTraducao, design } = s;
    const [lang, setLang] = useState<string>(design.idioma === "pt" ? "en" : design.idioma);
    const [src, setSrc] = useState("");
    const [tgt, setTgt] = useState("");
    const entries = Object.entries(traducoes[lang] || {});

    const dinamicos = useMemo(() => {
      const set = new Set<string>();
      const push = (v?: string | null) => { if (v && typeof v === "string" && v.trim().length > 1) set.add(v.trim()); };
      s.clientes.forEach((c) => { push(c.nome); push(c.notas); });
      s.fornecedores.forEach((f) => { push(f.nome); push(f.notas); });
      s.materiais.forEach((m) => { push(m.nome); push(m.notas); });
      s.projetos.forEach((p) => { push(p.nome); push(p.notas); });
      s.encomendas.forEach((e) => { push(e.descricao); });
      s.catalogo.forEach((c) => { push(c.nome); push(c.descricao); });
      s.biblioteca.forEach((b) => { push(b.titulo); push(b.descricao); push(b.categoria); });
      s.cursos.forEach((c) => { push(c.nome); push(c.descricao); });
      s.portfolio.forEach((p) => { push(p.titulo); push(p.descricao); });
      s.campanhas.forEach((c) => { push(c.nome); push(c.canal); });
      s.etiquetas.forEach((e) => { push(e.destinatario); push(e.morada); });
      return Array.from(set).sort();
    }, [s.clientes, s.fornecedores, s.materiais, s.projetos, s.encomendas, s.catalogo, s.biblioteca, s.cursos, s.portfolio, s.campanhas, s.etiquetas]);
    const dicionarioAlvo = traducoes[lang] || {};
    const emFalta = lang === "pt" ? [] : dinamicos.filter((t) => !dicionarioAlvo[t]);

    return (
      <div className="space-y-6">
        <PageHeader title="Traduções de conteúdo" description="Adiciona traduções para títulos, descrições e textos que tu próprio escreveste (PT → outro idioma). Aplicam-se automaticamente." />
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <div>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{IDIOMAS.filter((l) => l.code !== "pt").map((l) => <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input placeholder="Texto original (PT)" value={src} onChange={(e) => setSrc(e.target.value)} />
          <Input placeholder="Tradução" value={tgt} onChange={(e) => setTgt(e.target.value)} />
          <Button onClick={() => { if (!src || !tgt) return toast.error("Preenche ambos"); setTraducao(lang, src, tgt); setSrc(""); setTgt(""); toast.success("Tradução guardada"); }}><Plus className="mr-1 h-4 w-4" />Guardar</Button>
        </CardContent></Card>

        <Card><CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h3 className="font-display font-semibold">Conteúdo dinâmico por traduzir ({emFalta.length})</h3>
          </div>
          <p className="text-xs text-muted-foreground">Textos que tu escreveste e que ainda não têm tradução para {lang.toUpperCase()}. Clica para começar a editar.</p>
          <div className="max-h-72 space-y-1 overflow-auto">
            {emFalta.map((t) => (
              <button key={t} onClick={() => setSrc(t)} className="block w-full rounded border border-border p-2 text-left text-sm hover:bg-accent">{t}</button>
            ))}
            {emFalta.length === 0 && <p className="text-sm text-muted-foreground">Tudo traduzido neste idioma. 🎉</p>}
          </div>
        </CardContent></Card>

        <Card><CardContent className="space-y-1 p-4">
          <h3 className="font-display font-semibold">Traduções guardadas ({entries.length})</h3>
          {entries.length === 0 && <p className="text-sm text-muted-foreground">Sem traduções para este idioma.</p>}
          {entries.map(([s, t]) => (
            <div key={s} className="flex items-center justify-between rounded border border-border p-2 text-sm">
              <div><span className="text-muted-foreground">{s}</span> → <span className="font-medium">{t}</span></div>
              <Button size="icon" variant="ghost" onClick={() => setTraducao(lang, s, "")}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent></Card>
      </div>
    );
  },
});