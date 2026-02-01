/* editor.js */
import { showScreen, showLoading, playChin, audioSettings, playStageBgm, setStageTheme } from './main.js';

const MAX_LEVELS = 10;
const STORAGE_KEY = '3d_arrow_ball_levels';
const OFFICIAL_PROGRESS_KEY = '3d_arrow_ball_progress';
const MAIN_STAGE_COUNT = 30; // 0 to 29
const EX_UNLOCKED_KEY = '3d_arrow_ball_ex_unlocked';
const FANMADE_PROGRESS_KEY = '3d_arrow_ball_fanmade_progress';
const DLC_UNLOCKED_KEY = '3d_arrow_ball_dlc_unlocked';

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
const TYPE_WOODEN_BOX = 20;
const TYPE_ROTATING_ARROW_CW_VAR = 21;  // 時計回り・可変
const TYPE_ROTATING_ARROW_CCW_VAR = 22; // 反時計・可変
const TYPE_ROTATING_ARROW_CW_FIX = 23;  // 時計回り・固定
const TYPE_ROTATING_ARROW_CCW_FIX = 24; // 反時計・固定
const TYPE_IGNITE = 25;
const TYPE_EXTINGUISH = 26;
const TYPE_FIRE_GATE = 27;

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
  TYPE_WOODEN_BOX,               // 20
  TYPE_ROTATING_ARROW_CW_VAR,    // 21
  TYPE_ROTATING_ARROW_CCW_VAR,   // 22
  TYPE_ROTATING_ARROW_CW_FIX,    // 23
  TYPE_ROTATING_ARROW_CCW_FIX,   // 24
  TYPE_IGNITE,                   // 25
  TYPE_EXTINGUISH,               // 26
  TYPE_FIRE_GATE                 // 27
];
const DLC_BG_THEMES = ['burning', 'underwater'];
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
  ignite: document.getElementById("seIgnite"),      // 追加
  digestion: document.getElementById("seDigestion") // 追加
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
let lastTrailPos = { x: 0, y: 0 };
let trailHue = 0;

