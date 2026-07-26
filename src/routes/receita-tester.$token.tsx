import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AmigurumiTesterView } from "@/components/amigurumi-editor/AmigurumiTester";

export const Route = createFileRoute("/receita-tester/$token")({
  head: () => ({
    meta: [
      { title: "Testar receita — Craft Business Master" },
      { name: "description", content: "Modo tester: revê carreira a carreira e envia comentários à autora." },
      { property: "og:title", content: "Testar receita — Craft Business Master" },
      { property: "og:description", content: "Modo tester colaborativo para receitas de amigurumi e crochê." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TesterPage,
});

function TesterPage() {
  const { token } = useParams({ from: "/receita-tester/$token" });
  const [hashData, setHashData] = useState<string | undefined>();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash;
    const m = h.match(/[#&]d=([^&]+)/);
    if (m) setHashData(decodeURIComponent(m[1]));
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 font-display text-2xl">Modo Tester</h1>
      <p className="mb-4 text-xs text-muted-foreground">
        Os teus comentários ficam neste dispositivo. Exporta o JSON e envia à autora
        para consolidar as correções na receita.
      </p>
      <AmigurumiTesterView token={token} hashData={hashData} />
    </div>
  );
}