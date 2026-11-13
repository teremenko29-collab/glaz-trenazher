"use strict";

const plist = $("plist");
GROUPS.forEach(gr => {
  if (gr.t) { const h = document.createElement("div"); h.className = "gh"; h.textContent = gr.t; plist.appendChild(h); }
  gr.ids.forEach(id => {
    const p = PATHS[id], b = document.createElement("button");
    b.type = "button"; b.className = "pbtn"; b.dataset.id = id; b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<span class="n">${p.n}</span>` + (p.l ? `<span class="l">${p.l}</span>` : "");
    b.onclick = () => selectPath(id);
    plist.appendChild(b);
  });
});

function selectPath(id) {
  const p = PATHS[id];
  st.path = id; st.side = p.sides ? p.def : null;
  Object.assign(st, {h: false, cyc: false, ncyc: false});
  if (st.pen === "swing") st.pen = "off";
  F = 0; buildParams(); renderDetail(); syncUI();
  const b = plist.querySelector(`[data-id="${id}"]`);
  if (b && b.scrollIntoView && matchMedia("(max-width:979px)").matches) b.scrollIntoView({inline: "nearest", block: "nearest", behavior: "smooth"});
}

function renderDetail() {
  const p = PATHS[st.path];
  $("dName").textContent = p.n; $("dLat").textContent = p.l;
  $("dSee").textContent = p.see; $("dCheck").textContent = p.check; $("dCause").textContent = p.cause;
  $("demoNote").textContent = p.demo[1];
  $("gauge").classList.toggle("on", st.path === "myas");
  const row = $("sideRow"), seg = $("sideSeg");
  row.style.display = p.sides ? "" : "none";
  seg.innerHTML = "";
  (p.sides || []).forEach(s => {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.side = s; b.textContent = SIDE_NAME[s]; b.setAttribute("aria-pressed", "false");
    b.onclick = () => { st.side = s; buildParams(); syncUI(); };
    seg.appendChild(b);
  });
  $("sideLab").textContent = st.path === "aniso" ? "Крупнее зрачок" : "Сторона";
}

function pressed(el, on) { el.setAttribute("aria-pressed", on ? "true" : "false"); }
const luxOf = s => Math.round(Math.pow(10, 0.033 * s) - 1);
const sOf = lux => Math.round(Math.log10(lux + 1) / 0.033);

function syncUI() {
  plist.querySelectorAll(".pbtn").forEach(b => pressed(b, b.dataset.id === st.path));
  $("sideSeg").querySelectorAll("button").forEach(b => pressed(b, b.dataset.side === st.side));
  $("penSeg").querySelectorAll("button").forEach(b => pressed(b, b.dataset.pen === st.pen));
  pressed($("cLive"), st.live); pressed($("cH"), st.h); pressed($("cNear"), st.near);
  pressed($("cBlink"), st.blink); pressed($("cClose"), st.closed);
  $("lux").value = sOf(st.amb); $("luxV").textContent = Math.round(st.amb) + " лк";
  last.amb = st.amb; last.near = st.near;
}
const last = {amb: 0, near: false};

$("lux").oninput = e => { st.amb = luxOf(+e.target.value); st.cyc = false; syncUI(); };
$("penSeg").onclick = e => { const b = e.target.closest("button"); if (b) { st.pen = b.dataset.pen; syncUI(); } };
$("cCenter").onclick = () => { st.gx = 0; st.gy = 0; st.live = false; st.h = false; syncUI(); };
$("cLive").onclick = () => { st.live = !st.live; if (st.live) st.h = false; syncUI(); };
$("cH").onclick = () => { st.h = !st.h; hT = 0; if (st.h) st.live = false; else { st.gx = 0; st.gy = 0; } syncUI(); };
$("cNear").onclick = () => { st.near = !st.near; st.ncyc = false; syncUI(); };
$("cBlink").onclick = () => { st.blink = !st.blink; syncUI(); };
$("cOnce").onclick = () => { if (blinkT < 0) blinkT = 0; };
$("cClose").onclick = () => { st.closed = !st.closed; syncUI(); };
$("demo").onclick = () => {
  const kind = PATHS[st.path].demo[0];
  Object.assign(st, {live: false, h: false, cyc: false, ncyc: false, pen: "off", near: false, closed: false, gx: 0, gy: 0, amb: 300});
  F = 0;
  if (kind === "swing") { st.pen = "swing"; st.amb = 40; }
  else if (kind === "cycle") { st.cyc = true; cycT = 0; }
  else if (kind === "near") { st.ncyc = true; ncT = 0; }
  else if (kind === "h") { st.h = true; hT = 0; }
  else if (kind === "up") st.gy = -22;
  else if (kind === "myas") st.gy = -24;
  syncUI();
};

// площадка взгляда
const pad = $("pad"); let drag = false;
function padSet(ev) {
  const r = pad.getBoundingClientRect();
  st.gx = (clamp((ev.clientX - r.left) / r.width, 0, 1) * 2 - 1) * 35;
  st.gy = (clamp((ev.clientY - r.top) / r.height, 0, 1) * 2 - 1) * 22;
  st.live = false; st.h = false; syncUI();
}
pad.addEventListener("pointerdown", ev => { drag = true; pad.setPointerCapture(ev.pointerId); padSet(ev); });
pad.addEventListener("pointermove", ev => { if (drag) padSet(ev); });
["pointerup", "pointercancel"].forEach(n => pad.addEventListener(n, () => { drag = false; }));
pad.addEventListener("keydown", ev => {
  const m = {ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -2], ArrowDown: [0, 2]}[ev.key];
  if (!m) return;
  ev.preventDefault(); st.gx = clamp(st.gx + m[0], -35, 35); st.gy = clamp(st.gy + m[1], -22, 22); st.live = false; st.h = false; syncUI();
});
// нажатие на глаз включает фонарик на нём
$("scene").addEventListener("click", ev => {
  const r = $("scene").getBoundingClientRect(), k = (ev.clientX - r.left) / r.width < 0.5 ? "R" : "L";
  st.pen = st.pen === k ? "off" : k; syncUI();
});

// Тема. Выбор запоминается между запусками, но в приватном режиме браузера
// localStorage недоступен и бросает исключение, поэтому обёртки.
const root = document.documentElement;
const THEME_KEY = "glaz-theme";

function readTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
}
function writeTheme(t) {
  try { localStorage.setItem(THEME_KEY, t); } catch (e) { }   // не страшно: тема просто не переживёт перезагрузку
}

const saved = readTheme();
if (saved) root.setAttribute("data-theme", saved);

$("theme").onclick = () => {
  const cur = root.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const t = cur === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", t);
  writeTheme(t);
};

// на широком экране сцена и управление идут слева, состояния и описание справа
const wide = matchMedia("(min-width:980px)");
function layout() {
  const col = document.querySelector(".stage-col"), right = document.querySelector(".rightcol"), ctrl = document.querySelector(".ctrl");
  if (wide.matches) { col.appendChild(ctrl); right.insertBefore(plist, right.firstChild); }
  else { col.appendChild(plist); right.after(ctrl); }
}
wide.addEventListener("change", layout); layout();

// обновление подписей и главный цикл
function texts() {
  const p = PATHS[st.path], pen = penEff ? (penEff === "R" ? "OD" : "OS") : "";
  $("vR").textContent = fmt(eyes.R.p); $("vL").textContent = fmt(eyes.L.p);
  $("vD").textContent = "Δ " + fmt(Math.abs(eyes.R.p - eyes.L.p)) + " мм";
  $("tagL").textContent = p.n + (p.sides && st.side ? " · " + SIDE_NAME[st.side] : "");
  $("tagR").textContent = Math.round(st.amb) + " лк" + (pen ? " · фонарик " + pen : "") + (st.near ? " · вблизи" : "");
  $("gv").textContent = Math.round(F * 100) + "%"; $("gbar").style.width = F * 100 + "%";
}
let prev = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min((now - prev) / 1000, 0.1); prev = now; acc += dt;
  step(dt); render(dt);
  $("padPt").style.left = ((st.gx / 35 + 1) / 2 * 100).toFixed(1) + "%";
  $("padPt").style.top = ((st.gy / 22 + 1) / 2 * 100).toFixed(1) + "%";
  if (st.amb !== last.amb || st.near !== last.near) syncUI();
  if (acc > 0.1) { acc = 0; texts(); }
  requestAnimationFrame(frame);
}
buildParams(); renderDetail(); syncUI(); render(0.016); texts();
requestAnimationFrame(frame);
