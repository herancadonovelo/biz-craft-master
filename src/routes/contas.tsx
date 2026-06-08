import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Eye, EyeOff, Trash2, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contas")({
  head: () => ({ meta: [{ title: "Contas & Passwords" }] }),
  component: () => {
    const { contas, design, add, remove, setDesign } = useStore();
    const [unlocked, setUnlocked] = useState(false);
    const [pin, setPin] = useState("");
    const [show, setShow] = useState<Record<string, boolean>>({});
    const [form, setForm] = useState({ plataforma: "", usernameEmail: "", password: "", url: "", notas: "" });
    const [novoPin, setNovoPin] = useState("");
    const [novoPin2, setNovoPin2] = useState("");
    const [pinAtual, setPinAtual] = useState("");

    if (!unlocked) {
      return (
        <div className="space-y-6">
          <PageHeader title="Contas & Passwords" description="Esta área está protegida. Introduz o PIN de 4 dígitos. (Inicial: 0000)" />
          <Card className="mx-auto max-w-sm">
            <CardContent className="space-y-4 p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••" className="text-center text-2xl tracking-[0.8em]" />
              <Button className="w-full" onClick={() => {
                if (pin === design.pinContas) { setUnlocked(true); toast.success("Acesso permitido"); }
                else toast.error("PIN incorreto");
              }}>Desbloquear</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PageHeader title="Contas & Passwords" description="Guarda os teus logins de plataformas em segurança local." />
        <Tabs defaultValue="contas">
          <TabsList>
            <TabsTrigger value="contas">Contas guardadas</TabsTrigger>
            <TabsTrigger value="pin"><ShieldCheck className="mr-1 h-4 w-4" />Alterar PIN</TabsTrigger>
          </TabsList>
          <TabsContent value="contas" className="space-y-4">
            <Card><CardContent className="grid gap-3 p-4 md:grid-cols-5">
              <div><Label>Plataforma</Label><Input value={form.plataforma} onChange={(e) => setForm({ ...form, plataforma: e.target.value })} placeholder="Instagram" /></div>
              <div><Label>Email / Username</Label><Input value={form.usernameEmail} onChange={(e) => setForm({ ...form, usernameEmail: e.target.value })} /></div>
              <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" /></div>
              <div className="md:col-span-5"><Button onClick={() => {
                if (!form.plataforma || !form.password) return toast.error("Plataforma e password obrigatórios");
                add("contas", form); setForm({ plataforma: "", usernameEmail: "", password: "", url: "", notas: "" });
                toast.success("Conta guardada");
              }}><Plus className="mr-1 h-4 w-4" />Guardar conta</Button></div>
            </CardContent></Card>
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Plataforma</TableHead><TableHead>Email / User</TableHead><TableHead>Password</TableHead><TableHead>URL</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {contas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.plataforma}</TableCell>
                      <TableCell>{c.usernameEmail}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{show[c.id] ? c.password : "•".repeat(Math.min(c.password.length, 10))}</span>
                          <Button size="icon" variant="ghost" onClick={() => setShow((s) => ({ ...s, [c.id]: !s[c.id] }))}>
                            {show[c.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="text-primary underline">abrir</a> : "—"}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("contas", c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {contas.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem contas guardadas.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="pin">
            <Card className="max-w-md"><CardContent className="space-y-3 p-4">
              <div><Label>PIN atual</Label><Input maxLength={4} value={pinAtual} onChange={(e) => setPinAtual(e.target.value.replace(/\D/g, ""))} /></div>
              <div><Label>Novo PIN (4 dígitos)</Label><Input maxLength={4} value={novoPin} onChange={(e) => setNovoPin(e.target.value.replace(/\D/g, ""))} /></div>
              <div><Label>Confirmar novo PIN</Label><Input maxLength={4} value={novoPin2} onChange={(e) => setNovoPin2(e.target.value.replace(/\D/g, ""))} /></div>
              <Button onClick={() => {
                if (pinAtual !== design.pinContas) return toast.error("PIN atual incorreto");
                if (novoPin.length !== 4) return toast.error("Novo PIN deve ter 4 dígitos");
                if (novoPin !== novoPin2) return toast.error("PINs não coincidem");
                setDesign({ pinContas: novoPin }); setPinAtual(""); setNovoPin(""); setNovoPin2("");
                toast.success("PIN alterado");
              }}>Atualizar PIN</Button>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
});