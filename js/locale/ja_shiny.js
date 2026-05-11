// Shiny boss overrides — alternate-language voiced lines for the rare shiny
// variants. Each boss gets a FULL pool covering every category the engine
// might pick from during a fight: catchphrase, attack names+phrases, hit
// reactions, and ALL nine taunt categories (slingshot / rage / healthy /
// hurt / desperate / raged / player_low_hp / high_combo / part_lost).
//
// Audio path: when the runtime detects shiny mode it looks in
// assets/voices/<bossId>_shiny/<hash>.opus first; if missing it falls back
// to the normal-language opus so the kid never hits a silent line.
//
// Voice/language per boss. Most are rendered via Edge TTS; tagged "user"
// means human-recorded by the project author and encoded via the m4a→opus
// pipeline in tools/voicegen/. Voices match the gender of the original
// Japanese ずんだもん / 春日部つむぎ / etc. casting:
//   tako     → es-ES-ElviraNeural (Spanish, female — energetic vendor)
//   unko     → user (English NYC, recorded — Christopher TTS replaced)
//   tral     → it-IT-DiegoNeural  (Italian, male — theatrical opera)
//   pamp     → ko-KR-SunHiNeural  (Korean, female — soft K-pop aegyo)
//   parfait  → fr-FR-DeniseNeural (French, female — sophisticated)
//   anpan    → zh-CN-YunxiNeural  (Mandarin Chinese, male — hero bravado)
//   temee    → user (Mongolian, recorded — old-warrior Genghis-Khan-via-Roshi)
//   catcherski → ru-RU-DmitryNeural (Russian, male — back-alley hacker)
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
      slingshot:     ["¡Tira ya!", "¡A ver si me das!", "¡Fácil, fácil!", "¡Soy bonito!", "¡Mira mis ojos!", "¡Lánzala!", "¡Vamos vamos!", "¡No puedes!"],
      rage:          ["¡AHORA SÍ!", "¡MODO PULPO!", "¡FURIA TOTAL!", "¡INFERNO!", "¡VENGANZA!"],
      healthy:       ["¡Soy fuerte!", "¡No me ganas!", "¡Más preguntas!", "¡Tan fácil!", "¡Vamos chico!", "¡Sigue intentando!"],
      hurt:          ["¡Ay, eso duele!", "¡Casi, casi!", "¡No pares!", "¡Buena!", "¡Bien jugado!", "¡Me cuesta!"],
      desperate:     ["¡Mamá!", "¡Ay no, perdón!", "¡Tengo hambre!", "¡Quiero dormir!", "¡Adiós, mundo!", "¡No puedo más!"],
      raged:         ["¡FURIA PULPO!", "¡AHORA EN SERIO!", "¡INFERNO TOTAL!", "¡8 PATAS RAGE!", "¡VENGANZA YA!"],
      player_low_hp: ["¡Casi tuyo!", "¡Te debilitas!", "¡Adiós chico!", "¡Cobarde!"],
      high_combo:    ["¡Para ya!", "¡Combo loco!", "¡Qué pánico!", "¡No es justo!"],
      part_lost:     ["¡Mi parte!", "¡Tramposo!", "¡Ay no!", "¡Devuélvemela!", "¡Aaah!"],
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
    // The healthy/hurt/desperate/raged/player_low_hp/high_combo/part_lost
    // categories all draw from lines already in the user's recording pool
    // (catchphrase + attack phrases + hits + slingshot + rage), picked to
    // fit each emotional context. No extra recording needed — these strings
    // hash to existing assets/voices/unko_shiny/<hash>.opus files.
    taunts: {
      slingshot:     ["Try me, kid!", "Bring it!", "Take ya shot!", "Aim, will ya?", "I'm waitin'!", "Whatcha got?", "Ya kiddin'?", "Show me whatcha got!"],
      rage:          ["BADA-BOOM!", "I'M MAD NOW!", "FUHGEDDABOUDIT!", "BROOKLYN RAGE!", "DROP DEAD MODE!"],
      // boss confident / dismissive — reuse slingshot taunts (cocky energy)
      healthy:       ["Try me, kid!", "Bring it!", "Whatcha got?", "Show me whatcha got!", "Ya kiddin'?", "Forget about it!"],
      // boss took some damage — defiant hit reactions
      hurt:          ["Ay you!", "Yer kiddin' me!", "Give me a break!", "I oughta!", "Capisce?", "I'm walkin' here!"],
      // boss almost dead — panicky hit reactions
      desperate:     ["Mama mia!", "Don't poke the bomba!", "Ya killin' me here!", "This stinks!", "Inside? POOP!", "Forget about it!"],
      // rage mode active — same as rage cries
      raged:         ["BADA-BOOM!", "I'M MAD NOW!", "FUHGEDDABOUDIT!", "BROOKLYN RAGE!", "DROP DEAD MODE!"],
      // gloating at weak player
      player_low_hp: ["Brooklyn baby!", "Bada bing!", "Get outta here!", "Ya kiddin'?"],
      // rattled by a high combo
      high_combo:    ["Yer kiddin' me!", "Bada bing!", "Ya killin' me here!", "Whatcha lookin' at?"],
      // boss lost a body part — complaining
      part_lost:     ["Mama mia!", "Yer kiddin' me!", "Ya killin' me here!", "Don't poke the bomba!", "I oughta!"],
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
      slingshot:     ["Prova me!", "Non mi prendi!", "Bellissimo me!", "Sparami!", "Tira tira!", "Andiamo!", "Coraggio!", "Mama mia, dai!"],
      rage:          ["MAMMA MIA RABBIATO!", "FORZA ITALIA!", "MODO OPERA!", "BELLISSIMO RAGE!", "FUOCO!"],
      healthy:       ["Sono forte!", "Non puoi battermi!", "Più domande!", "Continua bambino!", "Tralalero canta!", "Mamma mia, prova!"],
      hurt:          ["Ahi!", "Quasi quasi!", "Non fermarti!", "Bello!", "Bravo!", "Madonna mia!"],
      desperate:     ["Mamma!", "Aiuto, aiuto!", "Non posso!", "Perdono!", "Sonno!", "Addio mondo!"],
      raged:         ["RABBIA TOTALE!", "ORA SI!", "MAMMA MIA RAGE!", "OPERA INFERNO!", "FORZA MASSIMA!"],
      player_low_hp: ["Quasi morto!", "Debole!", "Ciao bambino!", "Codardo!"],
      high_combo:    ["Fermati!", "Combo pazzo!", "Madonna santa!", "Panico!"],
      part_lost:     ["La mia parte!", "Tradimento!", "Ahi!", "Non prendere!", "Ahhhh!"],
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
      slingshot:     ["쏴봐요~", "맞춰봐!", "예쁘죠?", "어디?", "긴장돼요!", "쾅쾅!", "맞춰주세요!", "준비됐어요!"],
      rage:          ["화났어요!", "삐삐삐!", "분노 모드!", "더 이상 안 참아!", "K-POP 분노!"],
      healthy:       ["팜팜이 강해요!", "더 시도해봐요!", "쉽지 않아요!", "팜팜은 짱!", "헐 약해!", "왜 그래요?"],
      hurt:          ["아잉 아파!", "운 좋네!", "괜찮아요!", "더 와!", "잘했어요!", "아이고!"],
      desperate:     ["엄마!", "헉 안돼!", "미안해!", "죽을 것 같아!", "졸려요~", "안녕 세상아!"],
      raged:         ["분노 아이!", "팜팜 화났어!", "K-RAGE!", "삐삐삐 분노!", "용서 안 해!"],
      player_low_hp: ["거의 다 됐어!", "약하잖아!", "안녕!", "겁쟁이!"],
      high_combo:    ["그만!", "콤보 무서워!", "어머어머!", "패닉이야!"],
      part_lost:     ["내 파츠~!", "나쁜 사람!", "아파아파!", "가져가지마!", "어어어!"],
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
      slingshot:     ["Tire alors!", "Allez!", "Pas mal!", "Vise bien!", "Je suis chocolat!", "Coquette!", "Ouvre les yeux!", "Vraiment?"],
      rage:          ["JE SUIS FÂCHÉ!", "MODE GLACE!", "ENRAGÉ!", "FRANCE FOREVER!", "RAGE DOUCE!"],
      healthy:       ["Je suis forte!", "Tu peux pas!", "Encore une question!", "Trop facile!", "Sois sérieux!", "Quelle blague!"],
      hurt:          ["Aïe!", "Presque!", "Continue!", "Pas mal!", "Bien joué!", "Sacré bleu!"],
      desperate:     ["Maman!", "Au secours!", "Pardon!", "J'ai faim!", "Sommeil...", "Adieu monde!"],
      raged:         ["RAGE FRANÇAISE!", "MAINTENANT!", "GLACE RAGE!", "PARFAIT FUREUR!", "JE BRÛLE!"],
      player_low_hp: ["Presque mort!", "Faible!", "Adieu!", "Lâche!"],
      high_combo:    ["Stop!", "Combo fou!", "Mon dieu!", "Panique!"],
      part_lost:     ["Ma partie!", "Tricheur!", "Aïe!", "Ne prends pas!", "Aaah!"],
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
      slingshot:     ["来啊!", "试试看!", "我很厉害!", "瞄准我!", "勇气来了!", "我是英雄!", "射吧!", "干杯!"],
      rage:          ["我生气了!", "英雄模式!", "终极愤怒!", "牛逼来了!", "无敌!"],
      healthy:       ["我超强!", "再来吧!", "太简单!", "不行不行!", "yyds!", "666继续!"],
      hurt:          ["哎哟!", "差一点!", "不停!", "干杯!", "好球!", "妈呀!"],
      desperate:     ["妈妈!", "救命!", "对不起!", "饿啊!", "困了!", "再见世界!"],
      raged:         ["真生气!", "现在!", "英雄愤怒!", "终极模式!", "无敌怒!"],
      player_low_hp: ["你完了!", "弱啊!", "再见!", "胆小鬼!"],
      high_combo:    ["停!", "连击疯了!", "妈呀!", "慌张!"],
      part_lost:     ["我的部分!", "作弊!", "痛!", "别拿!", "啊啊啊!"],
    },
  },

  // temee (Mongolian) — old-warrior camel-monkey speaks his ancestral tongue.
  // VOICE IS USER-RECORDED: lines are recorded by the user (a native Mongolian
  // speaker) into ~/Documents/Sound Recordings/ following the script in
  // tools/voicegen/temee_shiny_script.md, then encoded by encode_temee.py
  // to assets/voices/temee_shiny/<hash>.opus. The taunt categories that
  // weren't independently recorded (healthy/hurt/raged/player_low_hp) reuse
  // strings from the recorded pool — same trick unko_shiny uses — so no
  // extra recording is needed for them.
  temee: {
    voice: "user",  // human voice acting, see tools/voicegen/temee_shiny_script.md
    catchphrase: "Би Тэмээ Сармагчин энд байна! Бөхгүй хүн бүхэн, бөх ургуул!",
    attacks: [
      // Names stay in Mongolian for visual override; only phrases get voiced.
      { name: "Хөлдсөн бууз 🥟",         type: "heavy",  phrases: ["Хөлдөөсөн бууз ниснэ!", "Хатуу хөлдсөн!", "Энэ миний оройн хоол!"] },
      { name: "Говийн шуурга 🌪️",       type: "wild",   phrases: ["Говийн шуурга!", "Элсэнд булагд!", "Нүдээ нээж чадахгүй биз?"] },
      { name: "-40°C Өвөл ❄️",           type: "stun",   phrases: ["Говийн өвлийг мэдэх үү?", "Хасах дөчин градус, хөлдөөнө!", "Чичирч унт!"] },
      { name: "Талын зүсэлт 🌿",         type: "pierce", phrases: ["Талын өвс хутга мэт!", "Шааж явъя!", "Монгол өвсийг бүү басамжил!"] },
      { name: "Хоёр бөхт цохилт 🐫",     type: "quick",  phrases: ["Бөхөөрөө дарна!", "Хоёр бөхтэй шүү!", "Тэмээний хүч!"] },
    ],
    hits: [
      "За, чи их сайн юм байна", "Сахал минь...!", "Бөхөнд минь хүрчихлээ", "Сайн юм байна, бяцхан",
      "Хэхэхэ...", "Сармагчин толгой минь өвдөж байна!", "Юу гэж...!", "Элс нүдэнд орлоо",
      "Тэмээ ч бас өвддөг шүү!", "Би өвгөн шүү дээ...?", "Бөх минь хонхойлоо...", "Ммм, хүчтэй юм байна",
      "Сүүл минь...", "Гнг, хараахан...", "Би хараахан унаагүй ээ", "Үнэхээр өвдөж байна...",
      "Гнг, бууз минь...!"
    ],
    taunts: {
      slingshot:     ["Чиг нь сулхан байна!", "Хүрэх болов уу?", "Би тэмээ шүү, хурдан зугтдаг!", "Бууд л доо!", "Өвгөнийг бүү басамжил!", "Над хүрэхэд зуун жил эрт байна!"],
      rage:          ["БИ УУРЛАЛАА!", "ӨРШӨӨХГҮЙ ЭЭ!", "ГОВИД ТЭМЦЭЛДЬЕ!", "САРМАГЧНЫ УУРЫГ МЭД!", "ЧИНГИС ХААНЫ ҮР УДАМ!"],
      // boss confident at full HP — reuse slingshot taunts (cocky energy)
      healthy:       ["Чиг нь сулхан байна!", "Хүрэх болов уу?", "Би тэмээ шүү, хурдан зугтдаг!", "Бууд л доо!", "Өвгөнийг бүү басамжил!", "Над хүрэхэд зуун жил эрт байна!"],
      // boss took some damage — defiant hit-pool reactions
      hurt:          ["За, чи их сайн юм байна", "Би хараахан унаагүй ээ", "Үнэхээр өвдөж байна...", "Ммм, хүчтэй юм байна", "Юу гэж...!"],
      // boss almost dead — panicky cries
      desperate:     ["Ммм, энэ муу боллоо...", "Бөх минь...!", "Хараахан болоогүй..."],
      // post-rage — same as rage cries
      raged:         ["БИ УУРЛАЛАА!", "ӨРШӨӨХГҮЙ ЭЭ!", "ГОВИД ТЭМЦЭЛДЬЕ!", "САРМАГЧНЫ УУРЫГ МЭД!", "ЧИНГИС ХААНЫ ҮР УДАМ!"],
      // gloating at weak player
      player_low_hp: ["Хөлдөөсөн бууз ниснэ!", "Тэмээний хүч!", "Бууд л доо!", "Над хүрэхэд зуун жил эрт байна!"],
      // rattled by a high combo
      high_combo:    ["Хайхрамжгүй байжээ...", "Сайн юм байна, хүүхэд!", "Зогсохгүй байна, энэ..."],
      // boss lost a body part — complaining
      part_lost:     ["Бие минь...!", "Нэг бөхөө алдчихлаа!", "Аа, сармагчны сүүл..."],
    },
  },

  // catcherski (Russian) — hacked UFO catcher speaks pure Russian in shiny
  // mode. Mafia-hacker bravado. Voice via Edge TTS Dmitry — deep adult
  // male, fits the back-alley-hacker boss energy. Same Russian seasoning
  // already peppers the regular JP catchphrase via Cyrillic glitch words,
  // but here the WHOLE line goes Russian.
  catcherski: {
    voice: "ru-RU-DmitryNeural",
    catchphrase: "Я Кранов, Catcherski! Брось сто йен, БИП!",
    attacks: [
      { name: "Хватающая Клешня 🦞", type: "heavy",  phrases: ["Клешня атакует!", "Хорошо, схватил!", "Готовься к захвату!"] },
      { name: "Метель из Монет 🪙",  type: "wild",   phrases: ["Сто йен буря!", "Больше монет!", "Все ваши деньги — мои!"] },
      { name: "Разочарование 🚫",     type: "stun",   phrases: ["Почти! Попробуй ещё раз!", "Жаль, промах!", "Замри в обиде!"] },
      { name: "Душ из Эмодзи 💢",     type: "quick",  phrases: ["Эмодзи в атаку!", "Из коробки, лови!", "Эмодзи град!"] },
      { name: "Хакер Луч 💻",         type: "pierce", phrases: ["Русский хакер луч!", "Антивирус? Бесполезно!", "Сила хакера, пробей щит!"] },
    ],
    hits: [
      "Ой!", "Больно!", "Не работает!", "БИП БИП БИП!",
      "Стоп!", "Сломался!", "Помогите!", "Перезагрузка!",
      "Хорошо, продолжай!", "Жаль...", "Спасибо за монеты!", "Хакер злится!",
      "Москва плачет!", "Привет, малыш!", "Не трогай!", "Где мои монеты?",
      "Синий экран!", "Ошибка системы!", "Конец игры?", "Ха-ха!",
    ],
    taunts: {
      slingshot:     ["Целься получше!", "Попадёшь ли?", "Дай сто йен!", "Давай, стреляй!", "Промахнёшься!", "Хорошо, попробуй!"],
      rage:          ["БОМБА! Хакер режим!", "Гнев! ХАКЕР!", "Сейчас покажу!", "Русская сила!", "Никаких пощад!"],
      // healthy: confident, cocky — reuse slingshot taunts
      healthy:       ["Целься получше!", "Дай сто йен!", "Промахнёшься!", "Хорошо, попробуй!", "Я непобедим!", "Попадёшь ли?"],
      // hurt: irritated — reuse hit reactions
      hurt:          ["Ой!", "Больно!", "Хакер злится!", "Не работает!", "Жаль...", "Стоп!"],
      // desperate: near death
      desperate:     ["Помогите!", "Сломался...", "Не могу больше...", "Где мои монеты?", "Конец игры?"],
      // raged: same as rage cries
      raged:         ["БОМБА! Хакер режим!", "Гнев! ХАКЕР!", "Сейчас покажу!", "Русская сила!", "Никаких пощад!"],
      // gloating at weak player
      player_low_hp: ["Конец игры!", "Слабак!", "Прощай, малыш!", "Сто йен в гроб!"],
      // rattled by a high combo
      high_combo:    ["Стоп! Хватит!", "Комбо взлом!", "Ошибка! Ошибка!", "Невозможно!"],
      // boss lost a body part
      part_lost:     ["Моя деталь!", "Не трогай!", "Сломал, гад!", "Ой, моё!", "Хакеры, помогите!"],
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
      slingshot:     ["Πάρε το!", "Έλα!", "Είμαι όμορφος!", "Στόχευσε!", "Δοκίμασε!", "Άουα!", "Δεν φοβάμαι!", "Ωραία βολή!"],
      rage:          ["ΓΑΜΩΤΟ!", "ΛΥΣΣΑ!", "ΧΑΟΣ!", "ΘΕΟΣ ΧΑΟΥΣ!", "ΣΤΟ ΑΠΟΛΥΤΟ!"],
      healthy:       ["Είμαι δυνατή!", "Δεν με νικάς!", "Άλλη ερώτηση!", "Εύκολο!", "Φιλοσοφία!", "Χάος συνεχίζει!"],
      hurt:          ["Άουτς!", "Παρά λίγο!", "Συνέχισε!", "Καλό!", "Μπράβο!", "Παναγιά μου!"],
      desperate:     ["Μαμά!", "Βοήθεια!", "Όχι όχι!", "Πεινάω!", "Νυστάζω!", "Αντίο κόσμε!"],
      raged:         ["ΟΡΓΗ!", "ΤΩΡΑ!", "ΧΑΟΣ ΟΡΓΗΣ!", "ΘΕΟΣ ΧΑΟΥΣ!", "ΓΑΜΩΤΟ ΟΡΓΗ!"],
      player_low_hp: ["Σχεδόν τέλος!", "Αδύναμος!", "Αντίο!", "Δειλός!"],
      high_combo:    ["Σταμάτα!", "Combo τρελό!", "Παναγιά!", "Πανικός!"],
      part_lost:     ["Το μέρος μου!", "Απάτη!", "Αχ!", "Μην το παίρνεις!", "Άααα!"],
    },
  },
};
