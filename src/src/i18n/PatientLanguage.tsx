import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Globe, Info } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PATIENT_LANG_STORAGE_KEY, isPatientLang, langDef, patientLanguageDefs, type PatientLang } from "./patient-languages";
import { patientUi, type UiKey } from "./patient-ui";
import { fill, localizeDeep, type Dict } from "./localize";

// Content catalogues are loaded on demand so English visitors download nothing extra.
const catalogLoaders: Record<Exclude<PatientLang, "en">, () => Promise<{ default: Dict }>> = {
  hi: () => import("./catalog/hi.json"),
  kn: () => import("./catalog/kn.json"),
  mr: () => import("./catalog/mr.json"),
  ur: () => import("./catalog/ur.json"),
};
const EMPTY: Dict = {};

type Ctx = { lang: PatientLang; setLang: (l: PatientLang) => void; t: (k: UiKey, vars?: Record<string, string>) => string; dict: Dict };

const PatientLanguageContext = createContext<Ctx | null>(null);

function format(s: string, vars?: Record<string, string>) {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "") : s;
}

/** Patient-area only. Mounted by the /patient layout so research routes never see it. */
export function PatientLanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<PatientLang>("en");
  const [dicts, setDicts] = useState<Partial<Record<PatientLang, Dict>>>({});

  useEffect(() => {
    if (lang === "en" || dicts[lang]) return;
    let live = true;
    catalogLoaders[lang]().then((m) => { if (live) setDicts((d) => ({ ...d, [lang]: m.default })); }).catch(() => {});
    return () => { live = false; };
  }, [lang, dicts]);

  // Read the stored preference after hydration (English on the server and first paint).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PATIENT_LANG_STORAGE_KEY);
      if (isPatientLang(stored)) setLangState(stored);
    } catch { /* storage unavailable: stay on English */ }
  }, []);

  // Keep <html lang/dir> in sync while in the patient area; restore on leave.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = langDef(lang).dir;
  }, [lang]);
  useEffect(() => () => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }, []);

  const setLang = useCallback((l: PatientLang) => {
    setLangState(l);
    try { window.localStorage.setItem(PATIENT_LANG_STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const value = useMemo<Ctx>(() => ({
    lang, setLang,
    t: (k, vars) => format(patientUi[lang][k] ?? patientUi.en[k], vars),
    dict: lang === "en" ? EMPTY : dicts[lang] ?? EMPTY,
  }), [lang, setLang, dicts]);

  return <PatientLanguageContext.Provider value={value}>{children}</PatientLanguageContext.Provider>;
}

const fallbackCtx: Ctx = { lang: "en", setLang: () => {}, t: (k, vars) => format(patientUi.en[k], vars), dict: EMPTY };

export function usePatientLanguage(): Ctx {
  return useContext(PatientLanguageContext) ?? fallbackCtx;
}

export function PatientLanguageSelector({ className }: { className?: string }) {
  const { lang, setLang, t } = usePatientLanguage();
  const current = langDef(lang);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${t("chooseLanguage")}: ${current.nativeName}`}
        className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full border border-hairline px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden", className)}
      >
        <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
        <span lang={current.code} dir={current.dir}>{current.nativeName}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">{t("chooseLanguage")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={lang} onValueChange={(v) => isPatientLang(v) && setLang(v)}>
          {patientLanguageDefs.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code} className="min-h-10 gap-3 pe-8 ps-3 text-base [&>span:first-child]:hidden">
              <span lang={l.code} dir={l.dir} className="flex-1 text-start">{l.nativeName}</span>
              {l.code !== "en" ? <span className="text-xs text-muted-foreground" lang="en">{l.englishName}</span> : null}
              {lang === l.code ? <Check className="absolute end-2 size-4 text-primary" aria-hidden="true" /> : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Honest disclosure shown on any patient page when a non-English language is active. */
export function TranslationNotice({ fullyTranslated: _ = false }: { fullyTranslated?: boolean }) {
  const { lang, setLang, t, dict } = usePatientLanguage();
  if (lang === "en") return null;
  // The catalogue records how many English strings still lack a translation.
  const fullyTranslated = dict["__missing"] === "0";
  return (
    <div role="note" className="flex flex-wrap items-start gap-x-3 gap-y-1 rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/40 px-4 py-3 text-sm leading-relaxed print:border-solid">
      <Info className="mt-1 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">
        {fullyTranslated ? null : <>{t("partialNotice", { lang: langDef(lang).nativeName })} </>}
        {t("draftNotice")}
      </p>
      <button type="button" onClick={() => setLang("en")} className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden" lang="en" dir="ltr">
        {t("showEnglish")}
      </button>
    </div>
  );
}

/** Wraps English-only content so screen readers and bidi layout treat it as English. */
export function EnglishOnly({ children, className, label = true }: { children: ReactNode; className?: string; label?: boolean }) {
  const { lang, t } = usePatientLanguage();
  if (lang === "en") return <>{children}</>;
  return (
    <div lang="en" dir="ltr" className={className}>
      {label ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground"><span lang={lang} dir={langDef(lang).dir}>{t("englishOnlyLabel")}</span></p> : null}
      {children}
    </div>
  );
}

/** Translate an inline English interface string through the active catalogue. */
export function useTx() {
  const { dict } = usePatientLanguage();
  return useCallback((s: string, vars?: Record<string, string | number>) => fill(dict[s] ?? s, vars), [dict]);
}

const cache = new WeakMap<Dict, WeakMap<object, unknown>>();
/** Localise a long-form content object (articles, medicines, checklist…) by its English strings. */
export function useLocalized<T extends object>(value: T): T {
  const { dict } = usePatientLanguage();
  return useMemo(() => {
    if (dict === EMPTY) return value;
    let m = cache.get(dict);
    if (!m) { m = new WeakMap(); cache.set(dict, m); }
    const hit = m.get(value);
    if (hit) return hit as T;
    const out = localizeDeep(value, dict);
    m.set(value, out);
    return out;
  }, [dict, value]);
}

/** Non-hook form for helpers that already have the dictionary. */
export function localizeWith<T>(value: T, dict: Dict): T { return dict === EMPTY ? value : localizeDeep(value, dict); }
