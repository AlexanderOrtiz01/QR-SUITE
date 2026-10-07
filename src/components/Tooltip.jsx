import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { IconInfo } from './icons.jsx'

// Separación entre el globo y su elemento, y respecto a los bordes de la
// ventana.
const GAP = 8
const EDGE = 8
// Un instante antes de abrir con el ratón, para que barrer la pantalla no
// vaya encendiendo globos a su paso.
const HOVER_DELAY = 250

/**
 * Globo de ayuda.
 *
 * Se pinta en un portal con posición fija para que ninguna tarjeta con
 * `overflow` lo recorte, y se recoloca dentro de la ventana: arriba si cabe,
 * si no debajo (o a la derecha/izquierda con `side="right"`).
 *
 * El texto vive también, oculto, junto al elemento y enlazado con
 * `aria-describedby`: el lector de pantalla lo anuncia sin depender del globo.
 * Con el ratón se abre al pasar; con teclado, al enfocar; en pantallas
 * táctiles, `toggleOnTap` lo abre y cierra con un toque.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  toggleOnTap = false,
  className = 'inline-flex max-w-full',
}) {
  const id = useId()
  const anchorRef = useRef(null)
  const tipRef = useRef(null)
  const timerRef = useRef(0)
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState(null)

  const show = useCallback(() => {
    window.clearTimeout(timerRef.current)
    setOpen(true)
  }, [])
  const hide = useCallback(() => {
    window.clearTimeout(timerRef.current)
    setOpen(false)
    setPlace(null)
  }, [])

  const measure = useCallback(() => {
    const anchor = anchorRef.current?.getBoundingClientRect()
    const tip = tipRef.current?.getBoundingClientRect()
    if (!anchor || !tip) return
    const { innerWidth: vw, innerHeight: vh } = window
    const clamp = (value, max) => Math.min(Math.max(value, EDGE), max - EDGE)

    if (side === 'right' || side === 'left') {
      const fitsRight = anchor.right + GAP + tip.width <= vw - EDGE
      const fitsLeft = anchor.left - GAP - tip.width >= EDGE
      const right = side === 'right' ? fitsRight || !fitsLeft : !fitsLeft
      setPlace({
        left: right ? anchor.right + GAP : anchor.left - GAP - tip.width,
        top: clamp(
          anchor.top + anchor.height / 2 - tip.height / 2,
          vh - tip.height,
        ),
        from: '0px',
      })
      return
    }

    const above = anchor.top - GAP - tip.height >= EDGE
    setPlace({
      left: clamp(
        anchor.left + anchor.width / 2 - tip.width / 2,
        vw - tip.width,
      ),
      top: above ? anchor.top - GAP - tip.height : anchor.bottom + GAP,
      from: above ? '3px' : '-3px',
    })
  }, [side])

  useLayoutEffect(() => {
    if (open) measure()
  }, [open, measure, content])

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') hide()
    }
    function onOutside(event) {
      if (!anchorRef.current?.contains(event.target)) hide()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onOutside)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onOutside)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [open, hide])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  if (!content) return children

  const trigger = isValidElement(children)
    ? cloneElement(children, {
        'aria-describedby': [children.props['aria-describedby'], id]
          .filter(Boolean)
          .join(' '),
      })
    : children

  return (
    <span
      ref={anchorRef}
      className={className}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return
        window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(show, HOVER_DELAY)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') hide()
      }}
      onPointerUp={(event) => {
        if (toggleOnTap && event.pointerType !== 'mouse') {
          if (open) hide()
          else show()
        }
      }}
      onFocus={(event) => {
        // Solo el foco de teclado: el que deja un clic no debe abrir nada.
        if (event.target.matches?.(':focus-visible')) show()
      }}
      onBlur={hide}
    >
      {trigger}
      <span id={id} className="sr-only">
        {content}
      </span>
      {open
        ? createPortal(
            <span
              ref={tipRef}
              aria-hidden="true"
              className="pointer-events-none fixed z-[60] block w-max max-w-[min(16rem,calc(100vw-1rem))] rounded-xl bg-brand-ink px-3 py-2 text-xs leading-snug font-medium text-white shadow-soft-sm"
              style={{
                left: place?.left ?? 0,
                top: place?.top ?? 0,
                visibility: place ? 'visible' : 'hidden',
                '--tip-from': place?.from,
                animation: place
                  ? 'tip-entra .16s var(--ease-ios) both'
                  : undefined,
              }}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}

/**
 * Icono de información con su globo: sustituye a los textos de ayuda que
 * antes ocupaban una línea bajo cada campo o título.
 */
export function InfoTip({
  children,
  label = 'Más información',
  className = '',
}) {
  return (
    <Tooltip content={children} toggleOnTap>
      <button
        type="button"
        aria-label={label}
        className={`grid size-5 shrink-0 place-items-center rounded-full text-brand-ink/40 transition-colors hover:text-brand-ink/80 focus-visible:text-brand-ink/80 ${className}`}
      >
        <IconInfo className="size-4" />
      </button>
    </Tooltip>
  )
}
