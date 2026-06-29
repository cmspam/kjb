/* ============================================================
   art.js  —  hand-built SVG characters
   Every function returns an <svg> string. viewBox is 0 0 120 120,
   character roughly centered, feet near y=116.
   "facing" is handled by CSS scaleX on the actor wrapper, so all
   art is drawn facing RIGHT.

   Each sprite builds its own gradient ids (suffixed by U()) so that
   many inlined copies on the field never collide on url(#id).
   ============================================================ */
const ART = {};
ART._uid = 0;
function U(){ return "a" + (ART._uid++); }

/* small helper: lighten/darken a hex color */
function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, r + Math.round(255 * pct / 100)));
  g = Math.max(0, Math.min(255, g + Math.round(255 * pct / 100)));
  b = Math.max(0, Math.min(255, b + Math.round(255 * pct / 100)));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* ---- level-up evolution ----
   Crown/jewels/wings/sparkles that grow as a unit levels toward 10, drawn
   inside the sprite's own viewBox. hx,hy = head centre / head-top. Returns ""
   below Lv3 (and for enemies, which pass no level). */
function evoDecor(lv, hx, hy){
  lv = lv|0; if(lv<3) return "";
  const gold="#ffd23f", goldD="#b8860b", silver="#e2e8f2", silverD="#9aa6b8";
  let s="";
  if(lv>=10){ // ethereal wings behind the head
    s += `<path d="M${hx-15} ${hy+6} q-17 -12 -27 -2 q15 0 25 12 Z" fill="#fff" opacity=".45"/>`;
    s += `<path d="M${hx+15} ${hy+6} q17 -12 27 -2 q-15 0 -25 12 Z" fill="#fff" opacity=".45"/>`;
  }
  if(lv>=5){
    const c = lv>=8?gold:silver, cd = lv>=8?goldD:silverD;
    const top=Math.max(3, hy-12), base=hy+2, mid=(top+base)/2;
    s += `<path d="M${hx-13} ${base} L${hx-13} ${top} L${hx-6} ${mid} L${hx} ${top-2} L${hx+6} ${mid} L${hx+13} ${top} L${hx+13} ${base} Z" fill="${c}" stroke="${cd}" stroke-width="1.5" stroke-linejoin="round"/>`;
    if(lv>=8) s += `<circle cx="${hx}" cy="${top}" r="1.7" fill="#ff5b8a"/><circle cx="${hx-9}" cy="${mid}" r="1.4" fill="#5ad1ff"/><circle cx="${hx+9}" cy="${mid}" r="1.4" fill="#5ad1ff"/>`;
  } else if(lv>=3){ // a single rank star
    s += `<text x="${hx}" y="${hy-3}" font-size="13" text-anchor="middle" fill="${gold}" stroke="${goldD}" stroke-width=".6" font-family="sans-serif">★</text>`;
  }
  if(lv>=10) s += `<g fill="#fff"><circle cx="${hx-19}" cy="${hy+1}" r="1.5"/><circle cx="${hx+19}" cy="${hy-3}" r="1.7"/><circle cx="${hx+7}" cy="${hy-17}" r="1.4"/></g>`;
  return s;
}

/* ---- shared Among-Us "bean" builder ----
   Draws the classic crewmate silhouette with volume shading, a glossy
   visor, backpack and ground shadow. Callers pass face/back/front art
   plus per-kind <defs> via opts. Body is shaded with a vertical gradient. */
