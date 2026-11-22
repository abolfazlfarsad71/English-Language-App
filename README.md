# English — A1 → C2 (for Persian speakers)

Private phone web app that teaches English to native Persian (Farsi) speakers, from the first word to C2.
Lessons are in English with precise Farsi translations. Served by GitHub Pages and added to the iPhone
home screen from Safari. Built on the model of the Dutch app (`abolfazlfarsad71/nederlands`), improved.

**Open:** https://abolfazlfarsad71.github.io/English-Language-App/

## What is inside (build b18)
- **Road to C2:** 297 topic units (A1 28 · A2 40 · B1 63 · B2 90 · C1 56 · C2 20), split into 8-word lessons; idiom units alternate with topic units.
- **5,680 words and phrases** (about 920 idioms) with Farsi meaning, English synonyms, a practical example sentence + Farsi translation, and an
  emoji only where it shows exactly the word (others get a clean letter tile). New-word card floats in 3-D.
- **60 grammar lessons** in CEFR order, rules in English + Farsi, 6–7 examples, 8 drills, and a
  "tip for Persian speakers" on the typical mistake (articles, word order, he/she -s, mustn't vs don't have to…).
- **297 daily-life dialogues** (4–8 lines, two speakers, Farsi under each line) with comprehension questions,
  **14 listening stories** A1→C2, and **Sounds for Persian speakers** (th, v/w, "eschool", ship/sheep, stress…).
- **Daily lesson:** mistakes first → reviews (spaced repetition) → new words with checks → grammar every day →
  cloze practice → the unit dialogue heard blind when a unit is finished. Wrong answers come back 3 cards later and
  stay in "your mistakes" until answered right in two later sessions.
- Exercise types: meaning (EN→FA), FA→EN, listen-and-choose, fill the gap, typing, synonyms.
- **12 recorded American voices** (b15): every word, example, dialogue line, grammar sentence, listening text and sound pair
  (13,772 phrases). Women: Olivia, Emma, Hannah, Grace, Lily, Sophie; men: James, Joe, Mike, David, Henry, Ryan (ordered by
  measured pitch). Sources: Piper `en_US` medium voices lessac (Emma), hfc_female (Hannah), ryan, joe, hfc_male (Henry), and
  speakers 383 (Olivia), 773 (Grace), 444 (Lily), 29 (Sophie), 805 (James), 518 (Mike), 868 (David) of `en_US-libritts_r-medium`,
  chosen from all 904 speakers by pitch spread. The learner picks a default woman and man; words use the woman, the man or both;
  dialogues and stories can use random voices of the right gender. The phone voice is only a fallback.
- **Daily pace:** recommended 30 new words a day until the end of B1, then 20; the learner can set 10–100 a day.
- **Road (first tab):** a winding trail of unit stops per level with progress, a START marker and a sheet per unit.

### Removed duplication compared with the Dutch app
One dialogue per unit (the Dutch app had lesson dialogues, unit conversations and role-plays covering the same
ground), one review mode (quick review) instead of several, and the separate Speak tab folded into Listen.

## Access
- Owner: "I'm the owner" + owner code (stored only as a hash in the app).
- Invitations: You → Owner · invitations → type a name → the app makes a code = first letter of the name (capital)
  + 4 digits, and opens Messages/WhatsApp with the link and code. The code is self-validating (no server), works
  on any phone, once per phone.

## Updates reach the phones automatically
One step: `node release.cjs "what changed"` (build, local copy in `../04. Current version`, commit, push).
Bump `const BUILD = '<d mon> · bNN'` in `src/app.js` (higher `bNN`), run `node build.mjs`, commit `index.html`.
GitHub Pages deploys in a few minutes; the app checks its own file on every open and shows
"New version ready → Update". Progress stays on the phone under keys that never change:
`en.profiles`, `en.primary`, `en.<id>.state`, `en.<id>.bak`, `en.invites`, `en.usedCodes`, `en.voice`, `en.errlog`.
Never renumber word ids (`u03-5`) or unit/grammar ids: they are keys in saved progress. New state fields go into `FRESH()`.

## Files
- `index.html` — the built app (CSS + data + JS in one file, works offline). Do not edit by hand.
- `src/app.js`, `src/style.css`, `src/index.template.html` — source; `src/data/*.json` — all teaching content.
- `build.mjs` — builds `index.html` and checks the data (`node build.mjs`).
- `sw.js`, `manifest.webmanifest`, `icon.svg`, `icon-180.png`, `icon-512.png`.

## Audio (audio/)
- `keys.json` = every spoken text, normalised (trimmed, whitespace collapsed, lower-case), in a fixed order.
- Voice ids: f1 Emma, f2 Olivia, f3 Hannah, f4 Grace, f5 Lily, f6 Sophie, m1 Ryan, m2 Joe, m3 Henry, m4 James, m5 Mike, m6 David.
- `<voice>.json` = `{bps: 3000, files, c: [file, startMs, endMs, …]}` aligned with keys (`-1` = not recorded).
- `<voice>-<n>.mp3` = CBR 24 kbps MPEG-2 Layer III, 22.05 kHz mono, no ID3/Xing header, clips in 300 ms of silence,
  so a clip is fetched as a byte range: byte = ms / 1000 × 3000 (times already include the 50 ms encoder delay).
