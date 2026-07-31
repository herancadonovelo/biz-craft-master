import { supabase } from "@/integrations/supabase/client";
import { consumeIntendedPath } from "@/components/AuthGate";
import { useStore, type Idioma } from "@/lib/store";
import { languageForCountry, languageFromBrowser } from "@/lib/country-language";

const LANG_FLAG_KEY = "cbm-language-picked-v1";

/** Guarda o idioma preferido no perfil, para ser reaplicado em qualquer login. */
export async function savePreferredLanguage(idioma: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("profiles").update({ preferred_language: idioma }).eq("user_id", data.user.id);
}

/**
 * Aplica o idioma do perfil. Se ainda não existir, deriva-o do país (ou do
 * browser) e persiste-o, para que qualquer login futuro use o mesmo idioma.
 */
async function applyPreferredLanguage(
  userId: string,
  saved?: string | null,
  country?: string | null,
) {
  if (saved) {
    useStore.getState().setDesign({ idioma: saved as Idioma });
    try { window.localStorage.setItem(LANG_FLAG_KEY, "1"); } catch { /* noop */ }
    return;
  }
  const idioma = country ? languageForCountry(country) : (languageFromBrowser() ?? "en");
  useStore.getState().setDesign({ idioma });
  try { window.localStorage.setItem(LANG_FLAG_KEY, "1"); } catch { /* noop */ }
  await supabase.from("profiles").update({ preferred_language: idioma }).eq("user_id", userId);
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
    .select("onboarding_concluido, first_name, last_name, country, preferred_language")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const country = (meta.country as string) || null;
    const idioma = country ? languageForCountry(country) : (languageFromBrowser() ?? "en");
    await supabase.from("profiles").insert({
      user_id: user.id,
      first_name: (meta.given_name as string) || metaFirst || null,
      last_name: (meta.family_name as string) || (metaRest.length ? metaRest.join(" ") : null),
      country,
      preferred_language: idioma,
      onboarding_concluido: true,
    });
    useStore.getState().setDesign({ idioma });
    try { window.localStorage.setItem(LANG_FLAG_KEY, "1"); } catch { /* noop */ }
    return intended || "/";
  }

  await applyPreferredLanguage(user.id, (existing as { preferred_language?: string | null }).preferred_language, existing.country);

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
