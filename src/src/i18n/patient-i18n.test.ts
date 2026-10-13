import { describe, expect, it } from "vitest";
import { PATIENT_LANGS, langDef } from "./patient-languages";
import { patientUi } from "./patient-ui";
import { helpL10n } from "./patient-help";

describe("patient translations", () => {
  it("offers exactly English, Hindi, Kannada, Marathi and Urdu, English first", () => {
    expect(PATIENT_LANGS).toEqual(["en", "hi", "kn", "mr", "ur"]);
  });

  it("only Urdu is right-to-left", () => {
    expect(PATIENT_LANGS.filter((l) => langDef(l).dir === "rtl")).toEqual(["ur"]);
  });

  it("no translation is marked approved", () => {
    expect(PATIENT_LANGS.filter((l) => l !== "en" && langDef(l).status === "approved")).toEqual([]);
  });

  it("every language has every interface string filled in", () => {
    for (const l of PATIENT_LANGS) for (const v of Object.values(patientUi[l])) expect(v.trim()).not.toBe("");
  });

  it("emergency warnings keep every English item in every language", () => {
    for (const l of PATIENT_LANGS) {
      helpL10n.en.emergencyGroups.forEach((g, i) => {
        expect(helpL10n[l].emergencyGroups[i]?.items).toHaveLength(g.items.length);
        expect(Boolean(helpL10n[l].emergencyGroups[i]?.note)).toBe(Boolean(g.note));
      });
      expect(helpL10n[l].safeSteps.items).toHaveLength(helpL10n.en.safeSteps.items.length);
    }
  });

  it("every language tells Indian users to call 112 and never 999", () => {
    for (const l of PATIENT_LANGS) {
      expect(helpL10n[l].panelTitle).toContain("112");
      expect(JSON.stringify(helpL10n[l])).not.toContain("999");
    }
  });
});
