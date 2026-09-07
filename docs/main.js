/* main.js */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const soundBuffers = {};
let currentBgmNode = null;
let currentBgmGain = null;

const AUDIO_ASSETS = {
  warm: "./assets/bgm.ogg",
  vertex: "./assets/bgm_ex.ogg",
  wind: "./assets/bgm_2.ogg",
  speculation: "./assets/bgm_3.ogg",
  busy: "./assets/bgm_4.ogg",
  sublime: "./assets/bgm_5.ogg",
  boss: "./assets/boss.ogg",
  seChin: "./assets/chin.ogg",
  sePush2: "./assets/push2.ogg",
  seChange0: "./assets/direction0.ogg",
  seChange1: "./assets/direction1.ogg",
  seGoal: "./assets/goal.ogg",
  seBreak: "./assets/break.ogg",
  sePush: "./assets/push.ogg",
  seAllClear: "./assets/all_clear.ogg",
  seExSpawn: "./assets/ex_spawn.ogg",
  seDied: "./assets/died.ogg",
  seIgnite: "./assets/ignite.ogg",
  seDigestion: "./assets/digestion.ogg",
  seBomb: "./assets/bomb.ogg"
};

async function loadAllSounds() {
  const promises = Object.entries(AUDIO_ASSETS).map(async ([name, url]) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      soundBuffers[name] = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error(`Audio Load Error: ${name}`, e);
    }
  });
  await Promise.all(promises);
}

export function playSound(name, volumeScale = 1.0) {
  const volume = audioSettings.sfxVolume * volumeScale;
  if (volume <= 0 || !soundBuffers[name]) return null;

  if (audioCtx.state === 'suspended') audioCtx.resume();

  const source = audioCtx.createBufferSource();
  source.buffer = soundBuffers[name];

  const gainNode = audioCtx.createGain();
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start(0);
  return source;
}

export const audioSettings = {
  bgmVolume: 0.3,
  sfxVolume: 0.5,
  autoSaveInterval: 0,
  keepTileState: false,
  showTrail: true
};

let globalGlitchTarget = 0;
let globalGlitchCurrent = 0;
let globalGlitchPulse = null;
let globalGlitchFrameId = 0;
let globalGlitchRenderer = null;

