import { createFileRoute } from "@tanstack/react-router";
import { AppointmentChecklist } from "@/components/library/AppointmentChecklist";
import { LibraryShell, PageIntro } from "@/components/library/LibraryShell";
import { PageContainer } from "@/components/layout/PageCanvas";
import { checklist as checklistEn } from "@/content/patient/library";
import { useLocalized, useTx } from "@/i18n/PatientLanguage";

const TITLE = "Appointment Checklist — NeuroCare Connect Library";
const DESC = "A printable 16-item checklist to prepare medicines, symptoms and questions before a healthcare appointment. Ticks are temporary.";

export const Route = createFileRoute("/patient/library/checklist")({
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChecklistPage,
});

function ChecklistPage() {
  const tx = useTx();
  const checklist = useLocalized(checklistEn);
  return (
    <LibraryShell>
      <PageContainer className="py-8">
        <div className="mx-auto max-w-3xl">
          <div className="print:hidden"><PageIntro eyebrow={tx("F — Appointment")} title={checklist.title} text={checklist.intro} /></div>
          <div className="mt-8"><AppointmentChecklist headingLevel={2} /></div>
        </div>
      </PageContainer>
    </LibraryShell>
  );
}
