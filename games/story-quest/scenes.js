// Story Quest — illustrated scenes (inline SVG).
//
// Each scene returns full-bleed SVG markup. The story-quest renderer
// crossfades between scenes as the conversation progresses (when a
// node has a `scene:` key). Compared to a bare gradient backdrop, this
// is what makes the VN read as a "real" product — backstory beats
// land visually, not just in text.
//
// Authoring principles:
//   - viewBox 0 0 800 600 (matches stage), `preserveAspectRatio="xMidYMid slice"` fills.
//   - Flat-color silhouettes with 2-3 depth layers (sky / mid / fore).
//   - Hand-picked per-kaiju palettes (warm = home, cool = memory, hot = conflict).
//   - 1-2 small animated elements (SMIL <animate>) for life — drifting clouds, flickering lanterns, falling sparkles. No CPU-heavy filters.
//   - No external assets, no fonts beyond emoji glyphs.

window.Scenes = (function () {

  // ---------- shared SVG fragments ----------
  function sky(g1, g2, g3) {
    return `<defs><linearGradient id="sky-${g1.replace(/[^a-z0-9]/gi,'')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${g1}"/><stop offset="0.55" stop-color="${g2}"/><stop offset="1" stop-color="${g3}"/>
    </linearGradient></defs>
    <rect width="800" height="600" fill="url(#sky-${g1.replace(/[^a-z0-9]/gi,'')})"/>`;
  }
  function star(x, y, r, c) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="0.85">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="${2+Math.random()*3}s" repeatCount="indefinite"/></circle>`;
  }
  function lantern(x, y, color="#ffb347") {
    return `<g transform="translate(${x},${y})">
      <line x1="0" y1="-30" x2="0" y2="0" stroke="#2a1a0a" stroke-width="2"/>
      <ellipse cx="0" cy="6" rx="9" ry="12" fill="${color}" opacity="0.95">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="${1.5+Math.random()*1.5}s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="0" cy="6" rx="22" ry="22" fill="${color}" opacity="0.15"/>
    </g>`;
  }

  // =========================================================
  // TAKO TAKO SAHUR — Osaka octopus chef
  // =========================================================
  const tako_osaka_stall = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#1a0e3a", "#3a1a5a", "#5a2a7a")}
      ${[...Array(40)].map((_,i)=>star(40+i*19+Math.random()*8, 30+Math.random()*120, 1+Math.random()*1.5, "#ffe8aa")).join("")}
      <!-- distant building silhouettes -->
      <g opacity="0.55">
        <rect x="0" y="280" width="120" height="320" fill="#0a0420"/>
        <rect x="120" y="240" width="80" height="360" fill="#1a0a30"/>
        <rect x="200" y="290" width="70" height="310" fill="#0a0420"/>
        <rect x="540" y="260" width="90" height="340" fill="#1a0a30"/>
        <rect x="630" y="220" width="60" height="380" fill="#0a0420"/>
        <rect x="690" y="280" width="110" height="320" fill="#1a0a30"/>
      </g>
      <!-- distant building windows -->
      <g fill="#ffe45c" opacity="0.7">
        ${[...Array(25)].map((_,i)=>`<rect x="${20+(i*32)%780}" y="${260+(i*47)%240}" width="3" height="5"/>`).join("")}
      </g>
      <!-- neon signs -->
      <g>
        <rect x="60" y="200" width="120" height="32" rx="4" fill="#ff3b6b" opacity="0.85"/>
        <text x="120" y="223" text-anchor="middle" font-size="20" fill="#fff" font-weight="900">タコ</text>
        <rect x="580" y="180" width="140" height="38" rx="4" fill="#44eeff" opacity="0.85"/>
        <text x="650" y="206" text-anchor="middle" font-size="22" fill="#002a4a" font-weight="900">OSAKA</text>
      </g>
      <!-- street level -->
      <rect x="0" y="480" width="800" height="120" fill="#0a0420"/>
      <rect x="0" y="478" width="800" height="3" fill="#ffe45c" opacity="0.4"/>
      <!-- takoyaki stall -->
      <g transform="translate(280,360)">
        <rect x="0" y="0" width="240" height="140" fill="#7a3a1a" stroke="#3a1a0a" stroke-width="3"/>
        <rect x="-10" y="-12" width="260" height="20" fill="#cc2a2a"/>
        <text x="120" y="2" text-anchor="middle" font-size="14" fill="#fff" font-weight="900">たこやき ¥500</text>
        <!-- takoyaki pan -->
        <ellipse cx="120" cy="80" rx="80" ry="22" fill="#2a1a0a"/>
        ${[...Array(12)].map((_,i)=>`<circle cx="${60+(i%4)*30}" cy="${74+Math.floor(i/4)*8}" r="9" fill="#cca066"><animate attributeName="fill" values="#cca066;#dcaa66;#cca066" dur="${2+Math.random()}s" repeatCount="indefinite"/></circle>`).join("")}
        <!-- steam -->
        <g opacity="0.5" fill="#fff">
          <ellipse cx="80" cy="40" rx="14" ry="6"><animate attributeName="cy" values="40;10;40" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite"/></ellipse>
          <ellipse cx="140" cy="44" rx="12" ry="5"><animate attributeName="cy" values="44;14;44" dur="3.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0;0.6" dur="3.5s" repeatCount="indefinite"/></ellipse>
          <ellipse cx="170" cy="38" rx="10" ry="4"><animate attributeName="cy" values="38;8;38" dur="2.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0;0.6" dur="2.8s" repeatCount="indefinite"/></ellipse>
        </g>
      </g>
      ${lantern(110, 220, "#ff8855")}
      ${lantern(700, 200, "#ff8855")}
    </svg>`;

  const tako_deep_sea = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <defs>
        <radialGradient id="deep" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#1a4a7a"/><stop offset="0.6" stop-color="#0a2a5a"/><stop offset="1" stop-color="#02103a"/></radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#deep)"/>
      <!-- god rays -->
      <g opacity="0.18">
        <polygon points="200,0 280,0 350,600 200,600" fill="#aaddff"/>
        <polygon points="500,0 580,0 620,600 470,600" fill="#aaddff"/>
      </g>
      <!-- coral midground -->
      <g transform="translate(0,420)" fill="#cc4488" opacity="0.85">
        <ellipse cx="100" cy="60" rx="60" ry="50"/>
        <ellipse cx="180" cy="50" rx="40" ry="40"/>
        <ellipse cx="80" cy="20" rx="20" ry="25"/>
        <ellipse cx="160" cy="10" rx="14" ry="22"/>
      </g>
      <g transform="translate(620,440)" fill="#ff8855" opacity="0.85">
        <ellipse cx="80" cy="60" rx="80" ry="40"/>
        <ellipse cx="30" cy="40" rx="22" ry="30"/>
        <ellipse cx="140" cy="20" rx="14" ry="40"/>
      </g>
      <!-- kelp -->
      ${[100,160,640,700,760].map(x=>`<g transform="translate(${x},600)"><path d="M0,0 Q-${10+Math.random()*10},-100 0,-200 Q${10+Math.random()*10},-300 0,-400" stroke="#1a7a4a" stroke-width="${6+Math.random()*4}" fill="none" opacity="0.7"><animateTransform attributeName="transform" type="rotate" values="0;${-3-Math.random()*3};0;${3+Math.random()*3};0" dur="${4+Math.random()*2}s" repeatCount="indefinite"/></path></g>`).join("")}
      <!-- bubbles -->
      ${[...Array(15)].map((_,i)=>`<circle cx="${50+Math.random()*700}" cy="${500+Math.random()*100}" r="${3+Math.random()*5}" fill="#aaddff" opacity="0.6"><animate attributeName="cy" values="${500+Math.random()*100};0" dur="${5+Math.random()*4}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="${5+Math.random()*4}s" repeatCount="indefinite"/></circle>`).join("")}
      <!-- distant fish -->
      <g opacity="0.5">
        ${[...Array(8)].map((_,i)=>{const y=100+i*55; return `<g transform="translate(0,${y})"><ellipse cx="0" cy="0" rx="14" ry="6" fill="#ffaa44"><animateTransform attributeName="transform" type="translate" values="0,0;900,${Math.random()*20-10}" dur="${10+Math.random()*8}s" repeatCount="indefinite"/></ellipse></g>`}).join("")}
      </g>
    </svg>`;

  // =========================================================
  // UNKO — Bombardiro Unkodilo's swamp empire
  // =========================================================
  const unko_swamp_empire = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#3a2a0a", "#5a3a1a", "#7a4a1a")}
      <!-- mist -->
      <g opacity="0.2">
        <ellipse cx="200" cy="220" rx="220" ry="40" fill="#88aa88"><animate attributeName="cx" values="200;600;200" dur="20s" repeatCount="indefinite"/></ellipse>
        <ellipse cx="500" cy="180" rx="180" ry="30" fill="#aabbaa"><animate attributeName="cx" values="500;100;500" dur="25s" repeatCount="indefinite"/></ellipse>
      </g>
      <!-- distant dead trees -->
      <g stroke="#1a0a0a" stroke-width="3" fill="none" opacity="0.7">
        <path d="M100,400 L100,260 M100,310 L80,290 M100,330 L120,310 M100,280 L70,255"/>
        <path d="M700,420 L700,250 M700,300 L680,270 M700,320 L720,300 M700,280 L730,260"/>
        <path d="M250,410 L250,280 M250,330 L235,310"/>
        <path d="M550,415 L550,290 M550,340 L535,320 M550,310 L565,290"/>
      </g>
      <!-- swamp water -->
      <rect x="0" y="380" width="800" height="220" fill="#2a3a1a"/>
      <g opacity="0.55" fill="#4a5a2a">
        <ellipse cx="100" cy="500" rx="60" ry="6"/>
        <ellipse cx="300" cy="540" rx="80" ry="7"/>
        <ellipse cx="500" cy="490" rx="70" ry="6"/>
        <ellipse cx="700" cy="520" rx="60" ry="6"/>
      </g>
      <!-- lily pads -->
      <g>
        <ellipse cx="180" cy="480" rx="32" ry="8" fill="#2a6a2a"/>
        <ellipse cx="380" cy="510" rx="40" ry="10" fill="#1a5a1a"/>
        <ellipse cx="620" cy="500" rx="30" ry="7" fill="#2a6a2a"/>
      </g>
      <!-- TOILET THRONES rising from the swamp -->
      <g transform="translate(140,360)">
        <ellipse cx="40" cy="80" rx="46" ry="14" fill="#0a0a0a" opacity="0.5"/>
        <rect x="10" y="20" width="60" height="40" rx="6" fill="#ddccaa" stroke="#666" stroke-width="2"/>
        <ellipse cx="40" cy="22" rx="32" ry="9" fill="#666"/>
        <ellipse cx="40" cy="22" rx="26" ry="6" fill="#2a2a2a"/>
        <rect x="22" y="-20" width="36" height="30" rx="4" fill="#ddccaa" stroke="#666" stroke-width="2"/>
      </g>
      <g transform="translate(560,330)">
        <ellipse cx="40" cy="100" rx="50" ry="16" fill="#0a0a0a" opacity="0.5"/>
        <rect x="10" y="30" width="60" height="50" rx="6" fill="#ddccaa" stroke="#666" stroke-width="2"/>
        <ellipse cx="40" cy="32" rx="32" ry="9" fill="#666"/>
        <ellipse cx="40" cy="32" rx="26" ry="6" fill="#2a2a2a"/>
        <rect x="22" y="-12" width="36" height="38" rx="4" fill="#ddccaa" stroke="#666" stroke-width="2"/>
        <!-- crown on this throne -->
        <polygon points="22,-12 30,-30 40,-20 50,-30 58,-12" fill="#ffe45c" stroke="#aa7700"/>
      </g>
      <!-- fireflies -->
      ${[...Array(20)].map((_,i)=>`<circle cx="${100+Math.random()*600}" cy="${150+Math.random()*250}" r="2" fill="#ffe45c"><animate attributeName="opacity" values="0;1;0" dur="${1.5+Math.random()*2}s" begin="${Math.random()*3}s" repeatCount="indefinite"/></circle>`).join("")}
    </svg>`;

  const unko_throne_room = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <defs>
        <radialGradient id="thrglow" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#5a2a0a"/><stop offset="1" stop-color="#1a0500"/></radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#thrglow)"/>
      <!-- columns -->
      <g fill="#3a2010" stroke="#1a0500" stroke-width="3">
        <rect x="60" y="100" width="50" height="500"/>
        <rect x="690" y="100" width="50" height="500"/>
        <ellipse cx="85" cy="100" rx="40" ry="15"/>
        <ellipse cx="715" cy="100" rx="40" ry="15"/>
      </g>
      <!-- pipes dripping -->
      <g stroke="#666" stroke-width="6" fill="none">
        <path d="M200,0 L200,120 Q200,140 220,140 L580,140 Q600,140 600,160 L600,180"/>
      </g>
      <g fill="#88aaff" opacity="0.7">
        <ellipse cx="280" cy="170" rx="3" ry="6"><animate attributeName="cy" values="170;500" dur="2s" begin="0s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2s" begin="0s" repeatCount="indefinite"/></ellipse>
        <ellipse cx="380" cy="170" rx="3" ry="6"><animate attributeName="cy" values="170;500" dur="2.2s" begin="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.2s" begin="0.5s" repeatCount="indefinite"/></ellipse>
        <ellipse cx="480" cy="170" rx="3" ry="6"><animate attributeName="cy" values="170;500" dur="1.8s" begin="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.8s" begin="1s" repeatCount="indefinite"/></ellipse>
      </g>
      <!-- giant porcelain throne -->
      <g transform="translate(400,520)">
        <ellipse cx="0" cy="40" rx="220" ry="30" fill="#000" opacity="0.5"/>
        <rect x="-160" y="-180" width="320" height="200" rx="20" fill="#f5f0dc" stroke="#776655" stroke-width="4"/>
        <ellipse cx="0" cy="-180" rx="140" ry="30" fill="#776655"/>
        <ellipse cx="0" cy="-180" rx="120" ry="22" fill="#1a0500"/>
        <rect x="-100" y="-340" width="200" height="160" rx="20" fill="#f5f0dc" stroke="#776655" stroke-width="4"/>
        <polygon points="-100,-340 0,-400 100,-340" fill="#aa6633"/>
        <!-- bomb fuse on top -->
        <circle cx="0" cy="-380" r="14" fill="#2a2a2a"/>
        <path d="M0,-394 L-10,-410 L4,-418" stroke="#aa3300" stroke-width="3" fill="none"/>
        <circle cx="4" cy="-418" r="3" fill="#ff4444"><animate attributeName="r" values="3;5;3" dur="0.4s" repeatCount="indefinite"/></circle>
      </g>
      <!-- floor -->
      <rect x="0" y="560" width="800" height="40" fill="#0a0500"/>
    </svg>`;

  // =========================================================
  // TEMEE — Mongolian camel-monkey backstory
  // =========================================================
  const temee_mongolia_day = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <defs>
        <linearGradient id="mong-sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffa44a"/><stop offset="0.5" stop-color="#ff7733"/><stop offset="1" stop-color="#7a3a3a"/></linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#mong-sky)"/>
      <!-- sun -->
      <circle cx="600" cy="240" r="60" fill="#fff0aa" opacity="0.95"/>
      <circle cx="600" cy="240" r="90" fill="#ffcc66" opacity="0.3"/>
      <!-- distant mountains -->
      <g fill="#5a2a44" opacity="0.85">
        <polygon points="0,400 120,290 220,360 340,250 460,330 580,280 720,360 800,310 800,420 0,420"/>
      </g>
      <g fill="#3a1a30" opacity="0.95">
        <polygon points="0,440 80,360 180,400 280,330 380,400 480,360 600,420 720,380 800,440 800,520 0,520"/>
      </g>
      <!-- steppe ground -->
      <rect x="0" y="440" width="800" height="160" fill="#6a4a2a"/>
      <rect x="0" y="438" width="800" height="6" fill="#8a6a3a"/>
      <!-- grass tufts -->
      ${[...Array(30)].map((_,i)=>`<line x1="${i*27+Math.random()*15}" y1="450" x2="${i*27+Math.random()*15}" y2="${440+Math.random()*6}" stroke="#3a2a1a" stroke-width="1"/>`).join("")}
      <!-- yurt (ger) -->
      <g transform="translate(180,400)">
        <ellipse cx="0" cy="40" rx="50" ry="12" fill="#000" opacity="0.4"/>
        <path d="M-50,40 L-50,10 Q-50,-30 0,-50 Q50,-30 50,10 L50,40 Z" fill="#ddccaa" stroke="#5a3a2a" stroke-width="2"/>
        <rect x="-12" y="14" width="24" height="26" fill="#5a3a2a"/>
        <line x1="-50" y1="10" x2="50" y2="10" stroke="#5a3a2a" stroke-width="1"/>
        <!-- smoke from chimney -->
        <ellipse cx="0" cy="-60" rx="6" ry="4" fill="#ddd" opacity="0.6"><animate attributeName="cy" values="-60;-160" dur="6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="6s" repeatCount="indefinite"/></ellipse>
      </g>
      <!-- lone camel in distance -->
      <g transform="translate(580,420)" fill="#3a2010">
        <ellipse cx="0" cy="0" rx="20" ry="8"/>
        <path d="M-18,0 Q-22,-12 -8,-14 Q0,-22 8,-14 Q22,-12 18,0"/>
        <line x1="-15" y1="8" x2="-15" y2="20" stroke="#3a2010" stroke-width="3"/>
        <line x1="-8" y1="8" x2="-8" y2="20" stroke="#3a2010" stroke-width="3"/>
        <line x1="8" y1="8" x2="8" y2="20" stroke="#3a2010" stroke-width="3"/>
        <line x1="15" y1="8" x2="15" y2="20" stroke="#3a2010" stroke-width="3"/>
        <ellipse cx="-22" cy="-4" rx="6" ry="5"/>
      </g>
      <!-- soaring eagle silhouette -->
      <g transform="translate(380,180)" fill="#2a1a0a">
        <path d="M0,0 Q-30,-8 -45,2 Q-30,4 0,0 Q30,4 45,2 Q30,-8 0,0">
          <animateTransform attributeName="transform" type="translate" values="0,0;-200,40;0,0;200,40;0,0" dur="20s" repeatCount="indefinite"/>
        </path>
      </g>
    </svg>`;

  const temee_herd_lost = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#1a0a3a", "#3a1a5a", "#aa4a4a")}
      <!-- moon -->
      <circle cx="180" cy="180" r="40" fill="#fff5cc" opacity="0.95"/>
      <circle cx="180" cy="180" r="55" fill="#fff5cc" opacity="0.2"/>
      <!-- stars -->
      ${[...Array(40)].map(()=>star(Math.random()*800, Math.random()*250, 1+Math.random(), "#fff")).join("")}
      <!-- mountains -->
      <g fill="#1a0a2a"><polygon points="0,440 120,330 220,400 340,290 460,370 580,320 720,400 800,350 800,460 0,460"/></g>
      <!-- ground -->
      <rect x="0" y="440" width="800" height="160" fill="#0a0512"/>
      <!-- empty yurt skeleton (abandoned) -->
      <g transform="translate(420,420)" stroke="#3a2a3a" stroke-width="2" fill="none">
        <path d="M-50,20 L-50,-10 L-30,-30 L0,-40 L30,-30 L50,-10 L50,20"/>
        <line x1="-50" y1="-10" x2="50" y2="-10"/>
        <line x1="-30" y1="-30" x2="30" y2="-30"/>
        <!-- scattered cloth -->
        <path d="M-20,20 Q-10,16 0,18 Q10,20 -20,22" stroke="#5a4a44" stroke-width="3"/>
      </g>
      <!-- single feather drifting -->
      <g transform="translate(360,300)" fill="#ddd" opacity="0.85">
        <ellipse cx="0" cy="0" rx="3" ry="14"/>
        <line x1="0" y1="-12" x2="0" y2="14" stroke="#888" stroke-width="0.5"/>
        <animateTransform attributeName="transform" type="translate" values="360,300;380,420;370,460" dur="9s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="rotate" additive="sum" values="0;30;-30;30;0" dur="9s" repeatCount="indefinite"/>
      </g>
      <!-- single tiny camel silhouette in the very far distance, walking away -->
      <g transform="translate(700,425)" fill="#1a0510" opacity="0.7">
        <ellipse cx="0" cy="0" rx="8" ry="3"/>
        <path d="M-7,0 Q-9,-5 -3,-6 Q0,-9 3,-6 Q9,-5 7,0"/>
        <line x1="-5" y1="3" x2="-5" y2="8" stroke="#1a0510" stroke-width="1"/>
        <line x1="5" y1="3" x2="5" y2="8" stroke="#1a0510" stroke-width="1"/>
      </g>
    </svg>`;

  const temee_ghenghis_throne = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#5a2a1a", "#aa4a2a", "#ffaa55")}
      <!-- mountains -->
      <g fill="#1a0a10" opacity="0.9"><polygon points="0,300 100,170 200,240 300,140 400,220 500,150 600,230 700,160 800,250 800,400 0,400"/></g>
      <!-- ground / camp -->
      <rect x="0" y="380" width="800" height="220" fill="#3a1a0a"/>
      <!-- banners on poles -->
      ${[120,260,540,680].map((x,i)=>`<g transform="translate(${x},380)"><line x1="0" y1="0" x2="0" y2="-120" stroke="#2a1a0a" stroke-width="3"/><polygon points="0,-120 30,-110 0,-90" fill="#cc2a2a"/><polygon points="0,-90 30,-80 0,-60" fill="#aa1a1a"/></g>`).join("")}
      <!-- giant throne carved of stone -->
      <g transform="translate(400,520)">
        <ellipse cx="0" cy="30" rx="180" ry="20" fill="#000" opacity="0.5"/>
        <rect x="-120" y="-180" width="240" height="200" rx="6" fill="#5a4a3a" stroke="#1a0a05" stroke-width="3"/>
        <rect x="-140" y="-220" width="280" height="50" rx="4" fill="#3a2a1a" stroke="#1a0a05" stroke-width="3"/>
        <!-- skull motif -->
        <ellipse cx="0" cy="-260" rx="22" ry="20" fill="#ddccaa"/>
        <ellipse cx="-8" cy="-260" rx="4" ry="6" fill="#0a0500"/>
        <ellipse cx="8" cy="-260" rx="4" ry="6" fill="#0a0500"/>
        <rect x="-3" y="-250" width="6" height="4" fill="#0a0500"/>
      </g>
    </svg>`;

  // =========================================================
  // TRAL — Italian opera fish
  // =========================================================
  const tral_opera_house = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <defs>
        <linearGradient id="opera-bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5a1010"/><stop offset="1" stop-color="#2a0505"/></linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#opera-bg)"/>
      <!-- gold-trim arch -->
      <g fill="#cc9933" stroke="#aa7700" stroke-width="2">
        <path d="M40,100 L40,500 L80,500 L80,140 Q400,80 720,140 L720,500 L760,500 L760,100 Z"/>
      </g>
      <!-- red curtains -->
      <g fill="#aa0e0e">
        <path d="M80,140 Q120,180 100,260 Q140,300 120,400 Q160,440 140,500 L80,500 Z"/>
        <path d="M720,140 Q680,180 700,260 Q660,300 680,400 Q640,440 660,500 L720,500 Z"/>
      </g>
      <g fill="#ffcc66" opacity="0.4">
        <path d="M85,150 L95,500"/><path d="M105,170 L115,500"/>
        <path d="M715,150 L705,500"/><path d="M695,170 L685,500"/>
      </g>
      <!-- chandelier -->
      <g transform="translate(400,80)">
        <line x1="0" y1="-30" x2="0" y2="30" stroke="#222" stroke-width="2"/>
        <ellipse cx="0" cy="30" rx="60" ry="20" fill="#ffcc44" opacity="0.85"/>
        <g fill="#ffe88c">
          ${[-40,-20,0,20,40].map(x=>`<circle cx="${x}" cy="30" r="6"><animate attributeName="opacity" values="0.7;1;0.7" dur="${2+Math.random()*2}s" repeatCount="indefinite"/></circle>`).join("")}
        </g>
        <ellipse cx="0" cy="50" rx="90" ry="30" fill="#ffcc44" opacity="0.2"/>
      </g>
      <!-- stage floor -->
      <rect x="140" y="490" width="520" height="110" fill="#3a1a1a"/>
      <rect x="140" y="488" width="520" height="4" fill="#cc9933"/>
      <!-- balcony hint, audience silhouettes -->
      <g fill="#0a0205" opacity="0.7">
        ${[...Array(20)].map((_,i)=>`<ellipse cx="${180+i*22}" cy="${560+(i%3)*4}" rx="8" ry="10"/>`).join("")}
      </g>
    </svg>`;

  const tral_fish_market = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#ffd49a", "#ffaa66", "#88bbdd")}
      <!-- venetian buildings -->
      <g>
        <rect x="40" y="200" width="180" height="280" fill="#cc7744"/>
        <rect x="220" y="180" width="160" height="300" fill="#aa5533"/>
        <rect x="420" y="220" width="170" height="260" fill="#dd8855"/>
        <rect x="600" y="160" width="160" height="320" fill="#bb6644"/>
        <!-- windows w/ shutters -->
        ${[60,100,140,180,240,280,320,440,480,520,560,620,660,700].map((x,i)=>`<g><rect x="${x}" y="${260+(i%3)*40}" width="22" height="32" fill="#2a1a0a"/><rect x="${x-2}" y="${260+(i%3)*40-4}" width="4" height="40" fill="#5a3322"/><rect x="${x+22}" y="${260+(i%3)*40-4}" width="4" height="40" fill="#5a3322"/></g>`).join("")}
      </g>
      <!-- canal -->
      <rect x="0" y="480" width="800" height="120" fill="#3a6a8a"/>
      <g fill="#aaccdd" opacity="0.6">
        ${[...Array(8)].map((_,i)=>`<ellipse cx="${i*100+40}" cy="${500+(i%2)*20}" rx="40" ry="3"><animate attributeName="cx" values="${i*100+40};${i*100+60};${i*100+40}" dur="${3+Math.random()*2}s" repeatCount="indefinite"/></ellipse>`).join("")}
      </g>
      <!-- gondola -->
      <g transform="translate(400,520)">
        <path d="M-60,0 L60,0 L40,15 L-40,15 Z" fill="#1a0a0a"/>
        <line x1="0" y1="-30" x2="0" y2="0" stroke="#2a1a0a" stroke-width="2"/>
        <line x1="0" y1="-30" x2="20" y2="-25" stroke="#2a1a0a" stroke-width="2"/>
        <ellipse cx="0" cy="-40" rx="6" ry="10" fill="#1a0a0a"/>
        <animateTransform attributeName="transform" type="translate" values="400,520;420,520;400,520" dur="3s" repeatCount="indefinite"/>
      </g>
      <!-- fish on display in foreground -->
      <g transform="translate(0,560)">
        <rect x="0" y="0" width="800" height="40" fill="#4a4a4a"/>
        ${[...Array(15)].map((_,i)=>`<g transform="translate(${i*55+30},20)"><path d="M0,0 Q-20,-10 -25,0 Q-20,10 0,0" fill="${["#88aadd","#ddaa88","#aaccaa","#dddd88"][i%4]}"/><circle cx="-18" cy="-1" r="1.5" fill="#fff"/></g>`).join("")}
      </g>
    </svg>`;

  // =========================================================
  // PAMP — Pink fluffy plushy dreamscape
  // =========================================================
  const pamp_cloud_factory = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#ffcce0", "#ffaadd", "#ff88cc")}
      <!-- floating clouds -->
      ${[...Array(8)].map((_,i)=>{const x=Math.random()*800,y=80+Math.random()*250,s=0.7+Math.random()*0.8; return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="50" ry="20" fill="#ffe8f4"/><ellipse cx="-20" cy="-10" rx="30" ry="18" fill="#ffe8f4"/><ellipse cx="25" cy="-8" rx="28" ry="16" fill="#ffe8f4"/><animateTransform attributeName="transform" type="translate" values="${x},${y};${x+50},${y};${x},${y}" dur="${8+Math.random()*4}s" repeatCount="indefinite"/></g>`}).join("")}
      <!-- giant ribbon spool -->
      <g transform="translate(400,420)">
        <ellipse cx="0" cy="80" rx="160" ry="22" fill="#cc66aa" opacity="0.5"/>
        <ellipse cx="0" cy="0" rx="120" ry="120" fill="#ffaadd" stroke="#cc66aa" stroke-width="4"/>
        <ellipse cx="0" cy="0" rx="120" ry="120" fill="none" stroke="#ff88cc" stroke-width="4" stroke-dasharray="20 6"/>
        <ellipse cx="0" cy="0" rx="40" ry="40" fill="#ddffee" stroke="#cc66aa" stroke-width="3"/>
        <animateTransform attributeName="transform" type="rotate" values="0 400 420; 360 400 420" dur="30s" repeatCount="indefinite" additive="sum"/>
      </g>
      <!-- ribbons floating -->
      ${[...Array(6)].map((_,i)=>{const x=Math.random()*800; return `<g transform="translate(${x},0)"><path d="M0,0 Q-15,80 0,160 Q15,240 0,320 Q-15,400 0,480 Q15,560 0,640" stroke="#ff88cc" stroke-width="6" fill="none" opacity="0.6"><animateTransform attributeName="transform" type="translate" values="${x},-100;${x},700" dur="${10+Math.random()*5}s" repeatCount="indefinite"/></path></g>`}).join("")}
      <!-- sparkles -->
      ${[...Array(25)].map(()=>`<text x="${Math.random()*800}" y="${Math.random()*600}" font-size="${10+Math.random()*10}" fill="#fff" opacity="0.8">✨<animate attributeName="opacity" values="0;1;0" dur="${1+Math.random()*2}s" begin="${Math.random()*3}s" repeatCount="indefinite"/></text>`).join("")}
    </svg>`;

  const pamp_toy_shop = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <rect width="800" height="600" fill="#3a1a3a"/>
      <!-- shop window frame -->
      <g fill="#ffaadd" stroke="#cc66aa" stroke-width="4">
        <rect x="40" y="60" width="720" height="500" rx="20"/>
        <rect x="60" y="80" width="700" height="460" rx="12" fill="#ffe8f4"/>
      </g>
      <!-- shelves -->
      <g stroke="#cc66aa" stroke-width="3">
        <line x1="60" y1="240" x2="760" y2="240"/>
        <line x1="60" y1="400" x2="760" y2="400"/>
      </g>
      <!-- plushies on shelves -->
      <g>
        <g transform="translate(140,200)"><circle cx="0" cy="0" r="30" fill="#ff88cc"/><circle cx="-12" cy="-5" r="4" fill="#000"/><circle cx="12" cy="-5" r="4" fill="#000"/><path d="M-8,6 Q0,12 8,6" stroke="#000" stroke-width="2" fill="none"/><polygon points="-20,-26 -8,-30 -14,-18" fill="#ff88cc"/><polygon points="20,-26 8,-30 14,-18" fill="#ff88cc"/></g>
        <g transform="translate(280,210)"><circle cx="0" cy="0" r="26" fill="#ffaadd"/><circle cx="-10" cy="-4" r="3" fill="#000"/><circle cx="10" cy="-4" r="3" fill="#000"/><path d="M-6,4 Q0,9 6,4" stroke="#000" stroke-width="2" fill="none"/></g>
        <g transform="translate(420,200)"><circle cx="0" cy="0" r="32" fill="#ddaaff"/><circle cx="-13" cy="-5" r="4" fill="#000"/><circle cx="13" cy="-5" r="4" fill="#000"/><path d="M-7,7 Q0,12 7,7" stroke="#000" stroke-width="2" fill="none"/></g>
        <g transform="translate(560,205)"><circle cx="0" cy="0" r="28" fill="#ffccaa"/><circle cx="-11" cy="-4" r="3" fill="#000"/><circle cx="11" cy="-4" r="3" fill="#000"/></g>
        <g transform="translate(680,210)"><circle cx="0" cy="0" r="26" fill="#aaeeff"/><circle cx="-10" cy="-4" r="3" fill="#000"/><circle cx="10" cy="-4" r="3" fill="#000"/></g>
      </g>
      <g>
        <g transform="translate(180,360)"><rect x="-30" y="-30" width="60" height="60" rx="14" fill="#ff66bb"/><circle cx="-12" cy="-8" r="4" fill="#fff"/><circle cx="12" cy="-8" r="4" fill="#fff"/></g>
        <g transform="translate(340,360)"><rect x="-30" y="-30" width="60" height="60" rx="14" fill="#88ccff"/></g>
        <g transform="translate(500,360)"><rect x="-30" y="-30" width="60" height="60" rx="14" fill="#ffcc66"/></g>
        <g transform="translate(640,360)"><rect x="-30" y="-30" width="60" height="60" rx="14" fill="#aaffaa"/></g>
      </g>
      <!-- big "SALE" sign -->
      <g transform="translate(400,490)">
        <rect x="-80" y="-30" width="160" height="50" rx="10" fill="#ff3b6b"/>
        <text x="0" y="6" text-anchor="middle" font-size="34" fill="#fff" font-weight="900" letter-spacing="4">SALE</text>
      </g>
      <!-- rain on window outside (soft, melancholic) -->
      <g stroke="#88ccdd" stroke-width="1" opacity="0.4">
        ${[...Array(40)].map((_,i)=>`<line x1="${i*22+Math.random()*5}" y1="0" x2="${i*22-6+Math.random()*5}" y2="60"><animate attributeName="y2" values="0;600" dur="${0.8+Math.random()*0.5}s" repeatCount="indefinite"/><animate attributeName="y1" values="-60;540" dur="${0.8+Math.random()*0.5}s" repeatCount="indefinite"/></line>`).join("")}
      </g>
    </svg>`;

  // =========================================================
  // PARFAIT — underwater sardine cafe
  // =========================================================
  const parfait_underwater_cafe = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <defs>
        <linearGradient id="parfait-bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#aaeeff"/><stop offset="1" stop-color="#3a88cc"/></linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#parfait-bg)"/>
      <!-- bubbles -->
      ${[...Array(30)].map(()=>`<circle cx="${Math.random()*800}" cy="${300+Math.random()*300}" r="${2+Math.random()*4}" fill="#fff" opacity="0.5"><animate attributeName="cy" values="${600+Math.random()*100};-30" dur="${4+Math.random()*5}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0" dur="${4+Math.random()*5}s" repeatCount="indefinite"/></circle>`).join("")}
      <!-- god rays -->
      <g opacity="0.18">
        <polygon points="100,0 200,0 300,600 100,600" fill="#fff"/>
        <polygon points="500,0 600,0 660,600 480,600" fill="#fff"/>
      </g>
      <!-- counter -->
      <rect x="0" y="440" width="800" height="160" fill="#5a3a88"/>
      <rect x="0" y="436" width="800" height="6" fill="#ffaacc"/>
      <!-- parfait glasses lined up on counter -->
      ${[...Array(7)].map((_,i)=>`<g transform="translate(${80+i*110},440)">
        <path d="M-22,0 L-18,-60 L18,-60 L22,0 Z" fill="#fff" opacity="0.7" stroke="#ddd" stroke-width="2"/>
        <rect x="-18" y="-55" width="36" height="15" fill="#ff6666"/>
        <rect x="-18" y="-40" width="36" height="12" fill="#ffd07a"/>
        <rect x="-18" y="-28" width="36" height="14" fill="#fff"/>
        <circle cx="0" cy="-62" r="6" fill="#cc1144"/>
        <path d="M0,-68 Q-3,-78 0,-86 Q3,-78 0,-68" stroke="#1a8844" stroke-width="2" fill="none"/>
      </g>`).join("")}
      <!-- floating sardine waiters with tiny aprons -->
      ${[...Array(4)].map((_,i)=>{const x=140+i*180,y=180+(i%2)*60; return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="0" rx="30" ry="14" fill="#ddccaa"/><polygon points="-30,0 -45,-10 -45,10" fill="#ddccaa"/><polygon points="30,0 22,-8 22,8" fill="#ddccaa"/><circle cx="-22" cy="-3" r="2.5" fill="#000"/><rect x="-12" y="2" width="24" height="14" fill="#fff" stroke="#cc6688" stroke-width="1"/><animateTransform attributeName="transform" type="translate" values="${x},${y};${x},${y-15};${x},${y}" dur="${3+Math.random()*2}s" repeatCount="indefinite"/></g>`}).join("")}
      <!-- chandelier of cherries -->
      <g transform="translate(400,40)">
        <line x1="0" y1="0" x2="0" y2="40" stroke="#1a8844" stroke-width="2"/>
        <g transform="translate(0,60)">
          <circle cx="-25" cy="0" r="14" fill="#cc1144"/>
          <circle cx="0" cy="0" r="14" fill="#cc1144"/>
          <circle cx="25" cy="0" r="14" fill="#cc1144"/>
        </g>
      </g>
    </svg>`;

  const parfait_ice_cave = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <defs>
        <radialGradient id="ice" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#ddeeff"/><stop offset="1" stop-color="#5588aa"/></radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#ice)"/>
      <!-- icicles top -->
      ${[...Array(15)].map((_,i)=>`<polygon points="${i*55},0 ${i*55+20},0 ${i*55+10},${40+Math.random()*60}" fill="#bbddee" stroke="#88aacc" stroke-width="1"/>`).join("")}
      <!-- icicles bottom -->
      ${[...Array(15)].map((_,i)=>`<polygon points="${i*55},600 ${i*55+20},600 ${i*55+10},${500+Math.random()*60}" fill="#bbddee" stroke="#88aacc" stroke-width="1"/>`).join("")}
      <!-- frozen parfaits embedded in walls -->
      ${[120, 300, 500, 680].map((x,i)=>`<g transform="translate(${x},${260+(i%2)*40})">
        <ellipse cx="0" cy="0" rx="40" ry="50" fill="#aaccee" opacity="0.5" stroke="#88aacc" stroke-width="2"/>
        <path d="M-15,-30 L-12,20 L12,20 L15,-30 Z" fill="#fff" opacity="0.7"/>
        <rect x="-12" y="-25" width="24" height="12" fill="#cc6699" opacity="0.8"/>
        <rect x="-12" y="-13" width="24" height="10" fill="#ffcc66" opacity="0.8"/>
        <rect x="-12" y="-3" width="24" height="12" fill="#fff" opacity="0.9"/>
        <circle cx="0" cy="-32" r="4" fill="#cc1144"/>
      </g>`).join("")}
      <!-- sparkles -->
      ${[...Array(30)].map(()=>`<text x="${Math.random()*800}" y="${Math.random()*600}" font-size="${8+Math.random()*8}" fill="#fff" opacity="0.7">✦<animate attributeName="opacity" values="0;1;0" dur="${1+Math.random()*2}s" begin="${Math.random()*3}s" repeatCount="indefinite"/></text>`).join("")}
    </svg>`;

  // =========================================================
  // ANPAN — bakery / bread fish identity crisis
  // =========================================================
  const anpan_bakery = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#ffcca0", "#ffaa66", "#cc7744")}
      <!-- bakery interior walls -->
      <rect x="0" y="200" width="800" height="400" fill="#dd9966"/>
      <rect x="0" y="200" width="800" height="6" fill="#aa6633"/>
      <!-- wooden shelves -->
      <g>
        <rect x="40" y="240" width="720" height="14" fill="#5a3322"/>
        <rect x="40" y="380" width="720" height="14" fill="#5a3322"/>
        <rect x="40" y="520" width="720" height="14" fill="#5a3322"/>
      </g>
      <!-- breads on shelves -->
      <g>
        ${[...Array(8)].map((_,i)=>`<g transform="translate(${90+i*85},230)"><ellipse cx="0" cy="0" rx="32" ry="14" fill="#cc8855"/><ellipse cx="0" cy="-5" rx="28" ry="12" fill="#dd9966"/><circle cx="-8" cy="-5" r="2" fill="#5a3322"/><circle cx="8" cy="-5" r="2" fill="#5a3322"/></g>`).join("")}
        ${[...Array(7)].map((_,i)=>`<g transform="translate(${90+i*95},370)"><rect x="-32" y="-15" width="64" height="15" rx="6" fill="#cc7744"/><rect x="-32" y="-15" width="64" height="6" rx="3" fill="#dd9966"/></g>`).join("")}
        <!-- ANPAN row -->
        ${[...Array(8)].map((_,i)=>`<g transform="translate(${90+i*85},510)"><circle cx="0" cy="0" r="22" fill="#aa3322"/><ellipse cx="-5" cy="-6" rx="6" ry="3" fill="#cc4422"/><circle cx="0" cy="0" r="22" fill="none" stroke="#5a1111" stroke-width="1" opacity="0.5"/></g>`).join("")}
      </g>
      <!-- WINDOW showing ocean -->
      <g>
        <rect x="280" y="40" width="240" height="140" fill="#88ccff" stroke="#aa6633" stroke-width="6"/>
        <line x1="400" y1="40" x2="400" y2="180" stroke="#aa6633" stroke-width="3"/>
        <line x1="280" y1="110" x2="520" y2="110" stroke="#aa6633" stroke-width="3"/>
        <!-- water -->
        <rect x="284" y="120" width="232" height="56" fill="#3a88cc"/>
        <!-- fish silhouettes in window -->
        <g fill="#1a5a8a" opacity="0.7">
          <ellipse cx="350" cy="150" rx="10" ry="4"/>
          <polygon points="340,150 332,145 332,155" fill="#1a5a8a"/>
          <ellipse cx="460" cy="160" rx="8" ry="3"/>
        </g>
      </g>
      <!-- sign over the door -->
      <g transform="translate(680,160)">
        <rect x="-40" y="-20" width="80" height="36" rx="6" fill="#5a3322"/>
        <text x="0" y="4" text-anchor="middle" font-size="16" fill="#ffe8aa" font-weight="900">パン</text>
      </g>
    </svg>`;

  const anpan_ocean = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#cce8ff", "#88bbdd", "#5a88aa")}
      <!-- horizon -->
      <rect x="0" y="320" width="800" height="280" fill="#3a6a99"/>
      <line x1="0" y1="320" x2="800" y2="320" stroke="#88ccee" stroke-width="2"/>
      <!-- waves -->
      <g stroke="#88bbdd" stroke-width="2" fill="none" opacity="0.7">
        <path d="M0,360 Q100,350 200,360 T400,360 T600,360 T800,360"/>
        <path d="M0,400 Q100,390 200,400 T400,400 T600,400 T800,400"/>
        <path d="M0,440 Q100,430 200,440 T400,440 T600,440 T800,440"/>
      </g>
      <!-- bread loaves floating like boats -->
      ${[100,260,420,580,720].map((x,i)=>`<g transform="translate(${x},${280+(i%2)*30})"><ellipse cx="0" cy="20" rx="40" ry="6" fill="#000" opacity="0.3"/><ellipse cx="0" cy="0" rx="40" ry="22" fill="#cc8855"/><ellipse cx="0" cy="-8" rx="34" ry="18" fill="#dd9966"/><path d="M-26,-4 L-22,8 M-12,-8 L-8,10 M2,-8 L6,10 M16,-4 L20,8" stroke="#aa6633" stroke-width="1"/><animateTransform attributeName="transform" type="translate" values="${x},${280+(i%2)*30};${x},${275+(i%2)*30};${x},${280+(i%2)*30}" dur="${3+i*0.5}s" repeatCount="indefinite"/></g>`).join("")}
      <!-- one bread with a tiny fish tail (the protagonist!) -->
      <g transform="translate(400,200)">
        <ellipse cx="0" cy="20" rx="50" ry="8" fill="#000" opacity="0.3"/>
        <ellipse cx="0" cy="0" rx="50" ry="28" fill="#cc8855"/>
        <ellipse cx="0" cy="-8" rx="42" ry="22" fill="#dd9966"/>
        <polygon points="48,0 65,-12 65,12" fill="#5588aa"/>
        <circle cx="-28" cy="-4" r="3" fill="#000"/>
      </g>
      <!-- seagulls -->
      <g fill="none" stroke="#fff" stroke-width="2.5" opacity="0.85">
        <path d="M180,120 Q190,110 200,120 Q210,110 220,120"/>
        <path d="M520,80 Q530,72 540,80 Q550,72 560,80"/>
        <path d="M640,150 Q648,143 656,150 Q664,143 672,150"/>
      </g>
    </svg>`;

  // =========================================================
  // CATCHERSKI — hacked UFO catcher
  // =========================================================
  const catcherski_arcade = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <rect width="800" height="600" fill="#0a0220"/>
      <!-- floor grid -->
      <g stroke="#ff00aa" stroke-width="1" opacity="0.4">
        ${[...Array(12)].map((_,i)=>`<line x1="0" y1="${450+i*15}" x2="800" y2="${450+i*15}"/>`).join("")}
        ${[...Array(12)].map((_,i)=>{const offs=(i-6)*80; return `<line x1="${400+offs}" y1="450" x2="${400+offs*4}" y2="600"/>`}).join("")}
      </g>
      <!-- back wall with arcade machines -->
      ${[80,220,360,500,640].map((x,i)=>`<g transform="translate(${x},180)">
        <rect x="-50" y="0" width="100" height="260" fill="#1a0530" stroke="#ff00aa" stroke-width="2"/>
        <rect x="-40" y="20" width="80" height="80" fill="#220944" stroke="#88ccff" stroke-width="1"/>
        <text x="0" y="50" text-anchor="middle" font-size="18" fill="#${["88ccff","ffcc44","ff6699","aaffaa","ff8855"][i]}" font-weight="900"><animate attributeName="opacity" values="0.6;1;0.6" dur="${1+i*0.3}s" repeatCount="indefinite"/>★</text>
        <rect x="-30" y="120" width="60" height="20" fill="#ff00aa"/>
        <circle cx="-15" cy="160" r="6" fill="#ff4444"/>
        <circle cx="15" cy="160" r="6" fill="#44ff44"/>
        <rect x="-30" y="200" width="60" height="40" fill="#0a0220"/>
      </g>`).join("")}
      <!-- featured UFO catcher front and center -->
      <g transform="translate(400,400)">
        <rect x="-100" y="-160" width="200" height="220" fill="#1a0530" stroke="#ff00aa" stroke-width="3"/>
        <rect x="-90" y="-150" width="180" height="160" fill="#220944" stroke="#88ccff" stroke-width="2"/>
        <!-- claw -->
        <g transform="translate(0,-130)">
          <line x1="0" y1="-20" x2="0" y2="10" stroke="#ccc" stroke-width="3"/>
          <polygon points="-12,10 0,30 12,10" fill="#888" stroke="#444" stroke-width="2"/>
          <line x1="-12" y1="10" x2="-16" y2="28" stroke="#888" stroke-width="3"/>
          <line x1="12" y1="10" x2="16" y2="28" stroke="#888" stroke-width="3"/>
        </g>
        <!-- emoji prizes inside -->
        <text x="-50" y="-30" font-size="24" text-anchor="middle">🐙</text>
        <text x="0" y="-30" font-size="24" text-anchor="middle">💩</text>
        <text x="50" y="-30" font-size="24" text-anchor="middle">🐫</text>
        <text x="-30" y="0" font-size="22" text-anchor="middle">🐟</text>
        <text x="30" y="0" font-size="22" text-anchor="middle">🍦</text>
        <!-- coin slot + buttons -->
        <rect x="-80" y="20" width="160" height="38" fill="#0a0220" stroke="#ff00aa" stroke-width="2"/>
        <circle cx="-40" cy="38" r="10" fill="#ff4444"/>
        <circle cx="0" cy="38" r="10" fill="#ffcc44"/>
        <circle cx="40" cy="38" r="10" fill="#44ff44"/>
        <!-- glitch lines crossing the cabinet -->
        <rect x="-100" y="-80" width="200" height="3" fill="#ff00aa" opacity="0.7"><animate attributeName="y" values="-160;60;-160" dur="2s" repeatCount="indefinite"/></rect>
      </g>
      <!-- Cyrillic graffiti on back wall -->
      <text x="60" y="100" font-size="22" fill="#ff00aa" font-weight="900" opacity="0.8">ВЗЛОМ</text>
      <text x="600" y="120" font-size="18" fill="#88ccff" font-weight="900" opacity="0.8">УКРАЛ</text>
    </svg>`;

  const catcherski_hacked = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <rect width="800" height="600" fill="#000"/>
      <!-- terminal scan lines -->
      <g stroke="#00ff66" stroke-width="1" opacity="0.15">
        ${[...Array(60)].map((_,i)=>`<line x1="0" y1="${i*10}" x2="800" y2="${i*10}"/>`).join("")}
      </g>
      <!-- glitching text matrix -->
      <g font-family="monospace" font-weight="900" font-size="18" fill="#00ff66" opacity="0.95">
        <text x="40" y="60">> ACCESS GRANTED</text>
        <text x="40" y="90">> ИДЕНТИФИКАЦИЯ...</text>
        <text x="40" y="120">> TARGET: 🐙 ▓▓▓▓▓░░░</text>
        <text x="40" y="150">> TARGET: 💩 ▓▓▓▓▓▓▓░</text>
        <text x="40" y="180">> ОШИБКА ОШИБКА</text>
        <text x="40" y="210" fill="#ff3366">> WRONG ANSWER STOLEN</text>
        <text x="40" y="240">> RETURNING TO USER...</text>
        <text x="40" y="270">> STATUS: ИЗВИНИТЕ</text>
      </g>
      <!-- giant ? -->
      <text x="640" y="380" font-size="280" fill="#ff00aa" font-weight="900" opacity="0.8">?</text>
      <!-- random glitch bars -->
      <g>
        <rect x="0" y="320" width="800" height="8" fill="#ff00aa" opacity="0.8"><animate attributeName="x" values="-200;200;-200" dur="0.6s" repeatCount="indefinite"/></rect>
        <rect x="0" y="440" width="800" height="4" fill="#00ff66" opacity="0.6"><animate attributeName="x" values="100;-200;100" dur="0.9s" repeatCount="indefinite"/></rect>
      </g>
    </svg>`;

  // =========================================================
  // BRAINROT — space lion / black hole
  // =========================================================
  const brainrot_blackhole = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <rect width="800" height="600" fill="#000"/>
      <!-- stars -->
      ${[...Array(80)].map(()=>star(Math.random()*800,Math.random()*600,Math.random()*1.5+0.3,"#fff")).join("")}
      <!-- distant nebula -->
      <ellipse cx="120" cy="120" rx="180" ry="60" fill="#aa44dd" opacity="0.15"/>
      <ellipse cx="680" cy="80" rx="160" ry="50" fill="#4488ff" opacity="0.15"/>
      <!-- accretion disk -->
      <g transform="translate(400,320)">
        <ellipse cx="0" cy="0" rx="260" ry="60" fill="none" stroke="#ff8844" stroke-width="2" opacity="0.7"/>
        <ellipse cx="0" cy="0" rx="220" ry="50" fill="none" stroke="#ffcc44" stroke-width="2" opacity="0.8"/>
        <ellipse cx="0" cy="0" rx="180" ry="40" fill="none" stroke="#ff8844" stroke-width="2" opacity="0.5"/>
        <!-- swirling particles -->
        ${[...Array(40)].map((_,i)=>{const a=Math.random()*Math.PI*2; const r=160+Math.random()*120; return `<circle cx="${Math.cos(a)*r}" cy="${Math.sin(a)*r*0.25}" r="${1+Math.random()*2}" fill="#ffaa66"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="${10+Math.random()*8}s" repeatCount="indefinite"/></circle>`}).join("")}
      </g>
      <!-- black hole -->
      <g transform="translate(400,320)">
        <circle cx="0" cy="0" r="100" fill="#000"/>
        <circle cx="0" cy="0" r="100" fill="none" stroke="#ffcc44" stroke-width="3" opacity="0.5"/>
      </g>
      <!-- mane swirling around (cosmic lion silhouette) -->
      <g transform="translate(400,320)" opacity="0.55">
        ${[...Array(24)].map((_,i)=>{const a=(i/24)*Math.PI*2; const x1=Math.cos(a)*120,y1=Math.sin(a)*120; const x2=Math.cos(a)*200,y2=Math.sin(a)*200; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffaa88" stroke-width="3" stroke-linecap="round"/>`}).join("")}
      </g>
    </svg>`;

  // =========================================================
  // VARIANT SCENES — additional moods/times-of-day for variety.
  // These either expand the rotating landing-page backdrop or get
  // used by future conversations that want a different vibe than
  // the base location.
  // =========================================================

  const tako_osaka_dawn = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#ffa888", "#ffcc77", "#aacccc")}
      <circle cx="640" cy="380" r="44" fill="#fff0aa"/>
      <circle cx="640" cy="380" r="68" fill="#ffcc66" opacity="0.4"/>
      <!-- distant buildings, paler -->
      <g opacity="0.6">
        <rect x="0" y="280" width="120" height="320" fill="#3a2244"/>
        <rect x="120" y="240" width="80" height="360" fill="#2a1233"/>
        <rect x="200" y="290" width="70" height="310" fill="#3a2244"/>
        <rect x="540" y="260" width="90" height="340" fill="#2a1233"/>
        <rect x="630" y="220" width="60" height="380" fill="#3a2244"/>
        <rect x="690" y="280" width="110" height="320" fill="#2a1233"/>
      </g>
      <rect x="0" y="480" width="800" height="120" fill="#1a0a30"/>
      <!-- shutters half-open over the stall -->
      <g transform="translate(280,360)">
        <rect x="0" y="0" width="240" height="140" fill="#5a2a1a" stroke="#3a1a0a" stroke-width="3"/>
        <rect x="-10" y="-12" width="260" height="20" fill="#882222"/>
        <text x="120" y="2" text-anchor="middle" font-size="14" fill="#fff" font-weight="900">closed</text>
        <rect x="20" y="20" width="200" height="40" fill="#1a0a0a"/>
      </g>
      <!-- early bird, single seagull -->
      <g fill="none" stroke="#fff" stroke-width="2.5">
        <path d="M280,160 Q288,153 296,160 Q304,153 312,160"/>
      </g>
    </svg>`;

  const unko_dawn_empty = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#5a4a66", "#aa8866", "#ddaa77")}
      <!-- dawn over the abandoned empire -->
      <circle cx="500" cy="380" r="50" fill="#fff0aa" opacity="0.95"/>
      <g stroke="#1a0a0a" stroke-width="3" fill="none" opacity="0.8">
        <path d="M100,400 L100,260 M100,310 L80,290 M100,330 L120,310"/>
        <path d="M700,420 L700,250 M700,300 L680,270 M700,320 L720,300"/>
        <path d="M250,410 L250,280 M250,330 L235,310"/>
        <path d="M550,415 L550,290 M550,340 L535,320"/>
      </g>
      <rect x="0" y="380" width="800" height="220" fill="#3a3a2a"/>
      <g>
        <ellipse cx="180" cy="480" rx="32" ry="8" fill="#5a6a4a"/>
        <ellipse cx="380" cy="510" rx="40" ry="10" fill="#4a5a3a"/>
        <ellipse cx="620" cy="500" rx="30" ry="7" fill="#5a6a4a"/>
      </g>
      <!-- empty toilets, now overgrown with vines -->
      <g transform="translate(140,360)">
        <ellipse cx="40" cy="80" rx="46" ry="14" fill="#0a0a0a" opacity="0.4"/>
        <rect x="10" y="20" width="60" height="40" rx="6" fill="#bbaa99" stroke="#666" stroke-width="2"/>
        <ellipse cx="40" cy="22" rx="32" ry="9" fill="#666"/>
        <path d="M10,60 Q20,68 30,60 Q40,68 50,60" stroke="#1a5a1a" stroke-width="3" fill="none"/>
      </g>
      <g transform="translate(560,330)">
        <ellipse cx="40" cy="100" rx="50" ry="16" fill="#0a0a0a" opacity="0.4"/>
        <rect x="10" y="30" width="60" height="50" rx="6" fill="#bbaa99" stroke="#666" stroke-width="2"/>
        <path d="M10,80 Q20,88 30,80 Q40,88 50,80" stroke="#1a5a1a" stroke-width="3" fill="none"/>
      </g>
    </svg>`;

  const temee_mountain_pass = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#88aadd", "#aaccdd", "#ddeeff")}
      <!-- snowy mountains layered -->
      <g fill="#445566" opacity="0.9"><polygon points="0,350 100,180 220,280 340,160 460,260 580,200 720,300 800,240 800,420 0,420"/></g>
      <g fill="#fff" opacity="0.9"><polygon points="0,360 100,200 110,210 220,290 230,300 340,180 350,190 460,270 580,220 590,230 720,310 730,320 800,260 800,365 0,365"/></g>
      <g fill="#223344" opacity="0.85"><polygon points="0,440 80,330 180,400 280,300 380,400 480,330 600,420 720,360 800,440 800,520 0,520"/></g>
      <!-- ground -->
      <rect x="0" y="440" width="800" height="160" fill="#7a6a44"/>
      <!-- footprints leading away -->
      <g fill="#5a4a2a" opacity="0.55">
        ${[100,160,220,280,340,400,460,520,580,640].map((x,i)=>`<ellipse cx="${x}" cy="${480+(i%2)*8}" rx="9" ry="5"/>`).join("")}
      </g>
      <!-- a single eagle -->
      <g transform="translate(380,200)" fill="#2a1a0a">
        <path d="M0,0 Q-30,-8 -45,2 Q-30,4 0,0 Q30,4 45,2 Q30,-8 0,0">
          <animateTransform attributeName="transform" type="translate" values="0,0;-180,30;0,0;180,30;0,0" dur="22s" repeatCount="indefinite"/>
        </path>
      </g>
    </svg>`;

  const catcherski_dark_arcade = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <rect width="800" height="600" fill="#030010"/>
      <!-- floor grid faded -->
      <g stroke="#220044" stroke-width="1" opacity="0.4">
        ${[...Array(12)].map((_,i)=>`<line x1="0" y1="${450+i*15}" x2="800" y2="${450+i*15}"/>`).join("")}
      </g>
      <!-- single working machine, others off -->
      ${[80,220,360,500,640].map((x,i)=>`<g transform="translate(${x},180)">
        <rect x="-50" y="0" width="100" height="260" fill="${i===2?"#1a0530":"#0a0210"}" stroke="${i===2?"#ff00aa":"#221033"}" stroke-width="${i===2?2:1}"/>
        <rect x="-40" y="20" width="80" height="80" fill="${i===2?"#220944":"#080010"}"/>
        ${i===2?`<text x="0" y="50" text-anchor="middle" font-size="18" fill="#88ccff" font-weight="900"><animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>★</text>`:""}
      </g>`).join("")}
      <!-- single sad lantern -->
      ${lantern(120, 100, "#88aaff")}
    </svg>`;

  const pamp_toy_shop_night = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <rect width="800" height="600" fill="#1a0a2a"/>
      <g fill="#ffaadd" stroke="#cc66aa" stroke-width="3" opacity="0.85">
        <rect x="40" y="60" width="720" height="500" rx="20"/>
        <rect x="60" y="80" width="700" height="460" rx="12" fill="#3a1a4a"/>
      </g>
      <!-- shelves dim -->
      <g stroke="#5a2a55" stroke-width="3" opacity="0.6">
        <line x1="60" y1="240" x2="760" y2="240"/>
        <line x1="60" y1="400" x2="760" y2="400"/>
      </g>
      <!-- single plushy spotlight -->
      <g transform="translate(420,300)">
        <circle cx="0" cy="0" r="120" fill="#fff" opacity="0.08"/>
        <circle cx="0" cy="0" r="40" fill="#ffaadd"/>
        <circle cx="-13" cy="-5" r="4" fill="#000"/>
        <circle cx="13" cy="-5" r="4" fill="#000"/>
        <path d="M-7,7 Q0,12 7,7" stroke="#000" stroke-width="2" fill="none"/>
        <polygon points="-26,-32 -10,-38 -18,-22" fill="#ffaadd"/>
        <polygon points="26,-32 10,-38 18,-22" fill="#ffaadd"/>
      </g>
      <!-- stars through the window -->
      ${[...Array(15)].map(()=>star(80+Math.random()*640, 80+Math.random()*100, 0.5+Math.random()*1, "#fff")).join("")}
    </svg>`;

  const parfait_cafe_night = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <defs>
        <radialGradient id="cafe-night" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#445566"/><stop offset="1" stop-color="#0a1122"/></radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#cafe-night)"/>
      <!-- god rays from above -->
      <g opacity="0.18">
        <polygon points="200,0 280,0 350,600 200,600" fill="#ffcc88"/>
        <polygon points="500,0 580,0 620,600 470,600" fill="#ffcc88"/>
      </g>
      <!-- counter -->
      <rect x="0" y="440" width="800" height="160" fill="#3a1a55"/>
      <rect x="0" y="436" width="800" height="6" fill="#ffcc66"/>
      <!-- ANNIVERSARY parfait — taller, with sparkles -->
      <g transform="translate(400,440)">
        <path d="M-30,0 L-22,-100 L22,-100 L30,0 Z" fill="#fff" opacity="0.7" stroke="#ddd" stroke-width="2"/>
        <rect x="-22" y="-92" width="44" height="20" fill="#ff5566"/>
        <rect x="-22" y="-72" width="44" height="16" fill="#ffd07a"/>
        <rect x="-22" y="-56" width="44" height="18" fill="#fff"/>
        <rect x="-22" y="-38" width="44" height="18" fill="#cc88ff"/>
        <circle cx="0" cy="-104" r="10" fill="#cc1144"/>
        <path d="M0,-114 Q-5,-126 0,-138 Q5,-126 0,-114" stroke="#1a8844" stroke-width="2" fill="none"/>
        <!-- big "10TH" banner -->
        <text x="0" y="20" text-anchor="middle" font-size="20" fill="#ffe45c" font-weight="900">10TH</text>
      </g>
      <!-- sparkles -->
      ${[...Array(40)].map(()=>`<text x="${Math.random()*800}" y="${Math.random()*600}" font-size="${8+Math.random()*10}" fill="#ffe45c" opacity="0.85">✨<animate attributeName="opacity" values="0;1;0" dur="${1+Math.random()*2}s" begin="${Math.random()*3}s" repeatCount="indefinite"/></text>`).join("")}
    </svg>`;

  const anpan_bakery_morning = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#ffeecc", "#ffccaa", "#ddaa77")}
      <!-- bright bakery interior -->
      <rect x="0" y="200" width="800" height="400" fill="#eeccaa"/>
      <rect x="0" y="200" width="800" height="6" fill="#cc9966"/>
      <g>
        <rect x="40" y="240" width="720" height="14" fill="#5a3322"/>
        <rect x="40" y="380" width="720" height="14" fill="#5a3322"/>
        <rect x="40" y="520" width="720" height="14" fill="#5a3322"/>
      </g>
      <g>
        ${[...Array(8)].map((_,i)=>`<g transform="translate(${90+i*85},230)"><ellipse cx="0" cy="0" rx="32" ry="14" fill="#cc8855"/><ellipse cx="0" cy="-5" rx="28" ry="12" fill="#eecc99"/><circle cx="-8" cy="-5" r="2" fill="#5a3322"/><circle cx="8" cy="-5" r="2" fill="#5a3322"/><!-- steam --><ellipse cx="0" cy="-22" rx="6" ry="3" fill="#fff" opacity="0.6"><animate attributeName="cy" values="-22;-50" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="3s" repeatCount="indefinite"/></ellipse></g>`).join("")}
        ${[...Array(7)].map((_,i)=>`<g transform="translate(${90+i*95},370)"><rect x="-32" y="-15" width="64" height="15" rx="6" fill="#cc7744"/><rect x="-32" y="-15" width="64" height="6" rx="3" fill="#eecc99"/></g>`).join("")}
        ${[...Array(8)].map((_,i)=>`<g transform="translate(${90+i*85},510)"><circle cx="0" cy="0" r="22" fill="#aa3322"/><ellipse cx="-5" cy="-6" rx="6" ry="3" fill="#cc4422"/></g>`).join("")}
      </g>
      <!-- "OPEN" sign -->
      <g transform="translate(400,160)">
        <rect x="-50" y="-22" width="100" height="44" rx="10" fill="#1a8844" stroke="#fff" stroke-width="3"/>
        <text x="0" y="6" text-anchor="middle" font-size="22" fill="#fff" font-weight="900">OPEN</text>
      </g>
    </svg>`;

  const tral_curtain_fall = () => `
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      ${sky("#1a0808", "#3a1010", "#000")}
      <!-- closed dark red curtains (fallen) -->
      <g fill="#660808">
        <rect x="0" y="0" width="800" height="600"/>
      </g>
      <g fill="#990a0a">
        ${[...Array(16)].map((_,i)=>`<rect x="${i*50+4}" y="0" width="42" height="600" rx="20"/>`).join("")}
      </g>
      <g fill="#330404" opacity="0.5">
        ${[...Array(16)].map((_,i)=>`<rect x="${i*50+22}" y="0" width="6" height="600"/>`).join("")}
      </g>
      <!-- single rose dropped on stage -->
      <g transform="translate(400,560)">
        <circle cx="0" cy="0" r="14" fill="#cc1144"/>
        <circle cx="-6" cy="-4" r="6" fill="#aa0033"/>
        <circle cx="6" cy="-4" r="6" fill="#aa0033"/>
        <line x1="0" y1="14" x2="60" y2="40" stroke="#226622" stroke-width="3"/>
        <ellipse cx="40" cy="32" rx="14" ry="6" fill="#226622"/>
      </g>
      <!-- spotlight ring fading -->
      <circle cx="400" cy="560" r="80" fill="#ffe45c" opacity="0.06"/>
      <circle cx="400" cy="560" r="40" fill="#ffe45c" opacity="0.10"/>
    </svg>`;

  // ---------- registry ----------
  const SCENES = {
    "tako-osaka-stall":      tako_osaka_stall,
    "tako-deep-sea":         tako_deep_sea,
    "unko-swamp-empire":     unko_swamp_empire,
    "unko-throne-room":      unko_throne_room,
    "temee-mongolia-day":    temee_mongolia_day,
    "temee-herd-lost":       temee_herd_lost,
    "temee-ghenghis-throne": temee_ghenghis_throne,
    "tral-opera-house":      tral_opera_house,
    "tral-fish-market":      tral_fish_market,
    "pamp-cloud-factory":    pamp_cloud_factory,
    "pamp-toy-shop":         pamp_toy_shop,
    "parfait-underwater-cafe": parfait_underwater_cafe,
    "parfait-ice-cave":      parfait_ice_cave,
    "anpan-bakery":          anpan_bakery,
    "anpan-ocean":           anpan_ocean,
    "catcherski-arcade":     catcherski_arcade,
    "catcherski-hacked":     catcherski_hacked,
    "brainrot-blackhole":    brainrot_blackhole,
    "tako-osaka-dawn":       tako_osaka_dawn,
    "unko-dawn-empty":       unko_dawn_empty,
    "temee-mountain-pass":   temee_mountain_pass,
    "catcherski-dark-arcade":catcherski_dark_arcade,
    "pamp-toy-shop-night":   pamp_toy_shop_night,
    "parfait-cafe-night":    parfait_cafe_night,
    "anpan-bakery-morning":  anpan_bakery_morning,
    "tral-curtain-fall":     tral_curtain_fall,
  };

  return {
    exists: (id) => !!SCENES[id],
    render: (id) => SCENES[id] ? SCENES[id]() : "",
    list:   () => Object.keys(SCENES),
  };
})();
