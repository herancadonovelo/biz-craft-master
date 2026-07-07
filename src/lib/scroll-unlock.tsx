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

    const onNav = () => setTimeout(unlock, 50);
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
    window.addEventListener("wheel", unlock, { passive: true, capture: true });
    window.addEventListener("touchmove", unlock, { passive: true, capture: true });
    window.addEventListener("pointerdown", unlock, { passive: true, capture: true });
    // Safety net: verifica periodicamente
    const id = window.setInterval(unlock, 500);

    return () => {
      mo.disconnect();
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("lovable:navigation", onNav);
      window.removeEventListener("wheel", unlock, { capture: true });
      window.removeEventListener("touchmove", unlock, { capture: true });
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.clearInterval(id);
    };
  }, []);
  return null;
}