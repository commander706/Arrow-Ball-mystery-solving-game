/* editor.js */
import {
  showScreen,
  showLoading,
  playChin,
  audioSettings,
  playStageBgm,
  fadeOutStageBgm,
  setStageTheme,
  playSound,
  setShowDlcPillars,
  setGlobalGlitchTarget,
  triggerGlobalGlitchPulse
} from './main.js';

const MAX_LEVELS = 10;
const STORAGE_KEY = '3d_arrow_ball_levels';
const OFFICIAL_PROGRESS_KEY = '3d_arrow_ball_progress';
const MAIN_STAGE_COUNT = 30;
const EX_UNLOCKED_KEY = '3d_arrow_ball_ex_unlocked';
const FANMADE_PROGRESS_KEY = '3d_arrow_ball_fanmade_progress';
const DLC_UNLOCKED_KEY = '3d_arrow_ball_dlc_unlocked';

const TYPE_VOID = 0;
const TYPE_NORMAL = 1;
const TYPE_START = 2;
const TYPE_GOAL = 3;
const TYPE_SWITCH_ARROW = 4;
const TYPE_FIXED_ARROW = 5;
const TYPE_TURN_VAR = 6;
const TYPE_TURN_FIX = 7;
const TYPE_U_TURN = 8;
const TYPE_GLASS = 9;
const TYPE_JUMP = 10;
const TYPE_WARP = 11;
const TYPE_SWITCH = 12;
const TYPE_BLOCK = 13;
const TYPE_CRYSTAL = 14;
const TYPE_BLOCK_OFF = 15;
const TYPE_TOGGLE_SWITCH = 16;
const TYPE_TOGGLE_ARROW_FIX = 18;
const TYPE_ONE_WAY_U_TURN = 19;
const TYPE_WOODEN_BOX = 20;
const TYPE_ROTATING_ARROW_CW_VAR = 21;
const TYPE_ROTATING_ARROW_CCW_VAR = 22;
const TYPE_ROTATING_ARROW_CW_FIX = 23;
const TYPE_ROTATING_ARROW_CCW_FIX = 24;
const TYPE_IGNITE = 25;
const TYPE_EXTINGUISH = 26;
const TYPE_FIRE_GATE = 27;

const TILE_SEQUENCE = [
  { type: TYPE_NORMAL, rot: 0 },
  { type: TYPE_VOID, rot: 0 },
  { type: TYPE_START, rot: 0 },
  { type: TYPE_GOAL, rot: 0 },
  { type: TYPE_SWITCH_ARROW, rot: 0 },
  { type: TYPE_FIXED_ARROW, rot: 0 },
  { type: TYPE_TOGGLE_ARROW_FIX, rot: 0 },
  { type: TYPE_TOGGLE_SWITCH, rot: 0 },
  { type: TYPE_TURN_VAR, rot: 0 },
  { type: TYPE_TURN_FIX, rot: 0 },
  { type: TYPE_U_TURN, rot: 0 },
  { type: TYPE_ONE_WAY_U_TURN, rot: 0 },
  { type: TYPE_GLASS, rot: 0, val: 1 },
  { type: TYPE_JUMP, rot: 0, val: 1 },
  { type: TYPE_WARP, rot: 0, val: 1 },
  { type: TYPE_SWITCH, rot: 0, val: 1 },
  { type: TYPE_BLOCK, rot: 0, val: 1 },
  { type: TYPE_BLOCK_OFF, rot: 0, val: 1 },
  { type: TYPE_CRYSTAL, rot: 0 },
  { type: TYPE_WOODEN_BOX, rot: 0, val: 1 },
  { type: TYPE_ROTATING_ARROW_CW_VAR, rot: 0 },
  { type: TYPE_ROTATING_ARROW_CCW_VAR, rot: 0 },
  { type: TYPE_ROTATING_ARROW_CW_FIX, rot: 0 },
  { type: TYPE_ROTATING_ARROW_CCW_FIX, rot: 0 },
  { type: TYPE_IGNITE, rot: 0 },
  { type: TYPE_EXTINGUISH, rot: 0 },
  { type: TYPE_FIRE_GATE, rot: 0 },
];

const DLC_TILES = [
  TYPE_WOODEN_BOX,
  TYPE_ROTATING_ARROW_CW_VAR,
  TYPE_ROTATING_ARROW_CCW_VAR,
  TYPE_ROTATING_ARROW_CW_FIX,
  TYPE_ROTATING_ARROW_CCW_FIX,
  TYPE_IGNITE,
  TYPE_EXTINGUISH,
  TYPE_FIRE_GATE
];

const TILE_LABELS = {
  [TYPE_VOID]: "奈落",
  [TYPE_NORMAL]: "通常",
  [TYPE_START]: "開始",
  [TYPE_GOAL]: "ゴール",
  [TYPE_SWITCH_ARROW]: "可変矢印",
  [TYPE_FIXED_ARROW]: "固定矢印",
  [TYPE_TURN_VAR]: "転換（可）",
  [TYPE_TURN_FIX]: "転換（固）",
  [TYPE_U_TURN]: "Uターン",
  [TYPE_ONE_WAY_U_TURN]: "一方Uターン",
  [TYPE_GLASS]: "ガラス",
  [TYPE_JUMP]: "ジャンプ",
  [TYPE_WARP]: "ワープ",
  [TYPE_SWITCH]: "スイッチ",
  [TYPE_BLOCK]: "ブロックON",
  [TYPE_BLOCK_OFF]: "ブロックOFF",
  [TYPE_CRYSTAL]: "クリスタル",
  [TYPE_TOGGLE_SWITCH]: "切替SW",
  [TYPE_TOGGLE_ARROW_FIX]: "ON/OFF矢印",
  [TYPE_WOODEN_BOX]: "木箱",
  [TYPE_ROTATING_ARROW_CW_VAR]: "回転矢（右）",
  [TYPE_ROTATING_ARROW_CCW_VAR]: "回転矢（左）",
  [TYPE_ROTATING_ARROW_CW_FIX]: "回転矢（右固）",
  [TYPE_ROTATING_ARROW_CCW_FIX]: "回転矢（左固）",
  [TYPE_IGNITE]: "着火",
  [TYPE_EXTINGUISH]: "消火",
  [TYPE_FIRE_GATE]: "炎の門"
};

const ROTATABLE_TYPES = new Set([
  TYPE_START, TYPE_GOAL, TYPE_SWITCH_ARROW, TYPE_FIXED_ARROW,
  TYPE_TURN_VAR, TYPE_TURN_FIX, TYPE_TOGGLE_ARROW_FIX,
  TYPE_ONE_WAY_U_TURN, TYPE_ROTATING_ARROW_CW_VAR,
  TYPE_ROTATING_ARROW_CCW_VAR, TYPE_ROTATING_ARROW_CW_FIX,
  TYPE_ROTATING_ARROW_CCW_FIX
]);

const VALUE_LIMITS = new Map([
  [TYPE_GLASS, 5],
  [TYPE_JUMP, 3],
  [TYPE_WARP, 7],
  [TYPE_SWITCH, 7],
  [TYPE_BLOCK, 7],
  [TYPE_BLOCK_OFF, 7],
  [TYPE_WOODEN_BOX, 5]
]);

const COLOR_TYPES = new Set([
  TYPE_WARP, TYPE_SWITCH, TYPE_BLOCK, TYPE_BLOCK_OFF
]);

const VALID_TILE_TYPES = new Set(TILE_SEQUENCE.map(item => item.type));
const MINI_BOSS_STAGES = new Set([9, 16, 25, 29]);
const MAIN_SECTION_ENDS = [9, 16, 25, 29];
const WARP_COLORS = ["#ffffff", "#ff4757", "#ffa502", "#eccc68", "#2ed573", "#1e90ff", "#3742fa", "#a55eea"];

const DLC_BG_THEMES = [];
const DLC_BGM_THEMES = ['busy', 'sublime'];

function isDlcUnlocked() {
  return localStorage.getItem(DLC_UNLOCKED_KEY) === 'true';
}

const sounds = {
  change0: document.getElementById("seChange0"),
  change1: document.getElementById("seChange1"),
  goal: document.getElementById("seGoal"),
  break: document.getElementById("seBreak"),
  push: document.getElementById("sePush"),
  allClear: document.getElementById("seAllClear"),
  exSpawn: document.getElementById("seExSpawn"),
  died: document.getElementById("seDied"),
  ignite: document.getElementById("seIgnite"),
  digestion: document.getElementById("seDigestion")
};

Object.values(sounds).forEach(s => { if (s) s.volume = 0.5; });
function playSe(name) {
  const bufferName = name.startsWith('se') ? name : 'se' + name.charAt(0).toUpperCase() + name.slice(1);
  playSound(bufferName);
}


let currentLevel = null;
let currentBrush = { type: TYPE_NORMAL, rot: 0, val: 0 };
let isEditorMode = true;
let isRealPlay = false;
let isFanmadePlay = false;
let isOfficialPlay = false;
let editStroke = null;
let selectedLevelId = null;
let originalLevelData = null;

let fanmadeLevels = [];
let officialLevels = [];
let officialLevelsLoaded = false;
let lastClearedIndex = -1;
let hoveredOfficialIndex = -1;
let allClearSequenceRunning = false;
let allClearSequenceTimer = 0;
let immediateAllClearRequested = false;
let exZoneMoodActive = false;
let exZonePulseTimer = 0;
let officialListDirty = true;
let lastOfficialPlayedIndex = -1;
let pendingOfficialReturnIndex = -1;

let gameState = {
  crystalsCollected: 0,
  totalCrystals: 0,
  switchStates: [false, false, false, false, false, false, false, false],
  toggleState: false
};

let autoSaveTimerId = null;
let editorTimerId = null;
let editorStartTime = 0;
let playTimerId = null;
let levelSessionStartTime = 0; // プレイ計測の起点

let ballEl = null;
let isBallMoving = false;
let isBallResetting = false;
let ballResetGeneration = 0;
let ballPos = { x: 0, y: 0 };
let lastTrailPos = { x: 0, y: 0 };
let trailHue = 0;
let activeJumpTween = null;
const activeTrailNodes = new Set();
const activeFireParticles = new Set();
const activeWarpLines = new Set();
const activeScreenFallTrails = new Set();
let screenFallLayer = null;
let activeTutorialGuideEl = null;
let activeTutorialGuideTile = null;
const activeWarpFocusTiles = new Set();
const activeJumpPreviewNodes = new Set();
const MAX_ACTIVE_TRAILS = 56;
const MAX_ACTIVE_FIRE_PARTICLES = 28;
const TRAIL_SAMPLE_DISTANCE = 11;
const FIRE_PARTICLE_INTERVAL_MS = 45;
let lastFireParticleAt = 0;
let movementHistory = [];
let attemptStartedAt = 0;
let lastStuckNoticeAt = 0;
let lastHintReminderBucket = 0;
let coachHideTimer = null;

let isReplayMode = false;
let replaySpeed = 1.0;
let lastAttemptData = null; // ボール発射直前の盤面データ（リプレイ用）
let lastAttemptStartIdx = -1;

let undoStack = [];
let redoStack = [];

const cheatKeys = { e: false, x: false };

const listContainer = document.getElementById("levelList");
const officialListContainer = document.getElementById("officialLevelList");
const btnNewLevel = document.getElementById("btnNewLevel");
const btnImportLevel = document.getElementById("btnImportLevel");
const fileImport = document.getElementById("fileImport");
const importOverlay = document.getElementById("importOverlay");
const modalNew = document.getElementById("newLevelModal");
const formNew = document.getElementById("newLevelForm");
const btnCancelNew = document.getElementById("btnCancelNew");
const detailsPanel = document.getElementById("levelDetailsPanel");
const noSelectionMsg = document.getElementById("noSelectionMsg");
const detailTitle = document.getElementById("detailTitle");
const detailSub = document.getElementById("detailSub");
const detailAuthor = document.getElementById("detailAuthor");
const detailSizeDate = document.getElementById("detailSizeDate");
const detailUpdate = document.getElementById("detailUpdate");
const btnDetailPlay = document.getElementById("btnDetailPlay");
const btnDetailEdit = document.getElementById("btnDetailEdit");
const btnDetailDelete = document.getElementById("btnDetailDelete");

const editorGrid = document.getElementById("editorGrid");
const playGrid = document.getElementById("playGrid");

const penWorkspace = document.getElementById("penWorkspace");
const penCanvas = document.getElementById("penCanvas");
const penToolbar = document.getElementById("penToolbar");
const penToolPanel = document.getElementById("penToolPanel");
const btnPenMenuToggle = document.getElementById("btnPenMenuToggle");
const btnPenToggle = document.getElementById("btnPenToggle");
const btnPenDraw = document.getElementById("btnPenDraw");
const btnPenErase = document.getElementById("btnPenErase");
const penColor = document.getElementById("penColor");
const penWidth = document.getElementById("penWidth");
const penWidthValue = document.getElementById("penWidthValue");
const btnPenUndo = document.getElementById("btnPenUndo");
const btnPenClear = document.getElementById("btnPenClear");
const btnPenVisibility = document.getElementById("btnPenVisibility");
const penStatus = document.getElementById("penStatus");

const editorHintsContainer = document.getElementById("editorHintsContainer");
const btnAddHint = document.getElementById("btnAddHint");

const btnPlayHint = document.getElementById("btnPlayHint");
const hintViewModal = document.getElementById("hintViewModal");
const btnCloseHintView = document.getElementById("btnCloseHintView");
const playHintList = document.getElementById("playHintList");

const btnOpenConverter = document.getElementById("btnOpenConverter");
const converterModal = document.getElementById("converterModal");
const btnCloseConverter = document.getElementById("btnCloseConverter");
const converterDropZone = document.getElementById("converterDropZone");
const converterFileInput = document.getElementById("converterFileInput");

function _clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function _numPx(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }

function normalizeRotation(value) {
  const rotation = Number.isFinite(Number(value)) ? Number(value) : 0;
  return ((Math.round(rotation) % 4) + 4) % 4;
}

function createTileData(type, rot = 0, val = 0) {
  const safeType = VALID_TILE_TYPES.has(Number(type)) ? Number(type) : TYPE_NORMAL;
  const maxValue = VALUE_LIMITS.get(safeType);
  return {
    type: safeType,
    rot: ROTATABLE_TYPES.has(safeType) ? normalizeRotation(rot) : 0,
    val: maxValue ? _clamp(Number(val) || 1, 1, maxValue) : 0
  };
}

function validateLevel(level, { playable = false } = {}) {
  const errors = [];
  if (!level || typeof level !== "object") return ["ステージデータがありません。"];

  const size = Number(level.size);
  if (!Number.isInteger(size) || size < 2 || size > 32) {
    errors.push("ステージサイズは2～32の整数にしてください。");
  }
  if (!Array.isArray(level.data)) {
    errors.push("盤面データがありません。");
    return errors;
  }
  if (Number.isInteger(size) && level.data.length !== size * size) {
    errors.push(`盤面データ数が不正です（必要: ${size * size}、実際: ${level.data.length}）。`);
  }

  let starts = 0;
  let goals = 0;
  level.data.forEach((cell, index) => {
    if (!cell || !VALID_TILE_TYPES.has(Number(cell.type))) {
      errors.push(`${index + 1}番のマスに未対応のタイルがあります。`);
      return;
    }
    if (!Number.isInteger(Number(cell.rot)) || Number(cell.rot) < 0 || Number(cell.rot) > 3) {
      errors.push(`${index + 1}番のマスの向きが不正です。`);
    }
    const maxValue = VALUE_LIMITS.get(Number(cell.type));
    if (maxValue && (!Number.isInteger(Number(cell.val)) || Number(cell.val) < 1 || Number(cell.val) > maxValue)) {
      errors.push(`${index + 1}番のマスの値が範囲外です。`);
    }
    if (Number(cell.type) === TYPE_START) starts++;
    if (Number(cell.type) === TYPE_GOAL) goals++;
  });

  if (playable && starts === 0) errors.push("開始タイルを1つ以上置いてください。");
  if (playable && goals === 0) errors.push("ゴールタイルを1つ以上置いてください。");
  return errors.slice(0, 8);
}

function ensureLevelValid(level, action, playable = false) {
  const errors = validateLevel(level, { playable });
  if (errors.length === 0) return true;
  playSe("died");
  alert(`${action}できません。\n\n・${errors.join("\n・")}`);
  return false;
}

function brushStateIndex() {
  if (currentBrush.type === TYPE_U_TURN) return 0;
  if (currentBrush.type === TYPE_ONE_WAY_U_TURN) return currentBrush.rot + 1;
  return 0;
}

function updateBrushUi() {
  if (!brushTypeLabel || !brushValueLabel) return;

  brushTypeLabel.textContent = TILE_LABELS[currentBrush.type] || "タイル";
  if (currentBrush.type === TYPE_U_TURN) {
    brushValueLabel.textContent = "全方向";
  } else if (currentBrush.type === TYPE_ONE_WAY_U_TURN) {
    brushValueLabel.textContent = `入口 ${["↑", "→", "↓", "←"][currentBrush.rot]}`;
  } else if (ROTATABLE_TYPES.has(currentBrush.type)) {
    brushValueLabel.textContent = `向き ${["↑", "→", "↓", "←"][currentBrush.rot]}`;
  } else if (COLOR_TYPES.has(currentBrush.type)) {
    brushValueLabel.textContent = `色 ${currentBrush.val}`;
  } else if (VALUE_LIMITS.has(currentBrush.type)) {
    brushValueLabel.textContent = `値 ${currentBrush.val}`;
  } else {
    brushValueLabel.textContent = "設置";
  }

  const paletteType = currentBrush.type === TYPE_ONE_WAY_U_TURN ? TYPE_U_TURN : currentBrush.type;
  paletteItems.forEach(button => {
    button.classList.toggle("active", Number(button.dataset.type) === paletteType);
  });

  const activePreview = document.querySelector(".palette-item.active .preview-tile");
  if (activePreview) {
    if (currentBrush.type === TYPE_ONE_WAY_U_TURN) {
      activePreview.classList.remove("u-turn");
      activePreview.classList.add("one-way-u-turn");
    } else if (currentBrush.type === TYPE_U_TURN) {
      activePreview.classList.remove("one-way-u-turn");
      activePreview.classList.add("u-turn");
    }
    activePreview.style.setProperty("--r", `${currentBrush.rot * 90}deg`);
    if (currentBrush.val) activePreview.dataset.val = String(currentBrush.val);
    else delete activePreview.dataset.val;
    for (let i = 1; i <= 7; i++) activePreview.classList.remove(`color-${i}`);
    if (COLOR_TYPES.has(currentBrush.type)) activePreview.classList.add(`color-${currentBrush.val}`);
  }
}

function selectBrush(type, source = null) {
  const base = source || createTileData(type, 0, VALUE_LIMITS.has(type) ? 1 : 0);
  currentBrush = createTileData(base.type, base.rot, base.val);
  updateBrushUi();
}

function adjustBrush(delta) {
  if (!delta) return;
  if (currentBrush.type === TYPE_U_TURN || currentBrush.type === TYPE_ONE_WAY_U_TURN) {
    const index = (brushStateIndex() + Math.sign(delta) + 5) % 5;
    currentBrush = index === 0
      ? createTileData(TYPE_U_TURN)
      : createTileData(TYPE_ONE_WAY_U_TURN, index - 1);
  } else if (ROTATABLE_TYPES.has(currentBrush.type)) {
    currentBrush.rot = normalizeRotation(currentBrush.rot + Math.sign(delta));
  } else {
    const maxValue = VALUE_LIMITS.get(currentBrush.type);
    if (maxValue) {
      currentBrush.val = ((currentBrush.val - 1 + Math.sign(delta) + maxValue) % maxValue) + 1;
    }
  }
  updateBrushUi();
  playSe("change0");
}

function getEditorWheelStates() {
  const states = [];
  for (const item of TILE_SEQUENCE) {
    if (DLC_TILES.includes(item.type) && !isDlcUnlocked()) continue;
    if (item.type === TYPE_U_TURN) {
      states.push(createTileData(TYPE_U_TURN));
      for (let rot = 0; rot < 4; rot++) states.push(createTileData(TYPE_ONE_WAY_U_TURN, rot));
    } else if (item.type === TYPE_ONE_WAY_U_TURN) {
      continue;
    } else if (ROTATABLE_TYPES.has(item.type)) {
      for (let rot = 0; rot < 4; rot++) states.push(createTileData(item.type, rot, item.val));
    } else if (VALUE_LIMITS.has(item.type)) {
      for (let val = 1; val <= VALUE_LIMITS.get(item.type); val++) {
        states.push(createTileData(item.type, item.rot, val));
      }
    } else {
      states.push(createTileData(item.type, item.rot, item.val));
    }
  }
  return states;
}

function stepEditorCell(idx, delta) {
  const cell = currentLevel?.data[idx];
  if (!cell || !delta) return;
  const states = getEditorWheelStates();
  let index = states.findIndex(state => tilesEqual(state, cell));
  if (index < 0) index = 0;
  const next = states[(index + Math.sign(delta) + states.length) % states.length];
  if (tilesEqual(cell, next)) return;
  pushToUndo();
  currentLevel.data[idx] = { ...next };
  syncEditorTile(idx);
  playSe("change0");
}

function cyclePlacedTile(idx) {
  const cell = currentLevel?.data[idx];
  if (!cell) return false;

  let next = null;
  if (cell.type === TYPE_U_TURN) {
    next = createTileData(TYPE_ONE_WAY_U_TURN, 0);
  } else if (cell.type === TYPE_ONE_WAY_U_TURN) {
    next = cell.rot < 3
      ? createTileData(TYPE_ONE_WAY_U_TURN, cell.rot + 1)
      : createTileData(TYPE_U_TURN);
  } else if (ROTATABLE_TYPES.has(cell.type)) {
    next = createTileData(cell.type, cell.rot + 1, cell.val);
  } else if (VALUE_LIMITS.has(cell.type)) {
    const max = VALUE_LIMITS.get(cell.type);
    next = createTileData(cell.type, cell.rot, (cell.val % max) + 1);
  }
  if (!next) return false;

  pushToUndo();
  currentLevel.data[idx] = next;
  syncEditorTile(idx);
  playSe("change0");
  return true;
}

function resetHistory() {
  undoStack = [];
  redoStack = [];
}

function pushToUndo() {
  if (!currentLevel) return;
  const snapshot = JSON.stringify(currentLevel.data);
  if (undoStack[undoStack.length - 1] !== snapshot) undoStack.push(snapshot);
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
}

function execUndo() {
  if (!isEditorMode || undoStack.length === 0) return;

  redoStack.push(JSON.stringify(currentLevel.data));

  const prevData = undoStack.pop();
  currentLevel.data = JSON.parse(prevData);

  renderGrid(editorGrid);
  playSe('change0');
}

function execRedo() {
  if (!isEditorMode || redoStack.length === 0) return;

  undoStack.push(JSON.stringify(currentLevel.data));

  const nextData = redoStack.pop();
  currentLevel.data = JSON.parse(nextData);

  renderGrid(editorGrid);
  playSe('change0');
}

function fitGridToHost(grid, host, opts = {}) {
  if (!grid || !host) return;
  if (grid.offsetParent === null) return;

  const prevTransition = grid.style.transition;
  grid.style.transition = "none";
  grid.style.setProperty("--gridScale", "1");
  grid.style.setProperty("--gridOffsetX", "0px");
  grid.style.setProperty("--gridOffsetY", "0px");

  const gridRect = grid.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  const cs = getComputedStyle(host);
  const padLeft = _numPx(cs.paddingLeft);
  const padRight = _numPx(cs.paddingRight);
  const padTop = _numPx(cs.paddingTop);
  const padBottom = _numPx(cs.paddingBottom);
  const marginX = opts.marginX ?? 18;
  const marginY = opts.marginY ?? 18;
  const availW = Math.max(10, hostRect.width - padLeft - padRight - marginX);
  const availH = Math.max(10, hostRect.height - padTop - padBottom - marginY);
  const safety = opts.safety ?? 0.96;
  const scale = _clamp(
    Math.min(availW / gridRect.width, availH / gridRect.height) * safety,
    opts.min ?? 0.25,
    opts.max ?? 3
  );
  grid.style.setProperty("--gridScale", String(scale));

  const centerX = hostRect.left + padLeft + (hostRect.width - padLeft - padRight) / 2;
  const centerY = hostRect.top + padTop + (hostRect.height - padTop - padBottom) / 2;
  for (let pass = 0; pass < 2; pass++) {
    const rect = grid.getBoundingClientRect();
    const currentX = _numPx(grid.style.getPropertyValue("--gridOffsetX"));
    const currentY = _numPx(grid.style.getPropertyValue("--gridOffsetY"));
    grid.style.setProperty("--gridOffsetX", `${currentX + centerX - (rect.left + rect.width / 2)}px`);
    grid.style.setProperty("--gridOffsetY", `${currentY + centerY - (rect.top + rect.height / 2)}px`);
  }

  grid.getBoundingClientRect();
  grid.style.transition = prevTransition;
}

function fitVisibleGrids() {
  const playActive = document.getElementById("playScreen")?.classList.contains("screen--active");
  const editorActive = document.getElementById("editorMainScreen")?.classList.contains("screen--active");

  if (playActive) {
    const playHost = document.getElementById("playStageContainer") || playGrid?.parentElement;
    fitGridToHost(playGrid, playHost, { safety: 0.955, marginY: 22, marginX: 18 });
  }
  if (editorActive) {
    const editorHost = document.querySelector("#editorMainScreen .editor-stage") || editorGrid?.parentElement;
    fitGridToHost(editorGrid, editorHost, { safety: 0.95, marginY: 26, marginX: 26 });
  }
}

window.addEventListener("resize", () => requestAnimationFrame(fitVisibleGrids));
window.addEventListener("orientationchange", () => requestAnimationFrame(fitVisibleGrids));
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => requestAnimationFrame(fitVisibleGrids));
}


function _scheduleFitVisibleGrids() {
  requestAnimationFrame(() => requestAnimationFrame(fitVisibleGrids));
}

