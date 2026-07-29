import { describe, it, expect } from "vitest";
import {
  refundedCents,
  refundableCents,
  validateRefund,
  orderStateAfterRefund,
  statusFromAdjustment,
  pendingAccountingIds,
  reasonLabel,
  formatCents,
  type RefundRecord,
} from "./refunds";

const rec = (p: Partial<RefundRecord>): RefundRecord => ({
  id: p.id ?? "11111111-1111-1111-1111-111111111111",
  user_id: "u1",
  paddle_subscription_id: null,
  paddle_transaction_id: "txn_1",
  paddle_adjustment_id: null,
  kind: "reembolso_parcial",
  amount_cents: 500,
  currency: "EUR",
  reason_code: "pedido_cliente",
  reason_note: null,
  status: "concluido",
  environment: "sandbox",
  confirmed_at: null,
  accounted_at: null,
  created_at: "2026-01-01T00:00:00Z",
  ...p,
});

describe("refundedCents", () => {
  it("soma reembolsos pendentes, aprovados e concluídos", () => {
    expect(
      refundedCents([
        rec({ amount_cents: 500, status: "concluido" }),
        rec({ amount_cents: 300, status: "pendente" }),
        rec({ amount_cents: 200, status: "aprovado" }),
      ]),
    ).toBe(1000);
  });

  it("ignora recusados e cancelamentos", () => {
    expect(
      refundedCents([
        rec({ amount_cents: 500, status: "recusado" }),
        rec({ amount_cents: 900, kind: "cancelamento" }),
      ]),
    ).toBe(0);
  });
});

describe("refundableCents", () => {
  it("devolve o restante disponível", () => {
    expect(refundableCents(2000, [rec({ amount_cents: 750 })])).toBe(1250);
  });
  it("nunca desce abaixo de zero", () => {
    expect(refundableCents(500, [rec({ amount_cents: 900 })])).toBe(0);
  });
});

describe("validateRefund", () => {
  const base = { totalCents: 2000, alreadyRefundedCents: 0, reasonCode: "pedido_cliente" as const };

  it("reembolso total usa todo o valor disponível", () => {
    const r = validateRefund({ ...base, kind: "reembolso_total", amountCents: 0, alreadyRefundedCents: 500 });
    expect(r).toEqual({ ok: true, amountCents: 1500 });
  });

  it("recusa valor acima do disponível", () => {
    const r = validateRefund({ ...base, kind: "reembolso_parcial", amountCents: 2500 });
    expect(r.ok).toBe(false);
  });

  it("recusa valores nulos ou negativos", () => {
    expect(validateRefund({ ...base, kind: "reembolso_parcial", amountCents: 0 }).ok).toBe(false);
    expect(validateRefund({ ...base, kind: "reembolso_parcial", amountCents: -100 }).ok).toBe(false);
  });

  it("recusa quando já foi tudo devolvido", () => {
    const r = validateRefund({ ...base, kind: "reembolso_total", amountCents: 0, alreadyRefundedCents: 2000 });
    expect(r.ok).toBe(false);
  });

  it("exige nota quando o motivo é “Outro”", () => {
    expect(validateRefund({ ...base, reasonCode: "outro", kind: "reembolso_parcial", amountCents: 100 }).ok).toBe(false);
    expect(
      validateRefund({ ...base, reasonCode: "outro", reasonNote: "erro de cobrança", kind: "reembolso_parcial", amountCents: 100 }).ok,
    ).toBe(true);
  });

  it("recusa motivos desconhecidos", () => {
    expect(validateRefund({ ...base, reasonCode: "qualquer", kind: "reembolso_parcial", amountCents: 100 }).ok).toBe(false);
  });
});

describe("orderStateAfterRefund", () => {
  it("mapeia os três estados", () => {
    expect(orderStateAfterRefund(2000, 0)).toBe("pago");
    expect(orderStateAfterRefund(2000, 500)).toBe("parcialmente_reembolsada");
    expect(orderStateAfterRefund(2000, 2000)).toBe("reembolsada");
  });
});

describe("statusFromAdjustment", () => {
  it("converte estados do processador", () => {
    expect(statusFromAdjustment("approved")).toBe("concluido");
    expect(statusFromAdjustment("refunded")).toBe("concluido");
    expect(statusFromAdjustment("rejected")).toBe("recusado");
    expect(statusFromAdjustment("pending_approval")).toBe("pendente");
    expect(statusFromAdjustment(null)).toBe("pendente");
  });
});

describe("pendingAccountingIds", () => {
  it("só devolve reembolsos concluídos e ainda não lançados", () => {
    const ids = pendingAccountingIds(
      [
        rec({ id: "a", status: "concluido" }),
        rec({ id: "b", status: "pendente" }),
        rec({ id: "c", status: "concluido", accounted_at: "2026-01-02T00:00:00Z" }),
        rec({ id: "d", status: "concluido", kind: "cancelamento" }),
        rec({ id: "e", status: "concluido" }),
      ],
      ["e"],
    );
    expect(ids).toEqual(["a"]);
  });
});

describe("apresentação", () => {
  it("traduz motivos e formata valores", () => {
    expect(reasonLabel("duplicado")).toBe("Pagamento duplicado");
    expect(reasonLabel("desconhecido")).toBe("desconhecido");
    expect(formatCents(1990, "EUR")).toContain("19,90");
  });
});