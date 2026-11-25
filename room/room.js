/* ==========================================================
   dreaming66 · the workshop — a night-time maker's room in three.js.
   Scroll flies the camera along a rail between stations; click an object
   to fly to it. Everything is procedural except the AuraCore cluster,
   which is the real EasyEDA CAD (same files as the home page's §04).
   ========================================================== */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const LOGO_D = "M-91.1 37.6L-91.2 38.1L-91.5 38.4L-93.3 39.4L-94.5 40.3L-95.7 41.4L-96.7 42.6L-97.5 43.8L-98.2 45.2L-98.7 46.7L-99 48.5L-99.1 50L-99 51.5L-98.7 53.3L-98.1 54.8L-97.3 56.4L-96.5 57.7L-95.4 58.9L-94.1 60L-92.5 61L-90.5 61.9L-88.7 62.3L-86.6 62.5L-85.1 62.4L-83.3 62L-81.2 61.3L-79.1 60L-78.6 60L-78.1 60.1L-12.9 97.7L-12.6 98.1L-12.4 98.5L-12.5 100.6L-12.2 102.7L-11.8 104.2L-11.2 105.6L-10.2 107.2L-9.2 108.4L-7.9 109.7L-6.4 110.7L-5.1 111.4L-3.6 112L-2.1 112.3L-0.6 112.5L1.2 112.4L2.7 112.2L4.2 111.8L5.6 111.2L7.2 110.2L8.6 109L10 107.5L11 105.9L11.7 104.5L12.1 103L12.5 100.9L12.5 98.5L12.7 98L13 97.7L78.1 60.1L78.6 60L79.1 60L80.5 60.9L81.6 61.4L83 62L84.2 62.3L85.4 62.4L86.6 62.5L87.8 62.4L89.3 62.2L90.5 61.9L91.7 61.4L93 60.7L94.1 60L95.2 59.1L96.1 58.2L97 57L97.6 55.9L98.2 54.8L98.6 53.4L98.9 52.1L99.1 50.9L99.1 49.7L99 48.2L98.7 47L98.4 45.8L97.9 44.6L97.3 43.6L96.6 42.6L95.9 41.6L95 40.7L94 39.9L93 39.3L91.5 38.5L91.2 38.1L91.1 37.6L91.1-47.4L91-48.5L90.9-49.4L90.6-50.4L90.2-51.4L89.5-52.5L88.7-53.6L87.8-54.3L86.8-55.1L4.3-102.7L3.3-103.2L2.3-103.5L1.4-103.7L0.3-103.8L-0.8-103.8L-1.9-103.6L-2.9-103.3L-3.9-102.9L-86.6-55.2L-87.5-54.6L-88.4-53.9L-89.1-53.1L-89.7-52.2L-90.3-51L-90.7-50L-91-48.7L-91.1-47.6ZM5.1 88.6L4.7 88.2L4.5 87.5L4.5 3.3L4.7 2.7L5.1 2.3L80.3-41.2L80.9-41.3L81.5-41.2L81.9-40.7L82.1-40.1L82.1 37.5L82 38.1L81.6 38.5L80.4 39.1L79.1 39.9L78.6 40L78.1 39.9L18.9 5.8L17.9 5.5L16.8 5.4L15.8 5.6L14.8 6.1L14 6.7L13.3 7.5L12.9 8.5L12.7 9.5L12.7 10.8L13.1 11.9L13.8 12.9L14.8 13.7L73.6 47.7L74 48.1L74.2 48.6L74.1 50L74.2 51.3L74 51.9L73.6 52.3L8.5 89.9L8 90L7.5 90L6.2 89.1ZM6.2-19.6L5.6-19.5L5.1-19.7L4.7-20.1L4.5-20.7L4.5-79.3L4.6-79.8L4.9-80.2L5.2-80.4L5.7-80.5L6.3-80.4L57.1-51L57.5-50.6L57.7-50L57.5-49.4L57.1-49ZM-81.5 38.6L-81.9 38.2L-82.1 37.5L-82.1-40.1L-82-40.6L-81.7-41L-81.4-41.2L-80.9-41.3L-80.3-41.2L-5.1 2.3L-4.7 2.7L-4.5 3.3L-4.5 87.5L-4.7 88.2L-5.1 88.6L-6.2 89.1L-7.4 89.9L-8 90L-8.5 89.9L-73.6 52.3L-74 51.9L-74.2 51.4L-74.1 50L-74.2 48.5L-74 48.1L-73.6 47.7L-14.4 13.5L-13.7 12.7L-13.1 11.8L-12.7 10.8L-12.7 9.7L-12.8 8.7L-13.2 7.7L-13.9 6.8L-14.7 6.1L-15.8 5.6L-17 5.4L-18.2 5.5L-19.3 5.9L-78.1 39.9L-78.6 40L-79.1 39.9L-80.4 39.1ZM-57.2-49L-57.6-49.4L-57.7-50L-57.5-50.6L-57.1-51L-6.3-80.4L-5.9-80.5L-5.4-80.5L-5-80.3L-4.7-79.9L-4.5-79.3L-4.5-20.7L-4.7-20.1L-5.1-19.7L-5.7-19.5L-6.3-19.6ZM-80.9 50.4L-81.1 51.5L-81.5 52.6L-82.1 53.5L-82.8 54.4L-83.8 55L-84.8 55.5L-85.9 55.7L-87 55.7L-88.1 55.5L-89.2 55.1L-90.1 54.5L-91 53.8L-91.6 52.8L-92.1 51.8L-92.3 50.7L-92.3 49.6L-92.1 48.5L-91.7 47.4L-91.1 46.5L-90.4 45.6L-89.4 45L-88.4 44.5L-87.3 44.3L-86.2 44.3L-85.1 44.5L-84 44.9L-83.1 45.5L-82.2 46.2L-81.6 47.2L-81.1 48.2L-80.9 49.3ZM5.7 100.3L5.6 101.4L5.2 102.5L4.6 103.4L3.9 104.3L3 104.9L1.9 105.4L0.8 105.7L-0.3 105.7L-1.4 105.6L-2.5 105.2L-3.4 104.6L-4.3 103.9L-4.9 103L-5.4 101.9L-5.7 100.8L-5.7 99.7L-5.6 98.6L-5.2 97.5L-4.6 96.6L-3.9 95.7L-3 95.1L-1.9 94.6L-0.8 94.3L0.3 94.3L1.4 94.4L2.5 94.8L3.4 95.4L4.3 96.1L4.9 97L5.4 98.1L5.7 99.2ZM92.4 50.1L92.2 51.3L91.9 52.3L91.3 53.3L90.6 54.2L89.7 54.9L88.7 55.4L87.6 55.7L86.5 55.7L85.3 55.6L84.3 55.3L83.3 54.7L82.4 54L81.7 53.1L81.2 52.1L80.9 51L80.9 49.9L81 48.7L81.3 47.7L81.9 46.7L82.6 45.8L83.5 45.1L84.5 44.6L85.6 44.3L86.7 44.3L87.9 44.4L88.9 44.7L89.9 45.3L90.8 46L91.5 46.9L92 47.9L92.3 49Z";
