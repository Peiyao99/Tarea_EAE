import type { Kind } from '@/data'

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0')
function shade(c: string, k: number) { const n = parseInt(c.slice(1), 16); const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join('') }

/** Flat illustration of a finished plush for cards; the 3D workspace is reserved for pages where it is used. */
export function CaseArt({ kind, color, light }: { kind: Kind; color: number | null; light?: boolean }) {
  const base = color != null ? hex(color) : '#D8CDBF', dark = shade(base, 0.82), belly = shade(base, 1.18)
  const eye = '#1C1B19'
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" aria-hidden>
      {!light && <defs><radialGradient id={'g' + kind} cx="50%" cy="40%" r="65%"><stop offset="0" stopColor="#3a3844" /><stop offset="1" stopColor="#2B2A33" /></radialGradient></defs>}
      {!light && <rect width="200" height="150" fill={`url(#g${kind})`} />}
      <ellipse cx="100" cy="138" rx="46" ry="6" fill="#000" opacity=".18" />
      <g transform={kind === 'bunny' ? 'translate(0,6)' : ''}>
        {kind === 'dino' && <>
          <path d="M62 118 C44 124 30 132 20 138 C36 142 56 136 72 128 Z" fill={dark} />
          {[0, 1, 2, 3].map(i => <path key={i} d={`M${78 - i * 3} ${46 + i * 18} l-12 -4 l8 -10 Z`} fill="#B83C0A" />)}
        </>}
        {kind === 'cat' && <path d="M130 122 C156 118 162 92 150 76" fill="none" stroke={dark} strokeWidth="9" strokeLinecap="round" />}
        <path d="M68 70 C54 92 56 128 74 136 C88 142 112 142 126 136 C144 128 146 92 132 70 Z" fill={base} />
        <ellipse cx="100" cy="112" rx="20" ry="22" fill={belly} opacity=".85" />
        <ellipse cx="82" cy="136" rx="14" ry="7" fill={dark} /><ellipse cx="118" cy="136" rx="14" ry="7" fill={dark} />
        {kind === 'bear' && <><circle cx="74" cy="32" r="10" fill={dark} /><circle cx="126" cy="32" r="10" fill={dark} /></>}
        {kind === 'cat' && <><path d="M72 42 L78 14 L92 34 Z" fill={dark} /><path d="M128 42 L122 14 L108 34 Z" fill={dark} /></>}
        {kind === 'bunny' && <><ellipse cx="88" cy="10" rx="7" ry="26" fill={dark} /><ellipse cx="112" cy="10" rx="7" ry="26" fill={dark} /></>}
        <ellipse cx="100" cy="52" rx={kind === 'dino' ? 30 : 32} ry="28" fill={base} />
        {kind === 'dino' ? <ellipse cx="112" cy="62" rx="18" ry="11" fill={belly} /> : <ellipse cx="100" cy="64" rx="11" ry="8" fill={belly} />}
        <circle cx="90" cy="48" r="3.2" fill={eye} /><circle cx="110" cy="48" r="3.2" fill={eye} />
        <path d="M100 26 C103 40 103 64 100 80" fill="none" stroke="#F3A27A" strokeWidth="1.2" strokeDasharray="3 3" opacity=".8" />
      </g>
    </svg>
  )
}
