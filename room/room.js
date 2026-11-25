/* ==========================================================
   dreaming66 · the workshop, v2 — a night-time maker's room in three.js.
   Scroll flies the camera along a rail between stations; click an object
   to fly to it. Procedural geometry with rounded edges and canvas textures,
   plus two real models: the AuraCore cluster (EasyEDA CAD, as on the home
   page) and the biped (the CAD from /biped/, posed with its own forward
   kinematics). The orange cat sleeps stretched out on the rug; click it.
   ========================================================== */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const LOGO_D = "M-91.1 37.6L-91.2 38.1L-91.5 38.4L-93.3 39.4L-94.5 40.3L-95.7 41.4L-96.7 42.6L-97.5 43.8L-98.2 45.2L-98.7 46.7L-99 48.5L-99.1 50L-99 51.5L-98.7 53.3L-98.1 54.8L-97.3 56.4L-96.5 57.7L-95.4 58.9L-94.1 60L-92.5 61L-90.5 61.9L-88.7 62.3L-86.6 62.5L-85.1 62.4L-83.3 62L-81.2 61.3L-79.1 60L-78.6 60L-78.1 60.1L-12.9 97.7L-12.6 98.1L-12.4 98.5L-12.5 100.6L-12.2 102.7L-11.8 104.2L-11.2 105.6L-10.2 107.2L-9.2 108.4L-7.9 109.7L-6.4 110.7L-5.1 111.4L-3.6 112L-2.1 112.3L-0.6 112.5L1.2 112.4L2.7 112.2L4.2 111.8L5.6 111.2L7.2 110.2L8.6 109L10 107.5L11 105.9L11.7 104.5L12.1 103L12.5 100.9L12.5 98.5L12.7 98L13 97.7L78.1 60.1L78.6 60L79.1 60L80.5 60.9L81.6 61.4L83 62L84.2 62.3L85.4 62.4L86.6 62.5L87.8 62.4L89.3 62.2L90.5 61.9L91.7 61.4L93 60.7L94.1 60L95.2 59.1L96.1 58.2L97 57L97.6 55.9L98.2 54.8L98.6 53.4L98.9 52.1L99.1 50.9L99.1 49.7L99 48.2L98.7 47L98.4 45.8L97.9 44.6L97.3 43.6L96.6 42.6L95.9 41.6L95 40.7L94 39.9L93 39.3L91.5 38.5L91.2 38.1L91.1 37.6L91.1-47.4L91-48.5L90.9-49.4L90.6-50.4L90.2-51.4L89.5-52.5L88.7-53.6L87.8-54.3L86.8-55.1L4.3-102.7L3.3-103.2L2.3-103.5L1.4-103.7L0.3-103.8L-0.8-103.8L-1.9-103.6L-2.9-103.3L-3.9-102.9L-86.6-55.2L-87.5-54.6L-88.4-53.9L-89.1-53.1L-89.7-52.2L-90.3-51L-90.7-50L-91-48.7L-91.1-47.6ZM5.1 88.6L4.7 88.2L4.5 87.5L4.5 3.3L4.7 2.7L5.1 2.3L80.3-41.2L80.9-41.3L81.5-41.2L81.9-40.7L82.1-40.1L82.1 37.5L82 38.1L81.6 38.5L80.4 39.1L79.1 39.9L78.6 40L78.1 39.9L18.9 5.8L17.9 5.5L16.8 5.4L15.8 5.6L14.8 6.1L14 6.7L13.3 7.5L12.9 8.5L12.7 9.5L12.7 10.8L13.1 11.9L13.8 12.9L14.8 13.7L73.6 47.7L74 48.1L74.2 48.6L74.1 50L74.2 51.3L74 51.9L73.6 52.3L8.5 89.9L8 90L7.5 90L6.2 89.1ZM6.2-19.6L5.6-19.5L5.1-19.7L4.7-20.1L4.5-20.7L4.5-79.3L4.6-79.8L4.9-80.2L5.2-80.4L5.7-80.5L6.3-80.4L57.1-51L57.5-50.6L57.7-50L57.5-49.4L57.1-49ZM-81.5 38.6L-81.9 38.2L-82.1 37.5L-82.1-40.1L-82-40.6L-81.7-41L-81.4-41.2L-80.9-41.3L-80.3-41.2L-5.1 2.3L-4.7 2.7L-4.5 3.3L-4.5 87.5L-4.7 88.2L-5.1 88.6L-6.2 89.1L-7.4 89.9L-8 90L-8.5 89.9L-73.6 52.3L-74 51.9L-74.2 51.4L-74.1 50L-74.2 48.5L-74 48.1L-73.6 47.7L-14.4 13.5L-13.7 12.7L-13.1 11.8L-12.7 10.8L-12.7 9.7L-12.8 8.7L-13.2 7.7L-13.9 6.8L-14.7 6.1L-15.8 5.6L-17 5.4L-18.2 5.5L-19.3 5.9L-78.1 39.9L-78.6 40L-79.1 39.9L-80.4 39.1ZM-57.2-49L-57.6-49.4L-57.7-50L-57.5-50.6L-57.1-51L-6.3-80.4L-5.9-80.5L-5.4-80.5L-5-80.3L-4.7-79.9L-4.5-79.3L-4.5-20.7L-4.7-20.1L-5.1-19.7L-5.7-19.5L-6.3-19.6ZM-80.9 50.4L-81.1 51.5L-81.5 52.6L-82.1 53.5L-82.8 54.4L-83.8 55L-84.8 55.5L-85.9 55.7L-87 55.7L-88.1 55.5L-89.2 55.1L-90.1 54.5L-91 53.8L-91.6 52.8L-92.1 51.8L-92.3 50.7L-92.3 49.6L-92.1 48.5L-91.7 47.4L-91.1 46.5L-90.4 45.6L-89.4 45L-88.4 44.5L-87.3 44.3L-86.2 44.3L-85.1 44.5L-84 44.9L-83.1 45.5L-82.2 46.2L-81.6 47.2L-81.1 48.2L-80.9 49.3ZM5.7 100.3L5.6 101.4L5.2 102.5L4.6 103.4L3.9 104.3L3 104.9L1.9 105.4L0.8 105.7L-0.3 105.7L-1.4 105.6L-2.5 105.2L-3.4 104.6L-4.3 103.9L-4.9 103L-5.4 101.9L-5.7 100.8L-5.7 99.7L-5.6 98.6L-5.2 97.5L-4.6 96.6L-3.9 95.7L-3 95.1L-1.9 94.6L-0.8 94.3L0.3 94.3L1.4 94.4L2.5 94.8L3.4 95.4L4.3 96.1L4.9 97L5.4 98.1L5.7 99.2ZM92.4 50.1L92.2 51.3L91.9 52.3L91.3 53.3L90.6 54.2L89.7 54.9L88.7 55.4L87.6 55.7L86.5 55.7L85.3 55.6L84.3 55.3L83.3 54.7L82.4 54L81.7 53.1L81.2 52.1L80.9 51L80.9 49.9L81 48.7L81.3 47.7L81.9 46.7L82.6 45.8L83.5 45.1L84.5 44.6L85.6 44.3L86.7 44.3L87.9 44.4L88.9 44.7L89.9 45.3L90.8 46L91.5 46.9L92 47.9L92.3 49Z";
const LOGO_VB = "-99.3 -104 198.6 216.7".split(" ").map(Number);
let LOGO = null; try { LOGO = new Path2D(LOGO_D); } catch {}

const $ = s => document.querySelector(s);
const MOBILE = matchMedia("(pointer: coarse)").matches || innerWidth < 760;
const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
const rnd = (() => { let s = 66; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();   // deterministic, so the room looks the same every visit

/* ---------------- copy ---------------- */
const LANGS = ["zh", "en", "ja"];
let lang = (() => { try { const q = new URLSearchParams(location.search).get("lang") || localStorage.getItem("d66-lang") || navigator.language.slice(0, 2); return LANGS.includes(q) ? q : "zh"; } catch { return "zh"; } })();
const UI = {
  zh: { home: "回到主页", hint: "滚动参观 · 点房间里的东西", click: "点击", load: "正在布置房间…", meow: "喵～" },
  en: { home: "Back home", hint: "Scroll to look around · click anything", click: "click", load: "Setting up the room…", meow: "meow~" },
  ja: { home: "ホームへ", hint: "スクロールで見て回る・クリックで近づく", click: "クリック", load: "部屋を準備中…", meow: "にゃ～" },
};
const ST = [
  { pos: [4.6, 3.35, 4.5], at: [0.05, 0.95, -0.85],
    zh: ["DRM-66 · 工作间", "欢迎来我的工作间", "写代码、画板子、调机器人，猫在旁边睡觉。往下滚动参观，或者直接点房间里的东西。", []],
    en: ["DRM-66 · WORKSHOP", "Welcome to my workshop", "Code, boards and robots, with a cat asleep on the rug. Scroll to look around, or click anything in the room.", []],
    ja: ["DRM-66 · 工房", "ようこそ、僕の工房へ", "コードと基板とロボット、そして床で眠る猫。スクロールで見て回るか、気になる物をクリック。", []] },
  { pos: [0.16, 1.24, -0.98], at: [0.06, 1.08, -2.25], name: "MAIN RIG",
    zh: ["01 · 主机", "白天：大模型推理", "本职在 AI Infra：部署、调优、调度大模型。屏幕上滚的是这台机器的开机日志，笔记本上开着推理服务的配置。", [["看经历 git log", "../#log", 1], ["推理实验室", "../#lab"]]],
    en: ["01 · MAIN RIG", "By day: LLM inference", "My day job is AI infra: deploying, tuning and scheduling large models. The monitor is this machine booting; the laptop has a serving config open.", [["Experience · git log", "../#log", 1], ["Inference lab", "../#lab"]]],
    ja: ["01 · メイン機", "昼は LLM 推論", "本業は AI インフラ。大規模モデルのデプロイ・チューニング・スケジューリング。モニターは起動ログ、ノートには推論サービスの設定。", [["経歴 · git log", "../#log", 1], ["推論ラボ", "../#lab"]]] },
  { pos: [1.12, 1.1, -1.5], at: [0.82, 0.86, -2.08], name: "AURACORE ×5",
    zh: ["02 · AuraCore 集群", "五块自己画的板子", "全志 H616、六层 PCB、手工焊接，五块插在底座上组成一个 k3s 集群。这是真实的 EasyEDA 模型。", [["焊一块试试", "../#build", 1], ["集群 3D", "../#aura"]]],
    en: ["02 · AURACORE CLUSTER", "Five boards I drew myself", "Allwinner H616, six-layer PCB, hand-soldered; five on a base make a k3s cluster. This is the real EasyEDA model.", [["Solder one", "../#build", 1], ["Cluster in 3D", "../#aura"]]],
    ja: ["02 · AuraCore クラスタ", "自分で描いた 5 枚の基板", "Allwinner H616、6 層基板を手はんだ。5 枚をベースに挿して k3s クラスタに。実際の EasyEDA モデル。", [["はんだ付けしてみる", "../#build", 1], ["クラスタ 3D", "../#aura"]]] },
  { pos: [-1.1, 1.5, 2.05], at: [-2.45, 1.45, 2.08], name: "WHITEBOARD",
    zh: ["03 · 白板", "PD 分离的草图", "Prefill 和 Decode 拆到不同节点，KV Cache 经 Mooncake 池子交接，decode 就不会被新请求打断。主页上可以拖滑块看 TPOT 怎么变。", [["推理实验室", "../#lab", 1]]],
    en: ["03 · WHITEBOARD", "Sketching PD disaggregation", "Split prefill and decode across nodes and hand the KV cache over through a Mooncake pool, so decode never stalls on new requests. Drag the slider on the home page.", [["Inference lab", "../#lab", 1]]],
    ja: ["03 · ホワイトボード", "PD 分離のスケッチ", "Prefill と Decode を別ノードに分け、KV キャッシュを Mooncake プール経由で渡す。新しいリクエストで decode が止まらない。", [["推論ラボ", "../#lab", 1]]] },
  { pos: [-0.95, 1.45, -0.05], at: [-2.15, 0.98, -0.62], name: "WORKBENCH",
    zh: ["04 · 工作台", "画板子，焊板子", "示波器、可调电源、焊台、元件柜。AuraCore 就是在这张台子上一颗颗焊出来的。", [["焊一块试试", "../#build", 1]]],
    en: ["04 · WORKBENCH", "Drawing boards, soldering boards", "Scope, bench supply, soldering station, parts drawers. Every AuraCore was soldered here, one part at a time.", [["Solder one", "../#build", 1]]],
    ja: ["04 · 作業台", "基板を描いて、はんだ付け", "オシロ、安定化電源、はんだごて、部品棚。AuraCore はこの台で一つずつはんだ付けした。", [["はんだ付けしてみる", "../#build", 1]]] },
  { pos: [-1.0, 1.3, -0.72], at: [-2.15, 0.95, -1.3], name: "JOINT · RADIO",
    zh: ["05 · 摆线关节和电台", "等电机到货", "3D 打印的 5010 摆线减速器，已用电动螺丝刀试转，顺滑没有卡滞；旁边是 SDR 电台，呼号 BH3FWY。", [["正在折腾", "../#wip", 1]]],
    en: ["05 · JOINT & RADIO", "Waiting for the motor", "A 3D-printed 5010 cycloidal reducer, already spun on a drill: smooth, no binding. Next to it the SDR radio, callsign BH3FWY.", [["Work in progress", "../#wip", 1]]],
    ja: ["05 · 関節と無線機", "モーター待ち", "3D プリントした 5010 サイクロイド減速機。電動ドライバーで回して引っかかりなし。隣は SDR 無線機、コールサイン BH3FWY。", [["進行中", "../#wip", 1]]] },
  { pos: [1.05, 1.42, -0.95], at: [1.5, 0.95, -2.16], name: "3D PRINTER",
    zh: ["06 · 3D 打印机", "正在打下一片摆线盘", "关节、机器人外壳、底盘支架都出自这台机器。现在打的就是那片蓝绿色的摆线盘。", [["正在折腾", "../#wip", 1]]],
    en: ["06 · 3D PRINTER", "Printing the next cycloid disc", "Joints, robot shells and chassis brackets all come off this machine. That teal disc is printing right now.", [["Work in progress", "../#wip", 1]]],
    ja: ["06 · 3D プリンター", "次のサイクロイド円板を印刷中", "関節もロボットの外装もシャーシの部品も、全部この機械から。いま刷っているのが青緑の円板。", [["進行中", "../#wip", 1]]] },
  { pos: [2.4, 0.9, 0.75], at: [1.22, 0.38, -0.4], name: "BIPED · RL",
    zh: ["07 · 双足机器人", "真实的 CAD 模型", "这是机器人本体的真实 CAD，和主页实时仿真用的是同一套。RL 步态策略已经在仿真里会走，真机在攒零件。", [["玩实时仿真", "../biped/", 1], ["正在折腾", "../#wip"]]],
    en: ["07 · BIPED", "The real CAD", "This is the robot's actual CAD, the same one the live sim on the home page uses. The RL gait policy walks in simulation; the real one is being built.", [["Play the live sim", "../biped/", 1], ["Work in progress", "../#wip"]]],
    ja: ["07 · 二足ロボット", "本物の CAD", "ホームのライブシムと同じ、ロボット本体の実際の CAD。RL 歩容方策はシミュレーションで歩ける。実機は部品集め中。", [["ライブシムで遊ぶ", "../biped/", 1], ["進行中", "../#wip"]]] },
  { pos: [0.62, 0.78, 0.62], at: [-0.42, 0.06, -0.5], name: "CAT",
    zh: ["08 · 橘猫", "房间真正的主人", "白天摊成一条睡觉，晚上踩键盘。点它一下试试。", [["摸一下", "#pet", 1]]],
    en: ["08 · THE CAT", "Who really owns the room", "Sleeps stretched out flat by day, walks on the keyboard by night. Give it a click.", [["Pet the cat", "#pet", 1]]],
    ja: ["08 · 茶トラ", "部屋の本当の主", "昼は床で長く伸びて寝て、夜はキーボードを歩く。クリックしてみて。", [["なでる", "#pet", 1]]] },
  { pos: [-1.4, 1.5, -0.35], at: [-1.98, 1.02, -2.27], name: "ARCHIVE SHELF",
    zh: ["09 · 档案架", "上学时手搓的", "无人机、四足机器人、全向底盘：书架上摆的都是以前做过的东西，主页档案馆里有当年的视频。", [["档案馆", "../#archive", 1]]],
    en: ["09 · ARCHIVE SHELF", "Built back at school", "A drone, a quadruped, an omni chassis: the shelf holds things I built before. The archive on the home page has the footage.", [["Archive", "../#archive", 1]]],
    ja: ["09 · アーカイブ棚", "学生時代につくったもの", "ドローン、四足ロボット、全方向台車。棚には昔つくった物が並ぶ。当時の映像はホームのアーカイブに。", [["アーカイブ", "../#archive", 1]]] },
  { pos: [2.0, 1.22, -0.5], at: [2.15, 0.78, -2.13], name: "HOMELAB RACK",
    zh: ["10 · 机柜", "家里的那台机柜", "交换机、软路由、虚拟化、k8s 节点，底下一台 UPS：工作上要用的东西，先在家里折腾一遍。", [["Homelab", "../#build", 1]]],
    en: ["10 · RACK", "The rack at home", "Switch, soft router, hypervisor, k8s nodes and a UPS underneath: whatever work needs, I break it at home first.", [["Homelab", "../#build", 1]]],
    ja: ["10 · ラック", "家のラック", "スイッチ、ソフトルーター、仮想化、k8s ノード、下に UPS。仕事で使うものはまず家で壊してみる。", [["Homelab", "../#build", 1]]] },
  { pos: [5.6, 4.1, 5.2], at: [0.0, 0.9, -0.7],
    zh: ["11 · 来找我", "灯牌是我的标志", "墙上那个开着口的盒子就是我的 logo。联系方式不公开，去 GitHub 找我。", [["github.com/dreaming66", "https://github.com/dreaming66", 1], ["回到主页", "../"]]],
    en: ["11 · SAY HI", "The neon is my mark", "That box with its lid open is my logo. No contact details here: find me on GitHub.", [["github.com/dreaming66", "https://github.com/dreaming66", 1], ["Back home", "../"]]],
    ja: ["11 · 連絡", "ネオンは僕のマーク", "壁のふたの開いた箱が僕のロゴ。連絡先は非公開、GitHub で見つけて。", [["github.com/dreaming66", "https://github.com/dreaming66", 1], ["ホームへ", "../"]]] },
];
const N = ST.length;

/* ---------------- HUD ---------------- */
const cardsEl = $("#cards"), dotsEl = $("#dots");
let shown = -1;
function renderHud() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  document.querySelectorAll("[data-t]").forEach(e => e.textContent = UI[lang][e.dataset.t]);
  $("#lang").textContent = { zh: "中", en: "EN", ja: "日" }[lang];
  cardsEl.innerHTML = ST.map((s, i) => { const [tag, h, p, links] = s[lang];
    return `<article class="card" data-i="${i}"><div class="tag">${tag}</div><h2>${h}</h2><p>${p}</p>${links.length ? `<div class="go">${links.map(([t, u, ink]) => `<a href="${u}"${u.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}${ink ? ' class="ink"' : ""}><span>${t}</span><b>${u.startsWith("http") ? "↗" : u === "#pet" ? "♥" : "→"}</b></a>`).join("")}</div>` : ""}</article>`; }).join("");
  cardsEl.querySelectorAll('a[href="#pet"]').forEach(a => a.onclick = e => { e.preventDefault(); petCat(); });
  dotsEl.innerHTML = ST.map((s, i) => `<button type="button" data-i="${i}"><span>${s[lang][0].replace(/^\d+ · /, "")}</span><i></i></button>`).join("");
  dotsEl.querySelectorAll("button").forEach(b => b.onclick = () => goTo(+b.dataset.i));
  shown = -1;
}
$("#lang").onclick = () => { lang = LANGS[(LANGS.indexOf(lang) + 1) % 3]; try { localStorage.setItem("d66-lang", lang); } catch {} renderHud(); };

/* ---------------- renderer / scene ---------------- */
const canvas = $("#gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.32;
renderer.shadowMap.enabled = !MOBILE; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e0c);
scene.fog = new THREE.Fog(0x0e0e0c, 11, 20);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .2;
const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, .03, 60);

