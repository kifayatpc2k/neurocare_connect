import { openDocumentationVisit } from "@/lib/lifecycle";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Info, Lock } from "lucide-react";
import { ResearchShell } from "@/components/layout/ResearchShell";
import { ErrorState, LoadingState } from "@/components/common/States";
import { JourneyStepper } from "@/components/participants/JourneyStepper";
import {
  ConsentBadge,
  EligibilityBadge,
  LifecycleBadge,
} from "@/components/participants/LifecycleBadges";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCompleteBaseline,
  useCompleteFollowUp,
  useParticipant,
  useRandomize,
  useRecordConsent,
  useRecordEnrolment,
  useRecordScreening,
  useOpenDay15,
} from "@/hooks/useParticipants";
import {
  canPerform,
  CONSENT_LABELS,
  ELIGIBILITY_LABELS,
  progressPercent,
  type ConsentStatus,
  type EligibilityStatus,
} from "@/lib/lifecycle";
import type { Participant } from "@/lib/participants.functions";
import { STUDY_GROUP_LABELS } from "@/lib/study";
import { ResearchRecordForm, InstrumentPanel, OutcomesPanel, useStudyData } from "@/components/research/StudyForms";
import { DownloadStudyReport } from "@/components/research/DownloadStudyReport";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { saveStudyCompletion } from "@/lib/research-data.functions";
import { participantKey } from "@/hooks/useParticipants";
import { getOverrideStatus } from "@/lib/allocation.functions";
import { useAccount } from "@/hooks/useAccount";
import { canOverrideAllocation } from "@/lib/study";

function OverrideIndicator({ participantId }: { participantId: string }) {
  const fetchStatus = useServerFn(getOverrideStatus);
  const { data: account } = useAccount();
  const { data } = useQuery({
    queryKey: ["override-status", participantId],
    queryFn: () => fetchStatus({ data: { participantId } }),
    staleTime: 30_000,
  });
  const admin = canOverrideAllocation(account);
  if (!data?.overridden && !admin) return null;
  if (!data?.overridden && admin)
    return (
      <p className="mt-1 text-xs text-muted-foreground">
        <Link to="/research/admin/randomisation-control" className="underline underline-offset-2">
          Allocation administration
        </Link>
      </p>
    );
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      Allocation override recorded
      {canOverrideAllocation(account) ? (
        <>
          {" · "}
          <Link to="/research/admin/randomisation-control" className="underline underline-offset-2">
            View history
          </Link>
        </>
      ) : null}
    </p>
  );
}

