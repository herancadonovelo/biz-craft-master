import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// User-facing subscription/promo RPCs moved server-side so the underlying
// SECURITY DEFINER database functions are NOT executable by the `authenticated`
// role via PostgREST. Each server fn validates the session, then performs the
// privileged update using the service-role client (which bypasses RLS and the
// `protect_subscription_columns` trigger safely, since the caller identity is
// verified here).

export const cancelSubscriptionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ subscription_status: "light", subscription_trial_ends: null })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const startSubscriptionTrialFn = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      plan: z.enum(["base", "premium"]),
      cycle: z.enum(["mensal", "anual"]).default("mensal"),
    }).parse(d),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_status,subscription_trial_ends")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (profile?.subscription_status === "premium_vitalicio") {
      return { ok: false, message: "Já tens acesso vitalício." };
    }
    if (profile?.subscription_trial_ends && new Date(profile.subscription_trial_ends).getTime() > Date.now()) {
      return { ok: false, message: "Já tens um teste ativo." };
    }
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: data.plan,
        subscription_trial_ends: trialEnds,
        billing_cycle: data.cycle,
      })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, trial_ends: trialEnds };
  });

export const redeemPromoCodeFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().min(1).max(128) }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim();
    const { data: pc } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .ilike("code", code)
      .eq("active", true)
      .maybeSingle();
    if (!pc) return { ok: false, message: "Código inválido ou inativo." };
    if (pc.expires_at && new Date(pc.expires_at).getTime() < Date.now()) {
      return { ok: false, message: "Código expirado." };
    }
    const { data: mine } = await supabaseAdmin
      .from("promo_redemptions")
      .select("id")
      .eq("user_id", context.userId)
      .eq("promo_code_id", pc.id)
      .maybeSingle();
    if (mine) return { ok: false, message: "Já resgataste este código anteriormente." };
    if (pc.max_redemptions != null) {
      const { count } = await supabaseAdmin
        .from("promo_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("promo_code_id", pc.id);
      if ((count ?? 0) >= pc.max_redemptions) {
        return { ok: false, message: "Este código já foi ativado por outro utilizador e não pode ser reutilizado." };
      }
    }
    const { error: insErr } = await supabaseAdmin.from("promo_redemptions").insert({
      user_id: context.userId,
      promo_code_id: pc.id,
      code: pc.code,
      discount_percent: pc.discount_percent,
      is_lifetime: pc.is_lifetime,
    });
    if (insErr) throw new Error(insErr.message);
    if (pc.is_lifetime) {
      await supabaseAdmin
        .from("profiles")
        .update({ subscription_status: "premium_vitalicio", subscription_trial_ends: null })
        .eq("user_id", context.userId);
      return { ok: true, lifetime: true, code: pc.code, message: "Acesso vitalício ativado com sucesso." };
    }
    return { ok: true, lifetime: false, discount_percent: pc.discount_percent, code: pc.code, message: "Código aplicado." };
  });