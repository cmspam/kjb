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

  // temee — Gobi desert at golden hour. Endless dunes, distant ger
  // (yurt) camp on the horizon, low sun, and a few wisp clouds. Camel
  // tracks in the foreground sand to suggest the boss has been here a
  // while. Aesthetic matches the old-warrior 300-year-Gobi-nomad vibe.
  function temee() {
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="temeeSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0"   stop-color="#f5b56a"/>
          <stop offset="0.55" stop-color="#e88040"/>
          <stop offset="1"    stop-color="#c0532a"/>
        </linearGradient>
        <linearGradient id="temeeSand1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#e7c08a"/>
          <stop offset="1" stop-color="#a07338"/>
        </linearGradient>
        <linearGradient id="temeeSand2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#d4a868"/>
          <stop offset="1" stop-color="#7a531e"/>
        </linearGradient>
        <radialGradient id="temeeSun" cx=".5" cy=".5" r=".5">
          <stop offset="0"    stop-color="#fff5d0"/>
          <stop offset="0.5"  stop-color="#ffe085"/>
          <stop offset="1"    stop-color="#ffe085" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="480" fill="url(#temeeSky)"/>
      <!-- Low sun + halo -->
      <circle cx="640" cy="220" r="100" fill="url(#temeeSun)"/>
      <circle cx="640" cy="220" r="38"  fill="#fff5a0" opacity="0.95"/>
      <!-- Wisp clouds -->
      <g fill="#fff" opacity="0.4">
        <ellipse cx="180" cy="110" rx="60" ry="6"/>
        <ellipse cx="220" cy="125" rx="40" ry="4"/>
        <ellipse cx="500" cy="90"  rx="55" ry="5"/>
      </g>
      <!-- Distant mountain range silhouette -->
      <path d="M 0 280 L 80 230 L 140 260 L 220 220 L 320 250 L 420 215 L 520 245 L 620 225 L 720 250 L 800 235 L 800 320 L 0 320 Z"
            fill="#7a3a1a" opacity="0.85"/>
      <!-- Distant ger (yurt) camp on the horizon -->
      <g transform="translate(310, 290)">
        <ellipse cx="0" cy="3" rx="22" ry="3" fill="#000" opacity="0.3"/>
        <path d="M -18 0 Q -18 -16 0 -22 Q 18 -16 18 0 Z" fill="#f0e0c0" stroke="#000" stroke-width="1.5"/>
        <path d="M -6 -22 L 0 -32 L 6 -22 Z" fill="#3a2010"/>
      </g>
      <g transform="translate(355, 295)">
        <ellipse cx="0" cy="3" rx="18" ry="2.5" fill="#000" opacity="0.3"/>
        <path d="M -14 0 Q -14 -13 0 -18 Q 14 -13 14 0 Z" fill="#e8d8b8" stroke="#000" stroke-width="1.5"/>
        <path d="M -5 -18 L 0 -26 L 5 -18 Z" fill="#3a2010"/>
      </g>
      <g transform="translate(395, 292)">
        <ellipse cx="0" cy="3" rx="20" ry="3" fill="#000" opacity="0.3"/>
        <path d="M -16 0 Q -16 -14 0 -20 Q 16 -14 16 0 Z" fill="#f0e0c0" stroke="#000" stroke-width="1.5"/>
        <path d="M -5 -20 L 0 -28 L 5 -20 Z" fill="#3a2010"/>
      </g>
      <!-- Wisp of smoke from middle ger -->
      <path d="M 355 268 Q 350 250 360 235 Q 350 220 358 205" stroke="#bbb" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.65"/>
      <!-- Foreground dunes — layered for depth -->
      <path d="M 0 340 Q 200 290 400 320 T 800 305 L 800 480 L 0 480 Z" fill="url(#temeeSand1)"/>
      <path d="M 0 400 Q 250 360 500 390 T 800 380 L 800 480 L 0 480 Z" fill="url(#temeeSand2)"/>
      <!-- Camel-track scuffs in the foreground sand -->
      <g fill="#7a531e" opacity="0.45">
        <ellipse cx="120" cy="430" rx="9" ry="3"/>
        <ellipse cx="160" cy="442" rx="9" ry="3"/>
        <ellipse cx="220" cy="438" rx="10" ry="3.5"/>
        <ellipse cx="280" cy="450" rx="10" ry="3.5"/>
        <ellipse cx="640" cy="445" rx="9" ry="3"/>
        <ellipse cx="685" cy="455" rx="10" ry="3.5"/>
      </g>
      <!-- A few drifting sand-dust specks -->
      <g fill="#fff" opacity="0.4">
        <circle cx="120" cy="180" r="1.4"/>
        <circle cx="240" cy="220" r="1.2"/>
        <circle cx="380" cy="195" r="1.6"/>
        <circle cx="540" cy="210" r="1.3"/>
        <circle cx="700" cy="180" r="1.4"/>
      </g>
    </svg>`;
  }

  // catcherski — Akihabara back-alley game center at night. Rows of other
  // arcade cabinets in the background, neon signs flickering, vending
  // machine glowing, scattered 100-yen coins on the floor. Russian
  // graffiti on a side wall — a callout to the hacker crew that owns
  // the cabinet. Cyberpunk pink-cyan glow with green hacker-screen
  // accents bleeding from a broken upstairs window.
  function catcherski() {
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="csSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0"   stop-color="#0a0418"/>
          <stop offset="0.5" stop-color="#1a0a3a"/>
          <stop offset="1"   stop-color="#2a0a4a"/>
        </linearGradient>
        <linearGradient id="csFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2a0a35"/>
          <stop offset="1" stop-color="#0a0418"/>
        </linearGradient>
      </defs>
      <rect width="800" height="480" fill="url(#csSky)"/>
      <!-- Back wall row of arcade cabinets (small silhouettes) -->
      <g>
        <rect x="40"  y="260" width="60"  height="160" fill="#1a0a3a" stroke="#000" stroke-width="2"/>
        <rect x="48"  y="270" width="44"  height="34"  fill="#0a3a0a"/>
        <rect x="48"  y="312" width="44"  height="50"  fill="#3a1568"/>
        <circle cx="70" cy="380" r="6" fill="#ee2233"/>
        <rect x="105" y="240" width="60" height="180" fill="#1a0a3a" stroke="#000" stroke-width="2"/>
        <rect x="113" y="252" width="44" height="34"  fill="#3a0a3a"/>
        <rect x="113" y="294" width="44" height="60"  fill="#3a1568"/>
        <circle cx="135" cy="378" r="6" fill="#44aaff"/>
        <rect x="170" y="270" width="60" height="150" fill="#1a0a3a" stroke="#000" stroke-width="2"/>
        <rect x="178" y="280" width="44" height="34"  fill="#0a3a3a"/>
        <rect x="178" y="322" width="44" height="40"  fill="#3a1568"/>
        <circle cx="200" cy="384" r="6" fill="#ffe45c"/>
        <rect x="565" y="250" width="60" height="170" fill="#1a0a3a" stroke="#000" stroke-width="2"/>
        <rect x="573" y="262" width="44" height="34"  fill="#3a3a0a"/>
        <rect x="573" y="304" width="44" height="50"  fill="#3a1568"/>
        <circle cx="595" cy="378" r="6" fill="#ee44dd"/>
        <rect x="630" y="270" width="60" height="150" fill="#1a0a3a" stroke="#000" stroke-width="2"/>
        <rect x="638" y="280" width="44" height="34"  fill="#0a3a0a"/>
        <rect x="638" y="322" width="44" height="40"  fill="#3a1568"/>
        <circle cx="660" cy="384" r="6" fill="#44ee88"/>
        <!-- Vending machine in the back-right corner -->
        <rect x="700" y="240" width="70" height="180" fill="#ee2233" stroke="#000" stroke-width="2.5"/>
        <rect x="708" y="252" width="54" height="60"  fill="#ffe45c"/>
        <rect x="708" y="316" width="54" height="60"  fill="#1a0a3a"/>
        <rect x="715" y="320" width="40" height="14"  fill="#fff" opacity="0.85"/>
        <rect x="715" y="338" width="40" height="14"  fill="#fff" opacity="0.85"/>
        <rect x="715" y="356" width="40" height="14"  fill="#fff" opacity="0.85"/>
        <circle cx="735" cy="390" r="5" fill="#ffe45c"/>
      </g>
      <!-- Floor -->
      <rect x="0" y="410" width="800" height="70" fill="url(#csFloor)"/>
      <!-- Tile lines -->
      <g stroke="#3a1568" stroke-width="1" opacity="0.6">
        <line x1="0"   y1="420" x2="800" y2="420"/>
        <line x1="0"   y1="440" x2="800" y2="440"/>
        <line x1="0"   y1="460" x2="800" y2="460"/>
      </g>
      <!-- Neon "ゲームセンター" sign on the back wall -->
      <rect x="290" y="40" width="220" height="32" rx="6" fill="#1a0030" stroke="#ff66ee" stroke-width="2"/>
      <text x="400" y="62" text-anchor="middle" font-size="20" font-weight="900" fill="#ff66ee" style="letter-spacing:3px; filter:drop-shadow(0 0 4px #ff66ee);">ゲームセンター</text>
      <!-- Smaller flickering neon sign -->
      <text x="120" y="170" font-size="14" font-weight="900" fill="#44eeff" style="filter:drop-shadow(0 0 4px #44eeff);">100円</text>
      <text x="680" y="170" font-size="14" font-weight="900" fill="#ffe45c" style="filter:drop-shadow(0 0 4px #ffe45c);">プライズ</text>
      <!-- Russian graffiti spray-painted on the back wall -->
      <g transform="translate(380, 200)" opacity="0.85">
        <text x="0" y="0" text-anchor="middle" font-size="14" font-weight="900" fill="#44ff88" style="filter:drop-shadow(0 0 3px #44ff88); transform:rotate(-4deg);">СЛАВА КРАНОФУ</text>
      </g>
      <!-- Broken upstairs window with green hacker terminal glow -->
      <rect x="55"  y="80"  width="80" height="60" fill="#0a3a0a" stroke="#000" stroke-width="2.5"/>
      <rect x="60"  y="86"  width="70" height="48" fill="#0a2a0a" stroke="#1a5a1a" stroke-width="1"/>
      <text x="65" y="100" font-size="6" fill="#0fff0f" font-family="monospace">{HACK} 0x4a2f</text>
      <text x="65" y="110" font-size="6" fill="#0fff0f" font-family="monospace">SCAN..ok</text>
      <text x="65" y="120" font-size="6" fill="#0fff0f" font-family="monospace">INJECT&gt;</text>
      <text x="65" y="130" font-size="6" fill="#0fff0f" font-family="monospace">_</text>
      <!-- Glow leaking out of the window -->
      <ellipse cx="95" cy="140" rx="60" ry="20" fill="#0fff0f" opacity="0.15"/>
      <!-- Scattered 100-yen coins on the floor -->
      <ellipse cx="120" cy="438" rx="9" ry="3" fill="#d4a532" stroke="#5a3a0a" stroke-width="1"/>
      <ellipse cx="175" cy="450" rx="9" ry="3" fill="#d4a532" stroke="#5a3a0a" stroke-width="1"/>
      <ellipse cx="635" cy="442" rx="9" ry="3" fill="#d4a532" stroke="#5a3a0a" stroke-width="1"/>
      <ellipse cx="685" cy="455" rx="9" ry="3" fill="#d4a532" stroke="#5a3a0a" stroke-width="1"/>
      <!-- Floating cigarette-smoke wisps for atmosphere -->
      <path d="M 100 300 Q 110 280 100 260 Q 90 240 100 220" stroke="#fff" stroke-width="2" fill="none" opacity="0.18"/>
      <path d="M 700 310 Q 710 290 700 270 Q 690 250 700 230" stroke="#fff" stroke-width="2" fill="none" opacity="0.15"/>
    </svg>`;
  }

  // brainrot — deep-space black-hole arena. A swirling galaxy spirals
  // around a central event horizon offset to the upper-right of frame;
  // stars and distant moons are visibly bending toward it. The lion-king
  // boss SVG layers ON TOP of this so the boss reads as standing in front
  // of his own black hole, with the galaxy as backdrop.
  function brainrot() {
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">
      <defs>
        <radialGradient id="brSky" cx=".5" cy=".5" r=".9">
          <stop offset="0"   stop-color="#3a0a5a"/>
          <stop offset="0.4" stop-color="#180630"/>
          <stop offset="1"   stop-color="#000"/>
        </radialGradient>
        <radialGradient id="brGalaxy" cx=".5" cy=".5" r=".5">
          <stop offset="0"   stop-color="#fff5d0" stop-opacity="0.55"/>
          <stop offset="0.35" stop-color="#ff9844" stop-opacity="0.35"/>
          <stop offset="0.7" stop-color="#6a2aaa" stop-opacity="0.2"/>
          <stop offset="1"   stop-color="#180630" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="brAccretion" cx=".5" cy=".5" r=".5">
          <stop offset="0"   stop-color="#ffe45c"/>
          <stop offset="0.5" stop-color="#ff7733"/>
          <stop offset="1"   stop-color="#ff3366" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="480" fill="url(#brSky)"/>
      ${stars(120, 800, 480, "#fff")}
      <!-- Distant nebula clouds floating in deep space -->
      <ellipse cx="120" cy="120" rx="90" ry="40" fill="#aa44cc" opacity="0.18"/>
      <ellipse cx="700" cy="80"  rx="110" ry="50" fill="#4488ff" opacity="0.15"/>
      <ellipse cx="660" cy="380" rx="90" ry="40" fill="#ff5599" opacity="0.18"/>
      <!-- A few drifting moons being pulled toward the center -->
      <circle cx="80"  cy="220" r="9"  fill="#c8b8a0" opacity="0.85"/>
      <circle cx="78"  cy="217" r="2.5" fill="#7a6a55" opacity="0.6"/>
      <circle cx="720" cy="340" r="11" fill="#a8c8e8" opacity="0.85"/>
      <circle cx="722" cy="338" r="3"  fill="#5a7898" opacity="0.6"/>
      <circle cx="60"  cy="420" r="7"  fill="#d8c898" opacity="0.85"/>
      <!-- Spiral arms of the galaxy bending toward the center black hole -->
      <g fill="none" stroke="#ff8844" stroke-width="1.5" opacity="0.4">
        <path d="M 60  100 Q 220 180 360 240"/>
        <path d="M 740 110 Q 580 200 440 240"/>
        <path d="M 90  400 Q 220 320 360 240"/>
        <path d="M 720 400 Q 580 320 440 240"/>
      </g>
      <g fill="none" stroke="#aa66ff" stroke-width="1" opacity="0.35">
        <path d="M 30  240 Q 180 220 360 240"/>
        <path d="M 770 240 Q 620 260 440 240"/>
      </g>
      <!-- Central galaxy / black-hole halo (acts as a backdrop circle so
           the lion appears to stand in front of it) -->
      <ellipse cx="400" cy="240" rx="280" ry="180" fill="url(#brGalaxy)" opacity="0.85"/>
      <!-- Distant accretion-disk ring (small, in case the boss SVG is
           rendered slightly off-center; gives a glowing core regardless) -->
      <ellipse cx="400" cy="245" rx="160" ry="48" fill="none" stroke="url(#brAccretion)" stroke-width="3" opacity="0.6"/>
    </svg>`;
  }

  const SCENES = { tako, unko, tral, pamp, parfait, anpan, temee, catcherski, brainrot };

  function exists(bossId) { return !!SCENES[bossId]; }
  function render(bossId) {
    const fn = SCENES[bossId];
    return fn ? fn() : "";
  }

  return { exists, render };
})();
