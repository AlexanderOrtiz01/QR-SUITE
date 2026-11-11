import { useState } from 'react'
import { useApp } from '../store/useApp.js'
import { can } from '../lib/roles.js'
import { isPersistenceShared, storage } from '../lib/storage/index.js'
import { urlIssue } from '../lib/urls.js'
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
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { DestinationField } from '../components/DestinationField.jsx'
import { RoleManager } from '../components/RoleManager.jsx'

export function Settings() {
  const { settings, saveSettings, session, loadDemoData } = useApp()
  const allowed = can(session?.role, 'settings:write')
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [seeded, setSeeded] = useState(0)
  const [clearing, setClearing] = useState(false)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [attempted, setAttempted] = useState(false)

  function patch(next) {
    setDraft((current) => ({ ...current, ...next }))
    setSaved(false)
  }

  function handleSave(event) {
    event.preventDefault()
    if (urlIssue(draft.deprecatedUrl)) {
      setAttempted(true)
      return
    }
    saveSettings({ ...draft, deprecatedUrl: draft.deprecatedUrl.trim() })
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
        <form noValidate onSubmit={handleSave} className="space-y-4">
          <Field label="Nombre de la organización">
            <Input
              value={draft.orgName}
              disabled={!allowed}
              onChange={(event) => patch({ orgName: event.target.value })}
            />
          </Field>
          <DestinationField
            label="Página para códigos retirados"
            hint="Adónde lleva un código cuando lo retiras. Sin ella no se puede retirar ninguno."
            value={draft.deprecatedUrl}
            disabled={!allowed}
            showError={attempted}
            onChange={(deprecatedUrl) => patch({ deprecatedUrl })}
            placeholder="https://clases.edu.sv/edicion-actualizada"
          />
          {allowed ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit">Guardar</Button>
              {saved ? (
                <span className="text-sm text-brand-primary-deep">
                  Guardado
                </span>
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

      {/* Solo sin Firestore: con la base compartida, los datos de ejemplo se
          mezclarían con los reales y borrar vaciaría la base de todo el equipo. */}
      {allowed && !isPersistenceShared ? (
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
              <span className="text-sm text-brand-primary-deep">
                +{seeded} escaneos
              </span>
            ) : null}
          </div>
        </Card>
      ) : null}

      {allowed && !isPersistenceShared ? (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 basis-56">
            <h2 className="font-semibold text-red-700">Zona de riesgo</h2>
            <p className="text-sm text-brand-ink/75">
              Vacía los proyectos, códigos y escaneos de este navegador.
            </p>
          </div>
          <Button
            variant="danger"
            loading={clearing}
            onClick={() => setConfirmingClear(true)}
          >
            {clearing ? 'Borrando…' : 'Borrar datos locales'}
          </Button>
        </Card>
      ) : null}

      {confirmingClear ? (
        <ConfirmDialog
          title="¿Borrar los datos de este navegador?"
          confirmLabel="Borrar datos"
          cancelLabel="Conservar"
          tone="danger"
          onConfirm={async () => {
            setConfirmingClear(false)
            setClearing(true)
            await storage.clear()
            window.location.reload()
          }}
          onCancel={() => setConfirmingClear(false)}
        >
          <p>
            Se perderán todos los proyectos, códigos y escaneos guardados aquí.
            No se puede deshacer.
          </p>
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
