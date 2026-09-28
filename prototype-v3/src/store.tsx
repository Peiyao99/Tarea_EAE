import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import type * as THREE from 'three'
import { piecesFor, stagesFor, type Kind, type Mode, type Part, type Piece, type StageKey } from '@/data'
import type { Mark } from '@/components/PatternView'
import type { Variant } from '@/three/Viewer'

export type FileRec = { id: number; name: string; size: number; url?: string; status: 'up' | 'ok' | 'err'; pct: number; obj?: THREE.Object3D | null; sample?: boolean }
export type Screen = { name: 'home' | 'library' | 'tpl' | 'flow' | 'projects' | 'kit' | 'kitDetail' | 'done' | 'me' | 'apply' | 'creator' | 'profile'; tpl?: Kind; id?: string }
export type Role = 'fan' | 'pending' | 'creator'
export type Work = { id: number; title: string; kind: Kind; photo: string | null; note: string; time: string; community: boolean; cases: boolean }

export type Flow = {
  mode: Mode; title: string; kind: Kind; stages: StageKey[]; idx: number; reached: number
  files: FileRec[]; desc: string; custom: THREE.Object3D | null
  genDone: boolean; genFailed: boolean; reconDone: boolean; diagDone: boolean; alignFixed: boolean
  choice: Record<string, number>; confirmed: string[]; active: string
  tech: 'unwrap' | 'match' | 'gusset'; opt: { inflate: number; showInflate: boolean; claw: string; teeth: string }
  seams: Record<string, boolean>; fill: 'belly' | 'back' | 'tail'
  pieces: Record<string, Piece>; sel: string; marks: Mark[]; variant: Variant
  source: 'ai' | 'self' | 'scan'; diagMode: 'auto' | 'adv'
  qa: 'open' | 'shrink' | 'ease'; proof: { checks: boolean[]; photo: string | null; who: 'self' | 'plat'; time: string; feel: string; note: string; community: boolean; cases: boolean; platSent: boolean; platBack: boolean }
  launch: { qty: number; price: number; days: string }; launched: boolean
  shape: { size: number; ear: number; snout: number }; color: string | null
  focus: Part[]
}

export function freshFlow(mode: Mode, kind: Kind = 'dino', title = '坐姿恐龙'): Flow {
  const pieces = piecesFor(kind)
  return {
    mode, title, kind, stages: stagesFor(mode), idx: 0, reached: 0, files: [], desc: '', custom: null,
    genDone: false, genFailed: false, reconDone: false, diagDone: false, alignFixed: false,
    choice: {}, confirmed: [], active: 'leg', tech: 'unwrap', opt: { inflate: 4, showInflate: true, claw: 'emb', teeth: 'emb' },
    seams: { back: true, belly: true, head: true, leg: true, tail: true, arm: true, chin: false }, fill: 'belly',
    pieces, sel: 'H1', marks: [], variant: { spikes: 5, tail: 'dragon' }, source: 'ai', diagMode: 'auto',
    qa: 'open', proof: { checks: [false, false, false], photo: null, who: 'self', time: 'w2', feel: 'ok', note: '', community: true, cases: true, platSent: false, platBack: false },
    launch: { qty: 50, price: 168, days: '14' }, launched: false,
    shape: { size: 1, ear: 1, snout: 1 }, color: null, focus: []
  }
}

export const DEMO_KEYS = [
  ['uploadFail', '上传失败', '下一个文件上传到一半失败，可以重试'],
  ['parseFail', '模型读不出来', '上传的 3D 模型解析失败'],
  ['misalign', '三视图对不齐', '需要手动标注头顶和脚底'],
  ['genFail', 'AI 起形失败', '走失败和回退路径'],
  ['lowToken', 'token 不够', '生成前拦截'],
  ['emptyProj', '没有项目', '工作台显示空状态']
] as const
export type DemoKey = typeof DEMO_KEYS[number][0]

