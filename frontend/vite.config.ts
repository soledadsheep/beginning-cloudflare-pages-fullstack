import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const certPath = path.resolve(__dirname, 'certs', 'vite-local.pfx')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      pfx: fs.readFileSync(certPath),
      passphrase: 'vite-local',
    },
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