let composer = null, bloom = null;
if (!MOBILE) {   // MSAA render target, so edges stay clean through the bloom pass
  const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { samples: 4, type: THREE.HalfFloatType });
  composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .55, .5, .82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}

/* ---------------- textures ---------------- */
const canvasTex = (w, h, draw, opts = {}) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); if (draw) draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); } return { c, g, t }; };
const grain = (g, w, h, base, dark, n = 260) => {   // wood: base colour, long streaks, a few knots
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const y = rnd() * h, a = rnd() * .18, lw = .5 + rnd() * 2.2; g.strokeStyle = `rgba(${dark},${a})`; g.lineWidth = lw; g.beginPath();
    for (let x = 0; x <= w; x += 16) { const yy = y + Math.sin(x * .004 + i) * 6 + Math.sin(x * .02 + i * 3) * 1.5; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
  for (let k = 0; k < 3; k++) { const x = rnd() * w, y = rnd() * h; for (let r = 18; r > 2; r -= 3) { g.strokeStyle = `rgba(${dark},.12)`; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y, r * 2.6, r, 0, 0, 7); g.stroke(); } }
};
const noise = (g, w, h, a = .05) => { const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { const n = (rnd() - .5) * 255 * a; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; } g.putImageData(d, 0, 0); };
const TX = {
  desk: canvasTex(1024, 256, (g, w, h) => grain(g, w, h, "#8e6c48", "60,38,20")).t,
  bench: canvasTex(1024, 256, (g, w, h) => grain(g, w, h, "#a9875e", "70,46,24")).t,
  shelf: canvasTex(1024, 256, (g, w, h) => grain(g, w, h, "#6e5238", "40,26,14")).t,
  floor: canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#3b2f25"; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) { let x = -rnd() * 300; while (x < w) { const L = 260 + rnd() * 340, tone = 17 + rnd() * 7;
      g.save(); g.beginPath(); g.rect(x, r * 128, L, 128); g.clip(); g.fillStyle = `hsl(${24 + rnd() * 6}, ${30 + rnd() * 10}%, ${tone}%)`; g.fillRect(x, r * 128, L, 128);
      for (let i = 0; i < 30; i++) { const y = r * 128 + rnd() * 128; g.strokeStyle = `rgba(20,12,6,${rnd() * .22})`; g.lineWidth = .6 + rnd() * 1.6; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + L * .3, y + rnd() * 6 - 3, x + L * .7, y + rnd() * 6 - 3, x + L, y + rnd() * 4 - 2); g.stroke(); }
      g.restore(); g.strokeStyle = "#1a130d"; g.lineWidth = 2.5; g.strokeRect(x, r * 128, L, 128); x += L; } }
    noise(g, w, h, .04);
  }, { repeat: [2.2, 2.2] }).t,
  wall: canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#38332c"; g.fillRect(0, 0, w, h); noise(g, w, h, .06); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,240,220,${rnd() * .02})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 20 + rnd() * 60, 0, 7); g.fill(); } }, { repeat: [3, 2] }).t,
  rug: canvasTex(512, 512, (g, w, h) => {
    const cx = w / 2; g.fillStyle = "#7c3a22"; g.fillRect(0, 0, w, h);
    for (let r = 250; r > 0; r -= 6) { g.strokeStyle = r % 36 < 6 ? "#e1b06a" : r % 18 < 6 ? "#5a2817" : "#8a4227"; g.lineWidth = 4; g.beginPath(); g.arc(cx, cx, r, 0, 7); g.stroke(); }
    noise(g, w, h, .09);
  }).t,
  felt: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#2d2e30"; g.fillRect(0, 0, w, h); noise(g, w, h, .08); g.strokeStyle = "#55565a"; g.setLineDash([6, 5]); g.lineWidth = 2; g.strokeRect(8, 8, w - 16, h - 16); }).t,
  pei: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#3a3a36"; g.fillRect(0, 0, w, h); noise(g, w, h, .12); }).t,
  mat: canvasTex(512, 384, (g, w, h) => { g.fillStyle = "#2f6f9a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#5c97be"; g.lineWidth = 1; for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = "#e9eef2"; g.font = "700 18px monospace"; g.fillText("ESD SAFE · 500°C", 16, h - 16); }).t,
};

/* ---------------- materials & builders ---------------- */
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .72, metalness: .04, ...o });
const mat = {
  wall: M(0xffffff, { map: TX.wall, roughness: .95 }), trim: M(0x16150f, { roughness: .6 }),
  desk: M(0xffffff, { map: TX.desk, roughness: .55 }), bench: M(0xffffff, { map: TX.bench, roughness: .6 }), shelfW: M(0xffffff, { map: TX.shelf, roughness: .6 }),
  ink: M(0x1a1a18, { roughness: .45, metalness: .2 }), black: M(0x0f0f0e, { roughness: .35, metalness: .3 }), alu: M(0xb9bcbd, { roughness: .32, metalness: .85 }),
  steel: M(0x8d9093, { roughness: .28, metalness: .9 }), paper: M(0xece6d8, { roughness: .7 }), cream: M(0xe6dfcf, { roughness: .55 }), beige: M(0xcfc8b6, { roughness: .5 }),
  brand: M(0xfdb913, { roughness: .4 }), ver: M(0xff4f1f, { roughness: .45 }), teal: M(0x5cc7bf, { roughness: .5 }), plastic: M(0x2a2a27, { roughness: .45 }),
  rubber: M(0x161616, { roughness: .9 }), pcb: M(0x1f6a42, { roughness: .45, metalness: .1 }), copper: M(0xc8873a, { roughness: .35, metalness: .9 }), gold: M(0xd9a441, { roughness: .3, metalness: 1 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x0c0f12, roughness: .06, metalness: 0, transmission: 0, transparent: true, opacity: .35 }),
  red: M(0xc0392b, { roughness: .45 }), blue: M(0x2f6fd6, { roughness: .45 }), green: M(0x3f9c5a, { roughness: .5 }), white: M(0xf4f2ec, { roughness: .45 }),
};
const geoCache = new Map();
const RB = (w, h, d, r = .006, s = 2) => { const k = `rb${w},${h},${d},${r},${s}`; if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2.01, h / 2.01, d / 2.01))); return geoCache.get(k); };
const shadowy = (m, cast = true) => { m.castShadow = cast && !MOBILE; m.receiveShadow = !MOBILE; return m; };
const put = (parent, geo, material, x = 0, y = 0, z = 0, cast = true) => { const m = shadowy(new THREE.Mesh(geo, material), cast); m.position.set(x, y, z); parent.add(m); return m; };
const box = (p, w, h, d, m, x, y, z, r, cast) => put(p, RB(w, h, d, r), m, x, y, z, cast);
const flat = (p, w, h, d, m, x, y, z, cast) => put(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, cast);
const cyl = (p, r, h, m, x, y, z, seg = 28, r2 = r) => put(p, new THREE.CylinderGeometry(r, r2, h, seg), m, x, y, z);
const sph = (p, r, m, x, y, z, seg = 20) => put(p, new THREE.SphereGeometry(r, seg, Math.max(8, seg * .6 | 0)), m, x, y, z);
const tube = (p, pts, r, m, seg = 48) => put(p, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(a => new THREE.Vector3(...a))), seg, r, 8), m, 0, 0, 0);
const group = (p, x = 0, y = 0, z = 0, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; };
const glow = (color, k = 1.6) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
const screenMat = tex => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
const plane = (p, w, h, m, x, y, z, cast = false) => put(p, new THREE.PlaneGeometry(w, h), m, x, y, z, cast);
const knob = (p, r, x, y, z, m = mat.ink) => { const k = cyl(p, r, r * .9, m, x, y, z, 24); k.rotation.x = Math.PI / 2; const d = flat(p, r * .15, r * .7, .002, mat.white, x, y + r * .35, z + r * .46, false); return k; };
const interactive = []; // { group, station, name }
const tag = (g, station, name) => { interactive.push({ group: g, station, name }); g.traverse(o => { if (o.isMesh) o.userData.hit = g; }); };
const ticks = [];   // per-frame animations: fn(t, dt)

