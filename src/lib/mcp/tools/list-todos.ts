import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, ok, fail } from "./_app-state";

export default defineTool({
  name: "list_todos",
  title: "List tasks",
  description: "List tasks (to-dos) for the signed-in user. Filter by status, project, or completion.",
  inputSchema: {
    status: z.enum(["por_fazer", "em_progresso", "concluida"]).optional(),
    project_id: z.string().optional(),
    include_done: z.boolean().default(true).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, project_id, include_done }, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const todos = ((res.state.todos ?? []) as any[])
      .filter((t) => (include_done === false ? !t.feito : true))
      .filter((t) => (status ? t.estado === status : true))
      .filter((t) => (project_id ? t.projetoId === project_id : true))
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    return ok(todos, "todos");
  },
});