const LOGO_VB = "-99.3 -104 198.6 216.7".split(" ").map(Number);

const $ = s => document.querySelector(s);
const MOBILE = matchMedia("(pointer: coarse)").matches || innerWidth < 760;
const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);

/* ---------------- copy ---------------- */
const LANGS = ["zh", "en", "ja"];
let lang = (() => { try { const q = new URLSearchParams(location.search).get("lang") || localStorage.getItem("d66-lang") || navigator.language.slice(0, 2); return LANGS.includes(q) ? q : "zh"; } catch { return "zh"; } })();
const UI = {
  zh: { home: "回到主页", hint: "滚动参观 · 点房间里的东西", click: "点击", load: "正在布置房间…" },
  en: { home: "Back home", hint: "Scroll to look around · click anything", click: "click", load: "Setting up the room…" },
  ja: { home: "ホームへ", hint: "スクロールで見て回る・クリックで近づく", click: "クリック", load: "部屋を準備中…" },
};
// stations: camera position / look-at target, and the card
const ST = [
  { key: "room", pos: [4.4, 3.3, 4.3], at: [0.1, 0.95, -0.9],
    zh: ["DRM-66 · 工作间", "欢迎来我的工作间", "写代码、画板子、调机器人都在这里。往下滚动参观，或者直接点房间里的东西。", []],
    en: ["DRM-66 · WORKSHOP", "Welcome to my workshop", "Where I write code, draw boards and tune robots. Scroll to look around, or click anything in the room.", []],
    ja: ["DRM-66 · 工房", "ようこそ、僕の工房へ", "コードを書き、基板を描き、ロボットを調整する場所。スクロールで見て回るか、気になる物をクリック。", []] },
  { key: "desk", pos: [0.0, 1.24, -0.92], at: [0.0, 1.07, -2.2], name: "MAIN RIG",
    zh: ["01 · 主机", "白天：大模型推理", "本职在 AI Infra：部署、调优、调度大模型。屏幕上滚的是这台机器的开机日志。", [["看经历 git log", "../#log", 1], ["推理实验室", "../#lab"]]],
    en: ["01 · MAIN RIG", "By day: LLM inference", "My day job is AI infra: deploying, tuning and scheduling large models. The screen is this machine booting.", [["Experience · git log", "../#log", 1], ["Inference lab", "../#lab"]]],
    ja: ["01 · メイン機", "昼は LLM 推論", "本業は AI インフラ。大規模モデルのデプロイ・チューニング・スケジューリング。画面はこのマシンの起動ログ。", [["経歴 · git log", "../#log", 1], ["推論ラボ", "../#lab"]]] },
  { key: "aura", pos: [1.05, 1.12, -1.5], at: [0.78, 0.86, -2.06], name: "AURACORE ×5",
    zh: ["02 · AuraCore 集群", "五块自己画的板子", "全志 H616 开发板，六层 PCB、手工焊接，五块插在底座上组成一个 k3s 集群。模型是真实的 EasyEDA 导出。", [["焊一块试试", "../#build", 1], ["集群 3D", "../#aura"]]],
    en: ["02 · AURACORE CLUSTER", "Five boards I drew myself", "Allwinner H616, six-layer PCB, hand-soldered; five of them on a base make a k3s cluster. The model is the real EasyEDA export.", [["Solder one", "../#build", 1], ["Cluster in 3D", "../#aura"]]],
    ja: ["02 · AuraCore クラスタ", "自分で描いた 5 枚の基板", "Allwinner H616、6 層基板を手はんだ。5 枚をベースに挿して k3s クラスタに。モデルは実際の EasyEDA 出力。", [["はんだ付けしてみる", "../#build", 1], ["クラスタ 3D", "../#aura"]]] },
  { key: "rack", pos: [0.95, 1.4, -0.2], at: [2.0, 0.66, -2.02], name: "HOMELAB RACK",
    zh: ["03 · 机柜", "家里的那台机柜", "软路由、虚拟化、Docker、K8s：工作上要用的东西，先在家里折腾一遍。", [["Homelab", "../#build", 1]]],
    en: ["03 · RACK", "The rack at home", "Soft router, hypervisor, Docker, K8s: whatever work needs, I break it at home first.", [["Homelab", "../#build", 1]]],
    ja: ["03 · ラック", "家のラック", "ソフトルーター、仮想化、Docker、K8s。仕事で使うものはまず家で壊してみる。", [["Homelab", "../#build", 1]]] },
  { key: "bench", pos: [-0.75, 1.42, -0.35], at: [-2.0, 1.0, -0.75], name: "WORKBENCH",
    zh: ["04 · 工作台", "示波器、电台、摆线关节", "左边是示波器和 SDR 电台（呼号 BH3FWY），中间那块蓝绿色的是 3D 打印的摆线减速器，电机还在路上。", [["正在折腾", "../#wip", 1]]],
    en: ["04 · WORKBENCH", "Scope, radio, cycloid joint", "A scope and an SDR radio (callsign BH3FWY); the teal part is the 3D-printed cycloidal reducer, motor still in transit.", [["Work in progress", "../#wip", 1]]],
    ja: ["04 · 作業台", "オシロ、無線機、サイクロイド関節", "オシロスコープと SDR 無線機（コールサイン BH3FWY）。青緑の部品は 3D プリントしたサイクロイド減速機、モーター待ち。", [["進行中", "../#wip", 1]]] },
  { key: "bot", pos: [2.85, 1.15, 1.05], at: [1.33, 0.46, -0.55], name: "BIPED · RL",
    zh: ["05 · 双足机器人", "房间的主人", "RL 步态策略已经在仿真里会走了，真机在攒零件。主页上可以实时推它一把。", [["玩实时仿真", "../biped/", 1], ["正在折腾", "../#wip"]]],
    en: ["05 · BIPED", "Who runs the room", "The RL gait policy already walks in simulation; the real one is being built. Shove it live on the home page.", [["Play the live sim", "../biped/", 1], ["Work in progress", "../#wip"]]],
    ja: ["05 · 二足ロボット", "この部屋の主", "RL 歩容方策はシミュレーションでもう歩ける。実機は部品集め中。ホームでリアルタイムに押せる。", [["ライブシムで遊ぶ", "../biped/", 1], ["進行中", "../#wip"]]] },
  { key: "sign", pos: [0.1, 1.75, -0.35], at: [0.1, 2.05, -2.45], name: "NEON · DUSTINZ",
    zh: ["06 · 来找我", "一个开着口的盒子", "灯牌是我的标志。联系方式不公开，去 GitHub 找我。", [["github.com/dreaming66", "https://github.com/dreaming66", 1], ["回到主页", "../"]]],
    en: ["06 · SAY HI", "A box with its lid open", "The neon is my mark. No contact details here: find me on GitHub.", [["github.com/dreaming66", "https://github.com/dreaming66", 1], ["Back home", "../"]]],
    ja: ["06 · 連絡", "ふたの開いた箱", "ネオンは僕のマーク。連絡先は非公開、GitHub で見つけて。", [["github.com/dreaming66", "https://github.com/dreaming66", 1], ["ホームへ", "../"]]] },
];
const N = ST.length;

