import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Eye, Search } from "lucide-react";
import { ResearchShell } from "@/components/layout/ResearchShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/common/States";
import {
  ConsentBadge,
  EligibilityBadge,
  LifecycleBadge,
  StepBadge,
} from "@/components/participants/LifecycleBadges";
import { AddParticipantDialog } from "@/components/participants/AddParticipantDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParticipants } from "@/hooks/useParticipants";
import { ACTION_LABELS, nextAction } from "@/lib/lifecycle";
import { STUDY_GROUP_LABELS } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/research/participants/")({
  head: () => ({
    meta: [
      { title: "Participant Management — NeuroCare Connect" },
      {
        name: "description",
        content:
          "Track every study participant from screening and consent through enrolment, baseline, randomisation and follow-up visits.",
      },
      { property: "og:title", content: "Participant Management — NeuroCare Connect" },
      {
        property: "og:description",
        content: "Screening, consent, enrolment and follow-up status for the study team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ParticipantsPage,
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ParticipantsPage() {
  const { data, isPending, isError, refetch } = useParticipants();
  const [query, setQuery] = useState("");

  const participants = (data ?? []).filter((participant) =>
    participant.participantCode.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <ResearchShell
      title="Participants"
      description="Register of screened, enrolled and randomised study participants."
      breadcrumbs={[{ label: "Research" }, { label: "Participants" }]}
      actions={<AddParticipantDialog />}
    >
      <section className="frost rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search by study participant ID"
              className="pl-9"
              placeholder="Search participant ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {participants.length} of {data?.length ?? 0} participants
          </p>
        </div>

        <div className="mt-5">
          {isPending ? (
            <LoadingRows rows={5} />
          ) : isError ? (
            <ErrorState
              description="The participant register could not be loaded."
              onRetry={() => {
                void refetch();
              }}
            />
          ) : participants.length === 0 ? (
            (data?.length ?? 0) > 0 ? (
              <EmptyState
                title="No matching participants"
                description="No participant ID matches this search. Clear the search to see everyone."
              />
            ) : (
              <EmptyState
                title="No participants yet"
                description="Add a participant to begin screening. Eligibility, consent and enrolment are recorded step by step."
              />
            )
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Study ID</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Date added</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Status</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Eligibility</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Consent</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Enrolment</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Baseline</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Randomisation</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Group</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Day 15</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Day 30</TableHead>
                    <TableHead className="whitespace-nowrap px-3 font-semibold text-foreground">Last updated</TableHead>
                    <TableHead className="whitespace-nowrap px-3 text-right font-semibold text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => {
                    const next = nextAction(participant);
                    return (
                      <TableRow key={participant.id}>
                        <TableCell className="whitespace-nowrap px-3 py-3 font-semibold">
                          <span className="flex items-center gap-2">
                            {participant.participantCode}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {formatDate(participant.createdAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          <LifecycleBadge stage={participant.lifecycleStage} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          <EligibilityBadge status={participant.eligibilityStatus} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          <ConsentBadge status={participant.consentStatus} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          <StepBadge label="Enrolled" complete={participant.enrolmentConfirmed} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          <StepBadge
                            label="Completed"
                            complete={Boolean(participant.baselineCompletedAt)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          <StepBadge
                            label="Allocated"
                            complete={Boolean(participant.randomizedAt)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          {participant.studyGroup
                            ? STUDY_GROUP_LABELS[participant.studyGroup]
                            : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          <StepBadge
                            label="Completed"
                            complete={Boolean(participant.day15CompletedAt)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          <StepBadge
                            label="Completed"
                            complete={Boolean(participant.day30CompletedAt)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {formatDate(participant.updatedAt)}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline" className="rounded-xl">
                              <Link
                                to="/research/participants/$participantId"
                                params={{ participantId: participant.id }}
                              >
                                <Eye aria-hidden="true" className="size-4" />
                                View
                              </Link>
                            </Button>
                            {next ? (
                              <Button asChild size="sm" className="rounded-xl">
                                <Link
                                  to="/research/participants/$participantId"
                                  params={{ participantId: participant.id }}
                                  title={ACTION_LABELS[next]}
                                >
                                  Continue
                                  <ArrowRight aria-hidden="true" className="size-4" />
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>
    </ResearchShell>
  );
}