function amongBean(o){
  const color = o.color, dark = shade(color, -36), light = shade(color, 30);
  const visor = o.visor || "#a6e3ff";
  const u = U();
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="b${u}" x1="0" y1="0" x2="0.25" y2="1">
        <stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${dark}"/>
      </linearGradient>
      <linearGradient id="p${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${dark}"/>
      </linearGradient>
      <linearGradient id="v${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f4fcff"/><stop offset=".5" stop-color="${visor}"/><stop offset="1" stop-color="#3f6f8a"/>
      </linearGradient>
      ${o.defs || ""}
    </defs>
    <ellipse cx="60" cy="115" rx="30" ry="5" fill="#000" opacity=".18"/>
    ${o.back || ""}
    <!-- legs -->
    <rect x="45" y="93" width="13" height="25" rx="6.5" fill="${dark}"/>
    <rect x="62" y="93" width="13" height="25" rx="6.5" fill="${dark}"/>
    <!-- backpack -->
    <rect x="18" y="48" width="23" height="46" rx="11" fill="url(#p${u})" stroke="${dark}" stroke-width="2.5"/>
    <!-- body -->
    <path d="M38 50 Q38 20 64 20 Q90 20 90 50 L90 92 Q90 104 77 104 L51 104 Q38 104 38 92 Z"
          fill="url(#b${u})" stroke="${dark}" stroke-width="3"/>
    <!-- left gloss + right core-shadow -->
    <path d="M47 30 Q41 50 46 84" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".30"/>
    <path d="M84 42 Q88 64 82 90" stroke="${dark}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".30"/>
    <!-- visor socket shadow -->
    <path d="M56 41 Q56 30 72 30 Q88 30 88 44 Q88 58 72 58 Q56 58 56 47 Z" fill="${dark}" opacity=".35"/>
    <!-- visor -->
    <path d="M56 39 Q56 28 72 28 Q88 28 88 42 Q88 56 72 56 Q56 56 56 45 Z" fill="url(#v${u})" stroke="${dark}" stroke-width="2.2"/>
    <ellipse cx="65" cy="37" rx="9" ry="5" fill="#fff" opacity=".8"/>
    <ellipse cx="82" cy="48" rx="3" ry="2.2" fill="#fff" opacity=".55"/>
    ${o.face || ""}
    ${o.front || ""}
    ${evoDecor(o.lv, 64, 20)}
  </svg>`;
}

/* ---- Among Us CREWMATE (your basic trooper) ---- */
ART.crewmate = function (color, visor, lv) {
  return amongBean({ color: color || "#3fa9f5", visor: visor, lv: lv });
};

/* ---- FUSED IMPOSTOR builder — Among Us silhouette + element accessory ----
   kind: red | float | black | zombie | alien | demon | metal           */
ART.imp = function (kind, lv) {
  const P = {
    red:   { b:"#d11a36", v:"#ffd0d0" },
    float: { b:"#7fc7ff", v:"#eaf6ff" },
    black: { b:"#33333f", v:"#aab0c0" },
    zombie:{ b:"#84b056", v:"#e6ffcf" },
    alien: { b:"#3fd6b4", v:"#d6fff5" },
    demon: { b:"#8a1f78", v:"#ffd0f0" },
    metal: { b:"#aeb6c2", v:"#eef2f8" },
  }[kind] || { b:"#d11a36", v:"#ffd0d0" };
  const color = P.b, dark = shade(color, -36), visor = P.v;

  // menacing face: angry brow, glowing eye through visor, fanged maw
  const face = `
    <path d="M58 33 L86 42" stroke="${dark}" stroke-width="4.5" stroke-linecap="round"/>
    <ellipse cx="73" cy="44" rx="4.6" ry="3.1" fill="#fff" opacity=".95"/>
    <circle cx="74" cy="44" r="2.4" fill="${dark}"/>
    <path d="M54 65 Q72 58 90 67 L86 80 L80 68 L75 82 L70 68 L64 81 L59 68 Z" fill="#1c0206" stroke="#000" stroke-width="1"/>
    <path d="M58 68 l1.5 9 M67 69 l0 10 M76 69 l-1 10 M84 68 l-1.5 8" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`;

  let back = "", front = "", defs = "";
  if (kind === "float") {
    back = `<line x1="24" y1="42" x2="14" y2="22" stroke="#a83a63" stroke-width="1.5"/>
      <ellipse cx="13" cy="15" rx="11" ry="13" fill="#ff7aa8" stroke="#a83a63" stroke-width="2"/>
      <ellipse cx="9" cy="10" rx="3.4" ry="4.4" fill="#fff" opacity=".6"/>
      <path d="M13 28 l-3 5 l6 0 Z" fill="#a83a63"/>`;
    front = `<ellipse cx="60" cy="112" rx="24" ry="5" fill="#bfe8ff" opacity=".55"/>`;
  } else if (kind === "zombie") {
    back = `<g transform="rotate(14 24 60)" fill="#e6e0c4" stroke="#b8b08c" stroke-width="1">
        <rect x="12" y="57" width="26" height="7" rx="3.5"/>
        <circle cx="13" cy="57" r="3.6"/><circle cx="13" cy="64" r="3.6"/>
        <circle cx="37" cy="57" r="3.6"/><circle cx="37" cy="64" r="3.6"/></g>`;
    front = `<path d="M44 62 q3 12 0 22 M50 66 q2 9 0 16" stroke="${dark}" stroke-width="2" fill="none" opacity=".55"/>
      <line x1="42" y1="74" x2="88" y2="72" stroke="${dark}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <path d="M70 86 q-2 8 2 12 q4 -4 1 -12 Z" fill="#a7d36a"/>
      <circle cx="71" cy="100" r="2.6" fill="#a7d36a"/>`;
  } else if (kind === "black") {
    front = `<g stroke="#ff3b3b" opacity=".75"><circle cx="73" cy="44" r="8" fill="none" stroke-width="1.2"/>
      <line x1="73" y1="33" x2="73" y2="55" stroke-width=".8"/><line x1="62" y1="44" x2="84" y2="44" stroke-width=".8"/></g>
      <circle cx="73" cy="44" r="2.4" fill="#ff3b3b"/>`;
  } else if (kind === "alien") {
    back = `<line x1="60" y1="20" x2="60" y2="5" stroke="${dark}" stroke-width="2.5"/>
      <circle cx="60" cy="4" r="8" fill="#b6ff00" opacity=".25"/><circle cx="60" cy="4" r="4.5" fill="#b6ff00"/>`;
    front = `<ellipse cx="50" cy="76" rx="7" ry="8" fill="none" stroke="${dark}" stroke-width="1"/>
      <ellipse cx="50" cy="76" rx="4" ry="5" fill="#0c8f5a"/><circle cx="50" cy="75" r="1.8" fill="#021"/>`;
  } else if (kind === "demon") {
    back = `<path d="M40 22 L31 2 L50 16 Z" fill="${dark}"/><path d="M84 22 L93 2 L74 16 Z" fill="${dark}"/>
      <path d="M88 66 q24 4 22 30 q-3 -16 -22 -20 Z" fill="${dark}"/>`;
    front = `<path d="M70 64 q-5 9 2 16 q6 -7 1 -15 Z" fill="#ff8a00" opacity=".85"/>
      <path d="M64 70 q-3 5 1 9 q3 -4 0 -9 Z" fill="#ffd23f" opacity=".8"/>`;
  } else if (kind === "metal") {
    defs = `<linearGradient id="chrome${P.b.length}m" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2f5fa"/><stop offset=".5" stop-color="#aeb6c2"/><stop offset="1" stop-color="#5b6470"/></linearGradient>`;
    front = `<g fill="${dark}"><circle cx="46" cy="58" r="2.6"/><circle cx="84" cy="58" r="2.6"/>
        <circle cx="46" cy="92" r="2.6"/><circle cx="84" cy="92" r="2.6"/></g>
      <rect x="40" y="69" width="48" height="6" rx="3" fill="#fff" opacity=".30"/>
      <path d="M48 30 q5 9 0 18" stroke="#fff" stroke-width="3" opacity=".55" fill="none"/>`;
  }

  return amongBean({ color, visor, face, back, front, defs, lv });
};

/* standalone red impostor (kept for compatibility) */
ART.impostor = function () { return ART.imp("red"); };

