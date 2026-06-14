import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const portVal = env.Frontend_port || env.FRONTEND_PORT || env.VITE_FRONTEND_PORT || env.VITE_PORT
  const port = portVal ? Number(portVal) : 8000

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
        // Raise Workbox precache limit to 5 MB to accommodate large bundles
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        manifest: {
          name: 'CleanSweep',
          short_name: 'CleanSweep',
          description: 'Report illegal garbage dumping in your city using AI-powered photo verification.',
          start_url: '/',
          display: 'standalone',
          background_color: '#0f172a',
          theme_color: '#05ffa3',
          icons: [
            {
              src: 'pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    server: {
      port,
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Modern Rolldown code-splitting (replaces deprecated advancedChunks)
          codeSplitting: {
            groups: [
              {
                name: 'react-vendor',
                test: /\/node_modules\/(react|react-dom|react-router-dom)\//,
              },
              {
                name: 'supabase-vendor',
                test: /\/node_modules\/@supabase\//,
              },
              {
                name: 'map-vendor',
                test: /\/node_modules\/(leaflet|react-leaflet)\//,
              },
              {
                name: 'three-vendor',
                test: /\/node_modules\/(three|globe\.gl)\//,
              },
              {
                name: 'store-vendor',
                test: /\/node_modules\/zustand\//,
              },
            ],
          },
        },
      },
    },
  }
})
