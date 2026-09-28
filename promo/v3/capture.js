// Captures themed screens of the v3 prototype for the promo stage.
// Usage (repo root served on :8765): NODE_PATH=$(npm root -g) node promo/v3/capture.js <a|b> [chromium-args...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const THEME = process.argv[2] || 'a';
const OUT = path.join(__dirname, 'shots', THEME);
const EXTRA = process.argv.slice(3);
fs.mkdirSync(OUT, { recursive: true });

// Light re-skin per video: brand color swap plus chunky buttons (a) or ink outlines (b).
const CSS = {
  a: `:root{--primary:24 100% 50%;--ring:24 100% 50%;--primary-foreground:0 0% 100%}
      button.bg-primary,[class*="bg-primary"].h-12{box-shadow:0 4px 0 hsl(20 100% 36%)!important}
      .rounded-\\[20px\\].border,.rounded-\\[18px\\].border{border-width:2px}`,
  b: `:root{--primary:266 78% 58%;--ring:266 78% 58%;--primary-foreground:0 0% 100%;--background:270 30% 97%;--muted:268 30% 93%;--border:266 20% 82%}
      button.bg-primary{box-shadow:3px 3px 0 #1a1024!important;border:1.5px solid #1a1024}
      .rounded-\\[20px\\].border,.rounded-\\[18px\\].border{border:1.5px solid #1a1024}`
}[THEME] + '[data-sonner-toaster]{display:none!important}';

const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', ...EXTRA] });
  const p = await b.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2.5 });
  p.setDefaultTimeout(6000);
  p.on('pageerror', e => console.error('pageerror', e.message));
  const rects = {};
  const run = async (js) => { await p.evaluate(js); await wait(350); };
  const click = async (name, opts = {}) => { try { await p.getByRole('button', { name, exact: opts.exact }).first().click(); await wait(opts.after ?? 600); } catch (e) { console.error('click', name, e.message.split('\n')[0]); } };
  async function shot(n, extra = 0) {
    await wait(700 + extra);
    await p.screenshot({ path: path.join(OUT, n + '.png') });
    rects[n] = await p.evaluate(() => {
      const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.height ? [b.x, b.y, b.width, b.height].map(Math.round) : null };
      return { ws: r('section[aria-label="工作区"]'), bar: r('.absolute.inset-x-0.bottom-0, .phone-bottom'), dialog: r('[role="dialog"]') };
    });
    console.log('shot', n);
  }
  async function fresh() {
    await p.goto('http://localhost:8765/prototype-v3/dist/index.html');
    await p.addStyleTag({ content: CSS });
    await p.evaluate(() => document.fonts.ready); await wait(900);
  }

  // --- browse, template, gate ---
  await fresh();
  await shot('home');
  await click('模板库'); await shot('library');
  await p.locator('main button', { hasText: '坐姿恐龙' }).first().click(); await wait(1500);
  await p.locator('ol li button').nth(1).click(); await shot('tpl', 500);
  await p.locator('main').evaluate(m => m.scrollTo(0, 0)); await shot('tpl-ws', 300);
  await click('用这个模板开版'); await shot('auth');
  await click('手机号登录 / 注册', { after: 1500 }); await shot('shape');

  // --- AI from one sentence ---
  await fresh();
  await click('生成纸样'); await click('通过 Google 继续', { after: 1800 }); await shot('gen-run', -400);
  await p.waitForSelector('[role="dialog"]', { timeout: 20000 }).catch(() => {}); await shot('share', 600);
  await click('继续'); await shot('gen-done');
  await p.locator('.absolute.inset-x-0.bottom-0 button').last().click(); await shot('decide', 400);

  // --- OBJ upload path ---
  await run(() => { const a = window.__app(); a.setIdentity('fan') });
  await run(() => window.__app().startFlow('obj', { kind: 'dino', title: '我的 3D 恐龙' }));
  await shot('source');
  await p.locator('.absolute.inset-x-0.bottom-0 button').last().click(); await shot('diagnose', 4200);

  // --- shared tail: flat → qa → deliver → sewing log ---
  await run(() => window.__app().startFlow('text', { kind: 'dino', title: '坐姿恐龙', at: 'flat' }));
  await shot('flat', 600);
  await p.locator('.absolute.inset-x-0.bottom-0 button').last().click(); await shot('qa', 500);
  await p.locator('.absolute.inset-x-0.bottom-0 button').last().click(); await shot('deliver');
  await p.locator('.absolute.inset-x-0.bottom-0 button').last().click(); await wait(400);
  await p.getByText('先用 3D 截图占位').click().catch(() => {}); await shot('proof');
  await p.locator('main div.overflow-y-auto').first().evaluate(e => e.scrollTo(0, 99999)); await shot('proof-share');
  await p.locator('.absolute.inset-x-0.bottom-0 button').last().click(); await shot('done-fan');

  // --- creator journey ---
  await run(() => window.__app().go({ name: 'me' })); await shot('me-fan');
  await click('申请成为创作者'); await shot('apply');
  await run(() => window.__app().setIdentity('pending')); await run(() => window.__app().go({ name: 'me' })); await shot('me-pending');
  await run(() => window.__app().setIdentity('creator')); await run(() => window.__app().go({ name: 'creator' })); await p.locator('main').evaluate(m => m.scrollTo(0, 0)); await shot('creator', 400);
  await click('选一套纸样去打样', { after: 1200 }); await shot('plat');
  await click('提交平台打样 · ¥88'); await click('演示：模拟样品回传'); await shot('plat-done', 1500);
  await click('下一步 · 发起材料包'); await shot('launch', 800);
  await click('提交材料包审核'); await shot('done-launch', 1500);

  // --- buyer ---
  await run(() => window.__app().go({ name: 'kit' })); await shot('kit-list');
  await run(() => window.__app().go({ name: 'kitDetail', id: 'dragon' })); await shot('kit', 1200);
  await p.locator('main').evaluate(m => m.scrollTo(0, 1300)); await shot('kit-recs');
  await click('预订材料包 · ¥168'); await shot('reserve', 400);
  await click('确认预订'); await shot('reserved', 2200);

  fs.writeFileSync(path.join(OUT, 'rects.json'), JSON.stringify(rects, null, 1));
  await b.close();
})();
