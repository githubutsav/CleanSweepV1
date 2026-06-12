import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const portVal = env.Frontend_port || env.FRONTEND_PORT || env.VITE_FRONTEND_PORT || env.VITE_PORT
  const port = portVal ? Number(portVal) : 3000

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port,
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Modern Rolldown chunk-splitting configuration
          advancedChunks: {
            groups: [
              {
                name: 'react-vendor',
                test: /\/node_modules\/(react|react-dom|react-router-dom)\//,
              },
              {
                name: 'supabase-vendor',
                test: /\/node_modules\/@supabase\/@supabase-js\//,
              },
              {
                name: 'map-vendor',
                test: /\/node_modules\/(leaflet|react-leaflet)\//,
              },
              {
                name: 'store-vendor',
                test: /\/node_modules\/zustand\//,
              }
            ]
          }
        },
      },
    },
  }
})

