import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, saveState, ok, fail } from "./_app-state";

export default defineTool({
  name: "complete_todo",
  title: "Mark a task as complete",
  description: "Mark a task as done (estado = concluida, feito = true).",
  inputSchema: { id: z.string().min(1) },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const todos = [...((res.state.todos ?? []) as any[])];
    const idx = todos.findIndex((t) => t.id === id);
    if (idx < 0) return fail("Task not found.");
    todos[idx] = { ...todos[idx], feito: true, estado: "concluida" };
    const err = await saveState(res.supabase, ctx.getUserId()!, { todos }, res.state);
    if (err) return fail(err);
    return ok(todos[idx], "todo");
  },
});