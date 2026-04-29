// Web Speech API wrapper. Free, no backend, works on iPad Safari.
window.SND = (() => {
  let voiceEn = null, voiceJa = null;
  let unlocked = false;
  let muted = false;
  let preferredVoiceName = null;
  try {
    muted = localStorage.getItem("kjb_muted") === "1";
    preferredVoiceName = localStorage.getItem("kjb_voice") || null;
  } catch(e) {}
  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem("kjb_muted", muted?"1":"0"); } catch(e) {}
    if (muted) { try { stopTheme(0); } catch(_){} try { speechSynthesis.cancel(); } catch(_){} }
  }
  function isMuted() { return muted; }
  // Visual settings (default on, persisted)
  function getSlingshot() { try { const v = localStorage.getItem("kjb_sling"); return v === null ? true : v === "1"; } catch(e) { return true; } }
  function setSlingshot(v) { try { localStorage.setItem("kjb_sling", v?"1":"0"); } catch(e) {} }
  function getBossAnim() { try { const v = localStorage.getItem("kjb_bossanim"); return v === null ? true : v === "1"; } catch(e) { return true; } }
  function setBossAnim(v) { try { localStorage.setItem("kjb_bossanim", v?"1":"0"); } catch(e) {} }
  function getThemes() { try { const v = localStorage.getItem("kjb_themes"); return v === null ? true : v === "1"; } catch(e) { return true; } }
  function setThemes(v) { try { localStorage.setItem("kjb_themes", v?"1":"0"); } catch(e) {} if (!v) stopTheme(0); }
  // Spelling mode: when ON, English-word vocab questions render as a text
  // input (kid types the answer) instead of multiple choice. Default OFF.
  function getSpellMode() { try { return localStorage.getItem("kjb_spell") === "1"; } catch(e) { return false; } }
  function setSpellMode(v){ try { localStorage.setItem("kjb_spell", v?"1":"0"); } catch(e) {} }
  // Accessibility mode: bumps text sizes everywhere via a body class. Useful
  // for younger kids and for low-vision / dyslexia accommodations.
  function getA11y()    { try { return localStorage.getItem("kjb_a11y") === "1"; } catch(e) { return false; } }
  function setA11y(v)   { try { localStorage.setItem("kjb_a11y", v?"1":"0"); } catch(e) {} applyA11y(); }
  function applyA11y()  { try { document.body.classList.toggle("a11y-mode", getA11y()); } catch(e) {} }
  // Apply on load so a kid's saved preference takes effect immediately.
  if (typeof document !== "undefined" && document.body) applyA11y();
  else if (typeof window !== "undefined") window.addEventListener("DOMContentLoaded", applyA11y);
  function setVoice(name) {
    preferredVoiceName = name || null;
    try { localStorage.setItem("kjb_voice", preferredVoiceName || ""); } catch(e) {}
    refreshVoices();
  }
  function listVoices() {
    if (typeof speechSynthesis === "undefined") return [];
    return speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  }

  function refreshVoices() {
    const vs = speechSynthesis.getVoices();
    if (preferredVoiceName) {
      const pv = vs.find(v => v.name === preferredVoiceName);
      if (pv) { voiceEn = pv; }
    }
    if (!voiceEn) {
      voiceEn = vs.find(v => /en[-_]US/i.test(v.lang) && /female|samantha|karen|moira|kid|child/i.test(v.name))
             || vs.find(v => /en[-_]US/i.test(v.lang))
             || vs.find(v => /^en/i.test(v.lang))
             || null;
    }
    voiceJa = vs.find(v => /ja[-_]JP/i.test(v.lang)) || null;
  }
  if (typeof speechSynthesis !== "undefined") {
    refreshVoices();
    speechSynthesis.onvoiceschanged = refreshVoices;
  }

  function speak(text, opts = {}) {
    if (muted) return;
    if (typeof speechSynthesis === "undefined") return;
    if (opts.cancel !== false) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (opts.lang === "ja") {
      u.lang = "ja-JP";
      if (voiceJa) u.voice = voiceJa;
    } else {
      u.lang = "en-US";
      if (voiceEn) u.voice = voiceEn;
    }
    u.rate = opts.rate ?? 0.9;
    u.pitch = opts.pitch ?? 1.05;
    u.volume = opts.volume ?? 1;
    speechSynthesis.speak(u);
  }
  // iOS requires a user-gesture-triggered call to "unlock" speech
  function unlock() {
    if (unlocked) return;
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      speechSynthesis.speak(u);
      const a = ctx();
      if (a && a.state === "suspended") a.resume();
      unlocked = true;
    } catch(e) {}
  }

  // Tiny SFX using WebAudio — silly bleeps so we don't need audio files.
  let actx = null;
  function ctx() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return actx;
  }
  function tone(freq, dur, type="square", vol=0.15) {
    if (muted) return;
    const a = ctx(); if (!a) return;
    if (a.state === "suspended") a.resume();
    const o = a.createOscillator(); const g = a.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(a.destination);
    const now = a.currentTime;
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.start(now); o.stop(now + dur);
  }
  function sfxCorrect() { tone(660, .1); setTimeout(()=>tone(880, .15), 80); setTimeout(()=>tone(1320, .2), 180); }
  function sfxWrong()   { tone(180, .25, "sawtooth", .18); setTimeout(()=>tone(120, .35, "sawtooth", .18), 200); }
  function sfxHit()     { tone(220, .1, "square", .25); setTimeout(()=>tone(110,.15,"square",.2),80); }
  function sfxCard()    { tone(880,.05); setTimeout(()=>tone(990,.05),60); setTimeout(()=>tone(1100,.06),120); }
  function sfxBoss()    { tone(80, .3, "sawtooth", .2); setTimeout(()=>tone(60,.4,"sawtooth",.18),200); }
  function sfxVictory() { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.18, "triangle",.18), i*120)); }
  function sfxDefeat()  { [392,330,262,196].forEach((f,i)=>setTimeout(()=>tone(f,.25,"sawtooth",.18), i*180)); }
  function sfxPop()     { tone(440,.05,"square",.18); setTimeout(()=>tone(220,.1,"sawtooth",.2),60); }
  function sfxFart()    {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(); const g = a.createGain();
    o.type = "sawtooth"; o.frequency.value = 100;
    o.frequency.linearRampToValueAtTime(60, a.currentTime + .35);
    g.gain.value = .25;
    g.gain.linearRampToValueAtTime(0.0001, a.currentTime + .4);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + .4);
  }

  // ---------- BOSS THEME MUSIC ----------
  // One 30s mp3 per boss in assets/themes/<bossId>.mp3. We lazy-load on first
  // request (no upfront 4.5MB hit) and keep the HTMLAudioElement around so the
  // browser can cache it for the rest of the session.
  //
  // Three play modes:
  //   playTheme(id, {loop, volume, fadeIn})   — start playing from the top
  //   playThemeSnippet(id, durationMs)        — random offset, fade in + out
  //   stopTheme(fadeMs)                       — fade out and pause
  //
  // iOS note: HTMLAudioElement.play() needs user gesture. Game flow always has
  // a recent tap before themes trigger (boss intro = tap "battle start"; boss
  // attack = the player's earlier action drove the turn). We catch rejections
  // silently so the game keeps working if the browser blocks playback.
  const themeCache = {};
  let currentTheme = null;
  // Per-audio fade tracking. Earlier we shared a single fadeRAF, but that meant
  // crossfading from boss A → boss B canceled A's fade-out RAF (so A's onDone
  // pause never fired and A kept playing indefinitely under B). With a Map keyed
  // by the audio element, each fade lives its own life.
  const audioFadeRAF = new WeakMap();

  function getThemeAudio(bossId) {
    if (!themeCache[bossId]) {
      const a = new Audio(`assets/themes/${bossId}.mp3`);
      a.preload = "auto";
      a.crossOrigin = "anonymous"; // harmless if not needed
      themeCache[bossId] = a;
    }
    return themeCache[bossId];
  }

  function fadeTo(audio, targetVol, ms, onDone) {
    if (!audio) { if (onDone) onDone(); return; }
    // Cancel any prior fade on THIS audio element only.
    const prior = audioFadeRAF.get(audio);
    if (prior) cancelAnimationFrame(prior);
    const startVol = audio.volume;
    const startT = performance.now();
    function tick(t) {
      const p = ms <= 0 ? 1 : Math.min(1, (t - startT) / ms);
      audio.volume = startVol + (targetVol - startVol) * p;
      if (p < 1) audioFadeRAF.set(audio, requestAnimationFrame(tick));
      else { audioFadeRAF.delete(audio); if (onDone) onDone(); }
    }
    audioFadeRAF.set(audio, requestAnimationFrame(tick));
  }

  function stopTheme(fadeMs = 250) {
    const a = currentTheme;
    currentTheme = null;
    if (!a) return;
    if (fadeMs <= 0) { a.pause(); a.volume = 0; return; }
    fadeTo(a, 0, fadeMs, () => { try { a.pause(); } catch(_){} });
  }
  function isThemePlaying() { return !!currentTheme && !currentTheme.paused; }

  // ---------- SIREN SFX (warning splashes) ----------
  // Brief siren burst played during the boss-attack WARNING screen and the
  // RARE EVENT splash. Lazy-loaded HTMLAudioElement, plays from the start each
  // time, auto-stops after `durationMs` (default 1200ms).
  let _siren = null;
  function playSiren(durationMs) {
    if (muted) return;
    if (!_siren) {
      try { _siren = new Audio("assets/sfx/siren.mp3"); _siren.preload = "auto"; }
      catch(_) { return; }
    }
    try {
      _siren.pause();
      _siren.currentTime = 0;
      _siren.volume = 0.6;
      const p = _siren.play();
      if (p && p.catch) p.catch(() => {}); // iOS gesture-blocked: silent no-op
      const dur = durationMs || 1200;
      setTimeout(() => { try { _siren.pause(); _siren.currentTime = 0; } catch(_){} }, dur);
    } catch(_) {}
  }

  function playTheme(bossId, opts = {}) {
    if (muted || !getThemes()) return null;
    const loop    = !!opts.loop;
    const target  = (opts.volume ?? 0.55);
    const fadeIn  = (opts.fadeIn  ?? 250);
    const startAt = (opts.startAt ?? 0);
    // Stop any previous theme first
    if (currentTheme && currentTheme !== themeCache[bossId]) stopTheme(150);
    const a = getThemeAudio(bossId);
    a.loop = loop;
    a.volume = 0;
    try {
      // currentTime can throw on some browsers if metadata not yet loaded; guard.
      if (!Number.isNaN(a.duration) && Number.isFinite(a.duration)) {
        a.currentTime = Math.max(0, Math.min(Math.max(0, a.duration - 0.1), startAt));
      } else {
        a.currentTime = startAt;
      }
    } catch(_) {}
    const p = a.play();
    if (p && p.catch) p.catch(() => {}); // iOS gesture-blocked: silently no-op
    currentTheme = a;
    fadeTo(a, target, fadeIn);
    return a;
  }

  function playThemeSnippet(bossId, durationMs = 4000, volume = 0.5) {
    if (muted || !getThemes()) return;
    const a = getThemeAudio(bossId);
    const start = () => {
      const dur = (Number.isFinite(a.duration) && a.duration > 1) ? a.duration : 30;
      // Pick a random window inside the song that fits the snippet length.
      const snip = durationMs / 1000;
      const maxStart = Math.max(0, dur - snip - 0.3);
      const startAt = Math.random() * maxStart;
      playTheme(bossId, { startAt, volume, fadeIn: 200 });
      // Fade out and stop a bit before the requested duration ends so the
      // tail of the snippet is the fade, not a hard cut.
      setTimeout(() => stopTheme(350), Math.max(0, durationMs - 350));
    };
    if (a.readyState >= 1 /*HAVE_METADATA*/) start();
    else a.addEventListener("loadedmetadata", start, { once: true });
  }

  // ---------- SPEECH RECOGNITION (pronunciation challenges) ----------
  // Uses the Web Speech API for free in-browser pronunciation scoring. Supported
  // on iOS Safari ≥14.5 and modern Chrome/Edge. Falls back to "unsupported" on
  // browsers without it; callers should hide the feature when isSpeechSupported() is false.
  const SR_CTOR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function isSpeechSupported() { return !!SR_CTOR; }

  // Listen for one utterance and return whether the kid said `targetWord`.
  // Resolves with { ok, reason?, alts?, matched? }. Never rejects.
  function recognizeOnce(targetWord, opts={}) {
    return new Promise(resolve => {
      if (!SR_CTOR) return resolve({ ok: false, reason: "unsupported" });
      let r;
      try { r = new SR_CTOR(); } catch(_) { return resolve({ ok: false, reason: "init_failed" }); }
      r.lang = opts.lang || "en-US";
      r.maxAlternatives = 5;
      r.interimResults = false;
      r.continuous = false;
      let done = false;
      const cleanup = () => { try { r.onresult = r.onerror = r.onend = null; } catch(_){} };
      const finish = (result) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        try { r.stop(); } catch(_){}
        resolve(result);
      };
      const timer = setTimeout(() => finish({ ok: false, reason: "timeout" }), opts.timeoutMs || 5000);
      r.onresult = (e) => {
        const target = (targetWord||"").toLowerCase().trim();
        const tWords = target.split(/\s+/);
        const alts = [];
        const list = e.results && e.results[0];
        if (list) for (let i = 0; i < list.length; i++) {
          alts.push({ transcript: (list[i].transcript||"").toLowerCase().trim(), conf: list[i].confidence });
        }
        const matched = alts.find(a => {
          if (a.transcript === target) return true;
          const ws = a.transcript.split(/\s+/);
          return tWords.every(t => ws.includes(t));
        });
        finish({ ok: !!matched, alts, matched });
      };
      r.onerror = (e) => finish({ ok: false, reason: (e && e.error) || "error" });
      r.onend = () => { /* finish() handles termination */ };
      try { r.start(); } catch(e) { finish({ ok: false, reason: "start_failed" }); }
    });
  }

  return { speak, unlock, sfxCorrect, sfxWrong, sfxHit, sfxCard, sfxBoss, sfxVictory, sfxDefeat, sfxPop, sfxFart,
           setMuted, isMuted, setVoice, listVoices,
           getSlingshot, setSlingshot, getBossAnim, setBossAnim,
           getThemes, setThemes, getSpellMode, setSpellMode, getA11y, setA11y,
           playTheme, playThemeSnippet, stopTheme, isThemePlaying, playSiren,
           isSpeechSupported, recognizeOnce };
})();
