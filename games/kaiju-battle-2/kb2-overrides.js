// KB2-specific runtime overrides.
//
// Right now KB2 behaves identically to KB1 — this file is the seam
// where new KB2 mechanics will be installed as they're developed:
//   - Party system: 3-kaiju squads with stamina shared across the team
//   - Type affinities: each kaiju has strengths/weaknesses against
//     others, modifying damage
//   - Signature moves: per-kaiju special attacks unlocked at certain
//     question-correct chains
//   - ESL-mastery × damage: pull esl_kaiju_mastery from localStorage
//     and use it to scale damage in KB2 (the three-game suite feeds
//     KB2 power, making the ecosystem self-reinforcing)
//   - Shiny chain: consecutive correct answers escalate to shiny
//     mode at chain 5+
//
// For now the only override is a small "you are in KB2" toast that
// pops on first arrival, and a hook to mark KB2 launches in
// localStorage so the launcher page can show "you've tried KB2".

(function () {
  try {
    const KEY = "kb2_launched";
    if (!localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, String(Date.now()));
      // Show a brief greeting once
      setTimeout(() => {
        const t = document.getElementById("toast");
        if (!t) return;
        t.textContent = "★ ようこそ カイジュウ バトル 2 へ ★  (now KB1)";
        t.classList.remove("hidden");
        setTimeout(() => { t.classList.add("hidden"); }, 3000);
      }, 800);
    }
  } catch (_) {}

  // Future hooks: window.KB2 = { applyAffinity(...), partyMode(...), etc. }
  window.KB2 = {
    version: "0.1-fork",
    isClone: true,    // identical mechanics to KB1 right now
  };
})();
