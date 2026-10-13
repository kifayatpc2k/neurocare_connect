import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import {
  BarChart3,
  Download,
  LayoutDashboard,
  Shuffle,
  Settings2,
  ShieldCheck,
  Users,
  LogOut,
} from "lucide-react";
import { PageCanvas, PageContainer } from "@/components/layout/PageCanvas";
import { PageHeader } from "@/components/layout/PageHeader";
import { BrandMark } from "@/components/brand/BrandMark";
import { SiteFooter } from "@/components/layout/SiteFooter";
import type { Crumb } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useAccount } from "@/hooks/useAccount";
import { canOverrideAllocation } from "@/lib/study";
import { useSignOut } from "@/hooks/useSignOut";
import { useState } from "react";

type ResearchNavItem = {
  label: string;
  to: NonNullable<LinkProps["to"]>;
  icon: typeof Users;
};

const researchNav: ResearchNavItem[] = [
  { label: "Dashboard", to: "/research/dashboard", icon: LayoutDashboard },
  { label: "Participants", to: "/research/participants", icon: Users },
  { label: "Randomisation", to: "/research/randomization", icon: Shuffle },
  { label: "Analytics", to: "/research/analytics", icon: BarChart3 },
  { label: "Export", to: "/research/export", icon: Download },
];

const linkClass =
  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";
const activeClass =
  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold bg-brand/12 text-brand-deep";

function ResearchNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data: account } = useAccount();
  return (
    <nav aria-label="Research portal" className="space-y-1">
      {researchNav.map((item) => (
        <Link
          key={String(item.to)}
          to={item.to}
          onClick={onNavigate}
          className={linkClass}
          activeProps={{ className: activeClass }}
        >
          <item.icon aria-hidden="true" className="size-4" />
          {item.label}
        </Link>
      ))}
      <div className="mt-4 border-t border-border/60 pt-3">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Study administration
        </p>
        <Link
          to="/research/admins-access"
          onClick={onNavigate}
          className={linkClass}
          activeProps={{ className: activeClass }}
        >
          <Settings2 aria-hidden="true" className="size-4" />
          Admins Access
        </Link>
        {canOverrideAllocation(account) ? (
          <Link
            to="/research/admin/randomisation-control"
            onClick={onNavigate}
            className={linkClass}
            activeProps={{ className: activeClass }}
          >
            <ShieldCheck aria-hidden="true" className="size-4" />
            Randomisation Control
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

/**
 * Research portal layout — compact sidebar, dense working area.
 */
export function ResearchShell({
  title,
  description,
  breadcrumbs,
  actions,
  children,
}: {
  title: string;
  description?: string | undefined;
  breadcrumbs?: Crumb[] | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
}) {
  const { data: account } = useAccount();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);

  return (
    <PageCanvas>
      <main className="flex-1 pb-8 pt-6">
        <PageContainer className="flex gap-6">
          <aside className="frost sticky top-6 hidden h-fit w-56 shrink-0 rounded-3xl p-4 md:block">
            <Link to="/" className="mb-5 block">
              <BrandMark compact />
            </Link>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Study workspace
            </p>
            <ResearchNav />
            <div className="mt-6 space-y-2 border-t border-hairline pt-4">
              <p className="px-3 text-xs text-muted-foreground">
                {account?.fullName ?? account?.email ?? "Research account"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                onClick={() => void signOut()}
              >
                <LogOut aria-hidden="true" className="size-4" />
                Sign out
              </Button>
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex items-center justify-between gap-3 md:hidden">
              <BrandMark compact />
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    aria-label="Open research navigation"
                  >
                    <Menu aria-hidden="true" className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetTitle className="px-4 pt-4 font-display">
                    Study workspace
                  </SheetTitle>
                  <div className="p-4">
                    <ResearchNav onNavigate={() => setOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <PageHeader
              eyebrow="Research team portal"
              title={title}
              description={description}
              breadcrumbs={breadcrumbs}
              actions={
                actions
              }
            />
            {children}
          </div>
        </PageContainer>
      </main>
      <SiteFooter />
    </PageCanvas>
  );
}
