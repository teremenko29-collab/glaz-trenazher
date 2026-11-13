"use strict";

const $ = id => document.getElementById(id);
const DEG = Math.PI / 180;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
const fmt = (v, d = 1) => v.toFixed(d).replace(".", ",").replace("-", "−");
