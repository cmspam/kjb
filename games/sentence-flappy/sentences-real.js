// Practical-English sentence pool — daily-life topics in each kaiju's
// voice. Sits alongside sentences-extra.js so kids hear both absurd
// in-character sentences AND real conversational English they can use
// at school. ~80 sentences total, ~10 per kaiju.

(function () {
  const REAL = {
    tako: {
      0: [
        { en:"open",      jp:"あく / あける" },
        { en:"please",    jp:"おねがい" },
      ],
      1: [
        { en:"I open my shop at six.",            jp:"6じ に みせ を ひらく。" },
        { en:"How much is one takoyaki?",          jp:"たこやき 1こ いくら？" },
        { en:"Please come again tomorrow.",        jp:"あした また きて ください。" },
      ],
      2: [
        { en:"Please pay first, then I cook the takoyaki for you.",  jp:"さき に はらって ください、 それから たこやき を つくる。" },
        { en:"My shop is closed on Monday because I clean the pan.", jp:"げつようび は みせ は しまって いる、 フライパン を そうじ する から。" },
      ],
    },
    unko: {
      0: [
        { en:"stop",      jp:"とまる / とめる" },
        { en:"danger",    jp:"きけん" },
      ],
      1: [
        { en:"Please do not run by the river.",   jp:"かわ の そば で はしらないで。" },
        { en:"This area is not safe.",             jp:"この ばしょ は あんぜん じゃない。" },
        { en:"Stop before the bridge.",            jp:"はし の まえ で とまれ。" },
      ],
      2: [
        { en:"If you smell something bad, walk away slowly.",       jp:"へん な におい が したら、 ゆっくり はなれる。" },
        { en:"Always tell an adult when you find something brown.", jp:"ちゃいろい もの を みつけたら いつも おとな に いう。" },
      ],
    },
    tral: {
      0: [
        { en:"hello",     jp:"こんにちは" },
        { en:"thank you", jp:"ありがとう" },
      ],
      1: [
        { en:"Hello, how are you today?",         jp:"こんにちは、 きょう は げんき？" },
        { en:"My name is Tralalero.",              jp:"わたし の なまえ は トラララ。" },
        { en:"Nice to meet you.",                   jp:"はじめまして。" },
      ],
      2: [
        { en:"In Italy, we always greet our neighbors loudly in the morning.", jp:"イタリア で は あさ に となり ひと に おおきく あいさつ する。" },
        { en:"Thank you for listening to my opera, please come again.",        jp:"ぼく の オペラ を きいて くれて ありがとう、 また きて。" },
      ],
    },
    pamp: {
      0: [
        { en:"happy",     jp:"うれしい" },
        { en:"sorry",     jp:"ごめん" },
      ],
      1: [
        { en:"I am happy to see you.",            jp:"あなた に あえて うれしい。" },
        { en:"Sorry, I did not hear you.",         jp:"ごめん、 きこえなかった。" },
        { en:"Can we be friends?",                  jp:"ともだち に なれる？" },
      ],
      2: [
        { en:"Sharing a hug is the easiest way to say sorry to a soft friend.", jp:"ハグ を シェア する の は やわらかい ともだち に あやまる いちばん の ほうほう。" },
        { en:"I want to make a new friend at school tomorrow.",                  jp:"あした がっこう で あたらしい ともだち を つくる。" },
      ],
    },
    parfait: {
      0: [
        { en:"sweet",     jp:"あまい" },
        { en:"cold",      jp:"つめたい" },
      ],
      1: [
        { en:"I want a sweet cold drink.",        jp:"あまい つめたい のみもの が ほしい。" },
        { en:"Can you sing me a song?",            jp:"うた を うたって くれる？" },
        { en:"The cafe opens at noon.",             jp:"カフェ は おひる に ひらく。" },
      ],
      2: [
        { en:"Grandparents tell the best songs because they remember the old ones.", jp:"そふぼ は ふるい うた を おぼえている から、 いちばん の うた を しっている。" },
        { en:"On hot days I prefer ice cream, but tea is better when I am sad.",     jp:"あつい ひ は アイス、 でも かなしい ひ は おちゃ の ほうが いい。" },
      ],
    },
    anpan: {
      0: [
        { en:"food",      jp:"たべもの" },
        { en:"morning",   jp:"あさ" },
      ],
      1: [
        { en:"Good morning, the bread is fresh.", jp:"おはよう、 パン は あたらしい。" },
        { en:"I like food more than fish.",        jp:"ぼく は さかな より たべもの が すき。" },
        { en:"Please wash your hands first.",       jp:"まず て を あらって。" },
      ],
      2: [
        { en:"A hero must eat breakfast or the day will be slow and crumbly.",  jp:"ヒーロー は あさごはん を たべないと いちにち は おそく ぼろぼろ。" },
        { en:"Always say thank you to the person who made your food.",          jp:"たべもの を つくった ひと に いつも ありがとう。" },
      ],
    },
    temee: {
      0: [
        { en:"family",    jp:"かぞく" },
        { en:"tired",     jp:"つかれた" },
      ],
      1: [
        { en:"I miss my family in Mongolia.",     jp:"モンゴル の かぞく が こいしい。" },
        { en:"I am tired but happy.",               jp:"つかれた、 でも うれしい。" },
        { en:"Sit down, friend, the sun is hot.",   jp:"すわって、 ともだち、 たいよう は あつい。" },
      ],
      2: [
        { en:"Camels walk slowly because hurry is for things that do not matter.", jp:"ラクダ は ゆっくり あるく、 いそぎ は たいせつ じゃない こと の ため。" },
        { en:"In the steppe, we share food with everyone who arrives at sunset.",   jp:"ステップ で は、 ゆうやけ に きた すべて の ひと と たべもの を わける。" },
      ],
    },
    catcherski: {
      0: [
        { en:"yes",       jp:"はい" },
        { en:"no",        jp:"いいえ" },
      ],
      1: [
        { en:"Yes, you can play.",                jp:"はい、 あそんで いい。" },
        { en:"No, please do not hit me.",           jp:"いいえ、 たたかないで ください。" },
        { en:"This game costs one hundred yen.",    jp:"この ゲーム は 100円。" },
      ],
      2: [
        { en:"Yes and no are the two answers I have always known how to give.", jp:"『はい』 と 『いいえ』 は ぼく が ずっと しっている 2つ の こたえ。" },
        { en:"Please be gentle with broken machines, we feel things sometimes.", jp:"こわれた きかい に やさしく、 ときどき なにか を かんじる から。" },
      ],
    },
  };

  if (window.SENTENCES) {
    Object.keys(REAL).forEach(kid => {
      if (!window.SENTENCES[kid]) return;
      Object.keys(REAL[kid]).forEach(lv => {
        const dst = window.SENTENCES[kid][lv];
        if (!Array.isArray(dst)) return;
        REAL[kid][lv].forEach(s => dst.push(s));
      });
    });
  }
})();
