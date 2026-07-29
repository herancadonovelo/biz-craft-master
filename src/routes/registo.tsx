import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Ticket, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-state";
import { consumeIntendedPath } from "@/components/AuthGate";
import { logSessionEvent } from "@/lib/session-telemetry";
import { savePendingPromoCode, normalizePromoCode, PROMO_CODE_PATTERN } from "@/lib/pending-promo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/craft-business-master-logo-transparent.png.asset.json";
import termosPdf from "@/assets/legal/termos.pdf.asset.json";
import privacidadePdf from "@/assets/legal/privacidade.pdf.asset.json";
import marketingPdf from "@/assets/legal/marketing.pdf.asset.json";

export const Route = createFileRoute("/registo")({
  head: () => ({ meta: [{ title: "Criar conta — Craft Business Master" }] }),
  component: RegistoPage,
});

// Lista curta e representativa de países/nacionalidades (podem ser expandidas).
const PAISES = [
  "Portugal","Espanha","França","Alemanha","Itália","Reino Unido","Irlanda",
  "Países Baixos","Bélgica","Luxemburgo","Suíça","Áustria","Polónia","Suécia",
  "Noruega","Dinamarca","Finlândia","Brasil","Angola","Moçambique","Cabo Verde",
  "São Tomé e Príncipe","Guiné-Bissau","Timor-Leste","EUA","Canadá","México",
  "Argentina","Chile","Colômbia","Uruguai","Austrália","Nova Zelândia","Japão",
  "China","Índia","África do Sul","Outro",
] as const;

