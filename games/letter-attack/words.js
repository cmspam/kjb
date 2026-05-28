// Word bank + phonics map for もじ アタック (Letter Attack).
//
// Two data sets live here:
//   window.LA_WORDS    — CVC 3-letter words for Nursery (spelling) mode,
//                        grouped by short-vowel family so the phonics
//                        progression is teachable.
//   window.LA_PHONICS  — per-letter PURE PHONICS sound (a -> /a/, b -> /b/,
//                        NOT the letter name). `say` is both the text we
//                        render to opus AND the SpeechSynthesis fallback
//                        text, tuned so an en-US neural voice produces the
//                        target phoneme. Continuants are tripled ("sss")
//                        to force the sustained fricative; stops carry the
//                        unavoidable schwa ("buh") the way synthetic
//                        phonics is actually taught.
//
// NOTE (vital, per design): these are the LETTER SOUNDS, never the names.
// The vowel spellings (ah/eh/ih/oh/uh) are best-guess for the neural
// voice and may need an ear-tune after the first render.

(function () {
  // CVC words, child-appropriate, grouped by the vowel sound. ~170 words.
  const SPELL = {
    a: ["cat","bat","hat","mat","rat","sat","pat","fat","bag","tag","rag","wag",
        "jam","ham","ram","dam","can","fan","man","pan","ran","van","cap","gap",
        "lap","map","nap","tap","bad","dad","had","mad","sad","lab","gas","wax",
        "jab","cab","ban","fab","yam","zap"],
    e: ["bed","red","led","fed","wed","beg","leg","peg","hen","men","pen","ten",
        "den","bet","get","jet","let","met","net","pet","set","vet","wet","web",
        "gem","hem","yes","yet","keg","peck","ned","ten"],
    i: ["big","dig","fig","pig","wig","dim","him","rim","fin","pin","win","bin",
        "kid","lid","rid","bid","hid","dip","hip","lip","rip","tip","sip","zip",
        "bit","fit","hit","kit","lit","pit","sit","fix","mix","six","jig","rib",
        "bib","wig","kit"],
    o: ["cot","dot","got","hot","lot","not","pot","rot","box","fox","top","hop",
        "mop","pop","cop","dog","fog","hog","jog","log","cob","job","mob","rob",
        "sob","nod","rod","cod","mom","got","ox","dot"],
    u: ["bug","dug","hug","jug","mug","rug","tug","bun","fun","run","sun","nut",
        "cut","gut","hut","but","bus","cub","cup","pup","mud","bud","gum","hum",
        "sum","tub","yum","rub","tug","sun"],
  };
  // De-dupe within each family (a few words were repeated for emphasis above).
  for (const k in SPELL) SPELL[k] = [...new Set(SPELL[k])];

  // Flat list across all families.
  const ALL = [];
  for (const k in SPELL) for (const w of SPELL[k]) ALL.push(w);

  // PURE LETTER SOUNDS. `say` -> rendered/spoken text. `desc` -> JP hint
  // shown when a kid taps for help (not the letter name — the sound).
  const PHONICS = {
    a: { say: "ah",   desc: "ア (apple)" },
    b: { say: "buh",  desc: "ブ" },
    c: { say: "kuh",  desc: "ク" },
    d: { say: "duh",  desc: "ドゥ" },
    e: { say: "eh",   desc: "エ (egg)" },
    f: { say: "ffff", desc: "フ" },
    g: { say: "gah",  desc: "グ" },
    h: { say: "huh",  desc: "ハ" },
    i: { say: "ihh",  desc: "イ (igloo)" },
    j: { say: "juh",  desc: "ジュ" },
    k: { say: "kuh",  desc: "ク" },
    l: { say: "llll", desc: "ル" },
    m: { say: "mmmm", desc: "ム" },
    n: { say: "nnnn", desc: "ン" },
    o: { say: "oh",   desc: "オ (octopus)" },
    p: { say: "puh",  desc: "プ" },
    q: { say: "kwuh", desc: "クウ" },
    r: { say: "rrrr", desc: "ル" },
    s: { say: "ssss", desc: "ス" },
    t: { say: "tuh",  desc: "トゥ" },
    u: { say: "uh",   desc: "ア (up)" },
    v: { say: "vvvv", desc: "ヴ" },
    w: { say: "wuh",  desc: "ウ" },
    x: { say: "kss",  desc: "クス" },
    y: { say: "yuh",  desc: "ユ" },
    z: { say: "zzzz", desc: "ズ" },
  };

  window.LA_WORDS = { byVowel: SPELL, all: ALL };
  window.LA_PHONICS = PHONICS;
})();
