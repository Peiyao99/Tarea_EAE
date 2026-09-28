// All demo content lives here. Numbers marked 示例 are illustrative, not real metrics.

export type Kind = 'dino' | 'bear' | 'cat' | 'bunny'
export type Mode = 'text' | 'sketch' | 'ref' | 'views' | 'obj' | 'tpl'
export type Part = 'head' | 'body' | 'belly' | 'spikes' | 'legs' | 'arms' | 'tail' | 'ears'

export const PART_N: Record<Part, string> = { head: '头部', body: '身体', belly: '腹部', spikes: '背刺', legs: '腿', arms: '手臂', tail: '尾巴', ears: '耳朵' }

export const MODES: Record<Exclude<Mode, 'tpl'>, { label: string; long: string; cta: string; cost: number; exts?: string[]; max?: number; count?: number; reqs?: string[] }> = {
  text: { label: '文字', long: '文字描述', cta: '生成纸样', cost: 40 },
  sketch: { label: '手绘稿', long: '手绘稿', cta: '识别手绘并生成', cost: 60, exts: ['jpg', 'jpeg', 'png', 'heic', 'webp'], max: 20, count: 1,
    reqs: ['JPG / PNG / HEIC / WebP，单张，≤ 20 MB', '长边 ≥ 1024 px，正面或 3/4 视角', '线条闭合，白底或浅色纸'] },
  ref: { label: '参考图', long: '参考图', cta: '分析参考图并生成', cost: 60, exts: ['jpg', 'jpeg', 'png', 'webp'], max: 20, count: 4,
    reqs: ['JPG / PNG / WebP，1–4 张，每张 ≤ 20 MB', '同一角色的多个角度，主体完整', '只上传你拥有版权或已获授权的图片'] },
  views: { label: '三视图', long: '三视图', cta: '对齐三视图', cost: 80, exts: ['jpg', 'jpeg', 'png'], max: 20, count: 3,
    reqs: ['正视、侧视、背视各 1 张，每张 ≤ 20 MB', '同一比例、同一地面线，不带透视', '在补充描述里写成品高度'] },
  obj: { label: '3D 模型', long: '3D 模型', cta: '上传并体检', cost: 0, exts: ['obj', 'glb', 'gltf'], max: 100, count: 1,
    reqs: ['OBJ / GLB，单个文件 ≤ 100 MB', '面数建议 ≤ 50 万，尽量是封闭网格', '注明建模单位 mm / cm'] }
}

export type StageKey = 'shape' | 'gen' | 'decide' | 'align' | 'recon' | 'source' | 'diagnose' | 'opt' | 'seam' | 'flat' | 'qa' | 'deliver' | 'proof' | 'launch'
export const STAGE_N: Record<StageKey, string> = { shape: '调形状', gen: 'AI 起形', decide: '拍板', align: '对齐三视图', recon: '重建形体', source: '模型来源', diagnose: '模型体检', opt: '开版方式', seam: '缝线与填充口', flat: '平面纸样', qa: '对缝 QA', deliver: '导出纸样', proof: '打样验证', launch: '发起材料包' }
const SHARED: StageKey[] = ['opt', 'seam', 'flat', 'qa', 'deliver', 'proof', 'launch']
export function stagesFor(mode: Mode): StageKey[] {
  if (mode === 'tpl') return ['shape', 'qa', 'deliver', 'proof', 'launch']
  if (mode === 'views') return ['align', 'recon', ...SHARED]
  if (mode === 'obj') return ['source', 'diagnose', ...SHARED]
  return ['gen', 'decide', ...SHARED]
}
export const isShared = (k: StageKey) => SHARED.includes(k)

export const TEMPLATES: { k: Kind; n: string; pieces: number; level: '入门' | '进阶'; tier: '免费' | '订阅'; tags: string[]; by: string; rounds: number; h: string; fit: string }[] = [
  { k: 'dino', n: '坐姿恐龙', pieces: 13, level: '进阶', tier: '免费', tags: ['坐姿', '神奇动物'], by: 'MOTH 工作室', rounds: 2, h: '18–30 cm', fit: '有一点缝纫基础。难点在背刺嵌入后中缝和尾巴对位。' },
  { k: 'bear', n: '坐姿熊', pieces: 18, level: '入门', tier: '免费', tags: ['坐姿', '入门'], by: '官方', rounds: 3, h: '15–35 cm', fit: '第一只毛绒。全是直线和缓弧，缝错也容易拆。' },
  { k: 'cat', n: '坐姿猫', pieces: 16, level: '入门', tier: '免费', tags: ['坐姿', '入门'], by: '官方', rounds: 2, h: '15–30 cm', fit: '第一只毛绒。尖耳要用筷子顶出来，其余和熊一样。' },
  { k: 'bunny', n: '站姿兔', pieces: 20, level: '进阶', tier: '订阅', tags: ['站姿'], by: '官方', rounds: 2, h: '20–40 cm', fit: '做过一两只。站姿要在腿里加支撑棒。' }
]
export const tplOf = (k: Kind) => TEMPLATES.find(t => t.k === k)!

