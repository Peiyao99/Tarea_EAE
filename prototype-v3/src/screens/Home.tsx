import { useState } from 'react'
import { ArrowRight, ImagePlus, Loader2, Sparkles, Upload, UserRound, X } from 'lucide-react'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CASES, MODES, TEMPLATES, type Mode } from '@/data'
import { useApp, type FileRec } from '@/store'
import { CaseArt } from '@/components/Art'

type UMode = Exclude<Mode, 'tpl'>
let seq = 0

export function Home() {
  const app = useApp()
  const [mode, setMode] = useState<UMode>('text')
  const [desc, setDesc] = useState('坐姿小恐龙，背部一排软刺，成品约 25cm，短毛绒')
  const [files, setFiles] = useState<Record<string, (FileRec | null)[]>>({ sketch: [], ref: [], views: [null, null, null], obj: [] })
  const [errs, setErrs] = useState<string[]>([])
  const M = MODES[mode]
  const fs = (files[mode] || []).filter(Boolean) as FileRec[]

  const patch = (id: number, p: Partial<FileRec>) => setFiles(all => { const n = { ...all }; Object.keys(n).forEach(k => { n[k] = n[k].map(f => f && f.id === id ? { ...f, ...p } : f) }); return n })
  const upload = (rec: FileRec, retry = false) => {
    const fail = app.demo.uploadFail && !retry
    if (fail) app.setDemo('uploadFail', false)
    let pct = 0
    const t = setInterval(() => {
      pct = Math.min(100, pct + 14 + Math.random() * 10)
      if (fail && pct > 55) { clearInterval(t); patch(rec.id, { status: 'err', pct }); return }
      patch(rec.id, pct >= 100 ? { status: 'ok', pct: 100 } : { pct })
      if (pct >= 100) clearInterval(t)
    }, 140)
  }
  const add = (list: FileList | null, slot?: number) => {
    const e: string[] = []
    Array.from(list || []).forEach(file => {
      const ext = (file.name.split('.').pop() || '').toLowerCase()
      if (!M.exts!.includes(ext)) return e.push(`${file.name} 的格式不支持，请上传 ${M.exts!.map(x => x.toUpperCase()).join(' / ')}`)
      if (file.size > M.max! * 1048576) return e.push(`${file.name} 为 ${(file.size / 1048576).toFixed(1)} MB，超过 ${M.max} MB 上限`)
      const rec: FileRec = { id: ++seq, name: file.name, size: file.size, status: 'up', pct: 0 }
      const put = () => {
        setFiles(all => { const n = { ...all }; if (mode === 'views') { const arr = [...n.views]; arr[slot ?? arr.findIndex(x => !x)] = rec; n.views = arr } else n[mode] = [...n[mode], rec].slice(0, M.count); return n })
        upload(rec)
      }
      if (mode === 'obj') {
        // real parse: the uploaded model is what the workspace renders
        if (app.demo.parseFail) { rec.obj = null; put(); return }
        const r = new FileReader()
        if (ext === 'obj') { r.onload = () => { try { rec.obj = new OBJLoader().parse(String(r.result)) } catch { rec.obj = null } put() }; r.readAsText(file) }
        else { r.onload = () => new GLTFLoader().parse(r.result as ArrayBuffer, '', g => { rec.obj = g.scene; put() }, () => { rec.obj = null; put() }); r.readAsArrayBuffer(file) }
        return
      }
      const r = new FileReader(); r.onload = () => { rec.url = String(r.result); put() }; r.readAsDataURL(file)
    })
    setErrs(e)
  }
  const sample = () => {
    const mk = (name: string): FileRec => ({ id: ++seq, name, size: 2.4e6, status: 'ok', pct: 100, sample: true })
    setFiles(all => ({ ...all, [mode]: mode === 'views' ? ['front', 'side', 'back'].map(v => mk(`dino_${v}.png`)) : mode === 'ref' ? [mk('dino_ref_side.png'), mk('dino_ref_front.png')] : mode === 'obj' ? [mk('dino_v3.obj')] : [mk('dino_sketch.jpg')] }))
    setErrs([]); toast('已载入示例' + M.label)
  }
  const missing = mode === 'text' ? (desc.trim().length < 4 ? '先写一句描述' : '')
    : mode === 'views' ? (files.views.filter(Boolean).length < 3 ? `还差 ${3 - files.views.filter(Boolean).length} 张视图` : '')
    : !fs.length ? '先上传' + M.label : ''
  const busy = fs.some(f => f.status === 'up') ? '上传中…' : fs.some(f => f.status === 'err') ? '有文件没传上，重试或移除' : ''
  const block = missing || busy

  const go = () => {
    if (block) return
    const run = () => {
      if (mode === 'obj') { app.startFlow('obj', { files: fs, custom: fs[0]?.obj || null, title: fs[0]?.sample ? '坐姿恐龙' : fs[0].name.replace(/\.[^.]+$/, '') }); return }
      const bal = app.demo.lowToken ? 12 : app.token
      if (bal < M.cost) { toast.error(`token 不够：需要 ${M.cost}，剩 ${bal}`, { action: { label: '去充值', onClick: () => { app.setDemo('lowToken', false); app.setToken(app.token + 500); toast.success('已到账 500 token') } } }); return }
      app.setToken(bal - M.cost)
      app.startFlow(mode, { files: fs, desc })
    }
    app.gate(mode === 'obj' ? '登录后，上传的模型会存进你的项目' : '登录后开始生成，结果会自动存进工作台', run)
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-28 pt-4">
      <header className="flex items-center gap-2">
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.7" aria-hidden><path d="M5 20 C5 10 9 5 14 5 C19 5 23 10 23 20 Z" /><path d="M8 18 C8 12 10.5 8.5 14 8.5 C17.5 8.5 20 12 20 18" strokeDasharray="2 2" /><path d="M14 5 V23" /></svg>
        <b className="font-display text-[18px]">纸样工作台</b>
        <span className="flex-1" />
        <Badge variant="outline" className="rounded-full bg-card font-mono">◇ {(app.demo.lowToken ? 12 : app.token).toLocaleString('en-US')}</Badge>
        <button aria-label={app.user ? '我的账户' : '登录'} onClick={() => app.setAcct(true)} className="grid size-9 place-items-center rounded-full border bg-card text-[13px] font-bold">{app.user ? app.user[0] : <UserRound className="size-4" />}</button>
      </header>

      <section className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] font-black leading-[1.2] text-balance">好看的毛绒，<br />先得缝得出来。</h1>
        <p className="text-[14px] leading-relaxed text-muted-foreground">想法、设计图、3D 模型，都能变成一套拿去就能裁布的纸样。</p>
      </section>

      <section aria-label="开始开版" className="flex flex-col gap-3 rounded-[22px] border bg-card p-4 shadow-[0_12px_30px_-24px_rgba(60,40,20,.6)]">
        <Tabs value={mode} onValueChange={v => { setMode(v as UMode); setErrs([]) }}>
          <TabsList className="h-10 w-full justify-start overflow-x-auto rounded-full bg-muted p-1">
            {(Object.keys(MODES) as UMode[]).map(k => <TabsTrigger key={k} value={k} className="rounded-full px-3 text-[13px] data-[state=active]:bg-foreground data-[state=active]:text-background">{MODES[k].label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        {mode !== 'text' && (
          <div className="flex flex-col gap-2.5">
            {mode === 'views' ? (
              <div className="grid grid-cols-3 gap-2">
                {['正视', '侧视', '背视'].map((n, i) => { const f = files.views[i]; return (
                  <label key={n} className={'relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-[1.5px] text-xs text-muted-foreground ' + (f ? 'border-solid bg-card' : 'border-dashed bg-muted/40')}>
                    <span className="absolute left-1.5 top-1.5 rounded bg-card/90 px-1 font-mono text-[10px]">{['FRONT', 'SIDE', 'BACK'][i]}</span>
                    {f ? <FileThumb f={f} onRetry={() => upload(f, true)} /> : <><ImagePlus className="size-5" /><b className="text-[13px] font-medium text-foreground">{n}</b></>}
                    <input type="file" className="sr-only" accept={M.exts!.map(x => '.' + x).join(',')} onChange={e => { add(e.target.files, i); e.target.value = '' }} />
                  </label>) })}
              </div>
            ) : (
              <>
                {fs.length < (M.count || 1) && (
                  <label className="flex min-h-[104px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed bg-muted/40 p-3 text-center transition-colors hover:border-primary"
                    onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); add(e.dataTransfer.files) }}>
                    <span className="grid size-9 place-items-center rounded-xl border bg-card"><Upload className="size-4 text-primary" /></span>
                    <b className="text-[14px] font-medium">上传{M.label}</b>
                    <small className="text-xs text-muted-foreground">点击选择{(M.count || 1) > 1 ? `，最多 ${M.count} 个` : ''} · 也可以拖进来</small>
                    <input type="file" className="sr-only" multiple={(M.count || 1) > 1} accept={M.exts!.map(x => '.' + x).join(',')} onChange={e => { add(e.target.files); e.target.value = '' }} />
                  </label>
                )}
                {!!fs.length && <div className="grid grid-cols-4 gap-2">{fs.map(f => (
                  <div key={f.id} className="relative aspect-square overflow-hidden rounded-xl border bg-card">
                    <FileThumb f={f} onRetry={() => upload(f, true)} />
                    <button aria-label={'移除 ' + f.name} className="absolute right-1 top-1 z-10 grid size-6 place-items-center rounded-full bg-foreground/70 text-background" onClick={() => setFiles(a => ({ ...a, [mode]: a[mode].filter(x => x?.id !== f.id) }))}><X className="size-3.5" /></button>
                  </div>))}</div>}
              </>
            )}
            {!!errs.length && <div role="alert" className="flex flex-col gap-1">{errs.map(e => <div key={e} className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">{e}</div>)}</div>}
            <ul className="flex flex-col gap-1 rounded-xl bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-foreground/80">
              {M.reqs!.map(r => <li key={r} className="flex gap-2 before:mt-[7px] before:size-1 before:shrink-0 before:rounded-full before:bg-primary">{r}</li>)}
            </ul>
            <button className="self-start text-[13px] text-primary underline underline-offset-4" onClick={sample}>手边没有文件？用示例{M.label}试试</button>
          </div>
        )}
        <label htmlFor="desc" className="text-xs text-muted-foreground">{mode === 'text' ? '说说你想做的毛绒' : '补充描述 · 可选'}</label>
        <Textarea id="desc" rows={mode === 'text' ? 3 : 2} value={desc} onChange={e => setDesc(e.target.value)} className="resize-none border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0" />
        <div className="flex items-center gap-3">
          <span className={'text-xs ' + (block ? 'text-destructive' : 'text-muted-foreground')}>{block || (M.cost ? `消耗 ${M.cost} token` : '解析免费')}</span>
          <span className="flex-1" />
          <Button className="h-11 rounded-full px-5" disabled={!!block} onClick={go}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{M.cta}</Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between"><h2 className="font-display text-[21px] font-black">照着案例做一只</h2><button className="text-[13px] text-primary" onClick={() => app.go({ name: 'library' })}>全部模板</button></div>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {CASES.map(c => (
            <button key={c.id} className="w-[230px] shrink-0 snap-start overflow-hidden rounded-[20px] border bg-card text-left" onClick={() => app.go({ name: 'tpl', tpl: c.k })}>
              <div className="h-[150px] bg-[#2B2A33]"><CaseArt kind={c.k} color={c.color} /></div>
              <div className="flex flex-col gap-1 p-3">
                <b className="text-[15px]">{c.title}</b>
                <span className="text-xs text-muted-foreground">{c.note}</span>
                <span className="mt-1 flex items-center justify-between text-xs"><span className="text-muted-foreground">{c.by} · 用了{c.days}</span><span className="flex items-center gap-1 font-medium text-primary">照着做<ArrowRight className="size-3.5" /></span></span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[21px] font-black">第一次做？从教程模板开始</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {TEMPLATES.map(t => (
            <button key={t.k} className="overflow-hidden rounded-[18px] border bg-card text-left" onClick={() => app.go({ name: 'tpl', tpl: t.k })}>
              <div className="relative h-[120px] bg-[#EFE8DC]"><TplMini kind={t.k} /><Badge className="absolute left-2 top-2 rounded-full" variant={t.tier === '免费' ? 'default' : 'secondary'}>{t.tier}</Badge></div>
              <div className="p-2.5"><b className="text-[14px]">{t.n}</b><div className="text-xs text-muted-foreground">{t.pieces} 片 · {t.level} · 带「跟着缝」</div></div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function FileThumb({ f, onRetry }: { f: FileRec; onRetry: () => void }) {
  return <>
    {f.url ? <img src={f.url} alt="" className="absolute inset-0 size-full object-cover" /> : <span className="absolute inset-0 grid place-items-center bg-[#2B2A33] font-mono text-[11px] text-[#F3EFE8]">{f.name.split('.').pop()?.toUpperCase()}</span>}
    <span className="absolute inset-x-0 bottom-0 truncate bg-card/90 px-1.5 py-0.5 text-[10px]">{f.name}</span>
    {f.status === 'up' && <span className="absolute inset-x-1.5 bottom-5 h-1 overflow-hidden rounded bg-white/80"><i className="block h-full bg-primary transition-[width]" style={{ width: f.pct + '%' }} /></span>}
    {f.status === 'err' && <span className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-1 bg-[#FDF1EA]/95 text-[11px] font-medium text-destructive">上传失败<Button size="sm" variant="outline" className="h-7 rounded-full text-xs" onClick={e => { e.preventDefault(); onRetry() }}>重试</Button></span>}
  </>
}

// Tiny static 3D preview: one shared renderer per card is wasteful, so cards use an illustration and the detail page the real 3D.
function TplMini({ kind }: { kind: 'dino' | 'bear' | 'cat' | 'bunny' }) {
  return <div className="absolute inset-0"><CaseArt kind={kind} color={null} light /></div>
}

