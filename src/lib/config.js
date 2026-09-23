/**
 * Configuración tomada del entorno.
 *
 * El dominio permitido se fija aquí y no en los ajustes editables: es la
 * comprobación que decide quién entra al panel, y no debe poder cambiarla
 * desde la interfaz quien ya está dentro.
 */
export const ALLOWED_DOMAIN =
  import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || 'clases.edu.sv'
