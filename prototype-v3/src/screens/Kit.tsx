import { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { KITS, SEW_STEPS, TEMPLATES, fabricOf, kitOf, piecesFor } from '@/data'
import { useApp } from '@/store'
import { Viewer } from '@/three/Viewer'
import { PatternView } from '@/components/PatternView'
import { CaseArt } from '@/components/Art'
import { AvatarButton } from '@/components/Avatar'
import { cn } from '@/lib/utils'

const hexNum = (h: string) => parseInt(h.slice(1), 16)
const FILTERS = ['全部', '预订中', '现货', '入门']

export function KitList() {
  const [f, setF] = useState('全部')
  const list = KITS.filter(k => f === '全部' || k.status === f || k.level === f)
  return (
    <div className="flex flex-col gap-3 pb-28">
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-background/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-2"><h1 className="font-display text-[22px] font-black">材料包</h1><span className="flex-1 text-xs text-muted-foreground">打样验证过的纸样 + 现货面料</span><AvatarButton /></div>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">{FILTERS.map(t => <button key={t} onClick={() => setF(t)} className={cn('h-8 shrink-0 rounded-full border px-3 text-[13px]', f === t ? 'border-foreground bg-foreground text-background' : 'bg-card')}>{t}</button>)}</div>
      </header>
      <div className="grid grid-cols-2 gap-2.5 px-4">
        {list.map(k => <KitCard key={k.id} id={k.id} />)}
      </div>
    </div>
  )
}

function KitCard({ id, wide }: { id: string; wide?: boolean }) {
  const app = useApp(), k = kitOf(id)
  return (
    <button onClick={() => app.go({ name: 'kitDetail', id })} className={cn('overflow-hidden rounded-[18px] border bg-card text-left', wide && 'w-[168px] shrink-0 snap-start')}>
      <div className="relative h-[130px] bg-[#2B2A33]"><CaseArt kind={k.k} color={hexNum(fabricOf(k.colors[0]).hex)} /><span className={cn('absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px]', k.status === '现货' ? 'bg-emerald-700 text-white' : 'bg-primary text-primary-foreground')}>{k.status}</span></div>
      <div className="p-2.5"><b className="text-[14px]">{k.n}</b><div className="text-xs text-muted-foreground">{k.by}</div>
        <div className="mt-1 flex items-baseline justify-between"><b className="font-mono text-[14px]">¥{k.price}</b>{k.status === '预订中' && <span className="font-mono text-[11px] text-muted-foreground">{k.count}/{k.target}</span>}</div></div>
    </button>
  )
}

type G = 'main' | 'pieces' | 'fabric' | 'order'
const G_N: Record<G, string> = { main: '成品', pieces: '裁片', fabric: '布料', order: '缝制卡' }

/** v2 kit layout on the new stack, with a recommendation section at the end. */
export function KitDetail({ id }: { id?: string }) {
  const app = useApp(), k = kitOf(id)
  const [g, setG] = useState<G>('main')
  const [color, setColor] = useState(k.colors[0])
  const [form, setForm] = useState<'kit' | 'pdf' | 'custom'>('kit')
  const [eye, setEye] = useState('刺绣眼')
  const [count, setCount] = useState(k.count)
  const [qty, setQty] = useState(1)
  const [sheet, setSheet] = useState<'off' | 'confirm' | 'done'>('off')
  const [reserved, setReserved] = useState(0)
  useEffect(() => { setColor(k.colors[0]); setG('main'); setForm('kit'); setCount(k.count); setReserved(0) }, [k.id])
  const fab = fabricOf(color), pieces = piecesFor(k.k), steps = SEW_STEPS[k.k], tpl = TEMPLATES.find(t => t.k === k.k)!
  const forms = ([['kit', '材料包', k.price], ['pdf', '纸样 PDF', k.pdf], ['custom', '成品定制', k.custom]] as const).filter(x => x[2])
  const price = form === 'kit' ? k.price : form === 'pdf' ? k.pdf : k.custom!
  const note = form === 'kit' ? '含裁片、布料、配件、缝制卡' : form === 'pdf' ? '可打印纸样 · 立即下载' : '创作者一对一缝制 · 剩 3 个名额'
  const cta = form === 'kit' ? (reserved ? `已预订 ${reserved} 份 · 查看订单` : k.status === '现货' ? '加入购物袋' : '预订材料包') : form === 'pdf' ? '购买纸样 PDF' : '申请成品定制'
  const buy = () => {
    if (form !== 'kit') return app.gate('登录后购买', () => toast.success(form === 'pdf' ? '纸样 PDF 已加入购物袋' : `已向 ${k.by} 发送定制申请`))
    if (reserved) return toast(`已预订 ${reserved} 份 · 达标后通知你`)
    app.gate('登录后预订材料包', () => { setQty(1); setSheet('confirm') })
  }
  const confirm = () => {
    setSheet('done'); setReserved(qty)
    let n = count; const target = count + qty
    const tick = () => { if (n < target) { n++; setCount(n); setTimeout(tick, 140) } }; setTimeout(tick, 350)
  }
  const recs = KITS.filter(x => x.id !== k.id)

  return (
    <div className="flex flex-col pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-3 py-3 backdrop-blur">
        <Button variant="outline" size="icon" className="size-9 rounded-full" aria-label="返回" onClick={app.back}><ChevronLeft className="size-4" /></Button>
        <div className="min-w-0 flex-1"><b className="block text-[15px]">材料包</b><span className="text-xs text-muted-foreground">{k.sub} / {k.n}</span></div>
        <Button variant="outline" size="icon" className="size-9 rounded-full" aria-label="购物袋" onClick={() => toast('购物袋未展开')}><ShoppingBag className="size-4" /></Button>
      </header>
      <div className="flex flex-col gap-3.5 px-4 pt-3.5">
        <div className="relative h-[300px] overflow-hidden rounded-[22px] bg-[#2B2A33]">
          {g === 'main' && <Viewer kind={k.k} color={fab.hex} showSeams className="absolute inset-0" />}
          {g === 'pieces' && <div className="absolute inset-3 overflow-hidden rounded-xl bg-[#FDFCFA]"><PatternView pieces={pieces} selected={new Set()} onPick={() => {}} /></div>}
          {g === 'fabric' && <div className="absolute inset-0 flex items-end justify-center gap-4 pb-12">{[[fab, '主体', 150], [fabricOf(k.colors[1] || 'ink'), '腹片', 118], [fabricOf('oat'), '背刺 / 耳内', 88]].map(([f, n, h]) => { const F = f as ReturnType<typeof fabricOf>; return <div key={n as string} className="flex flex-col items-center gap-2"><span className="w-[62px] rounded-lg" style={{ height: h as number, background: F.hex }} /><small className="text-[11px] text-[#D8CDBF]">{n as string} · {F.n.split(' ')[0]}</small></div> })}</div>}
          {g === 'order' && <ol className="absolute inset-0 flex flex-col justify-center gap-1.5 px-6">{steps.map((s, i) => <li key={i} className="flex gap-3 border-b border-[#45434F] py-1.5 text-[13px] text-[#F3EFE8]"><span className="font-mono text-[#F3A27A]">0{i + 1}</span>{s[0]}</li>)}</ol>}
          <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-[#F3EFE8]">{g === 'main' ? '3D 成品示意 · 实拍图待补' : g === 'pieces' ? `裁片平铺 · ${Object.keys(pieces).length} 种` : g === 'fabric' ? '布料小样' : '缝制顺序卡'}</span>
          {g === 'main' && <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 backdrop-blur">
            <span className="text-[12px] text-[#F3EFE8]">布色 <b>{fab.n.split(' ')[0]}</b></span><span className="flex-1" />
            <div role="radiogroup" aria-label="布色" className="flex gap-1.5">{k.colors.map(c => { const F = fabricOf(c); return <button key={c} role="radio" aria-checked={color === c} aria-label={F.n} onClick={() => setColor(c)} className={cn('size-7 rounded-full border-2', color === c ? 'border-white' : 'border-transparent')} style={{ background: F.hex }} /> })}</div>
          </div>}
        </div>
        <div role="tablist" aria-label="图集" className="grid grid-cols-4 gap-2">
          {(Object.keys(G_N) as G[]).map(x => <button key={x} role="tab" aria-selected={g === x} onClick={() => setG(x)} className={cn('flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border bg-card text-[12px]', g === x && 'border-foreground ring-1 ring-foreground')}>
            {x === 'main' ? <span className="size-5 rounded-full" style={{ background: fab.hex }} /> : x === 'pieces' ? <span className="font-mono text-[11px]">{tpl.pieces}片</span> : x === 'fabric' ? <span className="flex gap-0.5">{k.colors.slice(0, 3).map(c => <i key={c} className="h-5 w-1.5 rounded-sm" style={{ background: fabricOf(c).hex }} />)}</span> : <span className="font-mono text-[10px] leading-tight text-muted-foreground">01<br />02</span>}{G_N[x]}</button>)}
        </div>

        <div className="flex flex-wrap gap-1.5"><Badge className="rounded-full bg-emerald-700 hover:bg-emerald-700">纸样已打样验证</Badge><Badge variant="secondary" className="rounded-full">打样 {k.rounds} 轮</Badge><Badge variant="secondary" className="rounded-full">难度 {k.level}</Badge></div>
        <h1 className="font-display text-[26px] font-black leading-[1.25]">{k.n}<br />开版直通材料包</h1>
        <button onClick={() => app.go({ name: 'profile' })} className="flex items-center gap-2.5 self-start rounded-full border bg-card py-1 pl-1 pr-3">
          <span className="grid size-7 place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">{k.by.replace('@', '')[0]}</span><span className="text-[14px]">{k.by} · 创作者</span><ChevronRight className="size-3.5 text-muted-foreground" />
        </button>
        <div className="flex items-baseline gap-2"><b className="font-mono text-[28px]">¥{price}</b><span className="text-[13px] text-muted-foreground">{note}</span></div>

        {k.status === '预订中' ? <section className="flex flex-col gap-2 rounded-[20px] border bg-card p-3.5" aria-label="开裁进度">
          <div className="flex justify-between text-[13.5px]"><span><b className="font-mono text-[16px]">{count}</b> / {k.target} 份达标后统一开裁</span><span className="text-muted-foreground">剩 {k.days} 天</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><i className="block h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: Math.min(100, count / k.target * 100) + '%' }} /></div>
          <span className="text-[12px] text-muted-foreground">未达标自动全额退款 · 达标后约 15 天发货</span>
        </section> : <section className="flex items-center gap-2 rounded-[20px] border bg-card p-3.5 text-[13.5px]"><Check className="size-4 text-emerald-700" />现货 · 48 小时内发货</section>}

        <div className="flex flex-col gap-2">
          <b className="text-[13px] text-muted-foreground">购买形式</b>
          <div role="radiogroup" aria-label="购买形式" className={cn('grid gap-2', forms.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
            {forms.map(([v, n, p]) => <button key={v} role="radio" aria-checked={form === v} onClick={() => setForm(v)} className={cn('flex flex-col items-center rounded-2xl border bg-card py-2.5', form === v && 'border-foreground ring-1 ring-foreground')}><b className="text-[14px]">{n}</b><small className="font-mono text-muted-foreground">¥{p}</small></button>)}
          </div>
        </div>
        {form === 'kit' && <label className="flex flex-col gap-2"><b className="text-[13px] text-muted-foreground">眼睛</b>
          <select value={eye} onChange={e => setEye(e.target.value)} className="h-11 rounded-xl border bg-card px-3 text-[14px]"><option value="刺绣眼">刺绣眼 · 适合低龄</option><option value="安全眼">安全眼 12 mm</option></select></label>}

        <section className="flex flex-col gap-3 rounded-[20px] border bg-card p-3.5" aria-label="交付流程">
          <h2 className="text-[14px] font-bold">交付流程</h2>
          <ol className="flex flex-col gap-2.5">{[['预订锁定份额', '支付后计入开裁进度'], ['达标后平台统一裁切、配布', '按验证后的纸样激光开裁'], ['平台质检裁片与配件', '对位点、缝份逐片核对'], ['平台发货 · 创作者分成', '销售与人气同时换算 token 奖励']].map(([a, b], i) => <li key={a} className="flex gap-3 text-[13.5px]"><span className="font-mono text-xs text-primary">0{i + 1}</span><span>{a}<small className="block text-[12px] text-muted-foreground">{b}</small></span></li>)}</ol>
        </section>

        <section className="flex flex-col gap-2.5" aria-label="其他推荐">
          <div className="flex items-baseline justify-between"><h2 className="font-display text-[19px] font-black">其他推荐</h2><button className="text-[13px] text-primary" onClick={() => app.go({ name: 'kit' })}>全部材料包</button></div>
          <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">{recs.map(r => <KitCard key={r.id} id={r.id} wide />)}</div>
          <button onClick={() => app.go({ name: 'tpl', tpl: k.k })} className="flex items-center gap-3 rounded-[18px] border bg-card p-2.5 text-left">
            <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-[#EFE8DC]"><CaseArt kind={k.k} color={null} light /></div>
            <span className="flex-1 text-[13px]"><b className="text-[14px]">想自己开版？</b><span className="block text-muted-foreground">同款{tpl.n}教程模板 · {tpl.tier}</span></span><ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </section>
      </div>

      <div className="phone-bottom inset-x-0 bottom-0 z-20 flex gap-2 bg-gradient-to-t from-background via-background to-transparent px-4 pb-5 pt-6">
        {k.custom && <Button variant="outline" className="h-12 rounded-full px-5" onClick={() => app.gate('登录后私信创作者', () => toast('私信页未展开'))}>私信定制</Button>}
        <Button className="h-12 flex-1 rounded-full text-[15px]" onClick={buy}>{cta}{!reserved && ` · ¥${price}`}</Button>
      </div>

      <Drawer open={sheet !== 'off'} onOpenChange={o => !o && setSheet('off')}>
        <DrawerContent>
          <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-6">
            {sheet === 'confirm' ? <>
              <DrawerHeader className="px-0 text-left"><DrawerTitle>确认预订</DrawerTitle><DrawerDescription>当前 {count} / {k.target} 份，{k.days} 天内未达标自动全额退款。</DrawerDescription></DrawerHeader>
              <dl className="flex flex-col rounded-2xl border bg-card px-3.5 text-[14px]">
                {[['商品', `${k.n} · 材料包`], ['布色', fab.n], ['眼睛', eye]].map(([a, b]) => <div key={a} className="flex justify-between border-b py-2.5"><dt className="text-muted-foreground">{a}</dt><dd>{b}</dd></div>)}
                <div className="flex items-center justify-between border-b py-2"><dt className="text-muted-foreground">数量</dt><dd className="flex items-center gap-3"><Button variant="outline" size="icon" className="size-8 rounded-full" aria-label="减少" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="size-3.5" /></Button><b className="w-4 text-center font-mono">{qty}</b><Button variant="outline" size="icon" className="size-8 rounded-full" aria-label="增加" onClick={() => setQty(q => Math.min(5, q + 1))}><Plus className="size-3.5" /></Button></dd></div>
                <div className="flex justify-between py-2.5"><dt className="text-muted-foreground">应付</dt><dd className="font-mono text-[18px] font-bold">¥{k.price * qty}</dd></div>
              </dl>
              <Button className="h-12 rounded-full text-[15px]" onClick={confirm}>确认预订</Button>
            </> : <>
              <span className="mx-auto mt-4 grid size-12 place-items-center rounded-full bg-emerald-700 text-white"><Check className="size-6" /></span>
              <DrawerHeader className="px-0"><DrawerTitle>已锁定 {reserved} 份</DrawerTitle><DrawerDescription>达标后平台统一开裁，发货前通知你。开裁进度 {count} / {k.target}</DrawerDescription></DrawerHeader>
              <Button className="h-12 rounded-full bg-[#1C1B19] hover:bg-[#1C1B19]/90" onClick={() => setSheet('off')}>好的</Button>
            </>}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