// Finished pieces people made from templates: the onboarding path instead of a mascot.
export const CASES = [
  { id: 'c1', k: 'dino' as Kind, title: '第一次做就坐稳了', by: '@小满', note: '坐姿恐龙 · 酒红短毛绒 · 22 cm', days: '两个周末', color: 0x7a1f2b },
  { id: 'c2', k: 'bear' as Kind, title: '给妹妹的生日熊', by: '@阿木', note: '坐姿熊 · 奶咖长毛绒 · 25 cm', days: '一个周末', color: 0xc9a27e },
  { id: 'c3', k: 'cat' as Kind, title: '照着自家猫改的耳朵', by: '@Neko', note: '坐姿猫 · 灰色水晶绒 · 20 cm', days: '三个晚上', color: 0x8a8a92 },
  { id: 'c4', k: 'bunny' as Kind, title: '长耳朵终于立住了', by: '@兔兔社', note: '站姿兔 · 白色摇粒绒 · 30 cm', days: '一周', color: 0xe9e2d6 }
]

export type Piece = { n: string; d: string; x: number; y: number; c: [number, number]; qty: number; sa: number; grain: number | null; lab?: [number, number] }
const EAR_D: Record<string, string> = {
  bear: 'M0 70 C0 32 13 0 32 0 C51 0 64 32 64 70 Z',
  cat: 'M0 70 C10 40 24 0 32 0 C40 0 54 40 64 70 Z',
  bunny: 'M0 150 C0 45 10 0 26 0 C42 0 52 45 52 150 Z'
}
export const PIECE_PART: Record<string, Part> = { H1: 'head', H2: 'head', B1: 'body', B2: 'belly', S1: 'spikes', L1: 'legs', L2: 'legs', A1: 'arms', T1: 'tail', C1: 'ears' }
export function piecesFor(kind: Kind): Record<string, Piece> {
  const P: Record<string, Piece> = {
    H1: { n: '头侧片', d: 'M10 90 C10 40 50 10 100 12 C140 14 160 40 162 70 L220 78 C232 82 232 100 218 104 L150 110 C140 140 110 158 70 156 C35 154 10 130 10 90 Z', x: 14, y: 20, c: [90, 84], qty: 2, sa: 5, grain: 0 },
    H2: { n: '头中条', d: 'M20 0 C34 30 36 90 30 160 C28 190 22 210 20 220 C18 210 12 190 10 160 C4 90 6 30 20 0 Z', x: 262, y: 14, c: [20, 110], qty: 1, sa: 5, grain: 0, lab: [-8, 250] },
    B1: { n: '身体侧片', d: 'M30 0 C80 -4 120 20 130 70 C140 120 130 170 100 200 L20 205 C6 170 0 120 4 70 C8 30 14 4 30 0 Z', x: 318, y: 18, c: [62, 96], qty: 2, sa: 5, grain: 0 },
    B2: { n: '腹片', d: 'M60 0 C100 0 120 40 120 90 C120 150 95 190 60 190 C25 190 0 150 0 90 C0 40 20 0 60 0 Z', x: 484, y: 24, c: [60, 90], qty: 1, sa: 5, grain: 0 },
    S1: { n: '背刺', d: 'M0 40 L15 0 L30 40 Z M36 40 L51 4 L66 40 Z M72 40 L87 8 L102 40 Z', x: 632, y: 40, c: [51, 26], qty: 2, sa: 5, grain: 0, lab: [0, 72] },
    L1: { n: '腿', d: 'M0 60 C0 20 30 0 60 0 C90 0 110 20 110 60 L110 130 L0 130 Z', x: 20, y: 300, c: [55, 64], qty: 2, sa: 5, grain: 0 },
    L2: { n: '脚底', d: 'M0 25 C0 10 16 0 34 0 C52 0 68 10 68 25 C68 40 52 50 34 50 C16 50 0 40 0 25 Z', x: 152, y: 336, c: [34, 25], qty: 2, sa: 5, grain: 0, lab: [0, 80] },
    A1: { n: '手臂', d: 'M0 16 C0 6 8 0 18 0 L40 0 C50 0 58 6 58 16 L58 90 C58 102 50 108 40 108 L18 108 C8 108 0 102 0 90 Z', x: 250, y: 300, c: [29, 50], qty: 2, sa: 5, grain: 0, lab: [-4, 138] },
    T1: { n: '尾巴', d: 'M0 60 C30 10 110 0 170 30 C140 44 90 60 40 80 C20 86 4 78 0 60 Z', x: 338, y: 310, c: [70, 46], qty: 2, sa: 5, grain: null, lab: [40, 118] }
  }
  if (kind === 'dino') return P
  delete P.S1
  if (kind !== 'cat') delete P.T1
  else { P.T1.n = '细尾'; P.T1.d = 'M0 20 C60 0 140 0 200 20 C140 36 60 36 0 20 Z'; P.T1.grain = 0 }
  P.H1.d = 'M10 90 C10 40 50 10 100 12 C140 14 160 40 162 70 L178 78 C186 82 186 100 176 104 L150 110 C140 140 110 158 70 156 C35 154 10 130 10 90 Z'
  P.C1 = { n: { bear: '圆耳', cat: '尖耳', bunny: '长耳' }[kind], d: EAR_D[kind], x: 620, y: kind === 'bunny' ? 20 : 40, c: [30, kind === 'bunny' ? 80 : 44], qty: 4, sa: 5, grain: 0, lab: [0, kind === 'bunny' ? 180 : 100] }
  return P
}