/* ---------------- HUD ---------------- */
const cardsEl = $("#cards"), dotsEl = $("#dots");
function renderHud() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  document.querySelectorAll("[data-t]").forEach(e => e.textContent = UI[lang][e.dataset.t]);
  $("#lang").textContent = { zh: "中", en: "EN", ja: "日" }[lang];
  cardsEl.innerHTML = ST.map((s, i) => { const [tag, h, p, links] = s[lang];
    return `<article class="card" data-i="${i}"><div class="tag">${tag}</div><h2>${h}</h2><p>${p}</p>${links.length ? `<div class="go">${links.map(([t, u, ink]) => `<a href="${u}"${u.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}${ink ? ' class="ink"' : ""}><span>${t}</span><b>${u.startsWith("http") ? "↗" : "→"}</b></a>`).join("")}</div>` : ""}</article>`; }).join("");
  dotsEl.innerHTML = ST.map((s, i) => `<button type="button" data-i="${i}"><span>${s[lang][0].replace(/^\d+ · /, "")}</span><i></i></button>`).join("");
  dotsEl.querySelectorAll("button").forEach(b => b.onclick = () => goTo(+b.dataset.i));
  shown = -1;
}
$("#lang").onclick = () => { lang = LANGS[(LANGS.indexOf(lang) + 1) % 3]; try { localStorage.setItem("d66-lang", lang); } catch {} renderHud(); };

/* ---------------- renderer / scene ---------------- */
const canvas = $("#gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.3 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !MOBILE; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e0c);
scene.fog = new THREE.Fog(0x0e0e0c, 9, 16);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .16;
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .05, 60);

let composer = null, bloom = null;
if (!MOBILE) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .6, .55, .8);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}

/* ---------------- helpers ---------------- */
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: .05, ...o });
const mat = {
  wall: M(0x2a2722, { roughness: .95 }), wall2: M(0x23211d, { roughness: .95 }), trim: M(0x141412),
  wood: M(0x8b6a47, { roughness: .62 }), ink: M(0x161614, { roughness: .55 }), metal: M(0x8d8f8c, { roughness: .35, metalness: .7 }),
  paper: M(0xe9e3d6, { roughness: .7 }), brand: M(0xfdb913, { roughness: .45 }), ver: M(0xff4f1f, { roughness: .5 }),
  rug: M(0x7a3420, { roughness: 1 }), plastic: M(0x2b2b28, { roughness: .5 }), teal: M(0x5cc7bf, { roughness: .55 }),
  pcb: M(0x1f5c3b, { roughness: .6 }), glass: M(0x0b0d10, { roughness: .15, metalness: .3 }),
};
const add = (parent, mesh, x = 0, y = 0, z = 0, cast = true) => { mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh); return mesh; };
const box = (parent, w, h, d, m, x, y, z, cast) => add(parent, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z, cast);
const cyl = (parent, r, h, m, x, y, z, seg = 24, r2 = r) => add(parent, new THREE.Mesh(new THREE.CylinderGeometry(r, r2, h, seg), m), x, y, z);
const canvasTex = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { c, g: c.getContext("2d"), t }; };
const screenMat = tex => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
const interactive = []; // { group, station, name }
const tag = (group, station, name) => { interactive.push({ group, station, name }); group.traverse(o => { if (o.isMesh) o.userData.hit = group; }); };

/* ---------------- the room shell ---------------- */
const room = new THREE.Group(); scene.add(room);
{ // floor planks
  const { c, g, t } = canvasTex(512, 512);
  g.fillStyle = "#3a2f25"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(${26 + (i * 7) % 6}, ${28 + (i * 13) % 10}%, ${19 + (i * 5) % 6}%)`; g.fillRect(0, i * 64 + 1, 512, 62); }
  g.strokeStyle = "#1c1611"; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); }
  for (let i = 0; i < 8; i++) { const x = (i * 197) % 512; g.beginPath(); g.moveTo(x, i * 64); g.lineTo(x, i * 64 + 64); g.stroke(); }
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 2.5);
  const floor = add(room, new THREE.Mesh(new THREE.BoxGeometry(5, .12, 5), [mat.trim, mat.trim, M(0xffffff, { map: t, roughness: .8 }), mat.trim, mat.trim, mat.trim]), 0, -.06, 0, false);
  floor.receiveShadow = true;
}
box(room, 5, 3, .12, mat.wall, 0, 1.5, -2.56, false);            // back wall
box(room, .12, 3, 5.12, mat.wall2, -2.56, 1.5, -.06, false);     // left wall
box(room, 5, .08, .04, mat.trim, 0, .04, -2.48, false);           // skirting
box(room, .04, .08, 5, mat.trim, -2.48, .04, 0, false);
add(room, new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .012, 48), mat.rug), .25, .006, -.95, false);

{ // window on the left wall: night sky and a skyline
  const { g, t } = canvasTex(512, 384);
  const sky = g.createLinearGradient(0, 0, 0, 384); sky.addColorStop(0, "#070b18"); sky.addColorStop(1, "#1d2a4a"); g.fillStyle = sky; g.fillRect(0, 0, 512, 384);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .7})`; g.fillRect(Math.random() * 512, Math.random() * 230, 1.5, 1.5); }
  g.fillStyle = "#f6f1d8"; g.beginPath(); g.arc(400, 70, 22, 0, 7); g.fill(); g.fillStyle = "#070b18"; g.beginPath(); g.arc(410, 64, 20, 0, 7); g.fill();
  let x = 0; while (x < 512) { const w = 30 + Math.random() * 50, h = 60 + Math.random() * 140; g.fillStyle = "#05070d"; g.fillRect(x, 384 - h, w, h);
    for (let wy = 384 - h + 8; wy < 380; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 9) if (Math.random() < .22) { g.fillStyle = Math.random() < .8 ? "#fdb913" : "#9fe8ff"; g.fillRect(wx, wy, 4, 5); }
    x += w + 4; }
  const win = new THREE.Group(); win.position.set(-2.49, 1.65, .55); win.rotation.y = Math.PI / 2; room.add(win);
  add(win, new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), screenMat(t)), 0, 0, 0, false);
  for (const [w, h, x, y] of [[1.62, .07, 0, .58], [1.62, .07, 0, -.58], [.07, 1.2, -.78, 0], [.07, 1.2, .78, 0], [.04, 1.1, 0, 0], [1.5, .04, 0, .05]]) box(win, w, h, .06, mat.trim, x, y, .02, false);
  box(win, 1.7, .05, .16, mat.paper, 0, -.62, .07, false);
  const moon = new THREE.DirectionalLight(0x7d95d6, .55); moon.position.set(-4, 2.6, 1.2); moon.target.position.set(0, 0, -.5); scene.add(moon, moon.target);
}

