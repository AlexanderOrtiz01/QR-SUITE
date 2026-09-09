import { useState } from 'react'
import { useApp } from '../store/useApp.js'
import { ROLES } from '../lib/roles.js'
import {
  Banner,
  Button,
  Card,
  Field,
  Input,
  Select,
} from '../components/ui.jsx'

/**
 * Módulo 1 — SUSTITUTO TEMPORAL.
 *
 * El plan pide login con Google Provider restringido al dominio institucional.
 * Hasta que exista el proyecto Firebase, esta pantalla solo valida el dominio
 * del correo en cliente y deja elegir rol. No es un control de acceso real.
 */
export function Login() {
  const { settings, setSession } = useApp()
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
    if (domain !== settings.allowedDomain.toLowerCase()) {
      setError(`Solo se permiten cuentas @${settings.allowedDomain}.`)
      return
    }
    setError('')
    setSession({ email, role, signed_in_at: new Date().toISOString() })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ssf-mist">
      <div className="bg-ssf-charcoal px-4 py-4 text-center text-white">
        <p className="text-lg font-bold tracking-tight">QR Suite</p>
        <p className="text-xs text-ssf-line">
          Generador y gestor de códigos QR dinámicos
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-4">
          <Banner tone="warning">
            Acceso simulado. Firebase Auth con Google Provider aún no está
            configurado, así que esto no protege nada: solo comprueba el dominio
            del correo.
          </Banner>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Correo institucional">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={`usuario@${settings.allowedDomain}`}
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
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
