/* main.js */

// Audio Volume State & Global Settings
export const audioSettings = {
  bgmVolume: 0.3,
  sfxVolume: 0.5,
  autoSaveInterval: 0, // 分単位 (0=OFF)
  keepTileState: false // ★追加: 可変タイルの向き維持 (デフォルトOFF)
};


export const screens = {
  title: document.getElementById("titleScreen"),
  play: document.getElementById("playScreen"),
  editorSelect: document.getElementById("editorSelectScreen"),
  editorMain: document.getElementById("editorMainScreen"),
  officialSelect: document.getElementById("officialSelectScreen"),
  fanmadeSelect: document.getElementById("fanmadeSelectScreen") // 追加
};

// --- Patch Notes Data ---
const PATCH_NOTES = [
    {
    version: "1.3.1",
    date: "2026/01/30",
    sub: "Minor Bug Fixes & UI Improvements",
    content: [
      "リトライ時の可変できるタイルを保持するかしないかの設定を追加",
      "創作レベルに新たに7つのFANMADEレベルを追加",
      "左下の宣伝リンクの画像が表示されない不具合を修正"
    ]
  },
  {
    version: "1.3.0",
    date: "2026/01/29",
    sub: "Community & Atmosphere Update",
    content: [
      "FANMADEレベルセクションの追加",
      "レベル演出（背景・音楽）のカスタマイズ機能",
      "新タイル「一方通行Uターン」追加",
      "エディタの自動セーブを全体設定へ移行",
      "レベルリストのソート順を修正"
    ]
  },
  {
    version: "1.2.1",
    date: "2026/01/28",
    sub: "OS Update",
    content: [
      "スマホ版、PC版、画面の拡大率のバグについて修正",
      "スマホ完全対応！",
      "クリアしたレベルのパネル演出を追加"
    ]
  },
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
const STORAGE_KEY_SETTINGS = '3d_arrow_ball_settings'; // グローバル設定保存用

// BGM Elements
const bgms = {
  warm: document.getElementById("bgm"),
  vertex: document.getElementById("bgmEx"),
  wind: document.getElementById("bgm2"),
  speculation: document.getElementById("bgm3")
};

const seChin = document.getElementById("seChin");
const sePush2 = document.getElementById("sePush2");

let isBgmPlaying = false;
let currentBgmKey = null;

// FX Animation State
let underwaterRafId = null;
// フェード制御用インターバル管理
let bgmFadeInterval = null;

// Load Settings from LocalStorage (Volume + Global AutoSave)
const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
const savedVol = localStorage.getItem('3d_arrow_ball_volume'); // 後方互換

// 統合ロード処理
if (savedSettings) {
  try {
    const parsed = JSON.parse(savedSettings);
    if (parsed.bgm !== undefined) audioSettings.bgmVolume = parsed.bgm;
    if (parsed.sfx !== undefined) audioSettings.sfxVolume = parsed.sfx;
    if (parsed.autoSave !== undefined) audioSettings.autoSaveInterval = parsed.autoSave;
    if (parsed.keepTileState !== undefined) audioSettings.keepTileState = parsed.keepTileState;
  } catch(e){}
} else if (savedVol) {
  // 旧バージョンからの移行
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
const globalAutoSaveSlider = document.getElementById("globalAutoSaveSlider");
const globalAutoSaveVal = document.getElementById("globalAutoSaveVal");
const chkKeepTileState = document.getElementById("chkKeepTileState");
const keepStateWarningModal = document.getElementById("keepStateWarningModal");
const btnKeepStateYes = document.getElementById("btnKeepStateYes");
const btnKeepStateNo = document.getElementById("btnKeepStateNo");


if (btnTitleSettings) {
  btnTitleSettings.addEventListener("click", () => {
    // 現在値をUIに反映
    if(volBgmSlider) volBgmSlider.value = audioSettings.bgmVolume;
    if(volSfxSlider) volSfxSlider.value = audioSettings.sfxVolume;
    if(globalAutoSaveSlider) {
      globalAutoSaveSlider.value = audioSettings.autoSaveInterval;
      if(globalAutoSaveVal) globalAutoSaveVal.textContent = audioSettings.autoSaveInterval == 0 ? "OFF" : audioSettings.autoSaveInterval + "分";
    }
    // ★追加: チェックボックスの状態反映
    if(chkKeepTileState) chkKeepTileState.checked = audioSettings.keepTileState;

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

// Real-time updates
if(volBgmSlider) {
  volBgmSlider.addEventListener("input", (e) => {
    audioSettings.bgmVolume = parseFloat(e.target.value);
    updateAllVolumes();
  });
}
if(volSfxSlider) {
  volSfxSlider.addEventListener("input", (e) => {
    audioSettings.sfxVolume = parseFloat(e.target.value);
    saveGlobalSettings();
  });
}
if(globalAutoSaveSlider) {
  globalAutoSaveSlider.addEventListener("input", (e) => {
    audioSettings.autoSaveInterval = parseInt(e.target.value, 10);
    if(globalAutoSaveVal) globalAutoSaveVal.textContent = audioSettings.autoSaveInterval == 0 ? "OFF" : audioSettings.autoSaveInterval + "分";
    saveGlobalSettings();
  });
}
if (chkKeepTileState) {
  chkKeepTileState.addEventListener("click", (e) => {
    if (e.target.checked) {
      // ONにしようとした場合、一度チェックを戻して警告を出す
      e.preventDefault();
      e.target.checked = false; 
      playChin();
      keepStateWarningModal.showModal();
    } else {
      // OFFにする場合は即座に反映してOK
      playChin();
      audioSettings.keepTileState = false;
      saveGlobalSettings();
    }
  });
}

if (btnKeepStateYes) {
  btnKeepStateYes.addEventListener("click", () => {
    playChin();
    audioSettings.keepTileState = true;
    if(chkKeepTileState) chkKeepTileState.checked = true;
    saveGlobalSettings();
    keepStateWarningModal.close();
  });
}

if (btnKeepStateNo) {
  btnKeepStateNo.addEventListener("click", () => {
    playChin();
    keepStateWarningModal.close();
  });
}
function saveGlobalSettings() {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
    bgm: audioSettings.bgmVolume,
    sfx: audioSettings.sfxVolume,
    autoSave: audioSettings.autoSaveInterval,
    keepTileState: audioSettings.keepTileState // ★追加: 保存
  }));
  // 互換性のため旧キーも更新
  localStorage.setItem('3d_arrow_ball_volume', JSON.stringify({
    bgm: audioSettings.bgmVolume,
    sfx: audioSettings.sfxVolume
  }));
}


// 音量を適用する関数
export function updateAllVolumes() {
  Object.values(bgms).forEach(audio => {
    if (audio && !audio.paused) {
      audio.volume = audioSettings.bgmVolume;
    }
  });
  saveGlobalSettings();
}

// BGM再生開始 (初回クリック時など)
function tryPlayBgm() {
  if (!isBgmPlaying) {
    playStageBgm("warm"); // デフォルトBGM開始
    isBgmPlaying = true;
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
    playChin();
    showScreen(targetScreenName, true);
  }
}

function showUpdateNotice() {
  const modal = document.getElementById("updateNoticeModal");
  const latest = PATCH_NOTES[0];
  
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

  if (sePush2) {
    sePush2.currentTime = 0;
    sePush2.volume = audioSettings.sfxVolume;
    sePush2.play().catch(()=>{});
  }

  modal.showModal();
}

const btnCloseUpdateNotice = document.getElementById("btnCloseUpdateNotice");
if (btnCloseUpdateNotice) {
  btnCloseUpdateNotice.addEventListener("click", () => {
    playChin();
    document.getElementById("updateNoticeModal").close();
    localStorage.setItem(STORAGE_KEY_VERSION, PATCH_NOTES[0].version);
  });
}

// フェード制御用インターバル管理
let fadeTimers = {};

// iOS判定（iPadのデスクトップモード含む）
function isIOS() {
  return (
    // 通常のiPhone/iPad
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13以降のデスクトップモード (MacIntelと偽装するがタッチパネルがある)
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

// 指定したテーマのBGMを再生
export function playStageBgm(themeKey) {
  if (!themeKey) themeKey = "warm";
  
  const targetAudio = bgms[themeKey] || bgms.warm;
  
  // 既に再生中なら何もしない
  if (currentBgmKey === themeKey && targetAudio && !targetAudio.paused) {
    // PC版でフェードイン途中だった場合のリカバリ
    if (!isIOS() && targetAudio.volume < audioSettings.bgmVolume) {
        targetAudio.volume = audioSettings.bgmVolume;
    }
    return;
  }

  currentBgmKey = themeKey;

  // ★重要: 全てのフェードタイマーを強制停止・破棄
  Object.keys(fadeTimers).forEach(key => {
    clearInterval(fadeTimers[key]);
    delete fadeTimers[key];
  });

  // ■ 1. 他のBGMを停止
  Object.keys(bgms).forEach(key => {
    const audio = bgms[key];
    if (!audio) return;

    if (key !== themeKey) {
      // iOS、または既に停止している場合は即座にリセット
      if (isIOS() || audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      } 
      // PCかつ再生中の場合のみフェードアウト
      else {
        // 安全策: 万が一音量が下がらない環境でも20回(1秒)で強制停止するカウンタ
        let safetyCounter = 0;
        
        fadeTimers[key] = setInterval(() => {
          safetyCounter++;
          
          // 音量を下げる試行
          if (audio.volume > 0.05) {
            const prevVol = audio.volume;
            audio.volume = Math.max(0, audio.volume - 0.1);
            
            // ★重要: 音量を下げたはずなのに下がっていない場合（iOS誤判定時など）
            // 即座にループを抜けて停止させる
            if (audio.volume === prevVol) {
               audio.pause();
               audio.currentTime = 0;
               clearInterval(fadeTimers[key]);
               delete fadeTimers[key];
               return;
            }
          }
          
          // 音量が0になった、または安全装置(1秒経過)が作動したら停止
          if (audio.volume <= 0.05 || safetyCounter > 20) {
            audio.pause();
            audio.currentTime = 0;
            clearInterval(fadeTimers[key]);
            delete fadeTimers[key];
          }
        }, 50);
      }
    }
  });

  // ■ 2. ターゲットBGMを再生
  if (targetAudio) {
    if (isIOS()) {
      // iOS: 音量操作せず即再生
      targetAudio.currentTime = 0;
      targetAudio.play().catch(e => console.log("Mobile BGM Play Blocked:", e));
    } else {
      // PC: フェードイン
      targetAudio.volume = 0;
      const playPromise = targetAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          fadeTimers[themeKey] = setInterval(() => {
            if (targetAudio.volume < audioSettings.bgmVolume - 0.05) {
              targetAudio.volume = Math.min(audioSettings.bgmVolume, targetAudio.volume + 0.05);
            } else {
              targetAudio.volume = audioSettings.bgmVolume;
              clearInterval(fadeTimers[themeKey]);
              delete fadeTimers[themeKey];
            }
          }, 50);
        }).catch(e => console.log("BGM Play Blocked:", e));
      }
    }
  }
}
// 互換性のため残すが、実態は playStageBgm を呼ぶ
export function fadeBgmToEx() {
  playStageBgm("vertex");
}
export function fadeBgmToNormal() {
  playStageBgm("warm");
}

// 画面浮遊エフェクト（宇宙用）
function startCameraFloat() {
  const container = document.querySelector('.play-stage-container');
  // エディタ画面でも背景プレビューとして動かすため、エディタのコンテナも対象に
  const editorStage = document.querySelector('.editor-stage');
  
  const targets = [];
  if (container) targets.push(container);
  if (editorStage) targets.push(editorStage);

  targets.forEach(target => {
    gsap.killTweensOf(target);
    gsap.to(target, {
      x: "random(-30, 30)",
      y: "random(-20, 20)",
      rotationX: "random(-5, 5)",
      rotationY: "random(-5, 5)",
      duration: "random(6, 10)",
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });
  });
}

function stopCameraFloat() {
  const container = document.querySelector('.play-stage-container');
  const editorStage = document.querySelector('.editor-stage');
  
  [container, editorStage].forEach(target => {
    if(target) {
      gsap.killTweensOf(target);
      gsap.to(target, { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: 1.0 });
    }
  });
}

// 水中さざ波アニメーション
function startUnderwaterEffect() {
  const filter = document.querySelector('#displacementFilter feTurbulence');
  const playScreen = document.getElementById("playScreen");
  const editorScreen = document.getElementById("editorMainScreen");
  
  // 画面全体に歪みクラスを適用
  if (playScreen) playScreen.classList.add("distortion-effect");
  if (editorScreen) editorScreen.classList.add("distortion-effect");

  if (!filter) return;
  
  if (underwaterRafId) cancelAnimationFrame(underwaterRafId);
  
  let frame = 0;
  const loop = () => {
    frame++;
    // baseFrequencyをゆったり変化させて揺らぎを作る
    // 0.01付近で揺らす
    const freqX = 0.01 + 0.002 * Math.sin(frame * 0.005);
    const freqY = 0.02 + 0.005 * Math.cos(frame * 0.003);
    
    filter.setAttribute('baseFrequency', `${freqX} ${freqY}`);
    underwaterRafId = requestAnimationFrame(loop);
  };
  loop();
}

function stopUnderwaterEffect() {
  if (underwaterRafId) cancelAnimationFrame(underwaterRafId);
  underwaterRafId = null;
  
  const playScreen = document.getElementById("playScreen");
  const editorScreen = document.getElementById("editorMainScreen");
  if (playScreen) playScreen.classList.remove("distortion-effect");
  if (editorScreen) editorScreen.classList.remove("distortion-effect");
}
/* main.js の setStageTheme 関数を修正 */

export function setStageTheme(themeName) {
  const bgEl = document.getElementById("mainBg");
  const particlesEl = document.getElementById("spaceParticles");
  const burn = document.getElementById("burningParticles");
  const water = document.getElementById("underwaterOverlay");

  // 1. 全テーマのクラスとアクティブ状態をリセット
  bgEl.className = "bg"; // 一旦基本クラスのみにする
  
  if (particlesEl) { 
    particlesEl.classList.add("hidden"); 
    particlesEl.classList.remove("active"); 
  }
  if (burn) { 
    burn.classList.add("hidden"); 
    burn.classList.remove("active"); 
  }
  if (water) { 
    water.classList.add("hidden"); 
    water.classList.remove("active"); 
  }
  
  // 個別エフェクト(JSアニメーション)も停止
  stopCameraFloat();
  stopUnderwaterEffect();

  // 2. 指定されたテーマを適用
  switch (themeName) {
    case "space":
      bgEl.classList.add("ex-mode");
      // 星パーティクル
      if (particlesEl) {
        particlesEl.classList.remove("hidden");
        setTimeout(() => particlesEl.classList.add("active"), 50);
        // 星生成ロジック(初回のみ)
        if (particlesEl.children.length === 0) {
          for(let i=0; i<50; i++) {
            const s = document.createElement("div");
            s.className = "star";
            s.style.width = (Math.random()*3+1)+"px";
            s.style.height = s.style.width;
            s.style.left = Math.random()*100+"%";
            s.style.top = Math.random()*100+"%";
            s.style.animationDuration = (Math.random()*2+1)+"s";
            s.style.animationDelay = Math.random()*2+"s";
            particlesEl.appendChild(s);
          }
        }
      }
      startCameraFloat();
      break;

    case "cold":
      bgEl.classList.add("cold");
      break;

    case "dark_oak":
      bgEl.classList.add("dark-oak");
      break;

    case "burning":
      bgEl.classList.add("burning");
      if (burn) {
        burn.classList.remove("hidden");
        setTimeout(() => burn.classList.add("active"), 50);
      }
      break;

    case "underwater":
      bgEl.classList.add("underwater"); // 青いグラデーション
      if (water) {
        water.classList.remove("hidden");
        setTimeout(() => water.classList.add("active"), 50);
      }
      startUnderwaterEffect(); // さざ波アニメーション
      break;

    case "warm":
    default:
      // デフォルト(温暖)は追加クラスなし
      break;
  }
}
// EX用パーティクル制御（既存互換）
export function setSpaceBackground(enable) {
  const bgEl = document.getElementById("mainBg");
  const particlesEl = document.getElementById("spaceParticles");
  
  if (enable) {
    if (bgEl) bgEl.classList.add("ex-mode"); // 重複してもOK
    if (particlesEl) {
      particlesEl.classList.add("active");
      particlesEl.classList.remove("hidden");
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
    // 他のテーマが設定されている可能性があるので bgEl のクラスは勝手に消さないほうがいいが、
    // ここは setStageTheme から呼ばれることが多いので制御を任せる
    if (particlesEl) {
      particlesEl.classList.remove("active");
      setTimeout(() => particlesEl.classList.add("hidden"), 1500);
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

  // 画面遷移時のBGM/背景リセット
  if (name === "title") {
    startLogoIntro();
    playStageBgm("warm");
    setStageTheme("warm");
    updateTitleButtonsState(); // ★これを追加してください！
  } else if (name === "officialSelect" || name === "editorSelect") {
    playStageBgm("warm");
    setStageTheme("warm");
  } else if (name === "fanmadeSelect") {
    playStageBgm("speculation"); // FANMADE用BGM
    setStageTheme("warm"); // CSSで背景色が変わるためベースはWarmでOK
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

// タイトル画面ボタン イベントリスナー
const btnPlay = document.getElementById("btnPlay");
if (btnPlay) {
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

// FANMADE ボタン実装 (修正: ダミー呼び出し削除、本物呼び出し)
const btnFanmade = document.getElementById("btnFanmade");
if (btnFanmade) {
  btnFanmade.replaceWith(btnFanmade.cloneNode(true));
  document.getElementById("btnFanmade").addEventListener("click", () => {
    playChin();
    // editor.js で定義された global function を呼ぶ
    if (window.loadFanmadeLevels) {
      window.loadFanmadeLevels();
    }
    showScreen("fanmadeSelect");
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
  const vw = Math.max(320, window.innerWidth || 0);
  const vh = Math.max(320, window.innerHeight || 0);

  const maxW = Math.min(860, Math.floor(vw * 0.92));
  const ratio = img.naturalHeight / img.naturalWidth;

  let cssW = maxW;
  let cssH = Math.max(110, Math.floor(cssW * ratio));

  const maxH = Math.max(140, Math.floor(vh * 0.42));
  if (cssH > maxH) {
    cssH = maxH;
    cssW = Math.max(240, Math.floor(cssH / ratio));
  }

  logoCanvas.style.width = cssW + "px";
  logoCanvas.style.height = cssH + "px";
  logoCanvas.width = Math.floor(cssW * dpr);
  logoCanvas.height = Math.floor(cssH * dpr);
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

function updateTitleButtonsState() {
  const btnFanmade = document.getElementById("btnFanmade");
  const btnEditor = document.getElementById("btnEditor");
  
  if (!btnFanmade || !btnEditor) return;

  // 進行度を取得 (キーは editor.js と同じものを使用)
  const rawProgress = localStorage.getItem('3d_arrow_ball_progress');
  const progress = rawProgress ? JSON.parse(rawProgress) : {};

  // ステージ15 (index 15) がクリアされているか確認
  // ※ ステージ0から始まるため、ステージ15はキー "15" です
  const isUnlocked = progress['15'] !== undefined;

  if (isUnlocked) {
    btnFanmade.style.display = "flex"; // または block/inline-flex 等、元のCSSに合わせて
    btnEditor.style.display = "flex";
  } else {
    btnFanmade.style.display = "none";
    btnEditor.style.display = "none";
  }
}
const originalShowScreen = showScreen; // 既存の関数を退避（もし export していればその内部を書き換えても良い）

document.addEventListener("DOMContentLoaded", () => {
  updateTitleButtonsState();
});

// ▼▼▼ 追加: 設定モーダル内の削除ボタン処理 ▼▼▼
const btnGlobalResetMain = document.getElementById("btnGlobalResetMain");
const btnGlobalResetFan = document.getElementById("btnGlobalResetFan");

if (btnGlobalResetMain) {
  btnGlobalResetMain.addEventListener("click", () => {
    if (confirm("本当にメインステージの進行データを削除しますか？\n（クリア状況がリセットされます）")) {
      playChin();
      localStorage.removeItem('3d_arrow_ball_progress');
      localStorage.removeItem('3d_arrow_ball_ex_unlocked'); // EX開放フラグも削除
      alert("メイン進行データを削除しました。");
      updateTitleButtonsState(); // ボタンのロック状態を更新
    }
  });
}

if (btnGlobalResetFan) {
  btnGlobalResetFan.addEventListener("click", () => {
    if (confirm("創作レベルのクリア記録を削除しますか？")) {
      playChin();
      localStorage.removeItem('3d_arrow_ball_fanmade_progress');
      alert("創作レベルの記録を削除しました。");
    }
  });
}
startLogoIntro();