/* ============================================================
   art.js  —  hand-built SVG characters
   Every function returns an <svg> string. viewBox is 0 0 120 120,
   character roughly centered, feet near y=116.
   "facing" is handled by CSS scaleX on the actor wrapper, so all
   art is drawn facing RIGHT.
   ============================================================ */
const ART = {};

/* ---- Among Us CREWMATE (your basic trooper) ----
   Classic bean body, big visor, backpack, two stubby legs. */
ART.crewmate = function (color, visor) {
  color = color || "#3fa9f5";
  visor = visor || "#b9e7ff";
  const dark = shade(color, -38);
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <!-- legs -->
    <rect x="44" y="92" width="14" height="24" rx="6" fill="${dark}"/>
    <rect x="64" y="92" width="14" height="24" rx="6" fill="${dark}"/>
    <!-- backpack -->
    <rect x="22" y="46" width="22" height="42" rx="11" fill="${dark}"/>
    <!-- body -->
    <path d="M40 40
             Q40 20 62 20
             Q86 20 86 44
             L86 96
             Q86 104 78 104
             L46 104
             Q40 104 40 96 Z" fill="${color}" stroke="${dark}" stroke-width="3"/>
    <!-- body shine -->
    <path d="M48 30 Q44 40 46 70" stroke="#ffffff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".35"/>
    <!-- visor -->
    <path d="M58 38
             Q58 30 70 30
             Q84 30 84 42
             Q84 54 70 54
             Q58 54 58 46 Z" fill="${visor}" stroke="${dark}" stroke-width="2.5"/>
    <ellipse cx="66" cy="38" rx="7" ry="4" fill="#ffffff" opacity=".8"/>
  </svg>`;
};

/* ---- IMPOSTOR (enemy) — red crewmate, sharp toothy mouth + evil eye ---- */
ART.impostor = function () {
  const color = "#c8102e", dark = "#7a0a1c", visor = "#ffd0d0";
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <rect x="44" y="92" width="14" height="24" rx="6" fill="${dark}"/>
    <rect x="64" y="92" width="14" height="24" rx="6" fill="${dark}"/>
    <rect x="22" y="46" width="22" height="42" rx="11" fill="${dark}"/>
    <path d="M40 40 Q40 20 62 20 Q86 20 86 44 L86 96 Q86 104 78 104 L46 104 Q40 104 40 96 Z"
          fill="${color}" stroke="${dark}" stroke-width="3"/>
    <path d="M48 30 Q44 40 46 70" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".25"/>
    <!-- visor -->
    <path d="M58 36 Q58 28 70 28 Q84 28 84 40 Q84 52 70 52 Q58 52 58 44 Z"
          fill="${visor}" stroke="${dark}" stroke-width="2.5"/>
    <!-- angry brow -->
    <path d="M59 33 L82 39" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="72" cy="42" r="3" fill="#7a0a1c"/>
    <!-- toothy split mouth -->
    <path d="M58 60 Q70 56 84 62 L80 74 L76 64 L72 76 L68 64 L64 76 L60 66 Z"
          fill="#2a0008" stroke="#000" stroke-width="1"/>
    <path d="M60 62 L62 70 M66 63 L67 73 M73 63 L72 73 M79 63 L78 71"
          stroke="#fff" stroke-width="2"/>
  </svg>`;
};

