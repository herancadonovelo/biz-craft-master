import { test, expect } from "@playwright/test";

// Verifies the CSV import history library — pure client-side, no auth needed.
test.describe("CSV import — histórico + undo", () => {
  test("regista batch, restaura estado e limpa fornecedores criados", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const result = await page.evaluate(async () => {
      const store = await import("/src/lib/store.ts" as string).catch(() => null) as any;
      const hist = await import("/src/lib/csv-import-history.ts" as string) as any;
      if (!store?.useStore) return { skipped: true };

      // Seed: create one existing material we'll "update", capture its snapshot.
      const s = store.useStore.getState();
      s.add("materiais", { nome: "teste-mat", unidade: "un", stock: 5, precoCompra: 2, categoria: "fios" });
      s.add("fornecedores", { nome: "teste-forn-existing", contactos: {} });
      const after = store.useStore.getState();
      const material = after.materiais.find((m: any) => m.nome === "teste-mat");
      const fornExisting = after.fornecedores.find((f: any) => f.nome === "teste-forn-existing");
      // Simulate an import: creates one material + one supplier, updates another.
      s.add("materiais", { nome: "importado-x", unidade: "un", stock: 3, precoCompra: 1, categoria: "fios" });
      const created = store.useStore.getState().materiais.find((m: any) => m.nome === "importado-x");
      s.add("fornecedores", { nome: "importado-forn", contactos: {} });
      const fornCreated = store.useStore.getState().fornecedores.find((f: any) => f.nome === "importado-forn");
      s.update("materiais", material.id, { stock: 999, precoCompra: 99 });

      const batch = hist.recordImportBatch({
        file: "teste.csv",
        criados: [created.id],
        atualizados: [{ id: material.id, before: { stock: 5, precoCompra: 2 } }],
        fornecedoresCriados: [fornCreated.id],
        totals: { novos: 1, updates: 1, ignorados: 0 },
      });

      const listed = hist.listImportBatches();
      const undone = hist.undoImportBatch(batch.id);
      const finalState = store.useStore.getState();

      // Cleanup — keep the store from leaking state between tests.
      const m2 = finalState.materiais.find((m: any) => m.id === material.id);
      if (m2) s.remove("materiais", m2.id);
      if (fornExisting) s.remove("fornecedores", fornExisting.id);

      return {
        skipped: false,
        listed: listed.length >= 1,
        undone,
        createdRemoved: !finalState.materiais.some((m: any) => m.id === created.id),
        fornRemoved: !finalState.fornecedores.some((f: any) => f.id === fornCreated.id),
        restoredStock: m2?.stock,
        restoredPreco: m2?.precoCompra,
      };
    });

    test.skip(result.skipped === true, "store module could not be loaded in this env");
    expect(result.listed).toBe(true);
    expect(result.createdRemoved).toBe(true);
    expect(result.fornRemoved).toBe(true);
    expect(result.restoredStock).toBe(5);
    expect(result.restoredPreco).toBe(2);
    expect(result.undone.removidos).toBeGreaterThanOrEqual(1);
    expect(result.undone.restaurados).toBeGreaterThanOrEqual(1);
  });
});