/* ==========================================================
   AuraCore cluster — real EasyEDA STEP → glTF, three.js
   CAD frame: Z up, millimetres. Geometry read from both STEP files:
   · base: six vertical USB-C plugs. U10/U3/U6/U9/U8 in a column at X=47.3,
     U11 beside U10 at X=59.85 (12.55 mm apart)
   · AuraCore: USB2 + USB3 sit on the long side edge, 12.25 mm apart
   → every board stands on its long side; USB2 goes onto the column plug,
     and the head board also lands USB3 on U11.
   ========================================================== */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const D = window.D66, S = D.sfx;
const cv = document.getElementById("aura3d"), stage = cv.parentElement;
const stat = document.getElementById("auStat"), kube = document.getElementById("kube");

const SLOTS = [6.85, 22.9, 36.75, 49.75, 63.05];   // U10 (head, + U11), U3, U6, U9, U8
const HEAD = 0;
const LIFT = 60;
const NAMES = ["auracore-head", "auracore-w1", "auracore-w2", "auracore-w3", "auracore-w4"];

// board CAD → base CAD: x̂→+Z (side edge down), ŷ→−X, ẑ→−Y; USB2 mouth (x 15.2, y 16.45, z 2.7) onto the plug
const SEAT_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
  new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, -1, 0)));
const FLAT_Q = new THREE.Quaternion();
const seatPos = y => new THREE.Vector3(16.45 + 47.3, y + 2.7, 7.3 - 15.2);
const FLAT_POS = new THREE.Vector3(15.6, 9, 24);

let renderer, scene, camera, controls, cad, base, boards = [], visible = false, ready = false, mode = "assembled", seq = null, lastT = 0, loadStarted = false, pendingAssemble = false;

const toCad = root => { const w = new THREE.Group(); root.scale.setScalar(1000); w.add(root); return w; }; // OCCT kept Z-up, metres → mm

function kubeTable() {
  const lines = ["$ kubectl get nodes", "NAME            STATUS     ROLES"];
  boards.forEach((b, i) => lines.push(`${NAMES[i].padEnd(16)}${(b.userData.seated ? "Ready" : "NotReady").padEnd(11)}${i === HEAD ? "control-plane,master" : "<none>"}`));
  kube.textContent = lines.join("\n");
}

const progress = {};
const showProgress = () => { const v = Object.values(progress); stat.textContent = `loading models… ${Math.round(v.reduce((a, b) => a + b, 0) / 2 * 100)}%`; };

async function load() {
  if (loadStarted) return; loadStarted = true;
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const get = url => new Promise((res, rej) => loader.load(url, res, e => { progress[url] = e.total ? e.loaded / e.total : .5; showProgress(); }, rej));
  try {
    const [gb, ga] = await Promise.all([get("assets/models/base.glb"), get("assets/models/auracore.glb")]);
    build(gb, ga);
  } catch (e) { stat.textContent = "model load failed"; console.warn(e); }
}

function setup() {
  renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: devicePixelRatio < 2, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 1, 2000);
  controls = new OrbitControls(camera, cv);
  controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = .8;
  controls.minDistance = 70; controls.maxDistance = 420; controls.enablePan = false;
  controls.addEventListener("start", () => { controls.autoRotate = false; });
  controls.addEventListener("end", () => { setTimeout(() => controls.autoRotate = !D.still, 4000); });
  scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 1.6));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.6); key.position.set(120, 200, 140); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb2ff, 1.3); rim.position.set(-160, 80, -120); scene.add(rim);
  const warm = new THREE.DirectionalLight(0xff4f1f, .7); warm.position.set(0, -60, 100); scene.add(warm);
  cad = new THREE.Group(); cad.rotation.x = -Math.PI / 2; scene.add(cad);
  const grid = new THREE.GridHelper(260, 52, 0x3a3a34, 0x24241f); grid.position.set(46, -3, -37); scene.add(grid);
  // cluster centre in CAD ≈ (40, 37, 16) → world (x, z, −y)
  controls.target.set(40, 16, -37);
  camera.position.set(40 - 115, 16 + 85, -37 + 140);
  resize();
}

