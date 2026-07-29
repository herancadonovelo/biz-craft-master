import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="w-full border-b border-warning/40 bg-warning/15 px-4 py-2 text-center text-sm text-warning-foreground">
      Os pagamentos na pré-visualização estão em modo de teste — nenhum valor é cobrado.
    </div>
  );
}
