/* editor.js */
import { showScreen, showLoading, playChin, audioSettings, playStageBgm, setStageTheme } from './main.js';

const MAX_LEVELS = 10;
const STORAGE_KEY = '3d_arrow_ball_levels';
const OFFICIAL_PROGRESS_KEY = '3d_arrow_ball_progress';
const MAIN_STAGE_COUNT = 30; // 0 to 29
const EX_UNLOCKED_KEY = '3d_arrow_ball_ex_unlocked';
const FANMADE_PROGRESS_KEY = '3d_arrow_ball_fanmade_progress';

// タイル定義
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
// 新規タイル: 一方通行Uターン
const TYPE_ONE_WAY_U_TURN = 19;

// パレット用シーケンス（ホイール切替順序）
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
  // 19はここには含めず、Uターンをクリックで変異させる仕様だが、
  // 万一ホイールで変えたい時のために追加しておく
  { type: TYPE_ONE_WAY_U_TURN, rot: 0 },
  { type: TYPE_GLASS, rot: 0, val: 1 },
  { type: TYPE_JUMP, rot: 0, val: 1 },
  { type: TYPE_WARP, rot: 0, val: 1 },
  { type: TYPE_SWITCH, rot: 0, val: 1 },
  { type: TYPE_BLOCK, rot: 0, val: 1 },
  { type: TYPE_BLOCK_OFF, rot: 0, val: 1 },
  { type: TYPE_CRYSTAL, rot: 0 }
];


const sounds = {
  change0: document.getElementById("seChange0"),
  change1: document.getElementById("seChange1"),
  goal: document.getElementById("seGoal"),
  break: document.getElementById("seBreak"),
  push: document.getElementById("sePush"),
  allClear: document.getElementById("seAllClear"),
  exSpawn: document.getElementById("seExSpawn"),
  died: document.getElementById("seDied")
};
Object.values(sounds).forEach(s => { if (s) s.volume = 0.5; });
function playSe(name) {
  const audio = sounds[name];
  if (audio) {
    audio.currentTime = 0;
    audio.volume = audioSettings.sfxVolume;
    audio.play().catch(e => { });
  }
}

// Variables
let currentLevel = null;
let currentTileType = 1;
let isEditorMode = true;
let isRealPlay = false;
let isFanmadePlay = false; // ファンメイドプレイ中フラグ
let isOfficialPlay = false; // 公式レベルプレイ中か
let isMouseDown = false;
let selectedLevelId = null;
let originalLevelData = null;

let fanmadeLevels = []; 
let officialLevels = []; // 公式レベルキャッシュ
let officialLevelsLoaded = false;
let lastClearedIndex = -1; // 最後にクリアした公式ステージのインデックス

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
let ballPos = { x: 0, y: 0 };

// 裏技キー判定
const cheatKeys = { Shift: false, e: false, x: false };

// DOM Elements
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

const editorHintsContainer = document.getElementById("editorHintsContainer");
const btnAddHint = document.getElementById("btnAddHint");

const btnPlayHint = document.getElementById("btnPlayHint");
const hintViewModal = document.getElementById("hintViewModal");
const btnCloseHintView = document.getElementById("btnCloseHintView");
const playHintList = document.getElementById("playHintList");


// --- Responsive grid fitting (stable, PC+mobile) ---
function _clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function _numPx(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }

function fitGridToHost(grid, host, opts = {}) {
  if (!grid || !host) return;
  if (grid.offsetParent === null) return; // hidden

  const prevTransition = grid.style.transition;

  // 1) まず transition を切って scale=1 の「基準サイズ」を確定させる
  grid.style.transition = "none";
  grid.style.setProperty("--gridScale", "1");

  // Force layout (重要: ここで確定させる)
  grid.getBoundingClientRect();

  const gridRect = grid.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  const cs = getComputedStyle(host);

  // 2) host の内側(= padding を除いた領域)を可用領域として扱う
  const padX = _numPx(cs.paddingLeft) + _numPx(cs.paddingRight);
  const padY = _numPx(cs.paddingTop) + _numPx(cs.paddingBottom);

  // 少しだけ余白を残して「端が見切れない」ようにする
  const safety = ("safety" in opts) ? opts.safety : 0.96; // 0.94〜0.98 くらいが安定
  const extraMarginX = ("marginX" in opts) ? opts.marginX : 18; // px
  const extraMarginY = ("marginY" in opts) ? opts.marginY : 18; // px

  const availW = Math.max(10, hostRect.width - padX - extraMarginX);
  const availH = Math.max(10, hostRect.height - padY - extraMarginY);

  let scale = Math.min(availW / gridRect.width, availH / gridRect.height);
  scale *= safety;

  const s = _clamp(scale, opts.min ?? 0.35, opts.max ?? 3.0);

  // 3) 求めた拡大率を適用してから、transition を元に戻す（これでブレない）
  grid.style.setProperty("--gridScale", String(s));

  // Force layout once more to avoid Safari iOS oddities
  grid.getBoundingClientRect();

  grid.style.transition = prevTransition; // restore
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
    // エディターはパレット等が重なりやすいので少し余裕多め
    fitGridToHost(editorGrid, editorHost, { safety: 0.95, marginY: 26, marginX: 26 });
  }
}

window.addEventListener("resize", () => requestAnimationFrame(fitVisibleGrids));
window.addEventListener("orientationchange", () => requestAnimationFrame(fitVisibleGrids));
if (window.visualViewport) {
  // iOS のアドレスバー伸縮などは resize だけ拾えばOK（scrollで拾うと拡大率が暴れる）
  window.visualViewport.addEventListener("resize", () => requestAnimationFrame(fitVisibleGrids));
}


// --- Also fit when screens become active / grid content changes (fixes Stage 0 on mobile) ---
function _scheduleFitVisibleGrids() {
  // 2x rAF: after class toggles + after DOM updates
  requestAnimationFrame(() => requestAnimationFrame(fitVisibleGrids));
}

// When screen is shown/hidden (class changes), re-fit immediately.
const _fitObsTargets = [
  document.getElementById("playScreen"),
  document.getElementById("editorMainScreen"),
];
const _fitObserver = new MutationObserver(() => _scheduleFitVisibleGrids());
for (const t of _fitObsTargets) {
  if (t) _fitObserver.observe(t, { attributes: true, attributeFilter: ["class"] });
}

