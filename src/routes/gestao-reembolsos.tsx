import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useStore } from "@/lib/store";
import {
  isAdminFn,
  listRefundablePaymentsFn,
  listRefundHistoryFn,
  issueRefundFn,
  cancelSubscriptionAdminFn,
  markRefundsAccountedFn,
} from "@/lib/refunds.functions";
import {
  REFUND_REASONS,
  REFUND_KIND_LABEL,
  REFUND_STATUS_LABEL,
  ORDER_STATE_LABEL,
  formatCents,
  orderStateAfterRefund,
  reasonLabel,
  validateRefund,
  pendingAccountingIds,
  type RefundRecord,
  type RefundKind,
} from "@/lib/refunds";

export const Route = createFileRoute("/gestao-reembolsos")({
  head: () => ({
    meta: [
      { title: "Gestão de Reembolsos e Cancelamentos — Craft Business Master" },
      {
        name: "description",
        content:
          "Emite reembolsos totais ou parciais, cancela subscrições e consulta o histórico com atualização automática do estado das encomendas.",
      },
      { property: "og:title", content: "Gestão de Reembolsos e Cancelamentos" },
      {
        property: "og:description",
        content: "Painel de administração para reembolsos, cancelamentos e histórico de faturação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GestaoReembolsosPage,
});

interface PaymentRow {
  transactionId: string;
  subscriptionId: string | null;
  userId: string | null;
  email: string | null;
  productId: string | null;
  priceId: string | null;
  totalCents: number;
  currency: string;
  createdAt: string;
  refundedCents: number;
  subscriptionStatus: string | null;
}

function GestaoReembolsosPage() {
  const env = getPaddleEnvironment();
  const checkAdmin = useAuthedServerFn(isAdminFn);
  const listPayments = useAuthedServerFn(listRefundablePaymentsFn);
  const listHistory = useAuthedServerFn(listRefundHistoryFn);
  const issueRefund = useAuthedServerFn(issueRefundFn);
  const cancelSub = useAuthedServerFn(cancelSubscriptionAdminFn);
  const markAccounted = useAuthedServerFn(markRefundsAccountedFn);

  const [admin, setAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const [kind, setKind] = useState<RefundKind>("reembolso_total");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState<string>("pedido_cliente");
  const [nota, setNota] = useState("");
  const [imediato, setImediato] = useState(false);
  const [saving, setSaving] = useState(false);

  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const faturas = useStore((s) => s.faturas);

  useEffect(() => {
    (async () => {
      const r = await checkAdmin({});
      setAdmin(!!r?.admin);
    })().catch(() => setAdmin(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        listPayments({ data: { environment: env } }),
        listHistory({ data: { environment: env } }),
      ]);
      setPayments((p?.payments ?? []) as PaymentRow[]);
      setRefunds((h?.refunds ?? []) as RefundRecord[]);
    } catch (e: any) {
      toast.error("Não foi possível carregar os pagamentos", { description: e?.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (admin) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  const disponivel = selected ? Math.max(0, selected.totalCents - selected.refundedCents) : 0;

  const porUtilizador = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of refunds) {
      if (r.kind === "cancelamento" || r.status === "recusado") continue;
      map.set(r.user_id, (map.get(r.user_id) ?? 0) + r.amount_cents);
    }
    return map;
  }, [refunds]);

  async function submeterReembolso() {
    if (!selected?.userId) {
      toast.error("Este pagamento não tem cliente associado.");
      return;
    }
    const cents = kind === "reembolso_total" ? disponivel : Math.round(Number(valor.replace(",", ".")) * 100);
    const check = validateRefund({
      kind,
      amountCents: cents,
      totalCents: selected.totalCents,
      alreadyRefundedCents: selected.refundedCents,
      reasonCode: motivo,
      reasonNote: nota,
    });
    if (!check.ok) {
      toast.error(check.error);
      return;
    }
    setSaving(true);
    try {
      const res = await issueRefund({
        data: {
          environment: env,
          transactionId: selected.transactionId,
          subscriptionId: selected.subscriptionId,
          userId: selected.userId,
          kind,
          amountCents: check.amountCents,
          currency: selected.currency,
          reasonCode: motivo as any,
          reasonNote: nota || undefined,
        },
      });
      if (!res?.ok) {
        toast.error(res?.message ?? "Não foi possível emitir o reembolso.");
        return;
      }
      toast.success("Reembolso submetido com sucesso.");
      setNota("");
      setValor("");
      setSelected(null);
      await refresh();
    } catch (e: any) {
      toast.error("Falha ao emitir o reembolso", { description: e?.message });
    } finally {
      setSaving(false);
    }
  }

  async function submeterCancelamento(p: PaymentRow) {
    if (!p.subscriptionId || !p.userId) {
      toast.error("Este pagamento não tem subscrição associada.");
      return;
    }
    setSaving(true);
    try {
      const res = await cancelSub({
        data: {
          environment: env,
          subscriptionId: p.subscriptionId,
          userId: p.userId,
          immediate: imediato,
          reasonCode: motivo as any,
          reasonNote: nota || undefined,
        },
      });
      if (!res?.ok) {
        toast.error(res?.message ?? "Não foi possível cancelar.");
        return;
      }
      toast.success(
        imediato ? "Subscrição cancelada de imediato." : "Cancelamento agendado para o fim do período.",
      );
      await refresh();
    } catch (e: any) {
      toast.error("Falha ao cancelar a subscrição", { description: e?.message });
    } finally {
      setSaving(false);
    }
  }

  /** Lança os reembolsos confirmados na contabilidade local (venda negativa + fatura). */
  async function lancarNaContabilidade() {
    const ids = pendingAccountingIds(refunds, []);
    if (!ids.length) {
      toast.info("Não há reembolsos por lançar.");
      return;
    }
    const alvo = refunds.filter((r) => ids.includes(r.id));
    for (const r of alvo) {
      add("vendas", {
        valor: -(r.amount_cents / 100),
        data: (r.confirmed_at ?? r.created_at).slice(0, 10),
        notas: `Reembolso ${reasonLabel(r.reason_code)} — ${r.paddle_transaction_id ?? r.id}`,
      } as any);
      const fatura = faturas.find((f) => f.paddleTransactionId === r.paddle_transaction_id);
      if (fatura) {
        const reembolsado = (fatura.valorReembolsado ?? 0) + r.amount_cents / 100;
        update("faturas", fatura.id, {
          valorReembolsado: reembolsado,
          estado: reembolsado >= fatura.valor ? "reembolsada" : "parcialmente_reembolsada",
        });
      }
    }
    try {
      await markAccounted({ data: { ids } });
      toast.success(`${ids.length} reembolso(s) lançados na contabilidade.`);
      await refresh();
    } catch (e: any) {
      toast.error("Lançámos localmente, mas falhou marcar no servidor", { description: e?.message });
    }
  }

  if (admin === null) {
    return <div className="p-6 text-sm text-muted-foreground">A verificar permissões…</div>;
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <PageHeader
          title="Gestão de Reembolsos"
          description="Área reservada à administração da Art Fusion."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Não tens permissões de administrador para gerir reembolsos e cancelamentos. Se precisas
            de um reembolso da tua subscrição, escreve para craftbusinessmaster@gmail.com ou consulta
            a nossa <a className="underline" href="/reembolsos">Política de Reembolsos</a>.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <PageHeader
        title="Reembolsos e Cancelamentos"
        description="Emite reembolsos totais ou parciais, cancela subscrições e acompanha o histórico. O estado das encomendas é atualizado automaticamente."
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          {loading ? "A carregar…" : "Atualizar"}
        </Button>
        <Button variant="secondary" onClick={() => void lancarNaContabilidade()}>
          Lançar na contabilidade
        </Button>
        <Badge variant="outline">Ambiente: {env === "sandbox" ? "teste" : "real"}</Badge>
      </div>

      <Tabs defaultValue="pagamentos">
        <TabsList>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Pagamentos concluídos</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Reembolsado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground">
                        Sem pagamentos concluídos neste ambiente.
                      </TableCell>
                    </TableRow>
                  )}
                  {payments.map((p) => (
                    <TableRow key={p.transactionId} data-testid="linha-pagamento">
                      <TableCell>{p.createdAt?.slice(0, 10)}</TableCell>
                      <TableCell className="max-w-[220px] truncate">{p.email ?? p.userId ?? "—"}</TableCell>
                      <TableCell>{formatCents(p.totalCents, p.currency)}</TableCell>
                      <TableCell>{formatCents(p.refundedCents, p.currency)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ORDER_STATE_LABEL[orderStateAfterRefund(p.totalCents, p.refundedCents)]}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => { setSelected(p); setKind("reembolso_total"); }}>
                          Reembolsar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!p.subscriptionId || saving}
                          onClick={() => void submeterCancelamento(p)}
                        >
                          Cancelar subscrição
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selected && (
            <Card data-testid="form-reembolso">
              <CardHeader>
                <CardTitle>
                  Reembolsar {selected.email ?? selected.transactionId} — disponível{" "}
                  {formatCents(disponivel, selected.currency)}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={kind} onValueChange={(v: any) => setKind(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reembolso_total">Reembolso total</SelectItem>
                      <SelectItem value="reembolso_parcial">Reembolso parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor-reembolso">Valor ({selected.currency})</Label>
                  <Input
                    id="valor-reembolso"
                    inputMode="decimal"
                    disabled={kind === "reembolso_total"}
                    value={kind === "reembolso_total" ? (disponivel / 100).toFixed(2) : valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Select value={motivo} onValueChange={setMotivo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REFUND_REASONS.map((r) => (
                        <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nota-reembolso">Nota interna</Label>
                  <Textarea
                    id="nota-reembolso"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    maxLength={500}
                    placeholder="Contexto do pedido (opcional, obrigatório em “Outro”)"
                  />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    id="cancelar-imediato"
                    type="checkbox"
                    checked={imediato}
                    onChange={(e) => setImediato(e.target.checked)}
                  />
                  <Label htmlFor="cancelar-imediato" className="text-sm font-normal">
                    Ao cancelar, terminar o acesso imediatamente (por omissão mantém até ao fim do período pago)
                  </Label>
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <Button onClick={() => void submeterReembolso()} disabled={saving}>
                    {saving ? "A processar…" : "Confirmar reembolso"}
                  </Button>
                  <Button variant="ghost" onClick={() => setSelected(null)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader><CardTitle>Histórico de reembolsos e cancelamentos</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Contabilizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground">
                        Ainda não existem reembolsos ou cancelamentos registados.
                      </TableCell>
                    </TableRow>
                  )}
                  {refunds.map((r) => (
                    <TableRow key={r.id} data-testid="linha-historico">
                      <TableCell>{(r.confirmed_at ?? r.created_at).slice(0, 10)}</TableCell>
                      <TableCell>{REFUND_KIND_LABEL[r.kind]}</TableCell>
                      <TableCell>{r.kind === "cancelamento" ? "—" : formatCents(r.amount_cents, r.currency)}</TableCell>
                      <TableCell className="max-w-[240px] truncate">
                        {reasonLabel(r.reason_code)}{r.reason_note ? ` — ${r.reason_note}` : ""}
                      </TableCell>
                      <TableCell><Badge variant="outline">{REFUND_STATUS_LABEL[r.status]}</Badge></TableCell>
                      <TableCell>{r.accounted_at ? "Sim" : "Não"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 text-xs text-muted-foreground">
                Total devolvido a {porUtilizador.size} cliente(s).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}