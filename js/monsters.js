// Boss definitions and SVG renderer.
// Each part has a draw fn that returns an SVG fragment based on damage state.
// Damage states: 0 healthy, 1 damaged (hp <= 50%), 2 destroyed (hp = 0).
window.Monsters = (() => {

  function partState(p) { if (p.hp <= 0) return 2; if (p.hp <= p.maxHP * 0.5) return 1; return 0; }

  // Reusable injury decals used during state===1 (damaged but not destroyed)
  function bandage(x, y, rot=15, w=22, h=8) {
    return `<g transform="translate(${x},${y}) rotate(${rot})">
      <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="2" fill="#ffe5b8" stroke="#000" stroke-width="1.5"/>
      <line x1="${-w/2+4}" y1="${-h/2+1}" x2="${-w/2+6}" y2="${h/2-1}" stroke="#000" stroke-width="1"/>
      <line x1="${-w/2+10}" y1="${-h/2+1}" x2="${-w/2+12}" y2="${h/2-1}" stroke="#000" stroke-width="1"/>
      <line x1="${-w/2+16}" y1="${-h/2+1}" x2="${-w/2+18}" y2="${h/2-1}" stroke="#000" stroke-width="1"/>
    </g>`;
  }
  function bruise(x, y, w=10, h=6) {
    return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="#5a2a4a" opacity=".7"/>
            <ellipse cx="${x-2}" cy="${y-1}" rx="${w*0.5}" ry="${h*0.4}" fill="#8a4070" opacity=".7"/>`;
  }
  function scratch(x, y, sz=10) {
    return `<path d="M ${x-sz} ${y-sz*0.3} L ${x+sz} ${y+sz*0.3}" stroke="#a01" stroke-width="2" stroke-linecap="round"/>
            <path d="M ${x-sz*0.6} ${y-sz*0.5} L ${x+sz*0.4} ${y+sz*0.4}" stroke="#a01" stroke-width="1.5" stroke-linecap="round"/>`;
  }
  function bump(x, y, r=6) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff8888" stroke="#000" stroke-width="1.5"/>
            <circle cx="${x-r*0.3}" cy="${y-r*0.3}" r="${r*0.3}" fill="#fff" opacity=".6"/>`;
  }
  function sweatDrop(x, y) {
    return `<path d="M ${x} ${y-10} Q ${x-4} ${y-2} ${x} ${y+4} Q ${x+4} ${y-2} ${x} ${y-10} Z" fill="#7cd1ff" stroke="#0a3a5a" stroke-width="1.5"/>`;
  }

  // -------- Reusable drawing helpers --------

  // Big cartoon eye with sparkle, eyebrow optionally
  function drawEye(part, color) {
    const s = partState(part);
    const { x, y, r, mood = "happy" } = part.geom;
    if (s === 2) {
      return `<g class="part">
        <circle cx="${x}" cy="${y}" r="${r}" fill="#3a2a4a" opacity=".5"/>
        <line x1="${x-r*0.7}" y1="${y-r*0.7}" x2="${x+r*0.7}" y2="${y+r*0.7}" stroke="#000" stroke-width="${Math.max(4,r*0.3)}" stroke-linecap="round"/>
        <line x1="${x+r*0.7}" y1="${y-r*0.7}" x2="${x-r*0.7}" y2="${y+r*0.7}" stroke="#000" stroke-width="${Math.max(4,r*0.3)}" stroke-linecap="round"/>
        <text x="${x}" y="${y+r*1.6}" text-anchor="middle" font-size="${r*0.9}">💫</text>
      </g>`;
    }
    const browL = mood === "angry" ? `<path d="M ${x-r} ${y-r*1.1} L ${x+r*0.4} ${y-r*0.5}" stroke="#000" stroke-width="${r*0.25}" stroke-linecap="round"/>` :
                                      `<path d="M ${x-r*0.9} ${y-r*1.2} Q ${x} ${y-r*1.6} ${x+r*0.7} ${y-r*1.1}" stroke="#000" stroke-width="${r*0.18}" fill="none" stroke-linecap="round"/>`;
    const damage = s === 1 ? `
      ${bruise(x-r*0.6, y+r*1.0, r*0.5, r*0.25)}
      ${sweatDrop(x+r*0.9, y-r*0.6)}
      <path d="M ${x-r*0.3} ${y+r*0.4} Q ${x-r*0.5} ${y+r*1.2} ${x-r*0.1} ${y+r*1.6}" fill="#7cd1ff" stroke="#0a3a5a" stroke-width="2"/>
      ${bandage(x-r*0.1, y-r*0.95, -10, r*1.4, 6)}
    ` : "";
    return `<g class="part bob" style="animation-delay:${(part.geom.delay||0)}s; transform-origin:${x}px ${y}px">
      <ellipse cx="${x+r*0.05}" cy="${y+r*0.15}" rx="${r}" ry="${r*1.05}" fill="#fff" stroke="#000" stroke-width="${Math.max(3,r*0.15)}"/>
      <ellipse cx="${x+r*0.1}" cy="${y+r*0.18}" rx="${r*0.55}" ry="${r*0.7}" fill="#222"/>
      <circle cx="${x+r*0.3}" cy="${y-r*0.1}" r="${r*0.22}" fill="#fff"/>
      <circle cx="${x-r*0.15}" cy="${y+r*0.35}" r="${r*0.1}" fill="#fff" opacity=".7"/>
      ${browL}
      ${damage}
    </g>`;
  }

  // Tentacle with curve, suction cups, gradient feel
  function drawTentacle(part, color) {
    const s = partState(part);
    const { x, y, dir, len } = part.geom;
    const rad = dir * Math.PI/180;
    if (s === 2) {
      const sx = x + Math.cos(rad)*40;
      const sy = y + Math.sin(rad)*40;
      return `<g class="part">
        <ellipse cx="${sx}" cy="${sy}" rx="28" ry="20" fill="${color}" stroke="#000" stroke-width="3"/>
        <path d="M ${sx-26} ${sy-2} L ${sx+26} ${sy-2} L ${sx+26} ${sy+10} L ${sx-26} ${sy+10} Z" fill="#fff" stroke="#000" stroke-width="2"/>
        <line x1="${sx-22}" y1="${sy-4}" x2="${sx-16}" y2="${sy+12}" stroke="#000" stroke-width="2"/>
        <line x1="${sx-12}" y1="${sy-4}" x2="${sx-6}" y2="${sy+12}" stroke="#000" stroke-width="2"/>
        <line x1="${sx-2}" y1="${sy-4}" x2="${sx+4}" y2="${sy+12}" stroke="#000" stroke-width="2"/>
        <line x1="${sx+8}" y1="${sy-4}" x2="${sx+14}" y2="${sy+12}" stroke="#000" stroke-width="2"/>
        <text x="${sx}" y="${sy-22}" text-anchor="middle" font-size="20">💥</text>
      </g>`;
    }
    // 3-segment curve for waviness
    const cx1 = x + Math.cos(rad)*len*0.35 + Math.cos(rad+1.5)*30;
    const cy1 = y + Math.sin(rad)*len*0.35 + Math.sin(rad+1.5)*30;
    const cx2 = x + Math.cos(rad)*len*0.7 - Math.cos(rad+1.5)*30;
    const cy2 = y + Math.sin(rad)*len*0.7 - Math.sin(rad+1.5)*30;
    const ex = x + Math.cos(rad)*len;
    const ey = y + Math.sin(rad)*len;
    const cracks = s === 1 ? `
      ${bandage(cx1, cy1, dir-90, 28, 10)}
      ${bandage((cx2+ex)/2, (cy2+ey)/2, dir+90, 22, 8)}
      ${bruise(cx2, cy2, 8, 5)}
      ${scratch(cx1+10, cy1+8, 8)}
    ` : "";
    // Suction cups along the way
    const cups = (s === 0) ? `
      <circle cx="${cx1+6}" cy="${cy1+6}" r="6" fill="#fff" stroke="#000" stroke-width="2"/>
      <circle cx="${cx2-4}" cy="${cy2-2}" r="5" fill="#fff" stroke="#000" stroke-width="2"/>
      <circle cx="${ex-Math.cos(rad)*22}" cy="${ey-Math.sin(rad)*22}" r="5" fill="#fff" stroke="#000" stroke-width="2"/>
    ` : "";
    return `<g class="part">
      <path d="M ${x} ${y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${ey}"
        stroke="#000" stroke-width="42" stroke-linecap="round" fill="none"/>
      <path d="M ${x} ${y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${ey}"
        stroke="${color}" stroke-width="34" stroke-linecap="round" fill="none"/>
      <path d="M ${x} ${y} C ${cx1+4} ${cy1-4}, ${cx2+2} ${cy2-2}, ${ex+2} ${ey-2}"
        stroke="rgba(255,255,255,.35)" stroke-width="10" stroke-linecap="round" fill="none"/>
      ${cups}
      ${cracks}
    </g>`;
  }

  // Mouth / beak with teeth + tongue
  function drawMouth(part, color) {
    const s = partState(part);
    const { x, y, w, h } = part.geom;
    if (s === 2) {
      return `<g class="part">
        <ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h*0.6}" fill="#fff" stroke="#000" stroke-width="3"/>
        <text x="${x}" y="${y+h*0.6}" text-anchor="middle" font-size="${h*1.4}" fill="#000" font-weight="900">×</text>
      </g>`;
    }
    const teeth = `
      <polygon points="${x-w*0.55},${y-h*0.3} ${x-w*0.4},${y+h*0.55} ${x-w*0.25},${y-h*0.3}" fill="#fff" stroke="#000" stroke-width="1.5"/>
      <polygon points="${x-w*0.1},${y-h*0.3} ${x+w*0.05},${y+h*0.55} ${x+w*0.2},${y-h*0.3}" fill="#fff" stroke="#000" stroke-width="1.5"/>
      <polygon points="${x+w*0.35},${y-h*0.3} ${x+w*0.5},${y+h*0.55} ${x+w*0.65},${y-h*0.3}" fill="#fff" stroke="#000" stroke-width="1.5"/>`;
    const tongue = `<ellipse cx="${x}" cy="${y+h*0.4}" rx="${w*0.45}" ry="${h*0.3}" fill="#ff7099" stroke="#000" stroke-width="2"/>`;
    const drool = s===1 ? `
      <path d="M ${x+w*0.3} ${y+h*0.4} Q ${x+w*0.4} ${y+h*1.2} ${x+w*0.5} ${y+h*1.6}" stroke="#7cd1ff" stroke-width="3" fill="none"/>
      <path d="M ${x-w*0.4} ${y+h*0.3} Q ${x-w*0.45} ${y+h*1.0} ${x-w*0.5} ${y+h*1.4}" stroke="#7cd1ff" stroke-width="2" fill="none"/>
      ${bandage(x-w*0.7, y+h*0.1, 30, 18, 6)}
      ${bruise(x+w*0.6, y-h*0.7, 8, 4)}
    ` : "";
    return `<g class="part">
      <path d="M ${x-w} ${y-h*0.4} Q ${x} ${y-h*0.6} ${x+w} ${y-h*0.4} Q ${x+w*1.05} ${y+h*0.7} ${x} ${y+h} Q ${x-w*1.05} ${y+h*0.7} ${x-w} ${y-h*0.4} Z"
            fill="#3a0d1a" stroke="#000" stroke-width="3"/>
      ${tongue}
      ${teeth}
      ${drool}
    </g>`;
  }

  // Antenna with bouncy ball
  function drawAntenna(part, color) {
    const s = partState(part);
    const { x, y, h } = part.geom;
    if (s === 2) {
      return `<g class="part">
        <line x1="${x}" y1="${y}" x2="${x+6}" y2="${y-h*0.4}" stroke="#000" stroke-width="6" stroke-linecap="round"/>
        <text x="${x+12}" y="${y-h*0.3}" font-size="22">💥</text>
      </g>`;
    }
    const wave = s === 1 ? "transform=\"rotate(15 "+x+" "+y+")\"" : "";
    const dmg = s === 1 ? `${bandage(x, y-h*0.4, 70, 14, 5)}<text x="${x+18}" y="${y-h*0.6}" font-size="14">⚡</text>` : "";
    return `<g class="part bob" style="animation-delay:.3s" ${wave}>
      <path d="M ${x} ${y} Q ${x-8} ${y-h*0.5} ${x} ${y-h}" stroke="#000" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="${x}" cy="${y-h-12}" r="14" fill="${color}" stroke="#000" stroke-width="3"/>
      <circle cx="${x}" cy="${y-h-12}" r="14" fill="${color}" opacity=".4"/>
      <circle cx="${x-4}" cy="${y-h-16}" r="4" fill="#fff" opacity=".7"/>
      <text x="${x}" y="${y-h-7}" text-anchor="middle" font-size="14" fill="#000">★</text>
      ${dmg}
    </g>`;
  }

  // Limb (arm/leg) with chunky shape, hand/foot at end
  function drawLeg(part, color, opts={}) {
    const s = partState(part);
    const { x, y, dir, len } = part.geom;
    const rad = dir * Math.PI/180;
    const ex = x + Math.cos(rad)*len;
    const ey = y + Math.sin(rad)*len;
    if (s === 2) {
      return `<g class="part">
        <ellipse cx="${x+Math.cos(rad)*30}" cy="${y+Math.sin(rad)*30}" rx="22" ry="16" fill="${color}" stroke="#000" stroke-width="3"/>
        <text x="${x+Math.cos(rad)*30}" y="${y+Math.sin(rad)*30+7}" text-anchor="middle" font-size="24">💥</text>
      </g>`;
    }
    const claw = opts.claw ? `<path d="M ${ex-10} ${ey-12} L ${ex-4} ${ey-22} L ${ex+2} ${ey-12}" fill="#eee" stroke="#000" stroke-width="2"/>
      <path d="M ${ex+2} ${ey-12} L ${ex+8} ${ey-22} L ${ex+14} ${ey-12}" fill="#eee" stroke="#000" stroke-width="2"/>` : "";
    const hand = opts.hand ? `<circle cx="${ex}" cy="${ey}" r="22" fill="${color}" stroke="#000" stroke-width="3"/>
      <circle cx="${ex-8}" cy="${ey-2}" r="5" fill="#fff" opacity=".6"/>` : "";
    const foot = opts.foot ? `<ellipse cx="${ex}" cy="${ey}" rx="24" ry="14" fill="${color}" stroke="#000" stroke-width="3"/>
      <ellipse cx="${ex-8}" cy="${ey-2}" rx="3" ry="2" fill="#fff" opacity=".6"/>` : "";
    const dmg = s===1 ? `
      ${bruise((x+ex)/2, (y+ey)/2, 10, 6)}
      ${bandage(x + (ex-x)*0.7, y + (ey-y)*0.7, dir+90, 22, 8)}
      ${scratch(x + (ex-x)*0.4, y + (ey-y)*0.4, 8)}
    ` : "";
    return `<g class="part">
      <line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="#000" stroke-width="32" stroke-linecap="round"/>
      <line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="24" stroke-linecap="round"/>
      <line x1="${x-2}" y1="${y-2}" x2="${ex-2}" y2="${ey-2}" stroke="rgba(255,255,255,.3)" stroke-width="8" stroke-linecap="round"/>
      ${hand}${foot}${claw}${dmg}
    </g>`;
  }

  // Belly screen (digital face) or general "body part"
  function drawBelly(part, color) {
    const s = partState(part);
    const { x, y, w, h } = part.geom;
    if (s === 2) {
      return `<g class="part">
        <rect x="${x-w}" y="${y-h}" width="${w*2}" height="${h*2}" rx="14" fill="#222" stroke="#000" stroke-width="3"/>
        <text x="${x}" y="${y+h*0.4}" text-anchor="middle" font-size="${h*1.4}" fill="#ff3b6b" font-weight="900">×</text>
        <text x="${x-w*0.7}" y="${y-h*0.4}" font-size="20">⚡</text>
        <text x="${x+w*0.5}" y="${y-h*0.4}" font-size="20">💥</text>
      </g>`;
    }
    const face = s === 1 ? ">_<" : ":3";
    const dmg = s === 1 ? `
      ${bandage(x-w*0.6, y-h*0.4, -20, w*0.8, 8)}
      ${scratch(x+w*0.3, y+h*0.3, 12)}
      <path d="M ${x-w*0.4} ${y-h*0.6} L ${x-w*0.2} ${y-h*0.2} L ${x-w*0.5} ${y-h*0.1} L ${x-w*0.3} ${y+h*0.3}" stroke="#000" stroke-width="2" fill="none"/>
    ` : "";
    return `<g class="part">
      <rect x="${x-w-3}" y="${y-h-3}" width="${(w+3)*2}" height="${(h+3)*2}" rx="16" fill="#000"/>
      <rect x="${x-w}" y="${y-h}" width="${w*2}" height="${h*2}" rx="14" fill="#0a3548" stroke="#000" stroke-width="0"/>
      <rect x="${x-w+4}" y="${y-h+4}" width="${w*2-8}" height="${h*2-8}" rx="10" fill="#0fc4ff"/>
      <text x="${x}" y="${y+8}" text-anchor="middle" font-size="${h*0.9}" fill="#001a2e" font-weight="900">${face}</text>
      <rect x="${x-w}" y="${y-h}" width="${w*2}" height="${h*0.4}" rx="14" fill="#fff" opacity=".25"/>
      ${dmg}
    </g>`;
  }

  // Tongue (long, dangling)
  function drawTongue(part, color) {
    const s = partState(part);
    const { x, y, len } = part.geom;
    if (s === 2) {
      return `<g class="part">
        <text x="${x}" y="${y+18}" text-anchor="middle" font-size="22">💥</text>
      </g>`;
    }
    return `<g class="part bob" style="animation-delay:.4s">
      <path d="M ${x-14} ${y} Q ${x-22} ${y+len*0.3} ${x-10} ${y+len*0.6} Q ${x} ${y+len*0.85} ${x+10} ${y+len*0.6} Q ${x+22} ${y+len*0.3} ${x+14} ${y} Z"
            fill="#ff5a8a" stroke="#000" stroke-width="3"/>
      <line x1="${x}" y1="${y+10}" x2="${x}" y2="${y+len*0.7}" stroke="#c93366" stroke-width="3"/>
      <ellipse cx="${x-7}" cy="${y+10}" rx="3" ry="6" fill="#fff" opacity=".5"/>
    </g>`;
  }

  // Tail (with cute end)
  function drawTail(part, color) {
    const s = partState(part);
    const { x, y, dir, len } = part.geom;
    const rad = dir * Math.PI/180;
    if (s === 2) {
      return `<g class="part">
        <text x="${x+Math.cos(rad)*30}" y="${y+Math.sin(rad)*30}" text-anchor="middle" font-size="24">💥</text>
      </g>`;
    }
    const cx = x + Math.cos(rad)*len*0.5;
    const cy = y + Math.sin(rad)*len*0.5 + 30;
    const ex = x + Math.cos(rad)*len;
    const ey = y + Math.sin(rad)*len;
    return `<g class="part">
      <path d="M ${x} ${y} Q ${cx} ${cy} ${ex} ${ey}" stroke="#000" stroke-width="22" fill="none" stroke-linecap="round"/>
      <path d="M ${x} ${y} Q ${cx} ${cy} ${ex} ${ey}" stroke="${color}" stroke-width="14" fill="none" stroke-linecap="round"/>
      <circle cx="${ex}" cy="${ey}" r="14" fill="${color}" stroke="#000" stroke-width="3"/>
      <text x="${ex}" y="${ey+5}" text-anchor="middle" font-size="14">⭐</text>
    </g>`;
  }

  // Core (heart/brain weak point) — pulses
  function drawCore(part, color) {
    const s = partState(part);
    const { x, y, r } = part.geom;
    if (s === 2) {
      // Should be game over, but show shattered core anyway
      return `<g class="part"><text x="${x}" y="${y}" text-anchor="middle" font-size="${r*2}">💥</text></g>`;
    }
    const heart = `<path d="M ${x} ${y+r*0.7}
      C ${x-r*1.4} ${y-r*0.2}, ${x-r*1.4} ${y-r*1.1}, ${x-r*0.5} ${y-r*0.9}
      C ${x-r*0.2} ${y-r*0.85}, ${x} ${y-r*0.5}, ${x} ${y-r*0.3}
      C ${x} ${y-r*0.5}, ${x+r*0.2} ${y-r*0.85}, ${x+r*0.5} ${y-r*0.9}
      C ${x+r*1.4} ${y-r*1.1}, ${x+r*1.4} ${y-r*0.2}, ${x} ${y+r*0.7} Z"
      fill="#ff3b6b" stroke="#000" stroke-width="3"/>`;
    const glow = `<circle cx="${x}" cy="${y}" r="${r*1.6}" fill="#ff3b6b" opacity=".3" class="bob"/>`;
    const cracks = s===1 ? `<path d="M ${x-r*0.2} ${y-r*0.5} L ${x+r*0.1} ${y} L ${x-r*0.1} ${y+r*0.3}" stroke="#000" stroke-width="3" fill="none"/>` : "";
    const sparkle = `<text x="${x-r*0.4}" y="${y-r*0.2}" font-size="${r*0.7}" fill="#fff" opacity=".9">✦</text>`;
    return `<g class="part" style="transform-origin:${x}px ${y}px">
      ${glow}
      ${heart}
      ${sparkle}
      ${cracks}
    </g>`;
  }

  // Cheek blush
  function blushPair(cx, cy, dx) {
    return `<ellipse cx="${cx-dx}" cy="${cy}" rx="14" ry="9" fill="#ff6688" opacity=".55"/>
            <ellipse cx="${cx+dx}" cy="${cy}" rx="14" ry="9" fill="#ff6688" opacity=".55"/>`;
  }

  // -------- Boss factories --------

  function makeTakoTakoSahur() {
    const id = "tako";
    const color = "#ff8ec7";
    const f = window.I18N.boss(id);
    const pn = f.parts || {};
    return {
      id,
      name_jp: f.name_jp,
      name_en: f.name_en,
      catchphrase: f.catchphrase,
      attacks: f.attacks,
      taunts: f.taunts,
      backstory: f.backstory,
      weakness: f.weakness,
      weakness_label: f.weakness_label,
      color,
      attacksPerRound: 2,
      bodySVG: () => `
        <defs>
          <radialGradient id="takoBody" cx=".4" cy=".3" r=".8">
            <stop offset="0" stop-color="#ffc4dc"/>
            <stop offset="1" stop-color="#ff5fa3"/>
          </radialGradient>
        </defs>
        <ellipse cx="408" cy="240" rx="178" ry="50" fill="#000" opacity=".25"/>
        <ellipse cx="400" cy="200" rx="170" ry="135" fill="#000"/>
        <ellipse cx="400" cy="200" rx="160" ry="125" fill="url(#takoBody)"/>
        <ellipse cx="370" cy="140" rx="55" ry="30" fill="#fff" opacity=".45"/>
        <ellipse cx="420" cy="120" rx="20" ry="10" fill="#fff" opacity=".7"/>
        ${blushPair(400, 230, 80)}
      `,
      parts: [
        { id:"t1", type:"limb", name_jp:pn.t1, maxHP:6, hp:6, geom:{x:280,y:300,dir:165,len:130}, draw:(p)=>drawTentacle(p,color), effect:"atk-1" },
        { id:"t2", type:"limb", name_jp:pn.t2, maxHP:6, hp:6, geom:{x:310,y:330,dir:185,len:120}, draw:(p)=>drawTentacle(p,color), effect:"atk-1" },
        { id:"t3", type:"limb", name_jp:pn.t3, maxHP:6, hp:6, geom:{x:355,y:340,dir:200,len:120}, draw:(p)=>drawTentacle(p,color), effect:"atk-1" },
        { id:"t4", type:"limb", name_jp:pn.t4, maxHP:6, hp:6, geom:{x:445,y:340,dir:340,len:120}, draw:(p)=>drawTentacle(p,color), effect:"atk-1" },
        { id:"t5", type:"limb", name_jp:pn.t5, maxHP:6, hp:6, geom:{x:490,y:330,dir:355,len:120}, draw:(p)=>drawTentacle(p,color), effect:"atk-1" },
        { id:"t6", type:"limb", name_jp:pn.t6, maxHP:6, hp:6, geom:{x:520,y:300,dir:15,len:130}, draw:(p)=>drawTentacle(p,color), effect:"atk-1" },
        { id:"eL", type:"eye",  name_jp:pn.eL, maxHP:8, hp:8, geom:{x:355,y:175,r:30,delay:0}, draw:(p)=>drawEye(p,color), effect:"miss-50" },
        { id:"eR", type:"eye",  name_jp:pn.eR, maxHP:8, hp:8, geom:{x:445,y:175,r:30,delay:.4}, draw:(p)=>drawEye(p,color), effect:"miss-30" },
        { id:"mouth", type:"mouth", name_jp:pn.mouth, maxHP:10, hp:10, geom:{x:400,y:250,w:38,h:18}, draw:(p)=>drawMouth(p,color), effect:"no-poison" },
        { id:"core", type:"core", name_jp:pn.core, maxHP:30, hp:30, geom:{x:400,y:90,r:24}, draw:(p)=>drawCore(p,color), effect:"win" },
      ],
      hits: f.hits || []
    };
  }

  function makeBombardiroUnkodilo() {
    const id = "unko";
    const color = "#a87245";
    const f = window.I18N.boss(id);
    const pn = f.parts || {};
    return {
      id,
      name_jp: f.name_jp,
      name_en: f.name_en,
      catchphrase: f.catchphrase,
      attacks: f.attacks,
      taunts: f.taunts,
      backstory: f.backstory,
      weakness: f.weakness,
      weakness_label: f.weakness_label,
      color,
      attacksPerRound: 2,
      bodySVG: () => `
        <defs>
          <linearGradient id="unkoBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#cc9866"/>
            <stop offset="1" stop-color="#7a4a25"/>
          </linearGradient>
        </defs>
        <ellipse cx="400" cy="395" rx="190" ry="20" fill="#000" opacity=".3"/>
        <!-- Poop swirl body -->
        <path d="M 220 360 Q 220 240 280 220 Q 240 200 270 160 Q 240 140 290 120 Q 320 90 400 90 Q 480 90 510 120 Q 560 140 530 160 Q 560 200 520 220 Q 580 240 580 360 Q 580 380 400 380 Q 220 380 220 360 Z"
              fill="url(#unkoBody)" stroke="#000" stroke-width="4"/>
        <!-- highlights/shading -->
        <path d="M 290 130 Q 320 110 400 110 Q 480 110 510 130" stroke="#fff" stroke-width="5" fill="none" opacity=".25"/>
        <path d="M 270 175 Q 320 160 400 160 Q 480 160 530 175" stroke="#fff" stroke-width="4" fill="none" opacity=".2"/>
        <ellipse cx="350" cy="280" rx="20" ry="12" fill="#000" opacity=".25"/>
        <ellipse cx="430" cy="320" rx="14" ry="8" fill="#000" opacity=".3"/>
        <!-- stink lines -->
        <path d="M 400 70 Q 395 50 405 30" stroke="#888" stroke-width="3" fill="none" opacity=".7"/>
        <path d="M 380 75 Q 372 55 380 30" stroke="#888" stroke-width="3" fill="none" opacity=".5"/>
        <path d="M 420 75 Q 428 55 420 30" stroke="#888" stroke-width="3" fill="none" opacity=".5"/>
        ${blushPair(400, 270, 80)}
      `,
      parts: [
        { id:"L1", type:"limb", name_jp:pn.L1, maxHP:7, hp:7, geom:{x:560,y:230,dir:0,len:80}, draw:(p)=>drawLeg(p,color,{claw:true}), effect:"atk-1" },
        { id:"L2", type:"limb", name_jp:pn.L2, maxHP:7, hp:7, geom:{x:240,y:230,dir:180,len:80}, draw:(p)=>drawLeg(p,color,{claw:true}), effect:"atk-1" },
        { id:"L3", type:"limb", name_jp:pn.L3, maxHP:7, hp:7, geom:{x:480,y:380,dir:30,len:60}, draw:(p)=>drawLeg(p,color,{foot:true}), effect:"slow" },
        { id:"L4", type:"limb", name_jp:pn.L4, maxHP:7, hp:7, geom:{x:320,y:380,dir:150,len:60}, draw:(p)=>drawLeg(p,color,{foot:true}), effect:"slow" },
        { id:"ant", type:"special", name_jp:pn.ant, maxHP:5, hp:5, geom:{x:400,y:100,h:50}, draw:(p)=>drawAntenna(p,color), effect:"no-special" },
        { id:"eR", type:"eye",  name_jp:pn.eR, maxHP:8, hp:8, geom:{x:445,y:170,r:24,delay:0}, draw:(p)=>drawEye(p,color), effect:"miss-50" },
        { id:"eL", type:"eye",  name_jp:pn.eL, maxHP:8, hp:8, geom:{x:355,y:170,r:24,delay:.3}, draw:(p)=>drawEye(p,color), effect:"miss-30" },
        { id:"mouth", type:"mouth", name_jp:pn.mouth, maxHP:10, hp:10, geom:{x:400,y:215,w:48,h:20}, draw:(p)=>drawMouth(p,color), effect:"no-poison" },
        { id:"belly", type:"special", name_jp:pn.belly, maxHP:9, hp:9, geom:{x:400,y:300,w:55,h:38}, draw:(p)=>drawBelly(p,color), effect:"weak-spot" },
        { id:"core", type:"core", name_jp:pn.core, maxHP:30, hp:30, geom:{x:400,y:380,r:22}, draw:(p)=>drawCore(p,color), effect:"win" },
      ],
      hits: f.hits || []
    };
  }

  function makeTralaleroPakupaku() {
    const id = "tral";
    const color = "#7cd1ff";
    const f = window.I18N.boss(id);
    const pn = f.parts || {};
    return {
      id,
      name_jp: f.name_jp,
      name_en: f.name_en,
      catchphrase: f.catchphrase,
      attacks: f.attacks,
      taunts: f.taunts,
      backstory: f.backstory,
      weakness: f.weakness,
      weakness_label: f.weakness_label,
      color,
      attacksPerRound: 2,
      bodySVG: () => `
        <defs>
          <radialGradient id="tralBody" cx=".5" cy=".4" r=".7">
            <stop offset="0" stop-color="#bce8ff"/>
            <stop offset="1" stop-color="#3aa7d8"/>
          </radialGradient>
        </defs>
        <ellipse cx="408" cy="380" rx="190" ry="20" fill="#000" opacity=".3"/>
        <!-- Tail -->
        <path d="M 240 240 Q 130 200 110 140 Q 160 200 220 240 Q 130 280 100 340 Q 160 280 240 270 Z"
              fill="url(#tralBody)" stroke="#000" stroke-width="4"/>
        <!-- Body -->
        <ellipse cx="420" cy="240" rx="180" ry="130" fill="url(#tralBody)" stroke="#000" stroke-width="4"/>
        <!-- Spots -->
        <circle cx="380" cy="180" r="9" fill="#ffe24a" stroke="#000" stroke-width="2"/>
        <circle cx="490" cy="220" r="7" fill="#ffe24a" stroke="#000" stroke-width="2"/>
        <circle cx="450" cy="280" r="8" fill="#ffe24a" stroke="#000" stroke-width="2"/>
        <circle cx="520" cy="160" r="6" fill="#ffe24a" stroke="#000" stroke-width="2"/>
        <!-- Belly stripe -->
        <ellipse cx="420" cy="290" rx="120" ry="50" fill="#fff" opacity=".4"/>
        <!-- Highlight -->
        <ellipse cx="380" cy="170" rx="60" ry="22" fill="#fff" opacity=".55"/>
        ${blushPair(440, 260, 70)}
      `,
      parts: [
        { id:"finT", type:"limb", name_jp:pn.finT, maxHP:6, hp:6, geom:{x:420,y:120,dir:270,len:60}, draw:(p)=>drawLeg(p,color), effect:"slow" },
        { id:"finL", type:"limb", name_jp:pn.finL, maxHP:6, hp:6, geom:{x:330,y:280,dir:200,len:80}, draw:(p)=>drawLeg(p,color,{hand:true}), effect:"atk-1" },
        { id:"finR", type:"limb", name_jp:pn.finR, maxHP:6, hp:6, geom:{x:510,y:280,dir:340,len:80}, draw:(p)=>drawLeg(p,color,{hand:true}), effect:"atk-1" },
        { id:"legL", type:"limb", name_jp:pn.legL, maxHP:7, hp:7, geom:{x:380,y:355,dir:130,len:70}, draw:(p)=>drawLeg(p,color,{foot:true}), effect:"slow" },
        { id:"legR", type:"limb", name_jp:pn.legR, maxHP:7, hp:7, geom:{x:460,y:355,dir:50,len:70}, draw:(p)=>drawLeg(p,color,{foot:true}), effect:"slow" },
        { id:"eL", type:"eye", name_jp:pn.eL, maxHP:7, hp:7, geom:{x:380,y:200,r:28,delay:0}, draw:(p)=>drawEye(p,color), effect:"miss-40" },
        { id:"eR", type:"eye", name_jp:pn.eR, maxHP:7, hp:7, geom:{x:470,y:200,r:28,delay:.4}, draw:(p)=>drawEye(p,color), effect:"miss-40" },
        { id:"mouth", type:"mouth", name_jp:pn.mouth, maxHP:11, hp:11, geom:{x:420,y:280,w:56,h:24}, draw:(p)=>drawMouth(p,color), effect:"no-poison" },
        { id:"tongue", type:"special", name_jp:pn.tongue, maxHP:6, hp:6, geom:{x:420,y:298,len:70}, draw:(p)=>drawTongue(p,color), effect:"weak-spot" },
        { id:"core", type:"core", name_jp:pn.core, maxHP:30, hp:30, geom:{x:420,y:235,r:22}, draw:(p)=>drawCore(p,color), effect:"win" },
      ],
      hits: f.hits || []
    };
  }

  function makeBrrPampamu() {
    const id = "pamp";
    const color = "#caa6e8";
    const f = window.I18N.boss(id);
    const pn = f.parts || {};
    return {
      id,
      name_jp: f.name_jp,
      name_en: f.name_en,
      catchphrase: f.catchphrase,
      attacks: f.attacks,
      taunts: f.taunts,
      backstory: f.backstory,
      weakness: f.weakness,
      weakness_label: f.weakness_label,
      color,
      attacksPerRound: 2,
      bodySVG: () => `
        <defs>
          <radialGradient id="pampBody" cx=".4" cy=".3" r=".7">
            <stop offset="0" stop-color="#e8d2ff"/>
            <stop offset="1" stop-color="#9070c8"/>
          </radialGradient>
        </defs>
        <ellipse cx="408" cy="395" rx="170" ry="18" fill="#000" opacity=".3"/>
        <!-- Body (fluffy) -->
        <path d="M 250 280 Q 250 180 320 150 Q 320 100 400 100 Q 480 100 480 150 Q 550 180 550 280 Q 550 380 400 380 Q 250 380 250 280 Z"
              fill="url(#pampBody)" stroke="#000" stroke-width="4"/>
        <!-- Fluff edges -->
        <circle cx="270" cy="220" r="22" fill="url(#pampBody)" stroke="#000" stroke-width="3"/>
        <circle cx="535" cy="220" r="22" fill="url(#pampBody)" stroke="#000" stroke-width="3"/>
        <circle cx="290" cy="320" r="20" fill="url(#pampBody)" stroke="#000" stroke-width="3"/>
        <circle cx="510" cy="320" r="20" fill="url(#pampBody)" stroke="#000" stroke-width="3"/>
        <!-- Highlight -->
        <ellipse cx="370" cy="170" rx="60" ry="22" fill="#fff" opacity=".55"/>
        ${blushPair(400, 230, 90)}
        <!-- fart cloud peeking -->
        <circle cx="260" cy="380" r="10" fill="#a8d8a0" opacity=".7" stroke="#000" stroke-width="1"/>
        <circle cx="540" cy="385" r="9" fill="#a8d8a0" opacity=".7" stroke="#000" stroke-width="1"/>
      `,
      parts: [
        { id:"earL", type:"special", name_jp:pn.earL, maxHP:5, hp:5, geom:{x:340,y:110,h:40}, draw:(p)=>drawAntenna(p,color), effect:"no-special" },
        { id:"earR", type:"special", name_jp:pn.earR, maxHP:5, hp:5, geom:{x:460,y:110,h:40}, draw:(p)=>drawAntenna(p,color), effect:"no-special" },
        { id:"armL", type:"limb", name_jp:pn.armL, maxHP:6, hp:6, geom:{x:260,y:240,dir:185,len:80}, draw:(p)=>drawLeg(p,color,{hand:true}), effect:"atk-1" },
        { id:"armR", type:"limb", name_jp:pn.armR, maxHP:6, hp:6, geom:{x:540,y:240,dir:355,len:80}, draw:(p)=>drawLeg(p,color,{hand:true}), effect:"atk-1" },
        { id:"legL", type:"limb", name_jp:pn.legL, maxHP:7, hp:7, geom:{x:370,y:380,dir:120,len:55}, draw:(p)=>drawLeg(p,color,{foot:true}), effect:"slow" },
        { id:"legR", type:"limb", name_jp:pn.legR, maxHP:7, hp:7, geom:{x:430,y:380,dir:60,len:55}, draw:(p)=>drawLeg(p,color,{foot:true}), effect:"slow" },
        { id:"eL", type:"eye", name_jp:pn.eL, maxHP:7, hp:7, geom:{x:370,y:200,r:26,delay:0}, draw:(p)=>drawEye(p,color), effect:"miss-40" },
        { id:"eR", type:"eye", name_jp:pn.eR, maxHP:7, hp:7, geom:{x:430,y:200,r:26,delay:.3}, draw:(p)=>drawEye(p,color), effect:"miss-40" },
        { id:"mouth", type:"mouth", name_jp:pn.mouth, maxHP:9, hp:9, geom:{x:400,y:255,w:32,h:14}, draw:(p)=>drawMouth(p,color), effect:"no-poison" },
        { id:"butt", type:"special", name_jp:pn.butt, maxHP:9, hp:9, geom:{x:400,y:340,w:50,h:24}, draw:(p)=>drawBelly(p,color), effect:"weak-spot" },
        { id:"core", type:"core", name_jp:pn.core, maxHP:30, hp:30, geom:{x:400,y:240,r:22}, draw:(p)=>drawCore(p,color), effect:"win" },
      ],
      hits: f.hits || []
    };
  }

  function makeParfaitIwashi() {
    const id = "parfait";
    const color = "#a8d4f0";
    const f = window.I18N.boss(id);
    const pn = f.parts || {};
    return {
      id,
      name_jp: f.name_jp,
      name_en: f.name_en,
      catchphrase: f.catchphrase,
      attacks: f.attacks,
      taunts: f.taunts,
      backstory: f.backstory,
      weakness: f.weakness,
      weakness_label: f.weakness_label,
      color,
      attacksPerRound: 2,
      bodySVG: () => `
        <defs>
          <linearGradient id="iwashiBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#bce0fa"/>
            <stop offset=".5" stop-color="#5a90c5"/>
            <stop offset="1" stop-color="#345878"/>
          </linearGradient>
          <radialGradient id="whipGrad" cx=".4" cy=".3" r=".7">
            <stop offset="0" stop-color="#fff"/>
            <stop offset="1" stop-color="#ffe6e0"/>
          </radialGradient>
          <linearGradient id="parfaitGlass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e0f0ff" stop-opacity=".7"/>
            <stop offset="1" stop-color="#a0c8e8" stop-opacity=".5"/>
          </linearGradient>
        </defs>
        <ellipse cx="408" cy="395" rx="180" ry="18" fill="#000" opacity=".3"/>
        <!-- Parfait glass (V shape) behind -->
        <path d="M 270 200 L 530 200 L 470 380 L 330 380 Z" fill="url(#parfaitGlass)" stroke="#88aacc" stroke-width="3"/>
        <!-- Glass highlight -->
        <line x1="290" y1="220" x2="345" y2="370" stroke="#fff" stroke-width="3" opacity=".5"/>
        <!-- Yogurt/jelly bottom layer -->
        <path d="M 340 350 L 460 350 L 470 380 L 330 380 Z" fill="#ffd58a" stroke="#000" stroke-width="2"/>
        <!-- Sardine body horizontal -->
        <ellipse cx="400" cy="290" rx="155" ry="55" fill="url(#iwashiBody)" stroke="#000" stroke-width="4"/>
        <!-- Sardine fish tail -->
        <path d="M 245 290 L 200 250 L 220 290 L 200 330 Z" fill="url(#iwashiBody)" stroke="#000" stroke-width="3"/>
        <!-- Sardine spots -->
        <circle cx="350" cy="280" r="4" fill="#0a1828" opacity=".6"/>
        <circle cx="385" cy="295" r="4" fill="#0a1828" opacity=".6"/>
        <circle cx="420" cy="278" r="4" fill="#0a1828" opacity=".6"/>
        <circle cx="455" cy="293" r="4" fill="#0a1828" opacity=".6"/>
        <!-- Silver belly stripe -->
        <ellipse cx="400" cy="305" rx="120" ry="14" fill="#fff" opacity=".55"/>
        <!-- Whipped cream pile -->
        <path d="M 320 215 Q 320 195 340 190 Q 350 175 365 180 Q 380 165 400 170 Q 420 165 435 180 Q 450 175 460 190 Q 480 195 480 215 Q 470 230 400 230 Q 330 230 320 215 Z"
              fill="url(#whipGrad)" stroke="#000" stroke-width="3"/>
        <!-- Cream swirl details -->
        <path d="M 350 195 Q 360 180 380 185 Q 400 170 420 185 Q 440 180 450 195" fill="url(#whipGrad)" stroke="none" opacity=".7"/>
        <path d="M 360 210 Q 380 200 400 205 Q 420 200 440 210" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>
        <!-- Strawberry left -->
        <g transform="translate(265, 265)">
          <ellipse cx="0" cy="3" rx="14" ry="13" fill="#ee2244" stroke="#000" stroke-width="2"/>
          <ellipse cx="-4" cy="0" rx="3" ry="2" fill="#fff" opacity=".7"/>
          <path d="M -8 -8 L -3 -12 L 0 -7 L 3 -12 L 8 -8 Z" fill="#3aaa3a" stroke="#1a6020" stroke-width="1.5"/>
          <circle cx="-3" cy="3" r="1" fill="#fff8a0"/>
          <circle cx="3" cy="6" r="1" fill="#fff8a0"/>
        </g>
        <!-- Blueberries right -->
        <g transform="translate(540, 280)">
          <circle cx="0" cy="0" r="10" fill="#3a4ab8" stroke="#000" stroke-width="2"/>
          <ellipse cx="-3" cy="-3" rx="3" ry="2" fill="#fff" opacity=".5"/>
        </g>
        <g transform="translate(555, 305)">
          <circle cx="0" cy="0" r="8" fill="#3a4ab8" stroke="#000" stroke-width="2"/>
          <ellipse cx="-2" cy="-2" rx="2" ry="1.5" fill="#fff" opacity=".5"/>
        </g>
        <!-- Banana slice top right -->
        <g transform="translate(530, 195)">
          <ellipse cx="0" cy="0" rx="12" ry="10" fill="#ffe45c" stroke="#000" stroke-width="2"/>
          <circle cx="0" cy="0" r="3" fill="#7a5a1c"/>
        </g>
        <!-- Mint leaf -->
        <g transform="translate(425, 130) rotate(20)">
          <path d="M 0 0 Q -5 -10 0 -18 Q 5 -10 0 0 Z" fill="#3aaa3a" stroke="#1a6020" stroke-width="1.5"/>
          <line x1="0" y1="0" x2="0" y2="-15" stroke="#1a6020" stroke-width="1"/>
        </g>
        ${blushPair(400, 305, 90)}
      `,
      parts: [
        { id:"cherry", type:"core", name_jp:pn.cherry, maxHP:28, hp:28, geom:{x:400,y:120,r:18}, draw:(p)=>drawCherryCore(p,color), effect:"win" },
        { id:"whip", type:"special", name_jp:pn.whip, maxHP:8, hp:8, geom:{x:400,y:175,h:30}, draw:(p)=>drawAntenna(p,"#fff"), effect:"weak-spot" },
        { id:"eL", type:"eye", name_jp:pn.eL, maxHP:7, hp:7, geom:{x:370,y:280,r:22,delay:0}, draw:(p)=>drawEye(p,color), effect:"miss-50" },
        { id:"eR", type:"eye", name_jp:pn.eR, maxHP:7, hp:7, geom:{x:430,y:280,r:22,delay:.3}, draw:(p)=>drawEye(p,color), effect:"miss-30" },
        { id:"mouth", type:"mouth", name_jp:pn.mouth, maxHP:9, hp:9, geom:{x:495,y:300,w:24,h:12}, draw:(p)=>drawMouth(p,color), effect:"no-poison" },
        { id:"finT", type:"limb", name_jp:pn.finT, maxHP:6, hp:6, geom:{x:400,y:240,dir:270,len:50}, draw:(p)=>drawLeg(p,color), effect:"slow" },
        { id:"finB", type:"limb", name_jp:pn.finB, maxHP:6, hp:6, geom:{x:380,y:340,dir:90,len:40}, draw:(p)=>drawLeg(p,color), effect:"atk-1" },
        { id:"tail", type:"limb", name_jp:pn.tail, maxHP:8, hp:8, geom:{x:240,y:290,dir:180,len:60}, draw:(p)=>drawTail(p,color), effect:"slow" },
      ],
      hits: f.hits || []
    };
  }

  function makeAnpanmaguro() {
    const id = "anpan";
    const color = "#ffb070";
    const f = window.I18N.boss(id);
    const pn = f.parts || {};
    return {
      id,
      name_jp: f.name_jp,
      name_en: f.name_en,
      catchphrase: f.catchphrase,
      attacks: f.attacks,
      taunts: f.taunts,
      backstory: f.backstory,
      weakness: f.weakness,
      weakness_label: f.weakness_label,
      color,
      attacksPerRound: 2,
      bodySVG: () => `
        <defs>
          <radialGradient id="anpanFace" cx=".4" cy=".3" r=".75">
            <stop offset="0" stop-color="#ffe0b0"/>
            <stop offset=".7" stop-color="#e0a060"/>
            <stop offset="1" stop-color="#a05530"/>
          </radialGradient>
          <linearGradient id="tunaBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7090c0"/>
            <stop offset=".5" stop-color="#3060a0"/>
            <stop offset="1" stop-color="#102050"/>
          </linearGradient>
          <linearGradient id="capeRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ee3344"/>
            <stop offset="1" stop-color="#a01524"/>
          </linearGradient>
        </defs>
        <ellipse cx="408" cy="395" rx="190" ry="20" fill="#000" opacity=".3"/>
        <!-- Tail fin (back) -->
        <path d="M 220 290 L 130 230 L 155 290 L 130 350 L 220 320 Z" fill="url(#tunaBody)" stroke="#000" stroke-width="3"/>
        <!-- Cape behind body -->
        <path d="M 250 240 Q 200 320 230 380 Q 290 350 300 280 Z" fill="url(#capeRed)" stroke="#000" stroke-width="3"/>
        <path d="M 550 240 Q 600 320 570 380 Q 510 350 500 280 Z" fill="url(#capeRed)" stroke="#000" stroke-width="3"/>
        <!-- Tuna body -->
        <ellipse cx="400" cy="310" rx="180" ry="75" fill="url(#tunaBody)" stroke="#000" stroke-width="4"/>
        <!-- Belly -->
        <ellipse cx="400" cy="335" rx="150" ry="30" fill="#a8c0e0" opacity=".7"/>
        <!-- Side stripes -->
        <path d="M 250 305 Q 320 295 400 300 Q 480 305 550 305" stroke="#0a1a40" stroke-width="3" fill="none" opacity=".7"/>
        <path d="M 260 320 Q 330 315 400 318 Q 470 320 540 320" stroke="#0a1a40" stroke-width="2" fill="none" opacity=".5"/>
        <!-- Top fin -->
        <path d="M 380 235 L 400 200 L 420 235 Z" fill="url(#tunaBody)" stroke="#000" stroke-width="3"/>
        <!-- Anpanman face circle -->
        <circle cx="400" cy="190" r="115" fill="url(#anpanFace)" stroke="#000" stroke-width="5"/>
        <!-- Highlight -->
        <ellipse cx="370" cy="155" rx="48" ry="22" fill="#fff" opacity=".4"/>
        <!-- Sesame seeds (dotted texture) -->
        <circle cx="340" cy="135" r="2" fill="#5a3010"/>
        <circle cx="430" cy="120" r="2" fill="#5a3010"/>
        <circle cx="465" cy="155" r="2" fill="#5a3010"/>
        <circle cx="335" cy="180" r="2" fill="#5a3010"/>
        <circle cx="465" cy="200" r="2" fill="#5a3010"/>
        <circle cx="305" cy="220" r="2" fill="#5a3010"/>
        ${blushPair(400, 220, 90)}
      `,
      parts: [
        { id:"nose", type:"core", name_jp:pn.nose, maxHP:30, hp:30, geom:{x:400,y:200,r:18}, draw:(p)=>drawNoseCore(p,color), effect:"win" },
        { id:"eL", type:"eye", name_jp:pn.eL, maxHP:7, hp:7, geom:{x:365,y:175,r:14,delay:0}, draw:(p)=>drawEye(p,color), effect:"miss-50" },
        { id:"eR", type:"eye", name_jp:pn.eR, maxHP:7, hp:7, geom:{x:435,y:175,r:14,delay:.3}, draw:(p)=>drawEye(p,color), effect:"miss-30" },
        { id:"mouth", type:"mouth", name_jp:pn.mouth, maxHP:9, hp:9, geom:{x:400,y:235,w:30,h:14}, draw:(p)=>drawMouth(p,color), effect:"no-poison" },
        { id:"capeL", type:"special", name_jp:pn.capeL, maxHP:6, hp:6, geom:{x:265,y:300,dir:200,len:60}, draw:(p)=>drawLeg(p,"#ee3344"), effect:"no-special" },
        { id:"capeR", type:"special", name_jp:pn.capeR, maxHP:6, hp:6, geom:{x:535,y:300,dir:340,len:60}, draw:(p)=>drawLeg(p,"#ee3344"), effect:"no-special" },
        { id:"finL", type:"limb", name_jp:pn.finL, maxHP:7, hp:7, geom:{x:280,y:330,dir:185,len:70}, draw:(p)=>drawLeg(p,color,{hand:true}), effect:"atk-1" },
        { id:"finR", type:"limb", name_jp:pn.finR, maxHP:7, hp:7, geom:{x:520,y:330,dir:355,len:70}, draw:(p)=>drawLeg(p,color,{hand:true}), effect:"atk-1" },
        { id:"tail", type:"limb", name_jp:pn.tail, maxHP:8, hp:8, geom:{x:220,y:310,dir:180,len:60}, draw:(p)=>drawTail(p,"#3060a0"), effect:"slow" },
      ],
      hits: f.hits || []
    };
  }

  // Cherry-styled core for parfait sardine
  function drawCherryCore(part, color) {
    const s = partState(part);
    const { x, y, r } = part.geom;
    if (s === 2) {
      return `<g class="part"><text x="${x}" y="${y}" text-anchor="middle" font-size="${r*2}">💥</text></g>`;
    }
    const cracks = s===1 ? `<path d="M ${x-r*0.3} ${y-r*0.2} L ${x+r*0.1} ${y+r*0.2}" stroke="#000" stroke-width="2" fill="none"/>` : "";
    return `<g class="part">
      <line x1="${x}" y1="${y-r}" x2="${x-2}" y2="${y-r*2.5}" stroke="#3a8a3a" stroke-width="3"/>
      <path d="M ${x-2} ${y-r*2.5} Q ${x-12} ${y-r*3} ${x-18} ${y-r*2.7} Q ${x-10} ${y-r*2.4} ${x-2} ${y-r*2.5} Z" fill="#3aaa3a" stroke="#1a6020" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="#ee2244" stroke="#000" stroke-width="3"/>
      <circle cx="${x-r*0.35}" cy="${y-r*0.35}" r="${r*0.3}" fill="#fff" opacity=".7"/>
      ${cracks}
    </g>`;
  }

  // Big round nose for Anpanman tuna
  function drawNoseCore(part, color) {
    const s = partState(part);
    const { x, y, r } = part.geom;
    if (s === 2) {
      return `<g class="part"><text x="${x}" y="${y}" text-anchor="middle" font-size="${r*2}">💥</text></g>`;
    }
    const cracks = s===1 ? `<path d="M ${x-r*0.3} ${y-r*0.1} L ${x+r*0.2} ${y+r*0.2}" stroke="#000" stroke-width="2" fill="none"/>` : "";
    return `<g class="part">
      <circle cx="${x+2}" cy="${y+2}" r="${r}" fill="#000" opacity=".3"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="#ee3344" stroke="#000" stroke-width="3"/>
      <circle cx="${x-r*0.35}" cy="${y-r*0.35}" r="${r*0.35}" fill="#fff" opacity=".75"/>
      ${cracks}
    </g>`;
  }

  // ---------- ティメー サルマクチン (Mongolian camel-monkey) ----------
  // Camel body + monkey head. Two attackable humps on the back are the
  // signature feature — destroying both strips the boss's heavy attack.
  function drawHump(part, color) {
    const s = partState(part);
    const { x, y, w, h } = part.geom;
    if (s === 2) {
      return `<g class="part">
        <path d="M ${x-w} ${y} Q ${x} ${y-h*0.4} ${x+w} ${y}" fill="${color}" stroke="#000" stroke-width="3" opacity=".5"/>
        <text x="${x}" y="${y-4}" text-anchor="middle" font-size="28">💥</text>
      </g>`;
    }
    const cracks = s===1
      ? `<path d="M ${x-w*0.3} ${y-h*0.6} L ${x+w*0.1} ${y-h*0.4} L ${x-w*0.05} ${y-h*0.2}" stroke="#000" stroke-width="2" fill="none"/>`
      : "";
    return `<g class="part">
      <path d="M ${x-w} ${y} Q ${x-w*0.5} ${y-h*1.3} ${x} ${y-h*1.4} Q ${x+w*0.5} ${y-h*1.3} ${x+w} ${y} Z"
            fill="#000"/>
      <path d="M ${x-w+3} ${y} Q ${x-w*0.5} ${y-h*1.25} ${x} ${y-h*1.32} Q ${x+w*0.5} ${y-h*1.25} ${x+w-3} ${y} Z"
            fill="${color}"/>
      <path d="M ${x-w*0.5} ${y-h*0.4} Q ${x-w*0.2} ${y-h*1.0} ${x+w*0.1} ${y-h*1.1}"
            stroke="rgba(255,255,255,.35)" stroke-width="6" fill="none" stroke-linecap="round"/>
      ${cracks}
    </g>`;
  }

  function makeTemeeSarmagchin() {
    const id = "temee";
    const color = "#c89a5a"; // sandy camel-tan
    const f = window.I18N.boss(id);
    const pn = f.parts || {};
    return {
      id,
      name_jp: f.name_jp,
      name_en: f.name_en,
      catchphrase: f.catchphrase,
      attacks: f.attacks,
      taunts: f.taunts,
      backstory: f.backstory,
      weakness: f.weakness,
      weakness_label: f.weakness_label,
      color,
      attacksPerRound: 2,
      bodySVG: () => `
        <defs>
          <linearGradient id="temeeBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0"  stop-color="#e7c08a"/>
            <stop offset="1"  stop-color="#a07338"/>
          </linearGradient>
          <radialGradient id="temeeMonkeyFace" cx=".5" cy=".5" r=".6">
            <stop offset="0"  stop-color="#f5d6a8"/>
            <stop offset="1"  stop-color="#b07a3a"/>
          </radialGradient>
        </defs>
        <!-- Gobi sand floor shadow -->
        <ellipse cx="400" cy="430" rx="280" ry="22" fill="#000" opacity=".25"/>
        <!-- Camel torso (long horizontal body) -->
        <ellipse cx="400" cy="290" rx="200" ry="80" fill="#000"/>
        <ellipse cx="400" cy="290" rx="192" ry="72" fill="url(#temeeBody)"/>
        <!-- Belly highlight -->
        <ellipse cx="400" cy="320" rx="140" ry="22" fill="#fff" opacity=".15"/>
        <!-- Long camel neck rising from front-right of body up to monkey head -->
        <path d="M 540 240 Q 600 180 615 130 Q 615 90 600 75"
              stroke="#000" stroke-width="44" fill="none" stroke-linecap="round"/>
        <path d="M 540 240 Q 600 180 615 130 Q 615 90 600 75"
              stroke="#c89a5a" stroke-width="36" fill="none" stroke-linecap="round"/>
        <!-- Neck shading stripe -->
        <path d="M 545 245 Q 605 185 618 128"
              stroke="rgba(255,255,255,.25)" stroke-width="8" fill="none" stroke-linecap="round"/>
        <!-- Monkey head — ape-style, distinct from camel body -->
        <ellipse cx="600" cy="80" rx="58" ry="50" fill="#000"/>
        <ellipse cx="600" cy="80" rx="52" ry="44" fill="#7a4a25"/>
        <!-- Monkey face plate -->
        <ellipse cx="600" cy="86" rx="40" ry="32" fill="url(#temeeMonkeyFace)"/>
        <!-- Monkey ears -->
        <circle cx="552" cy="65" r="14" fill="#000"/>
        <circle cx="552" cy="65" r="10" fill="#7a4a25"/>
        <circle cx="552" cy="65" r="5"  fill="#f5d6a8"/>
        <circle cx="648" cy="65" r="14" fill="#000"/>
        <circle cx="648" cy="65" r="10" fill="#7a4a25"/>
        <circle cx="648" cy="65" r="5"  fill="#f5d6a8"/>
        <!-- Monkey brow tuft -->
        <path d="M 575 50 Q 600 35 625 50" stroke="#3a2010" stroke-width="6" fill="none" stroke-linecap="round"/>
        <!-- Old-man wisp beard hanging off monkey chin -->
        <path d="M 590 110 Q 595 130 588 145" stroke="#eee" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="M 600 112 Q 600 140 596 158" stroke="#eee" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="M 610 110 Q 612 130 615 145" stroke="#eee" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>
        <!-- Hooves on visible legs (decorative — actual leg parts drawn over) -->
        <ellipse cx="320" cy="425" rx="22" ry="10" fill="#3a2010"/>
        <ellipse cx="380" cy="425" rx="20" ry="9"  fill="#3a2010"/>
        <ellipse cx="430" cy="425" rx="20" ry="9"  fill="#3a2010"/>
        <ellipse cx="490" cy="425" rx="22" ry="10" fill="#3a2010"/>
        <!-- Ambient sand puffs at hooves -->
        <ellipse cx="290" cy="430" rx="14" ry="5" fill="#e7c08a" opacity=".55"/>
        <ellipse cx="510" cy="430" rx="14" ry="5" fill="#e7c08a" opacity=".55"/>
        ${blushPair(600, 95, 28)}
      `,
      parts: [
        // Two humps on top of camel body — the signature attackable parts.
        // Destroying both removes the boss's heavy attack power.
        { id:"h1",   type:"limb",  name_jp:pn.h1,   maxHP:12, hp:12, geom:{x:340, y:215, w:55, h:60}, draw:(p)=>drawHump(p,"#b07a3a"), effect:"atk-1" },
        { id:"h2",   type:"limb",  name_jp:pn.h2,   maxHP:12, hp:12, geom:{x:455, y:215, w:55, h:60}, draw:(p)=>drawHump(p,"#b07a3a"), effect:"atk-1" },
        // Monkey eyes
        { id:"eL",   type:"eye",   name_jp:pn.eL,   maxHP:7,  hp:7,  geom:{x:585, y:78, r:14, delay:0},  draw:(p)=>drawEye(p,color), effect:"miss-50" },
        { id:"eR",   type:"eye",   name_jp:pn.eR,   maxHP:7,  hp:7,  geom:{x:615, y:78, r:14, delay:.3}, draw:(p)=>drawEye(p,color), effect:"miss-30" },
        // Monkey mouth — disables sand/poison attacks
        { id:"mouth",type:"mouth", name_jp:pn.mouth,maxHP:9,  hp:9,  geom:{x:600, y:104, w:24, h:12},    draw:(p)=>drawMouth(p,color), effect:"no-poison" },
        // Two of the four visible legs are attackable; rear leg slows boss.
        { id:"L1",   type:"limb",  name_jp:pn.L1,   maxHP:9,  hp:9,  geom:{x:340, y:340, dir:90, len:80}, draw:(p)=>drawLeg(p,color,{foot:true}), effect:"atk-1" },
        { id:"L2",   type:"limb",  name_jp:pn.L2,   maxHP:9,  hp:9,  geom:{x:470, y:340, dir:90, len:80}, draw:(p)=>drawLeg(p,color,{foot:true}), effect:"slow" },
        // Camel tail — slow effect when destroyed
        { id:"tail", type:"limb",  name_jp:pn.tail, maxHP:7,  hp:7,  geom:{x:200, y:280, dir:200, len:60}, draw:(p)=>drawTail(p,color), effect:"slow" },
        // Heart core in the camel chest
        { id:"core", type:"core",  name_jp:pn.core, maxHP:32, hp:32, geom:{x:400, y:295, r:22},           draw:(p)=>drawCore(p,color), effect:"win" },
      ],
      hits: f.hits || []
    };
  }

  // ---------- FINAL BOSS: ブレインロット・キング ----------
  // The fusion overmind that emerges when all 6 kaiju have been defeated.
  // A glowing chaos core in the middle, with one iconic limb from each of
  // the 6 bosses orbiting it. Reuses every existing draw helper; no new art.
  // Higher HP + 3 attacks/round + own attack pool. Only spawns from the boss
  // picker map after Progress.isDefeated() reports all 6 normal bosses cleared.
  function makeBrainrotKing() {
    const id = "brainrot";
    const f = window.I18N.boss(id);
    const pn = f.parts || {};
    const color = "#bb44ff";
    return {
      id,
      name_jp: f.name_jp,
      name_en: f.name_en,
      catchphrase: f.catchphrase,
      attacks: f.attacks,
      taunts: f.taunts,
      backstory: f.backstory,
      weakness: f.weakness,
      weakness_label: f.weakness_label,
      color,
      isFinalBoss: true,        // flag for victory/defeat code paths
      attacksPerRound: 3,        // higher than normal (2)
      bodySVG: () => `
        <defs>
          <radialGradient id="brainrotBody" cx=".5" cy=".5" r=".75">
            <stop offset="0"  stop-color="#5a1a8a" stop-opacity=".95"/>
            <stop offset=".55" stop-color="#2a0a4a" stop-opacity=".7"/>
            <stop offset="1"  stop-color="#1a0a2a" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx="400" cy="240" rx="360" ry="220" fill="url(#brainrotBody)"/>
        <!-- Aura rings around the core -->
        <circle cx="400" cy="240" r="100" fill="none" stroke="${color}"   stroke-width="2"   opacity=".55"/>
        <circle cx="400" cy="240" r="150" fill="none" stroke="#ff66cc"    stroke-width="1.5" opacity=".4"/>
        <circle cx="400" cy="240" r="200" fill="none" stroke="#ffcc00"    stroke-width="1"   opacity=".25"/>
        <!-- Sparks scattered around the void -->
        <text x="120" y="120" font-size="22">✨</text>
        <text x="660" y="130" font-size="22">✨</text>
        <text x="160" y="380" font-size="22">⚡</text>
        <text x="640" y="380" font-size="22">⚡</text>
        <text x="60"  y="240" font-size="22">🌟</text>
        <text x="730" y="240" font-size="22">🌟</text>
        <text x="400" y="60"  font-size="20" text-anchor="middle">💫</text>
        <text x="400" y="450" font-size="20" text-anchor="middle">💫</text>
      `,
      parts: [
        // Six "trophy limbs" — one borrowed from each defeated boss. Damaging
        // them strips armor from the core (existing armor mechanic = number
        // of intact non-core parts).
        { id:"tako_arm",    type:"limb", name_jp:pn.tako_arm    || "タコ うで",     maxHP:14, hp:14, geom:{x:230, y:140, dir:200, len:130}, draw:(p)=>drawTentacle(p,"#ff8ec7"), effect:"atk-1" },
        { id:"parfait_top", type:"limb", name_jp:pn.parfait_top || "パフェ さくらんぼ", maxHP:14, hp:14, geom:{x:600, y:120, r:32},                draw:(p)=>drawCherryCore(p,"#ee2244"), effect:"miss-30" },
        { id:"unko_belly",  type:"limb", name_jp:pn.unko_belly  || "ばくだん おなか", maxHP:18, hp:18, geom:{x:220, y:300, w:48, h:34},          draw:(p)=>drawBelly(p,"#a87245"), effect:"no-special" },
        { id:"anpan_face",  type:"limb", name_jp:pn.anpan_face  || "アンパン かお",   maxHP:14, hp:14, geom:{x:600, y:300, r:34},                draw:(p)=>drawNoseCore(p,"#ee3344"), effect:"miss-40" },
        { id:"tral_tongue", type:"limb", name_jp:pn.tral_tongue || "ベロ",            maxHP:12, hp:12, geom:{x:340, y:380, len:90},               draw:(p)=>drawTongue(p,"#ff5a8a"), effect:"atk-1" },
        { id:"pampamu_arm", type:"limb", name_jp:pn.pampamu_arm || "ふわふわ あし",   maxHP:14, hp:14, geom:{x:500, y:380, dir:75, len:90},      draw:(p)=>drawLeg(p,"#ddaaff"), effect:"slow" },
        // Central swirling chaos core — the actual weak point.
        { id:"core",        type:"core", name_jp:pn.core         || "カオス コア",     maxHP:50, hp:50, geom:{x:400, y:240, r:34},                draw:(p)=>drawCore(p,"#ffcc00"), effect:"win" },
      ],
      hits: f.hits || []
    };
  }

  const factories = [makeTakoTakoSahur, makeBombardiroUnkodilo, makeTralaleroPakupaku, makeBrrPampamu, makeParfaitIwashi, makeAnpanmaguro, makeTemeeSarmagchin];
  const finalFactories = [makeBrainrotKing];

  function randomBoss() { return factories[Math.floor(Math.random()*factories.length)](); }
  // Returns the list of factory functions so the monster-pick screen can show
  // all options. Final boss is excluded here on purpose — kids shouldn't be
  // able to pick the brainrot king as their PvP monster, and the regular
  // boss-cycle flow shouldn't surface it.
  function listFactories() { return factories.slice(); }
  // All factories including final/secret bosses — for the picker map only.
  function listAllFactories() { return factories.concat(finalFactories); }
  // Returns the final-boss factory if available, or null. Decoupled from
  // unlock state so callers can decide whether to show / gate it.
  function getFinalBossFactory() {
    return finalFactories.length ? finalFactories[0] : null;
  }

  function renderBossSVG(boss) {
    const armor = coreArmor(boss);
    const core = boss.parts.find(p => p.effect === "win");
    const partsSVG = boss.parts.map(p => p.draw(p)).join("\n");
    let armorOverlay = "";
    if (core && core.hp > 0 && armor > 0) {
      const cx = core.geom.x;
      const cy = core.geom.y - (core.geom.r || 20) - 24;
      armorOverlay = `<g class="armor-indicator">
        <rect x="${cx-44}" y="${cy-22}" width="88" height="34" rx="17" fill="#000" opacity=".7"/>
        <text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="22" font-weight="900" fill="#9be0ff">🛡️ ${armor}</text>
      </g>`;
    } else if (core && core.hp > 0 && armor === 0) {
      const cx = core.geom.x;
      const cy = core.geom.y - (core.geom.r || 20) - 24;
      armorOverlay = `<g class="armor-indicator">
        <rect x="${cx-58}" y="${cy-22}" width="116" height="34" rx="17" fill="#ff3b6b"/>
        <text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="20" font-weight="900" fill="#fff">よわてん！</text>
      </g>`;
    }
    const svg = `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;">
      ${boss.bodySVG()}
      ${partsSVG}
      ${armorOverlay}
    </svg>`;
    // Shiny variant: wrap in a div that picks up the per-boss .shiny-boss-svg.<id>
    // CSS filter (palette swap to the shiny color scheme). Render sites don't
    // need to know about shiny — they just call this and the wrapper handles
    // it. Non-shiny bosses get the SVG raw, no wrapper, so layout is unchanged.
    if (boss.shiny) {
      return `<div class="shiny-boss-svg ${boss.id}" style="width:100%;height:100%;">${svg}</div>`;
    }
    return svg;
  }

  function alive(boss) { return boss.parts.filter(p => p.hp > 0); }
  function aliveTargets(boss) { return alive(boss); }
  function partById(boss, id) { return boss.parts.find(p => p.id === id); }
  // Armor on core = number of intact non-core parts
  function coreArmor(boss) { return boss.parts.filter(p => p.effect !== "win" && p.hp > 0).length; }

  function bossModifiers(boss) {
    let atks = boss.attacksPerRound;
    let missChance = 0;
    let hasSpecial = true;
    for (const p of boss.parts) {
      if (p.hp > 0) continue;
      // atk-1 / slow parts no longer zero out attacks — they convert into miss
      // chance so a player who breaks every leg still gets the dramatic boss
      // attack animation, just with a much higher chance the boss whiffs.
      if (p.effect === "atk-1") { atks -= 1; missChance += 0.20; }
      if (p.effect === "slow")  { atks -= 0.5; missChance += 0.15; }
      if (p.effect === "miss-50") missChance += 0.5;
      if (p.effect === "miss-40") missChance += 0.4;
      if (p.effect === "miss-30") missChance += 0.3;
      if (p.effect === "no-special" || p.effect === "no-poison") hasSpecial = false;
    }
    // Floor attacks-per-round at 1 — the boss is never completely powerless.
    // Caller can use missChance to keep the threat reduced when legs are gone.
    atks = Math.max(1, Math.floor(atks));
    missChance = Math.min(0.90, missChance);
    return { atks, missChance, hasSpecial };
  }

  function damageMultiplier(boss) {
    let m = 1;
    for (const p of boss.parts) {
      if (p.hp <= 0 && p.effect === "weak-spot") m += 0.5;
    }
    return m;
  }

  // ---- SHINY VARIANT ----
  // Mutates a freshly-built boss into its shiny form: stronger stats + a
  // .shiny flag the rest of the engine reads to swap palette / sparkle /
  // warning UI / stronger ultimate cadence. The flag is the single source
  // of truth — render code adds CSS class, attack code multiplies damage.
  // Stats:
  //   • core HP × 1.25
  //   • all non-core part HP × 1.15 (longer fight = more drama)
  //   • damage multiplier set on the boss itself; bossTurn / damage code
  //     multiplies attacks by 1.3 when boss.shiny is true
  //   • ultimate charge threshold drops 3 → 2 (faster ultimates)
  function applyShiny(boss) {
    if (!boss || boss.shiny) return boss;
    boss.shiny = true;
    for (const p of boss.parts) {
      if (p.effect === "win") {
        p.maxHP = Math.round(p.maxHP * 1.25);
        p.hp = p.maxHP;
      } else {
        p.maxHP = Math.round(p.maxHP * 1.15);
        p.hp = p.maxHP;
      }
    }
    // Damage / cadence flags read by game.js. Don't mutate damage upfront
    // — it's calculated per attack roll in bossTurn() — just expose the
    // multiplier so the formula stays in one place.
    boss._shinyDmgMult = 1.3;
    boss._shinyUltThreshold = 2;
    // Apply alternate-language voiced lines from the shiny locale overrides.
    // Voice path lookup uses `${boss.id}_shiny/<hash>.opus` at runtime
    // (audio.js / playBossLine consults boss.shiny to switch directories).
    const ov = (window.I18N && window.I18N.shinyOverrides && window.I18N.shinyOverrides[boss.id]) || null;
    if (ov) {
      if (ov.catchphrase) boss.catchphrase = ov.catchphrase;
      if (Array.isArray(ov.attacks) && ov.attacks.length === boss.attacks.length) {
        // Preserve original attack order so game.js attack-type lookups still
        // line up; just swap names + phrases.
        boss.attacks = boss.attacks.map((a, i) => Object.assign({}, a, {
          name: ov.attacks[i].name || a.name,
          phrases: ov.attacks[i].phrases || a.phrases,
          type: a.type, // keep original type (drives charge/impact FX color)
        }));
      }
      if (Array.isArray(ov.hits)) boss.hits = ov.hits;
      if (ov.taunts) boss.taunts = Object.assign({}, boss.taunts || {}, ov.taunts);
    }
    return boss;
  }

  return { randomBoss, listFactories, listAllFactories, getFinalBossFactory,
           renderBossSVG, alive, aliveTargets, partById, bossModifiers, damageMultiplier, coreArmor,
           applyShiny };
})();