// When grid content updates (tiles inserted), re-fit once.
if (playGrid) {
  const _gridObserver = new MutationObserver(() => _scheduleFitVisibleGrids());
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

// Skip Warning
const skipWarningModal = document.getElementById("skipWarningModal");
const btnSkipExec = document.getElementById("btnSkipExec");
const btnSkipCancel = document.getElementById("btnSkipCancel");

const skipConfirmModal = document.getElementById("skipConfirmModal");
const btnSkipConfirmExec = document.getElementById("btnSkipConfirmExec");
const btnSkipConfirmCancel = document.getElementById("btnSkipConfirmCancel");


let pendingSkipLevelIndex = -1;

// Reset Progress
const btnResetProgress = document.getElementById("btnResetProgress");

// Play Screen
const playIntro = document.getElementById("playIntro");
const playIntroTitle = document.getElementById("playIntroTitle"); // 追加
const playTimerVal = document.getElementById("playTimerVal");
const clearOverlay = document.getElementById("clearOverlay");
const clearTextContainer = document.getElementById("clearTextContainer");
const btnClearNext = document.getElementById("btnClearNext"); // Next Stage Button
const btnClearRetry = document.getElementById("btnClearRetry");
const btnClearBack = document.getElementById("btnClearBack");
const btnPlaySkip = document.getElementById("btnPlaySkip"); // New Skip Button

// All Clear Overlay
const allClearOverlay = document.getElementById("allClearOverlay");
const congratsText = document.getElementById("congratsText");
const exUnlockText = document.getElementById("exUnlockText");

function getPixelPos(x, y) {
  const stride = 52;
  const offset = 10;
  return { left: x * stride + offset, top: y * stride + offset };
}

function init() {
  renderList();
  loadOfficialLevels();

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // 公式レベル選択画面が表示されたらリスト更新
      if (mutation.target.id === 'officialSelectScreen' &&
        mutation.target.classList.contains('screen--active')) {
        renderOfficialList();
      }
      // 創作レベル選択画面が表示されたらリスト更新（これを追加！）
      if (mutation.target.id === 'fanmadeSelectScreen' &&
        mutation.target.classList.contains('screen--active')) {
        renderFanmadeList();
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
    btn.addEventListener("click", () => {
      paletteItems.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTileType = parseInt(btn.dataset.type);
      // パレット上ではType 8として選択してもらうが、裏でType 19のボタンももしあれば対応
      if (currentTileType === TYPE_ONE_WAY_U_TURN) {
         // パレットに隠しボタンがある場合用
         currentTileType = TYPE_U_TURN; 
      }
    });
  });
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
  editorGrid.addEventListener("mousedown", () => isMouseDown = true);
  window.addEventListener("mouseup", () => isMouseDown = false);
  btnTestPlay.addEventListener("click", startTestPlayMode);
  btnStopTest.addEventListener("click", stopTestPlayMode);

  btnAddHint.addEventListener("click", () => addHintInput(""));

  // プレイ中ヒント閲覧
  btnPlayHint.addEventListener("click", () => {
    playChin();
    showPlayHints();
  });
  btnCloseHintView.addEventListener("click", () => hintViewModal.close());


  // Clear Actions
  btnClearNext.addEventListener("click", () => {
    if (isOfficialPlay && currentLevel && currentLevel._officialIndex !== undefined) {
      const nextIdx = currentLevel._officialIndex + 1;
      if (nextIdx < officialLevels.length) {
        startOfficialPlay(nextIdx);
      }
    }
  });
  btnClearRetry.addEventListener("click", retryRealPlay);
// init() 内の btnClearBack イベントリスナー定義部分
  btnClearBack.addEventListener("click", () => {
    playChin();
    stopPlayMode(); 
    if (isOfficialPlay) showScreen("officialSelect");
    else if (isFanmadePlay) showScreen("fanmadeSelect"); // ★修正: ファンメイド一覧へ戻る
    else showScreen("editorSelect");
  });

  // Skip Button Logic
  if (btnPlaySkip) {
    btnPlaySkip.addEventListener("click", () => {
      playChin();
      skipConfirmModal.showModal();
    });
  }

  // スキップ実行ボタン (モーダル内)
  if (btnSkipConfirmExec) {
    btnSkipConfirmExec.addEventListener("click", () => {
      playChin();
      skipConfirmModal.close();
      // 強制的にゴール演出へ (座標は仮の中央)
      if (currentLevel) {
        finishLevel(Math.floor(currentLevel.size / 2), Math.floor(currentLevel.size / 2), playGrid);
      }
    });
  }

  // スキップキャンセルボタン (モーダル内)
  if (btnSkipConfirmCancel) {
    btnSkipConfirmCancel.addEventListener("click", () => {
      skipConfirmModal.close();
    });
  }

  // Skip Warning
  btnSkipExec.addEventListener("click", () => {
    if (pendingSkipLevelIndex !== -1) {
      startOfficialPlay(pendingSkipLevelIndex);
      skipWarningModal.close();
    }
  });
  btnSkipCancel.addEventListener("click", () => skipWarningModal.close());

  // 裏技キー監視
  window.addEventListener("keydown", (e) => {
    if (e.key === "Shift") cheatKeys.Shift = true;
    if (e.key.toLowerCase() === "e") cheatKeys.e = true;
    if (e.key.toLowerCase() === "x") cheatKeys.x = true;

    // Shift + E + X で全EX開放
    if (cheatKeys.Shift && cheatKeys.e && cheatKeys.x) {
      // 公式選択画面でのみ有効
      const screen = document.getElementById('officialSelectScreen');
      if (screen && screen.classList.contains('screen--active')) {
        localStorage.setItem(EX_UNLOCKED_KEY, 'true');
        loadOfficialLevels(); // 再読み込みしてリスト更新
        playSe('exSpawn');
        alert("裏技発動！\nEXモードを開放しました。");
      }
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "Shift") cheatKeys.Shift = false;
    if (e.key.toLowerCase() === "e") cheatKeys.e = false;
    if (e.key.toLowerCase() === "x") cheatKeys.x = false;
  });
}

// --- Official Levels ---
async function loadOfficialLevels() {
  officialLevels = [];

  // メインステージ読み込み (0 ~ MAIN_STAGE_COUNT-1)
  let i = 0;
  while (true) {
    try {
      const res = await fetch(`./main_levels/level_stage_${i}.json`);
      if (!res.ok) break;
      const data = await res.json();
      data._officialIndex = i;
      data._isEx = false;
      officialLevels.push(data);
      i++;
    } catch (e) {
      break;
    }
  }

  // EXステージ読み込み
  let j = 0;
  while (true) {
    try {
      const res = await fetch(`./main_levels/level_ex_${j}.json`);
      if (!res.ok) break;
      const data = await res.json();
      data._officialIndex = i + j; // 連番を維持
      data._isEx = true;
      officialLevels.push(data);
      j++;
    } catch (e) {
      break;
    }
  }

  officialLevelsLoaded = true;
  renderOfficialList();
}


