import type { Piece } from '@/data'

export type Mark = { p: string; t: 'emb' | 'eye' | 'fill' | 'ladder' | 'notch' }

export function MarkGlyph({ t, x, y }: { t: Mark['t']; x: number; y: number }) {
  if (t === 'emb') return <g><circle cx={x} cy={y} r={8} fill="none" stroke="#B83C0A" strokeWidth={1.6} strokeDasharray="2 2" /><circle cx={x} cy={y} r={2} fill="#B83C0A" /></g>
  if (t === 'eye') return <g><circle cx={x} cy={y} r={7} fill="#2B2A33" /><circle cx={x + 2} cy={y - 2} r={2} fill="#fff" /></g>
  if (t === 'fill') return <path d={`M${x - 12} ${y} H${x + 12} M${x - 12} ${y - 5} V${y + 5} M${x + 12} ${y - 5} V${y + 5}`} stroke="#0F6E6A" strokeWidth={3} fill="none" />
  if (t === 'ladder') return <path d={`M${x - 12} ${y} l4 -5 l4 10 l4 -10 l4 10 l4 -10 l4 5`} stroke="#1C1B19" strokeWidth={1.5} fill="none" />
  return <path d={`M${x - 6} ${y - 6} L${x} ${y + 5} L${x + 6} ${y - 6} Z`} fill="#B83C0A" />
}

export function PieceShape({ d, sa = 5 }: { d: string; sa?: number }) {
  return <>
    <path d={d} fill="none" stroke="#1C1B19" strokeWidth={6 + sa * 1.2} strokeLinejoin="round" />
    <path d={d} fill="none" stroke="#FBE6DA" strokeWidth={4 + sa * 1.2} strokeLinejoin="round" />
    <path d={d} fill="#fff" stroke="#B83C0A" strokeWidth={1.6} strokeDasharray="6 4" />
  </>
}

export function PatternView({ pieces, selected, marks = [], onPick }: { pieces: Record<string, Piece>; selected: Set<string>; marks?: Mark[]; onPick?: (k: string) => void }) {
  return (
    <svg viewBox="0 0 760 500" preserveAspectRatio="xMidYMid meet" className="h-full w-full" aria-label="平面纸样">
      <defs>
        <pattern id="mat" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0 H0 V25" fill="none" stroke="#DCE6DD" strokeWidth="1" /></pattern>
      </defs>
      <rect width="760" height="500" fill="url(#mat)" />
      {Object.entries(pieces).map(([k, p]) => {
        const lab = p.lab || [p.c[0] - 30, p.c[1] + 40], on = selected.has(k)
        return (
          <g key={k} transform={`translate(${p.x},${p.y})`} onClick={() => onPick?.(k)} className="cursor-pointer">
            <path d={p.d} fill="none" stroke="#B83C0A" strokeWidth={26} strokeLinejoin="round" opacity={on ? 0.22 : 0} style={{ transition: 'opacity .2s' }} />
            <PieceShape d={p.d} sa={p.sa} />
            {p.grain != null && <g transform={`translate(${p.c[0]} ${p.c[1]}) rotate(${p.grain})`}><path d="M0 -24 V24 M-6 16 L0 24 L6 16" fill="none" stroke="#1C1B19" strokeWidth={1.8} /></g>}
            <text x={lab[0]} y={lab[1]} style={{ font: '700 22px ui-monospace, monospace' }} fill={on ? '#8F2E07' : '#1C1B19'}>{k}</text>
            <text x={lab[0]} y={lab[1] + 19} style={{ font: '400 16px system-ui' }} fill="#5E5A52">{p.n} ×{p.qty}</text>
            {marks.filter(m => m.p === k).map((m, i) => <MarkGlyph key={i} t={m.t} x={p.c[0] + 24 + (i % 2) * 24} y={p.c[1] - 22 + Math.floor(i / 2) * 22} />)}
          </g>
        )
      })}
    </svg>
  )
}

export function PartThumb({ d }: { d: string }) {
  return <svg viewBox="-12 -12 230 190" className="h-full w-full" aria-hidden><PieceShape d={d} /></svg>
}
