import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Languages, Palette, Lock, Bell, Database, Trash2, ToggleLeft, Sparkles, HardDriveDownload, FlaskConical, Eye, EyeOff, ShieldCheck, Mail, KeyRound, UserX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loadDemoData } from "@/lib/seed-demo";
import { enterPreviewMode, exitPreviewMode, usePreviewMode } from "@/lib/preview-mode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { deleteMyAccountFn } from "@/lib/account.functions";
import { signOutAndReset } from "@/lib/sign-out";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações" }] }),
  component: ConfiguracoesContent,
});

export function ConfiguracoesContent() {
    const previewActive = usePreviewMode();
    const items = [
      { to: "/idioma", icon: Languages, title: "Idioma", desc: "Mudar a língua da app" },
      { to: "/modulos", icon: ToggleLeft, title: "Módulos ativos", desc: "Liga/desliga categorias do menu" },
      { to: "/onboarding", icon: Sparkles, title: "Configuração inicial", desc: "Voltar ao assistente de setup" },
      { to: "/contas", icon: Lock, title: "Contas & PIN", desc: "Passwords e PIN de acesso" },
      { to: "/calendario", icon: Bell, title: "Alarmes & toques", desc: "Toque padrão e alertas" },
      { to: "/backup", icon: HardDriveDownload, title: "Backup & Restauro", desc: "Exportar JSON/CSV e restaurar" },
    ];
    return (
      <div className="space-y-6">
        <PageHeader title="Configurações" description="Tudo o que controla o comportamento da aplicação." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link key={it.to} to={it.to}>
              <Card className="cursor-pointer transition hover:border-primary">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><it.icon className="h-5 w-5" /></div>
                  <div><p className="font-display font-semibold">{it.title}</p><p className="text-sm text-muted-foreground">{it.desc}</p></div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <SecurityAndAccountCard />
        <Card><CardContent className="space-y-3 p-4">
          <h3 className="font-display text-lg flex items-center gap-2"><Eye className="h-5 w-5" />Modo Preview</h3>
          <p className="text-sm text-muted-foreground">
            Vê a aplicação cheia de dados de demonstração sem alterar nem enviar nada para a tua conta. Ao sair, os teus dados reais voltam exatamente como estavam.
          </p>
          <div className="flex flex-wrap gap-2">
            {!previewActive ? (
              <Button onClick={() => { enterPreviewMode(); toast.success("Modo Preview ativado — os teus dados reais ficaram em segurança"); }}>
                <Eye className="mr-1 h-4 w-4" />Entrar em modo Preview
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => { exitPreviewMode(); toast.success("Modo Preview desativado — dados reais restaurados"); }}>
                <EyeOff className="mr-1 h-4 w-4" />Sair do modo Preview
              </Button>
            )}
          </div>
        </CardContent></Card>
        <Card><CardContent className="space-y-3 p-4">
          <h3 className="font-display text-lg flex items-center gap-2"><Database className="h-5 w-5" />Dados locais</h3>
          <p className="text-sm text-muted-foreground">A app guarda tudo localmente no teu navegador. Podes apagar tudo se precisares de recomeçar.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => {
              if (!confirm("Vai acrescentar dados de demonstração (clientes, encomendas, materiais, faturas, cash-flow, etc.). Continuar?")) return;
              loadDemoData();
              toast.success("Dados de demonstração carregados em todas as categorias");
            }}><FlaskConical className="mr-1 h-4 w-4" />Carregar dados de demonstração</Button>
            <Button variant="destructive" onClick={() => {
              if (!confirm("Tens a certeza? Isto apaga TODOS os dados locais.")) return;
              localStorage.removeItem("atelier-store-v1");
              toast.success("Dados apagados. A recarregar…");
              setTimeout(() => location.reload(), 600);
            }}><Trash2 className="mr-1 h-4 w-4" />Apagar todos os dados</Button>
          </div>
        </CardContent></Card>
      </div>
    );
}

