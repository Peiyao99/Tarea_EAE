// Records the promo walkthrough of the prototype as a 1080×1440 (3:4) MP4 for 小红书.
// Usage: serve the repo root on :8123 (python3 -m http.server 8123), then
//   NODE_PATH=$(npm root -g) node promo/record.js <outDir> [chromium-args...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(process.argv[2] || 'promo/out');
const EXTRA_ARGS = process.argv.slice(3);
const SCALE = 0.905; // must match .phone transform in stage.html
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
  for (const f of fs.readdirSync(path.join(OUT, 'frames'))) fs.unlinkSync(path.join(OUT, 'frames', f));

  const browser = await chromium.launch({ args: EXTRA_ARGS });
  const page = await browser.newPage({ viewport: { width: 720, height: 960 }, deviceScaleFactor: 1.5 });
  page.on('pageerror', e => console.error('pageerror', e.message));
  await page.goto('http://localhost:8123/promo/stage.html');
  const fr = () => page.frames().find(f => f.url().includes('/prototype/'));
  await page.waitForFunction(() => document.getElementById('app').contentWindow.PP);
  await page.evaluate(() => document.fonts.ready);
  await fr().evaluate(() => document.fonts.ready);
  await wait(800);

  // ---- capture: CDP screencast, frames timestamped ----
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  let idx = 0;
  cdp.on('Page.screencastFrame', async f => {
    const name = String(idx++).padStart(6, '0') + '.jpg';
    fs.writeFileSync(path.join(OUT, 'frames', name), Buffer.from(f.data, 'base64'));
    frames.push({ name, t: f.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: 1080, maxHeight: 1440, everyNthFrame: 1 });
  // keep the compositor producing frames even on still scenes
  await page.evaluate(() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:.01;animation:tick 1s linear infinite'; const s = document.createElement('style'); s.textContent = '@keyframes tick{50%{transform:translateX(-1px)}}'; document.head.appendChild(s); document.body.appendChild(d); });

  // ---- helpers ----
  const ifr = async () => page.$eval('#app', e => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y }; });
  const toStage = async (x, y) => { const o = await ifr(); return { x: o.x + x * SCALE, y: o.y + y * SCALE }; };
  async function rectOf(sel){ return fr().$eval(sel, e => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }); }
  async function ensureVisible(sel, top = 190, bottom = 640){
    const r = await rectOf(sel);
    const cy = r.y + r.h / 2;
    if (cy < top || cy > bottom) {
      const dy = cy - (top + bottom) / 2;
      await swipe(dy);
    }
  }
  async function finger(x, y, ms = 420){ await page.evaluate(([x, y, ms]) => stage.finger(x, y, true, ms), [x, y, ms]); }
  async function tap(sel, after = 750, opts = {}){
    if (opts.band) opts = { ...opts, ...opts.band };
    if (!opts.noScroll) await ensureVisible(sel, opts.top, opts.bottom);
    const r = await rectOf(sel);
    const p = await toStage(r.x + r.w * (opts.fx ?? .5), r.y + r.h * (opts.fy ?? .5));
    await finger(p.x, p.y); await wait(470);
    await page.mouse.move(p.x, p.y);
    await page.evaluate(() => stage.press(true)); await page.mouse.down(); await wait(110);
    await page.mouse.up(); await page.evaluate(([x, y]) => { stage.press(false); stage.ripple(x, y); }, [p.x, p.y]);
    await wait(after);
  }
  async function swipe(dy, ms = 700){
    const o = await ifr();
    const x = o.x + 300 * SCALE, y0 = o.y + (dy > 0 ? 620 : 300) * SCALE;
    await finger(x, y0, 250); await wait(260);
    await page.evaluate(() => stage.press(true));
    await page.evaluate(([x, y, ms]) => stage.finger(x, y, true, ms), [x, y0 - Math.sign(dy) * Math.min(Math.abs(dy), 320) * SCALE, ms]);
    await fr().evaluate(dy => document.querySelector('.screen.on').scrollBy({ top: dy, behavior: 'smooth' }), dy);
    await wait(ms);
    await page.evaluate(() => stage.press(false));
    await wait(250);
  }
  async function drag(sel, to, band = {}){
    await ensureVisible(sel, band.top, band.bottom);
    const info = await fr().$eval(sel, e => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, min: +e.min, max: +e.max, v: +e.value }; });
    const px = v => info.x + 11 + (v - info.min) / (info.max - info.min) * (info.w - 22);
    const a = await toStage(px(info.v), info.y + info.h / 2);
    const b = await toStage(px(to), info.y + info.h / 2);
    await finger(a.x, a.y); await wait(470);
    await page.mouse.move(a.x, a.y);
    await page.evaluate(() => stage.press(true)); await page.mouse.down(); await wait(120);
    const steps = 34;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = a.x + (b.x - a.x) * e;
      await page.mouse.move(x, a.y);
      await page.evaluate(([x, y]) => stage.finger(x, y, true, 0), [x, a.y]);
      await wait(28);
    }
    await wait(120); await page.mouse.up(); await page.evaluate(() => stage.press(false));
    await wait(450);
  }
  const caption = (eb, t) => page.evaluate(([eb, t]) => stage.caption(eb, t), [eb, t]);
  const hideFinger = () => page.evaluate(() => document.getElementById('finger').classList.remove('on'));

  // ================= SCRIPT =================
  await wait(3400);
  await page.evaluate(() => stage.hideIntro());
  await caption('01 · 一句话开版', '描述角色，直接生成纸样');
  await wait(1300);

  // Home: type a prompt, generate
  await tap('#prompt', 300);
  await fr().evaluate(() => { const t = document.getElementById('prompt'); t.value = ''; });
  await page.keyboard.type('坐姿小恐龙，背部一排软刺，成品 25cm，短毛绒', { delay: 75 });
  await wait(500);
  await tap('#inputModes .chip:nth-child(3)', 500);
  await tap('#genBtn', 200);
  await caption('02 · AI 全流程', '3D 形体与自动拆件，一步到位');
  await hideFinger();
  await wait(4200);

  await caption('03 · 决策路由', '27 项决策，只把拿不准的 8 项交给你');
  await wait(1600);
  await swipe(420);
  await tap('[data-d="leg"][data-i="0"]', 600);
  await tap('[data-d="joint"][data-i="0"]', 600);
  await tap('[data-d="head"][data-i="1"]', 700);
  await tap('[data-d="ease"][data-i="0"]', 600);
  await tap('[data-open="arm"]', 700);
  await tap('[data-d="arm"][data-i="0"]', 700);
  await tap('#aiConfirm', 1700, { noScroll: true });

  await caption('04 · 三视图 QA', '正、侧、背三视图对照标缝线');
  await hideFinger();
  await wait(900);
  await tap('#triSeg [data-tri="front"]', 900);
  await tap('#triSeg [data-tri="back"]', 900);
  await tap('#triSeg [data-tri="side"]', 900);
  await swipe(330);
  await caption('04 · 对缝 QA', '腿开口长度差 3.7 mm，一键收小');
  await wait(1200);
  await tap('#fixShrink', 1900);
  await swipe(300);
  await wait(900);
  await swipe(260);
  await fr().evaluate(() => document.querySelector('.strain .scroller').scrollTo({ left: 320, behavior: 'smooth' }));
  await wait(1300);

  await caption('05 · 入门模板', '拖动参数，纸样与成品同步变化');
  await tap('#levelSeg [data-level="l1"]', 900, { noScroll: true });
  const band = { top: 520, bottom: 690 };
  await drag('#p-h', 32, band);
  await drag('#p-r', 80, band);
  await drag('#p-e', 72, band);
  await drag('#p-s', 30, band);
  await drag('#p-l', 52, band);
  await tap('#viewSeg [data-view="3d"]', 1300, { noScroll: true });
  await tap('#viewSeg [data-view="split"]', 700, { noScroll: true });
  await caption('05 · 入门模板', '裁片宽度、吃势、耳朵支撑自动检查');
  await swipe(300);
  await wait(1400);
  await tap('#nextStep', 900, { noScroll: true });
  await swipe(-600);
  await tap('#stepBody [data-fab="long"]', 1300, { band });

  await caption('06 · 开版直通材料包', '纸样验证后发起，达标统一开裁');
  await tap('#tabbar [data-tab="kit"]', 1000, { noScroll: true });
  await tap('#swatches [data-color="moss"]', 900);
  await tap('#swatches [data-color="oat"]', 900);
  await tap('#galThumbs [data-g="pieces"]', 900);
  await tap('#swatches [data-color="wine"]', 700);
  await tap('#galThumbs [data-g="main"]', 600);
  await swipe(420);
  await wait(500);
  await tap('#reserveBtn', 900, { noScroll: true });
  await tap('#qPlus', 700, { noScroll: true });
  await tap('#confirmReserve', 1300, { noScroll: true });
  await tap('#doneReserve', 1400, { noScroll: true });

  await caption('07 · 创作者主页', '纸样、娃衣、配件、材料包分栏售卖');
  await tap('#tabbar [data-tab="creator"]', 900, { noScroll: true });
  await tap('#followBtn', 1000);
  await swipe(300);
  await tap('#cTabs [data-ct="pattern"]', 900);
  await tap('#cTabs [data-ct="cloth"]', 900);
  await tap('#cTabs [data-ct="all"]', 900);
  await swipe(360);
  await hideFinger();
  await wait(900);

  await page.evaluate(() => stage.showOutro());
  await wait(4200);

  await cdp.send('Page.stopScreencast');
  await wait(300);
  await browser.close();

  // ---- assemble: concat list with real frame durations, then CFR 30fps H.264 ----
  let list = '';
  for (let i = 0; i < frames.length; i++) {
    const d = i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - frames[i].t) : 0.5;
    list += `file 'frames/${frames[i].name}'\nduration ${d.toFixed(4)}\n`;
  }
  list += `file 'frames/${frames[frames.length - 1].name}'\n`;
  fs.writeFileSync(path.join(OUT, 'frames.txt'), list);
  console.log('frames', frames.length, 'seconds', (frames[frames.length - 1].t - frames[0].t).toFixed(1));
})();
