import { branding } from "@/config/branding";
import { PageContainer } from "@/components/layout/PageCanvas";

/**
 * Institution and research-contact details are intentionally not shown until
 * real, approved details are supplied in src/config/branding.ts.
 */
export function SiteFooter() {
  const { app } = branding;
  return (
    <footer className="mt-16 border-t border-hairline py-10">
      <PageContainer>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="max-w-xs space-y-1 text-xs text-muted-foreground">
            <p className="font-semibold uppercase tracking-[0.14em] text-foreground">
              A RESEARCH STUDY BY
            </p>
            <p>Sarha Shaikh &amp; Ashmita S</p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="font-semibold uppercase tracking-[0.14em] text-foreground">Institution</p>
            <p>KLE COLLEGE OF PHARMACY, BELAGAVI</p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="font-semibold uppercase tracking-[0.14em] text-foreground">University</p>
            <p>KLE ACADEMY OF HIGHER EDUCATION AND RESEARCH</p>
          </div>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {app.name}.
        </p>
      </PageContainer>
    </footer>
  );
}
