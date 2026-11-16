'use strict';
/* English for Persian speakers — A1 → C2. One-file web app (built by build.mjs). */
const BUILD = '17 nov · b15';
const DAY = 864e5;

/* ------------------------------ data ------------------------------ */
const UNITS = DATA.units;                 // [{id,lv,t,fa,i,w:[[w,pos,fa,syn,ex,exfa,emoji]],d:{...}}]
const GRAMMAR = DATA.grammar;             // [{id,lv,t,fa,r,ex,tip,d:[[q,correct,wrong,wrong]]}]
const LISTEN = DATA.extra.listen, SOUNDS = DATA.extra.sounds, ROAD = DATA.extra.road;
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
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
  return { v: 1, cards: {}, gram: {}, dlg: {}, lis: {}, miss: {}, days: {}, streak: { last: '', n: 0, best: 0 }, xp: 0, perDay: 30, voice: 'f1', vf: 'f1', vm: 'm1', wv: 'mix', rnd: true, pace: 0, rate: 1, showFa: true, created: Date.now() };
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
const POS = { n: ['noun', 'اسم'], v: ['verb', 'فعل'], adj: ['adjective', 'صفت'], adv: ['adverb', 'قید'], prep: ['preposition', 'حرف اضافه'], conj: ['conjunction', 'حرف ربط'], phr: ['phrase', 'عبارت'], num: ['number', 'عدد'], idiom: ['idiom', 'اصطلاح'], det: ['determiner', 'تعیین‌کننده'], pron: ['pronoun', 'ضمیر'] };
// English on top, Farsi underneath (never side by side on one line)
const posTag = p => POS[p] ? `<div class="xs">${POS[p][0]}</div><div class="xs fa">${POS[p][1]}</div>` : '';
const lab = (en, fa, style) => `<div class="eyebrow"${style ? ` style="${style}"` : ''}>${en}</div><div class="fa eyfa">${fa}</div>`;

/* ------------------------------ speech ------------------------------ */
// Recorded American voices (Piper neural voices, made once and shipped with the app in audio/), 3 women and 3 men.
// iOS 27 Safari no longer starts web speech reliably, so the recordings are the main source and the phone
// voice is only a fallback. Each clip is fetched as its own small byte range of a CBR MP3 bundle and played
// as a blob on one <audio> element that a silent clip unlocks on the first tap (same method as the Dutch app).
// 12 voices, ordered from low to high pitch (median pitch measured on a test sentence)
const VOICE_LIST = [['f2', 'Olivia', 'f', 'lower voice'], ['f1', 'Emma', 'f', 'medium'], ['f3', 'Hannah', 'f', 'medium-high'], ['f4', 'Grace', 'f', 'higher'], ['f5', 'Lily', 'f', 'high'], ['f6', 'Sophie', 'f', 'highest'],
  ['m4', 'James', 'm', 'deepest'], ['m2', 'Joe', 'm', 'deep'], ['m5', 'Mike', 'm', 'low'], ['m6', 'David', 'm', 'medium'], ['m3', 'Henry', 'm', 'higher'], ['m1', 'Ryan', 'm', 'highest']];
