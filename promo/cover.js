// Renders the 1080×1440 小红书 cover from the stage. Usage: node promo/cover.js <out.png> [chromium-args...]
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: process.argv.slice(3) });
  const p = await b.newPage({ viewport: { width: 720, height: 960 }, deviceScaleFactor: 1.5 });
  await p.goto('http://localhost:8123/promo/stage.html');
  await p.waitForFunction(() => document.getElementById('app').contentWindow.PP);
  await p.evaluate(() => document.fonts.ready);
  const f = p.frames().find(x => x.url().includes('/prototype/'));
  await f.evaluate(() => document.fonts.ready);
  await f.evaluate(() => { PP.go('template'); PP.state.p.e = 60; });
  await f.evaluate(() => { const set = (id, v) => { const i = document.getElementById(id); i.value = v; i.dispatchEvent(new Event('input')); }; set('p-h', 28); set('p-e', 62); set('p-s', 22); });
  await p.evaluate(() => { stage.hideIntro(); document.getElementById('intro').style.transition = 'none';
    const c = document.getElementById('cap'); c.style.top = '26px';
    document.getElementById('capEb').textContent = 'PLUSH PATTERN STUDIO';
    const t = document.getElementById('capT'); t.textContent = '毛绒开版，先缝得出来再卖'; t.style.fontSize = '44px'; });
  await p.waitForTimeout(900);
  await p.screenshot({ path: process.argv[2] });
  await b.close();
})();