// --- クリア状況の取得（タイム対応・オブジェクト形式） ---
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

// --- クリア状況の保存（インデックスとタイムを保存） ---
function saveStageCleared(index, timeStr) {
  const cleared = getClearedStages();
  cleared[index] = { time: timeStr };
  localStorage.setItem(OFFICIAL_PROGRESS_KEY, JSON.stringify(cleared));
}


// --- 3. 公式レベルリスト描画 ---
function renderOfficialList() {
  if (!officialListContainer) return;
  officialListContainer.innerHTML = "";

  if (!officialLevelsLoaded) {
    officialListContainer.innerHTML = `<div style="padding:20px; text-align:center;">読み込み中...</div>`;
    return;
  }

  const clearedStages = getClearedStages();
  const clearedIndices = Object.keys(clearedStages).map(Number);
  const maxCleared = clearedIndices.length > 0 ? Math.max(...clearedIndices) : -1;
  const isExUnlocked = localStorage.getItem(EX_UNLOCKED_KEY) === 'true';

  let isAllMainCleared = true;
  for (let i = 0; i < MAIN_STAGE_COUNT; i++) {
    if (!clearedStages[i]) { 
      isAllMainCleared = false; 
      break; 
    }
  }
  if (isAllMainCleared && !isExUnlocked) {
    triggerAllClearSequence(); // 全クリア演出へ
    return;
  }

  officialLevels.forEach((level, idx) => {
    if (level._isEx && !isExUnlocked) return;

    const item = document.createElement("div");
    // 初期状態は 'cleared' をつけず、演出で後から付与する
    item.className = "level-item official";
    if (level._isEx) item.classList.add("ex");

    const clearData = clearedStages[idx];
    const isCleared = !!clearData;
    const isUnlocked = level._isEx ? isExUnlocked : (idx <= maxCleared + 1);

    if (!isUnlocked) item.classList.add("locked");

    let stageLabel = level._isEx ? `EXTRA ${level._officialIndex - MAIN_STAGE_COUNT}` : `STAGE ${level._officialIndex}`;
    
    const timeHtml = isCleared ? `<div class="clear-time-info">{${clearData.time}} Clear</div>` : "";

    item.innerHTML = `
      <h4>${stageLabel}</h4>
      <p>${level.name}</p>
      <div class="sub-title">${level.sub || ""}</div>
      <div class="author-name">by ${level.author || "公式"}</div>
      ${timeHtml}
    `;

    item.addEventListener("click", () => {
      playChin();
      if (isUnlocked) startOfficialPlay(idx);
      else if (!level._isEx) {
        pendingSkipLevelIndex = idx;
        skipWarningModal.showModal();
      }
    });

    officialListContainer.appendChild(item);

    // クリア済みパネルには目印をつけておく
    if (isCleared) item.dataset.isClearedEntry = "true";
  });

  // クリアパネル演出
  setTimeout(() => {
    const items = Array.from(officialListContainer.querySelectorAll(".level-item"));
    const clearedItems = items.filter(el => el.dataset.isClearedEntry === "true");
    
    clearedItems.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add("flip-reveal");
        setTimeout(() => {
          el.classList.add("cleared");
        }, 350); 
      }, i * 100); 
    });
  }, 500); 
}

function triggerAllClearSequence() {
  if (allClearOverlay.classList.contains("active")) return;

  playSe("allClear");
  allClearOverlay.classList.remove("hidden");
  allClearOverlay.classList.add("active");

  congratsText.style.animation = 'none';
  congratsText.offsetHeight; /* trigger reflow */
  congratsText.style.animation = null;

  exUnlockText.classList.remove("visible");

  setTimeout(() => {
    exUnlockText.classList.add("visible");
    playSe("exSpawn");
  }, 7000);

  setTimeout(() => {
    allClearOverlay.classList.add("hidden");
    allClearOverlay.classList.remove("active");

    localStorage.setItem(EX_UNLOCKED_KEY, 'true');
    renderOfficialList();

  }, 10000);
}

function startOfficialPlay(idx) {
  const levelData = officialLevels[idx];
  if (!levelData) return;
  currentLevel = JSON.parse(JSON.stringify(levelData));
  levelSessionStartTime = Date.now();
  startRealPlay(null, true);
}

// --- Import/Export ---
function handleImportLevel(e) {
  const file = e.target.files[0];
  if (!file) return;
  importOverlay.classList.add("active");

  setTimeout(() => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const level = JSON.parse(ev.target.result);
        if (!level.data || !level.size) throw new Error("Invalid format");
        level.id = Date.now().toString();
        level.created = level.created || Date.now();
        level.updated = Date.now();
        const levels = getSavedLevels();
        levels.push(level);
        saveLevels(levels);
        renderList();
      } catch (err) {
        alert("ファイルの読み込みに失敗しました");
      }
      importOverlay.classList.remove("active");
      fileImport.value = "";
    };
    reader.readAsText(file);
  }, 500);
}

