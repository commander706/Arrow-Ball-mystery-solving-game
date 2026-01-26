/* main.js */

// Audio Volume State
export const audioSettings = {
  bgmVolume: 0.3,
  sfxVolume: 0.5
};

export const screens = {
  title: document.getElementById("titleScreen"),
  play: document.getElementById("playScreen"),
  editorSelect: document.getElementById("editorSelectScreen"),
  editorMain: document.getElementById("editorMainScreen"),
  officialSelect: document.getElementById("officialSelectScreen"),
};

// --- Patch Notes Data ---
const PATCH_NOTES = [
  {
    version: "1.2.0",
    date: "2026/01/27",
    sub: "Large UI Update & Hints",
    content: [
      "タイトル画面の設定ボタンを刷新・巨大化",
      "パッチノート機能を追加",
      "アップデート通知機能を追加",
      "エディター/プレイ画面にヒント機能を追加",
      "不具合修正（クリスタル判定、テレポート挙動、スマホ表示調整）"
    ]
  },
  {
    version: "1.1.5",
    date: "2026/01/26",
    sub: "System Optimization",
    content: [
      "レベルエディターの操作性改善",
      "EXモードのBGMフェード処理の最適化",
      "SE音量の調整"
    ]
  },
  {
    version: "1.0.0",
    date: "2026/01/01",
    sub: "Official Release",
    content: [
      "3D Arrow & Ball リリース",
      "全30ステージ + EXステージ実装",
      "レベルエディター実装"
    ]
  }
];

const STORAGE_KEY_VERSION = '3d_arrow_ball_last_version';

// BGM管理
const bgm = document.getElementById("bgm");
const bgmEx = document.getElementById("bgmEx");
const seChin = document.getElementById("seChin");
const sePush2 = document.getElementById("sePush2");
let isBgmPlaying = false;
let bgmFadeInterval = null;


// Load Settings from LocalStorage
const savedVol = localStorage.getItem('3d_arrow_ball_volume');
if (savedVol) {
  try {
    const parsed = JSON.parse(savedVol);
    audioSettings.bgmVolume = parsed.bgm;
    audioSettings.sfxVolume = parsed.sfx;
  } catch(e){}
}

// Global Settings UI
const btnTitleSettings = document.getElementById("btnTitleSettings");
const globalSettingsModal = document.getElementById("globalSettingsModal");
const btnCloseGlobalSettings = document.getElementById("btnCloseGlobalSettings");
const volBgmSlider = document.getElementById("volBgm");
const volSfxSlider = document.getElementById("volSfx");

if (btnTitleSettings) {
  btnTitleSettings.addEventListener("click", () => {
    volBgmSlider.value = audioSettings.bgmVolume;
    volSfxSlider.value = audioSettings.sfxVolume;
    playChin();
    globalSettingsModal.showModal();
  });
}

if (btnCloseGlobalSettings) {
  btnCloseGlobalSettings.addEventListener("click", () => {
    playChin();
    globalSettingsModal.close();
  });
}

// Real-time volume update
volBgmSlider.addEventListener("input", (e) => {
  audioSettings.bgmVolume = parseFloat(e.target.value);
  updateAllVolumes();
});
volSfxSlider.addEventListener("input", (e) => {
  audioSettings.sfxVolume = parseFloat(e.target.value);
  updateAllVolumes();
});

// 音量を適用・保存する関数
export function updateAllVolumes() {
  if (bgm) bgm.volume = audioSettings.bgmVolume;
  if (bgmEx) {
    if (!bgmEx.paused) bgmEx.volume = Math.min(bgmEx.volume, audioSettings.bgmVolume);
  }

  localStorage.setItem('3d_arrow_ball_volume', JSON.stringify({
    bgm: audioSettings.bgmVolume,
    sfx: audioSettings.sfxVolume
  }));
}

function tryPlayBgm() {
  if (!isBgmPlaying && bgm) {
    bgm.volume = audioSettings.bgmVolume; // 設定値を使用
    bgm.play().then(() => {
      isBgmPlaying = true;
    }).catch(() => {});
  }
}
window.addEventListener("click", tryPlayBgm, { once: true });
window.addEventListener("keydown", tryPlayBgm, { once: true });

export function playChin() {
  if (seChin) {
    seChin.currentTime = 0;
    seChin.volume = 0.6;
    seChin.play().catch(()=>{});
  }
}

// --- Update Check Logic ---
function checkUpdateAndNavigate(targetScreenName) {
  const latestVersion = PATCH_NOTES[0].version;
  const lastPlayedVersion = localStorage.getItem(STORAGE_KEY_VERSION);

  // 未プレイ(null) または バージョンが異なる場合
  if (lastPlayedVersion !== latestVersion) {
    showUpdateNotice();
  } else {
    // 最新版確認済みならそのまま遷移
    playChin();
    showScreen(targetScreenName, true);
  }
}

