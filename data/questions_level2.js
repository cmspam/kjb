// Level 2 — Eiken 5 grammar + vocab. Mix of JP→EN, EN→JP, fill-in, listening.
(function () {
  const all = [];
  let nid = 0;
  const Q = (o) => { all.push({ id: "L2-" + (++nid).toString().padStart(3,"0"), level:2, type:"mc", ...o }); };

  // Helper: build MC options from a pool
  function mc(answer, pool, count=4) {
    const distract = [];
    while (distract.length < count-1) { const x = pool[(Math.random()*pool.length)|0]; if (x!==answer && !distract.includes(x)) distract.push(x); }
    const opts = distract.slice(); const pos = (Math.random()*count)|0; opts.splice(pos, 0, answer);
    return { opts, pos };
  }

  // ========== VOCABULARY ==========
  // Animals
  const animals = [
    ["cat","ねこ","🐱"],["dog","いぬ","🐶"],["bird","とり","🐦"],["fish","さかな","🐟"],["pig","ぶた","🐷"],
    ["cow","うし","🐮"],["horse","うま","🐴"],["sheep","ひつじ","🐑"],["mouse","ねずみ","🐭"],["rabbit","うさぎ","🐰"],
    ["bear","くま","🐻"],["lion","ライオン","🦁"],["tiger","とら","🐯"],["monkey","さる","🐵"],["elephant","ぞう","🐘"],
    ["snake","へび","🐍"],["frog","かえる","🐸"],["duck","あひる","🦆"],["panda","パンダ","🐼"],["chicken","にわとり","🐔"],
  ];
  // Food
  const food = [
    ["apple","りんご","🍎"],["banana","バナナ","🍌"],["bread","パン","🍞"],["rice","ごはん","🍚"],["egg","たまご","🥚"],
    ["milk","ぎゅうにゅう","🥛"],["water","みず","💧"],["juice","ジュース","🧃"],["cake","ケーキ","🍰"],["candy","あめ","🍬"],
    ["pizza","ピザ","🍕"],["fish","さかな","🐟"],["meat","にく","🥩"],["soup","スープ","🍲"],["salad","サラダ","🥗"],
    ["cheese","チーズ","🧀"],["tea","おちゃ","🍵"],["coffee","コーヒー","☕"],["sushi","おすし","🍣"],["noodles","めん","🍜"],
  ];
  // Family
  const family = [
    ["father","おとうさん","👨"],["mother","おかあさん","👩"],["brother","おにいさん","👦"],["sister","おねえさん","👧"],
    ["grandfather","おじいさん","👴"],["grandmother","おばあさん","👵"],["uncle","おじさん","🧑"],["aunt","おばさん","👩"],
    ["family","かぞく","👨‍👩‍👧"],["friend","ともだち","🧑‍🤝‍🧑"],["baby","あかちゃん","👶"],["boy","おとこのこ","👦"],["girl","おんなのこ","👧"],
  ];
  // Classroom
  const classroom = [
    ["pen","ペン","🖊️"],["pencil","えんぴつ","✏️"],["book","ほん","📕"],["bag","かばん","👜"],["desk","つくえ","🪑"],
    ["chair","いす","💺"],["eraser","けしごむ","🧽"],["ruler","じょうぎ","📏"],["paper","かみ","📄"],["notebook","ノート","📓"],
    ["scissors","はさみ","✂️"],["glue","のり","🩹"],["board","こくばん","🟩"],["clock","とけい","🕒"],["map","ちず","🗺️"],
  ];
  // Weather
  const weather = [
    ["sunny","はれ","☀️"],["rainy","あめ","🌧️"],["cloudy","くもり","☁️"],["snowy","ゆき","❄️"],["windy","かぜ","💨"],
    ["hot","あつい","🥵"],["cold","さむい","🥶"],["warm","あたたかい","🌤️"],["cool","すずしい","🍃"],
  ];
  // Sports & Hobbies
  const hobbies = [
    ["soccer","サッカー","⚽"],["baseball","やきゅう","⚾"],["tennis","テニス","🎾"],["swimming","すいえい","🏊"],
    ["running","ランニング","🏃"],["dancing","ダンス","💃"],["singing","うた","🎤"],["reading","どくしょ","📖"],
    ["drawing","おえかき","🎨"],["games","ゲーム","🎮"],["music","おんがく","🎵"],["piano","ピアノ","🎹"],
  ];
  // Places
  const places = [
    ["school","がっこう","🏫"],["park","こうえん","🏞️"],["library","としょかん","📚"],["hospital","びょういん","🏥"],
    ["station","えき","🚉"],["store","おみせ","🏬"],["house","いえ","🏠"],["zoo","どうぶつえん","🦁"],
    ["pool","プール","🏊"],["beach","ビーチ","🏖️"],["restaurant","レストラン","🍽️"],
  ];
  // Body & Clothes
  const clothes = [
    ["shirt","シャツ","👕"],["pants","ズボン","👖"],["shoes","くつ","👟"],["hat","ぼうし","🎩"],["socks","くつした","🧦"],
    ["jacket","ジャケット","🧥"],["dress","ドレス","👗"],["gloves","てぶくろ","🧤"],
  ];

  // For each vocab list: JP→EN, EN→JP, picture→EN, picture→JP
  function vocabBundle(list, ptype) {
    const ens = list.map(x => x[0]);
    const jps = list.map(x => x[1]);
    list.forEach(([en, jp, emoji]) => {
      // JP → EN
      let m = mc(en, ens);
      Q({ stars: 1, ptype: ptype+"_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
      // EN → JP
      m = mc(jp, jps);
      Q({ stars: 1, ptype: ptype+"_en2jp", prompt_jp:`「${en}」の にほんごは？`, prompt: en, options: m.opts, answer: m.pos, audio: en });
      // Picture → EN
      m = mc(en, ens);
      Q({ stars: 2, ptype: ptype+"_pic2en", prompt_jp:`これは えいごで？`, promptImage: emoji, options: m.opts, answer: m.pos });
    });
  }
  vocabBundle(animals, "animal");
  vocabBundle(food, "food");
  vocabBundle(family, "family");
  vocabBundle(classroom, "class");
  vocabBundle(weather, "weather");
  vocabBundle(hobbies, "hobby");
  vocabBundle(places, "place");
  vocabBundle(clothes, "clothes");

  // ========== GRAMMAR ==========
  // Be verbs
  const beq = [
    ["I ___ a student.", "am", ["am","is","are","be"], "わたしは せいとです"],
    ["She ___ my friend.", "is", ["am","is","are","be"], "かのじょは ともだち"],
    ["They ___ happy.", "are", ["am","is","are","be"], "かれらは うれしい"],
    ["He ___ tall.", "is", ["am","is","are","be"], "かれは せが たかい"],
    ["You ___ smart.", "are", ["am","is","are","be"], "あなたは あたまがいい"],
    ["We ___ from Japan.", "are", ["am","is","are","be"], "わたしたちは にほんから"],
    ["It ___ a cat.", "is", ["am","is","are","be"], "それは ねこです"],
    ["My dad ___ a cook.", "is", ["am","is","are","be"], "ちちは コックです"],
    ["The dogs ___ cute.", "are", ["am","is","are","be"], "いぬたちは かわいい"],
    ["I ___ ten years old.", "am", ["am","is","are","be"], "10さい"],
  ];
  beq.forEach(([s, ans, opts, jp]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"be", prompt_jp: jp, prompt: s, options: m.opts, answer: m.pos });
  });

  // Pronouns
  const pron = [
    ["___ am Yuki.", "I", ["I","You","He","She"]],
    ["___ are my friend.", "You", ["I","You","He","She"]],
    ["___ is a doctor. (man)", "He", ["I","You","He","She"]],
    ["___ is a teacher. (woman)", "She", ["I","You","He","She"]],
    ["___ are happy. (us)", "We", ["We","They","I","He"]],
    ["___ are dogs.", "They", ["We","They","I","He"]],
    ["This is ___ pencil. (mine)", "my", ["my","your","his","her"]],
    ["That is ___ bag. (yours)", "your", ["my","your","his","her"]],
    ["He likes ___ cat. (his cat)", "his", ["my","your","his","her"]],
    ["She loves ___ mom. (her mom)", "her", ["my","your","his","her"]],
  ];
  pron.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"pron", prompt_jp:"あてはまる ことばは？", prompt:s, options: m.opts, answer: m.pos });
  });

  // a / an
  const aan = [
    ["I have ___ apple.","an"], ["She has ___ dog.","a"], ["He is ___ student.","a"],
    ["This is ___ egg.","an"], ["I see ___ orange.","an"], ["I want ___ banana.","a"],
    ["She is ___ artist.","an"], ["I have ___ umbrella.","an"], ["He has ___ pen.","a"],
    ["Look at ___ elephant.","an"],
  ];
  aan.forEach(([s, ans]) => {
    const m = mc(ans, ["a","an","the","is"]);
    Q({ stars:1, ptype:"a_an", prompt_jp:"「a」か「an」？", prompt:s, options: m.opts, answer: m.pos });
  });

  // Plurals
  const plurals = [
    ["one cat, two ___","cats",["cat","cats","cates","caties"]],
    ["one box, two ___","boxes",["boxes","boxs","box","boxies"]],
    ["one dog, two ___","dogs",["dog","dogs","dogges","doges"]],
    ["one baby, two ___","babies",["babys","babies","baby","babes"]],
    ["one bus, two ___","buses",["buss","buses","bus","busies"]],
    ["one child, two ___","children",["childs","childes","children","childies"]],
    ["one foot, two ___","feet",["foots","feets","feet","feeties"]],
    ["one fish, two ___","fish",["fish","fishs","fishes","fishies"]],
    ["one tooth, two ___","teeth",["tooths","teeth","tothes","toothies"]],
    ["one mouse, two ___","mice",["mouses","mice","mices","mousies"]],
  ];
  plurals.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"plural", prompt_jp:"ふくすうけい は？", prompt:s, options: m.opts, answer: m.pos });
  });

  // this / that / these / those
  const tt = [
    ["___ is my pen. (close)", "This"],
    ["___ is your bag. (far)", "That"],
    ["___ are my books. (close, plural)", "These"],
    ["___ are her shoes. (far, plural)", "Those"],
    ["What is ___? (close)", "this"],
    ["Who is ___? (far)", "that"],
    ["I like ___ apples. (close)", "these"],
    ["Look at ___ stars. (far)", "those"],
  ];
  tt.forEach(([s, ans]) => {
    const m = mc(ans, ["This","That","These","Those","this","that","these","those"]);
    Q({ stars:2, ptype:"this_that", prompt_jp:"あてはまる ことば？", prompt:s, options: m.opts, answer: m.pos });
  });

  // simple present 3rd person
  const sp = [
    ["He ___ apples.","likes",["like","likes","liking","liked"]],
    ["She ___ tennis.","plays",["play","plays","playing","played"]],
    ["My dad ___ to work.","goes",["go","goes","going","gone"]],
    ["The cat ___ milk.","drinks",["drink","drinks","drinking","drunk"]],
    ["Yuki ___ a book.","reads",["read","reads","reading","red"]],
    ["I ___ apples.","like",["like","likes","liking","liked"]],
    ["We ___ soccer.","play",["play","plays","playing","played"]],
    ["They ___ to school.","go",["go","goes","going","gone"]],
    ["Mom ___ dinner.","cooks",["cook","cooks","cooking","cooked"]],
    ["The bird ___ in the tree.","sings",["sing","sings","singing","sang"]],
  ];
  sp.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"present", prompt_jp:"ただしい かたちは？", prompt:s, options: m.opts, answer: m.pos });
  });

  // can / can't
  const can = [
    ["I ___ swim. (はい、できます)", "can"],
    ["She ___ fly. (とべない)", "can't"],
    ["A bird ___ fly.", "can"],
    ["A fish ___ walk.", "can't"],
    ["My dog ___ run fast.", "can"],
    ["I ___ read kanji. (できない)", "can't"],
    ["___ you sing? — Yes, I can.", "Can"],
    ["___ you play piano? — No, I can't.", "Can"],
    ["Bats ___ see well.", "can't"],
    ["My baby brother ___ talk yet.", "can't"],
  ];
  can.forEach(([s, ans]) => {
    const m = mc(ans, ["can","can't","Can","do"]);
    Q({ stars:2, ptype:"can", prompt_jp:"can / can't どっち？", prompt:s, options: m.opts, answer: m.pos });
  });

  // want to / don't want to
  const want = [
    ["I ___ eat ice cream. (たべたい)", "want to"],
    ["I ___ go to bed. (いきたくない)", "don't want to"],
    ["She ___ play. (したい)", "wants to"],
    ["He ___ study. (したくない)", "doesn't want to"],
    ["___ you want to go?", "Do"],
    ["I want ___ go home.", "to"],
    ["I ___ eat poop. (たべたくない)", "don't want to"],
    ["My cat ___ sleep. (したい)", "wants to"],
  ];
  want.forEach(([s, ans]) => {
    const m = mc(ans, ["want to","don't want to","wants to","doesn't want to","Do","to","Does","want"]);
    Q({ stars:3, ptype:"want", prompt_jp:"したい / したくない", prompt:s, options: m.opts, answer: m.pos });
  });

  // Prepositions
  const prep = [
    ["The cat is ___ the box. (中)", "in"],
    ["The book is ___ the desk. (上)", "on"],
    ["The ball is ___ the chair. (下)", "under"],
    ["The dog is ___ the tree. (横)", "next to"],
    ["The bird is ___ the sky. (中)", "in"],
    ["The picture is ___ the wall. (上 / かべ)", "on"],
    ["The shoes are ___ the bed. (下)", "under"],
    ["The poop is ___ the toilet. 🚽", "in"],
  ];
  prep.forEach(([s, ans]) => {
    const m = mc(ans, ["in","on","under","next to","at","by"]);
    Q({ stars:2, ptype:"prep", prompt_jp:"あてはまる ばしょは？", prompt:s, options: m.opts, answer: m.pos });
  });

  // WH questions
  const wh = [
    ["___ is your name? — I'm Yuki.","What"],
    ["___ are you? — I'm fine.","How"],
    ["___ old are you? — Ten.","How"],
    ["___ is that? — It's my dad.","Who"],
    ["___ do you live? — In Tokyo.","Where"],
    ["___ is your birthday? — May 5.","When"],
    ["___ is this? — A book.","What"],
    ["___ many cats? — Three.","How"],
    ["___ color is it? — Red.","What"],
    ["___ is the bag? — On the chair.","Where"],
    ["___ time is it? — 3 o'clock.","What"],
    ["___ are you sad? — I lost my dog.","Why"],
  ];
  wh.forEach(([s, ans]) => {
    const m = mc(ans, ["What","Who","Where","When","Why","How"]);
    Q({ stars:2, ptype:"wh", prompt_jp:"WHしつもん:", prompt:s, options: m.opts, answer: m.pos });
  });

  // Days / months
  const days = [["Monday","げつようび"],["Tuesday","かようび"],["Wednesday","すいようび"],["Thursday","もくようび"],
                ["Friday","きんようび"],["Saturday","どようび"],["Sunday","にちようび"]];
  days.forEach(([en, jp]) => {
    const m = mc(en, days.map(d=>d[0]));
    Q({ stars:2, ptype:"day", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const mjp = ["1がつ","2がつ","3がつ","4がつ","5がつ","6がつ","7がつ","8がつ","9がつ","10がつ","11がつ","12がつ"];
  months.forEach((en, i) => {
    const m = mc(en, months);
    Q({ stars:2, ptype:"month", prompt_jp:`「${mjp[i]}」は えいごで？`, options: m.opts, answer: m.pos });
  });

  // Time / numbers extended
  const moreNums = [["11","eleven"],["12","twelve"],["13","thirteen"],["14","fourteen"],["15","fifteen"],
                    ["20","twenty"],["30","thirty"],["50","fifty"],["100","one hundred"]];
  const numWords = moreNums.map(n=>n[1]).concat(["one","two","three","four","five","six","seven","eight","nine","ten"]);
  moreNums.forEach(([n, en]) => {
    const m = mc(en, numWords);
    Q({ stars:2, ptype:"num", prompt_jp:`「${n}」は えいごで？`, prompt:n, options: m.opts, answer: m.pos });
  });

  // ★1 Listen-and-tap single word (was misclassified at 3★)
  const listenWords = ["apple","banana","cat","dog","school","friend","happy","big","red","fish","mom","dad","run","jump","book","chair"];
  listenWords.forEach((w) => {
    const m = mc(w, listenWords);
    Q({ stars:1, ptype:"listen_word", prompt_jp:`きこえた えいたん は？ 🔊`, audio:w, options: m.opts, answer: m.pos });
  });

  // ★2 Q&A scenarios (was 3★, but it's straightforward response-matching)
  const qa = [
    ["What's this?","It's a pen.",["It's a pen.","I'm Yuki.","Yes, I do.","On the desk."]],
    ["How are you?","I'm fine.",["I'm fine.","It's red.","I have a dog.","No, I'm not."]],
    ["Where do you live?","In Osaka.",["In Osaka.","I'm ten.","I like fish.","Yes, I am."]],
    ["What color is it?","It's blue.",["It's blue.","I'm a boy.","No, thanks.","On Monday."]],
    ["How old is your sister?","She's seven.",["She's seven.","She's a doctor.","Yes, she does.","In school."]],
    ["Do you like pizza?","Yes, I do.",["Yes, I do.","I'm fine.","It's hot.","On Sunday."]],
    ["Can you swim?","Yes, I can.",["Yes, I can.","I'm Yuki.","It's a dog.","On Monday."]],
    ["What time is it?","It's 3 o'clock.",["It's 3 o'clock.","I have a pen.","I'm a girl.","Yes, please."]],
  ];
  qa.forEach(([q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"qa", prompt_jp:"よい こたえは？", prompt:`Q: ${q}`, options: m.opts, answer: m.pos });
  });

  // ============= NEW ★3 CONTENT (proper Eiken 5 difficulty) =============

  // ★3 there is/are (singular vs plural noun phrase)
  const tIsAre = [
    ["There ___ a cat in the box.","is",["is","are","am","be"]],
    ["There ___ three pens on the desk.","are",["is","are","am","be"]],
    ["There ___ many flowers.","are",["is","are","am","be"]],
    ["There ___ some milk in the cup.","is",["is","are","am","be"]],
    ["There ___ no children here.","are",["is","are","am","be"]],
    ["There ___ a book and two pencils.","are",["is","are","am","be"]],
    ["There ___ water on the floor.","is",["is","are","am","be"]],
    ["There ___ a school near my house.","is",["is","are","am","be"]],
  ];
  tIsAre.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"there_is", prompt_jp:"There is / There are どっち？", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★3 some/any
  const someAny = [
    ["I have ___ apples.","some",["some","any","much","one"]],
    ["Do you have ___ pets?","any",["some","any","much","one"]],
    ["I don't have ___ money.","any",["some","any","much","one"]],
    ["She has ___ friends in Tokyo.","some",["some","any","much","one"]],
    ["Are there ___ cookies left?","any",["some","any","much","one"]],
    ["There is ___ water in the bottle.","some",["some","any","much","one"]],
    ["Is there ___ milk in the fridge?","any",["some","any","much","one"]],
  ];
  someAny.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"some_any", prompt_jp:"some / any?", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★3 frequency adverbs
  const freq = [
    ["I ___ play video games. (まいにち)","always",["always","never","sometimes","usually"]],
    ["She ___ eats meat. (ぜったいに たべない)","never",["always","never","sometimes","usually"]],
    ["We ___ go to the beach in summer. (たいてい)","usually",["always","never","sometimes","usually"]],
    ["He ___ helps his mom. (ときどき)","sometimes",["always","never","sometimes","usually"]],
    ["Cats ___ like water. (あんまり)","never",["always","never","sometimes","usually"]],
    ["I ___ watch TV after dinner. (ほぼ いつも)","usually",["always","never","sometimes","usually"]],
  ];
  freq.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"frequency", prompt_jp:"ひんどの ことば", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★3 Time prepositions (in/on/at)
  const tPrep = [
    ["I get up ___ 7 o'clock.","at",["in","on","at","by"]],
    ["My birthday is ___ May.","in",["in","on","at","by"]],
    ["School starts ___ Monday.","on",["in","on","at","by"]],
    ["I sleep ___ night.","at",["in","on","at","by"]],
    ["I was born ___ 2014.","in",["in","on","at","by"]],
    ["See you ___ Sunday.","on",["in","on","at","by"]],
    ["I have lunch ___ noon.","at",["in","on","at","by"]],
    ["It snows ___ winter.","in",["in","on","at","by"]],
  ];
  tPrep.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"tprep", prompt_jp:"in / on / at", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★3 Listening comprehension (multi-fact in audio, recall a detail)
  const listenComp = [
    ["I have a brother and two sisters.", "How many sisters?", "two", ["one","two","three","four"]],
    ["My cat is white and small.", "What color is the cat?", "white", ["white","black","brown","pink"]],
    ["I like apples and grapes.", "Does he like grapes?", "Yes", ["Yes","No","Maybe","Don't know"]],
    ["The book is on the desk.", "Where is the book?", "on the desk", ["on the desk","in the bag","on the bed","under the chair"]],
    ["I have three cats and one dog.", "How many pets in total?", "four", ["three","four","five","six"]],
    ["My dad is a doctor.", "What is his job?", "doctor", ["doctor","teacher","cook","driver"]],
    ["It's three thirty.", "What time is it?", "3:30", ["3:00","3:30","2:30","4:30"]],
    ["I want pizza for dinner.", "What does she want?", "pizza", ["pizza","sushi","ramen","curry"]],
    ["My birthday is May fifth.", "When is the birthday?", "May 5", ["May 5","May 15","June 5","April 5"]],
    ["The dog is in the garden.", "Where is the dog?", "in the garden", ["in the garden","in the house","at school","on the bed"]],
  ];
  listenComp.forEach(([sent, q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"listen_comp", prompt_jp:`きいて こたえて 🔊\n${q}`, audio:sent, options: m.opts, answer: m.pos });
  });

  // ★3 Subject-verb agreement edge cases
  const sv = [
    ["My friend and I ___ students.","are",["am","is","are","be"]],
    ["Everyone ___ happy today.","is",["am","is","are","be"]],
    ["Everybody ___ here!","is",["am","is","are","be"]],
    ["Both my parents ___ teachers.","are",["am","is","are","be"]],
    ["My family ___ big.","is",["am","is","are","be"]],
    ["The dogs and the cat ___ playing.","are",["am","is","are","be"]],
    ["Each student ___ a pencil.","has",["have","has","having","had"]],
    ["The news ___ exciting.","is",["am","is","are","be"]],
  ];
  sv.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"sv_agree", prompt_jp:"しゅごと どうし の あわせ", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★3 Numbers in context (price, phone, time)
  const numCtx = [
    ["Q: How much is it? A: It's ___ yen. (500)", "five hundred", ["five hundred","fifty","five thousand","fifteen"]],
    ["Q: What time is it? A: It's ___. (10:15)", "ten fifteen", ["ten fifteen","ten fifty","fifteen ten","ten thirty"]],
    ["Q: How old? A: I'm ___. (12)", "twelve", ["twelve","twenty","two","ten"]],
    ["Q: How many? A: ___. (50)", "fifty", ["fifteen","fifty","five","five hundred"]],
    ["Q: What's the score? A: ___ to ___. (3-2)", "three to two", ["three to two","two to three","thirteen to two","thirty to twenty"]],
  ];
  numCtx.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"num_ctx", prompt_jp:"よい こたえは？", prompt:s, options: m.opts, answer: m.pos });
  });

  // ============= EIKEN-STYLE EXTENSIONS =============
  // Inspired by actual Eiken 5 past papers — vocab/grammar fills, conversation
  // responses, sentence ordering (the genuine 3★ test format), and listening responses.

  // ★3 SENTENCE ORDERING (Eiken 5 Section 3 format) — 40+ items
  // Pick the correctly-ordered English sentence.
  function shuffleWords(correct) {
    // Make 3 wrong orderings of the same words
    const words = correct.replace(/[?.]/g,"").split(/\s+/);
    const punct = correct.match(/[?.]/) ? correct.match(/[?.]/)[0] : "";
    const wrongs = new Set();
    let tries = 0;
    while (wrongs.size < 3 && tries++ < 60) {
      const a = words.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      const cap = a[0][0].toUpperCase() + a[0].slice(1);
      a[0] = cap;
      const cand = a.join(" ") + punct;
      if (cand !== correct) wrongs.add(cand);
    }
    return Array.from(wrongs);
  }
  const orderings = [
    ["これらの くつは いくらですか？", "How much are these shoes?"],
    ["この しゃしん の おんなのこ は だれですか？", "Who is the girl in this photo?"],
    ["あした の ピクニック に なにが ひつよう？", "What do we need for the picnic?"],
    ["トムの おとうさんは なにを おしえますか？", "What does Tom's father teach?"],
    ["わたし は ひろし に あさごはんを つくる", "I am cooking breakfast for Hiroshi"],
    ["あなた の なまえは なんですか？", "What is your name?"],
    ["ねこは どこに いますか？", "Where is the cat?"],
    ["きみは なんさい？", "How old are you?"],
    ["これは だれの ペン？", "Whose pen is this?"],
    ["おかあさんは なにを かいますか？", "What does mother buy?"],
    ["きみは おんがくが すき？", "Do you like music?"],
    ["この いぬは かわいい", "This dog is cute"],
    ["きょうは あついです", "It is hot today"],
    ["にちようびに なにを する？", "What do you do on Sunday?"],
    ["わたしは とうきょうに すんでいます", "I live in Tokyo"],
    ["がっこうには ともだちが たくさん いる", "I have many friends at school"],
    ["まいあさ じてんしゃで がっこうに いきます", "I go to school by bike every morning"],
    ["きみの たんじょうびは いつ？", "When is your birthday?"],
    ["この くつは とても たかい", "These shoes are very expensive"],
    ["あの とりは あおいですか？", "Is that bird blue?"],
    ["かれは サッカーが できますか？", "Can he play soccer?"],
    ["わたしは ほん を よみたいです", "I want to read a book"],
    ["かのじょは すしを たべません", "She does not eat sushi"],
    ["がっこうは どこですか？", "Where is the school?"],
    ["この ケーキは おいしい", "This cake is delicious"],
    ["きみは なんの どうぶつ が すき？", "What animal do you like?"],
    ["わたし は アメリカ から です", "I am from America"],
    ["かれら は がくせい です", "They are students"],
    ["そら は あおい です", "The sky is blue"],
    ["ねこ は つくえ の した に いる", "The cat is under the desk"],
    ["きょう は すいようび", "Today is Wednesday"],
    ["トム は いつ おきますか？", "When does Tom get up?"],
    ["わたし は おなか が すいた", "I am hungry"],
    ["ボブ は おとうさん より せが たかい", "Bob is taller than his father"],
    ["これ は あなたの かさ？", "Is this your umbrella?"],
    ["わたしの いぬ は かしこい", "My dog is smart"],
    ["かれら は こうえん で あそぶ", "They play in the park"],
    ["わたし は えいごの せんせい です", "I am an English teacher"],
    ["なに を たべる？", "What do you eat?"],
    ["かのじょ は ピアノ を ひく", "She plays the piano"],
  ];
  orderings.forEach(([jp, en]) => {
    const wrongs = shuffleWords(en);
    if (wrongs.length < 3) return;
    const opts = wrongs.slice(0, 3);
    const pos = (Math.random()*4)|0;
    opts.splice(pos, 0, en);
    Q({ stars:3, ptype:"order", prompt_jp:`「${jp}」を ただしい えいごに！`, options: opts, answer: pos });
  });

  // ★2 LISTENING — Hear a question, pick the appropriate response (Eiken 5 Listening Part 1)
  const listenResp = [
    ["Is this your bag?", "Yes, it is.", ["Yes, it is.","Sure, I can.","On the chair.","I have a pen."]],
    ["Who likes tennis in your family?", "My sister does.", ["My sister does.","It's a racket.","At school.","Pizza, please."]],
    ["What's that bird?", "I don't know.", ["I don't know.","Thank you.","I like this park.","Yes, I am."]],
    ["I like cats. How about you?", "Me, too.", ["Me, too.","Over there.","Good idea.","Thank you."]],
    ["How many books do you have?", "Only one.", ["Only one.","By bike.","My favorite.","On Tuesday."]],
    ["How old is your baby?", "10 months old.", ["10 months old.","He's fine.","Good job.","Yes, I do."]],
    ["Do you live in Osaka?", "That's right.", ["That's right.","By bus.","Nice to meet you.","I'm fine."]],
    ["Does your mother have a dog?", "No, she doesn't.", ["No, she doesn't.","No, she's a teacher.","Yes, please.","On Tuesday."]],
    ["My birthday is in May.", "Mine is in April.", ["Mine is in April.","It's a big party.","I like winter.","No, thanks."]],
    ["When is the show?", "It's next week.", ["It's next week.","I want a cake.","Please buy flowers.","Yes, I can."]],
    ["We have a lot of cookies.", "We can share them.", ["We can share them.","Yes, it is.","I don't like salad.","Good morning."]],
    ["Where is your school?", "Near the station.", ["Near the station.","I'm ten.","Yes, I do.","Pizza."]],
    ["What time is it now?", "It's 3 o'clock.", ["It's 3 o'clock.","I'm Yuki.","On the desk.","Yes, I am."]],
    ["Can you help me?", "Sure, I can.", ["Sure, I can.","I'm fine.","On Monday.","Pizza."]],
    ["Do you want some water?", "Yes, please.", ["Yes, please.","I'm Yuki.","On Tuesday.","I can swim."]],
    ["What's your favorite color?", "Blue.", ["Blue.","I'm a boy.","On the chair.","Yes, please."]],
    ["Where's your mother?", "In the kitchen.", ["In the kitchen.","She is fine.","I'm hungry.","Yes."]],
    ["How's the weather?", "It's sunny.", ["It's sunny.","I'm Yuki.","Pizza.","Yes."]],
    ["What do you do after school?", "I play soccer.", ["I play soccer.","I'm fine.","I am ten.","Yes, please."]],
    ["Do you like math?", "Yes, I do.", ["Yes, I do.","On Sunday.","I'm Yuki.","Pizza."]],
  ];
  listenResp.forEach(([q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"listen_resp", prompt_jp:`しつもんを きいて、こたえを えらべ！ 🔊`, audio: q, options: m.opts, answer: m.pos });
  });

  // ★2 CONVERSATION COMPLETION (Eiken 5 Section 2)
  const conv = [
    ["Teacher: Let's start the lesson. ___\nStudent: OK.", "Please open your book.", ["Please open your book.","See you tomorrow.","You can go home.","I'm sleepy."]],
    ["Woman: What time is the next train?\nMan: ___", "At five o'clock.", ["At five o'clock.","Yes, it does.","For one hour.","It's good."]],
    ["Mother: Bob, help me with dinner.\nBoy: ___ I'm coming.", "All right.", ["All right.","No, I can't.","It's ready.","You can drink it."]],
    ["Girl: What class do you like?\nBoy: ___", "Science.", ["Science.","I go to school.","After lunch.","It's my homework."]],
    ["Teacher: Please close the windows. ___\nStudent: Yes.", "It's cold.", ["It's cold.","Good morning.","Here you are.","It's today."]],
    ["A: Are you ready?\nB: ___", "Yes, I am.", ["Yes, I am.","I'm Yuki.","On Friday.","I have a pen."]],
    ["A: How was the test?\nB: ___", "It was easy.", ["It was easy.","I'm a student.","Pizza, please.","On Monday."]],
    ["A: Whose ball is this?\nB: ___", "It's mine.", ["It's mine.","Yes, I do.","On the field.","Pink."]],
    ["A: Excuse me. May I help you?\nB: ___", "Yes, please.", ["Yes, please.","I'm fine.","Goodbye.","See you."]],
    ["A: How was your weekend?\nB: ___", "It was great!", ["It was great!","I'm a girl.","Yes, please.","On Saturday."]],
    ["A: Let's play in the park.\nB: ___", "That sounds fun!", ["That sounds fun!","I'm fine, thanks.","On Tuesday.","I have a dog."]],
    ["A: Mom, I'm hungry.\nB: ___", "OK, dinner is almost ready.", ["OK, dinner is almost ready.","I'm Yuki.","On the table.","Yes, I do."]],
    ["A: Happy birthday!\nB: ___", "Thank you!", ["Thank you!","Good night.","Pizza, please.","See you."]],
    ["A: Don't run inside.\nB: ___", "Sorry.", ["Sorry.","Yes, I can.","On Tuesday.","I'm fine."]],
    ["A: Is this your phone?\nB: ___", "No, it's not.", ["No, it's not.","I'm Yuki.","On Sunday.","Pizza."]],
  ];
  conv.forEach(([q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"conv", prompt_jp:`あう こたえは どれ？`, prompt:q, options: m.opts, answer: m.pos });
  });

  // ★2 MORE GRAMMAR FILLS (Eiken 5 Section 1 style)
  const moreGram = [
    ["Mr. Sato is a teacher. He ___ math.","teaches",["plays","draws","speaks","teaches"]],
    ["It's raining. Let's eat ___ home.","at",["at","in","on","under"]],
    ["I always go shopping ___ Sunday.","on",["on","at","in","by"]],
    ["I ___ a cat. She is cute.","have",["have","has","had","having"]],
    ["Dad, please ___ this wall.","paint",["swim","sleep","paint","play"]],
    ["I want some ___ in my coffee.","sugar",["paper","sun","light","sugar"]],
    ["Is your brother on the team? Yes, ___ right.","that's",["we're","that's","she's","I'm"]],
    ["Are you Canadian? No. I'm ___ America.","from",["to","from","under","by"]],
    ["She often ___ pictures.","takes",["tells","does","takes","sings"]],
    ["I like tennis. What ___ you?","about",["over","about","down","after"]],
    ["My dad goes jogging ___ the morning.","in",["on","in","out","down"]],
    ["Keiko and Megumi are friends. ___ like tennis.","They",["They","He","She","You"]],
    ["Let's clean ___ classroom.","our",["we","our","us","ours"]],
    ["What is Scott doing? He is ___ a doghouse.","making",["make","making","makes","made"]],
    ["I'm reading a book ___ my room.","in",["in","on","at","by"]],
    ["My birthday is ___ June 5.","on",["on","at","in","by"]],
    ["I get up ___ 7 in the morning.","at",["at","on","in","by"]],
    ["She is ___ tall girl.","a",["a","an","the","is"]],
    ["I have ___ apple every morning.","an",["a","an","the","is"]],
    ["___ you have any pets? Yes, a dog.","Do",["Do","Does","Are","Is"]],
    ["___ your sister like music?","Does",["Do","Does","Are","Is"]],
    ["Look at ___ boy. He is my brother.","that",["this","that","these","those"]],
    ["Whose pencil is this? It's ___.","mine",["my","mine","me","I"]],
    ["I want ___ go to the zoo.","to",["to","at","on","in"]],
    ["She is good ___ tennis.","at",["at","on","in","by"]],
    ["The cat is ___ the table.","under",["under","up","into","of"]],
    ["I have a ball. ___ is red.","It",["It","He","She","They"]],
    ["___ bag is this? — Mine.","Whose",["Who","Whose","What","Where"]],
    ["I'm tired. Let's ___ a break.","take",["take","make","do","get"]],
    ["My birthday party is ___ Saturday.","on",["on","at","in","by"]],
  ];
  moreGram.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"gram_fill", prompt_jp:"あてはまる ことば は？", prompt:s, options: m.opts, answer: m.pos });
  });

  // More vocab — school subjects, daily routines, family
  const subjects = [["math","さんすう","🧮"],["science","りか","🔬"],["English","えいご","🔤"],["art","びじゅつ","🎨"],
    ["music","おんがく","🎵"],["P.E.","たいいく","⚽"],["Japanese","こくご","✏️"],["history","れきし","📜"],
    ["lunch","きゅうしょく","🍱"],["recess","きゅうけい","🤸"]];
  subjects.forEach(([en, jp, emoji]) => {
    let m = mc(en, subjects.map(s=>s[0]));
    Q({ stars:1, ptype:"subj_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
    m = mc(jp, subjects.map(s=>s[1]));
    Q({ stars:1, ptype:"subj_en2jp", prompt_jp:`「${en}」の いみ は？`, prompt:en, audio:en, options: m.opts, answer: m.pos });
    m = mc(en, subjects.map(s=>s[0]));
    Q({ stars:2, ptype:"subj_pic", prompt_jp:`これは えいごで？`, promptImage: emoji, options: m.opts, answer: m.pos });
  });

  // Daily routine words
  const daily = [["wake up","おきる"],["have breakfast","あさごはんを たべる"],["go to school","がっこうへ いく"],
    ["come home","いえに かえる"],["do homework","しゅくだいを する"],["take a bath","おふろに はいる"],
    ["go to bed","ねる"],["watch TV","テレビを みる"],["play games","ゲームを する"],["read a book","ほんを よむ"]];
  daily.forEach(([en, jp]) => {
    const m = mc(en, daily.map(d=>d[0]));
    Q({ stars:2, ptype:"daily", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });

  // More family + people
  const ppl = [["man","おとこのひと"],["woman","おんなのひと"],["boy","おとこのこ"],["girl","おんなのこ"],
    ["baby","あかちゃん"],["child","こども"],["children","こどもたち"],["people","ひとびと"],
    ["teacher","せんせい"],["student","せいと"],["friend","ともだち"],["classmate","クラスメイト"]];
  ppl.forEach(([en, jp]) => {
    const m = mc(en, ppl.map(p=>p[0]));
    Q({ stars:1, ptype:"ppl_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
    const m2 = mc(jp, ppl.map(p=>p[1]));
    Q({ stars:1, ptype:"ppl_en2jp", prompt_jp:`「${en}」の いみ は？`, prompt:en, audio:en, options: m2.opts, answer: m2.pos });
  });

  window.QUESTIONS_LEVEL2 = all;
})();
