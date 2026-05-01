// Per-boss stage backgrounds — purely decorative SVG behind the boss SVG so
// each fight has a sense of *place* instead of the same purple void.
// Rendered into .stage-bg behind the boss .stage-svg in buildHeader.
window.Stages = (() => {

  // Helper for star fields and decorative bits
  function stars(n, w, h, color = "#fff") {
    let out = "";
    for (let i = 0; i < n; i++) {
      const x = (Math.random() * w) | 0;
      const y = (Math.random() * h) | 0;
      const r = (Math.random() * 1.4 + 0.6).toFixed(1);
      out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${(Math.random() * 0.6 + 0.3).toFixed(2)}"/>`;
    }
    return out;
  }

  // tako — night-time takoyaki street, paper lanterns, food stall.
  function tako() {
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="takoSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#1a0a3a"/>
          <stop offset="0.5" stop-color="#5a2070"/>
          <stop offset="1" stop-color="#8a3050"/>
        </linearGradient>
      </defs>
      <rect width="800" height="480" fill="url(#takoSky)"/>
      ${stars(40, 800, 280, "#ffe8a0")}
      <!-- Distant city silhouette -->
      <g fill="#0a0418" opacity="0.9">
        <rect x="0"   y="320" width="80"  height="160"/>
        <rect x="80"  y="280" width="60"  height="200"/>
        <rect x="140" y="340" width="50"  height="140"/>
        <rect x="190" y="300" width="80"  height="180"/>
        <rect x="270" y="340" width="40"  height="140"/>
        <rect x="500" y="320" width="60"  height="160"/>
        <rect x="560" y="290" width="80"  height="190"/>
        <rect x="640" y="330" width="50"  height="150"/>
        <rect x="690" y="300" width="110" height="180"/>
      </g>
      <!-- Hanging paper lanterns -->
      <g>
        <line x1="120" y1="60" x2="120" y2="100" stroke="#3a1a1a" stroke-width="1"/>
        <ellipse cx="120" cy="115" rx="18" ry="22" fill="#ee3344" stroke="#000" stroke-width="2"/>
        <text x="120" y="122" text-anchor="middle" font-size="16" fill="#fff" font-weight="900">蛸</text>
        <line x1="660" y1="60" x2="660" y2="90" stroke="#3a1a1a" stroke-width="1"/>
        <ellipse cx="660" cy="105" rx="18" ry="22" fill="#ee3344" stroke="#000" stroke-width="2"/>
        <text x="660" y="112" text-anchor="middle" font-size="16" fill="#fff" font-weight="900">焼</text>
      </g>
      <!-- Ground / street -->
      <rect x="0" y="420" width="800" height="60" fill="#2a1418"/>
      <rect x="0" y="420" width="800" height="3" fill="#5a2030"/>
      <!-- Steam wisps -->
      <g fill="#fff" opacity="0.18">
        <ellipse cx="200" cy="380" rx="40" ry="14"/>
        <ellipse cx="600" cy="370" rx="50" ry="12"/>
      </g>
    </svg>`;
  }

  // unko — sewer with green slime, brick walls, drainpipes.
  function unko() {
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="unkoBg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#1a1208"/>
          <stop offset="1" stop-color="#3a2814"/>
        </linearGradient>
        <pattern id="bricks" width="60" height="30" patternUnits="userSpaceOnUse">
          <rect width="60" height="30" fill="#3a2418"/>
          <rect x="0" y="0" width="60" height="2" fill="#1a0a04"/>
          <rect x="0" y="0" width="2" height="30" fill="#1a0a04"/>
          <rect x="30" y="14" width="2" height="16" fill="#1a0a04"/>
        </pattern>
      </defs>
      <rect width="800" height="480" fill="url(#unkoBg)"/>
      <rect width="800" height="320" fill="url(#bricks)" opacity="0.8"/>
      <!-- Drainpipes -->
      <g stroke="#5a3018" stroke-width="3" fill="#3a1c10">
        <rect x="60"  y="0" width="40" height="320"/>
        <circle cx="80" cy="320" r="22" fill="#1a0a04" stroke="#5a3018"/>
        <rect x="700" y="0" width="40" height="320"/>
        <circle cx="720" cy="320" r="22" fill="#1a0a04" stroke="#5a3018"/>
      </g>
      <!-- Green slime ground -->
      <rect x="0" y="380" width="800" height="100" fill="#3a8a1a"/>
      <path d="M 0 380 Q 100 360 200 380 T 400 380 T 600 380 T 800 380 V 480 H 0 Z" fill="#5aaa2a"/>
      <!-- Slime drips -->
      <g fill="#5aaa2a">
        <ellipse cx="80"  cy="340" rx="6" ry="20"/>
        <ellipse cx="720" cy="340" rx="6" ry="20"/>
      </g>
      <!-- Faint poop emojis decorating -->
      <text x="160" y="420" font-size="24" opacity="0.6">💩</text>
      <text x="600" y="430" font-size="22" opacity="0.6">💩</text>
    </svg>`;
  }

  // tral — Italian piazza at sunset, gondolas / fountain.
  function tral() {
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="tralSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0"   stop-color="#ff8060"/>
          <stop offset="0.5" stop-color="#ffaa55"/>
          <stop offset="1"   stop-color="#3a1a4a"/>
        </linearGradient>
      </defs>
      <rect width="800" height="480" fill="url(#tralSky)"/>
      <!-- Sun -->
      <circle cx="400" cy="220" r="60" fill="#fff5d0" opacity="0.9"/>
      <circle cx="400" cy="220" r="80" fill="#ffd56a" opacity="0.45"/>
      <!-- Italian buildings silhouette -->
      <g fill="#3a1a4a">
        <rect x="0"   y="280" width="120" height="200"/>
        <rect x="20"  y="260" width="80"  height="20"/>
        <rect x="120" y="260" width="100" height="220"/>
        <rect x="220" y="240" width="120" height="240"/>
        <polygon points="230,240 280,200 330,240"/>
        <rect x="340" y="270" width="80"  height="210"/>
        <rect x="500" y="250" width="100" height="230"/>
        <polygon points="500,250 550,210 600,250"/>
        <rect x="600" y="280" width="200" height="200"/>
      </g>
      <!-- Window dots -->
      <g fill="#ffe066">
        <rect x="40"  y="320" width="8" height="14"/>
        <rect x="60"  y="320" width="8" height="14"/>
        <rect x="160" y="320" width="8" height="14"/>
        <rect x="270" y="290" width="8" height="14"/>
        <rect x="290" y="290" width="8" height="14"/>
        <rect x="540" y="300" width="8" height="14"/>
        <rect x="640" y="320" width="8" height="14"/>
      </g>
      <!-- Sea/water -->
      <rect x="0" y="380" width="800" height="100" fill="#1a4a8a" opacity="0.8"/>
      <g stroke="#fff" stroke-width="1" opacity="0.5">
        <line x1="0"   y1="400" x2="800" y2="400"/>
        <line x1="0"   y1="430" x2="800" y2="430"/>
      </g>
    </svg>`;
  }

  // pamp — kid's bedroom at night, stuffed animals, moon through window.
  function pamp() {
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="pampWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#3a1a4a"/>
          <stop offset="1" stop-color="#5a3a6a"/>
        </linearGradient>
      </defs>
      <rect width="800" height="480" fill="url(#pampWall)"/>
      <!-- Wall pattern: subtle hearts -->
      <g fill="#4a2a5a" opacity="0.6">
        <text x="100" y="120" font-size="24">♡</text>
        <text x="280" y="100" font-size="20">♡</text>
        <text x="500" y="130" font-size="22">♡</text>
        <text x="680" y="110" font-size="20">♡</text>
      </g>
      <!-- Window with moon -->
      <g>
        <rect x="540" y="60" width="180" height="180" fill="#0a0a3a" stroke="#8a6a1a" stroke-width="6"/>
        <line x1="630" y1="60" x2="630" y2="240" stroke="#8a6a1a" stroke-width="3"/>
        <line x1="540" y1="150" x2="720" y2="150" stroke="#8a6a1a" stroke-width="3"/>
        <circle cx="600" cy="120" r="28" fill="#fff5e0"/>
        <circle cx="592" cy="112" r="6" fill="#dac8a0"/>
        ${stars(15, 800, 240, "#fff5d0")}
      </g>
      <!-- Floor / wood -->
      <rect x="0" y="380" width="800" height="100" fill="#5a3a18"/>
      <g stroke="#3a1a08" stroke-width="2">
        <line x1="0" y1="380" x2="800" y2="380"/>
        <line x1="0" y1="420" x2="800" y2="420"/>
        <line x1="0" y1="460" x2="800" y2="460"/>
      </g>
      <!-- Stuffed animals on shelf -->
      <text x="60"  y="380" font-size="34">🧸</text>
      <text x="120" y="380" font-size="30">🐰</text>
      <text x="730" y="380" font-size="30">🦄</text>
    </svg>`;
  }

  // parfait — parfait shop / sweets factory, cones, sprinkles.
  function parfait() {
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="parfaitWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#ffe0e8"/>
          <stop offset="1" stop-color="#ffaad8"/>
        </linearGradient>
      </defs>
      <rect width="800" height="480" fill="url(#parfaitWall)"/>
      <!-- Polka dots -->
      <g fill="#ff66aa" opacity="0.4">
        <circle cx="100" cy="80"  r="14"/>
        <circle cx="280" cy="120" r="10"/>
        <circle cx="500" cy="80"  r="14"/>
        <circle cx="700" cy="100" r="12"/>
        <circle cx="180" cy="200" r="10"/>
        <circle cx="640" cy="220" r="12"/>
      </g>
      <!-- Sprinkles raining -->
      <g>
        <rect x="120" y="40" width="3" height="14" rx="1" fill="#ee5588" transform="rotate(20 121 47)"/>
        <rect x="230" y="60" width="3" height="14" rx="1" fill="#44aaee" transform="rotate(-15 231 67)"/>
        <rect x="340" y="30" width="3" height="14" rx="1" fill="#ffcc44" transform="rotate(30 341 37)"/>
        <rect x="450" y="50" width="3" height="14" rx="1" fill="#ff77aa" transform="rotate(-20 451 57)"/>
        <rect x="560" y="40" width="3" height="14" rx="1" fill="#88ee44" transform="rotate(15 561 47)"/>
        <rect x="660" y="60" width="3" height="14" rx="1" fill="#aa66ff" transform="rotate(-25 661 67)"/>
      </g>
      <!-- Counter / floor -->
      <rect x="0" y="380" width="800" height="100" fill="#ffd0e8"/>
      <rect x="0" y="378" width="800" height="6" fill="#ee88bb"/>
      <!-- Parfait glasses on counter -->
      <g>
        <text x="60"  y="430" font-size="40">🍦</text>
        <text x="700" y="430" font-size="40">🍨</text>
        <text x="120" y="425" font-size="28">🍓</text>
        <text x="650" y="425" font-size="28">🍒</text>
      </g>
    </svg>`;
  }

  // anpan — bakery / sushi street. Mash of bread + sushi shop signs.
  function anpan() {
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="anpanSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#fff5b0"/>
          <stop offset="1" stop-color="#ffaa44"/>
        </linearGradient>
      </defs>
      <rect width="800" height="480" fill="url(#anpanSky)"/>
      <!-- Sun -->
      <circle cx="660" cy="100" r="50" fill="#fff" opacity="0.85"/>
      <!-- Far buildings -->
      <g fill="#aa5520" opacity="0.85">
        <rect x="0"   y="220" width="200" height="200"/>
        <rect x="200" y="240" width="180" height="180"/>
        <rect x="380" y="200" width="220" height="220"/>
        <rect x="600" y="240" width="200" height="180"/>
      </g>
      <!-- Bakery / sushi sign -->
      <g>
        <rect x="280" y="160" width="240" height="50" rx="6" fill="#ee2233" stroke="#000" stroke-width="3"/>
        <text x="400" y="195" text-anchor="middle" font-size="26" fill="#fff" font-weight="900">パン × 寿司</text>
      </g>
      <!-- Awning stripes -->
      <g fill="#ee2233" stroke="#000" stroke-width="1">
        <polygon points="280,210 320,210 300,235"/>
        <polygon points="320,210 360,210 340,235"/>
        <polygon points="360,210 400,210 380,235"/>
        <polygon points="400,210 440,210 420,235"/>
        <polygon points="440,210 480,210 460,235"/>
        <polygon points="480,210 520,210 500,235"/>
      </g>
      <!-- Foreground: street -->
      <rect x="0" y="400" width="800" height="80" fill="#5a3a1a"/>
      <rect x="0" y="398" width="800" height="4" fill="#3a2010"/>
      <!-- Sushi conveyor decorations -->
      <text x="80"  y="450" font-size="30">🍣</text>
      <text x="700" y="450" font-size="30">🥖</text>
      <text x="200" y="455" font-size="22">🍣</text>
      <text x="580" y="455" font-size="22">🍣</text>
    </svg>`;
  }

  // brainrot — chaotic interdimensional rift. Already alluded to in the boss
  // SVG itself, but we add a more dramatic backdrop here.
  function brainrot() {
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
      <defs>
        <radialGradient id="brSky" cx=".5" cy=".4" r=".8">
          <stop offset="0"   stop-color="#7a2aaa"/>
          <stop offset="0.5" stop-color="#2a0a4a"/>
          <stop offset="1"   stop-color="#000"/>
        </radialGradient>
      </defs>
      <rect width="800" height="480" fill="url(#brSky)"/>
      ${stars(80, 800, 480, "#fff")}
      <!-- Rift cracks -->
      <g stroke="#ff66cc" stroke-width="2" fill="none" opacity="0.7">
        <path d="M 100 60 L 180 140 L 140 200 L 220 280"/>
        <path d="M 700 80 L 620 160 L 660 240 L 580 320"/>
      </g>
      <g stroke="#ffcc00" stroke-width="1.5" fill="none" opacity="0.5">
        <path d="M 50 380 L 130 320 L 90 260"/>
        <path d="M 750 380 L 670 320 L 710 260"/>
      </g>
    </svg>`;
  }

  const SCENES = { tako, unko, tral, pamp, parfait, anpan, brainrot };

  function exists(bossId) { return !!SCENES[bossId]; }
  function render(bossId) {
    const fn = SCENES[bossId];
    return fn ? fn() : "";
  }

  return { exists, render };
})();
