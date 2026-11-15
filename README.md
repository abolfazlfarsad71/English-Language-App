# English — A1 → C2 (for Persian speakers)

Private phone web app that teaches English to native Persian (Farsi) speakers, from the first word to C2.
Lessons are in English with precise Farsi translations. Served by GitHub Pages and added to the iPhone
home screen from Safari. Built on the model of the Dutch app (`abolfazlfarsad71/nederlands`), improved.

**Open:** https://abolfazlfarsad71.github.io/English-Language-App/

## What is inside (build b12)
- **Road to C2:** 292 topic units (A1 28 · A2 38 · B1 60 · B2 90 · C1 56 · C2 20), split into 8-word lessons; idiom units alternate with topic units.
- **5,680 words and phrases** (about 920 idioms) with Farsi meaning, English synonyms, a practical example sentence + Farsi translation, and an
  emoji only where it shows exactly the word (others get a clean letter tile). New-word card floats in 3-D.
- **56 grammar lessons** in CEFR order, rules in English + Farsi, 6–7 examples, 8 drills, and a
  "tip for Persian speakers" on the typical mistake (articles, word order, he/she -s, mustn't vs don't have to…).
- **292 daily-life dialogues** (4–8 lines, two speakers, Farsi under each line) with comprehension questions,
  **14 listening stories** A1→C2, and **Sounds for Persian speakers** (th, v/w, "eschool", ship/sheep, stress…).
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

## Change log
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