{ // poster with the site's type
  const { g, t } = canvasTex(512, 720);
  document.fonts.load('italic 120px "Instrument Serif"').then(() => {
    g.fillStyle = "#f1ede3"; g.fillRect(0, 0, 512, 720);
    g.fillStyle = "#ff4f1f"; g.font = "700 22px 'JetBrains Mono', monospace"; g.fillText("PART NO. DRM-66", 40, 64);
    g.fillStyle = "#141412"; g.font = "120px 'Instrument Serif', serif"; g.fillText("dream", 34, 330);
    g.font = "italic 120px 'Instrument Serif', serif"; g.fillStyle = "#ff4f1f"; g.fillText("ing", 34, 440);
    g.fillStyle = "#141412"; g.font = "italic 150px 'Instrument Serif', serif"; g.fillText("66", 230, 570);
    g.fillRect(40, 620, 432, 3); g.font = "600 20px 'JetBrains Mono', monospace"; g.fillText("FROM SOLDER TO TENSORS", 40, 666);
    t.needsUpdate = true;
  });
  const p = add(room, new THREE.Mesh(new THREE.PlaneGeometry(.62, .87), M(0xffffff, { map: t, roughness: .9 })), -2.49, 1.75, -1.35, false);
  p.rotation.y = Math.PI / 2;
}

/* ---------------- desk ---------------- */
const desk = new THREE.Group(); desk.position.set(.15, 0, -2.05); room.add(desk);
box(desk, 2.1, .05, .78, mat.wood, 0, .74, 0);
for (const x of [-1, 1]) for (const z of [-.33, .33]) box(desk, .05, .72, .05, mat.ink, x, .36, z);
box(desk, 2.0, .04, .04, mat.ink, 0, .14, -.33);

// monitor + its screen (a little OS drawn on a canvas)
const rig = new THREE.Group(); rig.position.set(-.13, 0, -.1); desk.add(rig);
box(rig, .7, .42, .03, mat.plastic, 0, 1.1, 0);
box(rig, .06, .2, .04, mat.plastic, 0, .86, -.02); box(rig, .26, .015, .16, mat.plastic, 0, .77, -.02);
const OS = canvasTex(1024, 576);
const screen = add(rig, new THREE.Mesh(new THREE.PlaneGeometry(.66, .3712), screenMat(OS.t)), 0, 1.1, .0155, false);
const glow = new THREE.PointLight(0x9fe8ff, 1.2, 2.4, 2); glow.position.set(0, 1.1, .35); rig.add(glow);
// keyboard: instanced keys
{
  const kb = new THREE.Group(); kb.position.set(0, .765, .2); rig.add(kb);
  box(kb, .46, .018, .15, mat.plastic, 0, 0, 0);
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(.026, .012, .026), M(0xffffff, { roughness: .6 }), 15 * 5);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(); let k = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) { m4.makeTranslation(-.21 + c * .03, .014, -.06 + r * .03); keys.setMatrixAt(k, m4);
    keys.setColorAt(k++, col.set((r === 4 && c > 4 && c < 10) ? 0x2b2b28 : (r === 0 && c === 0) || (r === 2 && c === 14) ? 0xff4f1f : 0x1d1d1b)); }
  keys.castShadow = true; kb.add(keys);
  box(kb, .07, .02, .11, mat.plastic, .33, .002, .01);   // mouse
}
// a mug
cyl(desk, .04, .1, mat.paper, .45, .8, .22); cyl(desk, .036, .005, M(0x2a1a10), .45, .85, .22);
tag(rig, 1, "MAIN RIG");

