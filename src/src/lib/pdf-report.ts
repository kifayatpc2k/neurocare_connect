import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * A4 clinical-report layout engine on top of pdf-lib (pure JS, runs on the
 * Worker runtime). Visual design follows the approved two-page reference
 * report: full-width blue title band on page 1, uppercase blue section
 * headings over a thin rule, bold slate labels with ink values, light-tinted
 * questionnaire rows, a rounded score panel and a small grey footer with
 * "Page X of Y". Measurements and colours were taken from the reference's
 * content stream (A4, 46 pt margins, Helvetica). Text is restricted to WinAnsi.
 */

export type Block =
  | { kind: "section"; title: string }
  | { kind: "subheading"; title: string }
  | { kind: "paragraph"; text: string; muted?: boolean }
  | { kind: "notice"; text: string }
  | { kind: "kv"; rows: [string, string][] }
  /** Two-column label/value grid (reference "Patient information" block). */
  | { kind: "fields"; rows: [string, string][] }
  /** Itemised questionnaire answers, answer right-aligned (reference DN4 list). */
  | { kind: "responses"; rows: { label: string; answer: string; positive?: boolean }[] }
  /** Prominent score panel (reference score box). */
  | { kind: "score"; value: string; title: string; text: string }
  | { kind: "table"; header: string[]; widths: number[]; rows: string[][]; align?: ("l" | "r")[] }
  | { kind: "chart"; title: string; points: { label: string; value: number }[]; min: number; max: number; note?: string }
  | { kind: "timeline"; steps: { label: string; date: string; done: boolean }[] };

export type ReportMeta = { title: string; studyCode: string; generatedAt: string; subtitle?: string; synthetic?: boolean };

const A4 = { w: 595.28, h: 841.89 };
const M = { l: 46, r: 46, t: 50, b: 56 };
const CW = A4.w - M.l - M.r;
// Reference palette (exact values from the reference content stream).
const BRAND = rgb(0.09, 0.306, 0.651);
const INK = rgb(0.078, 0.11, 0.157);
const LABEL = rgb(0.353, 0.4, 0.478);
const FOOT = rgb(0.549, 0.588, 0.643);
const RULE = rgb(0.84, 0.87, 0.93);
const TINT = rgb(0.96, 0.98, 0.99);
const PANEL = rgb(0.94, 0.96, 0.99);
const WHITE = rgb(1, 1, 1);
const BAND_TEXT = rgb(0.86, 0.91, 0.98);
const WARN_BG = rgb(0.99, 0.95, 0.86);
const WARN = rgb(0.6, 0.33, 0.02);

export const NON_LATIN = "[non-Latin text]";
const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const printable = (c: string) => {
  const n = c.charCodeAt(0);
  return c === "\n" || (n >= 0x20 && n <= 0x7e) || (n >= 0xa0 && n <= 0xff) || WIN_ANSI_EXTRA.includes(c);
};
/**
 * Map text to the WinAnsi set the standard fonts can draw. Each run of
 * unsupported characters (Devanagari, Kannada, Urdu, emoji…) becomes one
 * clear marker instead of a row of question marks; the stored value is
 * unchanged and is complete in the Excel export.
 */
export function safe(text: string): string {
  const mapped = text
    .replace(/→/g, "->")
    .replace(/[−‐‑]/g, "-")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/\r/g, "")
    .replace(/\t/g, " ");
  let out = "";
  let inRun = false;
  for (const c of Array.from(mapped)) {
    if (printable(c)) { out += c; inRun = false; continue; }
    // Combining marks / zero-width joiners inside a run stay part of it.
    if (!inRun) { out += NON_LATIN; inRun = true; }
  }
  return out;
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of safe(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (font.widthOfTextAtSize(w, size) > width) {
        let i = w.length - 1;
        while (i > 1 && font.widthOfTextAtSize(w.slice(0, i), size) > width) i--;
        if (line) { out.push(line); line = ""; }
        out.push(w.slice(0, i));
        w = w.slice(i);
      }
      const t = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) <= width) line = t;
      else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out.length ? out : [""];
}

const roundedRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;