/* ---- TRALALERO TRALALA — blue shark on three sneaker'd legs ---- */
ART.tralalero = function (lv) {
  const body = "#4aa3ea", bodyD = "#23618f", bodyL = "#8fcdf5", belly = "#eaf6ff", fin = "#2e6da4";
  const shoe = "#1e3a8a", shoeD = "#0c1f52", sole = "#f6f6f6";
  const u = U();
  function leg(x){ return `
    <rect x="${x-4}" y="84" width="8" height="20" rx="3" fill="#7fa8cc"/>
    <path d="M${x-13} 104 Q${x-13} 98 ${x-3} 98 L${x+11} 98 Q${x+17} 98 ${x+17} 107 L${x+17} 112 L${x-13} 112 Z" fill="${shoe}" stroke="${shoeD}" stroke-width="2"/>
    <rect x="${x-14}" y="111" width="33" height="5" rx="2.5" fill="${sole}"/>
    <path d="M${x-6} 101 L${x+9} 104" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    <circle cx="${x+12}" cy="103" r="1.5" fill="#fff"/>`; }
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="b${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bodyL}"/><stop offset=".55" stop-color="${body}"/><stop offset="1" stop-color="${bodyD}"/>
    </linearGradient></defs>
    <ellipse cx="60" cy="116" rx="40" ry="4" fill="#000" opacity=".16"/>
    ${leg(38)}${leg(60)}${leg(82)}
    <!-- tail -->
    <path d="M14 58 L2 38 L10 60 L2 80 Z" fill="${body}" stroke="${bodyD}" stroke-width="2.5" stroke-linejoin="round"/>
    <!-- dorsal fin -->
    <path d="M50 44 L60 18 L76 46 Z" fill="${fin}" stroke="${bodyD}" stroke-width="2" stroke-linejoin="round"/>
    <!-- body -->
    <path d="M12 60 Q40 30 86 42 Q112 48 115 60 Q108 80 70 82 Q32 84 12 60 Z" fill="url(#b${u})" stroke="${bodyD}" stroke-width="3" stroke-linejoin="round"/>
    <!-- belly -->
    <path d="M28 70 Q60 86 98 68 Q92 80 60 82 Q34 82 28 70 Z" fill="${belly}" opacity=".92"/>
    <!-- side fin -->
    <path d="M54 76 L60 94 L74 78 Z" fill="${fin}" stroke="${bodyD}" stroke-width="1.5" stroke-linejoin="round"/>
    <!-- gills -->
    <path d="M84 52 q-3 8 0 16 M90 51 q-3 9 0 18 M96 52 q-3 8 0 15" stroke="${bodyD}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- mouth + teeth -->
    <path d="M94 66 Q112 60 118 67 Q112 75 94 71 Z" fill="#0a2238"/>
    <polygon points="96,66 99,72 102,66" fill="#fff"/>
    <polygon points="103,66.5 106,72 109,66.5" fill="#fff"/>
    <polygon points="110,66 112,70 114,66" fill="#fff"/>
    <polygon points="98,71 101,66 104,71" fill="#fff" opacity=".9"/>
    <!-- eye -->
    <circle cx="90" cy="54" r="6.5" fill="#fff" stroke="${bodyD}" stroke-width="1.5"/>
    <circle cx="91" cy="55" r="3.2" fill="#08203a"/>
    <circle cx="89.4" cy="53" r="1.2" fill="#fff"/>
    ${evoDecor(lv, 90, 42)}
  </svg>`;
};

/* ---- BOMBARDIRO CROCODILO — croc head fused to a bomber plane (TANK) ---- */
ART.bombardiro = function (lv) {
  const metal = "#7a8a5e", metalD = "#3f4a30", metalL = "#a6b67e";
  const croc = "#5f7d3a", crocD = "#34471e", crocL = "#8aac58";
  const u = U();
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="m${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${metalL}"/><stop offset=".55" stop-color="${metal}"/><stop offset="1" stop-color="${metalD}"/>
      </linearGradient>
      <linearGradient id="c${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${crocL}"/><stop offset="1" stop-color="${crocD}"/>
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="114" rx="38" ry="5" fill="#000" opacity=".18"/>
    <!-- wheels -->
    <circle cx="42" cy="104" r="9" fill="#222" stroke="#000" stroke-width="2"/><circle cx="42" cy="104" r="3" fill="#888"/>
    <circle cx="82" cy="104" r="9" fill="#222" stroke="#000" stroke-width="2"/><circle cx="82" cy="104" r="3" fill="#888"/>
    <!-- tail fin + wing -->
    <path d="M8 56 L4 28 L22 54 Z" fill="${metalD}"/>
    <path d="M40 72 L22 98 L62 80 Z" fill="${metalD}"/>
    <!-- fuselage -->
    <path d="M14 64 Q22 48 60 48 L92 50 Q106 54 106 64 Q106 78 88 82 L34 82 Q16 80 14 64 Z"
          fill="url(#m${u})" stroke="${metalD}" stroke-width="3"/>
    <path d="M22 58 Q50 52 92 55" stroke="#fff" stroke-width="3" opacity=".25" fill="none" stroke-linecap="round"/>
    <!-- windows -->
    <circle cx="46" cy="64" r="4.5" fill="#bfe3ff" stroke="${metalD}" stroke-width="1.5"/>
    <circle cx="60" cy="64" r="4.5" fill="#bfe3ff" stroke="${metalD}" stroke-width="1.5"/>
    <circle cx="44.6" cy="62.6" r="1.4" fill="#fff"/>
    <!-- bombs -->
    <ellipse cx="50" cy="88" rx="9" ry="4" fill="#2b2b2b"/><ellipse cx="70" cy="88" rx="9" ry="4" fill="#2b2b2b"/>
    <!-- propeller -->
    <line x1="106" y1="46" x2="106" y2="82" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <circle cx="106" cy="64" r="4" fill="#444"/>
    <!-- croc head -->
    <path d="M84 52 Q98 43 114 50 Q122 53 117 61 L96 61 Q86 61 84 56 Z" fill="url(#c${u})" stroke="${crocD}" stroke-width="2.5"/>
    <path d="M96 63 Q108 65 119 62 Q113 73 98 71 Q90 69 96 63 Z" fill="${croc}" stroke="${crocD}" stroke-width="2.5"/>
    <!-- teeth -->
    <polygon points="98,61 100,65 103,61" fill="#fff"/><polygon points="104,61 106,65 109,61" fill="#fff"/>
    <polygon points="110,61 112,64 114,61" fill="#fff"/>
    <!-- eye + nostril -->
    <circle cx="92" cy="49" r="5.5" fill="#dff0b2" stroke="${crocD}" stroke-width="1.5"/>
    <circle cx="93" cy="49" r="2.6" fill="#1b2a0a"/><circle cx="91.6" cy="48" r="1" fill="#fff"/>
    <circle cx="111" cy="52" r="1.6" fill="${crocD}"/>
    ${evoDecor(lv, 60, 48)}
  </svg>`;
};

