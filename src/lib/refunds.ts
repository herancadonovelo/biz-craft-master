/**
 * Lógica pura de reembolsos e cancelamentos de subscrições.
 * Sem dependências de rede — usada no cliente, no servidor e nos testes.
 */

export type RefundKind = "reembolso_total" | "reembolso_parcial" | "cancelamento";
export type RefundStatus = "pendente" | "aprovado" | "recusado" | "concluido";
export type RefundReasonCode =
  | "duplicado"
  | "cobranca_indevida"
  | "insatisfacao"
  | "problema_tecnico"
  | "pedido_cliente"
  | "fraude_disputa"
  | "outro";

export const REFUND_REASONS: { code: RefundReasonCode; label: string }[] = [
  { code: "duplicado", label: "Pagamento duplicado" },
  { code: "cobranca_indevida", label: "Cobrança indevida" },
  { code: "insatisfacao", label: "Insatisfação com o serviço" },
  { code: "problema_tecnico", label: "Problema técnico" },
  { code: "pedido_cliente", label: "Pedido do cliente" },
  { code: "fraude_disputa", label: "Fraude ou disputa" },
  { code: "outro", label: "Outro motivo" },
];

export function reasonLabel(code: string): string {
  return REFUND_REASONS.find((r) => r.code === code)?.label ?? code;
}

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  concluido: "Concluído",
};

export const REFUND_KIND_LABEL: Record<RefundKind, string> = {
  reembolso_total: "Reembolso total",
  reembolso_parcial: "Reembolso parcial",
  cancelamento: "Cancelamento",
};

export interface RefundRecord {
  id: string;
  user_id: string;
  paddle_subscription_id: string | null;
  paddle_transaction_id: string | null;
  paddle_adjustment_id: string | null;
  kind: RefundKind;
  amount_cents: number;
  currency: string;
  reason_code: RefundReasonCode;
  reason_note: string | null;
  status: RefundStatus;
  environment: "sandbox" | "live";
  confirmed_at: string | null;
  accounted_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

/** Estados que contam como valor comprometido (já devolvido ou a caminho). */
const COMMITTED: RefundStatus[] = ["pendente", "aprovado", "concluido"];

/** Soma dos reembolsos já emitidos para uma transação, em cêntimos. */
export function refundedCents(records: Pick<RefundRecord, "kind" | "status" | "amount_cents">[]): number {
  return records
    .filter((r) => r.kind !== "cancelamento" && COMMITTED.includes(r.status))
    .reduce((sum, r) => sum + (r.amount_cents || 0), 0);
}

/** Quanto ainda pode ser devolvido numa transação, em cêntimos. */
export function refundableCents(
  totalCents: number,
  records: Pick<RefundRecord, "kind" | "status" | "amount_cents">[],
): number {
  return Math.max(0, (totalCents || 0) - refundedCents(records));
}

export interface RefundValidationInput {
  kind: RefundKind;
  amountCents: number;
  totalCents: number;
  alreadyRefundedCents: number;
  reasonCode: string;
  reasonNote?: string | null;
}

export type RefundValidation = { ok: true; amountCents: number } | { ok: false; error: string };

/** Valida um pedido de reembolso antes de o enviar ao processador de pagamentos. */
export function validateRefund(input: RefundValidationInput): RefundValidation {
  const disponivel = Math.max(0, (input.totalCents || 0) - (input.alreadyRefundedCents || 0));

  if (!REFUND_REASONS.some((r) => r.code === input.reasonCode)) {
    return { ok: false, error: "Escolhe um motivo válido." };
  }
  if (input.reasonCode === "outro" && !input.reasonNote?.trim()) {
    return { ok: false, error: "Descreve o motivo quando escolhes “Outro”." };
  }
  if (disponivel <= 0) {
    return { ok: false, error: "Este pagamento já foi totalmente reembolsado." };
  }

  const amount = input.kind === "reembolso_total" ? disponivel : Math.round(input.amountCents);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Indica um valor de reembolso maior que zero." };
  }
  if (amount > disponivel) {
    return {
      ok: false,
      error: `O valor excede o disponível para reembolso (${formatCents(disponivel)}).`,
    };
  }
  return { ok: true, amountCents: amount };
}

/** Estado da encomenda após um reembolso, para mostrar na lista. */
export function orderStateAfterRefund(totalCents: number, refundedTotalCents: number): string {
  if (refundedTotalCents <= 0) return "pago";
  if (refundedTotalCents >= totalCents) return "reembolsada";
  return "parcialmente_reembolsada";
}

export const ORDER_STATE_LABEL: Record<string, string> = {
  pago: "Pago",
  reembolsada: "Reembolsada",
  parcialmente_reembolsada: "Parcialmente reembolsada",
};

/** Converte o estado de um ajuste do processador no estado interno. */
export function statusFromAdjustment(adjustmentStatus?: string | null): RefundStatus {
  switch (adjustmentStatus) {
    case "approved":
ようcase "refunded" as never:
      return "concluido";
    case "rejected":
      return "recusado";
    case "pending_approval":
      return "pendente";
    default:
      return "pendente";
  }
}

export function formatCents(cents: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format((cents || 0) / 100);
  } catch {
    return `${((cents || 0) / 100).toFixed(2)} ${currency}`;
  }
}

/** Evita lançar duas vezes o mesmo reembolso na contabilidade local. */
export function pendingAccountingIds(records: RefundRecord[], alreadyAccountedIds: string[]): string[] {
  const seen = new Set(alreadyAccountedIds);
  return records
    .filter(
      (r) =>
        r.kind !== "cancelamento" &&
        r.status === "concluido" &&
        !r.accounted_at &&
        !seen.has(r.id),
    )
    .map((r) => r.id);
}