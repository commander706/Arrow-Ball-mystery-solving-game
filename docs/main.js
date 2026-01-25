/* main.js */
export const screens = {
  title: document.getElementById("titleScreen"),
  play: document.getElementById("playScreen"),
  editorSelect: document.getElementById("editorSelectScreen"),
  editorMain: document.getElementById("editorMainScreen"),
  officialSelect: document.getElementById("officialSelectScreen"),
};

// BGM管理
const bgm = document.getElementById("bgm");
const bgmEx = document.getElementById("bgmEx");
const seChin = document.getElementById("seChin");
let isBgmPlaying = false;
let bgmFadeInterval = null;

function tryPlayBgm() {
  if (!isBgmPlaying && bgm) {
    bgm.volume = 0.3; 
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
export function fadeBgmToEx() {
  if (bgmFadeInterval) clearInterval(bgmFadeInterval);
  
  // 修正: 音量は関係なく、単に「停止していない」なら再生中とみなす
  const isExAlreadyPlaying = bgmEx && !bgmEx.paused;

  if (!isExAlreadyPlaying) {
    if (bgmEx) {
      bgmEx.currentTime = 0;
      bgmEx.volume = 0;
      bgmEx.play().catch(()=>{});
    }
  }

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
    if (bgmEx && bgmEx.volume < 0.1) {
      bgmEx.volume = Math.min(0.1, bgmEx.volume + 0.01);
      finished = false;
    }

    if (finished) clearInterval(bgmFadeInterval);
  }, 50);
}
export function fadeBgmToNormal() {
  if (bgmFadeInterval) clearInterval(bgmFadeInterval);

  // Normal再生再開
  if (bgm) {
    bgm.volume = 0;
    bgm.play().catch(()=>{});
  }

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
    if (bgm && bgm.volume < 0.3) {
      bgm.volume = Math.min(0.3, bgm.volume + 0.01);
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
  // タイトル画面からの遷移（Shatter演出）の場合
  if (withShatter && (name === 'editorSelect' || name === 'officialSelect')) {
    performShatterTransition(() => {
      _switchScreen(name);
    });
    return;
  }

  // 現在アクティブな画面を取得
  const currentScreen = document.querySelector(".screen--active");

  // 退場アニメーションが必要な画面か判定（タイトル画面以外で、かつプレイ画面以外）
  // プレイ画面からの戻りは即時でも良いが、UI系画面（選択画面・エディタ）はアニメーションさせる
  if (currentScreen && 
      currentScreen.id !== 'titleScreen' && 
      currentScreen.id !== 'playScreen') {
    
    // 退場アニメーションクラス付与
    currentScreen.classList.add("ui-exit-active");

    // アニメーション完了を待ってから切り替え (0.4s = 400ms)
    setTimeout(() => {
      _switchScreen(name);
    }, 400);
  } else {
    // それ以外は即時切り替え
    _switchScreen(name);
  }
}

function _switchScreen(name) {
  Object.values(screens).forEach(s => {
    if(s) {
      s.classList.remove("screen--active");
      s.classList.remove("screen--shatter");
      s.classList.remove("ui-enter-active"); // 入場クラス削除
      s.classList.remove("ui-exit-active");  // 退場クラス削除
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
    
    // UIアニメーションの発火 (リフローさせてからクラス付与)
    // タイトル画面とプレイ画面以外で発火させる
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

const btnPlay = document.getElementById("btnPlay");
if (btnPlay) {
  btnPlay.addEventListener("click", () => { playChin(); showScreen("officialSelect", true); }); 
}
const btnEditor = document.getElementById("btnEditor");
if (btnEditor) {
  btnEditor.addEventListener("click", () => { playChin(); showScreen("editorSelect", true); });
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
