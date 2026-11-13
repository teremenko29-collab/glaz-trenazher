"use strict";

const CY = 270, CXS = {R: 250, L: 750}, SX = {R: 1, L: -1};
const W = 125, RI = 50, PX = RI / 5.85, RG = 110;       // половина разреза, радужка 11,7 мм = 100 ед.
const NS_ALL = ["R", "L"];

function mulberry(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function irisTex() {
  const r = mulberry(11); let s = "";
  for (let i = 0; i < 150; i++) {
    const a = i / 150 * 6.2832 + (r() - 0.5) * 0.04, r0 = 11 + r() * 9, r1 = RI * (0.8 + r() * 0.17);
    const c = Math.cos(a), sn = Math.sin(a), lite = r() > 0.45;
    s += `<line x1="${(c * r0).toFixed(1)}" y1="${(sn * r0).toFixed(1)}" x2="${(c * r1).toFixed(1)}" y2="${(sn * r1).toFixed(1)}" stroke="${lite ? "#fff" : "#0a1430"}" stroke-opacity="${(0.1 + r() * 0.2).toFixed(2)}" stroke-width="${(0.8 + r() * 1.6).toFixed(1)}"/>`;
  }
  s += `<circle r="${RI * 0.46}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2.4"/>`;
  s += `<circle r="${RI * 0.62}" fill="none" stroke="#0a1430" stroke-opacity=".12" stroke-width="5"/>`;
  return s;
}
const FL = 'filterUnits="userSpaceOnUse" x="0" y="0" width="1000" height="520"';
const DEFS = `<defs>
<filter id="b1" ${FL}><feGaussianBlur stdDeviation=".9"/></filter>
<filter id="b8" ${FL}><feGaussianBlur stdDeviation="7"/></filter>
<filter id="b18" ${FL}><feGaussianBlur stdDeviation="18"/></filter>
<linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--skin-1)"/><stop offset="1" stop-color="var(--skin-2)"/></linearGradient>
<radialGradient id="sclera" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="var(--sclera-1)"/><stop offset=".62" stop-color="var(--sclera-1)"/><stop offset="1" stop-color="var(--sclera-2)"/></radialGradient>
<radialGradient id="irisG"><stop offset="0" stop-color="var(--iris-2)"/><stop offset=".28" stop-color="var(--iris-1)"/><stop offset=".55" stop-color="var(--iris-2)"/><stop offset=".88" stop-color="var(--iris-3)"/><stop offset="1" stop-color="var(--iris-4)"/></radialGradient>
<radialGradient id="rfg"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="glowG"><stop offset="0" stop-color="var(--warm)" stop-opacity=".9"/><stop offset=".4" stop-color="var(--warm)" stop-opacity=".35"/><stop offset="1" stop-color="var(--warm)" stop-opacity="0"/></radialGradient>
<linearGradient id="pen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b7888"/><stop offset=".5" stop-color="#2c3541"/><stop offset="1" stop-color="#151b23"/></linearGradient>
<linearGradient id="beam" gradientUnits="userSpaceOnUse" x1="500" y1="600" x2="250" y2="270"><stop offset="0" stop-color="var(--warm)" stop-opacity=".7"/><stop offset="1" stop-color="var(--warm)" stop-opacity=".08"/></linearGradient>
<g id="irisTex">${irisTex()}</g>
<clipPath id="clip-R"><path id="ap-R" d="M0 0"/></clipPath>
<clipPath id="clip-L"><path id="ap-L" d="M0 0"/></clipPath>
</defs>`;

function browD(cx, sx) {
  const xi = cx + sx * 118, xo = cx - sx * 170, yb = CY - 128, xp = cx - sx * 10;
  return `M${xi} ${yb + 10}Q${cx + sx * 50} ${yb - 14} ${xp} ${yb - 24}Q${cx - sx * 100} ${yb - 26} ${xo} ${yb + 14}Q${cx - sx * 100} ${yb - 8} ${xp} ${yb - 8}Q${cx + sx * 50} ${yb} ${xi} ${yb + 22}Z`;
}
function vessels(cx, sx) {
  return `M${cx + sx * 118} ${CY - 4}q${-sx * 22} -6 ${-sx * 40} 2M${cx + sx * 112} ${CY + 14}q${-sx * 24} 4 ${-sx * 44} -2M${cx - sx * 120} ${CY + 2}q${sx * 20} -4 ${sx * 38} 4M${cx - sx * 108} ${CY - 10}q${sx * 22} 2 ${sx * 36} -5`;
}
function eyeSVG(k) {
  const cx = CXS[k], sx = SX[k];
  return `<g id="eye-${k}">
  <ellipse cx="${cx + sx * 40}" cy="${CY + 14}" rx="190" ry="118" fill="var(--skin-sh)" opacity=".16" filter="url(#b18)"/>
  <path id="brow-${k}" d="${browD(cx, sx)}" fill="var(--brow)" opacity=".92" filter="url(#b1)"/>
  <path id="crease-${k}" fill="none" stroke="var(--skin-sh)" stroke-width="3" stroke-linecap="round" opacity=".5" filter="url(#b1)"/>
  <g clip-path="url(#clip-${k})">
    <ellipse cx="${cx}" cy="${CY}" rx="140" ry="112" fill="url(#sclera)"/>
    <path d="${vessels(cx, sx)}" fill="none" stroke="var(--vessel)" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
    <ellipse cx="${cx + sx * (W - 6)}" cy="${CY + 8}" rx="17" ry="11" fill="var(--caruncle)"/>
    <g id="gz-${k}">
      <circle r="${RI}" fill="url(#irisG)"/>
      <use href="#irisTex"/>
      <circle r="${RI - 1.6}" fill="none" stroke="var(--iris-4)" stroke-width="3.2" opacity=".85"/>
      <circle id="pu-${k}" r="17" fill="var(--pupil)"/>
    </g>
    <g id="rf-${k}"><circle r="12" fill="url(#rfg)"/><circle r="3.6" fill="#fff"/></g>
    <path id="sh-${k}" fill="none" stroke="#000" stroke-width="22" opacity=".3" filter="url(#b8)"/>
    <path id="shl-${k}" fill="none" stroke="#000" stroke-width="10" opacity=".14" filter="url(#b8)"/>
  </g>
  <path id="lidL-${k}" fill="none" stroke="var(--lid-edge)" stroke-width="1.8" opacity=".6"/>
  <path id="lidU-${k}" fill="none" stroke="var(--lid-edge)" stroke-width="3.6" stroke-linecap="round"/>
  <path id="lshL-${k}" fill="none" stroke="var(--lash)" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
  <path id="lsh-${k}" fill="none" stroke="var(--lash)" stroke-width="2" stroke-linecap="round"/>
</g>`;
}

$("scene").innerHTML = DEFS + `
<rect width="1000" height="520" fill="url(#skin)"/>
<ellipse cx="500" cy="40" rx="380" ry="70" fill="var(--skin-hi)" opacity=".3" filter="url(#b18)"/>
<ellipse cx="500" cy="290" rx="62" ry="230" fill="var(--skin-hi)" opacity=".42" filter="url(#b18)"/>
<ellipse cx="415" cy="300" rx="34" ry="92" fill="var(--skin-sh)" opacity=".24" filter="url(#b18)"/>
<ellipse cx="585" cy="300" rx="34" ry="92" fill="var(--skin-sh)" opacity=".24" filter="url(#b18)"/>
${eyeSVG("R")}${eyeSVG("L")}
<rect id="night" width="1000" height="520" fill="var(--night)" opacity="0"/>
<circle id="glow-R" cx="${CXS.R}" cy="${CY}" r="200" fill="url(#glowG)" opacity="0" style="mix-blend-mode:screen"/>
<circle id="glow-L" cx="${CXS.L}" cy="${CY}" r="200" fill="url(#glowG)" opacity="0" style="mix-blend-mode:screen"/>
<path id="beamP" fill="url(#beam)" opacity="0" style="mix-blend-mode:screen"/>
<g id="lamp" opacity="0"><g id="lampR">
  <rect x="-12" y="14" width="24" height="330" rx="12" fill="url(#pen)"/>
  <rect x="-15" y="4" width="30" height="20" rx="6" fill="#a9b3bf"/>
  <circle cy="2" r="8" fill="var(--warm)"/>
  <circle cy="2" r="34" fill="url(#glowG)" style="mix-blend-mode:screen"/>
</g></g>`;

