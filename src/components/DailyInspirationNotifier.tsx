import { useEffect } from "react";
import { useFrases, sortearFrase } from "@/lib/frases-store";

/**
 * Notificação local diária com uma frase motivacional.
 * - Pede permissão ao utilizador na 1ª visita (silencioso, sem prompt visual extra).
 * - Agenda o envio para as 09:00 todos os dias; garante apenas 1 por dia (via localStorage).
 */
export function DailyInspirationNotifier() {
  const state = useFrases();

  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;

    // 1ª permissão (passiva)
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const KEY = "daily-inspiration-last";
    const dispararSeForHora = () => {
      if (Notification.permission !== "granted") return;
      const agora = new Date();
      const hojeStr = agora.toISOString().slice(0, 10);
      const ultima = window.localStorage.getItem(KEY);
      if (ultima === hojeStr) return;
      // Só dispara após as 09:00 locais
      if (agora.getHours() < 9) return;

      const f = sortearFrase(state);
      try {
        new Notification("Crafts Business Master", {
          body: `A tua inspiração para hoje: ${f.emojis} ${f.texto}`,
          icon: "/favicon.ico",
          tag: "daily-inspiration",
        });
        window.localStorage.setItem(KEY, hojeStr);
      } catch {}
    };

    dispararSeForHora();
    const id = window.setInterval(dispararSeForHora, 60 * 1000); // checa a cada minuto
    return () => window.clearInterval(id);
  }, [state]);

  return null;
}