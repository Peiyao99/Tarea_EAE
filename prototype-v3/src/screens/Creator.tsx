import { useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, Plus, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useApp } from '@/store'
import { KITS, type Kind } from '@/data'
import { CaseArt } from '@/components/Art'
import { cn } from '@/lib/utils'

type WorkCard = { c: string; b: string; tone: 'rust' | 'ink' | 'sand' | 'teal'; t: string; m: string; k: Kind; color: number | null; bg: string; kit?: string }
const WORKS: WorkCard[] = [
  { c: 'kit', b: '材料包 · 预订中', tone: 'rust', t: '哥特小龙', m: 'COUNT / 50 份 · ¥168', k: 'dino', color: 0x7a1f2b, bg: '#2B2A33', kit: 'dragon' },
  { c: 'pattern', b: '纸样 PDF', tone: 'ink', t: '坐姿小恐龙', m: '13 片 · 进阶 · ¥38', k: 'dino', color: 0x5a6b45, bg: '#E9DCCB' },
  { c: 'design', b: '设计稿', tone: 'sand', t: '蝙蝠翼小猫', m: '三视图 · 开放开版合作', k: 'cat', color: 0x4a4854, bg: '#7A1F2B' },
  { c: 'custom', b: '成品定制', tone: 'teal', t: '奶白长耳兔', m: '一对一 · 剩 3 个名额', k: 'bunny', color: 0xede6da, bg: '#4A4854' },
  { c: 'pattern', b: '纸样 PDF', tone: 'ink', t: '生日熊 · 改耳版', m: '18 片 · 入门 · ¥28', k: 'bear', color: 0xc9a27e, bg: '#F3EFE8' }
]
const TABS: [string, string][] = [['all', '全部'], ['kit', '材料包'], ['pattern', '纸样'], ['custom', '成品定制'], ['design', '设计稿']]
const TONE = { rust: 'bg-primary text-primary-foreground', ink: 'bg-[#2B2A33] text-[#F3EFE8]', sand: 'bg-[#E9DCCB] text-[#1C1B19]', teal: 'bg-emerald-700 text-white' }

