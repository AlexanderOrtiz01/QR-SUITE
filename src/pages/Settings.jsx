import { useState } from 'react'
import { useApp } from '../store/useApp.js'
import { can } from '../lib/roles.js'
import { storage } from '../lib/storage/index.js'
import { usingFallbackDomain } from '../lib/shortUrl.js'
import { isAuthEnabled } from '../lib/auth.js'
import { ALLOWED_DOMAIN } from '../lib/config.js'
import {
  Banner,
  Button,
  Card,
  CardTitle,
  Field,
  Input,
  PageHeader,
} from '../components/ui.jsx'
import { RoleManager } from '../components/RoleManager.jsx'

export function Settings() {
  const { settings, saveSettings, session, loadDemoData } = useApp()
  const allowed = can(session?.role, 'settings:write')
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [seeded, setSeeded] = useState(0)
  const [clearing, setClearing] = useState(false)

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
      <PageHeader title="Ajustes" />

      {!allowed ? (
        <Banner tone="warning">
          Solo lectura: requiere rol Administrador.
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
            label="Página para códigos deprecados"
            hint="Adónde llevan los QR en estado Deprecado."
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
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit">Guardar</Button>
              {saved ? (
                <span className="text-sm text-brand-primary">Guardado</span>
              ) : null}
            </div>
          ) : null}
        </form>
      </Card>

      <Card className="space-y-3">
        <CardTitle info="El dominio permitido y las credenciales se configuran en .env.local (a partir de .env.example), no aquí: deciden quién entra.">
          Integración
        </CardTitle>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-brand-ink/80">Almacenamiento</dt>
            <dd className="text-brand-ink">{storage.label}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-brand-ink/80">Dominio corto</dt>
            <dd className="text-brand-ink">
              {usingFallbackDomain
                ? 'Ruta /r/ de esta app'
                : import.meta.env.VITE_SHORT_DOMAIN}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-brand-ink/80">Autenticación</dt>
            <dd className={isAuthEnabled ? 'text-brand-ink' : 'text-red-700'}>
              {isAuthEnabled
                ? 'Firebase Auth (Google)'
                : 'Simulada: no protege nada'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-brand-ink/80">Dominio permitido</dt>
            <dd className="text-brand-ink">@{ALLOWED_DOMAIN}</dd>
          </div>
        </dl>
      </Card>

      {allowed ? <RoleManager currentEmail={session?.email} /> : null}

      {allowed ? (
        <Card className="space-y-3">
          <CardTitle info="Un proyecto con cinco recursos y treinta días de escaneos simulados, para revisar la analítica. Se guarda solo en este navegador.">
            Datos de demostración
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setSeeded(loadDemoData().scans.length)}
            >
              Generar datos de ejemplo
            </Button>
            {seeded ? (
              <span className="text-sm text-brand-primary">
                +{seeded} escaneos
              </span>
            ) : null}
          </div>
        </Card>
      ) : null}

      {allowed ? (
        <Card className="space-y-3">
          <CardTitle info="Borra proyectos, códigos y escaneos guardados en este navegador. No se puede deshacer.">
            <span className="text-red-700">Zona de riesgo</span>
          </CardTitle>
          <Button
            variant="danger"
            loading={clearing}
            onClick={async () => {
              setClearing(true)
              await storage.clear()
              window.location.reload()
            }}
          >
            {clearing ? 'Borrando…' : 'Borrar datos locales'}
          </Button>
        </Card>
      ) : null}
    </div>
  )
}
