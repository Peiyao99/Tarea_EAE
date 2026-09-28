import { useEffect, useState } from 'react'
import { Box, Check, FolderOpen, Home as HomeIcon, LayoutGrid, Package, QrCode, Share2, Download, Smartphone, ArrowRight, Scissors, BookOpen, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AppProvider, DEMO_KEYS, useApp } from '@/store'
import { CASES, FABRICS, MODES, STAGE_N, TEMPLATES, type Kind, type Mode, type StageKey } from '@/data'
import { Home } from '@/screens/Home'
import { Library, TemplateDetail } from '@/screens/Library'
import { Flow } from '@/screens/Flow'
import { Viewer } from '@/three/Viewer'
import { CaseArt } from '@/components/Art'
import { cn } from '@/lib/utils'

export default function App() {
  return <AppProvider><Shell /></AppProvider>
}

const NAV = [
  { k: 'home', n: '首页', i: HomeIcon }, { k: 'library', n: '模板库', i: LayoutGrid },
  { k: 'projects', n: '工作台', i: FolderOpen }, { k: 'kit', n: '材料包', i: Package }
] as const

function Shell() {
  const app = useApp(), s = app.screen
  const immersive = s.name === 'flow' || s.name === 'tpl' || s.name === 'done'
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-14 lg:px-10">
      <aside className="hidden max-w-[360px] justify-self-end lg:flex lg:flex-col lg:gap-4">
        <span className="font-mono text-xs text-muted-foreground">PROTOTYPE · v3 · shadcn/ui + three.js</span>
        <h1 className="font-display text-[34px] font-black leading-[1.2]">纸样工作台</h1>
        <p className="text-[15px] leading-relaxed text-foreground/80">从一句话、草图、三视图或 3D 模型开始，拿到能直接裁剪缝制的毛绒纸样。模板和真实案例带你入门，3D 与纸样在同一个工作区里互相定位。</p>
        <ul className="flex flex-col gap-1.5 text-[13.5px] text-foreground/75">
          <li>未登录可以浏览模板和案例，开始生成、保存、发起材料包时弹出注册</li>
          <li>右上角头像里可以切换演示状态：上传失败、生成失败、token 不足等</li>
        </ul>
      </aside>
      <div id="phone" className="phone relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-clip bg-background lg:h-[844px] lg:w-[390px] lg:rounded-[44px] lg:border-[10px] lg:border-[#1C1B19] lg:shadow-[0_40px_80px_-40px_rgba(40,30,20,.6)]">
        <main key={s.name + (s.tpl || '')} className={cn('min-h-0 flex-1 animate-in fade-in-0 duration-200', s.name === 'flow' ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain')}>
          {s.name === 'home' && <Home />}
          {s.name === 'library' && <Library />}
          {s.name === 'tpl' && s.tpl && <TemplateDetail k={s.tpl} />}
          {s.name === 'flow' && <Flow />}
          {s.name === 'projects' && <Projects />}
          {s.name === 'kit' && <Kit />}
          {s.name === 'done' && <Done />}
        </main>
        {!immersive && <BottomNav />}
        <AuthDialog />
        <ShareCard />
        <AccountSheet />
        <Toaster position="top-center" richColors={false} toastOptions={{ className: 'rounded-2xl' }} />
      </div>
      <div className="hidden lg:block" />
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
            <div className="flex flex-col items-center gap-0.5"><div className="grid size-14 place-items-center rounded-lg border border-dashed border-[#1C1B19]/40"><QrCode className="size-7 opacity-50" /></div><span className="text-[9.5px] text-[#1C1B19]/60">上架后生成</span></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-11 rounded-full" onClick={() => toast.success('已唤起系统分享（演示）')}><Share2 className="size-4" />分享图片</Button>
          <Button variant="outline" className="h-11 rounded-full" onClick={() => toast.success('已保存到相册（演示）')}><Download className="size-4" />保存图片</Button>
        </div>
        <Button className="h-11 rounded-full" onClick={() => app.setShare(null)}>继续编辑</Button>
      </DialogContent>
    </Dialog>
  )
}

function AccountSheet() {
  const app = useApp()
  return (
    <Sheet open={app.acct} onOpenChange={app.setAcct}>
      <SheetContent side="bottom" className="max-h-[85%] overflow-y-auto rounded-t-[24px]">
        <SheetHeader className="text-left">
          <SheetTitle>{app.user ? app.user : '还没登录'}</SheetTitle>
          <SheetDescription>{app.user ? `token 余额 ${app.token.toLocaleString('en-US')}` : '浏览模板和案例不需要登录'}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 pt-4">
          {app.user
            ? <Button variant="outline" className="h-11 rounded-full" onClick={() => { app.logout(); toast('已退出登录') }}>退出登录</Button>
            : <Button className="h-11 rounded-full" onClick={() => { app.setAcct(false); app.gate('登录后，作品会存进你的工作台', () => toast.success('登录成功')) }}>登录 / 注册</Button>}
          <section className="flex flex-col gap-1 rounded-2xl border bg-card p-3">
            <b className="text-[13px]">演示状态</b>
            <span className="text-[12px] text-muted-foreground">用来走查异常路径，正式产品里没有这个面板</span>
            {DEMO_KEYS.map(([k, n, d]) => (
              <label key={k} className="flex items-center gap-3 border-t py-2.5 first-of-type:border-0">
                <div className="flex-1"><div className="text-[14px]">{n}</div><div className="text-[12px] text-muted-foreground">{d}</div></div>
                <Switch checked={app.demo[k]} onCheckedChange={v => app.setDemo(k, v)} />
              </label>
            ))}
          </section>
        </div>
      </SheetContent>
    </Sheet>
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
      <header className="flex items-baseline gap-2"><h1 className="font-display text-[22px] font-black">工作台</h1><span className="text-xs text-muted-foreground">{empty ? '' : PROJECTS.length + ' 个项目'}</span></header>
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

function Kit() {
  const app = useApp()
  const [fab, setFab] = useState(FABRICS[0])
  const t = TEMPLATES[0]
  return (
    <div className="flex flex-col gap-4 pb-28">
      <header className="px-4 pt-4"><h1 className="font-display text-[22px] font-black">材料包</h1><span className="text-xs text-muted-foreground">打样通过的纸样 + 现货面料，拆开就能缝</span></header>
      <div className="relative mx-4 h-[46vh] min-h-[300px] overflow-hidden rounded-[20px] bg-[#2B2A33]">
        <Viewer kind={t.k} color={fab.hex} className="absolute inset-0" />
        <Badge className="absolute left-3 top-3 rounded-full">打样 {t.rounds} 轮</Badge>
      </div>
      <div className="flex flex-col gap-3 px-4">
        <div className="flex items-baseline justify-between"><b className="font-display text-[20px] font-black">{t.n} 材料包</b><b className="font-mono text-[18px]">¥168</b></div>
        <section className="flex flex-col gap-2 rounded-[20px] border bg-card p-3.5">
          <div className="flex items-baseline justify-between"><b className="text-[14px]">面料</b><span className="text-[12px] text-muted-foreground">{fab.n} · 现货</span></div>
          <div className="flex gap-2" role="radiogroup" aria-label="面料颜色">
            {FABRICS.map(f => <button key={f.k} role="radio" aria-checked={fab.k === f.k} aria-label={f.n} onClick={() => setFab(f)} className={cn('grid size-10 place-items-center rounded-full border-2', fab.k === f.k ? 'border-foreground' : 'border-transparent')}><span className="grid size-8 place-items-center rounded-full" style={{ background: f.hex }}>{fab.k === f.k && <Check className="size-4 text-white mix-blend-difference" />}</span></button>)}
          </div>
        </section>
        <ul className="grid grid-cols-3 gap-2 text-center text-[12px]">
          {[[Scissors, '预裁纸样', t.pieces + ' 片 1:1'], [BookOpen, '跟着缝', '分步视频'], [Truck, '发货', '7 天内']].map(([I, a, b]) => { const Ic = I as typeof Box; return <li key={a as string} className="flex flex-col items-center gap-1 rounded-2xl border bg-card py-3"><Ic className="size-5" /><b>{a as string}</b><span className="text-muted-foreground">{b as string}</span></li> })}
        </ul>
        <Button className="h-12 rounded-full text-[15px]" onClick={() => app.gate('登录后预订材料包', () => toast.success('已预订，开团后通知你'))}>预订这个颜色</Button>
      </div>
    </div>
  )
}

/** G-10: conclusion → card → up to three next actions → close. */
function Done() {
  const app = useApp(), f = app.flow
  return (
    <div className="flex min-h-full flex-col gap-4 px-4 pb-8 pt-10">
      <div className="flex flex-col gap-1">
        <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-6" /></span>
        <h1 className="font-display mt-2 text-[26px] font-black leading-tight">材料包已提交审核</h1>
        <p className="text-[14px] text-muted-foreground">平台 2 个工作日内复核纸样和打样照片，通过后开始接受预订。</p>
      </div>
      <div className="overflow-hidden rounded-[20px] border bg-card">
        <div className="h-[170px] bg-[#EFE8DC]"><CaseArt kind={f.kind} color={null} light /></div>
        <dl className="grid grid-cols-3 border-t text-center">
          {[['首批', f.launch.qty + ' 套'], ['定价', '¥' + f.launch.price], ['开团', f.launch.days + ' 天']].map(([a, b]) => <div key={a} className="border-r py-2.5 last:border-0"><dt className="text-[11px] text-muted-foreground">{a}</dt><dd className="font-mono text-[14px]">{b}</dd></div>)}
        </dl>
      </div>
      <div className="flex flex-col gap-2">
        <Button className="h-12 rounded-full text-[15px]" onClick={() => app.setShare({ title: f.title, sub: `材料包 · ¥${f.launch.price} · 审核中` })}><Share2 className="size-4" />做一张分享卡</Button>
        <Button variant="outline" className="h-12 rounded-full" onClick={() => app.go({ name: 'projects' })}>回到工作台</Button>
        <Button variant="ghost" className="h-12 rounded-full" onClick={() => app.go({ name: 'library' })}>再做一只</Button>
      </div>
      <button className="mt-auto text-[13px] text-muted-foreground" onClick={() => app.go({ name: 'home' })}>关闭</button>
    </div>
  )
}
