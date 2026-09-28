// Synthesizes the two original backing tracks (no samples, no licensed audio).
// a: bouncy marimba pop, 124 BPM, C major, C–G–Am–F
// b: J-pop light-band rock, 140 BPM, D major, royal road IV–V–iii–vi
// Usage: node promo/v3/music.js  →  promo/v3/out/a.wav, b.wav
const fs = require('fs');
const path = require('path');
const T = require('./timing.json');
const SR = 44100;
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;

function track(bpm, bars) {
  const beat = 60 / bpm, len = Math.ceil((bars * 4 * beat + 2.5) * SR);
  const L = new Float32Array(len), R = new Float32Array(len);
  const add = (t0, buf, gain = 1, pan = 0) => {
    const i0 = Math.round(t0 * SR), gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan);
    for (let i = 0; i < buf.length && i0 + i < len; i++) { if (i0 + i < 0) continue; L[i0 + i] += buf[i] * gl; R[i0 + i] += buf[i] * gr }
  }
  return { beat, len, L, R, add, bt: (bar, b = 0) => (bar * 4 + b) * beat }
}
const lp = (buf, fc) => { const a = 1 - Math.exp(-2 * Math.PI * fc / SR); let y = 0; for (let i = 0; i < buf.length; i++) { y += a * (buf[i] - y); buf[i] = y } return buf }
const hp = (buf, fc) => { const a = 1 - Math.exp(-2 * Math.PI * fc / SR); let y = 0; for (let i = 0; i < buf.length; i++) { y += a * (buf[i] - y); buf[i] -= y } return buf }
const gen = (sec, f) => { const n = Math.round(sec * SR), b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = f(i / SR, i); return b }

// ---------- instruments ----------
const kick = (g = 1) => gen(0.38, t => { const f = 45 + 110 * Math.exp(-t * 28); return Math.sin(2 * Math.PI * (45 * t + 110 * (1 - Math.exp(-t * 28)) / 28)) * Math.exp(-t * 9) * g + (t < 0.004 ? rnd() * 0.3 : 0) })
const hat = (d = 0.045) => hp(gen(d * 3, t => rnd() * Math.exp(-t / d)), 7000)
const clap = () => hp(gen(0.25, t => rnd() * (Math.exp(-((t % 0.012) / 0.003)) * (t < 0.036 ? 1 : 0) + Math.exp(-(t - 0.036) / 0.07) * (t >= 0.036 ? 0.8 : 0))), 900)
const snare = () => { const n = hp(gen(0.22, t => rnd() * Math.exp(-t / 0.06)), 1500); const b = gen(0.22, t => Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t / 0.05) * 0.6); return n.map((v, i) => v + b[i]) }
const crash = () => hp(gen(2.2, t => rnd() * Math.exp(-t / 0.55) * 0.5), 5000)
const riser = (sec) => { const b = gen(sec, t => rnd() * Math.pow(t / sec, 2)); let y = 0; for (let i = 0; i < b.length; i++) { const fc = 300 + 7000 * Math.pow(i / b.length, 2); const a = 1 - Math.exp(-2 * Math.PI * fc / SR); y += a * (b[i] - y); b[i] = y } return b }
const marimba = (m, sec = 0.5) => { const f = mtof(m); return gen(sec, t => (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 4.01 * t) * Math.exp(-t * 30) + 0.15 * Math.sin(2 * Math.PI * f * 10 * t) * Math.exp(-t * 80)) * Math.exp(-t * 7) * Math.min(1, t * 900)) }
const bell = (m, sec = 1.2) => { const f = mtof(m); return gen(sec, t => (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 6) + 0.2 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t * 12)) * Math.exp(-t * 3) * Math.min(1, t * 600)) }
const saw = (f, t) => 2 * ((f * t) % 1) - 1
const sq = (f, t, w = 0.5) => ((f * t) % 1) < w ? 1 : -1
const bassA = (m, sec) => lp(gen(sec, t => (sq(mtof(m), t) * 0.6 + Math.sin(2 * Math.PI * mtof(m) * t)) * Math.min(1, t * 400) * Math.exp(-t * 3) * (t < sec - 0.02 ? 1 : 0)), 600)
const stab = (ms, sec = 0.18) => lp(gen(sec, t => ms.reduce((s, m) => s + saw(mtof(m) * 1.003, t) + saw(mtof(m) * 0.997, t), 0) / ms.length * Math.exp(-t * 16) * Math.min(1, t * 800)), 2600)
const pad = (ms, sec) => lp(gen(sec, t => ms.reduce((s, m) => s + saw(mtof(m) * 1.004, t) + saw(mtof(m) * 0.996, t), 0) / ms.length * Math.min(1, t * 3) * Math.min(1, (sec - t) * 3)), 1400)
const guitar = (ms, sec, mute) => { const b = gen(sec, t => Math.tanh(ms.reduce((s, m) => s + saw(mtof(m) * 1.002, t) + saw(mtof(m) * 0.998, t), 0) * 1.6) * Math.exp(-t * (mute ? 14 : 2.2)) * Math.min(1, t * 700)); return lp(lp(b, mute ? 1800 : 3200), 4200) }
const bassB = (m, sec) => lp(gen(sec, t => Math.tanh((saw(mtof(m), t) + Math.sin(2 * Math.PI * mtof(m) * t)) * 1.3) * Math.min(1, t * 500) * Math.exp(-t * 4) * (t < sec - 0.015 ? 1 : 0)), 900)
const lead = (m, sec) => lp(gen(sec, t => sq(mtof(m) * (1 + 0.006 * Math.sin(2 * Math.PI * 5.5 * t) * Math.min(1, t * 3)), t, 0.25) * Math.min(1, t * 300) * Math.min(1, (sec - t) * 40) * (0.75 + 0.25 * Math.exp(-t * 4))), 3800)

