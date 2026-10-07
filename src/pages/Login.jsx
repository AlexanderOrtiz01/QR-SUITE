import { useState } from 'react'
import { useApp } from '../store/useApp.js'
import { ALLOWED_DOMAIN } from '../lib/config.js'
import { ROLES } from '../lib/roles.js'
import {
  describeAuthError,
  isAuthEnabled,
  signInLocal,
  signInWithGoogle,
} from '../lib/auth.js'
import {
  Banner,
  Button,
  Field,
  Input,
  Picture,
  Select,
} from '../components/ui.jsx'
import { IconGoogle } from '../components/icons.jsx'

/**
 * Módulo 1 — acceso.
 *
 * Con Firebase configurado el acceso real es Google Provider acotado al
 * dominio institucional. Sin credenciales queda el sustituto del MVP, que solo
 * valida el dominio en cliente y deja elegir rol: no es control de acceso.
 */

// Una tesela de la trama: módulos de tamaño y posición desiguales, porque una
// retícula regular delataría el mosaico y dejaría de parecer un código.
const MODULES = [
  [14, 6, 6, 5],
  [7, 28, 10, 2.5],
  [10, 44, 4, 3.5],
  [6, 64, 14, 2],
  [7, 10, 30, 2.5],
  [12, 32, 34, 4],
  [7, 56, 30, 2.5],
  [10, 18, 52, 3.5],
  [6, 40, 58, 2],
  [9, 62, 50, 3],
  [6, 4, 68, 2],
  [7, 70, 70, 2.5],
]
const TILE = 80
const MODULE_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}">${MODULES.map(
    ([size, x, y, r]) =>
      `<rect width="${size}" height="${size}" x="${x}" y="${y}" rx="${r}" fill="#fff"/>`,
  ).join('')}</svg>`,
)}")`

/**
 * Fondo de módulos en movimiento. Evoca la trama de un código sin dibujar uno
 * falso: los módulos sueltos derivan despacio en diagonal, una luz cruza el
 * azul y las dos marcas de posición flotan en las esquinas.
 *
 * Solo se anima `transform`, que el navegador resuelve sin repintar. La trama
 * se desplaza exactamente una tesela por ciclo, así que el bucle no tiene
 * costura; la máscara que la apaga hacia abajo va en el padre, quieta, para
 * que el degradado no viaje con ella. Con movimiento reducido todo queda fijo.
 */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* Las luces son degradados radiales y no círculos con `filter: blur`:
          un desenfoque de ese radio se recalcula en cada fotograma. */}
      <div className="absolute -top-1/4 -left-1/4 size-[70vmax] bg-[radial-gradient(closest-side,rgb(127_179_255/0.28),transparent)] will-change-transform [animation:luz-deriva_24s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
      <div className="absolute -right-1/4 -bottom-1/3 size-[60vmax] bg-[radial-gradient(closest-side,rgb(26_72_230/0.45),transparent)] will-change-transform [animation:luz-deriva_30s_ease-in-out_-8s_infinite_alternate-reverse] motion-reduce:animate-none" />

      {/* Capa propia para la máscara, de modo que se aplique al componer y no
          obligue a repintar la trama en cada fotograma. */}
      <div className="absolute inset-0 transform-gpu overflow-hidden [mask-image:linear-gradient(to_bottom,rgb(0_0_0/0.5),transparent_70%)]">
        <div
          className="absolute -inset-20 opacity-[0.16] will-change-transform [animation:trama-deriva_25s_linear_infinite] motion-reduce:animate-none"
          style={{
            backgroundImage: MODULE_TILE,
            backgroundSize: `${TILE}px ${TILE}px`,
          }}
        />
      </div>

      {/* Las marcas de posición de un QR, a tamaño de página. */}
      <span className="absolute -top-16 -right-20 size-80 rounded-[3.5rem] border-[18px] border-white/6 will-change-transform [animation:marca-flota_11s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
      <span className="absolute -bottom-24 -left-24 size-96 rounded-[4rem] border-[20px] border-white/5 will-change-transform [animation:marca-flota_14s_ease-in-out_-5s_infinite_alternate-reverse] motion-reduce:animate-none" />
    </div>
  )
}

function GoogleAccess() {
  const { authError, setAuthError } = useApp()
  const [busy, setBusy] = useState(false)

  async function handleSignIn() {
    setBusy(true)
    setAuthError('')
    try {
      await signInWithGoogle(ALLOWED_DOMAIN)
    } catch (error) {
      console.error('[qrsuite] fallo al iniciar sesión', error)
      setAuthError(describeAuthError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        size="lg"
        className="w-full"
        onClick={handleSignIn}
        loading={busy}
      >
        {/* Mientras se abre Google, el indicador ocupa el sitio del logotipo. */}
        {busy ? null : (
          <span className="grid size-6 place-items-center rounded-full bg-white">
            <IconGoogle className="size-4" />
          </span>
        )}
        {busy ? 'Abriendo Google…' : 'Continuar con Google'}
      </Button>

      {authError ? (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {authError}
        </p>
      ) : null}
    </div>
  )
}

function SimulatedAccess() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('admin')
  const [error, setError] = useState('')
  const [entering, setEntering] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) {
      setError('Introduce un correo válido.')
      return
    }
    if (domain !== ALLOWED_DOMAIN.toLowerCase()) {
      setError(`Solo se permiten cuentas @${ALLOWED_DOMAIN}.`)
      return
    }
    setError('')
    setEntering(true)
    signInLocal({ email, role, signed_in_at: new Date().toISOString() })
    // El observador local solo lee al montar, así que la recarga es lo que
    // publica la sesión recién guardada.
    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Banner tone="warning">
        Acceso simulado: Firebase no está configurado en este entorno.
      </Banner>
      <Field label="Correo">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={`usuario@${ALLOWED_DOMAIN}`}
          required
        />
      </Field>
      <Field label="Rol" hint={ROLES[role]?.hint}>
        <Select value={role} onChange={(event) => setRole(event.target.value)}>
          {Object.values(ROLES).map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" loading={entering}>
        {entering ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

export function Login() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-linear-160 from-brand-deep via-brand-hero to-brand-hero-light">
      <Backdrop />

      <div className="relative grid min-h-dvh place-items-center px-4 py-12">
        <div
          className="w-full max-w-sm [animation:rise_.55s_cubic-bezier(.16,1,.3,1)]"
          style={{ animationDelay: '60ms' }}
        >
          {/* Sin `backdrop-filter`: con el fondo en movimiento, el desenfoque
              tendría que recalcularse en cada fotograma. Detrás solo hay
              degradados suaves, así que el vidrio se ve igual sin él. */}
          <div
            className="glass-thick rounded-[2.25rem] p-6 sm:p-8"
            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          >
            <Picture
              src="/logo-azul-192.webp"
              alt=""
              width="192"
              height="192"
              className="size-14"
            />
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-brand-ink">
              QR Suite
            </h1>
            <p className="mt-1 mb-7 text-sm text-brand-ink/65">
              {isAuthEnabled
                ? `Acceso con tu cuenta @${ALLOWED_DOMAIN}`
                : 'Códigos QR dinámicos'}
            </p>

            {isAuthEnabled ? <GoogleAccess /> : <SimulatedAccess />}
          </div>
        </div>
      </div>
    </div>
  )
}
