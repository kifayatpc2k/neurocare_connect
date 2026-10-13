import { useEffect, useRef } from "react";

/**
 * Study Team hero visual — a sculptural collaboration network.
 * Five focal nodes sit on a tilted ring inside faint scientific "orbit"
 * geometry; each carries a small cluster of satellite nodes, and fine chords
 * connect the focal nodes across the ring. Hand-rolled 3D projected onto a
 * canvas (no 3D library). Reduced-motion users get one still frame.
 */

type V3 = { x: number; y: number; z: number };
type N = V3 & { r: number; focal: number; phase: number };
type Edge = { a: number; b: number; c: V3; kind: 0 | 1 | 2 };

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function build(compact: boolean) {
  const rand = rng(7);
  const nodes: N[] = [];
  const edges: Edge[] = [];
  const mid = (a: V3, b: V3, k: number, lift = 0): V3 => ({
    x: (a.x + b.x) / 2 + (rand() - 0.5) * k,
    y: (a.y + b.y) / 2 + (rand() - 0.5) * k + lift,
    z: (a.z + b.z) / 2 + (rand() - 0.5) * k,
  });
  // focal nodes on a tilted ring
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    nodes.push({ x: Math.cos(a) * 1.05, y: Math.sin(a * 2) * 0.18 + (i % 2 ? 0.12 : -0.12), z: Math.sin(a) * 1.05, r: 4.6, focal: i, phase: i * 1.3 });
  }
  // ring + chords between focal nodes
  for (let i = 0; i < 5; i++) {
    edges.push({ a: i, b: (i + 1) % 5, c: { x: 0, y: 0, z: 0 }, kind: 0 });
    const j = (i + 2) % 5;
    const A = nodes[i]!;
    const B = nodes[j]!;
    edges.push({ a: i, b: j, c: mid(A, B, 0.5, (rand() - 0.5) * 0.9), kind: 1 });
  }
  // the ring edge control points: push outward so the ring reads as curved
  edges.forEach((e) => {
    if (e.kind !== 0) return;
    const A = nodes[e.a]!;
    const B = nodes[e.b]!;
    const m = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, z: (A.z + B.z) / 2 };
    const len = Math.hypot(m.x, m.z) || 1;
    e.c = { x: (m.x / len) * 1.25, y: m.y, z: (m.z / len) * 1.25 };
  });
  // satellite clusters
  const per = compact ? 3 : 5;
  for (let f = 0; f < 5; f++) {
    const F = nodes[f]!;
    for (let k = 0; k < per; k++) {
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      const d = 0.18 + rand() * 0.22;
      nodes.push({
        x: F.x * 1.08 + Math.sin(ph) * Math.cos(th) * d,
        y: F.y + Math.cos(ph) * d,
        z: F.z * 1.08 + Math.sin(ph) * Math.sin(th) * d,
        r: 1.4 + rand() * 1.4,
        focal: -1,
        phase: rand() * 6,
      });
      const idx = nodes.length - 1;
      edges.push({ a: f, b: idx, c: mid(F, nodes[idx]!, 0.12), kind: 2 });
      if (k > 0 && rand() > 0.5) edges.push({ a: idx - 1, b: idx, c: mid(nodes[idx - 1]!, nodes[idx]!, 0.1), kind: 2 });
    }
  }
  const dust: V3[] = Array.from({ length: compact ? 16 : 34 }, () => ({
    x: (rand() - 0.5) * 3.2,
    y: (rand() - 0.5) * 2.2,
    z: (rand() - 0.5) * 3.2,
  }));
  return { nodes, edges, dust };
}

