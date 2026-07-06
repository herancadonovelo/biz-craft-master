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

    const anyOverlayOpen = () =>
      !!document.querySelector(
        '[data-state="open"][role="dialog"],' +
          '[data-state="open"][role="alertdialog"],' +
          '[data-radix-popper-content-wrapper],' +
          '[data-state="open"][data-slot="sheet-content"]',
      );

    const unlock = () => {
      if (anyOverlayOpen()) return;
      if (body.style.pointerEvents === "none") body.style.pointerEvents = "";
      // Radix ScrollLock: só remover se realmente sem overlay
      if (body.style.overflow === "hidden" && !body.hasAttribute("data-scroll-locked")) {
        body.style.overflow = "";
      }
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
    window.addEventListener("popstate", onNav);
    window.addEventListener("pushstate", onNav);
    // Safety net: verifica periodicamente
    const id = window.setInterval(unlock, 2000);

    return () => {
      mo.disconnect();
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("pushstate", onNav);
      window.clearInterval(id);
    };
  }, []);
  return null;
}