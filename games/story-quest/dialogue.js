// Dialogue trees per kaiju. Each tree is a sequence of 3-4 turns.
//
// Each turn:
//   - kaiju: the line the kaiju says (with EN + JP)
//   - choices: array of { en, jp, outcome }
//     - outcome: "good" | "bad" | "neutral" — affects ending tag
//   - mood: "speak" (idle), "surprised", "angry"  — drives kaiju animation
//
// Final turn (no choices) is the wrap-up. The accumulated good/bad/
// neutral counts decide which ending banner shows.

window.STORY = {
  tako: {
    name: "タコタコ サフール",
    intro: "Osaka shopping street, night. The takoyaki octopus blocks the way.",
    turns: [
      {
        kaiju: { en: "Hey there! Are you hungry, friend?",
                 jp: "なあ あんた、 おなか すいてへんか〜？" },
        mood: "speak",
        choices: [
          { en: "Yes, very hungry!", jp: "うん、ぺこぺこ！", outcome: "good" },
          { en: "Hello, octopus.",    jp: "こんにちは、たこ。", outcome: "neutral" },
          { en: "I am not your friend.", jp: "ともだち じゃ ない！", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "Octo-perfect! Try my takoyaki! It is 99% takoyaki, 1% me!",
                 jp: "ええわ〜！ ワシ の たこ焼[や]き、 99% たこ焼[や]きで 1% ワシ や〜！" },
        mood: "surprised",
        choices: [
          { en: "Oh! That sounds delicious.",        jp: "おお！ おいしそう。", outcome: "good" },
          { en: "Wait. WHICH 1% is you?",            jp: "1% って どこ？！", outcome: "neutral" },
          { en: "No thank you.",                     jp: "けっこう です。", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "Smart kid. Have a free one. Friends?",
                 jp: "かしこい こ や な〜。 タダで あげる わ。 ともだち？" },
        mood: "speak",
        choices: [
          { en: "Yes, we are friends.",  jp: "うん、ともだち だ よ！", outcome: "good" },
          { en: "Maybe later.",          jp: "また こんど。",          outcome: "neutral" },
        ],
      },
    ],
  },

  unko: {
    name: "ボンバルディロ ウンコディロ",
    intro: "Brooklyn alley. A robot crocodile drops out of the sky with a metallic clang.",
    turns: [
      {
        kaiju: { en: "Ay you, kid! You see this bomb? Don't touch it.",
                 jp: "おい こども、 この ばくだん 見[み]ろ。 さわるな。" },
        mood: "angry",
        choices: [
          { en: "OK, I will not touch.",  jp: "わかった、 さわらない。", outcome: "good" },
          { en: "Why? What does it do?",  jp: "なんで？ なに する の？", outcome: "neutral" },
          { en: "I will touch it.",        jp: "さわる ！", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "Brooklyn baby. Smart kid. Now tell me, where is your homework?",
                 jp: "ブルックリン ベイビー。 かしこい！ で、 しゅくだい は どこ や ？" },
        mood: "speak",
        choices: [
          { en: "It is in my bag.",        jp: "カバン の なか。", outcome: "good" },
          { en: "I did not do it.",        jp: "やって ない。", outcome: "neutral" },
          { en: "You ate it last week!",   jp: "せんしゅう、 あんた が たべた でしょ！", outcome: "good" },
        ],
      },
      {
        kaiju: { en: "Fuhgeddaboudit. Hand it over. I am... hungry for homework.",
                 jp: "ふぁげっだぼうでぃっと。 よこせ。 しゅくだい たべたい。" },
        mood: "angry",
        choices: [
          { en: "No! It is my homework.",  jp: "だめ！ ワタシ の だ。", outcome: "good" },
          { en: "Here you go.",            jp: "はい、 どうぞ。", outcome: "bad" },
        ],
      },
    ],
  },

  tral: {
    name: "トラララ パクパク",
    intro: "Shibuya Crossing. An opera fish-frog hybrid descends in spotlights.",
    turns: [
      {
        kaiju: { en: "Mamma mia! What is your name, bambino?",
                 jp: "マンマ ミーア！ きみ の なまえ は？" },
        mood: "speak",
        choices: [
          { en: "My name is friend.",       jp: "なまえ は ともだち。", outcome: "good" },
          { en: "I do not speak Italian.",  jp: "イタリアご しゃべれない。", outcome: "neutral" },
        ],
      },
      {
        kaiju: { en: "Sing with me! Tralalero tralala~~~!",
                 jp: "いっしょに うたって！ トラララ〜！" },
        mood: "surprised",
        choices: [
          { en: "Tralalero tralala!",        jp: "トラララ〜！", outcome: "good" },
          { en: "I cannot sing.",            jp: "うたえない。", outcome: "neutral" },
          { en: "Stop the music!",           jp: "うた、 やめて！", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "BELLISSIMO! Now we are amici. Forever.",
                 jp: "ベリッシモ！ ワシら ともだち や、 ずっと。" },
        mood: "speak",
        choices: [
          { en: "Forever is a long time.",   jp: "ずっと は ながい よ。", outcome: "neutral" },
          { en: "Yes, forever amici.",       jp: "うん、 ずっと ともだち。", outcome: "good" },
        ],
      },
    ],
  },

  pamp: {
    name: "ブルブル パムパム",
    intro: "A pink fluffy palace. Display cases line the walls.",
    turns: [
      {
        kaiju: { en: "You are so fluffy! Come, sit with me, deshu!",
                 jp: "あんた ふわふわ〜！ いらっしゃい〜 でちゅ" },
        mood: "speak",
        choices: [
          { en: "Thank you.",                  jp: "ありがとう。", outcome: "neutral" },
          { en: "I am not fluffy. I am a kid.", jp: "ふわふわ じゃ ない、 にんげん だ よ。", outcome: "good" },
          { en: "OK. I will sit.",             jp: "うん、 すわる。", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "I collect children. Will you join my collection?",
                 jp: "あたち は こども を あつめる の でちゅ。 コレクション に なる？" },
        mood: "surprised",
        choices: [
          { en: "No! I want to go home.",      jp: "いや！ かえる！", outcome: "good" },
          { en: "Maybe just for a hug.",       jp: "ハグ だけ なら…", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "Hmph! Brave kid! Take this ribbon and run, deshu!",
                 jp: "ふん！ ゆうき ある のね でちゅ！ リボン あげる、 にげなさい でちゅ！" },
        mood: "speak",
        choices: [
          { en: "Thank you, fluffy one!",      jp: "ありがとう、 ふわふわ さん！", outcome: "good" },
        ],
      },
    ],
  },

  parfait: {
    name: "パフェ イワシ",
    intro: "Tsukiji fish market. Whipped cream falls from the sky like snow.",
    turns: [
      {
        kaiju: { en: "Bonjour, ohonhonhon! Would you like a parfait, mon enfant?",
                 jp: "ボンジュール ど！ パフェ いる かい ね？" },
        mood: "speak",
        choices: [
          { en: "Yes, please. With cherry.",   jp: "うん、 さくらんぼ つき で！", outcome: "good" },
          { en: "No fish in the parfait, please.", jp: "さかな ぬきで！", outcome: "neutral" },
          { en: "I prefer sushi.",             jp: "すし の ほうが すき。", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "Sushi?! Mon dieu! In my world, sushi IS parfait!",
                 jp: "すし か？！ なんと！ ワシの 世界[せかい] では すし が パフェ だ ど！" },
        mood: "surprised",
        choices: [
          { en: "That is... interesting.",     jp: "それは… おもしろい。", outcome: "neutral" },
          { en: "I like both!",                jp: "りょうほう すき！", outcome: "good" },
          { en: "That is wrong.",              jp: "それは ちがう。", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "Ohonhonhon, you are now SLIGHTLY less of a sardine. Au revoir!",
                 jp: "オホンホン、 あんた、 さかな に ちょっと ちかづいた ど。 さよなら！" },
        mood: "speak",
        choices: [
          { en: "Goodbye, fish-parfait.",      jp: "さよなら、 パフェ さかな。", outcome: "good" },
          { en: "I am not a sardine!",         jp: "イワシ じゃ ない！", outcome: "neutral" },
        ],
      },
    ],
  },

  anpan: {
    name: "アンパン マグロ",
    intro: "Anpanman Land theme park, dusk. A bread-tuna hybrid stands on a plinth.",
    turns: [
      {
        kaiju: { en: "I cannot help you. I am bread. Also fish. It is complicated.",
                 jp: "オレ は たすけられん。 パン だし、 さかな だし、 ふくざつ なんだ。" },
        mood: "speak",
        choices: [
          { en: "Can I have a bite?",          jp: "ひとくち もらえる？", outcome: "bad" },
          { en: "I understand.",               jp: "わかる。", outcome: "good" },
          { en: "Are you Anpanman's brother?", jp: "アンパンマン の おにいさん？", outcome: "neutral" },
        ],
      },
      {
        kaiju: { en: "Anpanman is my rival! I will be the new hero!",
                 jp: "アンパンマン は ライバル！ オレ が しん ヒーロー だ！" },
        mood: "angry",
        choices: [
          { en: "OK. Good luck, hero.",        jp: "ふぁいと、 ヒーロー！", outcome: "good" },
          { en: "Anpanman is better.",         jp: "アンパンマン の ほうが いい！", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "Hmph. Take this sushi-bun. Do not eat my face.",
                 jp: "ふん。 すしパン あげる。 オレ の かお たべるな。" },
        mood: "speak",
        choices: [
          { en: "Thank you. I will not eat your face.", jp: "ありがとう。 かお は たべない。", outcome: "good" },
        ],
      },
    ],
  },

  temee: {
    name: "ティメー サルマクチン",
    intro: "Gobi desert at golden hour. A camel-monkey with a tall hat blocks the dunes.",
    turns: [
      {
        kaiju: { en: "Greetings, little one. Where is your hump?",
                 jp: "やあ、 ちびっこ。 あんた の こぶ は どこ じゃ？" },
        mood: "speak",
        choices: [
          { en: "I do not have a hump.",       jp: "こぶ ない よ。", outcome: "neutral" },
          { en: "I am not a camel.",           jp: "ラクダ じゃ ない。", outcome: "good" },
          { en: "It fell off yesterday.",      jp: "きのう おちた…", outcome: "neutral" },
        ],
      },
      {
        kaiju: { en: "In my village... we ALL had humps. Three hundred years ago.",
                 jp: "わしの むら では… みんな こぶ あった のじゃ。 300年[ねん] まえ じゃ が。" },
        mood: "speak",
        choices: [
          { en: "That is a long time ago.",    jp: "むかし むかし だね。", outcome: "good" },
          { en: "Do you want a new hump?",     jp: "あたらしい こぶ いる？", outcome: "neutral" },
          { en: "Three hundred years is a lie.", jp: "300年 は うそ じゃ！", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "Take this buuz. Tell no one of the hump-times.",
                 jp: "ブーズ あげる。 こぶ じだい の はなし、 だれ にも いうな。" },
        mood: "speak",
        choices: [
          { en: "Thank you, old camel.",       jp: "ありがとう、 おじいさん ラクダ。", outcome: "good" },
        ],
      },
    ],
  },

  catcherski: {
    name: "キャッチャースキー クレーノフ",
    intro: "Akihabara back-alley arcade. A glowing UFO catcher with Russian graffiti.",
    turns: [
      {
        kaiju: { en: "Privet, child. Insert one hundred yen. PEEP.",
                 jp: "プリヴェット、 こども。 100円 いれろ。 ピッ。" },
        mood: "angry",
        choices: [
          { en: "I have no money.",            jp: "おかね ない。", outcome: "neutral" },
          { en: "No. The claw is rigged.",     jp: "イヤ。 クロー ずるい だろ！", outcome: "good" },
          { en: "Here is one hundred yen.",    jp: "100円、 はい。", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "I have STOLEN your answer. It was correct. I am returning it. BEEP.",
                 jp: "あんた の こたえ、 ぬすんだ。 せいかい だった。 かえす。 BIP。" },
        mood: "surprised",
        choices: [
          { en: "Thank you for returning it.", jp: "ありがとう、 かえして くれて。", outcome: "good" },
          { en: "Why did you steal it?",       jp: "なんで ぬすんだ？", outcome: "neutral" },
          { en: "You are a bad robot.",        jp: "わるい ロボット！", outcome: "bad" },
        ],
      },
      {
        kaiju: { en: "Take this emoji. Do not tell the hackers. BEEP.",
                 jp: "エモジ あげる。 ハッカー に いうな。 BIP。" },
        mood: "speak",
        choices: [
          { en: "OK. Secret emoji.",           jp: "わかった。 ひみつ。", outcome: "good" },
        ],
      },
    ],
  },
};
