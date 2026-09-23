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
  Card,
  Field,
  Input,
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
    <Card className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-brand-ink">
          Accede al panel
        </h1>
        <p className="mt-1 text-sm text-brand-ink/65">
          Usa tu cuenta institucional <strong>@{ALLOWED_DOMAIN}</strong>. Un
          administrador debe haberte asignado un rol antes del primer acceso.
        </p>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={handleSignIn}
        disabled={busy}
      >
        <IconGoogle className="size-5" />
        {busy ? 'Abriendo Google…' : 'Continuar con Google'}
      </Button>

      {authError ? (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {authError}
        </p>
      ) : null}
    </Card>
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
    <>
      <Banner tone="warning">
        Acceso simulado. Firebase no está configurado en este entorno, así que
        esto no protege nada: solo comprueba el dominio del correo.
      </Banner>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Correo institucional">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={`usuario@${ALLOWED_DOMAIN}`}
              required
            />
          </Field>
          <Field label="Rol" hint={ROLES[role]?.hint}>
            <Select
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
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
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </Card>
    </>
  )
}

export function Login() {
  return (
    <div className="flex min-h-dvh flex-col bg-brand-page">
      <div className="bg-linear-to-r from-brand-deep to-brand-hero-light px-4 py-5 text-center text-white shadow-soft">
        <p className="text-xl font-extrabold tracking-tight">QR Suite</p>
        <p className="text-xs text-brand-accent">
          Generador y gestor de códigos QR dinámicos
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-4">
          {isAuthEnabled ? <GoogleAccess /> : <SimulatedAccess />}
        </div>
      </div>
    </div>
  )
}