/* ---- TRALALERO TRALALA — blue shark on three sneaker'd legs ---- */
ART.tralalero = function () {
  const body = "#5aa9e6", belly = "#dff1ff", dark = "#2e6da4";
  const shoe = "#1e3a8a", sole = "#f5f5f5";
  function leg(x){return `
    <rect x="${x-4}" y="86" width="8" height="20" fill="#9bbbd6"/>
    <g>
      <path d="M${x-12} 106 Q${x-12} 100 ${x-4} 100 L${x+10} 100 Q${x+16} 100 ${x+16} 108 L${x+16} 112 L${x-12} 112 Z" fill="${shoe}" stroke="#0c1f52" stroke-width="2"/>
      <rect x="${x-13}" y="111" width="31" height="5" rx="2" fill="${sole}"/>
      <path d="M${x-6} 102 L${x+8} 105" stroke="#fff" stroke-width="2"/>
      <path d="M${x+13} 101 q4 4 0 9" stroke="#fff" stroke-width="2.5" fill="none"/>
    </g>`;}
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    ${leg(36)}${leg(60)}${leg(84)}
    <!-- tail -->
    <path d="M16 56 L2 40 L8 60 L2 78 Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
    <!-- body -->
    <path d="M14 60 Q40 34 84 44 Q110 50 112 60 Q104 78 70 80 Q34 82 14 60 Z"
          fill="${body}" stroke="${dark}" stroke-width="3"/>
    <!-- belly -->
    <path d="M30 72 Q60 84 96 70 Q70 80 30 72 Z" fill="${belly}"/>
    <!-- dorsal fin -->
    <path d="M52 42 L60 22 L74 44 Z" fill="${dark}"/>
    <!-- side fin -->
    <path d="M58 74 L66 92 L78 74 Z" fill="${dark}"/>
    <!-- gills -->
    <path d="M86 52 q-3 8 0 16 M92 52 q-3 8 0 16 M98 53 q-3 7 0 14" stroke="${dark}" stroke-width="2" fill="none"/>
    <!-- mouth + teeth -->
    <path d="M96 64 Q112 60 116 66 Q112 72 96 70 Z" fill="#0c2a4a"/>
    <path d="M98 64 l2 5 l3 -5 l2 5 l3 -5 l2 5 l3 -5" stroke="#fff" stroke-width="0" fill="#fff"/>
    <polygon points="98,64 100,69 102,64" fill="#fff"/>
    <polygon points="103,64 105,69 107,64" fill="#fff"/>
    <polygon points="108,64 110,68 112,64" fill="#fff"/>
    <!-- eye -->
    <circle cx="92" cy="54" r="6" fill="#fff" stroke="${dark}" stroke-width="1.5"/>
    <circle cx="93" cy="54" r="3" fill="#08203a"/>
  </svg>`;
};

/* ---- BOMBARDIRO CROCODILO — croc head fused to a bomber plane (TANK) ---- */
ART.bombardiro = function () {
  const metal = "#6b7a52", dark = "#3f4a30", croc = "#5f7d3a", crocD = "#3a4f22";
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <!-- wheels -->
    <circle cx="42" cy="104" r="9" fill="#222" stroke="#000" stroke-width="2"/>
    <circle cx="42" cy="104" r="3" fill="#888"/>
    <circle cx="82" cy="104" r="9" fill="#222" stroke="#000" stroke-width="2"/>
    <circle cx="82" cy="104" r="3" fill="#888"/>
    <!-- tail fin -->
    <path d="M8 56 L4 30 L22 54 Z" fill="${dark}"/>
    <!-- wing -->
    <path d="M40 70 L24 96 L62 78 Z" fill="${dark}"/>
    <!-- fuselage -->
    <path d="M14 64 Q22 50 60 50 L92 52 Q104 56 104 64 Q104 76 88 80 L34 80 Q16 78 14 64 Z"
          fill="${metal}" stroke="${dark}" stroke-width="3"/>
    <!-- rivets / windows -->
    <circle cx="46" cy="64" r="4" fill="#bfe3ff" stroke="${dark}" stroke-width="1.5"/>
    <circle cx="60" cy="64" r="4" fill="#bfe3ff" stroke="${dark}" stroke-width="1.5"/>
    <!-- bombs underneath -->
    <ellipse cx="50" cy="86" rx="9" ry="4" fill="#2b2b2b"/>
    <ellipse cx="70" cy="86" rx="9" ry="4" fill="#2b2b2b"/>
    <!-- propeller -->
    <line x1="104" y1="46" x2="104" y2="82" stroke="#222" stroke-width="4"/>
    <circle cx="104" cy="64" r="4" fill="#444"/>
    <!-- croc head out the front -->
    <path d="M84 52 Q98 44 112 50 Q120 53 116 60 L96 60 Q86 60 84 56 Z"
          fill="${croc}" stroke="${crocD}" stroke-width="2.5"/>
    <!-- lower jaw -->
    <path d="M96 62 Q108 64 118 62 Q112 72 98 70 Q90 68 96 62 Z"
          fill="${croc}" stroke="${crocD}" stroke-width="2.5"/>
    <!-- teeth -->
    <path d="M98 60 l3 4 l3 -4 l3 4 l3 -4 l3 4" fill="#fff"/>
    <polygon points="98,61 100,65 103,61" fill="#fff"/>
    <polygon points="104,61 106,65 109,61" fill="#fff"/>
    <!-- eye -->
    <circle cx="92" cy="49" r="5" fill="#cfe89a" stroke="${crocD}" stroke-width="1.5"/>
    <circle cx="93" cy="49" r="2.4" fill="#1b2a0a"/>
    <!-- nostril -->
    <circle cx="110" cy="52" r="1.6" fill="${crocD}"/>
  </svg>`;
};

