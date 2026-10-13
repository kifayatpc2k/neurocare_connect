import { createFileRoute, Link } from "@tanstack/react-router";
import { LibraryShell, PageIntro, ReviewLabel } from "@/components/library/LibraryShell";
import { PageContainer } from "@/components/layout/PageCanvas";
import { faqs as faqsEn } from "@/content/patient/library";
import { useLocalized, useTx } from "@/i18n/PatientLanguage";

const TITLE = "Neuropathic Pain FAQs — NeuroCare Connect Library";
const DESC = "Short, plain-language answers to common questions about nerve pain and medicines.";

export const Route = createFileRoute("/patient/library/faq")({
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const tx = useTx();
  const faqs = useLocalized(faqsEn);
  return (
    <LibraryShell>
      <PageContainer className="py-8">
        <div className="mx-auto max-w-3xl">
          <PageIntro eyebrow={tx("H — Questions")} title={tx("Frequently asked questions")} />
          <p className="mt-4"><ReviewLabel status="awaiting-review" /></p>
          <dl className="mt-8">
            {faqs.map((f) => (
              <div key={f.q} className="border-t border-hairline py-6">
                <dt className="font-display text-xl font-bold">{f.q}</dt>
                <dd className="mt-2 text-lg leading-relaxed text-muted-foreground">
                  {f.a}
                  {f.related ? <> <Link to="/patient/library/$slug" params={{ slug: f.related }} className="font-semibold text-primary hover:underline">{tx("Read more")}</Link></> : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </PageContainer>
    </LibraryShell>
  );
}
