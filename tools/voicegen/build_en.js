// Piper EN synthesis. Writes WAV to a temp file then encodes to Opus —
// using stdout for binary on Windows corrupts the WAV (CRLF expansion turns
// every 0x0A byte into 0x0D 0x0A), which is what produced "muffled static"
// in the previous run.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { Buffer } = require('buffer');

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const REPO  = arg('repo',  path.resolve(__dirname, '../..'));
const PIPER = arg('piper', 'piper.exe');
const VOICE = arg('voice', '');
const OUT_DIR = path.join(REPO, 'assets', 'audio', 'en');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

if (!VOICE) { console.error('--voice <onnx> required'); process.exit(1); }

function djb2(s) {
  let h = 5381 | 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return ((h >>> 0).toString(16)).padStart(8, '0');
}

function loadAllQuestions() {
  const out = [];
  global.window = {};
  for (const lvl of [0,1,2,3,4]) {
    const file = path.join(REPO, 'data', `questions_level${lvl}.js`);
    const code = fs.readFileSync(file, 'utf8');
    delete global.window[`QUESTIONS_LEVEL${lvl}`];
    new Function('window', code)(global.window);
    const arr = global.window[`QUESTIONS_LEVEL${lvl}`] || [];
    for (const q of arr) {
      if (q.audio && typeof q.audio === 'string') out.push(q.audio);
    }
  }
  return out;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const allLines = loadAllQuestions();
  const unique = Array.from(new Set(allLines.map(s => s.trim()).filter(Boolean)));
  console.log(`[en/lines] questions had ${allLines.length} audio fields; ${unique.length} unique`);

  let manifest = {};
  if (fs.existsSync(MANIFEST)) {
    try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch(_) { manifest = {}; }
  }

  // Per-process temp file we reuse across all lines (cheaper than mktemp each time)
  const tempWav = path.join(os.tmpdir(), `kjb_piper_${process.pid}.wav`);

  let done = 0, skipped = 0, failed = 0;
  const t0 = Date.now();

  for (const text of unique) {
    const hash = djb2(text);
    const outOpus = path.join(OUT_DIR, hash + '.opus');
    if (fs.existsSync(outOpus)) {
      manifest[hash] = 1; skipped++; continue;
    }
    try {
      // 1. Piper writes a real WAV file (avoids the Windows stdout text-mode
      //    corruption). Pass the prompt via stdin.
      // Remove any prior temp wav so we can detect when piper failed silently.
      try { fs.unlinkSync(tempWav); } catch(_){}
      const r = spawnSync(PIPER, ['--model', VOICE, '--output_file', tempWav], {
        input: Buffer.from(text + '\n', 'utf8'),
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
      });
      if (r.status !== 0) {
        throw new Error(`piper exit ${r.status}: ${(r.stderr||'').toString().slice(0,300)}`);
      }
      if (!fs.existsSync(tempWav)) {
        throw new Error('piper did not produce a wav file');
      }
      const wavSize = fs.statSync(tempWav).size;
      if (wavSize < 200) throw new Error(`piper wav suspiciously small: ${wavSize} bytes`);

      // 2. ffmpeg reads the temp WAV file and encodes to Opus.
      const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tempWav, '-c:a', 'libopus', '-b:a', '32k', '-ac', '1', outOpus], { encoding: 'utf8' });
      if (ff.status !== 0) throw new Error(`ffmpeg exit ${ff.status}: ${(ff.stderr||'').slice(0,300)}`);

      manifest[hash] = 1;
      done++;
      if (done % 25 === 0) {
        const e = (Date.now() - t0) / 1000;
        console.log(`[en/progress] new=${done} skipped=${skipped} failed=${failed} t=${e.toFixed(0)}s  (${(done/(e||1)).toFixed(1)}/s)`);
        fs.writeFileSync(MANIFEST, JSON.stringify(manifest));
      }
    } catch (e) {
      console.warn(`[en/fail] "${text.slice(0,60)}…" — ${e.message}`);
      failed++;
    }
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest));
  // best-effort temp cleanup
  try { fs.unlinkSync(tempWav); } catch(_){}
  const e = (Date.now() - t0) / 1000;
  console.log(`[en/final] new=${done} skipped=${skipped} failed=${failed} total=${unique.length} t=${e.toFixed(0)}s`);
  console.log(`[en/manifest] entries=${Object.keys(manifest).length}`);
})().catch((e) => { console.error('[en/fatal]', e); process.exit(1); });