/* ---- TUNG TUNG TUNG SAHUR — angry wooden log/club with a tiny bat (HITTER) ---- */
ART.tung = function () {
  const wood = "#a9743f", woodD = "#6e441f", woodL = "#c79a63";
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <!-- feet -->
    <ellipse cx="50" cy="113" rx="9" ry="4" fill="${woodD}"/>
    <ellipse cx="70" cy="113" rx="9" ry="4" fill="${woodD}"/>
    <rect x="46" y="96" width="9" height="16" rx="3" fill="${woodD}"/>
    <rect x="66" y="96" width="9" height="16" rx="3" fill="${woodD}"/>
    <!-- body: tall rounded log -->
    <path d="M42 30 Q42 14 60 14 Q78 14 78 30 L78 96 Q78 100 70 100 L50 100 Q42 100 42 96 Z"
          fill="${wood}" stroke="${woodD}" stroke-width="3"/>
    <!-- wood grain -->
    <path d="M50 26 Q54 60 50 92 M68 26 Q64 60 68 92" stroke="${woodD}" stroke-width="2" fill="none" opacity=".5"/>
    <path d="M46 22 Q60 18 74 22" stroke="${woodL}" stroke-width="3" fill="none" opacity=".6"/>
    <!-- arm holding bat -->
    <rect x="76" y="48" width="8" height="26" rx="4" fill="${wood}" stroke="${woodD}" stroke-width="2" transform="rotate(20 80 60)"/>
    <!-- the little bat -->
    <g transform="rotate(28 96 44)">
      <rect x="92" y="20" width="9" height="34" rx="4.5" fill="${woodL}" stroke="${woodD}" stroke-width="2"/>
      <rect x="93" y="48" width="7" height="8" rx="2" fill="${woodD}"/>
    </g>
    <!-- left arm -->
    <rect x="34" y="50" width="8" height="24" rx="4" fill="${wood}" stroke="${woodD}" stroke-width="2" transform="rotate(-12 38 60)"/>
    <!-- angry eyebrows -->
    <path d="M48 40 L60 46 M72 40 L60 46" stroke="${woodD}" stroke-width="4" stroke-linecap="round"/>
    <!-- eyes -->
    <circle cx="52" cy="50" r="5" fill="#fff" stroke="${woodD}" stroke-width="1.5"/>
    <circle cx="68" cy="50" r="5" fill="#fff" stroke="${woodD}" stroke-width="1.5"/>
    <circle cx="53" cy="51" r="2.4" fill="#000"/>
    <circle cx="69" cy="51" r="2.4" fill="#000"/>
    <!-- shouting mouth -->
    <ellipse cx="60" cy="66" rx="8" ry="9" fill="#3a1c0a"/>
    <ellipse cx="60" cy="70" rx="4" ry="4" fill="#7a2e12"/>
  </svg>`;
};

/* ---- Enemy brainrot minion: a small impostor-tinted Tung (variety) ---- */
ART.sahurEnemy = function () {
  const wood = "#7a4b8a", woodD = "#4a2658", woodL = "#a06fb0";
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="52" cy="113" rx="8" ry="4" fill="${woodD}"/>
    <ellipse cx="68" cy="113" rx="8" ry="4" fill="${woodD}"/>
    <rect x="48" y="98" width="8" height="14" rx="3" fill="${woodD}"/>
    <rect x="64" y="98" width="8" height="14" rx="3" fill="${woodD}"/>
    <path d="M44 36 Q44 22 60 22 Q76 22 76 36 L76 98 Q76 102 68 102 L52 102 Q44 102 44 98 Z"
          fill="${wood}" stroke="${woodD}" stroke-width="3"/>
    <path d="M52 32 Q56 64 52 94 M68 32 Q64 64 68 94" stroke="${woodD}" stroke-width="2" fill="none" opacity=".5"/>
    <path d="M50 46 L60 52 M70 46 L60 52" stroke="${woodD}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="53" cy="56" r="5" fill="#ffd0ff" stroke="${woodD}" stroke-width="1.5"/>
    <circle cx="67" cy="56" r="5" fill="#ffd0ff" stroke="${woodD}" stroke-width="1.5"/>
    <circle cx="53" cy="57" r="2.3" fill="#3a003a"/>
    <circle cx="67" cy="57" r="2.3" fill="#3a003a"/>
    <path d="M52 72 Q60 80 68 72" stroke="${woodD}" stroke-width="3" fill="none"/>
  </svg>`;
};

