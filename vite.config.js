import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        // Las dependencias cambian mucho menos que la app: en bloques propios,
        // un despliegue que solo toca pantallas no invalida su caché.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/](firebase|@firebase)[\\/]/.test(id)) return 'firebase'
          if (/[\\/]qr-code-styling[\\/]/.test(id)) return 'qr-code'
          if (
            /[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(
              id,
            )
          ) {
            return 'react'
          }
          return undefined
        },
      },
    },
  },
})
