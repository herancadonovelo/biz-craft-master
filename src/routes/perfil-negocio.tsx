import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/perfil-negocio")({
  head: () => ({ meta: [{ title: "Perfil do negócio" }] }),
  component: () => {
    const perfil = useStore((s) => s.perfilNegocio);
    const setPerfil = useStore((s) => s.setPerfil);
    const audit = useStore((s) => s.audit);
    const onLogo = (file?: File) => { if (!file) return; const r = new FileReader(); r.onload = () => setPerfil({ logo: r.result as string }); r.readAsDataURL(file); };
    const fields: { k: keyof typeof perfil; label: string }[] = [
      { k: "nome", label: "Nome do negócio" },
      { k: "slogan", label: "Slogan" },
      { k: "nif", label: "NIF" },
      { k: "morada", label: "Morada" },
      { k: "codigoPostal", label: "Código Postal" },
      { k: "cidade", label: "Cidade" },
      { k: "pais", label: "País" },
      { k: "email", label: "E-mail" },
      { k: "telefone", label: "Telefone" },
      { k: "website", label: "Website" },
      { k: "instagram", label: "Instagram" },
      { k: "iban", label: "IBAN" },
    ];
    return (
      <div className="space-y-6">
        <PageHeader title="Perfil do negócio" description="Dados que aparecem em faturas, etiquetas e exportações." />
        <Card><CardContent className="grid gap-4 p-6 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.k}>
              <Label>{f.label}</Label>
              <Input value={(perfil as any)[f.k] ?? ""} onChange={(e) => setPerfil({ [f.k]: e.target.value } as any)} />
            </div>
          ))}
          <div className="md:col-span-2">
            <Label>Logo</Label>
            <Input type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0])} />
            {perfil.logo && <img src={perfil.logo} alt="" className="mt-2 h-20 w-20 rounded object-cover" />}
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={() => { audit("atualizou perfil", "perfilNegocio", undefined, perfil.nome); toast.success("Perfil guardado"); }}>Guardar alterações</Button>
          </div>
        </CardContent></Card>
      </div>
    );
  },
});