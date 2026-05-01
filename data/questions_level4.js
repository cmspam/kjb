// Level 4 — Eiken 3級 (中学卒業程度). Pulled from real Eiken 3 past papers.
// Vocab fills, sentence completion, conversation, sentence ordering, reading comp, listening.
(function () {
  const all = [];
  let nid = 0;
  const Q = (o) => { all.push({ id: "L4-" + (++nid).toString().padStart(3,"0"), level:4, type:"mc", ...o }); };
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

  // ===== EIKEN 3 VOCABULARY (extended set, 中学卒業) =====
  // Most are real Eiken 3-level words. JP↔EN both directions + listening.
  const vocab = [
    ["athlete","スポーツせんしゅ"],["passenger","じょうきゃく"],["traveler","りょこうしゃ"],
    ["librarian","ししょ"],["scientist","かがくしゃ"],["customer","おきゃくさん"],["neighbor","となりびと"],
    ["audience","かんきゃく"],["coworker","どうりょう"],["volunteer","ボランティア"],
    ["photographer","しゃしんか"],["musician","おんがくか"],["athlete","せんしゅ"],
    ["mechanic","せいびし"],["farmer","のうふ"],["captain","せんちょう"],
    ["journey","たび"],["adventure","ぼうけん"],["festival","おまつり"],["parade","パレード"],
    ["ceremony","しき"],["championship","せんしゅけん"],["competition","きょうそう"],
    ["language","げんご"],["culture","ぶんか"],["tradition","でんとう"],["history","れきし"],
    ["nature","しぜん"],["environment","かんきょう"],["weather","てんき"],["climate","きこう"],
    ["scenery","けしき"],["mountain","やま"],["forest","もり"],["ocean","かいよう"],
    ["product","せいひん"],["company","かいしゃ"],["business","しごと(ビジネス)"],
    ["customer","きゃく"],["restaurant","レストラン"],["café","カフェ"],
    ["report","レポート"],["essay","エッセイ"],["article","きじ"],["magazine","ざっし"],
    ["newspaper","しんぶん"],["dictionary","じしょ"],["textbook","きょうかしょ"],["notebook","ノート"],
    ["assignment","かだい"],["lecture","こうぎ"],["lesson","レッスン"],["meeting","かいぎ"],
    ["ticket","チケット"],["passport","パスポート"],["luggage","にもつ"],["souvenir","おみやげ"],
    ["address","じゅうしょ"],["distance","きょり"],["direction","ほうこう"],["destination","もくてきち"],
    ["price","ねだん"],["sale","セール"],["discount","ディスカウント"],["cash","げんきん"],
    ["hobby","しゅみ"],["sport","スポーツ"],["art","びじゅつ"],["music","おんがく"],
    ["movie","えいが"],["program","ばんぐみ"],["channel","チャンネル"],["concert","コンサート"],
    ["smile","ほほえみ"],["laugh","わらう"],["tear","なみだ"],["dream","ゆめ"],
    ["promise","やくそく"],["secret","ひみつ"],["surprise","おどろき"],["chance","チャンス"],
    ["energy","エネルギー"],["health","けんこう"],["disease","びょうき"],["medicine","くすり"],
    ["accident","じこ"],["danger","きけん"],["safety","あんぜん"],["mistake","まちがい"],
    // verbs
    ["follow","したがう"],["spend","つかう・すごす"],["reach","とどく・つく"],
    ["grow","そだつ・そだてる"],["impress","かんどうさせる"],["perform","えんそうする"],
    ["fight","たたかう"],["bake","やく(オーブン)"],["forget","わすれる"],["climb","のぼる"],
    ["join","さんかする"],["return","かえる"],["share","シェアする"],["decide","きめる"],
    ["receive","うけとる"],["create","つくる(クリエイト)"],["explain","せつめいする"],
    ["introduce","しょうかいする"],["invite","しょうたいする"],["expect","きたいする"],
    ["prepare","じゅんびする"],["protect","まもる"],["increase","ふえる"],["decrease","へる"],
    ["happen","おこる"],["disappear","きえる"],["continue","つづける"],["finish","おえる"],
    ["realize","きづく"],["agree","さんせいする"],["disagree","はんたいする"],["recommend","おすすめする"],
    // adjectives
    ["famous","ゆうめい"],["popular","にんき"],["successful","せいこう"],["amazing","すごい"],
    ["wonderful","すばらしい"],["perfect","かんぺき"],["delicious","おいしい"],["fresh","しんせん"],
    ["serious","しんけん"],["confident","じしんがある"],["nervous","きんちょう"],["worried","しんぱい"],
    ["lonely","さみしい"],["jealous","しっと"],["proud","ほこらしい"],["careful","ちゅういぶかい"],
    ["polite","ていねい"],["lazy","なまけもの"],["honest","しょうじき"],["selfish","じぶんかって"],
    ["friendly","ゆうこうてき"],["strict","きびしい"],["generous","かんだい"],["talented","さいのうがある"],
    ["foreign","がいこくの"],["local","じもとの"],["traditional","でんとうてき"],["modern","モダン"],
    ["national","こくみんの"],["international","こくさいてき"],
    // adverbs
    ["forever","ずっと"],["actually","じっさい"],["finally","ついに"],["recently","さいきん"],
    ["probably","たぶん"],["certainly","たしかに"],["already","すでに"],["instead","かわりに"],
  ];
  // Eiken 3 vocab is genuinely advanced; ★1 used to be 100% these flashcards,
  // making L4's low-difficulty experience indistinguishable from L3's. Promoted
  // to ★2 so ★1 can be the L4-flavored grammar/idioms below.
  vocab.forEach(([en, jp]) => {
    let m = mc(en, vocab.map(v=>v[0]));
    Q({ stars:2, ptype:"vocab_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
    m = mc(jp, vocab.map(v=>v[1]));
    Q({ stars:2, ptype:"vocab_en2jp", prompt_jp:`「${en}」の いみは？`, prompt: en, audio: en, options: m.opts, answer: m.pos });
    m = mc(en, vocab.map(v=>v[0]));
    Q({ stars:2, ptype:"vocab_listen", prompt_jp:"きこえた えいたんは？ 🔊", audio: en, options: m.opts, answer: m.pos });
  });

  // ========= ★1 L4-FLAVORED GRAMMAR (entry-level Eiken 3 patterns) =========
  // High-frequency Eiken-3-grade structures that are stable enough to live
  // at ★1 — present perfect basics, infinitive vs gerund recognition, basic
  // modals, common phrasal patterns. These give ★1 in L4 a real Eiken 3
  // texture instead of pure vocab translation.

  // ★1 Present perfect basics (have/has + past participle, simple form)
  const easyPerfect = [
    ["I ___ been to Hokkaido.","have",["have","has","had","having"]],
    ["She ___ already finished her homework.","has",["have","has","had","is"]],
    ["We ___ lived here for ten years.","have",["have","has","had","were"]],
    ["He ___ never seen snow.","has",["have","has","had","is"]],
    ["___ you ever eaten sushi?","Have",["Have","Has","Did","Were"]],
    ["I ___ just arrived.","have",["have","has","had","am"]],
  ];
  easyPerfect.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"perfect_easy", prompt_jp:"げんざい かんりょう (have/has)", prompt:s, options: m.opts, answer: m.pos,
        explain: "I/you/we/they → have / he/she/it → has。けいけん や じょうたい を あらわす" });
  });

  // ★1 Infinitive vs gerund — only the most common patterns
  const easyInfGer = [
    ["I want ___ a doctor.","to be",["being","to be","be","is"]],
    ["She enjoys ___ books.","reading",["read","reading","to read","reads"]],
    ["I decided ___ harder.","to study",["study","studying","to study","studied"]],
    ["He likes ___ video games.","playing",["play","playing","to play","plays"]],
    ["I'd like ___ some water.","to have",["having","to have","have","had"]],
    ["She is good at ___ piano.","playing",["play","playing","to play","plays"]],
  ];
  easyInfGer.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"infger_easy", prompt_jp:"to + どうし か どうし-ing", prompt:s, options: m.opts, answer: m.pos,
        explain: "want/decide/like/'d like/hope は to+どうし。enjoy/finish/be good at は どうし-ing" });
  });

  // ★1 Common modals (must / should / could)
  const easyModal = [
    ["You ___ wear a helmet.","should",["should","would","could","might"]],
    ["___ you pass me the salt?","Could",["Could","Should","Did","Was"]],
    ["He ___ be at home — the lights are on.","must",["must","should","may","could"]],
    ["You ___ try this cake!","should",["should","would","could","might"]],
    ["I ___ help you tomorrow.","could",["could","would","should","must"]],
    ["You ___ not run inside.","must",["must","could","should","would"]],
  ];
  easyModal.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"modal_easy", prompt_jp:"モーダル どうし", prompt:s, options: m.opts, answer: m.pos });
  });

  // ★1 Common idioms (look forward to / be good at / etc.)
  const easyIdiom = [
    ["I'm looking ___ to seeing you.","forward",["forward","backward","up","down"]],
    ["She is afraid ___ dogs.","of",["of","at","in","on"]],
    ["He is good ___ English.","at",["at","in","on","with"]],
    ["I'm interested ___ Japanese culture.","in",["in","on","at","with"]],
    ["Take ___ of yourself!","care",["care","look","time","place"]],
    ["I'm tired ___ studying.","of",["of","at","in","with"]],
  ];
  easyIdiom.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"idiom_easy", prompt_jp:"イディオム / じゅくご", prompt:s, options: m.opts, answer: m.pos });
  });

  // ===== SENTENCE COMPLETION (Section 1 style) =====
  const fills = [
    ["Many famous ___ from around the world joined the Olympics.","athletes",["passengers","travelers","animals","athletes"]],
    ["Our trip plan looks ___.","perfect",["poor","cold","perfect","slow"]],
    ["When you get off the train, please ___ the signs.","follow",["spend","reach","meet","follow"]],
    ["Shuhei's trip to Hawaii was great. He'll remember it ___.","forever",["slowly","ever","forever","soon"]],
    ["Mr. Suzuki ___ flowers in his garden.","grows",["grows","impresses","performs","fights"]],
    ["Mr. Brown was kind, so Emily will ___ forget her stay.","never",["never","along","else","abroad"]],
    ["Mom just ___ some cookies. Try one.","baked",["baked","met","believed","held"]],
    ["This town is famous ___ its beautiful river.","for",["to","for","in","at"]],
    ["I haven't seen Karen for a while. I saw her the ___ day.","other",["high","other","large","each"]],
    ["What's the ___, Cindy? — I didn't do well on my test.","matter",["matter","choice","purpose","difference"]],
    ["___ fact, I have to leave for a meeting now.","In",["In","At","By","On"]],
    ["You're just in ___ for the movie. It starts in two minutes.","time",["month","hour","time","schedule"]],
    ["Hannah, ___ you like coffee or tea?","would",["have","should","would","be"]],
    ["You should ___ Mt. Fuji if you have time.","climb",["climb","climbing","climbed","climbs"]],
    ["Katie's neighbor has a noisy dog, so it is difficult for her ___ at night.","to sleep",["sleeps","to sleep","slept","sleep"]],
    // present perfect
    ["I ___ been to Hokkaido three times.","have",["have","has","had","having"]],
    ["She ___ already finished her homework.","has",["have","has","had","is"]],
    ["___ you ever eaten sushi?","Have",["Have","Has","Did","Were"]],
    ["I have lived here ___ ten years.","for",["for","since","at","in"]],
    ["He has worked ___ 2018.","since",["for","since","at","in"]],
    ["I have ___ visited Tokyo before.","never",["ever","never","just","yet"]],
    // infinitive / gerund
    ["I want ___ a doctor in the future.","to be",["being","to be","be","is"]],
    ["She enjoys ___ books in the park.","reading",["read","reading","to read","reads"]],
    ["It is important ___ vegetables every day.","to eat",["eat","to eat","eating","eats"]],
    ["I'm looking forward ___ you.","to seeing",["see","to see","to seeing","seeing"]],
    ["My brother is good at ___ soccer.","playing",["play","playing","to play","played"]],
    ["I decided ___ harder.","to study",["study","studying","to study","studied"]],
    // modal
    ["You ___ wear a helmet on a bike.","should",["should","would","could","might"]],
    ["___ you pass me the salt, please?","Could",["Could","Should","Did","Was"]],
    ["He ___ be at home now. The lights are on.","must",["must","should","may","could"]],
    ["I ___ rather stay home tonight.","would",["should","would","might","could"]],
    // passive
    ["This book ___ written by a famous author.","was",["is","was","were","be"]],
    ["English ___ spoken in many countries.","is",["is","was","were","be"]],
    ["The window ___ broken yesterday.","was",["is","was","were","be"]],
    // relative
    ["The man ___ is wearing a hat is my dad.","who",["who","which","what","when"]],
    ["This is the book ___ I bought yesterday.","that",["who","that","what","whose"]],
    ["I have a friend ___ lives in Canada.","who",["who","which","whose","what"]],
    // comparatives
    ["This is ___ than that.","cheaper",["cheap","cheaper","cheapest","more cheap"]],
    ["She is the ___ student in class.","most diligent",["diligent","more diligent","most diligent","much diligent"]],
    // misc
    ["I'm too tired ___ go out.","to",["to","for","at","in"]],
    ["He is ___ kind that everyone likes him.","so",["so","such","very","too"]],
    ["___ a beautiful day it is!","What",["What","How","Why","Where"]],
    ["___ tall he is!","How",["What","How","Why","Where"]],
    ["I want something ___ to eat.","cold",["cold","coldly","colder","coldness"]],
    ["Could you tell me ___?","where the station is",["where is the station","where the station is","the station where is","is where the station"]],
    // word choice
    ["Please ___ a seat.","take",["take","make","do","get"]],
    ["She ___ a beautiful song last night.","sang",["sing","sang","sung","singing"]],
    ["I'm sorry I'm late. The bus ___ delayed.","was",["is","was","were","be"]],
    ["When I came home, my mother ___ dinner.","was cooking",["cooked","is cooking","was cooking","cooking"]],
    ["If it ___ tomorrow, we'll cancel the picnic.","rains",["rain","rains","rained","raining"]],
    ["Tom is taller than ___ in his class.","anyone",["someone","anyone","everyone","no one"]],
    ["I have ___ money than you.","more",["many","most","more","much"]],
    ["She has been studying English ___ five years.","for",["for","since","ago","at"]],
    ["The boy ___ over there is my brother.","standing",["stand","standing","stood","stands"]],
    ["This is a watch ___ in Switzerland.","made",["make","making","made","makes"]],
  ];
  fills.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"fill", prompt_jp:"あてはまる ことばは？", prompt:s, options: m.opts, answer: m.pos });
  });

  // ===== CONVERSATION COMPLETION (Section 2 style) =====
  const conv = [
    ["Boy: Have you been to the new zoo?\nGirl: Yes, but ___ There are many cute animals.", "I'd like to go again.", ["I'll call you back.","I'd like to go again.","it's not your ticket.","it'll be my first time."]],
    ["Man 1: Should we take a bus?\nMan 2: Yes. ___\nMan 1: I think so, too.", "It's too far to walk.", ["It's a famous painting.","We're on the train.","It's too far to walk.","I can't find my ticket."]],
    ["Girl: I'm going to Hawaii.\nBoy: That's nice. ___\nGirl: Yes, this is my second time.", "Have you been there before?", ["Have you been there before?","Can you call back later?","Do you live near here?","Could you help me with it?"]],
    ["Wife: ___ Let's go.\nHusband: Don't forget to lock the door.", "I'm ready.", ["No, thank you.","Sure, it's mine.","I'm ready.","I want all of them."]],
    ["Mother: Hi, Martin. ___\nSon: We didn't have band practice today, so I left at 2:30.", "You're home early.", ["It's not for you.","Have a wonderful day.","You're home early.","You got a good score."]],
    ["A: Could you help me with my homework?\nB: ___", "Sure, what do you need?", ["Sure, what do you need?","See you tomorrow.","I'm sorry I broke it.","Yes, I bought one."]],
    ["A: Where did you go for vacation?\nB: ___", "I went to Okinawa.", ["I went to Okinawa.","I'm going to school.","I have two cats.","Yes, I do."]],
    ["A: I'm sorry I'm late.\nB: ___", "That's okay.", ["That's okay.","See you later.","No problem, I have it.","You're welcome."]],
    ["A: This cake is delicious!\nB: ___", "Thanks, I made it myself.", ["Thanks, I made it myself.","I'm going home.","See you tomorrow.","Where are you?"]],
    ["A: How was the concert?\nB: ___", "It was amazing!", ["It was amazing!","I have a cold.","On Sunday.","I'm a student."]],
    ["A: Have you finished your report?\nB: ___", "Not yet, I'm still working on it.", ["Not yet, I'm still working on it.","I went to the park.","Yesterday morning.","Thank you."]],
    ["A: What time will you arrive?\nB: ___", "Around 6 pm.", ["Around 6 pm.","I'm fine.","On Tuesday.","Pizza, please."]],
    ["A: Why don't we go shopping tomorrow?\nB: ___", "That sounds great!", ["That sounds great!","I'm a teacher.","On Sunday.","No, thanks."]],
    ["A: Excuse me, do you know where the post office is?\nB: ___", "Yes, it's next to the bank.", ["Yes, it's next to the bank.","I'm fine, thank you.","I went there yesterday.","No, I don't have one."]],
    ["A: I'm not feeling well today.\nB: ___", "You should see a doctor.", ["You should see a doctor.","I went to school.","On the table.","Yes, please."]],
    ["A: How long have you lived in Japan?\nB: ___", "For five years.", ["For five years.","Yes, I do.","Pizza, please.","I'm a student."]],
    ["A: Whose bag is this?\nB: ___", "It's mine.", ["It's mine.","I'm Yuki.","On Friday.","Yes, please."]],
    ["A: What do you want for your birthday?\nB: ___", "I'd like a new bike.", ["I'd like a new bike.","Yes, I will.","On the desk.","I went home."]],
    ["A: Do you mind if I sit here?\nB: ___", "Not at all, please.", ["Not at all, please.","I'm fine.","On Sunday.","Pizza."]],
    ["A: I won the speech contest!\nB: ___", "Congratulations!", ["Congratulations!","I'm sorry to hear that.","See you later.","No, thanks."]],
  ];
  conv.forEach(([q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"conv", prompt_jp:"あう こたえは どれ？", prompt: q, options: m.opts, answer: m.pos });
  });

  // ===== SENTENCE ORDERING (Section 3 style — 5 word arrangement) =====
  function fmt(words, punct) {
    if (!words.length) return "";
    const a = words.slice();
    a[0] = a[0][0].toUpperCase() + a[0].slice(1);
    return a.join(" ") + punct;
  }
  function distract(correct) {
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
  const orderings = [
    ["私は3年間 ピアノを ならっています","I have been playing the piano for three years"],
    ["きょねん オーストラリアに いったことがある","I have been to Australia last year"],
    ["この本は とても 読みやすい","This book is very easy to read"],
    ["かれは 私に えいごを おしえてくれた","He taught me English"],
    ["あの人は サッカー せんしゅです","That person is a soccer player"],
    ["私たちは 来週 京都へ いく つもりです","We are going to Kyoto next week"],
    ["この時計は 父に もらった","I got this watch from my father"],
    ["彼女は 走るのが はやい","She runs fast"],
    ["雨が ふって いる","It is raining"],
    ["私は あなたの たすけが ほしい","I need your help"],
    ["この映画は とても おもしろかった","This movie was very interesting"],
    ["かれは えいごを 上手に 話す","He speaks English very well"],
    ["わたしは 7時に おきます","I get up at seven"],
    ["わたしは ピアノを ひける","I can play the piano"],
    ["かれは 私の 一番 古い 友だち","He is my oldest friend"],
    ["明日 雨が ふったら いきません","If it rains tomorrow, I will not go"],
    ["あなたは 何を したい？","What do you want to do?"],
    ["これは とても 難しい 質問です","This is a very difficult question"],
    ["私は コンサートを 楽しみに している","I am looking forward to the concert"],
    ["かれは サッカーが 上手だ","He is good at soccer"],
    ["あなたは どこに 住んで いますか","Where do you live?"],
    ["雨で 外に いけなかった","I couldn't go outside because of the rain"],
    ["私は ねむすぎて べんきょう できない","I am too sleepy to study"],
    ["かれは 走るのが はやい 男の子です","He is a boy who runs fast"],
    ["この くつは 高すぎる","These shoes are too expensive"],
    ["私は 学校に 自転車で 行く","I go to school by bike"],
  ];
  orderings.forEach(([jp, en]) => {
    const wrongs = distract(en);
    if (wrongs.length < 3) return;
    const opts = wrongs.slice(0, 3);
    const pos = (Math.random()*4)|0;
    opts.splice(pos, 0, en);
    Q({ stars:3, ptype:"order", prompt_jp:`「${jp}」を ただしい えいごに！`, options: opts, answer: pos });
  });

  // ===== READING COMPREHENSION (Section 4 style) =====
  const readings = [
    [`Welcome to our new librarian Ms. Wilson! She worked at a bookstore for eight years and at the local university library for five years. There will be a welcome party on Friday, April 17 at 3:30 pm in the school gym. You can ask her questions and enjoy free drinks and snacks.`,
      "How long did Ms. Wilson work at the local university's library?", "For five years.",
      ["For five years.","For six years.","For eight years.","For ten years."]],
    [`Welcome to our new librarian Ms. Wilson! She worked at a bookstore for eight years and at the local university library for five years. There will be a welcome party on Friday, April 17 at 3:30 pm in the school gym. You can ask her questions and enjoy free drinks and snacks.`,
      "At the welcome party, students can:", "enjoy drinks and food for free.",
      ["meet many people from a foreign university.","enjoy drinks and food for free.","play sports in the gym.","watch a new movie."]],
    [`Hi Grandpa, I have to write a school report by Friday. Can I interview you about your city this Saturday? — Lucas. Reply: I have work this Saturday and Sunday morning. Sunday afternoon is OK. — Grandpa.`,
      "When can the grandfather meet?", "Sunday afternoon.",
      ["Friday afternoon.","Saturday morning.","Sunday morning.","Sunday afternoon."]],
    [`Ansel Adams was a famous American photographer born in 1902. As a child, he played the piano for over ten years and wanted to be a musician. In the 1910s he got his first camera and took many pictures in Yosemite National Park. In the late 1920s he decided to become a professional photographer instead.`,
      "What did Adams want to be as a child?", "A musician.",
      ["A photographer.","A painter.","A musician.","A teacher."]],
    [`Ansel Adams was a famous American photographer born in 1902. As a child, he played the piano for over ten years and wanted to be a musician. In the 1910s he got his first camera and took many pictures in Yosemite National Park. In the late 1920s he decided to become a professional photographer instead.`,
      "What happened in 1980?", "He received an award from the president.",
      ["He received an award from the president.","He bought his first camera.","He moved to Yosemite.","He started selling photos."]],
    [`Sakura started learning the violin when she was six. At first, she didn't enjoy it. Her mother always asked her to practice, and Sakura sometimes cried. However, when Sakura was nine, she joined a school orchestra. She made many friends there and started enjoying the violin. Now she practices every day.`,
      "When did Sakura begin enjoying violin?", "When she was nine.",
      ["When she was six.","When she was nine.","When she was twelve.","Last year."]],
    [`Tom moved to a new town last summer. At first, he was lonely because he had no friends. One day at school, a boy named Mike spoke to him. They liked the same video games. Now Tom and Mike are best friends and play games together every weekend.`,
      "Why was Tom lonely at first?", "He had no friends in the new town.",
      ["He had no friends in the new town.","He didn't have video games.","He missed his old school.","He couldn't speak English."]],
    [`The Tanaka family went to a small island for vacation. The weather was beautiful and the beach was clean. They swam in the sea and made sand castles. On the last day, it started to rain, so they went to a museum. The children loved the dinosaur exhibit.`,
      "What did they do on the last day?", "Went to a museum.",
      ["Went swimming.","Went to a museum.","Made sand castles.","Stayed at the hotel."]],
    [`Mr. Yamada works at a small bakery. He starts work at 4 am every day to bake fresh bread. The shop opens at 7 am. His most popular bread is the chocolate roll. Customers come from many cities to buy it.`,
      "What time does the shop open?", "7 am.",
      ["4 am.","5 am.","7 am.","9 am."]],
    [`Last month, our class took a trip to a museum. We saw paintings, statues, and old maps. Our favorite part was the section about ancient Egypt. There were real artifacts from over 3,000 years ago. We took notes for our history report.`,
      "What was the class's favorite section?", "Ancient Egypt.",
      ["Ancient Egypt.","Modern paintings.","European maps.","Japanese statues."]],
  ];
  readings.forEach(([passage, q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"read", prompt_jp:"よく よんで こたえて:", prompt:`${passage}\n\nQ: ${q}`, options: m.opts, answer: m.pos });
  });

  // ===== LISTENING — short single sentences =====
  const listenSents = [
    "I have lived in Tokyo for ten years.",
    "She has just finished her homework.",
    "Have you ever been to Hokkaido?",
    "He decided to study harder for the test.",
    "I'm looking forward to the festival.",
    "It's important to drink water every day.",
    "My grandfather taught me how to fish.",
    "We should leave early to catch the train.",
    "This book was written by a famous author.",
    "She is the tallest girl in the class.",
    "If it rains tomorrow, we'll stay home.",
    "I have been studying English for five years.",
    "He is good at playing the guitar.",
    "There is a beautiful park near my house.",
    "Could you tell me where the station is?",
  ];
  listenSents.forEach((s) => {
    const m = mc(s, listenSents);
    Q({ stars:2, ptype:"listen_sent", prompt_jp:"きこえた ぶんを えらべ！ 🔊", audio:s, options: m.opts, answer: m.pos });
  });

  // ===== LISTENING DIALOGUE =====
  const listenDialogues = [
    ["A: Have you been to the new café? B: Yes, twice. A: What did you have? B: I had a chocolate cake.",
      "What did the speaker have?", "chocolate cake", ["coffee","chocolate cake","sandwich","ice cream"]],
    ["A: I'm looking for a birthday gift for my mom. B: How about flowers? A: She doesn't really like flowers. B: Then maybe a scarf?",
      "Why doesn't she want to give flowers?", "Mom doesn't like flowers", ["Flowers are too expensive","Mom doesn't like flowers","No flower shop nearby","Mom is allergic"]],
    ["A: How was your trip to Kyoto? B: It was amazing. The temples were beautiful. A: How long did you stay? B: Three days.",
      "How long did the trip last?", "three days", ["one day","two days","three days","one week"]],
    ["A: Did you finish the report? B: Not yet. I need more time. A: When is it due? B: Friday.",
      "When is the report due?", "Friday", ["Wednesday","Thursday","Friday","Saturday"]],
    ["A: What do you want to do this weekend? B: Let's go hiking. A: Sounds great! B: I'll bring the snacks.",
      "What will they do?", "go hiking", ["go shopping","go hiking","watch a movie","stay home"]],
    ["A: I bought a new computer yesterday. B: Was it expensive? A: Yes, it was 200,000 yen. B: That's a lot!",
      "How much was the computer?", "200,000 yen", ["100,000 yen","150,000 yen","200,000 yen","300,000 yen"]],
    ["A: Have you read the new Harry Potter book? B: Yes, I finished it last week. A: How was it? B: Really exciting!",
      "When did the speaker finish the book?", "last week", ["yesterday","last week","last month","two months ago"]],
    ["A: My sister got married last spring. B: Congratulations! Where do they live? A: They live in Osaka now.",
      "Where does the sister live?", "Osaka", ["Tokyo","Osaka","Kyoto","Nagoya"]],
    ["A: I'm going to Italy next month. B: For business or pleasure? A: It's a vacation with my family.",
      "Why is the speaker going to Italy?", "vacation", ["business","study","vacation","work"]],
    ["A: How long does it take to get to school? B: About 30 minutes by bus. A: How about by bike? B: Maybe 20 minutes.",
      "How long by bike?", "20 minutes", ["10 minutes","20 minutes","30 minutes","40 minutes"]],
  ];
  listenDialogues.forEach(([d, q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"listen_dialogue", prompt_jp:`たいわを きいて こたえて 🔊\n${q}`, audio:d, options: m.opts, answer: m.pos });
  });

  // ===== LISTENING — short passages =====
  const listenPassages = [
    ["I had a busy day. I woke up at six and studied for two hours. Then I had breakfast with my family. After that, I went to the library to return some books.",
      "What did the speaker do first?", "studied", ["had breakfast","studied","went to the library","slept"]],
    ["My brother is a doctor. He works at a hospital in Osaka. He helps many sick people every day. I'm proud of him.",
      "Where does the brother work?", "in Osaka", ["in Tokyo","in Osaka","in Kyoto","in a clinic"]],
    ["Last summer, my family went camping. We made a fire, cooked food, and watched the stars. It was the best vacation we've ever had.",
      "What did they do at the camp?", "cooked food", ["played games","cooked food","went swimming","read books"]],
    ["I started learning the guitar last year. At first it was difficult, but I practiced every day. Now I can play many songs.",
      "When did she start guitar?", "last year", ["last week","last month","last year","two years ago"]],
    ["Tomorrow there will be a school festival. Students will sell food, perform plays, and play music. The festival starts at 10 am and ends at 3 pm.",
      "When does the festival end?", "3 pm", ["1 pm","2 pm","3 pm","5 pm"]],
  ];
  listenPassages.forEach(([p, q, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"listen_passage", prompt_jp:`はなしを きいて こたえて 🔊\n${q}`, audio:p, options: m.opts, answer: m.pos });
  });

  // ===== EXPRESSIONS / PHRASAL VERBS =====
  const phrasal = [
    ["Please ___ the light. (turn on)","turn on",["turn on","turn off","look up","take off"]],
    ["Don't ___! Keep trying. (give up)","give up",["pick up","give up","take off","look up"]],
    ["I'll ___ you ___ at the airport.","pick up",["pick up","look up","turn on","take off"]],
    ["___ the word in a dictionary. (look up)","Look up",["Pick up","Look up","Turn on","Take off"]],
    ["Please ___ your shoes when you enter.","take off",["pick up","give up","turn on","take off"]],
    ["The plane will ___ at 3 pm. (depart)","take off",["take off","take in","take out","take over"]],
    ["I need to ___ this report ___ the teacher tomorrow.","hand in",["hand in","hand out","look up","look at"]],
    ["Could you ___ the air conditioner, please?","turn off",["turn off","turn on","give up","take off"]],
  ];
  phrasal.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"phrasal", prompt_jp:"フレーズ どうし", prompt:s, options: m.opts, answer: m.pos });
  });

  // ===== COMMON IDIOMS =====
  const idioms = [
    ["I'm looking ___ to seeing you.","forward",["forward","backward","up","down"]],
    ["She is ___ of dogs.","afraid",["afraid","interested","glad","tired"]],
    ["I'm interested ___ Japanese culture.","in",["in","on","at","with"]],
    ["He is good ___ English.","at",["at","in","on","with"]],
    ["Take ___ of yourself.","care",["care","look","time","place"]],
    ["I ran ___ of milk.","out",["out","in","up","off"]],
    ["She made ___ her mind.","up",["up","out","in","over"]],
    ["I came ___ this picture in the attic.","across",["across","along","through","around"]],
  ];
  idioms.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"idiom", prompt_jp:"イディオム / じゅくご", prompt:s, options: m.opts, answer: m.pos });
  });

  // ===== EXPANSION =====

  // Additional Eiken-3-grade vocab (continues the same vocab_jp2en/en2jp/listen pattern)
  const vocab2 = [
    ["election","せんきょ"],["government","せいふ"],["president","だいとうりょう"],
    ["prime minister","しゅしょう"],["citizen","こくみん"],["population","じんこう"],
    ["culture","ぶんか"],["religion","しゅうきょう"],["tradition","でんとう"],
    ["technology","ぎじゅつ"],["invention","はつめい"],["discovery","はっけん"],
    ["research","けんきゅう"],["experiment","じっけん"],["solution","かいけつ"],
    ["pollution","おせん"],["recycling","リサイクル"],["volunteer","ボランティア"],
    ["donation","きふ"],["charity","じぜん"],
    ["argument","ぎろん"],["opinion","いけん"],["fact","じじつ"],
    ["statement","せいめい"],["evidence","しょうこ"],["rumor","うわさ"],
    ["advice","アドバイス"],["suggestion","ていあん"],["request","リクエスト"],
    ["complaint","くじょう"],["compliment","ほめことば"],
    ["earthquake","じしん"],["typhoon","たいふう"],["flood","こうずい"],
    ["fire","かじ"],["accident","じこ"],["emergency","きんきゅう"],
    ["rescue","きゅうじょ"],["safety","あんぜん"],["risk","リスク"],
    ["benefit","めりっと"],["advantage","ゆうり"],["disadvantage","ふり"],
    ["choice","せんたく"],["decision","けってい"],["plan","けいかく"],
    ["goal","もくひょう"],["dream","ゆめ"],["wish","ねがい"],
    ["effort","どりょく"],["practice","れんしゅう"],
    // verbs
    ["develop","はったつする"],["improve","じょうたつする"],
    ["invent","はつめいする"],["discover","はっけんする"],
    ["solve","かいけつする"],["respect","そんけい"],
    ["realize","じつげんする"],["communicate","つたえる"],
    ["translate","ほんやくする"],["calculate","けいさんする"],
    ["measure","はかる"],["compare","くらべる"],
    ["compete","きそう"],["celebrate","いわう"],
    ["gather","あつまる"],["disappear","きえる"],
    ["produce","せいさんする"],["consume","しょうひする"],
    ["import","ゆにゅう"],["export","ゆしゅつ"],
    // adjectives
    ["natural","しぜんな"],["artificial","じんこうの"],
    ["original","オリジナル"],["typical","ふつうの"],
    ["unique","ゆいつ"],["complex","ふくざつ"],
    ["simple","かんたん"],["common","ふつう"],
    ["rare","めずらしい"],["valuable","かちある"],
    ["useful","やくにたつ"],["useless","やくにたたない"],
    ["available","つかえる"],["impossible","ふかのう"],
    ["possible","かのう"],["necessary","ひつよう"],
  ];
  vocab2.forEach(([en, jp]) => {
    let m = mc(en, vocab2.map(v=>v[0]));
    Q({ stars:2, ptype:"vocab_jp2en", prompt_jp:`「${jp}」は えいごで？`, options: m.opts, answer: m.pos });
    m = mc(jp, vocab2.map(v=>v[1]));
    Q({ stars:2, ptype:"vocab_en2jp", prompt_jp:`「${en}」の いみは？`, prompt: en, audio: en, options: m.opts, answer: m.pos });
    m = mc(en, vocab2.map(v=>v[0]));
    Q({ stars:2, ptype:"vocab_listen", prompt_jp:"きこえた えいたんは？ 🔊", audio: en, options: m.opts, answer: m.pos });
  });

  // More phrasal verbs
  const phrasal2 = [
    ["I ___ at 7 every morning.","get up",["get up","wake up","look up","stand up"]],
    ["Please ___ your shoes inside.","take off",["take off","put on","get off","go off"]],
    ["I'm ___ my keys.","looking for",["looking for","looking at","looking up","looking out"]],
    ["Don't ___ in the library.","run around",["run around","look around","sit down","stand up"]],
    ["Can you ___ the light?","turn on",["turn on","turn off","turn up","turn into"]],
    ["I'll ___ you ___ at 8.","pick / up",["pick / up","get / on","take / off","look / for"]],
    ["I ___ by accident.","fell down",["fell down","stood up","sat down","got up"]],
    ["Don't ___! You can do it.","give up",["give up","grow up","look up","sit up"]],
    ["___ for the bus, please.","Wait",["Wait","Look","Get","Take"]],
    ["She always ___ early.","wakes up",["wakes up","gets up","stays up","sits up"]],
  ];
  phrasal2.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:2, ptype:"phrasal", prompt_jp:"句動詞[くどうし]", prompt:s, options: m.opts, answer: m.pos });
  });

  // More idioms (high-frequency)
  const idioms2 = [
    ["He's a piece of ___ in the kitchen. (とくい)","cake",["cake","fish","bread","apple"]],
    ["Once in a blue ___. (めったに ない)","moon",["moon","sun","star","sky"]],
    ["It's raining cats and ___. (ものすごい雨)","dogs",["dogs","cats","frogs","birds"]],
    ["Break a ___! (がんばって！)","leg",["leg","arm","head","hand"]],
    ["You're pulling my ___. (うそでしょ)","leg",["leg","arm","head","hand"]],
    ["I'm under the ___ today. (ちょうしわるい)","weather",["weather","table","cloud","sky"]],
    ["Hit the ___! (ねよう)","sack",["sack","road","books","bottle"]],
    ["Hit the ___! (べんきょう しよう)","books",["books","sack","road","bottle"]],
  ];
  idioms2.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:3, ptype:"idiom", prompt_jp:"イディオム", prompt:s, options: m.opts, answer: m.pos });
  });

  // More easy modals
  const easyModal2 = [
    ["You ___ wear a helmet on a bike.","must",["must","may","might","could"]],
    ["___ I borrow your pen?","May",["May","Must","Should","Will"]],
    ["It ___ rain later.","might",["must","might","should","would"]],
    ["You ___ smoke here.","mustn't",["must","mustn't","may","might"]],
    ["___ you tell me the time?","Could",["Could","Must","May","Will"]],
    ["I ___ stay home tonight.","might",["may","might","must","should"]],
  ];
  easyModal2.forEach(([s, ans, opts]) => {
    const m = mc(ans, opts);
    Q({ stars:1, ptype:"modal_easy", prompt_jp:"ほじょどうし", prompt:s, options: m.opts, answer: m.pos });
  });

  window.QUESTIONS_LEVEL4 = all;
})();
