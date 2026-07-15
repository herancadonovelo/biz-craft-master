import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-state";
import { useStore } from "@/lib/store";
import { fetchPendingWebhookEvents, markWebhookEventProcessed } from "@/lib/webhooks.functions";

const POLL_MS = 15000;

export function WebhookPoller() {
  const { user } = useAuth();
  const fetchEvents = useServerFn(fetchPendingWebhookEvents);
  const markProcessed = useServerFn(markWebhookEventProcessed);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const tick = async () => {
      if (inFlight.current || cancelled) return;
      inFlight.current = true;
      try {
        const { events } = await fetchEvents();
        for (const ev of events) {
          if (cancelled) break;
          try {
            const state = useStore.getState();
            if (ev.provider === "etsy") {
              state.processarWebhookEtsy(ev.payload as any);
            } else if (ev.provider === "whatsapp") {
              state.processarWebhookWhatsapp(ev.payload as any);
            }
          } catch (err) {
            console.error("[WebhookPoller] processor error", err);
          }
          try {
            await markProcessed({ data: { id: ev.id } });
          } catch (err) {
            console.error("[WebhookPoller] mark processed failed", err);
          }
        }
      } catch (err) {
        // Silent: transient failures shouldn't spam the UI.
        console.debug("[WebhookPoller] poll failed", err);
      } finally {
        inFlight.current = false;
      }
    };

    void tick();
    const iv = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, [user, fetchEvents, markProcessed]);

  return null;
}