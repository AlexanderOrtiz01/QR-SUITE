import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { createProject } from '../lib/schema.js'
import { scansLabel } from '../lib/format.js'
import { can } from '../lib/roles.js'
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
} from '../components/ui.jsx'
import { Tooltip } from '../components/Tooltip.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { IconTrash } from '../components/icons.jsx'

export function Projects() {
  const { projects, qrs, addProject, removeProject, notify, session } = useApp()
  const allowed = can(session?.role, 'project:write')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  // El alta queda plegada tras un botón; sin proyectos se muestra directamente.
  const [formOpen, setFormOpen] = useState(false)
  const showForm = allowed && (formOpen || projects.length === 0)
  const pendingCodes = pendingDelete
    ? qrs.filter((qr) => qr.project_id === pendingDelete.id)
    : []
  const pendingScans = pendingCodes.reduce(
    (sum, qr) => sum + (qr.total_scans || 0),
    0,
  )

  function confirmDelete() {
    removeProject(pendingDelete.id)
    notify(`Proyecto «${pendingDelete.name}» eliminado.`)
    setPendingDelete(null)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!allowed || !name.trim()) return
    addProject(
      createProject({
        name: name.trim(),
        department: department.trim(),
        createdBy: session?.email,
      }),
    )
    setName('')
    setDepartment('')
    setFormOpen(false)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Proyectos"
        info="Un proyecto agrupa los códigos de un libro o asignatura."
      >
        {allowed && projects.length > 0 ? (
          <Button
            data-tour="projects-new"
            variant={formOpen ? 'secondary' : 'primary'}
            aria-expanded={formOpen}
            aria-controls="nuevo-proyecto"
            onClick={() => setFormOpen((open) => !open)}
          >
            {formOpen ? 'Cancelar' : 'Nuevo proyecto'}
          </Button>
        ) : null}
      </PageHeader>

      {showForm ? (
        <Card id="nuevo-proyecto">
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <Field label="Nombre">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Matemáticas 1.º Bachillerato"
                autoFocus={formOpen}
                required
              />
            </Field>
            <Field label="Departamento">
              <Input
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                placeholder="Ciencias Exactas"
              />
            </Field>
            <Button type="submit">Crear</Button>
          </form>
        </Card>
      ) : null}

      {projects.length === 0 ? (
        <EmptyState
          title="Todavía no hay proyectos"
          description={
            allowed
              ? 'Todo código QR pertenece a un proyecto.'
              : 'Solo un administrador puede crearlos.'
          }
        />
      ) : (
        <div
          data-tour="projects-grid"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {projects.map((project) => {
            const count = qrs.filter(
              (qr) => qr.project_id === project.id,
            ).length
            return (
              <Card
                key={project.id}
                className="flex flex-col justify-between gap-3"
              >
                <div>
                  <p className="font-medium break-words">{project.name}</p>
                  <Tooltip content={`Creado por ${project.created_by}`}>
                    <p className="text-sm text-brand-ink/75">
                      {[
                        project.department,
                        `${count} ${count === 1 ? 'código' : 'códigos'}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/codigos?proyecto=${project.id}`}
                    className="flex-1"
                  >
                    <Button variant="secondary" className="w-full">
                      Ver códigos
                    </Button>
                  </Link>
                  {allowed ? (
                    <IconButton
                      label="Eliminar proyecto"
                      icon={IconTrash}
                      variant="danger"
                      onClick={() => setPendingDelete(project)}
                    />
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {pendingDelete ? (
        <ConfirmDialog
          title={`¿Eliminar «${pendingDelete.name}»?`}
          confirmLabel="Eliminar para siempre"
          cancelLabel="Conservar"
          tone="danger"
          typeToConfirm={pendingCodes.length > 0 ? pendingDelete.name : ''}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        >
          {pendingCodes.length > 0 ? (
            <p>
              También se eliminarán{' '}
              <strong>
                {pendingCodes.length === 1
                  ? '1 código'
                  : `${pendingCodes.length} códigos`}
              </strong>{' '}
              y <strong>{scansLabel(pendingScans)}</strong>. Los libros impresos
              con esos códigos dejarán de funcionar para siempre.
            </p>
          ) : (
            <p>Este proyecto no tiene códigos.</p>
          )}
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
