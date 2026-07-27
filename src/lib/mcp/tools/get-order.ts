import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, ok, fail } from "./_app-state";

export default defineTool({
  name: "get_order",
  title: "Get order status and material breakdown",
  description: "Return a single order with full material breakdown (name, unit, quantity, unit cost, total cost) and the linked client/project.",
  inputSchema: { order_id: z.string().min(1) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_id }, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const e = ((res.state.encomendas ?? []) as any[]).find((x) => x.id === order_id);
    if (!e) return fail("Order not found.");
    const projeto = ((res.state.projetos ?? []) as any[]).find((p) => p.id === e.projetoId);
    const cliente = ((res.state.clientes ?? []) as any[]).find((c) => c.id === e.clienteId);
    const materiais = (res.state.materiais ?? []) as any[];
    const items = ((projeto?.materiais ?? []) as any[]).map((mu) => {
      const m = materiais.find((x) => x.id === mu.materialId);
      const cost = (m?.precoCompra ?? 0) * mu.quantidade;
      return {
        material_id: mu.materialId,
        name: m?.nome ?? null,
        unit: m?.unidade ?? null,
        quantity: mu.quantidade,
        unit_cost: m?.precoCompra ?? null,
        total_cost: cost,
        current_stock: m?.stock ?? null,
      };
    });
    return ok(
      {
        id: e.id,
        code: e.codigo ?? null,
        description: e.descricao,
        status: e.estado,
        deadline: e.prazo ?? null,
        price: e.preco,
        created_at: e.criadoEm,
        client: cliente ? { id: cliente.id, name: cliente.nome } : null,
        project: projeto ? { id: projeto.id, name: projeto.nome, hours: projeto.horasTrabalhadas } : null,
        materials: items,
        materials_total_cost: items.reduce((s, i) => s + (i.total_cost ?? 0), 0),
      },
      "order",
    );
  },
});