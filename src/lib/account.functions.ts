import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Hard-delete the authenticated user. All data linked via
 * `ON DELETE CASCADE` to `auth.users` is removed automatically by Postgres.
 */
export const deleteMyAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Cancela primeiro qualquer subscrição ativa — apagar a conta não pára a
    // cobrança no processador de pagamentos, e o registo local desaparece com
    // o utilizador (cascade), impossibilitando o cancelamento posterior.
    const { cancelUserPaddleSubscriptions } = await import("@/lib/billing.server");
    const res = await cancelUserPaddleSubscriptions(context.userId, "immediately");
    if (res.failed.length) {
      throw new Error(
        "Tens uma subscrição ativa que não conseguimos cancelar automaticamente. Cancela a subscrição em Planos e tenta novamente.",
      );
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, canceledSubscriptions: res.canceled.length };
  });