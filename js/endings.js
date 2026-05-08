// Boss "ending pictures" — illustrated dystopian scenes depicting the world
// each boss creates if their evil goal succeeds. Shown when:
//   • hero mode defeat (player lost; boss reigns)
//   • PvP victory (winning kid's monster takes over the world)
//
// Each scene is an AI-generated illustration in assets/images/endings/<id>.png
// (replacing the previous hand-coded SVG art for richer visuals). The caller
// renders the captionJp under the image; captionEn is preserved for future
// localization.
//
// To add a new boss ending: drop the PNG at assets/images/endings/<id>.png
// and add a captionJp / captionEn entry below.
window.Endings = (() => {
  const SCENES = {
    tako: {
      captionJp: "たこやきが せかいを せいふくした！",
      captionEn: "Tako Tako Sahur turned all food into takoyaki!",
    },
    unko: {
      captionJp: "せかいの 川[かわ]は ぜんぶ うんちに なった…",
      captionEn: "Bombardiro Unkodilo turned every river brown.",
    },
    tral: {
      captionJp: "イタリア語[ご] だけの 世界[せかい]に なった…",
      captionEn: "Tralalero made everyone sing in Italian.",
    },
    pamp: {
      captionJp: "せかいの こども が ぜんぶ コレクション された…",
      captionEn: "Brr Brr Pampamu collected every child in the world.",
    },
    parfait: {
      captionJp: "寿司[すし]は ぜんぶ パフェに なった…",
      captionEn: "Parfait Iwashi turned every sushi into parfait.",
    },
    anpan: {
      captionJp: "アンパンマンは たおされ、新[しん]ヒーローに なった…",
      captionEn: "Anpan Maguro toppled Anpanman and took the throne.",
    },
    temee: {
      captionJp: "ぜんいん こぶ。 みんな ラクダ つうがく。 まいにち ブーズ。 マイナス40度[ど]。 テメー・ハーンの 帝国[ていこく] や〜！",
      captionEn: "Humps are mandatory. Every kid rides a camel to school. Every meal is buuz. The world is locked at -40°C. The Khan of camels reigns.",
    },
    brainrot: {
      captionJp: "6つの 野望[やぼう]が ぜんぶ 同時[どうじ]に 実現[じつげん]してしまった…",
      captionEn: "All six kaiju ambitions came true at once. The world is theirs now.",
    },
  };

  function render(bossId) {
    const c = SCENES[bossId];
    if (!c) return null;
    // The "svg" field name is preserved from the prior SVG-art era so call
    // sites in ui.js don't have to change. Content is now an <img> tag
    // pointing at the PNG illustration.
    return {
      svg: `<img class="ending-image" src="assets/images/endings/${bossId}.png" alt="" loading="lazy"/>`,
      captionJp: c.captionJp,
      captionEn: c.captionEn,
    };
  }
  function exists(bossId) { return !!SCENES[bossId]; }
  return { render, exists };
})();
