/**
 * Configuración fija de la aplicación.
 *
 * El dominio permitido se fija aquí y no en los ajustes editables ni en el
 * entorno: es la comprobación que decide quién entra al panel, y no debe poder
 * cambiarla desde la interfaz quien ya está dentro ni una variable de
 * despliegue. Debe coincidir con la comprobación de `signedIn()` en
 * firestore.rules, que es la frontera real.
 */
export const ALLOWED_DOMAIN = 'clases.edu.sv'
