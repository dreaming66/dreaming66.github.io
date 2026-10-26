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
  const C = { bg: "#0a0b0a", bg2: "#101210", bg3: "#171a17", fg: "#ebe7dc", dim: "#8b8c84", dim2: "#5a5c55", line: "#ffffff16", amb: "#ffb21a", sig: "#36e2ff", hot: "#ff4b2b", ok: "#a4ff5e" };

  const D = window.D66 = { $, $$, clamp, lerp, rand, DPR, fine, C, still: matchMedia("(prefers-reduced-motion: reduce)").matches, mx: -999, my: -999, T: 0 };

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
  D.onVisible = (el, fn, th = .3) => { const o = new IntersectionObserver(es => { if (es[0].isIntersecting) { o.disconnect(); fn(); } }, { threshold: th }); o.observe(el); };

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
  D.setSound = on => {
    if (on) { ainit(); A.ctx.resume(); }
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
    pluck(f, v = .3, bright = .5) {
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
      s.connect(fl); fl.connect(g); out(g, .35); s.start();
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
    ["NPU ........ 96 cards · HCCL ring up", "ok"],
    ["KV-CACHE ........ mooncake pool mounted", "ok"],
    ["RF FRONTEND ........ 144–146 MHz · DE BH3FWY", "ok"],
    ["SERVO BUS ........ biped gait policy: training", "w"],
    ["STRINGS ........ EADGBE in tune", "ok"],
    ["PRIVACY ........ phone / email / employer → REDACTED", "w"],
    ["AUDIO ........ WebAudio synth ready (awaiting user gesture)", "ok"],
  ];
  function runGate() {
    const el = $("#post"), choice = $("#gateChoice"); let i = 0;
    $("#gateClock").textContent = new Date().toISOString().slice(0, 19).replace("T", " ");
    const step = () => {
      if (i < post.length) {
        const [t, c] = post[i++];
        const m = t.match(/^(.*?)(\s\.{4,}\s)(.*)$/);
        el.innerHTML += m ? `${m[1]}<span class="d">${m[2]}</span><span class="${c}">${m[3]}</span>\n` : `<span class="${c}">${t}</span>\n`;
        setTimeout(step, D.still ? 0 : rand(60, 140));
      } else { el.innerHTML += "\n<span class=\"w\">▶ select boot mode</span>"; choice.classList.add("show"); $("#enterSound").focus({ preventScroll: true }); }
    };
    step();
    const enter = snd => {
      if (!document.body.classList.contains("gated")) return;
      if (snd) D.setSound(true);
      $("#gate").classList.add("off");
      $("#crt").classList.add("on");
      document.body.classList.remove("gated");
      document.body.classList.add("booted");
      setTimeout(() => { $("#gate").remove(); S.boot(); }, 300);
      document.dispatchEvent(new Event("d66boot"));
    };
    $("#enterSound").addEventListener("click", () => enter(true));
    $("#enterMute").addEventListener("click", () => enter(false));
    addEventListener("keydown", function k(e) {
      if (!document.body.classList.contains("gated")) return removeEventListener("keydown", k);
      if (e.key === "Enter") { e.preventDefault(); enter(true); }
      if (e.key.toLowerCase() === "m") enter(false);
    });
  }

  /* ---------------- probe cursor ---------------- */
  const probe = $(".probe"), pread = $("#pread");
  let px = 0, py = 0, lastTick = 0;
  addEventListener("pointermove", e => { D.mx = e.clientX; D.my = e.clientY; }, { passive: true });
  if (fine) {
    document.body.classList.add("probe-on");
    (function pl() {
      px = lerp(px, D.mx, .35); py = lerp(py, D.my, .35);
      probe.style.transform = `translate(${px}px,${py}px)`;
      pread.textContent = `x${String(Math.round(D.mx)).padStart(4, "0")} y${String(Math.round(D.my + scrollY)).padStart(5, "0")}`;
      requestAnimationFrame(pl);
    })();
    document.addEventListener("pointerover", e => {
      const t = e.target.closest("a,button,input,.mcu,label,canvas,.wk,.bk");
      probe.classList.toggle("hot", !!t && t.tagName !== "CANVAS");
      if (t && t.tagName !== "CANVAS" && performance.now() - lastTick > 60) { lastTick = performance.now(); S.tick(); }
    });
  }
  document.addEventListener("click", e => { if (e.target.closest("button, a")) S.click(); });

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
  const title0 = document.title;
  document.addEventListener("visibilitychange", () => { document.title = document.hidden ? "📡 信号丢失… · DRM-66" : title0; });

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
    help: () => `<span class="p">commands</span>
  whoami · neofetch · ls · uname -a
  build      去焊板子          sdr      去听信标
  cq         用摩尔斯拍发呼号  play     弹一段吉他
  infer      推理实验室        matrix   进入矩阵
  xray       透视模式          sound    开/关声音
  sudo hire-me · clear · exit`,
    whoami: () => `<span class="g">dreaming66</span> · maker / AI Infra engineer · DE <span class="p">BH3FWY</span>
画 PCB、编内核、跑大模型；在家手搓机器人、玩 SDR、弹吉他。`,
    neofetch: () => `<span class="p">   ┌──────┐   </span><span class="g">dreaming66</span>@<span class="g">drm-66</span>
<span class="p"> ──┤ ▣▣▣▣ ├── </span>OS: Buildroot (self-built)
<span class="p"> ──┤ ▣<span class="y">██</span>▣ ├── </span>Kernel: curiosity-6.6
<span class="p"> ──┤ ▣▣▣▣ ├── </span>Uptime: since 2021
<span class="p">   └──────┘   </span>Shell: zsh · Editor: whatever works
              CPU: STM32 / ESP32 / Cortex-A
              GPU: 96 × NPU (at work)
              RF: 144–146 MHz · BH3FWY
              Strings: EADGBE · Keys: learning`,
    ls: () => `hardware/  homelab/  inference/  robot/  sdr/  finetune/  guitar.wav  piano.wav(wip)  <span class="d">.secrets</span>`,
    "cat .secrets": () => `<span class="r">permission denied</span> · 隐私已抹除`,
    "uname -a": () => `Linux drm-66 6.6.66-dreaming #1 SMP PREEMPT armv7l GNU/Linux`,
    build: () => { go("#build"); return "→ §02 hardware bring-up"; },
    sdr: () => { go("#exp-sdr"); document.dispatchEvent(new CustomEvent("d66tune", { detail: 145.66 })); return "→ tuning 145.660 MHz…"; },
    infer: () => { go("#lab"); return "→ §03 inference lab"; },
    cq: () => { if (!A.on) return `<span class="r">sound is off</span> · 先输入 sound`; const d = S.morse("CQ CQ DE BH3FWY K", 22); return `-.-. --.- / -.-. --.- / -.. . / -... .... ...-- ..-. .-- -.-- / -.-  <span class="d">(${d.toFixed(1)}s)</span>`; },
    play: () => { if (!A.on) return `<span class="r">sound is off</span> · 先输入 sound`; document.dispatchEvent(new Event("d66riff")); return "♪ ♫"; },
    matrix: () => { D.toggleMatrix(); return D.matrixOn ? "wake up, neo…" : "back."; },
    xray: () => { setX(!document.body.classList.contains("xray")); return "x-ray toggled."; },
    sound: () => { D.setSound(!A.on); return A.on ? "sound on." : "sound off."; },
    "sudo hire-me": () => `<span class="p">[sudo]</span> password for visitor: ********\n<span class="g">✔ access granted.</span> 请移步 <a href="https://github.com/dreaming66" target="_blank" rel="noopener" style="text-decoration:underline">github.com/dreaming66</a>，期待交流。`,
    sudo: () => `visitor is not in the sudoers file. This incident will be reported.`,
    clear: () => { tb.innerHTML = ""; return null; },
    exit: () => { setTerm(false); return null; },
  };
  const setTerm = open => { term.classList.toggle("open", open); term.setAttribute("aria-hidden", !open); S.whoosh(open); if (open) setTimeout(() => ti.focus(), 40); };
  print(`<span class="d">DRM-66 tty0 · 输入</span> <span class="p">help</span>`);
  $("#termBtn").addEventListener("click", () => setTerm(!term.classList.contains("open")));
  $("#termClose").addEventListener("click", () => setTerm(false));
  $("#termForm").addEventListener("submit", e => {
    e.preventDefault(); const v = ti.value.trim(); ti.value = ""; if (!v) return;
    hist.unshift(v); hi = -1; const safe = v.replace(/[<>&]/g, "");
    print(`<span class="p">$</span> ${safe}`);
    const fn = cmds[v.toLowerCase()];
    const r = fn ? fn() : `<span class="r">command not found:</span> ${safe} · 试试 <span class="p">help</span>`;
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
    else if (e.key === "Escape") setTerm(false);
    else if (e.key.toLowerCase() === "s" && !D.pianoFocus) D.setSound(!A.on);
    else if (e.key.toLowerCase() === "x" && !D.pianoFocus) setX(!document.body.classList.contains("xray"));
  });

  D.boot = () => {
    runGate();
    requestAnimationFrame(frame);
    console.log("%c DRM-66 %c 在看源码？按 ` 打开终端 · ↑↑↓↓←→←→BA · 呼号 BH3FWY", "background:#ffb21a;color:#0a0b0a;font-weight:700;padding:3px 8px", "color:#8b8c84");
  };
})();
