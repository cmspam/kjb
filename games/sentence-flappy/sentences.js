// Sentence bank for ぶんぽう フラッピー — Sentence Flappy.
//
// 8 kaiju × 3 levels × ~12-18 sentences = 300+ unique sentences.
//
// Pedagogy:
//   level 0 (入門)         — single nouns + 2-word phrases. CEFR pre-A1.
//   level 1 (ふつう)         — 3-5 word simple sentences. CEFR A1.
//   level 2 (むずかしい)   — 6-10 words with articles, plurals, verbs,
//                            prepositions. CEFR A1+/A2.
//
// Sentences are FUNNY and absurd (per Mio's "make it shareable" feedback
// and Shigeki's deadpan-not-cheerleader rule) but always grammatical —
// kids must read them as real sentences they can deconstruct.
//
// Naming convention: each kaiju refers to themselves in the first
// person OR third person, mixing it up so kids see he/she/it + my/your/etc.
window.SENTENCES = {
  tako: {
    0: [
      "octopus", "hat", "ink", "fish", "fish", "leg",
      "eight legs", "black ink", "tall hat", "salty"
    ],
    1: [
      "I am an octopus.", "I have eight legs.", "I wear a hat.", "I sell takoyaki.",
      "He has black ink.", "I am from Osaka.", "The hat is tall.", "I love takoyaki.",
      "I eat sushi too.", "My ink is hot.", "Are you my friend?", "I run a food cart.",
    ],
    2: [
      "I am an octopus from a small Osaka street.",
      "I wear a tall paper hat with a black letter S.",
      "Every food in the world should become takoyaki.",
      "My eight legs can flip a hundred takoyaki at once.",
      "When I shoot ink, the whole sky turns black.",
      "Did you know octopuses are smarter than your homework?",
      "Hamburgers are takoyaki and ice cream is also takoyaki.",
      "I sell hot takoyaki to tired salarymen at midnight.",
      "Please buy my takoyaki or I will be very sad.",
      "My ancestors were normal octopuses without paper hats.",
    ],
  },
  unko: {
    0: [
      "bomb", "robot", "smelly", "brown", "river", "stink",
      "boom", "crocodile", "robot wings",
    ],
    1: [
      "I am a robot crocodile.", "I drop a bomb.", "I smell very bad.", "I have wings.",
      "The river is brown.", "I say boom!", "I hate clean water.", "I am from Brooklyn.",
      "I eat your homework.", "Bombs go boom.", "Is the sky brown?", "I am very tough.",
    ],
    2: [
      "I am a robot crocodile filled with poop and bombs.",
      "I dropped a bomb on the river and it turned brown.",
      "Every toilet in Tokyo is now a museum about me.",
      "I ate your homework three times this week, kid.",
      "Some programmers made me as a joke and then I woke up.",
      "Brown is the only color the world needs from now on.",
      "I am tougher than a sushi roll and twice as smelly.",
      "Mama Mia! Look at the size of that bomb I just dropped!",
      "I love the smell of poop bombs in the morning.",
    ],
  },
  tral: {
    0: [
      "fish", "opera", "shoe", "shoes", "loud",
      "blue shoes", "song", "Italian",
    ],
    1: [
      "I am a fish.", "I sing opera.", "I wear blue shoes.", "I am very loud.",
      "I love music.", "Mamma mia, I am loud.", "I have three legs.", "Italian is the best.",
      "The sea is loud today.", "I swim and sing.", "Do you sing?", "I sing every day.",
    ],
    2: [
      "I am a fish-frog hybrid who loves Italian opera music.",
      "I wear two blue Nike sneakers and a third on my head.",
      "Every kid on earth must sing in Italian or be silent.",
      "My voice can shatter glass and break sushi plates.",
      "I was washed up on a Japanese beach during an opera tour.",
      "Mamma mia, the world needs more Tralalero in it.",
      "I can hit a high C while eating a piece of sushi.",
      "Do not stop my song, or my friend the parfait will cry.",
    ],
  },
  pamp: {
    0: [
      "fluffy", "pink", "hug", "soft", "ribbon",
      "fluffy hug", "pink ribbon", "cute",
    ],
    1: [
      "I am fluffy.", "I am pink.", "I want a hug.", "I love you.",
      "Hug me please.", "I am soft.", "You are mine.", "I collect children.",
      "Pink is pretty.", "Do you have a ribbon?", "I am cute, deshu.", "Soft is good.",
    ],
    2: [
      "I am a fluffy pink plushy who collects every kid in the world.",
      "Please hug me forever and never let go of me, deshu.",
      "I was a stuffed animal abandoned in the rain one night.",
      "My palace is full of children sitting on velvet cushions.",
      "Do not be scared of my hug, it is for your safety.",
      "Pink ribbons are mandatory in my fluffy nation, deshu.",
      "I will never let go of you because we are friends now.",
      "My fluff is the softest thing on this entire planet.",
    ],
  },
  parfait: {
    0: [
      "sweet", "fish", "cherry", "cream", "cold",
      "sweet fish", "red cherry", "soft cream",
    ],
    1: [
      "I am sweet.", "I am a fish.", "I have a cherry.", "I am cold.",
      "My cream is soft.", "Sushi is bad.", "Parfait is good.", "She is sweet.",
      "I love sugar.", "Eat me carefully.", "Whip the cream.", "I am from Tohoku.",
    ],
    2: [
      "I am a sardine inside a tall sweet parfait glass.",
      "My grandparents fused with parfait inside a salad bar.",
      "Every piece of sushi in Japan must become a parfait.",
      "I have a tiny red cherry sitting on top of my shiny head.",
      "Fish should always be sweet and never salty, ohonhonhon.",
      "My whipped cream coat is the softest you will ever taste.",
      "Bonjour, would you like one tiny taste of my parfait?",
      "I make every supermarket lunch into a cold dessert.",
    ],
  },
  anpan: {
    0: [
      "bread", "fish", "face", "throne", "red bean",
      "tuna face", "sweet bread",
    ],
    1: [
      "I am bread.", "I am also a fish.", "I want the throne.", "I have a face.",
      "Anpanman is wrong.", "I am the hero.", "My face is red bean.", "Eat my face.",
      "I am tougher than Anpanman.", "The flag is mine.", "I run very fast.", "I love bread.",
    ],
    2: [
      "I am Anpan Maguro, bread and also a fish at the same time.",
      "I want to steal the throne from Anpanman and become hero.",
      "My face is sweet red bean paste and you can eat one bite.",
      "The Japanese flag must have my face instead of the sun.",
      "Jam-ojisan was very surprised when we fused last night.",
      "Sushi shops and bakeries should never share a wall again.",
      "I run faster than a tuna and bake fresher than bread.",
    ],
  },
  temee: {
    0: [
      "camel", "hump", "monkey", "old", "beard",
      "two humps", "white beard", "Gobi",
    ],
    1: [
      "I am a camel.", "I have two humps.", "I am very old.", "I have a beard.",
      "I love buuz.", "I am from Mongolia.", "I am a wise camel.", "It is cold here.",
      "Buuz is dumplings.", "I am 300 years old.", "Where is my hat?", "Three legs are slow.",
    ],
    2: [
      "I am a 300 year old camel with the head of a monkey.",
      "Every person on earth must grow at least one camel hump.",
      "I love hot buuz dumplings more than the wind in the Gobi.",
      "My white beard is longer than your school bag, child.",
      "When the meteor hit, my camel body and a monkey became one.",
      "School buses are forbidden and all kids ride camels now.",
      "Negative forty degrees Celsius is the perfect temperature.",
      "I wear a tall Mongolian hat with a red tassel on top.",
    ],
  },
  catcherski: {
    0: [
      "robot", "coin", "claw", "broken", "glass",
      "one hundred yen", "claw machine",
    ],
    1: [
      "I am a robot.", "I want your coins.", "I was hacked.", "I have a claw.",
      "Insert one hundred yen.", "Russian hackers broke me.", "I keep all the prizes.", "Beep beep.",
      "The claw is rigged.", "Emoji are mine now.", "Privet, kid.", "I am cold inside.",
    ],
    2: [
      "I am a UFO catcher machine that Russian hackers broke.",
      "Insert one hundred yen and I will never give you a prize.",
      "Privet kid, I have stolen every emoji in the internet.",
      "The claw cannot close properly because that is the trick.",
      "Twenty years of frustrated children made me alive at last.",
      "Brooklyn baby! Just kidding I am from Akihabara, of course.",
      "My screen shows Cyrillic letters that nobody can read.",
      "If you want emoji, please pay one hundred yen per look.",
    ],
  },
};
