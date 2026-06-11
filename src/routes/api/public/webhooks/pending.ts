import { createFileRoute } from "@tanstack/react-router";
import { drain } from "@/lib/webhook-queue";

// O cliente faz polling deste endpoint para puxar eventos pendentes e aplicar
// localmente. A idempotência é dupla: no servidor (seen set) e no cliente
// (state.webhooksProcessados).
export const Route = createFileRoute("/api/public/webhooks/pending")({
  server: {
    handlers: {
      GET: async () => Response.json({ events: drain() }),
    },
  },
});