/* ==========================================================
   DRM-66 · labs: every canvas on the page
   ========================================================== */
(() => {
  "use strict";
  const D = window.D66, { $, $$, clamp, lerp, rand, DPR, C, sfx: S } = D;
  const ctx2d = cv => cv.getContext("2d");
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };
  const visible = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  // auto-demo: fire when the element scrolls into view, then every `every` ms while it stays there
  const auto = (el, fn, every = 0, th = .35) => {
    let t = null;
    new IntersectionObserver(es => {
      if (es[es.length - 1].isIntersecting) { if (t === null) { fn(); if (every) t = setInterval(() => { if (!document.hidden && !D.still) fn(); }, every); else t = 0; } }
      else { if (t) clearInterval(t); if (every) t = null; }
    }, { threshold: th }).observe(el);
  };

  /* =========================================================
     HERO · topographic ink field (WebGL2), click to drop ink
     ========================================================= */
  function initInk() {
    const cv = $("#ink");
    const gl = cv.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
    if (!gl) { cv.style.background = "radial-gradient(circle at 70% 30%, #ff4f1f22, transparent 50%)"; return; }
    const vs = `#version 300 es
    in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
    const fs = `#version 300 es
    precision highp float;
    uniform vec2 R; uniform float T; uniform vec2 M; uniform vec4 Dr[6];
    out vec4 o;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+1.),f.x), f.y); }
    float fbm(vec2 p){ float v=0., a=.5; mat2 r=mat2(.8,.6,-.6,.8);
      for(int i=0;i<5;i++){ v+=a*n(p); p=r*p*2.03; a*=.5; } return v; }
    void main(){
      vec2 p = (gl_FragCoord.xy - .5*R) / R.y;
      vec2 m = (M - .5*R) / R.y;
      float t = T * .05, dm = length(p - m);
      float rip = 0., wet = 0.;
      for (int i = 0; i < 6; i++) {
        float age = T - Dr[i].z;
        if (Dr[i].w > 0. && age > 0. && age < 7.) {
          vec2 c = (Dr[i].xy - .5*R) / R.y; float d = length(p - c), front = age * .32;
          rip += sin((d - front) * 34.) * exp(-abs(d - front) * 9.) * exp(-age * .55);
          wet += smoothstep(front, front - .05, d) * exp(-age * .5) * smoothstep(.0, .25, age);
        }
      }
      vec2 q = p * 1.25; q += (p - m) * .35 * exp(-dm * 3.5);
      vec2 a = vec2(fbm(q + vec2(t, -t*.4)), fbm(q + vec2(5.2, 1.3) - t*.7));
      vec2 b = vec2(fbm(q + 2.4*a + vec2(1.7, 9.2) + t*.3), fbm(q + 2.4*a + vec2(8.3, 2.8)));
      float f = fbm(q + 2.2*b) + rip * .045;
      float bands = f * 22., w = fwidth(bands);
      float line = 1. - smoothstep(w * .3, w * 1.2, .5 - abs(fract(bands) - .5));
      float major = 1. - smoothstep(w * .8, w * 2.2, 2.5 - abs(fract(bands / 5.) - .5) * 5.);
      vec3 paper = vec3(.945, .929, .89), ink = vec3(.078, .078, .07), ver = vec3(1., .31, .12), cob = vec3(.15, .28, 1.);
      vec3 col = paper;
      col = mix(col, vec3(.91, .885, .83), smoothstep(.45, .75, f) * .7);
      col = mix(col, ver, smoothstep(.62, .78, b.x) * .10);
      col = mix(col, cob, smoothstep(.70, .85, a.y) * .06);
      float near = exp(-dm * 4.);
      vec3 lc = mix(ink, ver, clamp(near * 1.4 + wet * .8, 0., 1.));
      col = mix(col, lc, line * (.20 + near * .45) + major * .28);
      col = mix(col, ver, wet * .10);
      col = mix(paper, col, .35 + .65 * smoothstep(-.55, .35, p.y));
      o = vec4(col, 1.);
    }`;
    const sh = (t, src) => { const x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(x)); return x; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, "R"), uT = gl.getUniformLocation(pr, "T"), uM = gl.getUniformLocation(pr, "M"), uD = gl.getUniformLocation(pr, "Dr");
    const drops = new Float32Array(24); let di = 0, pmx = 0, pmy = 0;
    const drop = (x, y) => { const r = cv.getBoundingClientRect(), k = cv.width / r.width; drops.set([(x - r.left) * k, (r.bottom - y) * k, D.T, 1], (di++ % 6) * 4); S.tone(rand(180, 320), .6, "sine", .1, .6); S.noise(.2, 600, .8, .05, "lowpass"); };
    cv.parentElement.addEventListener("pointerdown", e => { if (!e.target.closest("a,button")) drop(e.clientX, e.clientY); });
    document.addEventListener("d66boot", () => setTimeout(() => drop(innerWidth * .66, innerHeight * .38), 900));
    D.loop(cv, (dt, T) => {
      D.fit(cv, .6); gl.viewport(0, 0, cv.width, cv.height);
      const r = cv.getBoundingClientRect(), k = cv.width / r.width;
      pmx = lerp(pmx, (D.mx - r.left) * k, .08); pmy = lerp(pmy, (r.bottom - D.my) * k, .08);
      gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, T); gl.uniform2f(uM, pmx, pmy); gl.uniform4fv(uD, drops);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  }

  /* =========================================================
     business-card generator
     ========================================================= */
  function initCard() {
    const modal = $("#cardModal"), cv = $("#cardCanvas"), g = ctx2d(cv), line = $("#cardLine"), dl = $("#cardDl");
    const P = { paper: "#f1ede3", ink: "#141412", ver: "#ff4f1f", cob: "#2747ff", sun: "#f2c230" };
    const themes = [{ bg: P.paper, fg: P.ink, ac: P.ver }, { bg: P.ink, fg: P.paper, ac: P.ver }, { bg: P.ver, fg: P.ink, ac: P.paper }, { bg: P.cob, fg: P.paper, ac: P.sun }, { bg: P.sun, fg: P.ink, ac: P.cob }];
    let ti = 0, seed = Math.random() * 1000, motif = 0;
    function draw() {
      const th = themes[ti % themes.length], W = cv.width, H = cv.height;
      g.fillStyle = th.bg; g.fillRect(0, 0, W, H);
      g.save(); g.globalAlpha = .2; g.strokeStyle = th.fg; g.lineWidth = 1.2;
      for (let k = 0; k < 26; k++) { g.beginPath(); for (let x = 0; x <= W; x += 8) { const y = H * .1 + k * 22 + Math.sin(x * .006 + seed + k * .25) * 40 + Math.sin(x * .017 + seed * 2 + k * .1) * 14; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      g.restore();
      // motif top-right: BGA balls / morse / waveform
      const mx = W - 70, my = 70;
      if (motif % 3 === 0) for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) { const on = Math.sin(seed + i * 1.7 + j * 2.3) > .4; g.fillStyle = on ? th.ac : th.fg; g.globalAlpha = on ? 1 : .18; g.beginPath(); g.arc(mx - i * 26 - 10, my + j * 26 + 10, 9, 0, 7); g.fill(); }
      else if (motif % 3 === 1) { let x = mx; g.fillStyle = th.ac; for (const ch of "BH3FWY".split("").reverse()) { for (const s of [...D.MORSE[ch]].reverse()) { const w = s === "." ? 12 : 34; x -= w; g.fillRect(x, my + 20, w, 12); x -= 8; } x -= 22; } g.font = "500 18px JetBrains Mono, monospace"; g.fillStyle = th.fg; g.textAlign = "right"; g.fillText("DE BH3FWY", mx, my + 70); g.textAlign = "left"; }
      else { g.strokeStyle = th.ac; g.lineWidth = 3; g.beginPath(); for (let x = 0; x < 330; x += 3) { const y = my + 40 + Math.sin(x * .09 + seed) * 22 * Math.exp(-x / 260) * Math.sin(x * .013); x ? g.lineTo(mx - 330 + x, y) : g.moveTo(mx - 330 + x, y); } g.stroke(); }
      g.globalAlpha = 1;
      g.fillStyle = th.fg; g.font = "600 22px JetBrains Mono, monospace"; g.fillText("MAKER · AI INFRA · MUSICIAN", 70, 92);
      g.font = "italic 400 190px Instrument Serif, Georgia, serif"; g.fillText("dreaming", 62, 400);
      g.fillStyle = th.ac; g.fillText("66", 62 + g.measureText("dreaming").width + 10, 400);
      g.fillStyle = th.fg; g.font = "900 40px Noto Serif SC, serif"; g.fillText(line.value || " ", 70, 500);
      g.fillRect(70, 560, W - 140, 2);
      g.font = "500 24px JetBrains Mono, monospace"; g.fillText("github.com/dreaming66", 70, 620);
      g.textAlign = "right"; g.fillText("me.dustinz.de", W - 70, 620); g.textAlign = "left";
      dl.href = cv.toDataURL("image/png");
    }
    const open = async () => { await document.fonts.ready; draw(); modal.classList.add("open"); modal.setAttribute("aria-hidden", false); S.chord([523, 659, 784], .05, "triangle", .07); };
    const close = () => { modal.classList.remove("open"); modal.setAttribute("aria-hidden", true); };
    $("#cardBtn").addEventListener("click", open);
    $("#cardClose").addEventListener("click", close);
    $("#cardShuffle").addEventListener("click", () => { ti++; motif++; seed = Math.random() * 1000; draw(); S.blip(rand(500, 900)); });
    line.addEventListener("input", draw);
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  /* =========================================================
     §01 streaming text
     ========================================================= */
  function initGen() {
    const el = $("#genOut"), stat = $("#genStat");
    const text = "你好，我是 dreaming66。白天和大模型推理打交道，晚上画自己的开发板，周末手搓机器人、折腾无线电，累了就插上电吉他。我相信：理解一个系统最好的方式，是亲手把它从零搭起来。";
    const keys = ["大模型推理", "开发板", "机器人", "无线电", "电吉他", "从零搭起来"];
    const toks = []; let i = 0;
    while (i < text.length) {
      const m = text.slice(i).match(/^[A-Za-z0-9]+/);
      let n = m ? m[0].length : Math.random() < .55 ? 2 : 1;
      if (!m && /[A-Za-z0-9]/.test(text[i + 1] || "")) n = 1;
      toks.push(text.slice(i, i + n)); i += n;
    }
    D.onVisible(el, () => {
      let k = 0; const cur = document.createElement("span"); cur.className = "cur"; el.appendChild(cur);
      const step = () => {
        if (k >= toks.length) { cur.remove(); return; }
        const t = toks[k++], s = document.createElement("span"); s.className = "tk"; s.textContent = t;
        const p = Math.random() < .12 ? rand(.2, .6) : rand(.75, .99);
        s.dataset.lp = `p=${p.toFixed(2)} · logprob ${Math.log(p).toFixed(3)}`;
        const idx = toks.slice(0, k).join("").length - t.length;
        if (keys.some(kk => { const a = text.indexOf(kk); return idx >= a && idx < a + kk.length; })) s.classList.add("hl");
        el.insertBefore(s, cur); stat.textContent = `tokens: ${k} · ${(k / ((performance.now() - t0) / 1000)).toFixed(1)} tok/s`;
        if (k % 2 === 0) S.tone(rand(1200, 1600), .015, "square", .018);
        setTimeout(step, D.still ? 0 : (/[，。；：—]/.test(t) ? rand(120, 220) : rand(28, 70)));
      };
      const t0 = performance.now(); step();
    });
  }

  /* =========================================================
     §02 PCB soldering + serial boot
     ========================================================= */
  function initPCB() {
    const cv = $("#pcb"), g = ctx2d(cv), cnt = $("#solderCnt"), pwr = $("#powerBtn"), outEl = $("#serialOut"), state = $("#serialState");
    const flow = $$("#flow li");
    let W = 0, H = 0, s = 1, ox = 0, oy = 0, pads = [], parts = [], smoke = [], down = false, powered = false, ledOn = 0, built = false;
    const setFlow = n => flow.forEach((li, i) => { li.classList.toggle("done", i < n); li.classList.toggle("cur", i === n); });
    setFlow(2);
    // AuraCore V2.0 layout, portrait mm (x 0..31 across, y 0..62 down), read off the PCB PDF; drawn landscape
    const BW = 31, BL = 62;
    const L = (x, y) => [ox + y * s, oy + (BW - x) * s];
    const R = (x, y, w, h) => { const [X, Y] = L(x + w, y); return [X, Y, h * s, w * s]; };
    function build() {
      W = cv.width / DPR; H = cv.height / DPR;
      s = Math.min((W - 40) / BL, (H - 80) / (BW + 4)); ox = (W - BL * s) / 2; oy = (H - 60 - BW * s) / 2 + 6;
      const old = new Set(pads.filter(p => p.on).map(p => p.id));
      pads = []; parts = [];
      const part = (name, x, y, w, h, kind, label) => { const p = { name, x, y, w, h, kind, label, pads: [], t: 0 }; parts.push(p); return p; };
      const pad = (p, x, y, w, h, round) => { const q = { id: pads.length, x, y, w, h, round, on: false, t: 0, part: p }; pads.push(q); p && p.pads.push(q); };
      const bga = (p, cols, rows, pitch, skip) => { const x0 = p.x + (p.w - (cols - 1) * pitch) / 2, y0 = p.y + (p.h - (rows - 1) * pitch) / 2; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (!skip || !skip(i, j)) pad(p, x0 + i * pitch - .22, y0 + j * pitch - .22, .44, .44, true); };
      const qfn = (p, n, len) => { const st = p.w / (n + 1); for (let i = 1; i <= n; i++) { pad(p, p.x + i * st - .15, p.y - len, .3, len); pad(p, p.x + i * st - .15, p.y + p.h, .3, len); pad(p, p.x - len, p.y + i * st - .15, len, .3); pad(p, p.x + p.w, p.y + i * st - .15, len, .3); } pad(p, p.x + p.w * .3, p.y + p.h * .3, p.w * .4, p.h * .4); };
      const two = (p, vertical) => { if (vertical) { pad(p, p.x, p.y - .3, p.w, .45); pad(p, p.x, p.y + p.h - .15, p.w, .45); } else { pad(p, p.x - .3, p.y, .45, p.h); pad(p, p.x + p.w - .15, p.y, .45, p.h); } };
      const h616 = part("H616", 15.4, 21.4, 12.7, 14.7, "bga", "H616"); bga(h616, 16, 18, .72, (i, j) => (i > 3 && i < 12 && j > 3 && j < 14) && !(i > 5 && i < 10 && j > 6 && j < 11));
      const ddr = part("DDR", 4.3, 20.9, 8.6, 14.3, "bga", "DDR3"); bga(ddr, 7, 16, .8, (i) => i === 3);
      const emmc = part("eMMC", 15.6, 6.8, 12.3, 13.9, "bga", "eMMC"); bga(emmc, 12, 13, .85, (i, j) => (i > 1 && i < 10 && j > 1 && j < 11) && !(i > 3 && i < 8 && j > 3 && j < 9));
      const tf = part("TF", 1.8, 6.3, 13.1, 12.4, "metal", "microSD"); for (let i = 0; i < 8; i++) pad(tf, 3 + i * 1.3, 5.2, .7, 1.4); pad(tf, 1, 7, 1, 1.6); pad(tf, 14.7, 7, 1, 1.6); pad(tf, 1, 16, 1, 1.6); pad(tf, 14.7, 16, 1, 1.6);
      const pmic = part("PMIC", 13.1, 42.8, 3.9, 4.3, "ic", "AXP313A"); qfn(pmic, 5, .7);
      [[18.1, 45, "L1"], [18.1, 41.7, "L2"], [12.7, 39.4, "L3"]].forEach(([x, y, n]) => { const p = part(n, x, y, 2.3, 2.6, "ind", n); two(p, true); });
      const xt = part("X2", 28.3, 28.9, 1.8, 2.2, "ic", "24M"); pad(xt, 28.1, 28.7, .6, .6); pad(xt, 29.6, 28.7, .6, .6); pad(xt, 28.1, 30.7, .6, .6); pad(xt, 29.6, 30.7, .6, .6);
      const fel = part("FEL", 24.8, 42.8, 5.3, 3.3, "btn", "FEL"); pad(fel, 24.3, 42.5, 1, .9); pad(fel, 29.6, 42.5, 1, .9); pad(fel, 24.3, 45.5, 1, .9); pad(fel, 29.6, 45.5, 1, .9);
      const ant = part("ANT", 19, .4, 10.1, 4, "ant", "ANT"); pad(ant, 19.2, .8, 1.4, 3.2); pad(ant, 27.5, .8, 1.4, 3.2);
      [[14.6, "LED1"], [16.6, "LED2"]].forEach(([x, n]) => { const p = part(n, x, .9, 1.6, 3, "led", ""); two(p, true); });
      const usbs = [part("USB2", -.8, 38.4, 8.9, 10, "usb", "USB-C"), part("USB3", -.8, 51.2, 8.9, 10, "usb", "USB-C"), part("USB1", 9.9, 53.8, 10, 9, "usb", "USB-C")];
      usbs.forEach((p, k) => { const vert = k < 2; for (let i = 0; i < 12; i++) vert ? pad(p, p.x + p.w + .2, p.y + 1.6 + i * .58, 1.1, .3) : pad(p, p.x + 1.6 + i * .58, p.y - 1.2, .3, 1.1); });
      const hd = part("HDMI", 22.8, 48.3, 8.6, 12.6, "metal", "HDMI"); for (let i = 0; i < 19; i++) pad(hd, 21.4, 49 + i * .5, 1.2, .25);
      const caps = part("DECAP", 1.9, 21.6, 2, 13, null, ""); for (let i = 0; i < 12; i++) { pad(caps, 1.9, 22 + i * 1.05, .5, .5); pad(caps, 3.3, 22 + i * 1.05, .5, .5); }
      for (let i = 0; i < 6; i++) { const p = part("R", 9.6 + (i % 3) * 1.2, 41 + (i / 3 | 0) * 2.6, .6, 1.1, "r", ""); two(p, true); }
      pads.forEach(p => { if (old.has(p.id)) p.on = true; });
      built = true; upd();
    }
    const upd = () => {
      const n = pads.filter(p => p.on).length; cnt.textContent = `${n} / ${pads.length} joints`;
      if (n === pads.length && pwr.disabled && !powered) { pwr.disabled = false; setFlow(3); S.chord([523, 659, 784], .06, "triangle", .07); }
    };
    const toBoard = (X, Y) => [BW - (Y - oy) / s, (X - ox) / s];
    const solderAt = (X, Y) => {
      const [x, y] = toBoard(X, Y), rad = 9 / s; let hit = 0;
      for (const p of pads) if (!p.on && x > p.x - rad && x < p.x + p.w + rad && y > p.y - rad && y < p.y + p.h + rad) {
        p.on = true; p.t = 1; hit++;
        if (hit < 6) { const [sx, sy] = L(p.x + p.w / 2, p.y + p.h / 2); smoke.push({ x: sx, y: sy, vx: rand(-8, 8), vy: rand(-30, -14), a: .7, r: rand(3, 6) }); }
        if (p.part && p.part.pads.every(q => q.on)) { p.part.t = 1; S.blip(rand(700, 1100)); }
      }
      if (hit) { S.sizzle(); upd(); }
    };
    const loc = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener("pointerdown", e => { down = true; cv.setPointerCapture(e.pointerId); solderAt(...loc(e)); });
    cv.addEventListener("pointermove", e => { if (down) solderAt(...loc(e)); });
    cv.addEventListener("pointerup", () => down = false);
    $("#autoSolder").addEventListener("click", () => {
      const left = pads.filter(p => !p.on).sort((a, b) => a.y - b.y); let i = 0;
      const tm = setInterval(() => {
        for (let k = 0; k < 14 && i < left.length; k++, i++) { const p = left[i]; p.on = true; p.t = 1; if (p.part && p.part.pads.every(q => q.on)) p.part.t = 1; }
        if (i % 56 < 14) { S.sizzle(); const p = left[Math.min(i, left.length - 1)], [sx, sy] = L(p.x, p.y); smoke.push({ x: sx, y: sy, vx: rand(-6, 6), vy: rand(-26, -10), a: .5, r: 4 }); }
        upd(); if (i >= left.length) clearInterval(tm);
      }, 30);
    });

    const boot = [
      [0, "", "U-Boot SPL 2024.07 (Oct 25 2026 - 21:06:06 +0800)"], [60, "", "DRAM: 512 MiB"], [40, "", "Trying to boot from MMC2"],
      [80, "c", "NOTICE:  BL31: v2.10.0(release)\nNOTICE:  BL31: Detected Allwinner H616 SoC (1823)\nNOTICE:  BL31: Found U-Boot DTB, model: AuraCore V2.0"],
      [250, "w", "\nU-Boot 2024.07 (Oct 25 2026 - 21:06:06 +0800) Allwinner Technology\n"], [40, "", "CPU:   Allwinner H616 (SUN50I)"], [40, "c", "Model: AuraCore V2.0"], [40, "", "DRAM:  512 MiB"],
      [50, "", "MMC:   mmc@4020000: 0, mmc@4022000: 1"], [60, "", "Loading Environment from FAT... OK"], [120, "y", "Hit any key to stop autoboot:  1 "], [700, "y", "Hit any key to stop autoboot:  0 "],
      [80, "", "Scanning mmc 1:1...\nFound U-Boot script /boot.scr"], [60, "", "reading Image\n21178880 bytes read in 902 ms"], [60, "c", "reading sun50i-h616-auracore.dtb\n31872 bytes read in 5 ms"],
      [80, "c", "## Flattened Device Tree blob at 4fa00000\n   Loading Device Tree to 0000000049ff6000 ... OK"],
      [300, "w", "\nStarting kernel ...\n"], [200, "", "[    0.000000] Booting Linux on physical CPU 0x0000000000 [0x410fd034]"],
      [40, "", "[    0.000000] Linux version 6.12.0-auracore (dreaming66@drm-66) (aarch64-buildroot-linux-gnu-gcc 13.3.0) #1 SMP PREEMPT"],
      [40, "c", "[    0.000000] Machine model: AuraCore V2.0"], [40, "", "[    0.000000] Memory: 486120K/524288K available"], [60, "", "[    0.082114] smp: Brought up 1 node, 4 CPUs"],
      [60, "", "[    0.412530] axp20x-i2c 0-0036: AXP313a driver loaded"], [60, "", "[    0.880142] mmc1: new HS200 MMC card at address 0001"],
      [60, "", "[    1.204466] rtw_8821cu 1-1:1.0: Firmware version 24.11.0, H2C version 12"], [60, "", "[    1.360021] g_ether gadget.0: Ethernet Gadget, version: Memorial Day 2008"],
      [80, "", "[    1.512908] EXT4-fs (mmcblk1p2): mounted filesystem r/w with ordered data mode"], [60, "", "[    1.590000] Run /sbin/init as init process"],
      [200, "", "Starting syslogd: OK\nStarting klogd: OK\nStarting network: OK\nStarting dropbear sshd: OK\nStarting k3s-agent: OK"],
      [300, "w", "\nWelcome to Buildroot · AuraCore V2.0 (H616)"],
    ];
    const stageAt = i => i < 16 ? 4 : i < 27 ? 5 : 6;
    const pr = (cls, t) => { outEl.insertAdjacentHTML("beforeend", (cls ? `<span class="${cls}">${t}</span>` : t) + "\n"); outEl.scrollTop = outEl.scrollHeight; };
    pwr.addEventListener("click", () => {
      if (powered) return; powered = true; pwr.disabled = true; outEl.textContent = ""; state.textContent = "CONNECTED"; state.classList.add("live");
      S.thud(.2); S.tone(55, .4, "sine", .1);
      let i = 0;
      const nx = () => {
        if (i >= boot.length) {
          setFlow(7); S.chord([392, 523, 659, 784], .08, "sine", .08);
          outEl.insertAdjacentHTML("beforeend", `auracore login: <input aria-label="login" autocomplete="off" spellcheck="false">`);
          const inp = outEl.lastElementChild; login(inp); if (autoMode) autoShell(inp); else inp.focus({ preventScroll: true }); return;
        }
        const [d, c, t] = boot[i]; setFlow(stageAt(i)); i++;
        setTimeout(() => { pr(c, t); S.tone(rand(1500, 2200), .01, "square", .02); nx(); }, D.still ? 0 : d);
      };
      nx();
    });
    const CMDS = {
      help: "help · uname -a · cat /proc/cpuinfo · free -m · ip a · kubectl get nodes · led · poweroff",
      "uname -a": "Linux auracore 6.12.0-auracore #1 SMP PREEMPT aarch64 GNU/Linux",
      "cat /proc/cpuinfo": "processor\t: 0-3\nBogoMIPS\t: 48.00\nFeatures\t: fp asimd evtstrm aes pmull sha1 sha2 crc32 cpuid\nCPU part\t: 0xd03  (Cortex-A53)\nHardware\t: Allwinner H616 · AuraCore V2.0",
      "free -m": "        total   used   free\nMem:      474    118    356",
      "ip a": "1: lo: <LOOPBACK,UP> mtu 65536\n2: usb0: <BROADCAST,MULTICAST,UP> mtu 1500\n    inet 10.66.0.2/24 scope global usb0\n3: wlan0: <BROADCAST,MULTICAST> mtu 1500",
      "kubectl get nodes": "NAME            STATUS   ROLES\nauracore-head   Ready    control-plane,master\nauracore-w1     Ready    &lt;none&gt;\nauracore-w2     Ready    &lt;none&gt;\nauracore-w3     Ready    &lt;none&gt;\nauracore-w4     Ready    &lt;none&gt;",
      whoami: "root (but really: dreaming66)",
    };
    function login(inp) { hook(inp, v => { pr("", v === "root" ? "" : "(any user is root on this board)"); pr("w", "# 输入 help 试试"); }); }
    function shell(inp) {
      hook(inp, v => {
        if (v === "poweroff") { pr("y", "The system is going down NOW!\nreboot: Power down"); powered = false; ledOn = 0; state.textContent = "NO CARRIER"; state.classList.remove("live"); pwr.disabled = false; setFlow(3); S.whoosh(false); return true; }
        if (v === "led") { ledOn = 2; pr("", "echo heartbeat > /sys/class/leds/auracore:green:status/trigger"); }
        else if (v) pr("", CMDS[v] || `-sh: ${v.replace(/[<>&]/g, "")}: not found`);
      });
    }
    function hook(inp, fn) {
      inp.addEventListener("keydown", e => {
        if (e.key.length === 1) S.tone(rand(1800, 2400), .01, "square", .02);
        if (e.key !== "Enter") return;
        const v = inp.value.trim(); inp.replaceWith(document.createTextNode(v + "\n"));
        if (fn(v) === true) return;
        outEl.insertAdjacentHTML("beforeend", `# <input aria-label="shell" autocomplete="off" spellcheck="false">`);
        const n = outEl.lastElementChild; n.focus({ preventScroll: true }); outEl.scrollTop = outEl.scrollHeight; shell(n);
      });
    }
    pr("", "<span class=\"y\">[ board unpowered ]</span>\n先把焊盘焊好（或 AUTO-SOLDER），再按 POWER ON。");
    // auto demo when scrolled into view: solder → power on → log in → run a few commands
    let autoMode = false, userTouched = false;
    cv.addEventListener("pointerdown", () => userTouched = true, { capture: true });
    const typeInto = (inp, text, done) => {
      let i = 0;
      const step = () => {
        if (!inp.isConnected) return;
        if (i < text.length) { inp.value += text[i++]; S.tone(rand(1800, 2400), .01, "square", .02); setTimeout(step, D.still ? 0 : rand(45, 110)); }
        else setTimeout(() => { inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })); done && setTimeout(done, 350); }, 250);
      };
      step();
    };
    function autoShell(inp) {
      const q = ["uname -a", "kubectl get nodes"];
      typeInto(inp, "root", function next() {
        const cur = outEl.lastElementChild; if (!q.length || !cur || cur.tagName !== "INPUT") return;
        typeInto(cur, q.shift(), next);
      });
    }
    auto(cv, () => {
      if (powered || pads.some(p => p.on) || userTouched) return;
      autoMode = true;
      setTimeout(() => $("#autoSolder").click(), 500);
      const wait = setInterval(() => { if (!pwr.disabled) { clearInterval(wait); setTimeout(() => pwr.click(), 700); } }, 200);
    }, 0, .3);

    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !built) build();
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const [bx, by, bw, bh] = R(0, 0, BW, BL);
      g.fillStyle = "#0f3a24"; rr(g, bx, by, bw, bh, 2.5 * s); g.fill(); g.strokeStyle = "#1d6b42"; g.lineWidth = 1.5; g.stroke();
      // copper pour hint + silkscreen
      g.strokeStyle = "#1a5a37"; g.lineWidth = 1;
      for (let k = 0; k < 26; k++) { const [x1, y1] = L(2 + (k * 7) % 28, 2 + k * 2.3), [x2, y2] = L(2 + (k * 11) % 28, 4 + k * 2.3); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1, y2); g.lineTo(x2, y2); g.stroke(); }
      g.fillStyle = "#e6c35c"; g.font = `600 ${Math.max(9, 1.9 * s)}px Unbounded, sans-serif`;
      const [tx, ty] = L(1.6, 3.4); g.save(); g.translate(tx, ty); g.rotate(-Math.PI / 2); g.fillText("AuraCore", 0, 0); g.restore();
      g.font = `500 ${Math.max(8, 1.2 * s)}px IBM Plex Mono, monospace`; g.fillStyle = "#e8e4d8aa";
      const [dx, dy] = L(3, 37.5); g.save(); g.translate(dx, dy); g.rotate(-Math.PI / 2); g.fillText("Dustin.Z · Engineering Sample", 0, 0); g.restore();
      for (const p of pads) {
        const [x, y, w, h] = R(p.x, p.y, p.w, p.h);
        if (p.on) {
          const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, "#f4f4f0"); gr.addColorStop(1, "#8d9290"); g.fillStyle = gr;
          if (p.round) { g.beginPath(); g.arc(x + w / 2, y + h / 2, Math.max(1.1, w * .62), 0, 7); g.fill(); } else { rr(g, x - .3, y - .3, w + .6, h + .6, 1); g.fill(); }
          if (p.t > 0) { g.fillStyle = `rgba(255,178,26,${p.t})`; g.fillRect(x - 1, y - 1, w + 2, h + 2); p.t -= dt * 2.5; }
        } else { g.fillStyle = "#c8873a"; if (p.round) { g.beginPath(); g.arc(x + w / 2, y + h / 2, Math.max(1, w * .55), 0, 7); g.fill(); } else g.fillRect(x, y, w, h); }
      }
      g.font = "600 9px IBM Plex Mono, monospace";
      for (const p of parts) {
        if (!p.kind) continue;
        const placed = p.pads.length && p.pads.every(q => q.on);
        const [x, y, w, h] = R(p.x, p.y, p.w, p.h);
        if (!placed) { g.setLineDash([3, 3]); g.strokeStyle = "#e8e4d855"; g.lineWidth = 1; g.strokeRect(x, y, w, h); g.setLineDash([]); if (p.label && w > 30) { g.fillStyle = "#e8e4d866"; g.fillText(p.label, x + 4, y + 11); } continue; }
        const k = p.t > 0 ? 1 + p.t * .25 : 1; if (p.t > 0) p.t -= dt * 3;
        g.save(); g.translate(x + w / 2, y + h / 2); g.scale(k, k); g.translate(-w / 2, -h / 2);
        const col = { bga: "#16181a", ic: "#1c1e1c", metal: "#a7aaa4", usb: "#c9ccc6", ind: "#3a3c3a", btn: "#d9d4c6", ant: "#e9e9e9", led: powered && (ledOn === 2 ? Math.sin(T * 9) > .3 : true) ? C.hot : "#5a2a20", r: "#202020" }[p.kind] || "#222";
        g.fillStyle = col; rr(g, 0, 0, w, h, Math.min(3, w * .08)); g.fill();
        if (p.kind === "led" && powered) { g.shadowColor = C.hot; g.shadowBlur = 16; g.fill(); g.shadowBlur = 0; }
        if (p.kind === "bga") { g.fillStyle = "#ffffff10"; g.beginPath(); g.arc(6, 6, 2, 0, 7); g.fill(); }
        if (p.label) { g.fillStyle = p.kind === "metal" || p.kind === "usb" || p.kind === "btn" || p.kind === "ant" ? "#1a1a1a" : "#e8e4d8"; g.fillText(p.label, 4, Math.min(h - 4, 12)); }
        g.restore();
      }
      for (let i = smoke.length - 1; i >= 0; i--) { const q = smoke[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.r += dt * 10; q.a -= dt * .7; if (q.a <= 0) { smoke.splice(i, 1); continue; } g.fillStyle = `rgba(220,220,210,${q.a * .35})`; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); }
      const r = cv.getBoundingClientRect(), mx = D.mx - r.left, my = D.my - r.top;
      if (mx > 0 && my > 0 && mx < W && my < H) { g.strokeStyle = down ? C.amb : "#ffffff55"; g.lineWidth = 1; g.beginPath(); g.arc(mx, my, 9, 0, 7); g.stroke(); }
    });
  }

  /* MCU blink */
  function initMCU() {
    $$(".blink").forEach(cv => {
      const g = ctx2d(cv), col = cv.dataset.color, rate = +cv.dataset.rate; let fast = 1;
      const card = cv.closest(".mcu");
      card.addEventListener("pointerenter", () => { fast = 4; S.blip(rate > 2 ? 880 : rate > .8 ? 660 : 440); });
      card.addEventListener("pointerleave", () => fast = 1);
      let ph = 0;
      D.loop(cv, dt => {
        D.fit(cv); const W = cv.width, H = cv.height; ph += dt * rate * fast;
        const on = (ph % 1) < .5;
        g.clearRect(0, 0, W, H);
        g.fillStyle = "#ffffff10"; for (let i = 0; i < 4; i++) g.fillRect(W * .15, H * (.2 + i * .12), W * .45, 2 * DPR);
        g.fillStyle = on ? col : "#ffffff14"; g.shadowColor = col; g.shadowBlur = on ? 20 * DPR : 0;
        g.beginPath(); g.arc(W * .75, H * .75, 6 * DPR, 0, 7); g.fill(); g.shadowBlur = 0;
      });
    });
  }

  /* homelab rack */
  function initRack() {
    const cv = $("#rack"), g = ctx2d(cv);
    const units = [
      { n: "SOFT ROUTER", u: 1, svc: ["WAN ⇄ LAN", "防火墙 / NAT", "VLAN · DNS · DHCP", "代理分流"], c: C.amb },
      { n: "SWITCH 2.5G", u: 1, svc: ["8 × 2.5GbE", "VLAN trunk", "LACP"], c: C.sig },
      { n: "HYPERVISOR", u: 2, svc: ["虚拟化平台", "VM: dev / ci / sandbox", "PCIe 直通"], c: C.ok },
      { n: "K8S NODE-1", u: 1, svc: ["control-plane", "etcd · ingress"], c: C.ok },
      { n: "K8S NODE-2", u: 1, svc: ["worker", "Docker workloads", "Prometheus · Grafana"], c: C.ok },
      { n: "K8S NODE-3", u: 1, svc: ["worker", "GPU / 推理实验"], c: C.ok },
      { n: "NAS", u: 2, svc: ["存储 · 快照 · 备份", "镜像仓库"], c: C.sig },
      { n: "UPS", u: 1, svc: ["市电断了也能优雅关机"], c: C.hot },
    ];
    let W = 0, H = 0, hover = -1, packets = [], leds = [];
    const geo = () => { const rw = Math.min(W * .62, 420), x = W * .08, uh = Math.min(30, (H - 60) / 10); let y = 30; return units.map(u => { const r = { x, y, w: rw, h: uh * u.u - 4 }; y += uh * u.u; return r; }); };
    cv.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; const G = geo(); const nh = G.findIndex(b => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h); if (nh !== hover && nh >= 0) S.tick(); hover = nh; });
    cv.addEventListener("pointerleave", () => hover = -1);
    cv.addEventListener("click", () => { const path = [0, 1, 3 + (Math.random() * 3 | 0)]; packets.push({ path, k: 0, t: 0 }); path.forEach((p, i) => setTimeout(() => S.blip(440 * Math.pow(2, i * 4 / 12)), i * 450)); });
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const G = geo();
      // rails
      g.fillStyle = "#1a1c1a"; g.fillRect(G[0].x - 14, 20, 10, G[G.length - 1].y + G[G.length - 1].h - 10); g.fillRect(G[0].x + G[0].w + 4, 20, 10, G[G.length - 1].y + G[G.length - 1].h - 10);
      g.font = "600 10px IBM Plex Mono, monospace";
      units.forEach((u, i) => {
        const b = G[i];
        g.fillStyle = i === hover ? "#22261f" : "#151715"; g.fillRect(b.x, b.y, b.w, b.h);
        g.strokeStyle = i === hover ? u.c : "#ffffff1c"; g.strokeRect(b.x + .5, b.y + .5, b.w - 1, b.h - 1);
        g.fillStyle = C.fg; g.fillText(u.n, b.x + 10, b.y + Math.min(b.h, 26) / 2 + 4);
        for (let k = 0; k < 6; k++) { const on = Math.sin(T * (3 + k * 1.7) + i * 4.1 + k) > .2; g.fillStyle = on ? u.c : "#ffffff12"; g.fillRect(b.x + b.w - 14 - k * 9, b.y + 6, 5, 3); }
        if (u.u > 1) { g.fillStyle = "#ffffff10"; for (let k = 0; k < 8; k++) g.fillRect(b.x + 10 + k * 16, b.y + b.h - 12, 12, 6); }
      });
      // cables
      g.strokeStyle = "#36e2ff55"; g.lineWidth = 1.5;
      [[0, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6]].forEach(([a, c], k) => {
        const A = G[a], B = G[c], x = A.x + A.w + 20 + k * 6;
        g.beginPath(); g.moveTo(A.x + A.w, A.y + 10); g.bezierCurveTo(x + 20, A.y + 10, x + 20, B.y + 10, B.x + B.w, B.y + 10); g.stroke();
      });
      // packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i]; p.t += dt * 2.2; if (p.t >= 1) { p.t = 0; p.k++; if (p.k >= p.path.length - 1) { packets.splice(i, 1); continue; } }
        const A = G[p.path[p.k]], B = G[p.path[p.k + 1]];
        const ax = A.x + A.w, ay = A.y + 10, bx = B.x + B.w, by = B.y + 10, cx = Math.max(ax, bx) + 40;
        const t = p.t, x = (1 - t) ** 3 * ax + 3 * (1 - t) ** 2 * t * cx + 3 * (1 - t) * t * t * cx + t ** 3 * bx, y = (1 - t) ** 3 * ay + 3 * (1 - t) ** 2 * t * ay + 3 * (1 - t) * t * t * by + t ** 3 * by;
        g.fillStyle = C.amb; g.shadowColor = C.amb; g.shadowBlur = 12; g.fillRect(x - 4, y - 4, 8, 8); g.shadowBlur = 0;
      }
      // info panel
      const ix = G[0].x + G[0].w + 70; if (ix < W - 120) {
        const u = units[hover >= 0 ? hover : Math.floor(T / 3) % units.length];
        g.fillStyle = C.amb; g.fillText("> " + u.n, ix, 50);
        g.fillStyle = C.dim; g.font = "500 12px Noto Sans SC, sans-serif"; u.svc.forEach((s, k) => g.fillText("· " + s, ix, 76 + k * 20));
        g.font = "500 10px IBM Plex Mono, monospace"; g.fillStyle = C.dim2; g.fillText("click → send a packet", ix, H - 20);
      }
    });
  }

  /* =========================================================
     §03 inference lab (PD / NPU / MCP / Graph)
     ========================================================= */
  function initPD() {
    const cv = $("#pdCanvas"), g = ctx2d(cv), load = $("#pdLoad");
    const out = { ttft: $("#mTTFT"), tpot: $("#mTPOT"), jit: $("#mJit"), tps: $("#mTPS") };
    const CH = "推理是把概率变成语言的过程每个词元都值得被认真对待token";
    const PF = .75, STEP = .055;
    let mode = "disagg", W = 0, H = 0, simT = 0, spawnAcc = 0, rri = 0, nodes = [], reqs = [], packets = [], toks = [], lastSnd = 0;
    const intervals = [], ttfts = []; let tokWin = [];
    $$("#exp-pd .tog button").forEach(b => b.addEventListener("click", () => { $$("#exp-pd .tog button").forEach(x => x.classList.toggle("on", x === b)); mode = b.dataset.mode; build(); }));
    function build() {
      reqs = []; packets = []; toks = []; intervals.length = 0; ttfts.length = 0; tokWin = []; nodes = [];
      const mk = (kind, fx, fy, name) => nodes.push({ kind, fx, fy, name, queue: [], cur: null, prog: 0, seqs: [], tick: 0 });
      if (mode === "disagg") { for (let i = 0; i < 3; i++) mk("P", .28, (i + 1) / 4, "P" + i); for (let i = 0; i < 4; i++) mk("D", .74, (i + 1) / 5, "D" + i); }
      else for (let i = 0; i < 4; i++) mk("M", .5, (i + 1) / 5, "N" + i);
      layout();
    }
    const layout = () => nodes.forEach(n => { n.x = n.fx * W; n.y = n.fy * H; });
    const pool = () => ({ x: W * .51, y: H * .5 });
    function emit(n, s) {
      if (s.first == null) { s.first = simT; ttfts.push(simT - s.born); if (ttfts.length > 60) ttfts.shift(); }
      else { intervals.push(simT - s.last); if (intervals.length > 300) intervals.shift(); }
      s.last = simT; s.left--; tokWin.push(simT);
      if (toks.length < 500) toks.push({ x: n.x + 34, y: n.y + rand(-10, 10), vx: rand(160, 240), a: 1, c: CH[Math.random() * CH.length | 0], hue: s.hue });
      const now = performance.now(); if (now - lastSnd > 45) { lastSnd = now; S.tone(rand(2400, 3400), .008, "square", .012); }
    }
    function step(dt) {
      simT += dt; spawnAcc += dt; const every = 2.4 / +load.value;
      while (spawnAcc > every) {
        spawnAcc -= every;
        const t = mode === "disagg" ? nodes.filter(n => n.kind === "P").sort((a, b) => (a.queue.length + !!a.cur) - (b.queue.length + !!b.cur))[0]
          : nodes.slice().sort((a, b) => (a.queue.length + a.seqs.length + !!a.cur * 3) - (b.queue.length + b.seqs.length + !!b.cur * 3))[rri++ % 2];
        reqs.push({ x: W * .03, y: rand(.15, .85) * H, node: t, born: simT, hue: Math.random() < .2 });
      }
      for (let i = reqs.length - 1; i >= 0; i--) { const r = reqs[i], dx = r.node.x - 30 - r.x, dy = r.node.y - r.y, d = Math.hypot(dx, dy), v = 420 * dt; if (d < v) { r.node.queue.push(r); reqs.splice(i, 1); } else { r.x += dx / d * v; r.y += dy / d * v; } }
      for (const n of nodes) {
        if (!n.cur && n.queue.length && n.kind !== "D") { n.cur = n.queue.shift(); n.prog = 0; }
        if (n.cur) { n.prog += dt / PF; if (n.prog >= 1) { const r = n.cur; n.cur = null; const s = { born: r.born, left: rand(14, 34) | 0, first: null, last: 0, hue: r.hue }; if (n.kind === "P") { const d = nodes.filter(x => x.kind === "D").sort((a, b) => a.seqs.length - b.seqs.length)[0]; packets.push({ x: n.x + 30, y: n.y, stage: 0, s, to: d }); } else n.seqs.push(s); } }
        if ((n.kind === "D" || n.kind === "M") && n.seqs.length && !(n.kind === "M" && n.cur)) { n.tick += dt; const st = STEP * (1 + .035 * n.seqs.length); if (n.tick >= st) { n.tick -= st; for (const s of n.seqs) emit(n, s); n.seqs = n.seqs.filter(s => s.left > 0); } }
      }
      for (let i = packets.length - 1; i >= 0; i--) { const k = packets[i], p = pool(), tx = k.stage === 0 ? p.x : k.to.x - 30, ty = k.stage === 0 ? p.y : k.to.y, dx = tx - k.x, dy = ty - k.y, d = Math.hypot(dx, dy), v = 520 * dt; if (d < v) { if (k.stage === 0) k.stage = 1; else { k.to.seqs.push(k.s); packets.splice(i, 1); } } else { k.x += dx / d * v; k.y += dy / d * v; } }
      for (let i = toks.length - 1; i >= 0; i--) { const t = toks[i]; t.x += t.vx * dt; t.a -= dt * .9; if (t.a <= 0 || t.x > W) toks.splice(i, 1); }
      while (tokWin.length && tokWin[0] < simT - 2) tokWin.shift();
    }
    function draw(T) {
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      g.font = "600 10px IBM Plex Mono, monospace"; g.textBaseline = "middle";
      g.fillStyle = C.dim2; g.fillText("REQUESTS →", 10, 16); g.textAlign = "right"; g.fillText("→ TOKENS", W - 10, 16); g.textAlign = "left";
      if (mode === "disagg") {
        const p = pool(); g.setLineDash([3, 5]); g.strokeStyle = "#ffffff30";
        for (const n of nodes) { g.beginPath(); g.moveTo(n.x + (n.kind === "P" ? 30 : -30), n.y); g.lineTo(p.x, p.y); g.stroke(); }
        g.setLineDash([]); g.save(); g.translate(p.x, p.y); g.rotate(T * .6); g.strokeStyle = C.sig; g.lineWidth = 2; g.setLineDash([10, 6]); g.beginPath(); g.arc(0, 0, 38, 0, 7); g.stroke(); g.restore(); g.setLineDash([]);
        g.fillStyle = C.bg; g.beginPath(); g.arc(p.x, p.y, 30, 0, 7); g.fill();
        g.textAlign = "center"; g.fillStyle = C.sig; g.fillText("KV POOL", p.x, p.y - 6); g.fillStyle = C.dim; g.fillText("mooncake", p.x, p.y + 8); g.textAlign = "left";
      }
      for (const n of nodes) {
        const w = 60, h = 40, x = n.x - w / 2, y = n.y - h / 2, stall = n.kind === "M" && n.cur && n.seqs.length;
        g.fillStyle = n.kind === "D" ? "#1c2a1c" : C.bg; rr(g, x, y, w, h, 4); g.fill(); g.lineWidth = 1.2; g.strokeStyle = stall ? C.hot : n.kind === "D" ? C.ok : C.amb; g.stroke();
        g.fillStyle = C.fg; g.fillText(n.name, x + 7, y + 11);
        if (n.cur) { g.fillStyle = C.amb; g.fillRect(x + 6, y + h - 9, (w - 12) * Math.min(1, n.prog), 3); }
        for (let i = 0; i < Math.min(n.seqs.length, 12); i++) { g.fillStyle = C.ok; g.fillRect(x + 6 + i * 4, y + 18, 2, 10); }
        if (n.queue.length) { g.fillStyle = C.dim; g.fillText("q" + n.queue.length, x + w + 5, y + 8); }
        if (stall) { g.fillStyle = C.hot; g.fillText("STALL", x + w + 5, y + h - 6); }
      }
      for (const r of reqs) { g.fillStyle = r.hue ? C.amb : C.fg; g.beginPath(); g.arc(r.x, r.y, 3, 0, 7); g.fill(); }
      for (const k of packets) { g.fillStyle = C.sig; g.fillRect(k.x - 5, k.y - 5, 10, 10); }
      g.font = "500 12px Noto Sans SC, sans-serif";
      for (const t of toks) { g.globalAlpha = Math.max(0, t.a); g.fillStyle = t.hue ? C.amb : C.ok; g.fillText(t.c, t.x, t.y); }
      g.globalAlpha = 1;
    }
    const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; let ma = 0;
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; layout(); }
      step(dt); draw(T);
      ma += dt; if (ma > .25) { ma = 0; const m = avg(intervals), sd = Math.sqrt(avg(intervals.map(v => (v - m) ** 2))); out.ttft.textContent = ttfts.length ? Math.round(avg(ttfts) * 1000) + "ms" : "—"; out.tpot.textContent = intervals.length ? Math.round(m * 1000) + "ms" : "—"; out.jit.textContent = intervals.length ? "±" + Math.round(sd * 1000) : "—"; out.tps.textContent = (tokWin.length / 2).toFixed(0); out.tpot.style.color = m > .12 ? C.hot : ""; }
    });
    build();
  }

  function initNPU() {
    const cv = $("#npuCanvas"), g = ctx2d(cv), read = $("#npuRead"), COLS = 12, ROWS = 8;
    const cells = Array.from({ length: COLS * ROWS }, (_, i) => ({ i, u: rand(.2, .6), seed: rand(0, 100), hbm: rand(18, 50), temp: rand(48, 66) }));
    const hist = Array(120).fill(.4); let W = 0, H = 0, ring = -1, lastCol = -1, storm = 0, hover = -1, ha = 0;
    $("#npuRing").addEventListener("click", () => { ring = 0; lastCol = -1; });
    auto(cv, () => { if (ring < 0) { ring = 0; lastCol = -1; } }, 7000);
    $("#npuStorm").addEventListener("click", () => { storm = 1; S.zap(); });
    const geo = () => { const pad = 22, top = 30, bot = 70; return { ox: pad, oy: top, cw: (W - pad * 2) / COLS, ch: (H - top - bot) / ROWS }; };
    cv.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(), L = geo(), c = Math.floor((e.clientX - r.left - L.ox) / L.cw), w = Math.floor((e.clientY - r.top - L.oy) / L.ch); const nh = c >= 0 && c < COLS && w >= 0 && w < ROWS ? w * COLS + c : -1; if (nh !== hover && nh >= 0) S.tone(200 + cells[nh].u * 600, .03, "sine", .04); hover = nh; });
    cv.addEventListener("pointerleave", () => hover = -1);
    const scale = [0, 2, 4, 7, 9];
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const L = geo(); storm = Math.max(0, storm - dt * .25);
      if (ring >= 0) { ring += dt * 1.6; const c = Math.floor(ring); if (c !== lastCol && c < COLS) { lastCol = c; S.tone(220 * Math.pow(2, (scale[c % 5] + 12 * Math.floor(c / 5)) / 12), .25, "triangle", .08, .4); } if (ring > COLS + 1) ring = -1; }
      let sum = 0;
      for (const c of cells) {
        const col = c.i % COLS, row = c.i / COLS | 0;
        let target = .45 + Math.sin(T * .8 + col * .5 + c.seed) * .18 + Math.sin(T * 2.3 + row + c.seed * 2) * .07 + storm * (.5 + Math.sin(c.seed + T * 6) * .1);
        if (ring >= 0 && Math.abs(ring - col) < 1) target = .97;
        c.u = lerp(c.u, clamp(target, .05, 1), dt * 4 || 0); sum += c.u;
        const x = L.ox + col * L.cw, y = L.oy + row * L.ch, u = c.u;
        g.fillStyle = `rgba(${Math.round(lerp(54, 255, u))},${Math.round(lerp(226, u > .8 ? 75 : 178, u))},${Math.round(lerp(255, 26, u))},${.15 + u * .75})`;
        g.fillRect(x + 2, y + 2, L.cw - 4, L.ch - 4);
        if (c.i === hover) { g.strokeStyle = C.fg; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, L.cw - 2, L.ch - 2); }
      }
      g.font = "500 9px IBM Plex Mono, monospace"; g.fillStyle = C.dim; g.textAlign = "center";
      for (let c = 0; c < COLS; c++) g.fillText("n" + String(c).padStart(2, "0"), L.ox + c * L.cw + L.cw / 2, L.oy - 10);
      g.textAlign = "left";
      if (ring >= 0 && ring < COLS) { const col = Math.floor(ring), cx = L.ox + col * L.cw + L.cw / 2; g.strokeStyle = C.fg; g.lineWidth = 2; g.shadowColor = C.fg; g.shadowBlur = 10; g.beginPath(); g.moveTo(cx, L.oy + L.ch / 2); g.lineTo(cx, L.oy + ROWS * L.ch - L.ch / 2); g.stroke(); g.shadowBlur = 0; }
      ha += dt; if (ha > .08) { ha = 0; hist.push(sum / cells.length); hist.shift(); }
      const sy = H - 50, sh = 34;
      g.strokeStyle = C.amb; g.lineWidth = 1.5; g.beginPath(); hist.forEach((v, i) => { const x = L.ox + i / (hist.length - 1) * (W - L.ox * 2), y = sy + sh - v * sh; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      g.fillStyle = C.fg; g.fillText(`cluster util ${(sum / cells.length * 100).toFixed(1)}%`, L.ox, sy - 4);
      if (hover >= 0) { const c = cells[hover]; read.textContent = `node-${String(hover % COLS).padStart(2, "0")} / npu-${hover / COLS | 0}\nutil ${(c.u * 100).toFixed(0)}% · HBM ${(c.hbm + c.u * 12).toFixed(1)}/64 GB · ${(c.temp + c.u * 14).toFixed(0)}°C\nhccl link: ${ring >= 0 && Math.abs(ring - hover % COLS) < 1 ? "ALLREDUCE ⟳" : "OK"}`; }
      else if (Math.random() < dt * 2) read.textContent = `${COLS} nodes × ${ROWS} cards · ${storm > .1 ? "⚡ burst traffic" : "steady"}\nhover a card…`;
    });
  }

  function initMCP() {
    const inn = $("#mcpIn"), out = $("#mcpOut");
    const ex = [
      { i: `# openapi: 3.0  (demo / fictional)\npaths:\n  /api/v1/flights/{flightNo}/status:\n    get:\n      summary: 查询航班实时状态\n      parameters:\n        - name: flightNo\n          in: path\n          required: true\n        - name: date\n          in: query\n          schema: { type: string, format: date }\n      security: [ { bearerAuth: [] } ]`,
        o: `{\n  "name": "get_flight_status",\n  "description": "查询航班实时状态",\n  "inputSchema": {\n    "type": "object",\n    "properties": {\n      "flightNo": { "type": "string" },\n      "date": { "type": "string", "format": "date" }\n    },\n    "required": ["flightNo"]\n  },\n  "annotations": { "readOnlyHint": true },\n  "_gateway": { "auth": "bearer" }\n}` },
      { i: `# openapi: 3.0  (demo / fictional)\npaths:\n  /geo/v2/route:\n    post:\n      summary: 两点之间的路线规划\n      requestBody:\n        content:\n          application/json:\n            schema:\n              required: [from, to]\n              properties:\n                from: { type: string }\n                to:   { type: string }\n                mode: { enum: [drive, walk] }`,
        o: `{\n  "name": "plan_route",\n  "description": "两点之间的路线规划",\n  "inputSchema": {\n    "type": "object",\n    "properties": {\n      "from": { "type": "string" },\n      "to": { "type": "string" },\n      "mode": { "enum": ["drive", "walk"] }\n    },\n    "required": ["from", "to"]\n  },\n  "_gateway": { "auth": "apikey", "rateLimit": "60/min" }\n}` },
      { i: `# openapi: 3.0  (demo / fictional)\npaths:\n  /corp/search:\n    get:\n      summary: 按名称检索企业信息\n      parameters:\n        - name: keyword\n          in: query\n          required: true\n        - name: page\n          in: query\n          schema: { type: integer }\n      x-scope: corp.read`,
        o: `{\n  "name": "search_company",\n  "description": "按名称检索企业信息",\n  "inputSchema": {\n    "type": "object",\n    "properties": {\n      "keyword": { "type": "string" },\n      "page": { "type": "integer" }\n    },\n    "required": ["keyword"]\n  },\n  "_gateway": { "scope": "corp.read", "audit": true }\n}` },
    ];
    const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const hiY = s => esc(s).replace(/(#.*)/g, '<span class="c">$1</span>').replace(/^(\s*)([\w\/{}.-]+):/gm, '$1<span class="k">$2</span>:').replace(/\b(get|post)\b/g, '<span class="m">$1</span>');
    const hiJ = s => esc(s).replace(/("[\w_]+")(\s*:)/g, '<span class="k">$1</span>$2').replace(/:\s*("[^"]*")/g, ': <span class="s">$1</span>');
    let k = 0, job = 0, started = false;
    async function play() {
      const my = ++job, e = ex[k++ % ex.length];
      const type = async (el, text, hi, sp) => {
        if (D.still) { el.innerHTML = hi(text); return; }
        for (let i = 0; i <= text.length; i += sp) { if (my !== job) return; el.innerHTML = hi(text.slice(0, i)) + '<span class="caret"></span>'; if (i % (sp * 3) === 0) S.tone(rand(1800, 2600), .01, "square", .015); await new Promise(r => requestAnimationFrame(r)); }
        el.innerHTML = hi(text);
      };
      out.innerHTML = '<span class="c">// waiting for spec…</span>';
      await type(inn, e.i, hiY, 6); if (my !== job) return;
      S.whoosh(); await new Promise(r => setTimeout(r, 300));
      await type(out, e.o, hiJ, 4); if (my === job) S.blip(880);
    }
    $("#mcpNext").addEventListener("click", play);
    D.onVisible(inn, () => { started = true; play(); });
    setInterval(() => { if (started && !D.still && !document.hidden && visible(inn)) play(); }, 12000);
  }

  function initGraph() {
    const cv = $("#gCanvas"), g = ctx2d(cv), col = { A: C.hot, I: C.sig, D: C.fg, S: C.ok, T: C.amb };
    const N = [], E = []; let W = 0, H = 0, drag = null, et = -1, lastWave = -1;
    const add = (type, label) => { const n = { type, label, x: rand(-1, 1), y: rand(-1, 1), vx: 0, vy: 0, r: type === "A" ? 12 : type === "T" ? 5 : 7 }; N.push(n); return n; };
    const link = (a, b, rel) => E.push({ a, b, rel });
    const atk = add("A", "APT-Ω"); let ip = 10, fr = [atk];
    ["web-01", "db-02", "gw-03"].forEach(s => link(atk, add("S", s), "ATTACKED"));
    for (let dp = 1; dp <= 6; dp++) { const nx = []; for (const f of fr) { const k = dp === 1 ? 3 : dp < 4 ? 2 : 1; for (let j = 0; j < k && N.length < 46; j++) { const n = dp % 2 ? add("I", `203.0.113.${ip++}`) : add("D", `${["c2", "cdn", "mail", "drop"][Math.random() * 4 | 0]}-${dp}${j}.example`); link(f, n, "ASSOC"); nx.push(n); if (Math.random() < .35) link(n, add("T", ["botnet", "phish", "c2", "miner"][Math.random() * 4 | 0]), "TAG"); } } fr = nx; }
    const adj = new Map(N.map(n => [n, []])); E.forEach(e => { adj.get(e.a).push(e.b); adj.get(e.b).push(e.a); });
    const hop = new Map([[atk, 0]]), q = [atk]; while (q.length) { const n = q.shift(); for (const m of adj.get(n)) if (!hop.has(m)) { hop.set(m, hop.get(n) + 1); q.push(m); } }
    $("#gExpand").addEventListener("click", () => { et = 0; lastWave = -1; });
    auto(cv, () => { if (et < 0) { et = 0; lastWave = -1; } }, 12000);
    const lp = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left - W / 2, y: e.clientY - r.top - H / 2 }; };
    cv.addEventListener("pointerdown", e => { const p = lp(e); let b = null, bd = 400; for (const n of N) { const d = (n.x - p.x) ** 2 + (n.y - p.y) ** 2; if (d < bd) { bd = d; b = n; } } if (b) { drag = b; cv.setPointerCapture(e.pointerId); S.blip(330); } });
    cv.addEventListener("pointermove", e => { if (drag) { const p = lp(e); drag.x = p.x; drag.y = p.y; drag.vx = drag.vy = 0; } });
    cv.addEventListener("pointerup", () => drag = null);
    const pent = [0, 3, 5, 7, 10, 12, 15];
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      const k = Math.min(W, H) * .11, sd = D.still ? .016 : dt;
      for (let i = 0; i < N.length; i++) { const a = N[i]; for (let j = i + 1; j < N.length; j++) { const b = N[j]; let dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy + .01, f = k * k / d2 * .9, d = Math.sqrt(d2); dx /= d; dy /= d; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; } }
      for (const e of E) { let dx = e.b.x - e.a.x, dy = e.b.y - e.a.y; const d = Math.hypot(dx, dy) + .01, f = (d - k * (e.rel === "TAG" ? .45 : .8)) * .05; dx /= d; dy /= d; e.a.vx += dx * f; e.a.vy += dy * f; e.b.vx -= dx * f; e.b.vy -= dy * f; }
      for (const n of N) { n.vx -= n.x * .004; n.vy -= n.y * .006; if (n === drag) continue; n.vx *= .82; n.vy *= .82; n.x += clamp(n.vx, -20, 20) * sd * 30; n.y += clamp(n.vy, -20, 20) * sd * 30; n.x = clamp(n.x, -W / 2 + 20, W / 2 - 20); n.y = clamp(n.y, -H / 2 + 20, H / 2 - 20); }
      if (et >= 0) et += D.still ? .016 : dt;
      const wave = et >= 0 ? et / .55 : -1; if (wave > 12) et = -1;
      if (wave >= 0 && Math.floor(wave) !== lastWave && wave <= 6) { lastWave = Math.floor(wave); S.pluck(220 * Math.pow(2, pent[lastWave] / 12), .25, .7); }
      g.setTransform(DPR, 0, 0, DPR, W / 2 * DPR, H / 2 * DPR); g.clearRect(-W / 2, -H / 2, W, H);
      for (const e of E) { const lit = wave >= 0 && Math.max(hop.get(e.a), hop.get(e.b)) <= wave; g.strokeStyle = lit ? C.hot : "#ffffff22"; g.lineWidth = lit ? 1.6 : 1; if (e.rel === "TAG") g.setLineDash([2, 4]); g.beginPath(); g.moveTo(e.a.x, e.a.y); g.lineTo(e.b.x, e.b.y); g.stroke(); g.setLineDash([]); }
      g.font = "500 9.5px IBM Plex Mono, monospace"; g.textBaseline = "middle";
      for (const n of N) {
        const h = hop.get(n);
        if (wave >= 0 && Math.abs(wave - h) < .6) { g.strokeStyle = C.hot; g.lineWidth = 1.5; g.globalAlpha = 1 - Math.abs(wave - h) / .6; g.beginPath(); g.arc(n.x, n.y, n.r + 6 + (wave - h + .6) * 10, 0, 7); g.stroke(); g.globalAlpha = 1; }
        g.fillStyle = col[n.type]; g.beginPath(); g.arc(n.x, n.y, n.r, 0, 7); g.fill();
        if (n.type === "A" || n === drag || (wave >= 0 && h <= wave && n.type !== "T")) { g.fillStyle = C.fg; g.fillText(n.label, n.x + n.r + 4, n.y); }
      }
      g.fillStyle = C.dim; g.font = "500 10px IBM Plex Mono, monospace";
      g.fillText(wave >= 0 ? `MATCH (a:Attacker)-[*1..${Math.min(6, Math.floor(wave))}]-(n) RETURN n` : "drag nodes · fictional data", -W / 2 + 14, H / 2 - 14);
    });
  }

  /* =========================================================
     §04 WIP · biped RL toy
     ========================================================= */
  function initRobot() {
    const cv = $("#robot"), g = ctx2d(cv), sl = $("#rlEp");
    const oE = $("#rlE"), oR = $("#rlR"), oF = $("#rlF"), oV = $("#rlV");
    let W = 0, H = 0, ph = 0, tilt = 0, tv = 0, fallen = 0, falls = 0, scroll = 0, lastContact = [0, 0], noiseS = [0, 0, 0, 0];
    const curve = Array.from({ length: 101 }, (_, i) => { const x = i / 100; return -60 + 380 / (1 + Math.exp(-(x - .38) * 11)) + (Math.random() - .5) * 40 * (1 - x * .7); });
    const q = () => { const e = +sl.value / 1000; return 1 / (1 + Math.exp(-(e - .38) * 11)); };
    let touched = false, epT = 0;
    sl.addEventListener("input", () => { touched = true; S.tone(200 + sl.value * .6, .04, "sine", .04); });
    cv.addEventListener("pointerdown", () => { tv += rand(2.5, 4) * (Math.random() < .5 ? -1 : 1); S.thud(.18); });
    const ik = (hx, hy, fx, fy, L1, L2) => {
      const dx = fx - hx, dy = fy - hy; let d = Math.hypot(dx, dy); d = Math.min(d, L1 + L2 - .01);
      const a = Math.atan2(dy, dx), b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
      const kx = hx + Math.cos(a - b) * L1, ky = hy + Math.sin(a - b) * L1; return [kx, ky];
    };
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      if (!touched) { epT += dt; if (epT > 20) epT = 0; sl.value = Math.min(1000, Math.round(epT / 14 * 1000)); }
      const Q = q(), ep = +sl.value, ground = H * .78, S0 = Math.min(W, H) / 380;
      const speed = fallen > 0 ? 0 : (.3 + Q * 1.1);
      // joint noise random walk
      for (let i = 0; i < 4; i++) noiseS[i] = lerp(noiseS[i], rand(-1, 1), dt * 6);
      // balance dynamics
      if (fallen > 0) { fallen -= dt; tilt = lerp(tilt, Math.sign(tilt || 1) * 1.45, dt * 6); if (fallen <= 0) { tilt = 0; tv = 0; } }
      else {
        tv += (rand(-1, 1) * (1 - Q) * 9 + Math.sin(ph * 2) * (1 - Q) * 3) * dt;
        tv -= tilt * (4 + Q * 30) * dt; tv *= Math.pow(.15 + (1 - Q) * .6, dt);
        tilt += tv * dt;
        if (Math.abs(tilt) > .75) { fallen = 1.3; falls++; oF.textContent = falls; S.thud(.25); S.noise(.15, 400, .7, .1, "lowpass"); }
      }
      ph += dt * speed * 5.2; scroll += dt * speed * 120 * S0;
      // ground
      g.strokeStyle = C.line; g.beginPath(); g.moveTo(0, ground); g.lineTo(W, ground); g.stroke();
      g.fillStyle = C.dim2; for (let x = -(scroll % 40); x < W; x += 40) g.fillRect(x, ground + 6, 14, 1);
      // body
      const cx = W * .42, hipH = 120 * S0, L1 = 62 * S0, L2 = 62 * S0, bob = Math.abs(Math.sin(ph)) * 5 * S0 * Q;
      g.save(); g.translate(cx, ground); g.rotate(tilt); g.translate(-cx, -ground);
      const hx = cx, hy = ground - hipH - bob + (fallen > 0 ? 0 : 0);
      const stride = (22 + 18 * Q) * S0, lift = (8 + 16 * Q) * S0;
      const legs = [0, Math.PI].map((o, i) => {
        const p = ph + o, fx = hx + Math.cos(p) * stride + noiseS[i] * (1 - Q) * 22 * S0, fy = ground - Math.max(0, Math.sin(p)) * lift + noiseS[i + 2] * (1 - Q) * 6 * S0;
        const contact = Math.sin(p) <= 0 ? 1 : 0;
        if (contact && !lastContact[i] && fallen <= 0) S.thud(.05 + Q * .03);
        lastContact[i] = contact;
        return { fx, fy: Math.min(fy, ground), k: ik(hx, hy, fx, Math.min(fy, ground), L1, L2), back: i === 1 };
      });
      const drawLeg = (l, a) => { g.globalAlpha = a; g.strokeStyle = l.back ? C.dim : C.fg; g.lineWidth = 7 * S0; g.lineCap = "round"; g.beginPath(); g.moveTo(hx, hy); g.lineTo(...l.k); g.lineTo(l.fx, l.fy); g.stroke(); g.fillStyle = C.amb; g.beginPath(); g.arc(...l.k, 4.5 * S0, 0, 7); g.fill(); g.fillStyle = l.back ? C.dim : C.fg; g.fillRect(l.fx - 12 * S0, l.fy - 4 * S0, 24 * S0, 5 * S0); g.globalAlpha = 1; };
      drawLeg(legs[1], .55);
      // torso
      const th = 70 * S0, tw = 48 * S0;
      g.fillStyle = "#1c1f1c"; g.strokeStyle = C.fg; g.lineWidth = 2; rr(g, hx - tw / 2, hy - th, tw, th, 6 * S0); g.fill(); g.stroke();
      g.fillStyle = C.sig; for (let i = 0; i < 3; i++) g.fillRect(hx - tw / 2 + 8 * S0, hy - th + 12 * S0 + i * 9 * S0, (Math.sin(T * 4 + i) * .5 + .5) * 20 * S0, 3 * S0);
      // head
      const hy2 = hy - th - 30 * S0; g.fillStyle = "#1c1f1c"; rr(g, hx - 22 * S0, hy2, 44 * S0, 28 * S0, 8 * S0); g.fill(); g.stroke();
      g.fillStyle = fallen > 0 ? C.hot : C.amb; g.shadowColor = g.fillStyle; g.shadowBlur = 12; g.fillRect(hx - 14 * S0, hy2 + 10 * S0, 28 * S0, 6 * S0); g.shadowBlur = 0;
      g.strokeStyle = C.dim; g.beginPath(); g.moveTo(hx, hy2); g.lineTo(hx + 6 * S0, hy2 - 12 * S0); g.stroke(); g.fillStyle = Math.sin(T * 6) > 0 ? C.hot : C.dim2; g.beginPath(); g.arc(hx + 6 * S0, hy2 - 13 * S0, 3 * S0, 0, 7); g.fill();
      // arms
      const sw = Math.sin(ph) * (.5 + .3 * Q) + noiseS[0] * (1 - Q);
      [[-1, C.dim], [1, C.fg]].forEach(([s, c]) => { g.strokeStyle = c; g.lineWidth = 5 * S0; g.beginPath(); g.moveTo(hx, hy - th + 10 * S0); const ax = hx + Math.sin(sw * s) * 40 * S0, ay = hy - th + 10 * S0 + Math.cos(sw * s) * 40 * S0; g.lineTo(ax, ay); g.lineTo(ax + Math.sin(sw * s + .5) * 26 * S0, ay + 26 * S0); g.stroke(); });
      drawLeg(legs[0], 1);
      g.restore();
      // reward curve inset
      const ix = W - 190, iy = 24, iw = 170, ih = 80;
      g.strokeStyle = C.line; g.strokeRect(ix + .5, iy + .5, iw, ih);
      g.strokeStyle = C.ok; g.lineWidth = 1.4; g.beginPath(); curve.forEach((v, i) => { const x = ix + i / 100 * iw, y = iy + ih - (v + 80) / 440 * ih; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      const cxp = ix + ep / 1000 * iw; g.strokeStyle = C.amb; g.beginPath(); g.moveTo(cxp, iy); g.lineTo(cxp, iy + ih); g.stroke();
      g.font = "500 9px IBM Plex Mono, monospace"; g.fillStyle = C.dim; g.fillText("episode reward", ix + 4, iy + 12);
      const R = curve[Math.round(ep / 10)];
      oE.textContent = ep; oR.textContent = R.toFixed(0); oV.textContent = (speed * .4 * (fallen > 0 ? 0 : 1)).toFixed(2) + "m/s";
      g.fillStyle = C.dim; g.fillText(Q < .3 ? "policy: flailing" : Q < .7 ? "policy: shuffling" : "policy: walking ✓", 14, 20);
    });
  }

  /* =========================================================
     §04 WIP · SDR waterfall with audible signals
     ========================================================= */
  function initSDR() {
    const cv = $("#sdr"), g = ctx2d(cv), fEl = $("#sdrFreq"), read = $("#sdrRead");
    const F0 = 144.0, F1 = 146.0, COLS = 320, ROWS = 220;
    const wf = document.createElement("canvas"); wf.width = COLS; wf.height = ROWS; const wg = ctx2d(wf); wg.fillStyle = "#000"; wg.fillRect(0, 0, COLS, ROWS);
    const row = wg.createImageData(COLS, 1);
    let W = 0, H = 0, f = 145.0, target = 145.0, drag = false, lx = 0, ft = 0;
    // morse beacon timeline
    const MSG = "CQ CQ DE BH3FWY BH3FWY K   ";
    const u = .075, tl = []; let tt = 0; const chars = [];
    for (const ch of MSG) { if (ch === " ") { tt += u * 4; continue; } const st = tt; for (const s of D.MORSE[ch]) { const d = s === "." ? u : 3 * u; tl.push([tt, tt + d]); tt += d + u; } tt += 2 * u; chars.push([tt, ch]); }
    const total = tt + u * 10;
    const keyAt = t => { const m = t % total; return tl.some(([a, b]) => m >= a && m < b); };
    const sigs = [
      { f: 145.660, w: .004, kind: "cw", name: "CW beacon · BH3FWY" },
      { f: 144.640, w: .012, kind: "burst", name: "APRS-like data burst" },
      { f: 145.350, w: .018, kind: "voice", name: "FM voice (synthetic)" },
      { f: 144.380, w: .006, kind: "carrier", name: "unmodulated carrier" },
    ];
    const level = (s, t) => s.kind === "cw" ? (keyAt(t) ? 1 : 0) : s.kind === "burst" ? ((t % 6) < .45 ? 1 : 0) : s.kind === "voice" ? (Math.sin(t * .4) > -.3 ? .6 + Math.sin(t * 7) * .25 : 0) : .5;
    // audio graph
    let A = null;
    function audioOn() {
      const a = D.audio; if (!a.ctx || A) return; const c = a.ctx;
      const ns = c.createBufferSource(); ns.buffer = a.noiseBuf; ns.loop = true;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = .6;
      const ng = c.createGain(); ng.gain.value = 0; ns.connect(bp); bp.connect(ng); ng.connect(a.master); ns.start();
      const cw = c.createOscillator(); cw.frequency.value = 700; const cg = c.createGain(); cg.gain.value = 0; cw.connect(cg); cg.connect(a.master); cw.start();
      const vo = c.createOscillator(); vo.type = "sawtooth"; vo.frequency.value = 160; const vl = c.createOscillator(); vl.frequency.value = 5; const vlg = c.createGain(); vlg.gain.value = 40; vl.connect(vlg); vlg.connect(vo.frequency);
      const vf = c.createBiquadFilter(); vf.type = "bandpass"; vf.frequency.value = 900; vf.Q.value = 2; const vg = c.createGain(); vg.gain.value = 0; vo.connect(vf); vf.connect(vg); vg.connect(a.master); vo.start(); vl.start();
      const bo = c.createOscillator(); bo.type = "square"; bo.frequency.value = 1200; const bg = c.createGain(); bg.gain.value = 0; bo.connect(bg); bg.connect(a.master); bo.start();
      const co = c.createOscillator(); co.frequency.value = 1000; const cog = c.createGain(); cog.gain.value = 0; co.connect(cog); cog.connect(a.master); co.start();
      A = { ng, cg, cw, vg, vf, bg, bo, cog, co };
    }
    const tune = v => { target = clamp(v, F0 + .02, F1 - .02); };
    document.addEventListener("d66tune", e => tune(e.detail));
    let userTuned = false;
    D.onVisible(cv, () => { [144.38, 144.64, 145.35, 145.66].forEach((f, i) => setTimeout(() => { if (!userTuned) { tune(f); S.whoosh(); } }, 600 + i * 2200)); }, .35);
    $("#sdrScan").addEventListener("click", () => { const s = sigs[(sigs.findIndex(s => Math.abs(s.f - target) < .01) + 1) % sigs.length]; tune(s.f); S.whoosh(); });
    cv.addEventListener("pointerdown", e => { userTuned = true; drag = true; lx = e.clientX; cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(); if (e.clientY - r.top < 70) tune(F0 + (e.clientX - r.left) / W * (F1 - F0)); });
    cv.addEventListener("pointermove", e => { if (!drag) return; tune(target + (e.clientX - lx) / W * (F1 - F0)); lx = e.clientX; });
    cv.addEventListener("pointerup", () => drag = false);
    cv.addEventListener("wheel", e => { if (!visible(cv)) return; e.preventDefault(); tune(target + Math.sign(e.deltaY) * .005); }, { passive: false });
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      f = lerp(f, target, Math.min(1, dt * 10)); fEl.textContent = f.toFixed(3) + " MHz";
      // waterfall row
      wg.drawImage(wf, 0, 1);
      const d = row.data;
      for (let x = 0; x < COLS; x++) {
        const fx = F0 + x / COLS * (F1 - F0); let p = Math.random() * .18 + .05;
        for (const s of sigs) { const L = level(s, T); if (L) { const dd = (fx - s.f) / s.w; p += L * Math.exp(-dd * dd) * (s.kind === "voice" ? .7 + Math.random() * .3 : 1); } }
        p = clamp(p, 0, 1);
        d[x * 4] = p * p * 255 * 1.0; d[x * 4 + 1] = p * 178 + (p > .7 ? 60 : 0); d[x * 4 + 2] = (1 - p) * 60 + p * 26; d[x * 4 + 3] = 255;
        if (p < .3) { d[x * 4] = 10 + p * 80; d[x * 4 + 1] = 20 + p * 200; d[x * 4 + 2] = 40 + p * 300; }
      }
      wg.putImageData(row, 0, 0);
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const top = 70; g.imageSmoothingEnabled = true; g.drawImage(wf, 0, top, W, H - top);
      // spectrum line from row
      g.strokeStyle = C.amb; g.lineWidth = 1.2; g.beginPath();
      for (let x = 0; x < COLS; x++) { const v = d[x * 4 + 1] / 238; const X = x / COLS * W, Y = top - 8 - v * 50; x ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke();
      // scale
      g.font = "500 9px IBM Plex Mono, monospace"; g.fillStyle = C.dim;
      for (let m = 144.0; m <= 146.001; m += .25) { const X = (m - F0) / (F1 - F0) * W; g.fillRect(X, top - 4, 1, 4); if (X > 10 && X < W - 30) g.fillText(m.toFixed(2), X - 14, top + 12); }
      // tuner
      const X = (f - F0) / (F1 - F0) * W, bw = .012 / (F1 - F0) * W;
      g.fillStyle = "#36e2ff22"; g.fillRect(X - bw, 0, bw * 2, H); g.strokeStyle = C.sig; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, H); g.stroke();
      // audio + readout
      const near = sigs.map(s => ({ s, d: Math.abs(s.f - f) })).sort((a, b) => a.d - b.d)[0];
      const str = Math.exp(-((near.d / (near.s.w * 1.6)) ** 2));
      const on = D.audio.on && visible(cv);
      if (on) audioOn();
      if (A) {
        const t = D.audio.ctx.currentTime, k = on ? 1 : 0, L = level(near.s, T) * str;
        A.ng.gain.setTargetAtTime(k * (.05 + (1 - str) * .08), t, .03);
        A.cg.gain.setTargetAtTime(k * (near.s.kind === "cw" ? L * .22 : 0), t, .005);
        A.cw.frequency.setTargetAtTime(700 + (f - near.s.f) * 40000, t, .02);
        A.vg.gain.setTargetAtTime(k * (near.s.kind === "voice" ? L * .12 : 0), t, .02);
        A.vf.frequency.setTargetAtTime(600 + Math.sin(T * 3) * 400 + Math.random() * 300, t, .05);
        A.bg.gain.setTargetAtTime(k * (near.s.kind === "burst" ? L * .06 : 0), t, .005);
        A.bo.frequency.setValueAtTime(Math.random() < .5 ? 1200 : 2200, t);
        A.cog.gain.setTargetAtTime(k * (near.s.kind === "carrier" ? str * .05 : 0), t, .03);
        A.co.frequency.setTargetAtTime(1000 + (f - near.s.f) * 40000, t, .02);
      }
      // morse decode display
      if (near.s.kind === "cw" && str > .5) {
        const m = T % total;
        const sent = chars.filter(([te]) => te <= m).map(([, c]) => c).join("");
        let out = "", ci = 0; for (const ch of MSG.trim()) { if (ch === " ") { if (ci < sent.length) out += " "; continue; } if (ci < sent.length) out += ch; ci++; }
        read.textContent = `▶ ${near.s.name}\nS-meter ${"█".repeat(Math.round(str * 9))}${"░".repeat(9 - Math.round(str * 9))}  S${Math.round(str * 9)}\ndecoded: ${out}${keyAt(T) ? "▮" : ""}`;
      } else if (str > .35) read.textContent = `▶ ${near.s.name}\nS-meter ${"█".repeat(Math.round(str * 9))}${"░".repeat(9 - Math.round(str * 9))}  S${Math.round(str * 9)}\n${D.audio.on ? "listening…" : "(按 S 打开声音来收听)"}`;
      else read.textContent = `tuning… ${f.toFixed(3)} MHz\nnoise floor\n提示：拖动 / 滚轮 / SCAN`;
    });
  }

  /* =========================================================
     §04 WIP · fine-tune loss curves
     ========================================================= */
  function initFT() {
    const cv = $("#ft"), g = ctx2d(cv), read = $("#ftRead");
    const cfg = { 8: { tau: 260, inf: .92, pct: "0.06%", mem: "18 GB" }, 16: { tau: 235, inf: .86, pct: "0.12%", mem: "19 GB" }, 64: { tau: 210, inf: .80, pct: "0.49%", mem: "22 GB" }, 0: { tau: 175, inf: .70, pct: "100%", mem: "4 × 80 GB" } };
    let r = 8, run = null, ghosts = [], W = 0, H = 0;
    $$("#loraTog button").forEach(b => b.addEventListener("click", () => { $$("#loraTog button").forEach(x => x.classList.toggle("on", x === b)); r = +b.dataset.r; }));
    const start = rr => { if (run && run.step < 1000) return; if (run) ghosts.push(run); if (ghosts.length > 3) ghosts.shift(); r = rr; $$("#loraTog button").forEach(x => x.classList.toggle("on", +x.dataset.r === rr)); run = { r, step: 0, tr: [], ev: [], c: cfg[r] }; S.blip(440); };
    let autoQ = [8, 64, 0], userRan = false;
    $("#ftRun").addEventListener("click", () => { userRan = true; start(r); });
    auto(cv, () => { if (!userRan && autoQ.length && (!run || run.step >= 1000)) start(autoQ.shift()); }, 5500);
    const lr = s => s < 60 ? s / 60 : .5 * (1 + Math.cos(Math.PI * (s - 60) / 940));
    const colr = { 8: C.sig, 16: C.ok, 64: C.amb, 0: C.hot };
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const ox = 46, oy = 20, pw = W - ox - 20, ph = H - oy - 40;
      const X = s => ox + s / 1000 * pw, Y = l => oy + (1 - (l - .5) / 2.2) * ph;
      g.strokeStyle = C.line; g.font = "500 9px IBM Plex Mono, monospace"; g.fillStyle = C.dim;
      for (let l = .6; l <= 2.6; l += .4) { g.beginPath(); g.moveTo(ox, Y(l)); g.lineTo(ox + pw, Y(l)); g.stroke(); g.fillText(l.toFixed(1), 10, Y(l) + 3); }
      for (let s = 0; s <= 1000; s += 250) g.fillText(s, X(s) - 8, oy + ph + 16);
      g.fillText("step", ox + pw - 24, oy + ph + 30); g.fillText("loss", 10, oy + 8);
      // lr schedule
      g.strokeStyle = "#ffffff30"; g.setLineDash([3, 4]); g.beginPath(); for (let s = 0; s <= 1000; s += 10) { const y = oy + ph - lr(s) * ph * .35; s ? g.lineTo(X(s), y) : g.moveTo(X(s), y); } g.stroke(); g.setLineDash([]);
      g.fillText("lr (warmup + cosine)", X(70), oy + ph - ph * .35 - 6);
      if (run && run.step < 1000) {
        const n = D.still ? 1000 : Math.max(1, Math.round(dt * 260));
        for (let k = 0; k < n && run.step < 1000; k++) {
          const s = ++run.step, c = run.c, base = c.inf + (2.4 - c.inf) * Math.exp(-s / c.tau);
          run.tr.push(base + (Math.random() - .5) * .14 * (1 - s / 1400));
          if (s % 50 === 0) { const ov = run.r === 0 ? Math.max(0, (s - 550) / 450) * .22 : 0; run.ev.push([s, base + .05 + ov]); S.tone(200 + (2.6 - base) * 300, .05, "triangle", .05); }
        }
        if (run.step >= 1000) S.chord([523, 659, 784], .06, "sine", .06);
      }
      const drawRun = (rn, a) => {
        g.globalAlpha = a; g.strokeStyle = colr[rn.r]; g.lineWidth = 1; g.beginPath(); rn.tr.forEach((l, i) => i ? g.lineTo(X(i + 1), Y(l)) : g.moveTo(X(1), Y(l))); g.stroke();
        g.lineWidth = 2; g.setLineDash([]); g.beginPath(); rn.ev.forEach(([s, l], i) => i ? g.lineTo(X(s), Y(l)) : g.moveTo(X(s), Y(l))); g.stroke();
        rn.ev.forEach(([s, l]) => { g.fillStyle = colr[rn.r]; g.fillRect(X(s) - 2, Y(l) - 2, 4, 4); });
        g.globalAlpha = 1;
      };
      ghosts.forEach(gh => drawRun(gh, .3)); if (run) drawRun(run, 1);
      if (run) {
        const s = run.step, l = run.tr[s - 1] || 2.4, ev = run.ev.length ? run.ev[run.ev.length - 1][1] : NaN;
        read.textContent = `${run.r ? "LoRA r=" + run.r : "full fine-tune"} · trainable ${run.c.pct} · mem ≈ ${run.c.mem}\nstep ${s}/1000 · train ${l.toFixed(3)} · eval ${isNaN(ev) ? "—" : ev.toFixed(3)} · lr ${(lr(s) * 2e-4).toExponential(1)}${run.r === 0 && s > 700 ? "\n⚠ eval loss rising — overfitting?" : ""}`;
      } else if (Math.random() < dt) read.textContent = "idle · 选一个秩，按 TRAIN\n（曲线为示意，不代表真实实验结果）";
    });
  }

  /* =========================================================
     §05 guitar (Karplus–Strong) + piano
     ========================================================= */
  /* =========================================================
     §05 WIP · RK3576 size + BGA fanout
     ========================================================= */
  function initRK() {
    const cv = $("#rkCanvas"), g = ctx2d(cv), read = $("#rkRead"); let W = 0, H = 0, view = "size", t0 = 0;
    let rkUser = false;
    const setView = v => { view = v; t0 = D.T; $$("#rkTog button").forEach(x => x.classList.toggle("on", x.dataset.v === v)); S.blip(v === "size" ? 523 : 784); };
    $$("#rkTog button").forEach(b => b.addEventListener("click", () => { rkUser = true; setView(b.dataset.v); }));
    auto(cv, () => { if (!rkUser) setView(view === "size" ? "fanout" : "size"); }, 6000);
    const dim = (x1, y1, x2, y2, txt, col) => { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.font = "500 10px IBM Plex Mono, monospace"; g.fillText(txt, (x1 + x2) / 2 + 4, (y1 + y2) / 2 - 4); };
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const k = clamp((T - t0) * 1.6, 0, 1), e = 1 - Math.pow(1 - k, 3);
      g.font = "500 10px IBM Plex Mono, monospace";
      if (view === "size") {
        const s = Math.min((W - 60) / 150, (H - 70) / 70), cx = W / 2, cy = H / 2 + 8;
        const ox = cx - 75 * s;
        // credit card ghost
        g.setLineDash([4, 5]); g.strokeStyle = "#ffffff33"; rr(g, ox, cy - 27 * s, 85.6 * s, 54 * s, 3 * s); g.stroke(); g.setLineDash([]);
        g.fillStyle = C.dim2; g.fillText("银行卡 85.6 × 54", ox + 4, cy - 27 * s - 6);
        // AuraCore
        const ax = ox + 4 * s, ay = cy - 15.5 * s;
        g.fillStyle = "#0f3a24"; rr(g, ax, ay, 62 * s * e, 31 * s, 2 * s); g.fill(); g.strokeStyle = C.ok; g.stroke();
        g.fillStyle = "#e6c35c"; g.fillText("AuraCore · H616 · 31 × 62", ax + 6, ay + 14);
        g.fillStyle = "#16181a"; rr(g, ax + 21.4 * s, ay + 3 * s, 14.7 * s, 12.7 * s, 1.5); g.fill();
        // RK3576 board
        const rx = ox + 98 * s, ry = cy - 19 * s, rs = 38 * s;
        g.save(); g.translate(rx + rs / 2, ry + rs / 2); g.scale(.6 + .4 * e, .6 + .4 * e); g.rotate((1 - e) * .5); g.translate(-rs / 2, -rs / 2);
        g.fillStyle = "#13261b"; rr(g, 0, 0, rs, rs, 2.5 * s); g.fill(); g.strokeStyle = C.amb; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = "#16181a"; rr(g, rs * .3, rs * .28, rs * .42, rs * .42, 2); g.fill();
        g.fillStyle = C.amb; g.fillText("SoC", rs * .3 + 5, rs * .28 + 14);
        g.fillStyle = C.sig; g.globalAlpha = .5 + .5 * Math.sin(T * 3); g.fillRect(rs * .3 + 5, rs * .28 + rs * .42 - 12, 34, 6); g.globalAlpha = 1;
        g.restore();
        dim(rx, ry + rs + 12, rx + rs, ry + rs + 12, "38 mm", C.amb); dim(rx + rs + 12, ry, rx + rs + 12, ry + rs, "38", C.amb);
        g.fillStyle = C.amb; g.fillText("RK3576 · 6 TOPS NPU · 6L", rx, ry - 8);
        // coin
        const cxn = ox + 98 * s + 19 * s, cyn = cy + 32 * s;
        read.textContent = `板面积 ${(38 * 38)} mm²，约为 AuraCore 的 ${(38 * 38 / (31 * 62) * 100).toFixed(0)}%\n目标：一张邮票大小的端侧推理节点\n工艺：嘉立创六层免费叠层 + 盘中孔`;
      } else {
        const p = Math.min(W / 22, H / 13), cols = 8, rows = 8, gx = W * .25 - cols * p / 2, gx2 = W * .75 - cols * p / 2, gy = H / 2 - rows * p / 2 + 10;
        g.fillStyle = C.dim; g.fillText("DOG-BONE 狗骨扇出", gx, gy - 14); g.fillStyle = C.amb; g.fillText("VIA-IN-PAD 盘中孔", gx2, gy - 14);
        for (let side = 0; side < 2; side++) {
          const X0 = side ? gx2 : gx;
          for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
            const x = X0 + i * p + p / 2, y = gy + j * p + p / 2, edge = i === 0 || j === 0 || i === cols - 1 || j === rows - 1;
            const idx = (i * 7 + j * 3) % 19 / 19, show = e > idx * .8;
            if (!side) {
              // via between four pads + short neck
              if (i < cols - 1 && j < rows - 1 && !edge && (i + j) % 2 === 0 && show) {
                const vx = x + p / 2, vy = y + p / 2; g.strokeStyle = C.dim; g.lineWidth = p * .14; g.beginPath(); g.moveTo(x, y); g.lineTo(vx, vy); g.stroke();
                g.fillStyle = "#3a3c3a"; g.beginPath(); g.arc(vx, vy, p * .2, 0, 7); g.fill(); g.fillStyle = C.bg; g.beginPath(); g.arc(vx, vy, p * .09, 0, 7); g.fill();
              }
              g.fillStyle = "#c8873a"; g.beginPath(); g.arc(x, y, p * .27, 0, 7); g.fill();
            } else {
              g.fillStyle = "#c8873a"; g.beginPath(); g.arc(x, y, p * .27, 0, 7); g.fill();
              if (!edge && show) { g.fillStyle = C.amb; g.beginPath(); g.arc(x, y, p * .12, 0, 7); g.fill(); }
            }
            if (edge && show) { g.strokeStyle = side ? C.amb : C.dim; g.lineWidth = p * .12; g.beginPath(); g.moveTo(x, y); const ox2 = i === 0 ? -p * .9 : i === cols - 1 ? p * .9 : 0, oy2 = j === 0 ? -p * .9 : j === rows - 1 ? p * .9 : 0; g.lineTo(x + ox2, y + oy2); g.stroke(); }
          }
        }
        read.textContent = `盘中孔：过孔直接打在 BGA 焊盘上，树脂塞孔 + 电镀盖帽\n省掉狗骨占位，细间距 BGA 的内圈也能就地换层\n这是把 RK3576 压进 38 × 38 mm 的关键工艺`;
      }
    });
  }

  /* =========================================================
     §05 WIP · cycloidal reducer
     ========================================================= */
  function initCyc() {
    const cv = $("#cyc"), g = ctx2d(cv), sl = $("#cycRpm"), read = $("#cycRead");
    const N = 12, LOBES = N - 1, HOLES = 6;
    let W = 0, H = 0, th = 0, osc = null, og = null;
    let cTouched = false;
    sl.addEventListener("input", () => { cTouched = true; S.tone(120 + +sl.value * .2, .03, "sine", .03); });
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      if (!cTouched && dt) sl.value = Math.round(1300 + 1100 * Math.sin(T * .35));
      const rpm = +sl.value; th += rpm / 60 * Math.PI * 2 * dt * .12;
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const R = Math.min(W, H) * .36, Rr = R * .075, e = R * .055, cx = W > 600 ? W * .46 : W / 2, cy = H / 2;
      // housing + pins
      g.strokeStyle = "#ffffff1c"; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, R + Rr + 10, 0, 7); g.stroke();
      for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2; g.fillStyle = "#3a3c3a"; g.beginPath(); g.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, Rr, 0, 7); g.fill(); g.strokeStyle = C.dim; g.lineWidth = 1; g.stroke(); }
      // cycloid disk (epitrochoid), centre orbits by e, spins backwards by th/LOBES
      const dcx = cx + e * Math.cos(th), dcy = cy + e * Math.sin(th), rot = -th / LOBES;
      g.save(); g.translate(dcx, dcy); g.rotate(rot);
      g.beginPath();
      for (let i = 0; i <= 720; i++) {
        const t = i / 720 * Math.PI * 2;
        const psi = Math.atan2(Math.sin((1 - N) * t), R / (e * N) - Math.cos((1 - N) * t));
        const x = R * Math.cos(t) - Rr * Math.cos(t + psi) - e * Math.cos(N * t);
        const y = -R * Math.sin(t) + Rr * Math.sin(t + psi) + e * Math.sin(N * t);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.fillStyle = "#ffb21a22"; g.fill(); g.strokeStyle = C.amb; g.lineWidth = 1.6; g.stroke();
      const hr = R * .12, pr = R * .42;
      for (let k = 0; k < HOLES; k++) { const a = k / HOLES * Math.PI * 2; g.fillStyle = C.bg; g.beginPath(); g.arc(Math.cos(a) * pr, Math.sin(a) * pr, hr, 0, 7); g.fill(); g.strokeStyle = C.amb; g.stroke(); }
      g.fillStyle = C.bg; g.beginPath(); g.arc(0, 0, R * .16, 0, 7); g.fill(); g.strokeStyle = C.amb; g.stroke();
      g.restore();
      // output pins (rotate with output, about housing centre)
      for (let k = 0; k < HOLES; k++) { const a = k / HOLES * Math.PI * 2 + rot; g.fillStyle = C.sig; g.beginPath(); g.arc(cx + Math.cos(a) * pr, cy + Math.sin(a) * pr, hr - e, 0, 7); g.fill(); }
      // eccentric input
      g.fillStyle = C.hot; g.beginPath(); g.arc(dcx, dcy, R * .07, 0, 7); g.fill();
      g.strokeStyle = C.hot; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(dcx, dcy); g.stroke();
      // indicators
      const ix = W * .82, iy1 = H * .32, iy2 = H * .68, ir = Math.min(W, H) * .08;
      if (W > 600) [[iy1, th, C.hot, "INPUT"], [iy2, rot, C.sig, "OUTPUT"]].forEach(([y, a, c, n]) => { g.strokeStyle = "#ffffff22"; g.lineWidth = 1; g.beginPath(); g.arc(ix, y, ir, 0, 7); g.stroke(); g.strokeStyle = c; g.lineWidth = 2.5; g.beginPath(); g.moveTo(ix, y); g.lineTo(ix + Math.cos(a) * ir, y + Math.sin(a) * ir); g.stroke(); g.fillStyle = c; g.font = "500 10px IBM Plex Mono, monospace"; g.fillText(n, ix - ir, y + ir + 14); });
      read.textContent = `${N} 针 / ${LOBES} 齿 → 减速比 ${LOBES}:1（示意）\n输入 ${rpm} rpm → 输出 ${(rpm / LOBES).toFixed(1)} rpm，反向\n理想扭矩 × ${LOBES}，多齿同时啮合，抗冲击`;
      // motor whine
      const a = D.audio;
      if (a.on && a.ctx) {
        if (!osc) { osc = a.ctx.createOscillator(); osc.type = "sawtooth"; og = a.ctx.createGain(); og.gain.value = 0; const f = a.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900; osc.connect(f); f.connect(og); og.connect(a.master); osc.start(); }
        osc.frequency.setTargetAtTime(40 + rpm * .18, a.ctx.currentTime, .05);
        og.gain.setTargetAtTime(visible(cv) && rpm > 0 && dt > 0 ? .025 : 0, a.ctx.currentTime, .05);
      } else if (og) og.gain.value = 0;
    });
  }

  /* =========================================================
     §06 archive reels
     ========================================================= */
  function initArchive() {
    // inline, muted, looping; sources are fetched into blob: URLs so there is no plain .mp4 link to save,
    // and every built-in save path (context menu, controls, PiP, cast, drag, long-press) is switched off
    const load = async v => {
      if (v.dataset.loaded) return; v.dataset.loaded = 1;
      try { const r = await fetch(v.dataset.src); v.src = URL.createObjectURL(await r.blob()); }
      catch { v.src = v.dataset.src; }
      if (v.dataset.want === "1" && !D.still) v.play().catch(() => {});
    };
    const vio = new IntersectionObserver(es => es.forEach(en => {
      const v = en.target, fig = v.parentElement;
      if (en.isIntersecting) { v.dataset.want = fig.classList.contains("paused") ? "0" : "1"; load(v); if (v.src && v.dataset.want === "1" && !D.still) v.play().catch(() => {}); }
      else { v.dataset.want = "0"; v.pause(); }
    }), { rootMargin: "150px" });
    $$(".clip").forEach(fig => {
      const n = fig.dataset.v;
      const v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none"; v.poster = `assets/video/${n}.jpg`; v.dataset.src = `assets/video/${n}.mp4`;
      v.disablePictureInPicture = true; v.disableRemotePlayback = true;
      v.setAttribute("controlslist", "nodownload nofullscreen noremoteplayback noplaybackrate");
      v.setAttribute("aria-label", n); v.setAttribute("draggable", "false");
      fig.appendChild(v);
      fig.insertAdjacentHTML("beforeend", `<div class="shield" data-cursor="pause"></div><span class="rec">${n.toUpperCase()}</span><span class="wm">dreaming66</span><span class="bar"><i></i></span>`);
      const bar = fig.querySelector(".bar i"), shield = fig.querySelector(".shield");
      v.addEventListener("timeupdate", () => { if (v.duration) bar.style.width = (v.currentTime / v.duration * 100) + "%"; });
      shield.addEventListener("click", () => {
        const p = !fig.classList.contains("paused"); fig.classList.toggle("paused", p); shield.dataset.cursor = p ? "play" : "pause";
        if (p) v.pause(); else { load(v); v.play().catch(() => {}); }
        S.blip(p ? 330 : 660);
      });
      vio.observe(v);
    });
    // no context menu / drag on media
    document.addEventListener("contextmenu", e => { if (e.target.closest(".clip, .photos, video")) e.preventDefault(); });
    document.addEventListener("dragstart", e => { if (e.target.closest(".clip, .photos, video, img")) e.preventDefault(); });
  }

  /* =========================================================
     §07 electric guitar (Karplus–Strong → drive → cab)
     ========================================================= */
  function initGuitar() {
    const cv = $("#guitar"), g = ctx2d(cv);
    const OPEN = [82.41, 110, 146.83, 196, 246.94, 329.63]; // E2 A2 D3 G3 B3 E4 · standard tuning
    const CHORDS = { E5: [0, 2, 2, -1, -1, -1], A5: [-1, 0, 2, 2, -1, -1], D5: [-1, -1, 0, 2, 3, -1], G5: [3, 5, 5, -1, -1, -1], C5: [-1, 3, 5, 5, -1, -1], Em: [0, 2, 2, 0, 0, 0], C: [-1, 3, 2, 0, 1, 0], G: [3, 2, 0, 0, 0, 3], D: [-1, -1, 0, 2, 3, 2], Am: [-1, 0, 2, 2, 1, 0], F: [1, 3, 3, 2, 1, 1] };
    let chord = "E5", drive = true, W = 0, H = 0, amp = Array(6).fill(0), last = null;
    const box = $("#chords");
    const setChord = k => { chord = k; $$("button", box).forEach(x => x.classList.toggle("on", x.textContent === k)); };
    Object.keys(CHORDS).forEach(k => { const b = document.createElement("button"); b.textContent = k; b.addEventListener("click", () => { setChord(k); strum(true); }); box.appendChild(b); });
    setChord(chord);
    $$("#ampTog button").forEach(b => b.addEventListener("click", () => { $$("#ampTog button").forEach(x => x.classList.toggle("on", x === b)); drive = b.dataset.a === "1"; strum(true); }));
    const sy = i => H * .2 + (5 - i) * (H * .6 / 5);
    const pluck = (i, v = .3, fr = CHORDS[chord][i]) => { if (fr < 0) { S.noise(.03, 800, 2, .04); return; } S.pluck(OPEN[i] * Math.pow(2, fr / 12), drive ? v * .8 : v, drive ? .75 : .55, drive); amp[i] = 1; };
    const strum = (down = true) => { [0, 1, 2, 3, 4, 5].forEach((i, k) => setTimeout(() => pluck(down ? i : 5 - i, .26), k * (drive ? 10 : 18))); };
    cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(), y = e.clientY - r.top; last = y; let best = -1, bd = 14; for (let i = 0; i < 6; i++) { const d = Math.abs(sy(i) - y); if (d < bd) { bd = d; best = i; } } if (best >= 0) pluck(best); });
    cv.addEventListener("pointermove", e => { if (last == null) return; const r = cv.getBoundingClientRect(), y = e.clientY - r.top; for (let i = 0; i < 6; i++) { const s = sy(i); if ((last - s) * (y - s) < 0) pluck(i, .25); } last = y; });
    cv.addEventListener("pointerup", () => last = null);
    // an original riff: Em–C–G–D, palm-muted root pulses + 8th-note arpeggio on top, then a power-chord tag
    const riff = () => {
      const bar = [["Em", 0], ["C", 1], ["G", 0], ["D", 2]], step = .17, pat = [-1, 3, 4, 5, 4, 3, 4, 5];
      let t = 0;
      bar.forEach(([c, root]) => {
        pat.forEach((sIdx, k) => {
          setTimeout(() => { setChord(c); const st = sIdx < 0 ? (CHORDS[c][0] >= 0 ? 0 : CHORDS[c][1] >= 0 ? 1 : 2) : sIdx; pluck(st, sIdx < 0 ? .34 : .22); }, (t + k * step) * 1000);
        });
        t += pat.length * step;
      });
      [["E5", 0], ["G5", 2], ["A5", 3], ["C5", 4.5], ["D5", 5.5], ["E5", 6.5]].forEach(([c, b]) => setTimeout(() => { setChord(c); strum(true); }, (t + b * step) * 1000));
      if (!riff.auto) $("#music").scrollIntoView({ behavior: "smooth", block: "start" });
      riff.auto = false;
      setTimeout(() => document.dispatchEvent(new Event("d66twinkle")), (t + 8 * step) * 1000);
    };
    $("#riffBtn").addEventListener("click", riff);
    document.addEventListener("d66riff", riff);
    D.onVisible(cv, () => setTimeout(() => { riff.auto = true; riff(); }, 700), .45);
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const nx0 = 30, nx1 = W * (W < 600 ? .9 : .7), top = H * .14, bot = H * .86;
      // body + pickups (electric)
      if (W >= 600) {
        g.fillStyle = drive ? "#2a0d08" : "#1c140c"; g.beginPath(); g.ellipse(W * .9, H / 2, W * .16, H * .48, 0, 0, 7); g.fill();
        [W * .8, W * .88].forEach(x => { g.fillStyle = "#0d0d0d"; rr(g, x - 14, H * .2, 28, H * .6, 6); g.fill(); g.strokeStyle = "#555"; g.stroke(); for (let i = 0; i < 6; i++) { g.fillStyle = "#9a9a9a"; g.beginPath(); g.arc(x, sy(i), 3, 0, 7); g.fill(); } });
      }
      g.fillStyle = "#2a1a0e"; g.fillRect(nx0, top, nx1 - nx0, bot - top);
      const fx = n => nx0 + (nx1 - nx0) * (1 - Math.pow(2, -n / 12)) / (1 - Math.pow(2, -12 / 12));
      for (let n = 0; n <= 12; n++) { g.fillStyle = n === 0 ? "#e8e4d8" : "#9a958a"; g.fillRect(fx(n) - (n ? 1 : 3), top, n ? 2 : 6, bot - top); }
      [3, 5, 7, 9].forEach(n => { g.fillStyle = "#e8e4d822"; g.beginPath(); g.arc((fx(n - 1) + fx(n)) / 2, (top + bot) / 2, 6, 0, 7); g.fill(); });
      [-1, 1].forEach(sg => { g.fillStyle = "#e8e4d822"; g.beginPath(); g.arc((fx(11) + fx(12)) / 2, (top + bot) / 2 + sg * 24, 6, 0, 7); g.fill(); });
      for (let i = 0; i < 6; i++) {
        const y = sy(i), a = amp[i]; amp[i] *= Math.pow(drive ? .3 : .18, dt);
        g.strokeStyle = i < 3 ? "#d8c39a" : "#e8e4d8"; g.lineWidth = 2.6 - i * .32;
        g.beginPath();
        for (let x = nx0; x <= W - 10; x += 6) { const k = (x - nx0) / (W - 10 - nx0); const off = a * Math.sin(k * Math.PI) * Math.sin(T * (60 + i * 14) + k * 4) * (drive ? 8 : 6); x === nx0 ? g.moveTo(x, y + off) : g.lineTo(x, y + off); }
        g.stroke();
        const fr = CHORDS[chord][i];
        g.font = "600 11px IBM Plex Mono, monospace";
        if (fr < 0) { g.fillStyle = C.hot; g.fillText("×", 12, y + 4); }
        else if (fr === 0) { g.strokeStyle = C.ok; g.lineWidth = 1.5; g.beginPath(); g.arc(16, y, 5, 0, 7); g.stroke(); }
        else { g.fillStyle = C.amb; g.shadowColor = C.amb; g.shadowBlur = a * 20; g.beginPath(); g.arc((fx(fr - 1) + fx(fr)) / 2, y, 8, 0, 7); g.fill(); g.shadowBlur = 0; }
      }
      g.fillStyle = drive ? C.hot : C.dim; g.font = "500 10px IBM Plex Mono, monospace";
      g.fillText(`${chord} · standard EADGBE · ${drive ? "DRIVE: waveshaper → mid boost → cab sim" : "CLEAN"} · Karplus-Strong`, nx0, H - 10);
    });
  }

  function initPiano() {
    const el = $("#piano"), keys = [];
    const map = "awsedftgyhujkolp;'".split("");
    const start = 60; // C4
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let wi = 0;
    for (let n = start; n < start + 25; n++) {
      const black = [1, 3, 6, 8, 10].includes(n % 12);
      const k = document.createElement("div"); k.className = black ? "bk" : "wk"; k.dataset.n = n;
      const kb = map[n - start]; k.innerHTML = `<span class="lbl">${kb ? kb.toUpperCase() : ""}${!black && n % 12 === 0 ? "<br>C" + (n / 12 - 1) : ""}</span>`;
      if (black) k.style.left = `calc(${wi} * (100% / 15))`; else wi++;
      el.appendChild(k); keys.push(k);
    }
    const hz = n => 440 * Math.pow(2, (n - 69) / 12);
    const seq = []; const twinkle = [60, 60, 67, 67, 69, 69, 67];
    const press = n => {
      const k = keys[n - start]; if (!k) return;
      S.piano(hz(n)); k.classList.add("dn"); setTimeout(() => k.classList.remove("dn"), 180);
      seq.push(n); if (seq.length > 7) seq.shift();
      if (seq.join() === twinkle.join()) { D.print && D.print(`<span class="p">★</span> 小星星解锁 · keep practicing!`); S.chord([1047, 1319, 1568, 2093], .05, "sine", .06); el.animate([{ filter: "drop-shadow(0 0 0 #ffb21a)" }, { filter: "drop-shadow(0 0 30px #ffb21a)" }, { filter: "none" }], 1200); }
    };
    // after the riff: play the opening of Twinkle Twinkle (traditional) once
    let twinkled = false;
    document.addEventListener("d66twinkle", () => {
      if (twinkled || !visible(el)) return; twinkled = true;
      [60, 60, 67, 67, 69, 69, 67].forEach((n, i) => setTimeout(() => press(n), i * 420 + (i === 6 ? 120 : 0)));
    });
    let dn = false;
    el.addEventListener("pointerdown", e => { const k = e.target.closest(".wk,.bk"); if (k) { dn = true; press(+k.dataset.n); } });
    el.addEventListener("pointerover", e => { if (!dn) return; const k = e.target.closest(".wk,.bk"); if (k) press(+k.dataset.n); });
    addEventListener("pointerup", () => dn = false);
    const mus = $("#music"); let inView = false;
    new IntersectionObserver(es => { inView = es[0].isIntersecting; D.pianoFocus = inView; }, { threshold: .25 }).observe(mus);
    const held = new Set();
    addEventListener("keydown", e => {
      if (!inView || e.target.matches("input") || e.metaKey || e.ctrlKey) return;
      const i = map.indexOf(e.key.toLowerCase()); if (i < 0 || held.has(i)) return; held.add(i); press(start + i);
    });
    addEventListener("keyup", e => held.delete(map.indexOf(e.key.toLowerCase())));
  }

  /* =========================================================
     §06 / §07 log, github, ping, scope
     ========================================================= */
  function initLog() {
    $$(".cm-h").forEach(b => b.addEventListener("click", () => { const li = b.parentElement; li.classList.toggle("open"); S.whoosh(li.classList.contains("open")); }));
    D.onVisible($("#ghLive"), async () => {
      const el = $("#ghLive");
      try {
        const r = await fetch("https://api.github.com/users/dreaming66"); if (!r.ok) throw 0; const j = await r.json();
        el.textContent = `public_repos: ${j.public_repos} · followers: ${j.followers} · since ${String(j.created_at).slice(0, 10)}`;
      } catch { el.textContent = "rate-limited · 去 github.com/dreaming66 看看"; }
    });
  }

  function initPing() {
    const cv = $("#sonar"), g = ctx2d(cv), log = $("#pinglog"); let seq = 0, blips = [], W = 0;
    const ping = () => {
      S.ping(); const ms = rand(28, 62);
      const a = rand(0, Math.PI * 2), d = rand(.3, .9); blips.push({ a, d, life: 1 });
      setTimeout(() => { log.textContent += `\n64 bytes from github.com: icmp_seq=${seq++} ttl=56 time=${ms.toFixed(1)} ms`; log.scrollTop = log.scrollHeight; }, ms * 6);
    };
    $("#pingBtn").addEventListener("click", ping);
    auto(cv, ping, 6000, .4);
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) W = cv.width / DPR;
      const R = W / 2 - 10; g.setTransform(DPR, 0, 0, DPR, W / 2 * DPR, W / 2 * DPR); g.clearRect(-W / 2, -W / 2, W, W);
      g.strokeStyle = "#a4ff5e33"; g.lineWidth = 1; for (let i = 1; i <= 4; i++) { g.beginPath(); g.arc(0, 0, R * i / 4, 0, 7); g.stroke(); }
      g.beginPath(); g.moveTo(-R, 0); g.lineTo(R, 0); g.moveTo(0, -R); g.lineTo(0, R); g.stroke();
      const a = T * 1.6; const gr = g.createConicGradient ? g.createConicGradient(a - .8, 0, 0) : null;
      if (gr) { gr.addColorStop(0, "transparent"); gr.addColorStop(.12, "#a4ff5e55"); gr.addColorStop(.1201, "transparent"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill(); }
      g.strokeStyle = C.ok; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R, Math.sin(a) * R); g.stroke();
      for (let i = blips.length - 1; i >= 0; i--) { const b = blips[i]; b.life -= dt * .25; if (b.life <= 0) { blips.splice(i, 1); continue; } g.fillStyle = `rgba(255,178,26,${b.life})`; g.beginPath(); g.arc(Math.cos(b.a) * R * b.d, Math.sin(b.a) * R * b.d, 4 + (1 - b.life) * 10, 0, 7); g.fill(); }
      g.fillStyle = C.ok; g.font = "500 9px IBM Plex Mono, monospace"; g.fillText("DE BH3FWY", -R + 8, R - 8);
    });
  }

  function initScope() {
    const cv = $("#scope"), g = ctx2d(cv); let W = 0, H = 0, buf = null;
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = "rgba(10,11,10,.35)"; g.fillRect(0, 0, W, H);
      const a = D.audio; g.strokeStyle = C.ok; g.lineWidth = 1.5; g.shadowColor = C.ok; g.shadowBlur = 8; g.beginPath();
      if (a.analyser && a.on) {
        if (!buf) buf = new Float32Array(a.analyser.fftSize); a.analyser.getFloatTimeDomainData(buf);
        for (let i = 0; i < buf.length; i += 2) { const x = i / buf.length * W, y = H / 2 + buf[i] * H * 1.6; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      } else for (let x = 0; x <= W; x += 4) { const y = H / 2 + Math.sin(x * .05 + T * 4) * 2 + (Math.random() - .5) * 1.5; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); g.shadowBlur = 0;
      g.fillStyle = C.dim2; g.font = "500 9px IBM Plex Mono, monospace"; g.fillText(a.on ? "CH1 · master bus · live" : "CH1 · no signal (sound off)", 12, 14);
    });
  }

  /* ---------------- boot ---------------- */
  initInk(); initCard(); initGen(); initPCB(); initMCU(); initRack();
  initPD(); initNPU(); initMCP(); initGraph();
  initRK(); initRobot(); initCyc(); initSDR(); initFT(); initArchive();
  initGuitar(); initPiano(); initLog(); initPing(); initScope();
  D.boot();
})();