const passwordSchema = z.string()
  .min(6, "Mínimo 6 caracteres.")
  .regex(/[A-Z]/, "Pelo menos 1 letra maiúscula.")
  .regex(/[a-z]/, "Pelo menos 1 letra minúscula.")
  .regex(/[0-9]/, "Pelo menos 1 número.")
  .regex(/[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/, "Pelo menos 1 caractere especial.");

const registoSchema = z.object({
  firstName: z.string().trim().min(1, "Nome próprio é obrigatório.").max(80),
  lastName: z.string().trim().min(1, "Apelido é obrigatório.").max(80),
  birthDate: z.date({ error: "Data de nascimento é obrigatória." }),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  nationality: z.string().min(1, "Nacionalidade é obrigatória."),
  country: z.string().min(1, "País é obrigatório."),
  email: z.string().trim().email("Email inválido.").max(255),
  password: passwordSchema,
  confirmPassword: z.string(),
  marketingOptIn: z.boolean(),
  promoCode: z.string().trim().toUpperCase()
    .regex(PROMO_CODE_PATTERN, "Código inválido (3-40 caracteres: letras, números, - ou _).")
    .optional()
    .or(z.literal("")),
  termsAccepted: z.literal(true, { error: "Tem de aceitar os Termos e Condições." }),
  privacyAccepted: z.literal(true, { error: "Tem de aceitar a Política de Privacidade." }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "As palavras-passe não coincidem.",
  path: ["confirmPassword"],
});

type FormState = {
  firstName: string; lastName: string; birthDate?: Date; company: string;
  nationality: string; country: string; email: string; password: string;
  confirmPassword: string; marketingOptIn: boolean; promoCode: string;
  termsAccepted: boolean; privacyAccepted: boolean;
};

function passwordChecks(p: string) {
  return {
    len: p.length >= 6,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    num: /[0-9]/.test(p),
    special: /[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/.test(p),
  };
}

function RegistoPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>({
    firstName: "", lastName: "", birthDate: undefined, company: "",
    nationality: "", country: "", email: "", password: "", confirmPassword: "",
    marketingOptIn: false, promoCode: "", termsAccepted: false, privacyAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && user) {
      const target = consumeIntendedPath();
      nav({ to: (target as any) || "/" });
    }
  }, [user, loading, nav]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const pwChecks = useMemo(() => passwordChecks(form.password), [form.password]);
  const allPwOk = pwChecks.len && pwChecks.upper && pwChecks.lower && pwChecks.num && pwChecks.special;
  const canSubmit = form.termsAccepted && form.privacyAccepted && !busy;

  const submit = async () => {
    const parsed = registoSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      toast.error("Corrige os campos assinalados.");
      return;
    }
    setErrors({});
    setBusy(true);
    const data = parsed.data;
    const nowIso = new Date().toISOString();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth-callback`,
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          birth_date: format(data.birthDate, "yyyy-MM-dd"),
          company: data.company || null,
          nationality: data.nationality,
          country: data.country,
          marketing_opt_in: data.marketingOptIn,
          promo_code: data.promoCode || null,
          terms_accepted_at: nowIso,
          privacy_accepted_at: nowIso,
        },
      },
    });
    setBusy(false);
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("already registered") || m.includes("already exists")) {
        toast.error("Já existe uma conta com este email. Faz login em vez de te registares.");
      } else if (m.includes("rate limit")) {
        toast.error("Demasiadas tentativas. Aguarda alguns minutos.");
      } else {
        toast.error("Falha ao criar conta: " + error.message);
      }
      return;
    }
    if (data.promoCode) savePendingPromoCode(data.promoCode);
    toast.success("Registo efetuado!", {
      description: data.promoCode
        ? "O teu código promocional será aplicado automaticamente no primeiro acesso. Se não receberes o email de confirmação nos próximos minutos, verifica a pasta de Spam."
        : "Se não receberes o email de confirmação nos próximos minutos, verifica a tua pasta de Spam.",
      duration: 12000,
    });
    nav({ to: "/auth" });
  };

  const signInGoogle = async () => {
    setBusy(true);
    void logSessionEvent("oauth_start", { reason: "google_signup_button", path: window.location.pathname });
    try {
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth-callback`,
        extraParams: { prompt: "select_account" },
      });
      if (r.redirected || r.error) {
        if (r.error) toast.error("Falha no registo com Google: " + r.error.message);
        return;
      }
      toast.success("Sessão iniciada com Google");
      nav({ to: "/" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center py-6">
      <div className="mb-6 flex justify-center">
        <img src={logoAsset.url} alt="Craft Business Master" className="h-24 w-auto sm:h-28" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <UserPlus className="h-5 w-5" /> Criar a tua conta
          </CardTitle>
          <p className="text-sm text-muted-foreground">Preenche os teus dados para começar. Já tens conta? <Link to="/auth" className="font-medium text-primary underline underline-offset-2">Entrar</Link>.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={signInGoogle} disabled={busy}>
            Registar com Google
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Ao criar conta ou associar o seu e-mail, confirma que leu e aceita obrigatoriamente os nossos{" "}
            <a href={termosPdf.url} target="_blank" rel="noopener noreferrer" className="underline">Termos e Condições</a>{" "}
            e compreende a nossa{" "}
            <a href={privacidadePdf.url} target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidade</a>.
          </p>
          <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OU <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Nome próprio *</Label>
              <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
              {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div>
              <Label>Apelido *</Label>
              <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Data de nascimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.birthDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.birthDate ? format(form.birthDate, "dd/MM/yyyy") : "Escolhe a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.birthDate}
                    onSelect={(d) => set("birthDate", d as Date | undefined)}
                    captionLayout="dropdown"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.birthDate && <p className="mt-1 text-xs text-destructive">{errors.birthDate}</p>}
            </div>
            <div>
              <Label>Empresa (opcional)</Label>
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Nacionalidade *</Label>
              <Select value={form.nationality} onValueChange={(v) => set("nationality", v)}>
                <SelectTrigger><SelectValue placeholder="Escolhe…" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {PAISES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.nationality && <p className="mt-1 text-xs text-destructive">{errors.nationality}</p>}
            </div>
            <div>
              <Label>País *</Label>
              <Select value={form.country} onValueChange={(v) => set("country", v)}>
                <SelectTrigger><SelectValue placeholder="Escolhe…" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {PAISES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.country && <p className="mt-1 text-xs text-destructive">{errors.country}</p>}
            </div>
          </div>

          <div>
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Palavra-passe *</Label>
              <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} />
            </div>
            <div>
              <Label>Confirmar palavra-passe *</Label>
              <Input type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />
              {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>

          <ul className="rounded-md border border-border bg-muted/30 p-3 text-xs">
            {[
              ["len", "Mínimo 6 caracteres"],
              ["upper", "Pelo menos 1 letra maiúscula"],
              ["lower", "Pelo menos 1 letra minúscula"],
              ["num", "Pelo menos 1 número"],
              ["special", "Pelo menos 1 caractere especial (ex: !@#$%^&*)"],
            ].map(([k, label]) => (
              <li key={k as string} className={cn("flex items-center gap-2", (pwChecks as any)[k as string] ? "text-emerald-600" : "text-muted-foreground")}>
                <span aria-hidden>{(pwChecks as any)[k as string] ? "✓" : "•"}</span>{label}
              </li>
            ))}
          </ul>

          <div>
            <Label className="flex items-center gap-2">
              <Ticket className="h-4 w-4" /> Código promocional (opcional)
            </Label>
            <Input
              value={form.promoCode}
              onChange={(e) => set("promoCode", normalizePromoCode(e.target.value))}
              placeholder="Ex.: BEMVINDA2026"
              maxLength={40}
              autoComplete="off"
              spellCheck={false}
            />
            {errors.promoCode ? (
              <p className="mt-1 text-xs text-destructive">{errors.promoCode}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Tens um código? Introduz aqui — é aplicado automaticamente no teu primeiro acesso.
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-md border border-border p-3">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={form.termsAccepted}
                onCheckedChange={(v) => set("termsAccepted", v === true)}
                className="mt-0.5"
              />
              <span>
                Li e concordo com os{" "}
                <a href={termosPdf.url} target="_blank" rel="noopener noreferrer" className="underline">Termos e Condições</a>{" "}
                da Craft Business Master <span className="text-destructive">(Obrigatório)</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={form.privacyAccepted}
                onCheckedChange={(v) => set("privacyAccepted", v === true)}
                className="mt-0.5"
              />
              <span>
                Li e compreendo a{" "}
                <a href={privacidadePdf.url} target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidade</a>{" "}
                <span className="text-destructive">(Obrigatório)</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={form.marketingOptIn}
                onCheckedChange={(v) => set("marketingOptIn", v === true)}
                className="mt-0.5"
              />
              <span>
                Aceito receber comunicações de{" "}
                <a href={marketingPdf.url} target="_blank" rel="noopener noreferrer" className="underline">Marketing e ofertas</a>{" "}
                da Art Fusion <span className="text-muted-foreground">(Opcional)</span>
              </span>
            </label>
          </div>

          <Button className="w-full" onClick={submit} disabled={!canSubmit || !allPwOk}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar Conta
          </Button>
          {!form.termsAccepted || !form.privacyAccepted ? (
            <p className="text-center text-xs text-muted-foreground">
              Aceita os Termos e a Política de Privacidade para ativar o botão.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}