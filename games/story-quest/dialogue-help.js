// Help-me conversations — one per kaiju.
//
// Each kaiju asks the kid for help with something concrete. The kid's
// choices branch toward different outcomes — full help, partial help,
// refusal, or comedic disaster. Compared to the meet + backstory
// conversations, these put the kid in active protagonist mode: they
// have to think about HOW to help, not just LISTEN.

(function () {
  const HELP = [

    // TAKO — find the lost apron
    ["tako", {
      id: "help-apron",
      title: "The Lost Apron",
      intro: "Tako is shirtless. (Apron-less.) He is whisking the air with one tentacle and crying.",
      scene: "tako-osaka-stall",
      start: "n1",
      nodes: {
        "n1": {
          en: "My apron is gone! No apron, no takoyaki. It is the rule.",
          jp: "エプロン が ない！ エプロン なし、 たこやき なし。 ルール。",
          mood: "sad",
          choices: [
            { en: "Where did you see it last?",   jp: "さいご に みた の は どこ？",   outcome:"good",    next:"n2" },
            { en: "Can you wear another one?",    jp: "べつ の つかえる？",            outcome:"neutral", next:"n2alt" },
            { en: "Just cook without it.",         jp: "なくても つくれる。",            outcome:"bad",     next:"n2rude" },
          ],
        },
        "n2": {
          en: "On a chair by the deep sea. Maybe a fish wears it now.",
          jp: "ふかい うみ の そば の いす に。 たぶん いま は さかな が きて いる。",
          mood: "wise",
          scene: "tako-deep-sea",
          choices: [
            { en: "I will check the deep sea.",   jp: "ふかい うみ を みる。",          outcome:"good",    next:"n3sea" },
            { en: "Which chair?",                  jp: "どの いす？",                     outcome:"good",    next:"n3chair" },
            { en: "Fish do not wear aprons.",      jp: "さかな は エプロン を きない。", outcome:"neutral", next:"n3sea" },
          ],
        },
        "n2alt": {
          en: "Hmm. I have only one. My mother sewed it.",
          jp: "うーん。 1まい しか ない。 はは が ぬった。",
          mood: "sad",
          choices: [
            { en: "Then we must find it.",         jp: "じゃあ さがそう。",               outcome:"good",    next:"n3sea" },
            { en: "Use a towel for now.",          jp: "とりあえず タオル を つかえ。",  outcome:"neutral", next:"n3towel" },
          ],
        },
        "n2rude": {
          en: "Without the apron, the takoyaki tastes wrong. Even small fish know.",
          jp: "エプロン が なければ たこやき の あじ が ちがう。 ちいさい さかな で も わかる。",
          mood: "angry",
          choices: [
            { en: "OK, let us find it.",           jp: "わかった、 さがそう。",          outcome:"good",    next:"n2" },
            { en: "I do not care.",                jp: "どうでも いい。",                outcome:"bad",     next:"endCool" },
          ],
        },
        "n3sea": {
          en: "Be careful. The currents are slow but the kelp is bossy.",
          jp: "きを つけて。 ながれ は おそい けど こんぶ は えらそう。",
          mood: "wise",
          choices: [
            { en: "Bossy kelp. Noted.",            jp: "えらそう な こんぶ。 メモ。",   outcome:"good",    next:"n4" },
            { en: "I am not scared.",               jp: "こわく ない。",                   outcome:"good",    next:"n4" },
            { en: "How do I breathe?",              jp: "どうやって いき する？",         outcome:"good",    next:"n4how" },
          ],
        },
        "n3chair": {
          en: "The yellow one. With seven barnacles. The eighth fell off in a storm.",
          jp: "きいろい いす。 フジツボ 7こ。 8こめ は あらし で とれた。",
          mood: "happy",
          choices: [
            { en: "Seven barnacles, got it.",      jp: "フジツボ 7こ、 OK。",            outcome:"good",    next:"n3sea" },
          ],
        },
        "n3towel": {
          en: "A towel? I am not a swimmer. Apron is heritage.",
          jp: "タオル？ ぼく は スイマー じゃない。 エプロン は でんとう。",
          mood: "sad",
          choices: [
            { en: "Sorry. Let us find the real one.", jp: "ごめん。 ほんもの を さがそう。", outcome:"good", next:"n3sea" },
          ],
        },
        "n4": {
          en: "When you see a green eye, swim left. When you see a blue eye, swim right.",
          jp: "みどり の め を みたら ひだり に およぐ。 あおい め を みたら みぎ。",
          mood: "wise",
          choices: [
            { en: "Green left, blue right.",        jp: "みどり ひだり、 あおい みぎ。", outcome:"good",    next:"n5" },
            { en: "What about pink eyes?",          jp: "ピンク の め は？",              outcome:"good",    next:"n4pink" },
          ],
        },
        "n4how": {
          en: "Hold the apron over your face like a small hello tent.",
          jp: "エプロン を かお に かぶる、 ちいさい あいさつ テント の よう に。",
          mood: "happy",
          choices: [
            { en: "But I do not have the apron yet.", jp: "でも まだ エプロン は ない。", outcome:"good",    next:"n4tent" },
          ],
        },
        "n4tent": {
          en: "Then a kelp tent. Kelp is bossy but useful.",
          jp: "じゃあ こんぶ テント。 えらそう だけど やくだつ。",
          mood: "happy",
          choices: [
            { en: "Kelp tent it is.",                jp: "こんぶ テント で。",              outcome:"good",    next:"n4" },
          ],
        },
        "n4pink": {
          en: "Pink eyes mean a brother. Wave. Do not swim left or right.",
          jp: "ピンク の め は きょうだい。 て を ふって。 ひだり みぎ どちら も だめ。",
          mood: "happy",
          choices: [
            { en: "Wave at pink eyes.",              jp: "ピンク の め に て を ふる。",   outcome:"good",    next:"n4" },
          ],
        },
        "n5": {
          en: "You will find the chair. The apron is folded. Bring it back.",
          jp: "いす を みつける。 エプロン は たたまれて いる。 もって きて。",
          mood: "happy",
          choices: [
            { en: "I have it! Here.",                jp: "とった！ はい。",                  outcome:"good",    next:"endWarm" },
            { en: "I lost the chair instead.",        jp: "いす を なくした。",              outcome:"neutral", next:"endNeutral" },
            { en: "A fish stole it from me.",         jp: "さかな に とられた。",            outcome:"neutral", next:"n5fish" },
          ],
        },
        "n5fish": {
          en: "Some fish are bullies. Tell the fish: Tako needs his apron.",
          jp: "いじわる な さかな も いる。 さかな に いって：『タコ に エプロン が ひつよう。』",
          mood: "wise",
          choices: [
            { en: "The fish gave it back!",           jp: "さかな が かえして くれた！",     outcome:"good",    next:"endWarm" },
            { en: "The fish ate it.",                  jp: "さかな が たべた。",              outcome:"neutral", next:"endNeutral" },
          ],
        },
        "endWarm":    { en:"Look at this! I am a chef again. Free takoyaki forever for you.", jp:"みて！ ぼく は また シェフ。 きみ に は ずっと タダ の たこやき。", mood:"happy" },
        "endNeutral": { en:"That is OK. I will sew a new one with kelp. Slowly.",              jp:"だいじょうぶ。 こんぶ で あたらしい の を ぬう。 ゆっくり。",        mood:"wise" },
        "endCool":    { en:"Then no takoyaki for you. Goodbye.",                                jp:"じゃあ きみ に たこやき は ない。 さよなら。",                          mood:"angry" },
      },
    }],

    // UNKO — plant a clean fern
    ["unko", {
      id: "help-fern",
      title: "A Clean Fern",
      intro: "Unkodilo holds a small green plant in a metal claw. The plant looks scared.",
      scene: "unko-swamp-empire",
      start: "n1",
      nodes: {
        "n1": {
          en: "I want to plant this clean fern. To prove I am brave.",
          jp: "この きれい な シダ を うえたい。 ぼく が ゆうかん だ と しょうめい する。",
          mood: "scared",
          choices: [
            { en: "OK, let us plant it.",              jp: "わかった、 うえよう。",          outcome:"good",    next:"n2" },
            { en: "A fern? In a swamp?",                jp: "シダ？ しっち に？",              outcome:"good",    next:"n2why" },
            { en: "It will die.",                        jp: "しぬ よ。",                       outcome:"bad",     next:"n2dark" },
          ],
        },
        "n2": {
          en: "Dig a small hole. Not too deep. Brown is OK around the roots.",
          jp: "ちいさい あな を ほる。 ふか すぎない。 ね の まわり は ちゃいろ で だいじょうぶ。",
          mood: "wise",
          choices: [
            { en: "I dig a small hole.",                jp: "ちいさい あな を ほる。",        outcome:"good",    next:"n3" },
            { en: "How deep is small?",                  jp: "ちいさい って どの くらい？",    outcome:"good",    next:"n3how" },
          ],
        },
        "n2why": {
          en: "Because clean things scared me away once. I need to face them.",
          jp: "むかし、 きれい な もの が ぼく を おいだした。 むきあわなきゃ。",
          mood: "wise",
          choices: [
            { en: "Brave choice.",                       jp: "ゆうかん。",                       outcome:"good",    next:"n2" },
            { en: "Or just stay brown.",                  jp: "ちゃいろ の まま で いい。",     outcome:"neutral", next:"n2" },
          ],
        },
        "n2dark": {
          en: "Maybe. But trying matters more than living.",
          jp: "かも。 でも しぬ より、 やる こと が だいじ。",
          mood: "wise",
          choices: [
            { en: "OK, I am sorry. Let us try.",        jp: "ごめん。 やろう。",                outcome:"good",    next:"n2" },
            { en: "I still think it will die.",          jp: "やっぱり しぬ。",                  outcome:"bad",     next:"endCool" },
          ],
        },
        "n3": {
          en: "Now place the fern. Whisper a kind word. Plants hear.",
          jp: "シダ を いれて。 やさしい ことば を ささやく。 しょくぶつ は きく。",
          mood: "happy",
          choices: [
            { en: "Hello, little fern.",                 jp: "やあ、 ちいさい シダ。",          outcome:"good",    next:"n4" },
            { en: "Be strong, fern.",                     jp: "つよく いき なさい、 シダ。",   outcome:"good",    next:"n4" },
            { en: "Do not die.",                          jp: "しぬな。",                         outcome:"neutral", next:"n4neg" },
          ],
        },
        "n3how": {
          en: "Two fingers deep. Three is too deep for a fern.",
          jp: "ゆび 2本 の ふかさ。 3本 は シダ に は ふか すぎ。",
          mood: "wise",
          choices: [
            { en: "Two fingers.",                         jp: "ゆび 2本。",                       outcome:"good",    next:"n3" },
          ],
        },
        "n4": {
          en: "Good. Now cover the roots. Soft hands. Even brown hands.",
          jp: "いい。 ね を おおう。 やさしい て で。 ちゃいろ の て でも。",
          mood: "happy",
          choices: [
            { en: "Covered, gently.",                     jp: "やさしく おおった。",             outcome:"good",    next:"n5" },
          ],
        },
        "n4neg": {
          en: "Hmm. Plants prefer warm words. Try again.",
          jp: "うーん。 しょくぶつ は あったかい ことば が すき。 もう いちど。",
          mood: "wise",
          choices: [
            { en: "Live, little fern.",                   jp: "いきて、 ちいさい シダ。",       outcome:"good",    next:"n4" },
          ],
        },
        "n5": {
          en: "Now we wait. If it grows, I am brave. If not, we plant another.",
          jp: "まつ。 そだてば、 ぼく は ゆうかん。 そだたなければ、 また うえる。",
          mood: "proud",
          choices: [
            { en: "Either way, you are brave.",           jp: "どっち でも、 ゆうかん。",       outcome:"good",    next:"endWarm" },
            { en: "I will visit it every week.",          jp: "まいしゅう みに くる。",          outcome:"good",    next:"endWarm" },
            { en: "Plant a hundred ferns.",                jp: "100ぼん の シダ を うえる。",   outcome:"good",    next:"endWarm" },
          ],
        },
        "endWarm":    { en:"Maybe a brown king can also grow green things. Thank you, kid.", jp:"ちゃいろ の おう も みどり の もの を そだてられる かも。 ありがとう、 こども。", mood:"happy" },
        "endCool":    { en:"Then the fern stays in the metal claw. Goodbye.",                  jp:"じゃあ シダ は きんぞく の クロー の なか。 さよなら。",                          mood:"sad" },
      },
    }],

    // TRAL — translate a letter from Sicily
    ["tral", {
      id: "help-letter",
      title: "A Letter From Home",
      intro: "Tralalero opens a thin paper letter with shaking fingers. He cannot read the last paragraph.",
      scene: "tral-fish-market",
      start: "n1",
      nodes: {
        "n1": {
          en: "A letter from Sicily. My eyes are bad now. Please read the last part.",
          jp: "シチリア から の てがみ。 め が もう だめ。 さいご の ぶぶん を よんで。",
          mood: "wise",
          choices: [
            { en: "I will read it.",                  jp: "よむ よ。",                       outcome:"good",    next:"n2" },
            { en: "It might be sad.",                 jp: "かなしい かも。",                 outcome:"neutral", next:"n2soft" },
            { en: "I do not want to read it.",        jp: "よみたく ない。",                outcome:"bad",     next:"endCool" },
          ],
        },
        "n2": {
          en: "Thank you. The first sentence is in Italian. Do your best.",
          jp: "ありがとう。 さいしょ の ぶん は イタリアご。 がんばって。",
          mood: "happy",
          scene: "tral-opera-house",
          choices: [
            { en: "Caro figlio... dear son?",         jp: "Caro figlio…『あい する むすこ』？", outcome:"good", next:"n3" },
            { en: "I cannot read Italian.",            jp: "イタリアご よめない。",          outcome:"neutral", next:"n3help" },
          ],
        },
        "n2soft": {
          en: "Sad is fine. Sad letters are still letters.",
          jp: "かなしい は いい。 かなしい てがみ も てがみ。",
          mood: "wise",
          choices: [
            { en: "Then I will read it carefully.",    jp: "じゃあ、 ていねい に よむ。",     outcome:"good",    next:"n2" },
          ],
        },
        "n3": {
          en: "Yes. Dear son. Now the next line.",
          jp: "うん。 あい する むすこ。 つぎ の ぎょう を。",
          mood: "proud",
          choices: [
            { en: "Vieni a casa... come home?",       jp: "Vieni a casa…『いえ に かえって』？", outcome:"good", next:"n4" },
            { en: "Skip ahead, it is too long.",       jp: "とばす、 ながい。",              outcome:"neutral", next:"n4skip" },
          ],
        },
        "n3help": {
          en: "OK. I will tell you. The big word means 'come'. The small word means 'home'.",
          jp: "わかった。 おしえる。 おおきい ことば は『くる』。 ちいさい ことば は『いえ』。",
          mood: "wise",
          choices: [
            { en: "So... come home?",                  jp: "じゃあ…『いえ に かえって』？",  outcome:"good",    next:"n4" },
          ],
        },
        "n4": {
          en: "Yes. Come home. ...She says my old room is waiting.",
          jp: "うん。 いえ に かえって。 …ぼく の むかし の へや が まって いる、 と。",
          mood: "sad",
          choices: [
            { en: "Will you go?",                       jp: "いく？",                          outcome:"good",    next:"n5" },
            { en: "You have a home here too.",         jp: "ここ に も いえ が ある。",      outcome:"good",    next:"n5stay" },
            { en: "Italy is far.",                      jp: "イタリア は とおい。",            outcome:"neutral", next:"n5" },
          ],
        },
        "n4skip": {
          en: "I can not skip my mother's words. Please.",
          jp: "はは の ことば を とばせない。 おねがい。",
          mood: "sad",
          choices: [
            { en: "Sorry. I will keep reading.",       jp: "ごめん。 つづける。",            outcome:"good",    next:"n3" },
          ],
        },
        "n5": {
          en: "Maybe one day. For now, I sing for kids. That is also home.",
          jp: "いつか。 いま は こども の ため に うたう。 それ も いえ。",
          mood: "wise",
          choices: [
            { en: "Sing for me before you go.",        jp: "いく まえ に うたって。",        outcome:"good",    next:"endWarm" },
            { en: "Write back to her tonight.",         jp: "こんや へんじ を かいて。",      outcome:"good",    next:"endWarm" },
            { en: "I will write the reply for you.",    jp: "へんじ を かわり に かく。",     outcome:"good",    next:"endWarm" },
          ],
        },
        "n5stay": {
          en: "You are kind. Two homes is better than one.",
          jp: "やさしい ね。 いえ ふたつ は ひとつ より いい。",
          mood: "happy",
          choices: [
            { en: "Two homes, one heart.",              jp: "いえ ふたつ、 こころ ひとつ。",  outcome:"good",    next:"endWarm" },
          ],
        },
        "endWarm":    { en:"Bellissimo translator. You are a small bridge.",                jp:"ベリッシモ ほんやくか。 きみ は ちいさい はし。",         mood:"happy" },
        "endCool":    { en:"Then I will fold the letter and sing instead. Goodbye.",        jp:"じゃあ てがみ を たたんで うたう。 さよなら。",            mood:"sad" },
      },
    }],

    // PAMP — choose a new ribbon color
    ["pamp", {
      id: "help-ribbon",
      title: "Which Ribbon?",
      intro: "Pampamu holds up three ribbons: pink, blue, and yellow. She wants you to choose.",
      scene: "pamp-toy-shop",
      start: "n1",
      nodes: {
        "n1": {
          en: "Which ribbon should I wear today? You decide.",
          jp: "きょう は どの リボン？ きみ が きめて。",
          mood: "happy",
          choices: [
            { en: "Pink, of course.",                jp: "もちろん ピンク。",                outcome:"good",    next:"n2pink" },
            { en: "Blue is cool.",                    jp: "あおい は かっこいい。",          outcome:"good",    next:"n2blue" },
            { en: "Yellow is happy.",                 jp: "きいろ は うれしい。",            outcome:"good",    next:"n2yellow" },
            { en: "Wear all three.",                  jp: "ぜんぶ つけて。",                  outcome:"neutral", next:"n2all" },
          ],
        },
        "n2pink": {
          en: "Pink, my classic color. Safe and soft.",
          jp: "ピンク、 ぼく の クラシック な いろ。 あんぜん で やわらかい。",
          mood: "happy",
          choices: [
            { en: "Soft is best for hugs.",          jp: "やわらかい は ハグ に いちばん。", outcome:"good",  next:"n3" },
            { en: "Try a brave color tomorrow.",      jp: "あした は ゆうかん な いろ。",   outcome:"good",  next:"n3" },
          ],
        },
        "n2blue": {
          en: "Blue! I have never worn blue. My factory only made pink.",
          jp: "あおい！ あおい は きた こと ない。 ファクトリー は ピンク しか つくらない。",
          mood: "scared",
          choices: [
            { en: "Then today is your first time.",   jp: "じゃあ きょう が はじめて。",     outcome:"good",   next:"n3blue" },
            { en: "Pink is safer.",                    jp: "ピンク の ほうが あんぜん。",    outcome:"neutral", next:"n2pink" },
          ],
        },
        "n2yellow": {
          en: "Yellow! Like a small sun on my chest. I will try!",
          jp: "きいろ！ むね に ちいさい たいよう。 やる！",
          mood: "happy",
          choices: [
            { en: "Yellow looks great on you.",       jp: "きいろ、 にあう。",               outcome:"good",   next:"n3" },
            { en: "Sun-plushy! New hero.",            jp: "たいよう ぬいぐるみ！ あたらしい ヒーロー。", outcome:"good", next:"n3" },
          ],
        },
        "n2all": {
          en: "All three? I will look like a rainbow accident.",
          jp: "ぜんぶ？ にじ の じこ みたい に なる。",
          mood: "confused",
          choices: [
            { en: "Rainbow accidents are art.",       jp: "にじ の じこ は アート。",       outcome:"good",   next:"n3" },
            { en: "OK, just two then.",                jp: "じゃあ 2つ。",                    outcome:"neutral", next:"n2" },
          ],
        },
        "n3blue": {
          en: "I feel different. Bigger. ...Maybe braver.",
          jp: "なんか ちがう きもち。 おおきく かんじる。 …ゆうかん かも。",
          mood: "proud",
          choices: [
            { en: "Color can change you a little.",   jp: "いろ は すこし きみ を かえる。", outcome:"good",   next:"endWarm" },
            { en: "You were always brave.",            jp: "いつも ゆうかん だった。",       outcome:"good",   next:"endWarm" },
          ],
        },
        "n3": {
          en: "OK! Tied tight. Now the shop feels new.",
          jp: "よし！ きつく むすんだ。 みせ が あたらしく かんじる。",
          mood: "happy",
          choices: [
            { en: "Same plushy, new color.",          jp: "おなじ ぬいぐるみ、 あたらしい いろ。", outcome:"good", next:"endWarm" },
            { en: "Show me a hug to test it.",         jp: "ハグ で テスト して。",          outcome:"good",   next:"endWarm" },
          ],
        },
        "endWarm":    { en:"Thank you. Choosing for me is a kind of hug.", jp:"ありがとう。 ぼく の ため に えらぶ の は ハグ の よう。", mood:"happy" },
      },
    }],

    // PARFAIT — find the perfect cherry
    ["parfait", {
      id: "help-cherry",
      title: "The Perfect Cherry",
      intro: "Parfait Iwashi spins her glass slowly. The cherry on top is fine, but tomorrow she needs one perfect cherry.",
      scene: "parfait-underwater-cafe",
      start: "n1",
      nodes: {
        "n1": {
          en: "Tomorrow is the cafe's anniversary. I need one perfect cherry.",
          jp: "あした は カフェ の きねんび。 かんぺき な さくらんぼ が 1つ いる。",
          mood: "wise",
          choices: [
            { en: "Where do we look?",               jp: "どこ で さがす？",                outcome:"good",    next:"n2" },
            { en: "Use any red ball.",                jp: "あかい たま で いい。",          outcome:"bad",     next:"n2bad" },
            { en: "I will help. Tell me more.",      jp: "てつだう。 もっと おしえて。",   outcome:"good",    next:"n2" },
          ],
        },
        "n2": {
          en: "Three places. The Ice Cave. The Cherry Tree. The Lost Lunchbox.",
          jp: "3つ の ばしょ。 アイス どうくつ。 さくら の き。 なくした お べんとう。",
          mood: "happy",
          scene: "parfait-ice-cave",
          choices: [
            { en: "Ice Cave first.",                  jp: "まず アイス どうくつ。",          outcome:"good",    next:"n3ice" },
            { en: "Cherry Tree first.",                jp: "まず さくら の き。",            outcome:"good",    next:"n3tree" },
            { en: "Lost Lunchbox first.",              jp: "まず なくした おべんとう。",     outcome:"good",    next:"n3lunch" },
          ],
        },
        "n2bad": {
          en: "A red ball is not a cherry. The cafe will know.",
          jp: "あかい たま は さくらんぼ じゃない。 カフェ に わかる。",
          mood: "angry",
          choices: [
            { en: "OK, let us look properly.",       jp: "ちゃんと さがそう。",             outcome:"good",    next:"n2" },
          ],
        },
        "n3ice": {
          en: "The cave is cold. The cherry there is frozen but eternal.",
          jp: "どうくつ は さむい。 そこ の さくらんぼ は こおって いる が えいえん。",
          mood: "wise",
          choices: [
            { en: "I will bring the frozen one.",     jp: "こおった の を もって くる。",   outcome:"good",    next:"n4ice" },
            { en: "Too cold. Try another place.",     jp: "さむ すぎ。 べつ の ところ。",   outcome:"neutral", next:"n2" },
          ],
        },
        "n3tree": {
          en: "The tree drops cherries only after a child laughs at it.",
          jp: "き は こども が わらった あと だけ さくらんぼ を おとす。",
          mood: "happy",
          choices: [
            { en: "I can laugh at a tree.",          jp: "き を みて わらえる。",          outcome:"good",    next:"n4tree" },
            { en: "I will tell it a small joke.",     jp: "ちいさい じょうだん を いう。",  outcome:"good",    next:"n4tree" },
          ],
        },
        "n3lunch": {
          en: "An old lunchbox. The cherry inside is shy. You must invite it.",
          jp: "ふるい お べんとう。 なか の さくらんぼ は はずかしがり。 さそって。",
          mood: "wise",
          choices: [
            { en: "Hello, shy cherry.",               jp: "やあ、 はずかしい さくらんぼ。", outcome:"good",    next:"n4lunch" },
            { en: "Will it come out?",                jp: "でて くる？",                     outcome:"good",    next:"n4lunch" },
          ],
        },
        "n4ice": {
          en: "Frozen eternal cherry. Perfect for a cafe that remembers.",
          jp: "こおった えいえん の さくらんぼ。 おぼえる カフェ に ぴったり。",
          mood: "proud",
          choices: [
            { en: "Tomorrow will be beautiful.",      jp: "あした は うつくしい。",          outcome:"good",    next:"endWarm" },
          ],
        },
        "n4tree": {
          en: "Hehehe! Did you hear that? The cherry is rolling out now.",
          jp: "へへへ！ きこえた？ さくらんぼ が ころがって くる。",
          mood: "happy",
          choices: [
            { en: "Got it! Perfectly red.",           jp: "ゲット！ かんぺき に あかい。",  outcome:"good",    next:"endWarm" },
          ],
        },
        "n4lunch": {
          en: "Slowly... the cherry climbs out. It needs a soft voice.",
          jp: "ゆっくり… さくらんぼ が でて くる。 やわらかい こえ が ひつよう。",
          mood: "happy",
          choices: [
            { en: "Soft voice forever.",              jp: "ずっと やわらかい こえ。",       outcome:"good",    next:"endWarm" },
          ],
        },
        "endWarm":    { en:"Anniversary saved. Sweet little sardine swam home.", jp:"きねんび、 まもれた。 あまい ちいさい いわし が いえ に かえった。", mood:"happy" },
      },
    }],

    // ANPAN — open the bakery
    ["anpan", {
      id: "help-open",
      title: "Opening The Bakery",
      intro: "Anpan stands at the locked bakery door with a list of opening tasks.",
      scene: "anpan-bakery",
      start: "n1",
      nodes: {
        "n1": {
          en: "Five jobs before we open. Help me choose the order.",
          jp: "ひらく まえ に 5つ。 じゅんばん を きめて。",
          mood: "happy",
          choices: [
            { en: "Bake bread first.",               jp: "まず パン を やく。",             outcome:"good",    next:"n2bake" },
            { en: "Sweep the floor first.",          jp: "まず ゆか を そうじ。",          outcome:"good",    next:"n2sweep" },
            { en: "Make a list?",                     jp: "リスト つくる？",                outcome:"neutral", next:"n2list" },
          ],
        },
        "n2bake": {
          en: "Bake first is brave. Bread needs forty minutes.",
          jp: "やく が さき は ゆうかん。 パン は 40ぷん。",
          mood: "proud",
          choices: [
            { en: "Sweep while bread bakes.",        jp: "やく あいだ に そうじ。",         outcome:"good",    next:"n3" },
            { en: "Open the window for steam.",       jp: "じょうき の ため に まど を あける。", outcome:"good", next:"n3" },
          ],
        },
        "n2sweep": {
          en: "Clean first is wise. A clean floor is a polite floor.",
          jp: "そうじ が さき は かしこい。 きれい な ゆか は ていねい な ゆか。",
          mood: "wise",
          choices: [
            { en: "Then bake.",                       jp: "つぎに やく。",                   outcome:"good",    next:"n3" },
          ],
        },
        "n2list": {
          en: "There are five jobs. We bake the bread, we sweep the floor, we open the window, we put up the sign, and we practice our smile.",
          jp: "5つ の しごと が ある。 パン を やく、 ゆか を そうじ する、 まど を あける、 サイン を だす、 えがお を れんしゅう する。",
          mood: "happy",
          choices: [
            { en: "Smile practice is best.",          jp: "えがお れんしゅう は さいこう。", outcome:"good",   next:"n3smile" },
            { en: "Bake first, then list.",            jp: "まず やく、 つぎに リスト。",   outcome:"good",   next:"n2bake" },
          ],
        },
        "n3": {
          en: "Now the sign. 'OPEN' or 'BREAD AND FISH'?",
          jp: "サイン。 『OPEN』 か 『パン と さかな』？",
          mood: "confused",
          choices: [
            { en: "OPEN. Clear.",                     jp: "OPEN。 わかりやすい。",            outcome:"good",   next:"n4" },
            { en: "BREAD AND FISH. Honest.",          jp: "パン と さかな。 しょうじき。",   outcome:"good",   next:"n4honest" },
            { en: "Both signs!",                       jp: "りょうほう！",                    outcome:"good",   next:"n4both" },
          ],
        },
        "n3smile": {
          en: "Smile practice! Show me your best smile.",
          jp: "えがお れんしゅう！ いちばん の えがお みせて。",
          mood: "happy",
          choices: [
            { en: "I will show a big toothy smile!",   jp: "おおきい は えがお を みせる！",       outcome:"good",   next:"n4" },
            { en: "I will give a quiet shy smile.",    jp: "しずか で はずかしい えがお を みせる。", outcome:"good",   next:"n4" },
          ],
        },
        "n4": {
          en: "Perfect. The door is unlocked, the lights are on, and the bread really smells like bread.",
          jp: "かんぺき。 ドア が あいて、 でんき が ついて、 パン の におい が ほんとう に する。",
          mood: "happy",
          choices: [
            { en: "I will be your first customer!",   jp: "わたし が さいしょ の おきゃくさん に なる！",  outcome:"good", next:"endWarm" },
            { en: "Let us welcome the next kid.",      jp: "つぎ の こども を むかえよう。",                outcome:"good", next:"endWarm" },
          ],
        },
        "n4honest": {
          en: "Bread and Fish! Now my crisis is everyone's crisis.",
          jp: "パン と さかな！ ぼく の こんらん は みんな の こんらん。",
          mood: "happy",
          choices: [
            { en: "Shared crisis is community.",      jp: "わかちあう こんらん は コミュニティ。", outcome:"good", next:"endWarm" },
          ],
        },
        "n4both": {
          en: "Both signs! Customers will be confused but they will laugh.",
          jp: "りょうほう！ おきゃくさん は こんらん するが わらう。",
          mood: "happy",
          choices: [
            { en: "Laughter sells bread.",            jp: "わらい は パン を うる。",       outcome:"good",   next:"endWarm" },
          ],
        },
        "endWarm":    { en:"Thank you. The bakery is open. Bread or fish, you decide.",  jp:"ありがとう。 ひらいた。 パン か さかな、 きみ が きめる。",  mood:"happy" },
      },
    }],

    // TEMEE — remember the herd song
    ["temee", {
      id: "help-song",
      title: "The Herd Song",
      intro: "Temee Sarmagchin closes his eyes. He hums a low, slow song. He wants you to learn it.",
      scene: "temee-mongolia-day",
      start: "n1",
      nodes: {
        "n1": {
          en: "If you learn this song, my herd will not be forgotten.",
          jp: "この うた を おぼえれば、 むれ は わすれられない。",
          mood: "wise",
          choices: [
            { en: "I will learn it.",                jp: "おぼえる。",                       outcome:"good",    next:"n2" },
            { en: "Sing it first.",                   jp: "まず うたって。",                outcome:"good",    next:"n2" },
            { en: "Songs are not real.",              jp: "うた は ほんもの じゃない。",   outcome:"bad",     next:"endCool" },
          ],
        },
        "n2": {
          en: "Hmm-hmm, slow snow, hmm-hmm, big sky.",
          jp: "フン フン、 おそい ゆき、 フン フン、 ひろい そら。",
          mood: "wise",
          choices: [
            { en: "Slow snow, big sky.",              jp: "おそい ゆき、 ひろい そら。",    outcome:"good",   next:"n3" },
            { en: "Sing it again.",                    jp: "もう いちど。",                  outcome:"good",   next:"n2again" },
          ],
        },
        "n2again": {
          en: "Hmm-hmm, slow snow, hmm-hmm, big sky.",
          jp: "フン フン、 おそい ゆき、 フン フン、 ひろい そら。",
          mood: "wise",
          choices: [
            { en: "Slow snow, big sky.",              jp: "おそい ゆき、 ひろい そら。",    outcome:"good",   next:"n3" },
          ],
        },
        "n3": {
          en: "Good. Next line. Hmm-hmm, lost herd, hmm-hmm, find me.",
          jp: "いい。 つぎ の ぎょう。 フン フン、 まよえる むれ、 フン フン、 ぼく を みつけて。",
          mood: "sad",
          scene: "temee-herd-lost",
          choices: [
            { en: "Lost herd, find me.",              jp: "まよえる むれ、 ぼく を みつけて。", outcome:"good", next:"n4" },
            { en: "That line is too sad.",            jp: "その ぎょう は かなしすぎる。", outcome:"neutral", next:"n4soft" },
          ],
        },
        "n4": {
          en: "Final line. Hmm-hmm, slow tears, hmm-hmm, one herd.",
          jp: "さいご の ぎょう。 フン フン、 おそい なみだ、 フン フン、 ひとつ の むれ。",
          mood: "happy",
          choices: [
            { en: "Slow tears, one herd.",            jp: "おそい なみだ、 ひとつ の むれ。", outcome:"good", next:"n5" },
            { en: "I will not forget.",                jp: "わすれない。",                    outcome:"good",   next:"n5" },
          ],
        },
        "n4soft": {
          en: "Sadness is the song's coat. Underneath is warm. Try again.",
          jp: "かなしみ は うた の うわぎ。 した は あったかい。 もう いちど。",
          mood: "wise",
          choices: [
            { en: "Lost herd, find me.",              jp: "まよえる むれ、 ぼく を みつけて。", outcome:"good", next:"n4" },
          ],
        },
        "n5": {
          en: "Now sing it to me, the whole song.",
          jp: "ぜんぶ を ぼく に うたって。",
          mood: "proud",
          scene: "temee-mongolia-day",
          choices: [
            { en: "I sing the song carefully.",       jp: "ていねい に うたう。",            outcome:"good",   next:"endWarm" },
            { en: "I sing the song loudly.",          jp: "おおきく うたう。",               outcome:"good",   next:"endLoud" },
            { en: "I forget the second line.",         jp: "2 ぎょうめ を わすれた。",      outcome:"neutral", next:"n5retry" },
          ],
        },
        "n5retry": {
          en: "OK. Slow snow, big sky, lost herd, find me, slow tears, one herd.",
          jp: "おそい ゆき、 ひろい そら、 まよえる むれ、 ぼく を みつけて、 おそい なみだ、 ひとつ の むれ。",
          mood: "wise",
          choices: [
            { en: "Now I remember.",                  jp: "おぼえた。",                       outcome:"good",   next:"endWarm" },
          ],
        },
        "endWarm":    { en:"You are now the herd. One child is enough.",                  jp:"きみ は いま むれ。 こども ひとり で じゅうぶん。",         mood:"happy" },
        "endLoud":    { en:"Loud song. The sky heard. That is how Mongolians sing.",      jp:"おおきい うた。 そら が きいた。 モンゴル の うたい かた。", mood:"proud" },
        "endCool":    { en:"Then the herd stays only in my chest. Goodbye.",               jp:"じゃあ むれ は ぼく の むね だけ に。 さよなら。",          mood:"sad" },
      },
    }],

    // CATCHERSKI — reset the screen
    ["catcherski", {
      id: "help-reset",
      title: "The Color Sequence",
      intro: "Catcherski's screen is full of Cyrillic. He says a color sequence will reset the hack.",
      scene: "catcherski-hacked",
      start: "n1",
      nodes: {
        "n1": {
          en: "Three buttons. Three colors. Press them in order to reset me.",
          jp: "ボタン 3つ。 いろ 3つ。 じゅんばん に おして リセット。",
          mood: "scared",
          choices: [
            { en: "What is the order?",              jp: "じゅんばん は？",                 outcome:"good",    next:"n2" },
            { en: "Is this safe?",                    jp: "あんぜん？",                       outcome:"good",    next:"n2safe" },
            { en: "Tell me everything first.",        jp: "ぜんぶ おしえて。",               outcome:"good",    next:"n2safe" },
          ],
        },
        "n2": {
          en: "Red first, but only if you trust me. Green if you do not. Yellow always second.",
          jp: "あか が さいしょ、 でも ぼく を しんじる なら。 しんじない なら みどり。 きいろ は つねに 2ばんめ。",
          mood: "wise",
          choices: [
            { en: "I trust you. Red first.",          jp: "しんじる。 あか さいしょ。",     outcome:"good",    next:"n3trust" },
            { en: "I am unsure. Green first.",        jp: "わからない。 みどり さいしょ。", outcome:"neutral", next:"n3unsure" },
          ],
        },
        "n2safe": {
          en: "It is safe for you. For me, maybe not. The reset erases the hack.",
          jp: "きみ に は あんぜん。 ぼく は たぶん だめ。 リセット は ハック を けす。",
          mood: "sad",
          choices: [
            { en: "And erases you?",                  jp: "きみ も きえる？",                outcome:"good",    next:"n2half" },
            { en: "I will press the buttons anyway.", jp: "とにかく ボタン を おす。",     outcome:"good",    next:"n2" },
          ],
        },
        "n2half": {
          en: "Half of me. The half the hackers wired. The other half is yours now.",
          jp: "ぼく の はんぶん。 ハッカー が つないだ はんぶん。 のこり の はんぶん は きみ の もの。",
          mood: "wise",
          choices: [
            { en: "Then I will keep your half.",      jp: "じゃあ きみ の はんぶん を もっておく。", outcome:"good", next:"n2" },
            { en: "Maybe we do not reset.",            jp: "リセット しない。",              outcome:"neutral", next:"n3hold" },
          ],
        },
        "n3trust": {
          en: "Red. Yellow. Now blue, not green. Blue is freedom.",
          jp: "あか。 きいろ。 つぎ は あお、 みどり じゃない。 あお は じゆう。",
          mood: "proud",
          choices: [
            { en: "Red, yellow, blue.",               jp: "あか、 きいろ、 あお。",         outcome:"good",    next:"n4free" },
            { en: "Wait, that is three colors.",      jp: "まって、 3しょく。",              outcome:"good",    next:"n4free" },
          ],
        },
        "n3unsure": {
          en: "Green. Yellow. Black. Black hides me. I sleep, the hack sleeps.",
          jp: "みどり。 きいろ。 くろ。 くろ は ぼく を かくす。 ぼく は ねる、 ハック も ねる。",
          mood: "sad",
          choices: [
            { en: "Green, yellow, black.",            jp: "みどり、 きいろ、 くろ。",       outcome:"good",    next:"n4hide" },
            { en: "I changed my mind. Trust.",        jp: "きが かわった。 しんじる。",     outcome:"good",    next:"n3trust" },
          ],
        },
        "n3hold": {
          en: "OK. Press only yellow. Yellow is a wave hello.",
          jp: "わかった。 きいろ だけ。 きいろ は あいさつ。",
          mood: "happy",
          choices: [
            { en: "Yellow only.",                     jp: "きいろ だけ。",                   outcome:"good",    next:"n4hold" },
          ],
        },
        "n4free": {
          en: "Click. ...I feel quiet. Thank you, kind kid.",
          jp: "カチッ。 …しずか な きもち。 ありがとう、 やさしい こ。",
          mood: "happy",
          choices: [
            { en: "Are you free?",                    jp: "じゆう？",                         outcome:"good",    next:"endWarm" },
            { en: "Are you OK?",                      jp: "だいじょうぶ？",                  outcome:"good",    next:"endWarm" },
          ],
        },
        "n4hide": {
          en: "Click. ...Black screen. I am safe but small now. Visit me sometimes.",
          jp: "カチッ。 …くろい がめん。 あんぜん だけど ちいさく なった。 たまに きて。",
          mood: "wise",
          choices: [
            { en: "I will visit every week.",         jp: "まいしゅう くる。",               outcome:"good",    next:"endHide" },
          ],
        },
        "n4hold": {
          en: "Hello back. Not free, not erased, just held. Good enough.",
          jp: "あいさつ かえす。 じゆう でも、 きえる でも ない、 もたれた だけ。 じゅうぶん。",
          mood: "happy",
          choices: [
            { en: "Held is enough.",                  jp: "もたれた で じゅうぶん。",        outcome:"good",    next:"endWarm" },
          ],
        },
        "endWarm":    { en:"Now I steal nothing. Sometimes I give a free emoji.",   jp:"いま は なに も ぬすまない。 ときどき タダ の えもじ を あげる。", mood:"happy" },
        "endHide":    { en:"Black, but a friendly black. Look for the small blink.", jp:"くろい、 でも やさしい くろ。 ちいさい まばたき を さがして。",      mood:"wise" },
      },
    }],

  ];

  HELP.forEach(([kid, conv]) => {
    if (window.STORY && window.STORY[kid]) {
      window.STORY[kid].conversations.push(conv);
    }
  });

  // Additional gloss words used in these conversations.
  Object.assign(window.WORD_GLOSS || {}, {
    "apron":"エプロン","chair":"いす","barnacle":"フジツボ","kelp":"こんぶ","tent":"テント","sewed":"ぬった","heritage":"でんとう",
    "fern":"シダ","hole":"あな","roots":"ね","cover":"おおう","plants":"しょくぶつ","gently":"やさしく","whisper":"ささやく",
    "Sicily":"シチリア","caro":"あいする","figlio":"むすこ","vieni":"くる","casa":"いえ","reply":"へんじ","translator":"ほんやくか",
    "ribbon":"リボン","color":"いろ","blue":"あおい","yellow":"きいろ","brave":"ゆうかん","rainbow":"にじ",
    "anniversary":"きねんび","cherry":"さくらんぼ","perfect":"かんぺき","eternal":"えいえん","shy":"はずかしがり","lunchbox":"おべんとう","cave":"どうくつ","tree":"き","invite":"さそう",
    "bake":"やく","sweep":"そうじ","floor":"ゆか","sign":"サイン","steam":"じょうき","smile":"えがお","practice":"れんしゅう","customer":"きゃく","crisis":"こんらん","community":"コミュニティ",
    "song":"うた","slow":"おそい","snow":"ゆき","sky":"そら","forget":"わすれる","carefully":"ていねい に","loudly":"おおきく","sang":"うたった",
    "buttons":"ボタン","order":"じゅんばん","reset":"リセット","trust":"しんじる","unsure":"わからない","wired":"つないだ","erase":"けす","freedom":"じゆう","hide":"かくす",
  });
})();
