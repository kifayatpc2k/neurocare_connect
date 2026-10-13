import { useEffect, useRef } from "react";

/**
 * Study hero visual — a floating, dimensional nerve-fibre network.
 * Hand-rolled 3D: procedural nodes and curved fibres in 3D space, projected
 * with perspective onto a 2D canvas each frame (no 3D library). Responds
 * subtly to the cursor; a faint signal travels outward from the central node.
 * Reduced-motion users get one calm, still frame.
 */

type V3 = { x: number; y: number; z: number };
type Node = V3 & { r: number; major: boolean; phase: number };
type Fibre = { a: number; b: number; c: V3; w: number };

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function build(compact: boolean) {
  const rand = rng(42);
  const nodes: Node[] = [{ x: 0, y: 0, z: 0, r: 7, major: true, phase: 0 }];
  // Four larger nodes — quietly echo assessment, medication, intervention, follow-up.
  const majors: V3[] = [
    { x: -1.05, y: -0.55, z: 0.35 },
    { x: 0.95, y: -0.7, z: -0.4 },
    { x: 1.0, y: 0.6, z: 0.45 },
    { x: -0.85, y: 0.75, z: -0.5 },
  ];
  majors.forEach((m) => nodes.push({ ...m, r: 4.2, major: true, phase: rand() * 6 }));
  const minorCount = compact ? 7 : 12;
  for (let i = 0; i < minorCount; i++) {
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(2 * rand() - 1);
    const d = 0.75 + rand() * 0.75;
    nodes.push({
      x: Math.sin(ph) * Math.cos(th) * d * 1.25,
      y: Math.cos(ph) * d * 0.95,
      z: Math.sin(ph) * Math.sin(th) * d,
      r: 1.8 + rand() * 1.6,
      major: false,
      phase: rand() * 6,
    });
  }
  const fibres: Fibre[] = [];
  const bend = (a: V3, b: V3, k: number): V3 => ({
    x: (a.x + b.x) / 2 + (rand() - 0.5) * k,
    y: (a.y + b.y) / 2 + (rand() - 0.5) * k,
    z: (a.z + b.z) / 2 + (rand() - 0.5) * k,
  });
  const link = (a: number, b: number, w: number, k = 0.6) => {
    const na = nodes[a];
    const nb = nodes[b];
    if (na && nb) fibres.push({ a, b, c: bend(na, nb, k), w });
  };
  for (let i = 1; i <= 4; i++) link(0, i, 1.6, 0.5);
  for (let i = 1; i <= 4; i++) link(i, (i % 4) + 1, 0.7, 1.1);
  // each minor node joins its nearest one or two neighbours
  for (let i = 5; i < nodes.length; i++) {
    const n = nodes[i]!;
    const near = nodes
      .map((m, j) => ({ j, d: j === i ? 1e9 : (m.x - n.x) ** 2 + (m.y - n.y) ** 2 + (m.z - n.z) ** 2 }))
      .sort((p, q) => p.d - q.d);
    link(i, near[0]!.j, 0.8);
    if (rand() > 0.45) link(i, near[1]!.j, 0.5, 0.9);
  }
  // fine dendrite tips trailing off into space
  const tipCount = compact ? 10 : 22;
  for (let i = 0; i < tipCount; i++) {
    const from = 1 + Math.floor(rand() * (nodes.length - 1));
    const n = nodes[from]!;
    const len = 0.25 + rand() * 0.35;
    nodes.push({
      x: n.x * (1 + len) + (rand() - 0.5) * 0.3,
      y: n.y * (1 + len) + (rand() - 0.5) * 0.3,
      z: n.z * (1 + len) + (rand() - 0.5) * 0.3,
      r: 0,
      major: false,
      phase: 0,
    });
    link(from, nodes.length - 1, 0.35, 0.35);
  }
  const dust: V3[] = Array.from({ length: compact ? 18 : 40 }, () => ({
    x: (rand() - 0.5) * 3.4,
    y: (rand() - 0.5) * 2.6,
    z: (rand() - 0.5) * 2.4,
  }));
  return { nodes, fibres, dust };
}

