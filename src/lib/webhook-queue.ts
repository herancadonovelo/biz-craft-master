// Fila em memória partilhada entre rotas. Persiste enquanto o Worker estiver vivo.
// (Para produção robusta seria preciso DB/KV; aqui ficamos com fila volátil.)
export type WebhookEvent =
  | { provider: "etsy"; id: string; payload: any; receivedAt: string }
  | { provider: "whatsapp"; id: string; payload: any; receivedAt: string };

const g = globalThis as any;
if (!g.__lovableWebhookQueue) g.__lovableWebhookQueue = [] as WebhookEvent[];
if (!g.__lovableWebhookSeen) g.__lovableWebhookSeen = new Set<string>();

export const queue: WebhookEvent[] = g.__lovableWebhookQueue;
export const seen: Set<string> = g.__lovableWebhookSeen;

export function pushEvent(ev: WebhookEvent) {
  if (seen.has(`${ev.provider}:${ev.id}`)) return false;
  seen.add(`${ev.provider}:${ev.id}`);
  queue.push(ev);
  // Mantém apenas os últimos 500
  if (queue.length > 500) queue.splice(0, queue.length - 500);
  return true;
}

export function drain(): WebhookEvent[] {
  const out = queue.splice(0, queue.length);
  return out;
}