const _fitObsTargets = [
  document.getElementById("playScreen"),
  document.getElementById("editorMainScreen"),
];
const _fitObserver = new MutationObserver(() => _scheduleFitVisibleGrids());
for (const t of _fitObsTargets) {
  if (t) _fitObserver.observe(t, { attributes: true, attributeFilter: ["class"] });
}

if (playGrid) {
  const _gridObserver = new MutationObserver(mutations => {
    const tilesChanged = mutations.some(mutation =>
      [...mutation.addedNodes, ...mutation.removedNodes].some(node => node.classList?.contains("tile"))
    );
    if (tilesChanged) _scheduleFitVisibleGrids();
  });
  _gridObserver.observe(playGrid, { childList: true, subtree: false });
}

const editorTitle = document.getElementById("editorLevelTitle");
const editorTimerValue = document.getElementById("editorTimerValue");
const btnExitEditorConfirm = document.getElementById("btnExitEditorConfirm");
const btnSaveLevel = document.getElementById("btnSaveLevel");
const btnExportConfirm = document.getElementById("btnExportConfirm");
const exportModal = document.getElementById("exportModal");
const btnExportExec = document.getElementById("btnExportExec");
const btnExportCancel = document.getElementById("btnExportCancel");
const btnTestPlay = document.getElementById("btnTestPlay");
const testPlayUI = document.getElementById("testPlayUI");
const btnStopTest = document.getElementById("btnStopTest");
const editorPalette = document.getElementById("editorPalette");
const btnTogglePalette = document.getElementById("btnTogglePalette");
const paletteItems = document.querySelectorAll(".palette-item");
const btnBrushPrev = document.getElementById("btnBrushPrev");
const btnBrushNext = document.getElementById("btnBrushNext");
const brushTypeLabel = document.getElementById("brushTypeLabel");
const brushValueLabel = document.getElementById("brushValueLabel");
const btnHowTo = document.getElementById("btnHowTo");
const howToModal = document.getElementById("howToModal");
const btnCloseHowTo = document.getElementById("closeHowTo");
const btnSettings = document.getElementById("btnSettings");
const settingsModal = document.getElementById("settingsModal");
const btnCloseSettings = document.getElementById("closeSettings");
const settingsForm = document.getElementById("settingsForm");
const exitModal = document.getElementById("exitModal");
const btnExitSave = document.getElementById("btnExitSave");
const btnExitNoSave = document.getElementById("btnExitNoSave");
const btnExitCancel = document.getElementById("btnExitCancel");

const skipWarningModal = document.getElementById("skipWarningModal");
const btnSkipExec = document.getElementById("btnSkipExec");
const btnSkipCancel = document.getElementById("btnSkipCancel");

const skipConfirmModal = document.getElementById("skipConfirmModal");
const btnSkipConfirmExec = document.getElementById("btnSkipConfirmExec");
const btnSkipConfirmCancel = document.getElementById("btnSkipConfirmCancel");


let pendingSkipLevelIndex = -1;

const btnResetProgress = document.getElementById("btnResetProgress");

const playIntro = document.getElementById("playIntro");
const playIntroTitle = document.getElementById("playIntroTitle");
const playIntroSub = document.getElementById("playIntroSub");
const playIntroAuthor = document.getElementById("playIntroAuthor");
const playTimerVal = document.getElementById("playTimerVal");
let playIntroCenterLocked = false;
const clearOverlay = document.getElementById("clearOverlay");
const clearTextContainer = document.getElementById("clearTextContainer");
const btnClearNext = document.getElementById("btnClearNext");
const btnClearRetry = document.getElementById("btnClearRetry");
const btnClearBack = document.getElementById("btnClearBack");
const btnPlaySkip = document.getElementById("btnPlaySkip");

const allClearOverlay = document.getElementById("allClearOverlay");
const congratsText = document.getElementById("congratsText");
const exUnlockText = document.getElementById("exUnlockText");


function getPixelPos(x, y) {
  const stride = 52;
  const offset = 10;
  return { left: x * stride + offset, top: y * stride + offset };
}

const stableGridHoverStates = new WeakMap();

function bindStableGridHover(container) {
  if (!container || container.dataset.stableHoverBound === "1") return;
  container.dataset.stableHoverBound = "1";

  const state = { activeHitbox: null };
  stableGridHoverStates.set(container, state);

  const clearActive = () => {
    state.activeHitbox?.classList.remove("is-hovered");
    state.activeHitbox = null;
    clearHoverTileEffects(container);
  };

  const updateActive = event => {
    const hitbox = getTileHitboxFromPoint(
      event.clientX,
      event.clientY,
      container,
      state.activeHitbox
    );
    if (!hitbox) {
      clearActive();
      return;
    }
    if (state.activeHitbox === hitbox) return;
    state.activeHitbox?.classList.remove("is-hovered");
    state.activeHitbox = hitbox;
    state.activeHitbox.classList.add("is-hovered");
    updateHoverTileEffects(container, state.activeHitbox);
  };

  // pointerover だけに依存すると、浮いた見た目の縁で target が grid に戻った瞬間に
  // hover が解除される。pointermove ごとに「見た目のタイル」も含めて同一セルを維持する。
  container.addEventListener("pointerover", updateActive, { passive: true });
  container.addEventListener("pointermove", updateActive, { passive: true });
  container.addEventListener("pointerleave", clearActive, { passive: true });

  // 各セルではなくグリッドに委譲する。見た目だけ浮いた部分を押した場合でも、
  // 現在ホバー中のセルへ確実に pointerdown を届ける。
  container.addEventListener("pointerdown", event => {
    const hitbox = getTileHitboxFromPoint(
      event.clientX,
      event.clientY,
      container,
      state.activeHitbox
    );
    if (!hitbox) return;
    handleGridTilePointerDown(container, event, Number(hitbox.dataset.idx));
  });
}

const penNotesByStage = new Map();
const penState = {
  activeKey: "",
  strokes: [],
  currentStroke: null,
  enabled: false,
  visible: true,
  tool: "pen",
  color: "#ff4d3d",
  width: 5,
  pointerId: null,
  expanded: false,
  cssWidth: 0,
  cssHeight: 0,
  dpr: 1
};

function getPenStageKey(mode = "play") {
  if (!currentLevel) return `${mode}:unknown`;
  let key = currentLevel.id || currentLevel._fanmadeId || currentLevel._officialId || "";
  if (!key && Number.isInteger(currentLevel._officialIndex)) key = `official-${currentLevel._officialIndex}`;
  if (!key && Number.isInteger(currentLevel._dlcNum)) key = `dlc-${currentLevel._dlcNum}`;
  if (!key) key = `${currentLevel.name || "level"}-${currentLevel.size || 0}`;
  return `${mode}:${key}`;
}

function resizePenCanvas() {
  if (!penCanvas) return;
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
  if (penState.cssWidth === width && penState.cssHeight === height && penState.dpr === dpr) return;

  penState.cssWidth = width;
  penState.cssHeight = height;
  penState.dpr = dpr;
  penCanvas.width = Math.round(width * dpr);
  penCanvas.height = Math.round(height * dpr);
  penCanvas.style.width = `${width}px`;
  penCanvas.style.height = `${height}px`;
  const ctx = penCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redrawPenCanvas();
}

function penPointFromEvent(event) {
  const width = Math.max(1, penState.cssWidth || window.innerWidth);
  const height = Math.max(1, penState.cssHeight || window.innerHeight);
  return {
    x: Math.max(0, Math.min(1, event.clientX / width)),
    y: Math.max(0, Math.min(1, event.clientY / height))
  };
}

function penPointToPixels(point) {
  return {
    x: point.x * penState.cssWidth,
    y: point.y * penState.cssHeight
  };
}

function applyPenStrokeStyle(ctx, stroke) {
  ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.tool === "eraser" ? stroke.width * 2.25 : stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function drawPenStroke(ctx, stroke) {
  if (!stroke?.points?.length) return;
  applyPenStrokeStyle(ctx, stroke);
  if (stroke.points.length === 1) {
    const point = penPointToPixels(stroke.points[0]);
    ctx.beginPath();
    ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  const first = penPointToPixels(stroke.points[0]);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < stroke.points.length; i++) {
    const point = penPointToPixels(stroke.points[i]);
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
}

function drawPenSegment(stroke, fromPoint, toPoint) {
  if (!penCanvas || !fromPoint || !toPoint) return;
  const ctx = penCanvas.getContext("2d");
  applyPenStrokeStyle(ctx, stroke);
  const from = penPointToPixels(fromPoint);
  const to = penPointToPixels(toPoint);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
}

function redrawPenCanvas() {
  if (!penCanvas || !penState.cssWidth || !penState.cssHeight) return;
  const ctx = penCanvas.getContext("2d");
  ctx.save();
  ctx.setTransform(penState.dpr, 0, 0, penState.dpr, 0, 0);
  ctx.clearRect(0, 0, penState.cssWidth, penState.cssHeight);
  for (const stroke of penState.strokes) drawPenStroke(ctx, stroke);
  if (penState.currentStroke) drawPenStroke(ctx, penState.currentStroke);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

function updatePenUi() {
  if (!penWorkspace) return;
  penWorkspace.classList.toggle("drawing-active", penState.enabled && penState.visible);
  penWorkspace.classList.toggle("eraser-active", penState.enabled && penState.visible && penState.tool === "eraser");
  penWorkspace.classList.toggle("notes-hidden", !penState.visible);
  penWorkspace.classList.toggle("tools-expanded", penState.expanded);
  document.body.classList.toggle("pen-panel-expanded", penState.expanded && !penWorkspace.classList.contains("hidden"));
  btnPenMenuToggle?.setAttribute("aria-expanded", String(penState.expanded));
  btnPenMenuToggle?.classList.toggle("active", penState.expanded);
  btnPenMenuToggle?.setAttribute("title", penState.expanded ? "ペンツールを閉じる" : "ペンツールを開く");
  penToolPanel?.setAttribute("aria-hidden", String(!penState.expanded));
  btnPenToggle?.setAttribute("aria-pressed", String(penState.enabled));
  btnPenToggle?.classList.toggle("active", penState.enabled);
  btnPenDraw?.setAttribute("aria-pressed", String(penState.tool === "pen"));
  btnPenDraw?.classList.toggle("active", penState.tool === "pen");
  btnPenErase?.setAttribute("aria-pressed", String(penState.tool === "eraser"));
  btnPenErase?.classList.toggle("active", penState.tool === "eraser");
  btnPenVisibility?.setAttribute("aria-pressed", String(penState.visible));
  if (btnPenVisibility) btnPenVisibility.textContent = penState.visible ? "表示" : "非表示";
  if (penStatus) {
    penStatus.textContent = !penState.visible
      ? "メモ非表示"
      : penState.enabled
        ? (penState.tool === "eraser" ? "消去中" : "描画中")
        : "盤面操作中";
  }
}

function setPenToolsExpanded(expanded) {
  penState.expanded = Boolean(expanded);
  if (!penState.expanded && penState.enabled) setPenEnabled(false);
  else updatePenUi();
}

function setPenTool(tool) {
  penState.tool = tool === "eraser" ? "eraser" : "pen";
  if (!penState.visible) penState.visible = true;
  updatePenUi();
}

function setPenEnabled(enabled) {
  penState.enabled = Boolean(enabled);
  if (penState.enabled && !penState.visible) penState.visible = true;
  if (!penState.enabled && penState.pointerId !== null) finishPenStroke();
  updatePenUi();
}

function showPenWorkspace(mode) {
  if (!penWorkspace || !penCanvas) return;
  const key = getPenStageKey(mode);
  penState.activeKey = key;
  if (!penNotesByStage.has(key)) penNotesByStage.set(key, []);
  penState.strokes = penNotesByStage.get(key);
  penState.currentStroke = null;
  penState.pointerId = null;
  penState.enabled = false;
  penState.visible = true;
  penState.expanded = false;
  penWorkspace.classList.remove("hidden");
  penWorkspace.setAttribute("aria-hidden", "false");
  document.body.classList.add("pen-tools-visible");
  resizePenCanvas();
  updatePenUi();
  redrawPenCanvas();
}

function hidePenWorkspace() {
  if (!penWorkspace) return;
  finishPenStroke();
  penState.enabled = false;
  penState.expanded = false;
  penWorkspace.classList.add("hidden");
  penWorkspace.setAttribute("aria-hidden", "true");
  document.body.classList.remove("pen-tools-visible");
  updatePenUi();
}

function beginPenStroke(event) {
  if (!penState.enabled || !penState.visible || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  penState.pointerId = event.pointerId;
  penCanvas.setPointerCapture?.(event.pointerId);
  penState.currentStroke = {
    tool: penState.tool,
    color: penState.color,
    width: penState.width,
    points: [penPointFromEvent(event)]
  };
}

function continuePenStroke(event) {
  if (penState.pointerId !== event.pointerId || !penState.currentStroke) return;
  event.preventDefault();
  const next = penPointFromEvent(event);
  const points = penState.currentStroke.points;
  const prev = points[points.length - 1];
  const dx = (next.x - prev.x) * penState.cssWidth;
  const dy = (next.y - prev.y) * penState.cssHeight;
  if (Math.hypot(dx, dy) < 1.2) return;
  points.push(next);
  drawPenSegment(penState.currentStroke, prev, next);
}

function finishPenStroke(event = null) {
  if (event && penState.pointerId !== event.pointerId) return;
  const stroke = penState.currentStroke;
  if (stroke) {
    if (stroke.points.length === 1) {
      const ctx = penCanvas.getContext("2d");
      drawPenStroke(ctx, stroke);
      ctx.globalCompositeOperation = "source-over";
    }
    penState.strokes.push(stroke);
    if (penState.activeKey) penNotesByStage.set(penState.activeKey, penState.strokes);
  }
  if (penState.pointerId !== null) {
    try { penCanvas.releasePointerCapture?.(penState.pointerId); } catch (_) { /* no-op */ }
  }
  penState.pointerId = null;
  penState.currentStroke = null;
}

function initPenTool() {
  if (!penWorkspace || !penCanvas) return;
  resizePenCanvas();
  btnPenMenuToggle?.addEventListener("click", () => setPenToolsExpanded(!penState.expanded));
  btnPenToggle?.addEventListener("click", () => setPenEnabled(!penState.enabled));
  btnPenDraw?.addEventListener("click", () => setPenTool("pen"));
  btnPenErase?.addEventListener("click", () => setPenTool("eraser"));
  penColor?.addEventListener("input", event => {
    penState.color = event.target.value || "#ff4d3d";
    setPenTool("pen");
  });
  penWidth?.addEventListener("input", event => {
    penState.width = Math.max(1, Math.min(18, Number(event.target.value) || 5));
    if (penWidthValue) penWidthValue.textContent = String(penState.width);
  });
  btnPenUndo?.addEventListener("click", () => {
    finishPenStroke();
    penState.strokes.pop();
    redrawPenCanvas();
  });
  btnPenClear?.addEventListener("click", () => {
    finishPenStroke();
    penState.strokes.length = 0;
    redrawPenCanvas();
  });
  btnPenVisibility?.addEventListener("click", () => {
    finishPenStroke();
    penState.visible = !penState.visible;
    if (!penState.visible) penState.enabled = false;
    updatePenUi();
  });

  penCanvas.addEventListener("pointerdown", beginPenStroke, { passive: false });
  penCanvas.addEventListener("pointermove", continuePenStroke, { passive: false });
  penCanvas.addEventListener("pointerup", finishPenStroke, { passive: false });
  penCanvas.addEventListener("pointercancel", finishPenStroke, { passive: false });
  penCanvas.addEventListener("contextmenu", event => event.preventDefault());

  window.addEventListener("resize", resizePenCanvas, { passive: true });
  window.visualViewport?.addEventListener("resize", resizePenCanvas, { passive: true });
  window.addEventListener("keydown", event => {
    if (event.key.toLowerCase() !== "p" || event.ctrlKey || event.metaKey || event.altKey) return;
    if (penWorkspace.classList.contains("hidden")) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    event.preventDefault();
    if (!penState.expanded) {
      setPenToolsExpanded(true);
      setPenEnabled(true);
    } else {
      setPenEnabled(!penState.enabled);
    }
  });
  updatePenUi();
}

function init() {
  initPenTool();
  bindStableGridHover(editorGrid);
  bindStableGridHover(playGrid);
  renderList();
  loadOfficialLevels();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.id === 'officialSelectScreen' &&
        mutation.target.classList.contains('screen--active')) {
        if (officialListDirty || !officialListContainer?.children.length) {
          renderOfficialList();
        } else {
          restoreOfficialSelectionPosition();
        }
      }
    });
  });

  const officialScreen = document.getElementById('officialSelectScreen');
  if (officialScreen) observer.observe(officialScreen, { attributes: true, attributeFilter: ['class'] });

  const fanmadeScreen = document.getElementById('fanmadeSelectScreen');
  if (fanmadeScreen) observer.observe(fanmadeScreen, { attributes: true, attributeFilter: ['class'] });

  btnNewLevel.addEventListener("click", openNewLevelModal);
  btnCancelNew.addEventListener("click", () => modalNew.close());
  formNew.addEventListener("submit", handleCreateLevel);

  btnImportLevel.addEventListener("click", () => fileImport.click());
  fileImport.addEventListener("change", handleImportLevel);

  if (btnOpenConverter) {
    btnOpenConverter.addEventListener("click", () => {
      playChin();
      converterModal.showModal();
    });
  }
  if (btnCloseConverter) {
    btnCloseConverter.addEventListener("click", () => converterModal.close());
  }

  if (converterDropZone && converterFileInput) {
    converterDropZone.addEventListener("click", () => {
      converterFileInput.click();
    });

    converterFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        processConverterFiles(Array.from(e.target.files));
        e.target.value = ""; // リセット
      }
    });

    converterDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      converterDropZone.style.background = "#e8f0fe";
      converterDropZone.style.borderColor = "#2980b9";
    });
    converterDropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      converterDropZone.style.background = "#fafafa";
      converterDropZone.style.borderColor = "#ccc";
    });
    converterDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      converterDropZone.style.background = "#fafafa";
      converterDropZone.style.borderColor = "#ccc";

      const files = Array.from(e.dataTransfer.files);
      processConverterFiles(files);
    });
  }

  btnDetailEdit.addEventListener("click", () => {
    playChin();
    if (selectedLevelId) loadLevelEditor(selectedLevelId);
  });
  btnDetailPlay.addEventListener("click", () => {
    playChin();
    startRealPlay(selectedLevelId, false);
  });
  btnDetailDelete.addEventListener("click", () => { if (selectedLevelId && confirm("削除しますか？")) deleteLevel(selectedLevelId); });

  paletteItems.forEach(btn => {
    const type = parseInt(btn.dataset.type);

    if (DLC_TILES.includes(type) && !isDlcUnlocked()) {
      if (!btn.dataset.originalHtml) {
        btn.dataset.originalHtml = btn.innerHTML;
      }
      btn.classList.add("locked");
      btn.innerHTML = `<div class="preview-tile" style="background:#333; color:#777; border:1px solid #555; display:grid; place-items:center;">🔒</div><span style="color:#777;">???</span>`;
      btn.title = "聖域で解放されるコンテンツ";
    }

    btn.addEventListener("click", () => {
      if (btn.classList.contains("locked")) {
        playSe("died");
        alert("このタイルを使用するには聖域の開放が必要です。");
        return;
      }
      selectBrush(type === TYPE_ONE_WAY_U_TURN ? TYPE_U_TURN : type);
    });
  });

  btnBrushPrev?.addEventListener("click", () => adjustBrush(-1));
  btnBrushNext?.addEventListener("click", () => adjustBrush(1));

  btnTogglePalette.addEventListener("click", () => {
    editorPalette.classList.toggle("minimized");
    btnTogglePalette.textContent = editorPalette.classList.contains("minimized") ? "□" : "_";
  });

  btnSaveLevel.addEventListener("click", saveCurrentLevel);

  btnExportConfirm.addEventListener("click", () => exportModal.showModal());
  btnExportExec.addEventListener("click", () => { exportLevel(); exportModal.close(); });
  btnExportCancel.addEventListener("click", () => exportModal.close());

  btnExitEditorConfirm.addEventListener("click", () => exitModal.showModal());
  btnExitSave.addEventListener("click", () => { saveCurrentLevel(); closeEditor(); exitModal.close(); });
  btnExitNoSave.addEventListener("click", () => { closeEditor(); exitModal.close(); });
  btnExitCancel.addEventListener("click", () => exitModal.close());

  btnHowTo.addEventListener("click", () => howToModal.showModal());
  btnCloseHowTo.addEventListener("click", () => howToModal.close());
  btnSettings.addEventListener("click", openSettings);
  btnCloseSettings.addEventListener("click", () => settingsModal.close());
  settingsForm.addEventListener("submit", applySettings);
  editorGrid.addEventListener("wheel", event => {
    if (!isEditorMode) return;
    const hitbox = event.target.closest?.(".tile-hitbox")
      || getTileHitboxFromPoint(
        event.clientX,
        event.clientY,
        editorGrid,
        stableGridHoverStates.get(editorGrid)?.activeHitbox
      );
    if (!hitbox || hitbox.parentElement !== editorGrid) return;

    const direction = Math.sign(event.deltaY);
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    stepEditorCell(Number(hitbox.dataset.idx), direction);
  }, { passive: false, capture: true });
  editorGrid.addEventListener("pointermove", event => {
    if (!editStroke || event.pointerId !== editStroke.pointerId) return;
    event.preventDefault();
    const hitbox = getTileHitboxFromPoint(
      event.clientX,
      event.clientY,
      editorGrid,
      stableGridHoverStates.get(editorGrid)?.activeHitbox
    );
    if (!hitbox) return;
    continueEditStroke(event, Number(hitbox.dataset.idx));
  });
  editorGrid.addEventListener("contextmenu", event => event.preventDefault());
  window.addEventListener("pointerup", endEditStroke);
  window.addEventListener("pointercancel", endEditStroke);
  const playScreenEl = document.getElementById("playScreen");
  playScreenEl?.addEventListener("pointermove", updatePlayIntroProximity, { passive: true });
  playScreenEl?.addEventListener("pointerleave", () => playIntro.classList.remove("pointer-near"));
  btnTestPlay.addEventListener("click", startTestPlayMode);
  btnStopTest.addEventListener("click", stopTestPlayMode);

  btnAddHint.addEventListener("click", () => addHintInput(""));

  btnPlayHint.addEventListener("click", () => {
    if (document.querySelector('.play-coach-bubble[data-kind="hint"]')) clearPlayCoach();
    playChin();
    showPlayHints();
  });
  btnCloseHintView.addEventListener("click", () => hintViewModal.close());

  btnClearNext.addEventListener("click", () => {
    if (isOfficialPlay && currentLevel && currentLevel._officialIndex !== undefined) {
      const nextIdx = currentLevel._officialIndex + 1;
      if (nextIdx < officialLevels.length) {
        startOfficialPlay(nextIdx);
      }
    }
  });
  btnClearRetry.addEventListener("click", retryRealPlay);

  btnClearBack.addEventListener("click", () => {
    playChin();
    leaveCurrentPlayScreen();
  });

  if (btnPlaySkip) {
    btnPlaySkip.addEventListener("click", () => {
      playChin();
      skipConfirmModal.showModal();
    });
  }

  if (btnSkipConfirmExec) {
    btnSkipConfirmExec.addEventListener("click", () => {
      playChin();
      skipConfirmModal.close();
      if (currentLevel) {
        finishLevel(Math.floor(currentLevel.size / 2), Math.floor(currentLevel.size / 2), playGrid);
      }
    });
  }

  if (btnSkipConfirmCancel) {
    btnSkipConfirmCancel.addEventListener("click", () => {
      skipConfirmModal.close();
    });
  }

  btnSkipExec.addEventListener("click", () => {
    if (pendingSkipLevelIndex !== -1) {
      startOfficialPlay(pendingSkipLevelIndex);
      skipWarningModal.close();
    }
  });
  btnSkipCancel.addEventListener("click", () => skipWarningModal.close());

  if (btnResetProgress) {
    btnResetProgress.addEventListener("click", () => {
      if (confirm("本当にメインステージの進行データを削除しますか？\n（クリア状況・EX/聖域の開放状態がリセットされます）")) {
        playChin();
        localStorage.removeItem(OFFICIAL_PROGRESS_KEY);
        localStorage.removeItem(EX_UNLOCKED_KEY);
        localStorage.removeItem(DLC_UNLOCKED_KEY);
        loadOfficialLevels();
        setTimeout(() => location.reload(), 500);
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "e") cheatKeys.e = true;
    if (e.key.toLowerCase() === "x") cheatKeys.x = true;

    if (isEditorMode && !document.querySelector('dialog[open]')) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          execRedo(); // Ctrl + Shift + Z
        } else {
          execUndo(); // Ctrl + Z
        }
      }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        execRedo(); // Ctrl + Y (Windows標準のRedo)
      }
    }

    const officialScreen = document.getElementById('officialSelectScreen');
    const isOfficialSelectActive = officialScreen?.classList.contains('screen--active');

    if (isOfficialSelectActive && e.shiftKey && e.key.toLowerCase() === "c" && !e.repeat) {
      e.preventDefault();
      toggleHoveredStageClear();
      return;
    }

    if (isOfficialSelectActive && e.shiftKey && cheatKeys.e && cheatKeys.x && !e.repeat) {
      cheatKeys.e = false;
      cheatKeys.x = false;
      localStorage.setItem(EX_UNLOCKED_KEY, 'true');
      loadOfficialLevels();
      playSe('exSpawn');
      showStageToggleNotice("EXTRAステージを解放しました", "ex");
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() === "e") cheatKeys.e = false;
    if (e.key.toLowerCase() === "x") cheatKeys.x = false;
  });

  selectBrush(TYPE_NORMAL);
  initReplaySystem();
}


