import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { saveQuestionnaire, saveResearchRecord } from "@/lib/research-data.functions";
import {
  DN4_QUESTIONS,
  DN4_VERSION,
  INSTRUMENT_CONTENT_STATUS,
  NEPIQOL_ITEMS,
  NEPIQOL_MAPPING_STATUS,
  NEPIQOL_SECTIONS,
  NEPIQOL_SUBSCALES,
  NEPIQOL_TOTAL_RANGE,
  PCNE_ACCEPTANCE,
  PCNE_CAUSES,
  PCNE_INTERVENTIONS,
  PCNE_OUTCOMES,
  PCNE_PROBLEMS,
  PCNE_VERSION,
  labelOf,
  scoreDn4,
  type PcneCode,
} from "@/lib/instruments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Visit = "baseline" | "day_15" | "day_30";
const VISIT_LABEL: Record<Visit, string> = { baseline: "Baseline", day_15: "Day 15", day_30: "Day 30" };
type Row = Record<string, unknown>;

export function ContentStatusNote({ source }: { source: string }) {
  return (
    <p className="inset-tile flex items-start gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground">
      <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        {source} · {INSTRUMENT_CONTENT_STATUS}. Reproduction authorisation for this wording has not
        been confirmed.
      </span>
    </p>
  );
}

