import { useState } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { PageContainer } from "@/components/layout/PageCanvas";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSignOut } from "@/hooks/useSignOut";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  to: NonNullable<LinkProps["to"]>;
};

export function PortalHeader({
  navItems = [],
  portalLabel,
  accountLabel,
  showSignOut = false,
  cta,
}: {
  navItems?: NavItem[] | undefined;
  portalLabel?: string | undefined;
  accountLabel?: string | null | undefined;
  showSignOut?: boolean | undefined;
  cta?: { label: string; to: NonNullable<LinkProps["to"]> } | undefined;
}) {
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();

  const links = (orientation: "row" | "column") => (
    <nav
      aria-label="Portal"
      className={cn(
        orientation === "row"
          ? "hidden items-center gap-1 rounded-full border border-hairline bg-surface px-2 py-1 shadow-sm backdrop-blur-xl md:flex"
          : "flex flex-col gap-1",
      )}
    >
      {navItems.map((item) => (
        <Link
          key={String(item.to)}
          to={item.to}
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{
            className: "rounded-full px-4 py-2 text-sm font-semibold text-foreground",
          }}
          activeOptions={{ exact: false }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="relative z-10">
      <PageContainer className="flex items-center justify-between gap-4 py-6">
        <Link to="/" className="rounded-2xl">
          <BrandMark subtitle={portalLabel ?? null} />
        </Link>

        {navItems.length > 0 ? links("row") : null}

        <div className="flex items-center gap-2">
          {accountLabel ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {accountLabel}
            </span>
          ) : null}

          {cta ? (
            <Button asChild size="sm" className="rounded-full">
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          ) : null}

          {showSignOut ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void signOut()}
            >
              <LogOut aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : null}

          {navItems.length > 0 ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full md:hidden"
                  aria-label="Open navigation"
                >
                  <Menu aria-hidden="true" className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="px-4 pt-4 font-display">Navigation</SheetTitle>
                <div className="p-4">{links("column")}</div>
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      </PageContainer>
    </header>
  );
}
