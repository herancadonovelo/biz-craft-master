// Fase 6 — persistência do feedback dos testers no backend.
// A autora regista o link de teste (autenticada) e as testers enviam o
// feedback por uma função pública validada pelo token do link.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const notaSchema = z.object({
  row: z.number().int().min(0).max(100000),
  autor: z.string().max(80).default("tester"),
  texto: z.string().max(2000),
  ts: z.number().optional(),
  tipo: z.enum(["erro", "sugestao", "tamanho", "consumo"]),
});

const submitSchema = z.object({
  token: z.string().min(4).max(200),
  autor: z.string().trim().min(1).max(80).default("tester"),
  atual: z.number().int().min(0).max(100000).default(1),
  totalRows: z.number().int().min(1).max(100000).default(1),
  concluido: z.boolean().default(false),
  consumoRealG: z.number().min(0).max(1000000).optional().nullable(),
  tamanhoUsado: z.string().max(40).optional().nullable(),
  notas: z.array(notaSchema).max(500).default([]),
});

export const registerTesterLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      token: z.string().min(4).max(200),
      titulo: z.string().max(200).optional().nullable(),
      totalRows: z.number().int().min(1).max(100000).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("knit_tester_links")
      .upsert(
        {
          user_id: context.userId,
          token: data.token,
          titulo: data.titulo ?? null,
          total_rows: data.totalRows ?? null,
        },
        { onConflict: "token" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitTesterFeedback = createServerFn({ method: "POST" })
  .inputValidator((input) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error: linkError } = await supabaseAdmin
      .from("knit_tester_links")
      .select("id")
      .eq("token", data.token)
      .maybeSingle();
    if (linkError) throw new Error(linkError.message);
    if (!link) return { ok: false as const, message: "link_not_found" };

    const { error } = await supabaseAdmin.from("knit_tester_feedback").upsert(
      {
        link_id: link.id,
        token: data.token,
        autor: data.autor,
        atual: data.atual,
        total_rows: data.totalRows,
        concluido: data.concluido,
        consumo_real_g: data.consumoRealG ?? null,
        tamanho_usado: data.tamanhoUsado ?? null,
        notas: data.notas,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "link_id,autor" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listTesterFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("knit_tester_feedback")
      .select("id, token, autor, atual, total_rows, concluido, consumo_real_g, tamanho_usado, notas, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const deleteTesterFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("knit_tester_feedback")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });