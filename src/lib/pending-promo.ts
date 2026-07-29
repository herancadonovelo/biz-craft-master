/**
 * Código promocional introduzido durante a criação de conta.
 *
 * O resgate exige sessão autenticada (a função `redeem_promo_code` usa
 * `auth.uid()`), mas no registo ainda não existe sessão — o email tem de ser
 * confirmado primeiro. Por isso guardamos o código localmente e aplicamo-lo
 * automaticamente assim que o utilizador entra pela primeira vez.
 */
const KEY = "cbm:pendingPromoCode";

/** Formato aceite: letras, números, hífen e underscore (máx. 40). */
export const PROMO_CODE_PATTERN = /^[A-Za-z0-9_-]{3,40}$/;

export function normalizePromoCode(raw: string) {
  return raw.trim().toUpperCase();
}

export function savePendingPromoCode(code: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizePromoCode(code);
  if (!PROMO_CODE_PATTERN.test(normalized)) return;
  try { window.localStorage.setItem(KEY, normalized); } catch { /* storage indisponível */ }
}

export function readPendingPromoCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v && PROMO_CODE_PATTERN.test(v) ? v : null;
  } catch { return null; }
}

export function clearPendingPromoCode() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(KEY); } catch { /* storage indisponível */ }
}
