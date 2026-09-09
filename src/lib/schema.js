/**
 * Fábricas de documentos. Los nombres de campo replican el esquema de
 * Firestore descrito en el plan de desarrollo, para que migrar el adaptador
 * de almacenamiento no obligue a tocar las pantallas.
 */
import { DEFAULT_STYLE } from './brand.js'

export const QR_STATUS = {
  draft: {
    id: 'draft',
    label: 'Borrador',
    hint: 'Redirige a la vista previa interna',
  },
  published: {
    id: 'published',
    label: 'Publicado',
    hint: 'Redirige a la versión pública oficial',
  },
  deprecated: {
    id: 'deprecated',
    label: 'Deprecado',
    hint: 'Redirige al aviso de edición actualizada',
  },
}

export const RESOURCE_TAGS = [
  'Video',
  'PDF',
  'Audio',
  'Evaluación',
  'Enlace',
  'Actividad',
]

function nowIso() {
  return new Date().toISOString()
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
}

export function createProject({ name, department = '', createdBy }) {
  return {
    id: randomId('proj'),
    name,
    department,
    created_by: createdBy,
    created_at: nowIso(),
  }
}

export function createQr({
  shortCode,
  projectId,
  title,
  targetUrl,
  draftUrl = '',
  status = 'draft',
  tags = [],
  style = DEFAULT_STYLE,
  createdBy,
}) {
  return {
    short_code: shortCode,
    project_id: projectId,
    title,
    target_url: targetUrl,
    draft_url: draftUrl,
    status,
    tags,
    style,
    created_by: createdBy,
    created_at: nowIso(),
    updated_at: nowIso(),
    total_scans: 0,
  }
}

export function createScan({
  shortCode,
  deviceOs,
  browser,
  userAgent,
  ipHash = '',
}) {
  return {
    id: randomId('scan'),
    short_code: shortCode,
    timestamp: nowIso(),
    device_os: deviceOs,
    browser,
    user_agent: userAgent,
    ip_hash: ipHash,
  }
}

/**
 * Resuelve el destino real de un QR según su estado. Es la lógica que más
 * adelante ejecutará la Cloud Function de redirección.
 */
export function resolveTarget(qr, settings) {
  if (!qr) return null
  if (qr.status === 'draft') return qr.draft_url || qr.target_url || null
  if (qr.status === 'deprecated') return settings?.deprecatedUrl || null
  return qr.target_url || null
}
