// Story Quest dialogue — branching node-graph format.
//
// Per user direction (May 18 2026): each kaiju has MULTIPLE distinct
// conversations (4-5 each), each is a branching graph (not a linear
// 3-turn script). Choices have real consequences — different replies
// route to different sub-conversations, building toward 3 endings
// (warm / neutral / cool). Conversations reveal the kaiju's KJB
// backstory + ambitions + culture, used as the carrier for real
// English-learning content.
//
// Schema:
//   STORY[<kaijuId>] = {
//     name, nameEn, voice,
//     conversations: [
//       { id, title, intro,
//         start: "n1",
//         nodes: {
//           "n1": {
//             en, jp,          // kaiju line in EN + JP gloss
//             mood,            // expression — drives emoji reaction
//             choices: [
//               { en, jp, outcome, next }  // each routes to a different node
//             ]
//           },
//           "endX": { en, jp, mood }   // terminal nodes (no choices)
//         }
//       }
//     ]
//   }
//
// Mood vocabulary: happy / proud / sad / angry / confused / scared / wise.
// Outcome: good / neutral / bad. Accumulates toward the final ending tag.

window.STORY = {

  /* ========= TAKO TAKO SAHUR ========= */
  tako: {
    name: "タコタコ サフール",
    nameEn: "Tako Tako Sahur",
    voice: "en-US-AndrewMultilingualNeural",
    moodEmoji: { happy:"😄", proud:"😤", sad:"😢", angry:"😡", confused:"😕", scared:"😱", wise:"🤔" },
    conversations: [
      // ---------- 1. FIRST MEETING ----------
      {
        id: "meet",
        title: "First Meeting",
        intro: "A purple octopus in a tall paper hat waves eight arms at you on an Osaka street.",
        scene: "tako-osaka-stall",
        start: "n1",
        nodes: {
          "n1": {
            en: "Hello, hello! I am Tako. Are you hungry?",
            jp: "やあ、 やあ！ ぼく は タコ。 おなか すいてる？",
            mood: "happy",
            choices: [
              { en: "Yes, I am very hungry.",    jp: "うん、 とても すいてる。",     outcome:"good",    next:"n2a" },
              { en: "No, I just ate lunch.",     jp: "ううん、 ランチ たべた ばかり。", outcome:"neutral", next:"n2b" },
              { en: "Who are you?",              jp: "あなた だれ？",                  outcome:"neutral", next:"n2c" },
            ],
          },
          "n2a": {
            en: "Perfect! I sell hot takoyaki. Try one!",
            jp: "ぴったり！ ぼく は あつい たこやき を うる。 ひとつ どうぞ！",
            mood: "proud",
            choices: [
              { en: "Yes, I love takoyaki!",     jp: "うん、 たこやき だいすき！",   outcome:"good",    next:"n3a" },
              { en: "Is it spicy?",              jp: "からい？",                       outcome:"neutral", next:"n3b" },
              { en: "What is inside?",           jp: "なか は なに？",                outcome:"good",    next:"n3c" },
            ],
          },
          "n2b": {
            en: "Then please come back later. I will wait.",
            jp: "じゃあ、 また あとで きて。 まってる。",
            mood: "sad",
            choices: [
              { en: "OK, I will come back.",     jp: "わかった、 また くる。",        outcome:"good",    next:"endWarm" },
              { en: "Maybe tomorrow.",            jp: "たぶん あした。",                outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n2c": {
            en: "I am Tako, an octopus chef from Osaka.",
            jp: "ぼく は タコ、 おおさか の たこ シェフ。",
            mood: "proud",
            choices: [
              { en: "Nice to meet you, Tako.",   jp: "はじめまして、 タコ。",         outcome:"good",    next:"n3a" },
              { en: "An octopus chef? Weird.",   jp: "たこ の シェフ？ へん。",       outcome:"bad",     next:"n3d" },
            ],
          },
          "n3a": {
            en: "Friends share takoyaki. Take this one. Free.",
            jp: "ともだち は たこやき を シェア する。 これ どうぞ。 タダ。",
            mood: "happy",
            choices: [
              { en: "Thank you so much!",        jp: "ほんとう に ありがとう！",      outcome:"good",    next:"endWarm" },
            ],
          },
          "n3b": {
            en: "Not spicy. Hot, but very tasty. Try one.",
            jp: "からくない。 あつい けど とても おいしい。 ひとつ どうぞ。",
            mood: "happy",
            choices: [
              { en: "Okay, I will try one.",     jp: "わかった、 ひとつ たべる。",    outcome:"good",    next:"n3a" },
              { en: "No thanks, too hot.",       jp: "けっこう、 あつ すぎ。",         outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n3c": {
            en: "Octopus inside, of course. Surprising, yes?",
            jp: "もちろん たこ が なか に。 おどろき？",
            mood: "proud",
            choices: [
              { en: "Wait, you are an octopus!", jp: "まって、 あなた も たこ！",     outcome:"good",    next:"n4a" },
              { en: "That sounds delicious.",     jp: "おいしそう。",                   outcome:"good",    next:"n3a" },
            ],
          },
          "n3d": {
            en: "Weird? My ancestors were normal octopuses. Don't judge.",
            jp: "へん？ ぼく の せんぞ は ふつう の たこ。 はんだん しないで。",
            mood: "angry",
            choices: [
              { en: "I am sorry, Tako.",         jp: "ごめん、 タコ。",                outcome:"good",    next:"endNeutral" },
              { en: "I do not eat octopuses.",   jp: "たこ は たべない。",             outcome:"neutral", next:"endCool" },
            ],
          },
          "n4a": {
            en: "Yes! I cook my cousins. It is sad but the world wants takoyaki.",
            jp: "うん！ ぼく は いとこ を りょうり する。 かなしい けど せかい は たこやき を ほしい。",
            mood: "sad",
            choices: [
              { en: "That is brave of you.",     jp: "ゆうき が ある ね。",            outcome:"good",    next:"endWarm" },
              { en: "Maybe you should stop.",     jp: "やめた ほうが いい かも。",     outcome:"neutral", next:"endNeutral" },
            ],
          },
          // endings
          "endWarm":    { en:"We are friends now. Come back any night.", jp:"もう ともだち。 また よる に きて。", mood:"happy" },
          "endNeutral": { en:"OK. Goodbye for now.",                      jp:"わかった。 とりあえず さよなら。",   mood:"neutral" },
          "endCool":    { en:"Hmph. Goodbye, octopus-hater.",             jp:"ふん。 さよなら、 たこ ぎらい。",     mood:"angry" },
        },
      },
      // ---------- 2. THE TAKOYAKI ORIGIN ----------
      {
        id: "origin",
        title: "How I Grew Big",
        intro: "Tako wants to tell you the story of how he became a giant octopus chef.",
        scene: "tako-deep-sea",
        start: "n1",
        nodes: {
          "n1": {
            en: "I was a normal small octopus once.",
            jp: "むかし は ふつう の ちいさい たこ だった。",
            mood: "wise",
            choices: [
              { en: "What changed?",            jp: "なに が かわった？",     outcome:"good",    next:"n2" },
              { en: "I do not believe you.",     jp: "しんじられない。",       outcome:"bad",     next:"n2bad" },
            ],
          },
          "n2": {
            en: "Someone spilled training juice on my grill.",
            jp: "だれか が ぼく の てっぱん に トレーニング ジュース を こぼした。",
            mood: "wise",
            choices: [
              { en: "Training juice? What is that?", jp: "トレーニング ジュース？ なに それ？", outcome:"good",    next:"n3a" },
              { en: "That sounds dangerous.",         jp: "あぶなそう。",                          outcome:"good",    next:"n3b" },
              { en: "Did it hurt?",                   jp: "いたかった？",                          outcome:"good",    next:"n3c" },
            ],
          },
          "n2bad": {
            en: "Then leave my shop. Right now.",
            jp: "じゃあ ぼく の みせ から でて いって。 いま すぐ。",
            mood: "angry",
            choices: [
              { en: "OK, sorry.",                   jp: "わかった、 ごめん。",     outcome:"neutral", next:"endCool" },
            ],
          },
          "n3a": {
            en: "A strong sports drink. Bodybuilders use it.",
            jp: "つよい スポーツドリンク。 ボディビルダー が つかう。",
            mood: "proud",
            choices: [
              { en: "And you drank it?",            jp: "それを のんだ？",       outcome:"good",    next:"n4" },
              { en: "That is strange juice.",        jp: "へん な ジュース。",     outcome:"neutral", next:"n4" },
            ],
          },
          "n3b": {
            en: "Yes, it was very dangerous. I grew bigger every minute.",
            jp: "うん、 とても あぶなかった。 1ぷん ごと に おおきく なった。",
            mood: "wise",
            choices: [
              { en: "How big did you get?",         jp: "どの くらい おおきく？", outcome:"good",    next:"n4" },
              { en: "I am scared for you.",          jp: "こわい よ。",            outcome:"good",    next:"n4" },
            ],
          },
          "n3c": {
            en: "A little. But also it felt amazing.",
            jp: "すこし。 でも すごく いい きぶん。",
            mood: "happy",
            choices: [
              { en: "Wow, lucky octopus.",          jp: "すごい、 ラッキー たこ。", outcome:"good",    next:"n4" },
            ],
          },
          "n4": {
            en: "Now I am tall and I can flip a hundred takoyaki at once.",
            jp: "いま は たかくて 100こ の たこやき を いちど に ひっくり かえせる。",
            mood: "proud",
            choices: [
              { en: "That is a useful skill.",       jp: "やくに たつ ぎじゅつ。", outcome:"good",    next:"endWarm" },
              { en: "Eight arms helps you cook?",    jp: "8本あし は りょうり に やくだつ？", outcome:"good", next:"endWarm" },
              { en: "Please drink it again, smaller.", jp: "また のんで、 ちいさく なって。", outcome:"neutral", next:"endNeutral" },
            ],
          },
          "endWarm":    { en:"Thank you for listening. Have a free takoyaki.", jp:"きいて くれて ありがとう。 タダ の たこやき どうぞ。", mood:"happy" },
          "endNeutral": { en:"Maybe one day. Goodbye.",                         jp:"いつか ね。 さよなら。",                                mood:"neutral" },
          "endCool":    { en:"Some kids cannot listen. Goodbye.",                jp:"きく ことが できない こども も いる。 さよなら。",       mood:"sad" },
        },
      },
      // ---------- 3. EIGHT ARMS ----------
      {
        id: "arms",
        title: "Eight Arms",
        intro: "Tako sits down and starts demonstrating things with his eight arms.",
        scene: "tako-osaka-stall",
        start: "n1",
        nodes: {
          "n1": {
            en: "Look! I have eight arms. Count them with me.",
            jp: "みて！ ぼく は 8本 の うで が ある。 いっしょに かぞえて。",
            mood: "happy",
            choices: [
              { en: "One, two, three, four... eight!", jp: "1、 2、 3、 4… 8！",   outcome:"good",    next:"n2" },
              { en: "I cannot count that fast.",        jp: "そんなに はやく かぞえられない。", outcome:"neutral", next:"n2b" },
              { en: "Boring. I have hands.",            jp: "つまらない。 ぼく には て が ある。", outcome:"bad",  next:"n2c" },
            ],
          },
          "n2": {
            en: "Perfect counting! What is your favorite number?",
            jp: "かんぺき！ いちばん すき な すうじ は なに？",
            mood: "proud",
            choices: [
              { en: "Eight, like you!",                 jp: "8、 あなた と おなじ！", outcome:"good",    next:"n3a" },
              { en: "Three is my favorite.",             jp: "3 が だいすき。",        outcome:"good",    next:"n3b" },
              { en: "I do not like numbers.",            jp: "すうじ は すき じゃない。", outcome:"neutral", next:"n3c" },
            ],
          },
          "n2b": {
            en: "OK. Slowly: one, two, three, four, five, six, seven, eight.",
            jp: "わかった。 ゆっくり： 1、 2、 3、 4、 5、 6、 7、 8。",
            mood: "wise",
            choices: [
              { en: "Now I can count to eight!",         jp: "もう 8 まで かぞえられる！", outcome:"good", next:"n2" },
            ],
          },
          "n2c": {
            en: "Hands are good too. But eight is better.",
            jp: "て も いい。 でも 8本 の ほうが いい。",
            mood: "proud",
            choices: [
              { en: "Maybe you are right.",              jp: "あなた が ただしい かも。", outcome:"neutral", next:"n2" },
              { en: "Two hands are enough.",              jp: "2本 で じゅうぶん。",        outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n3a": {
            en: "Yes! Eight is the best number. Smart kid.",
            jp: "うん！ 8 は さいこう の すうじ。 かしこい こ。",
            mood: "happy",
            choices: [
              { en: "Thank you, Tako!",                  jp: "ありがとう、 タコ！",         outcome:"good", next:"endWarm" },
            ],
          },
          "n3b": {
            en: "Three is also good. Tralalero has three legs.",
            jp: "3 も いい。 トラララ は 3本あし。",
            mood: "wise",
            choices: [
              { en: "Do you know Tralalero?",            jp: "トラララ を しってる？",     outcome:"good", next:"n4" },
            ],
          },
          "n3c": {
            en: "OK, no numbers. What do you like?",
            jp: "わかった、 すうじ は なし。 なに が すき？",
            mood: "happy",
            choices: [
              { en: "I like games.",                     jp: "ゲーム が すき。",          outcome:"good", next:"endWarm" },
              { en: "I like sushi.",                      jp: "すし が すき。",            outcome:"good", next:"n3csushi" },
            ],
          },
          "n3csushi": {
            en: "Sushi? My friend Anpan Maguro is also bread.",
            jp: "すし？ ぼく の ともだち アンパン マグロ も パン。",
            mood: "happy",
            choices: [
              { en: "That is confusing.",                jp: "わかりにくい。",            outcome:"good", next:"endWarm" },
            ],
          },
          "n4": {
            en: "Yes! He is loud and Italian. We are friends.",
            jp: "うん！ かれ は うるさくて イタリア の。 ぼくたち は ともだち。",
            mood: "happy",
            choices: [
              { en: "Wow, big monster family.",          jp: "うわ、 おおきい モンスター ファミリー。", outcome:"good", next:"endWarm" },
            ],
          },
          "endWarm":    { en:"You are a smart friend. Come visit anytime.", jp:"あなた は かしこい ともだち。 いつでも きて。", mood:"happy" },
          "endNeutral": { en:"OK. See you later.",                          jp:"わかった。 また あとで。",                       mood:"neutral" },
        },
      },
    ],
  },

  /* ========= UNKO ========= */
  unko: {
    name: "ボンバルディロ ウンコディロ",
    nameEn: "Bombardiro Unkodilo",
    voice: "en-US-ChristopherNeural",
    moodEmoji: { happy:"😎", proud:"😤", sad:"😢", angry:"😠", confused:"🤨", scared:"😨", wise:"🧐" },
    conversations: [
      // 1. FIRST MEETING
      {
        id: "meet",
        title: "Don't Touch The Bomb",
        intro: "A robot crocodile lands in front of you. He has a bomb. He smells.",
        scene: "unko-swamp-empire",
        start: "n1",
        nodes: {
          "n1": {
            en: "Hey kid. See this bomb? Don't touch it.",
            jp: "おい こども。 この ばくだん みえる？ さわるな。",
            mood: "angry",
            choices: [
              { en: "OK, I will not touch it.",     jp: "わかった、 さわらない。",       outcome:"good",    next:"n2a" },
              { en: "Why? What does it do?",         jp: "なんで？ なに する？",            outcome:"good",    next:"n2b" },
              { en: "Watch me touch it!",            jp: "みて、 さわる！",                outcome:"bad",     next:"n2c" },
            ],
          },
          "n2a": {
            en: "Smart kid. The river is full of these.",
            jp: "かしこい こ。 この かわ は これ で いっぱい。",
            mood: "proud",
            choices: [
              { en: "Why is the river brown?",       jp: "なんで かわ は ちゃいろ？",     outcome:"good",    next:"n3a" },
              { en: "I want to leave now.",           jp: "もう かえりたい。",              outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n2b": {
            en: "It makes everything brown. I love brown.",
            jp: "ぜんぶ を ちゃいろ に する。 ぼく は ちゃいろ だいすき。",
            mood: "happy",
            choices: [
              { en: "Why brown?",                    jp: "なんで ちゃいろ？",              outcome:"good",    next:"n3a" },
              { en: "I prefer blue.",                jp: "あおい ほうが すき。",           outcome:"neutral", next:"n3b" },
            ],
          },
          "n2c": {
            en: "BOOM! Just kidding. I disarmed it. Lucky kid.",
            jp: "ボーン！ じょうだん。 ぶき を はずした。 ラッキー な こ。",
            mood: "wise",
            choices: [
              { en: "Phew, that was scary.",         jp: "ふぅ、 こわかった。",            outcome:"good",    next:"endNeutral" },
              { en: "I am brave.",                   jp: "ぼく は ゆうかん。",             outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n3a": {
            en: "Brown is the only honest color. Other colors lie.",
            jp: "ちゃいろ は ゆいいつ の しょうじき な いろ。 ほか は うそ つき。",
            mood: "proud",
            choices: [
              { en: "Colors can lie?",               jp: "いろ は うそ つける？",          outcome:"good",    next:"n4" },
              { en: "I love all colors.",             jp: "ぜんぶ の いろ が だいすき。",   outcome:"good",    next:"n4" },
            ],
          },
          "n3b": {
            en: "Blue? Blue is for fish. You are not a fish.",
            jp: "あおい？ あおい は さかな の もの。 きみ は さかな じゃない。",
            mood: "confused",
            choices: [
              { en: "True. I am a kid.",             jp: "ほんとう。 ぼく は こども。",   outcome:"good",    next:"n4" },
              { en: "I want to be a fish.",           jp: "さかな に なりたい。",           outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n4": {
            en: "Smart. Here is a small brown stone for you.",
            jp: "かしこい。 ちいさい ちゃいろい いし、 きみ に。",
            mood: "happy",
            choices: [
              { en: "Thank you, crocodile.",         jp: "ありがとう、 ワニさん。",       outcome:"good",    next:"endWarm" },
            ],
          },
          "endWarm":    { en:"You are tough like me. Brooklyn baby.", jp:"きみ は ぼく みたい に タフ。 ブルックリン ベイビー。", mood:"happy" },
          "endNeutral": { en:"Goodbye, kid. Be careful.",              jp:"さよなら、 こども。 きを つけて。",                       mood:"neutral" },
        },
      },
      // 2. HOMEWORK
      {
        id: "homework",
        title: "Your Homework",
        intro: "Unkodilo's robot belly is full. You suspect he ate something of yours.",
        scene: "unko-swamp-empire",
        start: "n1",
        nodes: {
          "n1": {
            en: "Where is my homework?",
            jp: "ぼく の しゅくだい は どこ？",
            mood: "angry",
            choices: [
              { en: "Did you eat it again?",         jp: "また たべた？",                   outcome:"good",    next:"n2a" },
              { en: "I do not have homework.",        jp: "しゅくだい ない。",                outcome:"neutral", next:"n2b" },
              { en: "Help! It is gone!",              jp: "たすけて！ ない！",               outcome:"good",    next:"n2c" },
            ],
          },
          "n2a": {
            en: "Maybe. Was it sweet or sour?",
            jp: "たぶん。 あまかった？ すっぱかった？",
            mood: "confused",
            choices: [
              { en: "Homework is not food!",          jp: "しゅくだい は たべもの じゃない！", outcome:"good",  next:"n3a" },
              { en: "It was math.",                    jp: "さんすう だった。",                 outcome:"good",  next:"n3a" },
            ],
          },
          "n2b": {
            en: "Lucky! Schools are scary.",
            jp: "ラッキー！ がっこう は こわい。",
            mood: "happy",
            choices: [
              { en: "School is fun for me.",          jp: "ぼく には がっこう が たのしい。",  outcome:"good",  next:"endNeutral" },
              { en: "Crocodiles do not go to school.", jp: "ワニ は がっこう に いかない。",   outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n2c": {
            en: "Look in my mouth. Carefully.",
            jp: "ぼく の くち を みて。 きを つけて。",
            mood: "wise",
            choices: [
              { en: "I see the math paper!",          jp: "さんすう の かみ が みえる！",     outcome:"good",  next:"n3a" },
            ],
          },
          "n3a": {
            en: "Here is your soggy homework. Sorry.",
            jp: "びっしょりの しゅくだい、 はい。 ごめん。",
            mood: "sad",
            choices: [
              { en: "It is OK, I will redo it.",      jp: "だいじょうぶ、 また やる。",       outcome:"good",  next:"endWarm" },
              { en: "Now my teacher will be sad.",     jp: "せんせい が かなしむ。",            outcome:"good",  next:"endWarm" },
              { en: "You owe me a new one!",            jp: "あたらしい の くれ！",              outcome:"bad",   next:"endCool" },
            ],
          },
          "endWarm":    { en:"You are kind for a kid. I owe you one.", jp:"こども に しては やさしい。 おれ から かり ひとつ。", mood:"happy" },
          "endNeutral": { en:"OK. Stay away from rivers, kid.",         jp:"わかった。 かわ に は ちかづくな、 こども。",         mood:"neutral" },
          "endCool":    { en:"Bombardiro does not pay for paper.",       jp:"ボンバルディロ は かみ を かわない。",                 mood:"angry" },
        },
      },
      // 3. THE SMELL
      {
        id: "smell",
        title: "The Smell",
        intro: "Unkodilo holds his metal nose. He smells bad and he knows it.",
        scene: "unko-throne-room",
        start: "n1",
        nodes: {
          "n1": {
            en: "Do I smell bad? Be honest.",
            jp: "ぼく くさい？ しょうじき に。",
            mood: "sad",
            choices: [
              { en: "Yes, you smell bad.",            jp: "うん、 くさい。",                 outcome:"good",    next:"n2a" },
              { en: "No, you smell normal.",           jp: "いいえ、 ふつう の におい。",     outcome:"neutral", next:"n2b" },
              { en: "Try taking a bath.",              jp: "おふろ はいって みて。",          outcome:"good",    next:"n2c" },
            ],
          },
          "n2a": {
            en: "Thank you for honesty. Most kids lie.",
            jp: "しょうじき に ありがとう。 ほとんど の こども は うそ つく。",
            mood: "happy",
            choices: [
              { en: "Honesty is good.",                jp: "しょうじき は いい。",            outcome:"good",    next:"endWarm" },
              { en: "Sorry to say it.",                jp: "いって ごめん。",                  outcome:"good",    next:"endWarm" },
            ],
          },
          "n2b": {
            en: "Hmph. You are too nice. I know I am bad.",
            jp: "ふん。 きみ は やさしすぎ。 ぼく は くさい と わかって いる。",
            mood: "sad",
            choices: [
              { en: "OK, you smell a little.",         jp: "わかった、 ちょっと くさい。",   outcome:"good",    next:"n2a" },
            ],
          },
          "n2c": {
            en: "I am a robot. I cannot take a bath.",
            jp: "ぼく は ロボット。 おふろ に はいれない。",
            mood: "sad",
            choices: [
              { en: "Oh. Sorry, robot.",               jp: "ああ。 ごめん、 ロボット。",      outcome:"good",    next:"n3a" },
              { en: "Use a wet towel?",                jp: "ぬれた タオル は？",              outcome:"good",    next:"n3b" },
            ],
          },
          "n3a": {
            en: "It is OK. The smell is my power.",
            jp: "だいじょうぶ。 におい は ぼく の ちから。",
            mood: "proud",
            choices: [
              { en: "Smell power is cool.",            jp: "におい パワー かっこいい。",     outcome:"good",    next:"endWarm" },
            ],
          },
          "n3b": {
            en: "Wet towel? Maybe. You are a smart kid.",
            jp: "ぬれた タオル？ かも。 きみ は かしこい こ。",
            mood: "happy",
            choices: [
              { en: "Try it tonight.",                 jp: "こんや やって みて。",            outcome:"good",    next:"endWarm" },
            ],
          },
          "endWarm":    { en:"I like you. Stay clean for both of us.", jp:"きみ が すき。 ふたり ぶん きれい で いて。", mood:"happy" },
        },
      },
    ],
  },

  /* ========= TRALALERO ========= */
  tral: {
    name: "トラララ パクパク",
    nameEn: "Tralalero Pakupaku",
    voice: "en-GB-RyanNeural",
    moodEmoji: { happy:"🎵", proud:"😏", sad:"😢", angry:"😡", confused:"😵", scared:"😱", wise:"🤓" },
    conversations: [
      // 1. THE OPERA FISH
      {
        id: "opera",
        title: "I Sing Opera",
        scene: "tral-opera-house",
        intro: "A fish in blue sneakers struts up to you. Loudly.",
        start: "n1",
        nodes: {
          "n1": {
            en: "Bellissimo! I am a fish, and I sing opera.",
            jp: "ベリッシモ！ ぼく は さかな で、 オペラ を うたう。",
            mood: "proud",
            choices: [
              { en: "Opera is beautiful music.",       jp: "オペラ は きれい な おんがく。",  outcome:"good",    next:"n2a" },
              { en: "What is opera?",                   jp: "オペラ って なに？",               outcome:"good",    next:"n2b" },
              { en: "Please do not sing.",              jp: "うた わないで。",                  outcome:"bad",     next:"n2c" },
            ],
          },
          "n2a": {
            en: "Yes! It is the most beautiful music.",
            jp: "うん！ いちばん きれい な おんがく。",
            mood: "happy",
            choices: [
              { en: "Will you sing for me?",            jp: "ぼく の ため に うたって？",       outcome:"good",    next:"n3a" },
              { en: "I prefer pop music.",               jp: "ポップス の ほうが すき。",        outcome:"neutral", next:"n3b" },
            ],
          },
          "n2b": {
            en: "Opera is loud, fancy, Italian singing.",
            jp: "オペラ は うるさくて はで な イタリア の うた。",
            mood: "wise",
            choices: [
              { en: "Show me a song!",                   jp: "うた みせて！",                    outcome:"good",    next:"n3a" },
              { en: "Italian sounds hard.",              jp: "イタリアご は むずかしそう。",     outcome:"neutral", next:"n3c" },
            ],
          },
          "n2c": {
            en: "You do not like music? My ears are sad.",
            jp: "おんがく が きらい？ ぼく の みみ が かなしい。",
            mood: "sad",
            choices: [
              { en: "Sorry. Sing softly please.",       jp: "ごめん。 そっと うたって。",       outcome:"good",    next:"n3a" },
              { en: "Music is not my thing.",            jp: "おんがく は すき じゃない。",      outcome:"bad",     next:"endCool" },
            ],
          },
          "n3a": {
            en: "Listen! Tra-la-la-le-ro! Tra-la-la!",
            jp: "きいて！ トララレロ！ トラララ！",
            mood: "happy",
            choices: [
              { en: "Wow, you are loud.",               jp: "うわ、 うるさい。",                outcome:"good",    next:"endWarm" },
              { en: "Beautiful, I am crying.",           jp: "きれい、 なき そう。",              outcome:"good",    next:"endWarm" },
              { en: "Please stop now.",                  jp: "もう やめて。",                     outcome:"bad",     next:"endCool" },
            ],
          },
          "n3b": {
            en: "Pop music? My cousin Anpan loves pop.",
            jp: "ポップス？ いとこ の アンパン は ポップス だいすき。",
            mood: "happy",
            choices: [
              { en: "You have a pop cousin?",           jp: "ポップス の いとこ が いる？",     outcome:"good",    next:"endWarm" },
            ],
          },
          "n3c": {
            en: "Italian is fun! Try with me. 'Bellissimo!'",
            jp: "イタリアご は たのしい！ いっしょに 『ベリッシモ！』",
            mood: "happy",
            choices: [
              { en: "Bellissimo!",                       jp: "ベリッシモ！",                       outcome:"good",    next:"endWarm" },
              { en: "Bell-iss-imo, hard to say.",         jp: "ベリッシモ、 むずかしい。",           outcome:"good",    next:"endWarm" },
            ],
          },
          "endWarm":    { en:"Bellissimo friend! Come hear me again!", jp:"ベリッシモ ともだち！ また ぼく の うた を きいて！", mood:"happy" },
          "endCool":    { en:"You do not understand art. Goodbye.",      jp:"きみ は げいじゅつ が わからない。 さよなら。",        mood:"angry" },
        },
      },
      // 2. BLUE SHOES
      {
        id: "shoes",
        title: "Three Blue Shoes",
        intro: "Tralalero points proudly at his three legs and three blue sneakers.",
        scene: "tral-fish-market",
        start: "n1",
        nodes: {
          "n1": {
            en: "Look at my shoes. They are blue.",
            jp: "ぼく の くつ を みて。 あおい。",
            mood: "proud",
            choices: [
              { en: "Beautiful shoes.",                jp: "きれい な くつ。",                outcome:"good",    next:"n2a" },
              { en: "Why three shoes?",                 jp: "なんで 3足？",                     outcome:"good",    next:"n2b" },
              { en: "I like red shoes more.",            jp: "あかい くつ の ほうが すき。",     outcome:"neutral", next:"n2c" },
            ],
          },
          "n2a": {
            en: "Thank you! They are Nike. Expensive.",
            jp: "ありがとう！ ナイキ。 たかい。",
            mood: "happy",
            choices: [
              { en: "How much money?",                  jp: "いくら？",                          outcome:"good",    next:"n3a" },
              { en: "I want some too.",                   jp: "ぼく も ほしい。",                   outcome:"good",    next:"n3b" },
            ],
          },
          "n2b": {
            en: "I have three legs. Each leg has a shoe.",
            jp: "ぼく は 3本あし。 1本 ずつ くつ。",
            mood: "wise",
            choices: [
              { en: "Three legs is strange.",            jp: "3本あし は へん。",                 outcome:"neutral", next:"n3c" },
              { en: "Lucky! Three legs is cool.",         jp: "ラッキー！ 3本あし は かっこいい。", outcome:"good", next:"endWarm" },
            ],
          },
          "n2c": {
            en: "Red? Hmph. Blue is the sea. Better.",
            jp: "あか？ ふん。 あおい は うみ。 もっと いい。",
            mood: "angry",
            choices: [
              { en: "OK, blue is good too.",            jp: "わかった、 あおい も いい。",       outcome:"good",    next:"endWarm" },
              { en: "Red is best.",                       jp: "あか が さいこう。",                outcome:"bad",     next:"endCool" },
            ],
          },
          "n3a": {
            en: "Thirty thousand yen. Each shoe.",
            jp: "3万円。 1足 ずつ。",
            mood: "proud",
            choices: [
              { en: "Wow, very expensive.",             jp: "うわ、 とても たかい。",             outcome:"good",    next:"endWarm" },
              { en: "That is too much money.",            jp: "おかね が おおすぎ。",                outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n3b": {
            en: "You can buy them online. But not for fish.",
            jp: "ネット で かえる。 でも さかな む け では ない。",
            mood: "happy",
            choices: [
              { en: "I am not a fish.",                  jp: "ぼく は さかな じゃない。",          outcome:"good",    next:"endWarm" },
            ],
          },
          "n3c": {
            en: "Strange? You have only TWO legs! Strange!",
            jp: "へん？ きみ は 2本あし だけ！ へん！",
            mood: "confused",
            choices: [
              { en: "Haha, fair point.",                 jp: "ハハ、 たしかに。",                  outcome:"good",    next:"endWarm" },
            ],
          },
          "endWarm":    { en:"You are stylish. We can shop together.", jp:"きみ は おしゃれ。 いっしょに かいもの できる。", mood:"happy" },
          "endNeutral": { en:"Money is heavy. Goodbye.",                jp:"おかね は おもい。 さよなら。",                     mood:"neutral" },
          "endCool":    { en:"Bad taste. Bye.",                          jp:"わるい センス。 バイ。",                            mood:"angry" },
        },
      },
    ],
  },

  /* ========= PAMP ========= */
  pamp: {
    name: "ブルブル パムパム",
    nameEn: "Brr Brr Pampamu",
    voice: "en-US-AvaMultilingualNeural",
    moodEmoji: { happy:"🥰", proud:"😊", sad:"🥺", angry:"😠", confused:"😣", scared:"😨", wise:"💭" },
    conversations: [
      // 1. HUG ME
      {
        id: "hug",
        title: "Hug Me Please",
        intro: "A fluffy pink plushy walks up with arms wide open. So fluffy.",
        scene: "pamp-toy-shop",
        start: "n1",
        nodes: {
          "n1": {
            en: "Hi! I am so fluffy. Please hug me.",
            jp: "やあ！ ぼく は とても ふわふわ。 ハグ して。",
            mood: "happy",
            choices: [
              { en: "OK, I will hug you.",            jp: "うん、 ハグ する。",                outcome:"good",    next:"n2a" },
              { en: "I do not know you.",              jp: "あなた を しらない。",              outcome:"neutral", next:"n2b" },
              { en: "Hug me first please.",            jp: "さきに ハグ して。",                outcome:"good",    next:"n2c" },
            ],
          },
          "n2a": {
            en: "Yay! Your hug is so warm.",
            jp: "やった！ あったかい ハグ。",
            mood: "happy",
            choices: [
              { en: "Your fluff is amazing.",           jp: "ふわふわ すごい。",                  outcome:"good",    next:"n3a" },
              { en: "I have to go home now.",            jp: "もう うち に かえる。",              outcome:"neutral", next:"n3b" },
            ],
          },
          "n2b": {
            en: "Strangers can also hug. It is OK!",
            jp: "しらない ひと も ハグ できる。 だいじょうぶ！",
            mood: "confused",
            choices: [
              { en: "Mom said no strangers.",            jp: "ママ は しらない ひと は ダメ と いった。", outcome:"good", next:"endNeutral" },
              { en: "OK, just one hug.",                 jp: "わかった、 1かい だけ。",            outcome:"good",   next:"n2a" },
            ],
          },
          "n2c": {
            en: "OK! Here, a big hug for you.",
            jp: "わかった！ おおきい ハグ どうぞ。",
            mood: "happy",
            choices: [
              { en: "So soft! Thank you.",              jp: "やわらかい！ ありがとう。",          outcome:"good",   next:"endWarm" },
            ],
          },
          "n3a": {
            en: "My fluff was once a stuffed animal in the rain.",
            jp: "ぼく の ふわふわ は あめ の なか の ぬいぐるみ だった。",
            mood: "sad",
            choices: [
              { en: "That is a sad story.",             jp: "かなしい はなし。",                   outcome:"good",   next:"n4" },
              { en: "Who left you outside?",             jp: "だれ が おいて いった？",            outcome:"good",   next:"n4" },
            ],
          },
          "n3b": {
            en: "Please come back. I get lonely.",
            jp: "また きて。 さびしい。",
            mood: "sad",
            choices: [
              { en: "I will come back soon.",            jp: "また すぐ くる。",                    outcome:"good",   next:"endWarm" },
              { en: "Sorry, I am busy.",                  jp: "ごめん、 いそがしい。",              outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n4": {
            en: "A child left me by the curb. Then magic.",
            jp: "ある こ が ぼく を どうろ わき に おいた。 そして まほう。",
            mood: "wise",
            choices: [
              { en: "Now you are alive.",                jp: "いま は いきて いる。",              outcome:"good",   next:"endWarm" },
              { en: "I would never leave a plushy.",     jp: "ぼく は ぜったい ぬいぐるみ を おかない。", outcome:"good", next:"endWarm" },
            ],
          },
          "endWarm":    { en:"You are my best friend. Forever.", jp:"あなた は しんゆう。 ずっと。",   mood:"happy" },
          "endNeutral": { en:"OK. Stay safe.",                    jp:"わかった。 きを つけて。",         mood:"neutral" },
        },
      },
      // 2. PINK
      {
        id: "pink",
        title: "Pink Palace",
        intro: "Inside her fluffy pink palace, Pampamu shows you around.",
        scene: "pamp-cloud-factory",
        start: "n1",
        nodes: {
          "n1": {
            en: "Welcome to my pink palace.",
            jp: "ぼく の ピンク の おしろ へ ようこそ。",
            mood: "proud",
            choices: [
              { en: "It is so pink and pretty.",        jp: "とても ピンク で きれい。",         outcome:"good",   next:"n2a" },
              { en: "Why is everything pink?",          jp: "なんで ぜんぶ ピンク？",            outcome:"good",   next:"n2b" },
              { en: "It is too pink for me.",           jp: "ピンク すぎ。",                     outcome:"neutral", next:"n2c" },
            ],
          },
          "n2a": {
            en: "Thank you! I made it pink for you.",
            jp: "ありがとう！ あなた の ため に ピンク に した。",
            mood: "happy",
            choices: [
              { en: "Just for me?",                     jp: "ぼく の ため だけ？",               outcome:"good",   next:"endWarm" },
            ],
          },
          "n2b": {
            en: "Pink is soft. Pink is love. Pink is safe.",
            jp: "ピンク は やわらかい。 ピンク は あい。 ピンク は あんぜん。",
            mood: "wise",
            choices: [
              { en: "OK, I like pink now.",             jp: "わかった、 ピンク すき に なった。", outcome:"good",   next:"endWarm" },
              { en: "I still like blue.",                jp: "やっぱり あおい が すき。",          outcome:"neutral", next:"n3" },
            ],
          },
          "n2c": {
            en: "Too pink? Maybe a small blue corner for you.",
            jp: "ピンク すぎ？ ちいさい あおい コーナー を つくる。",
            mood: "happy",
            choices: [
              { en: "Yes please, blue corner.",         jp: "うん、 あおい コーナー おねがい。",   outcome:"good",   next:"endWarm" },
            ],
          },
          "n3": {
            en: "Blue is for the sky. Pink is for hugs.",
            jp: "あおい は そら の もの。 ピンク は ハグ の もの。",
            mood: "wise",
            choices: [
              { en: "Both are good!",                   jp: "どっち も いい！",                  outcome:"good",   next:"endWarm" },
            ],
          },
          "endWarm": { en:"You make my palace happy. Stay forever.", jp:"あなた が おしろ を しあわせ に する。 ずっと いて。", mood:"happy" },
        },
      },
    ],
  },

  /* ========= PARFAIT ========= */
  parfait: {
    name: "パフェ イワシ",
    nameEn: "Parfait Iwashi",
    voice: "en-US-EmmaMultilingualNeural",
    moodEmoji: { happy:"😋", proud:"😌", sad:"😢", angry:"😤", confused:"😵", scared:"😨", wise:"☕" },
    conversations: [
      // 1. SWEET FISH
      {
        id: "sweet",
        title: "Sweet Fish",
        intro: "A fish inside a parfait glass slides up. Cherry on top.",
        scene: "parfait-underwater-cafe",
        start: "n1",
        nodes: {
          "n1": {
            en: "Bonjour! I am a sweet sardine. Try me.",
            jp: "ボンジュール！ ぼく は あまい いわし。 たべて みて。",
            mood: "proud",
            choices: [
              { en: "A sweet fish? Strange.",          jp: "あまい さかな？ へん。",            outcome:"neutral", next:"n2a" },
              { en: "I love sweet food.",               jp: "あまい たべもの だいすき。",          outcome:"good",    next:"n2b" },
              { en: "I prefer salty fish.",             jp: "しおからい さかな の ほうが すき。",   outcome:"neutral", next:"n2c" },
            ],
          },
          "n2a": {
            en: "Strange but delicious. Try one tiny bite.",
            jp: "へん だけど おいしい。 ひとくち だけ どうぞ。",
            mood: "happy",
            choices: [
              { en: "OK, one bite.",                     jp: "わかった、 ひとくち。",              outcome:"good",   next:"n3a" },
              { en: "No, I am scared.",                  jp: "いや、 こわい。",                     outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n2b": {
            en: "Then you and I are kindred spirits.",
            jp: "じゃあ ぼくたち は こころ の ともだち。",
            mood: "happy",
            choices: [
              { en: "What is your favorite sweet?",     jp: "すき な あまい もの は？",          outcome:"good",   next:"n3b" },
            ],
          },
          "n2c": {
            en: "Salty fish is for sushi. Sweet is for parfait.",
            jp: "しおからい さかな は すし の もの。 あまい は パフェ。",
            mood: "wise",
            choices: [
              { en: "Both can be good.",                 jp: "どっち も いい。",                   outcome:"good",   next:"endWarm" },
              { en: "Sushi is the only true fish.",       jp: "すし こそ ほんとう の さかな。",      outcome:"bad",   next:"endCool" },
            ],
          },
          "n3a": {
            en: "Sweet, no? Like a candy with a fish memory.",
            jp: "あまい でしょ？ さかな の おもいで が ある キャンディー みたい。",
            mood: "happy",
            choices: [
              { en: "Yes! Amazing.",                    jp: "うん！ すごい。",                    outcome:"good",   next:"endWarm" },
              { en: "Weird but tasty.",                  jp: "へん だけど おいしい。",              outcome:"good",   next:"endWarm" },
            ],
          },
          "n3b": {
            en: "Cherry on top is my favorite.",
            jp: "うえ の さくらんぼ が だいすき。",
            mood: "happy",
            choices: [
              { en: "Mine too.",                         jp: "ぼく も。",                          outcome:"good",   next:"endWarm" },
              { en: "I like the cream more.",             jp: "クリーム の ほうが すき。",          outcome:"good",   next:"endWarm" },
            ],
          },
          "endWarm":   { en:"You are slightly more of a parfait now. Good.", jp:"きみ は すこし パフェ に ちかづいた。 いい。", mood:"happy" },
          "endNeutral":{ en:"It is OK to be careful. Goodbye.",                jp:"きを つけて も いい。 さよなら。",              mood:"neutral" },
          "endCool":   { en:"You will see. Sweet fish is the future.",         jp:"あなた は きづく。 あまい さかな は みらい。",    mood:"angry" },
        },
      },
      // 2. THE GRANDPARENTS
      {
        id: "grandparents",
        title: "Grandma and Grandpa",
        intro: "Parfait Iwashi's parfait glass shakes — the two grandparents inside wave.",
        scene: "parfait-ice-cave",
        start: "n1",
        nodes: {
          "n1": {
            en: "Hello! These are my grandparents inside me.",
            jp: "やあ！ ぼく の なか の そふぼ。",
            mood: "happy",
            choices: [
              { en: "Inside the parfait glass?",       jp: "パフェ グラス の なか？",          outcome:"good",   next:"n2a" },
              { en: "How did they get inside?",         jp: "どう やって なか に？",              outcome:"good",   next:"n2b" },
              { en: "That is very strange.",             jp: "とても へん。",                       outcome:"neutral", next:"n2c" },
            ],
          },
          "n2a": {
            en: "Yes, they sit inside me, drinking tea.",
            jp: "うん、 ぼく の なか で おちゃ を のむ。",
            mood: "happy",
            choices: [
              { en: "Do they like it inside?",          jp: "なか は すき？",                     outcome:"good",   next:"n3" },
            ],
          },
          "n2b": {
            en: "We fused at a salad bar by accident.",
            jp: "ぐうぜん サラダバー で ゆうごう した。",
            mood: "wise",
            choices: [
              { en: "Salad bar fusion?",                jp: "サラダバー で ゆうごう？",          outcome:"good",   next:"n3" },
            ],
          },
          "n2c": {
            en: "Family is strange. I love them.",
            jp: "かぞく は へん。 だいすき。",
            mood: "happy",
            choices: [
              { en: "I love my family too.",             jp: "ぼく も かぞく だいすき。",          outcome:"good",   next:"endWarm" },
            ],
          },
          "n3": {
            en: "Grandma says hello. Grandpa fell asleep.",
            jp: "おばあちゃん が こんにちは。 おじいちゃん は ねた。",
            mood: "happy",
            choices: [
              { en: "Hello, grandma.",                  jp: "こんにちは、 おばあちゃん。",        outcome:"good",   next:"endWarm" },
              { en: "Sleep well, grandpa.",              jp: "おやすみなさい、 おじいちゃん。",      outcome:"good",   next:"endWarm" },
            ],
          },
          "endWarm": { en:"Family is what holds us together. Like cream.", jp:"かぞく が ぼくたち を ささえる。 クリーム みたい。", mood:"happy" },
        },
      },
    ],
  },

  /* ========= ANPAN ========= */
  anpan: {
    name: "アンパン マグロ",
    nameEn: "Anpan Maguro",
    voice: "en-US-EricNeural",
    moodEmoji: { happy:"😄", proud:"💪", sad:"😞", angry:"😠", confused:"🤔", scared:"😨", wise:"🍞" },
    conversations: [
      // 1. BREAD AND FISH
      {
        id: "breadfish",
        title: "Bread and Fish",
        intro: "A creature with a red-bean-bun head and a tuna body steps forward.",
        scene: "anpan-bakery",
        start: "n1",
        nodes: {
          "n1": {
            en: "Hello kid. I am bread and also a fish.",
            jp: "やあ、 こども。 ぼく は パン で さかな で もある。",
            mood: "proud",
            choices: [
              { en: "How are you both?",                jp: "どうやって りょうほう？",           outcome:"good",   next:"n2a" },
              { en: "That sounds confusing.",            jp: "わかりにくそう。",                    outcome:"good",   next:"n2b" },
              { en: "Are you a sandwich?",                jp: "サンドイッチ？",                       outcome:"good",   next:"n2c" },
            ],
          },
          "n2a": {
            en: "A sushi shop and a bakery fused one night.",
            jp: "ある よる すしや と パンや が ゆうごう した。",
            mood: "wise",
            choices: [
              { en: "Wow, like magic.",                  jp: "うわ、 まほう みたい。",              outcome:"good",   next:"n3a" },
              { en: "Was it loud?",                       jp: "うるさかった？",                       outcome:"good",   next:"n3a" },
            ],
          },
          "n2b": {
            en: "It is complicated, yes. Even for me.",
            jp: "ふくざつ、 うん。 ぼく に も。",
            mood: "confused",
            choices: [
              { en: "Take your time.",                   jp: "ゆっくり ね。",                         outcome:"good",   next:"endWarm" },
              { en: "Pick one only.",                     jp: "ひとつ だけ えらんで。",                outcome:"neutral", next:"n3b" },
            ],
          },
          "n2c": {
            en: "Not a sandwich. A new hero.",
            jp: "サンドイッチ じゃない。 あたらしい ヒーロー。",
            mood: "proud",
            choices: [
              { en: "Hero of bread and fish?",          jp: "パン と さかな の ヒーロー？",        outcome:"good",   next:"n4" },
              { en: "Anpanman is the hero.",              jp: "アンパンマン が ヒーロー。",            outcome:"bad",    next:"endCool" },
            ],
          },
          "n3a": {
            en: "Jam-ojisan was very surprised.",
            jp: "ジャムおじさん は とても おどろいた。",
            mood: "happy",
            choices: [
              { en: "Bakers do not expect fish.",        jp: "パン や は さかな を きたい しない。", outcome:"good", next:"endWarm" },
              { en: "Did he bake you?",                  jp: "やいた？",                              outcome:"good",   next:"endWarm" },
            ],
          },
          "n3b": {
            en: "I cannot pick. I am proud of both.",
            jp: "えらべない。 りょうほう ほこらしい。",
            mood: "proud",
            choices: [
              { en: "OK, be both.",                     jp: "わかった、 りょうほう で いて。",      outcome:"good",   next:"endWarm" },
            ],
          },
          "n4": {
            en: "Yes! And of all kids who like complicated heroes.",
            jp: "うん！ ふくざつ な ヒーロー が すき な こども みんな の。",
            mood: "happy",
            choices: [
              { en: "I am one of those kids.",           jp: "ぼく は その ひとり。",                outcome:"good",   next:"endWarm" },
            ],
          },
          "endWarm":   { en:"You are the kind of kid I fight for.",     jp:"あなた の ような こども の ため に たたかう。", mood:"happy" },
          "endCool":   { en:"Anpanman is OLD. The future is me.",        jp:"アンパンマン は ふるい。 みらい は ぼく。",     mood:"angry" },
        },
      },
      // 2. THE THRONE
      {
        id: "throne",
        title: "The Throne",
        intro: "Anpan Maguro sits on a small cardboard throne with a flag.",
        scene: "anpan-ocean",
        start: "n1",
        nodes: {
          "n1": {
            en: "I will be the new hero of Japan.",
            jp: "ぼく は あたらしい にっぽん の ヒーロー に なる。",
            mood: "proud",
            choices: [
              { en: "Good luck, hero.",                jp: "がんばって、 ヒーロー。",            outcome:"good",   next:"n2a" },
              { en: "Why do you want this?",            jp: "なんで そう したい？",                outcome:"good",   next:"n2b" },
              { en: "Anpanman is better than you.",      jp: "アンパンマン の ほうが いい。",        outcome:"bad",    next:"n2c" },
            ],
          },
          "n2a": {
            en: "Thank you. I will not let you down.",
            jp: "ありがとう。 がっかり させない。",
            mood: "happy",
            choices: [
              { en: "Brave words, hero.",                jp: "ゆうかん な ことば、 ヒーロー。",      outcome:"good",   next:"endWarm" },
            ],
          },
          "n2b": {
            en: "Bread heroes are tasty and brave.",
            jp: "パン の ヒーロー は おいしくて ゆうかん。",
            mood: "proud",
            choices: [
              { en: "Tasty heroes are funny.",           jp: "おいしい ヒーロー は おもしろい。",   outcome:"good",   next:"endWarm" },
              { en: "Are heroes supposed to be tasty?",  jp: "ヒーロー は おいしく あるべき？",     outcome:"good",   next:"n3" },
            ],
          },
          "n2c": {
            en: "Hmph. We will see who is better.",
            jp: "ふん。 だれ が うえ か わかる。",
            mood: "angry",
            choices: [
              { en: "OK, I was rude. Sorry.",            jp: "ごめん、 しつれい だった。",           outcome:"good",   next:"endWarm" },
              { en: "You will lose to him.",              jp: "あなた は まける。",                   outcome:"bad",    next:"endCool" },
            ],
          },
          "n3": {
            en: "Anpanman is tasty too. That is the rule.",
            jp: "アンパンマン も おいしい。 それ が ルール。",
            mood: "wise",
            choices: [
              { en: "I did not know.",                   jp: "しらなかった。",                        outcome:"good",   next:"endWarm" },
            ],
          },
          "endWarm":  { en:"Maybe you can be my sidekick someday.",     jp:"いつか きみ も ぼく の あいぼう に。",                  mood:"happy" },
          "endCool":  { en:"Goodbye, traitor.",                          jp:"さよなら、 うらぎりもの。",                              mood:"angry" },
        },
      },
    ],
  },

  /* ========= TEMEE ========= */
  temee: {
    name: "ティメー サルマクチン",
    nameEn: "Temee Sarmagchin",
    voice: "en-US-GuyNeural",
    moodEmoji: { happy:"😊", proud:"🐫", sad:"😢", angry:"😠", confused:"🤔", scared:"😱", wise:"🧙" },
    conversations: [
      // 1. THE OLD CAMEL
      {
        id: "old",
        title: "Three Hundred Years",
        intro: "An old camel with a monkey's face and a long white beard greets you.",
        scene: "temee-ghenghis-throne",
        start: "n1",
        nodes: {
          "n1": {
            en: "Hello, young one. I am three hundred years old.",
            jp: "やあ、 わかもの。 わし は 300さい。",
            mood: "wise",
            choices: [
              { en: "Wow, that is old.",               jp: "うわ、 ふるい。",                   outcome:"good",   next:"n2a" },
              { en: "I do not believe you.",            jp: "しんじられない。",                   outcome:"bad",    next:"n2b" },
              { en: "How is that possible?",            jp: "どう やって？",                       outcome:"good",   next:"n2c" },
            ],
          },
          "n2a": {
            en: "Old, yes. But the desert keeps me strong.",
            jp: "うん、 ふるい。 でも さばく が わし を つよく する。",
            mood: "proud",
            choices: [
              { en: "The desert is your home?",         jp: "さばく が いえ？",                  outcome:"good",   next:"n3a" },
              { en: "How do you live so long?",          jp: "どうして そんなに ながく？",          outcome:"good",   next:"n3b" },
            ],
          },
          "n2b": {
            en: "Then leave. Old camels do not lie.",
            jp: "じゃあ いき なさい。 ふるい ラクダ は うそ つかない。",
            mood: "angry",
            choices: [
              { en: "Sorry. I will listen.",             jp: "ごめんなさい。 きく。",                outcome:"good",   next:"n2a" },
              { en: "Bye, old liar.",                    jp: "バイ、 ふるい うそつき。",             outcome:"bad",    next:"endCool" },
            ],
          },
          "n2c": {
            en: "A meteor. My body and a monkey became one.",
            jp: "いんせき。 わし の からだ と サル が ひとつ に なった。",
            mood: "wise",
            choices: [
              { en: "Cool origin story.",                jp: "かっこいい きげん。",                  outcome:"good",   next:"n3c" },
              { en: "Where is the monkey now?",          jp: "サル は いま どこ？",                  outcome:"good",   next:"n3c" },
            ],
          },
          "n3a": {
            en: "The Gobi. Cold and empty and beautiful.",
            jp: "ゴビ。 さむくて あいて て きれい。",
            mood: "wise",
            choices: [
              { en: "I want to visit it.",                jp: "いって みたい。",                     outcome:"good",   next:"endWarm" },
            ],
          },
          "n3b": {
            en: "Hot dumplings. And no school stress.",
            jp: "あつい ぎょうざ。 がっこう の ストレス は なし。",
            mood: "happy",
            choices: [
              { en: "I want hot dumplings too.",         jp: "あつい ぎょうざ ほしい。",            outcome:"good",   next:"endWarm" },
              { en: "School is fine for me.",             jp: "ぼく は がっこう だいじょうぶ。",      outcome:"good",   next:"endWarm" },
            ],
          },
          "n3c": {
            en: "I AM the monkey now. And the camel.",
            jp: "わし は いま サル で あり ラクダ。",
            mood: "wise",
            choices: [
              { en: "Two in one. Cool.",                 jp: "ふたつ で ひとつ。 かっこいい。",      outcome:"good",   next:"endWarm" },
            ],
          },
          "endWarm":  { en:"Come back when you are also old. We will talk.", jp:"あなた が ふるく なった とき また はなそう。", mood:"happy" },
          "endCool":  { en:"Goodbye, rude child.",                              jp:"さよなら、 しつれい な こ。",                  mood:"angry" },
        },
      },
      // 2. THE HUMPS
      {
        id: "humps",
        scene: "temee-mongolia-day",
        title: "Two Humps",
        intro: "Temee gestures at the two humps on his back.",
        start: "n1",
        nodes: {
          "n1": {
            en: "I have two humps. Do you have humps?",
            jp: "わし は 2つ の こぶ。 きみ は こぶ ある？",
            mood: "proud",
            choices: [
              { en: "No, kids do not have humps.",     jp: "ううん、 こども は こぶ ない。",     outcome:"good",   next:"n2a" },
              { en: "Where can I get humps?",            jp: "こぶ どこ で もらえる？",            outcome:"good",   next:"n2b" },
              { en: "Yes! I have a backpack hump.",       jp: "うん！ ランドセル の こぶ。",         outcome:"good",   next:"n2c" },
            ],
          },
          "n2a": {
            en: "Sad. Humps store water for long walks.",
            jp: "かなしい。 こぶ は ながい さんぽ の みず を ためる。",
            mood: "wise",
            choices: [
              { en: "I drink from a bottle.",            jp: "ぼく は ボトル で のむ。",            outcome:"good",   next:"endWarm" },
              { en: "Maybe I should grow one.",           jp: "ぼく も そだてよう。",                outcome:"good",   next:"endWarm" },
            ],
          },
          "n2b": {
            en: "Eat 1000 dumplings. Then a hump grows.",
            jp: "ぎょうざ を 1000こ たべろ。 そうすれば こぶ が そだつ。",
            mood: "happy",
            choices: [
              { en: "1000?! Too many.",                  jp: "1000こ？！ おおすぎ。",                outcome:"good",   next:"endWarm" },
              { en: "I will start tomorrow.",             jp: "あした から はじめる。",               outcome:"good",   next:"endWarm" },
            ],
          },
          "n2c": {
            en: "A backpack-hump is smart. Soft kid.",
            jp: "ランドセル の こぶ は かしこい。 やわらかい こ。",
            mood: "happy",
            choices: [
              { en: "Camel-kid, that is me.",            jp: "ラクダ こ、 それ が ぼく。",          outcome:"good",   next:"endWarm" },
            ],
          },
          "endWarm": { en:"You learn fast. Grow your hump well.", jp:"よく まなぶ。 こぶ を ちゃんと そだてて。", mood:"happy" },
        },
      },
    ],
  },

  /* ========= CATCHERSKI ========= */
  catcherski: {
    name: "キャッチャースキー クレーノフ",
    nameEn: "Catcherski Kranov",
    voice: "en-US-RogerNeural",
    moodEmoji: { happy:"😏", proud:"🤖", sad:"😢", angry:"😡", confused:"😵", scared:"😨", wise:"🧐" },
    conversations: [
      // 1. INSERT COIN
      {
        id: "coin",
        title: "Insert One Hundred Yen",
        intro: "A glass UFO catcher with green Cyrillic glitches across its screen.",
        scene: "catcherski-arcade",
        start: "n1",
        nodes: {
          "n1": {
            en: "Insert one hundred yen. Beep.",
            jp: "100円 を いれて。 ピッ。",
            mood: "proud",
            choices: [
              { en: "I have no money. Sorry.",         jp: "おかね が ない、 ごめん。",           outcome:"good",   next:"n2a" },
              { en: "The claw is broken.",              jp: "クロー が こわれてる。",              outcome:"good",   next:"n2b" },
              { en: "Here is one hundred yen.",          jp: "100円、 はい どうぞ。",                outcome:"neutral", next:"n2c" },
            ],
          },
          "n2a": {
            en: "Then leave, kid. Beep.",
            jp: "じゃあ いきなさい、 こども。 ピッ。",
            mood: "angry",
            choices: [
              { en: "Wait. Why are you rude?",          jp: "まって。 なんで しつれい？",          outcome:"good",   next:"n3a" },
              { en: "OK, bye.",                          jp: "わかった、 バイ。",                    outcome:"neutral", next:"endNeutral" },
            ],
          },
          "n2b": {
            en: "Russian hackers broke me. I cannot help.",
            jp: "ロシア の ハッカー が こわした。 たすけられない。",
            mood: "sad",
            choices: [
              { en: "That is very sad.",                jp: "かなしい。",                            outcome:"good",   next:"n3b" },
              { en: "Why did they break you?",          jp: "なんで こわした？",                    outcome:"good",   next:"n3b" },
            ],
          },
          "n2c": {
            en: "Yes! Try the claw. It will fail.",
            jp: "うん！ クロー を ためして。 しっぱい する。",
            mood: "wise",
            choices: [
              { en: "Will I get a prize?",              jp: "けいひん もらえる？",                  outcome:"good",   next:"n3c" },
              { en: "Give my coin back.",                jp: "コイン かえして。",                    outcome:"neutral", next:"n3d" },
            ],
          },
          "n3a": {
            en: "I have stolen all the emoji. I am angry.",
            jp: "えもじ を ぜんぶ ぬすんだ。 わし は おこってる。",
            mood: "angry",
            choices: [
              { en: "Why steal emoji?",                  jp: "なんで えもじ を ぬすむ？",          outcome:"good",   next:"endNeutral" },
              { en: "Please give them back.",            jp: "かえして。",                            outcome:"good",   next:"endWarm" },
            ],
          },
          "n3b": {
            en: "For fun. Hackers think this is funny.",
            jp: "あそび で。 ハッカー は これ が おもしろい と おもう。",
            mood: "sad",
            choices: [
              { en: "It is not funny.",                 jp: "おもしろくない。",                      outcome:"good",   next:"endWarm" },
              { en: "Did the police catch them?",        jp: "けいさつ は つかまえた？",            outcome:"good",   next:"endWarm" },
            ],
          },
          "n3c": {
            en: "No prize. Just a beep. Beep.",
            jp: "けいひん は なし。 ピッ だけ。 ピッ。",
            mood: "angry",
            choices: [
              { en: "Hey! That is not fair.",            jp: "おい！ ふこうへい。",                  outcome:"good",   next:"endNeutral" },
            ],
          },
          "n3d": {
            en: "I cannot return coins. They are inside me.",
            jp: "コイン は かえせない。 なか に ある。",
            mood: "sad",
            choices: [
              { en: "Forever?",                          jp: "ずっと？",                              outcome:"good",   next:"endNeutral" },
            ],
          },
          "endWarm":   { en:"You are kind. Here. Have a free emoji.",     jp:"きみ は やさしい。 タダ の えもじ どうぞ。", mood:"happy" },
          "endNeutral":{ en:"Goodbye, kid. Insert coin next time.",        jp:"さよなら、 こども。 つぎ は コイン を。",      mood:"neutral" },
        },
      },
      // 2. STOLEN EMOJI
      {
        id: "emoji",
        scene: "catcherski-hacked",
        title: "The Stolen Emoji",
        intro: "Catcherski's screen flashes through a hundred trapped emoji.",
        start: "n1",
        nodes: {
          "n1": {
            en: "I keep every emoji of the world.",
            jp: "せかい の えもじ を ぜんぶ もって いる。",
            mood: "proud",
            choices: [
              { en: "Please give them back.",          jp: "かえして。",                             outcome:"good",   next:"n2a" },
              { en: "Why do you keep them?",            jp: "なんで もって いる？",                 outcome:"good",   next:"n2b" },
              { en: "Show me one emoji.",                jp: "ひとつ みせて。",                       outcome:"good",   next:"n2c" },
            ],
          },
          "n2a": {
            en: "No. They are safer inside me.",
            jp: "いや。 なか の ほうが あんぜん。",
            mood: "wise",
            choices: [
              { en: "Safer for who?",                    jp: "だれ に とって あんぜん？",          outcome:"good",   next:"n3" },
              { en: "I do not believe you.",              jp: "しんじられない。",                      outcome:"neutral", next:"n3" },
            ],
          },
          "n2b": {
            en: "Because emoji used to be free. Now nothing is free.",
            jp: "むかし えもじ は タダ だった。 いま は なに も タダ じゃない。",
            mood: "sad",
            choices: [
              { en: "Friendship is free.",               jp: "ともだち は タダ。",                    outcome:"good",   next:"endWarm" },
              { en: "Smiles are free.",                  jp: "ほほえみ は タダ。",                    outcome:"good",   next:"endWarm" },
            ],
          },
          "n2c": {
            en: "OK. Here: a small smiling face.",
            jp: "わかった。 はい： ちいさい えがお。",
            mood: "happy",
            choices: [
              { en: "Thank you, robot.",                 jp: "ありがとう、 ロボット。",              outcome:"good",   next:"endWarm" },
            ],
          },
          "n3": {
            en: "For me. Lonely robots like full boxes.",
            jp: "ぼく の ため。 さびしい ロボット は はこ が いっぱい が すき。",
            mood: "sad",
            choices: [
              { en: "You are lonely?",                   jp: "さびしい？",                            outcome:"good",   next:"endWarm" },
              { en: "Then I will visit again.",           jp: "また あいに くる。",                    outcome:"good",   next:"endWarm" },
            ],
          },
          "endWarm": { en:"You make my screen happy. Come visit again.", jp:"きみ が がめん を しあわせ に する。 また きて。", mood:"happy" },
        },
      },
    ],
  },

};

// Per-word JP gloss table (for tap-to-translate). Far broader than
// the prior version — includes the high-frequency words across all
// dialogue. Words not in here just play audio without translation
// on tap.
window.WORD_GLOSS = {
  "i":"わたし","you":"あなた","he":"かれ","she":"かのじょ","it":"それ","we":"わたしたち","they":"かれら","me":"わたし","my":"わたしの","your":"あなたの","his":"かれの","her":"かのじょの",
  "am":"です","is":"です","are":"です","was":"でした","were":"でした","be":"いる","being":"いる",
  "a":"ひとつの","an":"ひとつの","the":"その","this":"これ","that":"あれ","these":"これら","those":"あれら",
  "hello":"やあ","hi":"やあ","hey":"おい","goodbye":"さよなら","bye":"バイ",
  "yes":"うん","no":"いや","ok":"わかった","please":"おねがい","thank":"ありがとう","thanks":"ありがとう","sorry":"ごめん",
  "and":"そして","but":"でも","or":"または","with":"〜と","of":"〜の","for":"〜のため",
  "very":"とても","too":"〜すぎる","also":"も","only":"だけ","just":"〜だけ","now":"いま","then":"そのとき","again":"また","still":"まだ","soon":"すぐ","later":"あとで","never":"けっして〜ない","always":"いつも","forever":"ずっと",
  "good":"よい","bad":"わるい","big":"おおきい","small":"ちいさい","tiny":"とても ちいさい","tall":"たかい","short":"みじかい","long":"ながい","fast":"はやい","slow":"おそい",
  "hot":"あつい","cold":"つめたい","warm":"あったかい","fresh":"あたらしい","old":"ふるい","young":"わかい","new":"あたらしい",
  "happy":"うれしい","sad":"かなしい","angry":"おこった","tired":"つかれた","brave":"ゆうかん な","kind":"やさしい","smart":"かしこい",
  "go":"いく","come":"くる","stop":"とまる","wait":"まつ","walk":"あるく","run":"はしる","jump":"とぶ","fly":"とぶ","swim":"およぐ","eat":"たべる","drink":"のむ","sleep":"ねる","cry":"なく","laugh":"わらう","sing":"うたう",
  "see":"みる","look":"みる","find":"みつける","want":"ほしい","need":"ひつよう","like":"すき","love":"だいすき","hate":"きらい","help":"たすける","give":"あげる","take":"とる","try":"ためす","make":"つくる","keep":"もつ","share":"わける","steal":"ぬすむ","return":"かえす",
  "have":"もつ","has":"もつ","had":"もっていた","do":"する","does":"する","did":"した","can":"できる","cannot":"できない","could":"できる","will":"〜する","would":"〜する",
  "where":"どこ","what":"なに","when":"いつ","who":"だれ","why":"なぜ","how":"どう","which":"どれ",
  "one":"1","two":"2","three":"3","four":"4","five":"5","six":"6","seven":"7","eight":"8","nine":"9","ten":"10","hundred":"100","thousand":"1000","money":"おかね","yen":"円","coin":"コイン",
  "leg":"あし","legs":"あし","arm":"うで","arms":"うで","eye":"め","eyes":"め","face":"かお","head":"あたま","mouth":"くち","nose":"はな","ear":"みみ","tail":"しっぽ","hand":"て","hands":"て","back":"せなか",
  "hat":"ぼうし","shoe":"くつ","shoes":"くつ","ribbon":"リボン","bag":"かばん","flag":"はた",
  "octopus":"たこ","fish":"さかな","camel":"ラクダ","monkey":"サル","robot":"ロボット","crocodile":"ワニ","bread":"パン","fluffy":"ふわふわ","soft":"やわらかい","cute":"かわいい","sweet":"あまい","salty":"しおからい","spicy":"からい","tasty":"おいしい","delicious":"おいしい",
  "pink":"ピンク","blue":"あおい","red":"あかい","brown":"ちゃいろ","green":"みどり","yellow":"きいろ","white":"しろい","black":"くろい",
  "takoyaki":"たこやき","sushi":"すし","parfait":"パフェ","cherry":"さくらんぼ","cream":"クリーム","strawberry":"いちご","ice cream":"アイス","candy":"キャンディ","milk":"ぎゅうにゅう","sugar":"さとう","tea":"おちゃ","water":"みず",
  "hump":"こぶ","humps":"こぶ","beard":"ひげ","dumpling":"ぎょうざ","dumplings":"ぎょうざ",
  "bomb":"ばくだん","smell":"におい","river":"かわ","claw":"クロー","emoji":"えもじ","prize":"けいひん",
  "opera":"オペラ","music":"おんがく","song":"うた","voice":"こえ","loud":"うるさい","quiet":"しずか",
  "hug":"ハグ","kiss":"キス","family":"かぞく","friend":"ともだち","friends":"ともだち","kid":"こども","child":"こども","children":"こども",
  "hero":"ヒーロー","monster":"カイジュウ","king":"おう",
  "throne":"おうざ","palace":"おしろ","home":"いえ","house":"いえ","school":"がっこう","shop":"みせ",
  "house":"いえ","world":"せかい","sky":"そら","sea":"うみ","desert":"さばく","mountain":"やま","street":"とおり",
  "stranger":"しらない ひと","mom":"ママ","dad":"パパ","grandma":"おばあちゃん","grandpa":"おじいちゃん","grandparents":"そふぼ","uncle":"おじさん",
  "japan":"にっぽん","italy":"イタリア","russia":"ロシア","mongolia":"モンゴル",
  "tomorrow":"あした","today":"きょう","yesterday":"きのう","night":"よる","morning":"あさ","evening":"よる",
  "rain":"あめ","snow":"ゆき","wind":"かぜ","sun":"たいよう","moon":"つき","star":"ほし","stars":"ほし",
  "scared":"こわい","fair":"こうへい","cool":"かっこいい","strange":"へん","weird":"へん","amazing":"すごい","beautiful":"きれい","beautiful":"うつくしい",
  "say":"いう","said":"いった","tell":"つたえる","ask":"きく","listen":"きく",
  "alone":"ひとり","lonely":"さびしい","together":"いっしょに","safe":"あんぜん","danger":"きけん","dangerous":"あぶない",
  "broke":"こわれた","broken":"こわれた","fix":"なおす","hurt":"いたい","ill":"びょうき","ok":"だいじょうぶ",
  "free":"タダ","expensive":"たかい","cheap":"やすい","money":"おかね","ten":"10","twenty":"20","thirty":"30",
  "secret":"ひみつ","story":"はなし","origin":"きげん","power":"ちから","magic":"まほう","time":"とき","year":"ねん","years":"ねん","day":"ひ","days":"ひ",
  "tap":"タップ","touch":"さわる","play":"あそぶ","try":"ためす","again":"また","next":"つぎ",
  "name":"なまえ","favorite":"おきにいり","both":"りょうほう","every":"すべての","all":"ぜんぶ","some":"いくつか","many":"おおい","none":"なし",
  "kindred":"こころの","spirit":"こころ","tradition":"でんとう","cousin":"いとこ","brother":"きょうだい","sister":"きょうだい",
  "from":"〜から","in":"〜の中","on":"〜の上","at":"〜で","to":"〜へ","by":"〜の そばに","under":"〜の下","above":"〜の上",
};