type Ctx = {
  screen: Screen; go: (s: Screen) => void; back: () => void
  user: string | null; login: (name: string) => void; logout: () => void
  gate: (reason: string, run: () => void) => void
  authAsk: { reason: string; run: () => void } | null; closeAuth: () => void
  flow: Flow; setFlow: (fn: (f: Flow) => Flow, undoable?: boolean) => void; undo: () => void; canUndo: boolean
  startFlow: (mode: Mode, opts?: { kind?: Kind; title?: string; files?: FileRec[]; desc?: string; custom?: THREE.Object3D | null; at?: StageKey; plat?: boolean }) => void
  role: Role; setIdentity: (v: 'guest' | Role) => void
  works: Work[]; addWork: (w: Omit<Work, 'id'>) => void
  token: number; setToken: (n: number) => void
  demo: Record<DemoKey, boolean>; setDemo: (k: DemoKey, v: boolean) => void
  guides: Set<string>; doneGuide: (k: string) => void
  share: { title: string; sub: string } | null; setShare: (s: { title: string; sub: string } | null) => void
  snapRef: React.MutableRefObject<(() => string) | null>
  acct: boolean; setAcct: (v: boolean) => void
}
const C = createContext<Ctx>(null as unknown as Ctx)
export const useApp = () => useContext(C)

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const hist = useRef<Screen[]>([])
  const [user, setUser] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('fan')
  const [works, setWorks] = useState<Work[]>([])
  const [authAsk, setAuthAsk] = useState<Ctx['authAsk']>(null)
  const [flow, setFlowRaw] = useState<Flow>(() => freshFlow('text'))
  const [undoStack, setUndo] = useState<Flow[]>([])
  const [token, setToken] = useState(1240)
  const [demo, setDemoRaw] = useState<Record<DemoKey, boolean>>({ uploadFail: false, parseFail: false, misalign: false, genFail: false, lowToken: false, emptyProj: false })
  const [guides, setGuides] = useState<Set<string>>(new Set())
  const [share, setShare] = useState<Ctx['share']>(null)
  const snapRef = useRef<(() => string) | null>(null)
  const [acct, setAcct] = useState(false)

  const go = (s: Screen) => { hist.current.push(screen); setScreen(s) }
  const back = () => setScreen(hist.current.pop() || { name: 'home' })
  const flowRef = useRef(flow); flowRef.current = flow
  const undoRef = useRef(undoStack); undoRef.current = undoStack
  const setFlow: Ctx['setFlow'] = (fn, undoable) => { const prev = flowRef.current, next = fn(prev); flowRef.current = next; if (undoable) setUndo([...undoRef.current.slice(-29), prev]); setFlowRaw(next) }
  const undo = () => { const u = undoRef.current; if (!u.length) return; flowRef.current = u[u.length - 1]; setFlowRaw(u[u.length - 1]); setUndo(u.slice(0, -1)) }
  const startFlow: Ctx['startFlow'] = (mode, o = {}) => {
    const f = freshFlow(mode, o.kind || 'dino', o.title || (o.kind === 'bear' ? '坐姿熊' : o.kind === 'cat' ? '坐姿猫' : o.kind === 'bunny' ? '站姿兔' : '坐姿恐龙'))
    f.files = o.files || []; f.desc = o.desc || ''; f.custom = o.custom || null
    if (o.plat) f.proof.who = 'plat'
    if (o.at) { const i = f.stages.indexOf(o.at); f.idx = f.reached = Math.max(0, i); Object.assign(f, { genDone: true, reconDone: true, diagDone: true }) }
    flowRef.current = f; setFlowRaw(f); setUndo([]); go({ name: 'flow' })
  }
  const gate: Ctx['gate'] = (reason, run) => { if (user) run(); else setAuthAsk({ reason, run }) }
  const login = (name: string) => { setUser(name); const a = authAsk; setAuthAsk(null); a?.run() }

  const ctxRef = useRef<Ctx | null>(null)
  // Capture hook for the promo recorder: lets a script stage screens without clicking through.
  if (typeof window !== 'undefined') (window as unknown as { __app?: () => Ctx | null }).__app = () => ctxRef.current
  return (
    <C.Provider value={ctxRef.current = {
      screen, go, back, user, login, logout: () => setUser(null), gate, authAsk, closeAuth: () => setAuthAsk(null),
      flow, setFlow, undo, canUndo: undoStack.length > 0, startFlow, token, setToken,
      demo, setDemo: (k, v) => setDemoRaw(d => ({ ...d, [k]: v })),
      guides, doneGuide: k => setGuides(g => new Set(g).add(k)), share, setShare, snapRef, acct, setAcct,
      role, setIdentity: v => { if (v === 'guest') setUser(null); else { setUser(u => u || '小满'); setRole(v) } },
      works, addWork: w => setWorks(ws => [{ ...w, id: Date.now() }, ...ws])
    }}>{children}</C.Provider>
  )
}
