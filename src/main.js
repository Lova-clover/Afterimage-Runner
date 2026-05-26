import "./styles.css";

const loadingOverlay = document.querySelector("#loadingOverlay");
const loadingBar = document.querySelector("#loadingBar");
const loadingPercent = document.querySelector("#loadingPercent");
const loadingMessage = document.querySelector("#loadingMessage");
const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const canvasCard = document.querySelector(".canvas-card");

const roomText = document.querySelector("#roomText");
const loopText = document.querySelector("#loopText");
const echoText = document.querySelector("#echoText");
const coreText = document.querySelector("#coreText");
const timerText = document.querySelector("#timerText");
const paceText = document.querySelector("#paceText");
const campaignText = document.querySelector("#campaignText");
const timerBar = document.querySelector("#timerBar");
const roomChapter = document.querySelector("#roomChapter");
const roomName = document.querySelector("#roomName");
const roomGoal = document.querySelector("#roomGoal");
const roomStory = document.querySelector("#roomStory");
const syncChecklist = document.querySelector("#syncChecklist");
const doorText = document.querySelector("#doorText");
const dangerText = document.querySelector("#dangerText");
const bestText = document.querySelector("#bestText");
const missionSteps = document.querySelector("#missionSteps");
const operatorText = document.querySelector("#operatorText");
const sidePanel = document.querySelector(".side-panel");
const missionCard = document.querySelector(".mission-card");
const operatorCard = document.querySelector(".operator-card");
const stageRail = document.querySelector("#stageRail");
const echoList = document.querySelector("#echoList");
const centerToast = document.querySelector("#centerToast");
const startOverlay = document.querySelector("#startOverlay");
const endOverlay = document.querySelector("#endOverlay");
const pauseOverlay = document.querySelector("#pauseOverlay");
const menuPanel = document.querySelector("#menuPanel");
const stagePanel = document.querySelector("#stagePanel");
const introPanel = document.querySelector("#introPanel");
const continueButton = document.querySelector("#continueButton");
const tutorialButton = document.querySelector("#tutorialButton");
const stageSelectButton = document.querySelector("#stageSelectButton");
const stageBackButton = document.querySelector("#stageBackButton");
const stageRouteTabs = document.querySelector("#stageRouteTabs");
const stageSummary = document.querySelector("#stageSummary");
const stageGrid = document.querySelector("#stageGrid");
const startButton = document.querySelector("#startButton");
const introBackButton = document.querySelector("#introBackButton");
const introImage = document.querySelector("#introImage");
const introFallback = document.querySelector("#introFallback");
const introKicker = document.querySelector("#introKicker");
const introTitle = document.querySelector("#introTitle");
const introBody = document.querySelector("#introBody");
const introDots = document.querySelector("#introDots");
const restartButton = document.querySelector("#restartButton");
const resultKicker = document.querySelector("#resultKicker");
const resultTitle = document.querySelector("#resultTitle");
const resultBody = document.querySelector("#resultBody");
const resultAdvice = document.querySelector("#resultAdvice");
const resultInsight = document.querySelector("#resultInsight");
const resultMascot = document.querySelector("#resultMascot");
const resultBadge = document.querySelector("#resultBadge");
const finalStars = document.querySelector("#finalStars");
const finalLoops = document.querySelector("#finalLoops");
const finalEchoes = document.querySelector("#finalEchoes");
const finalTime = document.querySelector("#finalTime");
const resultReplay = document.querySelector("#resultReplay");
const nextButton = document.querySelector("#nextButton");
const menuButton = document.querySelector("#menuButton");
const pauseButton = document.querySelector("#pauseButton");
const resumeButton = document.querySelector("#resumeButton");
const pauseRestartButton = document.querySelector("#pauseRestartButton");
const pauseMenuButton = document.querySelector("#pauseMenuButton");
const mobileControls = document.querySelector("#mobileControls");

const W = 960;
const H = 540;
const RECORD_GUIDE_SECONDS = 12;
const MAX_GHOSTS = 4;
const PLAYER_R = 18;
const SAMPLE_RATE = 1 / 30;
const PB_TRACE_RATE = 1 / 12;
const BASE_SPEED = 286;
const DASH_SPEED = 820;
const DASH_BUFFER_SECONDS = 0.16;
const CANVAS_GUIDE_ROOMS = 1;
const PHASE_SECONDS = 4.2;
const JUDGE_CLEAR_INDEX = 11;
const OFFICIAL_TARGET_SECONDS = 600;
const keys = new Set();
const movementKeys = new Set(["arrowleft", "arrowright", "arrowup", "arrowdown"]);
const virtualPointerKeys = new Map();

const INSTANCE_ID = Symbol("rewind-runner-instance");
window.__rewindRunnerActiveInstance = INSTANCE_ID;

let lastTime = performance.now();
let animationId = 0;
let canvasResizeObserver = null;
let audioContext = null;
let loadingStartedAt = performance.now();

const loadingMessages = [
  "실패 로그를 복원하고 있습니다.",
  "잔상 경로를 동기화하는 중...",
  "스위치 기록을 확인하는 중...",
  "20번째 문을 스캔하는 중...",
  "러너-07의 다음 루프를 준비하는 중...",
];

function fitCanvasToCard() {
  if (!canvasCard) return;
  const styles = getComputedStyle(canvasCard);
  const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
  const maxW = Math.max(0, canvasCard.clientWidth - padX);
  const maxH = Math.max(0, canvasCard.clientHeight - padY);
  if (maxW < 1 || maxH < 1) return;
  const scale = Math.min(maxW / W, maxH / H);
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}

function focusGameCanvas() {
  try {
    canvas.focus({ preventScroll: true });
  } catch {
    canvas.focus();
  }
}

function normalizeInputKey(key) {
  if (!key) return "";
  const normalized = String(key).toLowerCase();
  if (normalized === "space" || normalized === "spacebar") return " ";
  return normalized;
}

function isMobileInputDevice() {
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const noHover = window.matchMedia?.("(hover: none)")?.matches ?? false;
  return coarsePointer || noHover || navigator.maxTouchPoints > 0 || window.innerWidth <= 920;
}

function syncMobileInputMode() {
  document.body.classList.toggle("is-mobile-input", isMobileInputDevice());
}

function markStageStartedByInput(key) {
  key = normalizeInputKey(key);
  if (state.screen !== "game") return;
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "r", "e"].includes(key)) {
    state.stageStarted = true;
  }
}

function handleInstantInput(key) {
  key = normalizeInputKey(key);
  if (state.screen === "stage-result") {
    if (key === " " || key === "enter") startNextRoom();
    else if (key === "r") startGame(state.roomIndex);
    else if (key === "p") showMenu();
    return;
  }

  markStageStartedByInput(key);

  if (key === "p") {
    if (state.screen === "game") pauseGame();
    else if (state.screen === "paused") resumeGame();
    return;
  }
  if (key === " ") queueDash();
  if (key === "e") triggerSync();
  if (key === "r" && state.screen === "game") restartLoop(true);
  if (key === "z") undoGhost();
}

function pressVirtualKey(key, button, pointerId) {
  key = normalizeInputKey(key);
  if (!key) return;
  focusGameCanvas();
  button?.classList.add("is-held");
  if (pointerId != null) virtualPointerKeys.set(pointerId, { key, button });
  if (movementKeys.has(key)) {
    markStageStartedByInput(key);
    keys.add(key);
    return;
  }
  handleInstantInput(key);
}

function releaseVirtualKey(key, button, pointerId) {
  const active = pointerId != null ? virtualPointerKeys.get(pointerId) : null;
  const resolvedKey = normalizeInputKey(active?.key ?? key);
  const resolvedButton = active?.button ?? button;
  if (pointerId != null) virtualPointerKeys.delete(pointerId);
  resolvedButton?.classList.remove("is-held");
  if (resolvedKey && movementKeys.has(resolvedKey)) keys.delete(resolvedKey);
}

const spritePaths = {
  "hero-front": "/assets/player/sprites/hero-front.png",
  "hero-side": "/assets/player/sprites/hero-side.png",
  "hero-run": "/assets/player/sprites/hero-run.png",
  "hero-dash": "/assets/player/sprites/hero-dash.png",
  "hero-hit": "/assets/player/sprites/hero-hit.png",
  "ghost-teal": "/assets/player/sprites/ghost-teal.png",
  "ghost-pink": "/assets/player/sprites/ghost-pink.png",
  "ghost-gold": "/assets/player/sprites/ghost-gold.png",
  "ghost-purple": "/assets/player/sprites/ghost-purple.png",
  "core-orb-teal": "/assets/level/sprites/core-orb-teal.png",
  "core-orb-pink": "/assets/level/sprites/core-orb-pink.png",
  "crystal-teal": "/assets/level/sprites/crystal-teal.png",
  "crystal-pink": "/assets/level/sprites/crystal-pink.png",
  "crystal-purple": "/assets/level/sprites/crystal-purple.png",
  "switch-off": "/assets/level/sprites/switch-off.png",
  "switch-on": "/assets/level/sprites/switch-on.png",
  "door-closed": "/assets/level/sprites/door-closed.png",
  "door-open": "/assets/level/sprites/door-open.png",
  "floor-pad-on": "/assets/level/sprites/floor-pad-on.png",
  "traffic-red": "/assets/level/sprites/traffic-red.png",
  "traffic-green": "/assets/level/sprites/traffic-green.png",
  "laser-gate-pink": "/assets/level/sprites/laser-gate-pink.png",
  "portal-pad": "/assets/level/sprites/portal-pad.png",
  "clear-banner": "/assets/ui/sprites/clear-banner.png",
  "perfect-banner": "/assets/ui/sprites/perfect-banner.png",
  "final-gate-banner": "/assets/ui/sprites/final-gate-banner.png",
  "dash-trail-teal": "/assets/vfx/sprites/dash-trail-teal.png",
  "rewind-burst": "/assets/vfx/sprites/rewind-burst.png",
  "gate-streak-teal": "/assets/vfx/sprites/gate-streak-teal.png",
  "gate-streak-pink": "/assets/vfx/sprites/gate-streak-pink.png",
  "impact-teal": "/assets/vfx/sprites/impact-teal.png",
  "impact-pink": "/assets/vfx/sprites/impact-pink.png",
  "laser-impact": "/assets/vfx/sprites/laser-impact.png",
  "switch-glow": "/assets/vfx/sprites/switch-glow.png",
  "final-explosion": "/assets/vfx/sprites/final-explosion.png",
};

const generatedAssets = {
  switch: "/assets/generated/switch-pad.png",
  record: "/assets/generated/record-marker.png",
  laser: "/assets/generated/laser-gate-closed.png",
  laserOpen: "/assets/generated/laser-gate-open.png",
  core: "/assets/generated/crystal-core.png",
  exit: "/assets/generated/exit-portal.png",
  boost: "/assets/generated/boost-orb.png",
  platform: "/assets/generated/small-platform.png",
  lock: "/assets/generated/lock-icon.png",
  trophy: "/assets/generated/trophy-gold.png",
  clear: "/assets/generated/clear-badge.png",
  mascotClear: "/assets/player/sprites/hero-front.png",
};

const sprites = Object.fromEntries(
  Object.entries(spritePaths).map(([name, src]) => {
    const image = new Image();
    image.src = src;
    return [name, image];
  }),
);

function updateLoadingProgress(progress, messageIndex = 0) {
  const pct = clamp(Math.round(progress * 100), 0, 100);
  if (loadingBar) loadingBar.style.transform = `scaleX(${pct / 100})`;
  if (loadingPercent) loadingPercent.textContent = `${pct}%`;
  if (loadingMessage) loadingMessage.textContent = loadingMessages[messageIndex % loadingMessages.length];
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
}

async function warmupLoadingScreen() {
  if (!loadingOverlay) return;
  const assets = [
    ...new Set([
      ...Object.values(spritePaths),
      ...Object.values(generatedAssets),
      "/assets/ui/sprites/logo.png",
      "/assets/ui/slides/story-1.png",
      "/assets/ui/slides/story-2.png",
      "/assets/ui/slides/story-3.png",
    ]),
  ];
  const minVisibleMs = 720;
  const maxVisibleMs = 1650;
  let done = 0;
  updateLoadingProgress(0, 0);

  const preloadWork = Promise.all(
    assets.map((src, index) =>
      preloadImage(src).then(() => {
        done += 1;
        updateLoadingProgress(done / assets.length, index);
      }),
    ),
  );
  const minimumWait = new Promise((resolve) => setTimeout(resolve, minVisibleMs));
  const maximumWait = new Promise((resolve) => setTimeout(resolve, maxVisibleMs));

  await Promise.race([Promise.all([preloadWork, minimumWait]), maximumWait]);
  updateLoadingProgress(1, loadingMessages.length - 1);
  const elapsed = performance.now() - loadingStartedAt;
  const fadeDelay = elapsed < minVisibleMs ? minVisibleMs - elapsed : 120;
  setTimeout(() => {
    loadingOverlay.classList.add("is-done");
    loadingOverlay.addEventListener("transitionend", () => loadingOverlay.remove(), { once: true });
  }, fadeDelay);
}

const introSlides = [
  {
    type: "story",
    kicker: "아카이브 20",
    title: "러너-07은 이미 한 번 탈출했다.",
    body: "하지만 아카이브는 그 장면만 지웠다.\n\n남은 것은 실패한 발자국뿐이었다.",
    image: "/assets/ui/slides/story-1.png",
    fallback: "archive",
  },
  {
    type: "story",
    kicker: "실험 로그 / 잔상 동기화",
    title: "실패한 루프가 장비가 된다.",
    body: "스위치를 밟았던 너는 다음 루프에서도 스위치를 밟는다.\n\n막혔던 너는 다음 너의 방패가 된다.",
    image: "/assets/ui/slides/story-2.png",
    fallback: "rewind",
  },
  {
    type: "story",
    kicker: "탈출 경로 / 비인가 구역 감지",
    title: "12번째 방은 공식 탈출.",
    body: "아카이브는 말한다.\n“여기서 나가면 충분합니다.”\n\n하지만 20번째 방은 기록에 없다.",
    image: "/assets/ui/slides/story-3.png",
    fallback: "switch",
  },
  {
    type: "story",
    kicker: "러너-07 / 수동 기록",
    title: "실패를 지우지 마라.",
    body: "기록하고,\n맡기고,\n같이 빠져나가라.\n\n이번 탈출은 혼자가 아니다.",
    image: "/assets/ui/slides/story-3.png",
    fallback: "archive",
  },
];

