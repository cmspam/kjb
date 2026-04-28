// Web Speech API wrapper. Free, no backend, works on iPad Safari.
window.SND = (() => {
  let voiceEn = null, voiceJa = null;
  let unlocked = false;

  function refreshVoices() {
    const vs = speechSynthesis.getVoices();
    voiceEn = vs.find(v => /en[-_]US/i.test(v.lang) && /female|samantha|karen|moira|kid|child/i.test(v.name))
           || vs.find(v => /en[-_]US/i.test(v.lang))
           || vs.find(v => /^en/i.test(v.lang))
           || null;
    voiceJa = vs.find(v => /ja[-_]JP/i.test(v.lang)) || null;
  }
  if (typeof speechSynthesis !== "undefined") {
    refreshVoices();
    speechSynthesis.onvoiceschanged = refreshVoices;
  }

  function speak(text, opts = {}) {
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

  return { speak, unlock, sfxCorrect, sfxWrong, sfxHit, sfxCard, sfxBoss, sfxVictory, sfxDefeat, sfxPop, sfxFart };
})();