/* ---------------- the room shell ---------------- */
const room = new THREE.Group(); scene.add(room);
put(room, new THREE.BoxGeometry(5, .12, 5), [mat.trim, mat.trim, M(0xffffff, { map: TX.floor, roughness: .62 }), mat.trim, mat.trim, mat.trim], 0, -.06, 0, false);
flat(room, 5, 3, .12, mat.wall, 0, 1.5, -2.56, false);
flat(room, .12, 3, 5.12, mat.wall, -2.56, 1.5, -.06, false);
flat(room, 5, .1, .025, mat.trim, 0, .05, -2.487, false); flat(room, .025, .1, 5, mat.trim, -2.487, .05, 0, false);       // skirting
flat(room, 5, .04, .03, mat.trim, 0, 2.98, -2.485, false); flat(room, .03, .04, 5, mat.trim, -2.485, 2.98, 0, false);     // cornice
put(room, new THREE.CylinderGeometry(1.15, 1.15, .014, 72), M(0xffffff, { map: TX.rug, roughness: 1 }), .15, .007, -.8, false);
// outlets and a switch
for (const [x, z, w] of [[-.55, -2.49, 0], [1.6, -2.49, 0], [-2.49, -.2, 1]]) { const o = box(room, w ? .012 : .12, .08, w ? .12 : .012, mat.cream, x, .32, z, .004, false); }

// string lights along the top of both walls
{
  const pts = [];
  for (let i = 0; i <= 26; i++) { const u = i / 26; pts.push(new THREE.Vector3(-2.42 + u * 4.84, 2.78 - Math.sin(u * Math.PI * 3) ** 2 * .1, -2.43)); }
  for (let i = 1; i <= 26; i++) { const u = i / 26; pts.push(new THREE.Vector3(-2.43, 2.78 - Math.sin(u * Math.PI * 3) ** 2 * .1, -2.42 + u * 4.84)); }
  const wire = new THREE.CatmullRomCurve3(pts); put(room, new THREE.TubeGeometry(wire, 400, .003, 4), mat.black, 0, 0, 0, false);
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(.018, 10, 8), glow(0xffc070, 2.2), 52);
  const m4 = new THREE.Matrix4(); for (let i = 0; i < 52; i++) { const p = wire.getPointAt((i + .5) / 52); m4.makeTranslation(p.x, p.y - .022, p.z); bulbs.setMatrixAt(i, m4); }
  room.add(bulbs);
  for (const p of [[-.6, 2.6, -2.2], [-2.2, 2.6, .9]]) { const l = new THREE.PointLight(0xffb066, .9, 4, 2); l.position.set(...p); scene.add(l); }
}

