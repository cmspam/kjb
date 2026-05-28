# Letter Attack — Audio Credits

## Phonics letter sounds (`assets/audio/phonics/`)

The 26 letter-sound recordings (`a.opus` … `z.opus`) are sliced from
**[Phonic_letter_sounds.mp3](https://www.yellow-door.net/file-downloads/Phonic_letter_sounds.mp3)**
published by **Yellow Door** (yellow-door.net) and provided as a freely
downloadable phonics resource. The recording was split into 26 individual
clips by `split_phonics.py`. No edits beyond cutting, gentle silence trim,
and loudness normalization.

## Sentence bank (`sentences-eiken.js`)

180 ORIGINAL sentences (60 per level) written in-house, calibrated to the
Eiken Foundation's publicly-documented grade specifications: level 1/2/3
in the game ↔ Eiken Grade 5 / 4 / 3. **Not** copied from any Eiken past
test — the test content itself is copyrighted by the Eiken Foundation and
permission would be required for redistribution.

## Word / sentence pronunciation (`assets/audio/en_std/`)

Rendered via Microsoft Edge TTS (`en-US-AriaNeural`) using the open-source
[edge-tts](https://github.com/rany2/edge-tts) Python library. See
`render_audio_std.py`.

## Other

Kaiju art, themes, voices, and sentence content reuse Kaiju Brawl assets
from the same repository. The Letter Attack game code is original.
