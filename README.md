# dreaming66.github.io

**DRM-66 — datasheet of a human.** Personal homepage of dreaming66 (DE BH3FWY).

Hand-written Canvas2D + WebAudio. Zero frameworks, zero build step, zero audio samples — every sound is synthesized live.

- Power-on self test gate with CRT turn-on
- Generative die-shot hero (click to inject pulses), logic-analyzer bus
- Solder a PCB pad by pad, power it on, watch U-Boot → Kernel → Buildroot boot over serial, log in
- Homelab rack, MCU blink
- Inference lab: PD-disaggregation simulator, NPU mesh AllReduce, REST → MCP compiler, threat graph
- WIP: the real RL gait policy walking live in the browser (MuJoCo WASM, on autopilot; full-screen controls at [`/biped/`](https://me.dustinz.de/biped/)), cycloidal joint bench test, SDR waterfall with an audible CW beacon (decode the callsign), LoRA fine-tune curves
- `` ` `` terminal · `X` x-ray · `S` sound · ↑↑↓↓←→←→BA
- Follows the browser's light / dark setting (paper ↔ ink; instrument screens stay ink)

All APIs, IPs, graph data and simulations are fictional demos — except `/biped/`, which runs the actual trained policy.

## /biped/

`biped/` is a self-contained static page: MuJoCo 3.17 (WebAssembly, Apache-2.0, see `biped/lib/LICENSE.mujoco`) steps the same physics model the policy was trained on, and the policy MLP (PPO in MJX) runs in plain JS every 20 ms. Joint / footstep sounds (`audio.js`) are synthesised from the sim state, floors (`ground.js`) are procedural textures. The binaries ship pre-gzipped and are inflated with `DecompressionStream`; three.js is shared with the homepage (`assets/vendor`). `?embed=1` is the compact autopilot view the homepage puts in an iframe; it reports state and footsteps back with `postMessage`.

## Languages

中文 / English / 日本語 — auto-detected from the browser, switchable from the header chip, the terminal (`lang en`), or `?lang=zh|en|ja`.
Static copy lives in `index.html` (Chinese, the source) + `js/i18n.js` (English / Japanese). After changing copy, re-run `tools/subset-fonts.py` so the self-hosted CJK fonts include any new characters.