- Made outside the repo in `../02. Audio`: `export.cjs` (texts) → `run-all.sh` / `synth.cjs` (piper 2023.11.14-2 Windows,
  length_scale 1.08; newer voice configs need their multi-character phoneme keys removed) → `bundle.cjs <model> <id>`.
  When texts change, re-export, record only what is new (recordings are stored by a hash of the text, so finished clips are skipped) and re-bundle all six voices.

## Content sources
All texts, dialogues and exercises are original, written for this app. The reference books in the owner's folder
(Vocabulary in Use, Idioms in Use, 4000 Essential Words…) guided the topic and level choice; their text and audio are
copyrighted and are **not** copied into this public repository.

## Change log
- **b18 (22 nov)** — "✓ I know it" in the session bar (the word is never reviewed again; undo in the toast or on the unit
  page); checks after teaching come at random places and in random forms (2 different checks per word, ≥2 cards after it);
  pictures on more question types, the word highlighted in its example, colour halo by part of speech; speed chip on every
  question; grammar in colour (taught forms coloured in rules, examples and drills); `node release.cjs "message"` builds,
  replaces `../04. Current version` and pushes.
- **b17 (17 nov)** — every word clip checked with speech recognition (whisper.cpp base.en, `../02. Audio/asrcheck2.cjs`,
  `asrsuspect.cjs`, `score.cjs`, `retry.cjs`): failed clips re-recorded with new takes and re-checked; clips that still fail are left
  out of that voice (`asr/drop-<voice>.json`) and the app plays the word in another voice of the same gender. Ryan removed
  (about 40% of his single words were misheard); David is the default man. 11 voices, 0.91 GB of audio.
- **b16 (17 nov)** — a conversation for every lesson (461 new everyday lesson talks + 297 unit dialogues = 758, `src/data/talks.json`,
  written in `../03. Talks/*.js`, checked by `talks.cjs`: each uses ≥3 of its lesson's words); a relevant picture for all 5,680
  words; speaking speed 0.6×–1.2× (as in the Dutch app); ‹ back to the previous card; no automatic jump after an answer;
  stronger reviews (a wrong word restarts at box 1, comes back up to 3 times in the session, and leaves "your mistakes" only after
  two right answers in later sessions); every clip gets 0.5 s of silent MP3 frames so iPhone Safari does not cut the last sound.
- **b15 (17 nov)** — Road redesigned as a visual journey; words per day adjustable 10–100; 12 clearly different American
  voices (6 new, Amy dropped as too close to Emma) with a default woman and man and random voices in conversations; 17 dialogues
  and 17 example sentences rewritten for everyday life (no more legends, battles, space or bombs).
- **b14 (16 nov)** — recorded American voices (3 women, 3 men) replace the phone voice; Farsi always right-to-left on its
  own line under the English (no more mixed English · Farsi rows); Road is the first tab with every lesson listed and
  lessons/words done out of total; daily pace 30 new words to the end of B1, then 20; greeting no longer hidden under
  Safari's bar or the streak badge; spoken grammar answers no longer lose every letter "s".
- **b13 (15 nov)** — corrections from an independent hand-read of all 292 units, grammar and listening (each verified before
  applying); own pass over all 3,849 synonym fields (only true synonyms kept); 60 basic words moved from B2/C1 into five new
  A1–B1 units; 4 grammar lessons added (mine/yours, myself, question tags, so/neither do I); g47 moved to A2; listening
  questions now have Farsi and a third question each; part-of-speech tags fixed on hyphenated compounds.
- **b12 (15 nov)** — line-by-line review of all 56 grammar lessons (rules, examples, tips, drills), 14 listening
  stories, sounds section, road map and interface text; 7 corrections (ambiguous drills, two translations, a sound pair, a label).
- **b11 (15 nov)** — new C2 level (20 units, 5 grammar lessons, 2 listening texts, road entry); 6 grammar gaps filled
  (subject/object questions, movement prepositions, zero conditional & time clauses, phrasal verbs, quantifiers,
  articles in depth); 86 more Essential Words words and 16 more Idioms in Use idioms; idiom units spread through B2–C1;
  full re-read of all word meanings, example sentences and dialogue lines (about 70 corrections).
- **b3–b10 (15 nov)** — pen-blue and white theme with light gold for trophies and finished levels; content grown
  from 480 to 5,422 words: all units of Vocabulary in Use, Business Vocabulary in Use, the six 4000 Essential Words
  books (about 97% of their headwords) and all 62 units of English Idioms in Use (read from the scanned pages),
  each as original examples, dialogues and questions; grammar extended to 45 lessons spread across each level;
  US spellings shown in British form; unit road ordered by level.
- **b2 (15 nov)** — full review: ~25 Farsi translations and 5 dialogue lines corrected; duplicate words removed
  (bill, account, deadline, budget, bottom line); 13 emojis removed or replaced where they did not show the exact word
  (including literal pictures on idioms); 4 drawn pictures (solar panel, wind turbine, pylon, battery storage).
  Exercises: wrong options can no longer be another correct answer (same Farsi meaning or synonym); fill-the-gap options
  take the same ending as the answer (works / lives / living) without broken forms; every new word is checked;
  speech no longer starts in the same instant as it is cancelled (iOS); mistakes clear after one right answer in a
  later session.
- **b1 (15 nov)** — first version.