export async function renderReport(meta: ReportMeta, cover: Block[], blocks: Block[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(safe(`${meta.title} - ${meta.studyCode}`));
  doc.setProducer("NeuroCare Connect");
  doc.setCreator("NeuroCare Connect");
  doc.setLanguage("en-GB");
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page!: PDFPage;
  let y = 0;
  const pages: PDFPage[] = [];
  const newPage = () => {
    page = doc.addPage([A4.w, A4.h]);
    pages.push(page);
    y = A4.h - M.t;
  };
  const ensure = (h: number) => { if (y - h < M.b) newPage(); };
  const text = (s: string, x: number, yy: number, size: number, font = reg, color = INK) =>
    page.drawText(safe(s), { x, y: yy, size, font, color });
  const isMissing = (v: string) => v === "Not recorded" || v === "Not documented";

  // ---------- Page 1 title band (reference: 84 pt band, 17/10/9 pt lines) ----------
  newPage();
  page.drawRectangle({ x: 0, y: A4.h - 84, width: A4.w, height: 84, color: BRAND });
  text("NeuroCare Connect", M.l, A4.h - 38, 17, bold, WHITE);
  text(meta.subtitle ?? meta.title, M.l, A4.h - 56, 10, reg, WHITE);
  text(`Report generated ${meta.generatedAt}`, M.l, A4.h - 71, 9, reg, BAND_TEXT);
  const sid = `Study ID ${meta.studyCode}`;
  text(sid, A4.w - M.r - bold.widthOfTextAtSize(safe(sid), 11), A4.h - 38, 11, bold, WHITE);
  y = A4.h - 84 - 26;
  if (meta.synthetic) {
    const msg = "SYNTHETIC TEST RECORD — NOT A REAL PARTICIPANT. Excluded from official study reporting.";
    page.drawRectangle({ x: M.l, y: y - 9, width: CW, height: 22, color: WARN_BG, borderColor: WARN, borderWidth: 0.8 });
    text(msg, M.l + 10, y - 2, 9, bold, WARN);
    y -= 34;
  }

  const drawBlocks = (list: Block[]) => {
    for (const b of list) {
      switch (b.kind) {
        case "section": {
          ensure(80); // keep heading with following content
          if (y < A4.h - M.t - 1) y -= 9;
          text(b.title.toUpperCase(), M.l, y, 11, bold, BRAND);
          y -= 6;
          page.drawLine({ start: { x: M.l, y }, end: { x: A4.w - M.r, y }, thickness: 1, color: RULE });
          y -= 16;
          break;
        }
        case "subheading": {
          ensure(100); // keep with the score panel / first rows that follow
          y -= 2;
          text(b.title, M.l, y, 10, bold, INK);
          y -= 15;
          break;
        }
        case "paragraph": {
          for (const l of wrap(b.text, reg, 10, CW)) {
            ensure(14);
            text(l, M.l, y, 10, reg, b.muted ? LABEL : INK);
            y -= 14;
          }
          y -= 4;
          break;
        }
        case "notice": {
          const lines = wrap(b.text, reg, 8.5, CW - 22);
          const h = lines.length * 11 + 12;
          ensure(h + 8);
          page.drawRectangle({ x: M.l, y: y - h + 9, width: CW, height: h, color: PANEL });
          page.drawRectangle({ x: M.l, y: y - h + 9, width: 2.5, height: h, color: BRAND });
          let yy = y - 3;
          for (const l of lines) { text(l, M.l + 12, yy, 8.5, reg, LABEL); yy -= 11; }
          y -= h + 8;
          break;
        }
        case "kv": {
          const kw = 150;
          for (const [k, v] of b.rows) {
            const kl = wrap(k, bold, 10, kw - 10);
            const vl = wrap(v, reg, 10, CW - kw);
            const h = Math.max(kl.length, vl.length) * 13 + 4;
            ensure(h);
            kl.forEach((l, i) => text(l, M.l, y - i * 13, 10, bold, LABEL));
            vl.forEach((l, i) => text(l, M.l + kw, y - i * 13, 10, reg, isMissing(v) ? FOOT : INK));
            y -= h;
          }
          y -= 6;
          break;
        }
        case "fields": {
          const col = CW / 2, kw = 112;
          for (let i = 0; i < b.rows.length; i += 2) {
            const pair = b.rows.slice(i, i + 2);
            const cells = pair.map(([k, v]) => ({ k: wrap(`${k}:`, bold, 10, kw - 6), v: wrap(v, reg, 10, col - kw - 10), raw: v }));
            const n = Math.max(...cells.map((c) => Math.max(c.k.length, c.v.length)));
            // Keep short rows together; very long values flow across pages line by line, never clipped.
            ensure(Math.min(n * 13 + 4, 13 * 6));
            for (let line = 0; line < n; line++) {
              ensure(13);
              cells.forEach((c, j) => {
                const x = M.l + j * col;
                if (c.k[line]) text(c.k[line]!, x, y, 10, bold, LABEL);
                if (c.v[line]) text(c.v[line]!, x + kw, y, 10, reg, isMissing(c.raw) ? FOOT : INK);
              });
              y -= 13;
            }
            y -= 4;
          }
          y -= 6;
          break;
        }
        case "responses": {
          b.rows.forEach((r, i) => {
            const lines = wrap(r.label, reg, 10, CW - 110);
            const h = lines.length * 13 + 5;
            ensure(h);
            if (i % 2 === 0) page.drawRectangle({ x: M.l, y: y - h + 10, width: CW, height: h, color: TINT });
            lines.forEach((l, n) => text(l, M.l + 8, y - n * 13, 10));
            const a = safe(r.answer);
            const color = r.positive ? BRAND : isMissing(r.answer) ? FOOT : LABEL;
            text(a, A4.w - M.r - 8 - bold.widthOfTextAtSize(a, 10), y, 10, bold, color);
            y -= h;
          });
          y -= 10;
          break;
        }
        case "score": {
          const tw = CW - 140;
          const tl = wrap(b.title, bold, 11, tw);
          const dl = wrap(b.text, reg, 8.5, tw);
          const h = Math.max(62, tl.length * 14 + dl.length * 11 + 26);
          ensure(h + 12);
          const top = y + 6;
          // drawSvgPath uses a y-down coordinate system anchored at (x, y).
          page.drawSvgPath(roundedRect(0, 0, CW, h, 6), { x: M.l, y: top, color: PANEL, borderColor: BRAND, borderWidth: 1 });
          const v = safe(b.value);
          const vs = v.length > 6 ? 16 : 22;
          text(v, M.l + 20, top - h / 2 - vs / 3, vs, bold, BRAND);
          let yy = top - 18;
          for (const l of tl) { text(l, M.l + 122, yy, 11, bold, BRAND); yy -= 14; }
          yy -= 1;
          for (const l of dl) { text(l, M.l + 122, yy, 8.5, reg, LABEL); yy -= 11; }
          y = top - h - 14;
          break;
        }
        case "table": {
          const total = b.widths.reduce((a, c) => a + c, 0);
          const ws = b.widths.map((w) => (w / total) * CW);
          const size = 8.5;
          const drawHeader = () => {
            const hl = b.header.map((h, i) => wrap(h, bold, size, ws[i]! - 8));
            const h = Math.max(...hl.map((l) => l.length)) * 11 + 6;
            let x = M.l;
            hl.forEach((ls, i) => {
              ls.forEach((l, j) => {
                const tx = b.align?.[i] === "r" ? x + ws[i]! - 4 - bold.widthOfTextAtSize(l, size) : x + 4;
                text(l, tx, y - j * 11, size, bold, LABEL);
              });
              x += ws[i]!;
            });
            page.drawLine({ start: { x: M.l, y: y - h + 8 }, end: { x: A4.w - M.r, y: y - h + 8 }, thickness: 1, color: RULE });
            y -= h + 2;
          };
          ensure(56);
          drawHeader();
          b.rows.forEach((row, ri) => {
            const cl = row.map((c, i) => wrap(c, reg, size, ws[i]! - 8));
            const h = Math.max(...cl.map((l) => l.length)) * 11 + 7;
            if (y - h < M.b) { newPage(); drawHeader(); }
            if (ri % 2 === 0) page.drawRectangle({ x: M.l, y: y - h + 9, width: CW, height: h, color: TINT });
            let x = M.l;
            cl.forEach((ls, i) => {
              ls.forEach((l, j) => {
                const tx = b.align?.[i] === "r" ? x + ws[i]! - 4 - reg.widthOfTextAtSize(l, size) : x + 4;
                text(l, tx, y - j * 11, size, reg, isMissing(row[i] ?? "") ? FOOT : INK);
              });
              x += ws[i]!;
            });
            y -= h;
          });
          y -= 10;
          break;
        }
        case "chart": {
          const ch = 140;
          ensure(ch + 50);
          text(b.title, M.l, y, 10, bold);
          y -= 14;
          const left = M.l + 30, right = A4.w - M.r - 10, top = y - 4, bottom = y - ch;
          const span = b.max - b.min || 1;
          for (let i = 0; i <= 4; i++) {
            const v = b.min + (span * i) / 4;
            const yy = bottom + ((v - b.min) / span) * (top - bottom);
            page.drawLine({ start: { x: left, y: yy }, end: { x: right, y: yy }, thickness: 0.4, color: RULE });
            text(String(Math.round(v * 10) / 10), M.l, yy - 3, 7.5, reg, FOOT);
          }
          const n = b.points.length;
          const px = (i: number) => (n === 1 ? (left + right) / 2 : left + 20 + (i * (right - left - 40)) / (n - 1));
          const py = (v: number) => bottom + ((v - b.min) / span) * (top - bottom);
          for (let i = 1; i < n; i++)
            page.drawLine({ start: { x: px(i - 1), y: py(b.points[i - 1]!.value) }, end: { x: px(i), y: py(b.points[i]!.value) }, thickness: 1.5, color: BRAND });
          b.points.forEach((p, i) => {
            page.drawCircle({ x: px(i), y: py(p.value), size: 3, color: BRAND });
            const vs = String(p.value);
            text(vs, px(i) - bold.widthOfTextAtSize(vs, 8) / 2, py(p.value) + 6, 8, bold);
            const ls = safe(p.label);
            text(ls, px(i) - reg.widthOfTextAtSize(ls, 7.5) / 2, bottom - 12, 7.5, reg, LABEL);
          });
          y = bottom - 26;
          if (b.note) for (const l of wrap(b.note, reg, 8, CW)) { ensure(11); text(l, M.l, y, 8, reg, LABEL); y -= 11; }
          y -= 8;
          break;
        }
        case "timeline": {
          const n = b.steps.length;
          ensure(70);
          const step = CW / n;
          const ly = y - 8;
          page.drawLine({ start: { x: M.l + step / 2, y: ly }, end: { x: M.l + CW - step / 2, y: ly }, thickness: 1, color: RULE });
          b.steps.forEach((s, i) => {
            const cx = M.l + step * i + step / 2;
            page.drawCircle({ x: cx, y: ly, size: 5, color: s.done ? BRAND : WHITE, borderColor: s.done ? BRAND : FOOT, borderWidth: 1 });
            wrap(s.label, bold, 7.5, step - 4).forEach((l, j) => text(l, cx - bold.widthOfTextAtSize(l, 7.5) / 2, ly - 18 - j * 9, 7.5, bold));
            const d = safe(s.date);
            text(d, cx - reg.widthOfTextAtSize(d, 7) / 2, ly - 38, 7, reg, LABEL);
          });
          y = ly - 56;
          break;
        }
      }
    }
  };

  drawBlocks(cover);
  drawBlocks(blocks);

  // ---------- Footer on every page (reference: 8 pt grey at y = 28, no rule) ----------
  const total = pages.length;
  pages.forEach((p, i) => {
    const s = (t: string, x: number, c = FOOT, f = reg) => p.drawText(safe(t), { x, y: 28, size: 8, font: f, color: c });
    const left = `NeuroCare Connect · ${meta.title} · Study ID ${meta.studyCode} · Confidential — research use only`;
    s(left, M.l);
    if (i > 0 && meta.synthetic) p.drawText("SYNTHETIC TEST RECORD — NOT A REAL PARTICIPANT", { x: M.l, y: A4.h - 30, size: 8, font: bold, color: WARN });
    const pn = `Page ${i + 1} of ${total}`;
    s(pn, A4.w - M.r - reg.widthOfTextAtSize(pn, 8));
  });

  return doc.save();
}