function useQuestionnaireSave(participantId: string) {
  const client = useQueryClient();
  const save = useServerFn(saveQuestionnaire);
  return useMutation({
    mutationFn: (input: {
      milestone: Visit;
      instrument: "DN4" | "NEPIQoL";
      items: Array<boolean | number>;
    }) => save({ data: { participantId, ...input } as Parameters<typeof save>[0]["data"] }),
    onSuccess: async (_r, v) => {
      await client.invalidateQueries({ queryKey: ["study-data", participantId] });
      toast.success(`${v.instrument === "DN4" ? "DN4" : "NePIQoL"} saved and locked.`);
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not save the questionnaire."),
  });
}

function YesNo({
  id,
  value,
  onChange,
}: {
  id: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div role="radiogroup" aria-labelledby={id} className="flex gap-2">
      {[true, false].map((opt) => (
        <button
          key={String(opt)}
          type="button"
          role="radio"
          aria-checked={value === opt}
          onClick={() => onChange(opt)}
          className={`min-w-16 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${value === opt ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}
        >
          {opt ? "YES" : "NO"}
        </button>
      ))}
    </div>
  );
}

export function Dn4Form({ participantId, visit }: { participantId: string; visit: Visit }) {
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => Array(10).fill(null));
  const save = useQuestionnaireSave(participantId);
  const answered = answers.filter((a) => a !== null).length;
  const complete = answered === 10;
  let index = 0;
  return (
    <div className="space-y-4">
      <ContentStatusNote source={DN4_VERSION} />
      <div className="flex items-center gap-3 text-sm">
        <Progress value={answered * 10} className="h-2 flex-1" aria-label={`DN4 progress (${visit})`} />
        <span className="font-semibold">{answered}/10</span>
      </div>
      {DN4_QUESTIONS.map((q, qi) => (
        <fieldset key={qi} className="inset-tile space-y-3 rounded-lg p-4">
          <legend className="sr-only">Question {qi + 1}</legend>
          <p className="font-semibold">
            Question {qi + 1}: {q.question}
          </p>
          {q.items.map((item) => {
            const i = index++;
            const id = `dn4-${visit}-item-${i}`;
            return (
              <div key={item} className="flex flex-wrap items-center justify-between gap-3">
                <span id={id} className="text-sm">
                  {i + 1}. {item}
                </span>
                <YesNo
                  id={id}
                  value={answers[i] ?? null}
                  onChange={(v) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
                />
              </div>
            );
          })}
        </fieldset>
      ))}
      <p className="text-sm">
        Provisional total:{" "}
        <strong>{complete ? `${scoreDn4(answers as boolean[])} / 10` : "—"}</strong>{" "}
        <span className="text-muted-foreground">
          (YES = 1, NO = 0; final score is calculated by the server)
        </span>
      </p>
      <ConfirmDialog
        trigger={
          <Button disabled={!complete || save.isPending}>
            {save.isPending ? "Saving…" : "Complete DN4"}
          </Button>
        }
        title="Complete and lock DN4?"
        description="Completed assessments cannot be edited or deleted."
        confirmLabel="Complete DN4"
        onConfirm={() =>
          save.mutate({ milestone: visit, instrument: "DN4", items: answers as boolean[] })
        }
      />
    </div>
  );
}

export function NepiqolForm({ participantId, visit }: { participantId: string; visit: Visit }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(42).fill(null));
  const [section, setSection] = useState(0);
  const save = useQuestionnaireSave(participantId);
  const answered = answers.filter((a) => a !== null).length;
  const complete = answered === 42;
  const items = NEPIQOL_ITEMS.filter((i) => i.section === NEPIQOL_SECTIONS[section]?.title);
  const firstMissing = answers.findIndex((a) => a === null);
  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <Progress
          value={(answered / 42) * 100}
          className="h-2 flex-1"
          aria-label="NePIQoL progress"
        />
        <span className="font-semibold">{answered}/42</span>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="NePIQoL sections">
        {NEPIQOL_SECTIONS.map((s, i) => {
          const sectionItems = NEPIQOL_ITEMS.filter((it) => it.section === s.title);
          const done = sectionItems.every((it) => answers[it.number - 1] !== null);
          return (
            <Button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={section === i}
              size="sm"
              variant={section === i ? "default" : "outline"}
              className="h-auto whitespace-normal py-1.5 text-left"
              onClick={() => setSection(i)}
            >
              {s.title}{" "}
              {done
                ? "✓"
                : `(${sectionItems.filter((it) => answers[it.number - 1] !== null).length}/${sectionItems.length})`}
            </Button>
          );
        })}
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const options = item.options;
          const id = `nepiqol-${visit}-${item.number}`;
          return (
            <div
              key={item.number}
              role="group"
              aria-labelledby={id}
              className="inset-tile space-y-3 rounded-lg p-4"
            >
              <p id={id} className="flex gap-2 text-sm font-semibold leading-snug">
                <span className="shrink-0 tabular-nums">{item.number}.</span>
                <span className="min-w-0 break-words">{item.text}</span>
              </p>
              <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-2">
                {options.map((label, oi) => (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={answers[item.number - 1] === oi + 1}
                    onClick={() =>
                      setAnswers((a) => a.map((x, j) => (j === item.number - 1 ? oi + 1 : x)))
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${answers[item.number - 1] === oi + 1 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={section === 0}
          onClick={() => setSection((s) => s - 1)}
        >
          Previous section
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={section === NEPIQOL_SECTIONS.length - 1}
          onClick={() => setSection((s) => s + 1)}
        >
          Next section
        </Button>
        {!complete && firstMissing >= 0 ? (
          <span className="text-sm text-muted-foreground">
            Next unanswered: item {firstMissing + 1}
          </span>
        ) : null}
      </div>
      <ConfirmDialog
        trigger={
          <Button disabled={!complete || save.isPending}>
            {save.isPending ? "Saving…" : "Complete NePIQoL"}
          </Button>
        }
        title="Complete and lock NePIQoL?"
        description="Completed assessments cannot be edited or deleted. Scores are calculated by the server."
        confirmLabel="Complete NePIQoL"
        onConfirm={() =>
          save.mutate({ milestone: visit, instrument: "NEPIQoL", items: answers as number[] })
        }
      />
    </div>
  );
}

export function QuestionnaireResult({
  instrument,
  responses,
  conductedAt,
}: {
  instrument: "DN4" | "NEPIQoL";
  responses: unknown;
  conductedAt: string | null;
}) {
  const r = (responses ?? {}) as { total?: number; subscales?: Record<string, number> };
  return (
    <div className="inset-tile space-y-2 rounded-lg p-4 text-sm">
      {instrument === "DN4" ? (
        <p className="font-semibold">DN4 total: {r.total ?? "—"} / 10</p>
      ) : (
        <>
          <p className="font-semibold">
            NePIQoL total: {r.total ?? "—"} (range {NEPIQOL_TOTAL_RANGE[0]}–{NEPIQOL_TOTAL_RANGE[1]}
            )
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {NEPIQOL_SUBSCALES.map((s) => (
              <li key={s.key}>
                {s.label}: {r.subscales?.[s.key] ?? "—"} / {s.max}
              </li>
            ))}
          </ul>
          <p className="text-xs text-destructive">
            {NEPIQOL_MAPPING_STATUS} — score not clinically finalised.
          </p>
        </>
      )}
      <p className="text-muted-foreground">
        Completed {conductedAt ? new Date(conductedAt).toLocaleString() : "—"}. Completed
        assessments are locked.
      </p>
    </div>
  );
}

// ---------------- PCNE V9.1 DRP form ----------------
function CodeSelect({
  id,
  label,
  list,
  value,
  onChange,
  optional,
}: {
  id: string;
  label: string;
  list: PcneCode[];
  value: string | null;
  onChange: (v: string | null) => void;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? "__none"} onValueChange={(v) => onChange(v === "__none" ? null : v)}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {optional ? <SelectItem value="__none">Not recorded</SelectItem> : null}
          {list.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.code} — {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CodeMulti({
  label,
  list,
  value,
  onChange,
}: {
  label: string;
  list: PcneCode[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const groups = useMemo(() => Array.from(new Set(list.map((c) => c.group))), [list]);
  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="text-sm font-medium">
        {label} <span className="text-muted-foreground">(select all that apply)</span>
      </legend>
      <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
        {groups.map((gname) => (
          <div key={gname}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {gname}
            </p>
            {list
              .filter((c) => c.group === gname)
              .map((c) => (
                <label key={c.code} className="flex items-start gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    checked={value.includes(c.code)}
                    onChange={(e) =>
                      onChange(
                        e.target.checked ? [...value, c.code] : value.filter((x) => x !== c.code),
                      )
                    }
                  />
                  <span>
                    <strong>{c.code}</strong> — {c.label}
                  </span>
                </label>
              ))}
          </div>
        ))}
      </div>
    </fieldset>
  );
}

type DrpValues = {
  problem_type: "potential" | "manifest" | null;
  pcne_problem_code: string | null;
  pcne_cause_codes: string[];
  pcne_intervention_codes: string[];
  pcne_acceptance_code: string | null;
  pcne_outcome_code: string | null;
  description: string;
  status: "open" | "resolved";
  resolution_notes: string;
} & Record<DrpTextKey, string>;
/** Researcher free-text documentation alongside the PCNE classification (each up to 20,000 characters). */
const DRP_TEXT = [
  { key: "suspected_medication", label: "Suspected / related medication", group: "problem" },
  { key: "clinical_details", label: "Clinical details", group: "problem" },
  { key: "researcher_observations", label: "Researcher observations", group: "problem" },
  { key: "cause_details", label: "Cause / contributing factors (details)", group: "pcne" },
  { key: "intervention_details", label: "Proposed intervention / intervention details", group: "pcne" },
  { key: "physician_communication", label: "Physician communication notes", group: "pcne" },
  { key: "physician_response_notes", label: "Physician response / acceptance notes", group: "pcne" },
  { key: "action_taken", label: "Action taken", group: "status" },
  { key: "outcome_notes", label: "Outcome notes", group: "status" },
  { key: "follow_up_observations", label: "Follow-up observations", group: "status" },
  { key: "additional_comments", label: "Additional comments", group: "status" },
] as const;
type DrpTextKey = (typeof DRP_TEXT)[number]["key"];
const DRP_TEXT_MAX = 20000;
const emptyText = () => Object.fromEntries(DRP_TEXT.map((f) => [f.key, ""])) as Record<DrpTextKey, string>;
const emptyDrp = (): DrpValues => ({
  problem_type: null,
  pcne_problem_code: null,
  pcne_cause_codes: [],
  pcne_intervention_codes: [],
  pcne_acceptance_code: null,
  pcne_outcome_code: null,
  description: "",
  status: "open",
  resolution_notes: "",
  ...emptyText(),
});
const fromRow = (r: Row): DrpValues => ({
  problem_type: (r["problem_type"] as DrpValues["problem_type"]) ?? null,
  pcne_problem_code: (r["pcne_problem_code"] as string) ?? null,
  pcne_cause_codes: (r["pcne_cause_codes"] as string[]) ?? [],
  pcne_intervention_codes: (r["pcne_intervention_codes"] as string[]) ?? [],
  pcne_acceptance_code: (r["pcne_acceptance_code"] as string) ?? null,
  pcne_outcome_code: (r["pcne_outcome_code"] as string) ?? null,
  description: String(r["description"] ?? ""),
  status: (r["status"] as DrpValues["status"]) ?? "open",
  resolution_notes: String(r["resolution_notes"] ?? ""),
  ...(Object.fromEntries(DRP_TEXT.map((f) => [f.key, String(r[f.key] ?? "")])) as Record<DrpTextKey, string>),
});

export function DrpSection({
  participantId,
  visit,
  rows,
  intervention,
  showAll = false,
}: {
  participantId: string;
  /** Open visit a new DRP is linked to; null = saved as "Outside scheduled visit". */
  visit: Visit | null;
  rows: Row[];
  intervention: boolean;
  /** DRP tab: list every DRP for the participant, not only this visit's. */
  showAll?: boolean;
}) {
  const client = useQueryClient();
  const saveFn = useServerFn(saveResearchRecord);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [values, setValues] = useState<DrpValues>(emptyDrp);
  const save = useMutation({
    mutationFn: (input: { recordId?: string; values: unknown }) =>
      saveFn({ data: { participantId, table: "drps", ...input } }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["study-data", participantId] });
      toast.success("DRP saved.");
      setEditing(null);
      setValues(emptyDrp());
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the DRP."),
  });
  const visible = showAll ? rows : rows.filter((r) => r["milestone"] === visit);
  const editingRow = editing && editing !== "new" ? rows.find((r) => r["id"] === editing) : undefined;
  const contextOf = (m: unknown) => (m ? VISIT_LABEL[m as Visit] : "Outside scheduled visit");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.problem_type) {
      toast.error("Choose whether the problem is potential or manifest.");
      return;
    }
    if (!values.pcne_problem_code) {
      toast.error("Choose a PCNE problem code.");
      return;
    }
    if (!values.description.trim()) {
      toast.error("Describe the problem.");
      return;
    }
    const tooLong = [{ key: "description", label: "Problem description" }, { key: "resolution_notes", label: "Resolution notes" }, ...DRP_TEXT].find(
      (f) => (values[f.key as keyof DrpValues] as string).length > DRP_TEXT_MAX,
    );
    if (tooLong) {
      toast.error(`${tooLong.label} is limited to ${DRP_TEXT_MAX.toLocaleString()} characters.`);
      return;
    }
    // Text is saved exactly as typed (line breaks and spacing kept); blank fields are stored as empty.
    const blankToNull = (v: string) => (v.trim() ? v : null);
    save.mutate({
      ...(editing && editing !== "new" ? { recordId: editing } : {}),
      values: {
        ...values,
        milestone: visit,
        resolution_notes: blankToNull(values.resolution_notes),
        ...Object.fromEntries(DRP_TEXT.map((f) => [f.key, blankToNull(values[f.key])])),
      },
    });
  };
  const id = (k: string) => `drp-${visit ?? "outside"}-${showAll ? "all" : "visit"}-${k}`;
  const textFields = (group: (typeof DRP_TEXT)[number]["group"]) =>
    DRP_TEXT.filter((f) => f.group === group).map((f) => (
      <div key={f.key} className="space-y-2 sm:col-span-2">
        <Label htmlFor={id(f.key)}>{f.label}</Label>
        <Textarea
          id={id(f.key)}
          value={values[f.key]}
          maxLength={DRP_TEXT_MAX}
          onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
        />
      </div>
    ));
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold">
          Drug-related problems (PCNE {PCNE_VERSION})
        </h3>
        <Button
          variant="outline"
          onClick={() => {
            setEditing("new");
            setValues(emptyDrp());
          }}
        >
          New DRP
        </Button>
      </div>
      {visible.length ? (
        <div className="space-y-2">
          {visible.map((r) => (
            <div
              key={String(r["id"])}
              className="inset-tile flex flex-wrap items-center justify-between gap-3 rounded-lg p-3 text-sm"
            >
              <span>
                {showAll ? `${contextOf(r["milestone"])} · ` : ""}
                <strong>{String(r["pcne_problem_code"] ?? "—")}</strong>{" "}
                {labelOf(PCNE_PROBLEMS, r["pcne_problem_code"] as string)} ·{" "}
                {String(r["problem_type"] ?? "—")} · {String(r["status"])}
                {r["pcne_outcome_code"] ? ` · ${String(r["pcne_outcome_code"])}` : ""}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(String(r["id"]));
                  setValues(fromRow(r));
                }}
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {showAll ? "No drug-related problems recorded for this participant yet." : "No drug-related problems recorded for this visit."}
        </p>
      )}
      {editing ? (
        <form onSubmit={submit} className="space-y-6">
          <p role="note" className="rounded-lg border border-hairline bg-mist px-3 py-2 text-xs text-foreground">
            {editingRow ? (
              <>This DRP belongs to <strong>{contextOf(editingRow["milestone"])}</strong> and stays there when edited.</>
            ) : visit ? (
              <>This DRP will be linked to the open <strong>{VISIT_LABEL[visit]}</strong> visit.</>
            ) : (
              <>No visit is open, so this DRP will be saved as <strong>Outside scheduled visit — not assigned to Baseline, Day 15 or Day 30</strong>. Participant and visit status are not changed.</>
            )}{" "}
            PCNE codes are chosen by the researcher; the free-text fields are researcher documentation and are not checked by the app.
          </p>
          <fieldset className="space-y-4">
            <legend className="w-full border-b border-border pb-2 text-sm font-semibold">
              Problem identification
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={id("type")}>Problem type</Label>
                <Select
                  value={values.problem_type ?? ""}
                  onValueChange={(v) =>
                    setValues({ ...values, problem_type: v as DrpValues["problem_type"] })
                  }
                >
                  <SelectTrigger id={id("type")}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="potential">Potential problem</SelectItem>
                    <SelectItem value="manifest">Manifest problem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CodeSelect
                id={id("problem")}
                label="Problem (P)"
                list={PCNE_PROBLEMS}
                value={values.pcne_problem_code}
                onChange={(v) => setValues({ ...values, pcne_problem_code: v })}
              />
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={id("desc")}>Problem description</Label>
                <Textarea
                  id={id("desc")}
                  value={values.description}
                  maxLength={DRP_TEXT_MAX}
                  onChange={(e) => setValues({ ...values, description: e.target.value })}
                  required
                />
              </div>
              {textFields("problem")}
            </div>
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="w-full border-b border-border pb-2 text-sm font-semibold">
              PCNE classification
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <CodeMulti
                label="Causes (C)"
                list={PCNE_CAUSES}
                value={values.pcne_cause_codes}
                onChange={(v) => setValues({ ...values, pcne_cause_codes: v })}
              />
              <CodeMulti
                label="Planned interventions (I)"
                list={PCNE_INTERVENTIONS}
                value={values.pcne_intervention_codes}
                onChange={(v) => setValues({ ...values, pcne_intervention_codes: v })}
              />
              {intervention ? (
                <CodeSelect
                  id={id("acceptance")}
                  label="Intervention acceptance (A)"
                  list={PCNE_ACCEPTANCE}
                  value={values.pcne_acceptance_code}
                  onChange={(v) => setValues({ ...values, pcne_acceptance_code: v })}
                  optional
                />
              ) : null}
              <CodeSelect
                id={id("outcome")}
                label="Status of the problem (O)"
                list={PCNE_OUTCOMES}
                value={values.pcne_outcome_code}
                onChange={(v) => setValues({ ...values, pcne_outcome_code: v })}
                optional
              />
              {textFields("pcne")}
            </div>
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="w-full border-b border-border pb-2 text-sm font-semibold">
              Status and resolution
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={id("status")}>Record status</Label>
                <Select
                  value={values.status}
                  onValueChange={(v) => setValues({ ...values, status: v as DrpValues["status"] })}
                >
                  <SelectTrigger id={id("status")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={id("notes")}>Resolution notes</Label>
                <Textarea
                  id={id("notes")}
                  value={values.resolution_notes}
                  maxLength={DRP_TEXT_MAX}
                  onChange={(e) => setValues({ ...values, resolution_notes: e.target.value })}
                />
              </div>
              {textFields("status")}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save DRP"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
