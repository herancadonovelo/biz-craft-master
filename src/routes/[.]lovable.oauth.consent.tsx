import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveIntendedPath } from "@/components/AuthGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Minimal local typing for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string; client_id?: string; redirect_uris?: string[] } | null;
  scope?: string;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
};
function oauthClient(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Session lives in localStorage; the SSR pass has no session and would
  // bounce every signed-in user to /auth.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      // Preserve the full consent URL so the user returns here with the same authorization_id.
      const returnTo = location.pathname + location.searchStr;
      saveIntendedPath(returnTo);
      throw redirect({ to: "/auth" });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthClient().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader><CardTitle>Não foi possível carregar o pedido</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {String((error as Error)?.message ?? error)}
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "esta aplicação";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauthClient().approveAuthorization(authorization_id)
      : await oauthClient().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("O servidor de autorização não devolveu um URL de redirecionamento."); return; }
    window.location.href = target;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/30">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Ligar {clientName} à tua conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            <strong>{clientName}</strong> vai poder usar as ferramentas do Craft Business Master
            em teu nome, enquanto tiveres sessão iniciada.
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Ler o teu perfil (nome, plano, moeda preferida).</li>
            <li>Resgatar códigos promocionais na tua conta, se pedires.</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Isto não contorna as permissões da app nem as políticas de segurança da base de dados
            (RLS). Podes revogar o acesso a qualquer momento nas definições de conta.
          </p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" disabled={busy} onClick={() => decide(false)}>Cancelar ligação</Button>
            <Button disabled={busy} onClick={() => decide(true)}>Aprovar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}