const AUDIO_BASE = 'audio/';
const anorm = t => String(t).trim().replace(/\s+/g, ' ').toLowerCase();
let AKEYS = null, AKEY_STATE = '', KEYS_P = null, AUDIO_ERR = '', AUDIO_LAST = '';
const AVOICE = {};
function loadKeys() {
  if (KEYS_P) return KEYS_P;
  AKEY_STATE = 'loading';
  KEYS_P = fetch(AUDIO_BASE + 'keys.json?b=' + encodeURIComponent(BUILD)).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(j => { const m = new Map(); j.forEach((k, i) => m.set(k, i)); AKEYS = m; AKEY_STATE = 'ready'; if (TAB === 'you' && !sess) render(); })
    .catch(e => { AKEY_STATE = 'failed: ' + e.message; AUDIO_ERR = 'index: ' + e.message; logErr('audio ' + AUDIO_ERR); KEYS_P = null; throw e; });
  KEYS_P.catch(() => { });
  return KEYS_P;
}
function loadVoice(v) {
  if (AVOICE[v]) return AVOICE[v].p;
  const o = AVOICE[v] = { d: null };
  o.p = fetch(AUDIO_BASE + v + '.json?b=' + encodeURIComponent(BUILD)).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => { o.d = d; if (TAB === 'you' && !sess) render(); })
    .catch(e => { delete AVOICE[v]; AUDIO_ERR = 'voice ' + v + ': ' + e.message; logErr('audio ' + AUDIO_ERR); throw e; });
  o.p.catch(() => { });
  return o.p;
}
const isVoice = (v, g) => VOICE_LIST.some(x => x[0] === v && (!g || x[2] === g));
const womanVoice = () => ST && isVoice(ST.vf, 'f') ? ST.vf : 'f1';
const manVoice = () => ST && isVoice(ST.vm, 'm') ? ST.vm : 'm1';
// words and sentences: the default woman, the default man, or both taking turns at random
let MIXV = null;   // in 'both' mode one of the two default voices is picked per card, so prefetch and playback agree
const pickMix = () => { MIXV = Math.random() < .5 ? womanVoice() : manVoice(); };
const mainVoice = () => { const w = ST && ST.wv; return w === 'm' ? manVoice() : w === 'f' ? womanVoice() : (MIXV && isVoice(MIXV) && (MIXV === womanVoice() || MIXV === manVoice()) ? MIXV : womanVoice()); };
const randVoice = g => { const l = VOICE_LIST.filter(x => !g || x[2] === g); return l[Math.floor(Math.random() * l.length)][0]; };
const voiceName = v => (VOICE_LIST.find(x => x[0] === v) || VOICE_LIST[0])[1];
function genderVoice(male, not) {   // the learner's own voice when it has the right gender, else the first other voice of that gender
  const g = male ? 'm' : 'f', m = male ? manVoice() : womanVoice();
  const list = VOICE_LIST.filter(x => x[2] === g).map(x => x[0]);
  const order = m[0] === g ? [m, ...list.filter(x => x !== m)] : list;
  return order.find(x => x !== not) || order[0];
}
function clipOf(text, v) {   // → [file, startMs, endMs, bytesPerSecond] or null
  if (!AKEYS) return null;
  const i = AKEYS.get(anorm(text)), V = AVOICE[v] && AVOICE[v].d;
  if (i == null || !V || V.c[i * 3] < 0) return null;
  return [v + '-' + V.c[i * 3], V.c[i * 3 + 1], V.c[i * 3 + 2], V.bps];
}
function mp3FrameLen(u, i) {   // bytes in the Layer III frame whose header starts at u[i], or 0
  if (i + 4 > u.length || u[i] !== 0xFF || (u[i + 1] & 0xE0) !== 0xE0) return 0;
  const ver = (u[i + 1] >> 3) & 3, layer = (u[i + 1] >> 1) & 3, bri = (u[i + 2] >> 4) & 15, sri = (u[i + 2] >> 2) & 3, pad = (u[i + 2] >> 1) & 1;
  if (ver === 1 || layer !== 1 || bri === 0 || bri === 15 || sri === 3) return 0;
  const BR = ver === 3 ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320] : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  const SR = ver === 3 ? [44100, 48000, 32000] : ver === 2 ? [22050, 24000, 16000] : [11025, 12000, 8000];
  return Math.floor((ver === 3 ? 144 : 72) * BR[bri] * 1000 / SR[sri]) + pad;
}
function mp3Sync(u, from) {   // first frame header that is followed by another valid one
  for (let i = from || 0; i + 4 < u.length && i < (from || 0) + 4000; i++) { const n = mp3FrameLen(u, i); if (n && (i + n + 4 > u.length || mp3FrameLen(u, i + n))) return i; }
  return -1;
}
function fetchRange(url, b0, b1) {
  return fetch(url, { headers: { Range: 'bytes=' + b0 + '-' + b1 } }).then(r => {
    if (r.status === 206) return r.arrayBuffer().then(b => new Uint8Array(b));
    if (r.status === 200) return r.arrayBuffer().then(b => new Uint8Array(b).slice(b0, b1 + 1));
    throw new Error('HTTP ' + r.status + ' for ' + url.split('/').pop());
  });
}
const CLIP_PRE = 110, CLIP_POST = 90;   // ms taken before/after a clip (clips sit in 300 ms of silence)
const CLIP_MEM = new Map(), CLIP_WAIT = new Map();
function clipBytes(c) {
  const key = c[0] + ':' + c[1];
  if (CLIP_MEM.has(key)) { const v = CLIP_MEM.get(key); CLIP_MEM.delete(key); CLIP_MEM.set(key, v); return Promise.resolve(v); }
  if (CLIP_WAIT.has(key)) return CLIP_WAIT.get(key);
  const b0 = Math.max(0, Math.floor((c[1] - CLIP_PRE) / 1000 * c[3])), b1 = Math.ceil((c[2] + CLIP_POST) / 1000 * c[3]) + 8;
  const p = fetchRange(AUDIO_BASE + c[0] + '.mp3', b0, b1).then(u => {
    const s = mp3Sync(u, 0); if (s < 0) throw new Error('no MP3 frame in the range');
    const v = u.slice(s); CLIP_MEM.set(key, v); if (CLIP_MEM.size > 400) CLIP_MEM.delete(CLIP_MEM.keys().next().value);
    return v;
  }).finally(() => CLIP_WAIT.delete(key));
  CLIP_WAIT.set(key, p); p.catch(() => { }); return p;
}
function prefetch(text, v) { try { const c = clipOf(text, v || mainVoice()); if (c) clipBytes(c).catch(() => { }); } catch (e) { } }
function prefetchIn(scope) { if (!scope || !AKEYS) return; [...scope.querySelectorAll('[data-say]')].slice(0, 16).forEach(b => prefetch(b.dataset.say, b.dataset.v)); }
let AEL = null, clipSeq = 0, clipTimer = 0, clipUrl = null;
function audioEl() { if (!AEL) { AEL = new Audio(); AEL.preload = 'auto'; AEL.setAttribute('playsinline', ''); } return AEL; }
const SILENT_WAV = 'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
function unlockAudio() {   // a silent clip played inside a tap allows later programmatic play on iPhone
  audioSession();
  try { const a = audioEl(); if (a.dataset.unlocked || clipBusy) return; a.src = SILENT_WAV; a.volume = 0; const p = a.play(); if (p && p.catch) p.catch(() => { }); a.dataset.unlocked = '1'; } catch (e) { }
}
let clipBusy = false;
function stopClip() { clearTimeout(clipTimer); clipSeq++; clipBusy = false; const a = AEL; if (a) { a.onended = a.onerror = null; try { a.pause(); } catch (e) { } } }
function playClip(c, opt, text) {
  stopClip(); const a = audioEl(), seq = clipSeq; clipBusy = true;
  const rate = Math.min(1.5, Math.max(.5, (opt.rate || (ST && ST.rate) || 1)));
  const finish = () => { if (seq !== clipSeq) return; clipSeq++; clipBusy = false; clearTimeout(clipTimer); a.onended = a.onerror = null; AUDIO_LAST = 'played ' + c[0]; if (opt.end) opt.end(); };
  const fail = why => { if (seq !== clipSeq) return; clipSeq++; clipBusy = false; clearTimeout(clipTimer); a.onended = a.onerror = null; try { a.pause(); } catch (e) { } AUDIO_ERR = why; logErr('audio ' + why); phoneSay(text, opt); };
  clipBytes(c).then(u => {
    if (seq !== clipSeq) return;
    if (clipUrl) { try { URL.revokeObjectURL(clipUrl); } catch (e) { } }
    clipUrl = URL.createObjectURL(new Blob([u], { type: 'audio/mpeg' }));
    a.muted = false; a.volume = 1; a.onended = finish;
    a.onerror = () => fail('media error ' + (a.error ? a.error.code : ''));
    a.src = clipUrl;
    try { a.preservesPitch = true; a.webkitPreservesPitch = true; } catch (e) { }
    a.defaultPlaybackRate = rate; a.playbackRate = rate;
    const p = a.play(); if (p && p.catch) p.catch(err => fail('play ' + (err && err.name)));
    clipTimer = setTimeout(finish, ((c[2] - c[1] + 600) / rate) + 2500);   // safety net only
  }).catch(e => fail('fetch ' + (e && e.message ? e.message : e)));
}
let sayWait = 0;
function say(text, opt) {
  opt = opt || {}; stopSpeech();
  const v = opt.v || (opt.male != null ? genderVoice(opt.male) : mainVoice()), o = Object.assign({}, opt, { v });
  const c = clipOf(text, v);
  if (c) return playClip(c, o, text);
  if (AKEYS && AVOICE[v] && AVOICE[v].d) return phoneSay(text, o);   // not recorded
  const run = ++sayWait;   // the recordings index is still loading (first seconds after opening)
  Promise.all([loadKeys(), loadVoice(v)]).then(() => { if (run !== sayWait) return; const c2 = clipOf(text, v); if (c2) playClip(c2, o, text); else phoneSay(text, o); })
    .catch(() => { if (run === sayWait) phoneSay(text, o); });
}
function stopSpeech() { sayWait++; stopClip(); try { speechSynthesis.cancel(); } catch (e) { } }

