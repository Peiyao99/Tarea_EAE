import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Kind, Part } from '@/data'
import { cn } from '@/lib/utils'

export type Variant = { spikes: number; tail: 'dragon' | 'thin' | 'none' }
export type ViewerHandle = { snapshot: () => string; face: (p: Part) => void }
export type ViewerProps = {
  kind: Kind
  variant?: Variant
  color?: string
  size?: number // 0.8 .. 1.3, from the template's height slider
  ear?: number // 0.6 .. 1.6
  snout?: number
  highlight?: Part[]
  seams?: Record<string, boolean> | null
  showSeams?: boolean
  fill?: 'belly' | 'back' | 'tail' | null
  inflate?: number
  opacity?: number
  axes?: boolean
  custom?: THREE.Object3D | null
  onPick?: (p: Part) => void
  onInteract?: () => void
  className?: string
}

const BASE: Record<string, number> = { head: 0xd8cdbf, body: 0xcbbfae, belly: 0xece3d6, legs: 0xbfb19e, arms: 0xbfb19e, tail: 0xb9ab97, spikes: 0xb83c0a, ears: 0xc4b6a2 }
const FACE: Partial<Record<Part, number>> = { tail: Math.PI * 0.85, spikes: -Math.PI * 0.7, head: 0, belly: 0, legs: 0.3, arms: 0.9, ears: 0.2 }
const FILL3D = { belly: [16, 40, 32], back: [0, 36, -41], tail: [0, 24, -40] } as const

function plush(hex: number, opacity: number) {
  const c = new THREE.Color(hex)
  const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.95, metalness: 0, sheen: 1, sheenRoughness: 0.55, sheenColor: c.clone().lerp(new THREE.Color(0xffffff), 0.45), transparent: true, opacity })
  m.userData.base = hex
  return m
}

function label(text: string, color: string) {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const x = c.getContext('2d')!; x.fillStyle = color; x.font = 'bold 44px ui-monospace, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 32, 34)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }))
  s.scale.set(13, 13, 1); s.renderOrder = 10
  return s
}

