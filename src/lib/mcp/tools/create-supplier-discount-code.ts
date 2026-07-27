import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, saveState, ok, fail } from "./_app-state";

export default defineTool({
  name: "create_supplier_discount_code",
  title: "Create or update a supplier discount code",
  description: "Attach a discount code to a supplier. Provide either supplier_id or supplier_name (case-insensitive). The code becomes redeemable via validate_supplier_discount_code.",
  inputSchema: {
    supplier_id: z.string().optional().describe("Supplier ID."),
    supplier_name: z.string().optional().describe("Supplier name (used if supplier_id is omitted)."),
    code: z.string().min(1).describe("Discount code, e.g. WELCOME10."),
    value: z.number().positive().describe("Discount value."),
    type: z.enum(["percentagem", "fixo"]).default("percentagem").describe("percentagem = %, fixo = flat amount."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ supplier_id, supplier_name, code, value, type }, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const fornecedores = [...((res.state.fornecedores ?? []) as any[])];
    const idx = fornecedores.findIndex((f) =>
      supplier_id ? f.id === supplier_id : supplier_name && f.nome?.toLowerCase() === supplier_name.toLowerCase(),
    );
    if (idx < 0) return fail("Supplier not found. Use list_suppliers first.");
    fornecedores[idx] = {
      ...fornecedores[idx],
      codigoDesconto: code.trim(),
      valorDesconto: value,
      tipoDesconto: type,
    };
    const err = await saveState(res.supabase, ctx.getUserId()!, { fornecedores }, res.state);
    if (err) return fail(err);
    return ok(fornecedores[idx], "supplier");
  },
});