/* ---- Bases ---- */
ART.playerBase = function () {
  return `
  <svg viewBox="0 0 140 200" xmlns="http://www.w3.org/2000/svg">
    <!-- spaceship / crew ship -->
    <ellipse cx="70" cy="180" rx="64" ry="18" fill="#1a2740"/>
    <path d="M30 60 Q30 20 70 20 Q110 20 110 60 L110 150 Q110 178 70 178 Q30 178 30 150 Z"
          fill="#3a5a8a" stroke="#1a2740" stroke-width="5"/>
    <path d="M44 40 Q40 80 44 150" stroke="#fff" stroke-width="6" opacity=".25" fill="none" stroke-linecap="round"/>
    <!-- windows -->
    <circle cx="70" cy="60" r="16" fill="#bfe7ff" stroke="#1a2740" stroke-width="4"/>
    <circle cx="64" cy="55" r="5" fill="#fff" opacity=".8"/>
    <rect x="52" y="92" width="36" height="22" rx="6" fill="#bfe7ff" stroke="#1a2740" stroke-width="3"/>
    <rect x="52" y="124" width="36" height="22" rx="6" fill="#bfe7ff" stroke="#1a2740" stroke-width="3"/>
    <!-- fins -->
    <path d="M30 120 L8 170 L30 160 Z" fill="#2a4060"/>
    <path d="M110 120 L132 170 L110 160 Z" fill="#2a4060"/>
    <!-- flag -->
    <rect x="68" y="-4" width="4" height="26" fill="#888"/>
    <path d="M72 0 L96 8 L72 16 Z" fill="#4fe3c1"/>
  </svg>`;
};

