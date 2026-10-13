/**
 * Study instrument definitions — single source of truth for DN4, NePIQoL and
 * PCNE V9.1 content. Wording is reproduced exactly from the supplied source
 * documents; scoring is recomputed authoritatively in the database
 * (score_dn4 / score_nepiqol), and the client copy is display-only.
 */

/** Reproduction authorisation for copyrighted instrument wording has not been confirmed. */
export const INSTRUMENT_CONTENT_STATUS = "CONTENT_SOURCE_AVAILABLE — PENDING AUTHORIZATION/APPROVAL" as const;

// ---------------- DN4 (India/English, Version of 07 Jul 14, Mapi) ----------------
export const DN4_VERSION = "DN4 – India/English – Version of 07 Jul 14 – Mapi";
export const DN4_QUESTIONS: { question: string; items: string[] }[] = [
  {
    question: "Does the pain have one or more of the following characteristics?",
    items: ["Burning", "Painful cold", "Like jolts of electricity"],
  },
  {
    question:
      "Is the pain occurring along with one or more of the following symptoms in the same area?",
    items: ["Tingling", "Pricking", "Numbness", "Itching"],
  },
  {
    question:
      "Is the pain located in an area where the physical examination reveals one or more of the following characteristics?",
    items: ["Touch Hypoesthesia", "Pricking Hypoesthesia"],
  },
  {
    question: "In the painful area, can the pain be caused or increased by:",
    items: ["Brushing"],
  },
];
export const DN4_ITEM_COUNT = 10;
/** YES = 1, NO = 0; total = number of YES responses (0–10). */
export const scoreDn4 = (items: boolean[]) => items.filter(Boolean).length;

// ---------------- NePIQoL (42 items) ----------------
export const NEPIQOL_SCALES = {
  agreement: ["Strongly agree", "Agree", "Uncertain", "Disagree", "Strongly disagree"],
  frequency: ["Yes all the time", "Yes most of the time", "Some of the time", "Very rarely", "No not at all"],
} as const;
export type NepiqolScale = keyof typeof NEPIQOL_SCALES;

export const NEPIQOL_VERSION = "NePIQoL 42-item (version as supplied to the project)";

/**
 * The supplied source lists both response formats but does NOT state which
 * format each item uses. Until an approved mapping is supplied, every item is
 * shown with the agreement labels and flagged as unverified. Scoring is by
 * position only (position 1 = first listed option), so the stored meaning of
 * 1..5 never depends on which labels are displayed.
 */
export const NEPIQOL_MAPPING_STATUS = "WAITING FOR APPROVED RESPONSE-OPTION MAPPING" as const;
export const NEPIQOL_MAPPING_VERIFIED = false;
const DISPLAY_SCALE_UNTIL_VERIFIED: NepiqolScale = "agreement";

export const NEPIQOL_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Pain and other symptoms",
    items: [
      "Excessive cold makes the pain worse",
      "Light or gentle touch makes the pain worse",
      "Heavy or firm touch makes the pain worse",
      "I worry about the next painful attack",
      "I feel tingling in the painful area[s]",
      "I feel numbness in the painful area[s]",
      "I feel a cold sensation in the painful area[s]",
      "I feel a hot sensation in the painful area[s]",
      "I have problems with my balance because of the pain",
    ],
  },
  {
    title: "Relationships",
    items: [
      "The pain affects my relationships with those I am close to",
      "I am dependent upon those I am close to because of the pain",
      "I involve myself with people I am close to as much as I used to despite the pain",
      "People I am close to find it difficult because I am in pain",
    ],
  },
  {
    title: "Daily Activities",
    items: [
      "The pain affects my ability to do my daily work",
      "I still enjoy my hobbies/leisure activities despite the pain",
      "The pain restricts my travelling, e.g. by car, bus, train etc",
      "Physical activity makes the pain worse",
      "I can’t walk as far as I used to",
      "I have difficulty standing because of the pain",
      "I have difficulty sitting because of the pain",
      "I find it hard to get to sleep",
      "The pain disturbs my sleep",
      "I get exhausted because of the pain",
      "The pain affects my sex life",
      "It takes me so much longer to do anything because of the pain",
      "I no longer go on holiday because of the pain",
      "I don’t go out as much as I used to",
    ],
  },
  {
    title: "The way pain makes you feel",
    items: [
      "I get frustrated when I can’t do the things I used to be able to do",
      "I get angry with myself because of the pain",
      "I feel isolated because of the pain",
      "I want to be on my own when the pain is bad",
      "I have difficulty concentrating when the pain is bad",
      "I can distract myself from the pain",
      "I can cope with the pain",
      "I worry about the treatment I may need to have in the future",
    ],
  },
  {
    title: "Personal/Self care",
    items: [
      "Washing/showering/shaving is difficult because of the numbness",
      "Washing/showering/shaving is difficult because of the pain",
      "Washing/showering/shaving can make the pain worse",
      "Going to the toilet can be difficult for me",
      "Some types of clothes make the pain worse, e.g. fitted or loose",
      "Dressing/undressing can be difficult because of the pain",
      "I am worse off financially because of the pain",
    ],
  },
];

