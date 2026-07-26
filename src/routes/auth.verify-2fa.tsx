import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { mark2faCompletedFn, logOtpAttemptFn } from "@/lib/auth-2fa.functions";

export const Route = createFileRoute("/auth/verify-2fa")({
  head: () => ({ meta: [{ title: "Verificação em dois passos" }] }),
  component: Verify2FAPage,
});

const E164 = /^\+[1-9]\d{6,14}$/;

function Verify2FAPage() {
  const nav = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search }) as any;
  const enrollMode = !!search?.enroll;

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<null | "send" | "verify">(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const mark2fa = useServerFn(mark2faCompletedFn);
  const logAttempt = useServerFn(logOtpAttemptFn);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    // If user already has verified phone and we're in enroll mode, drop the flag.
    (async () => {
      const { data } = await supabase.auth.getUser();
      const p = (data.user?.phone as string | undefined) ?? "";
      if (p && enrollMode) {
        setPhone(p.startsWith("+") ? p : "+" + p);
        setSent(false);
      }
    })();
  }, [enrollMode]);

  const canSend = useMemo(() => E164.test(phone) && cooldown === 0 && busy !== "send", [phone, cooldown, busy]);

  async function sendCode() {
    if (!canSend) return;
    setBusy("send");
    // Supabase native phone flow: update phone then verify with SMS OTP.
    const { error } = await supabase.auth.updateUser({ phone });
    setBusy(null);
    await logAttempt({ data: { kind: enrollMode ? "enroll" : "send", phone, success: !error } });
    if (error) {
      const msg = error.message || "";
      const low = msg.toLowerCase();
      if (/rate|too many/.test(low)) {
        toast.error("Muitas tentativas. Aguarda 60 s e tenta de novo.");
      } else if (/format|invalid.*phone|not.*valid/.test(low)) {
        toast.error("Formato inválido. Usa +[código do país][número], ex: +351912345678.");
      } else if (/provider|not configured|unsupported|disabled/.test(low)) {
        toast.error(
          "Serviço de SMS não está configurado. Contacta o suporte (o administrador precisa de ligar o provider SMS/WhatsApp).",
          { duration: 8000 },
        );
      } else if (/sms|twilio|messagebird/.test(low)) {
        toast.error("Serviço de SMS temporariamente indisponível. Tenta em alguns minutos.");
      } else if (/already|taken/.test(low)) {
        toast.error("Este número já está associado a outra conta.");
      } else {
        toast.error("Não foi possível enviar o código: " + msg);
      }
      return;
    }
    setSent(true);
    setCooldown(60);
    toast.success("Enviámos um código de 6 dígitos por SMS.");
    setDeliveryStatus("queued");
  }

  // Twilio delivery status polling — reads webhook_events populated by
  // /api/public/webhooks/twilio-status.
  const [deliveryStatus, setDeliveryStatus] = useState<null | "queued" | "sent" | "delivered" | "failed" | "undelivered">(null);
  useEffect(() => {
    if (!sent) return;
    let cancelled = false;
    const poll = async () => {
      const since = new Date(Date.now() - 5 * 60_000).toISOString();
      const { data } = await supabase
        .from("webhook_events")
        .select("payload, received_at")
        .eq("provider", "twilio")
        .gte("received_at", since)
        .order("received_at", { ascending: false })
        .limit(5);
      if (cancelled || !data) return;
      const forMe = data.find((r: any) => r?.payload?.to === phone);
      const s = (forMe?.payload as any)?.status as typeof deliveryStatus;
      if (s) setDeliveryStatus(s);
    };
    poll();
    const id = window.setInterval(poll, 4000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [sent, phone]);

  async function verify() {
    if (code.length !== 6) return toast.error("Introduz os 6 dígitos do código.");
    setBusy("verify");
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: "phone_change" });
    if (error) {
      setBusy(null);
      await logAttempt({ data: { kind: "verify", phone, success: false } });
      const msg = error.message || "";
      if (/expired/i.test(msg)) toast.error("O código expirou. Pede um novo.");
      else if (/invalid/i.test(msg)) toast.error("Código incorreto. Verifica os dígitos.");
      else toast.error("Erro a verificar código: " + msg);
      return;
    }
    // Confirm on our side and mark 2FA fresh for this session.
    const { error: rpcErr } = await supabase.rpc("mark_phone_verified", { _phone: phone });
    if (rpcErr) {
      setBusy(null);
      toast.error("Não foi possível registar o telemóvel: " + rpcErr.message);
      return;
    }
    await mark2fa();
    await logAttempt({ data: { kind: "verify", phone, success: true } });
    setBusy(null);
    toast.success("Telemóvel verificado. Bem-vinda!");
    nav({ to: "/" });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <Card className="w-full">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="font-display text-xl">
              {enrollMode ? "Associa o teu telemóvel" : "Confirma que és tu"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {enrollMode
              ? "Para proteger a tua conta, ativámos verificação em dois passos por SMS. Introduz o teu número — vais receber um código de 6 dígitos."
              : "Enviámos um código de 6 dígitos para o teu telemóvel registado. Introduz-o para continuar."}
          </p>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Número (formato internacional)</Label>
            <Input
              type="tel"
              inputMode="tel"
              placeholder="+351912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
              disabled={busy !== null || sent}
            />
            {!E164.test(phone) && phone.length > 0 && (
              <p className="text-xs text-destructive">Usa o formato +[código do país][número], ex: +351912345678.</p>
            )}
          </div>

          {!sent ? (
            <Button onClick={sendCode} disabled={!canSend} className="w-full">
              {busy === "send" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar código por SMS
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Código recebido</Label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                />
              </div>
              <Button onClick={verify} disabled={busy !== null || code.length !== 6} className="w-full">
                {busy === "verify" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar código
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-primary underline-offset-2 hover:underline disabled:opacity-50"
                  onClick={sendCode}
                  disabled={cooldown > 0 || busy !== null}
                >
                  {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => { setSent(false); setCode(""); }}
                >
                  Trocar de número
                </button>
              </div>
              {deliveryStatus && (
                <div data-testid="twilio-delivery-status" className="text-[11px] text-muted-foreground">
                  Estado do envio: <b>{deliveryStatus}</b>
                </div>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Se não recebeste o SMS, verifica se o número está correto e se tens sinal. O código expira em 10 minutos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}