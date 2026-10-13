import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PatientLanguageProvider } from "@/i18n/PatientLanguage";

// Layout boundary for the public patient area. The language preference lives
// only here, so research routes never show the selector or change language.
export const Route = createFileRoute("/patient")({
  component: PatientLayout,
});

function PatientLayout() {
  return (
    <PatientLanguageProvider>
      <Outlet />
    </PatientLanguageProvider>
  );
}
