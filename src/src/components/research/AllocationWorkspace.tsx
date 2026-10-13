import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, History } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { STUDY_GROUPS, STUDY_GROUP_LABELS, type StudyGroup } from "@/lib/study";
import type { AllocationRecord } from "@/lib/allocation.functions";

/**
 * Shared allocation-correction workspace used by Randomisation Control and
 * Admins Access. Each caller supplies its own server functions, which perform
 * their own server-side authorisation.
 */
type SearchRow = {
  id: string;
  participantCode: string;
  currentGroup: StudyGroup | null;
  randomised: boolean;
};
export type AllocationApi = {
  key: string;
  search: (opts: { data: { query: string } }) => Promise<SearchRow[]>;
  get: (opts: { data: { participantId: string } }) => Promise<AllocationRecord>;
  override: (opts: {
    data: {
      participantId: string;
      expectedGroup: StudyGroup;
      newGroup: StudyGroup;
      reason: string;
      protocolReviewed: true;
    };
  }) => Promise<AllocationRecord>;
};

const fmtDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not recorded";

export function AllocationWorkspace({
  api,
  listAll = false,
}: {
  api: AllocationApi;
  listAll?: boolean;
}) {
  const search = useServerFn(api.search);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useQuery({
    queryKey: ["allocation-search", api.key, submitted],
    queryFn: () => search({ data: { query: submitted } }),
    enabled: listAll || submitted.length > 0,
    retry: false,
  });

  return (
    <div className="space-y-8">
      <section className="frost rounded-2xl p-5">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setSelectedId(null);
            setSubmitted(query.trim());
          }}
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="participant-search">Search participant</Label>
            <Input
              id="participant-search"
              placeholder="NCC-XXXX"
              value={query}
              maxLength={40}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="rounded-xl"
            disabled={!listAll && !query.trim()}
          >
            <Search aria-hidden="true" className="size-4" /> Search
          </Button>
        </form>

        {listAll || submitted ? (
          <div className="mt-4">
            {results.isPending ? (
              <LoadingState label="Searching" />
            ) : results.error ? (
              <ErrorState
                description={results.error.message}
                onRetry={() => void results.refetch()}
              />
            ) : results.data && results.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No participant matches that ID.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {results.data?.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={`flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left text-sm transition-colors hover:bg-secondary ${selectedId === r.id ? "bg-secondary" : ""}`}
                    >
                      <span className="font-mono font-semibold">{r.participantCode}</span>
                      <span className="text-muted-foreground">
                        {r.randomised && r.currentGroup
                          ? STUDY_GROUP_LABELS[r.currentGroup]
                          : "Not randomised"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      {selectedId ? <AllocationPanel api={api} participantId={selectedId} /> : null}
    </div>
  );
}

function AllocationPanel({ api, participantId }: { api: AllocationApi; participantId: string }) {
  const fetchRecord = useServerFn(api.get);
  const record = useQuery({
    queryKey: ["allocation-record", api.key, participantId],
    queryFn: () => fetchRecord({ data: { participantId } }),
    retry: false,
  });

  if (record.isPending) return <LoadingState label="Loading allocation" />;
  if (record.error)
    return <ErrorState description={record.error.message} onRetry={() => void record.refetch()} />;
  const r = record.data;

  return (
    <section className="space-y-8">
      <div className="frost rounded-2xl p-6">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Participant</dt>
            <dd className="mt-1 font-mono text-lg font-semibold">
              <Link
                to="/research/participants/$participantId"
                params={{ participantId: r.participantId }}
                className="text-brand-deep hover:underline"
              >
                {r.participantCode}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Allocation status
            </dt>
            <dd className="mt-1 font-semibold">
              {r.randomised ? "Randomised · Locked" : "Not randomised"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Current allocation
            </dt>
            <dd className="mt-2 rounded-xl border border-border px-4 py-3 font-display text-lg font-bold uppercase tracking-wider">
              {r.currentGroup ? STUDY_GROUP_LABELS[r.currentGroup] : "Not allocated"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Allocation date
            </dt>
            <dd className="mt-1">{fmtDateTime(r.randomisedAt)}</dd>
            <dt className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
              Override status
            </dt>
            <dd className="mt-1">
              {r.overrideCount > 0
                ? `Override applied (${r.overrideCount})`
                : r.randomised
                  ? "Original allocation"
                  : "Not applicable"}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex justify-end border-t border-border/60 pt-4">
          {r.randomised && r.currentGroup && r.status !== "withdrawn" ? (
            <ChangeAllocation api={api} record={r} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {r.randomised
                ? "Allocation cannot be changed for a withdrawn participant."
                : "Override is unavailable until the participant has been randomised."}
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <History aria-hidden="true" className="size-4" /> Allocation history
        </h2>
        {r.history.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No allocation has been recorded.</p>
        ) : (
          <ol className="mt-3 divide-y divide-border/60 border-y border-border/60">
            {r.history.map((e, i) => (
              <li key={i} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
                <div>
                  <p className="text-sm font-semibold">
                    {e.kind === "initial" ? "Initial randomisation" : "Allocation override"}
                  </p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(e.at)}</p>
                </div>
                <div className="text-sm">
                  <p>
                    {e.previousGroup ? `${STUDY_GROUP_LABELS[e.previousGroup]} → ` : ""}
                    <strong>{STUDY_GROUP_LABELS[e.group]}</strong>
                  </p>
                  {e.kind === "initial" && e.method ? (
                    <p className="text-muted-foreground">{e.method}</p>
                  ) : null}
                  {e.kind === "override" ? (
                    <>
                      <p className="text-muted-foreground">Changed by {e.byName}</p>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-secondary/60 px-3 py-2">
                        {e.reason}
                      </p>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function ChangeAllocation({ api, record }: { api: AllocationApi; record: AllocationRecord }) {
  const current = record.currentGroup as StudyGroup;
  const other = STUDY_GROUPS.find((g) => g !== current) as StudyGroup;
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [newGroup, setNewGroup] = useState<StudyGroup | "">("");
  const [reason, setReason] = useState("");
  const [protocolReviewed, setProtocolReviewed] = useState(false);
  const qc = useQueryClient();
  const run = useServerFn(api.override);

  const mutation = useMutation({
    mutationFn: () =>
      run({
        data: {
          participantId: record.participantId,
          expectedGroup: current,
          newGroup: newGroup as StudyGroup,
          reason: reason.trim(),
          protocolReviewed: true,
        },
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["allocation-record", api.key, record.participantId], updated);
      void qc.invalidateQueries();
      toast.success("Allocation changed", {
        description: "The override has been recorded in the audit history.",
      });
      setOpen(false);
      setConfirming(false);
      setNewGroup("");
      setReason("");
      setProtocolReviewed(false);
    },
    onError: (e) => {
      toast.error("Allocation not changed", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
      setConfirming(false);
      void qc.invalidateQueries({ queryKey: ["allocation-record", api.key, record.participantId] });
    },
  });

  const valid =
    newGroup !== "" && newGroup !== current && reason.trim().length > 0 && protocolReviewed;

  if (!open) {
    return (
      <Button variant="outline" className="rounded-xl" onClick={() => setOpen(true)}>
        Change allocation
      </Button>
    );
  }

  return (
    <div className="w-full space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Current allocation</Label>
          <p className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm font-semibold">
            {STUDY_GROUP_LABELS[current]}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>New allocation</Label>
          <RadioGroup
            value={newGroup}
            onValueChange={(v) => setNewGroup(v as StudyGroup)}
            className="flex gap-4 pt-2"
          >
            {STUDY_GROUPS.map((g) => (
              <label
                key={g}
                className={`flex items-center gap-2 text-sm ${g === current ? "text-muted-foreground/60" : ""}`}
              >
                <RadioGroupItem value={g} disabled={g === current} />
                {STUDY_GROUP_LABELS[g]}
              </label>
            ))}
          </RadioGroup>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="override-reason">Reason for allocation change</Label>
        <Textarea
          id="override-reason"
          rows={4}
          value={reason}
          maxLength={2000}
          onChange={(e) => setReason(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Document the reason for this exceptional change.
        </p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={protocolReviewed}
          onChange={(e) => setProtocolReviewed(e.target.checked)}
        />
        I have reviewed the study protocol and the approved allocation correction procedure, and
        this change is permitted.
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" className="rounded-xl" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={!valid}
          onClick={() => setConfirming(true)}
        >
          Review change
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={(o) => !mutation.isPending && setConfirming(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Randomisation Override</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  You are changing the recorded allocation for participant {record.participantCode}.
                </p>
                <p>
                  Current allocation: <strong>{STUDY_GROUP_LABELS[current]}</strong>
                </p>
                <p>
                  New allocation:{" "}
                  <strong>
                    {newGroup ? STUDY_GROUP_LABELS[newGroup] : STUDY_GROUP_LABELS[other]}
                  </strong>
                </p>
                <p>
                  Reason: <span className="whitespace-pre-wrap">{reason.trim()}</span>
                </p>
                <p>This action will be recorded in the research audit history.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              className="border-foreground/40"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Recording…" : "Confirm Allocation Change"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