export function StudyTeamResearchNetwork({ labels }: { labels: string[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compact = window.matchMedia("(max-width: 640px)").matches;
    const { nodes, edges, dust } = build(compact);
    const css = getComputedStyle(wrap);
    const col = (n: string, fb: string) => css.getPropertyValue(n).trim() || fb;
    const brand = col("--brand", "#3b8fb0");
    const accent = col("--accent", "#4fa59a");
    const warm = col("--warm", "#d9b98a");
    const ink = col("--ink-foreground", "#f2efe8");
    const muted = col("--ink-muted", "#aab");

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0);
    });
    ro.observe(wrap);

    let tx = 0, ty = 0, cx = 0, cy = 0, hoverT = 0, hover = 0;
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    };
    const onEnter = () => (hoverT = 1);
    const onLeave = () => {
      hoverT = 0;
      tx = 0;
      ty = 0;
    };
    const host = wrap.closest("section") ?? wrap;
    if (!reduced) {
      host.addEventListener("pointermove", onMove as EventListener);
      wrap.addEventListener("pointerenter", onEnter);
      wrap.addEventListener("pointerleave", onLeave);
    }

    const project = (p: V3, yaw: number, pitch: number) => {
      const c1 = Math.cos(yaw), s1 = Math.sin(yaw);
      const x1 = p.x * c1 + p.z * s1;
      const z1 = -p.x * s1 + p.z * c1;
      const c2 = Math.cos(pitch), s2 = Math.sin(pitch);
      const y2 = p.y * c2 - z1 * s2;
      const z2 = p.y * s2 + z1 * c2;
      const s = (Math.min(w, h) * 0.85) / (3.4 - hover * 0.25 + z2);
      return { x: w / 2 + x1 * s * 1.1, y: h / 2 + y2 * s, z: z2, s };
    };
    const alphaAt = (z: number) => Math.max(0.18, Math.min(1, 0.78 - z * 0.4));
    const quad = (a: { x: number; y: number }, c: { x: number; y: number }, b: { x: number; y: number }, u: number) => ({
      x: (1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
      y: (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
    });

    function draw(t: number) {
      const g = ctx!;
      g.clearRect(0, 0, w, h);
      const yaw = t * 0.05 + cx * 0.4;
      const pitch = 0.42 + cy * 0.18 + Math.sin(t * 0.11) * 0.03;
      const P = nodes.map((n, i) =>
        project(reduced ? n : { x: n.x, y: n.y + Math.sin(t * 0.45 + i) * 0.012, z: n.z }, yaw, pitch),
      );

      // faint orbit geometry: three latitude rings
      g.lineWidth = 0.6;
      [-0.45, 0, 0.45].forEach((yy, k) => {
        const rad = Math.sqrt(1.7 ** 2 - yy * yy * 2.2) * 0.95;
        g.beginPath();
        for (let s = 0; s <= 64; s++) {
          const a = (s / 64) * Math.PI * 2;
          const p = project({ x: Math.cos(a) * rad, y: yy, z: Math.sin(a) * rad }, yaw * (k === 1 ? 1 : 0.7), pitch);
          if (s === 0) g.moveTo(p.x, p.y);
          else g.lineTo(p.x, p.y);
        }
        g.globalAlpha = k === 1 ? 0.14 : 0.07;
        g.strokeStyle = k === 1 ? warm : ink;
        g.stroke();
      });

      // drifting particles
      dust.forEach((d, i) => {
        const p = project({ x: d.x, y: d.y + (reduced ? 0 : Math.sin(t * 0.18 + i) * 0.06), z: d.z }, yaw * 0.5, pitch);
        g.globalAlpha = alphaAt(p.z) * 0.3;
        g.fillStyle = ink;
        g.beginPath();
        g.arc(p.x, p.y, 0.9, 0, Math.PI * 2);
        g.fill();
      });

      // edges back to front
      const lit = reduced ? -1 : Math.floor(t * 0.35) % 5;
      const order = edges.map((e, i) => ({ i, z: (P[e.a]!.z + P[e.b]!.z) / 2 })).sort((a, b) => b.z - a.z);
      for (const { i, z } of order) {
        const e = edges[i]!;
        const a = P[e.a]!;
        const b = P[e.b]!;
        const c = project(e.c, yaw, pitch);
        const active = hover > 0.05 && (e.a === lit || e.b === lit);
        g.globalAlpha = Math.min(1, alphaAt(z) * (e.kind === 0 ? 0.55 : e.kind === 1 ? 0.32 : 0.45) + (active ? hover * 0.35 : 0));
        g.strokeStyle = e.kind === 0 ? brand : e.kind === 1 ? warm : accent;
        g.lineWidth = e.kind === 0 ? 1.4 : e.kind === 1 ? 0.7 : 0.6;
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.quadraticCurveTo(c.x, c.y, b.x, b.y);
        g.stroke();
        // slow travelling mark on chords
        if (!reduced && e.kind === 1) {
          const u = (t * 0.08 + i * 0.37) % 1;
          const p = quad(a, c, b, u);
          g.globalAlpha = 0.5 * Math.sin(u * Math.PI) * alphaAt(z);
          g.fillStyle = warm;
          g.beginPath();
          g.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
          g.fill();
        }
      }

      // nodes back to front
      const nOrder = nodes.map((_, i) => ({ i, z: P[i]!.z })).sort((a, b) => b.z - a.z);
      for (const { i } of nOrder) {
        const n = nodes[i]!;
        const p = P[i]!;
        const a = alphaAt(p.z);
        const breathe = reduced ? 0 : (Math.sin(t * 0.7 + n.phase) * 0.5 + 0.5) * 0.08;
        const isLit = n.focal === lit && hover > 0.05;
        const r = n.r * (p.s / 85) * (1 + breathe + (isLit ? hover * 0.3 : 0));
        if (n.focal >= 0) {
          const halo = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
          halo.addColorStop(0, isLit ? warm : brand);
          halo.addColorStop(1, "transparent");
          g.globalAlpha = a * (0.22 + (isLit ? hover * 0.3 : 0));
          g.fillStyle = halo;
          g.beginPath();
          g.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
          g.fill();
        }
        const body = g.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.1, p.x, p.y, r);
        body.addColorStop(0, ink);
        body.addColorStop(1, n.focal >= 0 ? (n.focal % 2 ? accent : brand) : muted);
        g.globalAlpha = a * (n.focal >= 0 ? 0.95 : 0.7);
        g.fillStyle = body;
        g.beginPath();
        g.arc(p.x, p.y, Math.max(0.8, r), 0, Math.PI * 2);
        g.fill();
        if (n.focal >= 0) {
          g.globalAlpha = a * 0.45;
          g.strokeStyle = warm;
          g.lineWidth = 0.6;
          g.beginPath();
          g.arc(p.x, p.y, r * 1.8, 0, Math.PI * 2);
          g.stroke();
          const label = labels[n.focal];
          if (label && !compact) {
            g.globalAlpha = a * (0.5 + (isLit ? hover * 0.4 : 0));
            g.fillStyle = muted;
            g.font = "500 10px ui-sans-serif, system-ui, sans-serif";
            g.textAlign = p.x > w / 2 ? "left" : "right";
            g.fillText(label.toUpperCase(), p.x + (p.x > w / 2 ? r * 2.6 : -r * 2.6), p.y + 3);
          }
        }
      }
      g.globalAlpha = 1;
    }

    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      hover += (hoverT - hover) * 0.05;
      draw((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove as EventListener);
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [labels]);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="Abstract three-dimensional network of connected nodes representing the collaboration behind the study"
      className="relative aspect-square w-full overflow-hidden sm:aspect-[6/5]"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
    </div>
  );
}
