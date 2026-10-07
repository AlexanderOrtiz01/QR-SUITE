import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { createProject } from '../lib/schema.js'
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
import { IconTrash } from '../components/icons.jsx'

export function Projects() {
  const { projects, qrs, addProject, removeProject, session } = useApp()
  const allowed = can(session?.role, 'project:write')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')

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
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proyectos"
        info="Un proyecto agrupa los códigos de un libro o asignatura."
      />

      {allowed ? (
        <Card>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <Field label="Nombre">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Matemáticas 1.º Bachillerato"
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
        <EmptyState title="Sin proyectos" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                  <p className="text-sm text-brand-ink/65">
                    {project.department || 'Sin departamento'}
                  </p>
                  <Tooltip content={`Creado por ${project.created_by}`}>
                    <p className="mt-2 text-xs text-brand-ink/65">
                      {count} {count === 1 ? 'código' : 'códigos'}
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
                      onClick={() => removeProject(project.id)}
                    />
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