function SecurityAndAccountCard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const deleteAccount = useAuthedServerFn(deleteMyAccountFn);

  const [newEmail, setNewEmail] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [busy, setBusy] = useState<null | "email" | "pwd" | "delete">(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [deleteWord, setDeleteWord] = useState("");

  const passwordScore = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const reauth = async (pwd: string) => {
    if (!user?.email) return { ok: false, message: "Sessão sem email associado." };
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: pwd });
    if (error) return { ok: false, message: "Password atual incorreta." };
    return { ok: true };
  };

  const changeEmail = async () => {
    if (!newEmail.trim()) return toast.error("Introduz o novo email.");
    if (!currentPwd) return toast.error("Confirma com a tua password atual.");
    setBusy("email");
    const check = await reauth(currentPwd);
    if (!check.ok) { setBusy(null); return toast.error(check.message!); }
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Enviámos um email de verificação para o novo endereço.");
    setNewEmail(""); setCurrentPwd("");
  };

  const changePassword = async () => {
    if (!currentPwd) return toast.error("Introduz a password atual.");
    if (passwordScore(newPwd) < 3) return toast.error("A nova password é demasiado fraca (mín. 8 caracteres, mistura letras e números).");
    if (newPwd !== confirmPwd) return toast.error("As passwords não coincidem.");
    setBusy("pwd");
    const check = await reauth(currentPwd);
    if (!check.ok) { setBusy(null); return toast.error(check.message!); }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Password atualizada.");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  };

  const performDelete = async () => {
    if (deleteWord.trim().toUpperCase() !== "ELIMINAR") return toast.error("Escreve ELIMINAR para confirmar.");
    if (!deletePwd) return toast.error("Confirma a password atual.");
    setBusy("delete");
    const check = await reauth(deletePwd);
    if (!check.ok) { setBusy(null); return toast.error(check.message!); }
    const res = await deleteAccount();
    setBusy(null);
    if (!res || !res.ok) return toast.error("Não foi possível eliminar a conta. Tenta novamente.");
    toast.success("Conta eliminada com sucesso.");
    setDeleteOpen(false);
    await signOutAndReset({ queryClient, navigate: nav });
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-4">
        <h3 className="font-display text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Segurança & Conta
        </h3>
        <p className="text-sm text-muted-foreground">Sessão ativa: <strong>{user?.email ?? "—"}</strong></p>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4" /> Alterar email</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><Label>Novo email</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="novo@exemplo.pt" /></div>
            <div><Label>Password atual</Label><Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} /></div>
          </div>
          <Button onClick={changeEmail} disabled={busy === "email"}>
            {busy === "email" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar novo email
          </Button>
          <p className="text-xs text-muted-foreground">Vais receber um link de verificação no novo endereço para concluir a troca.</p>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4" /> Alterar password</div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div><Label>Password atual</Label><Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} /></div>
            <div><Label>Nova password</Label><Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} /></div>
            <div><Label>Confirmar</Label><Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} /></div>
          </div>
          <Button onClick={changePassword} disabled={busy === "pwd"}>
            {busy === "pwd" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atualizar password
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 font-medium text-destructive"><UserX className="h-4 w-4" /> Zona de perigo</div>
          <p className="text-sm">Elimina permanentemente a tua conta e todos os dados associados. Esta ação é irreversível.</p>
          {!deleteOpen ? (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-1 h-4 w-4" /> Eliminar conta permanentemente
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-destructive">
                Atenção: todos os teus dados, projetos, stock e fornecedores serão apagados para sempre.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>Password atual</Label>
                  <Input type="password" value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} />
                </div>
                <div>
                  <Label>Digita ELIMINAR para confirmar</Label>
                  <Input value={deleteWord} onChange={(e) => setDeleteWord(e.target.value)} placeholder="ELIMINAR" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  onClick={performDelete}
                  disabled={busy === "delete" || deleteWord.trim().toUpperCase() !== "ELIMINAR"}
                >
                  {busy === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar eliminação
                </Button>
                <Button variant="ghost" onClick={() => { setDeleteOpen(false); setDeletePwd(""); setDeleteWord(""); }} disabled={busy === "delete"}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}