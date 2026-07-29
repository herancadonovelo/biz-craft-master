import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

/** Garante que quem chama é administrador. Lança quando não é. */
export async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error("Não foi possível validar as permissões.");
  if (!data) throw new Error("Sem permissões de administrador.");
}

async function gatewayJson(env: PaddleEnv, path: string, init?: RequestInit) {
  const res = await gatewayFetch(env, path, init);
  const body = await res.text();
  if (!res.ok) {
    console.error(`[refunds] gateway ${path} falhou [${res.status}]: ${body}`);
    throw new Error(`Pedido ao processador de pagamentos falhou [${res.status}]: ${body}`);
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Resposta inválida do processador de pagamentos.");
  }
}

export interface PaddleTransactionSummary {
  id: string;
  subscriptionId: string | null;
  customerId: string | null;
  userId: string | null;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  priceId: string | null;
}

/** Lista as últimas transações concluídas do processador de pagamentos. */
export async function listTransactions(env: PaddleEnv, perPage = 50): Promise<PaddleTransactionSummary[]> {
  const json = await gatewayJson(
    env,
    `/transactions?status=completed&per_page=${Math.min(Math.max(perPage, 1), 100)}&order_by=created_at[DESC]`,
  );
  const rows: any[] = json?.data ?? [];
  return rows.map((t) => ({
    id: t.id,
    subscriptionId: t.subscription_id ?? null,
    customerId: t.customer_id ?? null,
    userId: t.custom_data?.userId ?? null,
    status: t.status,
    totalCents: Number(t.details?.totals?.total ?? 0),
    currency: t.currency_code ?? "EUR",
    createdAt: t.created_at,
    priceId: t.items?.[0]?.price?.import_meta?.external_id ?? null,
  }));
}

export async function getTransaction(env: PaddleEnv, transactionId: string) {
  const json = await gatewayJson(env, `/transactions/${encodeURIComponent(transactionId)}`);
  return json?.data;
}

/**
 * Cria um ajuste de reembolso (total ou parcial) no processador de pagamentos.
 * O valor parcial é imputado ao primeiro item da transação.
 */
export async function createRefundAdjustment(opts: {
  env: PaddleEnv;
  transactionId: string;
  amountCents: number;
  fullRefund: boolean;
  reason: string;
}) {
  const txn = await getTransaction(opts.env, opts.transactionId);
  const items: any[] = txn?.items ?? txn?.details?.line_items ?? [];
  const lineItems: any[] = txn?.details?.line_items ?? [];
  const itemIds = (lineItems.length ? lineItems : items).map((i: any) => i.id).filter(Boolean);
  if (!itemIds.length) throw new Error("A transação não tem itens para reembolsar.");

  const payloadItems = opts.fullRefund
    ? itemIds.map((id: string) => ({ item_id: id, type: "full" }))
    : [{ item_id: itemIds[0], type: "partial", amount: String(Math.round(opts.amountCents)) }];

  const json = await gatewayJson(opts.env, "/adjustments", {
    method: "POST",
    body: JSON.stringify({
      action: "refund",
      transaction_id: opts.transactionId,
      reason: opts.reason.slice(0, 200),
      items: payloadItems,
    }),
  });
  return json?.data as { id: string; status?: string; totals?: { total?: string } };
}

/** Cancela uma subscrição imediatamente ou no fim do período pago. */
export async function cancelPaddleSubscription(
  env: PaddleEnv,
  subscriptionId: string,
  immediate: boolean,
) {
  const json = await gatewayJson(env, `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ effective_from: immediate ? "immediately" : "next_billing_period" }),
  });
  return json?.data;
}