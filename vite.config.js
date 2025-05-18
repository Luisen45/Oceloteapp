import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Oceloteapp/',   // ← Nombre EXACTO del repo
  plugins: [react()],
})
