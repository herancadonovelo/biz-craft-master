import { defineTool } from "@lovable.dev/mcp-js";
import { loadState, ok, fail } from "./_app-state";

export default defineTool({
  name: "list_suppliers",
  title: "List suppliers",
  description: "List every supplier (fornecedor) in the signed-in user's account, including contact info and any active discount code.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const fornecedores = (res.state.fornecedores ?? []) as any[];
    return ok(fornecedores, "suppliers");
  },
});