ART.enemyBase = function () {
  return `
  <svg viewBox="0 0 140 200" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="70" cy="182" rx="64" ry="18" fill="#2a0a14"/>
    <!-- jagged impostor fortress -->
    <path d="M24 70 L24 150 Q24 178 70 178 Q116 178 116 150 L116 70
             L104 50 L92 70 L80 46 L70 70 L60 46 L48 70 L36 50 Z"
          fill="#7a0a1c" stroke="#3a0510" stroke-width="5"/>
    <path d="M40 80 Q36 120 40 160" stroke="#000" stroke-width="6" opacity=".25" fill="none"/>
    <!-- big impostor visor window -->
    <path d="M52 96 Q52 84 70 84 Q92 84 92 100 Q92 118 70 118 Q52 118 52 106 Z"
          fill="#ffd0d0" stroke="#3a0510" stroke-width="4"/>
    <circle cx="78" cy="100" r="4" fill="#7a0a1c"/>
    <path d="M54 92 L90 98" stroke="#3a0510" stroke-width="4" stroke-linecap="round"/>
    <!-- toothy gate -->
    <path d="M48 140 Q70 134 92 142 L88 160 L82 146 L76 162 L70 146 L64 162 L58 146 L52 158 Z"
          fill="#2a0008"/>
    <!-- skull flag -->
    <rect x="68" y="22" width="4" height="30" fill="#555"/>
    <path d="M72 26 L100 34 L72 42 Z" fill="#ff3b5c"/>
  </svg>`;
};

