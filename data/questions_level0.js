// Level 0 — Pre-school. NO READING REQUIRED.
// Every question is: hear an English word (audio), tap the matching emoji.
// 4 emoji options per question, all from a related theme.
(function () {
  const all = [];
  let nid = 0;
  const Q = (o) => { all.push({ id: "L0-" + (++nid).toString().padStart(3,"0"), level:0, type:"mc", ...o }); };

  function makeListenSet(theme, items) {
    const allEmoji = items.map(i => i[0]);
    items.forEach(([emoji, en]) => {
      // Pick 3 distractors from same theme
      const distract = [];
      let g = 0;
      while (distract.length < 3 && g++ < 100) {
        const x = items[(Math.random()*items.length)|0][0];
        if (x !== emoji && !distract.includes(x)) distract.push(x);
      }
      const opts = distract.slice();
      const pos = (Math.random()*4)|0;
      opts.splice(pos, 0, emoji);
      Q({ stars:1, ptype: theme, prompt_jp: "きこえた えを タップ！ 🔊", audio: en, options: opts, answer: pos });
    });
  }

  // Animals — most familiar to small kids
  makeListenSet("animal", [
    ["🐱","cat"],["🐶","dog"],["🐻","bear"],["🐰","rabbit"],["🐭","mouse"],
    ["🐮","cow"],["🐷","pig"],["🐑","sheep"],["🐴","horse"],["🦁","lion"],
    ["🐯","tiger"],["🐵","monkey"],["🐼","panda"],["🐨","koala"],["🐘","elephant"],
    ["🐸","frog"],["🐍","snake"],["🦒","giraffe"],["🐔","chicken"],["🐦","bird"],
    ["🐟","fish"],["🐢","turtle"],["🦋","butterfly"],["🐝","bee"],
  ]);

  // Food
  makeListenSet("food", [
    ["🍎","apple"],["🍌","banana"],["🍇","grapes"],["🍊","orange"],["🍓","strawberry"],
    ["🍉","watermelon"],["🍞","bread"],["🍕","pizza"],["🍰","cake"],["🍦","ice cream"],
    ["🥛","milk"],["🧃","juice"],["💧","water"],["🍔","hamburger"],["🍪","cookie"],
    ["🍫","chocolate"],["🍩","donut"],["🍳","egg"],["🍙","rice ball"],
  ]);

  // Colors
  makeListenSet("color", [
    ["🔴","red"],["🔵","blue"],["🟡","yellow"],["🟢","green"],
    ["🟣","purple"],["🟠","orange"],["⚫","black"],["⚪","white"],
    ["🟤","brown"],["🩷","pink"],
  ]);

  // Body parts
  makeListenSet("body", [
    ["👁️","eye"],["👃","nose"],["👄","mouth"],["👂","ear"],
    ["✋","hand"],["🦶","foot"],["🦵","leg"],["💪","arm"],
    ["🦷","tooth"],["💇","hair"],
  ]);

  // Nature / outdoor
  makeListenSet("nature", [
    ["☀️","sun"],["🌙","moon"],["⭐","star"],["☁️","cloud"],
    ["🌧️","rain"],["❄️","snow"],["🌳","tree"],["🌸","flower"],
    ["🏔️","mountain"],["🌊","wave"],
  ]);

  // Vehicles
  makeListenSet("vehicle", [
    ["🚗","car"],["🚌","bus"],["🚆","train"],["✈️","airplane"],
    ["🚢","ship"],["🚲","bike"],["🚓","police car"],["🚑","ambulance"],
    ["🏎️","race car"],["🚀","rocket"],
  ]);

  // Toys / things
  makeListenSet("toy", [
    ["⚽","ball"],["🧸","teddy bear"],["🪁","kite"],["🎈","balloon"],
    ["🎁","present"],["🎂","birthday cake"],["📚","book"],["🖍️","crayon"],
    ["🪀","yo-yo"],["🎨","paint"],
  ]);

  // Family / people
  makeListenSet("family", [
    ["👶","baby"],["👦","boy"],["👧","girl"],["👨","dad"],
    ["👩","mom"],["👴","grandpa"],["👵","grandma"],
  ]);

  // Weather feelings
  makeListenSet("weather", [
    ["☀️","sunny"],["🌧️","rainy"],["☁️","cloudy"],["❄️","snowy"],
    ["🌈","rainbow"],["💨","windy"],
  ]);

  // Numbers (using emoji)
  makeListenSet("number", [
    ["1️⃣","one"],["2️⃣","two"],["3️⃣","three"],["4️⃣","four"],
    ["5️⃣","five"],["6️⃣","six"],["7️⃣","seven"],["8️⃣","eight"],
    ["9️⃣","nine"],["🔟","ten"],
  ]);

  // Actions
  makeListenSet("action", [
    ["🏃","run"],["🚶","walk"],["💃","dance"],["🎤","sing"],
    ["😴","sleep"],["🍽️","eat"],["📖","read"],["💧","drink"],
  ]);

  // ALPHABET — hear the letter name (e.g. "R" sounds like "Arr"), tap the letter.
  // Uppercase
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  upper.forEach(letter => {
    const distract = [];
    let g = 0;
    while (distract.length < 3 && g++ < 60) {
      const x = upper[(Math.random()*26)|0];
      if (x !== letter && !distract.includes(x)) distract.push(x);
    }
    const opts = distract.slice();
    const pos = (Math.random()*4)|0;
    opts.splice(pos, 0, letter);
    Q({ stars:1, ptype:"alphabet_upper", prompt_jp:"きこえた もじを タップ！ 🔊", audio: letter, options: opts, answer: pos });
  });
  // Lowercase
  const lower = "abcdefghijklmnopqrstuvwxyz".split("");
  lower.forEach(letter => {
    const distract = [];
    let g = 0;
    while (distract.length < 3 && g++ < 60) {
      const x = lower[(Math.random()*26)|0];
      if (x !== letter && !distract.includes(x)) distract.push(x);
    }
    const opts = distract.slice();
    const pos = (Math.random()*4)|0;
    opts.splice(pos, 0, letter);
    // Speak uppercase since TTS pronounces it the same and lowercase letters sometimes get spelled out weirdly
    Q({ stars:1, ptype:"alphabet_lower", prompt_jp:"きこえた もじを タップ！ 🔊", audio: letter.toUpperCase(), options: opts, answer: pos });
  });

  window.QUESTIONS_LEVEL0 = all;
})();
