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

  // Genghis-Khan-style facial hair as a destructible part. Three states:
  //   • state 0 (full HP): mustache + long chin beard
  //   • state 1 (damaged): only the mustache survives — the chin beard
  //     has been "shaved" off
  //   • state 2 (destroyed): clean-shaven
  // The third arg `dark` switches the palette to black-bristle (shiny
  // temee variant) instead of the default elder white.
  function drawBeard(part, color, dark) {
    const s = partState(part);
    const { x, y } = part.geom;
    if (s === 2) {
      return `<g class="part">
        <text x="${x}" y="${y+30}" text-anchor="middle" font-size="22">💥</text>
      </g>`;
    }
    const fillCol   = dark ? "#1a1410" : "#fafafa";
    const strokeCol = dark ? "#000"     : "#888";
    const wispCol   = dark ? "#3a2820" : "#cccccc";
    const stubbleCol= dark ? "#3a2820" : "#ddd";
    // Mustache always present in states 0 + 1 — single shape that curls
    // out and down on both sides of the upper lip.
    const mustache = `
      <path d="M ${x} ${y-8}
               Q ${x-12} ${y-12} ${x-27} ${y-10}
               Q ${x-43} ${y-7} ${x-55} ${y+8}
               Q ${x-53} ${y+20} ${x-40} ${y+19}
               Q ${x-27} ${y+17} ${x-17} ${y+10}
               Q ${x-7} ${y+2} ${x} ${y+2}
               Q ${x+7} ${y+2} ${x+17} ${y+10}
               Q ${x+27} ${y+17} ${x+40} ${y+19}
               Q ${x+53} ${y+20} ${x+55} ${y+8}
               Q ${x+43} ${y-7} ${x+27} ${y-10}
               Q ${x+12} ${y-12} ${x} ${y-8} Z"
            fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.4"/>
      <path d="M ${x-37} ${y+10} Q ${x-25} ${y+13} ${x-15} ${y+8}" stroke="${wispCol}" stroke-width="1" fill="none" opacity="0.85"/>
      <path d="M ${x+37} ${y+10} Q ${x+25} ${y+13} ${x+15} ${y+8}" stroke="${wispCol}" stroke-width="1" fill="none" opacity="0.85"/>`;
    if (s === 1) {
      // Damaged: chin beard shaved off, only mustache remains. Show a
      // little stubble dust under the chin to sell the haircut.
      return `<g class="part">
        ${mustache}
        <circle cx="${x-8}" cy="${y+30}" r="1.4" fill="${stubbleCol}" opacity="0.7"/>
        <circle cx="${x+5}" cy="${y+34}" r="1.2" fill="${stubbleCol}" opacity="0.7"/>
        <circle cx="${x+12}" cy="${y+28}" r="1.6" fill="${stubbleCol}" opacity="0.7"/>
      </g>`;
    }
    // Full HP: mustache + long pointed chin beard, Genghis-Khan style.
    const chinBeard = `
      <path d="M ${x-22} ${y+13}
               Q ${x-33} ${y+32} ${x-33} ${y+58}
               Q ${x-29} ${y+88} ${x-17} ${y+112}
               Q ${x-7}  ${y+128} ${x} ${y+135}
               Q ${x+7}  ${y+128} ${x+17} ${y+112}
               Q ${x+29} ${y+88} ${x+33} ${y+58}
               Q ${x+33} ${y+32} ${x+22} ${y+13}
               Q ${x+12} ${y+20} ${x} ${y+20}
               Q ${x-12} ${y+20} ${x-22} ${y+13} Z"
            fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.4"/>
      <path d="M ${x-13} ${y+32} Q ${x-15} ${y+65} ${x-10} ${y+100} Q ${x-5} ${y+122} ${x} ${y+132}" stroke="${wispCol}" stroke-width="1.2" fill="none" opacity="0.75"/>
      <path d="M ${x} ${y+30}    Q ${x} ${y+70}    ${x} ${y+115}" stroke="${wispCol}" stroke-width="1.2" fill="none" opacity="0.75"/>
      <path d="M ${x+13} ${y+32} Q ${x+15} ${y+65} ${x+10} ${y+100} Q ${x+5} ${y+122} ${x} ${y+132}" stroke="${wispCol}" stroke-width="1.2" fill="none" opacity="0.75"/>`;
    return `<g class="part">
      ${chinBeard}
      ${mustache}
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
    // Build as a named const so bodySVG / drawBeard closures can read
    // boss.shiny live (applyShiny mutates the flag AFTER factory returns
    // but BEFORE the first render).
    const boss = {
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
      hits: f.hits || []
    };
    boss.bodySVG = () => {
      // Shiny variant gets a Mongolian-herder hat (Toortsog-style pointed
      // cap with gold band, fur brim, finial knot) and the brow tuft is
      // hidden because the hat covers it.
      const shinyHat = boss.shiny ? `
        <!-- Mongolian herder hat (Toortsog pointed cap) -->
        <!-- back / dark panel -->
        <path d="M 552 28 Q 605 -56 658 28 Q 605 36 552 28 Z" fill="#3a1a08" stroke="#000" stroke-width="2.5"/>
        <!-- front lighter panel for highlight -->
        <path d="M 580 28 Q 605 -52 630 28 Q 605 33 580 28 Z" fill="#6a3018" stroke="#000" stroke-width="1.5" opacity="0.9"/>
        <!-- Vertical seam stripe -->
        <line x1="605" y1="-50" x2="605" y2="30" stroke="#1a0a02" stroke-width="2"/>
        <!-- Gold trim band at base -->
        <rect x="550" y="22" width="110" height="8" fill="#e8b832" stroke="#000" stroke-width="1.5" rx="2"/>
        <!-- Subtle pattern on gold band -->
        <line x1="572" y1="26" x2="572" y2="26" stroke="#a07810" stroke-width="2"/>
        <line x1="592" y1="26" x2="592" y2="26" stroke="#a07810" stroke-width="2"/>
        <line x1="612" y1="26" x2="612" y2="26" stroke="#a07810" stroke-width="2"/>
        <line x1="632" y1="26" x2="632" y2="26" stroke="#a07810" stroke-width="2"/>
        <!-- Fur brim (fluffy band below gold) -->
        <ellipse cx="605" cy="36" rx="58" ry="6" fill="#1a0a02" stroke="#000" stroke-width="1.5"/>
        <ellipse cx="605" cy="36" rx="58" ry="6" fill="url(#temeeFurBrim)"/>
        <!-- Finial knot at peak with red tassel -->
        <circle cx="605" cy="-52" r="5" fill="#e8b832" stroke="#000" stroke-width="1.5"/>
        <path d="M 605 -47 Q 612 -32 610 -16" stroke="#cc2233" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M 605 -47 Q 600 -32 602 -16" stroke="#aa1a22" stroke-width="2.5" fill="none" stroke-linecap="round"/>` : '';
      // Brow tuft only when not wearing the hat
      const browTuft = boss.shiny ? '' :
        `<path d="M 572 30 Q 605 12 638 30" stroke="#3a2010" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      return `
        <defs>
          <linearGradient id="temeeBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0"  stop-color="#e7c08a"/>
            <stop offset="1"  stop-color="#a07338"/>
          </linearGradient>
          <radialGradient id="temeeMonkeyFace" cx=".5" cy=".5" r=".6">
            <stop offset="0"  stop-color="#f5d6a8"/>
            <stop offset="1"  stop-color="#b07a3a"/>
          </radialGradient>
          <linearGradient id="temeeFurBrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0"   stop-color="#3a2010"/>
            <stop offset="0.5" stop-color="#5a3a1a"/>
            <stop offset="1"   stop-color="#1a0a02"/>
          </linearGradient>
        </defs>
        <!-- Gobi sand floor shadow -->
        <ellipse cx="400" cy="430" rx="280" ry="22" fill="#000" opacity=".25"/>
        <!-- Camel torso (long horizontal body) -->
        <ellipse cx="400" cy="290" rx="200" ry="80" fill="#000"/>
        <ellipse cx="400" cy="290" rx="192" ry="72" fill="url(#temeeBody)"/>
        <!-- Belly highlight -->
        <ellipse cx="400" cy="320" rx="140" ry="22" fill="#fff" opacity=".15"/>
        <!-- Long camel neck rising from front-right of body up to monkey head -->
        <path d="M 540 240 Q 605 175 622 120 Q 622 85 605 65"
              stroke="#000" stroke-width="44" fill="none" stroke-linecap="round"/>
        <path d="M 540 240 Q 605 175 622 120 Q 622 85 605 65"
              stroke="#c89a5a" stroke-width="36" fill="none" stroke-linecap="round"/>
        <!-- Neck shading stripe -->
        <path d="M 545 245 Q 610 180 625 118"
              stroke="rgba(255,255,255,.25)" stroke-width="8" fill="none" stroke-linecap="round"/>
        <!-- Monkey head — ape-style, distinct from camel body. Bigger so the
             eye parts can move with bob without clipping the head edge. -->
        <ellipse cx="605" cy="65" rx="78" ry="68" fill="#000"/>
        <ellipse cx="605" cy="65" rx="72" ry="62" fill="#7a4a25"/>
        <!-- Monkey face plate -->
        <ellipse cx="605" cy="74" rx="56" ry="46" fill="url(#temeeMonkeyFace)"/>
        <!-- Monkey ears -->
        <circle cx="540" cy="48" r="18" fill="#000"/>
        <circle cx="540" cy="48" r="13" fill="#7a4a25"/>
        <circle cx="540" cy="48" r="6"  fill="#f5d6a8"/>
        <circle cx="670" cy="48" r="18" fill="#000"/>
        <circle cx="670" cy="48" r="13" fill="#7a4a25"/>
        <circle cx="670" cy="48" r="6"  fill="#f5d6a8"/>
        ${browTuft}
        ${shinyHat}
        <!-- Beard is rendered as a destructible PART (drawBeard) so it can
             shrink mustache → bald as it takes damage. Not drawn here. -->
        <!-- Tiny mouth peek — stays under the beard but visible if beard
             is destroyed. Just a small dark line so the face isn't blank. -->
        <ellipse cx="605" cy="100" rx="6" ry="2" fill="#3a2010" opacity="0.6"/>
        <!-- Hooves on visible legs (decorative — actual leg parts drawn over) -->
        <ellipse cx="320" cy="425" rx="22" ry="10" fill="#3a2010"/>
        <ellipse cx="380" cy="425" rx="20" ry="9"  fill="#3a2010"/>
        <ellipse cx="430" cy="425" rx="20" ry="9"  fill="#3a2010"/>
        <ellipse cx="490" cy="425" rx="22" ry="10" fill="#3a2010"/>
        <!-- Ambient sand puffs at hooves -->
        <ellipse cx="290" cy="430" rx="14" ry="5" fill="#e7c08a" opacity=".55"/>
        <ellipse cx="510" cy="430" rx="14" ry="5" fill="#e7c08a" opacity=".55"/>
        ${blushPair(605, 92, 32)}
      `;
    };
    boss.parts = [
      // Two humps on top of camel body — the signature attackable parts.
      // Destroying both removes the boss's heavy attack power.
      { id:"h1",   type:"limb",  name_jp:pn.h1,   maxHP:12, hp:12, geom:{x:340, y:215, w:55, h:60}, draw:(p)=>drawHump(p,"#b07a3a"), effect:"atk-1" },
      { id:"h2",   type:"limb",  name_jp:pn.h2,   maxHP:12, hp:12, geom:{x:455, y:215, w:55, h:60}, draw:(p)=>drawHump(p,"#b07a3a"), effect:"atk-1" },
      // Monkey eyes — sized + spaced for the bigger head, far enough from
      // edge that the bob animation doesn't visually clip them off.
      { id:"eL",   type:"eye",   name_jp:pn.eL,   maxHP:7,  hp:7,  geom:{x:582, y:62, r:13, delay:0},  draw:(p)=>drawEye(p,color), effect:"miss-50" },
      { id:"eR",   type:"eye",   name_jp:pn.eR,   maxHP:7,  hp:7,  geom:{x:628, y:62, r:13, delay:.3}, draw:(p)=>drawEye(p,color), effect:"miss-30" },
      // Genghis-Khan beard — destructible. Closure reads boss.shiny so the
      // shiny variant gets a black beard (vs white) without changing the
      // shape logic. Same "no-poison" gameplay effect as a normal mouth.
      { id:"mouth",type:"mouth", name_jp:pn.mouth,maxHP:9,  hp:9,  geom:{x:605, y:100},                draw:(p)=>drawBeard(p, color, !!boss.shiny), effect:"no-poison" },
      // Two of the four visible legs are attackable; rear leg slows boss.
      { id:"L1",   type:"limb",  name_jp:pn.L1,   maxHP:9,  hp:9,  geom:{x:340, y:340, dir:90, len:80}, draw:(p)=>drawLeg(p,color,{foot:true}), effect:"atk-1" },
      { id:"L2",   type:"limb",  name_jp:pn.L2,   maxHP:9,  hp:9,  geom:{x:470, y:340, dir:90, len:80}, draw:(p)=>drawLeg(p,color,{foot:true}), effect:"slow" },
      // Camel tail — slow effect when destroyed
      { id:"tail", type:"limb",  name_jp:pn.tail, maxHP:7,  hp:7,  geom:{x:200, y:280, dir:200, len:60}, draw:(p)=>drawTail(p,color), effect:"slow" },
      // Heart core in the camel chest
      { id:"core", type:"core",  name_jp:pn.core, maxHP:32, hp:32, geom:{x:400, y:295, r:22},           draw:(p)=>drawCore(p,color), effect:"win" },
    ];
    return boss;
  }

  // Galactic mane half — a cluster of stars + nebula tufts radiating
  // outward from the lion's head on one side. geom: { cx, cy, side: -1|+1,
  // sweep }. State 0 = full cluster; state 1 = half the stars dimmed;
  // state 2 = burst-puff and gone.
  function drawStarMane(part) {
    const s = partState(part);
    const { cx, cy, side } = part.geom;
    if (s === 2) {
      const ex = cx + side * 80;
      return `<g class="part">
        <text x="${ex}" y="${cy}" text-anchor="middle" font-size="32">💥</text>
      </g>`;
    }
    // 18 star positions in a sweep around the side of the head. Polar
    // coordinates: angle from straight-up (0°) going OUTWARD per side.
    const stars = [];
    const RING_INNER = 78;
    const RING_OUTER = 168;
    for (let i = 0; i < 18; i++) {
      const t = i / 17;                  // 0..1 along the sweep
      const ang = (side < 0 ? Math.PI : 0) + (Math.PI * (t * 0.9 + 0.05));
      const r   = RING_INNER + (RING_OUTER - RING_INNER) * (0.25 + 0.75 * Math.sin(t * Math.PI));
      const x   = cx + Math.cos(ang) * r;
      const y   = cy + Math.sin(ang) * r * 0.85;       // slight vertical squash
      const sz  = 4 + (Math.abs(Math.sin(i * 1.3)) * 8);
      const dim = (s === 1 && (i % 2 === 0)) ? 0.18 : 1; // half the stars fade when damaged
      stars.push({ x, y, sz, dim });
    }
    // Nebula puff backing — colored blobs behind the stars for body
    const puffs = `
      <ellipse cx="${cx + side*60}" cy="${cy-20}" rx="80" ry="50" fill="#6a2a9a" opacity="${s===1?0.18:0.32}"/>
      <ellipse cx="${cx + side*90}" cy="${cy+30}" rx="70" ry="40" fill="#a04ad8" opacity="${s===1?0.12:0.22}"/>
      <ellipse cx="${cx + side*110}" cy="${cy-10}" rx="55" ry="35" fill="#ff66cc" opacity="${s===1?0.10:0.18}"/>
    `;
    const starsSVG = stars.map(({x,y,sz,dim}) => `
      <g opacity="${dim}">
        <circle cx="${x}" cy="${y}" r="${sz*0.7}" fill="#fff" opacity="0.85"/>
        <path d="M ${x-sz} ${y} L ${x+sz} ${y} M ${x} ${y-sz} L ${x} ${y+sz}" stroke="#fff" stroke-width="${sz*0.18}" stroke-linecap="round"/>
      </g>`).join("");
    const cracks = s === 1
      ? `<path d="M ${cx + side*50} ${cy-30} L ${cx + side*70} ${cy} L ${cx + side*55} ${cy+30}" stroke="#3a0a4a" stroke-width="3" fill="none" opacity="0.6"/>`
      : "";
    return `<g class="part">
      ${puffs}
      ${starsSVG}
      ${cracks}
    </g>`;
  }

  // Black-hole chest core — dark center with a bright accretion ring.
  // The actual weak point; destroying it ends the fight.
  function drawBlackHoleCore(part) {
    const s = partState(part);
    const { x, y, r } = part.geom;
    if (s === 2) {
      return `<g class="part">
        <text x="${x}" y="${y+r*0.5}" text-anchor="middle" font-size="${r*2}">💥</text>
      </g>`;
    }
    const cracks = s === 1
      ? `<path d="M ${x-r*0.6} ${y-r*0.4} L ${x+r*0.2} ${y+r*0.1} L ${x-r*0.1} ${y+r*0.5}" stroke="#ffd24a" stroke-width="2.5" fill="none"/>`
      : "";
    return `<g class="part bob" style="transform-origin:${x}px ${y}px">
      <!-- accretion-disk halo (bright orange-pink) -->
      <ellipse cx="${x}" cy="${y}" rx="${r*1.95}" ry="${r*0.5}" fill="none" stroke="#ffaa44" stroke-width="3.5" opacity="0.85"/>
      <ellipse cx="${x}" cy="${y}" rx="${r*2.15}" ry="${r*0.6}" fill="none" stroke="#ff6688" stroke-width="2.2" opacity="0.7"/>
      <ellipse cx="${x}" cy="${y}" rx="${r*1.7}"  ry="${r*0.4}" fill="none" stroke="#ffe45c" stroke-width="2"   opacity="0.9"/>
      <!-- glow halo behind the void -->
      <circle cx="${x}" cy="${y}" r="${r*1.25}" fill="#ff9844" opacity="0.25"/>
      <!-- dark event horizon -->
      <circle cx="${x}" cy="${y}" r="${r}" fill="#000" stroke="#220a40" stroke-width="3"/>
      <!-- inner singularity highlight -->
      <circle cx="${x-r*0.25}" cy="${y-r*0.25}" r="${r*0.18}" fill="#3a0a5a" opacity="0.6"/>
      ${cracks}
    </g>`;
  }

  // ---------- FINAL BOSS: ブレインロット・キング (Space Lion) ----------
  // The cosmic lion final boss. Rides his own black hole — chest is a
  // literal event horizon eating the world. Mane is two galactic clusters
  // of stars (left half + right half), eyes glow, tail trails stardust,
  // four legs visible (two attackable: front + back). Audio (catchphrase /
  // attacks / hits / taunts) is the same as the prior fusion-overmind
  // version so nothing needs re-recording.
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
          <radialGradient id="brSpaceBg" cx=".5" cy=".5" r=".9">
            <stop offset="0"   stop-color="#3a0a5a" stop-opacity="0.55"/>
            <stop offset="0.5" stop-color="#180630" stop-opacity="0.55"/>
            <stop offset="1"   stop-color="#000"    stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="brLionBody" cx=".5" cy=".5" r=".7">
            <stop offset="0"   stop-color="#5a2a8a"/>
            <stop offset="0.7" stop-color="#3a1568"/>
            <stop offset="1"   stop-color="#1a0a3a"/>
          </radialGradient>
          <radialGradient id="brLionFace" cx=".5" cy=".5" r=".6">
            <stop offset="0"   stop-color="#a060d8"/>
            <stop offset="1"   stop-color="#5a2090"/>
          </radialGradient>
          <radialGradient id="brEventHorizon" cx=".5" cy=".5" r=".5">
            <stop offset="0"   stop-color="#ffe45c"/>
            <stop offset="0.5" stop-color="#ff8844"/>
            <stop offset="1"   stop-color="#ff3366" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <!-- Deep-space cosmic backdrop wash -->
        <ellipse cx="400" cy="240" rx="360" ry="220" fill="url(#brSpaceBg)"/>
        <!-- Stars being sucked toward the core — small fixed dots -->
        <g fill="#fff">
          <circle cx="60"  cy="80"  r="1.5" opacity="0.85"/>
          <circle cx="120" cy="60"  r="1.2" opacity="0.7"/>
          <circle cx="700" cy="70"  r="1.4" opacity="0.85"/>
          <circle cx="760" cy="120" r="1.2" opacity="0.7"/>
          <circle cx="40"  cy="380" r="1.4" opacity="0.85"/>
          <circle cx="100" cy="430" r="1.0" opacity="0.6"/>
          <circle cx="750" cy="390" r="1.5" opacity="0.85"/>
          <circle cx="690" cy="440" r="1.0" opacity="0.6"/>
        </g>
        <!-- Spiral motion lines suggesting gravity toward the core -->
        <g stroke="#ff8844" stroke-width="1" fill="none" opacity="0.35">
          <path d="M 80 100  Q 200 200 360 240"/>
          <path d="M 720 100 Q 600 200 440 240"/>
          <path d="M 80 380  Q 200 300 360 240"/>
          <path d="M 720 380 Q 600 300 440 240"/>
        </g>
        <!-- Tail trail of stardust — drawn behind body, before parts overlay -->
        <path d="M 540 320 Q 640 280 720 220 Q 760 170 770 130"
              stroke="#aa66ff" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.55"/>
        <path d="M 540 320 Q 640 280 720 220 Q 760 170 770 130"
              stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/>
        <circle cx="640" cy="278" r="2" fill="#fff" opacity="0.85"/>
        <circle cx="700" cy="232" r="1.5" fill="#fff" opacity="0.7"/>
        <circle cx="745" cy="180" r="1.8" fill="#fff" opacity="0.85"/>
        <!-- Lion torso (cosmic purple silhouette) -->
        <ellipse cx="400" cy="320" rx="135" ry="68" fill="#0a0418" opacity="0.6"/>
        <ellipse cx="400" cy="320" rx="128" ry="62" fill="url(#brLionBody)" stroke="#1a0a3a" stroke-width="3"/>
        <!-- Belly highlight -->
        <ellipse cx="400" cy="350" rx="80" ry="14" fill="#fff" opacity="0.08"/>
        <!-- Decorative non-attackable legs (4 visible — 2 are real parts) -->
        <ellipse cx="325" cy="395" rx="14" ry="10" fill="#3a1a5a"/>
        <ellipse cx="475" cy="395" rx="14" ry="10" fill="#3a1a5a"/>
        <!-- Neck connecting body to head -->
        <path d="M 400 260 Q 400 240 400 220" stroke="#3a1568" stroke-width="50" stroke-linecap="round"/>
        <!-- Lion head -->
        <ellipse cx="400" cy="180" rx="78" ry="70" fill="#0a0418"/>
        <ellipse cx="400" cy="180" rx="72" ry="64" fill="url(#brLionFace)"/>
        <!-- Face details — snout + nose + mouth -->
        <ellipse cx="400" cy="200" rx="34" ry="22" fill="#7a3aa8"/>
        <ellipse cx="400" cy="192" rx="9" ry="6" fill="#1a0028"/>
        <path d="M 400 200 L 400 212 M 388 220 Q 400 226 412 220" stroke="#1a0028" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Lion ears (decorative, behind mane glow) -->
        <path d="M 340 130 L 348 105 L 365 122 Z" fill="#3a1568"/>
        <path d="M 460 130 L 452 105 L 435 122 Z" fill="#3a1568"/>
        <!-- Brow detail -->
        <path d="M 370 158 Q 380 152 392 158" stroke="#1a0028" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M 408 158 Q 420 152 430 158" stroke="#1a0028" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Whiskers -->
        <path d="M 366 210 Q 340 212 318 218" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.55"/>
        <path d="M 366 215 Q 340 220 320 230" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.45"/>
        <path d="M 434 210 Q 460 212 482 218" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.55"/>
        <path d="M 434 215 Q 460 220 480 230" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.45"/>
        <!-- Star sparkles scattered across the background -->
        <text x="80"  y="90"  font-size="14">✨</text>
        <text x="710" y="90"  font-size="14">✨</text>
        <text x="120" y="400" font-size="14">⭐</text>
        <text x="680" y="400" font-size="14">⭐</text>
        <text x="40"  y="220" font-size="12">·</text>
        <text x="760" y="220" font-size="12">·</text>
      `,
      parts: [
        // The galactic mane — two destructible halves of star clusters.
        // Each side covers half the wreath around the head.
        { id:"maneL", type:"limb", name_jp:pn.maneL || "たてがみ・ひだり", maxHP:16, hp:16, geom:{cx:400, cy:180, side:-1}, draw:(p)=>drawStarMane(p), effect:"atk-1" },
        { id:"maneR", type:"limb", name_jp:pn.maneR || "たてがみ・みぎ",   maxHP:16, hp:16, geom:{cx:400, cy:180, side:+1}, draw:(p)=>drawStarMane(p), effect:"atk-1" },
        // Glowing cosmic eyes.
        { id:"eL",    type:"eye",  name_jp:pn.eL    || "ひだりめ",        maxHP:10, hp:10, geom:{x:378, y:172, r:14, delay:0},  draw:(p)=>drawEye(p, "#88ddff"), effect:"miss-50" },
        { id:"eR",    type:"eye",  name_jp:pn.eR    || "みぎめ",          maxHP:10, hp:10, geom:{x:422, y:172, r:14, delay:.3}, draw:(p)=>drawEye(p, "#88ddff"), effect:"miss-30" },
        // Front + back attackable legs (other two visible legs are decorative).
        { id:"legF",  type:"limb", name_jp:pn.legF  || "まえあし",        maxHP:12, hp:12, geom:{x:355, y:340, dir:90, len:90}, draw:(p)=>drawLeg(p, "#7a3aa8", {foot:true}), effect:"slow" },
        { id:"legB",  type:"limb", name_jp:pn.legB  || "うしろあし",       maxHP:12, hp:12, geom:{x:445, y:340, dir:90, len:90}, draw:(p)=>drawLeg(p, "#7a3aa8", {foot:true}), effect:"slow" },
        // Stardust comet tail.
        { id:"tail",  type:"limb", name_jp:pn.tail  || "しっぽ",          maxHP:10, hp:10, geom:{x:520, y:320, dir:-20, len:140}, draw:(p)=>drawTail(p, "#aa66ff"), effect:"no-special" },
        // Black hole at his chest — the actual weak point.
        { id:"core",  type:"core", name_jp:pn.core  || "ブラックホール・コア", maxHP:54, hp:54, geom:{x:400, y:320, r:28},           draw:(p)=>drawBlackHoleCore(p), effect:"win" },
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