function drawOS(t) {
  const g = OS.g, W = 1024, H = 576;
  g.fillStyle = "#0f0f0d"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1c1b18"; g.fillRect(0, 0, W, 34);
  g.fillStyle = "#fdb913"; g.font = "700 17px 'JetBrains Mono', monospace"; g.fillText("■ DRM-66 OS", 16, 23);
  g.fillStyle = "#9a968a"; g.textAlign = "right"; g.fillText(new Date().toTimeString().slice(0, 8), W - 16, 23); g.textAlign = "left";
  // desktop icons
  const icons = [["git log", "#ff4f1f"], ["auracore", "#fdb913"], ["lab", "#7dff9a"], ["biped", "#9fe8ff"], ["radio", "#c79bff"], ["ping", "#f1ede3"]];
  icons.forEach(([n, c], i) => { const x = 28, y = 64 + i * 80; g.fillStyle = "#1f1e1b"; g.fillRect(x, y, 52, 52); g.fillStyle = c; g.fillRect(x + 14, y + 14, 24, 24);
    g.fillStyle = "#cfcabd"; g.font = "500 14px 'JetBrains Mono', monospace"; g.fillText(n, x - 4, y + 70); });
  // terminal
  const wx = 150, wy = 62, ww = 840, wh = 480;
  g.fillStyle = "#161614"; g.fillRect(wx, wy, ww, wh); g.fillStyle = "#24231f"; g.fillRect(wx, wy, ww, 30);
  [["#ff4f1f", 0], ["#fdb913", 1], ["#7dff9a", 2]].forEach(([c, i]) => { g.fillStyle = c; g.beginPath(); g.arc(wx + 18 + i * 20, wy + 15, 6, 0, 7); g.fill(); });
  g.fillStyle = "#8d887b"; g.font = "500 14px 'JetBrains Mono', monospace"; g.fillText("tty0 — drm-66", wx + 84, wy + 20);
  const n = Math.floor(t * 2.2) % (BOOT.length + 8);
  g.font = "500 17px 'JetBrains Mono', monospace";
  BOOT.slice(Math.max(0, n - 20), Math.min(n, BOOT.length)).forEach(([s, c], i) => { g.fillStyle = c; g.fillText(s, wx + 20, wy + 60 + i * 21); });
  if (Math.floor(t * 2) % 2) { const rows = Math.min(n, BOOT.length) - Math.max(0, n - 20); g.fillStyle = "#7dff9a"; g.fillRect(wx + 20, wy + 46 + rows * 21, 10, 18); }
  // the mark, bottom right
  if (LOGO) { g.save(); g.translate(W - 70, H - 82); g.scale(.25, .25); g.translate(-LOGO_VB[0], -LOGO_VB[1]); g.fillStyle = "#fdb913"; g.fill(LOGO, "evenodd"); g.restore(); }
  OS.t.needsUpdate = true;
}
const OK = "#7dff9a", DIM = "#8d887b", WARN = "#fdb913", HEAD = "#ff4f1f";
const BOOT = [["DRM-66 BIOS v6.6 · (c) 2026 dreaming66", HEAD], ["CPU0 ........ curiosity @ ∞ GHz", OK], ["BOARD ........ AuraCore V2.0 · H616", OK], ["CLUSTER ........ 1 head + 4 workers · k3s", OK],
  ["NPU ........ 96 cards · HCCL ring up", OK], ["KV-CACHE ........ mooncake pool mounted", OK], ["RF ........ 144–146 MHz · DE BH3FWY", OK], ["ACTUATOR ........ cycloidal 5010 · motor in transit", WARN],
  ["GAIT POLICY ........ PPO · 192M steps", OK], ["PRIVACY ........ phone / email → REDACTED", WARN], ["", DIM], ["$ kubectl get nodes", "#f1ede3"], ["auracore-head   Ready   control-plane", OK],
  ["auracore-w1     Ready   <none>", OK], ["auracore-w2     Ready   <none>", OK], ["auracore-w3     Ready   <none>", OK], ["auracore-w4     Ready   <none>", OK], ["", DIM], ["$ vllm serve --tp 8", "#f1ede3"],
  ["INFO  prefill/decode disaggregated · TTFT 182 ms", OK], ["INFO  serving on :8000", OK]];
let LOGO = null; try { LOGO = new Path2D(LOGO_D); } catch {}

// desk lamp (brand yellow) with the key light
{
  const lamp = new THREE.Group(); lamp.position.set(-.97, .765, -.16); desk.add(lamp);
  cyl(lamp, .08, .025, mat.ink, 0, .012, 0);
  const a1 = box(lamp, .025, .42, .025, mat.ink, .07, .2, 0); a1.rotation.z = -.35;
  const a2 = box(lamp, .025, .34, .025, mat.ink, .24, .46, 0); a2.rotation.z = 1.05;
  const head = new THREE.Group(); head.position.set(.39, .5, 0); head.rotation.z = -2.3; lamp.add(head);
  add(head, new THREE.Mesh(new THREE.ConeGeometry(.09, .14, 24, 1, true), M(0xfdb913, { side: THREE.DoubleSide, roughness: .4 })), 0, 0, 0);
  add(head, new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 8), new THREE.MeshBasicMaterial({ color: 0xfff2d0 })), 0, -.04, 0, false);
  const spot = new THREE.SpotLight(0xffd8a0, 6, 3.2, .9, .55, 1.6); spot.position.set(.43, .47, 0);
  const tgt = new THREE.Object3D(); tgt.position.set(.75, -.05, .05); lamp.add(tgt); spot.target = tgt;
  spot.castShadow = !MOBILE; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0006; spot.shadow.radius = 4; lamp.add(spot);
}
// soldering mat with a board on the desk front
box(desk, .4, .006, .28, M(0x2f5f86, { roughness: .9 }), .62, .768, .17, false);

/* ---------------- AuraCore cluster (real CAD) ---------------- */
const cluster = new THREE.Group(); cluster.position.set(.63, .765, -.04); cluster.rotation.y = -.5; desk.add(cluster);
tag(cluster, 2, "AURACORE ×5");
box(cluster, .28, .002, .2, M(0x1a1a18), 0, 0, 0, false); // a little pad so it reads before the model loads
async function loadCluster() {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const get = url => new Promise((res, rej) => loader.load(url, res, e => { prog[url] = e.total ? e.loaded / e.total : .5; showProg(); }, rej));
  const [gb, ga] = await Promise.all([get("../assets/models/base-lite.glb"), get("../assets/models/auracore-lite.glb")]);
  const toCad = root => { root.traverse(o => { if (o.isMesh) { o.material.flatShading = true; o.castShadow = true; o.receiveShadow = true; } }); const w = new THREE.Group(); root.scale.setScalar(1000); w.add(root); return w; };
  const cad = new THREE.Group(); cad.rotation.x = -Math.PI / 2;
  cad.add(toCad(gb.scene));
  const SEAT_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
  [6.85, 22.9, 36.75, 49.75, 63.05].forEach((y, i) => { const b = toCad(i ? ga.scene.clone(true) : ga.scene); b.quaternion.copy(SEAT_Q); b.position.set(47.3 - 4.2, y - 2.7, 7.3 - 15.2); cad.add(b);
    const led = new THREE.Mesh(new THREE.BoxGeometry(1.6, .8, .8), new THREE.MeshBasicMaterial({ color: 0x7dff9a, toneMapped: false })); led.position.set(30.8, 56.2, 1.9); b.add(led); leds.push(led); });
  const wrap = new THREE.Group(); wrap.add(cad); wrap.scale.setScalar(.0034); // mm → m, a touch bigger than life so it reads
  wrap.position.set(-55 * .0034, 0, 37 * .0034 - .01); // CAD centre (55, 37) over the pad
  cluster.add(wrap);
  cluster.traverse(o => { if (o.isMesh) o.userData.hit = cluster; });
  hitBoxes.delete(cluster);
}
const leds = [];

