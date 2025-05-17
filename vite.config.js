import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Oceloteapp/',   // ← ¡Pon aquí el nombre EXACTO de tu repositorio entre las barras!
  plugins: [react()],
})
