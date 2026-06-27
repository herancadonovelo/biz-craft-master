import { useEffect, useState } from "react";
import { Heart, ThumbsUp, ThumbsDown, Dices, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFrases, sortearFrase } from "@/lib/frases-store";
import type { Frase } from "@/lib/frases";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  /** Variante visual: dashboard (compacta) ou hero (ecrã grande) */
  variant?: "dashboard" | "hero";
  className?: string;
}

export function InspirationCard({ variant = "dashboard", className }: Props) {
  const state = useFrases();
  const [frase, setFrase] = useState<Frase | null>(null);
  const [fade, setFade] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFrase(sortearFrase(state));
    // sortear apenas no mount; mudanças de estado não devem reescolher automaticamente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const girar = () => {
    setFade(false);
    window.setTimeout(() => {
      setFrase(sortearFrase(state, undefined, frase?.id));
      setFade(true);
    }, 180);
  };

  const copiar = async () => {
    if (!frase) return;
    try {
      await navigator.clipboard.writeText(`${frase.emojis} ${frase.texto} ${frase.emojis}`);
      setCopied(true);
      toast.success("Frase copiada!");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  if (!frase) return null;
  const isFav = state.favoritas.includes(frase.id);
  const isLike = state.likes.includes(frase.id);
  const isDislike = state.dislikes.includes(frase.id);

  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-pink-200/60 px-6 py-6 sm:px-10 sm:py-8 shadow-sm",
        "bg-gradient-to-br from-[#FFF1F3] via-[#FCE7E9] to-[#F5EFE6]",
        isHero && "py-10 sm:py-16",
        className,
      )}
    >
      <div
        className={cn(
          "transition-opacity duration-300",
          fade ? "opacity-100" : "opacity-0",
        )}
      >
        <p
          className={cn(
            "text-center text-stone-700",
            isHero
              ? "text-3xl sm:text-5xl leading-snug"
              : "text-xl sm:text-2xl leading-snug",
          )}
          style={{ fontFamily: "'Caveat', 'Quicksand', cursive", fontWeight: 600 }}
        >
          <span className="mr-2 text-2xl sm:text-3xl">{frase.emojis}</span>
          {frase.texto}
          <span className="ml-2 text-2xl sm:text-3xl">{frase.emojis}</span>
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => state.toggleFavorita(frase.id)}
          className={cn(
            "h-10 w-10 rounded-full bg-white/70 hover:bg-white",
            isFav && "text-rose-500",
          )}
          aria-label="Favorito"
          title="Favorito"
        >
          <Heart className={cn("h-5 w-5", isFav && "fill-rose-500")} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => state.toggleLike(frase.id)}
          className={cn(
            "h-10 w-10 rounded-full bg-white/70 hover:bg-white",
            isLike && "text-emerald-600",
          )}
          aria-label="Gosto"
          title="Gosto"
        >
          <ThumbsUp className={cn("h-5 w-5", isLike && "fill-emerald-500")} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            state.toggleDislike(frase.id);
            toast("Frase banida. Não voltará a aparecer.", { icon: "🚫" });
            girar();
          }}
          className={cn(
            "h-10 w-10 rounded-full bg-white/70 hover:bg-white",
            isDislike && "text-stone-700",
          )}
          aria-label="Não gosto"
          title="Não gosto"
        >
          <ThumbsDown className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          onClick={girar}
          className={cn(
            "h-10 gap-2 rounded-full bg-rose-500 px-5 text-white hover:bg-rose-600",
            isHero && "h-12 px-7 text-base animate-pulse",
          )}
        >
          <Dices className="h-4 w-4" /> Girar a Sorte
        </Button>
        {isHero && (
          <Button
            type="button"
            variant="outline"
            onClick={copiar}
            className="h-10 gap-2 rounded-full bg-white/80"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copiar frase
          </Button>
        )}
      </div>
    </div>
  );
}