function exportLevel() {
  if (!currentLevel) return;
  const dataStr = JSON.stringify(currentLevel, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `level_${currentLevel.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Data Management ---
function getSavedLevels() { const json = localStorage.getItem(STORAGE_KEY); return json ? JSON.parse(json) : []; }
function saveLevels(levels) { localStorage.setItem(STORAGE_KEY, JSON.stringify(levels)); }
function deleteLevel(id) {
  const levels = getSavedLevels();
  const newLevels = levels.filter(l => l.id !== id);
  saveLevels(newLevels);
  if (selectedLevelId === id) selectedLevelId = null;
  renderList();
}

// ★修正: リストソート実装
function renderList() {
  const levels = getSavedLevels();
  // 更新日順にソート (降順)
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
  selectedLevelId = level.id; renderList(); noSelectionMsg.style.display = "none"; detailsPanel.classList.remove("hidden");
  detailTitle.textContent = level.name; detailSub.textContent = level.sub || ""; detailAuthor.textContent = level.author || "名無し";
  const dateStr = new Date(level.created).toLocaleDateString();
  const updateStr = level.updated ? new Date(level.updated).toLocaleString() : "-";
  detailSizeDate.textContent = `サイズ: ${level.size}x${level.size} | 作成: ${dateStr}`;
  detailUpdate.textContent = `最終更新: ${updateStr}`;
}
function escapeHtml(str) { if (!str) return ""; return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])); }

function openNewLevelModal() { const levels = getSavedLevels(); if (levels.length >= MAX_LEVELS) { alert(`保存できるレベルは${MAX_LEVELS}個までです。`); return; } formNew.reset(); modalNew.showModal(); }
function handleCreateLevel(e) {
  e.preventDefault(); const formData = new FormData(formNew); const size = parseInt(formData.get("gridSize"), 10);
  const newLevel = {
    id: Date.now().toString(), name: formData.get("levelName"), sub: formData.get("levelSub") || "", author: formData.get("levelAuthor") || "No Name",
    size: size, 
    // autoSave はグローバルに移行したためここでは不要だがデータ互換のため0にしておく
    autoSave: 0, 
    created: Date.now(), updated: Date.now(),
    bgTheme: "warm", bgmTheme: "warm", // デフォルト
    data: Array(size * size).fill(null).map(() => ({ type: TYPE_NORMAL, rot: 0, val: 0 })),
    hints: [], 
  };
  const levels = getSavedLevels(); levels.push(newLevel); saveLevels(levels); modalNew.close(); selectedLevelId = newLevel.id; loadLevelEditor(newLevel.id);
}

// 1. エディター起動時にテーマと音楽を適用
function loadLevelEditor(id) {
  const levels = getSavedLevels();
  currentLevel = levels.find(l => l.id === id);
  if (!currentLevel) return;

  // データ補完
  if (!currentLevel.hints) currentLevel.hints = [];
  if (!currentLevel.data || currentLevel.data.length !== currentLevel.size * currentLevel.size) {
    currentLevel.data = Array(currentLevel.size * currentLevel.size).fill(null).map(() => ({ type: TYPE_NORMAL, rot: 0 }));
  }

  isRealPlay = false;
  isEditorMode = true;
  isOfficialPlay = false;
  
  showLoading(() => {
    document.getElementById("editorLevelTitle").textContent = currentLevel.name;
    
    // ★ ここを追加: 編集中もそのレベルの背景・音楽を適用
    const bgTheme = currentLevel.bgTheme || "warm";
    const bgmTheme = currentLevel.bgmTheme || "warm";
    setStageTheme(bgTheme);
    playStageBgm(bgmTheme);

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
  showScreen("editorSelect"); renderList();
}

function renderGrid(container) {
  container.innerHTML = ""; const size = currentLevel.size; container.style.setProperty('--cols', size);
  currentLevel.data.forEach((cellData, idx) => {
    const tile = document.createElement("div");
    tile.className = "tile"; tile.dataset.idx = idx;

    // クリスタルなら3D要素追加
    if (cellData.type === TYPE_CRYSTAL) {
      const cry = document.createElement("div");
      cry.className = "crystal-3d";
      const core = document.createElement("div");
      core.className = "core";
      cry.appendChild(core);
      tile.appendChild(cry);
    }

    applyTileStyle(tile, cellData);

    const isEditing = (container === editorGrid && isEditorMode);

    if (isEditing) {
      tile.addEventListener("mousedown", (e) => { if (e.button === 0) handleTileInteraction(idx); });
      tile.addEventListener("mouseenter", () => { if (isMouseDown) handleTileInteraction(idx); });
      tile.addEventListener("wheel", (e) => {
        e.preventDefault();
        const cell = currentLevel.data[idx]; const dir = e.deltaY > 0 ? 1 : -1;

        if (cell.type === TYPE_GLASS) cell.val = Math.max(1, Math.min(5, (cell.val || 1) + dir));
        else if (cell.type === TYPE_JUMP) cell.val = Math.max(1, Math.min(3, (cell.val || 1) + dir));
        else if ([TYPE_WARP, TYPE_SWITCH, TYPE_BLOCK, TYPE_BLOCK_OFF].includes(cell.type)) {
          cell.val = Math.max(1, Math.min(7, (cell.val || 1) + dir));
        }
        else {
          let currentSeqIdx = TILE_SEQUENCE.findIndex(item => item.type === cell.type);
          // 隠しタイル（Type 19）の場合はType 8（Uターン）の場所として扱う
          if (currentSeqIdx === -1 && cell.type === TYPE_ONE_WAY_U_TURN) {
             currentSeqIdx = TILE_SEQUENCE.findIndex(item => item.type === TYPE_U_TURN);
          }
          if (currentSeqIdx === -1) currentSeqIdx = 0;
          
          let nextSeqIdx = (currentSeqIdx + dir + TILE_SEQUENCE.length) % TILE_SEQUENCE.length;
          const nextItem = TILE_SEQUENCE[nextSeqIdx];
          cell.type = nextItem.type; cell.rot = nextItem.rot; if (nextItem.val) cell.val = nextItem.val;

          if (cell.type !== TYPE_CRYSTAL) { const c = tile.querySelector('.crystal-3d'); if (c) c.remove(); }
          if (cell.type === TYPE_CRYSTAL && !tile.querySelector('.crystal-3d')) {
            const c = document.createElement("div"); c.className = "crystal-3d";
            const core = document.createElement("div"); core.className = "core"; c.appendChild(core);
            tile.appendChild(c);
          }
        }
        applyTileStyle(tile, cell);
      });
    } else {
      // プレイモード
      tile.addEventListener("click", () => {
        // Tutorial Guide 消去
        const guide = tile.querySelector('.tutorial-guide');
        if (guide) guide.remove();

        if (!isBallMoving && cellData.type === TYPE_START) {
          spawnBall(idx, container);
        }
        else if (!isBallMoving && (
          cellData.type === TYPE_SWITCH_ARROW ||
          cellData.type === TYPE_TURN_VAR
        )) {
          cellData.rot = (cellData.rot + 1) % 4;
          applyTileStyle(tile, cellData);
          playSe('change1');
        }
      });
    }
    container.appendChild(tile);
  });
}

function applyTileStyle(el, data) {
  el.dataset.type = data.type;
  el.style.setProperty('--r', `${data.rot * 90}deg`);

  // トグルスイッチは回転させない（常に上向き）
  if (data.type === TYPE_TOGGLE_SWITCH) {
    el.style.setProperty('--r', '0deg');
  }

  if (data.val) el.dataset.val = data.val;

  el.classList.remove("rainbow-effect");
  el.classList.remove("flash-white");
  el.classList.remove("off");
  el.classList.remove("toggle-blue");

  // トグル(赤青)の状態反映
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


// 2. タイルクリック時の挙動 (Uターンの切り替えロジックを修正)
function handleTileInteraction(idx) {
  if (!isEditorMode) return;
  const cell = currentLevel.data[idx];

  // ★ Uターン系タイルの切り替えロジック (全方向 ⇔ 一方通行4方向 のサイクル)
  if ((cell.type === TYPE_U_TURN || cell.type === TYPE_ONE_WAY_U_TURN) && 
      (currentTileType === TYPE_U_TURN || currentTileType === TYPE_ONE_WAY_U_TURN)) {
    
    if (cell.type === TYPE_U_TURN) {
      // 全方向(8) -> 上向き一方通行(19, rot=0)
      cell.type = TYPE_ONE_WAY_U_TURN;
      cell.rot = 0;
    } else {
      // 一方通行(19) -> 回転 -> 全方向に戻る
      // 0(上) -> 1(右) -> 2(下) -> 3(左) -> 全方向
      if (cell.rot < 3) {
        cell.rot++;
      } else {
        cell.type = TYPE_U_TURN;
        cell.rot = 0;
      }
    }
  } 
  // 通常の同種タイルクリック (回転や値変更)
  else if (cell.type === currentTileType) {
    if ([
      TYPE_START, TYPE_GOAL,
      TYPE_SWITCH_ARROW, TYPE_FIXED_ARROW,
      TYPE_TURN_VAR, TYPE_TURN_FIX, 
      TYPE_TOGGLE_ARROW_FIX
      // Uターン系は上のロジックで処理するのでここには含めない
    ].includes(cell.type)) {
      cell.rot = (cell.rot + 1) % 4;
    } else if (currentTileType === TYPE_GLASS) {
      cell.val = (cell.val % 5) + 1;
    } else if (currentTileType === TYPE_JUMP) {
      cell.val = (cell.val % 3) + 1;
    } else if ([TYPE_WARP, TYPE_SWITCH, TYPE_BLOCK, TYPE_BLOCK_OFF].includes(currentTileType)) {
      cell.val = (cell.val % 7) + 1;
    }
  } 
  // 異なるタイルの配置
  else {
    // クリスタル削除
    if (cell.type === TYPE_CRYSTAL) {
      const c = editorGrid.children[idx].querySelector('.crystal-3d');
      if (c) c.remove();
    }

    // 新しいタイプをセット
    cell.type = currentTileType;
    cell.rot = 0;
    
    // 値の初期化
    if (currentTileType === TYPE_GLASS || currentTileType === TYPE_JUMP || 
        [TYPE_SWITCH, TYPE_BLOCK, TYPE_BLOCK_OFF, TYPE_WARP].includes(currentTileType)) {
      cell.val = 1;
    }
    
    // Uターン系の場合、パレットで何を選んでいても最初は「全方向(Type 8)」にする
    if (cell.type === TYPE_ONE_WAY_U_TURN) {
      cell.type = TYPE_U_TURN;
    }

    // クリスタル追加
    if (cell.type === TYPE_CRYSTAL) {
      const c = document.createElement("div"); c.className = "crystal-3d";
      const core = document.createElement("div"); core.className = "core"; c.appendChild(core);
      editorGrid.children[idx].appendChild(c);
    }
  }
  
  currentLevel.data[idx] = cell;
  applyTileStyle(editorGrid.children[idx], cell);
}


// --- Test Play Mode ---
function startTestPlayMode() {
  originalLevelData = JSON.parse(JSON.stringify(currentLevel.data));
  resetGameState();
  isEditorMode = false;
  isRealPlay = false;
  editorPalette.style.display = "none";
  document.querySelector(".editor-bottom-actions").style.display = "none";
  testPlayUI.classList.remove("hidden");
  renderGrid(editorGrid);
}

function stopTestPlayMode() {
  if (ballEl) { gsap.killTweensOf(ballEl); ballEl.remove(); ballEl = null; }
  isBallMoving = false;

  if (originalLevelData) {
    currentLevel.data = JSON.parse(JSON.stringify(originalLevelData));
    originalLevelData = null;
  }

  isEditorMode = true;
  isMouseDown = false;

  editorPalette.style.display = "flex";
  document.querySelector(".editor-bottom-actions").style.display = "flex";
  testPlayUI.classList.add("hidden");

  renderGrid(editorGrid);
}
function startRealPlay(levelId, isOfficial = false, isFanmade = false) {
  if (levelId) {
    const levels = getSavedLevels();
    currentLevel = levels.find(l => l.id === levelId);
  }

  if (!currentLevel || !currentLevel.data) return;

  originalLevelData = JSON.parse(JSON.stringify(currentLevel.data));
  isEditorMode = false; 
  isRealPlay = true; 
  isOfficialPlay = isOfficial;
  isFanmadePlay = isFanmade; // フラグ保存
  isBallMoving = false;
  resetGameState();

  // ヒントボタン
  if (currentLevel.hints && currentLevel.hints.length > 0) {
    btnPlayHint.classList.remove("hidden");
  } else {
    btnPlayHint.classList.add("hidden");
  }

  showLoading(() => {
    // 1. テキストセット
    playIntroTitle.textContent = currentLevel.name;
    document.getElementById("playIntroSub").textContent = currentLevel.sub || "";
    document.getElementById("playIntroAuthor").textContent = currentLevel.author || "名無し";
    playTimerVal.textContent = "00:00:00";
    clearOverlay.classList.add("hidden");
    clearOverlay.classList.remove("active");

    // 2. 演出
    const bgTheme = currentLevel.bgTheme || (currentLevel._isEx ? "space" : "warm");
    const bgmTheme = currentLevel.bgmTheme || (currentLevel._isEx ? "vertex" : "warm");
    setStageTheme(bgTheme);
    playStageBgm(bgmTheme);

    // 3. ボタンイベント再登録 (戻るボタンの分岐を追加)
    const btnBack = document.getElementById("btnPlayBack");
    const btnRetry = document.getElementById("btnPlayRetry");

    btnBack.replaceWith(btnBack.cloneNode(true)); 
    btnRetry.replaceWith(btnRetry.cloneNode(true));

    document.getElementById("btnPlayBack").addEventListener("click", () => {
      playChin();
      stopPlayTimer();
      stopPlayMode();
      
      // 分岐処理
      if (isOfficialPlay) showScreen("officialSelect");
      else if (isFanmadePlay) showScreen("fanmadeSelect"); // 追加: ファンメイド画面へ
      else showScreen("editorSelect");
    });

    document.getElementById("btnPlayRetry").addEventListener("click", () => {
      playChin();
      retryRealPlay();
    });

    // 4. グリッド描画
    renderGrid(playGrid);
    if (isOfficial) {
      showTutorialGuide(playGrid, currentLevel._officialIndex);
    }

    // 5. 画面表示
    showScreen("play");
    requestAnimationFrame(fitVisibleGrids);

    // 6. アニメーション
    const introEl = document.getElementById("playIntro");
    const introChildren = introEl.querySelectorAll("h1, p");
    const timerArea = document.querySelector(".play-timer-area");

    gsap.killTweensOf([introEl, introChildren, timerArea]);
    gsap.set(introEl, { top: "50%", yPercent: -50, opacity: 1 });
    gsap.set(introChildren, { y: 30, opacity: 0 });
    gsap.set(timerArea, { opacity: 0 });

    const isCompactUI = window.innerWidth < 768 || window.innerHeight < 600;
    const targetTop = isCompactUI ? "120px" : "80px";

    const tl = gsap.timeline();
    tl.to(introChildren, {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out"
    })
    .to(introEl, {
      top: targetTop, yPercent: 0, duration: 1.2, ease: "power3.inOut", delay: 1.0 
    })
    .to(timerArea, {
      opacity: 1, duration: 0.5
    }, "-=0.5");

    levelSessionStartTime = Date.now();
    startPlayTimer();
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
function stopPlayMode() {
  // 演出リセット
  setStageTheme("warm");
  playStageBgm("warm");
  stopCameraFloat();
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
  if (stageIndex === 0) {
    targetIdx = currentLevel.data.findIndex(c => c.type === TYPE_START);
    text = "ここをクリック！";
  } else if (stageIndex === 1) {
    targetIdx = currentLevel.data.findIndex(c => c.type === TYPE_SWITCH_ARROW);
    text = "ここをクリックして方向を変えよう！";
  }
  if (targetIdx === -1) return;
  const tile = container.children[targetIdx];
  if (tile) {
    const guide = document.createElement("div");
    guide.className = "tutorial-guide";
    guide.textContent = text;
    tile.appendChild(guide);
  }
}

function retryRealPlay() {
  if (ballEl) {
    gsap.killTweensOf(ballEl);
    ballEl.remove();
    ballEl = null;
  }
  isBallMoving = false;
  const isClearActive = clearOverlay.classList.contains("active");
  clearOverlay.classList.remove("active");
  const delay = isClearActive ? 500 : 50;

  setTimeout(() => {
    clearOverlay.classList.add("hidden");
    if (originalLevelData) {
      currentLevel.data = JSON.parse(JSON.stringify(originalLevelData));
    }
    resetGameState();
    renderGrid(playGrid);
    if (isOfficialPlay) {
      showTutorialGuide(playGrid, currentLevel._officialIndex);
    }
    startPlayTimer();
  }, delay);
}


// --- タイマー更新 ---
function startPlayTimer() {
  if (playTimerId) clearInterval(playTimerId);
  playTimerId = setInterval(() => {
    // 現在時刻との差分を計算
    const diff = Math.floor((Date.now() - levelSessionStartTime) / 1000);
    // 負の値にならないようガード
    const safeDiff = Math.max(0, diff);
    
    const h = Math.floor(safeDiff / 3600).toString().padStart(2, '0');
    const m = Math.floor((safeDiff % 3600) / 60).toString().padStart(2, '0');
    const s = (safeDiff % 60).toString().padStart(2, '0');
    playTimerVal.textContent = `${h}:${m}:${s}`;
  }, 1000);
}
function stopPlayTimer() { if (playTimerId) clearInterval(playTimerId); playTimerId = null; }

function resetGameState() {
  gameState = {
    crystalsCollected: 0,
    totalCrystals: 0,
    switchStates: [false, false, false, false, false, false, false, false],
    toggleState: false
  };
  if (currentLevel && currentLevel.data) {
    currentLevel.data.forEach(c => {
      if (c.type === TYPE_CRYSTAL) gameState.totalCrystals++;
    });
  }
}

// --- Game Logic ---

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
  if (isBallMoving) return;
  isBallMoving = true;
  const size = currentLevel.size; const x = idx % size; const y = Math.floor(idx / size);
  if (ballEl) ballEl.remove(); ballEl = document.createElement("div"); ballEl.className = "ball"; container.appendChild(ballEl);
  const pos = getPixelPos(x, y); ballPos = { x, y };
  gsap.set(ballEl, { left: pos.left, top: pos.top, z: 400, rotationX: -45, rotationZ: -45, opacity: 0, scale: 0.5 });
  const startCell = currentLevel.data[idx];
  gsap.to(ballEl, {
    z: 15, opacity: 1, scale: 1, duration: 1.0, ease: "bounce.out",
    onComplete: () => { setTimeout(() => { moveBall(startCell.rot, container); }, 100); }
  });
}

function moveBall(direction, container) {
  if (isEditorMode || !ballEl) return;

  const dx = [0, 1, 0, -1]; const dy = [-1, 0, 1, 0];
  const size = currentLevel.size;
  const currentIdx = ballPos.y * size + ballPos.x;
  const currentCell = currentLevel.data[currentIdx];
  let distance = 1;
  let isJump = false;

  if (currentCell.type === TYPE_JUMP) {
    distance = (currentCell.val || 1) + 1;
    isJump = true;
  }

  const nextX = ballPos.x + dx[direction] * distance;
  const nextY = ballPos.y + dy[direction] * distance;

  if (nextX < 0 || nextX >= size || nextY < 0 || nextY >= size) {
    fallBall(direction, isJump ? distance : 1.5, container);
    return;
  }

  const nextIdx = nextY * size + nextX;
  const nextCell = currentLevel.data[nextIdx];
  const targetPos = getPixelPos(nextX, nextY);

  if (isJump) {
    gsap.to(ballEl, { left: targetPos.left, top: targetPos.top, duration: 0.8, ease: "power1.inOut" });
    gsap.to(ballEl, { z: 120, duration: 0.4, ease: "power2.out", yoyo: true, repeat: 1 });
    gsap.delayedCall(0.8, () => onMoveComplete(nextX, nextY, nextIdx, nextCell, direction, container));
  } else {
    gsap.to(ballEl, {
      left: targetPos.left, top: targetPos.top, duration: 0.15, ease: "none",
      onComplete: () => onMoveComplete(nextX, nextY, nextIdx, nextCell, direction, container)
    });
  }
}

function onMoveComplete(nextX, nextY, nextIdx, nextCell, direction, container) {
  ballPos = { x: nextX, y: nextY };
  if (isEditorMode || !ballEl) return;

  if (nextCell.type === TYPE_VOID) { fallBall(direction, 1.5, container); return; }

  let isHole = false;
  if (nextCell.type === TYPE_BLOCK) {
    if (gameState.switchStates[nextCell.val]) isHole = true;
  } else if (nextCell.type === TYPE_BLOCK_OFF) {
    if (!gameState.switchStates[nextCell.val]) isHole = true;
  }

  if (isHole) { fallBall(direction, 1.5, container); return; }

  if (nextCell.type === TYPE_CRYSTAL) {
    gameState.crystalsCollected++;
    nextCell.type = TYPE_NORMAL;
    const tileEl = container.children[nextIdx];
    if (tileEl) {
      tileEl.dataset.type = TYPE_NORMAL;
      const c = tileEl.querySelector('.crystal-3d');
      if (c) c.remove();
    }
    spawnParticles(nextX, nextY, container);
    playSe('change1');

    const goalIdx = currentLevel.data.findIndex(d => d.type === TYPE_GOAL);
    if (goalIdx !== -1) {
      const goalEl = container.children[goalIdx];
      if (gameState.crystalsCollected >= gameState.totalCrystals) {
        goalEl.classList.remove("inactive");
      }
    }
  }

  if (nextCell.type === TYPE_GLASS) {
    nextCell.val--;
    const tileEl = container.children[nextIdx];
    if (tileEl) tileEl.dataset.val = nextCell.val;
    if (nextCell.val <= 0) {
      playSe('break');
      nextCell.type = TYPE_VOID;
      if (tileEl) { tileEl.dataset.type = TYPE_VOID; tileEl.innerHTML = ""; tileEl.className = "tile"; }
      spawnParticles(nextX, nextY, container);
    }
  }

  if (nextCell.type === TYPE_SWITCH) {
    playSe('push');
    const color = nextCell.val;
    gameState.switchStates[color] = !gameState.switchStates[color];
    const tileEl = container.children[nextIdx];
    if (tileEl) tileEl.classList.add("active"); setTimeout(() => tileEl?.classList.remove("active"), 200);
    updateBlocksVisual(container);
  }

  if (nextCell.type === TYPE_TOGGLE_SWITCH) {
    playSe('push');
    gameState.toggleState = !gameState.toggleState;
    const tileEl = container.children[nextIdx];
    if (tileEl) {
      tileEl.classList.add("active");
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
    // クラスタロジックは維持、または簡易ワープ実装でも可だが元のロジックを尊重
    const localCluster = getWarpCluster(nextIdx, currentLevel.data, currentLevel.size);
    const allSameColorWarps = [];
    currentLevel.data.forEach((c, i) => {
      if (c.type === TYPE_WARP && c.val === color) {
        allSameColorWarps.push(i);
      }
    });

    let targetIdx = -1;
    const currentArrIdx = allSameColorWarps.indexOf(nextIdx);
    const count = allSameColorWarps.length;

    if (count > 1) {
      for (let i = 1; i < count; i++) {
        const checkIdx = (currentArrIdx + i) % count; 
        const candidateGridIdx = allSameColorWarps[checkIdx];
        if (!localCluster.has(candidateGridIdx)) {
          targetIdx = candidateGridIdx;
          break;
        }
      }
      if (targetIdx === -1 && count === 2) {
        targetIdx = allSameColorWarps[(currentArrIdx + 1) % 2];
      }
    }
    if (targetIdx !== -1) {
      gsap.to(ballEl, { z: -50, scale: 0, duration: 0.3, ease: "back.in(1.7)" });
      const size = currentLevel.size;
      const targetX = targetIdx % size;
      const targetY = Math.floor(targetIdx / size);
      const targetPos = getPixelPos(targetX, targetY);

      setTimeout(() => {
        ballPos = { x: targetX, y: targetY };
        gsap.set(ballEl, { left: targetPos.left, top: targetPos.top });
        gsap.to(ballEl, { z: 15, scale: 1, duration: 0.4, ease: "back.out(1.7)" });
        setTimeout(() => { moveBall(direction, container); }, 500);
      }, 350);
      return;
    }
  }

  let nextDir = direction;
  let changed = false;

  if (nextCell.type === TYPE_TOGGLE_ARROW_FIX) {
    let targetDir = nextCell.rot; 
    if (gameState.toggleState) {
      targetDir = (targetDir + 2) % 4;
    }
    if (direction !== targetDir) {
      nextDir = targetDir;
      changed = true;
    }
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
    nextDir = (direction + 2) % 4;
    changed = true;
  }
  else if (nextCell.type === TYPE_ONE_WAY_U_TURN) {
    // ★一方通行Uターン実装
    if (direction === nextCell.rot) {
      nextDir = (direction + 2) % 4;
      changed = true;
    }
    // それ以外は直進
  }

  if (changed) { spawnParticles(nextX, nextY, container); playSe('change0'); }
  moveBall(nextDir, container);
}

function updateBlocksVisual(container) {
  const size = currentLevel.size;
  for (let i = 0; i < size * size; i++) {
    const cell = currentLevel.data[i];
    const el = container.children[i];
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

function fallBall(direction, speedScale, container) {
  if (!ballEl) return;
  playSe('died');

  const dx = [0, 1, 0, -1]; const dy = [-1, 0, 1, 0];
  const tx = (direction !== undefined) ? dx[direction] * 30 : 0; 
  const ty = (direction !== undefined) ? dy[direction] * 30 : 0;

  gsap.to(ballEl, { left: `+=${tx}`, top: `+=${ty}`, duration: 0.15, ease: "none" });
  gsap.to(ballEl, {
    z: -500, opacity: 0, rotationX: Math.random() * 720, rotationY: Math.random() * 720,
    duration: 0.3, ease: "power2.in", onComplete: () => resetBallState(container)
  });
}

function finishLevel(gx, gy, container) {
  playSe('goal');
  const finalTime = playTimerVal.textContent;
  stopPlayTimer();

  const size = currentLevel.size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.abs(x - gx) + Math.abs(y - gy);
      const idx = y * size + x;
      const tile = container.children[idx];
      if (tile) {
        setTimeout(() => {
          tile.classList.add("rainbow-effect");
          setTimeout(() => tile.classList.remove("rainbow-effect"), 500);
        }, dist * 50);
      }
    }
  }

  if (ballEl) gsap.to(ballEl, { scale: 0, opacity: 0, duration: 0.5 });
  if (isOfficialPlay && currentLevel._officialIndex !== undefined) {
    saveStageCleared(currentLevel._officialIndex, finalTime);
    lastClearedIndex = currentLevel._officialIndex;
  } 
  else if (isFanmadePlay && currentLevel._fanmadeId) {
    // ファンメイド用の保存処理
    saveFanmadeProgress(currentLevel._fanmadeId, finalTime);
  }

  setTimeout(() => {
    if (ballEl) ballEl.remove(); ballEl = null; isBallMoving = false;
    if (isRealPlay) showClearScreen();
    else resetBallState(container);
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

  if (isOfficialPlay && currentLevel && currentLevel._officialIndex !== undefined) {
    const nextIdx = currentLevel._officialIndex + 1;
    if (currentLevel._officialIndex === (MAIN_STAGE_COUNT - 1)) {
      btnClearNext.style.display = "none";
    }
    else if (nextIdx < officialLevels.length) {
      btnClearNext.style.display = "block";
    } else {
      btnClearNext.style.display = "none";
    }
  } else {
    btnClearNext.style.display = "none";
  }
}

function resetBallState(container) {
  document.body.classList.add("flash-reset");
  setTimeout(() => {
    if (ballEl) {
      gsap.killTweensOf(ballEl);
      ballEl.remove();
      ballEl = null;
    }
    isBallMoving = false;
    if (originalLevelData) {
      currentLevel.data = JSON.parse(JSON.stringify(originalLevelData));
    }
    resetGameState();
    if (originalLevelData) {
      renderGrid(container);
    }
    setTimeout(() => {
      document.body.classList.remove("flash-reset");
    }, 500);
  }, 100);
}

// --- 変更: openSettings (設定モーダルを開く) ---
function openSettings() {
  document.getElementById("editLevelName").value = currentLevel.name;
  document.getElementById("editLevelSub").value = currentLevel.sub || "";
  document.getElementById("editLevelAuthor").value = currentLevel.author || "";
  
  // ★テーマ設定反映
  document.getElementById("editBgTheme").value = currentLevel.bgTheme || "warm";
  document.getElementById("editBgmTheme").value = currentLevel.bgmTheme || "warm";

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

// 3. 設定適用時に即座に背景・音楽を反映
function applySettings(e) {
  e.preventDefault();
  currentLevel.name = document.getElementById("editLevelName").value;
  currentLevel.sub = document.getElementById("editLevelSub").value;
  currentLevel.author = document.getElementById("editLevelAuthor").value;
  
  // 設定値を取得
  currentLevel.bgTheme = document.getElementById("editBgTheme").value;
  currentLevel.bgmTheme = document.getElementById("editBgmTheme").value;

  const hintInputs = editorHintsContainer.querySelectorAll("input");
  currentLevel.hints = Array.from(hintInputs).map(inp => inp.value).filter(v => v.trim() !== "");

  document.getElementById("editorLevelTitle").textContent = currentLevel.name;
  saveCurrentLevel();
  
  // ★ ここを追加: 設定したテーマと音楽を即座に反映
  setStageTheme(currentLevel.bgTheme);
  playStageBgm(currentLevel.bgmTheme);
  
  settingsModal.close();
}

function saveCurrentLevel() {
  if (!currentLevel) return;
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

// --- FANMADE 初期化 (init関数内で呼ぶ) ---
function initFanmadeFeatures() {
  // 特にイベントリスナー等は不要
}
// init() 末尾で実行
initFanmadeFeatures();


// --- FANMADE レベル読み込み (連番方式) ---
window.loadFanmadeLevels = async function() {
  const container = document.getElementById("fanmadeLevelList");
  if(container) container.innerHTML = `<div style="padding:20px; text-align:center; color:#a29bfe;">Searching archives...</div>`;

  fanmadeLevels = [];
  
  let i = 0;
  while (true) {
    try {
      // 連番でファイルをリクエスト (キャッシュ回避のためタイムスタンプ付与推奨だが、開発中はなくても良い)
      // ここでは level_fanmade_0.json, level_fanmade_1.json ... を探します
      const res = await fetch(`./fanmade_levels/level_fanmade_${i}.json`);
      
      // ファイルが見つからなければループ終了
      if (!res.ok) break;
      
      const data = await res.json();
      
      // メタデータ付与
      data._fanmadeId = `fan_${i}`;
      data._isStatic = true;
      
      fanmadeLevels.push(data);
      i++;
    } catch (e) {
      // JSONパースエラーなどが起きても、次の連番はないとみなして終了
      console.warn(`Stopped loading fanmade levels at index ${i}`);
      break;
    }
  }
  
  renderFanmadeList();
}
function getFanmadeProgress() {
  const val = localStorage.getItem(FANMADE_PROGRESS_KEY);
  if (!val) return {};
  try { return JSON.parse(val); } catch (e) { return {}; }
}

function saveFanmadeProgress(id, timeStr) {
  const progress = getFanmadeProgress();
  // 既にクリア済みで、かつ今回の方が遅ければ更新しない（ベストタイム更新なら上書き、などのロジックはお好みで。今回は単に上書きします）
  progress[id] = { time: timeStr, clearedAt: Date.now() };
  localStorage.setItem(FANMADE_PROGRESS_KEY, JSON.stringify(progress));
}

function renderFanmadeList() {
  const container = document.getElementById("fanmadeLevelList");
  if (!container) return;
  container.innerHTML = "";

  // ★進捗データを取得
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
    // ★クリア状況確認
    const clearData = progress[level._fanmadeId];
    const isCleared = !!clearData;

    const item = document.createElement("div");
    item.className = "level-item official fanmade"; 
    
    // ★クリア済みならアニメーション待機用の dataset をセット
    if (isCleared) {
      item.dataset.isClearedEntry = "true";
    }

    // ★クリアタイムのHTML生成
    const timeHtml = isCleared ? `<div class="clear-time-info">{${clearData.time}} Clear</div>` : "";

    // ★サブタイトル(level.sub)を表示に追加
    item.innerHTML = `
      <h4>No.${idx + 1}</h4>
      <div class="sub-title">${escapeHtml(level.name)}</div>
      <!-- サブタイトルがあれば表示 -->
      ${level.sub ? `<div style="font-size:12px; color:#aaa; margin-bottom:4px;">${escapeHtml(level.sub)}</div>` : ""}
      <div class="author-name">by ${escapeHtml(level.author || "Unknown")}</div>
      ${timeHtml}
    `;

    item.addEventListener("click", () => {
      playChin();
      currentLevel = JSON.parse(JSON.stringify(level));
      levelSessionStartTime = Date.now();
      startRealPlay(null, false, true); 
    });

    container.appendChild(item);
  });

  // ★クリア演出のアニメーション適用 (公式レベルと同じロジック)
  setTimeout(() => {
    const items = Array.from(container.querySelectorAll(".level-item"));
    const clearedItems = items.filter(el => el.dataset.isClearedEntry === "true");
    
    clearedItems.forEach((el, i) => {
      // 即座にクラスをつけても良いが、パラパラめくれる演出を入れる
      setTimeout(() => {
        el.classList.add("flip-reveal"); // 回転アニメ
        setTimeout(() => {
          el.classList.add("cleared"); // 色変化
        }, 350); 
      }, i * 50); 
    });
  }, 100); 
}
init();