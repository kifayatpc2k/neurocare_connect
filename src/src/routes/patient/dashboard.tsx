import { createFileRoute, redirect } from "@tanstack/react-router";

// Patient accounts were removed; old links land on the public education page.
export const Route = createFileRoute("/patient/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/patient" });
  },
});
