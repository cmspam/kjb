// Shiny boss overrides — alternate-language voiced lines for the rare shiny
// variants. Each boss gets a complete pool covering the lines a player will
// hear most often during a fight: catchphrase, attack names+phrases, hit
// reactions, slingshot heckle, rage cry. Other taunt categories (healthy /
// hurt / desperate / etc.) fall through to the normal Japanese pool — that
// keeps the shiny feeling like a "language overlay" rather than requiring
// 7× more writing for context-specific lines kids rarely hear.
//
// Voice/language per boss (rendered with Edge TTS). Voices match the
// gender of the original Japanese ずんだもん / 春日部つむぎ / etc. casting:
//   tako     → es-ES-ElviraNeural (Spanish, female — energetic vendor)
//   unko     → en-US-ChristopherNeural (American English, deep authoritative — NYC mafia-boss energy)
//   tral     → it-IT-DiegoNeural  (Italian, male — theatrical opera)
//   pamp     → ko-KR-SunHiNeural  (Korean, female — soft K-pop aegyo)
//   parfait  → fr-FR-DeniseNeural (French, female — sophisticated)
//   anpan    → zh-CN-YunxiNeural  (Mandarin Chinese, male — hero bravado)
//   brainrot → el-GR-AthinaNeural (Greek, female — dramatic chaos)
window.I18N = window.I18N || {};
window.I18N.shinyOverrides = {

  // tako (Spanish) — takoyaki street vendor, español TikTok energy
  tako: {
    voice: "es-ES-ElviraNeural",
    catchphrase: "¡Pulpo Pulpo Sahúr!",
    attacks: [
      { name: "¡Tinta Negra! 🐙",      type: "wild",   phrases: ["¡Tinta lista!", "¡Negro como la noche!", "¡No verás nada!"] },
      { name: "¡Octopunch Rush! 🦑",    type: "quick",  phrases: ["¡Ocho patas pa' ti!", "¡Octopunch!", "¡Boom boom boom!"] },
      { name: "¡Ventosa Pegamento! 🟣", type: "stun",   phrases: ["¡Pegado, hermano!", "¡No escapas!", "¡Ventosas!"] },
      { name: "¡Tornado Pulpo! 🌀",     type: "pierce", phrases: ["¡Da vueltas!", "¡Atrapado!", "¡Mareo total!"] },
      { name: "¡Takoyaki Bomba! 🍢",    type: "heavy",  phrases: ["¡Recién hecho!", "¡Caliente caliente!", "¡Como mi primo!"] },
    ],
    hits: [
      "¡Madre mía!", "¡Ay caramba!", "¡Olé!", "¡Qué duro!",
      "¡Pulpo pulpo!", "¡No me mates!", "¡Aguacate!", "¡Sushi no!",
      "¡Ay, octopunto!", "¡Ave María!", "¡Qué dolor!", "¡Mamacita!",
      "¡Vamos hombre!", "¡Eso duele!", "¡Pobre pulpo!", "¡Tinta tinta!",
      "¡Adiós!", "¡Qué pasa!", "¡Soy un pulpo!", "¡Dios mío!"
    ],
    taunts: {
      slingshot: ["¡Tira ya!", "¡A ver si me das!", "¡Fácil, fácil!", "¡Soy bonito!", "¡Mira mis ojos!", "¡Lánzala!", "¡Vamos vamos!", "¡No puedes!"],
      rage:      ["¡AHORA SÍ!", "¡MODO PULPO!", "¡FURIA TOTAL!", "¡INFERNO!", "¡VENGANZA!"],
    },
  },

  // unko (English NYC) — Edo べらんめえ → Brooklyn tough guy. Christopher
  // is described as "Reliable, Authority" — deeper, news-anchor weight.
  // Combined with the NYC slang script (fuhgeddaboudit / bada-bing /
  // capisce / ya killin' me here) it lands much closer to mafia-boss
  // tough-guy than the previous Guy voice.
  unko: {
    voice: "en-US-ChristopherNeural",
    catchphrase: "Bombardiro Unkodilo, fuhgeddaboudit!",
    attacks: [
      { name: "Stink Shooter 💩",    type: "wild",   phrases: ["Yo, here it comes!", "Smell THIS!", "Brown shower, ay!"] },
      { name: "Bomba Boom 💣",       type: "heavy",  phrases: ["Three two one, KABOOM!", "Capisce?", "Bada-BING!"] },
      { name: "Croco Chomp 🐊",      type: "pierce", phrases: ["I'm bitin' here!", "Get over here!", "These teeth, ay!"] },
      { name: "Robo Arm Grab 🦾",    type: "stun",   phrases: ["Mecha power!", "Gotcha!", "Squeeze this!"] },
      { name: "Tail Roll 🔄",        type: "quick",  phrases: ["Tail's a-swingin'!", "Watch out!", "Roll with me!"] },
    ],
    hits: [
      "Yo!", "Fuhgeddaboudit!", "Ay you!", "Bada bing!",
      "I'm walkin' here!", "Whatcha lookin' at?", "Capisce?", "Forget about it!",
      "Get outta here!", "Robot, but funky!", "Inside? POOP!", "This stinks!",
      "Yer kiddin' me!", "Mama mia!", "Don't poke the bomba!", "Give me a break!",
      "I oughta!", "Ya killin' me here!", "Brooklyn baby!", "Robot crocodile, ay!"
    ],
    taunts: {
      slingshot: ["Try me, kid!", "Bring it!", "Take ya shot!", "Aim, will ya?", "I'm waitin'!", "Whatcha got?", "Ya kiddin'?", "Show me whatcha got!"],
      rage:      ["BADA-BOOM!", "I'M MAD NOW!", "FUHGEDDABOUDIT!", "BROOKLYN RAGE!", "DROP DEAD MODE!"],
    },
  },

  // tral (Italian) — opera fish at home in mother tongue
  tral: {
    voice: "it-IT-DiegoNeural",
    catchphrase: "Tralalero Tralalero Pakupaku, mamma mia!",
    attacks: [
      { name: "Boccone Mostro 🦷",    type: "pierce", phrases: ["Mangia mangia!", "Tutto in bocca!", "Apertura!"] },
      { name: "Alta Voce Tralala 🎵", type: "stun",   phrases: ["♪ Tralalero!", "Bel canto!", "Soprano divino!"] },
      { name: "Lingua Schiocco 👅",   type: "quick",  phrases: ["Linguaaaa!", "Boom!", "Appiccicato!"] },
      { name: "Grido d'Opera 🎤",     type: "heavy",  phrases: ["O sole mio!", "Bellissimo!", "Forza!"] },
      { name: "Vortice Marino 🌊",    type: "wild",   phrases: ["Acqua potente!", "Vortice!", "Nuota o muori!"] },
    ],
    hits: [
      "Mamma mia!", "Bellissimo!", "Andiamo!", "Ciao!",
      "Madonna mia!", "Aiuto!", "Per favore!", "Bravo!",
      "Tralalero Tralala!", "Pakupaku Pakupaku!", "Pesce non sono io!", "Sono cantante!",
      "Dio mio!", "Cazzarola!", "Cosa fai?", "Tutto male!",
      "Dolce vita... no!", "Bel canto morente!", "Madonna santa!", "Forza Italia!"
    ],
    taunts: {
      slingshot: ["Prova me!", "Non mi prendi!", "Bellissimo me!", "Sparami!", "Tira tira!", "Andiamo!", "Coraggio!", "Mama mia, dai!"],
      rage:      ["MAMMA MIA RABBIATO!", "FORZA ITALIA!", "MODO OPERA!", "BELLISSIMO RAGE!", "FUOCO!"],
    },
  },

  // pamp (Korean) — K-pop aegyo plushie
  pamp: {
    voice: "ko-KR-SunHiNeural",
    catchphrase: "브르르 팜팜! 사랑해요~",
    attacks: [
      { name: "푹신 허그 🐑",     type: "stun",   phrases: ["꽉 안아줄게요!", "포근해요~", "따뜻해요~"] },
      { name: "쿠션 폭격 ☁️",     type: "heavy",  phrases: ["몽글몽글~", "폭신!", "쿠션 공격!"] },
      { name: "인형 폭발 🧸",     type: "wild",   phrases: ["솜이 날아가요!", "눈사태~", "하트 폭발!"] },
      { name: "부르르 지진 🌀",   type: "quick",  phrases: ["부르르~", "떨려요~", "지진 파워~"] },
      { name: "베개 공격 💗",     type: "pierce", phrases: ["꽉꽉!", "안아줘~", "놓치 않을 거야!"] },
    ],
    hits: [
      "어머어머!", "헐 대박!", "아잉~", "사랑해요!",
      "짱~", "오빠 살려줘!", "왜 그래요?", "죽을 것 같아!",
      "삐졌어!", "아파요~", "응애!", "뽀뽀!",
      "쪼옥~", "심쿵!", "와우~", "꺄아~",
      "헉!", "하트 깨졌어!", "어쩜 좋아!", "애기야 가자!"
    ],
    taunts: {
      slingshot: ["쏴봐요~", "맞춰봐!", "예쁘죠?", "어디?", "긴장돼요!", "쾅쾅!", "맞춰주세요!", "준비됐어요!"],
      rage:      ["화났어요!", "삐삐삐!", "분노 모드!", "더 이상 안 참아!", "K-POP 분노!"],
    },
  },

  // parfait (French) — chocolate parfait sushi-fish
  parfait: {
    voice: "fr-FR-DeniseNeural",
    catchphrase: "Parfait Parfait Iwashi, c'est moi!",
    attacks: [
      { name: "Tempête de Crème 🍦",  type: "wild",   phrases: ["Crème partout!", "Doux et fort!", "Mousseuuux!"] },
      { name: "Bombe Fraise 🍓",      type: "heavy",  phrases: ["Boum, fraise!", "Sucré!", "Mort par dessert!"] },
      { name: "Rayon Glacé ❄️",       type: "stun",   phrases: ["Froid froid!", "Givré!", "Tu fonds!"] },
      { name: "Sardine Splash 🐟",    type: "quick",  phrases: ["Plouf plouf!", "Pluie de poissons!", "Allez la mer!"] },
      { name: "Caramel Pétillant 🍮", type: "pierce", phrases: ["Pétille!", "Caramel!", "Sucré-amer!"] },
    ],
    hits: [
      "Mon dieu!", "Oh là là!", "C'est dommage!", "Magnifique... non!",
      "Pardon!", "Ah merde!", "Crêpe au chocolat!", "Sacrebleu!",
      "Au revoir!", "Bonjour la douleur!", "Quel fromage!", "C'est la vie!",
      "Un croissant?", "Macaron mort!", "Voilà!", "Ne me touche pas!",
      "Je suis une glace!", "Trop gentil!", "Délicieux... aïe!", "Bon appétit, idiot!"
    ],
    taunts: {
      slingshot: ["Tire alors!", "Allez!", "Pas mal!", "Vise bien!", "Je suis chocolat!", "Coquette!", "Ouvre les yeux!", "Vraiment?"],
      rage:      ["JE SUIS FÂCHÉ!", "MODE GLACE!", "ENRAGÉ!", "FRANCE FOREVER!", "RAGE DOUCE!"],
    },
  },

  // anpan (Mandarin Chinese) — hero anpan-tuna with Chinese internet swagger
  anpan: {
    voice: "zh-CN-YunxiNeural",
    catchphrase: "Anpan Anpan Anpanmaguro, 牛逼!",
    attacks: [
      { name: "红豆拳 👊",      type: "heavy",  phrases: ["新脸登场!", "红豆拳!", "正义之拳!"] },
      { name: "金枪鱼撞 🐟",    type: "quick",  phrases: ["全身金枪鱼!", "强力冲锋!", "海洋之力!"] },
      { name: "大腩软软 🍣",    type: "stun",   phrases: ["大腩软软~", "中腩力量!", "化掉吧!"] },
      { name: "果酱喷射 🟣",    type: "wild",   phrases: ["果酱叔叔!", "甜甜的!", "粘粘的!"] },
      { name: "红豆火箭 🚀",    type: "pierce", phrases: ["啾~ 起飞!", "脸部发射!", "红豆火箭!"] },
    ],
    hits: [
      "yyds!", "666!", "牛逼!", "干饭人!",
      "加油!", "我是英雄!", "面包啊!", "金枪鱼啊!",
      "果酱叔叔救命!", "好痛!", "卧槽!", "哎呀!",
      "不行不行!", "干杯!", "啊啊啊!", "哈哈哈!",
      "妈呀!", "完蛋了!", "面包脸!", "新的脸!"
    ],
    taunts: {
      slingshot: ["来啊!", "试试看!", "我很厉害!", "瞄准我!", "勇气来了!", "我是英雄!", "射吧!", "干杯!"],
      rage:      ["我生气了!", "英雄模式!", "终极愤怒!", "牛逼来了!", "无敌!"],
    },
  },

  // brainrot (Greek) — chaos king, philosophy + Greek twitter memes
  brainrot: {
    voice: "el-GR-AthinaNeural",
    catchphrase: "Brainrot King! Ωραία ωραία! Φιλοσοφία!",
    attacks: [
      { name: "Mega Φιλοσοφία 👊", type: "heavy",  phrases: ["Δύναμη όλων!", "Ωραία!", "Πάρε αυτό!"] },
      { name: "Οκτώ Πόδια 🦑",    type: "quick",  phrases: ["Όλα τα πόδια!", "Επίθεση!", "Δεν αμύνεσαι!"] },
      { name: "Χάος Ωκεανός 🌀",   type: "wild",   phrases: ["Χάος!", "Σωθείτε!", "Δεν ξέρεις!"] },
      { name: "Δάγκωμα Σαύρας 🐊", type: "pierce", phrases: ["Δόντια αιχμηρά!", "Δάγκωμα!", "Άχρηστη ασπίδα!"] },
      { name: "Πάγος Παρφέ ❄️",    type: "stun",   phrases: ["Παγωμένο!", "Δεν κινείσαι!", "Γλυκό κρύο!"] },
    ],
    hits: [
      "Γαμώτο!", "Ωραία!", "Όχι όχι!", "Ναι ναι!",
      "Φιλοσοφία!", "Μάμα μου!", "Πανικός!", "Δεν πεθαίνω!",
      "Άσε με!", "Όλα μαζί!", "Σωκράτης βοήθεια!", "Πλάτων αλήθεια!",
      "Πόνος!", "Καλά!", "Αχ!", "Τι κάνεις?",
      "Δεν αξίζει!", "Δάφνη!", "Σύμπαν!", "Τι λες!"
    ],
    taunts: {
      slingshot: ["Πάρε το!", "Έλα!", "Είμαι όμορφος!", "Στόχευσε!", "Δοκίμασε!", "Άουα!", "Δεν φοβάμαι!", "Ωραία βολή!"],
      rage:      ["ΓΑΜΩΤΟ!", "ΛΥΣΣΑ!", "ΧΑΟΣ!", "ΘΕΟΣ ΧΑΟΥΣ!", "ΣΤΟ ΑΠΟΛΥΤΟ!"],
    },
  },
};
