// Question picker. Avoids repeating recently-asked IDs and biases toward
// question types the player has been struggling with.
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
  return { pick, counts };
})();
