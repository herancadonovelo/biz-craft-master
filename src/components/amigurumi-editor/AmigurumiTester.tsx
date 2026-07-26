import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Link2, Trash2, Check, Download, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  buildShareUrl, gerarToken, listComentarios, savePacote,
  toggleResolvido, removerComentario, exportComentariosJSON,
  importComentariosJSON, type TesterPacote, type TesterComentario,
} from "@/lib/amigurumi/tester";

const TOKEN_KEY = "amigurumi-tester-token-v1";

export function AmigurumiTester({
  estado,
  titulo,
  autor,
  pecas,
}: {
  estado: unknown;
  titulo: string;
  autor: string;
  pecas: { id: string; nome: string }[];
}) {
  const [token, setToken] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [coments, setComents] = useState<TesterComentario[]>([]);
  const [tick, setTick] = useState(0);

  // carrega token guardado
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (t) setToken(t);
  }, []);

  // gera novo pacote sempre que o estado ou o token mudam
  useEffect(() => {
    if (!token) return;
    const pacote: TesterPacote = {
      token,
      titulo: titulo || "Receita sem título",
      autor: autor || "",
      criadoEm: Date.now(),
      estado,
    };
    savePacote(pacote);
    setShareUrl(buildShareUrl(pacote));
  }, [token, estado, titulo, autor]);

  // refresh dos comentários
  useEffect(() => {
    if (!token) { setComents([]); return; }
    setComents(listComentarios(token));
  }, [token, tick]);

  const pecaNome = useMemo(() => {
    const m = new Map(pecas.map((p) => [p.id, p.nome]));
    return (id: string) => m.get(id) || "(peça removida)";
  }, [pecas]);

  const criarLink = () => {
    const t = gerarToken();
    setToken(t);
    try { window.localStorage.setItem(TOKEN_KEY, t); } catch {}
    toast.success("Link de tester gerado");
  };

  const revogar = () => {
    if (!token) return;
    if (!confirm("Revogar link? Testers perderão acesso e os comentários locais serão apagados.")) return;
    try {
      window.localStorage.removeItem(`amig-tester:${token}`);
      window.localStorage.removeItem(`amig-tester-comments:${token}`);
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken("");
    setShareUrl("");
    setComents([]);
    toast.success("Link revogado");
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado");
    } catch { toast.error("Não foi possível copiar"); }
  };

  const importar = async () => {
    const json = prompt("Cola aqui o JSON de comentários do tester:");
    if (!json) return;
    const n = importComentariosJSON(token, json);
    setTick((x) => x + 1);
    toast.success(`${n} comentário(s) importado(s)`);
  };

  const exportar = () => {
    const blob = new Blob([exportComentariosJSON(token)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `comentarios-${token}.json`;
    a.click();
  };

  const abertos = coments.filter((c) => !c.resolvido);
  const resolvidos = coments.filter((c) => c.resolvido);

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
      <Card className="!bg-white/100 opacity-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Partilha com testers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!token ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Gera um link único para que testers abram a receita, comentem carreira a carreira
                e devolvam correções. Nada é publicado — o link é privado.
              </p>
              <Button onClick={criarLink}>
                <Link2 className="mr-1 h-4 w-4" /> Gerar link de tester
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Label>Link partilhável</Label>
                <div className="flex gap-1">
                  <Input readOnly value={shareUrl} className="font-mono text-xs" />
                  <Button size="sm" variant="outline" onClick={copiar}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Token: <span className="font-mono">{token}</span> · o snapshot atualiza automaticamente ao editar.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setTick((x) => x + 1)}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Atualizar comentários
                </Button>
                <Button size="sm" variant="outline" onClick={importar}>
                  <Upload className="mr-1 h-3.5 w-3.5" /> Importar JSON
                </Button>
                <Button size="sm" variant="outline" onClick={exportar} disabled={coments.length === 0}>
                  <Download className="mr-1 h-3.5 w-3.5" /> Exportar JSON
                </Button>
                <Button size="sm" variant="ghost" onClick={revogar} className="text-destructive">
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Revogar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Correções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 text-xs">
            <Badge variant="secondary">Abertas: {abertos.length}</Badge>
            <Badge variant="outline">Resolvidas: {resolvidos.length}</Badge>
          </div>
          {coments.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Sem comentários ainda. Partilha o link ou importa um JSON exportado por um tester.
            </p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-auto">
              {[...abertos, ...resolvidos].map((c) => (
                <li key={c.id} className={`rounded border p-2 text-xs ${c.resolvido ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <strong>{c.autor || "Tester"}</strong>
                    <span className="text-muted-foreground">
                      {pecaNome(c.pecaId)} · carreira {c.carreiraIndex + 1}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{c.texto}</p>
                  <div className="mt-1 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { toggleResolvido(token, c.id); setTick((x) => x + 1); }}>
                      <Check className="mr-1 h-3 w-3" /> {c.resolvido ? "Reabrir" : "Resolver"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { removerComentario(token, c.id); setTick((x) => x + 1); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================ */
/*  Vista do tester (usada pela rota pública /receita-tester)   */
/* ============================================================ */

export function AmigurumiTesterView({ token, hashData }: { token: string; hashData?: string }) {
  const [pacote, setPacote] = useState<TesterPacote | null>(null);
  const [coments, setComents] = useState<TesterComentario[]>([]);
  const [nome, setNome] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("amig-tester-nome") || "";
  });

  useEffect(() => {
    import("@/lib/amigurumi/tester").then((m) => {
      setPacote(m.loadPacote(token, hashData));
      setComents(m.listComentarios(token));
    });
  }, [token, hashData]);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("amig-tester-nome", nome);
  }, [nome]);

  if (!pacote) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Este link de tester expirou ou não é válido neste dispositivo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const estado = pacote.estado as {
    titulo?: string; autor?: string; intro?: string;
    pecas?: { id: string; nome: string; carreiras: { id: string; texto: string }[] }[];
  };
  const pecas = estado.pecas || [];

  const comentar = (pecaId: string, idx: number, texto: string) => {
    if (!texto.trim()) return;
    import("@/lib/amigurumi/tester").then((m) => {
      m.addComentario(token, { pecaId, carreiraIndex: idx, autor: nome, texto: texto.trim() });
      setComents(m.listComentarios(token));
      toast.success("Comentário adicionado");
    });
  };

  const exportar = () => {
    import("@/lib/amigurumi/tester").then((m) => {
      const blob = new Blob([m.exportComentariosJSON(token)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `comentarios-${token}.json`;
      a.click();
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display">{estado.titulo || pacote.titulo}</CardTitle>
          <p className="text-xs text-muted-foreground">por {estado.autor || pacote.autor || "—"}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {estado.intro && <p className="text-sm whitespace-pre-wrap">{estado.intro}</p>}
          <div className="flex flex-wrap items-end gap-2">
            <div className="grow">
              <Label className="text-xs">O teu nome (aparece nos comentários)</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Ana" />
            </div>
            <Button size="sm" variant="outline" onClick={exportar} disabled={coments.length === 0}>
              <Download className="mr-1 h-3.5 w-3.5" /> Exportar comentários
            </Button>
          </div>
        </CardContent>
      </Card>

      {pecas.map((p) => (
        <Card key={p.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display">{p.nome}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {p.carreiras.length === 0 && (
              <p className="text-xs text-muted-foreground">Sem carreiras.</p>
            )}
            {p.carreiras.map((c, i) => {
              const meus = coments.filter((x) => x.pecaId === p.id && x.carreiraIndex === i);
              return (
                <CarreiraTesterRow
                  key={c.id}
                  index={i}
                  texto={c.texto}
                  coments={meus}
                  onComentar={(t) => comentar(p.id, i, t)}
                />
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CarreiraTesterRow({
  index, texto, coments, onComentar,
}: {
  index: number; texto: string; coments: TesterComentario[];
  onComentar: (t: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [txt, setTxt] = useState("");
  return (
    <div className="rounded border p-2">
      <div className="flex items-start gap-2">
        <Badge variant="outline" className="mt-0.5 shrink-0">C{index + 1}</Badge>
        <div className="grow font-mono text-sm">{texto || <span className="text-muted-foreground italic">(vazia)</span>}</div>
        <Button size="sm" variant="ghost" onClick={() => setAberto((x) => !x)}>
          {coments.length > 0 ? `${coments.length} comentário(s)` : "Comentar"}
        </Button>
      </div>
      {aberto && (
        <div className="mt-2 space-y-2 pl-8">
          {coments.map((c) => (
            <div key={c.id} className={`rounded bg-muted/40 p-2 text-xs ${c.resolvido ? "opacity-60 line-through" : ""}`}>
              <strong>{c.autor || "Tester"}</strong>: {c.texto}
            </div>
          ))}
          <div className="flex gap-1">
            <Textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={2} placeholder="Descreve o erro ou sugestão…" />
            <Button size="sm" onClick={() => { onComentar(txt); setTxt(""); }}>Enviar</Button>
          </div>
        </div>
      )}
    </div>
  );
}