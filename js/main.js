// Entry point.
window.addEventListener("DOMContentLoaded", () => {
  // Quick sanity log of question counts
  try {
    const c = Questions.counts();
    console.log("Questions loaded:", c);
  } catch(e) {}
  // Prevent double-tap zoom on iOS
  document.addEventListener("dblclick", e => e.preventDefault(), { passive: false });
  Game.start();
});
