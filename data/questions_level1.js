// Level 1 — Alphabet, phonics, sight words, basic picture vocab.
// Each question: { id, level, stars, ptype, prompt_jp, prompt, promptImage, audio, options, answer }
// stars: 1 (easy) / 2 (med) / 3 (hard) WITHIN this level.
(function () {
  const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const l = "abcdefghijklmnopqrstuvwxyz".split("");
  const all = [];
  let nid = 0;
  const Q = (o) => { all.push({ id: "L1-" + (++nid).toString().padStart(3,"0"), level:1, type:"mc", ...o }); };

  // ---- 1★ Uppercase recognition (visual-only): "Which is the letter X?"
  L.forEach((letter, i) => {
    const distract = []; while (distract.length < 3) { const c = L[(Math.random()*26)|0]; if (c!==letter && !distract.includes(c)) distract.push(c); }
    const opts = distract.slice(); const pos = (Math.random()*4)|0; opts.splice(pos,0,letter);
    Q({ stars:1, ptype:"alpha_upper", prompt_jp:`「${letter}」を タップ！`, prompt:letter, options: opts, answer: pos });
  });
  // 1★ Lowercase recognition
  l.forEach((letter, i) => {
    const distract = []; while (distract.length < 3) { const c = l[(Math.random()*26)|0]; if (c!==letter && !distract.includes(c)) distract.push(c); }
    const opts = distract.slice(); const pos = (Math.random()*4)|0; opts.splice(pos,0,letter);
    Q({ stars:1, ptype:"alpha_lower", prompt_jp:`「${letter}」を タップ！`, prompt:letter, options: opts, answer: pos });
  });

  // 2★ Upper→lower match
  L.forEach((letter, i) => {
    const lo = letter.toLowerCase();
    const distract = []; while (distract.length < 3) { const c = l[(Math.random()*26)|0]; if (c!==lo && !distract.includes(c)) distract.push(c); }
    const opts = distract.slice(); const pos = (Math.random()*4)|0; opts.splice(pos,0,lo);
    Q({ stars:2, ptype:"alpha_match", prompt_jp:`「${letter}」と おなじ もじは？`, prompt: letter, options: opts, answer: pos });
  });

  // 2★ Listen → letter (TTS)
  L.forEach((letter) => {
    const distract = []; while (distract.length < 3) { const c = L[(Math.random()*26)|0]; if (c!==letter && !distract.includes(c)) distract.push(c); }
    const opts = distract.slice(); const pos = (Math.random()*4)|0; opts.splice(pos,0,letter);
    Q({ stars:2, ptype:"alpha_listen", prompt_jp:`きこえた もじは？ 🔊`, audio: letter, options: opts, answer: pos });
  });

  // 3★ Phonics: "Which letter says /b/?"
  const phonics = [
    ["A","あ"],["B","ブッ"],["C","クッ"],["D","ドゥ"],["E","エ"],["F","フッ"],["G","グッ"],["H","ハッ"],
    ["I","イ"],["J","ジッ"],["K","クッ"],["L","ルッ"],["M","ムッ"],["N","ンッ"],["O","オ"],["P","プッ"],
    ["Q","クゥ"],["R","ルッ"],["S","スッ"],["T","トゥ"],["U","ア"],["V","ヴッ"],["W","ウッ"],["X","クス"],["Y","ヤ"],["Z","ズッ"]
  ];
  phonics.forEach(([letter, sound]) => {
    const distract = []; while (distract.length < 3) { const c = L[(Math.random()*26)|0]; if (c!==letter && !distract.includes(c)) distract.push(c); }
    const opts = distract.slice(); const pos = (Math.random()*4)|0; opts.splice(pos,0,letter);
    Q({ stars:3, ptype:"phonics", prompt_jp:`「${sound}」と なるのは？`, options: opts, answer: pos });
  });

  // 1★ Picture vocab — basic animals/objects
  const pics = [
    ["🐱","cat","ねこ"],["🐶","dog","いぬ"],["🐭","mouse","ねずみ"],["🦁","lion","ライオン"],
    ["🐰","rabbit","うさぎ"],["🐻","bear","くま"],["🐼","panda","パンダ"],["🐨","koala","コアラ"],
    ["🐸","frog","かえる"],["🦒","giraffe","きりん"],["🐘","elephant","ぞう"],["🐍","snake","へび"],
    ["🐦","bird","とり"],["🐟","fish","さかな"],["🐢","turtle","かめ"],["🐝","bee","はち"],
    ["🐞","ladybug","てんとうむし"],["🦋","butterfly","ちょうちょ"],["🦊","fox","きつね"],["🐔","chicken","にわとり"],
    ["🍎","apple","りんご"],["🍌","banana","バナナ"],["🍇","grapes","ぶどう"],["🍓","strawberry","いちご"],
    ["🍊","orange","オレンジ"],["🍉","watermelon","スイカ"],["🍞","bread","パン"],["🍕","pizza","ピザ"],
    ["🍔","hamburger","ハンバーガー"],["🍦","ice cream","アイス"],["☀️","sun","たいよう"],["🌙","moon","つき"],
    ["⭐","star","ほし"],["🌧️","rain","あめ"],["☃️","snowman","ゆきだるま"],["🚗","car","くるま"],
    ["🚌","bus","バス"],["🚲","bike","じてんしゃ"],["✈️","airplane","ひこうき"],["⚽","ball","ボール"],
    ["📚","book","ほん"],["✏️","pencil","えんぴつ"],["🖍️","crayon","クレヨン"],["🪑","chair","いす"],
    ["🏠","house","いえ"],["🏫","school","がっこう"],["🌳","tree","き"],["🌸","flower","はな"],
    ["💩","poop","うんち"],["💨","fart","おなら"],
  ];
  pics.forEach(([emoji, en, jp]) => {
    // 1★ — pick the picture matching the JP word
    const distract = [];
    while (distract.length < 3) { const p = pics[(Math.random()*pics.length)|0][0]; if (p!==emoji && !distract.includes(p)) distract.push(p); }
    const opts1 = distract.slice(); const pos1 = (Math.random()*4)|0; opts1.splice(pos1,0,emoji);
    Q({ stars:1, ptype:"vocab_pic_jp", prompt_jp:`「${jp}」は どれ？`, options: opts1, answer: pos1 });

    // 2★ — pick the English word matching the picture
    const distractW = [];
    while (distractW.length < 3) { const w = pics[(Math.random()*pics.length)|0][1]; if (w!==en && !distractW.includes(w)) distractW.push(w); }
    const optsW = distractW.slice(); const posW = (Math.random()*4)|0; optsW.splice(posW,0,en);
    Q({ stars:2, ptype:"vocab_pic_en", prompt_jp:`これは えいごで？`, promptImage: emoji, options: optsW, answer: posW });

    // 3★ — listen and pick picture
    const distractL = [];
    while (distractL.length < 3) { const p = pics[(Math.random()*pics.length)|0][0]; if (p!==emoji && !distractL.includes(p)) distractL.push(p); }
    const optsL = distractL.slice(); const posL = (Math.random()*4)|0; optsL.splice(posL,0,emoji);
    Q({ stars:3, ptype:"vocab_listen", prompt_jp:`きこえた ものを タップ！ 🔊`, audio: en, options: optsL, answer: posL });
  });

  // 1★ Numbers 1-10
  const nums = [["1","one","いち"],["2","two","に"],["3","three","さん"],["4","four","よん"],["5","five","ご"],
                ["6","six","ろく"],["7","seven","なな"],["8","eight","はち"],["9","nine","きゅう"],["10","ten","じゅう"]];
  nums.forEach(([n, en, jp]) => {
    const distract = [];
    while (distract.length < 3) { const w = nums[(Math.random()*nums.length)|0][1]; if (w!==en && !distract.includes(w)) distract.push(w); }
    const opts = distract.slice(); const pos = (Math.random()*4)|0; opts.splice(pos,0,en);
    Q({ stars:2, ptype:"num", prompt_jp:`「${n}」は えいごで？`, prompt:n, options: opts, answer: pos });
  });

  // 2★ Colors
  const colors = [["🔴","red","あか"],["🔵","blue","あお"],["🟡","yellow","きいろ"],["🟢","green","みどり"],
                  ["🟣","purple","むらさき"],["🟠","orange","オレンジ"],["⚫","black","くろ"],["⚪","white","しろ"],["🟤","brown","ちゃいろ"],["🩷","pink","ピンク"]];
  colors.forEach(([emoji, en, jp]) => {
    const distract = [];
    while (distract.length < 3) { const w = colors[(Math.random()*colors.length)|0][1]; if (w!==en && !distract.includes(w)) distract.push(w); }
    const opts = distract.slice(); const pos = (Math.random()*4)|0; opts.splice(pos,0,en);
    Q({ stars:2, ptype:"color", prompt_jp:`この いろは えいごで？`, promptImage: emoji, options: opts, answer: pos });
  });

  // 2★ CVC reading — pick the picture for the word
  const cvc = [
    ["cat","🐱","cat","sun","bag","map"],["sun","☀️","sun","bus","fan","cat"],["bag","👜","bag","cat","pen","cup"],
    ["pen","🖊️","pen","bag","cup","mat"],["cup","🥤","cup","sun","cat","pen"],["dog","🐶","dog","cat","fox","pig"],
    ["pig","🐷","pig","dog","cat","cow"],["bus","🚌","bus","cat","car","sun"],["fan","🌀","fan","cup","sun","mat"],
    ["bed","🛏️","bed","bag","cat","cup"],["box","📦","box","bag","cup","fan"],["egg","🥚","egg","bag","cat","dog"],
    ["hat","🎩","hat","cat","bag","pen"],["jar","🫙","jar","cat","cup","mat"],["leg","🦵","leg","bag","cat","pen"],
    ["mug","☕","mug","sun","cat","cup"],["net","🥅","net","cat","cup","pen"],["nut","🥜","nut","cat","cup","sun"],
    ["pot","🍲","pot","bag","cat","cup"],["rat","🐀","rat","cat","dog","pig"],
  ];
  cvc.forEach(([word, emoji, ...opts]) => {
    const correct = emoji;
    // build option list using emoji map
    const map = {cat:"🐱",sun:"☀️",bag:"👜",pen:"🖊️",cup:"🥤",dog:"🐶",pig:"🐷",bus:"🚌",fan:"🌀",bed:"🛏️",box:"📦",egg:"🥚",hat:"🎩",jar:"🫙",leg:"🦵",mug:"☕",net:"🥅",nut:"🥜",pot:"🍲",rat:"🐀",map:"🗺️",fox:"🦊",mat:"🟫",car:"🚗",cow:"🐄"};
    const arr = opts.map(w => map[w] || "❓");
    const correctIdx = opts.indexOf(word);
    Q({ stars:3, ptype:"cvc_read", prompt_jp:`よんで タップ！`, prompt:word, options: arr, answer: correctIdx, audio: word });
  });

  // 2★ Sight words — pick the JP meaning
  const sight = [
    ["I","わたし"],["you","あなた"],["he","かれ"],["she","かのじょ"],["we","わたしたち"],
    ["the","その"],["a","ひとつの"],["is","です"],["yes","はい"],["no","いいえ"],
    ["hi","こんにちは"],["bye","バイバイ"],["go","いく"],["stop","とまる"],["see","みる"],
    ["look","みて"],["come","くる"],["sit","すわる"],["run","はしる"],["jump","ジャンプする"],
    ["happy","うれしい"],["sad","かなしい"],["big","おおきい"],["small","ちいさい"],["good","いい"],
    ["bad","わるい"],["hot","あつい"],["cold","つめたい"],["fast","はやい"],["slow","おそい"]
  ];
  sight.forEach(([en, jp]) => {
    const distract = [];
    while (distract.length < 3) { const w = sight[(Math.random()*sight.length)|0][1]; if (w!==jp && !distract.includes(w)) distract.push(w); }
    const opts = distract.slice(); const pos = (Math.random()*4)|0; opts.splice(pos,0,jp);
    Q({ stars:2, ptype:"sight", prompt_jp:`「${en}」の いみは？`, prompt:en, options: opts, answer: pos });
  });

  // 3★ Body parts
  const body = [
    ["head","あたま","🧠"],["eye","め","👁️"],["ear","みみ","👂"],["nose","はな","👃"],
    ["mouth","くち","👄"],["hand","て","✋"],["foot","あし","🦶"],["arm","うで","💪"],
    ["leg","あし","🦵"],["hair","かみのけ","💇"],["finger","ゆび","☝️"],["tooth","は","🦷"],
    ["tummy","おなか","🫃"],["butt","おしり","🍑"],
  ];
  body.forEach(([en, jp, emoji]) => {
    const distract = [];
    while (distract.length < 3) { const w = body[(Math.random()*body.length)|0][0]; if (w!==en && !distract.includes(w)) distract.push(w); }
    const opts = distract.slice(); const pos = (Math.random()*4)|0; opts.splice(pos,0,en);
    Q({ stars:2, ptype:"body", prompt_jp:`「${jp}」は えいごで？`, promptImage: emoji, options: opts, answer: pos });
  });

  window.QUESTIONS_LEVEL1 = all;
})();