export const NEPIQOL_ITEM_COUNT = 42;
export const NEPIQOL_REVERSE_ITEMS = [12, 15, 33, 34];
export const NEPIQOL_SUBSCALES: { key: string; label: string; items: number[]; max: number }[] = [
  { key: "symptoms", label: "Symptoms", items: [1, 2, 3, 5, 6, 7, 8, 38], max: 40 },
  { key: "relationships", label: "Relationships", items: [10, 11, 12, 13, 24], max: 25 },
  { key: "psychological", label: "Psychological", items: [4, 28, 29, 30, 32, 33, 34, 35], max: 40 },
  { key: "social_activity", label: "Social Activity", items: [14, 15, 16, 23, 25, 26, 27, 31], max: 40 },
  { key: "physical", label: "Physical", items: [9, 17, 18, 19, 20, 21, 22], max: 35 },
  { key: "personal", label: "Personal", items: [36, 37, 39, 40, 41, 42], max: 30 },
];
export const NEPIQOL_TOTAL_RANGE = [42, 210] as const;

/** Auditable per-item definition. Fields not supported by the source are marked unverified. */
export type NepiqolItem = {
  number: number;
  text: string;
  section: string;
  /** "unverified" until the approved item-to-format mapping is supplied. */
  responseType: NepiqolScale | "unverified";
  /** Labels displayed; position 1..5 is what is stored and scored. */
  options: readonly string[];
  /** Normal: position 1 scores 5 … position 5 scores 1. Reverse: position = score. */
  scoring: "normal" | "reverse";
  subscale: string;
  version: string;
};
export const NEPIQOL_ITEMS: NepiqolItem[] = (() => {
  let n = 0;
  return NEPIQOL_SECTIONS.flatMap((s) =>
    s.items.map((text) => {
      const number = ++n;
      return {
        number,
        text,
        section: s.title,
        responseType: NEPIQOL_MAPPING_VERIFIED ? DISPLAY_SCALE_UNTIL_VERIFIED : "unverified",
        options: NEPIQOL_SCALES[DISPLAY_SCALE_UNTIL_VERIFIED],
        scoring: NEPIQOL_REVERSE_ITEMS.includes(number) ? "reverse" : "normal",
        subscale: NEPIQOL_SUBSCALES.find((x) => x.items.includes(number))?.key ?? "",
        version: NEPIQOL_VERSION,
      } satisfies NepiqolItem;
    }),
  );
})();

/** positions: selected option index 1..5 (1 = first listed option). */
export function scoreNepiqol(positions: number[]) {
  const scores = positions.map((p, i) => (NEPIQOL_REVERSE_ITEMS.includes(i + 1) ? p : 6 - p));
  const total = scores.reduce((a, b) => a + b, 0);
  const subscales = Object.fromEntries(
    NEPIQOL_SUBSCALES.map((s) => [s.key, s.items.reduce((a, n) => a + (scores[n - 1] ?? 0), 0)]),
  );
  return { total, subscales };
}

// ---------------- PCNE Classification for Drug-Related Problems V9.1 ----------------
export const PCNE_VERSION = "V9.1";
export type PcneCode = { code: string; label: string; group: string };
const g = (group: string, rows: [string, string][]): PcneCode[] =>
  rows.map(([code, label]) => ({ code, label, group }));

export const PCNE_PROBLEMS: PcneCode[] = [
  ...g("P1 — Treatment effectiveness", [
    ["P1.1", "No effect of drug treatment despite correct use"],
    ["P1.2", "Effect of drug treatment not optimal"],
    ["P1.3", "Untreated symptoms or indication"],
  ]),
  ...g("P2 — Treatment safety", [["P2.1", "Adverse drug event (possibly) occurring"]]),
  ...g("P3 — Other", [
    ["P3.1", "Unnecessary drug-treatment"],
    ["P3.2", "Unclear problem/complaint. Further clarification necessary"],
  ]),
];

