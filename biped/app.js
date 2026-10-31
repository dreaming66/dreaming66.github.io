import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import loadMujoco from "./lib/mujoco.js";
import { Biped, loadCad, poseCad } from "./core.js";
import { JointAudio } from "./audio.js";
import { GROUNDS, groundMaterial, setGroundResolution } from "./ground.js";

const $ = id => document.getElementById(id);
const EMBED = document.documentElement.dataset.mode === "embed";
const COARSE = matchMedia("(pointer: coarse)").matches;
const PARENT = EMBED && window.parent !== window ? window.parent : null;
const DARK = matchMedia("(prefers-color-scheme: dark)");
const tell = msg => PARENT && PARENT.postMessage({ d66biped: 1, ...msg }, location.origin);

// ---------------------------------------------------------------- i18n (zh / en / ja; shares the homepage's choice)
const I18N = {
  zh: {
    title: "双足机器人 · RL 步态", back: "← 回主页", loading: "加载物理引擎…", init: "初始化…", fail: "加载失败：",
    fwd: "前进", side: "侧移", turn: "转向", cmd: "指令", meas: "实测", falls: n => `摔倒 ${n} 次`,
    h0: "<b>键盘操作</b>（按住）", h1: "前进 · 后退", h2: "左转 · 右转", h3: "左右侧移", h4: "推一下", h5: "重置", h6: "自动驾驶",
    h7: "点一下画面也能推它 · 拖动旋转视角，滚轮缩放",
    s0: "前进", s1: "后退", s2: "左转", s3: "右转", sl: "◀ 侧移", sr: "侧移 ▶",
    push: "推一下", reset: "重置", follow: "跟随视角", auto: "自动驾驶", full: "全屏操控 ↗", moreLbl: "更多",
    h8: "音效", sndOn: "音效 开", sndOff: "音效 关", ground: "地面", grounds: { concrete: "混凝土", wood: "木地板", grass: "草地", checker: "棋盘格" },
    tPush: "推！", tFall: "摔倒了，1 秒后重置", tAuto: "自动驾驶", tYou: "你来开",
    you: "YOU", ap: k => `AUTO · ${k}`,
    seg: { stand: "原地踏步", walk: "直行", arc: "边走边转", left: "向左侧移", right: "向右侧移", spin: "原地转身", back: "倒退", fast: "快走", shove: "挨一推" },
    liveSub: "策略 MLP 31→512→256→128→6，物理和推理都在你的浏览器里跑",
    hint: "点画面推它 · 点击后 WASD 接管 · 拖动转视角",
    hintTouch: "点一下推它 · 全屏可用摇杆操控",
    foot: "MuJoCo 3.17（WebAssembly）实时仿真，和训练用的是同一个物理模型；策略是 MJX 里用 PPO 训出来的 MLP，每 20 ms 推理一次。没有预录动作，每一步都是现算的。",
  },
  en: {
    title: "Biped · RL gait", back: "← home", loading: "loading physics…", init: "initialising…", fail: "failed to load: ",
    fwd: "forward", side: "strafe", turn: "turn", cmd: "command", meas: "measured", falls: n => `${n} fall${n === 1 ? "" : "s"}`,
    h0: "<b>Keyboard</b> (hold)", h1: "forward · back", h2: "turn left · right", h3: "strafe", h4: "push", h5: "reset", h6: "autopilot",
    h7: "click the scene to shove it · drag to orbit, wheel to zoom",
    s0: "fwd", s1: "back", s2: "left", s3: "right", sl: "◀ strafe", sr: "strafe ▶",
    push: "push", reset: "reset", follow: "follow cam", auto: "autopilot", full: "drive it full screen ↗", moreLbl: "more",
    h8: "sound", sndOn: "sound on", sndOff: "sound off", ground: "floor", grounds: { concrete: "concrete", wood: "wood", grass: "grass", checker: "checker" },
    tPush: "shove!", tFall: "down — resetting in 1 s", tAuto: "autopilot", tYou: "you drive",
    you: "YOU", ap: k => `AUTO · ${k}`,
    seg: { stand: "stepping in place", walk: "straight", arc: "walk + turn", left: "strafe left", right: "strafe right", spin: "turn on the spot", back: "backwards", fast: "brisk walk", shove: "taking a shove" },
    liveSub: "policy MLP 31→512→256→128→6 — physics and inference run in your browser",
    hint: "click to shove · click, then WASD to drive · drag to orbit",
    hintTouch: "tap to shove · go full screen for the joystick",
    foot: "MuJoCo 3.17 (WebAssembly) live, with the same physics model it was trained on; the policy is an MLP trained with PPO in MJX, queried every 20 ms. Nothing is pre-recorded — every step is computed right now.",
  },
  ja: {
    title: "二足ロボット · RL 歩容", back: "← ホーム", loading: "物理エンジンを読み込み中…", init: "初期化中…", fail: "読み込み失敗：",
    fwd: "前進", side: "横移動", turn: "旋回", cmd: "指令", meas: "実測", falls: n => `転倒 ${n} 回`,
    h0: "<b>キーボード</b>（長押し）", h1: "前進 · 後退", h2: "左旋回 · 右旋回", h3: "左右に横移動", h4: "押す", h5: "リセット", h6: "自動操縦",
    h7: "画面クリックでも押せる · ドラッグで視点回転、ホイールでズーム",
    s0: "前進", s1: "後退", s2: "左", s3: "右", sl: "◀ 横移動", sr: "横移動 ▶",
    push: "押す", reset: "リセット", follow: "追従カメラ", auto: "自動操縦", full: "全画面で操作 ↗", moreLbl: "その他",
    h8: "サウンド", sndOn: "サウンド オン", sndOff: "サウンド オフ", ground: "床", grounds: { concrete: "コンクリート", wood: "フローリング", grass: "芝生", checker: "チェッカー" },
    tPush: "えいっ！", tFall: "転倒、1 秒後にリセット", tAuto: "自動操縦", tYou: "手動操作",
    you: "YOU", ap: k => `AUTO · ${k}`,
    seg: { stand: "足踏み", walk: "直進", arc: "歩きながら旋回", left: "左へ横移動", right: "右へ横移動", spin: "その場で旋回", back: "後退", fast: "早歩き", shove: "押されても耐える" },
    liveSub: "方策 MLP 31→512→256→128→6、物理も推論もこのブラウザ内で動作",
    hint: "クリックで押す · クリック後 WASD で操作 · ドラッグで視点",
    hintTouch: "タップで押す · 全画面ならジョイスティック操作",
    foot: "MuJoCo 3.17（WebAssembly）のリアルタイム物理。学習時と同じモデルを使い、MJX で PPO 学習した MLP 方策を 20 ms ごとに推論。録画ではなく、一歩一歩その場で計算しています。",
  },
};
let lang = window.__lang || "zh", hudReady = false, sfx = null, soundWanted = true;
for (const k of Object.keys(GROUNDS)) $("ground").add(new Option(k, k));
const T = (k, ...a) => { const v = I18N[lang][k] ?? I18N.en[k]; return typeof v === "function" ? v(...a) : v; };
function applyLang() {
  document.documentElement.lang = { zh: "zh-CN", en: "en", ja: "ja" }[lang];
  document.title = T("title");
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = T(el.dataset.t); });
  document.querySelectorAll("[data-t-html]").forEach(el => { el.innerHTML = T(el.dataset.tHtml); });
  document.querySelectorAll("[data-t-attr]").forEach(el => { const [a, k] = el.dataset.tAttr.split(":"); el.setAttribute(a, T(k)); });
  if (COARSE) $("hint").textContent = T("hintTouch");
  for (const o of $("ground").options) o.textContent = T("grounds")[o.value];
  if (sfx) $("sound").textContent = T(soundWanted ? "sndOn" : "sndOff");
  $("langBtn").textContent = lang.toUpperCase();
  $("home").href = `../?lang=${lang}`;
  if (hudReady) hudMode();
}
applyLang();
$("langBtn").onclick = () => {
  lang = { zh: "en", en: "ja", ja: "zh" }[lang];
  try { localStorage.setItem("d66-lang", lang); } catch {}
  history.replaceState(null, "", `?lang=${lang}`);
  applyLang();
};

// ---------------------------------------------------------------- loading (progress over the gzipped payload)
async function fetchProgress(url, onBytes) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  const total = +r.headers.get("content-length") || 0;
  if (!r.body || !total) { const b = await r.arrayBuffer(); onBytes(b.byteLength, b.byteLength); return b; }
  const reader = r.body.getReader(), parts = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value); got += value.length; onBytes(Math.min(got, total), total);
  }
  const out = new Uint8Array(got);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out.buffer;
}
// binaries ship pre-gzipped (static hosts don't compress .wasm/.bin reliably); inflate unless the server already did
async function gunzip(buf) {
  const u = new Uint8Array(buf);
  if (u[0] !== 0x1f || u[1] !== 0x8b) return buf;
  return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
}

const bar = $("loadbar"), msg = $("loadmsg");
const progress = {};
const showProgress = () => {
  const v = Object.values(progress), got = v.reduce((a, p) => a + p[0], 0), tot = v.reduce((a, p) => a + p[1], 0);
  const f = tot ? got / tot : 0;
  bar.style.width = `${(100 * f).toFixed(0)}%`;
  tell({ t: "progress", f });
};
const get = (url, kind = "buf") => fetchProgress(url, (g, t) => { progress[url] = [g, t]; showProgress(); })
  .then(b => kind === "text" ? new TextDecoder().decode(b) : kind === "json" ? JSON.parse(new TextDecoder().decode(b)) : kind === "gz" ? gunzip(b) : b);

let mujoco, sim, cad, cfg, meshBuf;
try {
  const [wasm, simXml, kinXml, policy, meshes, config] = await Promise.all([
    get("lib/mujoco.wasm.gz", "gz"), get("assets/sim.xml", "text"), get("assets/cad_kin.xml", "text"),
    get("assets/policy.bin.gz", "gz"), get("assets/meshes.bin.gz", "gz"), get("assets/config.json", "json")]);
  msg.textContent = T("init");
  mujoco = await loadMujoco({ wasmBinary: wasm });
  cfg = config;
  sim = new Biped(mujoco, simXml, policy, cfg);
  cad = loadCad(mujoco, kinXml);
  meshBuf = meshes;
} catch (e) {
  msg.textContent = T("fail") + e.message;
  tell({ t: "error", msg: e.message });
  throw e;
}

// ---------------------------------------------------------------- three.js scene (MuJoCo is z-up: keep it)
const THEMES = {
  ink: { bg: 0x141412, ground: 0x2a2924, hemi: 1.15, sun: 2.4, fogNear: 4, fogFar: 13, dark: true },
  night: { bg: 0x11110f, ground: 0x2a2924, hemi: 1.2, sun: 2.3, fogNear: 6, fogFar: 18, dark: true },
  paper: { bg: 0xf1ede3, ground: 0xb3a994, hemi: 1.35, sun: 2.2, fogNear: 6, fogFar: 18, dark: false },
};
const themeKey = () => EMBED ? "ink" : DARK.matches ? "night" : "paper";
let THEME = THEMES[themeKey()];
const canvas = $("view");
const LITE = EMBED && COARSE;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LITE, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, LITE ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const bg = new THREE.Color(THEME.bg);
scene.background = bg;
scene.fog = new THREE.Fog(bg, THEME.fogNear, THEME.fogFar);
setGroundResolution(COARSE ? 512 : 1024);           // the floor textures are generated on the CPU at load

const camera = new THREE.PerspectiveCamera(40, 1, 0.02, 60);
camera.up.set(0, 0, 1);
camera.position.set(1.1, -1.25, 0.65);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0.3);
controls.enableDamping = true;
controls.minDistance = 0.4;
controls.maxDistance = 6;
controls.maxPolarAngle = Math.PI * 0.49;
controls.autoRotateSpeed = 0.9;
if (EMBED) {
  controls.enableZoom = false;                       // the wheel keeps scrolling the homepage
  if (COARSE) {                                      // and a finger keeps scrolling it too: tap = shove, no orbit
    controls.enableRotate = false;
    for (const el of [document.documentElement, document.body, canvas]) el.style.touchAction = "pan-y";
  }
}

const hemi = new THREE.HemisphereLight(0xffffff, THEME.ground, THEME.hemi);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, THEME.sun);
sun.position.set(1.5, -1.0, 3.0);
sun.castShadow = true;
sun.shadow.mapSize.setScalar(LITE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 8 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.01;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(EMBED ? 0xffd9c9 : 0xffffff, 0.6);
fill.position.set(-1.5, 1.5, 2.0);
scene.add(fill);

// ground: procedural textured materials (visual only; the physics floor is unchanged), remembered across visits
const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial());
floor.receiveShadow = true;
scene.add(floor);
let groundKind = new URLSearchParams(location.search).get("ground");
try { groundKind = groundKind || localStorage.getItem("biped-ground"); } catch {}
function setGround(kind) {
  groundKind = GROUNDS[kind] ? kind : "concrete";
  floor.material = groundMaterial(groundKind, renderer, THEME.dark);
  $("ground").value = groundKind;
}
setGround(groundKind);
$("ground").onchange = () => { setGround($("ground").value); try { localStorage.setItem("biped-ground", groundKind); } catch {} };
function applyTheme() {
  THEME = THEMES[themeKey()];
  bg.set(THEME.bg); scene.fog.color.copy(bg); scene.fog.near = THEME.fogNear; scene.fog.far = THEME.fogFar;
  hemi.groundColor.set(THEME.ground); hemi.intensity = THEME.hemi; sun.intensity = THEME.sun;
  setGround(groundKind);
}
DARK.addEventListener?.("change", applyTheme);

// robot: one Object3D per CAD body, posed from MuJoCo every frame; meshes fixed in their body frames
const bodies = [];
for (let i = 0; i < cad.vm.nbody; i++) {
  const o = new THREE.Object3D();
  o.matrixAutoUpdate = false;
  scene.add(o);
  bodies.push(o);
}
const mats = new Map();
for (const g of cfg.meshes.geoms) {
  const pos = new Float32Array(meshBuf, g.v[0] * 12, g.v[1] * 3);
  const idx = new Uint16Array(meshBuf, cfg.meshes.faces_offset_bytes + g.f[0] * 6, g.f[1] * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  const key = g.rgba.join(",");
  if (!mats.has(key)) {
    const col = new THREE.Color().setRGB(g.rgba[0], g.rgba[1], g.rgba[2], THREE.SRGBColorSpace);
    mats.set(key, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.05,
                                                     transparent: g.rgba[3] < 1, opacity: g.rgba[3] }));
  }
  const mesh = new THREE.Mesh(geo, mats.get(key));
  mesh.position.set(...g.pos);
  mesh.quaternion.set(g.quat[1], g.quat[2], g.quat[3], g.quat[0]);
  mesh.castShadow = mesh.receiveShadow = true;
  bodies[g.body].add(mesh);
}

const m4 = new THREE.Matrix4();
function syncBodies() {
  const xp = cad.vd.xpos, xm = cad.vd.xmat;
  for (let i = 1; i < bodies.length; i++) {
    const p = 3 * i, r = 9 * i;
    m4.set(xm[r], xm[r + 1], xm[r + 2], xp[p],
           xm[r + 3], xm[r + 4], xm[r + 5], xp[p + 1],
           xm[r + 6], xm[r + 7], xm[r + 8], xp[p + 2],
           0, 0, 0, 1);
    bodies[i].matrix.copy(m4);
    bodies[i].matrixWorldNeedsUpdate = true;
  }
}

function resize() {
  const w = innerWidth, h = innerHeight, aspect = w / h;
  renderer.setSize(w, h, false);
  camera.aspect = aspect;
  // portrait phones: wider lens and pull back so the whole robot stays in frame
  camera.fov = aspect < 1 ? 55 : 40;
  const dist = (EMBED ? 1.55 : 1.75) * Math.min(2.2, Math.max(1, 0.8 / aspect));
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, dist);
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

// ---------------------------------------------------------------- input: held keys / joystick -> target command
const L = cfg.limits;
const target = [0, 0, 0];
// ?cmd=vx,vy,yaw holds a fixed command (handy for testing)
const fixedCmd = new URLSearchParams(location.search).get("cmd")?.split(",").map(Number) ?? null;
const keys = new Set();
const KEYMAP = { KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r",
                 KeyQ: "sl", KeyE: "sr" };
let lastInput = -1e9;
// sound (motor whine per leg, footsteps, push, fall) is synthesised from the sim state in audio.js.
// Full page: its own on/off (M), remembered. Embedded: follows the homepage's sound switch, and only while on screen.
sfx = new JointAudio();
window.__sfx = sfx;                    // handy from the console: __sfx.debug
if (EMBED) { sfx.volume = 0.45; soundWanted = false; }
else { try { soundWanted = localStorage.getItem("biped-sound") !== "0"; } catch {} }
const applySound = () => {
  const on = soundWanted && running;
  if (on) sfx.unlock(); else if (sfx.ctx && sfx.ctx.state !== "closed") sfx.ctx.suspend();   // also cancels a resume still in flight
  sfx.setEnabled(on);
  $("sound").textContent = T(soundWanted ? "sndOn" : "sndOff");
  $("sound").classList.toggle("off", !soundWanted);
};
function setSound(on) {
  soundWanted = on;
  if (!EMBED) try { localStorage.setItem("biped-sound", on ? "1" : "0"); } catch {}
  applySound();
}
for (const ev of ["pointerdown", "keydown"]) addEventListener(ev, () => { if (soundWanted && running) sfx.unlock(); }, { capture: true });
$("sound").onclick = () => setSound(!soundWanted);
addEventListener("keydown", e => {
  if (e.code === "KeyM" && !e.repeat) { setSound(!soundWanted); return; }
  if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); lastInput = performance.now(); e.preventDefault(); }
  else if (e.code === "KeyP" && !e.repeat) doPush();
  else if (e.code === "KeyR" && !e.repeat) doReset();
  else if (e.code === "KeyT" && !e.repeat) toggleAuto();
});
addEventListener("keyup", e => { if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]); });
addEventListener("blur", () => keys.clear());

const stick = { x: 0, y: 0, active: false };
{
  const el = $("stick"), knob = $("knob");
  let id = null;
  const move = e => {
    const r = el.getBoundingClientRect(), R = r.width / 2 - 20;
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const n = Math.hypot(x, y);
    if (n > R) { x *= R / n; y *= R / n; }
    knob.style.transform = `translate(${x}px, ${y}px)`;
    stick.x = x / R; stick.y = -y / R;
    lastInput = performance.now();
  };
  el.addEventListener("pointerdown", e => { id = e.pointerId; el.setPointerCapture(id); stick.active = true; move(e); });
  el.addEventListener("pointermove", e => { if (e.pointerId === id) move(e); });
  const up = e => { if (e.pointerId !== id) return; id = null; stick.active = false; stick.x = stick.y = 0;
                    knob.style.transform = ""; };
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
}
const side = { l: false, r: false };
for (const [btn, k] of [["sl", "l"], ["sr", "r"]]) {
  const el = $(btn);
  el.addEventListener("pointerdown", e => { side[k] = true; lastInput = performance.now(); el.setPointerCapture(e.pointerId); });
  for (const ev of ["pointerup", "pointercancel"]) el.addEventListener(ev, () => { side[k] = false; });
}
// a click (not a drag) on the scene shoves the robot
{
  let p0 = null;
  canvas.addEventListener("pointerdown", e => { p0 = [e.clientX, e.clientY, performance.now()]; canvas.focus({ preventScroll: true }); });
  canvas.addEventListener("pointerup", e => {
    if (p0 && Math.hypot(e.clientX - p0[0], e.clientY - p0[1]) < 6 && performance.now() - p0[2] < 400) doPush();
    p0 = null;
  });
}