export const SEW_STEPS: Record<Kind, [string, string[]][]> = {
  dino: [['头侧片 × 头中条，对齐刻口缝合', ['H1', 'H2']], ['背刺两两缝好翻面，夹进后中缝', ['S1', 'B1']], ['身体侧片 × 腹片，腹片侧面留填充口', ['B1', 'B2']], ['腿缝好，脚底按对位点缝入', ['L1', 'L2']], ['尾巴缝好，接在后中缝下端', ['T1']], ['手臂缝入，填充，藏针缝收口', ['A1', 'B2']]],
  bear: [['头侧片 × 头中条，对齐刻口缝合', ['H1', 'H2']], ['圆耳两两缝好翻面，夹进头部', ['C1', 'H1']], ['身体侧片 × 腹片，留填充口', ['B1', 'B2']], ['腿缝好，脚底按对位点缝入', ['L1', 'L2']], ['手臂缝入，填充，藏针缝收口', ['A1', 'B2']]],
  cat: [['头侧片 × 头中条，对齐刻口缝合', ['H1', 'H2']], ['尖耳翻面时用筷子顶出尖角', ['C1']], ['身体侧片 × 腹片，留填充口', ['B1', 'B2']], ['细尾缝好，填充后接在背后', ['T1']], ['腿、手臂缝入，填充，藏针缝收口', ['L1', 'A1']]],
  bunny: [['头侧片 × 头中条，对齐刻口缝合', ['H1', 'H2']], ['长耳里夹一层衬布再缝', ['C1']], ['身体侧片 × 腹片，留填充口', ['B1', 'B2']], ['长腿里放支撑棒，脚底缝入', ['L1', 'L2']], ['手臂缝入，填充，藏针缝收口', ['A1', 'B2']]]
}

export const PARTS = [
  { k: 'ear-round', slot: 'ears' as Part, cat: '耳朵', n: '圆耳', d: EAR_D.bear, uses: 4, rounds: 3, kinds: ['bear'] as Kind[] },
  { k: 'ear-point', slot: 'ears' as Part, cat: '耳朵', n: '尖耳', d: EAR_D.cat, uses: 3, rounds: 2, kinds: ['cat'] as Kind[] },
  { k: 'ear-long', slot: 'ears' as Part, cat: '耳朵', n: '长耳 · 带衬', d: EAR_D.bunny, uses: 2, rounds: 2, kinds: ['bunny'] as Kind[] },
  { k: 'tail-dragon', slot: 'tail' as Part, cat: '尾巴', n: '龙尾', d: 'M0 60 C30 10 110 0 170 30 C140 44 90 60 40 80 C20 86 4 78 0 60 Z', uses: 3, rounds: 2, kinds: ['dino'] as Kind[], apply: { tail: 'dragon' } },
  { k: 'tail-thin', slot: 'tail' as Part, cat: '尾巴', n: '细长尾', d: 'M0 20 C60 0 140 0 200 20 C140 36 60 36 0 20 Z', uses: 2, rounds: 1, kinds: ['dino', 'cat'] as Kind[], apply: { tail: 'thin' } },
  { k: 'spike-5', slot: 'spikes' as Part, cat: '背刺', n: '背刺 × 5', d: 'M0 40 L15 0 L30 40 Z M36 40 L51 4 L66 40 Z M72 40 L87 8 L102 40 Z', uses: 3, rounds: 2, kinds: ['dino'] as Kind[], apply: { spikes: 5 } },
  { k: 'spike-3', slot: 'spikes' as Part, cat: '背刺', n: '大背刺 × 3', d: 'M0 50 L20 0 L40 50 Z M50 50 L70 6 L90 50 Z', uses: 1, rounds: 1, kinds: ['dino'] as Kind[], apply: { spikes: 3 } },
  { k: 'leg-round', slot: 'legs' as Part, cat: '腿与脚底', n: '圆柱腿 + 椭圆脚底', d: 'M0 60 C0 20 30 0 60 0 C90 0 110 20 110 60 L110 130 L0 130 Z', uses: 5, rounds: 3, kinds: ['dino', 'bear', 'cat', 'bunny'] as Kind[] }
]

