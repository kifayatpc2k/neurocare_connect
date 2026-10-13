import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Landing-page hero visual: a peripheral-nerve "sculpture". A fascicled trunk
 * rises into a soma and divides into four branches, each ending at one of the
 * study's research stages. Drawn on canvas (no 3D library) in layered depth
 * with gentle pointer parallax and impulses travelling along the fibres.
 * Stage markers are real buttons; reduced-motion users get a still frame.
 */
export type SculptureStage = { label: string; description: string };

type Pt = { x: number; y: number };
type Path = [Pt, Pt, Pt, Pt]; // cubic bezier in unit square

const SOMA: Pt = { x: 0.5, y: 0.5 };
const TRUNK: Path = [{ x: 0.06, y: 1.02 }, { x: 0.22, y: 0.86 }, { x: 0.36, y: 0.62 }, SOMA];
// Branch end anchors — label positions below are tied to these.
const ANCHORS: Pt[] = [
  { x: 0.2, y: 0.17 },
  { x: 0.83, y: 0.19 },
  { x: 0.88, y: 0.64 },
  { x: 0.64, y: 0.9 },
];
const BRANCHES: Path[] = [
  [SOMA, { x: 0.46, y: 0.34 }, { x: 0.3, y: 0.3 }, ANCHORS[0]!],
  [SOMA, { x: 0.58, y: 0.36 }, { x: 0.7, y: 0.2 }, ANCHORS[1]!],
  [SOMA, { x: 0.64, y: 0.52 }, { x: 0.76, y: 0.66 }, ANCHORS[2]!],
  [SOMA, { x: 0.54, y: 0.64 }, { x: 0.66, y: 0.74 }, ANCHORS[3]!],
];
const LABEL_POS = [
  "left-[2%] top-[6%] items-start text-left",
  "right-[0%] top-[8%] items-end text-right",
  "right-[0%] top-[69%] items-end text-right",
  "right-[14%] bottom-[0%] items-end text-right",
];

function bez(p: Path, u: number): Pt {
  const v = 1 - u;
  const a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
  return { x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x, y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y };
}
function normal(p: Path, u: number): Pt {
  const a = bez(p, Math.max(0, u - 0.01)), b = bez(p, Math.min(1, u + 0.01));
  const dx = b.x - a.x, dy = b.y - a.y, m = Math.hypot(dx, dy) || 1;
  return { x: -dy / m, y: dx / m };
}

