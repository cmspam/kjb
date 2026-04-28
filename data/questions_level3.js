// Level 3 — Eiken 4 grammar + vocab. Past/future tense, modals, conjunctions, time words, comprehension.
(function () {
  const all = [];
  let nid = 0;
  const Q = (o) => { all.push({ id: "L3-" + (++nid).toString().padStart(3,"0"), level:3, type:"mc", ...o }); };

  function mc(answer, pool, count=4) {
    const distract = [];
    while (distract.length < count-1) { const x = pool[(Math.random()*pool.length)|0]; if (x!==answer && !distract.includes(x)) distract.push(x); }
    const opts = distract.slice(); const pos = (Math.random()*count)|0; opts.splice(pos, 0, answer);
    return { opts, pos };
  }

  // ========= EXTENDED VOCAB (Eiken 4) =========
  const jobs = [
    ["doctor","いしゃ","🧑‍⚕️"],["teacher","せんせい","👩‍🏫"],["nurse","かんごし","👩‍⚕️"],["police","けいさつ","👮"],
    ["farmer","のうふ","🧑‍🌾"],["chef","コック","👨‍🍳"],["pilot","パイロット","🧑‍✈️"],["singer","かしゅ","🎤"],
    ["artist","アーティスト","🎨"],["dentist","はいしゃ","🦷"],["fireman","しょうぼうし","🧑‍🚒"],["scientist","かがくしゃ","🧑‍🔬"],
    ["driver","うんてんしゅ","🚗"],["writer","さっか","✍️"],["dancer","ダンサー","💃"],
  ];
  const advHobbies = [
    ["camping","キャンプ","⛺"],["fishing","つり","🎣"],["cooking","りょうり","🍳"],["shopping","かいもの","🛍️"],
    ["hiking","ハイキング","🥾"],["skating","スケート","⛸️"],["skiing","スキー","🎿"],["bowling","ボーリング","🎳"],
    ["watching TV","テレビを みる","📺"],["playing video games","ゲーム","🎮"],
  ];
  const nature = [
    ["mountain","やま","⛰️"],["river","かわ","🌊"],["sea","うみ","🌊"],["lake","みずうみ","🏞️"],
    ["forest","もり","🌲"],["sky","そら","☁️"],["cloud","くも","☁️"],["star","ほし","⭐"],
    ["moon","つき","🌙"],["beach","ビーチ","🏖️"],["island","しま","🏝️"],["wind","かぜ","💨"],
  ];
  const houseStuff = [
    ["bedroom","しんしつ","🛏️"],["kitchen","だいどころ","🍳"],["bathroom","おふろ","🛁"],["living room","リビング","🛋️"],
    ["window","まど","🪟"],["door","ドア","🚪"],["wall","かべ","🧱"],["floor","ゆか","🪵"],
    ["table","テーブル","🪑"],["bed","ベッド","🛏️"],["sofa","ソファ","🛋️"],["TV","テレビ","📺"],
    ["refrigerator","れいぞうこ","🧊"],["computer","パソコン","💻"],
  ];
  const transport = [
    ["car","くるま","🚗"],["bus","バス","🚌"],["train","でんしゃ","🚆"],["airplane","ひこうき","✈️"],
    ["ship","ふね","🚢"],["bike","じてんしゃ","🚲"],["motorcycle","バイク","🏍️"],["taxi","タクシー","🚕"],
    ["helicopter","ヘリコプター","🚁"],["truck","トラック","🚚"],
  ];

  function vocabBundle(list, ptype) {
    const ens = list.map(x=>x[0]); const jps = list.map(x=>x[1]);
    list.forEach(([en, jp, emoji]) => {
      let m = mc(en, ens);
      Q({ stars:1, ptype:ptype+"_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
      m = mc(jp, jps);
      Q({ stars:1, ptype:ptype+"_en2jp", prompt_jp:`「${en}」の いみは？`, prompt: en, options: m.opts, answer: m.pos, audio:en });
      m = mc(en, ens);
      Q({ stars:2, ptype:ptype+"_pic", prompt_jp:`これは えいごで？`, promptImage: emoji, options: m.opts, answer: m.pos });
    });
  }
  vocabBundle(jobs, "job");
  vocabBundle(advHobbies, "ahobby");
  vocabBundle(nature, "nature");
  vocabBundle(houseStuff, "house");
  vocabBundle(transport, "trans");

  // ========= PAST TENSE =========
  const pastReg = [
    ["I ___ to school yesterday.","walked",["walk","walks","walked","walking"]],
    ["She ___ a song.","sang",["sing","sings","sang","sung"]],
    ["He ___ his homework.","did",["do","does","did","done"]],
    ["They ___ a movie last night.","watched",["watch","watches","watched","watching"]],
    ["We ___ pizza for dinner.","ate",["eat","eats","ate","eaten"]],
    ["I ___ a new game.","bought",["buy","buyed","bought","buys"]],
    ["My mom ___ a cake.","made",["make","makes","maked","made"]],
    ["The dog ___ in the park.","ran",["run","runs","ran","running"]],
    ["I ___ tired yesterday.","was",["am","is","was","were"]],
    ["They ___ at home.","were",["was","were","is","are"]],
    ["She ___ an email.","wrote",["write","writes","wrote","written"]],
    ["He ___ to Tokyo.","went",["go","goes","went","gone"]],
    ["I ___ a book yesterday.","read",["read","reads","reading","readed"]],
    ["We ___ early.","slept",["sleep","sleeps","slept","sleeping"]],
    ["The cat ___ a fish.","caught",["catch","catched","caught","catches"]],
  ];
  pastReg.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"past", prompt_jp:"かこけい は？", prompt:s, options: m.opts, answer: m.pos });
  });

  // Past tense — JP→EN
  const pastTrans = [
    ["I ate apples.","りんごを たべた"],
    ["She went to school.","がっこうへ いった"],
    ["He played soccer.","サッカーを した"],
    ["We saw a movie.","えいがを みた"],
    ["I was sick yesterday.","きのう びょうきだった"],
    ["They ran fast.","はやく はしった"],
    ["I bought a pen.","ペンを かった"],
    ["My dad cooked dinner.","ちちが ばんごはんを つくった"],
  ];
  pastTrans.forEach(([en, jp]) => {
    const all_ens = pastTrans.map(x=>x[0]);
    const m = mc(en, all_ens);
    Q({ stars:3, ptype:"past_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });

  // ========= FUTURE =========
  const fut = [
    ["I ___ go tomorrow.","will",["will","do","is","am"]],
    ["She ___ visit Kyoto.","will",["will","does","is","do"]],
    ["He is ___ to study.","going",["go","going","goes","gone"]],
    ["They ___ help us.","will",["will","do","were","are"]],
    ["We are ___ to play.","going",["go","going","goes","gone"]],
    ["I ___ be a doctor.","will",["will","do","is","be"]],
    ["What ___ you do tomorrow?","will",["will","is","do","does"]],
    ["I'm going ___ Tokyo.","to",["to","at","in","on"]],
  ];
  fut.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"future", prompt_jp:"みらい かたち", prompt:s, options: m.opts, answer: m.pos });
  });

  // ========= SHOULD / SHOULDN'T =========
  const should = [
    ["You ___ eat vegetables. (たべるべき)","should"],
    ["You ___ eat poop. (たべるべきじゃない 💩)","shouldn't"],
    ["We ___ study English. (したほうがいい)","should"],
    ["He ___ run inside. (してはいけない)","shouldn't"],
    ["You ___ help your mom.","should"],
    ["We ___ be late.","shouldn't"],
    ["She ___ rest. She is tired.","should"],
    ["You ___ talk in the library.","shouldn't"],
  ];
  should.forEach(([s, ans]) => {
    const m = mc(ans, ["should","shouldn't","can","can't"]);
    Q({ stars:2, ptype:"should", prompt_jp:"should / shouldn't", prompt:s, options: m.opts, answer: m.pos });
  });

  // ========= COMPARATIVES =========
  const comp = [
    ["An elephant is ___ than a mouse.","bigger",["big","bigger","biggest","more big"]],
    ["A turtle is ___ than a rabbit.","slower",["slow","slower","slowest","more slow"]],
    ["This book is ___ than that book.","better",["good","gooder","better","best"]],
    ["Ice is ___ than water.","colder",["cold","colder","coldest","more cold"]],
    ["My bag is ___ than yours.","newer",["new","newer","newest","more new"]],
    ["He is the ___ runner.","fastest",["fast","faster","fastest","more fast"]],
    ["This is the ___ pizza ever!","best",["good","gooder","better","best"]],
    ["A jet is ___ than a car.","faster",["fast","faster","fastest","more fast"]],
  ];
  comp.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"compare", prompt_jp:"くらべる ことば", prompt:s, options: m.opts, answer: m.pos });
  });

  // ========= TIME WORDS =========
  const time = [
    ["I will go ___. (あした)","tomorrow"],
    ["I went ___. (きのう)","yesterday"],
    ["I am eating ___. (きょう)","today"],
    ["See you ___ week. (らい)","next"],
    ["I saw him ___ week. (せん)","last"],
    ["I'll come ___ month.","next"],
    ["I had pizza ___ night.","last"],
    ["School starts ___ morning.","this"],
    ["I do homework ___ Sundays.","on"],
    ["I sleep ___ night.","at"],
  ];
  time.forEach(([s, ans]) => {
    const m = mc(ans, ["yesterday","today","tomorrow","next","last","this","on","at","in"]);
    Q({ stars:2, ptype:"time", prompt_jp:"じかんの ことば", prompt:s, options: m.opts, answer: m.pos });
  });

  // Time word translation
  const timeTrans = [
    ["yesterday","きのう"],["today","きょう"],["tomorrow","あした"],
    ["last week","せんしゅう"],["next week","らいしゅう"],["this morning","けさ"],
    ["tonight","こんや"],["last night","ゆうべ"],["next month","らいげつ"],
    ["last year","きょねん"],["next year","らいねん"],
  ];
  timeTrans.forEach(([en, jp]) => {
    const m = mc(en, timeTrans.map(t=>t[0]));
    Q({ stars:2, ptype:"time_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });

  // ========= CONJUNCTIONS =========
  const conj = [
    ["I'm tired ___ I worked hard.","because"],
    ["I like cats, ___ I don't like dogs.","but"],
    ["It was raining, ___ I stayed home.","so"],
    ["I was sleeping ___ you called.","when"],
    ["I cried ___ I lost my toy.","because"],
    ["She is small, ___ strong.","but"],
    ["I woke up ___ went to school.","and"],
    ["He fell ___ he was running.","when"],
    ["I farted ___ everyone laughed.","and"],
    ["I want pizza ___ ramen.","or"],
  ];
  conj.forEach(([s, ans]) => {
    const m = mc(ans, ["because","but","so","when","and","or","if"]);
    Q({ stars:3, ptype:"conj", prompt_jp:"つなぎ ことば", prompt:s, options: m.opts, answer: m.pos });
  });

  // ========= QUESTIONS — wh + how =========
  const wh4 = [
    ["___ did you go yesterday? — To the park.","Where"],
    ["___ did you eat? — Pizza.","What"],
    ["___ did you come? — By bus.","How"],
    ["___ did you cry? — I was sad.","Why"],
    ["___ did you see? — My friend.","Who"],
    ["___ did the show start? — At 7.","When"],
    ["___ much is it? — 500 yen.","How"],
    ["___ many books? — Five.","How"],
    ["___ long is it? — Ten meters.","How"],
    ["___ tall are you? — 130 cm.","How"],
  ];
  wh4.forEach(([s, ans]) => {
    const m = mc(ans, ["What","Where","When","Why","Who","How","Whose","Which"]);
    Q({ stars:3, ptype:"wh4", prompt_jp:"WHしつもん:", prompt:s, options: m.opts, answer: m.pos });
  });

  // ========= READING comprehension (short) =========
  const read = [
    [`Yuki has a cat. The cat is white. Its name is Milk.`, "What color is Yuki's cat?", "white", ["white","black","brown","pink"]],
    [`Tom went to the park. He played soccer with his friend.`, "Where did Tom go?", "park", ["park","school","home","store"]],
    [`I like apples. I don't like bananas. My favorite is grapes.`, "What does the speaker like best?", "grapes", ["apples","bananas","grapes","oranges"]],
    [`It was sunny yesterday. We went to the beach. I swam in the sea.`, "What was the weather like?", "sunny", ["rainy","cloudy","sunny","snowy"]],
    [`Mike is hungry. He wants pizza. But his mom made curry.`, "What did Mike's mom make?", "curry", ["pizza","curry","rice","soup"]],
    [`The dog is in the garden. It is sleeping under a tree.`, "Where is the dog?", "in the garden", ["in the garden","in the house","at school","on the bed"]],
    [`I get up at 7. I eat breakfast at 7:30. I go to school at 8.`, "What time is breakfast?", "7:30", ["7:00","7:30","8:00","6:30"]],
    [`Mom is in the kitchen. She is cooking dinner. Dad is reading a book.`, "What is Dad doing?", "reading a book", ["cooking","sleeping","reading a book","watching TV"]],
  ];
  read.forEach(([story, q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"read", prompt_jp:"ぶんを よんで こたえて:", prompt:`${story}\n\n${q}`, options: m.opts, answer: m.pos });
  });

  // ========= LISTENING (sentence) =========
  const listenSents = [
    "I like cats.","I have a dog.","She is happy.","He went to school.","I want pizza.",
    "Can you swim?","What is your name?","I am ten years old.","It is hot today.","I don't like fish."
  ];
  listenSents.forEach((s) => {
    const m = mc(s, listenSents);
    Q({ stars:3, ptype:"listen_sent", prompt_jp:"きこえた ぶんを えらべ！ 🔊", audio:s, options: m.opts, answer: m.pos });
  });

  // ========= MORE Q&A =========
  const qa = [
    ["What did you do yesterday?","I played soccer.",["I played soccer.","I will go.","I'm Yuki.","Yes, I do."]],
    ["Where will you go tomorrow?","To the zoo.",["To the zoo.","Yes, I did.","I am ten.","Pizza."]],
    ["Why are you happy?","I got a new toy.",["I got a new toy.","On Monday.","Yes, please.","I'm fine."]],
    ["When is your birthday?","June 5.",["June 5.","Yes, I am.","On the desk.","Pink."]],
    ["How was your weekend?","It was fun!",["It was fun!","I'm a student.","No, thanks.","On Sunday."]],
    ["Whose bag is this?","It's mine.",["It's mine.","I am ten.","I don't know.","On Tuesday."]],
    ["Which one do you want?","The red one.",["The red one.","Yes, I do.","I'm Yuki.","On Friday."]],
    ["Should I go now?","Yes, you should.",["Yes, you should.","I'm Yuki.","On the table.","Pizza, please."]],
  ];
  qa.forEach(([q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"qa", prompt_jp:"よい こたえは？", prompt:`Q: ${q}`, options: m.opts, answer: m.pos });
  });

  // ========= Idioms / Common phrases =========
  const phrases = [
    ["How are you?","げんき？"],["See you later.","またね。"],["Thank you.","ありがとう。"],
    ["You're welcome.","どういたしまして。"],["I'm sorry.","ごめんね。"],["Excuse me.","すみません。"],
    ["Good morning.","おはよう。"],["Good night.","おやすみ。"],["I'm hungry.","おなかが すいた。"],
    ["I'm thirsty.","のどが かわいた。"],["I'm tired.","つかれた。"],["I'm sleepy.","ねむい。"],
    ["What's up?","どうしたの？"],["Let's go!","いこう！"],["Be careful.","きを つけて。"],
  ];
  phrases.forEach(([en, jp]) => {
    const m = mc(en, phrases.map(p=>p[0]));
    Q({ stars:2, ptype:"phrase", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });

  window.QUESTIONS_LEVEL3 = all;
})();
