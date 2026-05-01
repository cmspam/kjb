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
  // Distinct sfx for "I broke an enemy part" — three descending tones with
  // a snare-like attack so it feels like glass shattering, not a menu bleep.
  function sfxBreak()   { tone(880,.05,"square",.22); setTimeout(()=>tone(440,.07,"square",.22),50); setTimeout(()=>tone(220,.18,"sawtooth",.25),130); }
  // Crit-hit sting: a quick rising chord that lands hard. Hooked from
  // applyDamageTier when tier === "crit" for satisfying big-damage feedback.
  function sfxCrit()    { tone(660,.04,"square",.22); setTimeout(()=>tone(880,.05,"square",.24),40); setTimeout(()=>tone(1320,.1,"sawtooth",.28),100); setTimeout(()=>tone(1760,.18,"triangle",.3),200); }
  // Subtle confirm tone for "I committed to an action" — distinct from
  // sfxPop's menu-tap timbre. Replaces sfxPop on wager-pick / target-pick /
  // attack-fire so kids hear an action complete vs a UI navigation.
  function sfxConfirm() { tone(550,.06,"sine",.22); setTimeout(()=>tone(770,.09,"sine",.22),50); }
  // Light "navigated to a sub-menu" tone — soft, brief.
  function sfxNav()     { tone(330,.05,"triangle",.16); }
  // "I picked an option" — same family as sfxPop but a slightly higher pair.
  function sfxSelect()  { tone(620,.04,"square",.18); setTimeout(()=>tone(770,.05,"square",.18),40); }
  // Synthesized "stadium crowd cheer". Bandpass-filtered white noise with an
  // attack/sustain/release envelope and a wobbly band-center frequency so it
  // doesn't sound like flat hiss. intensity: 0..1 controls peak gain.
  // duration in ms. Fired on combo splashes, KO, victory for the live-event
  // feel — without shipping a crowd-roar audio asset.
  function crowdCheer(intensity, durationMs) {
    if (muted) return;
    const a = ctx(); if (!a) return;
    if (a.state === "suspended") a.resume();
    intensity = Math.max(0.05, Math.min(1, intensity == null ? 0.5 : intensity));
    durationMs = Math.max(120, durationMs || 800);
    const sr = a.sampleRate;
    const len = Math.floor((durationMs / 1000) * sr);
    const buf = a.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
    const src = a.createBufferSource();
    src.buffer = buf;
    // Band-pass keeps the mid frequencies that read as voice.
    const filter = a.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 850 + Math.random() * 300;
    filter.Q.value = 1.4;
    // LFO modulates the band center so the roar wobbles, not a flat hiss.
    const lfo = a.createOscillator();
    const lfoGain = a.createGain();
    lfo.frequency.value = 4 + Math.random() * 3;
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain).connect(filter.frequency);
    // Attack/sustain/release envelope.
    const gain = a.createGain();
    const now = a.currentTime;
    const dur = durationMs / 1000;
    const peak = 0.18 * intensity;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + Math.min(0.18, dur * 0.25));
    gain.gain.setValueAtTime(peak, now + dur * 0.65);
    gain.gain.linearRampToValueAtTime(0, now + dur);
    src.connect(filter); filter.connect(gain); gain.connect(a.destination);
    src.start(now);
    lfo.start(now);
    src.stop(now + dur);
    lfo.stop(now + dur);
  }
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
  // Metadata about the currently-playing theme so callers (the speech-mic flow,
  // chiefly) can snapshot and later restore the same playback state. Cleared
  // when stopTheme() runs so we don't accidentally resume a theme that was
  // intentionally killed.
  let _themeMeta = null; // { bossId, volume, loop }
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
    _themeMeta = null;
    if (!a) return;
    if (fadeMs <= 0) { try { a.pause(); a.volume = 0; } catch(_){} return; }
    fadeTo(a, 0, fadeMs, () => { try { a.pause(); } catch(_){} });
  }
  function isThemePlaying() { return !!currentTheme && !currentTheme.paused; }

  // Duck the theme volume briefly so a dramatic moment (crit, KO,
  // cliffhanger) reads in the audio mix. Volume drops to dipFraction × the
  // current target, holds for `holdMs`, then ramps back. No-op if no theme.
  let _duckEndTime = 0;
  function duckTheme(holdMs, dipFraction) {
    if (!currentTheme || !_themeMeta) return;
    const dip = Math.max(0.05, Math.min(1, dipFraction != null ? dipFraction : 0.35));
    const target = _themeMeta.volume || 0.5;
    const dipped = target * dip;
    const hold = Math.max(150, holdMs || 600);
    _duckEndTime = performance.now() + hold;
    fadeTo(currentTheme, dipped, 120, () => {
      // Only ramp back if no newer duck is active.
      const now = performance.now();
      const remaining = Math.max(0, _duckEndTime - now);
      setTimeout(() => {
        if (currentTheme && _themeMeta && performance.now() >= _duckEndTime) {
          fadeTo(currentTheme, _themeMeta.volume || 0.5, 280);
        }
      }, remaining);
    });
  }

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
    _themeMeta = { bossId, volume: target, loop };

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

  // ---------- SPEECH MATCHING HELPERS ----------
  // Normalize a transcript or target for comparison: lowercase, expand
  // currency symbols to spoken-word equivalents (Google's SR formats prices
  // as "¥500" but the question target says "500 yen"), strip commas inside
  // numbers ("200,000" → "200000" so it stays one number), strip apostrophes
  // ("it's" → "its" — Chrome's transcript sometimes drops the apostrophe),
  // other punctuation → space, collapse whitespace. This is what makes
  // "On thursday?" match "on thursday" and "It's next week!" match
  // "it's next week".
  function normalizeForMatch(s) {
    return String(s || "").toLowerCase()
      .replace(/¥/g, " yen ")
      .replace(/\$/g, " dollar ")
      .replace(/€/g, " euro ")
      .replace(/£/g, " pound ")
      .replace(/(\d),(?=\d)/g, "$1")
      .replace(/'/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  // Word-form number lookup. Used both as a final-token value AND as a
  // building block in multi-word numbers ("five hundred" → 500, "fifteen
  // hundred" → 1500, "one thousand five hundred" → 1500, "two hundred
  // thousand" → 200000).
  const NUM_WORD = {
    zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
    ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
    sixteen:16, seventeen:17, eighteen:18, nineteen:19,
    twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90,
    hundred:100, thousand:1000, million:1000000,
  };
  // Resolve a word to its numeric value, accepting common homophones the kid
  // might pronounce — "won"→1, "ate"→8, "to"/"too"→2, "for"/"fore"→4. Looks
  // ONLY at NUM_WORD and the explicit homophone table (no soundex fallback,
  // because too many common words like "the"→T000 collide with the soundex
  // of "two"→T000 and would false-tokenize as numbers).
  function lookupNumberWord(w) {
    if (!w) return null;
    if (Object.prototype.hasOwnProperty.call(NUM_WORD, w)) return NUM_WORD[w];
    if (HOMOPHONES[w]) {
      for (const h of HOMOPHONES[w]) {
        if (Object.prototype.hasOwnProperty.call(NUM_WORD, h)) return NUM_WORD[h];
      }
    }
    return null;
  }
  // Greedy multi-word number parse starting at words[start]. Returns
  // { value, end } or null. Handles "five", "twenty five", "five hundred",
  // "fifteen hundred", "one thousand five hundred", "two hundred thousand".
  function parseNumberWords(words, start) {
    let i = start, total = 0, current = 0, any = false;
    while (i < words.length) {
      const v = lookupNumberWord(words[i]);
      if (v == null) break;
      any = true;
      if (v === 100) {
        current = (current || 1) * 100;
      } else if (v === 1000 || v === 1000000) {
        current = (current || 1) * v;
        total += current;
        current = 0;
      } else {
        current += v;
      }
      i++;
    }
    if (!any) return null;
    return { value: total + current, end: i };
  }
  // Walk the words of `s`, pulling out every numeric value (digit form like
  // "1500" or "200000" — already comma-stripped by normalize — and word form
  // like "fifteen hundred"). Returns parallel arrays so callers can do both
  // a number-set check AND a remaining-words check.
  function tokenizeForMatch(s) {
    const words = String(s || "").split(/\s+/).filter(Boolean);
    const nonNumberWords = [];
    const numbers = [];
    let i = 0;
    while (i < words.length) {
      const w = words[i];
      if (/^\d+$/.test(w)) {
        const n = parseInt(w, 10);
        if (!isNaN(n)) { numbers.push(n); i++; continue; }
      }
      const parsed = parseNumberWords(words, i);
      if (parsed && parsed.end > i) {
        numbers.push(parsed.value);
        i = parsed.end;
        continue;
      }
      nonNumberWords.push(w);
      i++;
    }
    return { nonNumberWords, numbers };
  }
  // Soundex — classic phonetic hash. Same-sounding words → same code:
  // read/red/reed → R300, see/sea → S000, blue/blew → B400, to/two/too → T000,
  // here/hear → H600, no/know → N000, by/buy/bye → B000, etc. Doesn't catch
  // every homophone (e.g. way vs weigh disagree because of the silent G), so
  // we layer an explicit table on top for the cases soundex gets wrong.
  function soundex(word) {
    word = String(word || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (!word) return "";
    const map = { B:1,F:1,P:1,V:1, C:2,G:2,J:2,K:2,Q:2,S:2,X:2,Z:2,
                  D:3,T:3, L:4, M:5,N:5, R:6 };
    let out = word[0];
    let prev = map[word[0]] || "";
    for (let i = 1; i < word.length && out.length < 4; i++) {
      const c = word[i];
      const code = map[c] || "";
      if (code && code !== prev) out += code;
      if (c !== "H" && c !== "W") prev = code;
    }
    return (out + "000").slice(0, 4);
  }
  // Homophone exceptions soundex misses. Bidirectional pairs. Number-form
  // homophones (to/too/two, for/fore/four, etc.) are listed here too so
  // lookupNumberWord can resolve them — soundex-equivalence isn't safe to
  // use for that lookup because common words like "the" share a soundex
  // code with "two" and would false-tokenize.
  const HOMOPHONE_PAIRS = [
    ["way", "weigh"],
    ["one", "won"],
    ["ate", "eight"],
    ["to", "two"], ["too", "two"], ["to", "too"],
    ["for", "four"], ["fore", "four"], ["for", "fore"],
    ["our", "hour"],
    ["write", "right"], ["write", "rite"], ["right", "rite"],
    ["new", "knew"],
    ["night", "knight"],
    ["wear", "where"], ["ware", "wear"], ["ware", "where"],
    ["which", "witch"],
    ["whole", "hole"],
    ["meet", "meat"],
    ["week", "weak"],
    ["plane", "plain"],
    ["pair", "pear"], ["pair", "pare"], ["pear", "pare"],
    ["sun", "son"],
    ["flower", "flour"],
    ["male", "mail"],
    ["sale", "sail"],
    ["tail", "tale"],
    ["bare", "bear"],
    ["eye", "i"],
    ["sea", "c"],
    ["be", "bee"], ["be", "b"],
    ["are", "r"],
    ["you", "u"],
  ];
  const HOMOPHONES = (() => {
    const m = {};
    for (const [a, b] of HOMOPHONE_PAIRS) {
      (m[a] = m[a] || new Set()).add(b);
      (m[b] = m[b] || new Set()).add(a);
    }
    return m;
  })();
  function wordsAreEquivalent(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (HOMOPHONES[a] && HOMOPHONES[a].has(b)) return true;
    const sa = soundex(a);
    return !!sa && sa === soundex(b);
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

    // Pause any background theme — its bleed through speakers can confuse VAD
    // calibration and trip phantom voice activity. Snapshot the playback state
    // so we can restore it after the mic flow completes.
    const themeToResume = _themeMeta ? { ..._themeMeta } : null;
    if (themeToResume) stopTheme(0);

    let cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      try { source.disconnect(); } catch(_) {}
      try { ac.close(); } catch(_) {}
      try { stream.getTracks().forEach(t => t.stop()); } catch(_) {}
      if (themeToResume) {
        // Brief delay so the SpeechRecognition session's tail processing
        // settles before we slam the speaker back on.
        setTimeout(() => {
          playTheme(themeToResume.bossId, {
            loop:   themeToResume.loop,
            volume: themeToResume.volume,
            fadeIn: 200,
          });
        }, 120);
      }
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
      // Chrome desktop's webkitSpeechRecognition tends to end its session after
      // it finalizes a single phrase, even with continuous=true. Each new SR
      // session restarts e.results from scratch, so we keep our own accumulator
      // across sessions: `accumulatedFinal` holds finalized text from prior
      // sessions, `currentInterim` holds the current session's in-progress
      // text. Together they form the full transcript.
      let accumulatedFinal = "";
      let currentInterim = "";
      let bestAlts = [];             // most recent finalized alternatives
      let stoppedByVad = false;
      // Plenty of restarts for Chrome desktop's premature-end quirk. The wall-
      // clock cap and VAD silence gate are the real terminating conditions.
      const MAX_SR_RESTARTS  = 12;
      const TOTAL_CAP_MS     = opts.totalTimeoutMs || 15000;
      const VOICE_FRAMES_REQUIRED = 3;     // ~90ms of sustained voice to trigger
      const SILENCE_END_FRAMES   = 40;     // ~1.2s of silence after voice = end-of-speech
      const MIN_VOICE_DURATION_MS = 300;
      let r = null;

      const target = normalizeForMatch(targetWord);
      const targetTok = tokenizeForMatch(target);
      function fullTranscript() {
        return (accumulatedFinal + " " + currentInterim).trim();
      }
      function evaluateAndFinish(reason) {
        const t = fullTranscript();
        if (!t) {
          finish({
            ok: false,
            reason: reason || (voiceDetected ? "no-result-after-voice" : "no-speech"),
          });
          return;
        }
        const candidates = bestAlts.length ? bestAlts : [{ transcript: t }];
        const matched = candidates.find(a => {
          const at = normalizeForMatch(a.transcript);
          if (at === target) return true;
          const tok = tokenizeForMatch(at);
          // Numbers: every target number must appear in transcript. Digit form
          // and spelled-out form are both extracted to integers, so "1500 yen"
          // matches "fifteen hundred yen" and "¥500" matches "500 yen".
          const transNums = new Set(tok.numbers);
          for (const n of targetTok.numbers) {
            if (!transNums.has(n)) return false;
          }
          // Non-number words: every target word has SOME equivalent in the
          // transcript. Equivalence is exact OR homophone OR same soundex
          // code, so "read" matches "red", "On thursday?" matches "on
          // thursday", "it's next week please" matches "it's next week".
          return targetTok.nonNumberWords.every(tw =>
            tok.nonNumberWords.some(w => wordsAreEquivalent(w, tw)));
        });
        finish({
          ok: !!matched,
          alts: candidates,
          matched,
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

      // Wall-clock cap — if the kid hasn't spoken or hasn't finished in time,
      // evaluate whatever we have. Generous (15s) so a kid taking time to
      // organize a longer phrase isn't cut off.
      const overallTimer = setTimeout(() => evaluateAndFinish(), TOTAL_CAP_MS);

      // VAD loop. Two roles:
      //   (a) before voice → confirm voice has actually started (noise gate)
      //   (b) after voice  → detect speech end (~1.2s silence), trigger evaluation
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
            // Voice clearly ended — stop SR. onend will trigger evaluateAndFinish.
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
          let interimNow = "";
          for (let i = 0; i < e.results.length; i++) {
            const res = e.results[i];
            const top = res[0] && res[0].transcript ? res[0].transcript : "";
            if (res.isFinal) {
              if (top) accumulatedFinal = (accumulatedFinal + " " + top).trim();
              const alts = [];
              for (let j = 0; j < res.length && j < 5; j++) {
                alts.push({
                  transcript: (res[j].transcript || "").toLowerCase().trim(),
                  conf: res[j].confidence,
                });
              }
              if (alts.length) bestAlts = alts;
            } else {
              interimNow += " " + top;
            }
          }
          currentInterim = interimNow.trim();
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
          // Move any unfinalized interim into accumulated so we don't lose it
          // when the session restarts.
          if (currentInterim) {
            accumulatedFinal = (accumulatedFinal + " " + currentInterim).trim();
            currentInterim = "";
          }
          // VAD told us speech ended → evaluate now.
          if (stoppedByVad) {
            evaluateAndFinish();
            return;
          }
          // Otherwise SR ended on its own (Chrome's premature-finalize quirk
          // or network glitch). Keep listening — the kid might still be
          // speaking. Restart up to MAX_SR_RESTARTS times. The wall-clock cap
          // and VAD silence gate are what actually terminate us.
          if (srRestarts < MAX_SR_RESTARTS) {
            srRestarts++;
            setTimeout(startSR, 50);
          } else {
            evaluateAndFinish();
          }
        };

        try { r.start(); } catch(_) { /* let onend recover */ }
      }

      startSR();
    });
  }

  return { speak, unlock, sfxCorrect, sfxWrong, sfxHit, sfxCard, sfxBoss, sfxVictory, sfxDefeat,
           sfxPop, sfxFart, sfxBreak, sfxCrit, sfxConfirm, sfxNav, sfxSelect, crowdCheer,
           setMuted, isMuted, setVoice, listVoices,
           getSlingshot, setSlingshot, getBossAnim, setBossAnim,
           getThemes, setThemes, getSpellMode, setSpellMode, getA11y, setA11y,
           playTheme, playThemeSnippet, stopTheme, duckTheme, isThemePlaying, playSiren,
           playBossLine, stopBossVoice,
           isSpeechSupported, recognizeOnce };
})();