// fallback: the phone's own voice (offline, free; unreliable on iOS 27)
let VOICES = [], SPEECH_ERR = '';
function audioSession() { try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { } }
function loadVoices() { try { VOICES = (speechSynthesis.getVoices() || []).filter(v => /^en[-_]/i.test(v.lang)); } catch (e) { VOICES = []; } }
if ('speechSynthesis' in window) { loadVoices(); try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e) { } }
function voiceScore(v, male) {
  let s = 0; const id = (v.name + ' ' + v.voiceURI).toLowerCase();
  if (v.lang.replace('_', '-').toUpperCase().endsWith('US')) s += 50;
  if (/premium|enhanced|neural|natural/.test(id)) s += 20;
  if (/novelty|whisper|bells|bad news|boing|bubbles|cellos|zarvox|trinoids|organ|albert|jester|superstar|wobble|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/.test(id)) s -= 80;
  const m = /alex|tom|aaron|fred|ryan|male|david|mark|james|evan|nathan/.test(id), f = /samantha|ava|allison|susan|zira|female|jenny|aria|nicky|zoe/.test(id);
  if (male === true && m) s += 15; if (male === false && f) s += 15; if (male === true && f) s -= 10; if (male === false && m) s -= 10;
  return s;
}
function phoneSay(text, opt) {
  opt = opt || {};
  if (!('speechSynthesis' in window)) { if (opt.end) opt.end(); return; }
  audioSession();
  try {
    if (!VOICES.length) loadVoices();
    const male = (VOICE_LIST.find(x => x[0] === opt.v) || [, , 'f'])[2] === 'm';
    const u = new SpeechSynthesisUtterance(text);
    const v = VOICES.slice().sort((a, b) => voiceScore(b, male) - voiceScore(a, male))[0];
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
    u.rate = Math.max(.5, Math.min(1.2, (opt.rate || (ST && ST.rate) || 1) * .95));
    u.onend = () => { if (opt.end) opt.end(); };
    u.onerror = e => { const c = (e && e.error) || 'error'; if (c === 'interrupted' || c === 'canceled') return; SPEECH_ERR = c; logErr('speech ' + c); if (opt.end) opt.end(); };
    speechSynthesis.speak(u);
  } catch (e) { logErr('say ' + e.message); if (opt.end) opt.end(); }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-say]');
  if (b) { e.stopPropagation(); unlockAudio(); say(b.dataset.say, { rate: b.dataset.slow ? .7 : undefined, v: b.dataset.v || undefined }); }
}, true);
['touchend', 'click'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true, capture: true }));
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
const paceFor = lv => LEVELS.indexOf(lv) <= 2 ? 30 : 20;   // recommended: A1, A2, B1: 30 a day · B2, C1, C2: 20 a day
const myPace = () => ST && ST.pace >= 10 && ST.pace <= 100 ? ST.pace : 0;   // the learner's own choice, 10–100 (0 = recommended)
function dayTarget() { const L = nextLesson(); return L ? (myPace() || paceFor(L.lv)) : 0; }
function sessionNew() { return Math.max(10, Math.min(20, Math.round(dayTarget() / 3))); }   // new words per session; the day's target is reached over a few sessions
function newToday() { const t0 = new Date(Date.now()); t0.setHours(0, 0, 0, 0); let n = 0; for (const k in ST.cards) if ((ST.cards[k].t || 0) >= +t0) n++; return n; }
function freshWords(n) { const out = []; if (n <= 0) return out; for (const L of LESSONS) for (const id of L.words) if (!ST.cards[id]) { out.push(WMAP[id]); if (out.length >= n) return out; } return out; }
function daysLeft() { let a = 0, b = 0; for (const w of WORDS) if (!ST.cards[w.id]) { if (LEVELS.indexOf(w.lv) <= 2) a++; else b++; } const p = myPace(); return p ? Math.ceil((a + b) / p) : Math.ceil(a / 30 + b / 20); }
const fmt = n => n.toLocaleString('en-US');
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
function curLevel() { for (const lv of LEVELS) { const s = levelStats(lv); if (s.pct < .9) return { lv, pct: s.pct }; } return { lv: 'C2', pct: 1 }; }
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
      body.innerHTML = `<div class="eyebrow" style="text-align:center">choose the English</div><div class="prompt"><div class="fa">${esc(w.fa)}</div><div style="margin-top:6px">${posTag(w.pos)}</div></div>`;
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
      body.innerHTML = `<div class="eyebrow" style="text-align:center">which word is a synonym?</div><div class="prompt"><div class="w" style="font-size:28px">${esc(s)}</div><div class="xs" style="margin-top:6px">synonym = a word with a similar meaning</div><div class="xs fa c">مترادف = واژه‌ای با معنای نزدیک</div></div>`;
      const ds = distractWords(w, 3, 'w').filter(x => !x.syn.includes(s)).map(x => x.w);
      mcq(body, [w.w, ...ds.slice(0, 3)], w.w, done);
    }
  };
  return { kind: 'word', key, w, render: R[kind] || R.en2fa, grade: ok => grade(w.id, ok), feedback: () => `<b>${esc(w.w)}</b><div class="fa">${esc(w.fa)}</div><div style="margin-top:6px">${esc(w.ex)}</div><div class="fa" style="margin-top:2px">${esc(w.exfa)}</div>`, remake: () => wordEx(w) };
}
function introCard(w, L, i, n) {
  return {
    kind: 'intro', key: 'i:' + w.id, noGrade: true, render(body, done) {
      body.innerHTML = `<div class="between"><span class="eyebrow">new word ${i + 1} / ${n}</span>${lvChip(w.lv)}</div>
        ${pic(w, true)}
        <div class="c" style="text-align:center;margin-top:10px"><div class="row" style="justify-content:center"><span class="w" style="font-size:34px;font-weight:850">${esc(w.w)}</span>${sayBtn(w.w)}</div>
        ${posTag(w.pos)}
        <div class="fa" style="font-size:24px;margin-top:6px;text-align:center">${esc(w.fa)}</div>
        ${w.syn.length ? `<div style="margin-top:8px"><div class="xs">synonyms</div><div class="xs fa c">مترادف‌ها</div>${w.syn.map(s => `<span class="syn">${esc(s)}</span>`).join('')}</div>` : ''}</div>
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
    <div class="tip">${lab('tip for Persian speakers', 'نکته برای فارسی‌زبان‌ها', 'color:var(--gold)')}<div class="fa" style="margin-top:4px;font-size:15px">${esc(g.tip)}</div></div>`;
}
function grammarDrill(g, k) {
  const d = g.d[k];
  return {
    kind: 'gdrill', key: 'g:' + g.id + ':' + k, render(body, done) {
      const q = esc(d[0]).replace('___', '<span class="gap">_____</span>');
      body.innerHTML = `<div class="between"><span class="eyebrow">grammar · ${esc(g.t)}</span>${lvChip(g.lv)}</div><div class="card" style="margin-top:16px;font-size:19px;font-weight:600;text-align:center">${q}</div>`;
      mcq(body, d.slice(1), d[1], (ok, cor) => { if (d[0].includes('___')) say(d[0].replace('___', cor === '—' ? '' : cor).replace(/\s+/g, ' '), { quiet: true }); else say(cor, { quiet: true }); done(ok, cor); });
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
function dlgVoices(u, fresh) {   // a man's or woman's voice per speaker; role names (Seller, Doctor…) take the opposite of the other speaker
  const sp = u.d.sp, g = sp.map(n => isMaleName(n) ? 'm' : isFemaleName(n) ? 'f' : '');
  sp.forEach((_, i) => { if (!g[i]) { const o = g.find((x, j) => j !== i && x); g[i] = o ? (o === 'm' ? 'f' : 'm') : (i % 2 ? 'm' : 'f'); } });
  if (ST && ST.rnd) { if (!fresh && DLG_VC[u.id]) return DLG_VC[u.id]; const out = []; g.forEach((x, i) => { const l = VOICE_LIST.filter(v => v[2] === x && !out.includes(v[0])); out[i] = l[Math.floor(Math.random() * l.length)][0]; }); out.forEach(v => loadVoice(v)); return (DLG_VC[u.id] = out); }
  const out = []; g.forEach((x, i) => { out[i] = genderVoice(x === 'm', out.find(v => v && v[0] === x)); }); return out;
}
const DLG_VC = {};
function dlgLines(u) { const d = u.d, vs = dlgVoices(u, true); return d.l.map((l, i) => `<div class="dl ${l[0] ? 'r' : ''}"><div class="bub" data-li="${i}" data-v="${vs[l[0]]}" data-say="${esc(l[1])}"><div class="spk">${esc(d.sp[l[0]])}</div><div>${esc(l[1])}</div><div class="fa">${esc(l[2])}</div></div></div>`).join(''); }
function isMaleName(n) { return /^(reza|sam|tom|omid|hamed|babak|kian|ali|ben|mark|jack|farhad|kaveh|mehdi|sina|paul|kamran|pouya|nima|arman|shahin|dariush|dr karimi|manager|doctor|clerk|waiter|landlord|officer|host|arash|hamid|behnam|kourosh|pedram|mike|liam|dan|saeed|navid|lucas|amir|rob|majid|dad|mehran|hassan|farid|oliver|kamyar|payam|ramin|jake|kasra|daniel|siamak|leo|yousef|saman|shahab|boy|ehsan|grandfather|behrouz|father|son|peter|husband|max|brother|fisherman|craftsman)$/i.test(n.trim()); }
function isFemaleName(n) { return /^(emma|maryam|nora|leila|mina|lily|ladan|zoe|ella|kate|grace|fariba|anna|golnar|shiva|lucy|mum|tara|nasrin|jane|elham|soraya|woman|sophie|neda|parisa|nazanin|sahar|shirin|emily|roya|yasmin|mahsa|arezoo|rose|mia|sara|ava|clara|parvaneh|shaghayegh|hannah|chloe|golnaz|hoda|lena|taraneh|samira|fatemeh|grandmother|laleh|nadia|mother|sima|wife|grandma|helen|laura|jess|bita|leyla|lisa|nina|olivia|daughter|sister|girl)$/i.test(n.trim()); }
let DLG_RUN = 0;
function playDialogue(u, scope) {
  const run = ++DLG_RUN, d = u.d, vs = dlgVoices(u); let i = 0;
  const step = () => {
    if (run !== DLG_RUN || i >= d.l.length) { scope && scope.querySelectorAll('.bub').forEach(b => b.classList.remove('now')); return; }
    const l = d.l[i], b = scope && scope.querySelector(`[data-li="${i}"]`);
    scope && scope.querySelectorAll('.bub').forEach(x => x.classList.remove('now')); if (b) { b.classList.add('now'); }
    say(l[1], { quiet: true, v: vs[l[0]], end: () => { if (run === DLG_RUN) { i++; setTimeout(step, 350); } } });
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
  pickMix();
  try { it.render(body, (ok, cor) => answered(it, ok, cor)); prefetchIn(body); }
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
  const fb = el('div', 'feedback ' + (ok ? 'ok' : 'bad'), (ok ? '<div>✓ Correct!</div><div class="fa">درست است</div>' : '<div>✗ Not quite</div><div class="fa">نادرست</div>') + (it.feedback ? `<div style="margin-top:6px">${it.feedback()}</div>` : ''));
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
  return `${due} words come back for review within 24 hours. ` + (L ? `Next lesson: ${lessonTitle(L)} (${L.lv}).` : 'You have finished the whole road to C2 — keep reviewing!');
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
  // 3. new words in road order (across lessons): intro card, then a check after every two
  const L = nextLesson(), fresh = freshWords(Math.min(sessionNew(), Math.max(0, dayTarget() - newToday())));
  fresh.forEach(w => { prefetch(w.w); prefetch(w.ex); });
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
  // 6. listening: when today's new words finish a unit, hear its dialogue and answer
  const fid = new Set(fresh.map(w => w.id));
  [...new Set(fresh.map(w => w.u))].filter(id => !ST.dlg[id] && UMAP[id].w.every((_, i) => ST.cards[id + '-' + i] || fid.has(id + '-' + i))).slice(0, 2)
    .forEach(id => { const u = UMAP[id]; items.push(dialogueCard(u, true)); u.d.q.forEach((_, k) => items.push(dlgQuestion(u, k))); });
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
      const play = () => { const run = ++DLG_RUN, pv = ST.rnd ? randVoice() : mainVoice(); loadVoice(pv); let i = 0; const nx = () => { if (run !== DLG_RUN || i >= P.s.length) return; say(P.s[i][0], { quiet: true, v: pv, end: () => { if (run === DLG_RUN) { i++; setTimeout(nx, 300); } } }); }; nx(); };
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
    kind: 'pq', key: 'p:' + P.id + ':' + k, render(body, done) { body.innerHTML = `<div class="eyebrow">${esc(P.t)}</div><div class="card" style="margin-top:16px"><div style="font-size:18px;font-weight:700">${esc(q.q)}</div><div class="fa" style="color:var(--dim);margin-top:4px">${esc(q.fa || '')}</div></div>`; mcq(body, q.o, q.o[0], done); },
    grade(ok) { const s = ST.lis[P.id] || (ST.lis[P.id] = { n: 0, ok: 0 }); s.n++; if (ok) s.ok++; if (!ok) missNote('p:' + P.id + ':' + k, false); save(); },
    feedback: () => esc(q.o[0]), remake: () => passageQ(P, k)
  };
}

/* ------------------------------ screens ------------------------------ */
let TAB = 'road', SUB = null;
const TABS = [['road', '🗺️', 'Road'], ['today', '🏠', 'Today'], ['words', '📚', 'Words'], ['grammar', '🧠', 'Grammar'], ['listen', '🎧', 'Listen'], ['you', '👤', 'You']];
function render() {
  if (!ME) return;
  const a = $('#app'); pickMix();
  let h = '';
  try { h = ({ today: vToday, words: vWords, grammar: vGrammar, listen: vListen, road: vRoad, you: vYou })[TAB](); }
  catch (e) { logErr('view ' + TAB + ' ' + e.message); h = `<div class="card">Something went wrong. ${esc(e.message)}</div>`; }
  a.innerHTML = h + `<nav id="tabs">${TABS.map(t => `<button data-tab="${t[0]}" class="${TAB === t[0] ? 'on' : ''}"><b>${t[1]}</b>${t[2]}</button>`).join('')}</nav>`;
  a.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { TAB = b.dataset.tab; SUB = null; stopSpeech(); DLG_RUN++; render(); window.scrollTo(0, 0); if (TAB === 'road') roadScroll(); });
  bind(a); prefetchIn(a);
}
function ring(p, label) {
  const r = 24, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 58 58"><circle cx="29" cy="29" r="${r}" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="6"/><circle cx="29" cy="29" r="${r}" fill="none" stroke="url(#rg)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 29 29)"/><text x="29" y="33" text-anchor="middle" font-size="13" font-weight="800" fill="#0F2A6B">${label}</text></svg>`;
}
function progressCard() {
  const ld = lessonsDone(), wl = seenWords().length, nt = newToday(), tg = dayTarget();
  return `<div class="card"><div class="row"><div class="stat"><b>${fmt(ld)}<small> / ${fmt(LESSONS.length)}</small></b><span class="xs">lessons done</span><span class="xs fa c">درس انجام‌شده</span></div>
    <div class="stat"><b>${fmt(wl)}<small> / ${fmt(WORDS.length)}</small></b><span class="xs">words learned</span><span class="xs fa c">واژهٔ یادگرفته</span></div></div>
    ${tg ? `<div class="between" style="margin-top:12px"><span class="sm">New words today</span><b>${Math.min(nt, tg)} / ${tg}</b></div><div class="fa sm">واژه‌های جدید امروز</div><div class="bar ${nt >= tg ? 'gold' : ''}" style="margin-top:6px"><i style="width:${Math.min(100, Math.round(100 * nt / tg))}%"></i></div>` : ''}</div>`;
}
function vToday() {
  const L = nextLesson(), due = dueList().length, cl = curLevel(), g = nextGrammar(), mc = missCount(), st = streakNow();
  const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const tg = dayTarget(), left = Math.max(0, tg - newToday()), n = Math.min(sessionNew(), left), FL = n ? LESSONS[LESSONS.indexOf(L)] : null;
  return `<div class="topbar"><div class="eyebrow">english · a1 → c2</div><div class="chip gold">🔥 ${st}</div></div><div class="h1">${greet}, ${esc(ME.name)}!</div>
  <button class="card tap glow" id="daily" style="margin-top:14px">
    ${lab("today's lesson", 'درس امروز')}
    <div class="between" style="margin-top:6px"><div class="grow"><div class="h2">${FL ? UMAP[FL.u].i + ' ' + esc(lessonTitle(FL)) : L ? '✓ Today\'s new words are done' : '🏁 Review & keep fluent'}</div>
    ${FL ? `<div class="fa" style="font-size:14px;color:var(--dim)">${esc(UMAP[FL.u].fa)}</div>` : L ? '<div class="fa" style="font-size:14px;color:var(--dim)">واژه‌های جدید امروز تمام شد؛ مرور کنید.</div>' : ''}<div class="sm">${n ? n + ' new words · ' : ''}${due} reviews · grammar${g ? ': ' + esc(g.t) : ' review'}</div></div><span class="say big" style="pointer-events:none">▶</span></div>
  </button>
  ${progressCard()}
  ${mc ? `<button class="card tap" id="miss"><div class="between"><div>${lab('your mistakes', 'اشتباهات شما', 'color:var(--coral)')}<div class="h3" style="margin-top:4px">${mc} question${mc > 1 ? 's' : ''} to master</div><div class="xs">They also open your next daily lessons until you get them right again.</div></div><span style="font-size:28px">🎯</span></div></button>` : ''}
  <div class="card"><div class="row">${ring(cl.pct, cl.lv)}<div class="grow"><div class="eyebrow">your level</div><div class="h3">${Math.round(cl.pct * 100)}% through ${cl.lv}</div><div class="bar" style="margin-top:8px"><i style="width:${Math.round(100 * lessonsDone() / LESSONS.length)}%"></i></div><div class="xs" style="margin-top:4px">Lesson ${Math.min(LESSONS.length, lessonsDone() + 1)} of ${LESSONS.length} on the road to C2</div></div></div></div>
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
  return `${lab('vocabulary', 'واژگان')}<div class="h1">Words</div>
  <div class="row"><div class="stat"><b>${seenWords().length}</b><span class="xs">met</span></div><div class="stat"><b>${WORDS.filter(w => known(w.id)).length}</b><span class="xs">known</span></div><div class="stat"><b>${dueList().length}</b><span class="xs">due now</span></div></div>
  <button class="btn" id="qr" style="margin-top:12px">⚡ Quick review (20)</button>
  <input class="typebox" id="wsearch" placeholder="search English or فارسی" style="margin-top:12px;text-align:left;font-size:15px">
  <div id="wres"></div>
  ${LEVELS.map(lv => `<div class="sec between"><span class="eyebrow">${lv}</span></div>` + UNITS.filter(u => u.lv === lv).map(u => { const n = u.w.filter((_, i) => ST.cards[u.id + '-' + i]).length; return `<button class="card tap" data-unit="${u.id}" style="margin:6px 0"><div class="row"><span style="font-size:28px">${u.i}</span><div class="grow"><div class="h3">${esc(u.t)}</div><div class="fa" style="font-size:13px;color:var(--dim)">${esc(u.fa)}</div></div><span class="xs">${n}/${u.w.length}</span></div><div class="bar" style="margin-top:8px;height:5px"><i style="width:${100 * n / u.w.length}%"></i></div></button>`; }).join('')).join('')}`;
}
function vGrammar() {
  if (SUB && GMAP[SUB]) {
    const g = GMAP[SUB]; const s = ST.gram[g.id];
    return `<button class="btn ghost sm inl" data-back>‹ All grammar</button><div style="margin-top:12px">${gramHTML(g, false)}</div>
    <button class="btn" data-gpr="${g.id}" style="margin-top:14px">Practise (${g.d.length} questions)</button>
    <div class="xs" style="text-align:center;margin-top:8px">${s ? `${s.ok}/${s.n} correct so far` : 'not practised yet'}</div>`;
  }
  const un = new Set(gramUnlocked().map(g => g.id));
  return `${lab('grammar', 'دستور زبان')}<div class="h1">Grammar</div><div class="sm">${GRAMMAR.length} lessons in CEFR order. A new one opens as you move along the road; you can read any lesson.</div>
  ${LEVELS.map(lv => `<div class="sec"><span class="eyebrow">${lv}</span></div><div class="card" style="padding:4px 14px">` + GRAMMAR.filter(g => g.lv === lv).map(g => `<button class="list-item" data-gram="${g.id}" style="width:100%;text-align:left"><span class="lvchip lv-${g.lv}">${GRAMMAR.indexOf(g) + 1}</span><div class="grow"><div style="font-weight:650">${esc(g.t)}</div><div class="fa" style="font-size:13px;color:var(--dim)">${esc(g.fa)}</div></div><span>${gramLearned(g.id) ? '<span class="done-mark">✓</span>' : un.has(g.id) ? '🔓' : '🔒'}</span></button>`).join('') + '</div>').join('')}`;
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
  return `${lab('listening', 'شنیداری')}<div class="h1">Listen</div>
  <button class="card tap glow" data-sub="sounds"><div class="row"><span style="font-size:30px">👄</span><div class="grow"><div class="h3">Sounds for Persian speakers</div><div class="xs">th, v/w, "eschool", ship/sheep, stress…</div></div><span>›</span></div></button>
  <div class="sec"><span class="eyebrow">stories & announcements · ${LISTEN.length}</span></div>
  ${LISTEN.map(P => `<button class="card tap" data-pass="${P.id}" style="margin:6px 0"><div class="row">${lvChip(P.lv)}<div class="grow"><div class="h3">${esc(P.t)}</div><div class="fa" style="font-size:13px;color:var(--dim)">${esc(P.fa)}</div></div><span class="xs">${ST.lis[P.id] ? '✓ ' + ST.lis[P.id].ok + '/' + ST.lis[P.id].n : '▶'}</span></div></button>`).join('')}
  <div class="sec"><span class="eyebrow">dialogues · ${UNITS.length}</span></div>
  ${UNITS.map(u => `<button class="card tap" data-dlg="${u.id}" style="margin:6px 0"><div class="row">${lvChip(u.lv)}<div class="grow"><div class="h3">${u.i} ${esc(u.d.t)}</div><div class="xs">${esc(u.t)}</div></div><span class="xs">${ST.dlg[u.id] ? '<span class="done-mark">✓</span>' : '▶'}</span></div></button>`).join('')}`;
}
function paceCard() {
  const p = myPace(), tg = dayTarget(), nt = newToday();
  return `<div class="card pace"><div class="between"><div>${lab('new words per day', 'واژهٔ جدید در روز')}</div><b class="pacev">${p || tg || 30}</b></div>
    <input type="range" id="pace" min="10" max="100" step="5" value="${p || tg || 30}" aria-label="new words per day">
    <div class="between xs"><span>10</span><span>${p ? 'your choice' : 'recommended: 30 to the end of B1, then 20'}</span><span>100</span></div>
    ${p ? `<button class="chip blue" id="pacerec" style="margin-top:8px">↺ Back to recommended (30, then 20)</button>` : ''}
    <div class="sm" style="margin-top:8px">Today: ${Math.min(nt, tg)} / ${tg} new words · sessions of up to ${sessionNew()} new words${nextLesson() ? ' · about ' + fmt(daysLeft()) + ' days to finish C2' : ''}</div>
    <div class="fa sm">امروز: ${faNum(Math.min(nt, tg))} از ${faNum(tg)} واژهٔ جدید${nextLesson() ? '؛ حدود ' + faNum(daysLeft()) + ' روز تا پایان C2' : ''}</div></div>`;
}
const LV_ICON = { A1: '🌱', A2: '🌿', B1: '🌳', B2: '⛰️', C1: '🏔️', C2: '👑' };
function roadPath(n, H) {   // a winding trail through the unit stops (x in %, y in px)
  const P = i => [50 + 27 * Math.sin(i * .9), 56 + i * 96];
  let d = '';
  for (let i = 0; i < n; i++) { const [x, y] = P(i); if (!i) { d = `M${x} ${y}`; continue; } const [px, py] = P(i - 1); d += ` C${px} ${py + 48} ${x} ${y - 48} ${x} ${y}`; }
  return { P, d };
}
function vRoad() {
  const L = nextLesson(), cur = L ? L.lv : null, ld = lessonsDone(), wl = seenWords().length, gl = GRAMMAR.filter(g => gramLearned(g.id)).length, pct = wl / WORDS.length;
  const r = 44, c = 2 * Math.PI * r;
  return `<div class="rhero">
    <div class="between"><div><div class="eyebrow" style="color:#DCE6FF">your road to C2</div><div class="fa eyfa" style="color:#C9D6FF">مسیر شما تا C2</div></div><div class="chip gold">🔥 ${streakNow()}</div></div>
    <div class="row" style="margin-top:12px;gap:16px"><svg viewBox="0 0 100 100" class="hring"><circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="9"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="url(#hg)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${Math.max(.5, c * pct)} ${c}" transform="rotate(-90 50 50)"/><defs><linearGradient id="hg"><stop offset="0" stop-color="#F6E3A6"/><stop offset="1" stop-color="#E2BE5A"/></linearGradient></defs><text x="50" y="47" text-anchor="middle" font-size="22" font-weight="900" fill="#fff">${Math.round(pct * 100)}%</text><text x="50" y="64" text-anchor="middle" font-size="10" fill="#C9D6FF">of C2</text></svg>
      <div class="grow"><div class="hbig">${L ? `Lesson ${lessonIdx(L) + 1}` : 'Road complete!'}<small> / ${LESSONS.length}</small></div><div class="hsub">${L ? `${LV_ICON[L.lv]} ${L.lv} · ${esc(UMAP[L.u].t)}` : '🏁 Keep reviewing to stay fluent'}</div></div></div>
    <div class="hstats"><div><b>${fmt(wl)}</b><span>/ ${fmt(WORDS.length)} words</span><i class="fa">واژه</i></div><div><b>${fmt(ld)}</b><span>/ ${LESSONS.length} lessons</span><i class="fa">درس</i></div><div><b>${gl}</b><span>/ ${GRAMMAR.length} grammar</span><i class="fa">دستور</i></div></div>
    ${L ? `<button class="btn gold" id="daily">▶ ${newToday() >= dayTarget() ? 'Review today' : 'Continue learning'}</button>` : ''}</div>
  ${paceCard()}
  ${ROAD.map(rd => {
    const lv = rd.lv, us = UNITS.filter(u => u.lv === lv), s = levelStats(lv), Ls = LESSONS.filter(x => x.lv === lv), ldn = Ls.filter(lessonDone).length;
    const state = ldn === Ls.length ? 'done' : lv === cur ? 'now' : LEVELS.indexOf(lv) < LEVELS.indexOf(cur || 'C2') ? 'done' : 'later';
    const H = 56 + us.length * 96, { P, d } = roadPath(us.length, H);
    const curU = L && L.lv === lv ? us.findIndex(u => u.id === L.u) : -1, doneN = state === 'done' ? us.length - 1 : Math.max(0, curU);
    const dd = roadPath(doneN + 1, H).d;
    return `<section class="lvl lv-${lv} ${state}" id="lvl-${lv}">
      <div class="lvbanner"><div class="lvbadge">${LV_ICON[lv]}<b>${lv}</b></div><div class="grow"><div class="h3" style="color:#fff">${esc(rd.t)}</div><div class="fa" style="color:rgba(255,255,255,.85);font-size:14px">${esc(rd.fa)}</div>
        <div class="bar" style="margin-top:8px;background:rgba(255,255,255,.25)"><i style="width:${Math.round(100 * ldn / Ls.length)}%;background:#fff"></i></div><div class="xs" style="color:rgba(255,255,255,.9);margin-top:4px">${ldn}/${Ls.length} lessons · ${s.sw}/${s.ws} words · ${s.kg}/${s.gs} grammar · ${rd.hours} h</div></div>${state === 'done' ? '<span class="lvdone">✓</span>' : ''}</div>
      <details class="cando"><summary>What you'll be able to do</summary><div class="fa eyfa">چه کارهایی از شما برمی‌آید</div>${rd.can.map(x => `<div class="rule"><div>✔︎ ${esc(x[0])}</div><div class="fa" style="color:var(--dim);font-size:14px">${esc(x[1])}</div></div>`).join('')}<div style="margin-top:10px">${lab('outside the app', 'بیرون از برنامه')}</div>${rd.out.map(x => `<div class="rule"><div>• ${esc(x[0])}</div><div class="fa" style="color:var(--dim);font-size:14px">${esc(x[1])}</div></div>`).join('')}</details>
      <div class="trail" style="height:${H}px"><svg viewBox="0 0 100 ${H}" preserveAspectRatio="none"><path d="${d}" class="tr"/>${state !== 'later' ? `<path d="${dd}" class="tr on"/>` : ''}</svg>
      ${us.map((u, i) => { const [x, y] = P(i), uls = Ls.filter(l => l.u === u.id), n = uls.filter(lessonDone).length, done = n === uls.length, now = L && L.u === u.id;
        return `<button class="stop ${done ? 'done' : now ? 'now' : n ? 'part' : ''}" data-stop="${u.id}" style="left:${x}%;top:${y}px">${now ? '<span class="startb ' + (x > 50 ? 'l' : 'r') + '">START</span>' : ''}<span class="ico">${u.i}</span>${done ? '<span class="tick">✓</span>' : ''}<span class="nlab">${esc(u.t.replace(/^Essential words \d+ · /, '').replace(/ · part \d+$/, ''))}</span><span class="dots">${uls.map(l => `<i class="${lessonDone(l) ? 'd' : l === L ? 'n' : ''}"></i>`).join('')}</span></button>`; }).join('')}</div>
      <div class="milestone">${state === 'done' ? '🏆' : '🏁'} ${lv} ${state === 'done' ? 'complete' : 'finish line'}</div></section>`;
  }).join('')}
  <div class="card"><div class="h3">Honest note</div><div class="fa" style="font-size:14px;color:var(--dim)">یادداشت صادقانه</div><div class="sm" style="margin-top:6px">The app covers the vocabulary, grammar, listening and pronunciation core for each level. Real C1–C2 also needs free conversation with people and corrected writing — plan those from B1 onwards.</div><div class="fa" style="margin-top:6px;font-size:14px;color:var(--dim)">این برنامه هستهٔ واژگان، دستور، شنیداری و تلفظ هر سطح را پوشش می‌دهد. برای C1 و C2 واقعی، مکالمهٔ آزاد با افراد و نوشتن با تصحیح هم لازم است؛ از سطح B1 آن‌ها را برنامه‌ریزی کنید.</div></div>`;
}
function roadScroll() { setTimeout(() => { const n = document.querySelector('.stop.now'); if (n && n.scrollIntoView) { const r = n.getBoundingClientRect(); if (r.top > innerHeight * .8 || r.top < 0) window.scrollTo({ top: window.scrollY + r.top - innerHeight * .45, behavior: 'smooth' }); } }, 400); }
function stopSheet(id) {
  const u = UMAP[id], L = nextLesson(), uls = LESSONS.filter(l => l.u === id);
  const sh = el('div', 'sheet', `<div class="sheetbox"><div class="row"><span style="font-size:44px">${u.i}</span><div class="grow"><div class="h2">${esc(u.t)}</div><div class="fa" style="color:var(--dim)">${esc(u.fa)}</div></div>${lvChip(u.lv)}</div>
    <div class="card" style="padding:6px 14px">${uls.map(l => { const d = lessonDone(l), n = l.words.filter(x => ST.cards[x]).length; return `<div class="list-item"><span class="lsnn ${d ? 'd' : l === L ? 'n' : ''}">${lessonIdx(l) + 1}</span><div class="grow"><b>Lesson ${lessonIdx(l) + 1}</b><div class="xs">${l.words.map(x => esc(WMAP[x].w)).join(', ')}</div></div><span class="xs">${d ? '<span class="done-mark">✓</span>' : n + '/' + l.words.length}</span></div>`; }).join('')}</div>
    <div class="sm">💬 Dialogue: ${esc(u.d.t)}${ST.dlg[id] ? ' ✓' : ''}</div><div class="fa sm">${esc(u.d.fa)}</div>
    ${L && L.u === id ? '<button class="btn" id="shgo" style="margin-top:14px">▶ Start this lesson</button>' : ''}
    <div class="row" style="margin-top:10px"><button class="btn ghost sm" id="shw">📚 Words</button><button class="btn ghost sm" id="shd">🎧 Dialogue</button></div>
    <button class="btn line sm" id="shx" style="margin-top:10px">Close</button></div>`);
  document.body.appendChild(sh);
  const close = () => sh.remove();
  sh.onclick = e => { if (e.target === sh) close(); };
  sh.querySelector('#shx').onclick = close;
  sh.querySelector('#shw').onclick = () => { close(); TAB = 'words'; SUB = id; render(); window.scrollTo(0, 0); };
  sh.querySelector('#shd').onclick = () => { close(); TAB = 'listen'; SUB = id; render(); window.scrollTo(0, 0); };
  const go = sh.querySelector('#shgo'); if (go) go.onclick = () => { close(); startSession(buildDaily(), 'Daily'); };
}
function vYou() {
  return `${lab('profile', 'نمایه')}<div class="row" style="margin-top:6px"><span class="av" style="width:56px;height:56px;font-size:24px">${esc(ME.name[0].toUpperCase())}</span><div class="grow"><div class="h2">${esc(ME.name)} ${ME.owner ? '<span class="chip gold">OWNER</span>' : ''}</div><div class="xs">${seenWords().length} words · ${GRAMMAR.filter(g => gramLearned(g.id)).length} grammar lessons · best streak ${ST.streak.best || 0} days</div></div></div>
  <div class="sec">${lab('daily pace', 'برنامهٔ روزانه')}</div>${paceCard()}
  <div class="sec">${lab('voices', 'صداها')}</div><div class="card">
    <div class="sm">12 recorded American voices. Choose your default woman and default man; tap a name to hear it.</div><div class="fa sm" style="margin-top:2px">۱۲ صدای آمریکایی ضبط‌شده. صدای پیش‌فرض زن و مرد را انتخاب کنید؛ با زدن هر نام صدایش را می‌شنوید.</div>
    <div class="xs" style="margin-top:12px">Default woman</div><div class="xs fa">صدای زن پیش‌فرض</div><div class="vgrid">${VOICE_LIST.filter(x => x[2] === 'f').map(x => `<button data-vf="${x[0]}" class="${womanVoice() === x[0] ? 'on' : ''}"><b>👩 ${x[1]}</b><span>${x[3]}</span></button>`).join('')}</div>
    <div class="xs" style="margin-top:12px">Default man</div><div class="xs fa">صدای مرد پیش‌فرض</div><div class="vgrid">${VOICE_LIST.filter(x => x[2] === 'm').map(x => `<button data-vm="${x[0]}" class="${manVoice() === x[0] ? 'on' : ''}"><b>👨 ${x[1]}</b><span>${x[3]}</span></button>`).join('')}</div>
    <div class="xs" style="margin-top:14px">Words and example sentences</div><div class="xs fa">واژه‌ها و جمله‌های نمونه</div><div class="seg">${[['f', '👩 Woman'], ['m', '👨 Man'], ['mix', '👩👨 Both']].map(x => `<button data-wv="${x[0]}" class="${(ST.wv || 'mix') === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div>
    <label class="tgl"><input type="checkbox" id="rnd" ${ST.rnd ? 'checked' : ''}><span><b>Different voices in conversations and listening</b><span class="xs" style="display:block">Each dialogue and story gets random voices of the right gender. Off: your two default voices.</span><span class="xs fa">هر مکالمه و داستان با صداهای تصادفی پخش می‌شود. خاموش: همان دو صدای پیش‌فرض.</span></span></label>
    <div class="sm" style="margin-top:12px">Speed</div>${speedSeg()}
    <button class="btn ghost sm" id="vtest" style="margin-top:10px">🔊 Test: "Hello, nice to meet you."</button>
    <div class="xs" style="margin-top:8px">Recordings: ${AKEYS ? fmt(AKEYS.size) + ' phrases ready' : esc(AKEY_STATE || 'not loaded')}${AUDIO_ERR ? ' · last problem: ' + esc(AUDIO_ERR) : ''}. If you hear nothing, turn off silent mode and turn the volume up.</div>
    <div class="fa" style="font-size:13px;color:var(--dim);margin-top:6px">اگر صدایی نمی‌شنوید، حالت بی‌صدا را خاموش و صدا را زیاد کنید.</div></div>
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
  const text = `Hi ${name}! 👋\nYou're invited to our English app (A1 → C2), made for Persian speakers.\nسلام ${name}! به اپلیکیشن آموزش انگلیسی ما دعوت شده‌ای.\n\n1. Open this link in Safari:\nاین لینک را در Safari باز کن:\n${link}\n\n2. Tap Share, then Add to Home Screen.\nروی Share و بعد Add to Home Screen بزن.\n\n3. Tap "I have an invitation code" and enter:\nروی «کد دعوت دارم» بزن و این‌ها را وارد کن:\nName: ${name}\nCode: ${code}\n\nGood luck!\nموفق باشی!`;
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
  const keepY = f => { const y = window.scrollY; f(); render(); window.scrollTo(0, y); };
  on('[data-vf]', b => keepY(() => { ST.vf = b.dataset.vf; save(); say('Hello, nice to meet you.', { v: ST.vf }); }));
  on('[data-vm]', b => keepY(() => { ST.vm = b.dataset.vm; save(); say('Hello, nice to meet you.', { v: ST.vm }); }));
  on('[data-wv]', b => keepY(() => { ST.wv = b.dataset.wv; save(); }));
  const rc = a.querySelector('#rnd'); if (rc) rc.onchange = () => { ST.rnd = rc.checked; save(); };
  const pr = a.querySelector('#pace'); if (pr) { pr.oninput = () => { const v = a.querySelector('.pacev'); if (v) v.textContent = pr.value; }; pr.onchange = () => keepY(() => { ST.pace = +pr.value; save(); toast(pr.value + ' new words a day'); }); }
  on('#pacerec', () => keepY(() => { ST.pace = 0; save(); toast('Recommended pace: 30, then 20'); }));
  on('[data-stop]', b => stopSheet(b.dataset.stop));
  bindSpeed(a);
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
  gate(`<div class="eyebrow">english · a1 → c2</div><div style="font-size:64px;margin:18px 0 4px">🇬🇧</div>
    <h1 class="h1" style="font-size:32px">Welcome!</h1><div class="fa" style="font-size:18px">به اپلیکیشن آموزش انگلیسی خوش آمدید</div>
    <p class="sm" style="margin:10px 0 26px">English for Persian speakers, from the very first word to C2.</p>
    <button class="btn" id="join"><div>I have an invitation code</div><div class="fa c" style="font-weight:600;font-size:14px">کد دعوت دارم</div></button>
    <button class="btn line" id="own" style="margin-top:12px"><div>I'm the owner</div><div class="fa c" style="font-weight:600;font-size:14px">مالک برنامه هستم</div></button>`);
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
    <div class="fa" style="font-size:14px;color:var(--dim);margin-bottom:16px">نام و کد را دقیقاً مثل پیام دعوت وارد کنید.</div>
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
  gate(`<div class="eyebrow">english · a1 → c2</div><div style="text-align:center;margin:24px 0 6px"><span class="av" style="width:84px;height:84px;font-size:36px;border-radius:26px">${esc(p.name[0].toUpperCase())}</span></div>
    <h1 class="h1" style="text-align:center;font-size:30px">${started ? 'Welcome back' : 'Welcome'}, ${esc(p.name)}! 👋</h1>${p.owner ? '<div style="text-align:center"><span class="chip gold">OWNER</span></div>' : ''}
    <p class="sm" style="text-align:center;margin:8px 0 26px">${started ? Object.keys(st.cards).length + ' words met so far' : 'Your road to C2 starts today<div class="fa c" style="margin-top:4px">سفر شما تا C2 از امروز شروع می‌شود</div>'}</p>
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
  $('#gate').style.display = 'none'; $('#app').style.display = 'block'; TAB = 'road'; SUB = null;
  if (!ST.vset) { if (isVoice(ST.voice, 'm')) ST.vm = ST.voice; else if (isVoice(ST.voice, 'f')) ST.vf = ST.voice; ST.vset = 1; save(); }   // b14 had one voice
  loadKeys(); loadVoice(womanVoice()); loadVoice(manVoice()); render(); roadScroll();
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
