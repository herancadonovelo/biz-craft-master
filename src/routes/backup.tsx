import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import JSZip from "jszip";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileJson, FileSpreadsheet, CloudDownload, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCSV(rows: any[]): string {
  if (!rows || rows.length === 0) return "";
  const cols = Array.from(rows.reduce((s: Set<string>, r) => { Object.keys(r ?? {}).forEach((k) => s.add(k)); return s; }, new Set<string>()));
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export const Route = createFileRoute("/backup")({
  head: () => ({ meta: [{ title: "Backup & Restauro" }] }),
  component: BackupPage,
});

function BackupPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const buildSnapshot = async () => {
    if (user) {
      const { data, error } = await supabase.from("app_state").select("state,updated_at").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return { source: "cloud" as const, state: (data?.state as any) ?? {}, updated_at: data?.updated_at ?? null };
    }
    const { _hasHydrated, ...state } = useStore.getState() as any;
    const clean: any = {};
    for (const [k, v] of Object.entries(state)) if (typeof v !== "function") clean[k] = v;
    return { source: "local" as const, state: clean, updated_at: new Date().toISOString() };
  };

  const exportJSON = async () => {
    setBusy("json");
    try {
      const snap = await buildSnapshot();
      const payload = { app: "atelier-tricotin", version: 1, exported_at: new Date().toISOString(), user_id: user?.id ?? null, ...snap };
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      download(`backup-${ts}.json`, new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      toast.success("Backup JSON descarregado");
    } catch (e: any) { toast.error(e.message || "Falha ao exportar"); }
    finally { setBusy(null); }
  };

  const exportCSV = async () => {
    setBusy("csv");
    try {
      const snap = await buildSnapshot();
      const zip = new JSZip();
      let count = 0;
      for (const [key, val] of Object.entries(snap.state)) {
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
          zip.file(`${key}.csv`, toCSV(val as any[]));
          count++;
        } else {
          zip.file(`_singletons/${key}.json`, JSON.stringify(val ?? null, null, 2));
        }
      }
      zip.file("manifest.json", JSON.stringify({ exported_at: new Date().toISOString(), user_id: user?.id ?? null, collections: count }, null, 2));
      const blob = await zip.generateAsync({ type: "blob" });
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      download(`backup-csv-${ts}.zip`, blob);
      toast.success(`Zip com ${count} coleções CSV gerado`);
    } catch (e: any) { toast.error(e.message || "Falha ao exportar"); }
    finally { setBusy(null); }
  };

  const restoreJSON = async (file: File) => {
    if (!confirm("Restaurar vai SUBSTITUIR todos os dados atuais pela cópia do ficheiro. Continuar?")) return;
    setBusy("restore");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const state = parsed.state ?? parsed;
      if (!state || typeof state !== "object") throw new Error("Ficheiro inválido");
      useStore.setState(state as any);
      if (user) {
        const { error } = await supabase.from("app_state").upsert({ user_id: user.id, state });
        if (error) throw error;
      }
      toast.success("Dados restaurados com sucesso");
    } catch (e: any) { toast.error(e.message || "Falha ao restaurar"); }
    finally { setBusy(null); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Backup & Restauro" description="Exporta tudo o que está associado à tua conta em JSON ou CSV e restaura quando precisares." />

      {!user && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
            <div>Não estás autenticado — o backup será feito a partir dos dados locais deste navegador. Para garantir a cópia da nuvem, inicia sessão.</div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" /><h3 className="font-display text-lg">Exportar JSON</h3></div>
            <p className="text-sm text-muted-foreground">Um único ficheiro com todas as coleções (clientes, materiais, projetos, faturas, etc.). Ideal para restauro completo.</p>
            <Button onClick={exportJSON} disabled={!!busy}>
              {busy === "json" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Descarregar .json
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /><h3 className="font-display text-lg">Exportar CSV (zip)</h3></div>
            <p className="text-sm text-muted-foreground">Um CSV por coleção dentro de um zip — útil para abrir no Excel/Sheets ou migrar para outras ferramentas.</p>
            <Button onClick={exportCSV} disabled={!!busy} variant="secondary">
              {busy === "csv" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}Descarregar .zip
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /><h3 className="font-display text-lg">Restaurar a partir de JSON</h3></div>
          <p className="text-sm text-muted-foreground">
            Seleciona um ficheiro de backup <code>.json</code> previamente exportado. Isto irá <strong>substituir</strong> todos os dados atuais
            {user ? " (locais e na tua conta na nuvem)" : " locais"}.
          </p>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) restoreJSON(f); }} />
          <Button variant="destructive" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            {busy === "restore" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Escolher ficheiro…
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}