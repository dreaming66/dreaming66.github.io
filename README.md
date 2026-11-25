# dreaming66.github.io

**DRM-66 — datasheet of a human.** Personal homepage of dreaming66 (DE BH3FWY).

Hand-written Canvas2D + WebAudio. Zero frameworks, zero build step, zero audio samples — every sound is synthesized live.

- Power-on self test gate with CRT turn-on (plays once per tab session; reloads go straight in)
- Generative die-shot hero (click to inject pulses), logic-analyzer bus
- Solder a PCB pad by pad, power it on, watch U-Boot → Kernel → Buildroot boot over serial, log in
- Homelab rack, MCU blink
- Inference lab: PD-disaggregation simulator, NPU mesh AllReduce, REST → MCP compiler, threat graph
- WIP: the real RL gait policy walking live in the browser (MuJoCo WASM, on autopilot; full-screen controls at [`/biped/`](https://me.dustinz.de/biped/)), cycloidal joint bench test, SDR waterfall with an audible CW beacon (decode the callsign), LoRA fine-tune curves
- `` ` `` terminal · `X` x-ray · `S` sound · ↑↑↓↓←→←→BA
- Follows the browser's light / dark setting (paper ↔ ink; instrument screens stay ink)
- The cube logo: one SVG sprite in `index.html` (`#d66-mark`, `#d66-lid`, `#d66-body`, `#d66-dustinz`) feeds the header (the lid lifts on hover), the gate (draws itself in yellow), the hero badge, the footer, the PCB silkscreen, the business card and the `logo` command; favicon, touch icon, sticker and social card live in `assets/brand/`
- `style.css` and the scripts are linked with `?v=…`; bump it in `index.html` whenever they change, so a cached old stylesheet never meets new markup

All APIs, IPs, graph data and simulations are fictional demos — except `/biped/`, which runs the actual trained policy.

## /room/

A 3D workshop at night (three.js, no build step, same vendored three as the home page plus `RoomEnvironment`, `RoundedBoxGeometry` and the bloom post-processing addons, rendered through an MSAA target). Scroll flies the camera along a rail through twelve stations — desk and laptop, the AuraCore cluster (the real EasyEDA CAD from `assets/models/`), a whiteboard sketch of PD disaggregation, the workbench (scope, bench supply, soldering station, parts drawers), the cycloidal joint and SDR radio, a 3D printer printing a cycloid disc, the biped (the real CAD from `/biped/`, posed with its own forward kinematics read from `cad_kin.xml`), the orange cat asleep on the rug (click it), the archive shelf (drone, quadruped, omni chassis) and the homelab rack — and each card links back into the home page. Everything else is procedural geometry with canvas textures (wood grain, plaster, rug, a tabby coat). Reached from the menu (工作间 · 3D room) or the terminal (`room`). Phones get no bloom and no shadows.

## /biped/

`biped/` is a self-contained static page: MuJoCo 3.17 (WebAssembly, Apache-2.0, see `biped/lib/LICENSE.mujoco`) steps the same physics model the policy was trained on, and the policy MLP (PPO in MJX) runs in plain JS every 20 ms. Joint / footstep sounds (`audio.js`) are synthesised from the sim state, floors (`ground.js`) are procedural textures. The binaries ship pre-gzipped and are inflated with `DecompressionStream`; three.js is shared with the homepage (`assets/vendor`). `?embed=1` is the compact autopilot view the homepage puts in an iframe; it reports state and footsteps back with `postMessage`.

## Languages

中文 / English / 日本語 — auto-detected from the browser, switchable from the header chip, the terminal (`lang en`), or `?lang=zh|en|ja`.
Static copy lives in `index.html` (Chinese, the source) + `js/i18n.js` (English / Japanese). After changing copy, re-run `tools/subset-fonts.py` so the self-hosted CJK fonts include any new characters.