const rooms = [
  {
    name: "첫 기록",
    chapter: "ROOM 1",
    tip: "A를 밟으면 문이 열린다. 먼저 실패해라. 그 실패가 다음 너를 돕는다.",
    goal: "A를 밟고 R로 움직임을 기록한 뒤, 열린 길로 코어까지 달려라.",
    clearLine: "방금 실패한 네가 지금의 문을 열었다.",
    story: "스위치를 밟은 실패는 다음 루프의 열쇠가 된다.",
    parGhosts: 1,
    parTime: 10,
    start: { x: 108, y: 392 },
    exit: { x: 842, y: 360, w: 66, h: 68 },
    cores: [{ x: 712, y: 392 }],
    items: [],
    sizeGates: [],
    switches: [{ id: "A", x: 274, y: 392, label: "A" }],
    gates: [{ id: "gate-a", x: 526, y: 290, w: 42, h: 164, needs: ["A"] }],
    lasers: [],
    walls: [{ x: 382, y: 300, w: 126, h: 26 }],
  },
  {
    name: "늦은 발자국",
    chapter: "ROOM 2",
    tip: "레이저 앞에 멈춰도 좋다. 기다릴 줄 아는 기록이 길을 만든다.",
    goal: "빔을 피하거나 잔상으로 가리고 코어를 회수.",
    clearLine: "기다린 기록이 늦게 열린 길을 붙잡았다.",
    story: "문은 빨리 달린 자가 아니라, 기다릴 줄 아는 기록에게 열린다.",
    parGhosts: 1,
    parTime: 14,
    start: { x: 108, y: 392 },
    exit: { x: 842, y: 376, w: 66, h: 68 },
    cores: [{ x: 722, y: 410 }],
    items: [],
    sizeGates: [],
    dashGates: [],
    switches: [],
    gates: [],
    lasers: [{ id: "block-main", x1: 510, y1: 92, x2: 510, y2: 448, blockable: true, requiresBlock: true, recordSpot: { x: 462, y: 270 } }],
    walls: [{ x: 250, y: 84, w: 28, h: 164 }, { x: 250, y: 326, w: 28, h: 130 }, { x: 622, y: 338, w: 116, h: 28 }],
  },
  {
    name: "막아선 나",
    chapter: "ROOM 3",
    tip: "A를 맡긴 뒤 열린 길에서 부스트를 먹고 Space.",
    goal: "A를 고스트에게 맡기고, 현재의 나는 부스트 장벽을 돌파해 코어를 회수.",
    clearLine: "A를 맡긴 실패가 현재의 대시 길을 열었다.",
    story: "과거의 너는 실패한 것이 아니다. 그 자리에 남아 현재의 너를 지키고 있었다.",
    parGhosts: 1,
    parTime: 18,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 68, h: 68 },
    cores: [{ x: 724, y: 270 }],
    items: [{ type: "dash", x: 520, y: 270 }],
    sizeGates: [],
    dashGates: [{ id: "boost-room-3", x: 650, y: 132, w: 38, h: 276 }],
    switches: [{ id: "A", x: 244, y: 270, label: "A" }],
    gates: [{ id: "dash-memory-gate", x: 420, y: 84, w: 42, h: 372, needs: ["A"] }],
    lasers: [],
    walls: [{ x: 250, y: 70, w: 28, h: 130 }, { x: 250, y: 340, w: 28, h: 130 }],
  },
  {
    name: "두 번째 손",
    chapter: "ROOM 4",
    tip: "A를 맡긴 뒤, 고스트 곁에서 E.",
    goal: "고스트와 싱크해 부스트를 충전하고 장벽을 뚫어라.",
    clearLine: "어제의 손이 오늘의 문을 잡았다.",
    story: "하나의 몸으로는 부족하다. 그러니 어제의 너에게 오늘의 일을 맡겨라.",
    parGhosts: 1,
    parTime: 18,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 68, h: 68 },
    cores: [{ x: 730, y: 270 }],
    items: [],
    sizeGates: [],
    dashGates: [{ id: "sync-boost", x: 700, y: 132, w: 38, h: 276, syncOnly: true }],
    switches: [{ id: "A", x: 240, y: 270, label: "A" }],
    gates: [{ id: "sync-gate", x: 545, y: 84, w: 42, h: 372, needs: ["A"] }],
    lasers: [],
    walls: [{ x: 326, y: 70, w: 28, h: 150 }, { x: 326, y: 320, w: 28, h: 150 }],
  },
  {
    name: "엇갈린 타이밍",
    chapter: "ROOM 5",
    tip: "B+는 크게, C-는 작게. 몸을 바꿔 맡겨라.",
    goal: "중량 고스트와 소형 고스트를 각각 남겨라.",
    clearLine: "정확히 실패한 기록이 정확히 도착했다.",
    story: "잔상은 네 명령을 듣지 않는다. 그저 네가 했던 그대로 움직인다. 그러니 이번엔 정확히 실패해야 한다.",
    parGhosts: 2,
    parTime: 24,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 234, w: 72, h: 72 },
    cores: [{ x: 724, y: 270 }],
    items: [{ type: "grow", x: 190, y: 398 }, { type: "shrink", x: 190, y: 142 }],
    sizeGates: [{ id: "small-room-5", x: 452, y: 92, w: 42, h: 134, need: "small" }],
    dashGates: [],
    switches: [
      { id: "B", x: 260, y: 416, label: "B+", requires: "big" },
      { id: "C", x: 260, y: 124, label: "C-", requires: "small" },
    ],
    gates: [{ id: "shift-practice", x: 628, y: 84, w: 42, h: 372, needs: ["B", "C"] }],
    lasers: [{ id: "small-route-laser", x1: 506, y1: 84, x2: 506, y2: 250, offWhen: ["C"] }],
    walls: [{ x: 330, y: 70, w: 28, h: 160 }, { x: 330, y: 310, w: 28, h: 160 }],
  },
  {
    name: "잘못된 기록",
    chapter: "ROOM 6",
    tip: "위는 소형, 아래는 중량. 순서가 중요하다.",
    goal: "C-는 소형, B+는 중량 고스트로 유지.",
    clearLine: "지울 수 있다는 건 다시 만들 수 있다는 뜻이다.",
    story: "모든 실패가 도움이 되진 않는다. 하지만 지울 수 있다는 건 다시 만들 수 있다는 뜻이다.",
    parGhosts: 2,
    parTime: 24,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 68, h: 68 },
    cores: [{ x: 742, y: 270 }],
    items: [{ type: "shrink", x: 220, y: 182 }, { type: "grow", x: 220, y: 358 }, { type: "dash", x: 530, y: 270 }],
    sizeGates: [],
    dashGates: [{ id: "boost-shift", x: 772, y: 132, w: 36, h: 276 }],
    switches: [
      { id: "C", x: 220, y: 120, label: "C-", requires: "small" },
      { id: "B", x: 220, y: 420, label: "B+", requires: "big" },
    ],
    gates: [{ id: "shift-gate", x: 650, y: 84, w: 42, h: 372, needs: ["C", "B"] }],
    lasers: [],
    walls: [],
  },
  {
    name: "닫히지 않는 문",
    chapter: "ROOM 7",
    tip: "스위치 둘. 레이저 하나. 빈 손은 없다.",
    goal: "두 스위치를 맞추고, 레이저는 막거나 우회해서 통과.",
    clearLine: "의도되지 않은 경로가 문을 열었다.",
    story: "아카이브가 처음으로 당황했다. “해당 경로는 의도되지 않았습니다.”",
    parGhosts: 3,
    parTime: 30,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 70, h: 70 },
    cores: [{ x: 742, y: 270 }],
    items: [{ type: "dash", x: 475, y: 420 }],
    sizeGates: [],
    dashGates: [{ id: "boost-cross", x: 790, y: 132, w: 36, h: 276 }],
    switches: [
      { id: "A", x: 180, y: 120, label: "A" },
      { id: "B", x: 180, y: 420, label: "B" },
    ],
    gates: [{ id: "cross-gate", x: 665, y: 92, w: 42, h: 356, needs: ["A", "B"] }],
    lasers: [
      { id: "cross-horizontal", x1: 320, y1: 270, x2: 635, y2: 270, blockable: true, requiresBlock: true, recordSpot: { x: 420, y: 228 } },
      { id: "cross-vertical", x1: 508, y1: 92, x2: 508, y2: 448, offWhen: ["A"] },
    ],
    walls: [{ x: 262, y: 70, w: 28, h: 160 }, { x: 262, y: 310, w: 28, h: 160 }],
  },
  {
    name: "방패가 된 기록",
    chapter: "ROOM 8",
    tip: "중량, 소형, 레이저. 세 역할만 맞춰라.",
    goal: "B+와 C-를 맡기고, 레이저는 차단하거나 짧은 틈으로 넘어서라.",
    clearLine: "도망치지 못한 기록이 누군가를 기다리고 있었다.",
    story: "레이저 앞에서 멈춘 과거의 너는 도망치지 못한 게 아니었다. 누군가를 기다리고 있었다.",
    parGhosts: 3,
    parTime: 32,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 234, w: 72, h: 72 },
    cores: [{ x: 746, y: 270 }],
    items: [{ type: "grow", x: 160, y: 392 }, { type: "shrink", x: 235, y: 185 }],
    sizeGates: [],
    dashGates: [],
    switches: [
      { id: "B", x: 160, y: 435, label: "B+", requires: "big" },
      { id: "C", x: 235, y: 270, label: "C-", requires: "small" },
    ],
    gates: [{ id: "break-gate", x: 692, y: 96, w: 44, h: 348, needs: ["B", "C"] }],
    lasers: [{ id: "break-laser", x1: 320, y1: 270, x2: 660, y2: 270, blockable: true, requiresBlock: true, recordSpot: { x: 430, y: 228 } }],
    walls: [{ x: 252, y: 70, w: 28, h: 160 }, { x: 252, y: 310, w: 28, h: 160 }],
  },
  {
    name: "동시에 밟는 마음",
    chapter: "ROOM 9",
    tip: "부스트는 길을 여는 열쇠다.",
    goal: "A를 맡기고, 빔의 틈을 지나 부스트로 관문 파괴.",
    clearLine: "더 빠른 몸보다 남겨둔 내가 필요했다.",
    story: "혼자서는 열 수 없는 문이 있다. 그럴 때 필요한 건 더 빠른 몸이 아니라, 남겨둔 나 자신이다.",
    parGhosts: 2,
    parTime: 30,
    start: { x: 108, y: 410 },
    exit: { x: 842, y: 92, w: 68, h: 70 },
    cores: [{ x: 730, y: 132 }],
    items: [{ type: "dash", x: 500, y: 410 }],
    sizeGates: [],
    dashGates: [{ id: "boost-chain", x: 790, y: 84, w: 36, h: 180 }],
    switches: [{ id: "A", x: 200, y: 112, label: "A" }],
    gates: [{ id: "boost-chain-gate", x: 330, y: 250, w: 42, h: 210, needs: ["A"] }],
    lasers: [{ id: "boost-chain-laser", x1: 450, y1: 232, x2: 690, y2: 232, blockable: true, requiresBlock: true, recordSpot: { x: 560, y: 188 } }],
    walls: [{ x: 258, y: 198, w: 100, h: 28 }, { x: 612, y: 260, w: 28, h: 150 }, { x: 700, y: 180, w: 28, h: 150 }],
  },
  {
    name: "정리된 실패",
    chapter: "ROOM 10",
    tip: "위는 소형, 아래는 중량. 코어는 둘 다 필요하다.",
    goal: "소형과 중량 루트를 각각 기록하고 두 코어 회수.",
    clearLine: "정리되지 않은 기록이 더 많은 길을 남겼다.",
    story: "아카이브가 속삭인다. “불필요한 기록을 삭제하면 더 빨리 나갈 수 있습니다.”",
    parGhosts: 2,
    parTime: 34,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 68, h: 68 },
    cores: [{ x: 724, y: 132 }, { x: 724, y: 410 }],
    items: [{ type: "shrink", x: 250, y: 150 }, { type: "grow", x: 250, y: 390 }],
    sizeGates: [
      { id: "small-compress", x: 515, y: 84, w: 44, h: 140, need: "small" },
      { id: "big-compress", x: 515, y: 316, w: 44, h: 140, need: "big" },
    ],
    switches: [
      { id: "C", x: 360, y: 132, label: "C-", requires: "small" },
      { id: "B", x: 360, y: 410, label: "B+", requires: "big" },
    ],
    gates: [{ id: "compress-gate", x: 650, y: 90, w: 42, h: 360, needs: ["C", "B"] }],
    lasers: [],
    walls: [{ x: 418, y: 250, w: 128, h: 28 }],
  },
  {
    name: "거의 완벽한 루프",
    chapter: "ROOM 11",
    tip: "두 빔 사이의 틈, A 스위치, 마지막은 부스트.",
    goal: "A 스위치를 유지하고, 두 빔 사이의 안전 루트를 찾아라.",
    clearLine: "완벽에 가까워질수록 뒤에 남은 발자국이 보였다.",
    story: "완벽한 기록에 가까워질수록 너는 점점 혼자가 된다.",
    parGhosts: 3,
    parTime: 34,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 68, h: 68 },
    cores: [{ x: 742, y: 270 }],
    items: [{ type: "dash", x: 610, y: 420 }],
    sizeGates: [],
    dashGates: [{ id: "boost-prism", x: 790, y: 120, w: 36, h: 300 }],
    switches: [{ id: "A", x: 190, y: 270, label: "A" }],
    gates: [{ id: "prism-gate", x: 668, y: 80, w: 42, h: 380, needs: ["A"] }],
    lasers: [
      { id: "prism-upper", x1: 320, y1: 170, x2: 620, y2: 170, blockable: true, requiresBlock: true, recordSpot: { x: 440, y: 130 } },
      { id: "prism-lower", x1: 320, y1: 370, x2: 620, y2: 370, blockable: true, requiresBlock: true, recordSpot: { x: 440, y: 410 } },
    ],
    walls: [{ x: 265, y: 92, w: 28, h: 144 }, { x: 265, y: 304, w: 28, h: 144 }, { x: 548, y: 232, w: 118, h: 28 }],
  },
  {
    name: "공식 탈출",
    chapter: "ROOM 12",
    tip: "네 개의 과거가 한 번에 맞아야 끝난다.",
    goal: "A, B+, C-, 부스트 관문을 연결하고 빔은 선택적으로 차단.",
    clearLine: "공식 탈출은 끝이 아니라 삭제 요청이었다.",
    story: "축하합니다. 러너-07은 공식적으로 탈출했습니다. 남은 실패 로그를 삭제하시겠습니까?",
    parGhosts: 4,
    parTime: 42,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 234, w: 72, h: 72 },
    cores: [{ x: 728, y: 132 }, { x: 728, y: 408 }],
    items: [{ type: "grow", x: 160, y: 400 }, { type: "shrink", x: 238, y: 160 }, { type: "dash", x: 590, y: 420 }],
    sizeGates: [],
    dashGates: [{ id: "boost-final", x: 800, y: 84, w: 38, h: 372 }],
    switches: [
      { id: "A", x: 160, y: 100, label: "A" },
      { id: "B", x: 160, y: 440, label: "B+", requires: "big" },
      { id: "C", x: 255, y: 270, label: "C-", requires: "small" },
    ],
    gates: [{ id: "archive-gate", x: 682, y: 88, w: 44, h: 364, needs: ["A", "B", "C"] }],
    lasers: [{ id: "archive-laser", x1: 330, y1: 270, x2: 650, y2: 270, blockable: true, requiresBlock: true, recordSpot: { x: 455, y: 228 } }],
    walls: [{ x: 300, y: 70, w: 28, h: 150 }, { x: 300, y: 320, w: 28, h: 150 }, { x: 550, y: 70, w: 28, h: 150 }, { x: 550, y: 320, w: 28, h: 150 }],
  },
  {
    name: "삭제 보류",
    chapter: "ROOM 13",
    tip: "보라 코어는 잠깐 벽의 충돌을 지운다.",
    goal: "위상 코어를 먹고 보라 막이 돌아오기 전에 통과.",
    clearLine: "러너-07은 출구 앞에서 멈췄다.",
    story: "문 너머보다, 뒤에 남겨둔 발자국이 더 선명했다.",
    parGhosts: 0,
    parTime: 16,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 68, h: 68 },
    cores: [{ x: 724, y: 270 }],
    items: [{ type: "phase", x: 320, y: 270 }],
    phaseGates: [{ id: "phase-intro", x: 558, y: 92, w: 42, h: 356 }],
    sizeGates: [],
    dashGates: [],
    switches: [],
    gates: [],
    lasers: [],
    walls: [{ x: 250, y: 86, w: 28, h: 138 }, { x: 250, y: 316, w: 28, h: 138 }],
  },
  {
    name: "비인가 기억",
    chapter: "ROOM 14",
    tip: "A를 맡기고, 위상 코어로 두 번째 잠금을 지나라.",
    goal: "스위치 고스트와 위상 통과를 한 루트에 연결.",
    clearLine: "기록에 없는 방이 대답 대신 열렸다.",
    story: "기록에 없는 방입니다. 즉시 복귀하세요. 러너-07은 대답하지 않았다. 대신 달렸다.",
    parGhosts: 1,
    parTime: 22,
    start: { x: 108, y: 390 },
    exit: { x: 842, y: 118, w: 68, h: 68 },
    cores: [{ x: 738, y: 132 }],
    items: [{ type: "phase", x: 540, y: 390 }],
    phaseGates: [{ id: "phase-key", x: 682, y: 82, w: 42, h: 210 }],
    sizeGates: [],
    dashGates: [],
    switches: [{ id: "A", x: 224, y: 118, label: "A" }],
    gates: [{ id: "echo-key", x: 430, y: 236, w: 42, h: 220, needs: ["A"] }],
    lasers: [],
    walls: [{ x: 300, y: 186, w: 260, h: 28 }, { x: 560, y: 306, w: 28, h: 132 }],
  },
  {
    name: "망가진 동기화",
    chapter: "ROOM 15",
    tip: "C-와 B+를 맡긴 뒤, 위상으로 중앙 봉인을 지나라.",
    goal: "소형/중량 고스트가 연 길을 위상 코어로 마무리.",
    clearLine: "흔들리는 잔상들이 다시 이름을 찾았다.",
    story: "잔상들이 흔들리기 시작했다. 너무 오래 버려진 실패는 자신이 누구였는지도 잊는다.",
    parGhosts: 2,
    parTime: 28,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 68, h: 68 },
    cores: [{ x: 736, y: 270 }],
    items: [{ type: "shrink", x: 210, y: 132 }, { type: "grow", x: 210, y: 408 }, { type: "phase", x: 514, y: 270 }],
    phaseGates: [{ id: "phase-scale", x: 704, y: 122, w: 42, h: 296 }],
    sizeGates: [
      { id: "small-scale", x: 384, y: 84, w: 42, h: 142, need: "small" },
      { id: "big-scale", x: 384, y: 314, w: 42, h: 142, need: "big" },
    ],
    dashGates: [],
    switches: [
      { id: "C", x: 274, y: 124, label: "C-", requires: "small" },
      { id: "B", x: 274, y: 416, label: "B+", requires: "big" },
    ],
    gates: [{ id: "scale-lock", x: 608, y: 84, w: 42, h: 372, needs: ["C", "B"] }],
    lasers: [],
    walls: [{ x: 478, y: 250, w: 126, h: 28 }],
  },
  {
    name: "나를 구하는 나",
    chapter: "ROOM 16",
    tip: "위상으로 들어가고, 고스트로 빔을 끊고, 부스트로 나가라.",
    goal: "위상막과 부스트 장벽을 잇고, 빔은 타이밍으로 넘거나 차단.",
    clearLine: "이번에는 현재가 잔상을 버리지 않았다.",
    story: "이번에는 네가 잔상을 이용하는 게 아니다. 네가 잔상을 구해야 한다.",
    parGhosts: 1,
    parTime: 30,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 68, h: 68 },
    cores: [{ x: 722, y: 270 }],
    items: [{ type: "phase", x: 242, y: 270 }, { type: "dash", x: 616, y: 410 }],
    phaseGates: [{ id: "phase-spectrum", x: 356, y: 84, w: 42, h: 372 }],
    sizeGates: [],
    dashGates: [{ id: "boost-spectrum", x: 786, y: 132, w: 38, h: 276 }],
    switches: [],
    gates: [],
    lasers: [{ id: "spectrum-beam", x1: 430, y1: 270, x2: 690, y2: 270, blockable: true, requiresBlock: true, recordSpot: { x: 520, y: 226 } }],
    walls: [{ x: 258, y: 86, w: 28, h: 128 }, { x: 258, y: 326, w: 28, h: 128 }, { x: 570, y: 298, w: 28, h: 120 }],
  },
  {
    name: "삭제실",
    chapter: "ROOM 17",
    tip: "두 스위치를 맡기고 빔을 넘은 뒤 E로 마지막 장벽을 연다.",
    goal: "A, B와 싱크 대시를 연결하고, 빔은 안전 루트로 처리.",
    clearLine: "삭제 대기 로그가 처음으로 문을 거부했다.",
    story: "이곳에서 실패는 압축되고, 정리되고, 없었던 일이 된다. 러너-07은 처음으로 화가 났다.",
    parGhosts: 3,
    parTime: 36,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 70, h: 70 },
    cores: [{ x: 742, y: 270 }],
    items: [],
    phaseGates: [],
    sizeGates: [],
    dashGates: [{ id: "sync-relay", x: 790, y: 132, w: 36, h: 276, syncOnly: true }],
    switches: [
      { id: "A", x: 182, y: 116, label: "A" },
      { id: "B", x: 182, y: 424, label: "B" },
    ],
    gates: [{ id: "relay-gate", x: 650, y: 84, w: 42, h: 372, needs: ["A", "B"] }],
    lasers: [{ id: "relay-beam", x1: 330, y1: 270, x2: 620, y2: 270, blockable: true, requiresBlock: true, recordSpot: { x: 450, y: 226 } }],
    walls: [{ x: 270, y: 70, w: 28, h: 156 }, { x: 270, y: 314, w: 28, h: 156 }, { x: 520, y: 70, w: 28, h: 132 }, { x: 520, y: 338, w: 28, h: 132 }],
  },
  {
    name: "마지막 싱크",
    chapter: "ROOM 18",
    tip: "작게 위, 크게 아래. 둘 다 챙긴 뒤 위상으로 합류.",
    goal: "두 형태로 두 코어를 회수하고 위상막을 지나 출구로.",
    clearLine: "모든 잔상이 같은 방향으로 달렸다.",
    story: "누군가는 스위치를 밟고, 누군가는 레이저 앞에 서고, 누군가는 문 앞에서 기다렸다.",
    parGhosts: 2,
    parTime: 38,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 68, h: 68 },
    cores: [{ x: 720, y: 132 }, { x: 720, y: 408 }],
    items: [{ type: "shrink", x: 220, y: 150 }, { type: "grow", x: 220, y: 390 }, { type: "phase", x: 540, y: 270 }],
    phaseGates: [{ id: "phase-fork", x: 780, y: 84, w: 42, h: 372 }],
    sizeGates: [
      { id: "small-fork", x: 430, y: 84, w: 44, h: 140, need: "small" },
      { id: "big-fork", x: 430, y: 316, w: 44, h: 140, need: "big" },
    ],
    dashGates: [],
    switches: [
      { id: "C", x: 310, y: 132, label: "C-", requires: "small" },
      { id: "B", x: 310, y: 408, label: "B+", requires: "big" },
    ],
    gates: [{ id: "fork-lock", x: 630, y: 84, w: 42, h: 372, needs: ["C", "B"] }],
    lasers: [],
    walls: [{ x: 520, y: 250, w: 100, h: 28 }],
  },
  {
    name: "0번째 기록",
    chapter: "ROOM 19",
    tip: "A, B+, C-. 마지막은 위상과 부스트를 이어라.",
    goal: "네 역할을 고스트에게 맡기고 현재는 위상-부스트 루트를 수행.",
    clearLine: "아무것도 열지 못한 기록이 포기하지 않았다는 증거가 되었다.",
    story: "가장 처음의 실패가 남아 있었다. 아무것도 열지 못하고, 아무것도 막지 못했지만, 처음으로 포기하지 않았던 기록이었다.",
    parGhosts: 4,
    parTime: 48,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 236, w: 70, h: 70 },
    cores: [{ x: 722, y: 132 }, { x: 722, y: 408 }],
    items: [{ type: "grow", x: 164, y: 420 }, { type: "shrink", x: 244, y: 162 }, { type: "phase", x: 520, y: 270 }, { type: "dash", x: 612, y: 420 }],
    phaseGates: [{ id: "phase-merge", x: 596, y: 84, w: 42, h: 372 }],
    sizeGates: [],
    dashGates: [{ id: "boost-merge", x: 790, y: 120, w: 38, h: 300 }],
    switches: [
      { id: "A", x: 164, y: 96, label: "A" },
      { id: "B", x: 164, y: 444, label: "B+", requires: "big" },
      { id: "C", x: 258, y: 270, label: "C-", requires: "small" },
    ],
    gates: [{ id: "merge-lock", x: 678, y: 84, w: 42, h: 372, needs: ["A", "B", "C"] }],
    lasers: [{ id: "merge-beam", x1: 330, y1: 270, x2: 568, y2: 270, blockable: true, requiresBlock: true, recordSpot: { x: 450, y: 226 } }],
    walls: [{ x: 306, y: 70, w: 28, h: 150 }, { x: 306, y: 320, w: 28, h: 150 }, { x: 470, y: 70, w: 28, h: 124 }, { x: 470, y: 346, w: 28, h: 124 }],
  },
  {
    name: "진짜 문",
    chapter: "ROOM 20",
    tip: "네 역할을 완성하고, 위상 후 E 싱크 대시로 루프를 끊어라.",
    goal: "A, B+, C-, 두 코어, 위상, 싱크 대시를 완성하고 빔을 넘어서라.",
    clearLine: "러너-07은 실패한 자신들을 데리고 마침내 밖으로 나갔다.",
    story: "20번째 문은 탈출구가 아니었다. 그것은 삭제된 나를 다시 데려가는 문이었다.",
    parGhosts: 4,
    parTime: 56,
    start: { x: 108, y: 270 },
    exit: { x: 842, y: 234, w: 72, h: 72 },
    cores: [{ x: 724, y: 132 }, { x: 724, y: 408 }],
    items: [{ type: "grow", x: 160, y: 402 }, { type: "shrink", x: 238, y: 158 }, { type: "phase", x: 536, y: 270 }],
    phaseGates: [{ id: "phase-memory", x: 604, y: 84, w: 42, h: 372 }],
    sizeGates: [
      { id: "small-memory", x: 396, y: 84, w: 42, h: 134, need: "small" },
      { id: "big-memory", x: 396, y: 322, w: 42, h: 134, need: "big" },
    ],
    dashGates: [{ id: "sync-memory", x: 794, y: 84, w: 38, h: 372, syncOnly: true }],
    switches: [
      { id: "A", x: 160, y: 96, label: "A" },
      { id: "B", x: 160, y: 444, label: "B+", requires: "big" },
      { id: "C", x: 262, y: 270, label: "C-", requires: "small" },
    ],
    gates: [{ id: "memory-lock", x: 674, y: 84, w: 42, h: 372, needs: ["A", "B", "C"] }],
    lasers: [{ id: "memory-beam", x1: 322, y1: 270, x2: 578, y2: 270, blockable: true, requiresBlock: true, recordSpot: { x: 458, y: 226 } }],
    walls: [{ x: 300, y: 70, w: 28, h: 150 }, { x: 300, y: 320, w: 28, h: 150 }, { x: 508, y: 70, w: 28, h: 132 }, { x: 508, y: 338, w: 28, h: 132 }],
  },
];

const roomPalettes = [
  ["#6458d6", "#987bed", "#ff8bc7", "#1edcc5"],
  ["#5269ce", "#776be9", "#a86bdf", "#ffd166"],
  ["#3f67b8", "#815bd7", "#e37bbf", "#1edcc5"],
  ["#35245f", "#6d5ad4", "#ce73d9", "#ff5ba8"],
  ["#2c235e", "#5e3fb7", "#1ea6bc", "#ffd166"],
  ["#345d9d", "#765bd7", "#ec8bb7", "#6fcaff"],
  ["#271f5d", "#5c4bbd", "#18a2ad", "#1edcc5"],
  ["#1a143f", "#562b8b", "#de5ea5", "#ffd166"],
];

const officialEndingText = [
  "공식 탈출 완료.",
  "",
  "러너-07은 아카이브를 빠져나왔다.",
  "기록은 정리되었고, 실패 로그는 삭제되었다.",
  "",
  "결과는 완벽했다. 오류는 없었다.",
  "그런데 러너-07은 왜 마지막 문 앞에서 멈췄는지 끝내 기억하지 못했다.",
].join("\n");

const trueEndingText = [
  "진짜 탈출 완료.",
  "",
  "문이 열렸다. 러너-07은 밖으로 나가지 않고 먼저 뒤를 돌아보았다.",
  "스위치를 밟고 있던 자신, 빛 앞에 서 있던 자신, 늦고 잘못 달렸던 자신들.",
  "",
  "아카이브는 그것들을 실패라고 불렀다.",
  "러너-07은 말했다. “아니. 전부 나야.”",
  "",
  "실패는 리셋되지 않았다. 기록되었다. 그리고 길이 되었다.",
].join("\n");

const clearFlavorLines = [
  "이번 실패는 쓸모 있었다.",
  "과거의 네가 문을 열었다.",
  "좋은 기록은 완벽한 기록이 아니다. 다음 너를 돕는 기록이다.",
  "실패 로그가 장비로 변환되었습니다.",
  "잔상 동기화 성공. 너는 혼자가 아니다.",
  "삭제하지 않은 실패가 이번 방의 열쇠가 되었습니다.",
];

