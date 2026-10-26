/* ==========================================================
   DRM-66 · core: utils, audio engine, chrome, terminal
   ========================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  // canvases live on ink "instrument screens" sitting on paper
  const C = { bg: "#141412", bg2: "#1c1c1a", bg3: "#24241f", fg: "#f1ede3", dim: "#9a968a", dim2: "#5f5c55", line: "#ffffff16", amb: "#ff4f1f", sig: "#8fb2ff", hot: "#ff2e4d", ok: "#7dff9a", sun: "#f2c230", paper: "#f1ede3", ink: "#141412", ver: "#ff4f1f", cob: "#2747ff" };

  const D = window.D66 = { t: (...a) => window.I18N ? I18N.t(...a) : a[0], $, $$, clamp, lerp, rand, DPR, fine, C, still: matchMedia("(prefers-reduced-motion: reduce)").matches, mx: -999, my: -999, T: 0 };

  /* ---------------- loops ---------------- */
  const loops = [];
  const io = new IntersectionObserver(es => es.forEach(e => { for (const l of loops) if (l.el === e.target) l.vis = e.isIntersecting; }), { rootMargin: "100px" });
  D.loop = (el, tick) => { const l = { el, tick, vis: false }; loops.push(l); io.observe(el); return l; };
  D.fit = (cv, scale = 1) => {
    const r = cv.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * DPR * scale)), h = Math.max(1, Math.round(r.height * DPR * scale));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; return true; }
    return false;
  };
  D.onVisible = (el, fn, th = .3) => { const o = new IntersectionObserver(es => { if (es[es.length - 1].isIntersecting) { o.disconnect(); fn(); } }, { threshold: th }); o.observe(el); };

  /* =========================================================
     AUDIO ENGINE — everything synthesized, no samples
     ========================================================= */
  const A = D.audio = { ctx: null, on: false };
  function ainit() {
    if (A.ctx) return;
    const ctx = A.ctx = new (window.AudioContext || window.webkitAudioContext)();
    A.master = ctx.createGain(); A.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    A.analyser = ctx.createAnalyser(); A.analyser.fftSize = 2048;
    A.master.connect(comp); comp.connect(A.analyser); A.analyser.connect(ctx.destination);
    // reverb send (synthetic impulse)
    const len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    A.verb = ctx.createConvolver(); A.verb.buffer = ir;
    A.send = ctx.createGain(); A.send.gain.value = .32; A.send.connect(A.verb); A.verb.connect(A.master);
    // shared white-noise buffer
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    A.noiseBuf = nb;
  }
  // browsers only allow audio after a user gesture: sound is "armed" until the first click / key / touch
  let gestured = false;
  const unlock = () => {
    if (gestured) return; gestured = true;
    ["pointerdown", "keydown", "touchstart"].forEach(ev => removeEventListener(ev, unlock, true));
    if (A.on) { D.setSound(true); S.boot(); }
  };
  ["pointerdown", "keydown", "touchstart"].forEach(ev => addEventListener(ev, unlock, true));
  D.setSound = on => {
    if (on && gestured) { ainit(); A.ctx.resume(); }
    A.on = on;
    if (A.ctx) A.master.gain.setTargetAtTime(on ? .55 : 0, A.ctx.currentTime, .05);
    const b = $("#sndBtn"); b.setAttribute("aria-pressed", on); b.querySelector("b").textContent = on ? "ON" : "OFF";
    document.dispatchEvent(new CustomEvent("d66sound", { detail: on }));
  };
  const ok = () => A.on && A.ctx && A.ctx.state === "running";
  const out = (node, wet = 0) => { node.connect(A.master); if (wet) { const g = A.ctx.createGain(); g.gain.value = wet; node.connect(g); g.connect(A.send); } };
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  const S = D.sfx = {
    tone(f = 880, d = .08, type = "sine", v = .15, wet = 0, when = 0) {
      if (!ok()) return; const t = A.ctx.currentTime + when;
      const o = A.ctx.createOscillator(), g = A.ctx.createGain(); o.type = type; o.frequency.value = f;
      env(g, t, .004, v, d); o.connect(g); out(g, wet); o.start(t); o.stop(t + d + .05);
    },
    noise(d = .05, f = 4000, q = 1, v = .1, type = "bandpass", when = 0) {
      if (!ok()) return; const t = A.ctx.currentTime + when;
      const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true;
      const fl = A.ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = A.ctx.createGain(); env(g, t, .002, v, d);
      s.connect(fl); fl.connect(g); out(g); s.start(t, Math.random()); s.stop(t + d + .05);
    },
    tick() { S.noise(.018, 6000, 2, .05, "highpass"); },
    click() { S.tone(1760, .03, "square", .04); S.noise(.02, 3000, 3, .05); },
    blip(f = 660) { S.tone(f, .09, "triangle", .12, .2); },
    zap() {
      if (!ok()) return; const t = A.ctx.currentTime;
      const o = A.ctx.createOscillator(), g = A.ctx.createGain(), fl = A.ctx.createBiquadFilter();
      o.type = "sawtooth"; o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(60, t + .3);
      fl.type = "lowpass"; fl.frequency.setValueAtTime(5000, t); fl.frequency.exponentialRampToValueAtTime(200, t + .3);
      env(g, t, .003, .14, .32); o.connect(fl); fl.connect(g); out(g, .3); o.start(t); o.stop(t + .4);
    },
    whoosh(up = true) {
      if (!ok()) return; const t = A.ctx.currentTime;
      const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf;
      const fl = A.ctx.createBiquadFilter(); fl.type = "bandpass"; fl.Q.value = 3;
      fl.frequency.setValueAtTime(up ? 300 : 3000, t); fl.frequency.exponentialRampToValueAtTime(up ? 3000 : 250, t + .45);
      const g = A.ctx.createGain(); env(g, t, .15, .16, .35); s.connect(fl); fl.connect(g); out(g, .4); s.start(t); s.stop(t + .6);
    },
    sizzle() { S.noise(rand(.06, .12), rand(5000, 8000), 1.5, .07, "bandpass"); S.tone(rand(2400, 3200), .03, "sine", .02); },
    thud(v = .12) {
      if (!ok()) return; const t = A.ctx.currentTime;
      const o = A.ctx.createOscillator(), g = A.ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .12);
      env(g, t, .002, v, .14); o.connect(g); out(g); o.start(t); o.stop(t + .2);
    },
    ping() {
      if (!ok()) return; const t = A.ctx.currentTime;
      const o = A.ctx.createOscillator(), g = A.ctx.createGain(); o.frequency.value = 1318.5;
      env(g, t, .005, .22, 1.6);
      const dl = A.ctx.createDelay(); dl.delayTime.value = .32; const fb = A.ctx.createGain(); fb.gain.value = .38;
      o.connect(g); out(g, .6); g.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(A.master);
      o.start(t); o.stop(t + 1.8);
      setTimeout(() => { try { fb.disconnect(); dl.disconnect(); } catch (e) {} }, 4000);
    },
    chord(fs, gap = .07, type = "triangle", v = .09) { fs.forEach((f, i) => S.tone(f, .9, type, v, .5, i * gap)); },
    boot() { S.chord([261.6, 329.6, 392, 523.3, 784], .09, "sine", .11); S.noise(.4, 200, .7, .05, "lowpass"); },
    // Karplus–Strong plucked string, cached per frequency
    _ks: new Map(),
    // drive chain: pre-gain → HPF → soft-clip waveshaper → mid boost → cab low-pass
    _amp() {
      if (A.amp) return A.amp; const c = A.ctx;
      const pre = c.createGain(); pre.gain.value = 7;
      const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 110;
      const ws = c.createWaveShaper(); const n = 2048, cur = new Float32Array(n), k = 55;
      for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; cur[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
      ws.curve = cur; ws.oversample = "4x";
      const mid = c.createBiquadFilter(); mid.type = "peaking"; mid.frequency.value = 850; mid.Q.value = .9; mid.gain.value = 7;
      const cab = c.createBiquadFilter(); cab.type = "lowpass"; cab.frequency.value = 4200; cab.Q.value = .8;
      const cab2 = c.createBiquadFilter(); cab2.type = "lowpass"; cab2.frequency.value = 6500;
      const post = c.createGain(); post.gain.value = .16;
      pre.connect(hp); hp.connect(ws); ws.connect(mid); mid.connect(cab); cab.connect(cab2); cab2.connect(post); out(post, .3);
      return A.amp = pre;
    },
    pluck(f, v = .3, bright = .5, drive = false) {
      if (!ok()) return; const sr = A.ctx.sampleRate, key = Math.round(f * 10) + ":" + bright;
      let buf = S._ks.get(key);
      if (!buf) {
        const len = Math.floor(sr * 3), N = Math.max(2, Math.round(sr / f));
        buf = A.ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0);
        const ring = new Float32Array(N); for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
        // pre-filter burst for a warmer attack
        for (let k = 0; k < 2 - bright * 2; k++) for (let i = 1; i < N; i++) ring[i] = (ring[i] + ring[i - 1]) * .5;
        const decay = .4985 + Math.min(.0012, f / 300000);
        let p = 0;
        for (let i = 0; i < len; i++) { const a = ring[p], b = ring[(p + 1) % N]; d[i] = a; ring[p] = (a + b) * decay; p = (p + 1) % N; }
        S._ks.set(key, buf);
      }
      const s = A.ctx.createBufferSource(); s.buffer = buf;
      const g = A.ctx.createGain(); g.gain.value = v;
      const fl = A.ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 2400 + bright * 4000;
      s.connect(fl); fl.connect(g);
      if (drive) g.connect(S._amp()); else out(g, .35);
      s.start();
    },
    piano(f, v = .22) {
      if (!ok()) return; const t = A.ctx.currentTime;
      const g = A.ctx.createGain(); env(g, t, .006, v, 2.4); out(g, .4);
      [[1, 1], [2, .42], [3, .2], [4, .11], [5, .06]].forEach(([h, a]) => {
        const o = A.ctx.createOscillator(), og = A.ctx.createGain(); o.frequency.value = f * h * (1 + (h - 1) * .0009);
        og.gain.setValueAtTime(a, t); og.gain.exponentialRampToValueAtTime(.0001, t + 2.4 / h);
        o.connect(og); og.connect(g); o.start(t); o.stop(t + 2.6);
      });
      S.noise(.03, 2500, 1, .04);
    },
    morse(text, wpm = 20, f = 700) {
      if (!ok()) return 0; const u = 1.2 / wpm; let t = 0;
      for (const ch of text.toUpperCase()) {
        if (ch === " ") { t += u * 4; continue; }
        const code = MORSE[ch]; if (!code) continue;
        for (const s of code) { const d = s === "." ? u : u * 3; S.tone(f, d, "sine", .12, 0, t); t += d + u; }
        t += u * 2;
      }
      return t;
    },
  };
  const MORSE = D.MORSE = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----." };

  /* ---------------- gate / POST ---------------- */
  const post = [
    ["DRM-66 BIOS v6.6 · (c) 2026 dreaming66", "h"],
    ["CPU0 ........ curiosity @ ∞ GHz", "ok"],
    ["SOLDER IRON ........ 350°C", "ok"],
    ["UART0 ........ 115200 8N1", "ok"],
    ["BOARD ........ AuraCore V2.0 · Allwinner H616", "ok"],
    ["CLUSTER ........ 1 head + 4 workers · k3s", "ok"],
    ["NPU ........ 96 cards · HCCL ring up", "ok"],
    ["KV-CACHE ........ mooncake pool mounted", "ok"],
    ["RF FRONTEND ........ 144–146 MHz · DE BH3FWY", "ok"],
    ["ACTUATOR ........ cycloidal 5010 · FOC driver: selecting", "w"],
    ["STRINGS ........ EADGBE · overdrive on", "ok"],
    ["PRIVACY ........ phone / email / employer → REDACTED", "w"],
    ["AUDIO ........ WebAudio synth armed · first click unmutes", "ok"],
  ];
  function runGate() {
    const el = $("#post"); let i = 0;
    $("#gateClock").textContent = new Date().toISOString().slice(0, 19).replace("T", " ");
    const step = () => {
      if (i < post.length) {
        const [t, c] = post[i++];
        const m = t.match(/^(.*?)(\s\.{4,}\s)(.*)$/);
        el.innerHTML += m ? `${m[1]}<span class="d">${m[2]}</span><span class="${c}">${m[3]}</span>\n` : `<span class="${c}">${t}</span>\n`;
        setTimeout(step, D.still ? 0 : rand(60, 140));
      } else { el.innerHTML += "\n<span class=\"w\">▶ all systems nominal · booting…</span>"; setTimeout(() => enter(true), D.still ? 0 : 650); }
    };
    step();
    const enter = snd => {
      if (!document.body.classList.contains("gated")) return;
      if (snd) D.setSound(true);
      $("#gate").classList.add("off");
      $("#crt").classList.add("on");
      document.body.classList.remove("gated");
      document.body.classList.add("booted", "ready");
      setTimeout(() => { $("#gate").remove(); S.boot(); }, 300);
      document.dispatchEvent(new Event("d66boot"));
    };
    // skip the POST on any click / key
    const skip = () => { i = post.length; enter(true); };
    $("#gate").addEventListener("pointerdown", skip);
    addEventListener("keydown", function k() { removeEventListener("keydown", k); if (document.body.classList.contains("gated")) skip(); });
  }

  /* ---------------- cursor + magnetic ---------------- */
  const cur = $(".cursor"), dot = $(".c-dot"), ring = $(".c-ring"), label = $(".c-label");
  let rx = 0, ry = 0, lastTick = 0;
  addEventListener("pointermove", e => { D.mx = e.clientX; D.my = e.clientY; }, { passive: true });
  if (fine) {
    document.body.classList.add("has-cursor");
    addEventListener("pointerdown", () => cur.classList.add("down"));
    addEventListener("pointerup", () => cur.classList.remove("down"));
    document.addEventListener("pointerover", e => {
      const t = e.target.closest("a,button,input,label,[data-cursor],.clip,.mcu,.wk,.bk");
      cur.classList.toggle("hover", !!t && t.tagName !== "INPUT");
      label.textContent = t ? (t.dataset.cursor || (t.classList.contains("clip") ? "play" : t.tagName === "A" ? "open" : t.matches(".wk,.bk") ? "♪" : t.tagName === "BUTTON" ? "click" : "")) : "";
      if (t && performance.now() - lastTick > 60) { lastTick = performance.now(); S.tick(); }
    });
    (function cl() {
      rx = lerp(rx, D.mx, .18); ry = lerp(ry, D.my, .18);
      dot.style.transform = `translate(${D.mx}px,${D.my}px)`; ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(cl);
    })();
    $$(".magnetic").forEach(el => {
      el.addEventListener("pointermove", e => { if (D.still) return; const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
      el.addEventListener("pointerleave", () => { el.style.transition = "transform .6s cubic-bezier(.23,1,.32,1)"; el.style.transform = ""; setTimeout(() => el.style.transition = "", 600); });
    });
  }
  document.addEventListener("click", e => { if (e.target.closest("button, a")) S.click(); });

  /* split hero letters */
  $$(".split").forEach((el, k) => {
    const t = el.dataset.text || el.textContent; el.textContent = "";
    [...t].forEach((c, i) => {
      const sp = document.createElement("span"); sp.className = "ch"; sp.textContent = c; sp.style.transitionDelay = (.25 + k * .12 + i * .045) + "s";
      sp.addEventListener("pointerenter", () => S.tone(220 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14][(i + k * 2) % 7] / 12), .2, "triangle", .07, .4));
      el.appendChild(sp);
    });
  });
  document.addEventListener("d66boot", () => setTimeout(() => $$(".split .ch").forEach(s => s.style.transitionDelay = "0s"), 3200));

  /* menu */
  const menuBtn = $("#menuBtn"), menu = $("#menu");
  const setMenu = open => { document.body.classList.toggle("menu-open", open); menu.setAttribute("aria-hidden", !open); menuBtn.setAttribute("aria-expanded", open); S.whoosh(open); };
  menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$(".menu a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  D.setMenu = setMenu;

  /* counters */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const el = e.target; cio.unobserve(el);
    const to = +el.dataset.to, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "", t0 = performance.now(), dur = D.still ? 1 : 1800;
    const run = now => { const k = clamp((now - t0) / dur, 0, 1); el.textContent = pre + (k >= 1 ? to : Math.round(to * (1 - Math.pow(2, -10 * k)))) + suf; if (k < 1) requestAnimationFrame(run); else { el.dataset.done = 1; S.blip(880); } };
    requestAnimationFrame(run);
  }), { threshold: .4 });
  $$(".count").forEach(el => cio.observe(el));

  /* scroll progress */
  const prog = $("#progress");
  addEventListener("scroll", () => { const H = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${H > 0 ? scrollY / H : 0})`; }, { passive: true });

  /* ---------------- chrome ---------------- */
  const clock = $("#clock");
  const tc = () => clock.textContent = "UTC+8 " + new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Shanghai", hour12: false });
  tc(); setInterval(tc, 1000);

  $("#sndBtn").addEventListener("click", () => D.setSound(!A.on));
  const setX = v => { document.body.classList.toggle("xray", v); $("#xrayBtn").setAttribute("aria-pressed", v); S.whoosh(v); };
  $("#xrayBtn").addEventListener("click", () => setX(!document.body.classList.contains("xray")));
  const setStill = v => { D.still = v; document.body.classList.toggle("still", v); const b = $("#motBtn"); b.setAttribute("aria-pressed", v); b.querySelector("b").textContent = v ? "OFF" : "ON"; };
  $("#motBtn").addEventListener("click", () => setStill(!D.still));
  setStill(D.still);

  // rail scroll-spy
  const rail = $$(".rail a"), secs = $$("[data-sec]");
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) rail.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  secs.forEach(s => spy.observe(s));

  // glitch titles + reveals
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const t = e.target;
    if (t.matches("[data-glitch]")) { t.classList.add("glitching"); setTimeout(() => t.classList.remove("glitching"), 700); S.noise(.12, 1800, .8, .05); }
    if (t.matches("[data-exp], .feat, .bars")) t.classList.add("in");
    rio.unobserve(t);
  }), { threshold: .3 });
  $$("[data-glitch], [data-exp], .feat, .bars").forEach(el => rio.observe(el));

  // scroll velocity skew
  let lastY = scrollY, skew = 0;
  (function sk() {
    const v = scrollY - lastY; lastY = scrollY;
    skew = lerp(skew, clamp(v * -.12, -8, 8), .12);
    document.documentElement.style.setProperty("--skew", (D.still ? 0 : skew).toFixed(2) + "deg");
    requestAnimationFrame(sk);
  })();

  // tab title
  document.addEventListener("visibilitychange", () => { document.title = document.hidden ? "📡 … · dreaming66" : D.t("doc.title"); });

  /* language chip + things that need a nudge after switching */
  $("#langBtn").addEventListener("click", () => { I18N.next(); S.blip(880); });
  document.addEventListener("d66lang", () => {
    $$(".count").forEach(el => { if (el.dataset.done) el.textContent = (el.dataset.prefix || "") + el.dataset.to + (el.dataset.suffix || ""); });
    $$("[data-glitch]").forEach(t => { t.classList.add("glitching"); setTimeout(() => t.classList.remove("glitching"), 700); });
  });

  // fps + main loop
  let last = performance.now(), fa = 0, fn = 0;
  const fpsEl = $("#fps");
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!D.still) D.T += dt;
    fa += dt; fn++; if (fa > .5) { fpsEl.textContent = Math.round(fn / fa) + "FPS"; fa = fn = 0; }
    for (const l of loops) if (l.vis) l.tick(D.still ? 0 : dt, D.T);
    requestAnimationFrame(frame);
  }

  /* ---------------- terminal ---------------- */
  const term = $("#term"), tb = $("#termBody"), ti = $("#termInput");
  const hist = []; let hi = -1;
  const print = D.print = h => { tb.insertAdjacentHTML("beforeend", h + "\n"); tb.scrollTop = tb.scrollHeight; };
  const go = sel => { setTerm(false); $(sel).scrollIntoView({ behavior: "smooth" }); };
  const cmds = {
    help: () => D.t("term.help"),
    whoami: () => D.t("term.whoami"),
    aura: () => { go("#aura"); return "→ §03 AuraCore cluster"; },
    "kubectl get nodes": () => `NAME            STATUS   ROLES                  ARCH
auracore-head   <span class="g">Ready</span>    control-plane,master   arm64
auracore-w1     <span class="g">Ready</span>    &lt;none&gt;                 arm64
auracore-w2     <span class="g">Ready</span>    &lt;none&gt;                 arm64
auracore-w3     <span class="g">Ready</span>    &lt;none&gt;                 arm64
auracore-w4     <span class="g">Ready</span>    &lt;none&gt;                 arm64`,
    neofetch: () => `<span class="p">   ┌──────┐   </span><span class="g">dreaming66</span>@<span class="g">drm-66</span>
<span class="p"> ──┤ ▣▣▣▣ ├── </span>Board: AuraCore V2.0 (H616, 6L)
<span class="p"> ──┤ ▣<span class="y">██</span>▣ ├── </span>Kernel: curiosity-6.6
<span class="p"> ──┤ ▣▣▣▣ ├── </span>Uptime: since 2021
<span class="p">   └──────┘   </span>Shell: zsh · Editor: whatever works
              Next: RK3576 · 38×38 mm · 6 TOPS
              Robot: BHL-based · FOC · MJX
              RF: ZYNQ-7010 + AD936x · BH3FWY
              Strings: electric · J-rock · Keys: learning`,
    ls: () => `auracore/  rk3576/  homelab/  inference/  robot/  sdr/  archive/  guitar.wav  <span class="d">.secrets</span>`,
    "cat .secrets": () => `<span class="r">permission denied</span> · redacted`,
    "uname -a": () => `Linux drm-66 6.6.66-dreaming #1 SMP PREEMPT armv7l GNU/Linux`,
    build: () => { go("#build"); return "→ §02 hardware bring-up"; },
    sdr: () => { go("#exp-sdr"); document.dispatchEvent(new CustomEvent("d66tune", { detail: 145.66 })); return "→ tuning 145.660 MHz…"; },
    infer: () => { go("#lab"); return "→ §03 inference lab"; },
    cq: () => { if (!A.on) return D.t("term.nosound"); const d = S.morse("CQ CQ DE BH3FWY K", 22); return `-.-. --.- / -.-. --.- / -.. . / -... .... ...-- ..-. .-- -.-- / -.-  <span class="d">(${d.toFixed(1)}s)</span>`; },
    play: () => { if (!A.on) return D.t("term.nosound"); document.dispatchEvent(new Event("d66riff")); return "♪ ♫"; },
    matrix: () => { D.toggleMatrix(); return D.matrixOn ? "wake up, neo…" : "back."; },
    xray: () => { setX(!document.body.classList.contains("xray")); return "x-ray toggled."; },
    sound: () => { D.setSound(!A.on); return A.on ? "sound on." : "sound off."; },
    "sudo hire-me": () => `<span class="p">[sudo]</span> password for visitor: ********\n<span class="g">✔ access granted.</span> ${D.t("term.hire")}`,
    "lang zh": () => { I18N.set("zh"); return "language → 中文"; },
    "lang en": () => { I18N.set("en"); return "language → English"; },
    "lang ja": () => { I18N.set("ja"); return "language → 日本語"; },
    lang: () => `lang zh | en | ja · now: ${I18N.lang}`,
    sudo: () => `visitor is not in the sudoers file. This incident will be reported.`,
    clear: () => { tb.innerHTML = ""; return null; },
    exit: () => { setTerm(false); return null; },
  };
  const setTerm = open => { term.classList.toggle("open", open); term.setAttribute("aria-hidden", !open); S.whoosh(open); if (open) setTimeout(() => ti.focus(), 40); };
  print(`<span class="d">${D.t("term.hello")}</span> <span class="p">help</span>`);
  $("#termBtn").addEventListener("click", () => setTerm(!term.classList.contains("open")));
  $("#termClose").addEventListener("click", () => setTerm(false));
  $("#termForm").addEventListener("submit", e => {
    e.preventDefault(); const v = ti.value.trim(); ti.value = ""; if (!v) return;
    hist.unshift(v); hi = -1; const safe = v.replace(/[<>&]/g, "");
    print(`<span class="p">$</span> ${safe}`);
    const fn = cmds[v.toLowerCase()];
    const r = fn ? fn() : `${D.t("term.notfound")} ${safe} · ${D.t("term.try")} <span class="p">help</span>`;
    if (r) print(r);
  });
  ti.addEventListener("keydown", e => {
    if (e.key.length === 1) S.tone(rand(1800, 2400), .012, "square", .025);
    if (e.key === "ArrowUp") { hi = Math.min(hist.length - 1, hi + 1); ti.value = hist[hi] || ""; e.preventDefault(); }
    if (e.key === "ArrowDown") { hi = Math.max(-1, hi - 1); ti.value = hist[hi] || ""; e.preventDefault(); }
    if (e.key === "Escape") setTerm(false);
  });

  /* ---------------- matrix + konami + shortcuts ---------------- */
  const mcv = $("#matrix"), mg = mcv.getContext("2d"); let drops = [];
  D.matrixOn = false;
  D.toggleMatrix = force => {
    D.matrixOn = force ?? !D.matrixOn; mcv.classList.toggle("on", D.matrixOn);
    if (D.matrixOn) { mcv.width = innerWidth; mcv.height = innerHeight; drops = Array(Math.ceil(innerWidth / 16)).fill(0).map(() => rand(-40, 0)); ml(); }
  };
  function ml() {
    if (!D.matrixOn) { mg.clearRect(0, 0, mcv.width, mcv.height); return; }
    mg.fillStyle = "rgba(10,11,10,.13)"; mg.fillRect(0, 0, mcv.width, mcv.height);
    mg.font = "15px IBM Plex Mono, monospace";
    const set = "01BH3FWY推理焊锡张量ΣΔ∇KVQ.-";
    drops.forEach((y, i) => { mg.fillStyle = Math.random() < .04 ? C.amb : C.ok; mg.fillText(set[(Math.random() * set.length) | 0], i * 16, y * 16); drops[i] = y * 16 > mcv.height && Math.random() > .975 ? 0 : y + 1; });
    requestAnimationFrame(ml);
  }
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]; let kp = 0;
  addEventListener("keydown", e => {
    if (document.body.classList.contains("gated")) return;
    const field = e.target.matches("input, textarea");
    kp = e.key === konami[kp] ? kp + 1 : (e.key === konami[0] ? 1 : 0);
    if (kp === konami.length) { kp = 0; document.body.classList.add("shake"); S.zap(); D.toggleMatrix(true); setTimeout(() => { document.body.classList.remove("shake"); D.toggleMatrix(false); }, 5000); }
    if (field || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "`") { e.preventDefault(); setTerm(!term.classList.contains("open")); }
    else if (e.key === "Escape") { setTerm(false); D.setMenu && D.setMenu(false); }
    else if (e.key.toLowerCase() === "s" && !D.pianoFocus) D.setSound(!A.on);
    else if (e.key.toLowerCase() === "x" && !D.pianoFocus) setX(!document.body.classList.contains("xray"));
  });

  D.boot = () => {
    runGate();
    requestAnimationFrame(frame);
    console.log("%c dreaming66 %c 在看源码？按 ` 打开终端 · ↑↑↓↓←→←→BA · 呼号 BH3FWY", "background:#ff4f1f;color:#141412;font-weight:700;padding:3px 8px", "color:#8b8c84");
  };
})();
