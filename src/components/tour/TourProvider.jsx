import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { getTour } from '../../lib/tours.js'
import { IconClose } from '../icons.jsx'

/*
 * Motor de las guías interactivas. Un único proveedor guarda qué guía corre y
 * en qué paso va; el overlay (portal en body) oscurece la pantalla, abre un
 * «agujero» sobre el elemento `[data-tour="…"]` del paso, dibuja una flecha
 * desde la tarjeta hasta él y muestra la tarjeta de vidrio con los controles.
 */

const STORAGE_KEY = 'qrsuite:tours-done'
const PAD = 8 // margen del agujero alrededor del elemento
const GAP = 64 // separación tarjeta-elemento: deja sitio a la flecha
const EDGE = 16 // margen mínimo con los bordes de la ventana
const NARROW = 640 // por debajo, la tarjeta va abajo a ancho completo
const SEARCH_MS = 3000
const POLL_MS = 100
const MORPH_MS = 520
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
const DIM = 'rgb(15 31 99 / 0.55)'

const TourContext = createContext(null)

function readDone() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function writeDone(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Sin almacenamiento (modo privado): la guía funciona igual.
  }
}

function findTarget(target) {
  if (!target) return null
  const el = document.querySelector(`[data-tour="${CSS.escape(target)}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return r.width > 0 || r.height > 0 ? el : null
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return undefined
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max))

/** Rectángulo del agujero: el del elemento más el margen. */
function padRect(r) {
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
    bottom: r.bottom + PAD,
    right: r.right + PAD,
  }
}

/** Posición de la tarjeta junto al agujero, eligiendo el lado con sitio. */
function placeCard(spot, cw, ch, vw, vh, placement) {
  if (!spot) return { left: (vw - cw) / 2, top: (vh - ch) / 2 }
  const room = {
    bottom: vh - spot.bottom - GAP - EDGE >= ch,
    top: spot.top - GAP - EDGE >= ch,
    right: vw - spot.right - GAP - EDGE >= cw,
    left: spot.left - GAP - EDGE >= cw,
  }
  let side =
    placement && placement !== 'auto' && room[placement]
      ? placement
      : ['bottom', 'right', 'top', 'left'].find((s) => room[s])
  if (!side) {
    // No cabe en ningún lado: al de más espacio vertical, aunque solape.
    side = vh - spot.bottom > spot.top ? 'bottom' : 'top'
  }
  const cx = spot.left + spot.width / 2
  const cy = spot.top + spot.height / 2
  let left
  let top
  if (side === 'bottom' || side === 'top') {
    left = cx - cw / 2
    top = side === 'bottom' ? spot.bottom + GAP : spot.top - GAP - ch
  } else {
    top = cy - ch / 2
    left = side === 'right' ? spot.right + GAP : spot.left - GAP - cw
  }
  return {
    left: clamp(left, EDGE, vw - cw - EDGE),
    top: clamp(top, EDGE, vh - ch - EDGE),
  }
}

/**
 * Flecha curva desde el borde de la tarjeta (C) hasta el borde del agujero
 * (S). Devuelve el trazo y la punta, o null si se solapan.
 */
function arrowGeometry(S, C) {
  const m = 10
  const scx = S.left + S.width / 2
  const scy = S.top + S.height / 2
  let sx
  let sy
  let ex
  let ey
  if (C.top >= S.bottom + m) {
    sx = clamp(scx, C.left + 36, C.right - 36)
    sy = C.top - 6
    ex = clamp(sx, S.left + 18, S.right - 18)
    ey = S.bottom + 6
  } else if (C.bottom <= S.top - m) {
    sx = clamp(scx, C.left + 36, C.right - 36)
    sy = C.bottom + 6
    ex = clamp(sx, S.left + 18, S.right - 18)
    ey = S.top - 6
  } else if (C.left >= S.right + m) {
    sx = C.left - 6
    sy = clamp(scy, C.top + 36, C.bottom - 36)
    ex = S.right + 6
    ey = clamp(sy, S.top + 14, S.bottom - 14)
  } else if (C.right <= S.left - m) {
    sx = C.right + 6
    sy = clamp(scy, C.top + 36, C.bottom - 36)
    ex = S.left - 6
    ey = clamp(sy, S.top + 14, S.bottom - 14)
  } else {
    return null
  }
  const dx = ex - sx
  const dy = ey - sy
  const len = Math.hypot(dx, dy)
  if (len < 24) return null
  // Punto de control desplazado en perpendicular: curva suave y constante.
  const bow = Math.min(46, len * 0.32)
  const qx = (sx + ex) / 2 + (-dy / len) * bow
  const qy = (sy + ey) / 2 + (dx / len) * bow
  const a = Math.atan2(ey - qy, ex - qx)
  const h = 11
  const h1 = [ex - h * Math.cos(a - 0.5), ey - h * Math.sin(a - 0.5)]
  const h2 = [ex - h * Math.cos(a + 0.5), ey - h * Math.sin(a + 0.5)]
  const f = (n) => n.toFixed(1)
  return {
    sx,
    sy,
    ex,
    ey,
    d: `M${f(sx)} ${f(sy)} Q${f(qx)} ${f(qy)} ${f(ex)} ${f(ey)}`,
    head: `M${f(h1[0])} ${f(h1[1])} L${f(ex)} ${f(ey)} L${f(h2[0])} ${f(h2[1])}`,
  }
}

const KEYFRAMES = `
@keyframes qr-tour-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes qr-tour-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes qr-tour-in {
  from { opacity: 0; transform: translateY(8px) scale(0.97) }
  to { opacity: 1; transform: none }
}
@keyframes qr-tour-text {
  from { opacity: 0; transform: translateY(4px) }
  to { opacity: 1; transform: none }
}
@keyframes qr-tour-pulse {
  0% { opacity: 0.85; transform: scale(1) }
  70%, 100% { opacity: 0; transform: scale(1.06) }
}
`

export function TourProvider({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [run, setRun] = useState(null) // { tourId, stepIndex }
  const [view, setView] = useState(null) // paso ya localizado: { tourId, stepIndex, el }
  const [done, setDone] = useState(readDone)
  const returnFocus = useRef(null)

  const tour = run ? getTour(run.tourId) : null
  const total = tour?.steps?.length ?? 0

  const stop = useCallback(() => {
    setRun(null)
    setView(null)
    const prev = returnFocus.current
    returnFocus.current = null
    if (prev && typeof prev.focus === 'function' && prev.isConnected) {
      prev.focus({ preventScroll: true })
    }
  }, [])

  const finish = useCallback(
    (tourId) => {
      if (tourId) {
        setDone((ids) => {
          if (ids.includes(tourId)) return ids
          const next = [...ids, tourId]
          writeDone(next)
          return next
        })
      }
      stop()
    },
    [stop],
  )

  const start = useCallback((tourId) => {
    const t = getTour(tourId)
    if (!t || !t.steps?.length) return
    if (!returnFocus.current) returnFocus.current = document.activeElement
    setView(null)
    setRun({ tourId, stepIndex: 0 })
  }, [])

  const goTo = useCallback(
    (index) => {
      setRun((r) => (r ? { ...r, stepIndex: index } : r))
    },
    [setRun],
  )

  const next = useCallback(() => {
    if (!run) return
    if (run.stepIndex >= total - 1) finish(run.tourId)
    else goTo(run.stepIndex + 1)
  }, [run, total, finish, goTo])

  const prev = useCallback(() => {
    if (run && run.stepIndex > 0) goTo(run.stepIndex - 1)
  }, [run, goTo])

  const isDone = useCallback((tourId) => done.includes(tourId), [done])

  // Al cambiar de paso: navegar si toca y esperar a que aparezca el elemento.
  const currentPath = useEffectEvent(() => pathname)
  const reducedMotion = usePrefersReducedMotion()
  useEffect(() => {
    if (!run) return undefined
    const step = getTour(run.tourId)?.steps?.[run.stepIndex]
    if (!step) return undefined
    const route = step.route?.split(/[?#]/)[0]
    if (route && route !== currentPath()) navigate(step.route)

    let elapsed = 0
    let timer = 0
    const commit = (el) => setView({ ...run, el })
    const tick = () => {
      if (!step.target) return commit(null)
      const el = findTarget(step.target)
      if (el) {
        const r = el.getBoundingClientRect()
        const narrow = window.innerWidth < NARROW
        const bottomLimit = window.innerHeight * (narrow ? 0.5 : 1) - EDGE
        if (r.top < EDGE || r.bottom > bottomLimit) {
          el.scrollIntoView({
            block: 'center',
            inline: 'nearest',
            behavior: reducedMotion ? 'auto' : 'smooth',
          })
        }
        return commit(el)
      }
      elapsed += POLL_MS
      if (elapsed >= SEARCH_MS) return commit(null)
      timer = window.setTimeout(tick, POLL_MS)
    }
    timer = window.setTimeout(tick, 0)
    return () => window.clearTimeout(timer)
  }, [run, navigate, reducedMotion])

  const step = view ? getTour(view.tourId)?.steps?.[view.stepIndex] : null
  const value = useMemo(
    () => ({
      start,
      stop,
      next,
      prev,
      isDone,
      activeTourId: run?.tourId ?? null,
      stepIndex: run?.stepIndex ?? 0,
    }),
    [start, stop, next, prev, isDone, run],
  )

  return (
    <TourContext.Provider value={value}>
      {children}
      {run
        ? createPortal(
            <TourOverlay
              key={run.tourId}
              tour={tour}
              view={view}
              step={step}
              reducedMotion={reducedMotion}
              onNext={next}
              onPrev={prev}
              onSkip={() => finish(run.tourId)}
            />,
            document.body,
          )
        : null}
    </TourContext.Provider>
  )
}

function sameLayout(a, b) {
  if (!a || !b) return false
  return (
    a.vw === b.vw &&
    a.vh === b.vh &&
    a.cw === b.cw &&
    a.ch === b.ch &&
    a.morph === b.morph &&
    a.arrow?.d === b.arrow?.d &&
    (a.t === b.t ||
      (a.t &&
        b.t &&
        a.t.top === b.t.top &&
        a.t.left === b.t.left &&
        a.t.width === b.t.width &&
        a.t.height === b.t.height))
  )
}

function TourOverlay({
  tour,
  view,
  step,
  reducedMotion,
  onNext,
  onPrev,
  onSkip,
}) {
  const cardRef = useRef(null)
  const spotRef = useRef(null)
  const elRef = useRef(null)
  const morphUntil = useRef(0)
  const [layout, setLayout] = useState(null)
  const stepKey = view ? `${view.tourId}:${view.stepIndex}` : ''

  // Cada paso nuevo anima la máscara y la tarjeta hasta su sitio.
  useEffect(() => {
    elRef.current = view?.el ?? null
    morphUntil.current = performance.now() + MORPH_MS
  }, [view])

  // Bucle de medida: sigue al elemento al hacer scroll, redimensionar o si la
  // página lo vuelve a pintar. Solo actualiza el estado si algo cambió.
  useEffect(() => {
    let raf = 0
    let last = null
    const frame = () => {
      let el = elRef.current
      if (el && !el.isConnected && step?.target) {
        el = findTarget(step.target)
        elRef.current = el
      }
      const r = el?.isConnected ? el.getBoundingClientRect() : null
      const card = cardRef.current
      const spot = spotRef.current
      const t = r ? padRect(r) : null
      const arrow =
        t && card && spot
          ? arrowGeometry(
              spot.getBoundingClientRect(),
              card.getBoundingClientRect(),
            )
          : null
      const nextLayout = {
        vw: window.innerWidth,
        vh: window.innerHeight,
        cw: card?.offsetWidth ?? 360,
        ch: card?.offsetHeight ?? 220,
        morph: !reducedMotion && performance.now() < morphUntil.current,
        t,
        arrow,
      }
      if (!sameLayout(last, nextLayout)) {
        last = nextLayout
        setLayout(nextLayout)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [step, reducedMotion])

  // Foco en la tarjeta al abrir la guía.
  const hasView = Boolean(view)
  useEffect(() => {
    if (hasView) cardRef.current?.focus({ preventScroll: true })
  }, [hasView])

  // Teclado: Esc cierra, flechas navegan y Tab no sale de la tarjeta.
  const onKey = useEffectEvent((e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onSkip()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onNext()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onPrev()
    } else if (e.key === 'Tab' && cardRef.current) {
      const items = [
        ...cardRef.current.querySelectorAll('button:not([disabled])'),
      ]
      if (!items.length) return
      const first = items[0]
      const lastItem = items[items.length - 1]
      const active = document.activeElement
      if (!cardRef.current.contains(active)) {
        e.preventDefault()
        first.focus()
      } else if (
        e.shiftKey &&
        (active === first || active === cardRef.current)
      ) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault()
        first.focus()
      }
    }
  })
  useEffect(() => {
    const handler = (e) => onKey(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const vw = layout?.vw ?? window.innerWidth
  const vh = layout?.vh ?? window.innerHeight
  const narrow = vw < NARROW
  const t = view && layout?.t ? layout.t : null
  const morph = layout?.morph ?? false
  const transition = morph
    ? `top ${MORPH_MS}ms ${EASE}, left ${MORPH_MS}ms ${EASE}, width ${MORPH_MS}ms ${EASE}, height ${MORPH_MS}ms ${EASE}, border-radius ${MORPH_MS}ms ${EASE}`
    : 'none'

  // Sin elemento, el agujero se encoge hasta el centro: todo queda sombreado.
  const spotStyle = t
    ? {
        top: t.top,
        left: t.left,
        width: t.width,
        height: t.height,
        borderRadius: Math.min(18, t.height / 2),
      }
    : { top: vh / 2, left: vw / 2, width: 0, height: 0, borderRadius: 0 }

  const cardPos = narrow
    ? null
    : placeCard(
        t,
        layout?.cw ?? 360,
        layout?.ch ?? 220,
        vw,
        vh,
        step?.placement,
      )

  const index = view?.stepIndex ?? 0
  const total = tour?.steps?.length ?? 0
  const isLast = index >= total - 1
  const arrow = t ? layout?.arrow : null
  const titleId = 'qr-tour-title'
  const bodyId = 'qr-tour-body'

  return (
    <div className="fixed inset-0 z-[1000]" data-tour-overlay="">
      <style>{KEYFRAMES}</style>

      {/* Captura los clics fuera de la tarjeta: no cierra, solo los absorbe. */}
      <div className="absolute inset-0" aria-hidden="true" />

      <div
        ref={spotRef}
        aria-hidden="true"
        className="pointer-events-none fixed"
        style={{
          ...spotStyle,
          transition,
          boxShadow: t
            ? `0 0 0 2px rgb(127 179 255 / 0.95), 0 0 28px 6px rgb(127 179 255 / 0.45), 0 0 0 9999px ${DIM}`
            : `0 0 0 9999px ${DIM}`,
        }}
      >
        {t && !reducedMotion ? (
          <span
            key={stepKey}
            className="absolute inset-0 rounded-[inherit] border-2 border-brand-accent"
            style={{ animation: 'qr-tour-pulse 2.2s ease-out 0.5s infinite' }}
          />
        ) : null}
      </div>

      {arrow ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-visible"
          width={vw}
          height={vh}
          style={{ filter: 'drop-shadow(0 2px 6px rgb(15 31 99 / 0.55))' }}
        >
          <defs>
            <linearGradient
              id="qr-tour-arrow"
              gradientUnits="userSpaceOnUse"
              x1={arrow.sx}
              y1={arrow.sy}
              x2={arrow.ex}
              y2={arrow.ey}
            >
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <g
            key={stepKey}
            fill="none"
            stroke="url(#qr-tour-arrow)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d={arrow.d}
              pathLength="1"
              strokeDasharray="1"
              style={
                reducedMotion
                  ? undefined
                  : {
                      strokeDashoffset: 1,
                      animation: `qr-tour-draw 0.5s ${EASE} 0.28s forwards`,
                    }
              }
            />
            <path
              d={arrow.head}
              stroke="#ffffff"
              style={
                reducedMotion
                  ? undefined
                  : {
                      opacity: 0,
                      animation: 'qr-tour-fade 0.2s ease-out 0.7s forwards',
                    }
              }
            />
          </g>
        </svg>
      ) : null}

      {view && step ? (
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          tabIndex={-1}
          className={`glass-thick fixed flex flex-col gap-3 rounded-[24px] p-5 text-brand-ink outline-none ${
            narrow
              ? 'inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))]'
              : 'w-[min(360px,calc(100vw-2rem))]'
          }`}
          style={{
            ...(cardPos ?? {}),
            transition,
            animation: reducedMotion ? undefined : `qr-tour-in 0.35s ${EASE}`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold tracking-wide text-brand-primary uppercase">
              Paso {index + 1} de {total}
            </p>
            <button
              type="button"
              onClick={onSkip}
              aria-label="Cerrar guía"
              className="-m-1.5 grid size-8 place-items-center rounded-full text-brand-ink/60 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none max-lg:size-11"
            >
              <IconClose className="size-4" />
            </button>
          </div>

          <div
            className="h-1 overflow-hidden rounded-full bg-brand-primary/12"
            role="progressbar"
            aria-label="Progreso de la guía"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={index + 1}
          >
            <div
              className="h-full rounded-full bg-brand-primary"
              style={{
                width: `${((index + 1) / Math.max(total, 1)) * 100}%`,
                transition: reducedMotion ? 'none' : `width 0.4s ${EASE}`,
              }}
            />
          </div>

          <div
            key={stepKey}
            aria-live="polite"
            style={
              reducedMotion
                ? undefined
                : { animation: `qr-tour-text 0.3s ${EASE}` }
            }
          >
            <h2
              id={titleId}
              className="text-base leading-snug font-semibold text-brand-deep"
            >
              {step.title}
            </h2>
            <p
              id={bodyId}
              className="mt-1 text-sm leading-relaxed text-brand-ink/80"
            >
              {step.body}
            </p>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="mr-auto rounded-full px-2 py-1.5 text-sm font-medium text-brand-ink/60 transition-colors hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none max-lg:min-h-11"
            >
              Saltar guía
            </button>
            <button
              type="button"
              onClick={onPrev}
              disabled={index === 0}
              className="glass rounded-full px-4 py-2 text-sm font-semibold text-brand-primary-deep transition-[background-color,transform] duration-200 hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 max-lg:min-h-11"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={onNext}
              className="glass-tint rounded-full px-4 py-2 text-sm font-semibold text-white transition-[filter,transform] duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97] max-lg:min-h-11"
            >
              {isLast ? 'Terminar' : 'Siguiente'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Acceso al motor: { start, stop, next, prev, isDone, activeTourId, stepIndex }. */
// eslint-disable-next-line react-refresh/only-export-components
export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour debe usarse dentro de <TourProvider>')
  return ctx
}
