'use strict';
/* English for Persian speakers — A1 → C1. One-file web app (built by build.mjs). */
const BUILD = '15 nov · b6';
const DAY = 864e5;

/* ------------------------------ data ------------------------------ */
const UNITS = DATA.units;                 // [{id,lv,t,fa,i,w:[[w,pos,fa,syn,ex,exfa,emoji]],d:{...}}]
const GRAMMAR = DATA.grammar;             // [{id,lv,t,fa,r,ex,tip,d:[[q,correct,wrong,wrong]]}]
const LISTEN = DATA.extra.listen, SOUNDS = DATA.extra.sounds, ROAD = DATA.extra.road;
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const WORDS = [];                         // flat list, id = unit-index (stable key in saved progress)
const WMAP = {};
UNITS.forEach(u => u.w.forEach((a, i) => {
  const w = { id: u.id + '-' + i, w: a[0], pos: a[1], fa: a[2], syn: (a[3] || '').split(',').map(s => s.trim()).filter(Boolean), ex: a[4], exfa: a[5], e: a[6] || '', u: u.id, lv: u.lv };
  WORDS.push(w); WMAP[w.id] = w;
}));
const UMAP = Object.fromEntries(UNITS.map(u => [u.id, u]));
const GMAP = Object.fromEntries(GRAMMAR.map(g => [g.id, g]));
// the road: every unit = 2 lessons of 8 words
const LESSONS = [];
UNITS.forEach(u => { for (let k = 0; k * 8 < u.w.length; k++) LESSONS.push({ id: u.id + '.' + (k + 1), u: u.id, lv: u.lv, k, words: u.w.slice(k * 8, k * 8 + 8).map((_, i) => u.id + '-' + (k * 8 + i)) }); });

/* ------------------------------ storage ------------------------------ */
const S = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};
const PKEY = 'en.profiles';
let PROFILES = S.get(PKEY, []);
let ME = null, ST = null;
function FRESH() {
  return { v: 1, cards: {}, gram: {}, dlg: {}, lis: {}, miss: {}, days: {}, streak: { last: '', n: 0, best: 0 }, xp: 0, perDay: 8, accent: 'GB', rate: 1, showFa: true, created: Date.now() };
}
function loadState(id) {
  const st = S.get('en.' + id + '.state', null);
  const f = FRESH();
  if (!st) return f;
  for (const k in f) if (!(k in st)) st[k] = f[k];       // additive migration: never remove fields
  return st;
}
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 300); }
function saveNow() { if (ME && ST) S.set('en.' + ME.id + '.state', ST); }
function backupState() { if (ME && ST) S.set('en.' + ME.id + '.bak', { t: Date.now(), st: ST }); }

/* ------------------------------ helpers ------------------------------ */
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const faNum = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
function toast(m, ms) { const old = $('.toast'); if (old) old.remove(); const t = el('div', 'toast', esc(m)); document.body.appendChild(t); setTimeout(() => t.remove(), ms || 2200); }
function haptic(ok) { try { if (navigator.vibrate) navigator.vibrate(ok ? 12 : [20, 40, 20]); } catch (e) { } }
const ERRLOG = S.get('en.errlog', []);
function logErr(m) { ERRLOG.push({ t: new Date().toISOString(), m: String(m).slice(0, 300), b: BUILD }); while (ERRLOG.length > 20) ERRLOG.shift(); S.set('en.errlog', ERRLOG); }
window.addEventListener('error', e => logErr((e.message || 'error') + ' @' + (e.lineno || '')));
window.addEventListener('unhandledrejection', e => logErr('promise: ' + (e.reason && e.reason.message || e.reason)));
const PIC = {
  solar: '<svg viewBox="0 0 64 64"><circle cx="50" cy="12" r="7" fill="#FFC24A"/><g stroke="#FFC24A" stroke-width="2" stroke-linecap="round"><path d="M50 1v3M61 12h-3M58 4l-2 2M42 4l2 2"/></g><path d="M8 26h40l8 22H4z" fill="#2B4C8C" stroke="#9DBBFF" stroke-width="1.5"/><path d="M18 26l-4 22M28 26v22M38 26l4 22M6 33h45M5 40h49" stroke="#9DBBFF" stroke-width="1.2"/><path d="M28 48v8M18 58h20" stroke="#97A7C7" stroke-width="3" stroke-linecap="round"/></svg>',
  turbine: '<svg viewBox="0 0 64 64"><path d="M30 26h4l2 34h-8z" fill="#DCE6F7"/><circle cx="32" cy="24" r="3.5" fill="#fff"/><g fill="#EEF2FA"><path d="M32 24L29 3c3-1 5 0 5 2z"/><path d="M32 24l19 9c-1 3-3 4-5 3z"/><path d="M32 24L13 34c-1-3 0-5 2-5z"/></g><path d="M4 61h56" stroke="#34D399" stroke-width="3" stroke-linecap="round"/></svg>',
  pylon: '<svg viewBox="0 0 64 64" fill="none" stroke="#DCE6F7" stroke-width="2" stroke-linejoin="round"><path d="M32 4L20 60M32 4l12 56M24 42h16M26 30h12M28 18h8M24 42l14 18M40 42L26 60M26 30l13 12M38 30L25 42"/><path d="M12 18h40M8 30h48" stroke-width="2.5"/><path d="M0 16c10 4 10 4 12 2M52 18c2 2 2 2 12-2M0 28c6 4 6 4 8 2M56 30c2 2 2 2 8-2" stroke="#FFC24A" stroke-width="1.5"/></svg>',
  bess: '<svg viewBox="0 0 64 64"><rect x="6" y="18" width="52" height="34" rx="3" fill="#DCE6F7"/><rect x="6" y="18" width="52" height="7" fill="#97A7C7"/><g fill="#5B8DEF"><rect x="11" y="29" width="9" height="18" rx="1"/><rect x="23" y="29" width="9" height="18" rx="1"/><rect x="35" y="29" width="9" height="18" rx="1"/></g><path d="M52 30l-4 8h4l-3 8 7-10h-4l3-6z" fill="#FFC24A"/><path d="M4 56h56" stroke="#34D399" stroke-width="3" stroke-linecap="round"/><path d="M18 18V11h28v7" stroke="#97A7C7" stroke-width="2" fill="none"/></svg>'
};
function pic(w, big) {
  if (w.e && w.e[0] === '@' && PIC[w.e.slice(1)]) return big ? `<div class="stage"><div class="pic3d"><span class="svgpic">${PIC[w.e.slice(1)]}</span></div></div>` : `<span class="mini"><span class="svgpic sm">${PIC[w.e.slice(1)]}</span></span>`;
  if (w.e) return big ? `<div class="stage"><div class="pic3d"><span>${w.e}</span></div></div>` : `<span class="mini">${w.e}</span>`;
  const L = esc(w.w.replace(/^(to |a |the )/, '')[0].toUpperCase());
  return big ? `<div class="stage"><div class="pic3d tile"><span>${L}</span></div></div>` : `<span class="mini tile">${L}</span>`;
}
const lvChip = lv => `<span class="lvchip lv-${lv}">${lv}</span>`;
const POS = { n: 'noun · اسم', v: 'verb · فعل', adj: 'adjective · صفت', adv: 'adverb · قید', prep: 'preposition · حرف اضافه', conj: 'conjunction · حرف ربط', phr: 'phrase · عبارت', num: 'number · عدد' };

/* ------------------------------ speech ------------------------------ */
// Phone voices (offline, free). Lessons learned on iOS: start speech synchronously inside the tap,
// request a playback audio session (so the silent switch does not mute it), resolve the voice fresh
// every time, and retry once with the default voice if a named voice fails.
let VOICES = [], SPEECH_ERR = '';
function audioSession() { try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { } }
function loadVoices() { try { VOICES = (speechSynthesis.getVoices() || []).filter(v => /^en[-_]/i.test(v.lang)); } catch (e) { VOICES = []; } }
if ('speechSynthesis' in window) { loadVoices(); try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e) { } }
function voiceScore(v, accent, male) {
  let s = 0; const id = (v.name + ' ' + v.voiceURI).toLowerCase();
  if (v.lang.replace('_', '-').toUpperCase().endsWith(accent)) s += 50;
  if (/premium|enhanced|neural|natural/.test(id)) s += 20;
  if (/novelty|whisper|bells|bad news|boing|bubbles|cellos|zarvox|trinoids|organ|albert|jester|superstar|wobble|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/.test(id)) s -= 80;
  const m = /daniel|arthur|oliver|alex|tom|aaron|fred|guy|ryan|male|david|mark|george|james/.test(id);
  const f = /samantha|serena|kate|karen|moira|tessa|martha|ava|allison|susan|victoria|zira|female|libby|sonia|jenny|aria|fiona|catherine/.test(id);
  if (male === true && m) s += 15; if (male === false && f) s += 15;
  if (male === true && f) s -= 10; if (male === false && m) s -= 10;
  return s;
}
function bestVoice(male) {
  if (!VOICES.length) loadVoices();
  const acc = (ST && ST.accent) || 'GB';
  const pref = S.get('en.voice', '');
  if (male == null && pref) { const v = VOICES.find(x => x.voiceURI === pref); if (v) return v; }
  return VOICES.slice().sort((a, b) => voiceScore(b, acc, male) - voiceScore(a, acc, male))[0] || null;
}
let speakQ = [];
function say(text, opt) {
  opt = opt || {};
  if (!('speechSynthesis' in window)) { if (!opt.quiet) toast('This phone has no speech voice'); if (opt.end) opt.end(); return; }
  audioSession();
  try {
    const busy = speechSynthesis.speaking || speechSynthesis.pending;
    if (busy) speechSynthesis.cancel();
    const go = (useNamed) => {
      const u = new SpeechSynthesisUtterance(text);
      const v = useNamed ? bestVoice(opt.male) : null;
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = (ST && ST.accent === 'US') ? 'en-US' : 'en-GB';
      u.rate = Math.max(.5, Math.min(1.2, (opt.rate || (ST && ST.rate) || 1) * .95));
      u.pitch = opt.pitch || 1;
      let started = false;
      u.onstart = () => { started = true; };
      u.onend = () => { if (opt.end) opt.end(); };
      u.onerror = e => {
        const c = (e && e.error) || 'error'; if (c === 'interrupted' || c === 'canceled') return;
        SPEECH_ERR = c; logErr('speech ' + c);
        if (useNamed && !opt._retry) { opt._retry = true; go(false); } else if (opt.end) opt.end();
      };
      speechSynthesis.speak(u);
      if (useNamed && !opt._retry) setTimeout(() => { if (!started && !speechSynthesis.speaking && !opt._retry) { opt._retry = true; try { speechSynthesis.cancel(); } catch (x) { } go(false); } }, 1800);
    };
    if (busy) setTimeout(() => go(true), 90); else go(true);
  } catch (e) { logErr('say ' + e.message); if (opt.end) opt.end(); }
}
function stopSpeech() { try { speechSynthesis.cancel(); } catch (e) { } }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-say]');
  if (b) { e.stopPropagation(); say(b.dataset.say, { rate: b.dataset.slow ? .7 : undefined }); }
}, true);
const sayBtn = (t, cls) => `<button class="say ${cls || ''}" data-say="${esc(t)}" aria-label="listen">🔊</button>`;

