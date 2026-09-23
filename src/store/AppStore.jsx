import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppContext } from './context.js'
import { storage } from '../lib/storage/index.js'
import {
  hasActiveUser,
  observeSession,
  signOut as authSignOut,
} from '../lib/auth.js'
import { createScan } from '../lib/schema.js'
import { buildDemoData } from '../lib/demoData.js'
import { detectBrowser, detectOs } from '../lib/userAgent.js'
import { ALLOWED_DOMAIN } from '../lib/config.js'

const DEFAULT_SETTINGS = {
  orgName: 'Organización',
  allowedDomain: ALLOWED_DOMAIN,
  deprecatedUrl: '',
}

export function AppProvider({ children }) {
  // Dos esperas distintas: los datos y la sesión. El panel no puede decidir si
  // mostrar el login hasta que Firebase haya terminado de restaurar la sesión,
  // o parpadearía en cada recarga.
  const [dataReady, setDataReady] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [projects, setProjects] = useState([])
  const [qrs, setQrs] = useState([])
  const [scans, setScans] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [session, setSession] = useState(null)
  const [authError, setAuthError] = useState('')

  const fetchAll = useCallback(async () => {
    // Sin sesión, las colecciones del panel no son legibles. Preguntar de
    // todos modos solo produciría un rechazo de Firestore en la consola.
    if (!hasActiveUser()) {
      return { projects: [], qrs: [], scans: [], settings: DEFAULT_SETTINGS }
    }
    const data = await storage.loadAll()
    return {
      projects: data.projects || [],
      qrs: data.qrs || [],
      scans: data.scans || [],
      settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
    }
  }, [])

  const applyAll = useCallback((data) => {
    setProjects(data.projects)
    setQrs(data.qrs)
    setScans(data.scans)
    setSettings(data.settings)
  }, [])

  const reload = useCallback(
    () => fetchAll().then(applyAll),
    [fetchAll, applyAll],
  )

  useEffect(() => {
    let cancelled = false
    fetchAll()
      .then((data) => {
        if (!cancelled) applyAll(data)
      })
      .catch((error) => {
        console.error('[qrsuite] fallo al cargar los datos', error)
      })
      .finally(() => {
        if (!cancelled) setDataReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [fetchAll, applyAll])

  // Al entrar hay que releer: la primera carga ocurrió sin sesión y, con las
  // reglas puestas, no devolvió nada.
  const sessionEmail = session?.email || ''
  useEffect(() => {
    if (!sessionEmail) return
    let cancelled = false
    fetchAll()
      .then((data) => {
        if (!cancelled) applyAll(data)
      })
      .catch((error) => {
        console.error('[qrsuite] fallo al recargar tras entrar', error)
      })
    return () => {
      cancelled = true
    }
  }, [sessionEmail, fetchAll, applyAll])

  // La sesión la gobierna Firebase Auth: el observador la restaura al recargar
  // y la limpia cuando caduca el token.
  useEffect(() => {
    return observeSession(ALLOWED_DOMAIN, ({ session: next, error }) => {
      setSession(next)
      setAuthError(error)
      setAuthReady(true)
    })
  }, [])

  /**
   * Toda escritura actualiza primero el estado local y después persiste. Si la
   * persistencia falla se recarga desde el origen: es preferible que la
   * pantalla dé un salto a que muestre datos que nunca se guardaron.
   */
  const persist = useCallback(
    async (operation) => {
      try {
        await operation()
      } catch (error) {
        console.error('[qrsuite] fallo al guardar', error)
        await reload().catch(() => {})
      }
    },
    [reload],
  )

  const addProject = useCallback(
    (project) => {
      setProjects((current) => [project, ...current])
      persist(() => storage.addProject(project))
    },
    [persist],
  )

  const removeProject = useCallback(
    (id) => {
      const orphaned = new Set(
        qrs.filter((qr) => qr.project_id === id).map((qr) => qr.short_code),
      )
      setProjects((current) => current.filter((project) => project.id !== id))
      setQrs((current) => current.filter((qr) => qr.project_id !== id))
      setScans((current) =>
        current.filter((scan) => !orphaned.has(scan.short_code)),
      )
      persist(() => storage.removeProject(id))
    },
    [persist, qrs],
  )

  const addQr = useCallback(
    (qr) => {
      setQrs((current) => [qr, ...current])
      persist(() => storage.addQr(qr))
    },
    [persist],
  )

  const updateQr = useCallback(
    (shortCode, patch) => {
      const stamped = { ...patch, updated_at: new Date().toISOString() }
      setQrs((current) =>
        current.map((qr) =>
          qr.short_code === shortCode ? { ...qr, ...stamped } : qr,
        ),
      )
      persist(() => storage.updateQr(shortCode, stamped))
    },
    [persist],
  )

  const removeQr = useCallback(
    (shortCode) => {
      setQrs((current) => current.filter((qr) => qr.short_code !== shortCode))
      setScans((current) =>
        current.filter((scan) => scan.short_code !== shortCode),
      )
      persist(() => storage.removeQr(shortCode))
    },
    [persist],
  )

  /**
   * Registra un escaneo. Lo hará la Cloud Function en la Fase 2; mientras
   * tanto lo escribe el navegador que abre la URL corta, que por eso necesita
   * permiso de creación en la colección `scans`.
   */
  const recordScan = useCallback(
    (shortCode) => {
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
      persist(() => storage.addScan(scan))
      return scan
    },
    [persist],
  )

  const saveSettings = useCallback(
    (next) => {
      setSettings(next)
      persist(() => storage.saveSettings(next))
    },
    [persist],
  )

  /**
   * Carga un juego de datos de ejemplo para poder evaluar la analítica sin
   * escanear códigos a mano. Se añade a lo que ya haya, no lo reemplaza.
   */
  const loadDemoData = useCallback(() => {
    const demo = buildDemoData({ createdBy: session?.email })
    setProjects((current) => [demo.project, ...current])
    setQrs((current) => [...demo.qrs, ...current])
    setScans((current) => [...demo.scans, ...current])
    persist(() =>
      storage.seed({
        projects: [demo.project],
        qrs: demo.qrs,
        scans: demo.scans,
      }),
    )
    return demo
  }, [persist, session])

  const signOut = useCallback(async () => {
    await authSignOut()
    setSession(null)
  }, [])

  const ready = dataReady && authReady

  const value = useMemo(
    () => ({
      ready,
      projects,
      qrs,
      scans,
      settings,
      session,
      authError,
      setAuthError,
      addProject,
      removeProject,
      addQr,
      updateQr,
      removeQr,
      recordScan,
      saveSettings,
      loadDemoData,
      reload,
      signOut,
    }),
    [
      ready,
      projects,
      qrs,
      scans,
      settings,
      session,
      authError,
      addProject,
      removeProject,
      addQr,
      updateQr,
      removeQr,
      recordScan,
      saveSettings,
      loadDemoData,
      reload,
      signOut,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