function master(tr, name) {
  const { L, R, len } = tr
  let peak = 0; for (let i = 0; i < len; i++) { L[i] = Math.tanh(L[i] * 0.9); R[i] = Math.tanh(R[i] * 0.9); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])) }
  const g = 0.89 / peak, fade = SR * 1.2
  const buf = Buffer.alloc(44 + len * 4)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + len * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22)
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(len * 4, 40)
  for (let i = 0; i < len; i++) { const f = Math.min(1, (len - i) / fade); buf.writeInt16LE(Math.round(L[i] * g * f * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * f * 32767), 46 + i * 4) }
  fs.writeFileSync(path.join(OUT, name + '.wav'), buf); console.log(name, (len / SR).toFixed(1) + 's')
}

// Section starts (bars) shared with the stage: see timing.json.
const S = T.sections.map(s => s.bar), BARS = T.bars, END = S[S.length - 1]

// ---------- A: marimba pop ----------
{
  const tr = track(T.a.bpm, BARS), { add, bt, beat } = tr
  const CH = [[48, [60, 64, 67]], [43, [59, 62, 67]], [45, [60, 64, 69]], [41, [60, 65, 69]]]
  const MEL = [[[0, 72], [0.5, 76], [1, 79], [1.5, 76], [2.5, 84], [3, 79]], [[0, 74], [0.5, 79], [1, 83], [1.5, 79], [2.5, 86], [3, 83]], [[0, 76], [0.5, 72], [1, 76], [1.5, 81], [2.5, 79], [3, 76]], [[0, 77], [0.5, 81], [1, 84], [1.5, 81], [2.5, 79], [3, 77], [3.5, 74]]]
  for (let bar = 0; bar < END; bar++) {
    const [root, tri] = CH[bar % 4], intro = bar < S[1], calm = bar >= S[3] && bar < S[3] + 1
    MEL[bar % 4].forEach(([b, m]) => add(bt(bar, b), marimba(m + (bar >= S[5] ? 12 : 0) * 0), 0.34, (m % 2 ? 0.25 : -0.25)))
    if (bar >= S[5]) MEL[bar % 4].forEach(([b, m]) => add(bt(bar, b), bell(m + 12, 0.5), 0.09, 0.3))
    if (!intro) for (let b = 0; b < 4; b++) {
      if (!calm || b >= 2) add(bt(bar, b), kick(), 0.9)
      add(bt(bar, b + 0.5), stab(tri), 0.16, b % 2 ? 0.35 : -0.35)
      add(bt(bar, b + 0.5), hat(), 0.18, 0.2); add(bt(bar, b), hat(0.02), 0.08, -0.2)
      add(bt(bar, b), bassA(root + (b % 2 ? 12 : 0), beat * 0.9), 0.36)
    }
    for (const b of [1, 3]) if (!intro || bar === S[1] - 1) add(bt(bar, b), clap(), 0.4)
    if (S.includes(bar + 1) && bar + 1 < END) add(bt(bar, 2), riser(beat * 2), 0.22)
    if (S.includes(bar) && bar > 0) add(bt(bar), crash(), 0.3)
  }
  // outro: big hit then ring
  add(bt(END), kick(), 1); add(bt(END), crash(), 0.4); add(bt(END), pad([48, 60, 64, 67, 72], beat * 7), 0.35)
  ;[72, 76, 79, 84, 88].forEach((m, i) => add(bt(END, i * 0.25), bell(m, 2), 0.2, i % 2 ? 0.3 : -0.3))
  master(tr, 'a')
}

