import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, BookOpen, FileText, HelpCircle, MessageCircle, Phone, Pill, RotateCcw, Search, Send, X } from "lucide-react";
import { chatText } from "@/content/patient/chat";
import { articleBySlug, checklist, seekHelp } from "@/content/patient/library";
import { usePatientLanguage } from "@/i18n/PatientLanguage";
import { answer, findEntry, type EngineResult } from "@/lib/education/answer-engine";
import { contentIndex, type IndexEntry, type ResourceType } from "@/lib/education/content-index";
import { targetKey, type Target } from "@/lib/education/targets";
import { cn } from "@/lib/utils";

// Conversation lives only in this component's state: closing the page or
// reloading clears it, and nothing is written to storage or sent anywhere.
type Msg = { id: number; from: "you"; text: string } | { id: number; from: "bot"; result: EngineResult | { kind: "welcome" } };

const pageTitles: Record<string, string> = {
  "/patient": "Patient education",
  "/patient/library": "Education library",
  "/patient/library/help": seekHelp.title,
  "/patient/library/faq": "Frequently asked questions",
  "/patient/library/glossary": "Medical glossary",
  "/patient/library/checklist": checklist.title,
  "/patient/library/checks": "Learning checks",
  "/patient/library/leaflets": "Printable leaflets",
  "/patient/medicines": "Your medicines",
  "/study": "About the study",
};

function describeTarget(t: Target): { title: string; summary?: string | undefined; type: ResourceType } {
  const hit = contentIndex.find((e) => targetKey(e.target) === targetKey(t));
  if (hit) return { title: hit.title, summary: hit.summary, type: hit.type };
  if (t.kind === "article") { const a = articleBySlug(t.slug); return { title: a?.title ?? t.slug, summary: a?.summary, type: "article" }; }
  if (t.kind === "medicine") return { title: t.id, type: "medicine" };
  return { title: pageTitles[t.to] ?? t.to, type: t.to === "/study" ? "study" : "page" };
}

function TargetLink({ target, className, children, onNavigate }: { target: Target; className?: string | undefined; children: ReactNode; onNavigate?: (() => void) | undefined }) {
  if (target.kind === "article") return <Link to="/patient/library/$slug" params={{ slug: target.slug }} className={className} onClick={onNavigate}>{children}</Link>;
  if (target.kind === "medicine") return <Link to="/patient/medicines" search={{ m: target.id }} className={className} onClick={onNavigate}>{children}</Link>;
  return target.hash ? <Link to={target.to} hash={target.hash} className={className} onClick={onNavigate}>{children}</Link> : <Link to={target.to} className={className} onClick={onNavigate}>{children}</Link>;
}

const typeIcon: Record<ResourceType, typeof BookOpen> = { article: BookOpen, medicine: Pill, faq: HelpCircle, glossary: FileText, page: FileText, study: FileText };

