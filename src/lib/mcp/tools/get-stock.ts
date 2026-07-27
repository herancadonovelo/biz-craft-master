import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, ok, fail } from "./_app-state";

export default defineTool({
  name: "get_stock",
  title: "Get material stock and availability",
  description: "Return the current stock for every material, the linked suppliers, and whether stock is below the configured minimum. Optionally filter by material name or low-stock only.",
  inputSchema: {
    material_name: z.string().optional(),
    low_stock_only: z.boolean().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ material_name, low_stock_only }, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const materiais = (res.state.materiais ?? []) as any[];
    const fornecedores = (res.state.fornecedores ?? []) as any[];
    const nameFor = (id?: string) => fornecedores.find((f) => f.id === id)?.nome ?? null;
    const filter = material_name?.toLowerCase();
    const rows = materiais
      .filter((m) => !filter || m.nome?.toLowerCase().includes(filter))
      .map((m) => {
        const min = m.stockMinimo ?? 0;
        const suppliers = [
          m.fornecedorId ? { id: m.fornecedorId, name: nameFor(m.fornecedorId), primary: true, price: m.precoCompra } : null,
          ...((m.fornecedoresExtra ?? []) as any[]).map((p) => ({ id: p.fornecedorId, name: nameFor(p.fornecedorId), primary: false, price: p.preco })),
        ].filter(Boolean);
        return {
          material_id: m.id,
          name: m.nome,
          unit: m.unidade,
          stock: m.stock,
          stock_min: min,
          low_stock: (m.stock ?? 0) <= min,
          available: (m.stock ?? 0) > 0,
          suppliers,
        };
      })
      .filter((r) => !low_stock_only || r.low_stock);
    return ok(rows, "stock");
  },
});