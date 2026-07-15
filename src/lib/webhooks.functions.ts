import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchPendingWebhookEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("webhook_events")
      .select("id, provider, external_id, payload, received_at")
      .is("processed_at", null)
      .order("received_at", { ascending: true })
      .limit(50);
    if (error) throw error;
    return { events: data ?? [] };
  });

export const markWebhookEventProcessed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listWebhookTenantMappings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("webhook_tenant_map")
      .select("id, provider, tenant_key, updated_at");
    if (error) throw error;
    return { mappings: data ?? [] };
  });

export const upsertWebhookTenantMapping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: "etsy" | "whatsapp"; tenant_key: string }) => {
    if (data.provider !== "etsy" && data.provider !== "whatsapp") throw new Error("invalid provider");
    const key = String(data.tenant_key || "").trim();
    if (!key) throw new Error("tenant_key required");
    return { provider: data.provider, tenant_key: key };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("webhook_tenant_map")
      .upsert(
        { user_id: context.userId, provider: data.provider, tenant_key: data.tenant_key },
        { onConflict: "provider,tenant_key" },
      );
    if (error) throw error;
    return { ok: true };
  });

export const deleteWebhookTenantMapping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("webhook_tenant_map")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });