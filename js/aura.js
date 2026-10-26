/* ==========================================================
   DRM-66 · AuraCore cluster — real EasyEDA STEP → glTF, three.js
   CAD frame: Z up, millimetres. Slot positions read from the base STEP.
   ========================================================== */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const D = window.D66, S = D.sfx;
const cv = document.getElementById("aura3d"), stage = cv.parentElement;
const stat = document.getElementById("auStat"), kube = document.getElementById("kube");

// vertical USB-C plugs on the base (centre Y, mm) — U10, U3, U6, U9, U8
const SLOTS = [6.85, 22.9, 36.75, 49.75, 63.05];
const HEAD = 4;                    // U8 sits next to the RJ45: head + router
const LIFT = 70;                   // mm above the seat when unplugged
const NAMES = ["auracore-w1", "auracore-w2", "auracore-w3", "auracore-w4", "auracore-head"];

let renderer, scene, camera, controls, cad, base, boards = [], visible = false, ready = false, mode = "assembled", seq = null, lastT = 0;

const ease = t => 1 - Math.pow(1 - t, 3);

// the OCCT glTF export kept the CAD frame (Z-up), only in metres → mm
function toCad(root) { const w = new THREE.Group(); root.scale.setScalar(1000); w.add(root); return w; }

function log(lines) { kube.textContent = lines.join("\n"); }
function kubeTable() {
  const rows = boards.map((b, i) => ({ n: NAMES[i], r: i === HEAD ? "control-plane,master" : "<none>", ok: b.userData.seated }));
  const head = rows.find((r, i) => i === HEAD);
  const lines = ["$ kubectl get nodes", "NAME            STATUS     ROLES"];
  [head, ...rows.filter((r, i) => i !== HEAD)].forEach(r => lines.push(`${r.n.padEnd(16)}${(r.ok ? "Ready" : "NotReady").padEnd(11)}${r.r}`));
  log(lines);
}

async function init() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { stat.textContent = "WebGL unavailable"; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 1, 2000);
  controls = new OrbitControls(camera, cv);
  controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = .7;
  controls.minDistance = 70; controls.maxDistance = 420; controls.enablePan = false;
  controls.addEventListener("start", () => { controls.autoRotate = false; });

  scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 1.6));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.6); key.position.set(120, 200, 140); scene.add(key);
  const rim = new THREE.DirectionalLight(0x36e2ff, 1.4); rim.position.set(-160, 80, -120); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffb21a, .6); fill.position.set(0, -60, 100); scene.add(fill);

  cad = new THREE.Group(); cad.rotation.x = -Math.PI / 2; scene.add(cad);
  const grid = new THREE.GridHelper(260, 52, 0x3a3a34, 0x1c1e1c); grid.position.set(46, -3, -37); scene.add(grid);

  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  stat.textContent = "loading models… 0%";
  const prog = {};
  const load = url => new Promise((res, rej) => loader.load(url, res, e => { prog[url] = e.total ? e.loaded / e.total : 0; const p = Object.values(prog); stat.textContent = `loading models… ${Math.round(p.reduce((a, b) => a + b, 0) / 2 * 100)}%`; }, rej));
  let gb, ga;
  try { [gb, ga] = await Promise.all([load("assets/models/base.glb"), load("assets/models/auracore.glb")]); }
  catch (e) { stat.textContent = "model load failed"; console.warn(e); return; }

  base = toCad(gb.scene); cad.add(base);
  SLOTS.forEach((y, i) => {
    const b = new THREE.Group();
    b.add(toCad(ga.scene.clone(true)));
    // board-local CAD (x,y,z) → base CAD: (x + 17.05, slot - z + 2.7, y + 9.4); USB1 mouth onto the plug
    b.rotation.x = Math.PI / 2;
    b.userData = { home: new THREE.Vector3(17.05, y + 2.7, 9.4), off: LIFT, target: LIFT, seated: false, rot: Math.PI / 2, rotT: Math.PI / 2 };
    const led = new THREE.Mesh(new THREE.BoxGeometry(1.6, .8, .8), new THREE.MeshBasicMaterial({ color: 0x331a10 }));
    led.position.set(30.8, 56.2, 1.9); b.add(led); b.userData.led = led;
    b.position.copy(b.userData.home).add(new THREE.Vector3(0, 0, LIFT));
    cad.add(b); boards.push(b);
  });

  // cluster centre in CAD (46, 37, 28) → world (x, z, -y)
  controls.target.set(46, 26, -37);
  camera.position.set(46 - 120, 26 + 78, -37 + 150);
  resize();
  ready = true; stat.textContent = "drag to orbit · scroll to zoom";
  kubeTable();
  assemble();
}

function resize() {
  if (!renderer) return;
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);

function assemble() {
  mode = "assembled"; clearTimeout(seq);
  base.visible = true;
  boards.forEach(b => { b.visible = true; b.userData.off = b.userData.target = LIFT; b.userData.seated = false; b.userData.rotT = Math.PI / 2; });
  kubeTable();
  const order = [HEAD, 0, 1, 2, 3];
  let k = 0;
  const next = () => { if (k >= order.length || mode !== "assembled") return; boards[order[k]].userData.target = 0; k++; seq = setTimeout(next, D.still ? 0 : 650); };
  next();
}
function explode() {
  mode = "explode"; clearTimeout(seq); base.visible = true;
  boards.forEach((b, i) => { b.visible = true; b.userData.target = 38 + i * 6; b.userData.rotT = Math.PI / 2; });
  S.whoosh(true);
}
function solo() {
  mode = "solo"; clearTimeout(seq); base.visible = false;
  boards.forEach((b, i) => { b.visible = i === HEAD; });
  const h = boards[HEAD]; h.userData.target = 20; h.userData.rotT = 0;
  S.whoosh(false);
}
document.getElementById("auAssemble").addEventListener("click", () => ready && assemble());
document.getElementById("auExplode").addEventListener("click", () => ready && explode());
document.getElementById("auSolo").addEventListener("click", () => ready && solo());

function tick(now) {
  requestAnimationFrame(tick);
  if (!ready || !visible) { lastT = now; return; }
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
  const k = D.still ? 1 : 1 - Math.pow(.0009, dt);
  boards.forEach((b, i) => {
    const u = b.userData;
    const prev = u.off;
    u.off += (u.target - u.off) * k;
    u.rot += (u.rotT - u.rot) * k;
    b.rotation.x = u.rot;
    b.position.copy(u.home);
    if (mode === "solo") b.position.set(15.4, 9, 0);
    b.position.z += u.off;
    if (mode === "assembled" && !u.seated && u.target === 0 && u.off < .4) {
      u.seated = true; S.thud(.16); S.blip(i === HEAD ? 523 : 659); kubeTable();
    }
    const on = u.seated && (i === HEAD ? Math.sin(now / 160) > -.2 : Math.sin(now / 90 + i * 2) > .3);
    u.led.material.color.setHex(on ? (i === HEAD ? 0xffb21a : 0xa4ff5e) : 0x331a10);
  });
  if (D.still) controls.autoRotate = false;
  controls.update();
  renderer.render(scene, camera);
}
requestAnimationFrame(tick);

let started = false;
new IntersectionObserver(es => {
  visible = es[0].isIntersecting;
  if (visible && !started) { started = true; init(); }
}, { rootMargin: "300px" }).observe(stage);