/* ---- CAPPUCCINO ASSASSINO (EX) — ninja coffee cup with twin daggers ---- */
ART.cappuccino = function () {
  const cup = "#f3e9d6", cupD = "#b89b6e", coffee = "#5a3a22", foam = "#fff7ea";
  const cloak = "#7a4a2a", steel = "#cfd6e0", steelD = "#7d8694";
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <!-- legs -->
    <rect x="48" y="92" width="8" height="22" rx="4" fill="${cupD}"/>
    <rect x="64" y="92" width="8" height="22" rx="4" fill="${cupD}"/>
    <ellipse cx="52" cy="115" rx="8" ry="3" fill="#3a2a1a"/>
    <ellipse cx="68" cy="115" rx="8" ry="3" fill="#3a2a1a"/>
    <!-- cloak behind -->
    <path d="M34 60 Q30 96 44 100 L76 100 Q90 96 86 60 Z" fill="${cloak}" opacity=".55"/>
    <!-- saucer -->
    <ellipse cx="60" cy="96" rx="30" ry="7" fill="${cupD}"/>
    <!-- cup body (trapezoid) -->
    <path d="M38 52 L82 52 L74 94 L46 94 Z" fill="${cup}" stroke="${cupD}" stroke-width="3"/>
    <path d="M44 60 Q42 76 47 90" stroke="#fff" stroke-width="4" opacity=".5" fill="none" stroke-linecap="round"/>
    <!-- handle -->
    <path d="M82 60 q16 4 10 22 q-4 8 -12 6" fill="none" stroke="${cupD}" stroke-width="6"/>
    <!-- foam dome (head) -->
    <path d="M36 52 Q36 30 60 30 Q84 30 84 52 Q60 60 36 52 Z" fill="${foam}" stroke="${cupD}" stroke-width="2.5"/>
    <ellipse cx="50" cy="40" rx="8" ry="5" fill="#fff"/>
    <!-- coffee rim peeking -->
    <path d="M40 51 Q60 57 80 51" stroke="${coffee}" stroke-width="3" fill="none" opacity=".5"/>
    <!-- ninja eye band -->
    <rect x="36" y="42" width="48" height="9" rx="4" fill="#2a1a10"/>
    <path d="M52 47 l8 -2 M68 47 l-8 -2" stroke="#fff" stroke-width="0"/>
    <ellipse cx="54" cy="46.5" rx="4" ry="2.6" fill="#7fe3ff"/>
    <ellipse cx="68" cy="46.5" rx="4" ry="2.6" fill="#7fe3ff"/>
    <!-- crossed daggers in front -->
    <g stroke="${steelD}" stroke-width="1.5">
      <polygon points="50,96 58,64 62,66 54,98" fill="${steel}"/>
      <polygon points="70,96 62,64 58,66 66,98" fill="${steel}"/>
    </g>
    <rect x="49" y="94" width="22" height="6" rx="3" fill="#2a1a10"/>
    <!-- steam -->
    <path d="M52 28 q-5 -8 2 -12 M62 27 q5 -8 -2 -12 M72 28 q5 -8 -2 -12"
          stroke="#fff" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>
  </svg>`;
};

/* ---- BONECA AMBALABU (EX) — frog head on a car tire, human legs ---- */
ART.boneca = function () {
  const tire = "#1d1d22", tireR = "#3a3a44", frog = "#74b84a", frogD = "#3f6e26", frogL = "#9fd66f";
  const skin = "#e7b487", skinD = "#b07e54";
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <!-- human legs -->
    <path d="M48 92 q-4 12 -2 20 l8 0 q0 -10 2 -18 Z" fill="${skin}" stroke="${skinD}" stroke-width="2"/>
    <path d="M70 92 q4 12 2 20 l-8 0 q0 -10 -2 -18 Z" fill="${skin}" stroke="${skinD}" stroke-width="2"/>
    <ellipse cx="50" cy="114" rx="9" ry="4" fill="#2a1a10"/>
    <ellipse cx="70" cy="114" rx="9" ry="4" fill="#2a1a10"/>
    <!-- tire body -->
    <circle cx="60" cy="70" r="28" fill="${tire}" stroke="#000" stroke-width="2"/>
    <circle cx="60" cy="70" r="14" fill="${tireR}"/>
    <circle cx="60" cy="70" r="6" fill="#888"/>
    <!-- tire treads -->
    <g stroke="#000" stroke-width="3">
      <line x1="60" y1="42" x2="60" y2="50"/><line x1="60" y1="90" x2="60" y2="98"/>
      <line x1="32" y1="70" x2="40" y2="70"/><line x1="80" y1="70" x2="88" y2="70"/>
      <line x1="40" y1="50" x2="46" y2="56"/><line x1="74" y1="84" x2="80" y2="90"/>
      <line x1="40" y1="90" x2="46" y2="84"/><line x1="74" y1="56" x2="80" y2="50"/>
    </g>
    <!-- frog head -->
    <path d="M40 34 Q40 14 60 14 Q80 14 80 34 Q80 44 60 44 Q40 44 40 34 Z"
          fill="${frog}" stroke="${frogD}" stroke-width="2.5"/>
    <path d="M46 20 Q60 16 74 20" stroke="${frogL}" stroke-width="3" fill="none" opacity=".6"/>
    <!-- frog eyes -->
    <circle cx="48" cy="14" r="9" fill="${frog}" stroke="${frogD}" stroke-width="2"/>
    <circle cx="72" cy="14" r="9" fill="${frog}" stroke="${frogD}" stroke-width="2"/>
    <circle cx="48" cy="13" r="5" fill="#fff"/><circle cx="72" cy="13" r="5" fill="#fff"/>
    <circle cx="49" cy="14" r="2.5" fill="#111"/><circle cx="73" cy="14" r="2.5" fill="#111"/>
    <!-- wide grin -->
    <path d="M46 34 Q60 44 74 34" stroke="${frogD}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="46" cy="32" r="2.5" fill="#e88" opacity=".6"/>
    <circle cx="74" cy="32" r="2.5" fill="#e88" opacity=".6"/>
  </svg>`;
};

/* ---- FUSED IMPOSTOR builder — Among Us silhouette + element accessory ----
   kind: red | float | black | zombie | alien | demon | metal           */
