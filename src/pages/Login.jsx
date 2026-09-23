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
import { Banner, Button, Field, Input, Select } from '../components/ui.jsx'
import { IconGoogle } from '../components/icons.jsx'

/**
 * Módulo 1 — acceso.
 *
 * Con Firebase configurado el acceso real es Google Provider acotado al
 * dominio institucional. Sin credenciales queda el sustituto del MVP, que solo
 * valida el dominio en cliente y deja elegir rol: no es control de acceso.
 */

/**
 * Fondo de módulos. Evoca la trama de un código sin dibujar uno falso: los
 * tres cuadros grandes son las marcas de posición que todo QR lleva en sus
 * esquinas, y el resto son módulos sueltos que se apagan hacia abajo.
 */
function Backdrop() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    >
      <defs>
        <pattern
          id="qr-modules"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          {/* Módulos de tamaño y posición desiguales: una retícula regular
              delataría el mosaico y dejaría de parecer la trama de un código. */}
          <rect width="14" height="14" x="6" y="6" rx="5" fill="#fff" />
          <rect width="7" height="7" x="28" y="10" rx="2.5" fill="#fff" />
          <rect width="10" height="10" x="44" y="4" rx="3.5" fill="#fff" />
          <rect width="6" height="6" x="64" y="14" rx="2" fill="#fff" />
          <rect width="7" height="7" x="10" y="30" rx="2.5" fill="#fff" />
          <rect width="12" height="12" x="32" y="34" rx="4" fill="#fff" />
          <rect width="7" height="7" x="56" y="30" rx="2.5" fill="#fff" />
          <rect width="10" height="10" x="18" y="52" rx="3.5" fill="#fff" />
          <rect width="6" height="6" x="40" y="58" rx="2" fill="#fff" />
          <rect width="9" height="9" x="62" y="50" rx="3" fill="#fff" />
          <rect width="6" height="6" x="4" y="68" rx="2" fill="#fff" />
          <rect width="7" height="7" x="70" y="70" rx="2.5" fill="#fff" />
        </pattern>
        <linearGradient id="qr-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="qr-mask">
          <rect width="100%" height="100%" fill="url(#qr-fade)" />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#qr-modules)"
        mask="url(#qr-mask)"
        opacity="0.16"
      />
    </svg>
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
      <Button className="w-full py-3" onClick={handleSignIn} disabled={busy}>
        <span className="grid size-6 place-items-center rounded-full bg-white">
          <IconGoogle className="size-4" />
        </span>
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
      <Button type="submit" className="w-full py-3">
        Entrar
      </Button>
    </form>
  )
}

export function Login() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-linear-160 from-brand-deep via-brand-hero to-brand-hero-light">
      <Backdrop />
      {/* Las marcas de posición de un QR, a tamaño de página. */}
      <span
        aria-hidden="true"
        className="absolute -top-16 -right-20 size-80 rounded-[3.5rem] border-[18px] border-white/6"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-24 -left-24 size-96 rounded-[4rem] border-[20px] border-white/5"
      />

      <div className="relative grid min-h-dvh place-items-center px-4 py-12">
        <div
          className="w-full max-w-sm [animation:rise_.55s_cubic-bezier(.16,1,.3,1)]"
          style={{ animationDelay: '60ms' }}
        >
          <div className="rounded-3xl bg-white p-8 shadow-soft">
            <img
              src="/logo-azul.png"
              alt=""
              width="512"
              height="512"
              className="size-14"
            />
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-brand-ink">
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
