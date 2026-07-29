import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldAlert, ExternalLink } from "lucide-react";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { isAdminFn } from "@/lib/refunds.functions";
import { getPaddleEnvironment } from "@/lib/paddle";

export const Route = createFileRoute("/guia-teste-live")({
  head: () => ({
    meta: [
      { title: "Guia do Teste em Modo Real — Craft Business Master" },
      {
        name: "description",
        content:
          "Passo a passo para validar uma compra real depois de publicar: diagnóstico, pagamento, recibo e reembolso.",
      },
      { property: "og:title", content: "Guia do Teste em Modo Real" },
      {
        property: "og:description",
        content: "Checklist administrativa para confirmar pagamentos reais ponta a ponta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuiaTesteLivePage,
});

interface Passo {
  id: string;
  titulo: string;
  descricao: string;
  to?: string;
  linkLabel?: string;
}

const PASSOS: Passo[] = [
  {
    id: "publicar",
    titulo: "1. Publicar a aplicação",
    descricao:
      "O modo real só funciona no site publicado. Na pré-visualização o checkout corre sempre em ambiente de teste.",
  },
  {
    id: "diagnostico",
    titulo: "2. Verificar credenciais e preços",
    descricao:
      "Corre a verificação no separador «Pagamentos reais». Devem ficar verdes: chave de API, segredo de assinatura, ligação e os quatro preços (base/premium × mensal/anual).",
    to: "/diagnostico-pagamentos",
    linkLabel: "Abrir Diagnóstico de Pagamentos",
  },
  {
    id: "compra",
    titulo: "3. Fazer uma compra real de valor baixo",
    descricao:
      "No site publicado, subscreve o plano Base mensal com um cartão real teu. Em modo real os cartões de teste não são aceites — só funcionam no ambiente de teste (ex.: 4242 4242 4242 4242).",
    to: "/planos",
    linkLabel: "Abrir Planos",
  },
  {
    id: "pagamento",
    titulo: "4. Confirmar o estado do pagamento",
    descricao:
      "O pagamento deve passar de «Pendente» a «Pago» automaticamente, sem recarregar a página.",
    to: "/pagamentos",
    linkLabel: "Abrir Estado dos Pagamentos",
  },
  {
    id: "assinatura",
    titulo: "5. Confirmar a assinatura ativa",
    descricao:
      "O plano deve subir imediatamente e a subscrição deve aparecer ativa com a próxima data de cobrança.",
    to: "/minha-subscricao",
    linkLabel: "Abrir A Minha Subscrição",
  },
  {
    id: "recibo",
    titulo: "6. Confirmar o recibo",
    descricao:
      "Deve ser gerado um recibo com número e valor, e enviado por email para o endereço da conta.",
    to: "/recibos",
    linkLabel: "Abrir Recibos & Comprovativos",
  },
  {
    id: "reembolso",
    titulo: "7. Emitir o reembolso de teste",
    descricao:
      "Emite o reembolso total da transação e indica o motivo. O estado deve evoluir para «Concluído».",
    to: "/gestao-reembolsos",
    linkLabel: "Abrir Reembolsos & Cancelamentos",
  },
  {
    id: "meus-reembolsos",
    titulo: "8. Confirmar o reembolso do lado do cliente",
    descricao:
      "O reembolso deve aparecer no histórico do utilizador com ligação ao pagamento e ao recibo.",
    to: "/meus-reembolsos",
    linkLabel: "Abrir Os Meus Reembolsos",
  },
  {
    id: "auditoria",
    titulo: "9. Auditar os eventos recebidos",
    descricao:
      "Confirma que cada evento (assinatura, transação, ajuste) foi recebido com assinatura verificada, em ambiente «Real» e sem falhas.",
    to: "/auditoria-pagamentos",
    linkLabel: "Abrir Auditoria de Eventos",
  },
];

const STORAGE_KEY = "guia-teste-live:concluidos";

function GuiaTesteLivePage() {
  const checkAdmin = useAuthedServerFn(isAdminFn);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [feitos, setFeitos] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const r = await checkAdmin({});
      setAdmin(!!r?.admin);
    })().catch(() => setAdmin(false));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFeitos(JSON.parse(raw));
    } catch {
      /* ignora */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) => {
    setFeitos((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignora */
      }
      return next;
    });
  };

  if (admin === null) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A verificar permissões…
      </div>
    );
  }

  if (!admin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">Esta área é reservada à administração da conta.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guia do Teste em Modo Real"
        description="Checklist passo a passo para confirmar, depois de publicar, que uma compra real atualiza assinatura, recibo e reembolso."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">
          Ambiente ativo nesta sessão: {getPaddleEnvironment() === "live" ? "Real" : "Teste"}
        </Badge>
        <Badge variant="secondary">
          {feitos.length}/{PASSOS.length} passos concluídos
        </Badge>
      </div>

      <div className="space-y-3">
        {PASSOS.map((p) => (
          <Card key={p.id} className={feitos.includes(p.id) ? "border-emerald-500/40" : undefined}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-start gap-3 text-base">
                <Checkbox
                  checked={feitos.includes(p.id)}
                  onCheckedChange={() => toggle(p.id)}
                  aria-label={`Marcar passo concluído: ${p.titulo}`}
                  className="mt-0.5"
                />
                <span>{p.titulo}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pl-12">
              <p className="text-sm text-muted-foreground">{p.descricao}</p>
              {p.to && (
                <Button asChild variant="outline" size="sm">
                  <Link to={p.to}>
                    {p.linkLabel} <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Se algo não atualizar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Abre a{" "}
            <Link to="/auditoria-pagamentos" className="underline">
              auditoria de eventos
            </Link>{" "}
            e filtra por «Só falhas». Assinatura inválida significa que o segredo configurado no
            processador não coincide com o da aplicação.
          </p>
          <p>
            Sem eventos nenhuns, o endereço de notificações no processador está errado: tem de
            terminar em <code>/api/public/payments/webhook?env=live</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}