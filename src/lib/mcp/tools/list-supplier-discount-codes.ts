import { defineTool } from "@lovable.dev/mcp-js";
import { loadState, ok, fail } from "./_app-state";

export default defineTool({
  name: "list_supplier_discount_codes",
  title: "List supplier discount codes with usage",
  description: "List every active supplier discount code and how many of the user's orders were placed after the code was attached (best-effort usage/limit view).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const fornecedores = (res.state.fornecedores ?? []) as any[];
    const projetos = (res.state.projetos ?? []) as any[];
    const encomendas = (res.state.encomendas ?? []) as any[];
    const materiais = (res.state.materiais ?? []) as any[];

    const codes = fornecedores
      .filter((f) => f.codigoDesconto)
      .map((f) => {
        const supplierMaterialIds = new Set(
          materiais
            .filter((m) => m.fornecedorId === f.id || (m.fornecedoresExtra ?? []).some((p: any) => p.fornecedorId === f.id))
            .map((m) => m.id),
        );
        const projectsUsingSupplier = new Set(
          projetos
            .filter((p) => (p.materiais ?? []).some((mu: any) => supplierMaterialIds.has(mu.materialId)))
            .map((p) => p.id),
        );
        const uses = encomendas.filter((e) => e.projetoId && projectsUsingSupplier.has(e.projetoId)).length;
        return {
          code: f.codigoDesconto,
          supplier: { id: f.id, name: f.nome },
          discount_value: f.valorDesconto ?? null,
          discount_type: f.tipoDesconto ?? "percentagem",
          uses_in_orders: uses,
          limit: null,
        };
      });
    return ok(codes, "codes");
  },
});