import { createFileRoute, useParams } from "@tanstack/react-router";
import * as React from "react";
import { TesterPanel } from "@/components/knit-editor/TesterPanel";
import { decodePackage } from "@/lib/knit/tester";

interface Pkg {
  titulo?: string;
  autora?: string;
  linhas: string[];
  tamanho?: string;
}

export const Route = createFileRoute("/receita-tester-tricot/$token")({
  head: () => ({
    meta: [
      { title: "Testar receita de tricô — Craft Business Master" },
      { name: "description", content: "Modo tester para receitas de tricô: contador, notas por carreira e envio de feedback." },
      { property: "og:title", content: "Testar receita de tricô — Craft Business Master" },
      { property: "og:description", content: "Modo tester colaborativo para receitas de tricô." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TesterTricotPage,
});

function TesterTricotPage() {
  const { token } = useParams({ from: "/receita-tester-tricot/$token" });
  const [pkg, setPkg] = React.useState<Pkg | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.location.hash.match(/[#&]pkg=([^&]+)/);
    if (m) setPkg(decodePackage<Pkg>(decodeURIComponent(m[1])));
  }, []);

  const linhas = pkg?.linhas ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4" data-testid="knit-tester-page">
      <header>
        <h1 className="font-display text-2xl">Modo Tester — Tricô</h1>
        {pkg?.titulo && <p className="text-sm text-muted-foreground">{pkg.titulo}{pkg.autora ? ` · por ${pkg.autora}` : ""}{pkg.tamanho ? ` · ${pkg.tamanho}` : ""}</p>}
        <p className="mt-2 text-xs text-muted-foreground">
          O teu progresso e notas ficam neste dispositivo. Exporta o JSON e envia à autora para consolidar.
        </p>
      </header>
      {linhas.length === 0 ? (
        <p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
          Link inválido ou expirado — pede à autora um novo pacote de teste.
        </p>
      ) : (
        <TesterPanel token={token} linhas={linhas} packagePayload={pkg} />
      )}
    </div>
  );
}