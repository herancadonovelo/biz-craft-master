import { useEffect } from "react";

/**
 * Watchdog global para desbloquear scroll/interações.
 *
 * O Radix (usado pelos componentes shadcn Dialog/Sheet/Select/Popover)
 * aplica temporariamente `pointer-events: none` ao <body> enquanto um
 * overlay está aberto. Em certas condições — abrir/fechar em rápida
 * sucessão, unmount durante uma transição de rota, ou navegação enquanto
 * um Select está aberto — o estilo não é limpo e a página congela
 * (não faz scroll, não responde a cliques) até refresh.
 *
 * Este observer garante que:
 *  - Se não existe nenhum overlay Radix aberto no DOM, o `pointer-events`
 *    e `overflow` do <body> são normalizados.
 *  - Ao navegar (popstate/pushState) qualquer bloqueio residual é limpo.
 */
export function ScrollUnlockWatcher() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    const html = document.documentElement;

    const anyOverlayOpen = () =>
      !!document.querySelector(
        '[data-state="open"][role="dialog"],' +
          '[data-state="open"][role="alertdialog"],' +
          '[data-state="open"][role="listbox"],' +
          '[data-state="open"][data-radix-menu-content],' +
          '[data-state="open"][data-slot="dialog-content"],' +
          '[data-state="open"][data-slot="select-content"],' +
          '[data-state="open"][data-slot="popover-content"],' +
          '[data-state="open"][data-slot="sheet-content"]',
      );

    const unlock = () => {
      if (anyOverlayOpen()) return;
      for (const el of [body, html]) {
        if (el.style.pointerEvents === "none") el.style.pointerEvents = "";
        if (el.style.overflow === "hidden") el.style.overflow = "";
        if (el.style.touchAction === "none") el.style.touchAction = "";
      }
      if (body.hasAttribute("data-scroll-locked")) body.removeAttribute("data-scroll-locked");
      if (body.style.position === "fixed") body.style.position = "";
      if (body.style.paddingRight) body.style.paddingRight = "";
      // Remove leftover invisible high-z-index backdrops that may capture events
      document.querySelectorAll<HTMLElement>(
        '[data-radix-dismissable-layer],[data-radix-focus-guard]'
      ).forEach((n) => {
        // if it has no visible open overlay parent, drop it
        if (!n.closest('[data-state="open"]') && !n.querySelector('[data-state="open"]')) {
          n.remove();
        }
      });
    };

    // Force full reset (ignores overlay check) — used on route change
    const forceUnlock = () => {
      for (const el of [body, html]) {
        el.style.pointerEvents = "";
        el.style.overflow = "";
        el.style.touchAction = "";
      }
      body.removeAttribute("data-scroll-locked");
      body.style.position = "";
      body.style.paddingRight = "";
    };

    const mo = new MutationObserver(() => {
      // Verifica após próximo frame para dar tempo ao Radix de estabilizar
      requestAnimationFrame(unlock);
    });
    mo.observe(body, {
      attributes: true,
      attributeFilter: ["style", "data-scroll-locked"],
      childList: true,
      subtree: true,
    });

    const onNav = () => {
      // On navigation, close any lingering dialog state and clear locks
      setTimeout(() => {
        if (!anyOverlayOpen()) forceUnlock();
        else unlock();
      }, 50);
    };
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function pushState(...args: Parameters<History["pushState"]>) {
      const ret = originalPushState.apply(window.history, args);
      window.dispatchEvent(new Event("lovable:navigation"));
      return ret;
    };
    window.history.replaceState = function replaceState(...args: Parameters<History["replaceState"]>) {
      const ret = originalReplaceState.apply(window.history, args);
      window.dispatchEvent(new Event("lovable:navigation"));
      return ret;
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("lovable:navigation", onNav);
    // If the user is actually interacting (wheel/touch/pointerdown) any residual
    // body-level pointer-events:none or overflow:hidden is by definition stale —
    // force-clear it regardless of Radix overlay heuristics.
    const onUserIntent = () => {
      forceUnlock();
      // Also drop stray focus-guards that can capture events
      document.querySelectorAll<HTMLElement>(
        '[data-radix-dismissable-layer],[data-radix-focus-guard]'
      ).forEach((n) => {
        if (!n.closest('[data-state="open"]') && !n.querySelector('[data-state="open"]')) {
          n.remove();
        }
      });
    };
    window.addEventListener("wheel", onUserIntent, { passive: true, capture: true });
    window.addEventListener("touchmove", onUserIntent, { passive: true, capture: true });
    window.addEventListener("pointerdown", onUserIntent, { passive: true, capture: true });
    // Quando a janela recupera foco ou fica visível novamente, garante que
    // nenhum bloqueio (overflow/pointer-events/backdrop) ficou pendurado
    // — típico ao voltar do chat, de um separador, ou da tab de background.
    const onRefocus = () => {
      // Dá um frame para que o Radix termine transições pendentes
      requestAnimationFrame(() => {
        if (!anyOverlayOpen()) forceUnlock();
        else unlock();
      });
    };
    window.addEventListener("focus", onRefocus);
    window.addEventListener("pageshow", onRefocus);
    document.addEventListener("visibilitychange", onRefocus);
    // Safety net: verifica periodicamente
    const id = window.setInterval(unlock, 500);

    return () => {
      mo.disconnect();
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("lovable:navigation", onNav);
      window.removeEventListener("wheel", onUserIntent, { capture: true });
      window.removeEventListener("touchmove", onUserIntent, { capture: true });
      window.removeEventListener("pointerdown", onUserIntent, { capture: true });
      window.removeEventListener("focus", onRefocus);
      window.removeEventListener("pageshow", onRefocus);
      document.removeEventListener("visibilitychange", onRefocus);
      window.clearInterval(id);
    };
  }, []);
  return null;
}