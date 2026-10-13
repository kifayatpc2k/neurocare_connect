import { useEffect, useRef } from "react";

/**
 * Soft, light-background canvas projection: gently branching nerve fibres
 * growing from a calm central focal point, with drifting knowledge particles.
 * Hand-rolled (no 3D library); colours from theme tokens; reduced-motion safe.
 */
type V3 = { x: number; y: number; z: number };
type Branch = { pts: V3[]; w: number };

function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function build(compact: boolean) {
  const rand = rng(11);
  const branches: Branch[] = [];
  const tips: V3[] = [];
  const grow = (from: V3, dir: V3, len: number, depth: number, w: number) => {
    const pts: V3[] = [from];
    let p = from;
    let d = dir;
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      d = { x: d.x + (rand() - 0.5) * 0.35, y: d.y + (rand() - 0.5) * 0.35, z: d.z + (rand() - 0.5) * 0.35 };
      const m = Math.hypot(d.x, d.y, d.z) || 1;
      d = { x: d.x / m, y: d.y / m, z: d.z / m };
      p = { x: p.x + d.x * (len / steps), y: p.y + d.y * (len / steps), z: p.z + d.z * (len / steps) };
      pts.push(p);
    }
    branches.push({ pts, w });
    if (depth > 0) {
      const n = depth > 1 ? 2 : compact ? 1 : 2;
      for (let k = 0; k < n; k++) grow(pts[3 + k]!, d, len * 0.6, depth - 1, w * 0.6);
    } else tips.push(p);
  };
  const arms = compact ? 6 : 8;
  for (let i = 0; i < arms; i++) {
    const th = (i / arms) * Math.PI * 2 + rand() * 0.3;
    const ph = Math.PI / 2 + (rand() - 0.5) * 1.2;
    grow({ x: 0, y: 0, z: 0 }, { x: Math.sin(ph) * Math.cos(th), y: Math.cos(ph), z: Math.sin(ph) * Math.sin(th) }, 0.9 + rand() * 0.3, 2, 2.2);
  }
  const dust: (V3 & { p: number })[] = Array.from({ length: compact ? 16 : 34 }, () => ({
    x: (rand() - 0.5) * 3.2, y: (rand() - 0.5) * 2.6, z: (rand() - 0.5) * 2.4, p: rand() * 6,
  }));
  return { branches, tips, dust };
}

export function PatientHeroVisual() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compact = window.matchMedia("(max-width: 640px)").matches;
    const { branches, tips, dust } = build(compact);
    const css = getComputedStyle(wrap);
    const col = (n: string, fb: string) => css.getPropertyValue(n).trim() || fb;
    const brand = col("--brand", "#3b8fb0");
    const accent = col("--accent", "#4fa59a");
    const warm = col("--warm", "#d9b98a");

    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(() => { resize(); if (reduced) draw(0); });
    ro.observe(wrap);

    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 0.35;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    const project = (p: V3, rot: number) => {
      const c = Math.cos(rot + cx), s = Math.sin(rot + cx);
      const x = p.x * c - p.z * s;
      let z = p.x * s + p.z * c;
      const cy2 = Math.cos(0.25 + cy), sy = Math.sin(0.25 + cy);
      const y = p.y * cy2 - z * sy;
      z = p.y * sy + z * cy2;
      const f = 3.4 / (3.4 + z);
      const sc = Math.min(w, h) / 3.1;
      return { x: w / 2 + x * sc * f, y: h / 2 + y * sc * f, z, f };
    };

    function draw(t: number) {
      if (!ctx) return;
      cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
      const rot = t * 0.00007;
      ctx.clearRect(0, 0, w, h);
      const c0 = project({ x: 0, y: 0, z: 0 }, rot);
      // soft halo
      const g = ctx.createRadialGradient(c0.x, c0.y, 0, c0.x, c0.y, Math.min(w, h) * 0.42);
      g.addColorStop(0, warm);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 0.28; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.lineCap = "round";
      for (const b of branches) {
        const ps = b.pts.map((p) => project(p, rot));
        const depth = ps.reduce((a, p) => a + p.z, 0) / ps.length;
        ctx.globalAlpha = Math.max(0.18, Math.min(0.75, 0.55 - depth * 0.25));
        ctx.strokeStyle = brand;
        ctx.lineWidth = b.w * ps[0]!.f;
        ctx.beginPath();
        ctx.moveTo(ps[0]!.x, ps[0]!.y);
        for (let i = 1; i < ps.length - 1; i++) {
          const mx = (ps[i]!.x + ps[i + 1]!.x) / 2, my = (ps[i]!.y + ps[i + 1]!.y) / 2;
          ctx.quadraticCurveTo(ps[i]!.x, ps[i]!.y, mx, my);
        }
        ctx.stroke();
      }
      tips.forEach((p, i) => {
        const q = project(p, rot);
        const pulse = reduced ? 1 : 0.75 + 0.25 * Math.sin(t * 0.0015 + i);
        ctx.globalAlpha = Math.max(0.3, Math.min(0.9, 0.7 - q.z * 0.2)) * pulse;
        ctx.fillStyle = i % 3 === 0 ? warm : accent;
        ctx.beginPath(); ctx.arc(q.x, q.y, 2.6 * q.f, 0, Math.PI * 2); ctx.fill();
      });
      for (const d of dust) {
        const q = project({ x: d.x, y: d.y + (reduced ? 0 : Math.sin(t * 0.0004 + d.p) * 0.08), z: d.z }, rot * 0.6);
        ctx.globalAlpha = 0.25; ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(q.x, q.y, 1.4 * q.f, 0, Math.PI * 2); ctx.fill();
      }
      // calm focal point
      const breathe = reduced ? 1 : 1 + 0.06 * Math.sin(t * 0.0012);
      ctx.globalAlpha = 0.25; ctx.fillStyle = warm;
      ctx.beginPath(); ctx.arc(c0.x, c0.y, 22 * breathe, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = brand;
      ctx.beginPath(); ctx.arc(c0.x, c0.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    let raf = 0;
    if (reduced) draw(0);
    else {
      const loop = (t: number) => { draw(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative aspect-square w-full max-w-[560px]" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