/* ---------------- homelab rack ---------------- */
const rack = new THREE.Group(); rack.position.set(2.05, 0, -2.05); rack.rotation.y = -.5; room.add(rack);
box(rack, .55, 1.25, .55, M(0x1f1f1c, { roughness: .5, metalness: .3 }), 0, .625, 0);
for (const x of [-.27, .27]) box(rack, .015, 1.25, .015, mat.metal, x, .625, .275, false);
const rackGlow = new THREE.PointLight(0x7dff9a, .35, 1.4, 2); rackGlow.position.set(0, .7, .2); rack.add(rackGlow);
box(rack, .5, 1.17, .01, M(0x0b0d10, { roughness: .55, metalness: .1, transparent: true, opacity: .55 }), 0, .63, .29, false);
const rackLeds = new THREE.InstancedMesh(new THREE.BoxGeometry(.012, .008, .004), new THREE.MeshBasicMaterial({ toneMapped: false }), 7 * 12);
{ const m4 = new THREE.Matrix4(); let k = 0; for (let u = 0; u < 7; u++) { box(rack, .46, .1, .02, M(0x3a3a35, { roughness: .45, metalness: .4 }), 0, .2 + u * .14, .27, false); for (let j = 0; j < 12; j++) { m4.makeTranslation(-.19 + j * .022, .2 + u * .14 + .025, .285); rackLeds.setMatrixAt(k, m4); rackLeds.setColorAt(k++, new THREE.Color(0x7dff9a)); } } }
rack.add(rackLeds);
tag(rack, 3, "HOMELAB RACK");

/* ---------------- workbench on the left wall ---------------- */
const bench = new THREE.Group(); bench.position.set(-2.08, 0, -.75); bench.rotation.y = Math.PI / 2; room.add(bench);
box(bench, 1.7, .05, .62, mat.wood, 0, .86, 0);
for (const x of [-.8, .8]) for (const z of [-.26, .26]) box(bench, .05, .84, .05, mat.ink, x, .42, z);
box(bench, 1.6, .03, .5, mat.wood, 0, .3, 0);
// pegboard behind it
{ const { g, t } = canvasTex(512, 256); g.fillStyle = "#6b5a44"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#3d3326"; for (let x = 12; x < 512; x += 24) for (let y = 12; y < 256; y += 24) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  add(bench, new THREE.Mesh(new THREE.PlaneGeometry(1.6, .8), M(0xffffff, { map: t, roughness: .9 })), 0, 1.45, -.36, false);
  for (const [x, y, w, h, m] of [[-.6, 1.55, .03, .3, mat.ver], [-.5, 1.5, .03, .22, mat.brand], [-.4, 1.55, .02, .28, mat.metal], [.55, 1.4, .25, .02, mat.metal], [.6, 1.55, .18, .18, mat.ink]]) box(bench, w, h, .02, m, x, y, -.34); }
// oscilloscope
const scope = new THREE.Group(); scope.position.set(-.48, .885, -.08); bench.add(scope);
box(scope, .4, .22, .26, M(0xd6d2c6, { roughness: .6 }), 0, .11, 0);
const SC = canvasTex(256, 160);
add(scope, new THREE.Mesh(new THREE.PlaneGeometry(.22, .14), screenMat(SC.t)), -.06, .12, .131, false);
for (let i = 0; i < 6; i++) { const k = cyl(scope, .012, .02, mat.ink, .1 + (i % 2) * .05, .06 + Math.floor(i / 2) * .05, .135, 16); k.rotation.x = Math.PI / 2; }
// SDR radio
const radio = new THREE.Group(); radio.position.set(.02, .885, -.05); bench.add(radio);
box(radio, .32, .1, .24, mat.ink, 0, .05, 0);
const RW = canvasTex(256, 96);
add(radio, new THREE.Mesh(new THREE.PlaneGeometry(.16, .06), screenMat(RW.t)), -.05, .055, .121, false);
{ const k = cyl(radio, .028, .025, mat.metal, .1, .05, .13, 24); k.rotation.x = Math.PI / 2; }
cyl(radio, .006, .32, mat.ink, .13, .26, -.08, 8);   // antenna
// cycloid reducer: a lobed disc wobbling on its eccentric
const joint = new THREE.Group(); joint.position.set(.48, .885, .02); bench.add(joint);
{
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .045, 48, 1, true), M(0x5cc7bf, { side: THREE.DoubleSide, roughness: .55 })); ring.position.y = .03; ring.castShadow = true; joint.add(ring);
  cyl(joint, .125, .012, mat.teal, 0, .006, 0, 48);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; cyl(joint, .007, .045, mat.metal, Math.cos(a) * .105, .03, Math.sin(a) * .105, 10); }
  const sh = new THREE.Shape(); const L = 11;
  for (let i = 0; i <= 220; i++) { const t = i / 220 * Math.PI * 2, r = .088 + .0075 * Math.cos(L * t); const x = r * Math.cos(t), y = r * Math.sin(t); i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const hole = (cx, cy, r) => { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); sh.holes.push(p); };
  hole(0, 0, .02); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; hole(Math.cos(a) * .052, Math.sin(a) * .052, .012); }
  const disc = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .016, bevelEnabled: false, curveSegments: 6 }), mat.teal); disc.rotation.x = -Math.PI / 2; disc.position.y = .022; disc.castShadow = true;
  joint.add(disc); joint.userData.disc = disc;
}
// soldering station
{ const st = new THREE.Group(); st.position.set(.6, .885, -.2); bench.add(st); box(st, .12, .08, .14, mat.ver, 0, .04, 0); const iron = cyl(st, .008, .2, mat.ink, -.06, .12, .02, 10); iron.rotation.z = .6; }
tag(bench, 4, "WORKBENCH");

