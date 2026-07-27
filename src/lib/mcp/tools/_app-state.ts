import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

export type AppState = Record<string, any>;

export function supabaseForUser(ctx: ToolContext): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function loadState(ctx: ToolContext): Promise<{ state: AppState; supabase: SupabaseClient } | { error: string }> {
  if (!ctx.isAuthenticated()) return { error: "Not authenticated" };
  const supabase = supabaseForUser(ctx);
  const { data, error } = await supabase
    .from("app_state")
    .select("state")
    .eq("user_id", ctx.getUserId())
    .maybeSingle();
  if (error) return { error: error.message };
  return { state: (data?.state ?? {}) as AppState, supabase };
}

export async function saveState(
  supabase: SupabaseClient,
  userId: string,
  patch: AppState,
  current: AppState,
): Promise<string | null> {
  const merged = { ...current, ...patch };
  const { error } = await supabase
    .from("app_state")
    .upsert({ user_id: userId, state: merged }, { onConflict: "user_id" });
  return error?.message ?? null;
}

export function ok(data: unknown, structuredKey = "result") {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: { [structuredKey]: data } as Record<string, unknown>,
  };
}

export function fail(msg: string) {
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}