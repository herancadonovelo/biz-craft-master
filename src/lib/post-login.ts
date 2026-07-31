import { supabase } from "@/integrations/supabase/client";
import { consumeIntendedPath } from "@/components/AuthGate";
import { useStore } from "@/lib/store";
import { languageForCountry, languageFromBrowser } from "@/lib/country-language";

const LANG_FLAG_KEY = "cbm-language-picked-v1";

/** Define o idioma da app a partir do país do perfil (uma única vez). */
function applyLanguageFromCountry(country?: string | null) {
  try {
    if (typeof window !== "undefined" && window.localStorage.getItem(LANG_FLAG_KEY)) return;
  } catch { /* noop */ }
  const idioma = country ? languageForCountry(country) : (languageFromBrowser() ?? "en");
  useStore.getState().setDesign({ idioma });
  try { window.localStorage.setItem(LANG_FLAG_KEY, "1"); } catch { /* noop */ }
}

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
    .select("onboarding_concluido, first_name, last_name, country")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const country = (meta.country as string) || null;
    await supabase.from("profiles").insert({
      user_id: user.id,
      first_name: (meta.given_name as string) || metaFirst || null,
      last_name: (meta.family_name as string) || (metaRest.length ? metaRest.join(" ") : null),
      country,
      onboarding_concluido: true,
    });
    applyLanguageFromCountry(country);
    return intended || "/";
  }

  applyLanguageFromCountry(existing.country);

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

  return intended || "/";
}
