// Звуковые эффекты PyDungeon: короткие синтезированные сигналы без файлов.
// Настройки читаются из pyquiz_settings_v1 (их пишет меню), поэтому звук
// работает и на стартовом экране, и в игре без общего состояния.
//
// Контекст создаётся только по первому действию игрока: браузеры не дают
// запускать звук до клика, а тишина в этот момент выглядит как поломка.
(function () {
  "use strict";
  const KEY = "pyquiz_settings_v1";
  let ctx = null;
  let lastClick = 0;

  function readSettings() {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : null;
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return {};
    }
  }

  function soundOn() {
    return readSettings().sound !== false;
  }

  function volume() {
    const v = Number(readSettings().volume);
    if (!Number.isFinite(v)) return 0.6;
    return Math.max(0, Math.min(1, v));
  }

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") {
        const p = ctx.resume();
        if (p && p.catch) p.catch(() => {});
      }
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  // Одна нота: короткая атака, экспоненциальное затухание. Громкость уже
  // умножена на настройку игрока.
  function tone(freq, dur, type, gain, delay) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const amp = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    const peak = Math.max(0.0001, gain * volume());
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  const PATCHES = {
    click: [[520, 0.05, "triangle", 0.16, 0]],
    correct: [[660, 0.09, "sine", 0.2, 0], [990, 0.14, "sine", 0.16, 0.07]],
    wrong: [[190, 0.16, "sawtooth", 0.14, 0], [140, 0.22, "sawtooth", 0.1, 0.08]],
    victory: [
      [523, 0.12, "triangle", 0.18, 0],
      [659, 0.12, "triangle", 0.18, 0.1],
      [784, 0.14, "triangle", 0.18, 0.2],
      [1046, 0.3, "triangle", 0.2, 0.3]
    ],
    death: [
      [220, 0.2, "sawtooth", 0.16, 0],
      [165, 0.26, "sawtooth", 0.14, 0.12],
      [110, 0.4, "sawtooth", 0.12, 0.26]
    ]
  };

  function play(name) {
    if (!soundOn() || !PATCHES[name]) return;
    // Не больше одного клика за 40 мс: иначе быстрые нажатия дают треск.
    const now = Date.now();
    if (name === "click" && now - lastClick < 40) return;
    lastClick = now;
    PATCHES[name].forEach((note) => tone(note[0], note[1], note[2], note[3], note[4]));
  }

  window.PySound = {
    play: play,
    unlock: ensure,
    enabled: soundOn
  };
})();
