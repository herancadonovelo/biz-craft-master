import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, ok, fail } from "./_app-state";

export default defineTool({
  name: "list_orders",
  title: "List orders with status and materials",
  description: "List orders (encomendas) with status, deadline, price, client, and materials used (resolved from the linked project).",
  inputSchema: {
    status: z
      .enum(["pendente", "em_producao", "pronta", "entregue", "cancelada"])
      .optional()
      .describe("Optional filter by order status."),
    limit: z.number().int().positive().max(200).default(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const encomendas = (res.state.encomendas ?? []) as any[];
    const projetos = (res.state.projetos ?? []) as any[];
    const materiais = (res.state.materiais ?? []) as any[];
    const clientes = (res.state.clientes ?? []) as any[];

    const rows = encomendas
      .filter((e) => !status || e.estado === status)
      .slice(0, limit ?? 50)
      .map((e) => {
        const projeto = projetos.find((p) => p.id === e.projetoId);
        const cliente = clientes.find((c) => c.id === e.clienteId);
        const items = ((projeto?.materiais ?? []) as any[]).map((mu) => {
          const m = materiais.find((x) => x.id === mu.materialId);
          return {
            material_id: mu.materialId,
            name: m?.nome ?? null,
            unit: m?.unidade ?? null,
            quantity: mu.quantidade,
            unit_cost: m?.precoCompra ?? null,
          };
        });
        return {
          id: e.id,
          code: e.codigo ?? null,
          description: e.descricao,
          status: e.estado,
          deadline: e.prazo ?? null,
          price: e.preco,
          created_at: e.criadoEm,
          client: cliente ? { id: cliente.id, name: cliente.nome } : null,
          project: projeto ? { id: projeto.id, name: projeto.nome } : null,
          materials: items,
        };
      });
    return ok(rows, "orders");
  },
});