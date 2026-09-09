import { useState } from 'react'
import { useApp } from '../store/useApp.js'
import { can } from '../lib/roles.js'
import { storage } from '../lib/storage/index.js'
import { usingFallbackDomain } from '../lib/shortUrl.js'
import { Banner, Button, Card, Field, Input } from '../components/ui.jsx'

export function Settings() {
  const { settings, saveSettings, session, loadDemoData, scans } = useApp()
  const allowed = can(session?.role, 'settings:write')
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [seeded, setSeeded] = useState(0)

  function patch(next) {
    setDraft((current) => ({ ...current, ...next }))
    setSaved(false)
  }

  function handleSave(event) {
    event.preventDefault()
    saveSettings(draft)
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-sm text-slate-500">
          Configuración institucional de la plataforma
        </p>
      </header>

      {!allowed ? (
        <Banner tone="warning">
          Solo un administrador puede modificar estos ajustes.
        </Banner>
      ) : null}

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Nombre de la organización">
            <Input
              value={draft.orgName}
              disabled={!allowed}
              onChange={(event) => patch({ orgName: event.target.value })}
            />
          </Field>
          <Field
            label="Dominio de correo permitido"
            hint="Restringe el acceso al panel. La comprobación real la hará Firebase Auth."
          >
            <Input
              value={draft.allowedDomain}
              disabled={!allowed}
              onChange={(event) => patch({ allowedDomain: event.target.value })}
            />
          </Field>
          <Field
            label="Página de aviso para códigos deprecados"
            hint="Destino de los QR cuyo estado es Deprecado."
          >
            <Input
              type="url"
              value={draft.deprecatedUrl}
              disabled={!allowed}
              onChange={(event) => patch({ deprecatedUrl: event.target.value })}
              placeholder="https://clases.edu.sv/edicion-actualizada"
            />
          </Field>
          {allowed ? (
            <div className="flex items-center gap-3">
              <Button type="submit">Guardar</Button>
              {saved ? (
                <span className="text-sm text-emerald-600">Guardado</span>
              ) : null}
            </div>
          ) : null}
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Estado de la integración</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Almacenamiento</dt>
            <dd className="text-ssf-charcoal">{storage.label}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Dominio corto</dt>
            <dd className="text-ssf-charcoal">
              {usingFallbackDomain
                ? 'Ruta /r/ de esta app'
                : import.meta.env.VITE_SHORT_DOMAIN}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Autenticación</dt>
            <dd className="text-amber-700">Simulada (falta Firebase Auth)</dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500">
          Configura estas piezas en <code>.env.local</code> a partir de{' '}
          <code>.env.example</code>.
        </p>
      </Card>

      {allowed ? (
        <Card className="space-y-3">
          <h2 className="font-semibold">Datos de demostración</h2>
          <p className="text-sm text-slate-600">
            Genera un proyecto con cinco recursos y treinta días de escaneos
            simulados, para revisar la analítica sin tener que escanear códigos
            uno a uno. Se guarda solo en este navegador y se elimina con el
            botón de borrado de abajo.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setSeeded(loadDemoData().scans.length)}
            >
              Generar datos de ejemplo
            </Button>
            {seeded ? (
              <span className="text-sm text-emerald-600">
                {seeded} escaneos añadidos ({scans.length} en total)
              </span>
            ) : null}
          </div>
        </Card>
      ) : null}

      {allowed ? (
        <Card className="space-y-3">
          <h2 className="font-semibold text-red-700">Zona de riesgo</h2>
          <p className="text-sm text-slate-600">
            Borra proyectos, códigos y escaneos guardados en este navegador. No
            se puede deshacer.
          </p>
          <Button
            variant="danger"
            onClick={async () => {
              await storage.clear()
              window.location.reload()
            }}
          >
            Borrar todos los datos locales
          </Button>
        </Card>
      ) : null}
    </div>
  )
}
