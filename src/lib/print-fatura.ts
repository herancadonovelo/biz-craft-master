import type { Fatura, Cliente, PerfilNegocio } from "@/lib/store";

export function imprimirFatura(f: Fatura, c: Cliente | undefined, p: PerfilNegocio) {
  const total = f.valor * (1 + f.iva / 100);
  const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${f.numero}</title>
<style>
  body{font-family:-apple-system,Segoe UI,sans-serif;color:#111;margin:40px;}
  h1{font-size:22px;margin:0 0 4px}
  .row{display:flex;justify-content:space-between;gap:24px;margin:24px 0}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th,td{text-align:left;padding:8px;border-bottom:1px solid #ddd;font-size:13px}
  .totals td{border:0;padding:4px 8px}
  .right{text-align:right}
  .muted{color:#666;font-size:12px}
</style></head><body>
  <div class="row">
    <div>
      <h1>${p.nome ?? ""}</h1>
      <div class="muted">${[p.morada, p.codigoPostal, p.cidade, p.pais].filter(Boolean).join(", ")}</div>
      <div class="muted">${p.email ?? ""} ${p.telefone ? "· " + p.telefone : ""}</div>
      ${p.nif ? `<div class="muted">NIF: ${p.nif}</div>` : ""}
    </div>
    <div class="right">
      <h1>Fatura ${f.numero}</h1>
      <div class="muted">Data: ${f.data}</div>
      <div class="muted">Estado: ${f.estado}</div>
    </div>
  </div>
  <div class="row">
    <div>
      <div class="muted">Cliente</div>
      <div><strong>${c?.nome ?? "—"}</strong></div>
      <div class="muted">${c?.email ?? ""}</div>
      <div class="muted">${c?.morada ?? ""}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>Descrição</th><th class="right">Valor s/ IVA</th></tr></thead>
    <tbody>
      <tr><td>Serviços / produtos faturados</td><td class="right">${fmt(f.valor)}</td></tr>
    </tbody>
  </table>
  <table class="totals">
    <tr><td>Subtotal</td><td class="right">${fmt(f.valor)}</td></tr>
    <tr><td>IVA ${f.iva}%</td><td class="right">${fmt(total - f.valor)}</td></tr>
    <tr><td><strong>Total</strong></td><td class="right"><strong>${fmt(total)}</strong></td></tr>
  </table>
  ${p.iban ? `<p class="muted">IBAN para pagamento: ${p.iban}</p>` : ""}
  <script>window.onload=()=>window.print();</script>
</body></html>`;
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  w.document.write(html); w.document.close();
}