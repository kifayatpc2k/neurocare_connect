import { cn } from "@/lib/utils";

export const isPending = (v: string) => /^\[.*\]$/.test(v.trim());

/** Renders text; [bracketed] placeholders get a dashed "pending" style. */
export function Pending({ text, className }: { text: string; className?: string }) {
  if (!isPending(text)) return <span className={className}>{text}</span>;
  return (
    <span
      title="Placeholder — approved content pending"
      className={cn(
        "inline-block rounded-md border border-dashed border-muted-foreground/40 px-2 py-0.5 text-muted-foreground italic",
        className,
      )}
    >
      {text.slice(1, -1)}
    </span>
  );
}
