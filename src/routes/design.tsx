import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ImagePicker } from "@/components/ImagePicker";

const ACCENTS = [
  { name: "Steel blue", v: "0.72 0.06 230" },
  { name: "Sage", v: "0.7 0.08 160" },
  { name: "Amber", v: "0.78 0.13 75" },
  { name: "Rose", v: "0.7 0.16 15" },
  { name: "Violet", v: "0.65 0.15 290" },
];

const SIDEBAR_COLORS = [
  { name: "Grafite", v: "0.25 0.025 258" },
  { name: "Noite", v: "0.18 0.02 258" },
  { name: "Carvão", v: "0.22 0.005 0" },
  { name: "Azul escuro", v: "0.3 0.06 250" },
  { name: "Verde musgo", v: "0.32 0.05 160" },
  { name: "Vinho", v: "0.3 0.08 20" },
  { name: "Roxo", v: "0.3 0.08 290" },
  { name: "Creme", v: "0.94 0.02 90" },
  { name: "Pérola", v: "0.9 0.01 250" },
  { name: "Rosa claro", v: "0.88 0.04 15" },
];

const FONTS = [
  { name: "Sora", v: "Sora, system-ui, sans-serif" },
  { name: "Manrope", v: "Manrope, system-ui, sans-serif" },
  { name: "Quicksand", v: "Quicksand, system-ui, sans-serif" },
  { name: "Caveat", v: "Caveat, cursive" },
  { name: "Sistema", v: "system-ui, sans-serif" },
  { name: "Serifa", v: "Georgia, 'Times New Roman', serif" },
  { name: "Mono", v: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

function FontPicker({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <select className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        {FONTS.map((f) => <option key={f.v} value={f.v} style={{ fontFamily: f.v }}>{f.name}</option>)}
      </select>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Label className="flex-1">{label}</Label>
      <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-12 cursor-pointer rounded border" />
      {value && <Button size="sm" variant="ghost" onClick={() => onChange("")}>Limpar</Button>}
    </div>
  );
}

export const Route = createFileRoute("/design")({
  head: () => ({ meta: [{ title: "Personalização do design" }] }),
  component: () => {
    const { design, setDesign } = useStore();
    return (
      <div className="space-y-6">
        <PageHeader title="Personalização do design" description="Adapta a aparência da aplicação ao teu gosto." />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="font-display">Marca</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Nome do negócio</Label><Input value={design.nomeNegocio} onChange={(e) => setDesign({ nomeNegocio: e.target.value })} /></div>
              <div>
                <Label>Preço-hora base (€)</Label>
                <Input type="number" min={0} step={0.5} value={design.precoHoraBase}
                  onChange={(e) => setDesign({ precoHoraBase: Number(e.target.value) || 0 })} />
                <p className="mt-1 text-xs text-muted-foreground">Usado por defeito em novos projetos e na calculadora.</p>
              </div>
              <div>
                <Label>Modo</Label>
                <div className="mt-1 flex gap-2">
                  <Button variant={design.modo === "light" ? "default" : "outline"} onClick={() => setDesign({ modo: "light" })}>Claro</Button>
                  <Button variant={design.modo === "dark" ? "default" : "outline"} onClick={() => setDesign({ modo: "dark" })}>Escuro</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Cor de destaque</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-5 gap-3">
              {ACCENTS.map((a) => (
                <button key={a.name} onClick={() => setDesign({ accent: a.v })}
                  className={`flex flex-col items-center gap-1 rounded-md border p-2 ${design.accent === a.v ? "border-foreground" : "border-border"}`}>
                  <div className="h-10 w-10 rounded-full" style={{ background: `oklch(${a.v})` }} />
                  <span className="text-xs">{a.name}</span>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Cor do menu lateral</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-5 gap-3">
              {SIDEBAR_COLORS.map((a) => (
                <button key={a.name} onClick={() => setDesign({ sidebarBg: a.v })}
                  className={`flex flex-col items-center gap-1 rounded-md border p-2 ${design.sidebarBg === a.v ? "border-foreground" : "border-border"}`}>
                  <div className="h-10 w-10 rounded-full border" style={{ background: `oklch(${a.v})` }} />
                  <span className="text-xs">{a.name}</span>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Cantos arredondados</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label>Raio: {design.raio.toFixed(2)}rem</Label>
              <Slider value={[design.raio]} min={0} max={1.5} step={0.05} onValueChange={([v]) => setDesign({ raio: v })} />
              <div className="flex gap-3">
                <div className="h-16 w-16 bg-primary" style={{ borderRadius: `${design.raio}rem` }} />
                <div className="h-16 w-24 bg-accent" style={{ borderRadius: `${design.raio}rem` }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Pré-visualização</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button>Botão primário</Button>
              <Button variant="outline">Botão outline</Button>
              <Button variant="secondary">Secundário</Button>
              <div className="rounded-md border border-border bg-card p-4 text-sm">Card de exemplo com o teu design aplicado.</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Imagem de fundo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Aparece como fundo no interior de todas as categorias.</p>
              <div className="flex items-center gap-3">
                <ImagePicker value={design.imagemFundo} onChange={(v) => setDesign({ imagemFundo: v })} size="h-24 w-32" />
                {design.imagemFundo && (
                  <Button variant="outline" size="sm" onClick={() => setDesign({ imagemFundo: "" })}>Remover</Button>
                )}
              </div>
              <div>
                <Label>Intensidade do véu (opacidade do conteúdo sobre a imagem): {Math.round((design.fundoOpacidade ?? 0.85) * 100)}%</Label>
                <Slider value={[design.fundoOpacidade ?? 0.85]} min={0} max={1} step={0.05} onValueChange={([v]) => setDesign({ fundoOpacidade: v })} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Tipografia & cores de texto</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <FontPicker label="Tipo de letra dos títulos" value={design.fonteTitulos} onChange={(v) => setDesign({ fonteTitulos: v })} />
              <ColorRow label="Cor dos títulos" value={design.corTitulos} onChange={(v) => setDesign({ corTitulos: v })} />
              <FontPicker label="Tipo de letra do texto" value={design.fonteTexto} onChange={(v) => setDesign({ fonteTexto: v })} />
              <ColorRow label="Cor do texto" value={design.corTexto} onChange={(v) => setDesign({ corTexto: v })} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Menu lateral</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <FontPicker label="Tipo de letra do menu" value={design.fonteMenu} onChange={(v) => setDesign({ fonteMenu: v })} />
              <ColorRow label="Cor dos itens do menu" value={design.corMenu} onChange={(v) => setDesign({ corMenu: v })} />
              <ColorRow label="Cor de fundo da categoria ativa" value={design.corMenuAtivo} onChange={(v) => setDesign({ corMenuAtivo: v })} />
              <ColorRow label="Cor do texto da categoria ativa" value={design.corMenuAtivoTexto} onChange={(v) => setDesign({ corMenuAtivoTexto: v })} />
              <p className="text-xs text-muted-foreground">A categoria selecionada mantém-se destacada enquanto navegas dentro dela.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Abas (Tabs)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <FontPicker label="Tipo de letra das abas" value={design.fonteAbas} onChange={(v) => setDesign({ fonteAbas: v })} />
              <ColorRow label="Cor das abas" value={design.corAbas} onChange={(v) => setDesign({ corAbas: v })} />
              <ColorRow label="Cor da aba ativa" value={design.corAbaAtiva} onChange={(v) => setDesign({ corAbaAtiva: v })} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  },
});