export const Viewer = forwardRef<ViewerHandle, ViewerProps>(function Viewer(props, ref) {
  const host = useRef<HTMLDivElement>(null)
  const R = useRef<any>(null)
  const propsRef = useRef(props); propsRef.current = props

  useImperativeHandle(ref, () => ({
    snapshot: () => { const r = R.current; if (!r) return ''; r.renderer.render(r.scene, r.camera); return r.renderer.domElement.toDataURL('image/png') },
    face: (p: Part) => faceTo(p)
  }))

  function faceTo(p: Part) {
    const r = R.current; if (!r || FACE[p] == null) return
    const off = r.camera.position.clone().sub(r.controls.target)
    const sph = new THREE.Spherical().setFromVector3(off); sph.theta = FACE[p]!
    r.camera.position.setFromSpherical(sph).add(r.controls.target); r.controls.update()
  }

  // scene, once
  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block'
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2b2a33)
    const camera = new THREE.PerspectiveCamera(32, 1, 1, 4000); camera.position.set(-170, 150, 250)
    scene.add(new THREE.HemisphereLight(0xfff6ee, 0x3a3844, 1.1))
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(120, 260, 180); key.castShadow = true
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -140, right: 140, top: 180, bottom: -40 }); scene.add(key)
    const rim = new THREE.DirectionalLight(0xf3a27a, 0.6); rim.position.set(-160, 120, -160); scene.add(rim)
    const ground = new THREE.Mesh(new THREE.CircleGeometry(170, 48), new THREE.ShadowMaterial({ opacity: 0.35 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)
    const grid = new THREE.GridHelper(300, 15, 0x5f5c6a, 0x3c3b45); scene.add(grid)
    const axes = new THREE.Group()
    ;([[0xe0643a, [1, 0, 0], 'X', '#E0643A'], [0x3fb8a8, [0, 1, 0], 'Y', '#3FB8A8'], [0xe9dccb, [0, 0, 1], 'Z', '#E9DCCB']] as const).forEach(a => {
      const dir = new THREE.Vector3(...a[1]); axes.add(new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0.4, 0), 110, a[0], 9, 5))
      const s = label(a[2], a[3]); s.position.copy(dir.multiplyScalar(122)); axes.add(s)
    })
    scene.add(axes)
    const controls = new OrbitControls(camera, renderer.domElement)
    // A-07: never zoom into the model or under the floor
    Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 190, maxDistance: 520, minPolarAngle: 0.25, maxPolarAngle: 1.52, rotateSpeed: 0.8 })
    controls.target.set(0, 68, 0); controls.update()
    const model = new THREE.Group(); scene.add(model)
    const r = { renderer, scene, camera, controls, model, grid, axes, meshes: [] as THREE.Mesh[], lines: {} as Record<string, THREE.Line[]>, fill: null as THREE.Mesh | null, shell: null as THREE.Group | null, raf: 0 }
    R.current = r
    controls.addEventListener('start', () => propsRef.current.onInteract?.())
    const size = () => { const b = el.getBoundingClientRect(); if (!b.width || !b.height) return; renderer.setSize(b.width, b.height, false); camera.aspect = b.width / b.height; camera.zoom = Math.min(1, camera.aspect * 1.15); camera.updateProjectionMatrix(); renderer.render(scene, camera) }
    const ro = new ResizeObserver(size); ro.observe(el); size()
    // tap (not drag) picks a part
    let down: [number, number] | null = null
    const onDown = (e: PointerEvent) => { down = [e.clientX, e.clientY] }
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) { down = null; return }
      down = null
      const b = renderer.domElement.getBoundingClientRect()
      const v = new THREE.Vector2((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1)
      const rc = new THREE.Raycaster(); rc.setFromCamera(v, camera)
      const hit = rc.intersectObjects(r.meshes, false).find(h => h.object.userData.part)
      if (hit) propsRef.current.onPick?.(hit.object.userData.part)
    }
    renderer.domElement.addEventListener('pointerdown', onDown); renderer.domElement.addEventListener('pointerup', onUp)
    const loop = () => { r.raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera) }
    loop()
    return () => { cancelAnimationFrame(r.raf); ro.disconnect(); controls.dispose(); renderer.dispose(); el.removeChild(renderer.domElement); R.current = null }
  }, [])

  // model, when shape inputs change
  const v = props.variant || { spikes: 5, tail: 'dragon' }
  useEffect(() => {
    const r = R.current; if (!r) return
    r.model.clear(); r.meshes = []; r.lines = {}
    const op = props.opacity ?? 1
    const add = (geo: THREE.BufferGeometry, part: Part | null, pos: number[], scale?: number[], rot?: number[], hex?: number) => {
      const m = new THREE.Mesh(geo, part ? plush(hex ?? BASE[part], op) : new THREE.MeshStandardMaterial({ color: 0x1c1b19, roughness: 0.3 }))
      m.position.set(pos[0], pos[1], pos[2]); if (scale) m.scale.set(scale[0], scale[1], scale[2]); if (rot) m.rotation.set(rot[0], rot[1], rot[2])
      m.castShadow = true; m.userData.part = part; r.model.add(m); if (part) r.meshes.push(m); return m
    }
    if (props.custom) {
      const obj = props.custom.clone(true)
      const box = new THREE.Box3().setFromObject(obj), sz = box.getSize(new THREE.Vector3()), s = 140 / Math.max(sz.y, 1e-6)
      obj.scale.multiplyScalar(s)
      const b2 = new THREE.Box3().setFromObject(obj), ctr = b2.getCenter(new THREE.Vector3())
      obj.position.sub(new THREE.Vector3(ctr.x, b2.min.y, ctr.z))
      obj.traverse((o: any) => { if (o.isMesh) { o.material = plush(0xcbbfae, op); o.castShadow = true; o.userData.part = 'body'; r.meshes.push(o) } })
      r.model.add(obj)
    } else {
      const k = props.kind, tint = props.color ? new THREE.Color(props.color).getHex() : null
      const tall = k === 'bunny', S = (rad: number) => new THREE.SphereGeometry(rad, 48, 32)
      const bodyGeo = new THREE.LatheGeometry([[0, 0], [20, 1.5], [33, 12], [38, 32], [36, 54], [30, 74], [20, 88], [0, 94]].map(p => new THREE.Vector2(p[0], p[1] * (tall ? 1.18 : 1))), 48)
      add(bodyGeo, 'body', [0, 2, 0], [1, 1, 0.92], undefined, tint ?? undefined)
      add(S(26), 'belly', [0, 40, 16], [0.84, tall ? 1.3 : 1.12, 0.5], undefined, tint ? new THREE.Color(tint).lerp(new THREE.Color(0xffffff), 0.35).getHex() : undefined)
      const hy = tall ? 124 : 112, hr = k === 'dino' ? 28 : 30
      add(S(hr), 'head', [0, hy, 4], [1, 0.92, 1], undefined, tint ?? undefined)
      const sn = props.snout ?? 1
      add(S(k === 'dino' ? 16 : 10), 'head', [0, hy - 8, 24 + (sn - 1) * 8], [1 * sn, 0.72, 1.05 * sn], undefined, tint ?? undefined)
      add(S(3.4), null, [-12, hy + 6, 26]); add(S(3.4), null, [12, hy + 6, 26])
      ;[-1, 1].forEach(s => {
        add(S(16), 'legs', [s * 18, tall ? 8 : 10, 12], [1, tall ? 0.5 : 0.62, tall ? 1.6 : 1.3], undefined, tint ?? undefined)
        add(new THREE.CapsuleGeometry(8, 16, 8, 16), 'arms', [s * 34, 60, 10], undefined, [0.3, 0, -s * 0.5], tint ?? undefined)
      })
      const e = props.ear ?? 1
      if (k === 'bear') [-1, 1].forEach(s => add(S(10 * e), 'ears', [s * 22, hy + 24, 0], [1, 1, 0.6], undefined, tint ?? undefined))
      if (k === 'cat') [-1, 1].forEach(s => add(new THREE.ConeGeometry(10, 22 * e, 24), 'ears', [s * 17, hy + 26 + 4 * e, 2], undefined, [0, 0, -s * 0.25], tint ?? undefined))
      if (k === 'bunny') [-1, 1].forEach(s => add(S(8), 'ears', [s * 11, hy + 34 + 18 * e, 0], [1, 3.4 * e, 0.6], [0, 0, -s * 0.12], tint ?? undefined))
      const tail = k === 'dino' ? v.tail : k === 'cat' ? 'thin' : 'none'
      if (tail === 'dragon') add(new THREE.ConeGeometry(16, 64, 32), 'tail', [0, 18, -46], undefined, [-Math.PI / 2 - 0.25, 0, 0], tint ?? undefined)
      if (tail === 'thin') { const c = new THREE.CatmullRomCurve3([[0, 14, -30], [0, 10, -58], [0, 40, -72], [0, 70, -64]].map(p => new THREE.Vector3(p[0], p[1], p[2]))); add(new THREE.TubeGeometry(c, 48, 5, 12, false), 'tail', [0, 0, 0], undefined, undefined, tint ?? undefined) }
      const n = k === 'dino' ? v.spikes : 0
      for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1), a = -0.35 - t * 1.45; add(new THREE.ConeGeometry(n === 3 ? 10 : 7, n === 3 ? 22 : 17, 24), 'spikes', [0, 84 + 58 * Math.cos(a + 0.35) * (1 - t * 0.25), -40 * Math.sin(-a) + 4], undefined, [a, 0, 0]) }
      const line = (key: string, pts: number[][], closed = false) => {
        const g = new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), closed).getPoints(90))
        const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xf3a27a, dashSize: 4, gapSize: 3, transparent: true }))
        l.computeLineDistances(); l.renderOrder = 3; r.model.add(l); (r.lines[key] = r.lines[key] || []).push(l)
      }
      const ring = (cx: number, cy: number, cz: number, rad: number, pl: 'xy' | 'xz' | 'yz') => Array.from({ length: 20 }, (_, i) => { const a = i / 20 * Math.PI * 2; return pl === 'xy' ? [cx + rad * Math.cos(a), cy + rad * Math.sin(a), cz] : pl === 'xz' ? [cx + rad * Math.cos(a), cy, cz + rad * Math.sin(a)] : [cx, cy + rad * Math.sin(a), cz + rad * Math.cos(a)] })
      line('back', [[0, hy + hr - 1, 6], [0, hy + 14, -hr + 2], [0, 84, -35.5], [0, 50, -36], [0, 18, -31]])
      line('belly', [[0, 88, 22], [0, 64, 30.5], [0, 38, 30.5], [0, 14, 22]])
      line('head', ring(0, hy, 4, hr + 0.6, 'xy'), true)
      ;[-1, 1].forEach(s => { line('leg', ring(s * 18, 16, 12, 15.5, 'xz'), true); line('arm', ring(s * 29, 70, 10, 8.6, 'xz'), true) })
      if (tail !== 'none') line('tail', ring(0, 20, -34, 13.5, 'yz'), true)
      if (k === 'dino') line('chin', [[-9, hy - 16, 31], [0, hy - 19, 35], [9, hy - 16, 31]])
      const shell = new THREE.Group()
      ;[[bodyGeo, [0, 2, 0], [1, 1, 0.92]], [S(hr), [0, hy, 4], [1, 0.92, 1]]].forEach(a => { const m = new THREE.Mesh(a[0] as THREE.BufferGeometry, new THREE.MeshBasicMaterial({ color: 0xf3a27a, wireframe: true, transparent: true, opacity: 0.22 })); m.position.set(...(a[1] as [number, number, number])); m.scale.set(...(a[2] as [number, number, number])); shell.add(m) })
      r.model.add(shell); r.shell = shell
    }
    const fm = new THREE.Mesh(new THREE.BoxGeometry(18, 3.2, 3.2), new THREE.MeshBasicMaterial({ color: 0x3fb8a8 })); fm.renderOrder = 5; r.model.add(fm); r.fill = fm
    r.model.scale.setScalar(props.size ?? 1)
    look()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.kind, v.spikes, v.tail, props.color, props.size, props.ear, props.snout, props.custom])

  function look() {
    const r = R.current; if (!r) return
    const p = propsRef.current, hi = new Set(p.highlight || []), op = p.opacity ?? 1
    r.meshes.forEach((m: any) => {
      const on = hi.has(m.userData.part)
      m.material.color.setHex(on ? 0xf3a27a : m.material.userData.base)
      m.material.emissive.setHex(on ? 0x3a1405 : 0); m.material.opacity = op; m.material.depthWrite = op > 0.97
    })
    Object.keys(r.lines).forEach(k => r.lines[k].forEach((l: any) => { const on = !p.seams || p.seams[k] !== false; l.material.opacity = on ? 1 : 0.18; l.visible = p.showSeams !== false }))
    if (r.fill) { r.fill.visible = !!p.fill; if (p.fill) r.fill.position.set(...(FILL3D[p.fill] as unknown as [number, number, number])) }
    if (r.shell) { const f = 1 + (p.inflate || 0) / 100; r.shell.visible = (p.inflate || 0) > 0; r.shell.scale.setScalar(f); r.shell.position.y = -70 * (f - 1) }
    r.axes.visible = p.axes !== false; r.grid.visible = p.axes !== false
  }
  useEffect(look, [props.highlight?.join(), JSON.stringify(props.seams), props.showSeams, props.fill, props.inflate, props.opacity, props.axes])

  return <div ref={host} className={cn('relative overflow-hidden', props.className)} />
})