function initReplaySystem() {
  const oldStyle = document.getElementById('replaySystemStyle');
  if (oldStyle) oldStyle.remove();

  const style = document.createElement('style');
  style.id = 'replaySystemStyle';
  style.textContent = `
    .replay-controls { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); background: rgba(17, 17, 17, 0.9); padding: 10px 20px; border-radius: 40px; display: flex; gap: 12px; align-items: center; z-index: 3000; border: 1px solid #555; box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(5px); }
    .replay-controls.hidden { display: none; }
    .replay-btn { background: none; border: 1px solid rgba(255,255,255,0.1); font-size: 18px; cursor: pointer; color: #fff; width: 44px; height: 44px; display: flex; justify-content: center; align-items: center; border-radius: 50%; transition: all 0.2s; }
    .replay-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }
    .replay-btn:active { transform: scale(0.95); }
    .replay-speed-area { display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 14px; color: #fff; margin: 0 5px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 20px; }
    .replay-text-btn { font-size: 12px; padding: 0 16px; width: auto; height: 36px; border-radius: 18px; background: #444; font-weight: bold; border: none; color: #fff; cursor: pointer; transition: all 0.2s; margin-left: 5px; }
    .replay-text-btn:hover { background: #666; }
    #replaySpeedVal { min-width: 40px; text-align: center; font-weight: bold; color: var(--accent); }

    .btn-grad-next {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
      color: #fff !important;
      border: 1px solid #38ef7d !important;
      box-shadow: 0 4px 15px rgba(56, 239, 125, 0.4) !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .btn-grad-next:hover {
      background: linear-gradient(135deg, #15ac9f 0%, #4aff8f 100%) !important;
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 6px 20px rgba(56, 239, 125, 0.6) !important;
    }

    .btn-grad-replay {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: #fff !important;
      border: 1px solid #764ba2 !important;
      box-shadow: 0 4px 15px rgba(118, 75, 162, 0.4) !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .btn-grad-replay:hover {
      background: linear-gradient(135deg, #7a92ff 0%, #8e5ac2 100%) !important;
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 6px 20px rgba(118, 75, 162, 0.6) !important;
    }
  `;
  document.head.appendChild(style);

  const oldDiv = document.getElementById('replayControls');
  if (oldDiv) oldDiv.remove();

  const div = document.createElement('div');
  div.id = 'replayControls';
  div.className = 'replay-controls hidden';
  div.innerHTML = `
    <button id="btnReplayRestart" class="replay-btn" title="最初から">⏮️</button>
    <button id="btnReplayToggle" class="replay-btn" title="再生/停止">⏸️</button>
    <div class="replay-speed-area">
      <button id="btnReplaySlow" class="replay-btn" style="width:30px; height:30px; font-size:14px;">➖</button>
      <span id="replaySpeedVal">1.0x</span>
      <button id="btnReplayFast" class="replay-btn" style="width:30px; height:30px; font-size:14px;">➕</button>
    </div>
    <button id="btnReplayBack" class="replay-text-btn">戻る</button>
  `;
  document.getElementById('playScreen').appendChild(div);

  document.getElementById('btnReplayRestart').addEventListener('click', () => {
    playChin();
    restartReplay();
  });
  document.getElementById('btnReplayToggle').addEventListener('click', () => {
    playChin();
    toggleReplayPause();
  });
  document.getElementById('btnReplaySlow').addEventListener('click', () => {
    playChin();
    changeReplaySpeed(-0.5);
  });
  document.getElementById('btnReplayFast').addEventListener('click', () => {
    playChin();
    changeReplaySpeed(0.5);
  });
  document.getElementById('btnReplayBack').addEventListener('click', () => {
    playChin();
    stopReplayMode();
  });
}
function showListLoading(container, initialText = "Initializing...") {
  container.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "list-loading-container";

  wrapper.innerHTML = `
    <div class="list-loading-spinner"></div>
    <div class="list-loading-text">0%</div>
    <div class="list-loading-sub">${initialText}</div>
  `;

  container.appendChild(wrapper);

  return {
    update: (percent, subText) => {
      const textEl = wrapper.querySelector(".list-loading-text");
      const subEl = wrapper.querySelector(".list-loading-sub");
      if (textEl) textEl.textContent = `${Math.min(100, Math.floor(percent))}%`;
      if (subEl && subText) subEl.textContent = subText;
    },
    finish: () => {
      wrapper.remove();
    }
  };
}
function parse3aabData(raw) {
  if (raw.format !== "3aab_v2" || !raw.meta || !raw.grid) {
    console.warn("Invalid 3aab format detected.", raw);
    return null;
  }

  const importedData = raw.grid.split(',').map(cellStr => {
    const [t, r, v] = cellStr.split(':').map(Number);
    return { type: t || 0, rot: r || 0, val: v || 0 };
  });

  return {
    name: raw.meta.name || "Unknown",
    sub: raw.meta.sub || "",
    author: raw.meta.author || "Official",
    size: raw.meta.size,
    created: raw.meta.created || 0,
    updated: raw.meta.updated || 0,
    bgTheme: raw.meta.bgTheme || "warm",
    bgmTheme: raw.meta.bgmTheme || "warm",
    hints: raw.hints || [],
    data: importedData
  };
}
window.loadOfficialLevels = async function () {
  officialLevels = [];
  officialLevelsLoaded = false;
  officialListDirty = true;

  const container = document.getElementById("officialLevelList");
  let loader = null;
  if (container) {
    loader = showListLoading(container, "Scanning Main Levels...");
  }

  const ESTIMATED_TOTAL = 50;
  let loadedCount = 0;

  let i = 0;
  while (true) {
    try {
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
      const res = await fetch(`./main_levels/level_stage_${i}.3aab`);
      if (!res.ok) break;

      const raw = await res.json();
      const data = parse3aabData(raw);

      if (data) {
        data._officialIndex = i;
        data._isEx = false;
        officialLevels.push(data);
      }
      i++;
      loadedCount++;
      if (loader) loader.update((loadedCount / ESTIMATED_TOTAL) * 100, `Loading Stage ${i}...`);
    } catch (e) { break; }
  }

  let j = 0;
  while (true) {
    try {
      const res = await fetch(`./main_levels/level_ex_${j}.3aab`);
      if (!res.ok) break;

      const raw = await res.json();
      const data = parse3aabData(raw);

      if (data) {
        data._officialIndex = i + j;
        data._isEx = true;
        officialLevels.push(data);
      }
      j++;
      loadedCount++;
      if (loader) loader.update((loadedCount / ESTIMATED_TOTAL) * 100, `Loading Extra ${j}...`);
    } catch (e) { break; }
  }

  const isDlcUnlocked = localStorage.getItem(DLC_UNLOCKED_KEY) === 'true';
  if (isDlcUnlocked) {
    let k = 0;
    while (true) {
      try {
        const res = await fetch(`./dlc_levels/level_dlc_${k}.3aab`);
        if (!res.ok) break;

        const raw = await res.json();
        const data = parse3aabData(raw);

        if (data) {
          data._officialIndex = i + j + k;
          data._isDlc = true;
          data._dlcNum = k + 1;
          officialLevels.push(data);
        }
        k++;
        loadedCount++;
        if (loader) loader.update((loadedCount / ESTIMATED_TOTAL) * 100, `聖域 ${k} を読み込み中...`);
      } catch (e) { break; }
    }
  }

  if (loader) loader.update(100, "Done!");
  officialLevelsLoaded = true;

  setTimeout(() => {
    renderOfficialList();
  }, 200);
};

const loadOfficialLevels = window.loadOfficialLevels;



function getClearedStages() {
  const val = localStorage.getItem(OFFICIAL_PROGRESS_KEY);
  if (!val) return {};
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) {
      const obj = {};
      parsed.forEach(idx => { obj[idx] = { time: "--:--:--" }; });
      return obj;
    }
    return parsed;
  } catch (e) { return {}; }
}

function saveStageCleared(index, timeStr) {
  const cleared = getClearedStages();
  cleared[index] = { time: timeStr };
  localStorage.setItem(OFFICIAL_PROGRESS_KEY, JSON.stringify(cleared));
  officialListDirty = true;
}

function areAllMainStagesCleared(clearedStages = getClearedStages()) {
  return Array.from(
    { length: MAIN_STAGE_COUNT },
    (_, index) => Boolean(clearedStages[index])
  ).every(Boolean);
}

function getVisibleMainLimit(clearedStages) {
  const clearedMain = Object.keys(clearedStages)
    .map(Number)
    .filter(index => index >= 0 && index < MAIN_STAGE_COUNT);

  if (clearedMain.length === 0) return 0;
  if (clearedStages[25]) return 29;
  if (clearedStages[16]) return 25;
  if (clearedStages[9]) return 16;
  return 9;
}

function showStageToggleNotice(message, tone = "clear") {
  document.querySelector(".stage-toggle-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = `stage-toggle-toast ${tone}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 350);
  }, 1500);
}

function toggleHoveredStageClear() {
  if (hoveredOfficialIndex < 0) {
    showStageToggleNotice("切り替えるパネルにカーソルを合わせてください", "warning");
    return;
  }

  const cleared = getClearedStages();
  const level = officialLevels.find(item => item._officialIndex === hoveredOfficialIndex);
  const displayNumber = level?._isEx
    ? `EXTRA ${hoveredOfficialIndex - MAIN_STAGE_COUNT + 1}`
    : level?._isDlc
      ? `聖域 ${level._dlcNum}`
      : `STAGE ${hoveredOfficialIndex + 1}`;

  if (cleared[hoveredOfficialIndex]) {
    delete cleared[hoveredOfficialIndex];
    localStorage.setItem(OFFICIAL_PROGRESS_KEY, JSON.stringify(cleared));
    showStageToggleNotice(`${displayNumber}を未クリアに戻しました`, "unclear");
  } else {
    cleared[hoveredOfficialIndex] = { time: "--:--:--", toggled: true };
    localStorage.setItem(OFFICIAL_PROGRESS_KEY, JSON.stringify(cleared));
    showStageToggleNotice(`${displayNumber}をクリアにしました`, "clear");
  }

  officialListDirty = true;
  hoveredOfficialIndex = -1;
  renderOfficialList();
}

function bindStageCardMotion(item, progressIndex) {
  const settleEntranceAnimation = () => {
    // 全制覇演出前のEXカードは専用の黒フェード→グリッチで出すため、
    // 通常カード用のcard-arrived固定状態を付けない。
    if (!item.classList.contains("ex-preunlock")) item.classList.add("card-arrived");
  };
  let hoverSwayTimer = 0;
  item.style.setProperty("--tilt-x", "0deg");
  item.style.setProperty("--tilt-y", "0deg");
  item.style.setProperty("--shine-x", "50%");
  const beginHover = () => {
    settleEntranceAnimation();
    window.clearTimeout(hoverSwayTimer);
    item.classList.remove("is-hover-swaying");
    item.classList.add("is-hovered");
    hoverSwayTimer = window.setTimeout(() => {
      if (item.classList.contains("is-hovered")) item.classList.add("is-hover-swaying");
    }, 90);
  };
  const endHover = () => {
    window.clearTimeout(hoverSwayTimer);
    item.classList.remove("is-hover-swaying", "is-hovered");
  };

  item.dataset.progressIndex = String(progressIndex);
  item.tabIndex = 0;
  item.addEventListener("animationend", event => {
    if (event.animationName === "officialCardArrive" || event.animationName === "journeyEntry") {
      settleEntranceAnimation();
    }
  });
  item.addEventListener("focus", () => {
    hoveredOfficialIndex = progressIndex;
    beginHover();
  });
  item.addEventListener("blur", () => {
    if (hoveredOfficialIndex === progressIndex) hoveredOfficialIndex = -1;
    endHover();
  });
  item.addEventListener("pointerenter", () => {
    hoveredOfficialIndex = progressIndex;
    beginHover();
  });
  item.addEventListener("pointermove", event => {
    if (event.pointerType === "touch") return;
    const rect = item.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    item.style.setProperty("--tilt-x", `${(-y * 7).toFixed(2)}deg`);
    item.style.setProperty("--tilt-y", `${(x * 9).toFixed(2)}deg`);
    item.style.setProperty("--shine-x", `${((x + 0.5) * 100).toFixed(1)}%`);
  });
  item.addEventListener("pointerleave", () => {
    if (hoveredOfficialIndex === progressIndex) hoveredOfficialIndex = -1;
    endHover();
    item.style.setProperty("--tilt-x", "0deg");
    item.style.setProperty("--tilt-y", "0deg");
    item.style.setProperty("--shine-x", "50%");
  });
}

function renderOfficialList() {
  if (!officialListContainer) return;
  const previousScrollTop = officialListContainer.scrollTop;
  officialListContainer.innerHTML = "";

  if (!officialLevelsLoaded) {
    officialListContainer.innerHTML = `<div style="padding:20px; text-align:center;">読み込み中...</div>`;
    return;
  }

  const clearedStages = getClearedStages();
  const clearedIndices = Object.keys(clearedStages).map(Number);
  const clearedMainIndices = clearedIndices.filter(index => index >= 0 && index < MAIN_STAGE_COUNT);
  const maxCleared = clearedMainIndices.length > 0 ? Math.max(...clearedMainIndices) : -1;
  const mainClearedCount = clearedMainIndices.length;
  const isFirstJourney = mainClearedCount === 0;
  const visibleMainLimit = getVisibleMainLimit(clearedStages);
  const stagePanel = officialListContainer.closest(".official-stage-panel");
  const progressBadge = document.getElementById("officialProgressBadge");
  const exProgress = document.getElementById("officialExProgress");

  if (stagePanel) stagePanel.classList.toggle("first-journey", isFirstJourney);
  if (progressBadge) {
    const count = progressBadge.querySelector(".official-progress-main strong");
    if (count) count.textContent = String(mainClearedCount);
    progressBadge.classList.toggle("has-progress", mainClearedCount > 0);
  }

  const isExUnlocked = localStorage.getItem(EX_UNLOCKED_KEY) === 'true';
  const exClearedCount = clearedIndices.filter(index =>
    index >= MAIN_STAGE_COUNT && index < MAIN_STAGE_COUNT + 10
  ).length;
  if (exProgress) {
    const count = exProgress.querySelector("strong");
    if (count) count.textContent = String(exClearedCount);
    exProgress.hidden = !isExUnlocked;
  }
  const hasDlcUnlocked = isDlcUnlocked();

  const isAllMainCleared = areAllMainStagesCleared(clearedStages);

  const isPreparingExUnlock = isAllMainCleared && !isExUnlocked;
  let exBoundaryAdded = false;

  officialLevels.forEach((level, idx) => {
    if (level._isEx && !isExUnlocked && !isPreparingExUnlock) return;
    if (level._isDlc && !hasDlcUnlocked) return;
    if (!level._isEx && !level._isDlc && level._officialIndex > visibleMainLimit) return;

    if (level._isEx && !exBoundaryAdded && !isPreparingExUnlock) {
      exBoundaryAdded = true;
      const boundary = document.createElement("div");
      boundary.className = `ex-zone-boundary${isPreparingExUnlock ? " preunlock" : ""}`;
      boundary.innerHTML = `
        <div class="ex-glitch-line"><i></i><i></i><i></i></div>
        <div class="ex-boundary-copy">
          <span>CLASSIFIED SECTOR</span>
          <strong>ここから先は EXTRA</strong>
          <small>SCROLL TO DESCEND</small>
        </div>
      `;
      officialListContainer.appendChild(boundary);
    }

    const item = document.createElement("div");
    item.className = "level-item official";
    item.style.setProperty("--card-i", String(Math.min(idx, 12)));
    if (level._isEx) {
      item.style.setProperty("--ex-i", String(level._officialIndex - MAIN_STAGE_COUNT));
    }

    if (level._isEx) item.classList.add("ex");
    if (level._isDlc) item.classList.add("dlc");
    if (level._isEx && isPreparingExUnlock) item.classList.add("ex-preunlock");
    if (!level._isEx && !level._isDlc && MINI_BOSS_STAGES.has(level._officialIndex)) {
      item.classList.add("mini-boss");
    }

    const clearData = clearedStages[idx];
    const isCleared = !!clearData;

    let isUnlocked = (idx <= maxCleared + 1);
    if (level._isEx) isUnlocked = isExUnlocked || isPreparingExUnlock;
    if (level._isDlc) isUnlocked = true;

    if (!isUnlocked) item.classList.add("locked");
    if (isUnlocked && !isCleared && !level._isEx && !level._isDlc) item.classList.add("current-stage");
    if (isFirstJourney && level._officialIndex === 0) item.classList.add("journey-entry");

    let stageLabel = `STAGE ${level._officialIndex + 1}`;
    let cardIndexLabel = String(level._officialIndex + 1).padStart(2, "0");
    if (level._isEx) {
      const extraNumber = level._officialIndex - MAIN_STAGE_COUNT + 1;
      stageLabel = `EXTRA ${extraNumber}`;
      cardIndexLabel = `EX-${String(extraNumber).padStart(2, "0")}`;
    } else if (level._isDlc) {
      stageLabel = `聖域 ${level._dlcNum}`;
      cardIndexLabel = `S-${String(level._dlcNum).padStart(2, "0")}`;
    }

    const timeHtml = isCleared
      ? `<div class="clear-time-info"><span>CLEAR TIME</span><strong>${clearData.time}</strong></div>`
      : "";

    const displaySubtitle = level._isDlc ? level.name : (level.sub || "");
    const exRevealLayerHtml = item.classList.contains("ex-preunlock")
      ? `<span class="ex-black-panel" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`
      : "";
    item.innerHTML = `
      <span class="card-sheen" aria-hidden="true"></span>
      ${item.classList.contains("mini-boss") ? `<span class="mini-boss-flow" aria-hidden="true"></span>` : ""}
      <span class="stage-card-index">${cardIndexLabel}</span>
      ${item.classList.contains("mini-boss") ? `<span class="mini-boss-mark" aria-label="ミニボス">💀</span>` : ""}
      <h4>${stageLabel}</h4>
      <p>${level.name}</p>
      <div class="sub-title">${displaySubtitle}</div>
      <div class="author-name">by ${level.author || "公式"}</div>
      ${timeHtml}
      ${isCleared ? `<span class="clear-stamp" aria-label="クリア済み">★<small>CLEAR</small></span>` : ""}
      ${item.classList.contains("current-stage") ? `<span class="next-stage-mark">NEXT</span>` : ""}
      ${!isUnlocked ? `<span class="stage-lock-mark">LOCKED</span>` : ""}
      ${exRevealLayerHtml}
    `;

    item.addEventListener("click", () => {
      playChin();
      if (isUnlocked) startOfficialPlay(idx);
      else if (!level._isEx && !level._isDlc) {
        pendingSkipLevelIndex = idx;
        skipWarningModal.showModal();
      }
    });

    officialListContainer.appendChild(item);
    bindStageCardMotion(item, level._officialIndex);

    if (isCleared) {
      if (level._officialIndex === lastClearedIndex) {
        item.dataset.isClearedEntry = "true";
      } else {
        item.classList.add("cleared", "clear-revealed");
      }
    }
  });

  if (isFirstJourney) {
    const firstGuide = document.createElement("div");
    firstGuide.className = "first-journey-guide";
    firstGuide.innerHTML = `
      <span class="first-journey-line"></span>
      <div>
        <strong>最初の一歩</strong>
        <p>STAGE 1をクリアすると、最初のミニボスまでが姿を現します。</p>
      </div>
    `;
    officialListContainer.appendChild(firstGuide);
  } else if (visibleMainLimit < MAIN_STAGE_COUNT - 1 && !isAllMainCleared) {
    const nextSection = MAIN_SECTION_ENDS.find(end => end > visibleMainLimit) ?? (MAIN_STAGE_COUNT - 1);
    const sectionGate = document.createElement("div");
    sectionGate.className = "main-section-gate";
    sectionGate.innerHTML = `
      <span>ROUTE LOCKED</span>
      <strong>STAGE ${visibleMainLimit + 1}のミニボスを突破せよ</strong>
      <small>突破後、STAGE ${nextSection + 1}まで解放</small>
    `;
    const exBoundary = officialListContainer.querySelector(".ex-zone-boundary");
    officialListContainer.insertBefore(sectionGate, exBoundary || null);
  }

  setTimeout(() => {
    const items = Array.from(officialListContainer.querySelectorAll(".level-item"));
    const clearedItems = items.filter(el => el.dataset.isClearedEntry === "true");

    clearedItems.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add("card-arrived");
        el.classList.add("flip-reveal");
        setTimeout(() => el.classList.add("cleared"), 360);
        setTimeout(() => {
          el.classList.remove("flip-reveal");
          el.classList.add("clear-revealed");
          el.style.opacity = "1";
        }, 900);
      }, i * 100);
    });
    if (clearedItems.length) lastClearedIndex = -1;
  }, 180);

  officialListContainer.onscroll = () => updateExZoneMood();
  officialListDirty = false;
  requestAnimationFrame(() => {
    if (pendingOfficialReturnIndex >= 0) {
      restoreOfficialSelectionPosition();
    } else {
      officialListContainer.scrollTop = previousScrollTop;
      updateExZoneMood();
    }
  });

  if (!isDlcUnlocked() && isAllMainCleared && isExUnlocked) {
    const codeContainer = document.createElement("div");
    codeContainer.className = "secret-code-area sanctuary-unlock-box";

    codeContainer.innerHTML = `
      <div class="sanctuary-unlock-heading">
        <span>SANCTUARY ACCESS</span>
        <strong>聖域への扉</strong>
        <small>すべてのメインステージを終えた者だけが、コードを入力できます。</small>
      </div>
      <div class="secret-input-wrapper">
        <input type="text" id="secretCodeInput" placeholder="ACCESS CODE" autocomplete="off">
        <button id="btnSecretCode" class="btn primary small">OPEN</button>
      </div>
    `;
    officialListContainer.appendChild(codeContainer);

    const btn = document.getElementById("btnSecretCode");
    const inp = document.getElementById("secretCodeInput");
    const wrapper = codeContainer.querySelector(".secret-input-wrapper");

    if (btn && inp) {
      let isProcessing = false;

      const checkCode = () => {
        if (isProcessing) return;
        isProcessing = true;
        btn.disabled = true;
        inp.disabled = true;

        const val = inp.value.trim().toLowerCase();

        if (val === "newgame") {
          playChin();
          playSe("exSpawn");
          localStorage.setItem(DLC_UNLOCKED_KEY, 'true');

          btn.textContent = "UNLOCKED!";
          btn.classList.remove("primary");
          btn.style.backgroundColor = "#2ed573";
          btn.style.color = "#fff";
          wrapper.style.opacity = "0"; // 入力欄をフェードアウト
          wrapper.style.transition = "opacity 1s";

          loadOfficialLevels();

          const lockedItems = document.querySelectorAll('.palette-item.locked');
          lockedItems.forEach(lockedBtn => {
            if (lockedBtn.dataset.originalHtml) {
              lockedBtn.innerHTML = lockedBtn.dataset.originalHtml;
            }
            lockedBtn.classList.remove('locked');
          });

          setTimeout(() => {
            codeContainer.remove();
          }, 1500);

        } else {
          playSe("died");
          wrapper.classList.add("input-error");
          inp.value = "";
          setTimeout(() => {
            wrapper.classList.remove("input-error");
            btn.disabled = false;
            inp.disabled = false;
            inp.focus();
            isProcessing = false;
          }, 500);
        }
      };

      btn.addEventListener("click", checkCode);
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") checkCode();
      });
    }
  }

  if (isPreparingExUnlock) {
    queueAllClearSequence();
  }
}
function updateExZoneMood() {
  const screen = document.getElementById("officialSelectScreen");
  const boundary = officialListContainer?.querySelector(".ex-zone-boundary");
  if (!screen?.classList.contains("screen--active")) return;
  if (!boundary) {
    screen.classList.remove("near-ex-zone", "ex-glitch-pulse");
    exZoneMoodActive = false;
    setGlobalGlitchTarget(0);
    if (!allClearSequenceRunning) {
      setStageTheme("warm");
      playStageBgm("warm");
    }
    return;
  }
  if (boundary.classList.contains("preunlock") && !screen.classList.contains("ex-awakening")) return;

  const listRect = officialListContainer.getBoundingClientRect();
  const boundaryRect = boundary.getBoundingClientRect();
  const shouldActivate = boundaryRect.top < listRect.bottom - 70;

  screen.classList.toggle("near-ex-zone", shouldActivate);
  if (shouldActivate === exZoneMoodActive || allClearSequenceRunning) return;

  exZoneMoodActive = shouldActivate;
  setGlobalGlitchTarget(0);
  window.clearTimeout(exZonePulseTimer);
  screen.classList.remove("ex-glitch-pulse");
  if (shouldActivate) {
    void screen.offsetWidth;
    screen.classList.add("ex-glitch-pulse");
    triggerGlobalGlitchPulse(0.78, 900);
    exZonePulseTimer = window.setTimeout(() => {
      screen.classList.remove("ex-glitch-pulse");
    }, 920);
  }
  setStageTheme(shouldActivate ? "space" : "warm");
  playStageBgm(shouldActivate ? "vertex" : "warm");
}

function queueAllClearSequence(delay = 180) {
  window.clearTimeout(allClearSequenceTimer);
  const clearedStages = getClearedStages();
  const isComplete = areAllMainStagesCleared(clearedStages);

  if (!isComplete || localStorage.getItem(EX_UNLOCKED_KEY) === "true") return;

  const effectiveDelay = immediateAllClearRequested ? 0 : delay;

  allClearSequenceTimer = window.setTimeout(() => {
    allClearSequenceTimer = 0;
    immediateAllClearRequested = false;
    triggerAllClearSequence();
  }, effectiveDelay);
}

function shouldStartFinalMainSequence() {
  return Boolean(
    !isReplayMode &&
    isRealPlay &&
    isOfficialPlay &&
    currentLevel &&
    !currentLevel._isEx &&
    !currentLevel._isDlc &&
    currentLevel._officialIndex === MAIN_STAGE_COUNT - 1 &&
    localStorage.getItem(EX_UNLOCKED_KEY) !== "true" &&
    areAllMainStagesCleared()
  );
}

function restoreOfficialSelectionPosition() {
  const screen = document.getElementById("officialSelectScreen");
  if (!screen?.classList.contains("screen--active") || !officialListContainer) return;

  if (pendingOfficialReturnIndex >= 0) {
    const card = officialListContainer.querySelector(
      `.level-item[data-progress-index="${pendingOfficialReturnIndex}"]`
    );
    if (card) {
      const targetTop = Math.max(
        0,
        card.offsetTop - (officialListContainer.clientHeight - card.offsetHeight) * 0.42
      );
      officialListContainer.scrollTop = targetTop;
    }
  }

  pendingOfficialReturnIndex = -1;
  delete screen.dataset.restoreExMood;
  requestAnimationFrame(() => {
    updateExZoneMood();
    queueAllClearSequence();
  });
}

