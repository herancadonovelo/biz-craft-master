import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, Trash2, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InspirationCard } from "@/components/InspirationCard";
import { useFrases, todasFrases } from "@/lib/frases-store";
import { CATEGORIA_LABEL, TAGS_FILTRO, type FraseCategoria } from "@/lib/frases";
import { toast } from "sonner";

export const Route = createFileRoute("/mural")({
  head: () => ({
    meta: [
      { title: "Mural de Inspiração — Atelier" },
      { name: "description", content: "Descobre, guarda e cria as tuas frases motivacionais para o atelier." },
    ],
  }),
  component: MuralPage,
});

function MuralPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mural de Inspiração"
        description="Gira a sorte, guarda favoritas e cria as tuas próprias frases."
      />
      <Tabs defaultValue="girar">
        <TabsList>
          <TabsTrigger value="girar">Girar a Sorte</TabsTrigger>
          <TabsTrigger value="favoritas">As Minhas Favoritas</TabsTrigger>
          <TabsTrigger value="criar">Criar Inspiração</TabsTrigger>
        </TabsList>
        <TabsContent value="girar" className="mt-6">
          <InspirationCard variant="hero" />
        </TabsContent>
        <TabsContent value="favoritas" className="mt-6">
          <FavoritasTab />
        </TabsContent>
        <TabsContent value="criar" className="mt-6">
          <CriarTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FavoritasTab() {
  const state = useFrases();
  const [filtro, setFiltro] = useState<"todas" | FraseCategoria>("todas");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const lista = useMemo(() => {
    const all = todasFrases(state.custom).filter((f) => state.favoritas.includes(f.id));
    return filtro === "todas" ? all : all.filter((f) => f.categoria === filtro);
  }, [state.favoritas, state.custom, filtro]);

  const copiar = async (texto: string, id: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiedId(id);
      toast.success("Copiada!");
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TAGS_FILTRO.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={filtro === t.key ? "default" : "outline"}
            onClick={() => setFiltro(t.key)}
            className="rounded-full"
          >
            {t.label}
          </Button>
        ))}
      </div>
      {lista.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Ainda não tens favoritas nesta categoria. Marca um coração na aba "Girar a Sorte".
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lista.map((f) => (
            <Card key={f.id} className="rounded-2xl border-pink-200/60 bg-gradient-to-br from-[#FFF7F8] to-white">
              <CardContent className="p-5">
                <Badge variant="secondary" className="mb-2 text-[10px]">
                  {CATEGORIA_LABEL[f.categoria]}
                </Badge>
                <p
                  className="text-[1.4rem] text-stone-700 leading-snug font-sans"
                  style={{ fontWeight: 600 }}
                >
                  <span className="mr-2">{f.emojis}</span>
                  {f.texto}
                  <span className="ml-2">{f.emojis}</span>
                </p>
                <div className="mt-3 flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => copiar(`${f.emojis} ${f.texto} ${f.emojis}`, f.id)}
                  >
                    {copiedId === f.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-rose-500"
                    onClick={() => state.toggleFavorita(f.id)}
                    title="Remover dos favoritos"
                  >
                    <Heart className="h-4 w-4 fill-rose-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CriarTab() {
  const state = useFrases();
  const [texto, setTexto] = useState("");
  const [emojis, setEmojis] = useState("✨");
  const [categoria, setCategoria] = useState<FraseCategoria>("geral");

  const guardar = () => {
    const t = texto.trim();
    if (!t) {
      toast.error("Escreve uma frase antes de guardar.");
      return;
    }
    const e = emojis.trim() || "✨";
    state.adicionarCustom({ texto: t, emojis: e, categoria });
    toast.success("Frase guardada no teu mural!");
    setTexto("");
    setEmojis("✨");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="frase">A tua frase</Label>
            <Textarea
              id="frase"
              rows={4}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex: O meu atelier é o meu refúgio favorito."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="emojis">Emojis (1–2)</Label>
              <Input
                id="emojis"
                value={emojis}
                onChange={(e) => setEmojis(e.target.value)}
                placeholder="✨ 🧶"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as FraseCategoria)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIA_LABEL) as FraseCategoria[]).map((k) => (
                    <SelectItem key={k} value={k}>{CATEGORIA_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={guardar} className="w-full rounded-full bg-rose-500 hover:bg-rose-600">
            Guardar no Meu Mural
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
          As tuas frases ({state.custom.length})
        </h3>
        {state.custom.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não criaste nenhuma. Começa pela primeira!</p>
        )}
        {state.custom.map((f) => (
          <Card key={f.id} className="rounded-2xl border-pink-200/40">
            <CardContent className="flex items-start gap-3 p-4">
              <p
                className="flex-1 text-[1.25rem] text-stone-700 font-sans"
                style={{ fontWeight: 600 }}
              >
                <span className="mr-1">{f.emojis}</span>
                {f.texto}
              </p>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-rose-500"
                onClick={() => state.removerCustom(f.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}