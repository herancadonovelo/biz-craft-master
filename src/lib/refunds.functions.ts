import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateRefund, refundedCents, type RefundRecord } from "@/lib/refunds";

const envSchema = z.enum(["sandbox", "live"]);

const reasonSchema = z.enum([
  "duplicado",
  "cobranca_indevida",
  "insatisfacao",
  "problema_tecnico",
  "pedido_cliente",
  "fraude_disputa",
  "outro",
]);

/** O utilizador autenticado é administrador? Usado só para mostrar/esconder a área. */
export const isAdminFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: !!data };
  });

/** Pagamentos elegíveis para reembolso, já cruzados com o histórico. */
export const listRefundablePaymentsFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ environment: envSchema }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, listTransactions } = await import("@/lib/refunds.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const transactions = await listTransactions(data.environment);

    const { data: refunds } = await supabaseAdmin
      .from("refunds")
      .select("*")
      .eq("environment", data.environment);
    const list = (refunds ?? []) as unknown as RefundRecord[];

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_subscription_id,user_id,product_id,price_id,status")
      .eq("environment", data.environment);

    const emailByUser = new Map<string, string>();
    const userIds = new Set<string>();
    for (const t of transactions) if (t.userId) userIds.add(t.userId);
    for (const s of subs ?? []) userIds.add((s as any).user_id);
    for (const uid of userIds) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
      if (u?.user?.email) emailByUser.set(uid, u.user.email);
    }

    const payments = transactions.map((t) => {
      const sub = (subs ?? []).find(
        (s: any) => s.paddle_subscription_id === t.subscriptionId,
      ) as any;
      const userId = t.userId ?? sub?.user_id ?? null;
      const relacionados = list.filter((r) => r.paddle_transaction_id === t.id);
      return {
        transactionId: t.id,
        subscriptionId: t.subscriptionId,
        userId,
        email: userId ? (emailByUser.get(userId) ?? null) : null,
        productId: sub?.product_id ?? null,
        priceId: t.priceId ?? sub?.price_id ?? null,
        totalCents: t.totalCents,
        currency: t.currency,
        createdAt: t.createdAt,
        refundedCents: refundedCents(relacionados),
        subscriptionStatus: sub?.status ?? null,
      };
    });

    return { payments, refunds: list };
  });

/** Histórico completo de reembolsos e cancelamentos. */
export const listRefundHistoryFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ environment: envSchema }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/refunds.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("refunds")
      .select("*")
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(500);
    return { refunds: (rows ?? []) as unknown as RefundRecord[] };
  });

/** Emite um reembolso total ou parcial e guarda o registo no histórico. */
export const issueRefundFn = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        environment: envSchema,
        transactionId: z.string().min(3).max(120),
        subscriptionId: z.string().max(120).nullable().optional(),
        userId: z.string().uuid(),
        kind: z.enum(["reembolso_total", "reembolso_parcial"]),
        amountCents: z.number().int().min(0).max(100_000_00).default(0),
        currency: z.string().min(3).max(3).default("EUR"),
        reasonCode: reasonSchema,
        reasonNote: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, getTransaction, createRefundAdjustment } = await import(
      "@/lib/refunds.server"
    );
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const txn = await getTransaction(data.environment, data.transactionId);
    const totalCents = Number(txn?.details?.totals?.total ?? 0);

    const { data: existing } = await supabaseAdmin
      .from("refunds")
      .select("kind,status,amount_cents")
      .eq("paddle_transaction_id", data.transactionId)
      .eq("environment", data.environment);
    const already = refundedCents((existing ?? []) as any);

    const check = validateRefund({
      kind: data.kind,
      amountCents: data.amountCents,
      totalCents,
      alreadyRefundedCents: already,
      reasonCode: data.reasonCode,
      reasonNote: data.reasonNote,
    });
    if (!check.ok) return { ok: false as const, message: check.error };

    const adjustment = await createRefundAdjustment({
      env: data.environment,
      transactionId: data.transactionId,
      amountCents: check.amountCents,
      fullRefund: data.kind === "reembolso_total",
      reason: data.reasonNote?.trim() || data.reasonCode,
    });

    const { data: inserted, error } = await supabaseAdmin
      .from("refunds")
      .insert({
        user_id: data.userId,
        paddle_subscription_id: data.subscriptionId ?? null,
        paddle_transaction_id: data.transactionId,
        paddle_adjustment_id: adjustment?.id ?? null,
        kind: data.kind,
        amount_cents: check.amountCents,
        currency: data.currency,
        reason_code: data.reasonCode,
        reason_note: data.reasonNote?.trim() || null,
        status: adjustment?.status === "approved" ? "concluido" : "pendente",
        confirmed_at: adjustment?.status === "approved" ? new Date().toISOString() : null,
        environment: data.environment,
        requested_by: context.userId,
        metadata: { adjustment_status: adjustment?.status ?? null },
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("billing_events").insert({
      user_id: data.userId,
      event_type: "refund_requested",
      paddle_subscription_id: data.subscriptionId ?? null,
      status: "pendente",
      amount_cents: check.amountCents,
      currency: data.currency,
      environment: data.environment,
      metadata: { transaction_id: data.transactionId, reason: data.reasonCode },
    });

    return { ok: true as const, refund: inserted as unknown as RefundRecord };
  });

/** Cancela a subscrição de um cliente e regista o motivo. */
export const cancelSubscriptionAdminFn = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        environment: envSchema,
        subscriptionId: z.string().min(3).max(120),
        userId: z.string().uuid(),
        immediate: z.boolean().default(false),
        reasonCode: reasonSchema,
        reasonNote: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, cancelPaddleSubscription } = await import("@/lib/refunds.server");
    await assertAdmin(context.supabase, context.userId);
    if (data.reasonCode === "outro" && !data.reasonNote?.trim()) {
      return { ok: false as const, message: "Descreve o motivo quando escolhes “Outro”." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await cancelPaddleSubscription(data.environment, data.subscriptionId, data.immediate);

    const { error } = await supabaseAdmin.from("refunds").insert({
      user_id: data.userId,
      paddle_subscription_id: data.subscriptionId,
      kind: "cancelamento",
      amount_cents: 0,
      reason_code: data.reasonCode,
      reason_note: data.reasonNote?.trim() || null,
      status: data.immediate ? "concluido" : "pendente",
      confirmed_at: data.immediate ? new Date().toISOString() : null,
      environment: data.environment,
      requested_by: context.userId,
      metadata: { immediate: data.immediate },
    });
    if (error) throw new Error(error.message);

    return { ok: true as const };
  });

/** Marca reembolsos como já refletidos na contabilidade local. */
export const markRefundsAccountedFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/refunds.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("refunds")
      .update({ accounted_at: new Date().toISOString() })
      .in("id", data.ids)
      .is("accounted_at", null);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });