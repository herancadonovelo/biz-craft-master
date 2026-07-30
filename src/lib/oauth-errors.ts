export type OAuthErrorKind = "error" | "info";

/**
 * Traduz erros do fluxo OAuth (Google) em mensagens claras para o utilizador.
 * `kind: "info"` = cancelamento/ação do utilizador (não é falha real).
 */
export function mapOAuthError(message: string): { text: string; kind: OAuthErrorKind } {
  const m = (message || "").toLowerCase();
  if (
    m.includes("cancel") ||
    m.includes("closed") ||
    m.includes("popup") ||
    m.includes("user_denied") ||
    m.includes("access_denied")
  ) {
    return { text: "Login com Google cancelado. A tua sessão atual não foi alterada.", kind: "info" };
  }
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("timeout")) {
    return { text: "Falha de rede durante o login Google. Verifica a ligação e tenta de novo.", kind: "error" };
  }
  if (m.includes("redirect")) {
    return { text: "URL de redirecionamento não autorizado para o login Google. Contacta o suporte.", kind: "error" };
  }
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) {
    return { text: "O login com Google ainda não está ativo. Usa email e palavra-passe ou contacta o suporte.", kind: "error" };
  }
  if (m.includes("unauthorized") || m.includes("forbidden")) {
    return { text: "A Google recusou o acesso a esta conta. Verifica as permissões e tenta novamente.", kind: "error" };
  }
  if (m.includes("email") && m.includes("exist")) {
    return { text: "Já existe uma conta com este email. Entra com email e palavra-passe.", kind: "error" };
  }
  return {
    text: `Não foi possível concluir o login com Google${message ? `: ${message}` : ""}. Tenta novamente ou usa email e palavra-passe.`,
    kind: "error",
  };
}
