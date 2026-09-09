import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppContext } from './context.js'
import { storage } from '../lib/storage/index.js'
import { createScan } from '../lib/schema.js'
import { detectBrowser, detectOs } from '../lib/userAgent.js'

const DEFAULT_SETTINGS = {
  orgName: 'Organización',
  allowedDomain: import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || 'clases.edu',
  deprecatedUrl: '',
}

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [projects, setProjects] = useState([])
  const [qrs, setQrs] = useState([])
  const [scans, setScans] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [session, setSession] = useState(null)

  useEffect(() => {
    let cancelled = false
    storage.loadAll().then((data) => {
      if (cancelled) return
      setProjects(data.projects || [])
      setQrs(data.qrs || [])
      setScans(data.scans || [])
      setSettings({ ...DEFAULT_SETTINGS, ...(data.settings || {}) })
      setSession(data.session || null)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Persistencia: cada colección se vuelca en cuanto cambia, nunca antes de
  // que haya terminado la carga inicial (evita pisar los datos con vacíos).
  useEffect(() => {
    if (ready) storage.saveProjects(projects)
  }, [ready, projects])

  useEffect(() => {
    if (ready) storage.saveQrs(qrs)
  }, [ready, qrs])

  useEffect(() => {
    if (ready) storage.saveScans(scans)
  }, [ready, scans])

  useEffect(() => {
    if (ready) storage.saveSettings(settings)
  }, [ready, settings])

  useEffect(() => {
    if (ready) storage.saveSession(session)
  }, [ready, session])

  const addProject = useCallback((project) => {
    setProjects((current) => [project, ...current])
  }, [])

  const updateProject = useCallback((id, patch) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === id ? { ...project, ...patch } : project,
      ),
    )
  }, [])

  const removeProject = useCallback((id) => {
    setProjects((current) => current.filter((project) => project.id !== id))
    setQrs((current) => current.filter((qr) => qr.project_id !== id))
  }, [])

  const addQr = useCallback((qr) => {
    setQrs((current) => [qr, ...current])
  }, [])

  const updateQr = useCallback((shortCode, patch) => {
    setQrs((current) =>
      current.map((qr) =>
        qr.short_code === shortCode
          ? { ...qr, ...patch, updated_at: new Date().toISOString() }
          : qr,
      ),
    )
  }, [])

  const removeQr = useCallback((shortCode) => {
    setQrs((current) => current.filter((qr) => qr.short_code !== shortCode))
    setScans((current) =>
      current.filter((scan) => scan.short_code !== shortCode),
    )
  }, [])

  /** Registra un escaneo. Lo llamará la Cloud Function cuando exista Fase 2. */
  const recordScan = useCallback((shortCode) => {
    const scan = createScan({
      shortCode,
      deviceOs: detectOs(),
      browser: detectBrowser(),
      userAgent: navigator.userAgent,
    })
    setScans((current) => [scan, ...current])
    setQrs((current) =>
      current.map((qr) =>
        qr.short_code === shortCode
          ? { ...qr, total_scans: (qr.total_scans || 0) + 1 }
          : qr,
      ),
    )
    return scan
  }, [])

  const value = useMemo(
    () => ({
      ready,
      projects,
      qrs,
      scans,
      settings,
      session,
      addProject,
      updateProject,
      removeProject,
      addQr,
      updateQr,
      removeQr,
      recordScan,
      setSettings,
      setSession,
    }),
    [
      ready,
      projects,
      qrs,
      scans,
      settings,
      session,
      addProject,
      updateProject,
      removeProject,
      addQr,
      updateQr,
      removeQr,
      recordScan,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
