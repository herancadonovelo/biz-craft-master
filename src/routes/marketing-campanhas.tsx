import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/marketing-campanhas")({
  beforeLoad: () => { throw redirect({ to: "/marketing-conteudo" }); },
});