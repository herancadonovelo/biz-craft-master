import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { IDIOMAS } from "@/lib/i18n";

const FLAG_KEY = "cbm-language-picked-v1";
// Splash screen tem MIN_DURATION de 7s; mostramos o seletor pouco depois.
const SHOW_DELAY_MS = 7800;

export function InitialLanguagePicker() {
  const [open, setOpen] = useState(false);
  const setDesign = useStore((s) => s.setDesign);
  const idioma = useStore((s) => s.design.idioma);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(FLAG_KEY)) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const pick = (code: string) => {
    setDesign({ idioma: code as any });
    try {
      window.localStorage.setItem(FLAG_KEY, "1");
    } catch {}
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) pick(idioma); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose your language</DialogTitle>
          <DialogDescription>
            Select the language you want to use across the entire app. You can change it later in Settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {IDIOMAS.map((l) => (
            <Button
              key={l.code}
              variant={l.code === idioma ? "default" : "outline"}
              onClick={() => pick(l.code)}
              className="justify-start gap-2"
            >
              <span className="text-lg leading-none">{l.flag}</span>
              <span>{l.label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}