/* ==========================================================
   DRM-66 · labs: every canvas on the page
   ========================================================== */
(() => {
  "use strict";
  const D = window.D66, { $, $$, clamp, lerp, rand, DPR, C, sfx: S } = D;
  const ctx2d = cv => cv.getContext("2d");
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };
  const visible = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

  /* =========================================================
     HERO · generative die shot
     ========================================================= */
  function initDie() {
    const cv = $("#die"), g = ctx2d(cv);
    const off = document.createElement("canvas"), og = ctx2d(off);
    let W = 0, H = 0, G = 26, blocks = [], traces = [], pulses = [];
    const names = ["CUBE", "VECTOR", "HBM0", "HBM1", "L2$", "HCCS", "PCIe", "DMA", "NoC", "SRAM", "ISP", "UART", "GPIO", "PLL", "DDR", "RF", "SERVO", "DSP", "KV$", "MCU"];
    function build() {
      W = cv.width / DPR; H = cv.height / DPR; G = W < 700 ? 20 : 26;
      const cols = Math.ceil(W / G), rows = Math.ceil(H / G);
      const occ = new Uint8Array(cols * rows);
      blocks = [];
      for (let k = 0; k < 400 && blocks.length < 26; k++) {
        const w = 2 + (Math.random() * 7 | 0), h = 2 + (Math.random() * 5 | 0);
        const x = Math.random() * (cols - w - 2) + 1 | 0, y = Math.random() * (rows - h - 2) + 1 | 0;
        let free = true;
        for (let i = x - 1; i <= x + w && free; i++) for (let j = y - 1; j <= y + h; j++) if (occ[j * cols + i]) { free = false; break; }
        if (!free) continue;
        for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) occ[j * cols + i] = 1;
        blocks.push({ x, y, w, h, name: names[blocks.length % names.length], hot: 0, kind: Math.random() < .3 ? 1 : 0 });
      }
      traces = [];
      const port = b => { const s = Math.random() * 4 | 0; return s === 0 ? [b.x + (Math.random() * b.w | 0), b.y - 1] : s === 1 ? [b.x + b.w, b.y + (Math.random() * b.h | 0)] : s === 2 ? [b.x + (Math.random() * b.w | 0), b.y + b.h] : [b.x - 1, b.y + (Math.random() * b.h | 0)]; };
      for (let k = 0; k < blocks.length * 3; k++) {
        const a = blocks[Math.random() * blocks.length | 0], b = blocks[Math.random() * blocks.length | 0]; if (a === b) continue;
        const [x0, y0] = port(a), [x1, y1] = port(b);
        const mid = Math.random() < .5;
        const pts = mid ? [[x0, y0], [x1, y0], [x1, y1]] : [[x0, y0], [x0, (y0 + y1) / 2 | 0], [x1, (y0 + y1) / 2 | 0], [x1, y1]];
        const P = pts.map(([x, y]) => [x * G + G / 2, y * G + G / 2]);
        let len = 0; for (let i = 1; i < P.length; i++) len += Math.abs(P[i][0] - P[i - 1][0]) + Math.abs(P[i][1] - P[i - 1][1]);
        traces.push({ P, len, lit: 0 });
      }
      off.width = cv.width; off.height = cv.height; og.setTransform(DPR, 0, 0, DPR, 0, 0);
      og.fillStyle = C.bg; og.fillRect(0, 0, W, H);
      og.fillStyle = "#ffffff10"; for (let x = 0; x < W; x += G) for (let y = 0; y < H; y += G) og.fillRect(x + G / 2, y + G / 2, 1, 1);
      og.lineWidth = 1; og.strokeStyle = "#ffb21a2e";
      for (const t of traces) { og.beginPath(); t.P.forEach(([x, y], i) => i ? og.lineTo(x, y) : og.moveTo(x, y)); og.stroke(); og.fillStyle = "#ffb21a55"; for (const [x, y] of [t.P[0], t.P[t.P.length - 1]]) og.fillRect(x - 2, y - 2, 4, 4); }
      og.font = "500 9px IBM Plex Mono, monospace";
      for (const b of blocks) {
        const x = b.x * G, y = b.y * G, w = b.w * G, h = b.h * G;
        og.fillStyle = b.kind ? "#36e2ff0c" : "#ffffff07"; og.fillRect(x, y, w, h);
        og.strokeStyle = b.kind ? "#36e2ff40" : "#ffffff26"; og.strokeRect(x + .5, y + .5, w - 1, h - 1);
        // inner texture: memory arrays or logic hatch
        og.strokeStyle = b.kind ? "#36e2ff18" : "#ffffff0d";
        og.beginPath();
        if (b.kind) for (let yy = y + 6; yy < y + h - 4; yy += 4) { og.moveTo(x + 4, yy); og.lineTo(x + w - 4, yy); }
        else for (let xx = x + 6; xx < x + w - 4; xx += 7) { og.moveTo(xx, y + 4); og.lineTo(xx, y + h - 4); }
        og.stroke();
        og.fillStyle = "#8b8c84"; og.fillText(b.name, x + 5, y + 12);
      }
    }
    const at = (t, s) => {
      let d = s; for (let i = 1; i < t.P.length; i++) { const a = t.P[i - 1], b = t.P[i]; const L = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]); if (d <= L) { const k = L ? d / L : 0; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; } d -= L; }
      return t.P[t.P.length - 1];
    };
    const spawn = (t, c = Math.random() < .2 ? C.sig : C.amb) => pulses.push({ t, s: 0, v: rand(160, 420), c });
    cv.addEventListener("pointerdown", e => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const near = traces.map(t => ({ t, d: Math.min(...t.P.map(([px, py]) => Math.hypot(px - x, py - y))) })).sort((a, b) => a.d - b.d).slice(0, 18);
      near.forEach(n => { spawn(n.t, C.sig); n.t.lit = 1; });
      for (const b of blocks) if (Math.hypot((b.x + b.w / 2) * G - x, (b.y + b.h / 2) * G - y) < 260) b.hot = 1;
      S.zap();
    });
    let acc = 0;
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) build();
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(off, 0, 0); g.setTransform(DPR, 0, 0, DPR, 0, 0);
      const r = cv.getBoundingClientRect(), mx = D.mx - r.left, my = D.my - r.top;
      acc += dt; while (acc > .06) { acc -= .06; if (pulses.length < 160) spawn(traces[Math.random() * traces.length | 0]); }
      // hot blocks near probe
      g.font = "500 9px IBM Plex Mono, monospace";
      for (const b of blocks) {
        const x = b.x * G, y = b.y * G, w = b.w * G, h = b.h * G;
        const inside = mx > x && mx < x + w && my > y && my < y + h;
        if (inside) b.hot = Math.max(b.hot, .6);
        if (b.hot > .01) {
          g.fillStyle = `rgba(255,178,26,${b.hot * .14})`; g.fillRect(x, y, w, h);
          g.strokeStyle = `rgba(255,178,26,${b.hot})`; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
          if (inside) { g.fillStyle = C.amb; g.fillText(`${b.name} · ${(40 + Math.sin(T * 3 + b.x) * 30 + 30).toFixed(0)}% · ${(0.8 + b.y * .01).toFixed(2)}V`, x + 5, y + h - 6); }
          b.hot *= Math.pow(.2, dt);
        }
      }
      g.globalCompositeOperation = "lighter";
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.s += p.v * dt;
        if (p.s > p.t.len) { pulses.splice(i, 1); continue; }
        const [x, y] = at(p.t, p.s), [x2, y2] = at(p.t, Math.max(0, p.s - 26));
        const gr = g.createLinearGradient(x2, y2, x, y); gr.addColorStop(0, "transparent"); gr.addColorStop(1, p.c);
        g.strokeStyle = gr; g.lineWidth = 2; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x, y); g.stroke();
        g.fillStyle = p.c; g.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
      // probe halo
      if (mx > 0 && my > 0 && mx < W && my < H) {
        const rg = g.createRadialGradient(mx, my, 0, mx, my, 160); rg.addColorStop(0, "#ffb21a22"); rg.addColorStop(1, "transparent");
        g.fillStyle = rg; g.fillRect(mx - 160, my - 160, 320, 320);
      }
      g.globalCompositeOperation = "source-over";
    });
    // name: per-letter jitter on hover
    const name = $("#name");
    const txt = "DREAMING"; name.innerHTML = [...txt].map(c => `<span class="c">${c}</span>`).join("") + `<span>${[..."66"].map(c => `<span class="c">${c}</span>`).join("")}</span>`;
    $$(".c", name).forEach((s, i) => {
      s.style.pointerEvents = "auto";
      s.addEventListener("pointerenter", () => { if (D.still) return; s.style.transform = `translateY(${rand(-14, -4)}px) rotate(${rand(-8, 8)}deg)`; s.style.color = i % 3 ? C.sig : C.hot; S.tone(220 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19, 21][i] / 12), .18, "triangle", .08, .4); setTimeout(() => { s.style.transform = ""; s.style.color = ""; }, 380); });
    });
  }

  /* =========================================================
     logic analyzer bus
     ========================================================= */
  function initBus() {
    const cv = $("#bus"), g = ctx2d(cv); let W = 0, H = 0, off = 0;
    const rows = [["CLK", C.amb], ["UART_TX", C.ok], ["CW_KEY", C.sig], ["IRQ", C.hot]];
    const bits = (seed, n) => { let s = seed, a = []; for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; a.push(s >> 16 & 1); } return a; };
    const pattern = [bits(1, 400), bits(7, 400), bits(13, 400)];
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      off += dt * 60;
      const rh = H / rows.length, step = 12;
      g.font = "500 9px IBM Plex Mono, monospace";
      rows.forEach(([name, col], r) => {
        const y0 = r * rh + rh * .2, y1 = r * rh + rh * .8;
        g.strokeStyle = col; g.lineWidth = 1.2; g.globalAlpha = .85; g.beginPath();
        let prev = null;
        for (let x = 70; x < W + step; x += step) {
          const i = Math.floor((x + off) / step);
          let v = r === 0 ? i & 1 : r === 3 ? (i % 53 === 0 ? 1 : 0) : pattern[r - 1][i % 400];
          const y = v ? y0 : y1;
          if (prev === null) g.moveTo(x, y); else { g.lineTo(x, prev); g.lineTo(x, y); }
          g.lineTo(x + step, y); prev = y;
        }
        g.stroke(); g.globalAlpha = 1;
        g.fillStyle = C.bg; g.fillRect(0, r * rh, 66, rh); g.fillStyle = C.dim; g.fillText(name, 12, r * rh + rh / 2 + 3);
      });
      g.strokeStyle = C.line; g.beginPath(); g.moveTo(66.5, 0); g.lineTo(66.5, H); g.stroke();
    });
  }

  /* =========================================================
     §01 streaming text
     ========================================================= */
  function initGen() {
    const el = $("#genOut"), stat = $("#genStat");
    const text = "你好，我是 dreaming66。白天，我在国产算力集群上部署和调优大模型，盯着 TTFT 和 TPOT；晚上，我画原理图、焊板子、编内核，在家手搓一台双足机器人，用 SDR 收听天上的信号——呼号 BH3FWY。偶尔弹吉他，正在学钢琴。我相信：理解一个系统最好的方式，是亲手把它从零搭起来。";
    const keys = ["大模型", "TTFT", "TPOT", "焊板子", "编内核", "双足机器人", "SDR", "BH3FWY", "吉他", "钢琴", "从零搭起来"];
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
    let W = 0, H = 0, pads = [], parts = [], traces = [], smoke = [], down = false, powered = false, ledOn = 0, built = false;
    const setFlow = n => flow.forEach((li, i) => { li.classList.toggle("done", i < n); li.classList.toggle("cur", i === n); });
    setFlow(2);
    function build() {
      W = cv.width / DPR; H = cv.height / DPR; const s = Math.min(W / 640, H / 460);
      const old = new Set(pads.filter(p => p.on).map(p => p.id));
      pads = []; parts = []; traces = [];
      const ox = (W - 640 * s) / 2, oy = (H - 420 * s) / 2 - 16;
      const P = (x, y) => [ox + x * s, oy + y * s];
      const addPart = (name, x, y, w, h, padsFn, label) => { const [px, py] = P(x, y); parts.push({ name, x: px, y: py, w: w * s, h: h * s, label }); padsFn && padsFn(px, py, w * s, h * s); };
      const pad = (x, y, w, h) => pads.push({ id: pads.length, x, y, w, h, on: false, t: 0 });
      // SoC (QFP-ish)
      addPart("SoC", 230, 130, 120, 120, (x, y, w, h) => { const n = 14, st = w / (n + 1); for (let i = 1; i <= n; i++) { pad(x + i * st - 2, y - 10, 4, 8); pad(x + i * st - 2, y + h + 2, 4, 8); pad(x - 10, y + i * st - 2, 8, 4); pad(x + w + 2, y + i * st - 2, 8, 4); } }, "SoC");
      // DDR x2
      [[400, 120], [400, 200]].forEach(([x, y], k) => addPart("DDR" + k, x, y, 70, 50, (px, py, w, h) => { for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) pad(px + 8 + i * (w - 16) / 5 - 2, py + 10 + j * (h - 20) / 2 - 2, 5, 5); }, "DDR3"));
      addPart("PMIC", 110, 140, 60, 60, (x, y, w, h) => { for (let i = 0; i < 6; i++) { pad(x - 8, y + 6 + i * 9, 6, 4); pad(x + w + 2, y + 6 + i * 9, 6, 4); } }, "PMIC");
      addPart("FLASH", 110, 250, 70, 40, (x, y, w, h) => { for (let i = 0; i < 4; i++) { pad(x + 8 + i * 17, y - 8, 5, 7); pad(x + 8 + i * 17, y + h + 1, 5, 7); } }, "SPI NOR");
      addPart("XTAL", 250, 290, 40, 18, (x, y, w, h) => { pad(x - 8, y + 4, 6, 10); pad(x + w + 2, y + 4, 6, 10); }, "24MHz");
      addPart("USB", 30, 60, 40, 50, (x, y, w, h) => { for (let i = 0; i < 6; i++) pad(x + w + 2, y + 5 + i * 7, 7, 4); }, "USB-C");
      addPart("ETH", 520, 290, 80, 70, (x, y, w, h) => { for (let i = 0; i < 8; i++) pad(x - 9, y + 6 + i * 7.5, 7, 4); }, "RJ45");
      addPart("HDR", 120, 360, 300, 22, (x, y, w, h) => { for (let i = 0; i < 20; i++) { pad(x + 6 + i * 14.6, y + 3, 7, 7); pad(x + 6 + i * 14.6, y + 12, 7, 7); } }, "GPIO 2×20");
      addPart("LED", 520, 60, 14, 10, (x, y, w, h) => { pad(x - 6, y + 2, 5, 6); pad(x + w + 1, y + 2, 5, 6); }, "PWR");
      addPart("UART", 520, 110, 50, 16, (x, y, w, h) => { for (let i = 0; i < 3; i++) pad(x + 6 + i * 15, y + 4, 8, 8); }, "UART");
      // passives row
      for (let i = 0; i < 10; i++) { const [x, y] = P(200 + i * 18, 320); pads.push({ id: pads.length, x, y, w: 4, h: 4, on: false, t: 0 }); pads.push({ id: pads.length, x, y: y + 8 * s, w: 4, h: 4, on: false, t: 0 }); parts.push({ name: "C", x: x - 1, y: y + 4, w: 6, h: 4 * s, cap: true }); }
      // decorative traces between random pads
      for (let k = 0; k < 70; k++) {
        const a = pads[Math.random() * pads.length | 0], b = pads[Math.random() * pads.length | 0];
        const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
        const mx = Math.random() < .5 ? ax : bx;
        traces.push([[ax, ay], [mx, ay + (by - ay) * .5], [mx, by], [bx, by]]);
      }
      pads.forEach(p => { if (old.has(p.id)) p.on = true; });
      built = true; upd();
    }
    const upd = () => {
      const n = pads.filter(p => p.on).length; cnt.textContent = `${n} / ${pads.length} joints`;
      if (n === pads.length && pwr.disabled && !powered) { pwr.disabled = false; setFlow(3); S.chord([523, 659, 784], .06, "triangle", .07); }
    };
    const solderAt = (x, y, rad = 9) => {
      let hit = 0;
      for (const p of pads) if (!p.on && x > p.x - rad && x < p.x + p.w + rad && y > p.y - rad && y < p.y + p.h + rad) { p.on = true; p.t = 1; hit++; for (let k = 0; k < 3; k++) smoke.push({ x: p.x + p.w / 2, y: p.y, vx: rand(-8, 8), vy: rand(-30, -14), a: .7, r: rand(3, 6) }); }
      if (hit) { S.sizzle(); upd(); }
    };
    const loc = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener("pointerdown", e => { down = true; cv.setPointerCapture(e.pointerId); solderAt(...loc(e)); });
    cv.addEventListener("pointermove", e => { if (down) solderAt(...loc(e)); });
    cv.addEventListener("pointerup", () => down = false);
    $("#autoSolder").addEventListener("click", () => {
      const left = pads.filter(p => !p.on).sort((a, b) => a.x - b.x); let i = 0;
      const tm = setInterval(() => { for (let k = 0; k < 6 && i < left.length; k++, i++) { left[i].on = true; left[i].t = 1; smoke.push({ x: left[i].x, y: left[i].y, vx: rand(-6, 6), vy: rand(-26, -10), a: .5, r: 4 }); } if (i % 18 < 6) S.sizzle(); upd(); if (i >= left.length) clearInterval(tm); }, 30);
    });

    // serial boot
    const boot = [
      [0, "", "U-Boot SPL 2024.01 (DRM-66 EVB rev.A)"], [80, "", "DRAM:  512 MiB"], [60, "", "Trying to boot from SPI"],
      [300, "w", "\nU-Boot 2024.01-drm66 (Oct 25 2026)\n"], [50, "", "CPU:   ARMv7 Processor @ 1.2GHz"], [50, "", "Model: DRM-66 EVB"], [50, "", "DRAM:  512 MiB"],
      [60, "", "MMC:   mmc@1c0f000: 0"], [60, "", "Loading Environment from SPIFlash... OK"], [80, "", "Net:   eth0: ethernet@1c30000"], [120, "y", "Hit any key to stop autoboot:  1 "], [700, "y", "Hit any key to stop autoboot:  0 "],
      [80, "", "reading zImage\n5021696 bytes read in 236 ms"], [60, "c", "reading drm66-evb.dtb\n24581 bytes read in 4 ms"], [80, "", "Kernel image @ 0x42000000 [ 0x000000 - 0x4ca000 ]"], [80, "c", "## Flattened Device Tree blob at 43000000\n   Loading Device Tree to 49ff7000, end 49ffffff ... OK"],
      [300, "w", "\nStarting kernel ...\n"], [200, "", "[    0.000000] Booting Linux on physical CPU 0x0"], [40, "", "[    0.000000] Linux version 6.6.66-dreaming (dreaming66@drm-66) (arm-buildroot-linux-gnueabihf-gcc 13.2.0) #1 SMP PREEMPT"],
      [40, "c", "[    0.000000] OF: fdt: Machine model: DRM-66 EVB rev.A"], [40, "", "[    0.000000] Memory: 494712K/524288K available"], [60, "", "[    0.081920] CPU0: thread -1, cpu 0, socket 0, mpidr 80000000"],
      [60, "", "[    0.314159] gpio-leds: probed"], [60, "", "[    0.420000] dwmac-sun8i 1c30000.ethernet eth0: PHY [stmmac-0:01] driver [Generic PHY]"], [60, "", "[    0.666666] mmc0: new high speed SDHC card at address aaaa"],
      [80, "", "[    1.024000] EXT4-fs (mmcblk0p2): mounted filesystem with ordered data mode"], [60, "", "[    1.100000] Run /sbin/init as init process"],
      [200, "", "Starting syslogd: OK\nStarting klogd: OK\nRunning sysctl: OK\nStarting network: OK\nStarting dropbear sshd: OK"],
      [300, "w", "\nWelcome to Buildroot · DRM-66"],
    ];
    const stageAt = i => i < 3 ? 4 : i < 16 ? 4 : i < 27 ? 5 : 6;
    const pr = (cls, t) => { outEl.insertAdjacentHTML("beforeend", (cls ? `<span class="${cls}">${t}</span>` : t) + "\n"); outEl.scrollTop = outEl.scrollHeight; };
    pwr.addEventListener("click", () => {
      if (powered) return; powered = true; pwr.disabled = true; outEl.textContent = ""; state.textContent = "CONNECTED"; state.classList.add("live");
      S.thud(.2); S.tone(55, .4, "sine", .1);
      let i = 0;
      const nx = () => {
        if (i >= boot.length) {
          setFlow(7); S.chord([392, 523, 659, 784], .08, "sine", .08);
          outEl.insertAdjacentHTML("beforeend", `drm-66 login: <input id="login" aria-label="login" autocomplete="off" spellcheck="false">`); const inp = $("#login");
          inp.focus({ preventScroll: true }); shell(inp); return;
        }
        const [d, c, t] = boot[i]; setFlow(stageAt(i)); i++;
        setTimeout(() => { pr(c, t); S.tone(rand(1500, 2200), .01, "square", .02); nx(); }, D.still ? 0 : d);
      };
      nx();
    });
    function shell(inp) {
      inp.addEventListener("keydown", e => {
        if (e.key.length === 1) S.tone(rand(1800, 2400), .01, "square", .02);
        if (e.key !== "Enter") return;
        const v = inp.value.trim(); inp.replaceWith(document.createTextNode(v + "\n"));
        pr("", v === "root" ? "" : "(any user is root on this board)"); pr("w", "# 输入 help 试试");
        prompt();
      });
    }
    const prompt = () => { outEl.insertAdjacentHTML("beforeend", `# <input aria-label="shell" autocomplete="off" spellcheck="false">`); const n = outEl.lastElementChild; n.focus({ preventScroll: true }); outEl.scrollTop = outEl.scrollHeight; shellLogged(n); };
    function shellLogged(inp) {
      inp.addEventListener("keydown", e => {
        if (e.key.length === 1) S.tone(rand(1800, 2400), .01, "square", .02);
        if (e.key !== "Enter") return;
        const v = inp.value.trim(); inp.replaceWith(document.createTextNode(v + "\n"));
        const map = { help: "help · uname -a · cat /proc/cpuinfo · ls · led · whoami · poweroff", "uname -a": "Linux drm-66 6.6.66-dreaming #1 SMP PREEMPT armv7l GNU/Linux", "cat /proc/cpuinfo": "processor\t: 0\nmodel name\t: ARMv7 Processor rev 5 (v7l)\nBogoMIPS\t: 66.66\nHardware\t: DRM-66 EVB (Flattened Device Tree)", ls: "bin  dev  etc  home  lib  proc  root  sys  tmp  usr  var", whoami: "root (but really: dreaming66)" };
        if (v === "poweroff") { pr("y", "The system is going down NOW!\nreboot: Power down"); powered = false; ledOn = 0; state.textContent = "NO CARRIER"; state.classList.remove("live"); pwr.disabled = false; setFlow(3); S.whoosh(false); return; }
        if (v === "led") { ledOn = 2; pr("", "echo heartbeat > /sys/class/leds/pwr/trigger"); }
        else if (v) pr("", map[v] || `-sh: ${v.replace(/[<>&]/g, "")}: not found`);
        prompt();
      });
    }
    pr("", "<span class=\"y\">[ board unpowered ]</span>\n先把焊盘焊好，再按 POWER ON。");

    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !built) build();
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      // board
      const b = parts.length ? [Math.min(...parts.map(p => p.x)) - 26, Math.min(...parts.map(p => p.y)) - 26] : [0, 0];
      const bw = Math.max(...parts.map(p => p.x + p.w)) - b[0] + 26, bh = Math.max(...parts.map(p => p.y + p.h)) - b[1] + 26;
      g.fillStyle = "#0f3a24"; rr(g, b[0], b[1], bw, bh, 12); g.fill();
      g.strokeStyle = "#1b5a38"; g.lineWidth = 2; g.stroke();
      [[b[0] + 12, b[1] + 12], [b[0] + bw - 12, b[1] + 12], [b[0] + 12, b[1] + bh - 12], [b[0] + bw - 12, b[1] + bh - 12]].forEach(([x, y]) => { g.fillStyle = "#c8a24a"; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = "#0a0b0a"; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); });
      g.strokeStyle = "#2a7a4c"; g.lineWidth = 1.2;
      for (const t of traces) { g.beginPath(); t.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }
      g.font = "600 9px IBM Plex Mono, monospace";
      for (const p of parts) {
        if (p.cap) { g.fillStyle = "#b08a5a"; g.fillRect(p.x, p.y, p.w, p.h); continue; }
        g.fillStyle = p.name === "ETH" || p.name === "USB" ? "#9a9d98" : p.name === "HDR" ? "#111" : "#1a1c1a"; g.fillRect(p.x, p.y, p.w, p.h);
        g.fillStyle = "#e8e4d8cc"; g.fillText(p.label || p.name, p.x + 4, p.y + 12);
        if (p.name === "LED") { const on = powered && (ledOn === 2 ? (Math.sin(T * 9) > .5 || Math.sin(T * 9 + .9) > .9) : true); g.fillStyle = on ? C.hot : "#3a1a14"; g.fillRect(p.x, p.y, p.w, p.h); if (on) { g.shadowColor = C.hot; g.shadowBlur = 18; g.fillRect(p.x, p.y, p.w, p.h); g.shadowBlur = 0; } }
      }
      g.fillStyle = "#e8e4d8aa"; g.fillText("DRM-66 EVB rev.A · designed & hand-soldered by dreaming66", b[0] + 22, b[1] + bh - 10);
      for (const p of pads) {
        if (p.on) {
          const gr = g.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h); gr.addColorStop(0, "#f4f4f0"); gr.addColorStop(1, "#8d9290");
          g.fillStyle = gr; rr(g, p.x - .5, p.y - .5, p.w + 1, p.h + 1, 1.5); g.fill();
          if (p.t > 0) { g.fillStyle = `rgba(255,178,26,${p.t})`; g.fillRect(p.x - 1, p.y - 1, p.w + 2, p.h + 2); p.t -= dt * 2.5; }
        } else { g.fillStyle = "#c8873a"; g.fillRect(p.x, p.y, p.w, p.h); }
      }
      for (let i = smoke.length - 1; i >= 0; i--) { const s = smoke[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.r += dt * 10; s.a -= dt * .7; if (s.a <= 0) { smoke.splice(i, 1); continue; } g.fillStyle = `rgba(220,220,210,${s.a * .35})`; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }
      // iron at cursor
      const r = cv.getBoundingClientRect(), mx = D.mx - r.left, my = D.my - r.top;
      if (mx > 0 && my > 0 && mx < W && my < H) { g.strokeStyle = down ? C.amb : "#ffffff55"; g.lineWidth = 1; g.beginPath(); g.arc(mx, my, 9, 0, 7); g.stroke(); g.fillStyle = down ? C.amb : "#ffffff55"; g.fillRect(mx - 1, my - 1, 2, 2); }
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
    sl.addEventListener("input", () => { S.tone(200 + sl.value * .6, .04, "sine", .04); });
    cv.addEventListener("pointerdown", () => { tv += rand(2.5, 4) * (Math.random() < .5 ? -1 : 1); S.thud(.18); });
    const ik = (hx, hy, fx, fy, L1, L2) => {
      const dx = fx - hx, dy = fy - hy; let d = Math.hypot(dx, dy); d = Math.min(d, L1 + L2 - .01);
      const a = Math.atan2(dy, dx), b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
      const kx = hx + Math.cos(a - b) * L1, ky = hy + Math.sin(a - b) * L1; return [kx, ky];
    };
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
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
    $("#sdrScan").addEventListener("click", () => { const s = sigs[(sigs.findIndex(s => Math.abs(s.f - target) < .01) + 1) % sigs.length]; tune(s.f); S.whoosh(); });
    cv.addEventListener("pointerdown", e => { drag = true; lx = e.clientX; cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(); if (e.clientY - r.top < 70) tune(F0 + (e.clientX - r.left) / W * (F1 - F0)); });
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
    $("#ftRun").addEventListener("click", () => { if (run && run.step < 1000) return; if (run) ghosts.push(run); if (ghosts.length > 3) ghosts.shift(); run = { r, step: 0, tr: [], ev: [], c: cfg[r] }; S.blip(440); });
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
  function initGuitar() {
    const cv = $("#guitar"), g = ctx2d(cv);
    const OPEN = [82.41, 110, 146.83, 196, 246.94, 329.63]; // E2 A2 D3 G3 B3 E4
    const CHORDS = { C: [-1, 3, 2, 0, 1, 0], G: [3, 2, 0, 0, 0, 3], Am: [-1, 0, 2, 2, 1, 0], F: [1, 3, 3, 2, 1, 1], Em: [0, 2, 2, 0, 0, 0], D: [-1, -1, 0, 2, 3, 2], Dm: [-1, -1, 0, 2, 3, 1], E: [0, 2, 2, 1, 0, 0] };
    let chord = "C", W = 0, H = 0, amp = Array(6).fill(0), last = null;
    const box = $("#chords");
    Object.keys(CHORDS).forEach(k => { const b = document.createElement("button"); b.textContent = k; if (k === chord) b.className = "on"; b.addEventListener("click", () => { chord = k; $$("button", box).forEach(x => x.classList.toggle("on", x === b)); strum(true); }); box.appendChild(b); });
    const sy = i => H * .2 + (5 - i) * (H * .6 / 5); // low E at bottom
    const pluck = (i, v = .32) => { const fr = CHORDS[chord][i]; if (fr < 0) { S.noise(.03, 800, 2, .04); return; } S.pluck(OPEN[i] * Math.pow(2, fr / 12), v, .55); amp[i] = 1; };
    const strum = (down = true) => { [0, 1, 2, 3, 4, 5].forEach((i, k) => setTimeout(() => pluck(down ? i : 5 - i, .26), k * 18)); };
    cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(), y = e.clientY - r.top; last = y; let best = -1, bd = 14; for (let i = 0; i < 6; i++) { const d = Math.abs(sy(i) - y); if (d < bd) { bd = d; best = i; } } if (best >= 0) pluck(best); });
    cv.addEventListener("pointermove", e => { if (last == null) return; const r = cv.getBoundingClientRect(), y = e.clientY - r.top; for (let i = 0; i < 6; i++) { const s = sy(i); if ((last - s) * (y - s) < 0) pluck(i, .25); } last = y; });
    cv.addEventListener("pointerup", () => last = null);
    document.addEventListener("d66riff", () => {
      const seq = [["Am", 0], ["Am", 1], ["C", 0], ["C", 1], ["G", 0], ["G", 1], ["D", 0], ["Am", 0]];
      seq.forEach(([c, up], k) => setTimeout(() => { chord = c; $$("button", box).forEach(x => x.classList.toggle("on", x.textContent === c)); strum(!up); }, k * 380));
      $("#music").scrollIntoView({ behavior: "smooth" });
    });
    D.loop(cv, (dt, T) => {
      if (D.fit(cv) || !W) { W = cv.width / DPR; H = cv.height / DPR; }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      // neck + frets
      const nx0 = 30, nx1 = W * (W < 600 ? .9 : .72), top = H * .14, bot = H * .86, hr = Math.min(H * .32, W * .1, 90);
      g.fillStyle = "#2a1a0e"; g.fillRect(nx0, top, nx1 - nx0, bot - top);
      const fx = n => nx0 + (nx1 - nx0) * (1 - Math.pow(2, -n / 12)) / (1 - Math.pow(2, -12 / 12));
      for (let n = 0; n <= 12; n++) { g.fillStyle = n === 0 ? "#e8e4d8" : "#9a958a"; g.fillRect(fx(n) - (n ? 1 : 3), top, n ? 2 : 6, bot - top); }
      [3, 5, 7, 9].forEach(n => { g.fillStyle = "#e8e4d822"; g.beginPath(); g.arc((fx(n - 1) + fx(n)) / 2, (top + bot) / 2, 6, 0, 7); g.fill(); });
      [12].forEach(n => { g.fillStyle = "#e8e4d822"; [-1, 1].forEach(s => { g.beginPath(); g.arc((fx(n - 1) + fx(n)) / 2, (top + bot) / 2 + s * 24, 6, 0, 7); g.fill(); }); });
      // sound hole
      if (W >= 600) { g.strokeStyle = "#e8e4d822"; g.lineWidth = 6; g.beginPath(); g.arc(W * .86, H / 2, hr, 0, 7); g.stroke(); g.fillStyle = "#050302"; g.beginPath(); g.arc(W * .86, H / 2, hr * .9, 0, 7); g.fill(); }
      // strings
      for (let i = 0; i < 6; i++) {
        const y = sy(i), a = amp[i]; amp[i] *= Math.pow(.18, dt);
        g.strokeStyle = i < 3 ? "#d8c39a" : "#e8e4d8"; g.lineWidth = 2.6 - i * .32;
        g.beginPath();
        for (let x = nx0; x <= W - 10; x += 6) { const k = (x - nx0) / (W - 10 - nx0); const off = a * Math.sin(k * Math.PI) * Math.sin(T * (60 + i * 14) + k * 4) * 6; x === nx0 ? g.moveTo(x, y + off) : g.lineTo(x, y + off); }
        g.stroke();
        const fr = CHORDS[chord][i];
        g.font = "600 11px IBM Plex Mono, monospace";
        if (fr < 0) { g.fillStyle = C.hot; g.fillText("×", 12, y + 4); }
        else if (fr === 0) { g.strokeStyle = C.ok; g.lineWidth = 1.5; g.beginPath(); g.arc(16, y, 5, 0, 7); g.stroke(); }
        else { g.fillStyle = C.amb; g.shadowColor = C.amb; g.shadowBlur = a * 20; g.beginPath(); g.arc((fx(fr - 1) + fx(fr)) / 2, y, 8, 0, 7); g.fill(); g.shadowBlur = 0; }
      }
      g.fillStyle = C.dim; g.font = "500 10px IBM Plex Mono, monospace"; g.fillText(`chord ${chord} · Karplus-Strong synthesis`, nx0, H - 10);
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
    D.onVisible(cv, () => setTimeout(ping, 400));
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
  initDie(); initBus(); initGen(); initPCB(); initMCU(); initRack();
  initPD(); initNPU(); initMCP(); initGraph();
  initRobot(); initSDR(); initFT();
  initGuitar(); initPiano(); initLog(); initPing(); initScope();
  D.boot();
})();
