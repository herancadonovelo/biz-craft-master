import { useEffect, useState } from "react";
import logo from "@/assets/craft-business-master-logo.png.asset.json";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFading(true), 6300);
    const removeTimer = window.setTimeout(() => setVisible(false), 7000);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ease-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: "oklch(0.985 0.005 95)" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <img
          src={logo.url}
          alt="Craft Business Master"
          className="w-56 max-w-[70vw] select-none animate-in fade-in zoom-in-95 duration-700"
          draggable={false}
        />
        <div
          className="h-1 w-40 overflow-hidden rounded-full bg-foreground/10"
          role="progressbar"
          aria-label="A carregar"
        >
          <div className="h-full w-1/3 animate-[splash-slide_1.2s_ease-in-out_infinite] rounded-full bg-foreground/50" />
        </div>
      </div>
      <footer className="pb-[max(1.25rem,env(safe-area-inset-bottom))] px-6 text-center">
        <p className="font-display text-[11px] tracking-wide text-foreground/55">
          © 2026 Crafts Business Master. All rights reserved to Craft Mistress.
        </p>
      </footer>
      <style>{`
        @keyframes splash-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}