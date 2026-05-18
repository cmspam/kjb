// Shared audio helper for the ESL games suite.
//
// Plays English words from KJB's existing pre-rendered Edge TTS pack
// (assets/audio/en/<djb2-hash>.opus, ~2985 files covering A1-A2 vocab).
// Falls back to the browser's SpeechSynthesis for any word not present —
// kids will rarely hit the fallback because the vocab pool is huge, and
// when they do the fallback is still a real English voice.
//
// Also exposes playBossLine(bossId, jpText) to reuse KJB voice lines.
// Hashing matches js/audio.js _hashFor exactly (UTF-16 surrogate-pair
// safe). Path is relative to a game in eslgame/games/<slug>/.
window.GamesAudio = (() => {
  const FURIGANA_RE = /([一-鿿々ヶ]+)\[([^\]]+)\]/g;
  const cache = new Map();
  let muted = false;
  let ctx = null;

  function djb2(s) {
    let h = 5381 | 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return ((h >>> 0).toString(16)).padStart(8, "0");
  }
  function stripFurigana(s) { return String(s || "").replace(FURIGANA_RE, "$2"); }
  function cleanForHash(s) {
    return stripFurigana(s).replace(/\s+/g, " ").trim();
  }

  // Lazily-init AudioContext for SFX tones.
  function audio() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (_) { ctx = null; }
    }
    return ctx;
  }

  // Per-kaiju voice profiles for browser TTS fallback. Producer note:
  // "every kaiju has the same voice in all 3 games" is the right
  // identity move. We can't render all castle-defense demand
  // combinations as pre-baked audio, so the next-best is to tune
  // SpeechSynthesisUtterance rate+pitch per kaiju so the same
  // character sounds recognizably like itself everywhere.
  const KAIJU_TTS = {
    tako:       { rate: 1.10, pitch: 1.20 },
    unko:       { rate: 0.92, pitch: 0.75 },
    tral:       { rate: 1.00, pitch: 1.40 },
    pamp:       { rate: 1.05, pitch: 1.55 },
    parfait:    { rate: 0.95, pitch: 1.15 },
    anpan:      { rate: 1.00, pitch: 0.90 },
    temee:      { rate: 0.85, pitch: 0.78 },
    catcherski: { rate: 1.05, pitch: 0.72 },
    brainrot:   { rate: 0.88, pitch: 0.60 },
  };

  // Opus codec support detection. iOS Safari can't decode Opus until
  // iOS 17 — on older devices a.play() returns a rejecting promise,
  // and by the time the .catch fires the user-gesture token has
  // already expired so speechSynthesis.speak() in the fallback is
  // silently dropped. We detect once and skip Opus entirely on
  // unsupported platforms, going to browserTTS SYNCHRONOUSLY inside
  // the gesture handler so the speech permission survives.
  let _opusCache = null;
  function supportsOpus() {
    if (_opusCache !== null) return _opusCache;
    try {
      const probe = document.createElement('audio');
      const a = probe.canPlayType('audio/ogg; codecs="opus"');
      const b = probe.canPlayType('audio/opus');
      _opusCache = !!(a && a !== "") || !!(b && b !== "");
    } catch (_) { _opusCache = false; }
    return _opusCache;
  }

  // Play a pre-rendered English word from the KJB question pack.
  // Returns the Audio element so callers can chain. Silent on miss.
  function speakEn(text, opts) {
    if (muted) return null;
    const cleaned = cleanForHash(text);
    if (!cleaned) return null;
    // iOS Safari (< 17) — skip the opus path entirely and speak
    // via browserTTS synchronously so we don't lose the gesture
    // window. The opus playback would silently reject anyway.
    if (!supportsOpus()) {
      browserTTS(cleaned, opts);
      return null;
    }
    const hash = djb2(cleaned);
    const url = `../../assets/audio/en/${hash}.opus`;
    let a;
    try { a = new Audio(url); }
    catch (_) { return null; }
    a.preload = "auto";
    a.volume = (opts && opts.volume != null) ? opts.volume : 0.95;
    const p = a.play();
    if (p && p.catch) {
      p.catch(() => browserTTS(cleaned, opts));
    }
    return a;
  }
  // Speak text in the voice of a specific kaiju via browser TTS,
  // applying that kaiju's rate/pitch profile. Used by castle-defense
  // for demand lines.
  function speakAsKaiju(kaijuId, text) {
    if (muted) return;
    const prof = KAIJU_TTS[kaijuId] || { rate: 1.0, pitch: 1.0 };
    browserTTS(text, { rate: prof.rate, pitch: prof.pitch });
  }

  // Browser SpeechSynthesis fallback. Auto-picks an en-US voice if one
  // is available; otherwise default voice.
  function browserTTS(text, opts) {
    if (muted || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = (opts && opts.rate) || 0.95;
      u.pitch = (opts && opts.pitch) || 1.0;
      u.volume = (opts && opts.volume) || 1.0;
      const voices = window.speechSynthesis.getVoices();
      const us = voices.find(v => /en-US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));
      if (us) u.voice = us;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  // Play one of the KJB boss's pre-recorded JP voice lines (or shiny
  // alt-language). Path: ../../assets/voices/<bossId>/<hash>.opus.
  function playBossLine(bossId, text, opts) {
    if (muted || !bossId || !text) return null;
    const cleaned = cleanForHash(text);
    if (!cleaned) return null;
    // iOS Safari without opus — fall back to Japanese TTS so the
    // kaiju line is at least audible (generic JP voice, not the
    // character voice — but better than silence). Synchronous so
    // the gesture window holds.
    if (!supportsOpus()) {
      try {
        if (!window.speechSynthesis) return null;
        const u = new SpeechSynthesisUtterance(cleaned);
        u.lang = "ja-JP";
        u.rate = 1.0; u.pitch = 1.0;
        u.volume = (opts && opts.volume != null) ? opts.volume : 0.95;
        const voices = window.speechSynthesis.getVoices();
        const jp = voices.find(v => /^ja/i.test(v.lang));
        if (jp) u.voice = jp;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch (_) {}
      return null;
    }
    const hash = djb2(cleaned);
    const shiny = !!(opts && opts.shiny);
    const dir = shiny ? `${bossId}_shiny` : bossId;
    const url = `../../assets/voices/${encodeURIComponent(dir)}/${hash}.opus`;
    const a = new Audio(url);
    a.preload = "auto";
    a.volume = (opts && opts.volume != null) ? opts.volume : 0.95;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
    return a;
  }

  // Tiny synthesized SFX so games don't have to ship their own audio.
  function tone(freq, dur, type = "square", vol = 0.18) {
    const c = audio();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(c.destination);
    const t0 = c.currentTime;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
  function sfxCorrect() { tone(660, .1); setTimeout(()=>tone(880,.13),80); setTimeout(()=>tone(1320,.18),180); }
  function sfxWrong()   { tone(180,.25,"sawtooth",.18); setTimeout(()=>tone(120,.32,"sawtooth",.18),200); }
  function sfxPop()     { tone(440,.05); setTimeout(()=>tone(220,.1,"sawtooth",.18),60); }
  function sfxConfirm() { tone(550,.06,"sine",.22); setTimeout(()=>tone(770,.09,"sine",.22),50); }
  function sfxLevel()   { [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>tone(f,.16,"triangle",.22), i*90)); }
  function sfxFail()    { [400,300,200].forEach((f,i)=>setTimeout(()=>tone(f,.22,"sawtooth",.18), i*120)); }
  function sfxSplat()   { tone(120,.08,"sawtooth",.22); setTimeout(()=>tone(80,.18,"sawtooth",.18),60); }
  function sfxSparkle() { [1320,1760,2200].forEach((f,i)=>setTimeout(()=>tone(f,.08,"triangle",.14), i*45)); }

  function setMuted(v) { muted = !!v; }
  function isMuted()   { return muted; }

  return {
    speakEn, speakAsKaiju, browserTTS, playBossLine,
    sfxCorrect, sfxWrong, sfxPop, sfxConfirm, sfxLevel, sfxFail, sfxSplat, sfxSparkle,
    setMuted, isMuted,
    djb2, cleanForHash,
  };
})();
