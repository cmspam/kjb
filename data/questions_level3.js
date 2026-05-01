// Level 3 — Eiken 4 grammar + vocab. Past/future tense, modals, conjunctions, time words, comprehension.
(function () {
  const all = [];
  let nid = 0;
  const Q = (o) => { all.push({ id: "L3-" + (++nid).toString().padStart(3,"0"), level:3, type:"mc", ...o }); };

  function mc(answer, pool, count=4) {
    const distract = [];
    let g = 0;
    while (distract.length < count-1) {
      if (g++ > 500) {
        try { console.warn("mc: pool too small, padding —", { answer, pool }); } catch(_){}
        while (distract.length < count-1) distract.push(answer);
        break;
      }
      const x = pool[(Math.random()*pool.length)|0];
      if (x!==answer && !distract.includes(x)) distract.push(x);
    }
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
      // Advanced L3 vocab (jobs/nature/transport/etc.) is genuinely harder than
      // L2's basic words but used to share the same ★1 slot, making L3 feel
      // identical to L2 at low difficulty. Promoted to ★2 — kids who pick ★1
      // in L3 now get the L3-flavored grammar below instead of more flashcards.
      let m = mc(en, ens);
      Q({ stars:2, ptype:ptype+"_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
      m = mc(jp, jps);
      Q({ stars:2, ptype:ptype+"_en2jp", prompt_jp:`「${en}」の いみは？`, prompt: en, options: m.opts, answer: m.pos, audio:en });
      // Picture → EN with audio scaffold (kid hears word while seeing emoji)
      m = mc(en, ens);
      Q({ stars:2, ptype:ptype+"_pic", prompt_jp:`これは えいごで？ 🔊`, promptImage: emoji, audio: en, options: m.opts, answer: m.pos });
    });
  }
  vocabBundle(jobs, "job");
  vocabBundle(advHobbies, "ahobby");
  vocabBundle(nature, "nature");
  vocabBundle(houseStuff, "house");
  vocabBundle(transport, "trans");

  // ========= ★1 L3-FLAVORED GRAMMAR (lightweight Eiken 4 patterns) =========
  // These exist so ★1 in L3 isn't pure vocab translation. They're real L3
  // grammar (past/future/modals/time) but kept short and high-frequency so
  // they sit as the ★1 entry point into Eiken 4.

  // ★1 simple past — most common irregular verbs (recognition, not production)
  const easyPast = [
    ["I ___ pizza for dinner.","ate",["eat","ate","eaten","eats"]],
    ["She ___ to school.","went",["go","went","goes","gone"]],
    ["He ___ his homework.","did",["do","did","does","done"]],
    ["We ___ a movie.","saw",["see","saw","seen","sees"]],
    ["I ___ tired yesterday.","was",["am","is","was","were"]],
    ["They ___ at home.","were",["was","were","is","are"]],
    ["I ___ a new book.","read",["read","reads","reading","readed"]],
    ["She ___ a cake.","made",["make","made","makes","maked"]],
    ["The dog ___ fast.","ran",["run","ran","runs","running"]],
    ["I ___ to bed late.","went",["go","went","goes","going"]],
  ];
  easyPast.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"past_easy", prompt_jp:"きのうの こと (かこけい)", prompt:s, options: m.opts, answer: m.pos,
        explain: "yesterday や last night は かこけい。go→went, eat→ate, do→did, see→saw, am/is→was, are→were" });
  });

  // ★1 basic future "will"
  const easyFuture = [
    ["I ___ go tomorrow.","will",["will","do","is","am"]],
    ["She ___ visit Kyoto next week.","will",["will","does","is","do"]],
    ["We ___ play soccer tomorrow.","will",["will","do","are","were"]],
    ["I ___ be a doctor someday.","will",["will","do","is","be"]],
    ["What ___ you do tomorrow?","will",["will","is","do","does"]],
    ["It ___ rain tomorrow.","will",["will","is","does","do"]],
  ];
  easyFuture.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"future_easy", prompt_jp:"あした の こと (みらい)", prompt:s, options: m.opts, answer: m.pos,
        explain: "tomorrow / next … みらいの ことは will + どうし" });
  });

  // ★1 basic should / shouldn't (with strong context cues)
  const easyShould = [
    ["You ___ eat vegetables. (したほうが いい)","should",["should","shouldn't","can","can't"]],
    ["You ___ run inside. (してはダメ)","shouldn't",["should","shouldn't","can","can't"]],
    ["You ___ help your mom.","should",["should","shouldn't","can","can't"]],
    ["We ___ be late.","shouldn't",["should","shouldn't","can","can't"]],
    ["You ___ wash your hands.","should",["should","shouldn't","can","can't"]],
    ["You ___ talk in the library.","shouldn't",["should","shouldn't","can","can't"]],
  ];
  easyShould.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"should_easy", prompt_jp:"should / shouldn't?", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★1 yesterday / today / tomorrow recognition
  const easyTime = [
    ["I'm eating ___. (いま)","today",["today","tomorrow","yesterday","tonight"]],
    ["I went home ___. (きのう)","yesterday",["today","tomorrow","yesterday","tonight"]],
    ["I will go ___. (あした)","tomorrow",["today","tomorrow","yesterday","tonight"]],
    ["I'll see you ___ night.","tonight",["today","tomorrow","yesterday","tonight"]],
    ["I had pizza ___ night. (ゆうべ)","last",["last","next","this","every"]],
    ["See you ___ week. (らいしゅう)","next",["last","next","this","every"]],
  ];
  easyTime.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"time_easy", prompt_jp:"じかんの ことば", prompt:s, options: m.opts, answer: m.pos });
  });

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
    Q({ stars:2, ptype:"past", prompt_jp:"かこけい は？", prompt:s, options: m.opts, answer: m.pos,
        explain: "yesterday や last weekなどの ことばが あれば、かこけい (-ed や ふきそく動詞)" });
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
    Q({ stars:3, ptype:"future", prompt_jp:"みらい かたち", prompt:s, options: m.opts, answer: m.pos,
        explain: "みらい: will + どうし / be going to + どうし" });
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
    Q({ stars:3, ptype:"compare", prompt_jp:"くらべる ことば", prompt:s, options: m.opts, answer: m.pos,
        explain: "くらべる: -er than (みじかい けいようし) / more ___ than (ながい けいようし) / good→better, bad→worse" });
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
    Q({ stars:3, ptype:"conj", prompt_jp:"つなぎ ことば", prompt:s, options: m.opts, answer: m.pos,
        explain: "because: りゆう / but: しかし / so: だから / when: 〜とき / and: と / or: または / if: もし" });
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

  // ★2 Sentence-recognition listening (was 3★ — just word-for-word matching, no comprehension)
  const listenSents = [
    "I like cats.","I have a dog.","She is happy.","He went to school.","I want pizza.",
    "Can you swim?","What is your name?","I am ten years old.","It is hot today.","I don't like fish."
  ];
  listenSents.forEach((s) => {
    const m = mc(s, listenSents);
    Q({ stars:2, ptype:"listen_sent", prompt_jp:"きこえた ぶんを えらべ！ 🔊", audio:s, options: m.opts, answer: m.pos });
  });

  // ★2 Q&A response-matching (was 3★ — straightforward)
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
    Q({ stars:2, ptype:"qa", prompt_jp:"よい こたえは？", prompt:`Q: ${q}`, options: m.opts, answer: m.pos });
  });

  // ============= NEW ★3 CONTENT (proper Eiken 4 difficulty) =============

  // ★3 Past continuous
  const pastCont = [
    ["I ___ sleeping when you called.","was",["was","were","is","am"]],
    ["They ___ playing soccer at 5 pm.","were",["was","were","is","are"]],
    ["She ___ reading a book.","was",["was","were","is","am"]],
    ["What ___ you doing yesterday?","were",["was","were","do","did"]],
    ["My parents ___ watching TV.","were",["was","were","is","are"]],
    ["I wasn't sleeping, I ___ studying.","was",["was","were","do","did"]],
  ];
  pastCont.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"past_cont", prompt_jp:"かこ しんこうけい", prompt:s, options: m.opts, answer: m.pos,
        explain: "かこ しんこうけい: was/were + …ing。I/he/she/it→was, we/you/they→were" });
  });

  // ★3 Present continuous
  const presCont = [
    ["She ___ a book now.","is reading",["is reading","reads","read","is read"]],
    ["They ___ TV right now.","are watching",["watch","watches","are watching","is watching"]],
    ["Look! It ___.","is raining",["rains","is raining","rain","raining"]],
    ["I ___ to music.","am listening",["listen","am listening","is listening","are listening"]],
    ["The dogs ___.","are barking",["bark","barks","is barking","are barking"]],
  ];
  presCont.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"pres_cont", prompt_jp:"げんざい しんこうけい", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★3 Modal nuance: must / have to / should
  const modal = [
    ["You ___ wear a helmet on a bike. (ぜったい)","must"],
    ["You ___ eat vegetables. (したほうがいい)","should"],
    ["I ___ go now. My mom is calling. (しなければ)","have to"],
    ["You ___ hit your sister! (ぜったい だめ)","must not"],
    ["We ___ be quiet in class. (きまり)","must"],
    ["You ___ try this cake! (おすすめ)","should"],
  ];
  modal.forEach(([s, ans]) => {
    const m = mc(ans, ["must","must not","should","have to","can","can't"]);
    Q({ stars:3, ptype:"modal", prompt_jp:"モーダル どうし", prompt:s, options: m.opts, answer: m.pos,
        explain: "must: ぜったい (きまり) / should: したほうが いい / have to: しなければ ならない / must not: ぜったい だめ" });
  });

  // ★3 Conditional (if)
  const cond = [
    ["If it rains, I ___ stay home.","will"],
    ["If you study hard, you ___ pass.","will"],
    ["If I ___ rich, I would buy a car.","were"],
    ["What will you do if you ___ him?","see"],
    ["If you don't hurry, you ___ be late.","will"],
  ];
  cond.forEach(([s, ans]) => {
    const m = mc(ans, ["will","were","see","go","do","is"]);
    Q({ stars:3, ptype:"conditional", prompt_jp:"もし〜なら", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★3 Phrasal verbs
  const phrasal = [
    ["Please ___ the light. (つける)","turn on"],
    ["Don't ___ on your dream! (あきらめる)","give up"],
    ["I'll ___ you ___ at 8.","pick up"],
    ["___ the word in the dictionary. (しらべる)","Look up"],
    ["Please ___ your shoes. (ぬぐ)","take off"],
    ["The plane will ___ soon. (りりく)","take off"],
  ];
  phrasal.forEach(([s, ans]) => {
    const m = mc(ans, ["turn on","turn off","give up","pick up","look up","take off","put on"]);
    Q({ stars:3, ptype:"phrasal", prompt_jp:"フレーズ どうし", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★3 Long reading comprehension (4-5 sentences with inference)
  const longRead = [
    [`Yuki goes to school by bus. The bus stop is near her house. The bus comes at 7:50. She gets to school at 8:15.`,
     "How long is the bus ride?", "25 minutes", ["10 minutes","25 minutes","45 minutes","1 hour"]],
    [`Tom lived in Tokyo for five years. Last year he moved to Osaka with his family. He likes Osaka but he misses his Tokyo friends.`,
     "Where does Tom live now?", "Osaka", ["Tokyo","Osaka","Kyoto","Nagoya"]],
    [`It was raining yesterday. We didn't go to the park. We stayed home and watched a movie. It was fun.`,
     "Why didn't they go to the park?", "It was raining.", ["It was raining.","They were tired.","The park was closed.","They had homework."]],
    [`Mika has three brothers. The oldest is twenty. The youngest is five. Mika is in the middle. She is fifteen.`,
     "How old is the oldest brother?", "20", ["5","15","20","25"]],
    [`I bought a new bike yesterday. It cost 30,000 yen. It is red and very fast. I rode it to school today.`,
     "What color is the bike?", "red", ["blue","red","green","black"]],
    [`Saturday is my birthday. I will have a party at home. Ten friends will come. My mom will make a chocolate cake.`,
     "When is the party?", "Saturday", ["Friday","Saturday","Sunday","Monday"]],
    [`Mr. Brown teaches English at our school. He is from Australia. He likes baseball and sushi. He has lived in Japan for two years.`,
     "Where is Mr. Brown from?", "Australia", ["America","England","Australia","Canada"]],
    [`Last summer we went to the beach. We swam in the sea and made a sand castle. Then it rained, so we went home early.`,
     "Why did they go home early?", "It rained.", ["They were tired.","It rained.","It was dark.","They were hungry."]],
  ];
  longRead.forEach(([story, q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"long_read", prompt_jp:"よく よんで こたえて:", prompt:`${story}\n\n${q}`, options: m.opts, answer: m.pos });
  });

  // ★3 Listening comprehension with multi-fact audio
  const listenComp3 = [
    ["I went to school by bus yesterday.", "How did he go to school?", "by bus", ["by bus","by car","by bike","walk"]],
    ["She bought three apples for 300 yen.", "How much was each apple?", "100 yen", ["50 yen","100 yen","300 yen","30 yen"]],
    ["I'll meet you at the station at 6 pm.", "When will they meet?", "6 pm", ["3 pm","6 am","6 pm","8 pm"]],
    ["My brother is taller than my dad.", "Who is taller?", "brother", ["brother","dad","mom","sister"]],
    ["I have a test tomorrow, so I must study.", "What does he have to do?", "study", ["sleep","study","play","eat"]],
    ["The library closes at 8 on Saturdays.", "When does it close?", "8 pm Saturday", ["8 am Saturday","8 pm Saturday","8 pm Sunday","6 pm Saturday"]],
    ["I wanted pizza but I ate ramen.", "What did he eat?", "ramen", ["pizza","ramen","sushi","curry"]],
    ["She speaks English and Japanese.", "How many languages?", "two", ["one","two","three","four"]],
  ];
  listenComp3.forEach(([sent, q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"listen_comp3", prompt_jp:`きいて こたえて 🔊\n${q}`, audio:sent, options: m.opts, answer: m.pos });
  });

  // ★3 Tag questions
  const tag = [
    ["You like pizza, ___?","don't you"],
    ["She is your friend, ___?","isn't she"],
    ["He went home, ___?","didn't he"],
    ["They can swim, ___?","can't they"],
    ["It's hot today, ___?","isn't it"],
  ];
  tag.forEach(([s, ans]) => {
    const m = mc(ans, ["don't you","isn't she","didn't he","can't they","isn't it","does he"]);
    Q({ stars:3, ptype:"tag_q", prompt_jp:"ふか ぎもん: ___?", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★3 Quantifiers (much/many/a lot of)
  const quant = [
    ["How ___ books do you have? (かぞえられる)","many"],
    ["How ___ water did you drink? (かぞえられない)","much"],
    ["I have ___ homework today.","a lot of"],
    ["There aren't ___ apples left.","many"],
    ["She doesn't drink ___ coffee.","much"],
  ];
  quant.forEach(([s, ans]) => {
    const m = mc(ans, ["many","much","a lot of","few","little"]);
    Q({ stars:3, ptype:"quant", prompt_jp:"りょうの ことば", prompt:s, options: m.opts, answer: m.pos,
        explain: "かぞえられる (cats, books): many / かぞえられない (water, time): much / どっちも OK: a lot of" });
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

  // ============= EIKEN 4 STYLE EXTENSIONS =============

  function fmt(words, punct) {
    if (!words.length) return "";
    const a = words.slice();
    a[0] = a[0][0].toUpperCase() + a[0].slice(1);
    return a.join(" ") + punct;
  }
  function shuffleWords(correct) {
    const words = correct.replace(/[?.,]/g,"").split(/\s+/);
    const punct = correct.match(/[?.]$/) ? correct.match(/[?.]$/)[0] : "";
    const out = new Set();
    if (words.length >= 3) {
      const a = words.slice();
      const i = Math.max(0, Math.min(a.length-2, Math.floor(Math.random()*(a.length-1))));
      [a[i], a[i+1]] = [a[i+1], a[i]];
      out.add(fmt(a, punct));
    }
    if (words.length >= 3) {
      const a = words.slice();
      const last = a.pop();
      a.splice(1, 0, last);
      out.add(fmt(a, punct));
    }
    if (words.length >= 4) {
      const a = words.slice();
      a.splice(0, 3, ...a.slice(0, 3).reverse());
      out.add(fmt(a, punct));
    }
    while (out.size < 3) {
      const a = words.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      const cand = fmt(a, punct);
      if (cand !== correct) out.add(cand);
    }
    return Array.from(out).filter(s => s !== correct).slice(0, 3);
  }

  // ★3 SENTENCE ORDERING (Eiken 4 Section 3)
  const orderings4 = [
    ["きのう なにを しましたか？", "What did you do yesterday?"],
    ["きみは いつ おきますか？", "What time do you get up?"],
    ["わたしは すしを たべるのが すき", "I like to eat sushi"],
    ["かれは サッカーを したかった", "He wanted to play soccer"],
    ["これは わたしの ペンより 高い", "This is more expensive than my pen"],
    ["きみの ほんは どこに ある？", "Where is your book?"],
    ["わたしは あした 学校に いきます", "I will go to school tomorrow"],
    ["かのじょは ピアノを ひくのが じょうず", "She is good at playing the piano"],
    ["わたしは あさ 7じに あさごはんを たべる", "I eat breakfast at 7 in the morning"],
    ["この本は とても おもしろい", "This book is very interesting"],
    ["ジョンは おにいさんより 背が高い", "John is taller than his brother"],
    ["わたしは えいごを べんきょうする", "I study English"],
    ["かれらは こうえんで サッカーをした", "They played soccer in the park"],
    ["きみは すしが すき？", "Do you like sushi?"],
    ["かのじょは 学校に 行きました", "She went to school"],
    ["わたしは そらをみるのが すき", "I like watching the sky"],
    ["あなたの しゅみは なんですか？", "What is your hobby?"],
    ["かれは おもしろい 本を よんでいる", "He is reading an interesting book"],
    ["わたしは あした パーティーに 行く", "I will go to the party tomorrow"],
    ["きょねん 私は とうきょうに 行った", "I went to Tokyo last year"],
    ["かれは いそがしすぎて こられない", "He is too busy to come"],
    ["わたしは いつも はやく ねます", "I always go to bed early"],
    ["どうやって 学校に いきますか？", "How do you go to school?"],
    ["なぜ かれは おこっているの？", "Why is he angry?"],
    ["かのじょは うたうのが じょうずです", "She is good at singing"],
    ["きみが いちばん すきな 食べ物は？", "What is your favorite food?"],
    ["私たちは こうえんに行く つもり", "We are going to the park"],
    ["かれは 本を わすれた", "He forgot his book"],
    ["これは わたしの いちばん 古い ぼうしです", "This is my oldest hat"],
    ["きみは いつ かえる？", "When are you coming home?"],
    ["かれは ピアノが ひける", "He can play the piano"],
    ["わたしは その えいがを 見たい", "I want to see that movie"],
    ["雨が ふっている", "It is raining"],
    ["昨日は 寒かった", "Yesterday was cold"],
    ["私たちは 来週 京都に 行く", "We will go to Kyoto next week"],
  ];
  orderings4.forEach(([jp, en]) => {
    const wrongs = shuffleWords(en);
    if (wrongs.length < 3) return;
    const opts = wrongs.slice(0, 3);
    const pos = (Math.random()*4)|0;
    opts.splice(pos, 0, en);
    Q({ stars:3, ptype:"order4", prompt_jp:`「${jp}」を ただしい えいごに！`, options: opts, answer: pos });
  });

  // ★3 LISTENING DIALOGUE (Eiken 4 Listening Part 2)
  // A short two-line dialogue is read, then a question. Pick the answer.
  const listenDialogue = [
    ["A: Are you coming to my party? B: Yes! What time? A: It starts at 6 pm.", "What time is the party?", "6 pm", ["3 pm","6 pm","9 pm","tomorrow"]],
    ["A: I went to Hokkaido last summer. B: How was it? A: It was beautiful.", "Where did he go?", "Hokkaido", ["Tokyo","Osaka","Hokkaido","Kyoto"]],
    ["A: My brother is 15. B: Oh, mine is 12.", "How old is the second person's brother?", "12", ["12","15","17","13"]],
    ["A: I want a pizza. B: Sorry, we have only ramen.", "What does the speaker have?", "ramen", ["pizza","ramen","sushi","curry"]],
    ["A: Is it raining? B: No, it's snowing.", "What's the weather?", "snowing", ["rainy","snowing","sunny","cloudy"]],
    ["A: How did you come? B: By bike.", "How did the speaker come?", "by bike", ["by bus","by bike","by train","by car"]],
    ["A: The book costs 1500 yen. B: I'll take it.", "How much is the book?", "1500 yen", ["500 yen","1000 yen","1500 yen","2000 yen"]],
    ["A: I have two cats. B: I have one dog.", "How many pets total?", "three", ["two","three","four","one"]],
    ["A: Where are you from? B: I'm from Australia.", "Where is the speaker from?", "Australia", ["America","Australia","England","Canada"]],
    ["A: Did you finish your homework? B: Not yet.", "Did he finish?", "No", ["Yes","No","Maybe","Don't know"]],
    ["A: I will study tonight. B: Good idea.", "When will he study?", "tonight", ["tomorrow","tonight","yesterday","next week"]],
    ["A: My mom is a doctor. B: Mine is a teacher.", "What is the second person's mom?", "teacher", ["doctor","teacher","cook","artist"]],
    ["A: It's hot today, isn't it? B: Yes, very hot.", "What's the weather?", "hot", ["cold","cool","hot","rainy"]],
    ["A: I'll see you at 5. B: OK, see you then.", "When will they meet?", "5", ["3","4","5","6"]],
  ];
  listenDialogue.forEach(([d, q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"listen_dialogue", prompt_jp:`たいわを きいて こたえて 🔊\n${q}`, audio: d, options: m.opts, answer: m.pos });
  });

  // ★3 LISTENING SHORT PASSAGE (Eiken 4 Listening Part 3)
  const listenPassage = [
    ["My name is Mike. I'm twelve years old. I have a sister.", "How old is Mike?", "12", ["10","12","15","8"]],
    ["I went to the beach yesterday. I swam and made a sand castle.", "Where did he go?", "beach", ["beach","park","mountain","library"]],
    ["My favorite sport is soccer. I play it every Sunday with my friends.", "What does he play?", "soccer", ["soccer","baseball","tennis","basketball"]],
    ["I'm hungry. I want to eat curry tonight.", "What does she want?", "curry", ["pizza","curry","sushi","ramen"]],
    ["My mom bought a red dress. It's very pretty.", "What did mom buy?", "a red dress", ["a red dress","a blue dress","a hat","shoes"]],
    ["Tom studies English every morning. He started two years ago.", "When did Tom start?", "two years ago", ["one year ago","two years ago","last month","yesterday"]],
    ["The cat is sleeping on the bed. The dog is in the garden.", "Where is the dog?", "in the garden", ["on the bed","in the garden","at school","in the kitchen"]],
    ["I love rainy days. I like to read books inside.", "What does she like to do on rainy days?", "read books", ["read books","play outside","watch TV","sleep"]],
    ["My grandfather is 70. He still plays tennis every weekend.", "What does grandfather do?", "plays tennis", ["plays tennis","reads books","goes shopping","watches TV"]],
    ["I always wake up at 6:30. Then I have breakfast at 7.", "When does she have breakfast?", "7", ["6:30","7","7:30","8"]],
  ];
  listenPassage.forEach(([p, q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"listen_passage", prompt_jp:`はなしを きいて こたえて 🔊\n${q}`, audio: p, options: m.opts, answer: m.pos });
  });

  // ★3 MORE GRAMMAR FILLS (Eiken 4 mix)
  const moreGram4 = [
    ["I ___ TV when you called.","was watching",["was watching","watch","watched","watches"]],
    ["She ___ to Tokyo last week.","went",["go","goes","went","gone"]],
    ["My brother ___ taller than me.","is",["am","is","are","be"]],
    ["___ you finish your homework yesterday?","Did",["Do","Does","Did","Are"]],
    ["I ___ swim very well.","can",["can","do","am","be"]],
    ["This is ___ best book I have ever read.","the",["a","an","the","is"]],
    ["He has ___ in his pocket.","nothing",["nothing","anything","something","everything"]],
    ["I have ___ books than you.","more",["many","most","more","much"]],
    ["She is the ___ student in class.","tallest",["tall","taller","tallest","more tall"]],
    ["I will call you ___ I get home.","when",["when","because","but","so"]],
    ["He is a ___ singer.","good",["good","well","best","better"]],
    ["She speaks English ___.","well",["good","well","best","more good"]],
    ["My grandfather lives ___ Osaka.","in",["in","on","at","by"]],
    ["I'm interested ___ science.","in",["in","on","at","with"]],
    ["She is afraid ___ dogs.","of",["of","at","in","on"]],
    ["I'll be there ___ 10 minutes.","in",["in","on","at","for"]],
    ["___ is the weather today?","How",["How","What","Where","When"]],
    ["___ many students are in your class?","How",["How","What","Where","Why"]],
    ["I have ___ time to study.","no",["no","not","never","none"]],
    ["She ___ her homework yet.","hasn't done",["doesn't do","didn't do","hasn't done","isn't doing"]],
  ];
  moreGram4.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"gram4", prompt_jp:"あてはまる ことば は？", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★2 MORE CONVERSATION (Eiken 4 Section 2)
  const conv4 = [
    ["A: How was the movie?\nB: ___", "It was great!", ["It was great!","I'm Yuki.","Pizza, please.","On Tuesday."]],
    ["A: Could you help me?\nB: ___", "Of course.", ["Of course.","I'm fine.","Yesterday.","On Sunday."]],
    ["A: When did you come back?\nB: ___", "Last night.", ["Last night.","Pizza.","Yes, I do.","On the desk."]],
    ["A: What's wrong?\nB: ___", "I lost my key.", ["I lost my key.","I'm Yuki.","Pizza, please.","On Friday."]],
    ["A: Can I borrow your pen?\nB: ___", "Sure, here you are.", ["Sure, here you are.","No, thanks.","I'm fine.","Yes, please."]],
    ["A: Why are you late?\nB: ___", "The bus was late.", ["The bus was late.","Yes, I am.","Pizza.","On Monday."]],
    ["A: I'm going to Hokkaido tomorrow.\nB: ___", "Have a great trip!", ["Have a great trip!","I'm Yuki.","On Friday.","Pizza."]],
    ["A: How long does it take?\nB: ___", "About 20 minutes.", ["About 20 minutes.","I'm fine.","Yes, I do.","Pizza."]],
    ["A: Should I open the window?\nB: ___", "Yes, please.", ["Yes, please.","I'm Yuki.","On Sunday.","Pizza."]],
    ["A: I have a stomachache.\nB: ___", "You should rest.", ["You should rest.","I'm fine.","Pizza.","Yes."]],
    ["A: My grandma is sick.\nB: ___", "I'm sorry to hear that.", ["I'm sorry to hear that.","Yes, please.","Pizza.","On Sunday."]],
    ["A: Do you know him?\nB: ___", "No, I don't.", ["No, I don't.","Pizza.","Tomorrow.","I'm Yuki."]],
    ["A: I passed the test!\nB: ___", "Congratulations!", ["Congratulations!","I'm sorry.","Pizza.","Goodbye."]],
    ["A: Is this seat free?\nB: ___", "Yes, please sit down.", ["Yes, please sit down.","On Tuesday.","Pizza.","I'm fine."]],
    ["A: Excuse me, where's the station?\nB: ___", "It's near the post office.", ["It's near the post office.","I'm Yuki.","Pizza.","Yes, I do."]],
  ];
  conv4.forEach(([q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"conv4", prompt_jp:`あう こたえは どれ？`, prompt:q, options: m.opts, answer: m.pos });
  });

  // More vocab — feelings, school events, environment
  const feelings = [["happy","うれしい"],["sad","かなしい"],["angry","おこっている"],["tired","つかれた"],
    ["excited","わくわく"],["nervous","きんちょう"],["surprised","びっくり"],["bored","たいくつ"],
    ["scared","こわい"],["proud","ほこらしい"],["lonely","さみしい"],["worried","しんぱい"]];
  feelings.forEach(([en, jp]) => {
    let m = mc(en, feelings.map(f=>f[0]));
    Q({ stars:2, ptype:"feel_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
    m = mc(jp, feelings.map(f=>f[1]));
    Q({ stars:2, ptype:"feel_en2jp", prompt_jp:`「${en}」の いみ は？`, prompt:en, audio:en, options: m.opts, answer: m.pos });
  });

  // School/event vocab
  const schoolEvent = [["festival","おまつり"],["sports day","うんどうかい"],["field trip","えんそく"],
    ["test","テスト"],["homework","しゅくだい"],["club","クラブ"],["graduation","そつぎょう"],
    ["entrance ceremony","にゅうがくしき"],["concert","コンサート"],["exam","しけん"]];
  schoolEvent.forEach(([en, jp]) => {
    let m = mc(en, schoolEvent.map(s=>s[0]));
    Q({ stars:2, ptype:"event_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
  });

  // Adjectives - more
  const adjectives = [["big","おおきい"],["small","ちいさい"],["fast","はやい"],["slow","おそい"],
    ["expensive","たかい(値段)"],["cheap","やすい"],["heavy","おもい"],["light","かるい"],
    ["interesting","おもしろい"],["boring","つまらない"],["difficult","むずかしい"],["easy","かんたん"],
    ["important","だいじ"],["famous","ゆうめい"],["beautiful","きれい"],["dangerous","あぶない"]];
  adjectives.forEach(([en, jp]) => {
    let m = mc(en, adjectives.map(a=>a[0]));
    Q({ stars:1, ptype:"adj_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
    m = mc(jp, adjectives.map(a=>a[1]));
    Q({ stars:1, ptype:"adj_en2jp", prompt_jp:`「${en}」の いみ は？`, prompt:en, audio:en, options: m.opts, answer: m.pos });
  });

  // ===== EXPANSION =====

  // Bigger jobs/people list
  const jobs2 = [
    ["lawyer","べんごし","⚖️"],["judge","さいばんかん","👩‍⚖️"],["engineer","エンジニア","🧑‍🔧"],
    ["programmer","プログラマー","👨‍💻"],["designer","デザイナー","🎨"],["author","さっか","✍️"],
    ["actor","はいゆう","🎭"],["actress","じょゆう","🎭"],["model","モデル","💃"],
    ["coach","コーチ","🧑‍🏫"],["soldier","へいし","🪖"],["sailor","ふなのり","⚓"],
    ["athlete","アスリート","🏃"],["referee","しんぱん","🟨"],["barber","とこや","💈"],
  ];
  vocabBundle(jobs2, "job2");
  // More house things
  const houseStuff2 = [
    ["lamp","ランプ","💡"],["pillow","まくら","🛏️"],["blanket","ブランケット","🧣"],
    ["mirror","かがみ","🪞"],["shelf","たな","📚"],["closet","クローゼット","🚪"],
    ["fan","せんぷうき","🌀"],["heater","ヒーター","🔥"],["sink","ながしだい","🚰"],
    ["stove","コンロ","🍳"],["oven","オーブン","🍞"],["microwave","でんしレンジ","🔌"],
    ["washing machine","せんたくき","🧺"],["vacuum","そうじき","🧹"],
  ];
  vocabBundle(houseStuff2, "house2");
  // More transport
  const transport2 = [
    ["subway","ちかてつ","🚇"],["van","バン","🚐"],["scooter","スクーター","🛵"],
    ["skateboard","スケボー","🛹"],["yacht","ヨット","⛵"],["submarine","せんすいかん","🚢"],
    ["balloon","ききゅう","🎈"],["sled","そり","🛷"],["ambulance","きゅうきゅうしゃ","🚑"],
    ["tram","ろめんでんしゃ","🚊"],
  ];
  vocabBundle(transport2, "trans2");
  // Body & Health
  const health = [
    ["headache","ずつう","🤕"],["fever","ねつ","🤒"],["cough","せき","😷"],
    ["sneeze","くしゃみ","🤧"],["stomachache","ふくつう","🤢"],["toothache","はいた","🦷"],
    ["dizzy","めまい","😵"],["allergy","アレルギー","🤧"],["medicine","くすり","💊"],
    ["doctor","いしゃ","🧑‍⚕️"],["nurse","かんごし","👩‍⚕️"],["hospital","びょういん","🏥"],
  ];
  vocabBundle(health, "health");
  // Time & Schedule
  const sched = [
    ["meeting","かいぎ","📋"],["appointment","よやく","📅"],["holiday","しゅくじつ","🎉"],
    ["vacation","きゅうか","🏖️"],["birthday","たんじょうび","🎂"],["festival","おまつり","🎏"],
    ["wedding","けっこんしき","💒"],["graduation","そつぎょう","🎓"],["picnic","ピクニック","🧺"],
    ["party","パーティー","🎉"],
  ];
  vocabBundle(sched, "event");

  // ★1 More past tense practice
  const easyPast2 = [
    ["She ___ a letter.","wrote",["write","wrote","writes","writing"]],
    ["I ___ to the park.","walked",["walk","walked","walks","walking"]],
    ["He ___ his bike.","rode",["ride","rode","rides","riding"]],
    ["We ___ a great time.","had",["have","has","had","having"]],
    ["They ___ at home all day.","stayed",["stay","stayed","stays","staying"]],
    ["My mom ___ a cake.","baked",["bake","baked","bakes","baking"]],
    ["The cat ___ on the bed.","slept",["sleep","slept","sleeps","sleeping"]],
    ["He ___ to a song.","listened",["listen","listened","listens","listening"]],
    ["I ___ my keys.","found",["find","found","finds","finding"]],
    ["The dog ___ the ball.","caught",["catch","caught","catches","catching"]],
    ["She ___ her homework.","finished",["finish","finished","finishes","finishing"]],
    ["We ___ a movie last night.","watched",["watch","watched","watches","watching"]],
  ];
  easyPast2.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"past_easy", prompt_jp:"きのうの こと (かこけい)", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★1 More future tense
  const easyFuture2 = [
    ["I ___ help you tomorrow.","will",["will","do","is","am"]],
    ["My family ___ travel next month.","will",["will","do","does","is"]],
    ["Tom ___ play soccer next Saturday.","will",["will","do","is","does"]],
    ["I ___ call you tonight.","will",["will","does","is","do"]],
    ["She ___ buy a gift.","will",["will","do","does","is"]],
    ["We ___ have a party tomorrow.","will",["will","does","is","do"]],
    ["The bus ___ arrive soon.","will",["will","do","is","does"]],
  ];
  easyFuture2.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"future_easy", prompt_jp:"あしたのこと (みらい)", prompt:s, options: m.opts, answer: m.pos });
  });

  // More should sentences
  const easyShould2 = [
    ["You ___ go to bed early.","should",["should","shouldn't","can","can't"]],
    ["You ___ touch hot stoves.","shouldn't",["should","shouldn't","can","can't"]],
    ["We ___ recycle paper.","should",["should","shouldn't","can","can't"]],
    ["You ___ tell lies.","shouldn't",["should","shouldn't","can","can't"]],
    ["You ___ practice every day.","should",["should","shouldn't","can","can't"]],
  ];
  easyShould2.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"should_easy", prompt_jp:"should / shouldn't?", prompt:s, options: m.opts, answer: m.pos });
  });

  // More past+future fills
  const tense = [
    ["Yesterday I ___ tired.","was",["am","is","are","was"]],
    ["They ___ at the park last weekend.","were",["am","is","are","were"]],
    ["She ___ here tomorrow.","will be",["will be","is","was","were"]],
    ["I ___ a book yesterday.","read",["read","reads","reading","will read"]],
    ["He ___ to America next year.","will go",["go","goes","went","will go"]],
    ["We ___ pizza last night.","ate",["eat","ate","eaten","eating"]],
  ];
  tense.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"past_easy", prompt_jp:"いつの こと？", prompt:s, options: m.opts, answer: m.pos });
  });

  window.QUESTIONS_LEVEL3 = all;
})();
