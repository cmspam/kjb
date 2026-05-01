// Lesson system. The "💡 おしえて！" button on a question opens an overlay
// authored here. The lesson reveals the correct answer up front and then
// teaches the words and grammar so the kid can understand WHY — that way
// even a kid who has no idea can still answer (and over time, learn).
//
// Public API:
//   Lessons.buildHTML(question)  → full innerHTML for the lesson overlay
//   Lessons.lookup(en)           → JP gloss for a single English word/phrase
//
// Architecture:
//   • DICT  — EN→JP dictionary with kanji+furigana ([よみ] markup), covers
//             every word that appears in the question pool plus structural
//             words (am/is/are/the/a/an/do/does/will/can/should/etc.)
//   • BUILDERS — per-ptype lesson generators. Each returns { intro, words,
//             grammar, examples, tip }. Vocab-style ptypes share one builder.
//             Grammar ptypes (be / pron / a_an / plural / this_that /
//             present / past / future / can / want / prep / wh / etc.)
//             have hand-written rule explanations in JP with furigana.
//   • renderHTML — turns the structured lesson into the overlay HTML.
//
// Falls back to a generic "words in this question" lesson for any ptype
// that doesn't have a dedicated builder, so the button is always useful.
window.Lessons = (() => {

  // ===== EN → JP DICTIONARY =====
  // Values use the same 漢字[よみ] furigana markup the rest of the codebase uses,
  // so the renderer can pass them through `furigana()` for ruby annotations.
  // Kept hiragana-only for words elementary kids would write that way (うれしい,
  // バナナ, タコ); kanji+furigana for words an adult Japanese reader would
  // typically see in kanji (学校[がっこう], 先生[せんせい]).
  const DICT = {
    // ---- Pronouns / subjects ----
    "i": "わたし", "you": "あなた", "he": "かれ", "she": "かのじょ",
    "it": "それ", "we": "わたしたち", "they": "かれら",
    "my": "わたしの", "your": "あなたの", "his": "かれの", "her": "かのじょの",
    "its": "それの", "our": "わたしたちの", "their": "かれらの",
    "me": "わたしを", "him": "かれを", "us": "わたしたちを", "them": "かれらを",
    "this": "これ", "that": "あれ・それ", "these": "これら", "those": "あれら",
    "mine": "わたしの もの", "yours": "あなたの もの",

    // ---- Articles / determiners ----
    "a": "ひとつの", "an": "ひとつの (ぼいんの まえ)", "the": "その",
    "some": "いくつかの", "any": "なにか / どれか",
    "many": "たくさんの (かぞえられる)", "much": "たくさんの (かぞえられない)",
    "few": "すくない", "little": "すくない / ちいさい", "all": "ぜんぶ",
    "every": "どの〜も", "no": "いいえ / ない",

    // ---- be verbs ----
    "am": "です (I の とき)", "is": "です (he/she/it の とき)",
    "are": "です (you/we/they の とき)", "be": "be (げんけい)",
    "was": "でした (I/he/she/it の かこ)", "were": "でした (you/we/they の かこ)",
    "been": "be の かこぶんし",

    // ---- do / does / did ----
    "do": "する / しますか？", "does": "する (he/she/it)",
    "did": "した (かこけい)", "done": "do の かこぶんし",
    "don't": "しない", "doesn't": "しない (he/she/it)",
    "didn't": "しなかった",

    // ---- modals ----
    "can": "できる", "can't": "できない", "cannot": "できない",
    "could": "できた / できそう", "couldn't": "できなかった",
    "will": "〜する つもり / みらい", "won't": "しない (みらい)",
    "would": "〜だろう / 〜したい", "should": "〜したほうが いい",
    "shouldn't": "〜しないほうが いい", "must": "〜しなければ ならない",
    "may": "〜してもよい / かもしれない", "might": "〜かもしれない",

    // ---- have / has / had ----
    "have": "もっている / もつ", "has": "もっている (he/she/it)",
    "had": "もっていた (かこ)", "having": "もっている (-ing)",

    // ---- common verbs (general) ----
    "go": "いく", "goes": "いく (he/she/it)", "went": "いった (かこ)",
    "gone": "go の かこぶんし", "going": "いっている / いくつもり",
    "come": "くる", "comes": "くる (he/she/it)", "came": "きた (かこ)",
    "see": "みる", "sees": "みる (he/she/it)", "saw": "みた (かこ)",
    "look": "みる / みて", "looks": "みえる", "looked": "みた",
    "watch": "じっと みる", "watches": "みる (he/she/it)", "watched": "みた",
    "eat": "たべる", "eats": "たべる (he/she/it)", "ate": "たべた (かこ)",
    "eaten": "eat の かこぶんし", "eating": "たべている",
    "drink": "のむ", "drinks": "のむ (he/she/it)", "drank": "のんだ (かこ)",
    "drinking": "のんでいる",
    "make": "つくる", "makes": "つくる (he/she/it)", "made": "つくった (かこ)",
    "do": "する", "does": "する (he/she/it)", "did": "した (かこ)",
    "play": "あそぶ / プレーする", "plays": "あそぶ (he/she/it)",
    "played": "あそんだ / プレーした", "playing": "あそんでいる",
    "run": "はしる", "runs": "はしる (he/she/it)", "ran": "はしった (かこ)",
    "running": "はしっている", "walk": "あるく", "walked": "あるいた",
    "walking": "あるいている", "jump": "ジャンプする",
    "sit": "すわる", "sits": "すわる (he/she/it)", "sat": "すわった",
    "stand": "たつ", "stood": "たった (かこ)", "stay": "とどまる",
    "sleep": "ねる", "slept": "ねた (かこ)", "wake": "おきる",
    "woke": "おきた", "read": "よむ", "reads": "よむ (he/she/it)",
    "write": "かく", "wrote": "かいた (かこ)", "writes": "かく (he/she/it)",
    "speak": "はなす", "spoke": "はなした", "talk": "はなす", "talked": "はなした",
    "say": "いう", "said": "いった (かこ)", "tell": "つたえる", "told": "つたえた",
    "ask": "きく / たずねる", "asked": "きいた",
    "answer": "こたえる / こたえ", "help": "たすける / てつだう",
    "want": "ほしい / 〜したい", "wants": "ほしい (he/she/it)", "wanted": "ほしかった",
    "like": "すき", "likes": "すき (he/she/it)", "liked": "すきだった",
    "love": "あいする / だいすき", "loves": "だいすき (he/she/it)",
    "hate": "きらい", "need": "ひつよう", "needs": "ひつよう (he/she/it)",
    "know": "しっている", "knows": "しっている (he/she/it)", "knew": "しっていた",
    "think": "おもう", "thinks": "おもう (he/she/it)", "thought": "おもった",
    "feel": "かんじる", "felt": "かんじた",
    "find": "みつける", "found": "みつけた",
    "give": "あげる", "gave": "あげた", "given": "give の かこぶんし",
    "take": "とる / もっていく", "took": "とった", "taken": "take の かこぶんし",
    "buy": "かう", "bought": "かった (かこ)",
    "sell": "うる", "sold": "うった",
    "open": "あける", "close": "しめる", "start": "はじめる",
    "stop": "やめる / とまる", "begin": "はじまる", "end": "おわる",
    "work": "はたらく", "worked": "はたらいた",
    "study": "べんきょうする", "studied": "べんきょうした",
    "learn": "まなぶ", "learned": "まなんだ", "teach": "おしえる", "taught": "おしえた",
    "live": "すむ", "lived": "すんでいた",
    "wait": "まつ", "waited": "まった",
    "try": "ためす", "tried": "ためした",
    "use": "つかう", "used": "つかった",
    "happen": "おこる", "happened": "おこった",
    "sing": "うたう", "sang": "うたった (かこ)", "sung": "sing の かこぶんし",
    "dance": "おどる", "danced": "おどった",
    "draw": "えを かく", "drew": "かいた (え)",
    "fly": "とぶ", "flew": "とんだ (かこ)",
    "swim": "およぐ", "swam": "およいだ", "swimming": "およぐ こと",
    "climb": "のぼる", "climbed": "のぼった",
    "ride": "のる (じてんしゃ など)", "rode": "のった",
    "drive": "うんてんする", "drove": "うんてんした",
    "cook": "りょうりする", "cooked": "りょうりした", "cooking": "りょうり",
    "clean": "そうじする", "cleaned": "そうじした",
    "wash": "あらう", "washed": "あらった",
    "throw": "なげる", "threw": "なげた",
    "catch": "つかまえる", "caught": "つかまえた",
    "kick": "ける", "hit": "うつ / ぶつかる",
    "win": "かつ", "won": "かった (かこ)", "lose": "まける", "lost": "まけた",
    "leave": "でる / でかける", "left": "でた / ひだり",
    "arrive": "とうちゃくする", "arrived": "とうちゃくした",
    "wear": "きる (ふく)", "wore": "きた (かこ)",
    "bring": "もってくる", "brought": "もってきた",
    "send": "おくる", "sent": "おくった",
    "show": "みせる", "showed": "みせた",
    "meet": "あう", "met": "あった (かこ)",
    "follow": "したがう", "spend": "つかう・すごす",
    "reach": "とどく・つく", "grow": "そだつ・そだてる",
    "impress": "かんどうさせる", "perform": "えんそうする",
    "fight": "たたかう", "fought": "たたかった",
    "bake": "やく (オーブン)", "forget": "わすれる", "forgot": "わすれた",
    "join": "さんかする", "return": "かえる",
    "share": "シェアする", "decide": "きめる",
    "receive": "うけとる", "create": "つくる", "explain": "せつめいする",
    "introduce": "しょうかいする", "invite": "しょうたいする",
    "expect": "きたいする", "prepare": "じゅんびする",
    "protect": "まもる", "increase": "ふえる", "decrease": "へる",
    "disappear": "きえる", "continue": "つづける", "finish": "おえる",
    "realize": "きづく", "agree": "さんせいする",
    "disagree": "はんたいする", "recommend": "おすすめする",
    "choose": "えらぶ", "chose": "えらんだ",

    // ---- nouns: animals ----
    "cat": "ねこ", "dog": "いぬ", "bird": "とり", "fish": "さかな",
    "pig": "ぶた", "cow": "うし", "horse": "うま", "sheep": "ひつじ",
    "mouse": "ねずみ", "mice": "ねずみたち", "rabbit": "うさぎ",
    "bear": "くま", "lion": "ライオン", "tiger": "とら", "monkey": "さる",
    "elephant": "ぞう", "snake": "へび", "frog": "かえる", "duck": "あひる",
    "panda": "パンダ", "chicken": "にわとり", "koala": "コアラ",
    "giraffe": "キリン", "fox": "きつね", "turtle": "かめ",
    "butterfly": "ちょうちょ", "bee": "はち",

    // ---- food ----
    "apple": "りんご", "banana": "バナナ", "bread": "パン",
    "rice": "ごはん / おこめ", "egg": "たまご", "milk": "ぎゅうにゅう",
    "water": "みず", "juice": "ジュース", "cake": "ケーキ", "candy": "あめ",
    "pizza": "ピザ", "meat": "にく", "soup": "スープ", "salad": "サラダ",
    "cheese": "チーズ", "tea": "おちゃ", "coffee": "コーヒー",
    "sushi": "おすし", "noodles": "めん", "ice cream": "アイスクリーム",
    "hamburger": "ハンバーガー", "cookie": "クッキー",
    "chocolate": "チョコレート", "donut": "ドーナツ",
    "rice ball": "おにぎり", "grapes": "ぶどう", "strawberry": "いちご",
    "watermelon": "すいか", "orange": "オレンジ",

    // ---- family ----
    "father": "おとうさん", "mother": "おかあさん", "dad": "おとうさん",
    "mom": "おかあさん", "brother": "おにいさん / おとうと",
    "sister": "おねえさん / いもうと",
    "grandfather": "おじいさん", "grandmother": "おばあさん",
    "grandpa": "おじいさん", "grandma": "おばあさん",
    "uncle": "おじさん", "aunt": "おばさん", "family": "かぞく",
    "friend": "ともだち", "baby": "あかちゃん", "boy": "おとこのこ",
    "girl": "おんなのこ", "kid": "こども", "child": "こども",
    "children": "こどもたち", "people": "ひとびと",
    "person": "ひと", "man": "おとこ", "woman": "おんな",
    "men": "おとこたち", "women": "おんなたち",
    "neighbor": "となりびと", "couple": "カップル",
    "couples": "カップルたち", "stranger": "しらないひと",

    // ---- school / classroom ----
    "pen": "ペン", "pencil": "えんぴつ", "book": "ほん", "bag": "かばん",
    "desk": "つくえ", "chair": "いす", "eraser": "けしゴム",
    "ruler": "じょうぎ", "paper": "かみ", "notebook": "ノート",
    "scissors": "はさみ", "glue": "のり", "board": "こくばん",
    "clock": "とけい", "map": "ちず", "school": "学校[がっこう]",
    "classroom": "きょうしつ", "teacher": "先生[せんせい]",
    "student": "生徒[せいと]", "homework": "しゅくだい",
    "textbook": "きょうかしょ", "lesson": "レッスン",
    "library": "としょかん", "library card": "としょカード",
    "dictionary": "じしょ", "page": "ページ",

    // ---- weather / nature ----
    "sunny": "はれ", "rainy": "あめ", "cloudy": "くもり", "snowy": "ゆき",
    "windy": "かぜ", "hot": "あつい", "cold": "つめたい / さむい",
    "warm": "あたたかい", "cool": "すずしい", "rain": "あめ",
    "snow": "ゆき", "wind": "かぜ", "sun": "たいよう",
    "moon": "つき", "star": "ほし", "stars": "ほしたち",
    "cloud": "くも", "sky": "そら", "rainbow": "にじ",
    "weather": "天気[てんき]", "climate": "きこう",
    "tree": "き", "flower": "はな", "grass": "くさ", "leaf": "はっぱ",
    "leaves": "はっぱたち", "river": "かわ", "sea": "うみ",
    "ocean": "うみ", "lake": "みずうみ", "mountain": "やま",
    "forest": "もり", "beach": "ビーチ", "island": "しま",
    "wave": "なみ", "earth": "ちきゅう", "scenery": "けしき",
    "nature": "しぜん", "environment": "かんきょう",

    // ---- places / buildings ----
    "park": "こうえん", "hospital": "びょういん", "station": "えき",
    "store": "おみせ", "shop": "おみせ", "house": "いえ",
    "home": "うち", "zoo": "どうぶつえん", "pool": "プール",
    "restaurant": "レストラン", "café": "カフェ", "cafe": "カフェ",
    "city": "まち / し", "country": "くに / いなか",
    "town": "まち", "village": "むら", "world": "せかい",
    "japan": "日本[にほん]", "tokyo": "東京[とうきょう]",
    "kyoto": "京都[きょうと]", "america": "アメリカ",
    "office": "オフィス", "company": "かいしゃ", "business": "しごと",

    // ---- body ----
    "head": "あたま", "eye": "め", "eyes": "りょうめ",
    "ear": "みみ", "ears": "りょうみみ", "nose": "はな",
    "mouth": "くち", "tooth": "は", "teeth": "はたち",
    "hair": "かみのけ", "face": "かお", "hand": "て",
    "hands": "りょうて", "foot": "あし", "feet": "りょうあし",
    "arm": "うで", "leg": "あし", "finger": "ゆび",
    "fingers": "ゆびたち", "tummy": "おなか", "butt": "おしり",
    "back": "せなか",

    // ---- clothes ----
    "shirt": "シャツ", "pants": "ズボン", "shoes": "くつ",
    "hat": "ぼうし", "socks": "くつした", "jacket": "ジャケット",
    "dress": "ドレス", "gloves": "てぶくろ", "uniform": "せいふく",

    // ---- vehicles ----
    "car": "くるま", "bus": "バス", "train": "でんしゃ",
    "airplane": "ひこうき", "plane": "ひこうき", "ship": "ふね",
    "boat": "ボート", "bike": "じてんしゃ", "motorcycle": "バイク",
    "taxi": "タクシー", "helicopter": "ヘリコプター",
    "truck": "トラック", "rocket": "ロケット", "subway": "地下鉄[ちかてつ]",
    "ticket": "チケット", "passport": "パスポート",
    "luggage": "にもつ", "suitcase": "スーツケース",

    // ---- toys / things ----
    "ball": "ボール", "teddy bear": "テディベア",
    "kite": "たこ", "balloon": "ふうせん", "present": "プレゼント",
    "gift": "プレゼント", "toy": "おもちゃ", "toys": "おもちゃ (ふくすう)",
    "yo-yo": "ヨーヨー", "crayon": "クレヨン", "paint": "えのぐ",
    "computer": "パソコン", "phone": "でんわ", "smartphone": "スマホ",
    "TV": "テレビ", "tv": "テレビ", "music": "おんがく",
    "movie": "えいが", "song": "うた",

    // ---- numbers ----
    "one": "1 (いち)", "two": "2 (に)", "three": "3 (さん)",
    "four": "4 (よん)", "five": "5 (ご)", "six": "6 (ろく)",
    "seven": "7 (なな・しち)", "eight": "8 (はち)", "nine": "9 (きゅう)",
    "ten": "10 (じゅう)", "eleven": "11", "twelve": "12",
    "thirteen": "13", "fourteen": "14", "fifteen": "15",
    "sixteen": "16", "seventeen": "17", "eighteen": "18",
    "nineteen": "19", "twenty": "20", "thirty": "30",
    "forty": "40", "fifty": "50", "sixty": "60",
    "seventy": "70", "eighty": "80", "ninety": "90",
    "hundred": "100 (ひゃく)", "one hundred": "100",
    "thousand": "1000 (せん)", "million": "100万[まん]",
    "first": "1ばんめ", "second": "2ばんめ", "third": "3ばんめ",
    "last": "さいごの",

    // ---- colors ----
    "red": "あか", "blue": "あお", "yellow": "きいろ",
    "green": "みどり", "purple": "むらさき", "pink": "ピンク",
    "black": "くろ", "white": "しろ", "brown": "ちゃいろ",
    "gray": "グレー", "color": "いろ", "colour": "いろ",

    // ---- adjectives: feeling / quality ----
    "happy": "うれしい / しあわせ", "sad": "かなしい",
    "angry": "おこっている", "tired": "つかれた",
    "hungry": "おなかが すいた", "thirsty": "のどが かわいた",
    "scared": "こわい", "excited": "わくわく", "bored": "たいくつ",
    "fine": "げんき / だいじょうぶ", "okay": "OK",
    "good": "いい", "bad": "わるい", "great": "すごい",
    "wonderful": "すばらしい", "beautiful": "うつくしい",
    "cute": "かわいい", "pretty": "きれい", "ugly": "みにくい",
    "nice": "やさしい / いい",
    "big": "おおきい", "small": "ちいさい", "little": "ちいさい",
    "long": "ながい", "short": "みじかい / せがひくい",
    "tall": "せがたかい", "old": "ふるい / としをとった",
    "new": "あたらしい", "young": "わかい",
    "fast": "はやい", "slow": "おそい", "quick": "はやい",
    "easy": "やさしい", "difficult": "むずかしい", "hard": "むずかしい / かたい",
    "fun": "たのしい", "boring": "つまらない",
    "funny": "おもしろい", "interesting": "きょうみぶかい",
    "smart": "あたまがいい", "kind": "やさしい",
    "strong": "つよい", "weak": "よわい",
    "rich": "おかねもち", "poor": "まずしい",
    "clean": "きれい", "dirty": "きたない",
    "famous": "ゆうめい", "popular": "にんき",
    "successful": "せいこう", "amazing": "すごい", "perfect": "かんぺき",
    "delicious": "おいしい", "fresh": "しんせん",
    "serious": "しんけん", "confident": "じしんがある",
    "nervous": "きんちょう", "worried": "しんぱい",
    "lonely": "さみしい", "jealous": "しっと",
    "proud": "ほこらしい", "careful": "ちゅういぶかい",
    "polite": "ていねい", "lazy": "なまけもの",
    "honest": "しょうじき", "selfish": "じぶんかって",
    "friendly": "ゆうこうてき", "strict": "きびしい",
    "generous": "かんだい", "talented": "さいのうがある",
    "foreign": "がいこくの", "local": "じもとの",
    "traditional": "でんとうてき", "modern": "モダン",
    "national": "こくみんの", "international": "こくさいてき",

    // ---- time / when ----
    "today": "きょう", "tomorrow": "あした", "yesterday": "きのう",
    "tonight": "こんばん", "now": "いま", "later": "あとで",
    "soon": "すぐ", "always": "いつも", "usually": "たいてい",
    "often": "よく", "sometimes": "ときどき", "never": "けっして〜ない",
    "again": "もういちど", "still": "まだ", "already": "すでに",
    "yet": "まだ / もう", "ever": "いままでに",
    "morning": "あさ", "afternoon": "ごご", "evening": "ゆうがた",
    "night": "よる", "noon": "ひる",
    "day": "ひ", "week": "しゅう", "weekend": "しゅうまつ",
    "month": "つき / げつ", "year": "とし / ねん",
    "hour": "じかん", "minute": "ふん", "second": "びょう",
    "moment": "しゅんかん",
    "monday": "げつようび", "tuesday": "かようび",
    "wednesday": "すいようび", "thursday": "もくようび",
    "friday": "きんようび", "saturday": "どようび", "sunday": "にちようび",
    "january": "1がつ", "february": "2がつ", "march": "3がつ",
    "april": "4がつ", "may": "5がつ", "june": "6がつ",
    "july": "7がつ", "august": "8がつ", "september": "9がつ",
    "october": "10がつ", "november": "11がつ", "december": "12がつ",
    "spring": "はる", "summer": "なつ", "fall": "あき",
    "autumn": "あき", "winter": "ふゆ",

    // ---- prepositions / location ----
    "in": "〜の なかに", "on": "〜の うえに", "at": "〜で / 〜に",
    "under": "〜の したに", "over": "〜の うえに / 〜こえて",
    "above": "〜より うえ", "below": "〜より した",
    "next to": "〜の となりに", "near": "〜の ちかく",
    "by": "〜で / 〜の そば", "between": "〜の あいだ",
    "from": "〜から", "to": "〜へ / 〜まで",
    "into": "〜の なかへ", "out of": "〜の そとへ",
    "before": "〜の まえに", "after": "〜の あとで",
    "with": "〜と いっしょに", "without": "〜なしで",
    "for": "〜の ために", "of": "〜の", "about": "〜について",

    // ---- conjunctions ----
    "and": "そして", "but": "しかし / でも", "or": "または",
    "so": "だから", "because": "なぜなら", "if": "もし",
    "when": "〜の とき", "while": "〜の あいだ",
    "though": "〜だけど", "although": "〜だけど",
    "since": "〜から / 〜なので", "until": "〜まで",

    // ---- WH question words ----
    "what": "なに / なん", "who": "だれ", "where": "どこ",
    "when": "いつ", "why": "なぜ", "how": "どう / どのくらい",
    "which": "どちら / どの", "whose": "だれの",
    "how many": "いくつ (かぞえられる)",
    "how much": "いくら (りょう・ねだん)",
    "how old": "いくつ (とし)",

    // ---- yes/no/please/etc. ----
    "yes": "はい", "no": "いいえ", "please": "おねがいします",
    "thank you": "ありがとう", "thanks": "ありがとう",
    "sorry": "ごめんなさい", "excuse me": "すみません",
    "hello": "こんにちは", "hi": "やあ", "bye": "バイバイ",
    "goodbye": "さようなら", "good morning": "おはよう",
    "good night": "おやすみ", "good evening": "こんばんは",
    "see you": "じゃ また", "welcome": "ようこそ",
    "ok": "OK / だいじょうぶ",

    // ---- jobs / roles ----
    "doctor": "いしゃ", "nurse": "かんごし", "police": "けいさつ",
    "police officer": "けいさつかん", "farmer": "のうふ",
    "chef": "コック", "cook": "コック / りょうりする",
    "pilot": "パイロット", "singer": "かしゅ",
    "artist": "アーティスト", "dentist": "はいしゃ",
    "fireman": "しょうぼうし", "scientist": "かがくしゃ",
    "driver": "うんてんしゅ", "writer": "さっか",
    "dancer": "ダンサー", "athlete": "せんしゅ",
    "musician": "おんがくか", "photographer": "しゃしんか",
    "mechanic": "せいびし", "captain": "せんちょう",
    "passenger": "じょうきゃく", "traveler": "りょこうしゃ",
    "librarian": "ししょ", "customer": "おきゃくさん",
    "audience": "かんきゃく", "coworker": "どうりょう",
    "volunteer": "ボランティア",

    // ---- sports / hobbies ----
    "soccer": "サッカー", "baseball": "やきゅう",
    "basketball": "バスケ", "tennis": "テニス", "swimming": "すいえい",
    "running": "ランニング", "dancing": "ダンス",
    "singing": "うた", "reading": "どくしょ", "drawing": "おえかき",
    "games": "ゲーム", "video games": "ビデオゲーム",
    "piano": "ピアノ", "guitar": "ギター", "art": "びじゅつ",
    "sport": "スポーツ", "sports": "スポーツ",
    "camping": "キャンプ", "fishing": "つり", "shopping": "かいもの",
    "hiking": "ハイキング", "skating": "スケート",
    "skiing": "スキー", "bowling": "ボーリング",

    // ---- common nouns / abstract ----
    "thing": "もの", "things": "もの (ふくすう)",
    "name": "なまえ", "age": "とし",
    "house": "いえ", "money": "おかね", "time": "じかん",
    "way": "みち / ほうほう", "place": "ばしょ",
    "idea": "アイデア", "story": "はなし", "question": "しつもん",
    "answer": "こたえ", "problem": "もんだい",
    "reason": "りゆう", "example": "れい", "kind": "しゅるい / やさしい",
    "type": "タイプ", "side": "がわ",
    "language": "げんご", "culture": "ぶんか",
    "tradition": "でんとう", "history": "れきし",
    "journey": "たび", "adventure": "ぼうけん",
    "festival": "おまつり", "parade": "パレード", "ceremony": "しき",
    "championship": "せんしゅけん", "competition": "きょうそう",
    "concert": "コンサート", "program": "ばんぐみ", "channel": "チャンネル",
    "smile": "ほほえみ", "laugh": "わらう", "tear": "なみだ",
    "dream": "ゆめ", "promise": "やくそく", "secret": "ひみつ",
    "surprise": "おどろき", "chance": "チャンス",
    "energy": "エネルギー", "health": "けんこう",
    "disease": "びょうき", "medicine": "くすり",
    "accident": "じこ", "danger": "きけん", "safety": "あんぜん",
    "mistake": "まちがい", "success": "せいこう",
    "address": "じゅうしょ", "distance": "きょり",
    "direction": "ほうこう", "destination": "もくてきち",
    "price": "ねだん", "sale": "セール", "discount": "ディスカウント",
    "cash": "げんきん", "hobby": "しゅみ",
    "report": "レポート", "essay": "エッセイ",
    "article": "きじ", "magazine": "ざっし",
    "newspaper": "しんぶん", "assignment": "かだい",
    "lecture": "こうぎ", "meeting": "かいぎ",
    "souvenir": "おみやげ",
    "product": "せいひん",

    // ---- adverbs ----
    "very": "とても", "really": "ほんとうに", "too": "〜すぎる / 〜も",
    "also": "また", "only": "〜だけ", "just": "ちょうど",
    "almost": "ほとんど", "even": "〜さえ",
    "well": "よく / うまく", "fast": "はやく",
    "slowly": "ゆっくり", "carefully": "ちゅういして",
    "forever": "ずっと", "actually": "じっさい",
    "finally": "ついに", "recently": "さいきん",
    "probably": "たぶん", "certainly": "たしかに",
    "instead": "かわりに", "together": "いっしょに",

    // ---- expanded L3/L4 vocab ----
    "lawyer": "べんごし", "judge": "さいばんかん",
    "engineer": "エンジニア", "programmer": "プログラマー",
    "designer": "デザイナー", "author": "さっか",
    "actor": "はいゆう", "actress": "じょゆう",
    "model": "モデル", "coach": "コーチ",
    "soldier": "へいし", "sailor": "ふなのり",
    "referee": "しんぱん", "barber": "とこや",
    "lamp": "ランプ", "pillow": "まくら", "blanket": "ブランケット",
    "shelf": "たな", "closet": "クローゼット",
    "fan": "せんぷうき", "heater": "ヒーター",
    "sink": "ながしだい", "stove": "コンロ",
    "oven": "オーブン", "microwave": "でんしレンジ",
    "washing machine": "せんたくき", "vacuum": "そうじき",
    "yacht": "ヨット", "submarine": "せんすいかん",
    "sled": "そり", "tram": "ろめんでんしゃ",
    "scooter": "スクーター", "skateboard": "スケボー",
    "headache": "ずつう", "fever": "ねつ",
    "cough": "せき", "sneeze": "くしゃみ",
    "stomachache": "ふくつう", "toothache": "はいた",
    "dizzy": "めまい", "allergy": "アレルギー",
    "appointment": "よやく", "holiday": "しゅくじつ",
    "vacation": "きゅうか", "birthday": "たんじょうび",
    "wedding": "けっこんしき", "graduation": "そつぎょう",
    "picnic": "ピクニック", "party": "パーティー",
    "election": "せんきょ", "government": "せいふ",
    "president": "だいとうりょう", "prime minister": "しゅしょう",
    "citizen": "こくみん", "population": "じんこう",
    "religion": "しゅうきょう", "technology": "ぎじゅつ",
    "invention": "はつめい", "discovery": "はっけん",
    "research": "けんきゅう", "experiment": "じっけん",
    "solution": "かいけつ", "pollution": "おせん",
    "recycling": "リサイクル", "donation": "きふ",
    "charity": "じぜん", "argument": "ぎろん",
    "opinion": "いけん", "fact": "じじつ",
    "statement": "せいめい", "evidence": "しょうこ",
    "rumor": "うわさ", "advice": "アドバイス",
    "suggestion": "ていあん", "request": "リクエスト",
    "complaint": "くじょう", "compliment": "ほめことば",
    "earthquake": "じしん (地震[じしん])", "typhoon": "たいふう",
    "flood": "こうずい", "emergency": "きんきゅう",
    "rescue": "きゅうじょ", "risk": "リスク",
    "benefit": "メリット", "advantage": "ゆうり",
    "disadvantage": "ふり", "choice": "せんたく",
    "decision": "けってい", "plan": "けいかく",
    "goal": "もくひょう", "wish": "ねがい",
    "effort": "どりょく", "practice": "れんしゅう",
    "develop": "はったつする", "improve": "じょうたつする",
    "invent": "はつめいする", "discover": "はっけんする",
    "solve": "かいけつする", "respect": "そんけい",
    "realize": "じつげんする", "communicate": "つたえる",
    "translate": "ほんやくする", "calculate": "けいさんする",
    "measure": "はかる", "compare": "くらべる",
    "compete": "きそう", "celebrate": "いわう",
    "gather": "あつまる", "produce": "せいさんする",
    "consume": "しょうひする", "import": "ゆにゅう",
    "export": "ゆしゅつ", "natural": "しぜんな",
    "artificial": "じんこうの", "original": "オリジナル",
    "typical": "ふつうの", "unique": "ゆいつ",
    "complex": "ふくざつ", "simple": "かんたん",
    "common": "ふつう", "rare": "めずらしい",
    "valuable": "かちある", "useful": "やくにたつ",
    "useless": "やくにたたない", "available": "つかえる",
    "impossible": "ふかのう", "possible": "かのう",
    "necessary": "ひつよう",

    // ---- phrasal verb chunks ----
    "get up": "おきる", "wake up": "めをさます",
    "look up": "みあげる / しらべる", "stand up": "たちあがる",
    "take off": "ぬぐ / りりくする", "put on": "(ふくを) きる",
    "looking for": "さがしている", "looking at": "みている",
    "run around": "はしりまわる", "turn on": "(でんきを) つける",
    "turn off": "けす", "turn up": "おとを大きくする",
    "pick / up": "むかえに行く / ひろう", "fell down": "ころんだ",
    "give up": "あきらめる", "wakes up": "おきる (he/she)",
    "gets up": "おきる (he/she)",

    // ---- phrasal extras ----
    "be": "be (げんけい)", "will be": "〜になる (みらい)",
    "will go": "いく つもり (みらい)",

    // ---- expanded L0/L1 picture vocab missing entries ----
    "wolf": "おおかみ", "deer": "しか", "squirrel": "リス",
    "owl": "ふくろう", "eagle": "わし", "penguin": "ペンギン",
    "whale": "くじら", "dolphin": "イルカ", "shark": "サメ",
    "octopus": "タコ", "crab": "かに",
    "spider": "くも", "butterfly": "ちょうちょ",
    "zebra": "シマウマ", "camel": "らくだ",
    "kangaroo": "カンガルー", "dinosaur": "きょうりゅう",
    "dragon": "ドラゴン", "tortoise": "リクガメ",
    "potato": "じゃがいも", "tomato": "トマト",
    "carrot": "にんじん", "onion": "たまねぎ",
    "mushroom": "きのこ", "corn": "とうもろこし",
    "broccoli": "ブロッコリー", "cucumber": "きゅうり",
    "pepper": "ピーマン", "pineapple": "パイナップル",
    "mango": "マンゴー", "coconut": "ココナッツ",
    "watermelon": "すいか", "peach": "もも", "pear": "なし",
    "lemon": "レモン", "cherry": "さくらんぼ",
    "donut": "ドーナツ", "popcorn": "ポップコーン",
    "sandwich": "サンドイッチ", "fries": "フライドポテト",
    "hot dog": "ホットドッグ", "spaghetti": "スパゲッティ",
    "husband": "おっと", "wife": "つま", "son": "むすこ",
    "daughter": "むすめ", "cousin": "いとこ",
    "nephew": "おい", "niece": "めい", "twin": "ふたご",
    "calendar": "カレンダー",
    "whiteboard": "ホワイトボード", "marker": "マーカー",
    "stapler": "ホッチキス", "folder": "フォルダー",
    "envelope": "ふうとう", "calculator": "でんたく",
    "microscope": "けんびきょう",
    "storm": "あらし", "lightning": "いなずま",
    "fog": "きり", "hail": "ひょう", "dawn": "よあけ",
    "dusk": "ゆうぐれ", "rainbow": "にじ",
    "chess": "チェス", "yoga": "ヨガ", "karate": "からて",
    "painting": "ペインティング", "photo": "しゃしん",
    "theater": "えんげき", "gardening": "ガーデニング",
    "airport": "くうこう", "museum": "はくぶつかん",
    "temple": "おてら", "shrine": "じんじゃ",
    "bridge": "はし", "castle": "しろ", "bank": "ぎんこう",
    "post office": "ゆうびんきょく", "church": "きょうかい",
    "movie theater": "えいがかん", "aquarium": "すいぞくかん",
    "scarf": "マフラー", "belt": "ベルト",
    "watch": "とけい / じっと みる", "ring": "ゆびわ",
    "glasses": "めがね", "mask": "マスク",
    "umbrella": "かさ",
  };

  // ===== HELPERS =====

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  }
  // Same furigana renderer the rest of the codebase uses (漢字[よみ] → ruby).
  // We don't import it because lessons.js loads early; replicate inline.
  function furi(s) {
    if (!s) return "";
    return String(s).replace(/([一-鿿々ヶ]+)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
  }
  function lookup(en) {
    if (!en) return null;
    const key = String(en).toLowerCase().trim().replace(/[.!?,;:]+$/, "");
    return DICT[key] || null;
  }
  // Tokenize an English sentence into lookup-friendly word/phrase tokens.
  // Tries 2-word combos first ("ice cream", "good morning") so multi-word
  // entries in DICT can match.
  function tokenize(s) {
    if (!s) return [];
    const cleaned = String(s).toLowerCase().replace(/[—–_]/g, " ").replace(/[.!?,;:]/g, " ");
    const raw = cleaned.split(/\s+/).filter(Boolean);
    const out = [];
    for (let i = 0; i < raw.length; i++) {
      const two = raw[i] + " " + (raw[i+1] || "");
      if (DICT[two]) { out.push(two); i++; continue; }
      out.push(raw[i]);
    }
    return out;
  }
  // Pull every English-looking string from a question (prompt + options + audio)
  // and return the deduped list of lookup-able words.
  function wordsFromQuestion(q) {
    const seen = new Set();
    const result = [];
    const add = (en) => {
      if (!en) return;
      const key = String(en).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      result.push(en);
    };
    if (typeof q.audio === "string") add(q.audio);
    if (typeof q.prompt === "string") tokenize(q.prompt).forEach(add);
    if (Array.isArray(q.options)) q.options.forEach(o => {
      if (typeof o === "string" && /^[a-zA-Z]/.test(o.trim())) tokenize(o).forEach(add);
    });
    return result;
  }
  // Build the words-list block: "EN — JP". Skips words not in the dictionary.
  function wordList(words) {
    const items = [];
    for (const w of words) {
      const jp = lookup(w);
      if (!jp) continue;
      items.push({ en: w, jp });
    }
    return items;
  }
  function correctAnswerOf(q) {
    if (!q || !Array.isArray(q.options)) return null;
    return q.options[q.answer];
  }

  // ===== LESSON BUILDERS =====
  // Each builder returns { intro, words, grammar, examples, tip }.
  // intro is a 1-line headline; words is [{en,jp}]; grammar is HTML with furigana;
  // examples is [{en,jp}]; tip is a short memory hook.

  function vocabLesson(q) {
    // Generic vocabulary lesson: list every option's meaning so the kid
    // can match the prompt to the right option themselves. We do NOT mark
    // which option is correct — that would let impatient kids skip the
    // lesson and just tap the tagged answer. Reading + matching the
    // meaning IS the lesson.
    const items = [];
    const seen = new Set();
    if (Array.isArray(q.options)) {
      for (const o of q.options) {
        if (typeof o !== "string") continue;
        const key = o.toLowerCase();
        if (seen.has(key)) continue; seen.add(key);
        const jp = lookup(o);
        if (jp) items.push({ en: o, jp });
      }
    }
    // Audio target also surfaced for listening questions (the kid hears a
    // word and needs to know its meaning to identify the correct option).
    if (q.audio && typeof q.audio === "string" && !seen.has(q.audio.toLowerCase())) {
      const jp = lookup(q.audio);
      if (jp) items.unshift({ en: q.audio, jp, audio: true });
    }
    return {
      intro: "ことばを ひとつずつ おぼえよう！",
      words: items,
      grammar: "",
      examples: [],
      tip: "ことばの いみを 読[よ]んで、こたえに あう ものを えらぼう。"
    };
  }

  function alphabetLesson(q) {
    return {
      intro: "アルファベットの もじ あて！",
      words: [],
      grammar:
        `英語[えいご]の アルファベットには、大文字[おおもじ] (A B C…) と 小文字[こもじ] (a b c…) が あるよ。\n` +
        `🔊の おとを よく きいて、おなじ もじを えらぼう。\n` +
        `はやい ときは「もういっかい」を タップしてね。`,
      examples: [
        { en: "A apple", jp: "A は アップル の A" },
        { en: "B banana", jp: "B は バナナ の B" },
        { en: "C cat", jp: "C は キャット (ねこ) の C" },
      ],
      tip: "26文字[もじ] ぜんぶ おぼえると、英語[えいご]の ことばが よめるよ！"
    };
  }

  function phonicsLesson(q) {
    return {
      intro: "フォニックス！もじの 音[おと]！",
      words: [],
      grammar:
        `フォニックスは「もじが だす 音[おと]」を おぼえる ほうほうだよ。\n` +
        `たとえば B は 「ブッ」と 音[おと]が なる。 banana の はじめの 音[おと]だね。\n` +
        `しつもんの 音[おと]を きいたら、その 音[おと]を だす もじを えらぼう。`,
      examples: [
        { en: "C → クッ (cat)", jp: "C は ねこ の はじめの 音[おと]" },
        { en: "S → スッ (sun)", jp: "S は たいよう の はじめの 音[おと]" },
        { en: "M → ムッ (mom)", jp: "M は ママ の はじめの 音[おと]" },
      ],
      tip: "音[おと]を おぼえると、よんだ ことの ない ことばも よめるように なるよ！"
    };
  }

  function cvcLesson(q) {
    return {
      intro: "CVC ことば: 子音[しいん]+母音[ぼいん]+子音[しいん]！",
      words: [],
      grammar:
        `CVCは、子音[しいん] (C) + 母音[ぼいん] (V) + 子音[しいん] (C) の 3つの 音[おと]で できた ことば。\n` +
        `たとえば cat = C(ク)+A(ア)+T(トゥ) → 「キャット」。\n` +
        `1つずつ 音[おと]を つなげて よんでみよう。\n`,
      examples: [
        { en: "cat 🐱", jp: "C+A+T → ク・ア・トゥ → キャット (ねこ)" },
        { en: "dog 🐶", jp: "D+O+G → ドゥ・オ・グッ → ドッグ (いぬ)" },
        { en: "sun ☀️", jp: "S+U+N → スッ・ア・ンッ → サン (たいよう)" },
      ],
      tip: "音[おと]を ゆっくり つなげる れんしゅうを すると、はじめての ことばも よめるよ！"
    };
  }

  function beLesson(q) {
    return {
      intro: "be どうし (am / is / are)",
      words: [
        { en: "am", jp: "です (I の とき)" },
        { en: "is", jp: "です (he/she/it の とき)" },
        { en: "are", jp: "です (you/we/they の とき)" },
      ],
      grammar:
        `英語[えいご]の「です」は しゅご (だれが) で かわるよ。\n\n` +
        `• I → am  (I am Yuki. = わたしは ユキです)\n` +
        `• He / She / It → is  (She is happy. = かのじょは うれしい)\n` +
        `• You / We / They → are  (They are friends. = かれらは ともだち)`,
      examples: [
        { en: "I am ten years old.", jp: "わたしは 10さい です。" },
        { en: "He is my dad.", jp: "かれは わたしの おとうさん です。" },
        { en: "We are happy.", jp: "わたしたちは うれしい です。" },
      ],
      tip: "I → am, He/She/It → is, You/We/They → are。3つ おぼえれば OK！"
    };
  }

  function pronLesson(q) {
    return {
      intro: "代名詞[だいめいし] (I / my / he / his...)",
      words: [
        { en: "I", jp: "わたしは" }, { en: "you", jp: "あなたは" },
        { en: "he", jp: "かれは" }, { en: "she", jp: "かのじょは" },
        { en: "we", jp: "わたしたちは" }, { en: "they", jp: "かれらは" },
        { en: "my", jp: "わたしの" }, { en: "your", jp: "あなたの" },
        { en: "his", jp: "かれの" }, { en: "her", jp: "かのじょの" },
      ],
      grammar:
        `英語[えいご]の 代名詞[だいめいし]は 2しゅるい あるよ:\n\n` +
        `① しゅごの かたち (だれが する?)\n` +
        `   I (わたし), You (あなた), He (かれ), She (かのじょ), We (わたしたち), They (かれら)\n\n` +
        `② しょゆうの かたち (だれの?)\n` +
        `   my (わたしの), your (あなたの), his (かれの), her (かのじょの)`,
      examples: [
        { en: "I am Yuki. This is my pen.", jp: "わたしは ユキです。これは わたしの ペンです。" },
        { en: "He is tall. His bag is red.", jp: "かれは せが たかい。 かれの かばんは あかい。" },
      ],
      tip: "「だれが」=I/he/she、「だれの」=my/his/her の ペアで おぼえよう。"
    };
  }

  function aanLesson(q) {
    return {
      intro: "a と an の つかいかた",
      words: [
        { en: "a", jp: "ひとつの (子音[しいん]の まえ)" },
        { en: "an", jp: "ひとつの (母音[ぼいん]の まえ)" },
      ],
      grammar:
        `「ひとつの」を いう とき、つぎの ことばの 音[おと]で a か an が きまる:\n\n` +
        `• 母音[ぼいん] (a, e, i, o, u) で はじまる → an\n` +
        `   an apple, an egg, an orange, an umbrella, an elephant\n\n` +
        `• 子音[しいん] (それ いがい) で はじまる → a\n` +
        `   a cat, a dog, a book, a pen`,
      examples: [
        { en: "an apple, a banana", jp: "リンゴ (an) と バナナ (a)" },
        { en: "an egg, a dog", jp: "たまご (an) と いぬ (a)" },
      ],
      tip: "ぼいん (あ・い・う・え・お)の 音[おと] で はじまったら an！"
    };
  }

  function pluralLesson(q) {
    return {
      intro: "ふくすうけい (ふたつ いじょう)",
      words: [],
      grammar:
        `英語[えいご]では、ものが 2つ いじょう あると ことばの かたちが かわるよ:\n\n` +
        `① ふつう → -s をつける  (cat → cats, dog → dogs)\n` +
        `② -s, -x, -ch, -sh で おわる → -es  (bus → buses, box → boxes)\n` +
        `③ -y で おわる (子音[しいん]+y) → y を i に かえて -es  (baby → babies)\n` +
        `④ ふくすうけいが ぜんぜん ちがう (ふきそく):\n` +
        `   child → children, foot → feet, tooth → teeth, mouse → mice, fish → fish\n\n`,
      examples: [
        { en: "one cat → two cats", jp: "ねこ 1ぴき → ねこ 2ひき" },
        { en: "one box → two boxes", jp: "はこ 1つ → はこ 2つ" },
        { en: "one child → two children", jp: "こども 1にん → こども 2にん" },
      ],
      tip: "ふきそく (children, feet, teeth, mice, fish, men, women) は おぼえる しか ない！"
    };
  }

  function thisThatLesson(q) {
    return {
      intro: "this / that / these / those",
      words: [
        { en: "this", jp: "これ (ちかい・1つ)" },
        { en: "that", jp: "あれ (とおい・1つ)" },
        { en: "these", jp: "これら (ちかい・たくさん)" },
        { en: "those", jp: "あれら (とおい・たくさん)" },
      ],
      grammar:
        `近[ちか]い・遠[とお]い と、1つ・たくさん の くみあわせで えらぶよ:\n\n` +
        `         | 1つ    | たくさん\n` +
        `近[ちか]い | this  | these\n` +
        `遠[とお]い | that  | those\n\n`,
      examples: [
        { en: "This is my pen.", jp: "これは わたしの ペンです。 (ちかい・1つ)" },
        { en: "Those are her shoes.", jp: "あれらは かのじょの くつです。 (とおい・たくさん)" },
      ],
      tip: "ちかい→ th-IS / th-ESE、とおい→ th-AT / th-OSE。-S が つく ほうが ちかい！"
    };
  }

  function presentLesson(q) {
    return {
      intro: "現在[げんざい]けい (いつもの こと)",
      words: [],
      grammar:
        `「いつも・ふだん」する ことを いう ときは、どうしの 現在[げんざい]けい を つかうよ。\n\n` +
        `• I / You / We / They → どうしの げんけい\n` +
        `   I like apples. (わたしは リンゴが すき)\n\n` +
        `• He / She / It → どうしに -s を つける！\n` +
        `   She likes apples. (かのじょは リンゴが すき)\n` +
        `   He goes to school. (go → goes)\n` +
        `   It has a tail. (have → has)\n\n`,
      examples: [
        { en: "I play soccer.", jp: "わたしは サッカーを する。" },
        { en: "She plays soccer.", jp: "かのじょは サッカーを する。 (-s が つく)" },
        { en: "He goes to school.", jp: "かれは 学校[がっこう]へ いく。" },
      ],
      tip: "He / She / It → どうしに -s。 これだけ ちゅうい！"
    };
  }

  function presContLesson(q) {
    return {
      intro: "現在[げんざい]しんこうけい (いま 〜している)",
      words: [],
      grammar:
        `「いま、まさに している こと」 は be どうし + どうし-ing で あらわすよ。\n\n` +
        `• I am playing. (いま あそんでいる)\n` +
        `• She is reading. (いま よんでいる)\n` +
        `• They are eating. (いま たべている)\n\n` +
        `be どうしは I→am, He/She/It→is, You/We/They→are。\n`,
      examples: [
        { en: "I am studying English now.", jp: "わたしは いま 英語[えいご]を べんきょう している。" },
        { en: "He is sleeping.", jp: "かれは ねている。" },
      ],
      tip: "be (am/is/are) + -ing。 「いま」のことを いう ときの かたち！"
    };
  }

  function pastLesson(q) {
    return {
      intro: "過去[かこ]けい (きのうの こと)",
      words: [
        { en: "yesterday", jp: "きのう" },
        { en: "last night", jp: "ゆうべ" },
        { en: "last week", jp: "せんしゅう" },
      ],
      grammar:
        `「きのう」 「せんしゅう」 など、すんだ ことを いう ときは 過去[かこ]けい!\n\n` +
        `① ふつう → -ed をつける\n` +
        `   play → played, watch → watched, talk → talked\n\n` +
        `② ふきそく動詞[どうし] → かたちが ぜんぜん ちがう\n` +
        `   go → went, eat → ate, do → did, see → saw, make → made,\n` +
        `   come → came, take → took, get → got, run → ran,\n` +
        `   read → read (はつおんが「レッド」), write → wrote\n\n` +
        `③ be どうしの 過去[かこ]けい\n` +
        `   I/he/she/it → was, you/we/they → were\n\n`,
      examples: [
        { en: "I ate pizza yesterday.", jp: "きのう ピザを たべた。" },
        { en: "She went to school.", jp: "かのじょは 学校[がっこう]に いった。" },
        { en: "They were happy.", jp: "かれらは うれしかった。" },
      ],
      tip: "ふきそく (went, ate, did, saw, was, were…) は おぼえる！"
    };
  }

  function pastContLesson(q) {
    return {
      intro: "過去[かこ]しんこうけい (そのとき 〜していた)",
      words: [],
      grammar:
        `「そのとき、〜していた」 は was/were + -ing で あらわす。\n\n` +
        `• I was sleeping at 9pm. (9じに ねていた)\n` +
        `• They were playing soccer. (サッカーを していた)\n\n`,
      examples: [
        { en: "I was watching TV.", jp: "わたしは テレビを みていた。" },
        { en: "She was studying.", jp: "かのじょは べんきょう していた。" },
      ],
      tip: "was/were + -ing。 「そのとき まっさいちゅう」 の かたち！"
    };
  }

  function futureLesson(q) {
    return {
      intro: "未来[みらい]けい (あした の こと)",
      words: [
        { en: "tomorrow", jp: "あした" },
        { en: "next week", jp: "らいしゅう" },
        { en: "someday", jp: "いつか" },
      ],
      grammar:
        `「あした」「らいしゅう」など、これから する ことは will + 動詞[どうし]の げんけい。\n\n` +
        `• I will go tomorrow. (あした いく)\n` +
        `• She will visit Kyoto. (きょうとに いく)\n` +
        `• We will be friends. (わたしたちは ともだちに なる)\n\n` +
        `しゅごが なんでも will の かたちは いっしょ。\n` +
        `「will not」は「won't」と みじかく いえる。\n\n`,
      examples: [
        { en: "It will rain tomorrow.", jp: "あした あめが ふる。" },
        { en: "I will help you.", jp: "あなたを てつだう。" },
      ],
      tip: "「あした」「らいしゅう」を みつけたら will！"
    };
  }

  function canLesson(q) {
    return {
      intro: "can / can't (できる / できない)",
      words: [
        { en: "can", jp: "できる" },
        { en: "can't", jp: "できない" },
      ],
      grammar:
        `「できる」 「できない」を いう ときは can / can't を つかうよ。\n\n` +
        `• I can swim. (およげる)\n` +
        `• A fish can't walk. (さかなは あるけない)\n` +
        `• Can you sing? — Yes, I can. (うたえる？ はい、うたえる。)\n\n` +
        `can / can't の あとは どうしの げんけい！\n` +
        `しゅごで かたちが かわらない (he can も she can も いっしょ)。\n\n`,
      examples: [
        { en: "Birds can fly.", jp: "とりは とべる。" },
        { en: "I can't read kanji.", jp: "わたしは かんじを よめない。" },
      ],
      tip: "can = できる、can't = できない。 あとは どうしの げんけい！"
    };
  }

  function shouldLesson(q) {
    return {
      intro: "should / shouldn't (したほうがいい)",
      words: [
        { en: "should", jp: "〜したほうが いい" },
        { en: "shouldn't", jp: "〜しないほうが いい" },
      ],
      grammar:
        `「〜したほうが いい」「〜しないほうが いい」を いう ときに つかうよ。\n\n` +
        `• You should eat vegetables. (やさいを たべたほうが いい)\n` +
        `• You shouldn't run inside. (なかで はしらないほうが いい)\n\n` +
        `should / shouldn't の あとも どうしの げんけい！\n\n`,
      examples: [
        { en: "You should help your mom.", jp: "ママを てつだったほうが いい。" },
        { en: "We shouldn't be late.", jp: "おくれないほうが いい。" },
      ],
      tip: "should = アドバイス。 「〜したほうが いいよ」 と おしえる ことば。"
    };
  }

  function wantLesson(q) {
    return {
      intro: "want to / wants to / don't want to",
      words: [
        { en: "want to", jp: "〜したい" },
        { en: "wants to", jp: "〜したい (he/she/it)" },
        { en: "don't want to", jp: "〜したくない" },
        { en: "doesn't want to", jp: "〜したくない (he/she/it)" },
      ],
      grammar:
        `「〜したい」 は want to + 動詞[どうし]の げんけい!\n\n` +
        `• I want to eat ice cream. (アイスを たべたい)\n` +
        `• She wants to play. (かのじょは あそびたい — -s に きをつけて！)\n` +
        `• I don't want to go. (いきたくない)\n` +
        `• He doesn't want to study. (かれは べんきょう したくない)\n\n`,
      examples: [
        { en: "I want to be a doctor.", jp: "いしゃに なりたい。" },
        { en: "He doesn't want to eat.", jp: "かれは たべたくない。" },
      ],
      tip: "He/She/It → wants to / doesn't want to。 ふつうの -s ルールと いっしょ！"
    };
  }

  function prepLesson(q) {
    return {
      intro: "前置詞[ぜんちし] (in / on / under など)",
      words: [
        { en: "in", jp: "〜の なかに" },
        { en: "on", jp: "〜の うえに (せっして)" },
        { en: "under", jp: "〜の したに" },
        { en: "next to", jp: "〜の となりに" },
        { en: "at", jp: "〜で / 〜に" },
        { en: "by", jp: "〜の そばで" },
      ],
      grammar:
        `ばしょを あらわす ことばを 前置詞[ぜんちし] と いうよ。\n\n` +
        `• in = なかに  (in the box, in the sky)\n` +
        `• on = うえに、ふれている  (on the desk, on the wall)\n` +
        `• under = したに  (under the chair)\n` +
        `• next to = となりに  (next to the dog)\n\n`,
      examples: [
        { en: "The cat is in the box.", jp: "ねこは はこの なかに いる。" },
        { en: "The book is on the desk.", jp: "ほんは つくえの うえ。" },
        { en: "The ball is under the chair.", jp: "ボールは いすの した。" },
      ],
      tip: "in (なか), on (うえ), under (した), next to (となり) — え で おぼえよう！"
    };
  }

  function whLesson(q) {
    return {
      intro: "WH しつもん (なに・だれ・どこ・いつ・なぜ・どう)",
      words: [
        { en: "what", jp: "なに / なん" },
        { en: "who", jp: "だれ" },
        { en: "where", jp: "どこ" },
        { en: "when", jp: "いつ" },
        { en: "why", jp: "なぜ" },
        { en: "how", jp: "どう / どのくらい" },
        { en: "which", jp: "どちら" },
        { en: "whose", jp: "だれの" },
      ],
      grammar:
        `しつもんは こたえに よって 使[つか]う ことばが ちがうよ:\n\n` +
        `• What → もの・こと   (What is this? — A book.)\n` +
        `• Who → ひと          (Who is that? — My dad.)\n` +
        `• Where → ばしょ      (Where do you live? — In Tokyo.)\n` +
        `• When → とき         (When is your birthday?)\n` +
        `• Why → りゆう        (Why are you sad?)\n` +
        `• How → ほうほう・じょうたい  (How are you? — Fine.)\n` +
        `• How many → かず     (How many cats? — Three.)\n` +
        `• How old → とし      (How old are you? — Ten.)\n\n`,
      examples: [
        { en: "What color is it?", jp: "なにいろ？" },
        { en: "Where is the bag?", jp: "かばんは どこ？" },
      ],
      tip: "こたえの しゅるいで えらぶ。 「もの? → What」「ひと? → Who」「ばしょ? → Where」"
    };
  }

  function qaLesson(q) {
    return {
      intro: "しつもんと こたえ",
      words: wordList(wordsFromQuestion(q)),
      grammar:
        `しつもんに ぴったりの こたえを えらぼう。\n\n` +
        `• What's this? — It's a 〜.  (なに？ — 〜です。)\n` +
        `• How are you? — I'm fine.   (げんき？ — げんきです。)\n` +
        `• Where do you live? — In 〜.\n` +
        `• Do you 〜? — Yes, I do. / No, I don't.\n` +
        `• Can you 〜? — Yes, I can. / No, I can't.\n\n` +
        `しつもんの ことばに あう こたえを えらぼう。\n`,
      examples: [
        { en: "Do you like pizza? — Yes, I do.", jp: "ピザ すき? — うん、すき。" },
        { en: "What time is it? — It's 3 o'clock.", jp: "なんじ? — 3じ。" },
      ],
      tip: "Do → Yes, I do, Can → Yes, I can。 しつもんの ことばを そのまま こたえる！"
    };
  }

  function thereIsLesson(q) {
    return {
      intro: "there is / there are (〜が ある)",
      words: [
        { en: "there is", jp: "〜が ある (1つ)" },
        { en: "there are", jp: "〜が ある (たくさん)" },
      ],
      grammar:
        `「〜が ある」「〜が いる」 は there is / there are で あらわすよ。\n\n` +
        `• 1つ なら there is\n` +
        `   There is a cat in the box.\n` +
        `• たくさん なら there are\n` +
        `   There are three cats.\n\n`,
      examples: [
        { en: "There is a book on the desk.", jp: "つくえに ほんが ある。" },
        { en: "There are many people.", jp: "ひとが たくさん いる。" },
      ],
      tip: "1つ → is、 2つ いじょう → are！"
    };
  }

  function compareLesson(q) {
    return {
      intro: "比較[ひかく] (くらべる)",
      words: [],
      grammar:
        `くらべる ときの かたち:\n\n` +
        `① ふつう → 形容詞[けいようし] + -er than 〜  (taller than, faster than)\n` +
        `② -y で おわる → y を i に かえて -er  (happy → happier)\n` +
        `③ 長[なが]い ことば → more 〜 than  (more beautiful than)\n` +
        `④ いちばん 〜 → the -est / the most 〜\n` +
        `   tall → the tallest, beautiful → the most beautiful\n\n`,
      examples: [
        { en: "I am taller than my brother.", jp: "おとうとより せが たかい。" },
        { en: "She is the tallest in class.", jp: "クラスで いちばん せが たかい。" },
      ],
      tip: "2つ くらべる → -er than、 いちばん → the -est！"
    };
  }

  function freqLesson(q) {
    return {
      intro: "ひんどの ふくし (always / often / sometimes…)",
      words: [
        { en: "always", jp: "いつも (100%)" },
        { en: "usually", jp: "たいてい (90%)" },
        { en: "often", jp: "よく (70%)" },
        { en: "sometimes", jp: "ときどき (50%)" },
        { en: "rarely", jp: "あまり〜ない (10%)" },
        { en: "never", jp: "ぜったい〜ない (0%)" },
      ],
      grammar:
        `どのくらい よく する かを あらわす ふくし。\n` +
        `ふつう be どうしの あとに、または いっぱんどうしの まえに おくよ。\n\n` +
        `• I am always happy.\n` +
        `• She often plays tennis.\n` +
        `• They never eat fish.\n\n`,
      examples: [
        { en: "I sometimes go to the park.", jp: "ときどき こうえんに いく。" },
      ],
      tip: "100→0% で じゅんに: always, usually, often, sometimes, rarely, never"
    };
  }

  function modalLesson(q) {
    return {
      intro: "ほじょどうし (must / may / might / could…)",
      words: [
        { en: "must", jp: "〜しなければ ならない" },
        { en: "may", jp: "〜してもよい / かもしれない" },
        { en: "might", jp: "〜かもしれない" },
        { en: "could", jp: "できた / できそう" },
        { en: "would", jp: "〜だろう / 〜したい" },
      ],
      grammar:
        `動詞[どうし]に いみを たす ことば:\n\n` +
        `• must = ぜったいに 〜しなければ ならない\n` +
        `• may = 〜してもよい / 〜かもしれない\n` +
        `• might = もしかしたら 〜かもしれない\n` +
        `• could = 〜できた / 〜できそう (can の かこ・ていねい)\n` +
        `• would = 〜だろう / Would you 〜? (おねがい)\n\n` +
        `これらの あとは いつも 動詞[どうし]の げんけい!\n`,
      examples: [
        { en: "You must wash your hands.", jp: "てを あらわなければ ならない。" },
        { en: "It might rain.", jp: "あめが ふるかも しれない。" },
      ],
      tip: "must (ぜったい) > should (したほうがいい) > may (してもいい) の つよさで おぼえる！"
    };
  }

  function tprepLesson(q) {
    return {
      intro: "じかんの 前置詞[ぜんちし] (at / in / on)",
      words: [
        { en: "at", jp: "〜時[じ]に (じかんの 1てん)" },
        { en: "in", jp: "〜月[がつ]・〜年[ねん]に (ながい)" },
        { en: "on", jp: "〜曜日[ようび]・〜日[にち]に" },
      ],
      grammar:
        `じかんを いう ときの えらびかた:\n\n` +
        `• at + じこく     (at 3 o'clock, at noon)\n` +
        `• on + ようび・ひ  (on Monday, on May 5)\n` +
        `• in + つき・とし・きせつ  (in May, in 2026, in summer)\n\n`,
      examples: [
        { en: "School starts at 8.", jp: "学校[がっこう]は 8じに はじまる。" },
        { en: "I was born in May.", jp: "5がつに うまれた。" },
        { en: "We meet on Sunday.", jp: "にちようびに あう。" },
      ],
      tip: "じこく→at、ようび・ひ→on、つき・とし→in。 みじかい→at、ながい→in！"
    };
  }

  function condLesson(q) {
    return {
      intro: "if / when (もし 〜なら)",
      words: [
        { en: "if", jp: "もし 〜なら" },
        { en: "when", jp: "〜の とき" },
      ],
      grammar:
        `「もし 〜なら、…」を いう とき if を つかうよ。\n\n` +
        `• If it rains, I will stay home. (もし あめなら、いえに いる)\n\n` +
        `たいせつな ルール: if の あとは みらいの ことでも 現在[げんざい]けい!\n` +
        `× If it will rain ✗\n` +
        `○ If it rains ✓\n\n`,
      examples: [
        { en: "If you study, you will pass.", jp: "べんきょう すれば うかる。" },
        { en: "When I see her, I will tell her.", jp: "あったら つたえる。" },
      ],
      tip: "if + 現在[げんざい]けい , しゅぶん will。 みらいでも if の あとは 現在[げんざい]けい！"
    };
  }

  function conjLesson(q) {
    return {
      intro: "せつぞくし (and / but / or / so / because)",
      words: [
        { en: "and", jp: "そして" }, { en: "but", jp: "でも・しかし" },
        { en: "or", jp: "または" }, { en: "so", jp: "だから" },
        { en: "because", jp: "なぜなら" },
      ],
      grammar:
        `ぶんを つなぐ ことば:\n\n` +
        `• and (そして) — 2つ ならべる\n` +
        `• but (でも) — はんたいの こと\n` +
        `• or (または) — どちらか\n` +
        `• so (だから) — けっか\n` +
        `• because (なぜなら) — りゆう\n\n`,
      examples: [
        { en: "I like cats and dogs.", jp: "ねこと いぬが すき。" },
        { en: "I'm tired, so I'll sleep.", jp: "つかれたから、ねる。" },
        { en: "I'm happy because it's sunny.", jp: "はれだから うれしい。" },
      ],
      tip: "りゆう→ because、けっか→ so。 ペアで おぼえよう！"
    };
  }

  function quantLesson(q) {
    return {
      intro: "りょうの ことば (some / any / many / much)",
      words: [
        { en: "some", jp: "いくつかの (こうていぶん)" },
        { en: "any", jp: "なにか / どれか (ひていぶん・ぎもんぶん)" },
        { en: "many", jp: "たくさんの (かぞえられる)" },
        { en: "much", jp: "たくさんの (かぞえられない)" },
      ],
      grammar:
        `• some — こうていぶん で「いくつかの」  (I have some apples.)\n` +
        `• any — ぎもんぶん や ひていぶん で  (Do you have any?)\n` +
        `• many — かぞえられる ものに  (many books, many cats)\n` +
        `• much — かぞえられない ものに  (much water, much time)\n\n`,
      examples: [
        { en: "I have some money.", jp: "おかねを すこし もっている。" },
        { en: "Do you have any pets?", jp: "ペットを なにか かっている？" },
      ],
      tip: "こうてい → some、 しつもん・ひてい → any。 かぞえられる → many、 みず・じかん など → much。"
    };
  }

  function tagQLesson(q) {
    return {
      intro: "ふかしつもん (〜だね？)",
      words: [],
      grammar:
        `「〜だよね？」 と かくにん する しつもん。\n` +
        `ぶんが プラスなら → タグは マイナス\n` +
        `ぶんが マイナスなら → タグは プラス\n\n` +
        `• You're a student, aren't you?\n` +
        `• She isn't your sister, is she?\n` +
        `• You can swim, can't you?\n\n`,
      examples: [
        { en: "It's hot, isn't it?", jp: "あついね？" },
      ],
      tip: "プラス→マイナスの タグ、 マイナス→プラスの タグ。 はんたいで！"
    };
  }

  function svAgreeLesson(q) {
    return {
      intro: "しゅご・どうし いっち",
      words: [],
      grammar:
        `しゅごの しゅるいで どうしの かたちが きまるよ:\n\n` +
        `• I / You / We / They → どうしの げんけい\n` +
        `• He / She / It → どうしに -s\n\n`,
      examples: [
        { en: "He plays soccer.", jp: "かれは サッカーを する。 (-s)" },
        { en: "We play soccer.", jp: "わたしたちは サッカーを する。" },
      ],
      tip: "He/She/It (1人[にん]) → どうしに -s！"
    };
  }

  function infgerLesson(q) {
    return {
      intro: "to不定詞[ふていし] と 動名詞[どうめいし] (-ing)",
      words: [],
      grammar:
        `「〜すること」を いう とき:\n\n` +
        `① to + 動詞[どうし]の げんけい  (to swim, to read)\n` +
        `   I want to swim. (およぎたい)\n\n` +
        `② 動詞[どうし]+ -ing  (swimming, reading)\n` +
        `   I like swimming. (およぐのが すき)\n\n` +
        `動詞[どうし]に よって どちらが くるか きまる。\n` +
        `• want / hope / decide → to + げんけい\n` +
        `• enjoy / finish / stop → -ing\n` +
        `• like / love → どちらでも OK\n\n`,
      examples: [
        { en: "I want to play.", jp: "あそびたい。 (want → to)" },
        { en: "I enjoy reading.", jp: "よむのが たのしい。 (enjoy → -ing)" },
      ],
      tip: "want → to、 enjoy → -ing。 動詞[どうし]ごとに きまり が ある！"
    };
  }

  function perfectLesson(q) {
    return {
      intro: "現在[げんざい]かんりょうけい (have + 過去[かこ]ぶんし)",
      words: [],
      grammar:
        `「〜したことがある」「もう 〜した」「ずっと 〜している」を あらわすよ。\n\n` +
        `かたち: have / has + 過去[かこ]ぶんし (PP)\n` +
        `   eat → eaten, see → seen, go → gone, do → done, be → been\n\n` +
        `• I have eaten sushi. (おすしを たべたことがある)\n` +
        `• She has lived in Tokyo. (とうきょうに すんでいる)\n\n` +
        `He / She / It → has、 それ いがい → have。\n\n`,
      examples: [
        { en: "I have been to America.", jp: "アメリカに いったことがある。" },
        { en: "He has finished his homework.", jp: "かれは しゅくだいを おえた。" },
      ],
      tip: "have/has + 過去[かこ]ぶんし。 「けいけん」「かんりょう」「けいぞく」 の 3つの いみ！"
    };
  }

  function fillLesson(q) {
    return Object.assign(vocabLesson(q), {
      intro: "ぶんを かんせい させる",
      grammar: "ぶんの あいた ところに あう ことばを えらぼう。 まわりの ことばが ヒント！",
    });
  }

  function orderLesson(q) {
    return Object.assign(vocabLesson(q), {
      intro: "ことばの じゅんばん",
      grammar:
        `英語[えいご]の ふつうの じゅんばんは:\n\n` +
        `しゅご + どうし + めいしか / ばしょ + じかん\n\n` +
        `• I (しゅご) play (どうし) soccer (めいし) at school (ばしょ) every day (じかん).\n\n` +
        `しつもんの かたちは:\n` +
        `• Do / Does + しゅご + どうし …?\n` +
        `• What / Where + do + しゅご + どうし …?`,
      tip: "「だれが」 → 「する」 → 「なにを」 → 「どこで」 → 「いつ」 の じゅん！"
    });
  }

  function readLesson(q) {
    return Object.assign(vocabLesson(q), {
      intro: "よみとり (リーディング)",
      grammar: "ぶんを ゆっくり よんで、しつもんの こたえを さがそう。 わからない ことばは ↓の よみかたを みよう。",
      tip: "むずかしい ことばが あったら、まわりの ことばから いみを そうぞう しよう！"
    });
  }

  function listenLesson(q) {
    return Object.assign(vocabLesson(q), {
      intro: "リスニング (おとから わかる)",
      grammar: "🔊の ボタンで もういちど きこう。 はやい ときは「もういちど」を タップ。",
      tip: "ことばの はじめの 音[おと]を まず きく と わかりやすい よ！"
    });
  }

  function idiomLesson(q) {
    return {
      intro: "イディオム (きまり ことば)",
      words: wordList(wordsFromQuestion(q)),
      grammar:
        `イディオムは「ことばの くみあわせ で とくべつな いみ」になる ものだよ。\n` +
        `1ことばずつ いみを しらべても わからない！\n\n` +
        `• look forward to 〜 = たのしみに している\n` +
        `• be good at 〜 = 〜が とくい\n` +
        `• take care of 〜 = せわを する\n` +
        `• run out of 〜 = なくなる\n\n`,
      examples: [],
      tip: "イディオムは ぶんかい せず ぜんたいで おぼえる！"
    };
  }

  function phrasalLesson(q) {
    return Object.assign(idiomLesson(q), {
      intro: "句動詞[くどうし] (動詞[どうし] + 前置詞[ぜんちし])",
      grammar:
        `動詞[どうし]+ ちいさい ことば で、 とくべつな いみに なる:\n\n` +
        `• get up = おきる\n` +
        `• put on = (ふくを) きる\n` +
        `• take off = ぬぐ / りりくする\n` +
        `• turn on = (でんきを) つける\n` +
        `• turn off = けす\n` +
        `• give up = あきらめる\n` +
        `• look for = さがす\n\n` +
        `組[く]みあわせ ぜんたいで いみを おぼえよう！`,
    });
  }

  function dailyLesson(q) {
    return Object.assign(vocabLesson(q), {
      intro: "にちじょう・かいわ",
      grammar:
        `にちじょうの かいわで よく きく ひょうげん:\n\n` +
        `• What time …? — じかんを きく\n` +
        `• How was 〜? — どうだった？\n` +
        `• Why don't we 〜? — 〜しない？ (さそう)\n` +
        `• I'd like 〜. — 〜が ほしい (ていねい)\n` +
        `• Could you 〜? — 〜してくれる？ (ていねい)`,
    });
  }

  function genericLesson(q) {
    return Object.assign(vocabLesson(q), {
      intro: "ヒント！ ことばの いみ",
    });
  }

  // ===== PTYPE → BUILDER ROUTING =====
  // Vocab patterns (auto-detected by suffix), then dedicated grammar rules.
  function dispatch(q) {
    const p = (q && q.ptype) || "";
    if (/_jp2en$|_en2jp$|_pic$|_pic2en$|_word2pic$|_listen$|_listen_pic$|_listen_word$|_listen_lo$/.test(p)) return vocabLesson(q);
    if (/^vocab/.test(p)) return vocabLesson(q);
    if (/^(animal|food|family|class|weather|hobby|ahobby|place|clothes|body|color|verb|sight|ppl|subj|adj|feel|event|day|month|num|num_jp2en|num_listen|num_ctx|greet|nature|house|trans|job|sport|sight_jp2en|time_jp2en|phrase)/.test(p)) return vocabLesson(q);
    if (/^alpha|^alphabet/.test(p)) return alphabetLesson(q);
    if (p === "phonics") return phonicsLesson(q);
    if (/^cvc/.test(p)) return cvcLesson(q);
    switch (p) {
      case "be":             return beLesson(q);
      case "pron":           return pronLesson(q);
      case "a_an":           return aanLesson(q);
      case "plural":         return pluralLesson(q);
      case "this_that":      return thisThatLesson(q);
      case "present":        return presentLesson(q);
      case "pres_cont":      return presContLesson(q);
      case "past":
      case "past_easy":
      case "past_jp2en":     return pastLesson(q);
      case "past_cont":      return pastContLesson(q);
      case "future":
      case "future_easy":    return futureLesson(q);
      case "can":            return canLesson(q);
      case "should":
      case "should_easy":    return shouldLesson(q);
      case "want":
      case "infger_easy":    return wantLesson(q);
      case "prep":           return prepLesson(q);
      case "tprep":          return tprepLesson(q);
      case "wh":
      case "wh4":            return whLesson(q);
      case "qa":
      case "conv":
      case "conv4":          return qaLesson(q);
      case "there_is":       return thereIsLesson(q);
      case "compare":        return compareLesson(q);
      case "frequency":      return freqLesson(q);
      case "modal":
      case "modal_easy":     return modalLesson(q);
      case "conditional":    return condLesson(q);
      case "conj":           return conjLesson(q);
      case "quant":
      case "some_any":       return quantLesson(q);
      case "tag_q":           return tagQLesson(q);
      case "sv_agree":       return svAgreeLesson(q);
      case "perfect_easy":   return perfectLesson(q);
      case "idiom":
      case "idiom_easy":     return idiomLesson(q);
      case "phrasal":        return phrasalLesson(q);
      case "fill":
      case "gram_fill":
      case "gram4":          return fillLesson(q);
      case "order":
      case "order4":         return orderLesson(q);
      case "read":
      case "long_read":      return readLesson(q);
      case "listen_word":
      case "listen_sent":
      case "listen_resp":
      case "listen_comp":
      case "listen_comp3":
      case "listen_dialogue":
      case "listen_passage": return listenLesson(q);
      case "daily":          return dailyLesson(q);
      case "time":
      case "time_easy":      return tprepLesson(q);
    }
    return genericLesson(q);
  }

  // ===== HTML RENDERING =====

  function renderWordList(items) {
    if (!items || !items.length) return "";
    const rows = items.map(it => `
      <li class="lesson-word">
        <span class="lw-en">${escapeHTML(it.en)}</span>
        <span class="lw-arrow">→</span>
        <span class="lw-jp">${furi(it.jp)}</span>
        ${it.audio ? '<span class="lw-tag">🔊 きいた おと</span>' : ''}
      </li>`).join("");
    return `<ul class="lesson-words">${rows}</ul>`;
  }
  function renderExamples(exs) {
    if (!exs || !exs.length) return "";
    const rows = exs.map(e => `
      <div class="lesson-ex">
        <div class="le-en">${escapeHTML(e.en)}</div>
        <div class="le-jp">${furi(e.jp)}</div>
      </div>`).join("");
    return `<div class="lesson-examples">${rows}</div>`;
  }
  function paragraphize(s) {
    if (!s) return "";
    return escapeHTML(s).split("\n").map(l => l.trim() ? `<p>${furi(l).replace(/&lt;ruby&gt;/g, '<ruby>').replace(/&lt;\/ruby&gt;/g, '</ruby>').replace(/&lt;rt&gt;/g, '<rt>').replace(/&lt;\/rt&gt;/g, '</rt>')}</p>` : "").join("");
  }
  // We escape user content in the lesson body but do want furigana ruby tags
  // through. Re-apply furi() AFTER escapeHTML to preserve [よみ] markup.
  function safeBody(s) {
    if (!s) return "";
    return s.split("\n").map(l => {
      if (!l.trim()) return "";
      // Escape HTML, then replay furigana on the escaped string. Since the
      // furi pattern matches Japanese codepoints + literal [...], it survives
      // escapeHTML untouched.
      return `<p>${furi(escapeHTML(l))}</p>`;
    }).join("");
  }

  // For any grammar lesson that already has a curated `words` list (e.g.
  // pastLesson surfaces yesterday/last night), append per-option meanings
  // afterward so the kid can see what each multiple-choice option means.
  // We deliberately do NOT flag which one is correct — the kid has to
  // apply the rule + the meanings to figure it out.
  function augmentWithOptionWords(lesson, q) {
    if (!lesson || !Array.isArray(q.options)) return lesson;
    const seen = new Set((lesson.words || []).map(w => w.en.toLowerCase()));
    for (const o of q.options) {
      if (typeof o !== "string") continue;
      if (!/^[a-zA-Z]/.test(o.trim())) continue;
      const key = o.toLowerCase();
      if (seen.has(key)) continue;
      const jp = lookup(o);
      if (!jp) continue;
      seen.add(key);
      (lesson.words = lesson.words || []).push({ en: o, jp });
    }
    return lesson;
  }

  function buildHTML(question) {
    let lesson = dispatch(question);
    lesson = augmentWithOptionWords(lesson, question);
    return `
      <div class="lesson-card">
        <div class="lesson-head">
          <div class="lesson-icon">💡</div>
          <div class="lesson-title">${furi(escapeHTML(lesson.intro || "ヒント！"))}</div>
        </div>
        ${lesson.words && lesson.words.length ? `
          <div class="lesson-section">
            <div class="lesson-section-title">📖 ${furi("ことば")}</div>
            ${renderWordList(lesson.words)}
          </div>` : ''}
        ${lesson.grammar ? `
          <div class="lesson-section">
            <div class="lesson-section-title">📕 ${furi("ぶんぽう")}</div>
            <div class="lesson-grammar">${safeBody(lesson.grammar)}</div>
          </div>` : ''}
        ${lesson.examples && lesson.examples.length ? `
          <div class="lesson-section">
            <div class="lesson-section-title">💬 ${furi("れい")}</div>
            ${renderExamples(lesson.examples)}
          </div>` : ''}
        ${lesson.tip ? `<div class="lesson-tip">💡 ${furi(escapeHTML(lesson.tip))}</div>` : ''}
        <div class="lesson-actions">
          <button class="btn good lesson-close" id="lesson-close">${furi("わかった！もどる")}</button>
        </div>
      </div>`;
  }

  return { buildHTML, lookup, dispatch };
})();