const mechanicIntros = new Map([
  [0, { title: "첫 기록", body: "스위치 위에서 R. 실패한 루프가 다음 문을 연다." }],
  [1, { title: "방패 잔상", body: "빔 앞에 멈춘 기록은 다음 루프의 보호막이 된다." }],
  [2, { title: "대시 연결", body: "A를 맡긴 고스트가 문을 열면 현재의 나는 부스트로 통과한다." }],
  [3, { title: "싱크", body: "고스트 곁에서 E. 다음 Space가 장벽을 끊는 대시가 된다." }],
  [4, { title: "형태 기록", body: "B+는 중량, C-는 소형. 몸을 바꾼 실패도 그대로 남는다." }],
  [12, { title: "위상 코어", body: "보라 코어는 잠깐 벽의 충돌을 지운다. 멈추지 말고 지나가라." }],
]);

const stageStoryTags = [
  "실패가 문을 잡는다",
  "멈춘 기록이 방패가 된다",
  "열린 길을 대시로 잇는다",
  "고스트 곁에서 싱크",
  "몸을 바꾼 실패",
  "잘못된 기록을 다시 설계",
  "의도되지 않은 경로",
  "방패가 된 기록",
  "혼자 열 수 없는 문",
  "삭제 권유를 거절",
  "완벽할수록 외로워진다",
  "공식 탈출과 삭제 요청",
  "출구 앞에서 멈춤",
  "기록에 없는 방",
  "흔들리는 잔상",
  "잔상을 구하는 현재",
  "삭제실 통과",
  "마지막 싱크",
  "0번째 기록",
  "삭제된 나를 데려간다",
];

const roomMemoryAnchors = [
  "첫 실패가 다음 문을 잡아준다.",
  "멈춘 기록이 빛 앞에서 방패가 된다.",
  "맡긴 스위치와 현재의 대시가 한 길로 이어진다.",
  "고스트 곁에서 맞춘 박자가 장벽을 끊는다.",
  "바꾼 몸도 실패의 일부로 남는다.",
  "삭제는 포기가 아니라 다시 만드는 권한이다.",
  "아카이브가 의도하지 않은 길을 처음 본다.",
  "도망치지 못한 기록이 현재를 기다린다.",
  "혼자가 아니라서 동시에 열 수 있다.",
  "정리되지 않은 실패가 더 많은 길을 남긴다.",
  "완벽한 기록보다 뒤에 남은 발자국이 중요해진다.",
  "공식 탈출은 끝이 아니라 삭제 요청이다.",
  "러너-07은 출구 앞에서 뒤를 돌아본다.",
  "기록에 없는 방은 대답 대신 열린다.",
  "오래 버려진 잔상이 다시 이름을 찾는다.",
  "이번에는 현재가 잔상을 구한다.",
  "삭제 대기 로그가 문을 거부한다.",
  "모든 잔상이 같은 방향으로 달린다.",
  "아무것도 못 연 실패가 포기하지 않았다는 증거가 된다.",
  "20번째 문은 삭제된 나를 다시 데려가는 문이다.",
];

const state = {
  screen: "menu",
  introIndex: 0,
  stageFilter: "all",
  roomIndex: 0,
  replayTime: 0,
  stageTime: 0,
  stageStarted: false,
  loopNumber: 1,
  echoes: [],
  recording: [],
  sampleTimer: 0,
  stageTrace: [],
  traceSampleTimer: 0,
  bestRoute: null,
  collected: new Set(),
  itemsCollected: new Set(),
  itemMode: "normal",
  playerScale: 1,
  echoLocks: new Set(),
  echoPower: 0,
  conditionMarks: new Set(),
  flowCombo: 0,
  flowTimer: 0,
  flowBonus: 0,
  lastFlowBonus: 0,
  campaignActive: false,
  campaignTime: 0,
  campaignNextRoom: 0,
  campaignOfficialTime: null,
  progress: null,
  lastStageResult: null,
  player: null,
  dash: 0,
  dashCooldown: 0,
  dashBuffer: 0,
  dashCharge: false,
  phaseTimer: 0,
  syncCooldown: 0,
  syncPulse: 0,
  syncRush: 0,
  syncCount: 0,
  powerDash: 0,
  boostBreaks: 0,
  dashX: 1,
  dashY: 0,
  lastX: 1,
  lastY: 0,
  particles: [],
  texts: [],
  toastTimer: 0,
  failFlash: 0,
  screenShake: 0,
  crashTimer: 0,
  crashInfo: null,
  brokenDashGates: new Set(),
  hintCooldown: 0,
  roomIntroTimer: 0,
  roomIntroShown: false,
  doorWasOpen: false,
  syncWasShown: false,
};

const PROGRESS_KEY = "rewind-runner-progress-v3";

function createEmptyProgress() {
  return {
    unlocked: 0,
    stages: rooms.map(() => ({ bestTime: null, bestStars: 0, bestGhosts: null, bestMedal: "none", bestRoute: null })),
  };
}

function readProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw);
    const base = createEmptyProgress();
    base.unlocked = clamp(Number(parsed.unlocked) || 0, 0, rooms.length - 1);
    for (let i = 0; i < rooms.length; i += 1) {
      base.stages[i] = { ...base.stages[i], ...(parsed.stages?.[i] ?? {}) };
    }
    return base;
  } catch {
    return createEmptyProgress();
  }
}

function writeProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
  } catch {
    // Optional in local judging environments.
  }
}

state.progress = readProgress();

