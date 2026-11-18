import { useEffect, useState } from 'react'
import { useApp } from '../store/useApp.js'
import { ROLES, can } from '../lib/roles.js'
import { PROBES, ROLE_IDS, gradeRun } from '../lib/roleTests.js'
import { canProbe, probePermissions } from '../lib/permissionProbe.js'
import { storage } from '../lib/storage/index.js'
import {
  Button,
  Card,
  CardTitle,
  Notice,
  PageHeader,
  Skeleton,
} from '../components/ui.jsx'
import { IconAlert, IconCheck } from '../components/icons.jsx'

/**
 * Prueba de permisos por rol: cada cuenta pregunta a las reglas reales de
 * Firestore qué puede hacer y deja el resultado como evidencia. El
 * administrador ve la de todas las cuentas.
 */

const OUTCOME_LABEL = {
  allowed: 'Permitido',
  denied: 'Denegado',
  skipped: 'Sin datos',
  error: 'Sin respuesta',
}

function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function Verdict({ verdict }) {
  if (verdict === 'pass') {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-brand-primary-deep">
        <IconCheck className="size-4" />
        Correcto
      </span>
    )
  }
  if (verdict === 'fail') {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-red-700">
        <IconAlert className="size-4" />
        Incorrecto
      </span>
    )
  }
  return <span className="text-brand-ink/75">No concluyente</span>
}

