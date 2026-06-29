import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { exchangeCode } from "@/lib/spotify";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/spotify-callback")({
  head: () => ({ meta: [{ title: "Spotify — A ligar..." }] }),
  component: Callback,
});

function Callback() {
  const nav = useNavigate();
  const clientId = useStore((s) => s.design.spotifyClientId || "");
  const [msg, setMsg] = useState("A processar autorização do Spotify…");
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const err = url.searchParams.get("error");
    if (err) { setMsg("Autorização recusada: " + err); return; }
    if (!code || !state) { setMsg("Resposta inválida do Spotify"); return; }
    if (!clientId) { setMsg("Client ID em falta. Volta às definições do Atelier Sounds."); return; }
    exchangeCode(clientId, code, state)
      .then(() => { setMsg("Ligado! A redirecionar…"); setTimeout(() => nav({ to: "/atelier-sounds" }), 600); })
      .catch((e) => setMsg("Falha: " + e.message));
  }, [clientId, nav]);
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md rounded-lg border bg-card p-6 text-center text-sm">{msg}</div>
    </div>
  );
}