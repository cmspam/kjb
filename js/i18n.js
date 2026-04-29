// All Japanese UI strings live here.
window.JP = {
  title: "カイジュウバトル！",
  titleEn: "KAIJU BRAWL",
  start: "はじめる！",
  mode_label: "モード",
  mode_hero: "ヒーロー vs カイジュウ",
  mode_pvp: "モンスター バトル 🥊",
  pick_monster: (name) => `${name}、モンスターを えらんで！`,
  pvp_attack_label: (name) => `${name} を こうげき！`,
  pvp_eliminated: (name) => `${name} は やられた！💀`,
  pvp_winner: (name) => `${name} の しょうり！🏆`,
  rules: "あそびかた",
  back: "もどる",
  next: "つぎへ",
  ok: "OK！",
  skip: "とばす",
  pass_to: (name) => `${name} さんの ばん！`,
  pass_instr: "ほかの人は みないでね！\nじゅんびできたら タップ！",
  setup_title: "プレイヤーをえらんでね",
  player_count: "なんにん であそぶ？",
  level: "レベル",
  level0: "ようちえん 🍼",
  level1: "初心者[しょしんしゃ]",
  level2: "英検[えいけん]5級[きゅう]",
  level3: "英検[えいけん]4級[きゅう]",
  level4: "英検[えいけん]3級[きゅう]",
  level0_desc: "えいご きいて、えを タップ！",
  level1_desc: "アルファベット・フォニックスから",
  level2_desc: "英検[えいけん]5級[きゅう]",
  level3_desc: "英検[えいけん]4級[きゅう]",
  level4_desc: "英検[えいけん]3級[きゅう]",
  jinro_on: "うらぎりモード ON",
  jinro_off: "うらぎりモード OFF",
  jinro_hint: "４にん いじょうで あそべるよ。ひとりだけ カイジュウのスパイ！",
  player_name_hint: "なまえを いれてね",
  start_battle: "バトル スタート！",
  wager_title: "もんだいの レベルをえらべ！",
  wager_easy: "かんたん",
  wager_med: "ふつう",
  wager_hard: "むずかしい",
  wager_reward: (e) => `エナジー +${e}`,
  question_title: "もんだい！",
  correct: "せいかい！",
  wrong: "ざんねん！",
  wrong_burn: [
    "カイジュウが はなで わらった！",
    "ボスが おしりを ふりふりした！",
    "カイジュウ「ぷぷぷ、ざこ〜！」",
    "ボスが おならで かえした！",
    "カイジュウが かおを みて わらった！"
  ],
  correct_cheer: [
    "ナイス〜！",
    "やるじゃん！",
    "てんさい！",
    "つよい〜！",
    "ボスが ビビってる！"
  ],
  earned_energy: (e) => `エナジー ${e}コ ゲット！`,
  draw_card: (n) => `カードを ${n}まい ひいた！`,
  action_title: "なにを する？",
  action_attack: "こうげき",
  action_card: "カードをつかう",
  action_end: "ターンしゅうりょう",
  pick_target: "どこを こうげきする？",
  cancel: "やめる",
  energy: "エナジー",
  hp: "HP",
  damage: (n) => `${n} ダメージ！`,
  heal: (n) => `${n} かいふく！`,
  miss: "はずれ〜！",
  part_destroyed: (n) => `${n} を こわした！`,
  boss_turn: (name) => `${name||"カイジュウ"}の ばん！`,
  boss_attacks: (name) => `${name} を こうげき！`,
  victory: "しょうり〜！",
  victory_sub: "カイジュウを たおした！",
  defeat: "まけ〜",
  defeat_sub: "カイジュウに やられた…",
  play_again: "もういっかい！",
  back_to_title: "タイトルに もどる",
  vote_call: "とうひょう する？",
  vote_yes: "とうひょう！",
  vote_no: "やめる",
  vote_pick: "あやしい人を タップ！",
  vote_skip: "スキップ",
  vote_result_innocent: (n) => `${n} は シロでした！`,
  vote_result_spy: (n) => `${n} は スパイでした！`,
  role_hero_title: "ゆうしゃ！",
  role_hero_text: "みんなで カイジュウを たおせ！",
  role_spy_title: "スパイ…！",
  role_spy_text: "ばれずに みんなを まけさせろ！",
  spy_wins: "スパイの しょうり！",
  hero_wins: "ゆうしゃの しょうり！",
  rounds_left: (n) => `あと ${n} ラウンド`,
  // Battle log lines
  hit_part: (player, part, dmg) => `${player} が ${part} に ${dmg} ダメージ！`,
  card_played: (player, card) => `${player} が ${card} を つかった！`,
  // Setup labels
  player_n: (i) => `プレイヤー${i}`,
  // Boss reactions on hit
  boss_hit: [
    "イタタタ！",
    "おしりが いたい！",
    "やめて〜！",
    "ぷりぷり〜！",
    "うんちが もれる！",
    "ママ〜！"
  ],
  // Boss attacks
  // Each attack has 2-3 powering-up phrases the boss says before the attack name reveals.
  // The trailing emoji in `name` is also extracted for the burst animation.
  boss_atk_words: [
    { name: "ハナミズ ロケット 👃", phrases: ["くしゃみ でそう…", "鼻が ムズムズ！", "ハナミズ はっしゃ！"] },
    { name: "おなら ブラスト 💨", phrases: ["おしりが もぞもぞ", "ガス たまった〜", "ぷぅぅ…"] },
    { name: "うんち しゅりけん 💩", phrases: ["おなかが ピンチ！", "もう がまん できない！", "とんでけ うんち！"] },
    { name: "ヨダレ ウェーブ 💦", phrases: ["お口 じゅるじゅる！", "ヨダレ あふれる〜", "ベタベタ こうげき！"] },
    { name: "みみあか ボム 👂", phrases: ["みみが かゆい！", "ほじりたい〜", "出てこーい！"] },
    { name: "ゲップ ビーム 😤", phrases: ["うっぷ…", "ガス でちゃう！", "おちゃ のみすぎた！"] },
    { name: "つば ミサイル 💧", phrases: ["くち びちょびちょ！", "ぺっ！", "つばを とばす！"] },
    { name: "クシャミ こうげき 🤧", phrases: ["ハ…ハ…", "ハクション！", "止まらない くしゃみ！"] },
    { name: "なみだ プール 😭", phrases: ["わーん！", "なみだ あふれるー", "うえーん！"] },
    { name: "ハナクソ レーザー 👃", phrases: ["鼻に なんか…", "ほじって とばす！", "ハナクソ パワー！"] },
    { name: "おむつ アタック 🧷", phrases: ["おむつ おもい…", "うんち しちゃった", "ママ よんで！"] },
    { name: "おしり プリプリ 🍑", phrases: ["おしり みせる！", "プリプリ〜", "かわいい？"] },
    { name: "たこ焼き ボム 🐙", phrases: ["お腹 すいた…", "たこ ぱくぱく！", "あつあつ たこ焼き！"] },
    { name: "ラーメン スピン 🍜", phrases: ["ラーメンよ！", "つるつる〜", "あつあつ！"] },
    { name: "おにぎり タックル 🍙", phrases: ["お米 つよし！", "おにぎり〜！", "中身は うめぼし！"] },
    { name: "アイス バリア ❄️", phrases: ["つめたーい！", "とけそう…", "アイス 防御！"] },
    { name: "プリン アタック 🍮", phrases: ["ぷるぷる〜", "プリン投げ！", "あまくて つよい！"] },
    { name: "すし マシンガン 🍣", phrases: ["まぐろ！サーモン！", "ぱっぱっぱ！", "すし 連射！"] },
    { name: "バナナ スリップ 🍌", phrases: ["バナナ はい！", "つるん♪", "すべるよ〜"] },
    { name: "メロンパン パンチ 🍞", phrases: ["メロンパン あつい！", "ぱさぱさ！", "メロンの かおり！"] },
    { name: "ピザ ぐるぐる 🍕", phrases: ["チーズ ぐるぐる", "アツアツ", "ピザ 投げ！"] },
    { name: "ねこ パンチ 🐱", phrases: ["にゃー！", "ひっかくぞ！", "ねこの怒り！"] },
    { name: "うさぎ キック 🐰", phrases: ["ぴょん！", "後ろ足 強烈！", "うさぎ パワー！"] },
    { name: "パンダ ハグ 🐼", phrases: ["ぎゅーっ！", "もっふもふ", "ささ おいしい〜"] },
    { name: "かえる ジャンプ 🐸", phrases: ["けろけろ", "ジャーンプ！", "ぴょん！"] },
    { name: "へび まきつき 🐍", phrases: ["しゅるしゅる…", "つかまえた！", "にげられない！"] },
    { name: "とり つつき 🐦", phrases: ["ちゅんちゅん", "ピヨピヨ", "つつくぞ！"] },
    { name: "トラララ ブラスト 🎵", phrases: ["トラララ〜", "♪♪♪", "うた うたう！"] },
    { name: "ボンバル ボム 💣", phrases: ["ボンバル！", "ばくはつ！", "Tung tung tung！"] },
    { name: "パタピム パンチ 👊", phrases: ["パタピム！", "ふしぎな ちから", "ふわふわ パンチ"] },
    { name: "パクパク かみつき 🦷", phrases: ["パクっ！", "歯が ピカピカ", "がぶがぶ！"] },
    { name: "ブルブル シェイク 🥶", phrases: ["さむい！", "ブルブル", "ふるえるー"] },
    { name: "ビリビリ パンチ ⚡", phrases: ["でんき たまる！", "バチバチ", "10まんボルト！"] },
    { name: "メガトン パンチ 💥", phrases: ["全力！", "メガトン！", "くらえ！"] },
    { name: "ねばねば ビーム 🟢", phrases: ["ねばねば〜", "あぶら ぎっとり", "つかまえる！"] },
    { name: "ぐるぐる かいてん 🌀", phrases: ["まわるぞー！", "ぐるぐる", "目が回るー"] },
    { name: "ガチャガチャ アタック 🎰", phrases: ["なにが でるかな", "ガチャ！", "ランダム！"] },
    { name: "ドカーン ばくはつ 💥", phrases: ["カウントダウン…", "3 2 1…", "ドカーン！"] },
    { name: "シャキーン れいかん ⚔️", phrases: ["剣を ぬく！", "シャキーン！", "ひかる つるぎ"] },
    { name: "ぴえん こうせん 😢", phrases: ["ぴえん…", "なきそう", "ぴえん超え ぱおん"] },
    { name: "やばたん ボム 💣", phrases: ["やばたん！", "やばすぎ", "それな！"] },
    { name: "ばぶみ ハート 💗", phrases: ["ばぶー", "ばぶみ あふれる", "あかちゃん パワー！"] },
    { name: "むずすぎ パンチ 😖", phrases: ["むずすぎ！", "わからん！", "ぐえー"] },
    { name: "もきゅもきゅ もみくちゃ 🍡", phrases: ["もきゅ", "ぎゅうぎゅう", "もみもみ"] },
    { name: "ふわふわ クッション ☁️", phrases: ["ふわふわ", "ふんわり〜", "クッション！"] },
    { name: "ピカ もどき 10まん ⚡", phrases: ["ピカ ピカ", "10まんボルト！", "でんき タイプ！"] },
    { name: "ガオー かみつき 🦁", phrases: ["ガオー！", "ライオン パワー", "つよいぞ！"] },
    { name: "オラオラ ラッシュ 👊", phrases: ["オラオラオラ！", "ラッシュ！", "とまらない！"] },
    { name: "ばたんきゅう スリープ 😴", phrases: ["zzz…", "ねむい…", "おやすみ！"] },
    { name: "ぐーぐー いびき 💤", phrases: ["ぐーぐー", "z z z", "ねぼけ こうげき"] },
    { name: "うえーい ダンス 💃", phrases: ["うぇーい！", "ダンスタイム！", "うひょー"] }
  ],

  // Generic boss heckling phrases shown during the slingshot pull-back.
  slingshot_taunts: [
    "うってみろよ！💪", "やめて〜 おねがい 🥺", "ぼく かわいいでしょ？😊", "あたるかな〜？",
    "おそい おそい！", "へたくそ〜！", "あたっても いたくないよ！", "ママ よんで！",
    "ガクブル…", "Bring it on！", "プルプル ふるえる…", "なんで ぼくを いじめるの？😭",
    "もう ねむいよ…", "おしっこ もれそう…", "ぼく なにも わるくないのに〜", "うっひゃー こわい！",
    "じょうず じゃないでしょ？", "おにいちゃん よわい！", "やってみろよ〜", "わたしを たすけて〜！"
  ],
  boss_taunt_low_hp: [
    "もう ゆるして〜！",
    "ママ よんで〜！",
    "おなかが すいた！",
    "おむつ かえて！"
  ]
};

