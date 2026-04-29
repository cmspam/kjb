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
  let fadeRAF = null;

  function getThemeAudio(bossId) {
    if (!themeCache[bossId]) {
      const a = new Audio(`assets/themes/${bossId}.mp3`);
      a.preload = "auto";
      a.crossOrigin = "anonymous"; // harmless if not needed
      themeCache[bossId] = a;
    }
    return themeCache[bossId];
  }

  function cancelFade() {
    if (fadeRAF) { cancelAnimationFrame(fadeRAF); fadeRAF = null; }
  }
  function fadeTo(audio, targetVol, ms, onDone) {
    if (!audio) { if (onDone) onDone(); return; }
    cancelFade();
    const startVol = audio.volume;
    const startT = performance.now();
    function tick(t) {
      const p = ms <= 0 ? 1 : Math.min(1, (t - startT) / ms);
      audio.volume = startVol + (targetVol - startVol) * p;
      if (p < 1) fadeRAF = requestAnimationFrame(tick);
      else { fadeRAF = null; if (onDone) onDone(); }
    }
    fadeRAF = requestAnimationFrame(tick);
  }

  function stopTheme(fadeMs = 250) {
    const a = currentTheme;
    currentTheme = null;
    if (!a) return;
    if (fadeMs <= 0) { a.pause(); a.volume = 0; return; }
    fadeTo(a, 0, fadeMs, () => { try { a.pause(); } catch(_){} });
  }
  function isThemePlaying() { return !!currentTheme && !currentTheme.paused; }

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

  return { speak, unlock, sfxCorrect, sfxWrong, sfxHit, sfxCard, sfxBoss, sfxVictory, sfxDefeat, sfxPop, sfxFart,
           setMuted, isMuted, setVoice, listVoices,
           getSlingshot, setSlingshot, getBossAnim, setBossAnim,
           getThemes, setThemes,
           playTheme, playThemeSnippet, stopTheme, isThemePlaying };
})();