export function NeuralSculpture({
  stages,
  className,
}: {
  stages: SculptureStage[];
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const shown = active ?? pinned;
  activeRef.current = shown;

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compact = window.matchMedia("(max-width: 640px)").matches;
    const css = getComputedStyle(wrap);
    const col = (n: string, fb: string) => css.getPropertyValue(n).trim() || fb;
    const teal = col("--brand", "#278FA6");
    const ice = col("--ink-foreground", "#F2F6F8");
    const warm = col("--warm", "#D8B995");

    // Fibre bundles: [path, fibre count, max spread, branch index or -1 for trunk]
    const bundles: { p: Path; n: number; spread: number; idx: number }[] = [
      { p: TRUNK, n: compact ? 6 : 9, spread: 0.034, idx: -1 },
      ...BRANCHES.map((p, idx) => ({ p, n: compact ? 3 : 5, spread: 0.018, idx })),
    ];
    let seed = 19;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const fibres = bundles.flatMap((b) =>
      Array.from({ length: b.n }, (_, k) => ({
        ...b,
        off: (k / Math.max(1, b.n - 1) - 0.5) * 2,
        phase: rnd() * 6.28,
        layer: k % 3, // 0 back, 1 mid, 2 front
      })),
    );
    // Nodes of Ranvier along each branch + trunk.
    const nodes = bundles.flatMap((b) =>
      (b.idx === -1 ? [0.28, 0.55, 0.8] : [0.35, 0.68]).map((u) => ({ p: b.p, u, idx: b.idx, ph: rnd() * 6 })),
    );
    const impulses = Array.from({ length: compact ? 3 : 5 }, (_, i) => ({
      branch: i % 4,
      t0: rnd() * 4,
      speed: 0.16 + rnd() * 0.08,
    }));

    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let tx = 0, ty = 0, px = 0, py = 0, mx = -9, my = -9, hx = -9, hy = -9;
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height;
      tx = Math.max(-1, Math.min(1, (mx - 0.5) * 2)); ty = Math.max(-1, Math.min(1, (my - 0.5) * 2));
    };
    const onLeave = () => { tx = 0; ty = 0; mx = -9; my = -9; };
    if (!reduced) {
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);
    }
    const glow = [0, 0, 0, 0];

    const draw = (t: number) => {
      px += (tx - px) * 0.04; py += (ty - py) * 0.04;
      hx += (mx - hx) * 0.08; hy += (my - hy) * 0.08;
      const act = activeRef.current;
      for (let i = 0; i < 4; i++) glow[i]! += ((act === i ? 1 : 0) - glow[i]!) * 0.08;
      const S = Math.min(w, h);
      const ox = (w - S) / 2, oy = (h - S) / 2;
      const map = (q: Pt, layer: number) => ({
        x: ox + (q.x + px * 0.006 * (layer + 1)) * S,
        y: oy + (q.y + py * 0.005 * (layer + 1)) * S,
      });
      ctx.clearRect(0, 0, w, h);

      // soft atmosphere around the soma (no opaque panel)
      const sc = map(SOMA, 1);
      const halo = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, S * 0.5);
      halo.addColorStop(0, teal); halo.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.14; ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);

      ctx.lineCap = "round";
      for (let layer = 0; layer < 3; layer++) {
        for (const f of fibres) {
          if (f.layer !== layer) continue;
          const g = f.idx >= 0 ? glow[f.idx]! : 0;
          const steps = 26;
          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const u = s / steps;
            const c = bez(f.p, u), n = normal(f.p, u);
            // bundle widens mid-length, converges at the ends
            const taper = f.idx === -1 ? 0.5 + 0.5 * (1 - u) : Math.sin(Math.PI * Math.min(1, u * 1.15)) * (1 - u * 0.6);
            const wob = reduced ? 0 : Math.sin(t * 0.6 + f.phase + u * 7) * 0.004;
            let d = f.off * f.spread * taper + wob;
            // gentle local response to the pointer
            const qx = c.x + n.x * d, qy = c.y + n.y * d;
            const dist = Math.hypot(qx - hx, qy - hy);
            if (dist < 0.12) d += (1 - dist / 0.12) * 0.012 * Math.sign(f.off || 1);
            const q = map({ x: c.x + n.x * d, y: c.y + n.y * d }, layer);
            if (s === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
          }
          const dim = act !== null && f.idx !== act && f.idx !== -1 ? 0.55 : 1;
          ctx.globalAlpha = (0.16 + layer * 0.14 + g * 0.35) * dim;
          ctx.strokeStyle = layer === 2 || g > 0.3 ? ice : teal;
          ctx.lineWidth = (f.idx === -1 ? 1.1 : 0.85) + layer * 0.25 + g * 0.5;
          ctx.stroke();
        }
      }

      // nodes of Ranvier
      for (const nd of nodes) {
        const g = nd.idx >= 0 ? glow[nd.idx]! : 0;
        const q = map(bez(nd.p, nd.u), 2);
        const pulse = reduced ? 0.8 : 0.7 + 0.3 * Math.sin(t * 1.1 + nd.ph);
        ctx.globalAlpha = (0.45 + g * 0.45) * pulse;
        ctx.fillStyle = ice;
        ctx.beginPath(); ctx.arc(q.x, q.y, 1.8 + g * 1.2, 0, Math.PI * 2); ctx.fill();
      }

      // impulses: trunk → soma → branch
      if (!reduced) {
        for (const im of impulses) {
          const branch = act ?? im.branch;
          const k = ((t + im.t0) * im.speed) % 2; // 0–1 trunk, 1–2 branch
          const path = k < 1 ? TRUNK : BRANCHES[branch]!;
          for (let tail = 0; tail < 8; tail++) {
            const u = (k % 1) - tail * 0.012;
            if (u < 0) break;
            const q = map(bez(path, u), 2);
            ctx.globalAlpha = (0.7 - tail * 0.085) * Math.sin(Math.PI * Math.min(1, (k % 1) * 1.05 + 0.02));
            ctx.fillStyle = tail === 0 ? warm : ice;
            ctx.beginPath(); ctx.arc(q.x, q.y, tail === 0 ? 2.4 : 1.4, 0, Math.PI * 2); ctx.fill();
          }
        }
      }

      // branch terminals
      ANCHORS.forEach((a, i) => {
        const g = glow[i]!;
        const q = map(a, 2);
        ctx.globalAlpha = 0.35 + g * 0.5; ctx.strokeStyle = g > 0.3 ? warm : ice; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(q.x, q.y, 7 + g * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.9; ctx.fillStyle = g > 0.3 ? warm : ice;
        ctx.beginPath(); ctx.arc(q.x, q.y, 2.6, 0, Math.PI * 2); ctx.fill();
      });

      // soma
      const breathe = reduced ? 1 : 1 + 0.04 * Math.sin(t * 0.9);
      const body = ctx.createRadialGradient(sc.x - 4, sc.y - 4, 1, sc.x, sc.y, 15 * breathe);
      body.addColorStop(0, ice); body.addColorStop(0.55, teal); body.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.95; ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(sc.x, sc.y, 15 * breathe, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.4; ctx.strokeStyle = warm; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(sc.x, sc.y, 26 * breathe, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    const ro = new ResizeObserver(() => { resize(); draw(0); });
    ro.observe(wrap);
    const start = performance.now();
    const loop = (now: number) => { draw((now - start) / 1000); raf = requestAnimationFrame(loop); };
    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);
    // keep the still frame in sync with highlighted stage
    const iv = reduced ? window.setInterval(() => draw(0), 120) : 0;
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); window.clearInterval(iv);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const info = shown !== null ? stages[shown] : null;

  return (
    <div className={cn("relative", className)}>
      <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[540px]">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Illustration of a branching peripheral nerve whose four branches represent the study's research stages"
          className="absolute inset-0 size-full"
        />
        <ul aria-label="Research stages" className="hidden sm:block">
          {stages.map((s, i) => (
            <li key={s.label} className={cn("absolute flex flex-col", LABEL_POS[i])}>
              <button
                type="button"
                aria-pressed={pinned === i}
                aria-describedby="nc-stage-info"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setPinned((p) => (p === i ? null : i))}
                className={cn(
                  "group flex flex-col rounded px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm",
                  i === 0 ? "items-start" : "items-end",
                )}
              >
                <span className="font-mono text-[10px] tracking-[0.2em] text-warm/80">0{i + 1}</span>
                <span
                  className={cn(
                    "mt-0.5 border-b pb-0.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors",
                    shown === i ? "border-warm text-ink-foreground" : "border-ink-line text-ink-muted group-hover:text-ink-foreground",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* mobile stage selector */}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
        {stages.map((s, i) => (
          <button
            key={s.label}
            type="button"
            aria-pressed={pinned === i}
            onClick={() => setPinned((p) => (p === i ? null : i))}
            className={cn(
              "rounded-md border px-3 py-2 text-left text-[11px] uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm",
              pinned === i ? "border-warm text-ink-foreground" : "border-ink-line text-ink-muted",
            )}
          >
            <span className="mr-1.5 font-mono text-warm/80">0{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* compact annotation strip: stage detail, otherwise the workflow line */}
      <div
        id="nc-stage-info"
        aria-live="polite"
        className="mx-auto mt-4 min-h-[3.25rem] max-w-[540px] border-l border-warm/60 pl-4"
      >
        {info ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-warm">Stage 0{shown! + 1} · {info.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{info.description}</p>
          </>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-warm">Research stages</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              Select a branch to see how each stage supports the study. Generic stages — not participant data.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
