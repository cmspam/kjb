// Question picker. Avoids repeating recently-asked IDs and biases toward
// question types the player has been struggling with.
//
// Cross-session history: per-question right/wrong counts and last-seen timestamp
// are persisted to localStorage as `kjb_qhist`. pick() uses this to surface
// review-due questions (got wrong before, haven't seen in a while) — basic
// spaced repetition. recordAnswer(qid, correct) updates the entry.
window.Questions = (() => {
  const recentGlobal = [];
  const RECENT_MAX = 80;

  function pool(level) {
    if (level === 0) return window.QUESTIONS_LEVEL0 || [];
    if (level === 1) return window.QUESTIONS_LEVEL1 || [];
    if (level === 2) return window.QUESTIONS_LEVEL2 || [];
    if (level === 3) return window.QUESTIONS_LEVEL3 || [];
    return window.QUESTIONS_LEVEL4 || [];
  }

  // ---- localStorage history ----
  // Shape: { qid: { r: rightCount, w: wrongCount, ts: lastSeenMs } }
  let hist = {};
  function loadHist() {
    try {
      const raw = localStorage.getItem("kjb_qhist");
      if (raw) hist = JSON.parse(raw) || {};
    } catch(_) { hist = {}; }
  }
  function saveHist() {
    try { localStorage.setItem("kjb_qhist", JSON.stringify(hist)); } catch(_) {}
  }
  loadHist();

  function recordAnswer(qid, correct) {
    if (!qid) return;
    const h = hist[qid] || { r: 0, w: 0, ts: 0 };
    if (correct) h.r += 1; else h.w += 1;
    h.ts = Date.now();
    hist[qid] = h;
    saveHist();
  }
  function getHistory(qid) { return qid ? (hist[qid] || null) : hist; }

  // Score a question for "is this due for review?" Higher score = more likely
  // to be picked when we're in review mode. Factors:
  //   • Got wrong before but haven't seen for a while → high
  //   • Got right consistently and seen recently → low
  //   • Never seen → mid (so new questions still get shown)
  function reviewScore(q) {
    const h = hist[q.id];
    if (!h) return 0.5; // unseen — middling priority
    const total = (h.r||0) + (h.w||0);
    if (total === 0) return 0.5;
    const wrongRate = (h.w||0) / total;
    const daysSince = (Date.now() - (h.ts||0)) / (1000*60*60*24);
    // Decay: a question seen <12h ago shouldn't come back yet (let it rest).
    const restFactor = daysSince < 0.5 ? 0 : Math.min(1, daysSince / 7);
    return wrongRate * restFactor;
  }

  // ctx: { misses: {ptype: count}, seenIds: [..ids..] }
  function pick(level, stars, ctx) {
    const all = pool(level).filter(q => q.stars === stars);
    if (all.length === 0) {
      const any = pool(level);
      if (!any.length) return null;
      return any[(Math.random()*any.length)|0];
    }
    const seen = (ctx && ctx.seenIds) || [];
    const misses = (ctx && ctx.misses) || {};
    // Prefer unseen first; fall back to all.
    let candidates = all.filter(q => !seen.includes(q.id) && !recentGlobal.includes(q.id));
    if (candidates.length === 0) candidates = all.filter(q => !recentGlobal.includes(q.id));
    if (candidates.length === 0) candidates = all;
    // 25% of the time, surface a "review needed" question from cross-session
    // history (got wrong before, hasn't been seen for ≥12h).
    if (Math.random() < 0.25) {
      const due = candidates
        .map(q => ({ q, s: reviewScore(q) }))
        .filter(x => x.s > 0)
        .sort((a,b) => b.s - a.s)
        .slice(0, 8);
      if (due.length) {
        const q = due[(Math.random()*due.length)|0].q;
        recentGlobal.push(q.id);
        while (recentGlobal.length > RECENT_MAX) recentGlobal.shift();
        return q;
      }
    }
    // 35% of the time, if the player has missed any ptype 2+ times this session,
    // pick from those missed types so they get a re-attempt.
    const struggling = Object.entries(misses).filter(([_, n]) => n >= 2).map(([t])=>t);
    if (struggling.length && Math.random() < 0.35) {
      const restrict = candidates.filter(q => struggling.includes(q.ptype));
      if (restrict.length) candidates = restrict;
    }
    const q = candidates[(Math.random()*candidates.length)|0];
    recentGlobal.push(q.id);
    while (recentGlobal.length > RECENT_MAX) recentGlobal.shift();
    return q;
  }

  function counts() {
    return [0,1,2,3,4].map(lvl => ({
      level: lvl,
      total: pool(lvl).length,
      s1: pool(lvl).filter(q=>q.stars===1).length,
      s2: pool(lvl).filter(q=>q.stars===2).length,
      s3: pool(lvl).filter(q=>q.stars===3).length,
    }));
  }
  return { pick, counts, recordAnswer, getHistory };
})();
