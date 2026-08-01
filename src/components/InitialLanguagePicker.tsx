import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore, type Idioma } from "@/lib/store";
import { IDIOMAS } from "@/lib/i18n";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { savePreferredLanguage } from "@/lib/post-login";

const FLAG_KEY = "cbm-language-picked-v1";
const SHOW_DELAY_MS = 7800;

const TITLE: Record<Idioma, string> = {
  pt: "Escolhe o teu idioma",
  en: "Choose your language",
  es: "Elige tu idioma",
  fr: "Choisis ta langue",
  de: "Wähle deine Sprache",
  it: "Scegli la tua lingua",
};
const SUBTITLE: Record<Idioma, string> = {
  pt: "Este será o idioma usado em toda a aplicação. Podes alterá-lo depois nas definições.",
  en: "This will be the language used across the whole app. You can change it later in Settings.",
  es: "Este será el idioma en toda la aplicación. Puedes cambiarlo después en Ajustes.",
  fr: "Ce sera la langue utilisée dans toute l'application. Modifiable ensuite dans Paramètres.",
  de: "Diese Sprache wird in der gesamten App verwendet. Später in den Einstellungen änderbar.",
  it: "Sarà la lingua usata in tutta l'app. Modificabile in Impostazioni.",
};
const CONFIRM: Record<Idioma, string> = {
  pt: "Selecionar idioma",
  en: "Select language",
  es: "Seleccionar idioma",
  fr: "Sélectionner la langue",
  de: "Sprache auswählen",
  it: "Seleziona lingua",
};

export function InitialLanguagePicker() {
  const [visible, setVisible] = useState(false);
  const setDesign = useStore((s) => s.setDesign);
  const idiomaAtual = useStore((s) => s.design.idioma);
  const [preview, setPreview] = useState<Idioma>(idiomaAtual);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(FLAG_KEY)) return;
    } catch { return; }
    // Skip in automated browsers (Playwright/WebDriver) to avoid intercepting
    // pointer events across the whole E2E suite. Individual E2E tests can
    // still exercise the picker explicitly by clearing navigator.webdriver.
    try {
      if (typeof navigator !== "undefined" && (navigator as { webdriver?: boolean }).webdriver) return;
    } catch { /* noop */ }
    const t = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  const confirm = () => {
    setDesign({ idioma: preview });
    // Persiste no perfil quando já existe sessão, para ser reaplicado em
    // qualquer login futuro (no-op quando ainda não há utilizador).
    void savePreferredLanguage(preview);
    try { window.localStorage.setItem(FLAG_KEY, "1"); } catch {}
    setVisible(false);
    // Redirect to /auth for first-time flow (unless already on a public/auth route).
    if (!pathname.startsWith("/auth") && pathname !== "/reset-password") {
      navigate({ to: "/auth", replace: true });
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-background/95 backdrop-blur px-6 py-10 overflow-auto">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold">{TITLE[preview]}</h1>
          <p className="text-sm text-muted-foreground">{SUBTITLE[preview]}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {IDIOMAS.map((l) => (
            <Button
              key={l.code}
              variant={l.code === preview ? "default" : "outline"}
              onClick={() => setPreview(l.code)}
              className="justify-start gap-2 h-11"
            >
              <span className="text-lg leading-none">{l.flag}</span>
              <span>{l.label}</span>
            </Button>
          ))}
        </div>
        <Button className="w-full h-12 text-base" onClick={confirm}>
          {CONFIRM[preview]}
        </Button>
      </div>
    </div>
  );
}