// Variables セクションに以下を追加してください
let isReplayMode = false;
let replaySpeed = 1.0;
let lastAttemptData = null; // ボール発射直前の盤面データ（リプレイ用）
let replayTimerId = null; // リプレイ中の自動停止監視用など（必要であれば）
// 裏技キー判定
const cheatKeys = { Shift: false, e: false, x: false, d: false, c: false };

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
      if (mutation.target.id === 'officialSelectScreen' &&
        mutation.target.classList.contains('screen--active')) {
        renderOfficialList();
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

  // ★修正: パレットアイテムのイベント登録とロック表示
  paletteItems.forEach(btn => {
    const type = parseInt(btn.dataset.type);

    // DLC未開放かつ対象タイルの場合、見た目をロック状態にする
    if (DLC_TILES.includes(type) && !isDlcUnlocked()) {
      btn.classList.add("locked");
      // アイコンとテキストを「???」に変更
      btn.innerHTML = `<div class="preview-tile" style="background:#333; color:#777; border:1px solid #555; display:grid; place-items:center;">🔒</div><span style="color:#777;">???</span>`;
      btn.title = "Locked Content (DLC)";
    }

    btn.addEventListener("click", () => {
      // ★追加: ロックされている場合は選択不可＆アラート
      if (btn.classList.contains("locked")) {
        playSe("died");
        alert("このタイルを使用するにはDLCの開放が必要です。");
        return;
      }

      paletteItems.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTileType = parseInt(btn.dataset.type);
      if (currentTileType === TYPE_ONE_WAY_U_TURN) {
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

  btnPlayHint.addEventListener("click", () => {
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
    stopPlayMode();
    if (isOfficialPlay) showScreen("officialSelect");
    else if (isFanmadePlay) showScreen("fanmadeSelect");
    else showScreen("editorSelect");
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
      if (confirm("本当にメインステージの進行データを削除しますか？\n（クリア状況・EX/DLC開放状態がリセットされます）")) {
        playChin();
        localStorage.removeItem(OFFICIAL_PROGRESS_KEY);
        localStorage.removeItem(EX_UNLOCKED_KEY);
        localStorage.removeItem(DLC_UNLOCKED_KEY);
        loadOfficialLevels();
        // パレットの状態等を更新するためにリロード推奨
        setTimeout(() => location.reload(), 500);
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Shift") cheatKeys.Shift = true;
    if (e.key.toLowerCase() === "e") cheatKeys.e = true;
    if (e.key.toLowerCase() === "x") cheatKeys.x = true;
    if (e.key.toLowerCase() === "d") cheatKeys.d = true;
    if (e.key.toLowerCase() === "c") cheatKeys.c = true;

    if (cheatKeys.Shift && cheatKeys.e && cheatKeys.x) {
      cheatKeys.e = false;
      cheatKeys.x = false;
      const screen = document.getElementById('officialSelectScreen');
      if (screen && screen.classList.contains('screen--active')) {
        localStorage.setItem(EX_UNLOCKED_KEY, 'true');
        loadOfficialLevels();
        playSe('exSpawn');
        alert("裏技発動！\nEXモードを開放しました。");
      }
    }
    // DLC開放裏技
    if (cheatKeys.Shift && cheatKeys.d && cheatKeys.c) {
      cheatKeys.d = false;
      cheatKeys.c = false;
      const screen = document.getElementById('officialSelectScreen');
      if (screen && screen.classList.contains('screen--active')) {
        localStorage.setItem(DLC_UNLOCKED_KEY, 'true');
        loadOfficialLevels();
        playSe('exSpawn');
        alert("裏技発動！\nDLCモードを開放しました。\n（反映のためリロードします）");
        location.reload();
      }
    }
  });

  initReplaySystem();
}

// init関数内で呼ばれるヘルパー関数
function initReplaySystem() {
  // 既存のCSSがあれば削除（重複防止）
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

    /* ★追加: グラデーションボタン用スタイル */
    .btn-grad-next {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: #fff;
      border: 1px solid #38ef7d;
      box-shadow: 0 4px 15px rgba(56, 239, 125, 0.4);
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .btn-grad-next:hover {
      background: linear-gradient(135deg, #15ac9f 0%, #4aff8f 100%);
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 6px 20px rgba(56, 239, 125, 0.6);
    }

    .btn-grad-replay {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border: 1px solid #764ba2;
      box-shadow: 0 4px 15px rgba(118, 75, 162, 0.4);
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .btn-grad-replay:hover {
      background: linear-gradient(135deg, #7a92ff 0%, #8e5ac2 100%);
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 6px 20px rgba(118, 75, 162, 0.6);
    }
  `;
  document.head.appendChild(style);

  // 既存の要素があれば削除（重複防止）
  const oldDiv = document.getElementById('replayControls');
  if (oldDiv) oldDiv.remove();

  // HTML生成
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

  // イベント登録
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
// ▼▼▼ リスト内ローディング表示関数（変更なしですが確認用） ▼▼▼
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
      // 0～100の範囲に収めて表示
      if (textEl) textEl.textContent = `${Math.min(100, Math.floor(percent))}%`;
      if (subEl && subText) subEl.textContent = subText;
    },
    finish: () => {
      wrapper.remove();
    }
  };
}
window.loadOfficialLevels = async function () {
  officialLevels = [];
  officialLevelsLoaded = false;

  const container = document.getElementById("officialLevelList");
  let loader = null;
  if (container) {
    loader = showListLoading(container, "Scanning Main Levels...");
  }

  const ESTIMATED_TOTAL = 50;
  let loadedCount = 0;

  // 1. メインステージ
  let i = 0;
  while (true) {
    try {
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
      const res = await fetch(`./main_levels/level_stage_${i}.json`);
      if (!res.ok) break;
      const data = await res.json();
      data._officialIndex = i;
      data._isEx = false;
      officialLevels.push(data);
      i++;
      loadedCount++;
      if (loader) loader.update((loadedCount / ESTIMATED_TOTAL) * 100, `Loading Stage ${i}...`);
    } catch (e) { break; }
  }

  // 2. EXステージ
  let j = 0;
  while (true) {
    try {
      const res = await fetch(`./main_levels/level_ex_${j}.json`);
      if (!res.ok) break;
      const data = await res.json();
      data._officialIndex = i + j;
      data._isEx = true;
      officialLevels.push(data);
      j++;
      loadedCount++;
      if (loader) loader.update((loadedCount / ESTIMATED_TOTAL) * 100, `Loading Extra ${j}...`);
    } catch (e) { break; }
  }

  // 3. DLCステージ (アンロック済みの場合のみ)
  const isDlcUnlocked = localStorage.getItem(DLC_UNLOCKED_KEY) === 'true';
  if (isDlcUnlocked) {
    let k = 0;
    while (true) {
      try {
        const res = await fetch(`./dlc_levels/level_dlc_${k}.json`);
        if (!res.ok) break;
        const data = await res.json();
        data._officialIndex = i + j + k;
        data._isDlc = true;
        data._dlcNum = k + 1;
        officialLevels.push(data);
        k++;
        loadedCount++;
        if (loader) loader.update((loadedCount / ESTIMATED_TOTAL) * 100, `Loading DLC ${k}...`);
      } catch (e) { break; }
    }
  }

  if (loader) loader.update(100, "Done!");
  officialLevelsLoaded = true;

  // 読み込み完了後にリストを描画
  setTimeout(() => {
    renderOfficialList();
  }, 200);
};

// 内部での呼び出し互換用
const loadOfficialLevels = window.loadOfficialLevels;



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
  const hasDlcUnlocked = isDlcUnlocked();

  let isAllMainCleared = true;
  for (let i = 0; i < MAIN_STAGE_COUNT; i++) {
    if (!clearedStages[i]) {
      isAllMainCleared = false;
      break;
    }
  }

  if (isAllMainCleared && !isExUnlocked) {
    triggerAllClearSequence();
    return;
  }

  officialLevels.forEach((level, idx) => {
    if (level._isEx && !isExUnlocked) return;
    if (level._isDlc && !hasDlcUnlocked) return;
    const item = document.createElement("div");
    item.className = "level-item official";

    if (level._isEx) item.classList.add("ex");
    if (level._isDlc) item.classList.add("dlc");

    const clearData = clearedStages[idx];
    const isCleared = !!clearData;

    let isUnlocked = (idx <= maxCleared + 1);
    if (level._isEx) isUnlocked = isExUnlocked;
    if (level._isDlc) isUnlocked = true;

    if (!isUnlocked) item.classList.add("locked");

    let stageLabel = `STAGE ${level._officialIndex}`;
    if (level._isEx) {
      stageLabel = `EXTRA ${level._officialIndex - MAIN_STAGE_COUNT}`;
    } else if (level._isDlc) {
      stageLabel = `DLC ${level._dlcNum}`;
    }

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
      else if (!level._isEx && !level._isDlc) {
        pendingSkipLevelIndex = idx;
        skipWarningModal.showModal();
      }
    });

    officialListContainer.appendChild(item);

    if (isCleared) item.dataset.isClearedEntry = "true";
  });

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


  // ▼▼▼ シークレットコード入力欄 (修正版) ▼▼▼
  // ※ false 条件により生成をスキップします
  if (false && !isDlcUnlocked) {
    const codeContainer = document.createElement("div");
    codeContainer.className = "secret-code-area";

    codeContainer.innerHTML = `
      <div class="secret-input-wrapper">
        <input type="text" id="secretCodeInput" placeholder="Enter Code..." autocomplete="off">
        <button id="btnSecretCode" class="btn primary small">UNLOCK</button>
      </div>
    `;
    officialListContainer.appendChild(codeContainer);

    // イベントバインド
    const btn = document.getElementById("btnSecretCode");
    const inp = document.getElementById("secretCodeInput");
    const wrapper = codeContainer.querySelector(".secret-input-wrapper");

    if (btn && inp) {
      // 連打防止用フラグ
      let isProcessing = false;

      const checkCode = () => {
        if (isProcessing) return; // 処理中なら何もしない
        isProcessing = true;

        // UIを一時的に無効化
        btn.disabled = true;
        inp.disabled = true;

        const val = inp.value.trim().toLowerCase();

        if (val === "newgame") {
          // ★成功時
          playChin();
          playSe("exSpawn");

          // アラート削除: ボタンの見た目を変えて成功を通知
          btn.textContent = "SUCCESS!";
          btn.classList.remove("primary");
          btn.style.backgroundColor = "#2ed573"; // 緑色など

          localStorage.setItem(DLC_UNLOCKED_KEY, 'true');

          // 少し待ってからリロードしてリスト更新（レベル複製防止）
          setTimeout(() => {
            loadOfficialLevels();
            // 画面が再描画されるので isProcessing を戻す必要はない
          }, 800);
        } else {
          // ★失敗時
          playSe("died");
          wrapper.classList.add("input-error");

          // 入力をクリアして復帰
          inp.value = "";
          setTimeout(() => {
            wrapper.classList.remove("input-error");
            // 入力可能に戻す
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
/* editor.js */
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
        else if (cell.type === TYPE_WOODEN_BOX) cell.val = Math.max(1, Math.min(5, (cell.val || 1) + dir));
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

          // ★修正: DLC未開放時はDLCタイルをスキップするループ処理を追加
          let nextSeqIdx = currentSeqIdx;
          const len = TILE_SEQUENCE.length;
          
          for (let i = 0; i < len; i++) {
             nextSeqIdx = (nextSeqIdx + dir + len) % len;
             const nextType = TILE_SEQUENCE[nextSeqIdx].type;
             
             // DLCタイルでない、またはDLC開放済みなら採用
             if (!DLC_TILES.includes(nextType) || isDlcUnlocked()) {
               break;
             }
             // それ以外（未開放のDLCタイル）ならスキップして次へ
          }

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
          cellData.type === TYPE_TURN_VAR ||
          // ★ついでに修正: DLCの可変矢印もプレイ中に回転できるようにする
          cellData.type === TYPE_ROTATING_ARROW_CW_VAR ||
          cellData.type === TYPE_ROTATING_ARROW_CCW_VAR
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

function handleTileInteraction(idx) {
  if (!isEditorMode) return;
  const cell = currentLevel.data[idx];

  // Uターン系タイルの切り替えロジック
  if ((cell.type === TYPE_U_TURN || cell.type === TYPE_ONE_WAY_U_TURN) &&
    (currentTileType === TYPE_U_TURN || currentTileType === TYPE_ONE_WAY_U_TURN)) {
    if (cell.type === TYPE_U_TURN) {
      cell.type = TYPE_ONE_WAY_U_TURN;
      cell.rot = 0;
    } else {
      if (cell.rot < 3) {
        cell.rot++;
      } else {
        cell.type = TYPE_U_TURN;
        cell.rot = 0;
      }
    }
  }
  // 通常の同種タイルクリック
  else if (cell.type === currentTileType) {
    if ([
      TYPE_START, TYPE_GOAL,
      TYPE_SWITCH_ARROW, TYPE_FIXED_ARROW,
      TYPE_TURN_VAR, TYPE_TURN_FIX,
      TYPE_TOGGLE_ARROW_FIX,
      TYPE_ROTATING_ARROW_CW_VAR, TYPE_ROTATING_ARROW_CCW_VAR, // 追加
      TYPE_ROTATING_ARROW_CW_FIX, TYPE_ROTATING_ARROW_CCW_FIX  // 追加
    ].includes(cell.type)) {
      cell.rot = (cell.rot + 1) % 4;
    } else if (currentTileType === TYPE_GLASS) {
      cell.val = (cell.val % 5) + 1;
    } else if (currentTileType === TYPE_WOODEN_BOX) { // 追加: 木箱の耐久値
      cell.val = (cell.val % 5) + 1;
    } else if (currentTileType === TYPE_JUMP) {
      cell.val = (cell.val % 3) + 1;
    } else if ([TYPE_WARP, TYPE_SWITCH, TYPE_BLOCK, TYPE_BLOCK_OFF].includes(currentTileType)) {
      cell.val = (cell.val % 7) + 1;
    }
  }
  // 異なるタイルの配置
  else {
    if (cell.type === TYPE_CRYSTAL) {
      const c = editorGrid.children[idx].querySelector('.crystal-3d');
      if (c) c.remove();
    }
    cell.type = currentTileType;
    cell.rot = 0;

    // 値の初期化
    if (currentTileType === TYPE_GLASS || currentTileType === TYPE_JUMP ||
      currentTileType === TYPE_WOODEN_BOX || // 追加
      [TYPE_SWITCH, TYPE_BLOCK, TYPE_BLOCK_OFF, TYPE_WARP].includes(currentTileType)) {
      cell.val = 1;
    }
    if (cell.type === TYPE_ONE_WAY_U_TURN) {
      cell.type = TYPE_U_TURN;
    }
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
  isFanmadePlay = isFanmade;
  isBallMoving = false;
  resetGameState();

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

    // 2. 演出設定 (★修正: DLCなら dlc_world テーマを適用)
    let defaultBg = "warm";
    let defaultBgm = "warm";

    if (currentLevel._isEx) {
      defaultBg = "space";
      defaultBgm = "vertex";
    } else if (currentLevel._isDlc) {
      // ★DLCレベルの場合は新テーマと新BGMをデフォルトに設定
      defaultBg = "dlc_world";
      defaultBgm = "sublime";
    }

    // 個別の指定があればそれを優先
    const bgTheme = currentLevel.bgTheme || defaultBg;
    const bgmTheme = currentLevel.bgmTheme || defaultBgm;

    // テーマ適用
    setStageTheme(bgTheme);
    playStageBgm(bgmTheme);

    // 3. ボタンイベント再登録
    const btnBack = document.getElementById("btnPlayBack");
    const btnRetry = document.getElementById("btnPlayRetry");

    btnBack.replaceWith(btnBack.cloneNode(true));
    btnRetry.replaceWith(btnRetry.cloneNode(true));

    document.getElementById("btnPlayBack").addEventListener("click", () => {
      playChin();
      stopPlayTimer();
      stopPlayMode();

      if (isOfficialPlay) showScreen("officialSelect");
      else if (isFanmadePlay) showScreen("fanmadeSelect");
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

    // UI状態リセット（リプレイUIを隠す）
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
function applyKeptTileStates(freshData, oldData) {
  if (!audioSettings.keepTileState) return;
  if (!oldData || !freshData) return;

  // ユーザーがクリックで変えられるタイルタイプ
  const variableTypes = [
    TYPE_SWITCH_ARROW,
    TYPE_TURN_VAR,
    TYPE_U_TURN,
    TYPE_ONE_WAY_U_TURN
  ];

  freshData.forEach((newCell, i) => {
    const oldCell = oldData[i];
    // 同じインデックスのタイルが、元々可変タイルだった場合
    // (エディタではないので構造が変わることはない前提)
    if (variableTypes.includes(newCell.type) && variableTypes.includes(oldCell.type)) {
      newCell.rot = oldCell.rot;
      newCell.type = oldCell.type; // Uターン(8)⇔一方通行(19)の切り替えも維持
    }
  });
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
      // ★修正: 設定がONなら状態を引き継ぐ
      const freshData = JSON.parse(JSON.stringify(originalLevelData));

      // 現在の盤面データ(currentLevel.data)から可変タイルの状態をfreshDataにコピー
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
    toggleState: false,
    isFire: false // ★追加: 炎状態フラグ
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

  // ★追加: リプレイモードでなければ、現在の盤面構成を「リプレイ用データ」として保存する
  if (!isReplayMode && !isEditorMode) {
    // 盤面データ(currentLevel.data)をディープコピーして保存
    lastAttemptData = JSON.parse(JSON.stringify(currentLevel.data));
  }

  trailHue = 0;
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

  // 炎状態のビジュアル更新
  if (gameState.isFire) {
    ballEl.classList.add("fire-mode");
    spawnFireParticles(container);
  } else {
    ballEl.classList.remove("fire-mode");
  }

  // 移動開始地点を記録
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

  // ▼▼▼ 木箱判定 (ジャンプ着地点にある場合、または通常移動時) ▼▼▼
  // ジャンプで飛び越す(distance>1)場合の中間地点判定は省略（仕様依存）
  if (nextCell.type === TYPE_WOODEN_BOX) {
    playSe('break');

    // 耐久値を減らす
    nextCell.val = (nextCell.val || 1) - 1;
    const tileEl = container.children[nextIdx];
    if (tileEl) tileEl.dataset.val = nextCell.val;

    if (nextCell.val <= 0) {
      // 破壊
      nextCell.type = TYPE_NORMAL;
      if (tileEl) {
        tileEl.dataset.type = TYPE_NORMAL;
        tileEl.innerHTML = "";
        tileEl.className = "tile";
        spawnParticles(nextX, nextY, container);
      }
    } else {
      // 衝撃エフェクト
      spawnParticles(nextX, nextY, container);
    }

    // 衝突アニメーションしてUターン
    const bounceX = gsap.getProperty(ballEl, "left") + (dx[direction] * 15);
    const bounceY = gsap.getProperty(ballEl, "top") + (dy[direction] * 15);

    gsap.to(ballEl, {
      left: bounceX, top: bounceY, duration: 0.1, yoyo: true, repeat: 1,
      onComplete: () => {
        // Uターン
        const nextDir = (direction + 2) % 4;
        moveBall(nextDir, container);
      }
    });
    return;
  }
  // ▲▲▲ 木箱判定ここまで ▲▲▲

  const updateTrail = () => {
    const curX = gsap.getProperty(ballEl, "left");
    const curY = gsap.getProperty(ballEl, "top");
    const curZ = gsap.getProperty(ballEl, "z") || 0;
    const dist = Math.hypot(curX - lastTrailPos.x, curY - lastTrailPos.y, curZ - lastTrailPos.z);
    if (dist > 5) {
      trailHue = (trailHue + 2) % 360;
      spawnTrailLine(lastTrailPos, { x: curX, y: curY, z: curZ }, trailHue, container);
      lastTrailPos = { x: curX, y: curY, z: curZ };
    }
    // 炎パーティクル
    if (gameState.isFire) spawnFireParticles(container);
  };

  if (isJump) {
    gsap.to(ballEl, {
      left: targetPos.left, top: targetPos.top,
      duration: 0.8, ease: "power1.inOut",
      onUpdate: updateTrail
    });
    gsap.to(ballEl, { z: 120, duration: 0.4, ease: "power2.out", yoyo: true, repeat: 1 });
    gsap.delayedCall(0.8, () => onMoveComplete(nextX, nextY, nextIdx, nextCell, direction, container));
  } else {
    gsap.to(ballEl, {
      left: targetPos.left, top: targetPos.top,
      duration: 0.15, ease: "none",
      onUpdate: updateTrail,
      onComplete: () => onMoveComplete(nextX, nextY, nextIdx, nextCell, direction, container)
    });
  }
}
// 引数に hue を追加
function spawnTrailLine(start, end, hue, container) {
  if (!audioSettings.showTrail) return;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;

  const distXY = Math.hypot(dx, dy);
  const len = Math.hypot(dx, dy, dz);

  const angleZ = Math.atan2(dy, dx);
  const angleY = Math.atan2(dz, distXY);

  const trail = document.createElement("div");
  trail.className = "ball-trail";
  container.appendChild(trail);

  // ▼▼▼ 色の生成 (HSLカラー) ▼▼▼
  const color = `hsl(${hue}, 100%, 60%)`; // 彩度100%, 輝度60%で鮮やかに

  // ▼▼▼ オフセット調整 (線が12pxになったので調整) ▼▼▼
  // ボール: 30px, 線: 12px -> 差分18px -> 片側9px
  const offsetX = 15; // ボールの中心X
  const offsetY = 9;  // ボールの中心Y - (線の高さ/2)

  const degZ = angleZ * 180 / Math.PI;
  const degY = -angleY * 180 / Math.PI;

  gsap.set(trail, {
    left: start.x + offsetX,
    top: start.y + offsetY,
    z: start.z,
    width: len + 2,
    rotationZ: degZ,
    rotationY: degY,

    // ★色を適用
    backgroundColor: color,
    boxShadow: `0 0 12px ${color}`, // 発光色も合わせる

    opacity: 0.8
  });

  gsap.to(trail, {
    opacity: 0,
    scaleY: 0,
    duration: 3.0,
    ease: "power2.out",
    onComplete: () => trail.remove()
  });
}
function onMoveComplete(nextX, nextY, nextIdx, nextCell, direction, container) {
  ballPos = { x: nextX, y: nextY };
  if (isEditorMode || !ballEl) return;

  if (nextCell.type === TYPE_VOID) { fallBall(direction, 1.5, container); return; }

  // 炎の門判定
  if (nextCell.type === TYPE_FIRE_GATE) {
    if (!gameState.isFire) {
      fallBall(direction, 1.5, container); // 焼死ならぬ「非焼死」
      return;
    }
  }

  // 着火・消火判定
  if (nextCell.type === TYPE_IGNITE) {
    if (!gameState.isFire) {
      playSe('ignite');
      gameState.isFire = true;
      ballEl.classList.add("fire-mode");
      // タイル発光演出
      const t = container.children[nextIdx];
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
  if (isHole) { fallBall(direction, 1.5, container); return; }

  // クリスタル等の既存処理
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
    if (tileEl) { tileEl.classList.add("active"); setTimeout(() => tileEl?.classList.remove("active"), 200); }
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
    // 既存のワープ処理
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

  // ▼▼▼ 回転矢印処理 ▼▼▼
  if (nextCell.type === TYPE_ROTATING_ARROW_CW_VAR || nextCell.type === TYPE_ROTATING_ARROW_CCW_VAR ||
    nextCell.type === TYPE_ROTATING_ARROW_CW_FIX || nextCell.type === TYPE_ROTATING_ARROW_CCW_FIX) {

    // 1. 矢印の向きに進む
    if (direction !== nextCell.rot) {
      nextDir = nextCell.rot;
      changed = true;
    }
    // 2. タイルを回転させる
    const isCW = (nextCell.type === TYPE_ROTATING_ARROW_CW_VAR || nextCell.type === TYPE_ROTATING_ARROW_CW_FIX);
    if (isCW) nextCell.rot = (nextCell.rot + 1) % 4;
    else nextCell.rot = (nextCell.rot + 3) % 4;

    // 表示更新
    const tileEl = container.children[nextIdx];
    if (tileEl) applyTileStyle(tileEl, nextCell);
  }
  // ▲▲▲ 回転矢印ここまで ▲▲▲

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
    // 回転矢印以外なら通常音
    if (nextCell.type < 21 || nextCell.type > 24) playSe('change0');
    else playSe('change1'); // 回転音
  }
  moveBall(nextDir, container);
}

/* editor.js */

// 既存の spawnFireParticles 関数を置き換え
function spawnFireParticles(container) {
  if (!ballEl) return;

  // ボールの現在の座標を取得
  const curX = gsap.getProperty(ballEl, "left");
  const curY = gsap.getProperty(ballEl, "top");
  const curZ = gsap.getProperty(ballEl, "z") || 0;

  const p = document.createElement("div");
  p.className = "fire-particle";
  container.appendChild(p);

  // ボールの中心付近から発生 (ボールサイズ30pxの半分=15pxを足す)
  // 少しランダムに散らす
  const randX = (Math.random() - 0.5) * 20;
  const randY = (Math.random() - 0.5) * 20;

  gsap.set(p, {
    left: curX + 15 + randX,
    top: curY + 15 + randY,
    z: curZ + 10, // ボールの中心より少し上
    scale: Math.random() * 0.5 + 0.5
  });

  // ★修正: Y軸(床の奥)ではなく、Z軸(空中)へ上昇させる
  gsap.to(p, {
    z: `+=${Math.random() * 40 + 20}`, // 空中へ舞い上がる
    x: `+=${(Math.random() - 0.5) * 10}`, // わずかに左右に揺らぐ
    y: `+=${(Math.random() - 0.5) * 10}`, // わずかに前後に揺らぐ
    opacity: 0,
    scale: 0,
    duration: Math.random() * 0.6 + 0.4,
    ease: "power1.out",
    onComplete: () => p.remove()
  });
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

  setTimeout(() => {
    if (ballEl) ballEl.remove(); ballEl = null; isBallMoving = false;

    if (isReplayMode) {
      // ★修正: 完了時にボタンを「リピート(🔄)」または「再生(▶️)」に変更し、タイムライン停止
      const btn = document.getElementById("btnReplayToggle");
      if (btn) btn.textContent = "🔄"; // 完了したことがわかるアイコンへ

      gsap.globalTimeline.pause();
      // ★注意: ここで timeScale(1.0) を入れると速度がリセットされるので入れない
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

  // アクションボタンエリアの再構築
  const actionsContainer = document.querySelector(".clear-actions");
  if (actionsContainer) {
    actionsContainer.innerHTML = "";

    // 次へボタン (★グラデーションクラス適用)
    const btnNext = document.createElement("button");
    btnNext.id = "btnClearNext";
    btnNext.className = "btn btn-grad-next";
    btnNext.textContent = "次のステージ";

    // リプレイボタン (★グラデーションクラス適用)
    const btnReplay = document.createElement("button");
    btnReplay.id = "btnClearReplay";
    btnReplay.className = "btn btn-grad-replay";
    btnReplay.textContent = "リプレイ";
    btnReplay.onclick = () => {
      playChin();
      startReplayMode();
    };

    // リトライボタン
    const btnRetry = document.createElement("button");
    btnRetry.id = "btnClearRetry";
    btnRetry.className = "btn dark";
    btnRetry.textContent = "リトライ";

    // 戻るボタン
    const btnBack = document.createElement("button");
    btnBack.id = "btnClearBack";
    btnBack.className = "btn dark";
    btnBack.textContent = "戻る";

    // イベントリスナー設定
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
      stopPlayMode();
      if (isOfficialPlay) showScreen("officialSelect");
      else if (isFanmadePlay) showScreen("fanmadeSelect");
      else showScreen("editorSelect");
    };

    // ボタン追加
    if (isOfficialPlay && currentLevel && currentLevel._officialIndex !== undefined) {
      const nextIdx = currentLevel._officialIndex + 1;
      if (currentLevel._officialIndex !== (MAIN_STAGE_COUNT - 1) && nextIdx < officialLevels.length) {
        actionsContainer.appendChild(btnNext);
      }
    }

    // リプレイデータがある場合のみ表示
    if (lastAttemptData) {
      actionsContainer.appendChild(btnReplay);
    }

    actionsContainer.appendChild(btnRetry);
    actionsContainer.appendChild(btnBack);
  }
}
function startReplayMode() {
  if (!lastAttemptData) return;

  isReplayMode = true;
  // ★重要: ここでは速度リセットをせず、ユーザーの前回設定（あるいは初期値1.0）を使うならコメントアウト
  // ただし、初回起動時は1.0にしておきたい場合は下記のように「未定義なら1.0」とする
  if (!replaySpeed) replaySpeed = 1.0;

  // クリア画面を隠す
  clearOverlay.classList.remove("active");
  clearOverlay.classList.add("hidden");

  // リプレイUIを表示
  const controls = document.getElementById("replayControls");
  if (controls) controls.classList.remove("hidden");

  // ★追加: プレイ中の左上ボタン（戻る/リトライ/スキップ）を隠す
  const playControls = document.getElementById("playControls");
  if (playControls) playControls.classList.add("hidden");

  updateReplaySpeedUI();

  // 盤面復元
  currentLevel.data = JSON.parse(JSON.stringify(lastAttemptData));
  resetGameState();
  renderGrid(playGrid);

  playTimerVal.textContent = "REPLAY";

  // 少し待ってからスタート
  setTimeout(() => {
    const startIdx = currentLevel.data.findIndex(c => c.type === TYPE_START);
    if (startIdx !== -1) {
      spawnBall(startIdx, playGrid);

      const btn = document.getElementById("btnReplayToggle");
      if (btn) btn.textContent = "⏸️";

      gsap.globalTimeline.paused(false);
      gsap.globalTimeline.timeScale(replaySpeed); // 保存された速度を適用
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

  // 速度と停止状態をリセット
  gsap.globalTimeline.timeScale(1.0);
  gsap.globalTimeline.paused(false);

  // リプレイUIを隠す
  const controls = document.getElementById("replayControls");
  if (controls) controls.classList.add("hidden");

  // ★追加: プレイ中の左上ボタンを再表示
  const playControls = document.getElementById("playControls");
  if (playControls) playControls.classList.remove("hidden");

  // クリア画面に戻る
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
  // 範囲制限: 0.5x ~ 4.0x
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

  // ★修正: 速度(replaySpeed)を1.0にリセットせず、現在の値を適用する
  updateReplaySpeedUI();
  gsap.globalTimeline.timeScale(replaySpeed);
  gsap.globalTimeline.paused(false);

  const btn = document.getElementById("btnReplayToggle");
  if (btn) btn.textContent = "⏸️";

  setTimeout(() => {
    const startIdx = currentLevel.data.findIndex(c => c.type === TYPE_START);
    if (startIdx !== -1) {
      spawnBall(startIdx, playGrid);
    }
  }, 300);
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
      // ★修正: 設定がONなら状態を引き継ぐ (死亡時)
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
    setTimeout(() => {
      document.body.classList.remove("flash-reset");
    }, 500);
  }, 100);
}

function openSettings() {
  document.getElementById("editLevelName").value = currentLevel.name;
  document.getElementById("editLevelSub").value = currentLevel.sub || "";
  document.getElementById("editLevelAuthor").value = currentLevel.author || "";

  const locked = !isDlcUnlocked();

  // ★追加: 背景テーマのロック処理
  const bgSelect = document.getElementById("editBgTheme");
  if (bgSelect) {
    Array.from(bgSelect.options).forEach(opt => {
      // DLCテーマかどうか判定
      if (DLC_BG_THEMES.includes(opt.value)) {
        opt.disabled = locked;
        if (locked) {
          // ロック中はテキストを変更（または非表示）
          if (!opt.dataset.originalText) opt.dataset.originalText = opt.textContent;
          opt.textContent = "??? (Locked)";
        } else if (opt.dataset.originalText) {
          opt.textContent = opt.dataset.originalText;
        }
      }
    });

    // 現在設定されているテーマがロック対象なら、デフォルト(warm)に戻す
    const currentBg = currentLevel.bgTheme || "warm";
    if (locked && DLC_BG_THEMES.includes(currentBg)) {
      bgSelect.value = "warm";
      // ついでにデータも戻しておく（保存時に反映される）
      currentLevel.bgTheme = "warm";
    } else {
      bgSelect.value = currentBg;
    }
  }

  // ★追加: BGMテーマのロック処理
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
      currentLevel.bgmTheme = "warm";
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

// --- FANMADE レベル読み込み (battle_runtime.js ロジック再現版) ---
window.loadFanmadeLevels = async function () {
  const container = document.getElementById("fanmadeLevelList");
  let loader = null;

  if (container) {
    container.innerHTML = "";
    // battle_runtime.js のようなテキスト表示
    loader = showListLoading(container, "Initialize...");
  }

  fanmadeLevels = [];

  // ▼ ここで「確認するファイルの範囲」を定義します（リストの代わり）
  // battle_runtime.js における imageList.length の役割です。
  // ※レベルが20個以上ある場合は、この数字を増やしてください。
  const CHECK_LIMIT = 12;

  // battle_runtime.js の loadedAssets に相当
  let processedCount = 0;

  // 1. 全てのリクエスト(Promise)を一斉に作成・開始（並列処理）
  const promises = [];

  for (let i = 0; i < CHECK_LIMIT; i++) {
    const p = new Promise(async (resolve) => {

      // 演出用: ID順に少しだけズラして開始することで、数字がパラパラ上がるようにする
      // (これが無いと一瞬で100%になってしまいます)
      await new Promise(r => setTimeout(r, i * 30));

      try {
        const res = await fetch(`./fanmade_levels/level_fanmade_${i}.json`);

        if (res.ok) {
          const data = await res.json();
          data._fanmadeId = `fan_${i}`;
          data._isStatic = true;
          fanmadeLevels.push(data);

          // ログ表示（battle_runtime.js の addLog 相当）
          if (loader) loader.update((processedCount / CHECK_LIMIT) * 100, `Loaded: Level ${i}`);
        } else {
          // ファイルがない場合
          if (loader) loader.update((processedCount / CHECK_LIMIT) * 100, `Skip: Level ${i} (Not Found)`);
        }
      } catch (e) {
        // エラー時
        if (loader) loader.update((processedCount / CHECK_LIMIT) * 100, `Error: Level ${i}`);
      } finally {
        // 2. 成功/失敗に関わらず進捗を進める (battle_runtime.js の updateProgress 相当)
        processedCount++;
        const percent = (processedCount / CHECK_LIMIT) * 100;
        if (loader) {
          // ローディング円と％を更新
          loader.update(percent);
        }
        resolve(); // タスク完了
      }
    });
    promises.push(p);
  }

  // 3. 全ての確認が終わるまで待つ (battle_runtime.js の isLoaded 相当)
  await Promise.all(promises);

  // ID順に並び替え
  fanmadeLevels.sort((a, b) => {
    const idA = parseInt(a._fanmadeId.split('_')[1]);
    const idB = parseInt(b._fanmadeId.split('_')[1]);
    return idA - idB;
  });

  // 完了（100%にして少し待機）
  if (loader) {
    loader.update(100, "All Assets Ready.");
  }

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
  // 既にクリア済みで、かつ今回の方が遅ければ更新しない（ベストタイム更新なら上書き、などのロジックはお好みで。今回は単に上書きします）
  progress[id] = { time: timeStr, clearedAt: Date.now() };
  localStorage.setItem(FANMADE_PROGRESS_KEY, JSON.stringify(progress));
}

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

    const timeHtml = isCleared ? `<div class="clear-time-info">{${clearData.time}} Clear</div>` : "";

    item.innerHTML = `
      <h4>No.${idx + 1}</h4>
      <div class="sub-title">${escapeHtml(level.name)}</div>
      ${level.sub ? `<div style="font-size:12px; color:#aaa; margin-bottom:4px;">${escapeHtml(level.sub)}</div>` : ""}
      <div class="author-name">by ${escapeHtml(level.author || "Unknown")}</div>
      ${timeHtml}
    `;

    item.addEventListener("click", () => {
      playChin();

      // ★追加: DLCコンテンツチェック
      if (!isDlcUnlocked()) {
        const hasDlcTile = level.data.some(c => DLC_TILES.includes(c.type));
        const hasDlcTheme = DLC_BG_THEMES.includes(level.bgTheme) || DLC_BGM_THEMES.includes(level.bgmTheme);

        if (hasDlcTile || hasDlcTheme) {
          playSe("died");
          alert("このレベルにはDLCコンテンツが含まれているため、\nDLCを開放するまで遊ぶことができません。");
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
        el.classList.add("flip-reveal");
        setTimeout(() => {
          el.classList.add("cleared");
        }, 350);
      }, i * 50);
    });
  }, 100);
}
init();