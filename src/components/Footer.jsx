import { useEffect, useRef, useState } from 'react'
import { IconChevronUp } from './icons.jsx'
import { Picture } from './ui.jsx'

/**
 * Pie institucional: emblema centrado sobre vidrio charcoal, el tono del tema
 * oficial, y un botón de subida anclado a la esquina. Es la única lámina
 * oscura: marca dónde termina la herramienta y empieza la institución.
 */
const SHOW_TOP_AFTER = 120
// Separación del botón respecto al borde inferior y al pie (1rem).
const TOP_GAP = 16

/**
 * Al llegar al final, el botón se detiene sobre el pie en lugar de taparle el
 * emblema: sube lo que asoma el pie por debajo de la ventana.
 */
function BackToTop({ footerRef }) {
  const [visible, setVisible] = useState(false)
  const [lift, setLift] = useState(0)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_TOP_AFTER)
      const top = footerRef.current?.getBoundingClientRect().top
      setLift(top === undefined ? 0 : Math.max(0, window.innerHeight - top))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [footerRef])

  function scrollToTop() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Volver arriba"
      tabIndex={visible ? 0 : -1}
      style={{ bottom: lift + TOP_GAP }}
      className={`glass-thick fixed right-4 z-20 flex size-11 items-center justify-center rounded-full text-brand-ink transition-[opacity,transform,background-color] duration-300 ease-ios hover:bg-white active:scale-95 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <IconChevronUp className="size-5" />
    </button>
  )
}

export function Footer() {
  const footerRef = useRef(null)

  return (
    <footer
      ref={footerRef}
      className="glass-dark mt-auto text-footer-ink lg:mr-3 lg:mb-3 lg:rounded-[1.75rem]"
    >
      <div
        data-velo
        className="mx-auto flex max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:py-7"
      >
        <Picture
          src="/footer-logo.svg"
          alt="Gobierno de El Salvador"
          width="409"
          height="69"
          className="h-11 w-auto max-w-full sm:h-12 lg:h-[3.375rem]"
        />
      </div>
      <BackToTop footerRef={footerRef} />
    </footer>
  )
}
