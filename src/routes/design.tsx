import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const ACCENTS = [
  { name: "Steel blue", v: "0.72 0.06 230" },
  { name: "Sage", v: "0.7 0.08 160" },
  { name: "Amber", v: "0.78 0.13 75" },
  { name: "Rose", v: "0.7 0.16 15" },
  { name: "Violet", v: "0.65 0.15 290" },
];

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
        </div>
      </div>
    );
  },
});