// ---------- B: light-band J-pop ----------
{
  const tr = track(T.b.bpm, BARS), { add, bt, beat } = tr
  const CH = [[43, [55, 62, 67]], [45, [57, 64, 69]], [42, [54, 61, 66]], [47, [59, 66, 71]]]
  const MEL = [[[0, 79], [0.5, 78], [1, 76], [1.5, 74], [2, 76], [2.5, 79], [3, 81]], [[0, 81], [0.5, 83], [1, 81], [1.5, 79], [2, 76], [3, 78]], [[0, 78], [0.5, 76], [1, 73], [1.5, 76], [2, 81], [3, 78]], [[0, 74], [0.5, 76], [1, 78], [1.5, 81], [2, 83], [3, 86]]]
  for (let bar = 0; bar < END; bar++) {
    const [root, pc] = CH[bar % 4], intro = bar < S[1], fill = S.includes(bar + 1)
    const g = [pc[0] - 12, pc[0] - 5, pc[0]]
    for (let e = 0; e < 8; e++) add(bt(bar, e / 2), guitar(g, beat * 0.5, e % 4 !== 0), intro ? 0.12 : 0.2, e % 2 ? 0.45 : -0.45)
    if (intro) { [0, 0.75, 1.5, 2, 2.75, 3.5].forEach((b, i) => add(bt(bar, b), bell(pc[i % 3] + 24, 0.8), 0.14, 0.2)); if (bar === S[1] - 1) for (let i = 0; i < 8; i++) add(bt(bar, 2 + i * 0.25), snare(), 0.18 + i * 0.03); continue }
    if (!(bar >= S[3] && bar < S[3] + 1)) MEL[bar % 4].forEach(([b, m], i, a) => add(bt(bar, b), lead(m, ((a[i + 1]?.[0] ?? 4) - b) * beat * 0.92), 0.17, 0.1))
    for (let e = 0; e < 8; e++) { add(bt(bar, e / 2), bassB(root + (e === 7 ? 7 : 0), beat * 0.48), 0.3); add(bt(bar, e / 2), hat(0.03), 0.1, 0.3) }
    ;[0, 1.5, 2.5].forEach(b => add(bt(bar, b), kick(), 0.85))
    if (fill && bar + 1 < END) { add(bt(bar, 1), snare(), 0.45); for (let i = 0; i < 8; i++) add(bt(bar, 2 + i * 0.25), snare(), 0.25 + i * 0.03) }
    else [1, 3].forEach(b => add(bt(bar, b), snare(), 0.5))
    if (S.includes(bar)) add(bt(bar), crash(), 0.32, -0.2)
  }
  add(bt(END), kick(), 1); add(bt(END), crash(), 0.45, 0.2); add(bt(END), guitar([50, 57, 62], beat * 6, false), 0.28)
  add(bt(END), pad([50, 62, 66, 69, 74], beat * 7), 0.22)
  ;[86, 90, 93, 98].forEach((m, i) => add(bt(END, 1 + i * 0.5), bell(m, 1.8), 0.14, i % 2 ? 0.3 : -0.3))
  master(tr, 'b')
}
