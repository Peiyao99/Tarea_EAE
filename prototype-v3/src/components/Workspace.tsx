import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Axis3d, ChevronUp, Replace } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Viewer, type ViewerHandle, type ViewerProps } from '@/three/Viewer'
import { PatternView, type Mark } from '@/components/PatternView'
import { PART_N, PIECE_PART, type Part, type Piece } from '@/data'
import { useApp } from '@/store'
import { cn } from '@/lib/utils'

type Props = {
  viewer: Omit<ViewerProps, 'onPick' | 'opacity' | 'axes' | 'highlight'>
  pieces: Record<string, Piece>
  marks?: Mark[]
  hiParts: Part[]
  hiPieces: string[]
  onSelect: (piece: string | null, part: Part) => void
  hint?: string
  onSwap?: (() => void) | null
  compact?: boolean
  guide?: boolean
  className?: string
}

/** Coach tag pinned above its target (G-04): one at a time, gone once the action is done. */
function Coach({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute z-20 flex flex-col items-center', className)}>
      <span className="whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[12px] font-medium text-primary-foreground shadow-lg">{text}</span>
      <span className="h-5 w-px bg-primary" />
    </div>
  )
}

export function Workspace({ viewer, pieces, marks, hiParts, hiPieces, onSelect, hint, onSwap, compact, guide, className }: Props) {
  const { guides, doneGuide, snapRef } = useApp()
  const [view, setView] = useState<'3d' | 'pat' | 'split'>('split')
  const [op, setOp] = useState(100)
  const [axes, setAxes] = useState(true)
  const [folded, setFolded] = useState(false)
  const vref = useRef<ViewerHandle>(null)
  useEffect(() => { snapRef.current = () => vref.current?.snapshot() || '' }, [snapRef])
  // Layout cleanup runs before the viewer disposes its renderer, so the last frame survives for later steps.
  useLayoutEffect(() => () => { const last = vref.current?.snapshot() || ''; snapRef.current = () => last }, [snapRef])

  const pick = (piece: string | null, part: Part) => {
    onSelect(piece, part)
    vref.current?.face(part)
    doneGuide('pick')
  }
  const sel = hiPieces.filter(k => pieces[k])
  const label = sel.length ? sel.map(k => `${k} ${pieces[k].n}`).join('、') + (hiParts.length ? ' · ' + hiParts.map(p => PART_N[p]).join('、') : '') : hint || '点纸样或 3D 部位，两边一起高亮'
  const showRotate = guide && !guides.has('rotate')
  const showPick = guide && guides.has('rotate') && !guides.has('pick')

  return (
    <section aria-label="工作区" className={cn('relative shrink-0 overflow-hidden rounded-[20px] border bg-card shadow-[0_14px_26px_-22px_rgba(40,30,20,.55)]', className)}>
      <div className="flex items-center gap-1.5 px-2.5 pb-1.5 pt-2">
        <ToggleGroup type="single" value={view} onValueChange={v => v && setView(v as typeof view)} className="rounded-lg bg-muted p-0.5" aria-label="视图">
          {([['3d', '3D'], ['pat', '纸样'], ['split', '并排']] as const).map(([k, n]) => (
            <ToggleGroupItem key={k} value={k} className="h-7 px-3 text-xs data-[state=on]:bg-card data-[state=on]:shadow-sm">{n}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="flex-1" />
        <Button variant={axes ? 'default' : 'outline'} size="icon" className="size-8 rounded-lg" aria-pressed={axes} aria-label="坐标轴与网格" onClick={() => setAxes(a => !a)}><Axis3d className="size-4" /></Button>
        <Button variant="outline" size="icon" className="size-8 rounded-lg" aria-expanded={!folded} aria-label={folded ? '展开工作区' : '收起工作区'} onClick={() => setFolded(f => !f)}><ChevronUp className={cn('size-4 transition-transform', folded && 'rotate-180')} /></Button>
      </div>
      <div className={cn('grid transition-[height] duration-300', folded ? 'h-0' : compact ? 'h-[26vh] min-h-[160px]' : 'h-[46vh] min-h-[280px]', view === 'split' ? 'grid-cols-2' : 'grid-cols-1')}>
        <div className={cn('relative min-w-0 bg-[#2B2A33]', view === 'pat' && 'hidden')}>
          <Viewer ref={vref} {...viewer} className="absolute inset-0" opacity={op / 100} axes={axes} highlight={hiParts}
            onPick={part => pick(Object.keys(pieces).find(k => PIECE_PART[k] === part) || null, part)}
            onInteract={() => doneGuide('rotate')} />
          <div className="absolute left-1.5 top-1.5 flex gap-1">
            {(['head', 'tail', 'spikes'] as Part[]).filter(p => p !== 'spikes' || Object.keys(pieces).includes('S1')).filter(p => p !== 'tail' || Object.keys(pieces).includes('T1')).map(p => (
              <button key={p} className="h-6 rounded-md bg-white/15 px-2 text-[11px] text-[#F3EFE8]" onClick={() => vref.current?.face(p)}>{p === 'head' ? '正面' : p === 'tail' ? '背面' : '侧背'}</button>
            ))}
          </div>
          <span className="pointer-events-none absolute bottom-1.5 right-2 text-[10px] text-white/55">拖动旋转 · 双指缩放</span>
          {showRotate && <Coach text="拖动看看背面" className="left-1/2 top-[38%] -translate-x-1/2" />}
        </div>
        <div className={cn('relative min-w-0 border-l bg-[#FDFCFA]', view === '3d' && 'hidden')}>
          <PatternView pieces={pieces} marks={marks} selected={new Set(sel)} onPick={k => pick(k, PIECE_PART[k])} />
          {showPick && <Coach text="点一片纸样" className="left-1/2 top-[30%] -translate-x-1/2" />}
        </div>
      </div>
      {!folded && (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-3 pb-2.5 pt-1.5 text-[11.5px] text-muted-foreground">
          <span>不透明度</span>
          <Slider value={[op]} min={15} max={100} step={1} onValueChange={v => setOp(v[0])} aria-label="3D 不透明度" />
          <span className="w-9 text-right font-mono text-foreground">{op}%</span>
          <div className="col-span-3 flex min-h-8 items-center gap-2 text-[12.5px] text-foreground/80">
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {onSwap && <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={onSwap}><Replace className="size-3.5" />替换部件</Button>}
          </div>
        </div>
      )}
    </section>
  )
}
