import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, ok, fail } from "./_app-state";

export default defineTool({
  name: "get_material_prices",
  title: "Get supplier prices per material",
  description: "List every material and the prices offered by each linked supplier (primary + extras). Optionally filter by material name.",
  inputSchema: { material_name: z.string().optional() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ material_name }, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const materiais = (res.state.materiais ?? []) as any[];
    const fornecedores = (res.state.fornecedores ?? []) as any[];
    const nameFor = (id?: string) => fornecedores.find((f) => f.id === id)?.nome ?? null;
    const filter = material_name?.toLowerCase();
    const rows = materiais
      .filter((m) => !filter || m.nome?.toLowerCase().includes(filter))
      .map((m) => ({
        material_id: m.id,
        name: m.nome,
        unit: m.unidade,
        prices: [
          m.fornecedorId
            ? { supplier_id: m.fornecedorId, supplier_name: nameFor(m.fornecedorId), price: m.precoCompra, reference: m.codigo ?? null, primary: true }
            : null,
          ...((m.fornecedoresExtra ?? []) as any[]).map((p) => ({
            supplier_id: p.fornecedorId,
            supplier_name: nameFor(p.fornecedorId),
            price: p.preco,
            reference: p.referencia ?? null,
            primary: false,
          })),
        ].filter(Boolean),
      }));
    return ok(rows, "materials");
  },
});