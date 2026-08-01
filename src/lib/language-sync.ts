import { useEffect } from "react";
import { useStore, type Idioma } from "@/lib/store";
import { languageForCountry, languageFromBrowser } from "@/lib/country-language";

const CHANNEL_NAME = "cbm-language-sync";
const PING_KEY = "cbm-language-sync-ping";

export type LanguageMessage = { idioma: Idioma; auto: boolean; at: number };

/** Idioma automático: país do perfil quando existe, senão o do browser. */
export function resolveAutoLanguage(country?: string | null): Idioma {
  return country ? languageForCountry(country) : (languageFromBrowser() ?? "en");
}

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return null;
  }
}

/**
 * Propaga a escolha de idioma a todos os separadores abertos, sem exigir
 * recarregamento nem limpeza de dados. Usa BroadcastChannel e, como
 * alternativa em browsers sem suporte, um evento `storage`.
 */
export function broadcastLanguage(idioma: Idioma, auto: boolean) {
  const msg: LanguageMessage = { idioma, auto, at: Date.now() };
  const ch = getChannel();
  try {
    ch?.postMessage(msg);
  } catch { /* noop */ }
  ch?.close();
  try {
    window.localStorage.setItem(PING_KEY, JSON.stringify(msg));
  } catch { /* noop */ }
}

/** Aplica localmente + propaga. */
export function setLanguageEverywhere(idioma: Idioma, auto = false) {
  useStore.getState().setDesign({ idioma, idiomaAuto: auto });
  broadcastLanguage(idioma, auto);
}

function applyMessage(raw: unknown) {
  const msg = raw as LanguageMessage | null;
  if (!msg || typeof msg.idioma !== "string") return;
  const current = useStore.getState().design;
  if (current.idioma === msg.idioma && !!current.idiomaAuto === !!msg.auto) return;
  useStore.getState().setDesign({ idioma: msg.idioma, idiomaAuto: msg.auto });
}

/** Mantém o idioma igual em todos os separadores desta app. */
export function useLanguageSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ch = getChannel();
    const onMessage = (e: MessageEvent) => applyMessage(e.data);
    ch?.addEventListener("message", onMessage);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== PING_KEY || !e.newValue) return;
      try {
        applyMessage(JSON.parse(e.newValue));
      } catch { /* noop */ }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      ch?.removeEventListener("message", onMessage);
      ch?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);
}