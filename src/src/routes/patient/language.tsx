import { createFileRoute, redirect } from "@tanstack/react-router";

// The language selector now lives on the public education page.
export const Route = createFileRoute("/patient/language")({
  beforeLoad: () => {
    throw redirect({ to: "/patient", hash: "language" });
  },
});