function leaveCurrentPlayScreen() {
  if (isOfficialPlay) {
    const returnIndex = currentLevel?._officialIndex ?? lastOfficialPlayedIndex;
    pendingOfficialReturnIndex = returnIndex;
    const restoreExMood = returnIndex >= MAIN_STAGE_COUNT;
    const screen = document.getElementById("officialSelectScreen");
    if (screen) screen.dataset.restoreExMood = restoreExMood ? "true" : "false";
    stopPlayMode(restoreExMood);
    showScreen("officialSelect");
    return;
  }

  stopPlayMode();
  if (isFanmadePlay) showScreen("fanmadeSelect");
  else showScreen("editorSelect");
}

function animateOfficialListScroll(target, duration) {
  return new Promise(resolve => {
    const maxScroll = Math.max(0, officialListContainer.scrollHeight - officialListContainer.clientHeight);
    const safeTarget = Math.max(0, Math.min(maxScroll, target));
    const start = officialListContainer.scrollTop;
    const distance = safeTarget - start;
    const startedAt = performance.now();
    const easeInOut = value => value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;

    const tick = now => {
      if (!allClearSequenceRunning) {
        resolve(false);
        return;
      }
      const progress = Math.min(1, (now - startedAt) / duration);
      officialListContainer.scrollTop = start + distance * easeInOut(progress);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        officialListContainer.scrollTop = safeTarget;
        resolve(true);
      }
    };
    requestAnimationFrame(tick);
  });
}

function getOfficialCardScrollTarget(card, verticalBias = 0.5) {
  if (!card || !officialListContainer) return 0;
  const maxScroll = Math.max(0, officialListContainer.scrollHeight - officialListContainer.clientHeight);
  const freeSpace = Math.max(0, officialListContainer.clientHeight - card.offsetHeight);
  const target = card.offsetTop - freeSpace * verticalBias;
  return Math.max(0, Math.min(maxScroll, target));
}

const waitForFinale = duration => new Promise(resolve => setTimeout(resolve, duration));
const waitForFinaleFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

/**
 * CSS transition に頼らず、実際の描画時刻を使って opacity を更新する。
 * 初回表示時に 0 のフレームが飛ばされるブラウザ差を避けるため、
 * opacity はインラインの !important で固定し、毎フレーム上書きする。
 */
function animateFinaleOpacity(element, from, to, duration) {
  return new Promise(resolve => {
    if (!element) {
      resolve(false);
      return;
    }

    element.style.setProperty("visibility", "visible", "important");
    element.style.setProperty("transition", "none", "important");
    element.style.setProperty("opacity", String(from), "important");

    let startedAt = null;
    const easeInOut = value => value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;

    const tick = now => {
      if (!allClearSequenceRunning) {
        resolve(false);
        return;
      }

      if (startedAt === null) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / duration);
      const opacity = from + (to - from) * easeInOut(progress);
      element.style.setProperty("opacity", opacity.toFixed(4), "important");

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.style.setProperty("opacity", String(to), "important");
        resolve(true);
      }
    };

    requestAnimationFrame(tick);
  });
}

async function revealPreunlockExCards(screen) {
  const cards = Array.from(
    officialListContainer.querySelectorAll(".level-item.ex-preunlock")
  );
  if (cards.length === 0) return true;

  // カード本体を直接フェードさせると、visibility と animation の描画順により
  // 最初の透明フレームが飛ぶ場合がある。透明なカード枠の上に専用の黒レイヤーを置き、
  // そのレイヤーだけを別フレームでフェードさせる。
  cards.forEach(card => {
    card.getAnimations().forEach(animation => animation.cancel());
    card.classList.remove(
      "ex-black-fading",
      "ex-glitch-materializing",
      "ex-unlock-revealed",
      "card-arrived"
    );

    const blackPanel = card.querySelector(".ex-black-panel");
    if (blackPanel) {
      blackPanel.getAnimations().forEach(animation => animation.cancel());
      blackPanel.style.setProperty("visibility", "visible", "important");
      blackPanel.style.setProperty("transition", "none", "important");
      blackPanel.style.setProperty("animation", "none", "important");
      blackPanel.style.setProperty("opacity", "0", "important");
    }

    card.classList.add("ex-reveal-ready");
  });

  // 透明な状態を最低2回の再描画＋短い静止時間で確実に画面へ反映する。
  await waitForFinaleFrame();
  await waitForFinaleFrame();
  await waitForFinale(260);
  if (!allClearSequenceRunning) return false;

  screen.classList.add("ex-awakening");

  const revealOne = async (card, index) => {
    await waitForFinale(index * 140);
    if (!allClearSequenceRunning) return false;

    const blackPanel = card.querySelector(".ex-black-panel");
    if (!blackPanel) return false;

    // 0→1を1.2秒かけてJSで毎フレーム更新するため、突然真っ黒にはならない。
    card.classList.add("ex-black-fading");
    const fadedIn = await animateFinaleOpacity(blackPanel, 0, 1, 1200);
    if (!fadedIn || !allClearSequenceRunning) return false;

    await waitForFinale(120);
    if (!allClearSequenceRunning) return false;

    // CSSグリッチへ渡す直前に、JSの !important 固定だけを解除する。
    blackPanel.style.removeProperty("animation");
    blackPanel.style.removeProperty("transition");
    blackPanel.style.removeProperty("opacity");
    blackPanel.style.removeProperty("visibility");

    // 黒いカードを横断ノイズで分解し、下にある本来のEXカードへ置換する。
    card.classList.add("ex-glitch-materializing");
    if (index === 0) triggerGlobalGlitchPulse(0.72, 720);
    await waitForFinale(920);
    if (!allClearSequenceRunning) return false;

    card.classList.remove(
      "ex-reveal-ready",
      "ex-black-fading",
      "ex-glitch-materializing"
    );
    card.classList.add("ex-unlock-revealed", "card-arrived");
    return true;
  };

  const results = await Promise.all(cards.map(revealOne));
  return results.every(Boolean);
}

async function triggerAllClearSequence() {
  if (allClearSequenceRunning || allClearOverlay.classList.contains("active")) return;

  const screen = document.getElementById("officialSelectScreen");
  if (!screen?.classList.contains("screen--active")) return;

  allClearSequenceRunning = true;
  officialListContainer.style.scrollBehavior = "auto";
  officialListContainer.scrollTop = 0;
  screen.classList.add("finale-locked");
  fadeOutStageBgm(0.7);
  playSe("allClear");

  allClearOverlay.className = "all-clear-overlay active phase-congrats";
  congratsText.classList.remove("finished");
  exUnlockText.classList.remove("visible");

  await waitForFinale(3300);
  if (!allClearSequenceRunning) return;

  congratsText.classList.add("finished");
  allClearOverlay.classList.remove("phase-congrats");
  allClearOverlay.classList.add("phase-scan");
  screen.classList.add("finale-scan");

  // 1段階目: STAGE 30の行までin-outで移動し、到達した行を一度見せる。
  const stage30Card = officialListContainer.querySelector(
    `.level-item[data-progress-index="${MAIN_STAGE_COUNT - 1}"]`
  );
  const stage30Target = getOfficialCardScrollTarget(stage30Card, 0.5);
  const reachedStage30 = await animateOfficialListScroll(stage30Target, 4000);
  if (!reachedStage30 || !allClearSequenceRunning) return;

  await waitForFinale(950);
  if (!allClearSequenceRunning) return;

  // 2段階目: EX先頭カードが見える位置まで、指定どおり1秒のin-outで移動する。
  const firstExCard = officialListContainer.querySelector(".level-item.ex-preunlock");
  const maxScroll = Math.max(0, officialListContainer.scrollHeight - officialListContainer.clientHeight);
  const exTarget = firstExCard
    ? getOfficialCardScrollTarget(firstExCard, 0.38)
    : maxScroll;
  const reachedEx = await animateOfficialListScroll(exTarget, 1000);
  if (!reachedEx || !allClearSequenceRunning) return;

  // EX位置へ着いた瞬間には何も出さず、到着した画面を一度描画してから出現を始める。
  officialListContainer.scrollTop = exTarget;
  await waitForFinaleFrame();
  await waitForFinale(220);
  if (!allClearSequenceRunning) return;

  screen.classList.remove("finale-scan");
  officialListContainer.scrollTop = exTarget;
  allClearOverlay.classList.remove("phase-scan");
  allClearOverlay.classList.add("phase-reveal");
  setGlobalGlitchTarget(0);
  playSe("exSpawn");

  const revealed = await revealPreunlockExCards(screen);
  if (!revealed || !allClearSequenceRunning) return;
  triggerGlobalGlitchPulse(0.82, 760);

  await waitForFinale(1200);
  if (!allClearSequenceRunning) return;

  allClearOverlay.classList.remove("phase-reveal");
  allClearOverlay.classList.add("phase-blackout");
  setGlobalGlitchTarget(0);
  await waitForFinale(850);

  localStorage.setItem(EX_UNLOCKED_KEY, "true");
  officialListDirty = true;
  officialListContainer.scrollTop = 0;
  screen.classList.remove(
    "finale-locked",
    "finale-scan",
    "finale-blackout",
    "ex-awakening",
    "near-ex-zone",
    "ex-glitch-pulse"
  );
  delete screen.dataset.restoreExMood;
  exZoneMoodActive = false;
  showScreen("title");

  await waitForFinale(520);
  allClearSequenceRunning = false;
  allClearOverlay.classList.remove("active", "phase-blackout");
  await waitForFinale(700);
  allClearOverlay.className = "all-clear-overlay hidden";
  congratsText.classList.remove("finished");
  exUnlockText.classList.remove("visible");
}

function startOfficialPlay(idx) {
  const levelData = officialLevels[idx];
  if (!levelData) return;
  lastOfficialPlayedIndex = levelData._officialIndex;
  currentLevel = JSON.parse(JSON.stringify(levelData));
  levelSessionStartTime = Date.now();
  startRealPlay(null, true);
}

function handleImportLevel(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.name.toLowerCase().endsWith(".json") || file.type === "application/json") {
    fileImport.value = ""; // 選択解除
    playSe('died');
    alert("【エラー】\n更新により .json 形式の読み込みは廃止されました。\nレベルリストにある「3aab変換」ボタンから、\njsonファイルを .3aab 形式に変換して再度読み込んでください。");
    return;
  }

  importOverlay.classList.add("active");

  setTimeout(() => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target.result);
        let newLevel = {};

        if (raw.format === "3aab_v2" && raw.meta && raw.grid) {
          const importedData = raw.grid.split(',').map(cellStr => {
            const [t, r, v] = cellStr.split(':').map(Number);
            return { type: t || 0, rot: r || 0, val: v || 0 };
          });

          newLevel = {
            id: Date.now().toString(),
            name: raw.meta.name || "Imported",
            sub: raw.meta.sub || "",
            author: raw.meta.author || "Unknown",
            size: raw.meta.size,
            created: raw.meta.created || Date.now(),
            updated: Date.now(),
            bgTheme: raw.meta.bgTheme || "warm",
            bgmTheme: raw.meta.bgmTheme || "warm",
            hints: raw.hints || [],
            data: importedData
          };
        } else {
          throw new Error("Invalid 3aab format");
        }

        const importErrors = validateLevel(newLevel);
        if (importErrors.length) throw new Error(importErrors.join(" / "));

        const levels = getSavedLevels();
        levels.push(newLevel);
        saveLevels(levels);
        renderList();

        playChin();
        alert("インポートしました！");

      } catch (err) {
        console.error(err);
        playSe('died');
        alert("ファイルの読み込みに失敗しました。\n正しい .3aab ファイルを選択してください。\n(古い .json ファイルは「3aab変換」で変換が必要です)");
      }
      importOverlay.classList.remove("active");
      fileImport.value = "";
    };
    reader.readAsText(file);
  }, 500);
}

async function processConverterFiles(files) {
  const targetFiles = files.filter(f => f.name.toLowerCase().endsWith(".json"));

  if (targetFiles.length === 0) {
    alert("JSONファイルが選択されていません。");
    return;
  }

  showLoading(async () => {
    try {
      if (targetFiles.length === 1) {
        const file = targetFiles[0];
        const text = await file.text();
        const json = JSON.parse(text);
        const convertedStr = convertJsonTo3aabString(json);

        const baseName = file.name.replace(/\.json$/i, "");
        downloadStringAsFile(convertedStr, `${baseName}.3aab`);
        playChin();
        alert("変換完了！ダウンロードを開始しました。");
        converterModal.close();

      } else {
        if (!window.JSZip) {
          alert("ZIP圧縮ライブラリが読み込まれていません。\nインターネット接続を確認するか、再読み込みしてください。");
          return;
        }

        const zip = new JSZip();
        let successCount = 0;

        for (const file of targetFiles) {
          try {
            const text = await file.text();
            const json = JSON.parse(text);
            const convertedStr = convertJsonTo3aabString(json);
            const baseName = file.name.replace(/\.json$/i, "");
            zip.file(`${baseName}.3aab`, convertedStr);
            successCount++;
          } catch (err) {
            console.error(`Failed to convert ${file.name}`, err);
          }
        }

        if (successCount > 0) {
          const content = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(content);
          const a = document.createElement("a");
          a.href = url;
          a.download = "converted_levels.zip";
          a.click();
          URL.revokeObjectURL(url);

          playChin();
          alert(`${successCount}個のファイルを変換し、ZIPでダウンロードしました。`);
          converterModal.close();
        } else {
          alert("正常に変換できるファイルがありませんでした。");
        }
      }
    } catch (err) {
      console.error(err);
      playSe('died');
      alert("変換中にエラーが発生しました。\nファイルが正しいJSON形式か確認してください。");
    }
  }, 500);
}
function convertJsonTo3aabString(rawJson) {
  if (!Array.isArray(rawJson.data)) {
    throw new Error("Invalid legacy JSON format");
  }

  const compressedGrid = rawJson.data.map(c => {
    return `${c.type}:${c.rot || 0}:${c.val || 0}`;
  }).join(',');

  const metaObj = {
    name: rawJson.name || "Converted",
    sub: rawJson.sub || "",
    author: rawJson.author || "Unknown",
    size: rawJson.size || 10,
    bgTheme: rawJson.bgTheme || "warm",
    bgmTheme: rawJson.bgmTheme || "warm",
    created: rawJson.created || Date.now(),
    updated: Date.now()
  };

  return `{\n` +
    `"format": "3aab_v2",\n` +
    `"meta": ${JSON.stringify(metaObj)},\n` +
    `"hints": ${JSON.stringify(rawJson.hints || [])},\n` +
    `"grid": "${compressedGrid}"\n` +
    `}`;
}

