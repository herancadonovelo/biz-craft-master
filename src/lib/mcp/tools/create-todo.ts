import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, saveState, ok, fail, uid } from "./_app-state";

export default defineTool({
  name: "create_todo",
  title: "Create a task",
  description: "Create a task (to-do) for the signed-in user.",
  inputSchema: {
    title: z.string().min(1),
    priority: z.enum(["baixa", "media", "alta"]).default("media"),
    deadline: z.string().optional().describe("ISO date (YYYY-MM-DD)."),
    project_id: z.string().optional(),
    reminder: z.string().optional().describe("ISO datetime for reminder."),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ title, priority, deadline, project_id, reminder }, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const todos = [...((res.state.todos ?? []) as any[])];
    const todo = {
      id: uid(),
      titulo: title,
      feito: false,
      prioridade: priority,
      prazo: deadline,
      projetoId: project_id,
      lembrete: reminder,
      estado: "por_fazer" as const,
      ordem: todos.length,
    };
    todos.push(todo);
    const err = await saveState(res.supabase, ctx.getUserId()!, { todos }, res.state);
    if (err) return fail(err);
    return ok(todo, "todo");
  },
});