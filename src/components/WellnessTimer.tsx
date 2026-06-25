import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

/**
 * Conta minutos de uso ativo da app e mostra um alerta carinhoso de pausa.
 * O intervalo é lido de localStorage ("wellness.intervalMin"); 0 desativa.
 */
export function WellnessTimer() {
  const [open, setOpen] = useState(false);
  const seconds = useRef(0);
  const interval = useRef<number>(
    Number(typeof window !== "undefined" ? window.localStorage.getItem("wellness.intervalMin") : 0) || 0,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    const onVis = () => { active = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    const id = window.setInterval(() => {
      if (!active || !interval.current) return;
      seconds.current += 1;
      if (seconds.current >= interval.current * 60) {
        seconds.current = 0;
        setOpen(true);
      }
    }, 1000);
    const onStorage = () => {
      interval.current = Number(window.localStorage.getItem("wellness.intervalMin")) || 0;
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#fdf2f8] border-pink-200">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-pink-100 text-pink-500">
            <Heart className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Hora de uma pausa carinhosa 🌿</DialogTitle>
          <DialogDescription className="text-center">
            Já fizeste muitas carreiras seguidas! Que tal pousar a agulha por 5 minutos?
            Estica os braços, roda os pulsos e bebe um copo de água. O teu corpo e a tua mente agradecem.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Lembrar daqui a pouco</Button>
          <Button onClick={() => setOpen(false)} className="bg-pink-500 hover:bg-pink-600 text-white">Fazer pausa</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}