import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronLeft, ChevronDown, CircleAlert, Download, ImagePlus, RotateCcw, TriangleAlert, Lock, ChevronRight, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DECISIONS, FABRICS, MODES, PARTS, PART_N, PIECE_PART, SEAMS, STAGE_N, isShared, type Part, type StageKey } from '@/data'
import { useApp, type Flow as F } from '@/store'
import { Workspace } from '@/components/Workspace'
import { MarkGlyph, PartThumb, type Mark } from '@/components/PatternView'
import { cn } from '@/lib/utils'

/* ---------- small building blocks ---------- */
const Card = ({ children, className }: { children: ReactNode; className?: string }) => <section className={cn('flex flex-col gap-2.5 rounded-[20px] border bg-card p-3.5', className)}>{children}</section>
const H = ({ t, p }: { t: string; p?: string }) => <div className="flex flex-col gap-1"><h2 className="font-display text-[22px] font-black leading-tight">{t}</h2>{p && <p className="text-[13px] text-muted-foreground">{p}</p>}</div>
const Row = ({ ok, children }: { ok: boolean; children: ReactNode }) => <div className="flex items-start gap-2 text-[13.5px] leading-snug">{ok ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />}<span>{children}</span></div>
function Pick<T extends string>({ value, onChange, opts, label }: { value: T; onChange: (v: T) => void; opts: [T, string][]; label: string }) {
  return <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 rounded-full bg-muted p-0.5">{opts.map(([k, n]) => <button key={k} role="radio" aria-checked={value === k} onClick={() => onChange(k)} className={cn('h-7 rounded-full px-3 text-xs', value === k ? 'bg-card font-semibold shadow-sm' : 'text-foreground/70')}>{n}</button>)}</div>
}
const Line = ({ l, s, children }: { l: string; s?: string; children: ReactNode }) => <div className="flex items-center justify-between gap-3 py-1.5"><div className="min-w-0 text-[13.5px]">{l}{s && <div className="text-[11.5px] text-muted-foreground">{s}</div>}</div>{children}</div>
function More({ title, children, open }: { title: string; children: ReactNode; open?: boolean }) {
  return <Collapsible defaultOpen={open} className="rounded-[20px] border bg-card">
    <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3.5 py-3 text-left text-[14px] font-bold">{title}<span className="ml-auto text-xs font-normal text-muted-foreground">已按推荐设定</span><ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" /></CollapsibleTrigger>
    <CollapsibleContent className="border-t px-3.5 pb-3 pt-1">{children}</CollapsibleContent>
  </Collapsible>
}
function Steps({ items, t, onDone }: { items: [string, string][]; t: number[]; onDone: () => void }) {
  const [i, setI] = useState(0)
  useEffect(() => { const ids = t.map((ms, k) => setTimeout(() => { setI(k + 1); if (k === t.length - 1) onDone() }, ms)); return () => ids.forEach(clearTimeout) }, [])
  return <Card>
    <div className="relative h-32 overflow-hidden rounded-xl bg-[#2B2A33]"><div className="absolute inset-x-0 h-12 animate-[scan_1.6s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-[#F3A27A]/30 to-transparent" /><div className="absolute inset-0 grid place-items-center text-[12px] text-[#D8CDBF]">{i < items.length ? items[i][0] + '…' : '完成'}</div></div>
    {items.map(([a, b], k) => <div key={a} className="flex items-center gap-3 text-[14px]">
      <span className={cn('grid size-6 place-items-center rounded-full border-[1.5px]', k < i ? 'border-emerald-700 bg-emerald-700 text-white' : k === i ? 'animate-spin border-primary border-t-transparent' : 'border-muted-foreground/30')}>{k < i && <Check className="size-3.5" />}</span>
      <span className={k <= i ? '' : 'text-muted-foreground'}>{a}</span><span className="ml-auto font-mono text-xs text-muted-foreground">{b}</span></div>)}
  </Card>
}