/* ---- TUNG TUNG TUNG SAHUR — angry wooden log with a tiny bat (HITTER) ---- */
ART.tung = function (lv) {
  const wood = "#b07c45", woodD = "#6e441f", woodL = "#d8ad72";
  const u = U();
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="w${u}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="${woodL}"/><stop offset=".55" stop-color="${wood}"/><stop offset="1" stop-color="${woodD}"/>
    </linearGradient></defs>
    <ellipse cx="60" cy="116" rx="26" ry="4" fill="#000" opacity=".18"/>
    <!-- feet -->
    <rect x="45" y="98" width="10" height="16" rx="3" fill="${woodD}"/>
    <rect x="65" y="98" width="10" height="16" rx="3" fill="${woodD}"/>
    <ellipse cx="49" cy="114" rx="9" ry="4" fill="${woodD}"/>
    <ellipse cx="71" cy="114" rx="9" ry="4" fill="${woodD}"/>
    <!-- left arm -->
    <rect x="32" y="50" width="9" height="26" rx="4.5" fill="${wood}" stroke="${woodD}" stroke-width="2" transform="rotate(-14 36 62)"/>
    <!-- body -->
    <path d="M40 30 Q40 12 60 12 Q80 12 80 30 L80 98 Q80 102 71 102 L49 102 Q40 102 40 98 Z" fill="url(#w${u})" stroke="${woodD}" stroke-width="3"/>
    <path d="M50 24 Q54 60 50 94 M70 24 Q66 60 70 94" stroke="${woodD}" stroke-width="2" fill="none" opacity=".38"/>
    <ellipse cx="60" cy="20" rx="16" ry="5" fill="${woodL}" opacity=".55"/>
    <!-- right arm + bat (the .swingarm group rotates when he attacks) -->
    <g class="swingarm" style="transform-box:view-box;transform-origin:64px 56px">
      <rect x="78" y="48" width="9" height="26" rx="4.5" fill="${wood}" stroke="${woodD}" stroke-width="2" transform="rotate(22 82 60)"/>
      <g transform="rotate(30 98 42)">
        <rect x="93" y="14" width="10" height="38" rx="5" fill="${woodL}" stroke="${woodD}" stroke-width="2"/>
        <rect x="94" y="46" width="8" height="9" rx="2" fill="${woodD}"/>
      </g>
    </g>
    <!-- angry brows -->
    <path d="M47 40 L60 47 M73 40 L60 47" stroke="${woodD}" stroke-width="4.5" stroke-linecap="round"/>
    <!-- eyes -->
    <circle cx="52" cy="51" r="5.5" fill="#fff" stroke="${woodD}" stroke-width="1.5"/>
    <circle cx="68" cy="51" r="5.5" fill="#fff" stroke="${woodD}" stroke-width="1.5"/>
    <circle cx="53" cy="52" r="2.6" fill="#000"/><circle cx="69" cy="52" r="2.6" fill="#000"/>
    <!-- shouting mouth -->
    <ellipse cx="60" cy="69" rx="9" ry="10" fill="#3a1c0a"/>
    <path d="M52 65 Q60 61 68 65" stroke="${woodD}" stroke-width="2" fill="none"/>
    <ellipse cx="60" cy="73" rx="4.5" ry="4" fill="#9a3a16"/>
    ${evoDecor(lv, 60, 12)}
  </svg>`;
};

/* ---- CAPPUCCINO ASSASSINO (EX) — ninja coffee cup with twin daggers ---- */
ART.cappuccino = function (lv) {
  const cup = "#f3e9d6", cupD = "#b89b6e", cupL = "#fffaf0", coffee = "#5a3a22", foam = "#fff7ea";
  const cloak = "#6e4326", steel = "#dfe5ee", steelD = "#7d8694";
  const u = U();
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="cu${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${cupL}"/><stop offset=".6" stop-color="${cup}"/><stop offset="1" stop-color="${cupD}"/>
    </linearGradient>
    <linearGradient id="st${u}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${steel}"/><stop offset="1" stop-color="${steelD}"/>
    </linearGradient></defs>
    <ellipse cx="60" cy="116" rx="28" ry="4" fill="#000" opacity=".18"/>
    <!-- legs + cloak -->
    <rect x="48" y="92" width="8" height="22" rx="4" fill="${cupD}"/>
    <rect x="64" y="92" width="8" height="22" rx="4" fill="${cupD}"/>
    <ellipse cx="52" cy="115" rx="8" ry="3" fill="#3a2a1a"/><ellipse cx="68" cy="115" rx="8" ry="3" fill="#3a2a1a"/>
    <path d="M34 60 Q30 96 44 100 L76 100 Q90 96 86 60 Z" fill="${cloak}" opacity=".55"/>
    <!-- saucer + cup -->
    <ellipse cx="60" cy="96" rx="30" ry="7" fill="${cupD}"/>
    <path d="M38 52 L82 52 L74 94 L46 94 Z" fill="url(#cu${u})" stroke="${cupD}" stroke-width="3"/>
    <path d="M44 58 Q42 76 47 90" stroke="#fff" stroke-width="4" opacity=".5" fill="none" stroke-linecap="round"/>
    <!-- handle -->
    <path d="M82 60 q16 4 10 22 q-4 8 -12 6" fill="none" stroke="${cupD}" stroke-width="6"/>
    <!-- foam head -->
    <path d="M36 52 Q36 30 60 30 Q84 30 84 52 Q60 60 36 52 Z" fill="${foam}" stroke="${cupD}" stroke-width="2.5"/>
    <ellipse cx="50" cy="40" rx="8" ry="5" fill="#fff"/>
    <path d="M40 51 Q60 57 80 51" stroke="${coffee}" stroke-width="3" fill="none" opacity=".45"/>
    <!-- ninja eye band -->
    <rect x="36" y="42" width="48" height="9" rx="4" fill="#241712"/>
    <ellipse cx="54" cy="46.5" rx="4" ry="2.6" fill="#7fe3ff"/><ellipse cx="68" cy="46.5" rx="4" ry="2.6" fill="#7fe3ff"/>
    <ellipse cx="53" cy="45.6" rx="1.4" ry="1" fill="#fff"/><ellipse cx="67" cy="45.6" rx="1.4" ry="1" fill="#fff"/>
    <!-- crossed daggers -->
    <g stroke="${steelD}" stroke-width="1.5">
      <polygon points="50,96 58,64 62,66 54,98" fill="url(#st${u})"/>
      <polygon points="70,96 62,64 58,66 66,98" fill="url(#st${u})"/>
    </g>
    <rect x="49" y="94" width="22" height="6" rx="3" fill="#241712"/>
    <!-- steam -->
    <path d="M52 28 q-5 -8 2 -12 M62 27 q5 -8 -2 -12 M72 28 q5 -8 -2 -12" stroke="#fff" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>
    ${evoDecor(lv, 60, 30)}
  </svg>`;
};

