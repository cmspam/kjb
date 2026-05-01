// Level 1 — Alphabet, phonics, sight words, basic picture vocab.
// Focus on ENGLISH practice: listening, letter recognition, vocabulary direction.
// stars: 1 (easy) / 2 (med) / 3 (hard) WITHIN this level.
(function () {
  const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const l = "abcdefghijklmnopqrstuvwxyz".split("");
  const all = [];
  let nid = 0;
  const Q = (o) => { all.push({ id: "L1-" + (++nid).toString().padStart(3,"0"), level:1, type:"mc", ...o }); };

  function pickDistract(answer, pool, n=3) {
    const distract = [];
    let guard = 0;
    while (distract.length < n && guard++ < 200) {
      const c = pool[(Math.random()*pool.length)|0];
      if (c !== answer && !distract.includes(c)) distract.push(c);
    }
    return distract;
  }
  function withInsert(answer, distract) {
    const opts = distract.slice();
    const pos = (Math.random()*4)|0;
    opts.splice(pos, 0, answer);
    return { opts, pos };
  }

  // (Removed: same-letter pattern-match generators "alpha_upper" / "alpha_lower".
  // Showing "G" and asking the kid to tap "G" tests visual matching, not English.
  // Letter recognition at this level is driven entirely by audio — see
  // alpha_listen / alpha_listen_lo below.)

  // ---- 1★ Listen → letter (TTS) — heavy listening practice ----
  L.forEach((letter) => {
    const m = withInsert(letter, pickDistract(letter, L));
    Q({ stars:1, ptype:"alpha_listen", prompt_jp:`きこえた もじを タップ！ 🔊`, audio: letter, options: m.opts, answer: m.pos });
  });
  // Same with lowercase to expose them to both forms aurally
  l.forEach((letter) => {
    const m = withInsert(letter, pickDistract(letter, l));
    Q({ stars:1, ptype:"alpha_listen_lo", prompt_jp:`きこえた もじを タップ！ 🔊`, audio: letter.toUpperCase(), options: m.opts, answer: m.pos });
  });

  // ---- Picture vocab (basic) ----
  const pics = [
    ["🐱","cat"],["🐶","dog"],["🐭","mouse"],["🦁","lion"],["🐰","rabbit"],["🐻","bear"],
    ["🐼","panda"],["🐨","koala"],["🐸","frog"],["🦒","giraffe"],["🐘","elephant"],["🐍","snake"],
    ["🐦","bird"],["🐟","fish"],["🐢","turtle"],["🐝","bee"],["🦋","butterfly"],["🦊","fox"],
    ["🐔","chicken"],["🍎","apple"],["🍌","banana"],["🍇","grapes"],["🍓","strawberry"],["🍊","orange"],
    ["🍉","watermelon"],["🍞","bread"],["🍕","pizza"],["🍔","hamburger"],["🍦","ice cream"],
    ["☀️","sun"],["🌙","moon"],["⭐","star"],["🌧️","rain"],["☃️","snowman"],
    ["🚗","car"],["🚌","bus"],["🚲","bike"],["✈️","airplane"],["⚽","ball"],
    ["📚","book"],["✏️","pencil"],["🪑","chair"],["🏠","house"],["🏫","school"],["🌳","tree"],["🌸","flower"],
    ["💩","poop"],["💨","fart"],
  ];
  const allEmoji = pics.map(p => p[0]);
  const allEN = pics.map(p => p[1]);

  // ---- 1★ Listen and tap picture (great for beginners) ----
  pics.forEach(([emoji, en]) => {
    const m = withInsert(emoji, pickDistract(emoji, allEmoji));
    Q({ stars:1, ptype:"vocab_listen_pic", prompt_jp:`きこえた えいごの えを タップ！ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });

  // ---- 2★ Show picture, pick English word ----
  // audio:en is critical — at L1 a kid choosing among 4 unfamiliar English
  // strings would be guessing. Hearing the word while seeing the emoji turns
  // this into reading-with-scaffolding rather than pure spelling recognition.
  pics.forEach(([emoji, en]) => {
    const m = withInsert(en, pickDistract(en, allEN));
    Q({ stars:2, ptype:"vocab_pic2en", prompt_jp:`これは えいごで なに？ 🔊`, promptImage: emoji, audio: en, options: m.opts, answer: m.pos });
  });

  // ---- 2★ See English word, tap picture ----
  pics.forEach(([emoji, en]) => {
    const m = withInsert(emoji, pickDistract(emoji, allEmoji));
    Q({ stars:2, ptype:"vocab_word2pic", prompt_jp:`「${en}」の えを タップ！`, prompt: en, audio: en, options: m.opts, answer: m.pos });
  });

  // ---- 2★ Upper→lower match ----
  L.forEach((letter) => {
    const lo = letter.toLowerCase();
    const m = withInsert(lo, pickDistract(lo, l));
    Q({ stars:2, ptype:"alpha_match", prompt_jp:`「${letter}」と おなじ もじは？`, prompt: letter, options: m.opts, answer: m.pos });
  });

  // ---- 2★ Listen and pick written word ----
  pics.forEach(([emoji, en]) => {
    const m = withInsert(en, pickDistract(en, allEN));
    Q({ stars:2, ptype:"vocab_listen_word", prompt_jp:`きこえた ことばを よもう！ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });

  // ---- 3★ Phonics ----
  const phonics = [
    ["A","あ"],["B","ブッ"],["C","クッ"],["D","ドゥ"],["E","エ"],["F","フッ"],["G","グッ"],["H","ハッ"],
    ["I","イ"],["J","ジッ"],["K","クッ"],["L","ルッ"],["M","ムッ"],["N","ンッ"],["O","オ"],["P","プッ"],
    ["Q","クゥ"],["R","ルッ"],["S","スッ"],["T","トゥ"],["U","ア"],["V","ヴッ"],["W","ウッ"],["X","クス"],["Y","ヤ"],["Z","ズッ"]
  ];
  phonics.forEach(([letter, sound]) => {
    const m = withInsert(letter, pickDistract(letter, L));
    Q({ stars:3, ptype:"phonics", prompt_jp:`「${sound}」と なる もじは？`, options: m.opts, answer: m.pos });
  });

  // ---- 3★ CVC reading ----
  const cvcMap = {cat:"🐱",sun:"☀️",bag:"👜",pen:"🖊️",cup:"🥤",dog:"🐶",pig:"🐷",bus:"🚌",fan:"🌀",
    bed:"🛏️",box:"📦",egg:"🥚",hat:"🎩",jar:"🫙",leg:"🦵",mug:"☕",net:"🥅",nut:"🥜",pot:"🍲",
    rat:"🐀",map:"🗺️",fox:"🦊",mat:"🟫",car:"🚗",cow:"🐄"};
  const cvcWords = Object.keys(cvcMap);
  cvcWords.forEach(word => {
    const correctEmoji = cvcMap[word];
    // pick 3 distract emojis from cvcMap
    const distractWords = pickDistract(word, cvcWords);
    const distractEmojis = distractWords.map(w => cvcMap[w]);
    const m = withInsert(correctEmoji, distractEmojis);
    Q({ stars:3, ptype:"cvc_read", prompt_jp:`よんで タップ！`, prompt: word, audio: word, options: m.opts, answer: m.pos });
  });
  // 3★ CVC listen
  cvcWords.forEach(word => {
    const m = withInsert(word, pickDistract(word, cvcWords));
    Q({ stars:3, ptype:"cvc_listen", prompt_jp:`きこえた ことばを えらべ！ 🔊`, audio: word, options: m.opts, answer: m.pos });
  });

  // ---- 1★ Sight words EN→JP (basic meaning) ----
  const sight = [
    ["I","わたし"],["you","あなた"],["he","かれ"],["she","かのじょ"],["we","わたしたち"],["they","かれら"],
    ["the","その"],["a","ひとつの"],["is","です"],["yes","はい"],["no","いいえ"],
    ["hi","こんにちは"],["bye","バイバイ"],["go","いく"],["stop","とまる"],["see","みる"],
    ["look","みて"],["come","くる"],["sit","すわる"],["run","はしる"],["jump","ジャンプする"],
    ["happy","うれしい"],["sad","かなしい"],["big","おおきい"],["small","ちいさい"],["good","いい"],
    ["bad","わるい"],["hot","あつい"],["cold","つめたい"],["fast","はやい"],["slow","おそい"],
  ];
  sight.forEach(([en, jp]) => {
    const m = withInsert(jp, pickDistract(jp, sight.map(s=>s[1])));
    Q({ stars:1, ptype:"sight", prompt_jp:`「${en}」の いみは？`, prompt:en, audio:en, options: m.opts, answer: m.pos });
  });

  // ---- 2★ Sight words JP→EN ----
  sight.forEach(([en, jp]) => {
    const m = withInsert(en, pickDistract(en, sight.map(s=>s[0])));
    Q({ stars:2, ptype:"sight_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });

  // ---- 1★ Numbers 1-10 listen ----
  const nums = [["1","one"],["2","two"],["3","three"],["4","four"],["5","five"],
                ["6","six"],["7","seven"],["8","eight"],["9","nine"],["10","ten"]];
  nums.forEach(([n, en]) => {
    const m = withInsert(n, pickDistract(n, nums.map(x=>x[0])));
    Q({ stars:1, ptype:"num_listen", prompt_jp:`きこえた すうじを タップ！ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });
  // 2★ Number JP→EN
  const numFull = [["1","one","いち"],["2","two","に"],["3","three","さん"],["4","four","よん"],["5","five","ご"],
                   ["6","six","ろく"],["7","seven","なな"],["8","eight","はち"],["9","nine","きゅう"],["10","ten","じゅう"]];
  numFull.forEach(([n, en, jp]) => {
    const m = withInsert(en, pickDistract(en, numFull.map(x=>x[1])));
    Q({ stars:2, ptype:"num_jp2en", prompt_jp:`「${n}」は えいごで？`, prompt: n, options: m.opts, answer: m.pos });
  });

  // ---- 2★ Colors picture → English (with audio scaffold) ----
  const colors = [["🔴","red","あか"],["🔵","blue","あお"],["🟡","yellow","きいろ"],["🟢","green","みどり"],
                  ["🟣","purple","むらさき"],["🟠","orange","オレンジ"],["⚫","black","くろ"],["⚪","white","しろ"],
                  ["🟤","brown","ちゃいろ"],["🩷","pink","ピンク"]];
  colors.forEach(([emoji, en, jp]) => {
    const m = withInsert(en, pickDistract(en, colors.map(c=>c[1])));
    Q({ stars:2, ptype:"color_pic2en", prompt_jp:`この いろは えいごで？ 🔊`, promptImage: emoji, audio: en, options: m.opts, answer: m.pos });
  });
  // 1★ Color listen
  colors.forEach(([emoji, en, jp]) => {
    const m = withInsert(emoji, pickDistract(emoji, colors.map(c=>c[0])));
    Q({ stars:1, ptype:"color_listen", prompt_jp:`きこえた いろを タップ！ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });

  // ---- 2★ Body parts picture → English ----
  const body = [
    ["head","あたま","🧠"],["eye","め","👁️"],["ear","みみ","👂"],["nose","はな","👃"],
    ["mouth","くち","👄"],["hand","て","✋"],["foot","あし","🦶"],["arm","うで","💪"],
    ["leg","あし","🦵"],["hair","かみのけ","💇"],["finger","ゆび","☝️"],["tooth","は","🦷"],
    ["tummy","おなか","🫃"],["butt","おしり","🍑"],
  ];
  body.forEach(([en, jp, emoji]) => {
    const m = withInsert(en, pickDistract(en, body.map(b=>b[0])));
    Q({ stars:2, ptype:"body_pic2en", prompt_jp:`これは えいごで？ 🔊`, promptImage: emoji, audio: en, options: m.opts, answer: m.pos });
  });
  body.forEach(([en, jp, emoji]) => {
    const m = withInsert(emoji, pickDistract(emoji, body.map(b=>b[2])));
    Q({ stars:1, ptype:"body_listen", prompt_jp:`きこえた からだの ぶぶんを タップ！ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });

  // ---- 1★ Action verbs listen ----
  const verbs = [
    ["run","はしる","🏃"],["jump","ジャンプ","⬆️"],["sit","すわる","💺"],["stand","たつ","🧍"],
    ["sleep","ねる","😴"],["eat","たべる","🍽️"],["drink","のむ","🥤"],["walk","あるく","🚶"],
    ["dance","おどる","💃"],["sing","うたう","🎤"],["read","よむ","📖"],["write","かく","✍️"],
  ];
  verbs.forEach(([en, jp, emoji]) => {
    const m = withInsert(emoji, pickDistract(emoji, verbs.map(v=>v[2])));
    Q({ stars:1, ptype:"verb_listen", prompt_jp:`きこえた どうさを タップ！ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });
  verbs.forEach(([en, jp, emoji]) => {
    const m = withInsert(en, pickDistract(en, verbs.map(v=>v[0])));
    Q({ stars:2, ptype:"verb_pic2en", prompt_jp:`この どうさは えいごで？ 🔊`, promptImage: emoji, audio: en, options: m.opts, answer: m.pos });
  });

  // ---- 1★ Greetings listen ----
  const greet = [
    ["hello","こんにちは"],["hi","やあ"],["bye","バイバイ"],["thank you","ありがとう"],
    ["please","おねがい"],["sorry","ごめんね"],["yes","はい"],["no","いいえ"],
    ["good morning","おはよう"],["good night","おやすみ"],
  ];
  greet.forEach(([en, jp]) => {
    const m = withInsert(jp, pickDistract(jp, greet.map(g=>g[1])));
    Q({ stars:1, ptype:"greet_listen", prompt_jp:`きこえた あいさつ の いみは？ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });

  // ===== EXPANSION =====

  // More picture vocab — covers many more emoji/word pairs.
  const pics2 = [
    ["🦓","zebra"],["🐊","crocodile"],["🦛","hippo"],["🦏","rhino"],
    ["🐢","turtle"],["🐳","whale"],["🐬","dolphin"],["🦑","squid"],
    ["🦞","lobster"],["🦀","crab"],["🐝","bee"],["🦋","butterfly"],
    ["🐌","snail"],["🐛","caterpillar"],["🐞","ladybug"],["🕷️","spider"],
    ["🦒","giraffe"],["🐘","elephant"],["🦘","kangaroo"],["🐼","panda"],
    ["🍒","cherry"],["🍑","peach"],["🍐","pear"],["🍋","lemon"],
    ["🥭","mango"],["🍍","pineapple"],["🥥","coconut"],["🥝","kiwi"],
    ["🍅","tomato"],["🥕","carrot"],["🥔","potato"],["🥒","cucumber"],
    ["🌽","corn"],["🍆","eggplant"],["🥦","broccoli"],["🌶️","pepper"],
    ["🍣","sushi"],["🍙","rice ball"],["🥪","sandwich"],["🍟","fries"],
    ["🍿","popcorn"],["🍪","cookie"],["🍫","chocolate"],["🍩","donut"],
    ["🥛","milk"],["🧃","juice"],["💧","water"],["🍵","tea"],
    ["🌍","earth"],["🪐","planet"],["🌈","rainbow"],["☃️","snowman"],
    ["🌪️","tornado"],["🌋","volcano"],["🏝️","island"],["🏔️","mountain"],
    ["🚆","train"],["✈️","airplane"],["🚢","ship"],["🚲","bike"],
    ["🚓","police car"],["🚑","ambulance"],["🚒","fire truck"],["🚀","rocket"],
    ["🪁","kite"],["🎈","balloon"],["🧸","teddy bear"],["🎁","present"],
    ["⚾","baseball"],["🏀","basketball"],["🎾","tennis ball"],["🏐","volleyball"],
    ["🎤","mic"],["🎵","music"],["🎹","piano"],["🥁","drum"],
    ["📺","TV"],["💻","computer"],["📱","phone"],["📚","books"],
    ["🛏️","bed"],["🚪","door"],["🪟","window"],["🚿","shower"],
  ];
  const all2Emoji = pics2.map(p => p[0]);
  const all2EN    = pics2.map(p => p[1]);
  pics2.forEach(([emoji, en]) => {
    const m = withInsert(emoji, pickDistract(emoji, all2Emoji));
    Q({ stars:1, ptype:"vocab_listen_pic", prompt_jp:`きこえた えいごの えを タップ！ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });
  pics2.forEach(([emoji, en]) => {
    const m = withInsert(en, pickDistract(en, all2EN));
    Q({ stars:2, ptype:"vocab_pic2en", prompt_jp:`これは えいごで なに？ 🔊`, promptImage: emoji, audio: en, options: m.opts, answer: m.pos });
  });
  pics2.forEach(([emoji, en]) => {
    const m = withInsert(emoji, pickDistract(emoji, all2Emoji));
    Q({ stars:2, ptype:"vocab_word2pic", prompt_jp:`「${en}」の えを タップ！`, prompt: en, audio: en, options: m.opts, answer: m.pos });
  });

  // More sight words — common high-frequency words kids meet first.
  const sight2 = [
    ["this","これ"],["that","あれ"],["here","ここ"],["there","あそこ"],
    ["one","ひとつ"],["two","ふたつ"],["three","みっつ"],["new","あたらしい"],
    ["old","ふるい"],["like","すき"],["love","だいすき"],["want","ほしい"],
    ["have","もつ"],["eat","たべる"],["drink","のむ"],["play","あそぶ"],
    ["read","よむ"],["write","かく"],["sing","うたう"],["dance","おどる"],
    ["make","つくる"],["take","とる"],["give","あげる"],["help","てつだう"],
    ["wash","あらう"],["open","あける"],["close","しめる"],["start","はじめる"],
    ["my","わたしの"],["your","あなたの"],["his","かれの"],["her","かのじょの"],
  ];
  sight2.forEach(([en, jp]) => {
    const m = withInsert(jp, pickDistract(jp, sight2.map(s=>s[1])));
    Q({ stars:1, ptype:"sight", prompt_jp:`「${en}」の いみは？`, prompt:en, audio:en, options: m.opts, answer: m.pos });
  });
  sight2.forEach(([en, jp]) => {
    const m = withInsert(en, pickDistract(en, sight2.map(s=>s[0])));
    Q({ stars:2, ptype:"sight_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });

  // More verbs (action)
  const verbs2 = [
    ["swim","およぐ","🏊"],["fly","とぶ","🪁"],["climb","のぼる","🧗"],
    ["throw","なげる","🤾"],["catch","つかまえる","🥎"],["kick","ける","🦵"],
    ["push","おす","✊"],["pull","ひく","✊"],["fall","ころぶ","🤕"],
    ["wash","あらう","🚿"],["brush","みがく","🪥"],["wave","てをふる","👋"],
    ["clap","てをたたく","👏"],["smile","ほほえむ","😊"],["cry","なく","😭"],
    ["laugh","わらう","😂"],["wait","まつ","⏳"],["hug","だきしめる","🤗"],
  ];
  verbs2.forEach(([en, jp, emoji]) => {
    const m = withInsert(emoji, pickDistract(emoji, verbs2.map(v=>v[2])));
    Q({ stars:1, ptype:"verb_listen", prompt_jp:`きこえた どうさを タップ！ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });
  verbs2.forEach(([en, jp, emoji]) => {
    const m = withInsert(en, pickDistract(en, verbs2.map(v=>v[0])));
    Q({ stars:2, ptype:"verb_pic2en", prompt_jp:`この どうさは えいごで？ 🔊`, promptImage: emoji, audio: en, options: m.opts, answer: m.pos });
  });

  // More body parts
  const body2 = [
    ["face","かお","😀"],["chin","あご","🤔"],["chest","むね","🫀"],
    ["back","せなか","🦴"],["knee","ひざ","🦵"],["elbow","ひじ","💪"],
    ["shoulder","かた","🤷"],["neck","くび","🤏"],["heart","しんぞう","🫀"],
    ["brain","のう","🧠"],["thumb","おやゆび","👍"],
  ];
  body2.forEach(([en, jp, emoji]) => {
    const m = withInsert(en, pickDistract(en, body2.map(b=>b[0])));
    Q({ stars:2, ptype:"body_pic2en", prompt_jp:`これは えいごで？ 🔊`, promptImage: emoji, audio: en, options: m.opts, answer: m.pos });
  });

  // More greetings + polite phrases
  const greet2 = [
    ["see you","じゃあね"],["welcome","ようこそ"],["excuse me","すみません"],
    ["nice to meet you","はじめまして"],["how are you","げんき？"],
    ["I'm fine","げんきです"],["have fun","たのしんで"],["take care","きをつけて"],
    ["good luck","がんばって"],["congratulations","おめでとう"],
  ];
  greet2.forEach(([en, jp]) => {
    const m = withInsert(jp, pickDistract(jp, greet2.map(g=>g[1])));
    Q({ stars:1, ptype:"greet_listen", prompt_jp:`きこえた あいさつ の いみは？ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });

  // Numbers 11-20 (listen)
  const nums2 = [["11","eleven"],["12","twelve"],["13","thirteen"],["14","fourteen"],
    ["15","fifteen"],["16","sixteen"],["17","seventeen"],["18","eighteen"],
    ["19","nineteen"],["20","twenty"]];
  nums2.forEach(([n, en]) => {
    const m = withInsert(n, pickDistract(n, nums2.map(x=>x[0])));
    Q({ stars:1, ptype:"num_listen", prompt_jp:`きこえた すうじを タップ！ 🔊`, audio: en, options: m.opts, answer: m.pos });
  });
  nums2.forEach(([n, en]) => {
    const m = withInsert(en, pickDistract(en, nums2.map(x=>x[1])));
    Q({ stars:2, ptype:"num_jp2en", prompt_jp:`「${n}」は えいごで？`, prompt: n, options: m.opts, answer: m.pos });
  });

  // Opposites — very basic adjective contrast
  const opps = [
    ["big","おおきい"],["small","ちいさい"],["fast","はやい"],["slow","おそい"],
    ["hot","あつい"],["cold","つめたい"],["new","あたらしい"],["old","ふるい"],
    ["good","いい"],["bad","わるい"],["happy","うれしい"],["sad","かなしい"],
    ["tall","せがたかい"],["short","せがひくい"],["long","ながい"],["short","みじかい"],
    ["clean","きれい"],["dirty","きたない"],["loud","うるさい"],["quiet","しずか"],
    ["easy","やさしい"],["hard","むずかしい"],["full","いっぱい"],["empty","からっぽ"],
  ];
  opps.forEach(([en, jp]) => {
    const m = withInsert(en, pickDistract(en, opps.map(o=>o[0])));
    Q({ stars:2, ptype:"adj_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });
  opps.forEach(([en, jp]) => {
    const m = withInsert(jp, pickDistract(jp, opps.map(o=>o[1])));
    Q({ stars:1, ptype:"adj_en2jp", prompt_jp:`「${en}」の いみ は？`, prompt:en, audio:en, options: m.opts, answer: m.pos });
  });

  // Feelings (basic feelings list with audio)
  const feels = [
    ["happy","うれしい"],["sad","かなしい"],["angry","おこっている"],["sleepy","ねむい"],
    ["tired","つかれた"],["hungry","おなかすいた"],["thirsty","のどかわいた"],
    ["scared","こわい"],["excited","わくわく"],["bored","たいくつ"],
  ];
  feels.forEach(([en, jp]) => {
    const m = withInsert(en, pickDistract(en, feels.map(f=>f[0])));
    Q({ stars:1, ptype:"feel_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });
  feels.forEach(([en, jp]) => {
    const m = withInsert(jp, pickDistract(jp, feels.map(f=>f[1])));
    Q({ stars:1, ptype:"feel_en2jp", prompt_jp:`「${en}」の いみ は？`, prompt:en, audio:en, options: m.opts, answer: m.pos });
  });

  // More colors (extended)
  const colors2 = [
    ["gold","きんいろ"],["silver","ぎんいろ"],["light blue","みずいろ"],
    ["dark green","ふかみどり"],["gray","グレー"],
  ];
  colors2.forEach(([en, jp]) => {
    const m = withInsert(en, pickDistract(en, colors2.map(c=>c[0]).concat(["red","blue","yellow","green"])));
    Q({ stars:2, ptype:"color_pic2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });

  window.QUESTIONS_LEVEL1 = all;
})();