window.pickRand = (arr) => arr[Math.floor(Math.random()*arr.length)];

// Furigana helper. Authors write 「漢字[よみ]」 and this turns it into proper
// HTML <ruby> tags so kanji shows the hiragana reading above it (like kids' books).
window.furigana = function(s) {
  if (!s) return "";
  return String(s).replace(/([一-鿿々ヶ]+)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
};

// Funny default player names — assigned randomly when a kid leaves their name blank.
window.FUNNY_NAMES = [
  // Italian brainrot
  "タコサフール","ボンバル","トラララ","パタピム","ブルブル","ウンコディロ","パクパク","パンパム",
  "クロコディロ","リリリラリ","トゥンサフール","パンチパンチ","ボンバ","チンチンチン",
  // Pop culture (kid-friendly)
  "ピカ","ピチュー","ドラ","アンパン","しんちゃん","ちいかわ","ハチワレ","うさぎセンパイ",
  "すみっコ","ジバニャン","コロ助","ドラミ","ガンバ","ピングー",
  // Food puns
  "オニギリ","タコヤキ","ナットウ","スシちゃん","ラーメン","ヤキニク","ハンバーガ","アイス太郎",
  "プリン","パンマン","タピオカ","かりんとう","ようかん","おでん",
  // Animals
  "ニャンコ","ワンコ","ポコポコ","カッパ","ペンペン","クマちゃん","ウサギ","キリンさん",
  "ぞうさん","パンダ","ハムスタ","コアラ","ライオン","シマウマ",
  // Funny characters
  "オジサン","オバさん","ヘンナヤツ","ロボット","メカ吉","ニンジャ","サムライ","ヒーロー",
  "ヴィラン","ウサ仮面","アホヤン","ドジっ子","ぼんやり","のんびり",
  // Cute sounds
  "ふわふわ","もきゅ","ぷにぷに","もちもち","ぴくぴく","ぽんぽん","ぴこぴこ","ぴよぴよ",
  "キラキラ","シャキーン","ニコニコ","ぐるぐる","ぱくぱく","ぴょんぴょん",
  // Memes 2026
  "ぴえん","やばたん","それな","むずすぎ","きまずい","ばぶみ","うえい","てぇてぇ",
  "オモシロ","むりぽ","ぱおん","ぐうかわ","ガチ勢","エモ",
  // Body / silly
  "オシリ","オナラ","ウンチくん","ハナミズ","ゲップ太郎","ベロベロ","ヨダレ","ホッペ",
  "オデコ","ヒジ","おへそ","くしゃみ"
];