/* ---------------- the biped (owner of the room) ---------------- */
const bot = new THREE.Group(); bot.position.set(1.35, 0, -.55); bot.rotation.y = .62; room.add(bot);
const L1 = .24, L2 = .24, FOOT = .035;
const pelvis = new THREE.Group(); bot.add(pelvis);
box(pelvis, .24, .07, .14, mat.paper, 0, 0, 0);
box(pelvis, .2, .18, .12, mat.paper, 0, .13, -.01);
const eye = box(pelvis, .14, .022, .005, new THREE.MeshBasicMaterial({ color: 0x7dff9a, toneMapped: false }), 0, .17, .052, false);
box(pelvis, .06, .06, .005, mat.brand, -.06, .09, .051, false);
const legs = [];
for (const s of [-1, 1]) {
  const hip = new THREE.Group(); hip.position.set(s * .085, -.04, 0); pelvis.add(hip);
  const hm = cyl(hip, .04, .05, mat.brand, 0, 0, 0, 24); hm.rotation.z = Math.PI / 2;
  box(hip, .05, L1, .05, mat.ink, 0, -L1 / 2, 0);
  const knee = new THREE.Group(); knee.position.y = -L1; hip.add(knee);
  const km = cyl(knee, .035, .055, mat.brand, 0, 0, 0, 24); km.rotation.z = Math.PI / 2;
  box(knee, .045, L2, .045, mat.paper, 0, -L2 / 2, 0);
  const ankle = new THREE.Group(); ankle.position.y = -L2; knee.add(ankle);
  box(ankle, .07, FOOT, .17, mat.ink, 0, -FOOT / 2, .03);
  legs.push({ hip, knee, ankle });
}
tag(bot, 5, "BIPED · RL");
function poseBot(t) {
  const a = .32 + .07 * Math.sin(t * 1.7), sway = .012 * Math.sin(t * .85);
  for (const [i, l] of legs.entries()) { const da = i ? .02 * Math.sin(t * .85) : -.02 * Math.sin(t * .85); l.hip.rotation.x = -(a + da); l.knee.rotation.x = 2 * (a + da); l.ankle.rotation.x = -(a + da); }
  pelvis.position.set(sway, FOOT + (L1 + L2) * Math.cos(a) + .04, 0);
  eye.scale.x = (Math.sin(t * .6) > .97) ? .1 : 1;   // blink
}

/* ---------------- neon sign: the cube mark ---------------- */
const sign = new THREE.Group(); sign.position.set(.12, 2.12, -2.47); room.add(sign);
{
  // compact SVG path (M/L/Z) → shapes; outer rings by area sign, holes go to the outer that contains them
  const rings = LOGO_D.split("M").filter(Boolean).map(r => r.replace(/Z$/, "").split("L").map(p => p.trim().split(/[ ,]+|(?=-)/).filter(Boolean).map(Number)));
  const area = r => r.reduce((s, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return s + x * y2 - x2 * y; }, 0) / 2;
  const inside = ([px, py], r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c; } return c; };
  const big = rings.reduce((a, r) => Math.abs(area(r)) > Math.abs(area(a)) ? r : a, rings[0]), sgn = Math.sign(area(big));
  const outers = rings.filter(r => Math.sign(area(r)) === sgn), holes = rings.filter(r => Math.sign(area(r)) !== sgn);
  const toV = r => r.map(([x, y]) => new THREE.Vector2(x, -y));
  const shapes = outers.map(o => { const s = new THREE.Shape(toV(o)); holes.filter(h => inside(h[0], o)).forEach(h => s.holes.push(new THREE.Path(toV(h)))); return s; });
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 6, bevelEnabled: false });
  geo.computeBoundingBox(); const bb = geo.boundingBox; geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, 0);
  const neon = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfdb913).multiplyScalar(1.9), toneMapped: false }));
  neon.scale.setScalar(.0026); sign.add(neon); sign.userData.neon = neon;
  box(sign, .66, .7, .02, M(0x111110, { roughness: .3, metalness: .2 }), 0, 0, -.015, false);
  const nl = new THREE.PointLight(0xfdb913, 2.2, 3.2, 2); nl.position.set(0, 0, .35); sign.add(nl); sign.userData.light = nl;
}
tag(sign, 6, "NEON · DUSTINZ");

/* ---------------- chair ---------------- */
{ const ch = new THREE.Group(); ch.position.set(.05, 0, -1.25); ch.rotation.y = .35; room.add(ch);
  cyl(ch, .02, .38, mat.metal, 0, .22, 0, 10);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, leg = box(ch, .3, .025, .03, mat.ink, Math.cos(a) * .14, .04, Math.sin(a) * .14); leg.rotation.y = -a; }
  box(ch, .46, .07, .44, mat.plastic, 0, .45, 0); box(ch, .44, .55, .06, mat.plastic, 0, .78, .22); box(ch, .2, .04, .05, mat.ver, 0, .98, .25); }

// shelf with boxes above the bench end
{ const sh = new THREE.Group(); sh.position.set(-.85, 1.75, -2.43); room.add(sh); box(sh, .9, .03, .22, mat.wood, 0, 0, 0);
  [[.18, .22, mat.paper, -.32], [.12, .3, mat.ver, -.15], [.1, .26, mat.ink, -.03], [.2, .14, mat.brand, .16], [.14, .2, mat.teal, .34]].forEach(([w, h, m, x]) => box(sh, w, h, .16, m, x, h / 2 + .015, 0)); }

scene.add(new THREE.HemisphereLight(0x7a8bb8, 0x2a1d12, .35));
const fill = new THREE.PointLight(0xffb58a, .5, 6, 2); fill.position.set(1.5, 2.6, .8); scene.add(fill);

/* ---------------- loading ---------------- */
const prog = {};
const showProg = () => { const v = Object.values(prog); $("#loadTxt").textContent = `${UI[lang].load} ${Math.round(v.reduce((a, b) => a + b, 0) / 2 * 100)}%`; };
const ready = () => $("#load").classList.add("off");
loadCluster().catch(e => console.warn("cluster", e)).finally(ready);
setTimeout(ready, 6000); // never hold the room hostage to a slow model

/* ---------------- the rail ---------------- */
const posCurve = new THREE.CatmullRomCurve3(ST.map(s => new THREE.Vector3(...s.pos)), false, "centripetal");
const atCurve = new THREE.CatmullRomCurve3(ST.map(s => new THREE.Vector3(...s.at)), false, "centripetal");
const track = $("#track");
const setTrack = () => { track.style.height = `${(N - 1) * innerHeight + innerHeight}px`; };
setTrack();
let p = 0, pTarget = 0, shown = -1;
const camPos = new THREE.Vector3(), camAt = new THREE.Vector3(), mouse = new THREE.Vector2(), par = new THREE.Vector2();
function railAt(prog) {
  const k = Math.min(Math.floor(prog), N - 2), f = prog - k;
  const e = smooth(clamp((f - .18) / .64, 0, 1));            // dwell at each station, travel in between
  const u = (k + e) / (N - 1);
  posCurve.getPoint(u, camPos); atCurve.getPoint(u, camAt);
}
const goTo = i => scrollTo({ top: i * innerHeight, behavior: STILL ? "auto" : "smooth" });
addEventListener("scroll", () => { pTarget = clamp(scrollY / innerHeight, 0, N - 1); $("#hint").style.opacity = scrollY > 40 ? 0 : 1; }, { passive: true });

