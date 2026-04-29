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
    if (muted) {
      try { stopTheme(0); } catch(_){}
      try { stopBossVoice(); } catch(_){}
      try { if (_enCurrent && !_enCurrent.paused) _enCurrent.pause(); } catch(_){}
      try { speechSynthesis.cancel(); } catch(_){}
    }
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

  // Pre-rendered English audio manifest — loaded at startup. If the requested
  // English text's djb2 hash is in the manifest, we play assets/audio/en/<hash>.opus
  // instead of going through the Web Speech API. Manifest is just { hash: 1, ... }.
  let _enManifest = null;
  let _enCurrent  = null;
  (function loadEnManifest() {
    try {
      fetch("assets/audio/en/manifest.json")
        .then(r => r.ok ? r.json() : null)
        .then(j => { if (j && typeof j === "object") _enManifest = j; })
        .catch(() => {});
    } catch(_) {}
  })();
  function _hashFor(s) {
    // djb2, identical to the build script and the boss-line hasher
    let h = 5381 | 0;
    const str = String(s);
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return ((h >>> 0).toString(16)).padStart(8, '0');
  }

  function speak(text, opts = {}) {
    if (muted) return;
    if (!text) return;
    // EN path: try the pre-rendered Opus first if we have it manifest-listed.
    // Falls through to the Web Speech path if the file isn't baked.
    if (opts.lang !== "ja") {
      const trimmed = String(text).trim();
      const hash = _hashFor(trimmed);
      const cached = _enManifest && _enManifest[hash];
      if (cached) {
        try {
          if (_enCurrent && !_enCurrent.paused) _enCurrent.pause();
        } catch(_){}
        const a = new Audio("assets/audio/en/" + hash + ".opus");
        a.preload = "auto";
        // Default the Piper voice to 85% speed — at native rate she sounds a
        // bit fast for kids who are still parsing the words. Callers that pass
        // an explicit rate (e.g., hint-card slow audio at 0.65) override it.
        // playbackRate at 0.5–2.0 preserves pitch automatically in Chrome/Safari.
        const rate = (opts.rate != null) ? opts.rate : 0.85;
        a.playbackRate = Math.max(0.5, Math.min(2.0, rate));
        if (opts.volume != null) a.volume = Math.max(0, Math.min(1, opts.volume));
        _enCurrent = a;
        const p = a.play();
        if (p && p.catch) p.catch(() => {
          // Audio failed (codec / network) — fall back to Web Speech.
          _speakViaTTS(text, opts);
        });
        return;
      }
      // No cached version — fall through to Web Speech.
    }
    _speakViaTTS(text, opts);
  }

  function _speakViaTTS(text, opts) {
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
  // Token bumped on every play/stop call. Stale play() promise resolutions
  // check the token before applying their fade-in — if a newer call has
  // superseded them, they no-op. Fixes rapid-switch races where the third
  // boss's theme would silently lose to a stale fade from a prior call.
  let _themeToken = 0;
  // Cancellable timeout for snippet stops. Without this, an orphan
  // setTimeout(stopTheme, ...) from a prior playThemeSnippet would fire
  // mid-way through a newer theme and pause it.
  let _snippetTimeout = null;

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
    _themeToken++; // any pending play() resolutions become stale
    if (_snippetTimeout) { clearTimeout(_snippetTimeout); _snippetTimeout = null; }
    const a = currentTheme;
    currentTheme = null;
    if (!a) return;
    if (fadeMs <= 0) { try { a.pause(); a.volume = 0; } catch(_){} return; }
    fadeTo(a, 0, fadeMs, () => { try { a.pause(); } catch(_){} });
  }
  function isThemePlaying() { return !!currentTheme && !currentTheme.paused; }

  // ---------- BOSS VOICE LINES ----------
  // Each boss has a pre-rendered Opus clip per line they ever say (catchphrase,
  // attack name, attack phrase, hit reaction, taunt, slingshot heckle, rage
  // phrase, backstory). Files live at assets/voices/<bossId>/<hash>.opus where
  // hash is the djb2 of the source text — same hash function the build script
  // uses, so resolution lines up without shipping a manifest.
  //
  // Furigana markup is stripped before hashing so 漢字[よみ] → よみ matches what
  // the synth script saw. Missing files no-op silently — the bubble still shows.
  function djb2Hash(s) {
    let h = 5381 | 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return ((h >>> 0).toString(16)).padStart(8, '0');
  }
  function stripFurigana(s) {
    if (!s) return '';
    return String(s).replace(/([一-鿿々ヶ]+)\[([^\]]+)\]/g, '$2');
  }
  // Track the most recent voice line so a fast-following call can interrupt the
  // previous one (we don't want overlapping bosses talking over themselves).
  let _currentVoice = null;
  function playBossLine(bossId, text) {
    if (muted) return null;
    if (!bossId || !text) return null;
    const cleaned = stripFurigana(String(text)).replace(/\s+/g, ' ').trim();
    if (!cleaned) return null;
    // Stop any line currently playing on the same channel
    try { if (_currentVoice && !_currentVoice.paused) _currentVoice.pause(); } catch(_){}
    const hash = djb2Hash(cleaned);
    const url = `assets/voices/${encodeURIComponent(bossId)}/${hash}.opus`;
    const a = new Audio(url);
    a.preload = "auto";
    a.volume = 0.95;
    _currentVoice = a;
    const p = a.play();
    if (p && p.catch) p.catch(() => {}); // 404 / iOS gesture block — silent
    return a;
  }
  function stopBossVoice() {
    try { if (_currentVoice && !_currentVoice.paused) _currentVoice.pause(); } catch(_){}
    _currentVoice = null;
  }

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
    if (_snippetTimeout) { clearTimeout(_snippetTimeout); _snippetTimeout = null; }
    const myToken = ++_themeToken;
    const loop    = !!opts.loop;
    const target  = (opts.volume ?? 0.55);
    const fadeIn  = (opts.fadeIn  ?? 250);
    const startAt = (opts.startAt ?? 0);

    const a = getThemeAudio(bossId);

    // Fade out + pause any *other* theme. For the same element we just reuse
    // it; pausing then re-playing the same element rapidly is what tripped iOS
    // before, so we leave it alone if it's already the target.
    if (currentTheme && currentTheme !== a) {
      const old = currentTheme;
      fadeTo(old, 0, 150, () => { try { old.pause(); } catch(_){} });
    }
    currentTheme = a;

    a.loop = loop;
    a.volume = 0;
    try {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        a.currentTime = Math.max(0, Math.min(Math.max(0, a.duration - 0.1), startAt));
      } else {
        a.currentTime = startAt;
      }
    } catch(_) {}

    let p;
    try { p = a.play(); } catch(_) { return a; }
    // iOS / Chrome may reject play() if pause() interrupted a prior pending
    // play. We swallow the rejection AND don't fade-in a stale call. The
    // fade-in only happens once the play promise actually resolves AND we're
    // still the live token (no newer playTheme/stopTheme has superseded us).
    if (p && p.then) {
      p.then(() => {
        if (myToken === _themeToken && currentTheme === a) {
          fadeTo(a, target, fadeIn);
        }
      }).catch(() => {
        // Play was aborted — likely superseded by a newer call. No-op.
      });
    } else {
      // Older browsers: play() returns void. Fade in immediately.
      fadeTo(a, target, fadeIn);
    }
    return a;
  }

  function playThemeSnippet(bossId, durationMs = 4000, volume = 0.5) {
    if (muted || !getThemes()) return;
    // Cancel any prior pending snippet stop — without this, the old one would
    // fire mid-way through this snippet and silently kill it.
    if (_snippetTimeout) { clearTimeout(_snippetTimeout); _snippetTimeout = null; }
    const a = getThemeAudio(bossId);
    const start = () => {
      const dur = (Number.isFinite(a.duration) && a.duration > 1) ? a.duration : 30;
      const snip = durationMs / 1000;
      const maxStart = Math.max(0, dur - snip - 0.3);
      const startAt = Math.random() * maxStart;
      playTheme(bossId, { startAt, volume, fadeIn: 200 });
      // Schedule the fade-out tail. Stored in _snippetTimeout so a subsequent
      // playTheme/stopTheme/playThemeSnippet can cancel it.
      _snippetTimeout = setTimeout(() => {
        _snippetTimeout = null;
        stopTheme(350);
      }, Math.max(0, durationMs - 350));
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

  // Listen for one utterance, gated by a Web Audio voice-activity detector
  // (VAD) so background noise (fans, A/C, distant talking) doesn't trigger
  // false matches. Resolves with { ok, reason?, alts?, matched? }.
  //
  // Strategy:
  //   1. Open mic via getUserMedia. We hold this stream the whole call.
  //   2. Calibrate the ambient noise floor for ~400ms via an AnalyserNode
  //      reading time-domain RMS. Set threshold = max(3.5×ambient, 0.025).
  //   3. In parallel, start a SpeechRecognition. If SR fires onresult BEFORE
  //      VAD has detected sustained voice, it's almost certainly a noise
  //      hallucination — discard, restart SR, keep listening.
  //   4. Once VAD detects voice (RMS above threshold for 3 consecutive frames,
  //      ~90ms of real signal), mark voiceDetected. Any SR result after this
  //      moment is treated as legitimate.
  //   5. Up to MAX_SR_RESTARTS restarts. Total wall-clock cap of ~12s.
  //
  // The kid sees:
  //   "じゅんびちゅう…" while we calibrate
  //   "🎤 はなしてね！" once we're actively listening for their voice
  //   final result message after recognition resolves.
  function recognizeOnce(targetWord, opts={}) {
    return _recognizeWithVAD(targetWord, opts);
  }

  async function _recognizeWithVAD(targetWord, opts={}) {
    if (!SR_CTOR) return { ok: false, reason: "unsupported" };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { ok: false, reason: "no-mic-api" };
    }

    // ---- 1. Open mic ----
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
    } catch (e) {
      const name = (e && e.name) || "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        return { ok: false, reason: "not-allowed" };
      }
      return { ok: false, reason: "mic-failed" };
    }

    // ---- 2. Set up VAD ----
    let ac;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {
      stream.getTracks().forEach(t => { try { t.stop(); } catch(_) {} });
      return { ok: false, reason: "audio-ctx-failed" };
    }
    const source = ac.createMediaStreamSource(stream);
    const analyser = ac.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);

    function rms() {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      return Math.sqrt(sum / buf.length);
    }

    let cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      try { source.disconnect(); } catch(_) {}
      try { ac.close(); } catch(_) {}
      try { stream.getTracks().forEach(t => t.stop()); } catch(_) {}
    }

    // ---- 3. Calibrate ambient ----
    const ambSamples = [];
    for (let i = 0; i < 14; i++) {
      ambSamples.push(rms());
      await new Promise(r => setTimeout(r, 30));
    }
    ambSamples.sort();
    // Use ~75th percentile as ambient — robust against an occasional spike
    const ambient = ambSamples[Math.floor(ambSamples.length * 0.75)] || 0.005;
    const threshold = Math.max(ambient * 3.5, 0.025);

    // Notify caller that we're now listening (post-calibration)
    if (typeof opts.onListening === "function") {
      try { opts.onListening(); } catch(_){}
    }

    // ---- 4. Run SR (continuous) in parallel with VAD ----
    //
    // Why continuous = true + interimResults = true:
    //   With continuous = false (the Chrome default for one-shot recognition),
    //   the recognizer finalizes as soon as it detects the start of a phrase
    //   and returns whatever it has — so "it's next week" gets clipped to
    //   "its". Continuous mode keeps the engine listening; interim results let
    //   us watch the transcript grow in real time. We let the kid finish
    //   speaking, the VAD detects sustained silence, we explicitly stop SR,
    //   then evaluate the accumulated full transcript.
    return new Promise((resolve) => {
      let done = false;
      let voiceDetected = false;
      let voiceStartTime = 0;
      let consecAbove = 0;
      let consecBelow = 0;
      let srRestarts = 0;
      let lastTranscript = "";       // best-known full transcript across results
      let bestAlts = [];             // top-N alternatives from any final result
      let stoppedByVad = false;
      const MAX_SR_RESTARTS  = 3;
      const TOTAL_CAP_MS     = opts.totalTimeoutMs || 14000;
      const VOICE_FRAMES_REQUIRED = 3;     // ~90ms of sustained voice to trigger
      const SILENCE_END_FRAMES   = 40;     // ~1.2s of silence after voice = end-of-speech
                                           // (long enough that mid-sentence pauses don't trigger)
      const MIN_VOICE_DURATION_MS = 300;   // keep listening for at least this long after voice starts
      let r = null;

      const target  = (targetWord || "").toLowerCase().trim();
      const tWords  = target.split(/\s+/);
      function matchAgainst(text, altsList) {
        const candidates = altsList && altsList.length
          ? altsList
          : [{ transcript: text.toLowerCase().trim() }];
        return candidates.find(a => {
          if (a.transcript === target) return true;
          // word-bag match — allows the kid to say a slightly longer phrase
          // ("it's next week please") and still match if the target words are present
          const ws = a.transcript.split(/\s+/);
          return tWords.every(t => ws.includes(t));
        });
      }

      const finish = (result) => {
        if (done) return;
        done = true;
        clearInterval(vadTimer);
        clearTimeout(overallTimer);
        try { if (r) { r.onresult = r.onerror = r.onend = null; r.stop(); } } catch(_){}
        cleanup();
        resolve(result);
      };

      // Hard wall-clock cap. If we have a transcript, evaluate it; otherwise
      // surface no-speech / no-result.
      const overallTimer = setTimeout(() => {
        if (lastTranscript) {
          const matched = matchAgainst(lastTranscript, bestAlts);
          finish({
            ok: !!matched,
            alts: bestAlts.length ? bestAlts : [{ transcript: lastTranscript.toLowerCase().trim() }],
            matched,
          });
        } else {
          finish({
            ok: false,
            reason: voiceDetected ? "no-result-after-voice" : "no-speech",
          });
        }
      }, TOTAL_CAP_MS);

      // VAD loop. Two roles:
      //   (a) before voice — confirm voice has actually started (gates against noise hallucinations)
      //   (b) after voice  — detect when speech ends, then stop SR explicitly so we evaluate
      const vadTimer = setInterval(() => {
        if (done) return;
        const v = rms();
        const now = Date.now();
        if (v > threshold) {
          consecAbove++;
          consecBelow = 0;
          if (consecAbove >= VOICE_FRAMES_REQUIRED && !voiceDetected) {
            voiceDetected = true;
            voiceStartTime = now;
          }
        } else {
          consecBelow++;
          consecAbove = Math.max(0, consecAbove - 1);
          if (voiceDetected && !stoppedByVad &&
              (now - voiceStartTime) >= MIN_VOICE_DURATION_MS &&
              consecBelow >= SILENCE_END_FRAMES) {
            // Voice has clearly ended — stop the recognizer so its onend fires
            // and we evaluate the accumulated transcript.
            stoppedByVad = true;
            try { if (r) r.stop(); } catch(_){}
          }
        }
      }, 30);

      function startSR() {
        if (done) return;
        try { r = new SR_CTOR(); }
        catch (_) { finish({ ok: false, reason: "init_failed" }); return; }
        r.lang = opts.lang || "en-US";
        r.maxAlternatives = 5;
        r.continuous = true;
        r.interimResults = true;

        r.onresult = (e) => {
          // Accumulate the full transcript across all SpeechRecognitionResult
          // entries. Capture top alternatives only from finalized results
          // (interim ones don't carry alternatives).
          let combined = "";
          const finalAlts = [];
          for (let i = 0; i < e.results.length; i++) {
            const res = e.results[i];
            combined += " " + (res[0] && res[0].transcript ? res[0].transcript : "");
            if (res.isFinal) {
              for (let j = 0; j < res.length && j < 5; j++) {
                finalAlts.push({
                  transcript: (res[j].transcript || "").toLowerCase().trim(),
                  conf: res[j].confidence,
                });
              }
            }
          }
          combined = combined.trim();
          if (combined) lastTranscript = combined;
          if (finalAlts.length) bestAlts = finalAlts;
          // No early termination here — we wait for the VAD's silence detection
          // to call r.stop(). That's how we capture the FULL utterance instead
          // of the recognizer's first guess.
        };

        r.onerror = (e) => {
          const err = e && e.error;
          if (err === "not-allowed" || err === "service-not-allowed") {
            finish({ ok: false, reason: err });
            return;
          }
          // Other errors → let onend decide whether to restart
        };

        r.onend = () => {
          if (done) return;
          // If VAD stopped us because speech ended → evaluate now.
          if (stoppedByVad) {
            const matched = matchAgainst(lastTranscript, bestAlts);
            finish({
              ok: !!matched,
              alts: bestAlts.length ? bestAlts : [{ transcript: lastTranscript.toLowerCase().trim() }],
              matched,
            });
            return;
          }
          // Recognizer ended on its own (no-speech timeout, network glitch, etc.)
          //   → if we already have a usable transcript, evaluate it
          //   → if we heard voice but no transcript, that's no-result-after-voice
          //   → otherwise restart and keep listening
          if (lastTranscript) {
            const matched = matchAgainst(lastTranscript, bestAlts);
            finish({
              ok: !!matched,
              alts: bestAlts.length ? bestAlts : [{ transcript: lastTranscript.toLowerCase().trim() }],
              matched,
            });
            return;
          }
          if (srRestarts < MAX_SR_RESTARTS) {
            srRestarts++;
            setTimeout(startSR, 80);
          } else {
            finish({
              ok: false,
              reason: voiceDetected ? "no-result-after-voice" : "no-speech",
            });
          }
        };

        try { r.start(); } catch(_) { /* let onend recover */ }
      }

      startSR();
    });
  }

  return { speak, unlock, sfxCorrect, sfxWrong, sfxHit, sfxCard, sfxBoss, sfxVictory, sfxDefeat, sfxPop, sfxFart,
           setMuted, isMuted, setVoice, listVoices,
           getSlingshot, setSlingshot, getBossAnim, setBossAnim,
           getThemes, setThemes, getSpellMode, setSpellMode, getA11y, setA11y,
           playTheme, playThemeSnippet, stopTheme, isThemePlaying, playSiren,
           playBossLine, stopBossVoice,
           isSpeechSupported, recognizeOnce };
})();
