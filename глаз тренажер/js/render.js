"use strict";

const bez = (a, b, c, d, t) => { const m = 1 - t; return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d; };
const R1 = v => v.toFixed(1);
const ref = {};
for (const k of NS_ALL) for (const n of ["ap", "gz", "pu", "rf", "sh", "shl", "lidU", "lidL", "lsh", "lshL", "brow", "crease", "glow"])
  ref[n + k] = $(n + "-" + k);
const lamp = {x: 500, y: 700, rot: 0, op: 0, bx: 500};

function geom(k, e) {
  const cx = CXS[k], sx = SX[k];
  const x0 = cx + sx * W, y0 = CY + 6, x1 = cx - sx * W, y1 = CY - 6;
  const ux1 = cx + sx * 70, ux2 = cx - sx * 55, uy = CY - e.hU * 1.333, ly = CY + e.hL * 1.333;
  const up = `M${x0} ${y0}C${ux1} ${uy} ${ux2} ${uy} ${x1} ${y1}`;
  const lo = `M${x0} ${y0}C${ux1} ${ly} ${ux2} ${ly} ${x1} ${y1}`;
  return {x0, y0, x1, y1, ux1, ux2, uy, ly, up, lo, ap: up + `C${ux2} ${ly} ${ux1} ${ly} ${x0} ${y0}Z`};
}
function lashes(g, sx, closure) {
  let s = "";
  for (let t = 0.08; t < 0.97; t += 0.05) {
    const x = bez(g.x0, g.ux1, g.ux2, g.x1, t), y = bez(g.y0, g.uy, g.uy, g.y1, t);
    const len = 9 + 9 * Math.sin(Math.PI * t);
    const dx = -sx * (0.3 + 0.5 * (t - 0.4)), dy = -(1 - 2 * closure), n = Math.hypot(dx, dy);
    s += `M${R1(x)} ${R1(y)}l${R1(dx / n * len)} ${R1(dy / n * len)}`;
  }
  return s;
}
function lashesLow(g, sx) {
  let s = "";
  for (let t = 0.18; t < 0.9; t += 0.1) {
    const x = bez(g.x0, g.ux1, g.ux2, g.x1, t), y = bez(g.y0, g.ly, g.ly, g.y1, t);
    s += `M${R1(x)} ${R1(y)}l${R1(-sx * 1)} 5.5`;
  }
  return s;
}

function renderEye(k) {
  const e = eyes[k], q = P[k], sx = SX[k], cx = CXS[k], g = geom(k, e);
  ref["ap" + k].setAttribute("d", g.ap);
  ref["lidU" + k].setAttribute("d", g.up);
  ref["lidL" + k].setAttribute("d", g.lo);
  ref["sh" + k].setAttribute("d", g.up);
  ref["shl" + k].setAttribute("d", g.lo);
  ref["lsh" + k].setAttribute("d", lashes(g, sx, clamp((41 - e.hU) / 77, 0, 1)));
  ref["lshL" + k].setAttribute("d", lashesLow(g, sx));
  const hc = 66 + 0.2 * e.hU;
  ref["crease" + k].setAttribute("d", `M${cx + sx * (W - 8)} ${CY - 8}C${cx + sx * 62} ${CY - hc * 1.333} ${cx - sx * 48} ${CY - hc * 1.333} ${cx - sx * (W + 14)} ${CY - 14}`);
  // бровь поднимается, когда пациент старается открыть опущенное веко
  const lift = clamp((q.lid + (q.myas ? 6 + 34 * F : 0)) * 0.36, 0, 16);
  ref["brow" + k].setAttribute("transform", `translate(0 ${R1(-lift)})`);
  ref["crease" + k].setAttribute("transform", `translate(0 ${R1(-lift * 0.5)})`);
  // радужка и зрачок
  const ax = sx * e.a;                                   // угол на экране, + вправо
  const gxp = cx + RG * Math.sin(ax * DEG), gyp = CY + RG * Math.sin(e.t * DEG);
  ref["gz" + k].setAttribute("transform", `translate(${R1(gxp)} ${R1(gyp)}) scale(${Math.cos(ax * DEG).toFixed(3)} ${Math.cos(e.t * DEG).toFixed(3)})`);
  ref["pu" + k].setAttribute("r", (e.p / 2 * PX).toFixed(2));
  // блик на роговице: 1 мм смещения = 7° отклонения (проба Гиршберга)
  let rx = gxp - 1.22 * ax + sx * 4, ry = gyp - 1.22 * e.t - 2;
  const dx = rx - gxp, dy = ry - gyp, d = Math.hypot(dx, dy), lim = RI * 0.82;
  if (d > lim) { rx = gxp + dx / d * lim; ry = gyp + dy / d * lim; }
  ref["rf" + k].setAttribute("transform", `translate(${R1(rx)} ${R1(ry)})`);
  ref["glow" + k].setAttribute("opacity", (e.pen * 0.6).toFixed(3));
}

function render(dt) {
  renderEye("R"); renderEye("L");
  const kamb = clamp(Math.log10(st.amb + 1) / 3.3, 0, 1);
  $("night").setAttribute("opacity", (0.64 * (1 - kamb)).toFixed(3));
  // фонарик
  let tx, ty, rot, op = 0;
  if (penEff) {
    const sg = penEff === "R" ? -1 : 1;
    tx = CXS[penEff] + sg * 48; ty = CY + 132; rot = penEff === "R" ? 24 : -24; op = 1;
    lamp.bx += (CXS[penEff] - lamp.bx) * (1 - Math.exp(-dt / 0.09));
  } else { tx = lamp.x; ty = 700; rot = lamp.rot; }
  const kk = 1 - Math.exp(-dt / 0.09);
  lamp.x += (tx - lamp.x) * kk; lamp.y += (ty - lamp.y) * kk; lamp.rot += (rot - lamp.rot) * kk; lamp.op += (op - lamp.op) * kk;
  $("lamp").setAttribute("opacity", lamp.op.toFixed(2));
  $("lamp").setAttribute("transform", `translate(${R1(lamp.x)} ${R1(lamp.y)})`);
  $("lampR").setAttribute("transform", `rotate(${R1(lamp.rot)})`);
  const bp = $("beamP"), bg = $("beam");
  bp.setAttribute("d", `M${R1(lamp.x)} ${R1(lamp.y)}L${R1(lamp.bx - 70)} ${CY - 4}L${R1(lamp.bx + 70)} ${CY + 4}Z`);
  bp.setAttribute("opacity", (lamp.op * 0.9).toFixed(2));
  bg.setAttribute("x1", R1(lamp.x)); bg.setAttribute("y1", R1(lamp.y));
  bg.setAttribute("x2", R1(lamp.bx)); bg.setAttribute("y2", CY);
}