function showUpdateNotice() {
  const modal = document.getElementById("updateNoticeModal");
  const latest = PATCH_NOTES[0];
  
  // 内容セット
  document.getElementById("updateNoticeVersion").textContent = `Version ${latest.version}`;
  document.getElementById("updateNoticeDate").textContent = latest.date;
  document.getElementById("updateNoticeSub").textContent = latest.sub;
  
  const list = document.getElementById("updateNoticeContent");
  list.innerHTML = "";
  latest.content.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });

  // 通知音再生
  if (sePush2) {
    sePush2.currentTime = 0;
    sePush2.volume = audioSettings.sfxVolume;
    sePush2.play().catch(()=>{});
  }

  modal.showModal();
}

// アップデート通知を閉じた時の処理
const btnCloseUpdateNotice = document.getElementById("btnCloseUpdateNotice");
if (btnCloseUpdateNotice) {
  btnCloseUpdateNotice.addEventListener("click", () => {
    playChin();
    document.getElementById("updateNoticeModal").close();
    // バージョン情報を更新して保存
    localStorage.setItem(STORAGE_KEY_VERSION, PATCH_NOTES[0].version);
  });
}


export function fadeBgmToEx() {
  if (bgmFadeInterval) clearInterval(bgmFadeInterval);
  
  const isExAlreadyPlaying = bgmEx && !bgmEx.paused;

  if (!isExAlreadyPlaying) {
    if (bgmEx) {
      bgmEx.currentTime = 0;
      bgmEx.volume = 0;
      bgmEx.play().catch(()=>{});
    }
  }

  const targetVol = audioSettings.bgmVolume;

  bgmFadeInterval = setInterval(() => {
    let finished = true;

    // Normal下げ
    if (bgm && bgm.volume > 0.01) {
      bgm.volume = Math.max(0, bgm.volume - 0.01);
      finished = false;
    } else if (bgm) {
      bgm.pause();
    }

    // Ex上げ
    if (bgmEx && bgmEx.volume < targetVol) {
      bgmEx.volume = Math.min(targetVol, bgmEx.volume + 0.01);
      finished = false;
    }

    if (finished) clearInterval(bgmFadeInterval);
  }, 50);
}

export function fadeBgmToNormal() {
  if (bgmFadeInterval) clearInterval(bgmFadeInterval);

  if (bgm) {
    bgm.volume = 0;
    bgm.play().catch(()=>{});
  }

  const targetVol = audioSettings.bgmVolume;

  bgmFadeInterval = setInterval(() => {
    let finished = true;

    // Ex下げ
    if (bgmEx && bgmEx.volume > 0.01) {
      bgmEx.volume = Math.max(0, bgmEx.volume - 0.01);
      finished = false;
    } else if (bgmEx) {
      bgmEx.pause();
    }

    // Normal上げ
    if (bgm && bgm.volume < targetVol) {
      bgm.volume = Math.min(targetVol, bgm.volume + 0.01);
      finished = false;
    }

    if (finished) clearInterval(bgmFadeInterval);
  }, 50);
}


// 背景演出 (EX用)
const bgEl = document.getElementById("mainBg");
const particlesEl = document.getElementById("spaceParticles");

export function setSpaceBackground(enable) {
  if (enable) {
    if (bgEl) bgEl.classList.add("ex-mode");
    if (particlesEl) {
      particlesEl.classList.add("active");
      particlesEl.classList.remove("hidden");
      // 星の生成
      if (particlesEl.children.length === 0) {
        for(let i=0; i<50; i++) {
          const s = document.createElement("div");
          s.className = "star";
          const size = Math.random() * 3 + 1;
          s.style.width = size + "px";
          s.style.height = size + "px";
          s.style.left = Math.random() * 100 + "%";
          s.style.top = Math.random() * 100 + "%";
          s.style.animationDuration = (Math.random() * 2 + 1) + "s";
          s.style.animationDelay = Math.random() * 2 + "s";
          particlesEl.appendChild(s);
        }
      }
    }
  } else {
    if (bgEl) bgEl.classList.remove("ex-mode");
    if (particlesEl) {
      particlesEl.classList.remove("active");
      setTimeout(() => particlesEl.classList.add("hidden"), 1500); // フェードアウト待ち
    }
  }
}