ART.imp = function (kind) {
  const P = {
    red:   {b:"#c8102e",d:"#7a0a1c",v:"#ffd0d0"},
    float: {b:"#7fc7ff",d:"#3a6ea5",v:"#eaf6ff"},
    black: {b:"#2c2c36",d:"#0c0c12",v:"#aab0c0"},
    zombie:{b:"#7faa55",d:"#3f5a28",v:"#e6ffcf"},
    alien: {b:"#46d6b8",d:"#1f7d68",v:"#d6fff5"},
    demon: {b:"#7a1f6b",d:"#3a0a33",v:"#ffd0f0"},
    metal: {b:"#aeb6c2",d:"#5b6470",v:"#eef2f8"},
  }[kind] || {b:"#c8102e",d:"#7a0a1c",v:"#ffd0d0"};
  const b=P.b, d=P.d, v=P.v;

  // per-kind extras drawn around the body
  let back = "", front = "";
  if (kind === "float") {
    back = `<path d="M22 50 q-18 -2 -22 12" stroke="${d}" stroke-width="2" fill="none"/>
      <ellipse cx="0" cy="64" rx="9" ry="11" fill="#ff7aa8" stroke="#a83a63" stroke-width="2"/>
      <path d="M0 75 l-3 5 l6 0 Z" fill="#a83a63"/>`;
    front = `<ellipse cx="46" cy="108" rx="22" ry="5" fill="#fff" opacity=".5"/>`;
  } else if (kind === "zombie") {
    front = `<path d="M44 60 q4 14 0 24 M50 64 q3 10 0 18" stroke="${d}" stroke-width="2" opacity=".7"/>
      <path d="M70 42 l6 -1 M70 46 l6 1" stroke="${d}" stroke-width="2"/>
      <line x1="40" y1="70" x2="86" y2="68" stroke="${d}" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    back = `<rect x="14" y="58" width="26" height="9" rx="4" fill="#dcd2b0" transform="rotate(12 26 62)"/>`;
  } else if (kind === "black") {
    front = `<circle cx="72" cy="42" r="3.5" fill="#ff3b3b"/><circle cx="72" cy="42" r="6" fill="none" stroke="#ff3b3b" stroke-width="1" opacity=".6"/>`;
  } else if (kind === "alien") {
    back = `<line x1="60" y1="20" x2="60" y2="6" stroke="${d}" stroke-width="2.5"/><circle cx="60" cy="5" r="4" fill="#b6ff00"/>`;
    front = `<ellipse cx="78" cy="40" rx="3" ry="4" fill="#0a3" /><ellipse cx="78" cy="40" rx="6" ry="7" fill="none" stroke="${d}" stroke-width="1"/>`;
  } else if (kind === "demon") {
    back = `<path d="M40 22 L30 4 L48 16 Z" fill="${d}"/><path d="M84 24 L94 6 L76 18 Z" fill="${d}"/>
      <path d="M90 70 q22 6 18 28 q-2 -14 -18 -16 Z" fill="${d}"/>`;
    front = `<path d="M62 60 q-6 8 0 16 q6 -8 0 -16Z" fill="#ff7a00" opacity=".8"/>`;
  } else if (kind === "metal") {
    front = `<circle cx="48" cy="60" r="2.4" fill="${d}"/><circle cx="78" cy="60" r="2.4" fill="${d}"/>
      <circle cx="48" cy="90" r="2.4" fill="${d}"/><circle cx="78" cy="90" r="2.4" fill="${d}"/>
      <path d="M52 30 q4 8 0 16" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/>`;
  }

  const evil = kind==="red"||kind==="float"
    ? `<path d="M58 60 Q70 56 84 62 L80 72 L76 64 L72 74 L68 64 L64 74 L60 66 Z" fill="#2a0008"/>`
    : `<path d="M58 62 Q70 58 84 64 L80 74 L76 66 L72 76 L68 66 L64 76 L60 68 Z" fill="#1a0006"/>
       <path d="M61 64 l1 7 M67 65 l0 8 M73 65 l-1 8 M79 64 l-1 6" stroke="#fff" stroke-width="1.6"/>`;

  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    ${back}
    <rect x="44" y="92" width="14" height="24" rx="6" fill="${d}"/>
    <rect x="64" y="92" width="14" height="24" rx="6" fill="${d}"/>
    <rect x="22" y="46" width="22" height="42" rx="11" fill="${d}"/>
    <path d="M40 40 Q40 20 62 20 Q86 20 86 44 L86 96 Q86 104 78 104 L46 104 Q40 104 40 96 Z"
          fill="${b}" stroke="${d}" stroke-width="3"/>
    <path d="M48 30 Q44 40 46 70" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".22"/>
    <path d="M58 36 Q58 28 70 28 Q84 28 84 40 Q84 52 70 52 Q58 52 58 44 Z" fill="${v}" stroke="${d}" stroke-width="2.5"/>
    <path d="M59 33 L82 39" stroke="${d}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="72" cy="42" r="3" fill="${d}"/>
    ${evil}
    ${front}
  </svg>`;
};

/* ---- BOSS: ギガ・インポスター — giant impostor fused with a bomber (star/alien) ---- */
ART.bossImpostor = function () {
  const b="#3a0f5a", d="#1c0530", v="#ffadd6", metal="#5a6048", metalD="#33381f";
  return `
  <svg viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg">
    <!-- star aura -->
    <circle cx="80" cy="74" r="70" fill="none" stroke="#ffd23f" stroke-width="2" opacity=".5" stroke-dasharray="6 8"/>
    <!-- bomber wings -->
    <path d="M40 84 L4 116 L66 96 Z" fill="${metalD}"/>
    <path d="M120 84 L156 116 L94 96 Z" fill="${metalD}"/>
    <!-- big horns -->
    <path d="M44 26 L28 -2 L60 18 Z" fill="${d}"/>
    <path d="M116 26 L132 -2 L100 18 Z" fill="${d}"/>
    <!-- legs / engines -->
    <rect x="58" y="118" width="16" height="26" rx="7" fill="${d}"/>
    <rect x="86" y="118" width="16" height="26" rx="7" fill="${d}"/>
    <circle cx="66" cy="142" r="6" fill="#222"/><circle cx="94" cy="142" r="6" fill="#222"/>
    <!-- body -->
    <path d="M44 44 Q44 14 80 14 Q116 14 116 50 L116 118 Q116 130 102 130 L58 130 Q44 130 44 118 Z"
          fill="${b}" stroke="${d}" stroke-width="4"/>
    <!-- bomber plate across belly -->
    <rect x="50" y="92" width="60" height="22" rx="8" fill="${metal}" stroke="${metalD}" stroke-width="2"/>
    <ellipse cx="66" cy="120" rx="9" ry="4" fill="#222"/><ellipse cx="94" cy="120" rx="9" ry="4" fill="#222"/>
    <!-- shine -->
    <path d="M56 30 Q50 52 54 90" stroke="#fff" stroke-width="6" opacity=".18" fill="none" stroke-linecap="round"/>
    <!-- giant visor -->
    <path d="M70 40 Q70 28 90 28 Q116 28 116 46 Q116 64 90 64 Q70 64 70 52 Z" fill="${v}" stroke="${d}" stroke-width="3"/>
    <path d="M72 36 L114 44" stroke="${d}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="100" cy="48" r="4.5" fill="${d}"/>
    <!-- antenna (alien) -->
    <line x1="80" y1="14" x2="80" y2="2" stroke="${d}" stroke-width="3"/><circle cx="80" cy="1" r="5" fill="#b6ff00"/>
    <!-- toothy maw -->
    <path d="M64 70 Q88 64 112 74 L106 90 L100 76 L94 92 L88 76 L82 92 L76 76 L70 88 Z" fill="#160018"/>
    <path d="M68 73 l2 11 M76 74 l1 13 M86 75 l0 13 M96 75 l-1 12 M106 74 l-2 10" stroke="#fff" stroke-width="2.4"/>
  </svg>`;
};

/* small helper: lighten/darken a hex color */
function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, r + Math.round(255 * pct / 100)));
  g = Math.max(0, Math.min(255, g + Math.round(255 * pct / 100)));
  b = Math.max(0, Math.min(255, b + Math.round(255 * pct / 100)));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
