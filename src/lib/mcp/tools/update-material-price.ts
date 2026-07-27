import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, saveState, ok, fail } from "./_app-state";

export default defineTool({
  name: "update_material_price",
  title: "Update material price / supplier terms",
  description: "Update purchase price, primary supplier, or an extra supplier price for a material. If supplier_id is provided and differs from the primary supplier, the price is stored/updated in the extras list.",
  inputSchema: {
    material_id: z.string().min(1),
    price: z.number().nonnegative().optional().describe("New price (per unit)."),
    supplier_id: z.string().optional().describe("Supplier the price applies to. Defaults to the material's primary supplier."),
    set_as_primary: z.boolean().optional().describe("If true and supplier_id is set, mark this supplier as the primary supplier."),
    reference: z.string().optional().describe("Supplier reference/SKU for this material."),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ material_id, price, supplier_id, set_as_primary, reference, notes }, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const materiais = [...((res.state.materiais ?? []) as any[])];
    const idx = materiais.findIndex((m) => m.id === material_id);
    if (idx < 0) return fail("Material not found.");
    const m = { ...materiais[idx] };
    const targetSupplier = supplier_id ?? m.fornecedorId;
    if (notes !== undefined) m.notas = notes;
    if (reference !== undefined && (!targetSupplier || targetSupplier === m.fornecedorId)) m.codigo = reference;

    if (set_as_primary && supplier_id) {
      m.fornecedorId = supplier_id;
      if (price !== undefined) m.precoCompra = price;
      if (reference !== undefined) m.codigo = reference;
    } else if (targetSupplier && targetSupplier !== m.fornecedorId) {
      const extras = [...((m.fornecedoresExtra ?? []) as any[])];
      const eIdx = extras.findIndex((p) => p.fornecedorId === targetSupplier);
      const patch = {
        fornecedorId: targetSupplier,
        preco: price ?? extras[eIdx]?.preco ?? 0,
        referencia: reference ?? extras[eIdx]?.referencia,
      };
      if (eIdx >= 0) extras[eIdx] = { ...extras[eIdx], ...patch };
      else extras.push(patch);
      m.fornecedoresExtra = extras;
    } else if (price !== undefined) {
      m.precoCompra = price;
    }
    materiais[idx] = m;
    const err = await saveState(res.supabase, ctx.getUserId()!, { materiais }, res.state);
    if (err) return fail(err);
    return ok(m, "material");
  },
});