/* ---- BONECA AMBALABU (EX) — frog head on a car tire, human legs ---- */
ART.boneca = function (lv) {
  const frog = "#74b84a", frogD = "#3f6e26", frogL = "#a3da70", skin = "#e7b487", skinD = "#b07e54";
  const u = U();
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ti${u}" cx="0.42" cy="0.38" r="0.7">
        <stop offset="0" stop-color="#3a3a44"/><stop offset="1" stop-color="#14141a"/>
      </radialGradient>
      <radialGradient id="fr${u}" cx="0.4" cy="0.32" r="0.8">
        <stop offset="0" stop-color="${frogL}"/><stop offset=".7" stop-color="${frog}"/><stop offset="1" stop-color="${frogD}"/>
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="116" rx="30" ry="5" fill="#000" opacity=".2"/>
    <!-- legs -->
    <path d="M48 92 q-4 12 -2 20 l8 0 q0 -10 2 -18 Z" fill="${skin}" stroke="${skinD}" stroke-width="2"/>
    <path d="M70 92 q4 12 2 20 l-8 0 q0 -10 -2 -18 Z" fill="${skin}" stroke="${skinD}" stroke-width="2"/>
    <ellipse cx="50" cy="114" rx="9" ry="4" fill="#2a1a10"/><ellipse cx="70" cy="114" rx="9" ry="4" fill="#2a1a10"/>
    <!-- tire body -->
    <circle cx="60" cy="70" r="28" fill="url(#ti${u})" stroke="#000" stroke-width="2"/>
    <circle cx="60" cy="70" r="14" fill="#3a3a44"/><circle cx="60" cy="70" r="6" fill="#9098a4"/>
    <g stroke="#000" stroke-width="3" stroke-linecap="round">
      <line x1="60" y1="42" x2="60" y2="50"/><line x1="60" y1="90" x2="60" y2="98"/>
      <line x1="32" y1="70" x2="40" y2="70"/><line x1="80" y1="70" x2="88" y2="70"/>
      <line x1="40" y1="50" x2="46" y2="56"/><line x1="74" y1="84" x2="80" y2="90"/>
      <line x1="40" y1="90" x2="46" y2="84"/><line x1="74" y1="56" x2="80" y2="50"/></g>
    <path d="M38 58 A28 28 0 0 1 58 44" stroke="#5a5a66" stroke-width="3" fill="none" opacity=".6"/>
    <!-- frog head -->
    <path d="M40 34 Q40 14 60 14 Q80 14 80 34 Q80 44 60 44 Q40 44 40 34 Z" fill="url(#fr${u})" stroke="${frogD}" stroke-width="2.5"/>
    <circle cx="48" cy="14" r="9" fill="url(#fr${u})" stroke="${frogD}" stroke-width="2"/>
    <circle cx="72" cy="14" r="9" fill="url(#fr${u})" stroke="${frogD}" stroke-width="2"/>
    <circle cx="48" cy="13" r="5" fill="#fff"/><circle cx="72" cy="13" r="5" fill="#fff"/>
    <circle cx="49" cy="14" r="2.5" fill="#111"/><circle cx="73" cy="14" r="2.5" fill="#111"/>
    <circle cx="47" cy="11.5" r="1.2" fill="#fff"/><circle cx="71" cy="11.5" r="1.2" fill="#fff"/>
    <path d="M46 34 Q60 44 74 34" stroke="${frogD}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="46" cy="32" r="2.5" fill="#e88" opacity=".55"/><circle cx="74" cy="32" r="2.5" fill="#e88" opacity=".55"/>
    ${evoDecor(lv, 60, 8)}
  </svg>`;
};

/* ---- Bases ---- */
ART.playerBase = function () {
  const u = U();
  return `
  <svg viewBox="0 0 140 200" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="pb${u}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#5b82bd"/><stop offset=".6" stop-color="#3a5a8a"/><stop offset="1" stop-color="#243a5c"/>
    </linearGradient></defs>
    <ellipse cx="70" cy="180" rx="64" ry="18" fill="#1a2740"/>
    <path d="M30 60 Q30 20 70 20 Q110 20 110 60 L110 150 Q110 178 70 178 Q30 178 30 150 Z"
          fill="url(#pb${u})" stroke="#1a2740" stroke-width="5"/>
    <path d="M44 40 Q40 80 44 150" stroke="#fff" stroke-width="6" opacity=".25" fill="none" stroke-linecap="round"/>
    <circle cx="70" cy="60" r="16" fill="#bfe7ff" stroke="#1a2740" stroke-width="4"/>
    <circle cx="64" cy="55" r="5" fill="#fff" opacity=".8"/>
    <rect x="52" y="92" width="36" height="22" rx="6" fill="#bfe7ff" stroke="#1a2740" stroke-width="3"/>
    <rect x="52" y="124" width="36" height="22" rx="6" fill="#bfe7ff" stroke="#1a2740" stroke-width="3"/>
    <path d="M30 120 L8 170 L30 160 Z" fill="#2a4060"/><path d="M110 120 L132 170 L110 160 Z" fill="#2a4060"/>
    <rect x="68" y="-4" width="4" height="26" fill="#888"/><path d="M72 0 L96 8 L72 16 Z" fill="#4fe3c1"/>
  </svg>`;
};

ART.enemyBase = function () {
  const u = U();
  return `
  <svg viewBox="0 0 140 200" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="eb${u}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#a01228"/><stop offset=".6" stop-color="#7a0a1c"/><stop offset="1" stop-color="#480610"/>
    </linearGradient></defs>
    <ellipse cx="70" cy="182" rx="64" ry="18" fill="#2a0a14"/>
    <path d="M24 70 L24 150 Q24 178 70 178 Q116 178 116 150 L116 70
             L104 50 L92 70 L80 46 L70 70 L60 46 L48 70 L36 50 Z"
          fill="url(#eb${u})" stroke="#3a0510" stroke-width="5"/>
    <path d="M40 80 Q36 120 40 160" stroke="#000" stroke-width="6" opacity=".25" fill="none"/>
    <path d="M52 96 Q52 84 70 84 Q92 84 92 100 Q92 118 70 118 Q52 118 52 106 Z" fill="#ffd0d0" stroke="#3a0510" stroke-width="4"/>
    <circle cx="78" cy="100" r="4" fill="#7a0a1c"/><path d="M54 92 L90 98" stroke="#3a0510" stroke-width="4" stroke-linecap="round"/>
    <path d="M48 140 Q70 134 92 142 L88 160 L82 146 L76 162 L70 146 L64 162 L58 146 L52 158 Z" fill="#2a0008"/>
    <rect x="68" y="22" width="4" height="30" fill="#555"/><path d="M72 26 L100 34 L72 42 Z" fill="#ff3b5c"/>
  </svg>`;
};

/* ---- BOSS: ギガ・インポスター — giant impostor fused with a bomber ---- */
ART.bossImpostor = function () {
  const b = "#5a1f82", bD = "#2a0a44", bL = "#8a4fb8", v = "#ffadd6", metal = "#5a6048", metalD = "#33381f";
  const u = U();
  return `
  <svg viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bb${u}" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stop-color="${bL}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${bD}"/>
    </linearGradient></defs>
    <ellipse cx="80" cy="146" rx="58" ry="7" fill="#000" opacity=".25"/>
    <circle cx="80" cy="74" r="70" fill="none" stroke="#ffd23f" stroke-width="2" opacity=".5" stroke-dasharray="6 8"/>
    <path d="M40 84 L4 116 L66 96 Z" fill="${metalD}"/><path d="M120 84 L156 116 L94 96 Z" fill="${metalD}"/>
    <path d="M44 26 L28 -2 L60 18 Z" fill="${bD}"/><path d="M116 26 L132 -2 L100 18 Z" fill="${bD}"/>
    <rect x="58" y="118" width="16" height="26" rx="7" fill="${bD}"/><rect x="86" y="118" width="16" height="26" rx="7" fill="${bD}"/>
    <circle cx="66" cy="142" r="6" fill="#222"/><circle cx="94" cy="142" r="6" fill="#222"/>
    <path d="M44 44 Q44 14 80 14 Q116 14 116 50 L116 118 Q116 130 102 130 L58 130 Q44 130 44 118 Z"
          fill="url(#bb${u})" stroke="${bD}" stroke-width="4"/>
    <rect x="50" y="92" width="60" height="22" rx="8" fill="${metal}" stroke="${metalD}" stroke-width="2"/>
    <ellipse cx="66" cy="120" rx="9" ry="4" fill="#222"/><ellipse cx="94" cy="120" rx="9" ry="4" fill="#222"/>
    <path d="M56 30 Q50 52 54 90" stroke="#fff" stroke-width="6" opacity=".2" fill="none" stroke-linecap="round"/>
    <!-- giant visor -->
    <path d="M68 40 Q68 28 90 28 Q116 28 116 46 Q116 64 90 64 Q68 64 68 52 Z" fill="${v}" stroke="${bD}" stroke-width="3"/>
    <ellipse cx="84" cy="38" rx="11" ry="5" fill="#fff" opacity=".7"/>
    <path d="M70 36 L114 44" stroke="${bD}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="102" cy="48" r="4.5" fill="${bD}"/>
    <line x1="80" y1="14" x2="80" y2="2" stroke="${bD}" stroke-width="3"/><circle cx="80" cy="1" r="5" fill="#b6ff00"/>
    <!-- toothy maw -->
    <path d="M62 70 Q88 63 114 74 L108 90 L102 76 L96 92 L90 76 L84 92 L78 76 L70 88 Z" fill="#160018" stroke="#000" stroke-width="1"/>
    <path d="M66 73 l2 11 M76 74 l1 13 M88 75 l0 13 M98 75 l-1 12 M108 74 l-2 10" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;
};

/* ========== GACHA / BRAINROT NEW CHARACTERS ========== */

