import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { DESIGN_DEFAULTS } from "@/lib/design-defaults";
import { consumirRestauroIntencional, detetarReset, registarEventoDesign } from "@/lib/design-telemetry";

/**
 * Vigia o objecto `design` da store e regista telemetria sempre que várias
 * personalizações voltam ao default sem um restauro intencional.
 */
export function DesignResetWatcher() {
  const anteriorRef = useRef<Record<string, unknown> | null>(null);
  useEffect(() => {
    const defaults = DESIGN_DEFAULTS as unknown as Record<string, unknown>;
    anteriorRef.current = { ...(useStore.getState().design as unknown as Record<string, unknown>) };
    const unsub = useStore.subscribe((s: any) => {
      const atual = { ...(s.design as Record<string, unknown>) };
      const anterior = anteriorRef.current;
      anteriorRef.current = atual;
      const { reset, camposRepostos } = detetarReset(anterior, atual, defaults);
      if (!reset) return;
      if (consumirRestauroIntencional()) return;
      registarEventoDesign({
        tipo: "reset_inesperado",
        campos: camposRepostos.slice(0, 20),
        totalCampos: camposRepostos.length,
        detalhe: typeof window !== "undefined" ? window.location.pathname : undefined,
      });
    });
    return () => unsub();
  }, []);
  return null;
}
