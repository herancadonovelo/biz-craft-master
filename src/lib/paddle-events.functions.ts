import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface PaddleEventRow {
  id: string;
  event_id: string | null;
  event_type: string | null;
  environment: "sandbox" | "live";
  signature_verified: boolean;
  status: string;
  error_message: string | null;
  summary: Record<string, unknown>;
  acknowledged_at: string | null;
  created_at: string;
}

export const FALHAS = ["assinatura_invalida", "erro_processamento"];

/** Lista o registo de eventos do processador de pagamentos (só administração). */
export const listPaddleEventsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        environment: z.enum(["sandbox", "live", "todos"]).default("todos"),
        apenasFalhas: z.boolean().default(false),
        limite: z.number().int().min(1).max(200).default(100),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("paddle_event_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limite);
    if (data.environment !== "todos") query = query.eq("environment", data.environment);
    if (data.apenasFalhas) query = query.in("status", FALHAS);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const { count } = await context.supabase
      .from("paddle_event_log")
      .select("id", { count: "exact", head: true })
      .in("status", FALHAS)
      .is("acknowledged_at", null);

    return {
      events: (rows ?? []) as unknown as PaddleEventRow[],
      alertasAbertos: count ?? 0,
    };
  });

/** Marca uma falha como tratada (deixa de contar como alerta aberto). */
export const acknowledgePaddleEventFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("paddle_event_log")
      .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });