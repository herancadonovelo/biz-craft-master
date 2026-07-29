import { escapeHtml as e } from "@/lib/escape-html";

export interface ReciboPrintData {
  numero: string;
  data: string;
  descricao: string;
  valor: string;
  estado: string;
  cliente: string;
  referencia?: string | null;
}

/** Abre uma janela com o comprovativo de pagamento pronto a imprimir/guardar em PDF. */
export function imprimirRecibo(r: ReciboPrintData) {
  const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${e(r.numero)}</title>
<style>
  body{font-family:-apple-system,Segoe UI,sans-serif;color:#1f2937;margin:48px;}
  h1{font-size:22px;margin:0 0 4px}
  .muted{color:#6b7280;font-size:12px}
  .row{display:flex;justify-content:space-between;gap:24px;margin:28px 0}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th,td{text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px}
  .right{text-align:right}
  .total{font-size:18px;font-weight:600;margin-top:20px;text-align:right}
  .badge{display:inline-block;padding:4px 10px;border-radius:999px;background:#f3e8ff;color:#6b21a8;font-size:12px}
</style></head><body>
  <div class="row">
    <div>
      <h1>Craft Business Master</h1>
      <div class="muted">Art Fusion</div>
      <div class="muted">craftbusinessmaster.com</div>
    </div>
    <div class="right">
      <h1>Recibo ${e(r.numero)}</h1>
      <div class="muted">Data: ${e(r.data)}</div>
      <div class="muted"><span class="badge">${e(r.estado)}</span></div>
    </div>
  </div>
  <div class="muted">Cliente</div>
  <div>${e(r.cliente)}</div>
  <table>
    <thead><tr><th>Descrição</th><th class="right">Valor</th></tr></thead>
    <tbody><tr><td>${e(r.descricao)}</td><td class="right">${e(r.valor)}</td></tr></tbody>
  </table>
  <div class="total">Total pago: ${e(r.valor)}</div>
  ${r.referencia ? `<p class="muted">Referência da transação: ${e(r.referencia)}</p>` : ""}
  <p class="muted">Documento emitido eletronicamente e válido como comprovativo de pagamento.</p>
</body></html>`;
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}