// ---------------------------------------------------------------- autopilot: a looping programme of commands
// (embedded on the homepage it drives itself; any key / joystick input takes over, idle hands give it back)
const PROGRAM = [
  ["stand", 2.5, [0, 0, 0]], ["walk", 5, [0.55, 0, 0]], ["arc", 5, [0.4, 0, 0.7]], ["left", 3.5, [0, 0.25, 0]],
  ["right", 3.5, [0, -0.25, 0]], ["spin", 4, [0, 0, -0.9]], ["back", 3.5, [-0.35, 0, 0]], ["fast", 4.5, [0.75, 0, 0]],
  ["shove", 3.5, [0.3, 0, 0], 1.2],
];
let autoOn = EMBED && !fixedCmd, apT = 0, apI = 0, apPushed = false;
const manual = () => performance.now() - lastInput < 6000;
function toggleAuto() {
  autoOn = !autoOn; lastInput = -1e9; apT = 0; apI = 0;
  $("autoBtn").classList.toggle("primary", autoOn);
  toast(autoOn ? T("tAuto") : T("tYou"));
  hudMode();
}
$("autoBtn").onclick = toggleAuto;
function autopilot(dt) {
  let [, dur, cmd, pushAt] = PROGRAM[apI];
  apT += dt;
  if (pushAt !== undefined && !apPushed && apT > pushAt) { apPushed = true; doPush(0.5); }
  if (apT > dur) { apT = 0; apPushed = false; apI = (apI + 1) % PROGRAM.length; hudMode(); [, dur, cmd] = PROGRAM[apI]; }
  target.splice(0, 3, ...cmd);
}

function updateTarget(dt) {
  if (fixedCmd) { target.splice(0, 3, ...fixedCmd); return; }
  if (autoOn && !manual()) { autopilot(dt); return; }
  let fx = 0, yaw = 0, sy = 0;
  if (keys.has("f")) fx += 1;
  if (keys.has("b")) fx -= 1;
  if (keys.has("l")) yaw += 1;
  if (keys.has("r")) yaw -= 1;
  if (keys.has("sl") || side.l) sy += 1;
  if (keys.has("sr") || side.r) sy -= 1;
  if (stick.active) { fx = stick.y; yaw = -stick.x; }
  target[0] = fx >= 0 ? fx * L.vx[1] : -fx * L.vx[0];
  target[1] = sy * L.vy[1];
  target[2] = yaw * L.yaw[1];
}

// ---------------------------------------------------------------- actions
let falls = 0, fellAt = null, toastTimer = null;
function toast(text) {
  const t = $("toast");
  t.textContent = text; t.style.opacity = 1;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = 0; }, 1400);
}
function doPush(v = 0.6) { sim.push(v); sfx.push(); toast(T("tPush")); tell({ t: "push" }); }
function doReset() { sim.reset(); sim.cmd = [0, 0, 0]; fellAt = null; snapCamera(); }
$("push").onclick = () => doPush();
$("reset").onclick = doReset;
$("full").onclick = () => window.open(new URL(`./?lang=${lang}`, location.href).href, "_top");
let follow = true;
$("follow").onclick = () => { follow = !follow; $("follow").classList.toggle("primary", follow); };
$("autoBtn").classList.toggle("primary", autoOn);
{ // phones: everything but "push" folds into the ⋯ popover
  const box = $("buttons"), btn = $("moreBtn");
  const open = v => { box.classList.toggle("open", v); btn.setAttribute("aria-expanded", v); };
  btn.onclick = () => open(!box.classList.contains("open"));
  addEventListener("pointerdown", e => { if (!box.contains(e.target)) open(false); });
}

// ---------------------------------------------------------------- main loop: fixed 50 Hz control, render at display rate
const RAMP = [1.6, 1.0, 3.0];            // command slew, per second (gamepad-like, avoids step changes)
const meas = [0, 0, 0];
const lastRoot = new THREE.Vector3();
function snapCamera() {
  poseCad(mujoco, cad.vm, cad.vd, sim);
  const q = sim.d.qpos;
  const d = new THREE.Vector3(q[0], q[1], 0.3).sub(controls.target);
  controls.target.add(d); camera.position.add(d);
  lastRoot.set(q[0], q[1], 0.3);
}
snapCamera();

