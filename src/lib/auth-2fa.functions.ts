import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server fn wrappers. Real OTP send/verify is done via supabase-js on the
// client (it already scopes to the current user's session), so these fns
// only cover privileged bookkeeping: record attempts + mark 2FA session flag.

export const logOtpAttemptFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      kind: z.enum(["login", "enroll", "send", "verify"]),
      phone: z.string().max(20).optional(),
      success: z.boolean(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("auth_otp_attempts").insert({
      user_id: context.userId,
      kind: data.kind,
      phone: data.phone ?? null,
      success: data.success,
    });
    return { ok: !error };
  });

export const mark2faCompletedFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.rpc("mark_2fa_completed");
    return { ok: !error, error: error?.message };
  });

// Returns whether the current session has completed 2FA recently (24h window)
// AND whether the user has a verified phone at all.
export const get2faStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("phone, phone_verified, phone_verified_at, last_2fa_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    const last = data?.last_2fa_at ? new Date(data.last_2fa_at).getTime() : 0;
    const fresh = last > Date.now() - 24 * 60 * 60 * 1000;
    return {
      ok: true as const,
      phoneVerified: !!data?.phone_verified,
      phoneMasked: data?.phone ? maskPhone(data.phone) : null,
      needsChallenge: !!data?.phone_verified && !fresh,
      needsEnroll: !data?.phone_verified,
    };
  });

function maskPhone(p: string): string {
  if (p.length < 6) return p;
  return p.slice(0, 4) + " •• •• " + p.slice(-3);
}