function build(gb, ga) {
  base = toCad(gb.scene); cad.add(base);
  SLOTS.forEach((y, i) => {
    const b = new THREE.Group();
    b.add(toCad(i ? ga.scene.clone(true) : ga.scene));
    const led = new THREE.Mesh(new THREE.BoxGeometry(1.6, .8, .8), new THREE.MeshBasicMaterial({ color: 0x331a10 }));
    led.position.set(30.8, 56.2, 1.9); b.add(led);
    b.userData = { led, seat: seatPos(y), off: LIFT, target: LIFT, seated: false, flat: 0, flatT: 0 };
    b.quaternion.copy(SEAT_Q);
    cad.add(b); boards.push(b);
  });
  ready = true; stage.classList.add("loaded");
  stat.textContent = "drag to orbit · scroll to zoom";
  kubeTable();
  if (visible) assemble(); else pendingAssemble = true;
}

function resize() {
  if (!renderer) return;
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);

function assemble() {
  mode = "assembled"; clearTimeout(seq); base.visible = true;
  boards.forEach(b => { b.visible = true; const u = b.userData; u.off = u.target = LIFT; u.seated = false; u.flatT = 0; });
  kubeTable();
  let k = 0;
  const next = () => { if (k >= boards.length || mode !== "assembled") return; boards[k++].userData.target = 0; seq = setTimeout(next, D.still ? 0 : 620); };
  next();
}
function explode() {
  mode = "explode"; clearTimeout(seq); base.visible = true;
  boards.forEach((b, i) => { b.visible = true; b.userData.target = 30 + i * 7; b.userData.flatT = 0; });
  S.whoosh(true);
}
function solo() {
  mode = "solo"; clearTimeout(seq); base.visible = false;
  boards.forEach((b, i) => { b.visible = i === HEAD; });
  const u = boards[HEAD].userData; u.target = 0; u.flatT = 1;
  S.whoosh(false);
}
const guard = fn => () => ready && fn();
document.getElementById("auAssemble").addEventListener("click", guard(assemble));
document.getElementById("auExplode").addEventListener("click", guard(explode));
document.getElementById("auSolo").addEventListener("click", guard(solo));

const tmpP = new THREE.Vector3();
function tick(now) {
  requestAnimationFrame(tick);
  if (!ready || !visible) { lastT = now; return; }
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
  const k = D.still ? 1 : 1 - Math.pow(.0012, dt);
  boards.forEach((b, i) => {
    const u = b.userData;
    u.off += (u.target - u.off) * k;
    u.flat += (u.flatT - u.flat) * k;
    b.quaternion.slerpQuaternions(SEAT_Q, FLAT_Q, u.flat);
    tmpP.copy(u.seat).lerp(FLAT_POS, u.flat); tmpP.z += u.off; b.position.copy(tmpP);
    if (mode === "assembled" && !u.seated && u.target === 0 && u.off < .4) { u.seated = true; S.thud(.16); S.blip(i === HEAD ? 523 : 659); kubeTable(); }
    const on = u.seated && (i === HEAD ? Math.sin(now / 160) > -.2 : Math.sin(now / 90 + i * 2) > .3);
    u.led.material.color.setHex(on ? (i === HEAD ? 0xff4f1f : 0x7dff9a) : 0x331a10);
  });
  if (D.still) controls.autoRotate = false;
  controls.update();
  renderer.render(scene, camera);
}

setup();
requestAnimationFrame(tick);

// start downloading as soon as the page is idle after entering, not when scrolled to
const idle = cb => (window.requestIdleCallback ? requestIdleCallback(cb, { timeout: 2500 }) : setTimeout(cb, 1200));
document.addEventListener("d66boot", () => idle(load));
if (!document.body.classList.contains("gated")) idle(load);

new IntersectionObserver(es => {
  visible = es[es.length - 1].isIntersecting;
  if (visible) { load(); if (pendingAssemble && ready) { pendingAssemble = false; assemble(); } }
}, { rootMargin: "200px" }).observe(stage);