export const Route = createFileRoute("/_authenticated/research/participants/$participantId")({
  head: () => ({
    meta: [
      { title: "Participant Profile — NeuroCare Connect" },
      {
        name: "description",
        content:
          "Full participant record: journey progress, screening, consent, enrolment, baseline, randomisation and follow-up visits.",
      },
      { property: "og:title", content: "Participant Profile — NeuroCare Connect" },
      {
        property: "og:description",
        content: "Lifecycle progress and study records for a single participant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ParticipantProfile,
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Blocked({ reason }: { reason: string }) {
  return (
    <p className="inset-tile flex items-start gap-2 rounded-2xl px-4 py-3 text-sm text-muted-foreground">
      <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {reason}
    </p>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="frost rounded-3xl p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ScreeningPanel({ participant }: { participant: Participant }) {
  const save = useRecordScreening();
  const screeningGate = canPerform(participant, "screening");
  const locked = !screeningGate.allowed;
  const [screeningDate, setScreeningDate] = useState(participant.screeningDate ?? "");
  const [eligibility, setEligibility] = useState<EligibilityStatus>(
    participant.eligibilityStatus,
  );
  const [inclusion, setInclusion] = useState(participant.inclusionCriteriaMet ?? false);
  const [exclusion, setExclusion] = useState(participant.exclusionCriteriaPresent ?? false);
  const [notes, setNotes] = useState(participant.screeningNotes ?? "");

  return (
    <Panel
      title="Screening"
      description="Record the screening visit and the eligibility outcome. A participant must be eligible before consent can be taken."
    >
      {locked ? <Blocked reason={screeningGate.reason ?? ""} /> : null}
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate({
            id: participant.id,
            screeningDate: screeningDate || null,
            eligibilityStatus: eligibility,
            inclusionCriteriaMet: inclusion,
            exclusionCriteriaPresent: exclusion,
            screeningNotes: notes.trim() || null,
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="screening-date">Screening date</Label>
          <Input
            id="screening-date"
            type="date"
            value={screeningDate}
            disabled={locked}
            onChange={(event) => setScreeningDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eligibility">Eligibility status</Label>
          <Select
            value={eligibility}
            disabled={locked}
            onValueChange={(value) => setEligibility(value as EligibilityStatus)}
          >
            <SelectTrigger id="eligibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="eligible">Eligible</SelectItem>
              <SelectItem value="not_eligible">Not Eligible</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="inset-tile flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
          <Checkbox
            checked={inclusion}
            disabled={locked}
            onCheckedChange={(value) => setInclusion(value === true)}
          />
          Inclusion criteria met
        </label>
        <label className="inset-tile flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
          <Checkbox
            checked={exclusion}
            disabled={locked}
            onCheckedChange={(value) => setExclusion(value === true)}
          />
          Exclusion criteria present
        </label>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="screening-notes">Screening notes</Label>
          <Textarea
            id="screening-notes"
            value={notes}
            disabled={locked}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="rounded-xl" disabled={locked || save.isPending}>
            {save.isPending ? "Saving…" : "Save screening"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function ConsentPanel({ participant }: { participant: Participant }) {
  const gate = canPerform(participant, "consent");
  const save = useRecordConsent();
  const [status, setStatus] = useState<ConsentStatus>(participant.consentStatus);
  const [date, setDate] = useState(participant.consentDate ?? "");
  const [confirmed, setConfirmed] = useState(participant.consentConfirmed);
  const [notes, setNotes] = useState(participant.consentNotes ?? "");

  const problem =
    status === "pending" && confirmed
      ? 'The confirmation is ticked but the consent status is still "Pending". Choose "Obtained" to record consent.'
      : status === "obtained" && !confirmed
        ? "Tick the confirmation that the signed consent form is on file."
        : status === "obtained" && !date
          ? "Enter the date consent was obtained."
          : null;

  return (
    <Panel
      title="Informed consent"
      description="Consent must be obtained and confirmed before the participant can be enrolled."
    >
      {gate.allowed ? null : <Blocked reason={gate.reason ?? ""} />}
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (problem) return;
          save.mutate({
            id: participant.id,
            consentStatus: status,
            consentDate: date || null,
            consentConfirmed: confirmed,
            consentNotes: notes.trim() || null,
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="consent-status">Consent status</Label>
          <Select
            value={status}
            disabled={!gate.allowed}
            onValueChange={(value) => setStatus(value as ConsentStatus)}
          >
            <SelectTrigger id="consent-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="obtained">Obtained</SelectItem>
              <SelectItem value="not_obtained">Not Obtained</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="consent-date">Consent date</Label>
          <Input
            id="consent-date"
            type="date"
            value={date}
            disabled={!gate.allowed}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <label className="inset-tile flex items-center gap-3 rounded-2xl px-4 py-3 text-sm sm:col-span-2">
          <Checkbox
            checked={confirmed}
            disabled={!gate.allowed}
            onCheckedChange={(value) => setConfirmed(value === true)}
          />
          I confirm the signed informed consent form is on file for this participant.
        </label>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="consent-notes">Notes</Label>
          <Textarea
            id="consent-notes"
            value={notes}
            disabled={!gate.allowed}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
        {gate.allowed && problem ? (
          <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">
            {problem}
          </p>
        ) : null}
        <div className="sm:col-span-2">
          <Button
            type="submit"
            className="rounded-xl"
            disabled={!gate.allowed || save.isPending || Boolean(problem)}
          >
            {save.isPending ? "Saving…" : "Save consent"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function CheckRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="inset-tile flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={ok ? "font-semibold text-status-complete" : "font-semibold text-muted-foreground"}>
        {ok ? "✓ " : ""}
        {value}
      </span>
    </div>
  );
}

function EnrolmentPanel({ participant }: { participant: Participant }) {
  const gate = canPerform(participant, "enrolment");
  const save = useRecordEnrolment();
  const [date, setDate] = useState(participant.enrolledAt ?? localToday());
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState(participant.enrolmentNotes ?? "");
  const enrolled = participant.enrolmentConfirmed;

  return (
    <Panel
      title="Enrolment"
      description="Available once the participant is eligible, consent has been obtained and the consent confirmation is recorded. Enrolment is permanent once confirmed."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <CheckRow
          label="Eligibility"
          value={ELIGIBILITY_LABELS[participant.eligibilityStatus]}
          ok={participant.eligibilityStatus === "eligible"}
        />
        <CheckRow
          label="Consent"
          value={CONSENT_LABELS[participant.consentStatus]}
          ok={participant.consentStatus === "obtained"}
        />
        <CheckRow
          label="Consent confirmation"
          value={participant.consentConfirmed ? "Recorded" : "Not recorded"}
          ok={participant.consentConfirmed}
        />
      </div>

      {enrolled ? (
        <div className="inset-tile space-y-1 rounded-2xl px-4 py-3 text-sm">
          <p className="font-semibold">Enrolled on {formatDate(participant.enrolledAt)}.</p>
          <p className="text-muted-foreground">Enrollment confirmation recorded.</p>
          {participant.enrolmentNotes ? (
            <p className="text-muted-foreground">Notes: {participant.enrolmentNotes}</p>
          ) : null}
        </div>
      ) : (
        <>
          {gate.allowed ? null : <Blocked reason={gate.reason ?? ""} />}
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate({
                id: participant.id,
                enrolledAt: date,
                enrolmentConfirmed: confirmed,
                enrolmentNotes: notes.trim() || null,
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="enrol-date">Enrollment date</Label>
              <Input
                id="enrol-date"
                type="date"
                value={date}
                disabled={!gate.allowed}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>
            <label className="inset-tile flex items-center gap-3 rounded-2xl px-4 py-3 text-sm sm:col-span-2">
              <Checkbox
                checked={confirmed}
                disabled={!gate.allowed}
                onCheckedChange={(value) => setConfirmed(value === true)}
              />
              I confirm this participant is enrolled in the study.
            </label>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="enrol-notes">Enrollment notes</Label>
              <Textarea
                id="enrol-notes"
                value={notes}
                disabled={!gate.allowed}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                className="rounded-xl"
                disabled={!gate.allowed || !confirmed || !date || save.isPending}
              >
                {save.isPending ? "Saving…" : "Confirm enrollment"}
              </Button>
            </div>
          </form>
        </>
      )}
    </Panel>
  );
}

function BaselinePanel({ participant }: { participant: Participant }) {
  const gate = canPerform(participant, "baseline");
  const complete = useCompleteBaseline();
  const { data } = useStudyData(participant.id);
  const required = ["NRS", "DN4", "NEPIQoL"];
  const missing = required.filter(instrument => !data?.assessments.some(a => a.milestone === "baseline" && a.instrument === instrument && a.status === "completed"));
  const missingRecords = [!data?.records["demographics"]?.length && "demographics", !data?.records["clinical_data"]?.length && "clinical data"].filter(Boolean);
  const ready = missing.length === 0 && missingRecords.length === 0;

  return (
    <Panel
      title="Baseline"
      description="Baseline data collection happens after enrolment and must be completed before randomisation."
    >
      {participant.baselineCompletedAt ? (
        <p className="text-sm text-muted-foreground">
          Baseline completed on {formatDate(participant.baselineCompletedAt)}.
        </p>
      ) : gate.allowed ? null : (
        <Blocked reason={gate.reason ?? ""} />
      )}
      <div className="space-y-5 [&>*+*]:border-t [&>*+*]:border-border [&>*+*]:pt-5">
        <InstrumentPanel participant={participant} visit="baseline" instrument="NRS" />
        <InstrumentPanel participant={participant} visit="baseline" instrument="DN4" />
        <InstrumentPanel participant={participant} visit="baseline" instrument="NEPIQoL" />
      </div>
      {!ready && <Blocked reason={`Baseline cannot be completed. Missing: ${[...missingRecords, ...missing].join(", ").replace("NEPIQoL", "NePIQoL")}.`} />}
      <Button
        className="rounded-xl"
        disabled={!gate.allowed || !ready || complete.isPending || Boolean(participant.baselineCompletedAt)}
        onClick={() => complete.mutate({ id: participant.id })}
      >
        Mark baseline complete
      </Button>
    </Panel>
  );
}

function RandomizationPanel({ participant }: { participant: Participant }) {
  const gate = canPerform(participant, "randomization");
  const randomize = useRandomize();

  return (
    <Panel
      title="Randomisation"
      description="Computer-generated 1:1 random allocation to Control or Intervention. The group cannot be chosen manually and is permanent once assigned. Available only after eligibility, consent, enrolment and baseline are complete."
    >
      {participant.randomizedAt ? (
        <p className="text-sm text-muted-foreground">
          Allocated to{" "}
          <strong>
            {participant.studyGroup ? STUDY_GROUP_LABELS[participant.studyGroup] : "—"}
          </strong>{" "}
          on {formatDate(participant.randomizedAt)}.
        </p>
      ) : (
        <>
          {gate.allowed ? null : <Blocked reason={gate.reason ?? ""} />}
          <ConfirmDialog
            trigger={
              <Button className="rounded-xl" disabled={!gate.allowed || randomize.isPending}>
                Randomise participant
              </Button>
            }
            title="Randomise this participant?"
            description="The allocation is permanent and cannot be changed once assigned."
            confirmLabel="Randomise"
            onConfirm={() => randomize.mutate({ id: participant.id })}
          />
        </>
      )}
    </Panel>
  );
}

function FollowUpPanel({
  participant,
  milestone,
}: {
  participant: Participant;
  milestone: "day_15" | "day_30";
}) {
  const gate = canPerform(participant, milestone);
  const complete = useCompleteFollowUp();
  const open = useOpenDay15();
  const openGate = canPerform(participant, "day_15_open");
  const label = milestone === "day_15" ? "Day 15" : "Day 30";
  const completedAt =
    milestone === "day_15" ? participant.day15CompletedAt : participant.day30CompletedAt;
  const { data } = useStudyData(participant.id);
  // DN4 is recorded at follow-ups but is not required to close the visit: the protocol does not
  // establish it as mandatory at Day 15/Day 30 (see docs/follow-up-dn4-nrs.md).
  const ready = ["NRS", "NEPIQoL"].every(instrument => data?.assessments.some(a => a.milestone === milestone && a.instrument === instrument && a.status === "completed"));

  return (
    <Panel
      title={`${label} follow-up`}
      description={`Follow-up visits open only after randomisation${
        milestone === "day_30" ? " and after Day 15 is completed" : ""
      }.`}
    >
      {completedAt ? (
        <p className="text-sm text-muted-foreground">
          {label} completed on {formatDate(completedAt)}.
        </p>
      ) : gate.allowed ? null : (
        <Blocked reason={gate.reason ?? ""} />
      )}
      {milestone === "day_15" && !participant.day15OpenedAt ? (
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={!openGate.allowed || open.isPending}
          onClick={() => open.mutate({ id: participant.id })}
        >
          Open Day 15 follow-up
        </Button>
      ) : null}
      <div className="space-y-6 [&>*+*]:border-t [&>*+*]:border-border [&>*+*]:pt-6">
        <InstrumentPanel participant={participant} visit={milestone} instrument="DN4" />
        <InstrumentPanel participant={participant} visit={milestone} instrument="NRS" />
        <InstrumentPanel participant={participant} visit={milestone} instrument="NEPIQoL" />
        <ResearchRecordForm participant={participant} section="drps" visit={milestone} />
        <ResearchRecordForm participant={participant} section="drp_outcomes" visit={milestone} />
        <ResearchRecordForm participant={participant} section="followup" visit={milestone} />
        <ResearchRecordForm participant={participant} section="med_changes" visit={milestone} />
        <ResearchRecordForm participant={participant} section="adrs" visit={milestone} />
        <ResearchRecordForm participant={participant} section="interactions" visit={milestone} />
      </div>
      {!ready && !completedAt && <Blocked reason={`Complete the ${label} NRS and NePIQoL assessments before closing this visit.`} />}
      <Button
        className="rounded-xl"
        disabled={!gate.allowed || !ready || complete.isPending}
        onClick={() => complete.mutate({ id: participant.id, milestone })}
      >
        Mark {label} complete
      </Button>
    </Panel>
  );
}

function StudyCompletionPanel({ participant }: { participant: Participant }) {
  const [reason, setReason] = useState(participant.nonCompletionReason ?? "");
  const [lastContact, setLastContact] = useState(participant.lastContactDate ?? "");
  const [notes, setNotes] = useState(participant.completionNotes ?? "");
  const saveFn = useServerFn(saveStudyCompletion);
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          participantId: participant.id,
          nonCompletionReason: reason.trim() || null,
          lastContactDate: lastContact || null,
          completionNotes: notes.trim() || null,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: participantKey(participant.id) });
      toast.success("Study completion details saved.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save."),
  });
  const bothDone = Boolean(participant.day15CompletedAt && participant.day30CompletedAt);
  return (
    <Panel
      title="Study completion"
      description="Completion is derived from the actual Day 15 and Day 30 records — it cannot be marked manually."
    >
      <CheckRow
        label="Completed both follow-ups"
        value={bothDone ? "Yes" : "No"}
        ok={bothDone}
      />
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {!bothDone ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="non-completion-reason">Reason for non-completion</Label>
            <Textarea
              id="non-completion-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="last-contact-date">Date of last contact</Label>
          <Input
            id="last-contact-date"
            type="date"
            value={lastContact}
            onChange={(e) => setLastContact(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="completion-notes">Additional comments</Label>
          <Textarea
            id="completion-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="rounded-xl" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save completion details"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function StageLocked({ reason }: { reason: string }) {
  return (
    <section className="frost flex items-start gap-3 rounded-3xl p-6 text-sm text-muted-foreground">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {reason}
    </section>
  );
}

function ParticipantProfile() {
  const { participantId } = Route.useParams();
  const { data: participant, isPending, isError, refetch } = useParticipant(participantId);

  if (isPending) {
    return (
      <ResearchShell title="Participant" breadcrumbs={[{ label: "Research" }]}>
        <LoadingState label="Loading participant record" />
      </ResearchShell>
    );
  }

  if (isError || !participant) {
    return (
      <ResearchShell title="Participant" breadcrumbs={[{ label: "Research" }]}>
        <ErrorState
          description="This participant record could not be loaded."
          onRetry={() => {
            void refetch();
          }}
        />
      </ResearchShell>
    );
  }

  const percent = progressPercent(participant);
  const enrolled = participant.enrolmentConfirmed;
  const randomised = Boolean(participant.randomizedAt);

  return (
    <ResearchShell
      title={participant.participantCode}
      description="Complete lifecycle record for this study participant."
      breadcrumbs={[
        { label: "Research" },
        { label: "Participants", to: "/research/participants" },
        { label: participant.participantCode },
      ]}
      actions={<DownloadStudyReport participantId={participantId} />}
    >
      <section className="frost rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-display text-xl font-bold">{participant.participantCode}</p>
            <div className="flex flex-wrap gap-2">
              <LifecycleBadge stage={participant.lifecycleStage} />
              <EligibilityBadge status={participant.eligibilityStatus} />
              <ConsentBadge status={participant.consentStatus} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Group</dt>
              <dd className="font-semibold">
                {participant.studyGroup ? STUDY_GROUP_LABELS[participant.studyGroup] : "Not allocated"}
              </dd>
              {participant.studyGroup ? <OverrideIndicator participantId={participant.id} /> : null}
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Enrolled</dt>
              <dd className="font-semibold">{formatDate(participant.enrolledAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Site</dt>
              <dd className="font-semibold">{participant.site ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Study progress</span>
            <span>{percent}%</span>
          </div>
          <Progress value={percent} aria-label="Participant study progress" />
        </div>

        <div className="mt-6">
          <JourneyStepper record={participant} />
        </div>
      </section>

      <Tabs defaultValue="screening" className="space-y-5">
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex h-10 w-max gap-0.5">
            <TabsTrigger value="screening">Screening</TabsTrigger>
            <TabsTrigger value="consent">Consent</TabsTrigger>
            <TabsTrigger value="enrolment">Enrolment</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="clinical">Clinical Data</TabsTrigger>
            <TabsTrigger value="laboratory">Laboratory</TabsTrigger>
            <TabsTrigger value="baseline">Baseline</TabsTrigger>
            <TabsTrigger value="medications">Medication Review</TabsTrigger>
            <TabsTrigger value="drps">DRPs</TabsTrigger>
            <TabsTrigger value="randomization">Randomisation</TabsTrigger>
            <TabsTrigger value="intervention">Intervention</TabsTrigger>
            <TabsTrigger value="day_15">Day 15</TabsTrigger>
            <TabsTrigger value="day_30">Day 30</TabsTrigger>
            <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="screening">
          <ScreeningPanel participant={participant} />
        </TabsContent>
        <TabsContent value="consent">
          <ConsentPanel participant={participant} />
        </TabsContent>
        <TabsContent value="enrolment">
          <EnrolmentPanel participant={participant} />
        </TabsContent>

        <TabsContent value="demographics">
          {enrolled ? (
            <section className="frost rounded-3xl p-6">
              <ResearchRecordForm participant={participant} section="demographics" />
            </section>
          ) : (
            <StageLocked reason="Demographics open after the participant is enrolled." />
          )}
        </TabsContent>

        <TabsContent value="clinical">
          {enrolled ? (
            <section className="frost rounded-3xl p-6">
              <div className="space-y-8 [&>*+*]:border-t [&>*+*]:border-border [&>*+*]:pt-8">
                <ResearchRecordForm participant={participant} section="clinical" />
                <ResearchRecordForm participant={participant} section="adrs" />
              </div>
            </section>
          ) : (
            <StageLocked reason="Clinical data opens after the participant is enrolled." />
          )}
        </TabsContent>

        <TabsContent value="laboratory">
          {enrolled ? (
            <section className="frost rounded-3xl p-6">
              <ResearchRecordForm participant={participant} section="laboratory" />
            </section>
          ) : (
            <StageLocked reason="Laboratory and investigations open after the participant is enrolled." />
          )}
        </TabsContent>

        <TabsContent value="baseline">
          {enrolled ? (
            <BaselinePanel participant={participant} />
          ) : (
            <StageLocked reason="Baseline opens after the participant is enrolled." />
          )}
        </TabsContent>

        <TabsContent value="medications">
          {enrolled ? (
            <section className="frost rounded-3xl p-6">
              <div className="space-y-8 [&>*+*]:border-t [&>*+*]:border-border [&>*+*]:pt-8">
                <ResearchRecordForm participant={participant} section="medications" />
                <ResearchRecordForm participant={participant} section="interactions" visit={openDocumentationVisit(participant) ?? undefined} openOnly />
              </div>
            </section>
          ) : (
            <StageLocked reason="Medication review opens after the participant is enrolled." />
          )}
        </TabsContent>

        <TabsContent value="drps">
          {(() => {
            if (!enrolled) return <StageLocked reason="Drug-related problems open after the participant is enrolled." />;
            // DRPs can be documented at any time: linked to the open visit if there is one, otherwise "Outside scheduled visit".
            const openVisit = openDocumentationVisit(participant);
            return (
              <section className="frost rounded-3xl p-6">
                <ResearchRecordForm participant={participant} section="drps" visit={openVisit ?? undefined} openOnly />
              </section>
            );
          })()}
        </TabsContent>

        <TabsContent value="randomization">
          {participant.baselineCompletedAt || randomised ? (
            <RandomizationPanel participant={participant} />
          ) : (
            <StageLocked reason="Randomisation opens only after the baseline visit is completed." />
          )}
        </TabsContent>

        <TabsContent value="intervention">
          {randomised && participant.studyGroup === "intervention" ? (
            <section className="frost rounded-3xl p-6">
              <div className="space-y-8 [&>*+*]:border-t [&>*+*]:border-border [&>*+*]:pt-8">
                <ResearchRecordForm participant={participant} section="counselling" visit="day_15" />
                <ResearchRecordForm participant={participant} section="recommendations" />
              </div>
            </section>
          ) : (
            <StageLocked reason={randomised ? "Intervention records are only available to the intervention group." : "Intervention records open after randomisation."} />
          )}
        </TabsContent>

        <TabsContent value="day_15">
          {randomised ? (
            <FollowUpPanel participant={participant} milestone="day_15" />
          ) : (
            <StageLocked reason="Day 15 follow-up opens after randomisation." />
          )}
        </TabsContent>

        <TabsContent value="day_30">
          {participant.day15CompletedAt ? (
            <FollowUpPanel participant={participant} milestone="day_30" />
          ) : (
            <StageLocked reason="Day 30 follow-up opens once Day 15 is completed." />
          )}
        </TabsContent>

        <TabsContent value="outcomes">
          {enrolled ? <div className="space-y-6"><section className="frost rounded-3xl p-6"><OutcomesPanel participant={participant} /></section><StudyCompletionPanel participant={participant} /></div> : <StageLocked reason="Outcomes open after enrolment." />}
        </TabsContent>
      </Tabs>
    </ResearchShell>
  );
}

