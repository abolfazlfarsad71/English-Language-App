// node release.cjs "message"  → one-step release:
// 1. builds index.html, 2. replaces the copy in "../04. Current version" (old files deleted first),
// 3. commits and pushes to GitHub, so phones offer "Update" on their next open. Learner progress lives in each phone's
// localStorage under keys that never change, and new settings are added by loadState(), so nothing learned is lost.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const here = __dirname, dest = path.join(here, '..', '04. Current version');
const msg = process.argv[2] || 'update';
execFileSync('node', ['build.mjs'], { cwd: here, stdio: 'inherit' });
const build = /const BUILD = '([^']+)'/.exec(fs.readFileSync(path.join(here, 'src/app.js'), 'utf8'))[1];
fs.rmSync(dest, { recursive: true, force: true }); fs.mkdirSync(dest, { recursive: true });
for (const f of ['index.html', 'sw.js', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-512.png', 'README.md']) fs.copyFileSync(path.join(here, f), path.join(dest, f));
fs.writeFileSync(path.join(dest, 'VERSION.txt'), `English app ${build}\nCopied ${new Date().toISOString()}\nLive: https://abolfazlfarsad71.github.io/English-Language-App/\nRecordings (audio/) stay in "01. App/audio" and on GitHub; they are not copied here.\n`);
console.log('copied to', dest);
const git = (...a) => execFileSync('git', a, { cwd: here, stdio: 'inherit' });
git('add', '-A'); git('commit', '-q', '-m', build.split('· ')[1] + ': ' + msg + '\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'); git('push', '-u', 'origin', 'main');
console.log('pushed', build);