/* ---------- the flow screen ---------- */
export function Flow() {
  const app = useApp(), f = app.flow, set = app.setFlow
  const stages = f.stages.filter(k => k !== 'launch' || (app.user && app.role === 'creator' && f.proof.who === 'plat'))
  const key = f.stages[f.idx]
  const stageName = (k: StageKey) => k === 'proof' && app.role === 'creator' && f.proof.who === 'plat' ? '平台打样' : STAGE_N[k]
  const [hi, setHi] = useState<{ parts: Part[]; pieces: string[] }>({ parts: [], pieces: [] })
  const [allSteps, setAllSteps] = useState(false)
  const [leave, setLeave] = useState(false)
  const [warn, setWarn] = useState(false)
  const [compact, setCompact] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const goto = (i: number) => { set(x => ({ ...x, idx: i, reached: Math.max(x.reached, i) })); scroller.current?.scrollTo({ top: 0 }) }
  const next = () => goto(f.idx + 1)

  // default focus per stage
  useEffect(() => {
    if (key === 'decide') { const d = DECISIONS.find(x => x.id === f.active)!; setHi({ parts: [d.part], pieces: [] }) }
    else if (key === 'qa') setHi({ parts: ['legs'], pieces: ['L1', 'B1'] })
    else if (key === 'flat') setHi({ parts: [PIECE_PART[f.sel]], pieces: [f.sel] })
    else setHi({ parts: [], pieces: [] })
    setCompact(false)
  }, [key])

  const hasModel = !['align', 'deliver', 'proof', 'launch'].includes(key) && !(key === 'gen' && !f.genDone) && !(key === 'recon' && !f.reconDone) && !(key === 'source' && app.demo.parseFail) && !(key === 'diagnose' && !f.diagDone)
  const swapPart = hi.parts[0]
  const swapList = swapPart ? PARTS.filter(p => p.slot === swapPart && p.kinds.includes(f.kind) && 'apply' in p) : []
  const [swapOpen, setSwapOpen] = useState(false)

  const stage = renderStage()
  return (
    <div className="flex h-full flex-col">
      <header className="z-10 flex flex-col gap-2 border-b bg-background/95 px-3 pb-2.5 pt-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-9 rounded-full" aria-label="返回" onClick={() => setLeave(true)}><ChevronLeft className="size-4" /></Button>
          <div className="min-w-0 flex-1"><b className="block truncate text-[15px]">{f.title}</b><span className="text-xs text-muted-foreground">{f.mode === 'tpl' ? '模板开版' : '来源：' + MODES[f.mode].long}</span></div>
          <Button variant="outline" size="icon" className="size-9 rounded-full" aria-label="撤销" disabled={!app.canUndo} onClick={app.undo}><Undo2 className="size-4" /></Button>
        </div>
        <button className="flex flex-col gap-1.5 text-left" onClick={() => setAllSteps(true)} aria-label="查看全部步骤">
          <span className="flex items-baseline gap-2"><b className="font-mono text-xs font-medium text-primary">{f.idx + 1} / {stages.length}</b><span className="text-[15px] font-bold">{stageName(key)}</span><span className="ml-auto text-xs text-muted-foreground">全部步骤</span></span>
          <Progress value={(f.idx + 1) / stages.length * 100} className="h-1" />
        </button>
      </header>

      {hasModel && <div className="px-3 pt-2.5">
        <Workspace compact={compact} guide viewer={{ kind: f.kind, variant: f.variant, custom: f.custom, color: f.color || undefined, size: f.shape.size, ear: f.shape.ear, snout: f.shape.snout, seams: key === 'seam' ? f.seams : null, showSeams: key !== 'decide', fill: key === 'seam' ? f.fill : null, inflate: key === 'opt' && f.tech === 'unwrap' && f.opt.showInflate ? f.opt.inflate + 3 : 0 }}
          pieces={f.pieces} marks={f.marks} hiParts={hi.parts} hiPieces={hi.pieces}
          onSelect={(p, part) => { setHi({ parts: [part], pieces: p ? [p] : [] }); if (key === 'flat' && p) set(x => ({ ...x, sel: p })) }}
          onSwap={['opt', 'seam', 'flat'].includes(key) && swapList.length ? () => setSwapOpen(true) : null}
          hint={key === 'opt' ? `预计 ${optPieces(f)} 片` : key === 'seam' ? `缝线 ${Object.values(f.seams).filter(Boolean).length} 条` : undefined} />
      </div>}

      <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain" onScroll={e => { const y = (e.target as HTMLDivElement).scrollTop; if (y > 60 && !compact) setCompact(true); else if (y < 8 && compact) setCompact(false) }}>
        <div className="flex flex-col gap-3 px-4 pb-28 pt-4">{stage.body}</div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex gap-2 bg-gradient-to-t from-background via-background to-transparent px-4 pb-5 pt-5">
        <Button variant="outline" className="h-12 rounded-full px-5" disabled={f.idx === 0} onClick={() => goto(f.idx - 1)}>上一步</Button>
        <Button className="h-12 flex-1 rounded-full text-[15px]" disabled={stage.disabled} onClick={stage.onNext || next}>{stage.label}</Button>
      </div>

      <Sheet open={allSteps} onOpenChange={setAllSteps}>
        <SheetContent side="bottom" className="rounded-t-[24px]">
          <SheetHeader><SheetTitle>全部步骤</SheetTitle></SheetHeader>
          <ol className="flex flex-col gap-1.5 px-4 pb-6">{stages.map((k, i) => <li key={k}>
            {isShared(k) && !isShared(stages[i - 1] || 'gen') && f.mode !== 'tpl' && <div className="px-1 pb-1 pt-2 font-mono text-[11px] text-muted-foreground">以下是统一流程</div>}
            <button disabled={i > f.reached} onClick={() => { setAllSteps(false); goto(i) }} className={cn('flex h-11 w-full items-center gap-3 rounded-xl border px-3 text-left text-[14px] disabled:opacity-45', i === f.idx && 'border-foreground font-bold ring-1 ring-foreground')}>
              <span className={cn('grid size-6 place-items-center rounded-full font-mono text-[11px]', i < f.reached || i < f.idx ? 'bg-emerald-700 text-white' : i === f.idx ? 'bg-primary text-primary-foreground' : 'bg-muted')}>{i + 1}</span>{stageName(k)}{i === f.idx && <span className="ml-auto text-xs text-primary">当前</span>}
            </button></li>)}</ol>
        </SheetContent>
      </Sheet>

      <Dialog open={leave} onOpenChange={setLeave}>
        <DialogContent className="max-w-[340px] rounded-[22px]">
          <DialogHeader><DialogTitle>先离开这个项目？</DialogTitle>
            <DialogDescription>{app.user ? `进度已自动存进工作台，停在「${stageName(key)}」，回来接着做。` : '你还没登录，离开后这次的进度不会保存。'}</DialogDescription></DialogHeader>
          <DialogFooter className="flex-row gap-2">
            {!app.user && <Button variant="outline" className="flex-1 rounded-full" onClick={() => { setLeave(false); app.gate('登录后保存这只设计', () => toast.success('已保存到工作台')) }}>登录保存</Button>}
            {app.user && <Button variant="outline" className="flex-1 rounded-full" onClick={() => setLeave(false)}>继续开版</Button>}
            <Button className="flex-1 rounded-full" onClick={() => { setLeave(false); app.back() }}>离开</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={warn} onOpenChange={setWarn}>
        <DialogContent className="max-w-[340px] rounded-[22px]">
          <DialogHeader><DialogTitle>还有必修项没处理</DialogTitle><DialogDescription>红色项不处理，展开时很可能失败，或者出现翻不了面的裁片。</DialogDescription></DialogHeader>
          <DialogFooter className="flex-row gap-2"><Button variant="outline" className="flex-1 rounded-full" onClick={() => setWarn(false)}>回去修</Button><Button className="flex-1 rounded-full" onClick={() => { setWarn(false); next() }}>仍然继续</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={swapOpen} onOpenChange={setSwapOpen}>
        <SheetContent side="bottom" className="rounded-t-[24px]">
          <SheetHeader><SheetTitle>替换{swapPart ? PART_N[swapPart] : ''}</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-2 px-4 pb-6">{swapList.map(p => (
            <button key={p.k} className="flex items-center gap-3 rounded-xl border p-2.5 text-left" onClick={() => {
              setSwapOpen(false)
              set(x => { const pieces = { ...x.pieces }; if (p.slot === 'tail' && pieces.T1) pieces.T1 = { ...pieces.T1, d: p.d, n: p.n }; if (p.slot === 'spikes' && pieces.S1) pieces.S1 = { ...pieces.S1, d: p.d, n: p.n.split(' ')[0] }; return { ...x, pieces, variant: { ...x.variant, ...(p as { apply: object }).apply }, qa: 'open' } }, true)
              toast.success(`已换成「${p.n}」`, { description: '对应裁片已替换，需要重新做对缝 QA' })
            }}>
              <span className="h-12 w-16 rounded-lg bg-[#FDFCFA] p-1"><PartThumb d={p.d} /></span>
              <span className="flex-1"><b className="text-[14px]">{p.n}</b><div className="text-xs text-muted-foreground">用于 {p.uses} 个模板 · 打样 {p.rounds} 轮</div></span>
            </button>))}</div>
        </SheetContent>
      </Sheet>
    </div>
  )

  /* ---------- stages ---------- */
  function renderStage(): { body: ReactNode; label: string; disabled?: boolean; onNext?: () => void } {
    const nextName = stages[f.idx + 1] ? '下一步 · ' + stageName(stages[f.idx + 1]) : '完成'
    switch (key as StageKey) {
      case 'gen': return genStage()
      case 'decide': return decideStage()
      case 'align': return alignStage()
      case 'recon': return reconStage()
      case 'source': return sourceStage()
      case 'diagnose': return diagnoseStage()
      case 'shape': return shapeStage()
      case 'opt': return optStage()
      case 'seam': return { label: '展开成平面纸样', body: <>
        <H t="确认缝线和填充口" p="只需要定一件事：棉从哪塞进去。" />
        <Card><Line l="填充口" s="最后用藏针缝收口"><Pick label="填充口" value={f.fill} onChange={v => set(x => ({ ...x, fill: v }), true)} opts={[['belly', '腹片侧面'], ['back', '后中缝'], ['tail', '尾巴根']]} /></Line></Card>
        <More title={`逐条调整缝线 · ${SEAMS.length} 条`}>{SEAMS.map(([k, n, s, part]) => <Line key={k} l={n} s={s}><Switch checked={f.seams[k]} onCheckedChange={v => { set(x => ({ ...x, seams: { ...x.seams, [k]: v } }), true); setHi({ parts: [part], pieces: [] }); if (k === 'back' && !v) toast('关掉后中缝后，背刺要改成贴缝') }} aria-label={n} /></Line>)}</More>
      </> }
      case 'flat': return flatStage(nextName)
      case 'qa': return qaStage()
      case 'deliver': return deliverStage(nextName)
      case 'proof': return proofStage()
      case 'launch': return launchStage()
    }
    return { body: null, label: nextName }
  }

  function genStage() {
    if (f.genFailed) return { label: '选一种方式继续', disabled: true, body: <>
      <H t="这次没生成出来" p="已退回 token，选一种方式接着做，进度不会丢。" />
      <Card className="border-destructive/30 bg-destructive/5"><div className="flex items-start gap-2 text-[13.5px]"><CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />描述里「背部一排软刺」和「坐姿」的姿态信息有冲突，AI 没能收敛成一个形体。</div></Card>
      {[['重试一次', '换个随机种子，不扣 token', () => { app.setDemo('genFail', false); set(x => ({ ...x, genFailed: false })) }], ['用最接近的模板', '坐姿恐龙模板 · 匹配度 82%（示例值）', () => app.go({ name: 'tpl', tpl: 'dino' })], ['交给人工开版师', '24 小时内给出 3D 形体 · ¥68（示例价格）', () => toast.success('已提交人工开版，完成后在工作台通知你')]].map(([a, b, fn]) =>
        <button key={a as string} onClick={fn as () => void} className="rounded-2xl border bg-card p-3 text-left"><b className="text-[14px]">{a as string}</b>{a === '用最接近的模板' && <Badge className="ml-2 rounded-full">推荐</Badge>}<div className="text-xs text-muted-foreground">{b as string}</div></button>)}
    </> }
    if (!f.genDone) return { label: 'AI 起形中…', disabled: true, body: <>
      <H t="AI 正在起形" p={f.desc ? '「' + f.desc + '」' : undefined} />
      <Steps key={'gen' + app.demo.genFail} items={[[f.mode === 'sketch' ? '读手绘线稿' : f.mode === 'ref' ? '合并参考图' : '解析描述', '25 cm'], ['长出 3D 形体', 'v1'], ['自动拆件', '13 片'], ['找出拿不准的决定', '8 项']]} t={[700, 1700, 2500, 3100]}
        onDone={() => { if (app.demo.genFail) { set(x => ({ ...x, genFailed: true })); app.setToken(app.token + MODES[f.mode as 'text'].cost); return } set(x => ({ ...x, genDone: true })); setTimeout(() => app.setShare({ title: '你的第一只 3D 形体', sub: `${f.title} · 25 cm · 13 片` }), 400) }} />
    </> }
    return { label: '看看 8 个要你拍板的决定', body: <>
      <H t="形体出来了" p="拖动 3D 看看各个角度，点一片纸样，3D 上对应部位会一起亮。" />
      <Card><Row ok>3D 形体 v1 · 自动拆成 13 片</Row><Row ok={false}>还有 8 个决定拿不准，下一步交给你</Row></Card>
    </> }
  }

  function decideStage() {
    const n = f.confirmed.length
    return { label: `确认决定 · 进入${STAGE_N.opt}`, onNext: () => { toast(`已确认 ${n}/8 项，其余按推荐`); next() }, body: <>
      <H t="8 个得你拍板" p="点一下就算确认，没点的按推荐。" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Progress value={n / 8 * 100} className="h-1.5 flex-1" /><span className="font-mono">{n}/8</span></div>
      <More title="AI 已经定了 19 个"><div className="flex flex-col gap-1 py-1 text-[13px]">{[['缝份宽度', '5 mm', .97], ['布纹方向', '头顶 → 尾', .95], ['眼睛位置', '对位点 × 2', .93], ['身体拆片', '侧片 × 2 + 腹片', .91]].map(a => <div key={a[0] as string} className="flex justify-between"><span className="text-muted-foreground">{a[0]}</span><span>{a[1]}</span><span className="font-mono text-emerald-700">{(a[2] as number).toFixed(2)}</span></div>)}<div className="text-muted-foreground">其余 15 项 ≥ 0.85</div></div></More>
      {DECISIONS.map(d => { const done = f.confirmed.includes(d.id), sel = f.choice[d.id] ?? 0; return (
        <Card key={d.id} className={cn(f.active === d.id && 'ring-1 ring-foreground')}>
          <div className="flex items-center gap-2"><b className="flex-1 text-[14.5px]">{d.t}</b>
            {done ? <><Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-800">已确认</Badge><button className="text-xs text-primary" onClick={() => set(x => ({ ...x, confirmed: x.confirmed.filter(c => c !== d.id) }), true)}>撤销</button></> : <Badge variant="secondary" className="rounded-full bg-amber-50 text-amber-800">待确认</Badge>}</div>
          {d.o.map(([n1, s1, c], i) => <button key={n1} onClick={() => { set(x => ({ ...x, choice: { ...x.choice, [d.id]: i }, confirmed: [...new Set([...x.confirmed, d.id])], active: d.id }), true); setHi({ parts: [d.part], pieces: [] }) }}
            className={cn('grid grid-cols-[18px_1fr_52px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left', sel === i ? 'border-foreground bg-card ring-1 ring-foreground' : 'bg-muted/40')}>
            <span className={cn('size-[18px] rounded-full border-[1.5px]', sel === i ? 'border-[5px] border-foreground' : 'border-muted-foreground/40')} />
            <span><b className="text-[13.5px] font-medium">{n1}</b>{i === 0 && <Badge className="ml-1.5 h-4 rounded-full px-1.5 text-[10px]">推荐</Badge>}<div className="text-xs text-muted-foreground">{s1}</div></span>
            <span className="flex flex-col items-end gap-1"><span className="font-mono text-xs">{c.toFixed(2)}</span><span className="h-[3px] w-full rounded bg-muted"><i className="block h-full rounded bg-primary" style={{ width: c * 100 + '%' }} /></span></span>
          </button>)}
        </Card>) })}
    </> }
  }

  function alignStage() {
    const bad = app.demo.misalign && !f.alignFixed
    return { label: bad ? '先标注头顶和脚底' : '重建 3D 形体', disabled: bad, body: <>
      <H t={bad ? '三张图对不齐' : '先把三张图对齐'} p={bad ? '侧视图比正视图高了 18%，超过自动对齐的上限。标一下头顶和脚底就能对齐。' : '地面线和头顶线对齐，重建出来才不会歪。'} />
      <Card><div className="grid grid-cols-3 gap-2">{['正视', '侧视', '背视'].map((n, i) => { const file = f.files[i]; return (
        <figure key={n} className="flex flex-col items-center gap-1.5">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-[#FDFCFA]" style={bad && i === 1 ? { transform: 'scale(1.1)', transformOrigin: 'bottom' } : undefined}>
            {file?.url ? <img src={file.url} alt="" className="size-full object-contain" /> : <ViewSketch v={i} />}
            <span className="absolute inset-x-0 top-[9%] border-t-[1.5px] border-dashed border-teal-600" /><span className="absolute inset-x-0 bottom-[6%] border-t-[1.5px] border-dashed border-amber-700" />
          </div>
          <figcaption className="flex items-center gap-1 text-xs text-muted-foreground">{bad && i === 1 ? <TriangleAlert className="size-3.5 text-amber-700" /> : <Check className="size-3.5 text-emerald-700" />}{n}</figcaption>
        </figure>) })}</div>
        <div className="flex gap-4 text-[11px] text-muted-foreground"><span><i className="mr-1 inline-block w-4 border-t-[1.5px] border-dashed border-teal-600 align-middle" />头顶线</span><span><i className="mr-1 inline-block w-4 border-t-[1.5px] border-dashed border-amber-700 align-middle" />地面线</span></div>
      </Card>
      {bad ? <Button className="h-11 rounded-full" variant="outline" onClick={() => { set(x => ({ ...x, alignFixed: true })); toast.success('已按标注缩放侧视图 · 误差 1.2%') }}>手动标注头顶和脚底</Button>
        : <Card><Row ok>三张视图高度一致，误差 1.2%</Row><Row ok>正视与侧视的头、身、脚位置对应</Row><Row ok>背视背刺 5 个，与侧视一致</Row></Card>}
    </> }
  }

  function reconStage() {
    if (!f.reconDone) return { label: '重建中…', disabled: true, body: <><H t="正在重建形体" /><Steps items={[['提取三视图轮廓', '3 张'], ['轮廓求交 · 体积重建', '2 mm'], ['按中线合并、抹平', '镜像'], ['标出难缝的地方', '']]} t={[600, 1400, 2200, 2800]} onDone={() => set(x => ({ ...x, reconDone: true }))} /></> }
    return { label: '下一步 · ' + STAGE_N.opt, body: <><H t="形体出来了" p="和三视图最大偏差 2.1 mm。有两处缝不出来，下一步处理。" /><Card><Row ok>轮廓偏差 ≤ 2.1 mm</Row><Row ok={false}>爪尖、牙齿小于 6 mm，要取舍</Row><Row ok={false}>腋下凹陷 12 mm，填充后会被撑平</Row></Card></> }
  }

  function sourceStage() {
    const file = f.files[0]
    if (app.demo.parseFail || (file && !file.sample && !file.obj && !f.custom)) return { label: '文件读不出来', disabled: true, body: <>
      <H t="这个文件读不出来" p="上传完成了，但模型解析失败。" />
      <Card className="border-destructive/30 bg-destructive/5"><b className="text-[14px]">{file?.name || 'dino_v3.obj'}</b><p className="text-[13px] text-foreground/80">文件在中途断开，可能导出时没写完整，或上传被打断。</p></Card>
      <Card><Row ok>从建模软件重新导出，勾选「三角化」</Row><Row ok>换成 GLB 格式再传，体积更小也更稳</Row><Row ok>超过 100 MB 先减面到 50 万以下</Row></Card>
      <Button variant="outline" className="h-11 rounded-full" onClick={() => { app.setDemo('parseFail', false); app.back() }}>重新上传</Button>
    </> }
    return { label: '开始体检', onNext: () => { set(x => ({ ...x, diagDone: false })); next() }, body: <>
      <H t="这个模型从哪来？" p="来源决定我们查什么、怎么修。" />
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900"><Check className="size-4" />上传成功 · {file?.name || 'dino_v3.obj'}{f.custom ? ' · 已按你的文件渲染' : ' · 示例模型'}</div>
      {([['ai', 'AI 生成', '文生 3D / 图生 3D 工具导出', '常见：网格噪点、非流形边、细节过密'], ['self', '自己建模', 'Blender、ZBrush、Nomad 等', '常见：细长部件、深凹陷、单位不明'], ['scan', '3D 扫描 / 手办翻模', '手机扫描或结构光扫描', '常见：孔洞、背面缺失、表面噪点']] as const).map(([k, n, s, w]) =>
        <button key={k} onClick={() => set(x => ({ ...x, source: k }))} className={cn('rounded-2xl border bg-card p-3 text-left', f.source === k && 'border-foreground ring-1 ring-foreground')}><b className="text-[14px]">{n}</b>{k === 'ai' && <Badge className="ml-2 rounded-full">最常见</Badge>}<div className="text-xs text-muted-foreground">{s}</div><div className="text-xs text-amber-800">{w}</div></button>)}
    </> }
  }

  function diagnoseStage() {
    if (!f.diagDone) return { label: '体检中…', disabled: true, body: <><H t="正在给模型体检" /><Steps items={[['网格拓扑', '封闭性'], ['尺度与单位', 'cm'], ['细长与薄壁部件', '< 8 mm'], ['能不能缝', '凹陷 · 细节']]} t={[500, 1100, 1700, 2300]} onDone={() => set(x => ({ ...x, diagDone: true }))} /></> }
    const D: [('fail' | 'warn' | 'ok'), string, string, string][] = ({
      ai: [['fail', '非流形边 214 处', '会导致展开失败', '自动修复'], ['warn', '表面噪点 0.8 mm', '干扰缝线吸附', '平滑'], ['warn', '面数 186k，细节过密', '开版只要约 2 万面', '重拓扑'], ['warn', '爪尖、牙齿小于 6 mm', '缝不出立体', '转刺绣'], ['ok', '封闭网格', '', '']],
      self: [['ok', '封闭网格 · 无非流形边', '', ''], ['warn', '面数 186k', '开版只要约 2 万面', '重拓扑'], ['fail', '尾巴尖最窄 5 mm', '翻不了面', '加粗到 8 mm'], ['warn', '腋下凹陷 14 mm', '填充后会被撑平', '抬高']],
      scan: [['fail', '孔洞 6 处', '脚底和腋下', '补洞'], ['fail', '背面缺失 12%', '扫描角度不够', '镜像补全'], ['warn', '表面噪点 1.4 mm', '', '平滑'], ['warn', '面数 1.2M', '', '重拓扑']]
    } as const)[f.source] as unknown as [('fail' | 'warn' | 'ok'), string, string, string][]
    const fails = D.filter(d => d[0] === 'fail').length, fix = D.filter(d => d[3]).length
    return { label: f.diagMode === 'auto' ? '一键修好 · 进入开版方式' : '按我的设置修 · 继续', onNext: () => { if (f.diagMode === 'adv' && fails) setWarn(true); else { toast.success(`已修复 ${fix} 处`); next() } }, body: <>
      <H t={`体检完了，${fix} 处要动刀`} p="红色必须修，黄色建议修。" />
      <Card className="gap-0 py-1">{D.map(([s, a, b, c]) => <div key={a} className="flex items-start gap-2.5 border-b py-2.5 last:border-0 text-[13.5px]">
        {s === 'ok' ? <Check className="mt-0.5 size-4 text-emerald-700" /> : s === 'warn' ? <TriangleAlert className="mt-0.5 size-4 text-amber-700" /> : <CircleAlert className="mt-0.5 size-4 text-destructive" />}
        <span className="flex-1">{a}{b && <div className="text-xs text-muted-foreground">{b}</div>}</span>{c && <Badge variant="secondary" className="rounded-full">{c}</Badge>}</div>)}</Card>
      <div className="grid grid-cols-2 gap-2">{([['auto', '一键全修', `按推荐参数修好 ${fix} 处`], ['adv', '我自己调', '逐项设定修复强度']] as const).map(([k, n, s]) => <button key={k} onClick={() => set(x => ({ ...x, diagMode: k }))} className={cn('rounded-2xl border bg-card p-3 text-left', f.diagMode === k && 'border-foreground ring-1 ring-foreground')}><b className="text-[14px]">{n}</b>{k === 'auto' && <Badge className="ml-1.5 rounded-full">推荐</Badge>}<div className="text-xs text-muted-foreground">{s}</div></button>)}</div>
      {f.diagMode === 'adv' && <Card><SliderRow l="重拓扑面数" min={5} max={50} v={20} u="k" /><SliderRow l="平滑强度" min={0} max={100} v={40} u="%" /><SliderRow l="最小部件宽度" min={4} max={15} v={8} u=" mm" /></Card>}
    </> }
  }

  function shapeStage() {
    const s = f.shape
    const setS = (k: keyof F['shape'], v: number) => set(x => ({ ...x, shape: { ...x.shape, [k]: v } }), true)
    return { label: '下一步 · ' + STAGE_N.qa, body: <>
      <H t="改成你自己的那只" p="拖参数，3D 和纸样一起变。精修可以之后再改。" />
      <Card>
        <SliderRow l="成品高度" min={15} max={35} v={Math.round(22 * s.size)} u=" cm" on={v => setS('size', v / 22)} />
        <SliderRow l={f.kind === 'dino' ? '吻部突出' : '口鼻大小'} min={60} max={150} v={Math.round(s.snout * 100)} u="%" on={v => setS('snout', v / 100)} />
        {f.kind !== 'dino' && <SliderRow l="耳朵长度" min={60} max={160} v={Math.round(s.ear * 100)} u="%" on={v => setS('ear', v / 100)} />}
      </Card>
      <Card>
        <Line l="布料" s={FABRICS.find(x => x.hex === f.color)?.n || '只显示有库存的颜色'}><span /></Line>
        <div className="grid grid-cols-6 gap-2">{FABRICS.map(c => <button key={c.k} aria-label={c.n} onClick={() => set(x => ({ ...x, color: c.hex }), true)} className={cn('aspect-square rounded-full border-[3px] border-card ring-1 ring-border', f.color === c.hex && 'ring-2 ring-primary')} style={{ background: c.hex }} />)}</div>
      </Card>
    </> }
  }

  function optStage() {
    const TECH = { unwrap: ['曲面展开', '沿缝线展平，最还原造型'], match: ['模板匹配', '变形已验证模板，最好缝'], gusset: ['撑片法', '加撑片，立体感强'] } as const
    return { label: '下一步 · ' + STAGE_N.seam, body: <>
      <H t="选一种开版方式" p="拿不准就用推荐。" />
      <div className="grid grid-cols-3 gap-2">{(Object.keys(TECH) as F['tech'][]).map(k => <button key={k} onClick={() => { set(x => ({ ...x, tech: k }), true); setHi({ parts: k === 'gusset' ? ['head', 'belly'] : [], pieces: [] }) }} className={cn('rounded-2xl border bg-card p-2.5 text-left', f.tech === k && 'border-foreground ring-1 ring-foreground')}><b className="text-[13px]">{TECH[k][0]}</b>{k === 'unwrap' && <Badge className="ml-1 h-4 rounded-full px-1.5 text-[10px]">推荐</Badge>}<div className="text-[11px] leading-snug text-muted-foreground">{TECH[k][1]}</div></button>)}</div>
      {f.tech === 'unwrap' && <More title="膨胀补偿与细节取舍">
        <Line l="显示填充后外轮廓"><Switch checked={f.opt.showInflate} onCheckedChange={v => set(x => ({ ...x, opt: { ...x.opt, showInflate: v } }))} aria-label="显示填充后外轮廓" /></Line>
        <SliderRow l="填充膨胀补偿" min={0} max={8} v={f.opt.inflate} u="%" on={v => set(x => ({ ...x, opt: { ...x.opt, inflate: v } }))} />
        <Line l="爪尖" s="约 5 mm"><Pick label="爪尖" value={f.opt.claw} onChange={v => { set(x => ({ ...x, opt: { ...x.opt, claw: v } }), true); setHi({ parts: ['legs'], pieces: [] }) }} opts={[['emb', '刺绣'], ['3d', '立体'], ['omit', '省略']]} /></Line>
        <Line l="牙齿" s="约 3 mm"><Pick label="牙齿" value={f.opt.teeth} onChange={v => { set(x => ({ ...x, opt: { ...x.opt, teeth: v } }), true); setHi({ parts: ['head'], pieces: [] }) }} opts={[['emb', '刺绣'], ['felt', '毛毡'], ['omit', '省略']]} /></Line>
      </More>}
      {f.tech === 'match' && <Card><div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3"><b className="flex-1 text-[14px]">坐姿恐龙模板</b><span className="font-mono text-xl text-emerald-800">91%</span></div><Line l="吻部"><span className="font-mono text-sm">+6 mm</span></Line><Line l="尾巴"><span className="font-mono text-sm">+18 mm</span></Line></Card>}
      {f.tech === 'gusset' && <Card><Line l="头部撑片" s="额头到后脑一条"><Switch defaultChecked aria-label="头部撑片" /></Line><Line l="腹部撑片" s="坐姿更稳"><Switch defaultChecked aria-label="腹部撑片" /></Line><SliderRow l="撑片宽度" min={15} max={40} v={24} u=" mm" /></Card>}
    </> }
  }

  function flatStage(nextName: string) {
    const P = f.pieces, p = P[f.sel], keys = Object.keys(P)
    const noGrain = keys.filter(k => P[k].grain == null), has = (t: Mark['t']) => f.marks.some(m => m.t === t)
    const spec: [boolean, string][] = [[true, `裁片编号与名称 ${keys.length}/${keys.length}`], [!noGrain.length, noGrain.length ? noGrain.join('、') + ' 缺毛向箭头' : '毛向箭头齐全'], [true, '缝份已标注 · 默认 5 mm'], [has('fill'), has('fill') ? '填充口已标注' : '没标填充口，建议在 B2 腹片侧面'], [has('eye') || has('emb'), has('eye') || has('emb') ? '眼睛 / 刺绣位置已标注' : '没标眼睛或刺绣位置'], [true, '1:1 校准方块 5 × 5 cm']]
    const upd = (patch: Partial<typeof p>) => set(x => ({ ...x, pieces: { ...x.pieces, [x.sel]: { ...x.pieces[x.sel], ...patch } } }), true)
    const MK: [Mark['t'], string][] = [['emb', '刺绣'], ['eye', '安全眼'], ['fill', '填充口'], ['ladder', '藏针缝'], ['notch', '对位点']]
    return { label: nextName, onNext: () => { const miss = spec.filter(s => !s[0]).length; if (miss) toast(`还有 ${miss} 项规范没补，导出前可以回来`); next() }, body: <>
      <H t="给纸样补上手工信息" p="补齐清单，纸样才能拿去裁。" />
      <Card><b className="text-[14px]">图纸规范 {spec.filter(s => s[0]).length}/{spec.length}</b>{spec.map(([ok, t]) => <Row key={t} ok={ok}>{t}</Row>)}</Card>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">{keys.map(k => <button key={k} onClick={() => { set(x => ({ ...x, sel: k })); setHi({ parts: [PIECE_PART[k]], pieces: [k] }) }} className={cn('h-8 shrink-0 rounded-full border px-3 text-[13px]', f.sel === k ? 'border-foreground bg-foreground text-background' : 'bg-card')}>{k} {P[k].n}{P[k].grain == null && ' ·!'}</button>)}</div>
      <Card>
        <b className="text-[14px]">{f.sel} · {p.n}</b>
        <Line l="裁剪数量"><Pick label="裁剪数量" value={String(p.qty)} onChange={v => upd({ qty: +v })} opts={[['1', '×1'], ['2', '×2 镜像'], ['4', '×4']]} /></Line>
        <Line l="缝份"><Pick label="缝份" value={String(p.sa)} onChange={v => upd({ sa: +v })} opts={[['5', '5 mm'], ['7', '7 mm'], ['10', '10 mm']]} /></Line>
        <Line l="毛向" s={p.grain == null ? '未设置' : `箭头 ${p.grain}°`}><Button size="sm" variant="outline" className="rounded-full" onClick={() => upd({ grain: p.grain == null ? 0 : (p.grain + 90) % 360 })}>{p.grain == null ? '加毛向箭头' : '旋转 90°'}</Button></Line>
      </Card>
      <Card>
        <b className="text-[14px]">手工标记 · 标在 {f.sel} 上</b>
        <div className="flex flex-wrap gap-1.5">{MK.map(([t, n]) => <Button key={t} variant="outline" size="sm" className="rounded-full" onClick={() => { set(x => ({ ...x, marks: [...x.marks, { p: x.sel, t }] }), true); toast(`已在 ${f.sel} 加${n}`) }}><svg width="26" height="18" viewBox="-14 -9 28 18" aria-hidden><MarkGlyph t={t} x={0} y={0} /></svg>{n}</Button>)}</div>
        {f.marks.some(m => m.p === f.sel) && <div className="flex flex-wrap gap-1.5">{f.marks.map((m, i) => m.p === f.sel && <button key={i} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs" onClick={() => set(x => ({ ...x, marks: x.marks.filter((_, j) => j !== i) }), true)}>{MK.find(a => a[0] === m.t)![1]}<X className="size-3" /></button>)}</div>}
      </Card>
    </> }
  }

  function qaStage() {
    const rows: [string, number, number, 'pass' | 'ease' | 'fail'][] = [['H1↔H2 头前后', 142.3, 142.1, 'pass'], ['B1↔B2 侧片 / 腹片', 210.5, 209.9, 'pass'], ['C 下巴', 92.6, 88.0, 'ease'], ['L1↔B1 腿开口', 118.2, f.qa === 'shrink' ? 118.5 : 121.9, f.qa === 'open' ? 'fail' : f.qa === 'ease' ? 'ease' : 'pass'], ['S 背刺中缝', 96.4, 96.4, 'pass']]
    return { label: '导出纸样', onNext: () => { if (f.qa === 'open') toast('腿开口还没处理，导出的纸样会带着这个问题'); next() }, body: <>
      <H t="最后一关：对缝" p="把红色那条处理掉，就能导出。" />
      <div className="grid grid-cols-3 gap-2">{[['对缝通过', f.qa === 'open' ? '22/24' : '23/24'], ['吃势', f.qa === 'ease' ? '2 处' : '1 处'], ['最大应变', '3.8%']].map(([a, b]) => <div key={a} className="rounded-2xl border bg-card px-3 py-2"><div className="text-[11px] text-muted-foreground">{a}</div><b className="font-mono text-lg font-medium">{b}</b></div>)}</div>
      {f.qa === 'open' ? <Card className="border-destructive/40"><b className="flex items-center gap-1.5 text-[14px] text-destructive"><TriangleAlert className="size-4" />腿开口长度差 3.7 mm</b><p className="text-[13px] text-foreground/80">开口跨侧片和腹片，交线偏长。收小开口，或把差值当吃势分到侧片。</p>
        <div className="flex gap-2"><Button className="flex-1 rounded-full" variant="secondary" onClick={() => { set(x => ({ ...x, qa: 'shrink' }), true); toast.success('已收小开口 · 对缝 23/24') }}>自动收小开口</Button><Button className="flex-1 rounded-full" variant="outline" onClick={() => set(x => ({ ...x, qa: 'ease' }), true)}>当吃势接受</Button></div></Card>
        : <Card className="border-emerald-700/30 bg-emerald-50/60"><b className="flex items-center gap-1.5 text-[14px] text-emerald-800"><Check className="size-4" />{f.qa === 'shrink' ? '腿开口已收小，差 0.3 mm' : '3.7 mm 已作为吃势'}</b><Button variant="ghost" size="sm" className="self-start" onClick={() => set(x => ({ ...x, qa: 'open' }), true)}><RotateCcw className="size-3.5" />撤销</Button></Card>}
      <Card className="gap-0 py-1"><div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b py-2 text-[11px] text-muted-foreground"><span>对缝（mm）</span><span>差</span><span>状态</span></div>
        {rows.map(([n, a, b, s]) => <div key={n} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-b py-2 text-[13px] last:border-0"><span>{n}</span><span className="font-mono">{Math.abs(a - b).toFixed(1)}</span><Badge variant="secondary" className={cn('rounded-full', s === 'pass' ? 'bg-emerald-50 text-emerald-800' : s === 'ease' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800')}>{s === 'pass' ? '通过' : s === 'ease' ? '作吃势' : '待处理'}</Badge></div>)}</Card>
    </> }
  }

  function deliverStage(nextName: string) {
    const files: [string, string, string][] = [['PDF', 'A4 拼贴打印稿', '12 页 · 含 5 cm 校准方块'], ['SVG', '裁片矢量图', '9 种裁片'], ['DXF', '裁床文件', '含刻口与布纹线'], ['PDF', '缝制说明书', '8 页 · 按顺序配图']]
    return { label: nextName, body: <>
      <H t="纸样导出好了" p="先打第 1 页量一下校准方块，5 cm 对上了再打剩下的。" />
      <Card className="gap-0 py-1">{files.map(([t, n, s]) => <div key={n} className="flex items-center gap-3 border-b py-2.5 last:border-0">
        <span className="grid h-11 w-10 place-items-center rounded-lg bg-[#2B2A33] font-mono text-[10px] text-[#F3EFE8]">{t}</span><span className="flex-1"><b className="text-[14px] font-medium">{n}</b><div className="text-xs text-muted-foreground">{s}</div></span>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => app.gate('登录后下载纸样', () => toast.success(`已保存「${n}」`, { description: '原型不生成真实文件' }))}><Download className="size-3.5" />保存</Button></div>)}</Card>
      <Card><Row ok>打印比例选「实际大小」，别选「适合页面」</Row><Row ok>按页角编号拼贴，对齐十字对位线</Row></Card>
    </> }
  }

  function proofStage() {
    const P = f.proof, creator = app.user && app.role === 'creator', plat = creator && P.who === 'plat'
    const setP = (p: Partial<F['proof']>) => set(x => ({ ...x, proof: { ...x.proof, ...p } }))
    const save = () => app.gate('登录后，缝好的这只会存进你的作品', () => {
      app.addWork({ title: f.title, kind: f.kind, photo: P.photo, note: P.note, time: TIMES.find(t => t[0] === P.time)![1], community: P.community, cases: P.cases })
      set(x => ({ ...x, launched: false })); app.go({ name: 'done' })
    })
    const who = creator && <Card><Line l="这次怎么做" s="平台打样通过后才能发起材料包"><Pick label="这次怎么做" value={P.who} onChange={v => setP({ who: v })} opts={[['self', '自己缝'], ['plat', '平台打样']]} /></Line></Card>
    if (plat) {
      const passed = P.platBack
      return { label: passed ? '下一步 · 发起材料包' : P.platSent ? '等样品回传' : '提交平台打样 · ¥88', disabled: P.platSent && !passed,
        onNext: passed ? next : () => { setP({ platSent: true }); toast.success('已提交平台打样', { description: '约 5 天，样品照片和检查报告会回传到这里' }) }, body: <>
        <H t="交给平台打一个样" p="平台按你的纸样缝出实物并检查，通过后这套纸样才能发起材料包。" />
        {who}
        <Card className="gap-0 py-1">{[['提交纸样', '纸样和缝制说明一起提交', true], ['平台打样', '约 5 天 · ¥88（示例价格）', P.platSent], ['回传照片与检查报告', '对缝、填充、坐稳、外观 4 项', P.platBack], ['验证通过', '获得打样验证标记', P.platBack]].map(([a, b, ok], i) => (
          <div key={a as string} className="flex items-center gap-3 border-b py-2.5 last:border-0">
            <span className={cn('grid size-6 place-items-center rounded-full font-mono text-[11px]', ok ? 'bg-emerald-700 text-white' : 'bg-muted')}>{ok ? <Check className="size-3.5" /> : i + 1}</span>
            <span className="flex-1"><b className="text-[14px] font-medium">{a as string}</b><div className="text-xs text-muted-foreground">{b as string}</div></span></div>))}</Card>
        {P.platSent && !P.platBack && <Button variant="outline" className="rounded-full" onClick={() => setP({ platBack: true, photo: app.snapRef.current?.() || null, checks: [true, true, true] })}>演示：模拟样品回传</Button>}
        {P.platBack && <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900"><Check className="size-4" />打样通过，可以发起材料包了</div>}
      </> }
    }
    return { label: P.community || P.cases ? '保存并分享' : '保存到我的作品', disabled: !P.photo, onNext: save, body: <>
      <H t="缝好了？登记一下" p="记下这只是怎么做出来的。分享出去，下一个人就能照着你的做。" />
      {who}
      <Card>
        <b className="text-[14px]">成品照片</b>
        <label className="relative flex h-36 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-[1.5px] border-dashed bg-muted/40 text-xs text-muted-foreground">
          {P.photo ? <img src={P.photo} alt="成品照片" className="absolute inset-0 size-full object-contain" /> : <><ImagePlus className="size-5" /><b className="text-[13px] text-foreground">上传成品照片</b>正面、侧面各一张最好</>}
          <input type="file" accept="image/*" className="sr-only" onChange={e => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => setP({ photo: String(r.result) }); r.readAsDataURL(file) }} />
        </label>
        {!P.photo && <button className="self-start text-[13px] text-primary underline underline-offset-4" onClick={() => setP({ photo: app.snapRef.current?.() || null })}>还没拍？先用 3D 截图占位</button>}
      </Card>
      <Card>
        <Line l="做了多久"><Pick label="做了多久" value={P.time} onChange={v => setP({ time: v })} opts={TIMES.map(t => [t[0], t[1]])} /></Line>
        <Line l="难度感受"><Pick label="难度感受" value={P.feel} onChange={v => setP({ feel: v })} opts={[['easy', '比想的简单'], ['ok', '刚好'], ['hard', '有点难']]} /></Line>
        <Textarea value={P.note} onChange={e => setP({ note: e.target.value })} placeholder="踩过的坑、改过的地方，比如：背刺先疏缝再合后中缝" className="min-h-20 rounded-xl text-[14px]" />
      </Card>
      <Card><b className="text-[14px]">自查 <span className="font-normal text-muted-foreground">· 选填，会显示在作品页</span></b>{['对缝都对上了', '填充后形状对', '能自己坐稳'].map((n, i) => <Line key={n} l={n}><Switch checked={P.checks[i]} onCheckedChange={v => setP({ checks: P.checks.map((c, j) => j === i ? v : c) })} aria-label={n} /></Line>)}</Card>
      <Card>
        <Line l="分享到社区" s="关注你的人和同款模板页能看到"><Switch checked={P.community} onCheckedChange={v => setP({ community: v })} aria-label="分享到社区" /></Line>
        <Line l="投稿到案例库" s="审核通过后出现在首页「照着案例做一只」"><Switch checked={P.cases} onCheckedChange={v => setP({ cases: v })} aria-label="投稿到案例库" /></Line>
      </Card>
      {!creator && <button onClick={() => app.go({ name: app.user ? 'me' : 'apply' })} className="flex items-center gap-3 rounded-[20px] border border-dashed px-3.5 py-3 text-left">
        <Lock className="size-4 text-muted-foreground" /><span className="flex-1 text-[13px]"><b>想让平台打样、发起材料包？</b><span className="block text-muted-foreground">这是创作者功能，需要先申请</span></span><ChevronRight className="size-4 text-muted-foreground" /></button>}
    </> }
  }

  function launchStage() {
    const L = f.launch, cost = 96, fee = Math.round(L.price * 0.1), share = L.price - cost - fee
    const setL = (p: Partial<F['launch']>) => set(x => ({ ...x, launch: { ...x.launch, ...p } }))
    return { label: '提交材料包审核', onNext: () => { set(x => ({ ...x, launched: true })); app.go({ name: 'done' }) }, body: <>
      <H t="发起材料包" p="达标后平台统一裁切、配布、质检、发货。" />
      <Card><SliderRow l="起做份数" min={20} max={200} v={L.qty} u=" 份" on={v => setL({ qty: v })} /><Line l="预订期" s="到期没达标自动全额退款"><Pick label="预订期" value={L.days} onChange={v => setL({ days: v })} opts={[['7', '7 天'], ['14', '14 天'], ['21', '21 天']]} /></Line><SliderRow l="售价" min={98} max={298} v={L.price} u=" 元" on={v => setL({ price: v })} /></Card>
      <Card><b className="text-[14px]">每份的钱去哪了 <span className="font-normal text-muted-foreground">· 示例成本</span></b>
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"><i style={{ flex: cost }} className="bg-stone-300" /><i style={{ flex: fee }} className="bg-stone-500" /><i style={{ flex: Math.max(share, 1) }} className="bg-primary" /></div>
        <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">布料、裁切、质检、发货</span><span className="font-mono">¥{cost}</span></div>
        <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">平台服务 10%</span><span className="font-mono">¥{fee}</span></div>
        <div className="flex justify-between text-[13px]"><b>你的分成</b><b className="font-mono text-primary">¥{share}</b></div></Card>
    </> }
  }
}

const TIMES: [string, string][] = [['w1', '一个周末'], ['w2', '两个周末'], ['wk', '一周以上']]

function SliderRow({ l, min, max, v, u, on }: { l: string; min: number; max: number; v: number; u: string; on?: (v: number) => void }) {
  const [val, setVal] = useState(v)
  return <div className="flex flex-col gap-2 py-1.5"><div className="flex justify-between text-[13.5px]"><span>{l}</span><span className="font-mono text-xs text-primary">{on ? v : val}{u}</span></div>
    <Slider value={[on ? v : val]} min={min} max={max} step={1} onValueChange={x => (on ? on(x[0]) : setVal(x[0]))} aria-label={l} /></div>
}

function ViewSketch({ v }: { v: number }) {
  const d = ['M100 26 C130 26 150 50 150 76 C150 100 128 118 100 118 C72 118 50 100 50 76 C50 50 70 26 100 26 Z M58 108 C40 150 38 200 60 228 C80 246 120 246 140 228 C162 200 160 150 142 108',
    'M112 32 C140 18 190 28 202 58 C208 80 192 96 162 96 C150 100 132 104 120 100 M104 70 C74 108 62 168 72 208 C82 240 140 246 160 222 C176 200 172 140 152 104 M74 200 C52 210 32 226 14 240 C32 246 62 236 82 226',
    'M100 26 C130 26 150 50 150 76 C150 100 128 118 100 118 C72 118 50 100 50 76 C50 50 70 26 100 26 Z M58 108 C40 150 38 200 60 228 C80 246 120 246 140 228 C162 200 160 150 142 108 M92 226 C88 240 96 252 110 254'][v]
  return <svg viewBox={v === 1 ? '0 0 240 260' : '0 0 200 260'} className="size-full" aria-hidden><path d={d} fill="none" stroke="#8A8479" strokeWidth="2.2" /></svg>
}

export function optPieces(f: F) { return f.tech === 'match' ? 13 : f.tech === 'gusset' ? 15 : 13 + (f.opt.claw === '3d' ? 4 : 0) + (f.opt.teeth === 'felt' ? 1 : 0) }
