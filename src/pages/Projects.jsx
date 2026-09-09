import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { createProject } from '../lib/schema.js'
import { can } from '../lib/roles.js'
import { Button, Card, EmptyState, Field, Input } from '../components/ui.jsx'

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
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
        <p className="text-sm text-slate-500">
          Un proyecto agrupa los códigos de un libro o asignatura.
        </p>
      </header>

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
        <EmptyState
          title="Sin proyectos"
          description="Crea un proyecto para empezar a organizar los códigos."
        />
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
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-slate-500">
                    {project.department || 'Sin departamento'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {count} {count === 1 ? 'código' : 'códigos'} · creado por{' '}
                    {project.created_by}
                  </p>
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
                    <Button
                      variant="danger"
                      onClick={() => removeProject(project.id)}
                    >
                      Eliminar
                    </Button>
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
