import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Clock, Heart, Lock, Package, Settings, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DEMO_KEYS, useApp, type Role } from '@/store'
import { CaseArt } from '@/components/Art'
import { cn } from '@/lib/utils'

export const ROLE_N: Record<Role, string> = { fan: '兴趣用户', pending: '创作者审核中', creator: '创作者' }
const PERKS: [string, string][] = [['平台打样', '平台按你的纸样缝样品并出检查报告'], ['发起材料包', '达标后平台裁切、配布、发货，你拿分成'], ['出售纸样 PDF', '打样验证过的纸样可以定价出售'], ['接成品定制', '主页开放一对一定制名额']]

function Top({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-3 py-3 backdrop-blur">
      <Button variant="outline" size="icon" className="size-9 rounded-full" aria-label="返回" onClick={onBack}><ChevronLeft className="size-4" /></Button>
      <b className="flex-1 text-[15px]">{title}</b>
    </header>
  )
}

export function Me() {
  const app = useApp()
  return (
    <div className="flex flex-col pb-10">
      <Top title="我的" onBack={app.back} />
      <div className="flex flex-col gap-3 px-4 pt-4">
        {app.user ? (
          <section className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-full bg-[#2B2A33] font-display text-[22px] font-black text-[#F3EFE8]">{app.user[0]}</span>
            <div className="flex-1"><b className="block text-[18px]">{app.user}</b><Badge variant={app.role === 'creator' ? 'default' : 'secondary'} className="rounded-full">{ROLE_N[app.role]}</Badge></div>
            <Button variant="ghost" size="icon" aria-label="设置"><Settings className="size-5" /></Button>
          </section>
        ) : (
          <section className="flex flex-col gap-2 rounded-[20px] border bg-card p-4">
            <b className="text-[16px]">还没登录</b>
            <p className="text-[13px] text-muted-foreground">浏览模板和案例不需要登录。开版、保存、登记作品时再注册就行。</p>
            <Button className="h-11 rounded-full" onClick={() => app.gate('登录后，作品和订单会存在这里', () => toast.success('登录成功'))}>登录 / 注册</Button>
          </section>
        )}

        {app.user && <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border bg-card text-center">
          {[['作品', app.works.length], ['收藏', 6], ['订单', 1]].map(([a, b]) => <div key={a} className="border-r py-2.5 last:border-0"><dd className="font-mono text-[17px]">{b}</dd><dt className="text-[11.5px] text-muted-foreground">{a}</dt></div>)}
        </dl>}

        {app.user && <CreatorCard />}

        {app.user && <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between"><h2 className="text-[16px] font-bold">我的作品</h2><span className="text-xs text-muted-foreground">自己缝好登记的</span></div>
          {app.works.length ? app.works.map(w => (
            <div key={w.id} className="flex gap-3 rounded-[18px] border bg-card p-2.5">
              <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-[#2B2A33]">{w.photo ? <img src={w.photo} alt={w.title} className="size-full object-contain" /> : <CaseArt kind={w.kind} color={null} />}</div>
              <div className="min-w-0 flex-1 text-[13px]"><b className="text-[14.5px]">{w.title}</b><div className="text-muted-foreground">{w.time}{w.note && ' · ' + w.note}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">{w.community && <Badge variant="secondary" className="rounded-full">已分享到社区</Badge>}{w.cases && <Badge variant="outline" className="rounded-full"><Clock className="mr-1 size-3" />案例库审核中</Badge>}</div></div>
            </div>
          )) : <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed px-6 py-6 text-center">
            <p className="text-[13px] text-muted-foreground">缝好一只后，在开版最后一步登记，作品会出现在这里。</p>
            <Button variant="outline" className="rounded-full" onClick={() => app.go({ name: 'library' })}>挑个模板开始</Button>
          </div>}
        </section>}

        {app.user && <nav className="flex flex-col rounded-[20px] border bg-card px-3.5 py-1">
          {([[Package, '材料包订单', '1 份待开裁'], [Heart, '收藏的模板', '6'], [Settings, '账户与安全', '']] as const).map(([I, a, b]) => (
            <button key={a} className="flex h-12 items-center gap-3 border-b text-left text-[14px] last:border-0" onClick={() => toast('原型未展开这一页')}><I className="size-4 text-muted-foreground" /><span className="flex-1">{a}</span><span className="text-xs text-muted-foreground">{b}</span><ChevronRight className="size-4 text-muted-foreground" /></button>))}
        </nav>}

        <DemoPanel />
        {app.user && <Button variant="ghost" className="rounded-full text-muted-foreground" onClick={() => { app.setIdentity('guest'); toast('已退出登录') }}>退出登录</Button>}
      </div>
    </div>
  )
}

function CreatorCard() {
  const app = useApp()
  if (app.role === 'creator') return (
    <button onClick={() => app.go({ name: 'creator' })} className="flex flex-col gap-3 rounded-[20px] bg-[#2B2A33] p-4 text-left text-[#F3EFE8]">
      <div className="flex items-center gap-2"><b className="font-display text-[18px] font-black">创作者中心</b><span className="flex-1" /><ChevronRight className="size-4 opacity-70" /></div>
      <dl className="grid grid-cols-3 gap-2 text-[11.5px]">{[['本月销售额', '¥9.8k'], ['进行中材料包', '1'], ['待回复私信', '2']].map(([a, b]) => <div key={a}><dd className="font-mono text-[17px]">{b}</dd><dt className="opacity-60">{a}</dt></div>)}</dl>
    </button>
  )
  if (app.role === 'pending') return (
    <section className="flex flex-col gap-3 rounded-[20px] border bg-card p-4">
      <div className="flex items-center gap-2"><Clock className="size-4 text-primary" /><b className="text-[15px]">创作者申请审核中</b></div>
      <ol className="flex flex-col gap-1.5 text-[13px]">{[['提交申请', true], ['平台审核作品与方向 · 1–3 个工作日', false], ['开通创作者中心', false]].map(([a, ok], i) => <li key={i} className="flex items-center gap-2"><span className={cn('grid size-5 place-items-center rounded-full font-mono text-[10px]', ok ? 'bg-emerald-700 text-white' : 'bg-muted')}>{ok ? <Check className="size-3" /> : i + 1}</span>{a as string}</li>)}</ol>
      <Button variant="outline" className="rounded-full" onClick={() => { app.setIdentity('creator'); toast.success('审核通过，创作者中心已开通') }}>演示：模拟审核通过</Button>
    </section>
  )
  return (
    <section className="flex flex-col gap-3 rounded-[20px] border bg-card p-4">
      <div className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /><b className="text-[15px]">成为创作者</b></div>
      <ul className="grid grid-cols-2 gap-2">{PERKS.map(([a, b]) => <li key={a} className="rounded-xl bg-muted/60 p-2.5"><b className="text-[13px]">{a}</b><p className="text-[11.5px] leading-snug text-muted-foreground">{b}</p></li>)}</ul>
      <Button className="h-11 rounded-full" onClick={() => app.go({ name: 'apply' })}>申请成为创作者</Button>
    </section>
  )
}

/** Demo-only controls: identity and failure states, so the walkthrough can be recorded per role. */
export function DemoPanel({ open: initial = false }: { open?: boolean }) {
  const app = useApp()
  const [open, setOpen] = useState(initial)
  const id = app.user ? app.role : 'guest'
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-[20px] border border-dashed bg-muted/40 p-3">
      <CollapsibleTrigger className="flex w-full items-center gap-2 text-left"><b className="flex-1 text-[13px]">演示控制</b><span className="text-xs text-muted-foreground">{open ? '收起' : '身份与异常状态'}</span></CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1 pt-3">
        <span className="text-[12px] text-muted-foreground">切换身份</span>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-card p-1">{(['guest', 'fan', 'pending', 'creator'] as const).map(k => (
          <button key={k} onClick={() => app.setIdentity(k)} className={cn('h-8 rounded-lg text-[12px]', id === k ? 'bg-foreground text-background' : '')}>{k === 'guest' ? '访客' : k === 'fan' ? '兴趣' : k === 'pending' ? '审核中' : '创作者'}</button>))}</div>
        {DEMO_KEYS.map(([k, n, d]) => (
          <label key={k} className="flex items-center gap-3 border-t py-2">
            <div className="flex-1"><div className="text-[13.5px]">{n}</div><div className="text-[11.5px] text-muted-foreground">{d}</div></div>
            <Switch checked={app.demo[k]} onCheckedChange={v => app.setDemo(k, v)} />
          </label>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

const DIRS = ['动物', '神奇动物', '人偶', '娃衣', '配件']
const WAYS = ['发起材料包', '出售纸样 PDF', '接成品定制']

export function Apply() {
  const app = useApp()
  const [dirs, setDirs] = useState<string[]>(['神奇动物'])
  const [ways, setWays] = useState<string[]>(['发起材料包'])
  const [link, setLink] = useState('')
  const [agree, setAgree] = useState(false)
  const hasWork = app.works.length > 0
  const ok = dirs.length > 0 && ways.length > 0 && agree && (hasWork || link.trim().length > 3)
  const tog = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  return (
    <div className="flex flex-col pb-32">
      <Top title="申请成为创作者" onBack={app.back} />
      <div className="flex flex-col gap-3 px-4 pt-4">
        <h1 className="font-display text-[24px] font-black leading-tight">把你的纸样，<br />变成别人能买的材料包。</h1>
        <p className="text-[13px] text-muted-foreground">兴趣模式下的开版、导出、登记都不受影响。创作者多出来的是打样、上架和分成。</p>

        <section className="flex flex-col gap-2 rounded-[20px] border bg-card p-3.5">
          <b className="text-[14px]">申请条件</b>
          <div className="flex items-center gap-2 text-[13px]">{hasWork ? <Check className="size-4 text-emerald-700" /> : <X className="size-4 text-muted-foreground" />}<span className="flex-1">至少登记过 1 件自己缝的作品</span>{!hasWork && <button className="text-primary" onClick={() => app.go({ name: 'library' })}>去做一只</button>}</div>
          <div className="flex items-center gap-2 text-[13px]"><Lock className="size-4 text-muted-foreground" /><span className="flex-1">没有登记作品，也可以附作品集链接</span></div>
          <Input value={link} onChange={e => setLink(e.target.value)} placeholder="小红书、微博或个人网站链接" className="h-10 rounded-xl" />
        </section>

        <section className="flex flex-col gap-2 rounded-[20px] border bg-card p-3.5">
          <b className="text-[14px]">擅长方向</b>
          <div className="flex flex-wrap gap-1.5">{DIRS.map(d => <button key={d} aria-pressed={dirs.includes(d)} onClick={() => tog(dirs, setDirs, d)} className={cn('h-8 rounded-full border px-3 text-[13px]', dirs.includes(d) ? 'border-foreground bg-foreground text-background' : 'bg-card')}>{d}</button>)}</div>
          <b className="mt-2 text-[14px]">想怎么合作</b>
          <div className="flex flex-wrap gap-1.5">{WAYS.map(d => <button key={d} aria-pressed={ways.includes(d)} onClick={() => tog(ways, setWays, d)} className={cn('h-8 rounded-full border px-3 text-[13px]', ways.includes(d) ? 'border-foreground bg-foreground text-background' : 'bg-card')}>{d}</button>)}</div>
        </section>

        <label className="flex items-start gap-2.5 px-1 text-[13px]"><Checkbox checked={agree} onCheckedChange={v => setAgree(!!v)} className="mt-0.5" /><span>同意《创作者协议》：原创声明、材料包品控标准、分成与结算规则（示例）</span></label>
      </div>
      <div className="phone-bottom inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background via-background to-transparent px-4 pb-5 pt-6">
        <Button className="h-12 w-full rounded-full text-[15px]" disabled={!ok} onClick={() => app.gate('登录后申请成为创作者', () => { app.setIdentity('pending'); app.go({ name: 'me' }); toast.success('申请已提交', { description: '1–3 个工作日内通知你结果' }) })}>{ok ? '提交申请' : '补全上面的信息后提交'}</Button>
      </div>
    </div>
  )
}
