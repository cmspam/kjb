// Entry point.
window.addEventListener("DOMContentLoaded", () => {
  try {
    const c = Questions.counts();
    console.log("Questions loaded:", c);
  } catch(e) {}
  // Prevent double-tap zoom on iOS
  document.addEventListener("dblclick", e => e.preventDefault(), { passive: false });
  // Force-blur any active input when the user touches outside it. Stops iOS Safari
  // from consuming the first tap-on-button as a "dismiss keyboard" gesture.
  document.addEventListener("touchstart", (e) => {
    const a = document.activeElement;
    if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA")) {
      const t = e.target;
      if (!t || (t.tagName !== "INPUT" && t.tagName !== "TEXTAREA")) {
        if (a.blur) a.blur();
      }
    }
  }, { passive: true });
  // Exit button — confirm then reload to title. Uses UI.confirmModal because
  // native confirm() is unreliable from iOS Safari touch handlers.
  const exitBtn = document.getElementById("exit-btn");
  if (exitBtn) {
    UI.tap(exitBtn, () => {
      UI.confirmModal("バトルを やめて タイトルに もどる？", () => location.reload());
    });
  }
  Game.start();
});
