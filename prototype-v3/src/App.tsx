import { useEffect, useState } from 'react'
import { Check, FolderOpen, Home as HomeIcon, LayoutGrid, Package, QrCode, Share2, Download, Smartphone, ArrowRight, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AppProvider, useApp } from '@/store'
import { CASES, MODES, STAGE_N, type Kind, type Mode, type StageKey } from '@/data'
import { Home } from '@/screens/Home'
import { Library, TemplateDetail } from '@/screens/Library'
import { Flow } from '@/screens/Flow'
import { KitDetail, KitList } from '@/screens/Kit'
import { Apply, DemoPanel, Me, ROLE_N } from '@/screens/Me'
import { CreatorPage } from '@/screens/Creator'
import { CaseArt } from '@/components/Art'
import { AvatarButton } from '@/components/Avatar'
import { cn } from '@/lib/utils'

export default function App() {
  return <AppProvider><Shell /></AppProvider>
}

const NAV = [
  { k: 'home', n: '首页', i: HomeIcon }, { k: 'library', n: '模板库', i: LayoutGrid },
  { k: 'projects', n: '工作台', i: FolderOpen }, { k: 'kit', n: '材料包', i: Package }
] as const
const TABS = ['home', 'library', 'projects', 'kit']

function Shell() {
  const app = useApp(), s = app.screen
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-12 lg:px-10">
      <aside className="hidden w-[330px] justify-self-end lg:block"><Journey /></aside>
      <div id="phone" className="phone relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-clip bg-background lg:h-[844px] lg:w-[390px] lg:rounded-[44px] lg:border-[10px] lg:border-[#1C1B19] lg:shadow-[0_40px_80px_-40px_rgba(40,30,20,.6)]">
        <main key={s.name + (s.tpl || '') + (s.id || '')} className={cn('min-h-0 flex-1 animate-in fade-in-0 duration-200', s.name === 'flow' ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain')}>
          {s.name === 'home' && <Home />}
          {s.name === 'library' && <Library />}
          {s.name === 'tpl' && s.tpl && <TemplateDetail k={s.tpl} />}
          {s.name === 'flow' && <Flow />}
          {s.name === 'projects' && <Projects />}
          {s.name === 'kit' && <KitList />}
          {s.name === 'kitDetail' && <KitDetail id={s.id} />}
          {s.name === 'done' && <Done />}
          {s.name === 'me' && <Me />}
          {s.name === 'apply' && <Apply />}
          {s.name === 'creator' && <CreatorPage self />}
          {s.name === 'profile' && <CreatorPage self={false} />}
        </main>
        {TABS.includes(s.name) && <BottomNav />}
        <AuthDialog />
        <ShareCard />
        <Toaster position="top-center" toastOptions={{ className: 'rounded-2xl' }} />
      </div>
      <aside className="hidden w-[300px] lg:block"><DemoPanel open /></aside>
    </div>
  )
}

/* ---------- user journey (desktop side panel) ---------- */
type Node = 'browse' | 'signup' | 'make' | 'export' | 'sew' | 'buy' | 'apply' | 'review' | 'cmake' | 'plat' | 'launch' | 'center'
const LANES: { role: string; sub: string; nodes: [Node, string, string][] }[] = [
  { role: '兴趣用户', sub: '默认身份 · 注册即是', nodes: [['browse', '看案例和模板', '不登录也能看'], ['signup', '用到功能时注册', '生成、开版、保存'], ['make', '开版', 'AI / 三视图 / 模型 / 模板'], ['export', '导出纸样', '打印拼贴'], ['sew', '自己缝 · 登记分享', '社区、案例库'], ['buy', '买材料包', '别人验证过的纸样']] },
  { role: '创作者', sub: '从「我的」申请 · 审核开通', nodes: [['apply', '申请', '作品或作品集'], ['review', '审核', '1–3 个工作日'], ['cmake', '开版', '同一套工具'], ['plat', '平台打样', '通过才可上架'], ['launch', '发起材料包', '定份数、售价、分成'], ['center', '创作者中心', '数据、私信、上新']] }
]

function useNode(): Node | null {
  const app = useApp(), s = app.screen, f = app.flow, creator = !!app.user && app.role === 'creator'
  if (app.authAsk) return 'signup'
  switch (s.name) {
    case 'home': case 'library': case 'tpl': case 'profile': return 'browse'
    case 'projects': return creator ? 'cmake' : 'make'
    case 'kit': case 'kitDetail': return 'buy'
    case 'apply': return 'apply'
    case 'creator': return 'center'
    case 'me': return !app.user ? 'signup' : app.role === 'pending' ? 'review' : app.role === 'creator' ? 'center' : null
    case 'done': return f.launched ? 'launch' : 'sew'
    case 'flow': {
      const k = f.stages[f.idx]
      if (k === 'launch') return 'launch'
      if (k === 'proof') return creator && f.proof.who === 'plat' ? 'plat' : 'sew'
      if (k === 'deliver') return 'export'
      return creator ? 'cmake' : 'make'
    }
  }
  return null
}

function Journey() {
  const app = useApp(), cur = useNode()
  const id = app.user ? ROLE_N[app.role] : '访客'
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs text-muted-foreground">PROTOTYPE · v3.1 · 用户历程</span>
        <h1 className="font-display text-[28px] font-black leading-tight">纸样工作台</h1>
        <p className="text-[13px] text-muted-foreground">当前身份 <b className="text-foreground">{id}</b>。高亮的是这一屏在历程里的位置。</p>
      </div>
      {LANES.map((l, li) => (
        <section key={l.role} className={cn('flex flex-col gap-1 rounded-[20px] border bg-card/80 p-3.5', li === 1 && app.role !== 'creator' && app.role !== 'pending' && 'opacity-80')}>
          <div className="flex items-baseline gap-2 pb-1"><b className="text-[15px]">{l.role}</b><span className="text-[11.5px] text-muted-foreground">{l.sub}</span></div>
          <ol className="flex flex-col">{l.nodes.map(([k, n, d], i) => (
            <li key={k} className="flex gap-2.5">
              <span className="flex flex-col items-center"><span className={cn('grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[10px]', cur === k ? 'border-primary bg-primary text-primary-foreground' : 'bg-card')}>{i + 1}</span>{i < l.nodes.length - 1 && <span className="w-px flex-1 bg-border" />}</span>
              <span className={cn('pb-2 text-[13px] leading-5', cur === k && 'font-bold text-primary')}>{n}<small className="block text-[11px] font-normal text-muted-foreground">{d}</small></span>
            </li>))}</ol>
        </section>
      ))}
    </div>
  )
}