/* チンパンジーニ・バナニーニ — monkey peeking out of a banana (★ N) */
ART.chimp = function (lv) {
  const ban="#ffd33a", banD="#d9a400", banL="#ffe98a", tip="#6e4a1f", face="#caa06a", faceD="#8a6a3f", dark="#3a2a18";
  const u = U();
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bn${u}" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${banL}"/><stop offset=".6" stop-color="${ban}"/><stop offset="1" stop-color="${banD}"/>
    </linearGradient></defs>
    <ellipse cx="60" cy="116" rx="26" ry="4" fill="#000" opacity=".16"/>
    <path d="M28 98 Q12 60 34 24 Q40 12 52 16 Q44 32 48 56 Q52 88 86 98 Q60 110 28 98 Z" fill="url(#bn${u})" stroke="${banD}" stroke-width="3"/>
    <path d="M50 16 l-3 -8 l9 5 Z" fill="${tip}"/><path d="M86 98 l9 3 l-3 -9 Z" fill="${tip}"/>
    <path d="M36 30 Q30 60 42 92" stroke="#fff" stroke-width="3" opacity=".4" fill="none"/>
    <circle cx="40" cy="58" r="8" fill="${face}" stroke="${faceD}" stroke-width="2"/>
    <circle cx="78" cy="58" r="8" fill="${face}" stroke="${faceD}" stroke-width="2"/>
    <ellipse cx="58" cy="62" rx="22" ry="20" fill="${face}" stroke="${faceD}" stroke-width="2"/>
    <ellipse cx="58" cy="70" rx="13" ry="10" fill="#f0d8b0"/>
    <circle cx="51" cy="56" r="4.5" fill="#fff"/><circle cx="65" cy="56" r="4.5" fill="#fff"/>
    <circle cx="51" cy="57" r="2.2" fill="#000"/><circle cx="65" cy="57" r="2.2" fill="#000"/>
    <ellipse cx="55" cy="68" rx="1.6" ry="2.4" fill="${dark}"/><ellipse cx="61" cy="68" rx="1.6" ry="2.4" fill="${dark}"/>
    <path d="M53 74 Q58 79 63 74" stroke="${faceD}" stroke-width="2" fill="none"/>
    <path d="M82 80 q12 4 9 17" stroke="${faceD}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="48" y="98" width="8" height="16" rx="4" fill="${faceD}"/><rect x="62" y="98" width="8" height="16" rx="4" fill="${faceD}"/>
    ${evoDecor(lv, 58, 40)}
  </svg>`;
};

/* ブルブル・パタピム — forest creature: bark body, long nose, big feet (★★ R) */
ART.patapim = function (lv) {
  const bark="#9a6634", barkD="#5f3d1c", barkL="#c08a4e", nose="#ead2a0", noseD="#b89a66", leaf="#54b34a", leafD="#2e7d32";
  const u = U();
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bk${u}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="${barkL}"/><stop offset=".55" stop-color="${bark}"/><stop offset="1" stop-color="${barkD}"/>
    </linearGradient></defs>
    <ellipse cx="60" cy="117" rx="30" ry="4" fill="#000" opacity=".16"/>
    <ellipse cx="42" cy="113" rx="16" ry="6" fill="${noseD}"/><ellipse cx="78" cy="113" rx="16" ry="6" fill="${noseD}"/>
    <rect x="38" y="92" width="12" height="20" rx="5" fill="${barkD}"/><rect x="70" y="92" width="12" height="20" rx="5" fill="${barkD}"/>
    <rect x="24" y="50" width="10" height="26" rx="5" fill="${bark}" stroke="${barkD}" stroke-width="2" transform="rotate(-14 29 60)"/>
    <rect x="86" y="50" width="10" height="26" rx="5" fill="${bark}" stroke="${barkD}" stroke-width="2" transform="rotate(14 91 60)"/>
    <path d="M34 44 Q34 26 60 26 Q86 26 86 46 L86 94 Q86 100 78 100 L42 100 Q34 100 34 94 Z" fill="url(#bk${u})" stroke="${barkD}" stroke-width="3"/>
    <path d="M44 36 Q40 64 44 92 M60 32 Q56 64 60 96 M76 36 Q80 64 76 92" stroke="${barkD}" stroke-width="2" opacity=".4" fill="none"/>
    <path d="M52 26 Q44 6 60 12 Q56 22 60 26 Z" fill="${leaf}" stroke="${leafD}" stroke-width="1.5"/>
    <path d="M68 26 Q78 6 62 12 Q66 22 62 26 Z" fill="${leaf}" stroke="${leafD}" stroke-width="1.5"/>
    <circle cx="50" cy="40" r="11" fill="#fff" stroke="${barkD}" stroke-width="2"/><circle cx="70" cy="40" r="11" fill="#fff" stroke="${barkD}" stroke-width="2"/>
    <circle cx="51" cy="42" r="5" fill="#1a1a1a"/><circle cx="69" cy="42" r="5" fill="#1a1a1a"/>
    <circle cx="49" cy="40" r="1.6" fill="#fff"/><circle cx="67" cy="40" r="1.6" fill="#fff"/>
    <path d="M44 56 Q60 52 76 56 Q80 70 60 74 Q40 70 44 56 Z" fill="${nose}" stroke="${noseD}" stroke-width="2.5"/>
    <ellipse cx="53" cy="64" rx="2" ry="3" fill="${noseD}"/><ellipse cx="67" cy="64" rx="2" ry="3" fill="${noseD}"/>
    ${evoDecor(lv, 60, 26)}
  </svg>`;
};

