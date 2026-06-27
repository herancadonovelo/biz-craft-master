import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useFrases, sortearFrase } from "@/lib/frases-store";

/**
 * Cronómetro de ergonomia: dispara um pop-up de pausa a cada 60 min de atividade
 * (sempre que a aba está visível). Vibra brevemente ao abrir, para acessibilidade.
 * O intervalo pode ser sobreposto via localStorage "wellness.intervalMin".
 */
export function WellnessTimer() {
  const [open, setOpen] = useState(false);
  const seconds = useRef(0);
  const state = useFrases();

  const intervalMin = useMemo(() => {
    if (typeof window === "undefined") return 60;
    const v = Number(window.localStorage.getItem("wellness.intervalMin"));
    return Number.isFinite(v) && v > 0 ? v : 60;
  }, []);

  const fraseSaude = useMemo(() => {
    if (!open) return null;
    return sortearFrase(state, "saude");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = !document.hidden;
    const onVis = () => { active = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    const id = window.setInterval(() => {
      if (!active) return;
      seconds.current += 1;
      if (seconds.current >= intervalMin * 60) {
        seconds.current = 0;
        setOpen(true);
        // Vibração curta (acessibilidade)
        try { navigator.vibrate?.([200, 100, 200]); } catch {}
      }
    }, 1000);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [intervalMin]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gradient-to-br from-[#FFF1F3] via-[#FCE7E9] to-[#F5EFE6] border-pink-200 rounded-3xl">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full bg-pink-100 text-pink-500">
            <Heart className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-2xl">Hora de Cuidar de Ti! 🌸</DialogTitle>
          <DialogDescription asChild>
            <p
              className="mt-3 text-center text-stone-700 text-xl leading-snug"
              style={{ fontFamily: "'Caveat', 'Quicksand', cursive", fontWeight: 600 }}
            >
              <span className="mr-2 text-2xl">{fraseSaude?.emojis ?? "🌿"}</span>
              {fraseSaude?.texto ?? "Cuida das tuas mãos como cuidas das tuas peças — alonga, respira, hidrata."}
              <span className="ml-2 text-2xl">{fraseSaude?.emojis ?? "🌿"}</span>
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-2">
          <Button
            onClick={() => setOpen(false)}
            className="h-12 w-full rounded-full bg-rose-500 px-6 text-base text-white hover:bg-rose-600"
          >
            Já alonguei, voltar ao trabalho! 💪
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}