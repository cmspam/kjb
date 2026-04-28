// Question picker. Avoids repeating recently-asked IDs.
window.Questions = (() => {
  const recent = [];
  const RECENT_MAX = 60;

  function pool(level) {
    if (level === 1) return window.QUESTIONS_LEVEL1 || [];
    if (level === 2) return window.QUESTIONS_LEVEL2 || [];
    return window.QUESTIONS_LEVEL3 || [];
  }

  function pick(level, stars) {
    const all = pool(level).filter(q => q.stars === stars);
    if (all.length === 0) {
      // fall back if no Qs at requested star
      const any = pool(level);
      if (!any.length) return null;
      return any[(Math.random()*any.length)|0];
    }
    let candidates = all.filter(q => !recent.includes(q.id));
    if (candidates.length === 0) candidates = all;
    const q = candidates[(Math.random()*candidates.length)|0];
    recent.push(q.id);
    while (recent.length > RECENT_MAX) recent.shift();
    return q;
  }

  function counts() {
    return [1,2,3].map(lvl => ({
      level: lvl,
      total: pool(lvl).length,
      s1: pool(lvl).filter(q=>q.stars===1).length,
      s2: pool(lvl).filter(q=>q.stars===2).length,
      s3: pool(lvl).filter(q=>q.stars===3).length,
    }));
  }
  return { pick, counts };
})();