/** v2 creator layout. `self` is the creator center (reached from 我的); otherwise the public profile. */
export function CreatorPage({ self }: { self: boolean }) {
  const app = useApp()
  const [tab, setTab] = useState('all')
  const [follow, setFollow] = useState(false)
  const name = self ? `${app.user || '小满'}的工作室` : 'MOTH 工作室'
  const count = KITS[0].count
  const list = WORKS.filter(w => tab === 'all' || w.c === tab)
  return (
    <div className="flex flex-col pb-10">
      <div className="relative h-[120px] shrink-0 bg-[#2B2A33]">
        <svg viewBox="0 0 390 120" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden><g fill="none" stroke="#4A4854" strokeWidth="1.2" strokeDasharray="6 5"><path d="M0 30 C80 10 160 60 240 40 C300 24 350 60 390 44" /><path d="M0 80 C80 60 160 110 240 90 C300 74 350 110 390 94" /></g><g fill="#7A1F2B"><path d="M280 120 L296 92 L312 120 Z M318 120 L334 84 L350 120 Z M356 120 L372 96 L388 120 Z" /></g></svg>
        <div className="absolute inset-x-3 top-3 flex justify-between">
          <button aria-label="返回" onClick={app.back} className="grid size-9 place-items-center rounded-full bg-white/15 text-white"><ChevronLeft className="size-4" /></button>
          <button aria-label="分享主页" onClick={() => toast.success('主页链接已复制')} className="grid size-9 place-items-center rounded-full bg-white/15 text-white"><Share2 className="size-4" /></button>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4">
        <div className="-mt-8 flex items-end gap-3">
          <span className="grid size-[72px] place-items-center rounded-[22px] border-4 border-background bg-primary font-display text-[28px] font-black text-primary-foreground">{name[0]}</span>
          <div className="pb-1"><h1 className="font-display text-[20px] font-black">{name}</h1></div>
          <Badge className="mb-2 rounded-full">创作者</Badge>
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{self ? '神奇动物 · 坐姿系列' : '人偶毛绒 · 神奇动物 · 哥特可爱'}<br />作品 {self ? 5 : 24} · 关注 <span className="font-mono">{self ? '1,204' : (follow ? 3619 : 3618).toLocaleString('en-US')}</span> · 已售 {self ? 214 : '1,092'}</p>
        <div className="grid grid-cols-2 gap-2">
          {self ? <>
            <Button variant="outline" className="h-10 rounded-full" onClick={() => toast('原型未展开编辑页')}>编辑主页</Button>
            <Button variant="outline" className="h-10 rounded-full" onClick={() => app.go({ name: 'profile' })}>看访客视角</Button>
          </> : <>
            <Button variant={follow ? 'outline' : 'default'} className={cn('h-10 rounded-full', !follow && 'bg-[#1C1B19] hover:bg-[#1C1B19]/90')} aria-pressed={follow} onClick={() => app.gate('登录后关注创作者', () => { setFollow(f => !f); if (!follow) toast.success('已关注，上新会通知你') })}>{follow ? '已关注' : '关注'}</Button>
            <Button variant="outline" className="h-10 rounded-full" onClick={() => app.gate('登录后私信创作者', () => toast('私信页未展开'))}>私信定制</Button>
          </>}
        </div>

        {self && <section className="flex flex-col gap-2 rounded-[20px] border bg-card p-3.5" aria-label="本月数据，仅你可见">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Lock className="size-3" />本月 · 仅你可见</span>
          <dl className="grid grid-cols-4 gap-1">{[['销售额', '¥9.8k', ''], ['token 奖励', '+860', 'text-primary'], ['纸样下载', '214', ''], ['神奇动物榜', '#7', '']].map(([a, b, c]) => <div key={a}><dt className="text-[11px] text-muted-foreground">{a}</dt><dd className={cn('font-mono text-[16px]', c)}>{b}</dd></div>)}</dl>
        </section>}

        <div role="tablist" aria-label="内容类型" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
          {TABS.map(([k, n]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('h-8 shrink-0 rounded-full border px-3 text-[13px]', tab === k ? 'border-foreground bg-foreground text-background' : 'bg-card')}>{n}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {list.map(w => (
            <button key={w.t} onClick={() => w.kit ? app.go({ name: 'kitDetail', id: w.kit }) : toast('作品页未展开')} className="overflow-hidden rounded-[18px] border bg-card text-left">
              <div className="relative h-[130px]" style={{ background: w.bg }}><CaseArt kind={w.k} color={w.color} light /><span className={cn('absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px]', TONE[w.tone])}>{w.b}</span></div>
              <div className="p-2.5"><b className="text-[14px]">{w.t}</b><div className="text-xs text-muted-foreground">{w.m.replace('COUNT', String(count))}</div></div>
            </button>
          ))}
          {self && <button onClick={() => app.go({ name: 'projects' })} className="flex min-h-[180px] flex-col items-center justify-center gap-1 rounded-[18px] border border-dashed text-[13px]"><Plus className="size-6 text-muted-foreground" />从工作台发布<small className="text-muted-foreground">纸样、设计稿或材料包</small></button>}
        </div>

        {self && <>
          <section className="flex flex-col rounded-[20px] border bg-card px-3.5 py-1" aria-label="待处理">
            {[['哥特小龙 距开裁还差 ' + (50 - count) + ' 份', '推广', () => app.go({ name: 'kitDetail', id: 'dragon' })], ['2 条定制私信', '回复', () => toast('私信页未展开')], ['生日熊改耳版 平台打样已回传', '查看', () => toast('打样报告未展开')]].map(([a, b, fn]) => (
              <button key={a as string} onClick={fn as () => void} className="flex h-12 items-center gap-2 border-b text-left text-[13.5px] last:border-0"><span className="flex-1">{a as string}</span><em className="not-italic text-primary">{b as string}</em><ChevronRight className="size-4 text-muted-foreground" /></button>))}
          </section>
          <section className="flex flex-col gap-2 rounded-[20px] bg-[#2B2A33] p-4 text-[#F3EFE8]">
            <h2 className="font-display text-[19px] font-black">发起材料包</h2>
            <p className="text-[13px] leading-relaxed opacity-75">纸样通过平台打样即可发起。裁切、配布、质检、发货由平台完成，你只负责设计与推广。</p>
            <Button className="h-11 rounded-full" onClick={() => app.startFlow('tpl', { kind: 'dino', title: '坐姿小恐龙 · 材料包', at: 'proof', plat: true })}>选一套纸样去打样</Button>
          </section>
        </>}
      </div>
    </div>
  )
}