export const PCNE_CAUSES: PcneCode[] = [
  ...g("C1 — Drug selection", [
    ["C1.1", "Inappropriate drug according to guidelines/formulary"],
    ["C1.2", "No indication for drug"],
    ["C1.3", "Inappropriate combination of drugs, or drugs and herbal medications, or drugs and dietary supplements"],
    ["C1.4", "Inappropriate duplication of therapeutic group or active ingredient"],
    ["C1.5", "No or incomplete drug treatment in spite of existing indication"],
    ["C1.6", "Too many different drugs/active ingredients prescribed for indication"],
  ]),
  ...g("C2 — Drug form", [["C2.1", "Inappropriate drug form/formulation (for this patient)"]]),
  ...g("C3 — Dose selection", [
    ["C3.1", "Drug dose too low"],
    ["C3.2", "Drug dose of a single active ingredient too high"],
    ["C3.3", "Dosage regimen not frequent enough"],
    ["C3.4", "Dosage regimen too frequent"],
    ["C3.5", "Dose timing instructions wrong, unclear or missing"],
  ]),
  ...g("C4 — Treatment duration", [
    ["C4.1", "Duration of treatment too short"],
    ["C4.2", "Duration of treatment too long"],
  ]),
  ...g("C5 — Dispensing", [
    ["C5.1", "Prescribed drug not available"],
    ["C5.2", "Necessary information not provided or incorrect advice provided"],
    ["C5.3", "Wrong drug, strength or dosage advised (OTC)"],
    ["C5.4", "Wrong drug or strength dispensed"],
  ]),
  ...g("C6 — Drug use process", [
    ["C6.1", "Inappropriate timing of administration or dosing intervals by a health professional"],
    ["C6.2", "Drug under-administered by a health professional"],
    ["C6.3", "Drug over-administered by a health professional"],
    ["C6.4", "Drug not administered at all by a health professional"],
    ["C6.5", "Wrong drug administered by a health professional"],
    ["C6.6", "Drug administered via wrong route by a health professional"],
  ]),
  ...g("C7 — Patient related", [
    ["C7.1", "Patient intentionally uses/takes less drug than prescribed or does not take the drug at all for whatever reason"],
    ["C7.2", "Patient uses/takes more drug than prescribed"],
    ["C7.3", "Patient abuses drug (unregulated overuse)"],
    ["C7.4", "Patient decides to use unnecessary drug"],
    ["C7.5", "Patient takes food that interacts"],
    ["C7.6", "Patient stores drug inappropriately"],
    ["C7.7", "Inappropriate timing or dosing intervals"],
    ["C7.8", "Patient unintentionally administers/uses the drug in a wrong way"],
    ["C7.9", "Patient physically unable to use drug/form as directed"],
    ["C7.10", "Patient unable to understand instructions properly"],
  ]),
  ...g("C8 — Patient transfer related", [["C8.1", "Medication reconciliation problem"]]),
  ...g("C9 — Other", [
    ["C9.1", "No or inappropriate outcome monitoring (incl. TDM)"],
    ["C9.2", "Other cause; specify"],
    ["C9.3", "No obvious cause"],
  ]),
];

export const PCNE_INTERVENTIONS: PcneCode[] = [
  ...g("I0 — No intervention", [["I0.1", "No intervention"]]),
  ...g("I1 — At prescriber level", [
    ["I1.1", "Prescriber informed only"],
    ["I1.2", "Prescriber asked for information"],
    ["I1.3", "Intervention proposed to prescriber"],
    ["I1.4", "Intervention discussed with prescriber"],
  ]),
  ...g("I2 — At patient level", [
    ["I2.1", "Patient (drug) counselling"],
    ["I2.2", "Written information provided (only)"],
    ["I2.3", "Patient referred to prescriber"],
    ["I2.4", "Spoken to family member/caregiver"],
  ]),
  ...g("I3 — At drug level", [
    ["I3.1", "Drug changed to ..."],
    ["I3.2", "Dosage changed to ..."],
    ["I3.3", "Formulation changed to ..."],
    ["I3.4", "Instructions for use changed to ..."],
    ["I3.5", "Drug paused or stopped"],
    ["I3.6", "Drug started"],
  ]),
  ...g("I4 — Other intervention/activity", [
    ["I4.1", "Other intervention (specify)"],
    ["I4.2", "Side effect reported to authorities"],
  ]),
];

export const PCNE_ACCEPTANCE: PcneCode[] = [
  ...g("A1 — Intervention accepted", [
    ["A1.1", "Intervention accepted and fully implemented"],
    ["A1.2", "Intervention accepted, partially implemented"],
    ["A1.3", "Intervention accepted but not implemented"],
    ["A1.4", "Intervention accepted, implementation unknown"],
  ]),
  ...g("A2 — Intervention not accepted", [
    ["A2.1", "Intervention not accepted: not feasible"],
    ["A2.2", "Intervention not accepted: no agreement"],
    ["A2.3", "Intervention not accepted: other reason (specify)"],
    ["A2.4", "Intervention not accepted: unknown reason"],
  ]),
  ...g("A3 — Other", [
    ["A3.1", "Intervention proposed, acceptance unknown"],
    ["A3.2", "Intervention not proposed"],
  ]),
];

export const PCNE_OUTCOMES: PcneCode[] = [
  ...g("O0 — Problem status unknown", [["O0.1", "Problem status unknown"]]),
  ...g("O1 — Problem totally solved", [["O1.1", "Problem totally solved"]]),
  ...g("O2 — Problem partially solved", [["O2.1", "Problem partially solved"]]),
  ...g("O3 — Problem not solved", [
    ["O3.1", "Problem not solved, lack of cooperation of patient"],
    ["O3.2", "Problem not solved, lack of cooperation of prescriber"],
    ["O3.3", "Problem not solved, intervention not effective"],
    ["O3.4", "No need or possibility to solve problem"],
  ]),
];

export const codesOf = (list: PcneCode[]) => list.map((c) => c.code) as [string, ...string[]];
export const labelOf = (list: PcneCode[], code: string | null | undefined) =>
  code ? (list.find((c) => c.code === code)?.label ?? code) : "—";

export const PENDING_PROTOCOL = "PENDING PROTOCOL CONFIRMATION";
