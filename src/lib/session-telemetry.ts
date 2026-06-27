import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type SessionEventType =
  | "session_expired"
  | "session_invalid"
  | "session_revoked_remote"
  | "session_revalidate_failed"
  | "session_revalidate_ok"
  | "session_signed_out"
  | "session_signed_in";

interface LogOpts {
  reason?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

export async function logSessionEvent(type: SessionEventType, opts: LogOpts = {}) {
  if (typeof window === "undefined") return;
  const payload = {
    event_type: type,
    reason: opts.reason ?? null,
    path: opts.path ?? window.location.pathname,
    user_agent: navigator.userAgent,
    metadata: (opts.metadata ?? null) as Json | null,
  };
  // Always console-trace for local diagnosis
  // eslint-disable-next-line no-console
  console.info("[session-telemetry]", type, payload);
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id ?? null;
    await supabase.from("session_events").insert({ ...payload, user_id: userId });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[session-telemetry] insert failed", err);
  }
}