function downloadStringAsFile(str, filename) {
  const blob = new Blob([str], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


function exportLevel() {
  if (!currentLevel) return;
  if (!ensureLevelValid(currentLevel, "エクスポート", true)) return;

  const compressedGrid = currentLevel.data.map(c => {
    return `${c.type}:${c.rot || 0}:${c.val || 0}`;
  }).join(',');

  const metaObj = {
    name: currentLevel.name,
    sub: currentLevel.sub,
    author: currentLevel.author,
    size: currentLevel.size,
    bgTheme: currentLevel.bgTheme,
    bgmTheme: currentLevel.bgmTheme,
    created: currentLevel.created,
    updated: Date.now()
  };

  const fileContent = `{\n` +
    `"format": "3aab_v2",\n` +
    `"meta": ${JSON.stringify(metaObj)},\n` +
    `"hints": ${JSON.stringify(currentLevel.hints || [])},\n` +
    `"grid": "${compressedGrid}"\n` +
    `}`;

  const blob = new Blob([fileContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const safeName = currentLevel.name.replace(/[\\/:*?"<>|]/g, '_');
  a.download = `${safeName}.3aab`;

  a.click();
  URL.revokeObjectURL(url);
  playChin();
}


function getSavedLevels() { const json = localStorage.getItem(STORAGE_KEY); return json ? JSON.parse(json) : []; }
function saveLevels(levels) { localStorage.setItem(STORAGE_KEY, JSON.stringify(levels)); }
function deleteLevel(id) {
  const levels = getSavedLevels();
  const newLevels = levels.filter(l => l.id !== id);
  saveLevels(newLevels);
  if (selectedLevelId === id) selectedLevelId = null;
  renderList();
}

function renderList() {
  const levels = getSavedLevels();
  levels.sort((a, b) => (b.updated || 0) - (a.updated || 0));

  listContainer.innerHTML = "";
  if (!selectedLevelId) { detailsPanel.classList.add("hidden"); noSelectionMsg.style.display = "block"; }
  else {
    const exists = levels.find(l => l.id === selectedLevelId);
    if (!exists) { selectedLevelId = null; detailsPanel.classList.add("hidden"); noSelectionMsg.style.display = "block"; }
  }
  if (levels.length === 0) { listContainer.innerHTML = `<div class="empty-msg" style="text-align:center; padding:20px; color:#888;">保存されたレベルはありません。</div>`; return; }
  levels.forEach(level => {
    const item = document.createElement("div");
    item.className = "level-item";
    if (level.id === selectedLevelId) item.classList.add("active");
    item.innerHTML = `<div class="level-info"><h4>${escapeHtml(level.name)}</h4><p>${level.size} × ${level.size}</p></div>`;
    item.addEventListener("click", () => selectLevel(level));
    listContainer.appendChild(item);
  });
}

function selectLevel(level) {
  selectedLevelId = level.id;
  renderList();
  noSelectionMsg.style.display = "none";
  detailsPanel.classList.remove("hidden");

  detailTitle.textContent = level.name;
  detailSub.textContent = level.sub || "";
  detailAuthor.textContent = level.author || "名無し";

  const dateStr = new Date(level.created).toLocaleDateString();
  const updateStr = level.updated ? new Date(level.updated).toLocaleString() : "-";
  detailSizeDate.textContent = `サイズ: ${level.size}x${level.size} | 作成: ${dateStr}`;
  detailUpdate.textContent = `最終更新: ${updateStr}`;

  const previewBox = document.querySelector(".preview-box");
  renderLevelPreview(previewBox, level);
}

function renderLevelPreview(container, level) {
  container.innerHTML = "";
  container.className = "preview-box active";

  const stage = document.createElement("div");
  stage.className = "editor-grid preview-grid";
  stage.style.setProperty('--cols', level.size);
  stage.style.pointerEvents = "none";

  level.data.forEach(cellData => {
    const tile = document.createElement("div");
    tile.className = "tile";
    if (cellData.type === 14) {
      const cry = document.createElement("div");
      cry.className = "crystal-3d";
      const core = document.createElement("div");
      core.className = "core";
      cry.appendChild(core);
      tile.appendChild(cry);
    }
    tile.dataset.type = cellData.type;
    tile.style.setProperty('--r', `${cellData.rot * 90}deg`);
    if (cellData.type === 16) tile.style.setProperty('--r', '0deg');
    if (cellData.val) tile.dataset.val = cellData.val;
    if (cellData.type === 15) tile.classList.add("off");
    stage.appendChild(tile);
  });

  container.appendChild(stage);

  requestAnimationFrame(() => {
    const parentW = container.clientWidth;
    const parentH = container.clientHeight;

    const gridSize = level.size * 52;

    const fitScale = Math.min(parentW / gridSize, parentH / gridSize) * 0.55;

    stage.style.transformOrigin = "center center";

    stage.style.transform = `scale(${fitScale}) rotateX(55deg) rotateZ(45deg)`;
  });
}
function escapeHtml(str) { if (!str) return ""; return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])); }

function openNewLevelModal() { const levels = getSavedLevels(); if (levels.length >= MAX_LEVELS) { alert(`保存できるレベルは${MAX_LEVELS}個までです。`); return; } formNew.reset(); modalNew.showModal(); }
function handleCreateLevel(e) {
  e.preventDefault(); const formData = new FormData(formNew); const size = parseInt(formData.get("gridSize"), 10);
  const newLevel = {
    id: Date.now().toString(), name: formData.get("levelName"), sub: formData.get("levelSub") || "", author: formData.get("levelAuthor") || "No Name",
    size: size,
    autoSave: 0,
    created: Date.now(), updated: Date.now(),
    bgTheme: "warm", bgmTheme: "warm",
    data: Array(size * size).fill(null).map(() => ({ type: TYPE_NORMAL, rot: 0, val: 0 })),
    hints: [],
  };
  const levels = getSavedLevels(); levels.push(newLevel); saveLevels(levels); modalNew.close(); selectedLevelId = newLevel.id; loadLevelEditor(newLevel.id);
}

function loadLevelEditor(id) {
  const levels = getSavedLevels();
  currentLevel = levels.find(l => l.id === id);
  if (!currentLevel) return;

  if (!currentLevel.hints) currentLevel.hints = [];
  if (!currentLevel.data || currentLevel.data.length !== currentLevel.size * currentLevel.size) {
    currentLevel.data = Array(currentLevel.size * currentLevel.size).fill(null).map(() => createTileData(TYPE_NORMAL));
  }
  currentLevel.data = currentLevel.data.map(cell => createTileData(cell.type, cell.rot, cell.val));
  resetHistory();
  editStroke = null;

  isRealPlay = false;
  isEditorMode = true;
  isOfficialPlay = false;

  showLoading(() => {
    document.getElementById("editorLevelTitle").textContent = currentLevel.name;

    const bgTheme = currentLevel.bgTheme || "warm";
    const bgmTheme = currentLevel.bgmTheme || "warm";
    setStageTheme(bgTheme);
    playStageBgm(bgmTheme);

    if (currentLevel._isDlc) {
      setShowDlcPillars(true);
    } else {
      setShowDlcPillars(false);
    }

    renderGrid(editorGrid);
    showScreen("editorMain");
    requestAnimationFrame(fitVisibleGrids);

    if (audioSettings.autoSaveInterval > 0) {
      startAutoSave(audioSettings.autoSaveInterval);
    } else {
      stopAutoSave();
    }

    startEditorTimer();
  });
}
function closeEditor() {
  stopEditorTimer(); stopAutoSave(); stopTestPlayMode();
  editStroke = null;
  setShowDlcPillars(false);
  showScreen("editorSelect"); renderList();
}

function tilesEqual(a, b) {
  return a.type === b.type && (a.rot || 0) === (b.rot || 0) && (a.val || 0) === (b.val || 0);
}

function removeOldestEffectNode(set) {
  const oldest = set.values().next().value;
  if (!oldest) return;
  gsap.killTweensOf(oldest);
  oldest.remove();
  set.delete(oldest);
}

function clearTransientEffects(container) {
  for (const set of [activeTrailNodes, activeFireParticles, activeWarpLines, activeJumpPreviewNodes]) {
    for (const node of set) {
      if (!container || node.parentElement === container || !node.isConnected) {
        gsap.killTweensOf(node);
        node.remove();
        set.delete(node);
      }
    }
  }
  for (const tile of activeWarpFocusTiles) tile.classList.remove("warp-link-focus");
  activeWarpFocusTiles.clear();
  lastFireParticleAt = 0;
}

function getTileVisual(container, idx) {
  const cell = container?.children?.[idx];
  if (!cell) return null;
  return cell.classList.contains("tile") ? cell : cell.querySelector(":scope > .tile");
}

function isPointInsideTileVisual(hitbox, clientX, clientY, tolerance = 1.5) {
  const tile = hitbox?.querySelector(":scope > .tile");
  if (!tile) return false;
  const rect = tile.getBoundingClientRect();
  return clientX >= rect.left - tolerance
    && clientX <= rect.right + tolerance
    && clientY >= rect.top - tolerance
    && clientY <= rect.bottom + tolerance;
}

function getTileHitboxFromPoint(clientX, clientY, container = null, preferredHitbox = null) {
  const isValid = hitbox => Boolean(
    hitbox && (!container || hitbox.parentElement === container)
  );

  const directHitbox = document.elementFromPoint(clientX, clientY)?.closest?.(".tile-hitbox") || null;
  if (isValid(directHitbox)) return directHitbox;

  // pointer-events:none の見た目要素もブラウザによっては elementsFromPoint に含まれる。
  // 含まれる環境では、浮いているタイルの実際の描画面から親 hitbox を復元できる。
  if (typeof document.elementsFromPoint === "function") {
    for (const element of document.elementsFromPoint(clientX, clientY)) {
      const hitbox = element.closest?.(".tile-hitbox") || null;
      if (isValid(hitbox)) return hitbox;
    }
  }

  // ホバーで .tile だけが上に移動しても、カーソルがその見た目の範囲内なら
  // 同じセルとして扱う。これが hover 解除→再選択の点滅を止めるヒステリシス。
  if (isValid(preferredHitbox)
      && isPointInsideTileVisual(preferredHitbox, clientX, clientY)) {
    return preferredHitbox;
  }

  return null;
}

function getGlassCrackLevel(remaining) {
  if (remaining <= 0) return 3;
  if (remaining === 1) return 2;
  if (remaining >= 2) return 1;
  return 0;
}

function updateGlassTileVisual(tile, remaining, showCracks = false) {
  if (!tile) return;
  const count = tile.querySelector(":scope > .glass-count");
  const cracks = tile.querySelector(":scope > .glass-cracks");
  if (count) count.textContent = String(Math.max(remaining, 0));
  if (cracks) cracks.dataset.level = String(showCracks ? getGlassCrackLevel(remaining) : 0);
  tile.dataset.val = Math.max(remaining, 0);
  tile.classList.toggle("glass-damaged", showCracks && remaining <= 2);
  tile.classList.toggle("glass-critical", showCracks && remaining <= 1);
}

function animateGlassCount(tile, mode = "normal") {
  const count = tile?.querySelector(":scope > .glass-count");
  if (!count) return;
  count.getAnimations().forEach(animation => animation.cancel());
  if (mode === "break") {
    count.animate([
      { transform: "translate(-50%, -50%) rotate(0deg) scale(1)" },
      { transform: "translate(-50%, -50%) rotate(-8deg) scale(1.1)" },
      { transform: "translate(-50%, -50%) rotate(8deg) scale(1.14)" },
      { transform: "translate(-50%, -50%) rotate(-12deg) scale(1.18)" },
      { transform: "translate(-50%, -50%) rotate(12deg) scale(1.22)" },
      { transform: "translate(-50%, -50%) rotate(-18deg) scale(1.28)" },
      { transform: "translate(-50%, -50%) rotate(18deg) scale(1.34)" }
    ], { duration: 150, easing: "cubic-bezier(.15,.95,.15,1)", fill: "forwards" });
    return;
  }
  count.animate([
    { transform: "translate(-50%, -50%) rotate(0deg) scale(1)" },
    { transform: "translate(-50%, -50%) rotate(-11deg) scale(1.16)" },
    { transform: "translate(-50%, -50%) rotate(11deg) scale(1.12)" },
    { transform: "translate(-50%, -50%) rotate(-7deg) scale(1.05)" },
    { transform: "translate(-50%, -50%) rotate(0deg) scale(1)" }
  ], { duration: 240, easing: "cubic-bezier(.2,.9,.2,1)" });
}

function spawnGlassShatter(gridX, gridY, container) {
  if (!container) return;
  const index = gridY * currentLevel.size + gridX;
  const tile = getTileVisual(container, index);
  const rect = tile?.getBoundingClientRect();
  if (!rect) return;

  const shardDefs = [
    { x: .10, y: .10, w: .34, h: .28, rot: -18 },
    { x: .48, y: .08, w: .36, h: .27, rot: 12 },
    { x: .16, y: .40, w: .29, h: .32, rot: -9 },
    { x: .52, y: .41, w: .30, h: .30, rot: 20 },
    { x: .08, y: .70, w: .36, h: .22, rot: -24 },
    { x: .48, y: .72, w: .40, h: .20, rot: 16 }
  ];
  const spreadX = [-5, 5, -3, 3, -6, 6];

  shardDefs.forEach((def, i) => {
    const shard = document.createElement("div");
    shard.className = "glass-shard glass-shard-screen";
    shard.style.left = `${rect.left + rect.width * def.x}px`;
    shard.style.top = `${rect.top + rect.height * def.y}px`;
    shard.style.width = `${Math.max(8, rect.width * def.w)}px`;
    shard.style.height = `${Math.max(7, rect.height * def.h)}px`;
    document.body.appendChild(shard);

    const dx = spreadX[i % spreadX.length];
    const dy = 78 + (i % 3) * 18;
    const rot2 = def.rot + (i % 2 ? 30 : -30);
    shard.animate([
      { transform: `translate3d(0, 0, 0) rotate(${def.rot}deg)`, opacity: .98 },
      { transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${rot2}deg)`, opacity: 0 }
    ], {
      duration: 660,
      delay: i * 14,
      easing: "cubic-bezier(.18,.72,.22,1)",
      fill: "forwards"
    });
    setTimeout(() => shard.remove(), 780 + i * 14);
  });
}

function animatePressButton(tile, type = "round") {
  const capSelector = type === "round" ? ".switch-button-cap" : (type === "triangle" ? ".toggle-switch-cap" : ".toggle-arrow-cap");
  const iconSelector = type === "round" ? null : (type === "triangle" ? ".toggle-switch-icon" : ".toggle-arrow-icon");
  const shadowSelector = type === "round" ? ".switch-button-shadow" : (type === "triangle" ? ".toggle-switch-shadow" : ".toggle-arrow-shadow");
  const cap = tile?.querySelector(`:scope > * ${capSelector}`);
  const icon = iconSelector ? tile?.querySelector(`:scope > * ${iconSelector}`) : null;
  const shadow = tile?.querySelector(`:scope > ${shadowSelector}`);
  if (cap) {
    cap.getAnimations().forEach(animation => animation.cancel());
    const baseTransform = type === "round"
      ? "translate(-50%, -50%) translateZ(5px)"
      : "translate(-50%, -50%) translateZ(5px)";
    const pressedTransform = type === "round"
      ? "translate(-50%, -50%) translateZ(1px)"
      : "translate(-50%, -50%) translateZ(1px)";
    cap.animate([
      { transform: baseTransform },
      { transform: pressedTransform },
      { transform: baseTransform }
    ], { duration: 220, easing: "cubic-bezier(.2,.85,.25,1)" });
  }
  if (icon) {
    icon.getAnimations().forEach(animation => animation.cancel());
    const baseTransform = "translate(-50%, -50%) translateZ(6px) rotate(var(--r, 0deg))";
    const pressedTransform = "translate(-50%, -50%) translateZ(2px) rotate(var(--r, 0deg))";
    icon.animate([
      { transform: baseTransform },
      { transform: pressedTransform },
      { transform: baseTransform }
    ], { duration: 220, easing: "cubic-bezier(.2,.85,.25,1)" });
  }
  if (shadow) {
    shadow.getAnimations().forEach(animation => animation.cancel());
    shadow.animate([
      { transform: "translate(-50%, -50%) scale(1)", opacity: .42 },
      { transform: "translate(-50%, -50%) scale(1.04)", opacity: .52 },
      { transform: "translate(-50%, -50%) scale(1)", opacity: .42 }
    ], { duration: 220, easing: "cubic-bezier(.2,.85,.25,1)" });
  }
}

function syncTileContents(tile, data) {
  const oldCrystal = tile.querySelector(".crystal-3d");
  const oldCrystalShadow = tile.querySelector(":scope > .crystal-shadow");
  const oldJumpPad = tile.querySelector(".jump-pad-3d");
  const oldJumpShadow = tile.querySelector(":scope > .jump-pad-shadow");
  const oldGlassCount = tile.querySelector(":scope > .glass-count");
  const oldGlassCracks = tile.querySelector(":scope > .glass-cracks");
  const oldSwitchButton = tile.querySelector(":scope > .switch-button-3d");
  const oldSwitchShadow = tile.querySelector(":scope > .switch-button-shadow");
  const oldToggleSwitch = tile.querySelector(":scope > .toggle-switch-3d");
  const oldToggleSwitchShadow = tile.querySelector(":scope > .toggle-switch-shadow");
  const oldToggleArrow = tile.querySelector(":scope > .toggle-arrow-3d");
  const oldToggleArrowShadow = tile.querySelector(":scope > .toggle-arrow-shadow");
  const oldWarpPortal = tile.querySelector(":scope > .warp-portal");

  if (data.type !== TYPE_CRYSTAL) { oldCrystal?.remove(); oldCrystalShadow?.remove(); }
  if (data.type !== TYPE_JUMP) { oldJumpPad?.remove(); oldJumpShadow?.remove(); }
  if (data.type !== TYPE_GLASS) { oldGlassCount?.remove(); oldGlassCracks?.remove(); tile.classList.remove("glass-damaged", "glass-critical"); }
  if (data.type !== TYPE_SWITCH) { oldSwitchButton?.remove(); oldSwitchShadow?.remove(); }
  if (data.type !== TYPE_TOGGLE_SWITCH) { oldToggleSwitch?.remove(); oldToggleSwitchShadow?.remove(); }
  oldToggleArrow?.remove(); oldToggleArrowShadow?.remove();
  if (data.type !== TYPE_WARP) { oldWarpPortal?.remove(); }

  if (data.type === TYPE_CRYSTAL) {
    const shadow = oldCrystalShadow || document.createElement("div");
    shadow.className = "crystal-shadow";
    if (!oldCrystalShadow) tile.appendChild(shadow);

    const crystal = oldCrystal || document.createElement("div");
    crystal.className = "crystal-3d";
    if (!oldCrystal) tile.appendChild(crystal);
    if (!(crystal.querySelector(".facet-front") && crystal.querySelector(".facet-side") && crystal.querySelector(".shine") && crystal.querySelector(".core"))) {
      crystal.innerHTML = "";
      const facetFront = document.createElement("div"); facetFront.className = "facet-front";
      const facetSide = document.createElement("div"); facetSide.className = "facet-side";
      const shine = document.createElement("div"); shine.className = "shine";
      const core = document.createElement("div"); core.className = "core";
      crystal.append(facetFront, facetSide, shine, core);
    }
  }

  if (data.type === TYPE_JUMP) {
    const shadow = oldJumpShadow || document.createElement("div");
    shadow.className = "jump-pad-shadow";
    if (!oldJumpShadow) tile.appendChild(shadow);

    const pad = oldJumpPad || document.createElement("div");
    pad.className = "jump-pad-3d";
    if (!oldJumpPad) tile.appendChild(pad);
    if (!(pad.querySelector(".jump-pad-base") && pad.querySelector(".jump-pad-mid") && pad.querySelector(".jump-pad-top") && pad.querySelector(".jump-pad-label"))) {
      pad.innerHTML = "";
      const base = document.createElement("div"); base.className = "jump-pad-base";
      const mid = document.createElement("div"); mid.className = "jump-pad-mid";
      const top = document.createElement("div"); top.className = "jump-pad-top";
      const label = document.createElement("div"); label.className = "jump-pad-label";
      label.textContent = String(data.val || 1);
      pad.append(base, mid, top, label);
    } else {
      const label = pad.querySelector(".jump-pad-label");
      if (label) label.textContent = String(data.val || 1);
    }
  }

  if (data.type === TYPE_GLASS) {
    const cracks = oldGlassCracks || document.createElement("div");
    cracks.className = "glass-cracks";
    if (!oldGlassCracks) tile.appendChild(cracks);
    const count = oldGlassCount || document.createElement("div");
    count.className = "glass-count";
    if (!oldGlassCount) tile.appendChild(count);
    updateGlassTileVisual(tile, data.val || 0, false);
  }


  if (data.type === TYPE_WARP) {
    const portal = oldWarpPortal || document.createElement('div');
    portal.className = 'warp-portal';
    if (!oldWarpPortal) {
      const glow = document.createElement('div'); glow.className = 'warp-portal-glow';
      const swirl = document.createElement('div'); swirl.className = 'warp-portal-swirl';
      const ring = document.createElement('div'); ring.className = 'warp-portal-ring';
      const hole = document.createElement('div'); hole.className = 'warp-portal-hole';
      portal.append(glow, swirl, ring, hole);
      tile.appendChild(portal);
    }
  }

  if (data.type === TYPE_SWITCH) {
    const shadow = oldSwitchShadow || document.createElement("div");
    shadow.className = "switch-button-shadow";
    if (!oldSwitchShadow) tile.appendChild(shadow);
    const button = oldSwitchButton || document.createElement("div");
    button.className = "switch-button-3d";
    if (!oldSwitchButton) {
      const base = document.createElement("div"); base.className = "switch-button-base";
      const cap = document.createElement("div"); cap.className = "switch-button-cap";
      button.append(base, cap);
      tile.appendChild(button);
    }
  }

  if (data.type === TYPE_TOGGLE_SWITCH) {
    const shadow = oldToggleSwitchShadow || document.createElement("div");
    shadow.className = "toggle-switch-shadow";
    if (!oldToggleSwitchShadow) tile.appendChild(shadow);
    const button = oldToggleSwitch || document.createElement("div");
    button.className = "toggle-switch-3d";
    if (!oldToggleSwitch) {
      const base = document.createElement("div"); base.className = "toggle-switch-base";
      const cap = document.createElement("div"); cap.className = "toggle-switch-cap";
      const icon = document.createElement("div"); icon.className = "toggle-switch-icon";
      button.append(base, cap, icon);
      tile.appendChild(button);
    }
  }
}

function syncEditorTile(idx) {
  const tile = getTileVisual(editorGrid, idx);
  const data = currentLevel?.data[idx];
  if (!tile || !data) return;
  syncTileContents(tile, data);
  applyTileStyle(tile, data);
}

function applyBrushToCell(idx, erase = false) {
  if (!isEditorMode || !currentLevel?.data[idx]) return false;
  const next = erase ? createTileData(TYPE_VOID) : createTileData(currentBrush.type, currentBrush.rot, currentBrush.val);
  if (tilesEqual(currentLevel.data[idx], next)) return false;

  if (editStroke && !editStroke.historySaved) {
    pushToUndo();
    editStroke.historySaved = true;
  }
  currentLevel.data[idx] = next;
  syncEditorTile(idx);
  return true;
}

function sampleBrushFromCell(idx) {
  const cell = currentLevel?.data[idx];
  if (!cell) return;
  if (DLC_TILES.includes(cell.type) && !isDlcUnlocked()) {
    playSe("died");
    return;
  }
  selectBrush(cell.type, cell);
}

function beginEditStroke(event, idx) {
  if (!isEditorMode) return;

  if (event.altKey || event.button === 1) {
    event.preventDefault();
    sampleBrushFromCell(idx);
    return;
  }
  if (event.button !== 0 && event.button !== 2) return;

  event.preventDefault();
  const cell = currentLevel?.data[idx];
  const sameUTurnFamily = [TYPE_U_TURN, TYPE_ONE_WAY_U_TURN].includes(cell?.type)
    && [TYPE_U_TURN, TYPE_ONE_WAY_U_TURN].includes(currentBrush.type);
  const canCycle = sameUTurnFamily || ROTATABLE_TYPES.has(cell?.type) || VALUE_LIMITS.has(cell?.type);
  if (event.button === 0 && (cell?.type === currentBrush.type || sameUTurnFamily) && canCycle) {
    editStroke = {
      pointerId: event.pointerId,
      erase: false,
      historySaved: false,
      pendingCycle: true,
      startIdx: idx,
      visited: new Set()
    };
    return;
  }

  editStroke = {
    pointerId: event.pointerId,
    erase: event.button === 2,
    historySaved: false,
    visited: new Set()
  };
  continueEditStroke(event, idx);
}

function continueEditStroke(event, idx) {
  if (!editStroke || event.pointerId !== editStroke.pointerId) return;
  if (editStroke.pendingCycle) {
    if (idx === editStroke.startIdx) return;
    editStroke.pendingCycle = false;
    applyBrushToCell(editStroke.startIdx, false);
  }
  if (editStroke.visited.has(idx)) return;
  editStroke.visited.add(idx);
  applyBrushToCell(idx, editStroke.erase);
}

function endEditStroke(event) {
  if (!editStroke) return;
  if (event?.pointerId !== undefined && event.pointerId !== editStroke.pointerId) return;
  if (editStroke.pendingCycle && event?.type !== "pointercancel") {
    editStroke.pendingCycle = false;
    cyclePlacedTile(editStroke.startIdx);
  }
  editStroke = null;
}

function removeTutorialGuide() {
  activeTutorialGuideEl?.remove();
  activeTutorialGuideEl = null;
  activeTutorialGuideTile?.classList.remove("has-tutorial-guide");
  activeTutorialGuideTile = null;
}

function createFloatingTutorialGuide(host, tile, text) {
  if (!host || !tile) return null;

  removeTutorialGuide();

  const guide = document.createElement("div");
  guide.className = "tutorial-guide-floating";

  const shadow = document.createElement("div");
  shadow.className = "tutorial-guide-shadow";

  const bubble = document.createElement("div");
  bubble.className = "tutorial-guide-bubble";
  bubble.textContent = text;

  guide.append(shadow, bubble);
  host.appendChild(guide);

  const updatePosition = () => {
    if (!guide.isConnected || !tile.isConnected) return;
    const hostRect = host.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();
    const centerX = tileRect.left - hostRect.left + tileRect.width / 2;
    const topY = tileRect.top - hostRect.top + tileRect.height * 0.18;
    guide.style.left = `${centerX}px`;
    guide.style.top = `${topY}px`;
  };

  updatePosition();
  guide._updatePosition = updatePosition;
  activeTutorialGuideEl = guide;
  activeTutorialGuideTile = tile;
  tile.classList.add("has-tutorial-guide");
  return guide;
}

function updateActiveTutorialGuidePosition() {
  activeTutorialGuideEl?._updatePosition?.();
}

function animateTileArrowRotation(tile, quarterTurns = 1) {
  if (!tile) return;
  const currentVisual = Number(tile.dataset.visualDeg ?? tile.dataset.logicalDeg ?? 0);
  const targetVisual = currentVisual + quarterTurns * 90;
  tile.dataset.visualDeg = String(targetVisual);
  tile.style.setProperty('--r-visual', `${targetVisual}deg`);
}

function getNearestEquivalentAngle(logicalDeg, visualDeg) {
  const logical = Number.isFinite(logicalDeg) ? logicalDeg : 0;
  const visual = Number.isFinite(visualDeg) ? visualDeg : logical;
  return logical + Math.round((visual - logical) / 360) * 360;
}

function animateArrowFeedback(tile, mode = "reject") {
  if (!tile) return;

  // 固定矢印の拒否演出は、連打中に新しい演出を重ねない。
  if (mode === "reject" && tile._arrowRejectTimeline?.isActive()) return;

  tile._arrowFeedbackTimeline?.kill();
  tile._arrowRejectTimeline?.kill();

  const logicalDeg = Number(tile.dataset.logicalDeg ?? 0);
  const currentVisualDeg = Number(tile.dataset.visualDeg ?? logicalDeg);
  // 0deg と 360deg のような同じ向きの中から、現在表示に最も近い角度を選ぶ。
  // これにより、揺れ開始時に一周戻る補間が発生しない。
  const baseDeg = getNearestEquivalentAngle(logicalDeg, currentVisualDeg);
  const state = { deg: baseDeg };

  tile.classList.add('arrow-feedback-active');
  tile.dataset.visualDeg = String(baseDeg);
  tile.style.setProperty('--r-visual', `${baseDeg}deg`);

  const cleanup = () => {
    tile.style.setProperty('--r-visual', `${baseDeg}deg`);
    tile.dataset.visualDeg = String(baseDeg);
    tile.classList.remove('arrow-feedback-active');
    tile._arrowFeedbackTimeline = null;
    if (mode === "reject") tile._arrowRejectTimeline = null;
  };

  const tl = gsap.timeline({
    onUpdate: () => {
      tile.style.setProperty('--r-visual', `${state.deg}deg`);
    },
    onComplete: cleanup,
    onInterrupt: cleanup
  });

  tile._arrowFeedbackTimeline = tl;
  if (mode === "reject") tile._arrowRejectTimeline = tl;

  if (mode === "ride") {
    tl.to(state, { deg: baseDeg + 9, duration: 0.1, ease: 'power1.out' })
      .to(state, { deg: baseDeg - 6, duration: 0.12, ease: 'power1.inOut' })
      .to(state, { deg: baseDeg + 3, duration: 0.09, ease: 'power1.inOut' })
      .to(state, { deg: baseDeg, duration: 0.11, ease: 'back.out(1.8)' });
  } else {
    tl.to(state, { deg: baseDeg + 16, duration: 0.1, ease: 'power1.out' })
      .to(state, { deg: baseDeg - 12, duration: 0.12, ease: 'power1.inOut' })
      .to(state, { deg: baseDeg + 7, duration: 0.1, ease: 'power1.inOut' })
      .to(state, { deg: baseDeg, duration: 0.14, ease: 'back.out(2.4)' });
  }
}

function animatePortalEntry(tile, container) {
  const portal = tile?.querySelector(':scope > .warp-portal');
  if (portal) {
    portal.getAnimations().forEach(a => a.cancel());
    portal.animate([
      { transform: 'translate(-50%, -50%) scale(1)', filter: 'brightness(1)' },
      { transform: 'translate(-50%, -50%) scale(1.15)', filter: 'brightness(1.35)' },
      { transform: 'translate(-50%, -50%) scale(.93)', filter: 'brightness(.95)' },
      { transform: 'translate(-50%, -50%) scale(1)', filter: 'brightness(1)' }
    ], { duration: 420, easing: 'cubic-bezier(.2,.9,.25,1)' });
  }
  if (!tile || !container) return;
  const burst = document.createElement('div');
  burst.className = 'warp-entry-burst';
  const idx = Number(tile.dataset.idx || 0);
  const pos = getPixelPos(idx % currentLevel.size, Math.floor(idx / currentLevel.size));
  burst.style.left = `${pos.left + 25}px`;
  burst.style.top = `${pos.top + 25}px`;
  burst.style.setProperty('--warp-color', getComputedStyle(tile).color || '#fff');
  container.appendChild(burst);
  burst.animate([
    { transform: 'translate(-50%, -50%) scale(.2)', opacity: 0 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: .95 },
    { transform: 'translate(-50%, -50%) scale(1.35)', opacity: 0 }
  ], { duration: 380, easing: 'cubic-bezier(.18,.82,.22,1)', fill: 'forwards' });
  setTimeout(() => burst.remove(), 420);
}

function handleGridTilePointerDown(container, event, idx) {
  const cellData = currentLevel?.data?.[idx];
  const tile = getTileVisual(container, idx);
  if (!cellData || !tile) return;

  const isEditing = container === editorGrid && isEditorMode;
  if (isEditing) {
    beginEditStroke(event, idx);
    return;
  }

  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();

  if (tile.classList.contains("has-tutorial-guide") || activeTutorialGuideTile === tile) {
    removeTutorialGuide();
  }

  if (!isBallMoving && cellData.type === TYPE_START) {
    spawnBall(idx, container);
  }
  else if (!isBallMoving && (
    cellData.type === TYPE_SWITCH_ARROW ||
    cellData.type === TYPE_TURN_VAR ||
    cellData.type === TYPE_ROTATING_ARROW_CW_VAR ||
    cellData.type === TYPE_ROTATING_ARROW_CCW_VAR
  )) {
    cellData.rot = (cellData.rot + 1) % 4;
    tile.dataset.rotationAnimated = '1';
    animateTileArrowRotation(tile, 1);
    applyTileStyle(tile, cellData);
    playSe('change1');
  }
  else if (!isBallMoving && (
    cellData.type === TYPE_FIXED_ARROW ||
    cellData.type === TYPE_TURN_FIX ||
    cellData.type === TYPE_ROTATING_ARROW_CW_FIX ||
    cellData.type === TYPE_ROTATING_ARROW_CCW_FIX
  )) {
    animateArrowFeedback(tile, 'reject');
  }
}

function renderGrid(container) {
  if (container === playGrid) removeTutorialGuide();
  clearTransientEffects(container);
  container.innerHTML = "";
  const size = currentLevel.size;
  container.style.setProperty('--cols', size);

  currentLevel.data.forEach((cellData, idx) => {
    const hitbox = document.createElement("div");
    hitbox.className = "tile-hitbox";
    hitbox.dataset.idx = idx;

    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.idx = idx;
    syncTileContents(tile, cellData);
    applyTileStyle(tile, cellData);
    hitbox.appendChild(tile);

    const isEditing = (container === editorGrid && isEditorMode);
    container.appendChild(hitbox);
  });
}

function applyTileStyle(el, data) {
  el.dataset.type = data.type;
  const logicalDeg = data.type === TYPE_TOGGLE_SWITCH ? 0 : normalizeRotation(data.rot) * 90;
  el.style.setProperty('--r', `${logicalDeg}deg`);
  el.dataset.logicalDeg = String(logicalDeg);
  const isRotationAnimating = el.dataset.rotationAnimated === '1';
  if (el.dataset.visualDeg === undefined || el.dataset.visualDeg === '' || !isRotationAnimating) {
    el.dataset.visualDeg = String(logicalDeg);
    el.style.setProperty('--r-visual', `${logicalDeg}deg`);
  }
  el.dataset.rotationAnimated = '0';

  if (data.type === TYPE_TOGGLE_SWITCH) {
    el.style.setProperty('--r', '0deg');
  }

  if (data.val) el.dataset.val = data.val;
  else delete el.dataset.val;

  el.classList.remove("rainbow-effect");
  el.classList.remove("flash-white");
  el.classList.remove("off");
  el.classList.remove("toggle-blue");

  if (gameState.toggleState) {
    el.classList.add("toggle-blue");
  }

  if (data.type === TYPE_BLOCK_OFF) el.classList.add("off");

  if (!isEditorMode) {
    if (data.type === TYPE_BLOCK) {
      if (gameState.switchStates[data.val]) el.classList.add("off");
      else el.classList.remove("off");
    } else if (data.type === TYPE_BLOCK_OFF) {
      if (gameState.switchStates[data.val]) el.classList.remove("off");
      else el.classList.add("off");
    }
  }

  if (data.type === TYPE_GOAL) {
    if (gameState.totalCrystals > 0 && gameState.crystalsCollected < gameState.totalCrystals) {
      el.classList.add("inactive");
    } else {
      el.classList.remove("inactive");
    }
  }
}


function startTestPlayMode() {
  if (!ensureLevelValid(currentLevel, "テストプレイ", true)) return;
  originalLevelData = JSON.parse(JSON.stringify(currentLevel.data));
  resetGameState();
  isEditorMode = false;
  isRealPlay = false;
  editorPalette.style.display = "none";
  document.querySelector(".editor-bottom-actions").style.display = "none";
  testPlayUI.classList.remove("hidden");
  renderGrid(editorGrid);
  showPenWorkspace("test");
}

function stopTestPlayMode() {
  if (ballEl) { gsap.killTweensOf(ballEl); ballEl.remove(); ballEl = null; }
  isBallMoving = false;

  if (originalLevelData) {
    currentLevel.data = JSON.parse(JSON.stringify(originalLevelData));
    originalLevelData = null;
  }

  isEditorMode = true;
  editStroke = null;

  editorPalette.style.display = "flex";
  document.querySelector(".editor-bottom-actions").style.display = "flex";
  testPlayUI.classList.add("hidden");
  hidePenWorkspace();

  renderGrid(editorGrid);
}
function startRealPlay(levelId, isOfficial = false, isFanmade = false) {
  if (levelId) {
    const levels = getSavedLevels();
    currentLevel = levels.find(l => l.id === levelId);
  }

  if (!currentLevel || !currentLevel.data) return;
  if (!ensureLevelValid(currentLevel, "プレイ", true)) return;

  originalLevelData = JSON.parse(JSON.stringify(currentLevel.data));
  isEditorMode = false;
  isRealPlay = true;
  isOfficialPlay = isOfficial;
  isFanmadePlay = isFanmade;
  isBallMoving = false;
  resetGameState();
  resetPlayGuidance();
  lastHintReminderBucket = 0;

  if (currentLevel.hints && currentLevel.hints.length > 0) {
    btnPlayHint.classList.remove("hidden");
  } else {
    btnPlayHint.classList.add("hidden");
  }

  showLoading(() => {
    const isMiniBoss = isOfficial && MINI_BOSS_STAGES.has(currentLevel._officialIndex);
    const usesDangerTitle = isMiniBoss || Boolean(currentLevel._isEx);
    document.getElementById("playScreen")?.classList.toggle("sanctum-mode", Boolean(currentLevel._isDlc));
    const officialStageTitle = currentLevel._isEx
      ? `EXTRA ${currentLevel._officialIndex - MAIN_STAGE_COUNT + 1}`
      : `STAGE ${currentLevel._officialIndex + 1}`;
    playIntroTitle.textContent = currentLevel._isDlc
      ? `聖域 ${currentLevel._dlcNum}`
      : isOfficial
        ? `${usesDangerTitle ? "☠️ " : ""}${officialStageTitle}`
        : `${usesDangerTitle ? "☠️ " : ""}${currentLevel.name}`;
    playIntroTitle.classList.toggle("danger-stage-title", usesDangerTitle);
    playIntroTitle.classList.toggle("mini-boss-title", isMiniBoss);
    playIntroSub.textContent = currentLevel._isDlc
      ? currentLevel.name
      : (currentLevel.sub || "");
    playIntroAuthor.textContent = currentLevel.author || "名無し";
    playTimerVal.textContent = "00:00:00";
    clearOverlay.classList.add("hidden");
    clearOverlay.classList.remove("active");

    let defaultBg = "warm";
    let defaultBgm = "warm";

    if (currentLevel._isEx) {
      defaultBg = "space";
      defaultBgm = "vertex";
    } else if (currentLevel._isDlc) {
      defaultBg = "dlc_world";
      defaultBgm = "sublime";
    }

    const bgTheme = currentLevel._isEx ? "space" : (currentLevel.bgTheme || defaultBg);
    const bgmTheme = currentLevel._isEx ? "vertex" : (currentLevel.bgmTheme || defaultBgm);

    setStageTheme(bgTheme);
    setGlobalGlitchTarget(0);
    if (currentLevel._isEx) triggerGlobalGlitchPulse(0.56, 650);
    playStageBgm(bgmTheme);

    if (currentLevel._isDlc) {
      setShowDlcPillars(true);
    } else {
      setShowDlcPillars(false);
    }

    const btnBack = document.getElementById("btnPlayBack");
    const btnRetry = document.getElementById("btnPlayRetry");

    btnBack.replaceWith(btnBack.cloneNode(true));
    btnRetry.replaceWith(btnRetry.cloneNode(true));

    document.getElementById("btnPlayBack").addEventListener("click", () => {
      playChin();
      stopPlayTimer();
      leaveCurrentPlayScreen();
    });

    document.getElementById("btnPlayRetry").addEventListener("click", () => {
      playChin();
      retryRealPlay();
    });

    renderGrid(playGrid);
    if (isOfficial) {
      showTutorialGuide(playGrid, currentLevel._officialIndex);
    }

    showScreen("play");
    showPenWorkspace("play");
    requestAnimationFrame(fitVisibleGrids);
    if (isMiniBoss) triggerMiniBossIntro();

    const introEl = document.getElementById("playIntro");
    const timerArea = document.querySelector(".play-timer-area");
    const isCompactUI = window.innerWidth < 768 || window.innerHeight < 600;
    const targetTop = isCompactUI ? "120px" : "80px";

    const officialStageNumber = currentLevel._officialIndex + 1;
    const shouldCountStage = isOfficial && !currentLevel._isEx && !currentLevel._isDlc;
    const titlePrefix = usesDangerTitle && shouldCountStage ? "☠️ " : "";
    if (shouldCountStage) playIntroTitle.textContent = `${titlePrefix}STAGE 1`;

    playIntroCenterLocked = true;
    playIntro.classList.remove("pointer-near");

    gsap.killTweensOf([introEl, playIntroTitle, playIntroSub, playIntroAuthor, timerArea]);
    gsap.set(introEl, { top: "50%", yPercent: -50, opacity: 1 });
    gsap.set(playIntroTitle, { y: 0, opacity: 1, scale: 1 });
    gsap.set(playIntroSub, { y: 42, opacity: 0, scale: 1.58, transformOrigin: "50% 50%" });
    gsap.set(playIntroAuthor, { y: 70, opacity: 0 });
    gsap.set(timerArea, { opacity: 0 });

    const counterObj = { value: 1 };
    const tl = gsap.timeline({ delay: 0.52, onComplete: () => { playIntroCenterLocked = false; } });
    if (shouldCountStage) {
      tl.to(counterObj, {
        value: officialStageNumber,
        duration: 0.5,
        ease: "none",
        onUpdate: () => {
          playIntroTitle.textContent = `${titlePrefix}STAGE ${Math.round(counterObj.value)}`;
        }
      });
    }
    tl.to([playIntroSub, playIntroAuthor], {
      y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: "power2.out"
    })
      .to(introEl, {
        top: targetTop, yPercent: 0, duration: 1.05, ease: "power3.inOut", delay: 0.82
      })
      .to(playIntroSub, {
        scale: 1.30, y: -8, duration: 1.05, ease: "power3.inOut"
      }, "<")
      .to(timerArea, {
        opacity: 1, duration: 0.5
      }, "-=0.42");

    levelSessionStartTime = Date.now();
    startPlayTimer();

    const replayControls = document.getElementById("replayControls");
    if (replayControls) replayControls.classList.add("hidden");
    const playControls = document.getElementById("playControls");
    if (playControls) playControls.classList.remove("hidden");
  });
}

function showPlayHints() {
  playHintList.innerHTML = "";
  const hints = currentLevel.hints || [];
  if (hints.length === 0) return;

  hints.forEach((text, idx) => {
    const row = document.createElement("div");
    row.className = "hint-row";
    const label = document.createElement("div");
    label.className = "hint-label";
    label.textContent = `ヒント ${idx + 1}`;
    const content = document.createElement("div");
    content.className = "hint-content";
    content.textContent = text;
    content.onclick = () => {
      playSe("push");
      content.classList.add("revealed");
    };
    row.appendChild(label);
    row.appendChild(content);
    playHintList.appendChild(row);
  });

  hintViewModal.showModal();
}
function stopPlayMode(preserveTheme = false) {
  stopPlayTimer();
  hidePenWorkspace();
  resetPlayGuidance();
  if (ballEl) {
    gsap.killTweensOf(ballEl);
    ballEl.remove();
    ballEl = null;
  }
  isBallMoving = false;
  isBallResetting = false;
  movementHistory = [];
  attemptStartedAt = 0;
  clearWarpConnections(playGrid);
  document.getElementById("playScreen")?.classList.remove("sanctum-mode");
  playIntro.classList.remove("pointer-near");
  playIntroCenterLocked = false;
  playIntroTitle.classList.remove("danger-stage-title");
  playIntroTitle.classList.remove("mini-boss-title");
  if (!preserveTheme) {
    setGlobalGlitchTarget(0);
    setStageTheme("warm");
    playStageBgm("warm");
  }
  stopCameraFloat();
  setShowDlcPillars(false);
}
function startCameraFloat() {
  const container = document.querySelector('.play-stage-container');
  if (!container) return;
  gsap.killTweensOf(container);
  gsap.to(container, {
    x: "random(-40, 40)",
    y: "random(-30, 30)",
    z: "random(-100, 50)",
    rotationX: "random(-5, 5)",
    rotationY: "random(-5, 5)",
    duration: "random(5, 7)",
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true
  });
}
function stopCameraFloat() {
  const container = document.querySelector('.play-stage-container');
  if (!container) return;
  gsap.killTweensOf(container);
  gsap.set(container, { clearProps: "x,y,z" });
}

function showTutorialGuide(container, stageIndex) {
  let targetIdx = -1;
  let text = "";
  if (currentLevel?._isDlc && currentLevel._dlcNum === 6) {
    targetIdx = currentLevel.data.findIndex(c => c.type === TYPE_TOGGLE_ARROW_FIX);
    text = "ON/OFF矢印は、切替スイッチを踏むたび反対向きになるよ。";
  } else if (stageIndex === 0) {
    targetIdx = currentLevel.data.findIndex(c => c.type === TYPE_START);
    text = "ここをクリック！";
  } else if (stageIndex === 1) {
    targetIdx = currentLevel.data.findIndex(c => c.type === TYPE_SWITCH_ARROW);
    text = "ここをクリックして方向を変えよう！";
  } else if (stageIndex === 2) {
    targetIdx = currentLevel.data.findIndex(c => c.type === TYPE_FIXED_ARROW);
    text = "灰色の矢印は固定。クリックしても向きを変えられないよ。";
  } else if (stageIndex === 7) {
    targetIdx = currentLevel.data.findIndex(c => c.type === TYPE_START);
    text = "開始とゴールは複数。好きな開始から、どれかのゴールを目指そう！";
  }
  if (targetIdx === -1) return;

  const tile = getTileVisual(container, targetIdx);
  if (!tile) return;

  removeTutorialGuide();

  const guide = document.createElement("div");
  guide.className = "tutorial-guide";

  const shadow = document.createElement("div");
  shadow.className = "tutorial-guide-shadow";

  const bubble = document.createElement("div");
  bubble.className = "tutorial-guide-bubble";
  bubble.textContent = text;

  guide.append(shadow, bubble);
  tile.classList.add("has-tutorial-guide");
  tile.appendChild(guide);

  activeTutorialGuideEl = guide;
  activeTutorialGuideTile = tile;
}

function updatePlayIntroProximity(event) {
  if (!playIntro || playIntro.offsetParent === null) return;
  if (playIntroCenterLocked) {
    playIntro.classList.remove("pointer-near");
    return;
  }
  const parts = [...playIntro.querySelectorAll("h1, p")]
    .map(element => element.getBoundingClientRect())
    .filter(rect => rect.width > 0 && rect.height > 0);
  if (parts.length === 0) return;

  const padding = 24;
  const left = Math.min(...parts.map(rect => rect.left)) - padding;
  const right = Math.max(...parts.map(rect => rect.right)) + padding;
  const top = Math.min(...parts.map(rect => rect.top)) - padding;
  const bottom = Math.max(...parts.map(rect => rect.bottom)) + padding;
  const isNear = event.clientX >= left && event.clientX <= right
    && event.clientY >= top && event.clientY <= bottom;
  playIntro.classList.toggle("pointer-near", isNear);
}

function clearPlayCoach() {
  if (coachHideTimer) clearTimeout(coachHideTimer);
  coachHideTimer = null;
  document.querySelector(".play-coach-bubble")?.remove();
  document.querySelectorAll(".coach-highlight").forEach(el => el.classList.remove("coach-highlight"));
}

function ensureScreenFallLayer() {
  if (screenFallLayer?.isConnected) return screenFallLayer;
  screenFallLayer = document.createElement("div");
  screenFallLayer.className = "screen-fall-layer";
  const playScreen = document.getElementById("playScreen");
  (playScreen || document.body).appendChild(screenFallLayer);
  return screenFallLayer;
}

function clearScreenFallEffects() {
  for (const node of activeScreenFallTrails) {
    gsap.killTweensOf(node);
    node.remove();
  }
  activeScreenFallTrails.clear();
  if (screenFallLayer && screenFallLayer.childElementCount === 0) {
    screenFallLayer.remove();
    screenFallLayer = null;
  }
}

function spawnScreenFallTrailLine(start, end, hue) {
  if (!audioSettings.showTrail) return;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.8) return;

  const layer = ensureScreenFallLayer();
  const line = document.createElement("div");
  line.className = "screen-fall-trail";
  layer.appendChild(line);
  activeScreenFallTrails.add(line);

  gsap.set(line, {
    left: start.x,
    top: start.y,
    width: length,
    rotation: Math.atan2(dy, dx) * 180 / Math.PI,
    color: `hsl(${hue}, 92%, 60%)`,
    opacity: 0.92
  });
  gsap.to(line, {
    opacity: 0,
    scaleX: 0.82,
    transformOrigin: "100% 50%",
    duration: 0.62,
    ease: "power1.out",
    onComplete: () => {
      activeScreenFallTrails.delete(line);
      line.remove();
      if (screenFallLayer && screenFallLayer.childElementCount === 0) {
        screenFallLayer.remove();
        screenFallLayer = null;
      }
    }
  });
}

function beginScreenSpaceFall(container, screenVelocity, speedScale = 1.5) {
  if (!ballEl) return;

  const rect = ballEl.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const layer = ensureScreenFallLayer();
  const layerRect = layer.getBoundingClientRect();

  const velocityX = Number.isFinite(screenVelocity?.x) ? screenVelocity.x : 0;
  const velocityY = Number.isFinite(screenVelocity?.y) ? screenVelocity.y : 0;

  layer.appendChild(ballEl);
  ballEl.classList.add("screen-falling-ball");
  gsap.killTweensOf(ballEl);

  const startLeft = rect.left - layerRect.left;
  const startTop = rect.top - layerRect.top;
  gsap.set(ballEl, {
    position: "absolute",
    left: startLeft,
    top: startTop,
    width,
    height,
    x: 0,
    y: 0,
    z: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 1,
    opacity: 1,
    transformOrigin: "50% 50%"
  });

  // 盤面上の進行速度は落下開始後も引き継ぐが、
  // 空気抵抗のように滑らかに減衰させる。
  // 縦方向には、より強い重力加速度を追加して早めに落下させる。
  const duration = Math.max(0.54, 0.37 * speedScale);
  const fallDistance = Math.max(360, window.innerHeight * 0.54);
  const planarDrag = 3.35;
  const gravity = Math.max(1450, (2 * Math.max(260, fallDistance - velocityY * duration)) / (duration * duration));
  const state = { progress: 0 };
  let lastPoint = { x: startLeft + width / 2, y: startTop + height / 2 };

  gsap.to(state, {
    progress: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      if (!ballEl) return;
      const elapsed = state.progress * duration;
      const dampedTime = (1 - Math.exp(-planarDrag * elapsed)) / planarDrag;
      const x = startLeft + velocityX * dampedTime;
      const y = startTop + velocityY * dampedTime + 0.5 * gravity * elapsed * elapsed;
      const t = state.progress;
      const opacity = 1 - Math.max(0, (t - 0.70) / 0.30);

      gsap.set(ballEl, {
        left: x,
        top: y,
        rotation: 520 * t,
        scale: 1 - 0.28 * t,
        opacity
      });

      const point = { x: x + width / 2, y: y + height / 2 };
      if (Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) >= 7) {
        trailHue = (trailHue + 2) % 360;
        spawnScreenFallTrailLine(lastPoint, point, trailHue);
        lastPoint = point;
      }
    },
    onComplete: () => {
      if (ballEl) {
        const x = _numPx(gsap.getProperty(ballEl, "left"));
        const y = _numPx(gsap.getProperty(ballEl, "top"));
        const endPoint = { x: x + width / 2, y: y + height / 2 };
        if (Math.hypot(endPoint.x - lastPoint.x, endPoint.y - lastPoint.y) > 0.5) {
          trailHue = (trailHue + 2) % 360;
          spawnScreenFallTrailLine(lastPoint, endPoint, trailHue);
        }
      }
      resetBallState(container);
    }
  });
}

function cancelBallReset(container = playGrid) {
  ballResetGeneration++;
  isBallResetting = false;
  clearScreenFallEffects();
  if (!container) return;
  gsap.killTweensOf(container);
  gsap.set(container, { opacity: 1 });
}

function showControlCoach(target, text, { persistent = false, kind = "" } = {}) {
  if (!target) return;
  const existingBubble = document.querySelector('.play-coach-bubble');
  const existingKind = existingBubble?.dataset.kind || "";
  if (existingKind === 'hint' && kind !== 'hint') return;
  if (!persistent && document.querySelector('.play-coach-bubble[data-kind="retry"]')) return;
  clearPlayCoach();
  const controls = document.getElementById("playControls");
  if (!controls) return;

  const bubble = document.createElement("div");
  bubble.className = "play-coach-bubble";
  if (kind) bubble.dataset.kind = kind;
  bubble.textContent = text;
  bubble.style.setProperty("--coach-left", `${target.offsetLeft + target.offsetWidth / 2}px`);
  controls.appendChild(bubble);
  target.classList.add("coach-highlight");
  if (!persistent) {
    coachHideTimer = setTimeout(clearPlayCoach, 4800);
  }
}

function resetPlayGuidance() {
  cancelBallReset();
  if (activeJumpTween) {
    activeJumpTween.kill();
    activeJumpTween = null;
  }
  movementHistory = [];
  attemptStartedAt = 0;
  lastStuckNoticeAt = 0;
  clearPlayCoach();
  document.querySelector(".mini-boss-lightning")?.remove();
}

function trackMovementState(direction) {
  if (isReplayMode || !isBallMoving) return;
  const now = Date.now();
  const key = `${ballPos.x}:${ballPos.y}:${direction}`;
  movementHistory.push({ key, at: now });
  if (movementHistory.length > 48) movementHistory.shift();

  const repeats = movementHistory.filter(entry => entry.key === key).length;
  if (attemptStartedAt && now - attemptStartedAt >= 3500 && repeats >= 3
    && now - lastStuckNoticeAt >= 30000
    && !document.querySelector('.play-coach-bubble[data-kind="retry"]')) {
    lastStuckNoticeAt = now;
    showControlCoach(
      document.getElementById("btnPlayRetry"),
      "進まなくなった？ リトライを押そう。",
      { persistent: true, kind: "retry" }
    );
  }
}

function clearWarpConnections(container) {
  if (!container) return;
  for (const line of activeWarpLines) {
    if (line.parentElement === container || !line.isConnected) {
      line.remove();
      activeWarpLines.delete(line);
    }
  }
  for (const tile of activeWarpFocusTiles) tile.classList.remove("warp-link-focus");
  activeWarpFocusTiles.clear();
}

function showWarpConnections(sourceIdx, container) {
  if (!container || isEditorMode) return;
  clearWarpConnections(container);
  const source = currentLevel.data[sourceIdx];
  if (!source || source.type !== TYPE_WARP) return;

  const targetIdx = getWarpDestinationIndex(sourceIdx);
  if (targetIdx === -1) return;

  const sourceX = sourceIdx % currentLevel.size;
  const sourceY = Math.floor(sourceIdx / currentLevel.size);
  const targetX = targetIdx % currentLevel.size;
  const targetY = Math.floor(targetIdx / currentLevel.size);
  const start = getPixelPos(sourceX, sourceY);
  const end = getPixelPos(targetX, targetY);
  const dx = end.left - start.left;
  const dy = end.top - start.top;

  const sourceTile = getTileVisual(container, sourceIdx);
  sourceTile?.classList.add("warp-link-focus");
  if (sourceTile) activeWarpFocusTiles.add(sourceTile);

  const line = document.createElement("div");
  line.className = "warp-connection-line";
  line.style.left = `${start.left + 25}px`;
  line.style.top = `${start.top + 25}px`;
  const lineLength = Math.hypot(dx, dy);
  line.style.width = `${lineLength}px`;
  line.style.setProperty("--warp-angle", `${Math.atan2(dy, dx) * 180 / Math.PI}deg`);
  line.style.setProperty("--warp-color", WARP_COLORS[source.val] || WARP_COLORS[0]);
  const segmentCount = Math.max(8, Math.min(34, Math.ceil(lineLength / 9)));
  const segmentWidth = lineLength / segmentCount;
  for (let i = 0; i < segmentCount; i++) {
    const segment = document.createElement("span");
    segment.className = "warp-connection-segment";
    segment.style.left = `${i * segmentWidth}px`;
    segment.style.width = `${segmentWidth + 1.4}px`;
    segment.style.animationDelay = `${i * 0.045}s`;
    line.appendChild(segment);
  }
  container.appendChild(line);
  activeWarpLines.add(line);

  const targetTile = getTileVisual(container, targetIdx);
  targetTile?.classList.add("warp-link-focus");
  if (targetTile) activeWarpFocusTiles.add(targetTile);
}

function clearJumpTargetPreview(container) {
  if (!container) return;
  for (const node of activeJumpPreviewNodes) {
    if (node.parentElement === container || !node.isConnected) {
      node.remove();
      activeJumpPreviewNodes.delete(node);
    }
  }
}

function clearHoverTileEffects(container) {
  clearWarpConnections(container);
  clearJumpTargetPreview(container);
}

function getWarpDestinationIndex(sourceIdx) {
  const source = currentLevel?.data?.[sourceIdx];
  if (!source || source.type !== TYPE_WARP) return -1;
  const color = source.val;
  const localCluster = getWarpCluster(sourceIdx, currentLevel.data, currentLevel.size);
  const allSameColorWarps = [];
  currentLevel.data.forEach((c, i) => { if (c.type === TYPE_WARP && c.val === color) allSameColorWarps.push(i); });
  const currentArrIdx = allSameColorWarps.indexOf(sourceIdx);
  const count = allSameColorWarps.length;
  if (currentArrIdx === -1 || count <= 1) return -1;

  for (let i = 1; i < count; i++) {
    const candidateGridIdx = allSameColorWarps[(currentArrIdx + i) % count];
    if (!localCluster.has(candidateGridIdx)) return candidateGridIdx;
  }
  if (count === 2) return allSameColorWarps[(currentArrIdx + 1) % 2];
  return -1;
}

function showJumpTargetPreview(sourceIdx, container) {
  if (!container || isEditorMode) return;
  clearJumpTargetPreview(container);
  const source = currentLevel?.data?.[sourceIdx];
  if (!source || source.type !== TYPE_JUMP) return;

  const dx = [0, 1, 0, -1]; const dy = [-1, 0, 1, 0];
  const distance = (source.val || 1) + 1;
  const sx = sourceIdx % currentLevel.size;
  const sy = Math.floor(sourceIdx / currentLevel.size);
  const uniqueTargets = new Set();

  for (let dir = 0; dir < 4; dir++) {
    const tx = sx + dx[dir] * distance;
    const ty = sy + dy[dir] * distance;
    if (tx < 0 || tx >= currentLevel.size || ty < 0 || ty >= currentLevel.size) continue;
    const key = `${tx},${ty}`;
    if (uniqueTargets.has(key)) continue;
    uniqueTargets.add(key);

    const pos = getPixelPos(tx, ty);
    const ring = document.createElement("div");
    ring.className = "jump-target-ring";
    ring.style.left = `${pos.left + 25}px`;
    ring.style.top = `${pos.top + 25}px`;
    ring.style.animationDelay = `${dir * 0.08}s`;
    container.appendChild(ring);
    activeJumpPreviewNodes.add(ring);
  }
}

function updateHoverTileEffects(container, hitbox) {
  if (!container || isEditorMode) return;
  clearHoverTileEffects(container);
  if (!hitbox) return;
  const idx = Number(hitbox.dataset.idx);
  const cell = currentLevel?.data?.[idx];
  if (!cell) return;
  if (cell.type === TYPE_WARP) {
    showWarpConnections(idx, container);
  } else if (cell.type === TYPE_JUMP) {
    showJumpTargetPreview(idx, container);
  }
}

function animateJumpPadBounce(idx, container) {
  const tile = getTileVisual(container, idx);
  const pad = tile?.querySelector(":scope > .jump-pad-3d");
  const shadow = tile?.querySelector(":scope > .jump-pad-shadow");
  const base = pad?.querySelector(":scope > .jump-pad-base");
  const mid = pad?.querySelector(":scope > .jump-pad-mid");
  const top = pad?.querySelector(":scope > .jump-pad-top");
  const label = pad?.querySelector(":scope > .jump-pad-label");
  const jumpData = currentLevel?.data?.[idx];
  if (!pad || !top || !mid || !label || !jumpData) return;

  const jumpDistance = Math.max(2, (jumpData.val || 1) + 1);
  const duration = 220 + jumpDistance * 28;
  const topLift = 6 + jumpDistance * 4.2;
  const labelLift = topLift + 2.8;
  const midLiftZ = -4 + jumpDistance * 1.95;
  const midPeakScale = 0.965 + jumpDistance * 0.022;
  const topPeakScale = 1.045 + jumpDistance * 0.014;
  const labelPeakScale = 1.06 + jumpDistance * 0.016;
  const peakShadowScale = Math.max(0.6, 1 - jumpDistance * 0.1);
  const peakShadowOpacity = Math.max(0.28, 0.64 - jumpDistance * 0.07);

  for (const el of [base, mid, top, label, shadow]) el?.getAnimations().forEach(animation => animation.cancel());

  mid.animate([
    { transform: "translateZ(-4px) scale(.94)" },
    { transform: `translateZ(${midLiftZ}px) scale(${midPeakScale})` },
    { transform: "translateZ(-4px) scale(.94)" }
  ], { duration, easing: "cubic-bezier(.2,.88,.26,1)" });

  top.animate([
    { transform: "translateZ(0) scale(1)" },
    { transform: `translateZ(${topLift}px) scale(${topPeakScale})` },
    { transform: "translateZ(0) scale(1)" }
  ], { duration, easing: "cubic-bezier(.2,.88,.26,1)" });

  label.animate([
    { transform: "translateZ(1px) scale(1)" },
    { transform: `translateZ(${labelLift}px) scale(${labelPeakScale})` },
    { transform: "translateZ(1px) scale(1)" }
  ], { duration, easing: "cubic-bezier(.2,.88,.26,1)" });

  if (shadow) {
    shadow.animate([
      { transform: "translate(-50%, -50%) scale(1)", opacity: .68 },
      { transform: `translate(-50%, -50%) scale(${peakShadowScale})`, opacity: peakShadowOpacity },
      { transform: "translate(-50%, -50%) scale(1)", opacity: .68 }
    ], { duration, easing: "cubic-bezier(.2,.88,.26,1)" });
  }
}

function triggerMiniBossIntro() {
  const playScreen = document.getElementById("playScreen");
  if (!playScreen) return;
  playScreen.querySelector(".mini-boss-lightning")?.remove();

  const layer = document.createElement("div");
  layer.className = "mini-boss-lightning";
  for (let i = 0; i < 8; i++) {
    const bolt = document.createElement("i");
    bolt.style.setProperty("--bolt-x", `${8 + Math.random() * 84}%`);
    bolt.style.setProperty("--bolt-delay", `${Math.random() * 0.8}s`);
    bolt.style.setProperty("--bolt-tilt", `${-20 + Math.random() * 40}deg`);
    layer.appendChild(bolt);
  }
  playScreen.appendChild(layer);
  setTimeout(() => layer.remove(), 3000);
}

function applyKeptTileStates(freshData, oldData) {
  if (!audioSettings.keepTileState) return;
  if (!oldData || !freshData) return;

  const variableTypes = [
    TYPE_SWITCH_ARROW,
    TYPE_TURN_VAR,
    TYPE_U_TURN,
    TYPE_ONE_WAY_U_TURN,
    TYPE_ROTATING_ARROW_CW_VAR,
    TYPE_ROTATING_ARROW_CCW_VAR
  ];

  freshData.forEach((newCell, i) => {
    const oldCell = oldData[i];
    if (variableTypes.includes(newCell.type) && variableTypes.includes(oldCell.type)) {
      newCell.rot = oldCell.rot;
      newCell.type = oldCell.type; // Uターン(8)⇔一方通行(19)の切り替えも維持
    }
  });
}
function retryRealPlay() {
  cancelBallReset(playGrid);
  if (activeJumpTween) {
    activeJumpTween.kill();
    activeJumpTween = null;
  }
  if (ballEl) {
    gsap.killTweensOf(ballEl);
    ballEl.remove();
    ballEl = null;
  }
  isBallMoving = false;
  movementHistory = [];
  attemptStartedAt = 0;
  clearPlayCoach();
  const isClearActive = clearOverlay.classList.contains("active");
  clearOverlay.classList.remove("active");
  const delay = isClearActive ? 500 : 50;

  setTimeout(() => {
    clearOverlay.classList.add("hidden");
    if (originalLevelData) {
      const freshData = JSON.parse(JSON.stringify(originalLevelData));

      if (currentLevel && currentLevel.data) {
        applyKeptTileStates(freshData, currentLevel.data);
      }

      currentLevel.data = freshData;
    }
    resetGameState();
    renderGrid(playGrid);
    if (isOfficialPlay) {
      showTutorialGuide(playGrid, currentLevel._officialIndex);
    }
    startPlayTimer();
  }, delay);
}


function startPlayTimer() {
  if (playTimerId) clearInterval(playTimerId);
  playTimerId = setInterval(() => {
    const diff = Math.floor((Date.now() - levelSessionStartTime) / 1000);
    const safeDiff = Math.max(0, diff);

    const h = Math.floor(safeDiff / 3600).toString().padStart(2, '0');
    const m = Math.floor((safeDiff % 3600) / 60).toString().padStart(2, '0');
    const s = (safeDiff % 60).toString().padStart(2, '0');
    playTimerVal.textContent = `${h}:${m}:${s}`;

    const reminderBucket = Math.floor(safeDiff / 600);
    if (reminderBucket > 0 && reminderBucket > lastHintReminderBucket && currentLevel?.hints?.length) {
      lastHintReminderBucket = reminderBucket;
      showControlCoach(btnPlayHint, "このステージに困ってる？ ヒントを見てみよう。", { persistent: true, kind: "hint" });
    }
  }, 1000);
}
function stopPlayTimer() { if (playTimerId) clearInterval(playTimerId); playTimerId = null; }

function resetGameState() {
  gameState = {
    crystalsCollected: 0,
    totalCrystals: 0,
    switchStates: [false, false, false, false, false, false, false, false],
    toggleState: false,
    isFire: false
  };
  if (currentLevel && currentLevel.data) {
    currentLevel.data.forEach(c => {
      if (c.type === TYPE_CRYSTAL) gameState.totalCrystals++;
    });
  }
}


function spawnParticles(x, y, container) {
  const centerPos = getPixelPos(x, y);
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("div"); p.className = "particle"; container.appendChild(p);
    gsap.set(p, { left: centerPos.left + 12, top: centerPos.top + 12, z: 5 });
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 40;
    gsap.to(p, {
      x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, z: Math.random() * 80,
      opacity: 0, duration: 0.8, ease: "power2.out", onComplete: () => p.remove()
    });
  }
}

function spawnBall(idx, container) {
  if (isBallMoving || isBallResetting) return;
  if (activeJumpTween) {
    activeJumpTween.kill();
    activeJumpTween = null;
  }

  if (!isReplayMode && !isEditorMode) {
    lastAttemptData = JSON.parse(JSON.stringify(currentLevel.data));
    lastAttemptStartIdx = idx;
  }

  trailHue = 0;
  movementHistory = [];
  attemptStartedAt = Date.now();
  if (!document.querySelector('.play-coach-bubble[data-kind="retry"]')) {
    clearPlayCoach();
  }
  isBallMoving = true;
  const spawnGeneration = ballResetGeneration;
  const size = currentLevel.size; const x = idx % size; const y = Math.floor(idx / size);
  if (ballEl) ballEl.remove(); ballEl = document.createElement("div"); ballEl.className = "ball"; container.appendChild(ballEl);
  const pos = getPixelPos(x, y); ballPos = { x, y };
  gsap.set(ballEl, { left: pos.left, top: pos.top, z: 400, rotationX: -45, rotationZ: -45, opacity: 0, scale: 0.5 });
  const startCell = currentLevel.data[idx];

  if (gameState.isFire) {
    ballEl.classList.add("fire-mode");
  }

  gsap.to(ballEl, {
    z: 15, opacity: 1, scale: 1, duration: 1.0, ease: "bounce.out",
    onComplete: () => {
      setTimeout(() => {
        if (spawnGeneration !== ballResetGeneration || !isBallMoving || !ballEl) return;
        moveBall(startCell.rot, container);
      }, 100);
    }
  });
}

function updateBallTrail(container, force = false) {
  if (!ballEl) return;
  const curX = _numPx(gsap.getProperty(ballEl, "left"));
  const curY = _numPx(gsap.getProperty(ballEl, "top"));
  const curZ = _numPx(gsap.getProperty(ballEl, "z") || 0);
  const dist = Math.hypot(curX - lastTrailPos.x, curY - lastTrailPos.y, curZ - lastTrailPos.z);
  const threshold = activeJumpTween ? 2.5 : TRAIL_SAMPLE_DISTANCE;
  if (dist >= threshold || (force && dist > 0.01)) {
    trailHue = (trailHue + 2) % 360;
    spawnTrailLine(lastTrailPos, { x: curX, y: curY, z: curZ }, trailHue, container);
    lastTrailPos = { x: curX, y: curY, z: curZ };
  }
  if (gameState.isFire) spawnFireParticles(container);
}

function animateJump(targetPos, distance, container, onComplete) {
  if (!ballEl) return;
  if (activeJumpTween) activeJumpTween.kill();

  const startLeft = _numPx(gsap.getProperty(ballEl, "left"));
  const startTop = _numPx(gsap.getProperty(ballEl, "top"));
  const groundZ = 15;
  const peakHeight = Math.max(105, 55 + distance * 28);
  const state = { progress: 0 };
  activeJumpTween = gsap.to(state, {
    progress: 1,
    duration: Math.max(0.65, 0.36 + distance * 0.15),
    ease: "none",
    onUpdate: () => {
      if (!ballEl) return;
      const t = state.progress;
      gsap.set(ballEl, {
        left: startLeft + (targetPos.left - startLeft) * t,
        top: startTop + (targetPos.top - startTop) * t,
        z: groundZ + peakHeight * 4 * t * (1 - t)
      });
      updateBallTrail(container);
    },
    onComplete: () => {
      updateBallTrail(container, true);
      activeJumpTween = null;
      onComplete?.();
    }
  });
}

function isCurrentHoleCell(cell) {
  if (!cell) return true;
  if (cell.type === TYPE_VOID) return true;
  if (cell.type === TYPE_FIRE_GATE && !gameState.isFire) return true;
  if (cell.type === TYPE_BLOCK && gameState.switchStates[cell.val]) return true;
  if (cell.type === TYPE_BLOCK_OFF && !gameState.switchStates[cell.val]) return true;
  return false;
}

function animateJumpIntoVoid(targetPos, distance, direction, container, targetGridPos = null) {
  if (!ballEl) return;
  if (activeJumpTween) activeJumpTween.kill();

  const dx = [0, 1, 0, -1];
  const dy = [-1, 0, 1, 0];
  const startLeft = _numPx(gsap.getProperty(ballEl, "left"));
  const startTop = _numPx(gsap.getProperty(ballEl, "top"));
  const groundZ = 15;
  const peakHeight = Math.max(105, 55 + distance * 28);
  const endLeft = targetPos.left + dx[direction] * 8;
  const endTop = targetPos.top + dy[direction] * 8;
  const handoffProgress = 0.82;
  const fullDuration = Math.max(0.72, 0.4 + distance * 0.16);
  const state = { progress: 0 };

  let previousTime = performance.now();
  let previousCenter = null;
  let screenVelocity = { x: 0, y: 0 };

  // 先に死亡扱いへ移さず、通常のジャンプ軌道を下降途中まで再生する。
  // 空中で奈落へ抜け始める瞬間にだけ、画面座標の落下処理へ引き渡す。
  activeJumpTween = gsap.to(state, {
    progress: handoffProgress,
    duration: fullDuration * handoffProgress,
    ease: "none",
    onUpdate: () => {
      if (!ballEl) return;
      const t = state.progress;
      gsap.set(ballEl, {
        left: startLeft + (endLeft - startLeft) * t,
        top: startTop + (endTop - startTop) * t,
        z: groundZ + peakHeight * 4 * t * (1 - t),
        opacity: 1,
        rotationX: -45,
        rotationY: 0
      });
      updateBallTrail(container);

      const rect = ballEl.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      const now = performance.now();
      if (previousCenter) {
        const dt = Math.max(1 / 240, (now - previousTime) / 1000);
        const instantVelocity = {
          x: (center.x - previousCenter.x) / dt,
          y: (center.y - previousCenter.y) / dt
        };
        // フレーム間の揺れを抑えながら、ジャンプ下降中の速度を維持する。
        screenVelocity.x = screenVelocity.x * 0.42 + instantVelocity.x * 0.58;
        screenVelocity.y = screenVelocity.y * 0.42 + instantVelocity.y * 0.58;
      }
      previousCenter = center;
      previousTime = now;
    },
    onComplete: () => {
      if (!ballEl) {
        activeJumpTween = null;
        return;
      }
      updateBallTrail(container, true);
      activeJumpTween = null;
      if (targetGridPos) ballPos = { x: targetGridPos.x, y: targetGridPos.y };
      playSe('died');
      beginScreenSpaceFall(container, screenVelocity, 1.5);
    }
  });
}

function moveBall(direction, container) {
  if (isEditorMode || !ballEl) return;
  trackMovementState(direction);

  if (gameState.isFire) {
    ballEl.classList.add("fire-mode");
    spawnFireParticles(container);
  } else {
    ballEl.classList.remove("fire-mode");
  }

  lastTrailPos = {
    x: gsap.getProperty(ballEl, "left"),
    y: gsap.getProperty(ballEl, "top"),
    z: gsap.getProperty(ballEl, "z") || 0
  };

  const dx = [0, 1, 0, -1]; const dy = [-1, 0, 1, 0];
  const size = currentLevel.size;
  const currentIdx = ballPos.y * size + ballPos.x;
  const currentCell = currentLevel.data[currentIdx];
  let distance = 1;
  let isJump = false;

  if (currentCell.type === TYPE_JUMP) {
    distance = (currentCell.val || 1) + 1;
    isJump = true;
    animateJumpPadBounce(currentIdx, container);
  }

  const nextX = ballPos.x + dx[direction] * distance;
  const nextY = ballPos.y + dy[direction] * distance;

  if (nextX < 0 || nextX >= size || nextY < 0 || nextY >= size) {
    if (isJump) {
      animateJumpIntoVoid(getPixelPos(nextX, nextY), distance, direction, container, { x: nextX, y: nextY });
    } else {
      fallBall(direction, 1.5, container, {
        targetPos: getPixelPos(nextX, nextY),
        targetGridPos: { x: nextX, y: nextY },
        approachRatio: 0.72
      });
    }
    return;
  }

  const nextIdx = nextY * size + nextX;
  const nextCell = currentLevel.data[nextIdx];
  const targetPos = getPixelPos(nextX, nextY);

  // 奈落へ進む場合は、通常移動で中心まで到達してから追加で落とすのではなく、
  // 現在マスからタイル端を少し越えるところまで進み、その位置から画面基準で落下させる。
  if (!isJump && isCurrentHoleCell(nextCell)) {
    fallBall(direction, 1.5, container, {
      targetPos,
      targetGridPos: { x: nextX, y: nextY },
      approachRatio: 0.72
    });
    return;
  }

  if (nextCell.type === TYPE_WOODEN_BOX) {
    playSe('break');

    nextCell.val = (nextCell.val || 1) - 1;
    const tileEl = getTileVisual(container, nextIdx);
    if (tileEl) tileEl.dataset.val = nextCell.val;

    if (nextCell.val <= 0) {
      nextCell.type = TYPE_NORMAL;
      if (tileEl) {
        tileEl.dataset.type = TYPE_NORMAL;
        tileEl.innerHTML = "";
        tileEl.className = "tile";
        spawnParticles(nextX, nextY, container);
      }
    } else {
      spawnParticles(nextX, nextY, container);
    }

    const bounceX = gsap.getProperty(ballEl, "left") + (dx[direction] * 15);
    const bounceY = gsap.getProperty(ballEl, "top") + (dy[direction] * 15);

    gsap.to(ballEl, {
      left: bounceX, top: bounceY, duration: 0.1, yoyo: true, repeat: 1,
      onComplete: () => {
        const nextDir = (direction + 2) % 4;
        moveBall(nextDir, container);
      }
    });
    return;
  }

  if (isJump) {
    if (isCurrentHoleCell(nextCell)) {
      animateJumpIntoVoid(targetPos, distance, direction, container, { x: nextX, y: nextY });
    } else {
      animateJump(targetPos, distance, container, () => {
        onMoveComplete(nextX, nextY, nextIdx, nextCell, direction, container);
      });
    }
  } else {
    gsap.to(ballEl, {
      left: targetPos.left, top: targetPos.top,
      duration: 0.15, ease: "none",
      onUpdate: () => updateBallTrail(container),
      onComplete: () => onMoveComplete(nextX, nextY, nextIdx, nextCell, direction, container)
    });
  }
}
function spawnTrailLine(start, end, hue, container) {
  if (!audioSettings.showTrail) return;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const distXY = Math.hypot(dx, dy);
  const len = Math.hypot(dx, dy, dz);
  if (len < 0.5) return;

  const angleZ = Math.atan2(dy, dx) * 180 / Math.PI;
  const angleY = -Math.atan2(dz, Math.max(0.0001, distXY)) * 180 / Math.PI;

  while (activeTrailNodes.size >= MAX_ACTIVE_TRAILS) {
    removeOldestEffectNode(activeTrailNodes);
  }

  const trail = document.createElement("div");
  trail.className = "ball-trail-3d";

  const faceA = document.createElement("div");
  faceA.className = "ball-trail-face ball-trail-face-a";

  const faceB = document.createElement("div");
  faceB.className = "ball-trail-face ball-trail-face-b";

  trail.append(faceA, faceB);
  container.appendChild(trail);
  activeTrailNodes.add(trail);

  const color = `hsl(${hue} 92% 56%)`;
  const offsetX = 15;
  const offsetY = 15;

  gsap.set(trail, {
    left: start.x + offsetX,
    top: start.y + offsetY,
    z: start.z,
    width: len + 2,
    rotationZ: angleZ,
    rotationY: angleY,
    color
  });

  gsap.set([faceA, faceB], {
    backgroundColor: color,
    opacity: 1,
    scaleX: 1,
    scaleY: 1
  });

  // 透明化は3D親ではなく、子の各面だけに掛ける。
  // 親は常に preserve-3d のままなので、2枚の直交面が平面へ潰れない。
  gsap.to([faceA, faceB], {
    opacity: 0,
    scaleY: 0.18,
    duration: 1.15,
    ease: "power2.out"
  });

  gsap.to(trail, {
    scaleX: 0.88,
    duration: 1.15,
    ease: "power2.out",
    onComplete: () => {
      activeTrailNodes.delete(trail);
      trail.remove();
    }
  });
}
function onMoveComplete(nextX, nextY, nextIdx, nextCell, direction, container) {
  ballPos = { x: nextX, y: nextY };
  if (isEditorMode || !ballEl) return;

  if (nextCell.type === TYPE_VOID) { fallBall(direction, 1.5, container, { approachRatio: 0 }); return; }

  if (nextCell.type === TYPE_FIRE_GATE) {
    if (!gameState.isFire) {
      fallBall(direction, 1.5, container, { approachRatio: 0 });
      return;
    }
  }

  if (nextCell.type === TYPE_IGNITE) {
    if (!gameState.isFire) {
      playSe('ignite');
      gameState.isFire = true;
      ballEl.classList.add("fire-mode");
      const t = getTileVisual(container, nextIdx);
      if (t) { t.classList.add("rainbow-effect"); setTimeout(() => t.classList.remove("rainbow-effect"), 500); }
    }
  } else if (nextCell.type === TYPE_EXTINGUISH) {
    if (gameState.isFire) {
      playSe('digestion');
      gameState.isFire = false;
      ballEl.classList.remove("fire-mode");
      spawnParticles(nextX, nextY, container);
    }
  }

  let isHole = false;
  if (nextCell.type === TYPE_BLOCK) {
    if (gameState.switchStates[nextCell.val]) isHole = true;
  } else if (nextCell.type === TYPE_BLOCK_OFF) {
    if (!gameState.switchStates[nextCell.val]) isHole = true;
  }
  if (isHole) { fallBall(direction, 1.5, container, { approachRatio: 0 }); return; }

  if (nextCell.type === TYPE_CRYSTAL) {
    gameState.crystalsCollected++;
    nextCell.type = TYPE_NORMAL;
    const tileEl = getTileVisual(container, nextIdx);
    if (tileEl) {
      tileEl.dataset.type = TYPE_NORMAL;
      tileEl.querySelector('.crystal-3d')?.remove();
      tileEl.querySelector(':scope > .crystal-shadow')?.remove();
    }
    spawnParticles(nextX, nextY, container);
    playSe('change1');
    if (gameState.crystalsCollected >= gameState.totalCrystals) {
      currentLevel.data.forEach((cell, index) => {
        if (cell.type === TYPE_GOAL) getTileVisual(container, index)?.classList.remove("inactive");
      });
    }
  }

  if (nextCell.type === TYPE_GLASS) {
    nextCell.val--;
    const tileEl = getTileVisual(container, nextIdx);
    if (tileEl) {
      updateGlassTileVisual(tileEl, nextCell.val, true);
      animateGlassCount(tileEl, nextCell.val <= 0 ? "break" : "normal");
    }
    if (nextCell.val <= 0) {
      const glassGeneration = ballResetGeneration;
      tileEl?.classList.add("glass-shattering");
      setTimeout(() => {
        if (glassGeneration !== ballResetGeneration) return;
        playSe('break');
        nextCell.type = TYPE_VOID;
        if (tileEl) {
          spawnGlassShatter(nextX, nextY, container);
          tileEl.dataset.type = TYPE_VOID;
          tileEl.innerHTML = "";
          tileEl.className = "tile";
        }
      }, 150);
    }
  }

  if (nextCell.type === TYPE_SWITCH) {
    playSe('push');
    const color = nextCell.val;
    gameState.switchStates[color] = !gameState.switchStates[color];
    const tileEl = getTileVisual(container, nextIdx);
    if (tileEl) {
      tileEl.classList.add("active");
      animatePressButton(tileEl, "round");
      setTimeout(() => tileEl?.classList.remove("active"), 200);
    }
    updateBlocksVisual(container);
  }

  if (nextCell.type === TYPE_TOGGLE_SWITCH) {
    playSe('push');
    gameState.toggleState = !gameState.toggleState;
    const tileEl = getTileVisual(container, nextIdx);
    if (tileEl) {
      tileEl.classList.add("active");
      animatePressButton(tileEl, "triangle");
      setTimeout(() => tileEl?.classList.remove("active"), 200);
    }
    updateBlocksVisual(container);
  }

  if (nextCell.type === TYPE_GOAL) {
    if (direction === nextCell.rot) {
      if (gameState.crystalsCollected >= gameState.totalCrystals) {
        finishLevel(nextX, nextY, container);
        return;
      }
    }
  }
  if (nextCell.type === TYPE_WARP) {
    const color = nextCell.val;
    const localCluster = getWarpCluster(nextIdx, currentLevel.data, currentLevel.size);
    const allSameColorWarps = [];
    currentLevel.data.forEach((c, i) => { if (c.type === TYPE_WARP && c.val === color) allSameColorWarps.push(i); });

    let targetIdx = -1;
    const currentArrIdx = allSameColorWarps.indexOf(nextIdx);
    const count = allSameColorWarps.length;

    if (count > 1) {
      for (let i = 1; i < count; i++) {
        const checkIdx = (currentArrIdx + i) % count;
        const candidateGridIdx = allSameColorWarps[checkIdx];
        if (!localCluster.has(candidateGridIdx)) { targetIdx = candidateGridIdx; break; }
      }
      if (targetIdx === -1 && count === 2) targetIdx = allSameColorWarps[(currentArrIdx + 1) % 2];
    }
    if (targetIdx !== -1) {
      const warpGeneration = ballResetGeneration;
      const portalTile = getTileVisual(container, nextIdx);
      if (portalTile) animatePortalEntry(portalTile, container);
      gsap.to(ballEl, { z: -50, scale: 0, rotation: '+=180', duration: 0.3, ease: "back.in(1.7)" });
      const size = currentLevel.size;
      const targetX = targetIdx % size;
      const targetY = Math.floor(targetIdx / size);
      const targetPos = getPixelPos(targetX, targetY);

      setTimeout(() => {
        if (warpGeneration !== ballResetGeneration || !isBallMoving || !ballEl) return;
        ballPos = { x: targetX, y: targetY };
        const exitTile = getTileVisual(container, targetIdx);
        if (exitTile) animatePortalEntry(exitTile, container);
        gsap.set(ballEl, { left: targetPos.left, top: targetPos.top });
        gsap.to(ballEl, { z: 15, scale: 1, rotation: '+=180', duration: 0.4, ease: "back.out(1.7)" });
        setTimeout(() => {
          if (warpGeneration !== ballResetGeneration || !isBallMoving || !ballEl) return;
          moveBall(direction, container);
        }, 500);
      }, 350);
      return;
    }
  }

  let nextDir = direction;
  let changed = false;

  // 自動回転矢印は直後に90度回転するため、揺れを同時実行すると角度アニメーションが競合する。
  // 通常矢印・固定矢印・転換だけに軽い乗車反応を付ける。
  if ([TYPE_SWITCH_ARROW, TYPE_FIXED_ARROW, TYPE_TURN_VAR, TYPE_TURN_FIX].includes(nextCell.type)) {
    const arrowTile = getTileVisual(container, nextIdx);
    if (arrowTile) animateArrowFeedback(arrowTile, 'ride');
  }

  if (nextCell.type === TYPE_ROTATING_ARROW_CW_VAR || nextCell.type === TYPE_ROTATING_ARROW_CCW_VAR ||
    nextCell.type === TYPE_ROTATING_ARROW_CW_FIX || nextCell.type === TYPE_ROTATING_ARROW_CCW_FIX) {

    if (direction !== nextCell.rot) {
      nextDir = nextCell.rot;
      changed = true;
    }
    const isCW = (nextCell.type === TYPE_ROTATING_ARROW_CW_VAR || nextCell.type === TYPE_ROTATING_ARROW_CW_FIX);
    if (isCW) nextCell.rot = (nextCell.rot + 1) % 4;
    else nextCell.rot = (nextCell.rot + 3) % 4;

    const tileEl = getTileVisual(container, nextIdx);
    if (tileEl) {
      tileEl.dataset.rotationAnimated = '1';
      animateTileArrowRotation(tileEl, isCW ? 1 : -1);
      applyTileStyle(tileEl, nextCell);
    }
  }

  else if (nextCell.type === TYPE_TOGGLE_ARROW_FIX) {
    let targetDir = nextCell.rot;
    if (gameState.toggleState) targetDir = (targetDir + 2) % 4;
    if (direction !== targetDir) { nextDir = targetDir; changed = true; }
  }
  else if (nextCell.type === TYPE_SWITCH_ARROW || nextCell.type === TYPE_FIXED_ARROW) {
    if (direction !== nextCell.rot) { nextDir = nextCell.rot; changed = true; }
  }
  else if (nextCell.type === TYPE_TURN_VAR || nextCell.type === TYPE_TURN_FIX) {
    const isClockwise = (nextCell.rot % 2 === 0);
    if (isClockwise) nextDir = (direction + 3) % 4;
    else nextDir = (direction + 1) % 4;
    changed = true;
  }
  else if (nextCell.type === TYPE_U_TURN) {
    nextDir = (direction + 2) % 4; changed = true;
  }
  else if (nextCell.type === TYPE_ONE_WAY_U_TURN) {
    if (direction === nextCell.rot) { nextDir = (direction + 2) % 4; changed = true; }
  }

  if (changed) {
    spawnParticles(nextX, nextY, container);
    if (nextCell.type < 21 || nextCell.type > 24) playSe('change0');
    else playSe('change1');
  }
  moveBall(nextDir, container);
}

function spawnFireParticles(container) {
  if (!ballEl) return;
  const now = performance.now();
  if (now - lastFireParticleAt < FIRE_PARTICLE_INTERVAL_MS) return;
  lastFireParticleAt = now;
  while (activeFireParticles.size >= MAX_ACTIVE_FIRE_PARTICLES) removeOldestEffectNode(activeFireParticles);

  const curX = gsap.getProperty(ballEl, "left");
  const curY = gsap.getProperty(ballEl, "top");
  const curZ = gsap.getProperty(ballEl, "z") || 0;

  const p = document.createElement("div");
  p.className = "fire-particle";
  container.appendChild(p);
  activeFireParticles.add(p);

  const randX = (Math.random() - 0.5) * 20;
  const randY = (Math.random() - 0.5) * 20;

  gsap.set(p, {
    left: curX + 15 + randX,
    top: curY + 15 + randY,
    z: curZ + 10, // ボールの中心より少し上
    scale: Math.random() * 0.5 + 0.5
  });

  gsap.to(p, {
    z: `+=${Math.random() * 40 + 20}`, // 空中へ舞い上がる
    x: `+=${(Math.random() - 0.5) * 10}`, // わずかに左右に揺らぐ
    y: `+=${(Math.random() - 0.5) * 10}`, // わずかに前後に揺らぐ
    opacity: 0,
    scale: 0,
    duration: Math.random() * 0.6 + 0.4,
    ease: "power1.out",
    onComplete: () => { activeFireParticles.delete(p); p.remove(); }
  });
}
function updateBlocksVisual(container) {
  const size = currentLevel.size;
  for (let i = 0; i < size * size; i++) {
    const cell = currentLevel.data[i];
    const el = getTileVisual(container, i);
    if (!el) continue;

    if (gameState.toggleState) el.classList.add("toggle-blue");
    else el.classList.remove("toggle-blue");

    if (cell.type === TYPE_BLOCK) {
      if (gameState.switchStates[cell.val]) el.classList.add("off");
      else el.classList.remove("off");
    } else if (cell.type === TYPE_BLOCK_OFF) {
      if (gameState.switchStates[cell.val]) el.classList.remove("off");
      else el.classList.add("off");
    }
  }
}

function getGridCellScreenCenter(container, x, y) {
  if (!container || !currentLevel) return null;
  const size = currentLevel.size;
  if (x < 0 || x >= size || y < 0 || y >= size) return null;
  const idx = y * size + x;
  const hitbox = container.querySelector(`:scope > .tile-hitbox[data-idx="${idx}"]`);
  const element = hitbox || getTileVisual(container, idx);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width && !rect.height) return null;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function measureGridAxisScreenStep(container, x, y, axis) {
  const center = getGridCellScreenCenter(container, x, y);
  if (!center) return 0;
  const samples = [];
  const offsets = axis === 'x' ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
  for (const [ox, oy] of offsets) {
    const other = getGridCellScreenCenter(container, x + ox, y + oy);
    if (!other) continue;
    samples.push(Math.hypot(other.x - center.x, other.y - center.y));
  }
  if (!samples.length) return 0;
  return samples.reduce((sum, value) => sum + value, 0) / samples.length;
}

function getPerspectiveCorrectFallDistance(direction, container, desiredScreenDistance = 34) {
  if (!currentLevel || direction === undefined) return desiredScreenDistance;
  const axis = direction === 1 || direction === 3 ? 'x' : 'y';
  const directionStep = measureGridAxisScreenStep(container, ballPos.x, ballPos.y, axis);
  if (!Number.isFinite(directionStep) || directionStep <= 1) return desiredScreenDistance;

  // 盤面ローカル52pxが、現在位置・方向で画面上に何px投影されるかを使い、
  // どの向きでも見た目上ほぼ同じ距離だけ前へ進むように変換する。
  const correctedLocalDistance = desiredScreenDistance * 52 / directionStep;
  return Math.max(22, Math.min(82, correctedLocalDistance));
}

function getIncomingScreenVelocity(direction, container, gridPos, moveDuration = 0.15) {
  if (!currentLevel || direction === undefined || !gridPos) return { x: 0, y: 0 };
  const dx = [0, 1, 0, -1];
  const dy = [-1, 0, 1, 0];
  const current = getGridCellScreenCenter(container, gridPos.x, gridPos.y);
  const previous = getGridCellScreenCenter(
    container,
    gridPos.x - dx[direction],
    gridPos.y - dy[direction]
  );
  const next = getGridCellScreenCenter(
    container,
    gridPos.x + dx[direction],
    gridPos.y + dy[direction]
  );

  let vector = null;
  if (current && previous) {
    vector = { x: current.x - previous.x, y: current.y - previous.y };
  } else if (current && next) {
    vector = { x: next.x - current.x, y: next.y - current.y };
  }
  if (!vector) return { x: 0, y: 0 };

  const duration = Math.max(0.05, moveDuration);
  return { x: vector.x / duration, y: vector.y / duration };
}

function fallBall(direction, speedScale, container, options = {}) {
  if (!ballEl) return;
  playSe('died');

  const dx = [0, 1, 0, -1];
  const dy = [-1, 0, 1, 0];
  const initialGridPos = { x: ballPos.x, y: ballPos.y };
  const fallbackVelocity = getIncomingScreenVelocity(direction, container, initialGridPos, 0.15);
  const startLeft = _numPx(gsap.getProperty(ballEl, "left"));
  const startTop = _numPx(gsap.getProperty(ballEl, "top"));
  const startZ = _numPx(gsap.getProperty(ballEl, "z") || 15);
  const startRect = ballEl.getBoundingClientRect();

  let endLeft = startLeft;
  let endTop = startTop;
  const ratio = Math.max(0, Math.min(1, options.approachRatio ?? 0.72));
  if (options.targetPos && ratio > 0) {
    endLeft = startLeft + (options.targetPos.left - startLeft) * ratio;
    endTop = startTop + (options.targetPos.top - startTop) * ratio;
  } else if (direction !== undefined && ratio > 0) {
    const localDistance = 52 * ratio;
    endLeft = startLeft + dx[direction] * localDistance;
    endTop = startTop + dy[direction] * localDistance;
  }

  if (options.targetGridPos) {
    ballPos = { x: options.targetGridPos.x, y: options.targetGridPos.y };
  }

  const localDistance = Math.hypot(endLeft - startLeft, endTop - startTop);
  const approachDuration = localDistance > 0.5 ? Math.max(0.11, 0.15 * (localDistance / (52 * 0.72))) : 0;

  const startScreenCenter = {
    x: startRect.left + startRect.width / 2,
    y: startRect.top + startRect.height / 2
  };

  const startDrop = () => {
    if (!ballEl) return;
    updateBallTrail(container, true);
    const endRect = ballEl.getBoundingClientRect();
    const approachVector = {
      x: endRect.left + endRect.width / 2 - startScreenCenter.x,
      y: endRect.top + endRect.height / 2 - startScreenCenter.y
    };
    const velocity = approachDuration > 0.001
      ? { x: approachVector.x / approachDuration, y: approachVector.y / approachDuration }
      : fallbackVelocity;
    beginScreenSpaceFall(container, velocity, speedScale);
  };

  if (approachDuration <= 0) {
    startDrop();
    return;
  }

  gsap.to(ballEl, {
    left: endLeft,
    top: endTop,
    z: startZ,
    duration: approachDuration,
    ease: "none",
    onUpdate: () => updateBallTrail(container),
    onComplete: startDrop
  });
}

function finishLevel(gx, gy, container) {
  playSe('goal');
  clearPlayCoach();
  movementHistory = [];

  if (!isReplayMode) {
    const finalTime = playTimerVal.textContent;
    stopPlayTimer();

    if (isOfficialPlay && currentLevel._officialIndex !== undefined) {
      saveStageCleared(currentLevel._officialIndex, finalTime);
      lastClearedIndex = currentLevel._officialIndex;
    }
    else if (isFanmadePlay && currentLevel._fanmadeId) {
      saveFanmadeProgress(currentLevel._fanmadeId, finalTime);
    }
  }

  const size = currentLevel.size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.abs(x - gx) + Math.abs(y - gy);
      const idx = y * size + x;
      const tile = getTileVisual(container, idx);
      if (tile) {
        setTimeout(() => {
          tile.classList.add("rainbow-effect");
          setTimeout(() => tile.classList.remove("rainbow-effect"), 500);
        }, dist * 50);
      }
    }
  }

  if (ballEl) gsap.to(ballEl, { scale: 0, opacity: 0, duration: 0.5 });

  setTimeout(() => {
    if (ballEl) ballEl.remove(); ballEl = null; isBallMoving = false;

    if (isReplayMode) {
      const btn = document.getElementById("btnReplayToggle");
      if (btn) btn.textContent = "🔄";

      gsap.globalTimeline.pause();
    } else {
      if (isRealPlay) showClearScreen();
      else resetBallState(container);
    }
  }, 1500);
}

function showClearScreen() {
  clearOverlay.classList.remove("hidden");
  clearOverlay.classList.add("active");
  clearTextContainer.innerHTML = "";
  const chars = "CLEAR".split("");
  chars.forEach((char, i) => {
    const span = document.createElement("div");
    span.className = "clear-char";
    span.textContent = char;
    clearTextContainer.appendChild(span);

    gsap.to(span, {
      opacity: 1, transform: "rotateX(0deg)", duration: 0.5, delay: i * 0.3, ease: "back.out(1.7)",
      onStart: () => playChin()
    });
  });

  const actionsContainer = document.querySelector(".clear-actions");
  if (actionsContainer) {
    actionsContainer.innerHTML = "";
    const isFinalMainStage = Boolean(
      isOfficialPlay &&
      currentLevel &&
      !currentLevel._isEx &&
      !currentLevel._isDlc &&
      currentLevel._officialIndex === MAIN_STAGE_COUNT - 1
    );

    const btnNext = document.createElement("button");
    btnNext.id = "btnClearNext";
    btnNext.className = "btn btn-grad-next";
    btnNext.textContent = "次のステージ";

    const btnReplay = document.createElement("button");
    btnReplay.id = "btnClearReplay";
    btnReplay.className = "btn btn-grad-replay";
    btnReplay.textContent = "リプレイ";
    btnReplay.onclick = () => {
      playChin();
      startReplayMode();
    };

    const btnRetry = document.createElement("button");
    btnRetry.id = "btnClearRetry";
    btnRetry.className = "btn dark";
    btnRetry.textContent = "リトライ";

    const btnBack = document.createElement("button");
    btnBack.id = "btnClearBack";
    btnBack.className = "btn dark";
    btnBack.textContent = "戻る";

    btnNext.onclick = () => {
      if (isOfficialPlay && currentLevel && currentLevel._officialIndex !== undefined) {
        const nextIdx = currentLevel._officialIndex + 1;
        if (nextIdx < officialLevels.length) startOfficialPlay(nextIdx);
      }
    };
    btnRetry.onclick = () => {
      playChin();
      retryRealPlay();
    };
    btnBack.onclick = () => {
      playChin();

      // STAGE 30は通常のCLEAR画面を見せた後、
      // 「戻る」でステージ選択へ戻った瞬間に全制覇演出を始める。
      if (isFinalMainStage && shouldStartFinalMainSequence()) {
        immediateAllClearRequested = true;
      }

      leaveCurrentPlayScreen();
    };

    if (!isFinalMainStage && isOfficialPlay && currentLevel && currentLevel._officialIndex !== undefined) {
      const nextIdx = currentLevel._officialIndex + 1;
      if (currentLevel._officialIndex !== (MAIN_STAGE_COUNT - 1) && nextIdx < officialLevels.length) {
        actionsContainer.appendChild(btnNext);
      }
    }

    if (!isFinalMainStage && lastAttemptData) {
      actionsContainer.appendChild(btnReplay);
    }

    if (!isFinalMainStage) actionsContainer.appendChild(btnRetry);
    actionsContainer.appendChild(btnBack);
    actionsContainer.classList.toggle("final-main-actions", isFinalMainStage);
  }
}
function startReplayMode() {
  if (!lastAttemptData) return;

  isReplayMode = true;
  if (!replaySpeed) replaySpeed = 1.0;

  clearOverlay.classList.remove("active");
  clearOverlay.classList.add("hidden");

  const controls = document.getElementById("replayControls");
  if (controls) controls.classList.remove("hidden");

  const playControls = document.getElementById("playControls");
  if (playControls) playControls.classList.add("hidden");

  updateReplaySpeedUI();

  currentLevel.data = JSON.parse(JSON.stringify(lastAttemptData));
  resetGameState();
  renderGrid(playGrid);

  playTimerVal.textContent = "REPLAY";

  setTimeout(() => {
    let startIdx = lastAttemptStartIdx;
    if (startIdx === -1 || !currentLevel.data[startIdx] || currentLevel.data[startIdx].type !== TYPE_START) {
      startIdx = currentLevel.data.findIndex(c => c.type === TYPE_START);
    }

    if (startIdx !== -1) {
      spawnBall(startIdx, playGrid);

      const btn = document.getElementById("btnReplayToggle");
      if (btn) btn.textContent = "⏸️";

      gsap.globalTimeline.paused(false);
      gsap.globalTimeline.timeScale(replaySpeed);
    }
  }, 500);
}
function stopReplayMode() {
  isReplayMode = false;

  if (ballEl) {
    gsap.killTweensOf(ballEl);
    ballEl.remove();
    ballEl = null;
  }
  isBallMoving = false;

  gsap.globalTimeline.timeScale(1.0);
  gsap.globalTimeline.paused(false);

  const controls = document.getElementById("replayControls");
  if (controls) controls.classList.add("hidden");

  const playControls = document.getElementById("playControls");
  if (playControls) playControls.classList.remove("hidden");

  showClearScreen();
}
function toggleReplayPause() {
  const paused = gsap.globalTimeline.paused();
  const btn = document.getElementById("btnReplayToggle");

  if (paused) {
    gsap.globalTimeline.resume();
    if (btn) btn.textContent = "⏸️";
  } else {
    gsap.globalTimeline.pause();
    if (btn) btn.textContent = "▶️";
  }
}

function changeReplaySpeed(delta) {
  replaySpeed += delta;
  if (replaySpeed < 0.5) replaySpeed = 0.5;
  if (replaySpeed > 4.0) replaySpeed = 4.0;

  gsap.globalTimeline.timeScale(replaySpeed);
  updateReplaySpeedUI();
}

function updateReplaySpeedUI() {
  const span = document.getElementById("replaySpeedVal");
  if (span) span.textContent = replaySpeed.toFixed(1) + "x";
}

function restartReplay() {
  if (ballEl) {
    gsap.killTweensOf(ballEl);
    ballEl.remove();
    ballEl = null;
  }
  isBallMoving = false;

  currentLevel.data = JSON.parse(JSON.stringify(lastAttemptData));
  resetGameState();
  renderGrid(playGrid);

  updateReplaySpeedUI();
  gsap.globalTimeline.timeScale(replaySpeed);
  gsap.globalTimeline.paused(false);

  const btn = document.getElementById("btnReplayToggle");
  if (btn) btn.textContent = "⏸️";

  setTimeout(() => {
    let startIdx = lastAttemptStartIdx;
    if (startIdx === -1) {
      startIdx = currentLevel.data.findIndex(c => c.type === TYPE_START);
    }

    if (startIdx !== -1) {
      spawnBall(startIdx, playGrid);
    }
  }, 300);
}
function resetBallState(container) {
  const resetGeneration = ++ballResetGeneration;
  isBallResetting = true;
  setTimeout(clearScreenFallEffects, 700);

  if (ballEl) {
    gsap.killTweensOf(ballEl);
    ballEl.remove();
    ballEl = null;
  }
  isBallMoving = true;

  gsap.to(container, {
    opacity: 0,
    duration: 0.25,
    ease: "power2.out",
    onComplete: () => {
      if (resetGeneration !== ballResetGeneration) return;
      if (originalLevelData) {
        const freshData = JSON.parse(JSON.stringify(originalLevelData));
        if (currentLevel && currentLevel.data) {
          applyKeptTileStates(freshData, currentLevel.data);
        }
        currentLevel.data = freshData;
      }

      resetGameState();

      if (originalLevelData) {
        renderGrid(container);
      }

      gsap.to(container, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          if (resetGeneration !== ballResetGeneration) return;
          isBallMoving = false;
          isBallResetting = false;
        }
      });
    }
  });
}
function openSettings() {
  document.getElementById("editLevelName").value = currentLevel.name;
  document.getElementById("editLevelSub").value = currentLevel.sub || "";
  document.getElementById("editLevelAuthor").value = currentLevel.author || "";

  const locked = !isDlcUnlocked();

  const bgSelect = document.getElementById("editBgTheme");
  if (bgSelect) {
    Array.from(bgSelect.options).forEach(opt => {
      opt.disabled = false;
      if (opt.dataset.originalText) {
        opt.textContent = opt.dataset.originalText;
      }
    });
    bgSelect.value = currentLevel.bgTheme || "warm";
  }

  const bgmSelect = document.getElementById("editBgmTheme");
  if (bgmSelect) {
    Array.from(bgmSelect.options).forEach(opt => {
      if (DLC_BGM_THEMES.includes(opt.value)) {
        opt.disabled = locked;
        if (locked) {
          if (!opt.dataset.originalText) opt.dataset.originalText = opt.textContent;
          opt.textContent = "??? (Locked)";
        } else if (opt.dataset.originalText) {
          opt.textContent = opt.dataset.originalText;
        }
      }
    });

    const currentBgm = currentLevel.bgmTheme || "warm";
    if (locked && DLC_BGM_THEMES.includes(currentBgm)) {
      bgmSelect.value = "warm";
    } else {
      bgmSelect.value = currentBgm;
    }
  }

  editorHintsContainer.innerHTML = "";
  const hints = currentLevel.hints || [];
  hints.forEach(text => addHintInput(text));

  settingsModal.showModal();
}

function addHintInput(value) {
  const row = document.createElement("div");
  row.className = "editor-hint-row";
  const count = editorHintsContainer.children.length + 1;
  const numSpan = document.createElement("span");
  numSpan.textContent = count + ":";
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.placeholder = "ヒントを入力";
  const btnDel = document.createElement("button");
  btnDel.type = "button";
  btnDel.className = "btn small danger";
  btnDel.textContent = "×";
  btnDel.onclick = () => {
    row.remove();
    updateHintNumbers();
  };
  row.appendChild(numSpan);
  row.appendChild(input);
  row.appendChild(btnDel);
  editorHintsContainer.appendChild(row);
}

function updateHintNumbers() {
  Array.from(editorHintsContainer.children).forEach((row, idx) => {
    row.querySelector("span").textContent = (idx + 1) + ":";
  });
}

function applySettings(e) {
  e.preventDefault();
  currentLevel.name = document.getElementById("editLevelName").value;
  currentLevel.sub = document.getElementById("editLevelSub").value;
  currentLevel.author = document.getElementById("editLevelAuthor").value;

  currentLevel.bgTheme = document.getElementById("editBgTheme").value;
  currentLevel.bgmTheme = document.getElementById("editBgmTheme").value;

  const hintInputs = editorHintsContainer.querySelectorAll("input");
  currentLevel.hints = Array.from(hintInputs).map(inp => inp.value).filter(v => v.trim() !== "");

  document.getElementById("editorLevelTitle").textContent = currentLevel.name;
  saveCurrentLevel();

  setStageTheme(currentLevel.bgTheme);
  playStageBgm(currentLevel.bgmTheme);

  if (currentLevel._isDlc) {
    setShowDlcPillars(true);
  }

  settingsModal.close();
}

function saveCurrentLevel() {
  if (!currentLevel) return;
  if (!ensureLevelValid(currentLevel, "保存")) return;
  currentLevel.updated = Date.now();
  const levels = getSavedLevels();
  const idx = levels.findIndex(l => l.id === currentLevel.id);
  if (idx !== -1) {
    levels[idx] = currentLevel; saveLevels(levels);
    const originalText = btnSaveLevel.textContent;
    btnSaveLevel.textContent = "保存完了!";
    btnSaveLevel.classList.add("primary");
    setTimeout(() => { btnSaveLevel.textContent = originalText; }, 1500);
  }
}
function startAutoSave(min) { stopAutoSave(); autoSaveTimerId = setInterval(() => { saveCurrentLevel(); }, min * 60 * 1000); }
function stopAutoSave() { if (autoSaveTimerId) clearInterval(autoSaveTimerId); autoSaveTimerId = null; }
function startEditorTimer() {
  stopEditorTimer(); editorStartTime = Date.now(); editorTimerValue.textContent = "00:00:00";
  editorTimerId = setInterval(() => {
    const diff = Math.floor((Date.now() - editorStartTime) / 1000);
    const h = Math.floor(diff / 3600).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    editorTimerValue.textContent = `${h}:${m}:${s}`;
  }, 1000);
}
function stopEditorTimer() { if (editorTimerId) clearInterval(editorTimerId); editorTimerId = null; }

function getWarpCluster(startIdx, levelData, size) {
  const targetColor = levelData[startIdx].val;
  const cluster = new Set([startIdx]);
  const queue = [startIdx];
  const directions = [-1, 1, -size, size];

  while (queue.length > 0) {
    const curr = queue.pop();
    const cx = curr % size;
    const cy = Math.floor(curr / size);
    const neighbors = [];
    if (cx > 0) neighbors.push(curr - 1);
    if (cx < size - 1) neighbors.push(curr + 1);
    if (cy > 0) neighbors.push(curr - size);
    if (cy < size - 1) neighbors.push(curr + size);

    for (const n of neighbors) {
      if (!cluster.has(n)) {
        const neighborCell = levelData[n];
        if (neighborCell && neighborCell.type === TYPE_WARP && neighborCell.val === targetColor) {
          cluster.add(n);
          queue.push(n);
        }
      }
    }
  }
  return cluster;
}

function initFanmadeFeatures() {
}
initFanmadeFeatures();

window.loadFanmadeLevels = async function () {
  const container = document.getElementById("fanmadeLevelList");
  let loader = null;

  if (container) {
    container.innerHTML = "";
    loader = showListLoading(container, "Initialize...");
  }

  fanmadeLevels = [];
  const CHECK_LIMIT = 12;
  let processedCount = 0;
  const promises = [];

  for (let i = 0; i < CHECK_LIMIT; i++) {
    const p = new Promise(async (resolve) => {
      await new Promise(r => setTimeout(r, i * 30));

      try {
        const res = await fetch(`./fanmade_levels/level_fanmade_${i}.3aab`);

        if (res.ok) {
          const raw = await res.json();
          const data = parse3aabData(raw);

          if (data) {
            data._fanmadeId = `fan_${i}`;
            data._isStatic = true;
            fanmadeLevels.push(data);
            if (loader) loader.update((processedCount / CHECK_LIMIT) * 100, `Loaded: Level ${i}`);
          } else {
            if (loader) loader.update((processedCount / CHECK_LIMIT) * 100, `Error: Level ${i} (Invalid Format)`);
          }
        } else {
          if (loader) loader.update((processedCount / CHECK_LIMIT) * 100, `Skip: Level ${i} (Not Found)`);
        }
      } catch (e) {
        if (loader) loader.update((processedCount / CHECK_LIMIT) * 100, `Error: Level ${i}`);
      } finally {
        processedCount++;
        if (loader) loader.update((processedCount / CHECK_LIMIT) * 100);
        resolve();
      }
    });
    promises.push(p);
  }

  await Promise.all(promises);

  fanmadeLevels.sort((a, b) => {
    const idA = parseInt(a._fanmadeId.split('_')[1]);
    const idB = parseInt(b._fanmadeId.split('_')[1]);
    return idA - idB;
  });

  if (loader) loader.update(100, "All Assets Ready.");

  setTimeout(() => {
    renderFanmadeList();
  }, 400);
}

function getFanmadeProgress() {
  const val = localStorage.getItem(FANMADE_PROGRESS_KEY);
  if (!val) return {};
  try { return JSON.parse(val); } catch (e) { return {}; }
}

function saveFanmadeProgress(id, timeStr) {
  const progress = getFanmadeProgress();
  progress[id] = { time: timeStr, clearedAt: Date.now() };
  localStorage.setItem(FANMADE_PROGRESS_KEY, JSON.stringify(progress));
}
/* editor.js */

function renderFanmadeList() {
  const container = document.getElementById("fanmadeLevelList");
  if (!container) return;
  container.innerHTML = "";

  const progress = getFanmadeProgress();

  if (fanmadeLevels.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">
        レベルが見つかりません。<br>
        <span style="font-size:12px; color:#555;">(fanmade_levels/level_fanmade_0.json ...)</span>
      </div>`;
    return;
  }

  fanmadeLevels.forEach((level, idx) => {
    const clearData = progress[level._fanmadeId];
    const isCleared = !!clearData;

    const item = document.createElement("div");
    item.className = "level-item official fanmade";

    if (isCleared) {
      item.dataset.isClearedEntry = "true";
    }

    const timeHtml = isCleared
      ? `<div class="clear-time-info"><span>CLEAR TIME</span><strong>${clearData.time}</strong></div>`
      : "";

    item.innerHTML = `
      <span class="card-sheen" aria-hidden="true"></span>
      <h4>No.${idx + 1}</h4>
      <div class="sub-title">${escapeHtml(level.name)}</div>
      ${level.sub ? `<div style="font-size:12px; color:#aaa; margin-bottom:4px;">${escapeHtml(level.sub)}</div>` : ""}
      <div class="author-name">by ${escapeHtml(level.author || "Unknown")}</div>
      ${timeHtml}
      ${isCleared ? `<span class="clear-stamp" aria-label="クリア済み">★<small>CLEAR</small></span>` : ""}
    `;
    bindStageCardMotion(item, -1000 - idx);

    item.addEventListener("click", () => {
      playChin();

      if (!isDlcUnlocked()) {

        const hasDlcTile = level.data.some(c => DLC_TILES.includes(Number(c.type)));

        const hasDlcBgm = DLC_BGM_THEMES.includes(level.bgmTheme);

        if (hasDlcTile || hasDlcBgm) {
          playSe("died");
          alert("このレベルには聖域コンテンツ（タイルまたはBGM）が含まれているため、\n聖域を開放するまで遊ぶことができません。");
          return;
        }
      }

      currentLevel = JSON.parse(JSON.stringify(level));

      levelSessionStartTime = Date.now();
      startRealPlay(null, false, true);
    });

    container.appendChild(item);
  });

  setTimeout(() => {
    const items = Array.from(container.querySelectorAll(".level-item"));
    const clearedItems = items.filter(el => el.dataset.isClearedEntry === "true");

    clearedItems.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add("card-arrived");
        el.classList.add("flip-reveal");
        setTimeout(() => {
          el.classList.add("cleared");
        }, 360);
        setTimeout(() => {
          el.classList.remove("flip-reveal");
          el.classList.add("clear-revealed");
          el.style.opacity = "1";
        }, 900);
      }, i * 50);
    });
  }, 100);
}
init();
