import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Instagram as IGIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/instagram")({
  head: () => ({ meta: [{ title: "Instagram" }] }),
  component: () => {
    const { instagram, add, remove } = useStore();
    const [form, setForm] = useState({ legenda: "", url: "", likes: 0, comentarios: 0, alcance: 0, data: new Date().toISOString().slice(0, 10) });

    const totLikes = instagram.reduce((s, p) => s + p.likes, 0);
    const totAlcance = instagram.reduce((s, p) => s + p.alcance, 0);
    const totCom = instagram.reduce((s, p) => s + p.comentarios, 0);

    return (
      <div className="space-y-6">
        <PageHeader title="Instagram"
          description="Acompanha publicações e estatísticas do teu Instagram (sincronização manual)."
          actions={<Button variant="outline" onClick={() => toast.info("Para ligar o Instagram oficial, guarda os dados em Contas & Passwords. Por agora podes adicionar publicações manualmente.")}><RefreshCw className="mr-1 h-4 w-4" />Sincronizar (manual)</Button>} />

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Posts</p><p className="font-display text-2xl">{instagram.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Likes totais</p><p className="font-display text-2xl">{totLikes}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Alcance total</p><p className="font-display text-2xl">{totAlcance}</p></CardContent></Card>
        </div>

        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-6">
          <div className="md:col-span-3"><Label>Legenda</Label><Textarea rows={2} value={form.legenda} onChange={(e) => setForm({ ...form, legenda: e.target.value })} /></div>
          <div className="md:col-span-3"><Label>URL do post</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://instagram.com/p/…" /></div>
          <div><Label>Likes</Label><Input type="number" value={form.likes} onChange={(e) => setForm({ ...form, likes: +e.target.value })} /></div>
          <div><Label>Comentários</Label><Input type="number" value={form.comentarios} onChange={(e) => setForm({ ...form, comentarios: +e.target.value })} /></div>
          <div><Label>Alcance</Label><Input type="number" value={form.alcance} onChange={(e) => setForm({ ...form, alcance: +e.target.value })} /></div>
          <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
          <div className="md:col-span-6"><Button onClick={() => {
            if (!form.legenda) return toast.error("Legenda obrigatória");
            add("instagram", form); setForm({ legenda: "", url: "", likes: 0, comentarios: 0, alcance: 0, data: new Date().toISOString().slice(0, 10) });
            toast.success("Post adicionado");
          }}><Plus className="mr-1 h-4 w-4" />Registar post</Button></div>
        </CardContent></Card>

        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Legenda</TableHead><TableHead>Likes</TableHead><TableHead>Coment.</TableHead><TableHead>Alcance</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {instagram.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.data}</TableCell>
                  <TableCell className="max-w-xs truncate">{p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary"><IGIcon className="h-3 w-3" />{p.legenda}</a> : p.legenda}</TableCell>
                  <TableCell>{p.likes}</TableCell>
                  <TableCell>{p.comentarios}</TableCell>
                  <TableCell>{p.alcance}</TableCell>
                  <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => remove("instagram", p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {instagram.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem posts ainda.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
  },
});