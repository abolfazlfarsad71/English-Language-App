# English — A1 → C1 (for Persian speakers)

Private phone web app that teaches English to native Persian (Farsi) speakers, from the first word to C1.
Lessons are in English with precise Farsi translations. Served by GitHub Pages and added to the iPhone
home screen from Safari. Built on the model of the Dutch app (`abolfazlfarsad71/nederlands`), improved.

**Open:** https://abolfazlfarsad71.github.io/English-Language-App/

## What is inside (build b1)
- **Road to C1:** 30 topic units (A1 8 · A2 7 · B1 6 · B2 5 · C1 4), each split into 2 lessons → 60 lessons.
- **480 words** with Farsi meaning, English synonyms, a practical example sentence + Farsi translation, and an
  emoji only where it shows exactly the word (others get a clean letter tile). New-word card floats in 3-D.
- **30 grammar lessons** in CEFR order, rules in English + Farsi, 6–7 examples, 8 drills, and a
  "tip for Persian speakers" on the typical mistake (articles, word order, he/she -s, mustn't vs don't have to…).
- **30 daily-life dialogues** (8 lines, two speakers, Farsi under each line) with comprehension questions,
  **12 listening stories** A1→C1, and **Sounds for Persian speakers** (th, v/w, "eschool", ship/sheep, stress…).
- **Daily lesson:** mistakes first → reviews (spaced repetition) → new words with checks → grammar every day →
  cloze practice → the unit dialogue heard blind when a unit is finished. Wrong answers come back 3 cards later and
  stay in "your mistakes" until answered right in two later sessions.
- Exercise types: meaning (EN→FA), FA→EN, listen-and-choose, fill the gap, typing, synonyms.
- Speech: the phone's own English voices (British or American, speed control). No outside services.

### Removed duplication compared with the Dutch app
One dialogue per unit (the Dutch app had lesson dialogues, unit conversations and role-plays covering the same
ground), one review mode (quick review) instead of several, and the separate Speak tab folded into Listen.

## Access
- Owner: "I'm the owner" + owner code (stored only as a hash in the app).
- Invitations: You → Owner · invitations → type a name → the app makes a code = first letter of the name (capital)
  + 4 digits, and opens Messages/WhatsApp with the link and code. The code is self-validating (no server), works
  on any phone, once per phone.

## Updates reach the phones automatically
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

## Content sources
All texts, dialogues and exercises are original, written for this app. The reference books in the owner's folder
(Vocabulary in Use, Idioms in Use, 4000 Essential Words…) guided the topic and level choice; their text and audio are
copyrighted and are **not** copied into this public repository.
