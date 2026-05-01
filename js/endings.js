// Boss "ending pictures" — SVG scenes depicting the dystopian world each
// boss creates if their evil goal succeeds. Shown when:
//   • hero mode defeat (player lost; boss reigns)
//   • PvP victory (winning kid's monster takes over the world)
//
// Style intentionally matches the cartoon-emoji vibe of the boss SVGs in
// monsters.js — flat shapes, gradients, exaggerated proportions, comedic.
// All scenes are 800x500 viewBox so they fit the existing .stage container.
//
// Each ending() function returns { svg, captionJp, captionEn } so the
// caller can render the picture plus a localized caption.
window.Endings = (() => {

  // Reusable bits
  const STINK_LINE = (x, y) => `<path d="M ${x} ${y} q -6 -8 0 -16 q 6 -8 0 -16" stroke="#888" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
  const SPARKLE = (x, y, r=4) => `<g><line x1="${x-r}" y1="${y}" x2="${x+r}" y2="${y}" stroke="#fff" stroke-width="1.5"/><line x1="${x}" y1="${y-r}" x2="${x}" y2="${y+r}" stroke="#fff" stroke-width="1.5"/></g>`;

  // ----------------------------------------------------------------------
  // 1. tako — Everything in the world is takoyaki
  // ----------------------------------------------------------------------
  function tako() {
    const takoyakiBall = (cx, cy, r=20) => `
      <g transform="translate(${cx},${cy})">
        <circle r="${r}" fill="#a87245" stroke="#3a2210" stroke-width="2.5"/>
        <ellipse cx="${-r*0.3}" cy="${-r*0.3}" rx="${r*0.4}" ry="${r*0.25}" fill="#fff" opacity=".55"/>
        <path d="M ${-r*0.55} ${-r*0.2} q -4 -2 -7 0" stroke="#3a2210" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M ${r*0.45} ${-r*0.1} q 4 -2 7 -1" stroke="#3a2210" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="0" cy="${r*0.55}" rx="${r*0.7}" ry="${r*0.18}" fill="#7a4a25" opacity=".7"/>
      </g>`;
    const shopBldg = (x, w, h, label, color) => `
      <rect x="${x}" y="${500 - h}" width="${w}" height="${h}" fill="${color}" stroke="#000" stroke-width="3"/>
      <rect x="${x+5}" y="${500-h+8}" width="${w-10}" height="32" fill="#ffcc00" stroke="#000" stroke-width="2"/>
      <text x="${x + w/2}" y="${500-h+30}" text-anchor="middle" font-size="18" font-weight="900" fill="#5a1500">${label}</text>
      <rect x="${x + w*0.35}" y="${500 - h*0.5}" width="${w*0.3}" height="${h*0.5}" fill="#3a2210" stroke="#000" stroke-width="2"/>
      <circle cx="${x + w*0.55}" cy="${500 - h*0.25}" r="2.5" fill="#ffcc00"/>`;
    const svg = `
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ed-tako-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ffd6b8"/>
            <stop offset="1" stop-color="#ff9c70"/>
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#ed-tako-sky)"/>
        <!-- floating takoyaki "clouds" -->
        ${takoyakiBall(80, 90, 28)}
        ${takoyakiBall(180, 50, 22)}
        ${takoyakiBall(720, 70, 32)}
        ${takoyakiBall(620, 110, 24)}
        ${takoyakiBall(450, 60, 20)}
        ${takoyakiBall(340, 130, 18)}
        ${takoyakiBall(130, 180, 24)}
        ${takoyakiBall(680, 200, 26)}
        <!-- Banner -->
        <rect x="120" y="160" width="560" height="60" rx="14" fill="#ee3344" stroke="#000" stroke-width="4"/>
        <text x="400" y="200" text-anchor="middle" fill="#fff" font-size="32" font-weight="900" style="text-shadow:0 3px 0 #000">たこやき せかい！</text>
        <!-- City row -->
        ${shopBldg(20, 130, 170, "たこやき", "#5a3a8a")}
        ${shopBldg(160, 110, 220, "たこやき", "#7a4aa0")}
        ${shopBldg(280, 130, 190, "たこやき", "#5a3a8a")}
        ${shopBldg(420, 110, 240, "たこやき", "#6a3a90")}
        ${shopBldg(540, 130, 200, "たこやき", "#5a3a8a")}
        ${shopBldg(670, 110, 130, "たこやき", "#7a4aa0")}
        <!-- Foreground: a "burger" stand whose burger is takoyaki -->
        <g transform="translate(280, 380)">
          <ellipse cx="40" cy="78" rx="55" ry="10" fill="#000" opacity=".25"/>
          <ellipse cx="40" cy="40" rx="50" ry="20" fill="#ffd58a" stroke="#000" stroke-width="3"/>
          ${takoyakiBall(40, 28, 22)}
          <ellipse cx="40" cy="18" rx="50" ry="20" fill="#ffd58a" stroke="#000" stroke-width="3"/>
          <text x="40" y="100" text-anchor="middle" font-size="16" font-weight="900" fill="#fff" style="text-shadow:0 2px 0 #000">バーガー</text>
        </g>
        <!-- Foreground: ice-cream cone with takoyaki scoop -->
        <g transform="translate(490, 380)">
          <polygon points="20,80 -20,80 0,30" fill="#d9a060" stroke="#000" stroke-width="3"/>
          ${takoyakiBall(0, 22, 22)}
          ${takoyakiBall(-12, 4, 14)}
          ${takoyakiBall(14, 6, 14)}
        </g>
        <!-- A confused person figure -->
        <g transform="translate(120, 410)">
          <circle cx="0" cy="0" r="20" fill="#fde0c0" stroke="#000" stroke-width="3"/>
          <path d="M -8 -3 q 4 4 8 0" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M 8 -3 q -4 4 -8 0" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <ellipse cx="0" cy="8" rx="6" ry="3" fill="#000"/>
          <text x="0" y="-30" text-anchor="middle" font-size="20">😱</text>
          <rect x="-15" y="20" width="30" height="40" fill="#5a3a8a" stroke="#000" stroke-width="2"/>
          ${takoyakiBall(0, 70, 14)}
        </g>
      </svg>`;
    return { svg, captionJp: "たこやきが せかいを せいふくした！", captionEn: "Tako Tako Sahur turned all food into takoyaki!" };
  }

  // ----------------------------------------------------------------------
  // 2. unko — Rivers run brown, poop museums everywhere
  // ----------------------------------------------------------------------
  function unko() {
    const poopBlob = (x, y, s=1) => `
      <g transform="translate(${x},${y}) scale(${s})">
        <path d="M -22 18 Q -22 -2 -8 -8 Q -10 -22 4 -22 Q 14 -32 22 -22 Q 30 -8 22 -2 Q 32 8 22 18 Z" fill="#7a4a25" stroke="#3a2210" stroke-width="2.5"/>
        <ellipse cx="-6" cy="-4" rx="3" ry="2" fill="#000"/>
        <ellipse cx="8"  cy="-4" rx="3" ry="2" fill="#000"/>
        <path d="M -4 6 q 6 4 12 0" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>`;
    const svg = `
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ed-unko-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#9d6c3a"/>
            <stop offset="1" stop-color="#cc9866"/>
          </linearGradient>
          <linearGradient id="ed-unko-river" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#b07840"/>
            <stop offset="1" stop-color="#5a3a1a"/>
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#ed-unko-sky)"/>
        <!-- stink lines rising -->
        ${STINK_LINE(120, 100)}${STINK_LINE(280, 60)}${STINK_LINE(500, 80)}${STINK_LINE(680, 110)}
        ${STINK_LINE(180, 130)}${STINK_LINE(420, 130)}${STINK_LINE(620, 70)}
        <!-- museum building -->
        <g>
          <rect x="180" y="200" width="440" height="180" fill="#7a5a35" stroke="#000" stroke-width="4"/>
          <polygon points="170,200 400,130 630,200" fill="#9d6f3a" stroke="#000" stroke-width="4"/>
          <!-- columns -->
          <rect x="220" y="220" width="22" height="160" fill="#bd8d50" stroke="#000" stroke-width="2"/>
          <rect x="290" y="220" width="22" height="160" fill="#bd8d50" stroke="#000" stroke-width="2"/>
          <rect x="488" y="220" width="22" height="160" fill="#bd8d50" stroke="#000" stroke-width="2"/>
          <rect x="558" y="220" width="22" height="160" fill="#bd8d50" stroke="#000" stroke-width="2"/>
          <!-- entrance -->
          <rect x="350" y="280" width="100" height="100" fill="#3a2210" stroke="#000" stroke-width="3"/>
          <!-- big sign -->
          <rect x="200" y="155" width="400" height="40" fill="#ee3344" stroke="#000" stroke-width="3"/>
          <text x="400" y="186" text-anchor="middle" fill="#fff" font-size="24" font-weight="900" style="text-shadow:0 2px 0 #000">うんち博物館</text>
        </g>
        <!-- brown river in foreground -->
        <path d="M 0 380 Q 200 360 400 380 T 800 390 L 800 500 L 0 500 Z" fill="url(#ed-unko-river)" stroke="#3a2210" stroke-width="3"/>
        <ellipse cx="200" cy="385" rx="60" ry="6" fill="#5a3a1a" opacity=".5"/>
        <ellipse cx="500" cy="395" rx="80" ry="6" fill="#5a3a1a" opacity=".5"/>
        <!-- poop blobs floating in/on the river -->
        ${poopBlob(80, 410, 1.0)}
        ${poopBlob(230, 430, 1.3)}
        ${poopBlob(420, 415, 1.1)}
        ${poopBlob(580, 440, 1.2)}
        ${poopBlob(720, 420, 1.0)}
        ${poopBlob(340, 460, 0.9)}
        <!-- person plugging nose -->
        <g transform="translate(70, 320)">
          <circle cx="0" cy="0" r="22" fill="#fde0c0" stroke="#000" stroke-width="3"/>
          <ellipse cx="-7" cy="-3" rx="2" ry="3" fill="#000"/>
          <ellipse cx="7"  cy="-3" rx="2" ry="3" fill="#000"/>
          <ellipse cx="0" cy="6" rx="6" ry="4" fill="#3a1a1a"/>
          <circle cx="-4" cy="2" r="3" fill="#fde0c0" stroke="#000" stroke-width="1.5"/>
          <text x="0" y="-32" text-anchor="middle" font-size="18">🤢</text>
          <rect x="-18" y="22" width="36" height="40" fill="#5a4a2a" stroke="#000" stroke-width="2"/>
        </g>
        <!-- title banner -->
        <rect x="150" y="40" width="500" height="50" rx="12" fill="#000" stroke="#ffcc00" stroke-width="3"/>
        <text x="400" y="74" text-anchor="middle" fill="#ffcc00" font-size="26" font-weight="900">茶色は テーマカラー…</text>
      </svg>`;
    return { svg, captionJp: "せかいの 川は ぜんぶ うんちに なった…", captionEn: "Bombardiro Unkodilo turned every river brown." };
  }

  // ----------------------------------------------------------------------
  // 3. tral — Italian-only world; oceans being eaten
  // ----------------------------------------------------------------------
  function tral() {
    const note = (x, y, sz=1, c="#ffcc00") => `
      <g transform="translate(${x},${y}) scale(${sz})">
        <ellipse cx="0" cy="6" rx="10" ry="7" fill="${c}" stroke="#000" stroke-width="2"/>
        <line x1="9" y1="6" x2="9" y2="-22" stroke="#000" stroke-width="3"/>
        <path d="M 9 -22 q 12 4 8 14" stroke="#000" stroke-width="3" fill="none"/>
      </g>`;
    const svg = `
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ed-tral-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1a4a78"/>
            <stop offset="1" stop-color="#3a7aa8"/>
          </linearGradient>
          <linearGradient id="ed-tral-curtain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#a02a3a"/>
            <stop offset="1" stop-color="#601020"/>
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#ed-tral-sky)"/>
        <!-- opera curtains framing -->
        <path d="M 0 0 L 0 500 L 100 480 Q 110 400 90 320 Q 100 240 80 180 Q 100 100 70 0 Z" fill="url(#ed-tral-curtain)" stroke="#3a0510" stroke-width="3"/>
        <path d="M 800 0 L 800 500 L 700 480 Q 690 400 710 320 Q 700 240 720 180 Q 700 100 730 0 Z" fill="url(#ed-tral-curtain)" stroke="#3a0510" stroke-width="3"/>
        <!-- spotlight glow -->
        <ellipse cx="400" cy="280" rx="220" ry="180" fill="#ffe45c" opacity=".25"/>
        <!-- stage floor -->
        <ellipse cx="400" cy="450" rx="280" ry="40" fill="#3a2200" stroke="#000" stroke-width="3"/>
        <!-- "BANNED Japanese" sign -->
        <g transform="translate(150, 110)">
          <rect width="220" height="80" fill="#fff" stroke="#000" stroke-width="3"/>
          <text x="110" y="45" text-anchor="middle" font-size="34" font-weight="900" fill="#000">日本語</text>
          <line x1="10" y1="10" x2="210" y2="70" stroke="#ee0000" stroke-width="8"/>
          <line x1="210" y1="10" x2="10" y2="70" stroke="#ee0000" stroke-width="8"/>
        </g>
        <!-- "Tralalero ONLY" banner -->
        <rect x="430" y="100" width="280" height="80" rx="12" fill="#1a4a78" stroke="#ffcc00" stroke-width="4"/>
        <text x="570" y="138" text-anchor="middle" fill="#ffcc00" font-size="24" font-weight="900">TRALALERO</text>
        <text x="570" y="166" text-anchor="middle" fill="#fff" font-size="18" font-weight="700">のみ OK！</text>
        <!-- musical notes everywhere -->
        ${note(120, 250, 1.0, "#ffcc00")}
        ${note(220, 280, 0.8, "#ff8888")}
        ${note(350, 240, 1.2, "#ffcc00")}
        ${note(550, 260, 0.9, "#ff8888")}
        ${note(670, 280, 1.0, "#ffcc00")}
        ${note(280, 350, 0.7, "#ffcc00")}
        ${note(500, 350, 0.8, "#ff8888")}
        <!-- forced opera singer -->
        <g transform="translate(380, 350)">
          <ellipse cx="0" cy="80" rx="55" ry="12" fill="#000" opacity=".3"/>
          <path d="M -50 80 L -40 0 L 40 0 L 50 80 Z" fill="#3a3a8a" stroke="#000" stroke-width="3"/>
          <circle cx="0" cy="-30" r="28" fill="#fde0c0" stroke="#000" stroke-width="3"/>
          <ellipse cx="-9" cy="-32" rx="3" ry="4" fill="#000"/>
          <ellipse cx="9" cy="-32" rx="3" ry="4" fill="#000"/>
          <ellipse cx="0" cy="-18" rx="9" ry="14" fill="#5a1010"/>
          <text x="-30" y="-58" font-size="22">♪</text>
          <text x="22" y="-50" font-size="20">♫</text>
          <!-- tear -->
          <ellipse cx="-13" cy="-22" rx="2.5" ry="4" fill="#7cd1ff"/>
        </g>
        <!-- ocean being slurped at edge -->
        <g transform="translate(670, 380)">
          <path d="M -50 0 q 25 -10 50 0 q -25 8 -50 0 Z" fill="#3aa7d8" stroke="#000" stroke-width="2"/>
          <path d="M -30 -10 q 15 -6 30 0" fill="none" stroke="#fff" stroke-width="2"/>
        </g>
      </svg>`;
    return { svg, captionJp: "イタリア語 だけの 世界に なった…", captionEn: "Tralalero made everyone sing in Italian." };
  }

  // ----------------------------------------------------------------------
  // 4. pamp — Plushie kingdom; kids absorbed
  // ----------------------------------------------------------------------
  function pamp() {
    const plush = (x, y, c1, c2, sz=1) => `
      <g transform="translate(${x},${y}) scale(${sz})">
        <ellipse cx="0" cy="36" rx="42" ry="8" fill="#000" opacity=".25"/>
        <circle cx="-30" cy="-15" r="20" fill="${c2}" stroke="#000" stroke-width="2.5"/>
        <circle cx="30" cy="-15" r="20" fill="${c2}" stroke="#000" stroke-width="2.5"/>
        <ellipse cx="0" cy="0" rx="38" ry="32" fill="${c1}" stroke="#000" stroke-width="3"/>
        <circle cx="-13" cy="-6" r="4" fill="#000"/>
        <circle cx="13" cy="-6" r="4" fill="#000"/>
        <circle cx="-12" cy="-7" r="1.5" fill="#fff"/>
        <circle cx="14" cy="-7" r="1.5" fill="#fff"/>
        <ellipse cx="0" cy="6" rx="4" ry="2" fill="#000"/>
        <path d="M -8 12 q 8 6 16 0" stroke="#000" stroke-width="2" fill="none"/>
      </g>`;
    const heart = (x, y, c="#ff6699", sz=1) => `
      <path d="M ${x} ${y+4*sz} q -10*sz -10*sz -10*sz -16*sz q 0 -10*sz 10*sz -10*sz q 10*sz 0 10*sz 10*sz q 0 6*sz -10*sz 16*sz z" fill="${c}" stroke="#000" stroke-width="2"/>`.replace(/(\d+)\*sz/g, (_, n) => Number(n) * sz);
    const svg = `
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ed-pamp-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fde0f0"/>
            <stop offset="1" stop-color="#caa6e8"/>
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#ed-pamp-sky)"/>
        <!-- floating hearts -->
        ${heart(80, 80, "#ff88aa", 1)}
        ${heart(680, 70, "#ee6699", 1.2)}
        ${heart(380, 50, "#ff88aa", 0.8)}
        ${heart(220, 130, "#ff66aa", 0.7)}
        ${heart(540, 140, "#ff88aa", 0.9)}
        <!-- plushie mountain (background heap) -->
        <g>
          ${plush(150, 380, "#fde0a0", "#fcc870", 1.4)}
          ${plush(340, 360, "#caa6e8", "#a888d4", 1.5)}
          ${plush(540, 380, "#fde0c0", "#fcc870", 1.3)}
          ${plush(680, 400, "#fbcde6", "#e899c4", 1.1)}
          ${plush(60, 420, "#caa6e8", "#a888d4", 1.0)}
          ${plush(240, 440, "#a8e0c8", "#88c8a8", 0.9)}
          ${plush(450, 440, "#fbcde6", "#e899c4", 1.0)}
        </g>
        <!-- captured kids on top -->
        <g transform="translate(335, 250)">
          <circle cx="0" cy="0" r="22" fill="#fde0c0" stroke="#000" stroke-width="3"/>
          <path d="M -7 -3 q 3 6 7 0" stroke="#000" stroke-width="2" fill="none"/>
          <path d="M 0 -3 q 3 6 7 0" stroke="#000" stroke-width="2" fill="none"/>
          <ellipse cx="3" cy="10" rx="5" ry="3" fill="#000"/>
          <ellipse cx="-7" cy="6" rx="2" ry="3" fill="#7cd1ff"/>
          <text x="0" y="-30" text-anchor="middle" font-size="20">😢</text>
          <!-- "stuck" arms wrapped in plush -->
          <ellipse cx="-25" cy="20" rx="14" ry="10" fill="#caa6e8" stroke="#000" stroke-width="2"/>
          <ellipse cx="25" cy="20" rx="14" ry="10" fill="#caa6e8" stroke="#000" stroke-width="2"/>
        </g>
        <!-- another kid -->
        <g transform="translate(490, 290)">
          <circle cx="0" cy="0" r="20" fill="#ffd8aa" stroke="#000" stroke-width="3"/>
          <ellipse cx="-6" cy="-3" rx="2" ry="3" fill="#000"/>
          <ellipse cx="6" cy="-3" rx="2" ry="3" fill="#000"/>
          <path d="M -5 6 q 5 -2 10 0" stroke="#000" stroke-width="2" fill="none"/>
          <text x="0" y="-28" text-anchor="middle" font-size="18">😭</text>
        </g>
        <!-- "ふわふわ こっか" banner -->
        <rect x="100" y="60" width="600" height="60" rx="14" fill="#a888d4" stroke="#000" stroke-width="4"/>
        <text x="400" y="100" text-anchor="middle" fill="#fff" font-size="32" font-weight="900" style="text-shadow:0 3px 0 #000">ふわふわ こっか けんこく！</text>
      </svg>`;
    return { svg, captionJp: "せかいの こども が ぜんぶ コレクション された…", captionEn: "Brr Brr Pampamu collected every child in the world." };
  }

  // ----------------------------------------------------------------------
  // 5. parfait — All sushi turned into parfait
  // ----------------------------------------------------------------------
  function parfait() {
    const parfaitGlass = (x, y, sz=1) => `
      <g transform="translate(${x},${y}) scale(${sz})">
        <path d="M -28 0 L 28 0 L 22 60 L -22 60 Z" fill="#e0f0ff" stroke="#7aa8d0" stroke-width="2.5" opacity=".85"/>
        <path d="M -22 50 L 22 50 L 22 60 L -22 60 Z" fill="#ffd58a" stroke="#a07020" stroke-width="2"/>
        <ellipse cx="0" cy="40" rx="20" ry="6" fill="#cc4488" opacity=".7"/>
        <!-- whip cream -->
        <path d="M -26 -6 Q -20 -22 -8 -16 Q 0 -28 8 -18 Q 18 -28 22 -10 Q 28 -2 22 0 L -26 0 Z" fill="#fff" stroke="#d0d0d0" stroke-width="2"/>
        <!-- cherry -->
        <circle cx="0" cy="-16" r="6" fill="#ee2244" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="-22" x2="-3" y2="-30" stroke="#3a8a3a" stroke-width="2"/>
      </g>`;
    const svg = `
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ed-parfait-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ffe0f0"/>
            <stop offset="1" stop-color="#ffb8d8"/>
          </linearGradient>
          <linearGradient id="ed-parfait-belt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1a1a2a"/>
            <stop offset="1" stop-color="#3a3a4a"/>
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#ed-parfait-sky)"/>
        <!-- raining whip cream / strawberries -->
        <g opacity=".8">
          <ellipse cx="80" cy="80" rx="20" ry="10" fill="#fff" stroke="#d0d0d0" stroke-width="2"/>
          <ellipse cx="220" cy="60" rx="14" ry="8" fill="#fff" stroke="#d0d0d0" stroke-width="2"/>
          <circle cx="350" cy="100" r="8" fill="#ee2244" stroke="#000" stroke-width="1.5"/>
          <circle cx="500" cy="70" r="6" fill="#ee2244" stroke="#000" stroke-width="1.5"/>
          <ellipse cx="650" cy="90" rx="18" ry="9" fill="#fff" stroke="#d0d0d0" stroke-width="2"/>
          <circle cx="730" cy="60" r="7" fill="#ee2244" stroke="#000" stroke-width="1.5"/>
        </g>
        <!-- "寿司屋" sign turned over -->
        <g transform="translate(50, 150)">
          <rect width="160" height="50" fill="#a88040" stroke="#000" stroke-width="3"/>
          <text x="80" y="35" text-anchor="middle" font-size="28" font-weight="900" fill="#fff" style="text-shadow:0 2px 0 #000">寿司屋</text>
          <line x1="0" y1="0" x2="160" y2="50" stroke="#ee0000" stroke-width="6"/>
        </g>
        <g transform="translate(220, 150)">
          <rect width="220" height="50" fill="#ff88bb" stroke="#000" stroke-width="3"/>
          <text x="110" y="35" text-anchor="middle" font-size="24" font-weight="900" fill="#fff" style="text-shadow:0 2px 0 #000">パフェ屋 へんしん！</text>
        </g>
        <!-- conveyor belt -->
        <rect x="0" y="320" width="800" height="50" fill="url(#ed-parfait-belt)" stroke="#000" stroke-width="3"/>
        <g stroke="#666" stroke-width="2" opacity=".6">
          <line x1="40" y1="335" x2="60" y2="335"/>
          <line x1="120" y1="335" x2="140" y2="335"/>
          <line x1="200" y1="335" x2="220" y2="335"/>
          <line x1="280" y1="335" x2="300" y2="335"/>
          <line x1="360" y1="335" x2="380" y2="335"/>
          <line x1="440" y1="335" x2="460" y2="335"/>
          <line x1="520" y1="335" x2="540" y2="335"/>
          <line x1="600" y1="335" x2="620" y2="335"/>
          <line x1="680" y1="335" x2="700" y2="335"/>
        </g>
        <!-- parfait plates on the belt -->
        ${parfaitGlass(80, 250, 0.85)}
        ${parfaitGlass(240, 250, 1.0)}
        ${parfaitGlass(420, 250, 0.9)}
        ${parfaitGlass(580, 250, 1.05)}
        ${parfaitGlass(720, 250, 0.85)}
        <!-- sad sushi chef -->
        <g transform="translate(640, 380)">
          <circle cx="0" cy="0" r="22" fill="#fde0c0" stroke="#000" stroke-width="3"/>
          <rect x="-20" y="-20" width="40" height="14" fill="#fff" stroke="#000" stroke-width="2"/>
          <ellipse cx="-7" cy="0" rx="2" ry="3" fill="#000"/>
          <ellipse cx="7" cy="0" rx="2" ry="3" fill="#000"/>
          <path d="M -7 12 q 7 -4 14 0" stroke="#000" stroke-width="2" fill="none"/>
          <ellipse cx="-12" cy="6" rx="2" ry="4" fill="#7cd1ff"/>
          <text x="-22" y="-18" font-size="18">😭</text>
        </g>
        <!-- title banner -->
        <rect x="120" y="60" width="560" height="60" rx="14" fill="#ee5599" stroke="#000" stroke-width="4"/>
        <text x="400" y="98" text-anchor="middle" fill="#fff" font-size="28" font-weight="900" style="text-shadow:0 3px 0 #000">魚は あまく あるべき！</text>
      </svg>`;
    return { svg, captionJp: "寿司は ぜんぶ パフェに なった…", captionEn: "Parfait Iwashi turned every sushi into parfait." };
  }

  // ----------------------------------------------------------------------
  // 6. anpan — Hero replacement; new flag and statue
  // ----------------------------------------------------------------------
  function anpan() {
    const svg = `
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ed-anpan-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ffd6c0"/>
            <stop offset="1" stop-color="#ff9070"/>
          </linearGradient>
          <radialGradient id="ed-anpan-face" cx=".4" cy=".3" r=".75">
            <stop offset="0" stop-color="#ffe0b0"/>
            <stop offset=".7" stop-color="#e0a060"/>
            <stop offset="1" stop-color="#a05530"/>
          </radialGradient>
        </defs>
        <rect width="800" height="500" fill="url(#ed-anpan-sky)"/>
        <!-- giant flag -->
        <g transform="translate(540, 90)">
          <rect width="220" height="160" fill="#fff" stroke="#000" stroke-width="4"/>
          <!-- the "red dot" — replaced with anpan-maguro face -->
          <circle cx="110" cy="80" r="55" fill="url(#ed-anpan-face)" stroke="#000" stroke-width="3"/>
          <ellipse cx="100" cy="70" rx="6" ry="4" fill="#000"/>
          <ellipse cx="120" cy="70" rx="6" ry="4" fill="#000"/>
          <circle cx="100" cy="90" r="3" fill="#a02020"/>
          <circle cx="120" cy="90" r="3" fill="#a02020"/>
          <ellipse cx="110" cy="100" rx="10" ry="4" fill="#3a1a1a"/>
          <!-- flagpole -->
          <rect x="-10" y="-20" width="6" height="220" fill="#a06030" stroke="#000" stroke-width="2"/>
        </g>
        <!-- statue plinth -->
        <g transform="translate(160, 200)">
          <rect x="-90" y="180" width="180" height="60" fill="#7a6a55" stroke="#000" stroke-width="3"/>
          <!-- statue body -->
          <ellipse cx="0" cy="170" rx="60" ry="22" fill="#999" stroke="#000" stroke-width="3"/>
          <ellipse cx="0" cy="100" rx="55" ry="38" fill="#aaa" stroke="#000" stroke-width="3"/>
          <!-- head (anpan-maguro) -->
          <circle cx="0" cy="40" r="48" fill="#bbb" stroke="#000" stroke-width="3"/>
          <ellipse cx="-12" cy="35" rx="5" ry="4" fill="#000"/>
          <ellipse cx="12" cy="35" rx="5" ry="4" fill="#000"/>
          <ellipse cx="0" cy="55" rx="9" ry="4" fill="#000"/>
          <!-- nose -->
          <circle cx="0" cy="45" r="6" fill="#888" stroke="#000" stroke-width="2"/>
          <!-- tail fin -->
          <polygon points="-60,170 -90,150 -85,180 -90,200" fill="#888" stroke="#000" stroke-width="2"/>
          <text x="0" y="220" text-anchor="middle" font-size="18" font-weight="900" fill="#3a2810">アンパンマグロ さま</text>
        </g>
        <!-- shadowed Anpanman in defeat (silhouette) -->
        <g transform="translate(420, 300)" opacity=".55">
          <circle cx="0" cy="0" r="32" fill="#3a1010" stroke="#000" stroke-width="2.5"/>
          <ellipse cx="-10" cy="-3" rx="3" ry="4" fill="#220505"/>
          <ellipse cx="10" cy="-3" rx="3" ry="4" fill="#220505"/>
          <ellipse cx="0" cy="6" rx="6" ry="3" fill="#220505"/>
          <text x="0" y="-40" text-anchor="middle" font-size="14" fill="#5a1010" font-weight="900">アンパンマン…</text>
        </g>
        <!-- bowing crowd silhouettes -->
        <g fill="#3a2210" stroke="#000" stroke-width="2">
          <circle cx="80" cy="450" r="14"/>
          <rect x="68" y="460" width="24" height="40"/>
          <circle cx="280" cy="460" r="14"/>
          <rect x="268" y="470" width="24" height="30"/>
          <circle cx="540" cy="450" r="14"/>
          <rect x="528" y="460" width="24" height="40"/>
          <circle cx="700" cy="465" r="14"/>
          <rect x="688" y="475" width="24" height="25"/>
        </g>
        <!-- title banner -->
        <rect x="80" y="40" width="640" height="50" rx="14" fill="#a02020" stroke="#ffe45c" stroke-width="4"/>
        <text x="400" y="76" text-anchor="middle" fill="#fff" font-size="26" font-weight="900" style="text-shadow:0 2px 0 #000">新[しん]ヒーロー誕生[たんじょう]！</text>
      </svg>`;
    return { svg, captionJp: "アンパンマンは たおされ、新ヒーローに なった…", captionEn: "Anpan Maguro toppled Anpanman and took the throne." };
  }

  // Brainrot King — every boss's evil ending stacked into one apocalyptic scene.
  // The kid who LOSES to the final form gets this cataclysmic image.
  function brainrot() {
    const svg = `
      <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" width="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="brEndSky" cx=".5" cy=".4" r=".7">
            <stop offset="0"  stop-color="#5a1a8a"/>
            <stop offset=".5" stop-color="#1a0a2a"/>
            <stop offset="1"  stop-color="#000"/>
          </radialGradient>
        </defs>
        <rect width="800" height="500" fill="url(#brEndSky)"/>
        <!-- Apocalyptic skyline silhouette -->
        <g fill="#000" opacity=".85">
          <rect x="0"   y="380" width="120" height="120"/>
          <rect x="120" y="350" width="80"  height="150"/>
          <rect x="200" y="400" width="60"  height="100"/>
          <rect x="260" y="370" width="100" height="130"/>
          <rect x="360" y="395" width="50"  height="105"/>
          <rect x="410" y="360" width="90"  height="140"/>
          <rect x="500" y="385" width="70"  height="115"/>
          <rect x="570" y="345" width="100" height="155"/>
          <rect x="670" y="380" width="130" height="120"/>
        </g>
        <!-- Each boss's icon raining onto the city -->
        <text x="80"  y="120" font-size="46">🐙</text>
        <text x="200" y="100" font-size="46">💩</text>
        <text x="320" y="130" font-size="46">🦷</text>
        <text x="440" y="100" font-size="46">🐑</text>
        <text x="560" y="120" font-size="46">🍦</text>
        <text x="680" y="100" font-size="46">👊</text>
        <!-- Glowing chaos core hovering in the sky -->
        <radialGradient id="brEndCore" cx=".5" cy=".5" r=".5">
          <stop offset="0"   stop-color="#fff"/>
          <stop offset=".4"  stop-color="#ffcc00"/>
          <stop offset=".75" stop-color="#ff66cc"/>
          <stop offset="1"   stop-color="#bb44ff" stop-opacity="0"/>
        </radialGradient>
        <circle cx="400" cy="240" r="120" fill="url(#brEndCore)"/>
        <circle cx="400" cy="240" r="50" fill="#ffcc00" stroke="#fff" stroke-width="3"/>
        <text x="400" y="252" text-anchor="middle" font-size="40">👁️</text>
        <!-- Tiny terrified humans -->
        <g fill="#fff" opacity=".8">
          <circle cx="120" cy="450" r="6"/><rect x="116" y="455" width="8" height="20"/>
          <circle cx="280" cy="465" r="6"/><rect x="276" y="470" width="8" height="20"/>
          <circle cx="500" cy="450" r="6"/><rect x="496" y="455" width="8" height="20"/>
          <circle cx="700" cy="465" r="6"/><rect x="696" y="470" width="8" height="20"/>
        </g>
        <!-- Title banner -->
        <rect x="60" y="40" width="680" height="56" rx="16" fill="#3a0a5a" stroke="#ffcc00" stroke-width="4"/>
        <text x="400" y="80" text-anchor="middle" fill="#ffcc00" font-size="28" font-weight="900" style="text-shadow:0 2px 0 #000">ブレインロット 帝国[ていこく] せんげん！</text>
      </svg>`;
    return { svg, captionJp: "6つの 野望[やぼう]が ぜんぶ 同時[どうじ]に 実現[じつげん]してしまった…", captionEn: "All six kaiju ambitions came true at once. The world is theirs now." };
  }

  const SCENES = { tako, unko, tral, pamp, parfait, anpan, brainrot };

  function render(bossId) {
    const fn = SCENES[bossId];
    if (!fn) return null;
    return fn();
  }
  function exists(bossId) { return !!SCENES[bossId]; }

  return { render, exists };
})();
