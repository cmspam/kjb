// Cross-character "deliver a message" conversations.
//
// Each kaiju has a short message they want delivered to another kaiju.
// The kid is the courier. Choices are: deliver verbatim / paraphrase
// kindly / refuse. The point isn't long branching — it's that hearing
// these messages makes the kaiju world feel interconnected, like the
// characters actually know each other and have private opinions about
// each other.
//
// 8 conversations, each ~12-18 nodes. Adds a layer of "soap opera"
// to the suite — the kid learns the social map of the kaiju world.

(function () {
  const MSGS = [

    ["tako", {
      id: "msg-tral",
      title: "A Message For Tralalero",
      intro: "Tako pulls you close and whispers. He has a message for the opera fish, but it is sensitive.",
      scene: "tako-osaka-stall",
      start: "n1",
      nodes: {
        "n1": {
          en: "Can you tell Tralalero something? Quietly, please.",
          jp: "トラララ に つたえて くれる？ そっと、 おねがい。",
          mood: "wise",
          choices: [
            { en: "Yes, what is the message?",           jp: "うん、 なに？",                       outcome:"good",    next:"n2" },
            { en: "Why not tell him yourself?",          jp: "じぶん で つたえて は？",            outcome:"good",    next:"n2why" },
            { en: "I do not want to be a courier.",       jp: "メッセンジャー は いや。",            outcome:"bad",     next:"endCool" },
          ],
        },
        "n2": {
          en: "Tell him: the takoyaki is ready, but please do not sing in my shop again.",
          jp: "つたえて：『たこやき は できた、 でも もう ぼく の みせ で うたわないで』。",
          mood: "happy",
          choices: [
            { en: "OK, I will tell him exactly.",         jp: "OK、 その まま つたえる。",          outcome:"good",    next:"n3exact" },
            { en: "Maybe I will say it more politely.",   jp: "もっと ていねい に いう。",          outcome:"good",    next:"n3polite" },
            { en: "Why no singing?",                       jp: "なんで うたう の だめ？",            outcome:"good",    next:"n2why2" },
          ],
        },
        "n2why": {
          en: "Because Tralalero will sing his reply. My customers will leave.",
          jp: "トラララ は うた で へんじ する。 おきゃくさん が でて いく。",
          mood: "wise",
          choices: [
            { en: "I understand. Tell me the message.",    jp: "わかった。 メッセージ おしえて。",   outcome:"good",    next:"n2" },
          ],
        },
        "n2why2": {
          en: "His voice makes my octopus cousins very sad. They cry inside the batter.",
          jp: "かれ の こえ で ぼく の いとこ たち が とても かなしく なる。 たね の なか で なく。",
          mood: "sad",
          choices: [
            { en: "That is heartbreaking.",                jp: "せつない。",                          outcome:"good",    next:"n3exact" },
          ],
        },
        "n3exact": {
          en: "Thank you. Tell him kindly. He is sensitive.",
          jp: "ありがとう。 やさしく いって。 かれ は センシティブ。",
          mood: "happy",
          choices: [
            { en: "I will be kind.",                       jp: "やさしく する。",                    outcome:"good",    next:"endWarm" },
          ],
        },
        "n3polite": {
          en: "Even better. Maybe say: please save the songs for the stage.",
          jp: "もっと いい。 こう いって：『ぶたい の ため に うた を のこして』。",
          mood: "happy",
          choices: [
            { en: "Stage-only singing — perfect.",         jp: "ぶたい だけ で うたう、 かんぺき。", outcome:"good",    next:"endWarm" },
          ],
        },
        "endWarm":    { en:"You are a good courier. There will be free takoyaki for you when you return.", jp:"きみ は いい メッセンジャー。 もどって きたら タダ の たこやき が ある。", mood:"happy" },
        "endCool":    { en:"Then the message stays here. Goodbye.",                   jp:"じゃあ メッセージ は ここ で。 さよなら。",                           mood:"sad" },
      },
    }],

    ["tral", {
      id: "msg-tako",
      title: "A Message For Tako",
      intro: "Tralalero hums a soft note. He wants you to tell Tako something — but make it beautiful.",
      scene: "tral-fish-market",
      start: "n1",
      nodes: {
        "n1": {
          en: "Please tell Tako: his tall paper hat reminds me of the opera house ceiling.",
          jp: "タコ に つたえて：『たかい かみ の ぼうし は オペラ ハウス の てんじょう に にている』。",
          mood: "wise",
          choices: [
            { en: "That is a beautiful message.",          jp: "うつくしい メッセージ。",            outcome:"good",    next:"n2" },
            { en: "He will not understand poetry.",         jp: "かれ は しい を わからない。",      outcome:"bad",     next:"n2dis" },
            { en: "Why this image?",                        jp: "なぜ この いめーじ？",                outcome:"good",    next:"n2why" },
          ],
        },
        "n2": {
          en: "Yes. And please add: I will not sing in his shop. I promise.",
          jp: "うん。 そして つけくわえて：『みせ で は うたわない。 やくそく』。",
          mood: "happy",
          choices: [
            { en: "I will tell him both.",                  jp: "りょうほう つたえる。",              outcome:"good",    next:"endWarm" },
            { en: "I will share just the promise, not the poetry.", jp: "やくそく だけ つたえる、 しい は なし。", outcome:"neutral", next:"endNeutral" },
          ],
        },
        "n2dis": {
          en: "Tako has eight arms. One of them must understand poetry.",
          jp: "タコ は 8本あし。 1本 は しい を わかる はず。",
          mood: "proud",
          choices: [
            { en: "OK, that is fair.",                      jp: "OK、 たしか に。",                   outcome:"good",    next:"n2" },
          ],
        },
        "n2why": {
          en: "Because both are tall, both are paper, both are full of sweet things inside.",
          jp: "りょうほう とも たかく、 かみ で、 なか は あまい もの で いっぱい。",
          mood: "wise",
          choices: [
            { en: "That is true.",                          jp: "ほんとう だ。",                      outcome:"good",    next:"n2" },
          ],
        },
        "endWarm":     { en:"Bellissimo, my little courier! Please bring me back his answer.", jp:"ベリッシモ、 ちいさい メッセンジャー！ へんじ も もって きて。", mood:"happy" },
        "endNeutral":  { en:"OK. The promise is enough for now. Bye.",                jp:"OK。 やくそく だけ で じゅうぶん。 バイ。",                    mood:"wise" },
      },
    }],

    ["pamp", {
      id: "msg-parfait",
      title: "A Message For Parfait",
      intro: "Pampamu holds a small empty jar. She wants to ask Parfait Iwashi for something specific.",
      scene: "pamp-toy-shop",
      start: "n1",
      nodes: {
        "n1": {
          en: "Please ask Parfait if she has a pink cherry. Just one will do — it is for my collection.",
          jp: "パフェ に きいて：『ピンク の さくらんぼ は ある？ 1つ で いい、 コレクション に』。",
          mood: "happy",
          choices: [
            { en: "Pink cherries are rare.",                jp: "ピンク の さくらんぼ は めずらしい。", outcome:"good", next:"n2" },
            { en: "I will ask, but maybe she only has red.", jp: "きく、 でも あかい しか ない かも。", outcome:"good",    next:"n2red" },
            { en: "What collection?",                        jp: "コレクション って？",                 outcome:"good",    next:"n2coll" },
          ],
        },
        "n2": {
          en: "She has them. She makes them sweet from sad days. Trade her a hug.",
          jp: "もっている。 かなしい ひ から あまく つくる。 ハグ と こうかん。",
          mood: "wise",
          choices: [
            { en: "I will trade a hug for a cherry.",       jp: "ハグ と さくらんぼ こうかん。",      outcome:"good",    next:"endWarm" },
          ],
        },
        "n2red": {
          en: "Red is also OK. But pink reminds me of where I came from.",
          jp: "あかい も いい。 でも ピンク は ぼく の ふるさと を おもいだす。",
          mood: "wise",
          choices: [
            { en: "I will try for pink first.",             jp: "まず ピンク を ためす。",             outcome:"good",    next:"n2" },
          ],
        },
        "n2coll": {
          en: "They are things from the other kaiju. One thing from each, so I never feel alone.",
          jp: "ほか の カイジュウ たち から の もの。 ひとり ずつ から ひとつ、 さびしく ならない ため。",
          mood: "sad",
          choices: [
            { en: "That is a sweet collection.",            jp: "あまい コレクション。",              outcome:"good",    next:"n2" },
            { en: "I will help you complete it.",            jp: "コンプリート て つだう。",          outcome:"good",    next:"n2" },
          ],
        },
        "endWarm":    { en:"Thank you. A hug for a cherry, a cherry for a memory.",  jp:"ありがとう。 ハグ と さくらんぼ、 さくらんぼ と おもいで。", mood:"happy" },
      },
    }],

    ["parfait", {
      id: "msg-pamp",
      title: "A Message For Pampamu",
      intro: "Parfait Iwashi taps her glass thoughtfully. She has a song to share with the fluffy plushy.",
      scene: "parfait-underwater-cafe",
      start: "n1",
      nodes: {
        "n1": {
          en: "Please tell Pampamu: I have a sweet song just for her.",
          jp: "パムパム に つたえて：『あなた だけ の あまい うた が ある』。",
          mood: "happy",
          choices: [
            { en: "A song just for her?",                    jp: "かのじょ だけ の うた？",            outcome:"good",    next:"n2" },
            { en: "Sing it to me first.",                    jp: "まず ぼく に。",                      outcome:"good",    next:"n2first" },
          ],
        },
        "n2": {
          en: "Yes. About cloud factories and how a soft thing can also be brave.",
          jp: "うん。 くも こうじょう と、 やわらかい もの も ゆうかん に なれる はなし。",
          mood: "wise",
          choices: [
            { en: "She will love that.",                     jp: "それ が だいすき に なる。",        outcome:"good",    next:"n3" },
            { en: "Tell her I learned it too.",              jp: "ぼく も おぼえた と つたえて。",    outcome:"good",    next:"n3" },
          ],
        },
        "n2first": {
          en: "Sweet little plushy, fluffy through the storm. Stuffing into bravery.",
          jp: "あまい ちいさい ぬいぐるみ、 あらし の なか でも ふわふわ。 なかみ が ゆうき に なる。",
          mood: "wise",
          choices: [
            { en: "That is a beautiful song.",                jp: "うつくしい うた。",                  outcome:"good",    next:"n3" },
            { en: "I will memorize it.",                      jp: "おぼえる。",                          outcome:"good",    next:"n3" },
          ],
        },
        "n3": {
          en: "Bring her here next time. Two soft things in one cafe.",
          jp: "つぎ かのじょ を つれて きて。 やわらかい もの 2つ が カフェ に。",
          mood: "happy",
          choices: [
            { en: "I will bring her.",                        jp: "つれて くる。",                      outcome:"good",    next:"endWarm" },
          ],
        },
        "endWarm":   { en:"Thank you. A song shared is twice the warmth.",          jp:"ありがとう。 わかちあう うた は あったかさ 2ばい。",         mood:"happy" },
      },
    }],

    ["unko", {
      id: "msg-temee",
      title: "A Message For Temee",
      intro: "Unkodilo holds a small flag with brown stripes. He wants you to bring it to the camel-monkey.",
      scene: "unko-swamp-empire",
      start: "n1",
      nodes: {
        "n1": {
          en: "Tell Temee: we are both kings of dusty places. He will understand.",
          jp: "ティメー に つたえて：『ぼくら は ほこり の おう』。 わかる はず。",
          mood: "proud",
          choices: [
            { en: "Kings of dusty places — got it.",        jp: "ほこり の おう、 わかった。",        outcome:"good",    next:"n2" },
            { en: "He is in Mongolia, which is far.",         jp: "かれ は モンゴル、 とおい ところ。", outcome:"neutral", next:"n2far" },
            { en: "I do not want to deliver.",                jp: "とどけたく ない。",                 outcome:"bad",     next:"endCool" },
          ],
        },
        "n2": {
          en: "And give him this flag. It has brown stripes. Show him a different kind of brown.",
          jp: "そして この はた を わたして。 ちゃいろい しま が ある。 べつ の ちゃいろ を みせて あげて。",
          mood: "happy",
          choices: [
            { en: "A flag from one king to another.",        jp: "おう から おう へ の はた。",       outcome:"good",    next:"endWarm" },
            { en: "Why a flag?",                              jp: "なぜ はた？",                        outcome:"good",    next:"n3" },
          ],
        },
        "n2far": {
          en: "The kid is faster than a swamp message. Please.",
          jp: "こども は しっち の メッセージ より はやい。 おねがい。",
          mood: "sad",
          choices: [
            { en: "OK, I will go.",                          jp: "OK、 いく。",                        outcome:"good",    next:"n2" },
          ],
        },
        "n3": {
          en: "Flags say: we are still here. Even in dust.",
          jp: "はた は『まだ ここ に いる』 と いう。 ほこり の なか でも。",
          mood: "wise",
          choices: [
            { en: "That is a good message.",                 jp: "いい メッセージ。",                  outcome:"good",    next:"endWarm" },
          ],
        },
        "endWarm":   { en:"The Brooklyn baby is a brother of Mongolia. Tell him slowly.", jp:"ブルックリン ベイビー は モンゴル の きょうだい。 ゆっくり つたえて。", mood:"happy" },
        "endCool":   { en:"Then the flag stays in the swamp. Goodbye.",                  jp:"じゃあ はた は しっち。 さよなら。",                                      mood:"sad" },
      },
    }],

    ["temee", {
      id: "msg-unko",
      title: "A Message For Unko",
      intro: "Temee Sarmagchin holds a small bag of dust. He wants you to take it to the bombing crocodile.",
      scene: "temee-mongolia-day",
      start: "n1",
      nodes: {
        "n1": {
          en: "Tell Unkodilo: the smell is welcome in the steppe.",
          jp: "ボンバルディロ に つたえて：『におい は ステップ で かんげい』。",
          mood: "wise",
          choices: [
            { en: "Welcome in the steppe?",                  jp: "ステップ で かんげい？",              outcome:"good",    next:"n2" },
            { en: "He smells bad.",                          jp: "かれ は くさい。",                    outcome:"neutral", next:"n2bad" },
            { en: "He will be moved.",                        jp: "かれ は うごかされる。",              outcome:"good",    next:"n2" },
          ],
        },
        "n2": {
          en: "Yes. In the steppe, every smell is honest, even the smell of bombs.",
          jp: "うん。 ステップ で は どんな におい も しょうじき、 ばくだん の におい でも。",
          mood: "proud",
          choices: [
            { en: "And the dust?",                           jp: "ほこり は？",                         outcome:"good",    next:"n3" },
            { en: "What a kind message.",                     jp: "やさしい メッセージ。",              outcome:"good",    next:"n3" },
          ],
        },
        "n2bad": {
          en: "Bad smells are still smells. Bad kings are still kings.",
          jp: "わるい におい も におい。 わるい おう も おう。",
          mood: "wise",
          choices: [
            { en: "I understand now.",                       jp: "わかった。",                          outcome:"good",    next:"n2" },
          ],
        },
        "n3": {
          en: "The dust is from my lost herd. Tell him to plant a fern in it.",
          jp: "ほこり は うしなった むれ から。 シダ を うえて と つたえて。",
          mood: "sad",
          choices: [
            { en: "He has a fern! Perfect.",                jp: "シダ が ある！ ばっちり。",          outcome:"good",    next:"endWarm" },
            { en: "I will bring him the dust.",              jp: "ほこり を もって いく。",            outcome:"good",    next:"endWarm" },
          ],
        },
        "endWarm":   { en:"One herd, two kings, no borders. Slow tears travel fast.", jp:"むれ ひとつ、 おう ふたり、 こっきょう なし。 おそい なみだ は はやく つたわる。", mood:"happy" },
      },
    }],

    ["anpan", {
      id: "msg-catcher",
      title: "A Message For Catcherski",
      intro: "Anpan Maguro stands next to the arcade. He has something kind to say to the broken machine.",
      scene: "anpan-bakery",
      start: "n1",
      nodes: {
        "n1": {
          en: "Tell Catcherski: you are not the only one with multiple parts.",
          jp: "キャッチャースキー に つたえて：『パーツ が いっぱい な の は きみ だけ じゃない』。",
          mood: "wise",
          choices: [
            { en: "Bread and fish, hack and machine — it is the same idea.", jp: "パン と さかな、 ハック と きかい、 おなじ かんがえ。", outcome:"good",   next:"n2" },
            { en: "He will think it is a joke.",             jp: "じょうだん と おもう。",             outcome:"neutral", next:"n2joke" },
            { en: "Why this message?",                        jp: "なぜ この メッセージ？",              outcome:"good",    next:"n2why" },
          ],
        },
        "n2": {
          en: "Exactly. We are both halves. Tell him I sit on a small throne too.",
          jp: "そう。 ぼくら は はんぶん。 ぼく も ちいさい おうざ に すわる、 と。",
          mood: "happy",
          choices: [
            { en: "We are two half-kings.",                   jp: "ぼくら は はんぶん の おう 2にん。",   outcome:"good",    next:"endWarm" },
            { en: "He will laugh kindly.",                    jp: "かれ は やさしく わらう。",          outcome:"good",    next:"endWarm" },
          ],
        },
        "n2joke": {
          en: "Then let it be a joke. Kind jokes count too.",
          jp: "じゃあ じょうだん で いい。 やさしい じょうだん も カウント。",
          mood: "happy",
          choices: [
            { en: "OK, I will deliver the joke.",            jp: "OK、 じょうだん として つたえる。", outcome:"good",   next:"n2" },
          ],
        },
        "n2why": {
          en: "Because I think he feels broken. And broken bread is still bread.",
          jp: "かれ は こわれて いる と かんじている みたい。 こわれた パン も パン。",
          mood: "wise",
          choices: [
            { en: "I will tell him gently.",                  jp: "やさしく つたえる。",                outcome:"good",    next:"n2" },
          ],
        },
        "endWarm":   { en:"Thank you. Half a hero is still a hero.",                jp:"ありがとう。 はんぶん の ヒーロー も ヒーロー。",         mood:"happy" },
      },
    }],

    ["catcherski", {
      id: "msg-anpan",
      title: "A Message For Anpan",
      intro: "Catcherski's screen flickers. He wants the bread-fish to know something quietly.",
      scene: "catcherski-arcade",
      start: "n1",
      nodes: {
        "n1": {
          en: "Tell Anpan: thank you for being kind to broken things.",
          jp: "アンパン に つたえて：『こわれた もの に やさしく して くれて ありがとう』。",
          mood: "sad",
          choices: [
            { en: "I will tell him.",                        jp: "つたえる。",                          outcome:"good",    next:"n2" },
            { en: "You are not so broken.",                   jp: "そんなに こわれて いない。",         outcome:"good",    next:"n2soft" },
            { en: "He is just bread.",                        jp: "ただ の パン。",                      outcome:"bad",     next:"n2bad" },
          ],
        },
        "n2": {
          en: "And tell him: I will keep a free emoji for him. Always.",
          jp: "そして つたえて：『かれ の ため に タダ の えもじ を ずっと もっておく』。",
          mood: "happy",
          choices: [
            { en: "A reserved emoji — that is sweet.",       jp: "とっておき の えもじ、 やさしい。", outcome:"good",   next:"endWarm" },
          ],
        },
        "n2soft": {
          en: "Maybe. Broken can also be a kind of complete.",
          jp: "かも。 こわれた も かんせい の ひとつ。",
          mood: "wise",
          choices: [
            { en: "What a beautiful thought.",                jp: "うつくしい かんがえ。",              outcome:"good",    next:"n2" },
          ],
        },
        "n2bad": {
          en: "And bread is everything. Goodbye.",
          jp: "そして パン は すべて。 さよなら。",
          mood: "angry",
          choices: [
            { en: "I am sorry, I take it back.",             jp: "ごめん、 とりけす。",                outcome:"good",    next:"n2" },
            { en: "OK then.",                                 jp: "わかった。",                          outcome:"bad",     next:"endCool" },
          ],
        },
        "endWarm":  { en:"Memory is a kind of pulling. Thank you for pulling me toward him.", jp:"きおく は ひっぱり の ひとつ。 かれ の ほう に ひっぱって くれて ありがとう。", mood:"happy" },
        "endCool":  { en:"Then I steal again. Sometimes I steal hope. Mostly emojis.",          jp:"じゃあ また ぬすむ。 ときどき きぼう、 だいたい えもじ。",                      mood:"sad" },
      },
    }],

  ];

  MSGS.forEach(([kid, conv]) => {
    if (window.STORY && window.STORY[kid]) {
      window.STORY[kid].conversations.push(conv);
    }
  });
})();
