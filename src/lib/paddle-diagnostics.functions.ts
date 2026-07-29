import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const envSchema = z.enum(["sandbox", "live"]);

export interface PriceCheck {
  externalId: string;
  found: boolean;
  paddleId: string | null;
  status: string | null;
  amount: string | null;
  currency: string | null;
}

export interface PaddleDiagnostics {
  environment: "sandbox" | "live";
  credentials: { apiKey: boolean; webhookSecret: boolean; lovableKey: boolean };
  connection: { ok: boolean; status: number | null; error: string | null };
  prices: PriceCheck[];
  webhookUrl: string;
  checkedAt: string;
}

export const REQUIRED_PRICE_IDS = [
  "base_monthly",
  "base_yearly",
  "premium_monthly",
  "premium_yearly",
] as const;

/** Verificação administrativa das credenciais, endpoints e catálogo do Paddle. */
export const paddleDiagnosticsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ environment: envSchema }).parse(d))
  .handler(async ({ context, data }): Promise<PaddleDiagnostics> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const env = data.environment;
    const credentials = {
      apiKey: !!process.env[env === "live" ? "PADDLE_LIVE_API_KEY" : "PADDLE_SANDBOX_API_KEY"],
      webhookSecret:
        !!process.env[
          env === "live" ? "PAYMENTS_LIVE_WEBHOOK_SECRET" : "PAYMENTS_SANDBOX_WEBHOOK_SECRET"
        ],
      lovableKey: !!process.env.LOVABLE_API_KEY,
    };

    const connection = { ok: false, status: null as number | null, error: null as string | null };
    const prices: PriceCheck[] = [];

    if (credentials.apiKey && credentials.lovableKey) {
      const { gatewayFetch } = await import("@/lib/paddle.server");
      try {
        const res = await gatewayFetch(env, "/products?status=active&per_page=1");
        connection.status = res.status;
        connection.ok = res.ok;
        if (!res.ok) connection.error = (await res.text()).slice(0, 300);
      } catch (e) {
        connection.error = e instanceof Error ? e.message : String(e);
      }

      for (const externalId of REQUIRED_PRICE_IDS) {
        try {
          const res = await gatewayFetch(
            env,
            `/prices?external_id=${encodeURIComponent(externalId)}`,
          );
          const json = res.ok ? await res.json() : null;
          const p = json?.data?.[0];
          prices.push({
            externalId,
            found: !!p,
            paddleId: p?.id ?? null,
            status: p?.status ?? null,
            amount: p?.unit_price?.amount ?? null,
            currency: p?.unit_price?.currency_code ?? null,
          });
        } catch {
          prices.push({
            externalId,
            found: false,
            paddleId: null,
            status: null,
            amount: null,
            currency: null,
          });
        }
      }
    }

    return {
      environment: env,
      credentials,
      connection,
      prices,
      webhookUrl:
        "https://project--4b0fb865-7bd5-4342-bb12-dd95f303fcc3.lovable.app/api/public/payments/webhook",
      checkedAt: new Date().toISOString(),
    };
  });