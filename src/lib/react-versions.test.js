import { version as reactVersion } from 'react'
import { version as reactDomVersion } from 'react-dom'
import { describe, expect, it } from 'vitest'

// Si react y react-dom no están en la misma versión, React aborta el arranque
// y producción queda en blanco. El lint y el build no lo detectan porque el
// fallo solo aparece al ejecutar; esta prueba lo lleva al CI.
describe('dependencias de React', () => {
  it('react y react-dom están en la misma versión', () => {
    expect(reactDomVersion).toBe(reactVersion)
  })
})