function initGlobalGlitchRenderer() {
  const canvas = document.getElementById("globalGlitchCanvas");
  if (!canvas || globalGlitchRenderer) return globalGlitchRenderer;

  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true
  });
  if (!gl) {
    document.documentElement.classList.add("no-webgl-glitch");
    return null;
  }

  const vertexSource = `#version 300 es
    precision highp float;
    out vec2 vUv;
    void main() {
      vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
      vUv = p;
      gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
    }`;
  const fragmentSource = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 outColor;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uSeed;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      float tick = floor(uTime * 26.0);
      float row = floor(uv.y * 74.0);
      float rowNoise = hash(vec2(row + uSeed, tick));
      float tear = step(1.0 - uIntensity * 0.5, rowNoise);
      float tearEdge = smoothstep(0.0, 0.018, fract(uv.y * 74.0))
        * (1.0 - smoothstep(0.018, 0.045, fract(uv.y * 74.0)));

      vec2 blockCell = floor(uv * vec2(22.0, 48.0));
      float blockNoise = hash(blockCell + vec2(tick, uSeed));
      float block = step(0.9 - uIntensity * 0.12, blockNoise)
        * step(0.52, hash(vec2(blockCell.y, tick + 7.0)));

      float grain = hash(gl_FragCoord.xy + vec2(tick * 17.0, uSeed * 29.0));
      float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * 2.35);
      float rgbSplit = tear * (0.35 + 0.65 * hash(vec2(row, tick + 3.0)));
      float flash = step(0.986, hash(vec2(tick, uSeed + 19.0)));

      vec3 color = vec3(0.0);
      color += vec3(0.05, 0.88, 1.0) * rgbSplit * (0.18 + tearEdge * 0.48);
      color += vec3(1.0, 0.08, 0.55) * rgbSplit * (0.12 + (1.0 - tearEdge) * 0.36);
      color += mix(vec3(0.18, 0.02, 0.3), vec3(0.56, 0.16, 0.92), grain)
        * block * 0.38;
      color += vec3(0.42, 0.2, 0.72) * scan * 0.035;
      color += vec3(0.7, 0.85, 1.0) * flash * 0.16;

      float alpha = uIntensity * (
        rgbSplit * 0.28
        + block * 0.18
        + scan * 0.018
        + flash * 0.12
      );
      outColor = vec4(color * uIntensity, clamp(alpha, 0.0, 0.5));
    }`;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Global glitch shader error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Global glitch program error:", gl.getProgramInfoLog(program));
    return;
  }

  const timeLocation = gl.getUniformLocation(program, "uTime");
  const resolutionLocation = gl.getUniformLocation(program, "uResolution");
  const intensityLocation = gl.getUniformLocation(program, "uIntensity");
  const seedLocation = gl.getUniformLocation(program, "uSeed");
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(innerWidth * dpr));
    const height = Math.max(1, Math.round(innerHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  canvas.dataset.renderer = "webgl2";
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const render = now => {
    let pulseIntensity = 0;
    if (globalGlitchPulse) {
      const progress = Math.min(1, (now - globalGlitchPulse.startedAt) / globalGlitchPulse.duration);
      if (progress < 0.12) {
        const attack = progress / 0.12;
        pulseIntensity = globalGlitchPulse.intensity * attack * attack;
      } else if (progress < 0.55) {
        pulseIntensity = globalGlitchPulse.intensity;
      } else if (progress < 1) {
        const release = 1 - (progress - 0.55) / 0.45;
        pulseIntensity = globalGlitchPulse.intensity * release * release;
      } else {
        globalGlitchPulse = null;
        document.documentElement.classList.remove("glitch-pulse-active");
      }
    }

    const desiredIntensity = Math.max(globalGlitchTarget, pulseIntensity);
    const response = desiredIntensity > globalGlitchCurrent ? 0.32 : 0.16;
    globalGlitchCurrent += (desiredIntensity - globalGlitchCurrent) * response;
    if (Math.abs(desiredIntensity - globalGlitchCurrent) < 0.001) {
      globalGlitchCurrent = desiredIntensity;
    }

    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (globalGlitchCurrent > 0.001) {
      gl.uniform1f(timeLocation, now * 0.001);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(intensityLocation, globalGlitchCurrent);
      gl.uniform1f(seedLocation, globalGlitchPulse?.seed || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    canvas.classList.toggle("active", globalGlitchCurrent > 0.008);
    if (globalGlitchCurrent > 0.001 || desiredIntensity > 0 || globalGlitchPulse) {
      globalGlitchFrameId = requestAnimationFrame(render);
    } else {
      globalGlitchFrameId = 0;
    }
  };

  globalGlitchRenderer = { canvas, gl, render };
  return globalGlitchRenderer;
}

function wakeGlobalGlitchRenderer() {
  const renderer = initGlobalGlitchRenderer();
  if (renderer && !globalGlitchFrameId) {
    globalGlitchFrameId = requestAnimationFrame(renderer.render);
  }
}

export function setGlobalGlitchTarget(value = 0) {
  globalGlitchTarget = Math.max(0, Math.min(1, Number(value) || 0));
  wakeGlobalGlitchRenderer();
}

export function triggerGlobalGlitchPulse(intensity = 0.72, duration = 820) {
  const safeIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
  const safeDuration = Math.max(180, Number(duration) || 820);
  globalGlitchPulse = {
    intensity: safeIntensity,
    duration: safeDuration,
    startedAt: performance.now(),
    seed: Math.random() * 1000
  };
  document.documentElement.classList.remove("glitch-pulse-active");
  void document.documentElement.offsetWidth;
  document.documentElement.classList.add("glitch-pulse-active");
  wakeGlobalGlitchRenderer();
}

initGlobalGlitchRenderer();


export const screens = {
  title: document.getElementById("titleScreen"),
  play: document.getElementById("playScreen"),
  editorSelect: document.getElementById("editorSelectScreen"),
  editorMain: document.getElementById("editorMainScreen"),
  officialSelect: document.getElementById("officialSelectScreen"),
  fanmadeSelect: document.getElementById("fanmadeSelectScreen") // 追加

};

const PATCH_NOTES = [
  {
    version: "1.8.0",
    date: "2026/09/08",
    sub: "Sanctuary Update",
    content: [
      "エリア：聖域を追加"
    ]
  },
  {
    version: "1.4.0",
    date: "2026/07/24",
    sub: "Editor & Gameplay Evolution Update",
    content: [
      "盤面ホイールによるタイル・向き・数値のクイック切替を実装",
      "同種タイルのクリック編集と、モバイルのドラッグ配置を改善",
      "詰まり検知と10分ごとのヒント案内を追加",
      "ジャンプ台を美しい放物線軌道へ刷新し、場外ジャンプを修正",
      "ワープタイルに接続先を示すカラーラインを追加",
      "STAGE 9・16・25・29にミニボス演出を追加",
      "STAGE 2・3・5・7のチュートリアルとヒントを拡充",
      "EXTRA 8・9を難易度順に入れ替え",
      "大きな盤面の見切れ、Undo履歴、複数ゴールなど多数の不具合を修正"
    ]
  },
  {
    version: "1.3.4",
    date: "2026/02/03",
    sub: "---",
    content: [
      "音に関する問題の修正"
    ]
  },
  {
    version: "1.3.3",
    date: "2026/02/01",
    sub: "Replay,Trail Added",
    content: [
      "リプレイ機能を追加",
      "ボールのトレイルを追加",
      "UIの色を一部分変更"
    ]
  },
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
const STORAGE_KEY_PROJECT_SPLASH = '3d_arrow_ball_project_splash_at';
const PROJECT_SPLASH_INTERVAL = 60 * 60 * 1000;

const bgms = {
  warm: document.getElementById("bgm"),
  vertex: document.getElementById("bgmEx"),
  wind: document.getElementById("bgm2"),
  speculation: document.getElementById("bgm3"),
  busy: document.getElementById("bgm4"),
  sublime: document.getElementById("bgm5")
};

const seChin = document.getElementById("seChin");
const sePush2 = document.getElementById("sePush2");

let isBgmPlaying = false;
let currentBgmKey = null;

let underwaterRafId = null;
let bgmFadeInterval = null;

const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
const savedVol = localStorage.getItem('3d_arrow_ball_volume'); // 後方互換

if (savedSettings) {
  try {
    const parsed = JSON.parse(savedSettings);
    if (parsed.bgm !== undefined) audioSettings.bgmVolume = parsed.bgm;
    if (parsed.sfx !== undefined) audioSettings.sfxVolume = parsed.sfx;
    if (parsed.autoSave !== undefined) audioSettings.autoSaveInterval = parsed.autoSave;
    if (parsed.keepTileState !== undefined) audioSettings.keepTileState = parsed.keepTileState;
    if (parsed.showTrail !== undefined) audioSettings.showTrail = parsed.showTrail;
  } catch (e) { }
} else if (savedVol) {
  try {
    const parsed = JSON.parse(savedVol);
    audioSettings.bgmVolume = parsed.bgm;
    audioSettings.sfxVolume = parsed.sfx;
  } catch (e) { }
}

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
const chkShowTrail = document.getElementById("chkShowTrail");

if (btnTitleSettings) {
  btnTitleSettings.addEventListener("click", () => {
    if (volBgmSlider) volBgmSlider.value = audioSettings.bgmVolume;
    if (volSfxSlider) volSfxSlider.value = audioSettings.sfxVolume;
    if (globalAutoSaveSlider) {
      globalAutoSaveSlider.value = audioSettings.autoSaveInterval;
      if (globalAutoSaveVal) globalAutoSaveVal.textContent = audioSettings.autoSaveInterval == 0 ? "OFF" : audioSettings.autoSaveInterval + "分";
    }
    if (chkKeepTileState) chkKeepTileState.checked = audioSettings.keepTileState;
    if (chkShowTrail) chkShowTrail.checked = audioSettings.showTrail;

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

if (volBgmSlider) {
  volBgmSlider.addEventListener("input", (e) => {
    audioSettings.bgmVolume = parseFloat(e.target.value);
    updateAllVolumes();
  });
}
if (volSfxSlider) {
  volSfxSlider.addEventListener("input", (e) => {
    audioSettings.sfxVolume = parseFloat(e.target.value);
    saveGlobalSettings();
  });
}
if (globalAutoSaveSlider) {
  globalAutoSaveSlider.addEventListener("input", (e) => {
    audioSettings.autoSaveInterval = parseInt(e.target.value, 10);
    if (globalAutoSaveVal) globalAutoSaveVal.textContent = audioSettings.autoSaveInterval == 0 ? "OFF" : audioSettings.autoSaveInterval + "分";
    saveGlobalSettings();
  });
}
if (chkKeepTileState) {
  chkKeepTileState.addEventListener("click", (e) => {
    if (e.target.checked) {
      e.preventDefault();
      e.target.checked = false;
      playChin();
      keepStateWarningModal.showModal();
    } else {
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
    if (chkKeepTileState) chkKeepTileState.checked = true;
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
    keepTileState: audioSettings.keepTileState
  }));
  localStorage.setItem('3d_arrow_ball_volume', JSON.stringify({
    bgm: audioSettings.bgmVolume,
    sfx: audioSettings.sfxVolume
  }));
}

export function updateAllVolumes() {
  if (currentBgmGain) {
    currentBgmGain.gain.setTargetAtTime(audioSettings.bgmVolume, audioCtx.currentTime, 0.1);
  }

  if (audioSettings.bgmVolume <= 0) {
    stopAllBgm();
  } else if (!currentBgmNode && currentBgmKey) {
    playStageBgm(currentBgmKey);
  }
  saveGlobalSettings();
}

function tryPlayBgm() {
  if (!isBgmPlaying) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playStageBgm("warm");
    isBgmPlaying = true;
  }
}
window.addEventListener("click", tryPlayBgm, { once: true });
window.addEventListener("touchstart", tryPlayBgm, { once: true }); // スマホ対応強化

export function playChin() {
  playSound('seChin');
}
function checkUpdateAndNavigate(targetScreenName) {
  const latestVersion = PATCH_NOTES[0].version;
  const lastPlayedVersion = localStorage.getItem(STORAGE_KEY_VERSION);

  if (!lastPlayedVersion) {
    localStorage.setItem(STORAGE_KEY_VERSION, latestVersion);
    playChin();
    showScreen(targetScreenName, true);
  } else if (lastPlayedVersion !== latestVersion) {
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
    sePush2.play().catch(() => { });
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

let fadeTimers = {};

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function stopAllBgm() {
  if (currentBgmNode) {
    try {
      currentBgmNode.stop();
    } catch (e) { }
    currentBgmNode = null;
    currentBgmGain = null;
  }
}

export function fadeOutStageBgm(duration = 0.65) {
  const fadeDuration = Math.max(0.05, Number(duration) || 0.65);
  const oldNode = currentBgmNode;
  const oldGain = currentBgmGain;
  currentBgmNode = null;
  currentBgmGain = null;
  currentBgmKey = null;

  if (!oldNode) return;
  if (!oldGain) {
    try { oldNode.stop(); } catch (e) { }
    return;
  }

  const now = audioCtx.currentTime;
  const currentValue = Math.max(0.0001, oldGain.gain.value);
  oldGain.gain.cancelScheduledValues(now);
  oldGain.gain.setValueAtTime(currentValue, now);
  oldGain.gain.linearRampToValueAtTime(0, now + fadeDuration);
  setTimeout(() => {
    try { oldNode.stop(); } catch (e) { }
  }, (fadeDuration + 0.08) * 1000);
}

function getStageBgmLoopEnd(themeKey, buffer) {
  if (!['busy', 'sublime'].includes(themeKey)) return buffer.duration;
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  let last = buffer.length - 1;
  while (last >= 0 && channels.every(channel => Math.abs(channel[last]) < 0.001)) last--;
  if (last < 0) return buffer.duration;
  return Math.min(buffer.duration, (last + 1) / buffer.sampleRate + 0.05);
}

export function playStageBgm(themeKey) {
  if (!themeKey) themeKey = "warm";

  if (audioSettings.bgmVolume <= 0) {
    currentBgmKey = themeKey;
    return;
  }

  if (currentBgmKey === themeKey && currentBgmNode) return;

  const fadeDuration = 1.35;
  const now = audioCtx.currentTime;

  if (currentBgmGain && currentBgmNode) {
    const oldGain = currentBgmGain;
    const oldNode = currentBgmNode;
    const currentValue = Math.max(0.0001, oldGain.gain.value);
    oldGain.gain.cancelScheduledValues(now);
    oldGain.gain.setValueAtTime(currentValue, now);
    oldGain.gain.linearRampToValueAtTime(0, now + fadeDuration);
    setTimeout(() => {
      try { oldNode.stop(); } catch (e) { }
    }, (fadeDuration + 0.1) * 1000);
  }

  currentBgmKey = themeKey;
  if (!soundBuffers[themeKey]) return;

  const source = audioCtx.createBufferSource();
  source.buffer = soundBuffers[themeKey];
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = getStageBgmLoopEnd(themeKey, source.buffer);
  source.onended = () => {
    if (currentBgmNode !== source || currentBgmKey !== themeKey) return;
    currentBgmNode = null;
    currentBgmGain = null;
    if (audioSettings.bgmVolume > 0) playStageBgm(themeKey);
  };

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(audioSettings.bgmVolume, now + fadeDuration);

  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start(0);

  currentBgmNode = source;
  currentBgmGain = gainNode;
}
export function fadeBgmToEx() {
  playStageBgm("vertex");
}
export function fadeBgmToNormal() {
  playStageBgm("warm");
}

function startCameraFloat() {
  const container = document.querySelector('.play-stage-container');
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
    if (target) {
      gsap.killTweensOf(target);
      gsap.to(target, { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: 1.0 });
    }
  });
}

function startUnderwaterEffect() {
  const filter = document.querySelector('#displacementFilter feTurbulence');
  const playScreen = document.getElementById("playScreen");
  const editorScreen = document.getElementById("editorMainScreen");

  if (playScreen) playScreen.classList.add("distortion-effect");
  if (editorScreen) editorScreen.classList.add("distortion-effect");

  if (!filter) return;

  if (underwaterRafId) cancelAnimationFrame(underwaterRafId);

  let startedAt = performance.now();
  let lastPaintAt = 0;
  const loop = (now) => {
    if (!document.hidden && now - lastPaintAt >= 33) {
      const elapsed = (now - startedAt) / 1000;
      const freqX = 0.01 + 0.002 * Math.sin(elapsed * 0.30);
      const freqY = 0.02 + 0.005 * Math.cos(elapsed * 0.18);
      filter.setAttribute('baseFrequency', `${freqX.toFixed(5)} ${freqY.toFixed(5)}`);
      lastPaintAt = now;
    }
    underwaterRafId = requestAnimationFrame(loop);
  };
  underwaterRafId = requestAnimationFrame(loop);
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

let dlcScene, dlcCamera, dlcRenderer;
let dlcPillars = [];
let dlcRafId = null;
let dlcRenderMode = "sanctuary";


function initDlcThreeJs(mode = "sanctuary") {
  if (!window.THREE) return;
  const container = document.getElementById("dlc3dLayer");
  if (!container) return;

  if (dlcRenderer) {
    stopDlcThreeJs();
  }

  const width = container.clientWidth;
  const height = container.clientHeight;

  dlcRenderMode = mode;
  const isBossMode = mode === "boss";
  dlcScene = new THREE.Scene();
  const fogColor = new THREE.Color(isBossMode ? 0x170408 : 0x12252e);
  dlcScene.fog = new THREE.FogExp2(fogColor.getHex(), 0.02);

  dlcCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  dlcCamera.position.set(0, 15, 60);
  dlcCamera.lookAt(0, -15, -60);

  const deviceMemory = Number(navigator.deviceMemory || 4);
  const useAntialias = (window.devicePixelRatio || 1) <= 1.5 && deviceMemory >= 4;
  dlcRenderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: useAntialias
  });
  const pixelRatioCap = deviceMemory <= 4 ? 1.25 : 1.6;
  dlcRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  dlcRenderer.setSize(width, height);
  dlcRenderer.domElement.style.width = "100%";
  dlcRenderer.domElement.style.height = "100%";
  container.appendChild(dlcRenderer.domElement);

  const pillarMaterial = new THREE.ShaderMaterial({
    uniforms: {
      colorBottom: { value: new THREE.Color(isBossMode ? 0x180307 : 0x0d1a21) },
      colorTop: { value: new THREE.Color(isBossMode ? 0xb32638 : 0x38606b) },
      fogColor: { value: fogColor },
      fogDensity: { value: 0.02 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vDist;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal); // ビュー空間での法線
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDist = length(mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 colorBottom;
      uniform vec3 colorTop;
      uniform vec3 fogColor;
      uniform float fogDensity;
      varying vec2 vUv;
      varying float vDist;
      varying vec3 vNormal;
      
      void main() {
        vec3 baseColor = mix(colorBottom, colorTop, vUv.y * 1.2);
        
        float faceLight = 1.0;
        if (vNormal.y > 0.5) {
           faceLight = 1.3; // 明るく
        } 
        else if (abs(vNormal.x) > 0.5) {
           faceLight = 0.9; // 少し暗く
        } 
        else {
           faceLight = 0.7; // 暗く
        }
        
        vec3 litColor = baseColor * faceLight;
        
        float fogFactor = 1.0 - exp( - ( fogDensity * vDist ) * ( fogDensity * vDist ) );
        fogFactor = clamp(fogFactor, 0.0, 1.0);
        
        vec3 finalColor = mix(litColor, fogColor, fogFactor);
        
        float alpha = smoothstep(0.0, 0.2, vUv.y); 
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);

  dlcPillars = [];
  const pillarCount = 20;

  for (let i = 0; i < pillarCount; i++) {
    const mesh = new THREE.Mesh(geometry, pillarMaterial);

    let x, z;
    if (Math.random() < 0.1) {
      const xDir = Math.random() < 0.5 ? 1 : -1;
      x = xDir * (35 + Math.random() * 60);
      z = -20 + Math.random() * 70;
    } else {
      x = (Math.random() - 0.5) * 300;
      z = -40 - Math.random() * 150;
    }

    const distFromCenter = Math.sqrt(x * x + z * z);
    const heightLimitFactor = Math.max(0.3, 1.0 - (distFromCenter / 250));

    const w = 5 + Math.random() * 8;
    const h = (60 + Math.random() * 120) * heightLimitFactor;

    mesh.scale.set(w, h, w);

    const yOffset = (z > 0) ? -20 : 0;
    const y = -40 - Math.random() * 50 + yOffset;

    mesh.position.set(x, y, z);

    mesh.userData = {
      baseY: y,
      speed: 0.002 + Math.random() * 0.003,
      offset: Math.random() * 100
    };

    dlcScene.add(mesh);
    dlcPillars.push(mesh);
  }

  window.addEventListener('resize', onDlcResize);
  animateDlc();
}

function stopDlcThreeJs() {
  if (dlcRafId) cancelAnimationFrame(dlcRafId);
  dlcRafId = null;
  window.removeEventListener('resize', onDlcResize);

  if (dlcRenderer) {
    const container = document.getElementById("dlc3dLayer");
    if (container) container.innerHTML = "";

    dlcRenderer.dispose();
    if (dlcScene) {
      const geometries = new Set();
      const materials = new Set();
      dlcScene.traverse((obj) => {
        if (obj.geometry) geometries.add(obj.geometry);
        if (Array.isArray(obj.material)) obj.material.forEach(material => materials.add(material));
        else if (obj.material) materials.add(obj.material);
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
    }
  }
  dlcRenderer = null;
  dlcScene = null;
  dlcCamera = null;
  dlcPillars = [];
}

function onDlcResize() {
  if (!dlcCamera || !dlcRenderer) return;
  const container = document.getElementById("dlc3dLayer");
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  dlcCamera.aspect = width / height;
  dlcCamera.updateProjectionMatrix();
  dlcRenderer.setSize(width, height);
}

function animateDlc() {
  if (!dlcRenderer || !dlcScene || !dlcCamera) return;

  const time = Date.now() * 0.001;

  dlcPillars.forEach(mesh => {
    mesh.position.y = mesh.userData.baseY + Math.sin(time * 0.5 + mesh.userData.offset) * 2.0;
  });

  dlcCamera.position.x = Math.sin(time * 0.1) * 5;
  dlcCamera.lookAt(0, -15, -60);

  dlcRenderer.render(dlcScene, dlcCamera);
  dlcRafId = requestAnimationFrame(animateDlc);
}


export function setShowDlcPillars(enable, mode = "sanctuary") {
  const dlcLayer = document.getElementById("dlc3dLayer");
  if (!dlcLayer) return;

  if (enable) {
    dlcLayer.classList.remove("hidden");
    setTimeout(() => dlcLayer.classList.add("active"), 50);
    if (!dlcRenderer || dlcRenderMode !== mode) initDlcThreeJs(mode);
  } else {
    dlcLayer.classList.remove("active");
    setTimeout(() => {
      if (!dlcLayer.classList.contains("active")) {
        dlcLayer.classList.add("hidden");
      }
    }, 1500); // フェードアウト待ち
    stopDlcThreeJs();
  }
}
export function setStageTheme(themeName) {
  const bgEl = document.getElementById("mainBg");
  const particlesEl = document.getElementById("spaceParticles");
  const burn = document.getElementById("burningParticles");
  const water = document.getElementById("underwaterOverlay");

  bgEl.className = "bg";

  [particlesEl, burn, water].forEach(el => {
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("active");
    }
  });

  stopCameraFloat();
  stopUnderwaterEffect();

  switch (themeName) {
    case "space":
      bgEl.classList.add("ex-mode");
      if (particlesEl) {
        particlesEl.classList.remove("hidden");
        setTimeout(() => particlesEl.classList.add("active"), 50);
        if (particlesEl.children.length === 0) {
          for (let i = 0; i < 50; i++) {
            const s = document.createElement("div");
            s.className = "star";
            s.style.width = (Math.random() * 3 + 1) + "px";
            s.style.height = s.style.width;
            s.style.left = Math.random() * 100 + "%";
            s.style.top = Math.random() * 100 + "%";
            s.style.animationDuration = (Math.random() * 2 + 1) + "s";
            s.style.animationDelay = Math.random() * 2 + "s";
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
      bgEl.classList.add("underwater");
      if (water) {
        water.classList.remove("hidden");
        setTimeout(() => water.classList.add("active"), 50);
      }
      startUnderwaterEffect();
      break;

    case "dlc_world":
      bgEl.classList.add("dlc-world");
      break;

    case "boss_world":
      bgEl.classList.add("boss-world");
      break;

    case "warm":
    default:
      break;
  }
}
export function setSpaceBackground(enable) {
  const bgEl = document.getElementById("mainBg");
  const particlesEl = document.getElementById("spaceParticles");

  if (enable) {
    if (bgEl) bgEl.classList.add("ex-mode"); // 重複してもOK
    if (particlesEl) {
      particlesEl.classList.add("active");
      particlesEl.classList.remove("hidden");
      if (particlesEl.children.length === 0) {
        for (let i = 0; i < 50; i++) {
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
    if (particlesEl) {
      particlesEl.classList.remove("active");
      setTimeout(() => particlesEl.classList.add("hidden"), 1500);
    }
  }
}

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
    if (s) {
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
  if (logo) { logo.style.transform = ""; logo.style.opacity = ""; }
  if (menu) { menu.style.transform = ""; menu.style.opacity = ""; }

  if (screens[name]) {
    if (name !== 'title' && name !== 'play') {
      screens[name].classList.add("ui-enter-active");
    }
    screens[name].classList.add("screen--active");
    if (name !== 'title' && name !== 'play') {
      setTimeout(() => {
        if (screens[name]?.classList.contains("screen--active")) {
          screens[name].classList.remove("ui-enter-active");
        }
      }, 760);
    }
  }

  if (name === "title") {
    setGlobalGlitchTarget(0);
    startLogoIntro();
    playStageBgm("warm");
    setStageTheme("warm");
    setShowDlcPillars(false);
    updateTitleButtonsState();
  } else if (name === "officialSelect") {
    const requestedMood = screens.officialSelect?.dataset.restoreZone ||
      (screens.officialSelect?.dataset.restoreExMood === "true" ? "ex" : "main");
    const keepZoneMood = requestedMood === "ex" || requestedMood === "sanctuary";
    if (!keepZoneMood) {
      screens.officialSelect?.classList.remove(
        "near-ex-zone",
        "near-sanctuary-zone",
        "ex-glitch-pulse",
        "sanctuary-zone-pulse",
        "ex-awakening",
        "finale-scan",
        "finale-blackout",
        "finale-locked"
      );
    }
    setGlobalGlitchTarget(0);
    screens.officialSelect?.classList.toggle("near-ex-zone", requestedMood === "ex");
    screens.officialSelect?.classList.toggle("near-sanctuary-zone", requestedMood === "sanctuary");
    playStageBgm(requestedMood === "sanctuary" ? "sublime" : requestedMood === "ex" ? "vertex" : "warm");
    setStageTheme(requestedMood === "sanctuary" ? "dlc_world" : requestedMood === "ex" ? "space" : "warm");
    setShowDlcPillars(requestedMood === "sanctuary");
  } else if (name === "editorSelect") {
    setGlobalGlitchTarget(0);
    playStageBgm("warm");
    setStageTheme("warm");
    setShowDlcPillars(false);
  } else if (name === "fanmadeSelect") {
    setGlobalGlitchTarget(0);
    playStageBgm("speculation");
    setStageTheme("warm");
    setShowDlcPillars(false);
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

const btnFanmade = document.getElementById("btnFanmade");
if (btnFanmade) {
  btnFanmade.replaceWith(btnFanmade.cloneNode(true));
  document.getElementById("btnFanmade").addEventListener("click", () => {
    playChin();
    performFanmadeTransition();
  });
}

let fanmadeTransitionRunning = false;
function performFanmadeTransition() {
  if (fanmadeTransitionRunning) return;
  fanmadeTransitionRunning = true;

  const transition = document.createElement("div");
  transition.className = "fan-portal-transition";
  transition.setAttribute("aria-hidden", "true");
  transition.innerHTML = `
    <div class="fan-portal-ring"><i></i><i></i><i></i></div>
    <div class="fan-portal-copy">
      <span>COMMUNITY SIGNAL</span>
      <strong>FAN LEVELS</strong>
    </div>
  `;
  document.body.appendChild(transition);
  screens.title?.classList.add("fan-warp-out");
  setGlobalGlitchTarget(0.3);

  requestAnimationFrame(() => transition.classList.add("active"));
  setTimeout(() => {
    if (window.loadFanmadeLevels) window.loadFanmadeLevels();
    _switchScreen("fanmadeSelect");
    transition.classList.add("revealing");
  }, 720);
  setTimeout(() => {
    transition.classList.add("finished");
    screens.title?.classList.remove("fan-warp-out");
    setGlobalGlitchTarget(0);
  }, 1160);
  setTimeout(() => {
    transition.remove();
    fanmadeTransitionRunning = false;
  }, 1650);
}

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
  setTimeout(async () => {
    try {
      if (callback) await callback();
    } catch (error) {
      console.error("Loading callback failed:", error);
    }
    setTimeout(() => { overlay.classList.remove("active"); }, 300);
  }, duration);
}

const logoFallback = document.getElementById("logoFallback");
let titleIntroTimer = 0;
window.startLogoIntro = function () {
  clearTimeout(titleIntroTimer);
  if (logoFallback) logoFallback.style.display = "block";
  screens.title.classList.remove("is-logo-done");
  screens.title.classList.add("is-logo-running");
  void screens.title.offsetWidth;
  titleIntroTimer = window.setTimeout(() => {
    screens.title.classList.remove("is-logo-running");
    screens.title.classList.add("is-logo-done");
  }, 950);
};

function finishProjectSplash(splash) {
  splash.classList.add("is-leaving");
  window.setTimeout(() => {
    splash.classList.remove("is-active", "is-leaving");
    splash.setAttribute("aria-hidden", "true");
    document.body.classList.remove("splash-active");
    startLogoIntro();
  }, 720);
}

function runBootSequence() {
  const splash = document.getElementById("projectSplash");
  const now = Date.now();
  const lastShown = Number(localStorage.getItem(STORAGE_KEY_PROJECT_SPLASH) || 0);
  const shouldShow = !!splash && now - lastShown >= PROJECT_SPLASH_INTERVAL;

  if (!localStorage.getItem(STORAGE_KEY_VERSION)) {
    localStorage.setItem(STORAGE_KEY_VERSION, PATCH_NOTES[0].version);
  }

  if (!shouldShow) {
    if (splash) splash.setAttribute("aria-hidden", "true");
    startLogoIntro();
    return;
  }

  localStorage.setItem(STORAGE_KEY_PROJECT_SPLASH, String(now));
  document.body.classList.add("splash-active");
  splash.setAttribute("aria-hidden", "false");
  splash.classList.add("is-active");

  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1300 : 5200;
  window.setTimeout(() => finishProjectSplash(splash), duration);
}

function updateTitleButtonsState() {
  const btnFanmade = document.getElementById("btnFanmade");
  const btnEditor = document.getElementById("btnEditor");

  if (!btnFanmade || !btnEditor) return;

  const rawProgress = localStorage.getItem('3d_arrow_ball_progress');
  let progress = {};
  try {
    progress = rawProgress ? JSON.parse(rawProgress) : {};
  } catch {
    progress = {};
  }

  const isUnlocked = Array.isArray(progress)
    ? progress.map(Number).includes(15)
    : Object.prototype.hasOwnProperty.call(progress, '15');

  [btnFanmade, btnEditor].forEach(button => {
    button.hidden = !isUnlocked;
    button.style.display = isUnlocked ? "flex" : "none";
    button.setAttribute("aria-hidden", String(!isUnlocked));
    button.tabIndex = isUnlocked ? 0 : -1;
  });
}
updateTitleButtonsState();
const originalShowScreen = showScreen; // 既存の関数を退避（もし export していればその内部を書き換えても良い）

document.addEventListener("DOMContentLoaded", () => {
  loadAllSounds();
  updateTitleButtonsState();
});


const btnGlobalResetMain = document.getElementById("btnGlobalResetMain");
const btnGlobalResetFan = document.getElementById("btnGlobalResetFan");

if (btnGlobalResetMain) {
  btnGlobalResetMain.addEventListener("click", () => {
    if (confirm("本当にメインステージの進行データを削除しますか？\n（クリア状況・EX/聖域の開放状態がリセットされます）")) {
      playChin();
      localStorage.removeItem('3d_arrow_ball_progress');
      localStorage.removeItem('3d_arrow_ball_ex_unlocked');

      localStorage.removeItem('3d_arrow_ball_dlc_unlocked');
      localStorage.removeItem('3d_arrow_ball_guardian_progress');
      localStorage.removeItem('3d_arrow_ball_sanctuary_clear_shown');

      alert("メイン進行データを削除しました。");
      updateTitleButtonsState();

      if (typeof window.loadOfficialLevels === 'function') {
        window.loadOfficialLevels();
      }
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
runBootSequence();


document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
}, { passive: false });

document.addEventListener('selectstart', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

  e.preventDefault();
});


// Mobile/iPad: prevent browser double-tap zoom without affecting form fields.
(() => {
  const isEditableTarget = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  };

  let lastTouchEndAt = 0;
  let lastTouchX = 0;
  let lastTouchY = 0;

  document.addEventListener('touchend', (event) => {
    if (isEditableTarget(event.target)) return;
    if (event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const now = performance.now();
    const elapsed = now - lastTouchEndAt;
    const distance = Math.hypot(touch.clientX - lastTouchX, touch.clientY - lastTouchY);

    // 同じ付近を短時間で2回タップした場合のみブラウザのズームを抑止。
    if (elapsed > 0 && elapsed < 360 && distance < 36) {
      event.preventDefault();
      lastTouchEndAt = 0;
      return;
    }

    lastTouchEndAt = now;
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
  }, { passive: false, capture: true });

  document.addEventListener('dblclick', (event) => {
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
  }, { passive: false, capture: true });

  // iOS Safari のジェスチャーズームもゲーム画面上では抑止。
  document.addEventListener('gesturestart', (event) => {
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
  }, { passive: false });
})();