/* ------------------------------ access: owner code & invitations ------------------------------ */
// Owner code (format: capital letter + 4 digits) is stored only as a hash.
function h32(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h; }
const OWNER_H = 3259871343;
const isOwnerCode = c => h32('own·' + String(c).trim().toUpperCase()) === OWNER_H;
const normName = n => String(n || '').trim().toLowerCase().replace(/\s+/g, ' ');
function nameLetter(n) { const m = /[a-z]/i.exec(normName(n)); return m ? m[0].toUpperCase() : 'X'; }
// self-validating invitation code: first letter of the invitee's name (capital) + 4 digits
function inviteCode(name) { return nameLetter(name) + String(h32('inv·en-c1·' + normName(name)) % 10000).padStart(4, '0'); }
const CODE_RE = /^[A-Z]\d{4}$/;

/* ------------------------------ progress model ------------------------------ */
const BOX_DAYS = [0, 1, 2, 4, 8, 16, 35];      // spaced repetition intervals per box
function card(id) { return ST.cards[id]; }
function known(id) { const c = ST.cards[id]; return c && c.b >= 3; }
function grade(id, ok) {
  let c = ST.cards[id] || (ST.cards[id] = { b: 0, d: 0, n: 0, c: 0, w: 0 });
  c.n++; c.lt = Date.now();
  if (ok) { c.c++; c.b = Math.min(6, c.b + 1); } else { c.w++; c.b = Math.max(1, c.b - 2); missNote('w:' + id, false); }
  c.d = Date.now() + BOX_DAYS[c.b] * DAY - 3 * 3600e3;
  ST.xp += ok ? 2 : 0; save();
}
function introduce(id) { if (!ST.cards[id]) ST.cards[id] = { b: 1, d: Date.now() + DAY - 3 * 3600e3, n: 0, c: 0, w: 0, t: Date.now() }; save(); }
const seenWords = () => WORDS.filter(w => ST.cards[w.id]);
const dueList = (at) => WORDS.filter(w => { const c = ST.cards[w.id]; return c && c.d <= (at || Date.now()); }).sort((a, b) => ST.cards[a.id].d - ST.cards[b.id].d);
function lessonDone(L) { return L.words.every(id => ST.cards[id]); }
function nextLesson() { return LESSONS.find(L => !lessonDone(L)) || null; }
const lessonsDone = () => LESSONS.filter(lessonDone).length;
function lessonIdx(L) { return LESSONS.indexOf(L); }
function lessonTitle(L) { const u = UMAP[L.u]; return u.t + ' · part ' + (L.k + 1); }
// mistakes come back in later sessions until answered right in a later session
let SESSION_ID = 0;
function missNote(key, ok) {
  const m = ST.miss[key];
  if (!ok) { ST.miss[key] = { n: 0, s: SESSION_ID, t: Date.now() }; return; }
  if (m && m.s !== SESSION_ID) { m.n++; m.s = SESSION_ID; if (m.n >= 1) delete ST.miss[key]; }
}
const missCount = () => Object.keys(ST.miss).length;
// grammar: rule k opens after lesson round(k * ratio); spread over the road in level order
function gramUnlocked() {
  const done = lessonsDone(), out = [];
  LEVELS.forEach(lv => {
    const Ls = LESSONS.filter(L => L.lv === lv), Gs = GRAMMAR.filter(g => g.lv === lv);
    const first = LESSONS.indexOf(Ls[0]), span = Math.max(1, Math.round(Ls.length * .8));
    Gs.forEach((g, i) => { const at = first + Math.floor(i * span / Gs.length); if (done >= at) out.push(g); });
  });
  return out;
}
const gramLearned = id => { const g = ST.gram[id]; return g && g.ok >= 3 && g.ok / Math.max(1, g.n) >= .7; };
function nextGrammar() {
  const un = gramUnlocked();
  return un.find(g => !gramLearned(g.id)) || null;
}
function gramReviewPool() { return GRAMMAR.filter(g => gramLearned(g.id)).sort((a, b) => (ST.gram[a.id].rt || ST.gram[a.id].t || 0) - (ST.gram[b.id].rt || ST.gram[b.id].t || 0)); }
function levelStats(lv) {
  const ws = WORDS.filter(w => w.lv === lv), gs = GRAMMAR.filter(g => g.lv === lv), us = UNITS.filter(u => u.lv === lv);
  const kw = ws.filter(w => known(w.id)).length, sw = ws.filter(w => ST.cards[w.id]).length;
  const kg = gs.filter(g => gramLearned(g.id)).length, dl = us.filter(u => ST.dlg[u.id]).length;
  const pct = (sw / ws.length) * .45 + (kw / ws.length) * .2 + (kg / gs.length) * .25 + (dl / us.length) * .1;
  return { ws: ws.length, kw, sw, gs: gs.length, kg, us: us.length, dl, pct };
}
function curLevel() { for (const lv of LEVELS) { const s = levelStats(lv); if (s.pct < .9) return { lv, pct: s.pct }; } return { lv: 'C1', pct: 1 }; }
function markDay(n) {
  const d = today(); ST.days[d] = (ST.days[d] || 0) + n;
  if (ST.streak.last !== d) {
    const y = new Date(Date.now() - DAY); const yd = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    ST.streak.n = ST.streak.last === yd ? ST.streak.n + 1 : 1; ST.streak.last = d; ST.streak.best = Math.max(ST.streak.best || 0, ST.streak.n);
  }
  save();
}
function streakNow() { const d = today(); const y = new Date(Date.now() - DAY); const yd = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); return (ST.streak.last === d || ST.streak.last === yd) ? ST.streak.n : 0; }

