// Server-only helpers for the 2FA flow. Not imported from client code.

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

export type OtpErrorCode =
  | "invalid_otp"
  | "expired_otp"
  | "rate_limited"
  | "sms_provider_offline"
  | "phone_invalid_format"
  | "phone_already_taken"
  | "not_authenticated"
  | "unknown";

export function mapOtpError(err: unknown): { code: OtpErrorCode; message: string } {
  const msg = String((err as any)?.message ?? err ?? "").toLowerCase();
  if (msg.includes("expired")) return { code: "expired_otp", message: "O código expirou. Pede um novo." };
  if (msg.includes("invalid") && msg.includes("otp")) return { code: "invalid_otp", message: "Código inválido. Verifica os dígitos." };
  if (msg.includes("rate") || msg.includes("too many")) return { code: "rate_limited", message: "Muitas tentativas. Aguarda um minuto." };
  if (msg.includes("sms") || msg.includes("provider")) return { code: "sms_provider_offline", message: "Serviço de SMS temporariamente indisponível." };
  if (msg.includes("phone") && msg.includes("format")) return { code: "phone_invalid_format", message: "Formato de telemóvel inválido (ex: +351912345678)." };
  if (msg.includes("already")) return { code: "phone_already_taken", message: "Este número já está associado a outra conta." };
  if (msg.includes("not_authenticated")) return { code: "not_authenticated", message: "Sessão expirada. Volta a iniciar sessão." };
  return { code: "unknown", message: "Não foi possível processar o pedido. Tenta novamente." };
}