let acc = 0, last = performance.now(), running = false, raf = 0, lastTell = 0;
function frame(now) {
  raf = running ? requestAnimationFrame(frame) : 0;
  const elapsed = Math.min((now - last) / 1000, 0.1);   // tab switches / hiccups: drop time rather than sprint
  acc += elapsed;
  last = now;
  const dt = cfg.ctrl_dt;
  while (acc >= dt) {
    acc -= dt;
    updateTarget(dt);
    for (let i = 0; i < 3; i++) {
      const s = RAMP[i] * dt * (i === 0 ? L.vx[1] : i === 1 ? L.vy[1] : L.yaw[1]);
      sim.cmd[i] += Math.max(-s, Math.min(s, target[i] - sim.cmd[i]));
    }
    if (fellAt !== null && sim.t - fellAt > 1.2) { sim.reset(); fellAt = null; }
    sim.step();
    sfx.update(sim);
    if (fellAt === null && sim.fallen()) {
      sfx.fall(); falls++; fellAt = sim.t; hudMode(); toast(T("tFall")); tell({ t: "fall", falls });
    }
    const v = sim.bodyVel();
    for (let i = 0; i < 3; i++) meas[i] = 0.92 * meas[i] + 0.08 * v[i];
  }

  poseCad(mujoco, cad.vm, cad.vd, sim);
  syncBodies();
  const q = sim.d.qpos;
  if (follow) {
    const now3 = new THREE.Vector3(q[0], q[1], 0.3), d = now3.clone().sub(lastRoot);
    controls.target.add(d); camera.position.add(d);
    lastRoot.copy(now3);
  } else lastRoot.set(q[0], q[1], 0.3);
  sun.position.set(q[0] + 1.5, q[1] - 1.0, 3.0);
  sun.target.position.set(q[0], q[1], 0);
  controls.autoRotate = EMBED && autoOn && !manual() && !dragging;
  controls.update();
  renderer.render(scene, camera);
  hud();
  if (now - lastTell > 150) {
    lastTell = now;
    tell({ t: "state", cmd: [...sim.cmd], meas: [...meas], falls, auto: autoOn && !manual(), seg: PROGRAM[apI][0] });
  }
}
let dragging = false;
controls.addEventListener("start", () => { dragging = true; });
controls.addEventListener("end", () => { dragging = false; });

function run(on) {
  if (on === running) return;
  running = on;
  if (on) { last = performance.now(); acc = 0; raf = requestAnimationFrame(frame); }
  else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  applySound();
}
document.addEventListener("visibilitychange", () => { if (!PARENT) run(!document.hidden); });

const span = [L.vx[1], L.vy[1], L.yaw[1]];
function setBar(el, v, s) {
  const f = Math.max(-1, Math.min(1, v / s)) * 50;
  el.style.left = f >= 0 ? "50%" : `${50 + f}%`;
  el.style.width = `${Math.abs(f)}%`;
}
function hud() {
  for (let i = 0; i < 3; i++) {
    setBar($(`b${i}c`), sim.cmd[i], span[i]);
    setBar($(`b${i}m`), meas[i], span[i]);
    $(`v${i}`).textContent = meas[i].toFixed(2);
  }
}
function hudMode() {
  $("fallN").textContent = T("falls", falls);
  const m = $("mode"), a = autoOn && !manual();
  m.textContent = a ? T("ap", T("seg")[PROGRAM[apI][0]]) : (autoOn || EMBED ? T("you") : "");
  m.classList.toggle("you", !a);
}
hudReady = true;
setInterval(hudMode, 1000);
hudMode();

// homepage → iframe: run / pause as the card scrolls in and out, follow its language switch
addEventListener("message", e => {
  if (e.origin !== location.origin || !e.data || !e.data.d66) return;
  if (e.data.d66 === "run") run(!!e.data.on);
  if (e.data.d66 === "lang" && I18N[e.data.lang]) { lang = e.data.lang; applyLang(); }
  if (e.data.d66 === "push") doPush();
  if (e.data.d66 === "sound" && (!!e.data.on !== soundWanted || (soundWanted && sfx.ctx?.state !== "running"))) setSound(!!e.data.on);
});

applySound();
$("loading").classList.add("gone");
renderer.render(scene, camera);
if (!PARENT) run(true);                // embedded: the homepage says when the card is on screen
tell({ t: "ready" });