/* ---------------- window, curtains, the night outside ---------------- */
{
  const win = group(room, -2.49, 1.6, .75, Math.PI / 2);
  const sky = canvasTex(768, 640, (g, w, h) => {
    const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, "#060914"); s.addColorStop(.7, "#18233f"); s.addColorStop(1, "#2a2a3a"); g.fillStyle = s; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 180; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * .8})`; const r = rnd() < .9 ? 1 : 1.8; g.fillRect(rnd() * w, rnd() * h * .55, r, r); }
    g.fillStyle = "#f6f1d8"; g.shadowColor = "#f6f1d8"; g.shadowBlur = 30; g.beginPath(); g.arc(590, 110, 30, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = "#0a0f1e"; g.beginPath(); g.arc(603, 101, 28, 0, 7); g.fill();
    for (const [far, col] of [[1, "#0b1020"], [0, "#04060c"]]) { let x = -20; while (x < w) { const bw = 30 + rnd() * 70, bh = (far ? 160 : 80) + rnd() * (far ? 200 : 260); g.fillStyle = col; g.fillRect(x, h - bh, bw, bh);
      if (!far && rnd() < .3) { g.fillRect(x + bw / 2 - 2, h - bh - 30, 3, 30); g.fillStyle = "#ff4f1f"; g.fillRect(x + bw / 2 - 3, h - bh - 33, 5, 5); }
      for (let wy = h - bh + 10; wy < h - 6; wy += 14) for (let wx = x + 6; wx < x + bw - 8; wx += 11) if (rnd() < (far ? .12 : .25)) { g.fillStyle = rnd() < .75 ? (far ? "#a8822e" : "#fdb913") : "#9fd3ff"; g.fillRect(wx, wy, far ? 4 : 5, far ? 5 : 7); }
      x += bw + (far ? 2 : 6); } }
  });
  plane(win, 1.36, 1.14, screenMat(sky.t), 0, 0, -.03);
  for (const [w, h, x, y] of [[1.5, .07, 0, .6], [1.5, .07, 0, -.6], [.07, 1.27, -.715, 0], [.07, 1.27, .715, 0], [.035, 1.14, 0, 0], [1.36, .035, 0, .14]]) box(win, w, h, .07, mat.cream, x, y, 0, .008, false);
  box(win, 1.66, .045, .2, mat.cream, 0, -.66, .07, .01, false);
  // cactus on the sill
  { const pot = cyl(win, .045, .07, mat.ver, .45, -.6, .09, 20, .035); const c = sph(win, .035, mat.green, .45, -.53, .09, 14); c.scale.set(1, 1.6, 1); }
  // curtain rod + two curtains with folds
  cyl(win, .012, 1.9, mat.alu, 0, .8, .14).rotation.z = Math.PI / 2;
  const cg = new THREE.PlaneGeometry(.3, 1.75, 30, 1); const pa = cg.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); pa.setZ(i, Math.sin(x * 46) * .022 + Math.sin(x * 13) * .01); }
  cg.computeVertexNormals();
  const cm = M(0x3c5a5e, { roughness: .95, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const c = put(win, cg, cm, s * .82, -.07, .14); c.receiveShadow = !MOBILE; }
  const moon = new THREE.DirectionalLight(0x7f97d8, .7); moon.position.set(-5, 3.2, 1.1); moon.target.position.set(.5, 0, -.6);
  moon.castShadow = !MOBILE; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: .5, far: 12 }); moon.shadow.bias = -.0008; moon.shadow.normalBias = .02;
  scene.add(moon, moon.target);
}

/* ---------------- whiteboard: the PD-disaggregation sketch ---------------- */
const board = group(room, -2.47, 1.48, 2.08, Math.PI / 2);
{
  const wb = canvasTex(1024, 680, null);
  document.fonts.load('700 30px "JetBrains Mono"').finally(() => {
    const g = wb.g, W = 1024, H = 680; g.fillStyle = "#f4f4f1"; g.fillRect(0, 0, W, H);
    const wob = (x1, y1, x2, y2, col, lw = 4) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.beginPath(); g.moveTo(x1, y1); const n = 10; for (let i = 1; i <= n; i++) { const u = i / n; g.lineTo(x1 + (x2 - x1) * u + (rnd() - .5) * 2.2, y1 + (y2 - y1) * u + (rnd() - .5) * 2.2); } g.stroke(); };
    const rect = (x, y, w, h, col) => { wob(x, y, x + w, y, col); wob(x + w, y, x + w, y + h, col); wob(x + w, y + h, x, y + h, col); wob(x, y + h, x, y, col); };
    const txt = (s, x, y, col, size = 28) => { g.fillStyle = col; g.font = `700 ${size}px "JetBrains Mono", monospace`; g.fillText(s, x, y); };
    const arrow = (x1, y1, x2, y2, col) => { wob(x1, y1, x2, y2, col); const a = Math.atan2(y2 - y1, x2 - x1); wob(x2, y2, x2 - 18 * Math.cos(a - .45), y2 - 18 * Math.sin(a - .45), col); wob(x2, y2, x2 - 18 * Math.cos(a + .45), y2 - 18 * Math.sin(a + .45), col); };
    const B = "#1d4fbf", R = "#d23b2a", K = "#222", G = "#1f8a4c";
    txt("PD disaggregation", 40, 64, K, 38); wob(40, 78, 430, 80, R, 3);
    for (let i = 0; i < 3; i++) { rect(60, 130 + i * 110, 200, 74, B); txt(`prefill ${i}`, 82, 177 + i * 110, B); arrow(262, 167 + i * 110, 420, 300, B); }
    g.strokeStyle = G; g.lineWidth = 4; g.setLineDash([12, 10]); g.beginPath(); g.ellipse(520, 300, 110, 70, 0, 0, 7); g.stroke(); g.setLineDash([]);
    txt("KV pool", 455, 292, G); txt("mooncake", 450, 326, G, 22);
    for (let i = 0; i < 4; i++) { rect(760, 100 + i * 100, 200, 70, R); txt(`decode ${i}`, 784, 145 + i * 100, R); arrow(628, 300, 755, 135 + i * 100, R); }
    txt("TTFT ↓  prefill only", 60, 520, K, 26); txt("TPOT steady, no stalls", 60, 560, K, 26);
    txt("W8A8 · TP=8", 560, 520, B, 26); txt("-20% latency ✓", 560, 560, G, 26);
    wob(40, 600, 980, 600, "#999", 2); txt("todo: autoscale decode by queue depth", 40, 640, R, 22);
    wb.t.needsUpdate = true;
  });
  box(board, .8, .56, .03, mat.alu, 0, 0, 0, .006, false);
  plane(board, .77, .53, M(0xffffff, { map: wb.t, roughness: .3, metalness: 0 }), 0, 0, .0155);
  box(board, .6, .025, .06, mat.alu, 0, -.29, .03, .004, false);
  for (const [c, x] of [[0x1d4fbf, -.2], [0xd23b2a, -.1], [0x222222, .02]]) { const mk = cyl(board, .009, .12, M(c), x, -.27, .045, 12); mk.rotation.z = Math.PI / 2; }
}
tag(board, 3, "WHITEBOARD");

/* ---------------- poster + wall clock ---------------- */
{
  const p = canvasTex(512, 720, null);
  document.fonts.load('italic 120px "Instrument Serif"').finally(() => { const g = p.g;
    g.fillStyle = "#f1ede3"; g.fillRect(0, 0, 512, 720);
    g.fillStyle = "#ff4f1f"; g.font = "700 22px 'JetBrains Mono', monospace"; g.fillText("PART NO. DRM-66", 40, 64);
    g.fillStyle = "#141412"; g.font = "120px 'Instrument Serif', serif"; g.fillText("dream", 34, 330);
    g.font = "italic 120px 'Instrument Serif', serif"; g.fillStyle = "#ff4f1f"; g.fillText("ing", 34, 440);
    g.fillStyle = "#141412"; g.font = "italic 150px 'Instrument Serif', serif"; g.fillText("66", 230, 570);
    g.fillRect(40, 620, 432, 3); g.font = "600 20px 'JetBrains Mono', monospace"; g.fillText("FROM SOLDER TO TENSORS", 40, 666); p.t.needsUpdate = true; });
  const f = group(room, 1.32, 1.92, -2.48);
  box(f, .52, .72, .025, mat.black, 0, 0, 0, .004, false);
  plane(f, .46, .65, M(0xffffff, { map: p.t, roughness: .8 }), 0, 0, .0135);
}
const clock = group(room, 2.0, 2.3, -2.48);
{
  cyl(clock, .16, .03, mat.black, 0, 0, 0, 48).rotation.x = Math.PI / 2;
  const face = canvasTex(256, 256, (g) => { g.fillStyle = "#f3efe5"; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill(); g.fillStyle = "#141412";
    for (let i = 0; i < 12; i++) { g.save(); g.translate(128, 128); g.rotate(i / 12 * Math.PI * 2); g.fillRect(-3, -118, 6, i % 3 ? 14 : 24); g.restore(); }
    g.fillStyle = "#ff4f1f"; g.font = "700 18px monospace"; g.textAlign = "center"; g.fillText("DRM-66", 128, 180); });
  put(clock, new THREE.CircleGeometry(.145, 48), M(0xffffff, { map: face.t, roughness: .4 }), 0, 0, .016, false);
  const hand = (len, w, m, z) => { const g = group(clock, 0, 0, z); flat(g, w, len, .003, m, 0, len / 2 - .015, 0, false); return g; };
  const hh = hand(.08, .012, mat.ink, .02), mm = hand(.12, .008, mat.ink, .022), ss = hand(.13, .003, mat.ver, .024);
  ticks.push(() => { const d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = d.getHours() % 12 + m / 60;
    ss.rotation.z = -s / 60 * Math.PI * 2; mm.rotation.z = -m / 60 * Math.PI * 2; hh.rotation.z = -h / 12 * Math.PI * 2; });
}

/* ---------------- desk ---------------- */
const desk = group(room, .1, 0, -2.1);
box(desk, 2.0, .045, .76, mat.desk, 0, .74, 0, .012);
for (const x of [-.95, .95]) { box(desk, .05, .72, .7, mat.black, x, .36, 0, .01); }
box(desk, 1.85, .05, .03, mat.black, 0, .66, -.33, .008);
put(desk, RB(.6, .004, .32, .002), M(0xffffff, { map: TX.felt, roughness: 1 }), -.08, .765, .16, false);   // desk mat

// main monitor + its little OS
const rig = group(desk, -.1, 0, -.12);
box(rig, .74, .44, .028, mat.black, 0, 1.12, 0, .01);
box(rig, .6, .3, .04, mat.ink, 0, 1.12, -.03, .02);
box(rig, .05, .24, .03, mat.alu, 0, .9, -.06, .008);
box(rig, .24, .012, .17, mat.alu, 0, .768, -.03, .006);
const OS = canvasTex(1024, 576, null);
plane(rig, .7, .394, screenMat(OS.t), 0, 1.125, .0145);
box(rig, .05, .035, .002, M(0xfff27a), .3, 1.31, .015, .001, false); box(rig, .045, .045, .002, M(0xff9ab3), .34, 1.28, .016, .001, false);   // sticky notes
{ const l = new THREE.PointLight(0x9fe8ff, 1.1, 2.4, 2); l.position.set(0, 1.1, .4); rig.add(l); }
// mechanical keyboard
{
  const kb = group(rig, -.02, .768, .25);
  box(kb, .36, .022, .125, mat.cream, 0, .011, 0, .006);
  const cap = RB(.0175, .011, .0175, .003, 1);
  const rows = [[15, 0], [15, 0], [14, .009], [13, .013], [10, 0]];
  const caps = new THREE.InstancedMesh(cap, M(0xffffff, { roughness: .55 }), 70);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(); let k = 0;
  rows.forEach(([n, off], r) => { for (let c = 0; c < n && k < 70; c++) { const x = -.165 + off + c * .0225, z = -.045 + r * .022; const wide = r === 4 && c === 4;
    m4.makeScale(wide ? 5.5 : 1, 1, 1).setPosition(wide ? x + .045 : x, .029, z); caps.setMatrixAt(k, m4);
    caps.setColorAt(k++, col.set((r === 0 && c === 0) || (r === 2 && c === 13) ? 0xff4f1f : (c > n - 3 || r === 4) ? 0x8c8577 : 0xe9e3d3)); } });
  caps.count = k; shadowy(caps); kb.add(caps);
  box(rig, .062, .022, .1, mat.cream, .3, .779, .25, .012);   // mouse
}
// laptop on a stand, a serving config open
{
  const lp = group(desk, -.72, .765, -.02, .35);
  box(lp, .2, .1, .18, mat.alu, 0, .05, 0, .01).rotation.x = -.35;
  const base = group(lp, 0, .11, .02); base.rotation.x = -.35;
  box(base, .32, .012, .22, mat.alu, 0, 0, 0, .006);
  const scr = group(base, 0, .006, -.11); scr.rotation.x = -1.35;
  box(scr, .32, .21, .008, mat.alu, 0, .105, 0, .006);
  const code = canvasTex(512, 320, (g) => { g.fillStyle = "#14161a"; g.fillRect(0, 0, 512, 320); g.font = "500 16px monospace";
    [["# serve.yaml", "#6a737d"], ["model: qwen2.5-72b", "#e6edf3"], ["tensor_parallel: 8", "#e6edf3"], ["quant: w8a8", "#7dff9a"], ["prefill_nodes: 3", "#fdb913"], ["decode_nodes: 4", "#fdb913"], ["kv_transfer: mooncake", "#9fd3ff"], ["max_batch: 256", "#e6edf3"], ["slo: { ttft_ms: 300 }", "#ff7b72"]]
      .forEach(([s, c], i) => { g.fillStyle = "#3b404a"; g.fillText(String(i + 1).padStart(2), 12, 34 + i * 30); g.fillStyle = c; g.fillText(s, 48, 34 + i * 30); }); });
  plane(scr, .3, .19, screenMat(code.t), 0, .105, .0045);
}
// speakers, headphones, mug, a succulent
for (const x of [-.48, .3]) { const s = group(desk, x, .765, -.22); box(s, .1, .17, .11, mat.ink, 0, .085, 0, .012); cyl(s, .032, .004, mat.rubber, 0, .06, .056, 24).rotation.x = Math.PI / 2; cyl(s, .013, .004, mat.alu, 0, .135, .056, 16).rotation.x = Math.PI / 2; }
{ const hp = group(desk, .5, .765, -.25); cyl(hp, .045, .01, mat.black, 0, .005, 0, 24); cyl(hp, .006, .24, mat.alu, 0, .125, 0, 10);
  const band = put(hp, new THREE.TorusGeometry(.075, .009, 8, 24, Math.PI), mat.black, 0, .245, 0); band.rotation.y = Math.PI / 2; band.rotation.x = Math.PI;
  for (const s of [-1, 1]) { const c = cyl(hp, .042, .03, mat.black, 0, .175, s * .075, 24); c.rotation.x = Math.PI / 2; } }
const mug = group(desk, .2, .765, .25);
{ const m = put(mug, new THREE.CylinderGeometry(.04, .036, .095, 28, 1, true), M(0xf1ede3, { side: THREE.DoubleSide }), 0, .048, 0); cyl(mug, .036, .004, mat.white, 0, .002, 0);
  cyl(mug, .037, .003, M(0x3a2414, { roughness: .2 }), 0, .085, 0); const h = put(mug, new THREE.TorusGeometry(.024, .006, 8, 16, Math.PI), mat.white, .043, .05, 0); h.rotation.z = -Math.PI / 2;
  const steam = []; const sm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .12, depthWrite: false });
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), sm.clone()); mug.add(s); steam.push(s); }
  ticks.push(t => steam.forEach((s, i) => { const u = (t * .35 + i / 6) % 1; s.position.set(Math.sin(t + i) * .012 * u, .1 + u * .22, Math.cos(t * .7 + i) * .01); s.scale.setScalar(.35 + u * 1.1); s.material.opacity = .055 * (1 - u) * Math.min(1, u * 5); })); }
{ const sp = group(desk, -.5, .765, .3); cyl(sp, .04, .06, mat.cream, 0, .03, 0, 20, .032); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, l = sph(sp, .022, M(0x6d9b6a), Math.cos(a) * .018, .075, Math.sin(a) * .018, 10); l.scale.set(.5, 1.3, .5); l.rotation.z = Math.cos(a) * .6; l.rotation.x = -Math.sin(a) * .6; } }
tag(rig, 1, "MAIN RIG");

// desk lamp (brand yellow) with the key light
{
  const lamp = group(desk, -.95, .765, -.22);
  cyl(lamp, .07, .022, mat.black, 0, .011, 0, 32);
  const j = (x, y) => { const s = sph(lamp, .014, mat.alu, x, y, 0, 12); };
  const seg = (x1, y1, x2, y2) => { const l = Math.hypot(x2 - x1, y2 - y1); const c = cyl(lamp, .009, l, mat.black, (x1 + x2) / 2, (y1 + y2) / 2, 0, 12); c.rotation.z = -Math.atan2(x2 - x1, y2 - y1); };
  seg(0, .02, .08, .3); j(.08, .3); seg(.08, .3, .27, .4); j(.27, .4);
  const head = group(lamp, .29, .38, 0); head.rotation.z = -2.25;
  put(head, new THREE.CylinderGeometry(.03, .085, .13, 32, 1, true), M(0xfdb913, { side: THREE.DoubleSide, roughness: .35 }), 0, -.02, 0);
  cyl(head, .03, .02, M(0xfdb913, { roughness: .35 }), 0, .045, 0, 24);
  sph(head, .032, glow(0xfff2d0, 1.4), 0, -.06, 0, 16);
  const spot = new THREE.SpotLight(0xffd6a0, 7, 3.4, .95, .55, 1.6); spot.position.set(.33, .33, 0);
  const tgt = new THREE.Object3D(); tgt.position.set(.85, -.05, .15); lamp.add(tgt); spot.target = tgt;
  spot.castShadow = !MOBILE; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0006; spot.shadow.normalBias = .01; lamp.add(spot);
}
// PC tower under the desk: glass side, RGB fans
{
  const pc = group(desk, .64, 0, -.02);
  box(pc, .22, .46, .44, mat.black, 0, .25, 0, .012);
  for (const [x, z] of [[-.07, .19], [.07, .19], [-.07, -.19], [.07, -.19]]) cyl(pc, .012, .02, mat.rubber, x, .01, z, 12);
  const fans = [];
  for (const y of [.15, .27, .39]) { const ring = put(pc, new THREE.TorusGeometry(.045, .004, 8, 32), glow(0xff4f1f, 1.8), 0, y, .222, false); fans.push(ring);
    const blades = group(pc, 0, y, .218); for (let b = 0; b < 7; b++) { const bl = flat(blades, .036, .012, .002, mat.plastic, .02, 0, 0, false); const pivot = new THREE.Group(); pivot.rotation.z = b / 7 * Math.PI * 2; pivot.add(bl); blades.add(pivot); bl.rotation.x = .5; } fans.push(blades); }
  box(pc, .2, .44, .005, mat.glass, .112, .25, 0, .002, false);
  box(pc, .015, .05, .26, M(0x2b2b2b), .02, .29, -.05, .003);
  const rgb = new THREE.PointLight(0xff4f1f, .25, .8, 2); rgb.position.set(.05, .3, .1); pc.add(rgb);
  ticks.push(t => { const c = new THREE.Color().setHSL((t * .05) % 1, .9, .55); fans.forEach((f, i) => { if (f.isMesh) f.material.color.copy(c).multiplyScalar(1.8); else f.rotation.z = t * 6 + i; }); rgb.color.copy(c); });
}
cyl(desk, .012, .74, mat.black, -.35, .37, -.36, 8);   // cable down to the floor
box(desk, .3, .03, .06, mat.white, -.2, .015, -.25, .006);   // power strip

/* ---------------- neon sign: the cube mark (kept, no close-up) ---------------- */
const sign = group(room, .12, 2.12, -2.45);
{
  const rings = LOGO_D.split("M").filter(Boolean).map(r => r.replace(/Z$/, "").split("L").map(p => p.trim().split(/[ ,]+|(?=-)/).filter(Boolean).map(Number)));
  const area = r => r.reduce((s, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return s + x * y2 - x2 * y; }, 0) / 2;
  const inside = ([px, py], r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c; } return c; };
  const big = rings.reduce((a, r) => Math.abs(area(r)) > Math.abs(area(a)) ? r : a, rings[0]), sgn = Math.sign(area(big));
  const outers = rings.filter(r => Math.sign(area(r)) === sgn), holes = rings.filter(r => Math.sign(area(r)) !== sgn);
  const toV = r => r.map(([x, y]) => new THREE.Vector2(x, -y));
  const shapes = outers.map(o => { const s = new THREE.Shape(toV(o)); holes.filter(h => inside(h[0], o)).forEach(h => s.holes.push(new THREE.Path(toV(h)))); return s; });
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 5, bevelEnabled: true, bevelSize: 1.2, bevelThickness: 1.2, bevelSegments: 2 });
  geo.computeBoundingBox(); const bb = geo.boundingBox; geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, 0);
  const neon = new THREE.Mesh(geo, glow(0xfdb913, 1.9)); neon.scale.setScalar(.0026); neon.position.z = .03; sign.add(neon);
  box(sign, .64, .68, .015, M(0x101010, { roughness: .2, metalness: .3, transparent: true, opacity: .9 }), 0, 0, 0, .01, false);
  for (const [x, y] of [[-.29, .31], [.29, .31], [-.29, -.31], [.29, -.31]]) cyl(sign, .008, .03, mat.alu, x, y, .01, 12).rotation.x = Math.PI / 2;
  tube(sign, [[.2, -.34, -.01], [.25, -.6, -.015], [.3, -.95, -.02], [.32, -1.3, -.02]], .004, mat.black);
  const nl = new THREE.PointLight(0xfdb913, 2.4, 3.4, 2); nl.position.set(0, 0, .4); sign.add(nl);
  ticks.push(t => { const f = .95 + .05 * Math.sin(t * 9) * (Math.sin(t * 1.3) > .985 ? 6 : .2); nl.intensity = 2.4 * f; neon.material.color.setHex(0xfdb913).multiplyScalar(1.9 * f); });
}

/* ---------------- AuraCore cluster (real CAD) ---------------- */
const cluster = group(desk, .66, .765, -.04, -.45);
tag(cluster, 2, "AURACORE ×5");
box(cluster, .3, .006, .22, mat.black, 0, .003, 0, .002, false);
const leds = [];
async function loadCluster() {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const get = url => new Promise((res, rej) => loader.load(url, res, e => { prog[url] = e.total ? e.loaded / e.total : .5; showProg(); }, rej));
  const [gb, ga] = await Promise.all([get("../assets/models/base-lite.glb"), get("../assets/models/auracore-lite.glb")]);
  const toCad = root => { root.traverse(o => { if (o.isMesh) { o.material.flatShading = true; shadowy(o); } }); const w = new THREE.Group(); root.scale.setScalar(1000); w.add(root); return w; };
  const cad = new THREE.Group(); cad.rotation.x = -Math.PI / 2; cad.add(toCad(gb.scene));
  const SEAT_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
  [6.85, 22.9, 36.75, 49.75, 63.05].forEach((y, i) => { const b = toCad(i ? ga.scene.clone(true) : ga.scene); b.quaternion.copy(SEAT_Q); b.position.set(47.3 - 4.2, y - 2.7, 7.3 - 15.2); cad.add(b);
    const led = new THREE.Mesh(new THREE.BoxGeometry(1.6, .8, .8), glow(0x7dff9a, 1.4)); led.position.set(30.8, 56.2, 1.9); b.add(led); leds.push(led); });
  const wrap = new THREE.Group(); wrap.add(cad); wrap.scale.setScalar(.0034); wrap.position.set(-55 * .0034, .006, 37 * .0034 - .01);
  cluster.add(wrap); cluster.traverse(o => { if (o.isMesh) o.userData.hit = cluster; }); hitBoxes.delete(cluster);
  // USB-C cable from the base to the PC
  tube(cluster, [[-.12, .01, .05], [-.2, .005, .12], [-.3, .004, .16]], .003, mat.black);
}

/* ---------------- homelab rack ---------------- */
const rack = group(room, 2.15, 0, -2.13);
{
  const shell = M(0x1d1d1b, { roughness: .45, metalness: .35 });   // open frame: sides, top, bottom, back
  for (const x of [-.28, .28]) box(rack, .025, 1.42, .6, shell, x, .71, 0, .006);
  box(rack, .58, .03, .6, shell, 0, 1.405, 0, .006); box(rack, .58, .05, .6, shell, 0, .025, 0, .006);
  flat(rack, .54, 1.36, .015, M(0x111110, { roughness: .9 }), 0, .71, -.285, false);
  for (const x of [-.255, .255]) flat(rack, .02, 1.3, .02, mat.steel, x, .71, .29, false);
  const unit = (y, h, kind) => {
    const u = group(rack, 0, y, .27);
    box(u, .49, h, .03, kind === "ups" ? M(0x2a2a27) : M(0x4a4a43, { roughness: .38, metalness: .5 }), 0, 0, 0, .004);
    for (const s of [-1, 1]) box(u, .018, h * .7, .02, mat.steel, s * .22, 0, .02, .004);
    if (kind === "switch") { const ports = new THREE.InstancedMesh(new THREE.BoxGeometry(.014, .011, .004), M(0x0a0a0a), 24); const m4 = new THREE.Matrix4();
      for (let i = 0; i < 24; i++) { m4.makeTranslation(-.17 + (i % 12) * .025, (i < 12 ? .009 : -.009), .016); ports.setMatrixAt(i, m4); } u.add(ports); }
    if (kind === "server") { for (let i = 0; i < 4; i++) box(u, .08, h * .55, .006, M(0x1c1c1a), -.12 + i * .085, 0, .017, .002, false); }
    if (kind === "ups") { const s = canvasTex(128, 48, g => { g.fillStyle = "#0a1a0a"; g.fillRect(0, 0, 128, 48); g.fillStyle = "#7dff9a"; g.font = "700 22px monospace"; g.fillText("230V 18%", 6, 32); }); plane(u, .09, .034, screenMat(s.t), .14, .02, .016); }
    return u;
  };
  unit(1.24, .044, "switch"); unit(1.16, .044, "server"); unit(1.06, .088, "server"); unit(.94, .088, "server"); unit(.82, .088, "server"); unit(.68, .13, "server"); unit(.25, .22, "ups");
  // patch cables from the switch, drooping
  const cols = [0xfdb913, 0x2f6fd6, 0xff4f1f, 0x7dff9a, 0xf1ede3];
  for (let i = 0; i < 5; i++) tube(rack, [[-.17 + i * .05, 1.25, .29], [-.17 + i * .05 + .02, 1.19, .31], [.2, 1.1 - i * .07, .31], [.23, .9 - i * .08, .3]], .0035, M(cols[i], { roughness: .5 }), 24);
  const rackLeds = new THREE.InstancedMesh(new THREE.BoxGeometry(.008, .006, .003), new THREE.MeshBasicMaterial({ toneMapped: false }), 40);
  { const m4 = new THREE.Matrix4(); let k = 0; for (const y of [1.16, 1.06, .94, .82, .68]) for (let j = 0; j < 8; j++) { m4.makeTranslation(.08 + j * .016, y + .012, .289); rackLeds.setMatrixAt(k++, m4); } }
  rack.add(rackLeds); rack.userData.leds = rackLeds;
  flat(rack, .46, .006, .01, glow(0xbfe4ff, 1.0), 0, 1.385, .26, false);
  { const l = new THREE.PointLight(0xdfe8ff, .9, 2.2, 2); l.position.set(-.1, 1.0, .9); rack.add(l); }
  flat(rack, .5, .02, .5, mat.steel, 0, 1.425, 0, false);
  
}
tag(rack, 10, "HOMELAB RACK");
// a cardboard box by the rack, with the mark printed on it
{
  const bx = group(room, 1.75, 0, -1.4, .3);
  const side = canvasTex(256, 256, g => { g.fillStyle = "#b8895a"; g.fillRect(0, 0, 256, 256); noise(g, 256, 256, .06); g.strokeStyle = "#7a5634"; g.lineWidth = 3; g.strokeRect(14, 14, 228, 228);
    if (LOGO) { g.save(); g.translate(78, 50); g.scale(.5, .5); g.translate(-LOGO_VB[0], -LOGO_VB[1]); g.fillStyle = "#2a1c10"; g.fill(LOGO, "evenodd"); g.restore(); }
    g.fillStyle = "#2a1c10"; g.font = "700 20px monospace"; g.textAlign = "center"; g.fillText("FRAGILE · DRM-66", 128, 210); });
  const cb = M(0xffffff, { map: side.t, roughness: .9 }), plain = M(0xb8895a, { roughness: .9 });
  put(bx, new THREE.BoxGeometry(.34, .26, .3), [cb, cb, plain, plain, cb, cb], 0, .13, 0);
  flat(bx, .34, .002, .05, M(0xd8c9a8, { roughness: .4 }), 0, .261, 0, false);   // tape
}

/* ---------------- workbench on the left wall ---------------- */
const bench = group(room, -2.16, 0, -.95, Math.PI / 2);
box(bench, 1.4, .05, .62, mat.bench, 0, .86, 0, .01);
for (const x of [-.65, .65]) for (const z of [-.26, .26]) box(bench, .045, .84, .045, mat.black, x, .42, z, .008);
box(bench, 1.3, .025, .5, mat.shelfW, 0, .28, 0, .006);
// pegboard with tools
{
  const peg = canvasTex(1024, 512, g => { g.fillStyle = "#73614a"; g.fillRect(0, 0, 1024, 512); noise(g, 1024, 512, .05); g.fillStyle = "#3b3124"; for (let x = 16; x < 1024; x += 32) for (let y = 16; y < 512; y += 32) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); } });
  plane(bench, 1.34, .72, M(0xffffff, { map: peg.t, roughness: .9 }), 0, 1.45, -.305);
  const P = group(bench, 0, 0, -.29);
  const driver = (x, y, c) => { cyl(P, .011, .09, M(c, { roughness: .4 }), x, y, .01, 14); cyl(P, .003, .1, mat.steel, x, y - .095, .01, 8); };
  [[-.62, 1.62, 0xff4f1f], [-.57, 1.62, 0xfdb913], [-.52, 1.62, 0x2f6fd6], [-.47, 1.62, 0x2a2a27]].forEach(a => driver(...a));
  for (const [x, c] of [[-.32, 0xff4f1f], [-.2, 0x2f6fd6]]) { const pl = group(P, x, 1.5, .012); for (const s of [-1, 1]) { const h = box(pl, .016, .13, .008, M(c), s * .015, -.04, 0, .004); h.rotation.z = s * .12; } box(pl, .02, .06, .009, mat.steel, 0, .06, 0, .003); }
  for (const [x, c] of [[.05, 0xc0392b], [.15, 0x2a2a27], [.25, 0xfdb913]]) { const sp = cyl(P, .045, .03, M(c), x, 1.55, .02, 24); sp.rotation.x = Math.PI / 2; cyl(P, .02, .032, mat.cream, x, 1.55, .02, 16).rotation.x = Math.PI / 2; }
  // multimeter hanging
  { const mm = group(P, .48, 1.5, .02); box(mm, .1, .18, .035, mat.brand, 0, 0, 0, .012); box(mm, .07, .04, .002, M(0x9aa58f), 0, .05, .018, .002, false); knob(mm, .022, 0, -.02, .018); }
  // shelf on the pegboard
  box(bench, 1.1, .02, .12, mat.shelfW, 0, 1.86, -.24, .004);
  for (let i = 0; i < 7; i++) box(bench, .06, .07, .08, M([0x2f6fd6, 0xfdb913, 0xff4f1f, 0xf1ede3][i % 4], { transparent: true, opacity: .8 }), -.5 + i * .14, 1.905, -.24, .006);
}
// oscilloscope
const scope = group(bench, -.52, .885, -.1);
{
  box(scope, .38, .2, .26, mat.beige, 0, .1, 0, .018);
  box(scope, .36, .18, .01, mat.ink, 0, .1, .13, .006);
  const SC = canvasTex(320, 200, null); scope.userData.sc = SC;
  plane(scope, .22, .135, screenMat(SC.t), -.06, .105, .1365);
  for (let i = 0; i < 6; i++) knob(scope, .011, .09 + (i % 2) * .045, .055 + Math.floor(i / 2) * .045, .138);
  const btn = new THREE.InstancedMesh(RB(.012, .008, .006, .002, 1), M(0x8b8778), 6); const m4 = new THREE.Matrix4(); for (let i = 0; i < 6; i++) { m4.makeTranslation(-.14 + i * .03, .025, .138); btn.setMatrixAt(i, m4); } scope.add(btn);
  const handle = put(scope, new THREE.TorusGeometry(.13, .01, 8, 24, Math.PI), mat.ink, 0, .2, 0); handle.rotation.x = -Math.PI / 2 + .2; handle.rotation.order = "YXZ";
  for (const [x, c] of [[-.14, 0xfdb913], [-.11, 0x2f6fd6]]) tube(bench, [[x - .52, .915, .03], [x - .5, .9, .12], [x - .3, .89, .2], [-.08, .89, .17]], .003, M(c), 32);
}
// bench power supply
{
  const ps = group(bench, -.52, 1.085, -.12);
  box(ps, .24, .12, .2, mat.ink, 0, .06, 0, .01);
  const d = canvasTex(256, 96, g => { g.fillStyle = "#130505"; g.fillRect(0, 0, 256, 96); g.font = "700 40px monospace"; g.fillStyle = "#ff3b2a"; g.fillText("12.00", 8, 42); g.fillStyle = "#7dff9a"; g.fillText("0.35", 136, 42); g.font = "700 16px monospace"; g.fillStyle = "#888"; g.fillText("V", 118, 80); g.fillText("A", 228, 80); });
  plane(ps, .15, .055, screenMat(d.t), -.03, .075, .1005);
  knob(ps, .014, .085, .085, .102); knob(ps, .014, .085, .04, .102);
  for (const [x, m] of [[-.08, mat.red], [-.05, mat.black], [-.02, mat.green]]) { const j = cyl(ps, .007, .012, m, x, .025, .104, 12); j.rotation.x = Math.PI / 2; }
}
// soldering mat, PCB, station, iron, helping hands
put(bench, RB(.42, .004, .3, .002), M(0xffffff, { map: TX.mat, roughness: .85 }), -.03, .887, .05, false);
{
  const pcb = group(bench, -.06, .893, .07, .3);
  box(pcb, .14, .008, .09, mat.pcb, 0, 0, 0, .002);
  for (let i = 0; i < 9; i++) box(pcb, .012 + rnd() * .02, .004, .01 + rnd() * .015, mat.black, -.05 + rnd() * .1, .006, -.03 + rnd() * .06, .001, false);
  box(pcb, .026, .005, .026, M(0x222222), .02, .007, 0, .002, false);
}
{
  const ss = group(bench, .2, .885, -.12);
  box(ss, .16, .09, .16, mat.ver, 0, .045, 0, .012);
  const d = canvasTex(128, 64, g => { g.fillStyle = "#081008"; g.fillRect(0, 0, 128, 64); g.fillStyle = "#ff8a3d"; g.font = "700 36px monospace"; g.fillText("350°", 10, 46); });
  plane(ss, .09, .045, screenMat(d.t), 0, .055, .081); knob(ss, .012, .055, .025, .082);
  // iron holder: spring coil + iron
  const h = group(bench, .35, .885, -.1);
  cyl(h, .04, .012, mat.black, 0, .006, 0, 20);
  const coil = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 14; coil.push(new THREE.Vector3(Math.cos(a) * .018, .03 + i / 120 * .12, Math.sin(a) * .018)); }
  put(h, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 300, .0025, 6), mat.steel, 0, 0, 0);
  const iron = group(h, 0, .14, 0); iron.rotation.z = .9; cyl(iron, .011, .11, mat.black, 0, .04, 0, 14); cyl(iron, .004, .06, mat.steel, 0, -.04, 0, 10);
  tube(bench, [[.35, 1.06, -.08], [.3, 1.0, -.02], [.25, .93, -.06], [.21, .92, -.12]], .003, mat.black, 24);
  box(bench, .06, .02, .05, mat.brand, .45, .895, -.18, .004);   // tip sponge
  // solder spool
  const sp = cyl(bench, .03, .025, mat.ink, .44, .9, .07, 20); sp.rotation.x = Math.PI / 2; cyl(bench, .026, .027, mat.steel, .44, .9, .07, 20).rotation.x = Math.PI / 2;
  // helping hands with a magnifier
  const hh = group(bench, -.3, .885, .14); box(hh, .1, .015, .06, mat.black, 0, .008, 0, .004); cyl(hh, .004, .14, mat.steel, 0, .08, 0, 8);
  const mg = group(hh, 0, .15, .02); mg.rotation.x = -.5; put(mg, new THREE.TorusGeometry(.04, .005, 8, 32), mat.black, 0, 0, 0);
  put(mg, new THREE.CircleGeometry(.04, 32), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .15, roughness: 0 }), 0, 0, 0, false);
}
// parts cabinet (little drawers)
{
  const pc = group(bench, -.12, .885, -.22);
  box(pc, .26, .2, .14, mat.cream, 0, .1, 0, .006);
  const dr = new THREE.InstancedMesh(RB(.055, .026, .01, .003, 1), M(0xf2c94c, { transparent: true, opacity: .85 }), 20);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(); let k = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) { m4.makeTranslation(-.093 + c * .062, .03 + r * .036, .072); dr.setMatrixAt(k, m4); dr.setColorAt(k++, col.set([0xf2c94c, 0x9fd3ff, 0xf1ede3, 0xff9a6b][(r + c) % 4])); }
  pc.add(dr);
}
// filament spools + a toolbox on the low shelf
for (const [x, c] of [[-.45, 0x5cc7bf], [-.28, 0xf1ede3], [-.11, 0xff4f1f]]) { const s = group(bench, x, .4, .02); const a = cyl(s, .1, .066, M(0x222222), 0, 0, 0, 32); a.rotation.x = Math.PI / 2; const f = cyl(s, .085, .06, M(c, { roughness: .6 }), 0, 0, 0, 32); f.rotation.x = Math.PI / 2; }
{ const tb = group(bench, .38, .292, 0); box(tb, .36, .13, .2, mat.red, 0, .065, 0, .01); box(tb, .36, .02, .2, M(0x9a2c22), 0, .14, 0, .006); cyl(tb, .008, .2, mat.black, 0, .17, 0, 10).rotation.z = Math.PI / 2; }
tag(scope, 4, "WORKBENCH");
// SDR radio
const radio = group(bench, .55, .885, -.12);
{
  box(radio, .26, .085, .2, mat.ink, 0, .043, 0, .01);
  const RW = canvasTex(256, 96, null); radio.userData.rw = RW;
  plane(radio, .12, .045, screenMat(RW.t), -.04, .05, .1005);
  const k = cyl(radio, .024, .02, mat.alu, .08, .045, .105, 32); k.rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) box(radio, .012, .008, .006, M(0x555550), -.09 + i * .02, .016, .101, .002, false);
  cyl(radio, .004, .34, mat.ink, .1, .26, -.08, 8); sph(radio, .007, mat.ink, .1, .43, -.08, 8);
  // handheld mic on its cord
  box(radio, .035, .07, .025, mat.black, -.17, .035, .04, .01); tube(radio, [[-.17, .07, .04], [-.15, .1, .02], [-.12, .06, -.04], [-.1, .04, -.09]], .0025, mat.black, 24);
}
// cycloid reducer: lobed disc wobbling on its eccentric, inside a ring of pins
const joint = group(bench, .25, .885, .1);
{
  cyl(joint, .125, .014, mat.teal, 0, .007, 0, 64);
  const ring = put(joint, new THREE.CylinderGeometry(.12, .12, .05, 64, 1, true), M(0x5cc7bf, { side: THREE.DoubleSide, roughness: .5 }), 0, .035, 0);
  const pins = new THREE.InstancedMesh(new THREE.CylinderGeometry(.007, .007, .05, 12), mat.steel, 12); const m4 = new THREE.Matrix4();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; m4.makeTranslation(Math.cos(a) * .106, .035, Math.sin(a) * .106); pins.setMatrixAt(i, m4); } joint.add(pins);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .3; cyl(joint, .006, .006, mat.steel, Math.cos(a) * .118, .062, Math.sin(a) * .118, 8); }
  const sh = new THREE.Shape(); const L = 11;
  for (let i = 0; i <= 330; i++) { const t = i / 330 * Math.PI * 2, r = .088 + .0075 * Math.cos(L * t); const x = r * Math.cos(t), y = r * Math.sin(t); i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const hole = (cx, cy, r) => { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); sh.holes.push(p); };
  hole(0, 0, .02); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; hole(Math.cos(a) * .052, Math.sin(a) * .052, .012); }
  const disc = shadowy(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .016, bevelEnabled: true, bevelSize: .0015, bevelThickness: .0015, bevelSegments: 1, curveSegments: 8 }), mat.teal)); disc.rotation.x = -Math.PI / 2; disc.position.y = .024;
  joint.add(disc); cyl(joint, .016, .03, mat.steel, 0, .035, 0, 20);
  ticks.push(t => { const w = t * 2.2; disc.position.x = Math.cos(w) * .006; disc.position.z = Math.sin(w) * .006; disc.rotation.z = -w / 11; });
}
tag(joint, 5, "JOINT · RADIO"); radio.traverse(o => { if (o.isMesh) o.userData.hit = joint; });

/* ---------------- bookshelf: the archive ---------------- */
const shelf = group(room, -1.95, 0, -2.27);
{
  const W = .9, H = 1.9, Dp = .34;
  for (const s of [-1, 1]) box(shelf, .025, H, Dp, mat.shelfW, s * (W / 2 - .0125), H / 2, 0, .004);
  flat(shelf, W, H, .01, M(0x3a2d20), 0, H / 2, -Dp / 2 + .005, false);
  const levels = [.04, .48, .92, 1.36, 1.88];
  levels.forEach(y => box(shelf, W - .02, .025, Dp, mat.shelfW, 0, y, 0, .004));
  levels.slice(1).forEach(y => flat(shelf, W - .08, .004, .008, glow(0xffc98a, .8), 0, y - .016, .15, false));
  { const l = new THREE.PointLight(0xffc98a, .45, 1.8, 2); l.position.set(0, 1.2, .45); shelf.add(l); }
  // books, instanced
  const bk = new THREE.InstancedMesh(RB(1, 1, 1, .02, 1), M(0xffffff, { roughness: .7 }), 60); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(); let k = 0;
  const pal = [0xff4f1f, 0x2f6fd6, 0xf1ede3, 0x1d1d1b, 0xfdb913, 0x3f9c5a, 0x8a4a2e, 0x5cc7bf, 0xc9c2b3];
  for (const [y, x0, x1] of [[1.375, -.42, .05], [.935, .1, .42], [.055, -.42, -.05]]) { let x = x0; while (x < x1 && k < 60) { const w = .022 + rnd() * .03, h = .2 + rnd() * .12, lean = rnd() < .08 ? .2 : 0;
    q.setFromEuler(new THREE.Euler(0, 0, lean)); m4.compose(new THREE.Vector3(x + w / 2, y + h / 2, .02), q, new THREE.Vector3(w, h, .22)); bk.setMatrixAt(k, m4); bk.setColorAt(k++, col.set(pal[(rnd() * pal.length) | 0])); x += w + .004; } }
  bk.count = k; shadowy(bk); shelf.add(bk);
  // a framed sketch and a jar of screws
  box(shelf, .16, .12, .015, mat.black, .3, 1.46, -.12, .003).rotation.x = -.15;
  { const j = put(shelf, new THREE.CylinderGeometry(.04, .04, .1, 20, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .25, roughness: .05, side: THREE.DoubleSide }), .18, .985, .05); cyl(shelf, .041, .015, mat.ver, .18, 1.04, .05, 20); cyl(shelf, .035, .04, mat.steel, .18, .955, .05, 16); }
  // top: the drone (reel 02)
  const dr = group(shelf, -.05, 1.9, 0, .5);
  for (const a of [Math.PI / 4, -Math.PI / 4]) { const arm = box(dr, .34, .01, .03, mat.black, 0, .03, 0, .004); arm.rotation.y = a; }
  box(dr, .09, .025, .09, mat.black, 0, .04, 0, .006); box(dr, .05, .006, .05, mat.pcb, 0, .056, 0, .002); box(dr, .1, .03, .045, mat.brand, 0, .012, 0, .006);
  const props = [];
  for (const [x, z] of [[.12, .12], [-.12, .12], [.12, -.12], [-.12, -.12]]) { cyl(dr, .016, .025, mat.ink, x, .047, z, 16); const pr = group(dr, x, .062, z); flat(pr, .13, .002, .014, M(0xf1ede3, { transparent: true, opacity: .9 }), 0, 0, 0, false); props.push(pr); }
  box(dr, .04, .03, .02, M(0x222222), .0, .03, .06, .004);   // camera
  ticks.push(t => props.forEach((p, i) => p.rotation.y = t * (i % 2 ? -1 : 1) * .6));
  // middle: the quadruped (reel 01)
  const qd = group(shelf, -.2, .505, 0, .35);
  box(qd, .2, .03, .11, mat.white, 0, .1, 0, .01); box(qd, .12, .02, .07, mat.blue, 0, .125, 0, .006);
  for (const [x, z] of [[.08, .06], [-.08, .06], [.08, -.06], [-.08, -.06]]) { const leg = group(qd, x, .09, z);
    box(leg, .022, .028, .024, mat.blue, 0, 0, 0, .004); const th = box(leg, .012, .06, .012, mat.white, .01, -.03, 0, .004); th.rotation.z = .5;
    box(leg, .02, .024, .022, mat.blue, .025, -.055, 0, .004); const sh = box(leg, .01, .055, .01, mat.white, .012, -.085, 0, .004); sh.rotation.z = -.4; sph(leg, .008, mat.rubber, 0, -.11, 0, 8); }
  // bottom-right: the omni chassis (reel 03) with a spinning lidar
  const om = group(shelf, .25, .085, -.01);
  put(om, new THREE.CylinderGeometry(.13, .13, .008, 3), M(0x2a2a27), 0, .05, 0);
  put(om, new THREE.CylinderGeometry(.11, .11, .006, 3), mat.paper, 0, .1, 0);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + Math.PI / 6; const w = group(om, Math.cos(a) * .075, .03, Math.sin(a) * .075, -a); const wh = cyl(w, .03, .018, mat.ink, 0, 0, 0, 20); wh.rotation.x = Math.PI / 2;
    for (let r = 0; r < 8; r++) { const b = r / 8 * Math.PI * 2; const ro = cyl(w, .006, .012, mat.rubber, Math.cos(b) * .03, Math.sin(b) * .03, 0, 8); ro.rotation.z = b; } box(w, .04, .04, .035, mat.black, 0, .02, -.03, .004); }
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; cyl(om, .003, .05, mat.steel, Math.cos(a) * .06, .075, Math.sin(a) * .06, 6); }
  box(om, .06, .005, .04, mat.pcb, 0, .106, .02, .002);
  cyl(om, .025, .02, mat.black, 0, .113, -.03, 20); const lid = group(om, 0, .128, -.03); cyl(lid, .022, .012, M(0x333333), 0, 0, 0, 20); box(lid, .01, .008, .004, glow(0xff4f1f, 1.5), .02, 0, 0, .002, false);
  ticks.push(t => lid.rotation.y = t * 5);
}
tag(shelf, 9, "ARCHIVE SHELF");
// plant in the corner by the desk
{
  const pl = group(room, -1.22, 0, -2.2);
  cyl(pl, .13, .3, M(0xd8cfbe, { roughness: .8 }), 0, .15, 0, 32, .1); cyl(pl, .125, .01, M(0x3b2a1c, { roughness: 1 }), 0, .29, 0, 32);
  const leaf = new THREE.Shape(); leaf.moveTo(0, 0); leaf.bezierCurveTo(.09, .03, .11, .17, 0, .24); leaf.bezierCurveTo(-.11, .17, -.09, .03, 0, 0);
  const lg = new THREE.ShapeGeometry(leaf, 10); const pa = lg.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, -Math.abs(pa.getX(i)) * .5 + pa.getY(i) ** 2 * .6); lg.computeVertexNormals();
  const lm = M(0x3f7a46, { side: THREE.DoubleSide, roughness: .6 });
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + rnd(), h = .55 + rnd() * .45, r = .12 + rnd() * .14;
    tube(pl, [[0, .3, 0], [Math.cos(a) * r * .4, .3 + h * .6, Math.sin(a) * r * .4], [Math.cos(a) * r, .3 + h, Math.sin(a) * r]], .005, M(0x4f7d3e), 12);
    const l = put(pl, lg, lm, Math.cos(a) * r, .3 + h, Math.sin(a) * r); l.rotation.set(-.6 - rnd() * .5, -a + Math.PI / 2, 0, "YXZ"); l.scale.setScalar(.8 + rnd() * .5); }
}

/* ---------------- 3D printer on its own table ---------------- */
const printer = group(room, 1.5, 0, -2.16, 0);
{
  box(printer, .62, .03, .55, mat.desk, 0, .6, 0, .008);
  for (const x of [-.28, .28]) for (const z of [-.24, .24]) box(printer, .035, .6, .035, mat.black, x, .3, z, .006);
  box(printer, .56, .02, .48, mat.shelfW, 0, .2, 0, .004);
  const P = group(printer, 0, .615, 0);
  box(P, .44, .05, .38, mat.black, 0, .025, 0, .008);   // base
  const LCD = canvasTex(160, 96, null);
  box(P, .1, .06, .02, mat.ink, -.15, .045, .2, .004); plane(P, .08, .045, screenMat(LCD.t), -.15, .045, .2105);
  for (const x of [-.19, .19]) { box(P, .025, .48, .025, M(0x45484b, { roughness: .5, metalness: .5 }), x, .29, -.05, .003); box(P, .05, .05, .05, mat.black, x, .055, -.05, .006); }
  box(P, .41, .025, .025, M(0x45484b, { roughness: .5, metalness: .5 }), 0, .535, -.05, .003);
  const bed = group(P, 0, .07, 0); box(bed, .26, .012, .26, M(0xffffff, { map: TX.pei, roughness: .7 }), 0, 0, 0, .004);
  const part = group(bed, 0, .006, 0);
  { const sh = new THREE.Shape(); for (let i = 0; i <= 200; i++) { const t = i / 200 * Math.PI * 2, r = .05 + .0045 * Math.cos(11 * t); i ? sh.lineTo(r * Math.cos(t), r * Math.sin(t)) : sh.moveTo(r * Math.cos(t), r * Math.sin(t)); }
    const h = new THREE.Path(); h.absarc(0, 0, .012, 0, Math.PI * 2, true); sh.holes.push(h);
    const m = shadowy(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .012, bevelEnabled: false }), mat.teal)); m.rotation.x = -Math.PI / 2; part.add(m); }
  const gantry = group(P, 0, .2, -.05); box(gantry, .4, .02, .02, M(0x45484b, { roughness: .5, metalness: .5 }), 0, 0, 0, .003);
  const head = group(gantry, 0, 0, .025); box(head, .06, .07, .05, mat.black, 0, 0, 0, .008); cyl(head, .018, .008, mat.plastic, 0, 0, .028, 16).rotation.x = Math.PI / 2; box(head, .012, .02, .012, mat.copper, 0, -.045, 0, .002);
  const nozzleGlow = sph(head, .004, glow(0xff8a3d, 1.2), 0, -.057, 0, 8);
  // spool on top
  const spool = group(P, 0, .6, -.06); const sp1 = cyl(spool, .09, .06, M(0x222222), 0, 0, 0, 32); sp1.rotation.z = Math.PI / 2; const sp2 = cyl(spool, .075, .055, mat.teal, 0, 0, 0, 32); sp2.rotation.z = Math.PI / 2;
  box(P, .02, .08, .02, mat.black, 0, .56, -.06, .004);
  tube(P, [[0, .52, -.03], [.05, .42, .05], [.03, .3, .04]], .0018, mat.teal, 24);
  let pct = 0;
  ticks.push((t, dt) => { pct = (pct + dt * .02) % 1; part.scale.y = Math.max(.02, pct); const layerY = .07 + .012 + .012 * pct + .06;
    gantry.position.y = layerY; head.position.x = Math.sin(t * 3.1) * .05; bed.position.z = Math.sin(t * 2.3) * .04;
    nozzleGlow.material.color.setHex(0xff8a3d).multiplyScalar(1 + .3 * Math.sin(t * 9));
    if ((t * 4 | 0) !== printer.userData.lcdT) { printer.userData.lcdT = t * 4 | 0; const g = LCD.g; g.fillStyle = "#0b1a24"; g.fillRect(0, 0, 160, 96); g.fillStyle = "#9fe8ff"; g.font = "700 18px monospace"; g.fillText("PRINTING", 10, 30); g.fillText(`${(pct * 100) | 0}%`, 10, 58); g.fillStyle = "#24435a"; g.fillRect(10, 70, 140, 10); g.fillStyle = "#5cc7bf"; g.fillRect(10, 70, 140 * pct, 10); LCD.t.needsUpdate = true; } });
}
tag(printer, 6, "3D PRINTER");

/* ---------------- chair ---------------- */
{ const ch = group(room, 0, 0, -1.28, .35);
  cyl(ch, .022, .36, mat.steel, 0, .24, 0, 12); cyl(ch, .04, .08, mat.black, 0, .1, 0, 16);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, leg = box(ch, .3, .025, .035, mat.black, Math.cos(a) * .14, .045, Math.sin(a) * .14, .008); leg.rotation.y = -a; sph(ch, .022, mat.rubber, Math.cos(a) * .28, .022, Math.sin(a) * .28, 10); }
  box(ch, .48, .08, .46, M(0x2b2b28, { roughness: .8 }), 0, .45, 0, .035); box(ch, .46, .58, .07, M(0x2b2b28, { roughness: .8 }), 0, .8, .22, .035);
  box(ch, .2, .06, .06, mat.ver, 0, 1.03, .24, .02);
  for (const s of [-1, 1]) { box(ch, .04, .2, .04, mat.black, s * .26, .55, .02, .01); box(ch, .07, .025, .24, mat.black, s * .26, .66, .02, .01); }
  // a hoodie thrown over the back
  box(ch, .44, .2, .1, M(0x3a4a5a, { roughness: 1 }), 0, .99, .27, .05);
}
// cat bowl by the bench
{ const bw = group(room, -1.55, 0, .35); cyl(bw, .07, .04, mat.white, 0, .02, 0, 28, .06); cyl(bw, .058, .006, M(0x6b4a2a, { roughness: .9 }), 0, .036, 0, 24); }

/* ---------------- the cat: sleeping stretched out on the rug ---------------- */
const tabby = canvasTex(1024, 512, (g, w, h) => {
  // u along the body, v around it; v≈0.5 is the back, v≈0/1 the belly
  const belly = v => Math.cos(v * Math.PI * 2) * .5 + .5;   // 1 at the belly, 0 on the back
  for (let y = 0; y < h; y++) { const k = belly(y / h) ** 5; g.fillStyle = `rgb(${Math.round(222 + 24 * k)},${Math.round(138 + 86 * k)},${Math.round(70 + 120 * k)})`; g.fillRect(0, y, w, 1); }
  for (let i = 0; i < 22; i++) { const x0 = (i + .5 + (rnd() - .5) * .5) / 22 * w, wid = 9 + rnd() * 10;
    g.fillStyle = `rgba(178,92,34,${.45 + rnd() * .2})`; g.beginPath();
    const ys = []; for (let y = 0; y <= h; y += 6) { const k = belly(y / h) ** 3; if (k < .7) ys.push([y, (1 - k / .7)]); }
    ys.forEach(([y, f], j) => { const xx = x0 + Math.sin(y * .025 + i * 1.7) * 14 + wid * f; j ? g.lineTo(xx, y) : g.moveTo(xx, y); });
    for (let j = ys.length - 1; j >= 0; j--) { const [y, f] = ys[j]; g.lineTo(x0 + Math.sin(y * .025 + i * 1.7) * 14 - wid * f * .6, y); } g.closePath(); g.fill(); }
  for (let i = 0; i < 9000; i++) { const x = rnd() * w, y = rnd() * h, l = 4 + rnd() * 9; g.strokeStyle = rnd() < .5 ? "rgba(255,236,205,.10)" : "rgba(120,60,20,.10)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (rnd() - .5) * 3); g.stroke(); }
});
tabby.t.wrapS = THREE.RepeatWrapping;
const fur = new THREE.MeshPhysicalMaterial({ map: tabby.t, side: THREE.DoubleSide, roughness: .88, sheen: .25, sheenRoughness: .8, sheenColor: new THREE.Color(0xc8783a) });
const furPlain = new THREE.MeshPhysicalMaterial({ color: 0xdf9a58, roughness: .88, sheen: .25, sheenRoughness: .8, sheenColor: new THREE.Color(0xc8783a) });
const furCream = new THREE.MeshPhysicalMaterial({ color: 0xf4dcb5, roughness: .9, sheen: .6, sheenRoughness: .7, sheenColor: new THREE.Color(0xffe2c0) });
const pink = M(0xe9a0a0, { roughness: .6 });
// sweep: a tube with an elliptical, varying cross-section along a curve; u along the curve, v around
function sweep(points, rad, segs = 64, radial = 24, up = new THREE.Vector3(0, 1, 0)) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, "centripetal");
  const pos = [], uv = [], idx = [], T = new THREE.Vector3(), Nn = new THREE.Vector3(), Bn = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) { const t = i / segs; curve.getPointAt(t, P); curve.getTangentAt(t, T); Nn.crossVectors(up, T).normalize(); if (Nn.lengthSq() < .5) Nn.set(0, 0, 1); Bn.crossVectors(T, Nn).normalize();
    const [a, b] = rad(t); for (let j = 0; j <= radial; j++) { const th = j / radial * Math.PI * 2; pos.push(P.x + Nn.x * a * Math.cos(th) + Bn.x * b * Math.sin(th), P.y + Nn.y * a * Math.cos(th) + Bn.y * b * Math.sin(th), P.z + Nn.z * a * Math.cos(th) + Bn.z * b * Math.sin(th)); uv.push(t, j / radial); } }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const cap = (t, e0, e1) => t < e0 ? Math.sqrt(Math.max(0, 1 - ((e0 - t) / e0) ** 2)) : t > 1 - e1 ? Math.sqrt(Math.max(0, 1 - ((t - (1 - e1)) / e1) ** 2)) : 1;
const cat = group(room, -.42, 0, -.5, .55);
const catState = { awake: 0, target: 0, until: 0 };
{
  // body lies on its right side: spine along +x, back towards +z
  const body = group(cat);
  const bodyMesh = put(body, sweep([[-.25, .062, 0], [-.1, .066, .006], [.06, .066, .004], [.21, .062, 0]], t => { const p = cap(t, .16, .14) * (1 + .1 * Math.exp(-(((t - .25) / .12) ** 2)) + .12 * Math.exp(-(((t - .78) / .12) ** 2)) - .08 * Math.exp(-(((t - .5) / .15) ** 2))); return [.095 * p, .058 * p]; }, 80, 32), fur);
  // front legs stretched past the head, hind legs straight back (as in the photo)
  const DOWN = new THREE.Vector3(0, -1, 0);   // sweeps running towards -x use a flipped up, so the striped side still faces out and up
  const leg = (pts, r0, r1, paw) => put(body, sweep(pts, t => { const p = cap(t, .06, .09); const r = (r0 + (r1 - r0) * t) * (t > .86 ? 1 + paw * Math.sin((t - .86) / .14 * Math.PI) : 1); return [r * p, r * p * .9]; }, 40, 16, pts.at(-1)[0] < pts[0][0] ? DOWN : undefined), fur);
  leg([[.15, .06, .03], [.3, .045, .05], [.44, .035, .055], [.52, .03, .05]], .028, .019, .25);
  leg([[.14, .055, -.02], [.29, .04, -.01], [.43, .03, .0], [.5, .026, .005]], .026, .018, .25);
  leg([[-.17, .05, .03], [-.3, .04, .06], [-.42, .03, .075], [-.5, .025, .08]], .034, .019, .3);
  leg([[-.18, .045, -.03], [-.31, .035, -.04], [-.43, .026, -.045], [-.51, .022, -.045]], .032, .018, .3);
  // tail: a separate group so its tip can flick
  const tailG = group(body, -.24, .055, .0); body.userData.tail = tailG;
  put(tailG, sweep([[0, 0, 0], [-.1, -.012, .02], [-.2, -.022, .045], [-.3, -.028, .06]], t => { const r = .024 - .006 * t; const p = cap(t, .02, .08); return [r * p, r * p]; }, 48, 14, DOWN), fur);
  // head: tilted back and resting on the floor, face towards +z (the camera side)
  const head = group(body, .27, .07, .01); cat.userData.head = head;
  const skull = sph(head, .074, furPlain, 0, 0, 0, 32); skull.scale.set(1.08, .92, 1);
  const stripeT = canvasTex(256, 128, (g) => { g.fillStyle = "#df9a58"; g.fillRect(0, 0, 256, 128); g.fillStyle = "rgba(196,110,48,.7)"; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(128 + (i - 2) * 22, 30, 5, 26 - Math.abs(i - 2) * 5, (i - 2) * .12, 0, 7); g.fill(); } });
  skull.material = new THREE.MeshPhysicalMaterial({ map: stripeT.t, roughness: .88, sheen: .25, sheenRoughness: .8, sheenColor: new THREE.Color(0xc8783a) });
  for (const s of [-1, 1]) { sph(head, .024, furCream, s * .018, -.026, .046, 16).scale.set(1, .8, .9); }
  sph(head, .016, furCream, 0, -.042, .036, 12);
  const nose = sph(head, .0075, pink, 0, -.014, .064, 10); nose.scale.set(1.3, .8, .8);
  const eyesOpen = group(head), eyesShut = group(head);
  for (const s of [-1, 1]) { const e = sph(eyesOpen, .011, M(0xb9ab3e, { roughness: .1, metalness: .1 }), s * .026, .012, .052, 14); e.scale.z = .6; const pu = sph(eyesOpen, .006, M(0x080808, { roughness: .05 }), s * .026, .012, .059, 10); pu.scale.set(.5, 1.2, .4);
    const lid = put(eyesShut, new THREE.TorusGeometry(.011, .0018, 6, 14, Math.PI), M(0x6b3a1c), s * .026, .01, .057); lid.rotation.z = Math.PI; }
  eyesOpen.visible = false; cat.userData.eyes = [eyesOpen, eyesShut];
  const ears = [];
  for (const s of [-1, 1]) { const ear = group(head, s * .042, .056, -.004); ear.rotation.z = -s * .38;
    put(ear, new THREE.ConeGeometry(.03, .058, 16), furPlain, 0, .026, 0); const inner = put(ear, new THREE.ConeGeometry(.02, .04, 16), pink, 0, .02, .011); inner.scale.z = .4; ears.push(ear); }
  cat.userData.ears = ears;
  // whiskers
  { const pts = []; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { pts.push(new THREE.Vector3(s * .022, -.03, .055), new THREE.Vector3(s * .1, -.036 + i * .012 - .008, .045 - i * .006)); }
    head.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .75 }))); }
  head.rotation.set(.15, 0, 1.15);   // asleep: head laid back on its side
  // collar + the gold cat-head tag
  const collar = put(body, new THREE.TorusGeometry(.05, .007, 8, 28), M(0x7a2e1f, { roughness: .5 }), .215, .07, 0); collar.rotation.y = Math.PI / 2;
  const tagS = new THREE.Shape(); tagS.absarc(0, 0, .012, 0, Math.PI * 2); const ear1 = new THREE.Shape(); ear1.moveTo(-.011, .004); ear1.lineTo(-.009, .017); ear1.lineTo(-.002, .01); const ear2 = new THREE.Shape(); ear2.moveTo(.011, .004); ear2.lineTo(.009, .017); ear2.lineTo(.002, .01);
  const tagM = put(body, new THREE.ExtrudeGeometry([tagS, ear1, ear2], { depth: .002, bevelEnabled: false }), mat.gold, .222, .03, .055); tagM.rotation.set(0, Math.PI / 2 - .4, -.3);
  body.userData.breath = bodyMesh;
  cat.userData.body = body;
}
tag(cat, 8, "CAT");
let audio = null;
function meow() {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const a = audio, t0 = a.currentTime;
    const o = a.createOscillator(), f1 = a.createBiquadFilter(), f2 = a.createBiquadFilter(), g = a.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(480, t0); o.frequency.linearRampToValueAtTime(760, t0 + .18); o.frequency.linearRampToValueAtTime(520, t0 + .55);
    f1.type = "bandpass"; f1.frequency.setValueAtTime(900, t0); f1.frequency.linearRampToValueAtTime(1500, t0 + .2); f1.frequency.linearRampToValueAtTime(800, t0 + .55); f1.Q.value = 4;
    f2.type = "lowpass"; f2.frequency.value = 3200;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.16, t0 + .06); g.gain.setValueAtTime(.16, t0 + .35); g.gain.exponentialRampToValueAtTime(.001, t0 + .62);
    o.connect(f1).connect(f2).connect(g).connect(a.destination); o.start(t0); o.stop(t0 + .65);
  } catch {}
}
function petCat() { catState.target = 1; catState.until = performance.now() + 5200; meow(); bubble(); }
const bubbleEl = Object.assign(document.createElement("div"), { className: "meow" }); document.body.appendChild(bubbleEl);
let bubbleUntil = 0;
function bubble() { bubbleEl.textContent = UI[lang].meow; bubbleUntil = performance.now() + 1600; }
function catTick(t, dt) {
  if (catState.target && performance.now() > catState.until) catState.target = 0;
  catState.awake += (catState.target - catState.awake) * (1 - Math.exp(-dt * 4));
  const a = catState.awake, head = cat.userData.head, body = cat.userData.body;
  body.userData.breath.scale.set(1, 1 + .035 * Math.sin(t * 2.1) * (1 - a * .6), 1 + .02 * Math.sin(t * 2.1));
  head.rotation.z = 1.15 * (1 - a) + .1 * a; head.rotation.x = .15 * (1 - a) - .15 * a; head.position.y = .07 + .035 * a; head.rotation.y = .25 * a * Math.sin(t * .8);
  cat.userData.eyes[0].visible = a > .5; cat.userData.eyes[1].visible = a <= .5;
  const twitch = Math.sin(t * 1.3) > .985 ? Math.sin(t * 40) * .15 : 0;
  cat.userData.ears.forEach((e, i) => e.rotation.x = twitch * (i ? 1 : -1) - .2 * a);
  body.userData.tail.rotation.y = Math.sin(t * (1 + a * 4)) * (.06 + .25 * a); body.userData.tail.rotation.z = .05 * Math.sin(t * .7);
}
ticks.push(catTick);

/* ---------------- the biped: the real CAD, posed with its own kinematics ---------------- */
const bot = group(room, 1.22, 0, -.4, -.8);
tag(bot, 7, "BIPED · RL");
{ const ph = box(bot, .16, .02, .16, mat.black, 0, .01, 0, .006, false); bot.userData.placeholder = ph; }
const kin = { bodies: [], ready: false };
async function loadBiped() {
  const [cfg, xml, gz] = await Promise.all([fetch("../biped/assets/config.json").then(r => r.json()), fetch("../biped/assets/cad_kin.xml").then(r => r.text()), fetch("../biped/assets/meshes.bin.gz").then(r => r.arrayBuffer())]);
  const u8 = new Uint8Array(gz);
  const buf = u8[0] === 0x1f && u8[1] === 0x8b ? await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer() : gz;
  // body tree in MuJoCo order (depth-first), each with its offset and hinge axis
  const doc = new DOMParser().parseFromString(xml, "text/xml"); const list = [{ parent: -1, pos: [0, 0, 0], axis: null, name: "world" }];
  const walk = (el, parent) => { for (const c of el.children) if (c.tagName === "body") { const j = [...c.children].find(x => x.tagName === "joint");
    const i = list.push({ parent, name: c.getAttribute("name"), pos: (c.getAttribute("pos") || "0 0 0").split(/\s+/).map(Number), axis: j ? (j.getAttribute("axis") || "0 0 1").split(/\s+/).map(Number) : null, joint: j && j.getAttribute("name") }) - 1; walk(c, i); } };
  walk(doc.querySelector("worldbody"), 0);
  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2; bot.add(root);
  const objs = list.map(() => { const o = new THREE.Group(); o.matrixAutoUpdate = false; root.add(o); return o; });
  const mats = new Map();
  for (const g of cfg.meshes.geoms) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(buf, g.v[0] * 12, g.v[1] * 3), 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, cfg.meshes.faces_offset_bytes + g.f[0] * 6, g.f[1] * 3), 1)); geo.computeVertexNormals();
    const key = g.rgba.join(","); if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(g.rgba[0], g.rgba[1], g.rgba[2], THREE.SRGBColorSpace), roughness: .45, metalness: .08 }));
    const m = shadowy(new THREE.Mesh(geo, mats.get(key))); m.position.set(...g.pos); m.quaternion.set(g.quat[1], g.quat[2], g.quat[3], g.quat[0]); m.userData.hit = bot; objs[g.body].add(m);
  }
  Object.assign(kin, { list, objs, ready: true });
  bot.remove(bot.userData.placeholder); hitBoxes.delete(bot);
}
const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _ax = new THREE.Vector3();
function poseBiped(t) {
  if (!kin.ready) return;
  const pitch = -.4 + .05 * Math.sin(t * 1.6), knee = -2 * pitch, sway = .03 * Math.sin(t * .8);
  const q = {}; for (const [side, s] of [["l", 1], ["r", -1]]) { const p = pitch + (side === "l" ? .02 : -.02) * Math.sin(t * .8);
    Object.assign(q, { [`${side}_roll`]: s * sway * .3, [`${side}_pitch`]: p, [`${side}_knee`]: -2 * p, [`${side}_crank`]: p - 2 * p, [`${side}_rod`]: 2 * p, [`${side}_mcrank`]: p - 2 * p, [`${side}_link1`]: -(p - 2 * p) }); }
  const h = .4836 + .36 * (Math.cos(pitch) - Math.cos(.4));
  const W = kin.objs.map(() => new THREE.Matrix4());
  kin.list.forEach((b, i) => { if (i === 0) return; _m.makeTranslation(...b.pos);
    if (i === 1) _m.makeTranslation(0, sway * .1, h);
    if (b.axis && q[b.joint] !== undefined) { _ax.set(...b.axis).normalize(); _r.makeRotationAxis(_ax, q[b.joint]); _m.multiply(_r); }
    W[i].multiplyMatrices(W[b.parent], _m); kin.objs[i].matrix.copy(W[i]); kin.objs[i].matrixWorldNeedsUpdate = true; });
}

/* ---------------- ambient + fill ---------------- */
scene.add(new THREE.HemisphereLight(0x8193c0, 0x2b1d12, .6));
{ const fill = new THREE.PointLight(0xffb58a, .7, 7, 2); fill.position.set(1.6, 2.6, .9); scene.add(fill); }

/* ---------------- monitor OS, scope, waterfall ---------------- */
const OK = "#7dff9a", DIM = "#8d887b", WARN = "#fdb913", HEAD = "#ff4f1f";
const BOOT = [["DRM-66 BIOS v6.6 · (c) 2026 dreaming66", HEAD], ["CPU0 ........ curiosity @ ∞ GHz", OK], ["BOARD ........ AuraCore V2.0 · H616", OK], ["CLUSTER ........ 1 head + 4 workers · k3s", OK],
  ["NPU ........ 96 cards · HCCL ring up", OK], ["KV-CACHE ........ mooncake pool mounted", OK], ["RF ........ 144–146 MHz · DE BH3FWY", OK], ["ACTUATOR ........ cycloidal 5010 · motor in transit", WARN],
  ["GAIT POLICY ........ PPO · 192M steps", OK], ["PRIVACY ........ phone / email → REDACTED", WARN], ["", DIM], ["$ kubectl get nodes", "#f1ede3"], ["auracore-head   Ready   control-plane", OK],
  ["auracore-w1     Ready   <none>", OK], ["auracore-w2     Ready   <none>", OK], ["auracore-w3     Ready   <none>", OK], ["auracore-w4     Ready   <none>", OK], ["", DIM], ["$ vllm serve --tp 8", "#f1ede3"],
  ["INFO  prefill/decode disaggregated · TTFT 182 ms", OK], ["INFO  serving on :8000", OK]];
function drawOS(t) {
  const g = OS.g, W = 1024, H = 576;
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#14130f"); bg.addColorStop(1, "#1f1a12"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  if (LOGO) { g.save(); g.globalAlpha = .07; g.translate(W / 2 - 150, H / 2 - 160); g.scale(1.5, 1.5); g.translate(-LOGO_VB[0], -LOGO_VB[1]); g.fillStyle = "#fdb913"; g.fill(LOGO, "evenodd"); g.restore(); }
  g.fillStyle = "#1c1b18ee"; g.fillRect(0, 0, W, 34);
  g.fillStyle = "#fdb913"; g.font = "700 17px 'JetBrains Mono', monospace"; g.fillText("■ DRM-66 OS", 16, 23);
  g.fillStyle = "#9a968a"; g.textAlign = "right"; g.fillText(new Date().toTimeString().slice(0, 8), W - 16, 23); g.textAlign = "left";
  const icons = [["git log", "#ff4f1f"], ["auracore", "#fdb913"], ["lab", "#7dff9a"], ["biped", "#9fe8ff"], ["radio", "#c79bff"], ["ping", "#f1ede3"]];
  icons.forEach(([n, c], i) => { const x = 28, y = 60 + i * 80; g.fillStyle = "#26241e"; g.beginPath(); g.roundRect(x, y, 52, 52, 10); g.fill(); g.fillStyle = c; g.beginPath(); g.roundRect(x + 14, y + 14, 24, 24, 5); g.fill();
    g.fillStyle = "#cfcabd"; g.font = "500 14px 'JetBrains Mono', monospace"; g.fillText(n, x - 4, y + 70); });
  const wx = 150, wy = 60, ww = 840, wh = 484;
  g.fillStyle = "#000a"; g.beginPath(); g.roundRect(wx + 6, wy + 8, ww, wh, 12); g.fill();
  g.fillStyle = "#161614"; g.beginPath(); g.roundRect(wx, wy, ww, wh, 12); g.fill(); g.fillStyle = "#24231f"; g.beginPath(); g.roundRect(wx, wy, ww, 32, [12, 12, 0, 0]); g.fill();
  [["#ff4f1f", 0], ["#fdb913", 1], ["#7dff9a", 2]].forEach(([c, i]) => { g.fillStyle = c; g.beginPath(); g.arc(wx + 20 + i * 20, wy + 16, 6, 0, 7); g.fill(); });
  g.fillStyle = "#8d887b"; g.font = "500 14px 'JetBrains Mono', monospace"; g.fillText("tty0 — drm-66", wx + 86, wy + 21);
  const n = Math.floor(t * 2.2) % (BOOT.length + 8);
  g.font = "500 17px 'JetBrains Mono', monospace";
  BOOT.slice(Math.max(0, n - 20), Math.min(n, BOOT.length)).forEach(([s, c], i) => { g.fillStyle = c; g.fillText(s, wx + 20, wy + 62 + i * 21); });
  if (Math.floor(t * 2) % 2) { const rows = Math.min(n, BOOT.length) - Math.max(0, n - 20); g.fillStyle = "#7dff9a"; g.fillRect(wx + 20, wy + 48 + rows * 21, 10, 18); }
  OS.t.needsUpdate = true;
}
function drawScope(t) {
  const SC = scope.userData.sc, g = SC.g, W = 320, H = 200; g.fillStyle = "#05110a"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#12301c"; g.lineWidth = 1; for (let x = 0; x <= W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.strokeStyle = "#7dff9a"; g.lineWidth = 2; g.beginPath(); for (let x = 0; x < W; x += 2) { const y = 80 + Math.sin(x * .06 + t * 6) * 40 * Math.sin(x * .009 + t) + Math.sin(x * .5 + t * 30) * 3; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.strokeStyle = "#fdb913"; g.beginPath(); for (let x = 0; x < W; x += 2) { const y = 160 + (Math.sin(x * .045 - t * 4) > 0 ? -12 : 12); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.fillStyle = "#7dff9a"; g.font = "700 12px monospace"; g.fillText("CH1 500mV  10µs", 6, 14); g.fillStyle = "#fdb913"; g.fillText("CH2 PWM 20kHz", 6, H - 6);
  SC.t.needsUpdate = true;
}
function drawWaterfall(t) {
  const RW = radio.userData.rw, g = RW.g; g.drawImage(RW.c, 0, 0, 256, 95, 0, 1, 256, 95);
  for (let x = 0; x < 256; x++) { const sig = Math.exp(-((x - 150) ** 2) / 8) * (Math.sin(t * 7) > -.2 ? 1 : 0) + Math.exp(-((x - 70) ** 2) / 40) * .5 + rnd() * .25;
    g.fillStyle = `hsl(${240 - sig * 200}, 90%, ${10 + sig * 50}%)`; g.fillRect(x, 0, 1, 1); }
  RW.t.needsUpdate = true;
}
function blink() {
  const c = new THREE.Color(), L = rack.userData.leds;
  for (let i = 0; i < L.count; i++) { const r = rnd(); L.setColorAt(i, c.set(r < .08 ? 0xfdb913 : r < .55 ? 0x7dff9a : 0x123018)); }
  L.instanceColor.needsUpdate = true;
  leds.forEach(l => l.material.color.setHex(rnd() < .5 ? 0x7dff9a : 0x1c4a2a).multiplyScalar(1.4));
}

/* ---------------- loading ---------------- */
const prog = {};
const showProg = () => { const v = Object.values(prog); $("#loadTxt").textContent = `${UI[lang].load} ${Math.round(v.reduce((a, b) => a + b, 0) / 2 * 100)}%`; };
const ready = () => $("#load").classList.add("off");
loadCluster().catch(e => console.warn("cluster", e)).finally(() => { ready(); loadBiped().catch(e => console.warn("biped", e)); });
setTimeout(ready, 7000);

/* ---------------- the rail ---------------- */
const posCurve = new THREE.CatmullRomCurve3(ST.map(s => new THREE.Vector3(...s.pos)), false, "centripetal");
const atCurve = new THREE.CatmullRomCurve3(ST.map(s => new THREE.Vector3(...s.at)), false, "centripetal");
const track = $("#track");
const setTrack = () => { track.style.height = `${N * innerHeight}px`; };
let p = 0, pTarget = 0;
const camPos = new THREE.Vector3(), camAt = new THREE.Vector3(), mouse = new THREE.Vector2(), par = new THREE.Vector2();
function railAt(prog) {
  const k = Math.min(Math.floor(prog), N - 2), f = prog - k;
  const e = smooth(clamp((f - .18) / .64, 0, 1));
  const u = (k + e) / (N - 1);
  posCurve.getPoint(u, camPos); atCurve.getPoint(u, camAt);
  if (innerWidth / innerHeight < .8) camPos.sub(camAt).multiplyScalar(1.35).add(camAt);   // portrait: step back so things fit the narrow frame
}
const goTo = i => scrollTo({ top: i * innerHeight, behavior: STILL ? "auto" : "smooth" });
addEventListener("scroll", () => { pTarget = clamp(scrollY / innerHeight, 0, N - 1); $("#hint").style.opacity = scrollY > 40 ? 0 : 1; }, { passive: true });

/* ---------------- hover / click ---------------- */
const ray = new THREE.Raycaster(), bracket = $("#bracket"), hitBoxes = new Map();
let meshList = null;
const meshes = () => { const out = []; interactive.forEach(({ group }) => group.traverse(o => { if (o.isMesh || o.isInstancedMesh) out.push(o); })); return out; };
let hover = null, lastMove = performance.now();
const boxFor = g => { if (g === cat || g === printer || !hitBoxes.has(g)) hitBoxes.set(g, new THREE.Box3().setFromObject(g)); return hitBoxes.get(g); };
function bracketFor(g, label, cue) {
  const b = boxFor(g); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const v = new THREE.Vector3();
  for (let i = 0; i < 8; i++) { v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camera);
    if (v.z > 1) return bracket.classList.remove("on"); const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); }
  const pad = 10; x0 = Math.max(4, x0 - pad); y0 = Math.max(30, y0 - pad); x1 = Math.min(innerWidth - 4, x1 + pad); y1 = Math.min(innerHeight - 4, y1 + pad);
  Object.assign(bracket.style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
  bracket.querySelector("span").textContent = `${label} · ${UI[lang].click}`;
  bracket.classList.add("on"); bracket.classList.toggle("cue", !!cue);
}
function pick(e) {
  mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  meshList = meshList && kin.ready === meshList.kin ? meshList : Object.assign(meshes(), { kin: kin.ready });
  const hit = ray.intersectObjects(meshList, false)[0];
  return hit ? interactive.find(it => it.group === hit.object.userData.hit) : null;
}
canvas.addEventListener("pointermove", e => {
  lastMove = performance.now(); par.set(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5);
  if (e.pointerType !== "mouse") return;
  hover = pick(e); document.body.classList.toggle("has-hover", !!hover);
});
canvas.addEventListener("pointerleave", () => { hover = null; document.body.classList.remove("has-hover"); });
canvas.addEventListener("click", e => { const it = pick(e); if (!it) return; if (it.group === cat) petCat(); goTo(it.station); });
addEventListener("wheel", () => lastMove = performance.now(), { passive: true });

/* ---------------- loop ---------------- */
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w / h < .8 ? 54 : 36; camera.updateProjectionMatrix();
  if (composer) { composer.setSize(w, h); bloom.setSize(w, h); }
  setTrack(); pTarget = clamp(scrollY / innerHeight, 0, N - 1); hitBoxes.clear();
}
addEventListener("resize", resize); resize();

let last = performance.now(), osT = 0, slowT = 0;
const tmp = new THREE.Vector3();
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
  p += (pTarget - p) * (1 - Math.exp(-dt * (STILL ? 30 : 4.2)));
  railAt(p);
  const near = Math.round(p), wob = MOBILE ? 0 : 1;
  camera.position.copy(camPos).add(tmp.set(par.x * .1 * wob, -par.y * .06 * wob, 0));
  camera.lookAt(camAt);
  const cur = Math.abs(p - near) < .3 ? near : -1;
  if (cur !== shown) { shown = cur; cardsEl.querySelectorAll(".card").forEach(c => c.classList.toggle("on", +c.dataset.i === cur)); dotsEl.querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.i === near)); }
  if (!STILL) { for (const f of ticks) f(t, dt); poseBiped(t); }
  osT += dt; if (osT > 1 / 12) { osT = 0; if (near <= 2 || near === N - 1) drawOS(t); if (near >= 3 && near <= 5 || near === 0 || near === N - 1) { drawScope(t); drawWaterfall(t); } }
  slowT += dt; if (slowT > .25) { slowT = 0; blink(); }
  if (hover) bracketFor(hover.group, hover.name);
  else if (p < .15 && now - lastMove > 5000 && !MOBILE) bracketFor(cat, "CAT", true);
  else bracket.classList.remove("on");
  // the meow bubble follows the cat's head
  if (now < bubbleUntil) { cat.userData.head.getWorldPosition(tmp); tmp.y += .12; tmp.project(camera); bubbleEl.style.transform = `translate(${(tmp.x + 1) / 2 * innerWidth}px, ${(1 - tmp.y) / 2 * innerHeight}px) translate(-50%, -100%)`; bubbleEl.classList.add("on"); }
  else bubbleEl.classList.remove("on");
  if (composer) composer.render(); else renderer.render(scene, camera);
}

renderHud();
pTarget = p = clamp(scrollY / innerHeight, 0, N - 1);
document.fonts.ready.then(() => { drawOS(0); drawScope(0); });
requestAnimationFrame(frame);
window.__room = { scene, camera, goTo, petCat };
