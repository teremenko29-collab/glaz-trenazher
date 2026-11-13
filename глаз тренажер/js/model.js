"use strict";

const st = {path: "norm", side: "L", amb: 300, pen: "off", gx: 0, gy: 0,
  live: true, blink: true, near: false, closed: false, h: false, cyc: false, ncyc: false};
const H_SEQ = [[0, 0], [-28, 0], [-28, -20], [-28, 20], [0, 0], [28, 0], [28, -20], [28, 20]];
const eyes = {R: {p: 3.5, a: 0, t: 0, lb: -10, lid: -10, pen: 0, hU: 41, hL: 48},
              L: {p: 3.5, a: 0, t: 0, lb: -10, lid: -10, pen: 0, hU: 41, hL: 48}};
let P = null, T = 0, F = 0, penEff = null;
let nextSacc = 1, blinkT = -1, nextBlink = 2.5, nyPh = 0, hT = 0, cycT = 0, ncT = 0;
const Dq = [[0, 0.8]];

function buildParams() {
  const mk = () => ({aff: 1, mode: "norm", lid: 0, low: 0, rA: 0, rT: 0, minA: -42, maxA: 38,
                     minT: -32, maxT: 32, ny: 0, off: 0, myas: 0, ino: 0});
  P = {R: mk(), L: mk()};
  const p = PATHS[st.path];
  const set = p.sides ? (st.side === "B" ? ["R", "L"] : [st.side]) : (p.both ? ["R", "L"] : []);
  set.forEach(k => p.ap(P[k]));
}

// пересчёт зрачка, век и положения глаз на каждом кадре
function pupilTarget(q, D, near) {
  const n = 8 - 5.5 * D;
  let t = n, tc = 0.3, td = 1.0;
  switch (q.mode) {
    case "mydr":   t = 7.5 - 0.1 * (8 - n); tc = 1.5; td = 3; break;
    case "mios":   t = 2 + 0.1 * (n - 2); tc = 1.5; td = 3; break;
    case "fix":    t = 5; break;
    case "iii":    t = 7.6; tc = td = 2; break;
    case "horner": t = 2 + 0.45 * (n - 2); td = 3.5; break;
    case "adie":   t = 7 - 1.2 * D; tc = 2.5; td = 4; break;
  }
  if (near) {
    if (q.mode === "norm") t = Math.min(t, 3.0);
    else if (q.mode === "horner") t = Math.min(t, 2.6);
    else if (q.mode === "adie") { t = Math.min(t, 3.6); tc = 3; }
  }
  return {t: clamp(t + q.off, 1.8, 8.4), tc, td};
}

function lidH(L) {
  L = clamp(L, -30, 60);
  const hU = L < -10 ? 41 + (-10 - L) * 0.75 : 41 - (L + 10) * 1.1;
  const hL = 48 - 12 * Math.max(0, (L + 10) / 70);
  return [hU, hL];
}

function step(dt) {
  T += dt;
  // автоматика: проба H, свет и темнота, взгляд вблизи, живой взгляд
  if (st.h) {
    hT += dt;
    const s = H_SEQ[Math.floor(hT / 1.8) % H_SEQ.length];
    st.gx = s[0]; st.gy = s[1];
  } else if (st.live && T >= nextSacc) {
    st.gx = rnd(-15, 15); st.gy = rnd(-8, 8); nextSacc = T + rnd(0.6, 2.2);
  }
  if (st.cyc) { cycT += dt; st.amb = Math.floor(cycT / 4.5) % 2 === 0 ? 1500 : 6; }
  if (st.ncyc) { ncT += dt; st.near = Math.floor(ncT / 4.5) % 2 === 1; }
  penEff = st.pen === "swing" ? (Math.floor(T / 2.4) % 2 === 0 ? "R" : "L") : (st.pen === "off" ? null : st.pen);

  // свет: каждый глаз видит комнату и фонарик, зрачковый ответ общий и идёт от более сильного сигнала
  const lux = {R: st.amb + (penEff === "R" ? 3000 : 0), L: st.amb + (penEff === "L" ? 3000 : 0)};
  const u = k => Math.min(1, Math.log10(lux[k] * P[k].aff + 1) / 3);
  Dq.push([T, Math.max(u("R"), u("L"))]);
  while (Dq.length > 2 && Dq[1][0] <= T - 0.25) Dq.shift();          // задержка реакции 0,25 с
  const D = Dq[0][1];

  // утомляемость при миастении
  if (st.path === "myas") F = clamp(F + dt * (st.closed ? -0.25 : (st.gy < -8 ? 0.10 : 0.015)), 0, 1);
  else F = 0;

  // моргание
  if (st.blink && blinkT < 0 && T >= nextBlink && !st.closed) blinkT = 0;
  let kb = 0;
  if (blinkT >= 0) {
    blinkT += dt;
    const b = blinkT;
    if (b < 0.09) kb = Math.sin(0.5 * Math.PI * b / 0.09);
    else if (b < 0.13) kb = 1;
    else if (b < 0.43) kb = Math.cos(0.5 * Math.PI * (b - 0.13) / 0.30);
    else { kb = 0; blinkT = -1; nextBlink = T + rnd(2, 6); }
  }

  // нистагм: медленно в одну сторону, быстро назад
  nyPh = (nyPh + dt * 2.5) % 1;
  const saw = nyPh < 0.8 ? nyPh / 0.8 : (1 - nyPh) / 0.2;

  for (const k of ["R", "L"]) {
    const e = eyes[k], q = P[k], sg = k === "R" ? 1 : -1, other = P[k === "R" ? "L" : "R"];
    // зрачок
    const pt = pupilTarget(q, D, st.near);
    e.p += (pt.t - e.p) * (1 - Math.exp(-dt / (pt.t < e.p ? pt.tc : pt.td)));
    // взгляд: a - приведение к носу, у правого глаза оно идёт вправо на экране
    let ac = sg * st.gx;
    if (q.ino) ac = Math.min(ac, 3);
    let at = ac + q.rA + (st.near ? 11.7 : 0);
    if (q.ny) at += sg * 4 * (saw - 0.5);
    if (other.ino && sg * st.gx < -8) at += 5 * saw;                   // нистагм отводящегося глаза
    at = clamp(at, q.minA, q.maxA);
    const tt = clamp(st.gy + q.rT, q.minT, q.maxT);
    const kk = 1 - Math.exp(-dt / 0.035);
    e.a += (at - e.a) * kk;
    e.t += (tt - e.t) * kk;
    // веко
    const rest = -10 + q.lid + (q.myas ? 6 + 34 * F : 0) + 0.5 * e.t;
    e.lb += ((st.closed ? 60 : rest) - e.lb) * (1 - Math.exp(-dt / 0.07));
    e.lid = e.lb + (60 - e.lb) * kb;
    let [hU, hL] = lidH(e.lid);
    hL = clamp(hL + 0.25 * e.t - q.low, 8, 60);
    e.hU = Math.max(hU, -hL); e.hL = hL;
    e.pen += ((penEff === k ? 1 : 0) - e.pen) * (1 - Math.exp(-dt / 0.1));
  }
}
