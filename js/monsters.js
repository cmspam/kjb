// Boss definitions and SVG renderer.
// Each boss has parts. Each part has hp, effect, and draw fn that takes a damage state.
// Damage state: 0 = healthy, 1 = bloody/hurt, 2 = destroyed.
window.Monsters = (() => {

  // ---- Reusable SVG part builders ----
  const SVG_NS = "http://www.w3.org/2000/svg";

  function partState(part) {
    if (part.hp <= 0) return 2;
    if (part.hp <= part.maxHP * 0.5) return 1;
    return 0;
  }

  // -- Eye (round, with pupil) --
  function drawEye(part, color="#fff") {
    const s = partState(part);
    const {x, y, r} = part.geom;
    if (s === 2) {
      // X eye
      return `
        <g class="part part-${part.id}">
          <circle cx="${x}" cy="${y}" r="${r}" fill="#553" opacity=".35"/>
          <line x1="${x-r*0.7}" y1="${y-r*0.7}" x2="${x+r*0.7}" y2="${y+r*0.7}" stroke="#000" stroke-width="${r*0.35}" stroke-linecap="round"/>
          <line x1="${x+r*0.7}" y1="${y-r*0.7}" x2="${x-r*0.7}" y2="${y+r*0.7}" stroke="#000" stroke-width="${r*0.35}" stroke-linecap="round"/>
        </g>`;
    }
    const tear = s === 1 ? `<path d="M ${x-r*0.3} ${y+r*0.7} q -2 ${r*0.6} ${r*0.4} ${r*0.9}" fill="#7cf" opacity=".9"/>` : "";
    const blink = part.geom.blink ? "" : "";
    return `
      <g class="part part-${part.id} bob" style="animation-delay: ${(part.geom.delay||0)}s">
        <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#000" stroke-width="3"/>
        <circle cx="${x+r*0.15}" cy="${y+r*0.15}" r="${r*0.45}" fill="#222"/>
        <circle cx="${x+r*0.3}" cy="${y-r*0.05}" r="${r*0.15}" fill="#fff"/>
        ${tear}
      </g>`;
  }

  // -- Tentacle (curved squiggle) --
  function drawTentacle(part, color="#ff8ec7") {
    const s = partState(part);
    const {x, y, dir, len} = part.geom; // dir: angle in degrees
    const rad = dir * Math.PI/180;
    if (s === 2) {
      // stump with bandage
      const sx = x + Math.cos(rad)*30;
      const sy = y + Math.sin(rad)*30;
      return `
        <g class="part part-${part.id}">
          <ellipse cx="${sx}" cy="${sy}" rx="22" ry="14" fill="${color}" stroke="#000" stroke-width="3"/>
          <rect x="${sx-22}" y="${sy-6}" width="44" height="12" fill="#fff" stroke="#000" stroke-width="2"/>
          <line x1="${sx-18}" y1="${sy-6}" x2="${sx-12}" y2="${sy+6}" stroke="#000" stroke-width="2"/>
          <line x1="${sx-6}" y1="${sy-6}" x2="${sx}" y2="${sy+6}" stroke="#000" stroke-width="2"/>
          <line x1="${sx+6}" y1="${sy-6}" x2="${sx+12}" y2="${sy+6}" stroke="#000" stroke-width="2"/>
        </g>`;
    }
    // wavy tentacle
    const cx1 = x + Math.cos(rad)*len*0.4 + Math.cos(rad+1.5)*30;
    const cy1 = y + Math.sin(rad)*len*0.4 + Math.sin(rad+1.5)*30;
    const cx2 = x + Math.cos(rad)*len*0.7 - Math.cos(rad+1.5)*30;
    const cy2 = y + Math.sin(rad)*len*0.7 - Math.sin(rad+1.5)*30;
    const ex = x + Math.cos(rad)*len;
    const ey = y + Math.sin(rad)*len;
    const hurt = s === 1 ? `<path d="M ${cx1-6} ${cy1} l 6 -10 l 6 10 l 6 -10" stroke="#ff3b6b" stroke-width="3" fill="none"/>` : "";
    return `
      <g class="part part-${part.id}">
        <path d="M ${x} ${y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${ey}"
          stroke="${color}" stroke-width="34" stroke-linecap="round" fill="none"
          stroke-linejoin="round" />
        <path d="M ${x} ${y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${ey}"
          stroke="#000" stroke-width="38" stroke-linecap="round" fill="none" opacity=".18"/>
        ${hurt}
      </g>`;
  }

  // -- Beak / mouth --
  function drawBeak(part, color="#ffcc66") {
    const s = partState(part);
    const {x, y, w, h, mood="open"} = part.geom;
    if (s === 2) {
      return `
        <g class="part part-${part.id}">
          <text x="${x}" y="${y+5}" text-anchor="middle" font-size="${h*1.4}" fill="#000" font-weight="900">×</text>
        </g>`;
    }
    // open mouth with teeth
    return `
      <g class="part part-${part.id}">
        <ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="#220" stroke="#000" stroke-width="3"/>
        <polygon points="${x-w*0.6},${y-h*0.5} ${x-w*0.4},${y+h*0.4} ${x-w*0.2},${y-h*0.5}" fill="#fff"/>
        <polygon points="${x-w*0.05},${y-h*0.5} ${x+w*0.15},${y+h*0.4} ${x+w*0.35},${y-h*0.5}" fill="#fff"/>
        <polygon points="${x+w*0.4},${y-h*0.5} ${x+w*0.6},${y+h*0.5} ${x+w*0.8},${y-h*0.5}" fill="#fff"/>
        ${s===1 ? `<path d="M ${x-w} ${y-h} q ${w} -10 ${w*2} 0" stroke="#ff3b6b" stroke-width="3" fill="none"/>` : ""}
      </g>`;
  }

  // -- Antenna --
  function drawAntenna(part, color="#9af") {
    const s = partState(part);
    const {x, y, h} = part.geom;
    if (s === 2) {
      return `<g class="part part-${part.id}">
        <line x1="${x}" y1="${y}" x2="${x}" y2="${y-h*0.3}" stroke="#000" stroke-width="6" stroke-linecap="round"/>
        <text x="${x+10}" y="${y-h*0.2}" font-size="22" fill="#ff3b6b">💥</text>
      </g>`;
    }
    return `
      <g class="part part-${part.id} bob" style="animation-delay:.3s">
        <line x1="${x}" y1="${y}" x2="${x}" y2="${y-h}" stroke="#000" stroke-width="6" stroke-linecap="round"/>
        <circle cx="${x}" cy="${y-h-8}" r="14" fill="${color}" stroke="#000" stroke-width="3"/>
        ${s===1 ? `<path d="M ${x-12} ${y-h*0.5} l 24 6 l -24 6" stroke="#ff3b6b" stroke-width="2" fill="none"/>` : ""}
      </g>`;
  }

  // -- Leg / arm --
  function drawLeg(part, color="#ff8ec7") {
    const s = partState(part);
    const {x, y, dir, len} = part.geom;
    const rad = dir * Math.PI/180;
    if (s === 2) {
      const sx = x + Math.cos(rad)*30;
      const sy = y + Math.sin(rad)*30;
      return `<g class="part part-${part.id}">
        <ellipse cx="${sx}" cy="${sy}" rx="20" ry="14" fill="${color}" stroke="#000" stroke-width="3"/>
        <text x="${sx}" y="${sy+5}" text-anchor="middle" font-size="20" fill="#000">×</text>
      </g>`;
    }
    const ex = x + Math.cos(rad)*len;
    const ey = y + Math.sin(rad)*len;
    return `<g class="part part-${part.id}">
      <line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="22" stroke-linecap="round"/>
      <line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="#000" stroke-width="26" stroke-linecap="round" opacity=".18"/>
      <ellipse cx="${ex}" cy="${ey}" rx="18" ry="10" fill="${color}" stroke="#000" stroke-width="3"/>
      ${s===1 ? `<text x="${ex}" y="${ey-10}" font-size="20" fill="#ff3b6b">!</text>` : ""}
    </g>`;
  }

  // -- Belly screen / button (special) --
  function drawBelly(part) {
    const s = partState(part);
    const {x, y, w, h} = part.geom;
    if (s === 2) {
      return `<g class="part part-${part.id}">
        <rect x="${x-w}" y="${y-h}" width="${w*2}" height="${h*2}" rx="10" fill="#222" stroke="#000" stroke-width="3"/>
        <text x="${x}" y="${y+8}" text-anchor="middle" font-size="44" fill="#ff3b6b">×</text>
      </g>`;
    }
    return `<g class="part part-${part.id}">
      <rect x="${x-w}" y="${y-h}" width="${w*2}" height="${h*2}" rx="10" fill="#0af" stroke="#000" stroke-width="3"/>
      <text x="${x}" y="${y+8}" text-anchor="middle" font-size="34" fill="#fff" font-weight="900">${s===1 ? "?_?" : ":3"}</text>
    </g>`;
  }

  // -- Tongue (silly) --
  function drawTongue(part, color="#ff5577") {
    const s = partState(part);
    const {x, y, len} = part.geom;
    if (s === 2) {
      return `<g class="part part-${part.id}">
        <text x="${x}" y="${y+10}" text-anchor="middle" font-size="22" fill="#000">×</text>
      </g>`;
    }
    return `<g class="part part-${part.id} bob" style="animation-delay:.2s">
      <path d="M ${x-12} ${y} q 0 ${len*0.5} ${len*0.3} ${len}
                q ${len*0.3} ${len*0.2} ${len*0.6} 0
                l 0 -${len*0.6} q -${len*0.3} -${len*0.2} -${len*0.6} 0 z"
            fill="${color}" stroke="#000" stroke-width="3"/>
    </g>`;
  }

  // ---- Boss factory: returns fresh deep copies ----

  function makeTakoTakoSahur() {
    return {
      id: "tako",
      name_jp: "タコタコ サフール",
      name_en: "Tako Tako Sahur",
      catchphrase: "タコ・タコ・サフール！",
      color: "#ff8ec7",
      // boss-level attack pattern
      attacksPerRound: 2,
      bodySVG: () => `
        <ellipse cx="400" cy="220" rx="160" ry="130" fill="#ff8ec7" stroke="#000" stroke-width="4"/>
        <ellipse cx="400" cy="170" rx="170" ry="80" fill="#ffaad4" stroke="#000" stroke-width="3" opacity=".6"/>
      `,
      parts: [
        { id:"t1", type:"limb", name_jp:"あし1", maxHP:6, hp:6, geom:{x:280,y:250,dir:165,len:140}, draw: drawTentacle, effect:"atk-1" },
        { id:"t2", type:"limb", name_jp:"あし2", maxHP:6, hp:6, geom:{x:300,y:280,dir:185,len:130}, draw: drawTentacle, effect:"atk-1" },
        { id:"t3", type:"limb", name_jp:"あし3", maxHP:6, hp:6, geom:{x:340,y:310,dir:200,len:130}, draw: drawTentacle, effect:"atk-1" },
        { id:"t4", type:"limb", name_jp:"あし4", maxHP:6, hp:6, geom:{x:460,y:310,dir:340,len:130}, draw: drawTentacle, effect:"atk-1" },
        { id:"t5", type:"limb", name_jp:"あし5", maxHP:6, hp:6, geom:{x:500,y:280,dir:355,len:130}, draw: drawTentacle, effect:"atk-1" },
        { id:"t6", type:"limb", name_jp:"あし6", maxHP:6, hp:6, geom:{x:520,y:250,dir:15,len:140}, draw: drawTentacle, effect:"atk-1" },
        { id:"eL", type:"eye",  name_jp:"ひだりめ", maxHP:8, hp:8, geom:{x:355,y:180,r:30,delay:0}, draw: drawEye, effect:"miss-50" },
        { id:"eR", type:"eye",  name_jp:"みぎめ",  maxHP:8, hp:8, geom:{x:445,y:180,r:30,delay:.4}, draw: drawEye, effect:"miss-30" },
        { id:"mouth", type:"mouth", name_jp:"くち", maxHP:10, hp:10, geom:{x:400,y:240,w:40,h:18}, draw: drawBeak, effect:"no-poison" },
        { id:"core", type:"core", name_jp:"のうみそ", maxHP:22, hp:22, geom:{x:400,y:120,r:28}, draw: drawEye, effect:"win" },
      ],
      hits: ["イタ〜！","ぎゃー！","タコパ〜！","おしりが ピリピリ！","タコ・タコ・タコ〜！"]
    };
  }

  function makeBombardiroUnkodilo() {
    return {
      id: "unko",
      name_jp: "ボンバルディロ ウンコディロ",
      name_en: "Bombardiro Unkodilo",
      catchphrase: "ボンバルディロ・ウンコディロ！",
      color: "#9b6b3a",
      attacksPerRound: 2,
      bodySVG: () => `
        <ellipse cx="400" cy="240" rx="180" ry="120" fill="#9b6b3a" stroke="#000" stroke-width="4"/>
        <ellipse cx="400" cy="180" rx="120" ry="80" fill="#7a4c20" stroke="#000" stroke-width="3"/>
        <ellipse cx="380" cy="230" rx="40" ry="20" fill="#b8895a"/>
        <ellipse cx="420" cy="260" rx="30" ry="14" fill="#b8895a"/>
        <ellipse cx="350" cy="200" rx="14" ry="6" fill="#5a3818"/>
        <ellipse cx="450" cy="220" rx="12" ry="6" fill="#5a3818"/>
      `,
      parts: [
        { id:"L1", type:"limb", name_jp:"うでR", maxHP:7, hp:7, geom:{x:560,y:230,dir:0,len:90}, draw: drawLeg, effect:"atk-1" },
        { id:"L2", type:"limb", name_jp:"うでL", maxHP:7, hp:7, geom:{x:240,y:230,dir:180,len:90}, draw: drawLeg, effect:"atk-1" },
        { id:"L3", type:"limb", name_jp:"あしR", maxHP:7, hp:7, geom:{x:480,y:340,dir:30,len:80}, draw: drawLeg, effect:"slow" },
        { id:"L4", type:"limb", name_jp:"あしL", maxHP:7, hp:7, geom:{x:320,y:340,dir:150,len:80}, draw: drawLeg, effect:"slow" },
        { id:"ant", type:"special", name_jp:"アンテナ", maxHP:5, hp:5, geom:{x:400,y:90,h:50}, draw: drawAntenna, effect:"no-special" },
        { id:"eR", type:"eye",  name_jp:"みぎめ", maxHP:8, hp:8, geom:{x:440,y:160,r:24,delay:0}, draw: drawEye, effect:"miss-50" },
        { id:"eL", type:"eye",  name_jp:"ひだりめ", maxHP:8, hp:8, geom:{x:360,y:160,r:24,delay:.3}, draw: drawEye, effect:"miss-30" },
        { id:"mouth", type:"mouth", name_jp:"くち", maxHP:10, hp:10, geom:{x:400,y:200,w:50,h:22}, draw: drawBeak, effect:"no-poison" },
        { id:"belly", type:"special", name_jp:"おなか", maxHP:9, hp:9, geom:{x:400,y:270,w:55,h:38}, draw: drawBelly, effect:"weak-spot" },
        { id:"core", type:"core", name_jp:"コア", maxHP:24, hp:24, geom:{x:400,y:400,r:24}, draw: drawEye, effect:"win" },
      ],
      hits: ["ウンコ もれる！","ブッ！","おなかが いたい！","ボン！ボン！","ウンコ・ディロ〜！"]
    };
  }

  function makeTralaleroPakupaku() {
    return {
      id: "tral",
      name_jp: "トラララ パクパク",
      name_en: "Tralalero Pakupaku",
      catchphrase: "トラララ・トラララ・パクパク！",
      color: "#7cd1ff",
      attacksPerRound: 2,
      bodySVG: () => `
        <ellipse cx="400" cy="240" rx="180" ry="120" fill="#7cd1ff" stroke="#000" stroke-width="4"/>
        <ellipse cx="400" cy="240" rx="170" ry="110" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>
        <path d="M 250 240 q -80 -20 -80 -60 q 30 60 80 60" fill="#7cd1ff" stroke="#000" stroke-width="3"/>
        <path d="M 250 240 q -80 20 -80 60 q 30 -60 80 -60" fill="#7cd1ff" stroke="#000" stroke-width="3"/>
      `,
      parts: [
        { id:"finT", type:"limb", name_jp:"せびれ", maxHP:6, hp:6, geom:{x:400,y:120,dir:270,len:60}, draw: drawLeg, effect:"slow" },
        { id:"finL", type:"limb", name_jp:"ひれL", maxHP:6, hp:6, geom:{x:330,y:280,dir:200,len:90}, draw: drawLeg, effect:"atk-1" },
        { id:"finR", type:"limb", name_jp:"ひれR", maxHP:6, hp:6, geom:{x:470,y:280,dir:340,len:90}, draw: drawLeg, effect:"atk-1" },
        { id:"legL", type:"limb", name_jp:"あしL", maxHP:7, hp:7, geom:{x:370,y:340,dir:130,len:80}, draw: drawLeg, effect:"slow" },
        { id:"legR", type:"limb", name_jp:"あしR", maxHP:7, hp:7, geom:{x:430,y:340,dir:50,len:80}, draw: drawLeg, effect:"slow" },
        { id:"eL", type:"eye", name_jp:"ひだりめ", maxHP:7, hp:7, geom:{x:360,y:200,r:30,delay:0}, draw: drawEye, effect:"miss-40" },
        { id:"eR", type:"eye", name_jp:"みぎめ", maxHP:7, hp:7, geom:{x:440,y:200,r:30,delay:.4}, draw: drawEye, effect:"miss-40" },
        { id:"mouth", type:"mouth", name_jp:"おおきなくち", maxHP:11, hp:11, geom:{x:400,y:265,w:60,h:24}, draw: drawBeak, effect:"no-poison" },
        { id:"tongue", type:"special", name_jp:"べろ", maxHP:6, hp:6, geom:{x:400,y:285,len:60}, draw: drawTongue, effect:"weak-spot" },
        { id:"core", type:"core", name_jp:"ハート", maxHP:22, hp:22, geom:{x:400,y:235,r:22}, draw: drawEye, effect:"win" },
      ],
      hits: ["パク！パク！","トラララ〜！","おさかな いたい！","ピチピチ！","しっぽが ピンチ！"]
    };
  }

  function makeBrrPampamu() {
    return {
      id: "pamp",
      name_jp: "ブルブル パンパム",
      name_en: "Brr Brr Pampamu",
      catchphrase: "ブルブル・ブルブル・パンパム！",
      color: "#caa6e8",
      attacksPerRound: 2,
      bodySVG: () => `
        <ellipse cx="400" cy="250" rx="170" ry="130" fill="#caa6e8" stroke="#000" stroke-width="4"/>
        <circle cx="400" cy="180" r="100" fill="#dec0fa" stroke="#000" stroke-width="4"/>
        <path d="M 340 110 q 20 -40 60 -20" fill="#dec0fa" stroke="#000" stroke-width="3"/>
        <path d="M 460 110 q -20 -40 -60 -20" fill="#dec0fa" stroke="#000" stroke-width="3"/>
      `,
      parts: [
        { id:"earL", type:"special", name_jp:"みみL", maxHP:5, hp:5, geom:{x:340,y:90,h:40}, draw: drawAntenna, effect:"no-special" },
        { id:"earR", type:"special", name_jp:"みみR", maxHP:5, hp:5, geom:{x:460,y:90,h:40}, draw: drawAntenna, effect:"no-special" },
        { id:"armL", type:"limb", name_jp:"うでL", maxHP:6, hp:6, geom:{x:260,y:240,dir:185,len:100}, draw: drawLeg, effect:"atk-1" },
        { id:"armR", type:"limb", name_jp:"うでR", maxHP:6, hp:6, geom:{x:540,y:240,dir:355,len:100}, draw: drawLeg, effect:"atk-1" },
        { id:"legL", type:"limb", name_jp:"あしL", maxHP:7, hp:7, geom:{x:370,y:370,dir:120,len:60}, draw: drawLeg, effect:"slow" },
        { id:"legR", type:"limb", name_jp:"あしR", maxHP:7, hp:7, geom:{x:430,y:370,dir:60,len:60}, draw: drawLeg, effect:"slow" },
        { id:"eL", type:"eye", name_jp:"ひだりめ", maxHP:7, hp:7, geom:{x:360,y:180,r:24,delay:0}, draw: drawEye, effect:"miss-40" },
        { id:"eR", type:"eye", name_jp:"みぎめ", maxHP:7, hp:7, geom:{x:440,y:180,r:24,delay:.3}, draw: drawEye, effect:"miss-40" },
        { id:"mouth", type:"mouth", name_jp:"くち", maxHP:9, hp:9, geom:{x:400,y:225,w:30,h:14}, draw: drawBeak, effect:"no-poison" },
        { id:"butt", type:"special", name_jp:"おしり", maxHP:9, hp:9, geom:{x:400,y:330,w:50,h:30}, draw: drawBelly, effect:"weak-spot" },
        { id:"core", type:"core", name_jp:"ハート", maxHP:23, hp:23, geom:{x:400,y:240,r:22}, draw: drawEye, effect:"win" },
      ],
      hits: ["ブルブル〜！","パンパム！","ふわふわ いたい！","おならが でた！","ママ〜！"]
    };
  }

  const factories = [makeTakoTakoSahur, makeBombardiroUnkodilo, makeTralaleroPakupaku, makeBrrPampamu];

  function randomBoss() {
    return factories[Math.floor(Math.random()*factories.length)]();
  }

  function renderBossSVG(boss) {
    const partsSVG = boss.parts.map(p => p.draw(p, boss.color)).join("\n");
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      ${boss.bodySVG()}
      ${partsSVG}
    </svg>`;
  }

  // Returns alive parts only
  function alive(boss) { return boss.parts.filter(p => p.hp > 0); }
  function aliveTargets(boss) {
    // core is targetable but only deals normal damage
    return alive(boss);
  }
  function partById(boss, id) { return boss.parts.find(p => p.id === id); }

  // Compute boss attack count this round, modifiers from destroyed parts.
  function bossModifiers(boss) {
    let atks = boss.attacksPerRound;
    let missChance = 0;
    let hasSpecial = true;
    for (const p of boss.parts) {
      if (p.hp > 0) continue;
      if (p.effect === "atk-1") atks -= 1;
      if (p.effect === "miss-50") missChance += 0.5;
      if (p.effect === "miss-40") missChance += 0.4;
      if (p.effect === "miss-30") missChance += 0.3;
      if (p.effect === "no-special" || p.effect === "no-poison") hasSpecial = false;
      if (p.effect === "slow") atks -= 0.5; // half-slow
    }
    atks = Math.max(0, Math.floor(atks));
    missChance = Math.min(0.85, missChance);
    return { atks, missChance, hasSpecial };
  }

  // damage multiplier from destroyed weak-spots
  function damageMultiplier(boss) {
    let m = 1;
    for (const p of boss.parts) {
      if (p.hp <= 0 && p.effect === "weak-spot") m += 0.5;
    }
    return m;
  }

  return { randomBoss, renderBossSVG, alive, aliveTargets, partById, bossModifiers, damageMultiplier };
})();