// 画面遷移
export function showScreen(name, withShatter = false) {
  if (withShatter && (name === 'editorSelect' || name === 'officialSelect')) {
    performShatterTransition(() => {
      _switchScreen(name);
    });
    return;
  }

  const currentScreen = document.querySelector(".screen--active");

  if (currentScreen && 
      currentScreen.id !== 'titleScreen' && 
      currentScreen.id !== 'playScreen') {
    
    currentScreen.classList.add("ui-exit-active");
    setTimeout(() => {
      _switchScreen(name);
    }, 400);
  } else {
    _switchScreen(name);
  }
}

function _switchScreen(name) {
  Object.values(screens).forEach(s => {
    if(s) {
      s.classList.remove("screen--active");
      s.classList.remove("screen--shatter");
      s.classList.remove("ui-enter-active"); 
      s.classList.remove("ui-exit-active");
      s.style.opacity = "";
      s.style.transform = "";
    }
  });

  const logo = document.getElementById("logoStage");
  const menu = document.getElementById("menuButtons");
  if(logo) { logo.style.transform = ""; logo.style.opacity = ""; }
  if(menu) { menu.style.transform = ""; menu.style.opacity = ""; }

  if (screens[name]) {
    screens[name].classList.add("screen--active");
    if (name !== 'title' && name !== 'play') {
      void screens[name].offsetWidth; 
      screens[name].classList.add("ui-enter-active");
    }
  }

  if (name === "title") {
    startLogoIntro();
  }
}

function performShatterTransition(callback) {
  const titleScreen = screens.title;
  const logo = document.getElementById("logoStage");
  const menu = document.getElementById("menuButtons");

  titleScreen.classList.add("screen--shatter");

  logo.style.transform = `translate3d(${r(-150, 150)}px, -600px, 300px) rotateZ(${r(-40, 40)}deg) rotateX(${r(30, 80)}deg)`;
  logo.style.opacity = "0";

  menu.style.transform = `translate3d(${r(-150, 150)}px, 600px, 300px) rotateZ(${r(-30, 30)}deg) rotateX(${r(-30, -80)}deg)`;
  menu.style.opacity = "0";

  setTimeout(() => {
    callback();
  }, 600);
}

function r(min, max) { return Math.random() * (max - min) + min; }

document.querySelectorAll("[data-to]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-to");
    showScreen(target);
  });
});

// タイトル画面ボタン イベントリスナー登録 (アップデートチェック付き)
const btnPlay = document.getElementById("btnPlay");
if (btnPlay) {
  // 既存のリスナーを削除/上書きするため cloneNode で置換
  btnPlay.replaceWith(btnPlay.cloneNode(true));
  document.getElementById("btnPlay").addEventListener("click", () => {
    checkUpdateAndNavigate("officialSelect");
  });
}

const btnEditor = document.getElementById("btnEditor");
if (btnEditor) {
  btnEditor.replaceWith(btnEditor.cloneNode(true));
  document.getElementById("btnEditor").addEventListener("click", () => {
    checkUpdateAndNavigate("editorSelect");
  });
}

// --- Patch Notes UI ---
const btnPatchNotes = document.getElementById("btnPatchNotes");
const patchNotesModal = document.getElementById("patchNotesModal");
const btnClosePatchNotes = document.getElementById("btnClosePatchNotes");
const patchNotesList = document.getElementById("patchNotesList");
const patchDetailArea = document.getElementById("patchDetailArea");
const btnBackToPatchList = document.getElementById("btnBackToPatchList");

if (btnPatchNotes) {
  btnPatchNotes.addEventListener("click", () => {
    playChin();
    renderPatchList();
    patchNotesModal.showModal();
  });
}
if (btnClosePatchNotes) {
  btnClosePatchNotes.addEventListener("click", () => {
    patchNotesModal.close();
    setTimeout(() => {
        patchNotesList.classList.remove("hidden");
        patchDetailArea.classList.add("hidden");
    }, 300);
  });
}
if (btnBackToPatchList) {
  btnBackToPatchList.addEventListener("click", () => {
    patchDetailArea.classList.add("hidden");
    patchNotesList.classList.remove("hidden");
  });
}

function renderPatchList() {
  patchNotesList.classList.remove("hidden");
  patchDetailArea.classList.add("hidden");
  patchNotesList.innerHTML = "";

  PATCH_NOTES.forEach((patch, idx) => {
    const item = document.createElement("div");
    item.className = "patch-item";
    item.innerHTML = `
      <div class="patch-info">
        <h4>Version ${patch.version}</h4>
        <p>${patch.sub}</p>
      </div>
      <div class="patch-date">${patch.date}</div>
    `;
    item.addEventListener("click", () => showPatchDetail(patch));
    patchNotesList.appendChild(item);
  });
}

