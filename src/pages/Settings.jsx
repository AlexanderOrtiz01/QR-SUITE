import { useState } from 'react'
import { useApp } from '../store/useApp.js'
import { can } from '../lib/roles.js'
import { isPersistenceShared, storage } from '../lib/storage/index.js'
import { urlIssue } from '../lib/urls.js'
import { usingFallbackDomain } from '../lib/shortUrl.js'
import { isAuthEnabled } from '../lib/auth.js'
import { ALLOWED_DOMAIN } from '../lib/config.js'
import { DEMO_DEPARTMENT } from '../lib/demoData.js'
import {
  Banner,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
} from '../components/ui.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { DestinationField } from '../components/DestinationField.jsx'
import { RoleManager } from '../components/RoleManager.jsx'
import { IconChevronLeft } from '../components/icons.jsx'

/**
 * Sección plegable para lo que se consulta o usa pocas veces. `open` solo
 * fija cómo arranca; luego la abre y cierra quien la usa.
 */
function Section({ title, open = false, children }) {
  return (
    <details open={open} className="glass group rounded-[1.75rem] p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl max-lg:min-h-11 [&::-webkit-details-marker]:hidden">
        <h2 className="font-semibold">{title}</h2>
        <IconChevronLeft className="size-5 shrink-0 -rotate-90 text-brand-ink/75 transition-transform duration-200 ease-ios group-open:rotate-90" />
      </summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  )
}

export function Settings() {
  const { settings, saveSettings, session, projects, saving, loadDemoData } =
    useApp()
  const allowed = can(session?.role, 'settings:write')
  const demoLoaded = projects.some(
    (project) => project.department === DEMO_DEPARTMENT,
  )
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [confirmingDemo, setConfirmingDemo] = useState(false)
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
    <div className="space-y-8">
      <PageHeader title="Ajustes" />

      {!allowed ? (
        <Banner tone="warning">
          Solo lectura: requiere rol Administrador.
        </Banner>
      ) : null}

      <Card data-tour="settings-org">
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
            hint="Adónde lleva un código retirado. Sin ella no se puede retirar ninguno."
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

      {allowed ? <RoleManager currentEmail={session?.email} /> : null}

      {/* Sin autenticación real se abre de entrada: avisa de que nada está
          protegido. */}
      <Section title="Integración" open={!isAuthEnabled}>
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
        <p className="text-xs text-brand-ink/75">
          Se configura en .env.local (a partir de .env.example), no aquí.
        </p>
      </Section>

      {allowed ? (
        <Section
          title={
            isPersistenceShared ? 'Demostración' : 'Datos de este navegador'
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-sm font-semibold">Datos de prueba</p>
              <p className="text-sm text-brand-ink/75">
                {demoLoaded
                  ? `Ya están cargados. Para quitarlos, elimina en Proyectos los marcados «${DEMO_DEPARTMENT}».`
                  : 'Tres proyectos con doce códigos y 30 días de escaneos.'}
              </p>
            </div>
            <Button
              variant="secondary"
              disabled={demoLoaded || saving}
              onClick={() =>
                isPersistenceShared ? setConfirmingDemo(true) : loadDemoData()
              }
            >
              Generar
            </Button>
          </div>
          {/* Solo sin Firestore: con la base compartida, borrar vaciaría los
              datos de todo el equipo. */}
          {!isPersistenceShared ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-ink/8 pt-4">
              <div className="min-w-0 flex-1 basis-56">
                <p className="text-sm font-semibold text-red-700">
                  Borrar datos locales
                </p>
                <p className="text-sm text-brand-ink/75">
                  Proyectos, códigos y escaneos.
                </p>
              </div>
              <Button
                variant="danger"
                loading={clearing}
                onClick={() => setConfirmingClear(true)}
              >
                {clearing ? 'Borrando…' : 'Borrar'}
              </Button>
            </div>
          ) : null}
        </Section>
      ) : null}

      {confirmingDemo ? (
        <ConfirmDialog
          title="¿Cargar datos de prueba?"
          confirmLabel="Cargar datos"
          onConfirm={() => {
            setConfirmingDemo(false)
            loadDemoData()
          }}
          onCancel={() => setConfirmingDemo(false)}
        >
          <p>
            Se añadirán a la base compartida y los verá todo el equipo. Para
            quitarlos, elimina sus proyectos en Proyectos.
          </p>
        </ConfirmDialog>
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
