import { useCallback, useEffect, useState } from 'react'
import { storage } from '../lib/storage/index.js'
import { REVOKED, ROLES, SELF_REGISTER_ROLE } from '../lib/roles.js'
import { ALLOWED_DOMAIN } from '../lib/config.js'
import { Button, Card, Field, Input, Select } from './ui.jsx'

/**
 * Módulo 1 — gestión de roles.
 *
 * La colección `roles` es lo que abre el panel: sin documento no se entra, por
 * mucho que la cuenta de Google sea válida. Esta pantalla evita tener que dar
 * de alta a la gente desde la consola de Firebase.
 */
export function RoleManager({ currentEmail }) {
  const [people, setPeople] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    const list = await storage.listRoles()
    setPeople([...list].sort((a, b) => a.email.localeCompare(b.email, 'es')))
  }, [])

  useEffect(() => {
    let cancelled = false
    storage
      .listRoles()
      .then((list) => {
        if (cancelled) return
        setPeople(
          [...list].sort((a, b) => a.email.localeCompare(b.email, 'es')),
        )
      })
      .catch((issue) => {
        console.error('[qrsuite] no se pudieron leer los roles', issue)
        if (!cancelled) setError('No se pudo leer la lista de personas.')
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleAdd(event) {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()
    const domain = normalized.split('@')[1]

    if (!domain) {
      setError('Introduce un correo válido.')
      return
    }
    if (domain !== ALLOWED_DOMAIN.toLowerCase()) {
      setError(`Solo se permiten cuentas @${ALLOWED_DOMAIN}.`)
      return
    }

    setError('')
    setBusy(true)
    try {
      await storage.setRole(normalized, role)
      await refresh()
      setEmail('')
    } catch (issue) {
      console.error('[qrsuite] no se pudo asignar el rol', issue)
      setError('No se pudo guardar. Comprueba que tu rol sea Administrador.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(target) {
    setBusy(true)
    try {
      await storage.removeRole(target)
      await refresh()
    } catch (issue) {
      console.error('[qrsuite] no se pudo quitar el acceso', issue)
      setError('No se pudo quitar el acceso.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold">Personas con acceso</h2>
        <p className="mt-1 text-sm text-brand-ink/65">
          Quien entra con una cuenta @{ALLOWED_DOMAIN} se registra solo como{' '}
          {ROLES[SELF_REGISTER_ROLE]?.label}. Aquí cambias su rol o le retiras
          el acceso.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end"
      >
        <Field label="Correo">
          <Input
            type="email"
            value={email}
            disabled={busy}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={`persona@${ALLOWED_DOMAIN}`}
            required
          />
        </Field>
        <Field label="Rol">
          <Select
            value={role}
            disabled={busy}
            onChange={(event) => setRole(event.target.value)}
          >
            {Object.values(ROLES).map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" disabled={busy}>
          Asignar rol
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {!loaded ? (
        <p className="text-sm text-brand-ink/65">Cargando…</p>
      ) : people.length === 0 ? (
        <p className="text-sm text-brand-ink/65">
          Todavía no ha entrado nadie.
        </p>
      ) : (
        <ul className="divide-y divide-brand-page">
          {people.map((person) => (
            <li
              key={person.email}
              className="flex flex-wrap items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-ink">
                  {person.email}
                </p>
                <p
                  className={`text-xs ${
                    person.role === REVOKED
                      ? 'font-semibold text-red-600'
                      : 'text-brand-ink/65'
                  }`}
                >
                  {person.role === REVOKED
                    ? 'Acceso retirado'
                    : ROLES[person.role]?.label || person.role}
                </p>
              </div>
              {person.email === currentEmail ? (
                <span className="text-xs font-semibold text-brand-ink/65">
                  Tu cuenta
                </span>
              ) : person.role === REVOKED ? null : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRemove(person.email)}
                  className="rounded-full px-3 py-1 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  Retirar acceso
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
