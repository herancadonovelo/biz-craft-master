import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Bell, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { toast } from "sonner";

const TOQUES = [
  { id: "ping", label: "Ping suave", freq: 880 },
  { id: "bell", label: "Sino", freq: 660 },
  { id: "chime", label: "Chime", freq: 1320 },
  { id: "buzz", label: "Buzz", freq: 220 },
];

function playTone(freq: number, ms = 600) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.frequency.value = freq; osc.type = "sine";
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + ms / 1000);
  } catch {}
}

export const Route = createFileRoute("/calendario")({
  head: () => ({ meta: [{ title: "Calendário" }] }),
  component: () => {
    const { eventos, design, add, remove, setDesign } = useStore();
    const [cursor, setCursor] = useState(new Date());
    const [selected, setSelected] = useState(new Date().toISOString().slice(0, 10));
    const [form, setForm] = useState({ titulo: "", hora: "09:00", notas: "", alarmeMinAntes: 15, toque: design.toqueAlarme });

    const days = useMemo(() => {
      const y = cursor.getFullYear(), m = cursor.getMonth();
      const first = new Date(y, m, 1); const last = new Date(y, m + 1, 0);
      const startDow = (first.getDay() + 6) % 7; // semana começa segunda
      const cells: { date: string; inMonth: boolean }[] = [];
      for (let i = 0; i < startDow; i++) {
        const d = new Date(y, m, -startDow + i + 1);
        cells.push({ date: d.toISOString().slice(0, 10), inMonth: false });
      }
      for (let d = 1; d <= last.getDate(); d++) {
        cells.push({ date: new Date(y, m, d).toISOString().slice(0, 10), inMonth: true });
      }
      while (cells.length % 7 !== 0) {
        const next = new Date(cells[cells.length - 1].date); next.setDate(next.getDate() + 1);
        cells.push({ date: next.toISOString().slice(0, 10), inMonth: false });
      }
      return cells;
    }, [cursor]);

    // Alarmes: verifica a cada 30s
    useEffect(() => {
      const tick = () => {
        const now = new Date();
        for (const ev of eventos) {
          if (!ev.alarmeMinAntes || !ev.hora) continue;
          const evDate = new Date(`${ev.data}T${ev.hora}`);
          const alarmAt = new Date(evDate.getTime() - ev.alarmeMinAntes * 60_000);
          const diff = alarmAt.getTime() - now.getTime();
          if (diff > 0 && diff < 30_000) {
            const toque = TOQUES.find((t) => t.id === (ev.toque ?? design.toqueAlarme)) ?? TOQUES[0];
            playTone(toque.freq, 800);
            toast.info(`🔔 ${ev.titulo} em ${ev.alarmeMinAntes}min`);
          }
        }
      };
      const i = window.setInterval(tick, 30_000);
      return () => window.clearInterval(i);
    }, [eventos, design.toqueAlarme]);

    const eventosDia = eventos.filter((e) => e.data === selected).sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));

    return (
      <div className="space-y-6">
        <PageHeader title="Calendário" description="Adiciona eventos e alarmes. O toque pode ser personalizado por evento." />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft /></Button>
              <h3 className="font-display text-lg capitalize">{cursor.toLocaleString("pt-PT", { month: "long", year: "numeric" })}</h3>
              <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight /></Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((d) => {
                const has = eventos.some((e) => e.data === d.date);
                const isSel = d.date === selected;
                return (
                  <button key={d.date} onClick={() => setSelected(d.date)}
                    className={`relative aspect-square rounded-md border text-sm transition ${isSel ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"} ${d.inMonth ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {Number(d.date.slice(-2))}
                    {has && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </CardContent></Card>

          <Card><CardContent className="space-y-3 p-4">
            <h3 className="font-display text-lg">Novo evento · {selected}</h3>
            <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Hora</Label><Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></div>
              <div><Label>Alarme (min antes)</Label><Input type="number" value={form.alarmeMinAntes} onChange={(e) => setForm({ ...form, alarmeMinAntes: +e.target.value })} /></div>
            </div>
            <div><Label>Toque</Label>
              <Select value={form.toque} onValueChange={(v) => setForm({ ...form, toque: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TOQUES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="mt-1" onClick={() => { const t = TOQUES.find((x) => x.id === form.toque)!; playTone(t.freq); }}><Volume2 className="mr-1 h-3 w-3" />Testar</Button>
            </div>
            <div><Label>Notas</Label><Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
            <Button onClick={() => {
              if (!form.titulo) return toast.error("Título obrigatório");
              add("eventos", { ...form, data: selected });
              setForm({ ...form, titulo: "", notas: "" });
              toast.success("Evento criado");
            }}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
            <div className="pt-3 border-t border-border">
              <Label>Toque padrão da aplicação</Label>
              <Select value={design.toqueAlarme} onValueChange={(v) => setDesign({ toqueAlarme: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TOQUES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent></Card>
        </div>

        <Card><CardContent className="p-4">
          <h3 className="mb-3 font-display text-lg">Eventos de {selected}</h3>
          {eventosDia.length === 0 && <p className="text-sm text-muted-foreground">Sem eventos neste dia.</p>}
          <div className="space-y-2">
            {eventosDia.map((e) => (
              <div key={e.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                <Badge variant="outline" className="font-mono">{e.hora ?? "--:--"}</Badge>
                <div className="flex-1">
                  <p className="font-medium">{e.titulo}</p>
                  {e.notas && <p className="text-sm text-muted-foreground">{e.notas}</p>}
                  {e.alarmeMinAntes ? <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary"><Bell className="h-3 w-3" />Alarme {e.alarmeMinAntes}min antes</p> : null}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove("eventos", e.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    );
  },
});