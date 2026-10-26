/* ==========================================================
   dreaming66 — Inference Atelier
   Hand-written. No frameworks. Every pixel on purpose.
   ========================================================== */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C = { paper: "#f1ede3", paper2: "#e8e2d4", ink: "#141412", ink2: "#3b3a35", muted: "#7d7a70", ver: "#ff4f1f", cob: "#2747ff", moss: "#2f7d5b", sun: "#f2c230" };

  let still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- central RAF + visibility ---------------- */
  const loops = [];
  const io = new IntersectionObserver(es => es.forEach(e => { const l = loops.find(l => l.el === e.target); if (l) l.vis = e.isIntersecting; }), { rootMargin: "120px" });
  function addLoop(el, tick) { const l = { el, tick, vis: false }; loops.push(l); io.observe(el); return l; }

  function fitCanvas(cv, scale = 1) {
    const r = cv.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * DPR * scale)), h = Math.max(1, Math.round(r.height * DPR * scale));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; return true; }
    return false;
  }

  let last = performance.now(), fpsAcc = 0, fpsN = 0, T = 0;
  const fpsEl = $("#fps");
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!still) T += dt;
    fpsAcc += dt; fpsN++;
    if (fpsAcc > .5) { fpsEl.textContent = Math.round(fpsN / fpsAcc) + " fps"; fpsAcc = 0; fpsN = 0; }
    for (const l of loops) if (l.vis) l.tick(still ? 0 : dt, T);
    requestAnimationFrame(frame);
  }

  /* ---------------- loader ---------------- */
  const bootLines = [
    ["[  0.000] atelier kernel 6.6.6-dreaming66 booting", ""],
    ["[  0.031] probing accelerators ............ ", "ok", "96 × NPU"],
    ["[  0.074] hccl: building ring topology .... ", "ok", "8 hops"],
    ["[  0.112] mooncake: kv-cache pool mounted . ", "ok", ""],
    ["[  0.158] loading weights (w8a8) .......... ", "ok", ""],
    ["[  0.201] mcp-gateway: tools registered ... ", "ok", ""],
    ["[  0.236] privacy filter: phone/email ..... ", "warn", "REDACTED"],
    ["[  0.270] warmup prefill / decode ......... ", "ok", ""],
  ];
  function runLoader() {
    const boot = $("#boot"), bar = $("#loaderBar"), loader = $("#loader");
    document.body.classList.add("loading");
    let i = 0;
    const step = () => {
      if (i < bootLines.length) {
        const [a, st, extra] = bootLines[i];
        boot.innerHTML += a + (st ? `[<span class="${st}">${st === "ok" ? " OK " : "WARN"}</span>] ${extra || ""}` : "") + "\n";
        bar.style.width = ((i + 1) / bootLines.length * 100) + "%";
        i++; setTimeout(step, still ? 0 : rand(70, 160));
      } else {
        setTimeout(() => {
          loader.classList.add("done");
          document.body.classList.remove("loading");
          document.body.classList.add("ready");
          setTimeout(() => loader.remove(), 1200);
        }, still ? 0 : 380);
      }
    };
    step();
  }

  /* ---------------- split letters ---------------- */
  $$(".split").forEach((el, k) => {
    const t = el.dataset.text || el.textContent;
    el.textContent = "";
    [...t].forEach((c, i) => {
      const s = document.createElement("span"); s.className = "ch"; s.textContent = c;
      s.style.transitionDelay = (0.25 + k * .12 + i * .045) + "s";
      el.appendChild(s);
    });
  });
  // clear the entrance delay once in, so hover feels instant
  setTimeout(() => $$(".split .ch").forEach(s => s.style.transitionDelay = "0s"), 3600);

  /* ---------------- cursor + magnetic ---------------- */
  const cur = $(".cursor"), dot = $(".c-dot"), ring = $(".c-ring"), label = $(".c-label");
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  if (fine) {
    document.body.classList.add("has-cursor");
    addEventListener("pointerdown", () => cur.classList.add("down"));
    addEventListener("pointerup", () => cur.classList.remove("down"));
    document.addEventListener("pointerover", e => {
      const t = e.target.closest("a,button,input,[data-cursor],canvas");
      cur.classList.toggle("hover", !!t && !(t.tagName === "CANVAS" && !t.dataset.cursor) && t.tagName !== "INPUT");
      label.textContent = t ? (t.dataset.cursor || (t.tagName === "A" ? "open" : t.tagName === "BUTTON" ? "click" : "")) : "";
    });
    (function cursorLoop() {
      rx = lerp(rx, mx, .18); ry = lerp(ry, my, .18);
      dot.style.transform = `translate(${mx}px,${my}px)`;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(cursorLoop);
    })();
    $$(".magnetic").forEach(el => {
      el.addEventListener("pointermove", e => {
        if (still) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * .25}px,${dy * .35}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transition = "transform .6s cubic-bezier(.23,1,.32,1)"; el.style.transform = ""; setTimeout(() => el.style.transition = "", 600); });
    });
  }

  /* ---------------- header bits ---------------- */
  const clock = $("#clock");
  const tickClock = () => { clock.textContent = "BJT " + new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Shanghai", hour12: false }); };
  tickClock(); setInterval(tickClock, 1000);

  const menuBtn = $("#menuBtn"), menu = $("#menu");
  const setMenu = open => { document.body.classList.toggle("menu-open", open); menu.setAttribute("aria-hidden", !open); menuBtn.setAttribute("aria-expanded", open); };
  menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$(".menu a").forEach(a => a.addEventListener("click", () => setMenu(false)));

  const motionBtn = $("#motionBtn");
  const setStill = v => { still = v; document.body.classList.toggle("still", v); motionBtn.setAttribute("aria-pressed", v); motionBtn.textContent = v ? "▶" : "Ⅱ"; motionBtn.setAttribute("aria-label", v ? "恢复动态效果" : "暂停动态效果"); };
  motionBtn.addEventListener("click", () => setStill(!still));
  setStill(still);

  /* ---------------- scroll-driven stuff ---------------- */
  const progress = $("#progress"), mfText = $("#mfText"), workSec = $("#work"), workTrack = $("#workTrack"), workPin = $(".work-pin");
  const stackRows = $$(".stack-row");

  // manifesto words
  (() => {
    const text = mfText.textContent.trim();
    const keys = ["AllReduce", "更快、更稳、更省", "每一毫秒"];
    const ranges = keys.map(k => { const i = text.indexOf(k); return [i, i + k.length]; });
    mfText.textContent = "";
    let idx = 0;
    for (const tok of text.match(/[A-Za-z0-9]+|./gu)) {
      const s = document.createElement("span"); s.className = "w"; s.textContent = tok;
      if (ranges.some(([a, b]) => idx >= a && idx < b)) s.classList.add("key");
      mfText.appendChild(s); idx += tok.length;
    }
  })();
  const words = $$(".w", mfText);

  function onScroll() {
    const sy = scrollY, vh = innerHeight, H = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${H > 0 ? sy / H : 0})`;

    const r = mfText.getBoundingClientRect();
    const p = clamp((vh * .82 - r.top) / (r.height + vh * .25), 0, 1);
    const n = Math.floor(p * words.length * 1.05);
    words.forEach((w, i) => w.classList.toggle("on", i < n));

    if (getComputedStyle(workPin).position === "sticky") {
      const wr = workSec.getBoundingClientRect();
      const wp = clamp(-wr.top / (wr.height - vh), 0, 1);
      const max = workTrack.scrollWidth - innerWidth;
      workTrack.style.transform = `translate3d(${-max * easeIO(wp)}px,0,0)`;
    } else workTrack.style.transform = "";

    stackRows.forEach(row => {
      const rr = row.getBoundingClientRect();
      const d = +row.dataset.dir;
      const off = (rr.top - vh) * .45 * d;
      row.style.transform = `translate3d(${d > 0 ? off - 200 : off - row.scrollWidth * .35}px,0,0)`;
    });

    if (!morphTouched) morphState.target = clamp((vh - morphSec.getBoundingClientRect().top) / (vh + morphSec.offsetHeight), 0, 1) * 3;
  }

  /* ---------------- reveals, counters, scramble ---------------- */
  const glyphs = "▚▞▙▟░▒▓#%&@$01ΣΔ∇λ";
  function scramble(el) {
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    if (still) { el.textContent = final; return; }
    let f = 0; const total = 26;
    const run = () => {
      el.textContent = [...final].map((c, i) => (i / final.length < f / total) || c === " " ? c : glyphs[(Math.random() * glyphs.length) | 0]).join("");
      if (++f <= total) requestAnimationFrame(run); else el.textContent = final;
    };
    run();
  }
  function count(el) {
    const to = +el.dataset.to, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const t0 = performance.now(), dur = still ? 1 : 1800;
    const run = now => {
      const k = clamp((now - t0) / dur, 0, 1), v = Math.round(to * (1 - Math.pow(2, -10 * k)));
      el.textContent = pre + (k >= 1 ? to : v) + suf;
      if (k < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const t = e.target;
    if (t.matches("[data-exp]")) { t.classList.add("in"); const h = $("h3", t); if (h) scramble(h); }
    if (t.matches(".count")) count(t);
    if (t.matches(".scramble")) scramble(t);
    rio.unobserve(t);
  }), { threshold: .25 });
  $$("[data-exp], .count, .scramble").forEach(el => rio.observe(el));

  /* =========================================================
     HERO · topographic ink field (WebGL2)
     ========================================================= */
  function initInk() {
    const cv = $("#ink");
    const gl = cv.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
    if (!gl) { cv.style.background = "radial-gradient(circle at 70% 30%, #ff4f1f22, transparent 50%)"; return; }
    const vs = `#version 300 es
    in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
    const fs = `#version 300 es
    precision highp float;
    uniform vec2 R; uniform float T; uniform vec2 M; uniform vec4 D[6];
    out vec4 o;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+1.),f.x), f.y); }
    float fbm(vec2 p){ float v=0., a=.5; mat2 r=mat2(.8,.6,-.6,.8);
      for(int i=0;i<5;i++){ v+=a*n(p); p=r*p*2.03; a*=.5; } return v; }
    void main(){
      vec2 p = (gl_FragCoord.xy - .5*R) / R.y;
      vec2 m = (M - .5*R) / R.y;
      float t = T * .05;
      float dm = length(p - m);
      // ink drops: expanding ripples that bend the field
      float rip = 0., wet = 0.;
      for (int i = 0; i < 6; i++) {
        float age = T - D[i].z;
        if (D[i].w > 0. && age > 0. && age < 7.) {
          vec2 c = (D[i].xy - .5*R) / R.y; float d = length(p - c);
          float front = age * .32;
          rip += sin((d - front) * 34.) * exp(-abs(d - front) * 9.) * exp(-age * .55);
          wet += smoothstep(front, front - .05, d) * exp(-age * .5) * smoothstep(.0, .25, age);
        }
      }
      vec2 q = p * 1.25;
      q += (p - m) * .35 * exp(-dm * 3.5);               // lens around the cursor
      vec2 a = vec2(fbm(q + vec2(t, -t*.4)), fbm(q + vec2(5.2, 1.3) - t*.7));
      vec2 b = vec2(fbm(q + 2.4*a + vec2(1.7, 9.2) + t*.3), fbm(q + 2.4*a + vec2(8.3, 2.8)));
      float f = fbm(q + 2.2*b) + rip * .045;
      float bands = f * 22.;
      float w = fwidth(bands);
      float line = 1. - smoothstep(w * .3, w * 1.2, .5 - abs(fract(bands) - .5));
      float major = 1. - smoothstep(w * .8, w * 2.2, 2.5 - abs(fract(bands / 5.) - .5) * 5.);
      vec3 paper = vec3(.945, .929, .89);
      vec3 ink = vec3(.078, .078, .07);
      vec3 ver = vec3(1., .31, .12);
      vec3 cob = vec3(.15, .28, 1.);
      vec3 col = paper;
      // soft washes in the valleys / peaks
      col = mix(col, vec3(.91, .885, .83), smoothstep(.45, .75, f) * .7);
      col = mix(col, ver, smoothstep(.62, .78, b.x) * .10);
      col = mix(col, cob, smoothstep(.70, .85, a.y) * .06);
      float near = exp(-dm * 4.);
      vec3 lc = mix(ink, ver, clamp(near * 1.4 + wet * .8, 0., 1.));
      col = mix(col, lc, line * (.20 + near * .45) + major * .28);
      col = mix(col, ver, wet * .10);
      // fade toward the bottom so type stays legible
      float fade = smoothstep(-.55, .35, p.y);
      col = mix(paper, col, .35 + .65 * fade);
      o = vec4(col, 1.);
    }`;
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(x)); return x; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, "R"), uT = gl.getUniformLocation(pr, "T"), uM = gl.getUniformLocation(pr, "M"), uD = gl.getUniformLocation(pr, "D");
    const drops = new Float32Array(24); let di = 0;
    const SC = .6; // render scale for perf
    let pmx = 0, pmy = 0;
    const drop = (x, y, s = 1) => {
      const r = cv.getBoundingClientRect(); const k = cv.width / r.width;
      drops.set([(x - r.left) * k, (r.bottom - y) * k, T, s], (di++ % 6) * 4);
    };
    cv.parentElement.addEventListener("pointerdown", e => { if (!e.target.closest("a,button")) drop(e.clientX, e.clientY); });
    setTimeout(() => drop(innerWidth * .68, innerHeight * .36), 1500);
    addLoop(cv, (dt, t) => {
      fitCanvas(cv, SC);
      gl.viewport(0, 0, cv.width, cv.height);
      const r = cv.getBoundingClientRect(); const k = cv.width / r.width;
      pmx = lerp(pmx, (mx - r.left) * k, .08); pmy = lerp(pmy, (r.bottom - my) * k, .08);
      gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, t); gl.uniform2f(uM, pmx, pmy); gl.uniform4fv(uD, drops);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  }

  /* =========================================================
     EXP.01 · Prefill / Decode disaggregation simulator
     ========================================================= */
  function initPD() {
    const cv = $("#pdCanvas"), g = cv.getContext("2d");
    const load = $("#pdLoad");
    const out = { ttft: $("#mTTFT"), tpot: $("#mTPOT"), jit: $("#mJit"), tps: $("#mTPS") };
    const CHARS = "推理是把概率变成语言的过程每个词元都值得被认真对待的大模型token";
    const PF = .75, STEP = .055;
    let mode = "disagg", W = 0, H = 0, simT = 0, spawnAcc = 0, rr = 0;
    let nodes = [], reqs = [], packets = [], toks = [];
    const intervals = [], ttfts = []; let tokCount = 0, tokWin = [];

    $$(".exp-pd .seg button").forEach(b => b.addEventListener("click", () => {
      $$(".exp-pd .seg button").forEach(x => x.classList.toggle("on", x === b)); mode = b.dataset.mode; build();
    }));

    function build() {
      reqs = []; packets = []; toks = []; intervals.length = 0; ttfts.length = 0; tokWin = [];
      nodes = [];
      if (mode === "disagg") {
        for (let i = 0; i < 3; i++) nodes.push({ kind: "P", fx: .28, fy: (i + 1) / 4, queue: [], cur: null, prog: 0, seqs: [], tick: 0, name: "P" + i });
        for (let i = 0; i < 4; i++) nodes.push({ kind: "D", fx: .74, fy: (i + 1) / 5, queue: [], cur: null, prog: 0, seqs: [], tick: 0, name: "D" + i });
      } else {
        for (let i = 0; i < 4; i++) nodes.push({ kind: "M", fx: .5, fy: (i + 1) / 5, queue: [], cur: null, prog: 0, seqs: [], tick: 0, name: "N" + i });
      }
      layout();
    }
    function layout() { for (const n of nodes) { n.x = n.fx * W; n.y = n.fy * H; } }
    const pool = () => ({ x: W * .51, y: H * .5 });

    function emit(n, seq) {
      const now = simT;
      if (seq.first == null) { seq.first = now; ttfts.push(now - seq.born); if (ttfts.length > 60) ttfts.shift(); }
      else { intervals.push(now - seq.last); if (intervals.length > 300) intervals.shift(); }
      seq.last = now; seq.left--; tokWin.push(now);
      if (toks.length < 500) toks.push({ x: n.x + 34, y: n.y + rand(-10, 10), vx: rand(160, 240), a: 1, c: CHARS[(Math.random() * CHARS.length) | 0], hue: seq.hue });
    }

    function step(dt) {
      simT += dt;
      spawnAcc += dt;
      const every = 2.4 / +load.value;
      while (spawnAcc > every) {
        spawnAcc -= every;
        const target = mode === "disagg"
          ? nodes.filter(n => n.kind === "P").sort((a, b) => (a.queue.length + !!a.cur) - (b.queue.length + !!b.cur))[0]
          : nodes.slice().sort((a, b) => (a.queue.length + a.seqs.length + !!a.cur * 3) - (b.queue.length + b.seqs.length + !!b.cur * 3))[rr++ % 2];
        reqs.push({ x: W * .03, y: rand(.15, .85) * H, node: target, born: simT, hue: Math.random() < .2 });
      }
      // requests travelling to their node
      for (let i = reqs.length - 1; i >= 0; i--) {
        const r = reqs[i]; const dx = r.node.x - 30 - r.x, dy = r.node.y - r.y; const d = Math.hypot(dx, dy);
        const v = 420 * dt;
        if (d < v) { r.node.queue.push(r); reqs.splice(i, 1); } else { r.x += dx / d * v; r.y += dy / d * v; }
      }
      for (const n of nodes) {
        // prefill
        if (!n.cur && n.queue.length && n.kind !== "D") { n.cur = n.queue.shift(); n.prog = 0; }
        if (n.cur) {
          n.prog += dt / PF;
          if (n.prog >= 1) {
            const r = n.cur; n.cur = null;
            const seq = { born: r.born, left: (rand(14, 34)) | 0, first: null, last: 0, hue: r.hue };
            if (n.kind === "P") {
              const d = nodes.filter(x => x.kind === "D").sort((a, b) => a.seqs.length - b.seqs.length)[0];
              packets.push({ x: n.x + 30, y: n.y, stage: 0, seq, to: d });
            } else n.seqs.push(seq);
          }
        }
        // decode: one batched step emits one token per live sequence; colocated nodes stall during prefill
        if ((n.kind === "D" || n.kind === "M") && n.seqs.length && !(n.kind === "M" && n.cur)) {
          n.tick += dt;
          const st = STEP * (1 + .035 * n.seqs.length);
          if (n.tick >= st) { n.tick -= st; for (const s of n.seqs) emit(n, s); n.seqs = n.seqs.filter(s => s.left > 0); }
        }
      }
      // kv packets: P → pool → D
      for (let i = packets.length - 1; i >= 0; i--) {
        const k = packets[i]; const p = pool();
        const tx = k.stage === 0 ? p.x : k.to.x - 30, ty = k.stage === 0 ? p.y : k.to.y;
        const dx = tx - k.x, dy = ty - k.y, d = Math.hypot(dx, dy), v = 520 * dt;
        if (d < v) { if (k.stage === 0) k.stage = 1; else { k.to.seqs.push(k.seq); packets.splice(i, 1); } }
        else { k.x += dx / d * v; k.y += dy / d * v; }
      }
      for (let i = toks.length - 1; i >= 0; i--) { const t = toks[i]; t.x += t.vx * dt; t.a -= dt * .9; if (t.a <= 0 || t.x > W) toks.splice(i, 1); }
      while (tokWin.length && tokWin[0] < simT - 2) tokWin.shift();
    }

    function rrect(x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }

    function draw(t) {
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.clearRect(0, 0, W, H);
      // grid
      g.strokeStyle = "#14141210"; g.lineWidth = 1;
      for (let x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      for (let y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.font = "600 10px JetBrains Mono, monospace"; g.textBaseline = "middle";
      // ingress label
      g.fillStyle = C.muted; g.fillText("REQUESTS →", 10, 16);
      g.textAlign = "right"; g.fillText("→ TOKENS", W - 10, 16); g.textAlign = "left";
      if (mode === "disagg") {
        const p = pool();
        g.setLineDash([3, 5]); g.strokeStyle = "#14141240";
        for (const n of nodes) { g.beginPath(); g.moveTo(n.x + (n.kind === "P" ? 30 : -30), n.y); g.lineTo(p.x, p.y); g.stroke(); }
        g.setLineDash([]);
        // pool ring
        g.save(); g.translate(p.x, p.y); g.rotate(t * .6);
        g.strokeStyle = C.cob; g.lineWidth = 2; g.setLineDash([10, 6]);
        g.beginPath(); g.arc(0, 0, 38, 0, Math.PI * 2); g.stroke(); g.restore(); g.setLineDash([]);
        g.fillStyle = C.paper; g.beginPath(); g.arc(p.x, p.y, 30, 0, Math.PI * 2); g.fill();
        g.fillStyle = C.cob; g.textAlign = "center"; g.fillText("KV POOL", p.x, p.y - 6); g.fillStyle = C.muted; g.fillText("mooncake", p.x, p.y + 8); g.textAlign = "left";
      }
      // nodes
      for (const n of nodes) {
        const w = 60, h = 40, x = n.x - w / 2, y = n.y - h / 2;
        const stall = n.kind === "M" && n.cur && n.seqs.length;
        g.fillStyle = n.kind === "D" ? C.ink : C.paper; rrect(x, y, w, h, 10); g.fill();
        g.lineWidth = 1.5; g.strokeStyle = stall ? C.ver : C.ink; g.stroke();
        g.fillStyle = n.kind === "D" ? C.paper : C.ink; g.fillText(n.name, x + 7, y + 11);
        if (n.cur) { g.fillStyle = C.ver; g.fillRect(x + 6, y + h - 10, (w - 12) * Math.min(1, n.prog), 4); }
        // live sequences as little bars
        const k = Math.min(n.seqs.length, 12);
        for (let i = 0; i < k; i++) { g.fillStyle = n.kind === "D" ? "#7dff9a" : C.moss; g.fillRect(x + 6 + i * 4, y + 18, 2, 10); }
        if (n.queue.length) { g.fillStyle = C.muted; g.fillText("q" + n.queue.length, x + w + 5, y + 8); }
        if (stall) { g.fillStyle = C.ver; g.fillText("STALL", x + w + 5, y + h - 6); }
      }
      // requests
      for (const r of reqs) { g.fillStyle = r.hue ? C.ver : C.ink; g.beginPath(); g.arc(r.x, r.y, 3.5, 0, Math.PI * 2); g.fill(); }
      for (const k of packets) { g.fillStyle = C.cob; g.fillRect(k.x - 5, k.y - 5, 10, 10); g.strokeStyle = C.paper; g.strokeRect(k.x - 5, k.y - 5, 10, 10); }
      g.font = "500 12px Noto Serif SC, serif";
      for (const tk of toks) { g.globalAlpha = Math.max(0, tk.a); g.fillStyle = tk.hue ? C.ver : C.ink; g.fillText(tk.c, tk.x, tk.y); }
      g.globalAlpha = 1;
    }

    const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
    let mAcc = 0;
    function metrics(dt) {
      mAcc += dt; if (mAcc < .25) return; mAcc = 0;
      const m = avg(intervals), sd = Math.sqrt(avg(intervals.map(v => (v - m) ** 2)));
      out.ttft.textContent = ttfts.length ? Math.round(avg(ttfts) * 1000) + "ms" : "—";
      out.tpot.textContent = intervals.length ? Math.round(m * 1000) + "ms" : "—";
      out.jit.textContent = intervals.length ? "±" + Math.round(sd * 1000) : "—";
      out.tps.textContent = (tokWin.length / 2).toFixed(0);
      out.tpot.style.color = m > .12 ? C.ver : "";
    }

    addLoop(cv, (dt, t) => {
      if (fitCanvas(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; layout(); }
      step(dt); draw(t); metrics(dt);
    });
    build();
  }

  /* =========================================================
     EXP.02 · NPU mesh
     ========================================================= */
  function initNPU() {
    const cv = $("#npuCanvas"), g = cv.getContext("2d"), read = $("#npuRead");
    const COLS = 12, ROWS = 8;
    const cells = Array.from({ length: COLS * ROWS }, (_, i) => ({ i, u: rand(.2, .6), seed: rand(0, 100), hbm: rand(18, 50), temp: rand(48, 66) }));
    const hist = Array(120).fill(.4);
    let W = 0, H = 0, ring = -1, storm = 0, hover = -1, hAcc = 0;
    $("#npuRing").addEventListener("click", () => ring = 0);
    $("#npuStorm").addEventListener("click", () => storm = 1);
    cv.addEventListener("pointermove", e => {
      const r = cv.getBoundingClientRect(); const L = geo();
      const c = Math.floor((e.clientX - r.left - L.ox) / L.cw), w = Math.floor((e.clientY - r.top - L.oy) / L.ch);
      hover = c >= 0 && c < COLS && w >= 0 && w < ROWS ? w * COLS + c : -1;
    });
    cv.addEventListener("pointerleave", () => hover = -1);
    const geo = () => { const pad = 22, top = 30, bottom = 70; const cw = (W - pad * 2) / COLS, ch = (H - top - bottom) / ROWS; return { ox: pad, oy: top, cw, ch }; };
    const colr = u => {
      // paper → sun → vermilion → ink
      const stops = [[241, 237, 227], [242, 194, 48], [255, 79, 31], [20, 20, 18]];
      const x = clamp(u, 0, 1) * 3, i = Math.min(2, Math.floor(x)), f = x - i;
      const a = stops[i], b = stops[i + 1];
      return `rgb(${a.map((v, k) => Math.round(lerp(v, b[k], f))).join(",")})`;
    };
    addLoop(cv, (dt, t) => {
      if (fitCanvas(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const L = geo();
      storm = Math.max(0, storm - dt * .25);
      if (ring >= 0) ring += dt * 1.4;
      if (ring > COLS + 1) ring = -1;
      let sum = 0;
      for (const c of cells) {
        const col = c.i % COLS, row = (c.i / COLS) | 0;
        const wave = Math.sin(t * .8 + col * .5 + c.seed) * .18 + Math.sin(t * 2.3 + row + c.seed * 2) * .07;
        let target = .45 + wave + storm * (.5 + Math.sin(c.seed + t * 6) * .1);
        if (ring >= 0 && Math.abs(ring - col) < 1) target = .95;
        c.u = lerp(c.u, clamp(target, .05, 1), dt * 4 || 0);
        sum += c.u;
        const x = L.ox + col * L.cw, y = L.oy + row * L.ch;
        g.fillStyle = colr(c.u);
        g.beginPath(); g.roundRect ? g.roundRect(x + 2, y + 2, L.cw - 4, L.ch - 4, 6) : g.rect(x + 2, y + 2, L.cw - 4, L.ch - 4); g.fill();
        if (c.i === hover) { g.strokeStyle = C.cob; g.lineWidth = 2.5; g.stroke(); }
      }
      // node separators + labels
      g.font = "600 9px JetBrains Mono, monospace"; g.fillStyle = C.muted; g.textAlign = "center";
      for (let c = 0; c < COLS; c++) g.fillText("n" + String(c).padStart(2, "0"), L.ox + c * L.cw + L.cw / 2, L.oy - 10);
      g.textAlign = "left";
      // HCCL ring overlay: snake through the cards of the active node
      if (ring >= 0) {
        const col = Math.floor(ring) % COLS, f = ring - Math.floor(ring);
        g.strokeStyle = C.cob; g.lineWidth = 2.5; g.beginPath();
        for (let r = 0; r <= ROWS; r++) {
          const rr = r % ROWS, x = L.ox + col * L.cw + L.cw / 2 + (r === ROWS ? L.cw * .3 : 0), y = L.oy + rr * L.ch + L.ch / 2;
          r ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
        const py = L.oy + (f * ROWS) * L.ch + L.ch / 2 - L.ch / 2;
        g.fillStyle = C.cob; g.beginPath(); g.arc(L.ox + col * L.cw + L.cw / 2, Math.min(py, L.oy + ROWS * L.ch - L.ch / 2), 5, 0, Math.PI * 2); g.fill();
      }
      // sparkline
      hAcc += dt; if (hAcc > .08) { hAcc = 0; hist.push(sum / cells.length); hist.shift(); }
      const sy = H - 50, sh = 34;
      g.strokeStyle = "#14141230"; g.beginPath(); g.moveTo(L.ox, sy + sh); g.lineTo(W - L.ox, sy + sh); g.stroke();
      g.strokeStyle = C.ink; g.lineWidth = 1.5; g.beginPath();
      hist.forEach((v, i) => { const x = L.ox + i / (hist.length - 1) * (W - L.ox * 2), y = sy + sh - v * sh; i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
      g.fillStyle = C.ink; g.fillText(`cluster util ${(sum / cells.length * 100).toFixed(1)}%`, L.ox, sy - 4);
      if (hover >= 0) {
        const c = cells[hover];
        read.textContent = `node-${String(hover % COLS).padStart(2, "0")} / npu-${(hover / COLS) | 0}\nutil ${(c.u * 100).toFixed(0)}%  ·  HBM ${(c.hbm + c.u * 12).toFixed(1)}/64 GB  ·  ${(c.temp + c.u * 14).toFixed(0)}°C\nhccl link: ${ring >= 0 && Math.abs(ring - hover % COLS) < 1 ? "ALLREDUCE ⟳" : "OK"}`;
      } else if (Math.random() < dt * 2) read.textContent = `${COLS} nodes × ${ROWS} cards · ${storm > .1 ? "⚡ burst traffic" : "steady"}\nhover a card…`;
    });
  }

  /* =========================================================
     EXP.03 · REST → MCP compiler
     ========================================================= */
  function initMCP() {
    const inn = $("#mcpIn"), out = $("#mcpOut");
    const ex = [
      {
        i: `# openapi: 3.0  (demo / fictional)
paths:
  /api/v1/flights/{flightNo}/status:
    get:
      summary: 查询航班实时状态
      parameters:
        - name: flightNo
          in: path
          required: true
          schema: { type: string }
        - name: date
          in: query
          schema: { type: string, format: date }
      security: [ { bearerAuth: [] } ]`,
        o: `{
  "name": "get_flight_status",
  "description": "查询航班实时状态",
  "inputSchema": {
    "type": "object",
    "properties": {
      "flightNo": { "type": "string" },
      "date": { "type": "string", "format": "date" }
    },
    "required": ["flightNo"]
  },
  "annotations": { "readOnlyHint": true },
  "_gateway": { "auth": "bearer", "route": "GET /api/v1/flights/{flightNo}/status" }
}`
      },
      {
        i: `# openapi: 3.0  (demo / fictional)
paths:
  /geo/v2/route:
    post:
      summary: 两点之间的路线规划
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [from, to]
              properties:
                from: { type: string }
                to:   { type: string }
                mode: { enum: [drive, walk, transit] }`,
        o: `{
  "name": "plan_route",
  "description": "两点之间的路线规划",
  "inputSchema": {
    "type": "object",
    "properties": {
      "from": { "type": "string" },
      "to": { "type": "string" },
      "mode": { "enum": ["drive", "walk", "transit"] }
    },
    "required": ["from", "to"]
  },
  "_gateway": { "auth": "apikey", "rateLimit": "60/min" }
}`
      },
      {
        i: `# openapi: 3.0  (demo / fictional)
paths:
  /corp/search:
    get:
      summary: 按名称检索企业工商信息
      parameters:
        - name: keyword
          in: query
          required: true
        - name: page
          in: query
          schema: { type: integer, default: 1 }
      x-scope: corp.read`,
        o: `{
  "name": "search_company",
  "description": "按名称检索企业工商信息",
  "inputSchema": {
    "type": "object",
    "properties": {
      "keyword": { "type": "string" },
      "page": { "type": "integer", "default": 1 }
    },
    "required": ["keyword"]
  },
  "_gateway": { "scope": "corp.read", "audit": true }
}`
      }
    ];
    const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const hiY = s => esc(s).replace(/(#.*)/g, '<span class="c">$1</span>').replace(/^(\s*)([\w\/{}.-]+):/gm, '$1<span class="k">$2</span>:').replace(/\b(get|post)\b/g, '<span class="m">$1</span>');
    const hiJ = s => esc(s).replace(/("[\w_]+")(\s*:)/g, '<span class="k">$1</span>$2').replace(/:\s*("[^"]*")/g, ': <span class="s">$1</span>').replace(/("get_flight_status"|"plan_route"|"search_company")/g, '<span class="m">$1</span>');
    let k = 0, job = 0, started = false;
    async function play() {
      const my = ++job, e = ex[k % ex.length]; k++;
      const type = async (el, text, hi, speed) => {
        if (still) { el.innerHTML = hi(text); return; }
        for (let i = 0; i <= text.length; i += speed) {
          if (my !== job) return;
          el.innerHTML = hi(text.slice(0, i)) + '<span class="caret"></span>';
          await new Promise(r => requestAnimationFrame(r));
        }
        el.innerHTML = hi(text);
      };
      out.innerHTML = '<span class="c">// waiting for spec…</span>';
      await type(inn, e.i, hiY, 6);
      if (my !== job) return;
      await new Promise(r => setTimeout(r, 300));
      await type(out, e.o, hiJ, 4);
    }
    $("#mcpNext").addEventListener("click", play);
    new IntersectionObserver(es => { if (es[0].isIntersecting && !started) { started = true; play(); } }, { threshold: .3 }).observe(inn);
    setInterval(() => { if (started && !still && document.visibilityState === "visible" && inn.getBoundingClientRect().top < innerHeight && inn.getBoundingClientRect().bottom > 0) play(); }, 11000);
  }

  /* =========================================================
     EXP.04 · threat graph (force layout)
     ========================================================= */
  function initGraph() {
    const cv = $("#gCanvas"), g = cv.getContext("2d");
    const col = { A: C.ver, I: C.cob, D: C.ink, S: C.moss, T: C.sun };
    const N = [], E = [];
    let W = 0, H = 0, drag = null, expandT = -1;
    const add = (type, label, depth) => { const n = { type, label, depth, x: rand(-1, 1), y: rand(-1, 1), vx: 0, vy: 0, r: type === "A" ? 13 : type === "T" ? 6 : 8 }; N.push(n); return n; };
    const link = (a, b, rel) => E.push({ a, b, rel });
    // fictional, TEST-NET addresses only
    const atk = add("A", "APT-Ω", 0);
    let ipN = 10, frontier = [atk];
    const servers = [add("S", "web-01", 1), add("S", "db-02", 1), add("S", "gw-03", 1)];
    servers.forEach(s => link(atk, s, "ATTACKED"));
    for (let depth = 1; depth <= 6; depth++) {
      const next = [];
      for (const f of frontier) {
        const k = depth === 1 ? 3 : depth < 4 ? 2 : 1;
        for (let j = 0; j < k && N.length < 46; j++) {
          const isIP = (depth % 2 === 1);
          const n = isIP ? add("I", `203.0.113.${ipN++}`, depth) : add("D", `${["c2", "cdn", "mail", "drop", "api"][(Math.random() * 5) | 0]}-${depth}${j}.example`, depth);
          link(f, n, "ASSOCIATED_WITH"); next.push(n);
          if (Math.random() < .35) { const t = add("T", ["botnet", "phishing", "c2", "miner", "scan"][(Math.random() * 5) | 0], depth); link(n, t, "TAG"); }
        }
      }
      frontier = next;
    }
    // compute BFS depth from attacker for the expansion wave
    const adj = new Map(N.map(n => [n, []])); E.forEach(e => { adj.get(e.a).push(e.b); adj.get(e.b).push(e.a); });
    const hop = new Map([[atk, 0]]); const q = [atk];
    while (q.length) { const n = q.shift(); for (const m of adj.get(n)) if (!hop.has(m)) { hop.set(m, hop.get(n) + 1); q.push(m); } }

    $("#gExpand").addEventListener("click", () => expandT = 0);
    const toLocal = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left - W / 2, y: e.clientY - r.top - H / 2 }; };
    cv.addEventListener("pointerdown", e => {
      const p = toLocal(e); let best = null, bd = 400;
      for (const n of N) { const d = (n.x - p.x) ** 2 + (n.y - p.y) ** 2; if (d < bd) { bd = d; best = n; } }
      if (best) { drag = best; cv.setPointerCapture(e.pointerId); }
    });
    cv.addEventListener("pointermove", e => { if (drag) { const p = toLocal(e); drag.x = p.x; drag.y = p.y; drag.vx = drag.vy = 0; } });
    cv.addEventListener("pointerup", () => drag = null);

    function sim(dt) {
      const k = Math.min(W, H) * .11;
      for (let i = 0; i < N.length; i++) {
        const a = N[i];
        for (let j = i + 1; j < N.length; j++) {
          const b = N[j]; let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy + .01;
          const f = k * k / d2 * .9; const d = Math.sqrt(d2); dx /= d; dy /= d;
          a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
        }
      }
      for (const e of E) {
        let dx = e.b.x - e.a.x, dy = e.b.y - e.a.y; const d = Math.hypot(dx, dy) + .01;
        const f = (d - k * (e.rel === "TAG" ? .45 : .8)) * .05; dx /= d; dy /= d;
        e.a.vx += dx * f; e.a.vy += dy * f; e.b.vx -= dx * f; e.b.vy -= dy * f;
      }
      for (const n of N) {
        n.vx -= n.x * .004; n.vy -= n.y * .006;
        if (n === drag) continue;
        n.vx *= .82; n.vy *= .82;
        n.x += clamp(n.vx, -20, 20) * dt * 30; n.y += clamp(n.vy, -20, 20) * dt * 30;
        n.x = clamp(n.x, -W / 2 + 20, W / 2 - 20); n.y = clamp(n.y, -H / 2 + 20, H / 2 - 20);
      }
    }
    addLoop(cv, (dt, t) => {
      if (fitCanvas(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      sim(still ? 0.016 : dt);
      if (expandT >= 0 && !still) expandT += dt; else if (expandT >= 0) expandT += .016;
      const wave = expandT >= 0 ? expandT / .55 : -1;
      if (wave > 12) expandT = -1;
      g.setTransform(DPR, 0, 0, DPR, W / 2 * DPR, H / 2 * DPR);
      g.clearRect(-W / 2, -H / 2, W, H);
      for (const e of E) {
        const lit = wave >= 0 && Math.max(hop.get(e.a), hop.get(e.b)) <= wave;
        g.strokeStyle = lit ? C.ver : "#14141235"; g.lineWidth = lit ? 1.8 : 1;
        if (e.rel === "TAG") g.setLineDash([2, 4]);
        g.beginPath(); g.moveTo(e.a.x, e.a.y); g.lineTo(e.b.x, e.b.y); g.stroke(); g.setLineDash([]);
      }
      g.font = "500 9.5px JetBrains Mono, monospace"; g.textBaseline = "middle";
      for (const n of N) {
        const h = hop.get(n);
        if (wave >= 0 && Math.abs(wave - h) < .6) {
          g.strokeStyle = C.ver; g.lineWidth = 1.5; g.globalAlpha = 1 - Math.abs(wave - h) / .6;
          g.beginPath(); g.arc(n.x, n.y, n.r + 6 + (wave - h + .6) * 10, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
        }
        g.fillStyle = col[n.type]; g.beginPath(); g.arc(n.x, n.y, n.r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = C.paper2; g.lineWidth = 2; g.stroke();
        if (n.type === "A" || n === drag || (wave >= 0 && h <= wave && n.type !== "T")) {
          g.fillStyle = C.ink; g.fillText(n.label, n.x + n.r + 4, n.y);
        }
      }
      g.fillStyle = C.muted; g.font = "600 10px JetBrains Mono, monospace";
      g.fillText(wave >= 0 ? `MATCH (a:Attacker)-[*1..${Math.min(6, Math.floor(wave))}]-(n) RETURN n` : "drag nodes · fictional data", -W / 2 + 14, H / 2 - 14);
    });
  }

  /* =========================================================
     02 · ORDER ⇄ FEEL point-cloud morph
     ========================================================= */
  const morphSec = $("#morph");
  let morphTouched = false;
  const morphState = { v: 0, target: 0 };
  function initMorph() {
    const cv = $("#morphCanvas"), g = cv.getContext("2d"), slider = $("#morphR"), readEl = $("#morphRead");
    const S = 12, NP = S * S * S;
    const shapes = [[], [], [], []];
    for (let i = 0; i < NP; i++) {
      const x = i % S, y = ((i / S) | 0) % S, z = (i / (S * S)) | 0;
      shapes[0].push([(x / (S - 1) - .5) * 1.5, (y / (S - 1) - .5) * 1.5, (z / (S - 1) - .5) * 1.5]);
      // sphere (fibonacci)
      const k = i + .5, phi = Math.acos(1 - 2 * k / NP), th = Math.PI * (1 + Math.sqrt(5)) * k;
      shapes[1].push([Math.cos(th) * Math.sin(phi), Math.cos(phi), Math.sin(th) * Math.sin(phi)]);
      // torus
      const u = (i % 72) / 72 * Math.PI * 2, v = ((i / 72) | 0) / (NP / 72) * Math.PI * 2;
      shapes[2].push([(1 + .38 * Math.cos(u)) * Math.cos(v) * .82, .38 * Math.sin(u) * .82, (1 + .38 * Math.cos(u)) * Math.sin(v) * .82]);
      // double helix with rungs
      const s = i / NP, strand = i % 3, a = s * Math.PI * 9;
      if (strand < 2) { const o = strand * Math.PI; shapes[3].push([Math.cos(a + o) * .55, (s - .5) * 2.1, Math.sin(a + o) * .55]); }
      else { const f = Math.random() * 2 - 1; shapes[3].push([Math.cos(a) * .55 * f, (s - .5) * 2.1, Math.sin(a) * .55 * f]); }
    }
    const names = ["tensor[12,12,12]", "sphere · fibonacci", "torus · kv ring", "helix · token stream"];
    const accent = new Uint8Array(NP).map((_, i) => (i * 7919) % 23 === 0 ? 1 : (i * 104729) % 41 === 0 ? 2 : 0);
    let W = 0, H = 0, yaw = .6, pitch = -.35, vy = 0, vp = 0, dragging = false, lx = 0, ly = 0;
    const pts = new Float32Array(NP * 2);
    slider.addEventListener("input", () => { morphTouched = true; morphState.target = slider.value / 100; });
    cv.addEventListener("pointerdown", e => { dragging = true; lx = e.clientX; ly = e.clientY; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", e => { if (!dragging) return; vy = (e.clientX - lx) * .006; vp = (e.clientY - ly) * .006; lx = e.clientX; ly = e.clientY; yaw += vy; pitch = clamp(pitch + vp, -1.3, 1.3); });
    cv.addEventListener("pointerup", () => dragging = false);
    addLoop(cv, (dt, t) => {
      if (fitCanvas(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      morphState.v = lerp(morphState.v, morphState.target, still ? 1 : Math.min(1, dt * 3));
      if (!morphTouched) slider.value = morphState.v * 100;
      const v = clamp(morphState.v, 0, 2.999), si = Math.floor(v), f = easeIO(easeIO(v - si));
      const A = shapes[si], B = shapes[si + 1];
      if (!dragging) { yaw += vy + dt * .18; vy *= .95; vp *= .95; pitch = clamp(pitch + vp, -1.3, 1.3); }
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const R = Math.min(W, H) * .36;
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const r = cv.getBoundingClientRect(); const pmx = mx - r.left, pmy = my - r.top;
      for (let i = 0; i < NP; i++) {
        const a = A[i], b = B[i];
        let x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f), z = lerp(a[2], b[2], f);
        // breathing
        const br = 1 + Math.sin(t * 1.4 + i * .013) * .012;
        x *= br; y *= br; z *= br;
        const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
        const y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
        const per = 2.6 / (2.6 + z2);
        let px = W / 2 + x1 * R * per, py = H / 2 + y1 * R * per;
        const dx = px - pmx, dy = py - pmy, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { const k = (1 - d2 / 9000) * 18; const d = Math.sqrt(d2) + .1; px += dx / d * k; py += dy / d * k; }
        pts[i * 2] = px; pts[i * 2 + 1] = py;
        const s = Math.max(.8, per * per * 2.3);
        const acc = accent[i];
        g.globalAlpha = clamp(.25 + (1 - z2) * .45, .12, 1);
        g.fillStyle = acc === 1 ? C.ver : acc === 2 ? "#7dff9a" : C.paper;
        g.fillRect(px - s / 2, py - s / 2, s * (acc ? 1.6 : 1), s * (acc ? 1.6 : 1));
      }
      g.globalAlpha = 1;
      // HUD crosshair
      g.strokeStyle = "#f1ede322"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(W / 2 - 14, H / 2); g.lineTo(W / 2 + 14, H / 2); g.moveTo(W / 2, H / 2 - 14); g.lineTo(W / 2, H / 2 + 14); g.stroke();
      readEl.textContent = `shape = ${names[f < .5 ? si : si + 1]} · t = ${morphState.v.toFixed(2)} · yaw ${(yaw % 6.283).toFixed(2)}`;
    });
  }

  /* ---------------- card tilt ---------------- */
  if (fine) $$("[data-tilt]").forEach(c => {
    c.addEventListener("pointermove", e => { if (still) return; const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`; });
    c.addEventListener("pointerleave", () => c.style.transform = "");
  });

  /* =========================================================
     Terminal
     ========================================================= */
  const term = $("#term"), tb = $("#termBody"), ti = $("#termInput");
  const hist = []; let hi = -1;
  const print = (h) => { tb.insertAdjacentHTML("beforeend", h + "\n"); tb.scrollTop = tb.scrollHeight; };
  const cmds = {
    help: () => `<span class="y">可用命令</span>
  whoami        我是谁
  stack         技术栈
  exp           经历摘要
  oss           开源贡献
  npu-smi       看看卡
  serve         启动一个(假的)推理服务
  matrix        进入矩阵 (再输一次退出)
  theme         油墨 ↔ 朱砂
  sudo hire-me  ……
  clear / exit`,
    whoami: () => `<span class="g">dreaming66</span> · AI Infra / LLM Inference engineer
在国产算力上部署、调优大模型；也写 Agent、MCP 与 RAG。`,
    stack: () => `infra    Ascend 910B · Alibaba PPU · HCCL · K8s · Docker · Prometheus/Grafana
serving  vLLM · MindIE · Mooncake (PD 分离) · W8A8
agent    MCP · ReAct · Graph-RAG · LlamaIndex · LangChain · Neo4j
lang     Python · Go · Java · TypeScript · Shell`,
    exp: () => `2025.08–now  大型航空集团 · AI Infra
2025.02–07   腾讯 PCG · VLM 数据与策略实习
2024         「智安智策」· 中国软件杯全国一等奖
2021–2025    中国民航大学 · 计算机科学与技术`,
    oss: () => `<span class="g">[merged]</span> kubernetes-sigs/kueue#17528
<span class="y">[open]</span>   kubernetes-sigs/kueue#17527
<span class="y">[open]</span>   kubernetes-sigs/reference-docs#476`,
    "npu-smi": () => {
      let s = `<span class="d">+------+--------+---------+-----------+-------+</span>\n| NPU  | Health | Util(%) | HBM (GB)  | Temp  |\n<span class="d">+------+--------+---------+-----------+-------+</span>\n`;
      for (let i = 0; i < 8; i++) { const u = (rand(40, 98)) | 0; s += `| ${String(i).padEnd(4)} | <span class="g">OK</span>     | ${String(u).padStart(7)} | ${(rand(20, 60)).toFixed(1).padStart(5)} / 64 | ${(rand(45, 72) | 0)}°C  |\n`; }
      return s + `<span class="d">+------+--------+---------+-----------+-------+</span>`;
    },
    serve: () => {
      const lines = ["INFO  loading model (w8a8) …", "INFO  tp=8 ep=8 · kv-cache via mooncake", "INFO  prefill pool: 3 · decode pool: 4", "INFO  warmup done", '<span class="g">INFO  Uvicorn running on http://0.0.0.0:8000 (just kidding)</span>'];
      lines.forEach((l, i) => setTimeout(() => print(l), 250 * (i + 1)));
      return '<span class="d">$ python -m serve --model ./weights</span>';
    },
    matrix: () => { toggleMatrix(); return matrixOn ? "wake up…" : "back to paper."; },
    theme: () => { document.documentElement.style.setProperty("--vermilion", css("--vermilion") === "#ff4f1f" ? "#2747ff" : "#ff4f1f"); return "accent swapped."; },
    "sudo hire-me": () => `<span class="p">[sudo]</span> password for visitor: ********
<span class="g">✔ access granted.</span> 请移步 <a href="https://github.com/dreaming66" target="_blank" rel="noopener" style="text-decoration:underline">github.com/dreaming66</a>，期待交流。`,
    sudo: () => `visitor is not in the sudoers file. This incident will be reported. 🙃`,
    ls: () => `about.md  lab/  work/  oss/  <span class="d">.secrets (redacted)</span>`,
    "cat .secrets": () => `<span class="p">permission denied</span> · 隐私已抹除`,
    clear: () => { tb.innerHTML = ""; return null; },
    exit: () => { setTerm(false); return null; },
  };
  const setTerm = open => { term.classList.toggle("open", open); term.setAttribute("aria-hidden", !open); if (open) setTimeout(() => ti.focus(), 50); };
  print(`<span class="d">atelier shell v0.66 — 输入 </span><span class="y">help</span><span class="d"> 查看命令</span>`);
  $("#termBtn").addEventListener("click", () => setTerm(!term.classList.contains("open")));
  $("#termClose").addEventListener("click", () => setTerm(false));
  $("#termForm").addEventListener("submit", e => {
    e.preventDefault();
    const v = ti.value.trim(); ti.value = ""; if (!v) return;
    hist.unshift(v); hi = -1;
    print(`<span class="p">❯</span> ${v.replace(/[<>&]/g, "")}`);
    const fn = cmds[v.toLowerCase()];
    const res = fn ? fn() : `command not found: ${v.replace(/[<>&]/g, "")} · 试试 <span class="y">help</span>`;
    if (res) print(res);
  });
  ti.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") { hi = Math.min(hist.length - 1, hi + 1); ti.value = hist[hi] || ""; e.preventDefault(); }
    if (e.key === "ArrowDown") { hi = Math.max(-1, hi - 1); ti.value = hist[hi] || ""; e.preventDefault(); }
    if (e.key === "Escape") setTerm(false);
  });

  /* ---------------- matrix + konami ---------------- */
  const mcv = $("#matrix"), mg = mcv.getContext("2d");
  let matrixOn = false, drops = [];
  function toggleMatrix(force) {
    matrixOn = force ?? !matrixOn; mcv.classList.toggle("on", matrixOn);
    if (matrixOn) { mcv.width = innerWidth; mcv.height = innerHeight; drops = Array(Math.ceil(innerWidth / 16)).fill(0).map(() => rand(-40, 0)); mloop(); }
  }
  function mloop() {
    if (!matrixOn) { mg.clearRect(0, 0, mcv.width, mcv.height); return; }
    mg.fillStyle = "rgba(20,20,18,.12)"; mg.fillRect(0, 0, mcv.width, mcv.height);
    mg.font = "15px JetBrains Mono, monospace";
    const set = "01推理算力张量注意力ΣΔ∇λKVQ";
    drops.forEach((y, i) => {
      mg.fillStyle = Math.random() < .03 ? C.ver : "#7dff9a";
      mg.fillText(set[(Math.random() * set.length) | 0], i * 16, y * 16);
      drops[i] = y * 16 > mcv.height && Math.random() > .975 ? 0 : y + 1;
    });
    requestAnimationFrame(mloop);
  }
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]; let kp = 0;
  addEventListener("keydown", e => {
    const inField = e.target.matches("input, textarea");
    if (!inField && e.key === "`") { e.preventDefault(); setTerm(!term.classList.contains("open")); return; }
    if (e.key === "Escape") { setMenu(false); closeCard(); }
    kp = e.key === konami[kp] ? kp + 1 : (e.key === konami[0] ? 1 : 0);
    if (kp === konami.length) { kp = 0; document.body.classList.add("glitch"); toggleMatrix(true); setTimeout(() => { document.body.classList.remove("glitch"); toggleMatrix(false); }, 5000); }
  });

  /* =========================================================
     Business-card generator
     ========================================================= */
  const modal = $("#cardModal"), ccv = $("#cardCanvas"), cg = ccv.getContext("2d"), cline = $("#cardLine"), cdl = $("#cardDl");
  const themes = [
    { bg: C.paper, fg: C.ink, ac: C.ver },
    { bg: C.ink, fg: C.paper, ac: C.ver },
    { bg: C.ver, fg: C.ink, ac: C.paper },
    { bg: C.cob, fg: C.paper, ac: C.sun },
  ];
  let ti2 = 0, seed = Math.random() * 1000;
  function drawCard() {
    const th = themes[ti2 % themes.length], Wc = ccv.width, Hc = ccv.height;
    cg.fillStyle = th.bg; cg.fillRect(0, 0, Wc, Hc);
    // generative contour decoration
    cg.save(); cg.globalAlpha = .22; cg.strokeStyle = th.fg; cg.lineWidth = 1.2;
    for (let k = 0; k < 26; k++) {
      cg.beginPath();
      for (let x = 0; x <= Wc; x += 8) {
        const y = Hc * .1 + k * 22 + Math.sin(x * .006 + seed + k * .25) * 40 + Math.sin(x * .017 + seed * 2 + k * .1) * 14;
        x ? cg.lineTo(x, y) : cg.moveTo(x, y);
      }
      cg.stroke();
    }
    cg.restore();
    // NPU grid motif
    for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) {
      cg.fillStyle = Math.sin(seed + i * 1.7 + j * 2.3) > .4 ? th.ac : th.fg;
      cg.globalAlpha = Math.sin(seed + i * 1.7 + j * 2.3) > .4 ? 1 : .15;
      cg.fillRect(Wc - 70 - i * 26, 70 + j * 26, 20, 20);
    }
    cg.globalAlpha = 1;
    cg.fillStyle = th.fg; cg.font = "600 22px JetBrains Mono, monospace"; cg.fillText("AI INFRA · LLM INFERENCE · AGENT", 70, 92);
    cg.font = "italic 400 190px Instrument Serif, Georgia, serif"; cg.fillText("dreaming", 62, 400);
    cg.fillStyle = th.ac; cg.fillText("66", 62 + cg.measureText("dreaming").width + 10, 400);
    cg.fillStyle = th.fg; cg.font = "900 40px Noto Serif SC, serif"; cg.fillText(cline.value || " ", 70, 500);
    cg.fillRect(70, 560, Wc - 140, 2);
    cg.font = "500 24px JetBrains Mono, monospace";
    cg.fillText("github.com/dreaming66", 70, 620);
    cg.textAlign = "right"; cg.fillText("dreaming66.github.io", Wc - 70, 620); cg.textAlign = "left";
    cdl.href = ccv.toDataURL("image/png");
  }
  const openCard = async () => { await document.fonts.ready; drawCard(); modal.classList.add("open"); modal.setAttribute("aria-hidden", false); };
  function closeCard() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", true); }
  $("#cardBtn").addEventListener("click", openCard);
  $("#cardClose").addEventListener("click", closeCard);
  $("#cardShuffle").addEventListener("click", () => { ti2++; seed = Math.random() * 1000; drawCard(); });
  cline.addEventListener("input", drawCard);
  modal.addEventListener("click", e => { if (e.target === modal) closeCard(); });

  /* ---------------- boot ---------------- */
  initInk(); initPD(); initNPU(); initMCP(); initGraph(); initMorph();
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();
  requestAnimationFrame(frame);
  runLoader();
  console.log("%c dreaming66 %c 你在看源码？按 ` 打开终端，或者试试 ↑↑↓↓←→←→BA", "background:#ff4f1f;color:#141412;font-weight:700;padding:4px 8px", "color:#7d7a70");
})();
