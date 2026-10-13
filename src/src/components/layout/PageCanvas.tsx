import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The shared atmospheric canvas used by every screen. Soft, slow-moving
 * gradient fields sit behind a max-width content column.
 */
export function PageCanvas({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("relative flex min-h-screen flex-col overflow-hidden", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="floaty absolute -left-20 -top-24 size-[440px] rounded-full blur-3xl"
          style={{ backgroundColor: "var(--blob-1)", opacity: 0.5 }}
        />
        <div
          className="floaty-slow absolute -right-24 top-1/3 size-[420px] rounded-full blur-3xl"
          style={{ backgroundColor: "var(--blob-2)", opacity: 0.45 }}
        />
        <div
          className="absolute bottom-0 left-1/3 size-[380px] rounded-full blur-3xl"
          style={{ backgroundColor: "var(--blob-3)", opacity: 0.4 }}
        />
      </div>
      <div className="relative flex min-h-screen flex-col">{children}</div>
    </div>
  );
}

export function PageContainer({
  children,
  className,
  width = "wide",
}: {
  children: ReactNode;
  className?: string | undefined;
  width?: "wide" | "narrow" | undefined;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 lg:px-10",
        width === "wide" ? "max-w-7xl" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