function renderIntro() {
  const slide = introSlides[state.introIndex];
  introKicker.textContent = slide.kicker;
  introTitle.textContent = slide.title;
  introBody.textContent = slide.body;
  introFallback.dataset.kind = slide.fallback;
  introFallback.textContent = slide.type === "story" ? "기록 화면" : "조작 안내";
  introFallback.classList.remove("is-hidden");
  introImage.hidden = true;

  introImage.onload = () => {
    introImage.hidden = false;
    introFallback.classList.add("is-hidden");
  };
  introImage.onerror = () => {
    introImage.hidden = true;
    introFallback.classList.remove("is-hidden");
  };
  introImage.alt = slide.title;
  introImage.src = slide.image;

  introDots.innerHTML = introSlides
    .map((item, index) => {
      const classes = [
        index === state.introIndex ? "is-active" : "",
        item.type === "tutorial" ? "is-tutorial" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<i class="${classes}"></i>`;
    })
    .join("");

  introBackButton.disabled = state.introIndex === 0;
  startButton.textContent = state.introIndex === introSlides.length - 1 ? "탈출 시작" : "다음";
}

function advanceIntro() {
  if (state.introIndex < introSlides.length - 1) {
    state.introIndex += 1;
    renderIntro();
    return;
  }
  startGame(0);
}

function retreatIntro() {
  if (state.introIndex <= 0) return;
  state.introIndex -= 1;
  renderIntro();
}

function showPanel(panel) {
  menuPanel.classList.toggle("is-hidden", panel !== "menu");
  stagePanel.classList.toggle("is-hidden", panel !== "stage");
  introPanel.classList.toggle("is-hidden", panel !== "intro");
}

function showMenu() {
  state.screen = "menu";
  startOverlay.classList.add("is-visible");
  endOverlay.classList.remove("is-visible");
  pauseOverlay.classList.remove("is-visible");
  showPanel("menu");
  renderMenu();
  draw();
}

function renderMenu() {
  const nextRoom = clamp(state.progress.unlocked, 0, rooms.length - 1);
  const clearedAny = state.progress.stages.some((stage) => stage.bestStars > 0);
  continueButton.textContent = clearedAny ? `방 ${nextRoom + 1} 이어하기` : "시작하기";
}

function showIntro() {
  state.screen = "intro";
  state.introIndex = 0;
  startOverlay.classList.add("is-visible");
  endOverlay.classList.remove("is-visible");
  pauseOverlay.classList.remove("is-visible");
  showPanel("intro");
  renderIntro();
}

function showStageSelect() {
  state.screen = "stage-select";
  startOverlay.classList.add("is-visible");
  endOverlay.classList.remove("is-visible");
  pauseOverlay.classList.remove("is-visible");
  showPanel("stage");
  renderStageSelect();
}

function renderStageSelect() {
  if (stageRouteTabs) {
    stageRouteTabs.querySelectorAll("[data-stage-filter]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.stageFilter === state.stageFilter);
    });
  }
  if (stagePanel) stagePanel.dataset.filter = state.stageFilter;
  if (stageSummary) {
    const officialPar = campaignParTime(JUDGE_CLEAR_INDEX + 1);
    const officialBest = bestCampaignTime(JUDGE_CLEAR_INDEX + 1);
    stageSummary.innerHTML = `
      <span><strong>공식 기준</strong>${formatClock(officialPar)} / ${formatClock(OFFICIAL_TARGET_SECONDS)}</span>
      <span><strong>20방 기준</strong>${formatClock(campaignParTime())} / ${formatClock(OFFICIAL_TARGET_SECONDS)}</span>
      <span><strong>내 공식 최고</strong>${officialBest == null ? "--" : formatPrecise(officialBest)}</span>
    `;
  }
  const visibleRooms = rooms
    .map((room, index) => ({ room, index, record: state.progress.stages[index] ?? {} }))
    .filter(({ index, record }) => isStageVisible(index, record));

  stageGrid.innerHTML = visibleRooms.length
    ? visibleRooms
    .map(({ room, index, record }) => {
      const ahead = index > state.progress.unlocked;
      const stars = "★".repeat(record.bestStars || 0).padEnd(3, "☆");
      const best = record.bestTime ? formatPrecise(record.bestTime) : "--";
      const designer = designerTime(room);
      const platinumDone = record.bestMedal === "platinum";
      const designerText = record.bestStars >= 3 ? `플래티넘 ${formatPrecise(designer)}` : "3★ 후 플래티넘";
      const challengeLabel = platinumDone ? "플래티넘 달성" : record.bestStars >= 3 ? "플래티넘 도전" : ahead ? "심사용 개방" : "첫 도전";
      const challengeClass = platinumDone ? "is-platinum" : record.bestStars >= 3 ? "is-available" : "is-none";
      const routeLabel = index <= JUDGE_CLEAR_INDEX ? "공식 루트" : "고급 아카이브";
      const pbText = record.bestRoute?.length ? `<em>PB 페이스</em>` : "";
      const routeClass = index <= JUDGE_CLEAR_INDEX ? "is-official-route" : "is-hidden-route";
      const mechanics = roomMechanicTags(room, index)
        .map((tag) => `<i><img src="${tag.asset}" alt="" />${tag.label}</i>`)
        .join("");
      return `
        <button class="stage-card ${routeClass}" data-stage="${index}" type="button">
          <span class="stage-number">${index + 1}</span>
          <span class="stage-copy">
            <small>${index <= JUDGE_CLEAR_INDEX ? "공식" : "비인가"} · 방 ${index + 1}</small>
            <strong>${room.name}</strong>
          </span>
          <span class="route-pill">${routeLabel}</span>
          <span class="mechanic-row">${mechanics}</span>
          <span class="story-pill">${stageStoryTag(index)}</span>
          <span class="stage-targets"><em>3★ ${room.parGhosts}잔상 / ${room.parTime}초</em><em>최고 ${best}</em></span>
          <span class="stage-targets"><em>${designerText}</em>${pbText}</span>
          <span class="stars">${stars}</span>
          <span class="medal-pill ${challengeClass}">${challengeLabel}</span>
        </button>
      `;
    })
    .join("")
    : `<div class="stage-empty"><strong>아직 기록이 없습니다.</strong><span>공식 루트에서 한 방을 클리어하면 기록 경쟁 목록에 표시됩니다.</span></div>`;
}

function isStageVisible(index, record) {
  if (state.stageFilter === "official") return index <= JUDGE_CLEAR_INDEX;
  if (state.stageFilter === "hidden") return index > JUDGE_CLEAR_INDEX;
  if (state.stageFilter === "records") return record.bestStars > 0 || index < 4;
  return true;
}

function roomMechanicTags(room, index) {
  const tags = [];
  if (room.switches.length) tags.push({ label: "스위치", asset: generatedAssets.switch });
  if (room.lasers.length) tags.push({ label: "빔", asset: generatedAssets.laser });
  if ((room.dashGates ?? []).length || room.items?.some((item) => item.type === "dash")) {
    tags.push({ label: "대시", asset: generatedAssets.boost });
  }
  if (room.items?.some((item) => item.type === "grow" || item.type === "shrink") || room.sizeGates?.length) {
    tags.push({ label: "변형", asset: generatedAssets.record });
  }
  if ((room.phaseGates ?? []).length || room.items?.some((item) => item.type === "phase")) {
    tags.push({ label: "위상", asset: generatedAssets.laserOpen });
  }
  if ((room.dashGates ?? []).some((gate) => gate.syncOnly)) tags.push({ label: "싱크", asset: generatedAssets.record });
  if (index === JUDGE_CLEAR_INDEX) tags.push({ label: "공식", asset: generatedAssets.trophy });
  if (index === rooms.length - 1) tags.push({ label: "진짜 문", asset: generatedAssets.exit });
  if (!tags.length) tags.push({ label: "코어", asset: generatedAssets.core });
  return tags.slice(0, 4);
}

function stageStoryTag(index) {
  return stageStoryTags[index] ?? "실패를 설계하는 방";
}

function roomMemoryAnchor(index = state.roomIndex) {
  return roomMemoryAnchors[index] ?? "실패는 삭제되지 않고 길이 된다.";
}

function startGame(index = 0, options = {}) {
  const preserveCampaign = Boolean(options.preserveCampaign);
  if (!preserveCampaign) {
    state.campaignActive = index === 0;
    state.campaignTime = 0;
    state.campaignNextRoom = index === 0 ? 0 : -1;
    state.campaignOfficialTime = null;
  }
  state.screen = "game";
  state.roomIndex = index;
  state.loopNumber = 1;
  startRoom(index);
  lastTime = performance.now();
  keys.clear();
  startOverlay.classList.remove("is-visible");
  endOverlay.classList.remove("is-visible");
  pauseOverlay.classList.remove("is-visible");
  const intro = mechanicIntros.get(index);
  if (intro) showToast(intro.title, intro.body);
  else if (isTutorialRoom()) showToast(`방 ${index + 1}`, rooms[index].tip);
  focusGameCanvas();
}

function pauseGame() {
  if (state.screen !== "game" || state.crashTimer > 0) return;
  state.screen = "paused";
  pauseOverlay.classList.add("is-visible");
  keys.clear();
  state.dashBuffer = 0;
  playSfx("pause");
}

function resumeGame() {
  if (state.screen !== "paused") return;
  state.screen = "game";
  pauseOverlay.classList.remove("is-visible");
  focusGameCanvas();
  lastTime = performance.now();
  playSfx("resume");
}

function startRoom(index) {
  const room = rooms[index];
  lastTime = performance.now();
  state.roomIndex = index;
  state.replayTime = 0;
  state.stageTime = 0;
  state.stageStarted = false;
  state.loopNumber = 1;
  state.echoes = [];
  state.recording = [];
  state.sampleTimer = 0;
  state.stageTrace = [];
  state.traceSampleTimer = 0;
  state.bestRoute = bestRouteFor(index);
  state.collected = new Set();
  state.itemsCollected = new Set();
  state.itemMode = "normal";
  state.playerScale = 1;
  state.echoLocks = new Set();
  state.echoPower = 0;
  state.conditionMarks = new Set();
  state.flowCombo = 0;
  state.flowTimer = 0;
  state.flowBonus = 0;
  state.lastFlowBonus = 0;
  state.particles = [];
  state.texts = [];
  state.failFlash = 0;
  state.screenShake = 0;
  state.crashTimer = 0;
  state.crashInfo = null;
  state.hintCooldown = 0;
  state.roomIntroTimer = 2.3;
  state.roomIntroShown = true;
  state.doorWasOpen = false;
  state.syncWasShown = false;
  state.dashCharge = false;
  state.phaseTimer = 0;
  state.syncCooldown = 0;
  state.syncPulse = 0;
  state.syncRush = 0;
  state.syncCount = 0;
  state.powerDash = 0;
  state.boostBreaks = 0;
  state.brokenDashGates = new Set();
  state.player = {
    x: room.start.x,
    y: room.start.y,
    px: room.start.x,
    py: room.start.y,
    speed: BASE_SPEED,
    facingX: 1,
    facingY: 0,
    scale: 1,
  };
  state.dash = 0;
  state.dashCooldown = 0;
  state.dashBuffer = 0;
  pushStageTrace(true);
  updateHud();
  if (sidePanel) sidePanel.scrollTop = 0;
}

function isTutorialRoom() {
  return state.roomIndex === 0;
}

function hasCanvasGuidance() {
  return state.roomIndex < CANVAS_GUIDE_ROOMS;
}

function restartLoop(saveEcho = true, reason = "RECORD") {
  if (saveEcho && state.echoes.length >= MAX_GHOSTS) {
    showToast("고스트가 가득 찼다", hasCanvasGuidance() ? "Z로 마지막 기록 삭제." : "");
    return;
  }

  if (saveEcho && state.recording.length > 4 && recordingDistance(state.recording) > 18) {
    const snap = recordSnapPoint();
    if (!snap) {
      showToast("기록 불가", hasCanvasGuidance() ? "스위치 근처에서 R. 레이저는 선택." : "");
      playSfx("deny");
      return;
    }
    const samples = buildEchoSamples(snap);
    const echo = {
      id: state.echoes.length + 1,
      color: echoColor(state.echoes.length),
      samples,
      room: state.roomIndex,
    };
    state.echoes.push(echo);
    state.echoPower = Math.min(6, state.echoPower + 1);
    const firstArchiveLog = state.roomIndex === 0 && echo.id === 1;
    const role = describeEchoRole(echo);
    const equipment = echoEquipmentCopy(role);
    showToast(
      firstArchiveLog ? "실패 로그 저장" : equipment.title,
      firstArchiveLog ? "이전의 너는 사라지지 않는다. 방금 기록이 다음 문을 연다." : equipment.body,
    );
    playSfx("record");
    floating(`G${echo.id} · ${compactEchoRole(role)}`, state.player.x, state.player.y - 48, echo.color);
    burst(state.player.x, state.player.y, echo.color, 34);
    sparkleEchoRoute(samples, echo.color);
    state.screenShake = 0.1;
  } else if (saveEcho) {
    showToast("기록할 움직임이 없다", hasCanvasGuidance() ? "조금 움직인 뒤 R." : "");
    return;
  }
  const room = rooms[state.roomIndex];
  state.replayTime = 0;
  state.loopNumber += 1;
  state.recording = [];
  state.sampleTimer = 0;
  state.itemsCollected = new Set();
  state.itemMode = "normal";
  state.playerScale = 1;
  state.dashCharge = false;
  state.phaseTimer = 0;
  state.syncCooldown = 0;
  state.syncPulse = 0;
  state.syncRush = 0;
  state.powerDash = 0;
  state.brokenDashGates = new Set();
  state.player.x = room.start.x;
  state.player.y = room.start.y;
  state.player.px = room.start.x;
  state.player.py = room.start.y;
  state.player.scale = 1;
  state.dash = 0;
  state.dashCooldown = Math.min(state.dashCooldown, 0.2);
  state.dashBuffer = 0;
  pushStageTrace(true);
  state.failFlash = reason === "CRASH" ? 0.45 : 0;
  updateHud();
}

function recordSnapPoint() {
  const room = rooms[state.roomIndex];
  const heldByEcho = echoHeldSwitches(room);
  for (const sw of room.switches) {
    if (heldByEcho.has(sw.id)) continue;
    if (distance(state.player, sw) < 105 && actorCanPress(state.player, sw)) return { x: sw.x, y: sw.y };
  }
  for (const laser of room.lasers) {
    if (!laser.blockable || !laserPowered(laser) || laserBlocker(laser)) continue;
    const spot = laserRecordSpot(laser);
    if (distance(state.player, spot) < 132 || pointLineDistance(state.player.x, state.player.y, laser.x1, laser.y1, laser.x2, laser.y2) < 56) {
      return spot;
    }
  }
  return null;
}

function echoHeldSwitches(room = rooms[state.roomIndex]) {
  const held = new Set();
  const radius = 74 + state.echoPower * 3;
  for (const sw of room.switches) {
    for (const echo of state.echoes) {
      const last = echo.samples.at(-1);
      if (last && distance(last, sw) < radius && actorCanPress(last, sw)) {
        held.add(sw.id);
        break;
      }
    }
  }
  return held;
}

function buildEchoSamples(snap) {
  const source = state.recording.length
    ? state.recording.slice()
    : [{
      t: state.replayTime,
      x: state.player.x,
      y: state.player.y,
      facingX: state.player.facingX,
      facingY: state.player.facingY,
      dash: state.dash > 0,
      scale: state.playerScale,
    }];

  source.push({
    t: state.replayTime,
    x: snap.x,
    y: snap.y,
    facingX: state.player.facingX,
    facingY: state.player.facingY,
    dash: state.dash > 0,
    scale: state.playerScale,
  });

  const start = source[0];
  let startIndex = 0;
  for (let i = 1; i < source.length; i += 1) {
    const sample = source[i];
    const moved = distance(sample, start) > 8;
    const transformed = Math.abs((sample.scale ?? 1) - (start.scale ?? 1)) > 0.03;
    if (moved || transformed || sample.dash) {
      startIndex = Math.max(0, i - 1);
      break;
    }
  }

  let endIndex = source.length - 1;
  for (let i = startIndex; i < source.length; i += 1) {
    if (distance(source[i], snap) < 32) {
      endIndex = i;
      break;
    }
  }

  const baseT = source[startIndex].t;
  const samples = source.slice(startIndex, endIndex + 1).map((sample) => ({
    ...sample,
    t: Math.max(0, sample.t - baseT),
  }));
  samples[0].t = 0;

  const last = samples.at(-1);
  if (!last || distance(last, snap) > 3) {
    samples.push({
      t: (last?.t ?? 0) + 0.03,
      x: snap.x,
      y: snap.y,
      facingX: state.player.facingX,
      facingY: state.player.facingY,
      dash: state.dash > 0,
      scale: state.playerScale,
    });
  } else {
    last.x = snap.x;
    last.y = snap.y;
    last.scale = state.playerScale;
    last.facingX = state.player.facingX;
    last.facingY = state.player.facingY;
  }

  return samples;
}

function recordingDistance(samples) {
  let total = 0;
  for (let i = 1; i < samples.length; i += 1) {
    total += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
  }
  return total;
}

function finishRoom() {
  finishStage();
}

function finishStage() {
  const room = rooms[state.roomIndex];
  pushStageTrace(false);
  const result = calculateStageResult(room);
  state.lastStageResult = result;
  saveStageResult(state.roomIndex, result);
  updateCampaignRun(result);
  state.screenShake = 0;
  state.failFlash = 0;
  state.syncPulse = 0;
  state.screen = "stage-result";
  endOverlay.classList.add("is-visible");
  const finalRoom = state.roomIndex === rooms.length - 1;
  const judgeClear = state.roomIndex === JUDGE_CLEAR_INDEX;
  endOverlay.dataset.ending = finalRoom ? "true" : judgeClear ? "official" : "stage";
  resultKicker.textContent = `방 ${state.roomIndex + 1}`;
  resultTitle.textContent = finalRoom
    ? "진짜 탈출 완료"
    : judgeClear
      ? "공식 탈출 완료"
    : result.designerClear
      ? "디자이너 런"
      : result.stars >= 3
        ? "퍼펙트 런"
        : "클리어";
  resultBody.textContent = finalRoom
    ? trueEndingText
    : judgeClear
      ? officialEndingText
    : result.designerClear
      ? "이 방의 숨은 기록까지 깼다."
      : result.stars >= 3
      ? room.clearLine
      : result.misses[0] ?? room.clearLine;
  if (resultMascot) resultMascot.src = generatedAssets.mascotClear;
  if (resultBadge) resultBadge.src = finalRoom || judgeClear ? generatedAssets.trophy : generatedAssets.clear;
  finalStars.textContent = "★".repeat(result.stars).padEnd(3, "☆");
  finalLoops.textContent = String(state.loopNumber);
  finalEchoes.textContent = `${result.ghosts} / ${room.parGhosts}`;
  finalTime.textContent = formatPrecise(result.time);
  renderLoopReplay(result, room, finalRoom, judgeClear);
  if (resultInsight) resultInsight.innerHTML = renderResultInsight(result, room, finalRoom, judgeClear);
  const enterLabel = finalRoom ? "Enter 처음부터" : judgeClear ? "Enter 기록 더 보기" : "Enter 다음";
  const menuLabel = judgeClear ? "M 탈출한다" : "M 메뉴";
  resultAdvice.innerHTML = `${renderResultAdvice(result, room, finalRoom, judgeClear)}<span>${enterLabel}</span><span>R 다시</span><span>${menuLabel}</span>`;
  restartButton.textContent = judgeClear ? "다시 달리기" : result.stars >= 3 ? "다시 뛰기" : "별 더 따기";
  nextButton.textContent = finalRoom ? "처음부터" : judgeClear ? "기록을 더 본다" : "다음 방";
  menuButton.textContent = judgeClear ? "탈출한다" : "메뉴";
  showToast(
    finalRoom ? "진짜 문 개방" : judgeClear ? "공식 탈출 완료" : result.stars >= 3 ? "퍼펙트 런" : "클리어",
    finalRoom ? "전부 나야." : judgeClear ? "남은 실패 로그를 삭제하시겠습니까?" : room.clearLine,
  );
  playSfx(finalRoom || judgeClear ? "win" : "clear");
}

function updateCampaignRun(result) {
  if (!state.campaignActive || state.roomIndex !== state.campaignNextRoom) return;
  state.campaignTime += result.time;
  state.campaignNextRoom += 1;
  if (state.roomIndex === JUDGE_CLEAR_INDEX) {
    state.campaignOfficialTime = state.campaignTime;
  }
}

function renderLoopReplay(result, room, finalRoom, judgeClear) {
  if (!resultReplay) return;
  const replayEchoes = state.echoes.slice(0, MAX_GHOSTS);
  const echoes = Math.max(0, Math.min(MAX_GHOSTS, result.ghosts));
  const participants = [
    { label: "RUNNER-07", color: "#fff3c7", role: "현재", current: true },
    ...Array.from({ length: echoes }, (_, index) => {
      const echo = replayEchoes[index];
      const role = echo ? describeEchoRole(echo) : `G${index + 1}`;
      return {
        label: `G${index + 1}`,
        color: echo?.color ?? echoColor(index),
        role: compactEchoRole(role),
        current: false,
      };
    }),
  ];
  const title = finalRoom ? "진짜 문 합창 리플레이" : judgeClear ? "공식 탈출 리플레이" : "실패 장비 리플레이";
  const subtitle = result.ghosts
    ? `${result.ghosts}개의 실패 기록이 동시에 길을 열었다.`
    : "현재 루트가 그대로 기록되었다.";
  const roles = participants
    .filter((item) => !item.current)
    .map((item) => `<span style="--color:${item.color}"><b>${item.label}</b>${item.role}</span>`)
    .join("");

  resultReplay.innerHTML = `
    <div class="replay-copy">
      <strong>${title}</strong>
      <span>${subtitle}</span>
    </div>
    ${roles ? `<div class="replay-roles">${roles}</div>` : ""}
    <div class="replay-track">
      ${participants.map((item, index) => `
        <i style="--color:${item.color}; --delay:${index * 0.16}s">
          <b>${item.label}</b>
        </i>
      `).join("")}
    </div>
  `;
  resultReplay.classList.toggle("is-empty", !result.ghosts);
  resultReplay.classList.toggle("is-true", finalRoom);
}

function calculateStageResult(room) {
  let stars = 3;
  const ghosts = state.echoes.length;
  const misses = [];
  const designerTarget = designerTime(room);
  if (ghosts > room.parGhosts) {
    stars -= 1;
    misses.push(`고스트 ${ghosts - room.parGhosts}개 줄이면 별 +1`);
  }
  if (state.stageTime > room.parTime) {
    stars -= 1;
    misses.push(`${Math.ceil((state.stageTime - room.parTime) * 10) / 10}초 줄이면 별 +1`);
  }
  return {
    stars: clamp(stars, 1, 3),
    time: Math.round(state.stageTime * 100) / 100,
    ghosts,
    loops: state.loopNumber,
    misses,
    designerTarget,
    designerClear: stars >= 3 && state.stageTime <= designerTarget,
    medal: pickMedal(stars, state.stageTime, designerTarget),
    syncs: state.syncCount,
    boostBreaks: state.boostBreaks,
    flowBonus: Math.round(state.flowBonus * 10) / 10,
  };
}

function renderResultAdvice(result, room, finalRoom, judgeClear = false) {
  if (judgeClear) {
    const officialTime = state.campaignOfficialTime ?? campaignParTime(JUDGE_CLEAR_INDEX + 1);
    return `<span>12방 탈출 승인</span><span>공식 누적 ${formatPrecise(officialTime)} / ${formatClock(OFFICIAL_TARGET_SECONDS)}</span><span>삭제 대기 로그 발견</span><span>여기서 끝내면 실패 기록은 사라진다</span><span>기록을 더 보면 진짜 문으로 간다</span>`;
  }
  if (finalRoom && result.stars >= 3) {
    const total = state.campaignActive ? state.campaignTime : campaignParTime();
    return `<span>${result.designerClear ? "플래티넘 런" : "비인가 방 전부 통과"}</span><span>20방 누적 ${formatPrecise(total)} / ${formatClock(OFFICIAL_TARGET_SECONDS)}</span><span>삭제된 기록 복원</span><span>러너-07은 혼자 나가지 않았다</span><span>실패는 리셋되지 않았다</span>`;
  }
  const designerGap = Math.max(0, Math.ceil((result.time - result.designerTarget) * 10) / 10);
  if (!result.misses.length) {
    const tags = [
      `<span>${clearFlavorLine()}</span>`,
      `<span>${result.designerClear ? "플래티넘 런" : "3★ 클리어"}</span>`,
      `<span>고스트 ${result.ghosts}/${room.parGhosts}</span>`,
      `<span>3★ 기록 ${formatPrecise(room.parTime)}</span>`,
    ];
    if (result.designerClear) tags.push(`<span>디자이너 기록 돌파</span>`);
    else tags.push(`<span>디자이너까지 ${designerGap.toFixed(1)}초</span>`);
    if (result.syncs) tags.push(`<span>싱크 ${result.syncs}회</span>`);
    if (result.boostBreaks) tags.push(`<span>돌파 ${result.boostBreaks}회</span>`);
    if (result.flowBonus) tags.push(`<span>루프 체인 -${result.flowBonus.toFixed(1)}초</span>`);
    if (result.time <= room.parTime * 0.8) tags.push(`<span>스피드런 루트</span>`);
    return tags.join("");
  }
  return [`다음 목표`, ...result.misses].map((text) => `<span>${text}</span>`).join("");
}

function renderResultInsight(result, room, finalRoom, judgeClear = false) {
  const nextRoom = rooms[state.roomIndex + 1];
  const successReason = result.ghosts
    ? room.clearLine
    : "이번 루트가 다음 실패 설계의 기준점이 되었다.";
  const unlockText = finalRoom
    ? "진엔딩 복원 완료"
    : judgeClear
      ? "비인가 기록 루트 13~20 개방"
      : nextRoom
        ? `방 ${state.roomIndex + 2} · ${nextRoom.name}`
        : "아카이브 복원";
  const learnedText = finalRoom
    ? "전부 나야."
    : judgeClear
      ? "공식 탈출 뒤에 진짜 문이 남아 있다."
      : roomMemoryAnchor();
  const cards = [
    { label: "왜 성공했는가", value: successReason, asset: result.ghosts ? generatedAssets.switch : generatedAssets.record },
    { label: "새 요소 해금", value: unlockText, asset: finalRoom || judgeClear ? generatedAssets.trophy : generatedAssets.lock },
    { label: "배운 기억", value: learnedText, asset: finalRoom ? generatedAssets.exit : generatedAssets.core },
  ];
  return cards
    .map(
      (card) => `
        <div>
          <img src="${card.asset}" alt="" />
          <span>${card.label}</span>
          <strong>${card.value}</strong>
        </div>
      `,
    )
    .join("");
}

function clearFlavorLine() {
  return clearFlavorLines[state.roomIndex % clearFlavorLines.length];
}

function designerTime(room) {
  return Math.max(8, Math.round(room.parTime * 0.82 * 10) / 10);
}

function campaignParTime(count = rooms.length) {
  return rooms.slice(0, count).reduce((total, room) => total + room.parTime, 0);
}

function bestCampaignTime(count = JUDGE_CLEAR_INDEX + 1) {
  const records = state.progress?.stages?.slice(0, count) ?? [];
  if (records.length < count || records.some((record) => !Number.isFinite(record.bestTime))) return null;
  return records.reduce((total, record) => total + record.bestTime, 0);
}

function pickMedal(stars, time, target) {
  if (stars >= 3 && time <= target) return "platinum";
  if (stars >= 3) return "gold";
  if (stars >= 2) return "silver";
  return "bronze";
}

function medalRank(medal) {
  return { none: 0, bronze: 1, silver: 2, gold: 3, platinum: 4 }[medal] ?? 0;
}

function betterMedal(current, next) {
  return medalRank(next) > medalRank(current) ? next : (current ?? "none");
}

function medalMeta(medal) {
  const data = {
    none: ["기록 없음", "is-none"],
    bronze: ["브론즈 런", "is-bronze"],
    silver: ["실버 런", "is-silver"],
    gold: ["골드 런", "is-gold"],
    platinum: ["플래티넘 런", "is-platinum"],
  }[medal] ?? ["기록 없음", "is-none"];
  return { label: data[0], className: data[1] };
}

function saveStageResult(index, result) {
  const record = state.progress.stages[index];
  const previousBestTime = record.bestTime;
  const shouldSaveRoute = previousBestTime == null || result.time <= previousBestTime;
  record.bestStars = Math.max(record.bestStars || 0, result.stars);
  record.bestGhosts = record.bestGhosts == null ? result.ghosts : Math.min(record.bestGhosts, result.ghosts);
  record.bestTime = record.bestTime == null ? result.time : Math.min(record.bestTime, result.time);
  record.bestMedal = betterMedal(record.bestMedal, result.medal);
  if (shouldSaveRoute) record.bestRoute = compactTrace(state.stageTrace);
  state.progress.unlocked = Math.max(state.progress.unlocked, Math.min(index + 1, rooms.length - 1));
  writeProgress();
}

function totalEchoes() {
  return state.echoes.length;
}

function update(dt) {
  if (state.screen !== "game") return;
  state.toastTimer = Math.max(0, state.toastTimer - dt);
  state.failFlash = Math.max(0, state.failFlash - dt);
  state.screenShake = Math.max(0, state.screenShake - dt);
  state.hintCooldown = Math.max(0, state.hintCooldown - dt);
  state.syncCooldown = Math.max(0, state.syncCooldown - dt);
  state.syncPulse = Math.max(0, state.syncPulse - dt);
  state.syncRush = Math.max(0, state.syncRush - dt);
  state.flowTimer = Math.max(0, state.flowTimer - dt);
  if (state.flowTimer <= 0) state.flowCombo = 0;

  if (state.crashTimer > 0) {
    state.crashTimer = Math.max(0, state.crashTimer - dt);
    state.roomIntroTimer = Math.max(0, state.roomIntroTimer - dt);
    updateEffects(dt);
    updateHud();
    if (state.crashTimer <= 0) {
      state.crashInfo = null;
      restartLoop(false, "CRASH");
    }
    return;
  }

  if (!state.stageStarted) {
    state.roomIntroTimer = Math.max(0, state.roomIntroTimer - dt);
    updateEffects(dt);
    updateHud();
    return;
  }

  state.stageTime += dt;
  state.replayTime += dt;
  state.sampleTimer += dt;
  state.dash = Math.max(0, state.dash - dt);
  state.powerDash = Math.max(0, state.powerDash - dt);
  state.dashCooldown = Math.max(0, state.dashCooldown - dt);
  state.phaseTimer = Math.max(0, state.phaseTimer - dt);
  updateInputBuffers(dt);
  state.roomIntroTimer = Math.max(0, state.roomIntroTimer - dt);

  updatePlayer(dt);
  updateRecording();
  updateStageTrace(dt);
  updateObjects(dt);
  updateEffects(dt);

  updateHud();
}

function updateInputBuffers(dt) {
  state.dashBuffer = Math.max(0, state.dashBuffer - dt);
  if (state.dashBuffer > 0 && state.dashCooldown <= 0.02 && state.dash <= 0.02) {
    if (triggerDash()) state.dashBuffer = 0;
  }
}

function updatePlayer(dt) {
  const p = state.player;
  p.scale = state.playerScale;
  p.px = p.x;
  p.py = p.y;

  let ix = 0;
  let iy = 0;
  if (keys.has("arrowleft") || keys.has("a")) ix -= 1;
  if (keys.has("arrowright") || keys.has("d")) ix += 1;
  if (keys.has("arrowup") || keys.has("w")) iy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) iy += 1;
  const len = Math.hypot(ix, iy) || 1;
  if (Math.hypot(ix, iy) > 0.01) {
    state.lastX = ix / len;
    state.lastY = iy / len;
    p.facingX = state.lastX;
    p.facingY = state.lastY;
  }

  const dashing = state.dash > 0;
  const mx = dashing ? state.dashX : ix / len;
  const my = dashing ? state.dashY : iy / len;
  const moving = dashing || Math.hypot(ix, iy) > 0.01;
  const bodyScale = state.playerScale > 1.15 ? 0.9 : state.playerScale < 0.85 ? 1.08 : 1;
  const rushScale = state.syncRush > 0 ? 1.18 : 1;
  const speedScale = bodyScale * rushScale;
  const speed = dashing ? DASH_SPEED : p.speed * speedScale;
  if (moving) {
    p.x += mx * speed * dt;
    p.y += my * speed * dt;
  }

  const room = rooms[state.roomIndex];
  const radius = playerRadius();
  p.x = clamp(p.x, 54 + radius, W - 54 - radius);
  p.y = clamp(p.y, 54 + radius, H - 54 - radius);
  if (dashing) breakDashGates(room, radius);
  for (const wall of solidRects(room)) resolveCircleRect(p, radius, wall);
  resolveBlockableLaserStops(room, radius);

  if (dashing && Math.random() < 0.8) {
    particle(p.x - mx * 20, p.y - my * 20, "#ff5ba8", rand(3, 7), -mx * rand(60, 130), -my * rand(60, 130), 0.26, true);
  }
}

function resolveBlockableLaserStops(room, radius) {
  for (const laser of room.lasers) {
    if (!laser.blockable || !laserPowered(laser) || laserBlocker(laser)) continue;
    const horizontal = Math.abs(laser.x2 - laser.x1) > Math.abs(laser.y2 - laser.y1);
    if (horizontal) {
      const y = laser.y1;
      const minX = Math.min(laser.x1, laser.x2) - radius;
      const maxX = Math.max(laser.x1, laser.x2) + radius;
      if (state.player.x < minX || state.player.x > maxX || Math.abs(state.player.y - y) > radius + 7) continue;
      const fromAbove = state.player.py <= y;
      state.player.y = fromAbove ? y - radius - 9 : y + radius + 9;
      showContextHint("레이저", "고스트로 막거나 다른 길로 돌아가라.");
    } else {
      const x = laser.x1;
      const minY = Math.min(laser.y1, laser.y2) - radius;
      const maxY = Math.max(laser.y1, laser.y2) + radius;
      if (state.player.y < minY || state.player.y > maxY || Math.abs(state.player.x - x) > radius + 7) continue;
      const fromLeft = state.player.px <= x;
      state.player.x = fromLeft ? x - radius - 9 : x + radius + 9;
      showContextHint("레이저", "고스트로 막거나 다른 길로 돌아가라.");
    }
  }
}

function dashGateBroken(gate) {
  return state.brokenDashGates?.has(gate.id);
}

function breakDashGates(room, radius, force = false) {
  if (!force && state.powerDash <= 0.01) return;
  for (const gate of room.dashGates ?? []) {
    if (dashGateBroken(gate)) continue;
    if (!circleRectOverlap(state.player, radius + 46, gate)) continue;
    state.brokenDashGates.add(gate.id);
    state.boostBreaks += 1;
    if (force) state.dashCharge = false;
    const cx = gate.x + gate.w / 2;
    const cy = gate.y + gate.h / 2;
    burst(cx, cy, "#ff5ba8", 38);
    burst(cx, cy, "#1edcc5", 26);
    floating("돌파", cx, cy - 42, "#ff5ba8");
    showToast(gate.syncOnly ? "싱크 돌파" : "장벽 돌파", "좋아, 길이 열렸다.");
    playSfx("gate");
    state.screenShake = 0.22;
  }
}

function updateRecording() {
  if (state.sampleTimer < SAMPLE_RATE) return;
  state.sampleTimer = 0;
  state.recording.push({
    t: state.replayTime,
    x: state.player.x,
    y: state.player.y,
    facingX: state.player.facingX,
    facingY: state.player.facingY,
    dash: state.dash > 0,
    scale: state.playerScale,
  });
}

function updateStageTrace(dt) {
  state.traceSampleTimer += dt;
  if (state.traceSampleTimer < PB_TRACE_RATE) return;
  state.traceSampleTimer = 0;
  pushStageTrace(false);
}

function pushStageTrace(reset = false) {
  if (!state.player) return;
  const sample = makeTraceSample(reset);
  const last = state.stageTrace.at(-1);
  if (!reset && last && Math.abs(last.t - sample.t) < 0.03 && distance(last, sample) < 5) return;
  state.stageTrace.push(sample);
}

function makeTraceSample(reset = false) {
  return {
    t: Math.round(state.stageTime * 100) / 100,
    x: Math.round(state.player.x),
    y: Math.round(state.player.y),
    facingX: Math.round((state.player.facingX ?? 1) * 100) / 100,
    facingY: Math.round((state.player.facingY ?? 0) * 100) / 100,
    dash: state.dash > 0,
    scale: Math.round((state.playerScale ?? 1) * 100) / 100,
    reset,
  };
}

function compactTrace(samples) {
  const valid = sanitizeTraceSamples(samples);
  if (!valid) return null;
  const maxSamples = 1300;
  if (valid.length <= maxSamples) return valid;
  const step = (valid.length - 1) / (maxSamples - 1);
  const compact = [];
  for (let i = 0; i < maxSamples; i += 1) {
    compact.push(valid[Math.round(i * step)]);
  }
  return compact;
}

function sanitizeTraceSamples(samples) {
  if (!Array.isArray(samples)) return null;
  let lastT = -0.01;
  const valid = samples
    .filter((sample) => sample && Number.isFinite(sample.t) && Number.isFinite(sample.x) && Number.isFinite(sample.y))
    .map((sample) => {
      const rawT = Math.max(0, Math.round(sample.t * 100) / 100);
      const t = Math.max(rawT, Math.round((lastT + 0.01) * 100) / 100);
      lastT = t;
      return {
        t,
        x: Math.round(sample.x),
        y: Math.round(sample.y),
        facingX: Math.round((sample.facingX ?? 1) * 100) / 100,
        facingY: Math.round((sample.facingY ?? 0) * 100) / 100,
        dash: Boolean(sample.dash),
        scale: clamp(Number(sample.scale) || 1, 0.7, 1.35),
        reset: Boolean(sample.reset),
      };
    });
  return valid.length > 1 ? valid : null;
}

function bestRouteFor(index) {
  const samples = sanitizeTraceSamples(state.progress?.stages?.[index]?.bestRoute);
  return samples ? compactTrace(samples) : null;
}

function updateObjects(dt) {
  const room = rooms[state.roomIndex];

  for (let i = 0; i < room.cores.length; i += 1) {
    if (state.collected.has(i)) continue;
    const core = room.cores[i];
    if (distance(state.player, core) < 82) {
      state.collected.add(i);
    showToast("코어 회수");
      playSfx("core");
      burst(core.x, core.y, i % 2 ? "#b261ff" : "#1edcc5", 26);
      state.dashCooldown = 0;
      state.screenShake = 0.12;
      floating("코어", core.x, core.y - 34, "#ffd166");
    }
  }

  for (let i = 0; i < (room.items ?? []).length; i += 1) {
    if (state.itemsCollected.has(i)) continue;
    const item = room.items[i];
    if (distance(state.player, item) < 58 + playerRadius() * 0.35) {
      state.itemsCollected.add(i);
      applyItem(item);
    }
  }

  for (const laser of room.lasers) {
    if (laserHitsPlayer(laser)) {
      triggerCrash("레이저 피격", "고스트로 막거나 우회 루트를 찾아라.");
      return;
    }
  }

  for (const gate of room.sizeGates ?? []) {
    if (!sizeGateOpen(gate) && circleRectOverlap(state.player, playerRadius() + 4, gate)) {
      showContextHint(gate.need === "small" ? "좁은 문" : "중량 필요", gate.need === "small" ? "소형 상태로 통과." : "중량 상태로 밀어라.");
      break;
    }
  }

  for (const gate of room.phaseGates ?? []) {
    if (!phaseGateOpen(gate) && circleRectOverlap(state.player, playerRadius() + 6, gate)) {
      showContextHint("위상막", "보라 코어를 먹으면 잠깐 통과.");
      break;
    }
  }

  for (const gate of room.dashGates ?? []) {
    if (!dashGateBroken(gate) && circleRectOverlap(state.player, playerRadius() + 8, gate)) {
      showContextHint(state.dashCharge ? "Space" : (gate.syncOnly ? "E 싱크" : "부스트 필요"), state.dashCharge ? "Space로 장벽을 뚫어라." : (gate.syncOnly ? "고스트 곁에서 E로 충전." : "민트 부스트부터."));
      break;
    }
  }

  const finalRoom = state.roomIndex === rooms.length - 1;
  if (finalRoom && !state.syncWasShown && room.gates.length && room.gates.every((gate) => gateOpen(gate))) {
    state.syncWasShown = true;
    showToast("루프 동기화", "모든 잔상이 같은 방향으로 달린다.");
    const gate = room.gates[0];
    burst(gate.x + gate.w / 2, gate.y + gate.h / 2, "#ffd166", 46);
  }

  const exitOpen = canExit();
  if (exitOpen && !state.doorWasOpen) {
    state.doorWasOpen = true;
    const exitCenter = { x: room.exit.x + room.exit.w / 2, y: room.exit.y + room.exit.h / 2 };
    burst(exitCenter.x, exitCenter.y, finalRoom ? "#ffd166" : "#1edcc5", finalRoom ? 64 : 32);
    floating("열림", exitCenter.x, exitCenter.y - 36, "#1edcc5");
    const judgeClear = state.roomIndex === JUDGE_CLEAR_INDEX;
    showToast(
      finalRoom ? "진짜 문 개방" : state.roomIndex === 0 ? "좋아." : judgeClear ? "공식 탈출 승인" : "문 개방",
      finalRoom ? "삭제된 실패를 데리고 나갈 시간." : state.roomIndex === 0 ? "방금 실패한 네가 지금의 문을 열었다." : judgeClear ? "기록을 더 보면 진짜 문이 열린다." : roomMemoryAnchor(),
    );
    playSfx(finalRoom ? "win" : "gate");
  }
  const exit = room.exit;
  if (!exitOpen && circleRectOverlap(state.player, playerRadius() + 8, exit)) {
    const reason = exitLockReason(room);
    showContextHint(reason.title, reason.body);
  }
  updateConditionFeedback(room);
  if (exitOpen && exitReached(exit)) finishRoom();
}

function exitReached(exit) {
  const center = { x: exit.x + exit.w / 2, y: exit.y + exit.h / 2 };
  return distance(state.player, center) <= exitReachRadius(exit);
}

function exitReachRadius(exit) {
  return Math.max(30, Math.min(exit.w, exit.h) * 0.42);
}

function showContextHint(title, body) {
  if (state.hintCooldown > 0) return;
  state.hintCooldown = 1.05;
  showToast(title, hasCanvasGuidance() ? body : "");
  playSfx("deny");
}

function exitLockReason(room) {
  if (state.collected.size < room.cores.length) {
    return { title: "코어가 필요하다", body: "먼저 코어 회수." };
  }
  const dashGate = (room.dashGates ?? []).find((gate) => !dashGateBroken(gate));
  if (dashGate) {
    return dashGate.syncOnly
      ? { title: "싱크 충전 필요", body: "고스트 곁에서 E, 그다음 Space." }
      : { title: "부스트가 필요하다", body: "민트 부스트를 먹고 Space." };
  }
  const active = activeSwitches();
  const gate = room.gates.find((item) => !gateOpen(item));
  if (gate) {
    const missing = gate.needs.find((id) => !active.has(id));
    const sw = room.switches.find((item) => item.id === missing);
    if (sw?.requires === "big") return { title: "중량 고스트 필요", body: `${sw.label}는 무거운 몸으로 눌러야 한다.` };
    if (sw?.requires === "small") return { title: "소형 고스트 필요", body: `${sw.label}는 작은 몸으로 눌러야 한다.` };
    return { title: "스위치가 비어 있다", body: `${missing ?? "스위치"}에 고스트를 남겨라.` };
  }
    return { title: "아직 잠겨 있다", body: "맡길 루프가 하나 더 필요하다." };
}

function applyItem(item) {
  if (item.type === "dash") {
    state.dashCharge = true;
    state.dashCooldown = 0;
    burst(item.x, item.y, "#1edcc5", 22);
    burst(item.x, item.y, "#ff5ba8", 12);
    floating("부스트", item.x, item.y - 30, "#1edcc5");
    showToast("부스트 충전", hasCanvasGuidance() ? "Space로 장벽을 뚫어라." : "");
    playSfx("item");
  } else if (item.type === "shrink") {
    state.itemMode = "small";
    state.playerScale = 0.68;
    state.player.scale = state.playerScale;
    burst(item.x, item.y, "#1edcc5", 24);
    floating("소형", item.x, item.y - 30, "#1edcc5");
    showToast("소형 모드", hasCanvasGuidance() ? "좁은 문 통과 가능." : "");
    playSfx("item");
  } else if (item.type === "grow") {
    state.itemMode = "big";
    state.playerScale = 1.34;
    state.player.scale = state.playerScale;
    burst(item.x, item.y, "#ffd166", 24);
    floating("중량", item.x, item.y - 30, "#ffd166");
    showToast("중량 모드", hasCanvasGuidance() ? "B+ 스위치 압력 가능." : "");
    playSfx("item");
  } else if (item.type === "phase") {
    state.phaseTimer = PHASE_SECONDS;
    burst(item.x, item.y, "#b261ff", 28);
    burst(item.x, item.y, "#6fcaff", 14);
    floating("위상", item.x, item.y - 30, "#b261ff");
    showToast("위상 코어", hasCanvasGuidance() ? "보라 막을 잠깐 통과." : "");
    playSfx("item");
  }
  state.screenShake = 0.08;
}

function updateEffects(dt) {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= dt;
    p.spin += dt * 7;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const text of state.texts) {
    text.y -= dt * 46;
    text.life -= dt;
  }
  state.texts = state.texts.filter((text) => text.life > 0);
}

function triggerCrash(title, body = "다시 기록.") {
  if (state.crashTimer > 0) return;
  state.crashTimer = 0.75;
  state.crashInfo = { x: state.player.x, y: state.player.y, title };
  state.failFlash = 0.8;
  state.screenShake = 0.28;
  burst(state.player.x, state.player.y, "#ff5ba8", 30);
  floating("피격", state.player.x, state.player.y - 38, "#ff5ba8");
  showToast(title, hasCanvasGuidance() ? body : "");
  playSfx("hit");
}

function queueDash() {
  if (state.screen !== "game") return;
  state.dashBuffer = DASH_BUFFER_SECONDS;
  if (triggerDash()) state.dashBuffer = 0;
}

function triggerDash() {
  if (state.screen !== "game" || state.dashCooldown > 0) return false;
  const boosted = state.dashCharge;
  state.dashX = state.lastX || 1;
  state.dashY = state.lastY || 0;
  state.dash = boosted ? 0.38 : 0.18;
  state.powerDash = boosted ? state.dash : 0;
  state.dashCharge = false;
  state.dashCooldown = boosted ? 0.45 : Math.max(0.68, 1.05 - state.echoPower * 0.055);
  state.screenShake = boosted ? 0.12 : 0.05;
  floating(boosted ? "부스트 대시" : "대시", state.player.x, state.player.y - 28, boosted ? "#1edcc5" : "#ff5ba8");
  playSfx("dash");
  return true;
}

function triggerSync() {
  if (state.screen !== "game" || state.syncCooldown > 0) return;
  const target = nearestEcho(96);
  if (!target) {
    showContextHint("싱크 불가", "고스트 곁에서 E.");
    return;
  }
  state.dashCharge = true;
  state.dashCooldown = 0;
  state.syncRush = 1.15;
  state.syncCount += 1;
  if (state.stageStarted) state.stageTime = Math.max(0, state.stageTime - 0.85);
  state.syncCooldown = 3.5;
  state.syncPulse = 0.75;
  state.screenShake = 0.12;
  burst(target.x, target.y, target.color, 26);
  burst(state.player.x, state.player.y, "#ffd166", 24);
  floating("싱크 러시", state.player.x, state.player.y - 36, "#ffd166");
  floating("-0.8초", target.x, target.y - 68, "#1edcc5");
  showToast("싱크 러시", hasCanvasGuidance() ? "고스트 옆에서 E. 다음 Space가 강해집니다." : "Space까지 연결.");
  playSfx("item");
}

function nearestEcho(range) {
  let best = null;
  for (const echo of state.echoes) {
    const pos = echoPosition(echo, state.replayTime);
    if (!pos) continue;
    const d = distance(state.player, pos);
    if (d > range || (best && d >= best.distance)) continue;
    best = { ...pos, color: echo.color, id: echo.id, distance: d };
  }
  return best;
}

function activeSwitches() {
  const room = rooms[state.roomIndex];
  const active = new Set();
  const radius = 42 + state.echoPower * 3;
  for (const sw of room.switches) {
    if (distance(state.player, sw) < radius && actorCanPress(state.player, sw)) active.add(sw.id);
    for (const echo of state.echoes) {
      const pos = echoPosition(echo, state.replayTime);
      if (pos && distance(pos, sw) < radius && actorCanPress(pos, sw)) active.add(sw.id);
    }
  }
  return active;
}

function plannedSwitches() {
  const room = rooms[state.roomIndex];
  const planned = new Set(activeSwitches());
  const radius = 74 + state.echoPower * 3;
  for (const sw of room.switches) {
    if (planned.has(sw.id)) continue;
    for (const echo of state.echoes) {
      const last = echo.samples.at(-1);
      if (last && distance(last, sw) < radius && actorCanPress(last, sw)) {
        planned.add(sw.id);
        break;
      }
    }
  }
  return planned;
}

function actorCanPress(actor, sw) {
  const scale = actor?.scale ?? 1;
  if (sw.requires === "big") return scale >= 1.18;
  if (sw.requires === "small") return scale <= 0.82;
  return true;
}

function gateOpen(gate) {
  const active = activeSwitches();
  return gate.needs.every((id) => active.has(id));
}

function canExit() {
  const room = rooms[state.roomIndex];
  if (state.collected.size < room.cores.length) return false;
  if ((room.dashGates ?? []).some((gate) => !dashGateBroken(gate))) return false;
  return room.gates.every((gate) => gateOpen(gate));
}

function getMissionState() {
  const room = rooms[state.roomIndex];
  const active = activeSwitches();
  const planned = plannedSwitches();
  const missingSwitch = room.switches.find((sw) => !planned.has(sw.id));
  const nextCoreIndex = room.cores.findIndex((_, index) => !state.collected.has(index));
  const nextCore = nextCoreIndex >= 0 ? room.cores[nextCoreIndex] : null;
  const nextItemIndex = (room.items ?? []).findIndex((_, index) => !state.itemsCollected.has(index));
  const nextItem = nextItemIndex >= 0 ? room.items[nextItemIndex] : null;
  const exit = { x: room.exit.x + room.exit.w / 2, y: room.exit.y + room.exit.h / 2 };
  const routeTarget = nextCore ?? exit;
  const lockedSizeGate = (room.sizeGates ?? []).find((gate) => !sizeGateOpen(gate) && routeHitsRect(state.player, routeTarget, gate));
  const lockedDashGate = (room.dashGates ?? []).find((gate) => !dashGateBroken(gate) && routeHitsRect(state.player, routeTarget, gate));
  const lockedPhaseGate = (room.phaseGates ?? []).find((gate) => !phaseGateOpen(gate) && routeHitsRect(state.player, routeTarget, gate));

  if (state.crashInfo) {
    return { title: "막힌 지점", signal: "여기에 고스트를 세우면 길이 열린다.", target: state.crashInfo, steps: ["자리 잡기", "R 기록", "다시 통과"] };
  }
  if (missingSwitch) {
    if (missingSwitch.requires && !actorCanPress(state.player, missingSwitch)) {
      const type = missingSwitch.requires === "big" ? "grow" : "shrink";
      const item = (room.items ?? []).find((candidate, index) => candidate.type === type && !state.itemsCollected.has(index));
      if (item) {
        return {
          title: type === "grow" ? "중량 모드" : "소형 모드",
          signal: type === "grow" ? "B+는 무거운 몸으로 눌러야 한다." : "좁은 길은 작은 몸만 지난다.",
          target: item,
          steps: [type === "grow" ? "중량 먹기" : "소형 먹기", `${missingSwitch.label}에 올라서기`, "R 기록"],
        };
      }
    }
    const role = missingSwitch.requires === "big" ? "중량" : missingSwitch.requires === "small" ? "소형" : "스위치";
    const firstGhost = !state.echoes.length;
    return {
      title: firstGhost ? "G1 기록" : `${missingSwitch.label} 유지`,
      signal: firstGhost ? room.tip : `${missingSwitch.label}는 ${role} 고스트에게 맡겨라.`,
      target: missingSwitch,
      steps: [`${missingSwitch.label}로 이동`, "R 기록", firstGhost ? "열린 길로" : "다음 역할"],
    };
  }
  if (lockedSizeGate) {
    const type = lockedSizeGate.need === "small" ? "shrink" : "grow";
    const item = (room.items ?? []).find((candidate, index) => candidate.type === type && !state.itemsCollected.has(index));
    if (item) {
      return {
        title: lockedSizeGate.need === "small" ? "소형 모드" : "중량 모드",
        signal: lockedSizeGate.need === "small" ? "작아지면 좁은 문을 지난다." : "무거운 몸으로 밀고 지나간다.",
        target: item,
        steps: [lockedSizeGate.need === "small" ? "소형 먹기" : "중량 먹기", "문 앞까지", "통과"],
      };
    }
    const target = { x: lockedSizeGate.x + lockedSizeGate.w / 2, y: lockedSizeGate.y + lockedSizeGate.h / 2 };
    return {
      title: lockedSizeGate.need === "small" ? "좁은 문" : "무거운 문",
      signal: lockedSizeGate.need === "small" ? "작은 몸일 때만 열린다." : "중량 상태로 밀어야 열린다.",
      target,
      steps: [lockedSizeGate.need === "small" ? "소형 먹기" : "중량 먹기", "문 앞까지", "통과"],
    };
  }
  if (lockedPhaseGate) {
    const phaseItem = (room.items ?? []).find((candidate, index) => candidate.type === "phase" && !state.itemsCollected.has(index));
    if (state.phaseTimer <= 0.02 && phaseItem) {
      return {
        title: "위상 코어",
        signal: "보라 코어를 먹으면 닫힌 막을 잠깐 통과한다.",
        target: phaseItem,
        steps: ["위상 코어", "보라 막 조준", "시간 안에 통과"],
      };
    }
    const target = { x: lockedPhaseGate.x + lockedPhaseGate.w / 2, y: lockedPhaseGate.y + lockedPhaseGate.h / 2 };
    return {
      title: "위상막",
      signal: state.phaseTimer > 0.02 ? `지금 ${state.phaseTimer.toFixed(1)}초 동안 통과 가능.` : "위상 코어를 다시 가져와라.",
      target,
      steps: state.phaseTimer > 0.02 ? ["막으로 이동", "멈추지 말기", "통과"] : ["루프 재시작", "위상 코어", "다시 시도"],
    };
  }
  if (lockedDashGate) {
    const dashItem = (room.items ?? []).find((candidate, index) => candidate.type === "dash" && !state.itemsCollected.has(index));
    if (!state.dashCharge && dashItem) {
      return {
        title: "부스트",
        signal: lockedDashGate.syncOnly ? "고스트 곁에서 E로 충전." : "민트 부스트를 먹고 장벽을 조준.",
        target: dashItem,
        steps: lockedDashGate.syncOnly ? ["고스트 곁으로", "E 싱크", "Space"] : ["부스트 먹기", "장벽 조준", "Space"],
      };
    }
    const target = { x: lockedDashGate.x + lockedDashGate.w / 2, y: lockedDashGate.y + lockedDashGate.h / 2 };
    return {
      title: lockedDashGate.syncOnly ? "싱크 대시" : state.dashCharge ? "부스트 대시" : "충전 없음",
      signal: state.dashCharge ? "Space로 장벽을 뚫어라." : (lockedDashGate.syncOnly ? "고스트 근처에서 E." : "부스트를 다시 가져와라."),
      target,
      steps: state.dashCharge ? ["장벽 조준", "Space", "통과"] : lockedDashGate.syncOnly ? ["고스트 근처", "E 싱크", "Space"] : ["루프 재시작", "부스트 먹기", "다시 시도"],
    };
  }
  if (nextItem && nextItem.type === "phase" && distance(state.player, nextItem) < 320) {
    return { title: "위상 코어", signal: "보라 막을 지나야 할 때 쓰는 짧은 통과 권한.", target: nextItem, steps: ["위상 코어", "막까지 달리기", "통과"] };
  }
  if (nextItem && nextItem.type !== "dash" && distance(state.player, nextItem) < 280) {
    return { title: nextItem.type === "shrink" ? "소형 모드" : "중량 모드", signal: nextItem.type === "shrink" ? "작아져야 지나갈 길이 있다." : "무거운 몸으로 눌러야 할 곳이 있다.", target: nextItem, steps: ["아이템 먹기", "자리 잡기", "R 기록"] };
  }
  if (nextItem && nextItem.type === "dash" && state.dashCooldown > 0.15 && distance(state.player, nextItem) < 240) {
    return { title: "부스트", signal: "장벽 앞에 가기 전에 부스트부터.", target: nextItem, steps: ["부스트 먹기", "장벽 조준", "Space"] };
  }
  if (nextCore) {
    return { title: "코어", signal: "코어를 챙기면 출구가 반응한다.", target: nextCore, steps: ["코어 회수", "문 확인", "탈출"] };
  }
  if (canExit()) {
    return { title: "탈출", signal: "길이 열렸다. 지금 나가라.", target: exit, steps: ["출구로", "필요하면 대시", "클리어"] };
  }
  return { title: "다음 루프", signal: "이번 루프가 맡을 일을 정하자.", target: nextCore ?? exit, steps: ["역할 정하기", "R 기록", "겹치기"] };
}

function solidRects(room) {
  return [
    ...room.walls,
    ...room.gates.filter((gate) => !gateOpen(gate)),
    ...(room.sizeGates ?? []).filter((gate) => !sizeGateOpen(gate)),
    ...(room.phaseGates ?? []).filter((gate) => !phaseGateOpen(gate)),
    ...(room.dashGates ?? []).filter((gate) => !dashGateBroken(gate)),
  ];
}

function routeHitsRect(from, to, rect) {
  if (!from || !to || !rect) return false;
  const pad = playerRadius() + 10;
  const expanded = {
    x: rect.x - pad,
    y: rect.y - pad,
    w: rect.w + pad * 2,
    h: rect.h + pad * 2,
  };
  const steps = 24;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = lerp(from.x, to.x, t);
    const y = lerp(from.y, to.y, t);
    if (x >= expanded.x && x <= expanded.x + expanded.w && y >= expanded.y && y <= expanded.y + expanded.h) return true;
  }
  return false;
}

function laserBlocker(laser) {
  if (!laser.blockable) return null;
  const blockRadius = laser.blockRadius ?? (86 + state.echoPower * 3);
  for (const echo of state.echoes) {
    const pos = echoPosition(echo, state.replayTime);
    if (pos && isLaserBlockPosition(pos, laser, blockRadius)) {
      return { ...pos, color: echo.color, id: echo.id };
    }
  }
  return null;
}

function isLaserBlockPosition(pos, laser, radius) {
  const dx = laser.x2 - laser.x1;
  const dy = laser.y2 - laser.y1;
  const len = Math.hypot(dx, dy);
  if (len <= 0) return false;
  const along = ((pos.x - laser.x1) * dx + (pos.y - laser.y1) * dy) / len;
  if (along < -24 || along > len + 24) return false;
  return pointLineDistance(pos.x, pos.y, laser.x1, laser.y1, laser.x2, laser.y2) < radius;
}

function laserRecordSpot(laser) {
  if (laser.recordSpot) return laser.recordSpot;
  const horizontal = Math.abs(laser.x2 - laser.x1) > Math.abs(laser.y2 - laser.y1);
  const cx = (laser.x1 + laser.x2) / 2;
  const cy = (laser.y1 + laser.y2) / 2;
  return horizontal ? { x: cx, y: cy - 46 } : { x: cx - 46, y: cy };
}

function laserPowered(laser) {
  const active = activeSwitches();
  if (laser.offWhen?.some((id) => active.has(id))) return false;
  return true;
}

function laserHitsPlayer(laser) {
  if (!laserPowered(laser)) return false;
  const radius = playerRadius() + 4;
  if (pointLineDistance(state.player.x, state.player.y, laser.x1, laser.y1, laser.x2, laser.y2) >= radius) return false;
  const blocker = laserBlocker(laser);
  return !blocker;
}

function sizeGateOpen(gate) {
  if (gate.need === "small") return state.playerScale <= 0.82;
  if (gate.need === "big") return state.playerScale >= 1.18;
  return true;
}

function phaseGateOpen() {
  return state.phaseTimer > 0.02;
}

function echoPosition(echo, t) {
  const samples = echo.samples;
  if (!samples.length) return null;
  if (t <= samples[0].t) return samples[0];
  for (let i = 1; i < samples.length; i += 1) {
    const a = samples[i - 1];
    const b = samples[i];
    if (t <= b.t) {
      const k = (t - a.t) / Math.max(0.001, b.t - a.t);
      return {
        x: lerp(a.x, b.x, k),
        y: lerp(a.y, b.y, k),
        facingX: Math.abs(a.facingX ?? 1) + Math.abs(b.facingX ?? 1) ? lerp(a.facingX ?? 1, b.facingX ?? 1, k) : 1,
        facingY: lerp(a.facingY ?? 0, b.facingY ?? 0, k),
        dash: a.dash || b.dash,
        scale: lerp(a.scale ?? 1, b.scale ?? 1, k),
      };
    }
  }
  return samples[samples.length - 1];
}

function echoHasReachedEnd(echo, t = state.replayTime) {
  const last = echo.samples.at(-1);
  return Boolean(last && t >= last.t);
}

function updateHud() {
  const room = rooms[state.roomIndex];
  const exitOpen = canExit();
  const mission = getMissionState();
  const record = state.progress.stages[state.roomIndex];
  const platinumUnlocked = (record?.bestStars ?? 0) >= 3;
  const paceTarget = platinumUnlocked ? designerTime(room) : room.parTime;
  const paceLabel = platinumUnlocked ? "플래티넘" : "3★";
  roomText.textContent = `${state.roomIndex + 1} / ${rooms.length}`;
  loopText.textContent = String(state.loopNumber);
  echoText.textContent = `${state.echoes.length} / ${MAX_GHOSTS}`;
  coreText.textContent = `${state.collected.size} / ${room.cores.length}`;
  timerText.textContent = formatPrecise(state.stageTime);
  const paceLeft = Math.max(0, paceTarget - state.stageTime);
  const overPace = state.stageTime > paceTarget;
  timerBar.style.transform = `scaleX(${clamp(paceLeft / paceTarget, 0, 1)})`;
  timerBar.classList.toggle("is-over-pace", overPace);
  paceText.textContent = overPace ? `${paceLabel} +${formatPrecise(state.stageTime - paceTarget)}` : `${paceLabel}까지 ${formatPrecise(paceLeft)}`;
  if (campaignText) {
    const officialPar = campaignParTime(JUDGE_CLEAR_INDEX + 1);
    const currentRoomTime = state.screen === "stage-result" ? 0 : state.stageTime;
    const liveCampaignTime = state.campaignActive ? state.campaignTime + currentRoomTime : officialPar;
    const campaignLabel = state.roomIndex <= JUDGE_CLEAR_INDEX ? "공식 누적" : "20방 누적";
    campaignText.textContent = state.campaignActive
      ? `${campaignLabel} ${formatPrecise(liveCampaignTime)} / ${formatClock(OFFICIAL_TARGET_SECONDS)}`
      : `공식 기준 ${formatClock(officialPar)} / ${formatClock(OFFICIAL_TARGET_SECONDS)}`;
  }
  roomChapter.textContent = `방 ${state.roomIndex + 1}`;
  roomName.textContent = room.name;
  roomGoal.textContent = room.goal;
  if (roomStory) roomStory.textContent = room.story ?? "";
  syncChecklist.innerHTML = renderSyncChecklist(room);
  doorText.textContent = exitOpen ? "열림" : "잠김";
  dangerText.textContent = room.lasers.length ? "레이저" : (room.phaseGates ?? []).length ? "위상" : (room.dashGates ?? []).some((gate) => gate.syncOnly) ? "싱크" : (room.sizeGates?.length || room.items?.some((item) => item.type !== "dash")) ? "변형" : room.switches.length > 1 ? "동기화" : "낮음";
  if (record?.bestTime) {
    const medalLabel = record.bestMedal === "platinum" ? "PT" : `${record.bestStars}★`;
    const pbLabel = record.bestRoute?.length ? "PB" : "";
    const compactBestTime = formatPrecise(record.bestTime).replace(/^00:/, "");
    bestText.innerHTML = `<span>${compactBestTime}</span><small>${[medalLabel, pbLabel].filter(Boolean).join(" · ")}</small>`;
    bestText.title = `${formatPrecise(record.bestTime)} · ${record.bestMedal === "platinum" ? "Platinum" : `${record.bestStars} stars`}${pbLabel ? " · personal best" : ""}`;
  } else {
    bestText.textContent = "--";
    bestText.removeAttribute("title");
  }
  const guidanceVisible = hasCanvasGuidance();
  const mechanicIntro = mechanicIntros.get(state.roomIndex);
  const mechanicVisible = Boolean(mechanicIntro) && !guidanceVisible;
  missionCard.classList.toggle("is-hidden", !guidanceVisible);
  operatorCard.classList.toggle("is-hidden", !guidanceVisible && !mechanicVisible);
  if (guidanceVisible) {
    operatorText.textContent = mission.signal;
    missionSteps.innerHTML = `<strong>${mission.title}</strong>${mission.steps.map((step, index) => `<span><i>${index + 1}</i>${step}</span>`).join("")}`;
  } else if (mechanicVisible) {
    operatorText.textContent = mechanicIntro.body;
    missionSteps.innerHTML = "";
  } else {
    operatorText.textContent = "";
    missionSteps.innerHTML = "";
  }
  stageRail.innerHTML = rooms.map((item, index) => {
    const stateClass = index === state.roomIndex ? "is-current" : index < state.roomIndex ? "is-cleared" : "";
    return `<i class="${stateClass}" title="${item.name}">${index + 1}</i>`;
  }).join("");
  echoList.innerHTML = state.echoes.length
    ? state.echoes.map((echo) => {
      const seconds = echo.samples.length ? echo.samples[echo.samples.length - 1].t.toFixed(1) : "0.0";
      return `<div class="echo-item"><strong style="color:${echo.color}">G${echo.id}</strong><span>${describeEchoRole(echo)} - ${seconds}초</span></div>`;
    }).join("")
    : `<div class="echo-item"><strong>비어 있음</strong><span>아직 남긴 고스트가 없다.</span></div>`;
}

function renderSyncChecklist(room) {
  return getChecklistItems(room).map((item) => `<span class="${item.done ? "is-on" : ""}">${item.done ? "✓" : "·"} ${item.label}</span>`).join("");
}

function getChecklistItems(room) {
  const active = activeSwitches();
  const items = [];
  for (const sw of room.switches) {
    items.push({ key: `switch:${sw.id}`, label: sw.label, done: active.has(sw.id), target: sw, color: switchColor(sw.id) });
  }
  for (const gate of room.dashGates ?? []) {
    items.push({ key: `boost:${gate.id}`, label: gate.syncOnly ? "싱크 대시" : "부스트", done: dashGateBroken(gate), target: { x: gate.x + gate.w / 2, y: gate.y + gate.h / 2 }, color: "#1edcc5" });
  }
  for (const gate of room.phaseGates ?? []) {
    items.push({ key: `phase:${gate.id}`, label: "위상", done: phaseGateOpen(gate), target: { x: gate.x + gate.w / 2, y: gate.y + gate.h / 2 }, color: "#b261ff" });
  }
  if (room.cores.length) {
    const core = room.cores[Math.min(state.collected.size, room.cores.length - 1)];
    items.push({ key: "core", label: "코어", done: state.collected.size >= room.cores.length, target: core, color: "#ffd166" });
  }
  items.push({ key: "exit", label: "출구", done: canExit(), target: { x: room.exit.x + room.exit.w / 2, y: room.exit.y + room.exit.h / 2 }, color: "#ffd166" });
  return items;
}

function updateConditionFeedback(room) {
  if (state.screen !== "game") return;
  for (const item of getChecklistItems(room)) {
    const key = item.key ?? item.label;
    if (!item.done || state.conditionMarks.has(key)) continue;
    state.conditionMarks.add(key);
    state.flowCombo = Math.min(9, state.flowCombo + 1);
    state.flowTimer = 1.7;
    const target = targetPoint(item.target) ?? { x: state.player.x, y: state.player.y };
    const color = item.color ?? "#1edcc5";
    const label = item.label === "출구" ? "탈출 준비" : `${item.label} OK`;
    burst(target.x, target.y, color, 16 + state.flowCombo * 4);
    floating(label, target.x, target.y - 38, color);
    if (state.flowCombo >= 2 && item.label !== "출구") {
      const bonus = Math.min(0.7, 0.18 + state.flowCombo * 0.06);
      state.stageTime = Math.max(0, state.stageTime - bonus);
      state.flowBonus += bonus;
      state.lastFlowBonus = bonus;
      floating(`-${bonus.toFixed(1)}초`, target.x, target.y - 62, "#ffd166");
      showToast(`SYNC x${state.flowCombo}`, `루프 체인 -${bonus.toFixed(1)}초`);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (state.screenShake > 0) {
    const power = state.screenShake * 18;
    ctx.translate(rand(-power, power), rand(-power, power));
  }
    drawRoom();
    if (state.player && (state.screen === "game" || state.screen === "paused" || state.screen === "stage-result")) {
    drawGuidePath();
    drawBestGhost();
    drawEchoes();
    drawSyncTether();
    drawObjects();
    drawObjectivePointer();
    drawPlayer();
    drawRecordCue();
    drawParticles();
    drawFloatingText();
    drawCrashHint();
    drawTimeline();
    drawModeBadge();
    drawAfterimageStatus();
    drawFlowBadge();
    drawRoomIntroOverlay();
  }
  ctx.restore();
  if (state.failFlash > 0) {
    ctx.fillStyle = `rgba(255, 91, 168, ${state.failFlash * 0.5})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawGuidePath() {
  if (!hasCanvasGuidance()) return;
  if (!state.player || state.screen === "stage-result") return;
  const mission = getMissionState();
  const target = targetPoint(mission.target);
  if (!target) return;
  const color = missionColor(mission.title);
  const points = guidePoints(mission, target);
  if (points.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawNeonRoute(points, color, 0.18, 12, 26);
  drawNeonRoute(points, color, 0.78, 3, 0);
  drawRouteChevrons(points, color);
  ctx.restore();
}

function guidePoints(mission, target) {
  const room = rooms[state.roomIndex];
  const points = [{ x: state.player.x, y: state.player.y }];
  const coreGate = room.gates.find((gate) => gateOpen(gate) && mission.title === "코어");
  if (coreGate) points.push({ x: coreGate.x + coreGate.w / 2, y: target.y });
  const exitGate = room.gates.find((gate) => gateOpen(gate) && mission.title === "탈출");
  if (exitGate) points.push({ x: exitGate.x + exitGate.w / 2, y: target.y });
  points.push(target);
  return points;
}

function targetPoint(target) {
  if (!target) return null;
  if (Number.isFinite(target.w) && Number.isFinite(target.h)) {
    return { x: target.x + target.w / 2, y: target.y + target.h / 2 };
  }
  return { x: target.x, y: target.y };
}

function missionColor(title) {
  if (title.includes("레이저") || title.includes("다시")) return "#ff5ba8";
  if (title.includes("중량")) return "#ffd166";
  if (title.includes("위상")) return "#b261ff";
  if (title.includes("탈출") || title.includes("코어")) return "#ffd166";
  if (title.includes("부스트")) return "#1edcc5";
  if (title.includes("소형") || title.includes("대시")) return "#1edcc5";
  return "#1edcc5";
}

function drawNeonRoute(points, color, alpha, width, dashOffset) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = width * 1.8;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([22, 20]);
  ctx.lineDashOffset = -performance.now() / (dashOffset || 14);
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawRouteChevrons(points, color) {
  const stride = 58;
  const offset = (performance.now() / 18) % stride;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(17, 17, 53, 0.52)";
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 24) continue;
    const angle = Math.atan2(dy, dx);
    for (let d = offset + 18; d < len - 18; d += stride) {
      const x = a.x + (dx / len) * d;
      const y = a.y + (dy / len) * d;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(-9, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-9, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawRoom() {
  const room = rooms[state.roomIndex] || rooms[0];
  const palette = roomPalettes[state.roomIndex % roomPalettes.length];
  const t = performance.now() / 1000;
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(0.55, palette[1]);
  gradient.addColorStop(1, palette[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#ffffff";
  for (let x = 54; x < W - 54; x += 48) ctx.fillRect(x, 54, 2, H - 108);
  for (let y = 54; y < H - 54; y += 48) ctx.fillRect(54, y, W - 108, 2);
  ctx.restore();

  roundRect(54, 54, W - 108, H - 108, 22, "rgba(255,255,255,0.13)");
  ctx.strokeStyle = "rgba(255,255,255,0.86)";
  ctx.lineWidth = 5;
  roundedStroke(54, 54, W - 108, H - 108, 22);

  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.strokeStyle = palette[3];
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 16]);
  roundedStroke(74 + Math.sin(t) * 2, 74, W - 148, H - 148, 18);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(16, 9, 43, 0.58)";
  roundRect(76, 76, 238, 48, 14, "rgba(16, 9, 43, 0.56)");
  ctx.fillStyle = "#fff7e8";
  ctx.font = "1000 14px Inter, sans-serif";
  ctx.fillText(`방 ${state.roomIndex + 1} · ${room.name}`, 96, 106);
  ctx.fillStyle = palette[3];
  ctx.beginPath();
  ctx.arc(88, 100, 5 + Math.sin(t * 5) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawArchiveZoneMarker(room, palette);

  for (const wall of room.walls) drawRect(wall, "#2a1b65", "rgba(30, 220, 197, 0.2)");
}

function drawArchiveZoneMarker(room, palette) {
  const official = state.roomIndex === JUDGE_CLEAR_INDEX;
  const trueDoor = state.roomIndex === rooms.length - 1;
  const hidden = state.roomIndex > JUDGE_CLEAR_INDEX;
  if (!official && !trueDoor && !hidden) return;

  ctx.save();
  if (hidden) {
    ctx.globalAlpha = trueDoor ? 0.24 : 0.14;
    ctx.strokeStyle = trueDoor ? "rgba(255, 209, 102, 0.88)" : "rgba(255, 91, 168, 0.7)";
    ctx.lineWidth = trueDoor ? 3 : 2;
    ctx.setLineDash([10, 16]);
    for (let y = 88; y < H - 88; y += 42) {
      ctx.beginPath();
      ctx.moveTo(76 + Math.sin(y) * 6, y);
      ctx.lineTo(W - 76, y + Math.sin(y * 0.07) * 12);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  const label = trueDoor ? "TRUE DOOR / 삭제 기록 복원" : official ? "OFFICIAL EXIT / 아카이브 승인" : "UNAUTHORIZED / 비인가 기억";
  const x = W - 374;
  const y = 76;
  roundRect(x, y, 298, 44, 14, trueDoor ? "rgba(16, 9, 43, 0.82)" : official ? "rgba(255, 247, 232, 0.84)" : "rgba(44, 15, 76, 0.72)");
  ctx.strokeStyle = trueDoor ? "#ffd166" : official ? palette[3] : "#ff5ba8";
  ctx.lineWidth = 2;
  roundedStroke(x, y, 298, 44, 14);
  ctx.fillStyle = official ? "#2c2851" : "#fff7e8";
  ctx.font = "1000 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x + 149, y + 27);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawObjectivePointer() {
  if (!hasCanvasGuidance()) return;
  if (!state.player) return;
  const mission = getMissionState();
  const target = mission.target;
  if (!target) return;

  const pulse = 1 + Math.sin(performance.now() / 150) * 0.12;
  const near = distance(state.player, target) < 58;
  const command = near ? recordCueLabel() || mission.title : mission.title;
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = "rgba(255, 209, 102, 0.92)";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#ffd166";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#fff7e8";
  ctx.font = "1000 13px Inter, sans-serif";
  ctx.textAlign = "center";
  roundRect(-58, -60, 116, 26, 13, near ? "rgba(255, 91, 168, 0.92)" : "rgba(16, 9, 43, 0.82)");
  ctx.fillStyle = "#fff7e8";
  ctx.fillText(command, 0, -42);
  ctx.restore();

  const dx = target.x - state.player.x;
  const dy = target.y - state.player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 90) return;
  const angle = Math.atan2(dy, dx);
  const x = state.player.x + Math.cos(angle) * 46;
  const y = state.player.y + Math.sin(angle) * 46;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(255, 209, 102, 0.9)";
  ctx.strokeStyle = "rgba(17, 17, 53, 0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-9, -11);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-9, 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawRoomIntroOverlay() {
  if (state.roomIntroTimer <= 0) return;
  const room = rooms[state.roomIndex];
  const alpha = clamp(state.roomIntroTimer / 2.3, 0, 1);
  ctx.save();
  ctx.globalAlpha = Math.min(0.96, alpha * 1.15);
  roundRect(270, 78, 420, 74, 14, "rgba(16, 9, 43, 0.72)");
  ctx.strokeStyle = "rgba(255, 255, 255, 0.68)";
  ctx.lineWidth = 2;
  roundedStroke(270, 78, 420, 74, 14);
  ctx.fillStyle = "#1edcc5";
  ctx.font = "1000 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`방 ${state.roomIndex + 1}`, W / 2, 98);
  ctx.fillStyle = "#fff7e8";
  ctx.font = "1000 24px Inter, sans-serif";
  ctx.fillText(room.name, W / 2, 126);
  ctx.fillStyle = "#fff2bd";
  ctx.font = "900 12px Inter, sans-serif";
  ctx.fillText(room.tip, W / 2, 144);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawCrashHint() {
  if (!state.crashInfo) return;
  const info = state.crashInfo;
  const pulse = 1 + Math.sin(performance.now() / 75) * 0.16;
  ctx.save();
  ctx.translate(info.x, info.y);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = "#ff5ba8";
  ctx.lineWidth = 5;
  ctx.shadowColor = "#ff5ba8";
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(22, 0);
  ctx.moveTo(0, -22);
  ctx.lineTo(0, 22);
  ctx.stroke();
  ctx.restore();
}

function drawTimeline() {
  const x = 230;
  const y = 492;
  const w = 500;
  const h = 30;
  const echoEnds = state.echoes.map((echo) => echo.samples.at(-1)?.t ?? 0);
  const trackLength = Math.max(RECORD_GUIDE_SECONDS, state.replayTime, ...echoEnds);
  ctx.save();
  roundRect(x, y, w, h, 14, "rgba(16, 9, 43, 0.72)");
  ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
  ctx.lineWidth = 2;
  roundedStroke(x, y, w, h, 14);

  for (let i = 0; i <= 3; i += 1) {
    const tx = x + (w * i) / 3;
    ctx.strokeStyle = i === 0 || i === 3 ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(tx, y + 6);
    ctx.lineTo(tx, y + h - 6);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "900 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round((trackLength * i) / 3)}초`, tx, y - 5);
  }

  for (const echo of state.echoes) {
    const end = echo.samples.at(-1)?.t ?? 0;
    const ex = x + clamp(end / trackLength, 0, 1) * w;
    ctx.fillStyle = echo.color;
    ctx.beginPath();
    ctx.arc(ex, y + h / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const markerX = x + clamp(state.replayTime / trackLength, 0, 1) * w;
  const grd = ctx.createLinearGradient(x, 0, x + w, 0);
  grd.addColorStop(0, "#1edcc5");
  grd.addColorStop(0.55, "#ffd166");
  grd.addColorStop(1, "#ff5ba8");
  ctx.fillStyle = grd;
  roundRect(x + 6, y + 10, Math.max(0, markerX - x - 12), 10, 5, grd);
  ctx.fillStyle = "#fff7e8";
  ctx.strokeStyle = "#151342";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(markerX, y + h / 2, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#151342";
  ctx.font = "1000 11px Inter, sans-serif";
  ctx.fillText("진행", markerX, y + h + 15);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawModeBadge() {
  const mode =
    state.itemMode === "small"
      ? { title: "소형", body: "좁은 문 통과", color: "#1edcc5" }
      : state.itemMode === "big"
        ? { title: "중량", body: "무거운 스위치", color: "#ffd166" }
      : { title: "기본", body: "변형 없음", color: "#fff7e8" };
  const dashReady = state.dashCooldown <= 0.02;
  const syncReady = state.syncCooldown <= 0.02 && Boolean(nearestEcho(112));
  const x = 28;
  const y = 442;
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
  ctx.shadowBlur = 18;
  roundRect(x, y, 174, 82, 12, "rgba(16, 9, 43, 0.72)");
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 2;
  roundedStroke(x, y, 174, 82, 12);
  ctx.shadowBlur = 0;
  ctx.fillStyle = mode.color;
  ctx.font = "1000 16px Inter, sans-serif";
  ctx.fillText(mode.title, x + 16, y + 25);
  ctx.fillStyle = "rgba(255, 247, 232, 0.82)";
  ctx.font = "850 11px Inter, sans-serif";
  ctx.fillText(mode.body, x + 16, y + 43);
  ctx.fillStyle = state.syncRush > 0 ? "#ffd166" : state.dashCharge ? "#ffd166" : dashReady ? "#1edcc5" : "#ff5ba8";
  ctx.font = "1000 10px Inter, sans-serif";
  ctx.fillText(state.syncRush > 0 ? `싱크 러시 ${state.syncRush.toFixed(1)}초` : state.dashCharge ? "부스트 준비" : dashReady ? "Space 준비" : `대시 ${state.dashCooldown.toFixed(1)}초`, x + 16, y + 58);
  ctx.fillStyle = state.phaseTimer > 0.02 ? "#b261ff" : syncReady ? "#ffd166" : "rgba(255, 247, 232, 0.6)";
  ctx.fillText(state.phaseTimer > 0.02 ? `위상 ${state.phaseTimer.toFixed(1)}초` : syncReady ? "E 싱크 가능" : state.echoes.length ? (state.syncCooldown > 0.02 ? `싱크 ${state.syncCooldown.toFixed(1)}초` : "고스트 곁에서 E") : "고스트 후 E 싱크", x + 16, y + 73);
  ctx.restore();
}

function drawAfterimageStatus() {
  const specialRoom = state.roomIndex >= JUDGE_CLEAR_INDEX;
  const boxW = 236;
  const x = specialRoom ? 76 : W - boxW - 28;
  const y = specialRoom ? 130 : 76;
  const activeCount = state.echoes.filter((echo) => !echoHasReachedEnd(echo)).length;
  const label = state.echoes.length
    ? activeCount
      ? `잔상 재생 중 · ${activeCount}/${state.echoes.length}`
      : `잔상 대기 · ${state.echoes.length}/${MAX_GHOSTS}`
    : "R 기록 · 실패 로그 저장";
  const hint = state.echoes.length
    ? state.echoes.map((echo) => `G${echo.id}:${compactEchoRole(describeEchoRole(echo))}`).join(" ")
    : "먼저 실패하세요";

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
  ctx.shadowBlur = 18;
  roundRect(x, y, boxW, 70, 14, "rgba(16, 9, 43, 0.72)");
  ctx.strokeStyle = state.echoes.length ? "rgba(30, 220, 197, 0.72)" : "rgba(255, 209, 102, 0.76)";
  ctx.lineWidth = 2;
  roundedStroke(x, y, boxW, 70, 14);
  ctx.shadowBlur = 0;
  ctx.fillStyle = state.echoes.length ? "#1edcc5" : "#ffd166";
  ctx.font = "1000 12px Inter, sans-serif";
  ctx.fillText(label, x + 14, y + 25);
  ctx.fillStyle = "#fff7e8";
  ctx.font = state.echoes.length > 2 ? "1000 13px Inter, sans-serif" : "1000 18px Inter, sans-serif";
  ctx.fillText(hint, x + 14, y + 50);
  if (state.echoes.length) {
    let dotX = x + 14;
    for (const echo of state.echoes) {
      ctx.fillStyle = echo.color;
      ctx.beginPath();
      ctx.arc(dotX, y + 59, 4, 0, Math.PI * 2);
      ctx.fill();
      dotX += 14;
    }
  }
  ctx.restore();
}

function drawFlowBadge() {
  if (state.flowTimer <= 0 || state.flowCombo < 2) return;
  const alpha = clamp(state.flowTimer / 1.7, 0, 1);
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha * 1.2);
  ctx.translate(W / 2, 64);
  ctx.shadowColor = "#ffd166";
  ctx.shadowBlur = 24;
  roundRect(-80, -23, 160, 46, 20, "rgba(16, 9, 43, 0.72)");
  ctx.strokeStyle = "rgba(255, 209, 102, 0.9)";
  ctx.lineWidth = 2;
  roundedStroke(-80, -23, 160, 46, 20);
  ctx.fillStyle = "#ffd166";
  ctx.font = "1000 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(state.lastFlowBonus > 0 ? `CHAIN -${state.lastFlowBonus.toFixed(1)}초` : "SYNC CHAIN", 0, -4);
  ctx.fillStyle = "#fff7e8";
  ctx.font = "1000 20px Inter, sans-serif";
  ctx.fillText(`x${state.flowCombo}`, 0, 18);
  ctx.restore();
}

function drawObjects() {
  const room = rooms[state.roomIndex];
  const active = activeSwitches();

  drawSwitchConnections(room, active);

  for (const laser of room.lasers) {
    const on = laserPowered(laser);
    const blocker = on ? laserBlocker(laser) : null;
    drawLaserBeam(laser, on, blocker);
  }

  for (const gate of room.gates) {
    const open = gateOpen(gate);
    drawEnergyGate(gate, open);
  }

  for (const sw of room.switches) {
    const on = active.has(sw.id);
    const color = on ? switchColor(sw.id) : "#7a4df2";
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = on ? 24 : 8;
    if (on) drawSprite("switch-glow", sw.x, sw.y + 5, 86, 76, { alpha: 0.65 });
    drawSprite(on ? "switch-on" : "switch-off", sw.x, sw.y + 4, 68, 50);
    ctx.fillStyle = on ? "#111135" : "#7a4df2";
    ctx.font = "1000 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(sw.label, sw.x, sw.y + 11);
    if (sw.requires) {
      const required = sw.requires === "big" ? "중량" : "소형";
      const ready = actorCanPress(state.player, sw);
      ctx.shadowBlur = ready ? 16 : 0;
      ctx.shadowColor = ready ? color : "transparent";
      roundRect(sw.x - 31, sw.y + 28, 62, 20, 10, ready ? "rgba(30, 220, 197, 0.92)" : "rgba(16, 9, 43, 0.78)");
      ctx.fillStyle = ready ? "#111135" : sw.requires === "big" ? "#ffd166" : "#1edcc5";
      ctx.font = "1000 10px Inter, sans-serif";
      ctx.fillText(required, sw.x, sw.y + 42);
    }
    ctx.restore();
  }

  for (let i = 0; i < room.cores.length; i += 1) {
    if (state.collected.has(i)) continue;
    const core = room.cores[i];
    const pulse = 1 + Math.sin(performance.now() / 180 + i) * 0.08;
    ctx.save();
    ctx.translate(core.x, core.y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = i % 2 ? "#b261ff" : "#1edcc5";
    ctx.shadowBlur = 22;
    drawSprite("floor-pad-on", 0, 22, 62, 28, { alpha: 0.62 });
    if (!drawSprite(i % 2 ? "crystal-purple" : "crystal-teal", 0, -6, 44, 56)) {
      ctx.rotate(performance.now() / 700);
      star(0, 0, 22, 10, "#ffd166");
    }
    ctx.restore();
  }

  for (let i = 0; i < (room.items ?? []).length; i += 1) {
    if (state.itemsCollected.has(i)) continue;
    const item = room.items[i];
    const pulse = 1 + Math.sin(performance.now() / 150 + i) * 0.08;
    const itemColor = item.type === "grow" ? "#ffd166" : item.type === "shrink" ? "#1edcc5" : item.type === "phase" ? "#b261ff" : "#ff5ba8";
    const itemSprite = item.type === "grow" ? "crystal-pink" : item.type === "shrink" ? "crystal-teal" : item.type === "phase" ? "crystal-purple" : "core-orb-teal";
    const itemLabel = item.type === "grow" ? "중량" : item.type === "shrink" ? "소형" : item.type === "phase" ? "위상" : "부스트";
    const itemMark = item.type === "grow" ? "B" : item.type === "shrink" ? "S" : item.type === "phase" ? "P" : "+";
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = itemColor;
    ctx.shadowBlur = 22;
    drawSprite("floor-pad-on", 0, 16, 54, 24, { alpha: 0.55 });
    if (!drawSprite(itemSprite, 0, -6, item.type === "dash" ? 48 : 42, item.type === "dash" ? 48 : 50)) {
      ctx.strokeStyle = itemColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = itemColor;
      ctx.font = "1000 13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(itemMark, 0, 5);
    }
    ctx.fillStyle = "#fff7e8";
    ctx.font = "1000 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(itemLabel, 0, 39);
    ctx.restore();
  }

  for (const gate of room.phaseGates ?? []) {
    drawPhaseGate(gate);
  }

  for (const gate of room.sizeGates ?? []) {
    drawSizeGate(gate);
  }

  for (const gate of room.dashGates ?? []) {
    drawDashGate(gate);
  }

  const exitOpen = canExit();
  const exit = room.exit;
  ctx.save();
  ctx.shadowColor = exitOpen ? "#1edcc5" : "#7a4df2";
  ctx.shadowBlur = exitOpen ? 28 : 10;
  drawSprite("portal-pad", exit.x + exit.w / 2, exit.y + exit.h - 2, 82, 32, { alpha: exitOpen ? 0.8 : 0.42 });
  if (!drawSprite(exitOpen ? "door-open" : "door-closed", exit.x + exit.w / 2, exit.y + exit.h / 2 - 5, 88, 94)) {
    roundRect(exit.x, exit.y, exit.w, exit.h, 18, exitOpen ? "rgba(30, 220, 197, 0.35)" : "rgba(30, 18, 74, 0.48)");
    ctx.strokeStyle = exitOpen ? "#1edcc5" : "rgba(255,255,255,0.6)";
    ctx.lineWidth = 4;
    roundedStroke(exit.x, exit.y, exit.w, exit.h, 18);
  }
  if (exitOpen) {
    const cx = exit.x + exit.w / 2;
    const cy = exit.y + exit.h / 2;
    const pulse = 1 + Math.sin(performance.now() / 120) * 0.08;
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255, 209, 102, 0.92)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, exitReachRadius(exit) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 209, 102, 0.16)";
    ctx.beginPath();
    ctx.arc(cx, cy, exitReachRadius(exit) * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  if (state.roomIndex === rooms.length - 1) drawTrueDoorBeacon(exit, exitOpen);
  ctx.restore();
}

function drawTrueDoorBeacon(exit, open) {
  const cx = exit.x + exit.w / 2;
  const cy = exit.y + exit.h / 2 - 4;
  const t = performance.now() / 1000;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i += 1) {
    const radius = 48 + i * 24 + Math.sin(t * 3 + i) * 4;
    ctx.strokeStyle = `rgba(255, 209, 102, ${open ? 0.42 - i * 0.08 : 0.22 - i * 0.04})`;
    ctx.lineWidth = open ? 4 : 2;
    ctx.setLineDash(i % 2 ? [8, 12] : []);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (open) {
    drawSprite("final-explosion", cx, cy, 170, 150, { alpha: 0.58 });
    ctx.globalCompositeOperation = "source-over";
    roundRect(cx - 56, cy - 88, 112, 28, 14, "rgba(16, 9, 43, 0.82)");
    ctx.strokeStyle = "rgba(255, 209, 102, 0.92)";
    ctx.lineWidth = 2;
    roundedStroke(cx - 56, cy - 88, 112, 28, 14);
    ctx.fillStyle = "#ffd166";
    ctx.font = "1000 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("전부 나야", cx, cy - 69);
  }
  ctx.restore();
}

function drawSizeGate(gate) {
  const open = sizeGateOpen(gate);
  const color = gate.need === "small" ? "#1edcc5" : "#ffd166";
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = open ? 10 : 22;
  roundRect(gate.x, gate.y, gate.w, gate.h, 10, open ? "rgba(30, 220, 197, 0.08)" : "rgba(16, 9, 43, 0.7)");
  ctx.strokeStyle = open ? "rgba(255,255,255,0.38)" : color;
  ctx.lineWidth = open ? 2 : 4;
  roundedStroke(gate.x, gate.y, gate.w, gate.h, 10);
  if (!open) {
    ctx.fillStyle = color;
    ctx.font = "1000 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(gate.need === "small" ? "소형" : "중량", gate.x + gate.w / 2, gate.y - 8);
    for (let i = 0; i < 3; i += 1) {
      const yy = gate.y + 18 + i * ((gate.h - 36) / 2);
      ctx.beginPath();
      ctx.moveTo(gate.x + 8, yy);
      ctx.lineTo(gate.x + gate.w - 8, yy);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPhaseGate(gate) {
  const open = phaseGateOpen(gate);
  const cx = gate.x + gate.w / 2;
  const cy = gate.y + gate.h / 2;
  const pulse = 0.45 + Math.sin(performance.now() / 125) * 0.13;
  ctx.save();
  ctx.shadowColor = "#b261ff";
  ctx.shadowBlur = open ? 10 : 26;
  roundRect(gate.x, gate.y, gate.w, gate.h, 14, open ? "rgba(178, 97, 255, 0.08)" : "rgba(24, 9, 52, 0.72)");
  ctx.strokeStyle = open ? "rgba(178, 97, 255, 0.42)" : "rgba(178, 97, 255, 0.96)";
  ctx.lineWidth = open ? 2 : 4;
  roundedStroke(gate.x, gate.y, gate.w, gate.h, 14);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(178, 97, 255, ${open ? 0.22 : pulse})`;
  ctx.lineWidth = 3;
  for (let y = gate.y + 18; y < gate.y + gate.h - 14; y += 28) {
    ctx.beginPath();
    ctx.moveTo(gate.x + gate.w / 2, y);
    ctx.quadraticCurveTo(gate.x - 20, y + 10, gate.x + gate.w / 2, y + 20);
    ctx.quadraticCurveTo(gate.x + gate.w + 20, y + 30, gate.x + gate.w / 2, y + 40);
    ctx.stroke();
  }
  if (!open) drawSprite("crystal-purple", cx, cy, 40, 52, { alpha: 0.42 });
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = open ? "rgba(255, 247, 232, 0.62)" : "#d8b6ff";
  ctx.font = "1000 10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(open ? "통과" : "위상막", cx, gate.y - 12);
  ctx.restore();
}

function drawDashGate(gate) {
  const broken = dashGateBroken(gate);
  const cx = gate.x + gate.w / 2;
  const cy = gate.y + gate.h / 2;
  if (broken) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawSprite("gate-streak-teal", cx, cy, 86, gate.h + 36, { alpha: 0.34 });
    ctx.restore();
    return;
  }

  const pulse = 0.5 + Math.sin(performance.now() / 135) * 0.12;
  const label = gate.syncOnly ? "싱크 대시" : "부스트";
  ctx.save();
  ctx.shadowColor = state.dashCharge ? "#1edcc5" : "#ff5ba8";
  ctx.shadowBlur = state.dashCharge ? 26 : 18;
  roundRect(gate.x, gate.y, gate.w, gate.h, 14, "rgba(20, 8, 44, 0.76)");
  ctx.strokeStyle = state.dashCharge ? "rgba(30, 220, 197, 0.95)" : "rgba(255, 91, 168, 0.88)";
  ctx.lineWidth = 4;
  roundedStroke(gate.x, gate.y, gate.w, gate.h, 14);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(255, 91, 168, ${pulse})`;
  ctx.lineWidth = 3;
  for (let y = gate.y + 26; y < gate.y + gate.h - 18; y += 34) {
    ctx.beginPath();
    ctx.moveTo(gate.x + 8, y);
    ctx.lineTo(gate.x + gate.w - 8, y + 16);
    ctx.stroke();
  }
  drawSprite("laser-gate-pink", cx, cy, gate.w + 46, gate.h + 38, { alpha: 0.5 });
  drawWarningBadge(cx, gate.y - 21, state.dashCharge);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = state.dashCharge ? "#1edcc5" : "#ff5ba8";
  ctx.font = "1000 10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, gate.y - 44);
  ctx.restore();
}

function drawWarningBadge(x, y, ready) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowColor = ready ? "#1edcc5" : "#ff5ba8";
  ctx.shadowBlur = 14;
  ctx.fillStyle = ready ? "rgba(30, 220, 197, 0.96)" : "rgba(255, 91, 168, 0.96)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 19);
  ctx.lineTo(x + 22, y + 17);
  ctx.lineTo(x - 22, y + 17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111135";
  ctx.font = "1000 20px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("!", x, y + 11);
  ctx.restore();
}

function drawSwitchConnections(room, active) {
  for (const sw of room.switches) {
    if (!active.has(sw.id)) continue;
    const color = switchColor(sw.id);
    const targets = [
      ...room.gates.filter((gate) => gate.needs.includes(sw.id)).map((gate) => ({ x: gate.x + gate.w / 2, y: gate.y + gate.h / 2 })),
      ...room.lasers.filter((laser) => laser.offWhen?.includes(sw.id)).map((laser) => ({ x: (laser.x1 + laser.x2) / 2, y: (laser.y1 + laser.y2) / 2 })),
    ];
    for (const target of targets) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 12]);
      ctx.beginPath();
      ctx.moveTo(sw.x, sw.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function switchColor(id) {
  const room = rooms[state.roomIndex];
  const sw = room.switches.find((item) => item.id === id);
  if (!sw) return "#1edcc5";
  const radius = 35 + state.echoPower * 3;
  for (const echo of state.echoes) {
    const pos = echoPosition(echo, state.replayTime);
    if (pos && distance(pos, sw) < radius) return echo.color;
  }
  if (distance(state.player, sw) < radius && actorCanPress(state.player, sw)) return "#1edcc5";
  return "#1edcc5";
}

function drawLaserBeam(laser, on, blocker = null) {
  const dx = laser.x2 - laser.x1;
  const dy = laser.y2 - laser.y1;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const blocked = Boolean(blocker);
  const color = on || blocked ? "#ff4f8f" : "#1edcc5";
  const core = on || blocked ? "rgba(255, 255, 255, 0.88)" : "rgba(30, 220, 197, 0.28)";
  const start = -len / 2 + 18;
  const end = len / 2 - 18;
  const localBlock = blocker
    ? ((blocker.x - laser.x1) * dx + (blocker.y - laser.y1) * dy) / Math.max(1, len) - len / 2
    : null;
  const gap = 34;
  const segments = blocked ? [[start, localBlock - gap], [localBlock + gap, end]] : [[start, end]];

  ctx.save();
  ctx.translate((laser.x1 + laser.x2) / 2, (laser.y1 + laser.y2) / 2);
  ctx.rotate(angle);
  drawSprite(on || blocked ? "traffic-red" : "traffic-green", -len / 2, 0, 30, 42, { alpha: on || blocked ? 0.96 : 0.72 });
  drawSprite(on || blocked ? "traffic-red" : "traffic-green", len / 2, 0, 30, 42, { alpha: on || blocked ? 0.96 : 0.72, flipX: true });

  for (const [a, b] of segments) {
    if (b <= a) continue;
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = on || blocked ? 22 : 8;
    ctx.strokeStyle = on || blocked ? "rgba(255, 79, 143, 0.22)" : "rgba(30, 220, 197, 0.18)";
    ctx.lineWidth = on || blocked ? 19 : 8;
    ctx.setLineDash(on || blocked ? [] : [12, 12]);
    ctx.beginPath();
    ctx.moveTo(a, 0);
    ctx.lineTo(b, 0);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = on || blocked ? 8 : 4;
    ctx.beginPath();
    ctx.moveTo(a + 4, 0);
    ctx.lineTo(b - 4, 0);
    ctx.stroke();

    ctx.strokeStyle = core;
    ctx.lineWidth = on || blocked ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(a + 8, 0);
    ctx.lineTo(b - 8, 0);
    ctx.stroke();
  }

  if (blocked) {
    drawSprite("laser-impact", localBlock, 0, 46, 38, { alpha: 0.9 });
  } else if (on && Math.sin(performance.now() / 80) > 0.45) {
    drawSprite("laser-impact", rand(-len / 3, len / 3), 0, 34, 30, { alpha: 0.45 });
  }
  ctx.restore();
}

function drawEnergyGate(gate, open) {
  const x = gate.x;
  const y = gate.y;
  const w = gate.w;
  const h = gate.h;
  const color = open ? "#1edcc5" : "#ff4f8f";
  const t = performance.now() / 1000;

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = open ? 10 : 20;
  roundRect(x - 7, y - 9, w + 14, h + 18, 10, open ? "rgba(30, 220, 197, 0.08)" : "rgba(255, 79, 143, 0.12)");
  ctx.strokeStyle = open ? "rgba(30, 220, 197, 0.42)" : "rgba(255, 79, 143, 0.82)";
  ctx.lineWidth = open ? 2 : 3;
  roundedStroke(x - 7, y - 9, w + 14, h + 18, 10);

  ctx.fillStyle = "rgba(16, 18, 42, 0.76)";
  roundRect(x - 9, y - 13, 8, h + 26, 4, "rgba(16, 18, 42, 0.76)");
  roundRect(x + w + 1, y - 13, 8, h + 26, 4, "rgba(16, 18, 42, 0.76)");
  ctx.fillStyle = color;
  ctx.fillRect(x - 6, y + 8, 2, h - 16);
  ctx.fillRect(x + w + 5, y + 8, 2, h - 16);

  if (!open) {
    for (let i = 0; i < 5; i += 1) {
      const yy = y + 18 + (h - 36) * (i / 4) + Math.sin(t * 6 + i) * 2;
      ctx.strokeStyle = i % 2 ? "rgba(255, 255, 255, 0.82)" : color;
      ctx.lineWidth = i % 2 ? 2 : 5;
      ctx.beginPath();
      ctx.moveTo(x + 2, yy);
      ctx.lineTo(x + w - 2, yy);
      ctx.stroke();
    }
  } else {
    drawSprite("gate-streak-teal", x + w / 2, y + h / 2, 88, Math.max(80, h * 0.8), { alpha: 0.55 });
    ctx.fillStyle = "#1edcc5";
    ctx.font = "1000 13px Inter, sans-serif";
    ctx.fillText("열림", x - 6, y - 12);
  }
  ctx.restore();
}

function drawEchoes() {
  for (const echo of state.echoes) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = echo.color;
    ctx.shadowColor = echo.color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 6;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -performance.now() / 45;
    ctx.beginPath();
    echo.samples.forEach((sample, index) => {
      if (index === 0) ctx.moveTo(sample.x, sample.y);
      else ctx.lineTo(sample.x, sample.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "#fff7e8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    echo.samples.forEach((sample, index) => {
      if (index === 0) ctx.moveTo(sample.x, sample.y);
      else ctx.lineTo(sample.x, sample.y);
    });
    ctx.stroke();
    const hold = echoHoldPosition(echo);
    if (hold) {
      ctx.globalAlpha = 0.6;
      drawRunner(hold.x, hold.y, 16, echo.color, 0.6, false, hold);
      drawGhostBadge(hold.x, hold.y - 54, compactEchoRole(describeEchoRole(echo)), echo.color);
    }
    const pos = echoPosition(echo, state.replayTime);
    if (pos) {
      ctx.globalAlpha = 0.9;
      drawRunner(pos.x, pos.y, 16, echo.color, 0.88, pos.dash, pos);
      drawGhostBadge(pos.x, pos.y - 54, `G${echo.id}`, echo.color);
    }
    ctx.restore();
  }
}

function drawBestGhost() {
  if (!state.bestRoute?.length || state.screen === "stage-result" || isTutorialRoom()) return;
  const pos = tracePosition(state.bestRoute, state.stageTime);
  if (!pos) return;
  const color = "#6fcaff";
  const tailStart = Math.max(0, state.stageTime - 5);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -performance.now() / 38;
  ctx.strokeStyle = "rgba(111, 202, 255, 0.42)";
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  let drawing = false;
  for (const sample of state.bestRoute) {
    if (sample.t < tailStart) {
      drawing = false;
      continue;
    }
    if (sample.t > state.stageTime) break;
    if (sample.reset || !drawing) {
      ctx.moveTo(sample.x, sample.y);
      drawing = true;
    } else {
      ctx.lineTo(sample.x, sample.y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.globalAlpha = 0.26;
  drawRunner(pos.x, pos.y, 15, color, 0.26, pos.dash, pos);
  ctx.globalAlpha = 1;
  drawGhostBadge(pos.x, pos.y - 54, "PB", color);
  ctx.restore();
}

function tracePosition(samples, t) {
  if (!samples?.length) return null;
  if (t <= samples[0].t) return samples[0];
  for (let i = 1; i < samples.length; i += 1) {
    const a = samples[i - 1];
    const b = samples[i];
    if (t <= b.t) {
      if (b.reset || Math.abs(b.t - a.t) < 0.001) return b;
      const k = (t - a.t) / Math.max(0.001, b.t - a.t);
      return {
        x: lerp(a.x, b.x, k),
        y: lerp(a.y, b.y, k),
        facingX: lerp(a.facingX ?? 1, b.facingX ?? 1, k),
        facingY: lerp(a.facingY ?? 0, b.facingY ?? 0, k),
        dash: a.dash || b.dash,
        scale: lerp(a.scale ?? 1, b.scale ?? 1, k),
      };
    }
  }
  return samples[samples.length - 1];
}

function drawSyncTether() {
  if (state.screen !== "game" || state.syncCooldown > 0.02 || !state.echoes.length) return;
  const target = nearestEcho(112);
  if (!target) return;
  const pulse = 0.5 + Math.sin(performance.now() / 95) * 0.2;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(255, 209, 102, ${0.32 + pulse * 0.35})`;
  ctx.shadowColor = "#ffd166";
  ctx.shadowBlur = 18;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 12]);
  ctx.lineDashOffset = -performance.now() / 25;
  ctx.beginPath();
  ctx.moveTo(state.player.x, state.player.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(target.x, target.y, 36 + pulse * 6, 0, Math.PI * 2);
  ctx.stroke();
  roundRect(target.x - 26, target.y - 78, 52, 28, 14, "rgba(16, 9, 43, 0.82)");
  ctx.fillStyle = "#ffd166";
  ctx.font = "1000 13px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("E 싱크", target.x, target.y - 59);
  ctx.restore();
}

function echoHoldPosition(echo) {
  const room = rooms[echo.room] ?? rooms[state.roomIndex];
  if (!echoHasReachedEnd(echo)) return null;
  const last = echo.samples.at(-1);
  if (!last) return null;
  const sw = room.switches.find((item) => distance(last, item) < 64 && actorCanPress(last, item));
  return sw ? { ...last, x: sw.x, y: sw.y } : null;
}

function drawGhostBadge(x, y, label, color) {
  const width = Math.max(36, Math.min(94, label.length * 12 + 20));
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  roundRect(x - width / 2, y - 10, width, 20, 10, "rgba(17, 17, 53, 0.86)");
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundedStroke(x - width / 2, y - 10, width, 20, 10);
  ctx.fillStyle = "#ffffff";
  ctx.font = "1000 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 4);
  ctx.restore();
}

function echoSpriteFor(color) {
  if (color === "#ff5ba8") return "ghost-pink";
  if (color === "#ffd166") return "ghost-gold";
  if (color === "#b261ff") return "ghost-purple";
  return "ghost-teal";
}

function drawPlayer() {
  if (state.syncPulse > 0) {
    const k = state.syncPulse / 0.75;
    ctx.save();
    ctx.globalAlpha = 0.22 + k * 0.28;
    ctx.strokeStyle = "#ffd166";
    ctx.shadowColor = "#ffd166";
    ctx.shadowBlur = 24;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y + 4, 34 + (1 - k) * 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  drawRunner(state.player.x, state.player.y, PLAYER_R, "#fff3c7", 1, state.dash > 0, state.player);
}

function drawRecordCue() {
  const label = recordCueLabel();
  if (!label) return;
  const x = state.player.x;
  const y = state.player.y - 76;
  const pulse = 1 + Math.sin(performance.now() / 90) * 0.04;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = "#ff5ba8";
  ctx.shadowBlur = 22;
  roundRect(-72, -18, 144, 36, 18, "rgba(16, 9, 43, 0.9)");
  ctx.strokeStyle = "#ff5ba8";
  ctx.lineWidth = 2;
  roundedStroke(-72, -18, 144, 36, 18);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff7e8";
  ctx.font = "1000 13px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, 0, 5);
  ctx.restore();
}

function recordCueLabel() {
  if (state.screen !== "game" || state.echoes.length >= MAX_GHOSTS || state.crashTimer > 0) return "";
  const room = rooms[state.roomIndex];
  const nextGhost = `G${state.echoes.length + 1}`;
  for (const sw of room.switches) {
    if (distance(state.player, sw) < 42 && actorCanPress(state.player, sw)) return `R: ${nextGhost} 기록`;
  }
  for (const laser of room.lasers) {
    if (laser.blockable && laserBlocker(laser)) continue;
    const spot = laser.blockable ? laserRecordSpot(laser) : null;
    const nearRecordSpot = spot && distance(state.player, spot) < 72;
    const nearBeamEdge = pointLineDistance(state.player.x, state.player.y, laser.x1, laser.y1, laser.x2, laser.y2) < playerRadius() + 18;
    if (laser.blockable && laserPowered(laser) && (nearRecordSpot || nearBeamEdge)) {
      return `R: ${nextGhost} 보호`;
    }
  }
  return "";
}

function drawRunner(x, y, r, color, alpha = 1, dash = false, facing = state.player) {
  const fx = facing?.facingX ?? state.lastX;
  const fy = facing?.facingY ?? state.lastY;
  const actorScale = facing?.scale ?? 1;
  const side = fx < -0.22 ? -1 : 1;
  const isEcho = alpha < 0.95;
  const movingSide = Math.abs(fx) > Math.abs(fy) * 0.9;
  const spriteName = isEcho
    ? echoSpriteFor(color)
    : state.crashTimer > 0
      ? "hero-hit"
      : dash
        ? "hero-dash"
        : movingSide
          ? "hero-run"
          : "hero-front";
  const h = (isEcho ? r * 3.9 : dash ? r * 4.2 : r * 4.8) * actorScale;
  const image = sprites[spriteName];
  if (image?.complete && image.naturalWidth) {
    const w = (h * image.naturalWidth) / image.naturalHeight;
    if (dash && !isEcho) {
      const boosted = state.powerDash > 0.01;
      drawSprite("dash-trail-teal", x - side * 46, y + 6, boosted ? 152 : 126, boosted ? 48 : 38, { alpha: boosted ? 0.92 : 0.72, flipX: side < 0 });
    }
    drawSprite(spriteName, x, y - (dash ? 5 : 13), w, h, { alpha, flipX: side < 0 && spriteName !== "hero-front" });
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = dash ? "#ff5ba8" : "#ffffff";
  ctx.shadowBlur = dash ? 22 : 8;
  ctx.fillStyle = color;
  ctx.strokeStyle = "#151342";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  const isBack = fy < -0.55 && Math.abs(fx) < 0.72;
  ctx.fillStyle = "#151342";
  if (isBack) {
    ctx.fillStyle = "rgba(111, 202, 255, 0.9)";
    roundRect(x - 8, y - 3, 16, 8, 4, "rgba(111, 202, 255, 0.9)");
  } else if (Math.abs(fx) > Math.abs(fy) * 1.15) {
    ctx.beginPath();
    ctx.arc(x + 2 * side, y - 4, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb000";
    ctx.beginPath();
    ctx.moveTo(x + 7 * side, y + 1);
    ctx.lineTo(x + 17 * side, y + 5);
    ctx.lineTo(x + 7 * side, y + 9);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(x - 6, y - 4, 2.4, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 4, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb000";
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 3);
    ctx.quadraticCurveTo(x, y + 10, x + 6, y + 3);
    ctx.strokeStyle = "#ffb000";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.strokeStyle = "#151342";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x, y - r - 15);
  ctx.stroke();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(x, y - r - 17, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin);
    ctx.fillStyle = p.color;
    if (p.square) ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
    else {
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawFloatingText() {
  ctx.textAlign = "center";
  for (const text of state.texts) {
    ctx.globalAlpha = clamp(text.life / 0.85, 0, 1);
    ctx.fillStyle = text.color;
    ctx.font = "1000 19px Inter, sans-serif";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(17, 17, 53, 0.5)";
    ctx.strokeText(text.text, text.x, text.y);
    ctx.fillText(text.text, text.x, text.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function drawRect(rect, fill, stroke) {
  const glow = stroke || "rgba(30, 220, 197, 0.35)";
  const horizontal = rect.w >= rect.h;
  const grad = horizontal
    ? ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h)
    : ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.28)");
  grad.addColorStop(0.22, fill);
  grad.addColorStop(1, "rgba(12, 18, 38, 0.92)");
  roundRect(rect.x, rect.y, rect.w, rect.h, 8, grad);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
  ctx.lineWidth = 2;
  roundedStroke(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4, 6);
  ctx.strokeStyle = glow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (horizontal) {
    ctx.moveTo(rect.x + 10, rect.y + rect.h - 7);
    ctx.lineTo(rect.x + rect.w - 10, rect.y + rect.h - 7);
  } else {
    ctx.moveTo(rect.x + rect.w - 7, rect.y + 10);
    ctx.lineTo(rect.x + rect.w - 7, rect.y + rect.h - 10);
  }
  ctx.stroke();

  ctx.fillStyle = glow;
  const count = Math.max(1, Math.floor((horizontal ? rect.w : rect.h) / 52));
  for (let i = 0; i < count; i += 1) {
    const px = horizontal ? rect.x + 18 + i * 52 : rect.x + rect.w / 2 - 3;
    const py = horizontal ? rect.y + rect.h - 11 : rect.y + 18 + i * 52;
    ctx.fillRect(px, py, horizontal ? 18 : 6, horizontal ? 4 : 18);
  }
}

function drawSprite(name, x, y, w, h, options = {}) {
  const image = sprites[name];
  if (!image?.complete || !image.naturalWidth) return false;
  ctx.save();
  ctx.globalAlpha *= options.alpha ?? 1;
  if (options.flipX) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
  } else {
    ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
  }
  ctx.restore();
  return true;
}

function drawSpriteRect(name, rect, options = {}) {
  const image = sprites[name];
  if (!image?.complete || !image.naturalWidth) return false;
  ctx.save();
  ctx.globalAlpha *= options.alpha ?? 1;
  ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  return true;
}

function resolveCircleRect(circle, r, rect) {
  const cx = clamp(circle.x, rect.x, rect.x + rect.w);
  const cy = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - cx;
  const dy = circle.y - cy;
  const d = Math.hypot(dx, dy);
  if (d >= r || d === 0) {
    if (d === 0 && circle.x > rect.x && circle.x < rect.x + rect.w && circle.y > rect.y && circle.y < rect.y + rect.h) {
      circle.x = circle.px;
      circle.y = circle.py;
    }
    return;
  }
  const push = r - d;
  circle.x += (dx / d) * push;
  circle.y += (dy / d) * push;
}

function circleRectOverlap(circle, r, rect) {
  const cx = clamp(circle.x, rect.x, rect.x + rect.w);
  const cy = clamp(circle.y, rect.y, rect.y + rect.h);
  return Math.hypot(circle.x - cx, circle.y - cy) < r;
}

function pointLineDistance(px, py, x1, y1, x2, y2) {
  const ax = px - x1;
  const ay = py - y1;
  const bx = x2 - x1;
  const by = y2 - y1;
  const t = clamp((ax * bx + ay * by) / Math.max(1, bx * bx + by * by), 0, 1);
  return Math.hypot(px - (x1 + bx * t), py - (y1 + by * t));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function playerRadius() {
  return PLAYER_R * state.playerScale;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function echoColor(index) {
  return ["#1edcc5", "#ff5ba8", "#ffd166", "#b261ff"][index % 4];
}

function describeEchoRole(echo) {
  const room = rooms[echo.room] ?? rooms[state.roomIndex];
  const last = echo.samples.at(-1);
  if (!last) return room?.name ?? "ROOM";
  const radius = 64;
  const sw = room.switches.find((item) => distance(last, item) < radius && actorCanPress(last, item));
  if (sw) return `${sw.label} 유지`;
  const laser = room.lasers.find((item) => item.blockable && pointLineDistance(last.x, last.y, item.x1, item.y1, item.x2, item.y2) < radius);
  if (laser) return "레이저 보호";
  if (last.scale >= 1.18) return "중량 루트";
  if (last.scale <= 0.82) return "소형 루트";
  return `${room?.name ?? "방"} 루트`;
}

function compactEchoRole(role) {
  if (!role) return "기록";
  if (role.includes("레이저")) return "방패";
  if (role.includes("중량")) return "중량";
  if (role.includes("소형")) return "소형";
  if (role.includes("유지")) return role.replace(" 유지", "");
  if (role.includes("위상")) return "위상";
  return "루트";
}

function echoEquipmentCopy(role) {
  if (role.includes("레이저")) {
    return { title: "방패 기록 장착", body: "빛 앞에 멈춘 실패가 다음 너를 지킨다." };
  }
  if (role.includes("유지")) {
    return { title: `${compactEchoRole(role)} 스위치 장착`, body: "스위치를 맡은 실패가 열린 문을 붙잡는다." };
  }
  if (role.includes("중량")) {
    return { title: "중량 기록 장착", body: "무거워진 실패가 눌러야 할 곳을 기억한다." };
  }
  if (role.includes("소형")) {
    return { title: "소형 기록 장착", body: "작아진 실패가 좁은 길을 대신 맡는다." };
  }
  return { title: "루트 기록 장착", body: roomMemoryAnchor() };
}

function formatPrecise(seconds) {
  if (!Number.isFinite(seconds)) return "--";
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
}

function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function roundRect(x, y, w, h, r, fill) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundedStroke(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();
}

function star(x, y, outer, inner, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? outer : inner;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function particle(x, y, color, r, vx, vy, life, square = false) {
  state.particles.push({ x, y, color, r, vx, vy, life, maxLife: life, square, spin: rand(0, 4) });
}

function burst(x, y, color, count = 16) {
  for (let i = 0; i < count; i += 1) {
    const a = rand(0, Math.PI * 2);
    const s = rand(70, 210);
    particle(x, y, color, rand(2, 5), Math.cos(a) * s, Math.sin(a) * s, rand(0.25, 0.7), Math.random() > 0.55);
  }
}

function sparkleEchoRoute(samples, color) {
  if (!samples?.length) return;
  const step = Math.max(1, Math.ceil(samples.length / 8));
  for (let i = 0; i < samples.length; i += step) {
    const sample = samples[i];
    particle(sample.x, sample.y, color, rand(2, 4), rand(-18, 18), rand(-46, -14), rand(0.35, 0.8), Math.random() > 0.5);
  }
}

function floating(text, x, y, color) {
  state.texts.push({ text, x, y, color, life: 0.85 });
}

function ensureAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playSfx(name) {
  const audio = ensureAudio();
  if (!audio) return;
  const patterns = {
    dash: [[520, 0.055, "sawtooth", 0.018, 0], [880, 0.075, "triangle", 0.014, 0.035]],
    record: [[330, 0.08, "triangle", 0.018, 0], [660, 0.1, "triangle", 0.016, 0.06]],
    item: [[720, 0.07, "sine", 0.016, 0], [980, 0.08, "triangle", 0.012, 0.045]],
    core: [[620, 0.09, "triangle", 0.018, 0], [1040, 0.13, "sine", 0.014, 0.065]],
    gate: [[240, 0.09, "sawtooth", 0.014, 0], [480, 0.16, "triangle", 0.018, 0.07]],
    clear: [[420, 0.08, "triangle", 0.018, 0], [720, 0.12, "triangle", 0.016, 0.08], [980, 0.16, "sine", 0.014, 0.17]],
    win: [[330, 0.1, "triangle", 0.02, 0], [660, 0.14, "triangle", 0.018, 0.09], [990, 0.2, "sine", 0.016, 0.2]],
    hit: [[160, 0.12, "sawtooth", 0.018, 0], [90, 0.18, "square", 0.012, 0.05]],
    undo: [[420, 0.07, "square", 0.012, 0], [220, 0.09, "triangle", 0.012, 0.055]],
    reset: [[260, 0.08, "triangle", 0.014, 0], [260, 0.08, "triangle", 0.014, 0.1]],
    pause: [[360, 0.08, "triangle", 0.012, 0], [240, 0.1, "triangle", 0.01, 0.06]],
    resume: [[300, 0.06, "triangle", 0.012, 0], [560, 0.1, "sine", 0.014, 0.055]],
    deny: [[140, 0.06, "square", 0.01, 0], [110, 0.08, "triangle", 0.008, 0.045]],
  };
  for (const [freq, duration, type, volume, delay] of patterns[name] ?? []) {
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }
}

function showToast(title, body = "") {
  centerToast.innerHTML = body ? `<strong>${title}</strong><span>${body}</span>` : `<strong>${title}</strong>`;
  centerToast.classList.remove("is-visible");
  void centerToast.offsetWidth;
  centerToast.classList.add("is-visible");
}

function undoGhost() {
  if (state.screen !== "game" || !state.echoes.length) return;
  const echo = state.echoes.pop();
  state.echoPower = Math.max(0, state.echoPower - 1);
  showToast("마지막 기록 삭제");
  playSfx("undo");
  floating(`G${echo.id} 삭제`, state.player.x, state.player.y - 44, "#ff5ba8");
  updateHud();
}

function resetRoom() {
  if (state.screen !== "game") return;
  startRoom(state.roomIndex);
  showToast("방 재시작");
  playSfx("reset");
}

function startNextRoom() {
  const next = state.roomIndex + 1;
  const loopToStart = next >= rooms.length;
  const preserveCampaign = state.campaignActive && !loopToStart && next === state.campaignNextRoom;
  startGame(loopToStart ? 0 : next, { preserveCampaign });
}

function loop(now) {
  if (window.__rewindRunnerActiveInstance !== INSTANCE_ID) return;
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(dt);
  draw();
  animationId = requestAnimationFrame(loop);
  window.__rewindRunnerAnimationId = animationId;
}

continueButton.addEventListener("click", () => {
  const clearedAny = state.progress.stages.some((stage) => stage.bestStars > 0);
  if (!clearedAny) showIntro();
  else startGame(clamp(state.progress.unlocked, 0, rooms.length - 1));
});
tutorialButton.addEventListener("click", () => startGame(0));
stageSelectButton.addEventListener("click", showStageSelect);
stageBackButton.addEventListener("click", showMenu);
stageRouteTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-stage-filter]");
  if (!button) return;
  state.stageFilter = button.dataset.stageFilter;
  renderStageSelect();
});
stageGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-stage]");
  if (!button || button.disabled) return;
  startGame(Number(button.dataset.stage));
});
startButton.addEventListener("click", advanceIntro);
introBackButton.addEventListener("click", retreatIntro);
restartButton.addEventListener("click", () => startGame(state.roomIndex));
nextButton.addEventListener("click", () => {
  startNextRoom();
});
menuButton.addEventListener("click", showMenu);
pauseButton.addEventListener("click", pauseGame);
resumeButton.addEventListener("click", resumeGame);
pauseRestartButton.addEventListener("click", () => {
  if (state.screen !== "paused") return;
  pauseOverlay.classList.remove("is-visible");
  startRoom(state.roomIndex);
  state.screen = "game";
  showToast("방 재시작");
  playSfx("reset");
  focusGameCanvas();
});
pauseMenuButton.addEventListener("click", showMenu);

syncMobileInputMode();
window.addEventListener("resize", syncMobileInputMode);
window.addEventListener("orientationchange", syncMobileInputMode);

if (mobileControls) {
  mobileControls.addEventListener("contextmenu", (event) => event.preventDefault());
  mobileControls.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("[data-virtual-key]");
    if (!button) return;
    event.preventDefault();
    const key = button.dataset.virtualKey;
    try {
      button.setPointerCapture(event.pointerId);
    } catch {
      // Some embedded browsers do not expose capture for synthetic touch events.
    }
    pressVirtualKey(key, button, event.pointerId);
  });
  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    mobileControls.addEventListener(eventName, (event) => {
      const button = event.target.closest("[data-virtual-key]");
      const key = virtualPointerKeys.get(event.pointerId)?.key ?? button?.dataset.virtualKey;
      releaseVirtualKey(key, button, event.pointerId);
    });
  }
  mobileControls.addEventListener("pointerleave", (event) => {
    const button = event.target.closest("[data-virtual-key]");
    const key = virtualPointerKeys.get(event.pointerId)?.key ?? button?.dataset.virtualKey;
    releaseVirtualKey(key, button, event.pointerId);
  });

  if (!window.PointerEvent) {
    mobileControls.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const button = target?.closest?.("[data-virtual-key]");
      if (!button) return;
      event.preventDefault();
      pressVirtualKey(button.dataset.virtualKey, button, touch.identifier);
    }, { passive: false });
    mobileControls.addEventListener("touchend", (event) => {
      for (const touch of event.changedTouches) {
        const active = virtualPointerKeys.get(touch.identifier);
        releaseVirtualKey(active?.key, active?.button, touch.identifier);
      }
    });
    mobileControls.addEventListener("touchcancel", (event) => {
      for (const touch of event.changedTouches) {
        const active = virtualPointerKeys.get(touch.identifier);
        releaseVirtualKey(active?.key, active?.button, touch.identifier);
      }
    });
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d", " ", "enter", "r", "e", "z", "p", "m", "escape"].includes(key)) {
    event.preventDefault();
  }
  if (state.screen === "stage-result" && !event.repeat) {
    if (key === "enter" || key === " ") startNextRoom();
    else if (key === "r") startGame(state.roomIndex);
    else if (key === "m" || key === "escape") showMenu();
    return;
  }
  if (state.screen === "game" && ["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d", " ", "r", "e"].includes(key)) {
    state.stageStarted = true;
  }
  if (key === "p" && !event.repeat) {
    if (state.screen === "game") pauseGame();
    else if (state.screen === "paused") resumeGame();
    return;
  }
  if (key === " " && !event.repeat) queueDash();
  if (key === "e" && !event.repeat) triggerSync();
  if (key === "r" && !event.repeat && state.screen === "game") restartLoop(true);
  if (key === "z" && !event.repeat) undoGhost();
  if (key === "escape" && !event.repeat) {
    if (state.screen === "paused") resumeGame();
    else if (state.screen === "game") pauseGame();
  }
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("resize", fitCanvasToCard);

if (canvasCard && "ResizeObserver" in window) {
  canvasResizeObserver = new ResizeObserver(fitCanvasToCard);
  canvasResizeObserver.observe(canvasCard);
}

if (window.__rewindRunnerAnimationId) {
  cancelAnimationFrame(window.__rewindRunnerAnimationId);
}

fitCanvasToCard();
showMenu();
warmupLoadingScreen();
requestAnimationFrame(fitCanvasToCard);
draw();
animationId = requestAnimationFrame(loop);
window.__rewindRunnerAnimationId = animationId;
window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(animationId);
  if (window.__rewindRunnerAnimationId) cancelAnimationFrame(window.__rewindRunnerAnimationId);
});