/* ------------------------------ exercises ------------------------------ */
// each exercise: {kind, key, render(body, done)} where done(ok) grades. Built fresh by make() so a retry is reshuffled.
// nouns that have no plural, so they are never offered as "…s" in fill-the-gap
const UNCOUNT = new Set('water tea coffee milk rice bread chicken weather rain snow wind music luggage cash money heating pollution inflation unemployment consumption progress feedback waste equality crime experience assistance leverage information advice news homework furniture time free time income debt budget rent fee salary exercise medicine fever space gym painting film emissions climate change fossil fuel equality'.split(' ').filter(Boolean));
// verbs with irregular past or doubled consonant are never auto-inflected as distractors
const IRREG = new Set('hurt leave lend send spend swim withdraw buy pay read meet understand speak wear get take make find give put run come set go feel keep bring think cost fall draw beat hold bear hang begin stop transfer cancel win lose sit forget drive ride write eat drink sleep sell tell say know see do have be cut shut let quit split'.split(' '));
['child','tooth','person','man','woman','foot','left','right','shoes','trousers','parents','news','wife','emissions','terms','sofa'].forEach(x => UNCOUNT.add(x));
const faParts = s => s.replace(/\(.*?\)/g, '').split(/[،؛,/]/).map(x => x.trim()).filter(Boolean);
const enKey = s => s.toLowerCase().replace(/\(.*?\)/g, '').trim();
function clash(w, x) {
  if (enKey(x.w) === enKey(w.w)) return true;
  const a = faParts(w.fa), b = faParts(x.fa);
  if (a.some(p => b.includes(p))) return true;
  const ws = w.syn.map(enKey), xs = x.syn.map(enKey);
  if (ws.includes(enKey(x.w)) || xs.includes(enKey(w.w)) || ws.some(p => xs.includes(p))) return true;
  return false;
}
function distractWords(w, n, field) {
  const same = WORDS.filter(x => x.id !== w.id && x.pos === w.pos && x[field] !== w[field] && !clash(w, x));
  const near = same.filter(x => x.u === w.u || x.lv === w.lv);
  const pool = near.length >= n ? near : same.length >= n ? same : WORDS.filter(x => x.id !== w.id && !clash(w, x));
  const out = [], seen = new Set([w[field]]);
  for (const x of shuffle(pool)) { if (!seen.has(x[field])) { seen.add(x[field]); out.push(x); } if (out.length >= n) break; }
  return out;
}
function mcq(body, opts, correct, done, cls) {
  const box = el('div');
  shuffle(opts).forEach(o => {
    const b = el('button', 'opt ' + (cls || ''), esc(o));
    b.onclick = () => {
      if (box.dataset.done) return; box.dataset.done = 1;
      const ok = o === correct; b.classList.add(ok ? 'ok' : 'bad'); haptic(ok);
      if (!ok) [...box.children].forEach(x => { if (x.textContent === correct) x.classList.add('ok'); });
      done(ok, correct);
    };
    box.appendChild(b);
  });
  body.appendChild(box);
}
function blankIn(sentence, word) {
  const base = word.replace(/\s*\(.*?\)\s*/g, '').trim();
  const forms = [base, base + 's', base + 'es', base + 'ed', base + 'd', base + 'ing', base.replace(/e$/, '') + 'ing'];
  for (const f of forms.sort((a, b) => b.length - a.length)) {
    const re = new RegExp('\\b' + f.replace(/[.*+?^${}()|[\]\\']/g, m => '\\' + m) + '\\b', 'i');
    if (re.test(sentence)) return { text: sentence.replace(re, '<span class="gap">_____</span>'), form: sentence.match(re)[0] };
  }
  return null;
}
function wordEx(w, kind) {
  const c = ST.cards[w.id] || { b: 0 };
  if (!kind) {
    const kinds = ['en2fa', 'fa2en', 'listen'];
    if (blankIn(w.ex, w.w)) kinds.push('cloze', 'cloze');
    if (c.b >= 2) kinds.push('type');
    if (c.b >= 2 && w.syn.length) kinds.push('syn');
    kind = kinds[Math.floor(Math.random() * kinds.length)];
  }
  const key = 'w:' + w.id;
  const R = {
    en2fa(body, done) {
      body.innerHTML = `<div class="eyebrow c" style="text-align:center">what does it mean?</div><div style="display:flex;justify-content:center;margin-top:14px">${pic(w, false)}</div><div class="prompt"><div class="w">${esc(w.w)}</div>${sayBtn(w.w)}</div>`;
      say(w.w, { quiet: true });
      mcq(body, [w.fa, ...distractWords(w, 3, 'fa').map(x => x.fa)], w.fa, done, 'fa');
    },
    fa2en(body, done) {
      body.innerHTML = `<div class="eyebrow" style="text-align:center">choose the English</div><div class="prompt"><div class="fa">${esc(w.fa)}</div><div class="xs" style="margin-top:6px">${esc(POS[w.pos] || '')}</div></div>`;
      mcq(body, [w.w, ...distractWords(w, 3, 'w').map(x => x.w)], w.w, (ok, cor) => { say(w.w, { quiet: true }); done(ok, cor); });
    },
    listen(body, done) {
      body.innerHTML = `<div class="eyebrow" style="text-align:center">listen and choose</div><div class="prompt">${sayBtn(w.w, 'big')}<div style="margin-top:8px">${sayBtn(w.w).replace('data-say', 'data-slow="1" data-say').replace('🔊', '🐢')}</div></div>`;
      setTimeout(() => say(w.w, { quiet: true }), 60);
      mcq(body, [w.w, ...distractWords(w, 3, 'w').map(x => x.w)], w.w, done);
    },
    cloze(body, done) {
      const b = blankIn(w.ex, w.w);
      if (!b) return R.fa2en(body, done);
      body.innerHTML = `<div class="eyebrow" style="text-align:center">complete the sentence</div><div class="card" style="margin-top:16px;font-size:19px;font-weight:600;text-align:center">${b.text}</div><div class="fa c" style="font-size:15px;color:var(--dim);text-align:center">${esc(w.exfa)}</div>`;
      const suf = (b.form.toLowerCase().match(/(ing|ed|es|s|d)$/) || [''])[0];
      const base = enKey(w.w), extra = suf && b.form.toLowerCase() !== base ? b.form.toLowerCase().slice(base.replace(/e$/, '').length) : '';
      const inflect = x => { const t = enKey(x); if (!extra || /\s/.test(t)) return t; if (extra === 'ing') return t.replace(/e$/, '') + 'ing'; if (/^(ed|d)$/.test(extra)) return t.endsWith('e') ? t + 'd' : t + 'ed'; if (/^(es|s)$/.test(extra)) return /[^aeiou]y$/.test(t) ? t.slice(0, -1) + 'ies' : /(s|sh|ch|x)$/.test(t) ? t + 'es' : t + 's'; return t; };
      const cap = s2 => /^[A-Z]/.test(b.form) ? s2[0].toUpperCase() + s2.slice(1) : s2;
      const ds = [...new Set(distractWords(w, 5, 'w').filter(x => /\s/.test(enKey(x.w)) === /\s/.test(base) && !(extra && x.pos === 'n' && UNCOUNT.has(enKey(x.w))) && !(extra && x.pos === 'v' && IRREG.has(enKey(x.w)))).map(x => cap(inflect(x.w))))].filter(x => x.toLowerCase() !== b.form.toLowerCase()).slice(0, 3);
      if (ds.length < 3) return R.fa2en(body, done);
      mcq(body, [b.form, ...ds], b.form, (ok, cor) => { say(w.ex, { quiet: true }); done(ok, cor); });
    },
    type(body, done) {
      body.innerHTML = `<div class="eyebrow" style="text-align:center">type it in English</div><div class="prompt"><div class="fa">${esc(w.fa)}</div><div class="xs" style="margin-top:6px">${esc(enKey(w.w)[0])}${'·'.repeat(Math.max(0, enKey(w.w).length - 1))}</div></div>
        <input class="typebox" id="tb" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="type here"><button class="btn" id="tbgo" style="margin-top:12px">Check</button>`;
      const inp = body.querySelector('#tb'); setTimeout(() => inp.focus(), 50);
      const norm = s => s.toLowerCase().replace(/[’']/g, "'").replace(/\(.*?\)/g, '').replace(/[^a-z' -]/g, '').replace(/\s+/g, ' ').trim();
      const go = () => {
        if (body.dataset.done) return; body.dataset.done = 1;
        const ok = norm(inp.value) === norm(w.w); haptic(ok); say(w.w, { quiet: true });
        inp.style.borderColor = ok ? 'var(--mint)' : 'var(--coral)'; done(ok, w.w);
      };
      body.querySelector('#tbgo').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
    },
    syn(body, done) {
      const s = w.syn[0];
      body.innerHTML = `<div class="eyebrow" style="text-align:center">which word is a synonym?</div><div class="prompt"><div class="w" style="font-size:28px">${esc(s)}</div><div class="xs" style="margin-top:6px">synonym = a word with a similar meaning · مترادف</div></div>`;
      const ds = distractWords(w, 3, 'w').filter(x => !x.syn.includes(s)).map(x => x.w);
      mcq(body, [w.w, ...ds.slice(0, 3)], w.w, done);
    }
  };
  return { kind: 'word', key, w, render: R[kind] || R.en2fa, grade: ok => grade(w.id, ok), feedback: () => `<b>${esc(w.w)}</b> = <span class="fa">${esc(w.fa)}</span><div style="margin-top:6px">${esc(w.ex)}</div><div class="fa" style="margin-top:2px">${esc(w.exfa)}</div>`, remake: () => wordEx(w) };
}
function introCard(w, L, i, n) {
  return {
    kind: 'intro', key: 'i:' + w.id, noGrade: true, render(body, done) {
      body.innerHTML = `<div class="between"><span class="eyebrow">new word ${i + 1} / ${n}</span>${lvChip(w.lv)}</div>
        ${pic(w, true)}
        <div class="c" style="text-align:center;margin-top:10px"><div class="row" style="justify-content:center"><span class="w" style="font-size:34px;font-weight:850">${esc(w.w)}</span>${sayBtn(w.w)}</div>
        <div class="xs">${esc(POS[w.pos] || '')}</div>
        <div class="fa" style="font-size:24px;margin-top:6px;text-align:center">${esc(w.fa)}</div>
        ${w.syn.length ? `<div style="margin-top:8px"><span class="xs">synonyms · مترادف: </span>${w.syn.map(s => `<span class="syn">${esc(s)}</span>`).join('')}</div>` : ''}</div>
        <div class="ex"><div class="between"><div class="en grow">${esc(w.ex)}</div>${sayBtn(w.ex)}</div><div class="fa">${esc(w.exfa)}</div></div>
        <button class="btn" id="gotit" style="margin-top:18px">Got it →</button>`;
      say(w.w, { quiet: true });
      const p = body.querySelector('.pic3d'); if (p) tilt(p);
      body.querySelector('#gotit').onclick = () => { introduce(w.id); done(true); };
    }
  };
}
function tilt(p) {
  const st = p.parentElement; let sx = 0, sy = 0;
  st.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; st.setPointerCapture && st.setPointerCapture(e.pointerId); });
  st.addEventListener('pointermove', e => { if (!e.buttons && e.pointerType === 'mouse') return; p.style.setProperty('--ry', Math.max(-35, Math.min(35, (e.clientX - sx) / 3)) + 'deg'); p.style.setProperty('--rx', Math.max(-30, Math.min(30, -(e.clientY - sy) / 3)) + 'deg'); });
  st.addEventListener('pointerup', () => { p.style.removeProperty('--rx'); p.style.removeProperty('--ry'); });
}
function grammarTeach(g, review) {
  return {
    kind: 'gteach', key: 'gt:' + g.id, noGrade: true, render(body, done) {
      body.innerHTML = gramHTML(g, review) + `<button class="btn" id="gok" style="margin-top:16px">${review ? 'Practise →' : 'I understand → practise'}</button>`;
      body.querySelector('#gok').onclick = () => {
        const s = ST.gram[g.id] || (ST.gram[g.id] = { n: 0, ok: 0 });
        if (review) s.rt = Date.now(); else s.t = s.t || Date.now(); save(); done(true);
      };
    }
  };
}
function gramHTML(g, review) {
  return `<div class="between"><span class="eyebrow">${review ? 'grammar review' : 'grammar'}</span>${lvChip(g.lv)}</div>
    <div class="h2" style="margin-top:6px">${esc(g.t)}</div><div class="fa" style="color:var(--dim);font-size:15px">${esc(g.fa)}</div>
    <div class="card">${g.r.map(r => `<div class="rule"><div style="font-weight:600">${esc(r[0])}</div><div class="fa" style="color:var(--dim);font-size:14px;margin-top:3px">${esc(r[1])}</div></div>`).join('')}</div>
    <div class="eyebrow" style="margin:14px 4px 4px">examples</div>
    <div class="card">${(review ? g.ex.slice(0, 3) : g.ex).map(x => `<div class="list-item"><div class="grow"><div style="font-weight:600">${esc(x[0])}</div><div class="fa" style="color:var(--dim);font-size:14px">${esc(x[1])}</div></div>${sayBtn(x[0])}</div>`).join('')}</div>
    <div class="tip"><div class="eyebrow" style="color:var(--gold)">tip for Persian speakers · نکته</div><div class="fa" style="margin-top:4px;font-size:15px">${esc(g.tip)}</div></div>`;
}
function grammarDrill(g, k) {
  const d = g.d[k];
  return {
    kind: 'gdrill', key: 'g:' + g.id + ':' + k, render(body, done) {
      const q = esc(d[0]).replace('___', '<span class="gap">_____</span>');
      body.innerHTML = `<div class="between"><span class="eyebrow">grammar · ${esc(g.t)}</span>${lvChip(g.lv)}</div><div class="card" style="margin-top:16px;font-size:19px;font-weight:600;text-align:center">${q}</div>`;
      mcq(body, d.slice(1), d[1], (ok, cor) => { if (d[0].includes('___')) say(d[0].replace('___', cor === '—' ? '' : cor).replace(/s+/g, ' '), { quiet: true }); else say(cor, { quiet: true }); done(ok, cor); });
    },
    grade(ok) { const s = ST.gram[g.id] || (ST.gram[g.id] = { n: 0, ok: 0 }); s.n++; if (ok) s.ok++; if (!ok) missNote('g:' + g.id + ':' + k, false); save(); },
    feedback: () => esc(d[0].includes('___') ? d[0].replace('___', d[1]) : d[1]), remake: () => grammarDrill(g, k)
  };
}
function dialogueCard(u, blind) {
  return {
    kind: 'dlg', key: 'd:' + u.id, noGrade: true, render(body, done) {
      const d = u.d;
      body.innerHTML = `<div class="between"><span class="eyebrow">listening · dialogue</span>${lvChip(u.lv)}</div><div class="h2" style="margin-top:6px">${u.i} ${esc(d.t)}</div><div class="fa" style="color:var(--dim)">${esc(d.fa)}</div>
        <div class="sm" style="margin-top:8px">${blind ? 'Listen first without reading. Then answer two questions.' : 'Tap any line to hear it again.'}</div>
        <div class="row" style="justify-content:center;margin:16px 0">${`<button class="say big" id="dplay">▶</button>`}</div>${speedSeg()}
        <div id="dlines" class="${blind ? 'hide' : ''}">${dlgLines(u)}</div>
        <button class="btn line sm" id="dshow" style="margin-top:10px">${blind ? 'Show the text' : 'Hide Farsi'}</button>
        <button class="btn" id="dnext" style="margin-top:12px">${blind ? 'Answer the questions →' : 'Continue →'}</button>`;
      const lines = body.querySelector('#dlines');
      body.querySelector('#dplay').onclick = () => playDialogue(u, body);
      body.querySelector('#dshow').onclick = e => { if (lines.classList.contains('hide')) { lines.classList.remove('hide'); e.target.textContent = 'Hide Farsi'; } else { lines.querySelectorAll('.fa').forEach(x => x.classList.toggle('hide')); } };
      body.querySelector('#dnext').onclick = () => { stopSpeech(); done(true); };
      bindSpeed(body);
      setTimeout(() => playDialogue(u, body), 80);
    }
  };
}
function dlgLines(u) { const d = u.d; return d.l.map((l, i) => `<div class="dl ${l[0] ? 'r' : ''}"><div class="bub" data-li="${i}" data-say="${esc(l[1])}"><div class="spk">${esc(d.sp[l[0]])}</div><div>${esc(l[1])}</div><div class="fa">${esc(l[2])}</div></div></div>`).join(''); }
function isMaleName(n) { return /^(reza|sam|tom|omid|hamed|babak|kian|ali|ben|mark|jack|farhad|kaveh|mehdi|sina|paul|kamran|pouya|nima|arman|shahin|dariush|dr karimi|manager|doctor|clerk|waiter|landlord|officer|host)$/i.test(n.trim()); }
let DLG_RUN = 0;
function playDialogue(u, scope) {
  const run = ++DLG_RUN, d = u.d; let i = 0;
  const step = () => {
    if (run !== DLG_RUN || i >= d.l.length) { scope && scope.querySelectorAll('.bub').forEach(b => b.classList.remove('now')); return; }
    const l = d.l[i], b = scope && scope.querySelector(`[data-li="${i}"]`);
    scope && scope.querySelectorAll('.bub').forEach(x => x.classList.remove('now')); if (b) { b.classList.add('now'); }
    const male = isMaleName(d.sp[l[0]]);
    say(l[1], { quiet: true, male, pitch: l[0] ? 1.08 : .92, end: () => { i++; setTimeout(step, 350); } });
  };
  step();
}
function speedSeg() { const r = ST.rate || 1; return `<div class="seg" style="justify-content:center">${[[1, 'normal'], [.85, 'slower'], [.7, 'slow'], [.55, 'very slow']].map(x => `<button data-rate="${x[0]}" class="${r === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div>`; }
function bindSpeed(scope) { scope.querySelectorAll('[data-rate]').forEach(b => b.onclick = () => { ST.rate = +b.dataset.rate; save(); scope.querySelectorAll('[data-rate]').forEach(x => x.classList.toggle('on', x === b)); toast('Speed: ' + b.textContent); }); }
function dlgQuestion(u, k) {
  const q = u.d.q[k];
  return {
    kind: 'dq', key: 'l:' + u.id + ':' + k, render(body, done) {
      body.innerHTML = `<div class="eyebrow">dialogue · ${esc(u.d.t)}</div><div class="card" style="margin-top:16px"><div style="font-size:18px;font-weight:700">${esc(q.q)}</div><div class="fa" style="color:var(--dim);margin-top:4px">${esc(q.fa || '')}</div></div>`;
      mcq(body, q.o, q.o[0], done);
    },
    grade(ok) { if (!ok) missNote('l:' + u.id + ':' + k, false); ST.dlg[u.id] = Date.now(); save(); },
    feedback: () => esc(q.o[0]), remake: () => dlgQuestion(u, k)
  };
}

/* ------------------------------ session runner ------------------------------ */
const RUN = () => $('#run');
let sess = null;
function startSession(items, title, onEnd) {
  if (!items.length) return toast('Nothing to practise right now 🎉');
  SESSION_ID = Date.now();
  sess = { items, i: 0, ok: 0, n: 0, title, onEnd, retries: 0 };
  const r = RUN(); r.style.display = 'flex'; document.body.style.overflow = 'hidden';
  r.innerHTML = `<div class="runtop"><button class="icob" id="rx">✕</button><div class="runbar"><div class="bar"><i id="rbar" style="width:0"></i></div></div><span class="xs" id="rcount"></span></div><div class="runbody" id="rbody"></div>`;
  $('#rx').onclick = () => { if (confirm('Stop this session? Your progress so far is saved.')) endSession(true); };
  step();
}
function step() {
  if (!sess) return;
  if (sess.i >= sess.items.length) return finish();
  const it = sess.items[sess.i], body = $('#rbody');
  body.innerHTML = ''; body.dataset.done = ''; body.scrollTop = 0;
  $('#rbar').style.width = (100 * sess.i / sess.items.length) + '%';
  $('#rcount').textContent = (sess.i + 1) + '/' + sess.items.length;
  try { it.render(body, (ok, cor) => answered(it, ok, cor)); }
  catch (e) { logErr('render ' + it.key + ' ' + e.message); sess.i++; step(); }
}
function answered(it, ok, cor) {
  if (it.noGrade) { sess.i++; return step(); }
  sess.n++; if (ok) sess.ok++;
  if (!it.retry) { if (it.grade) it.grade(ok); if (ok) missNote(it.key, true); }
  if (!ok && !it.retry && it.remake && sess.retries < 10) {   // a wrong answer comes back three cards later
    const r = it.remake(); r.retry = true; sess.retries++;
    sess.items.splice(Math.min(sess.items.length, sess.i + 4), 0, r);
  }
  const body = $('#rbody');
  const fb = el('div', 'feedback ' + (ok ? 'ok' : 'bad'), (ok ? '✓ Correct! · درست است' : '✗ Not quite · نادرست') + (it.feedback ? `<div style="margin-top:6px">${it.feedback()}</div>` : ''));
  body.appendChild(fb);
  const nb = el('button', 'btn', 'Continue →'); nb.style.marginTop = '12px';
  nb.onclick = () => { stopSpeech(); sess.i++; step(); };
  body.appendChild(nb); nb.scrollIntoView({ behavior: 'smooth', block: 'end' });
  if (ok) setTimeout(() => { if (nb.isConnected && sess && sess.items[sess.i] === it) nb.click(); }, it.kind === 'word' && it.render.name === 'type' ? 1400 : 1100);
}
function finish() {
  const s = sess; markDay(s.n || 1); saveNow();
  const pct = s.n ? Math.round(100 * s.ok / s.n) : 100;
  $('#rbar').style.width = '100%';
  $('#rbody').innerHTML = `<div style="text-align:center;margin-top:40px"><div class="trophy">${pct >= 80 ? '🏆' : pct >= 50 ? '🏅' : '💪'}</div>
    <div class="h1">${pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Well done!' : 'Keep going!'}</div><div class="fa c" style="text-align:center;font-size:17px">${pct >= 80 ? 'عالی بود!' : pct >= 50 ? 'آفرین!' : 'ادامه بده!'}</div>
    <div class="row" style="margin-top:22px"><div class="stat"><b>${s.ok}/${s.n}</b><span class="xs">correct</span></div><div class="stat gold"><b>🔥 ${streakNow()}</b><span class="xs">day streak</span></div><div class="stat"><b>${seenWords().length}</b><span class="xs">words met</span></div></div>
    <div class="card" style="text-align:left;margin-top:16px"><div class="eyebrow">next up</div><div class="sm" style="margin-top:4px;color:var(--tx)">${esc(nextHint())}</div></div>
    <button class="btn" id="fin" style="margin-top:16px">Done</button></div>`;
  $('#fin').onclick = () => endSession(false);
}
function endSession(aborted) {
  stopSpeech(); DLG_RUN++;
  const s = sess; sess = null; saveNow();
  RUN().style.display = 'none'; RUN().innerHTML = ''; document.body.style.overflow = '';
  try { if (s && s.onEnd && !aborted) s.onEnd(s); } catch (e) { logErr('onEnd ' + e.message); }
  render();
  if (window.__pendingBuild) { const v = window.__pendingBuild; window.__pendingBuild = null; setTimeout(() => location.replace(location.pathname + '?v=' + encodeURIComponent(v)), 300); }
}
function nextHint() {
  const due = dueList(Date.now() + DAY).length, L = nextLesson();
  return `${due} words come back for review within 24 hours. ` + (L ? `Next lesson: ${lessonTitle(L)} (${L.lv}).` : 'You have finished the whole road to C1 — keep reviewing!');
}

/* ------------------------------ building sessions ------------------------------ */
function missItems(limit) {
  const out = [];
  Object.entries(ST.miss).sort((a, b) => a[1].t - b[1].t).forEach(([k]) => {
    if (out.length >= limit) return;
    const p = k.split(':');
    if (p[0] === 'w' && WMAP[p[1]]) out.push(wordEx(WMAP[p[1]]));
    else if (p[0] === 'g' && GMAP[p[1]] && GMAP[p[1]].d[+p[2]]) out.push(grammarDrill(GMAP[p[1]], +p[2]));
    else if (p[0] === 'l' && UMAP[p[1]]) out.push(dlgQuestion(UMAP[p[1]], +p[2]));
    else if (p[0] === 'p') { const P = LISTEN.find(x => x.id === p[1]); if (P) out.push(passageQ(P, +p[2])); }
    else delete ST.miss[k];
  });
  return out;
}
function buildDaily() {
  const items = [], usedW = new Set();
  // 1. warm-up: mistakes from earlier sessions
  missItems(8).forEach(x => { items.push(x); if (x.w) usedW.add(x.w.id); });
  // 2. due reviews
  const due = dueList().filter(w => !usedW.has(w.id)).slice(0, 12);
  due.slice(0, 6).forEach(w => { items.push(wordEx(w)); usedW.add(w.id); });
  // 3. new words of the next lesson: intro card, then a check after every two
  const L = nextLesson(); const fresh = L ? L.words.filter(id => !ST.cards[id]).slice(0, ST.perDay || 8).map(id => WMAP[id]) : [];
  const half = Math.ceil(fresh.length / 2);
  const intro = (ws, off) => { ws.forEach((w, i) => { items.push(introCard(w, L, off + i, fresh.length)); if (i % 2 === 1) { items.push(wordEx(ws[i - 1], 'en2fa')); items.push(wordEx(w, 'listen')); } }); if (ws.length % 2) items.push(wordEx(ws[ws.length - 1], 'en2fa')); };
  intro(fresh.slice(0, half), 0);
  // 4. grammar every day: the next rule on the path, or a review of the oldest learned rule
  const g = nextGrammar();
  if (g) { const seen = ST.gram[g.id] && ST.gram[g.id].t; items.push(grammarTeach(g, false)); pick([...g.d.keys()], 4).forEach(k => items.push(grammarDrill(g, k))); }
  else { const rv = gramReviewPool()[0]; if (rv) { items.push(grammarTeach(rv, true)); pick([...rv.d.keys()], 3).forEach(k => items.push(grammarDrill(rv, k))); } }
  intro(fresh.slice(half), half);
  // 5. remaining reviews, mixed with production practice of today's words
  due.slice(6).forEach(w => items.push(wordEx(w)));
  fresh.forEach(w => { if (blankIn(w.ex, w.w)) items.push(wordEx(w, 'cloze')); });
  // 6. listening: when today's lesson finishes a unit, hear its dialogue and answer
  if (L && L.k === Math.ceil(UMAP[L.u].w.length / 8) - 1 && fresh.length && !ST.dlg[L.u]) { const u = UMAP[L.u]; items.push(dialogueCard(u, true)); u.d.q.forEach((_, k) => items.push(dlgQuestion(u, k))); }
  return items;
}
function quickReview() {
  const ws = seenWords(); if (!ws.length) return toast('Learn some words first');
  const w8 = ws.slice().sort((a, b) => ((ST.cards[b.id].w || 0) - (ST.cards[b.id].c || 0) * .3) - ((ST.cards[a.id].w || 0) - (ST.cards[a.id].c || 0) * .3) || ST.cards[a.id].lt - ST.cards[b.id].lt);
  startSession(w8.slice(0, 20).map(w => wordEx(w, pick(['en2fa', 'fa2en', 'listen'], 1)[0])), 'Quick review');
}
function unitPractice(u) {
  const ws = u.w.map((_, i) => WMAP[u.id + '-' + i]).filter(w => ST.cards[w.id]);
  if (ws.length < 4) return toast('Learn at least 4 words of this unit first');
  startSession(shuffle(ws).map(w => wordEx(w)), u.t);
}

/* ------------------------------ listening passages ------------------------------ */
function passageCard(P) {
  return {
    kind: 'pass', key: 'pp:' + P.id, noGrade: true, render(body, done) {
      body.innerHTML = `<div class="between"><span class="eyebrow">listening</span>${lvChip(P.lv)}</div><div class="h2" style="margin-top:6px">${esc(P.t)}</div><div class="fa" style="color:var(--dim)">${esc(P.fa)}</div>
      <div class="sm" style="margin-top:8px">Listen without reading first. Then answer.</div>
      <div class="row" style="justify-content:center;margin:16px 0"><button class="say big" id="pplay">▶</button></div>${speedSeg()}
      <div id="ptext" class="card hide">${P.s.map((x, i) => `<div class="rule" data-pi="${i}" data-say="${esc(x[0])}"><div style="font-weight:600">${esc(x[0])}</div><div class="fa" style="color:var(--dim);font-size:14px;margin-top:3px">${esc(x[1])}</div></div>`).join('')}</div>
      <button class="btn line sm" id="pshow" style="margin-top:8px">Show the text</button>
      <button class="btn" id="pnext" style="margin-top:12px">Answer the questions →</button>`;
      const play = () => { const run = ++DLG_RUN; let i = 0; const nx = () => { if (run !== DLG_RUN || i >= P.s.length) return; say(P.s[i][0], { quiet: true, end: () => { i++; setTimeout(nx, 300); } }); }; nx(); };
      body.querySelector('#pplay').onclick = play;
      body.querySelector('#pshow').onclick = () => body.querySelector('#ptext').classList.toggle('hide');
      body.querySelector('#pnext').onclick = () => { stopSpeech(); DLG_RUN++; done(true); };
      bindSpeed(body); setTimeout(play, 80);
    }
  };
}
function passageQ(P, k) {
  const q = P.q[k];
  return {
    kind: 'pq', key: 'p:' + P.id + ':' + k, render(body, done) { body.innerHTML = `<div class="eyebrow">${esc(P.t)}</div><div class="card" style="margin-top:16px;font-size:18px;font-weight:700">${esc(q.q)}</div>`; mcq(body, q.o, q.o[0], done); },
    grade(ok) { const s = ST.lis[P.id] || (ST.lis[P.id] = { n: 0, ok: 0 }); s.n++; if (ok) s.ok++; if (!ok) missNote('p:' + P.id + ':' + k, false); save(); },
    feedback: () => esc(q.o[0]), remake: () => passageQ(P, k)
  };
}

/* ------------------------------ screens ------------------------------ */
let TAB = 'today', SUB = null;
const TABS = [['today', '🏠', 'Today'], ['words', '📚', 'Words'], ['grammar', '🧠', 'Grammar'], ['listen', '🎧', 'Listen'], ['road', '🗺️', 'Road'], ['you', '👤', 'You']];
function render() {
  if (!ME) return;
  const a = $('#app');
  let h = '';
  try { h = ({ today: vToday, words: vWords, grammar: vGrammar, listen: vListen, road: vRoad, you: vYou })[TAB](); }
  catch (e) { logErr('view ' + TAB + ' ' + e.message); h = `<div class="card">Something went wrong. ${esc(e.message)}</div>`; }
  a.innerHTML = h + `<nav id="tabs">${TABS.map(t => `<button data-tab="${t[0]}" class="${TAB === t[0] ? 'on' : ''}"><b>${t[1]}</b>${t[2]}</button>`).join('')}</nav>`;
  a.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { TAB = b.dataset.tab; SUB = null; stopSpeech(); DLG_RUN++; render(); window.scrollTo(0, 0); });
  bind(a);
}
function ring(p, label) {
  const r = 24, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 58 58"><circle cx="29" cy="29" r="${r}" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="6"/><circle cx="29" cy="29" r="${r}" fill="none" stroke="url(#rg)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 29 29)"/><text x="29" y="33" text-anchor="middle" font-size="13" font-weight="800" fill="#0F2A6B">${label}</text></svg>`;
}
function vToday() {
  const L = nextLesson(), due = dueList().length, cl = curLevel(), g = nextGrammar(), mc = missCount(), st = streakNow();
  const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  return `<div class="between"><div><div class="eyebrow">english · a1 → c1</div><div class="h1">${greet}, ${esc(ME.name)}!</div></div><div class="chip gold">🔥 ${st}</div></div>
  <button class="card tap glow" id="daily" style="margin-top:14px">
    <div class="eyebrow">today's lesson · درس امروز</div>
    <div class="between" style="margin-top:6px"><div class="grow"><div class="h2">${L ? UMAP[L.u].i + ' ' + esc(lessonTitle(L)) : '🏁 Review & keep fluent'}</div>
    ${L ? `<div class="fa" style="text-align:left;font-size:14px;color:var(--dim)">${esc(UMAP[L.u].fa)}</div>` : ''}<div class="sm">${due} reviews · ${L ? L.words.filter(id => !ST.cards[id]).length + ' new words · ' : ''}grammar${g ? ': ' + esc(g.t) : ' review'}</div></div><span class="say big" style="pointer-events:none">▶</span></div>
  </button>
  ${mc ? `<button class="card tap" id="miss"><div class="between"><div><div class="eyebrow" style="color:var(--coral)">your mistakes · اشتباهات</div><div class="h3" style="margin-top:4px">${mc} question${mc > 1 ? 's' : ''} to master</div><div class="xs">They also open your next daily lessons until you get them right again.</div></div><span style="font-size:28px">🎯</span></div></button>` : ''}
  <div class="card"><div class="row">${ring(cl.pct, cl.lv)}<div class="grow"><div class="eyebrow">your level</div><div class="h3">${Math.round(cl.pct * 100)}% through ${cl.lv}</div><div class="bar" style="margin-top:8px"><i style="width:${Math.round(100 * lessonsDone() / LESSONS.length)}%"></i></div><div class="xs" style="margin-top:4px">Lesson ${Math.min(LESSONS.length, lessonsDone() + 1)} of ${LESSONS.length} on the road to C1</div></div></div></div>
  <div class="row"><button class="card tap grow" id="qr" style="margin:0"><div style="font-size:24px">⚡</div><div class="h3">Quick review</div><div class="xs">${seenWords().length} words met</div></button>
  <button class="card tap grow" id="gl" style="margin:0"><div style="font-size:24px">🎧</div><div class="h3">Listening</div><div class="xs">${UNITS.filter(u => ST.dlg[u.id]).length} dialogues done</div></button></div>
  <div class="card"><div class="eyebrow">this week</div>${weekBars()}</div>`;
}
function weekBars() {
  const ds = []; for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * DAY); ds.push([d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), 'SMTWTFS'[d.getDay()]]); }
  const mx = Math.max(10, ...ds.map(d => ST.days[d[0]] || 0));
  return `<div class="row" style="align-items:flex-end;height:70px;margin-top:8px">${ds.map(d => `<div class="grow" style="text-align:center"><div style="height:${Math.round(50 * (ST.days[d[0]] || 0) / mx) + 3}px;border-radius:6px;background:${ST.days[d[0]] ? 'var(--grad)' : 'rgba(255,255,255,.08)'}"></div><div class="xs">${d[1]}</div></div>`).join('')}</div>`;
}
function vWords() {
  if (SUB && UMAP[SUB]) {
    const u = UMAP[SUB];
    return `<button class="btn ghost sm inl" data-back>‹ All units</button><div class="row" style="margin-top:12px"><span style="font-size:36px">${u.i}</span><div class="grow"><div class="h2">${esc(u.t)}</div><div class="fa" style="color:var(--dim)">${esc(u.fa)}</div></div>${lvChip(u.lv)}</div>
    <button class="btn sm" data-upr="${u.id}" style="margin-top:12px">Practise this unit</button>
    <div class="card">${u.w.map((_, i) => { const w = WMAP[u.id + '-' + i], c = ST.cards[w.id]; return `<div class="list-item">${pic(w)}<div class="grow"><div class="between"><b>${esc(w.w)}</b><span class="xs">${c ? (c.b >= 3 ? '<span class="done-mark">✓ known</span>' : 'learning') : 'new'}</span></div><div class="fa" style="color:var(--dim);font-size:14px">${esc(w.fa)}</div>${w.syn.length ? `<div class="xs">≈ ${esc(w.syn.join(', '))}</div>` : ''}<div class="xs" style="margin-top:2px">${esc(w.ex)}</div></div>${sayBtn(w.w)}</div>`; }).join('')}</div>`;
  }
  return `<div class="eyebrow">vocabulary · واژگان</div><div class="h1">Words</div>
  <div class="row"><div class="stat"><b>${seenWords().length}</b><span class="xs">met</span></div><div class="stat"><b>${WORDS.filter(w => known(w.id)).length}</b><span class="xs">known</span></div><div class="stat"><b>${dueList().length}</b><span class="xs">due now</span></div></div>
  <button class="btn" id="qr" style="margin-top:12px">⚡ Quick review (20)</button>
  <input class="typebox" id="wsearch" placeholder="search English or فارسی" style="margin-top:12px;text-align:left;font-size:15px">
  <div id="wres"></div>
  ${LEVELS.map(lv => `<div class="sec between"><span class="eyebrow">${lv}</span></div>` + UNITS.filter(u => u.lv === lv).map(u => { const n = u.w.filter((_, i) => ST.cards[u.id + '-' + i]).length; return `<button class="card tap" data-unit="${u.id}" style="margin:6px 0"><div class="row"><span style="font-size:28px">${u.i}</span><div class="grow"><div class="h3">${esc(u.t)}</div><div class="fa" style="font-size:13px;color:var(--dim);text-align:left">${esc(u.fa)}</div></div><span class="xs">${n}/${u.w.length}</span></div><div class="bar" style="margin-top:8px;height:5px"><i style="width:${100 * n / u.w.length}%"></i></div></button>`; }).join('')).join('')}`;
}
function vGrammar() {
  if (SUB && GMAP[SUB]) {
    const g = GMAP[SUB]; const s = ST.gram[g.id];
    return `<button class="btn ghost sm inl" data-back>‹ All grammar</button><div style="margin-top:12px">${gramHTML(g, false)}</div>
    <button class="btn" data-gpr="${g.id}" style="margin-top:14px">Practise (${g.d.length} questions)</button>
    <div class="xs" style="text-align:center;margin-top:8px">${s ? `${s.ok}/${s.n} correct so far` : 'not practised yet'}</div>`;
  }
  const un = new Set(gramUnlocked().map(g => g.id));
  return `<div class="eyebrow">grammar · دستور زبان</div><div class="h1">Grammar</div><div class="sm">${GRAMMAR.length} lessons in CEFR order. A new one opens as you move along the road; you can read any lesson.</div>
  ${LEVELS.map(lv => `<div class="sec"><span class="eyebrow">${lv}</span></div><div class="card" style="padding:4px 14px">` + GRAMMAR.filter(g => g.lv === lv).map(g => `<button class="list-item" data-gram="${g.id}" style="width:100%;text-align:left"><span class="lvchip lv-${g.lv}">${GRAMMAR.indexOf(g) + 1}</span><div class="grow"><div style="font-weight:650">${esc(g.t)}</div><div class="fa" style="font-size:13px;color:var(--dim);text-align:left">${esc(g.fa)}</div></div><span>${gramLearned(g.id) ? '<span class="done-mark">✓</span>' : un.has(g.id) ? '🔓' : '🔒'}</span></button>`).join('') + '</div>').join('')}`;
}
function vListen() {
  if (SUB && SUB.startsWith('u') && UMAP[SUB]) {
    const u = UMAP[SUB];
    return `<button class="btn ghost sm inl" data-back>‹ Listening</button><div class="h2" style="margin-top:12px">${u.i} ${esc(u.d.t)}</div><div class="fa" style="color:var(--dim)">${esc(u.d.fa)}</div>
    <div class="row" style="justify-content:center;margin:14px 0"><button class="say big" data-dplay="${u.id}">▶</button></div>${speedSeg()}
    <div id="dscope">${dlgLines(u)}</div><button class="btn" data-dtest="${u.id}" style="margin-top:14px">Test yourself (${u.d.q.length} questions)</button>`;
  }
  if (SUB === 'sounds') {
    return `<button class="btn ghost sm inl" data-back>‹ Listening</button><div class="h2" style="margin-top:12px">Sounds for Persian speakers</div><div class="fa" style="color:var(--dim)">تلفظ‌هایی که برای فارسی‌زبان‌ها سخت است</div>
    ${SOUNDS.map(s => `<div class="card"><div class="h3">${esc(s.t)}</div><div class="fa" style="font-size:15px;margin-top:4px">${esc(s.fa2)}</div><div class="pairs">${s.p.map(p => `<button data-say="${esc(p[0])}">🔊 ${esc(p[0])}${p[1] && p[1] !== '—' ? `<div class="xs">${/✗|\//.test(p[1]) ? esc(p[1]) : 'vs ' + esc(p[1])}</div>` : ''}</button>${p[1] && p[1] !== '—' && !/✗|\//.test(p[1]) ? `<button data-say="${esc(p[1])}">🔊 ${esc(p[1])}</button>` : '<span></span>'}`).join('')}</div></div>`).join('')}`;
  }
  return `<div class="eyebrow">listening · شنیداری</div><div class="h1">Listen</div>
  <button class="card tap glow" data-sub="sounds"><div class="row"><span style="font-size:30px">👄</span><div class="grow"><div class="h3">Sounds for Persian speakers</div><div class="xs">th, v/w, "eschool", ship/sheep, stress…</div></div><span>›</span></div></button>
  <div class="sec"><span class="eyebrow">stories & announcements · ${LISTEN.length}</span></div>
  ${LISTEN.map(P => `<button class="card tap" data-pass="${P.id}" style="margin:6px 0"><div class="row">${lvChip(P.lv)}<div class="grow"><div class="h3">${esc(P.t)}</div><div class="fa" style="font-size:13px;color:var(--dim);text-align:left">${esc(P.fa)}</div></div><span class="xs">${ST.lis[P.id] ? '✓ ' + ST.lis[P.id].ok + '/' + ST.lis[P.id].n : '▶'}</span></div></button>`).join('')}
  <div class="sec"><span class="eyebrow">dialogues · ${UNITS.length}</span></div>
  ${UNITS.map(u => `<button class="card tap" data-dlg="${u.id}" style="margin:6px 0"><div class="row">${lvChip(u.lv)}<div class="grow"><div class="h3">${u.i} ${esc(u.d.t)}</div><div class="xs">${esc(u.t)}</div></div><span class="xs">${ST.dlg[u.id] ? '<span class="done-mark">✓</span>' : '▶'}</span></div></button>`).join('')}`;
}
function vRoad() {
  return `<div class="eyebrow">roadmap · نقشهٔ راه</div><div class="h1">Road to C1</div><div class="fa" style="color:var(--dim);font-size:15px">از صفر تا سطح C1 (چارچوب اروپایی CEFR). هر سطح با واژگان، دستور، مکالمه و شنیداری کامل می‌شود.</div>
  <div class="road" style="margin-top:14px">${ROAD.map(r => {
    const s = levelStats(r.lv), done = s.pct >= .9;
    return `<div class="card lv-${r.lv} ${done ? 'done' : ''}"><div class="between"><div><span class="lvchip lv-${r.lv}" style="font-size:13px">${r.lv}</span> <b>${esc(r.t)}</b> <span class="fa" style="color:var(--dim)">· ${esc(r.fa)}</span></div>${done ? '<span class="done-mark">✓</span>' : ''}</div>
    <div class="bar ${done ? 'gold' : ''}" style="margin-top:10px"><i style="width:${Math.round(100 * s.pct)}%"></i></div>
    <div class="xs" style="margin-top:6px">${s.sw}/${s.ws} words met · ${s.kg}/${s.gs} grammar · ${s.dl}/${s.us} dialogues · about ${r.hours} study hours</div>
    <div class="eyebrow" style="margin-top:12px">you will be able to · خواهید توانست</div>${r.can.map(c => `<div class="rule"><div>✔︎ ${esc(c[0])}</div><div class="fa" style="color:var(--dim);font-size:14px">${esc(c[1])}</div></div>`).join('')}
    <div class="eyebrow" style="margin-top:10px">outside the app · بیرون از برنامه</div>${r.out.map(c => `<div class="rule"><div>• ${esc(c[0])}</div><div class="fa" style="color:var(--dim);font-size:14px">${esc(c[1])}</div></div>`).join('')}</div>`;
  }).join('')}</div>
  <div class="card"><div class="h3">Honest note · یادداشت صادقانه</div><div class="sm" style="margin-top:4px">The app covers the vocabulary, grammar, listening and pronunciation core for each level. Real C1 also needs free conversation with people and corrected writing — plan those from B1 onwards.</div><div class="fa" style="margin-top:6px;font-size:14px;color:var(--dim)">این برنامه هستهٔ واژگان، دستور، شنیداری و تلفظ هر سطح را پوشش می‌دهد. برای C1 واقعی، مکالمهٔ آزاد با افراد و نوشتن با تصحیح هم لازم است؛ از سطح B1 آن‌ها را برنامه‌ریزی کنید.</div></div>`;
}
function vYou() {
  const vs = VOICES.slice().sort((a, b) => voiceScore(b, ST.accent, null) - voiceScore(a, ST.accent, null));
  const pref = S.get('en.voice', '');
  return `<div class="eyebrow">profile · نمایه</div><div class="row" style="margin-top:6px"><span class="av" style="width:56px;height:56px;font-size:24px">${esc(ME.name[0].toUpperCase())}</span><div class="grow"><div class="h2">${esc(ME.name)} ${ME.owner ? '<span class="chip gold">OWNER</span>' : ''}</div><div class="xs">${seenWords().length} words · ${GRAMMAR.filter(g => gramLearned(g.id)).length} grammar lessons · best streak ${ST.streak.best || 0} days</div></div></div>
  <div class="sec"><span class="eyebrow">daily new words</span></div><div class="card"><div class="seg">${[4, 6, 8].map(n => `<button data-per="${n}" class="${ST.perDay === n ? 'on' : ''}">${n} words · ${n === 4 ? '10' : n === 6 ? '15' : '20'} min</button>`).join('')}</div></div>
  <div class="sec"><span class="eyebrow">voice · صدا</span></div><div class="card">
    <div class="seg"><button data-acc="GB" class="${ST.accent === 'GB' ? 'on' : ''}">🇬🇧 British</button><button data-acc="US" class="${ST.accent === 'US' ? 'on' : ''}">🇺🇸 American</button></div>
    <div class="sm" style="margin-top:12px">Speed</div>${speedSeg()}
    <div class="sm" style="margin-top:12px">Voice on this phone</div>
    <select id="vsel" class="typebox" style="text-align:left;font-size:14px;margin-top:6px"><option value="">Automatic (best ${ST.accent === 'GB' ? 'British' : 'American'} voice)</option>${vs.map(v => `<option value="${esc(v.voiceURI)}" ${pref === v.voiceURI ? 'selected' : ''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select>
    <button class="btn ghost sm" id="vtest" style="margin-top:10px">🔊 Test: "Hello, nice to meet you."</button>
    <div class="xs" style="margin-top:8px">${VOICES.length} English voices found${SPEECH_ERR ? ' · last error: ' + esc(SPEECH_ERR) : ''}. Better voices: iPhone Settings → Accessibility → Spoken Content → Voices → English → download an "Enhanced" voice (e.g. Serena or Daniel). If you hear nothing, turn off silent mode and turn the volume up.</div>
    <div class="fa" style="font-size:13px;color:var(--dim);margin-top:6px">برای صدای بهتر: تنظیمات آیفون ← Accessibility ← Spoken Content ← Voices ← English و یک صدای Enhanced دانلود کنید.</div></div>
  ${ME.owner ? ownerCard() : ''}
  <div class="sec"><span class="eyebrow">app & backup</span></div><div class="card">
    <div class="between"><div><div class="h3">Version</div><div class="xs">${esc(BUILD)}</div></div><button class="btn ghost sm inl" id="chk">Check for update</button></div>
    <div class="row" style="margin-top:12px"><button class="btn ghost sm" id="exp">Export backup</button><button class="btn ghost sm" id="imp">Import backup</button></div>
    <button class="btn line sm" id="sw" style="margin-top:10px">Switch learner</button>
    ${ERRLOG.length ? `<div class="xs" style="margin-top:10px">Diagnostics: ${ERRLOG.length} errors logged <button class="chip" id="errs">show</button></div>` : ''}
    <div class="xs" style="margin-top:10px">Install: open in Safari → Share → Add to Home Screen. Your progress stays on this phone; updates arrive by themselves.</div></div>`;
}
function ownerCard() {
  const inv = S.get('en.invites', []);
  return `<div class="sec"><span class="eyebrow">owner · invitations</span></div><div class="card">
    <div class="sm">Invite someone by name. The app makes their personal code (first letter of their name + 4 numbers) and opens your Messages / WhatsApp with the link and the code.</div>
    <div class="fa" style="font-size:13px;color:var(--dim);margin-top:4px">نام فرد را به انگلیسی بنویسید؛ کد او ساخته می‌شود و لینک و کد با پیام ارسال می‌شود.</div>
    <input class="typebox" id="invn" placeholder="name in English, e.g. Sara" style="text-align:left;font-size:15px;margin-top:10px">
    <button class="btn sm" id="invgo" style="margin-top:10px">Create code & send</button>
    ${inv.length ? `<div class="eyebrow" style="margin-top:14px">invited</div>` + inv.map(x => `<div class="list-item"><div class="grow"><b>${esc(x.name)}</b><div class="xs">${esc(x.date)}</div></div><span style="color:var(--gold);font-weight:800;letter-spacing:.12em">${esc(x.code)}</span><button class="icob" data-reinv="${esc(x.name)}">↗</button></div>`).join('') : ''}
    <div class="xs" style="margin-top:10px">Limits: there is no server, so a code cannot be revoked; it works once per phone. Only people you send the link to will find the app.</div></div>`;
}
function sendInvite(name) {
  const code = inviteCode(name), link = location.origin + location.pathname.replace(/[^/]*$/, '');
  const text = `Hi ${name}! 👋\nYou're invited to our English app (A1 → C1), made for Persian speakers.\nسلام ${name}! به اپلیکیشن آموزش انگلیسی ما دعوت شده‌ای.\n\n1. Open this link in Safari / این لینک را در Safari باز کن:\n${link}\n2. Share → Add to Home Screen / Share ← Add to Home Screen\n3. Tap "I have an invitation code" and enter:\n   Name / نام: ${name}\n   Code / کد: ${code}\n\nGood luck! موفق باشی!`;
  if (navigator.share) navigator.share({ title: 'English app invitation', text }).catch(() => { });
  else { const a = el('a'); a.href = 'sms:?&body=' + encodeURIComponent(text); document.body.appendChild(a); a.click(); a.remove(); }
  try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) { }
  return code;
}
function bind(a) {
  const on = (sel, f) => a.querySelectorAll(sel).forEach(b => b.onclick = e => f(b, e));
  on('#daily', () => { const it = buildDaily(); startSession(it, 'Daily'); });
  on('#miss', () => startSession(missItems(12), 'Mistakes'));
  on('#qr', quickReview);
  on('#gl', () => { TAB = 'listen'; render(); });
  on('[data-back]', () => { SUB = null; stopSpeech(); DLG_RUN++; render(); window.scrollTo(0, 0); });
  on('[data-unit]', b => { SUB = b.dataset.unit; render(); window.scrollTo(0, 0); });
  on('[data-upr]', b => unitPractice(UMAP[b.dataset.upr]));
  on('[data-gram]', b => { SUB = b.dataset.gram; render(); window.scrollTo(0, 0); });
  on('[data-gpr]', b => { const g = GMAP[b.dataset.gpr]; if (!ST.gram[g.id]) ST.gram[g.id] = { n: 0, ok: 0, t: Date.now() }; startSession(shuffle([...g.d.keys()]).map(k => grammarDrill(g, k)), g.t); });
  on('[data-dlg]', b => { SUB = b.dataset.dlg; render(); window.scrollTo(0, 0); });
  on('[data-sub]', b => { SUB = b.dataset.sub; render(); window.scrollTo(0, 0); });
  on('[data-dplay]', b => playDialogue(UMAP[b.dataset.dplay], $('#dscope')));
  on('[data-dtest]', b => { const u = UMAP[b.dataset.dtest]; stopSpeech(); DLG_RUN++; startSession(u.d.q.map((_, k) => dlgQuestion(u, k)), u.d.t); });
  on('[data-pass]', b => { const P = LISTEN.find(x => x.id === b.dataset.pass); startSession([passageCard(P), ...P.q.map((_, k) => passageQ(P, k))], P.t); });
  on('[data-per]', b => { ST.perDay = +b.dataset.per; save(); render(); });
  on('[data-acc]', b => { ST.accent = b.dataset.acc; S.del('en.voice'); save(); render(); say('Hello, nice to meet you.'); });
  bindSpeed(a);
  const vs = a.querySelector('#vsel'); if (vs) vs.onchange = () => { if (vs.value) S.set('en.voice', vs.value); else S.del('en.voice'); say('Hello, nice to meet you.'); };
  on('#vtest', () => say('Hello, nice to meet you.'));
  on('#chk', () => checkUpdate(true));
  on('#sw', () => { saveNow(); ME = null; boot(); });
  on('#errs', () => alert(ERRLOG.map(e => e.t.slice(5, 16) + ' ' + e.b + ' ' + e.m).join('\n')));
  on('#exp', () => { const blob = new Blob([JSON.stringify({ app: 'english-c1', profile: ME, state: ST })], { type: 'application/json' }); const u = URL.createObjectURL(blob); const l = el('a'); l.href = u; l.download = 'english-backup-' + today() + '.json'; document.body.appendChild(l); l.click(); l.remove(); });
  on('#imp', () => { const i = el('input'); i.type = 'file'; i.accept = '.json,application/json'; i.onchange = () => { const f = i.files[0]; if (!f) return; f.text().then(t => { const j = JSON.parse(t); if (!j.state || !j.state.cards) throw new Error('not a backup'); if (!confirm('Replace the progress of ' + ME.name + ' with this backup?')) return; backupState(); ST = j.state; for (const k in FRESH()) if (!(k in ST)) ST[k] = FRESH()[k]; saveNow(); render(); toast('Backup restored'); }).catch(e => toast('Could not read that file')); }; i.click(); });
  on('#invgo', () => {
    const name = (a.querySelector('#invn').value || '').trim();
    if (!/[a-z]/i.test(name)) return toast('Type the name in English letters');
    const code = sendInvite(name);
    const inv = S.get('en.invites', []).filter(x => normName(x.name) !== normName(name)); inv.push({ name, code, date: today() }); S.set('en.invites', inv); render(); toast('Code ' + code + ' created');
  });
  on('[data-reinv]', b => sendInvite(b.dataset.reinv));
  const ws = a.querySelector('#wsearch');
  if (ws) ws.oninput = () => {
    const q = ws.value.trim().toLowerCase(), box = a.querySelector('#wres');
    if (q.length < 2) { box.innerHTML = ''; return; }
    const r = WORDS.filter(w => w.w.toLowerCase().includes(q) || w.fa.includes(q) || w.syn.some(s => s.toLowerCase().includes(q))).slice(0, 12);
    box.innerHTML = `<div class="card">${r.length ? r.map(w => `<div class="list-item">${pic(w)}<div class="grow"><b>${esc(w.w)}</b> ${lvChip(w.lv)}<div class="fa" style="color:var(--dim);font-size:14px">${esc(w.fa)}</div><div class="xs">${esc(w.ex)}</div></div>${sayBtn(w.w)}</div>`).join('') : '<div class="sm">No match</div>'}</div>`;
  };
}

/* ------------------------------ gate: owner, invitations, profiles ------------------------------ */
function gate(h) { $('#app').style.display = 'none'; const g = $('#gate'); g.style.display = 'flex'; g.innerHTML = h; return g; }
function boot() {
  const prim = PROFILES.find(p => p.id === S.get('en.primary', null));
  if (!prim) return setupUI();
  welcomeUI(prim);
}
function setupUI() {
  gate(`<div class="eyebrow">english · a1 → c1</div><div style="font-size:64px;margin:18px 0 4px">🇬🇧</div>
    <h1 class="h1" style="font-size:32px">Welcome!</h1><div class="fa" style="font-size:18px;text-align:left;direction:rtl">به اپلیکیشن آموزش انگلیسی خوش آمدید</div>
    <p class="sm" style="margin:10px 0 26px">English for Persian speakers, from the very first word to C1.</p>
    <button class="btn" id="join">I have an invitation code · کد دعوت دارم</button>
    <button class="btn line" id="own" style="margin-top:12px">I'm the owner · مالک برنامه هستم</button>`);
  $('#own').onclick = ownerUI; $('#join').onclick = joinUI;
}
function ownerUI() {
  gate(`<h1 class="h1">Owner</h1><p class="sm" style="margin:6px 0 18px">Your name and the owner code.</p>
    <input class="typebox" id="on" placeholder="your name" style="text-align:left;font-size:16px;margin-bottom:10px">
    <input class="typebox" id="oc" placeholder="owner code" autocapitalize="characters" autocomplete="off" maxlength="5" style="font-size:20px;letter-spacing:.3em;margin-bottom:16px">
    <button class="btn" id="og">Enter</button><button class="btn line" id="ob" style="margin-top:10px">Back</button>`);
  $('#ob').onclick = boot;
  $('#og').onclick = () => {
    const name = $('#on').value.trim(), code = $('#oc').value.trim().toUpperCase();
    if (!name) return toast('What is your name?');
    if (!isOwnerCode(code)) { haptic(false); return toast('Wrong owner code'); }
    let p = PROFILES.find(x => x.owner);
    if (!p) { p = { id: 'p1', name, owner: true }; PROFILES.unshift(p); }
    p.name = name; S.set(PKEY, PROFILES); S.set('en.primary', p.id); welcomeUI(p);
  };
}
function joinUI() {
  gate(`<h1 class="h1">Join with your invitation</h1><p class="sm" style="margin:6px 0 4px">Enter your name and code exactly as in the message you received.</p>
    <div class="fa" style="font-size:14px;color:var(--dim);margin-bottom:16px;text-align:left;direction:rtl">نام و کد را دقیقاً مثل پیام دعوت وارد کنید.</div>
    <input class="typebox" id="jn" placeholder="your name (as in the message)" style="text-align:left;font-size:16px;margin-bottom:10px">
    <input class="typebox" id="jc" placeholder="A1234" autocapitalize="characters" autocomplete="off" maxlength="5" style="font-size:22px;letter-spacing:.3em;margin-bottom:16px">
    <button class="btn" id="jgo">Unlock my profile</button><button class="btn line" id="jback" style="margin-top:10px">Back</button>`);
  $('#jback').onclick = boot;
  $('#jgo').onclick = () => {
    const name = $('#jn').value.trim(), code = $('#jc').value.trim().toUpperCase();
    if (!name || !CODE_RE.test(code)) return toast('Name and a code like A1234, please');
    if (isOwnerCode(code)) return ownerUI();
    if (inviteCode(name) !== code) { haptic(false); return toast('That code does not match this name'); }
    const used = S.get('en.usedCodes', []);
    let p = PROFILES.find(x => normName(x.name) === normName(name) && !x.owner);
    if (!p) { if (used.includes(code)) return toast('This code was already used on this phone'); p = { id: 'p' + (Date.now() % 1e7), name }; PROFILES.push(p); S.set(PKEY, PROFILES); S.set('en.usedCodes', [...used, code]); }
    S.set('en.primary', p.id); welcomeUI(p);
  };
}
function welcomeUI(p) {
  const st = S.get('en.' + p.id + '.state', null), started = st && st.cards && Object.keys(st.cards).length;
  gate(`<div class="eyebrow">english · a1 → c1</div><div style="text-align:center;margin:24px 0 6px"><span class="av" style="width:84px;height:84px;font-size:36px;border-radius:26px">${esc(p.name[0].toUpperCase())}</span></div>
    <h1 class="h1" style="text-align:center;font-size:30px">${started ? 'Welcome back' : 'Welcome'}, ${esc(p.name)}! 👋</h1>${p.owner ? '<div style="text-align:center"><span class="chip gold">OWNER</span></div>' : ''}
    <p class="sm" style="text-align:center;margin:8px 0 26px">${started ? Object.keys(st.cards).length + ' words met so far' : 'Your road to C1 starts today · سفر شما تا C1 از امروز شروع می‌شود'}</p>
    <button class="btn" id="cont">${started ? 'Continue learning →' : 'Start learning →'}</button>
    ${PROFILES.length > 1 ? '<button class="btn line" id="nyou" style="margin-top:12px">Not you? Switch learner</button>' : ''}
    <button class="btn ghost" id="join2" style="margin-top:10px">I have an invitation code</button>`);
  $('#cont').onclick = () => enter(p);
  if ($('#nyou')) $('#nyou').onclick = chooserUI;
  $('#join2').onclick = joinUI;
}
function chooserUI() {
  gate(`<h1 class="h1">Who's studying?</h1>${PROFILES.map(p => `<button class="who" data-p="${p.id}"><span class="av">${esc(p.name[0].toUpperCase())}</span><span class="grow"><span class="h3">${esc(p.name)}</span> ${p.owner ? '<span class="chip gold">OWNER</span>' : ''}</span>›</button>`).join('')}<button class="btn line" id="gb" style="margin-top:12px">Back</button>`);
  document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const p = PROFILES.find(x => x.id === b.dataset.p); S.set('en.primary', p.id); welcomeUI(p); });
  $('#gb').onclick = boot;
}
function enter(p) {
  ME = p; ST = loadState(p.id); S.set('en.primary', p.id);
  $('#gate').style.display = 'none'; $('#app').style.display = 'block'; TAB = 'today'; SUB = null; render();
  audioSession(); loadVoices();
}

/* ------------------------------ updates (same model as the Dutch app) ------------------------------ */
// On every open / return the app fetches its own index.html (no cache) and compares the BUILD tag.
// Only a higher bNN is offered; "Update" reloads with ?v=<build> so no cache can serve the old copy.
function checkUpdate(manual) {
  return fetch('./index.html?check=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.text() : '').then(t => {
    const m = /const BUILD = '([^']+)'/.exec(t || '');
    if (!m) { if (manual) toast('Could not check right now'); return; }
    const num = b => { const k = /b(\d+)/.exec(b || ''); return k ? +k[1] : 0; };
    if (num(m[1]) <= num(BUILD)) { if (manual) toast('You have the latest version (' + BUILD + ')'); return; }
    offerUpdate(m[1]);
  }).catch(() => { if (manual) toast('Offline — will check again later'); });
}
function offerUpdate(v) {
  if ($('#upd')) return;
  const b = el('div', 'update', `<span>🎁 New version ready · ${esc(v)}</span><button class="btn sm inl" id="updgo">Update</button>`); b.id = 'upd'; document.body.appendChild(b);
  $('#updgo').onclick = () => {
    saveNow(); backupState();
    if (sess) { window.__pendingBuild = v; toast('Updates after this session'); b.remove(); return; }
    location.replace(location.pathname + '?v=' + encodeURIComponent(v));
  };
}
try { if (location.search && history.replaceState) history.replaceState(null, '', location.pathname); } catch (e) { }
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => { });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) { audioSession(); setTimeout(() => checkUpdate(false), 1500); } else saveNow(); });
window.addEventListener('pagehide', saveNow);
['touchstart', 'pointerdown'].forEach(ev => document.addEventListener(ev, audioSession, { passive: true, capture: true }));

boot();
setTimeout(() => checkUpdate(false), 2500);
