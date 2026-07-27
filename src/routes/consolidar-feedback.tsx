import { createFileRoute } from "@tanstack/react-router";
import { PremiumRoute } from "@/components/PremiumRoute";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackConsolidator } from "@/components/knit-editor/FeedbackConsolidator";

export const Route = createFileRoute("/consolidar-feedback")({
  head: () => ({
    meta: [
      { title: "Consolidar Feedback dos Testers — Craft Business Master" },
      { name: "description", content: "Importa vários JSONs de feedback de testers e vê o resumo agregado com heatmap de carreiras problemáticas." },
      { property: "og:title", content: "Consolidar Feedback dos Testers" },
      { property: "og:description", content: "Consolida notas, consumo e tamanhos dos testers para refinar a tua receita." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PremiumRoute feature="Consolidação de Feedback de Testers">
      <ConsolidarFeedbackPage />
    </PremiumRoute>
  ),
});

function ConsolidarFeedbackPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <PageHeader
        title="Consolidar Feedback dos Testers"
        description="Importa os JSONs enviados pelas testers e obtém um resumo agregado das notas, tamanhos e consumo real."
      />
      <FeedbackConsolidator />
    </div>
  );
}