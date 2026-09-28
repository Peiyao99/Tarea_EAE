import { useState } from 'react'
import { Check, ChevronLeft, Search, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { PARTS, PIECE_PART, SEW_STEPS, TEMPLATES, piecesFor, tplOf, type Kind, type Part } from '@/data'
import { useApp } from '@/store'
import { CaseArt } from '@/components/Art'
import { PartThumb } from '@/components/PatternView'
import { Workspace } from '@/components/Workspace'
import { cn } from '@/lib/utils'

const TAGS = ['全部', '免费', '入门', '坐姿', '站姿', '神奇动物']

export function Library() {
  const app = useApp()
  const [tab, setTab] = useState<'tpl' | 'parts'>('tpl')
  const [tag, setTag] = useState('全部')
  const [q, setQ] = useState('')
  const [part, setPart] = useState<typeof PARTS[number] | null>(null)
  const tpls = TEMPLATES.filter(t => (tag === '全部' || (tag === '免费' ? t.tier === '免费' : t.tags.includes(tag) || t.level === tag)) && (!q || (t.n + t.tags.join('')).includes(q)))
  const parts = PARTS.filter(p => !q || (p.n + p.cat).includes(q))
  return (
    <div className="flex flex-col pb-28">
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-background/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-2"><h1 className="font-display text-[22px] font-black">模板库</h1><span className="text-xs text-muted-foreground">都打过样才上架</span></div>
        <label className="flex h-10 items-center gap-2 rounded-full border bg-card px-3.5"><Search className="size-4 text-muted-foreground" /><Input value={q} onChange={e => setQ(e.target.value)} placeholder={tab === 'tpl' ? '搜动物、姿态' : '搜耳朵、尾巴、背刺'} className="h-9 border-0 px-0 shadow-none focus-visible:ring-0" /></label>
        <Tabs value={tab} onValueChange={v => setTab(v as 'tpl' | 'parts')}>
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-full p-1"><TabsTrigger value="tpl" className="rounded-full">模板 · 教程</TabsTrigger><TabsTrigger value="parts" className="rounded-full">部件库</TabsTrigger></TabsList>
        </Tabs>
        {tab === 'tpl' && <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">{TAGS.map(t => <button key={t} onClick={() => setTag(t)} className={cn('h-8 shrink-0 rounded-full border px-3 text-[13px]', tag === t ? 'border-foreground bg-foreground text-background' : 'bg-card')}>{t}</button>)}</div>}
      </header>
      <div className="flex flex-col gap-3 px-4 pt-4">
        {tab === 'tpl' ? (tpls.length ? <div className="grid grid-cols-2 gap-2.5">{tpls.map(t => (
          <button key={t.k} className="overflow-hidden rounded-[18px] border bg-card text-left" onClick={() => app.go({ name: 'tpl', tpl: t.k })}>
            <div className="relative h-[130px] bg-[#EFE8DC]"><CaseArt kind={t.k} color={null} light /><Badge className="absolute left-2 top-2 rounded-full" variant={t.tier === '免费' ? 'default' : 'secondary'}>{t.tier}</Badge></div>
            <div className="p-2.5"><b className="text-[14px]">{t.n}</b><div className="text-xs text-muted-foreground">{t.pieces} 片 · {t.level} · {t.by}</div></div>
          </button>))}</div> : <Empty q={q} />)
          : <>
            <p className="rounded-xl border border-dashed bg-muted/50 px-3 py-2 text-[12.5px] leading-relaxed text-foreground/80">部件是打样验证过的单片纸样。开版时点选部位就能替换，AI 拆件也会优先用它们。</p>
            {[...new Set(parts.map(p => p.cat))].map(c => (
              <section key={c} className="flex flex-col gap-2">
                <h2 className="text-[15px] font-bold">{c}</h2>
                <div className="grid grid-cols-2 gap-2.5">{parts.filter(p => p.cat === c).map(p => (
                  <button key={p.k} onClick={() => setPart(p)} className="overflow-hidden rounded-[18px] border bg-card text-left">
                    <div className="h-[110px] bg-[#FDFCFA] p-3"><PartThumb d={p.d} /></div>
                    <div className="p-2.5"><b className="text-[14px]">{p.n}</b><div className="text-xs text-muted-foreground">用于 {p.uses} 个模板 · 打样 {p.rounds} 轮</div></div>
                  </button>))}</div>
              </section>))}
            {!parts.length && <Empty q={q} />}
          </>}
      </div>
      <Drawer open={!!part} onOpenChange={o => !o && setPart(null)}>
        <DrawerContent>
          {part && <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-6">
            <DrawerHeader className="px-0"><DrawerTitle>{part.n}</DrawerTitle><DrawerDescription>{part.cat} · 用于 {part.uses} 个模板 · 打样 {part.rounds} 轮</DrawerDescription></DrawerHeader>
            <div className="h-44 rounded-2xl border bg-[#FDFCFA] p-4"><PartThumb d={part.d} /></div>
            <p className="rounded-xl bg-muted px-3 py-2 text-[13px]">在开版流程里点选这个部位，再点「替换部件」就能换上它。</p>
            <Button variant="outline" className="h-11 rounded-full" onClick={() => setPart(null)}>知道了</Button>
          </div>}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function Empty({ q }: { q: string }) {
  const app = useApp()
  return <div className="flex flex-col items-center gap-2 rounded-[20px] border bg-card px-6 py-8 text-center">
    <Search className="size-10 text-muted-foreground/50" /><b>没找到「{q}」</b>
    <p className="text-[13px] text-muted-foreground">试试「恐龙」「坐姿」，或者直接从想法开始。</p>
    <Button variant="outline" className="rounded-full" onClick={() => app.go({ name: 'home' })}>从想法开始</Button>
  </div>
}

export function TemplateDetail({ k }: { k: Kind }) {
  const app = useApp()
  const t = tplOf(k), steps = SEW_STEPS[k], pieces = piecesFor(k)
  const [step, setStep] = useState<number | null>(null)
  const [hi, setHi] = useState<{ parts: Part[]; pieces: string[] }>({ parts: [], pieces: [] })
  const pickStep = (i: number) => { setStep(i); const s = steps[i][1]; setHi({ pieces: s, parts: [...new Set(s.map(p => PIECE_PART[p]))] }) }
  return (
    <div className="flex flex-col gap-3 pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-3 py-3 backdrop-blur">
        <Button variant="outline" size="icon" className="size-9 rounded-full" aria-label="返回" onClick={app.back}><ChevronLeft className="size-4" /></Button>
        <div className="min-w-0 flex-1"><b className="block text-[15px]">{t.n}</b><span className="text-xs text-muted-foreground">{t.by} · 打样 {t.rounds} 轮</span></div>
        <Badge variant={t.tier === '免费' ? 'default' : 'secondary'} className="rounded-full">{t.tier}</Badge>
      </header>
      <div className="px-3"><Workspace viewer={{ kind: k, showSeams: true }} pieces={pieces} hiParts={hi.parts} hiPieces={hi.pieces} guide
        onSelect={(p, part) => { setStep(null); setHi({ parts: [part], pieces: p ? [p] : [] }) }} hint="点下面一步，看要缝哪几片" /></div>
      <div className="flex flex-col gap-3 px-4">
        <dl className="grid grid-cols-4 overflow-hidden rounded-2xl border bg-card text-center">
          {[['裁片', t.pieces + ' 片'], ['难度', t.level], ['成品', t.h], ['打样', t.rounds + ' 轮']].map(([a, b]) => <div key={a} className="border-r py-2.5 last:border-0"><dt className="text-[11px] text-muted-foreground">{a}</dt><dd className="font-mono text-[13px]">{b}</dd></div>)}
        </dl>
        <section className="flex flex-col gap-2 rounded-[20px] border bg-card p-3.5">
          <div className="flex items-baseline justify-between"><h2 className="text-[16px] font-bold">跟着缝</h2><span className="text-xs text-muted-foreground">{steps.length} 步</span></div>
          <ol className="flex flex-col gap-1.5">{steps.map((s, i) => (
            <li key={i}><button onClick={() => pickStep(i)} className={cn('flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[13.5px]', step === i ? 'border-foreground ring-1 ring-foreground' : 'bg-card')}>
              <span className="font-mono text-xs text-primary">0{i + 1}</span><span className="flex-1">{s[0]}</span><span className="font-mono text-[11px] text-muted-foreground">{s[1].join(' ')}</span>
            </button></li>))}</ol>
        </section>
        <section className="flex flex-col gap-1.5 rounded-[20px] border bg-card p-3.5 text-[13.5px]">
          <h2 className="text-[16px] font-bold">适合谁</h2><p className="text-foreground/80">{t.fit}</p>
          <div className="mt-1 flex items-center gap-2"><Check className="size-4 text-emerald-700" />个人练习、送人</div>
          <div className="flex items-center gap-2"><Check className="size-4 text-emerald-700" />{t.tier === '免费' ? '卖成品，需标注模板作者' : '卖成品，需订阅'}</div>
          <div className="flex items-center gap-2"><TriangleAlert className="size-4 text-amber-700" />发起材料包：改动后要重新打样</div>
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[430px] bg-gradient-to-t from-background via-background to-transparent px-4 pb-5 pt-6 phone-bottom">
        <Button className="h-12 w-full rounded-full text-[15px]" onClick={() => app.gate('登录后，改过的纸样会存进你的工作台', () => app.startFlow('tpl', { kind: k }))}>用这个模板开版</Button>
      </div>
    </div>
  )
}
