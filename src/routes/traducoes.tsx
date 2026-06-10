import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { IDIOMAS } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/traducoes")({
  head: () => ({ meta: [{ title: "Traduções de conteúdo" }] }),
  component: () => {
    const { traducoes, setTraducao, design } = useStore();
    const [lang, setLang] = useState<string>(design.idioma === "pt" ? "en" : design.idioma);
    const [src, setSrc] = useState("");
    const [tgt, setTgt] = useState("");
    const entries = Object.entries(traducoes[lang] || {});
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
        <Card><CardContent className="space-y-1 p-4">
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