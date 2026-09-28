// Renders the stage frame by frame and muxes the synthesized track.
// Usage (repo root served on :8765):
//   NODE_PATH=$(npm root -g) node promo/v3/render.js <a|b> [--preview t1,t2,...] [chromium-args...]
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const THEME = process.argv[2] || 'a';
const pi = process.argv.indexOf('--preview');
const PREVIEW = pi > 0 ? process.argv[pi + 1].split(',').map(Number) : null;
const EXTRA = process.argv.slice(3).filter((a, i, all) => a !== '--preview' && all[i - 1] !== '--preview');
const OUT = path.join(__dirname, 'out');
const FPS = 30;
const FF = execSync(`python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"`).toString().trim();

(async () => {
  const b = await chromium.launch({ args: EXTRA });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.error('pageerror', e.message));
  await p.goto(`http://localhost:8765/promo/v3/stage.html?theme=${THEME}`);
  await p.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 800));
  const dur = await p.evaluate(() => window.DURATION);
  if (PREVIEW) {
    for (const t of PREVIEW) { await p.evaluate(t => render(t), t); await p.screenshot({ path: path.join(OUT, `pv-${THEME}-${t}.png`) }); }
    await b.close(); return;
  }
  const n = Math.round(dur * FPS);
  const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(OUT, THEME + '.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(OUT, `pattern-studio-${THEME}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => render(t), i / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(THEME, i, '/', n, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await b.close();
  console.log('done', THEME);
})();