/* ---------------- hover / click ---------------- */
const ray = new THREE.Raycaster(), bracket = $("#bracket"), hitBoxes = new Map();
const meshes = () => { const out = []; interactive.forEach(({ group }) => group.traverse(o => { if (o.isMesh) out.push(o); })); return out; };
let hover = null, lastMove = performance.now(), cueOn = false;
const boxFor = group => { if (group === bot || !hitBoxes.has(group)) hitBoxes.set(group, new THREE.Box3().setFromObject(group)); return hitBoxes.get(group); };
function bracketFor(group, label, cue) {
  const b = boxFor(group); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const v = new THREE.Vector3();
  for (let i = 0; i < 8; i++) { v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camera);
    if (v.z > 1) return bracket.classList.remove("on"); const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); }
  const pad = 10; Object.assign(bracket.style, { left: `${x0 - pad}px`, top: `${y0 - pad}px`, width: `${x1 - x0 + pad * 2}px`, height: `${y1 - y0 + pad * 2}px` });
  bracket.querySelector("span").textContent = `${label} · ${UI[lang].click}`;
  bracket.classList.add("on"); bracket.classList.toggle("cue", !!cue);
}
function pick(e) {
  mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(meshes(), false)[0];
  return hit ? interactive.find(it => it.group === hit.object.userData.hit) : null;
}
canvas.addEventListener("pointermove", e => {
  lastMove = performance.now(); par.set(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5);
  if (e.pointerType !== "mouse") return;
  hover = pick(e); document.body.classList.toggle("has-hover", !!hover);
});
canvas.addEventListener("pointerleave", () => { hover = null; document.body.classList.remove("has-hover"); });
canvas.addEventListener("click", e => { const it = pick(e); if (it) goTo(it.station); });
addEventListener("wheel", () => lastMove = performance.now(), { passive: true });

/* ---------------- loop ---------------- */
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w / h < .8 ? 52 : 38; camera.updateProjectionMatrix();
  if (composer) { composer.setSize(w, h); bloom.setSize(w, h); }
  setTrack(); pTarget = clamp(scrollY / innerHeight, 0, N - 1); hitBoxes.clear();
}
addEventListener("resize", resize); resize();

let last = performance.now(), osT = 0, slowT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
  p += (pTarget - p) * (1 - Math.exp(-dt * (STILL ? 30 : 4.5)));
  railAt(p);
  const near = Math.round(p), wob = MOBILE ? 0 : 1;
  camera.position.copy(camPos).add(new THREE.Vector3(par.x * .12 * wob, -par.y * .07 * wob, 0));
  camera.lookAt(camAt);
  // cards + dots
  const cur = Math.abs(p - near) < .3 ? near : -1;
  if (cur !== shown) { shown = cur; cardsEl.querySelectorAll(".card").forEach(c => c.classList.toggle("on", +c.dataset.i === cur)); dotsEl.querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.i === near)); }
  // live bits
  if (!STILL) {
    poseBot(t);
    const d = joint.userData.disc; const w = t * 2.2; d.position.x = Math.cos(w) * .006; d.position.z = Math.sin(w) * .006; d.rotation.z = -w / 11;
    const nf = .95 + .05 * Math.sin(t * 9) * (Math.sin(t * 1.3) > .985 ? 6 : .2); sign.userData.light.intensity = 2.2 * nf; sign.userData.neon.material.color.setHex(0xfdb913).multiplyScalar(1.9 * nf);
  }
  osT += dt; if (osT > 1 / 12) { osT = 0; if (near <= 1 || p < .1) drawOS(t); drawScope(t); drawWaterfall(t); }
  slowT += dt; if (slowT > .25) { slowT = 0; blink(); }
  // hover bracket, or an idle cue on the monitor at the start
  if (hover) bracketFor(hover.group, hover.name);
  else if (p < .15 && now - lastMove > 5000 && !MOBILE) { bracketFor(rig, "MAIN RIG", true); cueOn = true; }
  else { bracket.classList.remove("on"); cueOn = false; }
  if (composer) composer.render(); else renderer.render(scene, camera);
}
function drawScope(t) {
  const g = SC.g; g.fillStyle = "#06120a"; g.fillRect(0, 0, 256, 160);
  g.strokeStyle = "#13331d"; g.lineWidth = 1; for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 160); g.stroke(); } for (let y = 0; y <= 160; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  g.strokeStyle = "#7dff9a"; g.lineWidth = 2; g.beginPath(); for (let x = 0; x < 256; x += 2) { const y = 80 + Math.sin(x * .07 + t * 6) * 34 * Math.sin(x * .011 + t) + Math.sin(x * .5 + t * 30) * 3; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.strokeStyle = "#fdb913"; g.beginPath(); for (let x = 0; x < 256; x += 2) { const y = 120 + (Math.sin(x * .05 - t * 4) > 0 ? -10 : 10); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  SC.t.needsUpdate = true;
}
function drawWaterfall(t) {
  const g = RW.g; g.drawImage(RW.c, 0, 0, 256, 95, 0, 1, 256, 95);
  for (let x = 0; x < 256; x++) { const sig = Math.exp(-((x - 150) ** 2) / 8) * (Math.sin(t * 7) > -.2 ? 1 : 0) + Math.exp(-((x - 70) ** 2) / 40) * .5 + Math.random() * .25;
    g.fillStyle = `hsl(${240 - sig * 200}, 90%, ${10 + sig * 50}%)`; g.fillRect(x, 0, 1, 1); }
  RW.t.needsUpdate = true;
}
function blink() {
  const c = new THREE.Color();
  for (let i = 0; i < rackLeds.count; i++) { const r = Math.random(); rackLeds.setColorAt(i, c.set(r < .08 ? 0xfdb913 : r < .5 ? 0x7dff9a : 0x123018)); }
  rackLeds.instanceColor.needsUpdate = true;
  leds.forEach(l => l.material.color.setHex(Math.random() < .5 ? 0x7dff9a : 0x1c4a2a));
}

renderHud();
pTarget = p = clamp(scrollY / innerHeight, 0, N - 1);
document.fonts.ready.then(() => drawOS(0));
requestAnimationFrame(frame);
window.__room = { scene, camera, goTo };