function showPatchDetail(patch) {
  patchNotesList.classList.add("hidden");
  patchDetailArea.classList.remove("hidden");

  document.getElementById("patchDetailTitle").textContent = `Version ${patch.version}`;
  document.getElementById("patchDetailSub").textContent = `${patch.date} - ${patch.sub}`;
  
  const ul = document.getElementById("patchDetailContent");
  ul.innerHTML = "";
  patch.content.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    ul.appendChild(li);
  });
}


export function showLoading(callback, duration = 800) {
  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) { if (callback) callback(); return; }
  overlay.classList.add("active");
  setTimeout(() => {
    if (callback) callback();
    setTimeout(() => { overlay.classList.remove("active"); }, 300);
  }, duration);
}

// ロゴ演出
const logoCanvas = document.getElementById("logoCanvas");
const logoFallback = document.getElementById("logoFallback");
const ctx = logoCanvas ? logoCanvas.getContext("2d", { alpha: true }) : null;
let loadedLogoImg = null; let rafId = 0; let running = false;
function cancelIntro() { if (rafId) cancelAnimationFrame(rafId); rafId = 0; running = false; }
function fitCanvasToImage(img) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cssW = Math.min(860, Math.floor(window.innerWidth * 0.92));
  const ratio = img.naturalHeight / img.naturalWidth;
  const cssH = Math.max(120, Math.floor(cssW * ratio));
  logoCanvas.style.width = cssW + "px"; logoCanvas.style.height = cssH + "px";
  logoCanvas.width = Math.floor(cssW * dpr); logoCanvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
function easeInOutQuad(t){ return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }
function drawPixelated(img, pixelScale, revealT, jitterPower) {
  if (!ctx) return;
  const w = logoCanvas.clientWidth; const h = logoCanvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  const revealH = Math.floor(h * revealT);
  ctx.save(); ctx.beginPath(); ctx.rect(0, h - revealH, w, revealH); ctx.clip();
  const sw = Math.max(8, Math.floor(w / pixelScale)); const sh = Math.max(8, Math.floor(h / pixelScale));
  const tmp = document.createElement("canvas"); tmp.width = sw; tmp.height = sh;
  const tctx = tmp.getContext("2d");
  tctx.imageSmoothingEnabled = false; ctx.imageSmoothingEnabled = false;
  const jx = (Math.random() - 0.5) * jitterPower; const jy = (Math.random() - 0.5) * jitterPower;
  tctx.clearRect(0, 0, sw, sh); tctx.drawImage(img, 0, 0, sw, sh);
  ctx.save(); ctx.translate(jx, jy); ctx.drawImage(tmp, 0, 0, sw, sh, 0, 0, w, h);
  ctx.restore(); ctx.restore();
}
window.startLogoIntro = async function() {
  if (!ctx) { if (logoFallback) logoFallback.style.display = "block"; return; }
  cancelIntro(); running = true;
  screens.title.classList.remove("is-logo-done"); screens.title.classList.add("is-logo-running");
  if (!loadedLogoImg) {
    const img = new Image(); img.src = "./assets/logo.png";
    try { await img.decode(); loadedLogoImg = img; }
    catch { if (logoFallback) logoFallback.style.display = "block"; running = false; return; }
  }
  if (!running) return;
  logoCanvas.style.display = "block"; fitCanvasToImage(loadedLogoImg);
  const dur = 1200; const start = performance.now();
  function tick(now){
    const t = Math.min(1, (now - start) / dur); const e = easeOutCubic(t);
    const pixelScale = Math.max(1, Math.floor(40 - 39 * e));
    const revealT = easeInOutQuad(Math.min(1, t * 1.12)); const jitter = (1 - e) * 6;
    drawPixelated(loadedLogoImg, pixelScale, revealT, jitter);
    if (t < 1) { rafId = requestAnimationFrame(tick); return; }
    const start2 = performance.now();
    function settle(n2){
      const t2 = Math.min(1, (n2 - start2) / 350); drawPixelated(loadedLogoImg, 1, 1, 0);
      if (t2 < 1) { rafId = requestAnimationFrame(settle); return; }
      screens.title.classList.remove("is-logo-running"); screens.title.classList.add("is-logo-done"); running = false;
    }
    rafId = requestAnimationFrame(settle);
  }
  rafId = requestAnimationFrame(tick);
};
let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!screens.title.classList.contains("screen--active")) return;
    if (screens.title.classList.contains("is-logo-done")) {
      if (loadedLogoImg) { fitCanvasToImage(loadedLogoImg); drawPixelated(loadedLogoImg, 1, 1, 0); }
    } else { startLogoIntro(); }
  }, 120);
});
startLogoIntro();