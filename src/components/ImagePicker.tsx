import { useRef, type ReactNode } from "react";
import { ImagePlus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value?: string;
  onChange: (dataUrl: string) => void;
  accept?: string;
  shape?: "square" | "round";
  /** Tailwind size classes, e.g. "h-20 w-20" */
  size?: string;
  className?: string;
  placeholder?: ReactNode;
  alt?: string;
  /** If true, max file size in bytes (default 4MB) */
  maxBytes?: number;
  title?: string;
};

export function ImagePicker({
  value,
  onChange,
  accept = "image/*",
  shape = "square",
  size = "h-20 w-20",
  className,
  placeholder,
  alt = "",
  maxBytes = 4_000_000,
  title,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const handle = (file?: File) => {
    if (!file) return;
    if (file.size > maxBytes) {
      // Soft warning via console; consumer can wrap if needed
      console.warn("Imagem grande:", file.size);
    }
    const r = new FileReader();
    r.onload = () => onChange(r.result as string);
    r.readAsDataURL(file);
  };
  const rounded = shape === "round" ? "rounded-full" : "rounded";
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      title={title ?? (value ? "Clica para alterar a imagem" : "Clica para adicionar imagem")}
      className={cn(
        "group relative grid place-items-center overflow-hidden border border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-primary hover:bg-muted",
        rounded,
        size,
        className,
      )}
    >
      {value ? (
        <>
          <img src={value} alt={alt} className={cn("h-full w-full object-cover", rounded)} />
          <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white group-hover:flex">
            <Pencil className="h-4 w-4" />
          </span>
        </>
      ) : (
        placeholder ?? <ImagePlus className="h-5 w-5" />
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </button>
  );
}