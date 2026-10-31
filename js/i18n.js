/* ==========================================================
   i18n — zh (source, read from the page itself) / en / ja
   Static text: elements with data-i18n="key" (innerHTML) and
   data-i18n-attr="attr:key,attr:key". Dynamic text: I18N.t(key).
   ========================================================== */
(() => {
  "use strict";
  const LANGS = ["zh", "en", "ja"];
  const HTML_LANG = { zh: "zh-CN", en: "en", ja: "ja" };

  const D = {
    en: {
      /* ---- page ---- */
      "doc.title": "dreaming66 · from solder to tensors",
      "doc.desc": "dreaming66 — hand-built Linux boards, AI infra & LLM inference, humanoid robots and SDR.",
      "skip": "Skip to content",
      "menu": "Menu",
      "tt.snd": "Sound (S)", "tt.xray": "X-ray (X)", "tt.mot": "Pause motion", "tt.term": "Terminal (`)", "tt.lang": "Language",
      "m.build": "Bring-up", "m.aura": "AuraCore cluster", "m.lab": "Inference lab", "m.wip": "Work in progress", "m.archive": "Archive", "m.log": "Experience", "m.ping": "Say hi",
      "menu.foot": "Press <kbd>`</kbd> for a terminal · <kbd>S</kbd> sound · <kbd>X</kbd> x-ray · try ↑↑↓↓←→←→BA",
      "hero.kicker": "<span class=\"star\">✳</span> Hi, I'm Ruimin — I draw PCBs, build kernels and <span class=\"hl\">run large models</span>.",
      "hero.tag": "/ ˈdriːmɪŋ /<br>n. the urge to build things with your own hands",
      "hero.desc": "From an <b>H616 board</b> to <b>PD disaggregation</b>, from a <b>cycloidal joint</b> to <b>SDR</b>.<br>I care about every layer of a system, from solder pad to token.",
      "hero.cta": "See what I build",
      "hero.hint": "CLICK TO DROP INK",
      "mq2": "SOLDER ✳ TENSORS ✳ DEVICE TREE ✳ CYCLOID ✳ WATERFALL ✳ OVERDRIVE ✳ VIA-IN-PAD ✳ ATTENTION ✳ DE BH3FWY ✳ ",
      /* ---- spec ---- */
      "spec.t": "Overview",
      "spec.hint": "↑ Streamed token by token. Hover any token to see its (made-up) logprob.",
      "st1": "home-made AuraCore boards in one k3s cluster", "st1u": "", "st2": "concurrent inference latency on core models", "st3": "LLMs deployed to production", "st4": "edge length of the next board", "st4u": " mm",
      "f1": "Designed an Allwinner H616 SBC, “AuraCore” (6-layer), plus a 5-slot USB-networked cluster base running k3s",
      "f2": "Schematic, PCB, hand soldering, device tree, U-Boot / Kernel / Buildroot — the whole bring-up",
      "f3": "In progress: an RK3576 SBC, 38 × 38 mm, for edge inference on its 6 TOPS NPU",
      "f4": "STM32 · ESP32 · Arduino and friends",
      "f5": "Server deployment · virtualization · Docker · K8s · soft router",
      "f6": "LLM inference · AI infra · PD disaggregation",
      "f7": "Agent · MCP · Graph-RAG",
      "f8": "Electric guitar (J-rock); learning piano",
      "spec.fnote": "* Exceeding the absolute maximum ratings may cause permanent late nights.",
      /* ---- build ---- */
      "build.t": "Hand-built, <em>from a bare board</em>",
      "build.s": "AuraCore is an Allwinner H616 board I designed from scratch: schematic, 6-layer PCB, hand soldering, then the device tree, U-Boot, kernel and Buildroot — until a login prompt shows up on the serial port. Below is a simplified layout. It's yours: <b>solder every pad</b> (click or drag across them), then power it on.",
      "mcu1": "Registers / HAL · peripheral drivers · RTOS", "mcu2": "Wi-Fi / BLE · little IoT things", "mcu3": "Quick prototypes · it all starts with blink",
      "rack.t": "The rack at home",
      "rack.s": "Server deployment, virtualization, Docker, K8s, a soft router — whatever I use at work, I break at home first. Hover a box for its status; click to send a packet and watch the path.",
      /* ---- aura ---- */
      "aura.t": "Five AuraCores, <em>one cluster</em>",
      "aura.s": "The base has five vertical USB-C plugs: one board is head + router, four are workers. Workers join the base's CH339F as USB-gadget Ethernet, the head routes, and the whole thing runs k3s. Below are the <b>real 3D models</b> exported from EasyEDA — drag to orbit, scroll to zoom, hit ASSEMBLE to watch them plug in.",
      "dt.dram": "DDR3 · single x16 · 512 MB", "dt.pcb": "6 layers · 31 × 60 mm", "dt.slots": "5× vertical USB-C · 1 head + 4 workers", "dt.power": "DC-in · SY8113B · bulk caps per slot", "dt.stack": "USB-gadget Ethernet → head routing → k3s",
      "br1": "DDR came up on the first board", "br2": "Mainline U-Boot / Linux boots fine", "br3": "Memory faults under the Allwinner BSP: narrowed down to DDR training at boot, still digging",
      "ph1": "AuraCore V2.0 · Engineering Sample · TOP", "ph2": "BOTTOM · 0402 passives, hand-soldered",
      "alt.front": "AuraCore V2.0 engineering sample, top side", "alt.back": "0402 passives on the back of AuraCore",
      /* ---- lab ---- */
      "lab.t": "Inference lab",
      "lab.s": "The day job: deploying and tuning LLM inference. Four small experiments — each one plays itself as you scroll to it.",
      "pd.t": "Prefill / Decode disaggregation",
      "pd.p": "When one card does both prefill and decode, every new request makes the sequences that are already streaming stall. Split them across nodes and hand the KV cache over through a pool (Mooncake), and decode streams at an even pace. Switch modes and watch TPOT and jitter.",
      "npu.t": "NPU array scope",
      "npu.p": "An abstract slice of a hundred-card cluster: one cell per card, brightness is utilization. Trigger an AllReduce and hear the collective run around the ring through 12 nodes; hover to read a card.",
      "mcp.t": "REST → MCP compiler",
      "mcp.p": "There are thousands of existing APIs; no agent should need its own adapter for each. The tool platform reads the API description, generates the MCP tool definition, and handles registration, auth and routing in one place. (All example APIs are made up.)",
      "g.t": "Threat graph · Graph-RAG",
      "g.p": "Pure vector search can't answer “who is behind this IP?”. Put the intel into a graph and let the agent route between graph, vector and relational stores. Drag the nodes; “6 hops” expands outward from the attacker, hop by hop.",
      /* ---- wip ---- */
      "wip.t": "Work in progress", "wip.s": "Not done yet, but moving every week.",
      "rk.p": "The next board: a Rockchip RK3576, squeezed into 38 × 38 mm for edge inference on its 6 TOPS NPU — the day job's inference, on a board the size of a stamp. JLCPCB's free 6-layer stack-up plus via-in-pad.",
      "rk.s1": "Schematic", "rk.s2": "Placement / routing", "rk.s3": "Fab", "rk.s4": "Bring-up", "rk.s5": "NPU inference", "rk.v1": "Size", "rk.v2": "BGA fan-out",
      "robot.t": "A low-cost humanoid",
      "robot.p": "Built at home on top of Berkeley Humanoid Lite (BHL). The gait policy is trained: PPO in MJX (MuJoCo + JAX), 2.8 hours and 190 million simulated steps on one free T4 GPU. It walks forwards and back, strafes, turns, and stays up when shoved. That's not a recording on the right — it's the same policy running live physics in your browser, on autopilot. Click the scene to give it a shove.",
      "robot.s1": "frame printed", "robot.s2": "cycloidal joint tested", "robot.s3": "RL gait · in sim", "robot.s4": "FOC driver", "robot.s5": "full assembly",
      "robot.v1": "LIVE SIM", "robot.v2": "RECORDING", "robot.full": "DRIVE IT FULL SCREEN", "robot.go": "Run it live in your browser · ~6 MB",
      "act.t": "Cycloidal joint · custom FOC",
      "act.p": "The joints use BHL's 5010 cycloidal reducer, 3D-printed. I wrote a cadquery script that rebuilds only the two parts touching the motor (Motor Shell / Motor Shaft) to fit the 5010 360KV motor I have; every other printed part stays as designed. It's now printed and assembled. The motor is still in the post, so an electric screwdriver on the input shaft stood in for it: it spins smoothly with no binding, and there's plenty of torque at the output. The FOC driver is my own, currently at parts selection and layout.",
      "act.s1": "cadquery fit", "act.s2": "printed + assembled", "act.s3": "screwdriver spin test", "act.s4": "waiting for motors", "act.s5": "FOC closed loop",
      "act.img": "3D-printed cycloidal disc with six output-pin bearings and the central eccentric bearing",
      "sdr.t": "Software-defined radio",
      "sdr.p": "My own board: ZYNQ-7010 + AD936x, to learn RF front-ends and DSP on an FPGA. Amateur radio callsign BH3FWY. A few simulated signals hide in the waterfall below — drag or scroll to tune, and with sound on you can hear them. One is a Morse beacon sending a callsign over and over. Can you decode it?",
      "ft.t": "LLM training & fine-tuning",
      "ft.p": "Moving upstream from inference: learning to train and fine-tune. Pick a LoRA rank, train, and watch the loss curve and the learning-rate schedule (warmup + cosine).",
      /* ---- archive ---- */
      "ar.t": "Archive, <em>built back in school</em>",
      "ar.s": "Raw clips dug out of my phone's camera roll — no edits, no grading. They play as you scroll; tap to pause.",
      "r1.t": "Quadruped, rebuilt",
      "r1.p": "A rebuild of <a href=\"https://github.com/ToanTech/py-apple-quadruped-robot\" target=\"_blank\" rel=\"noopener\">ToanTech/py-apple-quadruped-robot ↗</a>: 3D-printed legs, servo drive, gait tuning. My first robot that could “walk”.",
      "r2.t": "Monocular autonomous flight",
      "r2.p": "ORB-SLAM3 monocular localization + <a href=\"https://github.com/geturin/MiDaS/tree/master/ros\" target=\"_blank\" rel=\"noopener\">MiDaS ↗</a> monocular depth to fill in dense depth, handed to EGO-Planner for obstacle avoidance. Also ran swarm formations in simulation.",
      "r3.t": "HAHA OMNI omni-wheel base",
      "r3.p": "Three 60 mm omni wheels on NEMA-17 steppers, a GD32F103 with LV8731V drivers, my own kinematics and ROS serial protocol, plus a YDLIDAR X2 for mapping. <a href=\"https://github.com/dreaming66/omni_haha\" target=\"_blank\" rel=\"noopener\">Source ↗</a>",
      "r4.t": "BeSafe: the chip that caught fire",
      "r4.p": "I underestimated the power, the chip overloaded and threw sparks on the spot. Failures are data too: since then I always budget the power, leave margin and add protection before I draw a board.",
      /* ---- log ---- */
      "log.s": "The day-job main line. Click a commit to expand its diff.",
      "c1.m": "feat: a large group company · AI infra engineering",
      "c1.d1": "+ Ran and tuned a hundred-card Ascend NPU cluster and PPU appliances: HCCL networking and communication tuning, containerized scheduling, network design for expansion",
      "c1.d2": "+ Deployed 10+ models privately with vLLM / MindIE — DeepSeek, Qwen, embedding / reranker, MinerU — validating and load-testing new models within a week",
      "c1.d3": "+ Found multi-node communication bottlenecks; Mooncake PD disaggregation + W8A8 quantization + kernel tuning → −20% concurrent latency, +25% utilization",
      "c1.d4": "+ K8s operations and Prometheus / Grafana alerting for a group-wide agent platform: 10M+ sessions, zero major incidents",
      "c1.d5": "+ Led an in-house MCP tool platform: automatic REST → MCP conversion, unified registration, auth and routing",
      "c1.d6": "- the naive idea that “deploying a model is just docker run”",
      "c2.m": "feat: a top internet company · VLM data & strategy intern",
      "c2.d1": "+ Owned data and quality iteration for an end-to-end multimodal moderation model on social-profile content (images + text, 3 product lines)",
      "c2.d2": "+ Mined bad cases from human-review / QA disagreements, targeted collection and re-weighting; produced 35k+ training samples myself to support daily iteration",
      "c2.d3": "+ Model accuracy 75% → 98%; pushed for “model-checks-all-human-reviews”, raising overall accuracy 92% → 97%",
      "c3.m": "feat: LLM-agent active cyber-defense system · team of 3",
      "c3.d1": "+ Hybrid graph + vector RAG: natural language → Cypher over a threat graph, then vector retrieval to generate; later evolved into ReAct routing over multiple data sources",
      "c3.d2": "+ Agent short / long-term memory: conversation buffer + semantic recall; long-term memory distilled by the LLM into documents loaded across sessions",
      "c3.d3": "+ Threat-intel API wrappers, public-cloud resource integration, Docker + GitHub Actions builds",
      "c3.d4": "+ First prize in a national software design contest final · invention patent (co-first inventor) · software copyright",
      "c4.m": "init: B.Eng. in Computer Science",
      "c4.d1": "+ National software design contest first prize · provincial silver in an innovation contest · provincial engineering contest third prize",
      "c4.d2": "+ First-class scholarship · CET-6",
      "pr1": "docs: v1alpha1 API reference, live on the website", "pr2": "test: gate for the TAS scheduling library tests", "pr3": "genref: support json tag options",
      /* ---- ping ---- */
      "fr.t": "FRIENDS",
      "ping.btn": "Send a ping", "card.btn": "Make a business card",
      "ping.note": "Contact details aren't published here · find me on GitHub, or type <kbd>sudo hire-me</kbd> in the terminal",
      "card.shuffle": "Shuffle style", "card.dl": "Download PNG", "card.close": "Close",
      "foot.keys": "<kbd>X</kbd> x-ray · <kbd>`</kbd> terminal · <kbd>S</kbd> sound",
      "x1": "&lt;!-- A photo was supposed to go here. Privacy first, so: a chip. --&gt;",
      "x2": "&lt;!-- Numbers come from real work; APIs, IPs, graphs and simulations are made-up demos, except the biped: that one is the real policy --&gt;",
      /* ---- dynamic ---- */
      "gen.text": "Hi, I'm dreaming66. By day I work on LLM inference; by night I draw my own dev boards; on weekends I build robots and play with radios, and when I'm tired I plug in the electric guitar. I believe the best way to understand a system is to build it from scratch with your own hands.",
      "gen.keys": ["LLM inference", "dev boards", "robots", "radios", "electric guitar", "from scratch"],
      "pcb.unpowered": "Solder every pad first (or AUTO-SOLDER), then press POWER ON.",
      "pcb.anyroot": "(any user is root on this board)", "pcb.tryhelp": "# try typing help",
      "rack.svc": [["WAN ⇄ LAN", "firewall / NAT", "VLAN · DNS · DHCP", "policy routing"], ["8 × 2.5GbE", "VLAN trunk", "LACP"], ["virtualization host", "VMs: dev / ci / sandbox", "PCIe passthrough"], ["control-plane", "etcd · ingress"], ["worker", "Docker workloads", "Prometheus · Grafana"], ["worker", "GPU / inference experiments"], ["storage · snapshots · backups", "image registry"], ["graceful shutdown when the mains drop"]],
      "rk.card": "bank card 85.6 × 54",
      "rk.size": a => `board area ${a} mm², about ${Math.round(a / (31 * 62) * 100)}% of AuraCore\ngoal: a stamp-sized edge inference node\nprocess: JLCPCB free 6-layer stack-up + via-in-pad`,
      "rk.fan": "via-in-pad: the via sits right in the BGA pad, resin-filled and plated over\nno dog-bone keep-out, so even the inner rows of a fine-pitch BGA can change layers in place\nthe key process for fitting an RK3576 into 38 × 38 mm",
      "cyc.read": (n, l, rpm) => `${n} pins / ${l} lobes → ${l}:1 reduction (illustrative)\ninput ${rpm} rpm → output ${(rpm / l).toFixed(1)} rpm, reversed\nideal torque × ${l}; many teeth share the load, so it takes shocks well\nbench: electric screwdriver on the input · smooth, no binding`,
      "sdr.listen": "(press S to turn the sound on and listen)", "sdr.hint": "tip: drag / scroll / SCAN",
      "ft.idle": "idle · pick a rank and press TRAIN\n(the curves are illustrative, not real experiment results)", "ft.over": "⚠ eval loss rising — overfitting?",
      "mcp.s1": "Get a flight's real-time status", "mcp.s2": "Plan a route between two points", "mcp.s3": "Search company records by name",
      "card.line": "From solder to tensors, build it all",
      "gh.rate": "rate-limited · see github.com/dreaming66",
      "term.hello": "DRM-66 tty0 · type",
      "term.help": "<span class=\"p\">commands</span>\n  whoami · neofetch · ls · uname -a · lang zh|en|ja\n  build      solder a board        aura     AuraCore cluster\n  walk       shove the biped\n  kubectl get nodes                sdr      listen to the beacon\n  cq         send the callsign\n  infer      inference lab         matrix   enter the matrix\n  xray       x-ray mode            sound    toggle sound\n  sudo hire-me · clear · exit",
      "term.whoami": "<span class=\"g\">dreaming66</span> · maker / AI infra engineer · DE <span class=\"p\">BH3FWY</span>\nI draw PCBs, build kernels and run LLMs; at home I build a humanoid, draw SDR boards and play electric guitar.",
      "term.hire": "Head over to <a href=\"https://github.com/dreaming66\" target=\"_blank\" rel=\"noopener\" style=\"text-decoration:underline\">github.com/dreaming66</a> — looking forward to talking.",
      "term.nosound": "<span class=\"r\">sound is off</span> · type sound first",
      "term.notfound": "<span class=\"r\">command not found:</span>",
      "term.try": "try",
      "lang.set": "language →",
    },

    ja: {
      "doc.title": "dreaming66 · はんだからテンソルまで",
      "doc.desc": "dreaming66 のホームページ：自作 Linux ボード、AI インフラと LLM 推論、ヒューマノイド、SDR。",
      "skip": "本文へスキップ",
      "menu": "メニュー",
      "tt.snd": "サウンド (S)", "tt.xray": "X 線モード (X)", "tt.mot": "アニメーション停止", "tt.term": "ターミナル (`)", "tt.lang": "言語",
      "m.build": "手づくり", "m.aura": "AuraCore クラスタ", "m.lab": "推論ラボ", "m.wip": "進行中", "m.archive": "アーカイブ", "m.log": "経歴", "m.ping": "連絡",
      "menu.foot": "<kbd>`</kbd> でターミナル · <kbd>S</kbd> サウンド · <kbd>X</kbd> X 線 · ↑↑↓↓←→←→BA もどうぞ",
      "hero.kicker": "<span class=\"star\">✳</span> こんにちは、Ruimin です。基板を描き、カーネルをビルドし、<span class=\"hl\">大規模モデルを動かしています</span>。",
      "hero.tag": "/ ˈdriːmɪŋ /<br>n. 自分の手でつくりたいという執念",
      "hero.desc": "<b>H616 ボード</b>から <b>PD 分離</b>まで、<b>サイクロイド関節</b>から <b>SDR</b> まで。<br>はんだパッドからトークンまで、システムのすべての層に興味があります。",
      "hero.cta": "作ったものを見る",
      "hero.hint": "クリックでインクを一滴 · CLICK TO DROP INK",
      "mq2": "はんだ ✳ テンソル ✳ デバイスツリー ✳ サイクロイド ✳ ウォーターフォール ✳ 歪み ✳ パッド内ビア ✳ アテンション ✳ コールサイン BH3FWY ✳ ",
      "spec.t": "概要",
      "spec.hint": "↑ ストリーミング生成。トークンにカーソルを合わせると（架空の）logprob が見られます。",
      "st1": "自作 AuraCore で組んだ k3s クラスタ", "st1u": " 枚", "st2": "主要モデルの同時推論レイテンシ", "st3": "本番運用した大規模モデル", "st4": "次のボードの一辺", "st4u": " mm",
      "f1": "Allwinner H616 の SBC「AuraCore」（6 層基板）と、USB でネットワークを組む 5 スロットのクラスタベースを設計し、k3s を運用",
      "f2": "回路図、基板、手はんだ、デバイスツリー、U-Boot / Kernel / Buildroot まで一通り",
      "f3": "開発中：RK3576 SBC、38 × 38 mm、6 TOPS NPU でエッジ推論",
      "f4": "STM32 · ESP32 · Arduino などのマイコン",
      "f5": "サーバー構築 · 仮想化 · Docker · K8s · ソフトウェアルーター",
      "f6": "LLM 推論 · AI インフラ · PD 分離",
      "f7": "Agent · MCP · Graph-RAG",
      "f8": "エレキギター（J-ROCK）、ピアノ練習中",
      "spec.fnote": "* 絶対最大定格を超えると、恒久的な夜更かしの原因となる場合があります。",
      "build.t": "手づくり、<em>まっさらな基板から</em>",
      "build.s": "AuraCore は私がゼロから設計した Allwinner H616 ボードです。回路図、6 層基板、手はんだ、そしてデバイスツリー、U-Boot、カーネル、Buildroot と進めて、シリアルにログインプロンプトが出るまで。下は簡略化したレイアウトです。<b>すべてのパッドをはんだ付け</b>して（クリックまたはドラッグ）、電源を入れてみてください。",
      "mcu1": "レジスタ / HAL · ペリフェラルドライバ · RTOS", "mcu2": "Wi-Fi / BLE · 小さな IoT", "mcu3": "手早くプロトタイプ · すべては blink から",
      "rack.t": "家のラック",
      "rack.s": "サーバー構築、仮想化、Docker、K8s、ソフトウェアルーター。仕事で使うものは、まず家で一通りいじります。機器にカーソルを合わせると状態を表示、クリックでパケットの経路を見られます。",
      "aura.t": "5 枚の AuraCore で、<em>ひとつのクラスタ</em>",
      "aura.s": "ベースには垂直な USB-C プラグが 5 つ。1 枚が head 兼ルーター、4 枚がワーカーです。ワーカーは USB ガジェットのイーサネットとしてベースの CH339F に接続し、head がルーティングして k3s を動かします。下は EasyEDA から書き出した<b>実際の 3D モデル</b>です。ドラッグで回転、スクロールでズーム、ASSEMBLE で差し込む様子を見られます。",
      "dt.dram": "DDR3 · x16 1 個 · 512 MB", "dt.pcb": "6 層 · 31 × 60 mm", "dt.slots": "垂直 USB-C × 5 · head 1 + ワーカー 4", "dt.power": "DC 入力 · SY8113B · スロットごとにバルクコンデンサ", "dt.stack": "USB ガジェット Ethernet → head でルーティング → k3s",
      "br1": "DDR は 1 枚目で動作", "br2": "メインラインの U-Boot / Linux は正常に起動", "br3": "Allwinner BSP ではメモリ異常。起動時の DDR トレーニングまで絞り込み、調査中",
      "ph1": "AuraCore V2.0 · Engineering Sample · TOP", "ph2": "BOTTOM · 0402 部品、手はんだ",
      "alt.front": "AuraCore V2.0 エンジニアリングサンプルの表面", "alt.back": "AuraCore 裏面の 0402 部品",
      "lab.t": "推論ラボ",
      "lab.s": "本業は LLM 推論のデプロイとチューニング。4 つの小さな実験は、スクロールで到達すると自動で動き出します。",
      "pd.t": "Prefill / Decode 分離",
      "pd.p": "1 枚のカードで prefill と decode を両方こなすと、新しいリクエストが来るたびに出力中のシーケンスが止まります。ノードを分け、KV キャッシュをプール（Mooncake）経由で受け渡せば、decode は一定のペースで出力できます。モードを切り替えて、TPOT とジッターの変化を見てください。",
      "npu.t": "NPU アレイ・スコープ",
      "npu.p": "百枚規模のクラスタの抽象的な断面：1 マスが 1 枚のカード、明るさが使用率です。AllReduce を実行すると、集合通信がリングを 12 ノード分まわる音が聞こえます。カーソルを合わせるとカードの状態を表示。",
      "mcp.t": "REST → MCP コンパイラ",
      "mcp.p": "既存の API は数え切れません。エージェントごとにアダプタを書き直すべきではない。ツール基盤が API の記述を読み取って MCP ツール定義を自動生成し、登録・認証・配信を一元管理します。（例の API はすべて架空です）",
      "g.t": "脅威グラフ · Graph-RAG",
      "g.p": "ベクトル検索だけでは「この IP の背後にいるのは誰か」に答えられません。情報をグラフに入れ、エージェントにグラフ・ベクトル・リレーショナルの各ストアを使い分けさせます。ノードはドラッグ可能。「6 ホップ」で攻撃者から 1 ホップずつ展開します。",
      "wip.t": "進行中", "wip.s": "まだ完成していないけれど、毎週進めていること。",
      "rk.p": "次のボード：Rockchip RK3576 を 38 × 38 mm に収め、6 TOPS の NPU でエッジ推論を。本業の推論を切手サイズの基板に詰め込みます。JLCPCB の無料 6 層スタックアップ + パッド内ビア。",
      "rk.s1": "回路図", "rk.s2": "配置 / 配線", "rk.s3": "試作", "rk.s4": "Bring-up", "rk.s5": "NPU 推論", "rk.v1": "サイズ比較", "rk.v2": "BGA ファンアウト",
      "robot.t": "低コストなヒューマノイド",
      "robot.p": "Berkeley Humanoid Lite（BHL）をベースに自宅で製作中。歩容の方策はもう学習できました。MJX（MuJoCo + JAX）で PPO、無料の T4 GPU 1 枚で 2.8 時間・1.9 億ステップ。前後に歩き、横移動し、旋回し、押されても倒れません。右は録画ではなく、同じ方策があなたのブラウザでリアルタイムに物理シミュレーションしているもので、自動操縦中です。画面をクリックすると押せます。",
      "robot.s1": "フレーム印刷", "robot.s2": "サイクロイド関節の検証", "robot.s3": "RL 歩容 · シミュレーション", "robot.s4": "FOC ドライバ", "robot.s5": "全体組立",
      "robot.v1": "リアルタイム", "robot.v2": "録画", "robot.full": "全画面で操作", "robot.go": "ブラウザでリアルタイム実行 · 約 6 MB",
      "act.t": "サイクロイド減速関節 · 自作 FOC",
      "act.p": "関節は BHL の 5010 サイクロイド減速機で、3D プリント製です。モーターに触れる 2 部品（Motor Shell / Motor Shaft）だけを作り直す cadquery スクリプトを書き、手元の 5010 360KV モーターに合わせました。ほかの印刷部品はそのまま。印刷と組み立ては完了。モーターがまだ届かないので、電動ドライバーを入力軸に差してモーター代わりに回してみました。引っかかりなく滑らかに回り、出力トルクも十分です。FOC ドライバは自作で、部品選定と基板設計の最中です。",
      "act.s1": "cadquery で適合", "act.s2": "印刷 + 組立", "act.s3": "電動ドライバーで試運転", "act.s4": "モーター待ち", "act.s5": "FOC 閉ループ",
      "act.img": "3D プリントしたサイクロイドディスク。出力ピンのベアリング 6 個と中央の偏心ベアリング",
      "sdr.t": "ソフトウェア無線",
      "sdr.p": "自作基板：ZYNQ-7010 + AD936x で、RF フロントエンドと FPGA 上の信号処理を学んでいます。アマチュア無線のコールサインは BH3FWY。下のウォーターフォールにはいくつかの模擬信号が隠れています。ドラッグかスクロールで同調すると、サウンドをオンにしていれば「聞く」ことができます。そのひとつはコールサインを繰り返し送るモールスのビーコン。解読できますか？",
      "ft.t": "LLM の学習とファインチューニング",
      "ft.p": "推論から上流へ：学習とファインチューニングを勉強中。LoRA のランクを選んで学習し、loss 曲線と学習率スケジュール（warmup + cosine）を見てください。",
      "ar.t": "アーカイブ、<em>学生時代のものづくり</em>",
      "ar.s": "スマホのカメラロールから掘り出した未編集の映像です。スクロールすると再生、タップで一時停止。",
      "r1.t": "四足ロボットの再現",
      "r1.p": "<a href=\"https://github.com/ToanTech/py-apple-quadruped-robot\" target=\"_blank\" rel=\"noopener\">ToanTech/py-apple-quadruped-robot ↗</a> を再現：3D プリントの脚、サーボ駆動、歩容の調整。初めて「歩いた」ロボットです。",
      "r2.t": "単眼カメラによる自律飛行",
      "r2.p": "ORB-SLAM3 の単眼自己位置推定 + <a href=\"https://github.com/geturin/MiDaS/tree/master/ros\" target=\"_blank\" rel=\"noopener\">MiDaS ↗</a> の単眼深度推定で密な深度を補い、EGO-Planner で障害物回避。シミュレーションでスウォーム編隊も試しました。",
      "r3.t": "HAHA OMNI 全方向台車",
      "r3.p": "60 mm のオムニホイール 3 つに 42 ステッピングモーター、GD32F103 と LV8731V ドライバ。運動学と ROS シリアルプロトコルは自作で、YDLIDAR X2 で地図を作成。<a href=\"https://github.com/dreaming66/omni_haha\" target=\"_blank\" rel=\"noopener\">ソース ↗</a>",
      "r4.t": "BeSafe：火花を散らしたチップ",
      "r4.p": "電力を見積もりそこね、チップが過負荷でその場で火花を出しました。失敗もデータです。それ以来、基板を描く前に必ず電力を計算し、余裕を持たせ、保護回路を入れています。",
      "log.s": "本業のメインライン。コミットをクリックすると diff を展開します。",
      "c1.m": "feat: 大手企業グループ · AI インフラエンジニアリング",
      "c1.d1": "+ 百枚規模の Ascend NPU クラスタと PPU アプライアンスの運用・調整：HCCL ネットワークと通信チューニング、コンテナのリソーススケジューリング、増設時のネットワーク設計",
      "c1.d2": "+ vLLM / MindIE で DeepSeek、Qwen、Embedding / Reranker、MinerU など 10 以上のモデルをプライベート環境にデプロイ。新モデルは 1 週間以内に検証と負荷試験を完了",
      "c1.d3": "+ マルチノード通信のボトルネックを特定。Mooncake の PD 分離 + W8A8 量子化 + 演算子最適化 → 同時実行レイテンシ −20%、リソース使用率 +25%",
      "c1.d4": "+ グループ全体のエージェント基盤の K8s 運用と Prometheus / Grafana アラート。累計 1,000 万人超が利用、重大障害ゼロ",
      "c1.d5": "+ 自社 MCP ツール基盤を主導：REST → MCP の自動変換、登録・認証・配信を一元化",
      "c1.d6": "- 「モデルのデプロイなんて docker run するだけ」という甘い考え",
      "c2.m": "feat: 大手インターネット企業 · VLM データ・戦略インターン",
      "c2.d1": "+ SNS のプロフィール向けエンドツーエンドのマルチモーダル審査モデル（画像 + テキスト、3 事業ライン）のデータと精度改善を担当",
      "c2.d2": "+ 人手審査 / 品質チェックの不一致をシグナルに badcase を発掘し、重点収集と重み付け。学習サンプルを個人で 3.5 万件以上作成し、日次の改善を支えた",
      "c2.d3": "+ モデル精度 75% → 98%。「モデルが人手審査を全件チェック」する体制を推進し、全体精度 92% → 97%",
      "c3.m": "feat: LLM エージェントによる能動的サイバー防御システム · 3 人チーム",
      "c3.d1": "+ Graph + Vector のハイブリッド RAG：自然言語 → Cypher で脅威グラフを検索し、ベクトル検索を経て生成。のちに ReAct による複数データソースのルーティングへ発展",
      "c3.d2": "+ エージェントの短期 / 長期記憶：会話バッファ + 意味検索。長期記憶は LLM が要約して文書化し、セッションをまたいで読み込み",
      "c3.d3": "+ 脅威インテリジェンス API のラップ、パブリッククラウドの資源連携、Docker 化と GitHub Actions による自動ビルド",
      "c3.d4": "+ 全国ソフトウェア設計コンテスト決勝 一等賞 · 発明特許（共同筆頭発明者）· ソフトウェア著作権",
      "c4.m": "init: コンピュータサイエンス · 学士",
      "c4.d1": "+ 全国ソフトウェア設計コンテスト 一等賞 · イノベーションコンテスト 省レベル銀賞 · 省レベル工学コンテスト 三等賞",
      "c4.d2": "+ 一等奨学金 · CET-6",
      "pr1": "docs: v1alpha1 API リファレンス、公式サイトに公開済み", "pr2": "test: TAS スケジューリングライブラリのテストゲート", "pr3": "genref: json tag options に対応",
      "fr.t": "友達のサイト",
      "ping.btn": "ping を送る", "card.btn": "名刺をつくる",
      "ping.note": "連絡先はここでは公開していません · GitHub で見つけるか、ターミナルで <kbd>sudo hire-me</kbd> と入力してください",
      "card.shuffle": "スタイル変更", "card.dl": "PNG を保存", "card.close": "閉じる",
      "foot.keys": "<kbd>X</kbd> X 線 · <kbd>`</kbd> ターミナル · <kbd>S</kbd> サウンド",
      "x1": "&lt;!-- ここには写真を置くつもりでした。プライバシー優先で、チップに。 --&gt;",
      "x2": "&lt;!-- 数字は実際の仕事から。API、IP、グラフ、シミュレーションは架空のデモです。二足ロボットだけは本物の方策 --&gt;",
      "gen.text": "こんにちは、dreaming66 です。昼は LLM 推論と向き合い、夜は自分の開発ボードを描き、週末はロボットをつくって無線で遊び、疲れたらエレキギターをつなぎます。システムを理解するいちばんの方法は、自分の手でゼロから組み上げることだと思っています。",
      "gen.keys": ["LLM 推論", "開発ボード", "ロボット", "無線", "エレキギター", "ゼロから組み上げる"],
      "pcb.unpowered": "まずすべてのパッドをはんだ付けして（または AUTO-SOLDER）、POWER ON を押してください。",
      "pcb.anyroot": "(このボードでは誰でも root です)", "pcb.tryhelp": "# help と入力してみてください",
      "rack.svc": [["WAN ⇄ LAN", "ファイアウォール / NAT", "VLAN · DNS · DHCP", "ポリシールーティング"], ["8 × 2.5GbE", "VLAN トランク", "LACP"], ["仮想化ホスト", "VM: dev / ci / sandbox", "PCIe パススルー"], ["control-plane", "etcd · ingress"], ["worker", "Docker ワークロード", "Prometheus · Grafana"], ["worker", "GPU / 推論の実験"], ["ストレージ · スナップショット · バックアップ", "イメージレジストリ"], ["停電しても安全にシャットダウン"]],
      "rk.card": "銀行カード 85.6 × 54",
      "rk.size": a => `基板面積 ${a} mm²、AuraCore の約 ${Math.round(a / (31 * 62) * 100)}%\n目標：切手サイズのエッジ推論ノード\nプロセス：JLCPCB 無料 6 層スタックアップ + パッド内ビア`,
      "rk.fan": "パッド内ビア：ビアを BGA パッドに直接開け、樹脂で埋めてめっきでふさぐ\nドッグボーン分の場所が不要になり、狭ピッチ BGA の内側の列もその場で層を移れる\nRK3576 を 38 × 38 mm に収めるための鍵となる工程",
      "cyc.read": (n, l, rpm) => `ピン ${n} 本 / 歯 ${l} 枚 → 減速比 ${l}:1（イメージ）\n入力 ${rpm} rpm → 出力 ${(rpm / l).toFixed(1)} rpm、逆回転\n理想トルク × ${l}、多くの歯で同時にかみ合うので衝撃に強い\nベンチ：電動ドライバーで入力軸を駆動 · 引っかかりなし`,
      "sdr.listen": "(S でサウンドをオンにして聞いてみてください)", "sdr.hint": "ヒント：ドラッグ / スクロール / SCAN",
      "ft.idle": "idle · ランクを選んで TRAIN を押してください\n（曲線はイメージで、実際の実験結果ではありません）", "ft.over": "⚠ eval loss が上昇 — 過学習？",
      "mcp.s1": "フライトのリアルタイム状況を取得", "mcp.s2": "2 地点間のルートを計画", "mcp.s3": "企業情報を名前で検索",
      "card.line": "はんだからテンソルまで、すべて自分の手で",
      "gh.rate": "rate-limited · github.com/dreaming66 をご覧ください",
      "term.hello": "DRM-66 tty0 · 入力:",
      "term.help": "<span class=\"p\">commands</span>\n  whoami · neofetch · ls · uname -a · lang zh|en|ja\n  build      基板をはんだ付け      aura     AuraCore クラスタ\n  walk       二足ロボットを押す\n  kubectl get nodes                sdr      ビーコンを聞く\n  cq         コールサインを送信\n  infer      推論ラボ              matrix   マトリックスへ\n  xray       X 線モード            sound    サウンド切替\n  sudo hire-me · clear · exit",
      "term.whoami": "<span class=\"g\">dreaming66</span> · メイカー / AI インフラエンジニア · DE <span class=\"p\">BH3FWY</span>\n基板を描き、カーネルをビルドし、LLM を動かす。家ではヒューマノイドをつくり、SDR の基板を描き、エレキギターを弾いています。",
      "term.hire": "<a href=\"https://github.com/dreaming66\" target=\"_blank\" rel=\"noopener\" style=\"text-decoration:underline\">github.com/dreaming66</a> へどうぞ。お話しできるのを楽しみにしています。",
      "term.nosound": "<span class=\"r\">sound is off</span> · まず sound と入力してください",
      "term.notfound": "<span class=\"r\">command not found:</span>",
      "term.try": "試しに",
      "lang.set": "language →",
    },

    zh: {
      // dynamic strings only — static zh text is read from the page itself
      "doc.title": "dreaming66 · 从焊锡到张量",
      "doc.desc": "dreaming66 的个人主页：手搓 Linux 开发板、AI Infra 与大模型推理、人形机器人与 SDR。",
      "st1u": " 片", "st4u": " mm",
      "gen.text": "你好，我是 dreaming66。白天和大模型推理打交道，晚上画自己的开发板，周末手搓机器人、折腾无线电，累了就插上电吉他。我相信：理解一个系统最好的方式，是亲手把它从零搭起来。",
      "gen.keys": ["大模型推理", "开发板", "机器人", "无线电", "电吉他", "从零搭起来"],
      "pcb.unpowered": "先把焊盘焊好（或 AUTO-SOLDER），再按 POWER ON。",
      "pcb.anyroot": "(any user is root on this board)", "pcb.tryhelp": "# 输入 help 试试",
      "rack.svc": [["WAN ⇄ LAN", "防火墙 / NAT", "VLAN · DNS · DHCP", "代理分流"], ["8 × 2.5GbE", "VLAN trunk", "LACP"], ["虚拟化平台", "VM: dev / ci / sandbox", "PCIe 直通"], ["control-plane", "etcd · ingress"], ["worker", "Docker workloads", "Prometheus · Grafana"], ["worker", "GPU / 推理实验"], ["存储 · 快照 · 备份", "镜像仓库"], ["市电断了也能优雅关机"]],
      "rk.card": "银行卡 85.6 × 54",
      "rk.size": a => `板面积 ${a} mm²，约为 AuraCore 的 ${Math.round(a / (31 * 62) * 100)}%\n目标：一张邮票大小的端侧推理节点\n工艺：嘉立创六层免费叠层 + 盘中孔`,
      "rk.fan": "盘中孔：过孔直接打在 BGA 焊盘上，树脂塞孔 + 电镀盖帽\n省掉狗骨占位，细间距 BGA 的内圈也能就地换层\n这是把 RK3576 压进 38 × 38 mm 的关键工艺",
      "cyc.read": (n, l, rpm) => `${n} 针 / ${l} 齿 → 减速比 ${l}:1（示意）\n输入 ${rpm} rpm → 输出 ${(rpm / l).toFixed(1)} rpm，反向\n理想扭矩 × ${l}，多齿同时啮合，抗冲击\n台架：电动螺丝刀驱动输入轴 · 顺滑无卡滞`,
      "sdr.listen": "(按 S 打开声音来收听)", "sdr.hint": "提示：拖动 / 滚轮 / SCAN",
      "ft.idle": "idle · 选一个秩，按 TRAIN\n（曲线为示意，不代表真实实验结果）", "ft.over": "⚠ eval loss rising — overfitting?",
      "mcp.s1": "查询航班实时状态", "mcp.s2": "两点之间的路线规划", "mcp.s3": "按名称检索企业信息",
      "card.line": "从焊锡到张量，亲手造一切",
      "gh.rate": "rate-limited · 去 github.com/dreaming66 看看",
      "term.hello": "DRM-66 tty0 · 输入",
      "term.help": "<span class=\"p\">commands</span>\n  whoami · neofetch · ls · uname -a · lang zh|en|ja\n  build      去焊板子          aura     看 AuraCore 集群\n  walk       推一把双足机器人\n  kubectl get nodes            sdr      去听信标\n  cq         用摩尔斯拍发呼号\n  infer      推理实验室        matrix   进入矩阵 (再输一次退出)\n  xray       透视模式          sound    开/关声音\n  sudo hire-me · clear · exit",
      "term.whoami": "<span class=\"g\">dreaming66</span> · maker / AI Infra engineer · DE <span class=\"p\">BH3FWY</span>\n画 PCB、编内核、跑大模型；在家手搓人形机器人、画 SDR 板子、弹电吉他。",
      "term.hire": "请移步 <a href=\"https://github.com/dreaming66\" target=\"_blank\" rel=\"noopener\" style=\"text-decoration:underline\">github.com/dreaming66</a>，期待交流。",
      "term.nosound": "<span class=\"r\">sound is off</span> · 先输入 sound",
      "term.notfound": "<span class=\"r\">command not found:</span>",
      "term.try": "试试",
      "lang.set": "language →",
    },
  };

  const pick = () => {
    const q = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(q)) return q;
    try { const s = localStorage.getItem("d66-lang"); if (LANGS.includes(s)) return s; } catch {}
    for (const l of navigator.languages || [navigator.language || ""]) {
      const p = l.toLowerCase();
      if (p.startsWith("zh")) return "zh";
      if (p.startsWith("ja")) return "ja";
      if (p.startsWith("en")) return "en";
    }
    return "en";
  };

  const I = window.I18N = { lang: pick(), langs: LANGS, dict: D, zh: {} };
  I.t = (k, ...a) => {
    const v = (D[I.lang] && D[I.lang][k] !== undefined) ? D[I.lang][k] : (D.zh[k] !== undefined ? D.zh[k] : I.zh[k]);
    return typeof v === "function" ? v(...a) : (v === undefined ? k : v);
  };

  function apply() {
    const L = I.lang;
    document.documentElement.lang = HTML_LANG[L];
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.dataset.i18n;
      if (!(k in I.zh)) I.zh[k] = el.innerHTML;                 // remember the source text once
      const v = L === "zh" ? I.zh[k] : D[L][k];
      if (v !== undefined && el.innerHTML !== v) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(el => {
      el.dataset.i18nAttr.split(",").forEach(pair => {
        const [attr, k] = pair.split(":"); const zk = k + "@" + attr;
        if (!(zk in I.zh)) I.zh[zk] = el.getAttribute(attr) || "";
        const v = L === "zh" ? I.zh[zk] : D[L][k];
        if (v !== undefined) el.setAttribute(attr, v);
      });
    });
    document.title = I.t("doc.title");
    const md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute("content", I.t("doc.desc"));
    const b = document.getElementById("langBtn"); if (b) b.textContent = { zh: "中", en: "EN", ja: "日" }[L];
  }
  I.set = L => {
    if (!LANGS.includes(L) || L === I.lang && I.applied) return;
    I.lang = L; I.applied = true;
    try { localStorage.setItem("d66-lang", L); } catch {}
    apply();
    document.dispatchEvent(new CustomEvent("d66lang", { detail: L }));
  };
  I.next = () => I.set(LANGS[(LANGS.indexOf(I.lang) + 1) % LANGS.length]);
  // apply as early as possible (script sits at the end of <body>)
  apply(); I.applied = true;
})();
