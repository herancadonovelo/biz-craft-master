import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, ok, fail } from "./_app-state";

export default defineTool({
  name: "validate_supplier_discount_code",
  title: "Validate a supplier discount code",
  description: "Look up a supplier discount code and return the matching supplier plus the discount value and type. Case-insensitive.",
  inputSchema: { code: z.string().min(1) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ code }, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const target = code.trim().toLowerCase();
    const supplier = ((res.state.fornecedores ?? []) as any[]).find(
      (f) => f.codigoDesconto && String(f.codigoDesconto).toLowerCase() === target,
    );
    if (!supplier) return ok({ valid: false, code }, "validation");
    return ok(
      {
        valid: true,
        code: supplier.codigoDesconto,
        supplier: { id: supplier.id, name: supplier.nome },
        discount_value: supplier.valorDesconto ?? null,
        discount_type: supplier.tipoDesconto ?? "percentagem",
      },
      "validation",
    );
  },
});