/** Floating local Q&A assistant over the patient education library. */
export function AskNeuroCare() {
  const { dict, lang } = usePatientLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: "bot", result: { kind: "welcome" } }]);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEn = lang === "en";
  /** Localised text plus whether it fell back to English. */
  const L = (s: string) => (isEn ? { text: s, english: false } : dict[s] ? { text: dict[s]!, english: false } : { text: s, english: true });
  const tx = (s: string) => L(s).text;

  useEffect(() => {
    const openFromHash = () => window.location.hash === "#ask" && setOpen(true);
    const onOpen = () => setOpen(true);
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    window.addEventListener("ask-neurocare:open", onOpen);
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      window.removeEventListener("ask-neurocare:open", onOpen);
    };
  }, []);
  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs]);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text) return;
    const result = answer(text, isEn ? {} : dict);
    setMsgs((m) => [...m, { id: nextId.current++, from: "you", text }, { id: nextId.current++, from: "bot", result }]);
    setInput("");
  };
  const clear = () => { setMsgs([{ id: nextId.current++, from: "bot", result: { kind: "welcome" } }]); setInput(""); inputRef.current?.focus(); };
  const close = () => setOpen(false);

  const Txt = ({ s, className }: { s: string; className?: string }) => {
    const l = L(s);
    return l.english ? <span lang="en" dir="ltr" className={className}>{l.text}</span> : <span className={className}>{l.text}</span>;
  };
  const EnglishBadge = ({ show }: { show: boolean }) =>
    show ? <span className="mt-2 inline-block rounded-full border border-hairline px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{tx(chatText.englishOnly)}</span> : null;

  const ResultCard = ({ target, entry }: { target: Target; entry?: IndexEntry }) => {
    const d = entry ? { title: entry.title, summary: entry.summary, type: entry.type } : describeTarget(target);
    const Icon = typeIcon[d.type];
    const english = !isEn && (!dict[d.title] && d.type !== "medicine" || (d.summary ? !dict[d.summary] : false));
    return (
      <TargetLink target={target} onNavigate={close} className="group block rounded-xl border border-hairline bg-card p-3 text-start hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />{tx(chatText.typeLabels[d.type === "page" ? "webpage" : d.type])}
        </span>
        <span className="mt-1 flex items-start justify-between gap-2 font-semibold text-foreground">
          {d.type === "medicine" ? <bdi>{d.title}</bdi> : <Txt s={d.title} />}
          <ArrowRight className="mt-1 size-3.5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
        </span>
        {d.summary ? <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground"><Txt s={d.summary} /></span> : null}
        <EnglishBadge show={english} />
      </TargetLink>
    );
  };

  const FollowUps = ({ ids }: { ids?: string[] | undefined }) => {
    const entries = (ids ?? []).map(findEntry).filter((e): e is NonNullable<typeof e> => !!e);
    if (!entries.length) return null;
    return (
      <div className="mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{tx(chatText.followUpTitle)}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {entries.map((r) => (
            <button key={r.id} type="button" onClick={() => ask(tx(r.question))} className="rounded-full border border-hairline bg-card px-2.5 py-1 text-xs hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {tx(r.question)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const Suggestions = () => (
    <div className="mt-3 flex flex-col gap-1.5">
      {chatText.suggestions.map(findEntry).filter((e): e is NonNullable<typeof e> => !!e).map((s) => (
        <button key={s.id} type="button" onClick={() => ask(tx(s.question))} className="rounded-xl border border-hairline bg-card px-3 py-2 text-start text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {tx(s.question)}
        </button>
      ))}
    </div>
  );

  const renderBot = (r: EngineResult | { kind: "welcome" }) => {
    switch (r.kind) {
      case "welcome":
        return (
          <>
            <p>{tx(chatText.welcome)}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{tx(chatText.suggestionsTitle)}</p>
            <Suggestions />
          </>
        );
      case "emergency":
        return (
          <div role="alert">
            <p className="flex items-center gap-2 font-display font-bold"><AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden="true" />{tx(chatText.emergencyTitle)}</p>
            <p className="mt-2"><Txt s={chatText.emergencyPanelText} /></p>
            <a href="tel:112" className="mt-3 inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Phone className="size-4" aria-hidden="true" />{tx("Call")} <bdi>112</bdi>
            </a>
            <div className="mt-3"><ResultCard target={{ kind: "page", to: "/patient/library/help", hash: "emergency" }} /></div>
            <p className="mt-2 text-xs text-muted-foreground">{tx(chatText.emergencyLimit)}</p>
          </div>
        );
      case "safety":
        return (
          <>
            <p>{tx(chatText.safety)}</p>
            {r.medicines.length ? (
              <>
                <p className="mt-3">{tx(chatText.medicineIntro)}</p>
                <div className="mt-2 space-y-2">{r.medicines.map((m) => <ResultCard key={m.id} target={m.target} entry={m} />)}</div>
              </>
            ) : null}
            <div className="mt-2"><ResultCard target={{ kind: "article", slug: "questions-about-medicines" }} /></div>
          </>
        );
      case "answer": {
        const e = r.entry;
        const a = L(e.answer);
        return (
          <>
            <p lang={a.english ? "en" : undefined} dir={a.english ? "ltr" : undefined}>{a.text}</p>
            <EnglishBadge show={a.english} />
            {e.target ? (
              <>
                <p className="mt-3 text-xs font-semibold">{tx(chatText.readFullGuide)}</p>
                <div className="mt-1.5"><ResultCard target={e.target} /></div>
              </>
            ) : null}
            {e.resources?.length ? <div className="mt-2 space-y-2">{e.resources.map((t) => <ResultCard key={targetKey(t)} target={t} />)}</div> : null}
            <FollowUps ids={e.related} />
          </>
        );
      }
      case "best":
        return (
          <>
            <p>{tx(r.result.type === "medicine" ? chatText.medicineIntro : chatText.bestMatchIntro)}</p>
            <div className="mt-2"><ResultCard target={r.result.target} entry={r.result} /></div>
          </>
        );
      case "results":
        return (
          <>
            <p>{tx(chatText.resultsIntro)}</p>
            <div className="mt-2 space-y-2">{r.results.map((x) => <ResultCard key={x.id} target={x.target} entry={x} />)}</div>
          </>
        );
      case "fallback":
        return (
          <>
            <p>{tx(chatText.fallback)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => inputRef.current?.focus()} className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Search className="size-3.5" aria-hidden="true" />{tx(chatText.tryAgain)}
              </button>
              <Link to="/patient/library" onClick={close} className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <BookOpen className="size-3.5" aria-hidden="true" />{tx(chatText.browseAll)}
              </Link>
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{tx(chatText.browseTopics)}</p>
            <Suggestions />
            <p className="mt-3 text-xs text-muted-foreground">{tx(chatText.professionalReminder)}</p>
          </>
        );
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="ask-neurocare"
        className="fixed bottom-5 end-5 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-frost)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
      >
        {open ? <X className="size-4" aria-hidden="true" /> : <MessageCircle className="size-4" aria-hidden="true" />}
        {tx(chatText.title)}
      </button>

      {open ? (
        <section
          id="ask-neurocare"
          role="dialog"
          aria-labelledby="ask-title"
          className="fixed inset-x-3 bottom-20 z-40 flex max-h-[min(78vh,640px)] flex-col overflow-hidden rounded-3xl border border-hairline bg-popover text-popover-foreground shadow-[var(--shadow-frost)] sm:inset-x-auto sm:end-5 sm:w-[420px]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
            <div>
              <h2 id="ask-title" className="font-display text-base font-bold">{tx(chatText.title)}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{tx(chatText.intro)}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={clear} aria-label={tx(chatText.clear)} title={tx(chatText.clear)} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <RotateCcw className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={close} aria-label={tx(chatText.close)} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </header>
          <div ref={listRef} role="log" aria-live="polite" aria-relevant="additions" className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {msgs.map((m) => (
              <div key={m.id} className={cn("flex", m.from === "you" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.from === "you" ? "max-w-[85%] bg-primary text-primary-foreground" : "w-full bg-muted text-foreground",
                    m.from === "bot" && m.result.kind === "emergency" && "border-2 border-destructive bg-card",
                    m.from === "bot" && m.result.kind === "safety" && "border border-warm",
                  )}
                >
                  <span className="sr-only">{m.from === "you" ? tx("You:") + " " : "NeuroCare: "}</span>
                  {m.from === "you" ? <bdi>{m.text}</bdi> : renderBot(m.result)}
                </div>
              </div>
            ))}
          </div>
          <form
            className="border-t border-hairline p-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <div className="flex gap-2">
              <label htmlFor="ask-input" className="sr-only">{tx("Your question")}</label>
              <input
                id="ask-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tx(chatText.placeholder)}
                autoComplete="off"
                dir="auto"
                maxLength={300}
                className="min-w-0 flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button type="submit" aria-label={tx(chatText.send)} className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Send className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{tx(chatText.privacy)}</p>
            {!isEn ? <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{tx(chatText.translationDraft)}</p> : null}
          </form>
        </section>
      ) : null}
    </>
  );
}

