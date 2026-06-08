import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RefreshCw, Link as LinkIcon, Users } from "lucide-react";
import { toast } from "sonner";

function readImage(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/cursos")({
  head: () => ({ meta: [{ title: "Cursos" }] }),
  component: () => {
    const { cursos, alunos, add, remove } = useStore();
    const [form, setForm] = useState({ nome: "", descricao: "", preco: 0, linkCompra: "", grupos: "", paginas: "", imagem: "" });
    const [alunoForm, setAlunoForm] = useState({ cursoId: cursos[0]?.id ?? "", nome: "", email: "", moduloAtual: "Módulo 1" });

    return (
      <div className="space-y-6">
        <PageHeader title="Cursos"
          description={`${cursos.length} cursos · ${alunos.length} alunos.`}
          actions={<Button variant="outline" onClick={() => toast.info("Sincronização manual: liga a tua plataforma de cursos em Contas & Passwords e importa lista de alunos por CSV.")}><RefreshCw className="mr-1 h-4 w-4" />Sincronizar (manual)</Button>} />

        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div><Label>Nome do curso</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Preço (€)</Label><Input type="number" value={form.preco} onChange={(e) => setForm({ ...form, preco: +e.target.value })} /></div>
          <div><Label>Link de compra</Label><Input value={form.linkCompra} onChange={(e) => setForm({ ...form, linkCompra: e.target.value })} placeholder="https://" /></div>
          <div className="md:col-span-3"><Label>Descrição</Label><Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          <div><Label>Grupos</Label><Input value={form.grupos} onChange={(e) => setForm({ ...form, grupos: e.target.value })} placeholder="Facebook, WhatsApp…" /></div>
          <div><Label>Páginas do curso</Label><Input value={form.paginas} onChange={(e) => setForm({ ...form, paginas: e.target.value })} placeholder="URLs" /></div>
          <div><Label>Imagem</Label><Input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setForm({ ...form, imagem: await readImage(f) }); }} /></div>
          <div className="md:col-span-3"><Button onClick={() => {
            if (!form.nome) return toast.error("Nome obrigatório");
            add("cursos", form); setForm({ nome: "", descricao: "", preco: 0, linkCompra: "", grupos: "", paginas: "", imagem: "" });
            toast.success("Curso criado");
          }}><Plus className="mr-1 h-4 w-4" />Criar curso</Button></div>
        </CardContent></Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cursos.map((c) => {
            const seusAlunos = alunos.filter((a) => a.cursoId === c.id);
            return (
              <Card key={c.id} className="overflow-hidden">
                {c.imagem && <img src={c.imagem} alt={c.nome} className="h-32 w-full object-cover" />}
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-display font-semibold">{c.nome}</h3>
                    <Button size="icon" variant="ghost" onClick={() => remove("cursos", c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  {c.descricao && <p className="text-sm text-muted-foreground">{c.descricao}</p>}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{formatEUR(c.preco)}</Badge>
                    <Badge variant="outline"><Users className="mr-1 h-3 w-3" />{seusAlunos.length} alunos</Badge>
                    {c.linkCompra && <a href={c.linkCompra} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline"><LinkIcon className="h-3 w-3" />comprar</a>}
                  </div>
                  {c.grupos && <p className="text-xs"><b>Grupos:</b> {c.grupos}</p>}
                  {c.paginas && <p className="text-xs"><b>Páginas:</b> {c.paginas}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card><CardContent className="space-y-3 p-4">
          <h3 className="font-display text-lg">Inscrever aluno</h3>
          <div className="grid gap-3 md:grid-cols-4">
            <Select value={alunoForm.cursoId} onValueChange={(v) => setAlunoForm({ ...alunoForm, cursoId: v })}>
              <SelectTrigger><SelectValue placeholder="Curso" /></SelectTrigger>
              <SelectContent>{cursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Nome do aluno" value={alunoForm.nome} onChange={(e) => setAlunoForm({ ...alunoForm, nome: e.target.value })} />
            <Input placeholder="Email" value={alunoForm.email} onChange={(e) => setAlunoForm({ ...alunoForm, email: e.target.value })} />
            <Input placeholder="Módulo atual" value={alunoForm.moduloAtual} onChange={(e) => setAlunoForm({ ...alunoForm, moduloAtual: e.target.value })} />
          </div>
          <Button onClick={() => {
            if (!alunoForm.cursoId || !alunoForm.nome) return toast.error("Curso e nome obrigatórios");
            add("alunos", { ...alunoForm, inscritoEm: new Date().toISOString() });
            setAlunoForm({ ...alunoForm, nome: "", email: "" });
            toast.success("Aluno inscrito");
          }}><Plus className="mr-1 h-4 w-4" />Inscrever</Button>
        </CardContent></Card>

        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Curso</TableHead><TableHead>Módulo atual</TableHead><TableHead>Email</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {alunos.map((a) => {
                const c = cursos.find((x) => x.id === a.cursoId);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell>{c?.nome ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{a.moduloAtual}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{a.email}</TableCell>
                    <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => remove("alunos", a.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
              {alunos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem alunos inscritos.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
  },
});