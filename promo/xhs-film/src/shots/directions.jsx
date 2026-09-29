import React from 'react';
import {shot, onDrive} from '../engine.js';
import {LiveApp} from '../live.jsx';
import {PatternView} from '@/components/PatternView';
import {Viewer} from '@/three/Viewer';
import {CaseArt} from '@/components/Art';
import {piecesFor} from '@/data';

// Direction stills (DIRECTION.md §3). Each view is a real-component composition at video scale;
// the chosen direction becomes the production shots, the other two are discarded.
const DINO = piecesFor('dino');
const sec = id => document.querySelector(`section[data-shot="${id}"]`);
const q = (id, s) => sec(id).querySelector(s);
const show = id => tl => tl.set(sec(id), {opacity: 1}, shot(id).start);

/* ---------- A · 裁剪台 Cutting table ---------- */
export function A1() {
  return <div className="dA">
    <div className="dA-mat" />
    <div className="dA-pieces"><PatternView pieces={DINO} selected={new Set(['S1', 'B1'])} /></div>
    <svg className="dA-stitch" viewBox="0 0 1080 1920"><path d="M-20 1480 C 240 1380 380 1560 620 1460 S 980 1300 1120 1380" /></svg>
    <div className="dA-title"><span className="en">Pattern first.</span><span className="zh">好看的毛绒，<br />先得缝得出来。</span></div>
    <div className="dA-tag">纸样工作台</div>
  </div>;
}
export function A2() {
  return <div className="dA">
    <div className="dA-mat" />
    <div className="dA-phone"><LiveApp setup={a => a.go({name: 'tpl', tpl: 'dino'})} scrollTo={0} /></div>
    <div className="dA-note"><span className="en">Sew along</span><span className="zh">点一步，3D 和纸样一起<br />告诉你缝哪两片。</span></div>
    <svg className="dA-snip" viewBox="0 0 120 120"><circle cx="30" cy="92" r="16" /><circle cx="70" cy="100" r="16" /><path d="M40 80 L100 12 M60 86 L108 26" /></svg>
  </div>;
}

/* ---------- B · 3D ↔ 纸样 对照舞台 ---------- */
export function B1() {
  return <div className="dB">
    <div className="dB-top"><Viewer kind="dino" highlight={['legs']} showSeams axes={false} className="dB-viewer" /></div>
    <div className="dB-link"><i /><b>L1 腿</b><i /></div>
    <div className="dB-bottom"><PatternView pieces={DINO} selected={new Set(['L1', 'L2'])} /></div>
    <div className="dB-title"><span className="en">Turn it. Trace it.</span><span className="zh">转一转 3D 模型，<br />对应的纸样同时亮起来。</span></div>
  </div>;
}
export function B2() {
  return <div className="dB dB-dark">
    <div className="dB-glow" />
    <div className="dB-macro"><LiveApp setup={a => a.startFlow('text', {kind: 'dino', title: '坐姿恐龙', at: 'flat'})} /></div>
    <div className="dB-title low"><span className="en">Flat, in one go.</span><span className="zh">3D 形体展开成平面纸样，<br />缝份和刻口都标好了。</span></div>
  </div>;
}

/* ---------- C · 一只恐龙的旅程 ---------- */
export function C1() {
  return <div className="dC">
    <svg className="dC-path" viewBox="0 0 1080 1920"><path d="M180 0 C 180 260 900 240 900 520 S 180 820 180 1120 S 900 1420 900 1920" /></svg>
    <div className="dC-stop s1"><em>01</em>想法</div>
    <div className="dC-card"><CaseArt kind="dino" color={0x7a1f2b} /></div>
    <div className="dC-phone"><LiveApp setup={a => { a.setIdentity('fan'); a.startFlow('tpl', {kind: 'dino', title: '坐姿恐龙', at: 'proof'}); }} scrollTo={0} /></div>
    <div className="dC-stop s2"><em>02</em>自己缝出来</div>
    <div className="dC-title"><span className="en">Made it.</span><span className="zh">缝好了就登记：照片、用时、<br />踩过的坑，都能分享出去。</span></div>
  </div>;
}
export function C2() {
  return <div className="dC">
    <svg className="dC-path" viewBox="0 0 1080 1920"><path d="M900 0 C 900 300 180 300 180 640 S 900 980 900 1320 S 180 1600 180 1920" /></svg>
    <div className="dC-stop s3"><em>04</em>变成材料包</div>
    <div className="dC-phone right"><LiveApp setup={a => { a.setIdentity('creator'); a.go({name: 'kitDetail', id: 'dragon'}); }} /></div>
    <div className="dC-stamp">来自 @小满<br />的案例</div>
    <div className="dC-title bottom"><span className="en">Now it's a kit.</span><span className="zh">成为创作者后，打样通过的纸样<br />可以做成材料包给别人买。</span></div>
  </div>;
}

export const DIRECTION_VIEWS = {a1: A1, a2: A2, b1: B1, b2: B2, c1: C1, c2: C2};
export const DIRECTION_BUILDERS = Object.fromEntries(Object.keys(DIRECTION_VIEWS).map(k => [k, show(k)]));
// A2: a real click on the second sew-along step, so 3D and pattern highlight the same pieces.
DIRECTION_BUILDERS.a2 = tl => {
  show('a2')(tl);
  onDrive('a2', () => { const b = q('a2', 'ol li:nth-child(2) button'); if (b && !b.className.includes('ring-1')) b.click(); });
};