export const DECISIONS = [
  { id: 'leg', t: '腿部结构', part: 'legs' as Part, o: [['肋线扫掠', '腿部圆润，一片成型，缝线少', .71], ['分片拼接', '关节轮廓更清楚，多 2 片', .22]] as [string, string, number][] },
  { id: 'joint', t: '腿与身体的连接', part: 'legs' as Part, o: [['缝合接口', '在侧片开口，腿直接缝入身体', .64], ['独立闭合 + 手缝', '腿单独填充后再手缝固定', .28]] as [string, string, number][] },
  { id: 'head', t: '头部拆片', part: 'head' as Part, o: [['4 片', '前一对 + 后一对 + 后中条收背刺', .58], ['6 片', '吻部独立成片，造型更准，更难缝', .31]] as [string, string, number][] },
  { id: 'ease', t: '下巴差 4.6 mm 作为吃势？', part: 'head' as Part, o: [['接受，作为吃势', '吻部下方更饱满，自动加对位点', .62], ['调整曲线至等长', '下巴更平，缝制更容易', .38]] as [string, string, number][] },
  { id: 'arm', t: '手臂结构', part: 'arms' as Part, o: [['肋线扫掠', '和腿同一做法，缝线少', .69], ['两片对缝', '手臂弯度更明显', .24]] as [string, string, number][] },
  { id: 'spike', t: '背刺缝入方式', part: 'spikes' as Part, o: [['嵌入后中缝', '刺根藏在缝份里，外观干净', .66], ['独立贴缝', '可拆换，缝迹外露', .27]] as [string, string, number][] },
  { id: 'tail', t: '尾巴接法', part: 'tail' as Part, o: [['独立成片', '尾巴单独缝好再接', .61], ['与侧片连裁', '少一条缝，但尾巴会偏扁', .33]] as [string, string, number][] },
  { id: 'fabric', t: '布料', part: 'body' as Part, o: [['水晶超柔短毛绒', '毛高 1 mm，细节清晰', .57], ['长毛绒', '手感更软，缝线细节被遮盖', .29]] as [string, string, number][] }
]

export const SEAMS: [string, string, string, Part][] = [
  ['back', '后中缝', '收背刺，刺根藏在缝份里', 'spikes'], ['belly', '腹中缝', '腹片左右分开，坐姿更稳', 'belly'],
  ['head', '头侧缝', '把头分成前后两片', 'head'], ['leg', '腿开口', '腿缝入身体侧片', 'legs'],
  ['tail', '尾巴分片', '尾巴独立成片', 'tail'], ['arm', '手臂接缝', '手臂与身体分开', 'arms'], ['chin', '下巴省道', '吻部下方收出弧度', 'head']
]

// Fabrics actually in stock (G-07): only these can be picked.
export const FABRICS = [
  { k: 'wine', n: '酒红 · 水晶超柔', hex: '#7A1F2B' }, { k: 'oat', n: '奶咖 · 水晶超柔', hex: '#D8C3A5' },
  { k: 'moss', n: '苔绿 · 水晶超柔', hex: '#5A6B45' }, { k: 'ink', n: '墨灰 · 水晶超柔', hex: '#4A4854' },
  { k: 'snow', n: '奶白 · 摇粒绒', hex: '#EDE6DA' }, { k: 'rose', n: '烟粉 · 长毛绒', hex: '#D9A4A0' }
]
