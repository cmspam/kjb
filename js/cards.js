// Cards. Each card has a play(ctx) function. ctx provides refs to game state.
// type:"action" cards apply immediately. type:"reaction" needs target.
window.Cards = (() => {

  // Effect type constants used by game.js when resolving plays
  const C = {
    DMG_BONUS: "dmg_bonus",      // adds dmg to current attack
    HEAL_SELF: "heal_self",
    HEAL_TARGET: "heal_target",
    HEAL_TEAM: "heal_team",
    SHIELD_SELF: "shield_self",
    SHIELD_TEAM: "shield_team",
    ENERGY: "energy",
    DRAW: "draw",
    DOUBLE_NEXT: "double_next",  // next teammate hit ×2
    HIT_RANDOM_2: "hit_random_2",// hits 2 random parts for 2 each
    REVEAL_ROLE: "reveal_role",
    SKIP_BOSS_ATK: "skip_boss_atk",
    REROLL_Q: "reroll_q",
    HINT: "hint",                // remove one wrong answer
  };

  const POOL = [
    { id:"fart_bomb",  name_jp:"おなら ばくだん",   icon:"💨", cost:1, text_jp:"こうげきに +3 ダメージ！",     effect:{type:C.DMG_BONUS, v:3},    needsTarget:false, attackMod:true },
    { id:"mega_punch", name_jp:"メガ パンチ",       icon:"👊", cost:2, text_jp:"こうげきに +5 ダメージ！",     effect:{type:C.DMG_BONUS, v:5},    needsTarget:false, attackMod:true },
    { id:"unko_shield",name_jp:"ウンコ シールド",   icon:"🛡️", cost:1, text_jp:"つぎの ボスこうげきを ブロック！", effect:{type:C.SHIELD_SELF},        needsTarget:false },
    { id:"team_shield",name_jp:"チーム シールド",   icon:"✨", cost:2, text_jp:"みんな つぎの こうげきを ブロック！", effect:{type:C.SHIELD_TEAM},     needsTarget:false },
    { id:"heal",       name_jp:"バナナ かいふく",   icon:"🍌", cost:1, text_jp:"なかまの HP を 5 かいふく！",  effect:{type:C.HEAL_TARGET, v:5}, needsTarget:true, targetType:"player" },
    { id:"team_heal",  name_jp:"おなら きゅういん",  icon:"🌬️", cost:2, text_jp:"みんなの HP を 3 かいふく！",  effect:{type:C.HEAL_TEAM, v:3},   needsTarget:false },
    { id:"energy",     name_jp:"エナジードリンク",   icon:"🥤", cost:0, text_jp:"エナジー +2！",                effect:{type:C.ENERGY, v:2},      needsTarget:false },
    { id:"draw_two",   name_jp:"カードドロー",       icon:"🎴", cost:1, text_jp:"カードを 2まい ひく！",        effect:{type:C.DRAW, v:2},        needsTarget:false },
    { id:"combo",      name_jp:"チーム コンボ！",    icon:"🔥", cost:1, text_jp:"つぎの なかまの こうげきが ×2！", effect:{type:C.DOUBLE_NEXT},     needsTarget:false },
    { id:"spread",     name_jp:"ベロ ビーム",       icon:"👅", cost:2, text_jp:"ランダムな パーツに 2ダメ ×2！", effect:{type:C.HIT_RANDOM_2, v:2},  needsTarget:false, attackMod:false },
    { id:"reveal",     name_jp:"スパイ チェック",   icon:"🔍", cost:1, text_jp:"だれかの ロールを みる！",       effect:{type:C.REVEAL_ROLE},      needsTarget:true, targetType:"player" },
    { id:"escape",     name_jp:"にげる！",           icon:"🏃", cost:1, text_jp:"つぎの ボスこうげきを かわす！", effect:{type:C.SKIP_BOSS_ATK},    needsTarget:false },
    { id:"hint",       name_jp:"ヒント！",           icon:"💡", cost:0, text_jp:"まちがいを 1つ けす！",        effect:{type:C.HINT},             needsTarget:false, beforeQ:true },
    { id:"reroll",     name_jp:"きあいだ！",         icon:"💪", cost:1, text_jp:"もんだいを やりなおす！",      effect:{type:C.REROLL_Q},         needsTarget:false, beforeQ:true },
  ];

  // Build the deck: more copies of cheap cards
  function buildDeck(jinroMode) {
    const deck = [];
    const counts = {
      fart_bomb: 6, mega_punch: 3, unko_shield: 4, team_shield: 2, heal: 4,
      team_heal: 2, energy: 4, draw_two: 3, combo: 3, spread: 2,
      reveal: jinroMode ? 3 : 0, escape: 3, hint: 4, reroll: 0
    };
    for (const c of POOL) {
      const n = counts[c.id] || 0;
      for (let i = 0; i < n; i++) deck.push({...c});
    }
    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  function byId(id) { return POOL.find(c => c.id === id); }

  return { POOL, buildDeck, byId, C };
})();
