import { createFileRoute, redirect } from "@tanstack/react-router";

// Patient accounts were removed; old links land on the public education page.
export const Route = createFileRoute("/patient/chat")({
  beforeLoad: () => {
    throw redirect({ to: "/patient", hash: "ask" });
  },
});