export function StudyHeroVisual({ labels: _labels }: { labels?: string[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compact = window.matchMedia("(max-width: 640px)").matches;
    const { nodes, fibres, dust } = build(compact);

    const css = getComputedStyle(wrap);
    const col = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
    const brand = col("--brand", "#3b8fb0");
    const accent = col("--accent", "#4fa59a");
    const warm = col("--warm", "#d9b98a");
    const ink = col("--ink-foreground", "#f2efe8");

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

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let hoverT = 0;
    let hover = 0;
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
      const cyw = Math.cos(yaw);
      const syw = Math.sin(yaw);
      const x1 = p.x * cyw + p.z * syw;
      const z1 = -p.x * syw + p.z * cyw;
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const y2 = p.y * cp - z1 * sp;
      const z2 = p.y * sp + z1 * cp;
      const dist = 3.6 - hover * 0.25;
      const s = (Math.min(w, h) * 0.78) / (dist + z2);
      return { x: w / 2 + x1 * s * 1.15, y: h / 2 + y2 * s, z: z2, s };
    };
    const depthAlpha = (z: number) => Math.max(0.2, Math.min(1, 0.8 - z * 0.35));

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const yaw = t * 0.06 + cx * 0.35;
      const pitch = -0.18 + cy * 0.22 + Math.sin(t * 0.13) * 0.04;
      const sway = (n: Node, i: number): V3 =>
        reduced ? n : { x: n.x, y: n.y + Math.sin(t * 0.5 + i) * 0.015, z: n.z + Math.cos(t * 0.4 + i) * 0.015 };
      const P = nodes.map((n, i) => project(sway(n, i), yaw, pitch));

      // soft ambient halo
      const halo = ctx!.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.55);
      halo.addColorStop(0, brand);
      halo.addColorStop(1, "transparent");
      ctx!.globalAlpha = 0.12 + hover * 0.05;
      ctx!.fillStyle = halo;
      ctx!.fillRect(0, 0, w, h);

      // dust particles (far layer)
      dust.forEach((d, i) => {
        const p = project(
          { x: d.x + (reduced ? 0 : Math.sin(t * 0.2 + i) * 0.05), y: d.y + (reduced ? 0 : Math.cos(t * 0.17 + i * 2) * 0.05), z: d.z },
          yaw * 0.6,
          pitch,
        );
        ctx!.globalAlpha = depthAlpha(p.z) * 0.35;
        ctx!.fillStyle = ink;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, Math.max(0.5, p.s * 0.004), 0, Math.PI * 2);
        ctx!.fill();
      });

      // fibres, back to front
      const order = fibres
        .map((f, i) => ({ i, z: (P[f.a]!.z + P[f.b]!.z) / 2 }))
        .sort((a, b) => b.z - a.z);
      const pulse = reduced ? -1 : (t * 0.35) % 1.6;
      for (const { i } of order) {
        const f = fibres[i]!;
        const a = P[f.a]!;
        const b = P[f.b]!;
        const c = project(f.c, yaw, pitch);
        const za = (a.z + b.z) / 2;
        const near = Math.hypot((a.x + b.x) / 2 - w / 2 - cx * w * 0.3, (a.y + b.y) / 2 - h / 2 - cy * h * 0.3);
        const lift = hover * Math.max(0, 1 - near / (w * 0.35)) * 0.35;
        ctx!.globalAlpha = Math.min(1, depthAlpha(za) * (f.w > 1 ? 0.8 : 0.5) + lift);
        ctx!.strokeStyle = f.w > 1 ? brand : f.w > 0.6 ? accent : ink;
        ctx!.lineWidth = Math.max(0.4, f.w * (1.1 - za * 0.35));
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.quadraticCurveTo(c.x, c.y, b.x, b.y);
        ctx!.stroke();

        // a faint signal travelling out from the centre along primary fibres
        if (f.a === 0 && pulse >= 0 && pulse <= 1 && (f.b === 1 || f.b === 3)) {
          const u = pulse;
          const px = (1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * b.x;
          const py = (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * b.y;
          const g = ctx!.createRadialGradient(px, py, 0, px, py, 10);
          g.addColorStop(0, warm);
          g.addColorStop(1, "transparent");
          ctx!.globalAlpha = 0.55 * Math.sin(u * Math.PI);
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(px, py, 10, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      // nodes, back to front
      const nOrder = nodes.map((n, i) => ({ i, z: P[i]!.z })).filter(({ i }) => nodes[i]!.r > 0).sort((a, b) => b.z - a.z);
      for (const { i } of nOrder) {
        const n = nodes[i]!;
        const p = P[i]!;
        const beat = reduced ? 0 : Math.sin(t * 0.9 + n.phase) * 0.5 + 0.5;
        const scale = p.s / 85;
        const r = n.r * scale * (1 + (i === 0 ? hover * 0.25 : 0) + beat * 0.06);
        const a = depthAlpha(p.z);
        if (n.major) {
          const gr = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * (i === 0 ? 4.5 : 3));
          gr.addColorStop(0, i === 0 ? warm : brand);
          gr.addColorStop(1, "transparent");
          ctx!.globalAlpha = a * (i === 0 ? 0.35 + hover * 0.25 : 0.2);
          ctx!.fillStyle = gr;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, r * (i === 0 ? 4.5 : 3), 0, Math.PI * 2);
          ctx!.fill();
        }
        // glass-like sphere: soft body + small highlight
        const body = ctx!.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
        body.addColorStop(0, ink);
        body.addColorStop(1, i === 0 ? warm : n.major ? brand : accent);
        ctx!.globalAlpha = a * (n.major ? 0.95 : 0.75);
        ctx!.fillStyle = body;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, Math.max(0.8, r), 0, Math.PI * 2);
        ctx!.fill();
        if (n.major) {
          ctx!.globalAlpha = a * 0.5;
          ctx!.strokeStyle = i === 0 ? warm : ink;
          ctx!.lineWidth = 0.6;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, r * 1.7, 0, Math.PI * 2);
          ctx!.stroke();
        }
      }
      ctx!.globalAlpha = 1;
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
  }, []);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="Abstract three-dimensional illustration of an interconnected nerve-fibre network"
      className="relative aspect-[11/10] w-full overflow-hidden"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
    </div>
  );
}
