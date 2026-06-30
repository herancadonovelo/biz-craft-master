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
  { name: "Marfim", v: "0.96 0.015 85" },
  { name: "Azul céu", v: "0.92 0.03 230" },
  { name: "Verde menta", v: "0.92 0.04 160" },
  { name: "Lavanda", v: "0.9 0.04 290" },
  { name: "Pêssego", v: "0.91 0.05 55" },
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
              <div>
                <Label className="text-xs text-muted-foreground">Presets rápidos para a categoria ativa</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { n: "Azul-acinzentado", bg: "#475569", fg: "#FFFFFF" },
                    { n: "Âmbar", bg: "#F59E0B", fg: "#1F2937" },
                    { n: "Rosa", bg: "#EC4899", fg: "#FFFFFF" },
                    { n: "Verde menta", bg: "#10B981", fg: "#052E2B" },
                    { n: "Violeta", bg: "#8B5CF6", fg: "#FFFFFF" },
                    { n: "Coral", bg: "#FB7185", fg: "#3B0A1A" },
                    { n: "Dourado", bg: "#EAB308", fg: "#1F2937" },
                    { n: "Grafite", bg: "#1F2937", fg: "#F9FAFB" },
                    { n: "Marfim", bg: "#FAF7F0", fg: "#1F2937" },
                  ].map((p) => (
                    <button
                      key={p.n}
                      onClick={() => setDesign({ corMenuAtivo: p.bg, corMenuAtivoTexto: p.fg })}
                      className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs"
                      style={{ background: p.bg, color: p.fg, borderColor: p.fg + "33" }}
                    >
                      <span className="h-3 w-3 rounded-full border" style={{ background: p.bg, borderColor: p.fg + "55" }} />
                      {p.n}
                    </button>
                  ))}
                  <Button size="sm" variant="ghost" onClick={() => setDesign({ corMenuAtivo: "", corMenuAtivoTexto: "" })}>Repor</Button>
                </div>
              </div>
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
          <Card>
            <CardHeader><CardTitle className="font-display">Cores gerais (janelas, botões, fundos)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ColorRow label="Cor de fundo das páginas" value={design.corFundo} onChange={(v) => setDesign({ corFundo: v })} />
              <ColorRow label="Cor das janelas/cards" value={design.corCard} onChange={(v) => setDesign({ corCard: v })} />
              <ColorRow label="Cor das bordas" value={design.corBorda} onChange={(v) => setDesign({ corBorda: v })} />
              <ColorRow label="Cor de áreas suaves (muted)" value={design.corMuted} onChange={(v) => setDesign({ corMuted: v })} />
              <ColorRow label="Cor dos botões primários" value={design.corBotao} onChange={(v) => setDesign({ corBotao: v })} />
              <ColorRow label="Cor do texto dos botões" value={design.corBotaoTexto} onChange={(v) => setDesign({ corBotaoTexto: v })} />
              <p className="text-xs text-muted-foreground">Aplica-se a toda a app. Deixa vazio para usar o padrão.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Tamanhos de letra</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Base global: {design.fontSizeBase ?? 16}px</Label>
                <Slider value={[design.fontSizeBase ?? 16]} min={12} max={22} step={1} onValueChange={([v]) => setDesign({ fontSizeBase: v })} />
              </div>
              <div>
                <Label>Títulos: {design.fontSizeTitulos ?? 20}px</Label>
                <Slider value={[design.fontSizeTitulos ?? 20]} min={14} max={40} step={1} onValueChange={([v]) => setDesign({ fontSizeTitulos: v })} />
              </div>
              <div>
                <Label>Texto: {design.fontSizeTexto ?? 14}px</Label>
                <Slider value={[design.fontSizeTexto ?? 14]} min={10} max={22} step={1} onValueChange={([v]) => setDesign({ fontSizeTexto: v })} />
              </div>
              <div>
                <Label>Menu lateral: {design.fontSizeMenu ?? 14}px</Label>
                <Slider value={[design.fontSizeMenu ?? 14]} min={10} max={20} step={1} onValueChange={([v]) => setDesign({ fontSizeMenu: v })} />
              </div>
              <div>
                <Label>Abas: {design.fontSizeAbas ?? 14}px</Label>
                <Slider value={[design.fontSizeAbas ?? 14]} min={10} max={20} step={1} onValueChange={([v]) => setDesign({ fontSizeAbas: v })} />
              </div>
              <Button variant="outline" size="sm" onClick={() => setDesign({ fontSizeBase: 16, fontSizeTitulos: 20, fontSizeTexto: 14, fontSizeMenu: 14, fontSizeAbas: 14 })}>Repor padrão</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Caixas de aviso / alertas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Personaliza a cor de fundo e do texto das caixas de aviso (ex.: ecrã de "Sessão expirada"). Funciona com tons claros ou escuros.</p>
              <ColorRow label="Cor de fundo do alerta" value={design.corAlertaFundo} onChange={(v) => setDesign({ corAlertaFundo: v })} />
              <ColorRow label="Cor do texto do alerta" value={design.corAlertaTexto} onChange={(v) => setDesign({ corAlertaTexto: v })} />
              <div className="rounded-md border p-3 text-sm" style={{ background: design.corAlertaFundo || undefined, color: design.corAlertaTexto || undefined, borderColor: design.corAlertaTexto ? `${design.corAlertaTexto}33` : undefined }}>
                ⚠️ Pré-visualização: este é o aspeto das caixas de aviso na aplicação.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setDesign({ corAlertaFundo: "#FEF3C7", corAlertaTexto: "#78350F" })}>Âmbar (claro)</Button>
                <Button size="sm" variant="outline" onClick={() => setDesign({ corAlertaFundo: "#FEE2E2", corAlertaTexto: "#7F1D1D" })}>Rosa (claro)</Button>
                <Button size="sm" variant="outline" onClick={() => setDesign({ corAlertaFundo: "#DBEAFE", corAlertaTexto: "#1E3A8A" })}>Azul (claro)</Button>
                <Button size="sm" variant="outline" onClick={() => setDesign({ corAlertaFundo: "#1F2937", corAlertaTexto: "#FDE68A" })}>Grafite (escuro)</Button>
                <Button size="sm" variant="outline" onClick={() => setDesign({ corAlertaFundo: "#0B1220", corAlertaTexto: "#E5E7EB" })}>Noite (escuro)</Button>
                <Button size="sm" variant="ghost" onClick={() => setDesign({ corAlertaFundo: "", corAlertaTexto: "" })}>Repor</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  },
});