/** Floating dark capsule with text labels under each icon (A-03). */
function BottomNav() {
  const app = useApp()
  return (
    <nav aria-label="主导航" className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center">
      <div className="pointer-events-auto flex gap-1 rounded-full bg-[#1C1B19] p-1.5 shadow-[0_16px_30px_-12px_rgba(0,0,0,.5)]">
        {NAV.map(({ k, n, i: I }) => {
          const on = app.screen.name === k
          return (
            <button key={k} aria-current={on ? 'page' : undefined} onClick={() => app.go({ name: k })}
              className={cn('flex h-12 w-[70px] flex-col items-center justify-center gap-0.5 rounded-full text-[11px] transition-colors', on ? 'bg-[#F3EFE8] text-[#1C1B19]' : 'text-[#F3EFE8]/70')}>
              <I className="size-[18px]" strokeWidth={on ? 2.2 : 1.8} />{n}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/** G-02: the sign-up gate appears only when a feature is used, with the reason as the title. */
function AuthDialog() {
  const app = useApp(), a = app.authAsk
  const c = CASES[0]
  return (
    <Dialog open={!!a} onOpenChange={o => !o && app.closeAuth()}>
      <DialogContent className="w-[calc(100%-32px)] gap-4 overflow-hidden rounded-[24px] p-0">
        <div className="relative h-[120px] bg-[#EFE8DC]">
          <CaseArt kind={c.k} color={c.color} light />
          <span className="absolute bottom-2 left-3 rounded-full bg-card/90 px-2.5 py-1 text-[11.5px]">{c.by} 用模板做的 · {c.days}</span>
        </div>
        <div className="flex flex-col gap-4 px-5 pb-5">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-[20px] font-black leading-snug">{a?.reason || '登录后继续'}</DialogTitle>
            <DialogDescription>注册送 1,200 token，够生成 4 次 3D 形体。模板和案例不登录也能看。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button className="h-12 rounded-full bg-[#1C1B19] text-[15px] text-white hover:bg-[#1C1B19]/90" onClick={() => app.login('小满')}> 通过 Apple 继续</Button>
            <Button variant="outline" className="h-12 rounded-full text-[15px]" onClick={() => app.login('小满')}><span className="font-bold text-[#4285F4]">G</span>通过 Google 继续</Button>
            <Button variant="outline" className="h-12 rounded-full text-[15px]" onClick={() => app.login('小满')}><Smartphone className="size-4" />手机号登录 / 注册</Button>
          </div>
          <button className="text-[13px] text-muted-foreground underline-offset-4 hover:underline" onClick={app.closeAuth}>先不登录，继续看看</button>
          <p className="text-center text-[11px] text-muted-foreground">继续即表示同意用户协议与隐私政策（示例）</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** G-05: share card built from a live 3D snapshot. */
function ShareCard() {
  const app = useApp(), sh = app.share
  const [img, setImg] = useState('')
  useEffect(() => { if (sh) setImg(app.snapRef.current?.() || '') }, [sh])
  return (
    <Dialog open={!!sh} onOpenChange={o => !o && app.setShare(null)}>
      <DialogContent className="w-[calc(100%-32px)] gap-4 rounded-[24px] p-4">
        <DialogHeader className="sr-only"><DialogTitle>分享卡片</DialogTitle><DialogDescription>保存或分享当前作品</DialogDescription></DialogHeader>
        <div className="overflow-hidden rounded-[18px] border bg-[#2B2A33] text-[#F3EFE8]">
          <div className="relative h-[230px]">
            {img ? <img src={img} alt="3D 形体截图" className="h-full w-full object-contain" /> : <CaseArt kind={app.flow.kind} color={null} />}
            <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[11px]">纸样工作台</span>
          </div>
          <div className="flex items-end gap-3 bg-[#F3EFE8] p-3.5 text-[#1C1B19]">
            <div className="min-w-0 flex-1"><b className="font-display block text-[18px] font-black">{sh?.title}</b><span className="text-[12.5px] text-[#1C1B19]/70">{sh?.sub}</span></div>
            <div className="flex flex-col items-center gap-0.5"><div className="grid size-14 place-items-center rounded-lg border border-dashed border-[#1C1B19]/40"><QrCode className="size-7 opacity-50" /></div><span className="text-[9.5px] text-[#1C1B19]/60">扫码看作品</span></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-11 rounded-full" onClick={() => toast.success('已唤起系统分享（演示）')}><Share2 className="size-4" />分享图片</Button>
          <Button variant="outline" className="h-11 rounded-full" onClick={() => toast.success('已保存到相册（演示）')}><Download className="size-4" />保存图片</Button>
        </div>
        <Button className="h-11 rounded-full" onClick={() => app.setShare(null)}>继续</Button>
      </DialogContent>
    </Dialog>
  )
}

const PROJECTS: { t: string; k: Kind; mode: Mode; at: StageKey; when: string; color: number }[] = [
  { t: '坐姿恐龙', k: 'dino', mode: 'text', at: 'flat', when: '2 小时前', color: 0x7a1f2b },
  { t: '生日熊 · 改耳朵', k: 'bear', mode: 'tpl', at: 'qa', when: '昨天', color: 0xc9a27e },
  { t: '猫猫三视图', k: 'cat', mode: 'views', at: 'seam', when: '3 天前', color: 0x8a8a92 }
]

function Projects() {
  const app = useApp()
  const empty = app.demo.emptyProj || !app.user
  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-4">
      <header className="flex items-center gap-2"><h1 className="font-display text-[22px] font-black">工作台</h1><span className="flex-1 text-xs text-muted-foreground">{empty ? '' : PROJECTS.length + ' 个项目'}</span><AvatarButton /></header>
      {empty ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border bg-card px-6 py-10 text-center">
          <FolderOpen className="size-10 text-muted-foreground/50" />
          <b className="text-[16px]">{app.user ? '还没有项目' : '登录后，项目会存在这里'}</b>
          <p className="text-[13px] text-muted-foreground">先挑一个教程模板练手，改过的纸样会自动存进来。</p>
          <div className="flex gap-2">
            <Button className="rounded-full" onClick={() => app.go({ name: 'library' })}>去模板库</Button>
            {!app.user && <Button variant="outline" className="rounded-full" onClick={() => app.gate('登录后查看你的项目', () => {})}>登录</Button>}
          </div>
        </div>
      ) : PROJECTS.map(p => (
        <button key={p.t} className="flex items-center gap-3 overflow-hidden rounded-[20px] border bg-card p-2.5 text-left" onClick={() => app.startFlow(p.mode, { kind: p.k, title: p.t, at: p.at })}>
          <div className="h-[76px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-[#EFE8DC]"><CaseArt kind={p.k} color={p.color} light /></div>
          <div className="min-w-0 flex-1">
            <b className="block text-[15px]">{p.t}</b>
            <span className="text-xs text-muted-foreground">{p.mode === 'tpl' ? '模板开版' : MODES[p.mode].long} · {p.when}</span>
            <div className="mt-1.5 flex items-center gap-1.5 text-[12px]"><span className="size-1.5 rounded-full bg-primary" />停在 {STAGE_N[p.at]}</div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}

/** G-10: conclusion → card → up to three next actions → close. Hobby and creator endings differ. */
function Done() {
  const app = useApp(), f = app.flow, w = app.works[0]
  if (f.launched) return (
    <DoneFrame title="材料包已提交审核" sub="平台 2 个工作日内复核纸样和打样报告，通过后开始接受预订。" kind={f.kind} stats={[['首批', f.launch.qty + ' 套'], ['定价', '¥' + f.launch.price], ['预订期', f.launch.days + ' 天']]}
      actions={[['做一张分享卡', () => app.setShare({ title: f.title, sub: `材料包 · ¥${f.launch.price} · 审核中` })], ['去创作者中心', () => app.go({ name: 'creator' })], ['再开一版', () => app.go({ name: 'library' })]]} />
  )
  return (
    <DoneFrame title="这只已经存进你的作品" sub={w?.cases ? '投稿到案例库的内容审核通过后，会出现在首页「照着案例做一只」。' : '随时可以在「我的」里分享出去。'} kind={f.kind} photo={w?.photo}
      stats={[['用时', w?.time || '—'], ['社区', w?.community ? '已分享' : '未分享'], ['案例库', w?.cases ? <span key="c" className="inline-flex items-center gap-1"><Clock className="size-3" />审核中</span> : '未投稿']]}
      actions={[['做一张分享卡', () => app.setShare({ title: f.title, sub: `自己缝的 · ${w?.time || ''}` })], ['看我的作品', () => app.go({ name: 'me' })], ['再做一只', () => app.go({ name: 'library' })]]} />
  )
}

function DoneFrame({ title, sub, kind, photo, stats, actions }: { title: string; sub: string; kind: Kind; photo?: string | null; stats: [string, React.ReactNode][]; actions: [string, () => void][] }) {
  const app = useApp()
  return (
    <div className="flex min-h-full flex-col gap-4 px-4 pb-8 pt-10">
      <div className="flex flex-col gap-1">
        <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-6" /></span>
        <h1 className="font-display mt-2 text-[26px] font-black leading-tight">{title}</h1>
        <p className="text-[14px] text-muted-foreground">{sub}</p>
      </div>
      <div className="overflow-hidden rounded-[20px] border bg-card">
        <div className="h-[170px] bg-[#2B2A33]">{photo ? <img src={photo} alt="作品" className="size-full object-contain" /> : <CaseArt kind={kind} color={null} />}</div>
        <dl className="grid grid-cols-3 border-t text-center">
          {stats.map(([a, b]) => <div key={a} className="border-r py-2.5 last:border-0"><dt className="text-[11px] text-muted-foreground">{a}</dt><dd className="font-mono text-[14px]">{b}</dd></div>)}
        </dl>
      </div>
      <div className="flex flex-col gap-2">
        {actions.map(([n, fn], i) => <Button key={n} variant={i === 0 ? 'default' : i === 1 ? 'outline' : 'ghost'} className="h-12 rounded-full text-[15px]" onClick={fn}>{i === 0 && <Share2 className="size-4" />}{n}</Button>)}
      </div>
      <button className="mt-auto text-[13px] text-muted-foreground" onClick={() => app.go({ name: 'home' })}>关闭</button>
    </div>
  )
}