function ProbeTable({ results }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[30rem] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-ink/10 text-xs text-brand-ink/75">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Operación
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Esperado
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Obtenido
            </th>
            <th scope="col" className="py-2 pl-3 font-semibold">
              Resultado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-ink/8">
          {results.map((item) => (
            <tr key={item.id}>
              <th scope="row" className="py-2.5 pr-3 font-medium">
                {PROBES.find((probe) => probe.id === item.id)?.label || item.id}
              </th>
              <td className="px-3 py-2.5">{OUTCOME_LABEL[item.expected]}</td>
              <td className="px-3 py-2.5">{OUTCOME_LABEL[item.outcome]}</td>
              <td className="py-2.5 pl-3">
                <Verdict verdict={item.verdict} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AutomaticCheck({ session, onSaved }) {
  const { notify } = useApp()
  const [check, setCheck] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let cancelled = false
    storage
      .getRoleCheck(session.email)
      .then((saved) => {
        if (!cancelled) setCheck(saved)
      })
      .catch((issue) => {
        console.error('[qrsuite] no se pudo leer la prueba guardada', issue)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [session.email])

  async function run() {
    setRunning(true)
    try {
      const next = {
        email: session.email,
        role: session.role,
        results: await probePermissions(session.role),
        ran_at: new Date().toISOString(),
      }
      setCheck(next)
      try {
        await storage.saveRoleCheck(next)
        onSaved?.()
      } catch (issue) {
        console.error('[qrsuite] no se pudo guardar la prueba', issue)
        notify(
          'La prueba se hizo, pero no se pudo guardar como evidencia.',
          'error',
        )
      }
    } finally {
      setRunning(false)
    }
  }

  const grade = check ? gradeRun(check.results) : null

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle info="Prueba cada operación con tu cuenta contra las reglas de Firestore. No modifica ningún dato.">
            Tu cuenta
          </CardTitle>
          <p className="text-sm break-all text-brand-ink/75">
            {session.email} · {ROLES[session.role]?.label}
          </p>
        </div>
        <Button onClick={run} loading={running} disabled={!loaded}>
          {running
            ? 'Probando…'
            : check
              ? 'Repetir prueba'
              : 'Probar mis permisos'}
        </Button>
      </div>

      {!loaded ? (
        <Skeleton className="h-16 w-full rounded-2xl" />
      ) : check ? (
        <>
          <Notice tone={grade.ok ? 'success' : 'danger'}>
            <p className="font-semibold">
              {grade.passed} de {grade.total} correctas
              {grade.failed > 0
                ? ` · ${grade.failed} ${grade.failed === 1 ? 'fallida' : 'fallidas'}`
                : ''}
            </p>
            <p className="text-xs text-brand-ink/75">
              {formatDateTime(check.ran_at)}
            </p>
          </Notice>
          {/* El detalle se despliega solo si algo falló. */}
          <details open={!grade.ok}>
            <summary className="cursor-pointer text-sm font-semibold text-brand-primary-deep max-lg:min-h-11">
              Detalle por operación
            </summary>
            <div className="pt-3">
              <ProbeTable results={check.results} />
            </div>
          </details>
        </>
      ) : null}
    </Card>
  )
}

/** Resultado de cada cuenta (solo administrador). */
function AccountEvidence({ checks, loaded, error }) {
  const missing = ROLE_IDS.filter(
    (role) => !checks.some((check) => check.role === role),
  )
  const failing = checks.filter((check) => !gradeRun(check.results).ok).length

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <CardTitle info="Aquí queda el resultado de cada cuenta que lanza la prueba. Hace falta al menos una cuenta por rol.">
          Todas las cuentas
        </CardTitle>
        {loaded && !error && checks.length > 0 ? (
          <p className="text-sm text-brand-ink/75">
            {checks.length - failing} de {checks.length} correctas
            {failing > 0 ? ` · ${failing} con error` : ''}
          </p>
        ) : null}
      </div>
      {error ? (
        <Notice tone="danger">{error}</Notice>
      ) : !loaded ? (
        <Skeleton className="h-16 w-full rounded-2xl" />
      ) : (
        <>
          {missing.length > 0 ? (
            <Notice>
              Falta probar con una cuenta de rol{' '}
              {missing.map((role) => ROLES[role].label).join(', ')}.
            </Notice>
          ) : null}
          {checks.length > 0 ? (
            <ul className="divide-y divide-brand-ink/8">
              {checks.map((check) => {
                const grade = gradeRun(check.results)
                return (
                  <li
                    key={check.email}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold break-all">
                        {check.email}
                      </p>
                      <p className="text-xs text-brand-ink/75">
                        {ROLES[check.role]?.label || check.role} ·{' '}
                        {formatDateTime(check.ran_at)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        grade.ok ? 'text-brand-primary-deep' : 'text-red-700'
                      }`}
                    >
                      {grade.ok
                        ? `Correcta (${grade.passed}/${grade.total})`
                        : `${grade.failed} con error`}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </>
      )}
    </Card>
  )
}

function sortChecks(list) {
  const order = Object.fromEntries(ROLE_IDS.map((id, index) => [id, index]))
  return [...list].sort(
    (a, b) =>
      (order[a.role] ?? 9) - (order[b.role] ?? 9) ||
      String(a.email).localeCompare(String(b.email), 'es'),
  )
}

export function RoleTests() {
  const { session } = useApp()
  const isAdmin = can(session?.role, 'settings:write')
  const [checks, setChecks] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  // Sube tras guardar una prueba propia, para releer la lista.
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!isAdmin || !canProbe) return undefined
    let cancelled = false
    storage
      .listRoleChecks()
      .then((list) => {
        if (cancelled) return
        setChecks(sortChecks(list))
        setLoadError('')
      })
      .catch((issue) => {
        console.error('[qrsuite] no se pudieron leer las pruebas', issue)
        if (!cancelled) {
          setLoadError(
            'No se pudieron leer las pruebas. Si acabas de actualizar la plataforma, falta publicar las reglas de Firestore.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [isAdmin, version])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pruebas de roles"
        info="Comprueba que las reglas de Firestore aplican los permisos de cada rol."
      />

      {!canProbe ? (
        <Notice>
          En modo local no hay reglas de Firestore que probar: los permisos solo
          los aplica la interfaz.
        </Notice>
      ) : (
        <>
          <AutomaticCheck
            session={session}
            onSaved={() => setVersion((value) => value + 1)}
          />
          {isAdmin ? (
            <AccountEvidence
              checks={checks}
              loaded={loaded}
              error={loadError}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
