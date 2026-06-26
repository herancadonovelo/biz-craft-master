import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/marketing")({
  beforeLoad: () => { throw redirect({ to: "/marketing-conteudo" }); },
});