import { createFileRoute, Link } from "@tanstack/react-router";
import { PageCanvas, PageContainer } from "@/components/layout/PageCanvas";
import { BrandMark } from "@/components/brand/BrandMark";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NeuroCare Connect" },
      {
        name: "description",
        content:
          "Choose the NeuroCare Connect portal you need: patient sign-in or authorised research team sign-in.",
      },
      { property: "og:title", content: "Sign in — NeuroCare Connect" },
      {
        property: "og:description",
        content: "Patient sign-in and authorised research team sign-in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthChooser,
});

function AuthChooser() {
  return (
    <PageCanvas>
      <header className="relative z-10">
        <PageContainer className="py-7">
          <Link to="/">
            <BrandMark />
          </Link>
        </PageContainer>
      </header>
      <main className="flex-1">
        <PageContainer width="narrow" className="py-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Sign in to continue
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The two portals are kept separate. Choose the one that matches your role.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="frost rounded-3xl p-6">
              <h2 className="font-display text-lg font-bold">I am a patient</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Public education about neuropathic pain, medicines and the study. No account needed.
              </p>
              <Button asChild className="mt-5 w-full rounded-full">
                <Link to="/patient">Open Patient Education</Link>
              </Button>
            </div>
            <div className="frost rounded-3xl p-6">
              <h2 className="font-display text-lg font-bold">Research team</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Authorised study personnel only.
              </p>
              <Button asChild variant="outline" className="mt-5 w-full rounded-full">
                <Link to="/research/login">Research sign in</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </main>
      <SiteFooter />
    </PageCanvas>
  );
}
