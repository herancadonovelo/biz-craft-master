import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { IDIOMAS, useT } from "@/lib/i18n";
import pending from "@/i18n/pending.json";

type Entry = { text: string; file: string; category: string; key: string; translated: boolean; en: string };

const manifest = pending as unknown as {
  generatedAt: string;
  total: number;
  pending: number;
  byCategory: Record<string, { total: number; pending: number }>;
  entries: Entry[];
};

export const Route = createFileRoute("/traducoes-pendentes")({
  component: TraducoesPendentes,
  head: () => ({
    meta: [
      { title: "Strings por traduzir | Craft Business Master" },
      { name: "description", content: "Painel para rever textos ainda escritos no código e atribuir chave e tradução em cada dicionário." },
      { property: "og:title", content: "Strings por traduzir" },
      { property: "og:description", content: "Rever e traduzir os textos ainda hardcoded da aplicação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function TraducoesPendentes() {
  const t = useT();
  const traducoes = useStore((s) => s.traducoes);
  const setTraducao = useStore((s) => s.setTraducao);
  const [lang, setLang] = useState("en");
  const [categoria, setCategoria] = useState("todas");
  const [query, setQuery] = useState("");
  const [apenasPendentes, setApenasPendentes] = useState(true);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const categorias = useMemo(() => Object.keys(manifest.byCategory).sort(), []);
  const lista = useMemo(() => {
    const custom = (traducoes as Record<string, Record<string, string>>)[lang] || {};
    return manifest.entries.filter((e) => {
      if (categoria !== "todas" && e.category !== categoria) return false;
      if (query && !e.text.toLowerCase().includes(query.toLowerCase())) return false;
      const temTraducao = Boolean(e.en?.trim()) || Boolean(custom[e.text]?.trim());
      if (apenasPendentes && temTraducao) return false;
      return true;
    });
  }, [categoria, query, apenasPendentes, lang, traducoes]);

  const custom = (traducoes as Record<string, Record<string, string>>)[lang] || {};

  const guardar = (e: Entry) => {
    const valor = (draft[e.text] ?? "").trim();
    if (!valor) {
      toast.error("Escreve a tradução antes de guardar.");
      return;
    }
    try {
      setTraducao(lang, e.text, valor);
      toast.success(`Tradução guardada (${lang}) — aplicada de imediato em toda a app.`);
    } catch (err) {
      toast.error(`Não foi possível guardar: ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-6" data-testid="pending-translations">
      <PageHeader
        title="Strings por traduzir"
        description="Textos ainda escritos diretamente no código. Escolhe a chave/dicionário e a tradução — fica ativa instantaneamente."
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("common.search")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger data-testid="pending-lang"><SelectValue /></SelectTrigger>
            <SelectContent>
              {IDIOMAS.filter((i) => i.code !== "pt").map((i) => (
                <SelectItem key={i.code} value={i.code}>{i.flag} {i.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger data-testid="pending-category"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>
                  {c} ({manifest.byCategory[c].pending}/{manifest.byCategory[c].total})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search")} />
          <Button variant={apenasPendentes ? "default" : "outline"} onClick={() => setApenasPendentes((v) => !v)}>
            {apenasPendentes ? "A mostrar só pendentes" : "A mostrar tudo"}
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {lista.length} de {manifest.total} textos · manifesto gerado em {new Date(manifest.generatedAt).toLocaleString("pt-PT")} ·
        corre <code>npm run i18n:extract</code> para atualizar.
      </p>

      <div className="space-y-3">
        {lista.slice(0, 200).map((e) => {
          const atual = custom[e.text] ?? e.en ?? "";
          return (
            <Card key={e.text} data-testid="pending-row">
              <CardContent className="grid gap-3 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div>
                  <Badge variant="secondary" className="mb-2">{e.category}</Badge>
                  <p className="font-medium">{e.text}</p>
                  <p className="text-xs text-muted-foreground">{e.file}</p>
                  <p className="text-xs text-muted-foreground">chave sugerida: <code>{e.key}</code></p>
                </div>
                <Input
                  defaultValue={atual}
                  placeholder={`Tradução (${lang}) — vazio mantém o português`}
                  onChange={(ev) => setDraft((d) => ({ ...d, [e.text]: ev.target.value }))}
                />
                <Button onClick={() => guardar(e)}>{t("common.save")}</Button>
              </CardContent>
            </Card>
          );
        })}
        {lista.length === 0 && (
          <p className="text-sm text-muted-foreground">Nada por traduzir com estes filtros.</p>
        )}
      </div>
    </div>
  );
}
