// Builds index.html from src/: inlines the CSS, the JSON data and the JS into one file (works offline, no requests).
// Usage: node build.mjs   — then commit index.html. Bump BUILD in src/app.js for every release (higher bNN).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const rd = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const J = p => JSON.parse(rd(p));
const units = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].flatMap(l => J(`src/data/units-${l}.json`));
const grammar = ['a', 'b', 'c'].flatMap(l => J(`src/data/grammar-${l}.json`));
const extra = J('src/data/extra.json');
const talks = J('src/data/talks.json');
for (const [id, t] of Object.entries(talks)) { if (!units.some(u => u.id === id.split('.')[0])) throw new Error('talk ' + id); t.q.forEach(q => { if (q.o.length !== 3) throw new Error(id + ' question'); }); }
// sanity checks: stable ids, every drill has 3 options, every dialogue question 3 options
const ids = new Set();
for (const u of units) { if (ids.has(u.id)) throw new Error('dup unit ' + u.id); ids.add(u.id); u.w.forEach((w, i) => { if (w.length !== 7) throw new Error(`${u.id}-${i} has ${w.length} fields`); }); u.d.q.forEach(q => { if (q.o.length !== 3) throw new Error(u.id + ' question'); }); }
for (const g of grammar) g.d.forEach((d, i) => { if (d.length !== 4 || new Set(d.slice(1)).size !== 3) throw new Error(`${g.id} drill ${i}`); });
const data = JSON.stringify({ units, grammar, extra, talks });
const js = rd('src/app.js'), css = rd('src/style.css');
const html = rd('src/index.template.html').replace('/*CSS*/', () => css).replace('/*DATA*/', () => data).replace('/*JS*/', () => js);
writeFileSync(new URL('index.html', import.meta.url), html);
console.log('index.html', (html.length / 1024).toFixed(0) + ' KB ·', units.length, 'units ·', units.reduce((a, u) => a + u.w.length, 0), 'words ·', grammar.length, 'grammar ·', extra.listen.length, 'passages ·', Object.keys(talks).length, 'lesson talks ·', /const BUILD = '([^']+)'/.exec(js)[1]);
