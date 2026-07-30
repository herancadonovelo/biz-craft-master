import { supabase } from "@/integrations/supabase/client";
import { consumeIntendedPath } from "@/components/AuthGate";

/**
 * Garante que existe uma linha em `profiles` para o utilizador autenticado
 * (o login social não passa pelo formulário de registo) e devolve o destino
 * correto conforme o estado da conta.
 */
export async function ensureProfileAndResolveDestination(): Promise<string> {
  const intended = consumeIntendedPath();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return intended || "/";

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = String(meta.full_name ?? meta.name ?? "").trim();
  const [metaFirst, ...metaRest] = fullName ? fullName.split(/\s+/) : [];

  const { data: existing } = await supabase
    .from("profiles")
    .select("onboarding_concluido, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert({
      user_id: user.id,
      first_name: (meta.given_name as string) || metaFirst || null,
      last_name: (meta.family_name as string) || (metaRest.length ? metaRest.join(" ") : null),
    });
    return "/onboarding";
  }

  // Completa nome em falta a partir dos dados da Google, sem sobrepor edições.
  const patch: { first_name?: string; last_name?: string } = {};
  if (!existing.first_name && ((meta.given_name as string) || metaFirst)) {
    patch.first_name = (meta.given_name as string) || metaFirst;
  }
  if (!existing.last_name && ((meta.family_name as string) || metaRest.join(" "))) {
    patch.last_name = (meta.family_name as string) || metaRest.join(" ");
  }
  if (Object.keys(patch).length) {
    await supabase.from("profiles").update(patch).eq("user_id", user.id);
  }

  if (!existing.onboarding_concluido) return "/onboarding";
  return intended || "/";
}
