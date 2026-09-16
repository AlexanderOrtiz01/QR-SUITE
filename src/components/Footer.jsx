import { useEffect, useState } from 'react'
import { IconChevronUp, IconFacebook, IconInstagram, IconX } from './icons.jsx'

/**
 * Pie institucional, calcado del que usan los portales de gobierno: redes a
 * la izquierda, emblema centrado, enlace legal a la derecha y un botón de
 * subida anclado a la esquina. El charcoal es el del tema oficial, no el azul
 * del panel: marca dónde termina la herramienta y empieza la institución.
 */
const SOCIAL = [
  { label: 'Facebook', href: 'https://www.facebook.com/', Icon: IconFacebook },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    Icon: IconInstagram,
  },
  { label: 'X', href: 'https://x.com/', Icon: IconX },
]

const TERMS_URL = '#'

const SHOW_TOP_AFTER = 120

function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_TOP_AFTER)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      className={`fixed right-4 bottom-4 z-20 flex size-11 items-center justify-center rounded-md bg-footer-deep text-footer-ink shadow-soft transition-[opacity,transform,background-color] duration-300 ease-out hover:bg-footer-ink hover:text-footer-deep focus-visible:outline-footer-ink ${
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
  return (
    <footer className="mt-auto bg-footer text-footer-ink">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:py-9">
        <nav aria-label="Redes sociales" className="order-2 lg:order-1">
          <ul className="flex items-center justify-center gap-10 lg:justify-start lg:gap-14">
            {SOCIAL.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="block rounded-full p-2 text-footer-ink/80 transition-colors hover:text-white focus-visible:outline-footer-ink"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <img
          src="/footer-logo.svg"
          alt="Gobierno de El Salvador"
          width="409"
          height="69"
          className="order-1 mx-auto h-14 w-auto max-w-full sm:h-16 lg:order-2 lg:h-[4.5rem]"
        />

        <p className="order-3 text-center text-sm lg:text-right">
          <a
            href={TERMS_URL}
            className="rounded-sm text-footer-ink/90 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-footer-ink"
          >
            Términos y condiciones
          </a>
        </p>
      </div>
      <BackToTop />
    </footer>
  )
}