/* バレリーナ・カプチーナ — ballerina with a cappuccino-cup head (★★ R) */
ART.ballerina = function (lv) {
  const cup="#f3e9d6", cupD="#b89b6e", cupL="#fffaf0", foam="#fff7ea", tutu="#ff9ec4", tutuD="#e06a99", skin="#ffe0c4", leg="#ffd0b0", legD="#caa080";
  const u = U();
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="cp${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${cupL}"/><stop offset=".6" stop-color="${cup}"/><stop offset="1" stop-color="${cupD}"/>
    </linearGradient>
    <radialGradient id="tu${u}" cx="0.5" cy="0.2" r="0.9">
      <stop offset="0" stop-color="#ffc4dd"/><stop offset="1" stop-color="${tutu}"/>
    </radialGradient></defs>
    <ellipse cx="60" cy="117" rx="22" ry="4" fill="#000" opacity=".16"/>
    <path d="M56 84 q-3 18 -6 28 l6 0 q4 -14 6 -26 Z" fill="${leg}" stroke="${legD}" stroke-width="2"/>
    <path d="M64 84 q5 16 11 26 l-5 3 q-9 -12 -12 -25 Z" fill="${leg}" stroke="${legD}" stroke-width="2"/>
    <path d="M47 112 l9 0 l-1 5 l-9 0 Z" fill="#ff7ab0"/><path d="M71 108 l8 4 l-2 5 l-9 -4 Z" fill="#ff7ab0"/>
    <path d="M40 76 Q60 64 80 76 Q72 92 60 92 Q48 92 40 76 Z" fill="url(#tu${u})" stroke="${tutuD}" stroke-width="2"/>
    <path d="M44 78 L40 88 M52 80 L50 92 M60 81 L60 93 M68 80 L70 92 M76 78 L80 88" stroke="${tutuD}" stroke-width="1.5"/>
    <path d="M52 56 Q52 50 60 50 Q68 50 68 56 L66 78 L54 78 Z" fill="${tutu}" stroke="${tutuD}" stroke-width="2"/>
    <path d="M54 58 Q40 52 34 38" stroke="${skin}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M66 58 Q80 52 86 38" stroke="${skin}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M44 30 L76 30 L70 52 L50 52 Z" fill="url(#cp${u})" stroke="${cupD}" stroke-width="2.5"/>
    <path d="M44 30 Q44 16 60 16 Q76 16 76 30 Q60 36 44 30 Z" fill="${foam}" stroke="${cupD}" stroke-width="2"/>
    <path d="M76 34 q10 2 6 14 q-3 6 -9 4" fill="none" stroke="${cupD}" stroke-width="5"/>
    <ellipse cx="52" cy="40" rx="3.5" ry="2.4" fill="#3a2a1a"/><ellipse cx="68" cy="40" rx="3.5" ry="2.4" fill="#3a2a1a"/>
    <path d="M54 46 Q60 50 66 46" stroke="${cupD}" stroke-width="2" fill="none"/>
    <circle cx="50" cy="44" r="2.4" fill="#ffb0c8" opacity=".7"/><circle cx="70" cy="44" r="2.4" fill="#ffb0c8" opacity=".7"/>
    <path d="M54 14 q-4 -6 2 -10 M66 14 q4 -6 -2 -10" stroke="#fff" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/>
    ${evoDecor(lv, 60, 16)}
  </svg>`;
};

/* リリリ・ラリラ — cactus-elephant in sandals with a clock (★★★ SR) */
ART.lirili = function (lv) {
  const cac="#5fae4a", cacD="#357a2b", cacL="#86cf6e", ear="#4f9a3e", tan="#d8c39a", clock="#ffd23f", clockD="#b8860b";
  const u = U();
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="ca${u}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="${cacL}"/><stop offset=".55" stop-color="${cac}"/><stop offset="1" stop-color="${cacD}"/>
    </linearGradient></defs>
    <ellipse cx="60" cy="117" rx="26" ry="4" fill="#000" opacity=".16"/>
    <ellipse cx="50" cy="114" rx="12" ry="4" fill="${tan}" stroke="${cacD}" stroke-width="1.5"/>
    <ellipse cx="74" cy="114" rx="12" ry="4" fill="${tan}" stroke="${cacD}" stroke-width="1.5"/>
    <rect x="44" y="94" width="12" height="18" rx="5" fill="${cac}" stroke="${cacD}" stroke-width="2"/>
    <rect x="68" y="94" width="12" height="18" rx="5" fill="${cac}" stroke="${cacD}" stroke-width="2"/>
    <path d="M30 70 q-8 0 -8 -14 q0 -6 4 -6 q4 0 4 6 l0 14 Z" fill="${cac}" stroke="${cacD}" stroke-width="2"/>
    <path d="M94 70 q8 0 8 -14 q0 -6 -4 -6 q-4 0 -4 6 l0 14 Z" fill="${cac}" stroke="${cacD}" stroke-width="2"/>
    <path d="M36 50 Q36 32 60 32 Q84 32 84 50 L84 92 Q84 98 76 98 L44 98 Q36 98 36 92 Z" fill="url(#ca${u})" stroke="${cacD}" stroke-width="3"/>
    <path d="M48 40 Q44 70 48 94 M72 40 Q76 70 72 94" stroke="${cacD}" stroke-width="2" opacity=".35" fill="none"/>
    <g stroke="${cacL}" stroke-width="1.5"><line x1="42" y1="56" x2="38" y2="54"/><line x1="42" y1="72" x2="38" y2="70"/><line x1="78" y1="56" x2="82" y2="54"/><line x1="78" y1="72" x2="82" y2="70"/></g>
    <ellipse cx="36" cy="44" rx="9" ry="12" fill="${ear}" stroke="${cacD}" stroke-width="2"/>
    <ellipse cx="84" cy="44" rx="9" ry="12" fill="${ear}" stroke="${cacD}" stroke-width="2"/>
    <circle cx="52" cy="46" r="6" fill="#fff" stroke="${cacD}" stroke-width="1.5"/><circle cx="68" cy="46" r="6" fill="#fff" stroke="${cacD}" stroke-width="1.5"/>
    <circle cx="53" cy="47" r="2.6" fill="#1a1a1a"/><circle cx="69" cy="47" r="2.6" fill="#1a1a1a"/>
    <path d="M56 54 Q60 58 64 54 Q66 72 60 86 Q54 80 56 54 Z" fill="${cac}" stroke="${cacD}" stroke-width="2"/>
    <circle cx="92" cy="84" r="13" fill="${clock}" stroke="${clockD}" stroke-width="3"/>
    <line x1="92" y1="84" x2="92" y2="76" stroke="${clockD}" stroke-width="2"/><line x1="92" y1="84" x2="98" y2="86" stroke="${clockD}" stroke-width="2"/>
    <circle cx="92" cy="84" r="2" fill="${clockD}"/><rect x="89" y="69" width="6" height="4" rx="2" fill="${clockD}"/>
    ${evoDecor(lv, 60, 32)}
  </svg>`;
};

