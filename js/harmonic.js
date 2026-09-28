/* ============================================================
   Harmonic drive calculator — clean-room implementation.
   Built from the published cycloid-tooth-profile math (Yao et
   al., Actuators 2025, 14, 187) and standard strain-wave gear
   geometry. This is original code, not a port of any existing
   implementation.

   Key formulas:
     pitch radius      rp = m * Zf / 2
     deflection        w0 = w0ratio * m
     ellipse major     a  = rp + w0
     ellipse minor     b  = root of perimeter(a,b) = 2*pi*rp
                          (solved numerically for exact inextensibility)
     radial shape      rho(psi) = a*b / sqrt(a^2 sin^2 psi + b^2 cos^2 psi)
     section rotation  mu(psi)  = -atan2(rho'(psi), rho(psi))
     reduction         ratio = Zf / (Zc - Zf)
     teeth in mesh     solve w(psi) = 0.9*w0 exactly
     peak strain       exact curvature change at the major axis
   ============================================================ */

const Harmonic = (() => {
  // solve b so that the ellipse perimeter equals the circle perimeter 2*pi*rp.
  // Uses the exact elliptic-integral arc length via Simpson quadrature.
  function ellipsePerimeter(a, b, n) {
    n = n || 4000;
    let s = 0;
    const h = (Math.PI / 2) / n;
    const f = t => Math.hypot(a * Math.sin(t), b * Math.cos(t));
    for (let i = 0; i <= n; i++) {
      const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
      s += w * f(i * h);
    }
    return 4 * (s * h / 3);
  }

  function solveMinorAxis(a, rp) {
    const target = 2 * Math.PI * rp;
    let lo = 1e-6, hi = a;
    for (let i = 0; i < 120; i++) {
      const mid = 0.5 * (lo + hi);
      if (ellipsePerimeter(a, mid, 2000) > target) hi = mid;
      else lo = mid;
    }
    return 0.5 * (lo + hi);
  }

  // radial displacement and section rotation at angle psi from the major axis
  function deform(a, b, rm, psi) {
    const s = Math.sin(psi), c = Math.cos(psi);
    const D = a * a * s * s + b * b * c * c;
    const rho = a * b / Math.sqrt(D);
    const rhop = -a * b * (a * a - b * b) * Math.sin(2 * psi) / (2 * Math.pow(D, 1.5));
    const mu = -Math.atan2(rhop, rho);
    return { rho, w: rho - rm, mu };
  }

  function solve(p) {
    if (!(p.module > 0)) throw new Error("module must be positive");
    if (p.zf < 20) throw new Error("Zf must be at least 20");
    if (p.zc <= p.zf) throw new Error("Zc must be greater than Zf");
    if ((p.zc - p.zf) % 2 !== 0) throw new Error("Zc - Zf must be even");
    if (!(p.w0ratio > 0)) throw new Error("deflection ratio must be positive");

    const m = p.module;
    const rp = m * p.zf / 2;
    const w0 = p.w0ratio * m;
    const a = rp + w0;
    const b = solveMinorAxis(a, rp);
    const rm = rp;
    const ratio = Math.abs(p.zf / (p.zc - p.zf));
    const pitchDia = m * p.zf;

    // teeth in mesh: solve w(psi) = 0.9*w0 exactly (not a cosine approximation)
    let lo = 0, hi = Math.PI / 2;
    for (let i = 0; i < 60; i++) {
      const mid = 0.5 * (lo + hi);
      if (deform(a, b, rm, mid).w > 0.9 * w0) lo = mid;
      else hi = mid;
    }
    const psiC = 0.5 * (lo + hi);
    const teethMesh = Math.round(p.zf * (2 * psiC) / Math.PI);
    const teethPct = 100 * teethMesh / p.zf;

    // peak strain = exact curvature change at the major axis
    // kappa(t) = a*b / (a^2 sin^2 t + b^2 cos^2 t)^{3/2}; major axis at t=0
    const kappaMajor = a * b / Math.pow(b * b, 1.5);
    const kappaCircle = 1 / rm;
    const dKappa = kappaMajor - kappaCircle;
    const strainPct = (p.wall / 2) * dKappa * 100;

    // outer diameter: pitch dia + 2*(w0 + tooth height + wall). Tooth height
    // ~ 2 modules (addendum + dedendum), so outer ~ pitch + 2*(w0 + 2m + wall).
    const toothHeight = 2 * m;
    const outerDia = pitchDia + 2 * (w0 + toothHeight + p.wall);

    const deflPct = 100 * w0 / rm;

    return {
      ratio, pitchDia, outerDia, w0, deflPct, teethMesh, teethPct,
      strainPct, a, b, rm, m, zf: p.zf, zc: p.zc, wall: p.wall, psiC
    };
  }

  // draw the flexspline + circular spline cross-section
  function draw(canvasId, r) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const scale = (W / 2 - 20) / (r.outerDia / 2);

    // circular spline (rigid, round)
    ctx.beginPath();
    ctx.arc(cx, cy, (r.outerDia / 2 - r.wall) * scale, 0, 2 * Math.PI);
    ctx.strokeStyle = "#c94a1e";
    ctx.lineWidth = 2;
    ctx.stroke();

    // flexspline (deformed ellipse)
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const psi = 2 * Math.PI * i / 200;
      const def = deform(r.a, r.b, r.rm, psi);
      const rad = def.rho * scale;
      const x = cx + rad * Math.cos(psi);
      const y = cy + rad * Math.sin(psi);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "#1a7f4b";
    ctx.lineWidth = 2;
    ctx.stroke();

    // pitch circle
    ctx.beginPath();
    ctx.arc(cx, cy, r.rm * scale, 0, 2 * Math.PI);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(138,133,120,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // major axis marker
    ctx.beginPath();
    ctx.moveTo(cx - r.a * scale, cy);
    ctx.lineTo(cx + r.a * scale, cy);
    ctx.strokeStyle = "rgba(26,26,26,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  return { solve, draw };
})();