/* ラ・ヴァカ・サトゥルノ — cosmic Saturn cow (★★★★ UR / legendary) */
ART.vaca = function (lv) {
  const body="#f4f4f7", bodyD="#c8c8d4", spot="#2b2b33", pink="#ffb0c0", horn="#e8d8b0", hornD="#b8a070", ring="#ffd23f", ringD="#c79a2e", dark="#1a1a22";
  const u = U();
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="vb${u}" cx="0.4" cy="0.32" r="0.8">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".75" stop-color="${body}"/><stop offset="1" stop-color="${bodyD}"/>
    </radialGradient></defs>
    <ellipse cx="60" cy="100" rx="44" ry="20" fill="#7a5fd0" opacity=".18"/>
    <g fill="#fff"><circle cx="16" cy="22" r="2"/><circle cx="104" cy="30" r="2.4"/><circle cx="22" cy="80" r="1.8"/><circle cx="100" cy="92" r="2"/></g>
    <ellipse cx="60" cy="74" rx="54" ry="16" fill="none" stroke="${ringD}" stroke-width="7" opacity=".5" transform="rotate(-12 60 74)"/>
    <rect x="44" y="92" width="9" height="20" rx="4" fill="${body}" stroke="${dark}" stroke-width="2"/>
    <rect x="67" y="92" width="9" height="20" rx="4" fill="${body}" stroke="${dark}" stroke-width="2"/>
    <rect x="44" y="108" width="9" height="6" fill="${spot}"/><rect x="67" y="108" width="9" height="6" fill="${spot}"/>
    <ellipse cx="60" cy="72" rx="30" ry="24" fill="url(#vb${u})" stroke="${dark}" stroke-width="3"/>
    <path d="M44 64 q8 -6 14 2 q-2 10 -12 8 q-8 -4 -2 -10Z" fill="${spot}"/>
    <ellipse cx="74" cy="80" rx="9" ry="7" fill="${spot}"/>
    <path d="M9 79 A54 16 -12 0 0 111 67" fill="none" stroke="${ring}" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="60" cy="42" rx="20" ry="17" fill="url(#vb${u})" stroke="${dark}" stroke-width="3"/>
    <path d="M44 32 Q36 22 42 18 Q46 24 50 30 Z" fill="${horn}" stroke="${hornD}" stroke-width="1.5"/>
    <path d="M76 32 Q84 22 78 18 Q74 24 70 30 Z" fill="${horn}" stroke="${hornD}" stroke-width="1.5"/>
    <ellipse cx="40" cy="42" rx="7" ry="4" fill="${body}" stroke="${dark}" stroke-width="2"/>
    <ellipse cx="80" cy="42" rx="7" ry="4" fill="${body}" stroke="${dark}" stroke-width="2"/>
    <circle cx="53" cy="40" r="4.5" fill="#fff" stroke="${dark}" stroke-width="1.5"/><circle cx="67" cy="40" r="4.5" fill="#fff" stroke="${dark}" stroke-width="1.5"/>
    <circle cx="53" cy="41" r="2.2" fill="#111"/><circle cx="67" cy="41" r="2.2" fill="#111"/>
    <ellipse cx="60" cy="52" rx="12" ry="8" fill="${pink}" stroke="${dark}" stroke-width="2"/>
    <ellipse cx="56" cy="52" rx="1.8" ry="2.6" fill="#a06"/><ellipse cx="64" cy="52" rx="1.8" ry="2.6" fill="#a06"/>
    ${evoDecor(lv, 60, 25)}
  </svg>`;
};

/* gacha capsule machine */
ART.gachaMachine = function () {
  return `
  <svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="86" width="80" height="56" rx="10" fill="#e23b5b" stroke="#7a0a1c" stroke-width="4"/>
    <rect x="34" y="108" width="52" height="22" rx="6" fill="#2a0a14"/>
    <rect x="48" y="126" width="24" height="10" rx="4" fill="#ffd23f" stroke="#7a0a1c" stroke-width="2"/>
    <circle cx="60" cy="100" r="7" fill="#ffd23f" stroke="#7a0a1c" stroke-width="3"/>
    <rect x="58" y="96" width="4" height="8" fill="#7a0a1c"/>
    <circle cx="60" cy="50" r="42" fill="rgba(180,230,255,.35)" stroke="#bfe7ff" stroke-width="4"/>
    <rect x="20" y="78" width="80" height="10" rx="4" fill="#bfe7ff"/>
    <circle cx="46" cy="44" r="10" fill="#ff5b5b"/><circle cx="70" cy="38" r="10" fill="#5ad17a"/>
    <circle cx="64" cy="62" r="10" fill="#5aa9e6"/><circle cx="44" cy="64" r="9" fill="#ffd23f"/>
    <circle cx="78" cy="58" r="8" fill="#c46bff"/>
    <ellipse cx="50" cy="30" rx="14" ry="8" fill="#fff" opacity=".2"/>
  </svg>`;
};

/* ---- recolor: bake an SVG hue/saturate filter into any sprite string so a
   character can be tinted any color, uniformly, everywhere art() is used ---- */
function recolor(svg, hue, sat){
  hue = hue||0; sat = (sat==null?1:sat);
  if(!hue && sat===1) return svg;
  const u = "hue"+(ART._uid++);
  return svg
    .replace(/(<svg[^>]*>)/, `$1<defs><filter id="${u}" color-interpolation-filters="sRGB"><feColorMatrix type="hueRotate" values="${hue}"/><feColorMatrix type="saturate" values="${sat}"/></filter></defs><g filter="url(#${u})">`)
    .replace(/<\/svg>\s*$/, `</g></svg>`);
}

/* ---- the 11 designable base looks, by key ---- */
const BASES = {
  crewmate:  (lv)=>ART.crewmate(undefined, undefined, lv),
  shark:     (lv)=>ART.tralalero(lv),
  croc:      (lv)=>ART.bombardiro(lv),
  tung:      (lv)=>ART.tung(lv),
  coffee:    (lv)=>ART.cappuccino(lv),
  frog:      (lv)=>ART.boneca(lv),
  monkey:    (lv)=>ART.chimp(lv),
  forest:    (lv)=>ART.patapim(lv),
  ballerina: (lv)=>ART.ballerina(lv),
  cactus:    (lv)=>ART.lirili(lv),
  cow:       (lv)=>ART.vaca(lv),
};
const BASE_NAMES = {
  crewmate:"クルー", shark:"サメ", croc:"ワニ", tung:"まるた", coffee:"コーヒー",
  frog:"カエル", monkey:"サル", forest:"もり", ballerina:"バレリーナ", cactus:"サボテン", cow:"うし",
};

/* ---- ずんだもん guide ---- */
ART.zunda = function(){
  const lg="#cfe98f", lgD="#9cc25e", lgL="#eef9cf", dg="#6fae3a", dgD="#487d24", cheek="#ff9ec4";
  const u = "z"+(ART._uid++);
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="h${u}" cx="0.4" cy="0.32" r="0.8">
      <stop offset="0" stop-color="${lgL}"/><stop offset=".7" stop-color="${lg}"/><stop offset="1" stop-color="${lgD}"/>
    </radialGradient></defs>
    <ellipse cx="60" cy="115" rx="26" ry="4" fill="#000" opacity=".15"/>
    <path d="M60 6 Q40 6 40 30 L80 30 Q80 6 60 6 Z" fill="${dg}" stroke="${dgD}" stroke-width="2.5"/>
    <circle cx="50" cy="22" r="5.5" fill="${dgD}" opacity=".5"/><circle cx="60" cy="18" r="5.5" fill="${dgD}" opacity=".5"/><circle cx="70" cy="22" r="5.5" fill="${dgD}" opacity=".5"/>
    <rect x="48" y="92" width="24" height="20" rx="10" fill="${lg}" stroke="${lgD}" stroke-width="2.5"/>
    <ellipse cx="40" cy="80" rx="7" ry="9" fill="${lg}" stroke="${lgD}" stroke-width="2"/>
    <ellipse cx="80" cy="80" rx="7" ry="9" fill="${lg}" stroke="${lgD}" stroke-width="2"/>
    <circle cx="60" cy="62" r="33" fill="url(#h${u})" stroke="${lgD}" stroke-width="3"/>
    <path d="M40 44 Q38 64 44 84" stroke="#fff" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="70" r="6" fill="${cheek}" opacity=".7"/><circle cx="80" cy="70" r="6" fill="${cheek}" opacity=".7"/>
    <ellipse cx="49" cy="60" rx="6.5" ry="9" fill="#2a2a2a"/><ellipse cx="71" cy="60" rx="6.5" ry="9" fill="#2a2a2a"/>
    <circle cx="51" cy="56" r="2.4" fill="#fff"/><circle cx="73" cy="56" r="2.4" fill="#fff"/>
    <path d="M55 74 Q60 80 65 74" stroke="${dgD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
};
